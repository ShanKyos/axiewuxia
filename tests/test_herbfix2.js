const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 17; calcDerived();
    travelTo('ngoai');
    // ⚠ Bài này trước lái việc hái thuốc qua nhiệm vụ chính #12. Toàn bộ nhiệm vụ đã gỡ sạch
    // (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH) nên giờ chỉ đo phần còn thật: tryHarvestHerb() phải
    // hái được ở CẢ tám bãi thuốc của Outskirts. Khi dựng lại chuỗi, nối lại phần đếm tiến trình.
    // Không còn nhiệm vụ nào ⇒ nhánh "không dùng cho nhiệm vụ" phải hồi máu +25 mỗi lần hái.
    player.hp = 1;
    let harvested = 0, hoiMau = 0;
    for (const spot of HERB_SPOTS.ngoai){
      player.x = spot.x; player.y = spot.y;
      const hpTruoc = player.hp;
      if (tryHarvestHerb()){ harvested++; if (player.hp > hpTruoc) hoiMau++; }
    }
    return { harvested, hoiMau, soBai: HERB_SPOTS.ngoai.length };
  });
  console.log(JSON.stringify(r));
  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
  let bad = 0;
  if (!r.soBai) { bad++; console.log('  ✗ Outskirts không còn bãi thuốc nào'); }
  if (r.harvested !== r.soBai) { bad++; console.log(`  ✗ hái ${r.harvested}/${r.soBai} bãi`); }
  if (r.hoiMau !== r.soBai) { bad++; console.log(`  ✗ chỉ ${r.hoiMau}/${r.soBai} lần hái có hồi máu — nhánh không-nhiệm-vụ câm`); }
  if (errors.length) { bad++; console.log('  ✗ lỗi trang: ' + errors[0]); }
  if (!bad) console.log(`  ✓ hái đủ ${r.soBai}/${r.soBai} bãi thuốc Outskirts, mỗi lần đều hồi máu`);
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
