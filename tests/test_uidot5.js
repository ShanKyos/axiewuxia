// Đợt giao diện: tách phím C/V, gộp bảng Kỹ Năng về một trang, gom bốn tab vào tab mẹ,
// và nhạc màn chờ.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => fail('lỗi runtime: ' + e.message));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);

  // ═══ ① NHẠC MÀN CHỜ ═══════════════════════════════════════════════════════
  // Kiểm TRƯỚC khi startGame: nhạc phải nổi lên ở màn chọn nhân vật, không phải trong màn chơi.
  const nhac = await p.evaluate(async () => {
    const r = await fetch('assets/music/' + BGM_INTRO + '.mp3', { method:'HEAD' });
    return { hangSo: BGM_INTRO, dat: AudioSys.bgmName, ma: r.status, kieu: r.headers.get('content-type') };
  });
  console.log('nhạc:', JSON.stringify(nhac));
  if (!nhac.hangSo) fail('BGM_INTRO vẫn null — màn chờ không có nhạc');
  else if (nhac.ma !== 200) fail(`tệp nhạc trả về ${nhac.ma}, không phải 200`);
  else if (!/audio/.test(nhac.kieu || '')) fail('tệp nhạc không phải kiểu audio: ' + nhac.kieu);
  else if (nhac.dat !== nhac.hangSo) fail(`màn chờ không đặt nhạc (bgmName = "${nhac.dat}")`);
  else pass(`màn chờ phát ${nhac.hangSo}.mp3 (${nhac.kieu})`);

  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); moHetCong(); });
  await p.waitForTimeout(500);

  // ═══ ② PHÍM C / V / K — BA BẢNG KHÁC NHAU ═════════════════════════════════
  // Trước đây C và V cùng gọi togglePanel('char'): hai phím một cửa sổ.
  const phim = {};
  for (const k of ['c', 'v', 'k', 'b']){
    await p.evaluate(() => closePanels());
    await p.keyboard.press(k);
    await p.waitForTimeout(220);
    phim[k] = await p.evaluate(() =>
      [...document.querySelectorAll('.panel')].filter(e => !e.classList.contains('hidden')).map(e => e.id));
  }
  console.log('phím:', JSON.stringify(phim));
  const mot = (k, id) => {
    if (!phim[k].includes(id)) fail(`phím ${k.toUpperCase()} không mở ${id} (mở: ${phim[k].join(',') || 'không gì'})`);
  };
  mot('c', 'panel-char'); mot('v', 'panel-inv'); mot('k', 'panel-skill'); mot('b', 'panel-bag');
  if (phim.c.includes('panel-inv') || phim.v.includes('panel-char'))
    fail('C và V vẫn mở chung một bảng');
  if (!bad) pass('C → Nhân Vật · V → Trang Bị · K → Kỹ Năng · B → Túi Đồ, bốn bảng khác nhau');

  // ═══ ③ BẢNG KỸ NĂNG — MỘT TRANG ═══════════════════════════════════════════
  const kn = await p.evaluate(() => {
    closePanels(); togglePanel('skill');
    const el = document.getElementById('panel-skill');
    const t = el.innerText || '';
    return { tab: el.querySelectorAll('.bang-tab').length,
             muc: [...el.querySelectorAll('.stat-sec')].map(x => x.textContent.trim()),
             coDiSan: /DI SẢN LỚP/.test(t), coBonO: /1 chính · 1 phụ/.test(t),
             coTanChuc: /HỆ TẤN CHỨC PHỤ/.test(t),
             conHam: typeof window.switchSkillTab };
  });
  console.log('kỹ năng:', JSON.stringify(kn));
  if (kn.tab !== 0) fail(`bảng Kỹ Năng còn ${kn.tab} tab — phải gộp về một trang`);
  else pass('bảng Kỹ Năng không còn tab nào');
  if (!kn.coBonO || !kn.coDiSan || !kn.coTanChuc)
    fail('gộp mà mất mục: 4 ô=' + kn.coBonO + ' di sản=' + kn.coDiSan + ' tấn chức=' + kn.coTanChuc);
  else pass('cả ba mục cùng nằm trên một trang');
  // Hai mục BỊ ĐỘNG nay cạnh nhau — tiêu đề phải phân biệt được, không thì đọc thành trùng lặp
  const bd = kn.muc.filter(x => /^BỊ ĐỘNG/.test(x));
  if (bd.length === 2 && bd[0] === bd[1]) fail('hai mục bị động trùng tiêu đề: ' + bd[0]);
  else if (bd.length === 2) pass(`hai mục bị động phân biệt được: ${bd.join('  |  ')}`);
  if (kn.conHam !== 'undefined') fail('switchSkillTab vẫn còn — mã chết sau khi bỏ tab');

  // Không chỗ nào còn chỉ đường tới tab đã gỡ
  // Chỉ đếm trong CHUỖI hiển thị. Chú thích giải thích vì sao đã gỡ tab có trích lại chuỗi cũ
  // làm dẫn chứng — đếm cả nó thì bài kiểm đỏ vì chính lời giải thích của mình.
  const chiDuong = await p.evaluate(async () => {
    const t = (await (await fetch('game.js')).text())
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .split('\n').map(l => { const c = l.indexOf('//'); return c < 0 ? l : l.slice(0, c); }).join('\n');
    return (t.match(/K → Di Sản Cũ/g) || []).length;
  });
  if (chiDuong) fail(`còn ${chiDuong} chỗ chỉ người chơi tới "K → Di Sản Cũ" — tab đó không còn`);
  else pass('không còn chỉ dẫn tới tab đã gỡ');

  // ═══ ④ BẢNG NHÂN VẬT — TAB MẸ ═════════════════════════════════════════════
  const nv = await p.evaluate(() => {
    const doc = t => {
      closePanels(); togglePanel('char'); if (t) window.switchCharTab(t);
      const el = document.getElementById('panel-char');
      const hang = [...el.querySelectorAll('.bang-tabs')];
      return { hang: hang.length,
               cha: [...hang[0].querySelectorAll('.bang-tab')].map(x => x.textContent.trim()),
               chaOn: [...hang[0].querySelectorAll('.bang-tab.on')].map(x => x.textContent.trim()),
               con: hang[1] ? [...hang[1].querySelectorAll('.bang-tab')].map(x => x.textContent.trim()) : null,
               conOn: hang[1] ? [...hang[1].querySelectorAll('.bang-tab.on')].map(x => x.textContent.trim()) : null,
               than: (document.getElementById('char-content') || {}).innerHTML?.length || 0 };
    };
    return { info: doc('info'), chi: doc('mount'), dt: doc('mastery'), ts: doc('taytuy') };
  });
  console.log('nhân vật:', JSON.stringify(nv.info.cha), '· trong nhóm:', JSON.stringify(nv.chi.con));
  if (nv.info.cha.length !== 3) fail(`hàng tab đầu có ${nv.info.cha.length} mục, phải còn 3`);
  else pass('hàng tab đầu còn 3 mục: ' + nv.info.cha.join(' · '));
  if (nv.info.hang !== 1 || nv.ts.hang !== 1)
    fail('hàng tab con hiện cả khi KHÔNG ở trong nhóm — bốn nút thừa trên mọi trang khác');
  else pass('hàng tab con chỉ hiện khi đang ở trong nhóm');
  if (!nv.chi.con || nv.chi.con.length !== 3) fail('nhóm không có đủ 3 tab con');
  else pass('nhóm có 3 tab con: ' + nv.chi.con.join(' · '));
  for (const [ten, o] of [['Chimera', nv.chi], ['Đại Thành', nv.dt]]){
    if (!o.chaOn.some(x => /Nâng Cấp/.test(x))) fail(`${ten}: tab mẹ không sáng`);
    if (!o.conOn || o.conOn.length !== 1) fail(`${ten}: tab con sáng ${o.conOn ? o.conOn.length : 0} mục, phải đúng 1`);
    if (o.than < 500) fail(`${ten}: thân bảng gần như rỗng (${o.than} ký tự) — không vẽ ra nội dung`);
  }
  if (!bad) pass('vào tab con nào thì tab mẹ sáng và đúng một tab con sáng');

  await p.screenshot({ path: 'qa_shots/ui_dot5.png' });
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
