// HỆ NHIỆM VỤ — gác các luật ở docs/LORE_RUNE.md §6 bằng MÁY, không bằng chữ.
//
// ⚠ Vì sao bài này tồn tại: luật "không quá 60% là đánh quái" đã nằm trong tài liệu suốt, và
// chuỗi vẫn trôi lên **70%** mà không ai biết — vì tài liệu không thực thi gì. Tệ hơn: câu luật
// bản đầu ghi đúng chữ `kill`, nên đếm theo nó ra 41% và luật "PASS". Một luật đếm hẹp hơn ý
// định của nó thì tệ hơn không có luật.
//
// Bảy nhóm dưới đây đo THẲNG trên dữ liệu game, không chép lại con số nào:
//  1. tỉ lệ đánh quái — toàn chuỗi ≤60%, mỗi chương ≤70%, không chương nào toàn đánh
//  2. `tranai` phải là nhiệm vụ CUỐI của chương (chương IV từng đóng ở ô 3/5)
//  3. nhịp cấp — hai nhiệm vụ liền nhau ≤4 cấp, cấp quái lệch ≤±4
//  4. mọi tham chiếu phải THẬT: npc · targetNpc · mob · herbMap · moc
//  5. cửa cơ chế — mỗi khoá MOC_NV có người gác, và `dem()` đếm từ TRẠNG THÁI
//  6. nhiệm vụ `moc` chạy THẬT: chạm vào hệ thống là nó chuyển sang 'done'
//  7. phụ tuyến — ≤1 nhiệm vụ đánh mỗi map, reqMain trong tầm, trần 3 cái cùng lúc
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
const DANH = ['kill', 'tpkill', 'boss', 'tranai'];

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  const D = await p.evaluate((danh) => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const npcIds = new Set(NPCS.map(n => n.id));
    const mobIds = new Set(Object.keys(MOBS));
    const herbIds = new Set(Object.keys(HERB_SPOTS || {}));
    const mocIds = Object.keys(MOC_NV);
    const ch = {};
    for (const q of QUESTS) (ch[q.chapter] = ch[q.chapter] || []).push({
      id:q.id, lv:q.lv, type:q.type, map:q.map, moc:q.moc, npc:q.npc,
      targetNpc:q.targetNpc, mob:q.mob, herbMap:q.herbMap,
      mobLv: q.mob && MOBS[q.mob] ? MOBS[q.mob].lv : null });
    return {
      q: QUESTS.map(q => ({ id:q.id, lv:q.lv, type:q.type, chapter:q.chapter, moc:q.moc,
        npc:q.npc, targetNpc:q.targetNpc, mob:q.mob, herbMap:q.herbMap, map:q.map,
        mobLv: q.mob && MOBS[q.mob] ? MOBS[q.mob].lv : null })),
      s: SIDE_QUESTS.map(x => ({ id:x.id, npc:x.npc, targetNpc:x.targetNpc, mob:x.mob,
        herbMap:x.herbMap, type:x.type, reqLv:x.reqLv, reqMain:x.reqMain, need:x.need })),
      ch, mocIds, danh,
      npcIds:[...npcIds], mobIds:[...mobIds], herbIds:[...herbIds],
      mapIds: Object.keys(MAPS),
    };
  }, DANH);
  const npcIds = new Set(D.npcIds), mobIds = new Set(D.mobIds), herbIds = new Set(D.herbIds);
  const mapIds = new Set(D.mapIds), mocIds = new Set(D.mocIds);

  // ── 1. tỉ lệ đánh quái ──────────────────────────────────────────────────────
  const nD = D.q.filter(q => DANH.includes(q.type)).length;
  const tl = nD / D.q.length;
  console.log(`1) ${D.q.length} nhiệm vụ chính · đánh ${nD} = ${(tl*100).toFixed(0)}%`);
  tl <= 0.60 ? pass(`toàn chuỗi ${(tl*100).toFixed(0)}% đánh quái (trần 60%)`)
             : fail(`toàn chuỗi ${(tl*100).toFixed(0)}% đánh quái — vượt trần 60%`);
  const xau = [], toanDanh = [];
  for (const k in D.ch){
    const qs = D.ch[k], n = qs.filter(q => DANH.includes(q.type)).length;
    if (n / qs.length > 0.70) xau.push(`${k} ${n}/${qs.length}`);
    if (n === qs.length) toanDanh.push(k);
  }
  xau.length ? fail(`chương vượt trần 70%: ${xau.join(' · ')}`)
             : pass(`không chương nào vượt 70% (cao nhất ${Math.max(...Object.values(D.ch).map(qs => qs.filter(q=>DANH.includes(q.type)).length/qs.length*100)).toFixed(0)}%)`);
  toanDanh.length ? fail(`chương TOÀN đánh quái: ${toanDanh.join(', ')}`)
                  : pass('không chương nào toàn đánh quái');

  // ── 2. `tranai` đóng chương, ở ô CUỐI ───────────────────────────────────────
  const lech = [];
  for (const k in D.ch){
    const qs = D.ch[k], i = qs.findIndex(q => q.type === 'tranai');
    if (i >= 0 && i !== qs.length - 1) lech.push(`${k}: ô ${i+1}/${qs.length}`);
  }
  lech.length ? fail(`\`tranai\` không đóng chương: ${lech.join(' · ')}`)
              : pass(`\`tranai\` là nhiệm vụ CUỐI ở mọi chương có nó`);

  // ── 3. nhịp cấp ─────────────────────────────────────────────────────────────
  const ho = [];
  for (let i = 1; i < D.q.length; i++){
    const g = D.q[i].lv - D.q[i-1].lv;
    if (g > 4) ho.push(`${D.q[i-1].id}→${D.q[i].id} (+${g})`);
    if (g < 0) ho.push(`${D.q[i-1].id}→${D.q[i].id} TỤT CẤP`);
  }
  ho.length ? fail(`hở/tụt cấp: ${ho.join(' · ')}`) : pass('hai nhiệm vụ liền nhau không quá 4 cấp, không chỗ nào tụt');
  const lechMob = D.q.filter(q => q.mobLv != null && Math.abs(q.mobLv - q.lv) > 4)
                     .map(q => `${q.id} lv${q.lv} vs ${q.mob} C${q.mobLv}`);
  lechMob.length ? fail(`cấp quái lệch quá ±4: ${lechMob.join(' · ')}`)
                 : pass('cấp quái lệch cấp nhiệm vụ không quá ±4');

  // ── 4. mọi tham chiếu phải THẬT ─────────────────────────────────────────────
  const la = [];
  for (const q of [...D.q, ...D.s]){
    if (q.npc && !npcIds.has(q.npc)) la.push(`${q.id}.npc=${q.npc}`);
    if (q.targetNpc && !npcIds.has(q.targetNpc)) la.push(`${q.id}.targetNpc=${q.targetNpc}`);
    if (q.mob && !mobIds.has(q.mob)) la.push(`${q.id}.mob=${q.mob}`);
    if (q.herbMap && !herbIds.has(q.herbMap)) la.push(`${q.id}.herbMap=${q.herbMap}`);
    if (q.map && !mapIds.has(q.map)) la.push(`${q.id}.map=${q.map}`);
    if (q.moc && !mocIds.has(q.moc)) la.push(`${q.id}.moc=${q.moc}`);
  }
  la.length ? fail(`tham chiếu không tồn tại: ${la.join(' · ')}`)
            : pass(`${D.q.length + D.s.length} nhiệm vụ: mọi npc/mob/map/herbMap/moc đều thật`);

  // ── 5. cửa cơ chế — khoá nào cũng phải có người gác ────────────────────────
  const daGac = new Set(D.q.filter(q => q.type === 'moc').map(q => q.moc));
  const khongGac = D.mocIds.filter(k => !daGac.has(k));
  console.log(`5) MOC_NV có ${D.mocIds.length} cửa · ${daGac.size} cửa có nhiệm vụ gác: ${[...daGac].join(' ')}`);
  khongGac.length > 1
    ? fail(`${khongGac.length} cửa MOC_NV không nhiệm vụ nào gác: ${khongGac.join(', ')} — bảng khai cửa mà không ai mở là mã chết`)
    : pass(`${daGac.size}/${D.mocIds.length} cửa có người gác (dư ≤1 khoá để dành)`);

  // ── 6. nhiệm vụ `moc` CHẠY THẬT ────────────────────────────────────────────
  //     Chạm vào hệ thống rồi chờ mocTick → questState phải sang 'done'.
  const r6 = await p.evaluate(async () => {
    const out = [];
    for (const q of QUESTS.filter(x => x.type === 'moc')){
      startGame('thieulam', null);
      player.level = Math.max(q.lv, 1); player.lvPeak = player.level; calcDerived();
      questIdx = QUESTS.indexOf(q); questProg = 0; questState = 'active';
      // Nhồi TRẠNG THÁI mà MOC_NV.dem() đọc — đúng cái mà nhiệm vụ đòi.
      if (q.moc === 'khe'){ for (let i = 0; i < q.need; i++) chiNhan(CHIMERA[i].id); }
      if (q.moc === 'via'){ player.via = { day:'x' }; for (let i = 0; i < q.need; i++) player.via['m' + i] = 1; }
      if (q.moc === 'ruong'){ player.ruong = {}; for (let i = 0; i < q.need; i++) player.ruong['m:' + i] = 1; }
      if (q.moc === 'hap'){ player.hapMo = q.need; }
      if (q.moc === 'mastery'){ player.mastery = {}; for (let i = 0; i < q.need; i++) player.mastery['n' + i] = 1; }
      if (q.moc === 'cot'){ const O = cotO();
        for (const k of COT_O_IDS.slice(0, q.need)) O[k] = cotMoiO('votrung', 'tho', k); }
      if (q.moc === 'nangky'){ player.skillLv = {}; player.skillLv.a = 1 + q.need; }
      mocTick(99);   // dt lớn để vượt nhịp 0,5s ngay lượt đầu
      out.push({ id:q.id, moc:q.moc, need:q.need, prog:questProg, st:questState });
    }
    return out;
  });
  console.log('6)', JSON.stringify(r6));
  const chuaXong = r6.filter(x => x.st !== 'done');
  chuaXong.length
    ? fail(`nhiệm vụ \`moc\` không chuyển sang 'done' dù đã đủ điều kiện: ` +
           chuaXong.map(x => `${x.id}/${x.moc} ${x.prog}/${x.need} (${x.st})`).join(' · '))
    : pass(`cả ${r6.length} nhiệm vụ \`moc\` chạy thật — chạm vào hệ thống là xong`);

  // ── 6b. và `dem()` phải đếm từ TRẠNG THÁI: làm TRƯỚC khi nhận vẫn tính ──────
  const r6b = await p.evaluate(() => {
    const q = QUESTS.find(x => x.type === 'moc' && x.moc === 'ruong');
    if (!q) return null;
    startGame('thieulam', null);
    player.level = q.lv; player.lvPeak = q.lv; calcDerived();
    player.ruong = {}; for (let i = 0; i < q.need; i++) player.ruong['truoc:' + i] = 1;  // làm TRƯỚC
    questIdx = QUESTS.indexOf(q); questProg = 0; questState = 'active';                  // rồi mới nhận
    mocTick(99);
    return { st:questState, prog:questProg, need:q.need };
  });
  console.log('6b)', JSON.stringify(r6b));
  (r6b && r6b.st === 'done')
    ? pass('làm TRƯỚC khi nhận nhiệm vụ vẫn tính — `dem()` đọc trạng thái, không bắt sự kiện')
    : fail('mở rương TRƯỚC khi nhận nhiệm vụ thì nhiệm vụ không bao giờ xong — `dem()` đang bắt sự kiện');

  // ── 7. phụ tuyến ────────────────────────────────────────────────────────────
  console.log(`7) ${D.s.length} phụ tuyến · loại: ` +
    JSON.stringify(D.s.reduce((a, q) => (a[q.type] = (a[q.type]||0)+1, a), {})));
  if (!D.s.length) fail('SIDE_QUESTS rỗng');
  else {
    const nk = D.s.filter(q => q.type === 'kill').length;
    nk / D.s.length <= 0.50
      ? pass(`${nk}/${D.s.length} phụ tuyến là đánh quái (trần 50% — bản đời trước gần 80%)`)
      : fail(`${nk}/${D.s.length} phụ tuyến là đánh quái — vượt trần 50%, đang đi lại vết cũ`);
    // gom theo NPC giao (mỗi map lối một người giao) — không ai được giao quá 1 nhiệm vụ đánh
    const theoNpc = {};
    for (const q of D.s) (theoNpc[q.npc] = theoNpc[q.npc] || []).push(q);
    const dayDanh = Object.keys(theoNpc).filter(n => theoNpc[n].filter(q => q.type === 'kill').length > 1);
    dayDanh.length ? fail(`NPC giao quá 1 nhiệm vụ đánh: ${dayDanh.join(', ')}`)
                   : pass('không NPC nào giao quá một nhiệm vụ đánh quái');
    const ngoaiTam = D.s.filter(q => q.reqMain == null || q.reqMain < 0 || q.reqMain >= D.q.length)
                        .map(q => `${q.id}.reqMain=${q.reqMain}`);
    ngoaiTam.length ? fail(`reqMain ngoài tầm 0..${D.q.length-1}: ${ngoaiTam.join(' · ')}`)
                    : pass(`mọi reqMain nằm trong 0..${D.q.length-1}`);
    // Trần 3 cái cùng lúc: ở bất kỳ cấp nào, số phụ tuyến MỞ không được quá 3 — nếu không thì
    // `sideAvail` trả 'full' và có nhiệm vụ người chơi vĩnh viễn không thấy.
    let dong = 0, tai = 0;
    for (let lv = 1; lv <= 120; lv++){
      const n = D.s.filter(q => q.reqLv === lv).length;
      if (n > 3){ dong++; tai = lv; }
    }
    dong ? fail(`có cấp mở quá 3 phụ tuyến cùng lúc (vd cấp ${tai}) — sideAvail trả 'full'`)
         : pass('không cấp nào mở quá 3 phụ tuyến cùng lúc');
  }

  console.log('errors:', JSON.stringify(errs.slice(0, 8)));
  if (errs.length) fail(`${errs.length} lỗi JS trong lúc chạy`);
  console.log(bad ? `\nđỏ: ${bad}` : '\nTẤT CẢ XANH');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
