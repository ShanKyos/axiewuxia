// ĐI hay CHẠY — cửa là ĐÔI GIÀY, không phải tốc độ
//
// ⚠ Bài này ra đời từ một thứ NẰM CHẾT trong kho: khối `00_Walk` có đủ 32 khung đã nướng mà
// gần như không bao giờ hiện ra. Luật cũ đọc TỐC ĐỘ (`p.speed >= 1.271 × NV_CAO ≈ 168`), còn
// tốc độ nền của người chơi là 209 — tức mọi nhân vật CHẠY ngay từ cấp 1, suốt đời.
//
// Chủ dự án chốt luật mới: vào game là ĐI; **Giày (ô chân) lên +6** mới đổi sang CHẠY.
//
// ⚠ HAI CHỖ PHẢI CÙNG MỘT LUẬT. drawPlayer chọn KHỐI VẼ, còn update() tính NHỊP BƯỚC bằng
// sải chân của khối đó. Tách ra hai luật khác nhau thì bàn chân trượt đất ~40% quãng đường
// mỗi vòng — nhìn chỉ thấy "hình như đi hơi lạ", rất khó lần ra. Nên bài đo cả hai.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(400);

  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  // ── 1. Bảng chân lý của chính cái luật ─────────────────────────────────────────────────
  const r1 = await p.evaluate(() => {
    const v = n => ({ speed: n });
    return {
      coHam:   typeof dangChay === 'function',
      nguong:  typeof CHAY_TOCDO === 'number' ? CHAY_TOCDO : null,
      // sải chân khối ĐI, đo trên bảng khung rồi thu về cỡ trong game
      saiW:    SAI_CHAN.w,
      trong:   dangChay({}),                       // không có trường speed
      v0: dangChay(v(0)), v90: dangChay(v(90)), v125: dangChay(v(125)),
      v126: dangChay(v(126)), v209: dangChay(v(209)),
      // trang bị KHÔNG còn là cửa: giày +9 mà đứng yên vẫn không phải khối chạy
      giayP9: dangChay({ speed: 0, equip: { chan: { plus: 9 } } })
    };
  });
  console.log('1) luật:', JSON.stringify(r1));
  if (!r1.coHam) fail('không có hàm dangChay() — luật đi/chạy chưa gom về một chỗ');
  else pass('có dangChay() dùng chung');
  // Ngưỡng phải BÁM SẢI CHÂN, không phải một con số dò tay: người đi bộ tự nhiên tối đa
  // ~2,4 bước/giây, tức 2,4/2 × sải chân khối ĐI. Lệch quá 8% là khối ĐI lại bị ép chạy
  // ở nhịp nước rút — đúng cái lỗi bản này sinh ra để chữa.
  const canNguong = 1.2 * r1.saiW;
  if (r1.nguong === null) fail('không có hằng CHAY_TOCDO — ngưỡng chưa gom về một chỗ');
  else if (Math.abs(r1.nguong - canNguong) / canNguong > 0.08)
    fail(`CHAY_TOCDO = ${r1.nguong} px/s, mà sải chân ${r1.saiW.toFixed(1)}px đòi ` +
         `~${canNguong.toFixed(0)} px/s — khối ĐI sẽ phải quay chân quá 2,4 bước/giây`);
  else pass(`ngưỡng ${r1.nguong} px/s bám đúng sải chân ${r1.saiW.toFixed(1)}px (~2,4 bước/giây)`);
  if (r1.trong || r1.v0 || r1.v90 || r1.v125)
    fail('dưới ngưỡng mà đã CHẠY — khối 00_Walk lại nằm chết');
  else pass('không có tốc độ · 0 · 90 · 125 px/s → ĐI');
  if (!r1.v126 || !r1.v209) fail('từ ngưỡng trở lên vẫn chưa CHẠY');
  else pass('126 và 209 px/s → CHẠY');
  if (r1.giayP9) fail('Giày +9 vẫn mở cửa chạy — luật phải đọc TỐC ĐỘ, không đọc trang bị');
  else pass('trang bị không còn quyết định khối vẽ, chỉ tốc độ');

  // ── 2. Nhân vật MỚI TẠO phải CHẠY ─────────────────────────────────────────────────────
  // Tốc độ nền 209 px/s vượt xa cái sải chân 105px của khối ĐI. Ép khối ĐI gánh tốc độ đó
  // là 3,98 bước/giây (nhịp nước rút) và 63,6 khung/giây trên màn 60 Hz (giật không đều).
  const r2 = await p.evaluate(() => {
    startGame('thieulam', null);
    return { chay: dangChay(player), speed: player.speed,
             buocGiay: 2 * player.speed / SAI_CHAN.w };
  });
  console.log('2) nhân vật mới:', JSON.stringify(r2));
  if (!r2.chay)
    fail(`tốc độ nền ${r2.speed} px/s mà vẫn vẽ khối ĐI — ${r2.buocGiay.toFixed(2)} bước/giây, ` +
         'chân quay tít trên một dáng đi thong thả');
  else pass(`tốc độ nền ${r2.speed} px/s → khối CHẠY (2,36 bước/giây, 18,9 khung/giây)`);

  // ── 3. NHỊP BƯỚC đổi theo ĐÚNG cái luật đó ────────────────────────────────────────────
  // walkPh cộng dt × (v / sải) × 2π. Chuẩn hoá theo QUÃNG ĐƯỜNG thì thương số còn đúng
  // 2π/sải, nên vượt ngưỡng là tỉ lệ phải rơi về SAI_CHAN.w / SAI_CHAN.r — nếu không, khối
  // vẽ và nhịp chân đang đọc hai luật khác nhau và bàn chân sẽ trượt đất.
  const r3 = await p.evaluate(async () => {
    // ⚠ moveTarget là `let` ở tầng script, KHÔNG phải player.moveTarget. Gán nhầm chỗ thì
    // nhân vật đứng im, walkPh chỉ nhích theo nhịp thở 2,2 rad/s và phép đo vô nghĩa.
    const doNhip = async () => {
      player.x = 700; player.y = 700;
      moveTarget = { x: 1500, y: 700 };
      await new Promise(r => setTimeout(r, 120));      // cho nó bắt đầu bước
      const t0 = player.walkPh || 0, x0 = player.x;
      await new Promise(r => setTimeout(r, 450));
      return { d: (player.walkPh || 0) - t0, di: player.x - x0, dang: player.moving };
    };
    startGame('thieulam', null);
    player.level = 60; calcDerived();
    player.speed = 110;                    // dưới CHAY_TOCDO → khối ĐI
    const di = await doNhip();
    player.speed = 209;                    // trên ngưỡng → khối CHẠY
    const chay = await doNhip();
    // Chia cho QUÃNG ĐƯỜNG THẬT chứ không cho thời gian: hai lượt đo không đi đúng bằng
    // nhau (nhích khởi động, giật khung hình), mà walkPh = quãng đường / sải chân × 2π nên
    // chuẩn hoá theo px là ra đúng tỉ lệ sải chân, sai số về gần 0.
    const nhip = k => k.d / k.di;
    return { di, chay, ti: nhip(di) > 0 ? nhip(chay) / nhip(di) : 0, canTi: SAI_CHAN.w / SAI_CHAN.r,
             sai: { w: SAI_CHAN.w, r: SAI_CHAN.r } };
  });
  console.log('3) nhịp bước:', JSON.stringify(r3));
  if (!r3.di.dang || !r3.chay.dang || !(r3.di.di > 40) || !(r3.chay.di > 40))
    fail(`nhân vật không thật sự bước (đi ${r3.di.di|0}px · chạy ${r3.chay.di|0}px) — phép đo vô nghĩa`);
  else if (!(r3.di.d > 0) || !(r3.chay.d > 0)) fail('walkPh không nhích — không đo được nhịp bước');
  else if (Math.abs(r3.ti - r3.canTi) > 0.03)
    fail(`đổi giày mà nhịp bước lệch: đo ${r3.ti.toFixed(3)}, cần ${r3.canTi.toFixed(3)} ` +
         '— khối vẽ và nhịp chân đang đọc hai luật khác nhau, bàn chân sẽ trượt đất');
  else pass(`nhịp bước đổi đúng sải chân khi vượt ngưỡng tốc độ (${r3.ti.toFixed(3)} ≈ ${r3.canTi.toFixed(3)})`);

  // ── 4. Trong mã nguồn chỉ được có MỘT chỗ định nghĩa luật ──────────────────────────────
  const r4 = await p.evaluate(async () => {
    const src = await (await fetch('game.js')).text();
    return { dinhNghia: (src.match(/function dangChay\(/g) || []).length,
             goi:       (src.match(/dangChay\(/g) || []).length,
             conCu:     /GIAY_CHAY_PLUS/.test(src) };
  });
  console.log('4) mã nguồn:', JSON.stringify(r4));
  if (r4.dinhNghia !== 1) fail(`có ${r4.dinhNghia} định nghĩa dangChay() — phải đúng một`);
  else pass('đúng một định nghĩa dangChay()');
  if (r4.goi < 3) fail(`chỉ ${r4.goi - 1} chỗ gọi dangChay() — khối vẽ và nhịp bước đều phải gọi`);
  else pass(`${r4.goi - 1} chỗ gọi dangChay() (khối vẽ + nhịp bước)`);
  if (r4.conCu) fail('GIAY_CHAY_PLUS vẫn còn trong mã — cửa Giày +6 cũ chưa gỡ hết');
  else pass('cửa Giày +6 cũ đã gỡ sạch');

  // ── 5. Đường BAY không đi qua cửa tốc độ ──────────────────────────────────────────────
  // Chủ dự án nói rõ lỗi mất hình chỉ gặp lúc ĐI/CHẠY chứ không gặp lúc bay. Nhánh `_bay`
  // phải đứng TRƯỚC nhánh đi bộ trong chuỗi chọn khối, nếu không Cánh cộng tốc độ là đang
  // bay cũng đổi sang khối chạy — sai hẳn dáng.
  const r5 = await p.evaluate(async () => {
    const src = await (await fetch('game.js')).text();
    const iBay = src.indexOf("_bay ? 'w'");
    const iDi  = src.indexOf('_diBo ? (dangChay');
    return { iBay, iDi };
  });
  console.log('5) thứ tự nhánh:', JSON.stringify(r5));
  if (r5.iBay < 0 || r5.iDi < 0) fail('không tìm thấy nhánh _bay hoặc nhánh đi bộ trong chuỗi chọn khối');
  else if (r5.iBay > r5.iDi) fail('nhánh đi bộ đứng trước nhánh bay — bay nhanh sẽ đổi nhầm khối');
  else pass('bay vẫn là khối bay, ngưỡng tốc độ không đụng tới');

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
