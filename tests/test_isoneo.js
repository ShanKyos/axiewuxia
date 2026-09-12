// BẢNG NEO CỦA VẬT THỂ LÁT VIÊN — và cái bẫy "bảng sinh ra ở một nơi, game đọc ở nơi khác".
//
// ⚠ VÌ SAO CÓ BÀI NÀY. Bảng `ISO_NEO` (toạ độ CHÂN của từng sprite) do đường nướng ghi ra.
// Suốt một thời gian nó ghi vào `assets/iso/iso.js` rồi phải CHÉP TAY sang `data/iso.js` — tệp
// mà `index.html` thật sự nạp. Bước chép tay đó bị quên đúng một lần, và cái giá là:
//
//   SÁU map — daohoa · chungnam · comoc · tuyettinh · mongco · nhanmon — khai cây/bụi theo
//   biome, mà `veVatIso()` `return` sớm khi không tra được neo, nên chúng KHÔNG VẼ MỘT CÁI CÂY
//   NÀO CẢ. Cả đợt việc "cây/đá theo biome" nằm im trong kho. Không bài kiểm nào đỏ, không lỗi
//   nào in ra, và ảnh chụp map thì vẫn ra một map — chỉ là một map trống.
//
// Đường nướng nay ghi thẳng vào `data/iso.js` (xem `ghi_neo()` trong tools/iso/nuong_tile.py),
// nên đường hỏng cũ đã bịt. Bài này gác cho lần sau, và gác bằng HAI tầng — vì tầng thứ nhất
// (đối chiếu tên) không bắt được chuyện tệp neo đúng mà PNG thiếu.
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

  // ---- 1. MỌI tên sprite mà dữ liệu hoặc engine nhắc tới đều phải có neo ----
  const r1 = await p.evaluate(() => {
    const neo = window.ISO_NEO || {};
    const can = new Set();
    for (const n of ISO_CAY) can.add(n);
    for (const n of ISO_NHO) can.add(n);
    for (const n of TRAI_DO) can.add(n);
    can.add('trai_lua');
    for (const k in MAPS){
      const md = MAPS[k];
      for (const n of (md.isoCayBo || [])) can.add(n);
      for (const n of (md.isoNhoBo || [])) can.add(n);
      for (const v of (md.vatDat || [])) if (v.img) can.add(v.img);
    }
    const thieu = [...can].filter(n => !neo[n]);
    // ...và chiều ngược lại: neo cho một sprite không tồn tại là rác, nhưng KHÔNG phải lỗi —
    // bộ nướng xuất cả những viên chưa map nào dùng. Chỉ báo, không đánh đỏ.
    return { soNeo: Object.keys(neo).length, soCan: can.size, thieu,
             thua: Object.keys(neo).filter(n => !can.has(n)).length };
  });
  console.log('1) neo:', JSON.stringify(r1));
  if (r1.thieu.length)
    fail(`① ${r1.thieu.length} sprite được khai mà KHÔNG có neo ⇒ veVatIso() bỏ qua im lặng: ${r1.thieu.slice(0,8).join(', ')}`);

  // ---- 2. Mỗi tên có neo phải tải được thành ảnh thật ----
  const r2 = await p.evaluate(async () => {
    const ds = Object.keys(window.ISO_NEO || {});
    const kq = await Promise.all(ds.map(n => new Promise(res => {
      const im = new Image();
      im.onload = () => res(null); im.onerror = () => res(n);
      im.src = 'assets/iso/' + n + '.png';
    })));
    return { tong: ds.length, hong: kq.filter(Boolean) };
  });
  console.log('2) tải ảnh:', JSON.stringify({ tong:r2.tong, hong:r2.hong.length }));
  if (r2.hong.length) fail(`② ${r2.hong.length} sprite có neo mà KHÔNG có tệp PNG: ${r2.hong.slice(0,8).join(', ')}`);

  // ---- 3. TẦNG HÀNH VI: map lát viên phải thật sự VẼ RA vật thể ----
  // Đây là tầng bắt được đúng lỗi đã xảy ra. Đối chiếu tên không đủ: nếu một ngày nào đó
  // `veVatIso` hỏng vì lý do khác thì tầng 1 vẫn xanh mà map vẫn trống.
  const r3 = await p.evaluate(async () => {
    applyTestBoost();
    const ra = [];
    for (const k of Object.keys(MAPS)){
      const md = MAPS[k];
      if (!md.sanIso || md.dungeon) continue;
      travelTo('ardhaven'); travelTo(k);
      const iso = decor.filter(d => d.type === 'iso');
      const veDuoc = iso.filter(d => (window.ISO_NEO || {})[d.img]).length;
      ra.push({ map:k, iso: iso.length, veDuoc });
    }
    return ra;
  });
  console.log('3) vật thể lát viên từng map:');
  for (const o of r3) console.log(`   ${o.map.padEnd(11)} ${String(o.iso).padStart(4)} vật · ${o.veDuoc} vẽ được`);
  for (const o of r3){
    if (o.iso < 40) fail(`③ ${o.map} chỉ rải ${o.iso} vật thể lát viên — map lát viên mà trơ mặt đất`);
    else if (o.veDuoc !== o.iso)
      fail(`③ ${o.map} rải ${o.iso} vật thể nhưng chỉ ${o.veDuoc} cái vẽ được — ${o.iso - o.veDuoc} cái mất neo`);
  }

  if (errs.length) fail('lỗi trang: ' + errs.slice(0,3).join(' | '));
  console.log(bad ? `\n${bad} LỖI` : '\nTẤT CẢ XANH');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
