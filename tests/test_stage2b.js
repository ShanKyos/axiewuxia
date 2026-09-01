const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { travelTo('daohoa'); player.level = 15; calcDerived(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { travelTo('pb_daohoa'); });
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({ curMap, isDungeon: !!MAPS[curMap].dungeon }));
  console.log('with level 15:', JSON.stringify(state));
  await browser.close();
})();
