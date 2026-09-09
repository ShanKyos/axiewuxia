// PHÓ BẢN KHUÔN LÀN — hành lang dài chia đoạn, cửa đá ở mỗi nút thắt.
//
// `test_dungeon2.js` đã gác máy phó bản trên khuôn DỌC (sân 2600×1900, ba phòng chồng lên nhau)
// bằng phòng dựng riêng ở `tests/pbthu.js`. Bài này gác nửa còn lại: cùng cái máy ấy chạy trên
// khuôn LÀN, và nó chạy trên map THẬT (`pb_loimon`) chứ không phải phòng dựng riêng — vì thứ
// đáng ngờ nhất ở đây không phải cái máy mà là bộ số sinh ra từ `tools/iso/lan_phoban.py`.
//
// Vì sao cần bài riêng thay vì tin `test_sandat`: bài ấy đo HÌNH HỌC TĨNH của mọi map khai
// `diTrong`, và nó gọi `buildWorld()` — thứ xoá sạch `mobs`. Nên quái của đợt 1 không bao giờ
// sống tới lúc bài ấy đếm, và "đợt quái có rơi đúng đoạn không" là câu nó không hỏi được.
//
// Kiểu hỏng bài này sinh ra để bắt, tất cả đều là hỏng ÂM THẦM — game vẫn chạy, chỉ là không
// chơi được:
//   · tường đá quay sai trục ⇒ nó nằm DỌC hành lang thay vì cắt ngang, người chơi đi thẳng qua
//   · khe cửa canh theo mép tường thay vì theo đường tim ⇒ cửa mở ra vách đá
//   · tâm đợt quái rơi ngoài đa giác ⇒ quái đứng trong rừng, AUTO không với tới, đợt không bao
//     giờ sạch, và lượt phó bản treo cho tới lúc hết giờ
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION|ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto(`http://localhost:${PORT}/index.html?max=1`); await p.waitForTimeout(800);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost();
    // Quái C46-C52 hạ một nhân vật bài kiểm trong vài giây, mà bài này đo HÌNH HỌC chứ không đo
    // sống sót — cùng lý do đã ghi ở test_sandat. Ghim cấp trước khi đo.
    player.level = 120; player.lvPeak = 120; calcDerived(); player.hp = player.maxHp;
  });

  // ── 1. Khuôn làn phải thật sự là khuôn của map này, không phải khuôn dọc mặc định ──
  const kh = await p.evaluate(() => {
    const k = MAPS.pb_loimon.dgnKhuon;
    return { truc: k && k.truc, soPhong: k && k.phong.length, soTuong: k && k.tuong.length,
             can: k && !!k.can, macDinh: dgnKhuon('pb_thu') === DGN_KHUON_DOC };
  });
  console.log('khuôn:', JSON.stringify(kh));
  if (kh.truc !== 'x') fail(`khuôn Lối Mòn Sâu không phải trục 'x' mà là ${kh.truc}`);
  if (kh.soPhong !== 3 || kh.soTuong !== 2) fail(`ba đoạn hai cửa mới đúng, đang là ${kh.soPhong} đoạn ${kh.soTuong} tường`);
  if (kh.can) fail('khuôn làn không được khai `can` — `diTrong` đã chặn sẵn, thêm khung tường chỉ làm lưới tìm đường nặng lên');
  if (!kh.macDinh) fail('map không khai khuôn riêng phải rơi về khuôn dọc mặc định');

  // ── 2. Tường đá phải BỊT NGANG hành lang, chừa đúng một khe ──
  // Đây là phép đo bắt lỗi quay sai trục: tường quay dọc thì lát cắt ngang không có gì chặn.
  const bit = await p.evaluate(() => {
    travelTo('pb_loimon');
    const k = MAPS.pb_loimon.dgnKhuon, ra = [];
    for (const w of k.tuong){
      const x = w.t + w.d/2;
      let chan = 0, tong = 0, khe = 0, kheThong = 0;
      for (let y = w.a; y <= w.b; y += 6){
        const trongKhe = y > w.k0 + 4 && y < w.k1 - 4;
        const bi = inObstacle('pb_loimon', x, y, 10);
        if (trongKhe){ khe++; if (!bi) kheThong++; }
        else { tong++; if (bi) chan++; }
      }
      ra.push({ x, chanNgoaiKhe: chan === tong, kheConDong: kheThong === 0, mauKhe: khe });
    }
    return ra;
  });
  console.log('tường bịt lối:', JSON.stringify(bit));
  bit.forEach((w, i) => {
    if (!w.chanNgoaiKhe) fail(`tường ${i+1} (x=${w.x}) không bịt kín bề ngang hành lang — đi vòng qua được`);
    if (!w.kheConDong) fail(`tường ${i+1} chưa dọn đoạn mà khe cửa đã thông`);
  });

  // ── 3. Ba đợt rơi đúng ba đoạn, cửa mở đúng thứ tự ──
  const lap = await p.evaluate(() => {
    travelTo('pb_loimon'); startDungeonRun('pb_loimon');
    const k = MAPS.pb_loimon.dgnKhuon, dg = MAPS.pb_loimon.diTrong;
    // mốc chia đoạn: hai bức tường cắt hành lang thành ba khúc
    const moc = [0, ...k.tuong.map(w => w.t), MAP.w];
    const o = { cua: [], dotDungDoan: [], quaiTrenSan: [], quaCuaDuoc: [] };
    for (let w = 1; w <= 3; w++){
      o.cua.push(DGN.doorOpen.slice());
      const song = mobs.filter(m => !m.dead);
      o.dotDungDoan.push(song.length ? song.every(m => m.x > moc[w-1] - 40 && m.x < moc[w] + 40) : null);
      o.quaiTrenSan.push(song.length ? song.every(m => trongDaGiac(dg, m.x, m.y)) : null);
      o.quaCuaDuoc.push(k.tuong.map(t => !inObstacle('pb_loimon', t.t + t.d/2, (t.k0 + t.k1)/2, 10)));
      mobs.forEach(m => { m.hp = 1; killMob(m, 'hit'); });
      updateDungeon(0.016);
    }
    o.cuaSauCung = DGN.doorOpen.slice();
    o.bossRa = !!DGN.bossRef;
    o.bossTrongDoanCuoi = DGN.bossRef ? (DGN.bossRef.x > moc[2] && DGN.bossRef.x < moc[3]) : null;
    o.bossTrenSan = DGN.bossRef ? trongDaGiac(dg, DGN.bossRef.x, DGN.bossRef.y) : null;
    // cửa đã mở thì khe phải thông thật — không chỉ đổi cờ
    o.khaiThongSauCung = k.tuong.map(t => !inObstacle('pb_loimon', t.t + t.d/2, (t.k0 + t.k1)/2, 10));
    return o;
  });
  console.log('một lượt:', JSON.stringify(lap));
  if (JSON.stringify(lap.cua[0]) !== '[false,false]') fail('vào phó bản mà cửa đã mở sẵn');
  // Ở đợt w, cửa thứ i phải thông ĐÚNG KHI i < w-1: mọi cửa sau lưng đã mở, cửa trước mặt còn khoá.
  lap.quaCuaDuoc.forEach((hang, w) => hang.forEach((thong, i) => {
    const phaiThong = i < w;
    if (thong !== phaiThong)
      fail(`đợt ${w+1}: cửa ${i+1} ${thong ? 'đã thông' : 'còn khoá'} — lẽ ra phải ${phaiThong ? 'thông' : 'khoá'}`);
  }));
  if (!lap.dotDungDoan.slice(0,3).every(v => v !== false)) fail(`đợt quái không rơi đúng đoạn: ${JSON.stringify(lap.dotDungDoan)}`);
  if (!lap.quaiTrenSan.slice(0,3).every(v => v !== false)) fail(`có quái rơi ra ngoài đa giác sàn: ${JSON.stringify(lap.quaiTrenSan)}`);
  if (JSON.stringify(lap.cuaSauCung) !== '[true,true]') fail(`dọn hết ba đoạn mà cửa vẫn ${JSON.stringify(lap.cuaSauCung)}`);
  if (JSON.stringify(lap.khaiThongSauCung) !== '[true,true]') fail(`cờ cửa mở nhưng khe vẫn bị bịt: ${JSON.stringify(lap.khaiThongSauCung)}`);
  if (!lap.bossRa) fail('dọn hết ba đoạn mà trùm không ra');
  if (!lap.bossTrongDoanCuoi) fail('trùm không ra ở đoạn cuối — sảnh trùm phải là cuối hành lang');
  if (!lap.bossTrenSan) fail('trùm đứng ngoài đa giác sàn');

  // ── 4. ĐI ĐƯỢC HẾT LƯỢT. Ba phép đo trên đều đo hình học đứng yên; phép này hỏi câu
  //      cuối cùng và cũng là câu duy nhất người chơi quan tâm: có đi từ cửa vào tới sảnh
  //      trùm được không. Cửa lúc này đã mở cả hai (mục 3 vừa dọn sạch).
  const di = await p.evaluate(() => {
    const k = MAPS.pb_loimon.dgnKhuon, sp = MAPS.pb_loimon.spawn;
    const dich = k.phong[k.phong.length - 1];
    player.x = sp.x; player.y = sp.y;
    moveTarget = { x: dich.cx, y: dich.cy };
    for (let i = 0; i < 3000; i++){ player.hp = player.maxHp; update(1/60); }
    return { x: Math.round(player.x), y: Math.round(player.y),
             cach: Math.round(dist(player.x, player.y, dich.cx, dich.cy)),
             dich: [dich.cx, dich.cy] };
  });
  console.log('đi hết lượt:', JSON.stringify(di));
  if (di.cach >= 120) fail(`đi bộ từ cửa vào KHÔNG tới được sảnh trùm — dừng ở (${di.x},${di.y}), còn cách ${di.cach}px`);
  else pass(`đi bộ hết hành lang tới sảnh trùm, còn cách ${di.cach}px`);

  // ── 5. Vẽ được cả hai trạng thái cửa mà không ném lỗi ──
  // Nhánh vẽ của khuôn làn hoàn toàn mới (luồng sáng đổi trục, hai cánh cửa đổi cạnh). Lỗi ở
  // đây không làm sai một phép đo nào bên trên — nó chỉ làm cả khung hình biến mất.
  await p.evaluate(() => {
    DGN.doorOpen = [false, false]; render();
    DGN.doorOpen = [true, true];   render();
    DGN.doorOpen = [true, false];  render();
  });
  await p.waitForTimeout(300);

  if (bad === 0) pass('phó bản khuôn làn chạy trọn một lượt: ba đoạn · hai cửa · trùm cuối hành lang');
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) bad += errs.length;
  console.log(bad === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
