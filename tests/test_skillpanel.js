// Bảng Kỹ Năng — MỘT trang, không tab.
//
// Bản trước của tệp này là một bài kiểm ZOMBIE: không một câu khẳng định nào, chỉ console.log và
// chụp màn, nên nó thoát 0 bất kể chuyện gì xảy ra. Nó soi tập tab TRẤN PHÁI / GIANG HỒ / DUNG
// HỢP cùng tên phái Thiếu Lâm · Võ Đang — tất cả đều đã bị gỡ từ đợt MU-hoá, nên mọi phép
// includes() của nó trả về false suốt một thời gian dài mà không ai biết. Một bài kiểm không
// khẳng định gì thì không phải bài kiểm; nay nó soi đúng cái bảng đang tồn tại.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { bad++; console.log('FAIL ' + m); };
const pass = m => console.log('PASS ' + m);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(800);

  // Mọi lớp phải ra một bảng đầy đủ — không lớp nào rơi vào trang trắng.
  // Năm lớp CHƠI ĐƯỢC. 'vophai' (Unclassed) là trạng thái chưa chọn lớp, không phải một lớp —
  // bảng của nó cố tình khác (chưa có bộ 4 chiêu), nên soi chung là bắt vạ oan.
  const LOP = ['thieulam', 'toanchan', 'baidasan', 'minhgiao', 'bug'];
  const ra = await p.evaluate(async (LOP) => {
    const out = [];
    for (const s of LOP){
      let lop = s;
      try { startGame(s, null); } catch(e){ out.push({ lop:s, loi:e.message }); continue; }
      lop = player.sect;
      player.level = 60; calcDerived();
      closePanels(); togglePanel('skill');
      const el = document.getElementById('panel-skill');
      const h = el.innerHTML, t = el.innerText || '';
      out.push({ lop,
        tab: el.querySelectorAll('.bang-tab').length,
        dai: h.length,
        dong: el.querySelectorAll('.skill-row').length,
        mucs: [...el.querySelectorAll('.stat-sec')].map(x => x.textContent.trim().split('—')[0].trim()),
        // Cả hai nửa của bảng cũ phải cùng có mặt trên MỘT trang
        coBonO: /1 chính · 1 phụ/.test(t),
        coDiSan: /DI SẢN LỚP/.test(t),
        coTanChuc: /HỆ TẤN CHỨC PHỤ/.test(t),
        // Tên lớp của CHÍNH mình phải xuất hiện. Tên lớp KHÁC chỉ được phép ở dòng ghi rõ
        // "Kế Thừa" — Spellblade là lớp lai, nó thừa hưởng chiêu của Dark Knight và Dark Wizard
        // (Fireball, Twisting Slash…) nên hiện tên hai lớp đó là ĐÚNG, không phải rò rỉ.
        tenMinh: t.includes(SECTS[lop].name),
        tenLopKhac: (() => {
          const xau = [];
          for (const k of Object.keys(SECTS)){
            if (k === lop || k === 'vophai') continue;
            const ten = SECTS[k].name;
            if (!t.includes(ten)) continue;
            // Mọi dòng nhắc tên lớp đó có ghi "Kế Thừa" không?
            const dong = [...el.querySelectorAll('.skill-row')].filter(d => d.textContent.includes(ten));
            if (!dong.length || !dong.every(d => /Kế Thừa/.test(d.textContent))) xau.push(ten);
          }
          return xau;
        })(),
      });
    }
    return out;
  }, LOP);

  for (const r of ra){
    if (r.loi){ fail(`${r.lop}: startGame ném lỗi — ${r.loi}`); continue; }
    console.log(`  ${r.lop}: ${r.dong} dòng chiêu · ${r.mucs.length} mục · ${r.dai} ký tự`);
    if (r.tab !== 0)        fail(`${r.lop}: bảng còn ${r.tab} tab — phải gộp về một trang`);
    if (r.dong < 6)         fail(`${r.lop}: chỉ ${r.dong} dòng chiêu, bảng gần như rỗng`);
    if (!r.coBonO)          fail(`${r.lop}: thiếu mục bốn ô chiêu`);
    if (!r.coDiSan)         fail(`${r.lop}: thiếu mục DI SẢN LỚP`);
    if (!r.coTanChuc)       fail(`${r.lop}: thiếu mục HỆ TẤN CHỨC PHỤ`);
    if (!r.tenMinh)         fail(`${r.lop}: bảng không nhắc tên lớp của chính mình`);
    if (r.tenLopKhac.length) fail(`${r.lop}: hiện chiêu lớp khác mà KHÔNG ghi "Kế Thừa" — ${r.tenLopKhac.join(', ')}`);
  }
  if (!bad) pass(`cả ${ra.length} lớp: một trang, không tab, đủ ba mục, không lẫn lớp khác`);

  // Mục bị động: hai nhóm KHÁC nhau nay nằm cạnh nhau, tiêu đề không được trùng
  const bd = ra[0] ? ra[0].mucs.filter(x => /^BỊ ĐỘNG/.test(x)) : [];
  if (bd.length === 2 && bd[0] === bd[1]) fail('hai mục bị động trùng tiêu đề: ' + bd[0]);
  else if (bd.length === 2) pass('hai mục bị động phân biệt được');

  console.log('lỗi trang:', JSON.stringify(errs.slice(0, 5)));
  if (errs.length) fail('bảng Kỹ Năng ném lỗi: ' + errs[0]);

  await p.screenshot({ path: 'qa_shots/skillpanel.png' });
  await b.close();
  console.log(bad ? `FAIL(${bad})` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
})();
