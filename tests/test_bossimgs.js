const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const ids = ['boss_cotma1','boss_hacnu1','boss_hoangkim1','boss_amthan'];
    return ids.map(id => {
      const img = MOB_IMGS[id];
      return { id, src: img && img.src, complete: img && img.complete, w: img && img.naturalWidth, h: img && img.naturalHeight };
    });
  });
  console.log(JSON.stringify(r, null, 1));
  console.log('errors:', JSON.stringify(errors));
  await browser.close();
})();
