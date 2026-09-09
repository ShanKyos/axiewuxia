// NHÃN TÊN KHÔNG ĐƯỢC CHỒNG NHAU, VÀ KHÔNG ĐƯỢC TRÈO LÊN DẢI HUD.
//
// Ardhaven có 26 NPC trong một màn. Trước đây mỗi nhãn ghim cứng trên đỉnh đầu, nên ở chỗ đông
// chúng chồng thành mảng chữ không đọc nổi chữ nào — và nhãn của người đứng sát mép trên còn
// chui thẳng vào chữ "Sapidae Chiefdom" của HUD.
//
// Bài này KHÔNG so ảnh. Nó gọi thẳng bộ đặt nhãn rồi soi các ô chữ đã đặt, nên không phụ thuộc
// vào phông chữ hay lần vẽ.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const loi = [];
  page.on('pageerror', e => loi.push(String(e)));
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  let bad = 0;
  const fail = m => { console.log('FAIL ' + m); bad++; };
  const pass = m => console.log('PASS ' + m);

  // Bẫy đo lại các ô chữ mà veNhanNpc() đặt ra, bằng cách chèn tay vào ctx.
  const r = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    travelTo('ardhaven');
    // Nhắm camera vào CHỖ ĐÔNG NHẤT, không phải điểm thả. Ở điểm thả các NPC thưa nên phép
    // kiểm chồng nhau không bao giờ được thử — bài kiểm sẽ xanh cả khi luật tránh chồng đã bị
    // gỡ. (Đã thử phá tay để xác nhận đúng chuyện đó.)
    const ds = NPCS.filter(n => n.map === 'ardhaven');
    let tam = ds[0], nhieu = -1;
    for (const a of ds){
      const d = ds.filter(b => Math.abs(b.x - a.x) < 260 && Math.abs(b.y - a.y) < 200).length;
      if (d > nhieu){ nhieu = d; tam = a; }
    }
    player.x = tam.x; player.y = tam.y;
    camera.x = tam.x - 640; camera.y = tam.y - 450;

    const o = [];
    const cuF = ctx.fillText.bind(ctx), cuM = ctx.measureText.bind(ctx);
    ctx.fillText = function(t, x, y){
      o.push({ t, x, y, w: cuM(t).width });
      return cuF(t, x, y);
    };
    drawNpc();
    ctx.fillText = cuF;

    const ten = new Set(NPCS.filter(n => n.map === 'ardhaven').map(n => n.name));
    return { nhan: o.filter(v => ten.has(v.t)),
             tongNpc: ds.length, dong: nhieu, tam: tam.name,
             tranTren: camera.y + 64, camY: camera.y };
  });
  console.log(`camera nhắm vào "${r.tam}" — chỗ đông nhất, ${r.dong} NPC quanh đó`);
  console.log('đặt được', r.nhan.length, 'nhãn /', r.tongNpc, 'NPC trong map');

  // Chỉ hỏi "bộ đặt nhãn có chạy không". KHÔNG chốt một con số cụ thể: veNhanNpc() cắt bỏ người
  // ngoài khung nhìn, nên số nhãn đổi theo chỗ camera đang đứng — chốt số là bài kiểm sẽ đỏ vì
  // lý do vô nghĩa.
  if (!r.nhan.length) fail('không nhãn nào được đặt — bộ đặt nhãn không chạy');
  else pass(`bộ đặt nhãn chạy, ra ${r.nhan.length} nhãn cho người trong khung nhìn`);

  // ── 1. DỰNG SẴN MỘT CỤM CHEN CHÚC rồi mới đo ──────────────────────────────────────────
  // ⚠ Đo trên bố cục Ardhaven thật thì phép này KHÔNG BAO GIỜ ĐỎ ĐƯỢC: 26 NPC trải trên map
  // 6400×3200, đo ra 0 cặp nào đủ gần để nhãn đụng nhau (đã thử phá tay luật tránh chồng, bài
  // vẫn xanh). Một phép kiểm không thể đỏ thì không kiểm cái gì cả. Nên ở đây dựng hẳn một cụm
  // bốn người đứng sát nhau — đúng cảnh mà luật tránh chồng sinh ra để lo — rồi mới đo.
  const cum = await page.evaluate(() => {
    const goc = NPCS.filter(n => n.map === curMap).slice(0, 4);
    const bx = player.x, by = player.y;
    // Vẽ một lượt cho n._cao có giá trị (chiều cao hình mỗi người một khác), rồi mới xếp chỗ.
    goc.forEach((n, i) => { n.x = bx - 30 + i * 20; n.y = by + 60; });
    drawNpc();
    // ⚠ Bù đúng chiều cao hình để CẢ BỐN CÙNG ĐÒI MỘT MỨC Y. Không bù thì mỗi nhãn tự rơi một
    // độ cao khác nhau và chẳng bao giờ đụng nhau — phép kiểm sẽ xanh cả khi luật tránh chồng
    // đã bị gỡ, tức là không kiểm gì cả. Bù xong thì bốn nhãn buộc phải tranh đúng một chỗ.
    goc.forEach((n, i) => { n.x = bx - 30 + i * 20; n.y = by + 60 + (n._cao || 64); });
    const o = [];
    const cuF = ctx.fillText.bind(ctx), cuM = ctx.measureText.bind(ctx);
    ctx.fillText = function(t, x, y){ o.push({ t, x, y, w: cuM(t).width }); return cuF(t, x, y); };
    drawNpc();
    ctx.fillText = cuF;
    const ten = new Set(goc.map(n => n.name));
    return { nhan: o.filter(v => ten.has(v.t)), ten: [...ten] };
  });
  console.log('cụm chen chúc:', cum.ten.join(' · '), '→ đặt được', cum.nhan.length, 'nhãn');
  const dungCum = [];
  for (let i = 0; i < cum.nhan.length; i++)
    for (let j = i + 1; j < cum.nhan.length; j++){
      const a = cum.nhan[i], b = cum.nhan[j];
      if (Math.abs(a.y - b.y) < 15 && a.x - a.w/2 < b.x + b.w/2 && a.x + a.w/2 > b.x - b.w/2)
        dungCum.push(`"${a.t}" ⨯ "${b.t}"`);
    }
  if (!cum.nhan.length) fail('dựng cụm xong mà không nhãn nào được đặt');
  else if (dungCum.length) fail(`bốn người đứng sát nhau ⇒ ${dungCum.length} cặp nhãn chồng: ` + dungCum.join(' · '));
  else pass(`bốn người đứng sát nhau vẫn tách được ${cum.nhan.length} nhãn không cặp nào chồng`);

  // ── 2. Bố cục thật: cũng không đôi nào chồng ──────────────────────────────────────────
  const chong = [];
  for (let i = 0; i < r.nhan.length; i++)
    for (let j = i + 1; j < r.nhan.length; j++){
      const a = r.nhan[i], b = r.nhan[j];
      if (Math.abs(a.y - b.y) < 15 &&
          a.x - a.w/2 < b.x + b.w/2 && a.x + a.w/2 > b.x - b.w/2)
        chong.push(`"${a.t}" ⨯ "${b.t}"`);
    }
  if (chong.length) fail(`${chong.length} cặp nhãn chồng nhau: ` + chong.slice(0, 4).join(' · '));
  else pass('không cặp nhãn nào chồng nhau');

  // ── 3. Không nhãn nào trèo lên dải HUD (64px trên cùng) ────────────────────────────────
  const treo = r.nhan.filter(v => v.y < r.tranTren).map(v => `"${v.t}" ở y=${Math.round(v.y)}`);
  if (treo.length) fail(`${treo.length} nhãn chui vào dải HUD (trần y=${Math.round(r.tranTren)}): ` + treo.slice(0,3).join(' · '));
  else pass(`không nhãn nào trèo lên dải HUD (trần y=${Math.round(r.tranTren)})`);

  // ── 4. Bản đồ thu nhỏ: map đông thì chỉ gọi tên người CÓ VIỆC ──────────────────────────
  const mini = await page.evaluate(() => {
    const o = [];
    const g = miniCtx;
    const cuF = g.fillText.bind(g);
    g.fillText = function(t, x, y){ o.push(t); return cuF(t, x, y); };
    drawMinimap();
    g.fillText = cuF;
    const ds = NPCS.filter(n => n.map === curMap);
    const ten = new Set(ds.map(n => n.name));
    return { veTen: o.filter(t => ten.has(t)), tong: ds.length };
  });
  console.log('bản đồ thu nhỏ gọi tên:', JSON.stringify(mini.veTen));
  if (mini.tong <= 8) pass('map thưa — không áp luật lọc');
  else if (mini.veTen.length > 6)
    fail(`map ${mini.tong} NPC mà bản đồ thu nhỏ ghi ${mini.veTen.length} tên — lại thành mảng chữ`);
  else pass(`map ${mini.tong} NPC, bản đồ thu nhỏ chỉ ghi ${mini.veTen.length} tên đáng ghi`);

  console.log('lỗi trang:', JSON.stringify(loi.slice(0, 5)));
  if (loi.length) fail(loi.length + ' lỗi runtime');
  await browser.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
