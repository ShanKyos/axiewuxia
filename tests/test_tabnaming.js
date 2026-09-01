const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  const r1 = await page.evaluate(() => ({ tabs: CHAR_TABS.map(t => t.name) }));
  console.log('1) CHAR_TABS names (no bare "Card" left):', JSON.stringify(r1));

  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; calcDerived();
    window.charTab = 'tuyethoc'; renderCharPanel();
    return { html: document.getElementById('panel-char').innerHTML.slice(0, 400) };
  });
  console.log('2) Tấn Chức tab renders correctly:', JSON.stringify(r2));

  // 3) Intro story no longer says "Chín Tộc" / lists old species
  const r3 = await page.evaluate(() => {
    const combined = INTRO_PAGES.join(' ');
    return {
      mentionsNineToc: combined.includes('Chín Tộc'),
      mentionsFiveClass: combined.includes('NĂM LỚP'),
      mentionsOldSpecies: ['Dusk','Bird','Plant','Dawn'].filter(s => combined.includes('<b>'+s+'</b>')),
      mentionsDarkKnight: combined.includes('Dark Knight'),
    };
  });
  console.log('3) Intro story updated for 5 classes:', JSON.stringify(r3));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
