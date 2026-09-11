// Nướng NĂM LỚP NHÂN VẬT THẬT ra bảng khung cho màn hình chờ.
//
// Vì sao phải nướng chứ không vẽ thẳng: nhân vật trong màn dựng từ các LỚP RỜI
// (`NV_LOP_HOP` — tóc-sau · tay-xa · chân · thân · tay-gần · đầu), và năm bộ thân cộng lại
// là 3,3 MB. Màn hình chờ là thứ ĐẦU TIÊN người chơi tải — bắt nó kéo 3,3 MB để vẽ năm bóng
// người cao hai trăm điểm ảnh là không đáng. Nướng ra năm dải khung thì còn chừng 1/10.
//
// ⚠ NƯỚNG BẰNG CHÍNH `heroSprite()` CỦA GAME, chạy trong trình duyệt thật. Chép lại phép
// chồng lớp sang Python là dựng bản sao thứ hai của một luật đang sống — sửa `NV_LOP` hay
// `NV_LOP_HOP` một lần là hai bên lệch nhau, mà lệch kiểu đó không ai thấy cho tới khi nhìn
// ảnh chụp. Ở đây art nướng ra LÀ thứ game vẽ, không có cách nào khác đi.
//
// ⚠ MỌI KHUNG CẮT CHUNG MỘT Ô. `heroSprite()` trả canvas đã cắt SÁT từng khung, nên mỗi khung
// một cỡ — dán thẳng vào dải là nhân vật nhảy tưng tưng suốt vòng thở. Lấy hợp của 16 hộp rồi
// mới cắt (cùng bài học với `nuong_chi_chay.py`).
//
// Dùng:  node tools/title/nuong_lop_cho.cjs [cổng]
//   cần một máy chủ tĩnh đang chạy ở public/game (mặc định cổng 8853) và playwright.
//   NODE_PATH=/opt/node22/lib/node_modules node tools/title/nuong_lop_cho.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = process.argv[2] || '8853';
const LOP = ['thieulam', 'toanchan', 'baidasan', 'minhgiao', 'bug'];
const KHUNG = 16;                       // khối đứng 'i' — HS_FRAMES.i
const GOC = path.resolve(__dirname, '../..');
const DICH = path.join(GOC, 'public/game/assets/title/lop');
const DATA = path.join(GOC, 'public/game/data/lop_cho.js');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.waitForTimeout(800);

  fs.mkdirSync(DICH, { recursive: true });
  const meta = {};
  for (const sect of LOP) {
    const r = await p.evaluate(async ([sect, KHUNG]) => {
      // Hỏi một lượt cho nvTai() bắt đầu kéo cả sáu lớp, rồi chờ. heroSprite() trả hình dựng
      // bằng đường khi art chưa về — nướng đúng lúc đó là nướng nhầm một nhân vật khác hẳn.
      const xin = i => heroSprite(sect, 1, null, 'i', i, '', false, 0, 'i', '');
      for (let i = 0; i < KHUNG; i++) xin(i);
      for (let thu = 0; thu < 60; thu++) {
        await new Promise(r2 => setTimeout(r2, 200));
        if (nvKhungGop(sect, 1, null, 'i', 0, '')) break;
      }
      if (!nvKhungGop(sect, 1, null, 'i', 0, '')) return { loi: 'art chưa về' };
      // Bộ nhớ đệm sprite có thể còn giữ khung dựng lúc art chưa về — ép dựng lại sạch.
      if (window._hsCache && window._hsCache.clear) window._hsCache.clear();

      const sp = [];
      for (let i = 0; i < KHUNG; i++) {
        const s = xin(i);
        if (!s) return { loi: 'khung ' + i + ' rỗng' };
        sp.push({ ox: s._ox, oy: s._oy, ow: s._ow, oh: s._oh });
      }
      // Hợp của 16 hộp, trong hệ toạ độ Ô VẼ (HERO_W x HERO_H).
      let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
      for (const s of sp) {
        x1 = Math.min(x1, s.ox); y1 = Math.min(y1, s.oy);
        x2 = Math.max(x2, s.ox + s.ow); y2 = Math.max(y2, s.oy + s.oh);
      }
      x1 = Math.floor(x1); y1 = Math.floor(y1);
      const cw = Math.ceil(x2) - x1, ch = Math.ceil(y2) - y1;

      const c = document.createElement('canvas');
      c.width = cw * KHUNG; c.height = ch;
      const g = c.getContext('2d');
      for (let i = 0; i < KHUNG; i++) {
        g.save();
        g.translate(i * cw - x1, -y1);      // đưa hệ Ô VẼ về gốc ô của khung này
        heroBlit(g, xin(i));
        g.restore();
      }
      return {
        cw, ch,
        // Mép TRÁI của ô, trong hệ Ô VẼ (HERO_W x HERO_H). Có số này thì dải khung đặt được
        // vào ĐÚNG hệ toạ độ mà heroSprite() dùng — nhờ vậy hình nướng sẵn và hình dựng sống
        // (có trang bị) chồng khít lên nhau, đổi qua lại không nhảy một điểm ảnh nào.
        // Căn theo TÂM Ô CẮT thì không làm được: mặc giáp vào là hộp bao rộng ra, tâm dời đi.
        x: x1,
        // Gót chân trong ô, tính từ mép trên ô. HERO_GOT là gót trong hệ Ô VẼ.
        got: HERO_GOT - y1,
        // Chiều cao THÂN đo trên bảng nướng — game thu theo số này để ra cỡ trên màn.
        than: CAO_THAN_NUONG,
        png: c.toDataURL('image/png'),
      };
    }, [sect, KHUNG]);
    if (r.loi) { console.error(`${sect}: ${r.loi}`); process.exitCode = 1; continue; }
    const tam = path.join(DICH, sect + '.png');
    fs.writeFileSync(tam, Buffer.from(r.png.split(',')[1], 'base64'));
    meta[sect] = { cw: r.cw, ch: r.ch, x: r.x, got: r.got, than: r.than };
    console.log(`  ${sect.padEnd(9)} ô ${r.cw}x${r.ch}  x ${r.x}  gót ${r.got}  -> ${sect}.png`);
  }
  await b.close();

  fs.writeFileSync(DATA,
    '/* SINH RA TỰ ĐỘNG bởi tools/title/nuong_lop_cho.js — đừng sửa tay.\n' +
    '   Hình học dải khung NĂM LỚP ở màn hình chờ: cỡ ô, chỗ ô nằm trong Ô VẼ (x, got), và\n' +
    '   chiều cao THÂN đo trên bảng nướng (game thu theo số này, không theo chiều cao ô). */\n' +
    'window.LOP_CHO = ' + JSON.stringify({ nKhung: KHUNG, o: meta }, null, 1) + ';\n');
  console.log('bảng hình học -> ' + path.relative(GOC, DATA));
  console.log('\n⚠ Còn một bước THỦ CÔNG: chuyển PNG sang WEBP rồi xoá PNG —\n' +
              '   python3 tools/title/png_sang_webp.py ' + path.relative(GOC, DICH));
})();
