const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) basic structure sanity
  const r1 = await page.evaluate(() => ({
    count: SIDE_QUESTS.length,
    ids: SIDE_QUESTS.map(q => q.id),
    allNpcsQuestType: SIDE_QUESTS.every(q => {
      const n = NPCS.find(x => x.id === q.npc);
      return n && n.talk === 'quest';
    }),
  }));
  console.log('1) structure:', JSON.stringify(r1));

  // 2) each system-guidance quest tracks progress via its real action, end to end
  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    const results = {};

    function testQuest(id, setupFn, actionFn){
      const q = SIDE_QUESTS.find(x => x.id === id);
      player.level = q.reqLv; questIdx = q.reqMain + 5; questState = 'active'; calcDerived();
      sideStates = {};
      sideStates[id] = { st: 'active', prog: 0 };
      setupFn();
      actionFn();
      const st = sideStates[id];
      results[id] = { prog: st.prog, st: st.st, need: q.need };
    }

    // s_sys2: Mount (catch) — reuse existing horse-catch flow
    testQuest('s_sys2', () => {
      travelTo('ngoai');
      player.horseDay = { d: '', n: 0 };
      spawnHorses();
      horses[0].state = 'tired';
      player.x = horses[0].x; player.y = horses[0].y;
    }, () => { window.tryCatchHorse(); });

    // s_sys3: Thần Binh
    testQuest('s_sys3', () => {
      player.thanbinh = { tier: 1 };
      player.noidan = { Kim: 50, Mộc: 50, Thổ: 50, Thủy: 50, Hỏa: 50 };
      player.mat = 999;
    }, () => { window.upgradeThanBinh(); });

    // s_sys4 (Thu Phục Thú Hoang) đã gỡ cùng hệ Thú Thuần Hóa — nó và Thú Chiến giẫm chân
    // nhau, và Thú Thuần Hóa là cái không cộng chỉ số gì cho người chơi.

    // s_sys5: Chaos Machine
    testQuest('s_sys5', () => {
      player.gems.honNguyen = 999; player.silver = 99999;
      player.inv = [];
      for (let i = 0; i < 3; i++){ const it = genItem(30, 0.9, 'mob'); it.rarity = 1; player.inv.push(it); }
      chaosClear(); player.inv.forEach(it => chaosAddItem(it.uid)); chaosPickRecipe('hopnhat');
    }, () => { window.doChaos(); });

    // s_sys7: Garden
    testQuest('s_sys7', () => {
      player.abode = { tulinh: 0, garden: [{ seed: 'tukhi', readyAt: Date.now() - 1000 }, null, null] };
    }, () => { window.harvestSeed(0); });

    return results;
  });
  console.log('2) system-guidance quests track progress via real actions:', JSON.stringify(r2, null, 1));

  // 3) talk-type bridge quests still resolve via questOnTalk (reuse of existing mechanic)
  const r3 = await page.evaluate(() => {
    const q = SIDE_QUESTS.find(x => x.id === 's_b1');
    player.level = q.reqLv; questIdx = q.reqMain + 2; questState = 'active'; calcDerived();
    sideStates = {}; sideStates[q.id] = { st: 'active', prog: 0 };
    questOnTalk(NPCS.find(x => x.id === q.targetNpc));
    return sideStates[q.id];
  });
  console.log('3) talk-type bridge quest resolves on talking to targetNpc:', JSON.stringify(r3));

  // 4) quest panel/tracker render without crashing for the new quest set
  const r4 = await page.evaluate(() => {
    sideStates = {};
    for (const q of SIDE_QUESTS.slice(0, 3)) sideStates[q.id] = { st: 'active', prog: 0 };
    const track = trackerHtml();
    const n = NPCS.find(x => x.id === 'quachtinh');
    renderQuestNpc(n);
    const npcHtml = document.getElementById('panel-quest').innerHTML;
    return { trackerLen: track.length, npcHtmlLen: npcHtml.length };
  });
  console.log('4) tracker + quest-npc panel render OK:', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
