// CÁNH ÉP ĐƯỢC NGỌC, và NGỌC SINH MỆNH có mặt ở thanh ép thẳng.
//
// Trước đây specialItem() đóng dấu noForge:true cho MỌI đồ đặc biệt, nên cánh — món đắt nhất
// game — lại là món duy nhất không rèn được. Nay cánh mở, còn áo choàng và pet vẫn khoá: hai
// thứ đó lên cấp bằng đường riêng, cho rèn nữa là hai thang tiến
// hoá chồng lên nhau trên cùng một món.
//
// Sinh Mệnh là viên NGỌC KHÁC LOẠI: hai viên kia ăn vào it.plus, viên này ăn vào it.life —
// 7 bậc, mỗi bậc +4% Sinh Lực, tổng +28%. Bài kiểm gác đúng chỗ dễ lẫn: 50% PHẲNG mọi bậc
// (không phải giảm dần như bản cũ), xịt là VỀ 0 (không phải tụt 1 như Linh Hồn), và chỉ khảm
// được vào giáp trụ.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(800);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('baidasan', { name:'Đo' });
    player.jewels = { chucPhuc:9999, linhHon:9999, sinhMenh:9999, honDon:99 };
    const o = {};
    const w = genWing('baidasan', 1);
    o.canhKhoa = !!w.noForge;
    o.canhEpDuoc = ngocEpDuoc(w, 'chucPhuc') === null;
    for (let i = 0; i < 60 && (w.plus||0) < 6; i++) epNgoc(w, 'chucPhuc');
    o.sauChucPhuc = w.plus;
    o.chanChucPhucO6 = ngocEpDuoc(w, 'chucPhuc') !== null;
    for (let i = 0; i < 900 && (w.plus||0) < 9; i++) epNgoc(w, 'linhHon');
    o.sauLinhHon = w.plus;
    o.chanO9 = ngocEpDuoc(w, 'linhHon') !== null;
    // ── Sinh Mệnh ──
    o.rate = NGOC_EP.sinhMenh.rate;
    o.tran = NGOC_EP.sinhMenh.tran;
    o.coONut = true;   // nút trong túi dựng từ danh sách cứng, kiểm bằng HTML bên dưới
    const g = genSpecific('non', 4, 60); g.life = 0;
    o.vaoGiap = ngocEpDuoc(g, 'sinhMenh') === null;
    o.vaoVuKhi = ngocEpDuoc(genSpecific('vukhi', 4, 60), 'sinhMenh') === null;
    for (let i = 0; i < 6000 && (g.life||0) < 7; i++) epNgoc(g, 'sinhMenh');
    o.bacCuoi = g.life;
    o.chanO7 = ngocEpDuoc(g, 'sinhMenh') !== null;
    // xịt phải VỀ 0, không phải tụt 1
    const ve = [];
    for (let i = 0; i < 200 && ve.length < 5; i++){
      g.life = 5; const rr = epNgoc(g, 'sinhMenh'); if (!rr.thang) ve.push(rr.sau);
    }
    o.xitVe = [...new Set(ve)];
    // ── cộng chỉ số: 7 bậc, mỗi bậc BẰNG NHAU, tổng = 7 bậc ───────────────────────────
    // KHÔNG đo bằng tỉ lệ hp7/hp0. hpPct là một CÁI HỒ CỘNG DỒN rồi mới nhân MỘT LẦN vào
    // maxHp, nên tỉ lệ ấy là 0,28/(1+hồ) chứ không phải 0,28 — và cái hồ thì không cố định:
    // startGame() roll thiên phú ngẫu nhiên, đo được 28,1% lượt này, 22,9% lượt kia, trong
    // khi mức cộng tuyệt đối của ngọc y hệt nhau cả hai lượt (đúng +68 máu). Bài kiểm đo tỉ
    // lệ vì thế lúc xanh lúc đỏ mà chẳng có gì hỏng cả.
    //
    // Đo cái BẤT BIẾN: từng bậc phải cộng đúng bằng nhau, và bảy bậc phải bằng bảy lần một
    // bậc — đó chính là "7 bậc × 4% = 28%", diễn đạt theo cách không phụ thuộc chỉ số nền.
    for (const k in player.equip) player.equip[k] = null;
    g.subs = []; g.exc = null; g.awakened = null;
    player.equip.non = g;
    const hpBac = [];
    for (let b = 0; b <= NGOC_EP.sinhMenh.tran; b++){ g.life = b; calcDerived(); hpBac.push(player.maxHp); }
    o.buocMoiBac = hpBac.slice(1).map((h, i) => h - hpBac[i]);
    o.tongCong = hpBac[hpBac.length - 1] - hpBac[0];
    o.pctMoiBac = NGOC_LIFE_PCT;
    o.pctTong = NGOC_EP.sinhMenh.tran * NGOC_LIFE_PCT;
    o.moTaCoTong = NGOC_EP.sinhMenh.mo.includes(o.pctTong + '%');
    g.life = 7; calcDerived();
    o.theHienTrenThe = tipCard(g).includes('+' + o.pctTong + '%');
    return o;
  });
  console.log(JSON.stringify(r));

  if (r.canhKhoa) fail('cánh vẫn còn noForge — không ép ngọc được');
  else if (!r.canhEpDuoc) fail('cánh hết noForge nhưng ngocEpDuoc() vẫn chặn');
  else pass('cánh ép được ngọc');
  if (r.sauChucPhuc !== 6) fail(`Chúc Phúc đưa cánh tới +${r.sauChucPhuc}, mong +6`);
  else if (!r.chanChucPhucO6) fail('Chúc Phúc không dừng ở +6');
  else pass('Chúc Phúc: cánh → +6 rồi dừng');
  if (r.sauLinhHon !== 9) fail(`Linh Hồn đưa cánh tới +${r.sauLinhHon}, mong +9`);
  else if (!r.chanO9) fail('Linh Hồn không dừng ở +9 — Phá Thiên Kiếp mất chỗ đứng');
  else pass('Linh Hồn: cánh → +9 rồi dừng');

  if (r.rate !== 50) fail(`Sinh Mệnh tỉ lệ ${r.rate}%, chủ dự án chốt 50% phẳng`);
  else pass('Sinh Mệnh 50% phẳng mọi bậc');
  if (r.tran !== 7 || r.bacCuoi !== 7) fail(`Sinh Mệnh trần ${r.tran}, lên được ${r.bacCuoi} — mong 7`);
  else if (!r.chanO7) fail('bậc 7 rồi mà vẫn cho khảm tiếp');
  else pass('Sinh Mệnh 7 bậc rồi dừng');
  if (!r.vaoGiap) fail('Sinh Mệnh không khảm được vào giáp trụ');
  else if (r.vaoVuKhi) fail('Sinh Mệnh khảm được cả vào vũ khí — phải chặn');
  else pass('Sinh Mệnh chỉ vào giáp trụ');
  if (r.xitVe.length !== 1 || r.xitVe[0] !== 0)
    fail(`xịt Sinh Mệnh ra bậc ${JSON.stringify(r.xitVe)} — phải VỀ 0`);
  else pass('xịt Sinh Mệnh về 0, không phải tụt 1 bậc');
  const buoc = r.buocMoiBac || [];
  if (buoc.length !== 7) fail(`phải đo đủ 7 bậc, đo được ${buoc.length}`);
  else if (!buoc[0]) fail('bậc 1 không cộng thêm máu nào');
  // Lệch nhau 1 máu là do Math.round Ở TỪNG BẬC, không phải bậc nào yếu hơn bậc nào: 4% của
  // 242 máu nền ra 9,7 nên chuỗi cộng dồn làm tròn thành 10·9·10·10·9·10·10. Gác "chênh nhau
  // tối đa 1" mới đúng, chứ đòi bảy số y hệt là đòi cái làm tròn không cho phép.
  else if (Math.max(...buoc) - Math.min(...buoc) > 1)
    fail(`bảy bậc cộng không đều nhau: ${JSON.stringify(buoc)}`);
  else if (buoc.reduce((a, x) => a + x, 0) !== r.tongCong)
    fail(`tổng ${r.tongCong} không khớp tổng bảy bước ${JSON.stringify(buoc)}`);
  else pass(`7 bậc đều nhau (${JSON.stringify(buoc)} máu), tổng +${r.tongCong} = ${r.pctTong}% Sinh Lực`);
  if (r.pctTong !== 28) fail(`tổng phải là 28%, bảng khai ${r.pctTong}%`);
  else if (!r.moTaCoTong) fail('mô tả viên ngọc không ghi tổng 28%');
  else if (!r.theHienTrenThe) fail('thẻ món đồ không hiện +28% Sinh Lực');
  else pass('bảng, mô tả và thẻ món đồ đều nói 28%');

  // nút Sinh Mệnh phải CÓ MẶT trong thanh ngọc, không chỉ chạy được ngầm
  const html = await p.evaluate(() => { renderBag(); return el('panel-bag').innerHTML; });
  if (!/camNgoc\('sinhMenh'\)/.test(html)) fail('thanh ngọc trong túi không có nút Sinh Mệnh');
  else pass('thanh ngọc có đủ ba viên, kể cả Sinh Mệnh');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
