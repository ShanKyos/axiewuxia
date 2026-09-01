// Mỗi dòng chỉ số HIỆN trên thẻ đồ phải THẬT SỰ cộng vào nhân vật. Cách đo: mặc một món chỉ
// mang đúng một dòng (chỉ số gốc = 0), chụp toàn bộ số liệu của player trước/sau, rồi so.
// Dòng nào không làm đổi một con số nào = chữ trang trí, người chơi bị lừa.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  const res = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    // agi PHẢI thấp: crit = min(0.45, agi*0.003 + …) và eva = min(0.40, agi*0.0025 + …).
    // Đặt agi=200 là hai chỉ số này chạm trần sẵn, mọi đóng góp từ đồ bị che sạch và test
    // báo oan "dòng chết" cho crit/eva/Tránh Đòn (đã dính đúng bẫy này một lần).
    player.level = 20; player.str = 10; player.agi = 10; player.vit = 10; player.ene = 10;
    const snap = () => { const o = {};
      for (const k in player) if (typeof player[k] === 'number') o[k] = +player[k].toFixed(4);
      return o; };
    const diff = (a, c) => { const d = {};
      for (const k in c) if (a[k] !== c[k]) d[k] = [a[k], c[k]];
      return d; };
    const mk = (slotId, extra) => Object.assign({
      uid: 900000 + Math.floor(Math.random()*1e6), slot: slotId,
      slotName: (SLOTS.find(s=>s.id===slotId)||{}).name || slotId,
      name: 'PROBE', rarity: 0, level: 80, tier: 8, perfect: false, luck: false, life: 0,
      ancient: null, main: { k: (SLOTS.find(s=>s.id===slotId)||{}).main, v: 0, name: 'probe' },
      element: 'Kim', subs: [], plus: 0, exc: null,
      awakened: { k:'crit', v:0, name:'probe' },
    }, extra);
    const probe = (slotId, extra) => {
      player.equip = {}; calcDerived(); const a = snap();
      player.equip[slotId] = mk(slotId, extra); calcDerived(); const c = snap();
      player.equip = {}; calcDerived();
      const d = diff(a, c);
      // chống trần: nếu chỉ số liên quan đã kịch trần TRƯỚC khi mặc thì phép đo vô nghĩa
      if (!Object.keys(d).length){ d._tranCrit = a.crit >= 0.45; d._tranEva = a.eva >= 0.40;
        if (!d._tranCrit && !d._tranEva) delete d._tranCrit, delete d._tranEva; }
      return d;
    };
    const out = { subs: {}, awakened: {}, exc: {}, flags: {}, main: {} };
    for (const d of WEAPON_SUBS) out.subs['W:' + d.k] = probe('vukhi', { subs:[{k:d.k,name:d.name,v:d.max,pct:true}] });
    for (const d of ARMOR_SUBS)  out.subs['A:' + d.k] = probe('ao',    { subs:[{k:d.k,name:d.name,v:d.max,pct:true}] });
    for (const d of AWAKENED)    out.awakened[d.k]    = probe('vukhi', { plus:10, awakened:{k:d.k,v:d.v,name:d.name} });
    for (const d of EXC_WEAPON)  out.exc['W:' + d.k]  = probe('vukhi', { perfect:true, exc:[{k:d.k,name:d.k,v:d.v,flat:d.flat}] });
    for (const d of EXC_ARMOR)   out.exc['A:' + d.k]  = probe('ao',    { perfect:true, exc:[{k:d.k,name:d.k,v:d.v,flat:d.flat}] });
    out.flags.luck = probe('vukhi', { luck:true });
    out.flags.life = probe('ao',    { life:7 });
    out.flags.element = probe('vukhi', { element:'Hỏa' });
    // chỉ số GỐC của từng ô (main) — 12 ô, phải ô nào cũng ăn
    for (const sl of SLOTS) if (!sl.special)
      out.main[sl.id + '(' + sl.main + ')'] = probe(sl.id, { main:{k:sl.main, v:500, name:'probe'} });
    return out;
  });

  const show = (grp, o) => { console.log('──', grp);
    for (const k in o){ const d = o[k], ks = Object.keys(d);
      console.log('  ', k.padEnd(18), ks.length ? ks.map(x=>`${x} ${d[x][0]}→${d[x][1]}`).join(', ') : '*** KHÔNG ĐỔI GÌ ***'); } };
  show('DÒNG PHỤ', res.subs); show('THỨC TỈNH (+10)', res.awakened);
  show('DÒNG HOÀN HẢO', res.exc); show('CỜ', res.flags); show('CHỈ SỐ GỐC', res.main);

  const dead = [];
  for (const grp of ['subs','awakened','exc','main'])
    for (const k in res[grp]) if (!Object.keys(res[grp][k]).length) dead.push(grp + ' · ' + k);
  if (dead.length) fail(`${dead.length} dòng HIỆN trên thẻ mà KHÔNG cộng gì vào nhân vật:\n     ` + dead.join('\n     '));
  if (!Object.keys(res.flags.luck).length) fail('☘ Vận không tác dụng gì');
  if (!Object.keys(res.flags.life).length) fail('❤ Sinh Mệnh không tác dụng gì');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
