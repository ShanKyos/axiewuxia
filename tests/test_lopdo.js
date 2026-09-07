// BỐN Ô TRANG BỊ VẼ RỜI NHAU — không cần đủ bộ mới hiện giáp
//
// ⚠ Bài này gác một luật CŨ đã bị bỏ. Trước đây `nvBoGiap()` đổi CẢ TẤM THÂN một lượt theo
// bậc hiệu dụng `gv.t`, nên thiếu một ô là tụt xuống bộ khác hoặc về thân trần — và không có
// cách nào thân một bộ mà tay áo một bộ khác. Chủ dự án chốt ngược lại: bốn ô phải tách rời.
//
// Nay mỗi ô đọc lớp riêng của CHÍNH MÓN đang đeo (NV_LOP / NV_LOP_HOP), chồng lên thân của
// lớp theo ĐÚNG THỨ TỰ VẼ CỦA BỘ XƯƠNG.
//
// ⚠ CÁCH ĐO PHẢI SO ẢNH, không so tên bộ. `nvBoTen()` nay trả 'dw1' ở mọi trường hợp (bộ có
// lớp rời không đi đường đổi cả tấm), nên so tên là bài nào cũng xanh trong khi màn hình có
// thể vẫn y nguyên. Bài đo bằng ĐIỂM ẢNH của sprite.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(400);

  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);

  // ── 1. Bảng lớp phải trùng THỨ TỰ VẼ của bộ xương ─────────────────────────────────────
  const r1 = await p.evaluate(() => ({
    lop: NV_LOP.map(x => x.join(':')),
    bo:  Object.keys(NV_LOP_HOP),
    so:  Object.keys(NV_LOP_HOP).map(k => k + ':' + Object.keys(NV_LOP_HOP[k]).length)
  }));
  console.log('1) bảng lớp:', JSON.stringify(r1));
  // tóc-sau · tay XA · chân · thân · tay GẦN · đầu — ô `tay` phải nằm HAI BÊN ô `ao`
  const canLop = ['h:non', 't1:tay', 'c:chan', 'a:ao', 't2:tay', 'n:non'];
  if (r1.lop.join('|') !== canLop.join('|'))
    fail(`NV_LOP sai thứ tự vẽ: ${r1.lop.join('|')} — cần ${canLop.join('|')}`);
  else pass('NV_LOP đúng thứ tự vẽ của bộ xương (tay XA · chân · thân · tay GẦN · đầu)');
  if (!r1.bo.length) fail('chưa bộ nào có lớp rời');
  else pass(`${r1.bo.length} bộ có lớp rời: ${r1.bo.join(', ')}`);

  // ── 2. Hộp cắt phải KHỚP kích thước tệp thật ──────────────────────────────────────────
  // Sai một số trong NV_LOP_HOP là lớp dán lệch người, mà nhìn thì chỉ thấy "hơi lạ".
  const r2 = await p.evaluate(async () => {
    const ra = [];
    for (const ten in NV_LOP_HOP)
      for (const ml in NV_LOP_HOP[ten]){
        const H = NV_LOP_HOP[ten][ml];
        for (const [hau, w, h] of [['', H[2], H[3]], ['2', H[6], H[7]]]){
          const im = new Image();
          const xong = new Promise(r => { im.onload = () => r(1); im.onerror = () => r(0); });
          im.src = 'assets/nv/' + ten + '_' + ml + hau + '.webp';
          const ok = await xong;
          ra.push({ tep: ten + '_' + ml + hau, ok: !!ok, canW: w * NV_COT,
                    thatW: im.naturalWidth, khopCao: ok ? (im.naturalHeight % h === 0) : false });
        }
      }
    return ra;
  });
  const hong = r2.filter(x => !x.ok);
  const lech = r2.filter(x => x.ok && (x.thatW !== x.canW || !x.khopCao));
  console.log('2) tệp lớp:', r2.length, 'tấm · hỏng', hong.length, '· lệch', lech.length);
  if (hong.length) fail(`thiếu tệp lớp: ${hong.map(x => x.tep).join(', ')}`);
  else pass(`cả ${r2.length} tấm lớp tải được`);
  if (lech.length) fail('hộp cắt trong NV_LOP_HOP không khớp tệp: ' +
      lech.map(x => `${x.tep} rộng ${x.thatW} ≠ ${x.canW}`).join(' · '));
  else pass('mọi hộp cắt khớp đúng kích thước tệp — lớp dán đúng chỗ');

  // ── 3. Bộ CÓ LỚP RỜI không được đi đường đổi cả tấm thân ──────────────────────────────
  // Nó không có tệp `<tên>.webp`; trả tên ở nvBoGiap là 404 rồi rơi về hình dựng bằng đường.
  const r3 = await p.evaluate(() => {
    const ra = {};
    for (const k in NV_GIAP){
      const ten = NV_GIAP[k];
      ra[k] = { ten, coLop: !!NV_LOP_HOP[ten] };
    }
    // giả một gv mặc đủ bộ giai 1 để hỏi nvBoGiap
    return { bang: ra, giai1: nvBoGiap('baidasan', { n: 4, t: 1 }),
             giai7: nvBoGiap('baidasan', { n: 4, t: 7 }) };
  });
  console.log('3) hai đường:', JSON.stringify(r3));
  if (r3.giai1 !== null) fail(`nvBoGiap trả '${r3.giai1}' cho bộ CÓ lớp rời — sẽ 404`);
  else pass('bộ có lớp rời không đi đường đổi cả tấm thân');
  if (r3.giai7 !== 'dwsm1') fail(`bộ KHÔNG có lớp rời phải giữ đường cũ, đang trả ${r3.giai7}`);
  else pass('bộ chưa nướng lớp vẫn đổi cả tấm như cũ — hai đường sống chung');

  // ── 4. MỖI Ô một mình phải đổi được hình ──────────────────────────────────────────────
  const r4 = await p.evaluate(async () => {
    startGame('baidasan', null);
    player.level = 3; calcDerived();
    for (const ml of ['n','t1','t2','c','a']){ nvTai('dwvt1_' + ml, 'webp'); nvTai('dwvt1_' + ml + '2', 'webp'); }
    nvTai('dw1', 'webp');
    await new Promise(r => setTimeout(r, 2500));
    const ve = () => {
      const gv = gearVisual(player), t = heroTier(player);
      const spr = heroSprite('baidasan', t, gv, 'i', 0, null, false, 0, 'i');
      const c = document.createElement('canvas'); c.width = 240; c.height = 300;
      const g = c.getContext('2d');
      g.drawImage(spr, 40 + spr._ox, 40 + spr._oy, spr._ow, spr._oh);
      return g.getImageData(0, 0, 240, 300).data;
    };
    const khac = (a, b) => { let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i] ) n++;
                             for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i]) n++; return n; };
    player.equip = {};
    const tran = ve();
    const ra = { o: {}, oLop: {} };
    for (const s of ['non','ao','tay','chan']){
      player.equip = {};
      const it = genSpecific(s, 1); if (it){ it.tier = 1; it.plus = 0; player.equip[s] = it; }
      ra.oLop[s] = (gearVisual(player).oLop || {})[s] || null;
      ra.o[s] = khac(ve(), tran);
    }
    // bỏ MỘT ô khỏi bộ đủ — phải khác cả "đủ bộ" lẫn "thân trần"
    const mac = bo => { player.equip = {};
      for (const s of bo){ const it = genSpecific(s, 1); if (it){ it.tier = 1; it.plus = 0; player.equip[s] = it; } }
      return ve(); };
    const du = mac(['non','ao','tay','chan']);
    const thieu = mac(['non','ao','tay']);
    ra.duVsThieu = khac(du, thieu);
    ra.thieuVsTran = khac(thieu, tran);
    return ra;
  });
  console.log('4) từng ô:', JSON.stringify(r4));
  for (const s of ['non','ao','tay','chan']){
    if (!r4.oLop[s]) fail(`ô ${s} không nhận ra bộ có lớp rời`);
    else if (r4.o[s] < 300) fail(`đeo mỗi ô ${s} mà hình gần như không đổi (${r4.o[s]} điểm ảnh) — ô chưa tách rời`);
    else pass(`đeo mỗi ô ${s} → đổi ${r4.o[s]} điểm ảnh`);
  }
  if (r4.duVsThieu < 300) fail('bỏ một ô khỏi bộ đủ mà hình không đổi');
  else pass(`bỏ một ô khỏi bộ đủ → đổi ${r4.duVsThieu} điểm ảnh`);
  if (r4.thieuVsTran < 300) fail('mặc 3 ô mà vẫn y hệt thân trần — luật cũ "đủ bộ mới hiện" chưa gỡ');
  else pass(`mặc 3 ô vẫn hiện giáp (khác thân trần ${r4.thieuVsTran} điểm ảnh)`);

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
