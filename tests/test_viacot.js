// B3.3 · VỈA CỐT — mỏ Cốt trồi lên chỗ khác mỗi ngày.
// Cái phải giữ được là ba điều, và cả ba đều dễ vỡ khi ai đó "tối ưu" sau này:
//   ① vỉa ở XA bãi quái — nếu nó rơi cạnh bãi thì cả thiết kế mất nghĩa, AUTO nhặt luôn
//   ② vị trí ĐỔI theo ngày và ỔN ĐỊNH trong ngày — tải lại trang không được đổi chỗ
//   ③ MỘT lần một ngày cho mỗi vùng — mỏ hồi sinh theo phút thì lại thành bãi cày
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

  // ── 1. Ba vỉa, ba vùng khác nhau, và đều nằm xa bãi quái ──
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const ds = viaHomNay();
    return { so: ds.length, mapKhac: new Set(ds.map(v => v.map)).size,
      dsMap: ds.map(v => v.map),
      dong: ds.map(v => v.dong),
      dungDong: ds.every(v => COT_DONG_THEO_MAP[v.map] === v.dong),
      trongMap: ds.every(v => v.x > 100 && v.y > 100 && v.x < MAP.w - 100 && v.y < MAP.h - 100),
      trongDa: ds.filter(v => inObstacle(v.map, v.x, v.y, 30)).map(v => v.map),
      cachBai: ds.map(v => Math.round(Math.min(...(MAPS[v.map].packs || []).map(q => dist(v.x, v.y, q.x, q.y))))),
      cachTha: ds.map(v => Math.round(dist(v.x, v.y, MAPS[v.map].spawn.x, MAPS[v.map].spawn.y))),
      VIA_CACH_BAI, VIA_SO_NGAY };
  });
  console.log('1) vỉa hôm nay:', JSON.stringify(r1));
  if (r1.so !== r1.VIA_SO_NGAY) fail(`phải ${r1.VIA_SO_NGAY} vỉa/ngày, đang ${r1.so}`);
  else pass(`${r1.so} vỉa, mỗi ngày`);
  if (r1.mapKhac !== r1.so) fail('hai vỉa rơi vào cùng một vùng');
  else pass('ba vỉa ở ba vùng khác nhau');
  if (!r1.dungDong) fail('Dòng của vỉa không khớp Dòng của vùng: ' + r1.dong.join('/'));
  else pass('mỗi vỉa mang đúng Dòng của vùng nó mọc: ' + r1.dong.join('/'));
  if (!r1.trongMap) fail('vỉa rơi ra ngoài mép bản đồ');
  else pass('mọi vỉa nằm trong lòng bản đồ');
  if (r1.trongDa.length) fail('vỉa mọc TRONG vật cản tĩnh (hồ/tường): ' + r1.trongDa.join(','));
  else pass('không vỉa nào mọc trong hồ hay tường');
  // ⚠ Ngưỡng nới: viaChonDiem nới 110px sau 300 lần thử để vùng chật vẫn có vỉa.
  //   Đo theo ngưỡng đã nới, không theo ngưỡng lý tưởng — nếu không bài này chập chờn theo ngày.
  const san = r1.VIA_CACH_BAI - 110;
  const gan = r1.cachBai.filter(d => d < san);
  if (gan.length) fail(`có vỉa chỉ cách bãi quái ${gan.join('/')}px (sàn ${san}) — AUTO nhặt được, mất nghĩa`);
  else pass(`vỉa gần bãi nhất còn cách ${Math.min(...r1.cachBai)}px — vẫn là một chuyến đi`);
  if (r1.cachTha.some(d => d < 120)) fail('vỉa mọc ngay điểm thả: ' + r1.cachTha.join('/'));
  else pass(`cách điểm thả ${r1.cachTha.join('/')}px`);

  // ── 2. Trong một ngày thì vỉa ĐỨNG YÊN (tải lại trang không đổi chỗ) ──
  const truoc = r1.dsMap.join(',') + '|' + await p.evaluate(() => viaHomNay().map(v => v.x + ':' + v.y).join(','));
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(400);
  const sau = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    return viaHomNay().map(v => v.map).join(',') + '|' + viaHomNay().map(v => v.x + ':' + v.y).join(',');
  });
  console.log('2) trước/sau tải lại:', truoc, '·', sau);
  if (truoc !== sau) fail('tải lại trang là vỉa nhảy chỗ — không có gì lưu vị trí, hạt phải tính lại từ ngày');
  else pass('tải lại trang: vỉa vẫn đúng chỗ cũ (hạt tính từ chuỗi ngày, không lưu state)');

  // ── 3. Ngày khác thì vỉa mọc chỗ khác ──
  const r3 = await p.evaluate(() => {
    const goc = Date.prototype.toDateString;
    const chup = [];
    for (let i = 0; i < 6; i++){
      Date.prototype.toDateString = function(){ return 'Ngay-Gia-' + i; };
      _viaCache = { key:'', ds:[] };
      chup.push(viaHomNay().map(v => `${v.map}@${v.x},${v.y}`).join(' '));
    }
    Date.prototype.toDateString = goc;
    _viaCache = { key:'', ds:[] };
    return { chup, khac: new Set(chup).size };
  });
  console.log('3) sáu ngày:', JSON.stringify(r3.chup, null, 1));
  if (r3.khac !== 6) fail(`sáu ngày chỉ cho ${r3.khac} tấm bản đồ khác nhau`);
  else pass('sáu ngày liên tiếp → sáu bố cục vỉa hoàn toàn khác nhau');

  // ── 4. Khai một lần: có Cốt, và lần hai KHÔNG có gì ──
  const r4 = await p.evaluate(() => {
    const v = viaHomNay()[0];
    travelTo(v.map);
    player.level = 60; player.lvPeak = 60; calcDerived();
    if (player.via) delete player.via[v.map];
    viaThemPickup();
    const coPickup = pickups.filter(x => x.type === 'via').length;
    player.x = v.x + 10; player.y = v.y;
    const khoTruoc = cotKho().length, honTruoc = ((player.mats || {}).datHon || 0);
    const lan1 = viaKhai();
    const khoGiua = cotKho().length;
    const lan2 = viaKhai();
    const khoSau = cotKho().length;
    // đứng xa thì không khai được
    if (player.via) delete player.via[v.map];
    player.x = v.x + 400; player.y = v.y;
    const xa = viaKhai();
    return { map:v.map, coPickup, lan1, lan2, xa, khoTruoc, khoGiua, khoSau,
             honThem: ((player.mats || {}).datHon || 0) - honTruoc,
             dong: cotKho().slice(khoTruoc, khoGiua).map(c => c.dong),
             dungDong: cotKho().slice(khoTruoc, khoGiua).every(c => c.dong === v.dong),
             heo: pickups.filter(x => x.type === 'via' && x.respawn > 0).length };
  });
  console.log('4) khai vỉa:', JSON.stringify(r4));
  if (r4.coPickup !== 1) fail(`vào map có vỉa mà thả ${r4.coPickup} vật thể vỉa`);
  else pass('vào vùng có vỉa: đúng một vỉa hiện trên mặt đất');
  if (!r4.lan1) fail('đứng sát vỉa nhấn khai mà không ăn thua');
  else pass('khai được khi đứng trong tầm');
  if (r4.khoGiua - r4.khoTruoc !== 3) fail(`khai xong chỉ được ${r4.khoGiua - r4.khoTruoc} mảnh Cốt, phải 3`);
  else pass('mỗi vỉa cho đúng 3 mảnh Cốt');
  if (!r4.dungDong) fail('Cốt rơi ra sai Dòng: ' + r4.dong.join('/'));
  else pass('Cốt rơi đúng Dòng của vùng');
  if (r4.honThem <= 0) fail('khai vỉa không cho Đất Hồn');
  else pass(`kèm +${r4.honThem} Đất Hồn`);
  if (r4.lan2 || r4.khoSau !== r4.khoGiua) fail('khai lần hai trong cùng ngày VẪN ăn — AUTO đứng đó là xong');
  else pass('lần hai trong ngày: không ăn gì (một lần/ngày/vùng)');
  if (!r4.heo) fail('khai xong vỉa vẫn sáng như chưa khai');
  else pass('khai xong vỉa khép lại thành vết sẹo xám');
  if (r4.xa) fail('đứng cách 400px vẫn khai được — không cần đi tới nơi');
  else pass('đứng xa thì không khai được, phải đi tới tận nơi');

  // ── 5. Vùng KHÔNG có vỉa hôm nay thì không có gì cả ──
  const r5 = await p.evaluate(() => {
    const co = new Set(viaHomNay().map(v => v.map));
    const khong = COT_DONG_IDS.map(k => COT_DONG[k].map).filter(m => !co.has(m));
    travelTo(khong[0]);
    return { map: khong[0], soKhong: khong.length,
             pickup: pickups.filter(x => x.type === 'via').length,
             khai: viaKhai() };
  });
  console.log('5) vùng không vỉa:', JSON.stringify(r5));
  if (r5.soKhong !== 4) fail(`7 vùng − 3 vỉa phải còn 4 vùng trống, đang ${r5.soKhong}`);
  else pass('4/7 vùng hôm nay không có vỉa — nên chọn đi đâu là một quyết định');
  if (r5.pickup || r5.khai) fail(`${r5.map} không có vỉa mà vẫn thả/khai được`);
  else pass('vùng không có vỉa: không thả gì, không khai được gì');

  // ── 6. Bảng Bản Đồ + danh sách sự kiện phải NÓI RA vỉa ở đâu ──
  const r6 = await p.evaluate(() => {
    const v = viaHomNay()[0];
    const hang = banSacHtml(v.map);
    const sk = eventList(Date.now());
    return { hangCoVia: /Vỉa Cốt/.test(hang),
             soDongVia: sk.filter(x => /Vỉa Cốt/.test(x.name)).length,
             coTenMap: sk.filter(x => /Vỉa Cốt/.test(x.name)).every(x => !!MAPS[x.map]) };
  });
  console.log('6) chỉ đường:', JSON.stringify(r6));
  if (!r6.hangCoVia) fail('bảng Bản Đồ không nói vùng này hôm nay có vỉa');
  else pass('bảng Bản Đồ nói rõ vùng nào hôm nay có vỉa');
  if (r6.soDongVia !== 3) fail(`danh sách sự kiện có ${r6.soDongVia} dòng vỉa, phải 3 (mỗi vỉa một dòng, vì mỗi cái một CHỖ)`);
  else pass('danh sách sự kiện: ba dòng vỉa riêng, mỗi dòng chỉ đúng một vùng');
  if (!r6.coTenMap) fail('dòng vỉa trong danh sách sự kiện không trỏ vào map nào');
  else pass('mỗi dòng vỉa trỏ đúng vào một vùng có thật');

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
