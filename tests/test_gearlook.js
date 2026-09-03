// Trang bị phải NHÌN THẤY ĐƯỢC trên nhân vật.
// Trước thay đổi này, mặc full Chí Tôn giai 10 +11 Hoàn Hảo Cổ Thần chỉ đổi 718/62.400 px
// (1,15%), và toàn bộ 718 px đó là một đốm sáng cạnh bàn tay — thân người 0 px.
// Test đo lại đúng phép đo đó, cộng thêm: từng lớp (bóng dáng / chất liệu / hoa văn) phải
// đóng góp riêng, và đường VIỀN NGOÀI phải đổi (hào quang không đổi được viền).
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const res = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 100; vhAutoLearn(); calcDerived();
    const out = { shots: {} };

    // vẽ nhân vật với một cấu hình trang bị cho trước
    function shot(gv, tier){
      const cv = document.createElement('canvas'); cv.width = HERO_W; cv.height = HERO_H;
      const g = cv.getContext('2d');
      drawHeroFigure(g, 'thieulam', tier, 0, HERO_POSE0, gv);
      return { data: g.getImageData(0, 0, HERO_W, HERO_H).data, url: cv.toDataURL('image/png') };
    }
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) n++; return n; };
    // Đường viền ngoài của phần THÂN ĐẶC.
    // Ngưỡng alpha phải cao (180), không phải >8: hào quang bậc cao là một đĩa gradient bán
    // trong suốt phủ kín khung, lấy ngưỡng thấp thì "đường viền" hoá ra là mép đĩa hào quang
    // và phép đo mất sạch ý nghĩa (đo nhầm cho ra 912 px trong khi thân người chỉ đổi 117).
    const OPAQUE = 180;
    const outline = a => { const S = new Set();
      for (let y = 1; y < HERO_H-1; y++) for (let x = 1; x < HERO_W-1; x++){
        const i = (y*HERO_W+x)*4; if (a[i+3] < OPAQUE) continue;
        if (a[i-4+3] < OPAQUE || a[i+4+3] < OPAQUE || a[i-HERO_W*4+3] < OPAQUE || a[i+HERO_W*4+3] < OPAQUE) S.add(x+','+y);
      } return S; };
    const outlineDiff = (a, b) => { const A = outline(a), B = outline(b);
      let n = 0; for (const k of A) if (!B.has(k)) n++; for (const k of B) if (!A.has(k)) n++; return n; };

    // dựng gv thủ công theo bậc hiệu dụng
    const mkGv = (t, n, rarity, setColor) => ({ n, rarity, t, plus: 0,
      rcol: RARITIES[rarity] ? RARITIES[rarity].color : null, wTier: 0, setColor: setColor || null });

    const A = shot(null, 1);                                  // trần trụi, Thần Binh 1
    const B = shot(mkGv(10, 5, 4, '#3ac88a'), 10);            // full giai 10, Chí Tôn, đủ bộ Cổ Thần
    out.tongDoi = diff(A.data, B.data);
    out.tongDoiPct = +(100 * out.tongDoi / (HERO_W*HERO_H)).toFixed(2);
    out.vienNgoaiDoi = outlineDiff(A.data, B.data);
    out.shots.A_tranTrui = A.url; out.shots.B_fullDo = B.url;

    // ── từng lớp đóng góp riêng bao nhiêu ──
    // (so ở cùng bậc bảng màu 10, chỉ đổi gv ⇒ chênh lệch CHỈ đến từ 4 lớp mới)
    const base = shot(null, 10);                              // bảng màu bậc 10, KHÔNG có gv
    out.lop_tatCa = diff(base.data, shot(mkGv(10, 5, 4, null), 10).data);
    out.lop_chiChatLieu_hoaVan = diff(base.data, shot(mkGv(2.9, 5, 4, null), 10).data); // <2.5? không, 2.9 ⇒ có vai bậc1
    // bậc thấp: chỉ chất liệu (t=1.5 → chưa có vai <2.5, chưa hoa văn <3, chưa chóp mũ <4.5)
    out.lop_chiChatLieu = diff(base.data, shot(mkGv(1.5, 5, 0, null), 10).data);
    out.shots.C_bac10_khongDo = base.url;

    // ── thang bậc ──
    // Đo TÍCH LUỸ so với trần trụi, không so nấc-với-nấc: các mốc mọc thêm chi tiết nằm ở
    // 2.5/3.5/4.5/5.5/6.5/7.5/8.5, lấy mẫu ở t chẵn thì có nấc rơi đúng vào giữa hai mốc và
    // "không đổi viền" chỉ là chuyện lấy mẫu, không phải chuyện bộ giáp. Điều thật sự cần
    // chứng minh là: đồ càng cao thì đường viền càng phình ra, đều đặn.
    out.thang = [];
    const bare = shot(null, 10).data;
    let prev = null;
    for (const t of [0, 2, 4, 6, 8, 10]){
      const s = shot(t ? mkGv(t, 5, Math.min(4, Math.floor(t/2.5)), null) : null, 10);
      out.thang.push({ t,
        vienSoVoiTranTrui: outlineDiff(bare, s.data),
        doiSoVoiNacTruoc: prev ? diff(prev, s.data) : null });
      out.shots['T' + t] = s.url;
      prev = s.data;
    }

    // ── màu bộ Cổ Thần phải nhuốm được hào quang ──
    out.mauBo = diff(shot(mkGv(10,5,4,null),10).data, shot(mkGv(10,5,4,'#ff6a3a'),10).data);

    // ── an toàn ──
    out.gvNull_khiChuaCoPlayer = (() => { const _p = window.player; window.player = null;
      let ok = true; try { gearVisual(null); gearVisual(window.player); heroCardUrl('thieulam', 1); }
      catch (e){ ok = false; out.crashMsg = String(e); } window.player = _p; return ok; })();

    // heroTier nay CHỈ theo trang bị — Thần Binh đã gỡ, không còn trục thứ hai nào đẩy nó lên,
    // nên cởi hết đồ là về bậc 1 (trước đây nó bị Thần Binh giữ ở tầng đang có).
    player.equip = {}; calcDerived();
    out.heroTier_tranTrui = heroTier(player);
    for (const k of HERO_ARMOR_SLOTS){ const it = genItem(112, 0); it.slot = k; it.tier = GIAI_MAX; player.equip[k] = it; }
    calcDerived();
    out.heroTier_theoDo = heroTier(player);

    // cache chân dung phải đổi theo trang bị
    const u1 = heroCardUrl('thieulam', heroTier(player), gearVisual(player));
    player.equip = {}; calcDerived();
    const u2 = heroCardUrl('thieulam', heroTier(player), gearVisual(player));
    out.cache_doiTheoDo = u1 !== u2;

    return out;
  });

  const dir = __dirname + '/gearlook';
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, url] of Object.entries(res.shots))
    fs.writeFileSync(`${dir}/${k}.png`, Buffer.from(url.split(',')[1], 'base64'));
  delete res.shots;

  console.log(JSON.stringify(res, null, 1));
  console.log('ảnh →', dir);

  let bad = 0;
  const fail = m => { console.log('FAIL', m); bad++; };
  // Mốc cũ: 718 px (1,15%). Đặt ngưỡng cao hơn hẳn để "vẫn gần như vô hình" bị trượt.
  if (res.tongDoi < 4000) fail(`đổi quá ít pixel: ${res.tongDoi} (mốc cũ 718; cần >4000)`);
  if (res.vienNgoaiDoi < 300) fail(`ĐƯỜNG VIỀN gần như không đổi: ${res.vienNgoaiDoi} — hào quang đổi được màu nhưng không đổi được dáng, đây mới là thứ thấy từ xa`);
  if (res.lop_chiChatLieu < 400) fail('lớp CHẤT LIỆU không đóng góp gì');
  if (res.lop_tatCa < 3000) fail('4 lớp cộng lại vẫn quá mờ nhạt');
  for (let i = 1; i < res.thang.length; i++){
    const r = res.thang[i];
    if (r.doiSoVoiNacTruoc < 150) fail(`nấc bậc ${r.t} không khác nấc trước (${r.doiSoVoiNacTruoc} px)`);
  }
  // đường viền phải PHÌNH DẦN theo bậc, không được tụt lại
  const vien = res.thang.map(r => r.vienSoVoiTranTrui);
  for (let i = 1; i < vien.length; i++)
    if (vien[i] < vien[i-1] - 30)
      fail(`đường viền TỤT ở bậc ${res.thang[i].t}: ${vien[i-1]} → ${vien[i]} (đồ cao hơn phải to hơn)`);
  if (vien[vien.length-1] < 300)
    fail(`bậc cao nhất đổi viền quá ít (${vien[vien.length-1]}) — hào quang đổi được màu nhưng không đổi được dáng`);
  if (vien.filter(v => v > 40).length < 3)
    fail(`chỉ ${vien.filter(v => v > 40).length}/6 nấc có viền khác trần trụi, cần ≥3`);
  if (res.mauBo < 200) fail('màu bộ giáp không nhuốm được hào quang');
  if (!res.gvNull_khiChuaCoPlayer) fail('crash khi chưa có player (màn chọn lớp): ' + res.crashMsg);
  if (res.heroTier_tranTrui !== 1) fail(`cởi hết đồ mà heroTier vẫn ${res.heroTier_tranTrui}, phải về 1`);
  if (res.heroTier_theoDo < 9) fail(`mặc full giai 10 mà heroTier chỉ ${res.heroTier_theoDo}`);
  if (!res.cache_doiTheoDo) fail('cache chân dung không đổi khi thay đồ — panel sẽ hiện ảnh cũ');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
