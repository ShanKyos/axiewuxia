// Cường hoá +0..+11 phải NHÌN THẤY ĐƯỢC trên nhân vật, theo đúng mốc MU Online (+7 là ngưỡng
// phát sáng), và MỖI cấp rèn đều phải đổi gì đó — nếu chỉ chia mốc thì +7 với +9 trông y hệt
// nhau, mà rèn từ +7 lên +9 là cả một chặng dài.
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
    startGame('thieulam', null);
    player.level = 100; vhAutoLearn(); calcDerived();
    const o = {};

    const gv = pl => ({ n:5, rarity:4, t:10, plus:pl, rcol:RARITIES[4].color, wTier:10, wPlus:pl, setColor:null });
    const shot = (pl, now) => {
      const c = document.createElement('canvas'); c.width = HERO_W; c.height = HERO_H;
      const q = c.getContext('2d');
      drawHeroFigure(q, 'thieulam', 10, now === undefined ? 900 : now, HERO_POSE0, gv(pl));
      return q.getImageData(0, 0, HERO_W, HERO_H).data;
    };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) n++; return n; };

    // mốc phải đúng như MU: +0..3 trơ · +4..6 · +7..9 (ngưỡng) · +10+
    o.moc = [0,1,2,3,4,5,6,7,8,9,10,11].map(plusStage);

    // MỖI cấp rèn phải đổi hình
    o.moiCap = [];
    let prev = shot(0);
    for (let pl = 1; pl <= 11; pl++){
      const cur = shot(pl);
      o.moiCap.push({ pl, doi: diff(prev, cur) });
      prev = cur;
    }

    // bước nhảy lớn phải rơi đúng vào +4 / +7 / +10
    const at = pl => (o.moiCap.find(x => x.pl === pl) || {}).doi || 0;
    o.nhayTai = { p4: at(4), p7: at(7), p10: at(10) };
    o.trongMoc = { p2: at(2), p5: at(5), p8: at(8), p11: at(11) };

    // hào quang phải ĐỘNG (đập theo nhịp), không phải đèn dán
    o.dong_plus11 = diff(shot(11, 0), shot(11, 900));
    o.dong_plus0  = diff(shot(0, 0), shot(0, 900));

    // +0 phải giống hệt "không có gv" — không được tự dưng sáng khi chưa rèn
    const bare = (() => { const c=document.createElement('canvas'); c.width=HERO_W;c.height=HERO_H;
      const q=c.getContext('2d');
      drawHeroFigure(q,'thieulam',10,900,HERO_POSE0,{n:5,rarity:4,t:10,plus:0,rcol:RARITIES[4].color,wTier:10,wPlus:0,setColor:null});
      return q.getImageData(0,0,HERO_W,HERO_H).data; })();
    o.plus0_khongSang = diff(bare, shot(0)) === 0;

    // cache chân dung phải đổi theo mức rèn
    player.thanbinh = { tier: 1 }; player.equip = {};
    for (const k of HERO_ARMOR_SLOTS){ const it = genItem(112, 0); it.slot = k; it.tier = GIAI_MAX; it.plus = 0; player.equip[k] = it; }
    calcDerived();
    const u0 = heroCardUrl('thieulam', heroTier(player), gearVisual(player));
    for (const k of HERO_ARMOR_SLOTS) player.equip[k].plus = 11;
    calcDerived();
    const u11 = heroCardUrl('thieulam', heroTier(player), gearVisual(player));
    o.cache_doiTheoRen = u0 !== u11;

    // rèn LỆCH: mỗi mũ +11 còn 4 ô trống thì không được sáng ngang full +11
    player.equip = {};
    const hat = genItem(112, 0); hat.slot = 'non'; hat.tier = GIAI_MAX; hat.plus = 11;
    player.equip.non = hat; calcDerived();
    o.renLech_plus = +gearVisual(player).plus.toFixed(2);
    o.renLech_moc = plusStage(gearVisual(player).plus);

    // ── ICON trong túi cũng phải leo liên tục, không chỉ nhảy ở 3 mốc ──────
    {
      const def = { art:'weapon', blade:'thang', guard:'quat', pommel:'da', motif:'khong',
                    mat:'thep', w:5.4, len:-44, gw:15, st:4 };
      const ipx = (plv) => { const c = document.createElement('canvas'); c.width = c.height = ICON_PX;
        drawItemIcon(c.getContext('2d'), def, 7, 3, plv);
        return c.getContext('2d').getImageData(0, 0, ICON_PX, ICON_PX).data; };
      o.icon_moiCap = [];
      let ip = ipx(0);
      for (let plv = 1; plv <= 11; plv++){ const cur = ipx(plv); o.icon_moiCap.push({ pl: plv, doi: diff(ip, cur) }); ip = cur; }
      const iat = plv => (o.icon_moiCap.find(x => x.pl === plv) || {}).doi || 0;
      o.icon_nhay = { p7: iat(7), p10: iat(10) };
      o.icon_trongMoc = { p5: iat(5), p8: iat(8), p11: iat(11) };
      // khoá cache phải theo MỨC RÈN THẬT: +8 và +9 không được dùng chung một ảnh
      o.icon_cacheRieng = itemArtUrl(def, 7, 3, 8) !== itemArtUrl(def, 7, 3, 9);
    }
    return o;
  });

  console.log('mốc theo +0..11:', JSON.stringify(r.moc));
  console.log('đổi ở mỗi cấp  :', JSON.stringify(r.moiCap));
  console.log('nhảy tại 4/7/10:', JSON.stringify(r.nhayTai));
  console.log('trong cùng mốc :', JSON.stringify(r.trongMoc));
  console.log('động theo giờ  : +11 =', r.dong_plus11, '· +0 =', r.dong_plus0);
  console.log('rèn lệch (chỉ mũ +11):', r.renLech_plus, '→ mốc', r.renLech_moc);

  let bad = 0;
  const fail = m => { console.log('FAIL', m); bad++; };
  if (JSON.stringify(r.moc) !== JSON.stringify([0,0,0,0,1,1,1,2,2,2,3,3]))
    fail('mốc sai — phải là 0 tới +3, 1 tại +4..6, 2 tại +7..9 (ngưỡng MU), 3 từ +10: ' + JSON.stringify(r.moc));
  // +1..+3 CỐ Ý không đổi gì (dưới ngưỡng, đồ còn trơ) — đòi mỗi cấp đều đổi là đặt sai đề
  for (const s of r.moiCap){
    if (s.pl <= 3 && s.doi !== 0) fail(`+${s.pl} đã phát sáng — ngưỡng bị rò xuống dưới +4`);
    if (s.pl >= 4 && s.doi <= 0) fail(`rèn lên +${s.pl} không đổi gì trên hình`);
  }
  // Ngưỡng +7 (mốc MU) phải là một cú nhảy RÕ RỆT, so với bước thường CỦA MỐC LIỀN TRƯỚC.
  // (So với bước ở mốc 3 là sai: ở đó dải sáng quét thân chi phối, hai chế độ khác hẳn nhau
  //  nên số pixel không đem ra so trực tiếp được.)
  if (r.nhayTai.p4 <= 0) fail('vượt +4 không đổi gì');
  if (r.nhayTai.p7 < r.trongMoc.p5 * 3)
    fail(`ngưỡng +7 (${r.nhayTai.p7}) không nổi bật so với bước thường mốc 1 (${r.trongMoc.p5})`);
  if (r.nhayTai.p10 <= 0) fail('vượt +10 không đổi gì');
  // Hào quang theo BẬC (M.glow) vốn đã đập nhẹ từ trước — nên +0 động là chuyện bình thường,
  // điều cần chứng minh là lớp cường hoá làm nó động THÊM đáng kể.
  if (r.dong_plus11 < 500) fail('hào quang +11 không động theo thời gian — thành đèn dán');
  if (r.dong_plus11 < r.dong_plus0 * 1.3)
    fail(`+11 (${r.dong_plus11}) không động hơn +0 (${r.dong_plus0}) — lớp cường hoá không thêm chuyển động`);
  if (!r.plus0_khongSang) fail('+0 đã phát sáng — ngưỡng bị rò');
  if (!r.cache_doiTheoRen) fail('cache chân dung không đổi theo mức rèn');
  if (r.renLech_plus > 3) fail(`rèn lệch tính sai: chỉ mũ +11 mà ra ${r.renLech_plus}`);
  if (r.renLech_moc !== 0) fail('rèn lệch 1 ô đã được sáng ngang bộ đủ');

  console.log('icon mỗi cấp :', JSON.stringify(r.icon_moiCap));
  for (const x of r.icon_moiCap){
    if (x.pl <= 3 && x.doi !== 0) fail(`icon +${x.pl} đã sáng — ngưỡng rò xuống dưới +4`);
    if (x.pl >= 4 && x.doi <= 0) fail(`icon: rèn lên +${x.pl} không đổi điểm ảnh nào`);
  }
  if (r.icon_nhay.p7 < r.icon_trongMoc.p5 * 1.8)
    fail(`icon: ngưỡng +7 (${r.icon_nhay.p7}) không nổi hơn bước thường mốc 1 (${r.icon_trongMoc.p5})`);
  if (r.icon_nhay.p10 <= 0) fail('icon: vượt +10 không đổi gì');
  if (!r.icon_cacheRieng) fail('icon: +8 và +9 dùng chung một ảnh — khoá cache theo mốc thay vì mức rèn');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
