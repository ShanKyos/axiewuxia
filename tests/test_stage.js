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

  // Unlock daohoa waypoint via a real travel first (simulating having been sent there once)
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(300);

  // Open world map panel, check for the Chọn Trận button on daohoa
  await page.evaluate(() => { togglePanel('map'); });
  await page.waitForTimeout(200);
  const mapHtml = await page.evaluate(() => document.getElementById('panel-map').innerHTML);
  console.log('has Chọn Trận button for daohoa:', mapHtml.includes("openStageSelect('daohoa')"));
  await page.screenshot({ path: '/tmp/stage_mappanel.png' });

  // Open stage select for daohoa
  await page.evaluate(() => { openStageSelect('daohoa'); });
  await page.waitForTimeout(200);
  const stageHtml = await page.evaluate(() => document.getElementById('panel-stage').innerHTML);
  console.log('stage list length (rows w/ Vào Đánh):', (stageHtml.match(/Vào Đánh/g) || []).length);
  await page.screenshot({ path: '/tmp/stage_select.png' });

  // Enter the first stage (index 0)
  const before = await page.evaluate(() => ({ x: player.x, y: player.y, auto: player.auto, hp: player.hp }));
  await page.evaluate(() => { enterStage('daohoa', 0); });
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => ({ x: player.x, y: player.y, auto: player.auto, curMap }));
  console.log('before:', JSON.stringify(before));
  console.log('after entering stage 0:', JSON.stringify(after));
  await page.screenshot({ path: '/tmp/stage_entered.png' });

  // Let combat run for a while with ZERO manual input (no WASD, no clicks) — this is the whole point
  await page.waitForTimeout(6000);
  const combatState = await page.evaluate(() => ({
    playerHp: player.hp,
    mobsNearby: mobs.filter(m => dist(m.x, m.y, player.x, player.y) < 300).length,
    anyMobDead: mobs.some(m => m.dead),
    playerMoved: dist(player.x, player.y, window.__enterX || player.x, window.__enterY || player.y),
  }));
  console.log('combat state after 6s idle (no manual input):', JSON.stringify(combatState));
  await page.screenshot({ path: '/tmp/stage_combat.png' });

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
