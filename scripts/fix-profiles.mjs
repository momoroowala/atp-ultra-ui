const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";
const h = { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Prefer": "return=representation" };

async function get(path) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: h }).then(r => r.json());
}
async function post(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "POST", headers: { ...h, "Prefer": "return=representation,resolution=merge-duplicates" }, body: JSON.stringify(body) });
  if (!r.ok) { console.error(`FAIL ${path}:`, await r.text()); return null; }
  return r.json();
}

async function main() {
  // Get roles and tiers
  const roles = await get("roles?select=id,role_key");
  const tiers = await get("tiers?select=id,tier_key");
  const rm = {}; for (const r of roles) rm[r.role_key] = r.id;
  const tm = {}; for (const t of tiers) tm[t.tier_key] = t.id;

  // Get auth users
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=20`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` },
  });
  const authData = await authRes.json();

  console.log("Creating profiles for", authData.users.length, "users...");

  const userConfigs = {
    "mo@test.dev": { first_name: "Mo", last_name: "Roowala", role_id: rm.mega_admin, tier_id: tm.all },
    "csm@test.dev": { first_name: "Test", last_name: "CSM", role_id: rm.csm, tier_id: tm.all },
    "student1@test.dev": { first_name: "Alex", last_name: "Johnson", role_id: rm.user, tier_id: tm.client_elite },
    "student2@test.dev": { first_name: "Sarah", last_name: "Kim", role_id: rm.user, tier_id: tm.client_elite },
    "student3@test.dev": { first_name: "Marcus", last_name: "Rivera", role_id: rm.user, tier_id: tm.client_elite },
    "student4@test.dev": { first_name: "Priya", last_name: "Patel", role_id: rm.user, tier_id: tm.client_elite },
    "student5@test.dev": { first_name: "Jordan", last_name: "Williams", role_id: rm.user, tier_id: tm.client_elite },
  };

  for (const user of authData.users) {
    const config = userConfigs[user.email];
    if (!config) continue;

    // Insert profile using upsert
    const profile = {
      id: user.id,
      user_email: user.email,
      first_name: config.first_name,
      last_name: config.last_name,
      role_id: config.role_id,
      tier_id: config.tier_id,
      is_active: true,
    };

    const result = await post("user_profiles", [profile]);
    if (result) {
      console.log(`  Created profile: ${user.email} (${user.id})`);
    }
  }

  // Verify profiles exist now
  await new Promise(r => setTimeout(r, 1000));
  const profiles = await get("user_profiles?select=id,user_email,role_id,tier_id");
  console.log(`\nProfiles in DB: ${profiles.length}`);
  for (const p of profiles) {
    console.log(`  ${p.user_email}`);
  }

  // Check that public profiles were synced (trigger should fire)
  const pubProfiles = await get("user_public_profiles?select=id,user_email,first_name");
  console.log(`\nPublic profiles: ${pubProfiles.length}`);

  // Re-verify the auth hook join
  const mo = profiles.find(p => p.user_email === "mo@test.dev");
  if (mo) {
    const joined = await get(`user_profiles?select=role_id,roles(role_key,page_visibility),tier_id,tiers(feature_access,feature_visibility,page_visibility)&id=eq.${mo.id}`);
    console.log("\nMo auth hook result:", JSON.stringify(joined[0], null, 2));
  }

  // Also ensure user_roles entries exist for Mo
  const moUser = authData.users.find(u => u.email === "mo@test.dev");
  if (moUser) {
    await post("user_roles", [{ user_id: moUser.id, role: "mega_admin" }]);
    await post("user_roles", [{ user_id: moUser.id, role: "admin" }]);
    console.log("\nAdded user_roles for Mo");
  }

  // Add more students with varied activity for CSM testing
  console.log("\n--- Adding 8 more students for CSM testing ---");
  const extraStudents = [
    { first: "Emma", last: "Thompson", email: "student6@test.dev" },
    { first: "Liam", last: "Chen", email: "student7@test.dev" },
    { first: "Sofia", last: "Garcia", email: "student8@test.dev" },
    { first: "Noah", last: "Baker", email: "student9@test.dev" },
    { first: "Olivia", last: "Martinez", email: "student10@test.dev" },
    { first: "Ethan", last: "Lee", email: "student11@test.dev" },
    { first: "Ava", last: "Wilson", email: "student12@test.dev" },
    { first: "Mason", last: "Taylor", email: "student13@test.dev" },
  ];

  for (const s of extraStudents) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${KEY}` },
      body: JSON.stringify({ email: s.email, password: "Test1234!", email_confirm: true, user_metadata: {} }),
    });
    if (!res.ok) { console.error(`  Failed to create ${s.email}:`, await res.text()); continue; }
    const userData = await res.json();
    console.log(`  Created auth: ${s.email} (${userData.id})`);

    // Create profile
    await post("user_profiles", [{
      id: userData.id, user_email: s.email,
      first_name: s.first, last_name: s.last,
      role_id: rm.user, tier_id: tm.client_elite, is_active: true,
    }]);
  }

  // Wait for trigger to sync public profiles
  await new Promise(r => setTimeout(r, 2000));

  // Now create varied activity data for all students
  console.log("\n--- Creating varied student activity ---");
  const allStudents = await get("user_profiles?select=id,user_email,first_name&role_id=eq." + rm.user + "&order=user_email.asc");
  console.log(`Total students: ${allStudents.length}`);

  const tasks = await get("tasks?select=id,task_order&is_active=eq.true&order=task_order.asc");
  const course = (await get("courses?select=id&limit=1"))[0];

  for (let i = 0; i < allStudents.length; i++) {
    const s = allStudents[i];
    const daysAgo = [0, 0, 1, 2, 5, 8, 14, 21, 30, 0, 1, 3, 7][i] || 0;
    const tasksCompleted = [6, 4, 3, 2, 1, 1, 0, 0, 0, 5, 3, 2, 0][i] || 0;
    const streak = [15, 8, 5, 3, 1, 0, 0, 0, 0, 12, 4, 2, 0][i] || 0;
    const totalLogins = [60, 35, 20, 12, 5, 3, 1, 0, 0, 50, 18, 10, 0][i] || 0;

    // Task completions
    for (let t = 0; t < Math.min(tasksCompleted, tasks.length); t++) {
      await post("task_responses", [{
        user_id: s.id, task_id: tasks[t].id, status: "completed",
        completed_at: new Date(Date.now() - (tasksCompleted - t) * 86400000).toISOString(),
      }]);
    }

    // Login streaks
    const lastLogin = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
    await post("user_login_streaks", [{
      user_id: s.id, current_streak: streak, longest_streak: Math.max(streak, streak + 3),
      last_login_date: totalLogins > 0 ? lastLogin : null, total_logins: totalLogins,
    }]);

    // Course access
    if (course) {
      await post("user_course_access", [{ user_id: s.id, course_id: course.id }]);
    }

    // Points
    if (tasksCompleted > 0) {
      await post("user_points", [{
        user_id: s.id, points: tasksCompleted * 30 + streak * 5,
        activity_type: "mixed", activity_description: "Dev seed activity",
      }]);
    }

    console.log(`  ${s.first_name}: ${tasksCompleted} tasks, ${streak}-day streak, last seen ${daysAgo}d ago, ${totalLogins} logins`);
  }

  // Refresh leaderboard
  console.log("\nRefreshing leaderboard...");
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_leaderboard_cache`, {
    method: "POST", headers: { ...h }, body: "{}",
  });
  console.log("Done!");

  console.log("\n=== COMPLETE ===");
  console.log("Log out and log back in as mo@test.dev to see CSM panel.");
  console.log("13 students with varied activity levels for CSM testing.");
}

main().catch(console.error);
