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

  // Simulate an OLD save: a level-25 player, past chungnam's reqMain gate, with NO wpUnlocked field
  await page.evaluate(() => {
    player.level = 25;
    questIdx = 5; // past chungnam's reqMain so mapGate('chungnam').ok is realistically true too
    saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save'));
    delete raw.player.wpUnlocked; // strip the field to simulate a save from before this feature
    localStorage.setItem('vlcm_save', JSON.stringify(raw));
  });
  const loaded = await page.evaluate(() => loadGame());
  console.log('loadGame() returned:', loaded);

  const state = await page.evaluate(() => ({
    level: player.level,
    wpUnlocked: player.wpUnlocked,
    chungnamGateOk: mapGate('chungnam').ok,
    nhanmonGateOk: mapGate('nhanmon').ok,
    tuongduongGateOk: mapGate('tuongduong').ok,
    questIdx: questIdx,
    tuongduongMin: MAPS.tuongduong.min,
    tuongduongReqMain: MAPS.tuongduong.reqMain,
    daohoaDungeon: !!MAPS.daohoa.dungeon,
    tuongduongDungeon: !!MAPS.tuongduong.dungeon,
    allMapIds: Object.keys(MAPS),
  }));
  console.log('post-migration state:', JSON.stringify(state));
  console.log('errors:', JSON.stringify(errors.slice(0,10)));
  await browser.close();
})();
