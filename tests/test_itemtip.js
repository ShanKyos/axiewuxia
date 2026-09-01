// Thẻ vật phẩm khi rê chuột. Trước bản này ô đồ chỉ có tooltip mặc định của trình duyệt (chờ
// ~500ms, chữ xám, không màu phẩm, không chỉ số, không so sánh); muốn xem đủ phải bấm nút ⋯
// bé xíu rồi cuộn xuống dưới cả lưới 30 ô.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION|ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html?max=1'); await p.waitForTimeout(800);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); calcDerived();
    player.inv = [];
    for (let i=0;i<10;i++){ const it = genItem(80+i*2, 0, i%3===0?'thuve':'elite'); it.plus = i%12; player.inv.push(it); }
    player.inv[1].perfect = true; player.inv[1].exc = rollExcLines(player.inv[1].slot, 8);
    closePanels(); window.bagTab='gear'; window.bagSel=-1; renderBag();
    document.getElementById('panel-bag').classList.remove('hidden'); });
  await p.waitForTimeout(500);

  // ---- 1. Rê vào ô túi → thẻ hiện, ĐÚNG HAI thẻ (món này + đang mặc) ----
  await p.locator('#panel-bag .bag-cell').nth(1).hover();
  await p.waitForTimeout(400);
  const t1 = await p.evaluate(() => {
    const t = document.querySelector('.itip');
    if (!t || t.hidden) return { hidden: true };
    const cards = [...t.querySelectorAll('.itip-card')];
    const tops  = cards.map(c => Math.round(c.querySelector('.itip-sec').getBoundingClientRect().top));
    const r = t.getBoundingClientRect();
    return { hidden:false, cards: cards.length, tags: cards.map(c => (c.querySelector('.itip-tag')||{}).textContent),
      hangChiSoThang: new Set(tops).size === 1,
      deltaTraii: cards[0].querySelectorAll('.itip-d').length,
      deltaPhai: cards[1] ? cards[1].querySelectorAll('.itip-d').length : -1,
      coDongYeuCau: !!t.querySelector('.itip-sec.req'),
      coKhoiHoanHao: !!t.querySelector('.itip-sec.exc'),
      chanThe: [...t.querySelectorAll('.itip-foot span')].map(s => s.textContent),
      rong: Math.round(r.width), cao: Math.round(r.height),
      trongManHinh: r.left >= 0 && r.top >= 0 && r.right <= 1280 && r.bottom <= 860,
      mauNhan: getComputedStyle(t.querySelector('.itip-row span')).color,
    };
  });
  console.log('thẻ đôi:', JSON.stringify(t1));
  if (t1.hidden) fail('rê vào ô túi không hiện thẻ');
  if (t1.cards !== 2) fail(`có ${t1.cards} thẻ, cần 2 (món này + đang mặc)`);
  if (!t1.hangChiSoThang) fail('hai cột chỉ số lệch hàng nhau — so sánh phải rê mắt lên xuống');
  if (!(t1.deltaTraii > 0)) fail('thẻ MÓN NÀY không in chênh lệch nào');
  if (t1.deltaPhai !== 0) fail(`thẻ ĐANG MẶC in ${t1.deltaPhai} chênh lệch — chỉ là số đối dấu của thẻ trái, nói lại lần nữa`);
  if (!t1.coDongYeuCau) fail('thiếu dòng "Yêu cầu cấp"');
  if (!t1.trongManHinh) fail('thẻ tràn ra ngoài màn hình');
  if (t1.rong > 460) fail(`thẻ rộng ${t1.rong}px — MU là hộp hẹp, không phải bảng thông số`);
  if (!t1.chanThe.length) fail('không có dòng phán quyết ở chân thẻ');
  if (t1.chanThe.some(s => s.length > 46)) fail(`chân thẻ còn câu văn dài: ${JSON.stringify(t1.chanThe)}`);
  if (t1.chanThe.some(s => /Khắc Ấn Khắc Ấn/.test(s))) fail(`lặp chữ: ${JSON.stringify(t1.chanThe)}`);
  if (/rgba?\(\s*(\d+),\s*\1,\s*\1/.test(t1.mauNhan) && parseInt(t1.mauNhan.match(/\d+/)[0]) < 90)
    fail(`nhãn chỉ số màu ${t1.mauNhan} — chữ tối trên nền tối`);

  // ---- 2. Rê ô ĐANG MẶC → chỉ MỘT thẻ, không tự so với chính mình ----
  await p.evaluate(() => { closePanels(); renderInv(); document.getElementById('panel-inv').classList.remove('hidden'); });
  await p.waitForTimeout(300);
  await p.locator('#panel-inv .eq-slot.filled').first().hover();
  await p.waitForTimeout(400);
  const t2 = await p.evaluate(() => { const t = document.querySelector('.itip');
    return { hidden: t.hidden, cards: t.querySelectorAll('.itip-card').length,
             chan: t.querySelectorAll('.itip-foot').length }; });
  console.log('ô đang mặc:', JSON.stringify(t2));
  if (t2.hidden) fail('rê ô đang mặc không hiện thẻ');
  if (t2.cards !== 1) fail(`ô đang mặc ra ${t2.cards} thẻ — nó tự so với chính mình`);
  if (t2.chan !== 0) fail('ô đang mặc vẫn in phán quyết "mạnh hơn/yếu hơn" so với chính nó');

  // ---- 3. Rê ra ngoài / bấm chuột / đóng bảng → thẻ phải biến mất ----
  await p.mouse.move(20, 820); await p.waitForTimeout(250);
  const t3 = await p.evaluate(() => document.querySelector('.itip').hidden);
  if (!t3) fail('rê ra ngoài mà thẻ vẫn còn');
  await p.locator('#panel-inv .eq-slot.filled').first().hover(); await p.waitForTimeout(300);
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200);
  const t4 = await p.evaluate(() => document.querySelector('.itip').hidden);
  if (!t4) fail('bấm chuột mà thẻ vẫn treo lại trên màn');

  // ---- 4. Không được vỡ với đồ đặc biệt (cánh/áo choàng) và ô trống ----
  const t5 = await p.evaluate(() => {
    const out = {};
    try { const w = genSpecial ? null : null; } catch(e){}
    const sp = player.equip.canh || player.inv.find(i => i.special);
    out.coDoDacBiet = !!sp;
    if (sp){ try { out.html = tipHtml(sp, true).length > 40; } catch(e){ out.loi = String(e); } }
    try { out.oTrong = tipHtml(null, false).length >= 0; } catch(e){ out.loiTrong = String(e); }
    // ô trang bị TRỐNG không được mang data-tip
    renderInv();
    out.oTrongCoTip = [...document.querySelectorAll('#panel-inv .eq-slot:not(.filled)')].some(e => e.hasAttribute('data-tip'));
    return out;
  });
  console.log('biên:', JSON.stringify(t5));
  if (t5.loi) fail('đồ đặc biệt làm vỡ thẻ: ' + t5.loi);
  if (t5.loiTrong) fail('tipHtml(null) ném lỗi: ' + t5.loiTrong);
  if (t5.oTrongCoTip) fail('ô trang bị TRỐNG vẫn gắn data-tip — rê vào sẽ ra thẻ rỗng');

  // ---- 5. Không còn title= trên ô đồ (tooltip trình duyệt sẽ chồng lên thẻ) ----
  const t6 = await p.evaluate(() => { closePanels(); renderBag();
    document.getElementById('panel-bag').classList.remove('hidden');
    return { bagTitle: [...document.querySelectorAll('#panel-bag .bag-cell')].filter(e => e.hasAttribute('title')).length,
             bagTip:   [...document.querySelectorAll('#panel-bag .bag-cell')].filter(e => e.hasAttribute('data-tip')).length }; });
  console.log('title/data-tip:', JSON.stringify(t6));
  if (t6.bagTitle) fail(`${t6.bagTitle} ô túi còn title= — tooltip trình duyệt sẽ đè lên thẻ`);
  if (!t6.bagTip) fail('ô túi chưa gắn data-tip');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
