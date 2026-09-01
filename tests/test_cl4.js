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

  // directly invoke hurtMob on a live mob to test ⚔ + ☠ log lines, bypassing AUTO/boss-proximity noise
  const result = await page.evaluate(() => {
    const m = mobs.find(mm => !mm.dead && !mm.def.bossKind && mm.type !== 'boss');
    if (!m) return { error: 'no mob found' };
    const hpBefore = m.hp;
    hurtMob(m, 50, 'hit');
    hurtMob(m, 50, 'crit');
    hurtMob(m, 999999, 'hit'); // should kill it
    return { mobName: m.def.name, hpBefore, dead: m.dead };
  });
  console.log('hurtMob test result:', JSON.stringify(result));
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll('#combat-log .cl-row')).map(r => r.textContent));
  console.log('log rows:', JSON.stringify(rows, null, 2));
  console.log('errors:', JSON.stringify(errors.slice(0,10)));
  await browser.close();
})();
