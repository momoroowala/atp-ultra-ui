import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'ATP_Ultra_Executive_Summary.pdf');

const GREEN = '#2D8F64';
const RED = '#CC3333';
const ORANGE = '#D97706';
const DARK = '#111111';
const GRAY = '#444444';
const LIGHT_GRAY = '#888888';
const WHITE = '#FFFFFF';

const doc = new PDFDocument({
  size: 'letter',
  margins: { top: 55, bottom: 65, left: 60, right: 60 },
  info: { Title: 'ATP Ultra Platform Audit - Executive Summary', Author: 'ATP Audit Team' },
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const PW = 612 - 60 - 60; // page width minus margins

function hr(color) {
  const y = doc.y;
  doc.save().moveTo(60, y).lineTo(552, y).lineWidth(1.5).strokeColor(color || GREEN).stroke().restore();
  doc.y = y + 12;
}

function heading(text, size) {
  checkSpace(40);
  doc.font('Helvetica-Bold').fontSize(size || 18).fillColor(GREEN).text(text);
  doc.moveDown(0.3);
  hr();
  doc.moveDown(0.2);
}

function subheading(text) {
  checkSpace(30);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text(text);
  doc.moveDown(0.3);
}

function body(text, options) {
  doc.font('Helvetica').fontSize(10).fillColor(options?.color || DARK).text(text, options || {});
  doc.moveDown(0.15);
}

function bodyBold(text, options) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(options?.color || DARK).text(text, options || {});
  doc.moveDown(0.15);
}

function bullet(text, indent) {
  checkSpace(20);
  const x = 60 + (indent || 0);
  const y = doc.y;
  doc.font('Helvetica').fontSize(10).fillColor(DARK);
  doc.text('•', x, y, { width: 12 });
  doc.text(text, x + 14, y, { width: PW - (indent || 0) - 14 });
  doc.moveDown(0.1);
}

function ticket(id, title, status, description) {
  checkSpace(45);
  const y = doc.y;
  const statusColor = status === 'FIXED' ? GREEN : status === 'OPEN' ? RED : ORANGE;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text(`${id}: ${title}`, 60, y, { width: 370 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(statusColor).text(`[${status}]`, 440, y, { width: 100 });
  if (description) {
    doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(description, 60, doc.y, { width: PW });
  }
  doc.moveDown(0.4);
}

function dangerBox(title, text) {
  checkSpace(80);
  const y = doc.y;
  doc.save();
  doc.roundedRect(60, y, PW, 60, 4).fill('#FEF2F2');
  doc.roundedRect(60, y, 4, 60, 2).fill(RED);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(RED).text(title, 75, y + 10, { width: PW - 30 });
  doc.font('Helvetica').fontSize(9).fillColor('#7F1D1D').text(text, 75, y + 28, { width: PW - 30 });
  doc.restore();
  doc.y = y + 70;
}

function statBox(label, value, color) {
  const x = doc.x || 60;
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(24).fillColor(color || GREEN).text(value, x, y, { width: 100 });
  doc.font('Helvetica').fontSize(9).fillColor(LIGHT_GRAY).text(label, x, doc.y, { width: 120 });
  doc.moveDown(0.5);
}

function checkSpace(needed) {
  if (doc.y + (needed || 50) > 690) doc.addPage();
}

// No per-page footers (causes stack overflow with pdfkit event model)

// ============================================================
// PAGE 1: TITLE
// ============================================================
doc.rect(0, 0, 612, 10).fill(GREEN);
doc.moveDown(5);
doc.font('Helvetica-Bold').fontSize(38).fillColor(GREEN).text('ATP Ultra', { align: 'center' });
doc.font('Helvetica-Bold').fontSize(26).fillColor(DARK).text('Platform Audit', { align: 'center' });
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(18).fillColor(GRAY).text('Executive Summary', { align: 'center' });
doc.moveDown(3);
hr();
doc.moveDown(1);

const meta = [
  ['Date', 'April 3, 2026'],
  ['Prepared for', 'Mo Roowala, Backend Fulfillment Operations Lead'],
  ['Platform', 'ATP Ultra — Customer Success + Student LMS'],
  ['Stack', 'React 18 + TypeScript + Vite + Supabase'],
  ['Scale', '1,400+ students, growing to 2,000+'],
  ['Audit Scope', 'Security, Backend, UI/UX, Code Quality, CSM Workflows'],
];
for (const [k, v] of meta) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(GRAY).text(`${k}:`, 60, doc.y, { continued: true, width: 130 });
  doc.font('Helvetica').fontSize(10).fillColor(DARK).text(`  ${v}`);
  doc.moveDown(0.1);
}

doc.moveDown(1.5);
// Findings summary box
const fy = doc.y;
doc.save();
doc.roundedRect(60, fy, PW, 70, 6).fill('#F0FAF5');
doc.font('Helvetica-Bold').fontSize(12).fillColor(GREEN).text('Total Findings: 78 Tickets', 80, fy + 12);
doc.font('Helvetica-Bold').fontSize(10).fillColor(RED).text('18 CRITICAL', 80, fy + 32);
doc.font('Helvetica-Bold').fontSize(10).fillColor(ORANGE).text('26 HIGH', 180, fy + 32);
doc.font('Helvetica-Bold').fontSize(10).fillColor('#6B7280').text('28 MEDIUM', 260, fy + 32);
doc.font('Helvetica-Bold').fontSize(10).fillColor(LIGHT_GRAY).text('6 LOW', 370, fy + 32);
doc.font('Helvetica').fontSize(9).fillColor(GRAY).text('32 fixed (41%)  •  46 remaining  •  7 critical items still open', 80, fy + 50);
doc.restore();
doc.y = fy + 85;

// ============================================================
// PAGE 2: WHY THIS PLATFORM IS NOT PRODUCTION-READY
// ============================================================
doc.addPage();
doc.rect(0, 0, 612, 6).fill(RED);
doc.moveDown(1);
doc.font('Helvetica-Bold').fontSize(22).fillColor(RED).text('CRITICAL: Why This Platform Cannot Go to Production');
doc.moveDown(0.3);
hr(RED);
doc.moveDown(0.3);

body('The following issues represent immediate, exploitable vulnerabilities that would put 1,400+ students\' personal data, financial information, and account security at risk if this platform were deployed as-is.', { color: GRAY });
doc.moveDown(0.5);

dangerBox(
  '⚠ ANYONE CAN ACCESS ANY USER\'S DATA',
  'JWT tokens were parsed without signature verification. An attacker could forge a token with any user ID and access their data, grades, messages, and personal information. Two edge functions (get-dashboard-metrics, get-course-detail) were vulnerable. NOW FIXED.'
);

dangerBox(
  '⚠ SECRETS COMMITTED TO VERSION CONTROL',
  'The .env file was NOT in .gitignore. Supabase anon key, Facebook App ID, and project URL were exposed in git history. The JWT anon key doesn\'t expire until 2086. Even after rotation, the keys exist in git history forever unless scrubbed with BFG.'
);

dangerBox(
  '⚠ ANY WEBSITE CAN CALL YOUR API',
  'All 28 edge functions returned Access-Control-Allow-Origin: *. Any malicious website could make authenticated requests to create users, delete users, reset passwords, and modify data on behalf of logged-in users via CSRF attacks. NOW FIXED.'
);

dangerBox(
  '⚠ PASSWORDS EMAILED IN PLAINTEXT',
  'Password reset emails contained the new password as visible HTML text. Anyone intercepting the email (IT admin, email provider, man-in-the-middle) gets the password. This violates every security standard. NOW FIXED — now sends recovery links.'
);

dangerBox(
  '⚠ XSS: ARBITRARY SCRIPT EXECUTION',
  'The Vidalytics video player extracted <script> tags from external API responses and executed them directly in the browser via document.head.appendChild(). An attacker controlling the Vidalytics response could execute arbitrary JavaScript in every student\'s browser. NOW FIXED.'
);

doc.moveDown(0.5);
subheading('Still Open — Must Fix Before Launch');

ticket('SEC-007', 'No rate limiting on any edge function', 'OPEN',
  'Zero rate limiting on password reset, user creation, deletion, invitations. Enables brute force attacks, DoS, account enumeration, and spam.');

ticket('SEC-008', 'File uploads have no server-side type verification', 'OPEN',
  'Client-side extension check only. An attacker can upload malware.exe renamed as image.png. No magic byte validation, no Supabase storage bucket policies.');

ticket('SEC-009', 'Impersonation links have no audit trail', 'OPEN',
  'Admins can generate unlimited impersonation links. Target user is never notified. No persistent log. A compromised admin account = silent full access to every student.');

ticket('SEC-011', 'No audit logging for admin actions', 'OPEN',
  'Delete user, reset password, create user — all admin actions log to console only. No database audit trail. Admin abuse or account compromise is completely undetectable.');

ticket('SEC-012', 'No two-factor authentication', 'OPEN',
  'No MFA requirement for admin or CSM accounts. A single compromised password gives full access to 1,400+ student records.');

// ============================================================
// PAGE 3: DATA INTEGRITY & SCALABILITY RISKS
// ============================================================
doc.addPage();
heading('Data Integrity & Scalability Risks', 20);

subheading('User Deletion Can Corrupt Your Database');
body('The delete-user function manually looped through 18 tables deleting data BEFORE calling auth deletion. If auth deletion failed, the user\'s data was already gone with no rollback. NOW FIXED — auth deletion happens first, with try/catch cleanup.', { color: GRAY });
doc.moveDown(0.3);

subheading('The Platform Will Break at 2,000 Students');
body('Multiple queries and systems were not designed for scale:', { color: GRAY });
doc.moveDown(0.2);

ticket('BE-002', 'Weekly reports take 11-33 HOURS for 2,000 users', 'OPEN',
  'Sequential OpenAI API calls per user. 2 calls × 2,000 users = 4,000 API calls = 11-33 hours. Exceeds Deno edge function timeout. Needs background job queue.');

ticket('BE-003', 'Community messages: N+1 queries, no pagination', 'FIXED',
  'Every message view triggered 4 separate queries. Thread replies fetched sender profiles in a loop. No message limit. Fixed: batch fetch + 50-message pagination.');

ticket('BE-004', 'No circuit breaker for external APIs', 'OPEN',
  'If Lovable AI moderation is down, ALL messages fail to send. If OpenAI is down, ALL weekly reports fail. No retry, no fallback, no graceful degradation.');

ticket('BE-005', 'User listing query not optimized', 'OPEN',
  'get_users_with_progress RPC does heavy joins/aggregations. 2,000 users × 100+ fields = massive data transfer. 134 page loads to fetch all users.');

ticket('BE-010', 'Realtime subscriptions won\'t scale', 'OPEN',
  '2,000 students × 10 channels = 20,000 Supabase realtime connections. No connection pooling. No adaptive polling.');

ticket('BE-006', 'Missing database indexes on high-query columns', 'OPEN',
  'No indexes on: community_messages.is_deleted, user_onboarding.user_id, weekly_reports.user_id, leaderboard_cache.user_id.');

// ============================================================
// PAGE 4: CSM WORKFLOW FAILURES
// ============================================================
doc.addPage();
heading('CSM Workflow Failures', 20);

body('The CSM (Customer Success Manager) team manages 250 students each. The platform\'s CSM tools have multiple bugs and critical gaps that prevent effective student management. 6 bugs were reported by the team, alongside missing features that force manual workarounds.', { color: GRAY });
doc.moveDown(0.5);

subheading('Bugs Reported by CSM Team');

ticket('CSM-BUG-1', 'Outreach counts are wrong', 'FIXED',
  'Joseph: "I contacted 4 students but dashboard shows 12." Root cause: query counted ALL CSMs\' contacts, not the logged-in CSM. Fixed: added per-CSM filter.');

ticket('CSM-BUG-2', 'Active student shows as at-risk', 'FIXED',
  'Sharon: Student accessed software but appears at-risk. Root cause: risk score only checked login date, not task activity. Fixed: uses MAX(login, task completion).');

ticket('CSM-BUG-3', '"Last seen" doesn\'t match reality', 'FIXED',
  'Beenish: Dashboard timestamps don\'t match actual activity. Same root cause as bug #2. Fixed with combined activity date.');

ticket('CSM-BUG-4', '"View Full Profile" button broken', 'FIXED',
  'Beenish: Button navigated to CSM panel but did nothing. Root cause: CSMPanel.tsx never read the navigation state. Fixed: now opens student detail view.');

ticket('CSM-BUG-5', 'CSV field mapping broken in dashboard', 'OPEN',
  'Nisha: CSV import field mapping doesn\'t work correctly. Needs investigation.');

ticket('CSM-BUG-6', 'Bell notifications missing student activity', 'OPEN',
  'Nisha: Notifications only show comments/messages/tickets. No alerts when students log in after absence, complete tasks, or pass quizzes.');

doc.moveDown(0.5);
subheading('Critical CSM Gaps');

bullet('Follow-up queue was capped at 240px (4-5 visible students). A CSM with 30+ at-risk students couldn\'t see them. [FIXED]');
bullet('Outreach status had only 2 options (Follow-up / Contacted). No way to track message sent, call scheduled, resolved. [FIXED — now 5 options]');
bullet('Student names were not clickable anywhere outside User Management. CSMs had to navigate multiple tabs. [FIXED]');
bullet('No student health score — only binary categories (at-risk / not at-risk). No composite scoring.');
bullet('No automated outreach triggers — CSMs must manually scan dashboard daily.');
bullet('No lifecycle stage engine or playbooks — new CSMs have no guidance on what to do at each stage.');
bullet('No Google Calendar integration — 1:1 coaching calls scheduled manually (Ihram).');
bullet('Student notes not sorted by date — most recent buried at bottom (Ihram).');

// ============================================================
// PAGE 5: CODE QUALITY & MAINTAINABILITY
// ============================================================
doc.addPage();
heading('Code Quality & Maintainability Risks', 20);

subheading('Quality Assessment');
body('Mid-level feature output with junior-level security, architecture, and code hygiene. Not senior-level work.', { color: GRAY });
doc.moveDown(0.3);

subheading('Key Indicators');
bullet('TypeScript strict mode is OFF — noImplicitAny: false, strictNullChecks: false. 94 files contain ": any" type annotations. Makes refactoring dangerous and enables silent runtime bugs.');
bullet('500+ occurrences of "any" or "as any" across source code and edge functions.');
bullet('452 console.log/console.error calls left in production code.');
bullet('Zero React.memo usage across 400+ components — every list re-renders entirely on any state change. [FIXED — added to 6 key components]');
bullet('UserManagementOverview.tsx was 1,042 lines with 32 useState calls in a single component. [FIXED — split into hook + component]');
bullet('Dual toast libraries (Sonner + Radix) both mounted simultaneously. [FIXED — consolidated to Sonner]');
bullet('No route-based code splitting — entire app loaded as a single bundle. [FIXED — 17 routes lazy-loaded]');
bullet('ESLint @typescript-eslint/no-unused-vars was disabled. [FIXED — enabled with warnings]');
bullet('PWA manifest said "Elite E-Commerce" instead of "ATP Ultra". [FIXED]');
bullet('Premium font (Rebond Grotesque, 18 weight files) sitting in /public/fonts/ completely unused. [FIXED — activated]');
bullet('cmdk package installed but no command palette built. canvas-confetti and lottie-react installed but barely wired up.');
bullet('ModuleLesson.tsx (661 lines) duplicates video rendering logic from InlineLessonContent — maintenance nightmare.');
bullet('333 migration files — excessive churn indicating iterative patching, not controlled schema evolution.');
bullet('Schema export references a DIFFERENT Supabase project than the live client config.');

// ============================================================
// PAGE 6: PLATFORM VALUATION
// ============================================================
doc.addPage();
heading('Platform Valuation', 20);

// Cost table
subheading('Cost to Build From Scratch (Competent US Team, $120-$180/hr)');

const buildCosts = [
  ['Frontend (27 pages, 267 components)', '900-1,350 hrs', '$108K - $243K'],
  ['Backend / DB (77 tables, broad domain)', '550-850 hrs', '$66K - $153K'],
  ['Edge Functions (28 functions)', '240-420 hrs', '$29K - $76K'],
  ['Design System', '140-240 hrs', '$17K - $43K'],
  ['Testing / QA (none exists currently)', '300-500 hrs', '$36K - $90K'],
  ['Deployment / Ops', '80-140 hrs', '$10K - $25K'],
];

for (const [item, hours, cost] of buildCosts) {
  checkSpace(20);
  doc.font('Helvetica').fontSize(9).fillColor(DARK).text(item, 60, doc.y, { width: 250, continued: false });
  const y2 = doc.y - 12;
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(hours, 320, y2, { width: 80 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(cost, 410, y2, { width: 140 });
  doc.moveDown(0.1);
}

doc.moveDown(0.2);
hr();
doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('TOTAL', 60, doc.y, { width: 250, continued: false });
const ty = doc.y - 12;
doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('2,210-3,500 hrs', 320, ty, { width: 80 });
doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN).text('$265K - $630K', 410, ty, { width: 140 });
doc.moveDown(1);

subheading('Cost to Fix All Critical + High Issues');
const fixCosts = [
  ['Secrets, auth, JWT, CORS, rate limiting', '90-170 hrs', '$11K - $31K'],
  ['Roles, permissions, RLS, audit', '70-140 hrs', '$8K - $25K'],
  ['Password reset, XSS, unsafe flows', '40-90 hrs', '$5K - $16K'],
  ['DB integrity, indexes, migrations', '60-120 hrs', '$7K - $22K'],
  ['Performance (N+1, reports, realtime)', '60-120 hrs', '$7K - $22K'],
  ['Regression testing', '40-80 hrs', '$5K - $14K'],
];

for (const [item, hours, cost] of fixCosts) {
  checkSpace(20);
  doc.font('Helvetica').fontSize(9).fillColor(DARK).text(item, 60, doc.y, { width: 250, continued: false });
  const y2 = doc.y - 12;
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(hours, 320, y2, { width: 80 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(cost, 410, y2, { width: 140 });
  doc.moveDown(0.1);
}

doc.moveDown(0.2);
hr();
doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('TOTAL', 60, doc.y, { width: 250, continued: false });
const fy2 = doc.y - 12;
doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('360-720 hrs', 320, fy2, { width: 80 });
doc.font('Helvetica-Bold').fontSize(10).fillColor(RED).text('$43K - $130K', 410, fy2, { width: 140 });
doc.moveDown(1.5);

// Valuation box
const vby = doc.y;
doc.save();
doc.roundedRect(60, vby, PW, 80, 6).fill('#F0FAF5');
doc.font('Helvetica-Bold').fontSize(14).fillColor(GREEN).text('Bottom Line Valuation', 80, vby + 12);
doc.font('Helvetica-Bold').fontSize(20).fillColor(DARK).text('$25,000 — $65,000 as-is', 80, vby + 34);
doc.font('Helvetica').fontSize(10).fillColor(GRAY).text('Salvage value. The range where fixing beats replacing, but only barely.', 80, vby + 60);
doc.restore();
doc.y = vby + 95;

// ============================================================
// PAGE 7: WHAT WAS FIXED (SUMMARY)
// ============================================================
doc.addPage();
heading('Remediation Completed', 20);

body('32 of 78 tickets (41%) have been fixed during this audit cycle. Here is the breakdown:', { color: GRAY });
doc.moveDown(0.5);

const fixSummary = [
  ['Security', '6 / 15', '40%', 'JWT verification, CORS lockdown, XSS removal, security headers, role restrictions, password reset'],
  ['UI/UX', '17 / 24', '71%', 'Font, colors, dark mode, cards, dashboard, page transitions, empty states, skeleton loading, manifest'],
  ['Code Quality', '8 / 11', '73%', 'Toast consolidation, React.memo, lazy loading, component splitting, ESLint, Vite chunks'],
  ['Backend', '3 / 17', '18%', 'N+1 fix, message pagination, delete-user transaction order'],
  ['Workflows', '2 / 11', '18%', 'Dead AI code removed, calendar join button UX'],
  ['CSM Bugs', '4 / 6', '67%', 'Outreach counts, risk score, view profile, email editing'],
];

for (const [cat, ratio, pct, details] of fixSummary) {
  checkSpace(35);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(`${cat}: ${ratio} fixed (${pct})`);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(details, { width: PW });
  doc.moveDown(0.4);
}

doc.moveDown(0.5);
subheading('Major Redesigns Delivered');
bullet('CSM Panel: Command center with morning briefing, 4 KPI cards, full-height urgency queue, tabs 6→4, outreach status 2→5 options');
bullet('Brand Leads: Table view with inline status editing, sortable columns, pipeline summary bar, inline add row, filter pills');
bullet('My Plan: Vertical timeline with connected phase nodes, hero summary bar, expandable week cards');
bullet('Community: Textarea with Shift+Enter, message editing, N+1 fix, pagination with "Load older" button');

// ============================================================
// PAGE 8: REMAINING CRITICAL WORK
// ============================================================
doc.addPage();
heading('Remaining Critical Work', 20);

body('These 7 items must be resolved before the platform can safely serve 2,000+ students:', { color: GRAY });
doc.moveDown(0.5);

const remaining = [
  ['1', 'Rate Limiting (SEC-007)', 'No protection against brute force, DoS, or spam on any of the 28 edge functions. A single attacker could lock out all users by spamming password resets.'],
  ['2', 'Audit Logging (SEC-011)', 'Admin actions (delete user, reset password, impersonate) leave no persistent trail. If an admin account is compromised, there is zero forensic evidence.'],
  ['3', 'Two-Factor Auth (SEC-012)', 'A single compromised password = full access to all student data. No MFA on admin or CSM accounts.'],
  ['4', 'Weekly Report Scaling (BE-002)', 'At 2,000 users, report generation takes 11-33 hours. Needs a background job queue, not an edge function.'],
  ['5', 'Circuit Breaker (BE-004)', 'When Lovable AI or OpenAI goes down, community messaging and weekly reports fail entirely. No graceful degradation.'],
  ['6', 'User Listing Optimization (BE-005)', 'Admin/CSM user management query does heavy joins. Performance degrades linearly with user count.'],
  ['7', 'TypeScript Strict Mode (CQ-002)', '94 files with ": any" types. Refactoring is dangerous — type errors are silent. Must enable incrementally.'],
];

for (const [num, title, desc] of remaining) {
  checkSpace(50);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(RED).text(`${num}. ${title}`);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(desc, { width: PW });
  doc.moveDown(0.5);
}

// ============================================================
// PAGE 9: INTEGRATIONS & DEPENDENCIES
// ============================================================
doc.addPage();
heading('External Integrations (18 Services)', 20);

const integrations = [
  ['Supabase', 'Core infrastructure (DB, Auth, Realtime, Storage, Edge Functions)', 'CRITICAL'],
  ['OpenAI GPT-4o-mini', 'Weekly report generation, psychology insights', 'HIGH'],
  ['Lovable AI / Gemini 3 Flash', 'Community message moderation', 'HIGH'],
  ['Google OAuth 2.0', 'Account linking for Calendar + Drive', 'MEDIUM'],
  ['Google Calendar API', 'Training call sync, Google Meet links', 'MEDIUM'],
  ['Google Drive API', 'Video file migration', 'LOW'],
  ['YouTube IFrame API', 'Video embedding (free, public)', 'LOW'],
  ['Vimeo oEmbed', 'Video embedding (free)', 'LOW'],
  ['Vidalytics', 'Video hosting + analytics (paid, views count against account)', 'MEDIUM'],
  ['Facebook App', 'Social auth (configured but unclear if active)', 'LOW'],
  ['Web Push / VAPID', 'Browser push notifications', 'MEDIUM'],
  ['Resend', 'Password reset emails', 'MEDIUM'],
  ['Crisp Chat', 'Live chat widget (currently disabled)', 'LOW'],
  ['Fathom AI', 'Meeting recordings, transcripts, summaries', 'MEDIUM'],
  ['SME Central Hub', 'External ticket sync (API key was HARDCODED in source)', 'HIGH'],
  ['Onboarding Webhook', 'Missed onboarding call updates', 'LOW'],
  ['Google Fonts', 'Montserrat CDN', 'LOW'],
  ['Deno / esm.sh', 'Edge function runtime', 'CRITICAL'],
];

for (const [name, purpose, risk] of integrations) {
  checkSpace(20);
  const riskColor = risk === 'CRITICAL' ? RED : risk === 'HIGH' ? ORANGE : risk === 'MEDIUM' ? '#6B7280' : LIGHT_GRAY;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(name, 60, doc.y, { width: 140, continued: false });
  const iy = doc.y - 12;
  doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(purpose, 200, iy, { width: 270 });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(riskColor).text(risk, 480, iy, { width: 60 });
  doc.moveDown(0.15);
}

// ============================================================
// FINALIZE
// ============================================================
doc.end();

stream.on('finish', () => {
  const stats = fs.statSync(OUTPUT);
  console.log(`PDF generated: ${OUTPUT}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB, ${doc.bufferedPageRange().count} pages`);
});
