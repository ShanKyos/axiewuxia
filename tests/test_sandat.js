// SÀN ĐẤT — hợp đồng chung cho MỌI map dựng lại theo lối isometric
//
// Bài này KHÔNG gắn với một map nào. Nó quét cả bảng MAPS, và map nào khai `diTrong` thì map đó
// bị gác. Nghĩa là: dựng lại một map, chấm xong đa giác sàn, dán vào `data/canbang.js` — bài này
// tự động bắt đầu canh nó, không phải viết bài mới. Map chưa có `diTrong` thì bỏ qua, nên hôm nay
// nó chỉ gác thành Ardhaven.
//
// Vì sao đây là bài đáng có: cảm giác "đi trên không trung" mà chủ dự án báo có đúng MỘT nguyên
// nhân — tranh nền vẽ theo lối nhìn ngang bị dùng làm mặt đất, rồi người chơi đi khắp mặt tranh,
// kể cả phần trời. Đa giác `diTrong` là thứ chặn việc đó. Bài này canh đúng cái đa giác ấy còn
// đúng: giữ được người chơi, mà không giam nhốt hay cắt map làm hai.
//
// Xem `docs/PROMPT_MAP_ISOMETRIC.md` §3 để biết mỗi ràng buộc dưới đây từ đâu ra.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

// §3.2 — map hoang dã phải chừa ≥ 60% khung là sàn đi được, nếu không thì không đủ chỗ đặt bãi
// quái. Ngưỡng kiểm để ở 55%, chừa lề cho đa giác chấm tay. Thành an toàn được phép chật
// (thành Ardhaven chỉ 10,9%) nên không áp luật này.
const SAN_TOI_THIEU_HOANG_DA = 0.55;

