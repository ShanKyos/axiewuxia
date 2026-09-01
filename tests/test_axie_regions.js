const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0,150)); });

  await page.goto('http://localhost:8850/index.html?sect=thieulam', { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.TEST_MODE = true; window.cheatExec('/max'); });

  const regions = ['daohoa','tuongduong','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon',
    'pb_daohoa','pb_ngoai','pb_chungnam','pb_comoc','pb_tuyettinh','pb_mongco','pb_nhanmon'];
  const results = [];
  for (const r of regions) {
    const info = await page.evaluate((r) => {
      try {
        travelTo(r);
        return { region: r, name: MAPS[r].name, curMapAfter: curMap, mobCount: mobs.length, ok: true };
      } catch (e) { return { region: r, error: String(e), ok: false }; }
    }, r);
    results.push(info);
    await page.waitForTimeout(300);
  }

  console.log('RESULTS', JSON.stringify(results, null, 1));
  console.log('PAGE_ERRORS', JSON.stringify([...new Set(errors)]));
  console.log('CONSOLE_ERRORS', JSON.stringify([...new Set(consoleErrors)].filter(e => !e.includes('404') && !e.includes('ERR_CONNECTION'))));
  await browser.close();
})();
