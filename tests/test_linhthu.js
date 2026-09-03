// LINH THÚ — tính năng riêng: nhận một lần, roll dòng phụ, nuôi tới +11.
// Luật cốt lõi phải giữ bằng mọi giá: THĂNG CẤP HỎNG KHÔNG BAO GIỜ MẤT PET, KHÔNG TỤT CẤP.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); });
  await p.waitForTimeout(500);

  const rich = () => {
    player.silver = 9e8; player.mat = 9e5;
    player.gems.tuLa = 9e4; player.gems.honNguyen = 9e4;
    player.jewels.chucPhuc = 9e4; player.jewels.linhHon = 9e4; player.jewels.honDon = 9e4;
  };

  // ── 1. quái KHÔNG còn rơi pet ──────────────────────────────────────────
  const r1 = await p.evaluate(() => {
    const src = (window.rollRewards || function(){}).toString();
    return { conNhacPets: /rw\.pets/.test(src), coGenPetTrongDrop: /rw\.pets/.test(document.body.innerHTML) };
  });
  console.log('1.', JSON.stringify(r1));
  r1.conNhacPets ? fail('bảng thưởng vẫn còn nhánh rơi pet') : pass('quái không còn rơi Linh Thú');

  // ── 2. bảng chọn giống hiện khi chưa có pet ────────────────────────────
  const r2 = await p.evaluate(() => {
    delete player.equip.pet; player.level = 20;
    closePanels(); togglePanel('char'); switchCharTab('linhthu');
    const cards = [...document.querySelectorAll('.pet-card')];
    return { soThe: cards.length, coAnh: cards.every(c => c.querySelector('img')),
             ten: cards.map(c => (c.querySelector('.pn')||{}).textContent) };
  });
  console.log('2.', JSON.stringify(r2));
  (r2.soThe === 3 && r2.coAnh) ? pass('bảng chọn giống: 3 thẻ, đủ ảnh')
                               : fail('bảng chọn giống sai: ' + JSON.stringify(r2));
  await p.screenshot({ path: '/tmp/shot_pet_pick.png' });

  // ── 3. khoá cấp ────────────────────────────────────────────────────────
  const r3 = await p.evaluate(() => {
    // Cổng tab bám theo CẤP ĐỈNH (lvPeak — "reset không được khoá lại tính năng đã mở"), không
    // theo cấp hiện tại. applyTestBoost() đã đưa cấp lên 120, nên muốn giả lập người chơi cấp 5
    // thì phải hạ cả cấp đỉnh. Trước đây bài này xanh chỉ vì lvPeak() chưa kịp chốt 120 trước khi
    // r2 hạ cấp về 20 — một tình cờ về thứ tự gọi. Nay calcDerived() → masteryAgg() → masteryOpen()
    // → lvPeak() chốt đỉnh 120 ngay trong applyTestBoost(), nên tình cờ đó không còn.
    player.level = 5; player.lvPeak = 5; renderCharPanel();
    // Linh Thú nay nằm TRONG tab mẹ ✦ Nâng Cấp, và hàng con chỉ hiện khi đang ở trong nhóm.
    // Tìm '.bang-tab.khoa' bất kỳ là bắt nhầm: ở cấp 5 thì 🔄 Tái Sinh cũng đang khoá, nên phép
    // kiểm sẽ XANH mà không hề soi tới Linh Thú. Phải vào nhóm rồi tìm ĐÚNG nút đó.
    // KHÔNG dùng switchCharTab('mount'): ở cấp 5 thì Chimera (cấp 6) đang khoá, mà switchCharTab
    // bật lại tab khoá về Thông Tin — hàng con sẽ không được vẽ ra chút nào. switchCharNhom() vào
    // đúng con ĐẦU TIÊN đang mở (Thuần Thục, cấp 4), nên hàng con hiện đủ cả bốn nút.
    switchCharNhom();
    const nut = [...document.querySelectorAll('.bang-tab')].find(b => /Linh Thú/.test(b.textContent));
    const locked = !!(nut && nut.classList.contains('khoa'));
    switchCharTab('info');
    player.level = 20; return { locked, timThay: !!nut };
  });
  if (!r3.timThay) fail('không tìm thấy nút Linh Thú trong hàng tab con');
  else r3.locked ? pass('dưới cấp 8 tab Linh Thú bị khoá') : fail('tab Linh Thú không khoá theo cấp');

  // ── 4. chọn giống → đúng một con, có dòng gốc ──────────────────────────
  const r4 = await p.evaluate(() => {
    closePanels(); togglePanel('char'); switchCharTab('linhthu');
    petPick(1);
    const it = player.equip.pet;
    return { id: it.pet, plus: it.plus, soDong: it.subs.length,
             gocK: it.subs[0].k, gocCore: !!it.subs[0].core,
             trongTui: player.inv.filter(x => x.slot === 'pet').length };
  });
  console.log('4.', JSON.stringify(r4));
  (r4.id === 'hexhorn' && r4.plus === 0 && r4.soDong === 3 && r4.gocK === 'atkPct' && r4.gocCore && r4.trongTui === 0)
    ? pass('nhận đúng 1 con, dòng gốc khoá theo giống, +0 có 2 dòng phụ')
    : fail('nhận pet sai: ' + JSON.stringify(r4));
  await p.screenshot({ path: '/tmp/shot_pet_main.png' });

  // ── 5. mọi khoá dòng phụ đều có ngăn trong sổ P ────────────────────────
  const r5 = await p.evaluate(() => {
    const src = calcDerived.toString();
    const m = src.match(/const P = \{([\s\S]*?)\};/);
    const keys = new Set((m ? m[1] : '').match(/(\w+)\s*:/g).map(x => x.replace(/\s*:/, '')));
    return { thieu: PET_SUBS.map(x => x.k).filter(k => !keys.has(k)),
             gocThieu: PET_DEFS.map(d => d.coreK).filter(k => !keys.has(k)) };
  });
  console.log('5.', JSON.stringify(r5));
  (!r5.thieu.length && !r5.gocThieu.length)
    ? pass('mọi khoá dòng phụ + dòng gốc đều có ngăn trong sổ P')
    : fail('khoá không có ngăn (dòng sẽ hiện mà vô tác dụng): ' + JSON.stringify(r5));

  // ── 6. roll: xem trước, giữ bộ cũ thì KHÔNG đổi ────────────────────────
  const r6 = await p.evaluate(() => {
    player.silver = 9e8; player.mat = 9e5; player.gems.tuLa = 9e4; player.gems.honNguyen = 9e4;
    player.jewels.chucPhuc = 9e4; player.jewels.linhHon = 9e4; player.jewels.honDon = 9e4;
    const truoc = JSON.stringify(player.equip.pet.subs);
    petRoll();
    const coPending = !!player.petPending, soPending = (player.petPending||[]).length;
    const coKhungSwap = document.querySelectorAll('.pet-swap').length;
    petRollTake(false);
    return { coPending, soPending, coKhungSwap, giuNguyen: JSON.stringify(player.equip.pet.subs) === truoc,
             hetPending: !player.petPending };
  });
  console.log('6.', JSON.stringify(r6));
  (r6.coPending && r6.soPending === 2 && r6.coKhungSwap === 2 && r6.giuNguyen && r6.hetPending)
    ? pass('roll hiện CŨ→MỚI, chọn giữ thì dòng không đổi')
    : fail('luồng roll sai: ' + JSON.stringify(r6));

  // ── 7. roll rồi thay thì dòng đổi, dòng gốc GIỮ NGUYÊN ─────────────────
  const r7 = await p.evaluate(() => {
    const goc = JSON.stringify(player.equip.pet.subs[0]);
    petRoll();
    const moi = JSON.stringify(player.petPending);
    petRollTake(true);
    const sau = player.equip.pet.subs;
    return { gocGiu: JSON.stringify(sau[0]) === goc,
             daThay: JSON.stringify(sau.slice(1)) === moi };
  });
  console.log('7.', JSON.stringify(r7));
  (r7.gocGiu && r7.daThay) ? pass('thay bộ mới: dòng phụ đổi, dòng gốc bất biến')
                           : fail('thay bộ sai: ' + JSON.stringify(r7));

  // chụp lúc đang có bộ mới chờ quyết
  await p.evaluate(() => { petRoll(); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: '/tmp/shot_pet_roll.png' });
  await p.evaluate(() => petRollTake(false));

  // ── 8. LUẬT CỐT LÕI: hỏng 400 lần vẫn không mất, không tụt ─────────────
  const r8 = await p.evaluate(() => {
    player.silver = 9e8; player.mat = 9e5; player.gems.tuLa = 9e4; player.gems.honNguyen = 9e4;
    player.jewels.chucPhuc = 9e4; player.jewels.linhHon = 9e4; player.jewels.honDon = 9e4;
    const _r = Math.random; Math.random = () => 0.999;   // ép hỏng mọi lần
    player.equip.pet.plus = 7;
    const truocPlus = 7, tienTruoc = player.silver;
    let mat = false, tut = false;
    for (let i = 0; i < 400; i++){
      petUpgrade();
      if (!player.equip.pet) { mat = true; break; }
      if (player.equip.pet.plus < truocPlus) { tut = true; break; }
    }
    Math.random = _r;
    return { mat, tut, plus: player.equip.pet ? player.equip.pet.plus : null,
             daTieuBac: tienTruoc - player.silver };
  });
  console.log('8.', JSON.stringify(r8));
  (!r8.mat && !r8.tut && r8.plus === 7 && r8.daTieuBac > 0)
    ? pass(`hỏng 400 lần: pet còn nguyên ở +7, đã đốt ${r8.daTieuBac.toLocaleString('vi-VN')} bạc`)
    : fail('LUẬT CỐT LÕI VỠ: ' + JSON.stringify(r8));

  // ── 9. thăng cấp mở thêm ô dòng phụ ở +4 và +8 ─────────────────────────
  const r9 = await p.evaluate(() => {
    const _r = Math.random; Math.random = () => 0;       // ép thành công
    player.silver = 9e8; player.mat = 9e5; player.gems.tuLa = 9e4; player.gems.honNguyen = 9e4;
    player.jewels.chucPhuc = 9e4; player.jewels.linhHon = 9e4; player.jewels.honDon = 9e4;
    player.equip.pet.plus = 0; petNormalize(player.equip.pet);
    const moc = {};
    for (let i = 0; i < 20; i++){
      petUpgrade();
      moc[player.equip.pet.plus] = player.equip.pet.subs.length;
    }
    Math.random = _r;
    return { plus: player.equip.pet.plus, o3: moc[4], o8: moc[8], o11: moc[11], soDong: player.equip.pet.subs.length };
  });
  console.log('9.', JSON.stringify(r9));
  (r9.plus === 11 && r9.o3 === 4 && r9.o8 === 5 && r9.soDong === 5)
    ? pass('lên +11, mở ô dòng phụ đúng mốc +4 và +8 (gốc + 4 dòng)')
    : fail('mốc mở ô sai: ' + JSON.stringify(r9));
  await p.waitForTimeout(150);
  await p.screenshot({ path: '/tmp/shot_pet_max.png' });

  // ── 10. +N thật sự vào chỉ số ──────────────────────────────────────────
  const r10 = await p.evaluate(() => {
    const it = player.equip.pet;
    it.plus = 0; calcDerived(); const a = player.atk;
    it.plus = 11; calcDerived(); const b = player.atk;
    return { plus0: a, plus11: b, tang: b > a };
  });
  console.log('10.', JSON.stringify(r10));
  r10.tang ? pass(`+11 vào chỉ số thật (công ${r10.plus0} → ${r10.plus11})`)
           : fail('+N không đổi chỉ số: ' + JSON.stringify(r10));

  // ── 11. không bán được ─────────────────────────────────────────────────
  const r11 = await p.evaluate(() => {
    const it = player.equip.pet;
    player.inv.push(it); const n = player.inv.length;
    sellItem(player.inv.length - 1); sellItem(player.inv.length - 1);
    const conTrongTui = player.inv.includes(it);
    player.inv = player.inv.filter(x => x !== it);
    return { conTrongTui, soTruoc: n };
  });
  r11.conTrongTui ? pass('Linh Thú không bán được') : fail('Linh Thú bị bán mất');

  // ── 12. save đời cũ (pet holy/hulan/hothan) tự vá ──────────────────────
  const r12 = await p.evaluate(() => {
    const cu = { uid:99, slot:'pet', special:true, name:'Thánh Linh May Mắn', pet:'holy', rarity:4,
                 level:1, tier:0, main:null, element:'Kim', plus:3,
                 subs:[{k:'expPct',name:'EXP Thêm',v:10,pct:true},{k:'silverPct',name:'Đồng Rơi Thêm',v:5,pct:true}] };
    const cu2 = JSON.parse(JSON.stringify(cu)); cu2.uid = 98; cu2.pet = 'hothan';
    player.equip.pet = cu; player.inv.push(cu2);
    // chạy đúng đoạn vá trong loadGame
    const keep = player.equip.pet;
    const bag = player.inv.filter(x => x && x.slot === 'pet');
    if (!keep && bag.length) player.equip.pet = bag[0];
    player.inv = player.inv.filter(x => !(x && x.slot === 'pet' && x !== player.equip.pet));
    petNormalize(player.equip.pet);
    const it = player.equip.pet;
    calcDerived();
    return { id: it.pet, ten: it.name, plus: it.plus, soDong: it.subs.length,
             gocCore: !!it.subs[0].core, gocK: it.subs[0].k,
             conPetLeTrongTui: player.inv.filter(x => x.slot === "pet").length, atk: player.atk };
  });
  console.log('12.', JSON.stringify(r12));
  (r12.id === 'acorntail' && r12.plus === 3 && r12.soDong === 3 && r12.gocCore
   && r12.gocK === 'expPct' && r12.conPetLeTrongTui === 0 && r12.atk > 0)
    ? pass('pet đời cũ tự vá sang đời mới, giữ +3, chỉ còn một con')
    : fail('vá save cũ sai: ' + JSON.stringify(r12));

  // ── 13. dòng phụ KHÔNG BAO GIỜ trùng khoá với dòng gốc ─────────────────
  const r13 = await p.evaluate(() => {
    let trung = 0, trungNhau = 0;
    for (let g = 0; g < PET_DEFS.length; g++){
      delete player.equip.pet; petPick(g);
      const it = player.equip.pet;
      for (let i = 0; i < 60; i++){
        it.plus = 8; petNormalize(it);
        const ks = it.subs.map(x => x.k);
        if (ks.slice(1).includes(it.subs[0].k)) trung++;
        if (new Set(ks).size !== ks.length) trungNhau++;
        it.subs = [it.subs[0]];              // ép bốc lại toàn bộ dòng phụ
      }
    }
    return { trung, trungNhau };
  });
  console.log('13.', JSON.stringify(r13));
  (!r13.trung && !r13.trungNhau)
    ? pass('180 lượt bốc, 3 giống: không lượt nào ra dòng trùng tên')
    : fail('dòng phụ trùng dòng gốc/trùng nhau: ' + JSON.stringify(r13));

  // ── 14. tháo pet xuống túi KHÔNG cho nhận con thứ hai ──────────────────
  const r14 = await p.evaluate(() => {
    delete player.equip.pet;
    player.inv = player.inv.filter(x => x.slot !== 'pet');
    petPick(0);
    const goc = player.equip.pet;
    unequip('pet');                                  // tháo xuống túi
    const trongTui = player.inv.filter(x => x.slot === 'pet').length;
    renderCharPanel(); switchCharTab('linhthu');
    const conThePick = !!document.querySelector('.pet-card');
    petPick(2);                                      // thử nhận con thứ hai
    const soPet = (player.equip.pet ? 1 : 0) + player.inv.filter(x => x.slot === 'pet').length;
    return { trongTui, conThePick, soPet, dungCon: player.equip.pet === goc };
  });
  console.log('14.', JSON.stringify(r14));
  (r14.trongTui === 1 && !r14.conThePick && r14.soPet === 1 && r14.dungCon)
    ? pass('tháo xuống túi thì bảng tự đeo lại, không phát con thứ hai')
    : fail('có thể nhận pet thứ hai: ' + JSON.stringify(r14));

  // ── 15. dải mới: sàn phải đủ cao, trần không vượt xa dải trang bị ──────
  const r15 = await p.evaluate(() => {
    const arm = {}; for (const d of ARMOR_SUBS) arm[d.k] = d;
    for (const d of WEAPON_SUBS) arm[d.k] = d;
    const quaCao = PET_SUBS.filter(d => arm[d.k] && d.max > arm[d.k].max * 1.45)
                           .map(d => `${d.k} ${d.max}>${arm[d.k].max}`);
    const sanThap = PET_SUBS.filter(d => d.min / d.max < 0.25).map(d => d.k);
    return { quaCao, sanThap, soDong: PET_SUBS.length };
  });
  console.log('15.', JSON.stringify(r15));
  (!r15.quaCao.length && !r15.sanThap.length)
    ? pass('dải mới: không dòng nào vượt quá 1,45× dải trang bị, sàn đều ≥ 25% trần')
    : fail('dải lệch: ' + JSON.stringify(r15));

  // ── 16. Tinh Luyện ở Lò: sàn cao thật, và vẫn phải xem trước ───────────
  const r16 = await p.evaluate(() => {
    delete player.equip.pet; player.inv = player.inv.filter(x => x.slot !== 'pet');
    petPick(1); player.equip.pet.plus = 8; petNormalize(player.equip.pet);
    delete player.petPending;
    const ct = CHAOS_RECIPES.find(r => r.id === 'petTinh');
    if (!ct) return { loi: 'không có công thức petTinh' };
    // khay: 3 Ngọc Linh Hồn, không có món nào
    const v = { items: [], jewels: { chucPhuc:0, linhHon:3, sinhMenh:0, honDon:0 }, nJewel: 3 };
    player.jewels.linhHon = 50; player.silver = 9e8; player.mat = 9e5;
    const m = ct.match(v);
    if (!m) return { loi: 'khay đúng mà công thức không khớp' };
    const pl = ct.plan(v, m);
    ct.run(v, m, pl);
    const pend = player.petPending || [];
    // mọi dòng phải nằm ở nửa trên của dải
    const duoiNua = pend.filter(sb => {
      const d = PET_SUBS.find(x => x.k === sb.k);
      return sb.v < d.min + 0.55 * (d.max - d.min) - 0.06;
    }).map(sb => `${sb.k}=${sb.v}`);
    // khớp lần hai phải bị chặn vì đang có lượt chờ
    const khopLai = !!ct.match(v);
    const daTru = player.jewels.linhHon;
    const laTinh = !!player.petPendingTinh;
    return { soDong: pend.length, duoiNua, khopLai, daTru, laTinh, rate: pl.rate };
  });
  console.log('16.', JSON.stringify(r16));
  (!r16.loi && r16.soDong === 4 && !r16.duoiNua.length && !r16.khopLai
   && r16.daTru === 47 && r16.laTinh && r16.rate === 100)
    ? pass('Tinh Luyện: 4 dòng đều ở nửa trên, trừ đúng 3 ngọc, chặn bốc chồng, vẫn chờ quyết')
    : fail('Tinh Luyện sai: ' + JSON.stringify(r16));

  // ── 17. Tinh Luyện KHÔNG được phá luật "không mất" ─────────────────────
  const r17 = await p.evaluate(() => {
    const it = player.equip.pet, truoc = JSON.stringify(it.subs);
    petRollTake(false);                       // giữ bộ cũ
    return { giuNguyen: JSON.stringify(it.subs) === truoc,
             hetPending: !player.petPending, hetCo: !player.petPendingTinh,
             conPet: !!player.equip.pet };
  });
  console.log('17.', JSON.stringify(r17));
  (r17.giuNguyen && r17.hetPending && r17.hetCo && r17.conPet)
    ? pass('Tinh Luyện vẫn theo luật: giữ bộ cũ thì không đổi gì, pet còn nguyên')
    : fail('Tinh Luyện phá luật: ' + JSON.stringify(r17));

  // ── 18. không có pet thì công thức không hiện ──────────────────────────
  const r18 = await p.evaluate(() => {
    const ct = CHAOS_RECIPES.find(r => r.id === 'petTinh');
    const v = { items: [], jewels: { chucPhuc:0, linhHon:3, sinhMenh:0, honDon:0 }, nJewel: 3 };
    const giu = player.equip.pet; delete player.equip.pet;
    const khongPet = !ct.match(v);
    player.equip.pet = giu;
    const v2 = { items: [giu], jewels: { chucPhuc:0, linhHon:3, sinhMenh:0, honDon:0 }, nJewel: 3 };
    const coMon = !ct.match(v2);
    const v3 = { items: [], jewels: { chucPhuc:0, linhHon:1, sinhMenh:0, honDon:0 }, nJewel: 1 };
    const thieuNgoc = !ct.match(v3);
    return { khongPet, coMon, thieuNgoc };
  });
  console.log('18.', JSON.stringify(r18));
  (r18.khongPet && r18.coMon && r18.thieuNgoc)
    ? pass('công thức chỉ khớp khi: có pet · khay không món · đúng 3 ngọc')
    : fail('điều kiện khớp lỏng: ' + JSON.stringify(r18));

  console.log('errors:', JSON.stringify(errs.slice(0, 3)));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALLPASS');
  process.exit(bad ? 1 : 0);
})();
