// ⚒ Lò rèn nay CHỈ mở khi đứng cạnh Thợ Rèn (đúng MU: phải về thành mới rèn được).
// Các bước mở lò dưới đây vì thế phải dịch chuyển tới NPC trước — đó là luật của game,
// không phải mẹo lách test.
// Lò Hỗn Loạn (nay là công thức 'hopnhat' của Lò Hỗn Độn): 3 món CÙNG PHẨM → 1 món phẩm cao hơn,
// thất bại là mất sạch. Test lái qua khay, không qua API chọn-tay cũ.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await page.waitForTimeout(300);

  // 1) NPC Tông Sư mở đúng cỗ máy (trước đây là một màn rèn RIÊNG, nay đã gộp)
  const setup = await page.evaluate(() => {
    player.level = 50; player.inv = []; chaosClear();
    player.gems.honNguyen = 50; player.silver = 50000; player.charms = 5; player.forgeBonus = 0;
    (()=>{ const _n = NPCS.find(x => x.talk === 'forge'); if (_n){ if (curMap !== _n.map) travelTo(_n.map); player.x = _n.x + 30; player.y = _n.y + 30; } })(); renderBaGua();
    // Lò rèn nay ở #panel-forge với ruột #forge-content (trước là tab trong bảng Nhân Vật).
    return { moPanelForge: !el('panel-forge').classList.contains('hidden'),
             conPanelRengThuHai: !el('panel-quest').classList.contains('hidden'),
             dai: (document.getElementById('forge-content') || {innerHTML:''}).innerHTML.length };
  });
  console.log('1) NPC mở cỗ máy:', JSON.stringify(setup));

  const ba = () => page.evaluate(() => {
    chaosClear();
    const three = [];
    for (let i = 0; i < 3; i++){ const it = genItem(20, 0, 'mob'); it.rarity = 0; rerollItemRarity(it); player.inv.push(it); three.push(it); }
    for (const it of three) chaosAddItem(it.uid);
    chaosPickRecipe('hopnhat');
    const cur = chaosCurrent();
    return { congThuc: cur && cur.rec.id, tiLe: cur && cur.p.rate, sanSang: cur && cur.p.ready };
  });

  // 2) Thiên Mệnh Phù ép 100% — 3 món phải biến mất, nguyên liệu bị trừ, món mới phẩm +1
  const pre2 = await ba();
  const r2 = await page.evaluate(() => {
    forgeUseCharm = true;
    const invBefore = player.inv.length, honBefore = player.gems.honNguyen,
          silverBefore = player.silver, charmsBefore = player.charms;
    doChaos();
    return { invBefore, invNgaySau: player.inv.length, honBefore, honAfter: player.gems.honNguyen,
             silverBefore, silverAfter: player.silver, charmsBefore, charmsAfter: player.charms,
             khay: forgeTray.length };
  });
  await page.waitForTimeout(3200); // chờ hoạt cảnh lò nhả đồ
  const r2b = await page.evaluate(() => {
    const it = player.inv[player.inv.length - 1];
    return { invSauHoatCanh: player.inv.length, phamMoi: it ? it.rarity : null, tenMoi: it ? it.name : null };
  });
  console.log('2) ép thành công (Phù):', JSON.stringify({ ...pre2, ...r2, ...r2b }));

  // 3) Ép trật — 3 món vẫn mất sạch, không có món mới
  const pre3 = await ba();
  const r3 = await page.evaluate(() => {
    forgeUseCharm = false; player.charms = 0;
    const invBefore = player.inv.length, honBefore = player.gems.honNguyen;
    const orig = Math.random; Math.random = () => 0.999; // rate Phàm 70% < 99.9% → chắc chắn trật
    doChaos();
    Math.random = orig;
    return { invBefore, invNgaySau: player.inv.length, honBefore, honAfter: player.gems.honNguyen };
  });
  await page.waitForTimeout(3200);
  const r3b = await page.evaluate(() => ({ invSauHoatCanh: player.inv.length, banner: zoneBanner ? zoneBanner.text : null }));
  console.log('3) ép thất bại:', JSON.stringify({ ...pre3, ...r3, ...r3b }));

  // 4) Chốt chặn phẩm lệch: khay 3 món KHÁC phẩm thì công thức KHÔNG được hiện ra
  const r4 = await page.evaluate(() => {
    player.inv = []; chaosClear();
    const mk = r => { const x = genItem(20,0,'mob'); x.rarity = r; rerollItemRarity(x); player.inv.push(x); return x; };
    const a = mk(0), b = mk(1), c = mk(0);
    for (const it of [a,b,c]) chaosAddItem(it.uid);
    const lech = chaosMatches().some(x => x.rec.id === 'hopnhat');
    // đổi con lệch thành đúng phẩm → công thức phải hiện lại
    chaosTrayPop(1); chaosAddItem(mk(0).uid);
    const deu = chaosMatches().some(x => x.rec.id === 'hopnhat');
    return { phamLech_hienCongThuc: lech, phamDeu_hienCongThuc: deu };
  });
  console.log('4) chốt chặn phẩm lệch:', JSON.stringify(r4));

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (!setup.moPanelForge) fail(`NPC không mở cỗ máy: ${JSON.stringify(setup)}`);
  if (setup.conPanelRengThuHai) fail('NPC vẫn mở màn rèn thứ hai — chưa gộp xong');
  if (pre2.congThuc !== 'hopnhat') fail(`3 món cùng phẩm không ra công thức Lò Hỗn Loạn (${pre2.congThuc})`);
  if (pre2.tiLe !== 70) fail(`tỉ lệ phẩm Phàm phải 70%, đo ${pre2.tiLe}`);
  if (r2.invBefore - r2.invNgaySau !== 3) fail(`3 món hiến tế chưa biến mất ngay (${r2.invBefore}→${r2.invNgaySau})`);
  if (r2.khay !== 0) fail('khay không được dọn sau khi ném vào lò');
  if (r2.honAfter >= r2.honBefore) fail('không trừ Hỗn Nguyên');
  if (r2.silverAfter >= r2.silverBefore) fail('không trừ bạc');
  if (r2.charmsAfter !== r2.charmsBefore - 1) fail('Thiên Mệnh Phù không bị tiêu');
  if (r2b.phamMoi !== 1) fail(`món mới phải phẩm 1 (Tinh), đo ${r2b.phamMoi}`);
  if (r2b.invSauHoatCanh !== r2.invNgaySau + 1) fail('hoạt cảnh không nhả món mới ra túi');
  if (r3.invBefore - r3.invNgaySau !== 3) fail('thất bại mà 3 món không mất');
  if (r3b.invSauHoatCanh !== r3.invNgaySau) fail('thất bại mà vẫn nhả ra món mới');
  if (!/THẤT BẠI/.test(r3b.banner || '')) fail(`không báo thất bại: ${r3b.banner}`);
  if (r4.phamLech_hienCongThuc) fail('khay 3 món LỆCH phẩm mà vẫn hiện công thức Lò Hỗn Loạn');
  if (!r4.phamDeu_hienCongThuc) fail('khay 3 món ĐỀU phẩm mà không hiện công thức — chốt chặn quá tay');

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  console.log(bad === 0 && errors.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await browser.close();
  process.exit(bad === 0 && errors.length === 0 ? 0 : 1);
})();
