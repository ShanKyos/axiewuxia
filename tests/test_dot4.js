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
  // Mốc phải là truDaGo() (5 Trụ Khoá), KHÔNG phải tuongQuanDaHa() (7 Tướng Quân). Hai con số
  // này khác nhau, và bản cũ đếm nhầm cái thứ hai trong khi chú thích nói cái thứ nhất.
  const nut = await p.evaluate(() => {
    const TRU = ['chungnam','comoc','tuyettinh','mongco','nhanmon'];
    const out = [];
    SETTINGS.lowFx = false;
    for (let n = 0; n <= 5; n++){
      player.storyFlags = {};
      for (let i = 0; i < n; i++) player.storyFlags['ta_' + TRU[i]] = 1;
      capNhatVetNut();
      const e = document.getElementById('fx-crack'), c = getComputedStyle(e);
      out.push({ n, tru: truDaGo(), attr: e.dataset.tru,
                 w: c.getPropertyValue('--nw').trim(), o: c.getPropertyValue('--no').trim() });
    }
    // Cờ ta_* của vùng KHÔNG có trụ (Petalshade) không được làm vết nứt rộng thêm
    player.storyFlags = { ta_daohoa:1, ta_ngoai:1 }; capNhatVetNut();
    const lac = { tq: tuongQuanDaHa(), tru: truDaGo(),
                  attr: document.getElementById('fx-crack').dataset.tru };
    // lowFx phải tắt hẳn
    player.storyFlags = {}; for (const m of TRU) player.storyFlags['ta_' + m] = 1;
    SETTINGS.lowFx = true; capNhatVetNut();
    const tat = document.getElementById('fx-crack').dataset.tru;
    SETTINGS.lowFx = false;
    return { out, lac, tat };
  });
  console.log('vết nứt:', JSON.stringify(nut));
  if (!nut.out.every(x => x.attr === String(x.n))) fail('nấc vết nứt không khớp số trụ đã gỡ');
  else pass('vết nứt đi đúng 6 nấc 0→5 theo truDaGo()');
  const rong = nut.out.slice(1).map(x => parseFloat(x.w));
  if (!rong.every((v, i) => i === 0 || v > rong[i-1])) fail('bề rộng vết nứt không tăng đơn điệu: ' + rong.join('/'));
  else if (rong[0] < 40) fail(`nấc đầu chỉ ${rong[0]}px — clip-path còn cắt bớt ~60%, không ai nhận ra`);
  else pass(`bề rộng tăng dần ${rong.join(' → ')}px`);
  if (nut.lac.tq !== 2 || nut.lac.tru !== 0 || nut.lac.attr !== '0')
    fail(`hạ Tướng Quân ở vùng KHÔNG có trụ vẫn làm nứt rộng thêm: ${JSON.stringify(nut.lac)}`);
  else pass('chỉ Trụ Khoá mới làm vết nứt rộng — Tướng Quân vùng không trụ thì không');
  if (nut.tat !== '0') fail('bật lowFx mà vết nứt vẫn hiện');
  else pass('lowFx tắt được vết nứt');

  // Mật độ quái: tăng theo trụ ở map PK, KHÔNG tăng ở đất luyện cấp của tân thủ.
  const mat = await p.evaluate(() => {
    const TRU = ['chungnam','comoc','tuyettinh','mongco','nhanmon'];
    const doc = n => {
      player.storyFlags = {};
      for (let i = 0; i < n; i++) player.storyFlags['ta_' + TRU[i]] = 1;
      const pkm = MAPS.chungnam, anm = MAPS.ngoai;
      return { pk: pkm.packs.map(x => bayCo(x, pkm)), an: anm.packs.map(x => bayCo(x, anm)) };
    };
    const g = MAPS.chungnam.packs.map(x => x.n), ga = MAPS.ngoai.packs.map(x => x.n);
    return { goc:g, gocAn:ga, t0:doc(0), t5:doc(5) };
  });
  console.log('mật độ:', JSON.stringify(mat));
  if (JSON.stringify(mat.t0.pk) !== JSON.stringify(mat.goc)) fail('chưa gỡ trụ nào mà mật độ đã đổi');
  else pass('0 trụ: mật độ đúng như dữ liệu gốc');
  if (!mat.t5.pk.every((v, i) => v >= mat.goc[i]) || JSON.stringify(mat.t5.pk) === JSON.stringify(mat.goc))
    fail('5 trụ mà map PK không đông thêm: ' + mat.t5.pk.join('/'));
  else pass(`5 trụ: map PK ${mat.goc.join('/')} → ${mat.t5.pk.join('/')}`);
  if (JSON.stringify(mat.t5.an) !== JSON.stringify(mat.gocAn))
    fail('đất luyện cấp tân thủ (Outskirts) cũng bị tăng mật độ — sau Tái Sinh là phạt nhầm người');
  else pass('Outskirts giữ nguyên mật độ ở mọi mốc trụ');

  // Bảng Bản Đồ phải in ĐÚNG con số ngoài màn, không phải pk.n thô.
  const bang = await p.evaluate(() => {
    const TRU = ['chungnam','comoc','tuyettinh','mongco','nhanmon'];
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

  // ═══ ② NĂM CÁI TÊN BỊ GẠCH ═══════════════════════════════════════════════
  const td = await p.evaluate(() => {
    sideStates = {}; player.clues = [];
    player.level = 120; player.lvPeak = 120; questIdx = QUESTS.length;
    const ds = SIDE_QUESTS.filter(q => String(q.id).startsWith('s_td'));
    const out = [];
    for (const q of ds){
      sideStates = {}; player.clues = [];
      const co = sideAvail(q);
      acceptSide(q.id);
      const manh = player.clues.includes(q.clue);
      questOnTalk(NPCS.find(x => x.id === q.targetNpc));
      const t = NPCS.find(x => x.id === q.targetNpc);
      out.push({ id:q.id, co, manh, xong: sideStates[q.id] && sideStates[q.id].st,
                 giao:q.npc, dich:q.targetNpc, giaoMap:q.map, dichMap:t && t.map,
                 lv:q.reqLv, main:q.reqMain, congMap: MAPS[q.map] && MAPS[q.map].reqMain,
                 desc:(q.desc||'').length });
    }
    return { so: ds.length, out };
  });
  console.log('năm tên:', JSON.stringify(td.out));
  if (td.so !== 5) fail(`phải có đúng 5 phụ tuyến s_td*, đang có ${td.so}`);
  else pass('đủ 5 phụ tuyến — mỗi chương một');
  for (const q of td.out){
    if (q.co !== 'avail')   fail(`${q.id}: không nhận được (${q.co})`);
    if (!q.manh)            fail(`${q.id}: nhận nhiệm vụ mà không được trao vật chứng`);
    if (q.xong !== 'done')  fail(`${q.id}: nói chuyện với NPC đích mà không hoàn thành`);
    if (q.giao === q.dich)  fail(`${q.id}: người giao trùng người nhận — tự xong tại chỗ`);
    if (q.giaoMap === q.dichMap) fail(`${q.id}: NPC đích cùng map — không thành chuyến đi`);
    // Cổng phụ tuyến phải qua được cổng BẢN ĐỒ của chính map đó, không thì nhận trước khi tới nơi
    if (q.congMap && q.main < q.congMap)
      fail(`${q.id}: reqMain ${q.main} < cổng bản đồ ${q.giaoMap} (${q.congMap}) — mở trước khi tới được`);
  }
  if (!bad) pass('cả 5: nhận được · có vật chứng · là chuyến đi thật · trả đúng chỗ');
  const lv = td.out.map(x => x.lv);
  if (!lv.every((v,i)=> i===0 || v > lv[i-1])) fail('cấp mở khoá không tăng dần: ' + lv.join('/'));
  else pass(`rải đều khoảng trống cấp ${lv[0]}→${lv[lv.length-1]}`);

  // ═══ ③ LÝ DO TỒN TẠI ═════════════════════════════════════════════════════
  const noi = await p.evaluate(() => {
    const pb = Object.keys(MAPS).filter(k => k.startsWith('pb_'));
    const cau = t => (t || '').split(/[.!?—]\s+/).filter(x => x.trim().length > 8).length;
    return {
      pb: pb.map(k => ({ k, cau: cau(MAPS[k].desc), len:(MAPS[k].desc||'').length,
                         chiCoCoHoc: /^Phòng thử thách/.test(MAPS[k].desc || '') })),
      ngoai: { cau: cau(MAPS.ngoai.desc), rung: /đang rung|lung lay/.test(MAPS.ngoai.desc || '') },
      vuc: NPCS.filter(n => /Vực Thẳm/.test(n.name || ''))
              .map(n => ({ id:n.id, tru: /Trụ (Thornwood|Roost|Frostmire|Ashmark|Stormgate)/.test(n.lore || '') })),
      // Chợ Đấu Giá đã bị xoá khỏi game; Dược Sư ở Petalshade chứ không ở Lunaris City
      thanh: /Chợ Đấu Giá|Dược Sư/.test(MAPS.tuongduong.desc || ''),
    };
  });
  console.log('nơi chốn:', JSON.stringify(noi));
  const moc = noi.pb.filter(x => x.cau < 3 || x.chiCoCoHoc);
  if (moc.length) fail('phó bản chưa có câu neo vào truyện: ' + moc.map(x=>x.k).join(', '));
  else pass(`cả ${noi.pb.length} phó bản có lý do tồn tại, không chỉ "cày tinh chất"`);
  if (!noi.ngoai.rung || noi.ngoai.cau < 3) fail('Outskirts vẫn chỉ là bãi luyện cấp');
  else pass('Outskirts là vùng đầu tiên báo hiệu chuỗi năm trụ');
  const vucSai = noi.vuc.filter(x => !x.tru);
  if (vucSai.length) fail('Vực Thẳm chưa nối vào Trụ Khoá: ' + vucSai.map(x=>x.id).join(', '));
  else pass(`cả ${noi.vuc.length} Vực Thẳm nối vào cái trụ ở gần nó`);
  if (noi.thanh) fail('mô tả Lunaris City vẫn quảng cáo thứ không tồn tại (Chợ Đấu Giá / Dược Sư)');
  else pass('mô tả Lunaris City chỉ vào thứ có thật');

  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
