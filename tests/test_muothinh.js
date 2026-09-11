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
    // ⚠ BÀI NÀY TỪNG ĐỨNG ĐO GIỮA BÃI QUÁI SỐNG, và đó là cả nguyên nhân chập chờn: 3/5 lượt
    // đỏ trên CÙNG một commit, đỏ theo hai kiểu khác nhau ("vẽ 1 nhát — phải 2" và "chưa vào
    // được khối CHẠY (khối=h)"). Cả hai là một chuyện: quái đánh trúng thì `p.hurtT > 0`, mà
    // thứ tự chọn khối trong drawPlayer cho 'h' đè lên 'w'/'r' — khối 'h' KHÔNG nằm trong
    // NHOA_DUOC nên không hoà, và khối đo được là 'h' chứ không phải khối di chuyển.
    // Dọn sạch mọi thứ có thể đè lên khối di chuyển, ngay trước mỗi phép đo. Đo xong trong
    // CÙNG một lượt evaluate (đồng bộ) nên vòng lặp game không chen vào giữa được.
    window.__cachLy = () => {
      mobs.length = 0;
      dead = false;
      player.deadT = 0; player.hurtT = 0;      // 'd' và 'h' đè lên mọi khối khác
      player.atkAnim = 0; player.castT = 0;    // 'a' và 'c'
      player.nhayT = 0; player.noiT = 0;       // 'e' và 'n' (chỉ khi đứng yên)
      player.poisonT = 0; player.buffAtkT = 0; // 't' (chỉ khi đứng yên)
      player.walkPh = 0;                       // phần lẻ chỉ số = 0 ⇒ không có nhát pha khung
      player.speed = 90;                       // dưới CHAY_TOCDO ⇒ khối ĐI
    };
  });
  await page.waitForTimeout(500);

  // ── ① HOÀ HÌNH KHI ĐỔI TRẠNG THÁI ────────────────────────────────────────────────────
  // ⚠ KHÔNG NGỦ CHỜ ĐỂ RƠI VÀO GIỮA QUÃNG HOÀ. Bản cũ setTimeout(70) rồi mong mình còn nằm
  // trong cửa sổ 140ms; máy bận một nhịp là quãng hoà đã đóng, bài đỏ mà tính năng không sai.
  // Quãng hoà đọc đồng hồ qua `p._nhoaT0` (xem _veThanHoa), nên ĐẶT THẲNG mốc đó là tới đúng
  // điểm muốn đo, tức thì và lặp lại được. Vẫn là đúng phép đo cũ: đếm nhát blit và alpha.
  //
  // Ba mệnh đề tách bạch, và chỉ mệnh đề GIỮA dùng đồng hồ đặt tay:
  //   · `vuaDoi` — quãng hoà TỰ BẮT ĐẦU khi trạng thái đổi thật, không đụng vào _nhoaT0;
  //   · `giua`   — vẽ đúng alpha ở giữa quãng (đồng hồ đặt tay, t = 0,5);
  //   · `xong`   — quãng hoà KẾT THÚC khi quá hạn.
  // Gỡ hoà hình đi thì `vuaDoi` đỏ ngay — đã thử bằng cách xoá sạch NHOA_DUOC.
  const r1 = await page.evaluate(() => {
    const ghi = [];
    const cu = ctx.drawImage.bind(ctx);
    // Bỏ qua tấm VÀNH TÁCH NỀN (dấu neo nhân vật, mục 05): nó cũng đi qua drawImage nhưng
    // không phải nhát vẽ THÂN — mà thân mới là thứ bài này đếm. Không lọc thì mọi con số dưới
    // đây lệch đúng 1 và bài đỏ vì một lý do chẳng liên quan tới hoà hình.
    ctx.drawImage = function(...a){
      if (a[0] && a[0]._vanh) return cu(...a);
      ghi.push(+ctx.globalAlpha.toFixed(3)); return cu(...a);
    };
    const chup = () => { ghi.length = 0; drawPlayer(); return { a: ghi.slice(), khoi: window.__khoiVe }; };
    window.__cachLy();
    player.moving = false; player._phaSau = null;
    drawPlayer();                              // lắng về khối ĐỨNG trước khi đo
    player._nhoaT0 = 0;
    const dung = chup();                       // đứng yên: một nhát
    player.moving = true;                      // đổi trạng thái
    const vuaDoi = chup();                     // t ≈ 0
    player._nhoaT0 = performance.now() - NHOA_MS * 0.5;   // đúng giữa quãng
    const giua = chup();
    player._nhoaT0 = performance.now() - NHOA_MS * 1.5;   // quá hạn
    const xong = chup();
    ctx.drawImage = cu;
    return { dung, vuaDoi, giua, xong };
  });
  console.log('① hoà hình:', JSON.stringify(r1));
  if (r1.dung.khoi !== 'i' || r1.vuaDoi.khoi !== 'w')
    fail(`không dựng được cảnh đo: khối đứng=${r1.dung.khoi} (mong 'i'), khối động=${r1.vuaDoi.khoi} (mong 'w')`);
  else pass("dựng được cảnh: khối 'i' → 'w', không bị trạng thái khác đè");
  if (r1.dung.a.length !== 1) fail(`đứng yên mà vẽ ${r1.dung.a.length} nhát — phải đúng 1`);
  else pass('đứng yên: một nhát vẽ, không hoà gì');
  if (r1.vuaDoi.a.length !== 2) fail(`vừa đổi trạng thái mà vẽ ${r1.vuaDoi.a.length} nhát — phải 2 (khung cũ + khung mới)`);
  else if (r1.vuaDoi.a[0] !== 1) fail(`nhát ĐẦU phải đục hoàn toàn (alpha 1), đang là ${r1.vuaDoi.a[0]} — vẽ ngược thứ tự thì giữa chừng nhân vật hở nền tới 25%`);
  else pass('vừa đổi: khung cũ đục, khung mới chồng lên alpha 0');
  if (r1.giua.a.length === 2 && r1.giua.a[1] > 0.2 && r1.giua.a[1] < 0.95)
    pass(`giữa quãng hoà: khung mới đã lên alpha ${r1.giua.a[1]}`);
  else fail(`giữa quãng hoà không thấy alpha trung gian: ${JSON.stringify(r1.giua.a)}`);
  if (r1.xong.a.length === 1) pass('quá 140ms: hoà xong, về một nhát vẽ');
  else fail(`quá 140ms vẫn còn ${r1.xong.a.length} nhát — quãng hoà không kết thúc`);

  // ── ② KHỐI ĐÁNH KHÔNG ĐƯỢC HOÀ ───────────────────────────────────────────────────────
  // Đòn đánh đã vào-ra liên tục sẵn qua atkK 0→1. Hoà thêm là nhoè mất khung chạm.
  const r2 = await page.evaluate(() => ({ hoaDuoc: Object.keys(NHOA_DUOC).sort() }));
  console.log('② trạng thái được hoà:', JSON.stringify(r2.hoaDuoc));
  if (r2.hoaDuoc.join(',') !== 'i,r,w')
    fail('bảng NHOA_DUOC phải đúng ba trạng thái di chuyển i·w·r, đang là ' + r2.hoaDuoc.join(','));
  else pass('chỉ i·w·r được hoà — đánh, trúng đòn, chết thì không');

  // ── ③ NỘI SUY KHUNG CHO KHỐI CHẠY ────────────────────────────────────────────────────
  const r3 = await page.evaluate(() => {
    window.__cachLy();
    player.speed = 209;                  // trên CHAY_TOCDO → khối CHẠY
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

  // ── ④ ĐI BỘ CŨNG nội suy ─────────────────────────────────────────────────────────────
  // Khối ĐI nay chỉ chạy DƯỚI CHAY_TOCDO (126 px/s). Ở 90 px/s nó ra 27 khung/giây trên màn
  // 60 Hz — mỗi khung bảng đứng yên hơn hai lượt vẽ liền, nhìn ra nấc ngay. Nên phải pha.
  const r4 = await page.evaluate(() => {
    window.__cachLy();
    player.speed = 90;                   // dưới ngưỡng → khối ĐI
    player.moving = true; player._nhoaT0 = 0;
    const le = [];
    // Khối đi có 32 khung; chọn pha cho ra phần lẻ khác nhau (xem bẫy ở ③).
    for (const w of [0.005, 0.015, 0.035, 0.065]){
      player.walkPh = w * Math.PI * 2;
      drawPlayer();
      le.push(player._phaLe == null ? null : +player._phaLe.toFixed(2));
    }
    return { khoi: window.__khoiVe, le, chay: dangChay(player), coPhaSau: !!player._phaSau };
  });
  console.log('④ nội suy khối đi:', JSON.stringify(r4));
  if (r4.chay || r4.khoi !== 'w') fail(`chưa vào được khối ĐI (khối=${r4.khoi}) — không kiểm được nội suy`);
  else if (!r4.coPhaSau) fail('khối ĐI không pha khung — dưới ngưỡng chỉ 27 khung/giây, sẽ thấy nấc');
  else if (new Set(r4.le).size < 2) fail('phần lẻ chỉ số khung đứng im: ' + JSON.stringify(r4.le));
  else pass(`khối đi có nội suy, phần lẻ chạy ${JSON.stringify(r4.le)}`);

  console.log('lỗi trang:', JSON.stringify(loi.slice(0, 4)));
  if (loi.length) fail(loi.length + ' lỗi runtime');
  await browser.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
