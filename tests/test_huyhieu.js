// HUY HIỆU VAI QUÁI + DẢI TRẠNG THÁI — hai tầng icon nhập từ kho Axie.
//
// Cả hai đều là "dải MỘT tấm ảnh, cắt theo chỉ số ô". Kiểu hỏng đặc trưng của lối đó là LỆCH
// MỘT Ô: mọi thứ vẫn vẽ ra, vẫn đẹp, chỉ là Pháp Sư mang icon của Xạ Thủ và Trúng Độc mang
// icon của Khiên — không ai phát hiện được bằng mắt. Nên bài này gác THỨ TỰ trước tiên.
//
//   1. Dải ý định: tải được, đủ ô, và mỗi vai vẽ ra một hình KHÁC nhau.
//   2. Mọi vai trong ROLE đều có huy hiệu — thêm vai mà quên icon là quái không có nhãn.
//   3. Dải trạng thái: 12 trạng thái bật hết thì hiện đủ 12 ô, chỉ số ô không trùng nhau,
//      và tắt hết thì dải phải BIẾN MẤT (không để lại một khung rỗng).
//   4. Nhãn thời gian đúng dạng: <60s ra "12s", ≥60s ra "1:30", khiên ra SỐ chứ không ra giây.
const { chromium } = require('playwright');
let loi = 0;
const pass = m => console.log('PASS ' + m);
const fail = m => { console.log('FAIL ' + m); loi++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', { name:'Đo' }); });

  // ── 1 + 2. huy hiệu vai ────────────────────────────────────────────────
  const r1 = await p.evaluate(async () => {
    veYDinh(document.createElement('canvas').getContext('2d'), 'nang', 0, 0, 15, null);
    await new Promise(r => setTimeout(r, 2000));
    const cv = document.createElement('canvas'); cv.width = 80; cv.height = 80;
    const q = cv.getContext('2d');
    const chup = k => { q.clearRect(0,0,80,80); const ok = veYDinh(q, k, 40, 40, 48, null);
      const d = q.getImageData(0,0,80,80).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i+3] > 40) n++;
      return { ok, n, d }; };
    const lech = (a,b2) => { let n = 0;
      for (let i = 0; i < a.length; i += 4) if (a[i] !== b2[i] || a[i+3] !== b2[i+3]) n++; return n; };
    const ve = {}; for (const k of YDINH_DAI) ve[k] = chup(k);
    // hai ô CỐ Ý trùng hình (phap/xa cùng AttackRanged, phân biệt bằng màu viền) — bỏ khỏi
    // phép so, nhưng kiểm riêng là chúng có màu viền khác nhau.
    const soSanh = YDINH_DAI.filter(k => k !== 'xa');
    const trung = [];
    for (let i = 0; i < soSanh.length; i++)
      for (let j = i+1; j < soSanh.length; j++)
        if (lech(ve[soSanh[i]].d, ve[soSanh[j]].d) < 100) trung.push(soSanh[i] + '≡' + soSanh[j]);
    return {
      n: YDINH_DAI.length,
      trong: YDINH_DAI.filter(k => !ve[k].ok || ve[k].n < 200),
      trung,
      thieuVai: Object.keys(ROLE).filter(v => !YDINH_DAI.includes(v)),
      mauKhac: (ROLE.phap.col !== ROLE.xa.col),
      la: veYDinh(q, 'khong-co-that', 40, 40, 48, null),
    };
  });
  console.log('1)', JSON.stringify(r1));
  r1.trong.length ? fail('huy hiệu không vẽ ra hình: ' + r1.trong.join(', '))
                  : pass(`cả ${r1.n} ô của dải ý định vẽ được`);
  r1.trung.length ? fail('hai ô ra CÙNG một hình (lệch ô trong dải?): ' + r1.trung.join(', '))
                  : pass('mỗi vai một hình riêng');
  r1.thieuVai.length ? fail('vai trong ROLE không có huy hiệu: ' + r1.thieuVai.join(', '))
                     : pass('mọi vai trong ROLE đều có huy hiệu');
  r1.mauKhac ? pass('Pháp Sư và Xạ Thủ dùng chung hình nhưng KHÁC màu viền')
             : fail('Pháp Sư và Xạ Thủ vừa chung hình vừa chung màu — không phân biệt được');
  r1.la === false ? pass('khoá lạ trả false, không vẽ bừa một ô') : fail('khoá lạ vẫn vẽ ra thứ gì đó');

  // ── 3 + 4. dải trạng thái ──────────────────────────────────────────────
  const r2 = await p.evaluate(async () => {
    player.buffAtkT = 95; player.loidonT = 40; player.poisonT = 7;
    player.chiTam = { k:'atkPct', v:14, t:6 };
    player.vhDmgT = 5; player.vhEvaT = 4; player.vhAspdT = 8; player.vhCritT = 3;
    player.vhLeechT = 9; player.vhReflT = 2; player.vhShield = 1840;
    player.tenuiTT = Date.now() + 130000;
    updateHud(); await new Promise(r => setTimeout(r, 300));
    const w = document.getElementById('hud-tt');
    const o = [...w.querySelectorAll('.tt-o')];
    const idx = o.map(x => x.style.getPropertyValue('--i'));
    const nhan = o.map(x => x.querySelector('b').textContent);
    return { hien: w.style.display !== 'none', so: o.length, bang: TRANG_THAI.length,
             idxTrung: idx.length !== new Set(idx).size,
             idxNgoai: idx.filter(i => +i < 0 || +i >= TRANG_THAI.length),
             nhan, xau: o.filter(x => x.classList.contains('xau')).length };
  });
  console.log('3)', JSON.stringify(r2));
  (r2.hien && r2.so === r2.bang)
    ? pass(`bật hết ${r2.bang} trạng thái thì hiện đủ ${r2.so} ô`)
    : fail(`hiện ${r2.so}/${r2.bang} ô (hiện=${r2.hien})`);
  r2.idxTrung ? fail('hai trạng thái dùng chung một ô trong dải — một cái đang hiện nhầm icon')
              : pass('mỗi trạng thái một ô riêng trong dải');
  r2.idxNgoai.length ? fail('chỉ số ô nằm ngoài dải: ' + r2.idxNgoai.join(', '))
                     : pass('mọi chỉ số ô nằm trong dải');
  (r2.xau === 2) ? pass('hai trạng thái XẤU (độc · Trọng Thương) có viền riêng')
                 : fail(`đếm được ${r2.xau} trạng thái xấu, phải là 2`);
  // nhãn: 95s → "1:34" · 40 → "40s" · khiên 1840 → số có phân cách, không có 's'
  const co = (re) => r2.nhan.some(x => re.test(x));
  (co(/^\d+:\d\d$/) && co(/^\d+s$/) && r2.nhan.some(x => /1[.,]840/.test(x)))
    ? pass('nhãn đúng dạng: phút:giây · giây · khiên ra SỐ điểm')
    : fail('nhãn sai dạng: ' + JSON.stringify(r2.nhan));

  const r3 = await p.evaluate(() => {
    player.buffAtkT=0;player.loidonT=0;player.poisonT=0;player.chiTam=null;
    player.vhDmgT=0;player.vhEvaT=0;player.vhAspdT=0;player.vhCritT=0;
    player.vhLeechT=0;player.vhReflT=0;player.vhShield=0;player.tenuiTT=0;
    updateHud();
    const w = document.getElementById('hud-tt');
    return { an: w.style.display === 'none', con: w.querySelectorAll('.tt-o').length };
  });
  console.log('4)', JSON.stringify(r3));
  (r3.an && r3.con === 0) ? pass('tắt hết thì dải biến mất, không để lại khung rỗng')
                          : fail('tắt hết mà dải vẫn còn: ' + JSON.stringify(r3));

  console.log('errors:', errs);
  if (errs.length) fail('lỗi trang: ' + errs.join(' | '));
  console.log(loi ? `FAIL(${loi})` : 'ALL PASS');
  await b.close();
  process.exit(loi ? 1 : 0);
})();
