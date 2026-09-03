// ICON GIÁP NƯỚNG TỪ GÓI SPINE — phải hiện ở CẢ túi lẫn ô trang bị, và phải về đường cũ êm
// ái ở những bộ chưa có tranh.
//
// Bộ mẫu Spine không có khe "món đồ" nào: 13 khe của nó đều là bộ phận cơ thể. Nhưng mỗi món
// giáp lại được vẽ chìm vào ĐÚNG MỘT bộ phận (mũ trùm nằm trong khe '头', áo choàng trong
// '躯干', ống tay trong '左手/右手'), nên dựng riêng một bộ phận ra là được đúng một món.
// Đó là cách tools/spine/nuong_icon.py sinh ra dải 4 ô.
//
// CHỈ CÓ BỐN ô, không phải năm — bản mẫu không có khe quần riêng. Ô Quần vì thế PHẢI về icon
// dựng sẵn, và bài kiểm này khoá luôn điều đó lại: quên mất là một hôm nào đó ai đó thêm ô
// thứ năm vào dải rồi các ô sau lệch hết.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(800);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('baidasan', { name:'Đo' }); });
  // Dải icon là tệp ảnh: nvIconUrl() trả null tới khi nó tải xong. Không chờ thì cả bài kiểm
  // đo nhầm đường lui và báo xanh trong khi art chưa bao giờ hiện.
  const daiTai = await p.waitForFunction(() => !!nvTai('hemp1_icon', 'webp'), { timeout: 20000 })
                        .then(() => true).catch(() => false);
  if (!daiTai) fail('dải icon hemp1_icon.webp không tải được');
  else pass('dải icon tải xong');

  // 1) bốn ô có art, ô Quần về đường cũ
  const r1 = await p.evaluate(() => {
    const lam = sl => assignDef({ slot: sl, tier: 1, plus: 0, rarity: 0 }, 'baidasan');
    const co = {}, dai = {};
    for (const sl of ['non','ao','tay','quan','chan']){
      const it = lam(sl);
      const u = nvIconUrl(it);
      co[sl] = !!u;
      dai[sl] = u ? u.length : 0;
      // HTML thật mà cả túi lẫn ô trang bị đều dùng
      co[sl + '_html'] = /<img[^>]+src="data:image\/png/.test(slotIcon(it, ''));
    }
    return { co, dai };
  });
  console.log('1) icon từng ô:', JSON.stringify(r1.co));
  for (const sl of ['non','ao','tay','chan']){
    if (!r1.co[sl]) fail(`ô ${sl} không lấy được icon art`);
    else if (!r1.co[sl + '_html']) fail(`ô ${sl} có icon nhưng slotIcon() không nhả ra nó`);
  }
  if (r1.co.non && r1.co.ao && r1.co.tay && r1.co.chan) pass('bốn ô nón/áo/tay/chân đều dùng art nướng');
  if (r1.co.quan) fail('ô Quần có icon art — nhưng bản mẫu Spine không có khe quần, dải chỉ 4 ô');
  else pass('ô Quần về icon dựng sẵn, đúng như thiết kế');

  // 2) BỐN ô phải KHÁC NHAU. Cắt nhầm cùng một ô thì mọi món trông y hệt — mà vẫn "có icon".
  const r2 = await p.evaluate(() => {
    const u = {};
    for (const sl of ['non','ao','tay','chan'])
      u[sl] = nvIconUrl(assignDef({ slot: sl, tier: 1, plus: 0, rarity: 0 }, 'baidasan'));
    const ds = Object.values(u);
    return { soKhac: new Set(ds).size, so: ds.length };
  });
  console.log('2) bốn ô khác nhau:', JSON.stringify(r2));
  if (r2.soKhac !== 4) fail(`bốn ô chỉ ra ${r2.soKhac} ảnh khác nhau — đang cắt trùng ô`);
  else pass('bốn ô cắt ra bốn ảnh khác nhau');

  // 3) bộ CHƯA có art phải về đường cũ, không được vỡ
  const r3 = await p.evaluate(() => {
    const it = assignDef({ slot:'non', tier: 9, plus: 0, rarity: 0 }, 'baidasan');
    const h = slotIcon(it, '');
    return { coArt: !!nvIconUrl(it), coHtml: /<img/.test(h) };
  });
  console.log('3) giai chưa có art:', JSON.stringify(r3));
  if (r3.coArt) fail('giai 9 chưa nướng art mà vẫn trả về icon art');
  else if (!r3.coHtml) fail('giai 9 về đường cũ nhưng không vẽ ra gì');
  else pass('giai chưa có art về đường cũ, vẫn có icon');

  // 4) /gen mặc thẳng cả bộ, đúng giai và đúng mức rèn
  const r4 = await p.evaluate(() => {
    cheatExec('/gen 1 +11');
    const e = player.equip;
    return { soMon: ['vukhi','non','ao','tay','quan','chan'].filter(k => e[k]).length,
             giai: e.non && e.non.tier, plus: e.non && e.non.plus,
             canh: !!e.canh, gvPlus: +gearVisual(player).plus.toFixed(1) };
  });
  console.log('4) /gen 1 +11:', JSON.stringify(r4));
  if (r4.soMon !== 6) fail(`/gen chỉ mặc ${r4.soMon}/6 ô`);
  else if (r4.giai !== 1 || r4.plus !== 11) fail(`/gen ra giai ${r4.giai} +${r4.plus}, mong giai 1 +11`);
  else if (r4.canh) fail('/gen giai 1 mà vẫn đeo cánh — giai 1-4 phải để trống');
  else pass('/gen 1 +11 mặc đủ 6 ô, đúng giai 1 mức +11, không cánh');
  if (r4.gvPlus < 11) fail(`gearVisual thấy +${r4.gvPlus} — hào quang sẽ không lên đúng mốc`);
  else pass('gearVisual đọc đúng +11 ⇒ hào quang lên mốc cao nhất');

  // 5) /gen kèm cánh — đây là cách xem nhân vật mới đi với cánh của lớp mình
  const r5 = await p.evaluate(() => {
    cheatExec('/gen 3 +9 4 2');
    const c = player.equip.canh;
    return { canh: !!c, bac: c && wingBac(c), lop: c && wingSect(c), giai: player.equip.non.tier };
  });
  console.log('5) /gen 3 +9 4 2:', JSON.stringify(r5));
  if (!r5.canh) fail('/gen với tham số cánh mà không đeo cánh');
  else if (r5.bac !== 2) fail(`cánh ra bậc ${r5.bac}, mong bậc 2`);
  else if (r5.lop && r5.lop !== 'baidasan') fail(`cánh của lớp ${r5.lop}, không phải lớp đang chơi`);
  else pass('/gen đeo đúng cánh bậc 2 của lớp đang chơi');

  // 6) MẶC LÊN NGƯỜI — bộ giáp phải thắng thân trần, và chỉ khi thật sự đang mặc đồ
  const daiThan = await p.waitForFunction(() => !!nvTai('hemp1', 'webp'), { timeout: 25000 })
                         .then(() => true).catch(() => false);
  if (!daiThan) fail('bảng khung thân hemp1.webp không tải được');
  const r6 = await p.evaluate(() => {
    for (const k of Object.keys(player.equip)) player.equip[k] = null;
    const tran = nvBoTen('baidasan', heroTier(player), gearVisual(player));
    cheatExec('/gen 1 +0');
    const mac = nvBoTen('baidasan', heroTier(player), gearVisual(player));
    // cởi 4/5 ô: độ phủ tụt còn 1/5 ⇒ bậc hiệu dụng làm tròn về 0 ⇒ phải quay lại thân trần
    for (const k of ['ao','tay','quan','chan']) player.equip[k] = null;
    const motMon = nvBoTen('baidasan', heroTier(player), gearVisual(player));
    return { tran, mac, motMon, giaiTran: heroTier(player) };
  });
  console.log('6) thân trần ↔ bộ giáp:', JSON.stringify(r6));
  if (r6.tran === 'hemp1') fail('cởi trần mà vẫn mặc art giáp — heroTier() kẹp sàn ở 1, phải phân biệt bằng gv.n');
  else if (r6.mac !== 'hemp1') fail(`mặc đủ bộ giai 1 mà vẫn dùng "${r6.mac}", mong hemp1`);
  else if (r6.motMon === 'hemp1') fail('còn mỗi một món mà vẫn hiện nguyên bộ giáp');
  else pass('cởi trần → thân trần · đủ bộ → hemp1 · còn một món → về thân trần');

  // 7) TRƯỢNG đổi theo GIAI VŨ KHÍ, không theo giai giáp
  const r7 = await p.evaluate(() => {
    cheatExec('/gen 1 +0');
    const ra = [];
    for (const wt of [1, 5, 8, 13]){
      player.equip.vukhi.tier = wt;
      const gv = gearVisual(player);
      const im = nvVuKhi('baidasan', heroTier(player), gv);
      ra.push({ wt, src: im ? im.src.split('/').pop() : null });
    }
    return ra;
  });
  console.log('7) trượng theo giai vũ khí:', JSON.stringify(r7));
  {
    const src = r7.map(x => x.src);
    if (src.some(x => !x)) fail('có giai vũ khí không lấy được bảng khung trượng');
    else if (src[0] === src[1] || src[1] === src[2]) fail(`giai 1/5/8 ra cùng một cây: ${src.join(' · ')}`);
    else if (src[3] !== src[2]) fail(`giai 13 phải dùng lại cây 8 (chỉ có 8 cây), nhưng ra ${src[3]}`);
    else pass(`trượng đổi theo giai vũ khí: ${src.join(' · ')}`);
  }

  // 8) đổi RIÊNG vũ khí phải làm mới bộ đệm sprite — nếu không thì cầm gậy mới, hiện gậy cũ
  const r8 = await p.evaluate(() => {
    cheatExec('/gen 1 +0');
    player.equip.vukhi.tier = 1;
    const a = heroGearSig(gearVisual(player));
    player.equip.vukhi.tier = 8;
    const b = heroGearSig(gearVisual(player));
    return { a, b };
  });
  console.log('8) chữ ký đổi theo vũ khí:', JSON.stringify(r8));
  if (r8.a === r8.b) fail('đổi giai vũ khí mà heroGearSig() không đổi — bộ đệm trả lại ảnh cũ');
  else pass('heroGearSig() có vũ khí trong chữ ký');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
