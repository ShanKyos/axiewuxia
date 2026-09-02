// Bộ kỹ năng 5 lớp — xem docs/KY_NANG_5_LOP.md
//
// Bốn thứ dễ hỏng nhất của một hệ chiêu chia theo lớp, và cả bốn đều đã từng hỏng thật:
//
//  1. CHIÊU LỚP KHÁC LỌT VÀO CÂY CỦA MÌNH. Bảng K của một Sylvan Ranger từng liệt kê Cyclone
//     (Dark Knight) và Lightning/Ice/Twister/Nova (Dark Wizard) để mua bằng Sách Kỹ Năng — cung
//     thủ đọc bảng chiêu của mình thấy gần trọn bộ chiêu pháp sư. Mục 1 quét cả năm lớp: mọi
//     chiêu học được và mọi tên hiện trên bảng phải thuộc đúng lớp đó (trừ nhánh Kế Thừa của
//     Spellblade, vốn là đặc điểm lớp lai và có nhãn riêng).
//  2. NĂM LỚP MỘT CƠ CHẾ. Ba lớp từng có buff giống hệt nhau, chỉ khác con số (+35/+30/+25% ST).
//     Mục 2 bấm buff của từng lớp rồi ĐO: mỗi lớp phải đổi một đại lượng khác nhau.
//  3. HOẠT ẢNH DÙNG CHUNG. Ice Arrow từng chạy trận đồ lục tinh của bản kiếm hiệp; Chaotic
//     Diseier và Dark Raven của cùng một lớp dùng chung bầy quạ. Mục 3 đòi 20 ô bấm được có 20
//     hoạt ảnh khác nhau.
//  4. BỊ ĐỘNG CHỈ LÀ DÒNG CHỮ. Swell Life ghi "+15% HP", Heal ghi "hồi 1% HP/giây", Iron Will
//     ghi "hút máu" — không cái nào nối vào chỉ số nào. Mục 4 bật/tắt từng cái rồi đo chỉ số.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true;
    const LOP = ['thieulam','toanchan','baidasan','minhgiao','bug'];
    const o = { lop:{}, buff:{}, pas:{}, style:{}, loi:[] };

    for (const sect of LOP){
      startGame(sect, null); player.traits = []; player.level = 60; player.lvPeak = 60;
      vhAutoLearn(); calcDerived();
      window.skillTab = 'legacy'; renderSkillPanel();
      const html = el('panel-skill').innerHTML;
      o.lop[sect] = {
        ten: SECTS[sect].name,
        bar: player.skillBar.map(id => id ? skName(id) : null),
        diSan: LEGACY_SECT_SKILLS.filter(x => VOHOC_DEFS[x].phai === sect).map(x => VOHOC_DEFS[x].name),
        biDong: CLASS_PASSIVES.filter(x => VOHOC_DEFS[x].phai === sect).map(x => VOHOC_DEFS[x].name),
        // chiêu của lớp KHÁC mà nhân vật này học được / nhìn thấy trên bảng
        hocLan: Object.keys(VOHOC_DEFS).filter(x => VOHOC_DEFS[x].phai !== sect && vhLearned(x)).map(x => VOHOC_DEFS[x].name),
        hienLan: Object.keys(VOHOC_DEFS).filter(x => VOHOC_DEFS[x].phai !== sect && html.includes('>' + VOHOC_DEFS[x].name + '<')).map(x => VOHOC_DEFS[x].name),
        stDiSan: player.legacyAtkPct,
        conNutHoc: /learnVohocUI/.test(html) || /NGOẠI LỚP/.test(html),
      };
      closePanels();
    }

    // ── 2. năm ô buff, năm cơ chế ──
    for (const [sect, bid] of Object.entries(BUFF_SKILL_ID)){
      startGame(sect, null); player.traits = []; player.level = 60; player.lvPeak = 60;
      if (sect === 'thieulam') player.gangkhi.tier = 1;   // Defense cần Stoneform tầng 1
      vhAutoLearn(); calcDerived();
      const t0 = { atk:player.atk, aspd:player.aspd, crit:player.crit, shield:player.vhShield || 0, gk:player.gkBuffT || 0 };
      player.hp = Math.round(player.maxHp * 0.5); const hp0 = player.hp;
      player.qi = player.maxQi; player.cd = {};
      castSkill(bid); calcDerived();
      o.buff[sect] = { ten: skName(bid),
        hoiMau: player.hp - hp0,
        khien: (player.vhShield || 0) - t0.shield,
        stX: +(player.atk / t0.atk).toFixed(2),
        tocDanhX: +(t0.aspd / player.aspd).toFixed(2),
        baoKich: +(player.crit - t0.crit).toFixed(2),
        giamST: +((player.gkBuffT || 0) - t0.gk).toFixed(1) };
    }

    // ── 3. hoạt ảnh của 20 ô bấm được ──
    for (const sect of LOP){
      startGame(sect, null); vhAutoLearn();
      const key = { 0:'sx_' + sect + '_a', 1:'sx_' + sect + '_c' };
      player.skillBar.forEach((id, i) => {
        if (!id) return;
        const c = VH_VFX[id] || SECT_VFX[key[i]] || SECT_VFX[id] || null;
        // Chữ ký hình ảnh = kiểu hoạt ảnh + kiểu đạn. Triple Shot và Penetration cùng dùng cú
        // loé 'flash' lúc xuất chiêu, nhưng thứ người chơi nhìn là viên đạn: ba mũi tên ngắn
        // ('arrow') so với một mũi dài kéo vệt sáng xuyên cả hàng ('lance').
        o.style[sect + '/' + skName(id)] = c ? c.style + (c.proj ? '/' + c.proj : '') : null;
      });
    }

    // ── 4. bị động nối vào chỉ số thật ──
    const doPas = (sect, id, f) => {
      startGame(sect, null); player.traits = []; player.level = 60; player.lvPeak = 60;
      player.vohoc = {}; calcDerived(); const truoc = f();
      player.vohoc[id] = true; calcDerived(); const sau = f();
      o.pas[id] = { ten:VOHOC_DEFS[id].name, truoc, sau };
    };
    doPas('thieulam','dk_fortitude', () => player.maxHp);
    doPas('minhgiao','mg_ironwill',  () => +(player.hpLeech || 0).toFixed(2));
    doPas('bug','dl_darkraven',      () => +(player.skillDmgPct || 0).toFixed(2));
    doPas('toanchan','elf_heal',     () => +(player.healRegenPct || 0).toFixed(3));

    // ── 5. Sách Kỹ Năng phải còn chỗ tiêu (bỏ ngoại lớp là bỏ đường tiêu cũ) ──
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60; player.bikipVH = 3;
    const lv0 = skLv('a'); window.useSkillBookUI('a');
    o.sach = { truoc:lv0, sau:skLv('a'), conLai:player.bikipVH };
    return o;
  });
  console.log(JSON.stringify(r, null, 1));

  // ── 1. bản sắc lớp ──
  const KE_THUA = ['Fireball','Power Wave','Twisting Slash']; // Spellblade — lớp lai, MU cho kế thừa
  for (const [sect, d] of Object.entries(r.lop)){
    if (d.hocLan.length) fail(`${d.ten} học được chiêu lớp khác: ${d.hocLan.join(', ')}`);
    const la = d.hienLan.filter(n => !(sect === 'minhgiao' && KE_THUA.includes(n)));
    if (la.length) fail(`bảng K của ${d.ten} hiện chiêu lớp khác: ${la.join(', ')}`);
    if (d.conNutHoc) fail(`bảng K của ${d.ten} vẫn còn mục/nút học di sản NGOẠI LỚP`);
    if (d.bar.some(x => !x)) fail(`${d.ten} thiếu chiêu ở thanh 4 ô: ${JSON.stringify(d.bar)}`);
    if (d.diSan.length !== 4) fail(`${d.ten} có ${d.diSan.length} chiêu di sản, phải là 4`);
    if (!d.biDong.length) fail(`${d.ten} không có bị động riêng`);
  }
  if (!bad) pass('5 lớp: mỗi lớp chỉ có chiêu của chính mình (trừ nhánh Kế Thừa của Spellblade)');
  const pcts = [...new Set(Object.values(r.lop).map(d => d.stDiSan))];
  if (pcts.length !== 1) fail('%ST di sản lệch giữa các lớp: ' + Object.entries(r.lop).map(([k,d])=>`${d.ten} ${d.stDiSan}`).join(' · '));
  else pass(`cả 5 lớp cùng +${pcts[0]}% Công Kích từ di sản — không lớp nào được ưu ái`);

  // tên chiêu không trùng nhau giữa các lớp (trừ Kế Thừa)
  const tenTheoLop = {};
  for (const [sect, d] of Object.entries(r.lop)) for (const n of [...d.bar, ...d.diSan, ...d.biDong]) (tenTheoLop[n] = tenTheoLop[n] || []).push(sect);
  const trung = Object.entries(tenTheoLop).filter(([n, ls]) => ls.length > 1 && !KE_THUA.includes(n));
  if (trung.length) fail('tên chiêu trùng giữa các lớp: ' + trung.map(([n,ls])=>`${n} (${ls.join('+')})`).join(', '));
  else pass('không tên chiêu nào dùng chung giữa hai lớp');

  // ── 2. buff ──
  const B = r.buff;
  if (!(B.thieulam.giamST > 0)) fail('Defense (Dark Knight) không bật cửa sổ giảm sát thương'); else pass(`Defense: giảm sát thương ${B.thieulam.giamST}s`);
  if (!(B.toanchan.hoiMau > 0 && B.toanchan.stX > 1)) fail('Bless (Sylvan Ranger) không hồi máu'); else pass(`Bless: +${B.toanchan.hoiMau} HP và ×${B.toanchan.stX} ST`);
  if (!(B.baidasan.khien > 0)) fail('Soul Barrier (Dark Wizard) không tạo khiên'); else pass(`Soul Barrier: khiên ${B.baidasan.khien}`);
  if (!(B.minhgiao.tocDanhX > 1.1 && B.minhgiao.stX > 1)) fail('Battle Fury (Spellblade) không cộng tốc đánh'); else pass(`Battle Fury: ×${B.minhgiao.stX} ST và ×${B.minhgiao.tocDanhX} tốc đánh`);
  if (!(B.bug.baoKich > 0.3)) fail('Increase Critical Damage (Dark Lord) không cộng bạo kích'); else pass(`Increase Critical Damage: +${B.bug.baoKich} bạo kích`);
  // và không hai lớp nào cùng một hồ sơ hiệu ứng
  const hoSo = Object.entries(B).map(([k, v]) => [k, [v.hoiMau>0, v.khien>0, v.stX>1, v.tocDanhX>1.05, v.baoKich>0.3, v.giamST>0].join('')]);
  const dup = hoSo.filter(([k, h], i) => hoSo.findIndex(([, h2]) => h2 === h) !== i);
  if (dup.length) fail('hai lớp có buff cùng cơ chế: ' + dup.map(x=>B[x[0]].ten).join(', '));
  else pass('5 ô buff = 5 cơ chế khác nhau');

  // ── 3. hoạt ảnh ──
  const thieu = Object.entries(r.style).filter(([, v]) => !v).map(([k]) => k);
  if (thieu.length) fail('chiêu không khai hoạt ảnh riêng: ' + thieu.join(', '));
  const dem = {}; for (const [k, v] of Object.entries(r.style)) (dem[v] = dem[v] || []).push(k);
  const chung = Object.entries(dem).filter(([, ks]) => ks.length > 1);
  if (chung.length) fail('hoạt ảnh dùng chung: ' + chung.map(([v, ks]) => `${v} ← ${ks.join(' + ')}`).join(' · '));
  if (!thieu.length && !chung.length) pass(`${Object.keys(r.style).length} ô bấm được = ${Object.keys(dem).length} hoạt ảnh khác nhau`);

  // ── 4. bị động ──
  for (const [id, d] of Object.entries(r.pas)){
    if (d.truoc === d.sau) fail(`bị động ${d.ten} không đổi chỉ số nào (${d.truoc} → ${d.sau}) — chỉ là dòng chữ`);
    else pass(`${d.ten}: ${d.truoc} → ${d.sau}`);
  }

  // ── 5. Sách Kỹ Năng ──
  if (r.sach.sau !== r.sach.truoc + 1 || r.sach.conLai !== 2) fail(`Sách Kỹ Năng không nâng được cấp chiêu: ${JSON.stringify(r.sach)}`);
  else pass(`Sách Kỹ Năng: chiêu Lv${r.sach.truoc} → Lv${r.sach.sau}, còn ${r.sach.conLai} quyển`);

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) bad++;
  console.log(bad ? `FAIL(${bad})` : 'PASS');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
