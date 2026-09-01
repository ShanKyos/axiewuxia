// QUY TẮC SỐ 1 của CLAUDE.md: phong cách là MU Online, không phải kiếm hiệp.
// Bài kiểm này quét TỪ VỰNG TU TIÊN trong chuỗi NGƯỜI CHƠI THẤY. Nhắc trong comment thì không
// sao — quy tắc nói về nội dung game, không nói về ghi chú kỹ thuật.
const { chromium } = require('playwright');
const fs = require('fs');
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
    let txt; try { txt = fs.readFileSync('/home/user/axie-wuxia/' + f, 'utf-8'); } catch { continue; }
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

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
