// ⚒ Lò rèn nay CHỈ mở khi đứng cạnh Thợ Rèn (đúng MU: phải về thành mới rèn được).
// Các bước mở lò dưới đây vì thế phải dịch chuyển tới NPC trước — đó là luật của game,
// không phải mẹo lách test.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(300);

  // 1) Play through several maps + levels + panels, confirm nothing crashes without tanNpcs
  const r1 = await page.evaluate(async () => {
    player.level = 60; calcDerived(); player.hp = player.maxHp;
    questIdx = 35; questState = 'active';
    const maps = ['daohoa', 'tuongduong', 'ngoai', 'chungnam', 'comoc', 'tuyettinh', 'mongco', 'nhanmon'];
    for (const m of maps){ travelTo(m); for (let i = 0; i < 40; i++) update(0.05); render(); }
    return { finalMap: curMap };
  });
  console.log('1) travel through all 8 maps + render:', JSON.stringify(r1));

  // 2) Try old 'L' key behavior — should do nothing now (no relation panel), no crash
  const r2 = await page.evaluate(() => {
    const before = document.querySelectorAll('.panel:not(.hidden)').length;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    return { panelDefFor: typeof togglePanel === 'function', noRelationPanel: !document.getElementById('panel-relation') };
  });
  console.log('2) L key / panel-relation gone:', JSON.stringify(r2));

  // 3) Cheat console /help should not list /npc, and /npc command should just fall to default "unknown command"
  const r3 = await page.evaluate(() => {
    const before = document.getElementById('cheat-log') ? document.getElementById('cheat-log').children.length : 0;
    window.TEST_MODE = true;
    cheatExec('/npc');
    const logLines = Array.from(document.getElementById('cheat-log') ? document.getElementById('cheat-log').children : []).map(x => x.textContent);
    // /help nay sinh ra từ dữ liệu thật qua cheatHelp(), không còn là hằng CHEAT_HELP
    return { logLines, helpHasNpc: cheatHelp().some(l => l.includes('/npc')) };
  });
  console.log('3) /npc cheat command removed:', JSON.stringify(r3));

  // 4) Open skill panel (Khác tab) — should render fine with no Free Axie section, no crash
  const r4 = await page.evaluate(() => {
    togglePanel('skill');   // bảng Kỹ Năng nay MỘT trang, không còn tab 'khac'
    return { html: document.getElementById('panel-skill').innerHTML.length };
  });
  console.log('4) skill panel Khác tab renders:', JSON.stringify(r4));

  // 5) Open Bagua panel (Chaos Machine + Đổi Cổ Thần) — still works after all these edits
  const r5 = await page.evaluate(() => {
    (()=>{ const _n = NPCS.find(x => x.talk === 'forge'); if (_n){ if (curMap !== _n.map) travelTo(_n.map); player.x = _n.x + 30; player.y = _n.y + 30; } })(); renderBaGua();
    return { html: document.getElementById('panel-quest').innerHTML.length };
  });
  console.log('5) BaGua panel still renders (Chaos Machine intact):', JSON.stringify(r5));

  // 6) calcDerived() runs clean (no reference to relations/VH.tp_*)
  const r6 = await page.evaluate(() => {
    try { calcDerived(); return { ok: true, atk: player.atk }; } catch (e) { return { ok: false, err: String(e) }; }
  });
  console.log('6) calcDerived no crash:', JSON.stringify(r6));

  console.log('errors:', JSON.stringify(errors.slice(0, 15)));
  await browser.close();
})();
