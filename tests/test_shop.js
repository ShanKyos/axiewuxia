// Tiệm phải bày MÓN THẬT, đủ thông tin — không phải một danh sách chữ.
//
// Vấn đề bản cũ: tiệm binh khí chỉ bán "Rương Binh Khí — vũ khí ngẫu nhiên theo cấp". Món đồ
// chưa tồn tại lúc bấm mua, nên không thể hiện chỉ số nào cả; người chơi trả 800◈ cho một đoạn
// mô tả. Đó là lý do cả bảng tiệm chỉ toàn chữ.
//
// Bài này gác bốn điều:
//   1. Tiệm có kho hàng THẬT — món cụ thể, cất trong save, không xáo lại mỗi lần mở bảng.
//   2. Mỗi món hiện đủ: icon, tên theo phẩm, lực chiến, cấp yêu cầu, giá.
//   3. Rê chuột ra thẻ đủ chỉ số VÀ so với đồ đang mặc (dùng chung thẻ với túi đồ).
//   4. Mua thì món vào túi, trừ đúng tiền, và ô đó hết hàng — không nhân bản.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // 1) kho hàng thật, ổn định giữa các lần mở
  const r1 = await p.evaluate(() => {
    applyTestBoost(); player.silver = 5e6;
    const npc = NPCS.find(x => x.id === 'binhkhi');
    renderShop(npc);
    const a = shopStock('binhkhi').map(it => it && it.name);
    renderShop(npc); renderShop(npc);                 // mở lại 2 lần nữa
    const c = shopStock('binhkhi').map(it => it && it.name);
    return { soMon:a.length, giongNhau: JSON.stringify(a) === JSON.stringify(c), ten:a.slice(0,3),
             luuTrongSave: !!(player.shopStock && player.shopStock.binhkhi) };
  });
  console.log('1) kho hàng:', JSON.stringify(r1));
  if (r1.soMon !== 8) fail(`kho có ${r1.soMon} món, phải 8`);
  if (!r1.giongNhau) fail('mở lại bảng là kho đổi — hàng bày không được xáo mỗi lần render');
  if (!r1.luuTrongSave) fail('kho không cất vào save');

  // 2) mỗi ô hiện đủ thông tin
  const r2 = await p.evaluate(() => {
    const h = el('panel-quest').innerHTML;
    const cells = [...el('panel-quest').querySelectorAll('.shop-cell')];
    const first = cells[0];
    return { soO: cells.length,
             coIcon: !!first.querySelector('img'),
             coTen: !!first.querySelector('.sc-name'),
             coLucChien: /Lực chiến/.test(first.textContent),
             coCap: /cấp \d/.test(first.textContent),
             coGia: /◈/.test(first.querySelector('.sc-buy').textContent),
             coTip: first.getAttribute('data-tip'),
             coViTien: /Túi tiền/.test(h) };
  });
  console.log('2) một ô hàng:', JSON.stringify(r2));
  if (r2.soO !== 8) fail(`vẽ ra ${r2.soO} ô`);
  if (!r2.coIcon) fail('ô hàng KHÔNG có icon — vẫn chỉ là chữ');
  if (!r2.coTen || !r2.coLucChien || !r2.coCap || !r2.coGia) fail('ô hàng thiếu thông tin: ' + JSON.stringify(r2));
  if (!/^shop:/.test(r2.coTip || '')) fail('ô hàng không gắn thẻ rê chuột');

  // 3) thẻ rê chuột ra đủ chỉ số + so với đồ đang mặc
  const r3 = await p.evaluate(() => {
    const it = shopStock('binhkhi').find(Boolean);
    const h = tipHtml(it, false);
    const eq = player.equip[it.slot];
    return { coChiSo: (h.match(/itip-row/g) || []).length,
             coYeuCauCap: /Yêu cầu cấp/.test(h),
             coPhamGiai: /itip-sub/.test(h),
             dangMac: !!eq, coSoSanh: /ĐANG MẶC/.test(h) || !eq };
  });
  console.log('3) thẻ rê chuột:', JSON.stringify(r3));
  if (r3.coChiSo < 1) fail('thẻ không có dòng chỉ số nào');
  if (!r3.coYeuCauCap) fail('thẻ thiếu cấp yêu cầu');
  if (!r3.coPhamGiai) fail('thẻ thiếu phẩm/giai');
  if (!r3.coSoSanh) fail('có đồ đang mặc mà thẻ không so sánh');

  // 4) mua: vào túi, trừ đúng tiền, ô hết hàng
  const r4 = await p.evaluate(() => {
    const st = shopStock('binhkhi');
    const i = st.findIndex(Boolean);
    const it = st[i], gia = shopBuyPrice(it);
    const bacTruoc = player.silver, tuiTruoc = player.inv.length;
    buyStockItem(i);
    return { gia, tru: bacTruoc - player.silver, tuiTang: player.inv.length - tuiTruoc,
             daBan: shopStock('binhkhi')[i] === null,
             tenTrongTui: player.inv[player.inv.length-1] && player.inv[player.inv.length-1].name,
             tenDaMua: it.name };
  });
  console.log('4) mua món:', JSON.stringify(r4));
  if (r4.tru !== r4.gia) fail(`trừ ${r4.tru}◈, giá ${r4.gia}◈`);
  if (r4.tuiTang !== 1) fail('món không vào túi');
  if (r4.tenTrongTui !== r4.tenDaMua) fail('món vào túi khác món đã bấm');
  if (!r4.daBan) fail('mua rồi mà ô vẫn còn hàng — có thể mua nhân bản');

  // 5) đồ tiêu hao hiện SỐ THẬT, không phải chữ chép tay
  const r5 = await p.evaluate(() => {
    player.potionPct = 0.75;                 // nâng chỉ số hồi máu
    const npc = NPCS.find(x => x.id === 'duoclao');
    renderShop(npc);
    const h = el('panel-quest').innerHTML;
    return { theo75: /Hồi 75% máu/.test(h), conGhiCung40: /Hồi 40% máu/.test(h),
             coSoLoThuoc: /đang có \d+\/5/.test(h) };
  });
  console.log('5) số liệu đồ tiêu hao:', JSON.stringify(r5));
  if (!r5.theo75) fail('nâng potionPct lên 75% mà mô tả không đổi theo');
  if (r5.conGhiCung40) fail('vẫn ghi cứng "Hồi 40% máu"');
  if (!r5.coSoLoThuoc) fail('không hiện số lọ đang có');

  // 6) hết tiền / túi đầy thì chặn, không âm tiền
  const r6 = await p.evaluate(() => {
    const npc = NPCS.find(x => x.id === 'binhkhi');
    renderShop(npc);
    player.silver = 0;
    const st = shopStock('binhkhi'); const i = st.findIndex(Boolean);
    buyStockItem(i);
    const hetTien = { bac: player.silver, conHang: !!shopStock('binhkhi')[i] };
    player.silver = 5e6;
    // Túi là LƯỚI (8×8 ô, món to chiếm nhiều ô) chứ không còn là danh sách phẳng có trần 30.
    // Phải nhồi qua bagThem() cho tới khi hết chỗ THẬT — nhét thẳng vào player.inv thì món
    // không có gx/gy, không chiếm ô nào, và cái "túi đầy" của bài kiểm là túi rỗng.
    //
    // Nhồi bằng NHẪN (1×1), không phải món ngẫu nhiên: bagThem() trả false ngay khi CÁI MÓN
    // ĐANG CẦM không vừa, trong khi lưới vẫn còn thừa ô cho món nhỏ hơn. Nhồi ngẫu nhiên thì
    // vòng lặp dừng sớm, túi chưa đầy thật, cửa hàng bán được và bài kiểm đỏ oan.
    let canh = 0;
    while (bagThem(genSpecific('nhan1', 0, 50)) && ++canh < 200);
    const truoc = player.inv.length;
    buyStockItem(i);
    return { hetTien, tuiDay: { truoc, tui: player.inv.length, oTrong: bagOTrong(),
                                conHang: !!shopStock('binhkhi')[i] } };
  });
  console.log('6) chặn mua:', JSON.stringify(r6));
  if (r6.hetTien.bac < 0) fail('mua khi hết tiền làm bạc âm');
  if (!r6.hetTien.conHang) fail('hết tiền mà vẫn lấy mất hàng');
  if (r6.tuiDay.tui > r6.tuiDay.truoc) fail('túi đầy vẫn nhét thêm được');
  if (!r6.tuiDay.conHang) fail('túi đầy mà vẫn lấy mất hàng');

  // 7) TIỆM KHÔNG BÁN ĐỒ HOÀN HẢO — hàng Hoàn Hảo phải tự săn hoặc mở Box Kundun
  const r7 = await p.evaluate(() => {
    let perfect = 0, tong = 0, saiLop = 0, saiGiai = 0;
    const giaiDung = itemTier(player.level);
    for (let lap = 0; lap < 30; lap++){            // 30 lần nhập hàng = 240 món
      player.shopStock = {};
      for (const it of shopStock('binhkhi')){
        tong++;
        if (it.perfect || (it.exc && it.exc.length)) perfect++;
        if (!itemUsable(it)) saiLop++;             // món lớp mình không dùng được
        if (Math.abs(it.tier - giaiDung) > 1) saiGiai++;
      }
    }
    return { tong, perfect, saiLop, saiGiai, giaiDung };
  });
  console.log('7) 240 món bày ra:', JSON.stringify(r7));
  if (r7.perfect) fail(`tiệm bày ${r7.perfect}/${r7.tong} món Hoàn Hảo — không được bán`);
  if (r7.saiLop) fail(`${r7.saiLop}/${r7.tong} món lớp mình không dùng được`);
  if (r7.saiGiai) fail(`${r7.saiGiai}/${r7.tong} món lệch giai so với cấp người chơi`);

  // 8) Box Kundun: bán được, tầng bám theo cấp, vào đúng ô Box Kundun
  const r8 = await p.evaluate(() => {
    const out = {};
    for (const lv of [10, 50, 95]){
      player.level = lv; calcDerived();
      out['lv'+lv] = { tang: shopBaoHapTier(), ten: BAOHAP_TIERS[shopBaoHapTier()].name };
    }
    player.level = 50; calcDerived();
    player.silver = 1e6; player.baohap = {};
    const t = shopBaoHapTier(), gia = shopBaoHapPrice(t), bacTruoc = player.silver;
    buyBaoHap();
    return Object.assign(out, { mua:{ tang:t, tru: bacTruoc - player.silver, gia, coTrongTui: player.baohap[t] } });
  });
  console.log('8) Box Kundun:', JSON.stringify(r8));
  if (r8.lv10.tang !== 1) fail(`cấp 10 ra tầng ${r8.lv10.tang}`);
  if (r8.lv50.tang !== 4) fail(`cấp 50 ra tầng ${r8.lv50.tang}`);
  // Dải hộp nay suy từ GIAI_SPAN: mỗi bậc phủ đúng 2 giai, nên bậc VI là cấp 81–96.
  // Trước đây bậc VII bắt đầu từ cấp 90 nên cấp 95 ra VII.
  if (r8.lv95.tang !== 6) fail(`cấp 95 ra tầng ${r8.lv95.tang}, cần 6 (dải VI = cấp 81–96)`);
  if (!/^Box Kundun/.test(r8.lv50.ten)) fail('tên hộp không phải Box Kundun: ' + r8.lv50.ten);
  if (r8.mua.tru !== r8.mua.gia) fail(`mua hộp trừ ${r8.mua.tru}◈, giá ${r8.mua.gia}◈`);
  if (r8.mua.coTrongTui !== 1) fail('mua hộp mà túi không có');

  await p.waitForTimeout(400);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
