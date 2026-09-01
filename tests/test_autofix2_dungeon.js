const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  const r4 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; questIdx = 35; questState = 'active'; calcDerived(); player.hp = player.maxHp; player.potions = 5;
    travelTo('pb_daohoa');
    toggleAuto();
    let sawWave2 = false, diedOrFailed = false;
    for (let i = 0; i < 500; i++){
      update(0.1);
      if (DGN && DGN.wave >= 2) sawWave2 = true;
      if (DGN && DGN.cleared) break;
      if (dead || (DGN && DGN.failed)){ diedOrFailed = true; break; }
    }
    return { cleared: DGN ? DGN.cleared : null, sawWave2, diedOrFailed };
  });
  console.log('4)', JSON.stringify(r4));
  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
