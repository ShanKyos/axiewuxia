// Địa hình: mọi thứ trong map phải TỚI ĐƯỢC, và chỗ nào không đi qua được phải NHÌN THẤY.
//
// Bốn lỗi thật, tìm ra bằng cách đi thử chứ không phải đọc code:
//
//  1. TƯỜNG VÔ HÌNH Ở CUỐI MAP. Cả 7 map đều chặn người chơi ở đúng 342px quanh boss Trấn Ải —
//     đó là Phong Ấn Năm Trụ (đúng thiết kế: phải hạ 3 Vệ Binh Trụ trước), nhưng nó CHỈ là một
//     phép đẩy ngược trong update() cộng một banner 4 giây một lần. Người chơi thấy nhân vật
//     khựng lại giữa bãi đất trống. Mục 1 đòi vòng phong ấn phải vẽ ra được và tắt đúng lúc.
//  2. NPC NẰM TRONG ĐÁ. Trại Chủ Mục Đồng ở Petalshade Outskirts đứng lọt trong gờ đá tây —
//     4/4 lượt đi thử đều khựng cách 72px, tức Trại Ngựa không bao giờ mở được.
//  3. CÂY RẢI NGẪU NHIÊN BỊT HÀNH LANG. Ở Stormgate Pass, tường thành + núi bắc chỉ chừa một
//     khe hẹp; vài gốc cây rơi trúng khe là cắt rời nửa map (đo được 1-2/4 lượt rải decor).
//  4. BỎ CUỘC SỚM. Bộ đi đường bám mép chui vào túi lõm rồi huỷ đích ở lần thử thứ 3, dù BFS
//     vẫn tìm ra đường.
//
// Mục 5 đo bằng ĐI THỬ THẬT (update() từng khung), không phải flood-fill: flood-fill chỉ nói
// "có đường", còn thứ người chơi gặp là bộ đi đường có đi nổi con đường đó không.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
const SEEDS = 4;
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  const r = await p.evaluate((SEEDS) => {
    window.TEST_MODE = true; startGame('thieulam', null); player.traits = [];
    player.level = 120; player.lvPeak = 120; calcDerived();
    const o = { seal:{}, rim:{}, dis:[], tong:0 };

    // ── 1. Phong Ấn Năm Trụ: vẽ được, và tắt khi hạ đủ ba Vệ Binh Trụ ──
    for (const id of Object.keys(BOSS_DEFS)){
      curMap = id; buildWorld();
      player.bossKills = {};
      const khoa = tranAiSeal();
      player.bossKills[id] = BOSS_DEFS[id].thuve.map(t => t.id);
      const mo = tranAiSeal();
      o.seal[id] = { khoa: khoa ? khoa.con : null, tong: khoa ? khoa.tong : null, moRoi: mo === null };
    }

    // ── 2+3. Mép vùng chặn có vật để nhìn, ở MỌI map thường ──
    for (const id of Object.keys(MAPS).filter(k => !MAPS[k].dungeon)){
      curMap = id; buildWorld(); rimBuild();
      o.rim[id] = _rimPts.length;
    }

    // ── 4+5. Đi thử tới mọi điểm nội dung, nhiều lượt rải decor khác nhau ──
    for (const id of Object.keys(MAPS).filter(k => !MAPS[k].dungeon)){
      for (let seed = 0; seed < SEEDS; seed++){
        curMap = id; buildWorld();
        if (BOSS_DEFS[id]) player.bossKills[id] = BOSS_DEFS[id].thuve.map(t => t.id); // mở phong ấn: đang đo ĐỊA HÌNH
        const dich = [];
        const bd = BOSS_DEFS[id];
        if (bd){ for (const d of bd.thuve || []) dich.push({ k:'boss', ten:d.name, x:d.x*MAP.w, y:d.y*MAP.h });
                 if (bd.tranai) dich.push({ k:'boss', ten:bd.tranai.name, x:bd.tranai.x*MAP.w, y:bd.tranai.y*MAP.h }); }
        for (const q of (MAPS[id].packs || [])) dich.push({ k:'bãi quái', ten:q.mob, x:q.x, y:q.y });
        for (const n of NPCS.filter(n => n.map === id)) dich.push({ k:'NPC', ten:n.id, x:n.x, y:n.y });
        for (const d of dich){
          // dựng lại thế giới cho TỪNG đích: lượt trước để lại moveProgressD/_moveRetry là lượt
          // sau bị huỷ oan ngay khung đầu (đã tự bẫy mình một lần vì đúng chuyện này)
          buildWorld(); mobs.length = 0;
          const sp = MAPS[id].spawn || { x:MAP.w/2, y:MAP.h/2 };
          player.x = sp.x; player.y = sp.y; player.hp = player.maxHp;
          player._moveRetry = 0; player._planD = null; moveProgressT = 0; moveProgressD = Infinity;
          moveTarget = null; movePlanClear();
          setMoveTarget(d.x, d.y);
          let t = 0;
          while (t < 45 && moveTarget && Math.hypot(player.x - d.x, player.y - d.y) > 70){ update(1/30); t += 1/30; }
          o.tong++;
          const con = Math.hypot(player.x - d.x, player.y - d.y);
          if (con > 70) o.dis.push({ map:id, seed, k:d.k, ten:String(d.ten), x:Math.round(d.x), y:Math.round(d.y), con:Math.round(con) });
        }
      }
    }
    return o;
  }, SEEDS);

  console.log('phong ấn:', JSON.stringify(r.seal));
  console.log('số đá mép vùng chặn:', JSON.stringify(r.rim));
  console.log(`đi thử ${r.tong} tuyến · hỏng ${r.dis.length}`);
  for (const d of r.dis.slice(0, 20)) console.log(`   ✗ ${d.map} seed${d.seed} ${d.k} ${d.ten} (${d.x},${d.y}) còn cách ${d.con}px`);

  for (const [id, s] of Object.entries(r.seal)){
    if (s.khoa !== s.tong) fail(`${id}: chưa hạ trụ nào mà phong ấn báo còn ${s.khoa}/${s.tong}`);
    if (!s.moRoi) fail(`${id}: hạ đủ Vệ Binh Trụ rồi mà phong ấn vẫn khoá`);
  }
  if (!bad) pass(`${Object.keys(r.seal).length} map: phong ấn Cổng Vực vẽ được khi khoá, tắt khi hạ đủ 3 Trụ`);
  const trong = Object.entries(r.rim).filter(([, n]) => n < 8);
  if (trong.length) fail('map không có vật nào đánh dấu mép vùng chặn: ' + trong.map(([k, n]) => `${k}=${n}`).join(', '));
  else pass('cả 8 map thường đều có hàng đá dọc mép vùng chặn (' + Object.values(r.rim).join('/') + ' viên)');
  if (r.dis.length) fail(`${r.dis.length}/${r.tong} tuyến đi thử không tới nơi`);
  else pass(`${r.tong} tuyến đi thử (boss · bãi quái · NPC, ${SEEDS} lượt rải decor mỗi map) đều tới được`);

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) bad++;
  console.log(bad ? `FAIL(${bad})` : 'PASS');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
