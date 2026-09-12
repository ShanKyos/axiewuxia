// PHỤ TUYẾN — 32 mục / 10 map. Bài này gác ba thứ mà bản 9-mục trước đã hỏng IM LẶNG cả ba:
//
//   1. thiếu `map:` ⇒ tab Phụ Tuyến trong Nhật Ký TRỐNG TRƠN (bảng lọc theo đúng khoá đó);
//   2. `herbMap` không ai đọc ⇒ nhiệm vụ bảo hái ở Lối Mòn mà hái ở bãi ngoài cổng thành cũng tính;
//   3. bốn map có sẵn `HERB_SPOTS` nhưng thiếu cờ `herbs` ⇒ không bụi nào mọc ở đúng chỗ được chỉ.
//
// Không cái nào ném lỗi, không cái nào làm đỏ bài kiểm cũ. Nên mục 2-4 dưới đây LÁI BẰNG HÀM
// THẬT của game (acceptSide · pickHerb · sideOnKill · mocTick · turnInSide) chứ không đọc dữ liệu
// rồi tự kết luận — chỗ hỏng nằm ở sợi dây nối, không nằm ở bảng.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(500);

  let bad = 0;
  const fail = m => { bad++; console.log('  ✗ ' + m); };
  const pass = m => console.log('  ✓ ' + m);

  // ── 1) hình dạng bảng ─────────────────────────────────────────────────────────────
  const r1 = await p.evaluate(() => {
    const S = SIDE_QUESTS, loai = {};
    for (const q of S) loai[q.type] = (loai[q.type] || 0) + 1;
    const DANH = ['kill','tranai'];
    const killTheoMap = {};
    for (const q of S) if (q.type === 'kill') killTheoMap[q.map] = (killTheoMap[q.map] || 0) + 1;
    return {
      n: S.length, loai,
      thieuMap: S.filter(q => !q.map || !MAPS[q.map]).map(q => q.id),
      mapLa:    S.filter(q => q.map && !MAPS[q.map]).map(q => q.id),
      danh: S.filter(q => DANH.includes(q.type)).length,
      killQuaMot: Object.keys(killTheoMap).filter(k => killTheoMap[k] > 1),
      soMap: [...new Set(S.map(q => q.map))].length,
      // mỗi mục phải có ĐÍCH đi được — nếu không thì nút 🧭 là một cái nút chết
      khongDich: S.filter(q => !sideQuestTarget(q)).map(q => q.id),
    };
  });
  console.log('1) bảng:', JSON.stringify(r1.loai), '·', r1.n, 'mục /', r1.soMap, 'map');
  if (r1.thieuMap.length) fail(`thiếu hoặc sai \`map:\` — tab Phụ Tuyến sẽ không hiện: ${r1.thieuMap.join(', ')}`);
  else pass('mọi mục đều khai `map` trỏ tới một map có thật');
  const tiLe = Math.round(r1.danh * 100 / r1.n);
  if (tiLe > 50) fail(`${tiLe}% là nhiệm vụ đánh (trần 50%) — đang đi lại vết bộ 66 mục đời trước`);
  else pass(`đánh nhau ${r1.danh}/${r1.n} = ${tiLe}%`);
  if (r1.killQuaMot.length) fail(`map có quá MỘT mục "diệt N con": ${r1.killQuaMot.join(', ')}`);
  else pass('mỗi map đúng một mục `kill`');
  if (r1.khongDich.length) fail(`nút 🧭 không có đích: ${r1.khongDich.join(', ')}`);
  else pass('mọi mục đều có đích cho nút chỉ đường');

  // ── 2) cửa map của `collect` là THẬT ─────────────────────────────────────────────
  // Hái ở map KHÁC không được tính; hái ở đúng map thì tính. Lái bằng pickHerb() thật.
  const r2 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const sq = SIDE_QUESTS.find(q => q.type === 'collect' && q.herbMap && q.herbMap !== 'corran');
    if (!sq) return { boQua:'không có mục collect nào trỏ ra ngoài corran' };
    player.level = 120; player.lvPeak = 120; questIdx = QUESTS.length - 1;
    sideStates = {}; acceptSide(sq.id);
    const hai = (mid) => {
      travelTo(mid);
      // đặt người chơi ngay cạnh một bụi rồi gọi đúng hàm hái của game
      const h = (HERB_SPOTS[mid] || [])[0]; if (!h) return 'map không có bụi nào';
      pickups.length = 0; pickups.push({ type:'herb', x:h.x, y:h.y, respawn:0 });
      player.x = h.x; player.y = h.y;
      const truoc = sideStates[sq.id].prog;
      tryHarvestHerb();
      return sideStates[sq.id].prog - truoc;
    };
    const sai = hai('corran');          // map KHÁC
    const dung = hai(sq.herbMap);       // đúng map
    return { id:sq.id, herbMap:sq.herbMap, sai, dung, coBui: !!MAPS[sq.herbMap].herbs };
  });
  console.log('2) cửa map của collect:', JSON.stringify(r2));
  if (r2.boQua) console.log('  … bỏ qua:', r2.boQua);
  else {
    if (!r2.coBui) fail(`${r2.herbMap} thiếu cờ \`herbs\` — bụi thuốc không mọc, nhiệm vụ hái ở đó là hứa suông`);
    else pass(`${r2.herbMap} có bụi thuốc mọc thật`);
    if (r2.sai !== 0) fail(`hái ở map KHÁC vẫn cộng tiến độ (+${r2.sai}) — mô tả nói một đằng, máy đếm một nẻo`);
    else pass('hái ở map khác KHÔNG tính');
    if (r2.dung !== 1) fail(`hái ở đúng ${r2.herbMap} mà không cộng tiến độ (${r2.dung})`);
    else pass(`hái ở đúng ${r2.herbMap} có tính`);
  }

  // ── 3) `kill` cũng gác map, và `tranai` đếm được ──────────────────────────────────
  const r3 = await p.evaluate(() => {
    const sq = SIDE_QUESTS.find(q => q.type === 'kill');
    const tq = SIDE_QUESTS.find(q => q.type === 'tranai');
    const out = {};
    if (sq){
      // loài này có mặt ở nhiều map — đó chính là lý do cửa map phải thật
      const khacMap = Object.keys(MAPS).find(k => k !== sq.map && !MAPS[k].dungeon &&
        packsOf(k).some(x => x.mob === sq.mob));
      player.level = 120; player.lvPeak = 120; questIdx = QUESTS.length - 1;
      sideStates = {}; acceptSide(sq.id);
      const ban = (mid) => { travelTo(mid); const t = sideStates[sq.id].prog;
                             sideOnKill({ type:sq.mob, def:MOBS[sq.mob] }, 'hit');
                             return sideStates[sq.id].prog - t; };
      out.kill = { id:sq.id, mob:sq.mob, map:sq.map, khacMap,
                   sai: khacMap ? ban(khacMap) : null, dung: ban(sq.map) };
    }
    if (tq){
      sideStates = {}; acceptSide(tq.id); travelTo(tq.map);
      sideOnKill({ type:'x', def:{ bossKind:'tranai' } }, 'hit');
      out.tranai = { id:tq.id, map:tq.map, st:sideStates[tq.id].st, prog:sideStates[tq.id].prog };
    }
    return out;
  });
  console.log('3) kill/tranai:', JSON.stringify(r3));
  if (r3.kill){
    if (r3.kill.khacMap && r3.kill.sai !== 0) fail(`giết ${r3.kill.mob} ở ${r3.kill.khacMap} vẫn tính cho nhiệm vụ của ${r3.kill.map}`);
    else pass('`kill` chỉ đếm ở đúng map của nhiệm vụ');
    if (r3.kill.dung !== 1) fail('giết đúng loài ở đúng map mà không cộng tiến độ');
    else pass('`kill` đếm đúng ở map của nó');
  }
  if (r3.tranai){
    if (r3.tranai.st !== 'done') fail(`hạ Tướng Quân ở ${r3.tranai.map} mà mục \`tranai\` không xong (${r3.tranai.st})`);
    else pass(`\`tranai\` đếm được — hai con trùm không chương nào dẫn tới nay đã có người dẫn`);
  } else fail('không còn mục `tranai` nào — loimon/caungam lại thành trùm mồ côi');

  // ── 4) `moc` chạy qua mocTick, và turnInSide trao ĐỦ thưởng ──────────────────────
  const r4 = await p.evaluate(() => {
    const sq = SIDE_QUESTS.find(q => q.type === 'moc' && q.moc === 'ruong');
    if (!sq) return { boQua:'không có mục moc/ruong' };
    player.level = 120; player.lvPeak = 120; questIdx = QUESTS.length - 1;
    sideStates = {}; player.ruong = {}; acceptSide(sq.id);
    for (let i = 0; i < sq.need; i++) player.ruong['x:' + i] = 1;
    _mocT = 0; mocTick(1);
    const xong = sideStates[sq.id].st;
    // thưởng: gắn đủ bốn nhánh rồi trả, xem có nhánh nào câm không
    const rewCu = sq.rew;
    sq.rew = { xp:10, silver:100, item:'tay', ngoc:{ chucPhuc:2 }, gk:3,
               cot:{ dong:'bangvun', n:1, pham:'tinh' } };
    player.jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
    player.cotKho = []; player.inv = []; player.silver = 0;
    if (!player.chimera) chiState(); player.chimera.ve.gk = 0;
    const moTa = rewMoTa(sq.rew);
    turnInSide(sq.id);
    const ra = { xong, moTa,
      silver: player.silver, do: player.inv.length,
      ngoc: player.jewels.chucPhuc, cot: player.cotKho.length, gk: player.chimera.ve.gk };
    sq.rew = rewCu;
    return ra;
  });
  console.log('4) moc + thưởng:', JSON.stringify(r4));
  if (r4.boQua) console.log('  … bỏ qua:', r4.boQua);
  else {
    if (r4.xong !== 'done' && r4.xong !== 'claimed') fail(`mục \`moc\` không xong qua mocTick (${r4.xong}) — cửa cơ chế lại thành một câu nhắc`);
    else pass('`moc` phụ tuyến đếm từ TRẠNG THÁI qua mocTick');
    const cam = [];
    if (!r4.silver) cam.push('silver'); if (!r4.do) cam.push('item');
    if (!r4.ngoc) cam.push('ngọc');     if (!r4.cot) cam.push('Cốt');
    if (!r4.gk) cam.push('Ấn Giao Kết');
    if (cam.length) fail(`turnInSide nuốt mất phần thưởng: ${cam.join(', ')}`);
    else pass('turnInSide trao đủ silver · đồ · ngọc · Cốt · Ấn Giao Kết');
    for (const k of ['Tay','Chúc Phúc','Mảnh Cốt','Ấn Giao Kết'])
      if (!r4.moTa.includes(k)) fail(`dòng thưởng không nhắc "${k}" — người chơi không biết trước mình sẽ nhận gì`);
  }

  // ── 5) trần số mục cầm cùng lúc phải đủ cho MỘT vùng + hai ───────────────────────
  const r5 = await p.evaluate(() => {
    const theoMap = {}; for (const q of SIDE_QUESTS) theoMap[q.map] = (theoMap[q.map] || 0) + 1;
    return { tran: SIDE_TRAN, nhieuNhat: Math.max(...Object.values(theoMap)) };
  });
  console.log('5) trần:', JSON.stringify(r5));
  if (r5.tran < r5.nhieuNhat + 1)
    fail(`trần ${r5.tran} mà một vùng có tới ${r5.nhieuNhat} mục — nhận trọn một vùng là hết chỗ cho vùng khác`);
  else pass(`trần ${r5.tran} mục, vùng dày nhất ${r5.nhieuNhat} mục`);

  if (errs.length) fail('lỗi trang: ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
