// Hai cơ chế boss NẶNG — Vỡ Giáp và Đảo Vùng An Toàn — chỉ thuộc boss PHÓ BẢN.
//
// Bản đầu của bài kiểm này đòi điều NGƯỢC LẠI: rải hai chiêu đó cho Tướng Quân và Vệ Binh Trụ
// ngoài map, lấy lý do 28 boss vùng đều chỉ hỏi một câu "đừng đứng đó". Nhưng test_bossmoves.js
// và test_dungeon2.js đã chốt từ trước rằng cơ chế nặng phải nằm trong phó bản, vì boss ngoài map
// thì đi ngang qua cũng gặp — nhét chú huỷ diệt vào đó là quá tay với người chỉ định băng qua bản
// đồ. Lý do đó vẫn đứng vững, nên phần phân bổ ở đây đã rút lại và chỉ giữ mệnh đề ngược: boss
// ngoài map KHÔNG được mượn cơ chế phó bản.
//
// Còn lại là hai mệnh đề về bản thân cơ chế, đo trên boss phó bản — chỗ chúng thật sự chạy:
//   vogiap  — 4 cầu giáp sinh ra, phá hết thì đòn bị huỷ (nếu không, cơ chế vô nghĩa)
//   daovung — ô sáng phải đặt XA boss, không thì đứng nguyên tại chỗ cũng thắng
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8861/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(800);

  // 1. Ranh giới: cơ chế nặng nằm trong phó bản, không rò ra boss ngoài map
  const r1 = await p.evaluate(() => {
    const NANG = ['vogiap','daovung'];
    const roRa = [], phoBan = [];
    for (const id in BOSS_DEFS){
      const d = BOSS_DEFS[id];
      for (const t of [...(d.thuve||[]), d.tranai].filter(Boolean))
        if (t.moves.some(v => NANG.includes(v))) roRa.push(id+'/'+t.id);
    }
    for (const k in MOBS)
      if ((MOBS[k].moves||[]).some(v => NANG.includes(v))) phoBan.push(k);
    return { roRa, phoBan };
  });
  console.log('1) cơ chế nặng — rò ra ngoài map:', JSON.stringify(r1.roRa),
              '· boss phó bản dùng:', r1.phoBan.length);
  if (r1.roRa.length) fail(`boss ngoài map mượn cơ chế phó bản: ${r1.roRa.join(', ')}`);
  if (!r1.phoBan.length) fail('không boss phó bản nào dùng hai cơ chế này — chúng thành code chết');

  // 2. Vỡ Giáp: 4 cầu giáp, phá hết thì đòn bị huỷ
  const r2 = await p.evaluate(async () => {
    travelTo('tuongduong'); travelTo('ngoai');
    applyTestBoost && applyTestBoost();
    mobs.length = 0;
    const bo = spawnMob('boss_hacphong', { x: player.x + 150, y: player.y, r: 1, count: 1 }, null);
    if (!bo) return { loi:'không thả được boss phó bản' };
    bo.hp = bo.maxHp = 1e9;
    bossStartTele(bo, 'vogiap');
    await new Promise(r => setTimeout(r, 400));
    const orbs = mobs.filter(m => m.type === 'bossorb' && !m.dead);
    const truoc = bo.tele ? bo.tele.t : null;
    orbs.forEach(o => { o.hp = 0; o.dead = true; });          // phá hết cầu giáp
    await new Promise(r => setTimeout(r, 400));
    return { soCauGiap: orbs.length, conLaiSauKhiPha: mobs.filter(m=>m.type==='bossorb'&&!m.dead).length,
      teleTruoc: truoc, teleSau: bo.tele ? bo.tele.t : 'đã huỷ đòn',
      cauGiapLaMucTieuSpace: (() => { bo.tele = null;
        const t = nearestMob(400); return t ? t.def.name : null; })() };
  });
  console.log('2) Vỡ Giáp:', JSON.stringify(r2));
  if (r2.loi) fail(r2.loi);
  else {
    if (r2.soCauGiap !== 4) fail(`sinh ${r2.soCauGiap} cầu giáp, phải là 4`);
    if (r2.teleSau !== 0 && r2.teleSau !== 'đã huỷ đòn')
      fail('phá hết cầu giáp mà đòn vẫn niệm tiếp — cơ chế vô nghĩa');
  }

  // 3. Đảo Vùng: ô sáng phải đặt XA boss, kể cả khi boss đứng sát mép bản đồ.
  // Phép kẹp vào biên từng kéo ô sáng ngược về phía boss, xuống còn 233px trong khi bán kính ô là
  // 200 — người đứng sát boss đã nằm sẵn trong vùng an toàn. Nên phải đo Ở GÓC, không đo giữa map.
  const r3 = await p.evaluate(async () => {
    mobs.length = 0;
    const bo = spawnMob('boss_hacphong', { x: player.x, y: player.y, r: 1, count: 1 }, null);
    if (!bo) return { loi:'không thả được boss phó bản' };
    const cach = [];
    for (const [gx, gy] of [[120,120],[MAP.w-120,120],[120,MAP.h-120],[MAP.w-120,MAP.h-120],[MAP.w/2,MAP.h/2]]){
      bo.x = gx; bo.y = gy;
      for (let i=0;i<8;i++){
        bo.tele = null;
        bossStartTele(bo, 'daovung');
        if (bo.tele && bo.tele.sx != null) cach.push(Math.round(dist(bo.x, bo.y, bo.tele.sx, bo.tele.sy)));
      }
    }
    bo.tele = null;
    return { khoangCachOSang: cach, banKinhOSang: BOSS_MOVES.daovung.r };
  });
  console.log('3) ô sáng cách boss — 40 lần kể cả 4 góc, gần nhất:',
    r3.khoangCachOSang ? Math.min(...r3.khoangCachOSang) : '?', '· bán kính ô:', r3.banKinhOSang);
  if (r3.loi) fail(r3.loi);
  else if (r3.khoangCachOSang.some(d => d < r3.banKinhOSang + 60))
    fail('ô sáng quá gần boss — đứng nguyên tại chỗ cũng an toàn, chiêu mất ý nghĩa');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
