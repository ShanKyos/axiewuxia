// 4 lỗi chặn phát hành do QA Agent đo được. Mỗi mục có ĐỐI CHỨNG để chắc là phép đo còn nhạy.
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
    const put = (x, y, hp) => { const m = { type:'boar',
      def: Object.assign({}, MOBS.boar, { hp, def:0, size:14, speed:0, aggro:0 }),
      x, y, hp, maxHp:hp, atkT:9e9, dead:false, hitT:0, deadT:0,
      zone:null, pack:null, poisonT:0, poisonDps:0, stunT:0 };
      mobs.push(m); return m; };

    // ── 1. Chiêu quạt KHÔNG được tự hất tung đội hình của mình ────────────
    // Dark Lord: skillA type 'cone'. 4 quái bất động ngay trong tầm, tung 12 lượt.
    startGame('bug', null); player.level = 100; vhAutoLearn(); calcDerived();
    buildWorld(); mobs.length = 0;
    player.x = 600; player.y = 600; player.face = 0;
    const tgts = [];
    for (let i = 0; i < 4; i++){
      const a = (i - 1.5) * 0.28;
      tgts.push(put(600 + Math.cos(a) * 118, 600 + Math.sin(a) * 118, 9e8));
    }
    const r0 = tgts.map(m => +dist(600, 600, m.x, m.y).toFixed(1));
    let lanCuoiTrung = 0;
    for (let lap = 1; lap <= 12; lap++){
      player.cd = {}; player.qi = player.maxQi;
      castSkill(player.skillBar[0]);
      const trung = tgts.filter(m => m.hitT > 0).length;
      for (const m of tgts) m.hitT = 0;
      if (trung === 4) lanCuoiTrung = lap;
    }
    o.quat_banKinhDau = r0;
    o.quat_banKinhCuoi = tgts.map(m => +dist(600, 600, m.x, m.y).toFixed(1));
    o.quat_dayRa = +(o.quat_banKinhCuoi.reduce((a,x)=>a+x,0) - r0.reduce((a,x)=>a+x,0)).toFixed(1);
    o.quat_lanCuoiDuTrung = lanCuoiTrung;

    // ĐỐI CHỨNG: đòn đơn mục tiêu VẪN phải hất lùi
    mobs.length = 0;
    const solo = put(700, 600, 9e8);
    hurtMob(solo, solo.maxHp * 0.5, 'hit');
    o.doiChung_donDon_dayRa = +(dist(600, 600, solo.x, solo.y) - 100).toFixed(1);

    // ── 2. autoEquipBest phải mặc món MẠNH nhất trong ô ─────────────────
    let _uid = 0;
    const mk = (slot, tier, rar, sigil) => {
      const sd = SLOTS.find(s => s.id === slot);
      return {
        uid: ++_uid, slot, slotName: sd.name, name: slot + '-t' + tier,
        rarity: rar, level: 1, tier, perfect:false, luck:false, life:0, element: 'Kim',
        main: { k: sd.main, v: sd.base(tier, rar), name: mainName(sd.main) },
        subs: [{ k:'atkPct', name: subName('atkPct'), v: 5, pct: true }],
        plus: 0, awakened: AWAKENED[0],
      };
    };
    startGame('thieulam', null); player.level = 100; calcDerived();
    player.equip = {}; player.inv = [];
    const quanManh = mk('quan', 10, 4, null);
    player.inv.push(mk('ao', 1, 0), mk('quan', 1, 0), quanManh);
    autoEquipBest();
    o.autoEquip_quanDaChon = player.equip.quan ? player.equip.quan.name : '(trống)';
    o.autoEquip_lucChienQuan = player.equip.quan ? itemPower(player.equip.quan) : 0;
    o.autoEquip_lucChienQuanManh = itemPower(quanManh);

    // ── 3. ăn đòn phải rung NGƯỢC hướng con vừa nện ──────────────────────
    startGame('thieulam', null); player.level = 100;
    // Bỏ né tránh VÀ bỏ trait trước khi dựng cảnh. Mục này đo HƯỚNG RUNG khi ăn đòn, né được
    // hay không hoàn toàn không liên quan — nhưng cảnh chỉ chạy 2 giây (40 khung × 0,05s) nên
    // con quái chỉ kịp ra đúng một-hai đòn, và người chơi né trúng đòn duy nhất đó là cả mục
    // đổ. Đo thật: né 0,086 → cảnh hỏng 1/200 lượt (0,5%). Hiếm, nhưng bộ 138 bài chạy thường
    // xuyên thì sớm muộn cũng dính, và khi dính thì nó tố cáo sai chỗ ("dựng cảnh sai" chứ
    // không phải "né trúng"). startGame() còn roll trait ngẫu nhiên nên né không cố định.
    player.traits = [];
    calcDerived();
    player.eva = 0;
    buildWorld(); mobs.length = 0;
    player.x = 600; player.y = 600;
    // Hướng rung TRƯỚC khi ăn đòn — bất kể nó đang là gì (swingFeel có cửa sổ 60ms nên trong
    // một lượt evaluate đồng bộ không phải lúc nào cũng ghi được).
    o.rung_truocKhiAnDon = +shakeDir.toFixed(3);
    const duoi = put(600, 800, 9e8);        // ở PHÍA DƯỚI → kỳ vọng đẩy người chơi LÊN (≈ -π/2)
    duoi.def.atk = 50; duoi.def.range = 400; duoi.atkT = 0;
    // Đo bằng CÚ SỤT máu trong từng khung, không đo hp đầu-cuối: hồi máu thụ động nhanh hơn
    // đòn của con quái nên hiệu số đầu-cuối là số ÂM dù đòn có trúng.
    let sutNhieuNhat = 0;
    for (let i = 0; i < 40; i++){ const h = player.hp; update(0.05); sutNhieuNhat = Math.max(sutNhieuNhat, h - player.hp); }
    o.rung_matMau = +sutNhieuNhat.toFixed(1);
    o.rung_sauKhiAnDon = +shakeDir.toFixed(3);   // kỳ vọng ≈ -π/2
    o.rung_bienDo = +shakeMag.toFixed(2);

    // ── 4. đòn thường đã hẹn không được sống sót qua cái chết ────────────
    startGame('thieulam', null); player.level = 100;
    // startGame(sect, null) ROLL THIÊN PHÚ NGẪU NHIÊN. Nếu trúng "Thiên Mệnh" thì onDeath()
    // return sớm ở nhánh hồi sinh tại chỗ — người chơi KHÔNG chết, nên pendingHit còn nguyên là
    // đúng, và phép thử này biến thành tung đồng xu. Dọn sạch thiên phú để chết là chết thật.
    player.traits = []; player.reviveUsed = false; player.vhReviveCd = 0;
    calcDerived();
    curMap = 'daohoa'; buildWorld(); mobs.length = 0;
    player.x = 600; player.y = 600;
    put(650, 600, 9e8);
    doBasic();
    o.pending_truoc = !!player.pendingHit;
    player.hp = 0; onDeath();
    o.pending_sauChet = !!player.pendingHit;
    respawn();
    mobs.length = 0;
    const canhDiemHoiSinh = put(player.x + 40, player.y, 9e8);
    for (let i = 0; i < 8; i++) update(0.02);
    o.pending_stMienPhi = canhDiemHoiSinh.maxHp - canhDiemHoiSinh.hp;
    // ĐỐI CHỨNG: đang sống thì đòn hẹn VẪN phải nổ
    player.cd.basic = 0;
    doBasic();
    for (let i = 0; i < 12; i++) update(0.02);
    o.doiChung_donHenVanNo = canhDiemHoiSinh.maxHp - canhDiemHoiSinh.hp > 0;
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  if (r.quat_dayRa > 1) fail(`chiêu quạt vẫn hất tung đội hình: cả đàn dạt ra ${r.quat_dayRa}px sau 12 lượt`);
  if (r.quat_lanCuoiDuTrung !== 12) fail(`tới lượt ${r.quat_lanCuoiDuTrung} là quạt trượt mất quái — phải trúng đủ 4 con cả 12 lượt`);
  if (!(r.doiChung_donDon_dayRa > 1)) fail(`đối chứng hỏng: đòn đơn mục tiêu cũng hết hất lùi (${r.doiChung_donDon_dayRa}px) — sửa quá tay`);

  if (r.autoEquip_lucChienQuan !== r.autoEquip_lucChienQuanManh)
    fail(`autoEquipBest mặc "${r.autoEquip_quanDaChon}" (LC ${r.autoEquip_lucChienQuan}) thay vì món mạnh (LC ${r.autoEquip_lucChienQuanManh})`);

  if (!(r.rung_matMau > 0)) fail('dựng cảnh sai: người chơi không ăn đòn nào');
  if (Math.abs(r.rung_sauKhiAnDon - r.rung_truocKhiAnDon) < 0.5)
    fail(`ăn đòn không đặt lại hướng rung (vẫn ${r.rung_sauKhiAnDon}, hướng cũ ${r.rung_truocKhiAnDon})`);
  if (Math.abs(r.rung_sauKhiAnDon + Math.PI / 2) > 0.3)
    fail(`hướng rung sai: kỳ vọng ≈ -1.571 (đẩy người chơi LÊN, ngược con ở phía dưới), đo được ${r.rung_sauKhiAnDon}`);

  if (!r.pending_truoc) fail('dựng cảnh sai: doBasic() không hẹn được đòn');
  if (r.pending_sauChet) fail('đòn thường đã hẹn còn sống qua cái chết');
  if (r.pending_stMienPhi !== 0) fail(`một đòn miễn phí sau khi hồi sinh: ${r.pending_stMienPhi} ST`);
  if (!r.doiChung_donHenVanNo) fail('đối chứng hỏng: đang sống mà đòn hẹn cũng không nổ — dọn quá tay');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
