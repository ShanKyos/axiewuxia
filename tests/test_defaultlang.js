// Ngôn ngữ mặc định. Người mở link lần đầu không có 'vlcm_lang' nên mặc định quyết định họ thấy gì.
// Đo bằng SỐ DÒNG TIẾNG ANH THẬT, không đo "dòng không có dấu" — dòng số ("9 (5+4) + Max") cũng
// không có dấu, và đo kiểu đó cho ra 11% ở CẢ HAI chế độ, tức là vô nghĩa.
// Số thật đo được: mặc định cũ ('en') để lại 4 dòng tiếng Anh trên 87 = 5%; đặt 'vi' cho ra 0.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
const EN = /\b(Click|drag|Equip|Equipment|Reward|Completed|Damage|Defense|Attack Speed|Dodge|EXP|Inventory|Bag|Slot|Empty|Unlocking|grants)\b/;

async function scanPanels(p){
  const seen = new Set();
  for (const tab of ['char','inv','skill','quest']){
    await p.evaluate(t => { try { togglePanel(t); } catch(e){} }, tab);
    await p.waitForTimeout(400);
    const lines = await p.evaluate(() =>
      ((document.getElementById('char-content')||{}).innerText||'')
        .split('\n').map(s => s.trim()).filter(s => s.length > 3));
    lines.forEach(s => seen.add(s));
  }
  const hits = [...seen].filter(s => EN.test(s));
  return { tong: seen.size, en: hits.length, viDu: hits.slice(0,4).map(s => s.slice(0,64)) };
}
async function boot(b, loc){
  const p = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  if (loc){ await p.evaluate(l => localStorage.setItem('vlcm_lang', l), loc); await p.reload({waitUntil:'load'}); }
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(1200);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // A. mở link lần đầu, localStorage trống
  const pA = await boot(b, null);
  const st = await pA.evaluate(() => ({ i18n: window.i18nLocale ? window.i18nLocale() : null,
    lang: window.ghhaLang ? window.ghhaLang() : null, luu: localStorage.getItem('vlcm_lang') }));
  console.log('A) mở lần đầu:', JSON.stringify(st));
  if (st.luu !== null) fail('localStorage đã có sẵn giá trị — không đo được mặc định');
  if (st.i18n !== 'vi') fail(`i18n.js mặc định '${st.i18n}', phải là 'vi'`);
  if (st.lang && st.lang !== 'vi') fail(`lang.js mặc định '${st.lang}' — LỆCH với i18n.js, giao diện sẽ lẫn hai thứ tiếng`);
  const a = await scanPanels(pA);
  console.log(`   ${a.tong} dòng · ${a.en} dòng tiếng Anh`, JSON.stringify(a.viDu));
  if (a.en > 0) fail(`còn ${a.en} dòng tiếng Anh ở chế độ mặc định`);

  // B. đối chứng: ép 'en' PHẢI ra nhiều tiếng Anh hơn — nếu không thì phép đo vô nghĩa
  const pB = await boot(b, 'en');
  const c = await scanPanels(pB);
  console.log(`B) ép 'en': ${c.tong} dòng · ${c.en} dòng tiếng Anh`, JSON.stringify(c.viDu));
  if (c.en <= a.en) fail(`ép 'en' (${c.en}) không nhiều tiếng Anh hơn mặc định (${a.en}) — phép đo không phát hiện được gì`);

  // C. người chơi vẫn tự đổi được, và lựa chọn đó phải được giữ
  const d = await pB.evaluate(() => localStorage.getItem('vlcm_lang'));
  console.log('C) lựa chọn tay được giữ:', d);
  if (d !== 'en') fail('đặt tay sang en không được giữ');

  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
