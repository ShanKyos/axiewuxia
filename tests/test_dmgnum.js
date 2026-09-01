// Số sát thương bay trên đầu quái. Trước bản này toàn bộ sát thương chỉ vào hộp nhật ký góc
// dưới-trái rộng 260px — mà lúc đang đánh, mắt người chơi ở giữa màn hình. Đây là kênh phản hồi
// chính của Diablo 3 và game đang không có.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(800);

  // 1. Một cú đánh → hiện đúng MỘT số, và số đó bằng sát thương thật
  const r1 = await p.evaluate(async () => {
    travelTo('daohoa'); player.auto = false;
    const m = mobs.find(x => !x.dead && !x.def.bossKind);
    m.hp = m.maxHp = 999999;                       // đừng để nó chết giữa phép đo
    floats.length = 0;
    const hp0 = m.hp;
    hurtMob(m, 40, 'hit');
    const ngay = floats.filter(f => /^-\d+$/.test(f.text)).length;
    await new Promise(r => setTimeout(r, 500));    // qua cửa sổ gộp 0,22s
    const sau = floats.filter(f => /^-\d+$/.test(f.text));
    return { thiethai: Math.round(hp0 - m.hp), soNgayLapTuc: ngay,
      soSauKhiXa: sau.length, giaTri: sau.map(f => f.text) };
  });
  console.log('1) một cú đánh:', JSON.stringify(r1));
  if (r1.soSauKhiXa !== 1) fail(`một cú đánh cho ${r1.soSauKhiXa} số bay, phải đúng 1`);
  else if (Math.abs(Math.abs(+r1.giaTri[0]) - r1.thiethai) > 1)
    fail(`số bay ${r1.giaTri[0]} không khớp sát thương thật ${r1.thiethai}`);

  // 2. Nhiều cú liên tiếp trong cửa sổ gộp → vẫn một số, và là TỔNG
  const r2 = await p.evaluate(async () => {
    const m = mobs.find(x => !x.dead && !x.def.bossKind);
    m.hp = m.maxHp = 999999; floats.length = 0;
    const hp0 = m.hp;
    for (let i=0;i<5;i++) hurtMob(m, 20, 'hit');
    await new Promise(r => setTimeout(r, 500));
    const sau = floats.filter(f => /^-\d+$/.test(f.text));
    return { thiethai: Math.round(hp0 - m.hp), so: sau.length, giaTri: sau.map(f => f.text) };
  });
  console.log('2) năm cú trong cửa sổ gộp:', JSON.stringify(r2));
  if (r2.so !== 1) fail(`năm cú liên tiếp cho ${r2.so} số bay — không gộp, sẽ tràn màn hình khi AUTO`);
  else if (Math.abs(Math.abs(+r2.giaTri[0]) - r2.thiethai) > 2)
    fail(`số gộp ${r2.giaTri[0]} không bằng tổng sát thương ${r2.thiethai}`);

  // 3. Bạo kích phải NỔI BẬT hơn
  const r3 = await p.evaluate(async () => {
    const m = mobs.find(x => !x.dead && !x.def.bossKind);
    m.hp = m.maxHp = 999999; floats.length = 0;
    hurtMob(m, 40, 'crit');
    await new Promise(r => setTimeout(r, 500));
    const f = floats.find(f => /^-\d+$/.test(f.text));
    m.hp = m.maxHp = 999999; floats.length = 0;
    hurtMob(m, 40, 'hit');
    await new Promise(r => setTimeout(r, 500));
    const g = floats.find(f => /^-\d+$/.test(f.text));
    return { bao: f ? { co:f.size, mau:f.color } : null, thuong: g ? { co:g.size, mau:g.color } : null };
  });
  console.log('3) bạo kích vs đòn thường:', JSON.stringify(r3));
  if (!r3.bao || !r3.thuong) fail('thiếu số bay để so sánh');
  else if (!(r3.bao.co > r3.thuong.co) || r3.bao.mau === r3.thuong.mau)
    fail('bạo kích không nổi bật hơn đòn thường');

  // 4. Tắt được trong Cài Đặt
  const r4 = await p.evaluate(async () => {
    SETTINGS.dmgNum = false;
    const m = mobs.find(x => !x.dead && !x.def.bossKind);
    m.hp = m.maxHp = 999999; floats.length = 0;
    hurtMob(m, 40, 'hit');
    await new Promise(r => setTimeout(r, 500));
    const n = floats.filter(f => /^-\d+$/.test(f.text)).length;
    SETTINGS.dmgNum = true;
    return { soKhiTat: n };
  });
  console.log('4) tắt trong Cài Đặt:', JSON.stringify(r4));
  if (r4.soKhiTat !== 0) fail('tắt rồi mà vẫn hiện số');

  // 5. AUTO đánh cả bãi: số bay không được nuốt mảng floats (trần 70)
  const r5 = await p.evaluate(async () => {
    SETTINGS.dmgNum = true;
    applyTestBoost && applyTestBoost();
    travelTo('tuongduong'); travelTo('daohoa');
    const k = MAPS.daohoa.packs[0];
    player.x=k.x; player.y=k.y; player.auto=true;
    player._autoAX=null; player._autoAY=null; player._autoZoneLocked=false; player._autoPack=null;
    floats.length = 0;
    await new Promise(r => setTimeout(r, 6000));
    return { tongFloat: floats.length, soSatThuong: floats.filter(f=>/^-\d+$/.test(f.text)).length,
      tran: floats.length >= 70 };
  });
  console.log('5) AUTO 6 giây:', JSON.stringify(r5));
  if (r5.tran) fail('mảng floats chạm trần 70 — số sát thương đang nuốt các thông báo khác');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
