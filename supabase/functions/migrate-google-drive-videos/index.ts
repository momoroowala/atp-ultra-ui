import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

interface MigrationRequest {
  folderId: string;
  bucketName: string;
  targetPath: string;
  skipExisting?: boolean;
}

interface MigrationResult {
  success: boolean;
  summary: {
    totalFiles: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors: Array<{
    fileName: string;
    error: string;
    attempts: number;
  }>;
  uploadedFiles: string[];
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
}

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'video/avi',
  'video/x-msvideo',
  'video/x-matroska',
];

async function getGoogleAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function listVideosFromFolder(
  folderId: string,
  accessToken: string
): Promise<GoogleDriveFile[]> {
  const videos: GoogleDriveFile[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, size)',
      pageSize: '100',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list files: ${error}`);
    }

    const data = await response.json();
    
    // Filter for video files only
    const videoFiles = data.files.filter((file: GoogleDriveFile) =>
      VIDEO_MIME_TYPES.includes(file.mimeType)
    );
    
    videos.push(...videoFiles);
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return videos;
}

function sanitizeFilename(filename: string): string {
  // Remove or replace special characters, keep extension
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function downloadFromGoogleDrive(
  fileId: string,
  accessToken: string,
  maxRetries = 3
): Promise<Blob> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      lastError = error as Error;
      console.error(`Download attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Download failed after retries');
}

async function uploadToSupabase(
  supabase: any,
  bucketName: string,
  filePath: string,
  blob: Blob,
  mimeType: string,
  maxRetries = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      return; // Success
    } catch (error) {
      lastError = error as Error;
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin API key
    const authHeader = req.headers.get('Authorization');
    const adminApiKey = Deno.env.get('ADMIN_API_KEY');
    
    if (!authHeader || !adminApiKey) {
      throw new Error('Missing authentication');
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== adminApiKey) {
      throw new Error('Invalid API key');
    }

    // Parse request
    const { folderId, bucketName, targetPath, skipExisting = true }: MigrationRequest = 
      await req.json();

    if (!folderId || !bucketName || !targetPath) {
      throw new Error('Missing required parameters: folderId, bucketName, targetPath');
    }

    console.log(`Starting migration from folder ${folderId} to ${bucketName}/${targetPath}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError || !buckets?.some(b => b.name === bucketName)) {
      throw new Error(`Bucket '${bucketName}' does not exist`);
    }

    // Get Google Drive access token
    console.log('Getting Google Drive access token...');
    const accessToken = await getGoogleAccessToken();

    // List videos from folder
    console.log('Listing videos from Google Drive folder...');
    const videos = await listVideosFromFolder(folderId, accessToken);
    console.log(`Found ${videos.length} video files`);

    if (videos.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: { totalFiles: 0, successful: 0, failed: 0, skipped: 0 },
          errors: [],
          uploadedFiles: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each video
    const result: MigrationResult = {
      success: true,
      summary: { totalFiles: videos.length, successful: 0, failed: 0, skipped: 0 },
      errors: [],
      uploadedFiles: [],
    };

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const sanitizedName = sanitizeFilename(video.name);
      const filePath = `${targetPath}/${sanitizedName}`;
      
      console.log(`[${i + 1}/${videos.length}] Processing: ${video.name}`);

      try {
        // Check if file already exists
        if (skipExisting) {
          const { data: existingFile } = await supabase.storage
            .from(bucketName)
            .list(targetPath, {
              search: sanitizedName,
            });

          if (existingFile && existingFile.length > 0) {
            console.log(`  ✓ Skipped (already exists): ${filePath}`);
            result.summary.skipped++;
            continue;
          }
        }

        // Download from Google Drive
        console.log(`  ↓ Downloading from Google Drive...`);
        const blob = await downloadFromGoogleDrive(video.id, accessToken);

        // Upload to Supabase Storage
        console.log(`  ↑ Uploading to Supabase Storage...`);
        await uploadToSupabase(supabase, bucketName, filePath, blob, video.mimeType);

        console.log(`  ✓ Success: ${filePath}`);
        result.summary.successful++;
        result.uploadedFiles.push(filePath);
      } catch (error) {
        console.error(`  ✗ Failed: ${video.name}`, error);
        result.summary.failed++;
        result.errors.push({
          fileName: video.name,
          error: (error as Error).message,
          attempts: 3,
        });
        result.success = false;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Total: ${result.summary.totalFiles}`);
    console.log(`Successful: ${result.summary.successful}`);
    console.log(`Failed: ${result.summary.failed}`);
    console.log(`Skipped: ${result.summary.skipped}`);

    return new Response(
      JSON.stringify(result, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 207, // 207 = Multi-Status (partial success)
      }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error).message,
        summary: { totalFiles: 0, successful: 0, failed: 0, skipped: 0 },
        errors: [],
        uploadedFiles: [],
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
