// 35 bộ giáp (5 lớp × 7 giai). Điều PHẢI chứng minh: 5 lớp KHÁC HẲN nhau khi mặc đồ.
// Bản cũ là 25 bộ (5 lớp × 5 dải, mỗi dải phủ 2 giai) — mỗi giai một bộ là thứ vừa sửa.
// Lỗi cũ mà test này khoá lại: 4 lớp hình học vẽ generic cho cả 6 lớp nhân vật ⇒ pháp sư mặc
// áo choàng lại đeo vai giáp tấm của hiệp sĩ, cả 5 lớp trông như mặc chung một bộ.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const CL = ['thieulam','baidasan','toanchan','minhgiao','bug'];
    const o = { bang:{}, styles:{} };

    for (const k of CL){
      o.bang[k]   = HERO_SETS[k].map(s => s.name);
      o.styles[k] = HERO_SETS[k].map(s => s.style);
    }
    o.soLop = Object.keys(HERO_SETS).length;
    o.soDai = CL.map(k => HERO_SETS[k].length);
    o.soGiai = GIAI_MAX;

    const shot = (sect, t, ps) => {
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      const q = c.getContext('2d');
      const gv = { n:5, rarity:4, t, plus:0, rcol:RARITIES[4].color, wTier:t, wPlus:0, setColor:null };
      drawHeroFigure(q, sect, Math.round(t), 900, ps || HERO_POSE0, gv);
      return q.getImageData(0, 0, HERO_W, HERO_H).data;
    };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) n++; return n; };

    // ── mỗi lớp phải khác MỌI lớp còn lại ở bậc cuối ──
    const F = {}; for (const k of CL) F[k] = shot(k, GIAI_MAX);
    o.khacNhau = []; o.minKhac = 1e9;
    for (let i = 0; i < CL.length; i++) for (let j = i+1; j < CL.length; j++){
      const d = diff(F[CL[i]], F[CL[j]]);
      o.khacNhau.push({ a: CL[i], b: CL[j], px: d });
      o.minKhac = Math.min(o.minKhac, d);
    }

    // ── mỗi lớp: các dải phải khác nhau tuần tự ──
    o.daiKhac = {};
    for (const k of CL){
      const arr = [];
      // Quét TỪNG giai một, không nhảy cách: 7 giai thì mỗi giai một bộ, nên bước nào cũng
      // phải thấy khác. Bản 14 giai lấy mẫu cách quãng [2,4,6,8,10] — nay 8 và 10 vượt bảng,
      // clamp về 7 nên hai mẫu cuối ra ảnh y hệt và bài kiểm báo "0 px" oan.
      let prev = shot(k, 1);
      for (let t = 2; t <= GIAI_MAX; t++){ const cur = shot(k, t); arr.push(diff(prev, cur)); prev = cur; }
      o.daiKhac[k] = arr;
    }

    // ── Dark Wizard TUYỆT ĐỐI không được dùng tạo hình giáp tấm ──
    o.dwKhongGiapTam = HERO_SETS.baidasan.every(s => ['cloth','sphinx','arcane'].includes(s.style));
    // ── Spellblade phải LỆCH vai ở mọi dải ──
    o.sbToanHalfplate = HERO_SETS.minhgiao.every(s => s.style === 'halfplate');
    // Đo trên NGUYÊN hình là sai: mọi lớp đều cầm vũ khí MỘT tay nên hình luôn lệch, và phép
    // đo sẽ bắt được thanh kiếm chứ không bắt được vai giáp. Vẽ RIÊNG lớp vai ra để đo.
    const vaiOnly = (sect, t) => {
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      const q = c.getContext('2d');
      const gv = { n:5, rarity:4, t, plus:0, rcol:RARITIES[4].color, wTier:t, wPlus:0, setColor:null };
      hPauldrons(q, hSetMetal(hMetal(Math.round(t)), heroSet(sect, t)), gv, heroSet(sect, t), HERO_POSE0);
      return q.getImageData(0, 0, HERO_W, HERO_H).data;
    };
    const asymOf = d => { let n = 0;
      for (let y = 70; y < 150; y++) for (let x = 0; x < HERO_W/2; x++){
        const i = (y*HERO_W+x)*4, j = (y*HERO_W+(HERO_W-1-x))*4;
        if (Math.abs(d[i+3] - d[j+3]) > 60) n++;
      } return n; };
    o.sbLech = [2, 6, 10].map(t => ({ t, asym: asymOf(vaiOnly('minhgiao', t)) }));
    // đối chứng: vai giáp Dark Knight vẽ đối xứng hai bên
    o.dkDoiXung = asymOf(vaiOnly('thieulam', GIAI_MAX));

    // ── mọi tạo hình khai báo phải có đủ 4 hàm ──
    o.thieuHam = [];
    for (const k of CL) for (const st of new Set(HERO_SETS[k].map(s => s.style))){
      for (const [tab, nm] of [[SET_SHOULDER,'vai'],[SET_CREST,'mũ'],[SET_LEG,'chân'],[SET_HIP,'eo']])
        if (typeof tab[st] !== 'function') o.thieuHam.push(`${st}.${nm}`);
    }

    // ── không lỗi khi chưa mặc gì / chưa có player ──
    o.antToan = (() => { try {
      const c = document.createElement('canvas'); c.width=HERO_W; c.height=HERO_H;
      for (const k of CL) drawHeroFigure(c.getContext('2d'), k, 1, 0, HERO_POSE0, null);
      heroCardUrl('baidasan', 1); return true;
    } catch(e){ o.crash = String(e); return false; } })();

    return o;
  });

  for (const k in r.bang) console.log(k.padEnd(10), r.bang[k].join(' · '));
  console.log('');
  console.log('khác nhau ở bậc 10 (px):', r.khacNhau.map(x => `${x.a.slice(0,4)}/${x.b.slice(0,4)}=${x.px}`).join('  '));
  console.log('các giai khác nhau tuần tự:', JSON.stringify(r.daiKhac));
  console.log('Spellblade lệch vai:', JSON.stringify(r.sbLech), '| Dark Knight đối xứng:', r.dkDoiXung);

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (r.soLop !== 5) fail(`phải đủ 5 lớp, có ${r.soLop}`);
  if (r.soDai.some(n => n !== r.soGiai)) fail(`mỗi lớp phải đủ ${r.soGiai} dải (mỗi giai một bộ), có ${JSON.stringify(r.soDai)}`);
  if (r.thieuHam.length) fail('tạo hình thiếu hàm: ' + r.thieuHam.join(', '));
  if (r.minKhac < 3000) fail(`hai lớp nào đó quá giống nhau — nhỏ nhất chỉ ${r.minKhac} px, cần >3000`);
  for (const k in r.daiKhac) r.daiKhac[k].forEach((d, i) => {
    if (d < 800) fail(`${k}: giai ${i+1}→${i+2} gần như không đổi (${d} px)`);
  });
  if (!r.dwKhongGiapTam) fail('Dark Wizard đang dùng tạo hình giáp tấm — pháp sư mặc áo choàng không được đeo vai sắt');
  if (!r.sbToanHalfplate) fail('Spellblade có dải không dùng halfplate — mất chữ ký lệch vai');
  for (const x of r.sbLech) if (x.asym < 80) fail(`Spellblade bậc ${x.t} không lệch vai (${x.asym} px)`);
  if (r.dkDoiXung > 20) fail(`phép đo lệch vai vô nghĩa — vai giáp Dark Knight lẽ ra đối xứng mà lệch ${r.dkDoiXung} px`);
  if (!r.antToan) fail('lỗi khi vẽ lúc chưa mặc gì: ' + r.crash);

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
