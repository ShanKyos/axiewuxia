// CÂN LẠI XP_TABLE + XP NHIỆM VỤ TỪ SỐ ĐO, không từ cảm giác.
//
//   NODE_PATH=/opt/node22/lib/node_modules node tools/do_nhipcap.cjs --json <đo>.json
//   node tools/can_exp.cjs <đo>.json [--gio60 3] [--phanNv 15] [--gio120 30] [--ghi]
//
// ── PHƯƠNG PHÁP ──────────────────────────────────────────────────────────────────────────
// 1. `do_nhipcap` cho XP/giờ ĐO ĐƯỢC ở từng mốc cấp (trung vị 3 lượt, cấp đứng yên, đồ đúng cấp).
// 2. Khớp một LUẬT LUỸ THỪA `rate(l) = a·l^b` trong không gian log-log. Vì sao luật luỹ thừa:
//    XP mỗi con ≈ 0,8-1,1 × lv² (đo trên toàn bộ 29 loài, xem bảng trong docs), còn số con giết
//    được mỗi giờ thì gần như không đổi theo cấp — nên rate ∝ lv^~2,5 là hình dạng PHẢI có.
//    Khớp đường cong thay vì dùng thẳng số đo là cố ý: số đo có hố ở đúng những cấp người chơi
//    kẹt ở NÓC một dải map (35 · 55 · 119). Lấy thẳng số đo là biến cái hố nội dung thành một
//    cấp rẻ bất thường — tức giấu lỗi đi thay vì chữa.
// 3. Ngân sách THỜI GIAN mỗi cấp tăng theo cấp số nhân: h(l) = h₁·r^(l-1). Hai mốc người chơi
//    cảm được (3 giờ tới cấp 60 · ~1 giờ/cấp ở cuối) quyết định r và h₁, không phải ngược lại.
// 4. `XP_TABLE[l-1] = rate(l)·h(l) + xpNhiemVu(l)` — nhiệm vụ trả trước một phần, phần còn lại
//    là cày. Tỉ lệ nhiệm vụ (`--phanNv`) là thứ quyết định "phải đánh quái bao nhiêu".
const fs = require('fs');
const A = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i+1] : d; };
const GIO60  = A('--gio60', 3);
// Phần XP do nhiệm vụ gánh, THEO CẤP: cao lúc đầu rồi nhạt dần. Đây không phải nới tay — đây là
// hình dạng mà mọi MMORPG có chuỗi nhiệm vụ đều có, và nó chính là thứ trả lời yêu cầu "càng về
// sau càng phải cày": ở cấp 1 chuỗi nhiệm vụ kéo người chơi đi, tới cấp 120 nó chỉ còn là tiền
// thưởng. Một tỉ lệ PHẲNG thì hoặc là cấp 1 thưởng 1 EXP (đọc như nhiệm vụ hỏng), hoặc là cấp
// 120 nhiệm vụ gánh hộ quá nhiều.
const PHAN0  = A('--nvDau', 40) / 100;    // phần nhiệm vụ gánh ở cấp 1
const PHANC  = A('--nvCuoi', 8) / 100;    // … và ở cấp 120
const phan   = l => PHAN0 * Math.pow(PHANC/PHAN0, (l-1)/(MAX_LV-1));
const GIO120 = A('--gio120', 30);         // giờ cho quãng 60→120
const GHI    = process.argv.includes('--ghi');
const MAX_LV = 120;

const do_ = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const moc = do_.moc.filter(m => m.xpGio > 0);

// ── 1. khớp luật luỹ thừa trong log-log ──
let sx=0, sy=0, sxx=0, sxy=0, n=0;
for (const m of moc){ const x = Math.log(m.lv), y = Math.log(m.xpGio); sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; n++; }
const b = (n*sxy - sx*sy) / (n*sxx - sx*sx), a = Math.exp((sy - b*sx)/n);
const rate = l => a * Math.pow(l, b);
// ⚠ KHÔNG lấy `max(đường khớp, số đo)`. Đã thử: số đo có đỉnh do bốc trúng bộ đồ ngon (cấp 45 đo
// 7,67 triệu/giờ, cấp 50 chỉ 5,13) nên `max` đẻ ra bảng cấp KHÔNG TĂNG DẦN — cấp 50 rẻ hơn cấp
// 45. Và lấy thẳng số đo ở chỗ HỤT thì biến bốn cái hố nội dung (35 · 55 · 70 · 119) thành bốn
// cấp rẻ bất thường, tức giấu lỗi thay vì chữa. Đường khớp là hình dạng game PHẢI có; chỗ số đo
// lệch khỏi nó được in ra cuối bảng làm danh sách việc, không nướng vào dữ liệu.
console.log(`luật luỹ thừa khớp được: rate(l) = ${a.toFixed(2)} · l^${b.toFixed(3)}   (${n} mốc)`);

