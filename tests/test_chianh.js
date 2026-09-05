// BẢNG KHUNG CHIMERA — art 16 con nay là dải khung hình nướng từ rig Spine của Axie, không còn
// là ảnh tĩnh. Bài này giữ bốn giao kèo mà mắt thường không soi ra được:
//
//   1. Đủ bộ. 16 con × 2 bảng (nhỏ + quay) phải tải được, và CHI_ANH phải có hình học từng con.
//      Thiếu một tệp thì con đó lặng lẽ rơi về hình đệm — trong màn nhìn như "chưa làm xong".
//   2. Lưới đúng cỡ. Ảnh phải rộng đúng cột × ô và cao đúng hàng × ô. Lệch một pixel là mọi
//      khung đều xén mất mép, mà xén đều thì nhìn không ra.
//   3. Có CỬ ĐỘNG thật. Hai khung khác nhau phải cho hai ảnh khác nhau — nếu đường nướng lấy
//      nhầm một tư thế 16 lần thì bài vẫn xanh ở mục 1-2 mà con vật đứng như tượng.
//   4. Bóng đen phủ kín. Lúc chưa lộ mặt, mọi pixel đặc phải TỐI — hở màu là lộ luôn con gì.
const { chromium } = require('playwright');
let loi = 0;
const pass = m => console.log('PASS ' + m);
const fail = m => { console.log('FAIL ' + m); loi++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', { name:'Đo' }); });

  // 1) đủ bộ — nạp cả 32 tệp rồi chờ. CHI_QUAY_TOI_DA thả bớt bảng quay ngay lúc thêm, nên
  // phải tắt nắp trong lúc đo độ phủ; mục 5 bật lại và kiểm chính cái nắp đó.
  await p.evaluate(() => { window.__giuHet = true;
    CHIMERA.forEach(c => { chiImg(c.id); chiQuayImg(c.id); }); });
  const xong = await p.waitForFunction(
    () => CHIMERA.every(c => chiSan(CHI_IMGS[c.id]) && chiSan(CHI_QUAY[c.id])),
    { timeout: 120000 }).then(() => true).catch(() => false);
  if (!xong) fail('không tải đủ 32 bảng khung trong 120 giây');

  const r = await p.evaluate(() => {
    const A = CHI_ANH, o = { thieu: [], leCo: [], dung: [], toi: [] };
    for (const c of CHIMERA){
      const g = A.o[c.id];
      if (!g){ o.thieu.push(c.id); continue; }
      const nho = CHI_IMGS[c.id], quay = CHI_QUAY[c.id];
      if (!chiSan(nho) || !chiSan(quay)){ o.thieu.push(c.id); continue; }
      // 2) lưới đúng cỡ
      const hangN = Math.ceil(A.nKhung / A.cotNho), hangQ = Math.ceil(A.nQuay / A.cotQuay);
      if (nho.naturalWidth !== g.nhoRong * A.cotNho || nho.naturalHeight !== g.nhoCao * hangN
          || quay.naturalWidth !== g.oRong * A.cotQuay || quay.naturalHeight !== g.oCao * hangQ)
        o.leCo.push(c.id);
    }
    // 3) có cử động — so hai khung thở cách xa nhau, trên cả bảng nhỏ và bảng quay
    const cv = document.createElement('canvas'); cv.width = 420; cv.height = 380;
    const q = cv.getContext('2d');
    const chup = f => { q.clearRect(0,0,420,380); f(); return q.getImageData(0,0,420,380).data; };
    const lech = (a, b2) => { let n = 0;
      for (let i = 0; i < a.length; i += 4) if (a[i] !== b2[i] || a[i+3] !== b2[i+3]) n++;
      return n; };
    for (const c of CHIMERA){
      if (!A.o[c.id]) continue;
      const n1 = chup(() => chiVeNho(q, c.id, 0, 210, 190, 150));
      const n2 = chup(() => chiVeNho(q, c.id, Math.floor(A.nKhung/2), 210, 190, 150));
      const q1 = chup(() => chiVeQuay(q, c.id, 0, 210, 190, 150));
      const q2 = chup(() => chiVeQuay(q, c.id, A.nHien - 1, 210, 190, 150));
      if (lech(n1, n2) < 200 || lech(q1, q2) < 200) o.dung.push(c.id);
      // 4) bóng đen phủ kín
      const d = chup(() => chiVeBong(q, c.id, A.nHien, 210, 190, 150));
      let dac = 0, sang = 0;
      for (let i = 0; i < d.length; i += 4)
        if (d[i+3] > 60){ dac++; if (d[i] + d[i+1] + d[i+2] > 150) sang++; }
      if (dac < 500 || sang > dac * 0.02) o.toi.push(`${c.id}:${sang}/${dac}`);
    }
    o.soCon = CHIMERA.length;
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  r.thieu.length ? fail('thiếu bảng khung: ' + r.thieu.join(', ')) : pass(`đủ 2 bảng cho cả ${r.soCon} con`);
  r.leCo.length  ? fail('ảnh không khớp lưới CHI_ANH: ' + r.leCo.join(', ')) : pass('mọi ảnh khớp đúng cột × ô');
  r.dung.length  ? fail('đứng im, hai khung ra cùng một ảnh: ' + r.dung.join(', ')) : pass('cả 16 con có cử động thật');
  r.toi.length   ? fail('bóng đen bị hở màu: ' + r.toi.join(', ')) : pass('bóng đen phủ kín mọi pixel đặc');

  // 5) thả bảng quay sau một phút — 16 tệp cỡ nửa mê-ga không được nằm lại trong bộ nhớ
  const thao = await p.evaluate(() => {
    window.__giuHet = false;
    const truoc = Object.keys(CHI_QUAY).length;
    for (const k in CHI_QUAY_DUNG) CHI_QUAY_DUNG[k] = performance.now() - VFX_ATLAS_GIU - 1;
    chiQuayDon();
    return { truoc, sau: Object.keys(CHI_QUAY).length, nho: Object.keys(CHI_IMGS).length };
  });
  console.log('thả bảng quay:', JSON.stringify(thao));
  (thao.truoc === 16 && thao.sau === 0 && thao.nho === 16)
    ? pass('bảng quay thả hết sau một phút, bảng nhỏ giữ nguyên')
    : fail('dọn bảng quay sai: ' + JSON.stringify(thao));

  console.log('errors:', errs);
  if (errs.length) fail('lỗi trang: ' + errs.join(' | '));
  console.log(loi ? `FAIL(${loi})` : 'ALL PASS');
  await b.close();
  process.exit(loi ? 1 : 0);
})();
