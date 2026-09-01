const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  // thieulam has full VOHOC school content — good baseline
  await page.evaluate(() => { startGame('thieulam', null); player.level = 96; player.bikipVH = 50; calcDerived(); });
  await page.waitForTimeout(500);

  await page.evaluate(() => { togglePanel('skill'); });
  await page.waitForTimeout(200);
  const tranphai = await page.evaluate(() => ({
    tab: window.skillTab,
    hasTranPhaiHeader: document.getElementById('panel-skill').innerHTML.includes('TRẤN PHÁI'),
    hasThieuLam: document.getElementById('panel-skill').innerHTML.includes('Thiếu Lâm'),
    hasVoDang: document.getElementById('panel-skill').innerHTML.includes('Võ Đang'), // should NOT appear on Trấn Phái tab
    rowCount: document.querySelectorAll('#panel-skill .skill-row').length,
  }));
  console.log('Trấn Phái tab (default):', JSON.stringify(tranphai));
  await page.screenshot({ path: '/tmp/skill_tranphai.png' });

  await page.evaluate(() => { switchSkillTab('giangho'); });
  await page.waitForTimeout(150);
  const giangho = await page.evaluate(() => ({
    tab: window.skillTab,
    hasGiangHo: document.getElementById('panel-skill').innerHTML.includes('GIANG HỒ'),
    hasVoDang: document.getElementById('panel-skill').innerHTML.includes('Võ Đang'),
    hasThieuLam: document.getElementById('panel-skill').innerHTML.includes('Thiếu Lâm'), // should NOT appear here
    hasDungHop: document.getElementById('panel-skill').innerHTML.includes('DUNG HỢP'),
    rowCount: document.querySelectorAll('#panel-skill .skill-row').length,
  }));
  console.log('Giang Hồ tab:', JSON.stringify(giangho));
  await page.screenshot({ path: '/tmp/skill_giangho.png' });

  await page.evaluate(() => { switchSkillTab('khac'); });
  await page.waitForTimeout(150);
  const khac = await page.evaluate(() => ({
    tab: window.skillTab,
    hasKhac: document.getElementById('panel-skill').innerHTML.includes('KỸ NĂNG KHÁC'),
    hasFreeAxie: document.getElementById('panel-skill').innerHTML.includes('Free Axie'),
    hasPassive: document.getElementById('panel-skill').innerHTML.includes('BỊ ĐỘNG'),
    hasThieuLam: document.getElementById('panel-skill').innerHTML.includes('Thiếu Lâm'), // should NOT appear
    rowCount: document.querySelectorAll('#panel-skill .skill-row').length,
  }));
  console.log('Khác tab:', JSON.stringify(khac));
  await page.screenshot({ path: '/tmp/skill_khac.png' });

  console.log('errors so far:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
