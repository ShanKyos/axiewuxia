const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) FUSION_DEFS empty, SKILL_TABS has only 2 tabs
  const r1 = await page.evaluate(() => ({
    fusionCount: Object.keys(FUSION_DEFS).length,
    skillTabs: SKILL_TABS.map(t => t.id),
    vohocCount: Object.keys(VOHOC_DEFS).length,
  }));
  console.log('1) FUSION empty, SKILL_TABS trimmed, VOHOC count:', JSON.stringify(r1));

  // 2) For each of the 5 classes: level to 60, auto-learn should grant every phai-locked skill,
  //    cast each one, and confirm no console error
  const results = [];
  for (const key of ['thieulam','baidasan','toanchan','minhgiao','bug']){
    const r = await page.evaluate((key) => {
      window.TEST_MODE = true;
      startGame('vophai', null);
      player.sect = key;
      player.level = 60; player.xp = 0; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      vhAutoLearn();
      const ownSkills = Object.keys(VOHOC_DEFS).filter(id => VOHOC_DEFS[id].phai === key);
      const learnedAll = ownSkills.every(id => vhLearned(id));
      // cast every non-passive learned skill from this class (need enough qi each time)
      const castResults = [];
      for (const id of ownSkills){
        if (VOHOC_DEFS[id].type === 'passive') continue;
        player.qi = player.maxQi; player.cd[id] = 0;
        try { castSkill(id); castResults.push({ id, ok: true }); }
        catch (e) { castResults.push({ id, ok: false, err: String(e) }); }
      }
      return { key, className: SECTS[key].name, ownSkillCount: ownSkills.length, learnedAll, castResults };
    }, key);
    results.push(r);
  }
  console.log('2) all 5 classes auto-learn + cast every owned skill:', JSON.stringify(results, null, 1));

  // 3) tienthiencong (Undying Will, now Dark Knight) still triggers auto-revive on death
  const r3 = await page.evaluate(() => {
    startGame('vophai', null);
    player.sect = 'thieulam'; player.level = 60; calcDerived();
    vhAutoLearn();
    const hasIt = vhLearned('tienthiencong');
    player.hp = 1; player.vhReviveCd = 0;
    onDeath();
    return { hasIt, deadAfter: dead, hpAfter: player.hp, expectedRevive: Math.round(player.maxHp*0.5) };
  });
  console.log('3) tienthiencong (Undying Will) auto-revive on Dark Knight death:', JSON.stringify(r3));

  // 4) songthu (Arcane Insight, now Dark Wizard) free-cast-chance passive still reachable
  const r4 = await page.evaluate(() => {
    startGame('vophai', null);
    player.sect = 'baidasan'; player.level = 60; calcDerived();
    vhAutoLearn();
    return { hasIt: vhLearned('songthu') };
  });
  console.log('4) songthu (Arcane Insight) learnable on Dark Wizard:', JSON.stringify(r4));

  // 5) skill panel renders with only 2 tabs, no crash
  const r5 = await page.evaluate(() => {
    startGame('vophai', null);
    player.sect = 'minhgiao'; player.level = 60; calcDerived();
    window.skillTab = 'tranphai'; renderSkillPanel();
    const html1 = document.getElementById('panel-skill').innerHTML;
    window.skillTab = 'khac'; renderSkillPanel();
    const html2 = document.getElementById('panel-skill').innerHTML;
    return { tabButtons: (html1.match(/switchSkillTab/g) || []).length, tranphaiLen: html1.length, khacLen: html2.length, mentionsGiangHo: html1.includes('Giang Hồ') || html2.includes('Giang Hồ') };
  });
  console.log('5) skill panel — 2 tabs only, no Giang Hồ leftover text:', JSON.stringify(r5));

  // 6) tenuiFreeLearn (Té Núi) gracefully returns null now that no phai:null skills exist
  const r6 = await page.evaluate(() => {
    startGame('vophai', null);
    player.sect = 'thieulam'; player.level = 60; calcDerived();
    player.level = Math.max(player.level, 84);
    const res = tenuiFreeLearn();
    return { result: res };
  });
  console.log('6) tenuiFreeLearn returns null gracefully (no free-for-all pool left):', JSON.stringify(r6));

  console.log('errors:', JSON.stringify(errors.slice(0, 25)));
  await browser.close();
})();
