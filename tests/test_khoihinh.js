// KHỐI KHUNG HÌNH — mỗi trạng thái phải đọc đúng khối của nó, và bảng hai phải nạp được.
//
// Bài này gác đợt "tận dụng gói Spine": trước đây bộ khung chỉ có 4 khối (đứng · đi · đánh ·
// niệm) trong khi gói có 20 hoạt cảnh. Nay 14 khối, chia hai bảng: bảng một luôn nạp, bảng
// hai nạp khi cần.
//
// Bẫy đã mắc khi viết: đo bằng cách chụp ảnh rồi so pixel thì không phân biệt được "khối sai"
// với "khung sai trong đúng khối". Nên đọc thẳng window.__khoiVe — game gán nó mỗi lần vẽ.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html?test=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(500);
  await p.evaluate(() => { startGame('thieulam', null); });
  await p.waitForTimeout(2200);

  let bad = 0;
  const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('OK  ', m);

  // ── 1. Hai bảng khung ─────────────────────────────────────────────────────
  const r1 = await p.evaluate(async () => {
    applyTestBoost(); cheatExec('lv 20');
    for (const sl of ['non','ao','tay','chan']) { const it = genSpecific(sl, 1); if (it) player.equip[sl] = it; }
    player.equip.canh = null; calcDerived();
    await new Promise(r => setTimeout(r, 1600));
    const gv = gearVisual(player), t = heroTier(player);
    const b1 = nvBang('thieulam', t, gv, 'i'), b2 = nvBang('thieulam', t, gv, 'h');
    return { bo: nvBoTen('thieulam', t, gv),
             bang1: b1 ? b1.width + 'x' + b1.height : null,
             bang2: b2 ? b2.width + 'x' + b2.height : null,
             soKhoi: Object.keys(HS_FRAMES).length,
             khoiBang2: Object.keys(NV_BANG2).length };
  });
  console.log('1.', JSON.stringify(r1));
  if (!r1.bang1) fail('bảng MỘT không nạp được');
  else if (!r1.bang2) fail('bảng HAI không nạp được — khối trúng đòn/chết sẽ lui về dáng đứng');
  else pass(`hai bảng cùng nạp: ${r1.bang1} và ${r1.bang2}`);
  if (r1.soKhoi < 14) fail(`mới ${r1.soKhoi} khối, mong từ 14`);
  else pass(`${r1.soKhoi} khối, ${r1.khoiBang2} khối ở bảng hai`);

  // ── 2. Mốc khung không được chồng nhau ────────────────────────────────────
  const r2 = await p.evaluate(() => {
    const doi = (bang) => {
      const ks = Object.keys(HS_FRAMES).filter(k => !!NV_BANG2[k] === bang);
      const o = [];
      for (const k of ks) for (let i = 0; i < HS_FRAMES[k]; i++) o.push(nvMoc(k) + i);
      return { n: o.length, rieng: new Set(o).size, dinh: Math.max(...o) };
    };
    return { mot: doi(false), hai: doi(true) };
  });
  console.log('2.', JSON.stringify(r2));
  for (const [ten, v] of [['MỘT', r2.mot], ['HAI', r2.hai]]){
    if (v.n !== v.rieng) fail(`bảng ${ten}: ${v.n - v.rieng} khung bị hai khối cùng chiếm`);
    else if (v.dinh >= 96) fail(`bảng ${ten}: khung cao nhất ${v.dinh}, tràn khỏi 6 hàng`);
    else pass(`bảng ${ten}: ${v.n} khung, không khối nào chồng khối nào (đỉnh ${v.dinh})`);
  }

  // ── 3. Mỗi trạng thái một khối ────────────────────────────────────────────
  const MONG = {
    'đứng':'i', 'trúng đòn':'h', 'chém nhát 1':'a', 'chém nhát 2':'s',
    'tay không':'p', 'dính độc':'t', 'bắt chuyện':'n', 'nhảy múa':'e', 'chết':'d',
  };
  const r3 = await p.evaluate(async () => {
    const dat = async (f) => { f(); await new Promise(r => setTimeout(r, 90)); return window.__khoiVe; };
    const sach = () => { player.hurtT = 0; player.atkAnim = 0; player.poisonT = 0; player.buffAtkT = 0;
                         player.noiT = 0; player.nhayT = 0; dead = false; moveTarget = null; player.moving = false; };
    const o = {};
    o['đứng']       = await dat(() => { sach(); });
    o['trúng đòn']  = await dat(() => { sach(); player.hurtT = 0.3; });
    o['chém nhát 1']= await dat(() => { sach(); player.atkAnim = 0.2; player.nhat2 = false; });
    o['chém nhát 2']= await dat(() => { sach(); player.atkAnim = 0.2; player.nhat2 = true; });
    o['tay không']  = await dat(() => { sach(); player._vk = player.equip.vukhi; player.equip.vukhi = null;
                                        player.atkAnim = 0.2; player.nhat2 = false; });
    o['dính độc']   = await dat(() => { sach(); player.equip.vukhi = player._vk; player.poisonT = 3; });
    o['bắt chuyện'] = await dat(() => { sach(); player.noiT = 0.9; });
    o['nhảy múa']   = await dat(() => { sach(); player.nhayT = 3; });
    o['chết']       = await dat(() => { sach(); dead = true; player.deadT = 0.3; });
    dead = false;
    return o;
  });
  console.log('3.', JSON.stringify(r3));
  for (const [ten, mong] of Object.entries(MONG)){
    if (r3[ten] !== mong) fail(`${ten}: đọc khối '${r3[ten]}', mong '${mong}'`);
  }
  if (!bad) pass(`cả ${Object.keys(MONG).length} trạng thái đọc đúng khối`);

  // ── 4. Nhát hai CHỈ cho lớp có nó ─────────────────────────────────────────
  const r4 = await p.evaluate(() => ({ bang: DANH_HAI_NHAT,
    coDK: !!DANH_HAI_NHAT.thieulam, coSB: !!DANH_HAI_NHAT.minhgiao,
    coDW: !!DANH_HAI_NHAT.baidasan, coELF: !!DANH_HAI_NHAT.toanchan }));
  console.log('4.', JSON.stringify(r4));
  if (!r4.coDK || !r4.coSB) fail('Dark Knight và Spellblade phải có nhát thứ hai');
  else if (r4.coDW || r4.coELF) fail('lớp niệm chú / bắn nỏ không được nhận nhát chém thứ hai');
  else pass('nhát hai đúng hai lớp cầm kiếm');

  // ── 5. Không lớp nào rơi về hình vẽ đường ─────────────────────────────────
  const r5 = {};
  for (const sect of ['thieulam','baidasan','toanchan','minhgiao','bug']){
    r5[sect] = await p.evaluate(async (sk) => {
      startGame(sk, null);
      await new Promise(r => setTimeout(r, 1400));
      applyTestBoost(); calcDerived();
      await new Promise(r => setTimeout(r, 900));
      return window.__veThan;
    }, sect);
  }
  console.log('5.', JSON.stringify(r5));
  const veo = Object.entries(r5).filter(([, v]) => v !== 'sprite');
  if (veo.length) fail(`rơi về hình vẽ đường: ${veo.map(x => x[0]).join(', ')}`);
  else pass('cả 5 lớp vẽ bằng bảng khung art');

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('có pageerror');
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
