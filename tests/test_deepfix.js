// Tầng Sâu: các lỗi CHẶN mà test_dungeon2.js không bắt được vì nó gọi thẳng updateDeep() và
// giết MỌI quái không phân biệt khoảng cách — tức bỏ qua cả tường lẫn updateDungeon().
const { chromium } = require('playwright');
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL ' + m); };
const pass = (m) => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);

  // ── 1. DGN không được sống song song với DEEP ───────────────────────────
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost();
    player.level = 60; calcDerived();
    deepStart();
    return { conDGN: !!DGN, conDEEP: !!DEEP, tang: DEEP && DEEP.floor, map: curMap,
             tuong: dgnWallObs().length,
             cua1: inObstacle(curMap, 1300, 1140, 14), cua2: inObstacle(curMap, 1300, 690, 14) };
  });
  console.log('1.', JSON.stringify(r1));
  if (r1.conDGN) fail('travelTo() dựng lại DGN bên trong Tầng Sâu');
  else pass('DGN đứng im khi ở Tầng Sâu');
  if (r1.tuong !== 0) fail('Tầng Sâu vẫn còn tường ngăn phòng: ' + r1.tuong);
  else pass('Tầng Sâu là sảnh mở, không tường');
  if (r1.cua1 || r1.cua2) fail('khe cửa vẫn bị bịt: ' + JSON.stringify([r1.cua1, r1.cua2]));
  else pass('hai khe cửa thông suốt');

  // ── 2. chơi THẬT 60 giây: phải xuống được tầng ──────────────────────────
  const r2 = await p.evaluate(() => {
    player.auto = true; if (window.updateAutoBtn) updateAutoBtn();
    for (let i = 0; i < 5400; i++){   // 90 giây game
      update(1/60);
      // giết quái trong tầm 400px, đúng như người chơi cày tới đâu dọn tới đó
      for (const m of mobs) if (!m.dead && dist(player.x, player.y, m.x, m.y) < 400) killMob(m);
      if (DEEP && DEEP.floor >= 3) break;
    }
    return { tang: DEEP && DEEP.floor, conDEEP: !!DEEP, conDGN: !!DGN,
             quaiSong: mobs.filter(m => !m.dead).length, kho: DEEP && DEEP.bank.silver };
  });
  console.log('2.', JSON.stringify(r2));
  if (!r2.conDEEP) fail('lượt Tầng Sâu tự kết thúc giữa chừng');
  // Mốc >= 3 là để CHỨNG MINH lối xuống thông, không phải đo tốc độ cày: tầng càng sâu quái
  // càng dày máu nên số tầng đi được trong 90 giây dao động theo lớp/thiên phú roll ra.
  else if (r2.tang < 3) fail('kẹt ở tầng ' + r2.tang + ' — không xuống được tầng sau');
  else pass('xuống được tới tầng ' + r2.tang + ' (kho tạm ' + r2.kho + ' bạc)');
  if (r2.conDGN) fail('DGN sống lại giữa lượt Tầng Sâu');

  // ── 3. rời map bằng bảng Bản Đồ ⇒ RÚT LUI, không phải "mang Tầng Sâu ra thành" ──
  const r3 = await p.evaluate(() => {
    const bacTruoc = player.silver, khoTruoc = DEEP.bank.silver, tangTruoc = DEEP.floor;
    travelTo('daohoa');                 // đúng đường mà nút Dịch Chuyển / "Đi ngay" đi qua
    const sau = { map: curMap, conDEEP: !!DEEP, nhanBac: player.silver - bacTruoc, khoTruoc, tangTruoc };
    for (let i = 0; i < 150; i++) update(1/60);   // 2,5 giây: đủ để updateDeep() lên tầng nếu còn sống
    sau.mapSau = curMap; sau.conDEEPSau = !!DEEP;
    sau.quaiTangSau = mobs.filter(m => !m.dead && m.def && m.def.deepMob).length;
    return sau;
  });
  console.log('3.', JSON.stringify(r3));
  if (r3.conDEEP) fail('teleport ra ngoài mà lượt Tầng Sâu vẫn sống');
  else pass('teleport ra ngoài = RÚT LUI');
  if (r3.map !== 'daohoa') fail('rút lui xong không tới đúng map người chơi bấm: ' + r3.map);
  else pass('rút lui vẫn tới đúng map đã chọn (daohoa)');
  if (r3.nhanBac < r3.khoTruoc) fail(`kho tạm không được trao: nhận ${r3.nhanBac} / kho ${r3.khoTruoc}`);
  else pass('kho tạm ' + r3.khoTruoc + ' bạc đã vào túi');
  if (r3.quaiTangSau > 0) fail('quái Tầng Sâu spawn ở map ngoài: ' + r3.quaiTangSau);
  else pass('không có quái Tầng Sâu ngoài map');

  // ── 4. phó bản THƯỜNG vẫn phải chạy đúng như cũ ─────────────────────────
  const r4 = await p.evaluate(() => {
    travelTo('tuongduong');
    travelTo('pb_daohoa');
    return { conDGN: !!DGN, wave: DGN && DGN.wave, tuong: dgnWallObs().length, conDEEP: !!DEEP };
  });
  console.log('4.', JSON.stringify(r4));
  if (!r4.conDGN) fail('phó bản thường không còn khởi động');
  else pass('phó bản thường vẫn khởi động bình thường');
  if (r4.tuong < 4) fail('phó bản thường mất tường: ' + r4.tuong);
  else pass('phó bản thường vẫn có ' + r4.tuong + ' khối tường/cửa');

  // ── 5. Chúa Tể Vực Nứt không được lún trong vật cản ─────────────────────
  const r5 = await p.evaluate(() => {
    const out = {};
    for (const mp of ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']){
      travelTo(mp);
      RIFT.done = {};
      const m = spawnRiftBoss();
      out[mp] = inObstacle(curMap, m.x, m.y, m.def.size + 6);
      m.dead = true;
    }
    return out;
  });
  console.log('5.', JSON.stringify(r5));
  const ket = Object.keys(r5).filter(k => r5[k]);
  if (ket.length) fail('boss thế giới lún trong vật cản ở: ' + ket.join(', '));
  else pass('Chúa Tể Vực Nứt đứng chỗ trống ở cả 7 bãi');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có pageerror');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
