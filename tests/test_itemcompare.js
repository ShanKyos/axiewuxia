// So sánh trang bị (nửa còn lại của Loot 2.0) + các bẫy mà Khắc Ấn vừa tạo ra.
// Điều quan trọng nhất cần chứng minh: món YẾU HƠN nhưng mang Khắc Ấn chưa có thì hệ thống
// phải nhận ra — mũi ▲ thuần lực chiến sẽ nói ngược, và tự-mặc-đồ sẽ vứt nó đi.
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
    player.level = 90; vhAutoLearn(); calcDerived();
    const o = {};

    // Món thử nghiệm TẤT ĐỊNH cho ô 'non'.
    // (Không dùng genItem rồi ghi đè slot/rarity: genItem random cả ô lẫn dòng phụ, nên
    //  main.v vẫn tính theo ô CŨ — món "yếu" từng bị đúc thành vũ khí và hoá ra mạnh gấp 4.)
    let _tuid = 90000;
    const SUBK = ['atkPct','defPct','hpPct','crit'];
    const mk = (plus, rar, nSubs) => {
      const sl = SLOTS.find(s => s.id === 'non'), tier = 9;
      return {
        uid: ++_tuid, slot:'non', slotName:'Nón', name:`Nón thử ${rar}/+${plus}`,
        rarity: rar, level: 90, tier, perfect:false, luck:false, life:0, ancient:null, sigil:null,
        main: { k: sl.main, v: sl.base(tier, rar), name: mainName(sl.main) },
        element: 'Kim',
        subs: Array.from({ length: nSubs == null ? 2 : nSubs }, (_, i) =>
          ({ k: SUBK[i % 4], name: subName(SUBK[i % 4]), v: 5 + i, pct: true })),
        plus, awakened: AWAKENED[0],
      };
    };
    const reset = () => {
      player.inv = []; player.equip = {}; player.autoEquip = true; player.autoSell = false;
      calcDerived();
    };

    // ── 1. So sánh cơ bản: có nêu %, có liệt kê chênh lệch từng dòng ──
    reset();
    const strong = mk(9, 4), weak = mk(0, 1);
    player.equip.non = weak; calcDerived();
    const h1 = tipVerdict(strong);
    o.manhHon_noiDung = h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
    o.manhHon_baoMạnh = /▲ Mạnh hơn \d+%/.test(h1);
    o.manhHon_coDongChenh = /[+-]\d/.test(tipCard(strong, weak, ''));  // delta nay nằm trong thẻ, không ở dòng phán quyết

    player.equip.non = strong; calcDerived();
    const h2 = tipVerdict(weak);
    o.yeuHon_baoYeu = /▼ Yếu hơn \d+%/.test(h2);

    // ô trống
    reset();
    o.oTrong = /Ô đang trống/.test(tipVerdict(strong));

    // chưa đủ cấp
    reset(); player.level = 2; calcDerived();
    o.chuaDuCap = /Chưa đủ cấp/.test(tipVerdict(strong));
    player.level = 90; calcDerived();

    // (Mục 2→7 đo Khắc Ấn và bộ Cổ Thần — cắt cùng lúc với hai hệ đó.)

    // ── 8. Túi đồ vẽ được, có cả ▲ lẫn ◆ ──
    reset();
    player.equip.non = mk(5, 2); calcDerived();
    const up = mk(11, 4);                       // mạnh hơn → ▲
    player.inv.push(up);
    renderBag();
    const bagHtml = el('panel-bag').innerHTML;
    o.tuiDo_co_muiTen = bagHtml.includes('▲');

    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0;
  const need = (k, msg) => { if (!r[k]) { console.log('FAIL', msg || k); bad++; } };

  need('manhHon_baoMạnh', 'không báo "▲ Mạnh hơn N%"');
  need('manhHon_coDongChenh', 'không liệt kê chênh lệch từng dòng chỉ số');
  need('yeuHon_baoYeu', 'không báo "▼ Yếu hơn N%"');
  need('oTrong', 'không nhận ra ô trống');
  need('chuaDuCap', 'không cảnh báo chưa đủ cấp');



  need('tuiDo_co_muiTen', 'túi đồ không có ▲');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
