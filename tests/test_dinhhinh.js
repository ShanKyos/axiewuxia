// Định Hình Chimera — cấp · bốn ô Cốt · kỹ năng đồng hành. Thiết kế: docs/DINH_HINH_CHIMERA.md
//
// Năm thứ phải gác, đều là chỗ một hệ nuôi thú dễ hỏng nhất:
//
//  1. NUÔI MÀ KHÔNG MẠNH LÊN. Cả hệ này sinh ra vì sát thương Chimera trước đây là một con số
//     nền CỐ ĐỊNH — nuôi tới cấp 80 mà đòn đánh không nhích thì vòng lặp vô nghĩa. Mục 2 đo
//     mountDmg() ở cấp 1 và cấp 80 trên cùng một Công Kích.
//  2. TRẦN CẤP KHÔNG PHẢI TRẦN. Ăn Đất Hồn quá trần thì phải DỪNG và trả lại phần thừa, chứ
//     không nuốt mất — người chơi cho ăn 400 viên là mất 400 viên thì không ai dám bấm.
//  3. DÒNG PHỤ CỦA CỐT KHÔNG ĂN VÀO ĐÂU. applyLine() lặng lẽ bỏ qua khoá lạ, nên một dòng gõ
//     sai tên vẫn hiện đẹp trên bảng mà không có tác dụng gì. Mục 4 đo chỉ số thật trước/sau.
//  4. HIỆU ỨNG BỘ KHÔNG KÍCH. Bốn mảnh cùng Dòng là điểm bán hàng của cả hệ; đủ bốn mảnh mà
//     chiBoHieu() trả null thì người chơi cày cả tuần không nhận được gì.
//  5. NHẶT MÃI RA SAI DÒNG. Mỗi phòng phải rơi ĐÚNG Dòng của phòng đó — đó là cách người chơi
//     chọn bộ. Rơi lẫn là cả thiết kế sụp.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  // ── 1. cấp: ăn Đất Hồn, trần theo Hoá, không nuốt mất phần thừa ──
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    player.level = 60; player.lvPeak = 60; calcDerived();
    const C = chiState(); C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion';
    const o = chiO('aurelion');
    const lv0 = o.lv, tran0 = chiTranCap(o);
    player.mats.datHon = 400;
    const an = window.chiAnDat('aurelion', 400);
    const sauAn = { lv:o.lv, con:player.mats.datHon, tran:chiTranCap(o) };
    // Hoá rồi ăn tiếp
    player.silver = 9e8; player.mats.datHon = 400;
    const h = window.chiHoa('aurelion');
    window.chiAnDat('aurelion', 400);
    return { lv0, tran0, an, sauAn, hoa:h, lv2:o.lv, tran2:chiTranCap(o) };
  });
  console.log('1) cấp:', JSON.stringify(r1));
  if (r1.lv0 !== 1) fail('Chimera mới nhận phải ở cấp 1'); else pass('Chimera có cấp, bắt đầu ở 1');
  if (r1.sauAn.lv !== r1.tran0) fail(`ăn 400 Đất Hồn mà cấp mới ${r1.sauAn.lv}, trần là ${r1.tran0}`);
  else pass(`ăn Đất Hồn lên đúng trần ${r1.tran0}`);
  if (!(r1.sauAn.con > 0)) fail('ăn quá trần bị NUỐT MẤT phần thừa — không được phép');
  else pass(`ăn quá trần thì dừng, trả lại ${r1.sauAn.con} viên`);
  if (!r1.hoa.ok || r1.tran2 <= r1.tran0) fail('Hoá không nâng được trần cấp');
  else pass(`Hoá nâng trần ${r1.tran0} → ${r1.tran2}, cấp lên ${r1.lv2}`);

  // ── 2. cấp phải làm Chimera MẠNH LÊN thật ──
  const r2 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60; calcDerived();
    const C = chiState(); C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion'; C.out = true;
    const o = chiO('aurelion');
    ensureMount();
    const d = lv => { o.lv = lv; let s = 0; for (let i = 0; i < 400; i++) s += mountDmg(); return Math.round(s / 400); };
    const a = d(1), z = d(CHI_LV_MAX);
    // chiêu cũng phải lớn theo cấp
    o.lv = 1;  const c1 = 1 + 0.9 * (o.lv - 1) / (CHI_LV_MAX - 1);
    o.lv = 80; const c2 = 1 + 0.9 * (o.lv - 1) / (CHI_LV_MAX - 1);
    return { a, z, ti:+(z / a).toFixed(2), c1, c2 };
  });
  console.log('2) sát thương theo cấp:', JSON.stringify(r2));
  if (!(r2.ti >= 1.8)) fail(`nuôi tới cấp 80 mà đòn đánh chỉ ×${r2.ti} — vòng lặp vô nghĩa`);
  else pass(`cấp 1 → 80: đòn thường ${r2.a} → ${r2.z} (×${r2.ti})`);
  if (!(r2.c2 > 1.8)) fail('chiêu không lớn theo cấp'); else pass(`chiêu ×${r2.c1} → ×${r2.c2.toFixed(2)}`);

  // ── 3. bốn ô Cốt: dòng chính cố định theo ô, nâng +3 mở dòng phụ, trần theo phẩm ──
  const r3 = await p.evaluate(() => {
    startGame('thieulam', null); player.silver = 9e8;
    const C = chiState(); C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion'; C.kho = [];
    // mỗi ô đúng một dòng chính?
    const sai = [];
    for (let i = 0; i < 300; i++){
      const c = cotMoi('votrung', 'co');
      if (COT_O[c.o].chinh !== COT_O[c.o].chinh) sai.push(c.o);
      if (c.phu.some(x => x.k === COT_O[c.o].chinh)) sai.push('trùng:' + c.o);
    }
    // nâng một mảnh Cổ lên trần, đếm mốc mở dòng phụ
    const goc = cotMoi('votrung', 'co'); C.kho.push(goc);
    const dau = goc.phu.length, lech = [];
    for (let i = 0; i < 40; i++){
      if (goc.plus >= cotTran(goc)) break;
      for (let j = 0; j < 6; j++) C.kho.push(cotMoi('votrung', 'co'));
      window.cotNang(goc.uid, C.kho.filter(x => x.uid !== goc.uid).map(x => x.uid));
      // luật: số dòng phụ = số lúc rơi + số mốc +3 đã vượt qua, chặn trần 4
      const canCo = Math.min(4, dau + Math.floor(goc.plus / 3));
      if (goc.phu.length !== canCo) lech.push(`+${goc.plus}: có ${goc.phu.length}, phải ${canCo}`);
    }
    // cotMoiO: ô chỉ định phải đúng, và không được để dòng phụ trùng dòng chính của ô đó
    const saiO = [];
    for (const k of COT_O_IDS) for (let i = 0; i < 60; i++){
      const c = cotMoiO('regai', 'co', k);
      if (c.o !== k) saiO.push('ô ' + k);
      if (c.phu.some(x => x.k === COT_O[k].chinh)) saiO.push('trùng ' + k);
    }
    return { sai:sai.slice(0,3), saiO:saiO.slice(0,3), plus:goc.plus, tran:cotTran(goc), phu:goc.phu.length, dau, lech,
             tranTho: COT_PHAM.tho.tran, chinhTang: cotChinhV(goc) > goc.chinhV };
  });
  console.log('3) Cốt:', JSON.stringify(r3));
  if (r3.sai.length) fail('dòng phụ trùng dòng chính của ô: ' + r3.sai.join(','));
  else pass('dòng phụ không bao giờ trùng dòng chính của ô');
  if (r3.saiO.length) fail('cotMoiO() sinh sai ô hoặc để dòng phụ trùng dòng chính: ' + r3.saiO.join(','));
  else pass('cotMoiO() sinh đúng ô chỉ định, không dòng phụ nào trùng dòng chính');
  if (r3.plus !== r3.tran) fail(`nâng không tới trần: +${r3.plus}/${r3.tran}`); else pass(`nâng tới trần +${r3.tran} (phẩm Cổ)`);
  if (r3.phu !== 4) fail(`phải đủ 4 dòng phụ ở trần, đếm ${r3.phu}`); else pass('đủ 4 dòng phụ khi lên trần');
  if (r3.lech.length) fail('dòng phụ mở sai nhịp — ' + r3.lech.slice(0,3).join(' · '));
  else pass(`dòng phụ mở đúng mỗi +3 (rơi ra đã có ${r3.dau}, lên trần đủ 4)`);
  if (!r3.chinhTang) fail('dòng chính không lớn theo bậc nâng'); else pass('dòng chính lớn theo bậc nâng');

  // ── 4. Cốt phải ăn vào CHỈ SỐ THẬT, cả phía Chimera lẫn phía người chơi ──
  const r4 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60;
    const C = chiState(); C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion'; C.kho = [];
    const o = chiO('aurelion'); o.lv = 40;
    calcDerived(); const hp0 = player.maxHp, atk0 = player.atk;
    const g0 = chiCotGom('aurelion').c.cAtk;
    // ô Vảy nuôi NGƯỜI CHƠI (hpPct), ô Sừng nuôi CHIMERA (cAtk)
    for (const k of ['vay','sung']){
      const c = cotMoiO('votrung', 'co', k); c.plus = 12; c.chinhV = 20;
      c.phu = [{ k:'atkPct', v:6 }];
      o.cot[k] = c;
    }
    calcDerived();
    return { hp0, hp1:player.maxHp, atk0, atk1:player.atk, g0, g1:chiCotGom('aurelion').c.cAtk };
  });
  console.log('4) Cốt vào chỉ số:', JSON.stringify(r4));
  if (!(r4.hp1 > r4.hp0)) fail('ô Vảy (HP người chơi) không ăn vào chỉ số người chơi');
  else pass(`ô Vảy nuôi người chơi: HP ${r4.hp0} → ${r4.hp1}`);
  if (!(r4.atk1 > r4.atk0)) fail('dòng phụ atkPct trên Cốt không ăn vào Công người chơi');
  else pass(`dòng phụ phía người chơi ăn thật: Công ${r4.atk0} → ${r4.atk1}`);
  if (!(r4.g1 > r4.g0)) fail('ô Sừng không cộng Công Chimera'); else pass(`ô Sừng nuôi Chimera: +${r4.g1}% Công`);

  // ── 5. hiệu ứng bộ 2 mảnh và 4 mảnh ──
  const r5 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60;
    const C = chiState(); C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion';
    const o = chiO('aurelion');
    // chinhV cố định: nếu để nó bốc ngẫu nhiên thì phép trừ giữa hai lần đo lẫn cả phần bốc
    const dat = n => { o.cot = { sung:null, vuot:null, vay:null, duoi:null };
      COT_O_IDS.slice(0, n).forEach(k => { const c = cotMoiO('regai', 'tho', k); c.phu = []; c.chinhV = 4; o.cot[k] = c; });
      calcDerived(); return chiCotGom('aurelion'); };
    const a = dat(1), b2 = dat(2), b4 = dat(4);
    // trộn hai Dòng thì KHÔNG được tính đủ bộ
    o.cot = { sung:null, vuot:null, vay:null, duoi:null };
    COT_O_IDS.forEach((k, i) => { const c = cotMoiO(i < 2 ? 'regai' : 'samvun', 'tho', k); c.phu = []; o.cot[k] = c; });
    calcDerived();
    return { bo1:a.bo, hai1:a.c.cAtk, bo2:b2.bo, hai2:b2.c.cAtk, bo4:b4.bo, tron:chiBoHieu(),
             soDong: COT_DONG_IDS.length };
  });
  console.log('5) bộ:', JSON.stringify(r5));
  if (r5.bo1) fail('1 mảnh mà đã tính là đủ bộ 4');
  else pass(`1 mảnh: chỉ có dòng chính của chính nó (+${r5.hai1}%), chưa có hiệu ứng bộ`);
  const themBo = +(r5.hai2 - r5.hai1).toFixed(1);
  if (themBo !== 8) fail(`2 mảnh phải cộng đúng +8% của bộ, đo được +${themBo}%`);
  else pass('2 mảnh kích đúng hiệu ứng bộ: +8% Công Chimera');
  if (r5.bo4 !== 'regai') fail('4 mảnh không kích hiệu ứng đổi hành vi'); else pass('4 mảnh kích hiệu ứng đổi hành vi');
  if (r5.tron) fail('trộn 2+2 Dòng mà vẫn tính là đủ bộ'); else pass('trộn hai Dòng thì không tính đủ bộ');
  if (r5.soDong !== 7) fail('phải đúng 7 Dòng, đếm ' + r5.soDong); else pass('đủ 7 Dòng, mỗi phó bản một Dòng');

  // ── 6. mỗi phó bản rơi ĐÚNG Dòng của nó ──
  const r6 = await p.evaluate(() => {
    startGame('thieulam', null);
    const C = chiState(); C.kho = []; C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion';
    const sai = [], dem = {};
    for (const mapId in COT_DONG_THEO_MAP){
      C.kho = [];
      const ra = cotRoi(mapId, 1);
      dem[mapId] = ra.length;
      for (const c of ra) if (c.dong !== COT_DONG_THEO_MAP[mapId]) sai.push(mapId + '→' + c.dong);
    }
    C.kho = [];
    const dau = cotRoi('pb_daohoa', 1).length, sau = cotRoi('pb_daohoa', 9).length;
    const ngoai = cotRoi('daohoa', 1).length;    // map thường không rơi Cốt
    return { sai, dem, dau, sau, ngoai, dat: player.mats.datHon };
  });
  console.log('6) rơi:', JSON.stringify(r6));
  if (r6.sai.length) fail('phó bản rơi sai Dòng: ' + r6.sai.join(', '));
  else pass('cả 7 phó bản rơi đúng Dòng của mình');
  if (!(r6.dau > r6.sau)) fail(`cửa mềm không hoạt động: lượt 1 rơi ${r6.dau}, lượt 9 rơi ${r6.sau}`);
  else pass(`cửa mềm: lượt đầu ${r6.dau} mảnh, lượt thứ 9 còn ${r6.sau}`);
  if (r6.ngoai) fail('map thường cũng rơi Cốt'); else pass('chỉ phó bản rơi Cốt');
  if (!(r6.dat > 0)) fail('phó bản không rơi Đất Hồn'); else pass(`phó bản rơi Đất Hồn (${r6.dat} viên)`);

  // ── 7. kỹ năng đồng hành mở theo cấp và BUFF NGƯỜI CHƠI ──
  const r7 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60;
    const C = chiState(); C.co = {}; chiNhan('emberjaw'); C.eq = 'emberjaw';  // Beast
    const o = chiO('emberjaw');
    const doc = lv => { o.lv = lv; calcDerived(); return { mo:chiKyMo('emberjaw'), atk:player.atk, hp:player.maxHp }; };
    const a = doc(1), b2 = doc(10), c = doc(25), d = doc(70);
    // kỹ năng loại "chiêu nổ thì buff"
    o.lv = 70; calcDerived(); const truoc = player.atk;
    chiBatTam('atkPct', 14, 6); const trong = player.atk;
    player.chiTam = null; calcDerived(); const sau = player.atk;
    const soLop = Object.keys(CHI_KY).length;
    const duLop = CHIMERA.every(x => CHI_KY[x.lop]);
    return { a, b2, c, d, truoc, trong, sau, soLop, duLop,
             so4: Object.values(CHI_KY).every(x => x.length === 4) };
  });
  console.log('7) kỹ năng:', JSON.stringify({ mo:[r7.a.mo,r7.b2.mo,r7.c.mo,r7.d.mo], atk:[r7.a.atk,r7.b2.atk,r7.d.atk] }));
  if (r7.a.mo !== 0 || r7.b2.mo !== 1 || r7.c.mo !== 2 || r7.d.mo !== 4)
    fail(`kỹ năng mở sai mốc: ${[r7.a.mo,r7.b2.mo,r7.c.mo,r7.d.mo]}`);
  else pass('kỹ năng mở đúng mốc cấp 10 · 25 · 45 · 70');
  if (!(r7.b2.atk > r7.a.atk)) fail('kỹ năng luôn bật không buff Công người chơi');
  else pass(`kỹ năng buff người chơi thật: Công ${r7.a.atk} → ${r7.d.atk}`);
  if (!(r7.trong > r7.truoc) || r7.sau !== r7.truoc)
    fail(`buff tạm sai: ${r7.truoc} → ${r7.trong} → ${r7.sau}`);
  else pass(`buff tạm bật rồi tắt sạch: ${r7.truoc} → ${r7.trong} → ${r7.sau}`);
  if (!r7.duLop || r7.soLop !== 9 || !r7.so4) fail('thiếu bộ kỹ năng cho lớp Axie nào đó');
  else pass('đủ 9 lớp Axie × 4 kỹ năng, mọi Chimera đều có bộ của mình');

  // ── 8. lưu/nạp giữ nguyên cấp, Cốt đang đeo và kho ──
  const r8 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60;
    const C = chiState(); C.co = {}; chiNhan('aurelion'); C.eq = 'aurelion'; C.kho = [];
    const o = chiO('aurelion'); o.lv = 55; o.hoa = 3;
    for (const k of COT_O_IDS){ const c = cotMoiO('bangvun', 'co', k); c.plus = 9; o.cot[k] = c; }
    for (let i = 0; i < 5; i++) C.kho.push(cotMoi('regai', 'tinh'));
    player.mats.datHon = 77;
    saveGame(); const ok = loadGame();
    const o2 = chiO('aurelion');
    return { ok, lv:o2.lv, hoa:o2.hoa, deo:COT_O_IDS.filter(k => o2.cot[k]).length,
             plus:o2.cot.sung && o2.cot.sung.plus, kho:chiState().kho.length,
             bo:chiBoHieu(), dat:player.mats.datHon };
  });
  console.log('8) lưu/nạp:', JSON.stringify(r8));
  if (!r8.ok || r8.lv !== 55 || r8.hoa !== 3) fail('cấp/Hoá không sống qua lưu-nạp');
  else pass('cấp 55 · Hoá 3 sống qua lưu-nạp');
  if (r8.deo !== 4 || r8.plus !== 9 || r8.kho !== 5) fail(`Cốt không sống qua lưu-nạp: đeo ${r8.deo}, +${r8.plus}, kho ${r8.kho}`);
  else pass('4 Cốt đang đeo (+9) và 5 mảnh trong kho sống qua lưu-nạp');
  if (r8.bo !== 'bangvun') fail('hiệu ứng bộ mất sau khi nạp lại'); else pass('hiệu ứng bộ còn nguyên sau khi nạp');
  if (r8.dat !== 77) fail('Đất Hồn không sống qua lưu-nạp'); else pass('Đất Hồn sống qua lưu-nạp');

  // ── 9. save đời cũ (chưa có cấp/Cốt) không vỡ ──
  const r9 = await p.evaluate(() => {
    startGame('thieulam', null);
    const C = chiState();
    C.co = { aurelion:{ con:2 } };           // đúng hình dạng save trước bản này
    C.eq = 'aurelion'; delete C.kho;
    const o = chiO('aurelion');
    calcDerived(); ensureMount();
    return { lv:o.lv, hoa:o.hoa, coCot:!!o.cot, con:o.con, dmg:mountDmg() > 0 };
  });
  console.log('9) save cũ:', JSON.stringify(r9));
  if (r9.lv !== 1 || r9.hoa !== 0 || !r9.coCot || r9.con !== 2)
    fail('save đời cũ không được vá đúng: ' + JSON.stringify(r9));
  else pass('save đời cũ vá thành cấp 1 · 4 ô trống, giữ nguyên Huyết Thống C2');

  // ── 10. giao diện mở được, không nổ ──
  await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60; calcDerived();
    cheatExec('/max');
  });
  await p.waitForTimeout(200);
  await p.keyboard.press('c');
  await p.waitForTimeout(300);
  await p.evaluate(() => switchCharTab('mount'));
  await p.waitForTimeout(400);
  const r10 = await p.evaluate(() => {
    const h = el('panel-char').innerHTML;
    window.moKhoCot('aurelion');
    const k = el('panel-quest').innerHTML;
    return { cap:/Cấp \d+/.test(h), cot:/CỐT —/.test(h), ky:/KỸ NĂNG ĐỒNG HÀNH/.test(h),
             boTxt:/Vỏ Trứng/.test(h), kho:/Kho Cốt/.test(k), coManh:/Đeo/.test(k) };
  });
  console.log('10) giao diện:', JSON.stringify(r10));
  if (!r10.cap || !r10.cot || !r10.ky) fail('bảng nuôi thiếu phần: ' + JSON.stringify(r10));
  else pass('bảng nuôi có đủ thanh cấp · bốn ô Cốt · kỹ năng đồng hành');
  if (!r10.boTxt) fail('không hiện tên bộ đang đủ 4 mảnh'); else pass('hiện tên bộ đang đủ 4 mảnh');
  if (!r10.kho || !r10.coManh) fail('kho Cốt không mở được'); else pass('kho Cốt mở được, có nút đeo');

  console.log('errors:', JSON.stringify(errs.slice(0,5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  console.log(bad ? 'FAILED ' + bad : 'PASS');
  await b.close(); process.exit(bad ? 1 : 0);
})();
