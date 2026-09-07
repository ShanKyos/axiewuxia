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
    const th = n => ({ equip: { chan: { plus: n } } });
    return {
      coHam:   typeof dangChay === 'function',
      nguong:  typeof GIAY_CHAY_PLUS === 'number' ? GIAY_CHAY_PLUS : null,
      trong:   dangChay({}),                       // chưa có giày
      khongDo: dangChay({ equip: {} }),
      p0: dangChay(th(0)), p5: dangChay(th(5)), p6: dangChay(th(6)), p9: dangChay(th(9)),
      // giày không có trường plus (đồ cũ trong save) phải đọc như +0
      khongPlus: dangChay({ equip: { chan: {} } }),
      // ô khác lên +6 thì KHÔNG được đổi dáng
      aoP9: dangChay({ equip: { ao: { plus: 9 } } })
    };
  });
  console.log('1) luật:', JSON.stringify(r1));
  if (!r1.coHam) fail('không có hàm dangChay() — luật đi/chạy chưa gom về một chỗ');
  else pass('có dangChay() dùng chung');
  if (r1.nguong !== 6) fail(`ngưỡng giày là ${r1.nguong}, chủ dự án chốt +6`);
  else pass('ngưỡng đúng Giày +6 (GIAY_CHAY_PLUS)');
  if (r1.trong || r1.khongDo || r1.p0 || r1.p5 || r1.khongPlus)
    fail('dưới +6 (hoặc chưa có giày) mà đã CHẠY — khối 00_Walk lại nằm chết');
  else pass('chưa có giày · +0 · +5 → ĐI');
  if (!r1.p6 || !r1.p9) fail('Giày +6 trở lên vẫn chưa CHẠY');
  else pass('Giày +6 và +9 → CHẠY');
  if (r1.aoP9) fail('ô Áo lên +9 cũng đổi sang chạy — cửa phải là ĐÔI GIÀY');
  else pass('chỉ ô chân mở cửa chạy, ô khác không');

  // ── 2. Nhân vật MỚI TẠO phải ĐI, không phải chạy ───────────────────────────────────────
  const r2 = await p.evaluate(() => {
    startGame('thieulam', null);
    return { giay: !!(player.equip && player.equip.chan), chay: dangChay(player), speed: player.speed };
  });
  console.log('2) nhân vật mới:', JSON.stringify(r2));
  if (r2.chay) fail('vừa vào game đã chạy — chủ dự án yêu cầu vào game là ĐI (00_Walk)');
  else pass(`vào game là ĐI (tốc độ ${r2.speed} px/s không còn quyết định gì)`);

  // ── 3. NHỊP BƯỚC đổi theo ĐÚNG cái luật đó, không theo tốc độ ──────────────────────────
  // walkPh cộng dt × (v / sải) × 2π. Cùng một tốc độ, đổi giày là sải chân phải đổi theo tỉ
  // lệ SAI_CHAN.r / SAI_CHAN.w — nếu không, khối vẽ và nhịp chân đang đọc hai luật khác nhau.
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
    player.equip = player.equip || {};
    player.equip.chan = { slot: 'chan', plus: 0, name: 'Giày thử' };
    const di = await doNhip();
    player.equip.chan.plus = 6;
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
  else pass(`nhịp bước đổi đúng sải chân khi lên Giày +6 (${r3.ti.toFixed(3)} ≈ ${r3.canTi.toFixed(3)})`);

  // ── 4. Trong mã nguồn chỉ được có MỘT chỗ định nghĩa luật ──────────────────────────────
  const r4 = await p.evaluate(async () => {
    const src = await (await fetch('game.js')).text();
    return { dinhNghia: (src.match(/function dangChay\(/g) || []).length,
             goi:       (src.match(/dangChay\(/g) || []).length,
             conCu:     /CHAY_TU/.test(src) };
  });
  console.log('4) mã nguồn:', JSON.stringify(r4));
  if (r4.dinhNghia !== 1) fail(`có ${r4.dinhNghia} định nghĩa dangChay() — phải đúng một`);
  else pass('đúng một định nghĩa dangChay()');
  if (r4.goi < 3) fail(`chỉ ${r4.goi - 1} chỗ gọi dangChay() — khối vẽ và nhịp bước đều phải gọi`);
  else pass(`${r4.goi - 1} chỗ gọi dangChay() (khối vẽ + nhịp bước)`);
  if (r4.conCu) fail('CHAY_TU vẫn còn trong mã — ngưỡng tốc độ cũ chưa gỡ hết');
  else pass('ngưỡng tốc độ cũ CHAY_TU đã gỡ sạch');

  // ── 5. Đường BAY không đi qua cửa giày ────────────────────────────────────────────────
  // Chủ dự án nói rõ lỗi mất hình chỉ gặp lúc ĐI/CHẠY chứ không gặp lúc bay. Nhánh `_bay`
  // phải đứng TRƯỚC nhánh đi bộ trong chuỗi chọn khối, nếu không lên Giày +6 là đang bay
  // cũng đổi sang khối chạy — sai hẳn dáng.
  const r5 = await p.evaluate(async () => {
    const src = await (await fetch('game.js')).text();
    const iBay = src.indexOf("_bay ? 'w'");
    const iDi  = src.indexOf('_diBo ? (dangChay');
    return { iBay, iDi };
  });
  console.log('5) thứ tự nhánh:', JSON.stringify(r5));
  if (r5.iBay < 0 || r5.iDi < 0) fail('không tìm thấy nhánh _bay hoặc nhánh đi bộ trong chuỗi chọn khối');
  else if (r5.iBay > r5.iDi) fail('nhánh đi bộ đứng trước nhánh bay — bay mà mang Giày +6 sẽ đổi nhầm khối');
  else pass('bay vẫn là khối bay, giày không đụng tới');

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
