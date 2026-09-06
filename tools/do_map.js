// THƯỚC ĐO BẢN ĐỒ — bước 1 của docs/KE_HOACH_DO_MAP.md
//
//   node tools/do_map.js [cổng]      (chạy TỪ NGOÀI repo — xem CLAUDE.md · Test)
//
// Vì sao có tệp này: bảy phó bản cũ hỏng không phải vì xấu mà vì KHÔNG AI ĐO chúng — cả bảy
// trùng khít từng con số. Trước khi dựng lại tầng map, phải có cái cân đã; không thì ba tháng
// nữa lại ngồi đếm xem hỏng ở đâu.
//
// Đo bằng chính lưới tìm đường của game (_navGrid · NAV_CELL · inObstacle), không phải bằng
// một mô hình riêng — số đo mà lệch với thứ game thực thi thì đo để làm gì.
//
// Ghi ra docs/DO_MAP_HIEN_TRANG.md. Đó là MỐC SO: map dựng lại phải đối chiếu với nó.
const { chromium } = require('playwright');
const fs = require('fs');

const PORT = process.argv[2] || '8853';
const RA = process.argv[3] || 'docs/DO_MAP_HIEN_TRANG.md';

function doTrongTrang(){
  // ── tiện ích lưới ───────────────────────────────────────────────────────────
  navEnsure();
  const W = _navW, H = _navH, N = W * H, C = NAV_CELL;
  const thoang = i => !_navGrid[i];
  const oCua = (x, y) => {
    const gx = Math.min(W - 1, Math.max(0, Math.floor(x / C)));
    const gy = Math.min(H - 1, Math.max(0, Math.floor(y / C)));
    return navFreeCell(gx, gy);
  };
  // BFS 8 hướng, trả mảng bước (số ô) từ một ô nguồn. chan = tập ô bị cấm đi qua.
  const buoc = (nguon, chan) => {
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
        if (d[ni] !== -1 || _navGrid[ni] || (chan && chan.has(ni))) continue;
        if (dx && dy && (_navGrid[cy * W + nx] || _navGrid[ny * W + cx])) continue;
        d[ni] = d[c] + 1; q[t++] = ni;
      }
    }
    return d;
  };

  const ra = {};
  for (const id of Object.keys(MAPS).filter(k => !MAPS[k].dungeon)){
    curMap = id; navInvalidate(); buildWorld(); navEnsure();
    const M = MAPS[id];

    // ── điểm nội dung: thứ người chơi thật sự đi tới ──────────────────────────
    const diem = [];
    for (const p of (M.packs || [])) diem.push({ k:'bãi quái', ten:p.mob, x:p.x, y:p.y });
    for (const n of NPCS.filter(n => n.map === id)) diem.push({ k:'NPC', ten:n.name, x:n.x, y:n.y });
    for (const h of (HERB_SPOTS[id] || [])) diem.push({ k:'thảo dược', ten:'', x:h.x, y:h.y });
    const bd = BOSS_DEFS[id];
    if (bd){
      for (const t of (bd.thuve || [])) diem.push({ k:'boss', ten:t.name, x:t.x*MAP.w, y:t.y*MAP.h });
      if (bd.tranai) diem.push({ k:'boss', ten:bd.tranai.name, x:bd.tranai.x*MAP.w, y:bd.tranai.y*MAP.h });
    }
    for (const g of GATES.filter(g => g.map === id)) diem.push({ k:'cổng', ten:g.name, x:g.x, y:g.y });

    // ── 1. diện tích đi được ──────────────────────────────────────────────────
    let oThoang = 0;
    for (let i = 0; i < N; i++) if (thoang(i)) oThoang++;

    // ── 2. tỉ lệ HÀNH LANG: ô thoáng mà chỉ có ≤2 hàng xóm trực giao thoáng ───
    // Đây là chỗ tách "cánh đồng" khỏi "ống nước". RO nhiều đồng, hành lang thì không.
    let hanhLang = 0;
    for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++){
      const i = gy * W + gx; if (!thoang(i)) continue;
      let n = 0;
      if (gx > 0     && thoang(i - 1)) n++;
      if (gx < W - 1 && thoang(i + 1)) n++;
      if (gy > 0     && thoang(i - W)) n++;
      if (gy < H - 1 && thoang(i + W)) n++;
      if (n <= 2) hanhLang++;
    }

    // ── 3. số loài ────────────────────────────────────────────────────────────
    const loai = [...new Set((M.packs || []).map(p => p.mob))];

    // ── 4-5. đường kính đi bộ & bước giữa hai điểm kề ─────────────────────────
    const oDiem = diem.map(d => oCua(d.x, d.y));
    let duongKinh = 0, capXa = null;
    const ganNhat = [];
    const khongToi = [];
    for (let a = 0; a < oDiem.length; a++){
      if (oDiem[a] < 0){ khongToi.push(diem[a]); continue; }
      const d = buoc(oDiem[a], null);
      let min = Infinity;
      for (let b = 0; b < oDiem.length; b++){
        if (a === b || oDiem[b] < 0) continue;
        const s = d[oDiem[b]];
        if (s < 0){ khongToi.push(diem[b]); continue; }
        if (s > duongKinh){ duongKinh = s; capXa = [diem[a], diem[b]]; }
        if (s < min) min = s;
      }
      if (min < Infinity) ganNhat.push(min);
    }
    ganNhat.sort((x, y) => x - y);
    const trungVi = ganNhat.length ? ganNhat[Math.floor(ganNhat.length / 2)] : 0;

    // ── 6. TUYẾN THAY THẾ: bịt đường ngắn nhất rồi hỏi lại có tới được không ──
    // Có = map có vòng, đi về không phải lộn lại đường cũ. Không = ống nước một chiều.
    let vong = null;
    if (capXa){
      const s = oCua(capXa[0].x, capXa[0].y), t = oCua(capXa[1].x, capXa[1].y);
      // dựng lại đường ngắn nhất bằng cách lần ngược theo bậc BFS
      const dS = buoc(s, null);
      const chan = new Set();
      let c = t;
      while (c !== s && dS[c] > 0){
        const cx = c % W, cy = (c - cx) / W;
        let ke = -1;
        for (let dy = -1; dy <= 1 && ke < 0; dy++) for (let dx = -1; dx <= 1; dx++){
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = ny * W + nx;
          if (dS[ni] === dS[c] - 1){ ke = ni; break; }
        }
        if (ke < 0) break;
        if (c !== t) chan.add(c);       // giữ hai đầu, chỉ bịt khúc giữa
        c = ke;
      }
      const d2 = buoc(s, chan);
      vong = d2[t] >= 0;
    }

    ra[id] = {
      ten: M.name, min: M.min, loai: M.type,
      oThoang, tiLeThoang: +(100 * oThoang / N).toFixed(1),
      soDiem: diem.length,
      matDo: +(1000 * diem.length / Math.max(oThoang, 1)).toFixed(2),
      soLoai: loai.length, loaiTen: loai,
      tiLeHanhLang: +(100 * hanhLang / Math.max(oThoang, 1)).toFixed(1),
      duongKinhPx: Math.round(duongKinh * NAV_CELL),
      keNhauPx: Math.round(trungVi * NAV_CELL),
      capXa: capXa ? [capXa[0].ten || capXa[0].k, capXa[1].ten || capXa[1].k] : null,
      coVong: vong,
      khongToi: [...new Set(khongToi.map(d => `${d.k} ${d.ten}`))],
    };
  }
  return { o: ra, khoMap: { w: MAP.w, h: MAP.h }, oLuoi: NAV_CELL };
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const loi = [];
  p.on('pageerror', e => loi.push(String(e).split('\n')[0]));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(doTrongTrang);
  await b.close();
  if (loi.length){ console.error('LỖI TRANG:', loi.join(' | ')); process.exit(1); }

  const M = r.o, ids = Object.keys(M);
  const num = k => ids.map(i => M[i][k]);
  const tb = k => (num(k).reduce((a, x) => a + x, 0) / ids.length).toFixed(1);

  let s = `# Đo bản đồ — hiện trạng\n\n`;
  s += `> Sinh bằng \`tools/do_map.js\`. **ĐỪNG SỬA TAY** — chạy lại tệp đó.\n`;
  s += `> Đo bằng chính lưới tìm đường của game (ô ${r.oLuoi}px trên khổ ${r.khoMap.w}×${r.khoMap.h}),\n`;
  s += `> nên số ở đây là thứ game THỰC THI, không phải một mô hình riêng.\n`;
  s += `> Đây là **mốc so** cho bước 3 của \`docs/KE_HOACH_DO_MAP.md\`.\n\n`;
  s += `## Bảng số\n\n`;
  s += `| Map | Cấp | Đi được | Điểm nội dung | Mật độ | Loài | Hành lang | Đường kính | Điểm kề | Có vòng |\n`;
  s += `|---|--:|--:|--:|--:|--:|--:|--:|--:|:-:|\n`;
  for (const i of ids){
    const m = M[i];
    s += `| **${m.ten}**<br>\`${i}\` | ${m.min} | ${m.tiLeThoang}% | ${m.soDiem} | ${m.matDo} | ${m.soLoai} | ${m.tiLeHanhLang}% | ${m.duongKinhPx}px | ${m.keNhauPx}px | ${m.coVong === null ? '—' : m.coVong ? '✅' : '❌'} |\n`;
  }
  s += `\n**Trung bình:** đi được ${tb('tiLeThoang')}% · mật độ ${tb('matDo')} · loài ${tb('soLoai')} · hành lang ${tb('tiLeHanhLang')}% · đường kính ${tb('duongKinhPx')}px · điểm kề ${tb('keNhauPx')}px\n\n`;

  s += `## Từng cột nói gì\n\n`;
  s += `| Cột | Nghĩa | Đọc thế nào |\n|---|---|---|\n`;
  s += `| **Đi được** | % ô lưới không bị vật cản | thấp = vật cản ăn mất map |\n`;
  s += `| **Điểm nội dung** | bãi quái + NPC + thảo dược + boss + cổng | thứ người chơi thật sự đi tới |\n`;
  s += `| **Mật độ** | điểm nội dung trên 1000 ô đi được | thấp = map rỗng, đọc ra là map to |\n`;
  s += `| **Loài** | số loài quái khác nhau trong \`packs\` | **đây là chỉ số đang tụt khi lên cấp** |\n`;
  s += `| **Hành lang** | % ô thoáng chỉ có ≤2 hàng xóm trực giao thoáng | cao = ống nước · thấp = cánh đồng |\n`;
  s += `| **Đường kính** | quãng đi bộ xa nhất giữa hai điểm nội dung | thời gian đi bộ tệ nhất |\n`;
  s += `| **Điểm kề** | trung vị quãng từ một điểm tới điểm gần nó nhất | nhịp giữa hai lần đánh |\n`;
  s += `| **Có vòng** | bịt đường ngắn nhất rồi vẫn tới được? | ✅ = đi về không phải lộn lại đường cũ |\n`;

  // ── Đọc ra gì: để MÁY rút, không để người nhớ ──────────────────────────────
  // Số đo mà không kèm kết luận thì lần sau lại phải ngồi đọc lại từ đầu.
  const theoCap = ids.filter(i => M[i].soLoai > 0).sort((a, c) => M[a].min - M[c].min);
  const dau = theoCap[0], cuoi = theoCap[theoCap.length - 1];
  const hlMax = Math.max(...num('tiLeHanhLang'));
  s += `\n## Đọc ra gì\n\n`;
  s += `**1. Càng lên cấp, thế giới càng nghèo đi.**\n\n`;
  s += `Số loài theo cấp: ` + theoCap.map(i => `${M[i].min}→**${M[i].soLoai}**`).join(' · ') + `\n\n`;
  s += `Từ \`${dau}\` (cấp ${M[dau].min}) tới \`${cuoi}\` (cấp ${M[cuoi].min}): loài **${M[dau].soLoai} → ${M[cuoi].soLoai}**, `;
  s += `điểm nội dung **${M[dau].soDiem} → ${M[cuoi].soDiem}**, mật độ **${M[dau].matDo} → ${M[cuoi].matDo}** `;
  s += `(${Math.round(100 * (M[cuoi].matDo - M[dau].matDo) / M[dau].matDo)}%).\n`;
  s += `Người chơi càng chơi lâu càng nhận được ÍT hơn — đúng chiều ngược với mọi game cày.\n\n`;
  s += `**2. Không map nào có HÌNH.**\n\n`;
  s += `Tỉ lệ hành lang cao nhất trong ${ids.length} map là **${hlMax}%**. Nghĩa là gần như toàn bộ diện tích `;
  s += `đi được là bãi trống liền một khối: không phòng, không lối hẹp, không chỗ nào bắt phải chọn đường. `;
  s += `Cột "Có vòng" toàn ✅ nhưng **không nói lên gì** — trên một bãi trống thì đi hướng nào cũng tới. `;
  s += `Đây mới là chỗ khác Ragnarok và Path of Exile, không phải kích thước map.\n\n`;
  s += `**3. Đường kính ~${tb('duongKinhPx')}px trên khổ ${r.khoMap.w}×${r.khoMap.h}.**\n\n`;
  s += `Tức là hai điểm xa nhau nhất gần bằng cả đường chéo map — nội dung bị rải ra tận bốn mép `;
  s += `thay vì gom thành cụm. Cộng với mục 2 (không có hình), quãng đường đó là đi bộ suông.\n\n`;
  s += `**4. Nhịp đánh thưa dần đúng lúc nội dung nghèo đi.**\n\n`;
  s += `Quãng tới điểm gần nhất: ` + theoCap.map(i => `${M[i].min}→**${M[i].keNhauPx}px**`).join(' · ') + `\n\n`;
  s += `Từ \`${dau}\` tới \`${cuoi}\`, quãng đi bộ giữa hai lần đánh tăng **${M[dau].keNhauPx} → ${M[cuoi].keNhauPx}px** `;
  s += `(+${Math.round(100 * (M[cuoi].keNhauPx - M[dau].keNhauPx) / Math.max(M[dau].keNhauPx, 1))}%). `;
  s += `Cộng dồn với mục 1: ít loài hơn, ít điểm hơn, mà lại phải đi xa hơn giữa hai lần đánh.\n\n`;
  s += `\n## Chi tiết từng map\n\n`;
  for (const i of ids){
    const m = M[i];
    s += `### ${m.ten} \`${i}\` — cấp ${m.min}+ · ${m.loai}\n\n`;
    s += `- Loài (${m.soLoai}): ${m.loaiTen.length ? m.loaiTen.join(' · ') : '_không có bãi quái_'}\n`;
    s += `- Hai điểm xa nhau nhất: ${m.capXa ? `${m.capXa[0]} ↔ ${m.capXa[1]} — ${m.duongKinhPx}px` : '—'}\n`;
    if (m.khongToi.length) s += `- ⚠ **ĐI KHÔNG TỚI**: ${m.khongToi.join(' · ')}\n`;
    s += `\n`;
  }
  fs.writeFileSync(RA, s);
  console.log(`ghi ${RA} · ${ids.length} map`);
  for (const i of ids){
    const m = M[i];
    console.log(`  ${i.padEnd(11)} loài ${String(m.soLoai).padStart(2)} · điểm ${String(m.soDiem).padStart(2)} · mật độ ${String(m.matDo).padStart(5)} · hành lang ${String(m.tiLeHanhLang).padStart(4)}% · kính ${String(m.duongKinhPx).padStart(4)}px · vòng ${m.coVong ? 'có' : 'KHÔNG'}`);
  }
})();
