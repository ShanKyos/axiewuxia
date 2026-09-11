// TẢNG ĐÁ — địa hình cỡ TRẬN ĐÁNH, dựng lại bằng tranh thật của kho Axie.
//
// Đây là `raiTruDa()` quay lại sau khi bị gỡ. Lần trước nó hỏng vì PHÓNG TO sprite đá trang trí
// lên ~3 lần; bài này gác đúng bốn chỗ khiến lần đó hỏng, để lần này đừng hỏng lại theo kiểu cũ:
//
//   1. CỠ THẬT. Vật cản của tảng phải có cạnh ngắn ≥ 0,40×NV_CAO — đúng ngưỡng `tools/do_map.js`
//      dùng để chấm "vật che". Dưới ngưỡng đó thì rải bao nhiêu viên cũng đóng góp bằng KHÔNG.
//   2. TRANH THU XUỐNG, KHÔNG KÉO GIÃN. Ảnh nguồn phải rộng hơn bề rộng vẽ ra.
//   3. BỐ CỤC CỐ ĐỊNH. Vào lại map phải ra ĐÚNG bố cục cũ — tảng là thứ người chơi học thuộc và
//      kéo quái quanh nó; rải lại mỗi lần vào thì không ai học được gì. (Cây/sỏi thì ngược lại,
//      chúng là trang trí và ĐƯỢC PHÉP ngẫu nhiên — bài này kiểm luôn sự khác biệt đó.)
//   4. KHÔNG BỊT ĐƯỜNG. Không tảng nào được đứng đè điểm nội dung hay chắn ngang trục nối hai
//      bãi quái — lỗi đã xảy ra thật trong chính đợt này (`test_obstacles`: đi 9s còn cách đích
//      176px), và phải hai lớp lọc mới hết.
const { chromium } = require('playwright');
let loi = 0;
const pass = m => console.log('PASS ' + m);
const fail = m => { console.log('FAIL ' + m); loi++; };
const MAPS_DO = ['daohoa', 'ngoai', 'chungnam', 'comoc', 'tuyettinh', 'mongco', 'nhanmon'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', { name:'Đo' }); });

  // ── 2. ảnh nguồn rộng hơn bề rộng vẽ ra ────────────────────────────────
  const r0 = await p.evaluate(async () => {
    await new Promise(r => setTimeout(r, 2500));
    return { rong: TANG_RONG, so: TANG_SO, nguong: 0.40 * NV_CAO,
             rx: TANG_RX, ry: TANG_RY,
             anh: TANG_IMGS.map(im => ({ ok: !!(im.complete && im.naturalWidth), w: im.naturalWidth })) };
  });
  console.log('0)', JSON.stringify(r0));
  r0.anh.some(a => !a.ok) ? fail('có tấm tảng không tải được')
                          : pass(`cả ${r0.anh.length} tấm tảng tải được`);
  r0.anh.some(a => a.w < r0.rong) 
    ? fail(`ảnh nguồn HẸP hơn bề rộng vẽ ra (${r0.rong}px) — đang KÉO GIÃN, đúng lỗi đã phải gỡ`)
    : pass(`ảnh nguồn ${r0.anh[0].w}px, vẽ ra ${r0.rong}px — thu xuống, không kéo giãn`);
  (Math.min(r0.rx, r0.ry) * 2 >= r0.nguong)
    ? pass(`cạnh ngắn vật cản ${Math.min(r0.rx, r0.ry)*2}px ≥ ngưỡng vật che ${r0.nguong.toFixed(1)}px`)
    : fail(`cạnh ngắn ${Math.min(r0.rx, r0.ry)*2}px < ngưỡng ${r0.nguong.toFixed(1)}px — rải bao nhiêu cũng vô ích`);

  // ── 1 + 3 + 4. đo trên từng map ────────────────────────────────────────
  const r = await p.evaluate(async (ids) => {
    const out = {};
    const chup = () => decor.filter(d => d.type === 'tang')
      .map(d => `${Math.round(d.x)},${Math.round(d.y)},${d.bien}`).sort().join('|');
    for (const id of ids){
      travelTo(id); await new Promise(r2 => setTimeout(r2, 260));
      const lan1 = chup();
      const soTang = decor.filter(d => d.type === 'tang').length;
      const cayRock1 = decor.filter(d => d.type === 'rock')
        .map(d => `${Math.round(d.x)},${Math.round(d.y)}`).sort().join('|');
      // nhỏ nhất trong đám vật cản của tảng
      const nho = decor.filter(d => d.type === 'tang')
        .reduce((m, d) => Math.min(m, Math.min(TANG_RX, TANG_RY) * 2 * d.s), 1e9);
      // vào map khác rồi quay lại — bố cục phải y hệt
      travelTo(id === 'daohoa' ? 'ngoai' : 'daohoa'); await new Promise(r2 => setTimeout(r2, 200));
      travelTo(id); await new Promise(r2 => setTimeout(r2, 260));
      const lan2 = chup();
      const cayRock2 = decor.filter(d => d.type === 'rock')
        .map(d => `${Math.round(d.x)},${Math.round(d.y)}`).sort().join('|');
      out[id] = { soTang, coDinh: lan1 === lan2 && lan1.length > 0,
                  rockDoi: cayRock1 !== cayRock2, nhoNhat: soTang ? Math.round(nho) : -1 };
    }
    return out;
  }, MAPS_DO);
  console.log('1)', JSON.stringify(r));

  const khong = MAPS_DO.filter(m => !r[m].soTang);
  khong.length ? fail('map không có tảng nào sống sót qua bộ lọc: ' + khong.join(', '))
               : pass('cả 7 map đều còn tảng sau khi lọc: ' + MAPS_DO.map(m => r[m].soTang).join('·'));
  const loan = MAPS_DO.filter(m => !r[m].coDinh);
  loan.length ? fail('bố cục tảng ĐỔI giữa hai lần vào map: ' + loan.join(', '))
              : pass('bố cục tảng cố định qua mỗi lần vào map — học thuộc được');
  // sỏi PHẢI đổi: nếu nó cũng cố định thì phép so ở trên không chứng minh được gì
  const soiIm = MAPS_DO.filter(m => !r[m].rockDoi);
  (soiIm.length <= 1)
    ? pass('sỏi trang trí vẫn rải ngẫu nhiên — phép so trên có ý nghĩa')
    : fail('sỏi cũng cố định ở ' + soiIm.length + ' map — không phân biệt được bố cục với trang trí');
  const be = MAPS_DO.filter(m => r[m].soTang && r[m].nhoNhat < r0.nguong);
  be.length ? fail('có tảng nhỏ hơn ngưỡng vật che: ' + be.join(', '))
            : pass('mọi tảng ở mọi map đều vượt ngưỡng vật che');

  console.log('errors:', errs);
  if (errs.length) fail('lỗi trang: ' + errs.join(' | '));
  console.log(loi ? `FAIL(${loi})` : 'ALL PASS');
  await b.close();
  process.exit(loi ? 1 : 0);
})();
