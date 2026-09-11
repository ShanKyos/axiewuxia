// Màn hình chờ phải CHẠY, phải DỪNG khi rời màn, và phải vẽ ĐÚNG BỘ ART AXIE.
//
// Nền nay là cảnh Lunacia chính chủ, tách mười lớp (assets/title/lunacia/*.webp, nướng bằng
// tools/title/nuong_nen_axie.py), và trên đó là sân khấu #cc-hero vẽ lớp nhân vật + con Axie.
//
// Bốn thứ dễ hỏng nhất, và đây là chỗ gác chúng:
//   1. "Có canvas" không có nghĩa là "đang chạy" — phải so hai khung xem điểm ảnh có đổi không.
//   2. Vòng lặp rAF quên huỷ thì nó chạy mãi sau khi vào game, đốt pin suốt phiên chơi.
//   3. Một lớp art 404 hoặc một lớp vẽ hụt thì cảnh vẫn hiện ra "trông có vẻ được" — phải đếm
//      từng lớp, đừng nhìn tổng thể.
//   4. Sân khấu phải vẽ NHÂN VẬT THẬT (dải khung nướng từ heroSprite), không phải bộ tranh
//      anh hùng `pick_*` — và không được kéo bảng khung 159px lên cho đầy khung.
//   4b. Trang bị phải HIỆN LÊN người, mà vẫn không được rơi về hình dựng bằng đường.
//   5. Tấm phủ dìm-đêm PHẢI trong suốt một phần. Dựng nó bằng 'multiply' trên canvas trống ra
//      một ô màu ĐẶC, và lúc ấy cả cảnh biến mất dưới một mảng tím — triệu chứng trông hệt như
//      "art chưa tải". Đã dẫm đúng bẫy đó một lần.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1100,height:760} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { const d=[...document.querySelectorAll('#intro-story button')].find(x=>/Bỏ qua/.test(x.textContent)); if(d) d.click(); });
  await p.waitForTimeout(1400);

  // 1) canvas có thật, đã được cấp kích thước theo màn hình
  const r1 = await p.evaluate(() => {
    const c = document.getElementById('title-fx');
    return { co: !!c, w: c && c.width, h: c && c.height,
             manHien: !document.getElementById('sect-select').classList.contains('hidden') };
  });
  console.log('1) canvas:', JSON.stringify(r1));
  if (!r1.co) fail('không có #title-fx');
  if (!r1.manHien) fail('màn tạo nhân vật không hiện');
  if (!(r1.w > 400 && r1.h > 300)) fail(`canvas chưa cấp kích thước: ${r1.w}x${r1.h}`);

  // 2) ĐANG CHẠY THẬT — lấy hai khung cách nhau, so điểm ảnh
  const r2 = await p.evaluate(async () => {
    const c = document.getElementById('title-fx');
    const g = c.getContext('2d');
    // Lấy mẫu CẢ khung, không phải một góc: chuyển động rải khắp màn (sương ở giữa, sao ở
    // trên, bụi ở dưới). Lấy mẫu sai chỗ thì cảnh đang chạy vẫn báo "đứng hình".
    const snap = () => g.getImageData(0, 0, c.width, c.height).data;
    const a = snap();
    await new Promise(r => setTimeout(r, 900));
    const b2 = snap();
    let khac = 0;
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) > 3) khac++;
    return { tong: a.length / 4, khac };
  });
  console.log('2) chuyển động:', JSON.stringify(r2), `→ ${Math.round(r2.khac*100/r2.tong)}% điểm ảnh đổi`);
  // Ngưỡng 0,2%. Bản đầu để 1% — hợp với cảnh bến cảng cũ, nơi cả mặt biển gợn sóng suốt khung
  // hình. Cảnh núi mới cố tình TĨNH: nó là không khí sau lưng khối chọn lớp, không phải thứ để
  // nhìn, nên chỉ sương, sao và bụi động — đo được 0,85%. Thứ bài kiểm này gác là "vòng lặp
  // chết", mà vòng lặp chết thì cảnh dựng từ t sẽ cho ĐÚNG 0 điểm ảnh đổi, không phải 0,85%.
  if (r2.khac < r2.tong * 0.002) fail(`cảnh gần như đứng hình (${r2.khac}/${r2.tong} điểm ảnh đổi)`);

  // 3) vào game rồi thì vòng lặp phải DỪNG — không đốt pin suốt phiên
  const r3 = await p.evaluate(async () => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    await new Promise(r => setTimeout(r, 800));
    const c = document.getElementById('title-fx');
    const g = c.getContext('2d');
    const snap = () => g.getImageData(0, 0, c.width, c.height).data;
    const a = snap();
    await new Promise(r => setTimeout(r, 700));
    const b2 = snap();
    let khac = 0;
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) > 3) khac++;
    return { manAn: document.getElementById('sect-select').classList.contains('hidden'), khac };
  });
  console.log('3) sau khi vào game:', JSON.stringify(r3));
  if (!r3.manAn) fail('vào game rồi mà màn tạo nhân vật vẫn hiện');
  if (r3.khac > 0) fail(`vòng lặp hoạt cảnh chưa dừng — ${r3.khac} điểm ảnh vẫn đổi sau khi vào game`);

  // ── 4) Mười lớp art Axie phải TẢI ĐỦ và lớp nào cũng phải vẽ ra điểm ảnh ──
  // Nạp lại trang: mục 3 đã vào game nên cảnh nền không còn chạy nữa.
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(1500);
  const r4 = await p.evaluate(async () => {
    // Chờ cả mười lớp về — mạng chậm thì khung đầu vẽ thiếu, mà đó không phải lỗi sản phẩm.
    const xong = () => NEN_LOP.every(l => { const im = NEN_IMG[l.t]; return im && im.complete; });
    for (let i = 0; i < 60 && !xong(); i++) await new Promise(r => setTimeout(r, 100));
    const hong = NEN_LOP.filter(l => { const im = NEN_IMG[l.t]; return !(im && im.complete && im.naturalWidth); });
    // Vẽ riêng từng lớp vào một canvas sạch rồi đếm điểm ảnh đục. Lớp nào ra 0 là lớp đó
    // rơi ra ngoài khung (sai `y`, sai phép co giãn) — nhìn cả cảnh thì không bao giờ thấy.
    const hh = nenHinh(1100, 760);
    const trong = [];
    for (const l of NEN_LOP){
      const c = document.createElement('canvas'); c.width = 1100; c.height = 760;
      const g = c.getContext('2d', { willReadFrequently:true });
      nenVeLop(g, l, hh, 0);
      const d = g.getImageData(0, 0, 1100, 760).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4 * 41) if (d[i] > 10) n++;
      if (n < 20) trong.push(l.t + ':' + n);
    }
    // Tấm phủ: đếm tỉ lệ điểm ảnh ĐẶC HOÀN TOÀN. 'multiply' trên canvas trống cho ra 100%.
    const pc = nenPhu(600, 400);
    const pd = pc.getContext('2d', { willReadFrequently:true }).getImageData(0, 0, 600, 400).data;
    let dac = 0, tong = 0;
    for (let i = 3; i < pd.length; i += 4 * 17){ tong++; if (pd[i] > 250) dac++; }
    return { hong: hong.map(l => l.t), trong, phuDac: dac / tong };
  });
  console.log('4) art nền:', JSON.stringify(r4));
  if (r4.hong.length) fail('lớp nền không tải được: ' + r4.hong.join(', '));
  if (r4.trong.length) fail('lớp nền vẽ ra gần như trống: ' + r4.trong.join(', '));
  if (r4.phuDac > 0.5) fail(`tấm phủ dìm-đêm đặc ${Math.round(r4.phuDac*100)}% — nó sẽ che kín cảnh`);

  // ── 5) Sân khấu #cc-hero ──
  // HAI chế độ, và chúng phải được kiểm RIÊNG: có nhân vật thì vẽ ĐÚNG lớp của ô đang chọn,
  // chưa có ai thì vẽ cả năm lớp thành hàng. Mục 3 vừa startGame nên localStorage ĐANG có một
  // nhân vật — nạp lại trang là rơi vào chế độ một người. (Bản đầu của mục này quên mất điều
  // đó và đi đo hàng-năm-lớp trên một khung chỉ có một người: hai cột ngoài cùng ra 0, trông
  // y như lỗi bố cục.)
  const doSanKhau = async () => await p.evaluate(async () => {
    document.getElementById('intro-story').classList.add('hidden');
    showMainMenu(); window.svChon(SERVERS[0].id);
    // Ảnh Axie nạp theo nhu cầu, mỗi con một tệp — phải chờ, không thì đo vào lúc chưa có gì.
    for (let i = 0; i < 60; i++){
      const du = CC_ORDER.every(k => { const im = chiImg(CC_AXIE_LOP[k]); return im && im.complete && im.naturalWidth; });
      if (du) break;
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 400));
    const cv = document.getElementById('cc-hero');
    const g = cv.getContext('2d', { willReadFrequently:true });
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    // Chia khung làm năm cột. Đếm tổng thì bốn cột trống vẫn ra một con số to và vẫn xanh.
    const cot = [0, 0, 0, 0, 0], bw = cv.width / 5;
    for (let y = 0; y < cv.height; y += 3) for (let x = 0; x < cv.width; x += 3)
      if (d[(y * cv.width + x) * 4 + 3] > 40) cot[Math.min(4, Math.floor(x / bw))]++;
    return { an: cv.classList.contains('hidden'), cot, lop: ccHeroLop(),
             axie: CC_ORDER.map(k => CC_AXIE_LOP[k]) };
  });

  const r5 = await doSanKhau();
  console.log('5) sân khấu · một nhân vật:', JSON.stringify(r5));
  if (r5.an) fail('sân khấu #cc-hero vẫn ẩn ở màn chờ');
  if (r5.lop !== 'thieulam') fail(`ô đang chọn là Dark Knight mà sân khấu vẽ lớp "${r5.lop}"`);
  if (r5.cot.reduce((a, c) => a + c, 0) < 1500) fail('sân khấu gần như trống ở chế độ một nhân vật');
  if (new Set(r5.axie).size !== 5) fail('năm lớp phải có năm con Axie KHÁC nhau: ' + r5.axie.join(','));

  // ── 6) Tài khoản trống → cả NĂM lớp đứng thành hàng, cột nào cũng phải có người ──
  await p.evaluate(() => { try { localStorage.clear(); } catch { /* bỏ qua */ } });
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(1200);
  const r6 = await doSanKhau();
  console.log('6) sân khấu · tài khoản trống:', JSON.stringify(r6));
  if (r6.lop) fail(`tài khoản trống mà ccHeroLop() vẫn trả "${r6.lop}"`);
  r6.cot.forEach((n, i) => { if (n < 200) fail(`cột ${i + 1} của hàng năm lớp gần như trống (${n} điểm ảnh)`); });

  // ── 7) Năm lớp phải là NHÂN VẬT THẬT, và không được phóng to quá mức ──────────────────
  // Trước bản này sân khấu vẽ `assets/nv/pick_*.webp` — bộ tranh anh hùng tỉ lệ tám đầu, tức
  // màn chờ quảng cáo một nhân vật khác hẳn thứ hiện ra khi bấm Vào Game. Bài này khoá hai
  // điều: art phải là dải khung nướng từ chính heroSprite(), và bảng khung cao 159 điểm ảnh
  // KHÔNG được kéo quá CC_PHONG_TRAN lần — kéo quá là một bóng người nhoè đứng cạnh một bức
  // nền vẽ tay sắc nét, mà đó là thứ chỉ lộ ra khi chụp màn hình.
  const r7 = await p.evaluate(async () => {
    const cv = document.getElementById('cc-hero');
    for (let i = 0; i < 60; i++){
      if (CC_ORDER.every(k => ccLopAnh(k))) break;
      await new Promise(r => setTimeout(r, 100));
    }
    const bc = ccBoCuc(cv.clientWidth, cv.clientHeight, null);
    return {
      thieu: CC_ORDER.filter(k => !ccLopAnh(k)),
      // Mỗi dải phải đủ `nKhung` ô: nướng hụt một ô là vòng thở giật một nhịp mỗi vòng.
      leKhung: CC_ORDER.filter(k => {
        const A = ccLopHinh(k), im = ccLopAnh(k);
        return !A || !im || im.naturalWidth !== A.cw * window.LOP_CHO.nKhung;
      }),
      nguon: CC_ORDER.map(k => (ccLopAnh(k) || {}).src || '').map(u => u.split('/').slice(-2).join('/')),
      phong: bc.nguoi.map(n => +(n.than / ccLopHinh(n.k).than).toFixed(3)),
      tran: CC_PHONG_TRAN,
    };
  });
  console.log('7) art năm lớp:', JSON.stringify(r7));
  if (r7.thieu.length) fail('dải khung lớp chưa tải được: ' + r7.thieu.join(','));
  if (r7.leKhung.length) fail('dải khung thiếu/thừa ô: ' + r7.leKhung.join(','));
  if (!r7.nguon.every(u => /^lop\/[a-z]+\.webp$/.test(u)))
    fail('sân khấu không dùng dải khung nhân vật thật: ' + r7.nguon.join(' '));
  if (r7.phong.some(k => k > r7.tran + 1e-6))
    fail(`phóng bảng khung quá trần ${r7.tran}: ${r7.phong.join(', ')}`);

  // ── 8) TRANG BỊ phải hiện lên người — và KHÔNG được rơi về hình dựng bằng đường ─────────
  // Ba chuyện khác nhau, dễ lẫn:
  //   · Lớp CÓ art giáp cho đúng giai ấy (mới 3/35 tổ hợp) thì dựng sống, thấy nguyên bộ giáp.
  //   · Lớp CHƯA có art giáp thì `ccArtSan()` phải trả FALSE. Đây là cái van quan trọng nhất
  //     của cả đợt: `heroSprite()` không có art thì nó dựng hình bằng ĐƯỜNG, tức trả về đúng
  //     "nhân vật fake" mà đợt này sinh ra để gỡ — chỉ khác là nay nó chớp một nhịp rồi biến.
  //   · Dù có art giáp hay không, CÁNH và HÀO QUANG +N vẫn phải hiện: chúng là art/hiệu ứng
  //     thật, có cho mọi lớp, và trong MU chúng mới là thứ đọc ra "người này có đồ".
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  const r8 = await p.evaluate(async () => {
    window.TEST_MODE = true;
    const dem = async (sect, boost) => {
      startGame(sect, { name:'T' });
      if (boost) applyTestBoost();
      const pl = JSON.parse(JSON.stringify(player));
      const gv = gearVisual(pl), tier = heroTier(pl);
      // chờ art (dải nướng + bộ giáp nếu có)
      for (let i = 0; i < 50; i++){
        if (ccLopAnh(sect) && (ccArtSan(sect, tier, gv) || i > 25)) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const c = document.createElement('canvas'); c.width = 420; c.height = 340;
      const g = c.getContext('2d', { willReadFrequently:true });
      ccVeNguoiBo(g, { k:sect, cx:210, fy:300, than:150, pl }, 0);
      const d = g.getImageData(0, 0, 420, 340).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 24) n++;
      return { px:n, artSan: ccArtSan(sect, tier, gv), giap: nvBoGiap(sect, gv) || null,
               canh: !!(gv && gv.canh), plus: gv ? Math.round(gv.plus) : 0 };
    };
    return { dwTran: await dem('baidasan', false), dwDo: await dem('baidasan', true),
             sbTran: await dem('minhgiao', false), sbDo: await dem('minhgiao', true) };
  });
  console.log('8) trang bị:', JSON.stringify(r8));
  // Dark Wizard giai 7 CÓ art giáp (NV_GIAP['baidasan|7']) — đường dựng sống phải chạy.
  if (!r8.dwDo.artSan || r8.dwDo.giap !== 'dwsm1')
    fail(`Dark Wizard full đồ phải dựng sống bằng bộ giáp dwsm1, nhận: ${JSON.stringify(r8.dwDo)}`);
  // Spellblade CHƯA có art giáp ⇒ cái van phải đóng, nếu không là rơi về hình dựng bằng đường.
  if (r8.sbDo.artSan)
    fail('Spellblade chưa có art giáp mà ccArtSan() vẫn mở — sân khấu sẽ rơi về hình vẽ đường');
  // Cả hai lớp, có đồ phải KHÁC HẲN trần: cánh + hào quang +N là art/hiệu ứng thật cho mọi lớp.
  for (const [ten, a, b2] of [['Dark Wizard', r8.dwTran, r8.dwDo], ['Spellblade', r8.sbTran, r8.sbDo]]){
    if (!b2.canh || b2.plus < 7) fail(`${ten}: applyTestBoost lẽ ra cho cánh và +11, nhận ${JSON.stringify(b2)}`);
    if (b2.px < a.px * 1.35)
      fail(`${ten}: mặc đồ vào mà sân khấu gần như không đổi (${a.px} -> ${b2.px} điểm ảnh)`);
  }

  await p.waitForTimeout(300);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
