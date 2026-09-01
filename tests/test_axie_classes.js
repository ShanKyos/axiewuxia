const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  const results = [];
  for (const cls of ['bug', 'dawn', 'thieulam', 'baidasan']) {
    await page.goto(`http://localhost:8850/index.html?sect=${cls}&max=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
    await page.waitForTimeout(1500);
    const r = await page.evaluate((cls) => {
      const out = { cls };
      out.playerExists = !!player;
      out.sectName = player ? SECTS[player.sect].name : null;
      out.thanbinh = player ? THANBINH[player.sect].name : null;
      try { castSkill('a'); out.castA = 'ok'; } catch (e) { out.castA = 'ERR:' + e; }
      try { window.toggleAuto(); } catch (e) { out.autoErr = 'ERR:' + e; }
      return out;
    }, cls);
    await page.waitForTimeout(1500); // let auto-farm run a few frames with the new class
    results.push(r);
  }

  console.log('RESULTS', JSON.stringify(results, null, 2));
  console.log('PAGE_ERRORS', JSON.stringify([...new Set(errors)]));
  await browser.close();
})();
