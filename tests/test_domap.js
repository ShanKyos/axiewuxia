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
  thoangLan: 25,     // riêng map dạng LÀN — xem chỗ dùng. Lối Mòn Corran đo được 36,2%.
  thoang:   55,      // % ô lưới đi được — hiện thấp nhất 60,7% (comoc). Sàn này ĐO ĐƯỢC chứ
                     // không phải đoán: bản đầu tôi đặt 80 theo cảm giác và nó bắt vạ 5/8 map.
};
// ⚠ VẬT CHE — SÀN NÀY ĐÃ TỤT, VÀ ĐÓ LÀ MỘT VIỆC CÒN NỢ, KHÔNG PHẢI MỘT KẾT QUẢ.
// Sàn cũ là 18%, chốt khi còn bộ trụ đá (trung bình 44,8%). Trụ đá đã bị GỠ vì nó chỉ là sprite
// đá phóng to ~3 lần, nhìn xấu và chọi với nền tranh — chủ dự án xem ảnh chụp rồi yêu cầu bỏ.
// Gỡ xong thì trung bình tụt 44,8% → 30,0% (phần lớn map vẫn còn địa hình), nhưng thiệt hại
// dồn vào MỘT chỗ: Reptile Sunstone Flats — map trống nhất, 90,9% đi được — tụt còn 9,1%.
//
// Sàn 8 dưới đây KHÔNG phải là "đạt". Nó là bánh cóc giữ cho đừng tụt tiếp, trong lúc chờ
// TRANH RIÊNG cho khối đá cỡ lớn. Khi có tranh thật thì kéo sàn này về ≥18 và xoá đoạn ghi chú
// này. ĐỪNG hạ nó thêm lần nữa để cho bài kiểm xanh.
const SAN_CHE = 8;
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
    // ⚠ Khổ lưới KHÔNG được chốt một lần ở đây. Bản đầu lấy `_navW/_navH` của map đang đứng lúc
    // vào bài rồi dùng cho cả vòng lặp — hồi đó đúng, vì mọi map chung một khổ 2600x1900. Từ khi
    // có map khổ riêng (Lối Mòn Corran 6400x1400) thì nó sai im lặng: mỗi map dựng lưới của
    // riêng nó, còn W/H/N vẫn là số cũ, nên mọi điểm nội dung ở x > 2400 bị đọc lệch chỉ số và
    // bài báo "đi không tới" cho những chỗ thật ra đi tới thoải mái.
    let W = _navW, H = _navH, N = W * H;
    const C = NAV_CELL;
    const doLaiKhungLuoi = () => { W = _navW; H = _navH; N = W * H; };
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
      curMap = id; navInvalidate(); buildWorld(); navEnsure(); doLaiKhungLuoi();
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
      // vật che: khối ĐỦ LỚN (≥0,40 lần chiều cao nhân vật) trong tầm 120px
      const NHO = 0.40 * NV_CAO;
      const lon = obstaclesOf(id).filter(o => {
        const w = o.wd ? Math.min(o.wd, o.ht) : 2*Math.min(o.rx, o.ry); return w >= NHO; });
      const gL = new Uint8Array(N);
      for (let gy=0; gy<H; gy++) for (let gx=0; gx<W; gx++){
        const x=gx*C+C/2, y=gy*C+C/2;
        for (const o of lon){
          if (o.wd){ const qx=Math.max(o.x,Math.min(x,o.x+o.wd)), qy=Math.max(o.y,Math.min(y,o.y+o.ht));
                     if ((x-qx)**2+(y-qy)**2 < 256){ gL[gy*W+gx]=1; break; } }
          else { const dx=(x-o.x)/(o.rx+16), dy=(y-o.y)/(o.ry+16); if (dx*dx+dy*dy<1){ gL[gy*W+gx]=1; break; } } } }
      let che=0, trong=0;
      { const R=Math.round(120/C), dd=new Int32Array(N).fill(-1), qq=new Int32Array(N); let a=0,z=0;
        for (let i=0;i<N;i++) if (gL[i]){ dd[i]=0; qq[z++]=i; }
        while(a<z){ const c0=qq[a++],cx=c0%W,cy=(c0-cx)/W;
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy)continue;
            const nx=cx+dx,ny=cy+dy; if(nx<0||ny<0||nx>=W||ny>=H)continue;
            const ni=ny*W+nx; if(dd[ni]>=0)continue; dd[ni]=dd[c0]+1; qq[z++]=ni; } }
        for(let i=0;i<N;i++){ if(gL[i]||_navGrid[i])continue; trong++; if(dd[i]>=0&&dd[i]<=R) che++; } }
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
        che: +(100*che/Math.max(trong,1)).toFixed(1),
        soTru: decor.filter(d => d.tru).length,
        hinh: M.hinh || 'dongtrong',
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
    // Map KHÔNG có bãi quái là thành, và tường thành LÀ thiết kế — 49% đi được ở Sapidae Chiefdom
    // là đúng chứ không phải lỗi. Sàn này để bắt BÃI SĂN bị vật cản ăn mất, nên miễn cho thành.
    // (Nhận diện bằng "không có bãi quái" chứ không bằng cờ village: cờ đó nằm ở daohoa.)
    // Sàn "đi được ≥55%" đo trên map ĐỒNG TRỐNG. Map dạng LÀN (`hinh:'hanhlang'`) cố ý chỉ có
    // ~34% — đó là định nghĩa của hành lang, không phải vật cản ăn mất map. Bề ngang làn do
    // `test_sandat` gác (nó đo chỗ thắt nhất); ở đây chỉ cần chắc làn không hẹp tới mức không
    // còn cõng nổi bãi quái, nên hạ sàn xuống một mức riêng thay vì bỏ hẳn phép đo.
    const sanThoang = m.hinh === 'hanhlang' ? SAN.thoangLan : SAN.thoang;
    if (m.soLoai > 0 && m.thoang < sanThoang) fail(`${id}: chỉ ${m.thoang}% map đi được (sàn ${sanThoang}%) — vật cản ăn mất map`);
    if (m.soDiem < SAN.diemMap) fail(`${id}: chỉ ${m.soDiem} điểm nội dung (sàn ${SAN.diemMap})`);
    if (m.matDo < SAN.matDo) fail(`${id}: mật độ ${m.matDo} (sàn ${SAN.matDo}) — map rỗng`);
    // Trần ĐƯỜNG KÍNH hỏi "map có to tới mức đi bộ suông không" và chốt ở 2600 — đúng bằng bề
    // ngang map hồi cả game chung một khổ. Map dạng LÀN dài 6400 nên đường kính của nó BẰNG chiều
    // dài, và chiều dài chính là thứ được đặt hàng ("đi qua một đường chỉ định để tới cuối map").
    // Thứ thật sự cần canh là NHỊP — khoảng cách giữa hai điểm nội dung KỀ NHAU — và `keNhau`
    // ngay dưới đã canh đúng thứ đó cho mọi hình dạng map.
    if (m.hinh !== 'hanhlang' && m.duongKinh > TRAN.duongKinh) fail(`${id}: đường kính ${m.duongKinh}px (trần ${TRAN.duongKinh}) — đi bộ suông`);
    if (m.keNhau > TRAN.keNhau) fail(`${id}: điểm kề ${m.keNhau}px (trần ${TRAN.keNhau}) — nhịp đánh thưa`);
    // Map không có bãi quái nào (thành) thì không xét số loài.
    if (m.soLoai > 0 && m.soLoai < SAN.loai) fail(`${id}: chỉ ${m.soLoai} loài (sàn ${SAN.loai})`);
    // Chỉ map có bãi quái mới cần địa hình đánh nhau — thành thì không.
    if (m.soLoai > 0 && m.che < SAN_CHE) fail(`${id}: vật che ${m.che}% (sàn ${SAN_CHE}%) — không có địa hình cỡ trận đánh`);
  }
  if (!bad) pass(`${ids.length} map đều qua bánh cóc: loài ≥${SAN.loai} · mật độ ≥${SAN.matDo} · đi được ≥${SAN.thoang}% · vật che ≥${SAN_CHE}% (sàn TẠM, xem ghi chú) · kính ≤${TRAN.duongKinh}px`);

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
  console.log('vật che theo cấp:   ' + thang.map(i => `${r[i].min}→${r[i].che}%`).join(' · '));
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
