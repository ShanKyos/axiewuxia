// SỨC MẠNH THEO CẤP — ghim con số.
//
// Đường cong này trước đây nấp sau hai hệ tu tiên (cảnh giới + kinh mạch) đã bị gỡ. Khi viết
// lại thành levelPower(), yêu cầu tuyệt đối là KHÔNG AI YẾU ĐI: mọi con số phải trùng khít bản
// trước khi gỡ. Bảng vàng dưới đây chụp từ chính bản cũ, đo trong điều kiện đã khử hết nhiễu —
// không trang bị, không kỹ năng, không danh hiệu, không thú, chỉ số gốc cố định 100.
//
// Bài này cũng là chốt chặn cho Quy tắc 1: nếu ai đó gọi lại tên tu tiên, mục 3 sẽ đỏ.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

// cấp: [công, máu, mana, thủ, bạo×1000, né×1000, tốcĐánh, hồiMana, choáng, phản, bấtTử]
const VANG = {"1":[207,1637,205,10,306,255,0.442,6,0,0,0],"12":[253,2053,272,20,320,263,0.434,7.5,0,0,0],
"30":[318,2690,380,35,341,275,0.422,6,0,0,0],"48":[422,3581,488,50,362,287,0.41,8,0.05,0,0],
"60":[498,4269,560,60,376,295,0.402,9,0.05,0.05,0],"96":[787,6681,776,90,418,319,0.378,12,0.05,0.05,1],
"108":[918,7807,848,100,432,327,0.37,14,0.05,0.05,1],"120":[973,8337,920,110,446,335,0.362,14,0.05,0.05,1]};
const TEN = ['công','máu','mana','thủ','bạo','né','tốcĐánh','hồiMana','choáng','phản','bấtTử'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(500);

  // ── 1. mọi mốc cấp phải khớp bảng vàng ────────────────────────────────
  const r1 = await p.evaluate((mocs) => {
    const r = {};
    for (const lv of mocs){
      player.equip = {}; player.inv = []; player.vohoc = {}; player.sigils = {};
      player.titles = { unlocked: [], active: null }; player.traits = [];
      player.mount = { tier:0, out:false }; player.thanbinh = { tier:1 };
      player.str = 100; player.agi = 100; player.vit = 100; player.ene = 100;
      player.level = lv; calcDerived();
      r[lv] = [player.atk, player.maxHp, player.maxQi, player.dDef,
               +(player.crit*1000).toFixed(2), +(player.eva*1000).toFixed(2),
               +player.aspd.toFixed(4), player.qireg, player.stunProc, player.reflect, player.batTu?1:0];
    }
    return r;
  }, Object.keys(VANG).map(Number));
  let lech = 0;
  for (const lv in VANG){
    const d = VANG[lv].map((v, i) => v === r1[lv][i] ? null : `${TEN[i]} ${v}→${r1[lv][i]}`).filter(Boolean);
    if (d.length){ lech++; fail(`cấp ${lv} lệch: ${d.join(' · ')}`); }
  }
  if (!lech) pass(`8 mốc cấp khớp bảng vàng — không ai yếu đi so với trước khi gỡ hệ tu tiên`);

  // ── 2. đường cong phải TĂNG ĐƠN ĐIỆU theo cấp ─────────────────────────
  const r2 = await p.evaluate(() => {
    let lastAtk = -1, lastHp = -1, tut = [];
    for (let lv = 1; lv <= 120; lv++){
      player.equip = {}; player.vohoc = {}; player.titles = { unlocked: [], active: null };
      player.str = 100; player.agi = 100; player.vit = 100; player.ene = 100;
      player.level = lv; calcDerived();
      if (player.atk < lastAtk || player.maxHp < lastHp) tut.push(lv);
      lastAtk = player.atk; lastHp = player.maxHp;
    }
    return { tut };
  });
  console.log('2.', JSON.stringify(r2));
  r2.tut.length ? fail('có cấp bị TỤT sức mạnh: ' + r2.tut.join(','))
                : pass('công và máu tăng đơn điệu suốt 120 cấp, không mốc nào tụt');

  // ── 3. không còn dấu vết hệ tu tiên ───────────────────────────────────
  const r3 = await p.evaluate(() => ({
    mang: ['DANTIAN_REALMS','MERIDIANS','TIEN_SKINS','TIEN_IMGS'].filter(k => typeof window[k] !== 'undefined'),
    ham:  ['ascendToImmortal','drawDantianAura','drawAscendedFigure','tienImgOf'].filter(k => typeof window[k] === 'function'),
    duLieu: [!!player.dantian && 'dantian', !!player.meridians && 'meridians',
             player.ascended !== undefined && 'ascended', player.tienSkin !== undefined && 'tienSkin'].filter(Boolean),
  }));
  console.log('3.', JSON.stringify(r3));
  (!r3.mang.length && !r3.ham.length && !r3.duLieu.length)
    ? pass('không còn mảng · hàm · trường dữ liệu nào của hệ tu tiên')
    : fail('còn sót hệ tu tiên: ' + JSON.stringify(r3));

  // ── 4. lệnh cheat cũ phải là lệnh lạ ──────────────────────────────────
  const r4 = await p.evaluate(() => {
    const t = { atk: player.atk, speed: player.speed };
    cheatExec('/ascend'); cheatExec('/realm 9');
    return { doiGi: player.atk !== t.atk || player.speed !== t.speed,
             conAscended: player.ascended !== undefined };
  });
  console.log('4.', JSON.stringify(r4));
  (!r4.doiGi && !r4.conAscended) ? pass('/ascend và /realm không còn tác dụng')
                                 : fail('lệnh cũ vẫn đổi trạng thái: ' + JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALLPASS');
  process.exit(bad ? 1 : 0);
})();
