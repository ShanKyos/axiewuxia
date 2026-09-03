// ⚒ Lò rèn nay CHỈ mở khi đứng cạnh Thợ Rèn (đúng MU: phải về thành mới rèn được).
// Các bước mở lò dưới đây vì thế phải dịch chuyển tới NPC trước — đó là luật của game,
// không phải mẹo lách test.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);

  const setup = await page.evaluate(() => {
    player.level = 20;
    for (let i = 0; i < 4; i++) player.inv.push(genItem(20));
    player.jewels = { chucPhuc: 5, linhHon: 5, sinhMenh: 5, honDon: 0 };
    calcDerived();
    return player.inv.map(it => ({ name: it.name, slot: it.slot, uid: it.uid }));
  });
  console.log('injected items:', JSON.stringify(setup));

  await page.evaluate(() => { togglePanel('inv'); });
  await page.waitForTimeout(300);
  const bothVisible = await page.evaluate(() => ({
    invHidden: document.getElementById('panel-inv').classList.contains('hidden'),
    bagHidden: document.getElementById('panel-bag').classList.contains('hidden'),
  }));
  console.log('paired visibility (both should be false):', JSON.stringify(bothVisible));
  await page.screenshot({ path: '/tmp/inv_paired.png' });

  const validSlots = ['vukhi','non','ao','tay','quan','chan','daychuyen','nhan1','nhan2'];
  const target = setup.find(it => validSlots.includes(it.slot));
  console.log('using target item:', JSON.stringify(target));
  const dragResult = await page.evaluate((slot) => {
    const bagCell = [...document.querySelectorAll('#panel-bag .bag-mon')].find(el => el.querySelector(`img[src*="assets/items/${slot}"]`));
    const eqSlot = [...document.querySelectorAll('.eq-slot')].find(el => el.getAttribute('ondrop').includes(`'${slot}'`));
    if (!bagCell || !eqSlot) return { error: 'element not found', bagCell: !!bagCell, eqSlot: !!eqSlot };
    const dt = new DataTransfer();
    bagCell.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    eqSlot.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }));
    eqSlot.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt, cancelable: true }));
    eqSlot.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt, cancelable: true }));
    return { ok: true };
  }, target.slot);
  console.log('drag dispatch result:', JSON.stringify(dragResult));
  await page.waitForTimeout(300);

  const afterDrag = await page.evaluate((slot) => ({
    equipped: player.equip[slot] ? player.equip[slot].name : null,
  }), target.slot);
  console.log('after drag-drop equip:', JSON.stringify(afterDrag));
  await page.screenshot({ path: '/tmp/inv_after_dragdrop_equip.png' });

  // Forge: select the now-equipped item, drag a jewel onto the drop zone
  await page.evaluate(() => { (()=>{ const _n = NPCS.find(x => x.talk === 'forge'); if (_n){ if (curMap !== _n.map) travelTo(_n.map); player.x = _n.x + 30; player.y = _n.y + 30; } })(); togglePanel('forge'); });
  await page.waitForTimeout(300);
  // Lò Hỗn Độn: lái bằng CHUỘT THẬT trên DOM (bấm ô túi → bấm viên ngọc → bấm KẾT HỢP), để
  // chứng minh phần vẽ có nối đúng vào bộ máy chứ không chỉ hàm chạy được khi gọi tay.
  const trayResult = await page.evaluate((slot) => {
    // Không phụ thuộc bước kéo-thả ở trên (món tiêm vào là ngẫu nhiên, có lần không mặc được):
    // tự mặc một món chắc chắn hợp lệ rồi mới đo phần rèn.
    let it = player.equip[slot];
    if (!it){ it = genSpecific('non', 1, 40); it.plus = 0; player.equip.non = it; calcDerived(); }
    it.plus = 0;
    player.jewels.chucPhuc = 5;
    renderForge();
    const root = document.getElementById('forge-content');
    const cell = [...root.querySelectorAll('.chaos-cell.bag')]
      .find(c => (c.getAttribute('onclick') || '').includes(String(it.uid)));
    if (!cell) return { error: 'không thấy ô túi của món đang mặc' };
    cell.click();
    const jw = [...root.querySelectorAll('.chaos-jw')]
      .find(x => (x.getAttribute('onclick') || '').includes('chucPhuc'));
    if (!jw) return { error: 'không thấy viên Chúc Phúc' };
    jw.click();
    window._forgeSlot = it.slot;
    return { khay: forgeTray.length, o: it.slot, congThuc: (chaosCurrent() || {}).rec && chaosCurrent().rec.id };
  }, target.slot);
  console.log('tray via DOM:', JSON.stringify(trayResult));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/forge_selected.png' });

  const combineResult = await page.evaluate(() => {
    const slot = window._forgeSlot;
    const root = document.getElementById('forge-content');
    const rec = [...root.querySelectorAll('.chaos-rec')].find(x => (x.getAttribute('onclick')||'').includes("'bless'"));
    if (rec) rec.click();
    const go = document.querySelector('.chaos-go');
    if (!go) return { error: 'không thấy nút KẾT HỢP' };
    const disabled = go.disabled;
    go.click();
    return { disabled, plus: player.equip[slot] && player.equip[slot].plus, chucPhuc: player.jewels.chucPhuc };
  });
  console.log('combine via DOM:', JSON.stringify(combineResult));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/forge_after_jewel_drag.png' });

  let bad = 0;
  if (trayResult.error) { console.log('FAIL khay:', trayResult.error); bad++; }
  else if (trayResult.khay !== 2) { console.log('FAIL khay có', trayResult.khay, 'ô, cần 2 (1 đồ + 1 ngọc)'); bad++; }
  if (combineResult.error) { console.log('FAIL kết hợp:', combineResult.error); bad++; }
  else {
    if (combineResult.disabled) { console.log('FAIL nút KẾT HỢP bị khoá dù đủ nguyên liệu'); bad++; }
    if (combineResult.plus !== 1) { console.log('FAIL Chúc Phúc qua DOM không lên +1 (ra +' + combineResult.plus + ')'); bad++; }
    if (combineResult.chucPhuc !== 4) { console.log('FAIL không trừ đúng 1 viên (còn ' + combineResult.chucPhuc + '/5)'); bad++; }
  }
  console.log(bad ? 'FAIL(' + bad + ')' : 'PASS');

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
