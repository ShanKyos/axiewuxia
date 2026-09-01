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

  const npcId = await page.evaluate(() => NPCS.find(x => x.map === curMap && x.talk === 'quest').id);

  // Teleport player far from NPC, snap camera, then compute exact screen coords for the NPC
  const coords = await page.evaluate((npcId) => {
    const n = NPCS.find(x => x.id === npcId);
    player.x = n.x - 350; player.y = n.y + 20;
    snapCamera();
    return { sx: n.x - camera.x, sy: (n.y - 25) - camera.y, playerX: Math.round(player.x), playerY: Math.round(player.y) };
  }, npcId);
  console.log('click coords:', JSON.stringify(coords));

  await page.mouse.move(coords.sx, coords.sy);
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  await page.waitForTimeout(80);
  const justAfterClick = await page.evaluate(() => ({ npcTalkTarget, hasMoveTarget: !!moveTarget }));
  console.log('80ms after click (should have npcTalkTarget set, not yet arrived):', JSON.stringify(justAfterClick));

  await page.waitForTimeout(3000);
  const arrived = await page.evaluate(() => ({
    npcTalkTarget, moveTarget,
    panelHidden: document.getElementById('panel-quest').classList.contains('hidden'),
  }));
  console.log('3s later (should be arrived, panel open):', JSON.stringify(arrived));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
