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
  await page.waitForTimeout(800);

  // 1) Fresh player has resetCount 0, tab should be locked
  const initial = await page.evaluate(() => ({ resetCount: player.resetCount, level: player.level }));
  console.log('initial:', JSON.stringify(initial));

  await page.evaluate(() => { togglePanel('char'); switchCharTab('taytuy'); });
  await page.waitForTimeout(200);
  console.log('charTab after clicking locked taytuy (should be info, not taytuy):', await page.evaluate(() => window.charTab));

  // 2) Level up to MAX_LV directly, then open the tab for real
  await page.evaluate(() => { player.level = MAX_LV; player.xp = 0; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi; });
  await page.evaluate(() => { switchCharTab('taytuy'); });
  await page.waitForTimeout(200);
  const atMax = await page.evaluate(() => ({
    charTab: window.charTab,
    hasBtn: document.getElementById('char-content').innerHTML.includes('doTayTuy()'),
    html: document.getElementById('char-content').innerHTML.slice(0, 400)
  }));
  console.log('at max level, taytuy tab:', JSON.stringify(atMax));
  await page.screenshot({ path: '/tmp/taytuy_ready.png' });

  // 3) Click the reset button (first click = confirm step), verify confirm UI appears
  await page.evaluate(() => { window.doTayTuy(); });
  await page.waitForTimeout(150);
  const confirmState = await page.evaluate(() => document.getElementById('char-content').innerHTML.includes('Xác Nhận'));
  console.log('confirm step shown:', confirmState);
  await page.screenshot({ path: '/tmp/taytuy_confirm.png' });

  // 4) Confirm — capture atk/maxHp before and after to verify bonus applied
  const beforeReset = await page.evaluate(() => ({ atk: player.atk, maxHp: player.maxHp, level: player.level, resetCount: player.resetCount }));
  await page.evaluate(() => { window.doTayTuy(true); });
  await page.waitForTimeout(200);
  const afterReset = await page.evaluate(() => ({ atk: player.atk, maxHp: player.maxHp, level: player.level, xp: player.xp, resetCount: player.resetCount, equipKeys: Object.keys(player.equip) }));
  console.log('before reset:', JSON.stringify(beforeReset));
  console.log('after reset:', JSON.stringify(afterReset));
  await page.screenshot({ path: '/tmp/taytuy_done.png' });

  // 5) Verify tab is now locked again (level back to 1) and HUD badge shows
  await page.waitForTimeout(100);
  const hudName = await page.evaluate(() => document.getElementById('hud-name').innerHTML);
  console.log('charTab after reset (should bounce back to info):', await page.evaluate(() => window.charTab));
  console.log('HUD name includes reset badge:', hudName.includes('🔄1'));

  // 6) Reload via save/load cycle to verify persistence + backfill path doesn't error
  await page.evaluate(() => { saveGame(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  const afterReload = await page.evaluate(() => ({ resetCount: player && player.resetCount, atk: player && player.atk, level: player && player.level }));
  console.log('after reload (save/load roundtrip):', JSON.stringify(afterReload));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
