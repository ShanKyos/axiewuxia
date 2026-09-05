// Luật roll khi rơi đồ: đồ thường KHÔNG được có dòng VIP và phải roll trong khoảng min–max;
// đồ Hoàn Hảo phải kịch max + có dòng Hoàn Hảo riêng.
//
// HAI DÒNG CỨNG (Chống Đỡ · Sát Thương Tối Đa của Vận) KHÔNG theo luật này và phải bỏ qua
// trong mọi phép đo dưới đây. Chúng không phải dòng BỐC: Chống Đỡ suy thẳng từ giai, còn dòng
// Vận bốc 1–5 theo bảng RIÊNG của nó. Trộn chúng vào là bài đỏ oan — đã đỏ đúng hai lần như
// vậy: atkPct "ra ngoài khoảng [2,5] — thấy [1,5]" (dòng Vận), và 2.348 dòng trên đồ Hoàn Hảo
// "không kịch max" (cũng dòng Vận). Chúng có bài gác riêng trong test_droprate.
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
                            SO_DONG_MONG:[1,4] } };
    const MAXOF = {}; for (const d of [...WEAPON_SUBS, ...ARMOR_SUBS]) MAXOF[d.k] = d;

    for (let i = 0; i < N; i++){
      const it = gen({ perfect: 0 });
      const boc = it.subs.filter(x => !x.cung && !x.van);   // chỉ dòng BỐC
      (o.thuong.soDong.moiMon = o.thuong.soDong.moiMon || []).push(boc.length);
      for (const s of boc){
        (o.thuong.giaTri[s.k] = o.thuong.giaTri[s.k] || []).push(s.v);
        if (s.k === 'perfect') o.thuong.dongVIP++;   // "ST Hoàn Hảo" trên món KHÔNG Hoàn Hảo
      }
      if (it.exc && it.exc.length) o.thuong.coExc++;
    }
    for (const k in o.thuong.giaTri) o.thuong.giaTri[k] = stat(o.thuong.giaTri[k]);
    for (const k in o.thuong.soDong) o.thuong.soDong[k] = stat(o.thuong.soDong[k]);

    for (let i = 0; i < N; i++){
      const it = gen({ perfect: 1, bhTier: 6 });
      const boc = it.subs.filter(x => !x.cung && !x.van);
      o.hoanHao.soDong[boc.length] = (o.hoanHao.soDong[boc.length] || 0) + 1;
      for (const s of boc) if (MAXOF[s.k] && s.v !== MAXOF[s.k].max)
        o.hoanHao.khongMax.push(`${s.k}=${s.v} (max ${MAXOF[s.k].max})`);
      if (it.exc && it.exc.length){ o.hoanHao.coExc++;
        o.hoanHao.soDongExc[it.exc.length] = (o.hoanHao.soDongExc[it.exc.length] || 0) + 1; }
    }
    // (Khối Cổ Thần đã bỏ cùng hệ Cổ Thần.)
    return o;
  });

  console.log('định nghĩa dòng:', JSON.stringify(r.dinhNghia, null, 1));
  console.log('ĐỒ THƯỜNG  số dòng BỐC     :', JSON.stringify(r.thuong.soDong));
  console.log('ĐỒ THƯỜNG  giá trị roll     :', JSON.stringify(r.thuong.giaTri, null, 1));
  console.log('ĐỒ THƯỜNG  dính dòng VIP    :', r.thuong.dongVIP, '· có dòng Hoàn Hảo:', r.thuong.coExc);
  console.log('HOÀN HẢO   số dòng phụ      :', JSON.stringify(r.hoanHao.soDong));
  console.log('HOÀN HẢO   dòng không kịch max:', r.hoanHao.khongMax.length, r.hoanHao.khongMax.slice(0,5));
  console.log('HOÀN HẢO   có dòng Hoàn Hảo :', r.hoanHao.coExc, '· phân bố số dòng:', JSON.stringify(r.hoanHao.soDongExc));

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
  // ── Luật 3: MỌI món bốc 1–4 dòng ──
  // Hệ phẩm đã gỡ nên không còn "số dòng leo theo phẩm". Luật thay thế gắt hơn về một mặt:
  // KHÔNG món nào được ra 0 dòng. Trước đây 80% đồ rơi từ quái thường là phẩm Phàm, tức không
  // dòng nào — bốn trên năm món nhặt lên là một cục chỉ số trống trơn.
  const sd = r.thuong.soDong.moiMon;
  if (!sd) fail('không đo được số dòng');
  else {
    if (sd.min < 1) fail(`có món ra ${sd.min} dòng phụ — mọi món phải có ít nhất 1`);
    if (sd.max > 4) fail(`có món ra ${sd.max} dòng phụ — trần là 4`);
    if (sd.tb < 2.2 || sd.tb > 2.8) fail(`trung bình ${sd.tb} dòng/món — bốc đều 1–4 phải ra ~2,5`);
  }
  // ── Luật 4: Hoàn Hảo kịch max + có dòng Hoàn Hảo ──
  if (r.hoanHao.khongMax.length) fail(`${r.hoanHao.khongMax.length} dòng trên đồ Hoàn Hảo KHÔNG kịch max`);
  if (r.hoanHao.coExc !== 6000) fail(`chỉ ${r.hoanHao.coExc}/6000 món Hoàn Hảo có DÒNG HOÀN HẢO`);
  // ── Luật 5: Cổ Thần cũng là đồ Hoàn Hảo, phải được đối xử như vậy ──

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
