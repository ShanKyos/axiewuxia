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
  await page.waitForTimeout(800);

  // 1) WASD should NOT move the player at all
  const before = await page.evaluate(() => ({ x: player.x, y: player.y }));
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1000);
  await page.keyboard.up('KeyD');
  const afterWasd = await page.evaluate(() => ({ x: player.x, y: player.y }));
  console.log('WASD test — before:', JSON.stringify(before), 'after holding D 1s:', JSON.stringify(afterWasd));
  console.log('WASD moved player?', (Math.abs(before.x - afterWasd.x) > 1 || Math.abs(before.y - afterWasd.y) > 1));

  // 2) joystick: game is PC-only now, so the element must be GONE, not merely hidden.
  //    (Bài này trước đây đòi nó có class 'hidden' — nhưng ẩn một nút cảm ứng không phải là
  //    bỏ điều khiển cảm ứng. Điều đáng gác là nó không còn tồn tại.)
  const joyGone = await page.evaluate(() => !document.getElementById('joystick'));
  console.log('joystick element removed:', joyGone);
  if (!joyGone) console.log('FAIL joystick vẫn còn trong DOM dù game đã là PC-only');

  // 3) click-to-move (right-click / setMoveTarget) should still auto-walk the player
  const beforeClick = await page.evaluate(() => ({ x: player.x, y: player.y }));
  await page.evaluate(() => { setMoveTarget(player.x + 300, player.y); });
  await page.waitForTimeout(2000);
  const afterClick = await page.evaluate(() => ({ x: player.x, y: player.y }));
  console.log('click-to-move — before:', JSON.stringify(beforeClick), 'after 2s auto-walk:', JSON.stringify(afterClick));
  console.log('auto-walked toward target?', (afterClick.x - beforeClick.x) > 50);

  // 4) same-map quest beacon (goToBeacon) should auto-walk too
  await page.evaluate(() => { player.beacon = { map: curMap, x: player.x - 250, y: player.y, label: 'Test Beacon' }; goToBeacon(); });
  await page.waitForTimeout(2000);
  const afterBeacon = await page.evaluate(() => ({ x: player.x, y: player.y, beacon: player.beacon }));
  console.log('after goToBeacon same-map auto-walk:', JSON.stringify(afterBeacon));

  // 5) AUTO farm via Chọn Trận should still work (travelTo + enterStage movement untouched)
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { enterStage('daohoa', 0); });
  await page.waitForTimeout(300);
  const autoState1 = await page.evaluate(() => ({ auto: player.auto, x: Math.round(player.x), y: Math.round(player.y) }));
  await page.waitForTimeout(4000);
  const autoState2 = await page.evaluate(() => ({ auto: player.auto, x: Math.round(player.x), y: Math.round(player.y), hp: Math.round(player.hp) }));
  console.log('AUTO farm right after enterStage:', JSON.stringify(autoState1));
  console.log('AUTO farm after 4s (should be fighting/chasing mobs):', JSON.stringify(autoState2));

  // 6) boss approach (enterBossStage) should still work, auto stays off
  await page.evaluate(() => { player.auto = false; updateAutoBtn(); });
  const bd = await page.evaluate(() => BOSS_DEFS['daohoa'].thuve[0].id);
  await page.evaluate((bossId) => { enterBossStage('daohoa', bossId); }, bd);
  await page.waitForTimeout(300);
  const bossState = await page.evaluate(() => ({ x: Math.round(player.x), y: Math.round(player.y), auto: player.auto }));
  console.log('after enterBossStage:', JSON.stringify(bossState));

  // 7) tutorial step 0 text updated, no WASD mention
  const tutText = await page.evaluate(() => TUT_STEPS[0].txt);
  console.log('tutorial step 0 text:', tutText);

  await page.screenshot({ path: '/tmp/nomove_final.png' });
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
