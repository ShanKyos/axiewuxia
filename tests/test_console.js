// Console playtest phải khớp với build hiện tại.
//
// Console là công cụ test — nó không đi cùng bản online. Nhưng chính vì thế nó âm thầm trôi khỏi
// build: không bài nào chạy nó, không người chơi nào báo lỗi. Bản cũ quảng cáo "34 kỹ năng + 30
// dung hợp" trong khi VOHOC_DEFS còn 27 và FUSION_DEFS đã rỗng; liệt kê 8 map trong khi /map nhận
// 15. (Mục gác tên hệ Thuần Thục đã bỏ cùng hệ đó.
// Stoneform; và bốn hệ tiền tệ mới thì không có lệnh nào chạm tới.
//
// Bài này gác ba thứ:
//   1. MỌI lệnh trong /help phải chạy được — không ném, không trả "Lệnh lạ".
//   2. /help sinh ra từ dữ liệu thật, nên số liệu trong đó phải khớp với bảng thật.
//   3. Các lệnh mới phải đổi đúng trạng thái, không chỉ in ra chữ.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?test=1&max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // 1) mọi lệnh nêu trong /help đều chạy được
  const r1 = await p.evaluate(() => {
    const run = (c) => {
      const lg = document.getElementById('cheat-log'); lg.innerHTML = '';
      try { cheatExec(c); } catch (e){ return 'NÉM: ' + e.message; }
      return [...lg.children].map(d => d.textContent).join(' | ');
    };
    // rút tên lệnh thẳng từ /help — bài này không chép tay danh sách, /help đổi thì bài đổi theo
    const ten = new Set();
    for (const line of cheatHelp()){
      // dấu / phải đứng đầu dòng hoặc sau khoảng trắng — nếu không thì "bật/tắt" cũng thành lệnh
      for (const m of line.matchAll(/(?:^|\s)\/([a-z]+)/g)) ten.add(m[1]);
    }
    const mauTest = { lv:'60', map:'daohoa', go:'1000 1000', realm:'5', th:'amkhi 5', tier:'3',
      seal:'3', speed:'2', bikip:'9', time:'5', item:'4 9', silver:'5000', khi:'5000', mat:'99',
      dan:'99', manh:'99', tich:'99', an:'99', cothan:'99', jewel:'9', gem:'9', hap:'9',
      gen:'1 +11', slot:'4 dk_ragefulblow', evo:'dk_ragefulblow 1 power', kill:'100' };
    const out = {};
    for (const t of ten){
      if (t === 'wipe') continue;            // nạp lại trang giữa bài thì mất phiên
      out[t] = run('/' + t + (mauTest[t] ? ' ' + mauTest[t] : ''));
    }
    return out;
  });
  console.log('1) chạy mọi lệnh trong /help:');
  for (const k in r1){
    const v = r1[k];
    const hong = v.startsWith('NÉM:') || v.includes('Lỗi:') || v.includes('Lệnh lạ');
    console.log(`   /${k.padEnd(10)} ${hong ? '✗' : '·'} ${v.slice(0, 96)}`);
    if (hong) fail(`/${k} không chạy được: ${v}`);
  }

  // 2) /help sinh ra từ dữ liệu thật — số liệu phải khớp bảng thật
  const r2 = await p.evaluate(() => {
    const h = cheatHelp().join('\n');
    const soChieu = (h.match(/học hết (\d+) kỹ năng/) || [])[1];
    return {
      soChieuTrongHelp: soChieu && +soChieu, soChieuThat: Object.keys(VOHOC_DEFS).length,
      mapThieu: Object.keys(MAPS).filter(k => !h.includes(k)),
      evoThieu: Object.keys(EVO_PATHS).filter(k => !h.includes(EVO_PATHS[k].name)),
      dungHop: /dung hợp/.test(h), phiThang: /\/phi\b/.test(h),
    };
  });
  console.log('2) /help so với bảng thật:', JSON.stringify(r2));
  if (r2.soChieuTrongHelp !== r2.soChieuThat) fail(`/help nói ${r2.soChieuTrongHelp} kỹ năng, thật ${r2.soChieuThat}`);
  if (r2.mapThieu.length) fail('/help thiếu map: ' + r2.mapThieu.join(', '));
  if (r2.evoThieu.length) fail('/help thiếu nhánh tiến hóa: ' + r2.evoThieu.join(', '));
  if (r2.dungHop) fail('/help vẫn quảng cáo "dung hợp" — FUSION_DEFS đã rỗng');
  if (r2.phiThang) fail('/phi vẫn còn — "phi thăng" là từ vựng bị cấm');

  // 3) lệnh mới phải đổi ĐÚNG trạng thái, không chỉ in chữ
  const r3 = await p.evaluate(() => {
    player.jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
    player.gems = { tuLa:0, honNguyen:0 }; player.baohap = {}; player.skillEvo = {};
    cheatExec('/jewel 5'); cheatExec('/gem 4'); cheatExec('/hap 2');
    cheatExec('/slot 3 dk_ragefulblow');
    cheatExec('/evo dk_ragefulblow 2 spread');
    return { chau: player.jewels.honDon, ngoc: player.gems.tuLa,
             hap: player.baohap[1], hapCuoi: player.baohap[BAOHAP_TIERS.length - 1],
             o3: player.skillBar[2],
             evo: (player.skillEvo.dk_ragefulblow || [])[1], evoLv: skLv('dk_ragefulblow') };
  });
  console.log('3) lệnh mới đổi trạng thái:', JSON.stringify(r3));
  // (/nd đã gỡ cùng hệ Lõi Nguyên Tố — xem migrateBoLoi.)
  if (r3.chau !== 5) fail(`/jewel 5 → Hỗn Độn Châu ${r3.chau}`);
  if (r3.ngoc !== 4) fail(`/gem 4 → Tử La ${r3.ngoc}`);
  if (r3.hap !== 2 || r3.hapCuoi !== 2) fail(`/hap 2 không phủ hết tầng: ${r3.hap}..${r3.hapCuoi}`);
  if (r3.o3 !== 'dk_ragefulblow') fail(`/slot 3 → ô 3 là ${r3.o3}`);
  if (r3.evo !== 'spread') fail(`/evo bậc 2 → ${r3.evo}`);
  if (r3.evoLv < 80) fail(`/evo bậc 2 phải kéo cấp chiêu lên ≥80, đang ${r3.evoLv}`);

  // 4) lệnh không tồn tại vẫn phải báo tử tế, không ném
  const r4 = await p.evaluate(() => {
    const lg = document.getElementById('cheat-log'); lg.innerHTML = '';
    try { cheatExec('/khongcolenhnay'); } catch (e){ return 'NÉM: ' + e.message; }
    return lg.textContent;
  });
  console.log('4) lệnh lạ:', r4);
  if (r4.startsWith('NÉM:')) fail('lệnh lạ làm console ném lỗi');

  await p.waitForTimeout(500);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
