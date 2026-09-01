const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(600);

  // 1) đủ 4 cổng, mỗi cổng đi tới đúng map và ĐI ĐƯỢC khi đủ cấp
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 120; questIdx = 40; questState = 'active'; calcDerived();
    const out = [];
    // Cổng Tầng Sâu cũng nằm ở tuongduong nhưng KHÔNG có `to` — nó mở một lượt xuống tầng chứ
    // không dẫn tới map cố định, nên loại khỏi bài kiểm 4 cổng thành.
    for (const g of GATES.filter(x => x.map === 'tuongduong' && x.to)){
      travelTo('tuongduong');
      player.x = g.x; player.y = g.y;
      update(0.05);                       // để nearGate cập nhật
      const near = nearGate === g;
      travelTo(g.to, 'tuongduong');       // mô phỏng bấm G
      out.push({ gate: g.name.split(' → ')[0], to: g.to, nearDetected: near, arrived: curMap === g.to });
    }
    return out;
  });
  console.log('1) 4 cổng thành:'); r1.forEach(g =>
    console.log(`   ${g.gate.padEnd(10)} → ${String(g.to || '(Tầng Sâu)').padEnd(12)} phát hiện:${g.nearDetected?'✓':'✗'} tới nơi:${g.arrived?'✓':'✗'}`));

  // 2) tường chặn thật: đứng ngoài tường đẩy vào không lọt, nhưng qua lối cổng thì lọt
  const r2 = await page.evaluate(() => {
    travelTo('tuongduong');
    const W = CITY_WALL;
    function tryPush(x, y, tx, ty){
      player.x = x; player.y = y;
      for (let i = 0; i < 60; i++){
        player.x += (tx - player.x) * 0.15; player.y += (ty - player.y) * 0.15;
        collideCityWalls();
      }
      return { x: Math.round(player.x), y: Math.round(player.y) };
    }
    // đẩy xuyên tường bắc ở chỗ ĐẶC (lệch khỏi cổng) — phải bị chặn ngoài
    const solid = tryPush(W.x1 + 120, W.y1 - 120, W.x1 + 120, W.y1 + 200);
    // đẩy qua đúng lối cổng bắc — phải vào được
    const viaGate = tryPush(W.gateX, W.y1 - 120, W.gateX, W.y1 + 200);
    return { blockedAtSolidWall: solid.y < W.y1, solid, enteredViaGate: viaGate.y > W.y1, viaGate };
  });
  console.log('2) tường chặn / lối cổng thông:', JSON.stringify(r2));

  // 3) NPC: đều trong thành, không kẹt tường, giãn cách hợp lý
  const r3 = await page.evaluate(() => {
    travelTo('tuongduong');
    const ns = NPCS.filter(n => n.map === 'tuongduong');
    const W = CITY_WALL;
    const stuck = ns.filter(n => cityWallRects().some(r =>
      n.x > r.x - 6 && n.x < r.x + r.wd + 6 && n.y > r.y - 6 && n.y < r.y + r.ht + 6));
    const outside = ns.filter(n => !(n.x > W.x1 && n.x < W.x2 && n.y > W.y1 && n.y < W.y2));
    let minD = 1e9;
    for (let i = 0; i < ns.length; i++) for (let j = i+1; j < ns.length; j++)
      minD = Math.min(minD, Math.hypot(ns[i].x-ns[j].x, ns[i].y-ns[j].y));
    return { count: ns.length, stuckInWall: stuck.length, outsideCity: outside.length, minDist: Math.round(minD) };
  });
  console.log('3) NPC trong thành:', JSON.stringify(r3));

  // 4) cây/đá không mọc đè quảng trường & 4 lối ra cổng
  const r4 = await page.evaluate(() => {
    travelTo('tuongduong');
    const W = CITY_WALL, gh = W.gateW/2 + 30;
    const onPlaza = decor.filter(d => Math.hypot(d.x-W.gateX, d.y-W.gateY) < 300).length;
    const onPath = decor.filter(d =>
      (Math.abs(d.x-W.gateX) < gh && d.y > W.y1 && d.y < W.y2) ||
      (Math.abs(d.y-W.gateY) < gh && d.x > W.x1 && d.x < W.x2)).length;
    return { decorOnPlaza: onPlaza, decorOnGatePaths: onPath };
  });
  console.log('4) quảng trường & lối cổng trống:', JSON.stringify(r4));

  // 5) render nhiều khung hình trong thành không lỗi (mood/plaza/haze)
  const r5 = await page.evaluate(() => {
    travelTo('tuongduong'); player.x = 1300; player.y = 905; snapCamera();
    for (let i = 0; i < 40; i++){ update(0.05); render(); }
    return { ok: true };
  });
  console.log('5) render thành 40 khung hình:', JSON.stringify(r5));
  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
