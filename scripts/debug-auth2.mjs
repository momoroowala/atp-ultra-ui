const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";
const h = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Prefer": "return=representation" };

async function main() {
  // List auth users to verify they exist
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=10`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` },
  });
  const authData = await authRes.json();
  console.log("Auth users:", authData.users?.length);
  for (const u of (authData.users || [])) {
    console.log(`  ${u.email} (${u.id}) confirmed: ${!!u.email_confirmed_at}`);
  }

  // Check profiles with service role (bypasses RLS)
  const profiles = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,user_email,role_id,tier_id&limit=10`, {
    headers: { ...h, "apikey": KEY, "Authorization": `Bearer ${KEY}` },
  }).then(r => r.json());
  console.log("\nProfiles found:", Array.isArray(profiles) ? profiles.length : "ERROR:", JSON.stringify(profiles).substring(0, 200));

  if (Array.isArray(profiles)) {
    for (const p of profiles) {
      console.log(`  ${p.user_email} role_id=${p.role_id} tier_id=${p.tier_id}`);
    }
  }

  // Check roles with page_visibility
  const roles = await fetch(`${SUPABASE_URL}/rest/v1/roles?select=role_key,page_visibility`, {
    headers: { ...h },
  }).then(r => r.json());
  console.log("\nRoles page_visibility:");
  if (Array.isArray(roles)) {
    for (const r of roles) {
      console.log(`  ${r.role_key}: csm_panel=${r.page_visibility?.csm_panel}, admin_panel=${r.page_visibility?.admin_panel}`);
    }
  } else {
    console.log("  ERROR:", JSON.stringify(roles).substring(0, 200));
  }

  // Test the joined query the auth hook uses
  if (Array.isArray(profiles) && profiles.length > 0) {
    const mo = profiles.find(p => p.user_email === "mo@test.dev");
    if (mo) {
      const joined = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=role_id,roles(role_key,page_visibility),tier_id,tiers(feature_access,feature_visibility,page_visibility)&id=eq.${mo.id}`, {
        headers: h,
      }).then(r => r.json());
      console.log("\nJoined query for Mo:", JSON.stringify(joined, null, 2));
    }
  }
}

main().catch(console.error);