// Map dạng LÀN đo bằng BỀ NGANG chứ không bằng % sàn — xem khối ⑥ bên dưới. Thân nhân vật vẽ ra
// 95px, nên 340px là ~3,5 thân: đủ để né sang bên và vòng ra sườn quái, thay vì một đường ống.
// ⚠ Con số này SUY từ cỡ thân, chưa chơi thử. Chỉnh lại khi có người chơi thật đi hết một làn.
const HANH_LANG_HEP_NHAT = 340;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);

  const r = await p.evaluate(([SAN_MIN, HANH_LANG_HEP_NHAT]) => {
    startGame('thieulam', { name: 'T' });

    // Khoảng cách từ một điểm tới VIỀN đa giác — cần để phân biệt "đứng đúng trên mép" với
    // "đi lọt ra ngoài". resolveObstaclePoint() đẩy nhân vật về ĐÚNG viền khi nó bị chặn, mà
    // trongDaGiac() lại xét lọt-hẳn-vào-trong, nên một điểm nằm khít trên viền bị tính là NGOÀI.
    const cachVien = (dg, x, y) => {
      let m = Infinity;
      for (let i = 0, j = dg.length - 1; i < dg.length; j = i++){
        const ax = dg[j][0], ay = dg[j][1], bx = dg[i][0], by = dg[i][1];
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x-ax)*dx + (y-ay)*dy) / Math.max(dx*dx + dy*dy, 1e-9)));
        m = Math.min(m, Math.hypot(x - (ax + t*dx), y - (ay + t*dy)));
      }
      return m;
    };
    const trong = (dg, x, y) => {
      let c = false;
      for (let i = 0, j = dg.length - 1; i < dg.length; j = i++){
        const xi = dg[i][0], yi = dg[i][1], xj = dg[j][0], yj = dg[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const dienTich = dg => {
      let s = 0;
      for (let i = 0, n = dg.length; i < n; i++){
        const a = dg[i], b2 = dg[(i + 1) % n];
        s += a[0] * b2[1] - b2[0] * a[1];
      }
      return Math.abs(s) / 2;
    };

    const ra = [];
    for (const key of Object.keys(MAPS)){
      const md = MAPS[key], dg = md.diTrong;
      if (!dg || dg.length < 3) continue;

      if (curMap !== key) travelTo(key);
      buildWorld();
      const o = { map: key, ten: md.name, loai: md.type, dinh: dg.length,
                  san: +(100 * dienTich(dg) / (MAP.w * MAP.h)).toFixed(1), loi: [] };

      // ① điểm thả phải nằm trong sàn và không đè vật cản
      const sp = md.spawn;
      if (!sp) o.loi.push('không khai `spawn`');
      else {
        if (!trong(dg, sp.x, sp.y)) o.loi.push(`điểm thả (${sp.x},${sp.y}) NGOÀI đa giác sàn`);
        else if (inObstacle(key, sp.x, sp.y, 16)) o.loi.push(`điểm thả (${sp.x},${sp.y}) đè vật cản`);
      }

      // ② điểm tới từ map khác (`spawnFrom`) cũng phải đứng được
      for (const tu in (md.spawnFrom || {})){
        const q = md.spawnFrom[tu];
        if (!trong(dg, q.x, q.y)) o.loi.push(`điểm tới từ ${tu} (${q.x},${q.y}) NGOÀI đa giác`);
        else if (inObstacle(key, q.x, q.y, 16)) o.loi.push(`điểm tới từ ${tu} đè vật cản`);
      }

      // ④ mọi thứ máy ĐẶT ra thế giới phải đứng được trên sàn.
      //
      // Đo TRƯỚC các lượt đi thử, không phải sau. Bài này hỏi "máy đặt đúng chỗ chưa", mà nếu đo
      // sau thì nó thật ra đang hỏi "quái có đuổi theo người chơi ra khỏi hành lang không" —
      // một câu khác hẳn. Câu đó được hỏi riêng ở khối ⑦, đúng vì nó là một câu khác.
      const dat = [];
      for (const n of NPCS.filter(n => n.map === key)) dat.push(['NPC ' + n.name, n.x, n.y, 20]);
      for (const g of GATES.filter(g => g.map === key)) dat.push(['cổng ' + g.name, g.x, g.y, 20]);
      for (const m of mobs) dat.push(['quái ' + (m.name || m.key), m.x, m.y, 0]);
      const ngoai = [], ket = [];
      for (const [ten, x, y, r2] of dat){
        if (!trong(dg, x, y)) ngoai.push(ten);
        else if (r2 && inObstacle(key, x, y, r2)) ket.push(ten);
      }
      // gộp lại, đừng in ra 60 dòng tên quái giống nhau
      if (ngoai.length) o.loi.push(`${ngoai.length} thứ nằm ngoài sàn: ` + ngoai.slice(0, 6).join(' · ') + (ngoai.length > 6 ? ' …' : ''));
      if (ket.length) o.loi.push(`${ket.length} thứ kẹt trong vật cản: ` + ket.slice(0, 6).join(' · '));
      o.soQuai = mobs.length; o.soNpc = NPCS.filter(n => n.map === key).length;

      // Bài này đo HÌNH HỌC, không đo sống sót. Trước Lối Mòn Corran, map duy nhất khai `diTrong`
      // là Ardhaven — thành an toàn, không có quái. Map hoang dã đầu tiên có `diTrong` thì
      // tám lượt đi thử ở ③ kéo nhân vật cấp 1 xuyên qua 53 con C38-C48 suốt 3840 khung: nó chết
      // giữa chừng, và ⑤ đi tiếp không nhúc nhích được — bài báo "đa giác cắt sàn làm hai" trong
      // khi đa giác hoàn toàn liền. Ghim máu để phép đo hỏi đúng câu nó định hỏi.
      const diThu = (tx, ty, khung) => {
        moveTarget = { x: tx, y: ty };
        for (let i = 0; i < khung; i++){ player.hp = player.maxHp; update(1/60); }
        player.hp = player.maxHp;
      };

      // Nhân vật cấp 1 đi xuyên 53 con C38-C48 thì chết, mà cờ `dead` khoá update() vĩnh viễn —
      // mọi lượt đi sau đó đứng im. Nâng cấp trước khi đo hình học: bài này không đo sống sót.
      if (player){ player.level = 120; player.lvPeak = 120; if (typeof calcDerived === 'function') calcDerived(); player.hp = player.maxHp; }

      // ③ đi ra tám hướng — không hướng nào được thoát khỏi đa giác.
      //    Đây là bài chính: nó chứng minh người chơi KHÔNG bước ra khỏi mặt đất được.
      if (sp){
        const thoat = [];
        for (const [tx, ty] of [[120,120],[MAP.w-120,120],[MAP.w-120,MAP.h-120],[120,MAP.h-120],
                                [MAP.w/2,60],[MAP.w/2,MAP.h-60],[60,MAP.h/2],[MAP.w-60,MAP.h/2]]){
          player.x = sp.x; player.y = sp.y;
          diThu(tx, ty, 480);
          // LỀ VIỀN 8px. Đo được: đi về góc tây sân cũ thì nhân vật dừng ở (563,1019),
          // cách viền đúng 2,73px — nó bị chặn và đứng khít lên mép, không phải "đi lọt ra
          // ngoài sàn". Không có lề thì bài đỏ ngẫu nhiên tuỳ nhịp khung: cấp thấp đi chậm nên
          // dừng sớm hơn mép, cấp cao đi nhanh nên chạm tới mép.
          // Lề này KHÔNG làm bài mất răng: kiểu hỏng nó sinh ra để bắt là đi lọt hàng TRĂM px
          // (bản ghi cũ có ca dừng cách viền 223px), 8px không che nổi ca nào như thế.
          if (!trong(dg, player.x, player.y) && cachVien(dg, player.x, player.y) > 8)
            thoat.push(`→(${Math.round(tx)},${Math.round(ty)}) dừng ở (${Math.round(player.x)},${Math.round(player.y)}) — cách viền ${cachVien(dg, player.x, player.y).toFixed(1)}px`);
        }
        if (thoat.length) o.loi.push('đi lọt ra ngoài sàn: ' + thoat.join(' · '));
      }

      // ⑤ đa giác không được cắt sàn làm hai — từ điểm thả phải đi bộ tới được một cái cổng
      const cong = GATES.filter(g => g.map === key);
      o.soCong = cong.length;
      if (sp && cong.length){
        player.x = sp.x; player.y = sp.y;
        diThu(cong[0].x, cong[0].y, 1200);
        if (dist(player.x, player.y, cong[0].x, cong[0].y) >= 90)
          o.loi.push(`đi bộ từ điểm thả KHÔNG tới được cổng "${cong[0].name}" — đa giác cắt sàn làm hai`);
      }

      // ⑥ ĐỦ CHỖ ĐÁNH NHAU — hỏi theo HÌNH DẠNG map, không hỏi một con số cho tất cả.
      //
      // Luật "≥55% khung là sàn" đo được trên map ĐỒNG TRỐNG và chỉ đúng cho đồng trống. Map dạng
      // LÀN (`hinh:'hanhlang'`) cố ý chỉ có ~34% sàn — đó là định nghĩa của hành lang, không phải
      // lỗi. Áp con số của đồng trống lên hành lang là đúng cùng một kiểu sai với hai con số 7 đã
      // gỡ khỏi test_dinhhinh và test_viacot: một số đo được ở một hình dạng, bị hiểu thành luật
      // cho mọi hình dạng.
      //
      // Hành lang hỏng theo cách KHÁC, nên đo thứ khác: chỗ nào thắt quá thì không đánh nhau
      // được, và ngách cụt dài thì người chơi đi vào rồi phải quay đầu.
      o.hinh = md.hinh || 'dongtrong';
      if (md.type === 'pk' || md.type === 'freepk'){
        if (o.hinh === 'hanhlang'){
          // Bề ngang = ĐOẠN TRỐNG DÀI NHẤT trên mỗi lát cắt dọc, không phải đoạn ĐẦU TIÊN.
          // Bản đầu lấy đoạn đầu tiên và nó trả lời sai câu hỏi: một tảng đá đặt trong lòng làn
          // cắt lát cắt thành hai đoạn, đoạn trên cùng có thể chỉ 48px, và bài kêu "làn thắt còn
          // 48px" trong khi ngay dưới tảng đá vẫn còn 390px thênh thang. Câu cần hỏi là "có chỗ
          // nào đủ rộng để đánh nhau không", nên phải lấy đoạn dài nhất.
          let hep = Infinity, hepX = 0;
          for (let x = 120; x < MAP.w - 120; x += 80){
            let dai = 0, run = 0, coSan = false;
            for (let y = 40; y < MAP.h - 40; y += 8){
              if (inObstacle(key, x, y, 14)){ run = 0; continue; }
              coSan = true; run += 8;
              if (run > dai) dai = run;
            }
            if (!coSan) continue;                      // lát cắt này không có sàn — bỏ qua
            if (dai < hep){ hep = dai; hepX = x; }
          }
          o.hepNhat = hep === Infinity ? 0 : Math.round(hep);
          o.hepTaiX = hepX;
          if (o.hepNhat < HANH_LANG_HEP_NHAT)
            o.loi.push(`làn thắt còn ${o.hepNhat}px ở x=${hepX} — cần ≥${HANH_LANG_HEP_NHAT}px (≈3,5 thân người) để còn đánh nhau được`);
        } else if (o.san < SAN_MIN * 100){
          o.loi.push(`sàn chỉ ${o.san}% khổ map — map đánh nhau cần ≥${(SAN_MIN*100).toFixed(0)}%, xem PROMPT_MAP_ISOMETRIC §3.2`);
        }
      }

      // ⑦ ĐUỔI DÀI: quái phải ở TRONG sàn cả sau khi đuổi, không chỉ lúc mới đặt.
      //
      // ④ đo lúc ĐẶT, và nó cố ý chỉ đo lúc đặt. Khối này đo cái còn lại: mỗi nhánh di chuyển của
      // quái tự dịch toạ độ, nên nhánh nào quên gọi collideObstacles thì nhánh đó là một lỗ. Trên
      // đồng trống không thấy được (không có `diTrong` thì gần như không có "ngoài sàn"), nên lỗ
      // nằm im tới map dạng LÀN đầu tiên: đo trên Lối Mòn Corran, 7200 khung đuổi thì 2-3 con
      // đứng hẳn trong rừng — cụ thể là nhánh Du Hiệp lang thang và lực đẩy mềm mobSeparate().
      //
      // Ghim máu CẢ QUÁI, không chỉ người chơi: bãi chết sạch thì phép đo thành rỗng và luôn
      // XANH — nó sẽ không còn hỏi được câu nào. Giữ bãi sống mới có cụm dồn quanh người chơi,
      // và chính cụm dồn đó là thứ ép con ngoài cùng ra ngoài đa giác.
      if (mobs.length){
        const chan = [];
        for (let k = 0; k < 8; k++) chan.push({ x: 200 + (MAP.w - 400) * (k / 7), y: k % 2 ? MAP.h * 0.3 : MAP.h * 0.7 });
        player.x = (sp || chan[0]).x; player.y = (sp || chan[0]).y;
        let ngoaiNhat = 0, viDu = [];
        for (const c of chan){
          moveTarget = { x: c.x, y: c.y };
          for (let i = 0; i < 450; i++){
            player.hp = player.maxHp;
            for (const m of mobs) if (!m.dead) m.hp = m.maxHp;
            update(1/60);
          }
          const ngoai = mobs.filter(m => !m.dead && inObstacle(key, m.x, m.y, 0));
          if (ngoai.length > ngoaiNhat){
            ngoaiNhat = ngoai.length;
            viDu = ngoai.slice(0, 4).map(m => `${m.name || m.type}(${Math.round(m.x)},${Math.round(m.y)})`);
          }
        }
        o.khungDuoi = chan.length * 450;
        o.quaiRaNgoai = ngoaiNhat;
        if (ngoaiNhat)
          o.loi.push(`sau ${o.khungDuoi} khung đuổi, ${ngoaiNhat} con nằm ngoài sàn: ${viDu.join(' · ')} — nhánh di chuyển nào đó thiếu collideObstacles`);
      }

      ra.push(o);
    }
    return ra;
  }, [SAN_TOI_THIEU_HOANG_DA, HANH_LANG_HEP_NHAT]);

  console.log(JSON.stringify(r, null, 1));
  let bad = 0;
  if (!r.length){
    console.log('FAIL không map nào khai `diTrong` — bài này lẽ ra phải gác ít nhất Ardhaven');
    bad++;
  }
  for (const o of r){
    if (o.loi.length){
      for (const l of o.loi) console.log(`FAIL [${o.map}] ${l}`);
      bad += o.loi.length;
    } else {
      console.log(`PASS [${o.map}] ${o.ten} — sàn ${o.san}% · ${o.dinh} đỉnh · ${o.soNpc} NPC · ${o.soCong} cổng · ${o.soQuai} quái đều đứng trên đất${o.khungDuoi ? `, kể cả sau ${o.khungDuoi} khung đuổi` : ''}`);
    }
  }
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
