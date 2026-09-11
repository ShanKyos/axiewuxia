// BẢNG KHUNG CHIMERA — art 16 con nay là dải khung hình nướng từ rig Spine của Axie.
//
// ⚠ PHẠM VI ĐÃ HẸP LẠI. Trước đây bảng này nuôi CẢ màn quay Khế Ước; Khế Ước nay quay ra Cổ
// Vật (bộ giáp) nên bảng quay `<id>_q.webp` và cả bộ đệm ba khe của nó đã gỡ khỏi mã. Cái còn
// lại — và là cái người chơi nhìn suốt phiên — là AVATAR: bảng nhỏ (đứng) và bảng chạy.
// Art của màn quay nay có bài riêng: tests/test_covat.js.
//
//   1. Đủ bộ. 16 con phải tải được bảng nhỏ, và CHI_ANH phải có hình học từng con.
//   2. Lưới đúng cỡ. Ảnh phải rộng đúng cột × ô và cao đúng hàng × ô. Lệch một pixel là mọi
//      khung đều xén mất mép, mà xén đều thì nhìn không ra.
//   3. Có CỬ ĐỘNG thật. Hai khung khác nhau phải cho hai ảnh khác nhau — nếu đường nướng lấy
//      nhầm một tư thế 16 lần thì bài vẫn xanh ở mục 1-2 mà con vật đứng như tượng.
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

  await p.evaluate(() => { CHIMERA.forEach(c => chiImg(c.id)); });
  const xong = await p.waitForFunction(
    () => CHIMERA.every(c => chiSan(CHI_IMGS[c.id])),
    { timeout: 120000 }).then(() => true).catch(() => false);
  if (!xong) fail('không tải đủ 16 bảng khung trong 120 giây');

  const r = await p.evaluate(() => {
    const A = CHI_ANH, o = { thieu: [], leCo: [], dung: [] };
    for (const c of CHIMERA){
      const g = A.o[c.id];
      if (!g){ o.thieu.push(c.id); continue; }
      const nho = CHI_IMGS[c.id];
      if (!chiSan(nho)){ o.thieu.push(c.id); continue; }
      // 2) lưới đúng cỡ
      const hangN = Math.ceil(A.nKhung / A.cotNho);
      if (nho.naturalWidth !== g.nhoRong * A.cotNho || nho.naturalHeight !== g.nhoCao * hangN)
        o.leCo.push(c.id);
    }
    // 3) có cử động — so hai khung thở cách xa nhau
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
      if (lech(n1, n2) < 200) o.dung.push(c.id);
    }
    o.soCon = CHIMERA.length;
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  r.thieu.length ? fail('thiếu bảng khung: ' + r.thieu.join(', ')) : pass(`đủ bảng nhỏ cho cả ${r.soCon} con`);
  r.leCo.length  ? fail('ảnh không khớp lưới CHI_ANH: ' + r.leCo.join(', ')) : pass('mọi ảnh khớp đúng cột × ô');
  r.dung.length  ? fail('đứng im, hai khung ra cùng một ảnh: ' + r.dung.join(', ')) : pass('cả 16 con có cử động thật');

  // 4) đường bảng quay phải BIẾN MẤT HẲN, không còn nằm lại nửa vời. Nếu ai đó gọi lại
  //    chiQuayImg/chiVeQuay thì bài này đỏ ngay, thay vì game lặng lẽ xin 16 tệp không ai xem.
  //    Tên khai bằng `function`/`const` ở tầng tệp KHÔNG nằm trên window (module scope), nên
  //    phải dò bằng cách chạm vào chính cái tên: còn sống thì chạy lọt, đã gỡ thì ReferenceError.
  const conSot = await p.evaluate(() => {
    const ten = ['chiQuayImg','chiVeQuay','chiQuayDon','chiVeBong','veLop','CHI_QUAY','LOP_DAI'];
    const sot = [];
    for (const k of ten){
      try { if (new Function(`return typeof ${k}`)() !== 'undefined') sot.push(k); } catch { /* đã gỡ */ }
    }
    return sot;
  });
  conSot.length ? fail('đường bảng quay còn sót: ' + conSot.join(', '))
                : pass('đường bảng quay đã gỡ sạch khỏi mã');

  console.log('errors:', errs);
  if (errs.length) fail('lỗi trang: ' + errs.join(' | '));
  console.log(loi ? `FAIL(${loi})` : 'ALL PASS');
  await b.close();
  process.exit(loi ? 1 : 0);
})();
