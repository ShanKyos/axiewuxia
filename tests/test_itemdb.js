// Danh mục 273 món + khoá lớp. (220 khi còn 10 giai / 5 dải, 546 khi 14 giai — nay 7 giai;
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
    // mỗi món vẽ ra một ảnh — gom lại xem có món nào trùng ảnh không
    const seen = new Map(); const trung = [];
    let loi = 0;
    for (const id of ids){
      const d = ITEM_DB[id];
      let u = null;
      try { u = itemArtUrl(d, d.tier, 2, 0); } catch { loi++; continue; }
      if (!u || u.length < 500){ loi++; continue; }
      if (seen.has(u)) trung.push([seen.get(u), id]); else seen.set(u, id);
    }
    o.veLoi = loi; o.anhTrung = trung.length; o.viDuTrung = trung.slice(0, 4);
    // tên không trùng
    const names = ids.map(i => ITEM_DB[i].name);
    o.tenTrung = names.length - new Set(names).size;
    // mỗi lớp phải đủ 15 vũ khí + 25 giáp
    o.theoLop = {};
    for (const sk of ['thieulam','baidasan','toanchan','minhgiao','bug']){
      o.theoLop[sk] = {
        vukhi: ids.filter(i => ITEM_DB[i].kind === 'weapon' && ITEM_DB[i].sect === sk).length,
        giap:  ids.filter(i => ITEM_DB[i].kind === 'armor'  && ITEM_DB[i].sect === sk).length,
      };
    }
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
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (r.tong !== 273) fail(`danh mục có ${r.tong} món, cần 273`);
  if (r.theoLoai.armor !== 140) fail(`giáp ${r.theoLoai.armor}, cần 140 (35 bộ × 4 ô)`);
  if (r.theoLoai.weapon !== 105) fail(`vũ khí ${r.theoLoai.weapon}, cần 105`);
  if (r.theoLoai.acc !== 28) fail(`phụ kiện ${r.theoLoai.acc}, cần 28`);
  if (r.veLoi) fail(`${r.veLoi} món KHÔNG vẽ được`);
  if (r.anhTrung) fail(`${r.anhTrung} cặp món ra CÙNG một ảnh: ${JSON.stringify(r.viDuTrung)}`);
  if (r.tenTrung) fail(`${r.tenTrung} tên bị trùng`);
  for (const sk in r.theoLop){
    if (r.theoLop[sk].vukhi !== 21) fail(`${sk}: ${r.theoLop[sk].vukhi} vũ khí, cần 21 (3 dòng × 7 giai)`);
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
