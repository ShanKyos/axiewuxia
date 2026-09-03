// Gộp tiền tệ bậc 4: Tâm Đắc nhập vào Instinct.
//
// Tâm Đắc có ĐÚNG một nguồn (hạ tinh anh/boss) và ĐÚNG một chỗ tiêu (sáu cấp mốc của chiêu) —
// cùng hình dạng với Công Huân Lệnh đã gộp ở bậc 1. Tệ hơn: nó nằm chung MỘT nút bấm với bạc và
// Instinct, nên người chơi phải soi ba ô đếm mới hiểu vì sao nút xám.
//
// Cái dễ mất khi gộp là SỨC ÉP thiết kế: Tâm Đắc bắt người chơi đi săn tinh anh/boss, còn Instinct
// trước đây rơi 10 đều cho mọi con nên chỉ là hàm của thời gian. Bài này gác cả hai vế:
//   - cấp mốc phải đắt hơn hẳn cấp thường (bậc thang ×2…×7 đúng như 1💠…6💠 cũ)
//   - boss/tinh anh phải cho nhiều Instinct hơn quái thường, nếu không sức ép đó biến mất thật
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

  // 1) save cũ có Tâm Đắc → quy sang Instinct, không mất giá trị
  const r1 = await p.evaluate(() => {
    player.khi = 500; saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save'));
    // v4: save chứa NĂM ô nhân vật; nhân vật đang chơi nằm trong slots[active], không còn ở gốc.
    const O = raw.slots[raw.active];
    O.player.khi = 500; O.player.tamdac = 7;
    localStorage.setItem('vlcm_save', JSON.stringify(raw));
    loadGame();
    return { khi: player.khi, con: 'tamdac' in player, gia: GO_TAMDAC };
  });
  console.log('1) quy đổi save cũ:', JSON.stringify(r1), '· mong', 500 + 7*4000);
  if (r1.khi !== 500 + 7*r1.gia) fail(`Instinct ${r1.khi}, phải ${500 + 7*r1.gia}`);
  if (r1.con) fail('ô đếm tamdac chưa xoá khỏi player');

  // 2) bậc thang cấp mốc: mốc thứ n tốn (n+1) lần phí nền
  const r2 = await p.evaluate(() => {
    const id = 'a'; player.skillLv = player.skillLv || {};
    const nen = (lv) => Math.round(30 * Math.pow(lv, 1.1));
    const o = [];
    for (const ms of [20, 40, 60, 80, 100, 120]){
      player.skillLv[id] = ms - 1;
      o.push({ moc: ms, phi: skUpKhi(id), nen: nen(ms - 1), lan: +(skUpKhi(id) / nen(ms - 1)).toFixed(2) });
    }
    player.skillLv[id] = 30;                         // cấp thường giữa hai mốc
    const thuong = { phi: skUpKhi(id), nen: nen(30), lan: +(skUpKhi(id) / nen(30)).toFixed(2) };
    return { o, thuong };
  });
  console.log('2) bậc thang cấp mốc:');
  for (const x of r2.o) console.log('   ', JSON.stringify(x));
  console.log('    cấp thường:', JSON.stringify(r2.thuong));
  const mongLan = [2, 3, 4, 5, 6, 7];
  r2.o.forEach((x, i) => { if (Math.abs(x.lan - mongLan[i]) > 0.02) fail(`mốc ${x.moc} nhân ${x.lan}, phải ×${mongLan[i]}`); });
  if (Math.abs(r2.thuong.lan - 1) > 0.02) fail('cấp thường cũng bị nhân — không còn là bậc thang');

  // 3) cấp mốc phải nâng được khi đủ Instinct, và trừ đúng
  const r3 = await p.evaluate(() => {
    const id = 'a'; player.level = 120; player.skillLv[id] = 19;   // cấp kế là 20 = mốc đầu
    const can = skUpKhi(id), canBac = skUpCost(id);
    player.khi = can - 1; player.silver = canBac * 10;
    upgradeSkillUI(id);
    const thieu = { lv: skLv(id), khi: player.khi };
    player.khi = can;
    upgradeSkillUI(id);
    return { can, thieu, du: { lv: skLv(id), khi: Math.round(player.khi) } };
  });
  console.log('3) nâng qua mốc:', JSON.stringify(r3));
  if (r3.thieu.lv !== 19) fail('thiếu 1 Instinct mà vẫn nâng được');
  if (r3.thieu.khi !== r3.can - 1) fail('nâng hụt vẫn trừ Instinct');
  if (r3.du.lv !== 20) fail('đủ Instinct mà không nâng được');
  if (r3.du.khi !== 0) fail(`trừ sai: còn ${r3.du.khi}, phải 0`);

  // 4) sức ép săn boss: Instinct rơi theo loại quái, không còn 10 đều
  const r4 = await p.evaluate(() => {
    const lam = (def) => computeKillRewards({ x:0, y:0, def, type: def.boss ? 'boss' : 'mob' }, null, player, () => 0.99).khi;
    return { thuong: lam({ lv:10, el:'Kim', silver:[10,10], xp:100 }),
             tinhAnh: lam({ lv:10, el:'Kim', silver:[10,10], xp:100, elite:true }),
             boss:    lam({ lv:10, el:'Kim', silver:[10,10], xp:100, boss:true, elite:true }),
             bossPB:  lam({ lv:10, el:'Kim', silver:[10,10], xp:100, boss:true, elite:true, bossKind:'dgn' }) };
  });
  console.log('4) Instinct theo loại quái:', JSON.stringify(r4));
  if (!(r4.tinhAnh > r4.thuong)) fail('tinh anh không hơn quái thường — sức ép săn boss mất hẳn');
  if (!(r4.boss > r4.tinhAnh)) fail('boss không hơn tinh anh');
  if (!(r4.bossPB > r4.boss)) fail('boss phó bản không hơn boss ngoài map');

  // 5) không còn chữ Tâm Đắc / ô đếm 💠 trong bảng kỹ năng
  const r5 = await p.evaluate(() => {
    renderSkillPanel();
    const h = el('panel-skill').innerHTML;
    return { chu: /Tâm Đắc/.test(h), ngoc: /💠/.test(h) };
  });
  console.log('5) bảng kỹ năng:', JSON.stringify(r5));
  if (r5.chu) fail('vẫn còn chữ "Tâm Đắc" trong bảng kỹ năng');
  if (r5.ngoc) fail('vẫn còn ô đếm 💠');

  await p.waitForTimeout(500);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
