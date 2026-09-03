// AUTO đứng im mà không nói gì là bế tắc CÂM: người chơi treo máy, quay lại thấy nhân vật đứng
// yên và không có cách nào biết vì sao. Nặng nhất ở phó bản — dọn sạch 4 đợt xong, thứ duy nhất
// còn lại là boss mà AUTO không đánh boss; đo được nhân vật đứng im vô hạn cách boss 301px,
// trong khi dòng "Vùng Boss" lại có ngưỡng 300px nên không bao giờ hiện.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const boot = async () => {
    const p = await (await b.newContext({ viewport:{width:1280,height:800} })).newPage();
    p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    await p.goto('http://localhost:8861/index.html?max=1', { waitUntil:'load' });
    await p.waitForFunction(() => window.__gameReady).catch(()=>{});
    await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
    await p.waitForTimeout(900);
    return p;
  };
  // Chữ nổi chỉ sống ~1,25 giây (floats có t:1, trừ dt*0.8 mỗi khung). Xoá mảng rồi chờ 11 giây
  // mới đọc thì tới lúc đọc đã tan sạch — phải HỨNG LIÊN TỤC trong suốt cửa sổ đo.
  const noiGi = (p, giay) => p.evaluate(async (g) => {
    const thay = new Set();
    const iv = setInterval(() => {
      for (const f of floats) if (/TỰ ĐÁNH|tự đánh|AUTO|Phiêu Bạt|bãi|quái|trùm|boss/i.test(f.text)) thay.add(f.text);
    }, 120);
    await new Promise(r => setTimeout(r, g*1000));
    clearInterval(iv);
    return [...thay];
  }, giay);

  // 1. Phó bản: dọn hết đợt, chỉ còn boss → phải nói rõ AUTO không đánh boss
  // Bản đầu để AUTO tự cày 13 giây rồi mới đọc trạng thái. Nhân vật sau applyTestBoost() dọn sạch
  // cả phòng KỂ CẢ boss trong chừng đó thời gian, nên tới lúc đo mobs rỗng — mà every() trên mảng
  // rỗng trả true, thành ra mệnh đề "chỉ còn boss" vẫn chạy với 0 con và bắt vạ oan. Nay DỰNG THẲNG
  // trạng thái cần đo: xoá sạch quái thường, để lại đúng một boss trong tầm nhìn.
  const p1 = await boot();
  await p1.evaluate(() => { applyTestBoost && applyTestBoost();
    travelTo('tuongduong'); travelTo('pb_daohoa');
    mobs.length = 0;
    spawnMob('boss_hacphong', { x: player.x + 340, y: player.y, r: 1, count: 1 }, null);
    mobs.forEach(m => { m.hp = m.maxHp = 1e9; });
    player.auto = true; player._autoAX=player.x; player._autoAY=player.y;
    player._autoZoneLocked=false; player._autoPack=null; });
  await p1.waitForTimeout(600);
  const st1 = await p1.evaluate(() => ({ song: mobs.filter(m=>!m.dead).length,
    laBoss: mobs.filter(m=>!m.dead).every(m => m.def.bossKind || m.def.boss || m.type==='boss'),
    cach: (() => { const m = mobs.find(x=>!x.dead); return m ? Math.round(dist(player.x,player.y,m.x,m.y)) : -1; })() }));
  const say1 = await noiGi(p1, 11);
  console.log('1) phó bản, chỉ còn boss:', JSON.stringify(st1));
  console.log('   AUTO nói:', JSON.stringify(say1));
  if (!st1.song || !st1.laBoss) fail(`không dựng được trạng thái chỉ-còn-boss (${st1.song} con)`);
  else if (!say1.some(t => /trùm|boss/i.test(t)))
    fail(`chỉ còn boss cách ${st1.cach}px mà AUTO không nói gì — phó bản bế tắc câm`);
  await p1.close();

  // 2. Chỉ có quái Phiêu Bạt trung lập → phải nói rõ chúng trung lập
  const p2 = await boot();
  await p2.evaluate(() => { applyTestBoost && applyTestBoost(); travelTo('ngoai');
    mobs.length = 0;
    const md = MAPS.ngoai;
    if (md.duhiep) for (let i=0;i<3;i++) spawnMob(md.duhiep, { x:player.x+120, y:player.y, r:40, count:3 }, null);
    player.pk = false; player.auto = true;
    player._autoAX=player.x; player._autoAY=player.y;
    player._autoZoneLocked=false; player._autoPack=null; });
  const st2 = await p2.evaluate(() => ({ song: mobs.filter(m=>!m.dead).length,
    duHiep: mobs.filter(m=>!m.dead && m.def.duHiep).length }));
  const say2 = await noiGi(p2, 11);
  console.log('2) chỉ có Phiêu Bạt trung lập:', JSON.stringify(st2), '→', JSON.stringify(say2));
  if (st2.duHiep === 0) console.log('   (map không có Phiêu Bạt, bỏ qua mệnh đề)');
  else if (!say2.length) fail('đứng cạnh quái trung lập mà AUTO im lặng hoàn toàn');
  await p2.close();

  // 3. Sạch quái hẳn → phải gợi ý đi bãi khác
  const p3 = await boot();
  await p3.evaluate(() => { applyTestBoost && applyTestBoost(); travelTo('daohoa');
    mobs.length = 0; player.auto = true;
    player._autoAX=player.x; player._autoAY=player.y;
    player._autoZoneLocked=false; player._autoPack=null; });
  const say3 = await noiGi(p3, 11);
  console.log('3) sạch quái hẳn →', JSON.stringify(say3));
  if (!say3.length) fail('không còn quái nào mà AUTO vẫn im lặng');
  await p3.close();

  // 4. Đang cày bình thường thì KHÔNG được spam
  const p4 = await boot();
  await p4.evaluate(() => { applyTestBoost && applyTestBoost(); travelTo('daohoa');
    const k = MAPS.daohoa.packs[0]; player.x=k.x; player.y=k.y;
    player.auto = true; player._autoAX=null; player._autoAY=null;
    player._autoZoneLocked=false; player._autoPack=null; });
  await p4.waitForTimeout(1500);
  const say4 = await noiGi(p4, 12);
  console.log('4) đang cày bình thường →', JSON.stringify(say4));
  if (say4.length > 1) fail(`đang cày mà vẫn nhắc ${say4.length} lần — phiền người chơi`);
  await p4.close();

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
