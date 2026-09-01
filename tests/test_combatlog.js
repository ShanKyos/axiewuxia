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

  // combat-log-wrap should be visible now
  const wrapVisible = await page.evaluate(() => !document.getElementById('combat-log-wrap').classList.contains('hidden'));
  console.log('combat-log-wrap visible after start:', wrapVisible);

  // engage AUTO farm on daohoa stage
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { enterStage('daohoa', 0); });
  await page.waitForTimeout(5000); // let combat run for a while

  const logState = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#combat-log .cl-row')).map(r => r.textContent);
    return { count: rows.length, sample: rows.slice(0, 6) };
  });
  console.log('combat log rows after 5s of AUTO combat:', JSON.stringify(logState, null, 2));

  // floats array should NOT contain raw damage numbers spamming (spot check: no float text is a bare number)
  const floatState = await page.evaluate(() => ({
    floatsLen: floats.length,
    bareNumberFloats: floats.filter(f => /^\d+$/.test(String(f.text))).length,
  }));
  console.log('floats state (bare numeric damage floats should be 0 now):', JSON.stringify(floatState));

  await page.screenshot({ path: '/tmp/combatlog_active.png' });

  // toggle collapse
  await page.evaluate(() => { document.getElementById('btn-combatlog').click(); });
  await page.waitForTimeout(150);
  const collapsed = await page.evaluate(() => document.getElementById('combat-log').classList.contains('cl-closed'));
  console.log('collapsed after toggle click:', collapsed);
  await page.evaluate(() => { document.getElementById('btn-combatlog').click(); });
  await page.waitForTimeout(150);

  // verify boss telegraph damage still floats (unchanged) — quick sanity: function exists, no error
  // and verify log caps at 50 rows (spam test)
  await page.evaluate(() => { for (let i=0;i<80;i++) logCombat('test row '+i, '#fff'); });
  const capped = await page.evaluate(() => document.querySelectorAll('#combat-log .cl-row').length);
  console.log('combat log capped at 50 after 80 pushes:', capped);

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
