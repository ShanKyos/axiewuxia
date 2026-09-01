// Hai cơ chế boss mới. Năm chiêu cũ đều chỉ hỏi "đừng đứng đó" — không chiêu nào bắt người chơi
// LÀM gì. Vỡ Giáp hỏi bùng nổ sát thương đúng lúc; Đảo Vùng An Toàn lật ngược thói quen né vòng đỏ.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html?max=1'); await p.waitForTimeout(800);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); calcDerived(); });

  // ---- 1. Bảng chiêu: mọi Cổng Vực có Vỡ Giáp, mỗi map có ít nhất 1 boss Đảo Vùng ----
  // Cơ chế đã DỜI khỏi boss ngoài map sang boss PHÓ BẢN: boss ngoài map thì đi ngang qua cũng
  // gặp, nhét chú huỷ diệt vào đó là quá tay.
  const wired = await p.evaluate(() => {
    const DGN_BOSS = ['boss_hacphong','boss_sontac','boss_phando','boss_mochu','boss_tinhhoa','boss_dothong','boss_thienbinh'];
    const o = { ngoaiMapDinh: [], phoBanCoCoChe: 0, phoBanThieuMoveset: [] };
    for (const mid in BOSS_DEFS){
      const bd = BOSS_DEFS[mid];
      for (const t of [...(bd.thuve||[]), bd.tranai].filter(Boolean))
        if (t.moves.some(v => v==='vogiap' || v==='daovung')) o.ngoaiMapDinh.push(mid+'/'+t.id);
    }
    for (const k of DGN_BOSS){
      const mv = (MOBS[k] && MOBS[k].moves) || [];
      if (!mv.length) o.phoBanThieuMoveset.push(k);
      if (mv.some(v => v==='vogiap' || v==='daovung')) o.phoBanCoCoChe++;
    }
    return o;
  });
  console.log('gán chiêu:', JSON.stringify(wired));
  if (wired.ngoaiMapDinh.length) fail(`boss NGOÀI MAP còn cơ chế phó bản: ${wired.ngoaiMapDinh.join(', ')}`);
  if (wired.phoBanThieuMoveset.length) fail(`boss phó bản không có moveset: ${wired.phoBanThieuMoveset.join(', ')}`);
  if (wired.phoBanCoCoChe !== 7) fail(`chỉ ${wired.phoBanCoCoChe}/7 boss phó bản có cơ chế mới`);

  // ---- 2. VỠ GIÁP — phá kịp thì chú vỡ, boss choáng, KHÔNG mất máu ----
  const win = await p.evaluate(() => {
    travelTo('comoc'); mobs = []; player.x = 1200; player.y = 1200; player.hp = player.maxHp;
    const bd = BOSS_DEFS.comoc.tranai;
    const m = spawnZoneBoss(bd, 'tranai');
    m.x = 1300; m.y = 1300; m.tele = null; m.stunT = 0;
    bossStartTele(m, 'vogiap');
    const soCau = (m.tele.orbs || []).length;
    const capCau = m.tele.orbs.map(o => Math.round(o.maxHp));
    const hp0 = player.hp;
    // phá hết cầu
    for (const o of m.tele.orbs){ o.hp = 1; killMob(o, 'hit'); }
    const expTruoc = player.xp, bacTruoc = player.silver, tuiTruoc = player.inv.length;
    // mô phỏng một khung hình của vòng update: chú phải vỡ NGAY, không chờ hết 5 giây
    const tTruoc = m.tele.t;
    if (m.tele.mvId === 'vogiap' && m.tele.orbs.every(o => o.dead)) m.tele.t = 0;
    if (m.tele.t <= 0) bossExecMove(m);
    return { soCau, capCau, conTele: !!m.tele, tTruoc: +tTruoc.toFixed(1),
             bossChoang: Math.round(m.stunT || 0), phatTrungPhat: Math.round(m.punishT || 0),
             mauMat: hp0 - player.hp,
             cauChoExp: player.xp - expTruoc, cauChoBac: player.silver - bacTruoc,
             cauChoDo: player.inv.length - tuiTruoc };
  });
  console.log('Vỡ Giáp — phá kịp:', JSON.stringify(win));
  if (win.soCau !== 4) fail(`sinh ${win.soCau} cầu giáp, cần 4`);
  if (win.conTele) fail('phá hết cầu mà chú chưa vỡ');
  if (!(win.tTruoc > 2)) fail(`chú tự vỡ khi còn ${win.tTruoc}s — test chưa chứng minh được việc TẮT SỚM`);
  if (!(win.bossChoang >= 4)) fail(`boss chỉ choáng ${win.bossChoang}s — phần thưởng quá mỏng`);
  if (win.mauMat !== 0) fail(`phá kịp mà vẫn mất ${win.mauMat} máu`);
  if (win.cauChoExp || win.cauChoBac || win.cauChoDo)
    fail(`cầu giáp phát thưởng (exp ${win.cauChoExp}, bạc ${win.cauChoBac}, đồ ${win.cauChoDo}) — thành bãi cày`);

  // ---- 3. VỠ GIÁP — không phá kịp thì ăn đòn, và đòn đó KHÔNG né được ----
  const lose = await p.evaluate(() => {
    mobs = []; player.hp = player.maxHp;
    const m = spawnZoneBoss(Object.assign({}, BOSS_DEFS.comoc.tranai, { moves:['vogiap','daovung'] }), 'tranai');
    m.x = 1300; m.y = 1300; m.tele = null;
    bossStartTele(m, 'vogiap');
    player.x = 20; player.y = 20;      // đứng TẬN góc map — vẫn phải ăn đòn
    const hp0 = player.hp;
    m.tele.t = 0; bossExecMove(m);
    const conCau = mobs.filter(o => o.def.bossOrb && !o.dead).length;
    return { mauMat: hp0 - player.hp, conCau, bossChoang: Math.round(m.stunT || 0) };
  });
  console.log('Vỡ Giáp — không kịp:', JSON.stringify(lose));
  if (!(lose.mauMat > 0)) fail('không phá cầu mà chẳng mất máu — chiêu vô nghĩa');
  if (lose.conCau) fail(`còn ${lose.conCau} cầu giáp lởn vởn sau khi niệm xong`);
  if (lose.bossChoang) fail('không phá kịp mà boss vẫn choáng');

  // ---- 4. ĐẢO VÙNG — ở TRONG vòng sáng thì sống, ở ngoài thì chết ----
  const inv = await p.evaluate(() => {
    const o = {};
    for (const trong of [true, false]){
      mobs = []; player.hp = player.maxHp;
      const m = spawnZoneBoss(Object.assign({}, BOSS_DEFS.comoc.thuve[1], { moves:['daovung'] }), 'thuve');
      m.x = 1300; m.y = 1300; m.tele = null;
      bossStartTele(m, 'daovung');
      const t = m.tele, R = BOSS_MOVES.daovung.r;
      o.cachBoss = Math.round(dist(t.sx, t.sy, m.x, m.y));
      if (trong){ player.x = t.sx; player.y = t.sy; }
      else { player.x = t.sx + R + 120; player.y = t.sy; }
      const hp0 = player.hp;
      t.t = 0; bossExecMove(m);
      o[trong ? 'trongVong' : 'ngoaiVong'] = hp0 - player.hp;
    }
    return o;
  });
  console.log('Đảo Vùng:', JSON.stringify(inv));
  if (inv.trongVong !== 0) fail(`đứng trong vòng sáng vẫn mất ${inv.trongVong} máu`);
  if (!(inv.ngoaiVong > 0)) fail('đứng ngoài vòng sáng mà không mất máu — chiêu vô nghĩa');
  if (!(inv.cachBoss > 200)) fail(`ô an toàn chỉ cách boss ${inv.cachBoss}px — đứng nguyên tại chỗ là thắng`);

  // ---- 5. Đánh boss thật 25 giây, không lỗi console ----
  const live = await p.evaluate(() => {
    mobs = []; player.hp = player.maxHp; player.x = 1200; player.y = 1250;
    const m = spawnZoneBoss(Object.assign({}, BOSS_DEFS.comoc.tranai, { moves:['vogiap','daovung'] }), 'tranai');
    m.x = 1300; m.y = 1300; m.hp = m.maxHp;
    window._bossRef = m; player.auto = true;
    return { mau: Math.round(m.maxHp) };
  });
  await p.waitForTimeout(25000);
  const after = await p.evaluate(() => {
    const m = window._bossRef;
    return { conSong: !m.dead, mauConLai: Math.round(100*m.hp/m.maxHp),
             daNiem: !!window._sawVogiap, cauLoLung: mobs.filter(o => o.def && o.def.bossOrb && !o.dead).length };
  });
  console.log('đánh thật 25s:', JSON.stringify(live), '→', JSON.stringify(after));

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
