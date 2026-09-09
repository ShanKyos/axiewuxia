// MÁY YÊU TINH — sân lò nằm TRONG bảng Lò Hỗn Độn, tung đồ TRƯỚC cú bấm.
//
// ⚠ Bài này gác một quyết định thiết kế, không chỉ gác mấy cái lớp CSS: CANH NHỊP LÀ MÊ TÍN.
// Con yêu tinh tung liên tục để người chơi tự chọn lúc bấm Enter, nhưng bấm ở nhịp nào cũng ra
// đúng tỉ lệ dán trên bảng. Phần 5 đo đúng chuyện đó — nếu ai đó lỡ cho `_loDem` ăn vào tỉ lệ
// thì bài này đỏ.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  let bad = 0; const fail = m => { console.log('FAIL ' + m); bad++; };
  const pass = m => console.log('PASS ' + m);

  // Đưa nhân vật tới đúng chỗ Thợ Rèn rồi mở bảng bằng CỬA THẬT (openForgePanel), không gọi
  // renderForge() suông: sân lò chỉ tồn tại khi #panel-forge đã được dựng.
  async function moLo(){
    return await page.evaluate(() => {
      window.TEST_MODE = true;
      startGame('thieulam', null);
      player.level = 60; player.lvPeak = 60; calcDerived();
      const n = NPCS.find(x => x.talk === 'forge' && x.map === 'ardhaven');
      travelTo('ardhaven');
      player.x = n.x; player.y = n.y;
      window.openForgePanel();
      return { moDuoc: !document.getElementById('panel-forge').classList.contains('hidden'),
               coSan: !!document.getElementById('lo-san') };
    });
  }
  // Khay: 3 món cùng giai cho công thức Lò Hỗn Loạn.
  async function bayBaMon(){
    return await page.evaluate(() => {
      player.inv = []; chaosClear();
      for (let i = 0; i < 3; i++){
        const it = genItem(30, 0, 'mob');
        it.noForge = false; it.special = false; it.tier = 2;
        player.inv.push(it);
      }
      player.gems.honNguyen = 999; player.silver = 999999;
      player.inv.map(x => x.uid).forEach(u => window.chaosAddItem(u));
      window.chaosPickRecipe('hopnhat');
      const cur = chaosCurrent();
      return { oKhay: forgeTray.length, congThuc: cur && cur.rec.id, sanSang: !!(cur && cur.p.ready) };
    });
  }

  // ── 1. Bảng mở ra là ĐÃ CÓ sân lò, và máy tung TRƯỚC khi bấm ──────────────
  const r1 = await moLo();
  console.log('1) mở lò:', JSON.stringify(r1));
  if (!r1.moDuoc || !r1.coSan) fail('mở bảng Lò Hỗn Độn mà không có sân lò');
  else pass('bảng lò mở ra là có sẵn sân yêu tinh');

  const r2 = await bayBaMon();
  console.log('2) khay 3 món:', JSON.stringify(r2));
  if (r2.oKhay !== 3 || !r2.sanSang) fail('bỏ 3 món cùng giai vào khay mà công thức chưa sẵn sàng');
  else pass('khay 3 món → công thức Lò Hỗn Loạn sẵn sàng');

  const r3a = await page.evaluate(() => ({
    tung: document.getElementById('lo-san').className,
    dem: document.getElementById('lo-dem').textContent }));
  await page.waitForTimeout(1300);
  const r3b = await page.evaluate(() => ({ dem: document.getElementById('lo-dem').textContent }));
  console.log('3) máy tung trước khi bấm:', JSON.stringify({ ...r3a, demSau: r3b.dem }));
  if (!/lo-tung/.test(r3a.tung)) fail('khay đã sẵn sàng mà sân lò không ở trạng thái đang tung');
  else pass('khay sẵn sàng → yêu tinh tung liên tục, chưa cần bấm gì');
  if (+r3b.dem <= +r3a.dem) fail(`bộ đếm lượt tung đứng im (${r3a.dem} → ${r3b.dem}) — không có gì để canh nhịp`);
  else pass(`bộ đếm chạy ${r3a.dem} → ${r3b.dem} lượt trong 1,3 giây`);

  // ── 4. Bấm ENTER: nín thở rồi mới lộ kết quả ─────────────────────────────
  const r4a = await page.evaluate(() => {
    window.__origRandom = Math.random;
    Math.random = () => 0;                      // ép thắng
    return { invTruoc: player.inv.length };
  });
  await page.keyboard.press('Enter');
  const r4b = await page.evaluate(() => ({
    lop: document.getElementById('lo-san').className,
    invNgaySauKhiBam: player.inv.length,        // 3 món chưa được tiêu — kết quả bốc SAU nhịp
  }));
  console.log('4) ngay sau khi bấm Enter:', JSON.stringify({ ...r4a, ...r4b }));
  if (!/lo-khui/.test(r4b.lop)) fail('bấm Enter mà sân lò không chuyển sang nhịp nín thở');
  else pass('Enter → yêu tinh chộp quả cầu, vào nhịp nín thở');
  if (r4b.invNgaySauKhiBam !== 3) fail(`kết quả bốc NGAY lúc bấm (túi còn ${r4b.invNgaySauKhiBam}) — mất hết nhịp hồi hộp`);
  else pass('kết quả chưa bốc lúc bấm — nó chờ hết nhịp nín thở');

  await page.waitForFunction(() => {
    const s = document.getElementById('lo-san');
    return s && (s.classList.contains('lo-thang') || s.classList.contains('lo-bai'));
  }, null, { timeout: 8000 });
  const r5 = await page.evaluate(() => {
    Math.random = window.__origRandom;
    const s = document.getElementById('lo-san');
    // Món mới có thể rơi vào TÚI hoặc được tryAutoEquip() mặc thẳng lên người — đếm cả hai,
    // nếu không thì nhân vật trần trụi cấp 60 sẽ làm bài này đỏ vì một lý do chẳng liên quan.
    const dang = player.inv.concat(Object.values(player.equip || {})).filter(Boolean);
    return { thang: s.classList.contains('lo-thang'), soMon: dang.length,
             giai: dang.length ? dang[0].tier : null,
             raIcon: (document.getElementById('lo-ra') || {}).innerHTML ? true : false };
  });
  console.log('5) lộ kết quả (ép thắng):', JSON.stringify(r5));
  if (!r5.thang) fail('ép Math.random=0 mà sân lò vẫn báo bại');
  else pass('thắng → sân lò bừng sáng');
  if (r5.soMon !== 1 || r5.giai !== 3) fail(`thắng mà ra ${r5.soMon} món giai ${r5.giai} — phải là 1 món giai 3`);
  else pass('3 món giai 2 hoá thành 1 món giai 3');
  if (!r5.raIcon) fail('thắng mà ô kết quả trên sân lò trống — không thấy món mới nhả ra');
  else pass('món mới hiện lên ngay trên sân lò');

  // ── 6. Đường THẤT BẠI ────────────────────────────────────────────────────
  await moLo();
  await bayBaMon();
  await page.evaluate(() => { window.__origRandom = Math.random; Math.random = () => 0.999; });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    const s = document.getElementById('lo-san');
    return s && (s.classList.contains('lo-thang') || s.classList.contains('lo-bai'));
  }, null, { timeout: 8000 });
  const r6 = await page.evaluate(() => {
    Math.random = window.__origRandom;
    const s = document.getElementById('lo-san');
    const dang = player.inv.concat(Object.values(player.equip || {})).filter(Boolean);
    return { bai: s.classList.contains('lo-bai'), inv: dang.length };
  });
  console.log('6) lộ kết quả (ép bại):', JSON.stringify(r6));
  if (!r6.bai) fail('ép Math.random=0.999 mà sân lò vẫn báo thắng');
  else pass('bại → sân lò đỏ lên, yêu tinh nhún vai');
  if (r6.inv !== 0) fail(`bại mà túi vẫn còn ${r6.inv} món — 3 món phải mất sạch`);
  else pass('bại → mất sạch 3 món, đúng luật đã dán trên bảng');

  // ── 7. CANH NHỊP LÀ MÊ TÍN — tỉ lệ không đổi theo lượt tung ──────────────
  await moLo();
  await bayBaMon();
  const r7 = await page.evaluate(async () => {
    const doTiLe = () => { const c = chaosCurrent(); return c ? c.p.rate : null; };
    const a = doTiLe();
    await new Promise(r => setTimeout(r, 1700));    // để máy tung thêm mấy lượt
    const b = doTiLe();
    return { demCuoi: +document.getElementById('lo-dem').textContent, a, b };
  });
  console.log('7) tỉ lệ theo lượt tung:', JSON.stringify(r7));
  if (r7.a == null || r7.a !== r7.b)
    fail(`tỉ lệ đổi theo lượt tung (${r7.a}% → ${r7.b}%) — canh nhịp phải là MÊ TÍN, không phải cơ chế`);
  else pass(`tỉ lệ giữ nguyên ${r7.a}% qua ${r7.demCuoi} lượt tung — canh nhịp đúng là mê tín`);

  // ── 8. Khay trống thì bấm Enter không làm gì ─────────────────────────────
  const r8 = await page.evaluate(() => {
    chaosClear(); renderForge();
    window.doChaos();
    const s = document.getElementById('lo-san');
    return { lop: s ? s.className : '(mất sân)' };
  });
  console.log('8) khay trống:', JSON.stringify(r8));
  if (/lo-khui|lo-thang|lo-bai/.test(r8.lop)) fail('khay trống mà bấm vẫn chạy máy');
  else pass('khay trống → bấm Enter không làm gì, máy đứng chờ');

  // ── 9. ĐƯỜNG NGƯỜI CHƠI NHỚ NHẤT: món +9 + ngọc → +10 ────────────────────
  // Đây mới là cái máy yêu tinh mà ai chơi game gốc cũng nhớ: bỏ món +9 với mấy viên ngọc,
  // nhìn con yêu tinh, rồi bấm. Thắng thì món đổi màu; bại thì món BAY MẤT.
  async function bayMonChin(){
    return await page.evaluate(() => {
      player.inv = []; chaosClear();
      const it = genItem(60, 0, 'mob');
      it.noForge = false; it.special = false; it.tier = 3; it.plus = 9;
      player.inv.push(it);
      player.jewels = { chucPhuc:9, linhHon:9, sinhMenh:9, honDon:9 };
      player.gems.tuLa = 9999; player.gems.honNguyen = 9999; player.silver = 9999999;
      player.charms = 0; window.forgeUseCharm = false;
      window.chaosAddItem(it.uid);
      window.chaosAddJewel('honDon');
      window.chaosAddJewel('chucPhuc'); window.chaosAddJewel('chucPhuc');
      window.chaosAddJewel('linhHon');  window.chaosAddJewel('linhHon');
      window.chaosPickRecipe('phathien');
      const cur = chaosCurrent();
      return { uid: it.uid, congThuc: cur && cur.rec.id, tiLe: cur && cur.p.rate, sanSang: !!(cur && cur.p.ready) };
    });
  }
  async function choLoXong(){
    await page.waitForFunction(() => {
      const s2 = document.getElementById('lo-san');
      return s2 && (s2.classList.contains('lo-thang') || s2.classList.contains('lo-bai'));
    }, null, { timeout: 8000 });
  }

  await moLo();
  const r9 = await bayMonChin();
  console.log('9) khay món +9 + ngọc:', JSON.stringify(r9));
  if (r9.congThuc !== 'phathien' || !r9.sanSang)
    fail(`bỏ món +9 và ngọc vào khay mà công thức ra "${r9.congThuc}", sẵn sàng=${r9.sanSang}`);
  else pass(`món +9 + ngọc → công thức Phá Thiên Kiếp, ${r9.tiLe}%`);

  await page.evaluate(() => { window.__origRandom = Math.random; Math.random = () => 0; });
  await page.keyboard.press('Enter');
  await choLoXong();
  const r10 = await page.evaluate((uid) => {
    Math.random = window.__origRandom;
    const it = findItemByUid(uid);
    const s2 = document.getElementById('lo-san');
    return { thang: s2.classList.contains('lo-thang'), plus: it ? it.plus : null };
  }, r9.uid);
  console.log('10) ép thắng +9 → +10:', JSON.stringify(r10));
  if (r10.plus !== 10) fail(`ép thắng mà món đứng ở +${r10.plus} — phải lên +10`);
  else pass('thắng → món lên +10');
  if (!r10.thang) fail('món đã lên +10 mà sân lò không báo thắng');
  else pass('sân lò báo thắng đúng lúc món đổi bậc');

  await moLo();
  const r11 = await bayMonChin();
  await page.evaluate(() => { window.__origRandom = Math.random; Math.random = () => 0.999; });
  await page.keyboard.press('Enter');
  await choLoXong();
  const r12 = await page.evaluate((uid) => {
    Math.random = window.__origRandom;
    const s2 = document.getElementById('lo-san');
    return { bai: s2.classList.contains('lo-bai'), con: !!findItemByUid(uid) };
  }, r11.uid);
  console.log('11) ép bại +9 → +10:', JSON.stringify(r12));
  if (r12.con) fail('Phá Thiên Kiếp trượt mà món vẫn còn — luật dán trên bảng là VỠ VỤN');
  else pass('bại → món vỡ vụn, mất vĩnh viễn, đúng luật đã dán');
  if (!r12.bai) fail('món đã vỡ mà sân lò không báo bại');
  else pass('sân lò báo bại đúng lúc món vỡ');

  // ── 12. BẤM ĐÚP KHÔNG ĐƯỢC ĂN MẤT MÓN VỪA RÈN ───────────────────────────
  // Thắng xong, món +10 vẫn nằm trong khay và công thức +10→+11 lập tức hợp lệ. Nhả khoá sớm
  // thì một cú Enter lỡ tay là mất luôn món vừa rèn được, chưa kịp đọc tỉ lệ mới.
  await moLo();
  const r13 = await bayMonChin();
  await page.evaluate(() => { window.__origRandom = Math.random; Math.random = () => 0; });
  await page.keyboard.press('Enter');
  await choLoXong();
  await page.keyboard.press('Enter');            // cú bấm lỡ tay ngay lúc đang xem kết quả
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  const r14 = await page.evaluate((uid) => {
    const it = findItemByUid(uid);
    return { plus: it ? it.plus : null, lop: document.getElementById('lo-san').className };
  }, r13.uid);
  await page.evaluate(() => { Math.random = window.__origRandom; });
  console.log('12) bấm đúp lúc đang xem kết quả:', JSON.stringify(r14));
  if (r14.plus !== 10) fail(`bấm đúp làm món nhảy sang +${r14.plus} — khoá nhả quá sớm, mất đồ oan`);
  else pass('bấm đúp trong lúc xem kết quả không chạy máy lần nữa — món giữ nguyên +10');

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  if (errors.length) fail(errors.length + ' lỗi runtime');
  await browser.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
