const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); player.level = 30; calcDerived(); player.hp=player.maxHp; player.qi=player.maxQi; });
  await page.waitForTimeout(500);
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(300);
  const packInfo = await page.evaluate(() => MAPS.daohoa.packs.map((p,i) => ({i, mob:p.mob, bossKind: !!(MOBS[p.mob]&&MOBS[p.mob].bossKind)})));
  console.log('packs:', JSON.stringify(packInfo));
  // pick first non-boss pack
  const idx = packInfo.find(p => !p.bossKind)?.i ?? 0;
  await page.evaluate((idx) => { enterStage('daohoa', idx); }, idx);
  await page.waitForTimeout(6000);
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll('#combat-log .cl-row')).map(r => r.textContent));
  console.log('picked pack idx', idx, 'rows:', JSON.stringify(rows.slice(0,15), null, 2));
  console.log('errors:', JSON.stringify(errors.slice(0,10)));
  await browser.close();
})();
