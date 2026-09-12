// Đo NHỊP CẤP bằng chính vòng chơi của game, không bằng công thức chép tay.
//
// Cách đo: đặt player ở cấp L, mặc **trang bị đúng cấp** (sinh bằng `genItem` rồi `autoEquipBest`),
// bật AUTO, thả vào map đúng dải cấp của L rồi tick `update(1/60)` đủ số giây mô phỏng. XP thu
// được quy ra XP/giờ. Có XP/giờ ở mọi mốc thì "bao lâu lên cấp 60" là một phép tích phân.
//
// ⚠ KHÔNG đo tay không. `XP60PLUS_ANCHORS` ghi là đo "không trang bị" — đo lại kiểu đó thì từ
// cấp 10 trở lên người chơi CHẾT trước khi giết được con nào (atk 35 vs quái 1052 máu), tức
// mốc cũ không thể sinh ra từ phép đo mà nó tự mô tả.
//
// ⚠ Bình thuốc được mô phỏng bằng cách bơm máu khi tụt dưới 35%. Người chơi thật luôn có bình,
// và bình thì rẻ — để nhân vật chết trong lúc đo là đo cái khác, không phải đo nhịp cấp.
//
const { chromium } = require('playwright');
const fs = require('fs');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i+1] : d; };
const GIAY = +arg('--giay', 180);
const LAP  = +arg('--lap', 3);   // số lượt đo mỗi mốc — trang bị bốc ngẫu nhiên nên một lượt là tiếng ồn, không phải số đo
const RA   = arg('--json', null);
const MOC  = (arg('--moc','') || '1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,80,90,100,110,119').split(',').map(Number);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate(async ({ MOC, GIAY, LAP }) => {
    window.TEST_MODE = true; startGame('thieulam', null);
    // Map nào hợp cấp nào — lấy map có dải cấp phủ L, ưu tiên map chính tuyến cấp cao nhất còn hợp.
    const FIELD = ['corran','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon'];
    function mapCho(L){
      let best = FIELD[0];
      for (const k of FIELD){ const m = MAPS[k]; if ((m.min || 1) <= L) best = k; }
      return best;
    }
    const XPT = XP_TABLE;
    // ⚠ GIỮ CẤP ĐỨNG YÊN TRONG LÚC ĐO. Để nhân vật lên cấp giữa cửa sổ đo thì con số trả về là
    // "XP/giờ trung bình của quãng L→L+4", không phải "XP/giờ tại cấp L" — và vì mỗi cấp lại
    // mạnh thêm nên nó luôn thổi phồng. Bản đầu đo kiểu đó ra chênh 57× giữa cấp 35 và cấp 40,
    // nhìn như một cái hố trong thiết kế trong khi phần lớn là lỗi phép đo.
    // Chép đúng phép nhân của `gainXp` (đêm ×1,1 · ×1,5 · +EXP%) rồi CỘNG VÀO SỔ RIÊNG.
    let thuXp = 0;
    window.gainXp = function(a){
      let v = a; if (typeof isNightGame === 'function' && isNightGame()) v *= 1.1;
      thuXp += Math.round(v * 1.5 * (1 + (player.expPct || 0)/100));
    };
    // bình thuốc: người chơi thật không đứng chịu chết
    let soChet = 0, soTick = 0, soGan = 0;
    const binh = () => {
      soTick++;
      if (player.dead || dead){ soChet++; player.dead = false; dead = false; player.hp = player.maxHp; }
      else if (player.hp < player.maxHp*0.55) player.hp = player.maxHp;   // ngưỡng 0,35 vẫn để lọt
      player.auto = true;                                                 // AUTO phải bật LẠI mỗi tick:
      if (mobs.some(m => !m.dead && dist(player.x,player.y,m.x,m.y) < 220)) soGan++;  // travelTo tắt nó
    };
    const out = [];
    for (const L of MOC){
     const mau = [];
     for (let rep = 0; rep < LAP; rep++){
      player.level = L; player.lvPeak = L;
      player.xp = 0; player.free = 0;
      for (const s in player.equip) player.equip[s] = null;
      player.inv.length = 0;
      // trang bị đúng cấp: bốc 6 lượt mỗi ô rồi để chính game chọn bộ tốt nhất
      for (let i=0;i<48;i++){ const it = genItem(L, 0, 'mob'); if (it) bagThem(it); }
      autoEquipBest();
      if (typeof vhAutoLearn === 'function') vhAutoLearn();
      calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      const mid = mapCho(L);
      travelTo(mid);
      if (!player.auto) toggleAuto();
      // bỏ 15 giây đầu (đi tới bãi) rồi mới đo — 5 giây không đủ cho map rộng
      for (let i=0;i<900;i++){ update(1/60); binh(); }
      thuXp = 0; soChet = 0; soTick = 0; soGan = 0;
      for (let i=0;i<60*GIAY;i++){ update(1/60); binh(); }
      const tong = thuXp;
      mau.push({ xpGio: tong * 3600 / GIAY, atk: player.atk, hp: player.maxHp, map: mid,
                 chet: soChet, gan: Math.round(soGan*100/Math.max(1,soTick)) });
     }
     mau.sort((a,b)=>a.xpGio-b.xpGio);
     const giua = mau[Math.floor(mau.length/2)];        // TRUNG VỊ, không phải trung bình: một lượt
     out.push({ lv:L, map:giua.map, chet:giua.chet, gan:giua.gan,                      // bốc trúng bộ đồ rác kéo trung bình lệch hẳn
                xpGio: Math.round(giua.xpGio),
                dai: [Math.round(mau[0].xpGio), Math.round(mau[mau.length-1].xpGio)],
                atk: Math.round(giua.atk), hp: Math.round(giua.hp) });
    }
    return { out, XPT: Array.from(XPT) };
  }, { MOC, GIAY, LAP });

  await b.close();
  if (errs.length) console.log('LỖI TRANG:', errs.slice(0,3).join(' | '));

  const { out, XPT } = r;
  // nội suy XP/giờ cho mọi cấp
  const rate = (L) => {
    if (L <= out[0].lv) return out[0].xpGio;
    for (let i=0;i<out.length-1;i++){
      const a = out[i], c = out[i+1];
      if (L >= a.lv && L <= c.lv) return a.xpGio + (c.xpGio - a.xpGio) * (L - a.lv) / (c.lv - a.lv);
    }
    return out[out.length-1].xpGio;
  };
  console.log(`đo ${GIAY}s mô phỏng × ${LAP} lượt mỗi mốc (lấy trung vị) · trang bị đúng cấp · AUTO\n`);
  console.log('cấp   map            XP/giờ (trung vị)   dải thấp→cao        công   chết  %gần   XP cần     giờ/cấp');
  let gioToi60 = 0, gioToi120 = 0;
  const bang = [];
  for (let L = 1; L < 120; L++){
    const g = XPT[L-1] / rate(L);
    if (L < 60) gioToi60 += g;
    gioToi120 += g;
    bang.push({ lv:L, xpGio: Math.round(rate(L)), can: XPT[L-1], gio: g });
  }
  for (const m of out){
    const row = bang[m.lv-1];
    console.log(`${String(m.lv).padStart(3)}   ${m.map.padEnd(12)} ${String(m.xpGio).padStart(17)}   ${(m.dai[0]+'→'+m.dai[1]).padStart(19)}  ${String(m.atk).padStart(6)} ${String(m.chet).padStart(5)} ${String(m.gan+'%').padStart(5)}  ${String(row.can).padStart(9)}   ${row.gio.toFixed(2)}`);
  }
  console.log(`\nGIỜ ĐỂ LÊN CẤP 60  = ${gioToi60.toFixed(2)} giờ`);
  console.log(`GIỜ ĐỂ LÊN CẤP 120 = ${gioToi120.toFixed(2)} giờ`);
  // mốc chặng
  for (const c of [10,20,30,40,50,60]){
    let s=0; for (let L=1;L<c;L++) s += bang[L-1].gio;
    console.log(`   tới ${String(c).padStart(3)}: ${s.toFixed(2)} giờ`);
  }
  if (RA) { fs.writeFileSync(RA, JSON.stringify({ moc: out, bang, gioToi60, gioToi120 }, null, 1)); console.log(`\n→ ${RA}`); }
})();
