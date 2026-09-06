// B3.1 · RƯƠNG CANH — hòm có người giữ, mở MỘT lần trong đời.
// Ba điều phải giữ:
//   ① vị trí KHÔNG đổi theo ngày (khác Vỉa Cốt) — đó là thứ biến map thành nơi chốn học thuộc được
//   ② có trại canh thật, và rương KHOÁ chừng nào trại còn sống
//   ③ mở MỘT lần vĩnh viễn — không hồi theo phút, nếu không nó là bãi cày có hoạt ảnh
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

  // ── 1. Bố trí: 4 rương mỗi vùng săn, xa bãi, xa nhau, không nằm trong đá ──
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const san = COT_DONG_IDS.map(k => COT_DONG[k].map);
    const out = {};
    for (const m of san){
      const ds = ruongCuaMap(m);
      out[m] = { so: ds.length,
        trongDa: ds.filter(r => inObstacle(m, r.x, r.y, 30)).length,
        cachBai: Math.round(Math.min(...ds.map(r => Math.min(...MAPS[m].packs.map(q => dist(r.x,r.y,q.x,q.y)))))),
        cachNhau: ds.length < 2 ? 9999 : Math.round(Math.min(...ds.flatMap((a,i) => ds.slice(i+1).map(c => dist(a.x,a.y,c.x,c.y))))),
        loai: ds.every(r => !!MOBS[r.mob]) };
    }
    return { out, MOI_MAP: RUONG_MOI_MAP, CACH_BAI: RUONG_CACH_BAI, CACH_NHAU: RUONG_CACH_NHAU };
  });
  console.log('1) bố trí:', JSON.stringify(r1.out));
  for (const m in r1.out){
    const o = r1.out[m];
    if (o.so !== r1.MOI_MAP) fail(`${m}: ${o.so}/${r1.MOI_MAP} rương`);
    if (o.trongDa) fail(`${m}: ${o.trongDa} rương nằm trong hồ/tường`);
    if (o.cachBai < r1.CACH_BAI - 80) fail(`${m}: rương chỉ cách bãi quái ${o.cachBai}px`);
    if (o.cachNhau < r1.CACH_NHAU - 80) fail(`${m}: hai rương chỉ cách nhau ${o.cachNhau}px — thành một cụm`);
    if (!o.loai) fail(`${m}: rương gán loài quái canh không có thật`);
  }
  if (!bad) pass(`cả 7 vùng đều đủ ${r1.MOI_MAP} rương: xa bãi, xa nhau, không kẹt trong đá`);

  // ── 2. Vị trí KHÔNG đổi theo ngày (khác hẳn Vỉa Cốt) ──
  const r2 = await p.evaluate(() => {
    const goc = Date.prototype.toDateString, chup = [];
    for (let i = 0; i < 4; i++){
      Date.prototype.toDateString = function(){ return 'Ngay-Gia-' + i; };
      _ruongCache = {}; _viaCache = { key:'', ds:[] };
      chup.push({ ruong: ruongCuaMap('comoc').map(r => `${r.x},${r.y}`).join(' '),
                  via: viaHomNay().map(v => `${v.map}@${v.x},${v.y}`).join(' ') });
    }
    Date.prototype.toDateString = goc; _ruongCache = {}; _viaCache = { key:'', ds:[] };
    return { ruongKhac: new Set(chup.map(c => c.ruong)).size, viaKhac: new Set(chup.map(c => c.via)).size };
  });
  console.log('2) bốn ngày:', JSON.stringify(r2));
  if (r2.ruongKhac !== 1) fail('rương ĐỔI CHỖ theo ngày — mất hẳn ý nghĩa "học thuộc được"');
  else pass('rương đứng yên qua bốn ngày — nhớ một lần là nhớ mãi');
  if (r2.viaKhac !== 4) fail('vỉa lại KHÔNG đổi theo ngày — hai hệ đang lẫn vào nhau');
  else pass('vỉa vẫn đổi mỗi ngày — hai hệ tách bạch: rương khám phá, vỉa lặp lại');

  // ── 3. Trại canh: có thật, đủ vai, và rương khoá chừng nào trại còn sống ──
  const r3 = await p.evaluate(() => {
    if (player.ruong) player.ruong = {};
    travelTo('comoc');
    const ds = ruongCuaMap('comoc'), r = ds[0];
    const canh = mobs.filter(m => m.pack === 'ruong:' + r.id);
    player.level = 90; player.lvPeak = 90; player.reflect = 0; calcDerived();
    player.x = r.x + 20; player.y = r.y;
    const khoaTruoc = ruongCanhSong(r.id);
    const moKhiKhoa = ruongMo();                 // "dùng" phím nhưng KHÔNG được mở
    const daMoKhiKhoa = ruongDaMo(r.id);
    return { id:r.id, soCanh: canh.length, vai: canh.map(m => m.role),
             vaiKhac: new Set(canh.map(m => m.role)).size,
             quanhRuong: canh.every(m => dist(m.x, m.y, r.x, r.y) < 200),
             tongCanh: mobs.filter(m => String(m.pack||'').startsWith('ruong:')).length,
             khoaTruoc, moKhiKhoa, daMoKhiKhoa, CANH: RUONG_CANH, MOI_MAP: RUONG_MOI_MAP };
  });
  console.log('3) trại canh:', JSON.stringify(r3));
  if (r3.soCanh !== r3.CANH) fail(`rương có ${r3.soCanh}/${r3.CANH} con canh`);
  else pass(`mỗi rương có ${r3.CANH} con canh`);
  if (r3.vaiKhac < 3) fail('trại canh chỉ có ' + r3.vaiKhac + ' vai — bốn con giống nhau thì không phải tiểu đội');
  else pass(`trại canh đủ ${r3.vaiKhac} vai khác nhau: ${r3.vai.join('/')}`);
  if (!r3.quanhRuong) fail('quái canh thả tít ngoài xa, không canh gì cả');
  else pass('quái canh đứng quanh rương trong 200px');
  if (r3.tongCanh !== r3.CANH * r3.MOI_MAP) fail(`cả map có ${r3.tongCanh} lính canh, phải ${r3.CANH * r3.MOI_MAP}`);
  else pass(`cả map dựng đủ ${r3.tongCanh} lính canh cho ${r3.MOI_MAP} rương`);
  if (!r3.khoaTruoc || r3.daMoKhiKhoa) fail('trại còn sống mà rương vẫn mở được — không cần đánh nhau');
  else pass('trại còn sống thì rương KHOÁ');
  if (!r3.moKhiKhoa) fail('bấm J vào rương khoá mà phím rơi tiếp xuống hái thảo dược');
  else pass('bấm J vào rương khoá: báo lý do, không rơi xuống hành động khác');

  // ── 4. Dọn trại rồi mở: có thưởng, và lần hai KHÔNG có gì ──
  const r4 = await p.evaluate(() => {
    const r = ruongCuaMap('comoc')[0];
    mobs = mobs.filter(m => m.pack !== 'ruong:' + r.id);
    player.x = r.x + 20; player.y = r.y;
    const bacTruoc = player.silver, doTruoc = groundLoot.length;
    const hopTruoc = Object.values(player.baohap || {}).reduce((a,c) => a + c, 0);
    const lan1 = ruongMo();
    const bacGiua = player.silver, doGiua = groundLoot.length;
    const lan2 = ruongMo();
    return { lan1, lan2, bacThem: bacGiua - bacTruoc, doThem: doGiua - doTruoc,
             bacThem2: player.silver - bacGiua, doThem2: groundLoot.length - doGiua,
             hopThem: Object.values(player.baohap || {}).reduce((a,c) => a + c, 0) - hopTruoc,
             daMo: ruongDaMo(r.id), conLai: ruongConLai('comoc') };
  });
  console.log('4) mở rương:', JSON.stringify(r4));
  if (!r4.lan1) fail('dọn sạch trại rồi vẫn không mở được');
  else pass('dọn sạch trại thì mở được');
  if (r4.doThem !== 2) fail(`mở rương rơi ${r4.doThem} món, phải 2`);
  else pass('rơi 2 món trang bị');
  if (r4.bacThem <= 0) fail('mở rương không được Lumen');
  else pass(`+${r4.bacThem} Lumen`);
  if (r4.bacThem2 || r4.doThem2) fail('mở LẦN HAI vẫn ra thưởng — rương thành bãi cày');
  else pass('lần hai: không ra gì (một lần vĩnh viễn cho mỗi nhân vật)');
  if (!r4.daMo) fail('mở xong mà không ghi lại là đã mở');
  else pass(`đã ghi nhận, còn ${r4.conLai} rương chưa mở trên vùng này`);

  // ── 5. Rương đã mở thì trại canh KHÔNG dựng lại khi quay lại map ──
  const r5 = await p.evaluate(() => {
    const r = ruongCuaMap('comoc')[0];
    travelTo('daohoa'); travelTo('comoc');
    return { canhCuaRuongDaMo: mobs.filter(m => m.pack === 'ruong:' + r.id).length,
             tongCanh: mobs.filter(m => String(m.pack||'').startsWith('ruong:')).length,
             vanDaMo: ruongDaMo(r.id) };
  });
  console.log('5) quay lại map:', JSON.stringify(r5));
  if (!r5.vanDaMo) fail('đi map khác rồi quay lại là rương "chưa mở" trở lại');
  else pass('rương đã mở vẫn đã mở sau khi rời map');
  if (r5.canhCuaRuongDaMo) fail('rương đã mở mà trại canh vẫn dựng lại — map gánh quái thừa mãi mãi');
  else pass('rương đã mở thì trại tan hẳn, không dựng lại');
  if (r5.tongCanh !== 12) fail(`còn ${r5.tongCanh} lính canh, phải 12 (3 rương chưa mở × 4)`);
  else pass('3 rương chưa mở → còn đúng 12 lính canh');

  // ── 6. Vỉa Cốt và Rương Canh không chồng lên nhau ──
  const r6 = await p.evaluate(() => {
    const xau = [];
    for (const v of viaHomNay())
      for (const r of ruongCuaMap(v.map))
        if (dist(v.x, v.y, r.x, r.y) < 150) xau.push(`${v.map} ${Math.round(dist(v.x,v.y,r.x,r.y))}px`);
    return { xau };
  });
  console.log('6) chồng chỗ:', JSON.stringify(r6));
  if (r6.xau.length) fail('vỉa mọc đè lên rương: ' + r6.xau.join(', '));
  else pass('không vỉa nào mọc đè lên rương');

  // ── 7. Bảng Bản Đồ nói còn mấy rương ──
  const r7 = await p.evaluate(() => ({ html: banSacHtml('comoc') }));
  if (!/Rương Canh/.test(r7.html)) fail('bảng Bản Đồ không nói vùng còn mấy rương');
  else pass('bảng Bản Đồ đếm rương còn lại: ' + (r7.html.match(/Rương Canh[^<]*<b>[^<]*<\/b>[^<]*/) || [''])[0].trim());

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
