// CỔNG PHẢI ĐỨNG ĐÚNG CHIỀU SÂU.
// Cổng cũ cao 96px nên nó nằm luôn ở lượt vẽ nền, trước mọi thực thể — đứng phía sau cổng vẫn
// thấy nguyên người đè lên cột. Bản mới cao 179px (~1,9 lần nhân vật) nên sai chiều sâu là
// nhìn thấy ngay: nhân vật lơ lửng trước một cái vòm cao gấp đôi mình.
//
// Phép đo: đọc thẳng điểm ảnh từ canvas game (KHÔNG chụp PNG rồi so byte — nén PNG làm hai ảnh
// gần giống nhau ra hàng nghìn byte khác nhau, sàn nhiễu nuốt trọn tín hiệu; đã mắc một lần).
// Diện tích người nhìn thấy được = số điểm ảnh đổi so với khung không có người trong ô đo.
// Đứng SAU trụ thì gần như không thấy gì; đứng TRƯỚC trụ thì thấy rõ.
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
  await p.evaluate(() => {
    window.TEST_MODE = true; startGame('baidasan', { name:'Đo' });
    curMap = 'tuongduong'; DGN = null; buildWorld();
    player.tutStep = -1;
    // Ô đo = ĐÚNG cột trụ trái: rộng 34px (bằng bề rộng trụ), cao 96px (bằng thân trụ).
    // Bản đầu tôi lấy ô 80px cho rộng rãi — nhưng nhân vật chibi rộng ~44px, rộng hơn cả trụ,
    // nên hai bên vai luôn thò ra ngoài trụ và LUÔN nhìn thấy được dù đứng ở đâu. Đo như vậy
    // thì đứng trước hay đứng sau đều ra ~3.600 điểm ảnh, không phân biệt được gì.
    window.__oDo = (() => {
      const g = GATES.find(x => x.map === 'tuongduong' && x.to === 'ngoai');
      return { gx: g.x, gy: g.y, ph: GATE_PH };
    })();
    window.__doc = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const o = window.__oDo, cv = document.getElementById('game');
      const k = cv.width / cv.clientWidth;
      const sx = Math.round((o.gx - o.ph - 17 - camera.x) * k);
      const sy = Math.round((o.gy - 96 - camera.y) * k);
      const w = Math.round(34 * k), h = Math.round(96 * k);
      if (sx < 0 || sy < 0 || sx + w > cv.width || sy + h > cv.height){ res(null); return; }
      res(Array.from(cv.getContext('2d').getImageData(sx, sy, w, h).data));
    })));
  });
  await p.waitForTimeout(500);

  const chup = async (wx, wy) => {
    // snapCamera() + chờ lâu: camera đuổi theo người có quán tính, và lệch một điểm ảnh thôi
    // là mọi mép đá trong ô đo đều "khác" — sàn nhiễu phình lên nuốt mất tín hiệu.
    await p.evaluate(([x, y]) => { player.x = x; player.y = y; player.vx = 0; player.vy = 0; snapCamera(); }, [wx, wy]);
    await p.waitForTimeout(900);
    const d = await p.evaluate(() => window.__doc());
    if (!d) throw new Error('ô đo rơi ra ngoài canvas — camera không giữ được cổng trong màn');
    return d;
  };
  const doDien = (A, B) => {                     // số ĐIỂM ẢNH khác nhau (không phải byte)
    let n = 0;
    for (let i = 0; i < A.length; i += 4){
      if (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2]) > 24) n++;
    }
    return n;
  };

  const G = await p.evaluate(() => window.__oDo);
  // Khung tham chiếu "không có người": vẫn đứng cạnh cổng (camera phải giữ cổng trong màn),
  // nhưng lệch sang trái đủ xa để không lọt vào ô 80px đang đo.
  const XA = [G.gx - G.ph - 260, G.gy];
  const nen   = await chup(XA[0], XA[1]);
  // Đứng SAU trụ (y nhỏ hơn): thân người nằm gọn trong cột trụ ⇒ phải bị che gần hết.
  const sau   = await chup(G.gx - G.ph, G.gy - 30);
  const nenB  = await chup(XA[0], XA[1]);
  // Đứng TRƯỚC trụ (y lớn hơn): nửa trên của người đè lên chính cột trụ đó ⇒ phải hiện ra.
  const truoc = await chup(G.gx - G.ph, G.gy + 40);

  const out = { soDiemAnh: nen.length / 4, nhieuNen: doDien(nen, nenB),
                hienKhiDungSau: doDien(nen, sau), hienKhiDungTruoc: doDien(nenB, truoc) };
  console.log(JSON.stringify(out, null, 1));

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  // Chốt chặn chống rỗng: đứng TRƯỚC trụ mà không thấy gì thì phép đo hỏng, không phải game đúng.
  if (out.hienKhiDungTruoc < 400)
    fail(`đứng trước trụ mà chỉ thấy ${out.hienKhiDungTruoc} điểm ảnh người — phép đo hỏng, không phải game đúng`);
  if (out.hienKhiDungTruoc < out.nhieuNen * 3)
    fail(`tín hiệu (${out.hienKhiDungTruoc}) không vượt nổi sàn nhiễu (${out.nhieuNen})`);
  if (out.hienKhiDungSau >= out.hienKhiDungTruoc * 0.5)
    fail(`đứng SAU trụ vẫn thấy ${out.hienKhiDungSau} điểm ảnh người, đứng trước là ${out.hienKhiDungTruoc} — cổng không nằm đúng thứ tự chiều sâu`);
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
