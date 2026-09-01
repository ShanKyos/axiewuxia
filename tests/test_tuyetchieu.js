// Ô thứ 4 — TUYỆT CHIÊU, bộ biểu tượng riêng cho từng chiêu, và chiêu Penetration mới.
//
// Ba vấn đề bài kiểm này chốt lại:
//   1. Taskbar chỉ có 3 ô, nên Evil Spirit (Dark Wizard) và Power Slash (Spellblade) — hai chiêu
//      đặc trưng nhất của hai lớp đó trong MU — chỉ tồn tại ở bảng Di Sản Cũ dưới dạng +%ST vĩnh
//      viễn. Người chơi không bao giờ bấm được chúng.
//   2. 26 chiêu lớp dùng chung 6 biểu tượng, 18 chiêu rơi hết về 'blade_up'; và 10 file art của
//      chiêu chính/Trấn Phái là ảnh mượn tạm không vẽ chiêu nào (tl_a.png là đồng xu mặt Axie).
//   3. Sylvan Ranger có 0 chiêu chủ động trong cây lớp — cả bốn đều bị động/buff.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const boot = async (sect) => {
    const p = await (await b.newContext({ viewport:{width:1280,height:800} })).newPage();
    p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
    await p.waitForFunction(() => window.__gameReady).catch(()=>{});
    await p.evaluate((sc) => { window.TEST_MODE = true; startGame(sc, null); }, sect);
    await p.waitForTimeout(900);
    return p;
  };

  // ---- 1. Mỗi lớp đủ 4 ô, ô 4 là tuyệt chiêu riêng, không lớp nào trùng lớp nào ----
  const p1 = await boot('thieulam');
  const r1 = await p1.evaluate(() => {
    const out = {};
    for (const sk in SECTS){
      if (sk === 'vophai') continue;
      const bar = defaultSkillBar(sk);
      out[sk] = { so: bar.length, o4: bar[3] };
    }
    return { lop: out, oHTML: document.querySelectorAll('.sk-slot').length,
             sig: Object.keys(SIGNATURE_SKILL).length };
  });
  console.log('1) ô thứ 4 theo lớp:', JSON.stringify(r1));
  for (const sk in r1.lop){
    if (r1.lop[sk].so !== 4) fail(`lớp ${sk} có ${r1.lop[sk].so} ô, phải là 4`);
    if (!r1.lop[sk].o4) fail(`lớp ${sk} không có tuyệt chiêu ở ô 4`);
  }
  const o4 = Object.values(r1.lop).map(x => x.o4);
  if (new Set(o4).size !== o4.length) fail(`hai lớp dùng chung một tuyệt chiêu: ${o4.join(', ')}`);
  if (r1.oHTML < 4) fail(`HTML chỉ có ${r1.oHTML} nút kỹ năng — ô 4 không hiện ra`);

  // ---- 2. Tuyệt chiêu phải BẤM ĐƯỢC và gây sát thương, không chỉ là +%ST ----
  const r2 = await p1.evaluate(async () => {
    applyTestBoost && applyTestBoost();
    travelTo('tuongduong'); travelTo('daohoa');
    mobs.length = 0;
    for (let i = 0; i < 6; i++)
      spawnMob('boar', { x: player.x + 60 + i*40, y: player.y, r:1, count:1 }, null);
    mobs.forEach(m => { m.hp = m.maxHp = 1e9; });
    const id = player.skillBar[3];
    const hp0 = mobs.map(m => m.hp);
    player.cd = {}; player.qi = player.maxQi;
    mouseWorld.x = player.x + 200; mouseWorld.y = player.y;
    castSkill(id);
    await new Promise(r => setTimeout(r, 900));
    return { chieu: id, ten: (skillInfo(id)||{}).name,
      trung: mobs.filter((m,i) => m.hp < hp0[i]).length,
      conLaiTrongDiSan: LEGACY_SECT_SKILLS.includes(id) };
  });
  console.log('2) bấm ô 4:', JSON.stringify(r2));
  if (!r2.trung) fail(`bấm tuyệt chiêu ${r2.ten} mà không con nào trúng đòn`);
  if (r2.conLaiTrongDiSan) fail(`${r2.chieu} vừa nằm ở ô 4 vừa còn trong Di Sản Cũ — cộng %ST hai lần`);
  await p1.close();

  // ---- 3. Mỗi chiêu một biểu tượng riêng, và không còn ô nào dùng art mượn tạm ----
  const p3 = await boot('baidasan');
  const r3 = await p3.evaluate(() => {
    const dung = {}, thieu = [];
    for (const vid in VOHOC_DEFS){
      const sym = SK_ICON_FOR[vid];
      if (!sym) thieu.push(vid); else (dung[sym] = dung[sym] || []).push(vid);
    }
    // biểu tượng nào bị hai chiêu trở lên dùng chung — chấp nhận với nhóm khiên/bị động cùng dạng
    const chung = Object.entries(dung).filter(([, v]) => v.length > 1).map(([k, v]) => k + ':' + v.length);
    const artMuon = [];
    for (const sk in SECT_ART){
      const a = SECT_ART[sk];
      for (const k of ['iconA', 'iconTP'])
        if (a[k] && !String(a[k]).startsWith('data:')) artMuon.push(sk + '.' + k + '=' + a[k]);
    }
    return { soChieu: Object.keys(VOHOC_DEFS).length, soBieuTuong: Object.keys(SK_ICON_SYMS).length,
             thieu, chung, artMuon,
             oTaskbar: player.skillBar.map(id => { const i = id && skillInfo(id);
               return i && i.icon ? (String(i.icon).startsWith('data:') ? 'vẽ' : String(i.icon)) : 'TRỐNG'; }) };
  });
  console.log('3) biểu tượng:', JSON.stringify(r3));
  if (r3.thieu.length) fail(`${r3.thieu.length} chiêu chưa có biểu tượng riêng: ${r3.thieu.join(', ')}`);
  if (r3.soBieuTuong < 20) fail(`chỉ có ${r3.soBieuTuong} biểu tượng cho ${r3.soChieu} chiêu — vẫn dùng chung quá nhiều`);
  if (r3.artMuon.length) fail(`còn ô kỹ năng trỏ vào art mượn tạm: ${r3.artMuon.join(', ')}`);
  if (r3.oTaskbar.some(x => x !== 'vẽ')) fail(`taskbar lẫn lộn kiểu icon: ${JSON.stringify(r3.oTaskbar)}`);

  // ---- 4. Năm chiêu đặc trưng có hiệu ứng RIÊNG, không rơi về style mặc định theo kiểu chiêu ----
  const r4 = await p3.evaluate(() => {
    const MAC_DINH = ['crescents', 'suns', 'flash', 'wuxing', 'vajra'];
    // spiritswarm → spiritdragon và firelines → firepillar sau đợt làm HOẠT ẢNH: bầy u linh lượn
    // vòng đổi thành hai con rồng cuộn rồi lao ra, và ba vệt lửa nay dựng lên thành CỘT lửa.
    const dac = { dw_evilspirit:'spiritdragon', dk_ragefulblow:'groundburst',
                  mg_powerslash:'lightwave', dl_chaoticdiseier:'crowswarm' };
    const sai = [];
    for (const id in dac) if (!VH_VFX[id] || VH_VFX[id].style !== dac[id])
      sai.push(id + '=' + ((VH_VFX[id] && VH_VFX[id].style) || 'không có'));
    return { sai, fireScream: SECT_VFX.sx_bug_c.style, twistingSlash: SECT_VFX.sx_thieulam_a.style,
             penetrationProj: VH_VFX.elf_penetration && VH_VFX.elf_penetration.proj,
             deuKhacMacDinh: !MAC_DINH.includes(SECT_VFX.sx_bug_c.style) };
  });
  console.log('4) hiệu ứng riêng:', JSON.stringify(r4));
  if (r4.sai.length) fail(`tuyệt chiêu dùng hiệu ứng mặc định: ${r4.sai.join(', ')}`);
  if (r4.fireScream !== 'firepillar') fail(`Fire Scream dùng ${r4.fireScream}, phải là firepillar (ba vệt lửa rồi DỰNG CỘT LỬA)`);
  if (r4.twistingSlash !== 'bladewhirl') fail(`Twisting Slash dùng ${r4.twistingSlash}, phải quét trọn vòng`);
  if (r4.penetrationProj !== 'lance') fail('Penetration không có đạn riêng — dùng mũi tên thường');
  await p3.close();

  // ---- 5. Sylvan Ranger: Penetration là chiêu chủ động, và nó XUYÊN thật ----
  const p5 = await boot('toanchan');
  const r5 = await p5.evaluate(async () => {
    const cua = Object.entries(VOHOC_DEFS).filter(([, v]) => v.phai === 'toanchan');
    const chuDong = cua.filter(([, v]) => v.type !== 'passive' && v.type !== 'buff').map(([k]) => k);
    applyTestBoost && applyTestBoost();
    travelTo('tuongduong'); travelTo('daohoa');
    mobs.length = 0;
    // xếp một HÀNG THẲNG: chiêu xuyên phải trúng nhiều con, chiêu thường chỉ trúng con đầu
    for (let i = 0; i < 6; i++)
      spawnMob('boar', { x: player.x + 70 + i*45, y: player.y, r:1, count:1 }, null);
    mobs.forEach(m => { m.hp = m.maxHp = 1e9; });
    const hp0 = mobs.map(m => m.hp);
    player.cd = {}; player.qi = player.maxQi; player.crit = 0;
    mouseWorld.x = player.x + 400; mouseWorld.y = player.y;
    castSkill('elf_penetration');
    await new Promise(r => setTimeout(r, 1400));
    return { chuDong, o4: player.skillBar[3],
      xuyen: mobs.filter((m,i) => m.hp < hp0[i]).length,
      capMo: VOHOC_DEFS.elf_penetration.unlock };
  });
  console.log('5) Sylvan Ranger:', JSON.stringify(r5));
  if (!r5.chuDong.includes('elf_penetration')) fail('Penetration không phải chiêu chủ động');
  if (r5.chuDong.length < 1) fail('Sylvan Ranger vẫn không có chiêu tấn công chủ động nào trong cây lớp');
  if (r5.o4 !== 'elf_penetration') fail(`ô 4 của Ranger là ${r5.o4}, phải là Penetration`);
  if (r5.xuyen < 2) fail(`Penetration chỉ trúng ${r5.xuyen} con trong hàng 6 con — không xuyên gì cả`);
  await p5.close();

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
