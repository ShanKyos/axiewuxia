// Cốt truyện + hội thoại — đợt "hết nói dối" và "NPC biết nói".
//
// Bốn thứ phải gác, và cả bốn đều là chỗ nội dung dễ mục lại nhất:
//
//  1. GAME TỰ MÂU THUẪN. Màn chọn lớp kể ba con tàu cập bến ngay sau trang dẫn truyện nói nhân
//     vật rơi qua vết nứt; kẻ thù cuối lúc là Morvahn lúc là Hung Thần (mà canon định nghĩa Hung
//     Thần là boss thế giới định kỳ, KHÔNG phải Morvahn); danh hiệu trao cho người chơi là "Kẻ
//     Khép Vết Nứt" trong khi cả bi kịch là họ MỞ nó. Mục 1 quét thẳng chuỗi hiển thị.
//  2. XƯƠNG SỐNG KHÔNG ĐẾM ĐƯỢC. Bộ tên cũ theo ngũ hành tự đá nhau (Trụ Hỏa ở CẢ trụ đầu lẫn
//     trụ cuối, Trụ Thổ không lần nào), rồi bản thay nó lại có hai tên trỏ vào nơi KHÔNG TỒN TẠI
//     trong MAPS ("Trụ Roost" · "Trụ Ashmark"). Nặng hơn: bảng chỉ 5 mục mà cờ `ta_*` thì 11 map
//     đều set được, nên panel in ra đúng chữ "11/7 Tướng Quân đã hạ". Nay là BẢY RUNE CỔ, và mục
//     2 đòi CẢ HAI con số phải đếm được và không con nào vượt tổng của chính nó.
//  3. NPC NÓI ĐÚNG MỘT CÂU CẢ ĐỜI. `lore` là chuỗi nên in y hệt lúc chưa nhận, đang làm và đã
//     xong nhiệm vụ. Mục 3 lái trạng thái nhiệm vụ rồi so từng câu.
//  4. CUỘC GẶP RỖNG. Nhiệm vụ type:'talk' dựng hẳn một chặng để đi gặp một người, mà gặp xong
//     người đó không nói gì về nhiệm vụ. Mục 4 đứng trước đúng người đó và đọc bảng.
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

  // ── 1. hết mâu thuẫn ──
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const ssEl = document.querySelector('#sect-select');
    const ss = ssEl ? ssEl.querySelector('h2').textContent + ' ' + ssEl.querySelector('.ss-sub').textContent : '';
    const all = [...NPCS.map(n => typeof n.lore === 'string' ? n.lore : Object.values(n.lore || {}).join(' ')),
                 ...Object.values(REGION_UNLOCK_LORE).map(x => x.sub),
                 ...TITLES.map(t => t.name), ...TRAITS.map(t => t.name + ' ' + t.desc),
                 ...Object.values(TRAIT_TIERS).map(t => t.name),
                 ...Object.values(PERSONALITIES).map(x => x.name + ' ' + x.desc),
                 MAPS.ardhaven.desc].join(' | ');
    return { tau: /con tàu|cập bến|chiếc lồng/i.test(ss),
             nut: /vết nứt|trời nứt/i.test(ss), ss: ss.slice(0, 70),
             khep: all.includes('Kẻ Khép Vết Nứt'),
             nguHanh: /Trụ (Hỏa|Mộc|Thủy|Kim|Thổ)|Rune (Hỏa|Mộc|Thủy|Kim|Thổ)/.test(all),
             // Canon cũ đã bỏ: không một danh từ nào của nó được còn trong chữ người chơi thấy.
             cuKy: ['Morvahn','Trụ Khoá','Trụ Khóa','Thủ Hộ Vaeldra','Vệ Binh Trụ'].filter(w => all.includes(w)),
             // Hai địa danh mồ côi của bảng tên cũ — chúng không có trong MAPS.
             moCoi: ['Trụ Roost','Trụ Ashmark'].filter(w => all.includes(w)),
             cho: /Chợ Đấu Giá/.test(MAPS.ardhaven.desc),
             cam: ['mạch lực','Võ Hồn','Long Tích','Bách Bộ','Nhục Thân','Tà Khí','Trung Dung','PHÀM','HUYỀN','THIÊN']
                    .filter(w => all.includes(w)),
             kyHieu: (document.body.innerHTML.match(/☬/g) || []).length };
  });
  console.log('1) mâu thuẫn:', JSON.stringify(r1));
  if (r1.tau || !r1.nut) fail('màn chọn lớp vẫn kể chuyện ba con tàu'); else pass('màn chọn lớp kể đúng vết nứt');
  if (r1.khep) fail('còn danh hiệu "Kẻ Khép Vết Nứt" — nó phủ nhận chính kết truyện');
  else pass('danh hiệu khớp kết truyện');
  if (r1.nguHanh) fail('Rune Cổ vẫn đặt tên theo ngũ hành'); else pass('Rune Cổ không đặt tên theo ngũ hành');
  if (r1.cuKy.length) fail('canon cũ còn sống trong chữ người chơi thấy: ' + r1.cuKy.join(', '));
  else pass('không còn danh từ nào của canon cũ (Morvahn · Trụ Khoá · Thủ Hộ Vaeldra)');
  if (r1.moCoi.length) fail('còn địa danh mồ côi không có trong MAPS: ' + r1.moCoi.join(', '));
  else pass('không còn tên Rune trỏ vào nơi không tồn tại');
  if (r1.cho) fail('mô tả Sapidae Chiefdom còn chỉ vào Chợ Đấu Giá đã xoá'); else pass('mô tả Sapidae Chiefdom khớp NPC thật');
  if (r1.cam.length) fail('còn từ vựng kiếm hiệp trong text người chơi thấy: ' + r1.cam.join(', '));
  else pass('không còn từ vựng kiếm hiệp trong Đặc Điểm / Tính Cách');
  if (r1.kyHieu) fail('còn ký hiệu ☬ ngoài bộ đã duyệt'); else pass('hết ký hiệu ☬');

  // ── 2. Bảy Rune Cổ đếm được, và KHÔNG con số nào vượt tổng của chính nó ──
  const r2 = await p.evaluate(() => {
    startGame('thieulam', null);
    const t0 = runeDaThu();
    // Hai map LỐI ĐI, cố ý không có Rune — hạ Trấn Ải ở đó không được tính là thu Rune.
    player.storyFlags = { ta_corran:true, ta_trungnut:true };
    const t1 = runeDaThu(), q1 = tuongQuanDaHa();
    player.storyFlags.ta_chungnam = true; player.storyFlags.ta_comoc = true;
    const t2 = runeDaThu(), q2 = tuongQuanDaHa();
    // Vét sạch: đây là chỗ từng in ra "11/7".
    const het = Object.keys(BOSS_DEFS).filter(m => BOSS_DEFS[m].tranai);
    player.storyFlags = {}; for (const m of het) player.storyFlags['ta_' + m] = true;
    window.qlogTab = 'story'; renderQlog();
    const bang = document.getElementById('panel-qlog').innerText.replace(/\s+/g, ' ');
    const ten = Object.values(RUNE_CO).map(r => r.ten);
    return { t0, t1, q1, t2, q2, tong: RUNE_TONG, taTong: TRAN_AI_TONG,
             runeHet: runeDaThu(), taHet: tuongQuanDaHa(), soMapTranAi: het.length,
             ten, trung: new Set(ten).size,
             luatDu: Object.values(RUNE_CO).filter(r => !r.luat).length,
             // Mỗi vùng có Rune phải nói ra Rune của nó ở desc — dòng người chơi đọc mỗi lần vào map.
             descThieu: Object.keys(RUNE_CO).filter(m => !MAPS[m].desc.includes('Rune')),
             vuotTran: /\b(\d+)\/(\d+)\b/.test(bang) && [...bang.matchAll(/(\d+)\/(\d+)/g)]
                          .filter(m => +m[1] > +m[2]).map(m => m[0]) };
  });
  console.log('2) Rune Cổ:', JSON.stringify(r2));
  if (r2.tong !== 7) fail('phải đúng 7 Rune Cổ, đếm được ' + r2.tong); else pass('đúng 7 Rune Cổ');
  if (r2.trung !== 7) fail('có tên Rune bị trùng'); else pass('7 tên Rune không trùng nhau');
  if (r2.luatDu) fail(r2.luatDu + ' Rune không khai `luat` — người chơi không biết nó giữ cái gì');
  else pass('mỗi Rune nói được cái luật nó giữ');
  if (r2.t1 !== 0) fail('map lối đi không có Rune mà vẫn đếm ' + r2.t1);
  else pass('bốn map lối đi không tính vào bộ đếm Rune');
  if (r2.t2 !== 2 || r2.q2 !== 4) fail(`đếm sai: ${r2.t2}/7 Rune, ${r2.q2} Tướng Quân`);
  else pass('đếm tách bạch: 2/7 Rune Cổ · 4 Tướng Quân');
  if (r2.taTong !== r2.soMapTranAi) fail(`TRAN_AI_TONG=${r2.taTong} nhưng có ${r2.soMapTranAi} map mang Trấn Ải`);
  else pass(`tổng Tướng Quân suy từ BOSS_DEFS (${r2.taTong}), không chép cứng`);
  // ⚠ ĐÂY LÀ BÀI GÁC CHÍNH: vét sạch game thì không phân số nào được vượt trần.
  if (r2.vuotTran && r2.vuotTran.length) fail('Nhật Ký in phân số vượt trần: ' + r2.vuotTran.join(', '));
  else pass('vét sạch 11 Trấn Ải: 7/7 Rune · 11/11 Tướng Quân, không phân số nào vượt trần');
  if (r2.descThieu.length) fail('vùng có Rune mà desc không nhắc Rune nào: ' + r2.descThieu.join(', '));
  else pass('cả 7 vùng có Rune đều nói ra phiến của mình ở mô tả map');

  // ── 3. NPC nói khác nhau theo trạng thái nhiệm vụ ──
  const r3 = await p.evaluate(() => {
    startGame('thieulam', null);
    const tl = NPCS.find(n => n.id === 'truonglang');
    // ⚠ LUẬT SIẾT VÀO ĐÚNG NGƯỜI GIAO NHIỆM VỤ, KHÔNG PHẢI MỌI NGƯỜI BẤM E ĐƯỢC.
    // Tội mà bài này gác là "NPC NHIỆM VỤ nói đúng một câu cả đời" — người giao việc mà lúc
    // chưa nhận, đang làm và đã xong đều nói y hệt thì hỏng. Nhưng `talk:'quest'` còn là cách
    // DUY NHẤT để một NPC bấm E ra được khung thoại, nên cả dân phố cũng phải mang cờ đó: bà
    // bán hoa, thợ nhuộm, kẻ hát rong. Họ KHÔNG giao việc gì, và bắt họ có bốn trạng thái là
    // bịa ra ba câu cho một thứ không bao giờ đổi trạng thái.
    // Mốc đúng: NPC có tên trong `QUESTS[].npc` — người thật sự giao việc.
    const giaoViec = new Set((window.QUESTS || []).map(x => x.npc).filter(Boolean));
    const co4 = NPCS.filter(n => n.talk === 'quest' && n.lore && typeof n.lore === 'object').length;
    const cauCoDinh = NPCS.filter(n => giaoViec.has(n.id) && typeof n.lore === 'string').map(n => n.id);
    // ⚠ Trước đây lái questState để bắt npcLoi() trả 4 câu khác nhau. Nhiệm vụ đã gỡ sạch
    // (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH) nên currentQuest() luôn rỗng và npcLoi() luôn về câu
    // idle — không còn nhánh để đo. Giữ lại phần DỮ LIỆU: bốn câu trong lore vẫn phải khác nhau,
    // để khi dựng lại chuỗi là có sẵn giọng cho cả bốn trạng thái.
    const L = tl.lore;
    const i = npcLoi(tl);
    const khac = new Set([L.idle, L.offer, L.active, L.done].filter(Boolean)).size;
    const thieu4 = NPCS.filter(n => n.talk === 'quest' && n.lore && typeof n.lore === 'object')
      .filter(n => !(n.lore.idle && n.lore.offer && n.lore.active && n.lore.done)).map(n => n.id);
    const barks = NPCS.filter(n => n.barks && n.barks.length).length;
    const tongBark = NPCS.reduce((s,n) => s + ((n.barks && n.barks.length) || 0), 0);
    return { co4, cauCoDinh, i, khac, thieu4, barks, tongBark, npc: NPCS.length };
  });
  console.log('3) thoại:', JSON.stringify({ co4:r3.co4, khac:r3.khac, barks:r3.barks, tongBark:r3.tongBark }));
  if (r3.cauCoDinh.length) fail(`còn ${r3.cauCoDinh.length} NGƯỜI GIAO NHIỆM VỤ chỉ có một câu cố định: ${r3.cauCoDinh.join(', ')}`);
  else pass(`mọi người giao nhiệm vụ đều có thoại 4 trạng thái (${r3.co4} NPC dùng khuôn 4 câu)`);
  if (r3.khac !== 4) fail('bốn trạng thái trong lore không phải bốn câu khác nhau, chỉ ' + r3.khac);
  else pass('lore Trưởng Làng: bốn trạng thái → bốn câu khác nhau');
  if (r3.thieu4.length) fail('NPC nhiệm vụ thiếu trạng thái lore: ' + r3.thieu4.join(','));
  else pass(`cả ${r3.co4} NPC nhiệm vụ có đủ idle/offer/active/done`);
  if (!r3.i) fail('Trưởng Làng vẫn câm — NPC giao 9/10 nhiệm vụ đầu game');
  else pass('Trưởng Làng có giọng: ' + r3.i.slice(0, 44) + '…');
  if (r3.barks < 15) fail(`mới ${r3.barks}/${r3.npc} NPC có thoại nhàn rỗi`);
  else pass(`${r3.barks}/${r3.npc} NPC có thoại nhàn rỗi, tổng ${r3.tongBark} câu`);

  // ── 4. cuộc gặp talk — ĐÃ BỎ ──
  // ⚠ Phần đo NHIỆM VỤ đã gỡ khỏi bài này: chuỗi nhiệm vụ đã xoá sạch để dựng lại
  // (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH). Khi dựng lại chuỗi, viết bài kiểm mới theo thiết kế mới —
  // đừng khôi phục phần cũ từ git, nó đo một chuỗi không còn tồn tại.

  // ── 5. hộp thoại nhiều trang + game nhớ thái độ ──
  const r5 = await p.evaluate(() => {
    startGame('thieulam', null);
    const rell = NPCS.find(n => n.id === 'quachtinh');
    player.gapNpc = {}; window._trangI = 0;
    renderQuestNpc(rell);
    const t1 = el('panel-quest').innerHTML;
    const coNut = /trangTiep\(\)/.test(t1);
    window.trangTiep(); window.trangTiep();
    const t3 = el('panel-quest').innerHTML;
    const coChon = /trangChon\('a'\)/.test(t3);
    window.trangChon('a');
    const sau = el('panel-quest').innerHTML;
    return { soTrang: rell.trang.length, coNut, coChon,
             nho: (player.thaiDo || {}).quachtinh, daGap: !!(player.gapNpc || {}).quachtinh,
             // ⚠ Trước đo /qd-quest/ — khối nhiệm vụ. Nhiệm vụ đã gỡ sạch nên khối đó không
             // còn vẽ ra; phần còn thật là: gặp xong thì THOÁT hẳn chế độ phân trang.
             veViec: !/npc-trang-nav/.test(sau) && sau.length > 40,
             coTrang: NPCS.filter(n => n.trang && n.trang.length).length };
  });
  console.log('5) nhiều trang:', JSON.stringify(r5));
  if (!r5.coNut || r5.soTrang < 3) fail('lần gặp đầu không phân trang'); else pass(`lần gặp đầu ${r5.soTrang} trang, có nút Tiếp`);
  if (!r5.coChon) fail('trang cuối không hỏi thái độ'); else pass('trang cuối hỏi một câu thái độ');
  if (r5.nho !== 'a' || !r5.daGap) fail('game không nhớ lựa chọn'); else pass('game nhớ lựa chọn, không hỏi lại lần sau');
  if (!r5.veViec) fail('gặp xong vẫn kẹt ở chế độ phân trang'); else pass('gặp xong thoát phân trang, về bảng NPC thường');
  if (r5.coTrang !== 7) fail(`phải 7 người dẫn chương có trang thoại, đếm ${r5.coTrang}`);
  else pass('đủ 7 người dẫn chương có trang thoại lần gặp đầu');

  // ── 6. Dược Sư hết là NPC chết — ĐÃ BỎ ──
  // ⚠ Bài này đo "mọi NPC talk:'quest' đều có ít nhất một nhiệm vụ". Toàn bộ nhiệm vụ đã gỡ
  // sạch (CLAUDE.md · NHIỆM VỤ ĐÃ GỠ SẠCH) nên hiện GIỜ CẢ 9 NPC đều rỗng việc — đúng như
  // thiết kế tạm. ĐÂY LÀ ĐIỀU KIỆN PHẢI KHÔI PHỤC khi dựng lại chuỗi: mỗi NPC nhiệm vụ
  // phải có việc, và Dược Sư phải có phụ tuyến riêng. Đừng khôi phục phần cũ từ git.

  // ── 7. bảy người dẫn chương biết nhau ──
  const r7 = await p.evaluate(() => {
    const ten = { quachtinh:'Rell', monkhach:'Wren', daosi:'Corran', thumo:'Sylas',
                  ttmon:'Liora', noiung:'Dax', laotuong:'Brann' };
    const ids = Object.keys(ten);
    let nhac = 0;
    for (const id of ids){
      const n = NPCS.find(x => x.id === id);
      const txt = (n.trang || []).join(' ');
      if (ids.some(o => o !== id && txt.includes(ten[o]))) nhac++;
    }
    const brann = (NPCS.find(x => x.id === 'laotuong').trang || []).join(' ');
    return { nhac, brannDu: ids.filter(o => o !== 'laotuong' && brann.includes(ten[o])).length };
  });
  console.log('7) dẫn chương:', JSON.stringify(r7));
  if (r7.nhac < 6) fail(`mới ${r7.nhac}/7 người dẫn chương nhắc tới người khác`);
  else pass(`${r7.nhac}/7 người dẫn chương gọi tên người trước`);
  if (r7.brannDu !== 6) fail(`Brann phải gọi tên cả 6 người, đếm ${r7.brannDu}`);
  else pass('Brann ở chương cuối gọi tên cả sáu người');

  console.log('errors:', JSON.stringify(errs.slice(0,5)));
  if (errs.length) fail(errs.length + ' lỗi runtime');
  console.log(bad ? 'FAILED ' + bad : 'PASS');
  await b.close(); process.exit(bad ? 1 : 0);
})();
