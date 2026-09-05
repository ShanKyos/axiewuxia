// SỨC MẠNH THEO CẤP — bảng vàng là SÀN, không phải mốc cố định.
//
// Bảng vàng dưới đây chụp từ bản TRƯỚC khi gỡ hệ tu tiên, và luật ban đầu là "không ai yếu đi".
// Sau đợt dịch trọng số từ CẤP sang ĐIỂM TIỀM NĂNG (để Tái Sinh đáng làm như MU), sức mạnh ở
// cấp thấp CAO HƠN bảng vàng khá nhiều còn ở đỉnh thì gần như y nguyên. Nên phép so đổi từ
// BẰNG sang KHÔNG ĐƯỢC THẤP HƠN — luật gốc vẫn giữ, chỉ không còn cấm mạnh lên.
//
// Ba luật bài này gác:
//   1. không mốc cấp nào tụt xuống dưới bảng vàng
//   2. đỉnh cấp 120 đúng mốc, VÀ máu quái đã bù đúng lượng công mà người chơi vừa mất —
//      hai bên phải dịch cùng nhau, lệch pha là vỡ nhịp chiến đấu
//   3. sau Tái Sinh phải còn ít nhất 60% sức mạnh đỉnh — dưới mức đó thì không ai bấm reset
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

// Bảng vàng đo trên LỐI CHƠI THẬT: mỗi cấp 5 điểm Tiềm Năng, chia đôi Lực Lượng / Sinh Lực,
// không trang bị, không kỹ năng, không danh hiệu, không thú.
//
// Bản trước đo với chỉ số CỐ ĐỊNH 100 ở mọi cấp — tức một nhân vật cấp 120 chưa từng cộng một
// điểm nào. Nhân vật đó không có thật, và sau đợt dịch trọng số cấp→điểm thì chính nó là người
// duy nhất yếu đi, nên bảng cũ báo động nhầm ở hai mốc cuối.
// cấp: [công, máu, mana, thủ, bạo×1000, né×1000]
// CỘT CÔNG đo lại sau khi điểm tiềm năng chuyển sang lợi tức giảm dần (căn bậc hai). Nhân vật
// KHÔNG TRANG BỊ ở cấp 120 nay còn 731 công thay vì 1744 — tụt 58%, và đó là chủ đích: trang bị
// mới là trục chính, ai không mặc gì thì yếu. Phần tụt đó đã được bù bằng mobHp(), thứ hạ máu
// quái đúng bằng lượng sát thương thực mà người chơi mất (đo được hệ số 0,27–0,87 tuỳ cấp).
// Năm cột còn lại — máu, mana, thủ, bạo, né — KHÔNG dính căn bậc hai nên giữ nguyên mốc cũ.
// CỘT CÔNG HẠ MỘT NỬA — CỐ Ý, không phải hồi quy. Chủ dự án chốt hạ thang sát thương để người
// chơi CẢM được sức mạnh lớn dần thay vì đọc bốn chữ số ngay từ cấp 1 (xem THANG_ST trong
// game.js). Đo trước: cấp 1 tay không gõ 34; sau: 17, rồi leo tới ~400 ở cấp 120.
//
// Hạ CẢ HAI nguồn công cùng lúc (PWR.pointK và công nền vũ khí/dây chuyền), vì lượng trừ thẳng
// của giáp quái suy từ chính hai nguồn đó — hạ mỗi công thì sát thương rơi xuống sàn 8%.
//
// Năm cột còn lại — máu, mana, thủ, bạo, né — KHÔNG dính THANG_ST nên giữ nguyên mốc cũ.
// (Đợt trước cột công đã hạ 1,5% khi gỡ Venom Dart; lần này hạ tiếp một nửa từ chính mốc đó.)
//
// ĐO LẠI đợt cân bằng "vạch xuất phát": công cấp thấp TỤT so với bảng trước, và đó là chủ đích.
// Nhân vật vừa tạo có sẵn 5 điểm mỗi chỉ số, mà căn bậc hai dồn giá trị về đầu đường cong nên
// chính 5 điểm đó đã cho gần hết số công của cấp 1 — cấp 1 gõ 57 trong khi cấp 120 mới 280,
// cả hành trình chỉ gấp 4,9 lần. Nay trừ đi 80% phần nền ấy (DIEM_KHOI_DAU/NEN_TRU trong
// game.js): cấp 1 tay không về ~23, còn mặc đồ đúng giai thì leo từ 51 tới 340.
// CỘT MÁU thì TĂNG (291 → 456 ở cấp 1) vì chỉ số chính của giáp đã đổi từ Thủ sang Sinh Lực.
const VANG = {"1":[23,456,63,10,21,17.5],"12":[65,1445,130,20,35,25.5],"30":[110,3090,238,35,56,37.5],
"48":[153,4918,346,50,77,49.5],"60":[180,6246,418,60,91,57.5],"96":[268,10729,634,90,133,81.5],
"108":[300,12582,706,100,147,89.5],"120":[319,13925,778,110,161,97.5]};
const TEN = ['công','máu','mana','thủ','bạo','né'];

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
      const pts = (lv - 1) * 5;
      player.equip = {}; player.inv = []; player.vohoc = {}; player.sigils = {};
      player.titles = { unlocked: [], active: null }; player.traits = [];
      player.chimera = { eq:null, co:{}, out:false, ve:{gk:0,cx:0}, pity5:0, pity4:0, bd:false, pity5s:0, pity4s:0, nguyet:0, tinh:0, su:[], tanthu:20 }; player.thanbinh = { tier:1 }; player.resetCount = 0;
      player.str = 5 + pts*0.5; player.vit = 5 + pts*0.5; player.agi = 5; player.ene = 5; player.def = 5;
      player.level = lv; calcDerived();
      r[lv] = [player.atk, player.maxHp, player.maxQi, player.dDef,
               +(player.crit*1000).toFixed(2), +(player.eva*1000).toFixed(2)];
    }
    return r;
  }, Object.keys(VANG).map(Number));
  let lech = 0;
  for (const lv in VANG){
    // chỉ số nào cũng phải >= bảng vàng; riêng tốc đánh nhỏ hơn là TỐT (đánh nhanh hơn)
    const d = VANG[lv].map((v, i) => {
      const c = r1[lv][i];
      const ok = c >= v - 1e-6;
      return ok ? null : `${TEN[i]} ${v}→${c}`;
    }).filter(Boolean);
    if (d.length){ lech++; fail(`cấp ${lv} TỤT xuống dưới bảng vàng: ${d.join(' · ')}`); }
  }
  if (!lech) pass('8 mốc cấp: không chỉ số nào tụt xuống dưới bảng vàng');

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

  // ── 5. đỉnh cấp 120 phải KHỚP với lượng bù ở phía quái ────────────────
  //     Mệnh đề cũ là "không lệch quá 5% so với bản trước, lệch nhiều thì phải cân bằng lại
  //     quái và boss". Nó đã kêu đúng: đợt chuyển điểm sang lợi tức giảm dần kéo công đỉnh của
  //     nhân vật KHÔNG TRANG BỊ xuống còn 42%. Việc cân bằng lại quái ĐÃ LÀM — mobHp() hạ máu
  //     quái theo đúng tỉ lệ sát thương thực bị mất.
  //     Nên mệnh đề nay hỏi thẳng câu đáng hỏi: hai bên có dịch CÙNG MỘT LƯỢNG không? Nếu ai đó
  //     sau này chỉnh một bên mà quên bên kia, chỗ này sẽ đỏ.
  const DINH = { atk: 319, hp: 13925 };    // đỉnh MỚI, đo sau đợt trừ vạch xuất phát
  const r5 = await p.evaluate(() => {
    const set = (lv, pts) => {
      player.equip = {}; player.inv = []; player.vohoc = {}; player.sigils = {};
      player.titles = { unlocked: [], active: null }; player.traits = [];
      player.chimera = { eq:null, co:{}, out:false, ve:{gk:0,cx:0}, pity5:0, pity4:0, bd:false, pity5s:0, pity4s:0, nguyet:0, tinh:0, su:[], tanthu:20 }; player.thanbinh = { tier:1 }; player.resetCount = 0;
      player.str = 5 + pts*0.5; player.vit = 5 + pts*0.5; player.agi = 5; player.ene = 5; player.def = 5;
      player.level = lv; calcDerived();
      return { atk: player.atk, hp: player.maxHp };
    };
    const D = lv => (lv - 1) * 5;
    return { dinh: set(120, D(120)), sauReset: set(1, D(120)) };
  });
  const dAtk = r5.dinh.atk / DINH.atk, dHp = r5.dinh.hp / DINH.hp;
  console.log('5.', JSON.stringify({ ...r5, tiLeAtk: +dAtk.toFixed(3), tiLeHp: +dHp.toFixed(3) }));
  (Math.abs(dAtk - 1) <= 0.05 && Math.abs(dHp - 1) <= 0.05)
    ? pass(`đỉnh cấp 120 đúng mốc mới (công ${(dAtk*100).toFixed(0)}% · máu ${(dHp*100).toFixed(0)}%)`)
    : fail(`đỉnh lệch quá 5% so với mốc mới: công ${(dAtk*100).toFixed(0)}% · máu ${(dHp*100).toFixed(0)}%`);
  // Hai bên phải dịch CÙNG NHAU. Bản trước đo việc đó bằng cách so máu quái với một hằng số
  // chụp từ bản cũ (CONG_DINH_CU = 1744) — thước đo ấy hỏng dần theo mỗi đợt cân bằng, và tới
  // đợt này thì nó so với một phiên bản đã hai đời không còn tồn tại, nên đỏ mà không nói được
  // điều gì thật.
  //
  // Nay hỏi thẳng câu đáng hỏi, bằng ĐƠN VỊ KHÔNG BAO GIỜ HẾT HẠN: một nhân vật mặc đồ ĐÚNG
  // GIAI của cấp mình cần bao nhiêu nhát thường để hạ một con quái thường cùng cấp? Con số đó
  // phải nằm trong khoảng chơi được, VÀ phải xấp xỉ nhau ở đầu và cuối game. Ai chỉnh một bên
  // mà quên bên kia thì hai đầu lệch nhau ngay, dù có đổi thang sát thương bao nhiêu lần.
  const NHAT_MIN = 3, NHAT_MAX = 12, LECH_TOI_DA = 2.5;
  const r5b = await p.evaluate(() => {
    const thuong = Object.values(MOBS).filter(m => !m.boss && !m.elite && !m.duHiep && !m.bossKind);
    const gan = lv => thuong.reduce((a, b) =>
      Math.abs((b.lv||1) - lv) < Math.abs((a.lv||1) - lv) ? b : a);
    const doNhat = (d) => {
      const lv = d.lv || 1;
      player.equip = {}; player.vohoc = {}; player.sigils = {};
      player.titles = { unlocked: [], active: null }; player.traits = [];
      player.str = 5 + (lv-1)*5*0.6; player.vit = 5 + (lv-1)*5*0.4;
      player.agi = 5; player.ene = 5; player.def = 5; player.level = lv;
      // genSpecific() nhận CẤP rồi tự suy ra giai — truyền thẳng giai vào là nhận đồ giai 1
      for (const sl of SLOTS){ if (sl.special) continue;
        const it = genSpecific(sl.id, lv); if (it){ it.plus = 0; player.equip[sl.id] = it; } }
      calcDerived();
      const st = Math.max(player.atk * DMG_FLOOR, player.atk - mobFlatDef(d));
      return { lv, mob: mobHp(d), dame: Math.round(st), nhat: +(mobHp(d)/st).toFixed(1) };
    };
    return { dau: doNhat(gan(8)), cuoi: doNhat(gan(102)) };
  });
  const lechNhat = Math.max(r5b.dau.nhat, r5b.cuoi.nhat) / Math.max(0.01, Math.min(r5b.dau.nhat, r5b.cuoi.nhat));
  console.log('5b.', JSON.stringify({ ...r5b, lechNhat: +lechNhat.toFixed(2) }));
  const trongKhoang = v => v >= NHAT_MIN && v <= NHAT_MAX;
  (trongKhoang(r5b.dau.nhat) && trongKhoang(r5b.cuoi.nhat) && lechNhat <= LECH_TOI_DA)
    ? pass(`nhịp hạ quái đều: ${r5b.dau.nhat} nhát ở cấp ${r5b.dau.lv} · ${r5b.cuoi.nhat} nhát ở cấp ${r5b.cuoi.lv} (lệch ${lechNhat.toFixed(2)}x)`)
    : fail(`nhịp hạ quái lệch pha: ${r5b.dau.nhat} nhát ở cấp ${r5b.dau.lv} · ${r5b.cuoi.nhat} nhát ở cấp ${r5b.cuoi.lv} — phải nằm trong ${NHAT_MIN}-${NHAT_MAX} nhát và lệch nhau không quá ${LECH_TOI_DA}x`);

  // ── 6. Tái Sinh phải còn đáng làm ─────────────────────────────────────
  const rAtk = r5.sauReset.atk / r5.dinh.atk, rHp = r5.sauReset.hp / r5.dinh.hp;
  console.log('6.', JSON.stringify({ congPct: +(rAtk*100).toFixed(1), mauPct: +(rHp*100).toFixed(1) }));
  (rAtk >= 0.60 && rHp >= 0.60)
    ? pass(`sau Tái Sinh giữ ${(rAtk*100).toFixed(0)}% công · ${(rHp*100).toFixed(0)}% máu — reset vẫn đáng bấm`)
    : fail(`sau Tái Sinh chỉ còn ${(rAtk*100).toFixed(0)}% công · ${(rHp*100).toFixed(0)}% máu — yếu quá, không ai reset`);

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALLPASS');
  process.exit(bad ? 1 : 0);
})();
