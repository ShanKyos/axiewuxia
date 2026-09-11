// Bốn ô CỐT — nay cắm trên NGƯỜI CHƠI, không trên con thú nào.
//
// ⚠ Bài này THAY CHO `test_dinhhinh.js`, đã gỡ. Bài cũ gác hệ Định Hình Chimera (cấp 80 · sáu
// lần Hoá · Đất Hồn · bốn kỹ năng đồng hành · bốn ô Cốt treo trên từng con). Cả hệ đó chết cùng
// Ragoon, nên gác nó là gác một cái xác — và đó là kiểu bài kiểm tệ nhất: nó xanh mãi mãi và
// không bảo vệ gì cả. Giữ lại ĐÚNG phần còn sống (bốn ô Cốt) rồi gác nó ở chỗ mới.
//
// Năm thứ phải gác, đều là chỗ đợt "trỏ Cốt về người chơi" dễ hỏng nhất:
//
//  1. DÒNG CỐT KHÔNG ĂN VÀO ĐÂU. applyLine() lặng lẽ bỏ qua khoá lạ, nên một khoá gõ sai vẫn
//     hiện đẹp trên bảng mà cộng 0. Năm khoá `c*` cũ (cAtk/cCrit/cCritDmg/cSkill/cCd) chính là
//     năm khoá kiểu đó sau khi Ragoon chết — bài này đo CHỈ SỐ THẬT trước/sau khi đeo.
//  2. HAI KHOÁ ĐI ĐƯỜNG RIÊNG. `skillPct` và `cdCut` KHÔNG có ngăn trong sổ P; chúng phải rót
//     vào `player.skillDmgPct` và `player.vhCdMult`. Quên là hai trong tám dòng phụ thành mã chết.
//  3. BỂ DÒNG PHỤ BỊ HẸP ĐI. Tám khoá phải KHÁC NHAU đôi một. `cAtk → atkPct` trùng dòng
//     `atkPct` có sẵn thì cotThemPhu() (lọc trùng theo khoá) chỉ còn bảy khoá để bốc.
//  4. HIỆU ỨNG ĐỦ 4 MẢNH KHÔNG KÍCH. Đó là điểm bán hàng của cả hệ, và 11 hiệu ứng vừa bị DỜI
//     từ chiêu của con thú sang chiêu của người chơi — chỗ dời là chỗ rơi.
//  5. CỐT CÒN TREO TRÊN CON THÚ. `player.chimera.co[*].cot` phải trống sạch, và save cũ phải
//     được kéo về `player.cot` / `player.cotKho` mà KHÔNG mất mảnh nào.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{ width:1100, height:800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  // ── 1. bốn ô nằm trên NGƯỜI CHƠI, và cộng khi chưa quay con nào ──
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    player.level = 60; calcDerived();
    const truoc = { atk:player.atk, hp:player.maxHp, crit:player.crit,
                    sk:player.skillDmgPct || 0, cd:player.vhCdMult };
    // Đeo bốn mảnh Cổ +12 cùng một Dòng — KHÔNG quay con Chimera nào.
    const O = cotO();
    for (const k of COT_O_IDS){ const c = cotMoiO('votrung', 'co', k); c.plus = 12;
      while (c.phu.length < 4) cotThemPhu(c); O[k] = c; }
    calcDerived();
    const sau = { atk:player.atk, hp:player.maxHp, crit:player.crit,
                  sk:player.skillDmgPct || 0, cd:player.vhCdMult };
    return { truoc, sau, coCon:Object.keys((player.chimera || {}).co || {}).length,
             oDay:COT_O_IDS.filter(k => O[k]).length, bo:cotGom().bo, nDong:cotGom().p.length };
  });
  console.log('1) trước:', JSON.stringify(r1.truoc), '\n   sau  :', JSON.stringify(r1.sau));
  if (r1.coCon !== 0) fail(`bài tự quay ra ${r1.coCon} con — phép đo mất ý nghĩa`);
  else if (r1.oDay !== 4) fail(`đeo 4 mảnh mà chỉ ${r1.oDay} ô có mảnh`);
  else pass('bốn ô Cốt cộng được khi CHƯA sở hữu con Chimera nào (bản cũ gác trong nhánh if(_eq))');
  if (r1.sau.atk <= r1.truoc.atk) fail('Cốt không làm Công Kích nhích lên — khoá atkPct/crit không ăn vào sổ P');
  else pass(`Công Kích ${r1.truoc.atk} → ${r1.sau.atk} (+${(r1.sau.atk/r1.truoc.atk*100-100).toFixed(1)}%)`);
  if (r1.sau.hp <= r1.truoc.hp) fail('ô Vảy (hpPct) không cộng Sinh Lực');
  else pass(`Sinh Lực ${r1.truoc.hp} → ${r1.sau.hp}`);

  // ── 2. skillPct và cdCut đi đường riêng, không qua sổ P ──
  if (r1.sau.sk <= r1.truoc.sk) fail('`skillPct` của Cốt không tới player.skillDmgPct — dòng chết');
  else pass(`skillDmgPct ${r1.truoc.sk.toFixed(3)} → ${r1.sau.sk.toFixed(3)}`);
  if (!(r1.sau.cd < r1.truoc.cd)) fail('`cdCut` của Cốt không tới player.vhCdMult — dòng chết');
  else pass(`vhCdMult ${r1.truoc.cd.toFixed(3)} → ${r1.sau.cd.toFixed(3)} (hồi chiêu ngắn lại)`);
  if (r1.sau.cd < 0.35 - 1e-9) fail(`vhCdMult ${r1.sau.cd} phá sàn 0,35 — đủ Cổ +12 là hồi chiêu về 0`);
  else pass('vhCdMult còn trên sàn 0,35 (nhân, không trừ thẳng)');

  // ── 3. tám khoá dòng phụ phải KHÁC NHAU đôi một, và khoá nào cũng có đích thật ──
  const r3 = await p.evaluate(() => {
    const k = COT_PHU.map(d => d.k);
    // Khoá nào phải có ngăn trong sổ P, khoá nào đi đường riêng — liệt kê tường minh để bài này
    // đỏ nếu ai thêm một khoá thứ chín mà không nối đường cho nó.
    const rieng = ['skillPct', 'cdCut'];
    const soP = ['atkPct','crit','critDmg','hpPct','aspdPct','pierce','hpLeech','qiLeech','defPct'];
    return { k, trung:k.length - new Set(k).size,
             la:k.filter(x => !rieng.includes(x) && !soP.includes(x)),
             cKhoa:k.filter(x => /^c[A-Z]/.test(x)),
             oChinh:COT_O_IDS.map(x => COT_O[x].chinh),
             haiKhoa:Object.keys(COT_DONG).map(d => COT_DONG[d].hai.k) };
  });
  console.log('3) bể dòng phụ:', r3.k.join(' · '));
  if (r3.trung) fail(`${r3.trung} khoá TRÙNG trong COT_PHU — bể hẹp đi, cotThemPhu() bốc thiếu`);
  else pass(`tám khoá dòng phụ khác nhau đôi một`);
  if (r3.la.length) fail('khoá không có đích: ' + r3.la.join(', '));
  else pass('mọi khoá dòng phụ đều có đích (sổ P hoặc đường riêng)');
  const cCon = [...r3.cKhoa, ...r3.oChinh.filter(x => /^c[A-Z]/.test(x)), ...r3.haiKhoa.filter(x => /^c[A-Z]/.test(x))];
  if (cCon.length) fail('khoá `c*` của Ragoon còn sống: ' + [...new Set(cCon)].join(', '));
  else pass('không còn khoá `c*` nào ở COT_PHU · COT_O.chinh · COT_DONG.hai');

  // ── 4. đủ 4 mảnh: hiệu ứng bộ kích trên chiêu của NGƯỜI CHƠI ──
  if (r1.bo !== 'votrung') fail(`đủ bốn mảnh Vỏ Trứng mà cotGom().bo = ${r1.bo}`);
  else pass('cotGom().bo nhận đúng Dòng đủ 4 mảnh');
  const r4 = await p.evaluate(async () => {
    const out = {};
    // ⚠ HAI điều kiện dựng cảnh mà bỏ sót thì bài xanh/đỏ sai, không phải game sai:
    //  1. `castSkill` thoát NGAY ở `if (player.cd[id] > 0) return`. Bốn phép thử dưới đây đều
    //     tung cùng chiêu 'a', nên phải dọn `player.cd.a = 0` TRƯỚC MỖI LẦN — không dọn thì
    //     phép thử đầu chạy, ba phép sau im lặng đo ra 0 và trông y như game hỏng.
    //  2. Phải đứng ở map CÓ QUÁI. `startGame` thả người chơi ở thị trấn (`mobs` rỗng), nên
    //     `mobs.find(...)` trả undefined và hai mục Băng Vụn / Tro Tàn bị BỎ QUA hoàn toàn —
    //     khoá đo không có trong kết quả, mà một khoá thiếu thì mọi phép so đều là `undefined`.
    travelTo('corran'); player.level = 60; calcDerived();
    const nap = () => { player.qi = player.maxQi; player.cd.a = 0; };
    const O = cotO();
    const dat = dong => { for (const k of COT_O_IDS){ const c = cotMoiO(dong, 'co', k); c.plus = 12; O[k] = c; }
                          calcDerived(); return player.cotBo; };
    // Cánh Hoa: chiêu hồi 6% Sinh Lực tối đa.
    out.bo = dat('canhhoa');
    player.hp = Math.round(player.maxHp * 0.4); nap();
    const hp0 = player.hp; castSkill('a'); out.hoiHp = player.hp - hp0;
    // Đồng Cỏ: 5 giây đánh nhanh thêm 40% — aspd là ĐỘ TRỄ nên phải NHỎ đi.
    out.boDc = dat('dongco');
    const a0 = player.aspd; nap(); castSkill('a');
    out.nhanhT = player.cotNhanhT || 0; calcDerived();
    out.aspd = { truoc:+a0.toFixed(4), sau:+player.aspd.toFixed(4) };
    // Băng Vụn: phải dùng `stunT` (cơ chế thật), KHÔNG phải `freezeT` (không ai đọc).
    out.boBv = dat('bangvun');
    out.soQuai = mobs.filter(x => !x.dead).length;
    const m = mobs.find(x => !x.dead);
    // ⚠ Con quái phải SỐNG QUA CÚ ĐÁNH. Nhân vật cấp 60 một chiêu là xoá sạch quái Rẻo Rừng
    // Corran, mà `cotBoCast` chạy ở CUỐI castSkill và lọc `!m.dead` — nên con ta đang giữ tham
    // chiếu đã chết trước lúc hiệu ứng bộ nhìn tới nó, và `stunT` của nó ở lại 0. Đọc ra thì
    // trông y như "Băng Vụn không chạy". Bơm máu để nó đứng lại mà nhận hiệu ứng.
    if (m){ m.x = player.x + 40; m.y = player.y; m.stunT = 0; m.freezeT = 0;
      m.maxHp = 1e7; m.hp = 1e7;
      nap(); castSkill('a');
      out.stun = +(m.stunT || 0).toFixed(2); out.freeze = +(m.freezeT || 0).toFixed(2);
      out.mSong = !m.dead; }
    // Tro Tàn: hạ một mục tiêu thì mọi chiêu giảm 1 giây hồi.
    out.boTt = dat('trotan');
    const m2 = mobs.find(x => !x.dead);
    if (m2){ player.cd.a = 5; killMob(m2, 'hit'); out.cdSau = +(player.cd.a).toFixed(2); }
    return out;
  });
  console.log('4)', JSON.stringify(r4));
  if (!(r4.hoiHp > 0)) fail('Cánh Hoa đủ 4 mảnh: tung chiêu KHÔNG hồi máu — hiệu ứng bộ chưa dời sang chiêu người chơi');
  else pass(`Cánh Hoa: chiêu hồi ${r4.hoiHp} Sinh Lực`);
  if (!(r4.nhanhT > 0)) fail('Đồng Cỏ đủ 4 mảnh: tung chiêu không bật cờ cotNhanhT');
  else if (!(r4.aspd.sau < r4.aspd.truoc)) fail(`Đồng Cỏ: aspd ${r4.aspd.truoc} → ${r4.aspd.sau}, không nhanh lên (aspd là ĐỘ TRỄ, phải NHỎ đi)`);
  else pass(`Đồng Cỏ: aspd ${r4.aspd.truoc} → ${r4.aspd.sau} trong ${r4.nhanhT.toFixed(1)}s`);
  if (!r4.soQuai) fail('dựng cảnh hỏng: map không có quái nào, hai mục dưới không đo được gì');
  else if (!r4.mSong) fail('dựng cảnh hỏng: con quái chết trước khi hiệu ứng bộ nhìn tới nó');
  else if (!(r4.stun > 0)) fail('Băng Vụn đủ 4 mảnh: quái không đứng hình — kiểm xem có ghi `freezeT` (không ai đọc) thay vì `stunT` không');
  else pass(`Băng Vụn: quái stunT = ${r4.stun}s (đúng cơ chế thật, không phải freezeT ${r4.freeze})`);
  if (!(r4.cdSau < 5)) fail('Tro Tàn đủ 4 mảnh: hạ mục tiêu không cắt hồi chiêu của người chơi');
  else pass(`Tro Tàn: hạ một con → hồi chiêu 5,00s còn ${r4.cdSau}s`);

  // ── 5. di trú save đời Ragoon: không mất mảnh nào ──
  const r5 = await p.evaluate(() => {
    // Dựng lại đúng hình dạng save cũ: hai con, mỗi con bốn ô, cộng một kho dùng chung.
    const C = chiState();
    C.co = { aurelion:{ con:0 }, netherfang:{ con:0 } }; C.eq = 'aurelion';
    C.kho = [cotMoi('regai','tho'), cotMoi('regai','tho')];
    for (const id of ['aurelion','netherfang']){
      C.co[id].cot = {};
      for (const k of COT_O_IDS) C.co[id].cot[k] = cotMoiO(id === 'aurelion' ? 'votrung' : 'trotan', 'tinh', k);
    }
    player.cot = null; player.cotKho = null; player.mats = player.mats || {}; player.mats.datHon = 400;
    const tongTruoc = 2 + 4 + 4;
    cotDiTru();
    const O = cotO(), K = cotKho();
    return { tongTruoc, deo:COT_O_IDS.filter(k => O[k]).length, kho:K.length,
             conCot:['aurelion','netherfang'].filter(id => C.co[id] && C.co[id].cot).length,
             conLv:['aurelion','netherfang'].filter(id => C.co[id] && C.co[id].lv != null).length,
             dat:(player.mats || {}).datHon,
             dongDeo:[...new Set(COT_O_IDS.filter(k => O[k]).map(k => O[k].dong))] };
  });
  console.log('5)', JSON.stringify(r5));
  if (r5.deo + r5.kho !== r5.tongTruoc) fail(`di trú làm MẤT mảnh: ${r5.tongTruoc} vào, ${r5.deo}+${r5.kho}=${r5.deo + r5.kho} ra`);
  else pass(`di trú giữ đủ ${r5.tongTruoc} mảnh (${r5.deo} đeo + ${r5.kho} kho)`);
  if (r5.dongDeo.length !== 1 || r5.dongDeo[0] !== 'votrung')
    fail(`bốn ô sau di trú phải là bộ của con ĐANG CẮM (votrung), ra ${r5.dongDeo.join('+')}`);
  else pass('bốn ô giữ bộ của con đang cắm, bộ của con kia trả về kho');
  if (r5.conCot) fail(`${r5.conCot} con còn giữ khe .cot — Cốt chưa rời khỏi player.chimera`);
  else pass('không con nào còn khe .cot');
  if (r5.conLv) fail(`${r5.conLv} con còn trường .lv — vòng nuôi còn rác trong save`);
  else pass('trường lv/xp/hoa đã dọn khỏi save');
  if (r5.dat != null) fail('Đất Hồn còn trong save mà không còn chỗ tiêu');
  else pass('Đất Hồn đã dọn khỏi save');

  console.log('errors:', JSON.stringify(errs.slice(0, 8)));
  if (errs.length) fail(`${errs.length} lỗi JS trong lúc chạy`);
  console.log(bad ? `\nđỏ: ${bad}` : '\nTẤT CẢ XANH');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
