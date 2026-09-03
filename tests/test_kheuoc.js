// Khế Ước Chimera — gacha thay hẳn hệ Thú Chiến. Thiết kế: docs/GACHA_KHE_UOC.md
//
// Bốn thứ phải gác, và cả bốn đều là chỗ một hệ gacha dễ hỏng nhất:
//
//  1. TỈ LỆ SAI. Cả hệ đứng trên một đường cong; lệch ở đây thì mọi con số in cho người chơi đọc
//     đều là nói dối. Mục 1 quay 200.000 lượt rồi đối chiếu với đúng bảng đã công bố trong tài
//     liệu (5★ gộp pity 1,6% · 4★ 13,0% · trung bình 62 lượt/5★ · 93 lượt/5★ đang lên kệ).
//  2. PITY MẤT KHI TẢI LẠI. Người chơi quay 89 lượt rồi F5 mà bộ đếm về 0 là lỗi không bao giờ
//     được phép xảy ra. Mục 3 lưu rồi nạp lại và so từng con số.
//  3. BẢO ĐẢM KHÔNG BẢO ĐẢM. 50/50 thua thì lần 5★ sau PHẢI là con đang lên kệ, và trần 180 lượt
//     phải đúng nghĩa trần. Mục 2 chạy 20.000 lượt quay tới khi ra con lên kệ, xem lượt xấu nhất.
//  4. THAY HỆ MÀ LÀM MẤT TIẾN TRÌNH. Save đời Thú Chiến phải đổi thành Chimera tương ứng chứ
//     không mất trắng — mục 4 nạp một save giai 3 rồi kiểm.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  // ── 1+2. tỉ lệ, pity, 50/50, trần 180 ──
  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null); player.traits = [];
    player.level = 60; player.lvPeak = 60; calcDerived();
    const C = chiState(); C.ve.gk = 9e9;
    const N = 200000;
    let n5 = 0, n4 = 0, last = 0, lastF = 0, gap = [], gapF = [], quaHan = 0;
    for (let i = 1; i <= N; i++){
      const x = gachaMotLuot('gk');
      if (x.sao === 5){ n5++; gap.push(i - last); last = i;
        if (x.id === gachaKe()){ const g = i - lastF; gapF.push(g); lastF = i; if (g > 180) quaHan++; } }
      if (x.sao === 4) n4++;
    }
    const tb = a => a.reduce((x,y)=>x+y,0)/a.length;
    return { p5:+(n5/N*100).toFixed(3), p4:+(n4/N*100).toFixed(2),
             tb5:+tb(gap).toFixed(1), tbF:+tb(gapF).toFixed(1),
             max5:Math.max(...gap), maxF:Math.max(...gapF), quaHan,
             soChimera: CHIMERA.length, so5: CHIMERA.filter(c=>c.sao===5).length };
  });
  console.log('1) tỉ lệ:', JSON.stringify(r));
  if (Math.abs(r.p5 - 1.6) > 0.08) fail(`5★ gộp pity ${r.p5}% — tài liệu ghi 1,6%`);
  else pass(`5★ gộp pity ${r.p5}% (tài liệu 1,6%)`);
  if (Math.abs(r.p4 - 13.0) > 0.5) fail(`4★ gộp pity ${r.p4}% — tài liệu ghi 13,0%`);
  else pass(`4★ gộp pity ${r.p4}% (tài liệu 13,0%)`);
  if (Math.abs(r.tb5 - 62) > 3) fail(`trung bình ${r.tb5} lượt/5★ — tài liệu ghi 62`); else pass(`trung bình ${r.tb5} lượt ra một con 5★`);
  if (Math.abs(r.tbF - 93) > 5) fail(`trung bình ${r.tbF} lượt/5★ lên kệ — tài liệu ghi 93`); else pass(`trung bình ${r.tbF} lượt ra con đang lên kệ`);
  if (r.max5 > 90) fail(`có lần phải quay ${r.max5} lượt mới ra 5★ — hard pity là 90`); else pass(`lượt xấu nhất tới 5★: ${r.max5} (trần 90)`);
  if (r.quaHan) fail(`${r.quaHan} lần cần hơn 180 lượt mới ra con lên kệ — trần 180 bị vỡ`);
  else pass(`trần 180 lượt đứng vững: lượt xấu nhất ${r.maxF}`);
  if (r.soChimera !== 16 || r.so5 !== 6) fail(`roster ${r.soChimera} con (${r.so5} con 5★) — thiết kế là 16 (6 con 5★)`);
  else pass('roster 16 Chimera, 6 con 5★');

  // ── 3. bảo đảm + pity sống qua reload ──
  const r3 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60;
    const C = chiState(); C.ve.gk = 500;
    // quay tới khi thua 50/50 → phải bật cờ bảo đảm
    let bd = false, tries = 0;
    while (!bd && tries < 400){ const x = gachaMotLuot('gk'); tries++; if (x.sao === 5) bd = C.bd; }
    const truoc = { p5:C.pity5, p4:C.pity4, bd:C.bd, gk:C.ve.gk, co:Object.keys(C.co).length };
    // lần 5★ kế tiếp có đúng là con đang lên kệ không
    let ke = null;
    for (let i = 0; i < 200 && !ke; i++){ const x = gachaMotLuot('gk'); if (x.sao === 5) ke = x.id; }
    const dungKe = ke === gachaKe();
    // lưu rồi nạp lại
    C.pity5 = 41; C.pity4 = 6; C.bd = true; C.ve.gk = 77;
    saveGame();
    const ok = loadGame();
    const C2 = chiState();
    return { truoc, dungKe, loadOk:ok,
             sau: { p5:C2.pity5, p4:C2.pity4, bd:C2.bd, gk:C2.ve.gk } };
  });
  console.log('3) bảo đảm + reload:', JSON.stringify(r3));
  if (!r3.truoc.bd) fail('thua 50/50 mà không bật cờ bảo đảm');
  if (!r3.dungKe) fail('đang được bảo đảm mà lần 5★ kế tiếp KHÔNG phải con đang lên kệ');
  else pass('thua 50/50 → lần 5★ kế tiếp chắc chắn là con đang lên kệ');
  const S = r3.sau;
  if (!(S.p5 === 41 && S.p4 === 6 && S.bd === true && S.gk === 77))
    fail(`pity không sống qua reload: ${JSON.stringify(S)}`);
  else pass('pity + cờ bảo đảm + số vé sống nguyên qua lưu/nạp');

  // ── 4. save đời Thú Chiến đổi sang Chimera, không mất trắng ──
  const r4 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60;
    const saved = JSON.parse(JSON.stringify(player));
    delete saved.chimera;
    saved.mount = { tier: 3, out: true };            // save đời cũ: đã nuôi tới giai 3
    saved.mountPity = 16;
    // Dựng save ĐỜI CŨ (một nhân vật ở gốc doc) — đó chính là thứ bài này kiểm: đường vá từ
    // Thú Chiến sang Chimera phải chạy được trên save cũ. Ghi ở mốc SAVE_COMPAT chứ không
    // phải SAVE_VERSION: dạng hiện tại không có trường `player` ở gốc nữa.
    localStorage.setItem('vlcm_save', JSON.stringify({ v:SAVE_COMPAT, player:saved, curMap, sideStates, savedAt:Date.now() }));
    const ok = loadGame();
    const C = chiState();
    return { ok, co:Object.keys(C.co), eq:C.eq, ve:C.ve.gk, conMount:!!player.mount };
  });
  console.log('4) đổi save Thú Chiến:', JSON.stringify(r4));
  if (!r4.ok) fail('không nạp được save đời Thú Chiến');
  if (r4.co.length !== 3) fail(`giai 3 phải đổi thành 3 Chimera, đo được ${r4.co.length}: ${r4.co}`);
  else pass(`save giai 3 → nhận đúng 3 Chimera (${r4.co.join(', ')}), đang dùng ${r4.eq}`);
  if (!(r4.ve >= 12)) fail(`không bù vé cho bạc/Huyền Thiết đã đổ vào (chỉ có ${r4.ve} Ấn)`);
  else pass(`bù ${r4.ve} Ấn Giao Kết cho tiến trình cũ`);
  if (r4.conMount) fail('player.mount cũ vẫn còn trong save sau khi chuyển đổi');

  // ── 5. bị động nối vào chỉ số, Huyết Thống dày thêm, đổi con thì đổi chỉ số ──
  const r5 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60;
    const C = chiState(); C.co = {}; C.eq = null; calcDerived();
    const hp0 = player.maxHp;
    C.co.tidewarden = { con:0 }; C.eq = 'tidewarden'; calcDerived(); const hp1 = player.maxHp;
    C.co.tidewarden.con = 5; calcDerived(); const hp2 = player.maxHp;
    C.eq = 'crimsonmaw'; C.co.crimsonmaw = { con:0 }; calcDerived(); const atk1 = player.atk;
    C.eq = null; calcDerived(); const atk0 = player.atk;
    return { hp0, hp1, hp2, atk0, atk1 };
  });
  console.log('5) bị động:', JSON.stringify(r5));
  if (!(r5.hp1 > r5.hp0)) fail('bị động Tidewarden (+15% HP) không nối vào chỉ số');
  else if (!(r5.hp2 > r5.hp1)) fail('Huyết Thống C5 không làm bị động dày thêm');
  else if (!(r5.atk1 > r5.atk0)) fail('đổi sang Crimsonmaw (+5% Công Kích) mà Công Kích không đổi');
  else pass(`bị động chạy thật: HP ${r5.hp0}→${r5.hp1}→${r5.hp2} (C0→C5) · đổi con thì Công Kích ${r5.atk0}→${r5.atk1}`);

  // ── 6. quay thật qua UI: trừ vé, hiện lớp phủ, thế giới DỪNG trong lúc quay ──
  await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60; calcDerived();
    chiState().ve.gk = 30; openKheUoc();
  });
  await p.waitForTimeout(300);
  const r6a = await p.evaluate(() => ({
    banner: !el('panel-quest').classList.contains('hidden'),
    coTiLe: /0,6%/.test(el('panel-quest').innerHTML),
    coTran: /180/.test(el('panel-quest').innerHTML) }));
  await p.evaluate(() => { window._hpTruoc = player.hp; window.kheUocQuay('gk', 10); });
  await p.waitForTimeout(1500);
  const r6b = await p.evaluate(() => ({
    phu: !document.getElementById('gacha-wrap').classList.contains('hidden'),
    ve: chiState().ve.gk }));
  await p.waitForTimeout(2500);
  const r6c = await p.evaluate(() => ({ hpGiu: player.hp === window._hpTruoc }));
  await p.evaluate(() => { kuBoQua(); });
  await p.waitForTimeout(2500);
  const r6d = await p.evaluate(() => ({
    phuTat: document.getElementById('gacha-wrap').classList.contains('hidden'),
    co: Object.keys(chiState().co).length }));
  console.log('6) UI:', JSON.stringify({ ...r6a, ...r6b, ...r6c, ...r6d }));
  if (!r6a.banner) fail('openKheUoc không mở được màn Khế Ước');
  else if (!r6a.coTiLe || !r6a.coTran) fail('màn Khế Ước không in tỉ lệ / trần 180 lượt');
  else pass('màn Khế Ước mở được, có in tỉ lệ và trần 180 lượt');
  if (!r6b.phu) fail('quay mà lớp phủ hoạt ảnh không hiện');
  else if (r6b.ve !== 20) fail(`quay ×10 mà số vé còn ${r6b.ve}, phải còn 20`);
  else pass('quay ×10: trừ đúng 10 vé, lớp phủ hoạt ảnh hiện lên');
  if (!r6c.hpGiu) fail('thế giới vẫn chạy trong lúc quay — nhân vật đứng hứng đòn suốt hoạt ảnh');
  else pass('thế giới dừng trong lúc quay, nhân vật không ăn đòn');
  if (!r6d.phuTat) fail('bỏ qua hoạt ảnh mà lớp phủ không tắt');
  else if (!r6d.co) fail('quay ×10 xong mà không nhận được con nào');
  else pass(`bỏ qua được hoạt ảnh; nhận ${r6d.co} Chimera`);

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) bad++;
  console.log(bad ? `FAIL(${bad})` : 'PASS');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
