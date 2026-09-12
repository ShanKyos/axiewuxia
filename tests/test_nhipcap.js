// NHỊP CẤP — bánh cóc cho bảng XP_TABLE và XP nhiệm vụ.
//
// Bảng cấp trong game.js và XP nhiệm vụ trong data/canbang.js là HAI NỬA của MỘT phép tính
// (xem tools/do_nhipcap.cjs + tools/can_exp.cjs). Sửa một nửa thì mốc "3 giờ tới cấp 60" nói dối
// ngay mà không lỗi nào báo — bài này là thứ duy nhất bắt được chuyện đó.
//
// ⚠ Bài này KHÔNG đo lại XP/giờ (mỗi lượt đo tốn hàng chục phút). Nó gác những thứ suy được từ
// dữ liệu tĩnh: hình dạng bảng, tỉ lệ nhiệm vụ gánh, và ba bức tường mà bản cũ từng có.
const { chromium } = require('playwright');

// XP/giờ đo được, khớp luật luỹ thừa (tools/do_nhipcap.cjs, 150s × 3 lượt mỗi mốc, cấp đứng yên,
// trang bị đúng cấp, AUTO). Chép vào đây để bài chạy được mà không phải đo lại.
const A = 1694.44, B = 1.945;
const rate = l => A * Math.pow(l, B);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(500);

  let bad = 0;
  const fail = m => { bad++; console.log('  ✗ ' + m); };
  const pass = m => console.log('  ✓ ' + m);

  const d = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const nv = {};
    for (const q of QUESTS)      nv[q.lv]     = (nv[q.lv]     || 0) + (q.rew.xp || 0) * 1.5;
    for (const q of SIDE_QUESTS) nv[q.reqLv]  = (nv[q.reqLv]  || 0) + (q.rew.xp || 0) * 1.5;
    return { bang: Array.from(XP_TABLE), maxLv: MAX_LV, nv };
  });
  const { bang, maxLv, nv } = d;

  // 1) bảng phải TĂNG DẦN — không cấp nào rẻ hơn cấp trước
  const tut = [];
  for (let i = 1; i < bang.length; i++) if (bang[i] < bang[i-1]) tut.push(i+1);
  console.log('1) bảng cấp:', bang.length, 'mục · cấp 1 cần', bang[0], '· cấp 119 cần', bang[118].toLocaleString('vi-VN'));
  if (bang.length !== maxLv - 1) fail(`bảng có ${bang.length} mục mà MAX_LV=${maxLv} — phải là ${maxLv-1}`);
  else pass(`bảng đủ ${maxLv-1} mục`);
  if (tut.length) fail(`cấp rẻ hơn cấp trước: ${tut.join(', ')}`);
  else pass('tăng dần ở mọi cấp');

  // 2) KHÔNG CÓ BỨC TƯỜNG. Bản cũ nhảy ×9,8 ở đúng mốc 60 (253.269 → 2.472.993) — người chơi
  //    không được báo trước một dòng nào, và đó là chỗ họ bỏ game.
  // ⚠ Đo từ cấp 10 trở lên. Ở đáy bảng luật luỹ thừa lv^1,945 tự nó cho cấp 2 đắt gấp 3,9 lần
  // cấp 1 — mà cấp 1 chỉ tốn vài chục giây, nên đó không phải bức tường, đó là số học. Chốt này
  // canh chỗ NGƯỜI CHƠI CẢM ĐƯỢC: một cấp đang tốn nửa tiếng bỗng tốn năm tiếng.
  let doc = 0, docTai = 0;
  for (let i = 10; i < bang.length; i++){ const r = bang[i]/bang[i-1]; if (r > doc){ doc = r; docTai = i+1; } }
  console.log('2) dốc nhất:', doc.toFixed(2) + '× ở cấp', docTai);
  if (doc > 1.5) fail(`cấp ${docTai} đắt gấp ${doc.toFixed(1)} lần cấp trước — một bức tường không báo trước`);
  else pass(`dốc nhất chỉ ${doc.toFixed(2)}× (trần 1,5)`);

  // 3) NHIỆM VỤ KHÔNG ĐƯỢC GÁNH THAY VIỆC CÀY. Đây là chốt của cả đợt: người chơi phải đánh quái.
  const tong = c => bang.slice(0, c-1).reduce((x,y)=>x+y, 0);
  const nvDen = c => Object.keys(nv).filter(l => +l < c).reduce((s,l)=>s+nv[l], 0);
  const phan60  = nvDen(60)  * 100 / tong(60);
  const phan120 = nvDen(120) * 100 / tong(120);
  console.log('3) nhiệm vụ gánh:', phan60.toFixed(1) + '% tới cấp 60 ·', phan120.toFixed(1) + '% cả hành trình');
  if (phan60 > 30) fail(`nhiệm vụ gánh ${phan60.toFixed(0)}% quãng 1→60 — người chơi lên cấp bằng đọc thoại, không bằng đánh quái`);
  else pass(`nhiệm vụ gánh ${phan60.toFixed(1)}% quãng 1→60 (trần 30%)`);
  if (phan60 < 5) fail(`nhiệm vụ chỉ gánh ${phan60.toFixed(1)}% — làm xong một chương mà thanh EXP không nhúc nhích`);
  else pass('nhiệm vụ vẫn đủ đáng làm');

  // 4) MỐC 3 GIỜ. Tính bằng chính luật luỹ thừa đã khớp từ số đo.
  let gioCay = 0, gioDu = 0;
  for (let l = 1; l < 60; l++){
    gioCay += bang[l-1] / rate(l);                       // bỏ hết nhiệm vụ
    gioDu  += Math.max(0, bang[l-1] - (nv[l]||0)) / rate(l);  // làm hết nhiệm vụ
  }
  let gio120 = 0;
  for (let l = 1; l < 120; l++) gio120 += Math.max(0, bang[l-1] - (nv[l]||0)) / rate(l);
  console.log(`4) tới cấp 60: ${gioDu.toFixed(2)} giờ (làm hết NV) · ${gioCay.toFixed(2)} giờ (bỏ hết) · tới 120: ${gio120.toFixed(1)} giờ`);
  if (gioDu < 2.2 || gioDu > 3.8) fail(`tới cấp 60 mất ${gioDu.toFixed(2)} giờ — mốc chốt là ~3 giờ`);
  else pass(`tới cấp 60 mất ${gioDu.toFixed(2)} giờ (mốc ~3 giờ)`);
  if (gio120 < 20 || gio120 > 50) fail(`tới cấp 120 mất ${gio120.toFixed(1)} giờ — ngoài dải 20-50 giờ`);
  else pass(`tới cấp 120 mất ${gio120.toFixed(1)} giờ`);

  // 5) THƯỞNG PHẢI THEO KỊP CẤP. Bản cũ: nhiệm vụ cấp 100 thưởng 140.000 trong khi cấp đó cần
  //    8.485.085 — 2,5% một cấp, tức "nhiệm vụ cuối game không đáng làm".
  const r5 = await p.evaluate(() => {
    const ra = [];
    for (const q of QUESTS)      ra.push({ id:q.id, lv:q.lv,    xp:(q.rew.xp||0)*1.5 });
    for (const q of SIDE_QUESTS) ra.push({ id:q.id, lv:q.reqLv, xp:(q.rew.xp||0)*1.5 });
    return ra;
  });
  const beo = r5.filter(q => q.lv >= 20 && q.xp / bang[Math.min(118, q.lv-1)] < 0.04);
  console.log('5) nhiệm vụ thưởng <4% một cấp (từ cấp 20 trở lên):', beo.length);
  if (beo.length) fail(`thưởng không theo kịp cấp: ${beo.slice(0,6).map(q=>`${q.id}(lv${q.lv}, ${(q.xp*100/bang[q.lv-1]).toFixed(1)}%)`).join(', ')}`);
  else pass('mọi nhiệm vụ từ cấp 20 đều thưởng ≥4% một cấp');

  if (errs.length) fail('lỗi trang: ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
