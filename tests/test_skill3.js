const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) every class gets exactly 3 fixed skills: main/secondary/buff, all castable
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    const out = {};
    for (const sect of ['thieulam','toanchan','baidasan','minhgiao','bug']){
      startGame(sect, null);
      player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      out[sect] = {
        bar: player.skillBar.slice(),
        barLen: player.skillBar.filter(x => x != null).length,
        buffName: SKILL_DEFS[BUFF_SKILL_ID[sect]] ? skillInfo(BUFF_SKILL_ID[sect]).name : null,
      };
    }
    return out;
  });
  console.log('1) every class has exactly 3 fixed skills:', JSON.stringify(r1, null, 1));

  // 2) casting each of the 3 slots works without error, buff actually applies its effect
  const r2 = await page.evaluate(() => {
    const out = {};
    for (const sect of ['thieulam','toanchan','baidasan','minhgiao','bug']){
      startGame(sect, null);
      player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      vhAutoLearn(); // real play reaches this via gainXp()/unlockNotices() on every level-up; jumping level directly in a test must replay it explicitly
      if (sect === 'thieulam') player.gangkhi = { tier: 1, bless: 0 }; // Cương Khí Tấn Chức tier 1 — DK's buff gate, separate from vhLearned()
      calcDerived();
      for (const k in player.cd) player.cd[k] = 0;
      const before = { hp: player.hp, qi: player.qi };
      castSkill(player.skillBar[0]); // main
      for (const k in player.cd) player.cd[k] = 0; player.qi = player.maxQi;
      castSkill(player.skillBar[1]); // secondary
      for (const k in player.cd) player.cd[k] = 0; player.qi = player.maxQi;
      const buffBefore = { dmgPct: player.vhDmgPct, dmgT: player.vhDmgT, shield: player.vhShield, gkT: player.gkBuffT };
      castSkill(player.skillBar[2]); // buff
      out[sect] = {
        buffBefore,
        buffAfter: { dmgPct: player.vhDmgPct, dmgT: player.vhDmgT, shield: player.vhShield, gkT: player.gkBuffT },
        buffChanged: JSON.stringify(buffBefore) !== JSON.stringify({ dmgPct: player.vhDmgPct, dmgT: player.vhDmgT, shield: player.vhShield, gkT: player.gkBuffT }),
      };
    }
    return out;
  });
  console.log('2) casting all 3 slots works, buff slot actually changes buff state:', JSON.stringify(r2, null, 1));

  // 3) legacyAtkPct grows with level for a class with many retired skills (Dark Wizard: 5 sect skills + universal)
  const r3 = await page.evaluate(() => {
    startGame('baidasan', null);
    player.level = 10; calcDerived();
    const at10 = player.legacyAtkPct;
    player.level = 60; calcDerived();
    const at60 = player.legacyAtkPct;
    return { at10, at60, grew: at60 > at10 };
  });
  console.log('3) legacyAtkPct grows with level (Dark Wizard):', JSON.stringify(r3));

  // 4) skill panel renders without crashing, both tabs (active/legacy), for 2 classes
  const r4 = await page.evaluate(() => {
    function checkPanel(sect){
      startGame(sect, null);
      player.level = 60; calcDerived();
      togglePanel('skill');
      // Một trang duy nhất nay chứa cả bốn ô lẫn phần Di Sản — đọc CÙNG một chuỗi cho cả hai.
      const activeHtml = document.getElementById('panel-skill').innerHTML;
      const legacyHtml = activeHtml;
      return {
        activeLen: activeHtml.length,
        activeHasBuffLabel: activeHtml.includes('Buff'),
        legacyLen: legacyHtml.length,
        legacyHasPct: legacyHtml.includes('% ST'),
      };
    }
    return { dw: checkPanel('baidasan'), dk: checkPanel('thieulam') };
  });
  console.log('4) skill panel renders both tabs without crashing:', JSON.stringify(r4, null, 1));

  // 5) keys 1/2/3 cast the 3 fixed skills; key 4/5 (no longer bound) do nothing / no crash
  const r5 = await page.evaluate(() => {
    startGame('toanchan', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    for (const k in player.cd) player.cd[k] = 0;
    const before1 = player.cd[player.skillBar[0]] || 0;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    const after1 = player.cd[player.skillBar[0]] || 0;
    let threw = false;
    try { window.dispatchEvent(new KeyboardEvent('keydown', { key: '4' })); } catch (e) { threw = true; }
    return { before1, after1, castedOnKey1: after1 > before1, key4Safe: !threw };
  });
  console.log('5) hotkey 1 casts main skill; hotkey 4 (unbound) is safe:', JSON.stringify(r5));

  // 6) legacy save with an old 5-slot skillBar gets migrated to the fixed 3-slot layout on load
  const r6 = await page.evaluate(() => {
    startGame('minhgiao', null);
    player.level = 40; calcDerived();
    const saved = JSON.parse(JSON.stringify(player));
    saved.skillBar = ['a','amkhi','tp','mg_frostnova','mg_flamestrike']; // save đời cũ 5 ô, hai id cuối nay đã bị gỡ khỏi VOHOC_DEFS — càng đúng ca cần dọn
    localStorage.setItem('vlcm_save', JSON.stringify({ player: saved, curMap, sideStates, ts: Date.now() }));
    const ok = loadGame();
    return { loadOk: ok, migratedBar: player.skillBar.slice(), matchesDefault: JSON.stringify(player.skillBar) === JSON.stringify(defaultSkillBar('minhgiao')) };
  });
  console.log('6) old 5-slot save migrates to fixed 3-slot bar on load:', JSON.stringify(r6));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
