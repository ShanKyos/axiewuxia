// Dị Biến — elite affix nhóm chỉ số (docs/VUNG_VO_AN_ENDGAME.md §6).
//
// Gác ba thứ:
//   1. Từng Dị Biến bật riêng lẻ phải ĐỔI ĐƯỢC một đại lượng đo được — đúng khuôn mục 5 của
//      test_mastery, thứ đã bắt được 4 nút chết ở đợt trước. Ghi tên mà không làm gì là đỏ.
//   2. Hồ hiện tại CHỈ được chứa nhóm chỉ số. Nhóm né-tránh (Cột Lửa, Tường Vây, Pháo Rơi, Xoáy
//      Hút, Băng Trận, Lưỡi Xoay) chỉ mở khi Vùng Vỡ Ấn tồn tại — chưa có vùng mà đã có affix là
//      thả nó ra bãi quái early game, đúng thứ thiết kế nói không.
//   3. Mỗi bãi ĐÚNG MỘT Kẻ Dị Biến; boss / Kẻ Tiếp Sức không bao giờ mang; quái thường thừa hưởng
//      đúng một cái đầu tiên của elite ở 40%.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; window.charTab = 'info';
    startGame('thieulam', null); player.traits = []; player.level = 80; calcDerived();
    const o = {};
    const NHOM_CHI_SO = ['cuongthe','hutsinh','chieubinh','loantien','nhiemdoc','hoaphu','bangphu','loiphu','noxac','phanthan','dichanh'];
    o.khoaLa = Object.keys(DIBIEN).filter(k => !NHOM_CHI_SO.includes(k));
    o.soDiBien = Object.keys(DIBIEN).length;

    // ── mỗi bãi có elite → đúng một Kẻ Dị Biến; bãi không elite → không ai ──
    o.bai = {};
    for (const k of ['ngoai','chungnam','tuyettinh','mongco','nhanmon']){
      curMap = k; buildWorld();
      const byPack = {};
      for (const m of mobs){ if (m.pack == null || m.clone) continue; const e = (byPack[m.pack] = byPack[m.pack] || { elite:0, champ:0, tiepChamp:0, n:0, soDb:[] });
        e.n++; if (m.def.elite) e.elite++; if (m.dbChamp){ e.champ++; e.soDb.push(m.db.length); if (m.tiep) e.tiepChamp++; } }
      const P = Object.values(byPack);
      o.bai[k] = { coElite: P.filter(x=>x.elite).length, dung1: P.filter(x=>x.elite && x.champ===1).length,
                   khongEliteMaCo: P.filter(x=>!x.elite && x.champ).length, tiepChamp: P.reduce((a,x)=>a+x.tiepChamp,0),
                   soDb: P.flatMap(x=>x.soDb) };
    }
    // boss không bao giờ mang
    curMap = 'chungnam'; buildWorld();
    o.bossCoDb = mobs.filter(m => (m.def.boss || m.def.bossKind) && m.db).length;

    // ── từng Dị Biến bật riêng lẻ phải đổi được thứ gì đó ──
    const _rnd = Math.random;
    // Ghim Math.random CHỈ trong lúc đo, không trong lúc dựng map: buildWorld → nearestFree() dò
    // chỗ trống bằng toạ độ ngẫu nhiên, random hằng thì nó dò mãi một chỗ — bài kiểm treo 120s
    // (đã dính lần đầu). Đo xong mở lại random thật.
    const dung = () => { // dựng một elite sạch cạnh người chơi, cả map trống
      curMap = 'chungnam'; buildWorld(); for (const m of mobs){ m.x = -9000; m.y = -9000; }
      const e = spawnMob('bandao', { x:600, y:600, r:0, count:1 }, 777, false, {});
      e.db = []; e.dbChamp = true; e.dbT = {};
      player.x = 640; player.y = 600; player.hp = player.maxHp; player.eva = 0; player.defRed = 0; player.excBlock = 0; player.poisonT = 0;
      return e;
    };
    // Ghim Math.random = 0.5 CHỈ trong từng khung của phép đo sát thương (rnd(0.85,1.15) → 1.0),
    // rồi trả lại ngay. Ghim toàn cục thì mọi vòng "dò chỗ trống bằng toạ độ ngẫu nhiên" trong
    // update()/buildWorld() dò mãi một chỗ — bài treo quá 100 giây, dính hai lần liền.
    // Đo ĐÚNG MỘT đòn — đòn đầu tiên trúng — chứ không cộng dồn trong cửa sổ N khung. Cộng dồn thì
    // cửa sổ bắt được 1 hay 2 đòn tuỳ vài mili-giây quái đi bộ tới tầm (range 36 mà đứng cách 40),
    // ra tỉ lệ ×2.31 rồi ×1.64 cho cùng một Dị Biến. Một đòn với random ghim là số xác định.
    const danhToi = (e, frames) => {
      e.atkT = 0;
      for (let i = 0; i < frames; i++){
        const h = player.hp = player.maxHp; player.defRed = 0; player.eva = 0; player.excBlock = 0;
        Math.random = () => 0.5; try { update(0.05); } finally { Math.random = _rnd; }
        if (h > player.hp) return h - player.hp;
      }
      return 0;
    };
    o.hieuLuc = {};
    let e0 = dung(); const mocDmg = danhToi(e0, 30), mocHp = e0.maxHp;
    for (const k of NHOM_CHI_SO){
      console.log('[buoc]', k);
      const e = dung(); e.db = [k];
      if (k === 'cuongthe'){ const t = spawnMob('bandao', {x:600,y:700,r:0,count:1}, 778, false, {}); rollDiBien(t); t.db = ['cuongthe']; t.maxHp = t.hp = Math.round(mobHp(MOBS.bandao) * DIBIEN.cuongthe.hp); o.hieuLuc[k] = { doi: t.maxHp !== mocHp, ghiChu:`máu ${mocHp} → ${t.maxHp}` }; continue; }
      if (k === 'hutsinh'){ e.hp = Math.round(e.maxHp * 0.3); const hp0 = e.hp; danhToi(e, 30); o.hieuLuc[k] = { doi: e.hp > hp0, ghiChu:`máu quái ${hp0} → ${Math.round(e.hp)}` }; continue; }
      if (k === 'chieubinh'){ const n0 = mobs.filter(m=>!m.dead && m.summonedBy === e).length; for (let i = 0; i < 160; i++) update(0.05); const n1 = mobs.filter(m=>!m.dead && m.summonedBy === e).length; o.hieuLuc[k] = { doi: n1 > n0, ghiChu:`triệu ${n1} con` }; continue; }
      if (k === 'nhiemdoc'){ danhToi(e, 30); o.hieuLuc[k] = { doi: player.poisonT > 0, ghiChu:`độc ${player.poisonT.toFixed(1)}s` }; continue; }
      if (k === 'noxac'){ player.hp = player.maxHp; e.x = player.x + 20; e.hp = 0; killMob(e, 'hit'); o.hieuLuc[k] = { doi: player.hp < player.maxHp, ghiChu:`mất ${player.maxHp - player.hp} khi xác nổ cạnh` }; continue; }
      if (k === 'phanthan'){ const c = spawnClone(e); o.hieuLuc[k] = { doi: !!c && c.clone && c.maxHp < e.maxHp, ghiChu:`bản sao máu ${c.maxHp}/${e.maxHp}` }; continue; }
      if (k === 'dichanh'){ e.x = 300; e.y = 600; const d0 = dist(e.x,e.y,player.x,player.y); for (let i = 0; i < 100; i++){ update(0.05); e.x = Math.max(e.x, 300); } const d1 = dist(e.x,e.y,player.x,player.y); o.hieuLuc[k] = { doi: d1 < d0 - 100, ghiChu:`cách ${Math.round(d0)} → ${Math.round(d1)}` }; continue; }
      const dmg = danhToi(e, 30);
      o.hieuLuc[k] = { doi: dmg > mocDmg * 1.03, ghiChu:`ST ${mocDmg} → ${dmg} (×${(dmg/Math.max(1,mocDmg)).toFixed(2)})` };
    }
    // ── thừa hưởng: quái thường cùng bãi lấy đúng Dị Biến đầu của elite, sức 0.4 ──
    const e = dung(); e.db = ['loantien','hutsinh'];
    e.x = -9000; e.y = -9000;   // elite sống nhưng ở xa: thừa hưởng tính theo mã bãi, còn đòn của nó không được lẫn vào phép đo
    const mate = spawnMob('bandao', { x:600, y:600, r:0, count:1 }, 777, false, {});
    // Con bãi khác CHỈ dùng để đọc dbOf — đọc xong đẩy nó đi xa. Để nó đứng cạnh người chơi thì
    // đòn của nó (×1) lẫn vào phép đo: có lượt ra ×1 (nó đánh trước), có lượt ×2.14 (hai con cùng
    // khung) — bài đỏ 1/3 lượt cho cùng một mã.
    const khac = spawnMob('bandao', { x:600, y:600, r:0, count:1 }, 999, false, {});
    o.thuaHuong = { dau: dbOf(mate, 'loantien'), thu2: dbOf(mate, 'hutsinh'), baiKhac: dbOf(khac, 'loantien') };
    khac.x = -9500; khac.y = -9500;
    const dmgMate = danhToi(mate, 30);
    o.thuaHuong.tyLe = +(dmgMate / Math.max(1, mocDmg)).toFixed(2);
    // ── vẽ không nổ ──
    curMap = 'nhanmon'; buildWorld();
    try { for (const m of mobs) drawMob(m); o.veOk = true; } catch (err) { o.veOk = String(err); }
    o.tenRieng = mobs.filter(m => m.dbChamp).map(m => m.eliteName);
    return o;
  });
  console.log(JSON.stringify(r, null, 1));

  if (r.khoaLa.length) fail(`hồ Dị Biến có khoá ngoài nhóm chỉ số: ${r.khoaLa} — nhóm né-tránh chỉ mở khi có Vùng Vỡ Ấn`);
  else pass(`${r.soDiBien} Dị Biến, toàn bộ thuộc nhóm chỉ số`);
  for (const k in r.bai){
    const d = r.bai[k];
    if (d.dung1 !== d.coElite) fail(`${k}: ${d.dung1}/${d.coElite} bãi elite có đúng một Kẻ Dị Biến`);
    else if (d.khongEliteMaCo) fail(`${k}: ${d.khongEliteMaCo} bãi KHÔNG elite mà có Kẻ Dị Biến`);
    else if (d.tiepChamp) fail(`${k}: Kẻ Tiếp Sức bị gán Dị Biến`);
    else if (d.soDb.some(n => n < 2 || n > 4)) fail(`${k}: số Dị Biến ngoài 2–4: ${d.soDb}`);
    else pass(`${k}: ${d.coElite} bãi elite → đúng một Kẻ Dị Biến mỗi bãi, 2–4 Dị Biến`);
  }
  if (r.bossCoDb) fail(`${r.bossCoDb} boss mang Dị Biến — boss có bộ chiêu riêng, không dùng hệ này`); else pass('boss không mang Dị Biến');
  const chet = Object.entries(r.hieuLuc).filter(([,v]) => !v.doi);
  if (chet.length) fail(`Dị Biến bật lên mà KHÔNG đổi gì: ${chet.map(([k,v])=>`${k} (${v.ghiChu})`).join(' · ')}`);
  else pass(`cả ${Object.keys(r.hieuLuc).length} Dị Biến đều đổi được đại lượng đo được: ` + Object.entries(r.hieuLuc).map(([k,v])=>`${k}: ${v.ghiChu}`).join(' · '));
  if (r.thuaHuong.dau !== 0.4 || r.thuaHuong.thu2 !== 0 || r.thuaHuong.baiKhac !== 0)
    fail(`thừa hưởng sai: đầu=${r.thuaHuong.dau} (mong 0.4), thứ hai=${r.thuaHuong.thu2} (mong 0), bãi khác=${r.thuaHuong.baiKhac} (mong 0)`);
  else pass('quái thường thừa hưởng đúng Dị Biến đầu của elite ở 40%, không lấy cái thứ hai, không lây sang bãi khác');
  if (!(r.thuaHuong.tyLe > 1.05 && r.thuaHuong.tyLe < 1.35)) fail(`quái thừa hưởng Loạn Tiễn đánh ×${r.thuaHuong.tyLe}, mong ≈×1.14`);
  else pass(`quái thừa hưởng Loạn Tiễn đánh ×${r.thuaHuong.tyLe} (elite ×1.35)`);
  if (r.veOk !== true) fail('drawMob nổ: ' + r.veOk); else pass(`vẽ tên riêng + hàng Dị Biến không lỗi (${r.tenRieng.join(', ')})`);

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
