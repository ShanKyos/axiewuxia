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
    // 40k chứ không phải N=5000: chucPhuc kỳ vọng 63 vs linhHon 49 với sd≈8 — cỡ mẫu 5000
    // thỉnh thoảng cho hoà (đã bắt được một lần 49/49), làm phép so thứ tự hiếm đỏ oan.
    o.ngoc_thuong_daiIII = đếmNgọc('mob', 50, 40000);
    o.ngoc_tinhanh_daiIII = đếmNgọc('elite', 50, 200);
    o.ngoc_boss_daiV = đếmNgọc('thuve', 100, 50);
    // ── Hoàn Hảo: quái KHÔNG được rơi, Bảo Hạp thì có ──
    const đếmHH = (srcK, n) => { let c = 0;
      for (let i = 0; i < n; i++) if (genItem(50, 0, srcK).perfect) c++;
      return c; };
    o.hh_quaiThuong = đếmHH('mob', 2000);
    o.hh_tinhAnh    = đếmHH('elite', 2000);
    o.hh_boss       = đếmHH('thuve', 2000);
    o.hh_tuongQuan  = đếmHH('tranai', 2000);
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
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const T = r.tiLeRoi;
  for (const [d, exp] of [['I',7],['II',8],['III',9],['IV',10],['V',12]]){
    if (Math.abs(T[d].mob - exp) > 1.6) fail(`dải ${d}: quái thường rơi ${T[d].mob}%, bảng chốt ~${exp}%`);
    if (T[d].elite < T[d].mob * 2.8) fail(`dải ${d}: tinh anh (${T[d].elite}%) không cách quái thường đủ xa`);
  }
  if (!(T.V.mob > T.I.mob)) fail('dải V không rơi nhiều hơn dải I — bảng vẫn phẳng');
  if (!(r.giauNgheo.giau > r.giauNgheo.ngheo * 1.15)) fail(`46 giá trị drop: vẫn là trường chết (${r.giauNgheo.ngheo} vs ${r.giauNgheo.giau})`);
  if (r.giauNgheo.giau > 9) fail(`con "giàu" dải I rơi ${r.giauNgheo.giau}% — phá mức đã chốt cho dải`);
  const ng = r.ngoc_thuong_daiIII;
  if (!(ng.chucPhuc > 0)) fail('quái THƯỜNG vẫn rơi 0 ngọc — vòng kinh tế MU chưa nối');
  if (!(ng.chucPhuc > ng.linhHon && ng.linhHon > ng.sinhMenh && ng.sinhMenh > ng.honDon))
    fail(`thứ tự hiếm của 4 loại ngọc sai: ${JSON.stringify(ng)}`);
  if (r.hh_quaiThuong || r.hh_tinhAnh || r.hh_boss || r.hh_tuongQuan)
    fail(`Hoàn Hảo vẫn rơi từ quái (thường ${r.hh_quaiThuong} · tinh anh ${r.hh_tinhAnh} · boss ${r.hh_boss} · tướng quân ${r.hh_tuongQuan})`);
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
  if (r.tacDung.doDon !== 10) fail(`dòng Đỡ Đòn không có tác dụng (${r.tacDung.doDon}%)`);
  if (!(r.lucChien.coHH > r.lucChien.khongHH))
    fail(`lực chiến MÙ trước dòng Hoàn Hảo (${r.lucChien.coHH} = ${r.lucChien.khongHH}) — auto sẽ tháo mất đồ Hoàn Hảo`);

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
