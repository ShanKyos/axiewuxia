#!/usr/bin/env node
// Đo thành Ardhaven — khổ, đất chết, vòng tiếp tế, bán kính dịch vụ, và kiểm hình học
// của lõi đề xuất. Đọc THẲNG public/game/data/canbang.js nên số luôn khớp game đang chạy.
//
//   node tools/do_thanh.js            — đo hiện trạng
//   node tools/do_thanh.js --dexuat   — đo thêm lõi đề xuất (docs/THIET_KE_THI_TRAN.md §4)
//
// ⚠ ĐỪNG chép cứng số nào từ đây sang tài liệu mà không ghi rõ là số đo. Mọi con số về
// Ardhaven trong docs/THIET_KE_THI_TRAN.md đều sinh ra từ tệp này.

const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {};
eval(fs.readFileSync(path.join(ROOT, 'public/game/data/canbang.js'), 'utf8'));

const M = window.MAPS.ardhaven;
const NP = window.NPCS.filter(n => n.map === 'ardhaven');
const W = M.w, H = M.h, POLY = M.diTrong;
const G = 24;            // ô lưới tìm đường, đúng bằng lưới của test_domap
const SPEED = 209;       // tốc độ nền người chơi, px/giây
const MAN = [1920, 1080];
const HOANG = 2600 * 1900;   // một map hoang dã, để lấy mốc so

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const giay = px => (px / SPEED).toFixed(1);
function trong(x, y, p){
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++){
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const H1 = s => console.log('\n\x1b[1m' + s + '\x1b[0m');

// ── 1. KHỔ ────────────────────────────────────────────────────────────────
H1('1 · KHỔ');
let tot = 0, di = 0;
for (let y = G/2; y < H; y += G) for (let x = G/2; x < W; x += G){ tot++; if (trong(x, y, POLY)) di++; }
console.log(`  khung        ${W}×${H} = ${(W*H/1e6).toFixed(2)} Mpx  (${(W*H/HOANG).toFixed(2)}× một map hoang dã)`);
console.log(`  đi được      ${(100*di/tot).toFixed(1)}%  = ${di} ô ${G}px`);
for (const [ten, z] of [['GẦN', 1.75], ['VỪA', 1.45], ['XA', 1.0]])
  console.log(`  zoom ${ten.padEnd(4)}    ${(W*H/((MAN[0]/z)*(MAN[1]/z))).toFixed(1)} màn hình`);

// ── 2. RUỘT RỖNG ──────────────────────────────────────────────────────────
// 16 khối nhà nằm hết ở hai hàng sát tường; dải giữa không có công trình nào.
H1('2 · DẢI GIỮA');
const O = (window.MAP_OBSTACLES || {}).ardhaven || [];
const hang = [...new Set(O.filter(o => o.wd).map(o => o.y))].sort((a, b) => a - b);
if (hang.length >= 2){
  const tren = Math.max(...O.filter(o => o.y === hang[0]).map(o => o.y + o.ht));
  const duoi = hang[hang.length - 1];
  console.log(`  ${O.length} khối ở ${hang.length} hàng: y ${hang.join(' và ')}`);
  console.log(`  dải giữa     y ${tren} → ${duoi} = ${W}×${duoi - tren} = ${(W*(duoi-tren)/1e6).toFixed(2)} Mpx`);
  console.log(`               = ${(W*(duoi-tren)/HOANG).toFixed(2)}× một map hoang dã · ${(W*(duoi-tren)/(MAN[0]*MAN[1])).toFixed(1)} khung hình`);
}

// ── 3. ĐẤT CHẾT ───────────────────────────────────────────────────────────
H1('3 · ĐẤT CHẾT — ô đi được cách MỌI điểm nội dung');
const CONG = [{x:3200,y:290},{x:3200,y:2910},{x:480,y:1600},{x:5920,y:1600},{x:2820,y:2500}];
const diem = [...NP.map(n => ({x:n.x, y:n.y})), ...CONG];
const nguong = [400, 700, 1000], dem = nguong.map(() => 0);
let ndi = 0;
for (let y = G/2; y < H; y += G) for (let x = G/2; x < W; x += G){
  if (!trong(x, y, POLY)) continue; ndi++;
  let m = Infinity; for (const p of diem){ const t = Math.hypot(p.x-x, p.y-y); if (t < m) m = t; }
  nguong.forEach((n, i) => { if (m > n) dem[i]++; });
}
nguong.forEach((n, i) => console.log(`  > ${String(n).padStart(4)}px (${giay(n)}s)   ${(100*dem[i]/ndi).toFixed(1)}%`));

// ── 4. BÁN KÍNH DỊCH VỤ ───────────────────────────────────────────────────
H1('4 · BÁN KÍNH TỪ ĐIỂM THẢ');
const VAI = { forge:'Lò Rèn', shop:'Tiệm', stable:'Chuồng', trunya:'Truy Nã', vanduyen:'Cầu May', tenui:'Vực' };
const svc = NP.filter(n => VAI[n.talk]).map(n => ({ n, d: d(M.spawn, n) })).sort((a, b) => a.d - b.d);
for (const s of svc)
  console.log(`  ${String(Math.round(s.d)).padStart(5)}px  ${String(giay(s.d)).padStart(5)}s  ${VAI[s.n.talk].padEnd(8)} ${s.n.name}`);
console.log(`  ── ${NP.length} NPC, trong đó ${svc.length} có chức năng, ${NP.length - svc.length} chỉ lore`);
const khung = NP.filter(n => Math.abs(n.x - M.spawn.x) < MAN[0]/2 && Math.abs(n.y - M.spawn.y) < MAN[1]/2);
console.log(`  ── lọt trong MỘT khung hình quanh điểm thả: ${khung.length}/${NP.length}`);

// ── 5. VÒNG TIẾP TẾ ───────────────────────────────────────────────────────
// Chuyến người chơi lặp nhiều nhất: về qua cổng, mua bán sửa đồ, ra lại cùng cổng đó.
function vong(ten, cho){
  let t = 0; const ch = [];
  for (let i = 0; i < cho.length - 1; i++){ const s = d(cho[i], cho[i+1]); t += s; ch.push(Math.round(s)); }
  console.log(`  ${ten}\n    ${ch.join(' + ')} = ${Math.round(t)}px = ${giay(t)}s`);
  return t;
}
H1('5 · VÒNG TIẾP TẾ (cổng Nam → mua bán → cổng Nam)');
const veNam = { x:3200, y:3080 };                     // spawnFrom.ngoai
const by = id => NP.find(n => n.id === id);
const nay = vong('nay:', [veNam, by('duoclao'), by('thoren'), by('binhkhi'), veNam]);
const tiem = ['duoclao','thoren','binhkhi'].map(by);
const trai = Math.max(...tiem.map(t => t.x)) - Math.min(...tiem.map(t => t.x));
console.log(`  ba tiệm trải ${trai}px = ${(trai/MAN[0]).toFixed(1)}× khung hình ⇒ ${trai < MAN[0] ? 'lọt' : 'KHÔNG lọt'} một màn hình`);

// ── 6. CỔNG ───────────────────────────────────────────────────────────────
H1('6 · BỐN CỔNG — khoảng cách vs cấp tối thiểu của map sau nó');
for (const [ten, to, x, y] of [['Nam','ngoai',3200,2910], ['Bắc','tuyettinh',3200,290],
                               ['Tây','corran',480,1600], ['Đông','chungnam',5920,1600]]){
  const md = window.MAPS[to], s = d(M.spawn, {x, y});
  console.log(`  ${ten.padEnd(4)} ${String(Math.round(s)).padStart(5)}px ${String(giay(s)).padStart(5)}s → ${(md.name||to).padEnd(20)} cấp ${md.min}`);
}

// ── 7. LÕI ĐỀ XUẤT ────────────────────────────────────────────────────────
if (process.argv.includes('--dexuat')){
  H1('7 · LÕI ĐỀ XUẤT (docs/THIET_KE_THI_TRAN.md §4.1)');
  const sp = { x:3200, y:1800 };
  const loi = [['duoclao',2480,1510], ['trachu',2740,1510], ['thoren',3660,1510], ['binhkhi',3920,1510]];
  const khoi = [[2380,1100,'A · Phố Chợ'], [3560,1100,'B · Phố Lò']];
  let xau = 0;
  for (const [id, x, y] of loi){
    const ok = trong(x, y, POLY), s = d(sp, {x, y});
    if (!ok) xau++;
    console.log(`  ${id.padEnd(9)} (${x},${y})  đa giác ${ok ? '✔' : '✘'}  ${String(Math.round(s)).padStart(4)}px ${giay(s)}s`);
  }
  const xs = loi.map(l => l[1]), tr = Math.max(...xs) - Math.min(...xs);
  console.log(`  trải ${tr}px ⇒ ${tr < MAN[0] ? '✔ LỌT' : '✘ KHÔNG lọt'} một khung hình ${MAN[0]}px`);
  const de = (a, b) => a.x < b.x+b.wd && b.x < a.x+a.wd && a.y < b.y+b.ht && b.y < a.y+a.ht;
  for (const [x, y, ten] of khoi){
    const goc = [[x,y],[x+460,y],[x+460,y+340],[x,y+340]].every(([a,b]) => trong(a, b, POLY));
    const va = O.filter(o => o.wd && de({x, y, wd:460, ht:340}, o)).length;
    if (!goc || va) xau++;
    console.log(`  ${ten.padEnd(12)} x ${x}-${x+460} y ${y}-${y+340}  bốn góc ${goc ? '✔' : '✘'}  đè ${va} khối cũ ${va ? '✘' : '✔'}`);
  }
  const moi = vong('vòng tiếp tế mới:', [veNam, ...loi.map(([, x, y]) => ({x, y})), veNam]);
  console.log(`    giảm ${(100 - 100*moi/nay).toFixed(0)}% so với ${Math.round(nay)}px hiện nay`);
  console.log(xau ? `\n  ✘ ${xau} chỗ sai hình học` : '\n  ✔ hình học đề xuất sạch');
  process.exitCode = xau ? 1 : 0;
}
