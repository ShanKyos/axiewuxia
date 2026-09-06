// CHỐT SỐ ĐO BẢN ĐỒ — bạn đồng hành của tools/do_map.js.
//
// Thước đo ghi ra docs/DO_MAP_HIEN_TRANG.md, nhưng một tài liệu thì không chặn được ai. Bài này
// chốt các ngưỡng thành BÁNH CÓC: map dựng lại chỉ được tốt lên, không được tệ đi.
//
// Ngưỡng dưới đây lấy từ chính hiện trạng đo ngày gỡ bảy phó bản, đã trừ biên an toàn. Chúng
// KHÔNG phải mục tiêu — hiện trạng đang là cái bệnh. Mục tiêu nằm ở docs/KE_HOACH_DO_MAP.md
// bước 2, sẽ siết ngưỡng lên khi máy sinh địa hình (bước 3) chạy.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

const SAN = {
  loai:      3,      // loài quái mỗi map có bãi quái — hiện thấp nhất đúng 3
  matDo:     1.30,   // điểm nội dung / 1000 ô đi được — hiện thấp nhất 1.39
  diemMap:  10,      // điểm nội dung mỗi map — hiện thấp nhất 11
  thoang:   55,      // % ô lưới đi được — hiện thấp nhất 60,7% (comoc). Sàn này ĐO ĐƯỢC chứ
                     // không phải đoán: bản đầu tôi đặt 80 theo cảm giác và nó bắt vạ 5/8 map.
};
const TRAN = {
  duongKinh: 2600,   // px đi bộ giữa hai điểm xa nhau nhất — hiện cao nhất 2352
  keNhau:     700,   // px trung vị tới điểm gần nhất — nhịp giữa hai lần đánh
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(600);

  const r = await p.evaluate(() => {
    navEnsure();
    const W = _navW, H = _navH, N = W * H, C = NAV_CELL;
    const oCua = (x, y) => navFreeCell(
      Math.min(W - 1, Math.max(0, Math.floor(x / C))),
      Math.min(H - 1, Math.max(0, Math.floor(y / C))));
    const buoc = (nguon) => {
      const d = new Int32Array(N).fill(-1);
      if (nguon < 0) return d;
      const q = new Int32Array(N); let h = 0, t = 0;
      q[t++] = nguon; d[nguon] = 0;
      while (h < t){
        const c = q[h++], cx = c % W, cy = (c - cx) / W;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = ny * W + nx;
          if (d[ni] !== -1 || _navGrid[ni]) continue;
          if (dx && dy && (_navGrid[cy * W + nx] || _navGrid[ny * W + cx])) continue;
          d[ni] = d[c] + 1; q[t++] = ni;
        }
      }
      return d;
    };
    const o = {};
    for (const id of Object.keys(MAPS).filter(k => !MAPS[k].dungeon)){
      curMap = id; navInvalidate(); buildWorld(); navEnsure();
      const M = MAPS[id], diem = [];
      for (const q of (M.packs || [])) diem.push({ k:'bãi quái', ten:q.mob, x:q.x, y:q.y });
      for (const n of NPCS.filter(n => n.map === id)) diem.push({ k:'NPC', ten:n.name, x:n.x, y:n.y });
      for (const h of (HERB_SPOTS[id] || [])) diem.push({ k:'thảo dược', ten:'', x:h.x, y:h.y });
      const bd = BOSS_DEFS[id];
      if (bd){
        for (const t of (bd.thuve || [])) diem.push({ k:'boss', ten:t.name, x:t.x*MAP.w, y:t.y*MAP.h });
        if (bd.tranai) diem.push({ k:'boss', ten:bd.tranai.name, x:bd.tranai.x*MAP.w, y:bd.tranai.y*MAP.h });
      }
      for (const g of GATES.filter(g => g.map === id)) diem.push({ k:'cổng', ten:g.name, x:g.x, y:g.y });

      let thoang = 0; for (let i = 0; i < N; i++) if (!_navGrid[i]) thoang++;
      const oDiem = diem.map(d => oCua(d.x, d.y));
      let kinh = 0; const gan = []; const hong = [];
      for (let a = 0; a < oDiem.length; a++){
        if (oDiem[a] < 0){ hong.push(`${diem[a].k} ${diem[a].ten}`); continue; }
        const d = buoc(oDiem[a]); let min = Infinity;
        for (let c = 0; c < oDiem.length; c++){
          if (a === c || oDiem[c] < 0) continue;
          const s = d[oDiem[c]];
          if (s < 0){ hong.push(`${diem[c].k} ${diem[c].ten}`); continue; }
          if (s > kinh) kinh = s;
          if (s < min) min = s;
        }
        if (min < Infinity) gan.push(min);
      }
      gan.sort((x, y) => x - y);
      o[id] = {
        min: M.min,
        soLoai: new Set((M.packs || []).map(q => q.mob)).size,
        soDiem: diem.length,
        thoang: +(100 * thoang / N).toFixed(1),
        matDo: +(1000 * diem.length / Math.max(thoang, 1)).toFixed(2),
        duongKinh: Math.round(kinh * C),
        keNhau: gan.length ? Math.round(gan[Math.floor(gan.length / 2)] * C) : 0,
        hong: [...new Set(hong)],
      };
    }
    return o;
  });
  await b.close();

  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  console.log(JSON.stringify(r, null, 1));
  const ids = Object.keys(r);
  if (ids.length < 5) fail(`chỉ đo được ${ids.length} map — phép đo rỗng`);

  for (const id of ids){
    const m = r[id];
    if (m.hong.length) fail(`${id}: đi không tới ${m.hong.join(', ')}`);
    // Map KHÔNG có bãi quái là thành, và tường thành LÀ thiết kế — 49% đi được ở Lunaris City
    // là đúng chứ không phải lỗi. Sàn này để bắt BÃI SĂN bị vật cản ăn mất, nên miễn cho thành.
    // (Nhận diện bằng "không có bãi quái" chứ không bằng cờ village: cờ đó nằm ở daohoa.)
    if (m.soLoai > 0 && m.thoang < SAN.thoang) fail(`${id}: chỉ ${m.thoang}% map đi được (sàn ${SAN.thoang}%) — vật cản ăn mất map`);
    if (m.soDiem < SAN.diemMap) fail(`${id}: chỉ ${m.soDiem} điểm nội dung (sàn ${SAN.diemMap})`);
    if (m.matDo < SAN.matDo) fail(`${id}: mật độ ${m.matDo} (sàn ${SAN.matDo}) — map rỗng`);
    if (m.duongKinh > TRAN.duongKinh) fail(`${id}: đường kính ${m.duongKinh}px (trần ${TRAN.duongKinh}) — đi bộ suông`);
    if (m.keNhau > TRAN.keNhau) fail(`${id}: điểm kề ${m.keNhau}px (trần ${TRAN.keNhau}) — nhịp đánh thưa`);
    // Map không có bãi quái nào (thành) thì không xét số loài.
    if (m.soLoai > 0 && m.soLoai < SAN.loai) fail(`${id}: chỉ ${m.soLoai} loài (sàn ${SAN.loai})`);
  }
  if (!bad) pass(`${ids.length} map đều qua bánh cóc: loài ≥${SAN.loai} · mật độ ≥${SAN.matDo} · đi được ≥${SAN.thoang}% · kính ≤${TRAN.duongKinh}px`);

  // ── BÁNH CÓC THEO TỪNG MAP ────────────────────────────────────────────────
  // Đây mới là chỗ đo cái bệnh chính: số loài TỤT khi lên cấp (7 xuống 3). Hiện trạng đang
  // SAI, nên mốc dưới đây không phải mục tiêu — nó chỉ chặn "tệ thêm". Khi máy sinh địa hình
  // (KE_HOACH_DO_MAP bước 3) nâng được map nào thì NÂNG MỐC map đó lên, đừng để nguyên.
  const MOC_LOAI = { daohoa:7, ngoai:6, chungnam:4, comoc:3, tuyettinh:3, mongco:3, nhanmon:3 };
  for (const id in MOC_LOAI){
    if (!r[id]) { fail(`mất map ${id} khỏi phép đo`); continue; }
    if (r[id].soLoai < MOC_LOAI[id])
      fail(`${id}: loài tụt ${MOC_LOAI[id]} → ${r[id].soLoai} — bánh cóc chỉ quay một chiều`);
  }
  if (!bad) pass('không map nào tụt loài so với mốc ngày gỡ bảy phó bản');

  // Thang cấp, in ra để nhìn thấy cái bệnh mỗi lần chạy chứ không phải mở tài liệu mới thấy.
  const thang = ids.filter(i => r[i].soLoai > 0).sort((a, c) => r[a].min - r[c].min);
  console.log('thang loài theo cấp: ' + thang.map(i => `${r[i].min}→${r[i].soLoai}`).join(' · '));
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
