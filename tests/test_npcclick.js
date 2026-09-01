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

  // 1) directly test walkToNpc() -> auto-walk -> auto-talk on arrival, using the first quest NPC
  const npcInfo = await page.evaluate(() => {
    const n = NPCS.find(x => x.map === curMap && x.talk === 'quest');
    if (!n) return null;
    return { id: n.id, name: n.name, x: n.x, y: n.y };
  });
  console.log('picked quest NPC:', JSON.stringify(npcInfo));

  const before = await page.evaluate(() => ({ x: player.x, y: player.y, panelHidden: document.getElementById('panel-quest').classList.contains('hidden') }));
  console.log('before walkToNpc:', JSON.stringify(before));

  await page.evaluate((npcId) => {
    const n = NPCS.find(x => x.id === npcId);
    walkToNpc(n);
  }, npcInfo.id);
  await page.waitForTimeout(200);
  const midWalk = await page.evaluate(() => ({ npcTalkTarget, moveTarget: moveTarget ? { x: Math.round(moveTarget.x), y: Math.round(moveTarget.y) } : null }));
  console.log('right after walkToNpc (should have npcTalkTarget + moveTarget set):', JSON.stringify(midWalk));

  await page.waitForTimeout(6000); // let auto-walk run until arrival
  const after = await page.evaluate(() => ({
    x: Math.round(player.x), y: Math.round(player.y),
    npcTalkTarget, moveTarget,
    panelHidden: document.getElementById('panel-quest').classList.contains('hidden'),
    panelHtmlSnippet: document.getElementById('panel-quest').innerHTML.slice(0, 80),
  }));
  console.log('after arrival (panelHidden should be false, npcTalkTarget/moveTarget null):', JSON.stringify(after));
  await page.screenshot({ path: '/tmp/npcclick_arrived.png' });

  // 2) test click simulation via mousedown on canvas landing on an NPC (world->screen projection)
  await page.evaluate(() => { closePanels(); });
  await page.waitForTimeout(200);
  const clickTest = await page.evaluate((npcId) => {
    const n = NPCS.find(x => x.id === npcId);
    // teleport player away first so we can observe the walk actually happening
    player.x = n.x - 400; player.y = n.y;
    const sx = n.x - camera.x, sy = (n.y - 25) - camera.y;
    return { sx, sy, npcX: n.x, npcY: n.y, playerX: player.x };
  }, npcInfo.id);
  console.log('simulating mousedown at NPC screen pos:', JSON.stringify(clickTest));
  await page.mouse.move(clickTest.sx, clickTest.sy);
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  await page.waitForTimeout(200);
  const afterClick = await page.evaluate(() => ({ npcTalkTarget, hasMoveTarget: !!moveTarget }));
  console.log('after simulated left-click on NPC sprite:', JSON.stringify(afterClick));

  // 3) sanity: left-click on EMPTY ground still attacks (no npcTalkTarget set), no regression
  await page.evaluate(() => { npcTalkTarget = null; moveTarget = null; });
  await page.mouse.move(640, 450); // roughly screen center, likely empty ground
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  await page.waitForTimeout(100);
  const emptyClick = await page.evaluate(() => ({ npcTalkTarget }));
  console.log('after left-click on empty ground (npcTalkTarget should stay null):', JSON.stringify(emptyClick));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
