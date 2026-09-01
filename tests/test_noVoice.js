// Sau khi gỡ giọng hô tên chiêu kiếm hiệp: không còn yêu cầu nào tới assets/voice,
// không còn nút 🗣, và tên chiêu trong bảng K sạch từ vựng kiếm hiệp.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);
const BAN = ['ám khí','cương khí','đạn chỉ','linh tiễn','tiêu hồn','cung tiễn','chân khí','phong mạch',
             'thái cực','bát quái','ngũ hành','kinh mạch','đan điền','môn phái','giang hồ','độ kiếp',
             'phi thăng','cảnh giới','chưởng','nội lực','khí công'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; const req = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('request', r => req.push(r.url()));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(600);

  // tung đủ các chiêu để chắc chắn đường mã hô tên chiêu (nếu còn) sẽ chạy
  await p.evaluate(() => {
    travelTo('daohoa');
    for (const id of ['a','tp','amkhi','gangkhi','danchi','bow','tieuhon']){
      try { player.cd = {}; player.qi = player.maxQi; castSkill(id); } catch(e){}
    }
    for (let i = 0; i < 60; i++) update(1/60);
  });
  await p.waitForTimeout(800);

  const voice = req.filter(u => /assets\/voice\//.test(u));
  if (voice.length) fail(`vẫn còn ${voice.length} yêu cầu tới assets/voice: ` + JSON.stringify(voice.slice(0,3)));
  else pass('không còn yêu cầu nào tới assets/voice');

  const r2 = await p.evaluate(() => ({
    nutLoa: !!document.getElementById('btn-voice'),
    coSkillVoice: typeof window.SkillVoice !== 'undefined',
    tenChieu: Object.keys(SKILL_DEFS).map(id => { const i = skillInfo(id); return i ? i.name : ''; }).filter(Boolean),
    tenTanChuc: Object.keys(TH_SYSTEMS || {}).map(k => TH_SYSTEMS[k].name),
  }));
  console.log('tên chiêu:', JSON.stringify(r2.tenChieu));
  console.log('tấn chức :', JSON.stringify(r2.tenTanChuc));
  if (r2.nutLoa) fail('nút 🗣 giọng hô tên chiêu vẫn còn trên thanh HUD');
  else pass('nút 🗣 đã gỡ khỏi thanh HUD');
  if (r2.coSkillVoice) fail('đối tượng SkillVoice vẫn tồn tại');
  else pass('hệ hô tên chiêu đã gỡ khỏi mã');

  const dinh = [...r2.tenChieu, ...r2.tenTanChuc].filter(n => BAN.some(w => n.toLowerCase().includes(w)));
  if (dinh.length) fail('tên còn từ vựng kiếm hiệp: ' + JSON.stringify(dinh));
  else pass(`${r2.tenChieu.length} tên chiêu + ${r2.tenTanChuc.length} tên Tấn Chức đều sạch`);

  // bảng Kỹ Năng (K) và bảng Tấn Chức (H) mở được, không lỗi
  for (const [key, id] of [['K','skill'],['H','tuyethoc'],['C','char']]){
    const ok = await p.evaluate(i => { try { closePanels(); togglePanel(i); return true; } catch(e){ return String(e); } }, id);
    if (ok !== true) fail(`mở bảng ${key} lỗi: ${ok}`);
  }
  await p.waitForTimeout(400);
  const r3 = await p.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return { dinh: ['ám khí','cương khí','đạn chỉ','linh tiễn','tiêu hồn','chân khí','phong mạch'].filter(w => t.includes(w)) };
  });
  if (r3.dinh.length) fail('giao diện đang mở còn chữ: ' + JSON.stringify(r3.dinh));
  else pass('giao diện đang mở sạch từ vựng kiếm hiệp');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('có pageerror');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
