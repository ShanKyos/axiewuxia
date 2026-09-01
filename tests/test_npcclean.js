const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) thuongnhan fully gone from NPCS + SHOPS
  const r1 = await page.evaluate(() => ({
    npcGone: !NPCS.some(n => n.id === 'thuongnhan'),
    shopGone: !SHOPS.thuongnhan,
    tuongduongNpcCount: NPCS.filter(n => n.map === 'tuongduong').length,
  }));
  console.log('1) thuongnhan removed from NPCS + SHOPS:', JSON.stringify(r1));

  // 2) duoclao absorbed Tiến Cấp Đan + junk-sell feature
  const r2 = await page.evaluate(() => ({
    duoclaoJunk: !!SHOPS.duoclao.junk,
    duoclaoHasTienDan: SHOPS.duoclao.rows.some(r => r.id === 'tiendan'),
    duoclaoHasDeadDotpha: SHOPS.duoclao.rows.some(r => r.id === 'dotpha'),
    rarePoolHasDeadDotpha: (window.RARE_POOL || []).some(r => r.id === 'r_dotpha'),
  }));
  console.log('2) duoclao absorbed unique items, dead dotpha item gone:', JSON.stringify(r2));

  // 3) full playthrough — talk to duoclao NPC in-game, buy the moved Tiến Cấp Đan item, use junk-sell
  const r3 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 20; calcDerived(); player.silver = 99999; player.tienDan = 0;
    travelTo('tuongduong');
    const n = NPCS.find(x => x.id === 'duoclao');
    player.x = n.x; player.y = n.y;
    tryTalk();
    const html = document.getElementById('panel-quest').innerHTML;
    const mentionsTienDan = html.includes('Tiến Cấp Đan');
    const mentionsJunkSell = html.includes('Bán hết đồ trắng/xanh');
    window.buyFromShop('tiendan');
    const tienDanAfter = player.tienDan;
    return { mentionsTienDan, mentionsJunkSell, tienDanAfter };
  });
  console.log('3) talk to Dược Lão in-game, buy Tiến Cấp Đan, junk-sell option present:', JSON.stringify(r3));

  // 4) old thuongnhan buyFromShop ids ('dotpha','r_dotpha') are inert now (no matching row found -> no purchase)
  const r4 = await page.evaluate(() => {
    const before = player.silver;
    curShopNpc = NPCS.find(x => x.id === 'duoclao');
    window.buyFromShop('dotpha');
    return { silverUnchanged: player.silver === before };
  });
  console.log('4) buying removed dotpha id is a safe no-op:', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
