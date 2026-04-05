const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";
const h = { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "return=representation" };

async function get(path) { return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: h }).then(r => r.json()); }
async function post(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
  if (!r.ok) return null;
  return r.json();
}

async function main() {
  const roles = await get("roles?select=id,role_key");
  const tiers = await get("tiers?select=id,tier_key");
  const rm = {}; for (const r of roles) rm[r.role_key] = r.id;
  const tm = {}; for (const t of tiers) tm[t.tier_key] = t.id;
  const course = (await get("courses?select=id&limit=1"))[0];
  const tasks = await get("tasks?select=id,task_order&is_active=eq.true&order=task_order.asc");

  const students = [
    { first: "Emma", last: "Thompson", email: "student6@test.dev", daysAgo: 0, tasksCompleted: 8, streak: 20, logins: 55 },
    { first: "Liam", last: "Chen", email: "student7@test.dev", daysAgo: 1, tasksCompleted: 5, streak: 10, logins: 30 },
    { first: "Sofia", last: "Garcia", email: "student8@test.dev", daysAgo: 3, tasksCompleted: 3, streak: 4, logins: 15 },
    { first: "Noah", last: "Baker", email: "student9@test.dev", daysAgo: 8, tasksCompleted: 2, streak: 0, logins: 8 },
    { first: "Olivia", last: "Martinez", email: "student10@test.dev", daysAgo: 14, tasksCompleted: 1, streak: 0, logins: 4 },
    { first: "Ethan", last: "Lee", email: "student11@test.dev", daysAgo: 21, tasksCompleted: 0, streak: 0, logins: 2 },
    { first: "Ava", last: "Wilson", email: "student12@test.dev", daysAgo: 30, tasksCompleted: 0, streak: 0, logins: 1 },
    { first: "Mason", last: "Taylor", email: "student13@test.dev", daysAgo: 999, tasksCompleted: 0, streak: 0, logins: 0 },
  ];

  // Delete any broken auth users from previous attempt
  const existingAuth = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  }).then(r => r.json());

  for (const s of students) {
    const existing = existingAuth.users?.find(u => u.email === s.email);
    if (existing) {
      // Delete the broken user first
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
        method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
      console.log(`  Cleaned up broken user: ${s.email}`);
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  console.log("Creating 8 students with varied activity...\n");

  for (const s of students) {
    // Create auth user with metadata so trigger creates profile correctly
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        email: s.email, password: "Test1234!", email_confirm: true,
        user_metadata: { first_name: s.first, last_name: s.last, role_id: rm.user, tier_id: tm.client_elite },
      }),
    });
    if (!res.ok) { console.error(`  FAIL auth ${s.email}:`, await res.text()); continue; }
    const user = await res.json();

    // Wait a beat for trigger
    await new Promise(r => setTimeout(r, 500));

    // Ensure profile has correct role/tier (trigger might set it, but let's be sure)
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}`, {
      method: "PATCH", headers: h,
      body: JSON.stringify({ role_id: rm.user, tier_id: tm.client_elite, first_name: s.first, last_name: s.last }),
    });

    // Course access
    if (course) await post("user_course_access", [{ user_id: user.id, course_id: course.id }]);

    // Task completions
    for (let t = 0; t < Math.min(s.tasksCompleted, tasks.length); t++) {
      await post("task_responses", [{
        user_id: user.id, task_id: tasks[t].id, status: "completed",
        completed_at: new Date(Date.now() - (s.tasksCompleted - t) * 86400000).toISOString(),
      }]);
    }

    // Login streak
    const lastLogin = s.logins > 0
      ? new Date(Date.now() - s.daysAgo * 86400000).toISOString().split("T")[0]
      : null;
    await post("user_login_streaks", [{
      user_id: user.id, current_streak: s.streak,
      longest_streak: Math.max(s.streak, s.streak + 3),
      last_login_date: lastLogin, total_logins: s.logins,
    }]);

    // Points
    if (s.tasksCompleted > 0) {
      await post("user_points", [{
        user_id: user.id, points: s.tasksCompleted * 30 + s.streak * 5,
        activity_type: "mixed", activity_description: "Dev seed",
      }]);
    }

    const risk = s.daysAgo >= 14 ? "HIGH" : s.daysAgo >= 7 ? "MEDIUM" : s.daysAgo >= 3 ? "LOW" : "ACTIVE";
    console.log(`  ${s.first} ${s.last}: ${s.tasksCompleted} tasks, ${s.streak}-day streak, last seen ${s.daysAgo}d ago [${risk}]`);
  }

  // Refresh leaderboard
  console.log("\nRefreshing leaderboard...");
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_leaderboard_cache`, {
    method: "POST", headers: h, body: "{}",
  });

  // Verify
  const allProfiles = await get("user_profiles?select=id,user_email,first_name&order=user_email.asc");
  console.log(`\nTotal profiles: ${allProfiles.length}`);
  for (const p of allProfiles) console.log(`  ${p.user_email} - ${p.first_name}`);

  console.log("\nDone! Log out and back in to see all students in CSM panel.");
}

main().catch(console.error);
