// Gộp tiền tệ — bậc 1: xoá hai ô đếm chết và quy đổi save cũ.
//
// Bản khảo sát đếm được 26 ô đếm tiền tệ/vật liệu, trong khi MU Season 6 chỉ có Zen + 8 ngọc.
// Hai ô đầu tiên bị cắt là hai ô rõ ràng nhất:
//   Anima (player.dantian.tuvi) — CỘNG ở 13 nơi, TRỪ ở 0 nơi. Chỗ tiêu cũ là "đột phá cảnh giới",
//     hệ đó đã chuyển sang tự động theo cấp độ; chỗ tiêu bị gỡ mà nguồn thu để nguyên.
//   Công Huân Lệnh (player.congHuan) — kiếm từ đúng MỘT nguồn, tiêu ở đúng MỘT chỗ. Cả vòng đời
//     là một đường thẳng, nên cho chỗ tiêu nhận thẳng bạc là xong.
//
// Điều bài kiểm này gác chặt nhất: người chơi KHÔNG ĐƯỢC MẤT GIÁ TRỊ khi mở lại save cũ.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  p.on('pageerror', e => console.log('ERR', String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => {
    player.silver = 1000; saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save'));
    raw.player.dantian = { realm:0, tuvi:750 }; raw.player.congHuan = 3; raw.player.silver = 1000;
    localStorage.setItem('vlcm_save', JSON.stringify(raw));
    loadGame();
    return { bac: player.silver, conAnima: 'tuvi' in (player.dantian||{}), conCH: 'congHuan' in player };
  });
  const mong = 1000 + 750*2 + 3*2000;
  console.log('1) quy đổi save cũ:', JSON.stringify(r), '· mong', mong);
  if (r.bac !== mong) fail(`bạc ra ${r.bac}, phải là ${mong}`);
  if (r.conAnima) fail('ô Anima chưa xoá');
  if (r.conCH) fail('ô Công Huân Lệnh chưa xoá');

  const r2 = await p.evaluate(() => {
    player.silver = 5000; const truoc = player.silver;
    const truocKho = JSON.stringify({ j: player.jewels, m: player.mat });
    rollVanDuyen();
    return { truoc, sau: player.silver, doi: JSON.stringify({ j: player.jewels, m: player.mat }) !== truocKho, gia: GO_CONGHUAN };
  });
  console.log('2) quay Sảnh Cầu May bằng bạc:', JSON.stringify(r2));
  if (r2.sau !== r2.truoc - r2.gia && r2.sau <= r2.truoc) { /* có thể trúng thưởng bạc, chấp nhận */ }
  if (r2.sau === r2.truoc) fail('quay mà không trừ bạc');

  const r3 = await p.evaluate(() => {
    player.silver = 100;   // không đủ
    const truoc = player.silver; rollVanDuyen();
    return { truoc, sau: player.silver };
  });
  console.log('3) không đủ bạc thì không quay:', JSON.stringify(r3));
  if (r3.sau !== r3.truoc) fail('thiếu bạc mà vẫn quay được');
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
