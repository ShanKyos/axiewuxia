// Đổ ra JSON mọi ĐIỂM NỘI DUNG của từng map, đọc từ GAME ĐANG CHẠY chứ không bới regex.
// (đuôi .cjs vì package.json của repo đặt "type": "module" — .js sẽ bị nạp như ESM và require chết)
//
// Vì sao không đọc canbang.js bằng regex: toạ độ trùm vùng khai theo TỈ LỆ trong BOSS_DEFS
// (nằm ở game.js), vùng dân số sinh bằng hàm lúc buildWorld, còn NPC thì nằm ở HAI chỗ
// (canbang.js khai 26 cái, game.js push thêm 12). Bới tay ba nguồn ấy là sai sót chờ sẵn.
// Mở game lên rồi hỏi thẳng thì nhận đúng cái mà người chơi gặp.
//
//   node tools/iso/lay_diem.js <cổng>   →  /tmp/iso/diem.json
const { chromium } = require('playwright');
const fs = require('fs');
const CONG = process.argv[2] || '8000';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:760} });
  const loi=[]; p.on('pageerror',e=>loi.push(String(e)));
  await p.goto(`http://localhost:${CONG}/index.html`);
  await p.waitForFunction(()=>window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  const ra = await p.evaluate(() => {
    startGame('thieulam', null);
    const o = {};
    for (const id of Object.keys(MAPS)){
      const M = MAPS[id];
      curMap = id; buildWorld();
      // Khổ THẬT nằm ở MAP (buildWorld vừa gán), không ở MAPS[id]: tám map chưa chuyển
      // không khai w/h nên chúng nhận khổ mặc định 2600x1900.
      const W = MAP.w, H = MAP.h;
      // [nhãn, x, y, bánKínhCấmĐặtLùm] — thứ BẮT BUỘC nằm trong sàn.
      //
      // ⚠ Con số thứ tư KHÔNG được chép tay sang Python. Nó phải là ĐÚNG bán kính raiCum()
      // dùng để loại tâm lùm, đọc ngay tại đây từ cùng một dữ liệu. Đã thử chép tay một bảng
      // hằng số và nó sai ngay: bán kính của bãi quái là `(q.r || 90) + 210`, mà `q.r` chạy
      // tới 122 — tức 332, không phải 300 như bảng chép. Hậu quả đo được: bộ sinh khai 9 lùm
      // cho Reptile Sunstone Flats, game MỌC 3, và ngân sách sàn thì tính trên cả 9.
      const diem = [];
      const them = (nhan,x,y,r) => { if (isFinite(x)&&isFinite(y)) diem.push([nhan, Math.round(x), Math.round(y), r]); };
      if (M.spawn) them('spawn', M.spawn.x, M.spawn.y, 260);
      for (const k of Object.keys(M.spawnFrom || {})) them('tu_'+k, M.spawnFrom[k].x, M.spawnFrom[k].y, 260);
      const bd = BOSS_DEFS[id];
      if (bd){
        for (const d of bd.thuve || []) them('trum_'+d.id, d.x*W, d.y*H, 300);
        if (bd.tranai) them('tranai', bd.tranai.x*W, bd.tranai.y*H, 340);
      }
      for (const q of (M.packs || [])) them('bai_'+q.mob, q.x, q.y, (q.r || 90) + 210);
      // `vung` là miền sinh ra bãi quái, mà bãi quái đã kê riêng ở trên — raiCum() không xét
      // nó, nên bán kính 0: kê thêm chỉ để đa giác sàn bao trùm, không để cấm lùm.
      for (const v of (M.vung || [])) if (v && isFinite(v.x)) them('vung', v.x, v.y, 0);
      for (const n of NPCS.filter(n => n.map === id)) them('npc_'+n.id, n.x, n.y, 240);
      for (const h of (typeof HERB_SPOTS !== 'undefined' ? (HERB_SPOTS[id] || []) : [])) them('thuoc', h.x, h.y, 200);
      // Vật cản TĨNH của map (hồ, vách, nhà). Phải đổ ra cùng lúc với điểm nội dung, vì
      // vung_map.py cần chúng cho HAI việc: chấm tâm lùm ngoài hồ, và đo % sàn đi được bằng
      // đúng công thức lưới tìm đường của game (NAV_CELL 24, bán kính 16) thay vì bằng diện
      // tích đa giác — hai số ấy lệch nhau tới 29 điểm phần trăm ở Dusk Marsh.
      const vatCan = (MAP_OBSTACLES[id] || []).map(o => o.wd
        ? { hop:1, x:o.x, y:o.y, wd:o.wd, ht:o.ht }
        : { hop:0, x:o.x, y:o.y, rx:o.rx, ry:o.ry });
      // Cổng lấy từ mảng toàn cục GATES — KHÔNG có map nào khai `cong`/`gates` trong dữ liệu.
      for (const g of GATES.filter(g => g.map === id)) them('cong_' + g.to, g.x, g.y, 260);
      o[id] = { w:W, h:H, ten:M.name, dungeon:!!M.dungeon, type:M.type,
                sanIso:!!M.sanIso, coDiTrong:!!M.diTrong, hinh:M.hinh || null, diem, vatCan };
    }
    return o;
  });
  fs.mkdirSync('/tmp/iso', { recursive:true });
  fs.writeFileSync('/tmp/iso/diem.json', JSON.stringify(ra, null, 1));
  for (const k of Object.keys(ra))
    console.log('%s %dx%d · %d điểm · iso=%s diTrong=%s', k.padEnd(10), ra[k].w, ra[k].h,
                ra[k].diem.length, ra[k].sanIso?'có':'—', ra[k].coDiTrong?'có':'—');
  console.log('lỗi:', JSON.stringify(loi.slice(0,3)));
  await b.close();
})();
