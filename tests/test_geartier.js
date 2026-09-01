// Lên MỘT giai trang bị phải NHÌN THẤY được trên người, ở mọi lớp và mọi giai.
// Trước khi sửa: tint của bộ ghi đè trọn bảng màu bậc, mà hStage()/hEngrave() cũng chia theo
// đúng mốc 1/3/5/7/9 — nên trong mỗi dải không gì đổi. Đo được: lên giai 8 và giai 10 đổi ĐÚNG
// 0% pixel ở Dark Knight, Spellblade và Dark Lord. Giai 10 là thứ khó kiếm nhất game.
const { chromium } = require('playwright');
const CLS = ['thieulam','baidasan','toanchan','minhgiao','bug'];
const NGUONG = 5;   // % pixel tối thiểu phải đổi khi lên một giai
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 400, height: 400 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(500);

  const res = await p.evaluate(cls => {
    const ARM = HERO_ARMOR_SLOTS, N = HERO_W*HERO_H;
    const cv = document.createElement('canvas'); cv.width = HERO_W; cv.height = HERO_H;
    const g = cv.getContext('2d');
    const diff = (a, b2) => { let d = 0; for (let i = 0; i < N; i++){ const o = i*4;
      if (Math.abs(a[o]-b2[o]) + Math.abs(a[o+1]-b2[o+1]) + Math.abs(a[o+2]-b2[o+2]) + Math.abs(a[o+3]-b2[o+3]) > 24) d++; }
      return d; };
    const out = { theoLop:{}, tenBo:{} };
    // ĐO NHIỀU LƯỢT BỐC RỒI LẤY TRUNG VỊ, không đo một lượt.
    // genSpecific() mỗi lần trả về một MÓN KHÁC NHAU trong cùng giai, nên một lượt bốc có thể
    // vô tình rơi vào hai món trông giống nhau. Đo thật ba lượt liên tiếp cho toanchan giai 2:
    // 4,62% → 6,14% → 16,42%. Ngưỡng là 5%, nên cùng một bộ art lúc đạt lúc trượt tuỳ vận may —
    // bài kiểm báo hỏng mà không có gì hỏng, còn nếu art thật sự mờ nhạt thì cũng có lượt lọt.
    // Trung vị của 5 lượt trả lời đúng câu hỏi cần hỏi: LÊN MỘT GIAI THÌ NHÌN CÓ KHÁC KHÔNG.
    // 11 mẫu thay vì 5. ĐÂY mới là thứ làm bài kiểm hết đỏ, không phải bảng màu HERO_METAL —
    // đã kiểm chứng bằng cách nhét lại bảng màu CŨ vào trang rồi chạy ba lượt với LUOT=11:
    // vẫn xanh cả ba, toanchan 1→2 ra 14,2% · 16,4% · 16,5%. Lần đỏ trước đó là do trung vị
    // của 5 mẫu nhảy quanh ngưỡng 5%, không phải do art.
    // (toanchan giai 1–2 nằm trong bộ Da Rừng CÓ tint, nên nó không hề đọc HERO_METAL.)
    const LUOT = 11;
    const trungVi = (a) => { const b2 = [...a].sort((x, y) => x - y); return b2[b2.length >> 1]; };
    for (const c of cls){
      player.sect = c;
      const theoLuot = [], sets = [];
      for (let r = 0; r < LUOT; r++){
        const shots = [];
        for (let t = 1; t <= 10; t++){
          player.equip = {};
          for (const k of ARM){ const it = genSpecific(k, 0, t*10); it.tier = t; it.plus = 0; it.rarity = 0; player.equip[k] = it; }
          const w = genSpecific('vukhi', 0, t*10); w.tier = t; w.plus = 0; w.rarity = 0; player.equip.vukhi = w;
          calcDerived();
          g.clearRect(0, 0, HERO_W, HERO_H);
          drawHeroFigure(g, c, heroTier(player), 0, HERO_POSE0, gearVisual(player));
          shots.push(g.getImageData(0, 0, HERO_W, HERO_H).data);
          if (r === 0){ const S = heroSet(c, gearVisual(player).t); sets.push(S ? S.name : null); }
        }
        const nac = [];
        for (let i = 1; i < shots.length; i++) nac.push(diff(shots[i-1], shots[i])/N*100);
        theoLuot.push(nac);
      }
      out.theoLop[c] = theoLuot[0].map((_, i) => +trungVi(theoLuot.map(l => l[i])).toFixed(2));
      out.tenBo[c] = sets;
    }
    return out;
  }, CLS);

  console.log('% pixel đổi khi lên một giai:');
  console.log('lớp'.padEnd(11) + [2,3,4,5,6,7,8,9,10].map(t => ('→'+t).padStart(7)).join(''));
  for (const c in res.theoLop) console.log(c.padEnd(11) + res.theoLop[c].map(v => (v+'%').padStart(7)).join(''));

  for (const c in res.theoLop){
    const chet = res.theoLop[c].map((v, i) => [i+2, v]).filter(([, v]) => v < NGUONG);
    if (chet.length) fail(`${c}: giai ${chet.map(([t, v]) => t + ' (' + v + '%)').join(', ')} không nhìn thấy khác biệt`);
    else pass(`${c}: cả 9 nấc lên giai đều thấy được (thấp nhất ${Math.min(...res.theoLop[c])}%)`);
  }

  // Bộ giáp vẫn phải giữ nhận dạng: đúng 5 tên bộ, mỗi tên phủ 2 giai liền nhau.
  for (const c in res.tenBo){
    const names = res.tenBo[c], uniq = [...new Set(names)];
    const lienTuc = names.every((n, i) => i === 0 || n === names[i-1] || !names.slice(0, i).includes(n));
    if (uniq.length !== 5) fail(`${c}: có ${uniq.length} tên bộ giáp, mong đúng 5 — ${JSON.stringify(uniq)}`);
    else if (!lienTuc) fail(`${c}: tên bộ giáp nhảy qua nhảy lại — ${JSON.stringify(names)}`);
    else pass(`${c}: 5 bộ giáp, mỗi bộ phủ 2 giai liền nhau — ${uniq.join(' → ')}`);
  }

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có pageerror');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
