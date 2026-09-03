// Tiến Hóa Chiêu Thức. Hệ đã có sẵn hai nhánh, nhưng cả hai chỉ đổi CON SỐ: chọn +14% sát thương
// hay −9% hồi chiêu thì cách chơi vẫn y hệt — từ cấp 10 tới 120 người chơi không đổi cách bấm một
// lần nào. Nhánh thứ ba phải đổi HÀNH VI thật, đo được bằng số mục tiêu trúng đòn.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8861/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // 1. Ba nhánh, và nhánh mới phải đổi hành vi chứ không chỉ nhân con số
  const r1 = await p.evaluate(() => ({
    nhanh: Object.entries(EVO_PATHS).map(([k,v]) => ({ k, ten:v.name,
      doiSo: !!(v.dmg || v.cd || v.qi), doiHanhVi: !!v.r })),
    moc: EVO_LVS }));
  console.log('1) các nhánh:', JSON.stringify(r1));
  if (r1.nhanh.length < 3) fail(`chỉ có ${r1.nhanh.length} nhánh — vẫn là lựa chọn giữa hai con số`);
  if (!r1.nhanh.some(x => x.doiHanhVi)) fail('không nhánh nào đổi hành vi, tất cả chỉ nhân con số');

  // 2. Chọn Lan Toả phải TRÚNG NHIỀU MỤC TIÊU HƠN — đo bằng số quái ăn đòn
  const demTrung = (path) => p.evaluate(async (pa) => {
    applyTestBoost && applyTestBoost();
    travelTo('tuongduong'); travelTo('daohoa');
    mobs.length = 0;
    // xếp một hàng quái giãn đều để đo bán kính chạm
    // Hàng phải DÀI hơn bán kính lớn nhất, nếu không mọi cấu hình đều trúng hết và phép đo mù:
    // bản đầu xếp 14 con trong 308px nên cả ba trường hợp đều trúng 14/14.
    for (let i = 0; i < 30; i++)
      spawnMob('boar', { x: player.x + 30 + i*24, y: player.y, r: 1, count: 1 }, null);
    mobs.forEach(m => { m.hp = m.maxHp = 1e9; });
    // chọn chiêu diện rộng để đo được bán kính, và phải có trong CẢ HAI bảng
    const id = Object.keys(VOHOC_DEFS).find(k => SKILL_DEFS[k] &&
      (VOHOC_DEFS[k].type === 'aoe' || VOHOC_DEFS[k].type === 'cone'));
    if (!id) return { loi:'không có chiêu Võ Học trên thanh' };
    // CỐ ĐỊNH cấp chiêu: evoStage() cũng nhân bán kính theo cấp (+12%/bậc), mà applyTestBoost()
    // nâng cấp chiêu — nên gọi ba lần liên tiếp thì lần sau bán kính to hơn lần trước vì lý do
    // chẳng liên quan gì tới nhánh đang đo. Bản đầu vấp đúng chỗ này: Bá Đạo cũng 'trúng nhiều
    // hơn' dù nó không đụng tới bán kính.
    if (!player.skillLv) player.skillLv = {};
    player.skillLv[id] = 1;
    player.skillEvo = {}; if (pa) player.skillEvo[id] = [pa, pa, pa];
    const hp0 = mobs.map(m => m.hp);
    // ĐO TỪNG CÚ ĐÁNH, không đo tổng và cũng không đo tổng-trên-mỗi-con.
    //
    // Hai bản trước đều trượt vì cùng một lý do, chỉ khác mức độ:
    //   · Bản 1 đọc TỔNG sát thương — cùng một cấu hình đo hai lần lệch nhau tới 2,6 lần.
    //   · Bản 2 đọc trung vị TỔNG-TRÊN-MỖI-CON, tưởng là đã ổn định, nhưng nền vẫn nhảy
    //     29k ↔ 57k giữa các lượt và có lượt Bá Đạo đo ra THẤP hơn nền.
    // Nguyên nhân chung: Cyclone đánh thành NHIỀU NHỊP, và mỗi con ăn số nhịp khác nhau vì quái
    // trôi ra vào tầm trong lúc chiêu đang chạy (mobSeparate đẩy chúng giãn ra). Tổng-trên-mỗi-con
    // = sát thương mỗi nhịp × số nhịp con đó ăn — số nhịp mới là thứ nhảy, không phải sát thương.
    //
    // Móc thẳng vào hurtMob() thì lấy được sát thương của TỪNG CÚ, hoàn toàn không phụ thuộc số
    // nhịp. Đo 3 lượt liên tiếp: nền 20988/21690/21855, Bá Đạo 32361/33437/34107, Lan Toả
    // 10001/10280/10329 — đúng bằng hệ số của nhánh (Lan Toả 0,475; Bá Đạo 1,48).
    // hurtMob là hàm khai báo ở tầng cao nhất của script thường, nên nó CHÍNH LÀ window.hurtMob —
    // gán đè vào đó thì các lời gọi bên trong castVohoc đi qua bản đã móc.
    const cu = []; const goc = window.hurtMob;
    window.hurtMob = function(m, d){ cu.push(Math.round(d)); return goc.apply(this, arguments); };
    player.cd[id] = 0; player.qi = player.maxQi;
    // Tắt mọi nguồn ngẫu nhiên còn lại: Bạo Kích nhân ×2.x mỗi lần trúng, vhCritT còn dư từ lượt
    // trước ép player.crit = 1, và player.atk trôi vì applyTestBoost() gọi lại giữa các lượt đo.
    player.auto = false; player.vhCritT = 0; player.crit = 0; player.atk = 12000;
    castVohoc(id);
    await new Promise(r => setTimeout(r, 2200));   // đủ cho chiêu chạy hết vòng đời
    window.hurtMob = goc;
    cu.sort((a, b) => a - b);
    // Trung vị chứ không phải trung bình: cú đầu và cú cuối hay rơi vào con đang trôi ra khỏi mép
    // tầm nên ăn sát thương tối thiểu, kéo lệch trung bình.
    const moiCu = cu.length ? cu[cu.length >> 1] : 0;
    const trung = new Set(mobs.filter((m,i) => m.hp < hp0[i]).map((m,i) => i)).size
      || mobs.filter((m,i) => m.hp < hp0[i]).length;
    return { chieu: VOHOC_DEFS[id].name, kieu: VOHOC_DEFS[id].type, soTrung: trung,
      soCu: cu.length, moiCu, tongSatThuong: cu.reduce((a,v)=>a+v, 0) };
  }, path);

  const khong = await demTrung(null);
  const lan   = await demTrung('spread');
  const ba    = await demTrung('power');
  console.log('2) không chọn nhánh:', JSON.stringify(khong));
  console.log('   Lan Toả         :', JSON.stringify(lan));
  console.log('   Bá Đạo          :', JSON.stringify(ba));
  if (khong.loi) fail(khong.loi);
  else {
    // Lan Toả phải đổi hành vi RÕ RỆT, không phải nhích vài phần trăm.
    if (lan.soTrung < khong.soTrung * 1.5)
      fail(`Lan Toả trúng ${lan.soTrung} mục tiêu so với nền ${khong.soTrung} — chưa đủ để gọi là đổi hành vi`);
    // Bá Đạo chỉ đổi con số, KHÔNG được đổi tầm. Cho sai số nhỏ: quái trôi vì lực đẩy giữa các
    // đợt của chiêu, nên hai lần đo cùng cấu hình cũng lệch nhau một hai con.
    if (Math.abs(ba.soTrung - khong.soTrung) > 3)
      fail(`Bá Đạo đổi cả số mục tiêu (${ba.soTrung} vs ${khong.soTrung}) — nó chỉ nên đổi sát thương`);
    // Ba bậc Bá Đạo = 1,14^3 = +48% trên lý thuyết; đòi ít nhất +25% để chừa sai số phép đo.
    if (!(ba.moiCu > khong.moiCu * 1.25))
      fail(`Bá Đạo không tăng sát thương mỗi cú (${ba.moiCu} so với nền ${khong.moiCu})`);
    // Lan Toả đánh đổi: rộng hơn thì mỗi cú phải đau ít hơn, nếu không nó là nhánh miễn phí.
    if (!(lan.moiCu < khong.moiCu * 0.85))
      fail(`Lan Toả không đánh đổi sát thương (${lan.moiCu} so với nền ${khong.moiCu})`);
    // Và nó phải ĐÁNH NHIỀU CÚ HƠN — đó mới là chỗ đổi hành vi, không phải chỉ đổi con số.
    if (!(lan.soCu > khong.soCu * 1.5))
      fail(`Lan Toả chỉ đánh ${lan.soCu} cú so với nền ${khong.soCu} — chưa phải quét cả bầy`);
  }

  // 3. Lựa chọn phải lưu lại qua save
  const r3 = await p.evaluate(() => {
    const id = Object.keys(VOHOC_DEFS).find(k => SKILL_DEFS[k] && VOHOC_DEFS[k].type === 'aoe');
    player.skillEvo = {}; window.chooseEvoPath(id, 0, 'spread');
    saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save') || '{}');
    // v4: nhân vật nằm trong ô đang chơi, không còn ở gốc doc
    const O = raw.slots && raw.slots[raw.active];
    const se = O && O.player && O.player.skillEvo;
    return { luuTrongSave: !!(se && se[id] && se[id][0] === 'spread'),
      trongBoNho: player.skillEvo[id][0] };
  });
  console.log('3) lưu lựa chọn:', JSON.stringify(r3));
  if (!r3.luuTrongSave) fail('lựa chọn nhánh không được lưu vào save — mở lại game là mất');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
