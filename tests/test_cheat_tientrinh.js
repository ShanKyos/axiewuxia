// Cheat console phải mở được NỘI DUNG HẬU KỲ, không chỉ sức mạnh.
//
// Lỗi gốc: /max hứa "mọi thứ tối đa" nhưng chỉ đụng cổng SỨC MẠNH (cấp, đồ, chiêu). Gần như toàn
// bộ nội dung cuối game lại khoá sau cổng TIẾN TRÌNH — mapGate() tra `questIdx`, masteryOpen() tra
// `player.mongChiTon`, Cổng Vực tra `player.bossKills`. Nên /max cho ra một nhân vật cấp 120 đứng
// ở nhiệm vụ 1: bảng Đại Thành hiện tab mà bấm vào vẫn khoá, năm map cuối vẫn "???".
//
// Bài kiểm gác đúng chỗ đó: sau mỗi lệnh, hỏi thẳng chính hàm cổng (mapGate, masteryOpen, lvPeak)
// chứ không tin vào dòng log lệnh in ra.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8871';
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  // 1. /max trước đây để nhân vật cấp 120 đứng ở nhiệm vụ 1
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    cheatExec('/max');
    const khoa = [];
    for (const m in MAPS) if (!MAPS[m].dungeon && !mapGate(m).ok) khoa.push(m);
    return { lv:player.level, peak:lvPeak(), q:questIdx, tong:QUESTS.length,
             dt:masteryOpen(), mpts:player.mpts, khoa, an:Object.keys(player.bossKills||{}).length };
  });
  console.log('1) /max:', JSON.stringify(r1));
  if (r1.q !== r1.tong) fail(`/max để chính tuyến ở ${r1.q}/${r1.tong}`); else pass(`/max xong chính tuyến ${r1.q}/${r1.tong}`);
  if (!r1.dt) fail('/max chưa mở được bảng Đại Thành'); else pass(`bảng Đại Thành mở, ${r1.mpts} điểm`);
  if (r1.khoa.length) fail('còn map bị khoá sau /max: ' + r1.khoa.join(',')); else pass('mọi map ngoài trời vào được');
  if (r1.peak < 120) fail('lvPeak chưa tới 120'); else pass('cấp đỉnh ' + r1.peak);
  if (!r1.an) fail('chưa phá phong ấn map nào'); else pass(`phá phong ấn ${r1.an} map`);

  // 2. /quest <n> nhảy đúng chương và kéo cấp theo
  const r2 = await p.evaluate(() => {
    startGame('thieulam', null);
    cheatExec('/quest 28');
    const q = QUESTS[questIdx];
    return { q:questIdx+1, lv:player.level, req:q.lv, ten:q.name, xong:!!player.mongChiTon,
             vaoDuoc: mapGate('mongco').ok };
  });
  console.log('2) /quest 28:', JSON.stringify(r2));
  if (r2.q !== 28) fail('/quest 28 không nhảy đúng'); else pass(`/quest 28 → ${r2.ten}`);
  if (r2.lv < r2.req) fail(`cấp ${r2.lv} thấp hơn yêu cầu ${r2.req}`); else pass(`cấp kéo theo lên ${r2.lv}`);
  if (r2.xong) fail('/quest <n> không được đánh dấu xong chính tuyến'); else pass('chưa đánh dấu xong chính tuyến');
  if (!r2.vaoDuoc) fail('chương VI mà chưa vào được Ashen Steppe'); else pass('vào được map của chương đó');

  // 3. /mo giữ nguyên sức mạnh, chỉ mở cổng
  const r3 = await p.evaluate(() => {
    startGame('thieulam', null);
    const atk0 = player.atk; cheatExec('/mo');
    return { atk0, atk1:player.atk, q:questIdx, dt:masteryOpen() };
  });
  console.log('3) /mo:', JSON.stringify(r3));
  if (r3.atk1 !== r3.atk0) fail('/mo không được đụng vào sức mạnh'); else pass('/mo giữ nguyên Công Kích');
  if (r3.q !== r1.tong || !r3.dt) fail('/mo chưa mở hết cổng'); else pass('/mo mở hết cổng tiến trình');

  // 4. /taisinh cộng đúng % và điểm
  const r4 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 120; calcDerived();
    const a0 = player.atk; cheatExec('/taisinh 5');
    return { a0, a1:player.atk, rc:player.resetCount, mpts:player.mpts };
  });
  console.log('4) /taisinh 5:', JSON.stringify(r4));
  if (r4.rc !== 5) fail('resetCount sai'); else pass(`Tái Sinh ×5, Công ${r4.a0}→${r4.a1}, +${r4.mpts} điểm`);
  if (!(r4.a1 > r4.a0)) fail('Tái Sinh không cộng Công Kích');

  // 5. /tang nhảy tầng, và không treo
  const r5 = await p.evaluate(() => {
    startGame('thieulam', null); cheatExec('/max');
    const t0 = Date.now(); cheatExec('/tang 12');
    return { tang: DEEP ? DEEP.floor : 0, ms: Date.now() - t0 };
  });
  console.log('5) /tang 12:', JSON.stringify(r5));
  if (r5.tang !== 12) fail('/tang không tới đúng tầng, đo được ' + r5.tang); else pass('/tang 12 tới tầng 12');
  if (r5.ms > 8000) fail('/tang chạy quá lâu (' + r5.ms + 'ms)'); else pass('/tang không treo (' + r5.ms + 'ms)');

  // 6. /boss reset dựng lại Vệ Binh Trụ
  const r6 = await p.evaluate(() => {
    startGame('thieulam', null); cheatExec('/max'); travelTo('daohoa');
    const dau = mobs.filter(m => m.def && m.def.bossKind === 'thuve').length;
    mobs = mobs.filter(m => !(m.def && m.def.bossKind));   // giả lập "đã hạ sạch"
    const truoc = mobs.filter(m => m.def && m.def.bossKind === 'thuve').length;
    cheatExec('/boss reset');
    return { dau, truoc, sau: mobs.filter(m => m.def && m.def.bossKind === 'thuve').length,
             conAn: !!(player.bossKills && player.bossKills.daohoa) };
  });
  console.log('6) /boss reset:', JSON.stringify(r6));
  if (r6.conAn) fail('/boss reset không xoá được dấu đã hạ');
  else if (!(r6.sau > r6.truoc)) fail(`Vệ Binh Trụ không sống lại (${r6.truoc}→${r6.sau})`);
  else pass(`/boss reset: ${r6.truoc}→${r6.sau} Vệ Binh Trụ`);

  // 7. /help và /chuong không nổ
  const r7 = await p.evaluate(() => {
    startGame('thieulam', null);
    cheatExec('/help'); cheatExec('/chuong'); cheatExec('/quest all');
    return { q:questIdx, tong:QUESTS.length };
  });
  if (r7.q !== r7.tong) fail('/quest all không xong hết'); else pass('/quest all xong ' + r7.q + ' nhiệm vụ');

  console.log('errors:', JSON.stringify(errs.slice(0,5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  console.log(bad ? 'FAILED ' + bad : 'PASS');
  await b.close(); process.exit(bad ? 1 : 0);
})();
