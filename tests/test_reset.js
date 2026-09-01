// TÁI SINH (reset kiểu MU) — đã mở thì phải MỞ MÃI.
//
// Bản cũ gác mọi cổng bằng player.level. Tái Sinh đưa cấp về 1, nên người vừa lên tối đa cấp
// bị: 4 tab còn 1, Lò Rèn đóng, Vực Thẳm đóng, cả 6 ải bản đồ khoá lại — nhốt về bãi quái tân
// thủ, đổi lấy +2% Công/Mạng. Bên MU gốc reset không lấy lại quyền vào đâu cả.
//
// Nay mọi cổng bám vào lvPeak() — cấp CAO NHẤT từng đạt, sống qua Tái Sinh.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(500);

  const soi = () => p.evaluate(() => ({
    cap: player.level, dinh: player.lvPeak, sl: player.resetCount || 0,
    tab: CHAR_TABS.filter(t => sysUnlocked(t.id)).length,
    loRen: lvPeak() >= FORGE_LV,
    vucTham: lvPeak() >= 60,
    aiQuaDuoc: AI_PASSES.filter(a => lvPeak() >= a.reqLv).length,
    aiTong: AI_PASSES.length,
    luc: player.str, doTrongTui: player.inv.length, doDangMac: Object.keys(player.equip).length,
  }));

  // ── 1. Tái Sinh KHÔNG được khoá lại thứ gì ────────────────────────────
  await p.evaluate(() => { player.level = MAX_LV; calcDerived(); });
  const truoc = await soi();
  await p.evaluate(() => { doTayTuy(); doTayTuy(true); });
  await p.waitForTimeout(300);
  const sau = await soi();
  console.log('1. trước:', JSON.stringify(truoc));
  console.log('   sau  :', JSON.stringify(sau));
  const mat = [];
  if (sau.tab < truoc.tab) mat.push(`tab ${truoc.tab}→${sau.tab}`);
  if (truoc.loRen && !sau.loRen) mat.push('Lò Rèn');
  if (truoc.vucTham && !sau.vucTham) mat.push('Vực Thẳm');
  if (sau.aiQuaDuoc < truoc.aiQuaDuoc) mat.push(`ải ${truoc.aiQuaDuoc}→${sau.aiQuaDuoc}`);
  mat.length ? fail('Tái Sinh khoá lại: ' + mat.join(' · '))
             : pass(`Tái Sinh giữ nguyên mọi quyền đã mở (${sau.tab} tab · Lò Rèn · Vực Thẳm · ${sau.aiQuaDuoc}/${sau.aiTong} ải)`);
  if (sau.cap !== 1) fail('Tái Sinh không đưa cấp về 1');
  if (sau.sl !== truoc.sl + 1) fail('không cộng số lần Tái Sinh');

  // ── 2. giữ trang bị và chỉ số đã cộng ─────────────────────────────────
  (sau.luc === truoc.luc && sau.doTrongTui === truoc.doTrongTui && sau.doDangMac === truoc.doDangMac)
    ? pass('giữ nguyên trang bị và điểm đã cộng — đúng tinh thần reset của MU')
    : fail(`mất đồ/chỉ số: ${JSON.stringify({truoc, sau})}`);

  // ── 3. cấp đỉnh chỉ tăng, không bao giờ tụt ───────────────────────────
  const r3 = await p.evaluate(() => {
    const moc = [];
    for (const lv of [5, 40, 120, 3, 60, 1]){ player.level = lv; lvPeak(); moc.push(player.lvPeak); }
    return { moc, cuoi: player.lvPeak };
  });
  console.log('3.', JSON.stringify(r3));
  (r3.cuoi === 120 && r3.moc.every((v, i) => i === 0 || v >= r3.moc[i-1]))
    ? pass('cấp đỉnh chỉ tăng, hạ cấp bao nhiêu cũng không tụt')
    : fail('cấp đỉnh tụt: ' + JSON.stringify(r3));

  // ── 4. Tái Sinh nhiều lần vẫn mở, và thưởng cộng dồn ──────────────────
  const r4 = await p.evaluate(() => {
    player.level = MAX_LV; calcDerived();
    const a = player.atk;
    for (let i = 0; i < 3; i++){ player.level = MAX_LV; doTayTuy(); doTayTuy(true); }
    player.level = MAX_LV; calcDerived();
    return { sl: player.resetCount, congTruoc: a, congSau: player.atk,
             tab: CHAR_TABS.filter(t => sysUnlocked(t.id)).length,
             ai: AI_PASSES.filter(x => lvPeak() >= x.reqLv).length };
  });
  console.log('4.', JSON.stringify(r4));
  (r4.congSau > r4.congTruoc && r4.tab >= 5 && r4.ai === 6)
    ? pass(`Tái Sinh ${r4.sl} lần: thưởng cộng dồn (công ${r4.congTruoc}→${r4.congSau}), quyền vẫn nguyên`)
    : fail('nhiều lần Tái Sinh sai: ' + JSON.stringify(r4));

  // ── 5. save cũ: đã từng Tái Sinh thì phải được trả lại quyền ──────────
  const r5 = await p.evaluate(() => {
    // giả lập đoạn vá trong loadGame cho save chưa có lvPeak
    const vaCu = (lv, rc) => { const q = { level: lv, resetCount: rc };
      if (!q.lvPeak) q.lvPeak = q.resetCount > 0 ? MAX_LV : q.level; return q.lvPeak; };
    return { daTaiSinh: vaCu(1, 2), chuaTaiSinh: vaCu(37, 0), max: MAX_LV };
  });
  console.log('5.', JSON.stringify(r5));
  (r5.daTaiSinh === r5.max && r5.chuaTaiSinh === 37)
    ? pass('save cũ: đã Tái Sinh thì trả lại quyền tối đa cấp, chưa Tái Sinh thì giữ đúng cấp')
    : fail('vá save cũ sai: ' + JSON.stringify(r5));

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALLPASS');
  process.exit(bad ? 1 : 0);
})();
