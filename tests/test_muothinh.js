// MƯỢT HÌNH — hoà hình khi đổi trạng thái, và nội suy khung cho khối CHẠY.
//
// Hai lỗi khác nhau, cùng một triệu chứng "nhân vật cứng":
//
// ① ĐỔI TRẠNG THÁI CẮT PHỰT. Đứng ↔ đi ↔ chạy nhảy thẳng sang khung mới, không có quãng
//    chuyển. Sửa ở tầng BLIT (vẽ chồng hai khung có sẵn) chứ không ở tầng tư thế, vì tư thế
//    đã bị nướng thành bảng khung theo chỉ số — nội suy ở đó phải nướng lại cả bộ.
//
// ② KHỐI CHẠY QUÁ THÔ. Đo trên chính bảng khung: sải chân một vòng chia số khung ra quãng
//    bàn chân dịch mỗi khung — đi 126,6/32 = 3,96px, chạy 212,9/16 = 13,31px, gấp 3,4 lần.
//    Chú thích ở HS_FRAMES kể mốc 12 khung cho ĐI đã bị loại vì "thô hơn 7-10 lần"; khối CHẠY
//    còn thô hơn thế. Nướng lại 32 khung là đường đúng nhất nhưng cần gói Spine gốc (không có
//    trong kho), nên tạm pha hai khung liền nhau theo phần lẻ của chỉ số.
//
// ⚠ Bài này đếm SỐ NHÁT BLIT và ALPHA của từng nhát, không so ảnh — nên nó không phụ thuộc
//    phông chữ, máy vẽ hay bộ nhớ đệm sprite.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const loi = [];
  page.on('pageerror', e => loi.push(String(e)));
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(600);

  let bad = 0;
  const fail = m => { console.log('FAIL ' + m); bad++; };
  const pass = m => console.log('PASS ' + m);

  await page.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null); travelTo('chungnam');
  });
  await page.waitForTimeout(500);

  // ── ① HOÀ HÌNH KHI ĐỔI TRẠNG THÁI ────────────────────────────────────────────────────
  const r1 = await page.evaluate(async () => {
    const ghi = [];
    const cu = ctx.drawImage.bind(ctx);
    ctx.drawImage = function(...a){ ghi.push(+ctx.globalAlpha.toFixed(3)); return cu(...a); };
    const chup = () => { ghi.length = 0; drawPlayer(); return ghi.slice(); };
    player.moving = false; player._nhoaT0 = 0; player._phaSau = null;
    const dung = chup();                       // đứng yên: một nhát
    player.moving = true;                      // đổi trạng thái
    const vuaDoi = chup();
    await new Promise(r => setTimeout(r, 70));
    const giua = chup();
    await new Promise(r => setTimeout(r, 120));
    const xong = chup();
    ctx.drawImage = cu;
    return { dung, vuaDoi, giua, xong };
  });
  console.log('① hoà hình:', JSON.stringify(r1));
  if (r1.dung.length !== 1) fail(`đứng yên mà vẽ ${r1.dung.length} nhát — phải đúng 1`);
  else pass('đứng yên: một nhát vẽ, không hoà gì');
  if (r1.vuaDoi.length !== 2) fail(`vừa đổi trạng thái mà vẽ ${r1.vuaDoi.length} nhát — phải 2 (khung cũ + khung mới)`);
  else if (r1.vuaDoi[0] !== 1) fail(`nhát ĐẦU phải đục hoàn toàn (alpha 1), đang là ${r1.vuaDoi[0]} — vẽ ngược thứ tự thì giữa chừng nhân vật hở nền tới 25%`);
  else pass('vừa đổi: khung cũ đục, khung mới chồng lên alpha 0');
  if (r1.giua.length === 2 && r1.giua[1] > 0.2 && r1.giua[1] < 0.95)
    pass(`giữa quãng hoà: khung mới đã lên alpha ${r1.giua[1]}`);
  else fail(`giữa quãng hoà không thấy alpha trung gian: ${JSON.stringify(r1.giua)}`);
  if (r1.xong.length === 1) pass('quá 140ms: hoà xong, về một nhát vẽ');
  else fail(`quá 140ms vẫn còn ${r1.xong.length} nhát — quãng hoà không kết thúc`);

  // ── ② KHỐI ĐÁNH KHÔNG ĐƯỢC HOÀ ───────────────────────────────────────────────────────
  // Đòn đánh đã vào-ra liên tục sẵn qua atkK 0→1. Hoà thêm là nhoè mất khung chạm.
  const r2 = await page.evaluate(() => ({ hoaDuoc: Object.keys(NHOA_DUOC).sort() }));
  console.log('② trạng thái được hoà:', JSON.stringify(r2.hoaDuoc));
  if (r2.hoaDuoc.join(',') !== 'i,r,w')
    fail('bảng NHOA_DUOC phải đúng ba trạng thái di chuyển i·w·r, đang là ' + r2.hoaDuoc.join(','));
  else pass('chỉ i·w·r được hoà — đánh, trúng đòn, chết thì không');

  // ── ③ NỘI SUY KHUNG CHO KHỐI CHẠY ────────────────────────────────────────────────────
  const r3 = await page.evaluate(() => {
    player.equip = player.equip || {};
    player.equip.chan = { slot:'chan', plus: GIAY_CHAY_PLUS, tier:1, rarity:1, uid:'z', name:'giày' };
    player.moving = true; player._nhoaT0 = 0;
    const le = [];
    // ⚠ CHỌN GIÁ TRỊ CHO RA PHẦN LẺ KHÁC NHAU. Khối chạy có 16 khung, nên w × 16 mới là chỉ số;
    // bộ 0,1/0,35/0,6/0,85 nhân 16 ra phần lẻ ĐỀU BẰNG 0,6 — bài kiểm sẽ báo "đứng im" trong
    // khi nội suy đang chạy đúng. (Đã dính đúng bẫy đó một lần.)
    for (const w of [0.01, 0.03, 0.07, 0.13]){
      player.walkPh = w * Math.PI * 2;
      drawPlayer();
      le.push(player._phaLe == null ? null : +player._phaLe.toFixed(2));
    }
    return { khoi: window.__khoiVe, le, chay: dangChay(player) };
  });
  console.log('③ nội suy khối chạy:', JSON.stringify(r3));
  if (!r3.chay || r3.khoi !== 'r') fail(`chưa vào được khối CHẠY (khối=${r3.khoi}) — không kiểm được nội suy`);
  else if (new Set(r3.le).size < 2) fail('phần lẻ chỉ số khung đứng im: ' + JSON.stringify(r3.le));
  else pass(`khối chạy có nội suy, phần lẻ chạy ${JSON.stringify(r3.le)}`);

  // ── ④ ĐI BỘ KHÔNG nội suy — 3,96px/khung đã đủ mượt, pha thêm là tốn nhát vẽ ─────────
  const r4 = await page.evaluate(() => {
    delete player.equip.chan;
    player.moving = true; player._nhoaT0 = 0; player.walkPh = 1.0;
    drawPlayer();
    return { khoi: window.__khoiVe, coPhaSau: !!player._phaSau };
  });
  console.log('④ đi bộ:', JSON.stringify(r4));
  if (r4.khoi === 'w' && r4.coPhaSau) fail('khối ĐI cũng pha khung — thừa, 3,96px/khung đã ngang mức vẽ thẳng');
  else pass('khối đi không pha khung, không tốn nhát vẽ thừa');

  console.log('lỗi trang:', JSON.stringify(loi.slice(0, 4)));
  if (loi.length) fail(loi.length + ' lỗi runtime');
  await browser.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
