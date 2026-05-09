/**
 * Critical flow E2E tests — login, invite claim, buy box wizard.
 * Uses page.route() to mock all API calls so tests run with dev server only
 * (no backend required). Run: npx playwright test tests/critical-flows.spec.js
 */

import { test, expect } from '@playwright/test';

// ── Shared test fixtures ────────────────────────────────────────────────────

const MOCK_SUBSCRIBER = {
  id: 'test-sub-1',
  email: 'test@parcyl.ai',
  full_name: 'Test User',
  status: 'active',
};

const MOCK_TOKEN = 'mock-jwt-test-token-abc123';

async function mockAuth(page, { fail = false } = {}) {
  await page.route('**/api/dealfeed/auth/login', route => {
    if (fail) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid credentials' }) });
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: MOCK_TOKEN, subscriber: MOCK_SUBSCRIBER }) });
  });

  await page.route('**/api/dealfeed/auth/me', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ subscriber: MOCK_SUBSCRIBER }) });
  });
}

async function mockData(page) {
  await page.route('**/api/dealfeed/deals', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deals: [] }) });
  });
  await page.route('**/api/dealfeed/buy-boxes', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ buy_boxes: [] }) });
  });
}

async function loginAs(page, subscriber = MOCK_SUBSCRIBER) {
  await page.route('**/api/dealfeed/auth/login', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: MOCK_TOKEN, subscriber }) });
  });
  await page.route('**/api/dealfeed/auth/me', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ subscriber }) });
  });
  await mockData(page);

  await page.goto('/');
  await page.locator('input[type="email"]').fill(subscriber.email);
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  // Wait for app shell (login form disappears)
  await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 6000 });
}


// ── Suite 1: Login flow ─────────────────────────────────────────────────────

test.describe('Login Flow', () => {
  test('unauthenticated root shows login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('valid credentials authenticate and hide login form', async ({ page }) => {
    await mockAuth(page);
    await mockData(page);
    await page.goto('/');

    await page.locator('input[type="email"]').fill('test@parcyl.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 6000 });
  });

  test('invalid credentials keep login form visible', async ({ page }) => {
    await mockAuth(page, { fail: true });
    await page.goto('/');

    await page.locator('input[type="email"]').fill('bad@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Login form must still be visible after failure
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('submit button is disabled while submitting', async ({ page }) => {
    // Slow the login response to catch the loading state
    await page.route('**/api/dealfeed/auth/login', async route => {
      await new Promise(r => setTimeout(r, 300));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: MOCK_TOKEN, subscriber: MOCK_SUBSCRIBER }) });
    });
    await page.route('**/api/dealfeed/auth/me', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ subscriber: MOCK_SUBSCRIBER }) });
    });
    await mockData(page);

    await page.goto('/');
    await page.locator('input[type="email"]').fill('test@parcyl.ai');
    await page.locator('input[type="password"]').fill('password123');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Button should be disabled during the async request
    await expect(submitBtn).toBeDisabled({ timeout: 500 });
  });

  test('persisted token restores session on reload', async ({ page }) => {
    await mockAuth(page);
    await mockData(page);
    await page.goto('/');

    await page.locator('input[type="email"]').fill('test@parcyl.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 6000 });

    // Reload — /me should restore the session
    await page.route('**/api/dealfeed/auth/me', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ subscriber: MOCK_SUBSCRIBER }) });
    });
    await mockData(page);
    await page.reload();

    await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 6000 });
  });
});


// ── Suite 2: Invite claim flow ──────────────────────────────────────────────

