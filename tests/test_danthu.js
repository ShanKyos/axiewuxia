// ĐÀN THÚ HOANG — sinh vật nền KHÔNG tham chiến.
//
// Bài kiểm này gác đúng một điều: đàn thú phải giữ nguyên là NỀN. Mọi hỏng hóc của một hệ như
// thế này đều đi về một trong hai phía — hoặc nó lặng lẽ biến thành nội dung (săn được, rơi đồ,
// AUTO dọn sạch trong một phút), hoặc nó biến thành phiền (chắn đường, nhắm nhầm mục tiêu).
//
//   1. Bãi cỏ ĐỨNG YÊN qua nhiều ngày và nhiều lần dựng lại — nó là mốc định hướng, không phải
//      sự kiện. (Vỉa Cốt là thứ DUY NHẤT được phép đổi chỗ theo ngày; test_ruong §2 gác chỗ tách
//      đó cho Rương Canh, đây gác cho đàn thú.)
//   2. Bãi cỏ cách MỌI bãi quái ≥ THU_CACH_BAI: chỗ nào đánh nhau thì chỗ đó không có thú.
//   3. Thú KHÔNG nằm trong `mobs` — không máu, không bị nhắm, không rơi gì, AUTO không thấy.
//   4. Người chơi tới gần thì cả đàn bỏ chạy, và chạy RA XA thật (không chỉ đổi cờ trạng thái).
//   5. Hoảng LÂY THÀNH SÓNG: con ở xa người chơi, chỉ gần một con đang chạy, cũng phải chạy.
//   6. Đổi map thì đàn cũ biến mất — cùng họ lỗi với `groundLoot` treo lại từ map trước.
//   7. Không con nào đứng trong vật cản.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // ---- 0. map nào khai `thu` ----
  const r0 = await p.evaluate(() => Object.keys(MAPS).filter(k => MAPS[k].thu));
  console.log('0) map có đàn thú:', JSON.stringify(r0));
  if (!r0.length) { fail('không map nào khai `thu` — cả hệ chết mà không ai biết'); }
  const MID = r0[0];
  if (!MID) { console.log(`\n${bad} LỖI`); await b.close(); process.exit(1); }

  // ---- 1 + 2. bãi cỏ: đứng yên, và tránh bãi quái ----
  const r1 = await p.evaluate((mid) => {
    const a = thuBaiCo(mid);
    // xoá nhớ rồi bốc lại — và giả một ngày khác, đúng cách test_ruong §2 kiểm Rương Canh
    _thuBaiCache = {};
    const cu = Date.prototype.toDateString;
    Date.prototype.toDateString = function(){ return 'Wed Jan 01 2031'; };
    const b2 = thuBaiCo(mid);
    Date.prototype.toDateString = cu;
    _thuBaiCache = {};
    const b3 = thuBaiCo(mid);
    const bai = thuBaiCo(mid);
    const gan = packsOf(mid).map(k => Math.round(dist(bai.x, bai.y, k.x, k.y))).sort((x,y)=>x-y);
    return { a, b2, b3, ganNhat: gan[0], nguong: THU_CACH_BAI,
      trongCan: inObstacle(mid, bai.x, bai.y, 60) };
  }, MID);
  console.log('1) bãi cỏ:', JSON.stringify(r1));
  if (!(r1.a && r1.b2 && r1.a.x === r1.b2.x && r1.a.y === r1.b2.y))
    fail('① bãi cỏ ĐỔI CHỖ theo ngày — nó là mốc định hướng, chỉ Vỉa Cốt được đổi theo ngày');
  if (!(r1.a && r1.b3 && r1.a.x === r1.b3.x && r1.a.y === r1.b3.y))
    fail('① bãi cỏ đổi chỗ giữa hai lần bốc trong CÙNG một ngày — hạt không bốc từ tên map');
  // Nới 60px: chỗ đặt nới dần khi map chật (`noi = 90` sau 450 lượt thử), nên đòi đúng ngưỡng là
  // đòi một thứ chính mã đã nói rõ là có thể nhượng bộ.
  if (!(r1.ganNhat >= r1.nguong - 90))
    fail(`② bãi cỏ chỉ cách bãi quái gần nhất ${r1.ganNhat}px, cần ≈${r1.nguong}px — thú mọc ngay chỗ đánh nhau`);
  if (r1.trongCan) fail('② bãi cỏ nằm trong vật cản');

  // ---- 3 + 7. đàn dựng ra: không phải quái, không kẹt tường ----
  const r3 = await p.evaluate((mid) => {
    applyTestBoost(); travelTo('ardhaven'); travelTo(mid);
    const soMob = mobs.length;
    return { n: thuDan.length,
      trongMobs: thuDan.filter(t => mobs.includes(t)).length,
      coMau: thuDan.filter(t => t.hp != null || t.maxHp != null || t.def).length,
      kẹt: thuDan.filter(t => inObstacle(mid, t.x, t.y, 14)).length,
      ngoaiKho: thuDan.filter(t => t.x < 0 || t.y < 0 || t.x > MAP.w || t.y > MAP.h).length,
      soMob, loai: [...new Set(thuDan.map(t => t.loai))] };
  }, MID);
  console.log('3) đàn:', JSON.stringify(r3));
  if (!(r3.n >= 6)) fail(`③ chỉ dựng được ${r3.n} con — một "đàn" dưới 6 con đọc ra là mấy con lạc`);
  if (r3.trongMobs) fail(`③ ${r3.trongMobs} con thú nằm trong mảng \`mobs\` — thành quái, AUTO sẽ dọn sạch`);
  if (r3.coMau) fail(`③ ${r3.coMau} con thú mang máu/def — nó là NỀN, không phải nội dung`);
  if (r3.kẹt) fail(`⑦ ${r3.kẹt} con đứng trong vật cản`);
  if (r3.ngoaiKho) fail(`⑦ ${r3.ngoaiKho} con đứng ngoài khổ map`);
  if (r3.loai.length < 2) fail(`③ đàn chỉ có ${r3.loai.length} loài — bóng dáng phải khác nhau mới đọc ra là một đàn thú, không phải một dãy bản sao`);

  // ---- 4. tới gần thì chạy, và chạy RA XA thật ----
  const r4 = await p.evaluate((mid) => {
    const bai = thuBaiCo(mid);
    player.x = bai.x; player.y = bai.y; player.auto = false; moveTarget = null;
    const truoc = thuDan.map(t => dist(t.x, t.y, player.x, player.y));
    thuCapNhat(0.016);
    const chay = thuDan.filter(t => t.st === 'chay').length;
    for (let i = 0; i < 45; i++) thuCapNhat(0.016);
    const sau = thuDan.map(t => dist(t.x, t.y, player.x, player.y));
    let xaHon = 0;
    for (let i = 0; i < truoc.length; i++) if (sau[i] > truoc[i] + 8) xaHon++;
    return { n: thuDan.length, chayNgay: chay, xaHon,
      gan: truoc.filter(d => d < THU_SO).length, nguong: THU_SO };
  }, MID);
  console.log('4) bỏ chạy:', JSON.stringify(r4));
  if (!(r4.chayNgay >= r4.gan))
    fail(`④ ${r4.gan} con trong tầm ${r4.nguong}px mà chỉ ${r4.chayNgay} con bỏ chạy`);
  if (!(r4.xaHon >= Math.max(1, Math.round(r4.chayNgay * 0.7))))
    fail(`④ chỉ ${r4.xaHon}/${r4.chayNgay} con thật sự chạy RA XA — đổi cờ trạng thái mà không đổi toạ độ`);

  // ---- 5. hoảng LÂY THÀNH SÓNG ----
  // Dựng cảnh riêng: một hàng thú cách đều THU_LAY*0.8, người chơi chỉ đủ gần con ĐẦU hàng.
  // Con cuối hàng cách người chơi xa hơn THU_SO rất nhiều, nên nó chỉ có thể chạy vì LÂY.
  const r5 = await p.evaluate((mid) => {
    const b0 = thuBaiCo(mid);
    const buoc = THU_LAY * 0.8, N = 6;
    thuDan = [];
    for (let i = 0; i < N; i++)
      thuDan.push({ loai:'cuu_bong', x: b0.x + i * buoc, y: b0.y, hx: b0.x + i * buoc, hy: b0.y,
                    st:'gam', t: 99, dir: 1, ph: 0, tx: b0.x + i * buoc, ty: b0.y });
    player.x = b0.x - THU_SO * 0.6; player.y = b0.y;
    const xaNhat = dist(thuDan[N-1].x, thuDan[N-1].y, player.x, player.y);
    thuCapNhat(0.016);
    return { N, buoc: Math.round(buoc), lay: THU_LAY, so: THU_SO,
      xaNhat: Math.round(xaNhat),
      chay: thuDan.map(t => t.st === 'chay' ? 1 : 0) };
  }, MID);
  console.log('5) sóng hoảng:', JSON.stringify(r5));
  if (!(r5.xaNhat > r5.so))
    fail(`⑤ cảnh dựng sai: con cuối hàng cách người chơi ${r5.xaNhat}px, chưa vượt ${r5.so}px nên nó chạy vì THẤY chứ không vì LÂY`);
  else if (r5.chay.reduce((a,c)=>a+c,0) !== r5.N)
    fail(`⑤ hoảng không truyền hết hàng: ${JSON.stringify(r5.chay)} — lây một vòng thì con ở rìa không bao giờ động đậy`);

  // ---- 6. đổi map thì đàn cũ biến mất ----
  const r6 = await p.evaluate((mid) => {
    const truoc = thuDan.length;
    const khac = Object.keys(MAPS).find(k => k !== mid && !MAPS[k].thu && MAPS[k].vung);
    travelTo(khac);
    const sau = thuDan.length;
    travelTo(mid);
    return { truoc, khac, sau, ve: thuDan.length };
  }, MID);
  console.log('6) đổi map:', JSON.stringify(r6));
  if (r6.sau !== 0) fail(`⑥ sang ${r6.khac} (map không khai \`thu\`) mà còn ${r6.sau} con — đàn của map trước treo lại`);
  if (!(r6.ve >= 6)) fail(`⑥ quay lại ${MID} thì đàn không dựng lại (${r6.ve} con)`);

  if (errs.length) fail('lỗi trang: ' + errs.slice(0,3).join(' | '));
  console.log(bad ? `\n${bad} LỖI` : '\nTẤT CẢ XANH');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
