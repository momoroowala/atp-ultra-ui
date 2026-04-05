const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";
const h = { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "return=representation" };

async function post(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text(); console.error(`  FAIL ${path}:`, t.substring(0, 150)); return null; }
  return r.json();
}
async function get(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: h });
  return r.json();
}

async function main() {
  // Badges
  console.log("1. Inserting badges...");
  const badges = [
    { badge_key: "first_login", badge_name: "Welcome Aboard", description: "Logged in for the first time", icon_emoji: "👋", tier: "bronze", category: "onboarding", requirement_type: "first_login", requirement_value: null, points_value: 10, auto_award: true, is_active: true },
    { badge_key: "first_task", badge_name: "First Steps", description: "Completed your first task", icon_emoji: "🎯", tier: "bronze", category: "learning", requirement_type: "task_completion_percent", requirement_value: { percent: 1 }, points_value: 25, auto_award: true, is_active: true },
    { badge_key: "streak_7", badge_name: "Week Warrior", description: "7-day login streak", icon_emoji: "🔥", tier: "silver", category: "consistency", requirement_type: "login_streak", requirement_value: { days: 7 }, points_value: 50, auto_award: true, is_active: true },
    { badge_key: "streak_30", badge_name: "Unstoppable", description: "30-day login streak", icon_emoji: "💎", tier: "gold", category: "consistency", requirement_type: "login_streak", requirement_value: { days: 30 }, points_value: 200, auto_award: true, is_active: true },
    { badge_key: "halfway", badge_name: "Halfway Hero", description: "Completed 50% of all tasks", icon_emoji: "⚡", tier: "gold", category: "learning", requirement_type: "task_completion_percent", requirement_value: { percent: 50 }, points_value: 100, auto_award: true, is_active: true },
    { badge_key: "graduate", badge_name: "Graduate", description: "Completed 100% of tasks", icon_emoji: "🎓", tier: "platinum", category: "special", requirement_type: "task_completion_percent", requirement_value: { percent: 100 }, points_value: 500, auto_award: true, is_active: true },
  ];
  let bc = 0;
  for (const b of badges) { if (await post("achievement_badges", [b])) bc++; }
  console.log(`  ${bc} badges created`);

  // Sprint tasks
  console.log("2. Inserting sprint tasks...");
  const phases = await get("sprint_phases?select=id,sort_order&order=sort_order.asc");
  if (phases.length === 0) { console.log("  No sprint phases found!"); return; }

  const taskDefs = [
    [0, 1, "Get your resale certificate", 1],
    [0, 2, "Set up business email & domain", 2],
    [0, 3, "Register with Dun & Bradstreet", 3],
    [0, 4, "Set up prep center account", 4],
    [0, 5, "Install required software", 5],
    [1, 8, "SmartScout brand research", 1],
    [1, 9, "Keepa analysis deep dive", 2],
    [1, 10, "Build first brand list (50 brands)", 3],
    [1, 12, "Profitability calculator practice", 4],
    [2, 15, "Write cold email templates", 1],
    [2, 17, "Send first 20 outreach emails", 2],
    [2, 19, "Follow up on non-responders", 3],
    [3, 22, "Negotiate terms with brand", 1],
    [3, 24, "Create your first PO", 2],
    [3, 26, "Submit PO and arrange shipping", 3],
    [3, 30, "Review month and plan next", 4],
  ];
  let tc = 0;
  for (const [pi, day, title, order] of taskDefs) {
    const t = {
      phase_id: phases[pi].id, day_number: day, title, sort_order: order,
      is_checkpoint: title.includes("first PO"), is_final: title.includes("Review month"),
      success_metrics: null, common_mistakes: null, templates: null,
    };
    if (await post("sprint_tasks", [t])) tc++;
  }
  console.log(`  ${tc} sprint tasks created`);

  // Award badges
  console.log("3. Awarding badges to students...");
  const userRole = (await get("roles?select=id&role_key=eq.user"))[0];
  const students = await get(`user_profiles?select=id&role_id=eq.${userRole.id}`);
  const allBadges = await get("achievement_badges?select=id,badge_key");
  const bm = {};
  for (const b of allBadges) bm[b.badge_key] = b.id;

  if (students[0] && bm.first_login) {
    await post("user_achievement_badges", [{ user_id: students[0].id, badge_id: bm.first_login }]);
    if (bm.first_task) await post("user_achievement_badges", [{ user_id: students[0].id, badge_id: bm.first_task }]);
    if (bm.streak_7) await post("user_achievement_badges", [{ user_id: students[0].id, badge_id: bm.streak_7 }]);
  }
  if (students[1] && bm.first_login) {
    await post("user_achievement_badges", [{ user_id: students[1].id, badge_id: bm.first_login }]);
  }
  console.log("  Badges awarded");

  // Leaderboard
  console.log("4. Refreshing leaderboard...");
  const lbRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_leaderboard_cache`, {
    method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: "{}",
  });
  console.log("  Status:", lbRes.status === 204 ? "OK" : lbRes.status);

  // Calendar
  console.log("5. Seeding calendar events...");
  const adminRole = (await get("roles?select=id&role_key=eq.mega_admin"))[0];
  const admin = (await get(`user_profiles?select=id&role_id=eq.${adminRole.id}&limit=1`))[0];
  const allTier = (await get("tiers?select=id&tier_key=eq.all"))[0];
  if (admin && allTier) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    await post("calendar_calls", [{ title: "Weekly Group Coaching Call", description: "Weekly strategy session", call_date: tomorrow, call_time: "14:00", timezone: "America/New_York", call_link: "https://meet.google.com/test-dev", is_recurring: false, created_by: admin.id, is_active: true, visible_tier_ids: [allTier.id] }]);
    await post("calendar_calls", [{ title: "Brand Outreach Workshop", description: "Cold email strategies", call_date: nextWeek, call_time: "11:00", timezone: "America/New_York", call_link: "https://meet.google.com/test-workshop", is_recurring: false, created_by: admin.id, is_active: true, visible_tier_ids: [allTier.id] }]);
    console.log("  2 events created");
  }

  // Milestone completions for students
  console.log("6. Assigning milestone completions...");
  const milestones = await get("journey_milestones?select=id&order=sort_order.asc");
  if (milestones.length > 0 && students.length > 0) {
    for (let i = 0; i < Math.min(5, milestones.length); i++) {
      await post("user_journey_milestones", [{ user_id: students[0].id, milestone_id: milestones[i].id }]);
    }
    for (let i = 0; i < Math.min(3, milestones.length); i++) {
      await post("user_journey_milestones", [{ user_id: students[1].id, milestone_id: milestones[i].id }]);
    }
    console.log("  Milestones assigned");
  }

  console.log("\nDone! Refresh the app at http://localhost:8081");
}

main().catch(console.error);
