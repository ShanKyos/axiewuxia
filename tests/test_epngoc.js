// TÚI ĐỒ DẠNG LƯỚI + ÉP NGỌC THẲNG VÀO ĐỒ — hai thứ làm nên cảm giác MU Online.
//
// Bài này gác bốn nhóm:
//   1) Lưới: mỗi món chiếm đúng khối ô của nó, không món nào chồng lên món nào.
//   2) Bậc thang ngọc: Chúc Phúc 100% tới +6, Linh Hồn tới +9, +10 trở lên phải qua lò.
//   3) Hoạt ảnh: viên ngọc BAY, rồi NỔ, rồi CON SỐ bật lên — và tiếng ting ting đúng lúc chạm.
//   4) Save túi phẳng đời cũ nạp vào KHÔNG mất món nào.
//
// Bẫy đã mắc khi viết: chụp ảnh để "xem hoạt ảnh có chạy không" là cách đo tệ nhất — mỗi khung
// hình chỉ bắt được một phần nghìn giây của một chuỗi 900 ms, và ba lần chụp đầu đều rơi đúng
// vào lúc phần tử đã tan. Ở đây đo bằng cách ĐẾM PHẦN TỬ trong lớp phủ tại từng mốc thời gian.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:8853/index.html?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(400);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(600);

  const ok = [];
  const check = (ten, dat, mong) => { const p = JSON.stringify(dat) === JSON.stringify(mong); ok.push(p);
    console.log(`${p ? 'OK  ' : 'FAIL'} ${ten}: ${JSON.stringify(dat)}${p ? '' : ` (mong ${JSON.stringify(mong)})`}`); };
  const cond = (ten, dat, thu, mo) => { const p = thu(dat); ok.push(p);
    console.log(`${p ? 'OK  ' : 'FAIL'} ${ten}: ${JSON.stringify(dat)}${p ? '' : ` — ${mo}`}`); };

  // ── 1. LƯỚI ────────────────────────────────────────────────────────────────
  const g = await page.evaluate(() => {
    applyTestBoost();
    player.inv = []; player.bagPlus = 0;
    // mỗi loại một món, để đo đủ các cỡ
    const mau = ['nhan1','daychuyen','ao','aochoang','canh','vukhi'].map(sl => {
      const it = sl === 'canh' ? genWing(0) : sl === 'aochoang' ? genCloak(1) : genSpecific(sl, 2, 60);
      return it;
    }).filter(Boolean);
    for (const it of mau) bagThem(it);
    return { cols: BAG_COLS, oTong: bagCap(),
             co: mau.map(it => ({ slot: it.slot, o: bagKichThuoc(it), gx: it.gx, gy: it.gy })) };
  });
  console.log('lưới:', JSON.stringify(g.co));
  check('lưới 8 cột', g.cols, 8);
  check('64 ô khởi điểm', g.oTong, 64);
  const co = Object.fromEntries(g.co.map(x => [x.slot, x.o]));
  check('nhẫn 1×1', co.nhan1, [1,1]);
  check('dây chuyền 1×2', co.daychuyen, [1,2]);
  check('áo 2×2', co.ao, [2,2]);
  check('áo choàng 2×3', co.aochoang, [2,3]);
  check('CÁNH 3×2 = 6 ô, RỘNG chứ không dọc', co.canh, [3,2]);
  cond('vũ khí cao hơn rộng', co.vukhi, v => v && v[1] > v[0], 'vũ khí phải dài theo chiều dọc');

  // không món nào chồng ô của món khác
  const chong = await page.evaluate(() => {
    const R = bagRows(), o = {};
    let dup = 0;
    for (const it of player.inv){
      const [w, h] = bagKichThuoc(it);
      for (let y = it.gy; y < it.gy + h; y++) for (let x = it.gx; x < it.gx + w; x++){
        if (x >= BAG_COLS || y >= R) return -1;          // tràn khỏi lưới
        const k = x + ',' + y; if (o[k]) dup++; o[k] = 1;
      }
    }
    return dup;
  });
  check('không ô nào bị hai món cùng chiếm', chong, 0);

  // hết chỗ thì phải TỪ CHỐI, không nuốt món
  const day = await page.evaluate(() => {
    player.inv = []; player.bagPlus = 0;
    let n = 0;
    while (bagThem(genWing(0))) n++;                      // cánh 6 ô → 64/6 = 10 đôi
    return { nhet: n, oTrong: bagOTrong(), conCho: bagConCho(genWing(0)) };
  });
  console.log('nhồi cánh:', JSON.stringify(day));
  // TÁM, không phải mười. 64 ô chia 6 ra 10, nhưng lưới không phải cái xô: cánh rộng 3 cột
  // mà túi có 8, nên mỗi tầng chỉ kê được hai đôi và thừa ra một dải 2 cột chạy dọc suốt
  // 8 hàng — 16 ô chết mà không đôi cánh nào nhét vừa. Đó CHÍNH LÀ điều làm túi lưới khác
  // túi đếm món — và là lý do "Xếp Gọn" có nghĩa.
  check('túi 64 ô chỉ nhét vừa 8 đôi cánh (3×2), không phải 10', day.nhet, 8);
  check('còn thừa đúng 16 ô lẻ mà không đôi cánh nào nhét vừa', day.oTrong, 16);
  check('hết chỗ thì bagConCho() nói KHÔNG', day.conCho, false);

  // ── 2. BẬC THANG NGỌC — đúng MU: ◎ tới +6, ◉ tới +9, trên nữa phải qua lò ──
  const thang = await page.evaluate(() => {
    player.inv = []; player.jewels.chucPhuc = 999; player.jewels.linhHon = 999;
    const it = genSpecific('ao', 2, 60); bagThem(it);
    const out = { tranBless: null, tranSoul: null, blessLuonThang: true, soulCoXit: false };
    it.plus = 0;
    for (let i = 0; i < 6; i++){ const r = epNgoc(it, 'chucPhuc'); if (!r.ok || !r.thang) out.blessLuonThang = false; }
    out.sauBless = it.plus;
    out.tranBless = ngocEpDuoc(it, 'chucPhuc') ? 'chặn' : 'cho';
    for (let i = 0; i < 400 && (it.plus || 0) < 9; i++) epNgoc(it, 'linhHon');
    out.sauSoul = it.plus;
    // Xịt hay không phải đo trên MẪU CỐ ĐỊNH, không đo trên chính vòng leo ở trên: vòng đó
    // thoát ngay khi chạm +9, mà đi từ +6 lên +9 bằng ba lần thắng liên tiếp có xác suất
    // 0,5³ = 12,5% — tức cứ tám lượt chạy là bài kiểm này đỏ oan một lượt.
    // 200 lượt thì xác suất không gặp lần xịt nào là 2⁻²⁰⁰, coi như bằng không.
    const it2 = genSpecific('ao', 2, 60); bagThem(it2);
    for (let i = 0; i < 200; i++){
      it2.plus = 5;                                  // giữ ở mức Linh Hồn còn ép được
      const r = epNgoc(it2, 'linhHon');
      if (r.ok && !r.thang) out.soulCoXit = true;
    }
    out.tranSoul = ngocEpDuoc(it, 'linhHon') ? 'chặn' : 'cho';
    // và lò cũng phải theo đúng luật đó
    out.loBless = CHAOS_RECIPES.find(r => r.id === 'bless').match({ items:[{ plus:6, noForge:false }], jewels:{}, nJewel:0 });
    out.loSoul  = CHAOS_RECIPES.find(r => r.id === 'soul').match({ items:[{ plus:9, noForge:false }], jewels:{}, nJewel:0 });
    // +10 vẫn phải mở được ở Phá Thiên Kiếp
    out.phaThien = !!CHAOS_RECIPES.find(r => r.id === 'phathien').match({ items:[{ plus:9, noForge:false }], jewels:{}, nJewel:0 });
    return out;
  });
  console.log('thang ngọc:', JSON.stringify(thang));
  check('Chúc Phúc 6 lượt lên đúng +6', thang.sauBless, 6);
  check('Chúc Phúc KHÔNG BAO GIỜ hỏng', thang.blessLuonThang, true);
  check('tới +6 thì Chúc Phúc dừng', thang.tranBless, 'chặn');
  check('Linh Hồn leo được tới +9', thang.sauSoul, 9);
  check('Linh Hồn CÓ xịt (không phải 100%)', thang.soulCoXit, true);
  check('tới +9 thì Linh Hồn dừng', thang.tranSoul, 'chặn');
  check('lò: công thức Chúc Phúc cũng dừng ở +6', thang.loBless, null);
  check('lò: công thức Linh Hồn cũng dừng ở +9', thang.loSoul, null);
  check('+10 vẫn mở ở Phá Thiên Kiếp', thang.phaThien, true);

  // ── 3. HOẠT ẢNH + TIẾNG TING TING ──────────────────────────────────────────
  await page.evaluate(() => {
    window._sfx = [];
    const _s = AudioSys.sfx.bind(AudioSys);
    AudioSys.sfx = (n, v) => { window._sfx.push(n); return _s(n, v); };
    player.inv = []; const it = genSpecific('ao', 2, 60); it.plus = 0; bagThem(it);
    player.jewels.chucPhuc = 20;
    window.bagTab = 'gear'; closePanels(); togglePanel('bag');
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => { window.camNgoc('chucPhuc'); });
  await page.waitForTimeout(120);
  const nhan = await page.evaluate(() => ({ cam: window.ngocCam,
      sang: document.querySelectorAll('.bag-mon.ngoc-nhan').length }));
  check('cầm ngọc thì món ép được SÁNG LÊN', nhan.sang >= 1, true);

  await page.evaluate(() => { window._sfx = []; window.epNgocVaoTui(0); });
  await page.waitForTimeout(110);
  const f1 = await page.evaluate(() => ({ bay: document.querySelectorAll('#ngoc-fx .ngoc-bay').length,
                                          am: window._sfx.slice() }));
  check('đang bay: có viên ngọc trên lớp phủ', f1.bay, 1);
  check('chưa chạm thì CHƯA kêu', f1.am, []);
  await page.waitForTimeout(230);                       // qua mốc chạm (260 ms)
  const f2 = await page.evaluate(() => ({ bay: document.querySelectorAll('#ngoc-fx .ngoc-bay').length,
                                          no: document.querySelectorAll('#ngoc-fx .ngoc-no').length,
                                          loe: document.querySelectorAll('#ngoc-fx .ngoc-loe').length,
                                          tia: document.querySelectorAll('#ngoc-fx .ngoc-tia').length,
                                          so: document.querySelectorAll('#ngoc-fx .ngoc-so').length,
                                          am: window._sfx.slice(), plus: player.inv[0].plus }));
  console.log('lúc chạm:', JSON.stringify(f2));
  check('viên ngọc đã tan',      f2.bay, 0);
  check('có vòng nổ',            f2.no, 1);
  check('có mảng loé phủ ô đồ',  f2.loe, 1);
  cond('có tia bắn ra',          f2.tia, n => n >= 6, 'phải bắn ít nhất 6 tia');
  check('con số bật lên',        f2.so, 1);
  check('CHẠM là kêu ting ting', f2.am.includes('jewel'), true);
  check('món đã lên +1',         f2.plus, 1);
  await page.waitForTimeout(1000);
  check('lớp phủ tự dọn sạch', await page.evaluate(() => document.getElementById('ngoc-fx').children.length), 0);

  // xịt thì kêu tiếng khác và tụt cấp
  const xit = await page.evaluate(async () => {
    const it = player.inv[0]; it.plus = 8; player.jewels.linhHon = 5;
    const _r = Math.random; Math.random = () => 0.999;    // ép cho hỏng
    window._sfx = []; window.camNgoc('linhHon'); renderBag();
    window.epNgocVaoTui(0);
    Math.random = _r;
    await new Promise(r => setTimeout(r, 340));
    return { am: window._sfx.slice(), plus: it.plus,
             no: document.querySelectorAll('#ngoc-fx .ngoc-no.xit').length };
  });
  console.log('xịt:', JSON.stringify(xit));
  check('xịt thì TỤT 1 CẤP', xit.plus, 7);
  check('xịt thì KHÔNG kêu ting ting', xit.am.includes('jewel'), false);
  check('xịt kêu tiếng hỏng', xit.am.includes('forge_fail'), true);

  // ── 4. SAVE TÚI PHẲNG ĐỜI CŨ → LƯỚI, không mất món nào ─────────────────────
  const cu = await page.evaluate(() => {
    player.inv = [];
    for (let i = 0; i < 30; i++) player.inv.push(genItem(90, 0.5));   // push THẲNG: không có gx/gy
    for (const it of player.inv) { delete it.gx; delete it.gy; }
    player.bagPlus = 10;                                              // đơn vị Ô đời cũ
    delete player.bagRowsV5;
    const truoc = player.inv.length;
    saveGame();
    const doc = JSON.parse(localStorage.getItem('vlcm_save'));
    window._slot = doc.active;
    window._wiping = true;
    return truoc;
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const sau = await page.evaluate((i) => {
    if (!loadGame(i)) return { loi: 'loadGame trả false' };
    const co = player.inv.filter(x => x && x.gx != null).length;
    return { con: player.inv.length, coToaDo: co, hang: bagRows(), bagPlus: player.bagPlus };
  }, await page.evaluate(() => window._slot));
  console.log('save cũ:', JSON.stringify({ truoc: cu, sau }));
  check('không mất món nào khi đổi sang lưới', sau.con, cu);
  check('mọi món đều có chỗ trên lưới', sau.coToaDo, cu);
  cond('tự nới đủ hàng để chứa hết', sau.hang, h => h >= 8, 'phải ít nhất 8 hàng');

  check('không lỗi trang', errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 4));
  console.log(ok.every(Boolean) ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok.every(Boolean) ? 0 : 1);
})();
