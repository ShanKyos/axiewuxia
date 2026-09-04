// BẢNG KHAI BỘ GIÁP — 35 bộ (5 lớp × 7 giai) và đường art của chúng.
//
// Bài này TRƯỚC ĐÂY đo hình vector: 11 kiểu vai, 8 kiểu mào, hoa văn ngực, và chứng minh 5 lớp
// nhìn khác hẳn nhau khi mặc đồ. Toàn bộ lớp đó đã gỡ — giáp nay là art Spine nướng sẵn, nên
// "5 lớp khác nhau" là tính chất của GÓI ART, không phải của mã, và không có hàm nào để đo.
//
// Thứ CÒN đo được, và là thứ dễ hỏng nhất khi thả gói mới vào:
//   1. bảng HERO_SETS đủ 5 lớp × 7 giai, giai đánh số 1..7 liền mạch, tên không trùng
//   2. mỗi bộ có `tint` đủ 4 sắc — đó là màu tô hào quang rèn, thiếu là hào quang về màu bậc
//   3. mọi khoá trong NV_GIAP trỏ tới một bộ CÓ THẬT (gõ nhầm 'thieulam|8' thì im lặng vô hiệu)
//   4. giai CÓ art trả về đúng tên bộ art; giai CHƯA có art lui về thân trần, không nổ
//   5. bộ có art phải nhìn KHÁC thân trần — nếu không thì mặc đồ vào chẳng thấy gì
// Kèm một dòng ĐỘ PHỦ in ra mỗi lần chạy, để nhìn là biết còn thiếu bao nhiêu gói.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', { name:'Đo' }); });
  // Bảng khung là tệp ảnh — không chờ tải xong thì mục 5 đo nhầm thân trần với thân trần.
  await p.waitForFunction(() => !!nvTai('dkgs1', 'webp') && !!nvTai('dwsm1', 'webp'),
                          { timeout: 20000 }).catch(()=>{});

  const r = await p.evaluate(() => {
    const CL = ['thieulam','baidasan','toanchan','minhgiao','bug'];
    const o = { soGiai: GIAI_MAX };

    // 1) hình dạng bảng
    o.soBo = CL.map(k => (HERO_SETS[k] || []).length);
    o.giaiLienMach = CL.every(k => HERO_SETS[k].every((s, i) => s.min === i + 1));
    o.tenTrung = [];
    for (const k of CL){
      const seen = new Set();
      for (const s of HERO_SETS[k]){ if (seen.has(s.name)) o.tenTrung.push(`${k}/${s.name}`); seen.add(s.name); }
    }
    // 2) tint đủ sắc — glow được phép null, ba sắc kia thì không
    o.thieuTint = [];
    for (const k of CL) for (const s of HERO_SETS[k]){
      const t = s.tint || {};
      if (!t.lo || !t.hi || !t.trim) o.thieuTint.push(`${k}/${s.name}`);
    }
    // 3) khoá NV_GIAP phải trỏ tới bộ có thật
    o.khoaHong = [];
    for (const k in NV_GIAP){
      const [sect, g] = k.split('|');
      const line = HERO_SETS[sect];
      if (!line || !line.some(s => s.min === +g)) o.khoaHong.push(k);
    }
    o.coArt = Object.keys(NV_GIAP).sort();
    o.doPhu = `${o.coArt.length}/${CL.length * GIAI_MAX}`;

    // 4) tra art theo giai: có thì ra tên bộ, chưa có thì null (⇒ thân trần)
    const gvOf = t => ({ n:4, rarity:4, t, plus:0, rcol:RARITIES[4].color, wTier:t, wPlus:0, setColor:null, canh:null });
    o.traArt = {};
    for (const k of CL){
      o.traArt[k] = [];
      for (let t = 1; t <= GIAI_MAX; t++) o.traArt[k].push(nvBoGiap(k, gvOf(t)) || null);
    }
    // khớp một-một với NV_GIAP, không thừa không thiếu
    o.traSai = [];
    for (const k of CL) for (let t = 1; t <= GIAI_MAX; t++){
      const mong = NV_GIAP[k + '|' + t] || null;
      if (o.traArt[k][t-1] !== mong) o.traSai.push(`${k}|${t}: ra ${o.traArt[k][t-1]}, mong ${mong}`);
    }
    // cởi trần phải về null dù heroTier kẹp sàn ở 1
    o.tranTruiVeNull = CL.every(k => nvBoGiap(k, { n:0, t:0 }) === null);

    // 5) bộ CÓ art phải khác thân trần
    const pix = (im, kind, idx) => {
      const c = document.createElement('canvas'); c.width = NV_OW; c.height = NV_OH;
      const q = c.getContext('2d');
      nvVeKhung(q, im, kind, idx);
      return q.getImageData(0, 0, NV_OW, NV_OH).data;
    };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) n++; return n; };
    o.khacThanTran = {};
    for (const key of o.coArt){
      const [sect, g] = key.split('|');
      const imGiap = nvTai(NV_GIAP[key], 'webp');
      const imTran = nvTai(NV_BO[sect + '|1'], 'webp');
      o.khacThanTran[key] = (imGiap && imTran && imGiap.complete && imTran.complete)
        ? diff(pix(imGiap, 'i', 0), pix(imTran, 'i', 0)) : -1;
    }

    // 6) không nổ khi chưa mặc gì / ở giai chưa có art
    o.anToan = (() => { try {
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      for (const k of CL){
        drawHeroFigure(c.getContext('2d'), k, 1, 0, HERO_POSE0, null);
        heroCardUrl(k, GIAI_MAX, gvOf(GIAI_MAX));      // giai chưa có art
      }
      return true;
    } catch(e){ o.crash = String(e); return false; } })();
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  console.log(`\nĐỘ PHỦ ART BỘ GIÁP: ${r.doPhu} — còn thiếu ${5 * r.soGiai - r.coArt.length} gói Spine\n`);

  if (r.soBo.some(n => n !== r.soGiai)) fail(`mỗi lớp phải đủ ${r.soGiai} bộ, có ${JSON.stringify(r.soBo)}`);
  if (!r.giaiLienMach) fail('giai của các bộ không liền mạch 1..7 — nvBoGiap tra theo min nên hụt một số là cả giai đó mất art');
  if (r.tenTrung.length) fail('tên bộ bị trùng trong cùng một lớp: ' + r.tenTrung.join(', '));
  if (r.thieuTint.length) fail('bộ thiếu sắc tint (hào quang rèn sẽ về màu bậc): ' + r.thieuTint.join(', '));
  if (r.khoaHong.length) fail('NV_GIAP có khoá không trỏ tới bộ nào: ' + r.khoaHong.join(', '));
  if (r.traSai.length) fail('nvBoGiap tra sai: ' + r.traSai.join(' · '));
  if (!r.tranTruiVeNull) fail('cởi trần mà vẫn ra art giáp — heroTier kẹp sàn ở 1, phải phân biệt bằng gv.n');
  for (const k in r.khacThanTran){
    const d = r.khacThanTran[k];
    if (d === -1) fail(`${k}: art khai trong NV_GIAP nhưng tệp không tải được`);
    else if (d < 2000) fail(`${k}: bộ giáp nhìn gần y hệt thân trần (${d} px) — mặc vào không thấy gì`);
  }
  if (!r.anToan) fail('nổ khi vẽ nhân vật chưa mặc gì hoặc ở giai chưa có art: ' + r.crash);
  if (errs.length) fail('lỗi trang: ' + errs[0]);

  console.log(bad === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
