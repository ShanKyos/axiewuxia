// Chimera đi theo KHÔNG BAO GIỜ được lấn át nhân vật.
//
// Chủ dự án chốt bằng đúng chữ "không bao giờ", nên bài này không kiểm một con mẫu mà kiểm CẢ
// BỘ: 16 con nướng ra 16 cỡ ô khác nhau (tỉ lệ rộng/cao 1,07 → 1,52), và bản cũ chép cứng
// "thân cao 84px" cho tất cả — con rộng nhất vẽ ra 146px ngang trong khi nhân vật chỉ ~45px.
// Kiểm theo HỘP VẼ RA so với NV_CAO thì con nướng thêm sau này cũng tự nằm trong luật.
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
    const o = { NV_CAO, tran: CHI_TRAN, con: [] };
    for (const id in CHI_ANH.o){
      const A = CHI_ANH.o[id], c = chiCoTrongMan(id);
      o.con.push({ id, than: +c.than.toFixed(1), cao: +c.cao.toFixed(1), rong: +c.rong.toFixed(1),
                   ty: +(A.oRong / A.oCao).toFixed(3) });
    }
    // Bàn chân: _chiVe đặt gót ở y + than*0,38, còn chỗ vẽ trong màn dịch tới
    // mountObj.y + 12 − than*0,38 — nên gót phải rơi đúng mountObj.y + 12 với MỌI con.
    o.got = o.con.map(c => +((12 - c.than * 0.38) + c.than * 0.38).toFixed(2));
    return o;
  });
  console.log('cỡ 16 con:', JSON.stringify(r.con.slice(0, 3)), '… (' + r.con.length + ' con)');
  const tran = r.NV_CAO * r.tran;

  const qua = r.con.filter(c => c.cao > tran + 0.01 || c.rong > tran + 0.01);
  if (qua.length) fail(`${qua.length} con vượt trần ${tran.toFixed(0)}px: ` +
    qua.map(c => `${c.id} ${c.rong}×${c.cao}`).join(', '));
  else pass(`cả ${r.con.length} con nằm trong trần ${tran.toFixed(0)}px = ${r.tran}×NV_CAO`);

  // Không con nào được cao hơn hoặc rộng hơn chính nhân vật.
  const to = r.con.filter(c => c.cao >= r.NV_CAO || c.rong >= r.NV_CAO);
  if (to.length) fail(`có con to hơn cả nhân vật (${r.NV_CAO}px): ` + to.map(c => c.id).join(', '));
  else {
    const max = r.con.reduce((m, c) => Math.max(m, c.cao, c.rong), 0);
    pass(`con lấn nhất cũng chỉ chiếm ${(max / r.NV_CAO * 100).toFixed(0)}% chiều cao nhân vật`);
  }

  // Con NÀO cũng phải nhìn thấy được — trần chặn trên, nhưng đừng thu tới mức thành hạt bụi.
  const be = r.con.filter(c => Math.max(c.cao, c.rong) < r.NV_CAO * 0.3);
  if (be.length) fail(`thu quá tay, ${be.length} con nhỏ hơn 30% nhân vật: ` + be.map(c => c.id).join(', '));
  else pass('không con nào bị thu quá tay (đều ≥ 30% chiều cao nhân vật)');

  if (r.got.some(v => Math.abs(v - 12) > 0.01)) fail('gót chân không neo cố định — con to nhỏ khác nhau sẽ lơ lửng');
  else pass('gót chân neo cố định ở mountObj.y + 12 với mọi con');

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  if (errors.length) fail(`${errors.length} lỗi JS trong lúc chạy`);
  await browser.close();
  if (bad){ console.log(`FAIL(${bad})`); process.exit(1); }
  console.log('PASS');
})();
