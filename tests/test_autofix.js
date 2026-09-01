const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // Bug #1: anchor reset on travelTo/respawn
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp;
    toggleAuto();
    player._autoAX = 111; player._autoAY = 222; // simulate stale anchor from a previous map/dungeon
    travelTo('chungnam');
    const afterTravel = { ax: player._autoAX, ay: player._autoAY, px: player.x, py: player.y };
    update(0.1); // one frame should re-anchor via the null-check in the AUTO block
    const afterFrame = { ax: player._autoAX, ay: player._autoAY };
    // now test respawn()
    player._autoAX = 999; player._autoAY = 999;
    dead = true;
    respawn();
    const afterRespawn = { ax: player._autoAX, ay: player._autoAY };
    return { afterTravel, afterFrame, afterRespawn };
  });
  console.log('1) anchor nulled on travelTo (re-anchors next frame) and on respawn:', JSON.stringify(r1));

  // Bug #2: boss lock persists across re-toggle
  const r2 = await page.evaluate(() => {
    // fabricate a Devil-Square boss-phase state without running the full arena flow
    DEVIL = { wave: 99, timeLeft: 100, pick: { id: 'boss' }, bossRef: null, cleared: false, failed: false, _endT: 0 };
    const b = spawnMob('boss', { x: player.x, y: player.y, r: 10, count: 1 }, null);
    DEVIL.bossRef = b;
    player.auto = true;
    update(0.1); // should force auto off due to autoBossLockActive()
    const forcedOff = player.auto;
    toggleAuto(); // player tries Z again — should be blocked while lock active
    const stillOff = player.auto;
    b.dead = true; // boss defeated, lock clears
    toggleAuto(); // now it should work
    const reEnabledAfterClear = player.auto;
    DEVIL = null;
    return { forcedOff, stillOff, reEnabledAfterClear };
  });
  console.log('2) boss lock persists on re-toggle, releases once boss is dead:', JSON.stringify(r2));

  // Bug #3: AUTO never proactively walks toward/farms a neutral Du Hiệp even with player.pk on.
  // Isolated repro matching the original report exactly (lone Du Hiệp nearby, nothing else on the
  // map that could confound the result via splash/mount side-effects on some other legit target).
  const r3 = await page.evaluate(() => {
    travelTo('chungnam');
    for (const m of mobs) m.dead = true; // isolate: only our own spawned Du Hiệp should exist
    player.pk = true;
    const dh = spawnMob('duhiep1', { x: player.x + 200, y: player.y, r: 10, count: 1 }, null);
    dh.revenge = false;
    player.auto = true; player._autoAX = player.x; player._autoAY = player.y;
    for (let i = 0; i < 100; i++) update(0.1);
    const neutralSurvivedUnharmed = dh.hp === 1800 && player.x === player._autoAX && player.y === player._autoAY;
    // now flag it as a revenge-seeker — auto SHOULD still be allowed to fight back
    dh.revenge = true;
    for (let i = 0; i < 80; i++) update(0.1);
    const revengeEngaged = dh.hp < 1800;
    player.pk = false;
    return { neutralSurvivedUnharmed, revengeEngaged, dhHpAfter: dh.hp };
  });
  console.log('3) AUTO never touches an isolated neutral Du Hiệp even with PK on, still finishes off revenge ones:', JSON.stringify(r3));

  // Bug #4: stale moveTarget cleared when AUTO is toggled on
  const r4 = await page.evaluate(() => {
    travelTo('tuongduong'); // safe city — no wild mobs to confound the drift measurement
    player.auto = false;
    setMoveTarget(player.x + 900, player.y); // queue a manual move far away
    toggleAuto(); // turn AUTO on — should clear the pending manual move
    const xBefore = player.x;
    for (let i = 0; i < 10; i++) update(0.1); // let a few auto frames pass (no mobs nearby ideally)
    toggleAuto(); // turn AUTO back off
    const xRightAfterToggleOff = player.x;
    for (let i = 0; i < 20; i++) update(0.1);
    const xAfterMoreFrames = player.x;
    const resumedOldMove = Math.abs(xAfterMoreFrames - xRightAfterToggleOff) > 5 && xAfterMoreFrames > xRightAfterToggleOff + 3;
    return { xBefore, xRightAfterToggleOff, xAfterMoreFrames, resumedOldMove };
  });
  console.log('4) old manual moveTarget does not resume after AUTO off:', JSON.stringify(r4));

  // Bug #5: out-of-potion + critical HP auto-disables AUTO with a banner
  const r5 = await page.evaluate(() => {
    player.potions = 0;
    player.hp = player.maxHp * 0.1;
    player.auto = true;
    zoneBanner = null;
    update(0.1);
    return { autoOff: !player.auto, bannerText: zoneBanner ? zoneBanner.text : null };
  });
  console.log('5) AUTO self-disables with a clear banner when out of potions + critical HP:', JSON.stringify(r5));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
