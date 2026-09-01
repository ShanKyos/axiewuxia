const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) DK Twisting Slash → 'windslash', MG Fire Slash → 'fireslash', Elf Multi-Shot → arrow proj, 5 shots
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    function castA(sect){
      startGame(sect, null);
      player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      travelTo('chungnam');
      const m = spawnMob('boar', { x: player.x + 40, y: player.y, r: 5, count: 1 }, null);
      effects.length = 0; projectiles.length = 0;
      player.cd.a = 0;
      castSkill('a');
      return { vfxStyles: effects.filter(e => e.type === 'vfx').map(e => e.style), projStyles: projectiles.map(p => p.style), projCount: projectiles.length };
    }
    return { dk: castA('thieulam'), mg: castA('minhgiao'), elf: castA('toanchan') };
  });
  console.log('1) per-class skillA VFX:', JSON.stringify(r1));

  // 2) DW/Elf basic attack (Space) fires a ranged projectile; DK/MG/Dark Lord stay melee (instant hit, no projectile)
  const r2 = await page.evaluate(() => {
    function testBasic(sect, dist0){
      startGame(sect, null);
      player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      travelTo('chungnam');
      const m = spawnMob('boar', { x: player.x + dist0, y: player.y, r: 5, count: 1 }, null);
      const hpBefore = m.hp;
      projectiles.length = 0;
      player.cd.basic = 0;
      doBasic();
      return { rangedSectValue: SECTS[sect].range || 90, spawnedProjectile: projectiles.length > 0, projKind: projectiles[0] && projectiles[0].kind, projStyle: projectiles[0] && projectiles[0].style, instantHpDrop: m.hp < hpBefore };
    }
    return {
      dw: testBasic('baidasan', 300),   // within DW's 420 range, well beyond melee — must be a projectile, not instant
      elf: testBasic('toanchan', 300),  // within Elf's 380 range
      dk: testBasic('thieulam', 60),    // within DK's melee 90 range — must be instant hit, no projectile
      mg: testBasic('minhgiao', 60),
      dl: testBasic('bug', 60),
    };
  });
  console.log('2) per-class basic-attack range/style:', JSON.stringify(r2));

  // 3) AUTO stops at range for a ranged class (Dark Wizard) instead of walking into melee distance
  const r3 = await page.evaluate(() => {
    startGame('baidasan', null);
    player.level = 60; questIdx = 20; questState = 'active'; calcDerived(); player.hp = player.maxHp; player.potions = 5;
    travelTo('chungnam');
    mobs.length = 0;
    const m = spawnMob('boar', { x: player.x + 350, y: player.y, r: 5, count: 1 }, null);
    m.def = { ...m.def, aggro: 0 }; // neutral — isolate AUTO's own approach behavior, not mob aggro pulling player in
    toggleAuto();
    let minDist = Infinity, fired = false;
    for (let i = 0; i < 200; i++){
      update(0.1);
      const d = dist(player.x, player.y, m.x, m.y);
      minDist = Math.min(minDist, d);
      if (projectiles.some(p => p.kind === 'basic')) fired = true;
    }
    return { minDistReached: Math.round(minDist), fired, dwRange: SECTS.baidasan.range };
  });
  console.log('3) AUTO stops at ranged distance instead of closing to melee:', JSON.stringify(r3));

  // 4) render loop survives with the 2 new drawVfx styles + arrow proj style active
  const r4 = await page.evaluate(() => {
    effects.length = 0; projectiles.length = 0;
    addEffect({ type:'vfx', style:'windslash', x:player.x, y:player.y, face:0, r:120, c1:'#8ac8ff', c2:'#cfe8ff', glyph:'絕', dur:0.55 });
    addEffect({ type:'vfx', style:'fireslash', x:player.x, y:player.y, face:0, r:120, c1:'#ff8a3a', c2:'#ffcf7a', glyph:'絕', dur:0.55 });
    projectiles.push({ x:player.x, y:player.y, ang:0, speed:400, dmg:10, kind:'basic', life:1, color:'#3a9d8b', style:'arrow' });
    for (let i = 0; i < 15; i++){ update(0.05); render(); }
    return { ok: true };
  });
  console.log('4) render loop with new styles survives:', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
