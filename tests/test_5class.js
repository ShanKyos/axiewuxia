const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) SECTS has exactly 5 classes + vophai, no dead species
  const r1 = await page.evaluate(() => {
    const keys = Object.keys(SECTS);
    return { keys, count: keys.length, names: keys.map(k => SECTS[k].name) };
  });
  console.log('1) SECTS keys:', JSON.stringify(r1));

  // 2) Start as Unclassed (vophai), reach level 10, open The Calling — should show exactly 5 cards
  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('vophai', null);
    player.level = 10; calcDerived();
    window.openSectCeremony();
    const wrap = document.getElementById('ceremony-cards');
    return { sect: player.sect, wrapChildren: wrap ? wrap.children.length : null, cardTexts: wrap ? Array.from(wrap.children).map(c => c.querySelector('.s-title')?.textContent) : null };
  });
  console.log('2) The Calling at level 10 — card count should be 5:', JSON.stringify(r2));

  // 3) For each of the 5 real classes, start fresh and verify: name, skillA/tp names, no console error, basic attack works
  const results = [];
  for (const key of ['thieulam','toanchan','baidasan','minhgiao','bug']){
    const r = await page.evaluate((key) => {
      startGame('vophai', null);
      player.sect = key; // simulate having answered The Calling
      calcDerived(); player.hp = player.maxHp;
      const s = SECTS[key];
      // fire skill 'a' + skill 'tp' to make sure nothing crashes with new skill names/types
      castSkill('a');
      castSkill('tp');
      return { key, name: s.name, skillA: s.skillA.name, tp: s.tp.name, atk: player.atk, hp: player.hp };
    }, key);
    results.push(r);
  }
  console.log('3) all 5 classes usable, skills fire without crash:', JSON.stringify(results, null, 1));

  // 4) sect-cards (legacy 9-option screen) should be inert — confirm it's not what's used to start
  const r4 = await page.evaluate(() => {
    const el2 = document.getElementById('sect-cards');
    return { exists: !!el2, childCount: el2 ? el2.children.length : null };
  });
  console.log('4) legacy sect-cards div (should be unused/empty):', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
