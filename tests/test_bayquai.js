// Vai Trò quái + Kẻ Tiếp Sức (docs/VUNG_VO_AN_ENDGAME.md §5).
//
// Ba thứ dễ hỏng của một hệ "mục tiêu ưu tiên":
//   1. Buff CHỈ hiện trên nhãn mà không đổi số — nên đo bằng chỉ số thật (máu tối đa, sát thương
//      quái gây ra), không đọc cờ.
//   2. Buff máu nhân CHỒNG qua các lần đồng bộ/hồi sinh (×1.2 rồi ×1.2 nữa) — nên đồng bộ hai lần
//      liên tiếp phải ra cùng một số.
//   3. AUTO vẫn đánh con gần nhất, bỏ qua Kẻ Tiếp Sức — nên nearestMob() phải trả về nó dù có con
//      khác đứng gần hơn.
// Kèm đối chứng: đai 0 (Petalshade Isle/Outskirts) KHÔNG được có Kẻ Tiếp Sức — đó là chỗ tân thủ học
// đánh nhau, không phải chỗ dạy chiến thuật.
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
    startGame('thieulam', null); player.traits = []; player.level = 60; calcDerived();
    const o = {};

    // ── 1. mọi quái trong bãi có vai trò hợp lệ; hệ số vai trò không phồng máu quá 60% ──
    const allPk = []; for (const k in MAPS) for (const pk of (MAPS[k].packs || [])) allPk.push(pk);
    o.soBai = allPk.length;
    o.vaiTroLa = allPk.map(pk => mobRole(pk.mob)).filter(v => !ROLE[v]);
    o.heSoMauMax = Math.max(...Object.values(ROLE).map(v => v.hp));

    // ── 2. đai 0 không có Kẻ Tiếp Sức, đai 1+ (map min ≥ 20) mỗi bãi đúng một ──
    o.dai0Tiep = ['daohoa','ngoai'].map(k => (MAPS[k].packs || []).filter(pk => pk.tiep).length);
    o.dai1 = {};
    for (const k of ['chungnam','comoc','tuyettinh','mongco','nhanmon']){
      curMap = k; buildWorld();
      const byPack = {};
      for (const m of mobs){ if (m.pack == null) continue; (byPack[m.pack] = byPack[m.pack] || { n:0, tiep:0 }); byPack[m.pack].n++; if (m.tiep) byPack[m.pack].tiep++; }
      const packs = Object.values(byPack);
      o.dai1[k] = { bai: packs.length, baiCoDung1: packs.filter(x => x.tiep === 1).length,
                    baiSai: packs.filter(x => x.tiep !== 1).map(x => x.tiep) };
    }

    // ── 3. buff thật: đo trên Thornwood Reach ──
    curMap = 'chungnam'; buildWorld();
    const tiep = mobs.find(m => m.tiep);
    const mates = mobs.filter(m => !m.dead && !m.tiep && m.pack === tiep.pack);
    const goc = MOBS[mates[0].type];
    const gocHp = mobHp(Object.assign({}, goc, { hp: Math.round(goc.hp * ROLE[mates[0].role].hp) }));
    o.mau = { coTiep: mates[0].maxHp, goc: gocHp, tyLe: +(mates[0].maxHp / gocHp).toFixed(3), TIEP_HP };
    // đồng bộ lại hai lần: không được nhân chồng
    syncTiepHp(tiep.pack); syncTiepHp(tiep.pack);
    o.mau.sauDongBo2Lan = mates[0].maxHp;
    // Kẻ Tiếp Sức đứng rìa, không ở giữa bầy.
    // Đo trên MỌI bãi có Kẻ Tiếp Sức rồi lấy trung vị, chứ không đo một mẫu: vị trí thả là ngẫu
    // nhiên, nên một lượt rơi vào đuôi phân phối (đo được 63px) làm cả bài kiểm đỏ dù luật vẫn
    // đúng. Chốt luật bằng trung vị, và cho đuôi một biên độ.
    {
      const ds = [];
      for (const t of mobs.filter(m => !m.dead && m.tiep)){
        const b = mobs.filter(m => !m.dead && !m.tiep && m.pack === t.pack);
        if (b.length < 2) continue;
        const bx = b.reduce((a,m)=>a+m.x,0)/b.length, by = b.reduce((a,m)=>a+m.y,0)/b.length;
        ds.push(Math.round(dist(t.x, t.y, bx, by)));
      }
      ds.sort((a,b)=>a-b);
      o.tiepCachTam = ds.length ? ds[ds.length >> 1] : 0;    // trung vị
      o.tiepMin = ds[0] || 0; o.tiepSo = ds.length;
      o.tiepGanTam = ds.filter(d => d < 60).length;          // đuôi: bao nhiêu con lọt vào giữa bầy
    }
    // sát thương quái gây ra: đo TRƯỚC/SAU khi giết Kẻ Tiếp Sức, tắt né và ngẫu nhiên.
    // Chỉ MỘT con được ở gần người chơi — cả bầy đứng sát nách thì hiệu số máu gộp đòn của
    // nhiều con và tỉ lệ đo ra vô nghĩa (lần đầu đo ra ×1.446 vì đúng lỗi này).
    const chiGiu = (giu) => { for (const m of mobs) if (!giu.includes(m)){ m.x = -9000; m.y = -9000; m.homeX = m.x; m.homeY = m.y; } };
    chiGiu([mates[0], tiep]); tiep.x = -9000; tiep.y = -9000;   // Kẻ Tiếp Sức sống nhưng ở xa — buff tính theo mã bãi, không theo khoảng cách
    player.eva = 0; player.defRed = 0; player.excBlock = 0; player.gkBuffT = 0;
    const _rnd = Math.random; Math.random = () => 0.5;
    // Ép defRed/eva = 0 TRONG từng khung: killMob → thưởng → có thể gọi calcDerived() và trả
    // defRed về giá trị thật giữa hai phép đo (lần đo đầu ra ×1.446 = 1.25 × 1/(1−0.136) đúng
    // vì thế). Đo sát thương quái thì giáp người chơi phải bị khoá 0 suốt phép đo.
    const doDon = (m) => {
      const hp0 = player.hp = player.maxHp; m.atkT = 0; m.x = player.x + 20; m.y = player.y;
      let defTruoc = player.defRed;
      for (let i = 0; i < 6 && player.hp === hp0; i++){ player.defRed = 0; player.eva = 0; player.excBlock = 0; update(0.05); }
      o.defRedLucDo = (o.defRedLucDo || []).concat([+defTruoc.toFixed(3)]);
      return hp0 - player.hp;
    };
    const dmgCo = doDon(mates[0]);
    tiep.hp = 0; killMob(tiep, 'hit');
    const mauSau = mates[0].maxHp;
    const dmgKhong = doDon(mates[0]);
    Math.random = _rnd;
    o.don = { coTiep: dmgCo, khongTiep: dmgKhong, tyLe: +(dmgCo / Math.max(1, dmgKhong)).toFixed(3), TIEP_ATK };
    o.mau.sauGiet = mauSau;

    // ── 4. nearestMob ưu tiên Kẻ Tiếp Sức dù có con khác gần hơn ──
    curMap = 'chungnam'; buildWorld();
    const t2 = mobs.find(m => m.tiep);
    const gan = mobs.find(m => !m.dead && !m.tiep && m.pack === t2.pack);
    chiGiu([t2, gan]);                    // không cho bãi khác/Du Hiệp lọt vào tầm 400
    player.x = 1000; player.y = 1000;
    gan.x = 1030; gan.y = 1000;          // sát nách
    t2.x = 1250; t2.y = 1000;            // xa hơn nhưng trong tầm
    o.chon = { la: nearestMob(400) === t2 ? 'tiep' : nearestMob(400) === gan ? 'gan' : 'khac',
               ngoaiTam: (t2.x = 1900, nearestMob(400) === gan) };

    // ── 5. hồi sinh giữ đúng vai trò ──
    curMap = 'chungnam'; buildWorld();
    const t3 = mobs.find(m => m.tiep); const pk3 = t3.pack, zone3 = t3.zone;
    t3.hp = 0; killMob(t3, 'hit'); t3.respawnT = 0;
    for (let i = 0; i < 40; i++) update(0.1);
    const song = mobs.filter(m => !m.dead && m.pack === pk3);
    o.hoiSinh = { soTiep: song.filter(m => m.tiep).length, tong: song.length, zoneCount: zone3.count,
                  mateBuffLai: song.filter(m => !m.tiep)[0]._tiepHp === true };

    // ── 6. vẽ không nổ ──
    try { for (const m of mobs) drawMob(m); o.veOk = true; } catch (e) { o.veOk = String(e); }
    return o;
  });
  console.log(JSON.stringify(r, null, 1));

  if (r.vaiTroLa.length) fail(`vai trò lạ trong bãi: ${r.vaiTroLa}`); else pass(`${r.soBai} bãi, vai trò đều hợp lệ`);
  if (r.heSoMauMax > 1.6) fail(`hệ số máu vai trò tới ${r.heSoMauMax} — phồng số ngầm`); else pass('hệ số máu vai trò ≤ 1.6');
  if (r.dai0Tiep.some(n => n > 0)) fail(`đai 0 có Kẻ Tiếp Sức: ${r.dai0Tiep}`); else pass('đai 0 (tân thủ) không có Kẻ Tiếp Sức');
  for (const k in r.dai1){
    const d = r.dai1[k];
    if (d.baiCoDung1 !== d.bai) fail(`${k}: ${d.baiCoDung1}/${d.bai} bãi có đúng 1 Kẻ Tiếp Sức (lệch: ${d.baiSai})`);
    else pass(`${k}: ${d.bai}/${d.bai} bãi đúng một Kẻ Tiếp Sức`);
  }
  if (Math.abs(r.mau.tyLe - r.mau.TIEP_HP) > 0.02) fail(`máu đồng bọn ×${r.mau.tyLe}, mong ×${r.mau.TIEP_HP}`);
  else pass(`Kẻ Tiếp Sức sống → đồng bọn máu ×${r.mau.tyLe}`);
  if (r.mau.sauDongBo2Lan !== r.mau.coTiep) fail(`đồng bộ hai lần nhân chồng: ${r.mau.coTiep} → ${r.mau.sauDongBo2Lan}`);
  else pass('đồng bộ lại không nhân chồng');
  if (r.mau.sauGiet !== r.mau.goc) fail(`giết Kẻ Tiếp Sức xong máu đồng bọn ${r.mau.sauGiet}, mong về ${r.mau.goc}`);
  else pass(`giết Kẻ Tiếp Sức → máu đồng bọn về ${r.mau.goc}`);
  if (!(r.don.coTiep > 0 && r.don.khongTiep > 0)) fail(`dựng cảnh sai: đòn ${r.don.coTiep}/${r.don.khongTiep}`);
  else if (Math.abs(r.don.tyLe - r.don.TIEP_ATK) > 0.06) fail(`sát thương có/không Kẻ Tiếp Sức = ×${r.don.tyLe}, mong ×${r.don.TIEP_ATK}`);
  else pass(`Kẻ Tiếp Sức sống → đồng bọn đánh ×${r.don.tyLe} (${r.don.coTiep} vs ${r.don.khongTiep})`);
  if (r.tiepCachTam < 80) fail(`Kẻ Tiếp Sức đứng giữa bầy — trung vị ${r.tiepCachTam}px trên ${r.tiepSo} bãi`);
  else if (r.tiepGanTam > r.tiepSo * 0.25) fail(`${r.tiepGanTam}/${r.tiepSo} Kẻ Tiếp Sức lọt vào giữa bầy (<60px)`);
  else pass(`Kẻ Tiếp Sức đứng rìa bầy — trung vị ${r.tiepCachTam}px, gần nhất ${r.tiepMin}px, ${r.tiepSo} bãi`);
  if (r.chon.la !== 'tiep') fail(`nearestMob chọn '${r.chon.la}' thay vì Kẻ Tiếp Sức`); else pass('nearestMob chọn Kẻ Tiếp Sức dù có con khác sát nách');
  if (!r.chon.ngoaiTam) fail('Kẻ Tiếp Sức ngoài tầm mà vẫn bị chọn — phải về con gần nhất'); else pass('ngoài tầm thì về con gần nhất');
  if (r.hoiSinh.soTiep !== 1) fail(`hồi sinh ra ${r.hoiSinh.soTiep} Kẻ Tiếp Sức (tổng ${r.hoiSinh.tong}/${r.hoiSinh.zoneCount})`);
  else pass('Kẻ Tiếp Sức chết thì hồi sinh lại đúng một Kẻ Tiếp Sức');
  if (!r.hoiSinh.mateBuffLai) fail('hồi sinh rồi mà đồng bọn không được buff máu lại'); else pass('hồi sinh xong buff máu bầy nối lại');
  if (r.veOk !== true) fail('drawMob nổ: ' + r.veOk); else pass('vẽ hào quang không lỗi');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
