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
    player.level = Math.max(player.level, 60);
    const cliffNpc = NPCS.find(x => x.talk === 'tenui');
    const gachaNpc = NPCS.find(x => x.id === 'thantoan');
    return { cliffName: cliffNpc.name, gachaName: gachaNpc.name };
  });
  console.log('1) cliff/gacha NPCs renamed:', JSON.stringify(r1));

  const r2 = await page.evaluate(() => {
    const n = NPCS.find(x => x.talk === 'tenui');
    renderTeNui(n);
    const html = document.getElementById('panel-quest').innerHTML;
    return {
      mentionsAbyss: html.includes('Vực Thẳm'),
      mentionsOldTeNui: /TÉ NÚI|Té Núi cầu đạo/.test(html),
      mentionsOldKiepVanTu: html.includes('Kiếp Vân Tụ'),
    };
  });
  console.log('2) renderTeNui uses Vực Thẳm, no old Té Núi/Kiếp Vân Tụ text:', JSON.stringify(r2));

  const r3 = await page.evaluate(() => {
    const n = NPCS.find(x => x.talk === 'tenui');
    const seenTexts = new Set();
    let mentionsOldWords = false;
    for (let i = 0; i < 60; i++){
      doTeNui(n.id);
      player.tenuiTT = 0; // reset injury lock so we can keep sampling
      const res = document.getElementById('tn-result');
      const t = res ? res.innerHTML : '';
      if (t) seenTexts.add(t.replace(/\d+/g, 'N'));
      if (/LÃO TỔ|VÁCH ĐỘNG BÍ TỊCH|CƠ DUYÊN NGÀN VÀNG|bí tịch/i.test(t)) mentionsOldWords = true;
    }
    return { sampleCount: seenTexts.size, mentionsOldWords };
  });
  console.log('3) doTeNui outcomes have no leftover old wuxia terms:', JSON.stringify(r3));

  const r4 = await page.evaluate(() => {
    player.congHuan = 5;
    renderVanDuyen();
    const html = document.getElementById('panel-quest').innerHTML;
    return { mentionsQuayVanMay: html.includes('Quay Vận May'), mentionsOldRutDuyen: html.includes('Rút Duyên') };
  });
  console.log('4) Vạn Duyên Các gacha button renamed:', JSON.stringify(r4));

  const r5 = await page.evaluate(() => {
    let mentionsOldTraitor = false;
    for (const k in BOSS_LORE){
      const b = BOSS_LORE[k];
      if (b.name && b.name.includes('Phản Tộc')) mentionsOldTraitor = true;
      if (b.sect) for (const sk in b.sect) if (b.sect[sk].includes(' Tộc ')) mentionsOldTraitor = true;
    }
    return { mentionsOldTraitor };
  });
  console.log('5) BOSS_LORE has no leftover "Tộc" species wording:', JSON.stringify(r5));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
