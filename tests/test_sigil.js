// Khắc Ấn: mỗi cái phải ĐỔI HÀNH VI thật, không chỉ là một dòng chữ.
// Cách kiểm: dựng cùng một tình huống chiến đấu HAI lần — không mang Khắc Ấn và có mang —
// rồi so kết quả đo được (ST lan sang con bên cạnh, khiên nhận được, số đạn sinh ra,
// vùng đất còn lại, hồi chiêu, vị trí người chơi...). Giống nhau = Khắc Ấn không làm gì.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const res = await p.evaluate(() => {
    window.TEST_MODE = true;
    const out = { table: [], probes: {}, errors: [] };

    // ── đồ nghề ──
    // Dựng lại một cảnh chiến đấu tất định: n con quái xếp thành hàng ngang trước mặt.
    function scene(sect, n, gap){
      startGame(sect, null);
      player.level = 80; vhAutoLearn(); calcDerived();
      player.hp = player.maxHp; player.qi = player.maxQi;
      player.x = 600; player.y = 600; player.face = 0;
      mobs.length = 0; projectiles.length = 0; effects.length = 0;
      sigilReset();
      player.vhShield = 0;
      for (let i = 0; i < n; i++){
        mobs.push({ type:'boar', def: Object.assign({}, MOBS.boar, { hp: 999999, def: 0, size: 14 }),
          x: 600 + 70 + i*(gap||60), y: 600, hp: 999999, maxHp: 999999,
          atkT: 9e9, dead:false, hitT:0, deadT:0, zone:null, pack:null, poisonT:0, poisonDps:0 });
      }
      return mobs;
    }
    // Tổng sát thương đã ăn vào từng con (999999 - hp)
    const taken = () => mobs.map(m => 999999 - m.hp);
    // Bật đúng 1 Khắc Ấn (bỏ qua calcDerived — nó sẽ ghi đè bằng đồ đang mặc)
    function only(k){ player.sigils = k ? { [k]: true } : {}; }

    // Chạy cùng kịch bản 2 lần: không Khắc Ấn / có Khắc Ấn. `run` trả về số cần so.
    function ab(sect, key, run, setup){
      const A = (() => { setup(); only(null); return run(); })();
      const B = (() => { setup(); only(key); return run(); })();
      return { A, B };
    }

    // ══ 1. Lan Trảm (Dark Knight) — chiêu chính phải lan sang con thứ 2 ══
    {
      const r = ab('thieulam', 'dk_lantram',
        () => { castSkill('a'); return taken(); },
        // con 2 phải NGOÀI quạt chiêu chính (~155px tính từ người chơi) nhưng TRONG 160px của con 1:
        // đặt cách 140 ⇒ con 2 ở 210px từ người chơi, và cách con 1 đúng 140.
        () => scene('thieulam', 2, 140));
      out.table.push({ sigil:'dk_lantram', metric:'ST lên con thứ 2',
        off: r.A[1], on: r.B[1], pass: r.A[1] === 0 && r.B[1] > 0 });
    }

    // ══ 2. Thành Lũy (Dark Knight) — chiêu chính phải sinh khiên ══
    {
      const r = ab('thieulam', 'dk_thanhluy',
        () => { castSkill('a'); return player.vhShield || 0; },
        () => scene('thieulam', 3, 40));
      out.table.push({ sigil:'dk_thanhluy', metric:'khiên nhận được',
        off: r.A, on: r.B, pass: r.A === 0 && r.B > 0 });
    }

    // ══ 3. Tách Tiễn (Sylvan Ranger) — đạn phụ sinh ra khi tên chạm địch ══
    {
      const r = ab('toanchan', 'sr_tachtien',
        () => {
          castSkill('a');
          for (let i = 0; i < 40 && !projectiles.some(q => q.sigilSplit); i++) update(0.02);
          return projectiles.filter(q => q.sigilSplit).length;
        },
        () => scene('toanchan', 1, 60));
      out.table.push({ sigil:'sr_tachtien', metric:'đạn tách ra',
        off: r.A, on: r.B, pass: r.A === 0 && r.B >= 2 });
    }

    // ══ 4. Mưa Tiễn (Sylvan Ranger) — Trấn Phái hẹn một đòn thứ hai ~1,1s sau ══
    {
      const r = ab('toanchan', 'sr_muatien',
        () => {
          castSkill('tp');
          const afterTp = taken().slice();
          for (let i = 0; i < 90; i++) update(0.02);   // 1,8s
          const later = taken();
          return later.reduce((s,v,i) => s + (v - afterTp[i]), 0);   // ST tăng thêm SAU cú Trấn Phái
        },
        () => scene('toanchan', 3, 50));
      out.table.push({ sigil:'sr_muatien', metric:'ST đợt 2 sau 1,1s',
        off: r.A, on: r.B, pass: r.A === 0 && r.B > 0 });
    }

    // ══ 5. Vũng Tà Độc (Dark Wizard) — Trấn Phái để lại vùng đất gây ST liên tục ══
    {
      const r = ab('baidasan', 'dw_vungdoc',
        () => {
          castSkill('tp');
          const afterTp = taken().slice();
          const zones = sigilZones.length;
          for (let i = 0; i < 100; i++) update(0.02);  // 2s
          const later = taken();
          return { zones, dot: later.reduce((s,v,i) => s + (v - afterTp[i]), 0) };
        },
        () => scene('baidasan', 3, 50));
      out.table.push({ sigil:'dw_vungdoc', metric:'vùng đất / ST theo thời gian',
        off: `${r.A.zones}z ${r.A.dot}`, on: `${r.B.zones}z ${r.B.dot}`,
        pass: r.A.zones === 0 && r.A.dot === 0 && r.B.zones === 1 && r.B.dot > 0 });
    }

    // ══ 6. Vọng Âm (Dark Wizard) — 35% nổ lần 2; chạy nhiều lượt rồi so tổng ST ══
    {
      const trial = (k) => {
        let tot = 0;
        for (let n = 0; n < 40; n++){
          scene('baidasan', 2, 45); only(k);
          castSkill('a');
          for (let i = 0; i < 40; i++) update(0.02);
          tot += taken().reduce((a,c)=>a+c, 0);
        }
        return Math.round(tot);
      };
      const A = trial(null), B = trial('dw_vongam');
      out.table.push({ sigil:'dw_vongam', metric:'tổng ST 40 lượt', off:A, on:B, pass: B > A * 1.05 });
    }

    // ══ 7. Bùng Cháy (Spellblade) — quái trúng chiêu chính bị cháy, chết thì nổ lan ══
    {
      scene('minhgiao', 3, 55); only('sb_bungchay');
      castSkill('a');
      const burning = mobs.filter(m => m.poisonT > 0 && m.sgBurn).length;
      // ép con đầu chết trong lúc còn cháy → 2 con kia phải ăn ST nổ
      const victim = mobs[0];
      const before = mobs.slice(1).map(m => 999999 - m.hp);
      victim.hp = 1; hurtMob(victim, 50, 'hit');
      const after = mobs.slice(1).map(m => 999999 - m.hp);
      const splash = after.reduce((s,v,i) => s + (v - before[i]), 0);
      out.table.push({ sigil:'sb_bungchay', metric:'quái bốc cháy / ST nổ lan',
        off:'—', on:`${burning} cháy, nổ ${splash}`, pass: burning >= 1 && splash > 0 });
    }

    // ══ 8. Xung Phong (Spellblade) — tung chiêu ở xa thì lướt tới trước ══
    {
      const r = ab('minhgiao', 'sb_xungphong',
        () => { const x0 = player.x; castSkill('a'); return Math.round(player.x - x0); },
        () => { scene('minhgiao', 1, 60); mobs[0].x = 600 + 300; });  // địch ở 300px, ngoài tầm quạt 130
      out.table.push({ sigil:'sb_xungphong', metric:'lướt được bao xa (px)',
        off: r.A, on: r.B, pass: r.A === 0 && r.B > 100 });
    }

    // ══ 9. Trùng Sóng (Dark Lord) — sóng thứ 2 sau 0,35s ══
    {
      const r = ab('bug', 'dl_trungsong',
        () => {
          castSkill('a');
          const afterCast = taken().slice();
          for (let i = 0; i < 40; i++) update(0.02);  // 0,8s
          const later = taken();
          return later.reduce((s,v,i) => s + (v - afterCast[i]), 0);
        },
        () => scene('bug', 3, 50));
      out.table.push({ sigil:'dl_trungsong', metric:'ST sóng 2',
        off: r.A, on: r.B, pass: r.A === 0 && r.B > 0 });
    }

    // ══ 10. Hiệu Triệu (Dark Lord) — trúng ≥3 con thì Trấn Phái hồi ngay nửa cd ══
    {
      const r = ab('bug', 'dl_hieutrieu',
        () => { castSkill('tp'); const cd0 = player.cd.tp; castSkill('a'); return +(cd0 - player.cd.tp).toFixed(2); },
        // Gap 34 đặt con thứ ba ở 138px, sát rìa tầm quạt 139 — chênh ĐÚNG 1 pixel. Hất lùi
        // thêm sau này đẩy nó ra ngoài và test đỏ mà không phải lỗi Khắc Ấn. Gap 26 cho biên
        // an toàn thật sự (con thứ tư ở 148, vẫn trong tầm).
        () => scene('bug', 4, 26));
      out.table.push({ sigil:'dl_hieutrieu', metric:'cd Trấn Phái được cắt (s)',
        off: r.A, on: r.B, pass: r.A === 0 && r.B > 0 });
    }

    // ══ 11. Hồi Quang (chung) — hạ quái rút ngắn mọi hồi chiêu ══
    {
      const r = ab('thieulam', 'un_hoiquang',
        () => {
          castSkill('a');
          const cd0 = player.cd.a;
          const v = mobs[0]; v.hp = 1; hurtMob(v, 50, 'hit');
          return +(cd0 - player.cd.a).toFixed(3);
        },
        () => scene('thieulam', 2, 60));
      out.table.push({ sigil:'un_hoiquang', metric:'hồi chiêu cắt bớt (s)',
        off: r.A, on: r.B, pass: r.A === 0 && r.B > 0 });
    }

    // ══ 12. Vọng Khí (chung) — bạo kích nổ lan sang con bên cạnh ══
    {
      const trial = (k) => {
        // bán kính nổ Vọng Khí là 96 (+size quái) ⇒ đặt con 2 cách 80 để nằm gọn trong đó
        scene('thieulam', 2, 80); only(k);
        player.crit = 1;                   // ép bạo kích 100% để khỏi phụ thuộc may rủi
        calcDerived === null; // (không gọi lại calcDerived — nó sẽ ghi đè crit)
        const before = 999999 - mobs[1].hp;
        hurtMob(mobs[0], 500, 'crit');
        return (999999 - mobs[1].hp) - before;
      };
      const A = trial(null), B = trial('un_vongkhi');
      out.table.push({ sigil:'un_vongkhi', metric:'ST lan khi bạo kích', off:A, on:B, pass: A === 0 && B > 0 });
    }

    // ── thăm dò hệ thống ──
    startGame('thieulam', null); player.level = 80; vhAutoLearn(); calcDerived();
    out.probes.tongSo = Object.keys(SIGIL_DEFS).length;
    out.probes.moiLop = {};
    for (const s of ['thieulam','toanchan','baidasan','minhgiao','bug']) out.probes.moiLop[s] = sigilPool(s).length;

    // Chống đệ quy: Lan Trảm giữa một bầy dày không được treo máy / tràn ngăn xếp
    scene('thieulam', 8, 40); only('dk_lantram');
    const t0 = performance.now();
    for (let i = 0; i < 5; i++){ player.cd.a = 0; castSkill('a'); }
    out.probes.chongDeQuy_ms = Math.round(performance.now() - t0);

    // Khắc Ấn của lớp KHÁC mặc vào phải nằm im
    startGame('baidasan', null); player.level = 80; vhAutoLearn();
    player.equip.non = Object.assign(genItem(80, 0), { sigil:'dk_lantram' });   // Dark Knight-only
    calcDerived();
    out.probes.saiLop_bo_qua = Object.keys(player.sigils).length === 0;
    player.equip.non = Object.assign(genItem(80, 0), { sigil:'un_hoiquang' });  // dùng chung
    calcDerived();
    out.probes.dungChung_nhan = !!player.sigils.un_hoiquang;

    // rollSigil ưu tiên cái chưa có
    startGame('thieulam', null); player.level = 80; calcDerived();
    player.inv = [];
    const pool = sigilPool('thieulam');
    for (const k of pool.slice(0, pool.length - 1)) player.inv.push(Object.assign(genItem(80,0), { sigil:k }));
    const rolls = new Set();
    for (let i = 0; i < 30; i++) rolls.add(rollSigil('thieulam'));
    out.probes.uuTien_chuaCo = rolls.size === 1 && rolls.has(pool[pool.length - 1]);

    // Đổi map phải dọn sạch vùng đất/hẹn giờ
    startGame('baidasan', null); player.level = 80; vhAutoLearn(); calcDerived();
    only('dw_vungdoc'); player.cd.tp = 0; castSkill('tp');
    const zBefore = sigilZones.length;
    buildWorld();
    out.probes.doiMap_donSach = zBefore > 0 && sigilZones.length === 0;

    return out;
  });

  const w = (s, n) => String(s).padEnd(n);
  console.log(w('KHẮC ẤN', 16), w('ĐO', 34), w('TẮT', 14), w('BẬT', 16), 'KQ');
  console.log('-'.repeat(92));
  let bad = 0;
  for (const r of res.table){
    if (!r.pass) bad++;
    console.log(w(r.sigil, 16), w(r.metric, 34), w(r.off, 14), w(r.on, 16), r.pass ? 'OK' : '✗ KHÔNG ĐỔI HÀNH VI');
  }
  console.log('');
  console.log('thăm dò:', JSON.stringify(res.probes, null, 1));

  const P = res.probes;
  const fail = m => { console.log('FAIL', m); bad++; };
  if (P.tongSo !== 12) fail('phải có 12 Khắc Ấn, có ' + P.tongSo);
  for (const s in P.moiLop) if (P.moiLop[s] !== 4) fail(`lớp ${s} phải dùng được 4, có ${P.moiLop[s]}`);
  if (P.chongDeQuy_ms > 900) fail('nghi đệ quy — 5 lượt tung mất ' + P.chongDeQuy_ms + 'ms');
  if (!P.saiLop_bo_qua) fail('Khắc Ấn của lớp khác vẫn kích hoạt');
  if (!P.dungChung_nhan) fail('Khắc Ấn dùng chung không kích hoạt');
  if (!P.uuTien_chuaCo) fail('rollSigil không ưu tiên Khắc Ấn chưa có');
  if (!P.doiMap_donSach) fail('đổi map không dọn vùng đất Khắc Ấn');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
