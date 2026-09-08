const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto('http://localhost:8877/index.html?max=1', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    startGame('thieulam', { name: 'T' });
    const res = {};
    for (const key of ['daohoa','tuongduong','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']){
      travelTo(key); buildWorld();
      const md = MAPS[key];
      res[key] = {
        ten: md.name, loai: md.type, range: md.range || '',
        w: MAP.w, h: MAP.h,
        spawn: md.spawn,
        spawnFrom: md.spawnFrom || {},
        cong: GATES.filter(g=>g.map===key).map(g=>({x:g.x,y:g.y,name:g.name,to:g.to})),
        npc: NPCS.filter(n=>n.map===key).map(n=>({x:n.x,y:n.y,name:n.name})),
        quai: mobs.map(m=>({x:Math.round(m.x),y:Math.round(m.y),boss:!!m.boss,elite:!!m.elite,ten:m.name||''})),
        canTro: (typeof MAP_OBSTACLES!=='undefined' && MAP_OBSTACLES[key]) ? MAP_OBSTACLES[key] : [],
        // ⚠ Trùm vùng KHÔNG nằm trong `mobs` lúc buildWorld() — chúng ở bảng riêng BOSS_DEFS,
        // và toạ độ khai theo TỈ LỆ khổ map, không phải pixel. Bản phác đầu tiên bỏ sót cả 32
        // con vì chỉ đọc `mobs`, nên không chừa đấu trường nào.
        boss: (function(){
          const b = (window.BOSS_DEFS && window.BOSS_DEFS[key]) || {};
          const ra = (b.thuve || []).concat(b.tranai ? [b.tranai] : []);
          const o = ra.map(x => ({ x: Math.round(x.x * MAP.w), y: Math.round(x.y * MAP.h), ten: x.name, lv: x.lv }));
          // daohoa còn một đấu trường cố định cho trận boss chương I (questIdx===9)
          if (key === 'daohoa' && typeof BOSS_ARENA !== 'undefined')
            o.push({ x: BOSS_ARENA.x, y: BOSS_ARENA.y, ten: 'Đấu trường chương I', lv: 10 });
          return o;
        })(),
      };
    }
    return res;
  });
  console.log(JSON.stringify(out));
  await b.close();
})();
