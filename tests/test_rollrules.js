// Luật roll khi rơi đồ: đồ thường KHÔNG được có dòng VIP và phải roll trong khoảng min–max;
// đồ Hoàn Hảo phải kịch max + có dòng Hoàn Hảo riêng.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null); player.level = 80;
    const N = 6000;
    const gen = (opts) => genItem(80, 0, 'elite', opts);
    const stat = (arr) => ({ n:arr.length, min:Math.min(...arr), max:Math.max(...arr),
                             tb:+(arr.reduce((a,c)=>a+c,0)/arr.length).toFixed(2) });
    const o = { thuong:{ soDong:{}, giaTri:{}, dongVIP:0, coExc:0 },
                hoanHao:{ soDong:{}, khongMax:[], coExc:0, soDongExc:{} },
                dinhNghia:{ WEAPON_SUBS: WEAPON_SUBS.map(d=>[d.k,d.min,d.max,!!d.fixed]),
                            ARMOR_SUBS:  ARMOR_SUBS.map(d=>[d.k,d.min,d.max,!!d.fixed]),
                            RARITY_SUBS } };
    const MAXOF = {}; for (const d of [...WEAPON_SUBS, ...ARMOR_SUBS]) MAXOF[d.k] = d;

    for (let i = 0; i < N; i++){
      const it = gen({ perfect: 0 });
      const key = 'pham' + it.rarity;
      o.thuong.soDong[key] = o.thuong.soDong[key] || [];
      o.thuong.soDong[key].push(it.subs.length);
      for (const s of it.subs){
        (o.thuong.giaTri[s.k] = o.thuong.giaTri[s.k] || []).push(s.v);
        if (s.k === 'perfect') o.thuong.dongVIP++;   // "ST Hoàn Hảo" trên món KHÔNG Hoàn Hảo
      }
      if (it.exc && it.exc.length) o.thuong.coExc++;
    }
    for (const k in o.thuong.giaTri) o.thuong.giaTri[k] = stat(o.thuong.giaTri[k]);
    for (const k in o.thuong.soDong) o.thuong.soDong[k] = stat(o.thuong.soDong[k]);

    for (let i = 0; i < N; i++){
      const it = gen({ perfect: 1, bhTier: 6 });
      o.hoanHao.soDong[it.subs.length] = (o.hoanHao.soDong[it.subs.length] || 0) + 1;
      for (const s of it.subs) if (MAXOF[s.k] && s.v !== MAXOF[s.k].max)
        o.hoanHao.khongMax.push(`${s.k}=${s.v} (max ${MAXOF[s.k].max})`);
      if (it.exc && it.exc.length){ o.hoanHao.coExc++;
        o.hoanHao.soDongExc[it.exc.length] = (o.hoanHao.soDongExc[it.exc.length] || 0) + 1; }
    }
    // Cổ Thần: cũng perfect:true — có được đối xử như đồ Hoàn Hảo không?
    const anc = genAncient(Object.keys(ANCIENT_SETS)[0], 'ao', 80);
    o.coThan = { perfect: anc.perfect, soDong: anc.subs.length,
                 kichMax: anc.subs.every(s => MAXOF[s.k] && s.v === MAXOF[s.k].max),
                 coExc: !!(anc.exc && anc.exc.length) };
    return o;
  });

  console.log('định nghĩa dòng:', JSON.stringify(r.dinhNghia, null, 1));
  console.log('ĐỒ THƯỜNG  số dòng theo phẩm:', JSON.stringify(r.thuong.soDong));
  console.log('ĐỒ THƯỜNG  giá trị roll     :', JSON.stringify(r.thuong.giaTri, null, 1));
  console.log('ĐỒ THƯỜNG  dính dòng VIP    :', r.thuong.dongVIP, '· có dòng Hoàn Hảo:', r.thuong.coExc);
  console.log('HOÀN HẢO   số dòng phụ      :', JSON.stringify(r.hoanHao.soDong));
  console.log('HOÀN HẢO   dòng không kịch max:', r.hoanHao.khongMax.length, r.hoanHao.khongMax.slice(0,5));
  console.log('HOÀN HẢO   có dòng Hoàn Hảo :', r.hoanHao.coExc, '· phân bố số dòng:', JSON.stringify(r.hoanHao.soDongExc));
  console.log('CỔ THẦN                     :', JSON.stringify(r.coThan));

  // ── Luật 1: dòng VIP "ST Hoàn Hảo" KHÔNG được rơi trên đồ thường ──
  if (r.thuong.dongVIP) fail(`"ST Hoàn Hảo" rơi ${r.thuong.dongVIP}/${6000} lần trên đồ KHÔNG Hoàn Hảo — dòng VIP phải là đặc quyền của đồ Hoàn Hảo`);
  if (r.thuong.coExc) fail(`${r.thuong.coExc} món thường có DÒNG HOÀN HẢO`);
  // ── Luật 2: đồ thường phải roll TRONG khoảng, không được kịch max mọi lần ──
  for (const k in r.thuong.giaTri){
    const g = r.thuong.giaTri[k], d = [...r.dinhNghia.WEAPON_SUBS, ...r.dinhNghia.ARMOR_SUBS].find(x => x[0] === k);
    if (!d) continue;
    if (g.min < d[1] || g.max > d[2]) fail(`${k}: roll ra ngoài khoảng [${d[1]},${d[2]}] — thấy [${g.min},${g.max}]`);
    if (d[1] !== d[2] && g.min === g.max) fail(`${k}: đồ thường lúc nào cũng ${g.min} — không hề random trong [${d[1]},${d[2]}]`);
  }
  // ── Luật 3: số dòng leo theo phẩm ──
  const nOf = k => r.thuong.soDong[k] && r.thuong.soDong[k].tb;
  for (let i = 1; i <= 4; i++){
    const a = nOf('pham' + (i-1)), c = nOf('pham' + i);
    if (a != null && c != null && !(c > a)) fail(`phẩm ${i} không nhiều dòng hơn phẩm ${i-1} (${a} vs ${c})`);
  }
  // ── Luật 4: Hoàn Hảo kịch max + có dòng Hoàn Hảo ──
  if (r.hoanHao.khongMax.length) fail(`${r.hoanHao.khongMax.length} dòng trên đồ Hoàn Hảo KHÔNG kịch max`);
  if (r.hoanHao.coExc !== 6000) fail(`chỉ ${r.hoanHao.coExc}/6000 món Hoàn Hảo có DÒNG HOÀN HẢO`);
  // ── Luật 5: Cổ Thần cũng là đồ Hoàn Hảo, phải được đối xử như vậy ──
  if (!r.coThan.kichMax) fail('đồ Cổ Thần không kịch max dòng phụ');
  if (!r.coThan.coExc) fail('đồ Cổ Thần mang cờ perfect nhưng KHÔNG có DÒNG HOÀN HẢO — trong khi món Hoàn Hảo thường thì có');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
