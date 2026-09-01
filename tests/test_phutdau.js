// Phút đầu tiên của người chơi mới. Ba thứ đo được, không phải cảm tính:
//   · cấp 1 có gì để BẤM ngoài phím Space
//   · từ điểm thả tới con quái đầu tiên bao xa
//   · bao lâu tới món đồ đầu tiên
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8861/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', { name:'Newbie' }); });
  await p.waitForTimeout(900);

  // 1. Cấp 1 phải có chiêu của LỚP mình, không chỉ mỗi phím Space
  const r1 = await p.evaluate(() => {
    const mo = [];
    for (const id in SKILL_DEFS){ const i = skillInfo(id); if (i && i.unlocked) mo.push(i.name); }
    return { cap: player.level, chieuMo: mo, tenChieuChinh: (SECTS[player.sect].skillA||{}).name };
  });
  console.log('1) cấp 1 mở sẵn:', JSON.stringify(r1));
  if (r1.cap !== 1) fail('không phải nhân vật cấp 1');
  if (!r1.chieuMo.length) fail('cấp 1 không mở được chiêu nào — cả phút đầu chỉ có một nút bấm');
  else if (!r1.chieuMo.includes(r1.tenChieuChinh))
    fail(`cấp 1 chưa mở chiêu chính của lớp (${r1.tenChieuChinh}) — người chơi đã chọn lớp từ phút 0`);

  // 2. Quái đầu tiên phải THẤY được từ điểm thả, không phải đi tìm
  const r2 = await p.evaluate(() => {
    const md = MAPS.daohoa, sp = md.spawn;
    const g = md.packs.map(k => ({ mob:k.mob, n:k.n,
      cach: Math.round(dist(sp.x, sp.y, k.x, k.y)) })).sort((a,c)=>a.cach-c.cach)[0];
    return { baiGanNhat: g, nuaManHinh: Math.round(Math.min(W,H)/2) };
  });
  console.log('2) bãi quái gần điểm thả nhất:', JSON.stringify(r2));
  if (r2.baiGanNhat.cach > 400)
    fail(`bãi đầu tiên cách ${r2.baiGanNhat.cach}px — người mới phải đi bộ trong im lặng trước khi thấy quái`);

  // 3. Món đồ đầu tiên phải rơi trong vài con đầu, không phải sau ~17 con
  const r3 = await p.evaluate(async () => {
    travelTo('daohoa');
    const k = MAPS.daohoa.packs.map(x => ({ ...x, d: dist(MAPS.daohoa.spawn.x, MAPS.daohoa.spawn.y, x.x, x.y) }))
      .sort((a,c)=>a.d-c.d)[0];
    player.x = k.x; player.y = k.y; player.auto = false;
    player.kills = 0; player._daRoiMonDau = false;
    const truoc = groundLoot.length;
    let haDuoc = 0;
    for (let i = 0; i < 3 && haDuoc < 3; i++){
      const m = mobs.find(x => !x.dead && !x.def.bossKind && dist(player.x,player.y,x.x,x.y) < 300);
      if (!m) break;
      hurtMob(m, 999999, 'hit');
      haDuoc++;
      await new Promise(r => setTimeout(r, 200));
    }
    return { soConHa: haDuoc, doRoi: groundLoot.length - truoc };
  });
  console.log('3) ba con đầu đời:', JSON.stringify(r3));
  if (r3.soConHa < 1) fail('không hạ được con nào để kiểm');
  else if (r3.doRoi < 1)
    fail('ba con đầu đời không rơi món nào — người mới đánh gần một phút mà không thấy gì rơi ra');

  // 4. Bảo đảm chỉ áp dụng cho NHÂN VẬT MỚI, không phải mãi mãi
  const r4 = await p.evaluate(async () => {
    player.kills = 50; player._daRoiMonDau = true;
    const truoc = groundLoot.length; let n = 0;
    for (let i = 0; i < 12; i++){
      const m = mobs.find(x => !x.dead && !x.def.bossKind && dist(player.x,player.y,x.x,x.y) < 400);
      if (!m) break;
      hurtMob(m, 999999, 'hit'); n++;
      await new Promise(r => setTimeout(r, 120));
    }
    return { haThem: n, roiThem: groundLoot.length - truoc };
  });
  console.log('4) sau khi đã qua giai đoạn tân thủ:', JSON.stringify(r4));
  if (r4.haThem > 6 && r4.roiThem >= r4.haThem)
    fail('bảo đảm rơi đồ vẫn áp dụng sau giai đoạn tân thủ — lạm phát đồ');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
