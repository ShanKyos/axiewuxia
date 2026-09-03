// VỀ MÔ HÌNH MU — sáu hệ nâng cấp song song và Huyền Thiết phải biến mất SẠCH.
//
// Cùng dạng với test_remove4.js (đợt gỡ 4 hệ trước đó). Bốn việc:
//   1) không hàm/hằng nào của sáu hệ còn tồn tại trong trang
//   2) không tab/nút nào của chúng còn trên bảng Nhân Vật
//   3) vào game + chơi thử ~8 giây + mở đủ các bảng: không lỗi console, không pageerror
//   4) ví ba ô hiện đúng, Quầy Shard mua được, số ô túi/kho nới thật
//
// Vì sao kiểm cả tên hàm chứ không chỉ giao diện: lần gỡ trước để sót `sigilTick()` vẫn chạy
// mỗi khung dù bảng đã ẩn — nhìn ngoài không thấy gì, nhưng nó vẫn đọc `player.sigils`.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) errors.push('console: ' + m.text());
  });
  await page.goto('http://localhost:8853/index.html?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(400);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(600);

  const ok = [];
  // So bằng JSON: ba phép kiểm dưới đây trả về MẢNG, mà `[] === []` luôn sai — bản đầu của
  // bài này ĐỎ cả ba dù danh sách rỗng đúng như mong đợi.
  const check = (ten, dat, mong) => { const p = JSON.stringify(dat) === JSON.stringify(mong); ok.push(p);
    console.log(`${p ? 'OK  ' : 'FAIL'} ${ten}: ${JSON.stringify(dat)}${p ? '' : ` (mong ${JSON.stringify(mong)})`}`); };

  // ── 1) tên hàm/hằng của sáu hệ ─────────────────────────────────────────────
  const TEN = ['THANBINH','tbCost','tbDef','upgradeThanBinh','drawThanBinh','TB_MAX_TIER',
               'TULINH_TIERS','GARDEN_SEEDS','renderAbode','upgradeTulinh','plantSeed','harvestSeed','tulinhMult',
               'TANPHAM_RULES','doTanPham',
               'PET_DEFS','PET_SUBS','petSlots','petRule','petRollCost','genPet','renderPet','petNormalize',
               'SIGIL_DEFS','sigilUsable','sigilPool','attachSigil','sigilFire','sigilTick','sigilReset',
               'ANCIENT_SETS','genAncient','doiCoThan',
               'GO_HUYENTHIET_MAT'];
  const con = await page.evaluate((ns) => ns.filter(n => {
    try { return eval(`typeof ${n}`) !== 'undefined'; } catch { return false; }
  }), TEN);
  check('hàm/hằng sáu hệ còn sót', con, []);

  // GO_HUYENTHIET thì PHẢI còn — nó là tỉ giá quy đổi, không phải hệ.
  check('GO_HUYENTHIET vẫn còn (tỉ giá quy đổi)', await page.evaluate(() => typeof GO_HUYENTHIET), 'number');

  // ── 2) tab bảng Nhân Vật ───────────────────────────────────────────────────
  await page.evaluate(() => { player.level = 120; calcDerived(); togglePanel('char'); });
  await page.waitForTimeout(300);
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('#panel-char .bang-tab')].map(b => b.textContent.trim()));
  const CAM = ['Thần Binh','Linh Thú','Khắc Ấn','Cổ Thần','Nhà Riêng','Động Phủ','Tấn Phẩm'];
  check('tab cấm còn trên bảng Nhân Vật', tabs.filter(t => CAM.some(c => t.includes(c))), []);
  console.log('     tab đang có:', tabs.join(' · '));

  // ── 3) trường save ─────────────────────────────────────────────────────────
  const truong = await page.evaluate(() => ['mat','thanbinh','abode','sigils','setActive','bagPlus','khoPlus','shard']
    .filter(k => k in player));
  check('trường save còn/đủ', truong.sort(), ['bagPlus','khoPlus','shard']);

  // ── 4) ví ba ô ─────────────────────────────────────────────────────────────
  const vi = await page.evaluate(() => {
    closePanels();
    player.silver = 12345; player.shard = 60; player.chimera.ve.gk = 7;
    updateHud();
    const o = [...document.querySelectorAll('#hud-vi .vi-o')];
    const r = document.getElementById('hud-vi').getBoundingClientRect();
    return { so: o.length, chu: o.map(x => x.innerText.replace(/\n/g,' ')),
             ngang: r.width > r.height * 2 };
  });
  check('ví có 3 ô', vi.so, 3);
  check('ví NẰM NGANG', vi.ngang, true);
  console.log('     ví:', vi.chu.join(' | '));
  check('ô Lumen', vi.chu[0].includes('12.345'), true);
  check('ô Ấn Giao Kết', vi.chu[1].includes('7'), true);
  check('ô Shard', vi.chu[2].includes('60'), true);

  // #hud-right không được nuốt chuột ở chỗ trong suốt
  check('#hud-right trong suốt với chuột',
    await page.evaluate(() => getComputedStyle(document.getElementById('hud-right')).pointerEvents), 'none');

  // ── 5) Quầy Shard tiêu thật ────────────────────────────────────────────────
  const mua = await page.evaluate(() => {
    window.moQuayShard();
    const truoc = { shard: player.shard, ve: player.chimera.ve.gk, bag: bagCap(), kho: khoCap() };
    window.muaShard('ve_gk'); window.muaShard('tui'); window.muaShard('kho');
    return { truoc, sau: { shard: player.shard, ve: player.chimera.ve.gk, bag: bagCap(), kho: khoCap() } };
  });
  check('Shard trừ đúng 5+25+30', mua.truoc.shard - mua.sau.shard, 60);
  check('vé +1',   mua.sau.ve  - mua.truoc.ve, 1);
  check('túi +5',  mua.sau.bag - mua.truoc.bag, 5);
  check('kho +10', mua.sau.kho - mua.truoc.kho, 10);
  check('hết Shard thì không mua được nữa', await page.evaluate(() => {
    const b = bagCap(); window.muaShard('tui'); return bagCap() === b; }), true);

  // Số ô túi nới ra phải được TÔN TRỌNG thật, không chỉ hiện trên nhãn
  check('nhặt được món thứ 31 sau khi nới', await page.evaluate(() => {
    closePanels();
    player.inv = []; for (let i = 0; i < 34; i++) player.inv.push(genItem(10, 0));
    return player.inv.length;   // 34 < bagCap() 35 nên không bị cắt
  }), 34);

  // ── 6) chơi thử ────────────────────────────────────────────────────────────
  await page.evaluate(() => { player.auto = true; });
  await page.waitForTimeout(8000);
  for (const p of ['char','bag','skill','quest','map']) {
    await page.evaluate((x) => togglePanel(x), p);
    await page.waitForTimeout(180);
    await page.evaluate(() => closePanels());
  }
  check('không lỗi trang khi chơi', errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 5));

  console.log(ok.every(Boolean) ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok.every(Boolean) ? 0 : 1);
})();
