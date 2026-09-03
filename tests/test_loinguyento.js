// Gộp tiền tệ bậc 3: NĂM ô đếm Lõi Nguyên Tố (Kim/Mộc/Thổ/Thủy/Hỏa) về MỘT.
//
// Vì sao gộp được: năm ô đó vốn đã làm việc của một. Chỗ tiêu duy nhất là nâng Thần Binh, mà
// tbConsumeNoidan() chỉ trừ dần từ hệ nào đang có nhiều nhất — không hề đòi đúng hệ. Chỗ DUY NHẤT
// hệ có nghĩa là lúc hấp thụ lấy chỉ số vĩnh viễn, và ở đó nó quyết hộ người chơi: muốn +công thì
// phải đi tìm quái hệ Kim. Nay khoá theo CHỈ SỐ, người chơi tự chọn. Cùng năm lựa chọn, một ô đếm.
//
// Bài này gác ba điều dễ hỏng nhất:
//   1. Save cũ dạng object phải quy về số ĐÚNG 1:1 — không ai mất viên nào.
//   2. Hấp thụ phải cho ĐÚNG chỉ số người chơi bấm, không phải chỉ số con quái vừa chết.
//   3. Nâng Thần Binh vẫn trừ đúng số lõi.
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

  // 1) save cũ dạng object → số, tổng phải khớp
  const r1 = await p.evaluate(() => {
    saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save'));
    // v4: save chứa NĂM ô nhân vật; nhân vật đang chơi nằm trong slots[active], không còn ở gốc.
    const O = raw.slots[raw.active];
    O.player.noidan = { Kim:3, 'Mộc':1, 'Thổ':0, 'Thủy':7, 'Hỏa':2 };
    localStorage.setItem('vlcm_save', JSON.stringify(raw));
    loadGame();
    return { kieu: typeof player.noidan, so: player.noidan };
  });
  console.log('1) save cũ đổi dạng:', JSON.stringify(r1), '· mong 13');
  if (r1.kieu !== 'number') fail('noidan còn là ' + r1.kieu);
  if (r1.so !== 13) fail(`gộp ra ${r1.so}, phải 13 (3+1+0+7+2)`);

  // 2) hấp thụ cho đúng chỉ số ĐƯỢC CHỌN, không phải hệ nào cả
  const r2 = await p.evaluate(() => {
    player.noidan = 10; player.ndDay = ''; player.ndCount = 0;
    player.ndBonus = { atk:0, hp:0, def:0, qi:0, crit:0 };
    const truoc = JSON.parse(JSON.stringify(player.ndBonus));
    swallowNoidan('def');                       // người chơi chọn phòng ngự
    const sau = JSON.parse(JSON.stringify(player.ndBonus));
    return { truoc, sau, conLai: player.noidan, daDung: player.ndCount };
  });
  console.log('2) chọn chỉ số:', JSON.stringify(r2));
  if (r2.sau.def <= 0) fail('bấm "def" mà phòng ngự không tăng');
  if (r2.sau.atk !== 0 || r2.sau.hp !== 0 || r2.sau.qi !== 0 || r2.sau.crit !== 0)
    fail('bấm "def" lại cộng cả chỉ số khác: ' + JSON.stringify(r2.sau));
  if (r2.conLai !== 9) fail(`trừ sai: còn ${r2.conLai}, phải 9`);

  // ...và một chỉ số khác cho ra một chỉ số khác — bảng thật sự khoá theo chỉ số
  const r2b = await p.evaluate(() => {
    swallowNoidan('crit');
    return { crit: player.ndBonus.crit, def: player.ndBonus.def, conLai: player.noidan };
  });
  console.log('   chọn tiếp "crit":', JSON.stringify(r2b));
  if (r2b.crit <= 0) fail('bấm "crit" mà chí mạng không tăng');
  if (r2b.conLai !== 8) fail(`trừ sai lần 2: còn ${r2b.conLai}`);

  // 3) trần 3 viên/ngày vẫn giữ
  const r3 = await p.evaluate(() => {
    swallowNoidan('atk');                        // viên thứ 3
    const sau3 = player.noidan, atk3 = player.ndBonus.atk;
    swallowNoidan('atk');                        // viên thứ 4 — phải bị chặn
    return { sau3, atk3, sau4: player.noidan, atk4: player.ndBonus.atk, dem: player.ndCount };
  });
  console.log('3) trần 3 viên/ngày:', JSON.stringify(r3));
  if (r3.sau4 !== r3.sau3) fail('viên thứ 4 vẫn bị tiêu');
  if (r3.atk4 !== r3.atk3) fail('viên thứ 4 vẫn cộng chỉ số');

  // 4) nâng Thần Binh vẫn trừ đúng
  const r4 = await p.evaluate(() => {
    player.noidan = 50; player.mat = 500; player.thanbinh = { tier: 1 };
    const c = tbCost(1);
    const truoc = player.noidan;
    upgradeThanBinh();
    return { can: c.noidan, truoc, sau: player.noidan, tang: player.thanbinh.tier };
  });
  console.log('4) nâng Thần Binh:', JSON.stringify(r4));
  if (r4.tang !== 2) fail('không nâng được tầng');
  if (r4.truoc - r4.sau !== r4.can) fail(`trừ ${r4.truoc - r4.sau} lõi, phải ${r4.can}`);

  // 5) UI túi đồ: một ô đếm + năm nút chỉ số, không còn dòng theo hệ
  const r5 = await p.evaluate(() => {
    player.noidan = 4; window.bagTab = 'box'; renderBag();
    const h = el('panel-bag').innerHTML;
    const stats = ['atk','hp','def','qi','crit'].filter(s => h.includes(`swallowNoidan('${s}')`));
    const els   = ['Kim','Mộc','Thổ','Thủy','Hỏa'].filter(e => h.includes(`swallowNoidan('${e}')`));
    return { stats, els, coSoDem: /có 4/.test(h) };
  });
  console.log('5) UI túi đồ:', JSON.stringify(r5));
  if (r5.stats.length !== 5) fail('thiếu nút chỉ số: ' + JSON.stringify(r5.stats));
  if (r5.els.length) fail('vẫn còn nút theo hệ: ' + JSON.stringify(r5.els));
  if (!r5.coSoDem) fail('không hiện số lõi đang có');

  await p.waitForTimeout(500);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
