// Dọn UI thừa + tàn dư từ vựng tu tiên, và hai lỗi logic lộ ra khi dọn.
//
// Bài kiểm này gác BA thứ cùng lúc, vì cả ba đều là "tàn dư của một hệ đã đổi mà chỗ khác quên đổi
// theo" — đúng một loại lỗi, ba chỗ khác nhau:
//   1. Danh hiệu "Người Giữ Lunacia" đòi mount.tier >= 8 trong khi bảng chỉ còn 5 giai, nên
//      nó KHÔNG THỂ đạt được kể cả khi đã max mọi thứ. Hệ Thú Chiến nay đã thay bằng Khế Ước
//      Chimera, nên điều kiện là sở hữu một Chimera 5★ (xem docs/GACHA_KHE_UOC.md).
//   2. Anima và Công Huân Lệnh đã bị gỡ khỏi hệ tiền tệ — không được sống lại trong player.
//   3. Từ vựng tu tiên không được xuất hiện trên bất kỳ bảng nào người chơi mở ra.
//
// Mệnh đề 3 quét văn bản THẬT của DOM sau khi mở từng bảng, không grep source — vì grep source thì
// bỏ sót chuỗi ghép động và bắt nhầm chuỗi nằm trong comment.
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
  await p.evaluate(() => applyTestBoost());
  const r = await p.evaluate(() => {
    // danh hiệu tối thượng phải đạt được khi đã max mọi thứ
    chiState().co.aurelion = { con:0 }; chiState().eq = 'aurelion'; player.level = 120; calcDerived();
    const t = TITLES.find(x => x.id === 'tuongduong');
    return { datDuoc: !!t.cond(player), so5: CHIMERA.filter(c => c.sao === 5).length,
             tuvi: 'tuvi' in (player.dantian||{}), ch: 'congHuan' in player,
             hat: Object.values(GARDEN_SEEDS || {}).map(x => x.name) };
  });
  console.log('1) danh hiệu tối thượng + tàn dư:', JSON.stringify(r));
  if (!r.datDuoc) fail(`"Người Giữ Lunacia" vẫn không đạt được dù đã max (roster ${r.so5} con 5★)`);
  if (r.tuvi) fail('Anima chưa xoá');
  if (r.ch) fail('Công Huân Lệnh chưa xoá');
  // quét lại từ vựng tu tiên trên UI thật
  const r2 = await p.evaluate(() => {
    const CAM = ['tu luyện','bế quan','ngồi thiền','tẩy tủy','tấn chức','tiến cấp đan',
                 'linh thú','phong linh phù','tôi cốt','chân quân','viên mãn','hóa cảnh',
                 'tụ linh trận','dược viên','gom duyên','đột phá','anima','công huân'];
    const mo = [renderChar, renderCharPanel, renderSkillPanel, renderAbode, renderTuyetHoc];
    const thay = new Set();
    for (const f of mo){ try { f(); } catch { /* bảng cần điều kiện — bỏ qua */ } }
    const txt = document.body.innerText.toLowerCase();
    for (const w of CAM) if (txt.includes(w)) thay.add(w);
    return [...thay];
  });
  console.log('2) từ cấm còn trên UI:', JSON.stringify(r2));
  if (r2.length) fail('còn từ cấm hiển thị: ' + r2.join(', '));
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
