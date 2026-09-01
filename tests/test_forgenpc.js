// Rèn phải TỚI THỢ RÈN, đúng như MU.
//
// Bản cũ có ba đường vào lò rèn, hai trong số đó bỏ qua thợ rèn hoàn toàn: tab "Rèn Luyện" trong
// bảng Nhân Vật, và phím F. Cả hai mở được từ giữa bãi quái. Mà chính code đã tự mâu thuẫn:
// atRoyalForge() (đứng trong 220px của Thợ Rèn) có sẵn từ lâu nhưng chỉ vài công thức `royal`
// dùng tới.
//
// Nay: lò rèn có bảng riêng, chỉ mở khi đứng cạnh Thợ Rèn. Phím F đứng xa thì DẪN ĐƯỜNG.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // 1) tab Rèn Luyện đã biến khỏi bảng Nhân Vật
  const r1 = await p.evaluate(() => {
    closePanels(); window.charTab = 'info'; renderCharPanel();
    const h = el('panel-char').innerHTML;
    return { tabs: CHAR_TABS.map(t => t.id), conChu: /Rèn Luyện/.test(h),
             coBangRieng: !!document.getElementById('panel-forge') };
  });
  console.log('1) bảng Nhân Vật:', JSON.stringify(r1));
  if (r1.tabs.includes('forge')) fail('CHAR_TABS vẫn còn tab forge');
  if (r1.conChu) fail('bảng Nhân Vật vẫn hiện chữ "Rèn Luyện"');
  if (!r1.coBangRieng) fail('thiếu #panel-forge');

  // 2) đứng XA thợ rèn: không mở được, và phải chỉ đường
  const r2 = await p.evaluate(() => {
    applyTestBoost(); player.level = 60; calcDerived();
    const n = NPCS.find(x => x.talk === 'forge');
    travelTo(n.map);
    player.x = n.x + 3000; player.y = n.y + 3000;   // xa hẳn
    player.beacon = null;
    closePanels();
    window.openForgePanel();
    return { gan: atRoyalForge(), mo: !el('panel-forge').classList.contains('hidden'),
             coMocDan: !!player.beacon, nhan: player.beacon && player.beacon.label };
  });
  console.log('2) đứng xa:', JSON.stringify(r2));
  if (r2.gan) fail('đặt xa mà atRoyalForge() vẫn true — bài đo sai chỗ');
  if (r2.mo) fail('đứng xa thợ rèn mà vẫn mở được lò — đúng lỗi cần sửa');
  if (!r2.coMocDan) fail('đứng xa mà không chỉ đường — người chơi không biết đi đâu');

  // 3) đứng CẠNH thợ rèn: mở được, và nội dung là lò rèn thật
  const r3 = await p.evaluate(() => {
    const n = NPCS.find(x => x.talk === 'forge');
    player.x = n.x + 40; player.y = n.y + 40;
    closePanels();
    window.openForgePanel();
    const pan = el('panel-forge');
    return { gan: atRoyalForge(), mo: !pan.classList.contains('hidden'),
             coLo: /Lò Hỗn Độn/.test(pan.textContent),
             coKhay: /KHAY HỖN ĐỘN/i.test(pan.textContent),
             bangNhanVatDong: el('panel-char').classList.contains('hidden') };
  });
  console.log('3) đứng cạnh:', JSON.stringify(r3));
  if (!r3.gan) fail('đứng sát mà atRoyalForge() false');
  if (!r3.mo) fail('đứng cạnh thợ rèn mà không mở được lò');
  if (!r3.coLo || !r3.coKhay) fail('bảng mở ra không phải lò rèn');
  if (!r3.bangNhanVatDong) fail('mở lò mà bảng Nhân Vật cũng bật theo');

  // 4) NPC bấm vào cũng mở đúng bảng đó
  const r4 = await p.evaluate(() => {
    closePanels();
    renderBaGua();
    return { mo: !el('panel-forge').classList.contains('hidden') };
  });
  console.log('4) qua NPC:', JSON.stringify(r4));
  if (!r4.mo) fail('bấm NPC Thợ Rèn không mở lò');

  // 5) chưa đủ cấp thì báo, không mở
  const r5 = await p.evaluate(() => {
    player.level = 2; calcDerived();
    closePanels();
    window.openForgePanel();
    return { mo: !el('panel-forge').classList.contains('hidden'), nguong: FORGE_LV };
  });
  console.log('5) chưa đủ cấp:', JSON.stringify(r5));
  if (r5.mo) fail('cấp 2 vẫn mở được lò');
  if (r5.nguong !== 4) fail(`ngưỡng mở khoá ${r5.nguong}, renderForge kiểm cấp 4`);

  await p.waitForTimeout(400);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
