const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(500);
  // bãi tân thủ nay là Rẻo Rừng Corran (hoán dải cấp)
  await page.evaluate(() => { travelTo('corran'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { enterStage('corran', 0); });
  await page.waitForTimeout(9000);
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll('#combat-log .cl-row')).map(r => r.textContent));
  console.log(JSON.stringify(rows, null, 2));
  await page.screenshot({ path: '/tmp/combatlog_full.png' });
  await browser.close();
})();
