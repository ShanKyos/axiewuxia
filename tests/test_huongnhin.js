// TÁM HƯỚNG NHÌN — tầng chọn bản vẽ
//
// Thế giới nhìn từ trên xuống mà art chỉ có một hướng nghiêng. Đo trước bản này:
// `heroSprite(..., back=true)` và `back=false` lệch **0 trên 52.000 điểm ảnh** — cờ `_ps.back`
// vừa nhân đôi số ô đệm sprite vừa không đổi lấy một điểm ảnh.
//
// Tầng mới: `NV_HUONG` (8 hướng → 5 bản vẽ + lật ngang) và `NV_BANVE` (bộ nào có bản nào).
// Bài này gác hai lời hứa, và lời hứa thứ hai mới là chỗ dễ vỡ:
//   ① chưa có art hướng mới thì KHÔNG ĐỔI GÌ — phải trùng khít luật cũ `Math.cos(face) < 0`;
//   ② thêm một mã bản vẽ vào NV_BANVE là hướng đó sống ngay, không sửa một dòng máy nào.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(4000);

  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  // ── 1. Bảng tám hướng phải đúng hình học ────────────────────────────────────────────────
  const r1 = await p.evaluate(() => ({
    so: typeof NV_HUONG !== 'undefined' ? NV_HUONG.length : null,
    ban: typeof NV_HUONG !== 'undefined' ? [...new Set(NV_HUONG.map(h => h.ban))] : null,
    // hai hướng cùng bản vẽ thì phải NGƯỢC nhau ở cờ lật, không thì một bên vẽ sai chiều
    cap: typeof NV_HUONG !== 'undefined' ? NV_HUONG.map(h => h.ban + (h.lat ? '·lật' : '')) : null,
    coHam: typeof nvChonHuong === 'function' && typeof nvBanVeCo === 'function',
  }));
  if (r1.so !== 8) fail(`NV_HUONG có ${r1.so} mục, phải là 8`);
  else pass('NV_HUONG đủ 8 hướng');
  if (!r1.ban || r1.ban.length !== 5)
    fail(`${r1.ban ? r1.ban.length : 0} bản vẽ — 8 hướng phải gom về ĐÚNG 5 bản (Đ·ĐB·B·ĐN·N), ` +
         'còn lại lật ngang. Nhiều hơn 5 là đặt thừa art; ít hơn là có hướng không tả được.');
  else pass('8 hướng gom về 5 bản vẽ: ' + r1.ban.map(x => x || '(nghiêng)').join(' · '));
  if (r1.cap && new Set(r1.cap).size !== 8)
    fail('hai hướng trùng nhau cả bản vẽ lẫn cờ lật: ' + r1.cap.join(', '));
  else if (r1.cap) pass('8 hướng là 8 tổ hợp (bản vẽ × lật) khác nhau');
  if (!r1.coHam) fail('thiếu nvChonHuong()/nvBanVeCo()');

  // ── 2. CHƯA có art hướng mới ⇒ phải trùng khít luật cũ ──────────────────────────────────
  // Quét mịn cả vòng tròn, không chỉ tám mốc: chỗ hỏng nằm GIỮA hai mốc. Bản đầu làm tròn góc
  // TRƯỚC rồi mới đo khoảng cách, và ở dải 90°–112,5° nó chọn Đông trong khi luật cũ chọn Tây
  // — tức bật tầng hướng lên là nhân vật quay ngược, dù chưa có một tệp art mới nào.
  const r2 = await p.evaluate(() => {
    const base = nvBoGoc('thieulam', heroTier(player), gearVisual(player));
    const hong = [];
    for (let i = 0; i < 720; i++){
      const f = -Math.PI + i * Math.PI * 2 / 720;
      const h = nvChonHuong(base, f);
      const cu = Math.cos(f) < 0;
      if (h.ban !== '' || h.lat !== cu) hong.push({ deg: Math.round(f * 180 / Math.PI), ban: h.ban, lat: h.lat, cu });
    }
    return { base, banCo: nvBanVeCo(base), hong: hong.slice(0, 6), so: hong.length };
  });
  if (r2.banCo.length !== 1 || r2.banCo[0] !== '')
    pass(`bộ ${r2.base} đã khai thêm bản vẽ (${r2.banCo.join(',')}) — mục 2 bỏ qua`);
  else if (r2.so)
    fail(`${r2.so}/720 góc lệch luật cũ, ví dụ ` +
         r2.hong.map(h => `${h.deg}° → ${h.ban || 'nghiêng'}${h.lat ? '·lật' : ''} (cũ: ${h.cu ? 'lật' : 'không'})`).join(', '));
  else pass('720/720 góc trùng khít luật cũ — bật tầng hướng không đổi một điểm ảnh');

  // ── 3. Thêm một bản vẽ vào bảng ⇒ hướng đó sống ngay ────────────────────────────────────
  // Đây là lời hứa "chạy theo dữ liệu". Gắn tạm mã 'b' rồi tháo ra, không đụng tệp art nào:
  // chỉ kiểm PHÉP CHỌN, vì đó là thứ quyết định art nào được đọc.
  const r3 = await p.evaluate(() => {
    const base = nvBoGoc('thieulam', heroTier(player), gearVisual(player));
    const cu = NV_BANVE[base];
    NV_BANVE[base] = ['', 'b'];
    const bac  = nvChonHuong(base, -Math.PI / 2);      // đi thẳng lên
    const tbac = nvChonHuong(base, -Math.PI * 3 / 4);  // Tây-Bắc: chưa có 'bd', phải lui
    const dong = nvChonHuong(base, 0);
    if (cu) NV_BANVE[base] = cu; else delete NV_BANVE[base];
    const sau = nvChonHuong(base, -Math.PI / 2);
    return { bac, tbac, dong, sau };
  });
  if (r3.bac.ban !== 'b' || r3.bac.lat)
    fail(`khai 'b' rồi mà đi lên Bắc vẫn lấy bản ${r3.bac.ban || 'nghiêng'} — tầng hướng không chạy theo dữ liệu`);
  else pass("thêm 'b' vào NV_BANVE ⇒ hướng Bắc dùng bản 'b', không lật");
  if (r3.dong.ban !== '' || r3.dong.lat) fail('thêm bản Bắc lại làm hỏng hướng Đông');
  else pass('hướng Đông không bị ảnh hưởng');
  if (!(r3.tbac.ban === 'b' || r3.tbac.ban === ''))
    fail(`Tây-Bắc lấy bản ${r3.tbac.ban} mà bộ chưa có bản đó`);
  else pass(`Tây-Bắc chưa có bản riêng ⇒ lui về ${r3.tbac.ban || 'nghiêng'}${r3.tbac.lat ? '·lật' : ''}`);
  if (r3.sau.ban !== '') fail('tháo khai báo ra rồi mà vẫn còn dùng bản Bắc');
  else pass('tháo khai báo ⇒ về đúng hiện trạng');

  // ── 4. `back` không còn nhân đôi bộ nhớ đệm ─────────────────────────────────────────────
  // Bộ CÓ art thì back=true và back=false phải rơi vào CÙNG một ô đệm, vì chúng cho ra hai
  // tấm ảnh giống hệt nhau (đo được 0/52.000 điểm ảnh lệch).
  const r4 = await p.evaluate(() => {
    const gv = gearVisual(player), tier = heroTier(player);
    // dựng sẵn cho nóng đệm rồi mới đếm
    heroSprite('thieulam', tier, gv, 'w', 3, 'slash', false, 0, 'w', '');
    const a = heroSpriteStats();
    heroSprite('thieulam', tier, gv, 'w', 3, 'slash', true, 0, 'w', '');
    const b = heroSpriteStats();
    return { themMoi: b.miss - a.miss, coArt: !!nvBoTen('thieulam', tier, gv, '') };
  });
  if (!r4.coArt) pass('bộ chưa có art — mục 4 bỏ qua');
  else if (r4.themMoi !== 0)
    fail('back=true dựng thêm một ô đệm nữa dù art không đổi — vẫn đang tốn gấp đôi ô nhớ');
  else pass('back không còn nằm trong khoá đệm khi bộ có art');

  if (errs.length) fail('lỗi trang — ' + errs[0].slice(0, 140));
  await b.close();
  console.log(bad ? `\n${bad} LỖI` : '\nTẤT CẢ XANH');
  process.exit(bad ? 1 : 0);
})();
