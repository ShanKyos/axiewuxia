const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    travelTo('daohoa');
    player.x = 900; player.y = 600;
    snapCamera();
    spawnMob('boar', { x: player.x + 60, y: player.y, r: 30, count: 1 }, undefined, true);
  });
  await page.waitForTimeout(80); // capture early in the beam's 0.6s fade so it's still bright
  await page.screenshot({ path: '/tmp/spawnvfx_closeup.png' });
  await browser.close();
})();
