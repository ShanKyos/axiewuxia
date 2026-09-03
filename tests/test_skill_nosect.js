const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  // baidasan has no VOHOC school defined -> Trấn Phái tab should show a graceful placeholder, not crash
  await page.evaluate(() => { startGame('baidasan', null); });
  await page.waitForTimeout(500);
  await page.evaluate(() => { togglePanel('skill'); });
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => ({
    rowCount: document.querySelectorAll('#panel-skill .skill-row').length, // should be 2 (just a+tp)
    htmlLen: document.getElementById('panel-skill').innerHTML.length,
  }));
  console.log('baidasan (no VOHOC school) Trấn Phái tab:', JSON.stringify(state));
  await page.screenshot({ path: '/tmp/skill_nosect.png' });
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
