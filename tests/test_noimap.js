// B1 + B2 · NỐI MAP BẰNG RÌA · ĐIỂM DỊCH CHUYỂN MỞ BẰNG ĐI BỘ
//
// ⚠ Bài này ra đời từ một LỖI THẬT, không phải từ một tính năng: Bug Tribe Tunnels (40), Reptile Sunstone Flats
// (80) và Dusk Marsh (100) từng KHÔNG CÓ LỐI VÀO NÀO cho nhân vật mới. Nút "Dịch Chuyển" chỉ
// hiện khi player.wpUnlocked[id], mà cờ đó chỉ bật KHI ĐÃ TỚI map — chưa tới được thì không bao
// giờ mở, và GATES không có cổng nào dẫn tới ba vùng đó.
//
// ⚠ CÁCH ĐO PHẢI ĐÚNG: gọi thẳng travelTo() thì map nào cũng "tới được" — nó là hàm console,
// không qua cửa nào. Bài này lan theo ĐÚNG ĐƯỜNG NGƯỜI CHƠI: chỉ đi qua GATES, và chỉ dịch
// chuyển tới nơi đã mở khoá. Đo bằng hàm là cách tôi đã kết luận nhầm một lần.
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

  // ── 1. MỌI vùng ngoài trời phải tới được BẰNG ĐI BỘ, không cần nhiệm vụ, không cần cheat ──
  const r1 = await p.evaluate(() => {
    startGame('thieulam', null);                   // KHÔNG bật TEST_MODE
    player.level = 120; player.lvPeak = 120; calcDerived();
    const den = new Set(Object.keys(player.wpUnlocked || {}));
    let doi = true;
    while (doi){
      doi = false;
      for (const g of GATES)
        if (g.to && !g.deep && den.has(g.map) && !den.has(g.to) && mapGate(g.to).ok){ den.add(g.to); doi = true; }
    }
    const ngoai = Object.keys(MAPS).filter(m => !MAPS[m].dungeon);
    return { batDau: Object.keys(player.wpUnlocked || {}), toiDuoc: [...den].sort(),
             khongToi: ngoai.filter(m => !den.has(m)) };
  });
  console.log('1) lan theo cổng:', JSON.stringify(r1));
  if (r1.khongToi.length) fail(`không có đường ĐI BỘ tới: ${r1.khongToi.join(', ')} — nội dung chết`);
  else pass(`cả ${r1.toiDuoc.length} vùng ngoài trời đều tới được bằng đi bộ từ ${r1.batDau.join('+')}`);

  // ── 2. Mỗi lối rìa phải HAI CHIỀU, và đi qua thì hiện ra ở rìa đối diện chứ không ở điểm thả ──
  const r2 = await p.evaluate(() => {
    const doi = [], motChieu = [], veTha = [];
    for (const g of GATES){
      if (!g.to || g.deep || g.portal) continue;
      const nguoc = GATES.some(h => h.map === g.to && h.to === g.map && !h.deep);
      if (!nguoc) motChieu.push(`${g.map}→${g.to}`);
      const md = MAPS[g.to];
      const sf = md.spawnFrom && md.spawnFrom[g.map];
      // Lối RÌA HOANG DÃ: hai vùng ngoài trời giáp nhau. "Lối Về Thành" cũng có tiền tố "Lối"
      // nhưng nó đi vào TRONG tường thành, tới đúng cổng tường — không phải rìa map, nên luật
      // "điểm tới phải sát rìa" không áp cho nó. (Bẫy này bắt được ngay lần chạy đầu.)
      const laRia = /^Lối /.test(g.name || '') && !MAPS[g.to].city;
      if (laRia && !sf) veTha.push(`${g.map}→${g.to}`);
      // ⚠ Đo theo khổ của map ĐÍCH (md), không phải MAP toàn cục — MAP là map ĐANG đứng. Hồi
      // map đầu game còn 2600×1900 thì hai con số trùng nhau nên lỗi này nằm im; tới lúc điểm
      // thả dời sang Ardhaven 6400×3200, ngưỡng nhảy lên 6000 và sáu lối rìa hợp lệ bị báo sai.
      const mw = md.w || 2600, mh = md.h || 1900;
      if (laRia && sf) doi.push({ tu:g.map, den:g.to, x:sf.x, y:sf.y,
        satRia: sf.x < 400 || sf.y < 400 || sf.x > mw-400 || sf.y > mh-400,
        trongDa: inObstacle(g.to, sf.x, sf.y, 30) });
    }
    return { doi, motChieu, veTha };
  });
  console.log('2) lối rìa:', JSON.stringify(r2));
  if (r2.motChieu.length) fail('lối một chiều — đi sang rồi không quay lại được: ' + r2.motChieu.join(', '));
  else pass('mọi lối đều hai chiều');
  if (r2.veTha.length) fail('lối rìa mà không khai spawnFrom — sang map là văng về điểm thả: ' + r2.veTha.join(', '));
  else pass(`cả ${r2.doi.length} lối rìa đều có điểm tới riêng`);
  {
    const xa = r2.doi.filter(d => !d.satRia).map(d => `${d.tu}→${d.den}`);
    const da = r2.doi.filter(d => d.trongDa).map(d => `${d.tu}→${d.den}`);
    if (xa.length) fail('điểm tới không nằm sát rìa — không đọc ra là giáp ranh: ' + xa.join(', '));
    else pass('mọi điểm tới nằm sát rìa map, đọc ra là chỗ giáp ranh');
    if (da.length) fail('điểm tới nằm trong vật cản: ' + da.join(', '));
    else pass('không điểm tới nào kẹt trong đá');
  }

  // ── 3. Cổng phải ĐỨNG ĐƯỢC và đi tới được từ điểm thả của chính map đó ──
  const r3 = await p.evaluate(() => {
    const xau = [], xa = [];
    for (const g of GATES){
      if (!g.to || g.deep || !/^Lối /.test(g.name || '')) continue;   // gồm cả Lối Về Thành — cổng nào cũng phải đứng được
      if (inObstacle(g.map, g.x, g.y, 30)) { xau.push(`${g.map} (${g.x},${g.y})`); continue; }
      travelTo(g.map);
      const path = navPath(MAPS[g.map].spawn.x, MAPS[g.map].spawn.y, g.x, g.y);
      if (!path) xa.push(`${g.map}→${g.to}`);
    }
    return { xau, xa };
  });
  console.log('3) cổng đứng được:', JSON.stringify(r3));
  if (r3.xau.length) fail('cổng đặt trong vật cản: ' + r3.xau.join(', '));
  else pass('mọi cổng rìa đặt ở ô đi được');
  if (r3.xa.length) fail('không tìm được đường từ điểm thả tới cổng: ' + r3.xa.join(', '));
  else pass('từ điểm thả đi bộ tới được mọi cổng rìa');

  // ── 4. Điểm dịch chuyển mở bằng ĐI TỚI, không phải bằng nhiệm vụ ──
  const r4 = await p.evaluate(() => {
    startGame('thieulam', null);
    player.level = 120; player.lvPeak = 120; calcDerived();
    const truoc = !!(player.wpUnlocked || {}).mongco;
    // Đi đúng chuỗi rìa thật: Werebear Woods → Bug Tribe Tunnels → Reptile Sunstone Flats.
    // (Bird Tribe Heights KHÔNG có lối rìa — bốn con trùm của nó phủ kín cả bốn rìa, xem ghi chú ở GATES.)
    travelTo('chungnam');
    travelTo('comoc', 'chungnam');
    travelTo('mongco', 'comoc');
    const sau = !!(player.wpUnlocked || {}).mongco;
    const viTri = { x: Math.round(player.x), y: Math.round(player.y) };
    const cong = GATES.find(g => g.map === 'mongco' && g.to === 'comoc');
    return { truoc, sau, viTri, satRia: dist(viTri.x, viTri.y, cong.x, cong.y) < 200 };
  });
  console.log('4) mở điểm mốc:', JSON.stringify(r4));
  if (r4.truoc) fail('mongco đã mở khoá sẵn từ lúc tạo nhân vật — mất hẳn phần thưởng khám phá');
  else pass('lúc tạo nhân vật, mongco chưa mở điểm dịch chuyển');
  if (!r4.sau) fail('đi bộ tới mongco rồi mà điểm dịch chuyển vẫn chưa mở');
  else pass('đi tới một lần là điểm dịch chuyển mở — không cần nhiệm vụ nào');
  if (!r4.satRia) fail(`qua lối rìa mà hiện ra ở (${r4.viTri.x},${r4.viTri.y}) — không phải cạnh cổng về`);
  else pass(`qua lối rìa thì hiện ra ngay cạnh cổng về (${r4.viTri.x},${r4.viTri.y}) — đi ngược lại được ngay`);

  // ── 5. Bảng Bản Đồ phải NÓI ra đi bộ từ đâu tới đâu ──
  const r5 = await p.evaluate(() => {
    window.TEST_MODE = false;
    startGame('thieulam', null);
    player.level = 120; player.lvPeak = 120; calcDerived();
    closePanels(); renderMapPanel();
    const t = document.getElementById('panel-map').innerText;
    return { coLa: /🧭 Đi bộ:/.test(t),
             soDong: (t.match(/🧭 Đi bộ:/g) || []).length,
             coHollow: /Bug Tribe Tunnels/.test(t),
             noiSai: /cần được nhiệm vụ dẫn tới/.test(t),
             coDiBo: /tự đi bộ tới đó một lần/.test(t) };
  });
  console.log('5) bảng Bản Đồ:', JSON.stringify(r5));
  if (!r5.coLa || r5.soDong < 6) fail(`bảng Bản Đồ chỉ có ${r5.soDong} dòng chỉ lối — không đọc ra là bản đồ`);
  else pass(`bảng Bản Đồ có ${r5.soDong} dòng "🧭 Đi bộ" — nhìn ra được vùng nào nối vùng nào`);
  if (r5.noiSai) fail('bảng vẫn nói mở điểm dịch chuyển "bằng nhiệm vụ" — sai, nhiệm vụ đã gỡ sạch');
  else pass('không còn câu "cần nhiệm vụ dẫn tới"');
  if (!r5.coDiBo) fail('bảng không nói cách mở điểm dịch chuyển là tự đi bộ tới');
  else pass('bảng nói rõ: tự đi bộ tới một lần là mở');

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
