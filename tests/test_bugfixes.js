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
  await page.waitForTimeout(500);
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(300);

  // 1) buildWorld fix: mobs spawned at each pack's authored (x,y) should match pk.mob
  const spawnCheck = await page.evaluate(() => {
    const results = [];
    for (const pk of MAPS.daohoa.packs){
      const nearby = mobs.filter(m => !m.dead && dist(m.x, m.y, pk.x, pk.y) < 150);
      const types = [...new Set(nearby.map(m => m.type))];
      results.push({ pack: pk.mob, at: `${pk.x},${pk.y}`, foundTypes: types, correct: types.includes(pk.mob) });
    }
    return results;
  });
  console.log('1) pack type/position match check:');
  spawnCheck.forEach(r => console.log('   ', JSON.stringify(r)));
  console.log('   ALL CORRECT:', spawnCheck.every(r => r.correct));

  // 2) enterStage boss-proximity nudge: packIdx 0 (boar @ 800,520) is ~54px from dh1 boss (780,570)
  const boarPackIdx = await page.evaluate(() => MAPS.daohoa.packs.findIndex(p => p.mob === 'boar'));
  console.log('2) boar pack index:', boarPackIdx);
  await page.evaluate((idx) => { enterStage('daohoa', idx); }, boarPackIdx);
  await page.waitForTimeout(200);
  const afterEnter = await page.evaluate(() => {
    const dh1 = BOSS_DEFS.daohoa.thuve[0];
    const bx = dh1.x * MAP.w, by = dh1.y * MAP.h;
    return { playerX: Math.round(player.x), playerY: Math.round(player.y), distToBoss: Math.round(dist(player.x, player.y, bx, by)), bossPos: {x: bx, y: by} };
  });
  console.log('   after entering boar pack stage (dist to dh1 boss should be >= ~340):', JSON.stringify(afterEnter));

  // let AUTO run and verify it's NOT frozen by boss-near pause, and actually kills boars
  const beforeHp = await page.evaluate(() => player.hp);
  await page.waitForTimeout(6000);
  const afterAuto = await page.evaluate(() => ({ hp: Math.round(player.hp), anyBoarDead: mobs.some(m => m.type === 'boar' && m.dead) }));
  console.log('   after 6s AUTO (hp before:', beforeHp, ') after:', JSON.stringify(afterAuto));

  // 3) setMoveTarget AUTO-block message
  await page.evaluate(() => { player.auto = true; moveTarget = null; });
  const beforeFloats = await page.evaluate(() => floats.length);
  await page.evaluate(() => { setMoveTarget(player.x + 200, player.y); });
  await page.waitForTimeout(50);
  const afterFloats = await page.evaluate(() => ({ moveTarget, floatTexts: floats.slice(-3).map(f=>f.text) }));
  console.log('3) setMoveTarget while AUTO on (moveTarget should stay null, should show a message):', JSON.stringify(afterFloats));

  // 4) dungeon AUTO anchor fix
  await page.evaluate(() => { if (player.auto) toggleAuto(); player.level = 15; calcDerived(); player.hp = player.maxHp; });
  await page.evaluate(() => { travelTo('pb_daohoa'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { toggleAuto(); });
  await page.waitForTimeout(200);
  const anchorCheck = await page.evaluate(() => ({ autoAX: player._autoAX, autoAY: player._autoAY, mobCount: mobs.filter(m=>!m.dead).length }));
  console.log('4) dungeon AUTO anchor right after enabling AUTO at entrance:', JSON.stringify(anchorCheck));
  await page.waitForTimeout(5000);
  const dungeonProgress = await page.evaluate(() => ({ x: Math.round(player.x), y: Math.round(player.y), anyDead: mobs.some(m=>m.dead), aliveCount: mobs.filter(m=>!m.dead).length }));
  console.log('   after 5s AUTO in dungeon (player should have moved toward wave, some mobs dead):', JSON.stringify(dungeonProgress));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
