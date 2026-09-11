// MỤC TIÊU HÔM NAY — tầng NGÀY phải LỚN THEO CẤP, và mỗi mục phải có đường về đích.
//
// ⚠ Vì sao bài này tồn tại. Bản cũ là ba mục CỐ ĐỊNH với `minLv` 1/5/12, nghĩa là từ cấp 12 tới
// 120 — **108 cấp** — bảng hiện đúng ba dòng đó, cùng con số đó. Đo cùng lúc với chuỗi nhiệm vụ:
// nhiệm vụ chỉ cho 1% tổng XP lên cấp (99% là cày), nên tầng NGÀY là thứ DUY NHẤT chạm vào mọi
// ngày chơi ở 70 cấp cuối — và nó đứng yên.
//
// Bốn nhóm:
//  1. dải cấp phải TĂNG DẦN, không dải nào tụt, và mọi khoá phải có mô tả trong DAILY_META
//  2. MỖI MỤC PHẢI CÓ MỘT `dailyTrack()` THẬT — lái từng mục tới đích bằng chính hàm của game.
//     Đây là chốt đáng nhất: thiếu một chỗ móc thì mục đó đứng 0 vĩnh viễn, và vì phần thưởng
//     đòi xong HẾT nên nó khoá luôn thưởng ngày — im lặng, không lỗi nào trên console.
//  3. qua ngày mới phải dọn sạch, và save cũ (thiếu khoá mới) phải được vá
//  4. thưởng phải lớn theo dải — cày 60 con ở cấp 100 mà lấy đúng 300 Lumen như hồi cấp 5 thì
//     mục tiêu ngày là một cái bẫy thời gian
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

  // ── 1. dải cấp ─────────────────────────────────────────────────────────────
  const r1 = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const dai = DAILY_BANDS.map(b => ({ max:b.max, muc:b.muc, thuong:b.thuong,
                                        n:Object.keys(b.muc).length,
                                        tong:Object.values(b.muc).reduce((a,c)=>a+c,0) }));
    const laKhoa = [...new Set(DAILY_BANDS.flatMap(b => Object.keys(b.muc)))]
                     .filter(k => !DAILY_META[k]);
    // bảng ở mỗi mốc cấp
    const theoCap = [1, 12, 30, 50, 70, 90, 120].map(lv => {
      player.lvPeak = lv;
      const g = dailyGoalsNow();
      return { lv, n:g.length, ten:g.map(x => x.name) };
    });
    return { dai, laKhoa, theoCap };
  });
  console.log('1) dải:', JSON.stringify(r1.dai.map(d => `≤${d.max}: ${d.n} mục / tổng ${d.tong} · thưởng ×${d.thuong}`), null, 0));
  if (r1.laKhoa.length) fail(`khoá không có mô tả trong DAILY_META: ${r1.laKhoa.join(', ')}`);
  else pass('mọi khoá trong DAILY_BANDS đều có mô tả (icon + tên)');
  const tut = [];
  for (let i = 1; i < r1.dai.length; i++){
    if (r1.dai[i].n < r1.dai[i-1].n) tut.push(`số mục ≤${r1.dai[i].max}`);
    if (r1.dai[i].tong <= r1.dai[i-1].tong) tut.push(`tổng lượng ≤${r1.dai[i].max}`);
    if (r1.dai[i].thuong <= r1.dai[i-1].thuong) tut.push(`thưởng ≤${r1.dai[i].max}`);
  }
  tut.length ? fail(`dải TỤT thay vì tăng: ${tut.join(' · ')}`)
             : pass(`${r1.dai.length} dải tăng đều: ${r1.dai[0].n}→${r1.dai[r1.dai.length-1].n} mục · thưởng ×${r1.dai[0].thuong}→×${r1.dai[r1.dai.length-1].thuong}`);
  const dungYen = r1.theoCap.filter((x,i) => i && x.ten.join('|') === r1.theoCap[i-1].ten.join('|'));
  console.log('   theo cấp:', JSON.stringify(r1.theoCap.map(x => x.lv + '→' + x.n + ' mục')));
  dungYen.length >= 3 ? fail('bảng gần như đứng yên qua các mốc cấp — đúng cái lỗi bản cũ')
                      : pass('bảng đổi theo cấp, không đóng băng');

  // ── 2. MỖI MỤC PHẢI CÓ ĐƯỜNG VỀ ĐÍCH ───────────────────────────────────────
  //     Gọi dailyTrack đúng khoá mà bảng khai, rồi xem nó có tới `need` không.
  const r2 = await p.evaluate(() => {
    startGame('thieulam', null);
    player.lvPeak = 120; player.level = 120; calcDerived();
    dailyReset();
    const out = [];
    for (const g of dailyGoalsNow()){
      player.daily[g.id] = 0;
      for (let i = 0; i < g.need; i++) dailyTrack(g.id);
      out.push({ id:g.id, need:g.need, dat:player.daily[g.id] });
    }
    return { out, thuong:player.daily.claimed };
  });
  console.log('2)', JSON.stringify(r2.out));
  const hong = r2.out.filter(x => x.dat < x.need);
  hong.length ? fail(`mục tiêu không tới đích: ${hong.map(x => `${x.id} ${x.dat}/${x.need}`).join(' · ')}`)
              : pass(`cả ${r2.out.length} mục tiêu đếm được tới đích`);
  r2.thuong ? pass('xong hết thì thưởng ngày tự nhận')
            : fail('xong hết mọi mục mà thưởng ngày KHÔNG nhận — dailyCheckReward không chạy');

  // ── 2b. và chỗ móc phải nằm trong HÀM THẬT của game, không chỉ là dailyTrack ─
  const r2b = await p.evaluate(() => {
    startGame('thieulam', null);
    player.lvPeak = 120; player.level = 120; calcDerived();
    dailyReset();
    const truoc = { via:player.daily.via, truyna:player.daily.truyna, forge:player.daily.forge };
    // Vỉa Cốt: đứng đúng chỗ vỉa hôm nay rồi khai
    const v = viaHomNay().find(x => x);
    if (v){ travelTo(v.map); if (player.via) delete player.via[v.map];
      viaThemPickup(); player.x = v.x + 10; player.y = v.y; viaKhai(); }
    // Truy Nã: nhận → hạ → lĩnh thưởng
    player.truyna = { day:new Date().toDateString(), state:'killed', map:curMap };
    window.truynaClaim();
    return { truoc, sau:{ via:player.daily.via, truyna:player.daily.truyna },
             coVia: !!v };
  });
  console.log('2b)', JSON.stringify(r2b));
  if (!r2b.coVia) fail('không bốc được vỉa nào để thử — dựng cảnh hỏng');
  else if (!(r2b.sau.via > r2b.truoc.via)) fail('`viaKhai()` KHÔNG gọi dailyTrack(\'via\') — mục tiêu Vỉa Cốt đứng 0 vĩnh viễn');
  else pass('khai Vỉa Cốt thật → mục tiêu ngày nhích');
  (r2b.sau.truyna > r2b.truoc.truyna)
    ? pass('lĩnh Truy Nã Lệnh thật → mục tiêu ngày nhích')
    : fail('`truynaClaim()` KHÔNG gọi dailyTrack(\'truyna\') — mục tiêu Truy Nã đứng 0 vĩnh viễn');

  // ── 3. qua ngày + save cũ ──────────────────────────────────────────────────
  const r3 = await p.evaluate(() => {
    startGame('thieulam', null); player.lvPeak = 120;
    dailyReset(); for (const g of dailyGoalsNow()) player.daily[g.id] = g.need;
    player.daily.claimed = true;
    player.daily.day = 'Hôm Qua';                     // giả lập qua ngày
    dailyReset();
    const sauNgay = { ...player.daily };
    // save đời cũ: chỉ có ba khoá, thiếu via/truyna
    player.daily = { day:new Date().toDateString(), kills:3, dungeon:0, forge:0, claimed:false };
    dailyReset();
    const vaCu = { ...player.daily };
    return { sauNgay, vaCu, khoa:Object.keys(DAILY_META) };
  });
  console.log('3)', JSON.stringify(r3));
  const conSot = r3.khoa.filter(k => (r3.sauNgay[k] || 0) !== 0);
  if (conSot.length || r3.sauNgay.claimed) fail(`qua ngày mới mà chưa dọn: ${conSot.join(',')}${r3.sauNgay.claimed?' + claimed':''}`);
  else pass('qua ngày mới: mọi bộ đếm về 0 và thưởng mở lại');
  const thieuNgan = r3.khoa.filter(k => r3.vaCu[k] == null);
  thieuNgan.length ? fail(`save cũ không được vá ngăn mới: ${thieuNgan.join(', ')} — mục đó đứng 0 mãi`)
                   : pass('save cũ (thiếu khoá mới) được vá đủ ngăn, và GIỮ tiến độ đang có (kills=' + r3.vaCu.kills + ')');

  // ── 4. thưởng lớn theo dải ─────────────────────────────────────────────────
  const r4 = await p.evaluate(() => {
    const ra = [];
    for (const lv of [5, 30, 70, 120]){
      startGame('thieulam', null); player.lvPeak = lv; player.level = Math.min(lv, 120);
      calcDerived(); dailyReset();
      const b0 = player.silver, k0 = player.khi, s0 = player.shard;
      for (const g of dailyGoalsNow()){ player.daily[g.id] = 0; for (let i = 0; i < g.need; i++) dailyTrack(g.id); }
      ra.push({ lv, bac:player.silver - b0, ban:Math.round(player.khi - k0), shard:player.shard - s0 });
    }
    return ra;
  });
  console.log('4)', JSON.stringify(r4));
  const tutThuong = r4.filter((x,i) => i && x.bac <= r4[i-1].bac);
  tutThuong.length ? fail(`thưởng ngày không lớn theo cấp: ${JSON.stringify(r4.map(x=>x.lv+'→'+x.bac))}`)
                   : pass(`thưởng Lumen lớn theo dải: ${r4.map(x => x.lv + '→' + x.bac.toLocaleString('vi-VN')).join(' · ')}`);

  console.log('errors:', JSON.stringify(errs.slice(0, 8)));
  if (errs.length) fail(`${errs.length} lỗi JS trong lúc chạy`);
  console.log(bad ? `\nđỏ: ${bad}` : '\nTẤT CẢ XANH');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
