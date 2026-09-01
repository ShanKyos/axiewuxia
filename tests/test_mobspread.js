// Một bãi 6 con trước đây chồng khít trong ~40px: sáu nhãn tên đè lên nhau, không đọc được chữ
// nào và không biết đang đánh mấy con. Hai việc: đẩy quái ra khỏi nhau, và gộp nhãn thành "×N".
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8861/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // 1. Dồn 6 con vào một điểm rồi thả — chúng phải tự giãn ra
  const r1 = await p.evaluate(async () => {
    travelTo('daohoa'); player.auto = false;
    const k = MAPS.daohoa.packs[0];
    player.x = k.x - 400; player.y = k.y;                  // đứng xa để quái không đuổi
    const cum = mobs.filter(m => !m.dead && m.pack === 1).slice(0, 6);
    cum.forEach(m => { m.x = k.x; m.y = k.y; });           // chồng khít lên nhau
    const dmin = () => { let v = 1e9;
      for (let i=0;i<cum.length;i++) for (let j=i+1;j<cum.length;j++)
        v = Math.min(v, dist(cum[i].x,cum[i].y,cum[j].x,cum[j].y));
      return Math.round(v); };
    const truoc = dmin();
    await new Promise(r => setTimeout(r, 1600));
    const sau = dmin();
    return { soCon: cum.length, khoangCachNhoNhat_truoc: truoc, sau,
      canDay: Math.round((cum[0].def.size + cum[0].def.size) * 1.2) };
  });
  console.log('1) 6 con chồng khít rồi thả:', JSON.stringify(r1));
  if (r1.soCon < 4) fail('không dựng được cụm để kiểm');
  else if (r1.sau <= r1.truoc + 4) fail(`quái không giãn ra (${r1.truoc} → ${r1.sau}px)`);
  else if (r1.sau < r1.canDay * 0.6) fail(`giãn chưa đủ: ${r1.sau}px, cần khoảng ${r1.canDay}px`);

  // 2. Nhãn tên: cụm sát nhau chỉ được MỘT nhãn, kèm ×N
  const r2 = await p.evaluate(async () => {
    const k = MAPS.daohoa.packs[0];
    const cum = mobs.filter(m => !m.dead && m.pack === 1).slice(0, 6);
    cum.forEach((m,i) => { m.x = k.x + i*8; m.y = k.y; });  // ép sát lại lần nữa
    camera.x = k.x - W/2; camera.y = k.y - H/2;
    mobLabelPass();
    const co = cum.filter(m => m._lbl !== false);
    return { soCon: cum.length, soNhanVe: co.length,
      dem: co.map(m => m._lblN), tongDem: co.reduce((a,m)=>a+(m._lblN||1),0) };
  });
  console.log('2) cụm sát nhau:', JSON.stringify(r2));
  if (r2.soNhanVe >= r2.soCon) fail(`${r2.soCon} con sát nhau mà vẫn vẽ ${r2.soNhanVe} nhãn — vẫn chồng chữ`);
  if (r2.tongDem !== r2.soCon) fail(`đếm sai: gộp ra ${r2.tongDem} nhưng có ${r2.soCon} con`);

  // 3. Quái ĐỨNG XA nhau phải giữ nhãn riêng
  const r3 = await p.evaluate(() => {
    const cum = mobs.filter(m => !m.dead && m.pack === 1).slice(0, 4);
    // Đặt trong màn hình: con ngoài khung bị bỏ nhãn là ĐÚNG, không phải lỗi gộp.
    cum.forEach((m,i) => { m.x = 500 + i*220; m.y = 900; });
    camera.x = 300; camera.y = 500;
    mobLabelPass();
    return { soCon: cum.length, soNhanVe: cum.filter(m => m._lbl !== false).length };
  });
  console.log('3) quái đứng xa nhau:', JSON.stringify(r3));
  if (r3.soNhanVe !== r3.soCon) fail(`quái cách nhau 300px mà vẫn bị gộp nhãn (${r3.soNhanVe}/${r3.soCon})`);

  // 4. Boss luôn có nhãn riêng, không bao giờ bị gộp
  const r4 = await p.evaluate(() => {
    travelTo('tuongduong'); travelTo('daohoa'); spawnZoneBosses();
    const bo = mobs.find(m => !m.dead && m.def.bossKind);
    const q = mobs.filter(m => !m.dead && !m.def.bossKind).slice(0,3);
    q.forEach((m,i) => { m.x = bo.x + i*6; m.y = bo.y; });
    camera.x = bo.x - W/2; camera.y = bo.y - H/2;
    mobLabelPass();
    return { bossCoNhan: bo._lbl !== false, bossDem: bo._lblN };
  });
  console.log('4) boss lẫn trong bầy:', JSON.stringify(r4));
  if (!r4.bossCoNhan) fail('boss bị gộp mất nhãn — mục tiêu chính phải luôn đọc được');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
