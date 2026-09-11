// A4 · MIỀN DÂN SỐ — bãi quái sinh ra từ vùng, không chép cứng toạ độ.
// Đây là một cuộc THAY MÓNG: md.packs nay là kết quả bung ra từ md.vung. Vì vậy bài này đo
// đúng những thứ cuộc thay móng KHÔNG ĐƯỢC làm mất — dân số, vai, Kẻ Tiếp Sức, và nhất là
// GRADIENT (càng xa điểm thả càng mạnh), thứ trước nay chỉ nằm trong đầu người đặt toạ độ.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(400);

  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  // Dân số + vai + tiep phải ĐÚNG NHƯ DỮ LIỆU MIỀN KHAI. Đây là hợp đồng: sửa cân bằng ở miền
  // thì ngoài màn phải đổi đúng chừng ấy, không được trôi vì bộ chia làm tròn.
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const san = ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon'];
    const out = {};
    for (const m of san){
      const md = MAPS[m], ds = packsOf(m);
      const khai = {}, that = {};
      for (const v of md.vung) for (const d of v.dan) khai[d.mob] = (khai[d.mob] || 0) + d.n;
      for (const q of ds) that[q.mob] = (that[q.mob] || 0) + q.n;
      const lech = Object.keys(khai).filter(k => khai[k] !== that[k]).map(k => `${k} ${that[k]}≠${khai[k]}`);
      // mỗi miền phải bung ra đúng số cụm đã khai
      const cumLech = md.vung.filter(v => {
        const n = ds.filter(q => q.vung === v.id).length;
        return n < v.cum[0] || n > v.cum[1];
      }).map(v => v.id);
      // vai: mọi vai khai trong miền phải xuất hiện ngoài màn
      const vaiThieu = [];
      for (const v of md.vung) for (const d of (v.dan || []))
        for (const vai of (d.vai || []))
          if (!ds.some(q => q.vung === v.id && q.mob === d.mob && (q.vai || 'can') === vai)) vaiThieu.push(v.id + ':' + vai);
      const tiepLech = md.vung.filter(v => ds.some(q => q.vung === v.id && !!q.tiep !== !!v.tiep)).map(v => v.id);
      out[m] = { soVung: md.vung.length, soCum: ds.length, lech, cumLech, vaiThieu, tiepLech,
                 khongVung: ds.filter(q => !q.vung).length };
    }
    return out;
  });
  console.log('1) dân số / vai / tiếp sức:', JSON.stringify(r1));
  for (const m in r1){
    const o = r1[m];
    if (o.lech.length)     fail(`${m}: dân số trôi khỏi khai báo — ${o.lech.join(', ')}`);
    if (o.cumLech.length)  fail(`${m}: miền bung sai số cụm — ${o.cumLech.join(', ')}`);
    if (o.vaiThieu.length) fail(`${m}: vai khai mà không có cụm nào mang — ${o.vaiThieu.join(', ')}`);
    if (o.tiepLech.length) fail(`${m}: cờ Kẻ Tiếp Sức của miền không truyền xuống cụm — ${o.tiepLech.join(', ')}`);
    if (o.khongVung)       fail(`${m}: ${o.khongVung} cụm không thuộc miền nào`);
  }
  if (!bad) pass('cả 7 vùng: dân số khớp khai báo từng loài · đủ vai · đúng cờ Tiếp Sức · mọi cụm có miền');

  // GRADIENT — thứ quý nhất và cũng dễ mất nhất khi chuyển sang bốc ngẫu nhiên.
  const r2 = await p.evaluate(() => {
    const out = {};
    for (const m of ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']){
      const md = MAPS[m];
      const ds = packsOf(m).map(q => ({ lv: MOBS[q.mob].lv || 1, d: dist(q.x, q.y, md.spawn.x, md.spawn.y) }))
                           .sort((a, c) => a.d - c.d);
      // đếm cặp NGHỊCH có ý nghĩa: cụm ở xa hơn mà YẾU HƠN rõ rệt (≥2 cấp) mới tính
      let nghich = 0, maxLech = 0;
      for (let i = 1; i < ds.length; i++)
        if (ds[i].lv < ds[i-1].lv - 1){ nghich++; maxLech = Math.max(maxLech, ds[i-1].lv - ds[i].lv); }
      out[m] = { nghich, maxLech, dau: ds[0].lv, cuoi: ds[ds.length-1].lv,
                 gan: Math.round(ds[0].d), xa: Math.round(ds[ds.length-1].d) };
    }
    return out;
  });
  console.log('2) gradient:', JSON.stringify(r2));
  for (const m in r2){
    const o = r2[m];
    if (o.nghich) fail(`${m}: ${o.nghich} cụm ở xa hơn mà yếu hơn tới ${o.maxLech} cấp — mất gradient`);
    if (o.cuoi <= o.dau) fail(`${m}: cụm xa nhất (C${o.cuoi}) không mạnh hơn cụm gần nhất (C${o.dau})`);
  }
  if (!bad) pass('cả 7 vùng giữ nguyên gradient: càng xa điểm thả càng mạnh, không có cụm nghịch');

  // Cụm phải đặt được: không kẹt trong đá, không tràn mép, không chồng nhau, không đè điểm thả
  const r3 = await p.evaluate(() => {
    const out = {};
    for (const m of ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']){
      const md = MAPS[m], ds = packsOf(m);
      out[m] = {
        trongDa: ds.filter(q => inObstacle(m, q.x, q.y, 40)).length,
        // ⚠ Khổ đọc từ CHÍNH map đang soi. `MAP` mang khổ map người chơi ĐANG ĐỨNG — đo Dusk
        // Marsh (5200×3800) trong lúc đứng ở Sapidae Chiefdom (6400×3200) thì phép này báo
        // "tràn mép" cho những cụm nằm gọn trong bản đồ. Đo lại bằng w/h thật: 0 cụm tràn.
        tranMep: ds.filter(q => q.x < 150 || q.y < 150
                             || q.x > (md.w||2600)-150 || q.y > (md.h||1900)-150).length,
        chongNhau: ds.flatMap((a,i) => ds.slice(i+1).map(c => dist(a.x,a.y,c.x,c.y))).filter(d => d < 240).length,
        deTha: ds.filter(q => dist(q.x, q.y, md.spawn.x, md.spawn.y) < 260).length,
        deRuong: ds.filter(q => ruongCuaMap(m).some(r => dist(q.x,q.y,r.x,r.y) < 150)).length,
      };
    }
    return out;
  });
  console.log('3) đặt cụm:', JSON.stringify(r3));
  for (const m in r3){
    const o = r3[m];
    if (o.trongDa)   fail(`${m}: ${o.trongDa} cụm mọc trong hồ/tường`);
    if (o.tranMep)   fail(`${m}: ${o.tranMep} cụm tràn ra mép bản đồ`);
    if (o.chongNhau) fail(`${m}: ${o.chongNhau} cặp cụm chồng lên nhau (<240px)`);
    if (o.deTha)     fail(`${m}: ${o.deTha} cụm mọc ngay điểm thả`);
    if (o.deRuong)   fail(`${m}: ${o.deRuong} cụm đè lên Rương Canh`);
  }
  if (!bad) pass('mọi cụm đặt hợp lệ: ngoài đá · trong bản đồ · không chồng · xa điểm thả · không đè rương');

  // Cụm KHÔNG được đều tăm tắp — dân số chia lệch là thứ làm miền đọc ra là "vùng có dân"
  const r4 = await p.evaluate(() => {
    const out = {};
    for (const m of ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']){
      const md = MAPS[m], ds = packsOf(m);
      const nhieuCum = md.vung.filter(v => ds.filter(q => q.vung === v.id).length > 1);
      const coLech = nhieuCum.filter(v => {
        const ns = ds.filter(q => q.vung === v.id).map(q => q.n);
        return new Set(ns).size > 1;
      }).length;
      out[m] = { nhieuCum: nhieuCum.length, coLech, cỡ: ds.map(q => q.n) };
    }
    return out;
  });
  console.log('4) dân số cụm:', JSON.stringify(r4));
  {
    const tongNhieu = Object.values(r4).reduce((a, o) => a + o.nhieuCum, 0);
    const tongLech = Object.values(r4).reduce((a, o) => a + o.coLech, 0);
    if (tongLech < tongNhieu) fail(`${tongNhieu - tongLech}/${tongNhieu} miền nhiều cụm vẫn chia dân ĐỀU — mất gradient mật độ`);
    else pass(`cả ${tongNhieu} miền nhiều cụm đều chia dân lệch (cụm to / cụm nhỏ), không đều tăm tắp`);
  }

  // Bố cục CỐ ĐỊNH: bung lại bao nhiêu lần cũng ra đúng một tấm bản đồ, và tải lại trang cũng vậy
  const r5 = await p.evaluate(() => {
    const chup = () => packsOf('comoc').map(q => `${q.mob}@${q.x},${q.y}x${q.n}`).join(' ');
    const a = chup();
    MAPS.comoc._vungDaBung = false;
    const b = chup();
    MAPS.comoc._vungDaBung = false;
    const c = chup();
    return { giong: a === b && b === c, mau: a.slice(0, 90) };
  });
  const truoc = await p.evaluate(() => packsOf('comoc').map(q => `${q.mob}@${q.x},${q.y}x${q.n}`).join(' '));
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(400);
  const sau = await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null);
    return packsOf('comoc').map(q => `${q.mob}@${q.x},${q.y}x${q.n}`).join(' '); });
  console.log('5) ổn định:', JSON.stringify(r5.giong), truoc === sau);
  if (!r5.giong) fail('bung lại cùng một map ra hai bố cục khác nhau — hạt không cố định');
  else pass('bung lại nhiều lần: luôn ra đúng một bố cục');
  if (truoc !== sau) fail('tải lại trang là bãi quái nhảy chỗ — trại phải đứng yên (chỉ Vỉa Cốt được đi)');
  else pass('tải lại trang: bãi quái vẫn đúng chỗ cũ');

  // Ngoài màn: số quái thật sự sinh ra phải khớp cụm, và mỗi cụm là một bãi riêng
  const r6 = await p.evaluate(() => {
    travelTo('tuyettinh');
    const ds = packsOf('tuyettinh');
    const theoBai = {};
    // ⚠ Bỏ m.clone: bản sao của Dị Biến Phân Thân dùng chung m.pack với bản gốc, nên nó làm
    //   dân số bãi phồng lên mà không phải do miền sinh ra (test_dibien cũng bỏ đúng cờ này).
    for (const m of mobs){
      if (m.pack == null || m.clone || String(m.pack).startsWith('ruong:')) continue;
      theoBai[m.pack] = (theoBai[m.pack] || 0) + 1;
    }
    const soBai = Object.keys(theoBai).length;
    const cho = ds.reduce((a, q) => a + bayCo(q, MAPS.tuyettinh), 0);
    const thuc = Object.values(theoBai).reduce((a, c) => a + c, 0);
    const vaiNgoai = [...new Set(mobs.filter(m => m.pack != null && !m.clone && !String(m.pack).startsWith('ruong:')).map(m => m.role))];
    return { soCum: ds.length, soBai, cho, thuc, vaiNgoai };
  });
  console.log('6) ngoài màn:', JSON.stringify(r6));
  if (r6.soBai !== r6.soCum) fail(`${r6.soCum} cụm mà ngoài màn thành ${r6.soBai} bãi`);
  else pass(`${r6.soCum} cụm → ${r6.soBai} bãi riêng biệt ngoài màn`);
  if (r6.thuc !== r6.cho) fail(`sinh ra ${r6.thuc} con, dữ liệu cụm nói ${r6.cho}`);
  else pass(`sinh đúng ${r6.thuc} con như dữ liệu cụm`);
  if (r6.vaiNgoai.length < 3) fail('cả map chỉ có ' + r6.vaiNgoai.length + ' vai — miền không truyền được vai xuống quái thật');
  else pass('quái thật mang ' + r6.vaiNgoai.length + ' vai khác nhau: ' + r6.vaiNgoai.join('/'));

  // Bảng Chọn Trận phải gom theo MIỀN, không còn là danh sách phẳng
  const r7 = await p.evaluate(() => {
    player.level = 70; player.lvPeak = 70; calcDerived();
    closePanels(); renderStageSelect('tuyettinh');
    const t = document.getElementById('panel-stage').innerText;
    const tenMien = MAPS.tuyettinh.vung.map(v => v.ten);
    return { coTen: tenMien.filter(x => t.includes(x)), tong: tenMien.length,
             coTrai: /trại/.test(t), coVai: /Xạ Thủ|Pháp Sư|Trọng Giáp|Bầy Đàn/.test(t) };
  });
  console.log('7) Chọn Trận:', JSON.stringify(r7));
  if (r7.coTen.length !== r7.tong) fail(`bảng Chọn Trận thiếu tên miền: có ${r7.coTen.length}/${r7.tong}`);
  else pass(`bảng Chọn Trận gom đủ ${r7.tong} miền, mỗi miền một tiêu đề`);
  if (!r7.coTrai) fail('tiêu đề miền không nói miền đó có mấy trại / bao nhiêu con');
  else pass('mỗi tiêu đề miền nói rõ số trại và tổng số con');
  if (!r7.coVai) fail('bảng Chọn Trận không nói cụm nào mang vai gì — người chơi không chọn được kiểu đánh');
  else pass('bảng Chọn Trận ghi vai của từng cụm');

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
