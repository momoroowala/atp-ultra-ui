/**
 * ATP Ultra Dev Seed Script
 * Creates: roles, tiers, admin user, CSM user, 5 dummy students, 1 course with phases/tasks
 * Run: node scripts/seed-dev.mjs
 */

const SUPABASE_URL = "https://sfaqexmajpfllctqubbt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXFleG1hanBmbGxjdHF1YmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MDI0NSwiZXhwIjoyMDkwNzU2MjQ1fQ.fkxwRiaxNtuuQzhetl7UmqhseNQczpRGjmKjpAFsgdY";

const headers = {
  "Content-Type": "application/json",
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
};

async function rpc(path, body, method = "POST") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, "Prefer": "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`FAIL ${method} ${path}:`, res.status, text);
    return null;
  }
  const data = await res.json();
  return data;
}

async function createAuthUser(email, password, metadata = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`FAIL create user ${email}:`, res.status, text);
    return null;
  }
  const data = await res.json();
  console.log(`  Created auth user: ${email} (${data.id})`);
  return data;
}

async function main() {
  console.log("=== ATP Ultra Dev Seed ===\n");

  // 1. Create Roles
  console.log("1. Creating roles...");
  const roles = [
    { role_key: "mega_admin", display_name: "Mega Admin", description: "Full platform access", role_order: 1 },
    { role_key: "admin", display_name: "Admin", description: "Administrative access", role_order: 2 },
    { role_key: "csm", display_name: "CSM", description: "Customer Success Manager", role_order: 3 },
    { role_key: "executive", display_name: "Executive", description: "Executive view access", role_order: 4 },
    { role_key: "user", display_name: "Student", description: "Standard student account", role_order: 10 },
  ];
  const createdRoles = await rpc("roles", roles);
  if (!createdRoles) {
    console.log("  Roles may already exist, fetching...");
  }
  const rolesData = await rpc("roles?select=*", null, "GET");
  const roleMap = {};
  for (const r of rolesData) {
    roleMap[r.role_key] = r.id;
    console.log(`  Role: ${r.role_key} -> ${r.id}`);
  }

  // 2. Create Tiers
  console.log("\n2. Creating tiers...");
  const tiers = [
    { tier_key: "all", display_name: "All Access", description: "Universal access tier", tier_order: 0 },
    { tier_key: "client_ultimate", display_name: "Ultimate", description: "Premium tier", tier_order: 1 },
    { tier_key: "client_elite", display_name: "Elite", description: "Standard tier", tier_order: 2 },
    { tier_key: "client_stb", display_name: "STB", description: "Base tier", tier_order: 3 },
  ];
  const createdTiers = await rpc("tiers", tiers);
  if (!createdTiers) {
    console.log("  Tiers may already exist, fetching...");
  }
  const tiersData = await rpc("tiers?select=*", null, "GET");
  const tierMap = {};
  for (const t of tiersData) {
    tierMap[t.tier_key] = t.id;
    console.log(`  Tier: ${t.tier_key} -> ${t.id}`);
  }

  // 3. Create Auth Users + Profiles
  console.log("\n3. Creating users...");

  // Admin user (Mo)
  const admin = await createAuthUser("mo@test.dev", "Test1234!", {
    first_name: "Mo",
    last_name: "Roowala",
    role_id: roleMap.mega_admin,
    tier_id: tierMap.all,
  });

  // CSM user
  const csm = await createAuthUser("csm@test.dev", "Test1234!", {
    first_name: "Test",
    last_name: "CSM",
    role_id: roleMap.csm,
    tier_id: tierMap.all,
  });

  // 5 Dummy students
  const studentNames = [
    { first: "Alex", last: "Johnson" },
    { first: "Sarah", last: "Kim" },
    { first: "Marcus", last: "Rivera" },
    { first: "Priya", last: "Patel" },
    { first: "Jordan", last: "Williams" },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = await createAuthUser(
      `student${i + 1}@test.dev`,
      "Test1234!",
      {
        first_name: studentNames[i].first,
        last_name: studentNames[i].last,
        role_id: roleMap.user,
        tier_id: tierMap.client_elite,
      }
    );
    if (s) students.push(s);
  }

  // Wait for triggers to create profiles
  console.log("\n  Waiting 3s for auth triggers to create profiles...");
  await new Promise(r => setTimeout(r, 3000));

  // 4. Ensure profiles have correct role_id and tier_id
  console.log("\n4. Updating user profiles with correct roles/tiers...");
  if (admin) {
    await rpc(`user_profiles?id=eq.${admin.id}`, { role_id: roleMap.mega_admin, tier_id: tierMap.all }, "PATCH");
    console.log(`  Admin profile updated`);
    // Also add to user_roles for has_role() checks
    await rpc("user_roles", [
      { user_id: admin.id, role: "mega_admin" },
      { user_id: admin.id, role: "admin" },
    ]);
  }
  if (csm) {
    await rpc(`user_profiles?id=eq.${csm.id}`, { role_id: roleMap.csm, tier_id: tierMap.all }, "PATCH");
    console.log(`  CSM profile updated`);
    await rpc("user_roles", [{ user_id: csm.id, role: "admin" }]);
  }
  for (const s of students) {
    await rpc(`user_profiles?id=eq.${s.id}`, { role_id: roleMap.user, tier_id: tierMap.client_elite }, "PATCH");
  }
  console.log(`  ${students.length} student profiles updated`);

  // 5. Create a test course
  console.log("\n5. Creating test course...");
  const courseData = await rpc("courses", [{
    title: "ATP Wholesale Mastery",
    description: "Learn to build a profitable Amazon wholesale business from scratch.",
    course_order: 1,
    is_active: true,
    visible_tier_ids: [tierMap.all],
  }]);
  const courseId = courseData?.[0]?.id;
  if (!courseId) {
    console.log("  Course creation failed or already exists");
  } else {
    console.log(`  Course created: ${courseId}`);

    // Grant course access to all students
    const accessRecords = students.map(s => ({
      user_id: s.id,
      course_id: courseId,
      granted_by: admin?.id,
    }));
    if (admin) accessRecords.push({ user_id: admin.id, course_id: courseId, granted_by: admin.id });
    if (csm) accessRecords.push({ user_id: csm.id, course_id: courseId, granted_by: admin?.id });
    await rpc("user_course_access", accessRecords);
    console.log(`  Course access granted to ${accessRecords.length} users`);

    // Create phases
    const phases = [
      { title: "Phase 1: Founder Setup", description: "Set up your business foundation", phase_order: 1, points: 100, unlock_type: "immediate" },
      { title: "Phase 2: Sourcing Tools", description: "Master SmartScout, Keepa, and DS Quick View", phase_order: 2, points: 150, unlock_type: "completion" },
      { title: "Phase 3: Brand Outreach", description: "Cold email, calling scripts, and AI tools", phase_order: 3, points: 200, unlock_type: "completion" },
    ];
    const createdPhases = [];
    for (const p of phases) {
      const result = await rpc("phases", [{
        ...p,
        course_id: courseId,
        is_active: true,
        visible_tier_ids: [tierMap.all],
        unlock_condition: p.unlock_type === "completion" && createdPhases.length > 0
          ? { phase_id: createdPhases[createdPhases.length - 1], task_unlock_strategy: "sequential" }
          : { task_unlock_strategy: "sequential" },
      }]);
      if (result?.[0]) {
        createdPhases.push(result[0].id);
        console.log(`  Phase: ${p.title} -> ${result[0].id}`);
      }
    }

    // Create tasks for Phase 1
    if (createdPhases[0]) {
      const tasks = [
        { title: "Get Your Resale Certificate", task_order: 1, points: 20 },
        { title: "Set Up Business Address", task_order: 2, points: 20 },
        { title: "Register Domain & Email", task_order: 3, points: 20 },
        { title: "Set Up Dun & Bradstreet", task_order: 4, points: 20 },
        { title: "Install Required Software", task_order: 5, points: 20 },
      ];
      for (const t of tasks) {
        await rpc("tasks", [{
          ...t,
          phase_id: createdPhases[0],
          is_active: true,
          visible_tier_ids: [tierMap.all],
        }]);
      }
      console.log(`  Created ${tasks.length} tasks for Phase 1`);
    }

    // Create tasks for Phase 2
    if (createdPhases[1]) {
      const tasks = [
        { title: "SmartScout Walkthrough", task_order: 1, points: 30 },
        { title: "Keepa Deep Dive", task_order: 2, points: 30 },
        { title: "DS Quick View Setup", task_order: 3, points: 30 },
      ];
      for (const t of tasks) {
        await rpc("tasks", [{
          ...t,
          phase_id: createdPhases[1],
          is_active: true,
          visible_tier_ids: [tierMap.all],
        }]);
      }
      console.log(`  Created ${tasks.length} tasks for Phase 2`);
    }

    // Create tasks for Phase 3
    if (createdPhases[2]) {
      const tasks = [
        { title: "Cold Email Templates", task_order: 1, points: 40 },
        { title: "Calling Scripts & Practice", task_order: 2, points: 40 },
        { title: "AI Outreach Tools", task_order: 3, points: 40 },
      ];
      for (const t of tasks) {
        await rpc("tasks", [{
          ...t,
          phase_id: createdPhases[2],
          is_active: true,
          visible_tier_ids: [tierMap.all],
        }]);
      }
      console.log(`  Created ${tasks.length} tasks for Phase 3`);
    }
  }

  // 6. Create a community channel
  console.log("\n6. Creating community channel...");
  if (admin) {
    await rpc("community_channels", [{
      name: "General",
      description: "General discussion for all students",
      icon_emoji: "💬",
      is_active: true,
      created_by: admin.id,
      visible_tier_ids: [tierMap.all],
    }]);
    await rpc("community_channels", [{
      name: "Wins & Success Stories",
      description: "Share your wins and celebrate together",
      icon_emoji: "🏆",
      is_active: true,
      created_by: admin.id,
      visible_tier_ids: [tierMap.all],
    }]);
    console.log("  Created 2 community channels");
  }

  // 7. Create some task progress for students (simulate activity)
  console.log("\n7. Simulating student activity...");
  const tasksResult = await rpc("tasks?select=id,task_order&phase_id=eq." + (courseData?.[0] ? "not.is.null" : "null") + "&order=task_order.asc&limit=11", null, "GET");

  // Actually fetch tasks properly
  const allTasks = await rpc("tasks?select=id,task_order,phase_id&is_active=eq.true&order=task_order.asc", null, "GET");

  if (allTasks && students.length > 0) {
    // Student 1: completed 4 tasks (active learner)
    for (let i = 0; i < Math.min(4, allTasks.length); i++) {
      await rpc("task_responses", [{
        user_id: students[0].id,
        task_id: allTasks[i].id,
        status: "completed",
        completed_at: new Date(Date.now() - (4 - i) * 86400000).toISOString(),
      }]);
    }
    console.log(`  ${studentNames[0].first}: 4 tasks completed`);

    // Student 2: completed 2 tasks (moderate)
    for (let i = 0; i < Math.min(2, allTasks.length); i++) {
      await rpc("task_responses", [{
        user_id: students[1].id,
        task_id: allTasks[i].id,
        status: "completed",
        completed_at: new Date(Date.now() - (2 - i) * 86400000).toISOString(),
      }]);
    }
    console.log(`  ${studentNames[1].first}: 2 tasks completed`);

    // Student 3: completed 1 task (struggling)
    if (allTasks.length > 0) {
      await rpc("task_responses", [{
        user_id: students[2].id,
        task_id: allTasks[0].id,
        status: "completed",
        completed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      }]);
    }
    console.log(`  ${studentNames[2].first}: 1 task completed (7 days ago)`);

    // Students 4 & 5: no progress (at-risk / never started)
    console.log(`  ${studentNames[3].first}: no activity (at-risk)`);
    console.log(`  ${studentNames[4].first}: no activity (at-risk)`);
  }

  // 8. Create login streaks
  console.log("\n8. Creating login streaks...");
  if (students.length >= 3) {
    await rpc("user_login_streaks", [
      { user_id: students[0].id, current_streak: 12, longest_streak: 12, last_login_date: new Date().toISOString().split('T')[0], total_logins: 45 },
      { user_id: students[1].id, current_streak: 3, longest_streak: 8, last_login_date: new Date().toISOString().split('T')[0], total_logins: 20 },
      { user_id: students[2].id, current_streak: 0, longest_streak: 5, last_login_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], total_logins: 10 },
    ]);
    console.log("  Login streaks set for 3 students");
  }

  // Summary
  console.log("\n=== SEED COMPLETE ===");
  console.log("\nTest Accounts:");
  console.log("  Admin:   mo@test.dev / Test1234!");
  console.log("  CSM:     csm@test.dev / Test1234!");
  console.log("  Student: student1@test.dev / Test1234!");
  console.log("  Student: student2@test.dev / Test1234!");
  console.log("  Student: student3@test.dev / Test1234!");
  console.log("  Student: student4@test.dev / Test1234!");
  console.log("  Student: student5@test.dev / Test1234!");
  console.log("\nYou can now run: npm run dev");
}

main().catch(console.error);
