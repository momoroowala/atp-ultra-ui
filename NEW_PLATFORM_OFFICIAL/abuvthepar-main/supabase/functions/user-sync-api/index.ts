import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate via x-api-key header
    const apiKey = req.headers.get('x-api-key')
    const validApiKey = Deno.env.get('ADMIN_API_KEY')

    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      console.error('❌ Invalid or missing API key')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ API key authenticated')

    // Init admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, first_name, last_name, phone_number, tier_key, role } = await req.json()

    // Validate required fields
    if (!email || !first_name || !last_name || !tier_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: email, first_name, last_name, tier_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📝 Processing user-sync for:', email)

    // Resolve tier_key → tier_id
    const { data: tier, error: tierError } = await supabase
      .from('tiers')
      .select('id, display_name')
      .eq('tier_key', tier_key)
      .single()

    if (tierError || !tier) {
      console.error('❌ Invalid tier_key:', tier_key)
      return new Response(
        JSON.stringify({ success: false, error: `Invalid tier_key: ${tier_key}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve role → role_id (default to "client")
    const roleKey = role || 'client'
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, display_name')
      .eq('role_key', roleKey)
      .single()

    if (roleError || !roleData) {
      console.error('❌ Invalid role:', roleKey)
      return new Response(
        JSON.stringify({ success: false, error: `Invalid role: ${roleKey}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Resolved tier: ${tier.display_name} (${tier.id}), role: ${roleData.display_name} (${roleData.id})`)

    // Check if user exists via the indexed user_profiles.user_email column
    // instead of paginating the full auth user table.
    // user_profiles.id = auth.users.id in this schema.
    const normalizedEmail = email.toLowerCase().trim()
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_email', normalizedEmail)
      .maybeSingle()

    if (profileLookupError) {
      console.error('❌ Error looking up user profile:', profileLookupError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to look up users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingUser = existingProfile ? { id: existingProfile.id as string } : null

    if (existingUser) {
      // USER EXISTS → Update their profile
      console.log(`👤 User exists (${existingUser.id}), updating tier & profile...`)

      const updateData: Record<string, unknown> = {
        tier_id: tier.id,
        role_id: roleData.id,
      }
      if (first_name) updateData.first_name = first_name
      if (last_name) updateData.last_name = last_name
      if (phone_number) updateData.phone = phone_number

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update user profile', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ User profile updated successfully')
      return new Response(
        JSON.stringify({
          success: true,
          action: 'updated',
          message: `User ${email} updated with tier: ${tier.display_name}`,
          data: { user_id: existingUser.id, email, tier: tier.display_name, role: roleData.display_name }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // USER DOESN'T EXIST → Invite
      console.log('🆕 User not found, sending invite...')

      const origin = req.headers.get('origin') || 'https://app.abuvthepar.com'
      const redirectTo = `${origin}/create-new-password`

      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            first_name,
            last_name,
            phone: phone_number || null,
            tier_id: tier.id,
            role_id: roleData.id,
            role: 'member',
          },
          redirectTo,
        }
      )

      if (inviteError) {
        console.error('❌ Invite error:', inviteError)

        if (inviteError.status === 429 || (inviteError as any).code === 'over_email_send_rate_limit') {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit exceeded. Please wait before retrying.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: false, error: inviteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Also upsert profile in case handle_new_user trigger doesn't fire immediately
      if (inviteData?.user?.id) {
        await supabase.from('user_profiles').upsert({
          id: inviteData.user.id,
          user_email: email,
          first_name,
          last_name,
          phone: phone_number || null,
          tier_id: tier.id,
          role_id: roleData.id,
        }, { onConflict: 'id' })
      }

      console.log('✅ Invitation sent successfully')
      return new Response(
        JSON.stringify({
          success: true,
          action: 'invited',
          message: `Invitation sent to ${email}`,
          data: { user_id: inviteData?.user?.id, email, tier: tier.display_name, role: roleData.display_name }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
