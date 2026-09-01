// AUTO khoá bãi quái. Bãi 6 con được dựng bằng:
//     for (j=0..n) spawnMob(pk.mob, { x, y, r, count }, packId)
// Object zone tạo MỚI trong mỗi vòng lặp ⇒ 6 con = 6 zone riêng cùng toạ độ. Khoá theo tham
// chiếu zone vì thế chỉ khớp ĐÚNG MỘT con; hạ xong con đó là AUTO hết mục tiêu, quay về neo
// đứng im trong khi 5 con còn lại vây đánh. packId mới là mã dùng chung cho cả cụm.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(800);

  // 1. Cấu trúc: cả cụm phải dùng CHUNG một mã bãi, dù zone là các object khác nhau
  const r1 = await p.evaluate(() => {
    travelTo('tuongduong'); travelTo('daohoa');
    const k = MAPS.daohoa.packs[0];
    const cum = mobs.filter(m => !m.dead && m.zone &&
      Math.abs(m.zone.x - k.x) < 2 && Math.abs(m.zone.y - k.y) < 2);
    return { soCon: cum.length,
      soZoneKhacNhau: new Set(cum.map(m => m.zone)).size,
      soMaBaiKhacNhau: new Set(cum.map(m => m.pack)).size,
      maBai: cum.length ? cum[0].pack : null };
  });
  console.log('1) một bãi:', JSON.stringify(r1));
  if (r1.soCon < 2) fail('không dựng được cụm quái để kiểm');
  if (r1.soMaBaiKhacNhau !== 1) fail(`cụm ${r1.soCon} con có ${r1.soMaBaiKhacNhau} mã bãi — không còn dùng chung`);
  if (r1.soZoneKhacNhau === 1)
    console.log('   (zone nay dùng chung — lỗi gốc đã được sửa ở nơi khác, bài kiểm vẫn giữ để chống tái phát)');

  // 2. Chạy thật: cấp 1, KHÔNG boost, 60 giây ở bãi tân thủ.
  //    Mỗi lượt dùng MỘT TRANG RIÊNG: `dead` là biến toàn cục, chết ở lượt trước là lượt sau
  //    AUTO không chạy nữa (`if (player.auto && !dead ...)`) và số đo thành vô nghĩa.
  const chay = async (ten, epLoiCu) => {
    const q = await (await b.newContext({ viewport:{width:1280,height:800} })).newPage();
    await q.goto('http://localhost:8853/index.html', { waitUntil:'load' });
    await q.waitForFunction(() => window.__gameReady).catch(()=>{});
    await q.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
    await q.waitForTimeout(800);
    await q.evaluate((ep) => {
      travelTo('daohoa');
      const k = MAPS.daohoa.packs[0];
      player.x = k.x; player.y = k.y; player.hp = player.maxHp; player.potions = 3;
      player.auto = true; player._autoAX = null; player._autoAY = null;
      player._autoZoneLocked = false; player._autoPack = null; player._fleeTo = null;
      window._k0 = player.kills || 0;
      // Tái hiện lỗi cũ: khoá vào một mã bãi không con nào mang — đúng hệ quả của việc so sánh
      // tham chiếu zone khi mỗi con một zone riêng.
      if (ep) window._patch = setInterval(() => {
        if (player._autoZoneLocked) player._autoPack = '__khong_con_nao_co__';
      }, 100);
    }, epLoiCu);
    await q.waitForTimeout(60000);
    const r = await q.evaluate(() => { if (window._patch) clearInterval(window._patch);
      return { kills:(player.kills||0)-window._k0, cap:player.level,
        hp:Math.round(player.hp), chet:dead, thuoc:player.potions }; });
    console.log(`   ${ten}: ${JSON.stringify(r)}`);
    await q.close();
    return r;
  };
  console.log('2) cấp 1, không boost, 60 giây AUTO ở bãi tân thủ:');
  const cu  = await chay('cách CŨ (khoá lệch, không con nào khớp)', true);
  const moi = await chay('cách MỚI (khoá theo mã bãi)            ', false);

  if (moi.chet) fail('AUTO vẫn chết ở bãi tân thủ');
  if (moi.kills < 8) fail(`60 giây chỉ hạ ${moi.kills} quái — toán học nói 2,5 giây/con, đáng lẽ trên 15`);
  if (moi.kills <= cu.kills) fail(`cách mới (${moi.kills}) không hơn cách cũ (${cu.kills}) — bài kiểm không chứng minh được gì`);
  else console.log(`   → ${moi.kills} quái so với ${cu.kills}`);

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
