// Đợt vá early game theo hai bản chơi thử (BAO_CAO_TRAI_NGHIEM + BAO_CAO_NHIEM_VU).
//
// Mỗi mục dưới đây là một lỗi người chơi THẬT đã vấp, không phải giả định:
//   1. "Xoá tiến trình" không xoá — reload kích beforeunload → saveGame() ghi save trở lại. Người
//      chơi bấm xác nhận, mở lại vẫn thấy nhân vật cũ, và menu không có nút tạo nhân vật mới.
//   2. NV5 bắt rèn +1 nhưng Thợ Rèn duy nhất ở Lunaris City — thành khoá tới NV10. Kẹt cứng.
//   3. Space ngoài tầm là IM LẶNG tuyệt đối (70 lần bấm ở cấp 1, 0 quái chết), trong khi tutorial
//      ghi "đánh quái gần nhất".
//   4. Cày AUTO lên cấp 120 mà bản đồ vẫn 7 tấm "???" — cổng chỉ mở theo NV, không có lối vòng.
//   5. Mốc EXP 60 nhảy ×9,8 so với 59 trong đúng một cấp.
//   6. Mục tiêu ngày đòi "thông quan phó bản" với nhân vật cấp 1 chưa mở phó bản.
//   7. NV phụ 'talk' ghim đèn hiệu vào chính NPC vừa giao; 5 NV cầu nối trùng chính tuyến.
//   8. HUD in bạc "3114.5463199999385" vì Tụ Linh cộng số lẻ mỗi khung.
//   9. Bước tutorial cuối treo mãi (còn nguyên ở cấp 120), che prompt hái thảo dược.
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
    window.TEST_MODE = true; window.charTab = 'info';
    startGame('thieulam', null); player.traits = [];
    const o = {};
    o.autoEquip = player.autoEquip === true;

    // ── 2. Thợ Rèn trên Petalshade Isle, và dẫn đường ưu tiên lò tại chỗ ──
    const tr = NPCS.find(x => x.id === 'thoren_dao');
    o.thoRen = !!tr && tr.map === 'daohoa' && tr.talk === 'forge';
    curMap = 'daohoa'; buildWorld(); player.x = 460; player.y = 460; player.beacon = null;
    window.hintGoForge();
    o.beacon = player.beacon ? player.beacon.map : null; o.mapSauDanDuong = curMap;

    // ── 3. Space ngoài tầm: chạy tới, vào tầm thì ra đòn, cờ tự tắt ──
    const typ = mobs.find(m => !m.def.boss && !m.def.elite && !m.tiep).type;
    mobs.splice(0); player.auto = false; moveTarget = null; player._spaceQueued = false;
    player.x = 400; player.y = 700;
    const m = spawnMob(typ, { x:880, y:700, r:0, count:1 }, 5, false, {});
    m.aggro = 0; // đo hành vi của NGƯỜI CHƠI, không để quái tự đi lại
    doBasic();
    o.spaceQueued = player._spaceQueued === true && !!moveTarget;
    const hp0 = m.hp; let khung = 0;
    for (; khung < 200 && m.hp >= hp0; khung++){ m.x = 880; m.y = 700; update(0.05); }
    o.spaceHit = m.hp < hp0; o.spaceKhung = khung; o.spaceCoTat = !player._spaceQueued;
    mobs.splice(0); moveTarget = null; doBasic();
    o.khongQuaiKhongChay = !moveTarget && !player._spaceQueued;

    // ── 4. Cổng chính tuyến có lối vòng theo cấp ──
    questIdx = 0; questState = 'none';
    const dat = lv => { player.level = lv; player.lvPeak = lv; calcDerived(); };
    dat(12); const g2 = mapGate('ngoai');   // min 10 + reqMain 10 → cần cấp 14 để vòng
    o.chuaVong = g2.ok === false && g2.why === 'quest' && g2.orLv === 10 + MAP_LV_BYPASS;
    dat(14); o.vongDuoc = mapGate('ngoai').ok === true;
    dat(23); o.chungnamChua = mapGate('chungnam').ok === false;
    dat(24); o.chungnamVong = mapGate('chungnam').ok === true;
    dat(12); o.cuaTheoCap = mapGate('chungnam').why === 'lv';

    // ── 5. EXP 49→60 tăng đều, không bậc thang ×9,8 ──
    const xp = []; for (let l = 48; l <= 59; l++) xp.push(XP_TABLE[l]);
    o.xpTang = xp.every((v, i, a) => i === 0 || v > a[i-1]);
    o.xpBuocMax = +Math.max(...xp.slice(1).map((v, i) => v / xp[i])).toFixed(2);
    o.xp60 = XP_TABLE[59];

    // ── 6. Mục tiêu ngày mở theo cấp ──
    dat(1);  o.daily1 = dailyGoalsNow().map(g => g.id);
    dat(12); o.daily12 = dailyGoalsNow().length; o.dailyTong = DAILY_GOALS.length;

    // ── 7. NV phụ ──
    o.sBCu = SIDE_QUESTS.filter(q => /^s_b[1-5]$/.test(q.id)).map(q => q.id);
    const s6 = SIDE_QUESTS.find(q => q.id === 's_b6');
    sideStates = {}; sideStates.s_b6 = { st:'active', prog:0 };
    const tgt = sideQuestTarget(s6);
    o.s6Dich = tgt ? tgt.npcId : null; o.s6Muon = s6.targetNpc; o.s6Giao = s6.npc;
    sideStates = {};

    // ── 8. HUD bạc ──
    player.silver = 3114.5463199999385; updateHud(); o.bac = el('hud-silver').textContent;

    // ── 9. Tutorial bước cuối tự đóng ──
    player.tutStep = TUT_STEPS.findIndex(s => s.key === 'quest'); player._tutQuestT = 0;
    for (let i = 0; i < 30; i++) tutTick(1);
    o.tutDong = player.tutStep === -1;

    // gợi ý sinh tồn
    player.hp = player.maxHp * 0.2; player.potions = 3;
    o.goiYUong = hintCandidates().some(h => h.id === 'uongthuoc'); player.hp = player.maxHp;

    // ── 10. E chọn NPC có VIỆC, không phải NPC gần nhất ──
    // Trưởng Làng & Dược Sư cách nhau 163px: đứng gần Dược Sư hơn nhưng đang có NV để trả cho
    // Trưởng Làng thì phải mở Trưởng Làng.
    curMap = 'daohoa'; buildWorld();
    const tl = NPCS.find(x => x.id === 'truonglang'), ds = NPCS.find(x => x.id === 'duocsu');
    o.npcCach = Math.round(dist(tl.x, tl.y, ds.x, ds.y));
    questIdx = 2; questState = 'done'; questProg = 4; sideStates = {};
    const ux = (tl.x - ds.x) / o.npcCach, uy = (tl.y - ds.y) / o.npcCach;
    player.x = ds.x + ux * 72; player.y = ds.y + uy * 72;   // 72px tới Dược Sư, ~91px tới Trưởng Làng
    o.dauTL = npcMark(tl); o.dauDS = npcMark(ds);
    closePanels(); tryTalk();
    o.moTL = !el('panel-quest').classList.contains('hidden') && el('panel-quest').innerHTML.includes(tl.name);
    closePanels();
    questIdx = 0; questState = 'none'; questProg = 0;

    // ── 11. Nhãn boss vùng có bậc QUÁ DỄ ──
    dat(40); renderStageSelect('daohoa');
    o.nhanBoss = [...el('panel-stage').querySelectorAll('.zone-badge')].map(e => e.textContent.trim());
    closePanels(); dat(1);

    // ── 12. Cấp NV diệt quái không thấp hơn cấp quái quá 4 (elite có khiên: 85 lần chết ở NV35) ──
    o.nvLech = QUESTS.filter(q => q.type === 'kill' && MOBS[q.mob] && (MOBS[q.mob].lv || 1) - q.lv > 4).map(q => `NV${q.id} lv${q.lv} vs ${q.mob} lv${MOBS[q.mob].lv}`);
    o.nvTang = QUESTS.every((q, i) => i === 0 || q.lv >= QUESTS[i-1].lv);

    // ── 13. Mô tả bản đồ tiếng Việt, không còn thuật ngữ lạ ──
    o.moTaLa = Object.keys(MAPS).filter(k => MAPS[k].desc && /Card Pages|Starbits|Steed|hunting ground|Chimeras|trial chamber|Farm /.test(MAPS[k].desc));
    return o;
  });
  console.log(JSON.stringify(r, null, 1));

  if (!r.autoEquip) fail('nhân vật mới không bật tự mặc đồ'); else pass('nhân vật mới bật tự mặc đồ');
  if (!r.thoRen) fail('không có Thợ Rèn trên Petalshade Isle (NV5 kẹt vì thành khoá)'); else pass('Thợ Rèn Lưu Vong đứng ở Petalshade Isle');
  if (r.beacon !== 'daohoa' || r.mapSauDanDuong !== 'daohoa') fail(`dẫn đường lò rèn trỏ về ${r.beacon}, map ${r.mapSauDanDuong} — phải ưu tiên lò tại chỗ`); else pass('dẫn đường lò rèn ưu tiên lò trên map đang đứng');
  if (!r.spaceQueued) fail('Space ngoài tầm không đặt mục tiêu chạy tới'); else pass('Space ngoài tầm → chạy tới quái gần nhất');
  if (!r.spaceHit || !r.spaceCoTat) fail(`Space chạy tới rồi không đánh (trúng ${r.spaceHit}, cờ tắt ${r.spaceCoTat}, ${r.spaceKhung} khung)`); else pass(`Space chạy tới rồi tự ra đòn sau ${r.spaceKhung} khung, cờ tắt`);
  if (!r.khongQuaiKhongChay) fail('không có quái mà Space vẫn đặt mục tiêu di chuyển'); else pass('không có quái: Space không chạy đi đâu');
  if (!r.chuaVong || !r.vongDuoc) fail(`lối vòng theo cấp sai: cấp 12 ${JSON.stringify(r.chuaVong)}, cấp 14 ${r.vongDuoc}`); else pass('Petalshade Outskirts: khoá ở cấp 12, vòng được ở cấp 14');
  if (!r.chungnamChua || !r.chungnamVong || !r.cuaTheoCap) fail('Thornwood Reach: cổng cấp/NV/lối vòng sai'); else pass('Thornwood Reach: cấp 12 khoá cấp, 23 khoá NV, 24 vòng được');
  if (!r.xpTang || r.xpBuocMax > 1.5) fail(`EXP 49→60 không đều (bước lớn nhất ×${r.xpBuocMax})`); else pass(`EXP 49→60 tăng đều, bước lớn nhất ×${r.xpBuocMax}, mốc 60 giữ ${r.xp60}`);
  if (r.daily1.join() !== 'kills' || r.daily12 !== r.dailyTong) fail(`mục tiêu ngày: cấp 1 thấy ${r.daily1}, cấp 12 thấy ${r.daily12}/${r.dailyTong}`); else pass('mục tiêu ngày mở dần theo cấp');
  if (r.sBCu.length) fail('NV cầu nối trùng chính tuyến vẫn còn: ' + r.sBCu); else pass('s_b1–s_b5 đã gỡ');
  if (r.s6Dich !== r.s6Muon || r.s6Dich === r.s6Giao) fail(`NV talk ghim đèn hiệu vào ${r.s6Dich}, phải là ${r.s6Muon}`); else pass('NV talk ghim đèn hiệu vào NPC đích');
  if (!/^3[.,]114$/.test(r.bac)) fail('HUD bạc in số lẻ: ' + r.bac); else pass('HUD bạc làm tròn: ' + r.bac);
  if (!r.tutDong) fail('bước tutorial cuối không tự đóng sau 25s'); else pass('bước tutorial cuối tự đóng');
  if (!r.goiYUong) fail('máu thấp không gợi ý uống thuốc'); else pass('máu thấp → gợi ý R uống thuốc');
  if (r.dauTL !== '!' || r.dauDS !== '' || !r.moTL) fail(`E chọn nhầm NPC: dấu TL '${r.dauTL}' DS '${r.dauDS}', mở Trưởng Làng ${r.moTL} (cách nhau ${r.npcCach}px)`); else pass('E ưu tiên NPC có NV để trả dù đứng gần NPC khác hơn');
  if (!r.nhanBoss.includes('QUÁ DỄ') || r.nhanBoss.includes('VỪA SỨC')) fail('cấp 40 ở Petalshade mà nhãn: ' + r.nhanBoss.join(', ')); else pass('cấp 40: mọi bãi/boss Petalshade gắn QUÁ DỄ');
  if (r.nvLech.length || !r.nvTang) fail(`cấp NV lệch cấp quái: ${r.nvLech.join('; ')} · tăng dần ${r.nvTang}`); else pass('35 NV: cấp tăng dần, NV diệt quái không thấp hơn quái quá 4 cấp');
  if (r.moTaLa.length) fail('mô tả bản đồ còn tiếng Anh/thuật ngữ lạ: ' + r.moTaLa); else pass('8 mô tả bản đồ tiếng Việt');

  // ── 1. Xoá tiến trình phải xoá THẬT, kể cả gọi từ trong game ──
  const c2 = await b.newContext({ viewport: { width: 1100, height: 700 } });
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push(String(e)));
  await p2.goto('http://localhost:' + PORT + '/index.html');
  await p2.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p2.waitForTimeout(500);
  await p2.evaluate(() => { window.TEST_MODE = true; startGame('toanchan', null); player.level = 7; saveGame(); });
  const coSave = await p2.evaluate(() => !!localStorage.getItem('vlcm_save'));
  await p2.reload({ waitUntil:'load' }); await p2.waitForTimeout(1200);
  const menu = await p2.evaluate(() => ({
    tiepTuc: !el('btn-continue').classList.contains('hidden'),
    nutMoi: !!el('btn-newchar') && !el('btn-newchar').classList.contains('hidden') }));
  // vào game rồi xoá — đúng đường người chơi đi (Cài Đặt → Xoá tiến trình)
  await p2.evaluate(() => { window.TEST_MODE = true; startGame('toanchan', null); player.level = 7; saveGame(); });
  await p2.evaluate(() => { window.wipeSave(true); }).catch(()=>{});
  await p2.waitForLoadState('load'); await p2.waitForTimeout(1200);
  const sau = await p2.evaluate(() => ({ save: !!localStorage.getItem('vlcm_save'), tiepTuc: !el('btn-continue').classList.contains('hidden') }));
  console.log('wipe:', JSON.stringify({ coSave, menu, sau }));
  if (!coSave) fail('dựng cảnh sai: saveGame() không ghi save');
  if (!menu.tiepTuc) fail('có save mà menu không mời Tiếp Tục');
  if (!menu.nutMoi) fail('menu có save nhưng không có nút Tạo Nhân Vật Mới'); else pass('menu có nút Tạo Nhân Vật Mới');
  if (sau.save || sau.tiepTuc) fail(`xoá tiến trình từ trong game mà save vẫn còn (save ${sau.save}, Tiếp Tục ${sau.tiepTuc})`); else pass('xoá tiến trình từ trong game: save mất thật, menu về chọn lớp');

  console.log('errors:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) bad++;
  console.log(bad ? `FAIL(${bad})` : 'PASS');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
