// Đợt vá early game theo hai bản chơi thử (BAO_CAO_TRAI_NGHIEM + BAO_CAO_NHIEM_VU).
//
// Mỗi mục dưới đây là một lỗi người chơi THẬT đã vấp, không phải giả định:
//   1. "Xoá tiến trình" không xoá — reload kích beforeunload → saveGame() ghi save trở lại. Người
//      chơi bấm xác nhận, mở lại vẫn thấy nhân vật cũ, và menu không có nút tạo nhân vật mới.
//   2. NV5 bắt rèn +1 nhưng Thợ Rèn duy nhất ở Sapidae Chiefdom — thành khoá tới NV10. Kẹt cứng.
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

    // ── 2. Thợ Rèn ở làng trên MAP TÂN THỦ, và dẫn đường ưu tiên lò tại chỗ ──
    // Làng (Trưởng Làng · Dược Sư · Thợ Rèn) đã theo dải cấp sang Rẻo Rừng Corran; Plant Tribe
    // Glade nay là map PK 38-48, đứng ở đó mà đo chặng tân thủ là đo nhầm map.
    const tr = NPCS.find(x => x.id === 'thoren_dao');
    o.thoRen = !!tr && tr.map === 'corran' && tr.talk === 'forge';
    curMap = 'corran'; buildWorld(); player.x = 506; player.y = 1158; player.beacon = null;
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

    // ── ĐÃ BỎ: cổng chính tuyến có lối vòng theo cấp ──
    // `reqMain` đã gỡ khỏi mọi map cùng với chuỗi nhiệm vụ (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH),
    // nên không còn "khoá theo nhiệm vụ" để mà vòng. Map nay mở bằng CẤP là đủ — nhánh dưới
    // chốt đúng điều đó. Dựng lại chuỗi mà cắm `reqMain` lại thì viết lại phần vòng ở đây.
    questIdx = 0; questState = 'none';
    const dat = lv => { player.level = lv; player.lvPeak = lv; calcDerived(); };
    dat(9);  o.congDuoiCap = mapGate('ngoai').ok === false && mapGate('ngoai').why === 'lv';
    dat(10); o.congDuCap  = mapGate('ngoai').ok === true;
    dat(12); o.cuaTheoCap = mapGate('chungnam').why === 'lv';
    dat(20); o.chungnamMo = mapGate('chungnam').ok === true;

    // ── 5. EXP 49→60 tăng đều, không bậc thang ×9,8 ──
    const xp = []; for (let l = 48; l <= 59; l++) xp.push(XP_TABLE[l]);
    o.xpTang = xp.every((v, i, a) => i === 0 || v > a[i-1]);
    o.xpBuocMax = +Math.max(...xp.slice(1).map((v, i) => v / xp[i])).toFixed(2);
    o.xp60 = XP_TABLE[59];

    // ── 6. Mục tiêu ngày mở theo cấp ──
    dat(1);  o.daily1 = dailyGoalsNow().map(g => g.id);
    dat(12); o.daily12 = dailyGoalsNow().length; o.dailyTong = DAILY_GOALS.length;

    // ── 7. NV phụ — ĐÃ BỎ ──
    // ⚠ Phần đo NHIỆM VỤ đã gỡ khỏi bài này: chuỗi nhiệm vụ đã xoá sạch để dựng lại (CLAUDE.md ·
    // NHIỆM VỤ ĐÃ GỠ SẠCH). Dựng lại chuỗi thì viết bài kiểm mới theo thiết kế mới, đừng khôi phục
    // phần cũ từ git — nó đo một chuỗi không còn tồn tại.


    // ── 8. HUD bạc ──
    player.silver = 3114.5463199999385; updateHud(); o.bac = el('hud-silver').textContent;

    // ── 9. Tutorial bước cuối tự đóng ──
    player.tutStep = TUT_STEPS.findIndex(s => s.key === 'quest'); player._tutQuestT = 0;
    for (let i = 0; i < 30; i++) tutTick(1);
    o.tutDong = player.tutStep === -1;

    // gợi ý sinh tồn
    player.hp = player.maxHp * 0.2; player.potions = 3;
    o.goiYUong = hintCandidates().some(h => h.id === 'uongthuoc'); player.hp = player.maxHp;

    // ── ĐÃ BỎ: E chọn NPC có VIỆC, không phải NPC gần nhất ──
    // Không còn nhiệm vụ nào nên không NPC nào "có việc" — phép đo mất mất đối tượng. Giữ lại
    // phần còn đo được: E vẫn mở đúng NPC ĐỨNG GẦN NHẤT.
    curMap = 'corran'; buildWorld();   // hai NPC làng nay đứng trên map tân thủ
    const tl = NPCS.find(x => x.id === 'truonglang'), ds = NPCS.find(x => x.id === 'duocsu');
    o.npcCach = Math.round(dist(tl.x, tl.y, ds.x, ds.y));
    sideStates = {};
    const ux = (tl.x - ds.x) / o.npcCach, uy = (tl.y - ds.y) / o.npcCach;
    player.x = ds.x + ux * 40; player.y = ds.y + uy * 40;   // 40px tới Dược Sư — hắn phải thắng
    closePanels(); tryTalk();
    o.moGanNhat = !el('panel-quest').classList.contains('hidden') && el('panel-quest').innerHTML.includes(ds.name);
    closePanels();

    // ── 11. Nhãn boss vùng có bậc QUÁ DỄ ──
    dat(40); renderStageSelect('corran');   // map tân thủ 1-12: cấp 40 phải đọc ra QUÁ DỄ sạch bảng
    o.nhanBoss = [...el('panel-stage').querySelectorAll('.zone-badge')].map(e => e.textContent.trim());
    closePanels(); dat(1);

    // ── 12. Cấp NV — ĐÃ BỎ ──
    // ⚠ Phần đo NHIỆM VỤ đã gỡ khỏi bài này: chuỗi nhiệm vụ đã xoá sạch để dựng lại (CLAUDE.md ·
    // NHIỆM VỤ ĐÃ GỠ SẠCH). Dựng lại chuỗi thì viết bài kiểm mới theo thiết kế mới, đừng khôi phục
    // phần cũ từ git — nó đo một chuỗi không còn tồn tại.

    // ── 13. Mô tả bản đồ tiếng Việt, không còn thuật ngữ lạ ──
    o.moTaLa = Object.keys(MAPS).filter(k => MAPS[k].desc && /Card Pages|Starbits|Steed|hunting ground|Chimeras|trial chamber|Farm /.test(MAPS[k].desc));
    return o;
  });
  console.log(JSON.stringify(r, null, 1));

  if (!r.autoEquip) fail('nhân vật mới không bật tự mặc đồ'); else pass('nhân vật mới bật tự mặc đồ');
  if (!r.thoRen) fail('không có Thợ Rèn ở làng trên map tân thủ (NV5 kẹt vì thành khoá)'); else pass('Thợ Rèn Lưu Vong đứng ở làng trên Rẻo Rừng Corran');
  if (r.beacon !== 'corran' || r.mapSauDanDuong !== 'corran') fail(`dẫn đường lò rèn trỏ về ${r.beacon}, map ${r.mapSauDanDuong} — phải ưu tiên lò tại chỗ`); else pass('dẫn đường lò rèn ưu tiên lò trên map đang đứng');
  if (!r.spaceQueued) fail('Space ngoài tầm không đặt mục tiêu chạy tới'); else pass('Space ngoài tầm → chạy tới quái gần nhất');
  if (!r.spaceHit || !r.spaceCoTat) fail(`Space chạy tới rồi không đánh (trúng ${r.spaceHit}, cờ tắt ${r.spaceCoTat}, ${r.spaceKhung} khung)`); else pass(`Space chạy tới rồi tự ra đòn sau ${r.spaceKhung} khung, cờ tắt`);
  if (!r.khongQuaiKhongChay) fail('không có quái mà Space vẫn đặt mục tiêu di chuyển'); else pass('không có quái: Space không chạy đi đâu');
  if (!r.congDuoiCap || !r.congDuCap) fail(`cổng Outskirts sai: dưới cấp ${r.congDuoiCap}, đủ cấp ${r.congDuCap}`); else pass('Beast Herd Camp: khoá dưới cấp 10, mở đúng cấp 10');
  if (!r.cuaTheoCap || !r.chungnamMo) fail(`cổng Werebear Woods sai: lý do khoá ${r.cuaTheoCap}, mở ở cấp 20 ${r.chungnamMo}`); else pass('Werebear Woods: khoá vì CẤP (không còn khoá vì nhiệm vụ), mở ở cấp 20');
  if (!r.xpTang || r.xpBuocMax > 1.5) fail(`EXP 49→60 không đều (bước lớn nhất ×${r.xpBuocMax})`); else pass(`EXP 49→60 tăng đều, bước lớn nhất ×${r.xpBuocMax}, mốc 60 giữ ${r.xp60}`);
  if (r.daily1.join() !== 'kills' || r.daily12 !== r.dailyTong) fail(`mục tiêu ngày: cấp 1 thấy ${r.daily1}, cấp 12 thấy ${r.daily12}/${r.dailyTong}`); else pass('mục tiêu ngày mở dần theo cấp');
  if (!/^3[.,]114$/.test(r.bac)) fail('HUD bạc in số lẻ: ' + r.bac); else pass('HUD bạc làm tròn: ' + r.bac);
  if (!r.tutDong) fail('bước tutorial cuối không tự đóng sau 25s'); else pass('bước tutorial cuối tự đóng');
  if (!r.goiYUong) fail('máu thấp không gợi ý uống thuốc'); else pass('máu thấp → gợi ý R uống thuốc');
  if (!r.moGanNhat) fail(`E không mở NPC gần nhất (hai NPC cách nhau ${r.npcCach}px)`); else pass('E mở đúng NPC đứng gần nhất');
  if (!r.nhanBoss.includes('QUÁ DỄ') || r.nhanBoss.includes('VỪA SỨC')) fail('cấp 40 ở map tân thủ mà nhãn: ' + r.nhanBoss.join(', ')); else pass('cấp 40: mọi bãi/boss trên map tân thủ gắn QUÁ DỄ');
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
  // Menu chính nay MỞ RA MÀN CHỌN MÁY CHỦ trước (nhịp mở đầu kiểu MU): danh sách nhân vật và
  // hai nút Tiếp Tục / Tạo Nhân Vật Mới bị ẩn cho tới khi người chơi chọn xong một cụm. Bài này
  // đo cái nằm SAU bước đó, nên phải bấm qua màn máy chủ y như người chơi.
  const menu = await p2.evaluate(() => {
    window.svChon(SERVERS[0].id);
    return { tiepTuc: !el('btn-continue').classList.contains('hidden'),
             nutMoi: !!el('btn-newchar') && !el('btn-newchar').classList.contains('hidden') };
  });
  // vào game rồi xoá — đúng đường người chơi đi (Cài Đặt → Xoá tiến trình)
  await p2.evaluate(() => { window.TEST_MODE = true; startGame('toanchan', null); player.level = 7; saveGame(); });
  await p2.evaluate(() => { window.wipeSave(true); }).catch(()=>{});
  await p2.waitForLoadState('load'); await p2.waitForTimeout(1200);
  const sau = await p2.evaluate(() => {
    window.svChon(SERVERS[0].id);                        // qua màn máy chủ lần nữa sau khi nạp lại
    return { save: !!localStorage.getItem('vlcm_save'),
             tiepTuc: !el('btn-continue').classList.contains('hidden') };
  });
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
