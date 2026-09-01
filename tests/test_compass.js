const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);

  // Set a beacon pointing to a different map, like the "different region" quest scenario
  await page.evaluate(() => {
    player.beacon = { map: 'daohoa', x: 700, y: 600, label: 'Săn Tàn Lang' };
  });
  await page.waitForTimeout(300);

  const bannerState = await page.evaluate(() => {
    const b = document.getElementById('quest-compass-banner');
    return { hidden: b.classList.contains('hidden'), html: b.innerHTML };
  });
  console.log('banner state:', JSON.stringify(bannerState));

  await page.screenshot({ path: '/tmp/compass_banner.png' });

  // click the "Đi ngay" button
  await page.click('#quest-compass-banner button');
  await page.waitForTimeout(500);
  const afterClick = await page.evaluate(() => ({ curMap, x: player.x, y: player.y }));
  console.log('after click:', JSON.stringify(afterClick));

  console.log('page errors:', JSON.stringify(errors.slice(0,10)));
  await browser.close();
})();
