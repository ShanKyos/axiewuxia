const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    return { hasDotpha: 'dotpha' in player, hasDoNgo: 'doNgo' in player };
  });
  console.log('1) fresh player has no dotpha/doNgo field:', JSON.stringify(r1));

  // 2) dungeon clear no longer grants/mentions dotpha
  const r2 = await page.evaluate(() => {
    player.level = 15; questIdx = 35; questState = 'active'; calcDerived(); player.hp = player.maxHp;
    travelTo('pb_daohoa');
    // force-clear: kill all mobs repeatedly until DGN.cleared
    for (let i = 0; i < 2000 && DGN && !DGN.cleared; i++){
      for (const m of mobs) if (!m.dead) hurtMob(m, 9999999, 'hit');
      update(0.05);
    }
    return { cleared: DGN ? DGN.cleared : null, bannerSub: zoneBanner ? zoneBanner.sub : null, silverGained: player.silver };
  });
  console.log('2) dungeon clear reward text has no dead item mention:', JSON.stringify(r2));

  // 3) Kỳ Ngộ outcomes: sample many rolls, confirm no dead-item text anywhere, and that
  //    "Cao Nhân Chỉ Điểm" / "Đối Ngộ" specifically still grant a real (non-zero) Anima reward
  const r3 = await page.evaluate(() => {
    travelTo('daohoa');
    const seen = {};
    let mentionsDeadItem = false;
    for (let i = 0; i < 300; i++){
      const before = player.silver;
      rollKyngo();
      const txt = zoneBanner ? zoneBanner.text : null;
      const sub = zoneBanner ? zoneBanner.sub : '';
      if (sub && sub.includes('Ascension Trial')) mentionsDeadItem = true;
      if (!seen[txt]) seen[txt] = { count: 0, grantedAnima: false, sub: '' };
      seen[txt].count++;
      if (player.silver > before){ seen[txt].grantedAnima = true; seen[txt].sub = sub; }
    }
    return { outcomesSeen: Object.keys(seen), mentionsDeadItem, caoNhan: seen['KỲ NGỘ · Cao Nhân Chỉ Điểm'], doiNgo: seen['KỲ NGỘ · Đối Ngộ'] };
  });
  console.log('3) Kỳ Ngộ outcomes sampled, no dead-item mentions, Anima still granted:', JSON.stringify(r3));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
