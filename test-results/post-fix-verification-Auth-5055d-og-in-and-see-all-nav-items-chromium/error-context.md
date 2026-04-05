# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: post-fix-verification.spec.ts >> Auth & Navigation >> admin can log in and see all nav items
- Location: tests\post-fix-verification.spec.ts:46:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-tour="sidebar-nav"]')
Expected: visible
Error: strict mode violation: locator('[data-tour="sidebar-nav"]') resolved to 2 elements:
    1) <div data-tour="sidebar-nav" class="duration-200 fixed inset-y-0 z-10 h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=right]:border-l hidden md:flex flex-col border-none bg-sidebar text-sidebar-foreground">…</div> aka locator('div').filter({ hasText: 'HomeCoursesMy RoadmapMy' }).nth(4)
    2) <nav data-tour="sidebar-nav" class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar">…</nav> aka locator('nav')

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-tour="sidebar-nav"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T":
    - list:
      - status [ref=e3]:
        - button "Close toast" [ref=e4] [cursor=pointer]:
          - img [ref=e5]
        - img [ref=e9]
        - generic [ref=e12]: Welcome back!
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - img "EEC Logo" [ref=e16]
        - generic [ref=e17]: Elite E-Commerce
      - generic [ref=e18]:
        - generic [ref=e19]: Module 0 of 0
        - generic [ref=e22]: 0%
      - generic [ref=e23]:
        - button "Toggle theme" [ref=e24] [cursor=pointer]:
          - img
          - img
          - generic [ref=e25]: Toggle theme
        - button [ref=e26] [cursor=pointer]:
          - img [ref=e27]
        - button "MR Mo Roowala All Access" [ref=e30] [cursor=pointer]:
          - generic [ref=e32]: MR
          - generic [ref=e33]:
            - generic [ref=e34]: Mo Roowala
            - generic [ref=e35]: All Access
    - generic [ref=e36]:
      - generic [ref=e42]:
        - button [ref=e44] [cursor=pointer]:
          - img [ref=e45]
        - list [ref=e50]:
          - listitem [ref=e51]:
            - button "Home" [ref=e52] [cursor=pointer]:
              - img [ref=e54]
              - generic [ref=e57]: Home
          - listitem [ref=e58]:
            - button "Courses" [ref=e59] [cursor=pointer]:
              - img [ref=e61]
              - generic [ref=e64]: Courses
          - listitem [ref=e65]:
            - button "My Roadmap" [ref=e66] [cursor=pointer]:
              - img [ref=e68]
              - generic [ref=e73]: My Roadmap
          - listitem [ref=e74]:
            - button "My Notes" [ref=e75] [cursor=pointer]:
              - img [ref=e77]
              - generic [ref=e80]: My Notes
          - listitem [ref=e81]:
            - button "Brand Leads" [ref=e82] [cursor=pointer]:
              - img [ref=e84]
              - generic [ref=e88]: Brand Leads
          - listitem [ref=e89]:
            - button "Events" [ref=e90] [cursor=pointer]:
              - img [ref=e92]
              - generic [ref=e94]: Events
          - listitem [ref=e95]:
            - button "Community" [ref=e96] [cursor=pointer]:
              - img [ref=e98]
              - generic [ref=e103]: Community
          - listitem [ref=e104]:
            - button "Direct Messages" [ref=e105] [cursor=pointer]:
              - img [ref=e107]
              - generic [ref=e109]: Direct Messages
          - listitem [ref=e110]:
            - button "Support" [ref=e111] [cursor=pointer]:
              - img [ref=e113]
              - generic [ref=e116]: Support
          - listitem [ref=e117]:
            - button "CSM Panel" [ref=e118] [cursor=pointer]:
              - img [ref=e120]
              - generic [ref=e122]: CSM Panel
          - listitem [ref=e123]:
            - button "Support Tickets" [ref=e124] [cursor=pointer]:
              - img [ref=e126]
              - generic [ref=e128]: Support Tickets
      - generic [ref=e132]:
        - generic [ref=e134]:
          - generic [ref=e136]:
            - generic [ref=e139] [cursor=pointer]: 👋
            - img [ref=e142]
            - img [ref=e147]
            - img [ref=e152]
            - img [ref=e157]
            - img [ref=e162]
            - button [ref=e165] [cursor=pointer]:
              - img [ref=e166]
          - generic [ref=e168]:
            - generic [ref=e169]:
              - generic [ref=e170]:
                - generic [ref=e171]: 🔥
                - generic [ref=e172]: "3"
              - generic [ref=e173]:
                - heading "Welcome back, Mo" [level=1] [ref=e174]
                - paragraph [ref=e175]: 3-day streak! Keep it going.
            - generic [ref=e177]:
              - img [ref=e178]
              - generic [ref=e180]: All Access
            - generic [ref=e181]:
              - generic [ref=e182]:
                - img [ref=e183]
                - generic [ref=e185]: Live Activity
              - generic [ref=e186]:
                - generic [ref=e187]: SC
                - paragraph [ref=e188]: Sarah C. completed Phase 3 of Wholesale Mastery
                - generic [ref=e189]: 2m ago
              - generic [ref=e190]:
                - generic [ref=e191]: MR
                - paragraph [ref=e192]: Marcus R. earned the Brand Hunter badge
                - generic [ref=e193]: 5m ago
              - generic [ref=e194]:
                - generic [ref=e195]: JW
                - paragraph [ref=e196]: Jordan W. contacted 15 brands this week
                - generic [ref=e197]: 12m ago
              - generic [ref=e198]:
                - generic [ref=e199]: PP
                - paragraph [ref=e200]: Priya P. is on a 14-day streak!
                - generic [ref=e201]: 18m ago
          - generic [ref=e205]:
            - generic [ref=e206]:
              - generic [ref=e207]:
                - paragraph [ref=e208]: Saturday, April 4th
                - paragraph [ref=e209]: Nice job working on the weekend.
              - generic [ref=e210]:
                - generic [ref=e211]: M
                - generic [ref=e212]: T
                - generic [ref=e213]: W
                - generic [ref=e214]: T
                - generic [ref=e215]: F
                - generic [ref=e216]: S
                - generic [ref=e217]: S
              - generic [ref=e218]:
                - generic [ref=e220]: "30"
                - generic [ref=e222]: "31"
                - generic [ref=e224]: "1"
                - generic [ref=e226]: "2"
                - generic [ref=e228]: "3"
                - generic [ref=e230]: "4"
                - generic [ref=e233]: "5"
            - generic [ref=e234]:
              - generic [ref=e235]:
                - img [ref=e236]
                - generic [ref=e239]:
                  - paragraph [ref=e240]: Brand Outreach Call
                  - paragraph [ref=e241]: Today 14:00
                - button "RSVP" [ref=e242] [cursor=pointer]
              - generic [ref=e243]:
                - img [ref=e244]
                - generic [ref=e247]:
                  - paragraph [ref=e248]: Mindset Monday
                  - paragraph [ref=e249]: Mon, Apr 6 09:00
                - button "RSVP" [ref=e250] [cursor=pointer]
          - generic [ref=e251]:
            - generic [ref=e255]:
              - generic [ref=e257]:
                - img [ref=e259]
                - generic [ref=e261]:
                  - paragraph [ref=e262]: ATP Wholesale Mastery
                  - generic [ref=e265]: 0%
                - button "Continue" [ref=e266] [cursor=pointer]:
                  - text: Continue
                  - img
              - generic [ref=e267]:
                - generic [ref=e268]:
                  - img [ref=e270]
                  - generic [ref=e274]:
                    - heading "Your Progress" [level=2] [ref=e275]
                    - paragraph [ref=e276]: "Week 4: First PO — Days 22-30"
                - generic [ref=e277]:
                  - img [ref=e278]
                  - generic [ref=e281]: 81%
              - generic [ref=e283]:
                - generic [ref=e284]:
                  - button [ref=e285] [cursor=pointer]:
                    - img [ref=e286]
                  - generic [ref=e290]:
                    - generic [ref=e291]: Day 22
                    - text: Negotiate terms with brand
                - generic [ref=e292]:
                  - button [ref=e293] [cursor=pointer]:
                    - img [ref=e294]
                  - generic [ref=e298]:
                    - generic [ref=e299]: Day 24
                    - text: Create your first PO
                - generic [ref=e300]:
                  - button [ref=e301] [cursor=pointer]:
                    - img [ref=e302]
                  - generic [ref=e306]:
                    - generic [ref=e307]: Day 26
                    - text: Submit PO and arrange shipping
                - generic [ref=e308]:
                  - button [ref=e309] [cursor=pointer]:
                    - img [ref=e310]
                  - generic [ref=e314]:
                    - generic [ref=e315]: Day 30
                    - text: Review month and plan next
              - generic [ref=e319]: 1/4 tasks
            - generic [ref=e321]:
              - generic [ref=e324]:
                - img [ref=e326]
                - generic [ref=e329]:
                  - heading "Daily Actions" [level=2] [ref=e330]
                  - paragraph [ref=e331]: 0/5 done today
              - generic [ref=e332]:
                - generic [ref=e333]:
                  - generic [ref=e334] [cursor=pointer]:
                    - img [ref=e336]
                    - img [ref=e338]
                    - generic [ref=e341]: Send 5 brand outreach emails
                  - generic [ref=e342] [cursor=pointer]:
                    - img [ref=e344]
                    - img [ref=e346]
                    - generic [ref=e350]: Review 3 product listings on SmartScout
                  - generic [ref=e351] [cursor=pointer]:
                    - img [ref=e353]
                    - img [ref=e355]
                    - generic [ref=e358]: Check shipping status
                  - generic [ref=e359] [cursor=pointer]:
                    - img [ref=e361]
                    - img [ref=e363]
                    - generic [ref=e365]: Complete today's course module
                  - generic [ref=e366] [cursor=pointer]:
                    - img [ref=e368]
                    - img [ref=e370]
                    - generic [ref=e372]: Post in community
                - generic [ref=e373]:
                  - generic [ref=e374]:
                    - img [ref=e375]
                    - generic [ref=e378]: Brand Outreach This Week
                  - generic [ref=e379]:
                    - generic [ref=e380]:
                      - generic [ref=e381]: "0"
                      - text: Contacted
                    - generic [ref=e382]:
                      - generic [ref=e383]: "0"
                      - text: Follow-ups
                    - generic [ref=e384]:
                      - generic [ref=e385]: "0"
                      - text: Approved
                  - generic [ref=e386]:
                    - paragraph [ref=e387]: 0 total brands tracked
                    - button "View All" [ref=e388] [cursor=pointer]:
                      - text: View All
                      - img
        - generic [ref=e391] [cursor=pointer]:
          - img [ref=e392]
          - generic [ref=e394]: Leaderboard
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | // ---------------------------------------------------------------------------
  4   | // Helpers
  5   | // ---------------------------------------------------------------------------
  6   | 
  7   | const ACCOUNTS = {
  8   |   admin: { email: 'mo@test.dev', password: 'Test1234!' },
  9   |   csm: { email: 'csm@test.dev', password: 'Test1234!' },
  10  |   student: { email: 'student1@test.dev', password: 'Test1234!' },
  11  | };
  12  | 
  13  | /**
  14  |  * Logs in via the password form and waits for the dashboard to appear.
  15  |  * Reusable across all tests that need an authenticated session.
  16  |  */
  17  | async function login(page: Page, account: keyof typeof ACCOUNTS) {
  18  |   const { email, password } = ACCOUNTS[account];
  19  | 
  20  |   await page.goto('/auth');
  21  |   await page.waitForLoadState('networkidle');
  22  | 
  23  |   // The auth page defaults to magic-link mode -- switch to password mode
  24  |   const passwordToggle = page.getByRole('button', { name: /password/i });
  25  |   // Only click if the password input is not already visible
  26  |   const passwordInput = page.locator('input#password');
  27  |   if (!(await passwordInput.isVisible({ timeout: 2000 }).catch(() => false))) {
  28  |     await passwordToggle.click();
  29  |     await expect(passwordInput).toBeVisible({ timeout: 5000 });
  30  |   }
  31  | 
  32  |   await page.locator('input#email').fill(email);
  33  |   await passwordInput.fill(password);
  34  |   await page.getByRole('button', { name: /log in/i }).click();
  35  | 
  36  |   // Wait for authenticated layout to appear (sidebar visible on desktop)
> 37  |   await expect(page.locator('[data-tour="sidebar-nav"]')).toBeVisible({ timeout: 15000 });
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  38  |   await page.waitForLoadState('networkidle');
  39  | }
  40  | 
  41  | // ---------------------------------------------------------------------------
  42  | // 1. Auth & Navigation
  43  | // ---------------------------------------------------------------------------
  44  | 
  45  | test.describe('Auth & Navigation', () => {
  46  |   test('admin can log in and see all nav items', async ({ page }) => {
  47  |     // Unauthenticated visit should redirect to /auth
  48  |     await page.goto('/');
  49  |     await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
  50  | 
  51  |     await login(page, 'admin');
  52  | 
  53  |     // Sidebar should contain the expected navigation items (expanded labels)
  54  |     const sidebar = page.locator('[data-tour="sidebar-nav"]');
  55  |     await expect(sidebar).toBeVisible();
  56  | 
  57  |     // Check for each expected nav item by their data-tour attributes or text
  58  |     await expect(page.locator('[data-tour="nav-home"]')).toBeVisible();
  59  |     await expect(page.locator('[data-tour="nav-courses"]')).toBeVisible();
  60  |     await expect(page.locator('[data-tour="nav-my-plan"]')).toBeVisible();
  61  |     await expect(page.locator('[data-tour="nav-brand-leads"]')).toBeVisible();
  62  |     await expect(page.locator('[data-tour="nav-calendar"]')).toBeVisible();
  63  |     await expect(page.locator('[data-tour="nav-community"]')).toBeVisible();
  64  | 
  65  |     // CSM Panel link -- admin-only. Check the sidebar text content.
  66  |     await expect(sidebar.getByText(/csm/i)).toBeVisible({ timeout: 5000 });
  67  | 
  68  |     // Support link
  69  |     await expect(sidebar.getByText(/support/i).first()).toBeVisible({ timeout: 5000 });
  70  |   });
  71  | });
  72  | 
  73  | // ---------------------------------------------------------------------------
  74  | // 2. Dashboard Loads
  75  | // ---------------------------------------------------------------------------
  76  | 
  77  | test.describe('Dashboard', () => {
  78  |   test('dashboard shows welcome hero and key cards after login', async ({ page }) => {
  79  |     await login(page, 'admin');
  80  | 
  81  |     // Navigate to /home explicitly
  82  |     await page.goto('/home');
  83  |     await page.waitForLoadState('networkidle');
  84  | 
  85  |     // "Welcome back" hero text
  86  |     await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });
  87  | 
  88  |     // Milestones section (data-tour attribute)
  89  |     await expect(page.locator('[data-tour="milestones-checklist"]')).toBeVisible({ timeout: 10000 });
  90  | 
  91  |     // Continue course card
  92  |     await expect(page.locator('[data-tour="continue-course"]')).toBeVisible({ timeout: 10000 });
  93  | 
  94  |     // Calendar widget -- look for the CalendarWidget component area
  95  |     // It renders inside a card with "Upcoming" or calendar-related text
  96  |     const calendarWidget = page.getByText(/upcoming/i).first();
  97  |     await expect(calendarWidget).toBeVisible({ timeout: 10000 });
  98  |   });
  99  | });
  100 | 
  101 | // ---------------------------------------------------------------------------
  102 | // 3. CSM Panel Shows Students
  103 | // ---------------------------------------------------------------------------
  104 | 
  105 | test.describe('CSM Panel', () => {
  106 |   test('CSM panel displays tabs and student-related content', async ({ page }) => {
  107 |     await login(page, 'admin');
  108 | 
  109 |     await page.goto('/csm-panel');
  110 |     await page.waitForLoadState('networkidle');
  111 | 
  112 |     // Heading
  113 |     await expect(page.getByRole('heading', { name: /csm panel/i })).toBeVisible({ timeout: 10000 });
  114 | 
  115 |     // Tab bar should have Dashboard, Students, etc.
  116 |     await expect(page.getByRole('tab', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
  117 |     await expect(page.getByRole('tab', { name: /students/i })).toBeVisible({ timeout: 10000 });
  118 | 
  119 |     // Click the Students tab
  120 |     await page.getByRole('tab', { name: /students/i }).click();
  121 |     await page.waitForLoadState('networkidle');
  122 | 
  123 |     // Wait for student data to load -- there should be student rows/cards
  124 |     // The CSMStudentsTab renders a table or list with student names
  125 |     const studentArea = page.locator('[role="tabpanel"]');
  126 |     await expect(studentArea).toBeVisible({ timeout: 10000 });
  127 | 
  128 |     // Verify at least 1 student name appears (the table has TableRow elements)
  129 |     // Use a generous timeout since Supabase queries may take a moment
  130 |     const tableRows = studentArea.locator('tr, [class*="student"], [class*="card"]');
  131 |     await expect(tableRows.first()).toBeVisible({ timeout: 15000 });
  132 |   });
  133 | });
  134 | 
  135 | // ---------------------------------------------------------------------------
  136 | // 4. Community Chat Works
  137 | // ---------------------------------------------------------------------------
```