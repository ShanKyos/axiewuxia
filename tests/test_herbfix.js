const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) HERB_SPOTS structure + ngoai herbs flag
  const r1 = await page.evaluate(() => ({
    daohoaCount: HERB_SPOTS.daohoa.length,
    ngoaiCount: HERB_SPOTS.ngoai.length,
    ngoaiHerbsFlag: !!MAPS.ngoai.herbs,
  }));
  console.log('1) HERB_SPOTS structure:', JSON.stringify(r1));

  // 2) herb pickups actually spawn on ngoai, not inside obstacles, not overlapping daohoa's coords
  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 20; calcDerived();
    travelTo('ngoai');
    const herbPickups = pickups.filter(p => p.type === 'herb');
    const insideObstacle = herbPickups.filter(p => inObstacle(curMap, p.x, p.y, 16));
    return { count: herbPickups.length, insideObstacleCount: insideObstacle.length, sample: herbPickups.slice(0, 3) };
  });
  console.log('2) herb pickups spawn correctly on ngoai:', JSON.stringify(r2));

  // 3) each herb spot is reasonably clear of mob aggro — stand at each for 3s, check no damage taken
  const r3 = await page.evaluate(() => {
    const results = [];
    for (const spot of HERB_SPOTS.ngoai){
      travelTo('ngoai');
      player.hp = player.maxHp;
      player.x = spot.x; player.y = spot.y;
      const hpBefore = player.hp;
      for (let i = 0; i < 30; i++) update(0.1); // 3 simulated seconds standing still
      results.push({ spot, hpBefore, hpAfter: Math.round(player.hp), tookDamage: player.hp < hpBefore - 1 });
    }
    return results;
  });
  console.log('3) herb spot safety check (3s standing, no mob aggro expected):', JSON.stringify(r3));

  // 4) hướng dẫn nhiệm vụ: #12 trỏ về ngoai, #3 vẫn trỏ daohoa
  //    (phần side-quest cũ đã bỏ: s_jy*/s_dh* không còn từ khi gom 66 nhiệm vụ phụ xuống 13)
  const r4 = await page.evaluate(() => ({
    q12: questTarget(QUESTS.find(q => q.id === 12)),
    q3:  questTarget(QUESTS.find(q => q.id === 3)),
  }));
  console.log('4) quest hint redirection:', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
