// Chúa Tể Vực Nứt — 6 giờ thật/lần (0h·6h·12h·18h = 4 lượt/ngày).
// Bài học từ Hung Thần/Xâm Lăng Vàng: mốc giờ phải tính lại được từ đồng hồ thật, nên test
// bơm thẳng nhiều mốc thời gian giả vào riftNextBoundary thay vì chờ đồng hồ chạy.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION|ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  // ---- 1. Lịch: đúng 4 mốc/ngày, luôn nhảy TỚI, cách nhau đúng 6 tiếng ----
  const sched = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    travelTo('daohoa');   // Lunaris City không phải bãi săn — vực nứt cố tình KHÔNG mở trong thành
    player.level = 40; calcDerived();
    const hours = [], gaps = [];
    // rải 24 điểm xuất phát trong ngày, mỗi điểm lệch 37 phút cho khỏi rơi đúng đầu giờ
    let t = new Date(); t.setHours(0, 37, 12, 0);
    let base = t.getTime();
    for (let i = 0; i < 24; i++){
      const nb = riftNextBoundary(base + i*3600000);
      hours.push(new Date(nb).getHours());
      if (nb <= base + i*3600000) gaps.push('KHONG_TIEN:' + i);
    }
    // chuỗi liên tiếp
    let cur = riftNextBoundary(base), seq = [cur];
    for (let i = 0; i < 5; i++){ cur = riftNextBoundary(cur + 60000); seq.push(cur); }
    const deltas = seq.slice(1).map((v, i) => (v - seq[i]) / 3600000);
    return { gioDuoc: [...new Set(hours)].sort((a,b)=>a-b), khoangCach: deltas, loi: gaps,
             soLuotMotNgay: 24 / 6, gioDauNgay: new Date(seq[0]).getHours() };
  });
  console.log('lịch:', JSON.stringify(sched));
  const want = [0, 6, 12, 18];
  if (JSON.stringify(sched.gioDuoc) !== JSON.stringify(want)) fail(`mốc giờ ${JSON.stringify(sched.gioDuoc)}, cần ${JSON.stringify(want)}`);
  if (!sched.khoangCach.every(d => d === 6)) fail(`khoảng cách ${JSON.stringify(sched.khoangCach)}, cần toàn 6 tiếng`);
  if (sched.loi.length) fail(`boundary không tiến: ${sched.loi.join(',')}`);

  // ---- 1b. Trong thành thì KHÔNG được nứt ----
  const city = await p.evaluate(() => {
    RIFT = { next: 0, warned: false, active: true, endsAt: Date.now() + 600000, done: {}, kills: 0 };
    const cur = curMap; travelTo('tuongduong');
    const r = { trongThanh: riftCanSpawn(), map: curMap };
    mobs = mobs.filter(m => m.type !== 'rift');
    travelTo(cur);                       // vào lại bãi săn → hook vào-map phải dựng boss ngay
    r.bossNgoaiBai = mobs.filter(m => m.type === 'rift' && !m.dead).length;
    RIFT.active = false; RIFT.done = {}; mobs = mobs.filter(m => m.type !== 'rift');
    return r;
  });
  console.log('thành an toàn:', JSON.stringify(city));
  if (city.trongThanh) fail('vực nứt mở ngay trong Lunaris City (map an toàn, không có bãi quái)');
  if (city.bossNgoaiBai !== 1) fail(`ra bãi săn mà hook vào-map dựng ${city.bossNgoaiBai} boss, cần đúng 1`);

  // ---- 1c. Chốt cấp: dưới RIFT_MIN_LV thì vực không nứt (ảnh chụp: lv1 bị boss đấm chết) ----
  const gate = await p.evaluate(() => {
    RIFT = { next: 0, warned: false, active: true, endsAt: Date.now() + 600000, done: {}, kills: 0 };
    const lv = player.level;
    player.level = RIFT_MIN_LV - 1; const duoiChot = riftCanSpawn();
    player.level = RIFT_MIN_LV;     const dungChot = riftCanSpawn();
    player.level = lv; calcDerived();
    // cấp boss phải bám cấp người chơi, không phải cấp map
    RIFT.done = {}; const m = spawnRiftBoss();
    const r = { duoiChot, dungChot, capBoss: m.def.lv, capNguoiChoi: player.level, aggro: m.def.aggro,
                rongMap: MAP.w };
    m.dead = true; mobs = mobs.filter(x => x.type !== 'rift');
    RIFT.active = false; RIFT.done = {};
    return r;
  });
  console.log('chốt cấp:', JSON.stringify(gate));
  if (gate.duoiChot) fail(`cấp ${gate.capNguoiChoi} — vực vẫn nứt dưới chốt cấp ${'RIFT_MIN_LV'}`);
  if (!gate.dungChot) fail('đủ chốt cấp rồi mà vực vẫn không nứt');
  if (gate.capBoss <= gate.capNguoiChoi) fail(`boss cấp ${gate.capBoss} không cao hơn người chơi cấp ${gate.capNguoiChoi}`);
  if (gate.capBoss > gate.capNguoiChoi + 12) fail(`boss cấp ${gate.capBoss} vượt quá xa người chơi cấp ${gate.capNguoiChoi}`);
  if (gate.aggro >= gate.rongMap) fail(`aggro ${gate.aggro} phủ cả map (${gate.rongMap}) — boss sẽ săn người chơi khắp bãi`);

  // ---- 2. Cảnh báo 15 phút trước ----
  const warn = await p.evaluate(() => {
    RIFT = { next: Date.now() + 14*60000, warned: false, active: false, endsAt: 0, done: {}, kills: 0 };
    zoneBanner = null; updateRift();
    return { warned: RIFT.warned, active: RIFT.active, banner: zoneBanner && zoneBanner.text };
  });
  console.log('cảnh báo:', JSON.stringify(warn));
  if (!warn.warned) fail('chưa báo trước dù còn 14 phút (ngưỡng 15 phút)');
  if (warn.active) fail('mở cửa vực quá sớm');

  // ---- 3. Kích hoạt: boss hiện ra ngay map đang đứng ----
  const act = await p.evaluate(() => {
    RIFT = { next: Date.now() - 1000, warned: true, active: false, endsAt: 0, done: {}, kills: 0 };
    mobs = mobs.filter(m => m.type !== 'rift');
    zoneBanner = null; updateRift();
    const m = mobs.find(x => x.type === 'rift');
    return { active: RIFT.active, banner: zoneBanner && zoneBanner.text,
             conLai: Math.round((RIFT.endsAt - Date.now()) / 60000),
             lichSau: new Date(RIFT.next).getHours(),
             co: !!m, ten: m && m.name, cap: m && m.def.lv, mau: m && m.maxHp,
             danhDau: Object.keys(RIFT.done) };
  });
  console.log('kích hoạt:', JSON.stringify(act));
  if (!act.active) fail('không kích hoạt dù đã qua mốc');
  if (act.conLai !== 45) fail(`cửa mở ${act.conLai} phút, cần 45`);
  if (act.lichSau % 6 !== 0) fail(`lịch kế tiếp rơi vào ${act.lichSau}h, không chia hết 6`);
  if (!act.co) fail('không spawn boss ở map đang đứng');
  if (act.danhDau.length !== 1) fail(`đánh dấu map sai: ${JSON.stringify(act.danhDau)}`);

  // ---- 4. Không spawn trùng trên cùng một map ----
  const dup = await p.evaluate(() => {
    const before = mobs.filter(m => m.type === 'rift').length;
    const can = riftCanSpawn();
    if (can) spawnRiftBoss();
    return { truoc: before, choPhep: can, sau: mobs.filter(m => m.type === 'rift').length };
  });
  console.log('chống trùng:', JSON.stringify(dup));
  if (dup.choPhep) fail('vẫn cho spawn lại trên map đã có boss');
  if (dup.sau !== dup.truoc) fail('spawn trùng boss trên cùng map');

  // ---- 5. Hạ boss: Bảo Hạp + 2 Hỗn Độn Châu, đếm đủ 3 lượt rồi đóng cửa ----
  const kill = await p.evaluate(() => {
    const snap = () => ({ hap: Object.values(player.baohap).reduce((a,b)=>a+b,0), honDon: player.jewels.honDon });
    const b0 = snap();
    const log = [];
    for (let i = 0; i < 3; i++){
      // mở lại quyền spawn cho vòng sau (giả lập chạy sang map khác)
      RIFT.done = {};
      if (!mobs.some(m => m.type === 'rift' && !m.dead)) spawnRiftBoss();
      const m = mobs.find(x => x.type === 'rift' && !x.dead);
      m.hp = 1; killMob(m, 'hit');
      log.push({ lan: i+1, kills: RIFT.kills, active: RIFT.active, banner: zoneBanner && zoneBanner.text });
    }
    const b1 = snap();
    return { hapThem: b1.hap - b0.hap, honDonThem: b1.honDon - b0.honDon, log,
             bacHap: riftBoxTier(), capNguoiChoi: player.level, map: curMap,
             conBossSong: mobs.filter(m => m.type === 'rift' && !m.dead).length };
  });
  console.log('hạ boss:', JSON.stringify(kill, null, 1));
  if (kill.bacHap !== Math.min(7, Math.floor(kill.capNguoiChoi/15) + 2)) fail(`bậc Bảo Hạp ${kill.bacHap} không khớp cấp người chơi ${kill.capNguoiChoi}`);
  if (kill.hapThem !== 3) fail(`3 lượt hạ boss chỉ được ${kill.hapThem} Bảo Hạp`);
  if (kill.honDonThem !== 6) fail(`Hỗn Độn Châu +${kill.honDonThem}, cần +6 (2/con)`);
  if (kill.log[2].active) fail('hạ đủ 3 con rồi mà cửa vực chưa đóng');
  if (kill.log[0].active !== true || kill.log[1].active !== true) fail('cửa đóng sớm trước khi đủ 3 con');
  if (kill.conBossSong) fail('còn boss sống sau khi cửa đóng');

  // ---- 6. Hết giờ: boss biến mất, state sạch ----
  const exp = await p.evaluate(() => {
    RIFT = { next: Date.now() + 6*3600000, warned: false, active: true, endsAt: Date.now() - 1, done: {}, kills: 0 };
    if (!mobs.some(m => m.type === 'rift' && !m.dead)) spawnRiftBoss();
    const truoc = mobs.filter(m => m.type === 'rift' && !m.dead).length;
    zoneBanner = null; updateRift();
    return { truoc, sau: mobs.filter(m => m.type === 'rift' && !m.dead).length,
             active: RIFT.active, kills: RIFT.kills, done: Object.keys(RIFT.done).length,
             banner: zoneBanner && zoneBanner.text };
  });
  console.log('hết giờ:', JSON.stringify(exp));
  if (exp.truoc !== 1) fail('test hỏng: không dựng được boss trước khi hết giờ');
  if (exp.sau !== 0) fail('hết giờ mà boss còn đứng đó');
  if (exp.active || exp.kills || exp.done) fail('state chưa được dọn sạch khi đóng cửa');

  // ---- 7. Bảng sự kiện phải có dòng Vực Nứt, không lọt danh từ riêng MU ----
  const board = await p.evaluate(() => {
    RIFT = { next: riftNextBoundary(Date.now()), warned: false, active: false, endsAt: 0, done: {}, kills: 0 };
    const rows = eventList(Date.now());
    const r = rows.find(x => x.icon === '✹');
    return { soDong: rows.length, co: !!r, ten: r && r.name, sub: r && r.sub,
             ke: (nextEventInfo(Date.now()) || {}).name };
  });
  console.log('bảng sự kiện:', JSON.stringify(board));
  if (!board.co) fail('bảng sự kiện thiếu dòng Chúa Tể Vực Nứt');
  if (!/6 tiếng\/lần/.test(board.sub || '')) fail(`dòng bảng không nói rõ nhịp 6 tiếng: ${board.sub}`);
  const BAN = /Kundun|Lorencia|Noria|Devias|Icarus|Atlans|Tarkan|Fairy Elf|Magic Gladiator|Devil Square|Blood Castle|cảnh giới|đan điền|chân khí|môn phái|giang hồ|độ kiếp|phi thăng/i;
  for (const [k, v] of Object.entries(board)) if (typeof v === 'string' && BAN.test(v)) fail(`text lộ từ cấm (${k}): ${v}`);
  if (BAN.test(kill.log.map(x=>x.banner).join(' ') + ' ' + act.banner + ' ' + warn.banner)) fail('banner lộ từ cấm');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
