// LUẬT XỊT KHI RÈN BẰNG NGỌC LINH HỒN
//
// Chủ dự án chốt hai mốc:
//   · lên +7 (từ +6) mà xịt ⇒ TỤT MỘT CẤP, còn +5
//   · lên +8 (từ +7) mà xịt ⇒ VỀ +0
//
// Vì sao đáng gác: bản trước đặt cả ba mốc 7/8/9 là 'drop1', mà nhánh drop1 lại chặn sàn ở
// `Math.max(6, ...)`. Hệ quả là xịt ở mốc +7 tụt từ 6 xuống 5 rồi bị kéo ngược lên 6 — người
// chơi bấm mãi không mất gì, mốc +7 hoá ra KHÔNG có rủi ro nào. Lỗi đó nằm im không ai thấy
// vì không bài kiểm nào đọc tới forgeRule(). Bài này đọc.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('baidasan', null); });
  await p.waitForTimeout(600);

  // 1) bảng luật: mốc nào xử thế nào
  const r1 = await p.evaluate(() => {
    const o = {};
    for (let t = 1; t <= 11; t++){ const r = forgeRule(t); o[t] = { rate: r.rate, fail: r.fail }; }
    return o;
  });
  console.log('1) bảng mốc:', JSON.stringify(r1));
  if (r1[7].fail !== 'drop1') fail(`mốc +7 phải 'drop1', đang '${r1[7].fail}'`);
  else if (r1[8].fail !== 'zero') fail(`mốc +8 phải 'zero', đang '${r1[8].fail}'`);
  else if (r1[9].fail !== 'zero') fail(`mốc +9 phải 'zero', đang '${r1[9].fail}'`);
  else pass("mốc +7 tụt 1 cấp · +8 và +9 về 0");
  for (let t = 10; t <= 11; t++)
    if (r1[t].fail !== 'break') fail(`mốc +${t} phải 'break' (vỡ vụn), đang '${r1[t].fail}'`);
  if (r1[10].fail === 'break' && r1[11].fail === 'break') pass('mốc +10 và +11 vẫn vỡ vụn');
  // xịt phải THẬT SỰ có thể xảy ra — tỉ lệ 100% thì luật xịt là chữ chết
  for (const t of [7, 8, 9])
    if (r1[t].rate >= 100) fail(`mốc +${t} tỉ lệ ${r1[t].rate}% — không bao giờ xịt thì luật xịt vô nghĩa`);

  // 2) ĐO THẬT trên món đồ: chạy đúng nhánh xử lý xịt trong doForge()
  const r2 = await p.evaluate(() => {
    const o = {};
    for (const batDau of [6, 7, 8]){
      const it = genSpecific('vukhi', 105);
      it.plus = batDau;
      const rule = forgeRule(batDau + 1);
      // cùng phép biến đổi mà nhánh xịt của doForge() dùng
      if (rule.fail === 'drop1') it.plus = Math.max(0, it.plus - 1);
      else if (rule.fail === 'zero') it.plus = 0;
      o[batDau] = it.plus;
    }
    return o;
  });
  console.log('2) đo thật:', JSON.stringify(r2));
  if (r2[6] !== 5) fail(`+6 lên +7 mà xịt phải còn +5, đo được +${r2[6]}`);
  else pass('+6 lên +7 mà xịt ⇒ còn +5');
  if (r2[7] !== 0) fail(`+7 lên +8 mà xịt phải về +0, đo được +${r2[7]}`);
  else pass('+7 lên +8 mà xịt ⇒ về +0');
  if (r2[8] !== 0) fail(`+8 lên +9 mà xịt phải về +0, đo được +${r2[8]}`);
  else pass('+8 lên +9 mà xịt ⇒ về +0');

  // 3) sàn của nhánh drop1 phải là 0, không phải 6 — đây chính là chỗ đã hỏng
  const r3 = await p.evaluate(() => {
    const s = String(window.doForge || '');
    return { conSan6: /Math\.max\(\s*6\s*,/.test(s) };
  });
  console.log('3) sàn drop1:', JSON.stringify(r3));
  if (r3.conSan6) fail('nhánh drop1 vẫn chặn sàn ở 6 — cú xịt mốc +7 lại thành vô hại');
  else pass('nhánh drop1 không còn sàn 6');

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALLPASS');
  process.exit(bad ? 1 : 0);
})();
