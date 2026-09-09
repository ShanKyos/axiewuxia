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

  const r1 = await page.evaluate(() => ({
    rankNames: GIAI_NAMES,
  }));
  console.log('1) rank name array renamed:', JSON.stringify(r1));

  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 20; calcDerived();
    player.bikipVH = 0;
    const before = document.body.innerHTML;
    // trigger the "not enough" float via a direct call path check instead of relying on UI
    return { hasOldWord: /Bí Kíp/.test(before) };
  });
  console.log('2) no leftover "Bí Kíp" text on fresh char/inv render:', JSON.stringify(r2));

  const r3 = await page.evaluate(() => {
    travelTo('daohoa');
    const seen = new Set();
    let mentionsOldKyNgo = false;
    for (let i = 0; i < 200; i++){
      rollKyngo();
      const txt = zoneBanner ? zoneBanner.text : null;
      if (txt) seen.add(txt);
      if (txt && txt.includes('KỲ NGỘ')) mentionsOldKyNgo = true;
    }
    return { outcomesSeen: [...seen], mentionsOldKyNgo };
  });
  console.log('3) Kỳ Ngộ renamed to KHÁM PHÁ, no old prefix anywhere:', JSON.stringify(r3));

  const r4 = await page.evaluate(() => {
    player.level = 60; calcDerived();
    const w = genItem(30, 0.9, 'mob'); w.slot = 'weapon'; w.plus = 9;
    player.equip.weapon = w;
    forgeSel = { uid: w.uid };
    (()=>{ const _n = NPCS.find(x => x.talk === 'forge'); if (_n){ if (curMap !== _n.map) travelTo(_n.map); player.x = _n.x + 30; player.y = _n.y + 30; } })(); togglePanel('forge');
    const html = document.getElementById('forge-content').innerHTML;
    return { mentionsNewForgeName: html.includes('Lò Rèn Hoàng Gia'), mentionsOldForgeName: html.includes('Lò Bát Quái') };
  });
  console.log('4) forge redirect uses new "Lò Rèn Hoàng Gia" name, old name gone:', JSON.stringify(r4));

  const r5 = await page.evaluate(() => {
    curMap = 'ardhaven'; buildWorld();
    const n = NPCS.find(x => x.id === 'duoclao');
    player.x = n.x; player.y = n.y;
    tryTalk();
    const html = document.getElementById('panel-quest').innerHTML;
    return { npcName: n.name, mentionsAlchemist: html.includes('Nhà Giả Kim'), mentionsOldName: html.includes('Dược Lão') };
  });
  console.log('5) Dược Lão NPC renamed to Nhà Giả Kim:', JSON.stringify(r5));

  // Lễ nhập môn (openSectCeremony/chooseSect) đã gỡ cùng lớp thứ sáu `vophai` — chọn lớp
  // nay nằm hẳn ở màn tạo nhân vật. Chỗ này vì thế đổi sang canh chính điều nó vốn canh:
  // không còn chữ "Tộc" ở bất kỳ mặt chữ nào người chơi đọc được.
  const r6 = await page.evaluate(() => {
    const goc = [
      ...Object.values(SECTS).flatMap(s => [s.name, s.desc, s.skillA && s.skillA.name, s.tp && s.tp.name]),
      ...(window.QUESTS || []).flatMap(q => [q.name, q.desc]),
      ...NPCS.map(n => n.name),
      document.getElementById('hud') ? document.getElementById('hud').textContent : '',
    ].filter(Boolean).join(' | ');
    return {
      conLeNhapMon: typeof window.openSectCeremony === 'function' || typeof window.chooseSect === 'function',
      conChuToc: /\bTộc\b/.test(goc),
      soLop: Object.keys(SECTS).length,
    };
  });
  console.log('6) hết chữ "Tộc" ở mặt chữ người chơi đọc, hết lễ nhập môn:', JSON.stringify(r6));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
