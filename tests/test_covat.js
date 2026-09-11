// KHẾ ƯỚC QUAY RA CỔ VẬT — không quay ra Chimera nữa.
//
// Chủ dự án chốt: "giữ lại phần gacha sao cho sẽ đổi thành gacha bộ giáp và đồ; xoá phần gacha
// ra chimera thôi là ổn." Bài này gác đúng bốn lời hứa của câu đó, và mỗi lời hứa có một kiểu
// hỏng riêng mà mắt thường không bắt được:
//
//   1. GIỮ BỘ MÁY. Bảng quay ra phải là 16 xác giáp, 6 cái 5★, và phân bố `thu` phải TRÙNG
//      KHÍT bảng Chimera cũ — đợt này đổi THỨ QUAY RA, không đổi cân bằng. Lệch một con số
//      là âm thầm buff/nerf cả hệ trong một lần deploy.
//   2. XOÁ ĐÚNG PHẦN CHIMERA. Quay một nghìn lượt không được rơi ra một id Chimera nào.
//   3. KHÔNG MẤT TIẾN TRÌNH. Save đời cũ (túi Chimera, con đang gắn, lịch sử quay) phải đổi
//      MỘT-ĐỔI-MỘT sang xác giáp, giữ nguyên Cộng Hưởng · cấp · Hoá · mảnh Cốt đã khảm.
//   4. CÓ HÌNH THẬT. Icon xác giáp phải vẽ ra pixel, và phải LÀ icon món trong ITEM_DB — dùng
//      chung một nguồn với túi đồ. Bóng đen của nhịp "hiện hình" phải ôm đúng đường bao đó.
//
// Và một lời hứa ngầm: CHIMERA vẫn sống, vì avatar (thân Axie người chơi nhìn thấy) đọc nó.
const { chromium } = require('playwright');
let loi = 0;
const pass = m => console.log('PASS ' + m);
const fail = m => { console.log('FAIL ' + m); loi++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', { name:'Đo' }); });

  // ── 1. hình dạng bảng + phân bố bị động giữ y như cũ ──────────────────────
  const r1 = await p.evaluate(() => {
    const dem = a => { const m = {}; for (const c of a) m[c.sao + ':' + c.thu.k + ':' + c.thu.v]
      = (m[c.sao + ':' + c.thu.k + ':' + c.thu.v] || 0) + 1; return m; };
    return {
      n: COVAT.length, n5: COVAT.filter(c => c.sao === 5).length,
      id: [...new Set(COVAT.map(c => c.id))].length,
      // ⚠ so theo KHOÁ ĐÃ SẮP, không so chuỗi JSON thô: hai bảng liệt kê cùng một phân bố
      // theo thứ tự khác nhau thì chuỗi khác nhau, và bài sẽ đỏ vì một chuyện không có thật.
      cu: (a => JSON.stringify(Object.keys(a).sort().map(k => k + '=' + a[k])))(dem(CHIMERA))
       === (a => JSON.stringify(Object.keys(a).sort().map(k => k + '=' + a[k])))(dem(COVAT)),
      thieuKy:  COVAT.filter(c => !CHI_KY[c.dong]).map(c => c.id),
      thieuDong: COVAT.filter(c => !CV_DONG[c.dong]).map(c => c.id),
      // pool banner phải nằm trong bảng và không chồng nhau
      poolOk: CHI_VINHCUU5.every(i => CV_MAP[i] && CV_MAP[i].sao === 5)
           && CHI_KE5.every(i => CV_MAP[i] && CV_MAP[i].sao === 5)
           && !CHI_VINHCUU5.some(i => CHI_KE5.includes(i)),
    };
  });
  console.log('1)', JSON.stringify(r1));
  (r1.n === 16 && r1.n5 === 6 && r1.id === 16) ? pass('16 Cổ Vật, 6 cái 5★, id không trùng')
    : fail(`bảng sai hình dạng: ${r1.n} cái / ${r1.n5} cái 5★ / ${r1.id} id`);
  r1.cu ? pass('phân bố bị động TRÙNG KHÍT bảng Chimera cũ — không đổi cân bằng')
        : fail('phân bố `thu` lệch so với bảng cũ ⇒ đợt này đã âm thầm đổi cân bằng');
  (!r1.thieuKy.length && !r1.thieuDong.length) ? pass('mọi dòng giáp đều có CV_KY và CV_DONG')
    : fail('dòng thiếu bảng: ky=' + r1.thieuKy + ' dong=' + r1.thieuDong);
  r1.poolOk ? pass('pool Vĩnh Cửu và pool kệ đều là 5★ và không chồng nhau')
            : fail('pool banner sai');

  // ── 2. quay không bao giờ rơi ra Chimera ──────────────────────────────────
  const r2 = await p.evaluate(() => {
    const C = chiState(); C.co = {}; C.eq = null; C.su = [];
    C.pity5 = C.pity4 = C.pity5s = C.pity4s = 0; C.bd = false;
    const chi = new Set(CHIMERA.map(c => c.id));
    const la = new Set(); let n5 = 0, n4 = 0;
    for (let i = 0; i < 1000; i++){
      const x = gachaMotLuot('gk');
      if (!x.id) continue;
      if (chi.has(x.id) || !CV_MAP[x.id]) la.add(x.id);
      if (x.sao === 5) n5++; else if (x.sao === 4) n4++;
    }
    return { la: [...la], n5, n4, ten3: gachaMotLuot('gk').sao === 3 ? 'ok' : 'ok' };
  });
  console.log('2)', JSON.stringify({ la: r2.la, n5: r2.n5, n4: r2.n4 }));
  r2.la.length ? fail('quay ra id không thuộc bảng Cổ Vật: ' + r2.la.join(', '))
               : pass(`1000 lượt: ${r2.n5} cái 5★ · ${r2.n4} cái 4★, không một id Chimera nào`);

  // ── 3. save đời Chimera đổi sang Cổ Vật, không mất một thứ gì ─────────────
  const r3 = await p.evaluate(() => {
    startGame('thieulam', null); player.level = 60; player.lvPeak = 60;
    const saved = JSON.parse(JSON.stringify(player));
    // save ĐỜI CŨ: túi ba con, một con đang gắn, có Cộng Hưởng · cấp · Hoá · một mảnh Cốt
    saved.chimera = {
      eq:'tidewarden', out:true, ve:{ gk:7, cx:2 },
      pity5:31, pity4:4, bd:true, pity5s:0, pity4s:0, nguyet:25, tinh:60,
      su:[{ t:Date.now(), b:'gk', id:'tidewarden', sao:5 }, { t:Date.now(), b:'gk', id:'petalkin', sao:4 }],
      kho:[],
      co:{
        tidewarden:{ con:3, lv:42, xp:11, hoa:2,
          cot:{ sung:{ uid:9001, o:'sung', dong:'regai', pham:'co', plus:6, xp:0, phu:[{k:'atkPct',v:3}] },
                vuot:null, vay:null, duoi:null } },
        petalkin:{ con:1, lv:7, xp:0, hoa:0 },
        aurelion:{ con:0, lv:1, xp:0, hoa:0 },
      },
    };
    localStorage.setItem('vlcm_save', JSON.stringify({ v:SAVE_COMPAT, player:saved, curMap, sideStates, savedAt:Date.now() }));
    const ok = loadGame();
    const C = chiState();
    const o = C.co[CV_CU.tidewarden];
    return { ok, co:Object.keys(C.co).sort(), eq:C.eq,
             con:o && o.con, lv:o && o.lv, hoa:o && o.hoa,
             cot:!!(o && o.cot && o.cot.sung && o.cot.sung.uid === 9001),
             su:(C.su || []).map(h => h.id),
             pity5:C.pity5, ve:C.ve.gk,
             laChi:Object.keys(C.co).filter(id => !CV_MAP[id]) };
  });
  console.log('3)', JSON.stringify(r3));
  if (!r3.ok) fail('không nạp được save đời Chimera');
  (r3.co.length === 3 && !r3.laChi.length)
    ? pass('ba con cũ đổi thành ba xác giáp, không sót id lạ: ' + r3.co.join(', '))
    : fail('túi sau di trú sai: ' + JSON.stringify(r3.co) + ' — id lạ: ' + r3.laChi.join(', '));
  (r3.eq === 'cv_haicot') ? pass('con đang gắn đổi đúng sang cv_haicot')
                          : fail('eq sau di trú là ' + r3.eq + ', phải là cv_haicot');
  (r3.con === 3 && r3.lv === 42 && r3.hoa === 2 && r3.cot)
    ? pass('giữ nguyên Cộng Hưởng R3 · cấp 42 · Hoá 2 · mảnh Cốt đã khảm')
    : fail(`mất tiến trình: con=${r3.con} lv=${r3.lv} hoa=${r3.hoa} cot=${r3.cot}`);
  (r3.su.length === 2 && r3.su.every(id => id.startsWith('cv_')))
    ? pass('lịch sử quay đổi theo, không còn tên con vật')
    : fail('lịch sử quay chưa di trú: ' + JSON.stringify(r3.su));
  (r3.pity5 === 31 && r3.ve === 7) ? pass('pity và vé giữ nguyên')
                                   : fail(`pity/vé lệch: ${r3.pity5} / ${r3.ve}`);

  // ── 4. icon thật, dùng chung nguồn với túi đồ ─────────────────────────────
  const r4 = await p.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400;
    const q = cv.getContext('2d');
    const dem = (f) => { q.clearRect(0,0,400,400); f();
      const d = q.getImageData(0,0,400,400).data;
      let dac = 0, sang = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i+3] > 60){ dac++; if (d[i]+d[i+1]+d[i+2] > 150) sang++; }
      return { dac, sang }; };
    const trong = [], thieuArt = [], hoBong = [];
    for (const c of COVAT){
      if (!ITEM_DB[c.art]){ thieuArt.push(c.id); continue; }
      const a = dem(() => cvVe(q, c.id, 200, 200, 280, false));
      if (a.dac < 800) trong.push(c.id + ':' + a.dac);
      const bg = dem(() => cvVe(q, c.id, 200, 200, 280, true));
      // bóng phải ôm ĐÚNG đường bao (±2%) và phải tối
      if (Math.abs(bg.dac - a.dac) > a.dac * 0.02 || bg.sang > bg.dac * 0.02)
        hoBong.push(`${c.id}:${bg.sang}/${bg.dac} vs ${a.dac}`);
    }
    // cùng nguồn với túi đồ: URL icon của xác phải TRÙNG KHÍT itemArtUrl của chính món đó
    const c0 = COVAT[0];
    const chung = cvIconUrl(c0.id) === itemArtUrl(ITEM_DB[c0.art], c0.giai, 0, 0, 1);
    return { trong, thieuArt, hoBong, chung };
  });
  console.log('4)', JSON.stringify({ trong:r4.trong, thieuArt:r4.thieuArt, hoBong:r4.hoBong, chung:r4.chung }));
  r4.thieuArt.length ? fail('trỏ vào món không có trong ITEM_DB: ' + r4.thieuArt.join(', '))
                     : pass('cả 16 xác trỏ vào một món thật trong ITEM_DB');
  r4.trong.length ? fail('icon vẽ ra gần như trống: ' + r4.trong.join(', '))
                  : pass('cả 16 icon vẽ ra hình đặc');
  r4.hoBong.length ? fail('bóng đen lệch đường bao hoặc hở màu: ' + r4.hoBong.join(', '))
                   : pass('bóng đen ôm đúng đường bao và phủ kín');
  r4.chung ? pass('icon xác giáp DÙNG CHUNG đường vẽ với túi đồ')
           : fail('icon xác giáp dựng bằng một đường riêng — hai chỗ sẽ lệch nhau');

  // ── 5. avatar không chết theo ────────────────────────────────────────────
  const r5 = await p.evaluate(() => ({
    chi: CHIMERA.length,
    ava: Object.keys(AVA_MAC_DINH).length,
    hopLe: Object.values(AVA_MAC_DINH).every(id => CHI_MAP[id] && CHI_ANH.o[id]),
  }));
  console.log('5)', JSON.stringify(r5));
  (r5.chi === 16 && r5.ava === 5 && r5.hopLe)
    ? pass('bảng CHIMERA vẫn sống làm danh mục avatar cho cả 5 lớp')
    : fail('avatar hỏng theo: ' + JSON.stringify(r5));

  console.log('errors:', errs);
  if (errs.length) fail('lỗi trang: ' + errs.join(' | '));
  console.log(loi ? `FAIL(${loi})` : 'ALL PASS');
  await b.close();
  process.exit(loi ? 1 : 0);
})();
