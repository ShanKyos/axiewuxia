// LỚP NHÂN VẬT ĐI THEO BẢO KÊ — đi sau lúc thường, ra trước lúc tung chiêu
//
// Chủ dự án chốt (nguyên văn): *"cho nhân vật nhỏ lại và đi theo sau người chơi. Khi ra đòn,
// nhân vật ở đằng sau biến mất và xuất hiện đằng trước tung tuyệt chiêu kèm theo là xuất hiện
// vũ khí / animation. Nó giống như là 1 cách để bảo vệ người chơi vậy."*
//
// Bài này gác BA lời hứa, và lời hứa thứ ba mới là cái đã hỏng ngoài đời:
//
//   ① avatar TẮT ⇒ không đổi một chút nào (dx=dy=0, cỡ=1). Đây là điều kiện để cắm được vào
//      một trò chơi đang chạy mà 177 bài không đỏ — xem mục ĐỔI VAI trong CLAUDE.md.
//   ② avatar BẬT ⇒ lúc thường đứng SAU và nhỏ lại; lúc đánh đứng TRƯỚC và về cỡ thật.
//      "Trước/sau" đo bằng DẤU của tích vô hướng với hướng mặt, không đoán theo ảnh.
//   ③ CÁNH và VŨ KHÍ đi theo lớp nhân vật, KHÔNG dính vào neo người chơi.
//      Trước bản này cả hai vẽ thẳng ở (p.x, p.y) không qua cửa nào, nên bật avatar lên là
//      đôi cánh mọc ra từ con Axie và cây vũ khí treo lơ lửng trên đầu nó — chủ dự án chụp
//      màn hình đúng lỗi đó. Đo THẲNG TRÊN MÃ — xem chú thích ở mục ③ để biết vì sao hai phép
//      đo bằng điểm ảnh đều phải bỏ.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  await p.goto('http://localhost:8853/index.html?test=1', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('baidasan', null); });
  await p.waitForTimeout(4000);

  // Một khung hình THẬT rồi đọc cờ — không gọi drawPlayer tay, vì thứ cần gác là cái mà vòng
  // vẽ thật sự dùng.
  const khung = (dat) => p.evaluate((dat) => new Promise(r => {
    if (dat) Object.assign(player, dat);
    requestAnimationFrame(() => requestAnimationFrame(() => r(window.__lopVe)));
  }), dat);

  // ── ① avatar TẮT ⇒ y nguyên hành vi cũ ────────────────────────────────────────────────
  const tat = await khung({ avatar: null, atkAnim: 0, castT: 0, face: 0 });
  if (!tat) fail('không có window.__lopVe — game chưa phơi hình học lớp nhân vật');
  else if (tat.dx !== 0 || tat.dy !== 0 || tat.co !== 1 || tat.truoc)
    fail(`avatar tắt mà lớp nhân vật đã bị dời/thu: ${JSON.stringify(tat)}`);
  else pass('avatar tắt ⇒ dx=dy=0, cỡ=1 — hành vi cũ nguyên vẹn');

  // ── ② avatar BẬT: đi sau (nhỏ) ⇄ ra trước (cỡ thật) ───────────────────────────────────
  const sau = await khung({ avatar: 'aurelion', atkAnim: 0, castT: 0, face: 0 });
  const truoc = await khung({ avatar: 'aurelion', atkAnim: 0.16, castT: 0, face: 0 });
  // face = 0 ⇒ hướng mặt là +x, nên dấu của dx CHÍNH LÀ trước/sau.
  if (!(sau.dx < 0)) fail(`lúc thường lớp nhân vật phải ở SAU (dx<0), đo được dx=${sau.dx.toFixed(1)}`);
  else pass(`lúc thường đứng sau: dx=${sau.dx.toFixed(1)}`);
  if (!(sau.co > 0.3 && sau.co < 0.9))
    fail(`lúc thường phải NHỎ LẠI (0,3–0,9 lần), đo được ${sau.co}`);
  else pass(`lúc thường nhỏ lại còn ${(sau.co*100).toFixed(0)}%`);
  if (!(truoc.dx > 0)) fail(`lúc đánh lớp nhân vật phải ra TRƯỚC (dx>0), đo được dx=${truoc.dx.toFixed(1)}`);
  else pass(`lúc đánh ra trước: dx=${truoc.dx.toFixed(1)}`);
  if (truoc.co !== 1) fail(`lúc đánh phải về cỡ thật, đo được ${truoc.co}`);
  else pass('lúc đánh về cỡ thật');
  if (!truoc.truoc || sau.truoc) fail('cờ `truoc` không khớp trạng thái đánh');
  else pass('cờ `truoc` khớp trạng thái');

  // ── ③ CÁNH và VŨ KHÍ không còn vẽ ở neo người chơi ────────────────────────────────────
  // ⚠ HAI PHÉP ĐO BẰNG ĐIỂM ẢNH ĐÃ THỬ VÀ BỎ — ghi lại để đừng ai làm lại:
  //   · "một hộp cạnh con Axie có đổi không": cánh bậc 3 xoè >100px mỗi bên, thu 0,6 lần vẫn
  //     với sang nửa người con Axie ⇒ kết quả phụ thuộc chỗ đặt hộp, mà chỗ đặt hộp thì chỉnh
  //     tới lúc xanh được. Xanh giả.
  //   · "tâm đám điểm ảnh đổi khi đeo cánh": ĐO NỀN NHIỄU trước thì thấy chụp hai lần mà KHÔNG
  //     đổi gì đã lệch 5.965 điểm ảnh, và tâm của chính nền nhiễu nằm ở x=−81 — lớp nhân vật
  //     đang bước nên nó động hơn cả đôi cánh. Tín hiệu chìm dưới nhiễu.
  //
  // Thứ cần gác thật ra là một mệnh đề về MÃ, nên đo thẳng trên mã: mọi lời gọi vẽ cánh và vẽ
  // thần khí phải nằm TRONG phép dời gốc về neo lớp nhân vật. Xác định, không nhiễu, và đỏ
  // ngay nếu ai đó thêm lại một nhát vẽ ở (p.x, p.y). Cùng lối với test_walkrun §4/§5.
  const src = await p.evaluate(async () => (await fetch('game.js')).text());
  const goi = [...src.matchAll(/\bve(Canh|ThanKhi)\(ctx,/g)];
  if (goi.length < 2) fail(`chỉ thấy ${goi.length} lời gọi veCanh/veThanKhi trong vòng vẽ — ` +
                           'bài kiểm không còn bám đúng chỗ nó định gác');
  else {
    const hong = goi.filter(m => !/ctx\.translate\(p\.x \+ _avaDx/.test(src.slice(Math.max(0, m.index - 420), m.index)));
    if (hong.length)
      fail(`${hong.length}/${goi.length} lời gọi vẽ cánh/thần khí KHÔNG nằm trong phép dời về ` +
           'neo lớp nhân vật — thứ đó sẽ vẽ đè lên con Axie');
    else pass(`${goi.length}/${goi.length} lời gọi vẽ cánh + thần khí đều bám neo lớp nhân vật`);
  }
  // Vũ khí phải TẮT lúc đi theo sau — nửa còn lại của "xuất hiện đằng trước kèm vũ khí".
  if (!/const _tkHien = !_coAva \|\| _lopHien;/.test(src))
    fail('không thấy cửa `_tkHien` — thần khí sẽ hiện cả lúc đang đi theo sau');
  else if (!/_tk && !_tk\.truoc && _tkHien/.test(src) || !/_tk && _tk\.truoc && _tkHien/.test(src))
    fail('một trong hai lớp thần khí (trước/sau thân) chưa đi qua cửa `_tkHien`');
  else pass('thần khí chỉ hiện khi lớp nhân vật ra trước — cả hai lớp vẽ đều qua cửa');

  if (errs.length) fail('lỗi trang — ' + errs[0]);
  await b.close();
  console.log(bad ? `\n${bad} LỖI` : '\nTẤT CẢ XANH');
  process.exit(bad ? 1 : 0);
})();
