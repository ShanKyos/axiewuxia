// Bảng rơi: đo bằng MÔ PHỎNG CÀY THẬT, không đọc hằng số. Thứ cần chứng minh là con số người
// chơi cảm nhận được — mấy giờ ra một viên ngọc, đồ Hoàn Hảo đến từ đâu.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const o = {};
    const N = 5000;
    // đo tỉ lệ rơi trang bị theo dải × loại, dùng CHÍNH hàm game dùng
    o.tiLeRoi = {};
    for (const [lv, ten] of [[10,'I'],[30,'II'],[50,'III'],[70,'IV'],[100,'V']]){
      o.tiLeRoi[ten] = {};
      for (const k of ['mob','elite']){
        const def = { lv, drop: 0.5 };
        o.tiLeRoi[ten][k] = +(mobDropRate(def, k) * 100).toFixed(1);
      }
    }
    // con "giàu" vs con "nghèo" CÙNG dải phải khác nhau, nhưng không phá mức của dải
    o.giauNgheo = {
      ngheo: +(mobDropRate({ lv:10, drop:0.14 }, 'mob') * 100).toFixed(2),
      giau:  +(mobDropRate({ lv:10, drop:1.0  }, 'mob') * 100).toFixed(2),
    };
    // ── Ngọc: mô phỏng N con quái thường dải III ──
    const đếmNgọc = (srcK, lv, n) => {
      player.jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
      const def = { lv };
      for (let i = 0; i < n; i++) rollJewels(def, srcK);
      return { ...player.jewels };
    };
    // 1 TRIỆU con, không phải 40k. Từ khi nhịp ngọc về đích 3 Chúc Phúc/giờ thì tỉ lệ mỗi con
    // hạ ~11 lần: ở 40k, chucPhuc kỳ vọng 33 vs linhHon 22 với sd≈5,5 — hai phân bố chồng lên
    // nhau và phép so thứ tự hiếm HOÀ thường xuyên (đã bắt được một lần 32/32, bài đỏ oan trong
    // khi bảng hoàn toàn đúng). Ở 1 triệu thì 833 vs 555, sd≈29 — cách nhau gần 10 sd.
    o.ngoc_thuong_daiIII = đếmNgọc('mob', 50, 1000000);
    o.ngoc_tinhanh_daiIII = đếmNgọc('elite', 50, 200);
    o.ngoc_boss_daiV = đếmNgọc('thuve', 100, 50);
    // ── NGỌC MỖI GIỜ: con số người chơi thật sự cảm nhận ──
    // Đích chủ dự án chốt: ~3 Chúc Phúc · 2 Linh Hồn · 1 Sinh Mệnh mỗi giờ, neo ở DẢI GIỮA
    // (cấp 41–60) vì đó là chỗ tốn nhiều giờ chơi nhất. Quy đổi bằng NHIP_CAY — nhịp cày đo
    // được bằng AUTO. Không đọc hằng số: mô phỏng thẳng qua rollJewels().
    const ngocMoiGio = (lv, dai) => {
      // 2 triệu: loại hiếm nhất (Hỗn Độn, 0,5/giờ) kỳ vọng 278 viên, sd≈16,7 — dung sai ±25%
      // của bài là ±69 viên, tức 4,1 sd. Ở 300k thì chỉ còn 1,6 sd và bài đỏ ngẫu nhiên ~11%
      // số lần chạy. Đo được đúng một lần như thế: 0,67 viên/giờ trên đích 0,5.
      const n = 2000000;
      const đ = đếmNgọc('mob', lv, n);
      const K = NHIP_CAY;                    // dải giữa cày xấp xỉ đúng nhịp tham chiếu
      const r2 = {};
      for (const k in đ) r2[k] = +(đ[k] / n * K).toFixed(2);
      return r2;
    };
    o.ngocMoiGio_daiGiua = ngocMoiGio(50, 2);
    o.dichNgoc = { ...NGOC_MOI_GIO };

    // ── PHỤ KIỆN TÁCH CUỘN RIÊNG ──
    // Hai điều phải đúng cùng lúc: (a) bể ô trang bị KHÔNG còn dây chuyền/nhẫn, (b) tỉ lệ phụ
    // kiện đúng 1%/con. Thiếu (a) thì phụ kiện rơi cả hai đường và 1% chỉ là con số trên giấy.
    const đếmÔ = (slots, n) => { const c = {};
      for (let i = 0; i < n; i++){ const it = genItem(50, 0, 'mob', { slots }); c[it.slot] = (c[it.slot]||0)+1; }
      return c; };
    o.oTrangBi = Object.keys(đếmÔ(DROP_O_TRANGBI, 4000)).sort();
    o.oPhuKien = Object.keys(đếmÔ(DROP_O_PHUKIEN, 4000)).sort();
    o.tiLePhuKien = DROP_PHUKIEN;
    o.phuKienMoiGio = +(DROP_PHUKIEN * NHIP_CAY).toFixed(1);

    // ── CÚ RỚT THẲNG +9 ──
    // 0,1% trên món đã rơi, CHỈ đường quái. Rương phó bản, Box Kundun và tiệm phải bằng 0.
    const đếmP9 = (srcK, n, opts) => { let c = 0;
      for (let i = 0; i < n; i++) if (genItem(50, 0, srcK, opts).plus >= DROP_PLUS9_MUC) c++;
      return +(c / n * 100).toFixed(3); };
    o.p9_quai   = đếmP9('mob', 400000);
    o.p9_boss   = đếmP9('thuve', 400000);
    o.p9_ruong  = đếmP9('box5', 100000);
    o.p9_khongNguon = đếmP9(null, 100000);           // tiệm, Lò Hỗn Loạn, đồ tặng
    o.p9_mucRen = DROP_PLUS9_MUC;
    // ép tỉ lệ: mức rèn phải đúng DROP_PLUS9_MUC, không phải một con số khác
    o.p9_mucThucTe = (() => { const it = genItem(50, 0, 'mob', { plus9: 1 }); return it.plus; })();

    // ── CHỐNG ĐỠ: dòng CỨNG trên MỌI món, mọi đường sinh đồ ──
    // Ba điều: (a) có trên 100% món, kể cả phụ kiện; (b) CỨNG — cùng giai thì cùng con số,
    // không bốc ngẫu nhiên; (c) lên theo mức rèn.
    const cdCua = (slots, n) => { let co = 0; const gt = new Set();
      for (let i = 0; i < n; i++){
        const d = genItem(50, 0, 'mob', { slots }).subs.find(x => x.cung);
        if (d){ co++; gt.add(d.v); }
      }
      return { pct: +(co/n*100).toFixed(1), soGiaTri: gt.size, giaTri: [...gt][0] };
    };
    o.cd_trangBi = cdCua(DROP_O_TRANGBI, 3000);
    o.cd_phuKien = cdCua(DROP_O_PHUKIEN, 3000);
    // genSpecific() là ĐƯỜNG THỨ HAI (/gen, đồ thưởng nhiệm vụ) — nó tự dựng dòng phụ nên rất
    // dễ bị bỏ quên. Đã quên đúng một lần: đo ra tỉ lệ đỡ đòn bằng 0 sau khi /gen đủ bộ giai 7.
    o.cd_genSpecific = +(Array.from({length:600}, () =>
      genSpecific('ao', 2, 100).subs.some(x => x.cung) ? 1 : 0).reduce((a,c)=>a+c,0) / 600 * 100).toFixed(1);
    o.cd_theoGiai = [1,4,7].map(t => chongDoGiai(t));
    // lên theo mức rèn: đủ bộ giai 7, +0 so với +9
    const doDon = (plus) => { cheatExec('/gen 7 +' + plus); calcDerived();
      return +(player.excBlock * 100).toFixed(1); };
    o.cd_doDon_plus0 = doDon(0);
    o.cd_doDon_plus9 = doDon(9);

    // ── VẬN: 50% món rơi, mỗi món có Vận kèm một dòng Sát Thương Tối Đa 1–5% ──
    let van = 0, coDong = 0; const gtST = new Set();
    for (let i = 0; i < 20000; i++){
      const it = genItem(50, 0, 'mob', { slots: DROP_O_TRANGBI });
      if (!it.luck) continue;
      van++;
      const d = it.subs.find(x => x.van);
      if (d){ coDong++; gtST.add(d.v); }
    }
    o.van_pct = +(van/20000*100).toFixed(1);
    o.van_moiMonCoDong = van === coDong;
    o.van_giaTri = [...gtST].sort((a,c)=>a-c);

    // ── Hoàn Hảo: quái rơi 0,5% (chủ dự án chốt), Box Kundun luôn ra ──
    const đếmHH = (srcK, n) => { let c = 0;
      for (let i = 0; i < n; i++) if (genItem(50, 0, srcK).perfect) c++;
      return +(c / n * 100).toFixed(2); };
    o.hh_quaiThuong = đếmHH('mob', 200000);
    o.hh_tinhAnh    = đếmHH('elite', 200000);
    o.hh_boss       = đếmHH('thuve', 200000);
    o.hh_tuongQuan  = đếmHH('tranai', 200000);
    // Rương Boss Săn KHÔNG còn là con đường thứ ba tới Hoàn Hảo
    o.hh_ruongSan = {}; for (const t of [1,2,3,4,5]) o.hh_ruongSan['box'+t] = đếmHH('box'+t, 20000);
    const đếmHHHap = (t, n) => { let c = 0;
      for (let i = 0; i < n; i++) if (genItem(50, 0.5, null, { perfect: BAOHAP_PERFECT[t] }).perfect) c++;
      return +(c / n * 100).toFixed(1); };
    o.hh_hap = { II: đếmHHHap(2, 2000), IV: đếmHHHap(4, 2000), VII: đếmHHHap(7, 2000) };
    // ── Vũ khí PHẢI Hoàn Hảo được (trước đây armorGroup chặn cứng) ──
    let vkHH = 0, giapHH = 0;
    for (let i = 0; i < 3000; i++){
      const it = genItem(50, 0.5, null, { perfect: 1, bhTier: 7 });
      if (it.slot === 'vukhi' && it.perfect) vkHH++;
      if (ARMOR_SLOTS.includes(it.slot) && it.perfect) giapHH++;
    }
    o.vuKhiHoanHaoDuoc = vkHH > 0; o.giapHoanHaoDuoc = giapHH > 0;
    // ── Dòng Hoàn Hảo: đúng bộ dòng riêng, số dòng theo tầng hạp ──
    const mkHH = (slotId, t) => { let it = null;
      for (let i = 0; i < 200; i++){ it = genItem(50, 0.5, null, { perfect: 1, bhTier: t });
        if (it.slot === slotId) return it; }
      return null; };
    const wv = mkHH('vukhi', 7), ar = mkHH('ao', 2);
    o.vk_soDong = wv ? wv.exc.length : -1;
    o.vk_dongTuBangVuKhi = wv ? wv.exc.every(e => EXC_WEAPON.some(x => x.k === e.k)) : false;
    o.giap_soDong = ar ? ar.exc.length : -1;
    o.giap_dongTuBangGiap = ar ? ar.exc.every(e => EXC_ARMOR.some(x => x.k === e.k)) : false;
    // ── Dòng Hoàn Hảo phải CÓ TÁC DỤNG, không chỉ hiện trên nhãn ──
    player.level = 60; player.equip = {}; calcDerived();
    const base = { atk: player.atk, qi: player.excQi || 0, block: player.excBlock || 0 };
    const w2 = mkHH('vukhi', 7);
    w2.exc = [{ k:'excQi', name:'Hạ địch hồi Qi', v:8, flat:true },
              { k:'excAtkLv', name:'ST theo cấp', v:1, flat:true }];
    player.equip.vukhi = w2; calcDerived();
    o.tacDung = { hoiQi: player.excQi, atkTang: player.atk > base.atk, stTheoCap: Math.floor(60/20) };
    const a2 = mkHH('ao', 7);
    a2.exc = [{ k:'excBlock', name:'Tỉ lệ Đỡ Đòn', v:10 }];
    player.equip = { ao: a2 }; calcDerived();
    o.tacDung.doDon = +(player.excBlock * 100).toFixed(0);
    // lực chiến phải ĐẾM dòng Hoàn Hảo
    const plain = mkHH('ao', 2); const excCopy = JSON.parse(JSON.stringify(plain));
    plain.exc = null;
    o.lucChien = { coHH: itemPower(excCopy), khongHH: itemPower(plain) };

    // ── TRẦN GIẢM SÁT THƯƠNG: 4% × 6 ô ────────────────────────────────────────────
    // DMGRED_SO_O viết thẳng số 6 trong game.js vì lý do TDZ (EXC_ARMOR và ARMOR_SUBS đọc
    // DMGRED_MOI_MON trước khi ARMOR_SLOTS tồn tại). Số viết tay thì phải có bài gác, kẻo
    // ai đó thêm một ô giáp thứ bảy mà trần vẫn nằm ở 24%.
    o.tran = { moiMon: DMGRED_MOI_MON, soO: DMGRED_SO_O, tran: DMGRED_TRAN,
               oGiap: ARMOR_SLOTS.slice().sort() };
    // Nhồi quá trần rồi xem calcDerived có chặn không. Sáu món giáp Hoàn Hảo rèn +9: mỗi món
    // 4% × (1 + 9×PLUS_STEP) ≈ 8,7 cộng dòng phụ nữa — thừa sức vượt 24 nếu không có Math.min.
    player.equip = {};
    for (const sl of ARMOR_SLOTS){
      const it = mkHH(sl, 7); it.plus = 9;
      it.subs = [{ k:'dmgred', name:'Giảm Sát Thương', v: DMGRED_MOI_MON, pct:true }];
      it.exc = [{ k:'dmgred', name:'Giảm Sát Thương', v: DMGRED_MOI_MON }];
      player.equip[sl] = it;
    }
    calcDerived();
    o.tran.doDuoc = +player.dmgred.toFixed(2);
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const T = r.tiLeRoi;
  // ĐÍCH: mười con một món, PHẲNG qua cả năm dải. `drop:0.5` của con quái thử nhân vào ±20%
  // nên mức đo được là 10 × (0,80 + 0,40×0,5) = 10,0%.
  for (const d of ['I','II','III','IV','V']){
    if (Math.abs(T[d].mob - 10) > 0.3) fail(`dải ${d}: quái thường rơi ${T[d].mob}%, đích 10% (mười con một món)`);
    if (T[d].elite < T[d].mob * 2.8) fail(`dải ${d}: tinh anh (${T[d].elite}%) không cách quái thường đủ xa`);
  }
  if (!(r.giauNgheo.giau > r.giauNgheo.ngheo * 1.15)) fail(`46 giá trị drop: vẫn là trường chết (${r.giauNgheo.ngheo} vs ${r.giauNgheo.giau})`);
  if (r.giauNgheo.giau > 12.5) fail(`con "giàu" dải I rơi ${r.giauNgheo.giau}% — phá mức đã chốt (trần ±20% của 10%)`);
  const ng = r.ngoc_thuong_daiIII;
  if (!(ng.chucPhuc > 0)) fail('quái THƯỜNG vẫn rơi 0 ngọc — vòng kinh tế MU chưa nối');
  if (!(ng.chucPhuc > ng.linhHon && ng.linhHon > ng.sinhMenh && ng.sinhMenh > ng.honDon))
    fail(`thứ tự hiếm của 4 loại ngọc sai: ${JSON.stringify(ng)}`);
  // Hoàn Hảo từ quái: 0,5% TRÊN MÓN ĐÃ RƠI, cả bốn nguồn quái như nhau. Sai số ±0,12 ở cỡ mẫu
  // 200k (sd ≈ 0,016%, nên 0,12 là rất rộng — chỉ để bắt lỗi bảng, không bắt nhiễu).
  for (const [ten, v] of [['thường',r.hh_quaiThuong],['tinh anh',r.hh_tinhAnh],
                          ['boss',r.hh_boss],['tướng quân',r.hh_tuongQuan]])
    if (Math.abs(v - 0.5) > 0.12) fail(`Hoàn Hảo từ quái ${ten}: ${v}%, bảng chốt 0,5%`);
  for (const k in r.hh_ruongSan) if (r.hh_ruongSan[k] !== 0)
    fail(`Rương Boss Săn ${k} vẫn ra ${r.hh_ruongSan[k]}% Hoàn Hảo — đó là con đường THỨ BA, phải bằng 0`);

  // ── NHỊP NGỌC MỖI GIỜ ──
  for (const k in r.dichNgoc){
    const co = r.ngocMoiGio_daiGiua[k], can = r.dichNgoc[k];
    if (Math.abs(co - can) > can * 0.25)
      fail(`${k}: ${co} viên/giờ ở dải giữa, đích ${can} (lệch quá 25%)`);
  }
  // ── CÚ RỚT THẲNG +9 ──
  for (const [ten, v] of [['quái thường', r.p9_quai], ['boss', r.p9_boss]])
    if (Math.abs(v - 0.1) > 0.045) fail(`rớt thẳng +9 từ ${ten}: ${v}%, đích 0,1%`);
  if (r.p9_ruong !== 0) fail(`Rương Boss Săn ra ${r.p9_ruong}% món rèn sẵn — chỉ đường QUÁI mới có`);
  if (r.p9_khongNguon !== 0) fail(`đồ không từ quái (tiệm/Lò/tặng) ra ${r.p9_khongNguon}% món rèn sẵn`);
  if (r.p9_mucThucTe !== r.p9_mucRen) fail(`ép tỉ lệ ra món +${r.p9_mucThucTe}, phải +${r.p9_mucRen}`);

  // ── CHỐNG ĐỠ ──
  for (const [ten, c] of [['trang bị', r.cd_trangBi], ['phụ kiện', r.cd_phuKien]]){
    if (c.pct !== 100) fail(`Chống Đỡ chỉ có trên ${c.pct}% món ${ten} — phải là dòng cứng của MỌI món`);
    if (c.soGiaTri !== 1) fail(`Chống Đỡ trên ${ten} ra ${c.soGiaTri} giá trị khác nhau cùng một giai — phải CỨNG, không bốc`);
  }
  if (r.cd_genSpecific !== 100)
    fail(`genSpecific() chỉ gắn Chống Đỡ cho ${r.cd_genSpecific}% món — /gen và đồ thưởng nhiệm vụ sẽ thiếu`);
  if (!(r.cd_theoGiai[0] < r.cd_theoGiai[1] && r.cd_theoGiai[1] < r.cd_theoGiai[2]))
    fail(`Chống Đỡ không leo theo giai: ${JSON.stringify(r.cd_theoGiai)}`);
  if (!(r.cd_doDon_plus9 > r.cd_doDon_plus0 * 1.5))
    fail(`ép ngọc lên +9 mà Chống Đỡ gần như không đổi (${r.cd_doDon_plus0}% → ${r.cd_doDon_plus9}%)`);
  if (r.cd_doDon_plus9 >= 40)
    fail(`đủ bộ giai đỉnh +9 đã chạm trần đỡ đòn 40% (${r.cd_doDon_plus9}%) — không còn chỗ cho dòng Hoàn Hảo`);

  // ── VẬN ──
  if (Math.abs(r.van_pct - 50) > 1.5) fail(`Vận ra ${r.van_pct}% món, chủ dự án chốt 50%`);
  if (!r.van_moiMonCoDong) fail('có món mang Vận mà KHÔNG có dòng Sát Thương Tối Đa');
  if (r.van_giaTri.join(',') !== '1,2,3,4,5')
    fail(`dòng Sát Thương Tối Đa ra các giá trị ${r.van_giaTri.join(',')}, phải trải đủ 1–5`);

  // ── PHỤ KIỆN ──
  if (r.oTrangBi.join(',') !== 'ao,chan,non,tay,vukhi')
    fail(`bể ô TRANG BỊ sai: ${r.oTrangBi.join(',')} — dây chuyền/nhẫn lọt vào là 1% thành vô nghĩa`);
  if (r.oPhuKien.join(',') !== 'daychuyen,nhan1,nhan2')
    fail(`bể ô PHỤ KIỆN sai: ${r.oPhuKien.join(',')}`);
  if (Math.abs(r.tiLePhuKien - 0.01) > 1e-9)
    fail(`tỉ lệ phụ kiện ${r.tiLePhuKien}, chủ dự án chốt 1%`);
  // LUẬT ĐÃ ĐỔI có chủ đích: Box Kundun nay LUÔN ra đồ Hoàn Hảo ở mọi bậc, cái hên xui chuyển
  // sang SỐ DÒNG. Nên "Hoàn Hảo leo theo bậc hạp" không còn là mệnh đề đúng — thay bằng mệnh đề
  // mới: mọi bậc đều phải 100%. Chi tiết luật xem test_boxrule.
  for (const k in r.hh_hap) if (r.hh_hap[k] !== 100)
    fail(`Box Kundun bậc ${k} chỉ ra ${r.hh_hap[k]}% đồ Hoàn Hảo — phải 100% ở mọi bậc`);
  if (!r.vuKhiHoanHaoDuoc) fail('VŨ KHÍ vẫn không Hoàn Hảo được — armorGroup còn chặn');
  if (!r.giapHoanHaoDuoc) fail('giáp không Hoàn Hảo được');
  // Số dòng nay BỐC NGẪU NHIÊN 1–4, không còn suy từ bậc hộp. Cái phải khoá ở đây là cái TRẦN:
  // trước đó genItem còn chuyền `opts.bhTier` xuống tham số thứ hai của rollExcLines — mà tham số
  // đó nay nghĩa là SỐ DÒNG CHÍNH XÁC — nên bhTier:7 đẻ ra 7 dòng. Bài này bắt được đúng lỗi đó.
  for (const [ten, n] of [['vũ khí', r.vk_soDong], ['giáp', r.giap_soDong]]){
    if (!(n >= 1 && n <= 4)) fail(`số dòng Hoàn Hảo trên ${ten} ra ${n}, phải nằm trong 1–4`);
  }
  if (!r.vk_dongTuBangVuKhi) fail('vũ khí roll trúng dòng của GIÁP');
  if (!r.giap_dongTuBangGiap) fail('giáp roll trúng dòng của VŨ KHÍ');
  if (r.tacDung.hoiQi !== 8) fail(`dòng hồi Qi không có tác dụng (${r.tacDung.hoiQi})`);
  if (!r.tacDung.atkTang) fail('dòng ST theo cấp không làm tăng sát thương');
  // 11% chứ không phải 10%: dòng Hoàn Hảo "Tỉ lệ Đỡ Đòn" cho 10, còn dòng CỨNG Chống Đỡ của
  // chính món đó cộng thêm ~1 ở giai đang thử. Hai thứ CHỒNG vào cùng một nhánh excBlock, đó
  // là chủ ý — Chống Đỡ là nền mọi món đều có, dòng Hoàn Hảo là phần thưởng chồng lên.
  if (r.tacDung.doDon < 10) fail(`dòng Đỡ Đòn không có tác dụng (${r.tacDung.doDon}%)`);
  if (!(r.lucChien.coHH > r.lucChien.khongHH))
    fail(`lực chiến MÙ trước dòng Hoàn Hảo (${r.lucChien.coHH} = ${r.lucChien.khongHH}) — auto sẽ tháo mất đồ Hoàn Hảo`);

  // ── TRẦN GIẢM SÁT THƯƠNG ──
  const tr = r.tran;
  if (tr.moiMon !== 4) fail(`Giảm Sát Thương mỗi món ${tr.moiMon}%, chủ dự án chốt 4%`);
  if (tr.soO !== tr.oGiap.length)
    fail(`DMGRED_SO_O = ${tr.soO} nhưng ARMOR_SLOTS có ${tr.oGiap.length} ô (${tr.oGiap.join(',')}) — số viết tay đã lệch`);
  if (tr.oGiap.join(',') !== 'ao,chan,nhan1,nhan2,non,tay')
    fail(`bể ô mang Giảm Sát Thương sai: ${tr.oGiap.join(',')} — phải là nón/áo/tay/chân/2 nhẫn`);
  if (tr.tran !== 24) fail(`trần tổng ${tr.tran}%, phải là 4 × 6 = 24%`);
  if (tr.doDuoc > tr.tran + 1e-9)
    fail(`nhồi 6 món +9 ra ${tr.doDuoc}% giảm sát thương — vượt trần ${tr.tran}%, calcDerived không chặn`);
  if (tr.doDuoc < tr.tran - 1e-9)
    fail(`nhồi kịch mà chỉ ra ${tr.doDuoc}% — chưa chạm trần ${tr.tran}%, bài gác không còn đo đúng chỗ`);

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
