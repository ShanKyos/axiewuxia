// QUY TẮC SỐ 1 của CLAUDE.md: phong cách là MU Online, không phải kiếm hiệp.
// Mục A và B quét TỪ VỰNG TU TIÊN trong chuỗi NGƯỜI CHƠI THẤY — đó là lỗi thật sự.
// Mục D quét trong CHÚ THÍCH. Trước đây bài này miễn hẳn cho chú thích, và trong một thời gian
// dài đó là lựa chọn đúng. Nhưng đếm lại thì có 39 chỗ, và phần lớn KHÔNG phải ghi chú lịch sử
// mà là chú thích mô tả hệ thống ĐANG SỐNG bằng tên cũ ("kỹ năng môn phái", "hồi chân khí",
// "Cương Khí hộ thể" cho thứ trong mã tên là GANGKHI_TIERS: Stonehide/Slateskin/Ironbell).
// Chú thích là thứ người viết mã tiếp theo đọc để biết gọi thứ này là gì — nên nó dạy sai từ
// vựng cho chính người sẽ viết chuỗi hiện ra sau này. Vì thế nay chú thích cũng bị soi.
// KHÁC BIỆT quan trọng: tên riêng của MU Online (Lorencia, Devil Square, Blood Castle) trong
// chú thích thì VẪN ĐƯỢC — CLAUDE.md cho phép ghi công nguồn cảm hứng, và bỏ đi thì mất luôn
// thông tin thật (người sau không biết bố cục quảng trường lấy từ đâu).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
// ⚠ ĐƯỜNG DẪN PHẢI DÒ, KHÔNG CHÉP CỨNG — VÀ PHẢI ĐÚNG Ở CẢ HAI BỐ CỤC.
// Bản đầu đọc '/home/user/axie-wuxia/...' chép cứng: thư mục đó không tồn tại (kho nằm ở
// /home/user/axiewuxia) nên readFileSync ném ENOENT và bài đỏ vì LÝ DO MÔI TRƯỜNG.
// Bản sửa thứ hai dùng path.resolve(__dirname,'..') — đúng khi chạy từ tests/, nhưng SAI dưới
// tools/reg.sh: bộ đó chép bài sang $OUT/src và phục vụ một BẢN CHỤP ở $OUT/snap, mà snap CHÍNH
// LÀ thư mục public/game (cp -r public/game "$SNAP"). Nên '..' trỏ vào $OUT, chỗ không có
// public/. Lỗi y hệt lần đầu, chỉ khác đường dẫn — nên lần này DÒ thay vì đoán.
// Trả về hàm giải đường dẫn: nhận đường dẫn kho-tương-đối, tìm ở cả hai bố cục.
const GOC = (() => {
  const thu = [];
  for (let i = 0; i <= 4; i++){
    const b = path.resolve(__dirname, ...Array(i).fill('..'));
    thu.push({ goc:b, tien:'' });                       // bố cục KHO:  <goc>/public/game/x
    thu.push({ goc:path.join(b, 'snap'), tien:'snap' }); // bố cục CHỤP: <goc>/snap/x
  }
  for (const t of thu){
    const p1 = t.tien ? path.join(t.goc, 'game.js') : path.join(t.goc, 'public/game/game.js');
    if (fs.existsSync(p1)) return t;
  }
  return { goc:path.resolve(__dirname, '..'), tien:'' };
})();
// `f` luôn viết dạng kho-tương-đối ('public/game/game.js'); bố cục chụp thì bỏ tiền tố đó đi.
const R = f => GOC.tien ? path.join(GOC.goc, f.replace(/^public\/game\//, '')) : path.join(GOC.goc, f);
if (!fs.existsSync(R('public/game/game.js'))){
  console.log('FAIL không tìm được game.js để quét tĩnh (đã dò cả bố cục kho và bản chụp)');
  process.exit(1);
}
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
const CAM = ['khinh công','Nội Đan','nội đan','xung mạch','Xung mạch','yêu thú',
             'Hồ Lô','hồ lô','Thôn phệ','thôn phệ','chân khí','Chân Khí','cảnh giới',
             'đan điền','kinh mạch','độ kiếp','phi thăng','tiên hiệp','Bí Kíp'];

(async () => {
  // A. quét TĨNH: chỉ trong chuỗi, bỏ qua comment
  const files = ['public/game/game.js','public/game/lang.js','public/game/index.html',
                 'public/game/strings/vi.js','public/game/strings/en.js'];
  const dinh = [];
  for (const f of files){
    let txt; try { txt = fs.readFileSync(R(f), 'utf-8'); } catch { continue; }
    // Bóc comment TRƯỚC rồi mới tìm. Bản đầu quét theo từng dòng và tìm trong dấu nháy — nên
    // template nhiều dòng (backtick mở ở dòng trên) lọt lưới hoàn toàn: quét tĩnh báo 0 trong
    // khi giao diện thật vẫn hiện "Nội Đan" ở hai chỗ.
    const sach = txt.replace(/\/\*[\s\S]*?\*\//g, ' ')
                    .split('\n').map(l => {
                      const c = l.indexOf('//');
                      if (c < 0) return l;
                      const b = l.slice(0, c);
                      const nhay = (b.split("'").length-1)%2 || (b.split('"').length-1)%2
                                || (b.split('`').length-1)%2;
                      return nhay ? l : b;
                    }).join('\n');
    sach.split('\n').forEach((l, i) => {
      for (const w of CAM) if (l.includes(w))
        dinh.push(`${f.split('/').pop()}:${i+1} [${w}] ${l.trim().slice(0,70)}`);
    });
  }
  console.log(`A) quét tĩnh: ${dinh.length} chuỗi dính từ cấm`);
  dinh.slice(0,8).forEach(d => console.log('   ' + d));
  if (dinh.length) fail(`${dinh.length} chuỗi người chơi thấy còn từ vựng tu tiên`);

  // B. quét ĐỘNG: mở game thật, đọc chữ trên các bảng
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8861/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(1200);
  const thay = await p.evaluate(async (CAM) => {
    const found = new Set();
    const quet = () => { const t = document.body.innerText || '';
      for (const w of CAM) if (t.includes(w)) found.add(w); };
    quet();
    for (const tab of ['char','inv','skill','quest','forge']){
      try { togglePanel(tab); } catch(e){}
      await new Promise(r => setTimeout(r, 350)); quet();
    }
    try { closePanels(); } catch(e){}
    return [...found];
  }, CAM);
  console.log('B) quét động trên giao diện thật:', JSON.stringify(thay));
  if (thay.length) fail('giao diện thật vẫn hiện: ' + thay.join(', '));

  // C. bản tiếng Anh phải còn khớp — đổi khoá tiếng Việt mà quên khoá từ điển thì EN rơi về VI
  const en = await p.evaluate(async () => {
    localStorage.setItem('vlcm_lang','en'); return true;
  });
  await p.reload({ waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(1200);
  const enText = await p.evaluate(async () => {
    try { togglePanel('char'); } catch(e){}
    await new Promise(r => setTimeout(r, 400));
    const t = document.body.innerText || '';
    return { conVietSot: ['Bình Thuốc Đỏ','Lõi Nguyên Tố'].filter(w => t.includes(w)),
             coTiengAnh: ['Red Potion','Elemental Core'].filter(w => t.includes(w)) };
  });
  console.log('C) bản tiếng Anh:', JSON.stringify(enText), '· en=' + en);
  if (enText.conVietSot.length)
    fail('bản EN vẫn hiện chữ Việt ' + enText.conVietSot.join(', ') + ' — khoá từ điển mất khớp');

  // D. quét CHÚ THÍCH của game.js — xem đầu tệp để biết vì sao mục này tồn tại
  {
    const txt = fs.readFileSync(R('public/game/game.js'), 'utf-8');
    const ct = [];
    // Lấy RA phần chú thích (ngược với mục A, vốn bóc chú thích đi)
    for (const m of txt.matchAll(/\/\*[\s\S]*?\*\//g)) ct.push(m[0]);
    txt.split('\n').forEach((l, i) => {
      const c = l.indexOf('//');
      if (c < 0) return;
      const b = l.slice(0, c);
      // '//' nằm trong chuỗi (https://) thì không phải mở chú thích
      const nhay = (b.split("'").length-1)%2 || (b.split('"').length-1)%2 || (b.split('`').length-1)%2;
      if (!nhay) ct.push(`@${i+1} ${l.slice(c)}`);
    });
    const dinhCt = [];
    for (const dong of ct)
      for (const w of CAM)
        if (dong.includes(w)) dinhCt.push(`[${w}] ${dong.trim().slice(0, 84)}`);
    console.log(`D) quét chú thích: ${dinhCt.length} chỗ dính từ cấm`);
    dinhCt.slice(0, 8).forEach(d => console.log('   ' + d));
    if (dinhCt.length) fail(`${dinhCt.length} chú thích còn từ vựng tu tiên — xem đầu tệp bài kiểm`);
    // Ngược lại: tên riêng MU trong chú thích PHẢI còn, không thì ai đó đã "sửa" nhầm chỗ được phép
    const muCt = ct.filter(d => /Lorencia|Devil Square|Blood Castle/.test(d)).length;
    console.log(`   (tên riêng MU trong chú thích: ${muCt} — được phép, ghi công nguồn cảm hứng)`);
    if (!muCt) fail('chú thích ghi công nguồn cảm hứng MU Online đã bị xoá mất — đó là thông tin thật');
  }

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
