import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCOUNTS = {
  admin: { email: 'mo@test.dev', password: 'Test1234!' },
  csm: { email: 'csm@test.dev', password: 'Test1234!' },
  student: { email: 'student1@test.dev', password: 'Test1234!' },
};

/**
 * Logs in via the password form and waits for the dashboard to appear.
 * Reusable across all tests that need an authenticated session.
 */
async function login(page: Page, account: keyof typeof ACCOUNTS) {
  const { email, password } = ACCOUNTS[account];

  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // The auth page defaults to magic-link mode -- switch to password mode
  const passwordToggle = page.getByRole('button', { name: /password/i });
  // Only click if the password input is not already visible
  const passwordInput = page.locator('input#password');
  if (!(await passwordInput.isVisible({ timeout: 2000 }).catch(() => false))) {
    await passwordToggle.click();
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
  }

  await page.locator('input#email').fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for authenticated layout to appear (sidebar visible on desktop)
  await expect(page.locator('[data-tour="sidebar-nav"]')).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Auth & Navigation
// ---------------------------------------------------------------------------

test.describe('Auth & Navigation', () => {
  test('admin can log in and see all nav items', async ({ page }) => {
    // Unauthenticated visit should redirect to /auth
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });

    await login(page, 'admin');

    // Sidebar should contain the expected navigation items (expanded labels)
    const sidebar = page.locator('[data-tour="sidebar-nav"]');
    await expect(sidebar).toBeVisible();

    // Check for each expected nav item by their data-tour attributes or text
    await expect(page.locator('[data-tour="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-courses"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-my-plan"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-brand-leads"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-calendar"]')).toBeVisible();
    await expect(page.locator('[data-tour="nav-community"]')).toBeVisible();

    // CSM Panel link -- admin-only. Check the sidebar text content.
    await expect(sidebar.getByText(/csm/i)).toBeVisible({ timeout: 5000 });

    // Support link
    await expect(sidebar.getByText(/support/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Dashboard Loads
// ---------------------------------------------------------------------------

test.describe('Dashboard', () => {
  test('dashboard shows welcome hero and key cards after login', async ({ page }) => {
    await login(page, 'admin');

    // Navigate to /home explicitly
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // "Welcome back" hero text
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });

    // Milestones section (data-tour attribute)
    await expect(page.locator('[data-tour="milestones-checklist"]')).toBeVisible({ timeout: 10000 });

    // Continue course card
    await expect(page.locator('[data-tour="continue-course"]')).toBeVisible({ timeout: 10000 });

    // Calendar widget -- look for the CalendarWidget component area
    // It renders inside a card with "Upcoming" or calendar-related text
    const calendarWidget = page.getByText(/upcoming/i).first();
    await expect(calendarWidget).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 3. CSM Panel Shows Students
// ---------------------------------------------------------------------------

test.describe('CSM Panel', () => {
  test('CSM panel displays tabs and student-related content', async ({ page }) => {
    await login(page, 'admin');

    await page.goto('/csm-panel');
    await page.waitForLoadState('networkidle');

    // Heading
    await expect(page.getByRole('heading', { name: /csm panel/i })).toBeVisible({ timeout: 10000 });

    // Tab bar should have Dashboard, Students, etc.
    await expect(page.getByRole('tab', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: /students/i })).toBeVisible({ timeout: 10000 });

    // Click the Students tab
    await page.getByRole('tab', { name: /students/i }).click();
    await page.waitForLoadState('networkidle');

    // Wait for student data to load -- there should be student rows/cards
    // The CSMStudentsTab renders a table or list with student names
    const studentArea = page.locator('[role="tabpanel"]');
    await expect(studentArea).toBeVisible({ timeout: 10000 });

    // Verify at least 1 student name appears (the table has TableRow elements)
    // Use a generous timeout since Supabase queries may take a moment
    const tableRows = studentArea.locator('tr, [class*="student"], [class*="card"]');
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// 4. Community Chat Works
// ---------------------------------------------------------------------------

test.describe('Community Chat', () => {
  test('can send a message in a community channel', async ({ page }) => {
    await login(page, 'admin');

    await page.goto('/community');
    await page.waitForLoadState('networkidle');

    // Wait for channels to load in the sidebar
    await expect(page.locator('[data-tour="community-area"]')).toBeVisible({ timeout: 10000 });

    // The app auto-selects the first channel. Wait for the channel header to show a name.
    await expect(page.locator('h1').filter({ hasText: /.+/ })).toBeVisible({ timeout: 10000 });

    // If General channel exists, click it; otherwise use whichever is selected
    const generalChannel = page.getByText('General', { exact: true });
    if (await generalChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generalChannel.click();
      await page.waitForLoadState('networkidle');
    }

    // Type a message in the input
    const timestamp = Date.now();
    const testMessage = `Hello from Playwright test ${timestamp}`;
    const messageInput = page.locator('input[placeholder*="Message"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');

    // Verify the message appears in the message list
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation Doesn't Hang
// ---------------------------------------------------------------------------

test.describe('Navigation Performance', () => {
  test('navigating between pages is responsive', async ({ page }) => {
    await login(page, 'admin');

    // Navigate to community
    await page.goto('/community');
    await expect(page.locator('[data-tour="community-area"]')).toBeVisible({ timeout: 10000 });

    // Click Home in sidebar
    await page.locator('[data-tour="nav-home"]').click();
    // Dashboard should load within 3 seconds
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 3000 });

    // Navigate to My Plan
    await page.locator('[data-tour="nav-my-plan"]').click();
    // Plan page should load within 3 seconds
    await expect(page.locator('[data-tour="my-plan"]')).toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// 6. My Plan Page Loads
// ---------------------------------------------------------------------------

test.describe('My Plan', () => {
  test('My Plan shows sprint phases', async ({ page }) => {
    await login(page, 'admin');

    await page.goto('/my-plan');
    await page.waitForLoadState('networkidle');

    // The page should have the "My Roadmap" heading
    await expect(page.getByRole('heading', { name: /my roadmap|my action plan/i })).toBeVisible({ timeout: 10000 });

    // Should show at least one collapsible phase with a title
    // Phases are rendered as Collapsible sections with phase names
    const phaseHeadings = page.locator('[data-tour="my-plan"] h2, [data-tour="my-plan"] h3, [data-tour="my-plan"] button:has-text("Phase"), [data-tour="my-plan"] button:has-text("Week")');
    await expect(phaseHeadings.first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 7. Brand Leads Page Loads
// ---------------------------------------------------------------------------

test.describe('Brand Leads', () => {
  test('Brand Leads page loads without errors', async ({ page }) => {
    await login(page, 'student');

    await page.goto('/brand-leads');
    await page.waitForLoadState('networkidle');

    // Look for Brand Leads heading or the page content area
    // The page has a Target icon and heading, plus an "Add Lead" button
    const heading = page.getByText(/brand leads/i).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // The add lead button (Plus icon + text)
    const addButton = page.getByRole('button', { name: /add|new lead/i });
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 8. Calendar Page Loads
// ---------------------------------------------------------------------------

test.describe('Calendar', () => {
  test('Calendar page loads with tabs', async ({ page }) => {
    await login(page, 'admin');

    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Calendar page has "Calendar & Calls" heading
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible({ timeout: 10000 });

    // Tab buttons for Upcoming Calls and Call Recordings
    await expect(page.getByRole('tab', { name: /upcoming/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: /recording/i })).toBeVisible({ timeout: 10000 });

    // Look for any call card or event indicator in the upcoming section
    // The seeded data includes "Weekly Group Coaching Call"
    const callContent = page.locator('[data-tour="calendar-view"]');
    await expect(callContent).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 9. Dark Mode Toggle
// ---------------------------------------------------------------------------

test.describe('Dark Mode', () => {
  test('dark mode toggle works', async ({ page }) => {
    await login(page, 'admin');

    // The ThemeToggle is in the TopBanner -- find the button with sr-only "Toggle theme"
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Click to enable dark mode
    await themeToggle.click();
    // The ThemeProvider sets class="dark" on the <html> element
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });

    // Click again to revert to light mode
    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 10. Security: XSS Protection
// ---------------------------------------------------------------------------

test.describe('Security', () => {
  test('messages are sanitized against XSS', async ({ page }) => {
    await login(page, 'admin');

    await page.goto('/community');
    await page.waitForLoadState('networkidle');

    // Wait for a channel to be selected
    await expect(page.locator('[data-tour="community-area"]')).toBeVisible({ timeout: 10000 });

    // Wait for channel to auto-select and message input to appear
    const messageInput = page.locator('input[placeholder*="Message"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Send a message containing a script tag
    const xssPayload = "<script>alert('xss')</script>";
    const timestamp = Date.now();
    const fullMessage = `XSS test ${timestamp} ${xssPayload}`;
    await messageInput.fill(fullMessage);
    await messageInput.press('Enter');

    // Set up a dialog listener -- if an alert fires, fail the test
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    // Wait for the message to appear in the message list
    // The rendered text should show the script tag as escaped text, not execute it
    await expect(page.getByText(`XSS test ${timestamp}`)).toBeVisible({ timeout: 10000 });

    // Small delay to ensure any script would have had time to execute
    await page.waitForTimeout(1000);

    // Verify no alert dialog was triggered
    expect(alertFired).toBe(false);

    // Verify the script tag is NOT present as an actual DOM element
    const scriptElements = await page.locator('script').filter({ hasText: 'xss' }).count();
    expect(scriptElements).toBe(0);
  });
});
