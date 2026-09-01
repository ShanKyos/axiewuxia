// Phần CÒN GIÁ TRỊ của test_hudrefactor.js sau khi gỡ Tower/Devil/Blood:
// drawArenaHUD() dùng chung vẫn phải vẽ được HUD phó bản (DGN) — cả pha đợt quái lẫn pha Boss Săn.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.silver = 999999;
    const out = {};
    travelTo('pb_daohoa');
    try { drawDungeonHUD(); out.dungeonWaves = 'ok'; } catch (e){ out.dungeonWaves = String(e); }
    // ép sang pha Boss để chạy nhánh thanh máu boss của drawArenaHUD
    try {
      if (DGN){
        DGN.wave = 99;
        DGN.bossRef = spawnMob(DGN.def.boss, { x: player.x, y: player.y, r: 10, count: 1 }, null);
        drawDungeonHUD(); out.dungeonBoss = 'ok';
      } else out.dungeonBoss = 'DGN null';
    } catch (e){ out.dungeonBoss = String(e); }
    out.drawArenaHUDExists = typeof drawArenaHUD === 'function';
    return out;
  });
  console.log('HUD phó bản (drawArenaHUD dùng chung):', JSON.stringify(r, null, 1));
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  const ok = r.dungeonWaves === 'ok' && r.dungeonBoss === 'ok' && r.drawArenaHUDExists && errors.length === 0;
  console.log(ok ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
