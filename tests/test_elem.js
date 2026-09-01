// Hệ trang bị. Trước bản này: tên là Ngũ Hành (Kim/Mộc/Thủy/Hỏa/Thổ — vi phạm Luật 1), MỌI món
// đều mang một hệ mà KHÔNG ô nào đọc tới (cả hai chiều khắc hệ đều lấy hệ của LỚP), còn Lò Hỗn
// Độn thì bán công thức Đổi Hệ ăn 1 Hỗn Độn Châu để roll lại đúng thứ vô dụng đó.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null); travelTo('comoc');
    player.level = 60; calcDerived();
    const o = {};
    // ── 1. Bảng hệ: tên phương Tây, vòng khắc kín 5 cạnh, không lặp ──
    o.ten = ELEMENTS.map(k => elName(k));
    o.vongKhac = ELEMENTS.map(k => `${elName(k)}>${elName(ELEM[k].beats)}`);
    const seen = new Set(); let kin = true, cur = ELEMENTS[0];
    for (let i = 0; i < 5; i++){ if (seen.has(cur)) kin = false; seen.add(cur); cur = ELEM[cur].beats; }
    o.vongKin = kin && cur === ELEMENTS[0] && seen.size === 5;
    o.conTuNguHanh = o.ten.some(t => /Kim|Mộc|Thủy|Hỏa|Thổ/.test(t));

    // ── 2. Chỉ VŨ KHÍ mới mang hệ ──
    const cnt = { vukhi:0, khac:0, vukhiCoHe:0, khacCoHe:0 };
    for (let i = 0; i < 3000; i++){
      const it = genItem(60, 0, 'elite');
      if (it.slot === 'vukhi'){ cnt.vukhi++; if (hasElem(it)) cnt.vukhiCoHe++; }
      else { cnt.khac++; if (it.element) cnt.khacCoHe++; }
    }
    o.gan = cnt;
    o.coThanCoHe = !!genAncient(Object.keys(ANCIENT_SETS)[0], 'ao', 60).element;

    // ── 3. Sát thương lên quái ĐỔI theo hệ vũ khí ──
    const sectEl = SECTS[player.sect].element;
    const mkW = (el) => { const w = genSpecific ? null : null;
      const it = genItem(60, 0, 'elite'); it.slot='vukhi'; it.slotName='Vũ Khí'; it.special=false;
      it.element = el; it.main = { k:'atk', v:300, name:'Công Kích' }; it.subs=[]; it.exc=null;
      it.plus=0; it.luck=false; it.perfect=false; it.rarity=0; return it; };
    const hitWith = (el, mobEl) => {
      player.equip.vukhi = el === null ? undefined : mkW(el);
      if (el === null) delete player.equip.vukhi;
      calcDerived();
      player.crit = 0; player.perfectProc = 0; player.pierce = 0;
      mobs = [];
      const m = spawnMob('thinu', { x:1400, y:1400, r:10 }, null, true);
      m.def = Object.assign({}, m.def, { el: mobEl, def: 0, hp: 9e9 });
      m.hp = 9e9; m.maxHp = 9e9; m.shield = 0;
      const before = m.hp;
      hurtMob(m, 1000, 'hit');
      const dmg = before - m.hp;
      mobs = [];
      return dmg;
    };
    // hệ quái = hệ mà vũ khí Ember khắc, và hệ khắc ngược lại Ember
    const emberBeats = ELEM['Hỏa'].beats;                    // Ember khắc gì
    const beatsEmber = ELEMENTS.find(k => ELEM[k].beats === 'Hỏa'); // gì khắc Ember
    o.emberKhac = elName(emberBeats); o.khacEmber = elName(beatsEmber);
    o.st = {
      trung:   hitWith('Hỏa', 'Hỏa'),          // không khắc nhau
      khac:    hitWith('Hỏa', emberBeats),     // vũ khí khắc quái → phải CAO nhất
      biKhac:  hitWith('Hỏa', beatsEmber),     // quái khắc vũ khí → phải THẤP nhất
      khongVK: hitWith(null,  emberBeats),     // không vũ khí → theo hệ LỚP
      lopKhac: hitWith(null,  ELEM[sectEl].beats),
    };
    o.heLop = elName(sectEl);

    // ── 4. Hệ vũ khí KHÔNG được đổi đòn quái đánh MÌNH ──
    const mobToPlayer = (el) => {
      player.equip.vukhi = mkW(el); calcDerived();
      // công thức chiều quái→người trong update(): chỉ đọc SECTS[player.sect].element
      const src = String(window.update).match(/sectEl2 = ([^;]+);/);
      return src ? src[1].trim() : 'KHÔNG TÌM THẤY';
    };
    o.nguonHeChieuNguoc = mobToPlayer('Hỏa');

    // ── 5. Đổi Hệ chỉ nhận vũ khí ──
    const armor = genItem(60, 0, 'elite'); armor.slot = 'ao'; armor.element = null;
    const weap  = mkW('Hỏa');
    const rec = CHAOS_RECIPES.find(x => x.id === 'element');
    o.doiHe = { nhanGiap: !!rec.match({ items:[armor], jewels:{} }),
                nhanVuKhi: !!rec.match({ items:[weap], jewels:{} }) };
    return o;
  });

  console.log('tên hệ      :', JSON.stringify(r.ten));
  console.log('vòng khắc   :', r.vongKhac.join(' · '), '· kín:', r.vongKin);
  console.log('gán hệ      :', JSON.stringify(r.gan), '· Cổ Thần có hệ:', r.coThanCoHe);
  console.log('hệ lớp      :', r.heLop, '· Ember khắc', r.emberKhac, '· bị', r.khacEmber, 'khắc');
  console.log('sát thương  :', JSON.stringify(r.st));
  console.log('chiều ngược :', r.nguonHeChieuNguoc);
  console.log('Đổi Hệ      :', JSON.stringify(r.doiHe));

  if (r.conTuNguHanh) fail(`tên hệ vẫn là Ngũ Hành: ${JSON.stringify(r.ten)}`);
  if (new Set(r.ten).size !== 5) fail('tên hệ bị trùng');
  if (!r.vongKin) fail('vòng khắc không kín 5 cạnh — có hệ không khắc ai hoặc khắc lặp');
  if (r.gan.vukhiCoHe !== r.gan.vukhi) fail(`${r.gan.vukhi - r.gan.vukhiCoHe} vũ khí KHÔNG có hệ`);
  if (r.gan.khacCoHe) fail(`${r.gan.khacCoHe} món KHÔNG PHẢI vũ khí vẫn mang hệ — dòng chết như bản cũ`);
  if (r.coThanCoHe) fail('đồ Cổ Thần (giáp) vẫn mang hệ');
  if (!(r.st.khac > r.st.trung)) fail(`vũ khí khắc hệ quái không tăng ST (${r.st.trung} → ${r.st.khac})`);
  if (!(r.st.biKhac < r.st.trung)) fail(`bị quái khắc không giảm ST (${r.st.trung} → ${r.st.biKhac})`);
  if (!(Math.abs(r.st.khac / r.st.trung - 1.2) < 0.02)) fail(`khắc hệ ra ${(r.st.khac/r.st.trung).toFixed(3)}×, cần 1.20×`);
  if (!(Math.abs(r.st.biKhac / r.st.trung - 0.88) < 0.02)) fail(`bị khắc ra ${(r.st.biKhac/r.st.trung).toFixed(3)}×, cần 0.88×`);
  if (!(r.st.lopKhac > r.st.khongVK * 0.99)) fail('cởi vũ khí ra thì hệ LỚP phải tiếp quản');
  if (!/SECTS\[player\.sect\]\.element/.test(r.nguonHeChieuNguoc))
    fail(`chiều quái→người đọc "${r.nguonHeChieuNguoc}" — phải là hệ LỚP, đổi vũ khí không được làm ngươi ăn đòn nặng hơn`);
  if (r.doiHe.nhanGiap) fail('Đổi Hệ vẫn nhận GIÁP — ăn 1 Hỗn Độn Châu để roll thứ không dùng');
  if (!r.doiHe.nhanVuKhi) fail('Đổi Hệ không nhận vũ khí');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
