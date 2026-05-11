const { test } = require('@playwright/test');
test('v6 screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 980 });
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/v6-1680.png' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/v6-1280.png' });
});
