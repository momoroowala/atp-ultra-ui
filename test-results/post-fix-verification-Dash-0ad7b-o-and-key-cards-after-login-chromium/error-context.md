# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: post-fix-verification.spec.ts >> Dashboard >> dashboard shows welcome hero and key cards after login
- Location: tests\post-fix-verification.spec.ts:78:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-tour="sidebar-nav"]')
Expected: visible
Error: strict mode violation: locator('[data-tour="sidebar-nav"]') resolved to 2 elements:
    1) <div data-tour="sidebar-nav" class="duration-200 fixed inset-y-0 z-10 h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=right]:border-l hidden md:flex flex-col border-none bg-sidebar text-sidebar-foreground">…</div> aka locator('div').filter({ hasText: 'HomeCoursesMy' }).nth(4)
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