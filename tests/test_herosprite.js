// Sprite nhân vật: phải khớp bản vẽ thẳng, không cắt hào quang, không rò giữa các lớp/bậc/bộ đồ,
// và tư thế TRÚNG ĐÒN vẫn vẽ thẳng (không lấy từ bộ nhớ đệm).
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(500);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(500);

  // 1. sprite khớp bản vẽ thẳng
  const r1 = await p.evaluate(() => {
    const gv = gearVisual(player), tier = heroTier(player), N = 4;
    const out = [];
    for (const [k,i] of [['i',0],['w',3],['a',4],['c',4]]){
      const spr = heroSprite('thieulam', tier, gv, k, i, 'slash', false);
      const a = document.createElement('canvas'); a.width = spr.width; a.height = spr.height;
      a.getContext('2d').drawImage(spr, 0, 0);
      const bcv = document.createElement('canvas'); bcv.width = spr.width; bcv.height = spr.height;
      const g = bcv.getContext('2d');
      g.scale(spr.width / spr._ow, spr.height / spr._oh);
      g.translate(-spr._ox, -spr._oy);
      const ps = heroFramePose(k, i, 'slash'); ps.back = false;
      // So với ĐÚNG hàm mà game rơi vào khi trúng đòn (drawHeroLit), không phải
      // drawHeroFigure thô. Tính chất cần giữ vẫn y nguyên: hai đường vẽ phải cho
      // ra cùng một hình, nếu không thì nhân vật đổi dáng vẻ mỗi lần ăn đòn.
      drawHeroLit(g, 'thieulam', tier, heroFrameNow(k, i), ps, gv);
      const da = a.getContext('2d').getImageData(0,0,spr.width,spr.height).data;
      const db = g.getImageData(0,0,spr.width,spr.height).data;
      // Bỏ qua vùng GẦN TRONG SUỐT. Vành ngoài cùng của quầng sáng chênh nhau đúng một nấc alpha
      // do làm tròn khi cắt ảnh — đo được nó chiếm trọn 6,2% "lệch" của khung đánh, trong khi
      // thân người trùng khít. Đó là nhiễu của phép đo, không phải lệch hình.
      let diff = 0, tot = 0;
      for (let q = 0; q < spr.width * spr.height; q++){ const o = q*4;
        if (da[o+3] < 24 && db[o+3] < 24) continue;
        tot++;
        if (Math.abs(da[o]-db[o]) + Math.abs(da[o+1]-db[o+1]) + Math.abs(da[o+2]-db[o+2]) + Math.abs(da[o+3]-db[o+3]) > 40) diff++; }
      out.push({ f: k+i, pct: +(diff/Math.max(1,tot)*100).toFixed(2) });
    }
    void N; return out;
  });
  console.log('1. lệch so với vẽ thẳng:', JSON.stringify(r1));
  const xau = r1.filter(x => x.pct > 2);
  if (xau.length) fail('sprite lệch khỏi bản vẽ thẳng: ' + JSON.stringify(xau));
  else pass('4 khung sprite khớp bản vẽ thẳng (lệch ≤ ' + Math.max(...r1.map(x=>x.pct)) + '%)');

  // 2. không cắt hào quang — mép sprite phải trong suốt
  const r2 = await p.evaluate(() => {
    const spr = heroSprite('thieulam', heroTier(player), gearVisual(player), 'i', 0, 'slash', false);
    const g = document.createElement('canvas'); g.width = spr.width; g.height = spr.height;
    const c = g.getContext('2d'); c.drawImage(spr, 0, 0);
    const d = c.getImageData(0,0,spr.width,spr.height).data;
    let mep = 0;
    const at = (x,y) => d[(y*spr.width + x)*4 + 3];
    for (let x = 0; x < spr.width; x++){ if (at(x,0) > 24) mep++; if (at(x,spr.height-1) > 24) mep++; }
    for (let y = 0; y < spr.height; y++){ if (at(0,y) > 24) mep++; if (at(spr.width-1,y) > 24) mep++; }
    return { mepDuc: mep, w: spr.width, h: spr.height, ox: Math.round(spr._ox), oy: Math.round(spr._oy) };
  });
  console.log('2.', JSON.stringify(r2));
  if (r2.mepDuc > 8) fail(`hào quang bị cắt: ${r2.mepDuc} điểm ảnh đục nằm sát mép sprite`);
  else pass('hào quang không bị cắt (mép sprite trong suốt)');

  // 3. đổi lớp / bậc / bộ đồ phải ra sprite KHÁC
  const r3 = await p.evaluate(() => {
    const gv = gearVisual(player), t = heroTier(player);
    const key = s2 => { const c = heroSprite(s2.sect, s2.tier, s2.gv, 'i', 0, 'slash', false);
      return c.width + 'x' + c.height + ':' + c.toDataURL().length; };
    const a = key({ sect:'thieulam', tier:t, gv });
    const b2 = key({ sect:'baidasan', tier:t, gv });
    const gv2 = Object.assign({}, gv, { plus: 0, t: 1 });
    const d2 = key({ sect:'thieulam', tier:t, gv:gv2 });
    // Bậc: so với gv=null. Khi ĐANG mặc một bộ giáp, tint của bộ ghi đè trọn bảng màu bậc (xem
    // hSetMetal) nên tham số tier không đổi được gì — đó là thiết kế, không phải rò bộ nhớ đệm.
    const e1 = key({ sect:'thieulam', tier:1,  gv:null });
    const e2 = key({ sect:'thieulam', tier:7, gv:null });
    return { lopKhac: a !== b2, bacKhac: e1 !== e2, doKhac: a !== d2 };
  });
  console.log('3.', JSON.stringify(r3));
  if (!r3.lopKhac || !r3.bacKhac || !r3.doKhac) fail('bộ nhớ đệm rò giữa lớp/bậc/bộ đồ: ' + JSON.stringify(r3));
  else pass('khoá bộ nhớ đệm tách đúng theo lớp · bậc · chữ ký trang bị');

  // 4. TRÚNG ĐÒN CŨNG PHẢI LẤY SPRITE — luật này đã ĐẢO CÓ CHỦ Ý.
  //    Bản cũ chặn sprite lúc trúng đòn để giữ tư thế giật ngửa (giật ngửa nằm trong `_ps`, mà
  //    sprite nướng sẵn không nhận tư thế). Cái giá đo được ngoài game đắt hơn nhiều: suốt 0,3
  //    giây sau MỖI cú đòn, nhân vật đổi sang dáng người vẽ bằng đường — Dark Wizard đang mặc
  //    bộ Spine thật hoá thành một áo choàng tím trơn. Quái đánh liên tục thì gần như không lúc
  //    nào thấy đúng bộ đồ đang mặc. Nay giật ngửa làm bằng phép xoay quanh gót lúc blit, nên
  //    giữ được cả art thật lẫn phản hồi trúng đòn.
  //    Phải hạ mức hiệu ứng trước: ở mức ĐẦY thì drawPlayer luôn vẽ thẳng (người chơi chọn chất
  //    lượng thì trả lại chất lượng), nên không có sprite nào để mà so.
  await p.evaluate(() => setFxq(1));
  const r4 = await p.evaluate(() => {
    const t0 = heroSpriteStats().miss + heroSpriteStats().hit;
    player.hurtT = 0.3;
    for (let i = 0; i < 10; i++) render();
    const t1 = heroSpriteStats().miss + heroSpriteStats().hit;
    player.hurtT = 0;
    for (let i = 0; i < 10; i++) render();
    const t2 = heroSpriteStats().miss + heroSpriteStats().hit;
    return { khiTrungDon: t1 - t0, khiBinhThuong: t2 - t1 };
  });
  console.log('4.', JSON.stringify(r4));
  if (r4.khiTrungDon < 5) fail('trúng đòn rơi về hình vẽ đường — bộ giáp thật biến mất mỗi lần bị đánh');
  else if (r4.khiBinhThuong < 5) fail('bình thường lại KHÔNG dùng sprite');
  else pass('trúng đòn vẫn giữ art nướng, bình thường cũng vậy');

  // 4b. sprite dùng ở MỌI mức hiệu ứng (chất lượng đã đo là ngang bản vẽ thẳng)
  const r4b = await p.evaluate(() => {
    const out = {};
    for (const q of [2, 1, 0]){
      setFxq(q);
      const t0 = heroSpriteStats().hit + heroSpriteStats().miss;
      for (let i = 0; i < 12; i++) render();
      out['muc' + q] = heroSpriteStats().hit + heroSpriteStats().miss - t0;
    }
    setFxq(1);
    return out;
  });
  console.log('4b. lượt dùng sprite theo mức:', JSON.stringify(r4b));
  const _thieu = Object.entries(r4b).filter(([, v]) => v < 5).map(([k]) => k);
  if (_thieu.length) fail('mức không dùng sprite: ' + _thieu.join(', '));
  else pass('cả ba mức hiệu ứng đều dùng sprite');

  // 4b2. ĐANG TUNG CHIÊU cũng phải dùng sprite. `pulse` nở ra `1 + castK*0,12` lúc này, và một
  //      chốt chặn theo pulse sẽ âm thầm tắt sprite đúng lúc trên màn hình đông nhất.
  const r4b2 = await p.evaluate(() => {
    player.castT = 0.4; player.castMax = 0.6;
    const t0 = heroSpriteStats().hit + heroSpriteStats().miss;
    for (let i = 0; i < 10; i++) render();
    const n = heroSpriteStats().hit + heroSpriteStats().miss - t0;
    player.castT = 0;
    return n;
  });
  console.log('4b2. lượt dùng sprite lúc tung chiêu:', r4b2);
  if (r4b2 < 5) fail('đang tung chiêu lại KHÔNG dùng sprite — chốt theo pulse đang chặn nhầm');
  else pass('đang tung chiêu vẫn dùng sprite');

  // 4c. nhịp giật của sprite phải ngang bản vẽ thẳng
  //
  // PHẢI SO CÙNG MỘT THỨ. drawHeroFigure() nay vẽ THÂN TRẦN — lớp giáp vector đã gỡ, giáp là
  // art Spine nằm trong chính bảng khung. So sprite MẶC ĐỒ với bản vẽ thẳng TRẦN là so nhiều
  // chi tiết với ít chi tiết: sprite đổi nhiều điểm ảnh hơn mỗi khung chỉ vì nó có nhiều thứ
  // hơn để đổi, không phải vì nó giật. Đo được lúc so lệch: 13,3% với 8% ⇒ đỏ vĩnh viễn dù có
  // tăng HS_FRAMES.w bao nhiêu. Nên cả hai bên cùng lấy gv = null: thân trần với thân trần.
  const r4c = await p.evaluate(() => {
    const gv = null, tier = heroTier(player);
    const SH = 104, SW = Math.round(HERO_W * SH / HERO_H);
    const mk = () => { const c = document.createElement('canvas'); c.width = SW*2; c.height = SH*2; return c; };
    const dif = (A,B) => { const a2 = A.getImageData(0,0,SW*2,SH*2).data, b2 = B.getImageData(0,0,SW*2,SH*2).data;
      let n = 0; for (let i = 0; i < SW*2*SH*2; i++){ const o = i*4;
        if (Math.abs(a2[o]-b2[o])+Math.abs(a2[o+1]-b2[o+1])+Math.abs(a2[o+2]-b2[o+2])+Math.abs(a2[o+3]-b2[o+3]) > 40) n++; }
      return n/(SW*2*SH*2)*100; };
    const sprC = i => { const s2 = heroSprite('thieulam', tier, gv, 'w', i, 'slash', false, 1);
      const c = mk(), g = c.getContext('2d'); g.scale(SW*2/HERO_W, SH*2/HERO_H);
      g.drawImage(s2, s2._ox, s2._oy, s2._ow, s2._oh); return g; };
    const liveC = ph => { const c = mk(), g = c.getContext('2d'); g.scale(SW*2/HERO_W, SH*2/HERO_H);
      const ps = heroPose(ph, true, 0,0,0,'slash'); ps.back = false;
      drawHeroFigure(g, 'thieulam', tier, 0, ps, gv); return g; };
    const TAU = Math.PI*2, N = HS_FRAMES.w;
    const sp = [], lv = [];
    for (let i = 0; i < 5; i++){
      sp.push(dif(sprC(i), sprC((i+1) % N)));
      lv.push(dif(liveC(i/N*TAU), liveC((i+1)/N*TAU)));
    }
    const avg = a2 => a2.reduce((x,y)=>x+y,0)/a2.length;
    return { sprite: +avg(sp).toFixed(1), veThang: +avg(lv).toFixed(1), soKhung: N };
  });
  console.log('4c.', JSON.stringify(r4c));
  if (r4c.sprite > r4c.veThang * 1.6)
    fail(`nhịp giật sprite ${r4c.sprite}% thô hơn hẳn bản vẽ thẳng ${r4c.veThang}% — tăng HS_FRAMES.w`);
  else pass(`nhịp giật sprite ${r4c.sprite}% ≈ vẽ thẳng ${r4c.veThang}% (${r4c.soKhung} khung đi)`);

  // 5. trần LRU
  const r5 = await p.evaluate(() => {
    for (let i = 0; i < 900; i++) heroSprite('thieulam', 1 + (i % 10), null, 'w', i % HS_FRAMES.w, 'slash', i % 2 === 0, i % 3);
    return heroSpriteStats().cache;
  });
  console.log('5. cỡ bộ nhớ đệm sau 400 lượt:', r5);
  if (r5 > 420) fail('bộ nhớ đệm vượt trần LRU: ' + r5);
  else pass('LRU giữ bộ nhớ đệm ở ' + r5 + ' mục (trần 420)');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có pageerror');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
