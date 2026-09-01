// So sánh trang bị (nửa còn lại của Loot 2.0) + các bẫy mà Khắc Ấn vừa tạo ra.
// Điều quan trọng nhất cần chứng minh: món YẾU HƠN nhưng mang Khắc Ấn chưa có thì hệ thống
// phải nhận ra — mũi ▲ thuần lực chiến sẽ nói ngược, và tự-mặc-đồ sẽ vứt nó đi.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 90; vhAutoLearn(); calcDerived();
    const o = {};

    // Món thử nghiệm TẤT ĐỊNH cho ô 'non'.
    // (Không dùng genItem rồi ghi đè slot/rarity: genItem random cả ô lẫn dòng phụ, nên
    //  main.v vẫn tính theo ô CŨ — món "yếu" từng bị đúc thành vũ khí và hoá ra mạnh gấp 4.)
    let _tuid = 90000;
    const SUBK = ['atkPct','defPct','hpPct','crit'];
    const mk = (plus, rar, nSubs) => {
      const sl = SLOTS.find(s => s.id === 'non'), tier = 9;
      return {
        uid: ++_tuid, slot:'non', slotName:'Nón', name:`Nón thử ${rar}/+${plus}`,
        rarity: rar, level: 90, tier, perfect:false, luck:false, life:0, ancient:null, sigil:null,
        main: { k: sl.main, v: sl.base(tier, rar), name: mainName(sl.main) },
        element: 'Kim',
        subs: Array.from({ length: nSubs == null ? 2 : nSubs }, (_, i) =>
          ({ k: SUBK[i % 4], name: subName(SUBK[i % 4]), v: 5 + i, pct: true })),
        plus, awakened: AWAKENED[0],
      };
    };
    const reset = () => {
      player.inv = []; player.equip = {}; player.autoEquip = true; player.autoSell = false;
      calcDerived();
    };

    // ── 1. So sánh cơ bản: có nêu %, có liệt kê chênh lệch từng dòng ──
    reset();
    const strong = mk(9, 4), weak = mk(0, 1);
    player.equip.non = weak; calcDerived();
    const h1 = tipVerdict(strong);
    o.manhHon_noiDung = h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
    o.manhHon_baoMạnh = /▲ Mạnh hơn \d+%/.test(h1);
    o.manhHon_coDongChenh = /[+-]\d/.test(tipCard(strong, weak, ''));  // delta nay nằm trong thẻ, không ở dòng phán quyết

    player.equip.non = strong; calcDerived();
    const h2 = tipVerdict(weak);
    o.yeuHon_baoYeu = /▼ Yếu hơn \d+%/.test(h2);

    // ô trống
    reset();
    o.oTrong = /Ô đang trống/.test(tipVerdict(strong));

    // chưa đủ cấp
    reset(); player.level = 2; calcDerived();
    o.chuaDuCap = /Chưa đủ cấp/.test(tipVerdict(strong));
    player.level = 90; calcDerived();

    // ── 2. BẪY CHÍNH: món yếu hơn nhưng mang Khắc Ấn mới ──
    reset();
    const big = mk(11, 4);                     // đồ đang mặc, rất mạnh
    const small = mk(0, 0);                    // đồ nhặt được, yếu hẳn
    small.sigil = 'dk_lantram';                // ...nhưng có Khắc Ấn Dark Knight
    player.equip.non = big; calcDerived();
    o.lucChien = { dangMac: itemPower(big), nhatDuoc: itemPower(small) };
    o.yeuHon_thatSu = itemPower(small) < itemPower(big);
    const h3 = tipVerdict(small);
    o.nhanRa_KhacAnMoi = /◆ Mới:/.test(h3);
    o.itemSigilNew_dung = itemSigilNew(small) === 'dk_lantram';

    // tự-mặc-đồ (nhặt được) phải mặc nó vào DÙ yếu hơn
    player.inv.push(small);
    tryAutoEquip(small);
    o.tuMac_nhanKhacAn = player.equip.non === small;

    // ── 3. Không được tháo mất Khắc Ấn đang có ──
    reset();
    const sigItem = mk(0, 2); sigItem.sigil = 'dk_lantram';
    player.equip.non = sigItem; calcDerived();
    o.dangCo_khacAn = !!player.sigils.dk_lantram;
    const bigger = mk(11, 4);                  // mạnh hơn nhiều, KHÔNG có Khắc Ấn
    o.itemSigilLost_dung = itemSigilLost('non', bigger) === 'dk_lantram';
    player.inv.push(bigger);
    tryAutoEquip(bigger);
    o.tuMac_khongThaoKhacAn = player.equip.non === sigItem;
    // nút "Mặc Đồ Tốt Nhất" cũng phải giữ
    autoEquipBest();
    o.macTotNhat_khongThaoKhacAn = player.equip.non === sigItem;
    o.canhBao_seMat = /⚠ Mất /.test(tipVerdict(bigger));

    // ── 4. "Mặc Đồ Tốt Nhất" phải CHỌN món mang Khắc Ấn mới ──
    reset();
    const plain = mk(9, 4);                    // mạnh
    const sig2 = mk(2, 2); sig2.sigil = 'dk_thanhluy';   // yếu hơn nhưng có Khắc Ấn
    player.inv.push(plain, sig2);
    autoEquipBest();
    o.macTotNhat_uuTienKhacAn = player.equip.non === sig2;
    o.lucChien2 = { plain: itemPower(plain), sig2: itemPower(sig2) };

    // ── 5. Không auto-bán / không bán một chạm món có Khắc Ấn ──
    reset();
    player.autoSell = true;
    const trash = mk(0, 0); trash.sigil = 'dk_lantram';   // độ hiếm 0 = diện auto-bán
    player.inv.push(trash);
    const nBefore = player.inv.length;
    window._sellArm = -1;
    sellItem(0);                                          // lần bấm đầu chỉ được "hỏi lại"
    o.banMotCham_biChan = player.inv.length === nBefore;

    // ── 6. Khắc Ấn của lớp KHÁC không được coi là nâng cấp ──
    reset();
    const wrong = mk(0, 1); wrong.sigil = 'dw_vongam';     // Dark Wizard, ta đang là Dark Knight
    player.equip.non = mk(9, 4); calcDerived();
    o.saiLop_khongTinh = itemSigilNew(wrong) === null;
    o.saiLop_nhanRo = /lớp khác/.test(tipCard(wrong, null, ''));   // thẻ rê chuột ghi '(lớp khác)'

    // ── 7. Cảnh báo rời bộ Cổ Thần ──
    reset();
    const slots = ['non','ao','tay','quan','chan'];
    for (const s of slots) player.equip[s] = genAncient('sarkaan', s, 90);
    calcDerived();
    o.boDayDu = (player.setActive.sarkaan || {}).n === 5;
    o.canhBao_roiBo = /⚠ Rời bộ/.test(tipVerdict(mk(11, 4)));

    // ── 8. Túi đồ vẽ được, có cả ▲ lẫn ◆ ──
    reset();
    player.equip.non = mk(5, 2); calcDerived();
    const up = mk(11, 4);                       // mạnh hơn → ▲
    const sg = mk(0, 0); sg.sigil = 'dk_lantram';  // Khắc Ấn mới → ◆
    player.inv.push(up, sg);
    renderBag();
    const bagHtml = el('panel-bag').innerHTML;
    o.tuiDo_co_muiTen = bagHtml.includes('▲');
    o.tuiDo_co_khacAn = bagHtml.includes('◆');

    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0;
  const need = (k, msg) => { if (!r[k]) { console.log('FAIL', msg || k); bad++; } };

  need('manhHon_baoMạnh', 'không báo "▲ Mạnh hơn N%"');
  need('manhHon_coDongChenh', 'không liệt kê chênh lệch từng dòng chỉ số');
  need('yeuHon_baoYeu', 'không báo "▼ Yếu hơn N%"');
  need('oTrong', 'không nhận ra ô trống');
  need('chuaDuCap', 'không cảnh báo chưa đủ cấp');

  need('yeuHon_thatSu', 'dựng test sai — món Khắc Ấn phải YẾU hơn thì mới kiểm được');
  need('itemSigilNew_dung', 'itemSigilNew() không nhận ra Khắc Ấn mới');
  need('nhanRa_KhacAnMoi', 'so sánh không nêu "Mang về Khắc Ấn mới"');
  need('tuMac_nhanKhacAn', 'tự-mặc-đồ bỏ qua món mang Khắc Ấn mới vì nó yếu hơn');

  need('dangCo_khacAn', 'dựng test sai — Khắc Ấn chưa kích hoạt');
  need('itemSigilLost_dung', 'itemSigilLost() không nhận ra sẽ mất Khắc Ấn');
  need('tuMac_khongThaoKhacAn', 'tự-mặc-đồ tháo mất Khắc Ấn');
  need('macTotNhat_khongThaoKhacAn', '"Mặc Đồ Tốt Nhất" tháo mất Khắc Ấn');
  need('canhBao_seMat', 'không cảnh báo sẽ mất Khắc Ấn');

  need('macTotNhat_uuTienKhacAn', '"Mặc Đồ Tốt Nhất" bỏ qua món mang Khắc Ấn mới');
  need('banMotCham_biChan', 'món có Khắc Ấn bị bán mất trong một chạm');
  need('saiLop_khongTinh', 'Khắc Ấn lớp khác bị tính là nâng cấp');
  need('saiLop_nhanRo', 'nhãn món không ghi rõ Khắc Ấn lớp khác vô dụng');
  need('boDayDu', 'dựng test sai — bộ Cổ Thần chưa đủ 5');
  need('canhBao_roiBo', 'không cảnh báo rời bộ Cổ Thần');
  need('tuiDo_co_muiTen', 'túi đồ không có ▲');
  need('tuiDo_co_khacAn', 'túi đồ không có ◆');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
