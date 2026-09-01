// Cấp quái mới có đánh nổi không: với mỗi map, đặt người chơi ở ĐÚNG cấp vào map,
// đo thời gian hạ 1 con gần cổng nhất và con xa nhất, và xem có bị quái giết không.
const { chromium } = require('playwright');
const CASES = [ // map, cấp người chơi khi mới vào
  ['daohoa',1],['ngoai',10],['chungnam',20],['comoc',40],
  ['tuyettinh',60],['mongco',80],['nhanmon',100],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate((CASES) => {
    const res = [];
    for (const [map, lv] of CASES){
      for (const sect of ['thieulam','toanchan','baidasan']){
        window.TEST_MODE = true; startGame(sect, null);
        player.level = lv; player.free = (lv-1)*5; calcDerived(); vhAutoLearn();
        // dồn điểm tiềm năng theo đúng gợi ý build của lớp
        const src = SECTS[sect].atkSrc || {str:2};
        const key = Object.keys(src).sort((a,c)=>src[c]-src[a])[0];
        player[key] += player.free; player.free = 0; calcDerived();
        travelTo(map);
        const packs = MAPS[map].packs.map(q=>({...q,
          d:Math.hypot(q.x-MAPS[map].spawn.x, q.y-MAPS[map].spawn.y)})).sort((a,c)=>a.d-c.d);
        for (const which of [0, packs.length-1]){
          const def = MOBS[packs[which].mob];
          mobs.length = 0; effects.length = 0; projectiles.length = 0;
          player.x = 1300; player.y = 950; player.hp = player.maxHp; player.qi = player.maxQi;
          spawnMob(packs[which].mob, { x: 1300 + 60, y: 950, r: 1 });
          const m = mobs[0]; m.hp = def.hp;
          let t = 0; const dt = 0.05;
          while (m.hp > 0 && !m.dead && t < 90 && player.hp > 0){
            player.face = Math.atan2(m.y-player.y, m.x-player.x);
            if (player.cd.basic <= 0) doBasic();
            // KHÔNG ép hồi chiêu — để hệ thống cooldown thật chạy, nếu không sẽ spam vô hạn
            if ((player.cd.a || 0) <= 0 && player.qi >= 25) castSkill('a');
            update(dt); t += dt;
          }
          res.push({ map, lv, sect: SECTS[sect].name, mob: def.name, mobLv: def.lv,
            vị: which===0?'gần cổng':'xa nhất',
            giây: +t.toFixed(1), hạĐược: m.dead || m.hp<=0,
            máuCònLại: Math.round(player.hp/player.maxHp*100) });
        }
      }
    }
    return res;
  }, CASES);

  console.log('%s','map        lv  lớp             vị trí     quái                    mLv  giây  hạ?  HP còn');
  for (const x of r) console.log(
    x.map.padEnd(10), String(x.lv).padStart(3), x.sect.padEnd(15), x.vị.padEnd(9),
    x.mob.padEnd(22), String(x.mobLv).padStart(4), String(x.giây).padStart(5),
    (x.hạĐược?' ✓ ':' ✗ '), String(x.máuCònLại).padStart(3)+'%');
  const near = r.filter(x=>x.vị==='gần cổng');
  const far  = r.filter(x=>x.vị==='xa nhất');
  const fail = near.filter(x=>!x.hạĐược || x.máuCònLại<40);
  console.log('\n■ Quái GẦN CỔNG phải hạ được thoải mái (>40% máu còn) — hỏng:', fail.length);
  console.log('■ Quái GÓC XA (thiết kế để nguy hiểm với người mới vào):');
  far.forEach(x=>console.log('   ', x.map, x.sect, x.mob+' lv'+x.mobLv, x.giây+'s', x.hạĐược?'hạ được':'CHẾT', x.máuCònLại+'%'));
  fail.forEach(x=>console.log('   ✗', x.map, x.sect, x.mob, 'lv'+x.mobLv, x.giây+'s', x.máuCònLại+'%'));
  console.log('errors:', JSON.stringify(errs));
  console.log(fail.length===0 && !errs.length ? 'PASS' : 'FAIL');
  await b.close();
})();
