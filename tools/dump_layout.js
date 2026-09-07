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
      };
    }
    return res;
  });
  console.log(JSON.stringify(out));
  await b.close();
})();
