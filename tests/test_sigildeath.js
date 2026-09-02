// QA Agent tìm ra 3 lỗi Khắc Ấn: (S-1) vũng độc sống qua cái chết rồi chạy tiếp ở toạ độ cũ,
// (S-3) sóng hẹn giờ nổ sau khi hồi sinh, (S-7) hạ địch BẰNG Khắc Ấn không kích móc 'kill'
// nên Hồi Quang câm. Test chứng minh cả ba đã đổi hành vi.
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

  const r = await p.evaluate(() => {
    window.TEST_MODE = true;
    const o = {};
    const mk = (x, y, hp) => { const m = { type:'boar',
      def: Object.assign({}, MOBS.boar, { hp: hp, def: 0, size: 14 }),
      x, y, hp, maxHp: hp, atkT: 9e9, dead:false, hitT:0, deadT:0,
      zone:null, pack:null, poisonT:0, poisonDps:0 };
      mobs.push(m); return m; };

    // ── S-1: vũng độc phải TẮT khi chết ──────────────────────────────────
    startGame('baidasan', null);
    player.level = 100; vhAutoLearn(); calcDerived();
    // startGame() roll BA thiên phú ngẫu nhiên, và một trong số đó là "Số Trời": chết thì hồi
    // sinh tại chỗ, onDeath() rẽ nhánh sớm và không bao giờ chạy tới đoạn dọn vũng độc. Bài kiểm
    // này nói về việc dọn Khắc Ấn khi chết, không nói về Số Trời — nên tắt hẳn nó đi.
    // Không tắt thì bài đỏ đúng những lượt roll trúng (khoảng 1/45 lần chạy), và đó là kiểu đỏ
    // tốn nhiều giờ nhất để truy: hôm nay chạy riêng 17 lần liên tiếp đều xanh.
    player.traits = []; player.traitRevive = false; player.reviveUsed = false;
    player.sigils = { dw_vungdoc: 1 };
    sigilReset();
    sigilZones.push({ x: player.x, y: player.y, r: 165, t: 5, tick: 0.5, dps: 100, color: '#8f5ae8' });
    o.s1_zoneTruoc = sigilZones.length;
    player.hp = 0; onDeath();
    o.s1_zoneSauChet = sigilZones.length;
    respawn();
    o.s1_zoneSauHoiSinh = sigilZones.length;

    // ── S-3: sóng hẹn giờ phải TẮT khi chết ──────────────────────────────
    dead = false; player.hp = player.maxHp;
    sigilReset();
    let noSau = 0;
    sigilAfter(0.35, () => { noSau++; });
    o.s3_timerTruoc = sigilTimers.length;
    player.hp = 0; onDeath();
    o.s3_timerSauChet = sigilTimers.length;
    respawn();
    for (let i = 0; i < 20; i++) sigilTick(0.05);
    o.s3_noSauHoiSinh = noSau;

    // ── S-7: hạ địch bằng Khắc Ấn phải kích móc 'kill' (Hồi Quang) ───────
    dead = false; player.hp = player.maxHp;
    const doHoiQuang = (killer) => {
      buildWorld(); sigilReset();
      player.sigils = { un_hoiquang: 1 };
      player.cd = player.cd || {}; player.cd.tp = 10;
      const m = mk(player.x + 60, player.y, 50);
      killer(m);
      return { cdTp: +(player.cd.tp).toFixed(3), chet: !!m.dead };
    };
    o.s7_bangKhacAn  = doHoiQuang(m => sigilHurt(m, 9999));       // sát thương nguồn 'sigil'
    o.s7_bangDonThuong = doHoiQuang(m => hurtMob(m, 9999, 'hit')); // đối chứng

    // ── đối chứng: móc 'hit' VẪN không được tự kích lại (chống vòng lặp) ──
    buildWorld(); sigilReset();
    let hitDem = 0;
    player.sigils = {};
    const saved = SIGIL_DEFS.un_vongkhi.hit;
    SIGIL_DEFS.un_vongkhi.hit = (m) => { hitDem++; sigilHurt(m, 1); };
    player.sigils = { un_vongkhi: 1 };
    const mm = mk(player.x + 60, player.y, 999999);
    hurtMob(mm, 10, 'hit');
    SIGIL_DEFS.un_vongkhi.hit = saved;
    o.hit_khongDeQuy = hitDem;
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (r.s1_zoneTruoc !== 1) fail('dựng cảnh sai: chưa có vũng độc trước khi chết');
  if (r.s1_zoneSauChet !== 0) fail(`vũng độc còn sống qua cái chết (${r.s1_zoneSauChet})`);
  if (r.s1_zoneSauHoiSinh !== 0) fail('vũng độc chạy tiếp sau khi hồi sinh, ở toạ độ cũ');
  if (r.s3_timerTruoc !== 1) fail('dựng cảnh sai: chưa hẹn được giờ');
  if (r.s3_timerSauChet !== 0) fail(`sóng hẹn giờ còn sống qua cái chết (${r.s3_timerSauChet})`);
  if (r.s3_noSauHoiSinh !== 0) fail('sóng vẫn nổ sau khi hồi sinh');
  if (!r.s7_bangDonThuong.chet || r.s7_bangDonThuong.cdTp >= 10)
    fail(`đối chứng hỏng: đòn thường kết liễu mà Hồi Quang không chạy (${JSON.stringify(r.s7_bangDonThuong)})`);
  if (!r.s7_bangKhacAn.chet) fail('Khắc Ấn không hạ nổi quái — dựng cảnh sai');
  if (r.s7_bangKhacAn.cdTp >= 10)
    fail(`hạ địch bằng Khắc Ấn vẫn KHÔNG kích móc kill (cd còn ${r.s7_bangKhacAn.cdTp})`);
  if (r.hit_khongDeQuy !== 1)
    fail(`móc 'hit' tự kích lại ${r.hit_khongDeQuy} lần — chống đệ quy đã bị nới lỏng quá tay`);

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
