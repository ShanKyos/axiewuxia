// ĐO NHỊP RƠI ĐỒ VÀ NGỌC — chạy trên chính bảng trong game.js, không chép lại con số nào.
//
//     node tools/dokiemngoc.cjs [cổng]        (mặc định 8891; cần một http.server trỏ vào public/game)
//
// In ra: mỗi giờ cày ra bao nhiêu ngọc từng loại, bao nhiêu món trang bị, bao nhiêu phụ kiện,
// bao nhiêu món Hoàn Hảo — theo từng dải quái, dùng NHỊP CÀY đo được của dải đó.
const { chromium } = require('playwright');
const PORT = process.argv[2] || 8891;

// Nhịp cày ĐO ĐƯỢC bằng AUTO (trung vị con/phút × 60). Xem chú thích NHIP_CAY trong game.js.
// Dải 3 (cấp 61–80) là ƯỚC LƯỢNG, không phải số đo: phép đo ở Tuyệt Tình bị nhiễu (chạy chung
// trang với mốc trước nên AUTO còn khoá bãi cũ, ra 0 con suốt 10 phút). Đo riêng một trang thì
// ra 6 con/phút trong phút đầu — chưa đủ dài để lấy trung vị. Đo lại trước khi tin con số này.
const NHIP = { 0: 3600, 1: 2340, 2: 3660, 3: 2000, 4: 5100 };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});

  const r = await p.evaluate((NHIP) => {
    window.TEST_MODE = true; startGame('thieulam', { name: 'Đo' });
    const N = 400000;
    const out = [];
    for (const [dai, lv] of [[0,10],[1,30],[2,50],[3,70],[4,100]]){
      const def = { lv, drop:null };
      const dr = mobDropRate(def, 'mob'), dn = mobDropCount(def, 'mob');
      const mul = JEWEL_BAND_MUL[dai], jt = JEWEL_DROP.mob;
      let trangBi = 0, phuKien = 0;
      const ngoc = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
      for (let i = 0; i < N; i++){
        for (let k = 0; k < dn; k++) if (Math.random() < dr) trangBi++;
        if (Math.random() < DROP_PHUKIEN) phuKien++;
        for (const k in jt) if (Math.random() < jt[k] * mul) ngoc[k]++;
      }
      // Hoàn Hảo: đo trên chính genItem, 60k mẫu
      const M = 60000; let hh = 0; const oPK = {};
      for (let i = 0; i < M; i++){
        const it = genItem(lv, 0, 'mob', { slots: DROP_O_TRANGBI });
        if (it.perfect) hh++;
        oPK[it.slot] = (oPK[it.slot] || 0) + 1;
      }
      const K = NHIP[dai];
      const gio = x => +(x / N * K).toFixed(2);
      out.push({ dai, lv, conMoiGio: K,
        trangBiMoiGio: gio(trangBi), phuKienMoiGio: gio(phuKien),
        hoanHaoMoiGio: +(hh / M * (trangBi / N * K)).toFixed(2),
        ngocMoiGio: Object.fromEntries(Object.entries(ngoc).map(([k, v]) => [k, gio(v)])),
        oTrongTrangBi: Object.keys(oPK).sort() });
    }
    return { dich: NGOC_MOI_GIO, nhipThamChieu: NHIP_CAY, tiLePhuKien: DROP_PHUKIEN,
             tiLeHoanHao: DROP_PERFECT, dai: out };
  }, NHIP);

  console.log('ĐÍCH THIẾT KẾ mỗi giờ:', JSON.stringify(r.dich),
              '· nhịp tham chiếu', r.nhipThamChieu, 'con/giờ');
  console.log('phụ kiện', (r.tiLePhuKien*100).toFixed(2) + '%/con · Hoàn Hảo',
              (r.tiLeHoanHao*100).toFixed(2) + '% trên món đã rơi\n');
  const pad = (x, n) => String(x).padStart(n);
  console.log('dải  cấp   con/giờ  trang bị  phụ kiện  Hoàn Hảo │ Chúc Phúc  Linh Hồn  Sinh Mệnh  Hỗn Độn');
  for (const d of r.dai){
    const j = d.ngocMoiGio;
    console.log(`${pad(d.dai,3)}  ${pad(d.lv,3)}  ${pad(d.conMoiGio,8)}  ${pad(d.trangBiMoiGio,8)}  ${pad(d.phuKienMoiGio,8)}  ${pad(d.hoanHaoMoiGio,8)} │ ${pad(j.chucPhuc,9)}  ${pad(j.linhHon,8)}  ${pad(j.sinhMenh,9)}  ${pad(j.honDon,7)}`);
  }
  console.log('\nô trong nhóm trang bị:', r.dai[0].oTrongTrangBi.join(' '));
  await b.close();
})();
