// Hai dạng phó bản mới. Trước bản này cả 7 phó bản là CÙNG một hình dạng (3 đợt quái rơi xuống
// cùng một chỗ trong MỘT phòng trống → boss rơi xuống đúng chỗ đó), và boss cuối phó bản không
// có moveset nào cả — chỉ đánh thường.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION|ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html?max=1'); await p.waitForTimeout(800);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); calcDerived(); });

  // ── 1. Boss ngoài map KHÔNG được mang cơ chế phó bản ──
  const owm = await p.evaluate(() => {
    const dinh = [];
    for (const mid in BOSS_DEFS){
      const bd = BOSS_DEFS[mid];
      for (const t of [...(bd.thuve||[]), bd.tranai].filter(Boolean))
        if (t.moves.some(v => v === 'vogiap' || v === 'daovung')) dinh.push(mid + '/' + t.id);
    }
    const dgnCo = ['boss_hacphong','boss_sontac','boss_phando','boss_mochu','boss_tinhhoa','boss_dothong','boss_thienbinh']
      .filter(k => MOBS[k] && (MOBS[k].moves||[]).some(v => v==='vogiap'||v==='daovung'));
    const dgnKhongMoveset = ['boss_hacphong','boss_sontac','boss_phando','boss_mochu','boss_tinhhoa','boss_dothong','boss_thienbinh']
      .filter(k => !MOBS[k] || !(MOBS[k].moves||[]).length);
    return { ngoaiMapDinh: dinh, phoBanCoCoChe: dgnCo.length, phoBanThieuMoveset: dgnKhongMoveset };
  });
  console.log('phân bố cơ chế:', JSON.stringify(owm));
  if (owm.ngoaiMapDinh.length) fail(`boss NGOÀI MAP còn cơ chế phó bản: ${owm.ngoaiMapDinh.join(', ')}`);
  if (owm.phoBanCoCoChe !== 7) fail(`chỉ ${owm.phoBanCoCoChe}/7 boss phó bản có cơ chế mới`);
  if (owm.phoBanThieuMoveset.length) fail(`boss phó bản không có moveset: ${owm.phoBanThieuMoveset.join(', ')}`);

  // ── 2. PHÒNG NỐI PHÒNG: cửa khoá cho tới khi dọn sạch phòng ──
  const rooms = await p.evaluate(() => {
    travelTo('pb_daohoa'); startDungeonRun('pb_daohoa');
    const o = { cua: [], quaiTheoPhong: [], quaCuaDuoc: [] };
    const gx = (DGN_GATE.x0 + DGN_GATE.x1)/2;
    for (let w = 1; w <= 3; w++){
      o.cua.push(DGN.doorOpen.slice());
      // quái đợt này nằm trong phòng nào?
      const alive = mobs.filter(m => !m.dead);
      const R = DGN_ROOMS[w-1];
      o.quaiTheoPhong.push(alive.length ? alive.every(m => m.y > R.y0 - 60 && m.y < R.y1 + 60) : null);
      // khe cửa của tường w-1 có chặn không?
      if (w <= 2) o.quaCuaDuoc.push(!inObstacle('pb_daohoa', gx, DGN_WALLS[w-1].y + DGN_WALLS[w-1].h/2, 14));
      mobs.forEach(m => { m.hp = 1; killMob(m, 'hit'); });
      updateDungeon(0.016);
    }
    o.cuaSauCung = DGN.doorOpen.slice();
    o.bossRa = !!DGN.bossRef;
    o.bossTrongPhong3 = DGN.bossRef ? (DGN.bossRef.y > DGN_ROOMS[2].y0 - 60 && DGN.bossRef.y < DGN_ROOMS[2].y1 + 60) : null;
    o.bossCoMoveset = DGN.bossRef ? (DGN.bossRef.def.moves || []).length : 0;
    return o;
  });
  console.log('phòng nối phòng:', JSON.stringify(rooms));
  if (JSON.stringify(rooms.cua[0]) !== '[false,false]') fail('vào phó bản mà cửa đã mở sẵn');
  if (rooms.quaCuaDuoc[0] !== false) fail('cửa 1 chưa dọn phòng đã đi qua được');
  if (!rooms.quaiTheoPhong.slice(0,3).every(v => v !== false)) fail(`quái không nằm đúng phòng: ${JSON.stringify(rooms.quaiTheoPhong)}`);
  if (JSON.stringify(rooms.cuaSauCung) !== '[true,true]') fail(`dọn hết 3 phòng mà cửa vẫn ${JSON.stringify(rooms.cuaSauCung)}`);
  if (!rooms.bossRa) fail('dọn hết 3 phòng mà boss không ra');
  if (!rooms.bossTrongPhong3) fail('boss không ra ở sảnh trong cùng');
  if (!rooms.bossCoMoveset) fail('boss phó bản vẫn không có moveset');

  // ── 3. TẦNG SÂU: kho tạm dồn theo tầng, RÚT LUI thì vào túi ──
  const deep = await p.evaluate(() => {
    player.level = 60; calcDerived();
    const s0 = player.silver, m0 = player.mat;
    deepStart();
    const o = { batDau: DEEP ? DEEP.floor : null, moc: [] };
    for (let i = 0; i < 4; i++){
      o.moc.push({ tang: DEEP.floor, quai: mobs.filter(m=>!m.dead).length,
                   khoBac: DEEP.bank.silver });
      mobs.forEach(m => { m.hp = 1; killMob(m, 'hit'); });
      updateDeep();
    }
    o.truocKhiRut = { tang: DEEP.floor, khoBac: DEEP.bank.silver, khoExp: DEEP.bank.xp,
                      tuiBac: player.silver - s0 };
    deepLeave();
    o.sauKhiRut = { conDEEP: !!DEEP, tuiBac: player.silver - s0, tuiMat: player.mat - m0 };
    return o;
  });
  console.log('tầng sâu:', JSON.stringify(deep));
  if (deep.batDau !== 1) fail('deepStart không vào tầng 1');
  if (!(deep.moc[3].quai > deep.moc[0].quai)) fail(`tầng sâu hơn không đông quái hơn (${deep.moc[0].quai} → ${deep.moc[3].quai})`);
  if (!(deep.moc[3].khoBac > deep.moc[1].khoBac)) fail('kho tạm không tăng theo tầng');
  if (deep.truocKhiRut.tuiBac !== 0) fail(`chưa rút mà bạc đã vào túi (+${deep.truocKhiRut.tuiBac}) — mất hết ý nghĩa đặt cược`);
  if (deep.sauKhiRut.conDEEP) fail('rút lui rồi mà vẫn còn trong Tầng Sâu');
  if (!(deep.truocKhiRut.khoExp > 0)) fail('kho tạm không tích EXP — EXP phải cũng nằm trong ván cược');
  if (!(deep.sauKhiRut.tuiBac >= deep.truocKhiRut.khoBac)) fail(`rút lui mà túi chỉ +${deep.sauKhiRut.tuiBac}, kho tạm có ${deep.truocKhiRut.khoBac}`);

  // ── 4. CHẾT trong Tầng Sâu = mất sạch kho tạm ──
  const die = await p.evaluate(() => {
    const s0 = player.silver;
    deepStart();
    for (let i = 0; i < 3; i++){ mobs.forEach(m => { m.hp = 1; killMob(m,'hit'); }); updateDeep(); }
    const kho = DEEP.bank.silver, tang = DEEP.floor;
    player.traitRevive = false; player.hp = 0; onDeath();
    return { kho, tang, conDEEP: !!DEEP, tuiTang: player.silver - s0 };
  });
  console.log('chết trong tầng sâu:', JSON.stringify(die));
  if (!(die.kho > 0)) fail('test hỏng: chưa tích được kho tạm nào trước khi chết');
  if (die.conDEEP) fail('chết mà vẫn còn trong Tầng Sâu');
  if (die.tuiTang !== 0) fail(`chết mà vẫn được +${die.tuiTang} bạc — phải mất SẠCH`);

  // ── 5. Cổng dịch chuyển Tầng Sâu ──
  const gate = await p.evaluate(() => {
    const g = GATES.find(x => x.deep);
    if (!g) return { co:false };
    travelTo('tuongduong'); player.level = 60; calcDerived();
    DEEP = null;
    player.x = g.x; player.y = g.y; updateGate();
    const batDuoc = nearGate === g;
    // ép dùng cổng: đúng hành vi của phím G
    if (nearGate && nearGate.deep) deepStart();
    const vaoDuoc = !!DEEP && DEEP.floor === 1;
    // đang trong Tầng Sâu mà đi cổng THOÁT → phải coi như rút lui, không mất trắng
    for (let i = 0; i < 2; i++){ mobs.forEach(m => { m.hp = 1; killMob(m,'hit'); }); updateDeep(); }
    const kho = DEEP.bank.silver, s0 = player.silver;
    const gx = GATES.find(x => x.map === 'pb_daohoa' && x.to);
    player.x = gx.x; player.y = gx.y; updateGate();
    if (nearGate && !nearGate.deep && DEEP) window.deepLeave();
    return { co:true, viTri:[g.x,g.y], batDuoc, vaoDuoc, khoTruoc: kho,
             conDEEP: !!DEEP, tuiTang: player.silver - s0,
             deLenNPC: NPCS.some(nn => nn.map === 'tuongduong' && dist(nn.x, nn.y, g.x, g.y) < 200),
             trongVatCan: inObstacle('tuongduong', g.x, g.y, 20) };
  });
  console.log('cổng Tầng Sâu:', JSON.stringify(gate));
  if (!gate.co) fail('không có cổng dịch chuyển nào cho Tầng Sâu');
  if (!gate.batDuoc) fail('đứng ngay cổng mà updateGate không bắt được');
  if (!gate.vaoDuoc) fail('dùng cổng mà không vào được Tầng Sâu');
  if (gate.deLenNPC) fail('cổng đặt đè lên NPC');
  if (gate.trongVatCan) fail('cổng đặt trong vật cản — không lại gần được');
  if (gate.conDEEP) fail('đi cổng thoát mà vẫn kẹt trong Tầng Sâu');
  if (gate.tuiTang < gate.khoTruoc) fail(`đi cổng thoát chỉ được +${gate.tuiTang}, kho tạm có ${gate.khoTruoc} — mất trắng vì bấm nhầm cổng`);

  // ── 6. Tầng Sâu CÓ ĐÁY: 20 tầng, tầng boss mỗi 5, xuống hết thì tự trao thưởng ──
  const cap = await p.evaluate(() => {
    DEEP = null; travelTo('tuongduong'); player.level = 100; calcDerived();
    const s0 = player.silver;
    deepStart();
    const o = { max: DEEP_MAX, tangBoss: [], tangThuong: 0, dungO: null };
    for (let i = 0; i < DEEP_MAX + 6; i++){
      if (!DEEP) break;
      const f = DEEP.floor;
      const coBoss = mobs.some(m => !m.dead && m.def.bossKind);
      if (coBoss) o.tangBoss.push(f); else o.tangThuong++;
      mobs.forEach(m => { m.hp = 1; killMob(m, 'hit'); });
      updateDeep();
      if (!DEEP){ o.dungO = f; break; }
    }
    o.tuiBac = player.silver - s0;
    o.conDEEP = !!DEEP;
    return o;
  });
  console.log('giới hạn tầng:', JSON.stringify(cap));
  if (cap.max !== 20) fail(`DEEP_MAX = ${cap.max}, cần 20`);
  if (cap.conDEEP) fail('xuống quá 20 tầng mà vẫn chưa kết thúc — vẫn là vô hạn');
  if (cap.dungO !== 20) fail(`chuyến kết thúc ở tầng ${cap.dungO}, cần đúng tầng 20`);
  if (JSON.stringify(cap.tangBoss) !== '[5,10,15,20]') fail(`tầng boss ra ${JSON.stringify(cap.tangBoss)}, cần [5,10,15,20]`);
  if (!(cap.tuiBac > 0)) fail('xuống hết 20 tầng mà không được đồng nào');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
