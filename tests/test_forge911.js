// ⚒ Lò rèn nay CHỈ mở khi đứng cạnh Thợ Rèn (đúng MU: phải về thành mới rèn được).
// Các bước mở lò dưới đây vì thế phải dịch chuyển tới NPC trước — đó là luật của game,
// không phải mẹo lách test.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; calcDerived();
    const w = genItem(30, 0.9, 'mob'); w.slot = 'weapon'; w.plus = 9;
    player.equip.weapon = w;
    forgeSel = { uid: w.uid };
    (()=>{ const _n = NPCS.find(x => x.talk === 'forge'); if (_n){ if (curMap !== _n.map) travelTo(_n.map); player.x = _n.x + 30; player.y = _n.y + 30; } })(); togglePanel('forge');
    const html = document.getElementById('forge-content').innerHTML;
    return {
      mentionsPhaThienKiep: html.includes('Phá Thiên Kiếp'),
      buttonText: (html.match(/<button class="mini-btn" onclick="closePanels\(\); window\.hintGoForge\(\)">([^<]+)<\/button>/) || [])[1],
    };
  });
  console.log('1) +9 item shows Phá Thiên Kiếp redirect with new button:', JSON.stringify(r1));

  const r2 = await page.evaluate(() => {
    curMap = 'daohoa'; buildWorld(); player.x = 500; player.y = 500;
    document.querySelectorAll('.forge-actions button.mini-btn')[0]?.click();
    return { curMapAfter: curMap, beacon: player.beacon };
  });
  console.log('2) clicking the redirect button teleports + sets a beacon to the forge NPC:', JSON.stringify(r2));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
