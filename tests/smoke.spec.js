import { test, expect } from '@playwright/test';

test.describe('Deal Feed Dashboard Smoke Test', () => {
  test('homepage loads without console errors', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
        });
        console.log(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 100));
    console.log(`Body has content: ${bodyHtml.length > 0}`);

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/homepage.png' });

    // Check for critical errors
    const criticalErrors = consoleErrors.filter(err =>
      err.text.includes('TypeError') ||
      err.text.includes('Cannot read') ||
      err.text.includes('fmtMoney') ||
      err.text.includes('toLocaleString')
    );

    console.log(`\nConsole errors found: ${consoleErrors.length}`);
    console.log(`Critical errors found: ${criticalErrors.length}`);

    expect(criticalErrors).toHaveLength(0);
  });

  test('deal detail page loads without console errors', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
        });
        console.log(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });

    // Navigate to deal detail page with mock data ID
    const dealId = 'd-001';
    await page.goto(`http://localhost:5173/deal/${dealId}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/deal-detail.png' });

    // Check for critical errors
    const criticalErrors = consoleErrors.filter(err =>
      err.text.includes('TypeError') ||
      err.text.includes('Cannot read') ||
      err.text.includes('fmtMoney') ||
      err.text.includes('toLocaleString') ||
      err.text.includes('javascript:')
    );

    console.log(`\nConsole errors found: ${consoleErrors.length}`);
    console.log(`Critical errors found: ${criticalErrors.length}`);

    // List all errors for debugging
    if (consoleErrors.length > 0) {
      console.log('\nAll console errors:');
      consoleErrors.forEach(err => {
        console.log(`  - ${err.text}`);
      });
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('multiple deal pages load without errors', async ({ page }) => {
    const consoleErrors = [];
    const dealIds = ['d-001', 'd-002', 'd-003', 'd-004', 'd-005'];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          dealId: page.url().split('/').pop(),
          text: msg.text(),
        });
      }
    });

    for (const dealId of dealIds) {
      consoleErrors.length = 0; // Clear for each deal
      const url = `http://localhost:5173/deal/${dealId}`;

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1000);

      // Check for critical errors on this deal
      const criticalErrors = consoleErrors.filter(err =>
        err.text.includes('TypeError') ||
        err.text.includes('Cannot read') ||
        err.text.includes('fmtMoney') ||
        err.text.includes('toLocaleString')
      );

      if (criticalErrors.length > 0) {
        console.log(`\nErrors on ${dealId}:`);
        criticalErrors.forEach(err => {
          console.log(`  - ${err.text}`);
        });
      }

      expect(criticalErrors).toHaveLength(0);
    }

    console.log(`\nSmoke tested ${dealIds.length} deal pages - all clean`);
  });
});
