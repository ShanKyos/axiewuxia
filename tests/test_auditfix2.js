const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) crit damage multiplier now applies to projectile hits (was hardcoded *2)
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('baidasan', null);   // Dark Wizard — ranged basic attack
    player.level = 60; calcDerived();
    travelTo('chungnam'); mobs.length = 0;
    // force a guaranteed crit and a big critDmgMult, then measure the damage a projectile deals
    player.crit = 1; player.critDmgMult = 5;
    const m = spawnMob('boar', { x: player.x + 200, y: player.y, r: 5, count: 1 }, null);
    m.def = { ...m.def, aggro: 0, hp: 9e9 }; m.hp = 9e9; m.maxHp = 9e9;
    const hp0 = m.hp;
    player.cd.basic = 0; doBasic();
    for (let i = 0; i < 40 && m.hp === hp0; i++) update(0.05);
    const dealtHighMult = hp0 - m.hp;
    // now the same shot with the default x2 multiplier
    player.critDmgMult = 2; m.hp = hp0;
    player.cd.basic = 0; doBasic();
    for (let i = 0; i < 40 && m.hp === hp0; i++) update(0.05);
    const dealtLowMult = hp0 - m.hp;
    return { dealtHighMult: Math.round(dealtHighMult), dealtLowMult: Math.round(dealtLowMult),
             critDmgMultRespected: dealtHighMult > dealtLowMult * 1.8 };
  });
  console.log('1) crit multiplier now respected on projectiles:', JSON.stringify(r1));

  // 2) Thần Binh %ST now applies to the secondary (Trấn Phái) skill too
  const r2 = await page.evaluate(() => {
    function tpDamage(tbTier){
      startGame('thieulam', null);
      player.level = 60; player.thanbinh = { tier: tbTier }; calcDerived();
      travelTo('chungnam'); mobs.length = 0;
      player.crit = 0; player.qi = player.maxQi;
      const m = spawnMob('boar', { x: player.x + 30, y: player.y, r: 5, count: 1 }, null);
      m.def = { ...m.def, aggro: 0, hp: 9e9 }; m.hp = 9e9; m.maxHp = 9e9;
      const hp0 = m.hp;
      for (const k in player.cd) player.cd[k] = 0;
      castSkill('tp');
      return hp0 - m.hp;
    }
    const t1 = tpDamage(1), t8 = tpDamage(8);
    return { tier1: Math.round(t1), tier8: Math.round(t8), thanBinhBoostsSecondary: t8 > t1 };
  });
  console.log('2) Thần Binh now boosts the secondary skill:', JSON.stringify(r2));

  // 3) Kỹ năng Di Sản cộng legacyAtkPct theo CẤP.
  //    Bản cũ kiểm qua ascendToImmortal() (Tán Tiên); hệ đó đã gỡ vì là từ vựng tu tiên,
  //    nên giờ kiểm đúng cái còn lại: lên cấp qua mốc thì legacyAtkPct và công phải tăng.
  const r3 = await page.evaluate(() => {
    startGame('baidasan', null);
    player.level = 40; calcDerived();
    const beforePct = player.legacyAtkPct, beforeAtk = player.atk;
    player.level = 80; calcDerived();
    return { beforePct, afterPct: player.legacyAtkPct, beforeAtk, afterAtk: player.atk,
             ascensionNowPaysOff: player.legacyAtkPct > beforePct && player.atk > beforeAtk };
  });
  console.log('3) Kỹ năng Di Sản cộng sức mạnh thật khi lên cấp:', JSON.stringify(r3));

  // 4) Vực Thẳm jackpot can now actually award a skill (tenuiFreeLearn no longer always null)
  const r4 = await page.evaluate(() => {
    startGame('thieulam', null);
    player.level = 80; calcDerived();
    const v = tenuiFreeLearn('than') || tenuiFreeLearn(null);
    return { grantedSkill: v ? v.name : null, isCrossClass: v ? v.phai !== player.sect : null };
  });
  console.log('4) Vực Thẳm jackpot can grant a real skill again:', JSON.stringify(r4));

  // 5) Sách Kỹ Năng now has a working spend path.
  //    Đường tiêu CŨ là "học di sản ngoại lớp" — đã gỡ cùng đợt làm lại bộ chiêu 5 lớp, vì nó
  //    nhét chiêu Dark Wizard vào cây kỹ năng của Sylvan Ranger (xem docs/KY_NANG_5_LOP.md).
  //    Đường tiêu MỚI: 1 quyển = +1 cấp cho một chiêu của chính lớp mình.
  const r5 = await page.evaluate(() => {
    startGame('thieulam', null);
    player.level = 80; player.bikipVH = 50; calcDerived();
    const target = player.skillBar.find(id => id);
    const bkBefore = player.bikipVH, lvBefore = skLv(target);
    window.useSkillBookUI(target);
    return { target, bkBefore, bkAfter: player.bikipVH, lvBefore, lvAfter: skLv(target),
             spentAndGained: player.bikipVH < bkBefore && skLv(target) > lvBefore };
  });
  console.log('5) Sách Kỹ Năng has a real spend path now:', JSON.stringify(r5));

  // 6) old save whose spaceSkill points at a retired skill gets sanitized on load
  const r6 = await page.evaluate(() => {
    startGame('toanchan', null);
    player.level = 60; calcDerived();
    const saved = JSON.parse(JSON.stringify(player));
    saved.spaceSkill = 'bow';                      // retired skill, no longer on the 3-slot bar
    saved.skillBar = ['a','amkhi','tp','bow','tieuhon'];
    localStorage.setItem('vlcm_save', JSON.stringify({ player: saved, curMap, sideStates, ts: Date.now() }));
    const ok = loadGame();
    return { loadOk: ok, spaceSkill: player.spaceSkill, bar: player.skillBar.slice(),
             sanitized: player.spaceSkill === null };
  });
  console.log('6) stale spaceSkill from an old save is cleared on load:', JSON.stringify(r6));

  // 7) tab Di Sản dựng được danh sách mua ngoại lớp mà không vỡ.
  //    Trước đây mục này gọi ascendToImmortal() để kiểm trạng thái Tán Tiên — hệ đó đã gỡ
  //    (từ vựng tu tiên), nên giờ chỉ kiểm phần còn lại: bảng dựng được và có nút Học.
  const r7 = await page.evaluate(() => {
    startGame('minhgiao', null);
    player.level = 80; player.bikipVH = 20; calcDerived();
    window.skillTab = 'legacy'; togglePanel('skill');
    const html = document.getElementById('panel-skill').innerHTML;
    return { hasLearnBtn: html.includes('Học ·'), hasCrossSection: html.includes('NGOẠI LỚP'), len: html.length };
  });
  console.log('7) tab Di Sản dựng được danh sách ngoại lớp:', JSON.stringify(r7));
  if (!r7.len) { console.log('FAIL tab Di Sản rỗng'); process.exitCode = 1; }

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
