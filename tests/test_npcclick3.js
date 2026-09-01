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
  await page.evaluate((npcId) => {
    const n = NPCS.find(x => x.id === npcId);
    player.x = n.x - 350; player.y = n.y + 20;
    walkToNpc(n);
  }, npcId);

  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500);
    const s = await page.evaluate(() => ({ x: Math.round(player.x), y: Math.round(player.y), npcTalkTarget, mt: moveTarget ? { x: Math.round(moveTarget.x), y: Math.round(moveTarget.y) } : null }));
    console.log(`t=${(i+1)*0.5}s:`, JSON.stringify(s));
  }
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
