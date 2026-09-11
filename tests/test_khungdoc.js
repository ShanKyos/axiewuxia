// KHUNG NHIỄM ĐỘC — bake lúc art chưa về rồi NHỚ LẠI vĩnh viễn
//
// Cả năm thân trần đi đường LỚP RỜI (`nvKhungGop`), mà hàm đó trả null khi một trong năm lớp
// chưa tải xong. Khoá bộ nhớ đệm sprite chỉ ghi được chuyện "thiếu TẤM LIỀN" — bộ cắt lớp thì
// KHÔNG BAO GIỜ có tấm liền, nên dấu đó bật sẵn ở cả hai trường hợp và không phân biệt được
// "chưa tải xong" với "đã tải xong". Hệ quả: khung nào lỡ dựng trong mấy trăm mili giây đầu
// nằm lại trong đệm dưới ĐÚNG cái khoá mà lượt vẽ sau dùng — và nó là hình dựng bằng đường,
// tức một NHÂN VẬT KHÁC HẲN (hiệp sĩ xám, mũ sừng, áo choàng đỏ).
//
// Đo được lúc phát hiện: cả 5 lớp đều dính, khối ĐỨNG có 1-2 khung nhiễm. Khung i4 đếm 12.828
// điểm ảnh trong khi hai khung kề bên 6.606 và 6.733. Khối đứng lặp ~4 giây một vòng nên người
// chơi thấy nó nhấp nháy suốt phiên chơi.
//
// ⚠ CÁCH ĐO, ĐỪNG ĐỔI SANG NGƯỠNG: bài này KHÔNG đặt ngưỡng "lệch quá bao nhiêu phần trăm".
// Nó dựng lại đúng khung đó dưới một khoá KHÁC (bật `TEST_TO_PHANG` — cờ này nằm trong khoá
// đệm, và nó chỉ tô đè MÀU bằng `source-in` nên BÓNG DÁNG giữ nguyên từng điểm ảnh). Bản dựng
// lại chắc chắn đọc art thật vì art đã về từ lâu. So alpha hai bên: lệch một điểm ảnh cũng là
// nhiễm. Ngưỡng phần trăm thì phải dò tay và sẽ trượt ngay khi art đổi.
const { chromium } = require('playwright');

const SECTS = [['thieulam', 'Dark Knight'], ['baidasan', 'Dark Wizard'],
               ['minhgiao', 'Spellblade'], ['toanchan', 'Sylvan Ranger'],
               ['bug', 'Dark Lord']];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  for (const [sect, ten] of SECTS){
    // Trang MỚI mỗi lớp: phải tái hiện đúng cảnh người chơi vừa vào game, art chưa về.
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__gameReady).catch(() => {});
    await p.evaluate(s => { window.TEST_MODE = true; startGame(s, null); }, sect);
    // Đứng yên đủ lâu cho art về HẲN và cho vòng vẽ kịp nhét khung hỏng vào đệm.
    await p.waitForTimeout(6000);

    const r = await p.evaluate(() => {
      const gv = gearVisual(player), tier = heroTier(player), sect = player.sect;
      // alpha của MỘT khung, quy về hệ 160×220 để hai bản dựng cùng gốc toạ độ
      const alpha = (blk, i) => {
        const f = heroSprite(sect, tier, gv, blk, i, 'slash', false, 0, blk);
        const c = document.createElement('canvas'); c.width = 220; c.height = 300;
        const g = c.getContext('2d'); g.translate(30, 30);
        g.drawImage(f, f._ox, f._oy, f._ow, f._oh);
        const d = g.getImageData(0, 0, 220, 300).data;
        const a = new Uint8Array(220 * 300);
        for (let k = 0; k < a.length; k++) a[k] = d[k * 4 + 3] > 40 ? 1 : 0;
        return a;
      };
      const hong = [];
      for (const blk of ['i', 'w', 'r', 'a', 'c']){
        const n = nvSoKhung(nvBoTen(sect, tier, gv), blk) || HS_FRAMES[blk];
        for (let i = 0; i < n; i++){
          window.TEST_TO_PHANG = false; const A = alpha(blk, i);
          window.TEST_TO_PHANG = true;  const B = alpha(blk, i);   // khoá khác ⇒ dựng lại
          window.TEST_TO_PHANG = false;
          let d = 0; for (let k = 0; k < A.length; k++) if (A[k] !== B[k]) d++;
          if (d > 0) hong.push({ blk, i, lech: d, px: A.reduce((s, v) => s + v, 0) });
        }
      }
      return { hong, boTen: nvBoTen(sect, tier, gv) };
    });

    if (r.hong.length)
      fail(`${ten} (${r.boTen}): ${r.hong.length} khung nhớ lại bản dựng lúc art chưa về — ` +
           r.hong.slice(0, 4).map(h => `${h.blk}${h.i} lệch ${h.lech}px`).join(', '));
    else pass(`${ten} (${r.boTen}): 5 khối, mọi khung trong đệm đều là art thật`);

    if (errs.length) fail(`${ten}: lỗi trang — ${errs[0].slice(0, 120)}`);
    await p.close();
  }

  await b.close();
  console.log(bad ? `\n${bad} LỖI` : '\nTẤT CẢ XANH');
  process.exit(bad ? 1 : 0);
})();
