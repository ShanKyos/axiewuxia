// BA BẬC CÁNH × NĂM LỚP — 15 đôi, khoá theo lớp, và phải NHÌN THẤY ĐƯỢC ở cả hai nơi.
//
// Bốn nhóm:
//   1) Bảng: đủ 3 bậc × 6 lớp (5 lớp + Tán Nhân), id không trùng, chỉ số leo theo bậc.
//   2) Khoá lớp: đôi của lớp khác thì KHÔNG mặc được, và phải nói rõ vì sao.
//   3) Chế tạo: bậc 1 → 2 → 3, thăng tại chỗ, bậc 3 có rủi ro và Thiên Mệnh Phù đỡ được.
//   4) Vẽ: cánh hiện trên CẢ nhân vật trong màn LẪN chân dung bảng Nhân Vật, và chân dung
//      phải ĐỔI khi thăng bậc (bẫy cache khoá theo sect:tier).
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

  // ── 1. BẢNG ────────────────────────────────────────────────────────────────
  const bang = await page.evaluate(() => {
    const LOP = ['thieulam','toanchan','baidasan','minhgiao','bug','vophai'];
    const ids = [], thieu = [], leo = [];
    for (let t = 0; t < 3; t++) for (const sk of LOP){
      const d = WING_BANG[t][sk];
      if (!d) { thieu.push(`bậc${t+1}/${sk}`); continue; }
      ids.push(d.id);
    }
    // dòng chính (số lớn nhất trong các khoá %) phải leo theo bậc ở MỌI lớp
    const chinh = (d) => Math.max(...['atkPct','hpPct','defPct','evaPct'].map(k => d[k] || 0));
    for (const sk of LOP){
      const a = chinh(WING_BANG[0][sk]), b = chinh(WING_BANG[1][sk]), c = chinh(WING_BANG[2][sk]);
      if (!(a < b && b < c)) leo.push(`${sk}: ${a}/${b}/${c}`);
    }
    return { so: ids.length, trung: ids.length - new Set(ids).size, thieu, leo,
             sai: WING_TIERS.map(t => t.sai), cao: WING_TIERS.map(t => t.cao),
             thuy: WING_TIERS.map(t => t.thuy),
             // Sáu trục phân biệt bậc: mỗi trục phải LEO, và ít nhất bốn trục phải đổi
             // giữa bậc 1 và bậc 2 — không thì ba bậc lại nhìn giống hệt nhau.
             truc: ['thuy','nhon','gai','duoi','vien','hao'].map(k => WING_TIERS.map(t => t[k])),
             bac1: ['vien','hao','hat','gai'].map(k => WING_TIERS[0][k]),
             chuX: WING_TIERS.map(t => t.chuX || 0) };
  });
  console.log('bảng:', JSON.stringify(bang));
  check('đủ 18 đôi (3 bậc × 6 lớp)', bang.so, 18);
  check('không id nào trùng', bang.trung, 0);
  check('không lớp nào thiếu cánh', bang.thieu, []);
  check('dòng chính LEO theo bậc ở mọi lớp', bang.leo, []);
  // Kích thước tính bằng pixel bộ xương (cao 220), không phải pixel thế giới. Tỉ lệ đọc từ
  // ảnh cánh MU thật: cánh bậc 1 ĐÃ vươn quá đỉnh đầu (y=53) — mốc này từng bị đoán ngược.
  check('tầm vươn ngang leo 56 → 84 → 102', bang.sai, [56,84,102]);
  check('tầm vươn lên leo 62 → 78 → 92', bang.cao, [62,78,92]);
  check('số tầng thùy leo 2 → 3 → 4', bang.thuy, [2,3,4]);
  cond('đỉnh cánh vượt đỉnh đầu ở CẢ BA bậc', bang.cao,
       v => v.every(c => 108 - c < 53), 'cánh không vượt được đầu thì không ra dáng cánh MU');
  // Bậc 2 nở theo BỀ NGANG là chính, bậc 3 xếp hình chữ X — hai dấu hiệu tách bậc rõ nhất.
  cond('lên bậc thì nở NGANG nhiều hơn nở CAO', [bang.sai, bang.cao],
       v => (v[0][1] - v[0][0]) > (v[1][1] - v[1][0]) && (v[0][2] - v[0][1]) > (v[1][2] - v[1][1]),
       'bậc trên phải trải rộng ra hai bên, không phải vống lên trời');
  check('chỉ bậc 3 xếp hình chữ X', bang.chuX, [0,0,1]);
  cond('không trục nào tụt, và trục nào cũng cao hơn ở bậc 3 so với bậc 1', bang.truc,
       v => v.every(a => a[0] <= a[1] && a[1] <= a[2] && a[0] < a[2]),
       'có trục tụt hoặc đứng yên suốt ba bậc — bậc sẽ nhìn giống nhau');
  // Bậc 2 phải khác bậc 1 ở NHIỀU trục cùng lúc. Chỉ to hơn thôi thì người chơi nhìn không ra.
  cond('bậc 1 → bậc 2 đổi ít nhất 4 trong 6 trục', bang.truc.filter(a => a[0] !== a[1]).length,
       n => n >= 4, 'quá ít dấu hiệu đổi giữa hai bậc đầu');
  cond('bậc 1 KHÔNG phát sáng, không gai (mốc để bậc 2/3 còn chỗ leo)', bang.bac1,
       v => v.every(x => !x), 'bậc 1 đã sáng sẵn thì bậc 2 lấy gì hơn');

  // ── 2. KHOÁ LỚP ────────────────────────────────────────────────────────────
  const khoa = await page.evaluate(() => {
    const r = { sai: [], dung: [] };
    for (const sk of ['thieulam','toanchan','baidasan','minhgiao','bug']){
      const w = genWing(sk, 2);
      player.sect = 'thieulam';
      if (sk === 'thieulam'){ if (!itemUsable(w)) r.dung.push(sk); }
      else if (itemUsable(w)) r.sai.push(sk);
    }
    const la = genWing('toanchan', 1);
    player.sect = 'thieulam';
    return { chuiLot: r.sai, tuChoiOan: r.dung, loi: itemLockMsg(la),
             // Mặc Đồ Tốt Nhất cũng phải tôn trọng khoá, không được lách
             macBua: (() => { player.inv = []; bagThem(la); player.equip.canh = null;
                              autoEquipBest(); return !!player.equip.canh; })() };
  });
  console.log('khoá lớp:', JSON.stringify(khoa));
  check('không đôi lớp khác nào lọt qua', khoa.chuiLot, []);
  check('đôi của chính lớp mình thì mặc được', khoa.tuChoiOan, []);
  cond('có câu nói rõ vì sao', khoa.loi, t => /chỉ .* dùng được/.test(t), 'phải nêu tên lớp');
  check('Mặc Đồ Tốt Nhất không lách khoá', khoa.macBua, false);

  // ── 3. CHẾ TẠO ─────────────────────────────────────────────────────────────
  const che = await page.evaluate(() => {
    const R = (id) => CHAOS_RECIPES.find(x => x.id === id);
    const out = {};
    out.coDu3 = ['wing1','wing2','wing3'].every(id => !!R(id));
    out.royal = ['wing1','wing2','wing3'].every(id => R(id).royal === true);
    out.capGate = ['wing1','wing2','wing3'].map(id => {
      const T = WING_TIERS[+id.slice(-1) - 1]; return T.lv; });
    // bậc 2 chỉ khớp khi khay có cánh bậc 1
    const c1 = genWing('thieulam', 1), c2 = genWing('thieulam', 2);
    out.b2_nhanBac1 = !!R('wing2').match({ items:[c1], jewels:{}, nJewel:1 });
    out.b2_choiBac2 = !R('wing2').match({ items:[c2], jewels:{}, nJewel:1 });
    out.b3_choiThieuTe = !R('wing3').match({ items:[c2], jewels:{}, nJewel:2 });
    const te = genSpecific('ao', 4, 100); te.plus = 9; te.rarity = 4;
    out.b3_nhanDuTe = !!R('wing3').match({ items:[c2, te], jewels:{}, nJewel:2 });
    // bậc 3 là bậc DUY NHẤT có rủi ro
    player.sect = 'thieulam';
    out.rate = ['wing1','wing2','wing3'].map(id => {
      const m = id === 'wing3' ? { it:c2, te, need:{honDon:2} } : { it: id==='wing2'?c1:te, need:{honDon:1} };
      return R(id).plan({ items:[], jewels:{}, nJewel:0 }, m).rate; });
    out.charm = ['wing1','wing2','wing3'].map(id => {
      const m = id === 'wing3' ? { it:c2, te, need:{honDon:2} } : { it: id==='wing2'?c1:te, need:{honDon:1} };
      return R(id).plan({ items:[], jewels:{}, nJewel:0 }, m).charm; });
    return out;
  });
  console.log('chế tạo:', JSON.stringify(che));
  check('đủ ba công thức', che.coDu3, true);
  check('cả ba đều phải tới Lò Rèn Hoàng Gia', che.royal, true);
  check('cổng cấp 40 / 80 / 100', che.capGate, [40,80,100]);
  check('bậc 2 nhận cánh bậc 1', che.b2_nhanBac1, true);
  check('bậc 2 từ chối cánh đã bậc 2', che.b2_choiBac2, true);
  check('bậc 3 từ chối khi thiếu vật hiến tế', che.b3_choiThieuTe, true);
  check('bậc 3 nhận khi đủ cánh 2 + món Chí Tôn +9', che.b3_nhanDuTe, true);
  check('chỉ bậc 3 có rủi ro', che.rate, [100,100,70]);
  check('chỉ bậc 3 cho dùng Thiên Mệnh Phù', che.charm, [false,false,true]);

  // thăng TẠI CHỖ: đang mặc thì vẫn mặc, không rơi ra túi
  const thang = await page.evaluate(() => {
    player.sect = 'thieulam'; player.level = 120; player.inv = [];
    player.jewels.honDon = 50; player.gems.honNguyen = 500; player.silver = 9e6; player.charms = 9;
    player.equip.canh = genWing('thieulam', 1);
    const uid0 = player.equip.canh.uid;
    forgeTray = []; chaosAddItem(uid0); chaosAddJewel('honDon'); chaosPickRecipe('wing2');
    const cur = chaosCurrent();
    if (!cur) return { loi: 'không khớp công thức wing2' };
    cur.rec.run(cur.v, cur.m, cur.p);
    return { bacSau: wingBac(player.equip.canh), conMac: !!player.equip.canh,
             tuiTrong: player.inv.length, ten: player.equip.canh.name };
  });
  console.log('thăng tại chỗ:', JSON.stringify(thang));
  check('thăng xong thành bậc 2', thang.bacSau, 2);
  check('vẫn đang mặc, không rơi ra túi', [thang.conMac, thang.tuiTrong], [true, 0]);

  // ── 4. VẼ ──────────────────────────────────────────────────────────────────
  const ve = await page.evaluate(() => {
    const anh = (bac) => { player.equip.canh = bac ? genWing(player.sect, bac) : null;
                           return heroCardUrl(player.sect, 12, gearVisual(player)); };
    const khong = anh(0), b1 = anh(1), b2 = anh(2), b3 = anh(3);
    return { gvCoCanh: !!gearVisual(player).canh,
             doiKhiMac: khong !== b1, doiKhiThang12: b1 !== b2, doiKhiThang23: b2 !== b3 };
  });
  console.log('vẽ:', JSON.stringify(ve));
  check('gearVisual đưa cánh ra ngoài', ve.gvCoCanh, true);
  check('chân dung ĐỔI khi mặc cánh', ve.doiKhiMac, true);
  check('chân dung ĐỔI khi thăng bậc 1→2', ve.doiKhiThang12, true);
  check('chân dung ĐỔI khi thăng bậc 2→3', ve.doiKhiThang23, true);

  // cánh phải đọc sway của nhân vật, không đọc thẳng đồng hồ
  // In ra CẢ mã nguồn hàm thì log dài 4 KB và chôn mất mười lăm dòng OK phía trên — chỉ cần
  // câu trả lời có/không.
  const docSway = await page.evaluate(() => { const t = veCanh.toString();
    return /\bsway\b/.test(t) && /\bswayDir\b/.test(t); });
  check('veCanh đọc sway/swayDir (cánh là bộ phận mềm, theo quán tính người chứ không theo đồng hồ)', docSway, true);

  check('không lỗi trang', errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 4));
  console.log(ok.every(Boolean) ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok.every(Boolean) ? 0 : 1);
})();
