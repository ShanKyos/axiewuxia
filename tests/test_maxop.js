// ?max=1 phải phủ ĐỦ mọi hệ, kể cả các hệ mới. Trước đây applyTestBoost() viết trước hệ Khắc
// Ấn / bộ Cổ Thần / Linh Dực cấp 2 nên bật max mode vẫn không thấy chúng ở đâu.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const out = {};
  for (const sect of ['thieulam','baidasan','toanchan','minhgiao','bug']){
    out[sect] = await p.evaluate((sk) => {
      window.TEST_MODE = true;
      startGame(sk, null);
      applyTestBoost(); calcDerived();
      const eq = player.equip;
      const arm = HERO_ARMOR_SLOTS.map(k => eq[k]).filter(Boolean);
      const gv = gearVisual(player);
      return {
        cap: player.level,
        oDayDu: SLOTS.filter(s => eq[s.id]).length + '/' + SLOTS.length,
        phamCaoNhat: Math.max(...Object.values(eq).map(i => i.rarity || 0)),
        renTrungBinh: +(arm.reduce((a,i)=>a+(i.plus||0),0) / Math.max(1,arm.length)).toFixed(1),
        boCoThan: (player.setActive && Object.entries(player.setActive).map(([k,v])=>`${k} ${v.n}/5`).join(',')) || '(không)',
        khacAnDangCo: Object.keys(player.sigils || {}).length,
        khacAnCoThe: sigilPool(player.sect).length,
        canhCap2: !!(eq.canh && eq.canh.wing2),
        canhTen: eq.canh ? eq.canh.name : '(không)',
        thanBinh: (player.thanbinh||{}).tier,
        chau: Object.values(player.jewels||{}).reduce((a,b)=>a+b,0),
        baoHap: Object.values(player.baohap||{}).reduce((a,b)=>a+b,0),
        heroTier: heroTier(player),
        gvT: gv ? +gv.t.toFixed(1) : 0,
        gvPlus: gv ? +gv.plus.toFixed(1) : 0,
        mocRen: gv ? plusStage(gv.plus) : -1,
        boGiap: heroSet(player.sect, gv ? gv.t : 0).name,
        boGiapMongDoi: HERO_SETS[sk][4].name,
        tuiCoKhacAn: (player.inv||[]).filter(i => i.sigil).length,
      };
    }, sect);
  }
  for (const [k,v] of Object.entries(out)) console.log(k.padEnd(10), JSON.stringify(v));

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  for (const [sect, r] of Object.entries(out)){
    if (r.cap !== 120) fail(`${sect}: chưa max cấp (${r.cap})`);
    if (r.phamCaoNhat !== 4) fail(`${sect}: phẩm cao nhất mới ${r.phamCaoNhat}, cần 4 (Chí Tôn)`);
    if (r.renTrungBinh !== 11) fail(`${sect}: rèn trung bình ${r.renTrungBinh}, cần 11`);
    if (!/\b5\/5\b/.test(r.boCoThan)) fail(`${sect}: bộ Cổ Thần chưa đủ 5 (${r.boCoThan})`);
    if (r.khacAnDangCo !== r.khacAnCoThe) fail(`${sect}: mới có ${r.khacAnDangCo}/${r.khacAnCoThe} Khắc Ấn`);
    if (!r.canhCap2) fail(`${sect}: cánh vẫn là cấp 1 (${r.canhTen})`);
    if (!(r.chau >= 300)) fail(`${sect}: chưa cấp châu (${r.chau})`);
    if (!(r.baoHap >= 50)) fail(`${sect}: chưa cấp Bảo Hạp (${r.baoHap})`);
    if (r.heroTier !== 10) fail(`${sect}: heroTier ${r.heroTier}, cần 10`);
    if (r.mocRen !== 3) fail(`${sect}: mốc cường hoá ${r.mocRen}, cần 3 (+10 trở lên)`);
    if (!(r.tuiCoKhacAn >= 4)) fail(`${sect}: túi chưa có đồ mang Khắc Ấn (${r.tuiCoKhacAn})`);
    if (r.boGiap !== r.boGiapMongDoi) fail(`${sect}: bộ giáp "${r.boGiap}", cần "${r.boGiapMongDoi}"`);
  }
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
