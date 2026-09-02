// Đồ rơi dưới đất. Khảo sát trước bản này đo được: 33% số kill IM LẶNG TUYỆT ĐỐI, tiếng ngọc
// bị debounce nuốt 100%, và túi đầy thì 50/50 món bốc hơi không một lời cảnh báo.
// Test này đo lại đúng ba con số đó cộng vòng đời vật thể dưới đất.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION|ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  // autoEquip nay bật sẵn cho nhân vật mới — bài này đếm món trong TÚI sau khi nhặt, nên tắt.
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); player.autoEquip = false; travelTo('comoc');
    player.level = 50; calcDerived(); player.autoSell = false; player.auto = false; });

  // ---- 1. Farm 300 con: đồ và ngọc phải NẰM DƯỚI ĐẤT, không nhảy thẳng vào túi ----
  const farm = await p.evaluate(() => {
    const md = MAPS[curMap], q = md.packs[2];
    const invT = player.inv.length, jT = Object.values(player.jewels).reduce((a,b)=>a+b,0);
    let roi = 0, ngoc = 0, imLang = 0;
    groundLoot = [];
    for (let i = 0; i < 300; i++){
      player.x = 200; player.y = 200;               // đứng thật xa để KHÔNG bị tự hút
      const m = spawnMob(q.mob, { x:1600, y:1600, r:20 }, null, true);
      const g0 = groundLoot.length;
      m.hp = 1; killMob(m, 'hit');
      const d = groundLoot.length - g0;
      if (!d) imLang++;
      for (let k = g0; k < groundLoot.length; k++) groundLoot[k].k === 'jewel' ? ngoc++ : roi++;
      mobs = mobs.filter(x => x !== m);
      if (groundLoot.length > 40) groundLoot = [];   // tránh chạm trần LOOT_MAX làm sai phép đếm
    }
    return { roi, ngoc, imLang, vaoTuiThang: player.inv.length - invT,
             ngocCongThang: Object.values(player.jewels).reduce((a,b)=>a+b,0) - jT };
  });
  console.log('farm 300:', JSON.stringify(farm));
  if (farm.vaoTuiThang !== 0) fail(`${farm.vaoTuiThang} món vẫn nhảy thẳng vào túi, phải rơi xuống đất hết`);
  if (farm.ngocCongThang !== 0) fail(`${farm.ngocCongThang} ngọc vẫn cộng thẳng, phải rơi xuống đất`);
  if (!(farm.roi > 10)) fail(`chỉ ${farm.roi} món rơi xuống đất trong 300 kill — nghi bảng rơi hỏng`);
  if (!farm.ngoc) fail('300 kill không viên ngọc nào rơi xuống đất');

  // ---- 2. Nhặt: đi ngang qua, bấm J, bấm chuột ----
  const nhat = await p.evaluate(() => {
    groundLoot = []; player.inv = []; player.x = 900; player.y = 900;
    const it = genItem(50, 0, 'elite');
    const g = dropToGround({ k:'item', it }, 3000, 3000);   // xa, không tự hút
    g.z = 0; g.vz = 0;
    const xaThiKhongHut = (updateGroundLoot(0.016), groundLoot.length);
    // bấm chuột trúng món khi ở ngoài tầm với → KHÔNG được nhặt
    const bamXa = tryPickLoot(g.x, g.y);
    // lại gần rồi bấm J
    player.x = g.x - 60; player.y = g.y;
    const bamJ = tryPickLoot();
    const trongTui = player.inv.length;
    // đi ngang qua
    const g2 = dropToGround({ k:'jewel', jk:'honDon' }, 3000, 3000); g2.z = 0; g2.vz = 0; g2.fly = 1;
    const j0 = player.jewels.honDon;
    player.x = g2.x + 20; player.y = g2.y;
    updateGroundLoot(0.016);
    return { xaThiKhongHut, bamXa, bamJ, trongTui, conLai: groundLoot.length,
             ngocTang: player.jewels.honDon - j0 };
  });
  console.log('nhặt:', JSON.stringify(nhat));
  if (nhat.xaThiKhongHut !== 1) fail('đồ ở xa vẫn bị hút vào túi');
  if (nhat.bamXa) fail('bấm chuột từ ngoài tầm với vẫn nhặt được — sẽ nhặt xuyên map');
  if (!nhat.bamJ || nhat.trongTui !== 1) fail('bấm J cạnh món đồ không nhặt được');
  if (nhat.ngocTang !== 1) fail('đi ngang qua viên ngọc không nhặt được');
  if (nhat.conLai !== 0) fail(`còn ${nhat.conLai} món dưới đất sau khi nhặt hết`);

  // ---- 3. TÚI ĐẦY: đồ phải NẰM LẠI + đổi nhãn, KHÔNG mất trắng ----
  const day = await p.evaluate(() => {
    groundLoot = []; player.inv = [];
    for (let i = 0; i < 30; i++) player.inv.push(genItem(50, 0, 'mob'));
    const g = dropToGround({ k:'item', it: genItem(50, 0, 'elite') }, 3000, 3000);
    g.z = 0; g.vz = 0; g.fly = 1; player.x = g.x; player.y = g.y;
    updateGroundLoot(0.016);
    const r = { conDuoiDat: groundLoot.length, nhanTuiDay: !!(groundLoot[0] && groundLoot[0].full),
                tui: player.inv.length };
    // dọn 1 ô rồi đi qua lại → phải nhặt được
    player.inv.pop(); updateGroundLoot(0.016);
    r.sauKhiDonTui = groundLoot.length; r.tuiSau = player.inv.length;
    return r;
  });
  console.log('túi đầy:', JSON.stringify(day));
  if (day.conDuoiDat !== 1) fail('túi đầy mà đồ vẫn bốc hơi — đúng lỗi cũ');
  if (!day.nhanTuiDay) fail('đồ nằm lại nhưng không đổi nhãn cảnh báo TÚI ĐẦY');
  if (day.sauKhiDonTui !== 0 || day.tuiSau !== 30) fail('dọn túi rồi vẫn không nhặt lại được');

  // ---- 4. Hết hạn + trần cứng + đổi map thì sạch ----
  const doi = await p.evaluate(() => {
    groundLoot = []; player.inv = []; player.x = 100; player.y = 100;
    for (let i = 0; i < LOOT_MAX + 15; i++) dropToGround({ k:'item', it: genItem(50,0,'mob') }, 3000, 3000);
    const tran = groundLoot.length;
    groundLoot.forEach(g => { g.z = 0; g.vz = 0; g.t = 0.01; });
    updateGroundLoot(0.02);
    const sauHetHan = groundLoot.length;
    dropToGround({ k:'item', it: genItem(50,0,'mob') }, 3000, 3000);
    travelTo('ngoai');
    return { tran, sauHetHan, sauDoiMap: groundLoot.length, ttl: LOOT_TTL };
  });
  console.log('vòng đời:', JSON.stringify(doi));
  if (doi.tran > 60) fail(`trần cứng hỏng: ${doi.tran} món dưới đất`);
  if (doi.sauHetHan !== 0) fail('hết hạn mà đồ vẫn nằm đó');
  if (doi.sauDoiMap !== 0) fail('đổi map mà đồ map cũ vẫn còn — sẽ hiện lơ lửng ở map mới');

  // ---- 5. AUTO phải hút xa hơn, không thì treo máy = cày vào hư không ----
  const auto = await p.evaluate(() => {
    travelTo('comoc'); groundLoot = []; player.inv = []; player.x = 900; player.y = 900;
    const mk = () => { const g = dropToGround({ k:'item', it: genItem(50,0,'mob') }, 900 + 180, 900);
                       g.z = 0; g.vz = 0; g.fly = 1; return g; };
    player.auto = false; mk(); updateGroundLoot(0.016);
    const khiTat = groundLoot.length;
    player.auto = true; updateGroundLoot(0.016);
    const khiBat = groundLoot.length;
    player.auto = false;
    return { khiTat, khiBat };
  });
  console.log('auto:', JSON.stringify(auto));
  if (auto.khiTat !== 1) fail('AUTO tắt mà vẫn hút đồ cách 180px');
  if (auto.khiBat !== 0) fail('AUTO bật mà không hút đồ cách 180px — treo máy sẽ bỏ lại cả bãi');

  // ---- 6. Ngọc phải có âm RIÊNG, không bị debounce 'coin' nuốt ----
  const am = await p.evaluate(() => {
    const seen = [];
    const orig = AudioSys.sfx.bind(AudioSys);
    AudioSys.sfx = (n, v) => { seen.push(n); return orig(n, v); };
    groundLoot = []; player.x = 100; player.y = 100;
    const md = MAPS[curMap], q = md.packs[2];
    let lan = 0;
    for (let i = 0; i < 400 && lan < 3; i++){
      const m = spawnMob(q.mob, { x:1600, y:1600, r:20 }, null, true);
      seen.length = 0; const g0 = groundLoot.length;
      m.hp = 1; killMob(m, 'hit');
      mobs = mobs.filter(x => x !== m);
      if (groundLoot.slice(g0).some(g => g.k === 'jewel')){ lan++;
        if (!seen.includes('forge_ok')) return { loi: 'ngọc rơi mà không gọi âm riêng: ' + seen.join(',') }; }
      groundLoot = [];
    }
    AudioSys.sfx = orig;
    return { lan, ok: lan === 3 };
  });
  console.log('âm ngọc:', JSON.stringify(am));
  if (am.loi) fail(am.loi);
  if (!am.ok) fail('không đo đủ 3 lần rơi ngọc');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
