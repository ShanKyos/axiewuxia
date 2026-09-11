// THANH CHIẾN ĐẤU + DẤU NEO NHÂN VẬT — mục 05 và 07 của biên bản soi giao diện.
//
// Vì sao bài này tồn tại: đợt làm hai mục đó đã đẻ ra một lỗi mà ĐỌC CODE KHÔNG RA. Con tem
// phím tắt khai `left`+`top`, nhưng một rule `.skill .sk-key` THỨ HAI cách đó 450 dòng đã khai
// `bottom`+`right`. Bốn cạnh cùng được đặt trên một phần tử absolute cỡ auto ⇒ nó bị KÉO GIÃN
// phủ kín ô, và cái nền đen .78 của con tem hoá ra một tấm phủ lên toàn bộ icon. Đo được độ
// sáng ô chiêu tụt 79,1 → 22,7 (tối hơn ba lần), mà nhìn bằng mắt chỉ thấy "icon hơi tối".
// Ba vòng bisect mới ra. Nên: chốt bằng SỐ ĐO, không bằng mắt.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const ok = m => console.log('  ok  ' + m);

// Ngưỡng lấy từ số đo thật, đã trừ biên. Hiện trạng lúc chốt: sk-0 = 76,7 · sk-thuoc = 67,4.
// Bản hỏng đo được 22,7 / 21,9 — nên sàn 45 nằm gọn giữa hai trạng thái, không phải số đoán.
const SAN_SANG = 45;
// ⚠ CHỐT THEO CHIỀU CAO, không theo chiều rộng. Ô Space mang chữ "Space" nên rộng 80% ô một
// cách chính đáng — chốt theo rộng là bắt vạ oan đúng cái ô đó. Còn CAO thì mọi con tem chữ
// đều ~27% ô, và bản hỏng (giãn đủ bốn cạnh) đo được 100%. Hai trạng thái cách nhau rất xa.
const TRAN_CAO = 0.45;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(2200);
  await p.evaluate(() => closePanels());
  await p.waitForTimeout(400);

  // ── 1. Con tem phím tắt không được kéo giãn ────────────────────────────────────────────
  const tem = await p.evaluate(() => {
    const out = [];
    for (const s of document.querySelectorAll('#skillbar .skill')){
      const k = s.querySelector('.sk-key');
      if (!k) continue;
      const rs = s.getBoundingClientRect(), rk = k.getBoundingClientRect();
      out.push({ id: s.id, w: rk.width / rs.width, h: rk.height / rs.height });
    }
    return out;
  });
  if (!tem.length) fail('§1 không tìm thấy ô nào có con tem phím');
  for (const t of tem){
    if (t.h > TRAN_CAO)
      fail(`§1 con tem phím ở ${t.id} bị kéo giãn — cao ${(t.h*100).toFixed(0)}% ô (trần ${TRAN_CAO*100}%). `
         + `Gần như chắc chắn là có HAI rule .sk-key cùng đặt đủ bốn cạnh: đủ bốn cạnh trên một phần tử `
         + `absolute cỡ auto là nó phình ra phủ kín ô, và cái nền của con tem thành tấm phủ lên icon.`);
  }
  if (!bad) ok(`§1 ${tem.length} con tem phím đều gọn trong góc `
    + `(cao nhất ${(Math.max(...tem.map(t=>t.h))*100).toFixed(0)}% ô)`);

  // ── 2. Icon trên thanh không bị thứ gì dìm ─────────────────────────────────────────────
  const luma = async (id) => {
    const h = await p.$('#' + id);
    const buf = await h.screenshot();
    // Đọc PNG bằng chính trình duyệt — khỏi kéo thêm thư viện ảnh vào bộ kiểm.
    return p.evaluate(async (b64) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      // bỏ 6px viền: đang đo ICON, không đo cái khung
      const d = g.getImageData(6, 6, c.width - 12, c.height - 12).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
      return s / (d.length / 4);
    }, buf.toString('base64'));
  };
  for (const id of ['sk-0', 'sk-thuoc']){
    const L = await luma(id);
    if (L < SAN_SANG) fail(`§2 icon ${id} bị dìm — sáng trung bình ${L.toFixed(1)} < sàn ${SAN_SANG}. `
      + `Kiểm xem có lớp phủ nào (con tem phím giãn, .sk-cd, filter) đè lên ô không.`);
    else ok(`§2 icon ${id} sáng ${L.toFixed(1)}`);
  }

  // ── 3. Thanh EXP có làn riêng, không cắt ngang ô chiêu ─────────────────────────────────
  const lan = await p.evaluate(() => {
    const h = document.getElementById('bottom-hud').getBoundingClientRect();
    const x = document.getElementById('xp-strip').getBoundingClientRect();
    return { hudBot: h.bottom, xpTop: x.top, hudNen: getComputedStyle(document.getElementById('bottom-hud')).backgroundImage };
  });
  if (lan.hudBot > lan.xpTop)
    fail(`§3 thanh EXP cắt ngang thanh chiến đấu — đáy thanh ${lan.hudBot.toFixed(0)} > đỉnh EXP ${lan.xpTop.toFixed(0)}`);
  else ok(`§3 thanh EXP nằm dưới thanh chiến đấu (cách ${(lan.xpTop-lan.hudBot).toFixed(0)}px)`);
  if (lan.hudNen === 'none') fail('§3 thanh chiến đấu KHÔNG có tấm nền — các ô lại nổi rời trên mặt đất');
  else ok('§3 thanh chiến đấu có tấm nền liền');

  // ── 4. Bốn ô chiêu mang vạch màu nguyên tố ─────────────────────────────────────────────
  const mau = await p.evaluate(() => [0,1,2,3].map(i => {
    const e = document.getElementById('sk-' + i);
    return { he: e.classList.contains('sk-he'), mau: e.style.getPropertyValue('--sk-he') };
  }));
  const coMau = mau.filter(m => m.he && m.mau).length;
  if (coMau < 4) fail(`§4 chỉ ${coMau}/4 ô chiêu có vạch màu nguyên tố`);
  else ok(`§4 4/4 ô chiêu có vạch màu: ${mau.map(m=>m.mau).join(' ')}`);

  // ── 5. Dấu neo nhân vật: vành PHẢI nằm NGOÀI bóng, không đè lên thân ───────────────────
  // Đây là cả thiết kế, không phải chi tiết: luật "trang bị giữ nguyên màu ở mọi mức rèn" cấm
  // tô sáng đè lên chính nhân vật. Đo bằng cách đếm điểm ảnh của vành rơi vào chỗ bóng gốc ĐẶC.
  const neo = await p.evaluate(() => {
    const gv = gearVisual(player), tier = heroTier(player);
    const spr = heroSprite(player.sect, tier, gv, 'i', 0, 'slash', false, 0, 'i', player._hw);
    if (!spr) return { loi: 'không dựng được sprite' };
    const v = heroVienCanvas(spr);
    const pad = (v.width - spr.width) / 2;
    const gs = document.createElement('canvas'); gs.width = spr.width; gs.height = spr.height;
    gs.getContext('2d').drawImage(spr, 0, 0);
    const ds = gs.getContext('2d').getImageData(0, 0, spr.width, spr.height).data;
    const gv2 = document.createElement('canvas'); gv2.width = v.width; gv2.height = v.height;
    gv2.getContext('2d').drawImage(v, 0, 0);
    const dv = gv2.getContext('2d').getImageData(0, 0, v.width, v.height).data;
    let ngoai = 0, deLen = 0;
    for (let y = 0; y < spr.height; y++) for (let x = 0; x < spr.width; x++){
      const av = dv[(((y + pad) * v.width) + (x + pad)) * 4 + 3];
      if (av < 12) continue;
      const as = ds[((y * spr.width) + x) * 4 + 3];
      if (as > 200) deLen++; else ngoai++;
    }
    return { ngoai, deLen, pad };
  });
  if (neo.loi) fail('§5 ' + neo.loi);
  else {
    if (neo.ngoai < 200) fail(`§5 vành tách nền gần như không có — chỉ ${neo.ngoai} điểm ảnh ngoài bóng`);
    else ok(`§5 vành tách nền có ${neo.ngoai} điểm ảnh NGOÀI bóng`);
    // Cho phép một ít mép do khử răng cưa, nhưng không được phủ vào trong thân.
    if (neo.deLen > neo.ngoai * 0.25)
      fail(`§5 vành ĐÈ LÊN thân ${neo.deLen} điểm ảnh (ngoài ${neo.ngoai}) — phải lấy bóng nở TRỪ bóng gốc, `
         + `không phủ nguyên bóng lên`);
    else ok(`§5 vành chỉ chạm thân ${neo.deLen} điểm ảnh (mép khử răng cưa)`);
  }

  // TEST_TO_PHANG đo bóng dáng từng điểm ảnh — vành nằm ngoài bóng nên phải TẮT ở chế độ đó.
  const tat = await p.evaluate(() => {
    window.TEST_TO_PHANG = true;
    const c = document.createElement('canvas'); c.width = 400; c.height = 400;
    const g = c.getContext('2d');
    let veKhong = true;
    const that = g.drawImage.bind(g);
    g.drawImage = function(...a){ veKhong = false; return that(...a); };
    const gv = gearVisual(player), tier = heroTier(player);
    const spr = heroSprite(player.sect, tier, gv, 'i', 0, 'slash', false, 0, 'i', player._hw);
    if (spr) heroVienVe(g, spr);
    window.TEST_TO_PHANG = false;
    return veKhong;
  });
  if (!tat) fail('§5 heroVienVe vẫn vẽ khi TEST_TO_PHANG bật — sẽ làm sai mọi phép đo bóng dáng');
  else ok('§5 vành tắt đúng trong TEST_TO_PHANG');

  console.log('errors:', errs.slice(0, 5));
  if (errs.length) fail('có lỗi JS trên trang');
  await b.close();
  console.log(bad ? `\n${bad} MỤC ĐỎ` : '\nALL PASS');
  process.exit(bad ? 1 : 0);
})();
