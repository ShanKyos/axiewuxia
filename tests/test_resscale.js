// Độ phân giải vẽ: hạ xuống phải thật sự nhanh hơn, VÀ bấm chuột phải trúng đúng chỗ.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
const measure = (p, ms=3000) => p.evaluate(async (ms) => {
  const t=[]; let last=performance.now();
  await new Promise(r=>{ const t0=performance.now();
    const f=()=>{ const n=performance.now(); t.push(n-last); last=n;
      if(n-t0<ms) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
  const s=t.slice(5).sort((a,b)=>a-b); return +(1000/s[s.length>>1]).toFixed(1);
}, ms);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(700);

  // 1. mặc định phải là 100% và tự chỉnh
  const r1 = await p.evaluate(() => ({ res: RES, auto: RES_AUTO,
    cw: document.getElementById('game').width, vw: window.innerWidth }));
  console.log('1) mặc định:', JSON.stringify(r1));
  if (r1.res !== 1) fail('mặc định phải là 100%, đang là ' + r1.res);
  if (r1.cw !== r1.vw) fail(`bộ đệm ${r1.cw} khác cửa sổ ${r1.vw} ở mức 100%`);

  // 2. đặt tay 60% → bộ đệm nhỏ đi, CSS vẫn phủ kín
  const r2 = await p.evaluate(() => { setRes(0.6);
    const c = document.getElementById('game'), r = c.getBoundingClientRect();
    return { res: RES, auto: RES_AUTO, cw: c.width, ch: c.height,
             cssW: Math.round(r.width), cssH: Math.round(r.height), W, H,
             vw: window.innerWidth, vh: window.innerHeight }; });
  console.log('2) đặt tay 60%:', JSON.stringify(r2));
  if (Math.abs(r2.cw - r2.vw*0.6) > 2) fail(`bộ đệm ${r2.cw} không phải 60% của ${r2.vw}`);
  if (r2.cssW !== r2.vw || r2.cssH !== r2.vh) fail('canvas không còn phủ kín cửa sổ sau khi hạ độ nét');
  // W/H là kích thước LOGIC và phải GIỮ NGUYÊN: hạ độ nét là chuyện đồ hoạ, không được thu hẹp
  // tầm nhìn — nếu không, máy yếu nhìn được ít thế giới hơn máy khoẻ, tức là đổi luôn lối chơi.
  if (r2.W !== r2.vw || r2.H !== r2.vh) fail(`hạ độ nét làm co tầm nhìn: W/H ${r2.W}x${r2.H} thay vì ${r2.vw}x${r2.vh}`);
  if (r2.auto !== false) fail('chọn tay rồi mà vẫn còn ở chế độ tự chỉnh');

  // 3. bấm chuột phải phải trúng đúng chỗ trong thế giới, không lệch theo tỉ lệ
  const r3 = await p.evaluate(async () => {
    player.auto = false; travelTo('comoc');
    player.x = 900; player.y = 900; camera.x = 0; camera.y = 0;
    moveTarget = null;
    const c = document.getElementById('game');
    c.dispatchEvent(new MouseEvent('contextmenu', { clientX: 500, clientY: 400, bubbles: true }));
    return moveTarget ? { x: Math.round(moveTarget.x), y: Math.round(moveTarget.y) } : null;
  });
  // Toạ độ logic = toạ độ CSS, nên camera 0,0 ⇒ điểm CSS (500,400) là đúng điểm thế giới (500,400)
  // BẤT KỂ độ nét. Nếu ra (300,240) tức là có ai đó nhân RES vào toạ độ chuột — thừa.
  console.log('3) chuột phải ở CSS(500,400) khi độ nét 60% → thế giới:', JSON.stringify(r3));
  if (!r3) fail('chuột phải không đặt được đích');
  else if (Math.hypot(r3.x - 500, r3.y - 400) > 70)
    fail(`đích lệch: mong ~(500,400) nhưng ra (${r3.x},${r3.y}) — độ nét không được làm lệch chuột`);

  // 4. hạ độ nét phải thật sự nhanh hơn
  await p.evaluate(() => { FXQ_AUTO = false; setFxq(2); RES_AUTO = false; travelTo('daohoa'); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => setRes(1)); await p.waitForTimeout(500);
  const f100 = await measure(p);
  await p.evaluate(() => setRes(0.6)); await p.waitForTimeout(500);
  const f60 = await measure(p);
  console.log(`4) FPS 100% = ${f100}  ·  60% = ${f60}`);
  // CHỈ khẳng định khi máy thật sự đang đuối. Nếu ở 100% đã chạm trần vsync (~60) thì hạ độ nét
  // KHÔNG THỂ nhanh hơn được nữa — không có gì để chứng minh, và bắt nó nhanh hơn là biến bài
  // kiểm thành phép đo tốc độ MÁY CHẠY BÀI KIỂM chứ không phải phép đo tính năng.
  // Đã vấp thật: máy dựng game hôm trước cho 34 FPS ở 100%, hôm sau cho 58,8 và bài kiểm ngã.
  if (f100 < 55){
    if (f60 <= f100 + 2) fail(`máy đang đuối (${f100} FPS) mà hạ độ nét không nhanh lên (${f60})`);
  } else {
    console.log(`   (máy đã chạm trần vsync ở 100% — bỏ qua mệnh đề tốc độ, không có gì để chứng minh)`);
  }

  // 5. cài đặt phải lưu lại qua lần mở sau
  await p.evaluate(() => setRes(0.75));
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('vlcm_settings')||'{}').res);
  console.log('5) đã lưu res =', saved);
  if (Math.abs(saved - 0.75) > 0.001) fail('không lưu độ nét vào Cài Đặt, ra ' + saved);
  await p.reload({ waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(700);
  const after = await p.evaluate(() => ({ res: RES, auto: RES_AUTO, W, H,
    cw: document.getElementById('game').width, vw: window.innerWidth }));
  console.log('   sau khi tải lại:', JSON.stringify(after));
  if (Math.abs(after.res - 0.75) > 0.001) fail('mở lại game không giữ độ nét đã chọn');
  if (Math.abs(after.cw - after.vw*0.75) > 2) fail('mở lại game bộ đệm không đúng tỉ lệ');
  if (after.W !== after.vw) fail('mở lại game tầm nhìn bị co theo độ nét');
  if (after.auto !== false) fail('mở lại game lại nhảy về tự chỉnh');

  // 6. 'auto' đặt lại được
  await p.evaluate(() => setRes('auto'));
  const au = await p.evaluate(() => ({ auto: RES_AUTO, saved: JSON.parse(localStorage.getItem('vlcm_settings')||'{}').res }));
  console.log('6) về tự chỉnh:', JSON.stringify(au));
  if (!au.auto || au.saved !== 'auto') fail('không quay về tự chỉnh được');

  // 7. Tự chỉnh phải THẬT SỰ chạy: máy này không có card đồ hoạ nên mức Đầy ở 100% chắc chắn
  //    tụt dưới 60 — bộ tự chỉnh phải hạ hiệu ứng TRƯỚC, hết đường rồi mới hạ độ nét.
  await p.evaluate(() => { setFxq('auto'); setRes('auto'); FXQ = 2; RES = 1; resize();
    SETTINGS.perfHud = false; travelTo('daohoa'); });
  //    Phải đo FPS *TRƯỚC* khi bộ tự chỉnh kịp làm gì. Bản cũ đo ở CUỐI 30 giây rồi lấy con số
  //    đó phán xét: máy chạy 59.9 FPS thì "không được hạ gì". Nhưng máy chạy được 59.9 CHÍNH LÀ
  //    NHỜ nó vừa hạ hiệu ứng — lấy kết quả để phủ nhận nguyên nhân. Bài chỉ đỏ khi bộ tự chỉnh
  //    làm việc TỐT tới mức vượt ngưỡng 55, nên càng tối ưu game thì càng hay đỏ.
  //    Bản trước lấy MỘT mẫu 3 giây rồi phán xét cho 30 giây sau đó: "máy giữ được 59,5 FPS
  //    nên bộ tự chỉnh không được hạ gì". Mệnh đề đó không đứng vững — một mẫu 3 giây không
  //    chứng minh được 30 giây kế tiếp cũng trên ngưỡng, mà FPS trên máy dựng thì lên xuống
  //    theo tải của cả máy. Tụt một nhịp giữa chừng rồi hạ chất lượng CHÍNH LÀ việc bộ tự chỉnh
  //    phải làm, vậy mà bài kiểm tính đó là hỏng: chạy hai lượt trên cùng một commit ra một
  //    xanh một đỏ.
  //    Nay lấy FPS THẤP NHẤT trong suốt cửa sổ quan sát. Nếu chưa từng tụt xuống dưới ngưỡng
  //    thì mới thật sự là "không có lý do gì để hạ". Bộ tự chỉnh hạ xong thì FPS lên lại, nhưng
  //    mẫu thấp nhất vẫn giữ được cú tụt đã gây ra việc hạ đó.
  await p.waitForTimeout(3000);
  const before = await p.evaluate(() => ({ fxq: FXQ, res: RES, fps: _perf.fps }));
  const mau = [];
  for (let i = 0; i < 30; i++){
    await p.waitForTimeout(1000);
    const f = await p.evaluate(() => _perf.fps);
    if (f) mau.push(f);
  }
  const day = mau.length ? Math.min(...mau) : 0;
  const tuned = await p.evaluate(() => ({ fxq: FXQ, res: RES, fps: _perf.fps,
    cw: document.getElementById('game').width, W }));
  console.log('7) tự chỉnh:', JSON.stringify(before), '→', JSON.stringify(tuned),
              `· FPS thấp nhất trong cửa sổ = ${day} (${mau.length} mẫu)`);
  const yeu = (before.fps && before.fps < 55) || (day && day < 55);
  if (yeu){
    if (tuned.fxq >= before.fxq && tuned.res >= before.res)
      fail(`lúc đầy hiệu ứng chỉ đạt ${before.fps} FPS mà bộ tự chỉnh không hạ gì cả`);
    else console.log(`   (đuối ở ${before.fps} FPS → đã hạ xuống fxq ${tuned.fxq}, nay ${tuned.fps} FPS)`);
  } else {
    console.log(`   (chưa từng tụt dưới 55 FPS — thấp nhất ${day} — nên không hạ gì là đúng)`);
    if (tuned.fxq < before.fxq || tuned.res < before.res)
      fail(`suốt cửa sổ chưa lúc nào tụt dưới 55 FPS (thấp nhất ${day}) mà bộ tự chỉnh vẫn hạ chất lượng`);
  }
  if (tuned.res < 1 && tuned.fxq !== 0)
    fail(`hạ độ nét xuống ${tuned.res} khi hiệu ứng còn ở mức ${tuned.fxq} — phải hạ hiệu ứng trước`);
  if (tuned.W !== 1280) fail('tự chỉnh làm co tầm nhìn');
  if (Math.abs(tuned.cw - 1280*tuned.res) > 2) fail('bộ đệm không khớp RES sau khi tự chỉnh');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
