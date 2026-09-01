// HUD gọn lại + cửa sổ Nhân Vật (V) + gỡ nút nhảy.
// Trước: góc trái nhồi danh hiệu + tên + lớp + cấp + điểm cộng vào MỘT dòng (xuống ba dòng trên
// màn hình thường), rồi thanh EXP, rồi một dòng Instinct chạy suốt trận. Ô cuối thanh kỹ năng là
// Phiêu Vân Bộ (nhảy) — chủ game không dùng, trong khi nhặt đồ trên điện thoại lại không có nút.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1180, height: 780 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION|ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html?max=1'); await p.waitForTimeout(800);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  await p.evaluate(() => { window.TEST_MODE = true; startGame('toanchan', null); applyTestBoost(); calcDerived();
    player.level = 98; player.xp = XP_TABLE[97] * 0.62; player.free = 12; calcDerived();
    document.querySelectorAll('.tut-box,#tut').forEach(e => e.remove()); closePanels(); });
  await p.waitForTimeout(700);

  // ---- 1. HUD góc trái: Instinct đi hẳn, tên gọn lại ----
  const hud = await p.evaluate(() => {
    const nm = document.getElementById('hud-name'), r = nm.getBoundingClientRect();
    const xp = document.querySelector('#xp-strip .bar.xp'), xr = xp && xp.getBoundingClientRect();
    const orb = document.getElementById('orb-hp').getBoundingClientRect();
    return { coHudKhi: !!document.getElementById('hud-khi'),
      tenText: nm.textContent.trim(), soDong: Math.round(r.height / 20),
      coLop: /Sylvan Ranger|Dark Knight/.test(nm.textContent),
      coCap: /Cấp \d/.test(nm.textContent),
      coDauDiem: /\+12/.test(nm.textContent),
      xpTrongHud: !!document.querySelector('#hud-left .bar.xp'),
      xpDuoiOrb: !!(xr && xr.top > orb.top),
      xpCuoiManHinh: !!(xr && xr.bottom > innerHeight - 30),
      xpHien: !!(xr && xr.width > 100) };
  });
  console.log('HUD:', JSON.stringify(hud));
  if (hud.coHudKhi) fail('dòng Instinct vẫn còn trên HUD');
  if (hud.coLop || hud.coCap) fail(`dòng tên vẫn nhồi lớp/cấp: "${hud.tenText}"`);
  if (!hud.coDauDiem) fail('mất dấu "+12 điểm chưa cộng" cạnh tên');
  if (hud.xpTrongHud) fail('thanh EXP vẫn nằm ở góc trên trái');
  if (!hud.xpDuoiOrb) fail('thanh EXP không nằm DƯỚI viên đá máu');
  if (!hud.xpCuoiManHinh || !hud.xpHien) fail('thanh EXP không hiện ở đáy màn hình');

  // ---- 2. Phím V mở cửa sổ Nhân Vật, có đủ thứ đã chuyển sang ----
  // Bài này sinh ra để gác việc DỌN HUD: lớp, cấp, điểm cộng, Instinct bị bỏ khỏi góc trái thì
  // phải tìm được ở cửa sổ nhân vật. Nguyên tắc đó không đổi — chỉ có điều nay chỉ còn MỘT cửa
  // sổ. Trước đây phím C và phím V mở hai bảng riêng in y hệt nhau (#panel-vstat đã gỡ), nên
  // bài chuyển sang soi #panel-char.
  // Bỏ luôn phép kiểm "bảng V phải có thanh EXP": mục 1 ngay trên đã xác nhận EXP nằm cố định ở
  // đáy màn hình dưới viên đá máu. In thêm một thanh EXP trong bảng là đúng loại trùng lặp mà
  // đợt gộp này đi dọn.
  await p.keyboard.press('v'); await p.waitForTimeout(400);
  const v = await p.evaluate(() => {
    const pan = document.getElementById('panel-char');
    const txt = pan.textContent;
    return { mo: !pan.classList.contains('hidden'), tab: window.charTab,
      conBangCu: !!document.getElementById('panel-vstat'),
      coLop: /Sylvan Ranger/.test(txt), coCap: /Cấp 98/.test(txt),
      coDiem: /12/.test(txt),
      coInstinct: /Instinct/.test(txt), coHeDon: /Hệ đòn đánh/.test(txt),
      soKhoiThuocTinh: (pan.innerHTML.match(/THUỘC TÍNH CHIẾN ĐẤU/g) || []).length,
      soDongAttr: pan.querySelectorAll('.attr-row').length,
      nutCong: [...pan.querySelectorAll('.attr-row')].map(r2 => r2.querySelectorAll('.plus-btn').length),
      rong: Math.round(pan.getBoundingClientRect().width) };
  });
  console.log('cửa sổ nhân vật:', JSON.stringify(v));
  if (!v.mo) fail('phím V không mở bảng Nhân Vật');
  if (v.tab !== 'info') fail(`phím V mở tab "${v.tab}", phải là Thông Tin`);
  if (v.conBangCu) fail('#panel-vstat vẫn còn — hai cửa sổ nhân vật in trùng nội dung');
  if (!v.coLop || !v.coCap) fail('cửa sổ nhân vật thiếu lớp/cấp');
  if (!v.coInstinct) fail('thiếu Instinct (thứ vừa gỡ khỏi HUD)');
  if (!v.coHeDon) fail('thiếu Hệ đòn đánh');
  if (v.soKhoiThuocTinh !== 1) fail(`THUỘC TÍNH CHIẾN ĐẤU in ${v.soKhoiThuocTinh} lần, phải đúng 1`);
  if (v.soDongAttr !== 5) fail(`có ${v.soDongAttr} dòng thuộc tính, cần 5`);
  if (!v.nutCong.every(x => x === 2)) fail(`dòng thuộc tính thiếu nút +/Max: ${JSON.stringify(v.nutCong)}`);

  // cộng điểm phải cập nhật ngay chính bảng đang mở
  const add = await p.evaluate(() => {
    const before = player.dStr, f0 = player.free;
    document.querySelector('#panel-char .attr-row .plus-btn').click();
    const shown = document.querySelector('#panel-char .attr-row b').textContent;
    return { before, after: player.dStr, freeTruoc: f0, freeSau: player.free, hienThi: shown };
  });
  console.log('cộng điểm:', JSON.stringify(add));
  if (add.after <= add.before) fail('bấm + không cộng được điểm');
  if (String(add.after) !== add.hienThi) fail(`bảng không vẽ lại sau khi cộng (hiện ${add.hienThi}, thật ${add.after})`);

  // ---- 3. Nút nhảy đã gỡ, ô đó thành NHẶT ĐỒ ----
  await p.evaluate(() => closePanels()); await p.waitForTimeout(200);
  const sk = await p.evaluate(() => ({
    conNutNhay: !!document.getElementById('sk-jump'),
    coNutNhat: !!document.getElementById('sk-loot'),
    nhan: (document.getElementById('sk-loot') || {}).title,
    conDoJump: typeof window.doJump !== 'undefined',
    hint: (document.getElementById('hint-bar') || {}).textContent || '',
  }));
  console.log('thanh kỹ năng:', JSON.stringify(sk));
  if (sk.conNutNhay) fail('nút nhảy (sk-jump) vẫn còn');
  if (!sk.coNutNhat) fail('không có nút Nhặt thay thế — điện thoại mất đường nhặt đồ');
  if (sk.conDoJump) fail('hàm doJump vẫn tồn tại (mã chết)');
  if (/nhảy|jump/i.test(sk.hint)) fail(`dòng gợi ý phím vẫn nhắc nhảy: "${sk.hint}"`);

  // nút Nhặt phải nhặt được đồ thật
  const pick = await p.evaluate(() => {
    travelTo('comoc'); groundLoot = []; player.inv = [];
    const g = dropToGround({ k:'item', it: genItem(60, 0, 'elite') }, 3000, 3000);
    g.z = 0; g.vz = 0; g.fly = 1; player.x = g.x - 50; player.y = g.y;
    document.getElementById('sk-loot').click();
    return { tui: player.inv.length, conDat: groundLoot.length };
  });
  console.log('nút Nhặt:', JSON.stringify(pick));
  if (pick.tui !== 1 || pick.conDat !== 0) fail('bấm nút Nhặt không nhặt được đồ dưới đất');

  // ---- 4. Chơi thật 4 giây, không lỗi console (đã gỡ jumpT khỏi vòng update/vẽ) ----
  await p.evaluate(() => { closePanels(); player.auto = true; });
  await p.waitForTimeout(4000);
  const alive = await p.evaluate(() => ({ hp: Math.round(player.hp), x: Math.round(player.x) }));
  console.log('chạy 4s:', JSON.stringify(alive));

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
