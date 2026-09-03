// CỔNG PHẢI ĐỨNG ĐÚNG CHIỀU SÂU.
// Cổng cũ cao 96px nên nó nằm luôn ở lượt vẽ nền, trước mọi thực thể — đứng phía sau cổng vẫn
// thấy nguyên người đè lên cột. Bản mới cao 179px (~1,9 lần nhân vật) nên sai chiều sâu là
// nhìn thấy ngay: nhân vật lơ lửng trước một cái vòm cao gấp đôi mình.
//
// PHÉP ĐO — đếm điểm ảnh MÀU ÁO CHOÀNG TÍM của Dark Wizard nằm trong đúng cột trụ trái.
// Đứng SAU trụ thì thân người bị trụ che ⇒ 0 điểm tím. Đứng TRƯỚC trụ thì nửa trên đè lên
// chính cột đó ⇒ vài trăm điểm tím.
//
// Ba cách đo trước đó đều hỏng, ghi lại để đừng ai làm lại:
//   1. Chụp PNG rồi so BYTE — nén PNG khiến hai ảnh gần giống nhau khác nhau hàng nghìn byte.
//   2. Lấy một khung "không có người" rồi trừ đi — drawCityMood() phủ tông chiều tà bằng
//      gradient NEO THEO CAMERA, mà khung tham chiếu có camera khác, nên cùng một điểm trên
//      bản đồ nhận sắc khác nhau.
//   3. Vẫn trừ khung, nhưng cùng camera — buildWorld() rải cây/đá NGẪU NHIÊN mỗi lượt, và cây
//      cũng nằm trong danh sách sắp theo y: có lượt một gốc cây rơi vào ô đo, cả ô cùng "khác".
// Đếm theo MÀU thì cả ba thứ trên đều không đụng tới được: cây xanh, đá xám, trời xanh lam —
// không cái nào lọt vào dải màu áo choàng.
const { chromium } = require('playwright');
const URL = 'http://localhost:8871/index.html';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 760 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(900);

  const out = await p.evaluate(async () => {
    window.TEST_MODE = true; startGame('baidasan', { name:'Đo' });
    curMap = 'tuongduong'; DGN = null; buildWorld();
    player.tutStep = -1;
    FXQ_AUTO = false; FXQ = 2; RES_AUTO = false; SETTINGS.lowFx = false;
    const o = (() => {
      const g = GATES.find(x => x.map === 'tuongduong' && x.to === 'ngoai');
      return { gx: g.x, gy: g.y, ph: GATE_PH };
    })();
    // Ô đo = ĐÚNG cột trụ trái: rộng 34px (bằng bề rộng trụ), cao 96px (bằng thân trụ).
    const dem = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const cv = document.getElementById('game'), k = cv.width / cv.clientWidth;
      const sx = Math.round((o.gx - o.ph - 17 - camera.x) * k);
      const sy = Math.round((o.gy - 96 - camera.y) * k);
      const w = Math.round(34 * k), h = Math.round(96 * k);
      if (sx < 0 || sy < 0 || sx + w > cv.width || sy + h > cv.height){ res(null); return; }
      const d = cv.getContext('2d').getImageData(sx, sy, w, h).data;
      let tim = 0;
      for (let i = 0; i < d.length; i += 4){
        const R = d[i], G = d[i+1], B = d[i+2];
        if (B > R + 20 && R > G + 12 && B > 70 && B < 210 && G < 110) tim++;   // dải màu áo choàng
      }
      res({ tim, tong: d.length / 4 });
    })));
    const dat = async (x, y) => {
      player.x = x; player.y = y; player.vx = 0; player.vy = 0; snapCamera();
      floats.length = 0; effects.length = 0;
      await new Promise(r => setTimeout(r, 700));
      floats.length = 0; effects.length = 0;   // dọn cả thứ vừa sinh ra trong lúc chờ
      return dem();
    };
    const sau   = await dat(o.gx - o.ph, o.gy - 30);    // SAU trụ: thân người nằm gọn trong cột
    const truoc = await dat(o.gx - o.ph, o.gy + 40);    // TRƯỚC trụ: nửa trên đè lên chính cột đó
    const vang  = await dat(o.gx - o.ph - 260, o.gy + 40);  // không có người trong ô
    return { sau: sau && sau.tim, truoc: truoc && truoc.tim, vang: vang && vang.tim,
             oDo: sau && sau.tong, lop: player.sect };
  });

  console.log(JSON.stringify(out, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  if (out.sau == null || out.truoc == null) fail('ô đo rơi ra ngoài canvas — camera không giữ được cổng trong màn');
  // Chốt chặn chống rỗng: đứng TRƯỚC trụ mà không đếm được gì thì phép đo hỏng, không phải game đúng.
  if (out.truoc < 150)
    fail(`đứng trước trụ mà chỉ đếm được ${out.truoc} điểm ảnh áo choàng — phép đo hỏng, không phải game đúng`);
  // Chốt chặn thứ hai: dải màu không được bắt nhầm cảnh vật, nếu không thì "đứng sau = 0" là vô nghĩa.
  if (out.vang > 20)
    fail(`ô đo không có người mà vẫn đếm ${out.vang} điểm ảnh áo choàng — dải màu đang bắt nhầm cảnh vật`);
  if (out.sau > out.truoc * 0.15)
    fail(`đứng SAU trụ vẫn thấy ${out.sau} điểm ảnh áo choàng, đứng trước là ${out.truoc} — cổng không nằm đúng thứ tự chiều sâu`);

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
