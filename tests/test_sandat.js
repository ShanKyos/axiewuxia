// SÀN ĐẤT — hợp đồng chung cho MỌI map dựng lại theo lối isometric
//
// Bài này KHÔNG gắn với một map nào. Nó quét cả bảng MAPS, và map nào khai `diTrong` thì map đó
// bị gác. Nghĩa là: dựng lại một map, chấm xong đa giác sàn, dán vào `data/canbang.js` — bài này
// tự động bắt đầu canh nó, không phải viết bài mới. Map chưa có `diTrong` thì bỏ qua, nên hôm nay
// nó chỉ gác Quảng Trường Cũ.
//
// Vì sao đây là bài đáng có: cảm giác "đi trên không trung" mà chủ dự án báo có đúng MỘT nguyên
// nhân — tranh nền vẽ theo lối nhìn ngang bị dùng làm mặt đất, rồi người chơi đi khắp mặt tranh,
// kể cả phần trời. Đa giác `diTrong` là thứ chặn việc đó. Bài này canh đúng cái đa giác ấy còn
// đúng: giữ được người chơi, mà không giam nhốt hay cắt map làm hai.
//
// Xem `docs/PROMPT_MAP_ISOMETRIC.md` §3 để biết mỗi ràng buộc dưới đây từ đâu ra.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

