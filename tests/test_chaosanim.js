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
  await page.waitForTimeout(300);

  // Helper: give player 3 same-rarity forgeable items + enough currency, select them
  async function setupChaosItems(rarity){
    return await page.evaluate((rarity) => {
      player.inv = [];
      chaosClear();
      for (let i = 0; i < 3; i++){
        const it = genItem(30, 0, 'mob');
        it.rarity = rarity; it.noForge = false;
        player.inv.push(it);
      }
      player.gems.honNguyen = 999;
      player.silver = 999999;
      const uids = player.inv.map(x => x.uid);
      uids.forEach(u => window.chaosAddItem(u));
      window.chaosPickRecipe('hopnhat');
      return { selCount: forgeTray.length, uids };
    }, rarity);
  }

  // 1) SUCCESS path: force Math.random to guarantee success, verify animation sequence + final state
  const r1 = await page.evaluate(async (setup) => {}, null);
  await setupChaosItems(1);
  const seq1 = await page.evaluate(() => {
    window.__origRandom = Math.random;
    Math.random = () => 0; // guarantees success roll (rate always > 0)
    window.doChaos();
    return {
      invLenRightAfter: player.inv.length, // should be 0 (3 sacrificed, none added yet — animation pending)
      overlayHiddenRightAfter: document.getElementById('overlay').classList.contains('hidden'),
      sceneExists: !!document.getElementById('chaos-scene'),
    };
  });
  console.log('1) doChaos() call — synchronous state right after call:', JSON.stringify(seq1));

  await page.waitForTimeout(50);
  const seq2 = await page.evaluate(() => ({
    brewing: document.getElementById('chaos-scene').classList.contains('brewing'),
  }));
  console.log('2) brewing class applied shortly after:', JSON.stringify(seq2));

  await page.waitForTimeout(1400); // past the 1300ms reveal timer
  const seq3 = await page.evaluate(() => ({
    hasSuccessClass: document.getElementById('chaos-scene').classList.contains('chaos-success'),
    resultText: document.getElementById('chaos-result-text').textContent,
    invLen: player.inv.length, // should now be 1 (new item pushed in onReveal)
    overlayStillOpen: !document.getElementById('overlay').classList.contains('hidden'),
  }));
  console.log('3) success reveal state (~1.3s later):', JSON.stringify(seq3));

  await page.waitForTimeout(1500); // past the 1400ms overlay-close timer
  const seq4 = await page.evaluate(() => {
    Math.random = window.__origRandom;
    return {
      overlayHidden: document.getElementById('overlay').classList.contains('hidden'),
      finalInvLen: player.inv.length,
      finalRarity: player.inv[0] ? player.inv[0].rarity : null,
    };
  });
  console.log('4) success — overlay closed, final inv state:', JSON.stringify(seq4));

  // 2) FAIL path: force Math.random to guarantee failure
  await setupChaosItems(1);
  const seq5 = await page.evaluate(() => {
    window.__origRandom = Math.random;
    Math.random = () => 0.999; // guarantees failure roll (rate always < 100)
    window.doChaos();
    return { invLenRightAfter: player.inv.length };
  });
  console.log('5) fail path — call chaosCombine (Math.random forced high):', JSON.stringify(seq5));

  await page.waitForTimeout(1400);
  const seq6 = await page.evaluate(() => ({
    hasFailClass: document.getElementById('chaos-scene').classList.contains('chaos-fail'),
    resultText: document.getElementById('chaos-result-text').textContent,
    invLen: player.inv.length, // should stay 0 — nothing added on failure
  }));
  console.log('6) fail reveal state:', JSON.stringify(seq6));

  await page.waitForTimeout(1500);
  const seq7 = await page.evaluate(() => {
    Math.random = window.__origRandom;
    return {
      overlayHidden: document.getElementById('overlay').classList.contains('hidden'),
      finalInvLen: player.inv.length,
    };
  });
  console.log('7) fail — overlay closed, final inv state (should be empty, items lost):', JSON.stringify(seq7));

  // 3) Selecting < 3 or invalid uids should not call playChaosAnim / open overlay
  const r8 = await page.evaluate(() => {
    document.getElementById('overlay').classList.add('hidden');
    chaosClear();
    window.doChaos(); // 0 selected — should bail early
    return { overlayStillHidden: document.getElementById('overlay').classList.contains('hidden') };
  });
  console.log('8) chaosCombine with empty selection bails safely:', JSON.stringify(r8));

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (!/THÀNH CÔNG/.test(seq3.resultText || ''))
    fail(`ghép THÀNH CÔNG mà chữ báo "${seq3.resultText}" — callback không trả { newItem }`);
  if (!seq3.hasSuccessClass) fail('thiếu lớp hoạt cảnh thành công');
  if (!/THẤT BẠI/.test(seq6.resultText || '')) fail(`ghép trượt mà chữ báo "${seq6.resultText}"`);
  if (seq7.finalInvLen !== 0) fail('ghép trượt mà túi vẫn còn đồ');
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  console.log(bad === 0 && errors.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await browser.close();
  process.exit(bad === 0 && errors.length === 0 ? 0 : 1);
})();
