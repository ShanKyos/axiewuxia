// TRANG BỊ PHẢI NHÌN THẤY ĐƯỢC TRÊN NHÂN VẬT — đo trên ĐÚNG đường người chơi nhìn.
//
// Bản trước đo drawHeroFigure(), hình vẽ đường: 11 kiểu vai, chỏm mũ, giáp ống, hoa văn khảm.
// Toàn bộ lớp đó đã gỡ. Giáp nay là art Spine nướng sẵn, còn drawHeroFigure chỉ là lối lui cho
// lớp chưa có bảng khung — đo ở đó thì bài kiểm báo "mặc đồ không thấy gì" trong khi ngoài màn
// nhân vật đổi hẳn bộ giáp. Nên bài này chuyển sang đo ba lớp CÒN THẬT, trên đường art nướng:
//
//   1. BỘ GIÁP  — mặc đủ bộ có art phải khác hẳn thân trần (bóng dáng, không chỉ màu)
//   2. RÈN +N   — hào quang và viền sáng phải leo theo mức rèn
//   3. THẺ NHÂN VẬT — heroCardUrl phải đổi khi thay đồ, không được trả ảnh trong đệm
//
// Còn "mỗi giai một dáng khác nhau" thì nay là tính chất của GÓI ART, không phải của mã:
// test_sets gác độ phủ và gác từng bộ có art phải khác thân trần.
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  // Bảng khung nặng ~480 KB. Chưa tải xong thì nvBo() trả null, mọi phép đo vẽ vào canvas rỗng.
  await p.waitForFunction(() => !!nvTai('dkgs1', 'webp') && !!nvTai('dk1', 'webp'),
                          { timeout: 20000 }).catch(()=>{});

  const res = await p.evaluate(() => {
    player.level = 100; vhAutoLearn(); calcDerived();
    const out = { shots: {} };

    const gvOf = (t, n, plus, rarity, setColor) => ({
      n, rarity, t, plus, rcol: giaiMau(t),
      wTier: t, wPlus: plus, setColor: setColor || null, canh: null });

    // Vẽ nhân vật ĐÚNG như trong màn: hào quang sau · bảng khung · hào quang trước.
    const shot = (gv, tier) => {
      const c = document.createElement('canvas'); c.width = NV_OW; c.height = NV_OH;
      const q = c.getContext('2d');
      const im = nvBo('thieulam', tier, gv);
      if (!im) return null;
      if (gv) nvHaoQuangSau(q, 'thieulam', tier, gv, 900);
      nvVeKhung(q, im, 'i', 0);
      if (gv) nvHaoQuangTruoc(q, 'thieulam', tier, gv, 900, im, 'i', 0);
      return { data: q.getImageData(0, 0, NV_OW, NV_OH).data, url: c.toDataURL('image/png') };
    };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) n++; return n; };
    // Đường viền ngoài của phần THÂN ĐẶC. Ngưỡng alpha phải CAO (180): hào quang bậc cao là một
    // đĩa gradient bán trong suốt phủ kín khung, lấy ngưỡng thấp thì "đường viền" hoá ra là mép
    // đĩa hào quang và phép đo mất sạch ý nghĩa.
    const OPAQUE = 180;
    const outline = a => { const S = new Set();
      for (let y = 1; y < NV_OH-1; y++) for (let x = 1; x < NV_OW-1; x++){
        const i = (y*NV_OW+x)*4; if (a[i+3] < OPAQUE) continue;
        if (a[i-4+3] < OPAQUE || a[i+4+3] < OPAQUE || a[i-NV_OW*4+3] < OPAQUE || a[i+NV_OW*4+3] < OPAQUE) S.add(x+','+y);
      } return S; };
    const outlineDiff = (a, b) => { const A = outline(a), B = outline(b);
      let n = 0; for (const k of A) if (!B.has(k)) n++; for (const k of B) if (!A.has(k)) n++; return n; };

    // ── 1. BỘ GIÁP so với THÂN TRẦN ──
    // Giai 1 của Dark Knight là bộ Thiết Phiến (dkgs1) — giai duy nhất hiện có art.
    const tran = shot(null, 1);                                   // gv null ⇒ thân trần
    const macDo = shot(gvOf(1, 4, 0, 4, null), 1);                // đủ 4 món giai 1
    out.giapDoi = diff(tran.data, macDo.data);
    out.giapDoiVien = outlineDiff(tran.data, macDo.data);
    out.shots.A_thanTran = tran.url; out.shots.B_macDo = macDo.url;

    // ── 2. RÈN +N ──
    // Mốc theo MU: +0..3 trơ · +4 · +7 · +10. Trong mỗi mốc vẫn phải leo liên tục.
    out.ren = [];
    let prev = macDo.data;
    for (const pl of [4, 7, 10, 11]){
      const s = shot(gvOf(1, 4, pl, 4, null), 1);
      out.ren.push({ plus: pl, doiSoVoiNacTruoc: diff(prev, s.data), vienSoVoiTran: outlineDiff(tran.data, s.data) });
      out.shots['P' + pl] = s.url;
      prev = s.data;
    }
    // hào quang phải ĐỘNG, không phải đèn dán
    const _t0 = (() => { const c=document.createElement('canvas'); c.width=NV_OW; c.height=NV_OH;
      const q=c.getContext('2d'); const gv=gvOf(1,4,11,4,null); const im=nvBo('thieulam',1,gv);
      nvHaoQuangSau(q,'thieulam',1,gv,0); nvVeKhung(q,im,'i',0); nvHaoQuangTruoc(q,'thieulam',1,gv,0,im,'i',0);
      return q.getImageData(0,0,NV_OW,NV_OH).data; })();
    out.haoQuangDong = diff(_t0, prev);

    // ── 3. màu bộ nhuốm được hào quang ──
    out.mauBo = diff(shot(gvOf(1, 4, 11, 4, null), 1).data,
                     shot(gvOf(1, 4, 11, 4, '#ff6a3a'), 1).data);

    // ── 4. an toàn: chưa có player (màn chọn lớp) ──
    out.gvNull_khiChuaCoPlayer = (() => { const _p = window.player; window.player = null;
      let ok = true; try { gearVisual(null); gearVisual(window.player); heroCardUrl('thieulam', 1); }
      catch (e){ ok = false; out.crashMsg = String(e); } window.player = _p; return ok; })();

    // ── 5. heroTier chỉ theo trang bị ──
    player.equip = {}; calcDerived();
    out.heroTier_tranTrui = heroTier(player);
    for (const k of HERO_ARMOR_SLOTS){ const it = genItem(112, 0); it.slot = k; it.tier = GIAI_MAX; player.equip[k] = it; }
    calcDerived();
    out.heroTier_theoDo = heroTier(player);
    out.giaiMax = GIAI_MAX;

    // ── 6. thẻ nhân vật phải đổi khi thay đồ ──
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
  if (res.giapDoi < 4000) fail(`mặc đủ bộ mà chỉ đổi ${res.giapDoi} px so với thân trần (cần >4000)`);
  if (res.giapDoiVien < 300) fail(`ĐƯỜNG VIỀN gần như không đổi: ${res.giapDoiVien} — bộ giáp phải đổi được BÓNG DÁNG, đó mới là thứ thấy từ xa`);
  for (const r of res.ren)
    if (r.doiSoVoiNacTruoc < 400) fail(`rèn lên +${r.plus} không đổi gì trên hình (${r.doiSoVoiNacTruoc} px)`);
  // Viền sáng dựng từ chính BÓNG DÁNG khung hình, nên trên +4 nó gần như không đổi bề dày —
  // khác hẳn bản vector cũ, nơi mỗi mốc rèn mọc thêm gai và viền phình ra thật. Đo được:
  // +4 · 1186 → +7 · 1187 → +10 · 1117 (tụt 6% vì dải quét và tàn lửa che bớt vài điểm mép).
  // Nên gác "viền phải ĐỦ DÀY ở mọi mốc", không gác "phải phình dần" — gác monotonic ở đây là
  // gác một tính chất mà đường art nướng không hứa.
  const vien = res.ren.map(r => r.vienSoVoiTran);
  res.ren.forEach((r, i) => {
    if (vien[i] < 600) fail(`viền sáng ở +${r.plus} quá mỏng (${vien[i]} px) — rèn cao mà nhìn từ xa không thấy`);
  });
  if (res.haoQuangDong < 500) fail(`hào quang +11 không nhúc nhích theo nhịp (${res.haoQuangDong} px) — thành đèn dán`);
  if (res.mauBo < 200) fail('màu bộ giáp không nhuốm được hào quang');
  if (!res.gvNull_khiChuaCoPlayer) fail('crash khi chưa có player (màn chọn lớp): ' + res.crashMsg);
  if (res.heroTier_tranTrui !== 1) fail(`cởi hết đồ mà heroTier vẫn ${res.heroTier_tranTrui}, phải về 1`);
  if (res.heroTier_theoDo !== res.giaiMax) fail(`mặc full giai đỉnh mà heroTier chỉ ${res.heroTier_theoDo}/${res.giaiMax}`);
  if (!res.cache_doiTheoDo) fail('cache chân dung không đổi khi thay đồ — panel sẽ hiện ảnh cũ');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
