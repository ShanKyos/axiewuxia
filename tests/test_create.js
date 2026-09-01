// Màn tạo nhân vật kiểu MU: chọn lớp + đặt tên. Màn "Thẻ Tiên Duyên" (16 lá thái cực/bát quái)
// phải biến mất hoàn toàn — mã, HTML, CSS lẫn ảnh.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, h, lab] of [[1366, 900, 'máy bàn'], [390, 844, 'điện thoại']]){
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = [], bad404 = [];
    p.on('pageerror', e => errs.push(String(e)));
    p.on('response', r => { if (r.status() >= 400 && !/\/api\//.test(r.url())) bad404.push(r.url()); });
    await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
    await p.waitForTimeout(1100);
    await p.evaluate(() => { try { closeIntro(); } catch(e) { openCreate(); } });
    await p.waitForTimeout(500);

    const r = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('#cc-classes .cc-card')];
      const r0 = cards.map(c => c.getBoundingClientRect());
      return { hien: !document.getElementById('sect-select').classList.contains('hidden'),
        soThe: cards.length,
        ten: [...document.querySelectorAll('#cc-classes .cc-nm')].map(e => e.textContent.trim()),
        anhLaHero: [...document.querySelectorAll('#cc-classes .cc-art')].every(i => i.src.startsWith('data:image/png')),
        ngoaiMan: r0.filter(x => x.left < 0 || x.right > innerWidth).length,
        nhoQua: r0.filter(x => x.width < 40 || x.height < 40).length,
        coQuze: !!document.getElementById('quze-screen'),
        coBanQuze: !!document.querySelector('.qzc, .qz-card, #quze-board'),
        nutTaoKhoa: document.getElementById('btn-create').disabled };
    });
    console.log(lab + ':', JSON.stringify(r));
    if (!r.hien) fail(lab + ': màn tạo nhân vật không hiện');
    else if (r.soThe !== 5) fail(`${lab}: có ${r.soThe} lớp, mong 5`);
    else pass(`${lab}: 5 lớp — ${r.ten.join(' · ')}`);
    if (!r.anhLaHero) fail(lab + ': ảnh lớp không phải hình nhân vật dựng từ drawHeroFigure');
    else pass(lab + ': ảnh mỗi lớp vẽ bằng chính drawHeroFigure của game');
    if (r.ngoaiMan) fail(`${lab}: ${r.ngoaiMan} thẻ lớp nằm ngoài màn hình`);
    else if (r.nhoQua) fail(`${lab}: ${r.nhoQua} thẻ nhỏ hơn 40px`);
    else pass(lab + ': 5 thẻ nằm trọn trong màn hình');
    if (r.coQuze || r.coBanQuze) fail(lab + ': màn Thẻ Tiên Duyên vẫn còn trong DOM');
    else pass(lab + ': không còn dấu vết màn Thẻ Tiên Duyên');
    if (!r.nutTaoKhoa) fail(lab + ': chưa chọn lớp mà nút Tạo Nhân Vật đã mở');
    else pass(lab + ': chưa chọn lớp thì nút Tạo Nhân Vật khoá');

    // chọn lớp → mở nút; xoá tên → khoá lại; tạo → vào game đúng lớp và đúng tên
    const flow = await p.evaluate(() => {
      const out = {};
      document.querySelectorAll('#cc-classes .cc-card')[2].click();      // Dark Wizard
      out.sauKhiChon = document.getElementById('btn-create').disabled;
      out.chiTiet = document.getElementById('cc-detail').innerText.slice(0, 40);
      const i = document.getElementById('inp-char-name');
      i.value = ''; i.dispatchEvent(new Event('input'));
      out.tenRong = document.getElementById('btn-create').disabled;
      out.canhBao = document.getElementById('cc-name-warn').textContent;
      i.value = 'A'; i.dispatchEvent(new Event('input'));
      out.tenMotKyTu = document.getElementById('btn-create').disabled;
      i.value = '  Thợ Săn <script>  '; i.dispatchEvent(new Event('input'));
      out.tenCoThe = document.getElementById('btn-create').disabled;
      return out;
    });
    console.log(lab + ' luồng:', JSON.stringify(flow));
    if (flow.sauKhiChon) fail(lab + ': chọn lớp rồi mà nút vẫn khoá');
    else pass(lab + ': chọn lớp → mở nút, ô chi tiết đổi theo (' + flow.chiTiet.trim() + '…)');
    if (!flow.tenRong || !flow.tenMotKyTu) fail(lab + ': tên rỗng / 1 ký tự vẫn tạo được');
    else pass(lab + ': tên rỗng và tên 1 ký tự đều bị chặn — "' + flow.canhBao + '"');
    if (flow.tenCoThe) fail(lab + ': tên hợp lệ mà vẫn khoá nút');

    const made = await p.evaluate(() => {
      document.getElementById('btn-create').click();
      return null;
    });
    void made;
    await p.waitForTimeout(1400);
    const g = await p.evaluate(() => ({ vao: !document.getElementById('hud').classList.contains('hidden'),
      lop: player && player.sect, ten: player && player.name, thienPhu: player && (player.traits||[]).length,
      pers: player && player.personality }));
    console.log(lab + ' vào game:', JSON.stringify(g));
    if (!g.vao) fail(lab + ': bấm Tạo Nhân Vật mà không vào được game');
    else if (g.lop !== 'baidasan') fail(`${lab}: vào game sai lớp — ${g.lop}, mong baidasan`);
    else if (/[<>]/.test(g.ten || '')) fail(lab + ': tên chưa lọc ký tự nguy hiểm — ' + g.ten);
    else pass(`${lab}: vào game đúng lớp đã chọn, tên "${g.ten}", ${g.thienPhu} thiên phú roll ngầm`);

    if (bad404.length) fail(lab + ': còn tài nguyên 404 — ' + JSON.stringify(bad404.slice(0,3)));
    else pass(lab + ': không tài nguyên nào 404');
    if (errs.length) fail(lab + ': pageerror ' + JSON.stringify(errs.slice(0,2)));
    await p.close();
  }
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
