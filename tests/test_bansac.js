// A1 (vai trò theo BÃI) + A2 (bản sắc map) — xem docs/DE_XUAT_MAP.md.
//
// Bệnh đo được trước đợt này: vai trò gắn theo LOÀI, mà ba map cuối chỉ có 3 loài, nên
// Bird Tribe Heights và Dusk Marsh mỗi map đúng HAI vai — 'can' cộng Kẻ Tiếp Sức. Cả đoạn cấp
// 62-120 đánh y hệt nhau. Bài này chốt để nó không tụt lại.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

// Sàn vai trò theo dải cấp. CỐ Ý tăng dần: map đầu để người mới học, map sau phải dày hơn —
// đây chính là chiều đang bị đảo ngược.
const SAN_VAI = { daohoa:4, ngoai:4, chungnam:5, comoc:5, tuyettinh:5, mongco:5, nhanmon:5 };
// Từ map này trở đi phải có Pháp Sư và Kẻ Tiếp Sức: hai thứ AUTO xử lý dở nhất, cũng là lý do
// người chơi phải tự cầm chuột.
const CAN_PHAP = ['chungnam','comoc','tuyettinh','mongco','nhanmon'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(600);

  const r = await p.evaluate(() => {
    const o = {};
    for (const id of Object.keys(MAPS)){
      const md = MAPS[id];
      if (!md.packs || !md.packs.length) continue;
      curMap = id; buildWorld();
      const vai = {};
      let xa = 0, khongVai = 0;
      for (const m of mobs){
        if (m.role === undefined){ khongVai++; continue; }
        vai[m.role] = (vai[m.role] || 0) + 1;
        if (m.def.ranged) xa++;
      }
      const bs = mapBanSac(id);
      o[id] = { vai: Object.keys(vai).sort(), quaiXa: xa, khongVai,
                soBai: md.packs.length,
                bs: bs && { chuDao: bs.chuDao, ten: bs.tenChuDao, tyLe: bs.tyLe, he: bs.he, cot: bs.cot },
                html: banSacHtml(id) };
    }
    return o;
  });
  await b.close();

  let bad = 0;
  const fail = m => { bad++; console.log('FAIL ' + m); };
  const pass = m => console.log('PASS ' + m);
  const ids = Object.keys(r);

  console.log('vai theo map:');
  for (const id of ids) console.log(`  ${id.padEnd(11)} ${String(r[id].vai.length).padStart(2)} vai ${JSON.stringify(r[id].vai)} · ${String(r[id].quaiXa).padStart(3)} quái đánh xa`);

  // ── A1 ──
  for (const id of ids){
    const m = r[id];
    if (m.khongVai) fail(`${id}: ${m.khongVai} con không có vai — đếm ra khoá undefined thì số liệu không tin được`);
    const san = SAN_VAI[id];
    if (san == null) continue;
    if (m.vai.length < san) fail(`${id}: chỉ ${m.vai.length} vai (sàn ${san}) — ${JSON.stringify(m.vai)}`);
    if (CAN_PHAP.includes(id)){
      if (!m.vai.includes('phap')) fail(`${id}: không có bãi Pháp Sư — người chơi không phải đổi cách tiếp cận ở đâu cả`);
      if (!m.vai.includes('tiep')) fail(`${id}: không có Kẻ Tiếp Sức — không có mục tiêu ưu tiên nào để chọn`);
      if (!m.quaiXa) fail(`${id}: có vai đánh xa mà 0 con thật sự đánh xa — vai chỉ đổi con số, không đổi cách đánh`);
    }
  }
  if (!bad) pass(`mọi map đạt sàn vai · 5 map sau đều có Pháp Sư + Kẻ Tiếp Sức`);

  // ── A2 ──
  const cots = {}, chus = {};
  for (const id of ids){
    const bs = r[id].bs;
    if (!bs){ fail(`${id}: mapBanSac() trả null — map có bãi quái mà không có bản sắc`); continue; }
    if (!bs.chuDao) fail(`${id}: không tính được loài chủ đạo`);
    if (bs.tyLe < 20) fail(`${id}: loài chủ đạo chỉ ${bs.tyLe}% dân số — không đủ để gọi là chủ đạo`);
    if (!bs.he) fail(`${id}: không có hệ trội — khắc hệ đang chạy trong hurtMob mà người chơi không nhìn thấy ở đâu`);
    if (!bs.cot) fail(`${id}: không có Dòng Cốt độc quyền`);
    else { if (cots[bs.cot]) fail(`Cốt ${bs.cot} trùng ở ${cots[bs.cot]} và ${id} — độc quyền mà trùng thì không còn độc quyền`); cots[bs.cot] = id; }
    if (bs.chuDao) chus[bs.chuDao] = (chus[bs.chuDao] || 0) + 1;
    if (!/Đất của/.test(r[id].html)) fail(`${id}: bảng Bản Đồ không hiện dòng bản sắc`);
  }
  console.log('bản sắc:');
  for (const id of ids){ const bs = r[id].bs; if (bs) console.log(`  ${id.padEnd(11)} ${bs.ten} ${bs.tyLe}% · hệ ${bs.he} · Cốt ${bs.cot}`); }

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail(`${errs.length} lỗi JS`);
  if (!bad) console.log('PASS');
  else console.log('FAIL(' + bad + ')');
  process.exit(bad ? 1 : 0);
})();
