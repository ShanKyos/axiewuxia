// Ba cải tiến hoạt ảnh phải ĐO ĐƯỢC, không chỉ "nhìn mượt hơn":
//  1. QUÁN TÍNH  — dừng chạy rồi mà áo choàng vẫn còn bạt thêm một nhịp
//  2. VAI THEO TAY — vung tay thì tấm vai phải xoay theo (pixel vùng vai đổi)
//  3. LẤY/VƯỢT ĐÀ — đường cong ra đòn phải đi NGƯỢC lúc đầu và VƯỢT QUÁ 1 ở cuối
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 100; vhAutoLearn(); calcDerived();
    const o = {};

    // ══ 3. Đường cong ra đòn ══
    const curve = [];
    for (let i = 0; i <= 20; i++) curve.push(+hSwing(i / 20).toFixed(3));
    o.duongCong = curve;
    o.hongNguoc = Math.min(...curve);          // phải ÂM: có lấy đà
    o.vuotQua  = Math.max(...curve);           // phải > 1: có vượt đà
    o.veDung1  = +hSwing(1).toFixed(3);        // kết thúc phải đúng 1
    o.batDau0  = +hSwing(0).toFixed(3);        // bắt đầu phải 0
    // so với tuyến tính: góc tay giữa đòn phải KHÁC hẳn
    o.slash_giua = +HERO_ACT.slash(0.15).armR.toFixed(3);   // lúc lấy đà, phải < -0.7
    o.spin_giua  = +HERO_ACT.spin(0.15).armR.toFixed(3);

    // ══ 1. Quán tính ══
    player.x = 600; player.y = 600; player.auto = false;
    // Game đã bỏ WASD — di chuyển là click-to-move qua `moveTarget`. Đặt phím là vô nghĩa.
    mobs.length = 0;                       // không cho quái chen vào làm lệch phép đo
    moveTarget = { x: 1500, y: 600 };      // đích xa để chạy suốt 1 giây
    for (let i = 0; i < 50; i++) update(0.02);
    o.dangChay = !!player.moving;
    o.sway_dangChay = +(player.sway || 0).toFixed(3);
    // huỷ đích = dừng lại, rồi đo NGAY và đo sau
    moveTarget = null; moveWaypoint = null;
    update(0.02);
    o.sway_vuaDung = +(player.sway || 0).toFixed(3);
    const capeAt = () => {
      const ps = heroPose(player.walkPh, !!player.moving, 0, 0, 0, 'slash', player.sway, player.swayDir);
      return +((ps.legL - ps.legR) * 16 + ps.sw * 22 + ps.sway * 26 + ps.swayDir * 14).toFixed(2);
    };
    o.cape_vuaDung = capeAt();
    for (let i = 0; i < 8; i++) update(0.02);   // 0,16s sau
    o.sway_sau016 = +(player.sway || 0).toFixed(3);
    for (let i = 0; i < 60; i++) update(0.02);  // 1,2s sau — phải lắng hẳn
    o.sway_sau12 = +(player.sway || 0).toFixed(3);
    o.cape_lang = capeAt();

    // ══ 2. Vai giáp xoay theo tay ══
    const gv = { n:5, rarity:4, t:10, plus:0, rcol:RARITIES[4].color, wTier:10, wPlus:0, setColor:null };
    // chỉ vẽ RIÊNG vai giáp, hai tư thế tay khác nhau
    function shoulderOnly(armR){
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      const q = c.getContext('2d');
      const ps = Object.assign({}, HERO_POSE0, { armR, armL: -armR });
      hPauldrons(q, hMetal(10), gv, heroSet('thieulam', 10), ps);
      return q.getImageData(0, 0, HERO_W, HERO_H).data;
    }
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i+3] !== b[i+3]) n++; return n; };
    o.vai_tayHa = 0;
    o.vai_doiTheoTay = diff(shoulderOnly(-0.7), shoulderOnly(1.2));
    // vai KHÔNG được xoay bằng đúng góc tay (chỉ ~35%) — nếu bằng nhau là quay quá tay
    const d35 = diff(shoulderOnly(0), shoulderOnly(1.0));
    const d100 = diff(shoulderOnly(0), (() => {
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      const q = c.getContext('2d');
      q.translate(HERO_JOINT.shR[0], HERO_JOINT.shR[1]); q.rotate(1.0);
      q.translate(-HERO_JOINT.shR[0], -HERO_JOINT.shR[1]);
      hPauldrons(q, hMetal(10), gv, heroSet('thieulam', 10), Object.assign({}, HERO_POSE0, { armR:0, armL:0 }));
      return q.getImageData(0, 0, HERO_W, HERO_H).data;
    })());
    o.vai_khongQuayQuaTay = d35 < d100;

    // ══ Toàn hình: cả 3 cộng lại phải đổi khung hình khi đang đánh ══
    function frame(t, armR){
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      const q = c.getContext('2d');
      const ps = heroPose(2.0, true, t, 0, 900, 'slash', 0.8, -0.6);
      drawHeroFigure(q, 'thieulam', 10, 900, ps, gv);
      return q.getImageData(0, 0, HERO_W, HERO_H).data;
    }
    o.khungDanh_khac = diff(frame(0.85), frame(0.35));   // hai thời điểm trong cùng cú chém

    return o;
  });

  console.log('── 3. Đường cong ra đòn ──');
  console.log('hSwing:', JSON.stringify(r.duongCong));
  console.log(`hõm ngược ${r.hongNguoc} · vượt quá ${r.vuotQua} · bắt đầu ${r.batDau0} · kết ${r.veDung1}`);
  console.log(`slash lúc lấy đà armR=${r.slash_giua} (tuyến tính cũ sẽ là -0.385)`);
  console.log(`spin  lúc lấy đà armR=${r.spin_giua} (tuyến tính cũ sẽ là -0.293)`);
  console.log('── 1. Quán tính ──');
  console.log('đang chạy thật:', r.dangChay);
  console.log(`sway: đang chạy ${r.sway_dangChay} → vừa dừng ${r.sway_vuaDung} → +0,16s ${r.sway_sau016} → +1,2s ${r.sway_sau12}`);
  console.log(`áo choàng: vừa dừng ${r.cape_vuaDung} → đã lắng ${r.cape_lang}`);
  console.log('── 2. Vai theo tay ──');
  console.log(`vai đổi khi tay đổi: ${r.vai_doiTheoTay} px · không quay quá tay: ${r.vai_khongQuayQuaTay}`);
  console.log(`khung đánh khác nhau: ${r.khungDanh_khac} px`);

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (r.batDau0 !== 0) fail(`hSwing(0) phải = 0, được ${r.batDau0}`);
  if (r.veDung1 !== 1) fail(`hSwing(1) phải = 1, được ${r.veDung1}`);
  if (r.hongNguoc > -0.15) fail(`không có LẤY ĐÀ — điểm thấp nhất chỉ ${r.hongNguoc}, cần < -0.15`);
  if (r.vuotQua < 1.05) fail(`không có VƯỢT ĐÀ — điểm cao nhất chỉ ${r.vuotQua}, cần > 1.05`);
  if (r.slash_giua >= -0.7) fail(`slash lúc p=0.15 phải kéo NGƯỢC quá điểm xuất phát (-0.7), được ${r.slash_giua}`);
  if (r.spin_giua >= -0.45) fail(`spin lúc p=0.15 phải kéo NGƯỢC quá -0.45, được ${r.spin_giua}`);

  if (!r.dangChay) fail('dựng test sai — nhân vật không hề chạy');
  if (r.sway_dangChay < 0.5) fail(`chạy 1s mà sway chỉ ${r.sway_dangChay} — lò xo không lên tới đích`);
  if (r.sway_sau016 <= 0.15) fail(`thả phím 0,16s mà sway đã về ${r.sway_sau016} — không có quán tính, dừng là tắt ngay`);
  if (Math.abs(r.sway_sau12) > 0.08) fail(`1,2s sau vẫn còn sway ${r.sway_sau12} — lò xo không lắng, sẽ rung mãi`);
  if (Math.abs(r.cape_vuaDung - r.cape_lang) < 10) fail('áo choàng không khác gì giữa lúc vừa dừng và lúc đã lắng');

  if (r.vai_doiTheoTay < 200) fail(`vai giáp không xoay theo tay (${r.vai_doiTheoTay} px)`);
  if (!r.vai_khongQuayQuaTay) fail('vai giáp xoay bằng hoặc hơn góc tay — phải chỉ ~35%');
  if (r.khungDanh_khac < 500) fail('hai thời điểm trong cùng cú chém gần như giống nhau');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
