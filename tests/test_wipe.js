// Xoá sạch tiến trình người chơi cũ bằng cách nâng SAVE_VERSION 2 → 3.
//
// Ba mệnh đề, và mệnh đề 2 mới là chỗ trước đây bị hở:
//   1. Save đời cũ phải bị xoá, KHÔNG được mời "Tiếp Tục", và phải nói rõ LÝ DO — mất nhân vật mà
//      không hiểu vì sao là thứ tệ nhất một bản cập nhật có thể làm.
//   2. Save từ CLOUD cũng phải qua cửa phiên bản. Trước đây handler 'vlcm:cloud-load' ghi thẳng
//      msg.data vào localStorage rồi bật nút Tiếp Tục, không kiểm v — nên một bản cloud đời cũ vẫn
//      chui vào được, và người chơi bấm Tiếp Tục thì mới phát hiện hụt.
//   3. Save đúng đời vẫn phải nạp lại bình thường — nâng phiên bản mà làm hỏng cả save mới thì
//      thành xoá dữ liệu mỗi lần mở game.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });

  // ---- 1. Save đời cũ (v2) phải bị xoá, và người chơi phải được cho biết LÝ DO ----
  const c1 = await b.newContext({ viewport:{width:1280,height:900} });
  const p1 = await c1.newPage();
  const errs = []; p1.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p1.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p1.evaluate(() => {
    localStorage.setItem('vlcm_save', JSON.stringify({
      v: 2, savedAt: Date.now(),
      player: { level: 88, silver: 999999, sect:'thieulam', name:'Người Cũ' },
      questIdx: 5, questProg: 0, questState: 'x', curMap: 'ngoai' }));
    localStorage.setItem('vlcm_settings', JSON.stringify({ bgm: 0.3, lang: 'vi' }));
  });
  await p1.reload({ waitUntil:'load' });
  await p1.waitForTimeout(1400);
  const r1 = await p1.evaluate(() => ({
    conSave: !!localStorage.getItem('vlcm_save'),
    conSetting: !!localStorage.getItem('vlcm_settings'),
    hienNutTiepTuc: !document.getElementById('btn-continue')?.classList.contains('hidden'),
    hienChonLop: !document.getElementById('sect-select')?.classList.contains('hidden'),
    lyDo: (document.querySelector('#sect-select .ss-sub')?.innerText || '').slice(0, 60),
  }));
  console.log('1) mở game với save v2:', JSON.stringify(r1));
  if (r1.conSave) fail('save cũ vẫn còn trong localStorage');
  if (r1.hienNutTiepTuc) fail('vẫn mời "Tiếp Tục" vào một save đã bị xoá');
  if (!r1.hienChonLop) fail('không đưa thẳng vào màn chọn lớp');
  if (!r1.lyDo) fail('không nói lý do vì sao mất nhân vật');
  if (!r1.conSetting) console.log('   (tuỳ chỉnh cũng bị xoá theo)');
  else console.log('   (tuỳ chỉnh được giữ lại — âm lượng/ngôn ngữ không phải tiến trình)');
  await c1.close();

  // ---- 2. Save cloud đời cũ cũng không được chui vào ----
  const c2 = await b.newContext({ viewport:{width:1280,height:900} });
  const p2 = await c2.newPage();
  p2.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p2.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p2.waitForTimeout(1200);
  const r2 = await p2.evaluate(async () => {
    window.postMessage({ type:'vlcm:cloud-load', data: JSON.stringify({
      v: 2, savedAt: Date.now() + 999999,
      player: { level: 77, sect:'thieulam' }, questIdx:1 }) }, window.location.origin);
    await new Promise(r => setTimeout(r, 500));
    return { chuiVao: !!localStorage.getItem('vlcm_save'),
             nutTiepTuc: !document.getElementById('btn-continue')?.classList.contains('hidden') };
  });
  console.log('2) đẩy save cloud v2 vào:', JSON.stringify(r2));
  if (r2.chuiVao) fail('save cloud đời cũ vẫn ghi được vào localStorage');
  if (r2.nutTiepTuc) fail('save cloud cũ vẫn bật được nút Tiếp Tục');

  // ---- 3. Save đúng đời thì vẫn phải vào bình thường ----
  const r3 = await p2.evaluate(async () => {
    window.TEST_MODE = true; startGame('thieulam', null);
    await new Promise(r => setTimeout(r, 700));
    player.level = 42; saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save'));
    const ok = loadGame();
    return { ghiV: raw.v, phienBanHienTai: SAVE_VERSION, napLai: !!ok, cap: player.level };
  });
  console.log('3) save đời mới:', JSON.stringify(r3));
  // Đọc SAVE_VERSION từ chính trang thay vì ghim số: ghim thì mỗi lần nâng phiên bản là bài
  // kiểm này đỏ dù nó chẳng phát hiện được gì. Thứ cần gác là save mới ghi ĐÚNG phiên bản
  // game đang chạy.
  if (r3.ghiV !== r3.phienBanHienTai) fail(`save mới ghi v=${r3.ghiV}, mà game đang ở ${r3.phienBanHienTai}`);
  if (!r3.napLai || r3.cap !== 42) fail('save đời mới không nạp lại được');
  await c2.close();

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