// ── 2. ngân sách thời gian ──
// 1→59: cấp số nhân, tổng = GIO60. 60→119: cấp số nhân nối tiếp, tổng = GIO120.
function daiCapSoNhan(l0, l1, tong, tiLe){
  const N = l1 - l0 + 1;
  const r = Math.pow(tiLe, 1/(N-1));
  let S = 0; for (let i=0;i<N;i++) S += Math.pow(r, i);
  const h0 = tong / S, h = {};
  for (let i=0;i<N;i++) h[l0+i] = h0 * Math.pow(r, i);
  return h;
}
const TILE = A('--tile', 12);   // cấp cuối của dải tốn gấp ngần này lần cấp đầu
const TILE120 = A('--tile120', 7);
const h = Object.assign(daiCapSoNhan(1, 59, GIO60, TILE), daiCapSoNhan(60, 119, GIO120, TILE120));

// ── 3. XP NHIỆM VỤ THEO LUẬT, không theo con số chép tay ──────────────────────────────────
// LUẬT: một nhiệm vụ ở cấp L thưởng `k × XP_TABLE[L-1]` — tức "bằng k phần của chính cấp đó".
// Vì sao luật chứ không phải bảng số: bảng số chép tay thì đứng yên trong khi bảng cấp đổi, và
// đó chính là cách bộ cũ đi tới chỗ nhiệm vụ cấp 100 thưởng 190.000 XP trong khi cấp đó cần
// 8.485.085 — tức 2,2% một cấp. Người chơi đọc con số to mà tiến độ không nhúc nhích.
// ⚠ `XP_TABLE` KHÔNG được đặt theo XP nhiệm vụ (kiểu `= cày + nhiệm vụ`): làm thế thì cấp nào
// có nhiệm vụ rơi vào sẽ gần như CHỈ lên được bằng nhiệm vụ (cấp 1 đo ra 99% là quà), và ai bỏ
// qua chuỗi thì kẹt cứng. Bảng cấp đặt theo CÀY thuần, chia cho (1−phần nhiệm vụ).
global.window = global;
require('../public/game/data/canbang.js');

const BANG = [];
for (let l = 1; l < MAX_LV; l++) BANG.push(Math.round(rate(l) * h[l] / (1 - phan(l))));
const tong = c => BANG.slice(0, c-1).reduce((x,y)=>x+y, 0);

const QS = [...window.QUESTS.map(q=>({q,chinh:true})), ...window.SIDE_QUESTS.map(q=>({q,chinh:false}))];
const capCua = o => Math.min(MAX_LV-1, o.q.lv || o.q.reqLv || 1);   // ⚠ kẹp: BANG chỉ có tới cấp 119
// Trùm (boss · tranai) đáng gấp đôi: một trận một lần, khác hẳn cày N con.
const nang = o => (o.q.type === 'boss' || o.q.type === 'tranai') ? 2 : 1;
// XP nhiệm vụ mới — số GHI VÀO `rew.xp`, tức TRƯỚC khi gainXp nhân 1,5.
const moi = {};
for (const o of QS){ const L = capCua(o); moi[o.q.id] = Math.max(1, Math.round(BANG[L-1] * phan(L) * nang(o) / 1.5)); }
const cu = {}; for (const o of QS) cu[o.q.id] = (o.q.rew && o.q.rew.xp) || 0;
const gop = (bang, loc) => QS.filter(loc).reduce((s,o)=>s+bang[o.q.id], 0);
const duoi60 = o => capCua(o) < 60;
const tongNvCu = gop(cu, duoi60)*1.5, tongNvMoi = gop(moi, duoi60)*1.5;
console.log(`\ncày tới 60 (bỏ hết nhiệm vụ): ${tong(60).toLocaleString('vi-VN')} XP · ${(GIO60/(1-phan(30))).toFixed(2)} giờ`);
console.log(`luật thưởng: nhiệm vụ ở cấp L cho ${(phan(1)*100).toFixed(0)}% một cấp ở cấp 1 → ${(phan(120)*100).toFixed(0)}% ở cấp 120 (trùm ×2)`);
console.log(`nhiệm vụ <60 : ${Math.round(tongNvCu).toLocaleString('vi-VN')} → ${Math.round(tongNvMoi).toLocaleString('vi-VN')}  (= ${(tongNvMoi*100/tong(60)).toFixed(1)}% của ${tong(60).toLocaleString('vi-VN')})`);
console.log(`nhiệm vụ hết : ${Math.round(gop(cu,()=>1)*1.5).toLocaleString('vi-VN')} → ${Math.round(gop(moi,()=>1)*1.5).toLocaleString('vi-VN')}  (= ${(gop(moi,()=>1)*1.5*100/tong(120)).toFixed(1)}% của cả hành trình)`);

