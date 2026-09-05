// Khung bảng phải ĐỒNG NHẤT: mở bảng nào ra cũng một thanh tiêu đề khắc chìm, một kiểu tab,
// một nút ✕ ở góc. Trước đợt gộp này mỗi bảng một kiểu: bảy bảng có <h3> nằm sâu hơn một tầng
// nên mất hẳn thanh khắc chìm (CSS dùng bộ chọn CON TRỰC TIẾP), bảng Nhân Vật có HAI tiêu đề
// chồng nhau, Lò Hỗn Độn là bảng DUY NHẤT không có nút đóng, và ba kiểu tab khác nhau cùng tồn
// tại (.char-tabs bo tròn 999px, .chaos-tab chữ 14px, .mini-btn.danger viền đỏ dùng làm tab tắt).
// Bài này khoá lại cả bốn thứ đó.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => fail('lỗi runtime: ' + e.message));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); applyTestBoost(); moHetCong(); });
  await p.waitForTimeout(500);

  // ── 1. Ba lớp tab cũ phải BIẾN MẤT khỏi CSS lẫn HTML sinh ra ──────────────
  const cu = await p.evaluate(() => {
    let css = 0;
    for (const sh of document.styleSheets){
      let rs; try { rs = sh.cssRules; } catch(e){ continue; }
      for (const r of rs) if (r.selectorText && /\.char-tabs|\.chaos-tab/.test(r.selectorText)) css++;
    }
    return { css, dom: document.querySelectorAll('.char-tabs,.chaos-tab').length };
  });
  if (cu.css) fail(`còn ${cu.css} luật CSS cho lớp tab cũ (.char-tabs/.chaos-tab)`);
  else pass('CSS chỉ còn một kiểu tab');
  if (cu.dom) fail(`còn ${cu.dom} phần tử mang lớp tab cũ trong DOM`);

  // ── 2. Mở lần lượt từng bảng, soi khung ───────────────────────────────────
  const BANG = [
    ['panel-char',     () => togglePanel('char')],
    ['panel-inv',      () => togglePanel('inv')],
    ['panel-bag',      () => togglePanel('bag')],
    ['panel-skill',    () => togglePanel('skill')],
    ['panel-map',      () => togglePanel('map')],
    ['panel-settings', () => togglePanel('settings')],
    ['panel-qlog',     () => togglePanel('qlog')],
    // Lò Hỗn Độn chỉ mở khi ĐỨNG CẠNH Thợ Rèn (atRoyalForge < 220px) — dịch nhân vật tới đó
    // trước, chứ không phải cứ gọi hàm là ra bảng.
    // Hội thoại NPC — bảng cuối cùng còn in tiêu đề trần, vì <h3> của nó nằm trong .npc-head.
    // Chân dung nay nằm TRONG thanh khắc chìm, nên bảng này cũng phải qua được mọi phép kiểm.
    // `npcs` là danh sách NPC ĐANG ĐỨNG TRÊN MÀN hiện tại (rỗng ở Tường Dương); bảng định nghĩa
    // là NPCS. Lấy nhầm cái đầu thì bài kiểm đỏ vì không tìm ra ai, chứ không phải vì lỗi giao diện.
    ['panel-quest',    () => { const L = Object.values(NPCS);
                               const n = L.find(x => SHOPS[x.id]);
                               if (!n) throw new Error('không tìm được NPC có tiệm trong NPCS');
                               renderShop(n); }, 'panel-quest (hội thoại NPC)'],
    // Kho Cốt mượn khung phủ dùng chung #panel-quest
    ['panel-quest',    () => { if (!Object.keys(chiState().co).length) chiNhan(Object.keys(CHI_MAP)[0]);
                               if (!cotKho().length) cotKho().push(cotMoi(COT_DONG_IDS[0], 'tinh'));
                               window.moKhoCot(Object.keys(chiState().co)[0]); }, 'panel-quest (Kho Cốt)'],
    ['panel-forge',    () => { const n = forgeNpcHere();
                               if (n){ player.x = n.x; player.y = n.y; }
                               window.openForgePanel(); }],
  ];
  const bao = [];
  for (const [id, mo, nhan] of BANG){
    const r = await p.evaluate(([id, src, nhan]) => {
      closePanels();
      try { (new Function(src))(); } catch(e){ return { id: nhan || id, loi: e.message }; }
      const el = document.getElementById(id);
      if (!el) return { id: nhan || id, loi: 'không có phần tử' };
      if (el.classList.contains('hidden')) return { id: nhan || id, loi: 'không mở ra' };
      const tieu = el.querySelectorAll('h3.bang-tieu');
      const h3   = el.querySelectorAll('h3');
      const x    = el.querySelectorAll('.close-x');
      const tabs = el.querySelectorAll('.bang-tabs');
      const t0   = tieu[0] ? getComputedStyle(tieu[0]) : null;
      return { id: nhan || id,
        tieu: tieu.length, h3: h3.length, x: x.length, tabs: tabs.length,
        // thanh khắc chìm nhận ra qua box-shadow inset do .panel h3.bang-tieu đặt
        khac: !!(t0 && t0.boxShadow.includes('inset')),
        // ✕ phải nằm TRONG khung và không bị tiêu đề đè
        xTrong: x[0] ? (() => { const a = x[0].getBoundingClientRect(), e = el.getBoundingClientRect();
                                return a.right <= e.right + 1 && a.top >= e.top - 1; })() : false };
    }, [id, `(${mo.toString()})()`, nhan]);
    bao.push(r);
    const ten = nhan || id;
    if (r.loi){ fail(`${ten}: ${r.loi}`); continue; }
    if (r.tieu !== 1) fail(`${ten}: có ${r.tieu} thanh tiêu đề .bang-tieu (phải đúng 1)`);
    if (r.h3 !== r.tieu) fail(`${ten}: còn ${r.h3 - r.tieu} thẻ <h3> không đi qua moBang()`);
    if (!r.khac) fail(`${ten}: tiêu đề không có thanh khắc chìm`);
    if (r.x !== 1) fail(`${ten}: có ${r.x} nút ✕ (phải đúng 1)`);
    else if (!r.xTrong) fail(`${ten}: nút ✕ tràn ra ngoài khung`);
  }
  console.log('khung:', JSON.stringify(bao));
  if (!bad) pass(`cả ${BANG.length} bảng dùng chung một khung`);

  // ── 3. Tab: cùng một lớp, cùng một chiều cao, không tràn khung ────────────
  const tab = await p.evaluate(() => {
    closePanels(); togglePanel('char');
    const el = document.getElementById('panel-char');
    const row = el.querySelector('.bang-tabs');
    if (!row) return { loi: 'bảng Nhân Vật không có hàng tab' };
    const ts = [...row.querySelectorAll('.bang-tab')].map(t => {
      const r = t.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y) };
    });
    const rr = row.getBoundingClientRect();
    return { so: ts.length, rong: Math.round(rr.width),
             cao: [...new Set(ts.map(t => t.h))],
             hang: [...new Set(ts.map(t => t.y))].length,
             tran: ts.filter(t => t.w > rr.width - 4).length,
             khac: row.querySelectorAll('button:not(.bang-tab)').length };
  });
  console.log('tab:', JSON.stringify(tab));
  if (tab.loi) fail(tab.loi);
  else {
    if (tab.khac) fail(`hàng tab lẫn ${tab.khac} nút không phải .bang-tab`);
    if (tab.cao.length !== 1) fail('tab cao thấp không đều: ' + tab.cao.join('/'));
    else pass(`${tab.so} tab cùng cao ${tab.cao[0]}px, ${tab.hang} hàng`);
    // Tab rộng gần bằng cả hàng = tab cuối bị flex-grow kéo dãn (lỗi cũ), trông như nút lạc.
    if (tab.tran) fail(`${tab.tran} tab bị kéo dãn chiếm trọn chiều ngang hàng`);
    else pass('không tab nào bị kéo dãn');
  }

  // ── 4. .danger chỉ dành cho nút PHÁ HUỶ ───────────────────────────────────
  const dg = await p.evaluate(() => {
    const ra = [];
    const tham = (id, mo) => {
      closePanels(); try { mo(); } catch(e){ return; }
      const el = document.getElementById(id); if (!el) return;
      // Chỉ soi NÚT: .chaos-warn.danger là một dòng cảnh báo trong Lò Hỗn Độn, cùng tên lớp
      // nhưng khác vai — nó không phải nút bấm nên không nằm trong luật này.
      for (const d of el.querySelectorAll('button.danger')) ra.push(d.textContent.trim().slice(0, 24));
    };
    tham('panel-char', () => togglePanel('char'));
    tham('panel-settings', () => togglePanel('settings'));
    // Kho Cốt: nút "Bỏ" (huỷ hẳn một mảnh Cốt) là nút .danger thứ hai và cũng là nút duy nhất
    // còn lại được phép mang lớp đó. Nó KHÔNG vẽ vào #panel-char mà vào #panel-quest — khung
    // phủ dùng chung; tìm nhầm chỗ thì bài kiểm xanh mà chẳng soi được gì.
    closePanels();
    let boCot = 0;
    try {
      // Phải SỞ HỮU một con Chimera thì chiO() mới trả về ô, và kho phải có mảnh thì nút "Bỏ"
      // mới được vẽ ra.
      if (!Object.keys(chiState().co).length) chiNhan(Object.keys(CHI_MAP)[0]);
      const id = Object.keys(chiState().co)[0];
      if (!cotKho().length) cotKho().push(cotMoi(COT_DONG_IDS[0], 'tinh'));
      window.moKhoCot(id);
      for (const d of document.querySelectorAll('#panel-quest button.danger')){
        boCot++; ra.push(d.textContent.trim().slice(0, 24));
      }
    } catch(e){ ra.push('LỖI mở Kho Cốt: ' + e.message); }
    return { ten: [...new Set(ra)], boCot };
    return [...new Set(ra)];
  });
  console.log('danger:', JSON.stringify(dg));
  const phaHuy = /^(bỏ|xoá|xóa|huỷ|đập)/i;
  const sai = dg.ten.filter(t => !phaHuy.test(t));
  if (sai.length) fail('lớp .danger nằm trên nút KHÔNG phá huỷ: ' + sai.join(' | '));
  else pass(`lớp .danger chỉ nằm trên ${dg.ten.length} loại nút phá huỷ: ${dg.ten.join(' · ')}`);
  // Cả hai nút phá huỷ phải THỰC SỰ tìm thấy — nếu không, phép kiểm trên chỉ xanh vì rỗng.
  if (!dg.boCot) fail('không thấy nút "Bỏ" nào trong Kho Cốt — phép kiểm .danger đang rỗng');
  // XÓA SAVE đã gỡ khỏi Cài Đặt: xoá nhân vật nay CHỈ làm được ở màn chờ, từng ô một. Chỗ nó
  // đứng giờ là đường đi RA màn chờ — không phá huỷ gì nên cũng không mang lớp .danger nữa.
  const set = await p.evaluate(() => {
    closePanels(); togglePanel('settings');
    const t = [...document.querySelectorAll('#panel-settings button')].map(x => x.textContent.trim());
    closePanels();
    return { coDuongRa: t.some(x => /chọn nhân vật/i.test(x)), conXoaSave: t.some(x => /xóa save/i.test(x)) };
  });
  if (!set.coDuongRa) fail('Cài Đặt không có đường ra màn chọn nhân vật');
  if (set.conXoaSave) fail('Cài Đặt vẫn còn nút XÓA SAVE — xoá nhân vật phải nằm ở màn chờ');

  // ── 5. Hai bộ chữ, và bộ thứ hai phải NẰM YÊN chỗ của nó ──────────────────
  // Mốc cũ là "đúng một Be Vietnam Pro". Nay có hai: Baloo 2 quay lại làm chữ hiển thị cho
  // RIÊNG mặt Khế Ước Chimera (token --font-chi), vì chữ hiển thị chính chủ của Axie là Lilita
  // One mà nó không có bộ dấu tiếng Việt — "Khế Ước" ra thành "Kh   c".
  //
  // Cái phải gác không còn là SỐ bộ chữ mà là PHẠM VI: Baloo 2 từng bị gỡ khỏi --font-display
  // vì chữ bo tròn kiểu hoạt hình trên khung thép đinh tán là hai ngôn ngữ hình ảnh chửi nhau.
  // Lý do đó vẫn đúng, nên bảng Nhân Vật (và mọi bảng khác) phải sạch bóng nó.
  const CHU_CHO = ['Be Vietnam Pro', 'Baloo 2'];
  const chu = await p.evaluate(() => {
    const ho = new Set();
    for (const f of document.fonts) ho.add(f.family.replace(/['"]/g, ''));
    closePanels(); togglePanel('char');
    const dung = new Set();
    for (const e of document.querySelectorAll('#panel-char *, #panel-char'))
      dung.add(getComputedStyle(e).fontFamily.split(',')[0].replace(/['"]/g, '').trim());
    return { tai: [...ho], dung: [...dung],
             display: getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim(),
             chi: getComputedStyle(document.documentElement).getPropertyValue('--font-chi').trim() };
  });
  console.log('chữ:', JSON.stringify(chu));
  const la0 = chu.tai.filter(f => !CHU_CHO.includes(f));
  if (la0.length) fail('có bộ chữ ngoài danh sách cho phép: ' + la0.join(', '));
  else pass('chỉ tải ' + CHU_CHO.join(' + '));
  const la = chu.dung.filter(f => f !== 'Be Vietnam Pro');
  if (la.length) fail('bảng Nhân Vật còn dùng bộ chữ khác: ' + la.join(', '));
  else pass('bảng Nhân Vật chỉ dùng một bộ chữ');
  if (/Baloo/.test(chu.display)) fail('--font-display lại trỏ vào Baloo 2 — nó chỉ được ở --font-chi');
  else pass('--font-display vẫn là Be Vietnam Pro');
  if (!/Baloo/.test(chu.chi)) fail('--font-chi không còn Baloo 2: ' + chu.chi);
  else pass('--font-chi giữ Baloo 2 cho mặt Khế Ước');

  // ── 6. Baloo 2 chỉ được gọi tên ở ĐÚNG HAI CHỖ ────────────────────────────
  // Phép kiểm ⑤ không bắt được chuyện này: nó đọc kiểu ĐÃ TÍNH của bảng đang mở, nên một chuỗi
  // `ctx.font = '700 20px "Baloo 2"'` nằm trong đường vẽ canvas của bảng khác thì vô hình.
  // Chỉ đếm chỗ ĐẶT TÊN BỘ CHỮ — tên nằm trong dấu nháy. Chú thích viết trần thì không tính.
  //
  // Cho phép: style.css có 6 khối @font-face (3 dải chữ × 2 nét) + 1 dòng --font-chi = 7;
  // game.js có đúng 1 hằng KU_CHU và 1 lần document.fonts.load() hâm nóng nó = 2.
  const TRAN_BALOO = { 'game.js': 2, 'style.css': 7, 'fonts.css': 0 };
  const src = await p.evaluate(async () => {
    const out = {};
    for (const f of ['game.js', 'style.css', 'fonts.css'])
      out[f] = ((await (await fetch(f)).text()).match(/['"]Baloo 2['"]/g) || []).length;
    return out;
  });
  console.log('gọi tên Baloo 2:', JSON.stringify(src), 'trần:', JSON.stringify(TRAN_BALOO));
  const sot = Object.entries(src).filter(([f, n]) => n > TRAN_BALOO[f]);
  if (sot.length) fail('Baloo 2 lan ra ngoài phạm vi cho phép: '
                       + sot.map(([f, n]) => `${f} ×${n} (trần ${TRAN_BALOO[f]})`).join(', '));
  else pass('Baloo 2 chỉ nằm trong @font-face, --font-chi và KU_CHU');

  await p.screenshot({ path: 'qa_shots/khung_bang.png' });
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
