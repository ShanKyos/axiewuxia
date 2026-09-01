// Boss vùng KHÔNG được aggro người chơi vừa đặt chân tới map.
// Đây là cửa chặn thật, không phải chuyện cân bằng: đo được nhân vật mới đứng cách Chúa Heo Rừng
// 338px trong khi tầm truy đuổi của boss vùng là 420 — boss bám theo từ giây đầu, phím Space
// nhắm vào nó, AUTO thì lùi mãi không thoát. Kết quả: 0 kill trong 6 phút.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(700);

  const r = await p.evaluate(() => {
    const AGGRO = 420, MARGIN = 700;   // 420 truy đuổi + 280 để người chơi kịp định hướng
    const out = { viPham: [], deBai: [], soBoss: 0, aggro: null };
    for (const id in BOSS_DEFS){
      const md = MAPS[id]; if (!md) continue;
      travelTo('tuongduong'); travelTo(id);
      const W = MAP.w, H = MAP.h;
      const arrivals = [md.spawn].concat(Object.values(md.spawnFrom || {}));
      const packs = (md.packs || []).map(k => ({ x:k.x, y:k.y }));
      BOSS_DEFS[id].thuve.forEach(bd => {
        out.soBoss++;
        const x = bd.x*W, y = bd.y*H;
        const dArr = Math.min(...arrivals.map(a => Math.hypot(x-a.x, y-a.y)));
        if (dArr < MARGIN) out.viPham.push({ map:id, ten:bd.name, cach:Math.round(dArr) });
        if (packs.length){
          const dP = Math.min(...packs.map(k => Math.hypot(x-k.x, y-k.y)));
          if (dP < 300) out.deBai.push({ map:id, ten:bd.name, cach:Math.round(dP) });
        }
      });
    }
    // đọc thẳng tầm truy đuổi thật trong code, đừng tin hằng số chép tay
    travelTo('tuongduong'); travelTo('daohoa');
    spawnZoneBosses();
    const bo = mobs.find(m => m.def.bossKind);
    out.aggro = bo ? bo.def.aggro : null;
    return out;
  });

  console.log(`kiểm ${r.soBoss} boss vùng · tầm truy đuổi thật đọc từ code: ${r.aggro}`);
  if (r.aggro && r.aggro > 700 - 280) console.log(`  (ngưỡng 700 = ${r.aggro} truy đuổi + ${700 - r.aggro} lề)`);
  console.log('quá gần điểm thả:', JSON.stringify(r.viPham));
  console.log('đè lên bãi quái (<300):', JSON.stringify(r.deBai));
  if (r.viPham.length) fail(`${r.viPham.length} boss nằm trong tầm với của điểm thả — gần nhất ${Math.min(...r.viPham.map(v=>v.cach))}px`);
  if (r.deBai.length) fail(`${r.deBai.length} boss đè lên tâm bãi quái`);
  if (r.aggro == null) fail('không đọc được tầm truy đuổi của boss vùng');

  // Bãi quái đầu tiên phải tới được mà không đi qua tầm boss
  const near = await p.evaluate(() => {
    travelTo('tuongduong'); travelTo('daohoa');
    const md = MAPS.daohoa, sp = md.spawn;
    const pk = md.packs.map(k => ({ mob:k.mob, d: Math.round(Math.hypot(k.x-sp.x, k.y-sp.y)) }))
                       .sort((a,b) => a.d - b.d)[0];
    spawnZoneBosses();
    const bo = mobs.find(m => m.def.bossKind);
    const kx = md.packs.find(k => k.mob === pk.mob);
    return { bai: pk, boss: bo ? { ten: bo.def.name, toiBai: Math.round(Math.hypot(bo.x-kx.x, bo.y-kx.y)) } : null };
  });
  console.log('bãi quái gần điểm thả nhất:', JSON.stringify(near));
  if (near.boss && near.boss.toiBai < 300)
    fail(`boss cách bãi quái đầu tiên chỉ ${near.boss.toiBai}px — cày bãi đó là kéo boss`);

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
