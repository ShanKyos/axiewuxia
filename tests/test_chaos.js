// ⚒ Lò rèn nay CHỈ mở khi đứng cạnh Thợ Rèn (đúng MU: phải về thành mới rèn được).
// Các bước mở lò dưới đây vì thế phải dịch chuyển tới NPC trước — đó là luật của game,
// không phải mẹo lách test.
// Lò Hỗn Độn thay cho HAI màn rèn chữ cũ. Test chứng minh: (a) mọi hệ của cả hai màn cũ đều
// còn chạy được qua cỗ máy mới, (b) máy nhận đúng công thức theo khay, (c) cổng royal còn
// khoá, (d) tên trang bị hết mùi kiếm hiệp.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(800);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    const o = {};
    const reset = () => {
      applyTestBoost(); calcDerived(); chaosClear(); chaosGroup = 'ren'; chaosPick = null;
      player.forgeBonus = 0; forgeUseCharm = false;
    };
    const ids = () => chaosMatches().map(x => x.rec.id);
    const idsReady = () => chaosMatches().filter(x => x.p.ready).map(x => x.rec.id);
    // đưa người chơi tới đúng chỗ Tông Sư Thợ Rèn để mở khoá công thức royal
    const goRoyal = (on) => {
      const n = NPCS.find(x => x.talk === 'forge');
      if (on){ curMap = n.map; player.x = n.x; player.y = n.y; }
      else { curMap = n.map; player.x = n.x + 4000; player.y = n.y + 4000; }
    };

    // ── 1. TÊN TRANG BỊ: không còn binh khí kiếm hiệp ──────────────────
    const CAM = ['Huyền Thiết Trọng Kiếm','Lăng Ba Hài','Truy Phong Hài','Chí Tôn Long Giáp',
                 'Du Long','Thiên Tôn Miện','Hổ Đầu Khôi','Kim Lân Giáp','Lân Khố','Ngọc Giới'];
    const moiTen = [];
    for (const sl in ITEM_NAMES) for (const n of ITEM_NAMES[sl]) moiTen.push(n);
    o.tenDinhKiemHiep = moiTen.filter(n => CAM.some(c => n.includes(c)));
    o.soTen = moiTen.length;

    // ── 2. KHỚP CÔNG THỨC theo khay ───────────────────────────────────
    reset(); goRoyal(false);
    o.khayTrong_coAoChoang = ids();          // đã có áo choàng cấp 2 → công thức cloak phải TẮT
    player.equip.aochoang = null; player.inv = player.inv.filter(x => x.slot !== 'aochoang');
    o.khayTrong = ids();                     // chưa có áo choàng → cloak phải BẬT
    const w = player.equip.vukhi; w.plus = 3;
    chaosAddItem(w.uid);  o.motMon_plus3 = ids();
    chaosAddJewel('chucPhuc'); o.themChucPhuc = idsReady();
    reset(); const w9 = player.equip.vukhi; w9.plus = 9; chaosAddItem(w9.uid);
    o.plus9_ngoaiLoRen = chaosMatches().map(x => x.rec.id + (x.p.ready ? '' : '(khoá)'));
    goRoyal(true);
    for (let i = 0; i < 2; i++) chaosAddJewel('chucPhuc');
    for (let i = 0; i < 2; i++) chaosAddJewel('linhHon');
    chaosAddJewel('honDon');
    o.plus9_taiLoRen = chaosMatches().filter(x => x.rec.id === 'phathien').map(x => x.p.ready ? 'mở' : 'vẫn khoá');

    // ── 3. CHẠY THẬT từng công thức ───────────────────────────────────
    const chay = (dung, sau) => { const before = dung(); doChaos(); return sau(before); };
    // 3a Chúc Phúc: +1 chắc chắn, trừ đúng 1 viên
    reset(); goRoyal(false);
    { const it = player.equip.non; it.plus = 2; const j0 = player.jewels.chucPhuc;
      chaosAddItem(it.uid); chaosAddJewel('chucPhuc'); chaosPickRecipe('bless'); doChaos();
      o.chucPhuc = { plus: it.plus, ngocTru: j0 - player.jewels.chucPhuc,
        khayConNgoc: forgeTray.filter(e => e.k === 'jewel').length,
        khayConDo: forgeTray.filter(e => e.k === 'item').length }; }
    // 3b Đổi hệ — chỉ VŨ KHÍ mới có hệ (giáp không còn mang hệ từ bản "hệ vũ khí có tác dụng")
    reset();
    { const it = player.equip.vukhi; const e0 = it.element;
      chaosAddItem(it.uid); chaosAddJewel('honDon'); chaosPickRecipe('element'); doChaos();
      o.doiHe = { doi: it.element !== e0, heCu: e0, heMoi: it.element }; }
    reset();
    { const rec = CHAOS_RECIPES.find(x => x.id === 'element');
      o.doiHe.nhanGiap = !!rec.match({ items:[player.equip.ao], jewels:{ honDon:1 } }); }
    // 3c Sinh Mệnh
    reset();
    { const it = player.equip.quan; it.life = 0;
      chaosAddItem(it.uid); chaosAddJewel('sinhMenh'); chaosPickRecipe('life');
      const rate = chaosCurrent().p.rate; doChaos();
      o.sinhMenh = { rate, bac: it.life }; }
    // 3d Rèn thường: Huyền Thiết đã gỡ, phí rèn nay TRỌN VẸN bằng Lumen (xem GO_HUYENTHIET)
    reset();
    { const it = player.equip.tay; it.plus = 0; const s0 = player.silver;
      chaosAddItem(it.uid); chaosPickRecipe('ren'); doChaos();
      o.renThuong = { plus: it.plus, truBac: s0 - player.silver > 0 }; }
    // (3e Tấn Phẩm đã gỡ cùng công thức.)
    // 3f Kế Thừa
    reset();
    { const it = player.inv.find(x => !x.special && x.tier != null && x.tier < GIAI_MAX);
      if (it){ const t0 = it.tier; chaosAddItem(it.uid); chaosPickRecipe('kethua'); doChaos();
        o.keThua = { tu: t0, den: it.tier }; } else o.keThua = '(không có đồ dưới giai X)'; }
    // 3g Lò Hỗn Loạn: 3 món cùng phẩm phải BIẾN MẤT dù thành hay bại
    reset();
    { const three = [];
      for (let i = 0; i < 3; i++){ const it = genSpecific('non', 1, 60); it.rarity = 1; player.inv.push(it); three.push(it); }
      {
        for (const it of three) chaosAddItem(it.uid);
        const co = !!chaosMatches().find(x => x.rec.id === 'hopnhat');
        const n0 = player.inv.length;
        chaosPickRecipe('hopnhat'); doChaos();
        o.honLoan = { co, conLai: three.filter(x => player.inv.includes(x)).length, tuiGiam: n0 - player.inv.length, khaySach: forgeTray.length };
      } }
    // (3h Đổi Cổ Thần đã gỡ cùng hệ Cổ Thần.)

    // ── 4. Khay tự nhả món đã biến mất (không giữ uid ma) ─────────────
    reset();
    { const it = player.inv[0]; chaosAddItem(it.uid);
      player.inv.splice(player.inv.indexOf(it), 1);
      o.khayTuDon = trayView().items.length; }

    // ── 5. NPC Tông Sư mở đúng cỗ máy, không mở màn thứ hai ───────────
    reset(); closePanels();
    (()=>{ const _n = NPCS.find(x => x.talk === 'forge'); if (_n){ if (curMap !== _n.map) travelTo(_n.map); player.x = _n.x + 30; player.y = _n.y + 30; } })(); renderBaGua();
    // Lò rèn tách ra #panel-forge — soi bảng đó, và soi thêm rằng bảng Nhân Vật KHÔNG bật theo
    // (bản cũ lò nằm trong bảng Nhân Vật nên hai thứ luôn mở cùng nhau).
    o.npcMoMay = { panelForge: !el('panel-forge').classList.contains('hidden'),
                   panelChar: !el('panel-char').classList.contains('hidden'),
                   panelQuest: !el('panel-quest').classList.contains('hidden') };
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (r.tenDinhKiemHiep.length) fail(`còn tên kiếm hiệp: ${r.tenDinhKiemHiep.join(', ')}`);
  if (r.soTen !== 45) fail(`bảng tên có ${r.soTen} tên, cần 45`);
  if (!r.khayTrong.includes('cloak'))
    fail(`khay trống + chưa có áo choàng phải ra công thức cloak: ${JSON.stringify(r.khayTrong)}`);
  if (r.khayTrong_coAoChoang.includes('cloak'))
    fail('đã có áo choàng cấp 2 mà công thức luyện áo choàng vẫn bật');
  if (!r.motMon_plus3.includes('ren')) fail('1 món +3 trong khay mà không ra Rèn Thường');
  if (!r.themChucPhuc.includes('bless')) fail('bỏ Chúc Phúc vào khay mà công thức bless chưa đủ');
  if (!r.plus9_ngoaiLoRen.includes('phathien(khoá)'))
    fail(`ngoài Lò Rèn Hoàng Gia mà Phá Thiên không bị khoá: ${JSON.stringify(r.plus9_ngoaiLoRen)}`);
  if (r.plus9_taiLoRen[0] !== 'mở') fail('tại Lò Rèn Hoàng Gia mà Phá Thiên vẫn khoá');
  if (r.chucPhuc.plus !== 3) fail(`Chúc Phúc không lên +1 (còn +${r.chucPhuc.plus})`);
  if (r.chucPhuc.ngocTru !== 1) fail(`Chúc Phúc trừ ${r.chucPhuc.ngocTru} viên, phải là 1`);
  if (r.chucPhuc.khayConNgoc !== 0) fail('khay chưa nhả viên ngọc đã dùng');
  if (r.chucPhuc.khayConDo !== 1) fail('khay nhả luôn món đồ — phải giữ lại để khảm tiếp');
  if (!r.doiHe.doi) fail(`Đổi Hệ không đổi được hệ (${r.doiHe.heCu} → ${r.doiHe.heMoi})`);
  if (r.doiHe.nhanGiap) fail('Đổi Hệ vẫn nhận GIÁP — giáp không có hệ, ăn 1 Hỗn Độn Châu cho không');
  if (r.sinhMenh.rate !== 75) fail(`Sinh Mệnh bậc 0 phải 75%, đo ${r.sinhMenh.rate}`);
  if (r.renThuong.plus !== 1) fail(`Rèn Thường +0→+1 hỏng (ra +${r.renThuong.plus})`);
  if (!r.renThuong.truBac) fail('Rèn Thường không trừ Lumen');
  if (r.keThua.den !== r.keThua.tu + 1) fail(`Kế Thừa: giai ${r.keThua.tu} → ${r.keThua.den}`);
  if (!r.honLoan.co) fail('không nhận ra công thức Lò Hỗn Loạn');
  if (r.honLoan.conLai !== 0) fail(`Lò Hỗn Loạn còn sót ${r.honLoan.conLai} món hiến tế`);
  if (r.honLoan.khaySach !== 0) fail('Lò Hỗn Loạn không dọn khay');
  if (r.khayTuDon !== 0) fail('khay còn giữ món đã biến mất khỏi túi');
  if (!r.npcMoMay.panelForge) fail(`NPC không mở cỗ máy: ${JSON.stringify(r.npcMoMay)}`);
  if (r.npcMoMay.panelChar) fail('mở lò mà bảng Nhân Vật cũng bật theo — hai bảng đã tách rồi');
  if (r.npcMoMay.panelQuest) fail('NPC vẫn mở màn rèn thứ hai — chưa gộp xong');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
