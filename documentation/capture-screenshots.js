const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

const LOGIN = {
  email: 'admin@test.com',
  password: 'admin123'
};

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function captureRoute(page, route, fileName) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, fileName), fullPage: true });
  console.log(`Captured: ${fileName}`);
}

async function getAnyTripId(page) {
  try {
    const tripId = await page.evaluate(async () => {
      const response = await fetch('/api/trips', { credentials: 'include' });
      if (!response.ok) return null;
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return data[0].id || null;
    });

    return tripId;
  } catch (error) {
    console.error('Unable to load trip ID:', error.message);
    return null;
  }
}

async function run() {
  ensureOutputDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await captureRoute(page, '/app/login', '01-login.png');

    await page.fill('#email', LOGIN.email);
    await page.fill('#password', LOGIN.password);

    await Promise.all([
      page.waitForURL('**/app', { timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-dashboard.png'), fullPage: true });
    console.log('Captured: 02-dashboard.png');

    await captureRoute(page, '/app/trips', '03-trips.png');

    const tripId = await getAnyTripId(page);
    if (tripId) {
      await captureRoute(page, `/app/trips/${tripId}`, '04-trip-details.png');
    }

    await captureRoute(page, '/app/trips/new', '05-new-trip.png');
    await captureRoute(page, '/app/expenses', '06-expenses.png');
    await captureRoute(page, '/app/expenses/new', '07-new-expense.png');
    await captureRoute(page, '/app/advances', '08-advances.png');
    await captureRoute(page, '/app/advances/new', '09-new-advance.png');
    await captureRoute(page, '/app/approvals', '10-approvals.png');
    await captureRoute(page, '/app/analytics', '11-analytics.png');
    await captureRoute(page, '/app/settings', '12-settings.png');

    console.log('\nScreenshot capture completed successfully.');
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
