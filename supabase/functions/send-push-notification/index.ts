import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://app.abuvthepar.com',
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binaryString = atob(base64 + padding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate ECDH key pair for encryption
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
}

// Derive shared secret using ECDH
async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKeyBytes: Uint8Array
): Promise<ArrayBuffer> {
  // Create a new ArrayBuffer and copy data to avoid SharedArrayBuffer issues
  const buffer = new ArrayBuffer(publicKeyBytes.length);
  new Uint8Array(buffer).set(publicKeyBytes);
  
  const publicKey = await crypto.subtle.importKey(
    'raw',
    buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  return await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );
}

// HKDF function for key derivation
async function hkdf(
  salt: Uint8Array,
  ikm: ArrayBuffer,
  info: Uint8Array,
  length: number
): Promise<ArrayBuffer> {
  // Create a new ArrayBuffer to avoid SharedArrayBuffer issues
  let saltBuffer: ArrayBuffer;
  if (salt.length) {
    saltBuffer = new ArrayBuffer(salt.length);
    new Uint8Array(saltBuffer).set(salt);
  } else {
    saltBuffer = new ArrayBuffer(32);
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    saltBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const prk = await crypto.subtle.sign('HMAC', key, new Uint8Array(ikm));
  
  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info);
  infoWithCounter[info.length] = 1;
  
  const okm = await crypto.subtle.sign('HMAC', prkKey, infoWithCounter);
  return okm.slice(0, length);
}

// Encrypt the payload using aes128gcm
async function encryptPayload(
  payload: string,
  subscriptionPublicKey: string,
  subscriptionAuthKey: string
): Promise<{ ciphertext: Uint8Array; localPublicKey: Uint8Array; salt: Uint8Array }> {
  // Decode subscription keys
  const userPublicKey = base64UrlToUint8Array(subscriptionPublicKey);
  const userAuthKey = base64UrlToUint8Array(subscriptionAuthKey);
  
  // Generate local key pair for ECDH
  const localKeyPair = await generateECDHKeyPair();
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive shared secret
  const sharedSecret = await deriveSharedSecret(localKeyPair.privateKey, userPublicKey);
  
  // Create info for HKDF
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const keyInfo = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: aes128gcm\0'),
    ...new TextEncoder().encode('P-256\0'),
    0, 65, ...userPublicKey,
    0, 65, ...localPublicKey,
  ]);
  const nonceInfo = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: nonce\0'),
    ...new TextEncoder().encode('P-256\0'),
    0, 65, ...userPublicKey,
    0, 65, ...localPublicKey,
  ]);
  
  // Derive PRK (Pseudo Random Key) using auth secret
  const prk = await hkdf(userAuthKey, sharedSecret, authInfo, 32);
  
  // Derive content encryption key and nonce
  const contentKey = await hkdf(salt, prk, keyInfo, 16);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);
  
  // Import the content encryption key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Add padding to payload (required by Web Push)
  const payloadBytes = new TextEncoder().encode(payload);
  const paddingLength = 0; // Minimal padding
  const paddedPayload = new Uint8Array(2 + paddingLength + payloadBytes.length);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2 + paddingLength);
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(nonce), tagLength: 128 },
    aesKey,
    paddedPayload
  );
  
  return {
    ciphertext: new Uint8Array(encrypted),
    localPublicKey,
    salt,
  };
}

// Build the aes128gcm encrypted body
function buildEncryptedBody(
  salt: Uint8Array,
  localPublicKey: Uint8Array,
  ciphertext: Uint8Array
): ArrayBuffer {
  // aes128gcm header: salt (16) + record size (4) + key length (1) + key + ciphertext
  const recordSize = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt, 0);
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);
  
  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header, 0);
  body.set(ciphertext, header.length);
  
  // Return as ArrayBuffer for fetch body
  return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
}

