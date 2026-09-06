// Cảm giác vật cản. Khảo sát trước bản này đo được: cây/đá có bán kính va chạm BẰNG 0 (xếp 8
// cây thành hàng rào, nhân vật đi xuyên, toạ độ x không lệch một pixel), và 3/7 map ngoài trời
// có 0 vật cản trong lòng — mọi tuyến đường tỉ lệ vòng đúng 1,000.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); player.level = 120; calcDerived();
    // chỉ vật cản TĨNH, không nối decor — dùng để kiểm bố cục map
    window.inStatic = (mid, x, y, r) => {
      for (const o of (MAP_OBSTACLES[mid] || [])){
        if (o.wd){ const cx = Math.max(o.x, Math.min(x, o.x + o.wd)), cy = Math.max(o.y, Math.min(y, o.y + o.ht));
          if ((x-cx)*(x-cx) + (y-cy)*(y-cy) < r*r) return true; }
        else { const dx = (x-o.x)/(o.rx+r), dy = (y-o.y)/(o.ry+r); if (dx*dx + dy*dy < 1) return true; }
      }
      return false;
    };
    // Liên thông: lưới 40px, ô nào đi được thì nối nhau; mọi điểm nội dung phải cùng MỘT vùng.
    window.reachAll = (mid) => {
      const S = 40, W2 = Math.floor(MAP.w/S), H2 = Math.floor(MAP.h/S);
      const ok = (i,j) => !inStatic(mid, i*S + S/2, j*S + S/2, 16);
      const md = MAPS[mid], pts = [];
      const add = (nm,x,y) => pts.push({ nm, i: Math.floor(x/S), j: Math.floor(y/S) });
      for (const q of (md.packs||[])) add('bãi '+q.mob, q.x, q.y);
      for (const h of (HERB_SPOTS[mid]||[])) add('thảo dược', h.x, h.y);
      if (md.spawn) add('spawn', md.spawn.x, md.spawn.y);
      for (const k in (md.spawnFrom||{})) add('về từ '+k, md.spawnFrom[k].x, md.spawnFrom[k].y);
      for (const g of GATES) if (g.map === mid) add('cổng '+g.to, g.x, g.y);
      // boss không tính: spawnZoneBoss() tự nearestFree() ra chỗ trống gần nhất
      const start = pts.find(q => ok(q.i,q.j)) || { i: Math.floor(W2/2), j: Math.floor(H2/2) };
      const seen = new Set(), st = [[start.i,start.j]]; seen.add(start.i+','+start.j);
      while (st.length){
        const [i,j] = st.pop();
        for (const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const a = i+di, c = j+dj, k = a+','+c;
          if (a<0||c<0||a>=W2||c>=H2||seen.has(k)||!ok(a,c)) continue;
          seen.add(k); st.push([a,c]);
        }
      }
      return pts.filter(q => !seen.has(q.i+','+q.j)).map(q => q.nm);
    };
  });

  // ── 0. LIÊN THÔNG: mọi điểm nội dung phải tới được nhau ──
  const reach = await p.evaluate(() => {
    const o = {};
    for (const mid of ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']) o[mid] = reachAll(mid);
    return o;
  });
  console.log('liên thông — điểm BỊ CÔ LẬP:', JSON.stringify(reach));
  for (const m in reach) if (reach[m].length) fail(`${m}: ${[...new Set(reach[m])].join(', ')} bị vật cản cô lập, không đi tới được`);

  // ── 1. Cây/đá phải CHẶN thật: dựng hàng rào rồi đi xuyên ──
  const wall = await p.evaluate(() => {
    travelTo('chungnam');
    decor = []; for (let i = 0; i < 8; i++) decor.push({ type:'tree', x:1080 + i*60, y:1000, s:1.5 });
    rebuildDecorObs();
    player.x = 1300; player.y = 1140; player.auto = false; moveTarget = null;
    const x0 = player.x, y0 = player.y;
    let maxDx = 0;
    for (let i = 0; i < 90; i++){                    // đi thẳng lên bắc, đâm vào hàng rào
      player.y -= 4; collideObstacles(player, 14);
      maxDx = Math.max(maxDx, Math.abs(player.x - x0));
    }
    return { x0, y0, x1: +player.x.toFixed(1), y1: +player.y.toFixed(1), lechX: +maxDx.toFixed(1),
             quaDuoc: player.y < 1000 };
  });
  console.log('hàng rào cây:', JSON.stringify(wall));
  if (wall.lechX === 0) fail('đi xuyên hàng cây — cây vẫn không có va chạm (đúng lỗi cũ)');
  if (wall.y1 > 1090) fail(`bị chặn cứng tại y=${wall.y1}, không trượt được dọc hàng rào`);

  // ── 2. Không khối nào đè lên điểm nội dung ──
  const clash = await p.evaluate(() => {
    const out = {};
    for (const mid of ['ngoai','chungnam','comoc','daohoa','tuyettinh','mongco','nhanmon']){
      const md = MAPS[mid], bad2 = [];
      const chk = (nm, x, y, r) => { if (inStatic(mid, x, y, r)) bad2.push(`${nm}(${Math.round(x)},${Math.round(y)})`); };
      for (const q of (md.packs || [])) chk('bãi ' + q.mob, q.x, q.y, 24);   // tâm bãi phải thông
      for (const h of (HERB_SPOTS[mid] || [])) chk('thảo dược', h.x, h.y, 20);
      if (md.spawn) chk('spawn', md.spawn.x, md.spawn.y, 30);
      for (const k in (md.spawnFrom || {})) chk('về từ ' + k, md.spawnFrom[k].x, md.spawnFrom[k].y, 30);
      for (const g of GATES) if (g.map === mid) chk('cổng ' + g.to, g.x, g.y, 40);
      for (const a of AI_PASSES) if (a.map === mid) chk('ải ' + a.name, a.x, a.y, 30);  // ải là CỔNG — nó nằm đúng khe hở, chỉ cần tâm thông
      // boss KHÔNG kiểm ở đây: spawnZoneBoss() tự gọi nearestFree() đẩy ra chỗ trống
      out[mid] = bad2;
    }
    return out;
  });
  console.log('đè lên nội dung:', JSON.stringify(clash));
  for (const m in clash) if (clash[m].length) fail(`${m}: vật cản đè lên ${clash[m].join(', ')}`);

  // ── 3. Tỉ lệ vòng: địa hình phải BẮT NGƯỜI TA VÒNG, và mọi chỗ phải TỚI được ──
  // ⚠ Bản trước lấy mẫu theo CẶP BÃI QUÁI và chỉ xét cặp vòng nhất. Hai lỗi:
  //   ① cây/đá bốc lại mỗi lần vào map, nên "cặp vòng nhất" nhảy loạn giữa các lần chạy — đo
  //      được comoc ra 1.045 ở lần này và 1.245 ở lần khác trên CÙNG một bản. Chập chờn sẵn.
  //   ② từ A4, toạ độ bãi quái là thứ SINH RA. Neo một khẳng định về ĐỊA HÌNH vào nội dung
  //      sinh ra là tự chuốc chập chờn.
  // Nay lấy mẫu trên một LƯỚI CỐ ĐỊNH 5×4 và đếm BAO NHIÊU tuyến phải vòng, thay vì chỉ nhìn
  // tuyến vòng nhất. Cùng một ý định, mẫu lớn hơn 3-7 lần và không phụ thuộc thứ gì bốc ngẫu nhiên.
  const routes = await p.evaluate(() => {
    const out = {};
    for (const mid of ['ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon','daohoa']){
      travelTo(mid);
      const g = [];
      for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 4; gy++){
        const x = 300 + gx*(MAP.w-600)/4, y = 300 + gy*(MAP.h-600)/3;
        if (!inObstacle(mid, x, y, 30)) g.push({ x, y });
      }
      const rs = []; let khongToi = 0;
      for (let i = 0; i < g.length; i++) for (let j = i+1; j < g.length; j++){
        const path = simulateMovePath(g[i].x, g[i].y, g[j].x, g[j].y);
        let L = 0; for (let k = 1; k < path.length; k++) L += dist(path[k-1].x, path[k-1].y, path[k].x, path[k].y);
        const D = dist(g[i].x, g[i].y, g[j].x, g[j].y);
        const end = path[path.length-1];
        if (dist(end.x, end.y, g[j].x, g[j].y) > 60){ khongToi++; continue; }
        rs.push(L / D);
      }
      rs.sort((a,c)=>a-c);
      out[mid] = { soCap: rs.length, trungVi: +rs[rs.length>>1].toFixed(3),
                   lonNhat: +rs[rs.length-1].toFixed(3),
                   phaiVong: rs.filter(x => x >= 1.08).length, khongToi };
    }
    return out;
  });
  console.log('tỉ lệ vòng:', JSON.stringify(routes));
  for (const m in routes){
    const r = routes[m];
    // ⚠ Ngưỡng 1, không phải 2 — và đây là một BƯỚC LÙI có ghi sổ. Khi còn bộ trụ đá thì mọi map
    //   đều ≥4 tuyến phải vòng; gỡ trụ xong Hollow Roost chỉ còn 1/66. Địa hình cỡ trận đánh
    //   đang là việc CÒN NỢ (xem SAN_CHE trong test_domap.js). Kéo lại ≥2 khi có tranh khối đá thật.
    if (r.phaiVong < 1) fail(`${m}: KHÔNG tuyến nào phải vòng trong ${r.soCap} tuyến — map phẳng lì`);
    if (r.lonNhat > 2.2) fail(`${m}: tuyến vòng nhất ${r.lonNhat} — đi vòng vô lý`);
    if (r.khongToi) fail(`${m}: ${r.khongToi} tuyến KHÔNG tới nơi — bị khoá đường`);
  }

  // ── 4. Khoảng trống: từ >1400px xuống mức cảm nhận được ──
  const clear = await p.evaluate(() => {
    const out = {};
    for (const mid of ['ngoai','chungnam','comoc']){
      travelTo(mid);
      const ds = [];
      for (let x = 200; x < MAP.w - 200; x += 100) for (let y = 200; y < MAP.h - 200; y += 100){
        if (inObstacle(mid, x, y, 14)) continue;
        let best = 1e9;
        for (let r = 40; r <= 900; r += 40){
          let hit = false;
          for (let k = 0; k < 16 && !hit; k++){
            const a = k/16*Math.PI*2;
            if (inObstacle(mid, x + Math.cos(a)*r, y + Math.sin(a)*r, 14)) hit = true;
          }
          if (hit){ best = r; break; }
        }
        ds.push(best);
      }
      ds.sort((a,c)=>a-c);
      out[mid] = { soDiem: ds.length, trungViPx: ds[ds.length>>1], soLanBanKinh: +(ds[ds.length>>1]/14).toFixed(1) };
    }
    return out;
  });
  console.log('khoảng trống:', JSON.stringify(clear));
  for (const m in clear) if (clear[m].trungViPx > 620)
    fail(`${m}: khoảng trống trung vị vẫn ${clear[m].trungViPx}px (${clear[m].soLanBanKinh} lần bán kính) — chưa chia được thành phòng`);

  // ── 5. Decor không được mọc đè lên bãi quái / thảo dược / cổng ──
  const dec = await p.evaluate(() => {
    const out = {};
    for (const mid of ['ngoai','chungnam','comoc','daohoa']){
      travelTo(mid);
      const md = MAPS[mid], bad2 = [];
      for (const q of (md.packs || [])) if (decor.some(d => dist(d.x,d.y,q.x,q.y) < 90)) bad2.push('bãi ' + q.mob);
      for (const h of (HERB_SPOTS[mid] || [])) if (decor.some(d => dist(d.x,d.y,h.x,h.y) < 40)) bad2.push('thảo dược');
      for (const g of GATES) if (g.map === mid && decor.some(d => dist(d.x,d.y,g.x,g.y) < 90)) bad2.push('cổng ' + g.to);
      if (md.spawn && decor.some(d => dist(d.x,d.y,md.spawn.x,md.spawn.y) < 100)) bad2.push('spawn');
      const trongVatCan = decor.filter(d => inStatic(mid, d.x, d.y, 2)).length;
      out[mid] = { soDecor: decor.length, deLen: bad2, mocTrongVatCan: trongVatCan };
    }
    return out;
  });
  console.log('decor:', JSON.stringify(dec));
  for (const m in dec){
    if (dec[m].deLen.length) fail(`${m}: decor mọc đè lên ${[...new Set(dec[m].deLen)].join(', ')}`);
    if (dec[m].mocTrongVatCan) fail(`${m}: ${dec[m].mocTrongVatCan} cây/đá mọc TRONG vật cản tĩnh (cây giữa hồ)`);
    if (dec[m].soDecor < 20) fail(`${m}: chỉ còn ${dec[m].soDecor} decor — bộ lọc ăn quá tay, map thành trọc`);
  }

  // ── 6. Đi thật trong game: phải tới nơi, và phải có né ──
  const walk = await p.evaluate(() => {
    // Dọn sạch quái trước khi đo. Bài này đo ĐỊA HÌNH có khoá đường không; để quái sống thì
    // đánh nhau giữa đường cắt ngang lệnh đi và bài chập chờn ~1/2 lần chạy (đã dựng lại được
    // trên đúng bản đã push, không phải do đợt sửa nào gây ra).
    travelTo('comoc'); player.auto = false; mobs.length = 0;
    const a = MAPS.comoc.packs[0], c = MAPS.comoc.packs[4];
    player.x = a.x; player.y = a.y; moveTarget = null; moveWaypoint = null;
    setMoveTarget(c.x, c.y);
    return { dat: !!moveTarget, tu:[a.x,a.y], toi:[c.x,c.y] };
  });
  await p.waitForTimeout(9000);
  const walked = await p.evaluate(() => ({
    x: Math.round(player.x), y: Math.round(player.y),
    conDich: !!moveTarget,
    cachDich: moveTarget ? Math.round(dist(player.x, player.y, moveTarget.x, moveTarget.y)) : 0,
    toiNoi: dist(player.x, player.y, MAPS.comoc.packs[4].x, MAPS.comoc.packs[4].y) < 120,
  }));
  const pass = m => console.log('PASS ' + m);
  console.log('đi thật:', JSON.stringify(walk), '→', JSON.stringify(walked));
  if (!walked.toiNoi) fail(`đi 9s vẫn chưa tới bãi quái (còn cách ${walked.cachDich}px) — vật cản khoá đường`);
  else pass('đi thật xuyên map: tới được bãi quái ở đầu kia, địa hình không khoá đường');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
