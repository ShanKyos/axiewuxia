// Kiểm chứng việc GỠ HẲN 4 tính năng: Hóa Thân (Shapeshift) · Trận Địa Phòng Thủ (tower-defense) ·
// Chiến Trường (battlefield) · Luyện Đan (alchemy).
//   1) 4 nút biến mất khỏi thanh tab điều hướng của bảng Nhân Vật
//   2) không hàm/biến nào của chúng còn tồn tại
//   3) vào game + chơi thử ~10 giây: không lỗi console, không pageerror
//   4) save CŨ (có đủ state của 4 hệ + đang đứng ở map towerarena đã xoá) nạp lại KHÔNG crash
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
const URL = `http://localhost:${PORT}/index.html`;

let failures = 0;
function check(name, ok, extra){
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra !== undefined ? ' — ' + JSON.stringify(extra) : ''}`);
  if (!ok) failures++;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ───────── Phần A: thanh điều hướng + mã nguồn ─────────
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errA = [];
  page.on('pageerror', e => errA.push(String(e)));
  const netA = [];
  page.on('console', m => {
    if (m.type() !== 'error') return;
    (/Failed to load resource/.test(m.text()) ? netA : errA).push('console: ' + m.text());
  });
  page.on('requestfailed', r => netA.push('net: ' + r.url()));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await page.waitForTimeout(400);

  const tabs = await page.evaluate(() => {
    player.level = 100; calcDerived();
    togglePanel('char');
    return {
      labels: Array.from(document.querySelectorAll('#panel-char .char-tabs button')).map(b => b.textContent.trim()),
      ids: CHAR_TABS.map(t => t.id),
    };
  });
  const banned = ['channel', 'tower', 'arena', 'alchemy'];
  check('CHAR_TABS không còn 4 id đã gỡ', banned.every(b => !tabs.ids.includes(b)), tabs.ids);
  const bannedWords = ['Hóa Thân', 'Shapeshift', 'Trận Địa', 'Chiến Trường', 'Luyện Đan', 'Alchemy', 'Tu La'];
  check('nhãn nút trên thanh điều hướng sạch chữ của 4 hệ',
    tabs.labels.every(l => bannedWords.every(w => !l.includes(w))), tabs.labels);
  // Trước đây đếm cứng "đúng 6 nút". Số đó không phải điều bài kiểm này quan tâm — nó đổi mỗi
  // lần thêm/bớt một hệ (gỡ Thú Thuần Hóa là còn 5), và mỗi lần đổi lại phải sửa con số ở đây
  // chứ không phát hiện được lỗi nào. Thứ THẬT SỰ hỏng được là nút rỗng: một tab bị gỡ mà nhãn
  // còn nằm lại thành ô trống bấm không ra gì.
  check('thanh điều hướng không có nút rỗng, và mỗi nút ứng với một tab thật',
    tabs.labels.length > 0 && tabs.labels.every(l => l.trim().length > 0)
      && tabs.labels.length === tabs.ids.length, { so: tabs.labels.length, nhan: tabs.labels });

  const gone = await page.evaluate(() => {
    const names = [
      // Hóa Thân
      'activateChannelForm', 'setChannelPick', 'channelFormsUnlocked', 'findTranaiById',
      'renderChannelForm', 'CHANNEL_IMGS',
      // Trận Địa Phòng Thủ
      'TOWER', 'TOWER_CORE', 'TOWER_GATES', 'TOWER_CARD_TYPES', 'TOWER_MOB_POOL',
      'startTowerRun', 'stopTowerRun', 'exitTowerOverlay', 'pickTowerCard', 'towerCardPool',
      'spawnTowerWave', 'towerNextWave', 'towerCoreHit', 'updateTower', 'towerOfferDraft',
      'showTowerDraft', 'endTowerRun', 'drawTowerHUD', 'drawTowerArena', 'renderTowerTab',
      'hintGoTower',
      // Chiến Trường (Đấu Trường Tế Thần + Pháo Đài Máu)
      'DEVIL', 'BLOOD', 'DEVIL_TIME', 'DEVIL_WAVES', 'BLOOD_TIME', 'BLOOD_GUARD_WAVES',
      'startDevilSquare', 'startBloodCastle', 'devilNextWave', 'bloodNextWave',
      'updateDevil', 'updateBlood', 'grantDevilReward', 'grantBloodReward',
      'drawDevilHUD', 'drawBloodHUD', 'renderArenaTab', 'hintGoArena',
      'ARENA_BOSS_TIERS', 'pickArenaBoss', 'spawnArenaBoss', 'rollArenaBox', 'spawnArenaWave',
      // Luyện Đan
      'ALCHEMY_RECIPES', 'alchToday', 'craftPill', 'renderAlchemyTab',
      // hàm phụ trợ chỉ Hóa Thân dùng
      'mobCardUrl',
    ];
    const alive = [];
    for (const n of names){
      let exists = false;
      try { eval(n); exists = true; } catch { exists = false; } // eslint-disable-line no-eval
      if (exists) alive.push(n);
    }
    return alive;
  });
  check('không định danh nào của 4 hệ còn tồn tại', gone.length === 0, gone);

  const kept = await page.evaluate(() => ({
    // dùng chung — PHẢI còn
    drawArenaHUD: typeof drawArenaHUD === 'function',   // HUD dùng chung với phó bản (DGN)
    DGN_ok: typeof startDungeonRun === 'function',      // phó bản vẫn chạy
    tryHarvestHerb: typeof tryHarvestHerb === 'function', // hái Thảo Dược: NV chính tuyến cần
    tranaiBoss: !!(BOSS_DEFS.daohoa && BOSS_DEFS.daohoa.tranai), // Cổng Vực vẫn còn
    duoclaoShop: !!SHOPS.duoclao,                        // tiệm thuốc vẫn bán
    towerarenaMapGone: !MAPS.towerarena,
    arenaZoneTypeGone: !ZONE_TYPES.arena,
    sideQuestsClean: !SIDE_QUESTS.some(q => ['brew','channel','tower','arena'].includes(q.type)),
  }));
  check('giữ nguyên thứ dùng chung + xoá đúng thứ riêng', Object.values(kept).every(Boolean), kept);

  // ───────── Phần B: chơi thử ~10 giây ─────────
  const errB = [];
  page.on('pageerror', e => errB.push(String(e)));
  await page.evaluate(() => { closePanels(); travelTo('daohoa'); });
  const t0 = Date.now();
  while (Date.now() - t0 < 10000){
    await page.mouse.click(400 + Math.random() * 500, 350 + Math.random() * 300);
    await page.keyboard.press('Space');
    await page.keyboard.press('1');
    await page.keyboard.press('j');
    await page.keyboard.press('p'); // phím Hóa Thân cũ — giờ phải là no-op, không được ném lỗi
    await page.waitForTimeout(320);
  }
  // mở lần lượt mọi bảng còn lại
  for (const t of ['info', 'forge', 'mount', 'tuyethoc', 'pet', 'taytuy']){
    await page.evaluate((tab) => { switchCharTab(tab); }, t);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => { openEventBoard(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { closePanels(); document.getElementById('overlay').classList.add('hidden'); renderMapPanel(); });
  await page.waitForTimeout(200);
  check('chơi thử 10 giây + duyệt hết bảng: không lỗi console/pageerror',
    errA.length === 0 && errB.length === 0, [...errA, ...errB].slice(0, 8));
  console.log(`      (bỏ qua ${netA.length} lỗi TẢI TÀI NGUYÊN — asset thiếu, có từ trước khi gỡ)`);

  // ───────── Phần C: save CŨ có state của 4 hệ ─────────
  // Dựng save y như bản trước khi gỡ: đủ field của 4 hệ, đang đứng ở map towerarena đã xoá,
  // và 2 phụ tuyến s_sys1/s_sys6 đang dở dang.
  const oldSave = await page.evaluate(() => {
    saveGame();
    const d = JSON.parse(localStorage.getItem('vlcm_save'));
    Object.assign(d.player, {
      channelPick: 'dh4', channelId: 'dh4', channelT: 9.5, channelCd: 42,
      towerBest: 17, devilClears: 4, bloodClears: 2, bloodBonusClears: 1,
      herbCount: 33, alchDay: new Date().toDateString(), alchCount: 2,
      pillDmgT: 120, pillDmgPct: 18,
    });
    d.curMap = 'towerarena';                                  // map đã bị xoá khỏi MAPS
    d.sideStates = { s_sys1: { st:'active', prog:0 }, s_sys6: { st:'done', prog:1 },
                     s_b1: { st:'claimed', prog:1 } };        // s_b1 vẫn còn thật → phải giữ
    return JSON.stringify(d);
  });

  const page2 = page; // cùng context ⇒ cùng localStorage
  const errC = [];
  page2.on('pageerror', e => errC.push(String(e)));
  page2.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errC.push('console: ' + m.text());
  });
  await page2.reload({ waitUntil: 'networkidle' });   // beforeunload sẽ ghi đè save…
  await page2.waitForTimeout(500);
  const loaded = await page2.evaluate((raw) => {
    localStorage.setItem('vlcm_save', raw);           // …nên đặt lại save CŨ sau khi tải xong
    const ok = loadGame();
    return {
      ok,
      curMap,
      mapExists: !!MAPS[curMap],
      ghostFieldsGone: ['channelT','channelCd','channelPick','channelId','towerBest',
                        'devilClears','bloodClears','bloodBonusClears',
                        'herbCount','alchDay','alchCount','pillDmgT','pillDmgPct']
                        .every(k => player[k] === undefined),
      staleSideGone: !sideStates.s_sys1 && !sideStates.s_sys6,
      realSideKept: !!sideStates.s_b1,
      sideSlotsFree: sideActive().length,
      lv: player.level,
    };
  }, oldSave);
  check('save cũ nạp được, không crash', loaded.ok === true, loaded);
  check('map towerarena đã xoá → tự lùi về map hợp lệ', loaded.mapExists && loaded.curMap !== 'towerarena', loaded.curMap);
  check('field ma của 4 hệ bị dọn khỏi player', loaded.ghostFieldsGone === true);
  check('phụ tuyến đã gỡ không còn chiếm slot; phụ tuyến thật vẫn giữ',
    loaded.staleSideGone && loaded.realSideKept && loaded.sideSlotsFree === 0, loaded);

  // chạy tiếp vài giây trên save vừa nạp
  await page2.evaluate(() => {
    document.getElementById('sect-select').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('bottom-hud').classList.remove('hidden');
  });
  for (let i = 0; i < 12; i++){
    await page2.mouse.click(500 + Math.random() * 300, 400 + Math.random() * 200);
    await page2.keyboard.press('Space');
    await page2.waitForTimeout(220);
  }
  check('save cũ chạy tiếp 3 giây không lỗi', errC.length === 0, errC.slice(0, 8));

  await browser.close();
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
})();
