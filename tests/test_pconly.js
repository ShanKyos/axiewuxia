// Dọn tàn dư điện thoại — game chỉ chạy PC.
//
// Gác hai chiều cùng lúc, và chiều thứ hai mới là chiều quan trọng:
//   1. Tàn dư đã đi hẳn: không còn #joystick trong DOM, không còn joyVec, viewport không còn
//      chỉ thị chỉ có tác dụng trên thiết bị chạm.
//   2. HAI LỐI DI CHUYỂN CÒN LẠI VẪN CHẠY. Lối di chuyển tay đã bỏ từ lâu, nên chuột phải trên
//      nền đất và bấm minimap là TẤT CẢ những gì người chơi có để đi lại. Gỡ nhầm một trong hai
//      là game không đi được nữa mà không có lỗi nào hiện ra.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(1000);
  const r = await p.evaluate(() => ({
    conJoystick: !!document.getElementById('joystick'),
    conKnob: !!document.getElementById('joy-knob'),
    viewport: document.querySelector('meta[name=viewport]').content,
    conJoyVec: typeof joyVec !== 'undefined' ? 'CÒN' : 'đã gỡ',
  }));
  console.log('1) tàn dư điện thoại:', JSON.stringify(r));
  if (r.conJoystick || r.conKnob) fail('div joystick vẫn còn trong DOM');
  if (/user-scalable|maximum-scale/.test(r.viewport)) fail('viewport còn chỉ thị chỉ dành cho di động');

  // di chuyển bằng chuột phải vẫn phải chạy — đó là lối duy nhất còn lại
  const r2 = await p.evaluate(async () => {
    travelTo('tuongduong'); travelTo('daohoa');
    const x0 = player.x, y0 = player.y;
    canvas.dispatchEvent(new MouseEvent('contextmenu', {
      clientX: Math.round(player.x - camera.x + 220), clientY: Math.round(player.y - camera.y), bubbles: true }));
    await new Promise(r => setTimeout(r, 1400));
    return { diChuyen: Math.round(Math.hypot(player.x - x0, player.y - y0)) };
  });
  console.log('2) chuột phải để đi vẫn chạy:', JSON.stringify(r2));
  if (r2.diChuyen < 60) fail(`bấm chuột phải mà chỉ đi được ${r2.diChuyen}px`);

  // bấm minimap vẫn phải chạy
  const r3 = await p.evaluate(async () => {
    const x0 = player.x, y0 = player.y;
    const rect = miniCvs.getBoundingClientRect();
    miniCvs.dispatchEvent(new MouseEvent('click', {
      clientX: Math.round(rect.left + rect.width*0.2), clientY: Math.round(rect.top + rect.height*0.2), bubbles: true }));
    await new Promise(r => setTimeout(r, 1400));
    return { diChuyen: Math.round(Math.hypot(player.x - x0, player.y - y0)) };
  });
  console.log('3) bấm minimap vẫn chạy:', JSON.stringify(r3));
  if (r3.diChuyen < 60) fail(`bấm minimap mà chỉ đi được ${r3.diChuyen}px`);

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
