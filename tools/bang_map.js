// BẢNG MAP — thống kê từng map, xếp theo DẢI CẤP và theo VAI TRÒ trong chính tuyến.
//
//   node tools/bang_map.js [cổng]        (mặc định 8853; chạy từ ngoài repo — xem CLAUDE.md · Test)
//
// Vì sao có tệp này chứ không chép bảng vào tài liệu: `docs/DO_MAP_HIEN_TRANG.md` là MỐC SO đóng
// băng của một đợt đo cũ (nó còn liệt `tuongduong` và tên "Petalshade" đã bỏ) — cố ý giữ nguyên
// làm mốc. Cái đang thiếu là bảng HIỆN TRẠNG, mà bảng hiện trạng chép tay thì chỉ đúng tới lần
// sửa `vung` kế tiếp. Đây là cùng một luật đã áp cho `mapBanSac()`: suy từ dữ liệu, đừng chép cứng.
//
// Số đọc từ GAME ĐANG CHẠY (`packsOf`, `_navGrid`, `mapBanSac`), không từ một mô hình riêng —
// nên nó là thứ người chơi thật sự gặp.
const { chromium } = require('playwright');
const fs = require('fs');
const PORT = process.argv[2] || '8853';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(700);

  const R = await p.evaluate(() => {
    const out = [];
    // Dòng Cốt và Trụ Khoá tra NGƯỢC từ chính bảng của chúng — hai hệ này khai theo map, nên
    // đọc xuôi là chắc chắn khớp với thứ game chạy.
    const cot = {}; for (const k in COT_DONG) cot[COT_DONG[k].map] = COT_DONG[k].ten;
    for (const id of Object.keys(MAPS)){
      const md = MAPS[id], bd = BOSS_DEFS[id] || {};
      curMap = id; navInvalidate(); buildWorld(); navEnsure();
      const ps = packsOf(id);
      let san = 0; const N = _navW * _navH;
      for (let i = 0; i < N; i++) if (!_navGrid[i]) san++;
      const bs = mapBanSac(id);
      out.push({
        id, ten: md.name, range: md.range, min: md.min, type: md.type,
        w: md.w || 2600, h: md.h || 1900, iso: !!md.sanIso, hinh: md.hinh || 'dongtrong',
        san: +(100 * san / N).toFixed(1),
        mien: (md.vung || []).length, bai: ps.length,
        loai: new Set(ps.map(q => q.mob)).size, quai: mobs.length,
        thuoc: (HERB_SPOTS[id] || []).length, npc: NPCS.filter(n => n.map === id).length,
        tru: TRU_KHOA[id] || '', cot: cot[id] || '',
        tranai: bd.tranai ? bd.tranai.name : '', veTru: (bd.thuve || []).length,
        he: bs ? bs.he : '', chuDao: bs ? bs.tenChuDao : '',
        cong: GATES.filter(g => g.map === id && g.to).map(g => ({ to: g.to, ten: g.name })),
        dungeon: !!md.dungeon,
      });
    }
    return out;
  });
  await b.close();

  const lv = r => (r.range && r.range !== '—') ? r.range.split('-').map(s => +s.trim()) : null;
  R.sort((a, c) => { const x = lv(a), y = lv(c);
    return (x ? x[0] : 9999) - (y ? y[0] : 9999) || a.min - c.min; });

  const LOAI = { safe:'An Toàn', pk:'PK', freepk:'Free PK', dungeon:'Phó Bản' };
  const L = [];
  L.push('# Bảng map — hiện trạng', '');
  L.push('> Sinh bằng `tools/bang_map.js`. **ĐỪNG SỬA TAY** — chạy lại tệp đó.');
  L.push('> Số đọc từ GAME ĐANG CHẠY (`packsOf` · `_navGrid` · `mapBanSac`), nên đây là thứ người');
  L.push('> chơi thật sự gặp. Khác `docs/DO_MAP_HIEN_TRANG.md`: tệp ấy là MỐC SO đóng băng của một');
  L.push('> đợt đo cũ và cố ý không cập nhật.', '');

  L.push('## 1. Xếp theo DẢI CẤP', '');
  L.push('| # | Map | Dải cấp | Mở ở | Loại | Khổ | Sàn | Miền | Bãi | Loài | Quái | Thuốc | NPC | Hệ trội |');
  L.push('|--:|---|---|--:|---|---|--:|--:|--:|--:|--:|--:|--:|---|');
  let i = 0;
  for (const r of R){
    if (!lv(r)) continue;
    L.push(`| ${++i} | **${r.ten}**<br>\`${r.id}\` | ${r.range} | ${r.min} | ${LOAI[r.type] || r.type} `
      + `| ${r.w}×${r.h} | ${r.san}% | ${r.mien} | ${r.bai} | ${r.loai} | ${r.quai} | ${r.thuoc} | ${r.npc} | ${r.he || '—'} |`);
  }
  L.push('');
  for (const r of R) if (!lv(r))
    L.push(`*Ngoài dải cấp:* **${r.ten}** \`${r.id}\` — ${LOAI[r.type] || r.type}, ${r.w}×${r.h}, `
      + `sàn ${r.san}%, ${r.npc} NPC.`);
  L.push('');

  // lỗ hổng dải cấp
  const cov = new Set();
  for (const r of R){ const x = lv(r); if (!x) continue; for (let k = x[0]; k <= x[1]; k++) cov.add(k); }
  const ho = []; let s = null;
  for (let k = 1; k <= 120; k++){
    if (!cov.has(k)){ if (s === null) s = k; }
    else if (s !== null){ ho.push(s === k-1 ? String(s) : `${s}-${k-1}`); s = null; }
  }
  if (s !== null) ho.push(`${s}-120`);
  L.push(`**Lỗ hổng dải cấp:** ${ho.length ? ho.join(' · ') : 'không có'}`, '');

  L.push('## 2. Xếp theo VAI TRÒ trong chính tuyến', '');
  L.push('Năm **Trụ Khoá** là xương sống cốt truyện; **Dòng Cốt** là thứ độc quyền khiến mỗi vùng');
  L.push('đáng cày (xem CLAUDE.md — người chơi chọn build bằng cách chọn nơi cày).', '');
  L.push('| Map | Dải cấp | Trụ Khoá | Dòng Cốt | Trấn Ải | Vệ Binh Trụ |');
  L.push('|---|---|---|---|---|--:|');
  for (const r of R){
    if (!r.tru && !r.cot && !r.tranai) continue;
    L.push(`| \`${r.id}\` | ${r.range} | ${r.tru || '—'} | ${r.cot || '—'} | ${r.tranai || '—'} | ${r.veTru} |`);
  }
  L.push('');
  const coTru = R.filter(r => r.tru).length;
  L.push(`**${coTru}/5 Trụ Khoá** có map. **${R.filter(r => r.cot).length} Dòng Cốt** đang có nơi rơi.`, '');

  L.push('## 3. Nối map — đồ thị đi bộ', '');
  L.push('```');
  for (const r of R){
    if (!r.cong.length) continue;
    L.push(`${r.id.padEnd(10)} → ${r.cong.map(c => c.to).join(', ')}`);
  }
  L.push('```', '');
  L.push('| Map | Lối ra |');
  L.push('|---|---|');
  for (const r of R){
    if (!r.cong.length) continue;
    L.push(`| \`${r.id}\` | ${r.cong.map(c => c.ten).join('<br>')} |`);
  }
  L.push('');
  L.push('## 4. Tổng', '');
  const t = (f) => R.reduce((a, r) => a + (r[f] || 0), 0);
  L.push(`- **${R.length} map**, ${R.filter(r => r.iso).length} lát viên isometric, `
    + `${R.filter(r => !r.iso).length} chưa.`);
  L.push(`- **${t('bai')} bãi quái** · ${t('quai')} con · ${t('thuoc')} chỗ hái thuốc · ${t('npc')} NPC.`);
  L.push(`- Sàn đi được: thấp nhất ${Math.min(...R.map(r => r.san))}%, cao nhất ${Math.max(...R.map(r => r.san))}%.`);
  const phang = R.filter(r => !r.iso).map(r => r.id);
  L.push(phang.length ? `- ⚠ **Còn dùng tranh nền phẳng:** ${phang.join(', ')}.`
                      : '- Không map nào còn dùng tranh nền phẳng kéo giãn.');
  fs.writeFileSync('docs/BANG_MAP.md', L.join('\n') + '\n');
  console.log(`docs/BANG_MAP.md — ${R.length} map`);
})();
