const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8080';
const OUT = '/home/user/Entrenador-plan/screenshots';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 390, height: 844 };
const FAKE_USER = { id: 'u1', name: 'Carlos Ruiz', email: 'carlos@demo.com' };

async function shot(page, name, wait = 2500) {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`✓ ${name}`);
}

async function makeAuthContext(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT });

  // API calls go to localhost:3000 (baked into the build)
  await context.route('http://localhost:3000/api/v1/auth/me', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: FAKE_USER }) })
  );
  await context.route('http://localhost:3000/api/v1/sessions**', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { page: 1, limit: 20, total: 0 } }) })
  );
  await context.route('http://localhost:3000/api/v1/nutrition/summary**', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: { totals: { calories: 1840, protein: 142, carbs: 185, fat: 52 } } }) })
  );
  await context.route('http://localhost:3000/api/v1/meals**', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [] }) })
  );
  await context.route('http://localhost:3000/api/v1/plans**', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [] }) })
  );
  await context.route('http://localhost:3000/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  const page = await context.newPage();

  // Pre-set token in localStorage before app boots
  await context.addInitScript(() => {
    localStorage.setItem('access_token', 'preview-token');
    localStorage.setItem('refresh_token', 'preview-refresh');
  });

  return { context, page };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ── Auth screens ────────────────────────────────────────────────────
  const guestCtx = await browser.newContext({ viewport: VIEWPORT });
  const guestPage = await guestCtx.newPage();
  await guestPage.goto(BASE, { waitUntil: 'networkidle' });
  await shot(guestPage, '01-login', 1000);
  try {
    await guestPage.getByText('Regístrate').click();
    await shot(guestPage, '02-register', 1000);
  } catch(e) {}
  await guestCtx.close();

  // ── Logged-in screens ────────────────────────────────────────────────
  const { context, page } = await makeAuthContext(browser);

  const screens = [
    { name: '03-dashboard',  url: `${BASE}/` },
    { name: '04-workouts',   url: `${BASE}/(tabs)/workouts` },
    { name: '05-nutrition',  url: `${BASE}/(tabs)/nutrition` },
    { name: '06-plans',      url: `${BASE}/(tabs)/plans` },
    { name: '07-log',        url: `${BASE}/workout/log` },
  ];

  for (const s of screens) {
    await page.goto(s.url, { waitUntil: 'networkidle' });
    await shot(page, s.name, 2000);
  }

  await context.close();
  await browser.close();
  console.log('\nDone → screenshots/');
})();
