// Các lỗi bố cục QA tìm ra: nút ngoài màn hình trên điện thoại, banner đè bảng, nút ngôn ngữ
// đè tên vùng, màn chọn thẻ không cuộn tới được.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);
const over = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ── điện thoại 390×844: mọi nút thanh dưới phải nằm TRONG màn hình ──────
  const ph = await b.newPage({ viewport: { width: 390, height: 844 } });
  await ph.goto('http://localhost:8853/index.html?max=1');
  await ph.waitForFunction(() => window.__gameReady).catch(()=>{});
  await ph.waitForTimeout(800);
  await ph.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await ph.waitForTimeout(400);
  const r1 = await ph.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('#bottom-hud button')){
      // Nút ĐANG ẨN không có ô bao (0×0) — đo nó rồi báo "dưới ngưỡng chạm" là báo nhầm.
      // Hiện có btn-music tự ẩn khi chưa có bản nhạc nào (xem uiSyncBgmBtn).
      if (el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      out.push({ id: el.id || el.title, x: Math.round(r.x), r: Math.round(r.right),
                 w: Math.round(r.width), h: Math.round(r.height) });
    }
    return { btns: out, vw: innerWidth, vh: innerHeight,
             hud: (h => ({ x:Math.round(h.x), r:Math.round(h.right), b:Math.round(h.bottom) }))(
                    document.getElementById('bottom-hud').getBoundingClientRect()) };
  });
  const ngoai = r1.btns.filter(x => x.x < 0 || x.r > r1.vw);
  console.log('mobile:', JSON.stringify({ tong: r1.btns.length, ngoai: ngoai.map(x => x.id), hud: r1.hud }));
  if (ngoai.length) fail(`${ngoai.length}/${r1.btns.length} nút thanh dưới nằm ngoài màn hình 390px: ${ngoai.map(x=>x.id).join(', ')}`);
  else pass(`cả ${r1.btns.length} nút thanh dưới nằm trong màn hình điện thoại`);
  const nho = r1.btns.filter(x => x.w < 24 || x.h < 24);
  if (nho.length) fail('nút nhỏ hơn ngưỡng chạm 24px: ' + nho.map(x=>x.id).join(', '));
  else pass('mọi nút đạt ngưỡng chạm 24px');
  const loot = r1.btns.find(x => x.id === 'sk-loot');
  if (!loot || loot.x < 0 || loot.r > r1.vw) fail('nút ✋ NHẶT ĐỒ — đường DUY NHẤT nhặt đồ trên điện thoại — không bấm được');
  else pass('nút ✋ NHẶT ĐỒ bấm được trên điện thoại');
  await ph.screenshot({ path: 'qa_shots/fix_phone_hud.png' });
  await ph.close();

  // ── 1366×768 ────────────────────────────────────────────────────────────
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(800);

  // màn Thẻ Tiên Duyên: tiêu đề + hướng dẫn phải nhìn thấy hoặc cuộn tới được
  const r2 = await p.evaluate(() => {
    const sc = document.getElementById('quze-screen');
    if (!sc) return null;
    sc.classList.remove('hidden');
    if (window.renderQuze) try { renderQuze(); } catch(e){}
    const inner = document.querySelector('.qz-inner');
    const before = inner.getBoundingClientRect().top;
    sc.scrollTop = 0;
    return { topKhiCuonLenDinh: Math.round(inner.getBoundingClientRect().top),
             topBanDau: Math.round(before), scrollH: sc.scrollHeight, clientH: sc.clientHeight };
  });
  console.log('quze:', JSON.stringify(r2));
  if (r2 && r2.topKhiCuonLenDinh < 0)
    fail(`cuộn hết lên đỉnh mà .qz-inner vẫn ở ${r2.topKhiCuonLenDinh}px — phần trên không tới được`);
  else pass('màn Thẻ Tiên Duyên cuộn tới được cả phần trên');
  await p.evaluate(() => { const s = document.getElementById('quze-screen'); if (s) s.classList.add('hidden'); });

  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(500);

  // nút ngôn ngữ không được đè tên vùng
  const r3 = await p.evaluate(() => {
    const L = document.getElementById('ghha-lang-toggle');
    togglePanel('settings');
    const row = [...document.querySelectorAll('#panel-settings .set-row')]
      .find(r => /Ngôn ngữ|Language/.test(r.innerText));
    const btn = row && row.querySelector('button');
    const rb = btn && btn.getBoundingClientRect();
    closePanels();
    return { chipHien: !!(L && L.offsetParent !== null),
             coDongCaiDat: !!row, nhanCaiDat: btn ? btn.innerText.trim() : null,
             bamDuoc: !!(rb && rb.width >= 24 && rb.height >= 20) };
  });
  console.log('lang:', JSON.stringify(r3));
  if (r3.chipHien) fail('chip đổi ngôn ngữ vẫn nổi trong game — neo trùng chỗ #hud-map');
  else pass('chip đổi ngôn ngữ đã rút khỏi HUD khi vào game');
  if (!r3.coDongCaiDat || !r3.bamDuoc) fail('bảng Cài Đặt không có dòng đổi ngôn ngữ bấm được');
  else pass('đổi ngôn ngữ nằm trong Cài Đặt: ' + r3.nhanCaiDat);

  // banner dẫn nhiệm vụ không được đè hàng tab của bảng
  const r4 = await p.evaluate(() => {
    const bn = document.getElementById('quest-compass-banner');
    if (!bn) return null;
    bn.classList.remove('hidden'); bn.style.display = 'flex';
    togglePanel('char');
    const pn = document.getElementById('panel-char');
    const tabs = pn && pn.querySelector('.tabs, .panel-tabs, .bang-tabs');
    const zb = getComputedStyle(bn).zIndex, zp = getComputedStyle(pn).zIndex;
    const r = tabs ? tabs.getBoundingClientRect() : null;
    const a = bn.getBoundingClientRect();
    return { zBanner:+zb, zPanel:+zp,
             tab: r ? [Math.round(r.x),Math.round(r.y),Math.round(r.right),Math.round(r.bottom)] : null,
             ban: [Math.round(a.x),Math.round(a.y),Math.round(a.right),Math.round(a.bottom)] };
  });
  console.log('banner:', JSON.stringify(r4));
  if (r4){
    if (!(r4.zBanner < r4.zPanel)) fail(`z-index banner ${r4.zBanner} không thấp hơn bảng ${r4.zPanel} — banner vẫn nằm đè`);
    else pass(`banner (z=${r4.zBanner}) nằm dưới bảng (z=${r4.zPanel})`);
  }
  await p.screenshot({ path: 'qa_shots/fix_hd_panel.png' });

  // Tầng Sâu: nút RÚT LUI không đè giữa-trên, HUD gọi đúng tên nơi đang đứng
  const r5 = await p.evaluate(() => {
    togglePanel('char');
    player.level = 60; calcDerived(); deepStart();
    return null;
  });
  await p.waitForTimeout(400);
  const r6 = await p.evaluate(() => {
    const d = document.getElementById('deep-leave').getBoundingClientRect();
    return { deep:[Math.round(d.x),Math.round(d.y)], hudMap: document.getElementById('hud-map').innerText.trim(),
             giua: d.x < innerWidth/2 && d.right > innerWidth/2 };
  });
  console.log('deep ui:', JSON.stringify(r6));
  if (r6.giua) fail('nút RÚT LUI vẫn nằm giữa-trên, che dòng tiêu đề tầng');
  else pass('nút RÚT LUI đã dạt khỏi lằn giữa');
  if (/Petalshade|Phó Bản|Trial Chamber/i.test(r6.hudMap)) fail('HUD vẫn gọi Tầng Sâu bằng tên map phó bản: ' + r6.hudMap);
  else pass('HUD gọi đúng tên: ' + r6.hudMap.replace(/\n/g, ' · '));
  await p.screenshot({ path: 'qa_shots/fix_hd_deep.png' });

  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
