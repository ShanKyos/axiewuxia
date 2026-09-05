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
    const doll = document.querySelector('.eq-doll');
    const idOf = e2 => ((e2.getAttribute('onclick') || '').match(/unequip\('([a-z0-9]+)'\)/i) || [])[1] || '?';
    // Đọc theo THỨ TỰ DOM — chính là thứ tự người chơi nhìn thấy trên lưới.
    const o = [...doll.querySelectorAll('.eq-slot')].map(idOf);
    const nho = [...doll.querySelectorAll('.eq-small .eq-slot')].map(idOf);
    const cs = getComputedStyle(doll);
    const oLon = doll.querySelector('.eq-slot:not(.eq-small .eq-slot)');
    const oNho = doll.querySelector('.eq-small .eq-slot');
    return { o, nho, cot: cs.gridTemplateColumns.split(' ').length,
             conHinh: !!document.querySelector('.eq-fig img'),
             wLon: oLon ? Math.round(oLon.getBoundingClientRect().width) : 0,
             wNho: oNho ? Math.round(oNho.getBoundingClientRect().width) : 0,
             // bảng bố cục là NGUỒN SỰ THẬT — đọc thẳng nó rồi so với DOM
             bang: EQUIP_DOLL.map(h => h.map(c =>
               !c ? null : typeof c === 'string' ? c : c.doi ? c.doi.slice() : c.o)) };
  });
  console.log('1.', JSON.stringify(r1));
  // ĐỔI SANG LƯỚI KIỂU MU. Bản trước là hai cột ô kẹp một tấm chibi ở giữa; ô đồ khi đó bị
  // ép còn 58px, mà ở 58px thì cây trượng và cây gậy ra cùng một vệt. Cửa sổ trang bị của MU
  // là lưới ô thuần, mỗi món một ô đủ lớn để NHÌN RA nó. Bỏ tấm chibi không mất gì: bảng Nhân
  // Vật (phím C) vẫn hiện đúng hình đó, và hai bảng nay mở được cùng lúc.
  // Chủ dự án chốt chỗ: ÁO ở chính giữa với vũ khí kế bên, HAI NHẪN nằm giữa tay và chân.
  const MONG = [['pet','non','canh'], [null,'daychuyen',null],
                ['vukhi','ao','vukhi2'], ['tay',['nhan1','nhan2'],'chan']];
  if (JSON.stringify(r1.bang) !== JSON.stringify(MONG))
    fail('EQUIP_DOLL sai bố cục: ' + JSON.stringify(r1.bang));
  else pass('EQUIP_DOLL đúng bố cục lưới MU');
  // DOM phải khớp CHÍNH bảng đó — bảng đúng mà hàm vẽ bỏ sót một ô thì vẫn hỏng.
  const phang = MONG.flat(2).filter(Boolean);
  if (JSON.stringify(r1.o) !== JSON.stringify(phang))
    fail('lưới vẽ ra lệch với EQUIP_DOLL: ' + JSON.stringify(r1.o));
  else pass('lưới vẽ ra đúng thứ tự bảng: ' + phang.join(' · '));
  if (r1.cot !== 3) fail('lưới phải 3 cột, đang ' + r1.cot);
  else pass('lưới 3 cột kiểu MU');
  if (r1.conHinh) fail('vẫn còn tấm chibi giữa lưới — bố cục MU không có nó');
  else pass('không còn tấm chibi chen giữa');
  // Trang sức PHẢI nhỏ hơn giáp: nhìn lướt là biết ngay đâu là nhẫn, đâu là áo.
  if (JSON.stringify(r1.nho) !== JSON.stringify(['daychuyen','nhan1','nhan2']))
    fail('ba ô trang sức phải là ô nhỏ: ' + JSON.stringify(r1.nho));
  else if (!(r1.wNho < r1.wLon)) fail(`ô trang sức ${r1.wNho}px không nhỏ hơn ô giáp ${r1.wLon}px`);
  else pass(`ô giáp ${r1.wLon}px · ô trang sức ${r1.wNho}px`);
  // Ô đủ to để phân biệt món: đây chính là lý do đổi bố cục.
  if (r1.wLon < 70) fail(`ô đồ chỉ ${r1.wLon}px — vẫn quá nhỏ để nhìn ra món`);
  else pass(`ô đồ rộng ${r1.wLon}px, đủ để nhìn ra từng món`);

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

  // ── 5. chưa mặc gì vẫn dựng đủ 11 ô (Quần đã gỡ; Thú Cưng và Vũ Khí 2 vừa thêm) ──
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
  // CHÍN ô, không phải mười: ô 'aochoang' đã gỡ (trùng vai với Cánh). Con số này đi theo
  // EQUIP_DOLL — sửa bảng đó thì sửa luôn ở đây, đừng nới lỏng phép so thành `>=`.
  if (r5.soO !== 11 || r5.oTrong !== 11) fail(`chưa mặc gì: ${r5.soO} ô / ${r5.oTrong} ô trống (mong 11/11)`);
  else pass('chưa mặc gì: đủ 11 ô trống, mỗi ô có nhãn tên vị trí');
  // Đối chiếu với DANH SÁCH nhãn, không đoán theo dấu tiếng Việt: "Tay" và "Pet" không có dấu
  // nào cả nên phép đoán đó luôn báo lẫn ngôn ngữ dù bảng hoàn toàn nhất quán.
  const VI = ['Nón','Áo','Tay','Quần','Chân','Vũ Khí','Cánh','Dây Chuyền','Nhẫn 1','Nhẫn 2','Pet','Thú Cưng','Vũ Khí 2'];
  const EN = ['Helm','Armor','Gloves','Pants','Boots','Weapon','Wings','Amulet','Ring 1','Ring 2','Pet','Weapon 2'];
  const set = r5.lang === 'en' ? EN : VI;
  const lac = r5.nhan.filter(n => !set.includes(n));
  if (lac.length) fail(`ngôn ngữ hiện tại "${r5.lang}" nhưng ${lac.length} nhãn không thuộc bộ đó: ` + JSON.stringify(lac));
  else pass(`nhãn 9 ô cùng bộ ngôn ngữ "${r5.lang}"`);

  // ── 6. bố cục không tràn ở cả hai khổ màn hình ─────────────────────────
  for (const [w, h] of [[1366,768],[390,844]]){
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    const r6 = await p.evaluate(() => {
      const s = [...document.querySelectorAll('.eq-doll .eq-slot')].map(e => e.getBoundingClientRect());
      const d = document.querySelector('.eq-doll').getBoundingClientRect();
      return { tong: s.length,
               ngoai: s.filter(x => x.left < 0 || x.right > innerWidth).length,
               nho: s.filter(x => x.width < 24 || x.height < 24).length,
               rong: Math.round(d.width) };
    });
    if (r6.ngoai) fail(`${w}×${h}: ${r6.ngoai} ô nằm ngoài màn hình`);
    else if (r6.nho) fail(`${w}×${h}: ${r6.nho} ô dưới ngưỡng chạm 24px`);
    else pass(`${w}×${h}: ${r6.tong} ô nằm trong màn hình, đều đạt ngưỡng chạm (bảng rộng ${r6.rong}px)`);
  }

  // ── 7. Ô ĐẶC BIỆT phải sinh ra ĐÚNG loại đồ ────────────────────────────
  // Hồi ô Cánh là ô đặc biệt DUY NHẤT, genSpecific() cứ thấy special là trả về một đôi cánh.
  // Thêm Thú Cưng và Vũ Khí 2 vào là nhánh đó lặng lẽ đẻ thêm hai đôi cánh nữa, cả ba cùng
  // mang slot 'canh' — nạp save là hai đôi thừa rơi xuống túi, đúng cái món "mọc thêm" mà
  // test_epngoc bắt được. Gác từ gốc: mỗi ô đặc biệt một nguồn riêng.
  await p.setViewportSize({ width: 1366, height: 768 });
  const r7 = await p.evaluate(() => {
    const lay = (id) => { const it = genSpecific(id, 100); return it ? it.slot : null; };
    return { canh: lay('canh'), pet: lay('pet'), vukhi2: lay('vukhi2') };
  });
  if (r7.canh !== 'canh')     fail(`ô Cánh phải sinh ra đồ ô cánh, ra "${r7.canh}"`);
  else if (r7.pet !== null)   fail(`ô Thú Cưng chưa có nguồn sinh, phải trả null — ra "${r7.pet}"`);
  else if (r7.vukhi2 !== 'vukhi') fail(`ô Vũ Khí 2 phải sinh ra VŨ KHÍ, ra "${r7.vukhi2}"`);
  else pass(`mỗi ô đặc biệt một nguồn riêng: ${JSON.stringify(r7)}`);

  // ── 8. Vũ Khí 2 phải SỐNG SÓT qua một lượt nạp save ────────────────────
  // Vòng gộp trang bị khi nạp save gom theo it.slot. Thanh kiếm phụ mang slot 'vukhi' nên nó
  // trùng khoá với thanh chính và bị đá xuống túi — MỖI LẦN nạp. Nay gom theo khoá ô đang mặc.
  const r8 = await p.evaluate(() => {
    const w2 = genSpecific('vukhi2', 100);
    player.equip.vukhi2 = w2;
    const tenCu = w2.name, tuiCu = player.inv.length;
    saveGame();
    const doc = JSON.parse(localStorage.getItem('vlcm_save'));
    window._slot = doc.active;
    return { tenCu, tuiCu };
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const r8b = await p.evaluate((i) => {
    if (!loadGame(i)) return { loi: 'loadGame trả false' };
    return { con: player.equip.vukhi2 ? player.equip.vukhi2.name : null, tui: player.inv.length };
  }, await p.evaluate(() => window._slot));
  if (r8b.loi) fail(r8b.loi);
  else if (r8b.con !== r8.tenCu) fail(`nạp save xong Vũ Khí 2 biến mất khỏi ô (còn "${r8b.con}", mong "${r8.tenCu}")`);
  else if (r8b.tui !== r8.tuiCu) fail(`nạp save xong túi đổi từ ${r8.tuiCu} sang ${r8b.tui} món`);
  else pass(`Vũ Khí 2 giữ nguyên ở ô qua một lượt nạp save (${r8b.con}), túi vẫn ${r8b.tui} món`);

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có pageerror');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
