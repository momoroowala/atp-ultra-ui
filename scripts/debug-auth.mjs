const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";
const h = { "apikey": KEY, "Authorization": `Bearer ${KEY}` };

async function main() {
  // 1. Get Mo's profile
  const profiles = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,user_email,role_id,tier_id`, { headers: h }).then(r => r.json());
  console.log("All profiles:", profiles.length);
  const mo = profiles.find(p => p.user_email === "mo@test.dev");
  console.log("Mo profile:", JSON.stringify(mo, null, 2));

  if (!mo) { console.log("Mo not found!"); return; }

  // 2. Check role
  const role = await fetch(`${SUPABASE_URL}/rest/v1/roles?select=*&id=eq.${mo.role_id}`, { headers: h }).then(r => r.json());
  console.log("\nRole:", JSON.stringify(role[0], null, 2));

  // 3. Check the exact auth hook join query
  const joined = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=role_id,roles(role_key,page_visibility),tier_id,tiers(feature_access,feature_visibility,page_visibility)&id=eq.${mo.id}`, { headers: h }).then(r => r.json());
  console.log("\nAuth hook join result:", JSON.stringify(joined, null, 2));

  // 4. Check user_roles table
  const userRoles = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=*&user_id=eq.${mo.id}`, { headers: h }).then(r => r.json());
  console.log("\nuser_roles entries:", JSON.stringify(userRoles, null, 2));
}

main().catch(console.error);
