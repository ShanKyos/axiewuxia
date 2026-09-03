// NHẠC NỀN PHẢI CÓ Ở MỌI BẢN ĐỒ.
// Commit c8ac08f xoá 13 tệp nhạc với lý do "13 bản nhạc phim kiếm hiệp Hoa ngữ". Kiểm lại thì
// MƯỜI trong số đó là nhạc Axie Origins chính chủ, bị vơ nhầm — đối chiếu đường bao RMS với kho
// axieinfinity/axie-origins-asset-kit cho tương quan +1,000, lệch 0,00 giây. Game vì thế im
// lặng suốt trong lúc chơi. Bài này gác cho việc đó không lặp lại: mỗi map phải có nhạc, và
// mỗi tệp phải TẢI ĐƯỢC THẬT (khai tên trong BGM_TRACKS mà thiếu tệp thì im lặng y như cũ,
// vì _startTrack() nuốt lỗi phát).
const { chromium } = require('playwright');
const URL = 'http://localhost:8871/index.html?max=1';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(900);

  const out = await p.evaluate(async () => {
    const manCho = AudioSys.bgmName;
    window.TEST_MODE = true; startGame('thieulam', { name:'Nhạc' });
    applyTestBoost(); player.tutStep = -1;
    const theoMap = {};
    for (const m of Object.keys(MAPS)){ curMap = m; AudioSys.nhacMap(m); theoMap[m] = AudioSys.bgmName; }
    curMap = 'daohoa'; AudioSys.nhacMap('daohoa');
    const ten = [...new Set([...Object.values(BGM_TRACKS), BGM_INTRO, BGM_BOSS].filter(Boolean))];
    const thieuTep = [];
    for (const n of ten){
      const ok = await fetch('assets/music/' + n + '.mp3', { method:'HEAD' }).then(r => r.ok).catch(() => false);
      if (!ok) thieuTep.push(n);
    }
    return {
      manCho,
      soMap: Object.keys(MAPS).length,
      mapKhongNhac: Object.entries(theoMap).filter(([,v]) => !v).map(([k]) => k),
      soBanKhacNhau: new Set(Object.values(BGM_TRACKS)).size,
      nhacTrum: BGM_BOSS,
      thieuTep,
      hienNutNhac: !!document.getElementById('btn-music') &&
                   !document.getElementById('btn-music').classList.contains('hidden'),
    };
  });

  console.log(JSON.stringify(out, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (out.manCho !== 'bgm_intro') fail(`màn chờ không phát nhạc intro (${out.manCho})`);
  if (out.soMap < 10) fail(`chỉ thấy ${out.soMap} bản đồ — phép đo rỗng`);
  if (out.mapKhongNhac.length) fail(`bản đồ không có nhạc: ${out.mapKhongNhac.join(', ')}`);
  if (out.soBanKhacNhau < 8) fail(`chỉ ${out.soBanKhacNhau} bản nhạc khác nhau — cả thế giới nghe gần như một bài`);
  if (!out.nhacTrum) fail('trận trùm không có nhạc riêng — playBgm(BGM_BOSS) đang chạy rỗng');
  if (out.thieuTep.length) fail(`khai tên trong BGM_TRACKS mà THIẾU TỆP: ${out.thieuTep.join(', ')}`);
  if (!out.hienNutNhac) fail('có nhạc mà nút ♪ vẫn ẩn');
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
