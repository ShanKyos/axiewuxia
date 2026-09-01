const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 480, height: 850 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);

  await page.evaluate(() => { player.inv.push(genItem(5)); togglePanel('inv'); });
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({
    invHidden: document.getElementById('panel-inv').classList.contains('hidden'),
    bagHidden: document.getElementById('panel-bag').classList.contains('hidden'),
  }));
  console.log('narrow viewport state (bag should stay hidden):', JSON.stringify(state));
  await page.screenshot({ path: '/tmp/narrow_inv.png' });

  // click-to-equip / click-to-unequip regression check
  await page.evaluate(() => { togglePanel('bag'); });
  await page.waitForTimeout(200);
  const clickEquip = await page.evaluate(() => {
    document.querySelector('#panel-bag .bag-cell').click();
    return { equippedAny: Object.values(player.equip).some(Boolean) };
  });
  console.log('click-to-equip result:', JSON.stringify(clickEquip));

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
