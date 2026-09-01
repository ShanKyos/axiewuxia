// BOX KUNDUN — ném ra đất thay vì hiện bảng chữ.
//
// Cái hay của MU nằm ở chỗ hạp VĂNG ĐỒ RA ĐẤT: nghe tiếng chạm, thấy đồ toé ra, rồi mới đi
// nhặt. Bản cũ nhét thẳng vào túi rồi in một danh sách — không có khoảnh khắc nào để nhìn.
// Bài này gác ba thứ: đồ phải rơi XUỐNG ĐẤT, đồ Hoàn Hảo phải đọc được bằng MÀU XANH LÁ,
// và nội dung phần thưởng không được đổi so với bản cũ.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(500);

  // ── 1. ném xong đồ nằm DƯỚI ĐẤT, không nhảy vào túi ───────────────────
  const r1 = await p.evaluate(async () => {
    player.baohap = { 7: 5 }; player.inv = []; groundLoot.length = 0; boxThrows.length = 0;
    const bacTruoc = player.silver;
    throwBaoHap(7, player.x + 150, player.y);
    const dangBay = boxThrows.length;
    // chạy đủ lâu để hạp bay, đáp và nổ
    await new Promise(r => setTimeout(r, 2600));
    return { dangBay, conHap: boxThrows.length, duoiDat: groundLoot.length,
             trongTui: player.inv.length, conLaiHap: player.baohap[7],
             bacTang: player.silver > bacTruoc };
  });
  console.log('1.', JSON.stringify(r1));
  (r1.dangBay === 1 && r1.conHap === 0 && r1.duoiDat > 0 && r1.trongTui === 0
   && r1.conLaiHap === 4 && r1.bacTang)
    ? pass(`hạp bay ra, nổ, ${r1.duoiDat} món nằm dưới đất — túi vẫn trống`)
    : fail('luồng ném sai: ' + JSON.stringify(r1));

  // ── 2. đồ Hoàn Hảo phải ra MÀU XANH LÁ riêng ──────────────────────────
  const r2 = await p.evaluate(() => {
    const thuong = { k:'item', it:{ rarity:2, perfect:0, name:'X' } };
    const hh     = { k:'item', it:{ rarity:2, perfect:10, name:'Y' } };
    const exc    = { k:'item', it:{ rarity:0, exc:[{k:'atkPct',v:5}], name:'Z' } };
    return { mauThuong: lootColor(thuong), mauHH: lootColor(hh), mauExc: lootColor(exc),
             hangHH: lootRar(hh), hangThuong: lootRar(thuong),
             tenHH: lootName(hh), xanhPham1: RARITIES[1].color };
  });
  console.log('2.', JSON.stringify(r2));
  (r2.mauHH === '#3ae07a' && r2.mauExc === '#3ae07a' && r2.mauThuong !== r2.mauHH
   && r2.mauHH !== r2.xanhPham1 && r2.hangHH >= 3 && r2.tenHH.startsWith('✦'))
    ? pass('Hoàn Hảo ra màu xanh riêng, khác xanh phẩm Tinh, và được xếp hạng cao')
    : fail('màu Hoàn Hảo sai: ' + JSON.stringify(r2));

  // ── 3. ném xa quá thì kẹp lại trong tầm với ───────────────────────────
  const r3 = await p.evaluate(() => {
    boxThrows.length = 0; player.baohap = { 3: 3 };
    throwBaoHap(3, player.x + 5000, player.y + 5000);
    const b2 = boxThrows[0];
    return { cach: Math.round(Math.hypot(b2.tx - player.x, b2.ty - player.y)), tran: 300 };
  });
  console.log('3.', JSON.stringify(r3));
  (r3.cach <= r3.tran + 1) ? pass(`ném quá tay bị kẹp về ${r3.cach}px (trần ${r3.tran})`)
                           : fail('không kẹp tầm ném: ' + JSON.stringify(r3));

  // ── 4. kéo-thả: canvas nhận thả và ném đúng chỗ ───────────────────────
  const r4 = await p.evaluate(() => {
    boxThrows.length = 0; player.baohap = { 5: 2 };
    onBoxDragStart({ dataTransfer: null }, 5);
    const daGiu = window._dragBoxTier;
    const cv = document.getElementById('game');
    const ev = new Event('drop', { bubbles: true, cancelable: true });
    ev.clientX = 300; ev.clientY = 240;
    cv.dispatchEvent(ev);
    return { daGiu, daNem: boxThrows.length, conLai: player.baohap[5], daNha: window._dragBoxTier };
  });
  console.log('4.', JSON.stringify(r4));
  (r4.daGiu === 5 && r4.daNem === 1 && r4.conLai === 1 && r4.daNha === null)
    ? pass('kéo hạp thả lên màn hình thì ném đúng chỗ, và nhả cờ kéo')
    : fail('kéo-thả sai: ' + JSON.stringify(r4));

  // ── 5. không có hạp thì không ném được ────────────────────────────────
  const r5 = await p.evaluate(() => {
    boxThrows.length = 0; player.baohap = {};
    const ok = throwBaoHap(4, player.x + 60, player.y);
    return { ok, soHap: boxThrows.length };
  });
  (!r5.ok && r5.soHap === 0) ? pass('hết hạp thì không ném được') : fail('ném được khi không có hạp');

  // ── 6. nội dung thưởng KHÔNG đổi so với bảng cũ ───────────────────────
  const r6 = await p.evaluate(() => {
    const src = burstBaoHap.toString();
    return {
      coHoanHao: /BAOHAP_PERFECT\[Math\.min\(t, BAOHAP_PERFECT\.length - 1\)\]/.test(src),
      coCoThan:  /def\.ancient > 0 && Math\.random\(\) < def\.ancient/.test(src),
      coKhacAn:  /attachSigil\(it, 0\.18 \+ \(t - 4\) \* 0\.05\)/.test(src),
      coChau:    /22 \+ t\*2/.test(src),
      coBac:     /150 \+ t\*120 \+ 40\*t/.test(src),
    };
  });
  console.log('6.', JSON.stringify(r6));
  Object.values(r6).every(Boolean)
    ? pass('tỉ lệ Cổ Thần · Hoàn Hảo · Khắc Ấn · châu · bạc giữ nguyên bảng cũ')
    : fail('nội dung thưởng bị đổi: ' + JSON.stringify(r6));

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALLPASS');
  process.exit(bad ? 1 : 0);
})();
