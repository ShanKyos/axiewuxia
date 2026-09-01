const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) at identical level/gear, DW should be highest atk + lowest hp/def; DK/DarkLord highest hp/def, lowest atk
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    const results = {};
    for (const sect of ['thieulam','toanchan','baidasan','minhgiao','bug']){
      startGame(sect, null);
      player.level = 80; calcDerived();
      results[sect] = { atk: player.atk, maxHp: player.maxHp, def: player.dDef, range: SECTS[sect].range || 90 };
    }
    return results;
  });
  console.log('1) per-class stats @ level 80 (same gear=none):', JSON.stringify(r1, null, 1));

  const atks = Object.entries(r1).map(([k,v]) => [k, v.atk]);
  const hps = Object.entries(r1).map(([k,v]) => [k, v.maxHp]);
  atks.sort((a,b) => b[1]-a[1]);
  hps.sort((a,b) => b[1]-a[1]);
  console.log('  atk ranking (highest first):', atks.map(x=>x[0]).join(' > '));
  console.log('  hp ranking (highest first):', hps.map(x=>x[0]).join(' > '));
  console.log('  expected atk: baidasan highest, thieulam/bug lowest; expected hp: thieulam/bug highest, baidasan lowest');

  // 2) full regression-relevant sanity: a DW at level 80, firing at realistic combat pacing (re-aims
  // each shot like real play, not one stale snapshot angle), can still kill a normal mob at range
  const r2 = await page.evaluate(() => {
    startGame('baidasan', null);
    player.level = 80; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    travelTo('chungnam');
    mobs.length = 0; // isolate the target — chungnam already has its own pack mobs that would otherwise absorb the hits
    const m = spawnMob('boar', { x: player.x + 300, y: player.y, r: 5, count: 1 }, null);
    m.def = { ...m.def, aggro: 0 }; // hold the target still — isolate DW's own basic-attack damage, not mob movement/aggro interplay
    let shots = 0;
    for (let i = 0; i < 150 && !m.dead; i++){
      update(0.1);
      if (player.cd.basic <= 0){ doBasic(); shots++; }
    }
    return { killed: m.dead, shotseen: shots, dwAtk: player.atk, mobMaxHp: m.maxHp };
  });
  console.log('2) DW kills a normal mob at range under realistic combat pacing:', JSON.stringify(r2));

  // 3) a Dark Knight tanking hits retains meaningfully more HP% than a Dark Wizard after the same
  // fixed window of sustained attack (tankiness gap is real, not swamped by passive HP regen)
  const r3 = await page.evaluate(() => {
    function survive(sect){
      startGame(sect, null);
      player.level = 60; calcDerived(); player.hp = player.maxHp;
      travelTo('chungnam');
      mobs.length = 0;
      const m = spawnMob('boar', { x: player.x + 30, y: player.y, r: 5, count: 1 }, null);
      m.def = { ...m.def, aggro: 9999, atk: m.def.atk * 20 }; // hard-hitting attacker so the fight actually progresses within the window, not swamped by passive regen
      let ticks = 0;
      while (player.hp > 0 && ticks < 300){ update(0.1); ticks++; }
      return { ticksSurvived: ticks, diedWithin300: ticks < 300, maxHp: player.maxHp, def: player.dDef };
    }
    return { dk: survive('thieulam'), dw: survive('baidasan') };
  });
  console.log('3) tankiness gap — ticks survived under a hard-hitting attacker (DK should outlast DW):', JSON.stringify(r3));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
