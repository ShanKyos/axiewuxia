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
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(300);

  await page.evaluate(() => { openStageSelect('daohoa'); });
  await page.waitForTimeout(200);
  const stageHtml = await page.evaluate(() => document.getElementById('panel-stage').innerHTML);
  console.log('has TRÙM VÙNG section:', stageHtml.includes('TRÙM VÙNG'));
  console.log('boss rows (Đến Gần):', (stageHtml.match(/Đến Gần/g) || []).length);
  console.log('has PHÓ BẢN section:', stageHtml.includes('PHÓ BẢN'));
  console.log('has Vào Phó Bản button:', stageHtml.includes('Vào Phó Bản'));
  await page.screenshot({ path: '/tmp/stage2_full.png' });

  // scroll to bottom to capture full list in a second shot
  await page.evaluate(() => { document.getElementById('panel-stage').scrollTop = 999999; });
  await page.screenshot({ path: '/tmp/stage2_bottom.png' });

  // click "Đến Gần" on the first boss (thủ vệ #1), verify AUTO stays off
  await page.evaluate(() => { player.auto = false; updateAutoBtn(); });
  const bd = await page.evaluate(() => BOSS_DEFS['daohoa'].thuve[0].id);
  await page.evaluate((bossId) => { enterBossStage('daohoa', bossId); }, bd);
  await page.waitForTimeout(300);
  const afterBoss = await page.evaluate(() => ({ x: Math.round(player.x), y: Math.round(player.y), auto: player.auto }));
  console.log('after enterBossStage (auto should stay false):', JSON.stringify(afterBoss));
  await page.screenshot({ path: '/tmp/stage2_bossapproach.png' });

  // click "Vào Phó Bản"
  await page.evaluate(() => { travelTo('pb_daohoa'); });
  await page.waitForTimeout(300);
  const afterDgn = await page.evaluate(() => ({ curMap, dungeon: !!(typeof DGN !== 'undefined' && DGN) }));
  console.log('after entering dungeon:', JSON.stringify(afterDgn));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
