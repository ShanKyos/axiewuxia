// QUẢNG TRƯỜNG CŨ — THỊ TRẤN KHỞI ĐẦU, CHẶN BẰNG ĐA GIÁC SÀN
//
// Map này là tranh ISOMETRIC đầu tiên trong game: nhà có chiều cao, mái là hình thoi, còn game
// thì nhìn từ trên xuống. Bản đầu chặn tám khối nhà bằng tám hình `ellipse` và không cách nào
// đúng được — ellipse phình ra cho kín mái thì ăn mất mặt sân, thu lại cho chừa sân thì hở mái.
// Nay chặn ngược lại: khai `diTrong` (đa giác MẶT SÀN), ngoài đa giác là chặn hết.
//
// Bài này gác đúng cái đó: đi ra mọi hướng đều phải bị giữ lại TRONG đa giác, và cái giếng giữa
// sân — thứ duy nhất còn nằm trong vùng đi được — vẫn phải chặn thật.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);

  const r = await p.evaluate(() => {
    startGame('thieulam', { name: 'T' });
    const md = MAPS.quangtruong, dg = md.diTrong;
    const inside = (x, y) => {
      let c = false;
      for (let i = 0, j = dg.length - 1; i < dg.length; j = i++){
        const xi = dg[i][0], yi = dg[i][1], xj = dg[j][0], yj = dg[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    // 1. nhân vật mới phải hiện ra Ở ĐÂY, trong đa giác, và không lọt vào giếng
    const batDau = { map: curMap, x: Math.round(player.x), y: Math.round(player.y) };
    batDau.trong = inside(player.x, player.y);
    batDau.trongGieng = inObstacle('quangtruong', player.x, player.y, 16);

    // 2. đi ra tám hướng — không hướng nào được thoát khỏi đa giác
    const raNgoai = [];
    for (const [tx, ty] of [[200,300],[2500,300],[2500,1800],[200,1800],
                            [1300,1850],[1300,120],[100,1100],[2550,1100]]){
      player.x = md.spawn.x; player.y = md.spawn.y;
      moveTarget = { x: tx, y: ty };
      for (let i = 0; i < 420; i++) update(1/60);
      if (!inside(player.x, player.y))
        raNgoai.push(`(${tx},${ty}) → (${Math.round(player.x)},${Math.round(player.y)})`);
    }

    // 3. giếng giữa sân vẫn chặn — đi xuyên qua nó không được đứng trong lòng giếng
    player.x = md.spawn.x; player.y = md.spawn.y;
    moveTarget = { x: 1279, y: 900 };
    for (let i = 0; i < 300; i++) update(1/60);
    const trongGieng = inObstacle('quangtruong', player.x, player.y, 12);

    // 4. mọi NPC + cổng của map phải nằm trong đa giác và ngoài vật cản
    const lech = [];
    for (const n of NPCS.filter(n => n.map === 'quangtruong')){
      if (!inside(n.x, n.y)) lech.push(`NPC ${n.name} ngoài đa giác`);
      else if (inObstacle('quangtruong', n.x, n.y, 20)) lech.push(`NPC ${n.name} kẹt trong vật cản`);
    }
    const cong = GATES.filter(g => g.map === 'quangtruong');
    for (const g of cong){
      if (!inside(g.x, g.y)) lech.push(`cổng ${g.name} ngoài đa giác`);
      else if (inObstacle('quangtruong', g.x, g.y, 20)) lech.push(`cổng ${g.name} kẹt trong vật cản`);
    }

    // 5. đi bộ từ điểm thả tới được cổng (đa giác không cắt sân làm hai)
    let toiCong = true;
    if (cong.length){
      player.x = md.spawn.x; player.y = md.spawn.y;
      moveTarget = { x: cong[0].x, y: cong[0].y };
      for (let i = 0; i < 900; i++) update(1/60);
      toiCong = dist(player.x, player.y, cong[0].x, cong[0].y) < 90;
    }

    return { batDau, raNgoai, trongGieng, lech, soNpc: NPCS.filter(n => n.map === 'quangtruong').length,
             soCong: cong.length, toiCong,
             viTriCuoi: { x: Math.round(player.x), y: Math.round(player.y) } };
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0;
  const fail = m => { console.log('FAIL ' + m); bad++; };
  const pass = m => console.log('PASS ' + m);

  if (r.batDau.map !== 'quangtruong') fail(`nhân vật mới hiện ra ở ${r.batDau.map}, không phải Quảng Trường Cũ`);
  else pass('nhân vật mới hiện ra ở Quảng Trường Cũ');
  if (!r.batDau.trong) fail(`điểm thả (${r.batDau.x},${r.batDau.y}) nằm NGOÀI đa giác đi được`);
  else if (r.batDau.trongGieng) fail(`điểm thả (${r.batDau.x},${r.batDau.y}) lọt trong lòng giếng`);
  else pass(`điểm thả (${r.batDau.x},${r.batDau.y}) nằm trong sân, không đè vật cản`);
  if (r.raNgoai.length) fail('đi lọt ra ngoài đa giác: ' + r.raNgoai.join(' · '));
  else pass('cả 8 hướng đều bị đa giác giữ lại — không ai đi lên mái nhà hay ra vành đá');
  if (r.trongGieng) fail(`đi xuyên qua giếng, dừng lại (${r.viTriCuoi.x},${r.viTriCuoi.y}) trong lòng giếng`);
  else pass('giếng giữa sân vẫn chặn thật');
  if (r.soNpc < 10) fail(`chỉ ${r.soNpc} NPC — thị trấn khởi đầu phải có đủ người (sàn 10, xem test_domap)`);
  else pass(`${r.soNpc} NPC quanh sân`);
  if (!r.soCong) fail('không có cổng nào — vào thị trấn rồi không ra được');
  else if (!r.toiCong) fail('từ điểm thả đi bộ KHÔNG tới được cổng — đa giác cắt sân làm hai');
  else pass('từ điểm thả đi bộ tới được cổng');
  if (r.lech.length) fail(r.lech.join(' · '));
  else pass('mọi NPC và cổng đều đứng được');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
