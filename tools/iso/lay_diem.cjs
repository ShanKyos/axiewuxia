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
      const diem = [];        // [nhãn, x, y] — thứ BẮT BUỘC nằm trong sàn
      const them = (nhan,x,y) => { if (isFinite(x)&&isFinite(y)) diem.push([nhan, Math.round(x), Math.round(y)]); };
      if (M.spawn) them('spawn', M.spawn.x, M.spawn.y);
      for (const k of Object.keys(M.spawnFrom || {})) them('tu_'+k, M.spawnFrom[k].x, M.spawnFrom[k].y);
      const bd = BOSS_DEFS[id];
      if (bd){
        for (const d of bd.thuve || []) them('trum_'+d.id, d.x*W, d.y*H);
        if (bd.tranai) them('tranai', bd.tranai.x*W, bd.tranai.y*H);
      }
      for (const q of (M.packs || [])) them('bai_'+q.mob, q.x, q.y);
      for (const v of (M.vung || [])) if (v && isFinite(v.x)) them('vung', v.x, v.y);
      for (const n of NPCS.filter(n => n.map === id)) them('npc_'+n.id, n.x, n.y);
      for (const h of (typeof HERB_SPOTS !== 'undefined' ? (HERB_SPOTS[id] || []) : [])) them('thuoc', h.x, h.y);
      for (const g of (M.gates || M.cong || [])) if (g && isFinite(g.x)) them('cong_'+(g.to||'?'), g.x, g.y);
      o[id] = { w:W, h:H, ten:M.name, dungeon:!!M.dungeon, type:M.type,
                sanIso:!!M.sanIso, coDiTrong:!!M.diTrong, hinh:M.hinh || null, diem };
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
