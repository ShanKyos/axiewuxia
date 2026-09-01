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
  await page.waitForTimeout(300);

  const setup = await page.evaluate(() => {
    player.level = 15; questIdx = 35; questState = 'active';
    calcDerived(); player.hp = player.maxHp;
    travelTo('pb_daohoa');
    return { curMap, timeLimit: DGN.def.timeLimit, timeLeft: DGN.timeLeft, failed: DGN.failed };
  });
  console.log('1) setup, initial timer state:', JSON.stringify(setup));

  // 2) Let some real time pass via update(dt) ticks, confirm timeLeft decrements correctly (dt-driven, not real-time)
  const r2 = await page.evaluate(() => {
    for (let i = 0; i < 100; i++) update(0.05); // 5 sim seconds
    return { timeLeft: DGN.timeLeft, expected: 480 - 5 };
  });
  console.log('2) after 5 sim-sec, timer decremented correctly:', JSON.stringify(r2));

  // 3) Force timeLeft to near-zero and confirm failure triggers, blocking further wave progression
  const r3 = await page.evaluate(() => {
    DGN.timeLeft = 0.02;
    const waveBefore = DGN.wave;
    update(0.05); // sẽ đẩy timeLeft xuống <=0 → fail
    const failedNow = DGN.failed;
    const bannerText = zoneBanner ? zoneBanner.text : null;
    // xác nhận không còn xử lý đợt/thưởng nữa dù mobs đã chết hết
    for (const m of mobs) if (!m.dead) hurtMob(m, 999999, 'hit');
    const waveBeforeSecondUpdate = DGN.wave;
    update(0.05);
    const waveAfter = DGN.wave;
    return { waveBefore, failedNow, bannerText, waveBeforeSecondUpdate, waveAfter, stillFailed: DGN.failed, huntCleared: DGN.huntCleared };
  });
  console.log('3) timeout → failure, wave progression halted:', JSON.stringify(r3));

  // 4) drawDungeonHUD should not crash while failed
  const r4 = await page.evaluate(() => {
    try { drawDungeonHUD(); return { ok: true }; } catch (e){ return { ok: false, err: String(e) }; }
  });
  console.log('4) drawDungeonHUD while failed (no crash):', JSON.stringify(r4));

  // 5) re-entering the dungeon (fresh run) should reset timer/failed cleanly
  const r5 = await page.evaluate(() => {
    travelTo('daohoa');
    travelTo('pb_daohoa');
    return { timeLeft: DGN.timeLeft, failed: DGN.failed, wave: DGN.wave };
  });
  console.log('5) fresh re-entry resets timer:', JSON.stringify(r5));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
