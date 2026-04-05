/**
 * ATP Ultra Content Seed - Populates milestones, badges, sprint data, leaderboard
 * Run: node scripts/seed-content.mjs
 */

const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";

const headers = {
  "Content-Type": "application/json",
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "Prefer": "return=representation",
};

async function rpc(path, body, method = "POST") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  FAIL ${method} ${path}:`, res.status, text.substring(0, 200));
    return null;
  }
  return res.json();
}

async function main() {
  console.log("=== ATP Ultra Content Seed ===\n");

  // Get existing data references
  const tiers = await rpc("tiers?select=id,tier_key", null, "GET");
  const tierMap = {};
  for (const t of tiers) tierMap[t.tier_key] = t.id;

  const users = await rpc("user_profiles?select=id,first_name,role_id&is_active=eq.true", null, "GET");
  const roles = await rpc("roles?select=id,role_key", null, "GET");
  const roleMap = {};
  for (const r of roles) roleMap[r.role_key] = r.id;

  const students = users.filter(u => u.role_id === roleMap.user);
  const allUserIds = users.map(u => u.id);

  // 1. Journey Milestones
  console.log("1. Seeding journey milestones...");
  const milestones = [
    { title: "Complete your profile", sort_order: 1, is_active: true },
    { title: "Watch your first lesson", sort_order: 2, is_active: true },
    { title: "Complete Phase 1", sort_order: 3, is_active: true },
    { title: "Join a group call", sort_order: 4, is_active: true },
    { title: "Post in the community", sort_order: 5, is_active: true },
    { title: "Submit your first task", sort_order: 6, is_active: true },
    { title: "Get your resale certificate", sort_order: 7, is_active: true },
    { title: "Contact your first brand", sort_order: 8, is_active: true },
    { title: "Get your first brand approved", sort_order: 9, is_active: true },
    { title: "Create your first PO", sort_order: 10, is_active: true },
  ];
  const createdMilestones = await rpc("journey_milestones", milestones);
  if (createdMilestones) {
    console.log(`  Created ${createdMilestones.length} milestones`);
    // Mark some milestones complete for active students
    if (students.length > 0 && createdMilestones.length > 0) {
      const studentMilestones = [];
      // Student 1 (Alex): 5 milestones done
      for (let i = 0; i < 5; i++) {
        studentMilestones.push({ user_id: students[0].id, milestone_id: createdMilestones[i].id });
      }
      // Student 2 (Sarah): 3 milestones done
      for (let i = 0; i < 3; i++) {
        studentMilestones.push({ user_id: students[1].id, milestone_id: createdMilestones[i].id });
      }
      // Student 3 (Marcus): 1 milestone done
      studentMilestones.push({ user_id: students[2].id, milestone_id: createdMilestones[0].id });
      await rpc("user_journey_milestones", studentMilestones);
      console.log(`  Assigned ${studentMilestones.length} milestone completions`);
    }
  } else {
    console.log("  Milestones may already exist or table doesn't exist yet");
  }

  // 2. Achievement Badges
  console.log("\n2. Seeding achievement badges...");
  const badges = [
    { badge_key: "first_login", badge_name: "Welcome Aboard", description: "Logged in for the first time", icon_emoji: "👋", tier: "bronze", category: "onboarding", requirement_type: "first_login", points_value: 10, auto_award: true, is_active: true },
    { badge_key: "profile_complete", badge_name: "Identity Established", description: "Completed your profile", icon_emoji: "🪪", tier: "bronze", category: "onboarding", requirement_type: "onboarding_complete", points_value: 20, auto_award: true, is_active: true },
    { badge_key: "first_task", badge_name: "First Steps", description: "Completed your first task", icon_emoji: "🎯", tier: "bronze", category: "learning", requirement_type: "task_completion_percent", requirement_value: { percent: 1 }, points_value: 25, auto_award: true, is_active: true },
    { badge_key: "phase_1_complete", badge_name: "Foundation Builder", description: "Completed Phase 1", icon_emoji: "🏗️", tier: "silver", category: "learning", requirement_type: "task_completion_percent", requirement_value: { percent: 15 }, points_value: 50, auto_award: true, is_active: true },
    { badge_key: "halfway", badge_name: "Halfway Hero", description: "Completed 50% of all tasks", icon_emoji: "⚡", tier: "gold", category: "learning", requirement_type: "task_completion_percent", requirement_value: { percent: 50 }, points_value: 100, auto_award: true, is_active: true },
    { badge_key: "streak_7", badge_name: "Week Warrior", description: "7-day login streak", icon_emoji: "🔥", tier: "silver", category: "consistency", requirement_type: "login_streak", requirement_value: { days: 7 }, points_value: 50, auto_award: true, is_active: true },
    { badge_key: "streak_30", badge_name: "Unstoppable", description: "30-day login streak", icon_emoji: "💎", tier: "gold", category: "consistency", requirement_type: "login_streak", requirement_value: { days: 30 }, points_value: 200, auto_award: true, is_active: true },
    { badge_key: "community_first", badge_name: "Social Butterfly", description: "Posted your first community message", icon_emoji: "💬", tier: "bronze", category: "community", requirement_type: "first_login", points_value: 15, auto_award: false, is_active: true },
    { badge_key: "quiz_ace", badge_name: "Quiz Ace", description: "Passed your first quiz", icon_emoji: "📝", tier: "silver", category: "learning", requirement_type: "quiz_passed", requirement_value: { count: 1 }, points_value: 50, auto_award: true, is_active: true },
    { badge_key: "all_complete", badge_name: "Graduate", description: "Completed 100% of all tasks", icon_emoji: "🎓", tier: "platinum", category: "special", requirement_type: "task_completion_percent", requirement_value: { percent: 100 }, points_value: 500, auto_award: true, is_active: true },
  ];
  const createdBadges = await rpc("achievement_badges", badges);
  if (createdBadges) {
    console.log(`  Created ${createdBadges.length} badges`);
    // Award some badges to active students
    const badgeAwards = [];
    const badgeMap = {};
    for (const b of createdBadges) badgeMap[b.badge_key] = b.id;

    if (students.length >= 3) {
      // Alex: first_login, profile_complete, first_task, streak_7
      for (const key of ["first_login", "profile_complete", "first_task", "streak_7"]) {
        if (badgeMap[key]) badgeAwards.push({ user_id: students[0].id, badge_id: badgeMap[key] });
      }
      // Sarah: first_login, first_task
      for (const key of ["first_login", "first_task"]) {
        if (badgeMap[key]) badgeAwards.push({ user_id: students[1].id, badge_id: badgeMap[key] });
      }
      // Marcus: first_login
      if (badgeMap["first_login"]) badgeAwards.push({ user_id: students[2].id, badge_id: badgeMap["first_login"] });
    }
    if (badgeAwards.length > 0) {
      await rpc("user_achievement_badges", badgeAwards);
      console.log(`  Awarded ${badgeAwards.length} badges to students`);
    }
  }

  // 3. Sprint Phases & Tasks (My Plan / Roadmap)
  console.log("\n3. Seeding sprint phases and tasks...");
  const sprintPhases = [
    { title: "Week 1: Foundation", day_start: 1, day_end: 7, goal_text: "Set up your business infrastructure", completion_banner_text: "Foundation complete! You're ready to start sourcing.", sort_order: 1 },
    { title: "Week 2: Sourcing & Tools", day_start: 8, day_end: 14, goal_text: "Master the tools and start finding brands", completion_banner_text: "Tools mastered! Time to reach out to brands.", sort_order: 2 },
    { title: "Week 3: Brand Outreach", day_start: 15, day_end: 21, goal_text: "Contact brands and secure your first accounts", completion_banner_text: "Amazing! You have brands in your pipeline.", sort_order: 3 },
    { title: "Week 4: First PO", day_start: 22, day_end: 30, goal_text: "Create and submit your first purchase order", completion_banner_text: "Congratulations! You've submitted your first PO!", sort_order: 4 },
  ];
  const createdSprintPhases = await rpc("sprint_phases", sprintPhases);
  if (createdSprintPhases) {
    console.log(`  Created ${createdSprintPhases.length} sprint phases`);

    const sprintTasks = [];
    const sp = createdSprintPhases;

    // Week 1 tasks
    sprintTasks.push(
      { phase_id: sp[0].id, day_number: 1, title: "Get your resale certificate", sort_order: 1, success_metrics: "Certificate received or application submitted", common_mistakes: "Using personal address instead of business address" },
      { phase_id: sp[0].id, day_number: 2, title: "Set up business email & domain", sort_order: 2, success_metrics: "Professional email working (you@yourbusiness.com)", common_mistakes: "Using Gmail instead of custom domain" },
      { phase_id: sp[0].id, day_number: 3, title: "Register with Dun & Bradstreet", sort_order: 3, success_metrics: "DUNS number received", common_mistakes: "Skipping this step - many brands require it" },
      { phase_id: sp[0].id, day_number: 4, title: "Set up prep center account", sort_order: 4, success_metrics: "Account active with prep center", common_mistakes: "Not comparing prep center pricing" },
      { phase_id: sp[0].id, day_number: 5, title: "Install required software (SmartScout, Keepa)", sort_order: 5, success_metrics: "All tools installed and accounts active", common_mistakes: "Not setting up Keepa alerts" },
    );

    // Week 2 tasks
    sprintTasks.push(
      { phase_id: sp[1].id, day_number: 8, title: "SmartScout brand research walkthrough", sort_order: 1, success_metrics: "Found 20+ potential brands using filters", common_mistakes: "Setting BSR filter too tight" },
      { phase_id: sp[1].id, day_number: 9, title: "Keepa analysis deep dive", sort_order: 2, success_metrics: "Can read Keepa graphs and identify buying opportunities", common_mistakes: "Ignoring seasonal trends" },
      { phase_id: sp[1].id, day_number: 10, title: "Build your first brand list (50 brands)", sort_order: 3, success_metrics: "Spreadsheet with 50 researched brands", common_mistakes: "Not tracking contact info alongside brand data" },
      { phase_id: sp[1].id, day_number: 12, title: "Product profitability calculator practice", sort_order: 4, success_metrics: "Can calculate ROI, margin, and break-even for any product", common_mistakes: "Forgetting to include prep costs and Amazon fees" },
    );

    // Week 3 tasks
    sprintTasks.push(
      { phase_id: sp[2].id, day_number: 15, title: "Write cold email templates", sort_order: 1, success_metrics: "3 email templates ready (intro, follow-up, re-engagement)", common_mistakes: "Too long - keep under 150 words" },
      { phase_id: sp[2].id, day_number: 16, title: "Set up email outreach tool", sort_order: 2, success_metrics: "Outreach tool configured with templates loaded", common_mistakes: "Not warming up email domain first" },
      { phase_id: sp[2].id, day_number: 17, title: "Send first 20 outreach emails", sort_order: 3, success_metrics: "20 personalized emails sent to brands", common_mistakes: "Copy-pasting without personalization" },
      { phase_id: sp[2].id, day_number: 19, title: "Follow up on non-responders", sort_order: 4, success_metrics: "Follow-up emails sent to all non-responders", common_mistakes: "Waiting too long - follow up within 3-5 days" },
    );

    // Week 4 tasks
    sprintTasks.push(
      { phase_id: sp[3].id, day_number: 22, title: "Negotiate terms with approved brand", sort_order: 1, success_metrics: "Price list received with payment terms agreed", common_mistakes: "Accepting first price without negotiating" },
      { phase_id: sp[3].id, day_number: 24, title: "Create your first Purchase Order", sort_order: 2, is_checkpoint: true, success_metrics: "PO created with correct quantities and pricing", common_mistakes: "Ordering too much on first PO - start with test order" },
      { phase_id: sp[3].id, day_number: 26, title: "Submit PO and arrange shipping", sort_order: 3, success_metrics: "PO submitted to brand, shipping to prep center arranged", common_mistakes: "Not confirming delivery timeline" },
      { phase_id: sp[3].id, day_number: 30, title: "Review and plan next month", sort_order: 4, is_final: true, success_metrics: "Month 1 review complete, Month 2 goals set", common_mistakes: "Not reflecting on what worked and what didn't" },
    );

    const createdTasks = await rpc("sprint_tasks", sprintTasks);
    if (createdTasks) {
      console.log(`  Created ${createdTasks.length} sprint tasks`);

      // Add some completions for active students
      if (students.length >= 2) {
        const completions = [];
        // Alex: completed first 6 sprint tasks
        for (let i = 0; i < Math.min(6, createdTasks.length); i++) {
          completions.push({
            user_id: students[0].id,
            task_id: createdTasks[i].id,
            status: "completed",
            completed: true,
            completed_at: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
            task_day: createdTasks[i].day_number,
          });
        }
        // Sarah: completed first 3
        for (let i = 0; i < Math.min(3, createdTasks.length); i++) {
          completions.push({
            user_id: students[1].id,
            task_id: createdTasks[i].id,
            status: "completed",
            completed: true,
            completed_at: new Date(Date.now() - (3 - i) * 86400000).toISOString(),
            task_day: createdTasks[i].day_number,
          });
        }
        await rpc("sprint_task_completions", completions);
        console.log(`  Created ${completions.length} sprint task completions`);
      }
    }
  } else {
    console.log("  Sprint tables may not exist - check if sprint_phases table was created by migrations");
  }

  // 4. Refresh leaderboard cache
  console.log("\n4. Refreshing leaderboard cache...");
  // Add some points for students so leaderboard isn't empty
  const points = [];
  if (students.length >= 3) {
    points.push(
      { user_id: students[0].id, points: 200, activity_type: "task_completion", activity_description: "Completed Phase 1 tasks" },
      { user_id: students[0].id, points: 50, activity_type: "login_streak", activity_description: "7-day streak bonus" },
      { user_id: students[1].id, points: 100, activity_type: "task_completion", activity_description: "Completed early tasks" },
      { user_id: students[2].id, points: 25, activity_type: "task_completion", activity_description: "First task completed" },
    );
    await rpc("user_points", points);
    console.log(`  Added ${points.length} point records`);
  }

  // Refresh leaderboard via RPC
  const lbResult = await rpc("rpc/refresh_leaderboard_cache", {});
  if (lbResult !== null) {
    console.log("  Leaderboard cache refreshed");
  } else {
    console.log("  Leaderboard refresh failed (may need to call manually)");
  }

  // 5. Add a calendar call
  console.log("\n5. Seeding calendar events...");
  const adminUser = users.find(u => u.role_id === roleMap.mega_admin);
  if (adminUser) {
    const tomorrow = new Date(Date.now() + 86400000);
    const nextWeek = new Date(Date.now() + 7 * 86400000);
    await rpc("calendar_calls", [
      {
        title: "Weekly Group Coaching Call",
        description: "Join us for our weekly strategy session. Bring your questions!",
        call_date: tomorrow.toISOString().split('T')[0],
        call_time: "14:00",
        timezone: "America/New_York",
        call_link: "https://meet.google.com/test-dev-call",
        is_recurring: false,
        created_by: adminUser.id,
        is_active: true,
        visible_tier_ids: [tierMap.all],
      },
      {
        title: "Brand Outreach Workshop",
        description: "Live workshop on cold email strategies that actually work.",
        call_date: nextWeek.toISOString().split('T')[0],
        call_time: "11:00",
        timezone: "America/New_York",
        call_link: "https://meet.google.com/test-workshop",
        is_recurring: false,
        created_by: adminUser.id,
        is_active: true,
        visible_tier_ids: [tierMap.all],
      },
    ]);
    console.log("  Created 2 calendar events");
  }

  // 6. Add an announcement
  console.log("\n6. Seeding announcement...");
  if (adminUser) {
    await rpc("announcements", [{
      title: "Welcome to ATP Ultra Dev!",
      content: "This is a test environment. Feel free to explore all features.",
      is_pinned: true,
      created_by: adminUser.id,
      visible_tier_ids: [tierMap.all],
    }]);
    console.log("  Created 1 announcement");
  }

  // 7. Update community channels to add read_only and pin fields if they exist
  console.log("\n7. Verifying community channels...");
  const channels = await rpc("community_channels?select=id,name", null, "GET");
  console.log(`  Found ${channels?.length || 0} channels`);

  console.log("\n=== CONTENT SEED COMPLETE ===");
  console.log("\nThe app should now show:");
  console.log("  - Home: milestones, badges, leaderboard, streak, calendar events");
  console.log("  - My Plan: 4-week sprint with tasks and progress");
  console.log("  - Community: channels with direct message support (moderation bypassed for dev)");
  console.log("\nRefresh the app to see changes.");
}

main().catch(console.error);
