// Hai lỗi khiến người chơi mới bế tắc cạnh boss:
//  (1) phím Space nhắm vào boss vì nearestMob() không phân biệt boss với quái thường;
//  (2) AUTO gặp boss thì chỉ lùi tại chỗ — bán kính tạm dừng 300 < tầm truy đuổi 420 nên
//      boss bám theo mãi. Đo được 2 phút AUTO = 0 kill.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(700);

  // 1. Có quái thường lẫn boss cùng trong tầm → phải chọn quái thường
  const r1 = await p.evaluate(() => {
    travelTo('daohoa'); player.auto = false;
    mobs.length = 0;
    player.x = 1000; player.y = 1000;
    spawnZoneBosses();
    const bo = mobs.find(m => m.def.bossKind);
    bo.x = 1060; bo.y = 1000;                       // boss SÁT người chơi (60px)
    const md = MAPS.daohoa;
    spawnMob('boar', { x:1000, y:1150, r:1, count:1 }, null);  // quái thường XA hơn (150px)
    const normal = mobs.find(m => !m.def.bossKind);
    const t = nearestMob(300);
    return { chon: t ? t.def.name : null, laBoss: !!(t && t.def.bossKind),
      cachBoss: Math.round(dist(player.x,player.y,bo.x,bo.y)),
      cachThuong: normal ? Math.round(dist(player.x,player.y,normal.x,normal.y)) : -1 };
  });
  console.log('1) boss 60px vs quái thường 150px →', JSON.stringify(r1));
  if (r1.laBoss) fail('vẫn nhắm boss dù có quái thường trong tầm — người mới sẽ đâm vào boss');

  // 2. Chỉ có mỗi boss → vẫn phải đánh được (người chơi tự đi tới thì họ muốn thế)
  const r2 = await p.evaluate(() => {
    mobs.length = 0; player.x = 1000; player.y = 1000;
    spawnZoneBosses();
    const bo = mobs.find(m => m.def.bossKind); bo.x = 1060; bo.y = 1000;
    const t = nearestMob(300);
    return { chon: t ? t.def.name : null, laBoss: !!(t && t.def.bossKind) };
  });
  console.log('2) chỉ có mỗi boss →', JSON.stringify(r2));
  if (!r2.laBoss) fail('đứng cạnh mỗi boss mà không đánh được — quá tay, người chơi tự đi tới đó');

  // 3. AUTO cạnh boss phải SỐNG và phải CÀY ĐƯỢC, với nhân vật YẾU.
  //
  //    Hai bản trước của phần này đều đo sai, ghi lại để không lặp:
  //    · Bản 1 so số quái hạ được giữa "lùi tại chỗ" và "rút về bãi an toàn", cho 5 so với 12
  //      và tôi kết luận bản rút lui thắng. Sau khi sửa lỗi mã bãi thì hai lối ra 19 so với 17
  //      — chênh lệch cũ chỉ là nhiễu của một lỗi khác.
  //    · Bản 2 dùng applyTestBoost() nên boss không xây xát nổi nhân vật, tức là đo đúng cái
  //      kịch bản mà việc rút lui KHÔNG có ý nghĩa gì.
  //    Đo với nhân vật cấp 1 mới thấy sự thật: rút về bãi xa cho 0 quái và CHẾT, vì nhân vật
  //    yếu bị dắt đi ngang map. Lối rút lui đã bị gỡ khỏi game; bài kiểm này giữ lại để chốt
  //    rằng lùi tại chỗ vẫn đủ sống và đủ cày.
  // CHẠY HAI LẦN nếu lần đầu chết. Nhân vật cấp 1 với đúng 3 bình thuốc đứng cạnh một boss vùng
  // thì cái chết là kết cục HỢP LỆ của trò chơi — không phải bằng chứng AUTO hỏng. Đo thực tế 3 lần
  // liên tiếp: hai lần boss tự dạt ra 430-588px trong 7 giây đầu và nhân vật cày ngon (27-29 mạng,
  // máu không tụt, không đụng tới bình nào); lần thứ ba boss bám lại và giết. Đúng một lần chết
  // không nói lên điều gì, hai lần liên tiếp mới là AUTO thật sự không thoát nổi vùng boss.
  const motLuot = async () => {
    const q = await (await b.newContext({ viewport:{width:1280,height:800} })).newPage();
    await q.goto('http://localhost:8853/index.html', { waitUntil:'load' });
    await q.waitForFunction(() => window.__gameReady).catch(()=>{});
    await q.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
    await q.waitForTimeout(800);
    await q.evaluate(() => {
      travelTo('daohoa');
      const k = MAPS.daohoa.packs[0];
      player.x = k.x; player.y = k.y; player.hp = player.maxHp; player.potions = 3;
      spawnZoneBosses();
      const bo = mobs.find(m => m.def.bossKind);
      bo.x = k.x + 130; bo.y = k.y;                   // boss áp sát bãi tân thủ
      player.auto = true; player._autoAX = null; player._autoAY = null;
      player._autoZoneLocked = false; player._autoPack = null;
      window._k0 = player.kills || 0;
    });
    await q.waitForTimeout(45000);
    // Ghi luôn khoảng cách boss lúc kết thúc: đó mới là thứ phân biệt "boss dạt ra, cày yên" với
    // "boss bám riết" — lần nào hỏng thì nhìn số này là biết ngay thuộc ca nào.
    const r = await q.evaluate(() => ({ kills:(player.kills||0)-window._k0,
      chet: dead, cap: player.level, hp: Math.round(player.hp), binh: player.potions,
      cachBoss: (() => { const m = mobs.find(x => !x.dead && x.def.bossKind);
        return m ? Math.round(dist(player.x, player.y, m.x, m.y)) : -1; })() }));
    await q.close();
    return r;
  };
  let r3 = await motLuot();
  console.log('3) cấp 1, không boost, boss áp sát bãi tân thủ, 45 giây:', JSON.stringify(r3));
  if (r3.chet){
    const r3b = await motLuot();
    console.log('   chết lần đầu — chạy lại:', JSON.stringify(r3b));
    if (!r3b.chet) r3 = r3b;                          // lần hai sống thì lấy lần hai
    else fail(`AUTO chết cạnh boss ở bãi tân thủ HAI lần liên tiếp (boss còn cách ${r3b.cachBoss}px)`);
  }
  if (r3.kills < 5) fail(`45 giây chỉ hạ ${r3.kills} quái cạnh boss — còn bế tắc`);

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
