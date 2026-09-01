const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) CHAR_TABS no longer has 'dantian'
  const r1 = await page.evaluate(() => ({ tabs: CHAR_TABS.map(t => t.id) }));
  console.log('1) CHAR_TABS (no dantian):', JSON.stringify(r1));

  // 2) Char panel renders fine at every remaining tab, no crash, no leftover Ascension mention
  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('vophai', null);
    player.sect = 'thieulam'; player.level = 100; calcDerived();
    const out = {};
    for (const t of CHAR_TABS){
      window.charTab = t.id; renderCharPanel();
      const html = document.getElementById('panel-char').innerHTML;
      out[t.id] = { len: html.length, mentionsAscensionTab: html.includes('>Ascension<') };
    }
    return out;
  });
  console.log('2) every remaining char tab renders w/o crash:', JSON.stringify(r2));

  // 3) hệ cảnh giới · kinh mạch · Tán Tiên phải BIẾN MẤT HẲN, không còn dữ liệu lẫn mảng dữ liệu
  const r3 = await page.evaluate(() => {
    player.level = 120; calcDerived();
    return { conDantian: !!player.dantian, conMeridians: !!player.meridians,
             conAscended: player.ascended !== undefined, conMangDL: typeof DANTIAN_REALMS !== 'undefined' };
  });
  console.log('3) cảnh giới/kinh mạch/Tán Tiên đã gỡ sạch:', JSON.stringify(r3));
  if (r3.conDantian || r3.conMeridians || r3.conAscended || r3.conMangDL){
    console.log('FAIL còn sót hệ tu tiên: ' + JSON.stringify(r3)); process.exitCode = 1; }

  // 4) level-up toast messages (unlockNotices) at 7/10/20/30 don't crash, level 10 mentions "5 lớp" not "9 Tộc"
  // (unlockNotices staggers addFloat via setTimeout, so intercept for a bit before restoring)
  const r4 = await page.evaluate(async () => {
    window.TEST_MODE = true;
    startGame('vophai', null);
    const seenByLevel = {};
    for (const lv of [7, 10, 20, 30]){
      player.level = lv;
      const seen = [];
      const origAddFloat = window.addFloat;
      window.addFloat = (x,y,msg) => seen.push(msg);
      let err = null;
      try { unlockNotices(); } catch(e) { err = String(e); }
      await new Promise(r => setTimeout(r, 3000));
      window.addFloat = origAddFloat;
      seenByLevel[lv] = { seen, err };
    }
    return seenByLevel;
  });
  console.log('4) level-up hint toasts at 7/10/20/30 (no crash, level10 says "5 lớp"):', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
