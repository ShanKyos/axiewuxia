// Tuyệt chiêu Flame Cyclone của Dark Knight — vòng lửa quét quanh người, vũ khí bay theo.
//
// Bài này gác bốn thứ dễ lặng lẽ hỏng:
//   1. Ô 4 của Dark Knight PHẢI là chiêu xoay, và phím Space phải trỏ sẵn vào nó. Trước đây
//      Space mặc định là đòn đánh thường nên ô 4 gần như không ai bấm tới.
//   2. Gán mặc định chỉ chạy MỘT LẦN: ai tự tắt Space đi thì lần nạp sau không được bật lại.
//   3. Tổng Di Sản của Dark Knight vẫn đúng 8,0% sau khi hoán hai chiêu — hoán chỗ mà quên hạ
//      bậc là lớp này tự dưng được thêm %Công Kích vĩnh viễn.
//   4. Tung chiêu thật sự sinh ra hiệu ứng 'vongKiem' (không phải hình vector chung), và tấm
//      khung hình có tải được — nvTai/getVfxAtlasImg im lặng khi tệp 404, nên thiếu tệp thì
//      chiêu vẫn "chạy" mà màn hình trống trơn.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  const errs = [], miss = [];
  p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  p.on('response', r => { if (r.status() === 404) miss.push(r.url().split('/').pop()); });
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // 1) ô 4 + phím Space
  const r1 = await p.evaluate(() => ({
    o4: player.skillBar[3],
    space: player.spaceSkill,
    ten: (skillInfo(player.skillBar[3]) || {}).name,
    cd: skillInfo('dk_cyclone').cd,
    qi: skillInfo('dk_cyclone').qi,
    mult: skillInfo('dk_cyclone').mult,
  }));
  console.log('1) ô 4 & Space:', JSON.stringify(r1));
  if (r1.o4 !== 'dk_cyclone') fail(`ô 4 của Dark Knight là ${r1.o4}, phải là dk_cyclone`);
  else if (r1.space !== 'dk_cyclone') fail(`phím Space là ${r1.space}, phải gán sẵn dk_cyclone`);
  else pass(`ô 4 = Space = ${r1.ten}`);
  if (r1.cd !== 0) fail(`Flame Cyclone còn hồi chiêu ${r1.cd}s — phải là 0 (Mana mới là cái ghìm)`);
  else if (!r1.qi) fail('cd 0 mà cũng không tốn Mana — không còn gì ghìm lại');
  else pass(`không hồi chiêu, ghìm bằng ${r1.qi} Mana mỗi lần`);

  // 2) tự tắt Space rồi nạp lại thì KHÔNG được bật lại
  const r2 = await p.evaluate(() => {
    window.assignSpaceUI('dk_cyclone');          // bấm lần hai → tắt
    const sau = player.spaceSkill;
    spaceMacDinh();                              // giả lập lần nạp sau
    return { sauKhiTat: sau, sauKhiNapLai: player.spaceSkill };
  });
  console.log('2) tôn trọng lựa chọn:', JSON.stringify(r2));
  if (r2.sauKhiTat !== null) fail('bấm lần hai mà Space không tắt');
  else if (r2.sauKhiNapLai !== null) fail('người chơi đã tắt Space mà lần nạp sau lại tự bật lên');
  else pass('tắt Space rồi thì lần nạp sau không tự bật lại');

  // 3) tổng Di Sản vẫn 8,0%
  const r3 = await p.evaluate(() => {
    const dk = LEGACY_SECT_SKILLS.filter(id => (VOHOC_DEFS[id] || {}).phai === 'thieulam');
    return { ds: dk, tong: dk.reduce((a, id) => a + LEGACY_TIER_PCT[VOHOC_DEFS[id].tier], 0),
             cycloneConTrongDiSan: LEGACY_SECT_SKILLS.includes('dk_cyclone') };
  });
  console.log('3) Di Sản:', JSON.stringify(r3));
  if (r3.cycloneConTrongDiSan) fail('dk_cyclone vừa là tuyệt chiêu bấm được vừa cộng %ST vĩnh viễn');
  else if (r3.ds.length !== 4) fail(`Dark Knight có ${r3.ds.length} chiêu Di Sản, phải là 4`);
  else if (Math.abs(r3.tong - 8) > 0.01) fail(`tổng Di Sản ${r3.tong}%, phải là 8,0%`);
  else pass(`4 chiêu Di Sản, tổng đúng ${r3.tong}% Công Kích`);

  // 4) tung chiêu → sinh đúng hiệu ứng, KHÔNG kèm hình vector chung
  const r4 = await p.evaluate(() => {
    player.level = 60; learnVohoc('dk_cyclone'); player.qi = player.maxQi = 500; calcDerived();
    effects.length = 0;
    const inf = skillInfo('dk_cyclone');
    castSkill('dk_cyclone');
    const e = effects.find(x => x.type === 'vongKiem');
    const viSao = e ? null : { mo:inf.unlocked, khoa:inf.lockTxt, qi:player.qi, can:inf.qi,
                               cacLoai:[...new Set(effects.map(x => x.type))] };
    return { coHieuUng: !!e, viSao, coVector: effects.some(x => x.type === 'vfx'),
             dur: e && e.dur,
             // Vòng lửa vẽ THẲNG BẰNG MÃ, không còn tấm khung hình nào. Gác luôn chỗ đó: hễ ai
             // khai lại một atlas tên 'vongkiem' thì tức là art đi mượn quay lại.
             conAtlas: 'vongkiem' in VFX_ATLAS_DEFS };
  });
  console.log('4) tung chiêu:', JSON.stringify(r4));
  if (!r4.coHieuUng) fail('tung Flame Cyclone mà không sinh hiệu ứng vongKiem');
  else if (r4.coVector) fail('vẫn sinh thêm hình vector chung — sẽ thành hai vòng lệch nhau');
  else pass('sinh đúng một hiệu ứng vongKiem, không kèm vòng vector cũ');
  if (r4.conAtlas) fail("còn khai atlas 'vongkiem' — vòng lửa phải vẽ bằng mã, không dùng tấm art");
  else pass('vòng lửa vẽ bằng mã, không tốn tệp art nào');

  // Đếm pixel màu lửa trên MỘT MÀN HÌNH THẬT là đo nhầm: đuốc, đất đá, ánh chiều đều cam sẵn.
  // Phải đo CHÊNH LỆCH giữa có chiêu và không chiêu, trên cùng một cảnh.
  const r5 = await p.evaluate(() => {
    const cv = document.getElementById('game'), g = cv.getContext('2d');
    const demLua = () => {
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4){
        const R = d[i], G = d[i+1], B = d[i+2];
        if (R > 180 && G > 90 && G < R && B < G * 0.8) n++;    // cam → vàng, không phải xanh
      }
      return n;
    };
    effects.length = 0; render(); const nen = demLua();
    castSkill('dk_cyclone');
    const e = effects.find(x => x.type === 'vongKiem');
    if (e) e.t = 0.35;                               // giữa vòng, lửa đang rộng nhất
    render(); const co = demLua();
    return { nen, co, them: co - nen };
  });
  console.log('5) pixel vẽ ra:', JSON.stringify(r5));
  if (r5.them < 3000) fail(`chiêu chỉ thêm ${r5.them} pixel màu lửa (nền ${r5.nen}) — vòng lửa gần như không hiện`);
  else pass(`vòng lửa thêm ${r5.them} pixel màu lửa so với cùng cảnh không chiêu`);

  // 6) vũ khí bay quanh — lấy từ CHÍNH món đang cầm, nên đổi vũ khí là đổi hình bay quanh
  const r6 = await p.evaluate(() => {
    const veRa = () => {
      const e = effects.find(x => x.type === 'vongKiem');
      if (!e || !e.wpn) return { co:false };
      // vẽ riêng cái vũ khí ra một canvas trắng để đếm — không lẫn với lửa
      const cv = document.createElement('canvas'); cv.width = cv.height = 200;
      const g = cv.getContext('2d');
      g.translate(100, 100); g.scale(e.wpn.k, e.wpn.k); g.translate(0, e.wpn.dy);
      e.wpn.ve(g);
      const d = g.getImageData(0, 0, 200, 200).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 24) n++;
      return { co:true, pixel:n, k:+e.wpn.k.toFixed(3) };
    };
    // Ba trạng thái, không phải hai. Hình vector của vũ khí đã gỡ hẳn — cây bay quanh nay vẽ
    // từ TRANH khai trong VK_ANH, mà mới có 3/15 dòng có tranh (ba dòng trượng Dark Wizard).
    // Nên "cầm vũ khí" tự nó không còn đủ: dòng chưa có tranh thì vòng lửa quay không, và đó
    // là trạng thái ĐÚNG, không phải lỗi. Gác cả ba để không nhầm lẫn về sau.
    for (const k in player.equip) player.equip[k] = null;
    effects.length = 0; castSkill('dk_cyclone');
    const tayKhong = veRa();

    // (a) dòng CHƯA có tranh — /gen bốc kiếm/rìu/chùy của Dark Knight, cả ba đều chưa vẽ
    cheatExec('/gen 3 +9');
    const tenChuaVe = player.equip.vukhi && player.equip.vukhi.name;
    const dChuaVe = itemDef(player.equip.vukhi);
    effects.length = 0; castSkill('dk_cyclone');
    const chuaVe = veRa();

    // (b) dòng ĐÃ có tranh — gắn thẳng một cây trượng Dark Wizard vào ô vũ khí. Mặc bình thường
    // thì itemUsable() chặn (khoá lớp), nhưng ở đây chỉ cần ĐƯỜNG VẼ, không cần luật mặc đồ.
    player.equip.vukhi.def = 'baidasan_quyentruong_2';
    player.equip.vukhi.tier = 3;
    calcDerived();
    const tenDaVe = itemDef(player.equip.vukhi).name;
    effects.length = 0; castSkill('dk_cyclone');
    const daVe = veRa();
    return { tayKhong, chuaVe, daVe, tenChuaVe, tenDaVe,
             anhChuaVe: !!vkAnh(dChuaVe), anhDaVe: !!vkAnh(itemDef(player.equip.vukhi)) };
  });
  console.log('6) vũ khí bay quanh:', JSON.stringify(r6));
  if (r6.tayKhong.co) fail('tay không mà vẫn có hình vũ khí bay quanh');
  else if (r6.anhChuaVe) fail(`${r6.tenChuaVe} hoá ra ĐÃ có tranh — chọn lại một dòng chưa vẽ để gác nhánh này`);
  else if (r6.chuaVe.co) fail(`${r6.tenChuaVe} chưa có tranh trong VK_ANH mà vẫn có hình bay quanh — hình vector đã lẻn về`);
  else if (!r6.anhDaVe) fail('trượng Dark Wizard mất tranh trong VK_ANH — mục này không gác được gì nữa');
  else if (!r6.daVe.co) fail(`cầm ${r6.tenDaVe} (CÓ tranh) mà không có vũ khí bay quanh`);
  else if (r6.daVe.pixel < 200) fail(`hình vũ khí chỉ ${r6.daVe.pixel} pixel — vẽ ra gần như rỗng`);
  else if (r6.daVe.k > 1) fail(`vũ khí phóng ×${r6.daVe.k} — chưa quy về tỉ lệ thế giới, sẽ to hơn cả vòng lửa`);
  else pass(`${r6.tenChuaVe} chưa vẽ ⇒ vòng lửa quay không · ${r6.tenDaVe} có tranh ⇒ bay quanh ${r6.daVe.pixel} pixel, tỉ lệ ×${r6.daVe.k}`);

  const t404 = miss.filter(x => /vongkiem|atlas/.test(x));
  if (t404.length) fail('404: ' + t404.join(', '));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 ? 'ALL PASS' : `FAIL(${bad})`);
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
