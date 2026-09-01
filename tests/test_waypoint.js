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

  const initial = await page.evaluate(() => ({ curMap, wpUnlocked: player.wpUnlocked }));
  console.log('initial:', JSON.stringify(initial));

  // open map panel, check daohoa row html for lock state
  await page.evaluate(() => { togglePanel('map'); });
  await page.waitForTimeout(200);
  const mapHtmlBefore = await page.evaluate(() => document.getElementById('panel-map').innerHTML);
  const daohoaLockedBefore = /daohoa/.test('') || mapHtmlBefore.includes('Petalshade Isle') && mapHtmlBefore.includes('Chưa mở khoá');
  console.log('daohoa shows locked-waypoint before travel:', mapHtmlBefore.includes('Chưa mở khoá'));
  await page.screenshot({ path: '/tmp/wp_map_before.png' });

  // simulate quest-guided travel to daohoa (like goQuest/goToBeacon would)
  await page.evaluate(() => { closePanels(); travelTo('daohoa'); });
  await page.waitForTimeout(500);
  const afterTravel = await page.evaluate(() => ({ curMap, wpUnlocked: player.wpUnlocked }));
  console.log('after travel:', JSON.stringify(afterTravel));
  await page.screenshot({ path: '/tmp/wp_after_travel_toast.png' });

  // reopen map panel, daohoa row should now show real Dịch Chuyển button
  await page.evaluate(() => { togglePanel('map'); });
  await page.waitForTimeout(200);
  const mapHtmlAfter = await page.evaluate(() => document.getElementById('panel-map').innerHTML);
  console.log('daohoa still locked after travel:', mapHtmlAfter.includes('Chưa mở khoá'));
  await page.screenshot({ path: '/tmp/wp_map_after.png' });

  console.log('errors:', JSON.stringify(errors.slice(0,10)));
  await browser.close();
})();
