// Luật Box Kundun: hộp LUÔN ra đồ Hoàn Hảo · số dòng thì hên xui · bậc hộp chỉ quyết định
// CẤP ĐỒ (chất liệu), không quyết định tốt xấu · và 3 hộp bậc N ghép được 1 hộp bậc N+1.
//
// Bài này sinh ra sau khi đo được hai lỗi thật trên bản cũ:
//   1. `excCount(tier)` chia bậc thang tới 3 dòng, nhưng KHÔNG nơi nào truyền `bhTier` vào,
//      nên nó luôn trả về 1. Đo 180.000 lượt: không ra nổi một món hai dòng.
//   2. `def.max` của BAOHAP_TIERS khai ra mà không dòng nào đọc, nên bậc hộp không hề chặn
//      trần cấp đồ — mở Box Kundun I ở cấp 100 vẫn ra đồ giai 10.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    player.level = 100;
    const N = 4000, o = { bac: {}, ghep: {}, excPhanBo: {}, subPhanBo: {} };

    // Chặn mọi thứ có tác dụng phụ: burstBaoHap thả đồ xuống đất, phát tiếng, rung màn hình.
    // Ta chỉ cần biết nó GỌI genItem với cấp bao nhiêu và nhận lại món thế nào.
    const _gen = window.genItem, _drop = window.dropToGround, _sig = window.sigilAnnounce;
    window.dropToGround = () => {}; window.sigilAnnounce = () => {};
    for (let t = 1; t < BAOHAP_TIERS.length; t++){
      const capDo = [], giai = [], hoanHao = [], soExc = [], soSub = [];
      window.genItem = (lv, bias, srcK, opts) => {
        capDo.push(lv);
        const it = _gen(lv, bias, srcK, opts);
        giai.push(it.tier); hoanHao.push(!!it.perfect);
        soExc.push(it.exc ? it.exc.length : 0); soSub.push(it.subs.length);
        return it;
      };
      for (let i = 0; i < N; i++) burstBaoHap(t, 100, 100);
      window.genItem = _gen;
      // Cổ Thần (bậc IV+) đi đường khác, không qua genItem — nên mẫu ít hơn N là bình thường.
      const dem = (a) => { const m = {}; for (const v of a) m[v] = (m[v] || 0) + 1; return m; };
      o.bac[t] = {
        ten: BAOHAP_TIERS[t].name, min: BAOHAP_TIERS[t].min, max: BAOHAP_TIERS[t].max,
        mau: capDo.length,
        capMin: Math.min(...capDo), capMax: Math.max(...capDo),
        giai: dem(giai), hoanHaoHet: hoanHao.every(Boolean),
        exc: dem(soExc), sub: dem(soSub),
      };
    }
    window.genItem = _gen; window.dropToGround = _drop; window.sigilAnnounce = _sig;

    // Cổ Thần vẫn phải được ấn định 2–3 dòng, không bốc như đồ thường
    const ancExc = [];
    for (let i = 0; i < 400; i++)
      ancExc.push(genAncient(Object.keys(ANCIENT_SETS)[0], 'ao', 80).exc.length);
    o.coThan = { min: Math.min(...ancExc), max: Math.max(...ancExc) };

    // Ghép hộp
    player.baohap = { 2: 3 };
    ghepHap(2);
    o.ghep.duBa = JSON.parse(JSON.stringify(player.baohap));
    player.baohap = { 2: 2 };
    ghepHap(2);
    o.ghep.thieu = JSON.parse(JSON.stringify(player.baohap));
    const dinh = BAOHAP_TIERS.length - 1;
    player.baohap = {}; player.baohap[dinh] = 5;
    ghepHap(dinh);
    o.ghep.dinh = JSON.parse(JSON.stringify(player.baohap));
    o.ghep.can = GHEP_HAP_CAN;
    o.soBac = BAOHAP_TIERS.length;
    return o;
  });

  for (const t in r.bac){
    const d = r.bac[t];
    console.log(`${d.ten.padEnd(15)} cấp đồ ${d.capMin}–${d.capMax} (khai ${d.min}–${d.max})`
      + ` · giai ${JSON.stringify(d.giai)} · dòng exc ${JSON.stringify(d.exc)} · dòng phụ ${JSON.stringify(d.sub)}`);
  }
  console.log('Cổ Thần số dòng exc:', JSON.stringify(r.coThan));
  console.log('ghép hộp:', JSON.stringify(r.ghep));

  // ── 1. Mọi bậc đều LUÔN ra đồ Hoàn Hảo ──
  for (const t in r.bac) if (!r.bac[t].hoanHaoHet)
    fail(`${r.bac[t].ten} có món KHÔNG Hoàn Hảo — hộp phải luôn ra đồ Hoàn Hảo`);
  if (!bad) pass('mọi bậc hộp đều ra đồ Hoàn Hảo');

  // ── 2. Bậc hộp chặn trần cấp đồ ──
  let loi2 = 0;
  for (const t in r.bac){
    const d = r.bac[t];
    if (d.capMin < d.min || d.capMax > d.max){
      fail(`${d.ten}: cấp đồ ${d.capMin}–${d.capMax} lọt ra ngoài dải khai báo ${d.min}–${d.max}`); loi2++;
    }
  }
  // người chơi cấp 100 mà mở hộp bậc I thì phải nhận đồ giai thấp, không phải giai 10
  const g1 = Object.keys(r.bac[1].giai).map(Number);
  if (Math.max(...g1) > 2) { fail(`Box Kundun I ở cấp 100 vẫn ra giai ${Math.max(...g1)} — bậc hộp không chặn được cấp đồ`); loi2++; }
  if (!loi2) pass('bậc hộp chặn đúng trần cấp đồ — bậc I ra giai ' + g1.join('/'));

  // ── 3. Số dòng exc phải THẬT SỰ ngẫu nhiên, không đứng yên một giá trị ──
  let loi3 = 0;
  for (const t in r.bac){
    const e = r.bac[t].exc, keys = Object.keys(e).map(Number).filter(k => k > 0);
    if (keys.length < 3){ fail(`${r.bac[t].ten}: số dòng exc chỉ nhận ${keys.length} giá trị (${keys}) — phải hên xui`); loi3++; }
    const tong = keys.reduce((a, k) => a + e[k], 0);
    if (e[1] && e[1] / tong > 0.75){ fail(`${r.bac[t].ten}: ${(e[1]/tong*100).toFixed(0)}% ra 1 dòng — lệch quá`); loi3++; }
    if (!e[3]){ fail(`${r.bac[t].ten}: không lần nào ra 3 dòng trong ${tong} lượt`); loi3++; }
  }
  if (!loi3) pass('số dòng exc hên xui thật, mọi bậc đều thấy đủ 1/2/3 dòng');

  // ── 4. Số dòng phụ trên đồ Hoàn Hảo không còn luôn kịch 4 ──
  let loi4 = 0;
  for (const t in r.bac){
    const sk = Object.keys(r.bac[t].sub).map(Number);
    if (sk.length < 2){ fail(`${r.bac[t].ten}: số dòng phụ luôn là ${sk[0]} — không hề random`); loi4++; }
  }
  if (!loi4) pass('số dòng phụ trên đồ Hoàn Hảo cũng hên xui');

  // ── 5. Cổ Thần vẫn được ấn định 2–3 dòng ──
  if (r.coThan.min !== 2 || r.coThan.max !== 3)
    fail(`Cổ Thần ra ${r.coThan.min}–${r.coThan.max} dòng exc, phải là 2–3`);
  else pass('Cổ Thần giữ đúng 2–3 dòng exc');

  // ── 6. Ghép hộp ──
  if (r.ghep.duBa['3'] !== 1 || r.ghep.duBa['2'])
    fail(`ghép ${r.ghep.can} hộp bậc 2 ra ${JSON.stringify(r.ghep.duBa)}, mong { "3": 1 }`);
  else pass(`${r.ghep.can} hộp bậc 2 → 1 hộp bậc 3`);
  if (r.ghep.thieu['2'] !== 2 || r.ghep.thieu['3'])
    fail(`thiếu hộp mà vẫn ghép: ${JSON.stringify(r.ghep.thieu)} — phải giữ nguyên 2 hộp`);
  else pass('thiếu hộp thì không ăn mất gì');
  const dinh = String(r.soBac - 1);
  if (r.ghep.dinh[dinh] !== 5)
    fail(`bậc cao nhất vẫn ghép được: ${JSON.stringify(r.ghep.dinh)} — phải giữ nguyên 5 hộp`);
  else pass('bậc cao nhất không ghép lên được nữa');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
