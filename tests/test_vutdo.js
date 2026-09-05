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
    player.autoEquip = false; // bài đếm món TRONG TÚI sau khi nhặt — autoEquip nay bật sẵn cho nhân vật mới sẽ mặc luôn
    player.level = 90; player.auto = false;
    const o = {};
    const mon = (extra) => Object.assign(genItem(60, 0, null, { perfect: 0 }), extra);

    // ── A. luật vứt được / không vứt được ──
    o.luat = {
      thuong:  itemVutDuoc(mon({ perfect: false, exc: null })),
      hoanHao: itemVutDuoc(mon({ perfect: true })),
      coExc:   itemVutDuoc(mon({ perfect: false, exc: [{ k:'atkPct', v:2 }] })),
    };
    o.lyDo = { hoanHao: itemVutLyDo(mon({ perfect: true })) };

    // ── B. vứt một món: rời túi, nằm dưới đất, mang cờ boDi ──
    groundLoot.length = 0; player.inv = [];
    // `plus:0, luck:false` bắt buộc: itemQuy() hỏi xác nhận với món Hoàn Hảo hoặc ĐÃ RÈN, và
    // mục này đo cú vứt MỘT LẦN BẤM — món quý thì lần bấm đầu chỉ để hỏi.
    const m1 = mon({ perfect: false, exc: null, plus: 0, luck: false });
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
    player.inv.push(mon({ perfect: false, exc: null, plus: 0, luck: false }));
    dropItem(0);
    const g = groundLoot[0];
    g.z = 0; g.vz = 0; g.x = player.x; g.y = player.y;   // ép nằm ĐÚNG chân người chơi
    for (let i = 0; i < 30; i++) updateGroundLoot(0.05);
    o.khongHutLai = { duoiDat: groundLoot.length, trongTui: player.inv.length };
    // đối chứng: món rơi bình thường (không boDi) ở cùng chỗ thì PHẢI bị hút về
    groundLoot.length = 0; player.inv = [];
    dropToGround({ k:'item', it: mon({ plus: 0 }) }, player.x, player.y);
    const g2 = groundLoot[0]; g2.z = 0; g2.vz = 0; g2.x = player.x; g2.y = player.y;
    for (let i = 0; i < 30; i++) updateGroundLoot(0.05);
    o.doiChung = { duoiDat: groundLoot.length, trongTui: player.inv.length };

    // ── E. dọn hàng loạt: VỨT ──
    // Hệ phẩm đã gỡ. Mốc "đáng tiếc" nay là ĐÃ RÈN và HOÀN HẢO, không phải phẩm.
    groundLoot.length = 0; player.inv = []; player.donMuc = 1;   // trơn + có Vận
    const dat = [
      mon({ perfect: false, exc: null, plus: 0, luck: false }),  // trơn      → dọn được
      mon({ perfect: false, exc: null, plus: 0, luck: true  }),  // có Vận    → dọn được ở mức 1
      mon({ perfect: false, exc: null, plus: 4, luck: false }),  // đã rèn +4 → GIỮ
      mon({ perfect: true,  plus: 0 }),                          // Hoàn Hảo  → GIỮ khi VỨT
    ];
    player.inv = dat.slice();
    o.demVut = donChon(player.inv, true).length;
    o.demBan = donChon(player.inv, false).length;
    window._donArm = ''; donRac('tui', 'vut');          // lần 1 = hỏi
    o.sauLan1 = player.inv.length;
    donRac('tui', 'vut');                                // lần 2 = làm thật
    o.sauLan2 = { conLai: player.inv.length, duoiDat: groundLoot.length,
                  conGi: player.inv.map(it => `${it.plus?'+'+it.plus:'tron'}${it.perfect?'-HH':''}`) };

    // ── F. dọn hàng loạt: BÁN — dọn được cả đồ Hoàn Hảo ──
    player.inv = dat.slice(); player.silver = 0; window._donArm = '';
    donRac('tui', 'ban'); donRac('tui', 'ban');
    o.sauBan = { conLai: player.inv.length, bac: player.silver,
                 conGi: player.inv.map(it => `${it.plus?'+'+it.plus:'tron'}`) };

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
  if (!r.lyDo.hoanHao) fail('chặn mà không nói lý do cho người chơi');
  if (!bad) pass('đúng luật: đồ thường vứt được · đồ Hoàn Hảo thì không');

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
  if (r.demVut !== 2) fail(`đếm VỨT ra ${r.demVut}, mong 2 (trơn + Vận; chừa món đã rèn và Hoàn Hảo)`);
  if (r.demBan !== 2) fail(`đếm BÁN ra ${r.demBan}, mong 2 (trơn + Vận; món đã rèn và Hoàn Hảo đều chừa)`);
  if (r.demVut === 2 && r.demBan === 3) pass('đếm đúng: vứt 2 · bán 3');

  // 6. phải bấm hai lần
  if (r.sauLan1 !== 4) fail(`bấm một lần đã dọn luôn (còn ${r.sauLan1}/4) — phải hỏi lại trước`);
  else pass('dọn hàng loạt bắt bấm xác nhận lần hai');

  // 7. vứt hàng loạt chừa đúng thứ cần chừa
  if (r.sauLan2.conLai !== 2 || r.sauLan2.duoiDat !== 2)
    fail(`vứt hàng loạt ra ${JSON.stringify(r.sauLan2)}, mong còn 2 trong túi · 2 dưới đất`);
  else pass('vứt hàng loạt: bỏ 2 món rác, giữ lại món đã rèn + Hoàn Hảo');

  // 8. bán hàng loạt dọn được cả đồ Hoàn Hảo
  if (r.sauBan.conLai !== 2) fail(`bán hàng loạt còn ${r.sauBan.conLai}, mong 2 (món đã rèn + Hoàn Hảo)`);
  else if (!(r.sauBan.bac > 0)) fail('bán hàng loạt không cộng Lumen');
  else pass(`bán hàng loạt dọn 2 món rác, chừa món đã rèn + Hoàn Hảo, +${r.sauBan.bac}◈`);

  // 9. kho dùng chung luật
  // Mong 2, giống túi ở mục F: món đã rèn và món Hoàn Hảo đều được chừa.
  if (r.sauKho.conLai !== 2) fail(`kho sau khi bán còn ${r.sauKho.conLai}, mong 2 — kho phải dùng chung luật với túi`);
  else pass('kho dùng chung đúng bộ luật với túi');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
