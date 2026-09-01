const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) Splash-damage gap: AoE hitting a legit nearby mob must not also kill a neutral Du Hiệp
  //    bystander while AUTO is on and PK is left on.
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    travelTo('chungnam');
    for (const m of mobs) m.dead = true;
    player.pk = true;
    // a legit farmable mob right next to the player (AUTO will fight it)...
    const wolf = spawnMob('wolf', { x: player.x + 20, y: player.y, r: 10, count: 1 }, null);
    // ...and a neutral Du Hiệp bystander well within any AoE's blast radius of that fight
    const dh = spawnMob('duhiep1', { x: player.x + 60, y: player.y, r: 10, count: 1 }, null);
    dh.revenge = false;
    player.auto = true; player._autoAX = player.x; player._autoAY = player.y;
    for (let i = 0; i < 150 && !wolf.dead; i++) update(0.1);
    player.pk = false;
    return { wolfDead: wolf.dead, dhHp: dh.hp, dhSurvivedFullHp: dh.hp === 1800 };
  });
  console.log('1) AoE splash from a legit AUTO fight leaves a neutral Du Hiệp bystander untouched (PK on, AUTO on):', JSON.stringify(r1));

  // 2) Control: manual play (AUTO off) with PK on can still deliberately splash a Du Hiệp caught in
  //    an AoE blast — this is intentional PK behavior and must not have been broken by fix #1.
  const r2 = await page.evaluate(() => {
    travelTo('chungnam');
    for (const m of mobs) m.dead = true;
    player.pk = true;
    player.auto = false;
    const dh = spawnMob('duhiep1', { x: player.x + 50, y: player.y, r: 10, count: 1 }, null);
    dh.revenge = false;
    // directly exercise the AoE damage path used by castVohoc's 'aoe'/'cone' hitMob closure via hurtMob
    hurtMob(dh, 500, 'crit');
    const dmgApplied = dh.hp < 1800;
    player.pk = false;
    return { dmgApplied, dhHpAfter: dh.hp };
  });
  console.log('2) manual (AUTO off) + PK on still lets damage land on a nearby Du Hiệp (unchanged intended behavior):', JSON.stringify(r2));

  // 3) Single-pack restriction: two separate packs within AUTO range — AUTO should only ever
  //    engage the nearer pack, never touch the farther one, even after clearing the first.
  const r3 = await page.evaluate(() => {
    travelTo('daohoa');
    for (const m of mobs) m.dead = true;
    player.level = 60; calcDerived(); player.hp = player.maxHp;
    const zoneA = { x: player.x + 80, y: player.y, r: 40, count: 2 };
    const zoneB = { x: player.x + 350, y: player.y, r: 40, count: 2 }; // still within default 430 range
    const a1 = spawnMob('boar', zoneA, null); a1.zone = zoneA;
    const a2 = spawnMob('boar', zoneA, null); a2.zone = zoneA;
    const b1 = spawnMob('boar', zoneB, null); b1.zone = zoneB;
    const b2 = spawnMob('boar', zoneB, null); b2.zone = zoneB;
    // neutralize pack B's own proactive aggro so this test isolates AUTO's targeting behavior —
    // otherwise a wandering boar could notice+attack the player on its own (unrelated mechanic,
    // same as any mob-initiated fight, and would happen identically with AUTO off)
    b1.def = { ...b1.def, aggro: 0 }; b2.def = { ...b2.def, aggro: 0 };
    player.auto = true; player._autoAX = player.x; player._autoAY = player.y;
    player._autoZone = null; player._autoZoneLocked = false;
    for (let i = 0; i < 300 && !(a1.dead && a2.dead); i++) update(0.1);
    const packACleared = a1.dead && a2.dead;
    const packBUntouched = b1.hp === b1.def.hp && b2.hp === b2.def.hp && !b1.dead && !b2.dead;
    const lockedZoneIsA = player._autoZone === zoneA;
    // now let a few more frames pass with pack A dead — AUTO must NOT drift to pack B
    for (let i = 0; i < 50; i++) update(0.1);
    const stillUntouchedAfterWaiting = b1.hp === b1.def.hp && b2.hp === b2.def.hp;
    const returnedToAnchor = Math.hypot(player.x - player._autoAX, player.y - player._autoAY) < 65;
    return { packACleared, packBUntouched, lockedZoneIsA, stillUntouchedAfterWaiting, returnedToAnchor };
  });
  console.log('3) AUTO only farms the locked pack, never spreads to a second pack within range:', JSON.stringify(r3));
  // 4) dungeon AUTO full-clear sanity check lives in test_autofix2_dungeon.js on its own fresh
  //    page — chaining it after r1-r3 in this shared session showed cross-test state pollution
  //    (confirmed unrelated to the fix itself), so it's isolated there for a clean signal.

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