console.log(`\ncấp    XP cần          giờ/cấp   cộng dồn(giờ)`);
for (const l of [2,5,10,15,20,25,30,35,40,45,50,55,59,60,70,80,90,100,110,119]){
  let acc = 0; for (let kk=1;kk<=l;kk++) acc += h[kk];
  console.log(String(l).padStart(4), String(BANG[l-1].toLocaleString('vi-VN')).padStart(15), h[l].toFixed(3).padStart(9), acc.toFixed(2).padStart(12));
}
// ⚠ TÍNH GIỜ THEO TỪNG CẤP, đừng lấy tổng rồi nhân với tỉ lệ nhiệm vụ trung bình. XP nhiệm vụ
// rơi thành CỤC ở vài cấp lẻ chứ không rải đều, nên phép xấp xỉ trung bình lệch hẳn — đã đo:
// nó báo 3,00 giờ trong khi tính đúng từng cấp ra 3,60. `tests/test_nhipcap.js` tính kiểu này.
const xpNvTheoCap = {};
for (const o of QS) xpNvTheoCap[capCua(o)] = (xpNvTheoCap[capCua(o)] || 0) + moi[o.q.id] * 1.5;
let g60 = 0, g60cay = 0, g120 = 0;
for (let l=1;l<120;l++){
  const con = Math.max(0, BANG[l-1] - (xpNvTheoCap[l] || 0)) / rate(l);
  if (l < 60){ g60 += con; g60cay += BANG[l-1] / rate(l); }
  g120 += con;
}
console.log(`\nTỚI CẤP 60  : ${g60.toFixed(2)} giờ (làm hết nhiệm vụ) · ${g60cay.toFixed(2)} giờ (bỏ hết) · tổng XP ${tong(60).toLocaleString('vi-VN')}`);
console.log(`TỚI CẤP 120 : ${g120.toFixed(2)} giờ · tổng XP ${tong(120).toLocaleString('vi-VN')}`);
console.log('\nvài mẫu thưởng (ghi vào rew.xp):');
for (const id of ['c0q1','c0q8','c1q5','c3q3','c5q6','c6q6','c8q4','sd_co1','sd_ch2','sd_nm2'])
  if (moi[id] != null) console.log(`  ${id.padEnd(8)} cấp ${String(capCua(QS.find(o=>o.q.id===id))).padStart(3)}  ${String(cu[id].toLocaleString('vi-VN')).padStart(9)} → ${moi[id].toLocaleString('vi-VN')}`);

console.log('\nchỗ số ĐO thấp hơn đường khớp >55% — hố nội dung, KHÔNG phải nhiễu đo:');
let hoNao = 0;
for (const m of do_.moc){
  const f = rate(m.lv);
  if (m.xpGio < f*0.45){ console.log(`  cấp ${String(m.lv).padStart(3)} (${m.map}): đo ${m.xpGio.toLocaleString('vi-VN')} vs khớp ${Math.round(f).toLocaleString('vi-VN')} = ${(m.xpGio*100/f).toFixed(0)}%`); hoNao++; }
}
if (!hoNao) console.log('  (không có)');

if (GHI){
  fs.writeFileSync(process.env.XP_RA || '/tmp/xp_moi.json', JSON.stringify({ BANG, xpNv: moi, a, b, phan0: PHAN0, phanC: PHANC }, null, 1));
  console.log('\n→ ' + (process.env.XP_RA || '/tmp/xp_moi.json'));
}
