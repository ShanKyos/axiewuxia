// HỆ LÕI NGUYÊN TỐ ĐÃ GỠ, và VỨT ĐỒ chừa đúng hai loại.
//
// Lõi Nguyên Tố là trục cộng chỉ số thứ ba nằm ngoài trang bị và ngoài cấp độ: nhặt lõi từ
// quái tinh anh rồi bấm một nút để cộng vĩnh viễn, tối đa 3 lần mỗi ngày. Nó thưởng cho việc
// MỞ GAME MỖI NGÀY chứ không thưởng cho việc chơi giỏi. Gỡ cả hệ, và gỡ luôn chỉ số đã hấp
// thụ trong save cũ — chủ dự án chốt "gỡ luôn cho sạch".
//
// Bài kiểm này gác hai thứ dễ sót nhất khi gỡ một hệ: (1) trường dữ liệu bị dựng lại ở đường
// nạp save cũ, và (2) chữ quảng cáo hệ đó còn nằm trong mô tả map — người chơi đọc thấy rồi
// đi tìm một thứ không tồn tại.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(800);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('baidasan', { name:'Đo' });
    const o = {};
    o.truong = ['noidan','ndBonus','ndDay','ndCount'].filter(k => k in player);
    o.dailyCon = player.daily && 'noidan' in player.daily;
    o.conHam = ['swallowNoidan','ndToday'].filter(k => typeof window[k] === 'function');
    // chữ quảng cáo hệ đã gỡ, trong mô tả map
    o.mapNhacLoi = Object.values(MAPS).filter(m => /Lõi Nguyên Tố/.test(m.desc || '')).length;
    // bảng túi phải dựng được và không còn mục Lõi
    renderBag();
    o.bagDung = el('panel-bag').innerHTML.length > 200;
    o.bagConLoi = /Lõi Nguyên Tố/.test(el('panel-bag').innerHTML);
    // save cũ có lõi + chỉ số đã hấp thụ ⇒ nạp lại phải sạch
    player.noidan = 7; player.ndBonus = { atk:60, hp:400, def:0, qi:0, crit:0 };
    player.ndDay = 'x'; player.ndCount = 2; player.boLoi = false;
    migrateBoLoi();
    o.sauChuyenDoi = ['noidan','ndBonus','ndDay','ndCount'].filter(k => k in player);
    return o;
  });
  console.log('1) gỡ hệ:', JSON.stringify(r));
  if (r.truong.length) fail(`nhân vật mới vẫn còn trường ${r.truong.join(', ')}`);
  else pass('nhân vật mới không còn trường nào của hệ Lõi');
  if (r.dailyCon) fail('Mục Tiêu Hôm Nay vẫn còn ô đếm noidan');
  else pass('Mục Tiêu Hôm Nay đã bỏ ô Lõi');
  if (r.conHam.length) fail(`còn hàm ${r.conHam.join(', ')} — hệ chưa gỡ hết`);
  else pass('không còn hàm hấp thụ nào');
  if (r.mapNhacLoi) fail(`${r.mapNhacLoi} map còn quảng cáo Lõi Nguyên Tố trong mô tả`);
  else pass('không map nào còn nhắc Lõi Nguyên Tố');
  if (!r.bagDung) fail('bảng túi dựng hỏng sau khi gỡ hệ');
  else if (r.bagConLoi) fail('bảng túi vẫn còn mục Lõi Nguyên Tố');
  else pass('bảng túi dựng được và sạch mục Lõi');
  if (r.sauChuyenDoi.length) fail(`save cũ chuyển đổi xong vẫn còn ${r.sauChuyenDoi.join(', ')}`);
  else pass('save cũ chuyển đổi xong sạch cả bốn trường');

  // ── VỨT ĐỒ ──
  const v = await p.evaluate(() => {
    const o = {};
    const thuong  = genSpecific('non', 1, 30); thuong.perfect = false;
    const hoanHao = genSpecific('ao', 4, 30);  hoanHao.perfect = true;
    o.thuong  = itemVutDuoc(thuong);
    o.hoanHao = itemVutDuoc(hoanHao);
    o.canh    = itemVutDuoc(genWing('baidasan', 1));
    o.aoChoang = itemVutDuoc(genCloak(1));
    o.lyDoHoanHao = itemVutLyDo(hoanHao);
    o.lyDoCanh    = itemVutLyDo(genWing('baidasan', 1));
    // vứt thật: món rời túi và NẰM DƯỚI ĐẤT, không phải bốc hơi
    player.inv = [thuong]; groundLoot.length = 0;
    window._vutArm = 0; dropItem(0);
    o.tuiCon = player.inv.length;
    o.duoiDat = groundLoot.filter(g => g.k === 'item' && g.it === thuong).length;
    return o;
  });
  console.log('2) vứt đồ:', JSON.stringify(v));
  if (!v.thuong) fail('đồ thường không vứt được');
  else pass('đồ thường vứt được');
  if (v.hoanHao) fail('đồ Hoàn Hảo vứt được — phải chặn');
  else if (!v.lyDoHoanHao) fail('chặn đồ Hoàn Hảo nhưng không nói lý do');
  else pass('đồ Hoàn Hảo bị chặn, có kèm lý do');
  if (v.canh) fail('cánh vứt được — phải chặn');
  else if (!v.lyDoCanh) fail('chặn cánh nhưng không nói lý do');
  else pass('cánh bị chặn, có kèm lý do');
  if (v.aoChoang) fail('áo choàng vứt được — đồ đặc biệt phải chặn');
  else pass('áo choàng bị chặn');
  if (v.tuiCon !== 0) fail(`vứt rồi mà túi vẫn còn ${v.tuiCon} món`);
  else if (v.duoiDat !== 1) fail('món bị vứt không nằm dưới đất — nó bốc hơi mất');
  else pass('món vứt ra rơi xuống đất, nhặt lại được');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
