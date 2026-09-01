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
  await page.evaluate(() => { player.free = 237; togglePanel('char'); });
  await page.waitForTimeout(200);

  // 1) qty input + "+" button adds N at once
  const before = await page.evaluate(() => ({ str: player.str, free: player.free }));
  await page.evaluate(() => { document.getElementById('qty-str').value = 50; });
  await page.evaluate(() => { addAttr('str', qtyOf('str')); });
  const after1 = await page.evaluate(() => ({ str: player.str, free: player.free }));
  console.log('1) before:', JSON.stringify(before), 'after +50 str:', JSON.stringify(after1));

  // 2) Max button dumps all remaining free points
  await page.evaluate(() => { addAttr('agi', player.free); });
  const after2 = await page.evaluate(() => ({ agi: player.agi, free: player.free }));
  console.log('2) after Max on agi (free should be 0):', JSON.stringify(after2));

  // 3) addAttr with n > free should clamp, not go negative
  await page.evaluate(() => { addAttr('vit', 9999); });
  const after3 = await page.evaluate(() => ({ vit: player.vit, free: player.free }));
  console.log('3) addAttr with free=0 (should be no-op):', JSON.stringify(after3));

  // 4) qty input's max attribute reflects current free points after re-render
  await page.evaluate(() => { player.free = 12; renderChar(); });
  const qtyMax = await page.evaluate(() => document.getElementById('qty-str').getAttribute('max'));
  console.log('4) qty input max attr after free=12 (expect 12):', qtyMax);

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
