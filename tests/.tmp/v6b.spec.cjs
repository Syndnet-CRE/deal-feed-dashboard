const { test } = require('@playwright/test');
test('v6b deal card imagery', async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 980 });
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/tmp/v6b-1680.png' });
});
