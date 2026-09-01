const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(500);

  // sanity: confirm QUESTS.length is really 35 (my corrected understanding)
  const qlen = await page.evaluate(() => QUESTS.length);
  console.log('QUESTS.length (expect 35):', qlen);

  // 1) daohoa first-visit lore banner
  await page.evaluate(() => { player.wpUnlocked = { tuongduong: true }; travelTo('daohoa'); });
  await page.waitForTimeout(100);
  const daohoaBanner = await page.evaluate(() => zoneBanner);
  console.log('daohoa first-visit banner:', JSON.stringify(daohoaBanner));

  // second visit should NOT show the lore line anymore (wpUnlocked.daohoa now true)
  await page.evaluate(() => { travelTo('tuongduong'); });
  await page.waitForTimeout(50);
  await page.evaluate(() => { travelTo('daohoa'); });
  await page.waitForTimeout(100);
  const daohoaBanner2 = await page.evaluate(() => zoneBanner);
  console.log('daohoa second-visit banner (should be generic, no lore):', JSON.stringify(daohoaBanner2));

  // 2) simulate reaching questIdx=10 (quests 1-10 done) to trigger the reqMain:10 banners (tuongduong + ngoai)
  const setupAndTurnIn = await page.evaluate(() => {
    questIdx = 9; questProg = 0; questState = 'done';
    player.level = 20; calcDerived();
    turnInQuest();
    return { questIdx, questState };
  });
  console.log('after turnInQuest to reach questIdx=10:', JSON.stringify(setupAndTurnIn));
  await page.waitForTimeout(200);
  const firstBanner = await page.evaluate(() => zoneBanner);
  console.log('first queued banner (t=0.2s):', JSON.stringify(firstBanner));
  await page.waitForTimeout(4700);
  const secondBanner = await page.evaluate(() => zoneBanner);
  console.log('second queued banner (t=~4.9s, should be the OTHER reqMain:10 region):', JSON.stringify(secondBanner));

  // 3) jump straight to questIdx=14 -> done -> turnInQuest should push to 15, unlocking chungnam with Thủy Ấn lore
  const q15 = await page.evaluate(() => {
    questIdx = 14; questProg = 0; questState = 'done';
    player.level = 20; calcDerived();
    turnInQuest();
    return { questIdx, questState };
  });
  console.log('after turnInQuest to reach questIdx=15:', JSON.stringify(q15));
  await page.waitForTimeout(200);
  const chungnamBanner = await page.evaluate(() => zoneBanner);
  console.log('chungnam unlock banner (should mention Thủy Ấn):', JSON.stringify(chungnamBanner));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
