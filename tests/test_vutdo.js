// Vứt đồ xuống đất + dọn túi/kho hàng loạt.
// Bẫy lớn nhất của tính năng này: đồ vứt ra rơi cách chân 26–56px, mà bán kính TỰ NHẶT là 46px
// (bật AUTO còn gấp ba) — không đánh dấu `boDi` thì vứt xong bị hút về ngay, tính năng thành vô
// nghĩa mà nhìn qua vẫn tưởng chạy đúng. Mục 3 khoá đúng chỗ đó.
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
    window.TEST_MODE = true; startGame('thieulam', null);
    player.level = 90; player.auto = false;
    const o = {};
    const mon = (extra) => Object.assign(genItem(60, 0, null, { perfect: 0 }), extra);

    // ── A. luật vứt được / không vứt được ──
    o.luat = {
      thuong:  itemVutDuoc(mon({ rarity: 0, perfect: false, exc: null })),
      hoanHao: itemVutDuoc(mon({ perfect: true })),
      coExc:   itemVutDuoc(mon({ perfect: false, exc: [{ k:'atkPct', v:2 }] })),
      coThan:  itemVutDuoc(mon({ ancient: 'x' })),
      khacAn:  itemVutDuoc(mon({ sigil: 'y' })),
    };
    o.lyDo = { hoanHao: itemVutLyDo(mon({ perfect: true })), khacAn: itemVutLyDo(mon({ sigil:'y' })) };

    // ── B. vứt một món: rời túi, nằm dưới đất, mang cờ boDi ──
    groundLoot.length = 0; player.inv = [];
    const m1 = mon({ rarity: 0, perfect: false, exc: null });
    player.inv.push(m1);
    dropItem(0);
    o.motMon = { conTrongTui: player.inv.length, duoiDat: groundLoot.length,
                 boDi: groundLoot[0] ? !!groundLoot[0].boDi : null };

    // ── C. đồ Hoàn Hảo bấm Vứt thì KHÔNG được đi đâu cả ──
    groundLoot.length = 0; player.inv = [];
    player.inv.push(mon({ perfect: true }));
    dropItem(0); dropItem(0);          // bấm hai lần, kể cả đường xác nhận cũng không được lọt
    o.chanHoanHao = { conTrongTui: player.inv.length, duoiDat: groundLoot.length };

    // ── D. TỰ NHẶT LẠI: đứng ngay trên món vừa vứt, chạy vòng lặp, phải KHÔNG hút về ──
    groundLoot.length = 0; player.inv = [];
    player.inv.push(mon({ rarity: 0, perfect: false, exc: null }));
    dropItem(0);
    const g = groundLoot[0];
    g.z = 0; g.vz = 0; g.x = player.x; g.y = player.y;   // ép nằm ĐÚNG chân người chơi
    for (let i = 0; i < 30; i++) updateGroundLoot(0.05);
    o.khongHutLai = { duoiDat: groundLoot.length, trongTui: player.inv.length };
    // đối chứng: món rơi bình thường (không boDi) ở cùng chỗ thì PHẢI bị hút về
    groundLoot.length = 0; player.inv = [];
    dropToGround({ k:'item', it: mon({ rarity: 0 }) }, player.x, player.y);
    const g2 = groundLoot[0]; g2.z = 0; g2.vz = 0; g2.x = player.x; g2.y = player.y;
    for (let i = 0; i < 30; i++) updateGroundLoot(0.05);
    o.doiChung = { duoiDat: groundLoot.length, trongTui: player.inv.length };

    // ── E. dọn hàng loạt: VỨT ──
    groundLoot.length = 0; player.inv = []; player.donMuc = 1;   // Phàm + Tinh
    const dat = [
      mon({ rarity: 0, perfect: false, exc: null }),   // vứt được
      mon({ rarity: 1, perfect: false, exc: null }),   // vứt được
      mon({ rarity: 2, perfect: false, exc: null }),   // trên ngưỡng → giữ
      mon({ rarity: 0, perfect: true }),               // Hoàn Hảo → giữ khi VỨT
      mon({ rarity: 0, perfect: false, exc: null, sigil: 'y' }), // Khắc Ấn → giữ ở CẢ HAI đường
    ];
    player.inv = dat.slice();
    o.demVut = donChon(player.inv, true).length;
    o.demBan = donChon(player.inv, false).length;
    window._donArm = ''; donRac('tui', 'vut');          // lần 1 = hỏi
    o.sauLan1 = player.inv.length;
    donRac('tui', 'vut');                                // lần 2 = làm thật
    o.sauLan2 = { conLai: player.inv.length, duoiDat: groundLoot.length,
                  conGi: player.inv.map(it => `r${it.rarity}${it.perfect?'-HH':''}${it.sigil?'-KA':''}`) };

    // ── F. dọn hàng loạt: BÁN — dọn được đồ Hoàn Hảo, vẫn chừa Khắc Ấn ──
    player.inv = dat.slice(); player.silver = 0; window._donArm = '';
    donRac('tui', 'ban'); donRac('tui', 'ban');
    o.sauBan = { conLai: player.inv.length, bac: player.silver,
                 conGi: player.inv.map(it => `r${it.rarity}${it.sigil?'-KA':''}`) };

    // ── G. kho dùng chung đúng bộ luật ──
    player.kho = dat.slice(); window._donArm = '';
    donRac('kho', 'ban'); donRac('kho', 'ban');
    o.sauKho = { conLai: khoList().length };
    return o;
  });

  console.log('luật vứt      :', JSON.stringify(r.luat));
  console.log('lý do         :', JSON.stringify(r.lyDo));
  console.log('vứt một món   :', JSON.stringify(r.motMon));
  console.log('chặn Hoàn Hảo :', JSON.stringify(r.chanHoanHao));
  console.log('không hút lại :', JSON.stringify(r.khongHutLai), '· đối chứng:', JSON.stringify(r.doiChung));
  console.log(`dọn: đếm vứt ${r.demVut} · đếm bán ${r.demBan} · sau lần bấm 1 còn ${r.sauLan1}`);
  console.log('sau VỨT hàng loạt:', JSON.stringify(r.sauLan2));
  console.log('sau BÁN hàng loạt:', JSON.stringify(r.sauBan));
  console.log('kho sau khi bán  :', JSON.stringify(r.sauKho));

  // 1. luật
  if (!r.luat.thuong) fail('đồ thường phải vứt được');
  if (r.luat.hoanHao || r.luat.coExc) fail('đồ Hoàn Hảo (cờ perfect hoặc có dòng exc) không được vứt');
  if (r.luat.coThan)  fail('đồ Cổ Thần không được vứt');
  if (r.luat.khacAn)  fail('món mang Khắc Ấn không được vứt');
  if (!r.lyDo.hoanHao || !r.lyDo.khacAn) fail('chặn mà không nói lý do cho người chơi');
  if (!bad) pass('đúng luật: thường vứt được · Hoàn Hảo / Cổ Thần / Khắc Ấn thì không');

  // 2. vứt một món
  if (r.motMon.conTrongTui !== 0 || r.motMon.duoiDat !== 1)
    fail(`vứt một món ra ${JSON.stringify(r.motMon)}, mong túi 0 · đất 1`);
  else if (!r.motMon.boDi) fail('món vứt ra không mang cờ boDi — sẽ bị tự nhặt lại');
  else pass('vứt một món: rời túi, nằm dưới đất, có cờ boDi');

  // 3. chặn Hoàn Hảo kể cả khi bấm hai lần
  if (r.chanHoanHao.conTrongTui !== 1 || r.chanHoanHao.duoiDat !== 0)
    fail(`bấm Vứt hai lần trên đồ Hoàn Hảo vẫn lọt: ${JSON.stringify(r.chanHoanHao)}`);
  else pass('đồ Hoàn Hảo bấm mấy lần cũng không vứt được');

  // 4. KHÔNG tự hút lại — và đối chứng phải hút
  if (r.khongHutLai.duoiDat !== 1 || r.khongHutLai.trongTui !== 0)
    fail(`đứng trên món vừa vứt thì bị hút về: ${JSON.stringify(r.khongHutLai)}`);
  else if (r.doiChung.duoiDat !== 0 || r.doiChung.trongTui !== 1)
    fail(`đối chứng sai: món rơi BÌNH THƯỜNG lẽ ra phải bị nhặt, mà ra ${JSON.stringify(r.doiChung)}`);
  else pass('đồ đã vứt không bị hút lại, còn đồ rơi bình thường vẫn nhặt như cũ');

  // 5. đếm đúng
  if (r.demVut !== 2) fail(`đếm VỨT ra ${r.demVut}, mong 2 (r0 + r1, chừa r2/Hoàn Hảo/Khắc Ấn)`);
  if (r.demBan !== 3) fail(`đếm BÁN ra ${r.demBan}, mong 3 (r0 + r1 + r0-Hoàn Hảo, chừa r2/Khắc Ấn)`);
  if (r.demVut === 2 && r.demBan === 3) pass('đếm đúng: vứt 2 · bán 3');

  // 6. phải bấm hai lần
  if (r.sauLan1 !== 5) fail(`bấm một lần đã dọn luôn (còn ${r.sauLan1}/5) — phải hỏi lại trước`);
  else pass('dọn hàng loạt bắt bấm xác nhận lần hai');

  // 7. vứt hàng loạt chừa đúng thứ cần chừa
  if (r.sauLan2.conLai !== 3 || r.sauLan2.duoiDat !== 2)
    fail(`vứt hàng loạt ra ${JSON.stringify(r.sauLan2)}, mong còn 3 trong túi · 2 dưới đất`);
  else pass('vứt hàng loạt: bỏ 2 món rác, giữ lại r2 + Hoàn Hảo + Khắc Ấn');

  // 8. bán hàng loạt dọn được Hoàn Hảo, vẫn chừa Khắc Ấn
  if (r.sauBan.conLai !== 2) fail(`bán hàng loạt còn ${r.sauBan.conLai}, mong 2 (r2 + Khắc Ấn)`);
  else if (!r.sauBan.conGi.some(x => x.includes('KA'))) fail('bán hàng loạt nuốt mất món Khắc Ấn');
  else if (!(r.sauBan.bac > 0)) fail('bán hàng loạt không cộng bạc');
  else pass(`bán hàng loạt dọn được cả đồ Hoàn Hảo, chừa Khắc Ấn, +${r.sauBan.bac}◈`);

  // 9. kho dùng chung luật
  if (r.sauKho.conLai !== 2) fail(`kho sau khi bán còn ${r.sauKho.conLai}, mong 2 — kho phải dùng chung luật với túi`);
  else pass('kho dùng chung đúng bộ luật với túi');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