test.describe('Invite Claim Flow', () => {
  const VALID_TOKEN = 'valid-invite-abc123';
  const INVITE_EMAIL = 'invited@parcyl.ai';

  function mockInvite(page, { valid = true } = {}) {
    if (valid) {
      page.route(`**/api/dealfeed/auth/invite/${VALID_TOKEN}`, route => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ email: INVITE_EMAIL }) });
      });
    } else {
      page.route('**/api/dealfeed/auth/invite/**', route => {
        route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid or expired invite' }) });
      });
    }
  }

  test('valid token shows claim form', async ({ page }) => {
    mockInvite(page, { valid: true });
    await page.goto(`/invite/${VALID_TOKEN}`);

    // Wait past the "Verifying..." loading state
    await expect(page.locator('input[placeholder="Jane Smith"]')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('invalid token shows error state', async ({ page }) => {
    mockInvite(page, { valid: false });
    await page.goto('/invite/bad-token-xyz');

    // Should not show the claim form — should show the invalid/expired message
    await expect(page.locator('input[placeholder="Jane Smith"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Invite invalid or expired')).toBeVisible({ timeout: 5000 });
  });

  test('claim form requires all three fields to enable submit', async ({ page }) => {
    mockInvite(page, { valid: true });
    await page.goto(`/invite/${VALID_TOKEN}`);

    // Wait for form to appear
    await expect(page.locator('input[placeholder="Jane Smith"]')).toBeVisible({ timeout: 6000 });

    const submitBtn = page.locator('button[type="submit"]');

    // Initially disabled (all fields empty)
    await expect(submitBtn).toBeDisabled();

    // Fill name only — still disabled
    await page.locator('input[placeholder="Jane Smith"]').fill('Brady Irwin');
    await expect(submitBtn).toBeDisabled();

    // Fill password + confirm → enabled
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('SecurePass123!');
    await passwordInputs.nth(1).fill('SecurePass123!');

    await expect(submitBtn).not.toBeDisabled({ timeout: 2000 });
  });

  test('successful claim redirects out of /invite/', async ({ page }) => {
    mockInvite(page, { valid: true });

    await page.route(`**/api/dealfeed/auth/invite/${VALID_TOKEN}/claim`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: MOCK_TOKEN, subscriber: { ...MOCK_SUBSCRIBER, email: INVITE_EMAIL } }),
      });
    });
    await page.route('**/api/dealfeed/auth/me', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ subscriber: { ...MOCK_SUBSCRIBER, email: INVITE_EMAIL } }) });
    });
    await mockData(page);

    await page.goto(`/invite/${VALID_TOKEN}`);
    await expect(page.locator('input[placeholder="Jane Smith"]')).toBeVisible({ timeout: 6000 });

    await page.locator('input[placeholder="Jane Smith"]').fill('Brady Irwin');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('SecurePass123!');
    await passwordInputs.nth(1).fill('SecurePass123!');
    await page.locator('button[type="submit"]').click();

    // Should leave the invite page
    await expect(page).not.toHaveURL(/\/invite\//i, { timeout: 6000 });
  });
});


// ── Suite 3: Buy Box Wizard ─────────────────────────────────────────────────

test.describe('Buy Box Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  async function openWizard(page) {
    // ParcylBar renders .pb-tab buttons — "Buy Boxes" tab has id="boxes"
    await page.locator('.pb-tab').filter({ hasText: 'Buy Boxes' }).click();
    await expect(page.locator('.pb-tab.active').filter({ hasText: 'Buy Boxes' })).toBeVisible({ timeout: 4000 });

    // BuyBoxesView has an "New Buy Box" or similar create button
    const newBtn = page.locator('button').filter({ hasText: /new buy box|new box|add buy box/i }).first();
    await newBtn.click();

    // BuyBoxWizard renders with class bbwiz-*
    await expect(page.locator('.bbwiz-step-body').first()).toBeVisible({ timeout: 4000 });
  }

  test('wizard opens from buy boxes view', async ({ page }) => {
    await openWizard(page);
  });

  test('step 1 blocks progression without a name', async ({ page }) => {
    await openWizard(page);

    // Step 1: Name Your Buy Box — Continue button is always clickable but
    // handleNext() validates and sets touched without advancing if name is empty.
    await expect(page.locator('text=Name Your Buy Box')).toBeVisible({ timeout: 3000 });
    const continueBtn = page.locator('.bbwiz-btn-primary');

    // Click Continue with no name — should stay on step 1
    await continueBtn.click();
    await expect(page.locator('text=Name Your Buy Box')).toBeVisible({ timeout: 2000 });

    // Enter a name and click — should advance to step 2
    await page.locator('input[type="text"]').first().fill('Austin Industrial');
    await continueBtn.click();
    await expect(page.locator('text=Geography')).toBeVisible({ timeout: 3000 });
  });

  test('can navigate from step 1 to step 2', async ({ page }) => {
    await openWizard(page);

    await page.locator('input[type="text"]').first().fill('Test Box');
    await page.locator('.bbwiz-btn-primary').click();

    // Step 2: Geography
    await expect(page.locator('text=Geography')).toBeVisible({ timeout: 3000 });
  });

  test('cancel closes wizard without submitting', async ({ page }) => {
    let submitted = false;
    await page.route('**/api/dealfeed/buy-boxes', route => {
      if (route.request().method() === 'POST') submitted = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ buy_boxes: [] }) });
    });

    await openWizard(page);

    // Cancel button in wizard header
    const cancelBtn = page.locator('button').filter({ hasText: /cancel/i }).first();
    await cancelBtn.click();

    await expect(page.locator('.bbwiz-step-body')).not.toBeVisible({ timeout: 3000 });
    expect(submitted).toBe(false);
  });
});
