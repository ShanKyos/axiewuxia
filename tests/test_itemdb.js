// Danh mục 266 món + khoá lớp. (220 khi còn 10 giai / 5 dải, 546 khi 14 giai — nay 7 giai;
// 616 khi còn ô Quần — bỏ ô đó đi là mỗi bộ còn 4 ô giáp, 7×5×4 = 140.) Mỗi món phải VẼ
// ĐƯỢC và phải KHÁC món khác — nếu hai món ra cùng một ảnh thì danh mục chỉ to trên giấy.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });

  const r = await p.evaluate(() => {
    const o = {}, ids = Object.keys(ITEM_DB);
    o.tong = ids.length;
    o.theoLoai = {};
    for (const id of ids){ const d = ITEM_DB[id]; o.theoLoai[d.kind] = (o.theoLoai[d.kind]||0)+1; }
    // Mỗi món phải VẼ RA ĐƯỢC. Còn "phải khác nhau" thì nay chỉ đòi ở món CÓ ART THẬT:
    // giáp và vũ khí chưa có art dùng chung ô chờ art (một bóng dáng phẳng cho mỗi loại), nên
    // Kiếm Đồng và Rìu Đồng ra cùng một ảnh là ĐÚNG — chúng chưa được vẽ. Bắt lỗi chỗ đó thì
    // bài kiểm đỏ suốt cho tới khi đủ 105 tấm vũ khí, mà đỏ liên miên thì không ai đọc nữa.
    // Món CÓ art vẫn phải riêng biệt: hai gói Spine khác nhau mà ra cùng một icon là lỗi thật.
    // NGUỒN ART của một món — hai món CÙNG nguồn thì ra cùng ảnh là đúng, không phải lỗi.
    // Ba dòng trượng Dark Wizard phần lớn dùng chung tấm tk_dwstaff.png. Hai cây đã có tranh
    // riêng (quyentruong giai 1 và 2) nên tách ra nguồn riêng — đó là đích đến, không phải lỗi.
    // Chỉ khi hai NGUỒN KHÁC NHAU cho ra cùng một ảnh mới là lỗi thật.
    // Phụ kiện NAY CŨNG về ô chờ art: chủ dự án chốt xoá nốt hình vector của nhẫn và dây
    // chuyền (đợt trước còn giữ lại hai bộ này). Nên chúng trả null như giáp/vũ khí chưa có
    // tranh — 28 món dùng chung 3 bóng dáng phẳng là ĐÚNG, không phải trùng ảnh.
    const nguon = (d) => {
      if (d.kind === 'weapon'){ const A = vkAnh(d); return A ? 'vk:' + A.tep : null; }
      if (d.kind === 'armor'){ const g = NV_GIAP[d.sect + '|' + d.tier]; return g ? 'giap:' + g + ':' + d.slot : null; }
      return null;
    };
    // Không còn MỘT hàm vẽ vector nào cho trang bị. Bảng tra ITEM_ART đã gỡ hẳn; mọi món đi
    // thẳng vào iaChuaArt. Gác ở đây để lần sau không ai lặng lẽ thêm lại một món "cho đẹp".
    // ── ICON VŨ KHÍ PHẢI LÀ TRANH THẬT ──
    // Lỗi thật đã gặp: drawItemIcon cho MỌI món qua iaChuaArt, nên cây trượng Dark Wizard cầm
    // trên tay là tranh vẽ mà trong túi lại là một thanh chữ nhật phẳng — hai hình cho cùng một
    // món. Gác cả ba mặt: có tấm, icon KHÁC ô chờ art, và nó phải là ẢNH MÀU chứ không phải
    // bóng đen (bản đầu tô nhầm bóng vì đoán lượt hào quang qua `pal.glow === null`).
    o.vk = {};
    { const d = ITEM_DB['baidasan_gay_0'];
      o.vk.coTranh = !!vkTranhCuaMon(d);
      const uThat = itemArtUrl(d, d.tier, 0, 0);
      // dựng lại đúng món đó nhưng ÉP về ô chờ art, để so
      const c = document.createElement('canvas');
      c.width = ICON_PX; c.height = ICON_PX;
      const g2 = c.getContext('2d');
      g2.translate(ICON_PX/2, ICON_PX/2); g2.scale(ICON_PX/100, ICON_PX/100);
      iaChuaArt(g2, itemPal(d, d.tier), d);
      o.vk.khacOCho = uThat !== c.toDataURL();
      // đếm màu trong tấm icon: tranh thật nhiều màu, bóng đặc thì rất ít
      const c2 = document.createElement('canvas');
      c2.width = ICON_PX; c2.height = ICON_PX;
      drawItemIcon(c2.getContext('2d'), d, d.tier, 0, 0);
      const px = c2.getContext('2d').getImageData(0, 0, ICON_PX, ICON_PX).data;
      const mau = new Set();
      for (let i = 0; i < px.length; i += 4) if (px[i+3] > 200) mau.add((px[i]<<16)|(px[i+1]<<8)|px[i+2]);
      o.vk.soMau = mau.size;
    }
    o.conVector = [];
    if (typeof ITEM_ART    !== 'undefined') o.conVector.push('ITEM_ART');
    if (typeof iaRing      !== 'undefined') o.conVector.push('iaRing');
    if (typeof iaPendPhys  !== 'undefined') o.conVector.push('iaPendPhys');
    if (typeof iaPendMagic !== 'undefined') o.conVector.push('iaPendMagic');
    if (typeof iSheenArc   !== 'undefined') o.conVector.push('iSheenArc');
    const seen = new Map(); const trung = []; const daXet = new Set();
    let loi = 0, oCho = 0;
    for (const id of ids){
      const d = ITEM_DB[id];
      let u = null;
      try { u = itemArtUrl(d, d.tier, 2, 0); } catch { loi++; continue; }
      if (!u || u.length < 500){ loi++; continue; }
      const ng = nguon(d);
      if (!ng){ oCho++; continue; }
      if (daXet.has(ng)) continue;                                      // nguồn này đã đo rồi
      daXet.add(ng);
      if (seen.has(u)) trung.push([seen.get(u), id]); else seen.set(u, id);
    }
    o.veLoi = loi; o.anhTrung = trung.length; o.viDuTrung = trung.slice(0, 4);
    o.coArt = ids.length - oCho; o.oChoArt = oCho; o.soNguon = daXet.size;
    // tên không trùng
    const names = ids.map(i => ITEM_DB[i].name);
    o.tenTrung = names.length - new Set(names).size;
    // mỗi lớp phải đủ 15 vũ khí + 25 giáp
    o.theoLop = {};
    for (const sk of ['thieulam','baidasan','toanchan','minhgiao','bug']){
      o.theoLop[sk] = {
        vukhi: ids.filter(i => ITEM_DB[i].kind === 'weapon' && ITEM_DB[i].sect === sk).length,
        giap:  ids.filter(i => ITEM_DB[i].kind === 'armor'  && ITEM_DB[i].sect === sk).length,
        // Số dòng vũ khí KHÔNG còn bằng nhau giữa các lớp: Dark Wizard đã dẹp dòng Tinh Trượng
        // (nó và dòng Gậy vẽ ra cùng một tấm, giai 7 có hai món trùng hình). Suy từ WEAPON_LINES
        // thay vì ghi cứng 3 — thêm hay bớt dòng nào thì bài kiểm tự theo.
        soDong: WEAPON_LINES.filter(L => L.sect === sk).length,
      };
    }
    o.giaiMax = GIAI_MAX;
    o.phuKien = ids.filter(i => ITEM_DB[i].kind === 'acc').length;
    o.phuKienKhoaLop = ids.filter(i => ITEM_DB[i].kind === 'acc' && ITEM_DB[i].sect).length;

    // ── KHOÁ LỚP: cả ba chỗ mặc đồ ──────────────────────────────────────
    player.level = 100; player.autoEquip = true; calcDerived();
    const mk = (defId) => { const d = ITEM_DB[defId];
      const it = genSpecific(d.slot, 2, d.lv); it.def = defId; it.name = d.name; it.tier = d.tier; return it; };
    const kiemDK = mk('thieulam_kiem_2');            // kiếm — chỉ Dark Knight
    const nhanChung = mk('acc_nhan1_r1_2');          // nhẫn — ai cũng đeo

    // đang là Dark Knight: mặc được kiếm
    o.dk_mackiem = itemUsable(kiemDK);
    // đổi sang Dark Wizard: KHÔNG được
    player.sect = 'baidasan';
    o.dw_mackiem = itemUsable(kiemDK);
    o.dw_macnhan = itemUsable(nhanChung);
    o.loiKhoa = itemLockMsg(kiemDK);

    // (1) bấm mặc tay
    player.equip = {}; player.inv = [kiemDK]; equipItem(0);
    o.chan_tay = !player.equip.vukhi;
    // (2) tự mặc khi nhặt
    player.equip = {}; player.inv = []; tryAutoEquip(kiemDK);
    o.chan_tuMac = !player.equip.vukhi;
    // (3) nút Mặc Đồ Tốt Nhất
    player.equip = {}; player.inv = [kiemDK]; autoEquipBest();
    o.chan_macTotNhat = !player.equip.vukhi;
    // đối chứng: gậy của Dark Wizard thì PHẢI mặc được qua cả ba
    const gayDW = mk('baidasan_gay_2');
    player.equip = {}; player.inv = [gayDW]; equipItem(0);
    o.doiChung_dwMacGay = !!player.equip.vukhi;
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  console.log(`\nĐỘ PHỦ ART MÓN ĐỒ: ${r.coArt}/${r.tong} — còn ${r.oChoArt} món dùng ô chờ art (${r.soNguon} nguồn art rời)\n`);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (!r.vk.coTranh) fail('baidasan_gay_0 không lấy được tranh vũ khí — VK_ANH hoặc đường nạp hỏng');
  if (!r.vk.khacOCho) fail('icon vũ khí CÓ TRANH vẫn ra y hệt ô chờ art — drawItemIcon chưa dùng tranh');
  if (r.vk.soMau < 200) fail(`icon vũ khí chỉ có ${r.vk.soMau} màu — nhiều khả năng đang tô thành BÓNG ĐẶC thay vì vẽ tranh`);
  if (r.conVector.length) fail(`còn hình vector cho trang bị: ${r.conVector.join(', ')} — phải xoá hết, mọi món về ô chờ art`);
  // 266 chứ không 273: đã dẹp dòng Tinh Trượng của Dark Wizard (7 món).
  if (r.tong !== 266) fail(`danh mục có ${r.tong} món, cần 266`);
  if (r.theoLoai.armor !== 140) fail(`giáp ${r.theoLoai.armor}, cần 140 (35 bộ × 4 ô)`);
  if (r.theoLoai.weapon !== 98) fail(`vũ khí ${r.theoLoai.weapon}, cần 98 (14 dòng × 7 giai)`);
  if (r.theoLoai.acc !== 28) fail(`phụ kiện ${r.theoLoai.acc}, cần 28`);
  if (r.veLoi) fail(`${r.veLoi} món KHÔNG vẽ được`);
  if (r.anhTrung) fail(`${r.anhTrung} cặp món CÓ ART ra CÙNG một ảnh: ${JSON.stringify(r.viDuTrung)}`);
  if (r.tenTrung) fail(`${r.tenTrung} tên bị trùng`);
  for (const sk in r.theoLop){
    const _can = r.theoLop[sk].soDong * r.giaiMax;
    if (r.theoLop[sk].vukhi !== _can)
      fail(`${sk}: ${r.theoLop[sk].vukhi} vũ khí, cần ${_can} (${r.theoLop[sk].soDong} dòng × ${r.giaiMax} giai)`);
    if (r.theoLop[sk].giap !== 28) fail(`${sk}: ${r.theoLop[sk].giap} giáp, cần 28 (7 giai × 4 ô)`);
  }
  if (r.phuKienKhoaLop !== 0) fail('phụ kiện bị khoá lớp — dây chuyền và nhẫn phải dùng chung');
  if (!r.dk_mackiem) fail('Dark Knight không mặc được kiếm của chính mình');
  if (r.dw_mackiem) fail('Dark Wizard mặc được KIẾM — khoá lớp hỏng');
  if (!r.dw_macnhan) fail('Dark Wizard không đeo được nhẫn chung');
  if (!/Dark Knight/.test(r.loiKhoa)) fail(`câu báo khoá không nói rõ lớp: "${r.loiKhoa}"`);
  if (!r.chan_tay) fail('bấm mặc tay: LÁCH được khoá lớp');
  if (!r.chan_tuMac) fail('tự mặc khi nhặt: LÁCH được khoá lớp');
  if (!r.chan_macTotNhat) fail('nút Mặc Đồ Tốt Nhất: LÁCH được khoá lớp');
  if (!r.doiChung_dwMacGay) fail('đối chứng hỏng: Dark Wizard không mặc nổi gậy của mình — khoá quá tay');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
