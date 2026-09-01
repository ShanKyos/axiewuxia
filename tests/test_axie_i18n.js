const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  // Default (no localStorage set) — should be English-first
  await page.goto('http://localhost:8850/index.html?sect=thieulam', { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(1500);
  const r1 = await page.evaluate(() => ({
    locale: window.i18nLocale(), hintBar: document.getElementById('hint-bar').textContent,
    tDirect: t('hud.hint.move'),
  }));

  // Force VN locale, reload
  await page.evaluate(() => localStorage.setItem('vlcm_lang', 'vi'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.TEST_MODE = true; window.cheatExec('/max'); });
  await page.waitForTimeout(500);
  const r2 = await page.evaluate(() => ({
    locale: window.i18nLocale(), hintBar: document.getElementById('hint-bar').textContent,
    tDirect: t('hud.hint.move'),
  }));

  console.log('DEFAULT_EN', JSON.stringify(r1));
  console.log('FORCED_VI', JSON.stringify(r2));
  console.log('PAGE_ERRORS', JSON.stringify([...new Set(errors)]));
  await browser.close();
})();
