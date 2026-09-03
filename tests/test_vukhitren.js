// VŨ KHÍ PHẢI NẰM TRÊN GIÁP.
// upper() của mỗi lớp chạy TRƯỚC hGloves/hPauldrons/hHelmCrest, nên tấm vai và mảnh găng phủ
// đè lên cán vũ khí. Trên cây trượng của Dark Wizard nó rõ tới mức đọc thành "vũ khí nằm sau
// lưng nhân vật". Chủ dự án bắt được bằng mắt; bài này bắt bằng số.
//
// Cách đo — ba lượt vẽ, cùng một khung hình:
//   B = chỉ giáp (chặn hàm vẽ vũ khí lại, không cho phát)
//   W = chỉ vũ khí (tự tay phát hàm đó lên canvas trống — setTransform là tuyệt đối nên nó
//       rơi đúng chỗ cũ)
//   A = vẽ bình thường
// Vũ khí NHÌN THẤY = số điểm ảnh A khác B. Nếu nó nhỏ hơn hẳn diện tích của W thì có thứ gì
// đó đang vẽ đè lên vũ khí — đúng cái lỗi này.
const { chromium } = require('playwright');
const URL = 'http://localhost:8871/index.html';
const NGUONG = 0.97;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(900);

  const kq = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', { name:'Đo' });
    const pick = slot => { for (let i = 0; i < 6000; i++){ const it = genItem(60, 3); if (it.slot === slot) return it; } return null; };
    const cv = document.createElement('canvas');
    cv.width = HERO_W; cv.height = HERO_H;
    const g = cv.getContext('2d');
    const chup = () => g.getImageData(0, 0, cv.width, cv.height).data;
    const xoa = () => g.clearRect(0, 0, cv.width, cv.height);
    const ra = {};
    for (const k of ['thieulam','toanchan','baidasan','minhgiao','bug']){
      player.sect = k;
      player.equip.vukhi = pick('vukhi');
      for (const s of ['non','ao','tay','quan','chan']) player.equip[s] = pick(s);
      const gv = gearVisual(player);

      // ── B: chỉ giáp. Cái bẫy: getter luôn trả null nên hFlushWeapon() không phát gì,
      //    còn setter thì giữ lại hàm vẽ để lượt W dùng.
      let but = null;
      const psB = Object.assign({}, HERO_POSE0);
      Object.defineProperty(psB, '_wpen', { configurable:true, get: () => null, set: v => { if (v) but = v; } });
      xoa(); drawHeroFigure(g, k, 8, 0, psB, gv);
      const B = chup();

      // ── W: chỉ vũ khí
      xoa(); if (but) but();
      const W = chup();

      // ── A: vẽ bình thường
      xoa(); drawHeroFigure(g, k, 8, 0, Object.assign({}, HERO_POSE0), gv);
      const A = chup();

      let dtVuKhi = 0, nhinThay = 0;
      for (let i = 0; i < W.length; i += 4){
        if (W[i+3] < 24) continue;                 // ngoài thân vũ khí
        dtVuKhi++;
        const kh = Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2]) + Math.abs(A[i+3]-B[i+3]);
        if (kh > 12) nhinThay++;
      }
      ra[k] = { coHamVe: !!but, art: (gv && gv.wDef && gv.wDef.art) || null,
                dtVuKhi, nhinThay, tiLe: dtVuKhi ? +(nhinThay/dtVuKhi).toFixed(3) : 0 };
    }
    return ra;
  });

  console.log(JSON.stringify(kq, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  for (const k in kq){
    const r = kq[k];
    // Chốt chặn chống rỗng: không bắt được hàm vẽ, hoặc vũ khí không có diện tích nào, thì
    // phép đo bên dưới xanh vì KHÔNG ĐO GÌ CẢ.
    if (!r.coHamVe) fail(`${k}: không bắt được hàm vẽ vũ khí — phép đo rỗng`);
    if (r.dtVuKhi < 200) fail(`${k}: vũ khí chỉ ${r.dtVuKhi} điểm ảnh — quá nhỏ để đo`);
    if (r.tiLe < NGUONG)
      fail(`${k} (${r.art}): chỉ ${(r.tiLe*100).toFixed(1)}% thân vũ khí nhìn thấy được — giáp đang vẽ đè lên nó`);
  }
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
