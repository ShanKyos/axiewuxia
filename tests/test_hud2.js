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
  await page.screenshot({ path: '/tmp/hud2_full.png' });

  // click btn-char, verify panel opens
  await page.click('#btn-char');
  await page.waitForTimeout(300);
  const charOpen = await page.evaluate(() => !document.getElementById('panel-char').classList.contains('hidden'));
  console.log('char panel opened via icon button:', charOpen);
  await page.evaluate(() => closePanels());

  // click btn-map (world map), verify panel opens
  await page.click('#btn-map');
  await page.waitForTimeout(300);
  const mapOpen = await page.evaluate(() => !document.getElementById('panel-map').classList.contains('hidden'));
  console.log('map panel opened via icon button:', mapOpen);
  await page.evaluate(() => closePanels());

  // toggle quest tracker off
  await page.click('#btn-questtracker');
  await page.waitForTimeout(200);
  const qtClosed = await page.evaluate(() => document.getElementById('quest-tracker').classList.contains('qt-closed'));
  console.log('quest tracker closed after toggle:', qtClosed);
  await page.screenshot({ path: '/tmp/hud2_qtclosed.png' });

  // toggle back on
  await page.click('#btn-questtracker');
  await page.waitForTimeout(200);
  const qtOpenAgain = await page.evaluate(() => !document.getElementById('quest-tracker').classList.contains('qt-closed'));
  console.log('quest tracker reopened:', qtOpenAgain);

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