// Create VAPID JWT manually (simplified)
async function createVapidJwt(
  endpoint: string,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  
  // JWT header
  const header = { alg: 'ES256', typ: 'JWT' };
  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  
  // JWT payload
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: 'mailto:support@smarttradingblueprint.com',
  };
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  
  // Signing input
  const signingInput = `${headerB64}.${payloadB64}`;
  
  // Decode the private key and create JWK
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  
  // The VAPID public key is 65 bytes (uncompressed point), first byte is 0x04
  // Extract x and y coordinates (32 bytes each)
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64Url(privateKeyBytes);
  
  // Import private key as JWK
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };
  
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  // Sign
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(signingInput)
  );
  
  // Convert DER signature to raw format (r || s, 64 bytes total)
  const signature = new Uint8Array(signatureBuffer);
  let rawSignature: Uint8Array;
  
  // Check if signature is in DER format (starts with 0x30)
  if (signature[0] === 0x30) {
    // Parse DER format
    const rLength = signature[3];
    const rStart = 4;
    const rEnd = rStart + rLength;
    const sLength = signature[rEnd + 1];
    const sStart = rEnd + 2;
    
    let r = signature.slice(rStart, rEnd);
    let s = signature.slice(sStart, sStart + sLength);
    
    // Remove leading zeros and pad to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    
    rawSignature = new Uint8Array(64);
    rawSignature.set(r, 32 - r.length);
    rawSignature.set(s, 64 - s.length);
  } else {
    // Already in raw format
    rawSignature = signature;
  }
  
  const signatureB64 = uint8ArrayToBase64Url(rawSignature);
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Log request headers for debugging
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { channelId, dmConversationId, senderId, messageContent, messageId } = await req.json();
    
    console.log('Sending push notification:', { channelId, dmConversationId, senderId, messageId });

    // Get sender info
    const { data: senderData } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, user_email')
      .eq('id', senderId)
      .single();

    const senderName = senderData 
      ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || senderData.user_email 
      : 'Someone';

    // Get users to notify based on channel or DM
    let usersToNotify: string[] = [];
    
    if (channelId) {
      // Get channel name
      const { data: channelData } = await supabase
        .from('community_channels')
        .select('name, visible_tier_ids')
        .eq('id', channelId)
        .single();

      // Get all users with matching tiers (excluding sender)
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, tier_id')
        .neq('id', senderId)
        .eq('is_active', true);

      if (users && channelData?.visible_tier_ids) {
        usersToNotify = users
          .filter(u => u.tier_id && channelData.visible_tier_ids.includes(u.tier_id))
          .map(u => u.id);
      }
    } else if (dmConversationId) {
      // Get participants in DM conversation (excluding sender)
      const { data: participants } = await supabase
        .from('community_dm_participants')
        .select('user_id')
        .eq('conversation_id', dmConversationId)
        .neq('user_id', senderId);

      usersToNotify = participants?.map(p => p.user_id) || [];
    }

    if (usersToNotify.length === 0) {
      console.log('No users to notify');
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions for these users
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', usersToNotify);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions to notify`);

    // Get channel or DM name for notification
    let notificationTitle = `New message from ${senderName}`;
    let notificationUrl = '/community';
    
    if (channelId) {
      const { data: channel } = await supabase
        .from('community_channels')
        .select('name')
        .eq('id', channelId)
        .single();
      
      if (channel) {
        notificationTitle = `#${channel.name}: ${senderName}`;
        notificationUrl = `/community/${channelId}`;
      }
    } else if (dmConversationId) {
      notificationTitle = `DM from ${senderName}`;
      notificationUrl = `/1on1s/${dmConversationId}`;
    }

    // Truncate message content
    const truncatedContent = messageContent.length > 100 
      ? messageContent.substring(0, 100) + '...' 
      : messageContent;

    // Build notification payload
    const notificationPayload = JSON.stringify({
      title: notificationTitle,
      body: truncatedContent,
      url: notificationUrl,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        channelId,
        dmConversationId,
        messageId,
      },
    });

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        console.log(`Attempting to send to endpoint: ${sub.endpoint}`);
        
        // Encrypt the payload
        const { ciphertext, localPublicKey, salt } = await encryptPayload(
          notificationPayload,
          sub.p256dh_key,
          sub.auth_key
        );
        
        // Build encrypted body
        const encryptedBody = buildEncryptedBody(salt, localPublicKey, ciphertext);
        
        // Create VAPID JWT
        const vapidJwt = await createVapidJwt(sub.endpoint, vapidPrivateKey, vapidPublicKey);
        
        // Build the Authorization header
        const authHeader = `vapid t=${vapidJwt}, k=${vapidPublicKey}`;
        
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            // Some push services (notably FCM) require the VAPID public key to also be
            // sent via Crypto-Key for the request to be deliverable.
            'Crypto-Key': `p256ecdsa=${vapidPublicKey}`,
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            'Urgency': 'high',
          },
          body: encryptedBody,
        });

        console.log(`Push response: ${response.status} ${response.statusText}`);

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`Notification sent successfully to ${sub.endpoint}`);
        } else if (response.status === 410 || response.status === 404) {
          // Subscription is no longer valid, remove it
          failedEndpoints.push(sub.endpoint);
          console.log(`Removing invalid subscription: ${sub.endpoint}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to send notification: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (error) {
        console.error(`Error sending to ${sub.endpoint}:`, error);
      }
    }

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
    }

    return new Response(
      JSON.stringify({ success: true, notified: successCount, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
