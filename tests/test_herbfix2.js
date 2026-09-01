const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 17; calcDerived();
    travelTo('ngoai');
    // nhận nhiệm vụ chính #12 (collect trên ngoai) rồi hái ở các bãi Outskirts
    // (trước dùng side quest s_jy48 — đã bị gỡ khi gom 66 nhiệm vụ phụ xuống 13)
    player.quest = 12; player.qprog = 0;
    const sq = QUESTS.find(q => q.id === 12);
    const before = player.herbCount || 0;
    let harvested = 0;
    for (const spot of HERB_SPOTS.ngoai){
      player.x = spot.x; player.y = spot.y;
      const ok = tryHarvestHerb();
      if (ok) harvested++;
    }
    const after = player.herbCount || 0;
    return { before, after, harvested, progAfter: player.qprog, need: sq.need };
  });
  console.log(JSON.stringify(r));
  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
