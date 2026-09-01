// Tách killMob: QUYẾT ĐỊNH thưởng khỏi GHI VÀO player.
//
// Mệnh đề 1 là lý do tồn tại của bài kiểm này, ba mệnh đề kia chỉ để chắc không làm hỏng gì:
//   1. computeKillRewards() gọi 200 lần KHÔNG được đổi player một byte nào. So bằng cách chụp
//      nguyên JSON.stringify(player) trước/sau — không chỉ vài trường, vì thứ rò rỉ thường là
//      trường không ai ngờ tới. Mất hợp đồng này là mất toàn bộ lý do tách.
//   2. Nó phải trả về thứ CÓ NGHĨA, không phải object rỗng — dễ vô tình viết ra một hàm thuần
//      hoàn hảo mà chẳng tính gì.
//   3. Giết thật vẫn cộng vào player như cũ.
//   4. Hai đường thoát sớm (Cầu Giáp, quái Tầng Sâu) vẫn thoát — chúng nằm TRƯỚC chỗ phát thưởng,
//      tách nhầm là chúng bắt đầu phát thưởng.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // ---- 1. HỢP ĐỒNG: gọi computeKillRewards 200 lần không được đổi player một byte nào ----
  const r1 = await p.evaluate(() => {
    applyTestBoost(); travelTo('tuongduong'); travelTo('daohoa');
    mobs.length = 0;
    const m = spawnMob('boar', { x: player.x + 40, y: player.y, r:1, count:1 }, null);
    // chụp TOÀN BỘ player, không chỉ vài trường — thứ rò rỉ thường là trường không ai ngờ
    const truoc = JSON.stringify(player);
    const soLuot = 200;
    for (let i = 0; i < soLuot; i++) computeKillRewards(m, 'hit', player);
    const sau = JSON.stringify(player);
    return { soLuot, giongHet: truoc === sau,
      khac: truoc === sau ? null : (() => {
        const a = JSON.parse(truoc), b2 = JSON.parse(sau);
        return Object.keys(b2).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b2[k]));
      })() };
  });
  console.log('1) gọi 200 lần, player có đổi không:', JSON.stringify(r1));
  if (!r1.giongHet) fail(`computeKillRewards GHI vào player — trường đổi: ${(r1.khac||[]).join(', ')}`);

  // ---- 2. Nó phải trả về thứ có nghĩa, không phải object rỗng ----
  const r2 = await p.evaluate(() => {
    mobs.length = 0;
    const q = spawnMob('boar', { x: player.x + 40, y: player.y, r:1, count:1 }, null);
    const bo = spawnMob('boss_hacphong', { x: player.x + 90, y: player.y, r:1, count:1 }, null);
    const rq = computeKillRewards(q, 'hit', player), rb = computeKillRewards(bo, 'hit', player);
    return { quai: { xp:rq.xp, bac:rq.silver > 0, khi:rq.khi },
             boss: { xp:rb.xp, khi:rb.khi, tienDan:rb.tienDan, dropSrc:rb.dropSrc } };
  });
  console.log('2) trả về gì:', JSON.stringify(r2));
  if (!(r2.quai.xp > 0) || !r2.quai.bac || !(r2.quai.khi > 0)) fail('quái thường không ra thưởng cơ bản');
  if (!(r2.boss.xp > r2.quai.xp)) fail('boss cho EXP không hơn quái thường');
  // Tâm Đắc đã gộp vào Instinct — cái đáng gác nay là boss phải cho NHIỀU Instinct hơn quái
  // thường, vì đó là chỗ sức ép "đi săn boss" chuyển sang sau khi bỏ ô đếm riêng.
  if (!(r2.boss.tienDan > 0)) fail('boss không cho Đá Thăng Cấp');
  if (!(r2.boss.khi > r2.quai.khi)) fail(`boss cho ${r2.boss.khi} Instinct, không hơn quái thường ${r2.quai.khi}`);

  // ---- 3. Giết THẬT vẫn phải cộng vào player như cũ ----
  const r3 = await p.evaluate(async () => {
    mobs.length = 0;
    const m = spawnMob('boar', { x: player.x + 40, y: player.y, r:1, count:1 }, null);
    const t = { bac: player.silver, xp: player.xp, kills: player.kills, khi: player.khi, cap: player.level };
    m.hp = 0; killMob(m, 'hit');
    await new Promise(r => setTimeout(r, 200));
    return { bacTang: player.silver - t.bac, killsTang: player.kills - t.kills,
             khiTang: player.khi - t.khi, lenCap: player.level > t.cap,
             xpTang: player.level > t.cap ? 'đã lên cấp' : player.xp - t.xp };
  });
  console.log('3) giết thật:', JSON.stringify(r3));
  if (!(r3.bacTang > 0)) fail('giết quái mà không được bạc');
  if (r3.killsTang !== 1) fail(`bộ đếm kills tăng ${r3.killsTang}, phải là 1`);
  if (!(r3.khiTang > 0)) fail('giết quái mà không được Instinct');

  // ---- 4. Hai đường thoát sớm vẫn thoát: Cầu Giáp và quái Tầng Sâu không trả thưởng ----
  const r4 = await p.evaluate(async () => {
    const thu = (dat) => {
      mobs.length = 0;
      const m = spawnMob('boar', { x: player.x + 40, y: player.y, r:1, count:1 }, null);
      m.def = Object.assign({}, m.def, dat);
      const t = { bac: player.silver, kills: player.kills };
      m.hp = 0; killMob(m, 'hit');
      return { bac: player.silver - t.bac, kills: player.kills - t.kills };
    };
    return { cauGiap: thu({ bossOrb:true }), tangSau: thu({ deepMob:true }) };
  });
  console.log('4) hai đường thoát sớm:', JSON.stringify(r4));
  if (r4.cauGiap.bac !== 0 || r4.cauGiap.kills !== 0) fail('Cầu Giáp vẫn phát thưởng — phải thoát ở đầu hàm');
  if (r4.tangSau.bac !== 0 || r4.tangSau.kills !== 0) fail('quái Tầng Sâu vẫn phát thưởng trực tiếp');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