// §3.2 — map hoang dã phải chừa ≥ 60% khung là sàn đi được, nếu không thì không đủ chỗ đặt bãi
// quái. Ngưỡng kiểm để ở 55%, chừa lề cho đa giác chấm tay. Thành an toàn được phép chật
// (Quảng Trường Cũ chỉ 10,9%) nên không áp luật này.
const SAN_TOI_THIEU_HOANG_DA = 0.55;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);

  const r = await p.evaluate((SAN_MIN) => {
    startGame('thieulam', { name: 'T' });

    const trong = (dg, x, y) => {
      let c = false;
      for (let i = 0, j = dg.length - 1; i < dg.length; j = i++){
        const xi = dg[i][0], yi = dg[i][1], xj = dg[j][0], yj = dg[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const dienTich = dg => {
      let s = 0;
      for (let i = 0, n = dg.length; i < n; i++){
        const a = dg[i], b2 = dg[(i + 1) % n];
        s += a[0] * b2[1] - b2[0] * a[1];
      }
      return Math.abs(s) / 2;
    };

    const ra = [];
    for (const key of Object.keys(MAPS)){
      const md = MAPS[key], dg = md.diTrong;
      if (!dg || dg.length < 3) continue;

      if (curMap !== key) travelTo(key);
      buildWorld();
      const o = { map: key, ten: md.name, loai: md.type, dinh: dg.length,
                  san: +(100 * dienTich(dg) / (MAP.w * MAP.h)).toFixed(1), loi: [] };

      // ① điểm thả phải nằm trong sàn và không đè vật cản
      const sp = md.spawn;
      if (!sp) o.loi.push('không khai `spawn`');
      else {
        if (!trong(dg, sp.x, sp.y)) o.loi.push(`điểm thả (${sp.x},${sp.y}) NGOÀI đa giác sàn`);
        else if (inObstacle(key, sp.x, sp.y, 16)) o.loi.push(`điểm thả (${sp.x},${sp.y}) đè vật cản`);
      }

      // ② điểm tới từ map khác (`spawnFrom`) cũng phải đứng được
      for (const tu in (md.spawnFrom || {})){
        const q = md.spawnFrom[tu];
        if (!trong(dg, q.x, q.y)) o.loi.push(`điểm tới từ ${tu} (${q.x},${q.y}) NGOÀI đa giác`);
        else if (inObstacle(key, q.x, q.y, 16)) o.loi.push(`điểm tới từ ${tu} đè vật cản`);
      }

      // ③ đi ra tám hướng — không hướng nào được thoát khỏi đa giác.
      //    Đây là bài chính: nó chứng minh người chơi KHÔNG bước ra khỏi mặt đất được.
      if (sp){
        const thoat = [];
        for (const [tx, ty] of [[120,120],[MAP.w-120,120],[MAP.w-120,MAP.h-120],[120,MAP.h-120],
                                [MAP.w/2,60],[MAP.w/2,MAP.h-60],[60,MAP.h/2],[MAP.w-60,MAP.h/2]]){
          player.x = sp.x; player.y = sp.y;
          moveTarget = { x: tx, y: ty };
          for (let i = 0; i < 480; i++) update(1/60);
          if (!trong(dg, player.x, player.y))
            thoat.push(`→(${Math.round(tx)},${Math.round(ty)}) dừng ở (${Math.round(player.x)},${Math.round(player.y)})`);
        }
        if (thoat.length) o.loi.push('đi lọt ra ngoài sàn: ' + thoat.join(' · '));
      }

      // ④ mọi thứ máy đặt ra thế giới phải đứng được trên sàn
      const dat = [];
      for (const n of NPCS.filter(n => n.map === key)) dat.push(['NPC ' + n.name, n.x, n.y, 20]);
      for (const g of GATES.filter(g => g.map === key)) dat.push(['cổng ' + g.name, g.x, g.y, 20]);
      for (const m of mobs) dat.push(['quái ' + (m.name || m.key), m.x, m.y, 0]);
      const ngoai = [], ket = [];
      for (const [ten, x, y, r2] of dat){
        if (!trong(dg, x, y)) ngoai.push(ten);
        else if (r2 && inObstacle(key, x, y, r2)) ket.push(ten);
      }
      // gộp lại, đừng in ra 60 dòng tên quái giống nhau
      if (ngoai.length) o.loi.push(`${ngoai.length} thứ nằm ngoài sàn: ` + ngoai.slice(0, 6).join(' · ') + (ngoai.length > 6 ? ' …' : ''));
      if (ket.length) o.loi.push(`${ket.length} thứ kẹt trong vật cản: ` + ket.slice(0, 6).join(' · '));
      o.soQuai = mobs.length; o.soNpc = NPCS.filter(n => n.map === key).length;

      // ⑤ đa giác không được cắt sàn làm hai — từ điểm thả phải đi bộ tới được một cái cổng
      const cong = GATES.filter(g => g.map === key);
      o.soCong = cong.length;
      if (sp && cong.length){
        player.x = sp.x; player.y = sp.y;
        moveTarget = { x: cong[0].x, y: cong[0].y };
        for (let i = 0; i < 1200; i++) update(1/60);
        if (dist(player.x, player.y, cong[0].x, cong[0].y) >= 90)
          o.loi.push(`đi bộ từ điểm thả KHÔNG tới được cổng "${cong[0].name}" — đa giác cắt sàn làm hai`);
      }

      // ⑥ §3.2 — map hoang dã phải đủ rộng để cõng bãi quái
      if (md.type === 'pk' || md.type === 'freepk'){
        if (o.san < SAN_MIN * 100)
          o.loi.push(`sàn chỉ ${o.san}% khổ map — map đánh nhau cần ≥${(SAN_MIN*100).toFixed(0)}%, xem PROMPT_MAP_ISOMETRIC §3.2`);
      }

      ra.push(o);
    }
    return ra;
  }, SAN_TOI_THIEU_HOANG_DA);

  console.log(JSON.stringify(r, null, 1));
  let bad = 0;
  if (!r.length){
    console.log('FAIL không map nào khai `diTrong` — bài này lẽ ra phải gác ít nhất Quảng Trường Cũ');
    bad++;
  }
  for (const o of r){
    if (o.loi.length){
      for (const l of o.loi) console.log(`FAIL [${o.map}] ${l}`);
      bad += o.loi.length;
    } else {
      console.log(`PASS [${o.map}] ${o.ten} — sàn ${o.san}% · ${o.dinh} đỉnh · ${o.soNpc} NPC · ${o.soCong} cổng · ${o.soQuai} quái đều đứng trên đất`);
    }
  }
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
