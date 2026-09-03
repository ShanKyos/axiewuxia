// Bảng Trang Bị kiểu paperdoll: đủ ô, đúng bên, có hình nhân vật, tháo/mặc còn chạy,
// và không tràn màn hình ở cả máy bàn lẫn điện thoại.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { closePanels(); togglePanel('inv'); });
  await p.waitForTimeout(300);

  // ── 1. cấu trúc ────────────────────────────────────────────────────────
  const r1 = await p.evaluate(() => {
    const cols = [...document.querySelectorAll('.eq-doll .eq-col')];
    const idOf = el2 => (el2.getAttribute('onclick') || '').match(/unequip\('([a-z0-9]+)'\)/i);
    const side = c => [...c.querySelectorAll('.eq-slot')].map(e => (idOf(e) || [])[1] || '?');
    const img = document.querySelector('.eq-fig img');
    return { soCot: cols.length, trai: cols[0] ? side(cols[0]) : [], phai: cols[1] ? side(cols[1]) : [],
             coHinh: !!img, srcData: !!(img && img.src.startsWith('data:image/png')),
             wImg: img ? Math.round(img.getBoundingClientRect().width) : 0,
             hImg: img ? Math.round(img.getBoundingClientRect().height) : 0,
             caption: (document.querySelector('.eq-fig-cap') || {}).innerText || '' };
  });
  console.log('1.', JSON.stringify(r1));
  // Ô 'pet' đã gỡ cùng hệ Linh Thú — cột phải còn 5 ô.
  const want = { trai:['non','ao','tay','quan','chan','vukhi'], phai:['canh','aochoang','daychuyen','nhan1','nhan2'] };
  if (r1.soCot !== 2) fail('phải có đúng 2 cột ô đồ, đang ' + r1.soCot);
  else pass('2 cột ô đồ hai bên');
  if (JSON.stringify(r1.trai) !== JSON.stringify(want.trai)) fail('cột trái sai thứ tự: ' + JSON.stringify(r1.trai));
  else pass('cột trái đúng: đầu → chân → vũ khí');
  if (JSON.stringify(r1.phai) !== JSON.stringify(want.phai)) fail('cột phải sai thứ tự: ' + JSON.stringify(r1.phai));
  else pass('cột phải đúng: trang sức + khoác ngoài');
  if (!r1.coHinh || !r1.srcData) fail('thiếu hình nhân vật ở giữa bảng');
  else if (r1.wImg < 60 || r1.hImg < 90) fail(`hình nhân vật quá nhỏ: ${r1.wImg}×${r1.hImg}`);
  else pass(`hình nhân vật ${r1.wImg}×${r1.hImg}, vẽ từ drawHeroFigure`);
  // Đỉnh bảng nay là giai 14 (bộ Long Vương), trước là giai 10 (Hỏa Long).
  if (!/Long Vương|giai 14/.test(r1.caption)) fail('chú thích không ghi tên bộ giáp: ' + JSON.stringify(r1.caption));
  else pass('chú thích ghi lớp + tên bộ: ' + r1.caption.replace(/\n/g, ' · '));

  // ── 2. thẻ rê chuột vẫn gắn vào ô có đồ ────────────────────────────────
  const r2 = await p.evaluate(() => {
    const s = [...document.querySelectorAll('.eq-doll .eq-slot')];
    return { coDo: s.filter(e => e.classList.contains('filled')).length,
             coTip: s.filter(e => e.dataset.tip && e.dataset.tip.startsWith('eq:')).length,
             vienMau: s.filter(e => e.classList.contains('filled') && /border-color/.test(e.getAttribute('style')||'')).length };
  });
  console.log('2.', JSON.stringify(r2));
  if (r2.coTip !== r2.coDo) fail(`ô có đồ ${r2.coDo} nhưng chỉ ${r2.coTip} ô gắn thẻ rê chuột`);
  else pass(`cả ${r2.coDo} ô có đồ đều gắn thẻ rê chuột`);
  if (r2.vienMau !== r2.coDo) fail('ô có đồ không lấy viền theo màu độ hiếm');
  else pass('ô có đồ lấy viền theo màu độ hiếm');

  // ── 3. tháo đồ bằng cách bấm ô ─────────────────────────────────────────
  const r3 = await p.evaluate(() => {
    const before = !!player.equip.non, nBefore = player.inv.length;
    const slot = [...document.querySelectorAll('.eq-doll .eq-slot')]
      .find(e => /unequip\('non'\)/.test(e.getAttribute('onclick') || ''));
    slot.click();
    return { truoc: before, sau: !!player.equip.non, tuiTang: player.inv.length - nBefore,
             oConTrong: !!document.querySelector('.eq-doll .eq-slot .eq-empty') };
  });
  console.log('3.', JSON.stringify(r3));
  if (!r3.truoc || r3.sau) fail('bấm ô không tháo được đồ');
  else pass('bấm ô tháo được đồ, món về túi (+' + r3.tuiTang + ')');

  // ── 4. mặc lại bằng đường kéo-thả ──────────────────────────────────────
  const r4 = await p.evaluate(() => {
    const i = player.inv.findIndex(it => it.slot === 'non');
    if (i < 0) return { boQua: true };
    window._dragBagIdx = i;
    const ev = { preventDefault(){}, dataTransfer:{ getData: () => String(i) } };
    onEquipSlotDrop(ev, 'non');
    return { daMac: !!player.equip.non };
  });
  console.log('4.', JSON.stringify(r4));
  if (r4.boQua) fail('không tìm thấy món Nón trong túi để thử kéo-thả');
  else if (!r4.daMac) fail('kéo-thả từ túi vào ô không mặc được');
  else pass('kéo-thả từ Túi Đồ vào ô mặc được');

  // ── 5. nhân vật chưa mặc gì vẫn dựng đủ 11 ô (ô Pet đã gỡ cùng hệ Linh Thú) ──
  await p.evaluate(() => { player.equip = {}; calcDerived(); renderInv(); });
  // lang.js dịch bằng MutationObserver — đọc ngay sau renderInv() là đọc bản CHƯA dịch, rồi
  // kết luận nhầm là giao diện lẫn hai thứ tiếng. Chờ một nhịp cho bộ quan sát chạy xong.
  await p.waitForTimeout(300);
  const r5 = await p.evaluate(() => {
    const s = [...document.querySelectorAll('.eq-doll .eq-slot')];
    return { soO: s.length, oTrong: s.filter(e => e.querySelector('.eq-empty')).length,
             nhan: s.map(e => ((e.querySelector('.eq-empty') || {}).innerText || '').trim()).filter(Boolean),
             caption: (document.querySelector('.eq-fig-cap') || {}).innerText || '',
             lang: window.ghhaLang ? window.ghhaLang() : '?' };
  });
  console.log('5.', JSON.stringify(r5));
  if (r5.soO !== 11 || r5.oTrong !== 11) fail(`chưa mặc gì: ${r5.soO} ô / ${r5.oTrong} ô trống (mong 11/11)`);
  else pass('chưa mặc gì: đủ 11 ô trống, mỗi ô có nhãn tên vị trí');
  // Đối chiếu với DANH SÁCH nhãn, không đoán theo dấu tiếng Việt: "Tay" và "Pet" không có dấu
  // nào cả nên phép đoán đó luôn báo lẫn ngôn ngữ dù bảng hoàn toàn nhất quán.
  const VI = ['Nón','Áo','Tay','Quần','Chân','Vũ Khí','Cánh','Áo Choàng','Dây Chuyền','Nhẫn 1','Nhẫn 2','Pet'];
  const EN = ['Helm','Armor','Gloves','Pants','Boots','Weapon','Wings','Cloak','Amulet','Ring 1','Ring 2','Pet'];
  const set = r5.lang === 'en' ? EN : VI;
  const lac = r5.nhan.filter(n => !set.includes(n));
  if (lac.length) fail(`ngôn ngữ hiện tại "${r5.lang}" nhưng ${lac.length} nhãn không thuộc bộ đó: ` + JSON.stringify(lac));
  else pass(`nhãn 11 ô cùng bộ ngôn ngữ "${r5.lang}"`);

  // ── 6. bố cục không tràn ở cả hai khổ màn hình ─────────────────────────
  for (const [w, h] of [[1366,768],[390,844]]){
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    const r6 = await p.evaluate(() => {
      const s = [...document.querySelectorAll('.eq-doll .eq-slot')].map(e => e.getBoundingClientRect());
      const d = document.querySelector('.eq-doll').getBoundingClientRect();
      return { ngoai: s.filter(x => x.left < 0 || x.right > innerWidth).length,
               nho: s.filter(x => x.width < 24 || x.height < 24).length,
               rong: Math.round(d.width) };
    });
    if (r6.ngoai) fail(`${w}×${h}: ${r6.ngoai} ô nằm ngoài màn hình`);
    else if (r6.nho) fail(`${w}×${h}: ${r6.nho} ô dưới ngưỡng chạm 24px`);
    else pass(`${w}×${h}: 11 ô nằm trong màn hình, đều đạt ngưỡng chạm (bảng rộng ${r6.rong}px)`);
  }

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có pageerror');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
