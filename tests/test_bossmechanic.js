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

  // Setup: lv100 char, invulnerable via god cheat equiv (direct hp refill), enter pb_nhanmon (amthan boss, full 5-move kit)
  const setup = await page.evaluate(() => {
    player.level = 110; player.xp = 0; player.free = 0; player.equip = {};
    player.str = 300; player.agi = 300; player.def = 300; player.vit = 300;
    questIdx = 35; questState = 'active';
    calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    player.auto = true; // bật auto trước để test có bị tắt khi boss xuất hiện không
    travelTo('pb_nhanmon');
    return { curMap, autoBefore: player.auto };
  });
  console.log('setup:', JSON.stringify(setup));

  // Clear 3 waves + Trấn Ải quickly via hurtMob big damage, wait for hunt boss to spawn (1.8s real timer)
  const r1 = await page.evaluate(async () => {
    let ticks = 0;
    while (ticks < 3000 && !(DGN && DGN.huntSpawned)){
      if (player.hp < player.maxHp) player.hp = player.maxHp;
      for (const m of mobs) if (!m.dead && m.hp > 0) hurtMob(m, 999999, 'hit');
      update(0.05);
      ticks++;
      if (ticks % 40 === 0) await new Promise(res => setTimeout(res, 20));
    }
    return {
      ticks, huntSpawned: DGN && DGN.huntSpawned,
      huntBossName: DGN && DGN.huntRef ? DGN.huntRef.def.name : null,
      huntBossSize: DGN && DGN.huntRef ? DGN.huntRef.def.size : null,
      huntBossMoves: DGN && DGN.huntRef ? DGN.huntRef.def.moves : null,
      huntBossMoveT: DGN && DGN.huntRef ? DGN.huntRef.moveT : null,
      autoAfterSpawn: player.auto,
      shakeT, shakeMag,
    };
  });
  console.log('after waves cleared, hunt boss spawn check:', JSON.stringify(r1));

  // Re-enable auto to confirm _bossNear now also triggers for hunt boss (bossKind inherited)
  const r2 = await page.evaluate(() => {
    player.auto = true; player._autoAX = player.x; player._autoAY = player.y; updateAutoBtn();
    return { auto: player.auto };
  });
  console.log('re-enabled auto:', JSON.stringify(r2));

  // Run several seconds, watch for a telegraph (m.tele) to appear on the hunt boss at least once,
  // and confirm damage-on-resolve / dodge logic doesn't crash. Track player HP too.
  const r3 = await page.evaluate(async () => {
    let sawTele = false, teleKind = null, ticks = 0;
    const hpLog = [];
    while (ticks < 2400){ // 120 sim sec
      update(0.05);
      ticks++;
      const hb = DGN && DGN.huntRef;
      if (hb && hb.tele && !sawTele){ sawTele = true; teleKind = hb.tele.mvId; }
      if (ticks % 400 === 0) hpLog.push({ t: +(ticks*0.05).toFixed(1), hp: Math.round(player.hp), bossHp: hb ? Math.round(hb.hp) : null, bossDead: hb ? hb.dead : null });
      if (hb && hb.dead) break;
    }
    return { ticks, sawTele, teleKind, hpLog, bossDeadFinal: DGN && DGN.huntRef ? DGN.huntRef.dead : null, huntCleared: DGN && DGN.huntCleared };
  });
  console.log('combat trace:', JSON.stringify(r3, null, 1));

  // Now confirm the respawn-guard fix: wait 60+ sim seconds after boss death, should NOT crash
  const r4 = await page.evaluate(async () => {
    let ticks = 0;
    while (ticks < 1400){ update(0.05); ticks++; if (ticks % 40 === 0) await new Promise(res => setTimeout(res, 5)); }
    return { ticksAfterDeath: ticks, ok: true };
  });
  console.log('post-death 70s wait (respawn-guard check):', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
