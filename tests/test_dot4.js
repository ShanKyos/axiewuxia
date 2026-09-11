// Đợt 4 — ba phần cốt truyện/thế giới, khoá lại bằng bài kiểm.
//   ① vết nứt loang theo TRỤ KHOÁ (không phải theo Tướng Quân) + mật độ quái
//   ② năm cái tên bị gạch — 5 phụ tuyến, mỗi chương một
//   ③ lý do tồn tại cho Outskirts · 7 phó bản · 3 Vực Thẳm
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => fail('lỗi runtime: ' + e.message));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(400);

  // ═══ ① VẾT NỨT ═══════════════════════════════════════════════════════════
  // Mốc phải là runeDaThu() (7 Rune Cổ), KHÔNG phải tuongQuanDaHa() (11 Trấn Ải). Hai con số
  // này khác nhau, và bản cũ đếm nhầm cái thứ hai trong khi chú thích nói cái thứ nhất.
  // ⚠ Số nấc đọc từ RUNE_TONG, không chép cứng: bảng đã đi từ 5 lên 7 mục một lần rồi.
  const nut = await p.evaluate(() => {
    const RUNE = Object.keys(RUNE_CO);
    const out = [];
    SETTINGS.lowFx = false;
    for (let n = 0; n <= RUNE_TONG; n++){
      player.storyFlags = {};
      for (let i = 0; i < n; i++) player.storyFlags['ta_' + RUNE[i]] = 1;
      capNhatVetNut();
      const e = document.getElementById('fx-crack'), c = getComputedStyle(e);
      out.push({ n, tru: runeDaThu(), attr: e.dataset.tru,
                 w: c.getPropertyValue('--nw').trim(), o: c.getPropertyValue('--no').trim() });
    }
    // Cờ ta_* của map LỐI ĐI (không có Rune) không được làm vết nứt rộng thêm
    player.storyFlags = { ta_corran:1, ta_trungnut:1 }; capNhatVetNut();
    const lac = { tq: tuongQuanDaHa(), tru: runeDaThu(),
                  attr: document.getElementById('fx-crack').dataset.tru };
    // lowFx phải tắt hẳn
    player.storyFlags = {}; for (const m of RUNE) player.storyFlags['ta_' + m] = 1;
    SETTINGS.lowFx = true; capNhatVetNut();
    const tat = document.getElementById('fx-crack').dataset.tru;
    SETTINGS.lowFx = false;
    return { out, lac, tat };
  });
  console.log('vết nứt:', JSON.stringify(nut));
  if (!nut.out.every(x => x.attr === String(x.n))) fail('nấc vết nứt không khớp số Rune đã thu');
  else pass(`vết nứt đi đúng ${nut.out.length} nấc 0→${nut.out.length - 1} theo runeDaThu()`);
  const rong = nut.out.slice(1).map(x => parseFloat(x.w));
  if (!rong.every((v, i) => i === 0 || v > rong[i-1])) fail('bề rộng vết nứt không tăng đơn điệu: ' + rong.join('/'));
  else if (rong[0] < 40) fail(`nấc đầu chỉ ${rong[0]}px — clip-path còn cắt bớt ~60%, không ai nhận ra`);
  else pass(`bề rộng tăng dần ${rong.join(' → ')}px`);
  if (nut.lac.tq !== 2 || nut.lac.tru !== 0 || nut.lac.attr !== '0')
    fail(`hạ Trấn Ải ở map LỐI ĐI (không có Rune) vẫn làm nứt rộng thêm: ${JSON.stringify(nut.lac)}`);
  else pass('chỉ Rune Cổ mới làm vết nứt rộng — Trấn Ải ở map lối đi thì không');
  if (nut.tat !== '0') fail('bật lowFx mà vết nứt vẫn hiện');
  else pass('lowFx tắt được vết nứt');

  // Mật độ quái: tăng theo trụ ở map PK, KHÔNG tăng ở đất luyện cấp của tân thủ.
  const mat = await p.evaluate(() => {
    const TRU = Object.keys(RUNE_CO);
    const doc = n => {
      player.storyFlags = {};
      for (let i = 0; i < n; i++) player.storyFlags['ta_' + TRU[i]] = 1;
      const pkm = MAPS.chungnam, anm = MAPS.ngoai;
      return { pk: pkm.packs.map(x => bayCo(x, pkm)), an: anm.packs.map(x => bayCo(x, anm)) };
    };
    const g = MAPS.chungnam.packs.map(x => x.n), ga = MAPS.ngoai.packs.map(x => x.n);
    return { goc:g, gocAn:ga, t0:doc(0), t5:doc(TRU.length) };
  });
  console.log('mật độ:', JSON.stringify(mat));
  if (JSON.stringify(mat.t0.pk) !== JSON.stringify(mat.goc)) fail('chưa thu Rune nào mà mật độ đã đổi');
  else pass('0 Rune: mật độ đúng như dữ liệu gốc');
  if (!mat.t5.pk.every((v, i) => v >= mat.goc[i]) || JSON.stringify(mat.t5.pk) === JSON.stringify(mat.goc))
    fail('thu hết Rune mà map PK không đông thêm: ' + mat.t5.pk.join('/'));
  else pass(`thu hết Rune: map PK ${mat.goc.join('/')} → ${mat.t5.pk.join('/')}`);
  if (JSON.stringify(mat.t5.an) !== JSON.stringify(mat.gocAn))
    fail('đất luyện cấp tân thủ (Outskirts) cũng bị tăng mật độ — sau Tái Sinh là phạt nhầm người');
  else pass('Outskirts giữ nguyên mật độ ở mọi mốc Rune');

  // Bảng Bản Đồ phải in ĐÚNG con số ngoài màn, không phải pk.n thô.
  const bang = await p.evaluate(() => {
    const TRU = Object.keys(RUNE_CO);
    player.storyFlags = {}; for (const m of TRU) player.storyFlags['ta_' + m] = 1;
    player.level = 120; player.lvPeak = 120; questIdx = QUESTS.length;
    closePanels(); renderStageSelect('chungnam');
    const txt = document.getElementById('panel-stage').innerText;
    const so = [...txt.matchAll(/×(\d+)/g)].map(m => +m[1]).sort((a,b)=>a-b);
    const that = MAPS.chungnam.packs.map(x => bayCo(x, MAPS.chungnam)).sort((a,b)=>a-b);
    const tho = MAPS.chungnam.packs.map(x => x.n).sort((a,b)=>a-b);
    return { so, that, tho };
  });
  console.log('bảng vs thật:', JSON.stringify(bang));
  if (JSON.stringify(bang.so) !== JSON.stringify(bang.that))
    fail(`bảng Chọn Trận in ×${bang.so.join('/')} nhưng ngoài màn có ${bang.that.join('/')} con`);
  else pass('bảng Chọn Trận in đúng số quái thật sự sinh ra');

  // ═══ ② NĂM CÁI TÊN BỊ GẠCH — ĐÃ BỎ ═════════════════════════════════════
  // ⚠ Phần đo PHỤ TUYẾN (s_td*) đã gỡ khỏi bài này: toàn bộ nhiệm vụ chính +
  // phụ đã xoá sạch để dựng lại (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH). Khi dựng lại,
  // viết bài kiểm mới theo thiết kế mới — đừng khôi phục phần cũ từ git.

  // ═══ ③ LÝ DO TỒN TẠI ═════════════════════════════════════════════════════
  const noi = await p.evaluate(() => {
    // ⚠ Phần đo phó bản (pb_*) đã gỡ: 7 map phó bản đã xoá để dựng lại bằng phần dọn map.
    const cau = t => (t || '').split(/[.!?—]\s+/).filter(x => x.trim().length > 8).length;
    return {
      // Ý của khẳng định KHÔNG đổi: vùng này phải nói ra lý do nó tồn tại trong truyện, không
      // chỉ là một bãi luyện cấp. Chỉ từ khoá đổi — nay nó là vùng giữ phiến Rune đầu tiên.
      ngoai: { cau: cau(MAPS.ngoai.desc), rung: /Rune Giữ Đàn/.test(MAPS.ngoai.desc || '') },
      vuc: NPCS.filter(n => /Vực Thẳm/.test(n.name || ''))
              .map(n => ({ id:n.id, tru: /phiến Rune|Rune Giữ|phiến thứ bảy/i.test(n.lore || '') })),
      // Chợ Đấu Giá đã bị xoá khỏi game; Dược Sư ở Plant Tribe chứ không ở Sapidae Chiefdom
      thanh: /Chợ Đấu Giá|Dược Sư/.test(MAPS.ardhaven.desc || ''),
    };
  });
  console.log('nơi chốn:', JSON.stringify(noi));
  if (!noi.ngoai.rung || noi.ngoai.cau < 3) fail('Outskirts vẫn chỉ là bãi luyện cấp');
  else pass('Outskirts nói ra phiến Rune nó giữ, không chỉ là bãi luyện cấp');
  const vucSai = noi.vuc.filter(x => !x.tru);
  if (vucSai.length) fail('Vực Thẳm chưa nối vào phiến Rune nào: ' + vucSai.map(x=>x.id).join(', '));
  else pass(`cả ${noi.vuc.length} Vực Thẳm nối vào phiến Rune ở gần nó`);
  if (noi.thanh) fail('mô tả Sapidae Chiefdom vẫn quảng cáo thứ không tồn tại (Chợ Đấu Giá / Dược Sư)');
  else pass('mô tả Sapidae Chiefdom chỉ vào thứ có thật');

  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
