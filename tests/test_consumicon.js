// Bình máu / sách phép / bùa / hộp / đá phải CÓ HÌNH và ĐỦ THÔNG TIN, như trang bị.
//
// Trước đây chỉ trang bị mới có icon (sinh từ ITEM_ART). Mọi vật phẩm khác phải mượn emoji hoặc
// chỉ in chữ. Emoji thì phụ thuộc font máy người chơi — ⚔ và 🛡 đã hiện thành ô vuông ngay trong
// tiệm — còn chữ thì không nói được "đây là một món".
//
// Bài này gác:
//   1. Mọi món trong danh mục vẽ ra ảnh THẬT (dataURL PNG khác rỗng), không phải ký tự.
//   2. Mỗi hình khác nhau thật sự — không phải cùng một hình đổi màu.
//   3. Dòng thông tin đọc từ trạng thái người chơi, đổi theo chỉ số.
//   4. Các bảng (tiệm · túi đồ · kỹ năng) đều dùng ảnh chứ không còn ký tự.
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

  // 1) mỗi món vẽ ra ảnh thật
  const r1 = await p.evaluate(() => {
    const out = {};
    for (const id in CONSUM_DB){
      const u = consumArtUrl(CONSUM_DB[id].art, CONSUM_DB[id].col);
      out[id] = { laAnh: u.startsWith('data:image/png'), dai: u.length };
    }
    return out;
  });
  const xau = Object.entries(r1).filter(([, v]) => !v.laAnh || v.dai < 500);
  console.log('1) vẽ icon:', Object.keys(r1).length, 'món · ngắn/lỗi:', JSON.stringify(xau));
  if (xau.length) fail('có món không vẽ ra ảnh: ' + xau.map(x => x[0]).join(', '));

  // 2) các hình PHẢI khác nhau — không phải một hình tô lại màu
  const r2 = await p.evaluate(() => {
    const arts = [...new Set(Object.values(CONSUM_DB).map(d => d.art))];
    const urls = arts.map(a => consumArtUrl(a, '#888888'));   // CÙNG màu, chỉ khác hình
    return { soHinh: arts.length, soKhacNhau: new Set(urls).size, arts };
  });
  console.log('2) số hình khác nhau:', JSON.stringify(r2));
  if (r2.soKhacNhau !== r2.soHinh) fail(`${r2.soHinh} kiểu hình mà chỉ ${r2.soKhacNhau} ảnh khác nhau — có hình trùng`);

  // 3) dòng thông tin đọc từ trạng thái NGƯỜI CHƠI
  const r3 = await p.evaluate(() => {
    player.potionPct = 0.4; player.potions = 2;
    const a = CONSUM_DB.thuoc.info(), a2 = consumTip('thuoc');
    player.potionPct = 0.9; player.potions = 5;
    const b2 = CONSUM_DB.thuoc.info();
    player.bikipVH = 41;
    return { truoc:a, sau:b2, doi: a !== b2, sach: CONSUM_DB.sach.info(), coTui: /tối đa 5/.test(a2) };
  });
  console.log('3) thông tin sống:', JSON.stringify(r3));
  if (!r3.doi) fail('đổi potionPct mà dòng thông tin không đổi');
  if (!/41/.test(r3.sach)) fail('Sách Kỹ Năng không hiện số đang có: ' + r3.sach);
  if (!r3.coTui) fail('thẻ không nói sức chứa túi');

  // 4) các bảng dùng ẢNH, không còn ký tự
  const r4 = await p.evaluate(() => {
    const out = {};
    renderShop(NPCS.find(x => x.id === 'duoclao'));
    const sh = el('panel-quest').innerHTML;
    out.tiem = { anh: (sh.match(/<img[^>]+src="data:image\/png/g) || []).length, conEmoji: /🧪|◎|⚡|✚/.test(sh) };
    player.baohap = { 3:2 }; player.noidan = 5;
    closePanels(); window.bagTab = 'box'; renderBag();
    const bg = el('panel-bag').innerHTML;
    out.tui = { anh: (bg.match(/<img[^>]+src="data:image\/png/g) || []).length, conCham: /">●<\/span>/.test(bg) };
    // Thẻ Sách Kỹ Năng nay nằm ở tab CHIÊU ĐANG DÙNG, không ở tab di sản nữa: sau khi bỏ "học
    // di sản ngoại lớp", sách dùng để nâng cấp chiêu của chính mình, và nút 📜 nằm ngay cạnh
    // từng dòng chiêu ở tab đó (xem docs/KY_NANG_5_LOP.md §5).
    closePanels(); togglePanel('skill');   // bảng Kỹ Năng nay MỘT trang, không còn tab
    const sk = el('panel-skill').innerHTML;
    // Chỉ soi THẺ Sách Kỹ Năng. 📜 ở chỗ khác là ký hiệu ĐƠN VỊ trong nút giá ("Học · 3📜"),
    // giống ◈ cho bạc — nó render bình thường, khác ⚔/🛡 vốn ra ô vuông. Cấm nó khắp nơi là
    // đo nhầm thứ: cái đáng gác là thẻ vật phẩm phải có HÌNH.
    // Bóc thẻ bằng DOM chứ không bằng regex trên chuỗi HTML — lần trước regex khớp hụt và báo
    // đỏ oan trong khi thẻ vẫn có hình.
    const the = [...el('panel-skill').querySelectorAll('.shop-row')]
      .find(d => /Sách Kỹ Năng/.test(d.textContent));
    out.kyNang = { anh: (sk.match(/<img[^>]+src="data:image\/png/g) || []).length,
                   coThe: !!the,
                   theCoAnh: !!(the && the.querySelector('img[src^="data:image/png"]')),
                   theCoGiay: !!(the && /📜/.test(the.textContent)) };
    // Câu "thanh chiêu chỉ có 4 ô" trước nằm ở tab DI SẢN; nay cùng một trang với phần trên.
    out.baOo = /Thanh chiêu chỉ có 4 ô/.test(el('panel-skill').innerHTML);
    return out;
  });
  console.log('4) các bảng:', JSON.stringify(r4));
  if (r4.tiem.anh < 5) fail(`tiệm chỉ có ${r4.tiem.anh} icon vẽ`);
  if (r4.tiem.conEmoji) fail('tiệm còn emoji cho món đã có icon');
  if (r4.tui.anh < 3) fail(`túi đồ chỉ có ${r4.tui.anh} icon vẽ`);
  if (r4.tui.conCham) fail('Lõi Nguyên Tố vẫn dùng ký tự ●');
  if (!r4.kyNang.anh) fail('bảng kỹ năng không có icon vẽ nào');
  if (!r4.kyNang.coThe) fail('không tìm thấy thẻ Sách Kỹ Năng trong bảng kỹ năng');
  if (!r4.kyNang.theCoAnh) fail('thẻ Sách Kỹ Năng chưa có hình');
  if (r4.kyNang.theCoGiay) fail('thẻ Sách Kỹ Năng vẫn dùng emoji thay cho hình');
  if (!r4.baOo) fail('bảng kỹ năng vẫn ghi thanh chiêu 3 ô (đã là 4)');

  await p.waitForTimeout(400);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
