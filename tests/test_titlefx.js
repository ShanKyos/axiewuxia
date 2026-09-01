// Màn hình mở đầu phải CHẠY, và phải DỪNG khi rời màn.
//
// Trước đây màn tạo nhân vật chỉ là khối HTML trên nền gradient tĩnh. Nay có hoạt cảnh canvas:
// đoàn tàu vượt biển đêm tới vùng đất nơi Axie bị nhốt trong lồng.
//
// Hai thứ dễ hỏng nhất với một hoạt cảnh nền, và đây là chỗ gác chúng:
//   1. "Có canvas" không có nghĩa là "đang chạy" — phải so hai khung xem điểm ảnh có đổi không.
//   2. Vòng lặp rAF quên huỷ thì nó chạy mãi sau khi vào game, đốt pin suốt phiên chơi.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1100,height:760} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { const d=[...document.querySelectorAll('#intro-story button')].find(x=>/Bỏ qua/.test(x.textContent)); if(d) d.click(); });
  await p.waitForTimeout(1400);

  // 1) canvas có thật, đã được cấp kích thước theo màn hình
  const r1 = await p.evaluate(() => {
    const c = document.getElementById('title-fx');
    return { co: !!c, w: c && c.width, h: c && c.height,
             manHien: !document.getElementById('sect-select').classList.contains('hidden') };
  });
  console.log('1) canvas:', JSON.stringify(r1));
  if (!r1.co) fail('không có #title-fx');
  if (!r1.manHien) fail('màn tạo nhân vật không hiện');
  if (!(r1.w > 400 && r1.h > 300)) fail(`canvas chưa cấp kích thước: ${r1.w}x${r1.h}`);

  // 2) ĐANG CHẠY THẬT — lấy hai khung cách nhau, so điểm ảnh
  const r2 = await p.evaluate(async () => {
    const c = document.getElementById('title-fx');
    const g = c.getContext('2d');
    // Lấy mẫu CẢ khung, không phải góc trên-trái: chỗ đó gần như chỉ có trời, mà chuyển động
    // thì nằm ở biển và tàu phía dưới. Lấy mẫu sai chỗ thì cảnh đang chạy vẫn báo "đứng hình".
    const snap = () => g.getImageData(0, 0, c.width, c.height).data;
    const a = snap();
    await new Promise(r => setTimeout(r, 900));
    const b2 = snap();
    let khac = 0;
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) > 3) khac++;
    return { tong: a.length / 4, khac };
  });
  console.log('2) chuyển động:', JSON.stringify(r2), `→ ${Math.round(r2.khac*100/r2.tong)}% điểm ảnh đổi`);
  if (r2.khac < r2.tong * 0.01) fail(`cảnh gần như đứng hình (${r2.khac}/${r2.tong} điểm ảnh đổi)`);

  // 3) vào game rồi thì vòng lặp phải DỪNG — không đốt pin suốt phiên
  const r3 = await p.evaluate(async () => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    await new Promise(r => setTimeout(r, 800));
    const c = document.getElementById('title-fx');
    const g = c.getContext('2d');
    const snap = () => g.getImageData(0, 0, c.width, c.height).data;
    const a = snap();
    await new Promise(r => setTimeout(r, 700));
    const b2 = snap();
    let khac = 0;
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) > 3) khac++;
    return { manAn: document.getElementById('sect-select').classList.contains('hidden'), khac };
  });
  console.log('3) sau khi vào game:', JSON.stringify(r3));
  if (!r3.manAn) fail('vào game rồi mà màn tạo nhân vật vẫn hiện');
  if (r3.khac > 0) fail(`vòng lặp hoạt cảnh chưa dừng — ${r3.khac} điểm ảnh vẫn đổi sau khi vào game`);

  await p.waitForTimeout(300);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
