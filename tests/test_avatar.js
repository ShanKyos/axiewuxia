// AVATAR AXIE — cỡ phải khoá theo HỘP VẼ RA, cả cao lẫn rộng, cho CẢ 16 con.
//
// Bài này thay cho test_cothu.js đời trước. Bài cũ gác luật "Chimera đi theo không bao giờ được
// lấn át nhân vật" — con pet đó đã gỡ hẳn, nên luật ấy hết đối tượng. Nhưng CÁCH gác thì vẫn
// đúng và nay còn cần hơn: Axie giờ LÀ thân người chơi, nó đứng cạnh lớp nhân vật hiện ra lúc
// đánh, và hai thứ THAY CHỖ NHAU trong mắt người chơi. Lệch khối là mỗi cú đánh một cú giật cỡ.
//
// 16 con nướng ra 16 tỉ lệ rộng/cao (1,07 → 1,52), nên khoá mỗi chiều cao THÂN là chưa đủ —
// đúng cái sai đã mắc: để AVA_TY = 1,0 thì con rộng nhất vẽ ra ~107px ngang trong khi thân
// người chỉ 38px. Kiểm theo hộp thì con nướng thêm sau này cũng tự nằm trong luật.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { console.log('FAIL ' + m); bad++; };
const pass = m => console.log('PASS ' + m);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(400);

  const r = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('baidasan', null); player.level = 60; calcDerived();
    const o = { than: NV_THAN_PX, tran: AVA_TRAN, ty: AVA_TY, con: [], macDinh: {} };
    for (const id in CHI_ANH.o){
      const A = CHI_ANH.o[id], t = avaCo(id);
      const cao = t / A.thanCao, rong = cao * (A.nhoRong / A.nhoCao);
      // ⚠ ĐỪNG làm tròn trước khi so với trần. Trần là `NV_THAN_PX × AVA_TRAN` = 133,56 mà
      // 133,559 làm tròn một chữ số ra 133,6 — tức bài đỏ vì phép làm tròn của chính nó, đúng
      // ở con nằm SÁT mép, tức 14/16 con. Giữ nguyên số, chỉ làm tròn lúc IN.
      o.con.push({ id, than: t, cao, rong, ty: A.nhoRong / A.nhoCao });
    }
    // Mỗi lớp phải có một avatar mặc định, và nó phải là con CÓ THẬT.
    for (const sk in SECTS) o.macDinh[sk] = AVA_MAC_DINH[sk] || null;
    return o;
  });
  const in1 = c => ({ id: c.id, than: +c.than.toFixed(1), cao: +c.cao.toFixed(1),
                      rong: +c.rong.toFixed(1), ty: +c.ty.toFixed(3) });
  console.log('cỡ 16 con:', JSON.stringify(r.con.slice(0, 3).map(in1)), '… (' + r.con.length + ' con)');
  const tran = r.than * r.tran;

  const qua = r.con.filter(c => c.cao > tran + 0.01 || c.rong > tran + 0.01);
  if (qua.length) fail(`${qua.length} con vượt trần ${tran.toFixed(0)}px: ` +
    qua.map(c => `${c.id} ${c.rong.toFixed(1)}×${c.cao.toFixed(1)}`).join(', '));
  else pass(`cả ${r.con.length} con nằm trong trần ${tran.toFixed(0)}px = ${r.tran}×thân người`);

  // Trần phải THỰC SỰ bó ai đó. Nếu không con nào chạm trần thì nó chỉ là một con số trang trí,
  // và lần tới ai nới AVA_TY lên sẽ không có gì chặn lại.
  const cham = r.con.filter(c => Math.max(c.cao, c.rong) > tran - 1);
  if (!cham.length) fail('trần không bó con nào — nó đang là số trang trí, không phải luật');
  else pass(`trần bó thật: ${cham.length}/${r.con.length} con bị thu về đúng mép`);

  // Đừng thu tới mức thành hạt bụi: Axie là NHÂN VẬT CHÍNH, không phải thú cưng.
  const be = r.con.filter(c => Math.max(c.cao, c.rong) < r.than * 0.55);
  if (be.length) fail(`thu quá tay, ${be.length} con nhỏ hơn 55% thân người: ` + be.map(c => c.id).join(', '));
  else pass('không con nào bị thu quá tay (đều ≥ 55% thân người)');

  const thieu = Object.entries(r.macDinh).filter(([, v]) => !v || !r.con.some(c => c.id === v));
  if (thieu.length) fail('lớp thiếu avatar mặc định hợp lệ: ' + thieu.map(x => x[0]).join(', '));
  else pass(`cả ${Object.keys(r.macDinh).length} lớp có avatar mặc định, và đều là con có thật`);

  const trung = new Set(Object.values(r.macDinh));
  if (trung.size !== Object.keys(r.macDinh).length)
    fail('hai lớp dùng chung một avatar mặc định — ngoài đường không phân biệt được lớp');
  else pass('năm lớp năm con khác nhau');

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  if (errors.length) fail(`${errors.length} lỗi JS trong lúc chạy`);
  await browser.close();
  if (bad){ console.log(`FAIL(${bad})`); process.exit(1); }
  console.log('PASS');
})();
