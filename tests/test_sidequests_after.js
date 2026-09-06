// ⚠ Bài này VỐN đo bộ phụ tuyến "hướng dẫn hệ thống" (s_shard · s_sys5 · s_b6…).
// Toàn bộ nhiệm vụ chính + phụ đã xoá sạch để dựng lại (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH),
// nên phần đo chuỗi nhiệm vụ đã gỡ. Giữ lại phần còn có giá trị: những HÀNH ĐỘNG THẬT mà
// mấy nhiệm vụ đó từng bám vào (Quầy Shard, Chaos Machine) vẫn phải chạy, và bảng nhiệm vụ
// vẫn phải vẽ được khi trong game KHÔNG còn nhiệm vụ nào.
// Khi dựng lại chuỗi, viết bài kiểm mới theo thiết kế mới — đừng khôi phục phần cũ từ git.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  let bad = 0;
  const fail = m => { bad++; console.log('  ✗ ' + m); };
  const pass = m => console.log('  ✓ ' + m);

  // 1) bảng nhiệm vụ đang thật sự rỗng
  const r1 = await page.evaluate(() => ({ side: SIDE_QUESTS.length, main: QUESTS.length }));
  console.log('1) số nhiệm vụ:', JSON.stringify(r1));
  if (r1.side || r1.main) fail(`vẫn còn nhiệm vụ (${r1.main} chính / ${r1.side} phụ) — đợt gỡ chưa sạch`);
  else pass('không còn nhiệm vụ nào trong game — đúng như đợt gỡ');

  // 2) hai hành động thật mà phụ tuyến từng bám vào vẫn chạy
  const r2 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    const out = {};

    player.shard = 99;
    const gkTruoc = player.inv.length;
    window.muaShard('ve_gk');
    out.shard = { conShard: player.shard, themDo: player.inv.length - gkTruoc };

    player.gems.honNguyen = 999; player.silver = 99999;
    player.inv = [];
    for (let i = 0; i < 3; i++){ const it = genItem(30, 0.9, 'mob'); it.rarity = 1; player.inv.push(it); }
    chaosClear(); player.inv.forEach(it => chaosAddItem(it.uid)); chaosPickRecipe('hopnhat');
    const truoc = player.inv.length;
    window.doChaos();
    out.chaos = { truoc, sau: player.inv.length };
    return out;
  });
  console.log('2) hành động thật:', JSON.stringify(r2));
  if (r2.shard.conShard >= 99) fail('mua ở Quầy Shard mà không trừ shard');
  else pass(`Quầy Shard trừ shard đúng (còn ${r2.shard.conShard})`);
  if (r2.chaos.sau === r2.chaos.truoc) fail('Chaos Machine chạy mà túi không đổi — công thức hợp nhất câm');
  else pass(`Chaos Machine ăn nguyên liệu: ${r2.chaos.truoc} → ${r2.chaos.sau} món`);

  // 3) bảng theo dõi + bảng NPC vẫn vẽ được khi KHÔNG còn nhiệm vụ
  const r3 = await page.evaluate(() => {
    sideStates = {};
    const track = trackerHtml();
    const n = NPCS.find(x => x.id === 'quachtinh');
    renderQuestNpc(n);
    return { trackerLen: track.length, npcHtmlLen: document.getElementById('panel-quest').innerHTML.length };
  });
  console.log('3) vẽ bảng:', JSON.stringify(r3));
  if (!r3.npcHtmlLen) fail('bảng NPC trống trơn khi không còn nhiệm vụ');
  else pass('bảng theo dõi + bảng NPC vẫn vẽ được với 0 nhiệm vụ');

  if (errors.length) fail('lỗi trang: ' + errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
