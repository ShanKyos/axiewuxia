const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.SHOW_OBSTACLES = true; curMap = 'daohoa'; });

  const spots = [
    ['nw', 500, 500], ['w', 700, 900], ['center', 1300, 800], ['e', 1900, 700], ['se', 1600, 1300],
  ];
  for (const [name, x, y] of spots) {
    await page.evaluate(({x,y}) => { player.x = x; player.y = y; }, {x,y});
    await page.waitForTimeout(150);
    await page.screenshot({ path: `/tmp/dh_${name}.png` });
  }
  await browser.close();
})();
