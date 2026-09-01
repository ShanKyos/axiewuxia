// Xâm Lăng Vàng + Đồng Hồ Thế Giới + Bảng Sự Kiện:
// mốc giờ lệch pha với Hung Thần, spawn/goldify không phá def gốc, rơi đúng Bảo Hạp,
// quét sạch / hết giờ đều đóng sự kiện, quái vàng không hồi sinh, UI render sạch.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    player.level = 120; calcDerived();
    const out = {};

    // 1) mốc giờ: Hung Thần chẵn 4h, Đàn Vàng lệch +2h → xen kẽ mỗi 2 giờ
    const t0 = new Date('2026-08-30T07:15:00').getTime();
    out.boundaries = {
      maton: new Date(matonNextBoundary(t0)).getHours(),   // kỳ vọng 8
      golden: new Date(goldenNextBoundary(t0)).getHours(), // kỳ vọng 10
      matonMod4: new Date(matonNextBoundary(t0)).getHours() % 4,   // 0
      goldenMod4: new Date(goldenNextBoundary(t0)).getHours() % 4, // 2
    };

    // 2) kích hoạt: ép mốc về quá khứ rồi update
    GOLDEN.next = Date.now() - 1000; GOLDEN.warned = true;
    updateGolden();
    out.activated = { active: GOLDEN.active, map: GOLDEN.map,
      bannerHasVang: (zoneBanner && zoneBanner.text.includes('XÂM LĂNG VÀNG')) || false };

    // 3) vào map sự kiện → đàn vàng spawn
    travelTo(GOLDEN.map);
    const gold = mobs.filter(m => m.def && m.def.golden);
    const tier = GOLDEN_BOX[GOLDEN.map];
    out.spawn = {
      count: gold.length, left: GOLDEN.left,
      allNamedVang: gold.every(m => / Vàng$|Chúa Đàn Vàng/.test(m.name)),
      leader: gold.filter(m => m.def.goldenLeader).length,
      boxTiers: [...new Set(gold.map(m => m.def.goldBox))].sort(),
      tierExpected: [tier, Math.min(5, tier + 1)].filter((v,i,a)=>a.indexOf(v)===i).sort(),
      originalsClean: Object.values(MOBS).every(d => !d.golden && !d.goldBox),
      noneRespawnable: gold.every(m => m.zone === null),
    };

    // 4) giết 1 con → nhận đúng Bảo Hạp, đếm lùi
    const before = Object.assign({}, player.baohap);
    const victim = gold.find(m => !m.def.goldenLeader);
    hurtMob(victim, 10 ** 9, 'hit');
    out.kill1 = {
      boxGained: (player.baohap[victim.def.goldBox] || 0) - (before[victim.def.goldBox] || 0),
      leftAfter: GOLDEN.left, stillActive: GOLDEN.active,
    };
    // quái vàng chết không hồi sinh
    for (let i = 0; i < 140; i++) update(0.1);
    out.kill1.respawned = mobs.filter(m => m.def && m.def.golden && !m.dead).length;

    // 5) giết sạch → sự kiện đóng
    for (const m of mobs) if (m.def && m.def.golden && !m.dead) hurtMob(m, 10 ** 9, 'hit');
    out.cleared = { active: GOLDEN.active, left: GOLDEN.left,
      banner: zoneBanner ? zoneBanner.text : '' };

    // 6) hết giờ mà không dọn → quái tự rút
    GOLDEN.next = Date.now() - 1000; GOLDEN.warned = true; updateGolden();
    travelTo(GOLDEN.map);
    GOLDEN.endsAt = Date.now() - 1; updateGolden();
    out.timeout = { active: GOLDEN.active,
      goldLeftAlive: mobs.filter(m => m.def && m.def.golden && !m.dead).length };

    // 7) Bảng Sự Kiện + chip đồng hồ
    openEventBoard();
    const ov = document.getElementById('overlay-inner').innerHTML;
    out.board = { open: !document.getElementById('overlay').classList.contains('hidden'),
      hasHungThan: ov.includes('Hung Thần'), hasVang: ov.includes('Xâm Lăng Vàng'),
      hasReset: ov.includes('00:00'), rows: (ov.match(/mini-btn/g) || []).length };
    document.getElementById('overlay').classList.add('hidden');
    updateHud();
    const chip = document.getElementById('hud-time');
    out.clock = { text: chip.textContent, hasClock: /⏱ \d\d:\d\d/.test(chip.textContent),
      noWuxia: !/Canh|Năm \d|Xuân|Hạ|Thu|Đông/.test(chip.textContent) };

    // 8) lịch tu tiên đã sạch khỏi text hiển thị
    out.calendarGone = { canhNames: typeof CANH_NAMES === 'undefined',
      htmlClean: !document.body.innerHTML.includes('Lịch Tu Tiên') };
    return out;
  });

  console.log(JSON.stringify(r, null, 1));
  const ok = r.boundaries.matonMod4 === 0 && r.boundaries.goldenMod4 === 2
    && r.activated.active && r.activated.bannerHasVang
    && r.spawn.count === 9 && r.spawn.allNamedVang && r.spawn.leader === 1
    && JSON.stringify(r.spawn.boxTiers) === JSON.stringify(r.spawn.tierExpected)
    && r.spawn.originalsClean && r.spawn.noneRespawnable
    && r.kill1.boxGained === 1 && r.kill1.leftAfter === 8 && r.kill1.respawned === 8
    && !r.cleared.active && r.cleared.left === 0
    && !r.timeout.active && r.timeout.goldLeftAlive === 0
    && r.board.open && r.board.hasHungThan && r.board.hasVang && r.board.hasReset
    && r.clock.hasClock && r.clock.noWuxia
    && r.calendarGone.canhNames && r.calendarGone.htmlClean
    && errs.length === 0;
  console.log('errors:', JSON.stringify(errs));
  console.log(ok ? 'PASS' : 'FAIL');
  await b.close();
})();
