'use strict';
/* =========================================================
   GIANG HỒ HUYỄN ẢNH — HUYỄN ẢNH CHÍ TÔN (PvE Webgame v1)
   Core loop: farm → mission → level 1→10 → gear (10 slots ×
   6 attributes) → Rèn Luyện → Ám Khí / Trấn Phái / Điểm Huyệt
   ========================================================= */

// ---------- Canvas ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Minimap
const miniCvs = document.getElementById('minimap');
const miniCtx = miniCvs ? miniCvs.getContext('2d') : null;
let W = 0, H = 0;
function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// ---------- Balance data ----------
const MAX_LV = 120; // max cấp theo cấp boss endgame (GDD: 120)
const XP_TABLE = [200,450,800,1300,1900,2600,3400,4300,5400]; // xp to next level (index = lv-1)
for (let l = 10; l < 120; l++) XP_TABLE.push(Math.round(5400 * Math.pow(1.08, l - 9))); // GDD 120 cấp: dốc 1.08 cho hành trình dài
// Từ cấp 60: farm chậm lại rõ rệt, mục tiêu trung bình 1 tiếng treo AUTO/cấp. Mốc dưới đo trực
// tiếp từ công thức chiến đấu của game (atk cơ bản theo calcDerived — không trang bị — × HP/DEF
// quái đại diện 3 vùng farm cuối Frostmire Vale/Ashen Steppe/Stormgate Pass) ra EXP/giờ THUẦN AUTO
// ở mỗi mốc cấp, rồi quy đổi ngược: cần bao nhiêu EXP để 1 giờ farm đó vừa đúng lên 1 cấp. Trang bị
// + kỹ năng tự động thực tế sẽ đẩy nhanh hơn mốc này — đúng như game idle: có đầu tư thì nhanh hơn.
const XP60PLUS_ANCHORS = [
  [60,2472993],[65,2825065],[70,3218638],[75,3660353],[80,4712812],[85,5353775],
  [90,6085261],[95,6925890],[100,8485085],[105,9651109],[110,10205747],[115,10771241],[120,11248196],
];
function xp60PlusHourlyRate(l){
  for (let i = 0; i < XP60PLUS_ANCHORS.length - 1; i++){
    const [l0, v0] = XP60PLUS_ANCHORS[i], [l1, v1] = XP60PLUS_ANCHORS[i+1];
    if (l >= l0 && l <= l1) return v0 + (v1 - v0) * (l - l0) / (l1 - l0);
  }
  return XP60PLUS_ANCHORS[XP60PLUS_ANCHORS.length - 1][1];
}
for (let l = 60; l < 120; l++) XP_TABLE[l-1] = Math.round(xp60PlusHourlyRate(l));
const MAP = { w: 2600, h: 1900 };

const ELEMENTS = ['Kim','Mộc','Thủy','Hỏa','Thổ'];

const RARITIES = [
  { name:'Phàm',    color:'#b9b9b9', cls:'r0', mult:1.0, w:52 },
  { name:'Tinh',    color:'#5fc96e', cls:'r1', mult:1.3, w:27 },
  { name:'Linh',    color:'#5ea0e8', cls:'r2', mult:1.65,w:14 },
  { name:'Thần',    color:'#c07fe0', cls:'r3', mult:2.1, w:6  },
  { name:'Chí Tôn', color:'#f39c3d', cls:'r4', mult:2.7, w:1  },
];

// ── Drop v2.0 (GDD Trang Bị v2.0): Thập Giai Binh Khí + drop theo nguồn ──
// Giai = thời đại của món đồ (theo map), Phẩm = chất lượng rèn (Phàm→Chí Tôn)
const GIAI_NAMES = ['Tân Binh','Chiến Binh','Anh Hùng','Chinh Phục','Hung Thần','Huyền Thoại','Bất Tử','Thần Thoại','Vô Song','Tối Thượng'];
function giaiName(t){ return GIAI_NAMES[clamp((t||1)-1, 0, 9)]; }
// Quái thường chỉ rơi fodder Phàm + vật liệu; đồ dùng được (Tinh+) chỉ từ tinh anh/boss
// ── TỈ LỆ RƠI TRANG BỊ: theo DẢI QUÁI × LOẠI ────────────────────────────────
// Trước đây DROP_SRC.chance chỉ có 4 ngăn cứng, nên Axie Heo Rừng cấp 1 và Cuồng Binh Tro Tàn
// cấp 102 rơi đồ với xác suất Y HỆT nhau: 6%. Về cuối game mỗi con quái tốn nhiều thời gian
// hơn hẳn, tỉ lệ phải bù lại.
const DROP_RATE = {          // dải:  I     II    III   IV    V
  mob:    [0.07, 0.08, 0.09, 0.10, 0.12],
  elite:  [0.28, 0.30, 0.33, 0.36, 0.40],
  thuve:  [1, 1, 1, 1, 1],
  tranai: [1, 1, 1, 1, 1],
};
const DROP_COUNT = { thuve:[1,2,2,2,3], tranai:[2,2,3,3,3] };
function mobBand(lv){ return lv <= 20 ? 0 : lv <= 40 ? 1 : lv <= 60 ? 2 : lv <= 80 ? 3 : 4; }
// 46 giá trị `drop:` đã cân sẵn trên từng con quái (0,14 → 1,0) nay SỐNG lại — nhưng làm hệ số
// TRONG dải, không phải tỉ lệ tuyệt đối: con "giàu" rơi nhiều hơn con "nghèo" cùng dải chừng
// ±20%, mà không phá mức đã chốt cho cả dải.
function mobDropRate(def, srcK){
  const base = (DROP_RATE[srcK] || DROP_RATE.mob)[mobBand(def.lv || 1)];
  return def.drop == null ? base : base * (0.80 + 0.40 * clamp(def.drop, 0, 1));
}
function mobDropCount(def, srcK){
  const t = DROP_COUNT[srcK];
  return t ? t[mobBand(def.lv || 1)] : 1;
}
// Tỉ lệ Hoàn Hảo theo tầng Bảo Hạp. Hoàn Hảo GỠ khỏi quái (kể cả boss) — Bảo Hạp chỉ có từ
// Xâm Lăng Vàng và Hung Thần, nên hai sự kiện thế giới thành con đường DUY NHẤT tới đồ Hoàn
// Hảo. Đó chính là thứ làm chúng đáng chờ.
const BAOHAP_PERFECT = [0, 0, 0.06, 0.12, 0.20, 0.30, 0.40, 0.55];
// ── NGỌC RƠI TỪ MỌI LOẠI QUÁI (vòng kinh tế MU Season 1) ────────────────────
// Trước đây quái thường rơi ĐÚNG 0 ngọc: muốn rèn thì bắt buộc phải chờ sự kiện thế giới hoặc
// mở Bảo Hạp. Trong MU thì ngọc rơi từ quái thường — đó là thứ khiến việc cày có nghĩa mỗi ngày.
// Nhân theo dải quái ×1,0 → ×1,8: cuối game mỗi con tốn nhiều thời gian hơn hẳn.
const JEWEL_DROP = {
  mob:    { chucPhuc:0.009, linhHon:0.007, sinhMenh:0.0025, honDon:0.0010 },
  elite:  { chucPhuc:0.045, linhHon:0.035, sinhMenh:0.016,  honDon:0.008  },
  thuve:  { chucPhuc:0.20,  linhHon:0.12,  sinhMenh:0.06,   honDon:0.03   },
  tranai: { chucPhuc:1.00,  linhHon:0.45,  sinhMenh:0.22,   honDon:0.12   },
};
const JEWEL_BAND_MUL = [1.0, 1.2, 1.4, 1.6, 1.8];
function rollJewels(def, srcK, x, y){
  const tbl = JEWEL_DROP[srcK]; if (!tbl) return;
  const mul = JEWEL_BAND_MUL[mobBand(def.lv || 1)];
  for (const k in tbl){
    if (Math.random() >= tbl[k] * mul) continue;
    // Ngọc rơi xuống ĐẤT tại xác quái. Bản cũ cộng thẳng vào player.jewels rồi bắn chữ ở chân
    // người chơi — không ai nối được "con này vừa rớt ngọc", mà tiếng thì bị debounce nuốt sạch.
    if (x != null) dropToGround({ k:'jewel', jk:k }, x, y);
    else { player.jewels[k] = (player.jewels[k] || 0) + 1;
      addFloat(player.x, player.y - 70, '+1 ' + JEWEL_NAMES[k], JEWEL_COLORS[k], 13); AudioSys.sfx('forge_ok', 0.85); }
  }
}
const DROP_SRC = {
  mob:    { rar:[80,19,1,0,0],  perfect:0 },
  elite:  { rar:[0,70,28,2,0],  perfect:0 },
  thuve:  { rar:[0,28,52,18,2], perfect:0 },
  tranai: { rar:[0,0,38,52,10], perfect:0 },
  // Rương Boss Săn (phó bản, MU Online-style) — 5 cấp, cấp càng cao càng chắc ra phẩm cao
  box1: { chance:1, rar:[70,25,5,0,0],  perfect:0    },
  box2: { chance:1, rar:[0,60,32,8,0],  perfect:0.05 },
  box3: { chance:1, rar:[0,10,55,30,5], perfect:0.10 },
  box4: { chance:1, rar:[0,0,30,55,15], perfect:0.15 },
  box5: { chance:1, rar:[0,0,5,35,60],  perfect:0.25 },
};
function rollRaritySrc(srcK){
  const w = DROP_SRC[srcK].rar; let tot = 0; for (const x of w) tot += x;
  let roll = Math.random()*tot;
  for (let i = 0; i < w.length; i++){ roll -= w[i]; if (roll <= 0) return i; }
  return 0;
}
// ── DÒNG HOÀN HẢO — bộ dòng RIÊNG, không phải "dòng cũ roll max" ───────────
// Đây là chỗ hai trục tách hẳn nhau: ĐỘ HIẾM quyết định SỐ dòng thường (0-4), HOÀN HẢO thêm
// 1-3 dòng từ bảng dưới. Hệ quả cố ý: một món Rèn Hoàn Hảo có thể đáng mặc hơn một món Thánh
// Thường, vì nó mang dòng mà đồ thường KHÔNG BAO GIỜ có. Hai thứ để săn song song, không phải một.
const EXC_WEAPON = [
  { k:'excQi',     name:'Hạ địch hồi Qi',        v:8,  flat:true },  // cơ chế MỚI
  { k:'excHp',     name:'Hạ địch hồi Sinh Lực',  v:8,  flat:true },  // cơ chế MỚI
  { k:'perfect',   name:'Tỉ lệ ST Hoàn Hảo',     v:10 },
  { k:'atkPct',    name:'Thêm Sát Thương',       v:2  },
  { k:'excAtkLv',  name:'ST theo cấp',           v:1,  flat:true },  // = cấp ÷ 20, tự lớn theo cấp
  { k:'aspdPct',   name:'Tốc Độ Đánh',           v:7  },
];
const EXC_ARMOR = [
  { k:'silverPct', name:'Đồng Rơi Thêm',      v:40 },
  { k:'excBlock',  name:'Tỉ lệ Đỡ Đòn',       v:10 },                // cơ chế MỚI
  { k:'reflectPct',name:'Phản Sát Thương',    v:5  },
  { k:'dmgred',    name:'Giảm Sát Thương',    v:4  },
  { k:'qiPct',     name:'Qi Tối Đa',          v:4  },
  { k:'hpPct',     name:'Sinh Lực Tối Đa',    v:4  },
];
// Số dòng Hoàn Hảo theo tầng Bảo Hạp: I-II → 1 · III-IV → 1-2 · V-VI → 2-3 · VII → 3
function excCount(tier){
  const t = tier || 0;
  return t >= 7 ? 3 : t >= 5 ? 2 + (Math.random() < 0.5 ? 1 : 0)
       : t >= 3 ? 1 + (Math.random() < 0.5 ? 1 : 0) : 1;
}
function rollExcLines(slotId, tier){
  const pool = (slotId === 'vukhi' ? EXC_WEAPON : EXC_ARMOR).slice();
  const n = Math.min(pool.length, excCount(tier));
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
const RARITY_SUBS = [0,1,2,3,4]; // số dòng phụ mở theo phẩm Phàm..Chí Tôn
// Bốc dòng phụ. Một chỗ duy nhất cho cả lúc rơi lẫn lúc Tấn Phẩm — trước đây hai nơi chép
// cùng một đoạn, nên sửa luật ở nơi này mà quên nơi kia là đồ rơi và đồ tấn phẩm khác luật nhau.
function rollSubs(slotId, rarity, perfect){
  const all = (ARMOR_SLOTS.includes(slotId) ? ARMOR_SUBS : WEAPON_SUBS);
  const vip = all.filter(d => d.vip), pool = all.filter(d => !d.vip);
  const out = [];
  const take = (def) => {
    const v = (perfect || def.fixed) ? def.max
            : Math.round((def.min + Math.random() * (def.max - def.min)) * 10) / 10;
    out.push({ k:def.k, name:def.name, v, pct:true });
  };
  if (perfect) for (const d of vip) take(d);          // Hoàn Hảo: dòng VIP là đặc quyền, luôn có
  const want = Math.min(all.length, perfect ? 4 : RARITY_SUBS[rarity]);
  const bag = pool.slice();
  while (out.length < want && bag.length) take(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
  return out;
}
// Roll lại tên + chỉ số gốc + dòng phụ khi phẩm đổi (Tấn Phẩm / pity đai)
function rerollItemRarity(it){
  it.name = (it.perfect ? 'Hoàn Hảo ' : '') + ITEM_NAMES[it.slot][it.rarity];
  const slot = SLOTS.find(s => s.id === it.slot);
  if (slot && it.main) it.main.v = slot.base(it.tier, it.rarity);
  it.subs = rollSubs(it.slot, it.rarity, it.perfect);
}
// str/agi/ene mỗi phái quy đổi ra Công Kích theo TRỌNG SỐ RIÊNG (SECTS[x].atkSrc) — không còn dùng
// chung 1 công thức "str × 2" cho mọi phái. VD: Sylvan Ranger chỉ cần dồn Mẫn Tiệp là đủ mạnh, Dark Wizard
// cần cả Mẫn Tiệp lẫn Linh Lực — đúng lối build đặc trưng từng lớp nhân vật kiểu MU Online.
const ATTR_INFO = {
  str:{ name:'Lực Lượng', desc:'Công kích (tùy phái), sát thương ám khí' },
  agi:{ name:'Mẫn Tiệp',  desc:'Tốc đánh, bạo kích, né tránh + Công kích (tùy phái)' },
  def:{ name:'Phòng Ngự', desc:'Giảm sát thương nhận vào' },
  vit:{ name:'Sinh Lực',  desc:'HP tối đa, hồi phục' },
  ene:{ name:'Linh Lực',  desc:'Chân Khí tối đa + Công kích (tùy phái)' },
};
// Phụ phẩm theo GDD: Trang bị giáp & Nhẫn (thường/hoàn hảo)
const ARMOR_SUBS = [
  { k:'dmgred',    name:'Giảm Sát Thương',  min:1,  max:5  },
  { k:'hpPct',     name:'Sinh Lực Tối Đa',  min:1,  max:5  },
  { k:'qiPct',     name:'Qi Tối Đa',   min:1,  max:4  },
  { k:'evaPct',    name:'Tránh Đòn',        min:5,  max:10 },
  { k:'silverPct', name:'Đồng Rơi Thêm',    min:10, max:30 },
  { k:'reflectPct',name:'Phản Sát Thương',  min:1,  max:5  },
];
// Phụ phẩm theo GDD: Dây Chuyền & Vũ Khí
const WEAPON_SUBS = [
  // vip: CHỈ đồ Hoàn Hảo mới có, và đã Hoàn Hảo thì CHẮC CHẮN có. Trước đây nó nằm chung
  // bảng nên 5,6% vũ khí phẩm thường cũng mang "ST Hoàn Hảo +10%" — đo 6000 lần rơi: 333 món.
  { k:'perfect',   name:'ST Hoàn Hảo',      min:10, max:10, fixed:true, vip:true },
  { k:'atkPct',    name:'Thêm Sát Thương',  min:2,  max:5  },
  { k:'qiLeech',   name:'Hút Qi',      min:1,  max:3  },
  { k:'hpLeech',   name:'Hút Sinh Lực',     min:1,  max:3  },
  { k:'aspdPct',   name:'Tốc Độ Đánh',      min:2,  max:5  },
];
const AWAKENED = [
  { k:'crit', v:5,  name:'Bạo Kích +5%' },
  { k:'eva',  v:5,  name:'Né Tránh +5%' },
  { k:'atk',  v:25, name:'Công Kích +25' },
  { k:'hp',   v:200,name:'Sinh Lực +200' },
  { k:'qireg',v:3,  name:'Hồi Instinct +3' },
  { k:'str',  v:8,  name:'Lực Lượng +8' },
];

// 12 ô trang bị theo GDD (base tính theo CẤP trang bị t=1..10, mỗi 10 level = 1 cấp)
const SLOTS = [
  { id:'vukhi',     name:'Vũ Khí',     main:'atk', base:(t,r)=>Math.round((10+t*20)*RARITIES[r].mult) },
  { id:'non',       name:'Nón',        main:'def', base:(t,r)=>Math.round((5+t*10)*RARITIES[r].mult) },
  { id:'ao',        name:'Áo',         main:'def', base:(t,r)=>Math.round((7+t*13)*RARITIES[r].mult) },
  { id:'tay',       name:'Tay',        main:'def', base:(t,r)=>Math.round((5+t*10)*RARITIES[r].mult) },
  { id:'quan',      name:'Quần',       main:'def', base:(t,r)=>Math.round((6+t*11)*RARITIES[r].mult) },
  { id:'chan',      name:'Chân',       main:'agi', base:(t,r)=>Math.round((4+t*7)*RARITIES[r].mult) },
  { id:'daychuyen', name:'Dây Chuyền', main:'atk', base:(t,r)=>Math.round((6+t*12)*RARITIES[r].mult) },
  { id:'nhan1',     name:'Nhẫn 1',     main:'crit',base:(t,r)=>+(1.5+r*1+t*0.5).toFixed(1) },
  { id:'nhan2',     name:'Nhẫn 2',     main:'eva', base:(t,r)=>+(1.5+r*1+t*0.5).toFixed(1) },
  { id:'aochoang',  name:'Áo Choàng',  special:true }, // 2 cấp, chỉ từ Luyện Bảo Các
  { id:'pet',       name:'Pet',        special:true }, // rơi từ tinh anh/boss
  { id:'canh',      name:'Cánh',       special:true }, // Thiên Thần / Tiểu Quỷ — ngoài 10 cấp
];
const ARMOR_SLOTS = ['non','ao','tay','quan','chan','nhan1','nhan2']; // có thể Hoàn Hảo
// Bố cục lưới trang bị kiểu paperdoll (3 cột x 4 hàng) — thay cho danh sách dọc cũ
const EQUIP_GRID = [
  ['canh','non','aochoang'],
  ['vukhi','ao','daychuyen'],
  ['nhan1','quan','nhan2'],
  ['tay','chan','pet'],
];
// Tên trang bị đi theo PHẨM (Phàm→Chí Tôn), leo theo CHẤT LIỆU như đồ MU: da → sắt → thép →
// vảy rồng → hắc nguyệt. Bộ tên cũ mượn thẳng binh khí kiếm hiệp (Huyền Thiết Trọng Kiếm,
// Lăng Ba Hài, Chí Tôn Long Giáp…) — vi phạm Quy tắc số 1.
const ITEM_NAMES = {
  vukhi:['Kiếm Đồng','Kiếm Sắt','Trọng Kiếm Thép','Kiếm Vảy Rồng','Ma Kiếm Hắc Nguyệt'],
  non:['Mũ Da','Mũ Sắt','Mũ Trụ Thép','Mũ Trụ Vảy Rồng','Vương Miện Hắc Nguyệt'],
  ao:['Giáp Da','Giáp Sắt','Giáp Bản Thép','Giáp Vảy Rồng','Thánh Giáp Hắc Nguyệt'],
  tay:['Găng Da','Găng Sắt','Găng Thép','Găng Vảy Rồng','Găng Hắc Nguyệt'],
  quan:['Quần Da','Giáp Đùi Sắt','Giáp Đùi Thép','Giáp Đùi Vảy Rồng','Giáp Đùi Hắc Nguyệt'],
  chan:['Giày Da','Giày Sắt','Ủng Thép','Ủng Vảy Rồng','Ủng Hắc Nguyệt'],
  daychuyen:['Dây Chuyền Đồng','Dây Chuyền Bạc','Dây Chuyền Ngọc Lam','Dây Chuyền Hồng Ngọc','Dây Chuyền Tinh Vân'],
  nhan1:['Nhẫn Đồng','Nhẫn Bạc','Nhẫn Ngọc Lục','Nhẫn Hắc Kim','Nhẫn Tinh Vân'],
  nhan2:['Nhẫn Thô Sơ','Nhẫn Chạm Khắc','Nhẫn Cổ Ngữ','Nhẫn Phong Ấn','Nhẫn Vĩnh Hằng'],
};
// Áo Choàng — 2 cấp, chỉ luyện chế tại Luyện Bảo Các (Rèn)
const CLOAK_TIERS = [ null,
  { name:'Áo Choàng Thép Xám', color:'#5ea0e8', req:1,  atkPct:5,  pierce:3, defPct:0, cost:{ tuLa:5,  hon:2, silver:2000 } },
  { name:'Áo Choàng Thánh Quang', color:'#7ecbff', req:60, atkPct:10, pierce:6, defPct:5, cost:{ tuLa:10, hon:5, silver:6000 } },
];
// Pet — rơi từ tinh anh (12%) / boss (40%)
const PET_DEFS = [
  { id:'holy',   name:'Thánh Linh May Mắn',     color:'#e8a0c0', expPct:10, silverPct:5,                desc:'+10% EXP · +5% đồng rơi' },
  { id:'hulan',  name:'Huyền Băng Lang', color:'#7ab0d8', expPct:15, silverPct:10, hpLeech:2,   desc:'+15% EXP · +10% đồng · hút 2% sinh lực' },
  { id:'hothan', name:'Kim Thân Hổ',    color:'#7ecbff', expPct:20, silverPct:15, hpLeech:3, atkPct:3, desc:'+20% EXP · +15% đồng · hút 3% sinh lực · +3% ST' },
];
// Cánh — boss 12%, ngoài hệ 10 cấp trang bị
const WING_DEFS = [
  { id:'thienthan', name:'Cánh Thiên Thần', color:'#dfe8ff', hpPct:12, evaPct:6, silverPct:20, desc:'+12% HP · +6% né · +20% đồng rơi' },
  { id:'tieuquy',   name:'Cánh Tiểu Quỷ',   color:'#b08ae8', atkPct:12, crit:5,  aspdPct:6,    desc:'+12% ST · +5% bạo · +6% tốc đánh' },
];
// Linh Dực Cấp 2 — luyện tại Lò Bảo Chứng (LV80+), thăng từ cánh cấp 1
const WING2_DEFS = [
  { id:'phuongduc', name:'Phượng Hoàng Linh Dực', color:'#ff8a3a', atkPct:20, hpPct:15, crit:8, aspdPct:10, desc:'+20% ST · +15% HP · +8% bạo · +10% tốc đánh' },
  { id:'hacma',     name:'Hắc Ma Linh Dực',       color:'#c07fe0', atkPct:24, pierce:8, hpLeech:5, crit:10, desc:'+24% ST · +8% xuyên giáp · +5% hút sinh lực · +10% bạo' },
];

// Vòng khắc hệ: Kim > Mộc > Thổ > Thủy > Hỏa > Kim (khắc chế +20% sát thương)
// Vòng khắc 5 hệ. KHÓA đối tượng giữ nguyên (chúng nằm trong save của người chơi và rải khắp
// bảng quái); chỉ TÊN HIỆN RA đổi sang tên phương Tây — cùng quy ước đã dùng cho tên bãi săn
// và tên quái. Vòng khắc không đổi một cạnh nào nên cân bằng giữ nguyên tuyệt đối:
//   Steel ⚔ Verdant ⚔ Stone ⚔ Frost ⚔ Ember ⚔ Steel
// (lưỡi thép đốn cây · rễ nứt đá · đất vùi băng · băng dập lửa · lửa nung chảy thép)
const ELEM = {
  Kim:  { name:'Steel',   color:'#c8d4e8', beats:'Mộc',  glyph:'◆' },
  'Mộc':{ name:'Verdant', color:'#5db86a', beats:'Thổ',  glyph:'♣' },
  'Thổ':{ name:'Stone',   color:'#c08a4a', beats:'Thủy', glyph:'▲' },
  'Thủy':{ name:'Frost',  color:'#7ec8ff', beats:'Hỏa',  glyph:'❄' },
  'Hỏa':{ name:'Ember',   color:'#e8552a', beats:'Kim',  glyph:'☼' },
};
function elName(k){ return (ELEM[k] || {}).name || k || '—'; }
function elColor(k){ return (ELEM[k] || {}).color || '#c9b889'; }
// Hệ của ĐÒN ĐÁNH: lấy theo vũ khí đang cầm, không có vũ khí thì theo hệ của lớp.
// CHỈ dùng cho chiều người → quái. Chiều quái → người vẫn theo hệ của LỚP, nên đổi vũ khí
// không bao giờ làm ngươi ăn đòn nặng hơn — đúng như đã chốt.
function atkElem(){
  if (!player) return null;
  const w = player.equip && player.equip.vukhi;
  if (w && !w.special && w.element && ELEM[w.element]) return w.element;
  return (SECTS[player.sect] || {}).element || null;
}
// Hệ chỉ có ý nghĩa trên VŨ KHÍ. Trước đây mọi món đều mang element mà chẳng ô nào dùng tới —
// tệ hơn, Lò Hỗn Độn còn bán công thức Đổi Hệ ăn 1 Hỗn Độn Châu để roll lại thứ vô dụng đó.
function hasElem(it){ return !!(it && !it.special && it.slot === 'vukhi' && ELEM[it.element]); }
// Internal object keys are stable identifiers (referenced throughout combat/save logic) and are
// intentionally left unchanged by the Axie Wuxia reskin — only player-facing fields below (name,
// role, desc, glyph, skill names) were rewritten. See docs/NAMING_MAP.md for the full class
// roster mapping and reasoning (element/role match from each source sect → its Axie class).
// MU Online-lite: 5 lớp gốc (Dark Knight/Dark Wizard/Sylvan Ranger/Spellblade/Dark Lord), mỗi lớp
// mượn hình hài 1 trong 9 loài Axie gần đúng playstyle nhất — 4 loài còn lại (Dusk/Bird/Plant/Dawn)
// đã bị cắt hẳn theo hướng tối giản hoá. skillA/tp đổi tên & type theo đúng chiêu gốc MU của lớp đó,
// numbers (mult/cd/qi) giữ nguyên từ bản cũ — không cần cân bằng lại.
// hpMult/defMult/dmgMult: hệ số cân bằng theo archetype MU Online (kiểu thiết kế mọi bản MU đều
// dùng — không chỉ vài điểm bonus cố định, vì bonus bị pha loãng ở cấp cao khi level*15 HP/level*2
// ATK đã chiếm phần lớn công thức). Áp trong calcDerived(): melee cận chiến (range 90, chịu đòn trực
// tiếp) được +HP/+DEF bù lại sát thương thấp hơn; 2 lớp tầm xa (Elf/Dark Wizard) giòn hơn hẳn nhưng
// bù bằng sát thương cao hơn, đặc biệt Dark Wizard (range 420, xa nhất) là glass cannon rõ rệt nhất.
// atkSrc: điểm tiềm năng nào quy đổi ra Công Kích, đúng lối build đặc trưng từng lớp kiểu MU Online —
// str/agi/ene nhân theo trọng số riêng (xem calcDerived()), KHÔNG còn chung 1 công thức "str×2" như
// trước. VD: Sylvan Ranger chỉ cần dồn Mẫn Tiệp (agi) là đủ mạnh; Dark Wizard cần cả Mẫn Tiệp lẫn Linh
// Lực (ene). Tổng điểm bonus của mỗi phái GIỮ NGUYÊN so với bản cân bằng trước, chỉ đổi chỗ ghi điểm.
const SECTS = {
  thieulam: { name:'Dark Knight', role:'Tank / Combo cận chiến', element:'Kim', color:'#4c8dff', glow:'#ffe9a0', bonus:{vit:3,def:2,str:1,agi:0,ene:0},
    hpMult:1.18, defMult:1.20, dmgMult:0.95, atkSrc:{str:2.0},
    desc:'Giáp tấm nặng, mũ trụ có sừng, đại kiếm hai tay. Dark Knight đứng mũi chịu sào, nuốt trọn đòn của cả bầy rồi trả lại bằng một nhát bổ chậm mà không gì cản nổi. Tiềm năng: dồn hết vào Lực Lượng.',
    skillA:{ name:'Twisting Slash', type:'cone',  cd:4, qi:20, mult:1.6 },
    tp:{ name:'Death Stab', mult:3.0 } },
  // range/basicProj: Sylvan Ranger & Dark Wizard là 2 lớp tầm xa thật (cung/phép) — đòn thường của họ bắn
  // đạn ở khoảng cách này thay vì vung cận chiến như Dark Knight/Spellblade/Dark Lord (xem doBasic()).
  toanchan: { name:'Sylvan Ranger', role:'Tầm xa / Hỗ trợ', element:'Thủy', color:'#3a9d8b', glow:'#a0ffe9', bonus:{vit:0,def:0,str:0,agi:4,ene:0},
    hpMult:0.90, defMult:0.85, dmgMult:1.05, atkSrc:{agi:2.0},
    desc:'Cung dài, giáp da nhẹ, chân bước không thành tiếng. Sylvan Ranger rót tên từ ngoài tầm với, đồng thời phủ buff lên cả đội — vừa là sát thủ vừa là chỗ dựa. Tiềm năng: chỉ cần dồn Mẫn Tiệp là đủ mạnh.',
    range:380, basicProj:'arrow',
    skillA:{ name:'Multi-Shot', type:'proj', cd:4, qi:20, mult:1.5, count:5 },
    tp:{ name:'Ice Arrow', mult:2.8 } },
  baidasan: { name:'Dark Wizard', role:'Pháp thuật / Độc tố', element:'Thủy', color:'#7ec850', glow:'#c8ffa0', bonus:{vit:1,def:0,str:0,agi:1,ene:3},
    hpMult:0.72, defMult:0.65, dmgMult:1.30, atkSrc:{ene:1.6, agi:0.6},
    desc:'Áo thụng trùm kín, quyền trượng nạm ngọc, thân thể mỏng như giấy. Dark Wizard đứng xa nhất chiến trường và gọi độc tố cùng thiên thạch xuống thay mình. Tiềm năng: cần cả Mẫn Tiệp lẫn Linh Lực.',
    range:420, basicProj:'orb',
    skillA:{ name:'Poison', type:'proj', cd:4, qi:20, mult:1.5 },
    tp:{ name:'Meteor', mult:3.2 } },
  minhgiao: { name:'Spellblade', role:'Lai / Bộc phát Hoả', element:'Hỏa', color:'#e8552a', glow:'#ffb060', bonus:{vit:1,def:0,str:2,agi:0,ene:2},
    hpMult:1.05, defMult:1.0, dmgMult:1.08, atkSrc:{str:1.1, ene:1.1},
    desc:'Nửa giáp nửa vải, một vai để trần, đại đao bản rộng cháy lửa. Spellblade vừa chém như hiệp sĩ vừa niệm như pháp sư — không cần chờ tới cấp 10 để mạnh. Tiềm năng: cân cả Lực Lượng lẫn Linh Lực.',
    skillA:{ name:'Fire Slash', type:'cone', cd:4, qi:22, mult:1.6 },
    tp:{ name:'Flame Strike', mult:3.2 } },
  // Dark Lord: lớp chỉ huy/triệu hồi — archetype mượn từ trường phái vô môn phái Cái Bang cũ
  // (VOHOC_DEFS): xáp lá cà bằng số đông, không đơn độc.
  bug: { name:'Dark Lord', role:'Chỉ huy / Triệu hồi', element:'Thổ', color:'#8a9a3a', glow:'#d0e07a', bonus:{vit:2,def:1,str:1,agi:2,ene:0},
    hpMult:1.12, defMult:1.10, dmgMult:0.92, atkSrc:{str:1.8, agi:0.3},
    desc:'Vương miện năm chấu, giáp đen ánh lam, quyền trượng chỉ huy. Dark Lord không bao giờ ra trận một mình — hắn hiệu triệu, và chiến trường tự sạch. Tiềm năng: chủ lực Lực Lượng, dặm thêm Mẫn Tiệp.',
    skillA:{ name:'Force Wave', type:'cone', cd:4, qi:20, mult:1.5 },
    tp:{ name:'Fire Scream', mult:3.0 } },
  // Tán Nhân — pre-class starter, level 1-10, before the Calling. No element (no advantage or disadvantage).
  vophai: { name:'Unclassed', role:'Wandering / Free', element:null, color:'#b8a888', glow:'#e4ebff', bonus:{vit:1,def:1,str:1,agi:1,ene:0},
    atkSrc:{str:2.0},
    desc:'Áo vải thô, một thanh kiếm ngắn, chưa mang huy hiệu của ai. Lên cấp 10 và đáp lời The Calling để chọn con đường của mình.',
    skillA:{ name:'Hatchling Strike', type:'cone', cd:4, qi:18, mult:1.4 },
    tp:{ name:'Wanderer\'s Resolve', mult:2.5 } },
};
// Sourced per-class combat SFX (axieinfinity/axie-origins-asset-kit web-vfx) — maps SECTS id to the
// kit's class-name prefix (sfx_slash_<x>/sfx_cast_<x>/sfx_smash_<x>.mp3). No entry for vophai (pre-Calling,
// Unclassed) — falls back to the generic 'slash'/'skill' sfx.
const SECT_SFX = { thieulam:'mech', toanchan:'aquatic', baidasan:'reptile', minhgiao:'beast', bug:'bug' };
const AMKHI = { name:'Ám Khí', cd:4, qi:15, mult:1.2 };
const TP_CD = 10, TP_QI = 50, TP_RADIUS = 185;

const MOBS = {
  boar:    { name:'Axie Heo Rừng',    lv:1, hp:55,  atk:7,  def:0, xp:28,  silver:[4,9],   speed:52, aggro:130, range:30, atkCd:1.4, size:15, color:'#6b5b4a', eye:'#e8ecff', drop:0.14, el:'Thổ', img:'assets/mobs/boar.png' },
  wolf:    { name:'Axie Gai Tím',  lv:4, hp:160, atk:17, def:3, xp:85,  silver:[10,20],  speed:86, aggro:170, range:30, atkCd:1.2, size:15, color:'#5a5f6b', eye:'#ffd76a', drop:0.17, el:'Mộc', img:'assets/mobs/wolf.png' },
  bandit:  { name:'Tay Sai Gloam',   lv:6, hp:270, atk:24, def:7, xp:140, silver:[15,32], speed:66, aggro:190, range:32, atkCd:1.3, size:16, color:'#4a3a30', eye:'#ff6a5a', sash:'#a03028', drop:0.20, el:'Kim', img:'assets/mobs/bandit.png' },
  assassin:{ name:'Gloam Marauder', lv:10, hp:700, atk:37, def:12, xp:450, silver:[52,89], speed:96, aggro:230, range:34, atkCd:1.1, size:17, color:'#1d1a24', eye:'#c07fe0', elite:true, drop:0.55, el:'Thủy', img:'assets/mobs/assassin.png' },
  boss:    { name:'Thủ Lĩnh Gloam', lv:10, hp:2600, atk:44, def:16, xp:2500, silver:[300,420], speed:78, aggro:480, range:38, atkCd:1.2, size:26, color:'#120f18', eye:'#ff3a3a', boss:true, elite:true, drop:1, el:'Hỏa', img:'assets/mobs/boss.png' },
};
// Quái theo tuyến bản đồ GDD (cấp 1 → 100+)
Object.assign(MOBS, {
  hautu:    { name:'Axie Bí Ngô', lv:2, hp:70, atk:8, def:1, xp:36, silver:[5,10], speed:95, aggro:150, range:26, atkCd:1.1, size:13, color:'#7a6248', eye:'#ffe9a0', drop:0.14, el:'Mộc', img:'assets/mobs/hautu.png' },
  caodo:    { name:'Axie Cỏ Dại', lv:8, hp:300, atk:21, def:4, xp:175, silver:[13,26], speed:100, aggro:180, range:26, atkCd:1.1, size:13, color:'#b05030', eye:'#ffd76a', drop:0.18, el:'Hỏa', img:'assets/mobs/caodo.png' },
  trannhan: { name:'Tượng Đá Canh Cổng', lv:12, hp:440, atk:29, def:10, xp:230, silver:[25,46], speed:55, aggro:160, range:34, atkCd:1.5, size:17, color:'#c88aa8', eye:'#ffffff', drop:0.22, el:'Mộc', skel:'golem', skelPal:{main:'#7d8290',dark:'#565b69',trim:'#9aa2b4',glow:'#7fd0ff'}},
  // ── Bậc 14-24: bộ quái RIÊNG của Petalshade Outskirts. Dùng lại tạo hình có sẵn theo
  // đúng lối MU (Bull Fighter → Elite Bull Fighter): cùng sinh vật, bậc cựu binh mạnh hơn.
  // Trước đây map 2 dùng y hệt bộ quái lv1-9 của map 1 nên không có bậc nào cho khoảng 10-24.
  boar_tusk:  { name:'Heo Rừng Nhiễm Khí', lv:14, hp:520, atk:32, def:11, xp:295, silver:[31,56], speed:60, aggro:140, range:32, atkCd:1.3, size:16, color:'#7a5b48', eye:'#ff8a6a', drop:0.20, el:'Thổ', img:'assets/mobs/boar.png'},
  wolf_alpha: { name:'Gai Tím Đầu Đàn', lv:16, hp:600, atk:36, def:12, xp:355, silver:[37,65], speed:96, aggro:185, range:32, atkCd:1.1, size:16, color:'#48505f', eye:'#ffd76a', drop:0.21, el:'Mộc', img:'assets/mobs/wolf.png'},
  bandit_vet: { name:'Gloam Cựu Binh',   lv:18, hp:680, atk:39, def:13, xp:420, silver:[43,75], speed:84, aggro:200, range:34, atkCd:1.2, size:17, color:'#5a4a3a', eye:'#e8dcb0', drop:0.23, el:'Kim', img:'assets/mobs/bandit.png'},
  caodo_fire: { name:'Cỏ Dại Bén Lửa',  lv:20, hp:760, atk:43, def:13, xp:480, silver:[49,85], speed:104, aggro:190, range:30, atkCd:1.0, size:14, color:'#d4552a', eye:'#ffd76a', drop:0.22, el:'Hỏa', img:'assets/mobs/caodo.png'},
  gloam_scout:{ name:'Trinh Sát Gloam',  lv:22, hp:1300, atk:52, def:20, xp:1035, silver:[110,189], speed:100, aggro:240, range:34, atkCd:1.1, size:18, color:'#1d1a24', eye:'#c07fe0', elite:true, drop:0.55, el:'Thủy', img:'assets/mobs/assassin.png'},
  chimera_bo: { name:'Tượng Đá Vỡ Lệnh',  lv:24, hp:920, atk:50, def:15, xp:605, silver:[61,104], speed:62, aggro:170, range:34, atkCd:1.4, size:18, color:'#b87a9a', eye:'#ffffff', drop:0.24, el:'Thủy', skel:'golem', skelPal:{main:'#6f7d8c',dark:'#4a5563',trim:'#8fb0c4',glow:'#6ae8c0'}},
  phando:   { name:'Bộ Xương Phản Loạn', lv:26, hp:1000, atk:53, def:16, xp:670, silver:[67,114], speed:80, aggro:200, range:34, atkCd:1.2, size:16, color:'#3a9d8b', eye:'#a0ffe9', sash:'#2a6a5c', drop:0.25, el:'Thủy', skel:'skeleton', skelPal:{main:'#8b8f9c',dark:'#3f4450',trim:'#9a8a52',bone:'#ddd6c4',cloth:'#3a5c52',glow:'#a0ffe9'}},
  xanu:     { name:'Chimera Phun Độc', lv:31, hp:1260, atk:64, def:18, xp:840, silver:[79,134], speed:88, aggro:210, range:30, atkCd:1.15, size:16, color:'#5c8a3a', eye:'#c8ffa0', drop:0.27, el:'Mộc', img:'assets/mobs/xanu.png' },
  bandao:   { name:'Axie Sa Ngã', lv:38, hp:1790, atk:81, def:24, xp:1190, silver:[105,175], speed:92, aggro:230, range:36, atkCd:1.1, size:17, color:'#2d3a55', eye:'#9fd0ff', elite:true, drop:0.4, el:'Kim', img:'assets/mobs/bandao.png'},
  thinu:    { name:'Oan Hồn Ổ Ấp', lv:42, hp:2190, atk:89, def:26, xp:1440, silver:[120,195], speed:78, aggro:200, range:34, atkCd:1.2, size:15, color:'#d8d0e8', eye:'#9a86d8', drop:0.28, el:'Mộc', skel:'wraith', skelPal:{main:'#8fa8c0',dark:'#3a4458',cloth:'#5a6a86',bone:'#e0e6f0',glow:'#9fd0ff'}},
  mocnhan:  { name:'Axie Golem', lv:48, hp:3410, atk:101, def:43, xp:1880, silver:[143,230], speed:50, aggro:170, range:36, atkCd:1.5, size:19, color:'#8a6a42', eye:'#e8b04a', drop:0.3, el:'Thổ', img:'assets/mobs/mocnhan.png'},
  huyetbat: { name:'Dơi Chimera', lv:56, hp:2870, atk:122, def:26, xp:2465, silver:[174,275], speed:115, aggro:240, range:28, atkCd:0.95, size:14, color:'#6a1a24', eye:'#ff3a3a', drop:0.32, el:'Hỏa', img:'assets/mobs/huyetbat.png' },
  ttdetu:   { name:'Kẻ Cuồng Tín Lạc Lối', lv:62, hp:4320, atk:144, def:36, xp:3165, silver:[199,314], speed:84, aggro:210, range:34, atkCd:1.15, size:16, color:'#e0779a', eye:'#ffc0d8', sash:'#a04868', drop:0.3, el:'Thổ', skel:'cultist', skelPal:{main:'#c0c6d4',dark:'#2e2438',cloth:'#4a3a5e',trim:'#c8a84a',glow:'#8fe0a8'}},
  docyeu:   { name:'Chimera Cầu Gai', lv:70, hp:5390, atk:166, def:41, xp:4025, silver:[242,378], speed:74, aggro:220, range:38, atkCd:1.3, size:18, color:'#4a7a2a', eye:'#7ec850', drop:0.34, el:'Mộc', poisonHit:true, img:'assets/mobs/docyeu.png'},
  satthuhy: { name:'Sát Thủ Sương Mù', lv:78, hp:6800, atk:200, def:48, xp:5200, silver:[300,400], speed:100, aggro:240, range:34, atkCd:1.0, size:16, color:'#16121e', eye:'#c07fe0', elite:true, drop:0.45, el:'Thủy', img:'assets/mobs/assassin.png' },
  thamtu:   { name:'Trinh Sát Tro Tàn', lv:84, hp:8070, atk:227, def:54, xp:6680, silver:[325,504], speed:96, aggro:230, range:33, atkCd:1.05, size:15, color:'#4a4238', eye:'#ffd76a', drop:0.34, el:'Thổ', img:'assets/mobs/thamtu.png'},
  cungthu:  { name:'Cung Thủ Tro Tàn', lv:92, hp:8070, atk:271, def:52, xp:7920, silver:[369,567], speed:70, aggro:260, range:230, atkCd:1.6, size:15, color:'#7a5a30', eye:'#ffe9a0', drop:0.36, el:'Mộc', ranged:true, img:'assets/mobs/cungthu.png'},
  kybinh:   { name:'Kỵ Sĩ Tro Tàn', lv:100, hp:10300, atk:277, def:77, xp:8820, silver:[406,626], speed:90, aggro:220, range:40, atkCd:1.3, size:21, color:'#1c1c24', eye:'#ff6a5a', elite:true, drop:0.5, el:'Kim', skel:'knight', skelPal:{main:'#6a6f80',dark:'#43485a',trim:'#c8a84a',cloth:'#7a2a30',glow:'#ffb15c'}},
  kylan:    { name:'Chó Ngao Lửa', lv:112, hp:14480, atk:332, def:88, xp:13450, silver:[494,758], speed:94, aggro:240, range:42, atkCd:1.2, size:22, color:'#8a1a10', eye:'#ffd76a', elite:true, drop:0.55, el:'Hỏa', skel:'hound', skelPal:{main:'#8a3a2a',dark:'#5a2418',trim:'#ffb15c',glow:'#ff6a3a',bone:'#e8d0b0'}},
  cuongbinh:{ name:'Cuồng Binh Tro Tàn', lv:102, hp:12220, atk:345, def:67, xp:11645, silver:[445,685], speed:98, aggro:230, range:36, atkCd:1.0, size:17, color:'#5a2a1a', eye:'#ff9a3a', drop:0.42, el:'Thổ', img:'assets/mobs/cuongbinh.png'},
  daokhach: { name:'Axie Cuồng Bão', lv:120, hp:14000, atk:380, def:75, xp:15000, silver:[750,1000], speed:102, aggro:250, range:38, atkCd:0.9, size:17, color:'#3a1010', eye:'#ff3a3a', elite:true, drop:0.6, el:'Hỏa', img:'assets/mobs/daokhach.png'},
  // Axie Lang Thang — "người chơi" NPC trung lập để PK (3 cấp theo map)
  duhiep1:  { name:'Axie Lang Thang', lv:30, hp:1800, atk:70, def:20, xp:900, silver:[90,140], speed:88, aggro:0, range:34, atkCd:1.2, size:16, color:'#4a5a7a', eye:'#dfe8ff', drop:0.5, el:'Kim', duHiep:true, img:'assets/mobs/duhiep.png'},
  duhiep2:  { name:'Axie Lang Thang', lv:60, hp:5200, atk:160, def:42, xp:3600, silver:[260,360], speed:90, aggro:0, range:34, atkCd:1.15, size:16, color:'#5a4a6a', eye:'#dfe8ff', drop:0.55, el:'Thủy', duHiep:true, img:'assets/mobs/duhiep.png'},
  duhiep3:  { name:'Cao Thủ Lang Thang', lv:115, hp:12000, atk:300, def:75, xp:10000, silver:[600,850], speed:94, aggro:0, range:36, atkCd:1.05, size:17, color:'#6a3a3a', eye:'#ffe0a0', elite:true, drop:0.7, el:'Hỏa', duHiep:true, img:'assets/mobs/duhiep.png'},
});
const MOB_IMGS = {};

// Nền bản đồ vẽ tay (thủy mặc sơn thủy) — nạp lười, fallback màu phẳng khi chưa tải xong
const MAP_BG_SRC = {
  daohoa:'assets/maps/bg_daohoa.jpg', tuongduong:'assets/maps/bg_tuongduong.jpg',
  ngoai:'assets/maps/bg_ngoai.jpg', chungnam:'assets/maps/bg_chungnam.jpg',
  comoc:'assets/maps/bg_comoc.jpg', tuyettinh:'assets/maps/bg_tuyettinh.jpg',
  mongco:'assets/maps/bg_mongco.jpg', nhanmon:'assets/maps/bg_nhanmon.jpg',
  pb_daohoa:'assets/maps/bg_dungeon_stone.jpg', pb_ngoai:'assets/maps/bg_dungeon_stone.jpg',
  pb_chungnam:'assets/maps/bg_dungeon_stone.jpg', pb_comoc:'assets/maps/bg_dungeon_stone.jpg',
  pb_mongco:'assets/maps/bg_dungeon_stone.jpg',
  pb_tuyettinh:'assets/maps/bg_dungeon_fire.jpg', pb_nhanmon:'assets/maps/bg_dungeon_fire.jpg',
};
const MAP_BG = {};
for (const k in MAP_BG_SRC){ const im = new Image(); im.src = MAP_BG_SRC[k]; MAP_BG[k] = im; }
for (const k in MOBS){ const im = new Image(); im.src = MOBS[k].img || ''; MOB_IMGS[k] = im; }
// Sourced status-effect overlay clips (axieinfinity/axie-origins-asset-kit web-vfx) — generic (not
// per-class), played once at the moment a status effect actually lands (see playStatusFx below).
// Grid metadata copied from each clip's clip.json (cols/rows/frameW/frameH/frames/fps/anchor).
const VFX_ATLAS_DEFS = {
  stunned:      { cols:8, rows:11, frameW:377, frameH:429, frames:81, fps:30, anchorX:191.4, anchorY:192.5 },
  bleed_apply:  { cols:8, rows:9,  frameW:467, frameH:440, frames:69, fps:30, anchorX:227.4, anchorY:225.0 },
  heal:         { cols:8, rows:9,  frameW:432, frameH:437, frames:70, fps:30, anchorX:215.3, anchorY:220.4 },
  shield:       { cols:8, rows:11, frameW:476, frameH:402, frames:81, fps:30, anchorX:225.6, anchorY:198.9 },
  poison_apply: { cols:8, rows:11, frameW:458, frameH:457, frames:81, fps:30, anchorX:228.2, anchorY:227.7 },
  // 'weak' (stat-debuff aura) is the closest-fit substitute for slow/chill — the kit has no
  // literal slow/freeze clip (see docs/ASSET_SOURCING.md's no-force-fit convention).
  weak:         { cols:8, rows:9,  frameW:494, frameH:497, frames:69, fps:30, anchorX:246.4, anchorY:232.1 },
};
const VFX_ATLAS_IMGS = {};
function getVfxAtlasImg(id){
  let im = VFX_ATLAS_IMGS[id];
  if (!im){ im = new Image(); im.src = 'assets/vfx/' + id + '/atlas.png'; VFX_ATLAS_IMGS[id] = im; }
  return im;
}
function spawnAtlasVfx(id, x, y, scale){
  const def = VFX_ATLAS_DEFS[id]; if (!def) return;
  addEffect({ type:'atlasVfx', id, x, y, scale: scale || 0.4, dur: def.frames / def.fps });
}
// One-shot status-effect cue: generic (not per-class) SFX + atlas-clip overlay, played once at the
// exact moment a status effect is applied (stun/bleed/shield/poison/heal/slow) — not per DoT tick.
function playStatusFx(sfxName, vfxId, x, y, vol, scale){
  AudioSys.sfx(sfxName, vol == null ? 0.55 : vol);
  if (vfxId) spawnAtlasVfx(vfxId, x, y, scale == null ? 0.34 : scale);
}
// Bản phát hành: khóa toàn bộ playtest/cheat — người chơi tự trải nghiệm từ đầu
const RELEASE_BUILD = window.RELEASE_BUILD === true;
// Cây cối & đá theo từng bản đồ (phong cách thủy mặc võ lâm)
const TREE_IMGS = {};
for (const k of ['daohoa','tuongduong','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon']){
  const im = new Image(); im.src = 'assets/trees/' + k + '.png'; TREE_IMGS[k] = im;
}
const ROCK_IMGS = [];
for (let i = 1; i <= 3; i++){ const im = new Image(); im.src = 'assets/trees/rock' + i + '.png'; ROCK_IMGS.push(im); }

// ---------- Bản đồ thế giới (GDD): 3 loại khu vực ----------
const ZONE_TYPES = {
  safe:   { name:'An Toàn', color:'#7ec850', desc:'Không thể PK — giao dịch, nhận nhiệm vụ, Ngồi Thiền.' },
  pk:     { name:'Dã Ngoại · PK', color:'#e8b04a', desc:'Bãi train — bật PK cướp bãi được, nhưng giết Du Hiệp bị Tội Ác (đỏ tên), chết rớt đồ.' },
  freepk: { name:'Huyết Chiến · Free PK', color:'#e84a3a', desc:'PK tự do, không Tội Ác — giết thoải mái.' },
  dungeon:{ name:'Phó Bản', color:'#b08ae8', desc:'Phó bản 3 đợt quái + Boss — farm Tiến Cấp Đan & nguyên liệu tiến cấp kỹ năng.' },
};
// packs: quái đứng thành cụm 5-7 con, đánh 1 con cả cụm lao vào (GDD Mob Mechanics)
const MAPS = {
  daohoa: { name:'Petalshade Isle', min:1, range:'1 - 12', type:'safe', ground:'#ece2c8', patch:'#7a86ad',
    spawn:{ x:460, y:460 }, spawnFrom:{ pb_daohoa:{ x:2250, y:1040 } }, village:true, spring:true, herbs:true, boss:true, trees:70, rocks:26,
    desc:'Home to the Petalshade hatchery — the newcomer\'s hunting ground. Weak Chimeras, starter drops, a gentle place to learn the ropes.',
    // Cụm quái xếp theo vòng từ spawn ra: yếu (boar/hautu) gần nhất → mạnh dần (wolf/bandit/
    // caodo) → xa nhất (assassin, trannhan) gần Cổng Vực — người chơi mới thấy rõ "đi sâu = khó
    // hơn" thay vì gặp ngẫu nhiên cả cụm yếu lẫn cụm elite lẫn lộn quanh spawn.
    packs: [
      { mob:'boar', x:906, y:254, n:6 }, { mob:'boar', x:632, y:876, n:5 },
      { mob:'hautu', x:1000, y:1000, n:6 }, { mob:'wolf', x:1500, y:560, n:7 },
      { mob:'wolf', x:754, y:1555, n:6 }, { mob:'bandit', x:1290, y:1244, n:7 },
      { mob:'bandit', x:1648, y:724, n:7 }, { mob:'caodo', x:1424, y:1445, n:6 },
      { mob:'assassin', x:1900, y:420, n:1 }, // P0: 1 con (trước 5 — NV8 thành bức tường, bot chết 16 lần liên tiếp)
      { mob:'trannhan', x:2043, y:1240, n:5 },
    ], duhiep: null },
  tuongduong: { name:'Lunaris City', min:1, range:'—', type:'safe', ground:'#d8ccb0', patch:'#7a6a4a',
    spawn:{ x:1300, y:1100 }, spawnFrom:{ ngoai:{ x:1300, y:1460 } }, city:true, trees:24, rocks:10,
    desc:'The central hub — Auction Bazaar, the Forge, the Apothecary, the Teahouse. Fully safe: no Chimeras spawn inside the walls. Head out the South Gate to hunt in the Outskirts.',
    packs: [], duhiep: null },
  ngoai: { name:'Petalshade Outskirts', min:10, range:'14 - 24', type:'safe', ground:'#ddd2ae', patch:'#7a7048',
    spawn:{ x:1300, y:330 }, spawnFrom:{ pb_ngoai:{ x:2000, y:1040 } }, reqMain:10, trees:56, rocks:22, herbs:true,
    desc:'Just past the city gates — bandit camps block the road, wolf packs prowl the treeline. No PK here, safe ground to train.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    // Rải theo GRADIENT KHOẢNG CÁCH: sát cổng thành là bậc thấp nhất, càng ra xa bậc càng
    // cao, góc xa nhất là elite — cùng nguyên lý bố trí đồng cỏ quanh thị trấn khởi đầu.
    // Bộ quái RIÊNG của vùng này (bậc 14-24), không dùng lại bộ lv1-12 của Petalshade Isle.
    packs: [
      { mob:'boar_tusk',  x:1300, y:860,  n:6 },  // d≈530  · lv14
      { mob:'boar_tusk',  x:1900, y:560,  n:6 },  // d≈643  · lv14
      { mob:'wolf_alpha', x:551,  y:356,  n:6 },  // d≈749  · lv16
      { mob:'wolf_alpha', x:2000, y:820,  n:7 },  // d≈854  · lv16
      { mob:'bandit_vet', x:900,  y:1200, n:7 },  // d≈958  · lv18
      { mob:'caodo_fire', x:1945, y:1110, n:6 },  // d≈1012 · lv20
      { mob:'gloam_scout',x:1872, y:1520, n:1 },  // d≈1320 · lv22 ELITE
      { mob:'chimera_bo', x:600,  y:1550, n:5 },  // d≈1407 · lv24
    ], duhiep: null },
  chungnam: { name:'Thornwood Reach', min:20, range:'24 - 38', type:'pk', ground:'#d4d0ac', patch:'#6a7a52',
    spawn:{ x:400, y:1500 }, spawnFrom:{ pb_chungnam:{ x:2200, y:890 } }, trees:80, rocks:34,
    desc:'Rivalries start turning ugly here. Chimeras drop basic Card Pages and loose Starbits.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'chimera_bo', x:800, y:1400, n:6 }, { mob:'phando', x:1100, y:900, n:6 },
      { mob:'phando', x:442, y:574, n:6 }, { mob:'xanu', x:1376, y:1272, n:6 },
      { mob:'xanu', x:1981, y:1295, n:6 }, { mob:'bandao', x:2000, y:600, n:5 },
    ], duhiep:'duhiep1' },
  comoc: { name:'Hollow Roost', min:40, range:'42 - 56', type:'pk', ground:'#a89f86', patch:'#4a4436',
    spawn:{ x:400, y:400 }, spawnFrom:{ pb_comoc:{ x:2200, y:990 } }, dark:true, trees:30, rocks:46,
    desc:'A narrow, twisting warren. Dense Chimera packs drop Steed upgrade materials — contested hunting ground.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'thinu', x:557, y:865, n:7 }, { mob:'thinu', x:1200, y:500, n:7 },
      { mob:'mocnhan', x:600, y:1400, n:5 }, { mob:'mocnhan', x:1272, y:1100, n:5 },
      { mob:'huyetbat', x:1900, y:600, n:7 }, { mob:'huyetbat', x:1915, y:1351, n:6 },
    ], duhiep:'duhiep2' },
  tuyettinh: { name:'Frostmire Vale', min:60, range:'62 - 78', type:'pk', ground:'#ddc9a8', patch:'#8a5a6a',
    spawn:{ x:400, y:950 }, spawnFrom:{ pb_tuyettinh:{ x:2200, y:790 } }, trees:60, rocks:24,
    desc:'A massive EXP ground. Bring poison resistance — the Chimeras here bite with venom.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'docyeu', x:1096, y:482, n:6 }, { mob:'ttdetu', x:700, y:1500, n:7 },
      { mob:'ttdetu', x:1131, y:1182, n:7 }, { mob:'docyeu', x:1394, y:895, n:6 },
      { mob:'satthuhy', x:1856, y:1382, n:5 }, { mob:'satthuhy', x:2100, y:500, n:5 },
    ], duhiep:'duhiep2' },
  mongco: { name:'Ashen Steppe', min:80, range:'84 - 100', type:'pk', ground:'#cfc09a', patch:'#7a6a42',
    spawn:{ x:400, y:950 }, spawnFrom:{ pb_mongco:{ x:1720, y:680 } }, trees:36, rocks:30,
    desc:'Wide open plains, tough Chimeras hitting hard. Drops ranged- and blade-art upgrade materials.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'thamtu', x:442, y:574, n:7 }, { mob:'thamtu', x:753, y:1497, n:7 },
      { mob:'cungthu', x:1347, y:979, n:6 }, { mob:'cungthu', x:1300, y:400, n:6 },
      { mob:'kybinh', x:1900, y:1400, n:5 }, { mob:'kybinh', x:2100, y:600, n:5 },
    ], duhiep:'duhiep3' },
  nhanmon: { name:'Stormgate Pass', min:100, range:'102 - 120', type:'freepk', ground:'#b8a68a', patch:'#6a3a2a',
    spawn:{ x:400, y:950 }, spawnFrom:{ pb_nhanmon:{ x:2200, y:890 } }, trees:44, rocks:38,
    desc:'The endgame training ground, out on Lunacia\'s frontier. PK carries no Notoriety here. Chimeras drop golden-tier gear.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'cuongbinh', x:700, y:1400, n:7 }, { mob:'cuongbinh', x:1300, y:660, n:7 }, // bãi 2 vốn nằm LỌT TRONG tường thành trái (850,800,560,350)
      { mob:'kylan', x:1396, y:1312, n:5 }, { mob:'kylan', x:1450, y:1600, n:5 },
      { mob:'daokhach', x:2100, y:500, n:5 }, { mob:'daokhach', x:2250, y:1100, n:5 },
    ], duhiep:'duhiep3' },
  // ---------- PHÓ BẢN: mỗi map một phó bản + boss tương ứng cấp — chỉ vào qua cổng dịch chuyển ----------
  pb_daohoa: { name:'Trial Chamber: Petalshade', min:12, range:'12+', type:'dungeon', ground:'#8a8272', patch:'#3a342a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:20, rocks:34,
    desc:'The isle\'s trial chamber — three waves, then the Gloam Marauder Chieftain. Farm class-tier upgrade essence here.',
    packs: [], duhiep: null },
  pb_ngoai: { name:'Trial Chamber: Outskirts', min:14, range:'14+', type:'dungeon', ground:'#8a8272', patch:'#3a342a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:24, rocks:30,
    desc:'The Outskirts\' trial chamber, guarded by the Bandit Warlord. Farm class-tier upgrade essence here.',
    packs: [], duhiep: null },
  pb_chungnam: { name:'Trial Chamber: Thornwood', min:26, range:'26+', type:'dungeon', ground:'#7e7a68', patch:'#332e24',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:18, rocks:38,
    desc:'Thornwood\'s trial chamber — the Turncoat General waits at the end. Farm class-tier and forge-tier essence here.',
    packs: [], duhiep: null },
  pb_comoc: { name:'Trial Chamber: Hollow Roost', min:46, range:'46+', type:'dungeon', ground:'#6e6a58', patch:'#2a2620',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:12, rocks:44,
    desc:'The Roost\'s trial chamber — the Roost Warden holds the depths. Farm Steed and combo-card upgrade essence here.',
    packs: [], duhiep: null },
  pb_tuyettinh: { name:'Trial Chamber: Frostmire', min:66, range:'66+', type:'dungeon', ground:'#7a6a62', patch:'#38222a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:22, rocks:26,
    desc:'Frostmire\'s trial chamber — the Emberveil Tyrant strikes with venom. Farm high-tier forge gems here.',
    packs: [], duhiep: null },
  pb_mongco: { name:'Trial Chamber: Ashen Steppe', min:86, range:'86+', type:'dungeon', ground:'#7e725a', patch:'#332a1e',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:16, rocks:32,
    desc:'The Steppe\'s trial chamber — the Steppe Khan rules the war-camp within. Farm ranged- and blade-art upgrade essence here.',
    packs: [], duhiep: null },
  pb_nhanmon: { name:'Trial Chamber: Stormgate', min:100, range:'100+', type:'dungeon', ground:'#8a7a66', patch:'#3a241a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:14, rocks:36,
    desc:'Stormgate\'s trial chamber — the Sky Legion Commander stands at the end. The final trial, and the richest reward.',
    packs: [], duhiep: null },
};
let curMap = 'daohoa';
let zoneBanner = null; // { text, sub, color, t }

// ---------- Tường thành & Cổng thành — Tương Dương / Ngoại Ô ----------
// Thành là khu an toàn tuyệt đối: quái không spawn trong thành, tường chặn mọi lối đi,
// chỉ có Cổng Nam dẫn ra Ngoại Ô (có quái). Ngoại Ô có cổng ngược để quay về.
// Bố cục kiểu Lorencia (MU Online): quảng trường vuông rộng ở giữa, tường bao 4 mặt, MỖI MẶT MỘT
// CỔNG (Bắc/Nam/Đông/Tây) toả ra 4 hướng thế giới — thay cho thành hộp kín chỉ có 1 cổng Nam cũ,
// vốn khiến toàn bộ NPC phải chen chúc trong một góc nhỏ.
const CITY_WALL = { map:'tuongduong', x1:700, y1:560, x2:1900, y2:1250, t:24,
  gateX:1300, gateY:905, gateW:132 };   // gateX/gateY: tâm cổng ngang & dọc · gateW: bề rộng lối mở
const GATES = [
  // Cổng đặt NGAY NGOÀI mỗi lối mở trên tường — bước ra khỏi thành là thấy cổng, bấm G để đi.
  { map:'tuongduong', x:1300, y:1400, to:'ngoai',      name:'Cổng Nam → Petalshade Outskirts' },
  { map:'tuongduong', x:1300, y:450,  to:'tuyettinh',  name:'Cổng Bắc → Frostmire Vale' },
  { map:'tuongduong', x:580,  y:905,  to:'daohoa',     name:'Cổng Tây → Petalshade Isle' },
  { map:'tuongduong', x:2020, y:905,  to:'chungnam',   name:'Cổng Đông → Thornwood Reach' },
  { map:'ngoai',      x:1300, y:240,  to:'tuongduong', name:'Qua Cổng Thành → Lunaris City' },
];
let nearGate = null;
function cityWallRects(){
  const w = CITY_WALL, h = w.gateW/2;
  const gx1 = w.gateX - h, gx2 = w.gateX + h;   // lối mở cổng Bắc & Nam
  const gy1 = w.gateY - h, gy2 = w.gateY + h;   // lối mở cổng Tây & Đông
  return [
    { x:w.x1-w.t, y:w.y1-w.t, wd:gx1-(w.x1-w.t), ht:w.t },              // bắc-trái (ôm cả góc)
    { x:gx2,      y:w.y1-w.t, wd:(w.x2+w.t)-gx2, ht:w.t },              // bắc-phải
    { x:w.x1-w.t, y:w.y2,     wd:gx1-(w.x1-w.t), ht:w.t },              // nam-trái
    { x:gx2,      y:w.y2,     wd:(w.x2+w.t)-gx2, ht:w.t },              // nam-phải
    { x:w.x1-w.t, y:w.y1,     wd:w.t, ht:gy1-w.y1 },                    // tây-trên
    { x:w.x1-w.t, y:gy2,      wd:w.t, ht:w.y2-gy2 },                    // tây-dưới
    { x:w.x2,     y:w.y1,     wd:w.t, ht:gy1-w.y1 },                    // đông-trên
    { x:w.x2,     y:gy2,      wd:w.t, ht:w.y2-gy2 },                    // đông-dưới
  ];
}
function collideCityWalls(){
  if (!player || curMap !== CITY_WALL.map) return;
  const r = 13;
  for (const rc of cityWallRects()){
    const cx = clamp(player.x, rc.x, rc.x+rc.wd), cy = clamp(player.y, rc.y, rc.y+rc.ht);
    const d = dist(player.x, player.y, cx, cy);
    if (d < r){
      if (d === 0){ player.y = rc.y - r; continue; }
      player.x = cx + (player.x-cx)/d*r;
      player.y = cy + (player.y-cy)/d*r;
    }
  }
}
// ═══════════ GDD Đợt 2 — A: ĐỊA HÌNH CẢN ĐƯỜNG + ẢI CẤP ═══════════
// Chỉ chặn địa hình LỚN (hồ/sông/núi/tường), đường đi để rộng; rect {x,y,wd,ht} hoặc ellipse {x,y,rx,ry}
const MAP_OBSTACLES = {
  daohoa: [
    // Hiệu chỉnh lại theo màu nước thật của art (bg_daohoa.jpg), đối chiếu từng pixel với
    // toàn bộ NPC/quái/thảo dược/suối/cổng phó bản của map — 2 hình ellipse cũ quá to,
    // đè lên gần 2/3 điểm nội dung (suối tịnh tâm, cổng phó bản, 6/8 bãi thảo dược, hầu hết
    // cụm quái) khiến người chơi bị chặn ngay giữa nơi cần đến. Bộ 5 vùng dưới đây chỉ che
    // đúng phần nước sâu không có nội dung xung quanh — đã kiểm tra không đè lên điểm nào.
    { x:464,  y:146,  rx:192, ry:106 }, // hồ sen góc tây-bắc
    { x:324,  y:1027, rx:229, ry:199 }, // vũng nước tây (cạnh Hầu Tử)
    { x:842,  y:854,  rx:178, ry:139 }, // vũng nước giữa-tây — thu rx, mép cũ chạm bãi boar (632,876)
    { x:1433, y:796,  rx:112, ry:205 }, // dải nước giữa — thu ry, mép cũ nuốt bãi wolf (1500,560)
    { x:1910, y:767,  rx:126, ry:300 }, // vũng nước đông — thu ry, mép cũ nuốt bãi assassin (1900,420)
  ],
  // Ba map dưới đây từng có 0-1 vật cản TRONG LÒNG map: đo tỉ lệ vòng giữa mọi cặp bãi quái ra
  // đúng 1,000 — nghĩa là suốt vòng đời người chơi không có một đoạn đường nào phải né gì cả.
  // Các khối thêm vào chia bãi săn thành "phòng" và ép vài lối đi hẹp, bám theo địa hình trong
  // tranh nền. Mọi khối đã kiểm không đè lên bãi quái / thảo dược / cổng / ải cấp / boss vùng.
  ngoai: [
    { x:2250, y:350, rx:400, ry:310 },  // sông đông-bắc
    { x:2400, y:800, rx:130, ry:140 },  // sông đông — lùi thêm, bản trước vẫn liếm vào cổng phó bản (2250,950)
    { x:140, y:160, rx:360, ry:270 },   // núi tây-bắc
    { x:820,  y:660,  wd:380, ht:110 }, // gờ đá tây — tách bãi bắc khỏi bãi giữa (né Vệ Binh Trụ ng1)
    { x:1500, y:900,  wd:230, ht:110 }, // gờ đá đông — thu ngắn, bản dài 340 chắn ngang trục bãi tây↔đông-nam
    { x:1050, y:1300, wd:300, ht:130 }, // mỏm giữa-nam
    { x:2150, y:1700, rx:200, ry:130 }, // vũng nước đông-nam
  ],
  chungnam: [
    { x:0, y:0, wd:1050, ht:540 },      // núi tây-bắc
    { x:2050, y:0, wd:550, ht:250 },    // núi đông-bắc
    { x:0, y:0, wd:320, ht:1000 },      // dốc tây
    { x:760,  y:1080, wd:300, ht:110 }, // sườn dốc nam — chừa hành lang tây 100px với tảng đá (520,900)
    { x:1150, y:520,  wd:250, ht:120 }, // mỏm bắc, chừa hành lang tới Cổng Rừng Gai
    { x:1450, y:1180, wd:280, ht:110 }, // gờ giữa-nam — KHÔNG chắn ngang hành lang đông (x>1860),
                                        // né cục bộ không vòng nổi khối dài chặn thẳng trục bãi-bãi
    { x:520,  y:900,  rx:140, ry:110 }, // tảng đá tây — chừa khe hẹp 60px với dốc tây
    { x:2150, y:1620, wd:450, ht:110 }, // vách đông-nam (lùi xuống, né Cổng Vực)
  ],
  comoc: [
    { x:0, y:0, wd:1150, ht:260 },      // tường bắc trái (chừa cổng giữa)
    { x:1450, y:0, wd:1150, ht:260 },   // tường bắc phải
    { x:0, y:0, wd:300, ht:1200 },      // tường tây
    { x:2350, y:0, wd:250, ht:1300 },   // tường đông
    { x:0, y:1780, wd:2600, ht:120 },   // tường nam
    // Bám theo tranh nền: bộ rễ khổng lồ bên trái và cổng đá giữa map vốn đã vẽ sẵn, trước đây
    // đi xuyên qua được hết.
    { x:860,  y:700,  wd:260, ht:110 }, // rễ nổi tây-bắc (né Vệ Binh Trụ cm1)
    { x:1360, y:880,  rx:170, ry:125 }, // cổng đá giữa map — chừa khe 70px với rễ tây-bắc
    { x:900,  y:1150, rx:170, ry:120 }, // bộ rễ khổng lồ tây
    { x:1550, y:1500, wd:300, ht:130 }, // gò nam
    { x:1600, y:200,  wd:340, ht:130 }, // vách bắc-đông
  ],
  tuyettinh: [
    { x:0, y:0, wd:2600, ht:280 },      // vách bắc
    { x:0, y:0, wd:160, ht:1400 },      // vách tây
    { x:2420, y:0, wd:180, ht:1900 },   // vách đông
    { x:542, y:704, rx:170, ry:195 },   // suối băng 1 — thu rx, mép cũ nuốt Vệ Binh Trụ tt1 (780,608)
    { x:880, y:1231, rx:200, ry:215 },  // suối băng 2 — dời tây + thu rx, mép cũ nuốt bãi ttdetu (1131,1182)
    { x:1422, y:1671, rx:275, ry:225 }, // suối băng 3
  ],
  mongco: [
    { x:1900, y:830, rx:150, ry:110 },  // lều 1
    { x:2130, y:950, rx:160, ry:120 },  // lều 2
    { x:2300, y:1050, rx:140, ry:100 }, // lều 3
    { x:2380, y:1250, wd:220, ht:650 }, // đá đông-nam
  ],
  nhanmon: [
    { x:850, y:800, wd:560, ht:350 },   // tường thành trái (chừa cổng giữa x1410-1540)
    { x:1540, y:800, wd:560, ht:350 },  // tường thành phải
    { x:850, y:1150, wd:400, ht:610 },  // chân thành tây
    { x:1700, y:1150, wd:400, ht:610 }, // chân thành đông
    { x:0, y:0, wd:1400, ht:380 },      // núi bắc
    { x:0, y:0, wd:260, ht:1200 },      // vách tây
  ],
  tuongduong: [
    { x:0, y:0, wd:2600, ht:340 },       // núi/nền trời phía sau
    // Hiệu chỉnh theo art làng mới (bg_tuongduong.jpg) — dãy nhà chạy dọc mép dưới, chừa cổng thành giữa
    { x:0, y:1280, wd:1200, ht:620 },    // dãy nhà trái
    { x:1400, y:1280, wd:1200, ht:620 }, // dãy nhà phải
  ],
};
const DGN_OBSTACLES = [ // 7 phó bản dùng chung: khung tường đá + cửa nam ở giữa
  { x:0, y:0, wd:2600, ht:280 },
  { x:0, y:1700, wd:1120, ht:200 },
  { x:1480, y:1700, wd:1120, ht:200 },
  { x:0, y:0, wd:330, ht:1900 },
  { x:2270, y:0, wd:330, ht:1900 },
];
// Cây và đá quy đổi thành vật cản. Khảo sát đo được: trước bản này bán kính va chạm của chúng
// bằng 0 — xếp 8 cây to nhất thành hàng rào rồi cho nhân vật đi qua, toạ độ x KHÔNG lệch một
// pixel nào. Thứ mắt nhìn thấy là vật cản và thứ game thực thi là hai chuyện khác hẳn nhau, và
// đó mới là gốc của cảm giác "trôi tuột", không phải chuyện map to hay nhỏ.
// Chỉ dựng lại khi decor đổi (đổi map) — không tính lại mỗi khung hình.
let decorObs = [];
function rebuildDecorObs(){
  decorObs = decor.map(d => d.type === 'tree'
    ? { x:d.x, y:d.y, rx:10 + 8*d.s, ry:7 + 5*d.s }     // gốc cây: dẹt theo phối cảnh nhìn xuống
    : { x:d.x, y:d.y, rx:13*d.s,     ry:8*d.s });        // tảng đá
}
function obstaclesOf(mapId){
  const md = MAPS[mapId];
  if (md && md.dungeon) return DGN_OBSTACLES;
  const base = MAP_OBSTACLES[mapId] || [];
  // decor chỉ tồn tại cho map đang đứng — map khác thì chỉ có vật cản tĩnh
  return mapId === curMap && decorObs.length ? base.concat(decorObs) : base;
}
function inObstacle(mapId, x, y, r){
  for (const o of obstaclesOf(mapId)){
    if (o.wd){
      const cx = clamp(x, o.x, o.x + o.wd), cy = clamp(y, o.y, o.y + o.ht);
      if ((x-cx)*(x-cx) + (y-cy)*(y-cy) < r*r) return true;
    } else {
      if (Math.abs(x - o.x) > o.rx + r || Math.abs(y - o.y) > o.ry + r) continue; // lọc thô
      const dx = (x - o.x)/(o.rx + r), dy = (y - o.y)/(o.ry + r);
      if (dx*dx + dy*dy < 1) return true;
    }
  }
  return false;
}
// Tách phần toán học thuần (điểm x,y → điểm đã né vật cản) khỏi việc mutate 1 entity thật, để
// click-to-move có thể "giả lập trước" đường đi (xem simulateMovePath) bằng đúng công thức này —
// đường preview vẽ ra luôn khớp với đường nhân vật thật sự sẽ đi, không lệch.
function resolveObstaclePoint(x, y, r){
  let px = x, py = y;
  for (const o of obstaclesOf(curMap)){
    if (o.wd){
      const cx = clamp(px, o.x, o.x + o.wd), cy = clamp(py, o.y, o.y + o.ht);
      const dx = px - cx, dy = py - cy, d2 = dx*dx + dy*dy;
      if (d2 < r*r){
        if (d2 > 0.01){ const d = Math.sqrt(d2); px = cx + dx/d*r; py = cy + dy/d*r; }
        else { // tâm lọt hẳn trong rect — đẩy ra cạnh gần nhất
          const l = px - o.x, rr = o.x + o.wd - px, t = py - o.y, bb = o.y + o.ht - py;
          const m = Math.min(l, rr, t, bb);
          if (m === l) px = o.x - r; else if (m === rr) px = o.x + o.wd + r;
          else if (m === t) py = o.y - r; else py = o.y + o.ht + r;
        }
      }
    } else {
      const dx = px - o.x, dy = py - o.y, ax = o.rx + r, ay = o.ry + r;
      if (Math.abs(dx) > ax || Math.abs(dy) > ay) continue;                       // lọc thô
      const n = (dx*dx)/(ax*ax) + (dy*dy)/(ay*ay);
      if (n < 1){
        if (n > 0.0001){ const s = 1/Math.sqrt(n); px = o.x + dx*s; py = o.y + dy*s; }
        else px = o.x + ax;
      }
    }
  }
  px = clamp(px, 20, MAP.w - 20); py = clamp(py, 20, MAP.h - 20); // không đẩy quá mép map
  return { x: px, y: py };
}
function collideObstacles(ent, r){
  const p = resolveObstaclePoint(ent.x, ent.y, r);
  ent.x = p.x; ent.y = p.y;
}
// Click-to-move: giả lập trước đường đi từ (sx,sy) tới (tx,ty) bằng đúng resolveObstaclePoint —
// dùng để vẽ đường preview chấm chấm, luôn khớp với đường nhân vật thật sự sẽ né khi đi tới.
function simulateMovePath(sx, sy, tx, ty){
  const path = [{ x: sx, y: sy }];
  let x = sx, y = sy;
  const stepLen = 30;
  // Bám mép khi bị chặn. Bản cũ ĐỔI BÊN mỗi bước kẹt (`stuck % 2`), nên gặp khối dài là nó dao
  // động tại chỗ thay vì vòng qua — đo được một tuyến ở Thornwood Reach kẹt lại cách đích 555px.
  // Nay chọn HẲN một bên (bên nào thoáng hơn) rồi bám theo tới khi thoát.
  let stuck = 0, side = 0, lastX = sx, lastY = sy;
  const _probe = (px2, py2, base, sg) => {
    for (let t = 1; t <= 8; t++)
      if (inObstacle(curMap, px2 + Math.cos(base + sg*0.9)*stepLen*t, py2 + Math.sin(base + sg*0.9)*stepLen*t, 14)) return t;
    return 99;
  };
  for (let i = 0; i < 200; i++){
    const d = dist(x, y, tx, ty);
    if (d < stepLen){ path.push({ x: tx, y: ty }); break; }
    let ang = Math.atan2(ty - y, tx - x);
    if (stuck > 0){
      if (!side) side = _probe(x, y, ang, 1) >= _probe(x, y, ang, -1) ? 1 : -1;
      ang += side * Math.min(2.0, stuck * 0.35); // chệch tối đa ~115°: đủ để lách khe giữa hai gốc cây
    }
    const nx = x + Math.cos(ang)*stepLen, ny = y + Math.sin(ang)*stepLen;
    const p = resolveObstaclePoint(nx, ny, 14);
    x = p.x; y = p.y;
    path.push({ x, y });
    // Đo "kẹt" bằng QUÃNG ĐƯỜNG đã nhích. Đã thử đo bằng "gần đích hơn" — hỏng nặng: trượt dọc
    // mép gần như không bao giờ rút ngắn đủ, stuck tăng mỗi bước, độ chệch kịch trần tức thì và
    // đường đi xoáy ra góc map (đo được: hụt đích 1954px). Bù lại bằng cách KHÔNG đặt khối chắn
    // ngang trục nối hai bãi quái — né cục bộ chỉ vòng nổi khối ngắn.
    stuck = dist(x, y, lastX, lastY) < stepLen*0.4 ? stuck + 1 : 0;
    if (!stuck) side = 0;   // thoát rồi thì thả bên đã chọn, để lần kẹt sau chọn lại
    lastX = x; lastY = y;
  }
  return path;
}
function setMoveTarget(x, y){
  if (!player || dead) return;
  // AUTO đang bật thì tự dẫn đường riêng (xem update()), click-to-move bị bỏ qua hoàn toàn —
  // trước đây im lặng không báo gì, người chơi tưởng bấm không ăn/game đứng. Phát hiện qua QA.
  if (player.auto){ addFloat(player.x, player.y-40, 'Đang AUTO — tắt AUTO (Z) để tự đi chỗ khác', '#ffb15c', 12); return; }
  const nf = inObstacle(curMap, x, y, 14) ? nearestFree(curMap, x, y) : { x, y };
  moveTarget = { x: nf.x, y: nf.y };
  player._moveRetry = 0;   // đích mới → đếm lại số lần gỡ kẹt
  addEffect({ type:'ring', x: moveTarget.x, y: moveTarget.y, r:20, color:'#9fd8ff' });
}
// Bấm/chuột phải trúng NPC: trả về NPC thay vì chỉ tọa độ, để walkToNpc() có thể tự mở lời thoại
// khi tới nơi — không cần đi tay rồi bấm E riêng
function npcAt(wx, wy){
  for (const n of NPCS) if (n.map === curMap && dist(wx, wy, n.x, n.y-25) < 40) return n;
  return null;
}
function walkToNpc(n){
  if (!player || dead) return;
  npcTalkTarget = n.id;
  setMoveTarget(n.x, n.y);
}
function nearestFree(mapId, x, y){
  if (!inObstacle(mapId, x, y, 16)) return { x, y };
  for (let rad = 60; rad <= 900; rad += 60){
    for (let k = 0; k < 12; k++){
      const a = k/12 * Math.PI*2;
      const nx = clamp(x + Math.cos(a)*rad, 30, MAP.w - 30), ny = clamp(y + Math.sin(a)*rad, 30, MAP.h - 30);
      if (!inObstacle(mapId, nx, ny, 16)) return { x:nx, y:ny };
    }
  }
  const sp = MAPS[mapId] && MAPS[mapId].spawn;
  return sp ? { x:sp.x, y:sp.y } : { x:MAP.w/2, y:MAP.h/2 };
}
// Ải cấp: vòng trấn áp chặn tân thủ vào khu quái mạnh — đủ cấp mới qua
const AI_PASSES = [
  { map:'ngoai',     x:1650, y:1450, r:95,  reqLv:14,  name:'Trại Gloam' },
  { map:'chungnam',  x:1620, y:640,  r:100, reqLv:26,  name:'Cổng Rừng Gai' },
  { map:'comoc',     x:2100, y:400,  r:90,  reqLv:50,  name:'Cửa Tổ Sâu' },
  { map:'tuyettinh', x:1750, y:1100, r:100, reqLv:68,  name:'Cổng Đầm Sương' },
  { map:'mongco',    x:1800, y:520,  r:100, reqLv:88,  name:'Vòng Vây Tro Tàn' },
  { map:'nhanmon',   x:1475, y:1000, r:110, reqLv:104, name:'Cổng Bão Tố' },
];
function collideAiPass(){
  for (const a of AI_PASSES){
    if (a.map !== curMap || player.level >= a.reqLv) continue;
    const d = dist(player.x, player.y, a.x, a.y);
    if (d < a.r){
      const ang = Math.atan2(player.y - a.y, player.x - a.x);
      player.x = a.x + Math.cos(ang)*a.r; player.y = a.y + Math.sin(ang)*a.r;
      if (!player._aiPassT || performance.now() - player._aiPassT > 4000){
        player._aiPassT = performance.now();
        addFloat(player.x, player.y - 50, `⛔ ${a.name} — cần cấp ${a.reqLv} mới qua được!`, '#f0a03a', 14);
        AudioSys.sfx('ui', 0.4);
      }
    }
  }
}
window.SHOW_OBSTACLES = false; // debug: /obstacles trong cheat console — vẽ vùng chặn địa hình để hiệu chỉnh theo art
function drawObstaclesDebug(){
  if (!window.SHOW_OBSTACLES) return;
  // Vẽ theo từng ô lưới nhỏ (thay vì tô nguyên khối ellipse/rect to) — mỗi ô kiểm tra
  // bằng đúng hàm inObstacle() (bán kính 14, giống va chạm nhân vật thật) nên viền hiện ra
  // khớp chính xác vùng chặn thật, dễ soi để hiệu chỉnh theo art hơn 1 khối mờ lớn.
  const TILE = 32;
  const x0 = Math.floor(camera.x/TILE)*TILE, x1 = camera.x + W + TILE;
  const y0 = Math.floor(camera.y/TILE)*TILE, y1 = camera.y + H + TILE;
  ctx.save();
  ctx.fillStyle = 'rgba(232,74,74,.45)';
  ctx.strokeStyle = 'rgba(255,160,160,.9)';
  ctx.lineWidth = 1;
  for (let gy = y0; gy < y1; gy += TILE){
    for (let gx = x0; gx < x1; gx += TILE){
      if (!inObstacle(curMap, gx + TILE/2, gy + TILE/2, 14)) continue;
      ctx.fillRect(gx+1, gy+1, TILE-2, TILE-2);
      ctx.strokeRect(gx+1, gy+1, TILE-2, TILE-2);
    }
  }
  ctx.restore();
}
function drawAiPasses(){
  if (!player) return;
  for (const a of AI_PASSES){
    if (a.map !== curMap || player.level >= a.reqLv) continue;
    const t = performance.now()/600;
    ctx.save();
    ctx.strokeStyle = 'rgba(240,100,60,.55)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 7]); ctx.lineDashOffset = -t*12;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(240,140,80,.95)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`⛔ ${a.name} · cấp ${a.reqLv}`, a.x, a.y - a.r - 8);
    ctx.restore();
  }
}

function updateGate(){
  nearGate = null;
  if (!player || dead) return;
  for (const g of GATES){
    if (g.map !== curMap) continue;
    if (dist(player.x, player.y, g.x, g.y) < 90){ nearGate = g; break; }
  }
}
function drawCityWalls(){
  for (const rc of cityWallRects()){
    ctx.fillStyle = '#8a7a5e'; ctx.fillRect(rc.x, rc.y, rc.wd, rc.ht);
    ctx.fillStyle = '#6e6046'; ctx.fillRect(rc.x, rc.y + rc.ht - 6, rc.wd, 6);
    ctx.strokeStyle = 'rgba(60,48,30,.5)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(rc.x+.5, rc.y+.5, rc.wd-1, rc.ht-1);
    ctx.strokeStyle = 'rgba(60,48,30,.28)'; ctx.lineWidth = 1;
    for (let bx = rc.x + 22; bx < rc.x + rc.wd; bx += 44){
      ctx.beginPath(); ctx.moveTo(bx, rc.y+2); ctx.lineTo(bx, rc.y + rc.ht - 2); ctx.stroke();
    }
  }
}
// ═══════════ QUẢNG TRƯỜNG LUNARIS — bố cục Lorencia + không khí ma mị ═══════════
// Đài phun nước giữa quảng trường, lối lát đá toả ra 4 cổng, trụ đèn + cây khô, quạ đậu trên tường.
function drawCityPlaza(){
  const w = CITY_WALL, cx = w.gateX, cy = w.gateY, t = performance.now()/1000;
  // nền quảng trường lát đá
  ctx.fillStyle = 'rgba(96,88,74,.28)';
  ctx.beginPath(); ctx.ellipse(cx, cy, 300, 210, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(70,62,50,.34)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, 300, 210, 0, 0, 7); ctx.stroke();
  // 4 lối lát đá chạy thẳng ra 4 cổng
  ctx.strokeStyle = 'rgba(112,102,84,.32)'; ctx.lineWidth = 74;
  ctx.beginPath();
  ctx.moveTo(cx, w.y1); ctx.lineTo(cx, w.y2);
  ctx.moveTo(w.x1, cy); ctx.lineTo(w.x2, cy);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,54,44,.22)'; ctx.lineWidth = 1.4;   // mạch đá
  for (let i = -4; i <= 4; i++){
    ctx.beginPath(); ctx.moveTo(cx + i*34, w.y1); ctx.lineTo(cx + i*34, w.y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w.x1, cy + i*34); ctx.lineTo(w.x2, cy + i*34); ctx.stroke();
  }
  // ── đài phun nước trung tâm ──
  ctx.fillStyle = '#6a6152';
  ctx.beginPath(); ctx.ellipse(cx, cy, 74, 44, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4e4738';
  ctx.beginPath(); ctx.ellipse(cx, cy, 64, 36, 0, 0, 7); ctx.fill();
  const wg = ctx.createRadialGradient(cx, cy-6, 3, cx, cy, 60);   // mặt nước ánh lam ma mị
  wg.addColorStop(0, 'rgba(150,210,255,.62)'); wg.addColorStop(1, 'rgba(40,80,130,.55)');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(cx, cy, 58, 31, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 3; i++){                                     // gợn sóng lan
    const k = ((t/2.4) + i/3) % 1;
    ctx.strokeStyle = `rgba(190,235,255,${(1-k)*0.34})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(cx, cy, 10 + k*46, 6 + k*25, 0, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = '#78705e';                                       // trụ đá giữa
  ctx.beginPath(); ctx.moveTo(cx-13, cy-4); ctx.lineTo(cx+13, cy-4);
  ctx.lineTo(cx+8, cy-52); ctx.lineTo(cx-8, cy-52); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8c8474';
  ctx.beginPath(); ctx.ellipse(cx, cy-54, 22, 8, 0, 0, 7); ctx.fill();
  const og = ctx.createRadialGradient(cx, cy-74, 2, cx, cy-74, 26); // quả cầu linh lực trên đỉnh
  og.addColorStop(0, '#dff2ff'); og.addColorStop(0.45, 'rgba(122,190,255,.75)');
  og.addColorStop(1, 'rgba(90,150,230,0)');
  ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy-74, 26 + Math.sin(t*1.6)*2.5, 0, 7); ctx.fill();
  for (let i = 0; i < 4; i++){                                     // nước chảy xuống 4 phía
    const a = i*Math.PI/2 + Math.PI/4;
    ctx.strokeStyle = 'rgba(200,240,255,.42)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a)*16, cy-52);
    ctx.quadraticCurveTo(cx + Math.cos(a)*34, cy-28, cx + Math.cos(a)*44, cy - 4 + Math.sin(a)*8); ctx.stroke();
  }
  // ── trụ đèn 4 góc quảng trường: quầng sáng ấm nhấp nháy ──
  for (const [lx, ly] of [[cx-250, cy-150],[cx+250, cy-150],[cx-250, cy+150],[cx+250, cy+150]]){
    ctx.fillStyle = '#3a3226'; ctx.fillRect(lx-3, ly-46, 6, 46);
    ctx.fillStyle = '#2e2a20';
    ctx.beginPath(); ctx.ellipse(lx, ly+2, 10, 4, 0, 0, 7); ctx.fill();
    const fl = 0.78 + Math.sin(t*7 + lx*0.03)*0.16;                 // ngọn lửa lay động
    const lg = ctx.createRadialGradient(lx, ly-54, 1, lx, ly-54, 46*fl);
    lg.addColorStop(0, `rgba(255,214,140,${0.62*fl})`);
    lg.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly-54, 46*fl, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffca6a'; ctx.beginPath(); ctx.ellipse(lx, ly-54, 5, 7*fl, 0, 0, 7); ctx.fill();
  }
  // ── cây khô trơ cành cạnh quảng trường (chất u ám) ──
  drawDeadTree(cx - 330, cy + 190, t);
  drawDeadTree(cx + 342, cy - 176, t + 2);
  // ── quạ đậu trên tường bắc, thỉnh thoảng vỗ cánh ──
  for (let i = 0; i < 5; i++){
    const bx = w.x1 + 150 + i*230, by = w.y1 - 30;
    const flap = Math.sin(t*2.2 + i*1.7) > 0.93 ? 4 : 0;
    ctx.fillStyle = '#17141f';
    ctx.beginPath(); ctx.ellipse(bx, by - flap, 6, 4.6, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + 5, by - 4 - flap, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx+8, by-4-flap); ctx.lineTo(bx+13, by-3-flap); ctx.lineTo(bx+8, by-2-flap); ctx.closePath(); ctx.fill();
    if (flap){ ctx.beginPath(); ctx.ellipse(bx-3, by-8, 7, 3, -0.5, 0, 7); ctx.fill(); }
  }
}
function drawDeadTree(x, y, t){
  const sway = Math.sin(t*0.5)*0.02;
  ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(0, 2, 26, 8, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2f2822'; ctx.lineCap = 'round';
  ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, -74); ctx.stroke();
  const limb = (bx, by, ex, ey, w2) => { ctx.lineWidth = w2; ctx.beginPath();
    ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx+ex)/2 + 6, (by+ey)/2, ex, ey); ctx.stroke(); };
  limb(-2, -50, -40, -84, 6); limb(-2, -58, 34, -92, 6); limb(-3, -70, -22, -110, 4.5);
  limb(-3, -72, 20, -116, 4.5); limb(-30, -76, -48, -100, 3); limb(26, -84, 44, -108, 3);
  ctx.restore();
}
// Lớp sương mù + tàn lửa trôi — vẽ SAU cùng để phủ lên cả NPC/người chơi, tạo chiều sâu u ám.
// Nhuộm tông chiều tà cho riêng Lunaris City: art nền vốn là ban ngày trời xanh rực rỡ, không hợp
// không khí ma mị — phủ lớp lam-tím tối + vignette để ánh đèn, sương và tàn lửa hiện rõ.
function drawCityMood(){
  const vx = camera.x, vy = camera.y;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const g = ctx.createLinearGradient(vx, vy, vx, vy + H);
  g.addColorStop(0, 'rgba(96,104,158,1)');    // trời ngả tím
  g.addColorStop(0.55, 'rgba(124,120,152,1)');
  g.addColorStop(1, 'rgba(86,84,116,1)');     // mặt đất chìm bóng
  ctx.fillStyle = g; ctx.fillRect(vx, vy, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const vg = ctx.createRadialGradient(vx + W/2, vy + H/2, Math.min(W,H)*0.32,
                                      vx + W/2, vy + H/2, Math.max(W,H)*0.78);
  vg.addColorStop(0, 'rgba(10,8,20,0)'); vg.addColorStop(1, 'rgba(10,8,20,.52)');
  ctx.fillStyle = vg; ctx.fillRect(vx, vy, W, H);
  ctx.restore();
}
function drawCityHaze(){
  const w = CITY_WALL, t = performance.now()/1000;
  ctx.save();
  for (let i = 0; i < 9; i++){                       // dải sương mỏng trôi ngang chậm sát mặt đất
    const seed = i*97.3;
    const fx = w.x1 - 200 + ((t*11 + seed*7) % (w.x2 - w.x1 + 520));
    const fy = w.y1 + 90 + ((seed*13) % (w.y2 - w.y1 - 120));
    const rw = 96 + (seed % 54), rh = 15 + (seed % 9);
    const fg = ctx.createRadialGradient(fx, fy, 2, fx, fy, rw);
    fg.addColorStop(0, 'rgba(172,186,220,.085)'); fg.addColorStop(1, 'rgba(172,186,220,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(fx, fy, rw, rh, 0, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 22; i++){                      // tàn lửa/đom đóm linh hồn bay lên
    const seed = i*53.7;
    const life = ((t*0.32 + seed*0.11) % 1);
    const ex = w.x1 + 60 + ((seed*29) % (w.x2 - w.x1 - 120)) + Math.sin(t*1.1 + seed)*12;
    const ey = w.y2 - 40 - life*(w.y2 - w.y1 - 120);
    const a = Math.sin(life*Math.PI) * 0.55;
    ctx.fillStyle = `rgba(${i%3 ? '190,225,255' : '255,205,140'},${a})`;
    ctx.beginPath(); ctx.arc(ex, ey, 1.6 + (seed % 2), 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawPortal(g){
  const t = performance.now()/1000;
  // đài phát sáng dưới chân
  ctx.fillStyle = 'rgba(120,80,180,.30)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y + 6, 46, 13, 0, 0, 7); ctx.fill();
  // vòng xoáy tím ma mị
  ctx.fillStyle = 'rgba(50,26,80,.5)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y - 34, 24, 38, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 3; i++){
    ctx.strokeStyle = `rgba(176,138,232,${0.8 - i*0.22})`; ctx.lineWidth = 3 - i*0.6;
    ctx.beginPath();
    ctx.ellipse(g.x, g.y - 34, 26 + i*9 + Math.sin(t*2 + i)*3, 40 + i*12 + Math.cos(t*1.6 + i)*4, t*0.7 + i, 0, 7);
    ctx.stroke();
  }
  drawCalligraphy(g.label || 'Phó Bản', g.x, g.y - 96, '#b08ae8', 15);
  if (nearGate === g){
    ctx.strokeStyle = 'rgba(216,186,255,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(g.x, g.y, 58 + Math.sin(t*3)*6, 20, 0, 0, 7); ctx.stroke();
    ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 3; ctx.fillStyle = '#d8baff';
    const txt = 'G — ' + g.name;
    ctx.strokeText(txt, g.x, g.y - 114); ctx.fillText(txt, g.x, g.y - 114);
  }
}
function drawGates(){
  for (const g of GATES){
    if (g.map !== curMap) continue;
    if (g.portal){ drawPortal(g); continue; }
    // hai cột trụ + xà ngang
    ctx.fillStyle = '#4a3826';
    ctx.fillRect(g.x - 73, g.y - 96, 18, 96);
    ctx.fillRect(g.x + 55, g.y - 96, 18, 96);
    ctx.fillStyle = '#5a4630'; ctx.fillRect(g.x - 86, g.y - 106, 172, 16);
    ctx.fillStyle = '#2e2418'; ctx.fillRect(g.x - 78, g.y - 90, 156, 8);
    // đèn lồng hai bên
    for (const s of [-1, 1]){
      ctx.strokeStyle = '#3a2c1e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(g.x + s*64, g.y - 90); ctx.lineTo(g.x + s*64, g.y - 78); ctx.stroke();
      ctx.fillStyle = '#d84a2a'; ctx.beginPath(); ctx.ellipse(g.x + s*64, g.y - 70, 6, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(126,203,255,.85)'; ctx.beginPath(); ctx.ellipse(g.x + s*64, g.y - 70, 2.5, 3.5, 0, 0, 7); ctx.fill();
    }
    drawCalligraphy((g.name || 'Cổng Thành').split(' → ')[0], g.x, g.y - 118, '#6a4a2a', 15);
    if (nearGate === g){
      ctx.strokeStyle = 'rgba(126,203,255,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 58 + Math.sin(performance.now()/300)*6, 20, 0, 0, 7); ctx.stroke();
      ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 3; ctx.fillStyle = '#7ecbff';
      const txt = 'G — ' + g.name;
      ctx.strokeText(txt, g.x, g.y - 136); ctx.fillText(txt, g.x, g.y - 136);
    }
  }
}
const NPCS = [
  { id:'truonglang', name:'Trưởng Làng', map:'daohoa', x:400, y:400, img:'assets/npcs/truonglang.png', talk:'quest' },
  // QA rà soát NPC Lunaris City: Thương Nhân · Chợ Đấu Giá đã bị xoá — cả 3 món trong tiệm đều
  // trùng chỗ khác (Hồ Lô Thuốc = Dược Lão, Thiên Mệnh Phù = mua thẳng trong Rèn Luyện qua buyCharm()),
  // và "Chợ Đấu Giá" chưa từng có cơ chế đấu giá thật — chỉ là tiệm giá cố định như 3 tiệm kia.
  // Tiến Cấp Đan ×3 (món duy nhất không trùng) đã chuyển sang tiệm Dược Lão bên dưới.
  { id:'thoren', name:'Thợ Rèn · Lò Rèn Hoàng Gia', map:'tuongduong', x:1780, y:780, img:'assets/npcs/thoren.png', talk:'forge' },
];
const NPC_IMGS = {};
for (const n of NPCS){ const im = new Image(); im.src = n.img; NPC_IMGS[n.id] = im; }
function mapDef(){ return MAPS[curMap]; }
function zoneType(){ return ZONE_TYPES[mapDef().type]; }

// ---------- Sổ tay kỹ năng: 3 ô cố định (chính/phụ/buff) — xem defaultSkillBar() ----------
const SKILL_DEFS = {
  a:       { unlock:2,  kind:'sectA',  icon:s=>SECT_ART[s].iconA,  desc:s=>`${s.skillA.name} — chiêu thức nhập môn ${s.name}.` },
  amkhi:   { unlock:4,  kind:'amkhi',  name:'Ám Khí', cd:4, qi:15, mult:1.2, icon:()=>'assets/skills/amkhi.png', desc:()=>'Phóng ám khí độc — theo tầng Tấn Chức Ám Khí.' },
  tp:      { unlock:7,  kind:'sectTP', icon:s=>SECT_ART[s].iconTP, desc:s=>`${s.tp.name} — Trấn Phái tuyệt kỹ ${s.name}, sát thương lan.` },
  gangkhi: { unlock:10, kind:'gangkhi', name:'Cương Khí Hộ Thể', cd:10, qi:30, icon:()=>'assets/skills/gangkhi.png',
             req:()=>player.gangkhi.tier>0, reqTxt:'Cương Khí tầng 1 (Tấn Chức)', desc:()=>'6s giảm 30% sát thương gánh chịu — tụ cương khí hộ thể.' },
  danchi:  { unlock:20, kind:'danchi', name:'Đạn Chỉ Thần Thông', cd:8, qi:35, mult:2.0, icon:()=>'assets/skills/danchi.png',
             req:()=>player.dantian.realm>=4, reqTxt:'Ascension cảnh 4 (Spark Tầng 4)', desc:()=>'Chỉ lực xuyên huyệt — sát thương ×2 và phong mạch địch 2.5s.' },
  bow:     { unlock:30, kind:'bow',    name:'Linh Tiễn Xạ', cd:6, qi:28, mult:1.3, icon:()=>'assets/skills/bow.png',
             req:()=>player.bow.tier>0, reqTxt:'Cung Tiễn tầng 1 (Tấn Chức)', desc:()=>'Bắn 3 linh tiễn xuyên thấu quạt trước mặt.' },
  tieuhon: { unlock:20, kind:'tieuhon', name:'Ám Nhiên Tiêu Hồn Chưởng', cd:13, qi:60, mult:3.2, icon:()=>'assets/skills/tieuhon.png',
             req:()=>player.dantian.realm>=6, reqTxt:'Ascension cảnh 6 (Radiant Core Cảnh)', desc:()=>'Chưởng lực âm nhu quét sạch quanh người (AoE lớn).' },
};
const PASSIVE_SKILLS = [
  { name:'Cung Tiễn (bị động)', req:()=>player.bow.tier>0, desc:'Đòn đánh thường có tỉ lệ bắn linh tiễn — theo tầng Cung Tiễn.' },
  { name:'Đạn Chỉ phong mạch (bị động)', req:()=>player.stunProc>0, desc:'5% đòn đánh phong mạch địch — Ascension cảnh 4.' },
  { name:'Thái Cực phản đòn (bị động)', req:()=>player.reflect>0, desc:'Phản lại một phần sát thương — Ascension cảnh 5 / trang bị.' },
  { name:'Bất Tử (bị động)', req:()=>player.batTu, desc:'Chặn 1 đòn chí mạng, hồi 30% HP — Ascension cảnh 8.' },
  { name:'Huyết Ma Thôn Phệ', req:()=>player.bikip && player.bikip.hmtp, desc:'Hút 10% sát thương thành sinh lực + tuyệt chiêu chủ động Huyết Ma Phệ Hồn Chưởng (gán ở bảng K) — cổ thư thất truyền.' },
];

// ═══════════ VÕ HỌC PHỔ — võ học tự do, người chơi tự chọn tuyệt chiêu & hướng đi ═══════════
// phai: võ học môn phái — tự ngộ khi đạt cấp · phai:null = giang hồ — học bằng Bí Kíp (rơi từ tinh anh/boss)
const VH_TIER = {
  so:   { name:'Sơ Cấp',   color:'#c8c8c8', cost:1 },
  trung:{ name:'Trung Cấp',color:'#7ec850', cost:2 },
  cao:  { name:'Cao Cấp',  color:'#b08ae8', cost:3 },
  than: { name:'Thần Cấp', color:'#ffd76a', cost:5 },
};
// MU Online-lite: mỗi lớp chỉ giữ đúng bộ chiêu gốc của lớp đó (không còn giang hồ tự do/dung hợp
// liên phái — MU không có khái niệm này, vũ khí & chiêu thức LÀ bản sắc lớp). Tất cả phai-locked,
// tự ngộ theo cấp độ giống hệt cơ chế sect-skill cũ, chỉ khác là giờ CẢ 5 LỚP đều có đủ bộ thay vì
// chỉ 3/9 Tộc trước đây. skillA/tp (Twisting Slash/Death Stab v.v.) đã nằm ở SECTS, đây là 4-6 chiêu
// bổ sung mỗi lớp — chỉ 1 trong số này (buff) còn nằm ở taskbar 3 ô, còn lại đã dồn thành % Công
// Kích vĩnh viễn (xem LEGACY_SECT_SKILLS). Giữ nguyên 2 id 'tienthiencong'/'songthu' vì có code khác gọi thẳng
// theo id (auto-hồi sinh & miễn hồi chiêu) — chỉ đổi tên hiển thị + đổi phai sang lớp mới.
const VOHOC_DEFS = {
  // ── Dark Knight ──
  dk_cyclone:    { name:'Cyclone', school:'Dark Knight', phai:'thieulam', tier:'so', cat:'Cận Chiến', type:'aoe', unlock:15, cd:7, qi:20, mult:1.8, color:'#4c8dff', icon:'assets/skills/vh_dk_cyclone.png', glyph:'◉', fx:{ r:150, kb:40 }, desc:'Xoay tít vũ khí quanh thân — đánh trúng mọi địch trong tầm gần.' },
  dk_ragefulblow:{ name:'Rageful Blow', school:'Dark Knight', phai:'thieulam', tier:'trung', cat:'Cận Chiến', type:'aoe', unlock:25, cd:8, qi:24, mult:2.2, color:'#3a6fd8', icon:'assets/skills/vh_dk_rageful.png', glyph:'✹', fx:{ r:170, kb:55, stun:0.8 }, desc:'Giáng vũ khí xuống đất — chấn động, hất văng & choáng nhẹ.' },
  dk_crescent:   { name:'Crescent Moon Slash', school:'Dark Knight', phai:'thieulam', tier:'cao', cat:'Cận Chiến', type:'cone', unlock:35, cd:6, qi:20, mult:2.0, color:'#6aa0ff', icon:'assets/skills/vh_dk_crescent.png', glyph:'☾', fx:{ pierce:true }, desc:'Một đường chém hình trăng lưỡi liềm — xuyên thấu hàng dài địch.' },
  dk_fortitude:  { name:'Greater Fortitude', school:'Dark Knight', phai:'thieulam', tier:'cao', cat:'Bị Động', type:'passive', unlock:45, color:'#8ab8ff', icon:'assets/skills/vh_dk_fortitude.png', glyph:'♦', desc:'Bị động: +15% HP, +10% giảm sát thương.' },
  tienthiencong: { name:'Undying Will', school:'Dark Knight', phai:'thieulam', tier:'than', cat:'Bị Động', type:'passive', unlock:60, color:'#ffe9a8', icon:'assets/skills/vh_dk_undying.png', glyph:'✦', desc:'Bị động: chết tự hồi sinh 50% HP — mỗi 300s một lần.' },
  // ── Dark Wizard ──
  dw_lightning:  { name:'Lightning', school:'Dark Wizard', phai:'baidasan', tier:'so', cat:'Pháp Thuật', type:'proj', unlock:15, cd:5, qi:18, mult:1.7, color:'#7ec850', icon:'assets/skills/vh_dw_lightning.png', glyph:'⚡', fx:{ kb:20 }, desc:'Một tia sét đánh thẳng vào địch, có thể hất văng.' },
  dw_evilspirit: { name:'Evil Spirit', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'aoe', unlock:25, cd:7, qi:26, mult:2.0, color:'#6ab850', icon:'assets/skills/vh_dw_evilspirit.png', glyph:'✦', fx:{ r:150 }, desc:'Giải phóng năng lượng bóng tối quanh người — sát thương diện rộng.' },
  dw_ice:        { name:'Ice', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'proj', unlock:35, cd:6, qi:20, mult:1.6, color:'#5ac8e8', icon:'assets/skills/vh_dw_ice.png', glyph:'❄', fx:{ slow:{ pct:0.5, t:3 } }, desc:'Băng giá xuyên thấu — trúng đòn làm chậm mục tiêu.' },
  dw_twister:    { name:'Twister', school:'Dark Wizard', phai:'baidasan', tier:'cao', cat:'Pháp Thuật', type:'proj', unlock:45, cd:6, qi:24, mult:1.8, color:'#8ac850', icon:'assets/skills/vh_dw_twister.png', glyph:'◉', fx:{ multi:3, pierce:true }, desc:'Ba cơn lốc xuyên phá — quét qua mọi địch trên đường đi.' },
  dw_nova:       { name:'Nova', school:'Dark Wizard', phai:'baidasan', tier:'than', cat:'Pháp Thuật', type:'aoe', unlock:55, cd:10, qi:35, mult:2.8, color:'#ffd76a', icon:'assets/skills/vh_dw_nova.png', glyph:'★', fx:{ r:180, big:true }, desc:'Dồn năng lượng ánh sáng rồi bùng nổ toàn diện — chiêu mạnh nhất phái.' },
  songthu:       { name:'Arcane Insight', school:'Dark Wizard', phai:'baidasan', tier:'than', cat:'Bị Động', type:'passive', unlock:60, color:'#d8d8f0', icon:'assets/skills/vh_dw_arcane.png', glyph:'✧', desc:'Bị động: 30% chiêu vừa tung không tốn hồi chiêu.' },
  // Chiêu buff (ô 3 cố định — xem BUFF_SKILL_ID/defaultSkillBar): Dark Wizard mỏng máu nhất nên
  // được 1 khiên chắn tạm thời, bù lại lúc đứng lại tụ phép giữa tầm xa 420.
  dw_shield:     { name:'Soul Barrier', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'buff', unlock:15, cd:10, qi:26, color:'#7ec850', icon:'assets/skills/vh_dw_shield.png', glyph:'♦', fx:{ shieldPct:45, t:6 }, desc:'Khiên hồn ma bao bọc — hấp thụ sát thương bằng 45% HP tối đa trong 6s.' },
  // ── Sylvan Ranger ──
  elf_heal:      { name:'Heal', school:'Sylvan Ranger', phai:'toanchan', tier:'so', cat:'Bị Động', type:'passive', unlock:15, color:'#3a9d8b', icon:'assets/skills/vh_elf_heal.png', glyph:'✚', desc:'Bị động: tự hồi 1% HP tối đa mỗi giây.' },
  elf_greaterdef:{ name:'Greater Defense', school:'Sylvan Ranger', phai:'toanchan', tier:'trung', cat:'Bị Động', type:'passive', unlock:30, cd:10, qi:25, color:'#5ac8b8', icon:'assets/skills/vh_elf_greaterdef.png', glyph:'✚', fx:{ shieldPct:40, t:6 }, desc:'Khiên năng lượng — hấp thụ sát thương bằng 40% HP tối đa trong 6s.' },
  // Chiêu buff (ô 3 cố định): Greater Damage — đúng bản sắc Sylvan Ranger hỗ trợ trong MU Online.
  elf_greaterdmg:{ name:'Greater Damage', school:'Sylvan Ranger', phai:'toanchan', tier:'cao', cat:'Hỗ Trợ', type:'buff', unlock:15, cd:10, qi:28, color:'#7ecbff', icon:'assets/skills/vh_elf_greaterdmg.png', glyph:'⚔', fx:{ dmgPct:35, t:6 }, desc:'Cường hoá sức mạnh — +35% sát thương trong 6s.' },
  elf_swiftwind: { name:'Swift Wind', school:'Sylvan Ranger', phai:'toanchan', tier:'than', cat:'Bị Động', type:'passive', unlock:55, cd:8, qi:20, color:'#a0ffe9', icon:'assets/skills/vh_elf_swiftwind.png', glyph:'✽', fx:{ selfEva:{ pct:45, t:4 } }, desc:'Gió nhanh theo bước chân — +45% né trong 4s.' },
  // ── Spellblade ──
  mg_powerslash: { name:'Power Slash', school:'Spellblade', phai:'minhgiao', tier:'so', cat:'Lai', type:'cone', unlock:15, cd:6, qi:20, mult:1.8, color:'#e8552a', icon:'assets/skills/vh_mg_powerslash.png', glyph:'⚔', fx:{}, desc:'Một đường kiếm khí quét ngang, dồn cả nội lực vào lưỡi kiếm.' },
  mg_frostnova:  { name:'Frost Nova', school:'Spellblade', phai:'minhgiao', tier:'trung', cat:'Lai', type:'aoe', unlock:30, cd:8, qi:26, mult:2.0, color:'#5ac8e8', icon:'assets/skills/vh_mg_frostnova.png', glyph:'❄', fx:{ r:150, slow:{ pct:0.4, t:3 } }, desc:'Bùng nổ băng giá quanh thân — làm chậm mọi địch trong tầm.' },
  mg_ironwill:   { name:'Iron Will', school:'Spellblade', phai:'minhgiao', tier:'cao', cat:'Bị Động', type:'passive', unlock:40, color:'#ffb060', icon:'assets/skills/vh_mg_ironwill.png', glyph:'◆', desc:'Bị động: +10% HP, +8% giảm sát thương.' },
  // Chiêu buff (ô 3 cố định): hybrid cận-pháp — tăng cả sát thương lẫn khí thế trận đấu.
  mg_battlefury: { name:'Battle Fury', school:'Spellblade', phai:'minhgiao', tier:'trung', cat:'Lai', type:'buff', unlock:15, cd:10, qi:26, color:'#ff9a5a', icon:'assets/skills/vh_mg_battlefury.png', glyph:'⚔', fx:{ dmgPct:30, t:6 }, desc:'Dồn cả nội lẫn ngoại lực — +30% sát thương trong 6s.' },
  mg_flamestrike:{ name:'Flame Storm', school:'Spellblade', phai:'minhgiao', tier:'than', cat:'Lai', type:'aoe', unlock:55, cd:11, qi:38, mult:3.0, color:'#ff7a3a', icon:'assets/skills/vh_mg_flamestorm.png', glyph:'☼', fx:{ r:200, kb:60, big:true }, desc:'Bão lửa nuốt trọn cả một vùng — chiêu bộc phát mạnh nhất phái.' },
  // ── Dark Lord ──
  dl_electricspark:{ name:'Electric Spark', school:'Dark Lord', phai:'bug', tier:'so', cat:'Chỉ Huy', type:'proj', unlock:15, cd:5, qi:18, mult:1.6, color:'#8a9a3a', icon:'assets/skills/vh_dl_spark.png', glyph:'⚡', fx:{ stun:0.8 }, desc:'Tia điện từ quyền trượng — trúng đòn choáng nhẹ.' },
  dl_darkspirit: { name:'Dark Spirit', school:'Dark Lord', phai:'bug', tier:'trung', cat:'Chỉ Huy', type:'aoe', unlock:30, cd:7, qi:24, mult:2.0, color:'#6a7a2a', icon:'assets/skills/vh_dl_darkspirit.png', glyph:'✦', fx:{ r:160 }, desc:'Triệu hồi u linh vây quanh — sát thương diện rộng.' },
  dl_chaoticdiseier:{ name:'Chaotic Diseier', school:'Dark Lord', phai:'bug', tier:'cao', cat:'Chỉ Huy', type:'proj', unlock:40, cd:6, qi:22, mult:1.8, color:'#a8b85a', icon:'assets/skills/vh_dl_chaotic.png', glyph:'✦', fx:{ multi:3, pierce:true }, desc:'Ném quyền trượng xoay tít — xuyên thấu hàng dài địch.' },
  dl_darkraven:  { name:'Dark Raven', school:'Dark Lord', phai:'bug', tier:'than', cat:'Chỉ Huy', type:'aoe', unlock:55, cd:10, qi:34, mult:2.6, color:'#2a1a3a', icon:'assets/skills/vh_dl_raven.png', glyph:'☾', fx:{ r:180, kb:40, big:true }, desc:'Bầy quạ đen lao xuống xé nát mọi thứ trong tầm — chiêu chỉ huy tối thượng.' },
  // Chiêu buff (ô 3 cố định): khí thế chỉ huy — dồn sức cho bản thân lẫn bầy tùy tùng theo sau.
  dl_commandaura:{ name:'Command Aura', school:'Dark Lord', phai:'bug', tier:'trung', cat:'Chỉ Huy', type:'buff', unlock:15, cd:10, qi:26, color:'#a0b04a', icon:'assets/skills/vh_dl_command.png', glyph:'⚑', fx:{ dmgPct:25, t:6 }, desc:'Hào khí chỉ huy lan tỏa — +25% sát thương trong 6s.' },
};
// ═══════════ TỐI GIẢN TASKBAR: 3 Ô CỐ ĐỊNH KIỂU MU ONLINE ═══════════
// Mỗi phái chỉ còn đúng 3 chiêu chủ động — 1 chiêu chính (skillA), 1 chiêu phụ (Trấn Phái), 1 buff có
// thời gian riêng từng phái — thay vì 5 ô người chơi tự gán. Toàn bộ chiêu Võ Học Phổ còn lại (Cyclone,
// Nova, Flame Storm...) + hệ Tấn Chức phụ (Ám Khí/Đạn Chỉ/Linh Tiễn/Tiêu Hồn) không mất giá trị — dồn
// thành % Công Kích vĩnh viễn, tự động theo cấp/điều kiện đã có, không cần bấm nút nữa (xem calcDerived()
// và LEGACY_SECT_SKILLS bên dưới).
const BUFF_SKILL_ID = { thieulam:'gangkhi', toanchan:'elf_greaterdmg', baidasan:'dw_shield', minhgiao:'mg_battlefury', bug:'dl_commandaura' };
function defaultSkillBar(sect){ return ['a', 'tp', BUFF_SKILL_ID[sect] || null]; }
// Tuyệt Học Cũ: mỗi tầng quy đổi thành % Công Kích vĩnh viễn — điều kiện mở giữ nguyên (tự ngộ theo
// cấp cho chiêu môn phái qua vhLearned(), hoặc điều kiện Tấn Chức riêng cho 4 kỹ năng phổ thông).
const LEGACY_TIER_PCT = { so:1.5, trung:2, cao:2.5, than:3.5 };
const LEGACY_SECT_SKILLS = ['dk_cyclone','dk_ragefulblow','dk_crescent',
  'dw_lightning','dw_evilspirit','dw_ice','dw_twister','dw_nova',
  'elf_greaterdef','elf_swiftwind',
  'mg_powerslash','mg_frostnova','mg_flamestrike',
  'dl_electricspark','dl_darkspirit','dl_chaoticdiseier','dl_darkraven'];
const LEGACY_UNIVERSAL_PCT = { amkhi:1.5, danchi:2, bow:2, tieuhon:3 };
// Đăng ký võ học chủ động vào SKILL_DEFS — dùng chung cho castSkill(); chỉ chiêu buff (BUFF_SKILL_ID)
// thực sự nằm ở taskbar 3 ô, còn lại chỉ tồn tại để tính legacyAtkPct và hiển thị ở tab Tuyệt Học Cũ
for (const _vid in VOHOC_DEFS){
  const _v = VOHOC_DEFS[_vid];
  if (_v.type === 'passive') continue;
  SKILL_DEFS[_vid] = { unlock:_v.unlock, kind:'vh', desc:_v.desc,
    // icon đọc động (getter) thay vì chụp giá trị một lần: cho phép probeSkillIcons() thay bằng icon
    // tự sinh khi file art khai báo chưa tồn tại — xem genSkillIcon() ngay dưới SECT_ART.
    get icon(){ return _v.icon; },
    req:()=>vhLearned(_vid),
    // Lưu ý: chuỗi này tính NGAY lúc nạp module (player chưa tồn tại) nên không được đọc player ở đây.
    reqTxt:`Tự ngộ khi đạt cấp ${_v.unlock} nếu đúng Lớp — khác Lớp cần ${VH_TIER[_v.tier].cost} 📜 Sách Kỹ Năng (bấm K → Tuyệt Học Cũ)` };
}
// MU không có khái niệm "dung hợp liên phái" — hệ Dung Hợp (30 chiêu) đã bị cắt hẳn theo hướng tối
// giản. Giữ FUSION_DEFS rỗng (thay vì xoá luôn định danh) để mọi chỗ tham chiếu cũ (vòng lặp/lookup)
// vẫn chạy an toàn — chỉ đơn giản là không còn chiêu dung hợp nào để tìm thấy nữa.
const FUSION_DEFS = {};

// ═══════════ CẤP KỸ NĂNG 1-120 — +2,5% ST & −0,25% hồi chiêu mỗi cấp · mốc cảnh giới · ⚡tiến hóa 40/80/120 ═══════════
function skLv(id){ return (player && player.skillLv && player.skillLv[id]) || 1; }
function skLvMult(id){ return 1 + (skLv(id) - 1) * 0.025; }
function skUpCost(id){ return Math.round(150 * Math.pow(skLv(id), 1.45)); }
// Instinct (player.khi) — nơi tiêu DUY NHẤT của chỉ số này. Trước đây nó tích lũy từ đánh quái/thiền/
// nhiệm vụ rồi hiện thường trực trên HUD mà không tiêu được ở đâu cả (nơi tiêu cũ là tự tay xung Kinh
// Mạch, đã bị thay bằng tự động theo cấp) — một con số vô nghĩa cứ tăng mãi. Đường cong thoải hơn bạc
// (mũ 1.1 so với 1.45) để nó là "tài nguyên farm tự nhiên có sẵn", không phải bức tường chặn.
function skUpKhi(id){ return Math.round(30 * Math.pow(skLv(id), 1.1)); }

// GDD Đợt 2 B6: mốc cảnh giới chiêu 20-120 (nhân dồn với +2.5% ST/cấp)
const SK_MILESTONES = [
  { lv:20,  name:'Tiểu Thành', dmg:0.08 },
  { lv:40,  name:'Trung Thành', cd:0.10 },
  { lv:60,  name:'Đại Thành',   dmg:0.12 },
  { lv:80,  name:'Viên Dung',   qi:0.12 },
  { lv:100, name:'Xuất Thần',   dmg:0.15 },
  { lv:120, name:'Hóa Cảnh',    dmg:0.20 },
];
function skMile(id){
  const lv = skLv(id); let dmg = 1, cd = 1, qi = 1;
  for (const m of SK_MILESTONES){
    if (lv >= m.lv){ if (m.dmg) dmg *= 1 + m.dmg; if (m.cd) cd *= 1 - m.cd; if (m.qi) qi *= 1 - m.qi; }
  }
  return { dmg, cd, qi };
}
// GDD Tiến Hóa Chiêu Thức: mỗi cấp −0,25% hồi chiêu (tối đa −30% ở Lv120) — cuối game tung chiêu liên tục, không khoảng chết
function skCdScale(id){ return Math.max(0.7, 1 - (skLv(id) - 1) * 0.0025); }
function effCd(id, base){ return Math.max(0.5, (base || 0) * (player.vhCdMult || 1) * skMile(id).cd * skEvoMult(id).cd * skCdScale(id)); }
// Tiến hóa chiêu ở mốc Lv 40/80/120 (bậc 0-3): kiếm/đạo/sóng/vòng nổ tăng theo bậc — vd Lục Mạch 1→2→3→4 kiếm
function evoStage(id){ const lv = skLv(id); return lv >= 120 ? 3 : lv >= 80 ? 2 : lv >= 40 ? 1 : 0; }
// ═══ Tiến Hóa Chiêu Thức — chọn nhánh (Skill Evolution Choice Nodes) ═══
// Ở mỗi mốc 40/80/120, ngoài phần tự động (thêm kiếm/sóng — evoStage ở trên, không đổi),
// người chơi chọn 1 trong 2 nhánh cho bậc đó: Bá Đạo (dồn sát thương) hoặc Tốc Chiến (dồn tốc/tiết kiệm).
// Lựa chọn lưu vĩnh viễn theo từng chiêu, độc lập giữa các chiêu — đa dạng build không tốn art mới.
const EVO_LVS = [40, 80, 120];
const EVO_PATHS = {
  power: { name:'Bá Đạo', desc:'+14% sát thương của chiêu này (dồn theo bậc)', dmg:0.14 },
  swift: { name:'Tốc Chiến', desc:'−9% hồi chiêu & −6% tiêu hao Qi của chiêu này (dồn theo bậc)', cd:0.09, qi:0.06 },
};
function skEvoMult(id){
  const arr = (player && player.skillEvo && player.skillEvo[id]) || [];
  let dmg = 1, cd = 1, qi = 1;
  for (const k of arr){
    const p = EVO_PATHS[k]; if (!p) continue;
    if (p.dmg) dmg *= 1 + p.dmg; if (p.cd) cd *= 1 - p.cd; if (p.qi) qi *= 1 - p.qi;
  }
  return { dmg, cd, qi };
}
function showEvoChoice(id, stageIdx){
  const stName = ['Trung Thành · Lv40', 'Viên Dung · Lv80', 'Hóa Cảnh · Lv120'][stageIdx] || '';
  document.getElementById('overlay-inner').innerHTML = `
    <h2 style="letter-spacing:2px">⚡ Tiến Hóa Chiêu Thức</h2>
    <p style="margin-bottom:10px"><b style="color:#ffd76a">${skillInfo(id).name}</b> đạt mốc <b>${stName}</b> —
    chọn một nhánh tiến hóa (vĩnh viễn cho bậc này, không ảnh hưởng các chiêu khác):</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      ${Object.entries(EVO_PATHS).map(([k, p]) => `
        <button class="choice-card" style="max-width:230px;font-size:13px;line-height:1.6;text-align:left" onclick="window.chooseEvoPath('${id}',${stageIdx},'${k}')">
          <b style="font-size:15px;color:#7ecbff">${p.name}</b><br><span style="font-weight:400;opacity:.9">${p.desc}</span>
        </button>`).join('')}
    </div>`;
  document.getElementById('overlay').classList.remove('hidden');
}
window.chooseEvoPath = function(id, stageIdx, path){
  if (!EVO_PATHS[path]) return;
  if (!player.skillEvo) player.skillEvo = {};
  if (!player.skillEvo[id]) player.skillEvo[id] = [];
  player.skillEvo[id][stageIdx] = path;
  document.getElementById('overlay').classList.add('hidden');
  addFloat(player.x, player.y-58, `⚡ ${skillInfo(id).name} — ${EVO_PATHS[path].name}!`, '#ffd76a', 13);
  AudioSys.sfx('levelup', 0.6);
  addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#ffd76a' });
  saveGame(); renderSkillPanel();
};
// Kiểm tra im lặng cho phím Space (không bắn float báo lỗi)
function canCastSilent(id){
  if (!player || dead || id == null || !SKILL_DEFS[id]) return false;
  if ((player.cd[id] || 0) > 0) return false;
  const _inf = skillInfo(id);
  if (!_inf.unlocked) return false;
  if (player.qi < Math.max(1, Math.round(_inf.qi * skMile(id).qi * skEvoMult(id).qi))) return false;
  return true;
}
function milestoneTxt(m){ return m.dmg ? `+${m.dmg*100}% sát thương` : m.cd ? `−${m.cd*100}% hồi chiêu` : `−${m.qi*100}% tiêu hao Qi`; }
window.upgradeSkillUI = function(id){
  const lv = skLv(id);
  if (lv >= 120){ addFloat(player.x, player.y-40, 'Kỹ năng đã viên mãn (Lv 120)!', '#8a8a8a', 12); return; }
  if (lv >= player.level){ addFloat(player.x, player.y-40, `Cấp kỹ năng ≤ cấp nhân vật (${player.level})`, '#8a8a8a', 12); return; }
  const cost = skUpCost(id), khiCost = skUpKhi(id);
  if (player.silver < cost){ addFloat(player.x, player.y-40, `Cần ${cost.toLocaleString()} bạc`, '#8a8a8a', 12); return; }
  if ((player.khi || 0) < khiCost){ addFloat(player.x, player.y-40, `Cần ${khiCost.toLocaleString()} Instinct (đánh quái / ngồi thiền để tích)`, '#7fd8e0', 12); return; }
  const _msI = SK_MILESTONES.findIndex(x => x.lv === lv + 1);
  const _tdNeed = _msI >= 0 ? _msI + 1 : 0; // đột phá cảnh giới chiêu: mốc 20→1💠, 40→2💠 ... 120→6💠
  if ((player.tamdac || 0) < _tdNeed){ addFloat(player.x, player.y-40, `Đột phá ${SK_MILESTONES[_msI].name} cần ${_tdNeed} 💠 Tâm Đắc (hạ tinh anh/boss)`, '#7df9ff', 12); return; }
  player.silver -= cost;
  player.khi -= khiCost;
  if (_tdNeed) player.tamdac -= _tdNeed;
  if (!player.skillLv) player.skillLv = {};
  player.skillLv[id] = lv + 1;
  const _ms = _msI >= 0 ? SK_MILESTONES[_msI] : null; // GDD Đợt 2 B6: đạt mốc cảnh giới chiêu
  const _evoIdx = _ms ? EVO_LVS.indexOf(_ms.lv) : -1; // 40/80/120 — mốc tiến hóa có chọn nhánh
  if (_ms){
    zoneBanner = { text:'◑ ' + skillInfo(id).name, sub:`Đạt mốc ${_ms.name} (cấp ${lv+1}) — ${milestoneTxt(_ms)}${_evoIdx >= 0 ? ' · ⚡ CHIÊU THỨC TIẾN HÓA!' : ''}`, color:'#ffb15c', t:3.5 };
    AudioSys.sfx('quest', 0.8);
    addEffect({ type:'ring', x:player.x, y:player.y, r:80, color:'#ffb15c', big:true });
  }
  addFloat(player.x, player.y-52, `⬆ ${skillInfo(id).name} → Lv ${lv + 1}!`, '#6ae88a', 13);
  AudioSys.sfx('levelup', 0.4);
  saveGame(); renderSkillPanel();
  if (_evoIdx >= 0) showEvoChoice(id, _evoIdx); // yêu cầu chọn nhánh tiến hóa ngay
};
window.reopenEvoChoiceUI = function(id, stageIdx){ showEvoChoice(id, stageIdx); };
function evoBadgeHtml(id){
  // Huy hiệu nhánh tiến hóa đã chọn (Bá/Tốc mỗi bậc) + nút chọn lại nếu đã đạt mốc mà chưa chọn
  const _stg = evoStage(id), arr = (player.skillEvo && player.skillEvo[id]) || [];
  let out = '';
  for (let i = 0; i < _stg; i++){
    const p = EVO_PATHS[arr[i]];
    if (p) out += `<span style="font-size:9px;color:#ffd76a;margin-right:2px" title="Bậc ${i+1}: ${p.name} — ${p.desc}">${p === EVO_PATHS.power ? '⚔' : '💨'}</span>`;
    else out += `<button class="mini-btn" style="font-size:9px;padding:1px 4px;margin-right:2px;border-color:#7df9ff;color:#7df9ff" title="Chưa chọn nhánh tiến hóa bậc ${i+1} — bấm để chọn" onclick="window.reopenEvoChoiceUI('${id}',${i})">?</button>`;
  }
  return out;
}
function upBtnHtml(id){
  const lv = skLv(id);
  const _spB = `<button class="mini-btn" style="margin-right:3px;${player.spaceSkill === id ? 'border-color:#7df9ff !important;color:#7df9ff !important;' : ''}" title="Gán chiêu này vào phím Space (thay đòn đánh thường; hồi chiêu/thiếu Qi thì tự quay về đòn thường)" onclick="window.assignSpaceUI('${id}')">${player.spaceSkill === id ? '⌨✓' : '⌨'}</button>`;
  if (lv >= 120) return `${_spB}<span style="font-size:10px;color:#ffd76a;margin-right:4px">VIÊN MÃN · HÓA CẢNH ⚡3</span>${evoBadgeHtml(id)}`;
  const nm = SK_MILESTONES.find(x => x.lv > lv);
  const cur = [...SK_MILESTONES].reverse().find(x => lv >= x.lv);
  const _msI = SK_MILESTONES.findIndex(x => x.lv === lv + 1);
  const _tdNeed = _msI >= 0 ? _msI + 1 : 0;
  const _stg = evoStage(id);
  return `${_spB}<button class="mini-btn vh-learn-btn" style="margin-right:3px" title="Cấp ${lv}/120${cur ? ' · ' + cur.name : ''} · ⚡tiến hóa bậc ${_stg}/3 (mốc 40/80/120, mỗi mốc chọn nhánh Bá Đạo/Tốc Chiến) — nâng: ${skUpCost(id).toLocaleString()} bạc + ${skUpKhi(id).toLocaleString()} Instinct${_tdNeed ? ` + ${_tdNeed} 💠 Tâm Đắc đột phá` : ''}, +2,5% ST, −0,25% hồi chiêu${nm ? ` · mốc kế ${nm.name} (cấp ${nm.lv}): ${milestoneTxt(nm)}` : ''} · cấp kỹ năng ≤ cấp nhân vật" onclick="window.upgradeSkillUI('${id}')">⬆${lv}${_stg ? '⚡' + _stg : ''}${_tdNeed ? '💠' + _tdNeed : ''}</button>${evoBadgeHtml(id)}`;
}
window.assignSpaceUI = function(id){
  if (!player) return;
  player.spaceSkill = (player.spaceSkill === id) ? null : id;
  addFloat(player.x, player.y-64, player.spaceSkill ? `⌨ Phím Space → ${skillInfo(id).name}` : '⌨ Phím Space → Đòn đánh thường', '#7df9ff', 13);
  AudioSys.sfx('ui', 0.5);
  saveGame(); renderSkillPanel();
};
// Dung Hợp (ghép 2 chiêu liên phái) đã bị cắt hẳn cùng đợt MU-hoá — MU không có khái niệm này.
function vhLearned(id){ return !!(player && player.vohoc && player.vohoc[id]); }
function learnVohoc(id){
  const v = VOHOC_DEFS[id];
  if (!v || vhLearned(id)) return;
  player.vohoc[id] = true;
  calcDerived(); saveGame();
  addFloat(player.x, player.y-66, `✦ Ngộ được: ${v.name}!`, VH_TIER[v.tier].color, 16);
  zoneBanner = { text:'TUYỆT HỌC', sub:`${v.school} · ${v.name} — +${LEGACY_TIER_PCT[v.tier] || 0}% Công Kích vĩnh viễn (xem K → Tuyệt Học Cũ)`, color:VH_TIER[v.tier].color, t:3.5 };
  AudioSys.sfx('quest', 0.9);
}
// Sách Kỹ Năng (bikipVH) — đường tiêu duy nhất: học tuyệt học NGOẠI LỚP. Võ học của chính lớp mình
// vẫn tự ngộ miễn phí theo cấp (vhAutoLearn), còn 4 lớp kia phải mua bằng Sách Kỹ Năng — hoặc nhận
// sạch miễn phí khi Thăng Tiên. QA: điều kiện cũ là `v.phai` → luôn true sau đợt MU-hoá (mọi chiêu
// đều phai-locked), khiến hàm này không bao giờ chạy được và Sách Kỹ Năng thành tiền tệ chết.
function crossClassLearnable(id){
  const v = VOHOC_DEFS[id];
  return !!(v && v.phai && v.phai !== player.sect && LEGACY_SECT_SKILLS.includes(id));
}
window.learnVohocUI = function(id){
  const v = VOHOC_DEFS[id];
  if (!v || vhLearned(id) || !crossClassLearnable(id)) return;
  const cost = VH_TIER[v.tier].cost;
  if (player.level < v.unlock){ addFloat(player.x, player.y-40, `Cần cấp ${v.unlock}`, '#8a8a8a', 12); return; }
  if ((player.bikipVH || 0) < cost){ addFloat(player.x, player.y-40, `Thiếu Sách Kỹ Năng (cần ${cost})`, '#ffb15c', 12); return; }
  player.bikipVH -= cost;
  learnVohoc(id);
  renderSkillPanel();
};
function vhAutoLearn(){ // võ học môn phái tự ngộ khi đạt cấp — mỗi lớp học đúng bộ chiêu của lớp mình
  for (const _vid in VOHOC_DEFS){
    const _v = VOHOC_DEFS[_vid];
    if (!_v.phai || vhLearned(_vid) || player.level < _v.unlock) continue;
    if (!player.ascended && _v.phai !== player.sect) continue; // Starflight: môn phái phá bỏ — võ học toàn tự do
    learnVohoc(_vid);
  }
}
function vhKnockback(m, ang, px){
  if (m.def.bossKind) px *= 0.35; // boss nặng cân — khó hất văng
  m.x = clamp(m.x + Math.cos(ang)*px, 30, MAP.w-30);
  m.y = clamp(m.y + Math.sin(ang)*px, 30, MAP.h-30);
}

// ═══════════ VFX TUYỆT CHIÊU — mỗi thần công một hình ảnh riêng, không trùng lặp ═══════════
// VH_VFX: võ học chủ động · style → drawVfx, proj → drawProjStyled.
// SECT_VFX: 16 tuyệt chiêu môn phái (8 chiêu chính sx_*_a + 8 trấn phái sx_*_c) — hình ảnh riêng từng phái
const SECT_VFX = {
  sx_thieulam_a: { style:'windslash',    c2:'#cfe8ff' },                      // Twisting Slash (Dark Knight) — chém xoáy cuốn gió
  sx_thieulam_c: { style:'fist',         c2:'#ffe9a0' },                      // Đại Lực Kim Cương Chưởng — chưởng ấn khổng lồ
  sx_toanchan_a: { style:'flash',        c2:'#d8f4ff', proj:'arrow' },        // Multi-Shot (Sylvan Ranger) — loạt tên bắn tỉa
  sx_toanchan_c: { style:'hexa',         c2:'#c8ecff', spin:1.5 },            // Thất Tinh Hội Kiếm — trận Bắc Đẩu thất tinh
  sx_baidasan_a: { style:'flash',        c2:'#b8ff9a', proj:'serpent' },      // Poison (Dark Wizard) — xà tiêu độc
  sx_baidasan_c: { style:'meteor',       c2:'#ffcf7a' },                      // Meteor (Dark Wizard) — vẫn thạch lửa giáng thế
  sx_minhgiao_a: { style:'fireslash',    c2:'#ffcf7a' },                      // Fire Slash (Spellblade) — đao quang cuốn lửa
  sx_minhgiao_c: { style:'vortex',       c2:'#ff9a5a', spin:2.8 },            // Flame Strike (Spellblade) — vòng xoáy lửa
  // QA: Dark Lord (sect id 'bug') chưa từng có entry nào ở đây — cả chiêu chính lẫn Trấn Phái đều rơi
  // về style mặc định chung chung, là lớp DUY NHẤT không có hình ảnh nhận diện riêng khi tung chiêu.
  sx_bug_a:      { style:'windslash',    c2:'#d0e07a' },                      // Force Wave (Dark Lord) — sóng chấn quyền trượng
  sx_bug_c:      { style:'demonburst',   c2:'#ffb15c' },                      // Fire Scream (Dark Lord) — ma hỏa gào thét tỏa ra
  sx_vophai_a:   { style:'fist',         c2:'#e8d8a8' },                      // Du Hiệp Quyền — quyền kình
  sx_vophai_c:   { style:'stormhost',    c2:'#e4ebff' },                      // Tứ Hải Giai Phục — sóng chưởng tứ hải
};
// VH_VFX: hình ảnh riêng cho chiêu Võ Học Phổ. Sau đợt MU-hoá chỉ còn Dark Raven cần entry
// riêng (các style khác đã gắn thẳng vào SECT_VFX theo lớp).
const VH_VFX = {
  dl_darkraven:{ style:'crowswarm', c2:'#ff5a3a' },   // Dark Raven (Dark Lord) — bầy quạ đen xoáy vào
};
function _vxLine(x1, y1, x2, y2){ ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function _vxBolt(x, y, ang, len, w, col){
  ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.globalAlpha = Math.min(1, ctx.globalAlpha);
  ctx.beginPath(); ctx.moveTo(x, y);
  const n = 6;
  for (let i = 1; i <= n; i++){
    const t = i / n, off = (i < n ? rnd(-w, w) : 0);
    ctx.lineTo(x + Math.cos(ang)*len*t + Math.cos(ang + Math.PI/2)*off, y + Math.sin(ang)*len*t + Math.sin(ang + Math.PI/2)*off);
  }
  ctx.stroke();
  ctx.lineWidth = 1.1; ctx.strokeStyle = '#fff'; ctx.stroke();
}
function _vxSword(x, y, ang, len, col, al){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len*0.78, -3.2); ctx.lineTo(len, 0); ctx.lineTo(len*0.78, 3.2); ctx.closePath(); ctx.fill();
  ctx.fillRect(-7, -1.6, 9, 3.2); ctx.fillRect(-1.5, -6.5, 3, 13);
  ctx.restore();
}
function _vxPetal(x, y, rot, s, col, al){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al; ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0, 0, s, s*0.45, 0, 0, 7); ctx.fill(); ctx.restore();
}
function _vxFlake(x, y, s, col, al){
  ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.globalAlpha = al;
  for (let i = 0; i < 3; i++){ const a = i*Math.PI/3; _vxLine(x - Math.cos(a)*s, y - Math.sin(a)*s, x + Math.cos(a)*s, y + Math.sin(a)*s); }
}
function _vxGlyph(x, y, ch, s, col, al){
  ctx.globalAlpha = al; ctx.font = `bold ${Math.round(s)}px "Noto Serif", serif`; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 3; ctx.strokeText(ch, x, y + s*0.35);
  ctx.fillStyle = col; ctx.fillText(ch, x, y + s*0.35);
}
function drawVfx(e, k, a){
  const S = e.style, X = e.x, Y = e.y, F = e.face || 0, R = e.r || 100, C1 = e.c1 || '#fff', C2 = e.c2 || '#fff', G = e.glyph || '✦';
  const spin = e.ang || 0;
  ctx.save(); ctx.lineCap = 'round';
  const arc  = (x, y, r, a0, a1, c, w, al) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), a0, a1); ctx.stroke(); };
  const disc = (x, y, r, c, al) => { ctx.fillStyle = c; ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, 7); ctx.fill(); };
  const poly = (x, y, r, n, rot, c, w, al) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha = al; ctx.beginPath(); for (let i = 0; i <= n; i++){ const aa = rot + i*2*Math.PI/n; i ? ctx.lineTo(x + Math.cos(aa)*r, y + Math.sin(aa)*r) : ctx.moveTo(x + Math.cos(aa)*r, y + Math.sin(aa)*r); } ctx.stroke(); };
  if (S === 'flash'){ // tia sáng xuất chiêu (proj)
    arc(X, Y, R*(0.4 + k*0.7), F - 1, F + 1, C1, 5*(1-k) + 2, a*0.9);
    _vxGlyph(X + Math.cos(F)*R*0.5, Y + Math.sin(F)*R*0.5, G, 20, C2, a*0.9);
  } else if (S === 'shock'){ // vòng đệm chung
    arc(X, Y, R*(0.2 + k*0.8), 0, 7, C1, 4, a*0.8);
    arc(X, Y, R*0.55*(0.3 + k*0.7), 0, 7, C2, 2.5, a*0.6);
  } else if (S === 'vortex'){ // Hấp Tinh / Bắc Minh — hắc động xoáy hút vào
    const rr = R*(1.05 - k*0.5);
    disc(X, Y, R*0.32*(1 - k*0.4), C2, a*0.55);
    for (let i = 0; i < 5; i++){ const a0 = i*1.2566 + spin + k*6; arc(X, Y, rr, a0, a0 + 1.4, C1, 4.5, a*0.9); }
    arc(X, Y, rr*0.6, spin - k*8, spin - k*8 + 4, C2, 2.5, a*0.7);
    _vxGlyph(X, Y, G, 24, C1, a*0.9);
  } else if (S === 'fist'){ // Thất Thương / La Hán / Liên Hoa — sóng quyền đứt quãng chồng lớp
    for (let i = 0; i < 4; i++){ const kk = k*1.3 - i*0.12; if (kk <= 0) continue;
      ctx.setLineDash([10, 7]); arc(X, Y, R*(0.25 + Math.min(1, kk)*0.75)*(1 - i*0.12), F - 0.7, F + 0.7, i%2 ? C2 : C1, 6 - i, a*0.85); }
    ctx.setLineDash([]);
    _vxGlyph(X + Math.cos(F)*R*0.55, Y + Math.sin(F)*R*0.55, G, 30, C2, a);
  } else if (S === 'frost'){ // Huyền Minh — mảnh băng nhọn xé không khí
    for (let i = 0; i < 9; i++){ const ang = F + (i-4)*0.22; const L = R*(0.35 + k*0.65)*(0.75 + ((i*37)%10)/22);
      const tx = X + Math.cos(ang)*L, ty = Y + Math.sin(ang)*L;
      ctx.fillStyle = i%2 ? C1 : C2; ctx.globalAlpha = a*0.85; ctx.beginPath();
      ctx.moveTo(tx + Math.cos(ang)*12, ty + Math.sin(ang)*12);
      ctx.lineTo(tx + Math.cos(ang + 2.4)*7, ty + Math.sin(ang + 2.4)*7);
      ctx.lineTo(tx + Math.cos(ang - 2.4)*7, ty + Math.sin(ang - 2.4)*7); ctx.closePath(); ctx.fill(); }
    arc(X, Y, R*(0.3 + k*0.5), F - 1, F + 1, C2, 2.5, a*0.7);
  } else if (S === 'sunwheel'){ // Cửu Dương / Thuần Dương — mặt trời tia sáng quay
    const rr = R*(0.55 + k*0.3);
    arc(X, Y, rr, 0, 7, C1, 5, a*0.9);
    for (let i = 0; i < 12; i++){ const aa = i*0.5236 + spin; ctx.strokeStyle = C2; ctx.lineWidth = 3; ctx.globalAlpha = a*0.8;
      _vxLine(X + Math.cos(aa)*(rr + 6), Y + Math.sin(aa)*(rr + 6), X + Math.cos(aa)*(rr + 16*(1-k) + 8), Y + Math.sin(aa)*(rr + 16*(1-k) + 8)); }
    _vxGlyph(X, Y, G, 30, C2, a);
  } else if (S === 'dragonwave'){ // Long Tượng / Thái Cực / Hàng Long — long ảnh cuộn sóng
    for (let j = 0; j < 3; j++){ ctx.strokeStyle = j ? C2 : C1; ctx.lineWidth = 5 - j*1.3; ctx.globalAlpha = a*0.85; ctx.beginPath();
      for (let i = 0; i <= 20; i++){ const t = i/20; const xx = X - R*0.9 + t*R*1.8; const yy = Y + Math.sin(t*9 + j*1.3 + k*7)*R*0.28*(1 + t*0.4);
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
    _vxGlyph(X, Y - R*0.4, G, 30, C2, a*0.9);
  } else if (S === 'crescents'){ // Hồ Gia / Võ Đang — trăng lưỡi liềm chồng nhau
    for (let i = 0; i < 3; i++){ arc(X, Y, R*(0.35 + k*0.6) + i*14, F - 0.85, F + 0.85, i%2 ? C2 : C1, 6 - i*1.5, a*0.9); }
  } else if (S === 'petals'){ // Chiết Mai / Bích Ba — cánh hoa cuốn thành chưởng ấn
    for (let i = 0; i < 10; i++){ const ang = F + (i - 4.5)*0.19; const L = R*(0.2 + k*0.75)*(0.7 + ((i*53)%10)/20);
      _vxPetal(X + Math.cos(ang)*L, Y + Math.sin(ang)*L, ang + k*5, 5.5, i%2 ? C1 : C2, a*0.85); }
    _vxGlyph(X + Math.cos(F)*R*0.5, Y + Math.sin(F)*R*0.5, G, 22, C2, a*0.7);
  } else if (S === 'suns'){ // Lục Dương / Đả Cẩu — quang cầu li hoan quanh người
    for (let i = 0; i < 6; i++){ const aa = i*1.0472 + spin + k*4; const rr = R*(0.25 + k*0.55);
      const ox = X + Math.cos(aa)*rr, oy = Y + Math.sin(aa)*rr*0.8;
      disc(ox, oy, 9*(1-k) + 4, i%2 ? C1 : C2, a*0.9); disc(ox, oy, 3, '#fff', a); }
    arc(X, Y, R*(0.3 + k*0.65), 0, 7, C1, 3.5, a*0.6);
  } else if (S === 'hexa'){ // Bát Hoang / Bát Quái — trận đồ lục tinh
    const rr = R*(0.5 + k*0.35);
    poly(X, Y, rr, 3, spin, C1, 3.5, a*0.9); poly(X, Y, rr, 3, spin + Math.PI/3, C2, 3.5, a*0.9);
    for (let i = 0; i < 6; i++){ const aa = i*1.0472 + spin; disc(X + Math.cos(aa)*rr, Y + Math.sin(aa)*rr, 3.5, C2, a*0.8); }
    _vxGlyph(X, Y, G, 22, C1, a);
  } else if (S === 'bonemist'){ // Hóa Cốt — miên chưởng sương xương trắng xám
    for (let i = 0; i < 7; i++){ const ang = F + (i-3)*0.3; const L = R*(0.25 + k*0.6)*(0.8 + ((i*29)%10)/25);
      disc(X + Math.cos(ang)*L, Y + Math.sin(ang)*L, 10*(1-k) + 4, i%2 ? C1 : C2, a*0.4); }
    for (let i = 0; i < 3; i++){ const ang = F + (i-1)*0.5; ctx.strokeStyle = C2; ctx.lineWidth = 2.5; ctx.globalAlpha = a*0.8;
      _vxLine(X + Math.cos(ang)*R*0.2, Y + Math.sin(ang)*R*0.2, X + Math.cos(ang)*R*(0.4 + k*0.5), Y + Math.sin(ang)*R*(0.4 + k*0.5)); }
  } else if (S === 'vajra'){ // Kim Cang / Thái Cực Kiếm — kim cang phạn ấn quay
    poly(X, Y, R*(0.45 + k*0.2), 4, spin, C1, 4, a*0.9);
    poly(X, Y, R*(0.45 + k*0.2), 4, spin + Math.PI/4, C2, 2.5, a*0.7);
    disc(X, Y, 8, C2, a*0.8); _vxGlyph(X, Y, G, 22, C1, a);
  } else if (S === 'galaxy'){ // Thái Huyền / Vô Tướng — tinh hà vận chuyển
    for (let i = 0; i < 14; i++){ const aa = i*0.4488 + spin; const rr = R*(0.2 + ((i*31)%10)/10*0.7)*(0.6 + k*0.4);
      disc(X + Math.cos(aa)*rr, Y + Math.sin(aa)*rr, 1.8 + ((i*17)%3), i%3 ? C2 : C1, a*0.9); }
    arc(X, Y, R*0.5, spin, spin + 4.5, C1, 3, a*0.7);
    _vxGlyph(X, Y, G, 26, C2, a);
  } else if (S === 'demonburst'){ // Thiên Ma / Cáp Mô — ma hỏa phóng từ mặt đất
    for (let i = 0; i < 8; i++){ const aa = i*0.7854; const L = R*(0.35 + k*0.6)*(i%2 ? 1 : 0.7);
      ctx.fillStyle = i%2 ? C2 : C1; ctx.globalAlpha = a*0.85; ctx.beginPath();
      ctx.moveTo(X + Math.cos(aa - 0.14)*R*0.25, Y + Math.sin(aa - 0.14)*R*0.25);
      ctx.lineTo(X + Math.cos(aa)*L, Y + Math.sin(aa)*L);
      ctx.lineTo(X + Math.cos(aa + 0.14)*R*0.25, Y + Math.sin(aa + 0.14)*R*0.25); ctx.closePath(); ctx.fill(); }
    _vxGlyph(X, Y, G, 26, C2, a);
  } else if (S === 'devourmaw'){ // Phệ Thiên — ma khẩu thôn phệ
    disc(X, Y, R*(0.4 + k*0.15), C2, a*0.6);
    for (let i = 0; i < 10; i++){ const aa = i*0.628 + spin + k*3; const rr = R*(0.42 + k*0.1);
      const tx = X + Math.cos(aa)*rr, ty = Y + Math.sin(aa)*rr;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = a*0.85; ctx.beginPath();
      ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(aa + 0.3)*7, ty + Math.sin(aa + 0.3)*7); ctx.lineTo(tx + Math.cos(aa - 0.3)*7, ty + Math.sin(aa - 0.3)*7); ctx.closePath(); ctx.fill(); }
    arc(X, Y, R*(0.55 + k*0.15), spin, spin + 5, C1, 4, a*0.8);
  } else if (S === 'bloodclaw'){ // Huyết Ma / Hắc Nguyệt Bạch Cốt Trảo / Trảm Ma — trảo huyết 3 nhát
    for (let i = 0; i < 3; i++){ const off = (i-1)*0.35; arc(X, Y, R*(0.4 + k*0.55) + i*12, F + off - 0.55, F + off + 0.55, i === 1 ? C2 : C1, 5, a*0.9); }
    for (let i = 0; i < 6; i++){ const ang = F + (i - 2.5)*0.4; const L = R*(0.3 + k*0.6); disc(X + Math.cos(ang)*L, Y + Math.sin(ang)*L, 2.5, C1, a*0.8); }
  } else if (S === 'swordride'){ // Ngự Kiếm — kiếm quang xé gió + tàn ảnh
    const x0 = e.x0 != null ? e.x0 : X, y0 = e.y0 != null ? e.y0 : Y;
    for (let i = 0; i < 3; i++){ const t = i/3; _vxSword(x0 + (X-x0)*t, y0 + (Y-y0)*t, F, 30, i ? C2 : C1, a*(1 - t*0.5)); }
    ctx.strokeStyle = C1; ctx.lineWidth = 6; ctx.globalAlpha = a*0.9; _vxLine(x0, y0, X, Y);
    ctx.strokeStyle = C2; ctx.lineWidth = 2; _vxLine(x0, y0, X, Y);
  } else if (S === 'wuxing'){ // vòng nguyên tố — 5 sắc quang xoay
    const x0 = e.x0 != null ? e.x0 : X, y0 = e.y0 != null ? e.y0 : Y;
    const cols = [C1, C2, '#ffd76a', '#8ae8c8', '#ff9ae0'];
    for (let i = 1; i <= 5; i++){ const t = i/5; arc(x0 + (X-x0)*t, y0 + (Y-y0)*t, 10 + 6*(1-k), F - 0.9, F + 0.9, cols[i-1], 4, a*0.85); }
  } else if (S === 'thunderpillar'){ // Cửu Thiên Huyền Lôi — lôi trụ giáng thế
    for (let i = 0; i < 3; i++){ const aa = F + i*2.094 + 0.5; const px = X + Math.cos(aa)*R*0.55, py = Y + Math.sin(aa)*R*0.55;
      _vxBolt(px, py - R*0.7, Math.PI/2, R*0.7, R*0.14, i%2 ? C2 : C1); }
    arc(X, Y, R*(0.3 + k*0.6), 0, 7, C1, 3, a*0.6);
  } else if (S === 'phoenix'){ // Hỏa Phượng / Thánh Hỏa — song dực liệt hỏa + tro lửa
    arc(X - R*0.25, Y, R*(0.3 + k*0.5), Math.PI*0.95, Math.PI*1.85, C1, 6, a*0.9);
    arc(X + R*0.25, Y, R*(0.3 + k*0.5), Math.PI*1.15, Math.PI*2.05, C1, 6, a*0.9);
    for (let i = 0; i < 10; i++){ const t = ((i*37)%10)/10; disc(X + Math.sin(i*2.3 + k*8)*R*0.4, Y + R*0.3 - t*R*(0.6 + k*0.4), 2.5, i%2 ? C1 : C2, a*0.8); }
    _vxGlyph(X, Y, G, 24, C2, a);
  } else if (S === 'icecage'){ // Huyền Băng — hàn khí kết tinh
    ctx.fillStyle = C2; ctx.globalAlpha = a*0.25; ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y, R*(0.4 + k*0.55), F - 0.9, F + 0.9); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++){ const ang = F + (i - 2.5)*0.3; const L = R*(0.3 + k*0.6); _vxFlake(X + Math.cos(ang)*L, Y + Math.sin(ang)*L, 6*(1-k) + 3, i%2 ? C1 : C2, a*0.9); }
  } else if (S === 'seal4'){ // Ấn Trấn — vuông ấn + bốn dấu bốn phương
    poly(X, Y, R*(0.45 + k*0.25), 4, Math.PI/4, C1, 4, a*0.9);
    const bs = ['★', '◆', '▲', '⚔'];
    for (let i = 0; i < 4; i++){ const aa = i*Math.PI/2 - Math.PI/2; _vxGlyph(X + Math.cos(aa)*R*0.5, Y + Math.sin(aa)*R*0.5, bs[i], 18, C2, a*(1 - k*0.5)); }
    disc(X, Y, 6, C1, a*0.9);
  } else if (S === 'icefield'){ // Băng Phong — băng nguyên phủ sóng
    disc(X, Y, R*(0.4 + k*0.6), C2, a*0.18);
    arc(X, Y, R*(0.4 + k*0.6), 0, 7, C1, 4, a*0.85);
    for (let i = 0; i < 8; i++){ const aa = i*0.7854 + 0.4; _vxFlake(X + Math.cos(aa)*R*(0.5 + k*0.4), Y + Math.sin(aa)*R*(0.5 + k*0.4), 5, i%2 ? C1 : C2, a*0.8); }
  } else if (S === 'stormhost'){ // Lôi Đình — vạn quân sấm tỏa
    for (let i = 0; i < 7; i++){ _vxBolt(X, Y, i*0.8976 + 0.3, R*(0.35 + k*0.6), R*0.1, i%2 ? C1 : C2); }
    arc(X, Y, R*0.4*(1 + k), 0, 7, C2, 2.5, a*0.5);
  } else if (S === 'buddhapalm'){ // Niết Bàn — phật chưởng giáng thế
    const pr = R*(0.4 + k*0.5);
    ctx.fillStyle = C1; ctx.globalAlpha = a*0.85;
    ctx.beginPath(); ctx.ellipse(X, Y, pr*0.42, pr*0.5, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 5; i++){ const fx = X + (i-2)*pr*0.2; const fl = pr*(0.34 + (i === 2 ? 0.12 : (i%2 ? 0.04 : 0)));
      ctx.beginPath(); ctx.ellipse(fx, Y - pr*0.5 - fl*0.5, pr*0.085, fl*0.55, 0, 0, 7); ctx.fill(); }
    _vxGlyph(X, Y, '✦', pr*0.5, C2, a);
  } else if (S === 'windslash'){ // Twisting Slash (Dark Knight) — chém xoáy cuốn gió
    const rr = R*(0.35 + k*0.55);
    arc(X, Y, rr, F - 0.95, F + 0.95, C1, 6*(1 - k*0.4), a*0.9);
    for (let i = 0; i < 4; i++){
      const wa = F + (i - 1.5)*0.35, L1 = rr*0.55, L2 = rr*(0.95 + i*0.05);
      ctx.strokeStyle = C2; ctx.lineWidth = 2; ctx.globalAlpha = a*0.7;
      ctx.beginPath();
      for (let s2 = 0; s2 <= 8; s2++){ const tt = s2/8; const ang2 = wa + tt*0.6*(i%2 ? 1 : -1); const rL = L1 + (L2-L1)*tt;
        const px = X + Math.cos(ang2)*rL, py = Y + Math.sin(ang2)*rL; s2 ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    _vxGlyph(X + Math.cos(F)*rr*0.6, Y + Math.sin(F)*rr*0.6, G, 22, C2, a*0.85);
  } else if (S === 'fireslash'){ // Fire Slash (Spellblade) — đao quang cuốn lửa
    const rr = R*(0.35 + k*0.6);
    arc(X, Y, rr, F - 0.8, F + 0.8, C1, 7*(1 - k*0.3), a*0.9);
    arc(X, Y, rr*0.92, F - 0.7, F + 0.7, '#fff2c0', 2, a*0.8);
    for (let i = 0; i < 6; i++){ const t2 = i/6; const ang2 = F + (t2 - 0.5)*1.5;
      const ex = X + Math.cos(ang2)*rr, ey = Y + Math.sin(ang2)*rr - t2*6;
      disc(ex, ey - 4, 3.5*(1 - t2*0.4), i%2 ? C1 : C2, a*0.75); }
    _vxGlyph(X + Math.cos(F)*rr*0.6, Y + Math.sin(F)*rr*0.6, G, 22, C2, a*0.85);
  } else if (S === 'meteor'){ // Meteor (Dark Wizard) — vẫn thạch lửa giáng thế, nổ tung khi chạm đất
    for (let i = 0; i < 6; i++){
      const seed = i*53.7;
      const fx0 = X + Math.cos(seed)*R*0.6, fy0 = Y - R*(1.05 + (i%3)*0.22);
      const tx = X + Math.cos(seed + 1.7)*R*0.3, ty = Y + Math.sin(seed + 1.7)*R*0.2;
      const kk = Math.min(1, k*1.4 - i*0.09); if (kk <= 0) continue;
      const px = fx0 + (tx-fx0)*kk, py = fy0 + (ty-fy0)*kk;
      ctx.strokeStyle = C1; ctx.lineWidth = 4; ctx.globalAlpha = a*0.7;
      _vxLine(px, py, px - (tx-fx0)*0.18, py - (ty-fy0)*0.18);
      disc(px, py, 7*(1 - kk*0.3), C1, a*0.9); disc(px, py, 3.2, C2, a);
      if (kk >= 0.94) arc(tx, ty, 14 + (k - 0.75)*90, 0, 7, C2, 4, a*0.85);
    }
    disc(X, Y, R*(0.22 + k*0.35), C1, a*0.22);
    _vxGlyph(X, Y - R*0.1, G, 26, C2, a*0.9);
  } else if (S === 'crowswarm'){ // Dark Raven (Dark Lord) — bầy quạ đen xoáy vào, cánh nhọn xé gió
    disc(X, Y, R*(0.5 + k*0.2), '#0a0612', a*0.35);
    for (let i = 0; i < 8; i++){
      const aa = i*0.7854 + spin + k*5;
      const rr = R*(0.85 - k*0.55);
      const cx = X + Math.cos(aa)*rr, cy = Y + Math.sin(aa)*rr*0.7;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(aa + Math.PI/2); ctx.globalAlpha = a*0.85;
      ctx.fillStyle = i%2 ? C1 : '#140a1e';
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-9,-4); ctx.lineTo(-2,0); ctx.lineTo(-9,4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(9,-4); ctx.lineTo(2,0); ctx.lineTo(9,4); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (i%3 === 0) disc(cx, cy, 1.8, C2, a);
    }
    _vxGlyph(X, Y, G, 26, C2, a*0.9);
  }
  ctx.restore();
}
function drawProjStyled(p){
  const s = p.style || 'dart', dx = Math.cos(p.ang), dy = Math.sin(p.ang);
  ctx.save(); ctx.lineCap = 'round';
  if (s === 'beam' || s === 'beam2'){ // chỉ lực / kiếm khí xuyên thấu
    const w = s === 'beam2' ? 8 : 5, L = s === 'beam2' ? 34 : 26;
    ctx.strokeStyle = p.color; ctx.lineWidth = w; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(p.x - dx*L, p.y - dy*L); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s === 'beam2' ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(p.x - dx*L*0.7, p.y - dy*L*0.7); ctx.lineTo(p.x, p.y); ctx.stroke();
  } else if (s === 'blade'){ // đao quang trăng lưỡi liềm
    ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x - dx*10, p.y - dy*10, 14, p.ang - 1.2, p.ang + 1.2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x - dx*10, p.y - dy*10, 10, p.ang - 1, p.ang + 1); ctx.stroke();
  } else if (s === 'shard'){ // mảnh băng/chỉ khí
    ctx.fillStyle = p.color; ctx.beginPath();
    ctx.moveTo(p.x + dx*10, p.y + dy*10); ctx.lineTo(p.x - dx*8 - dy*5, p.y - dy*8 + dx*5); ctx.lineTo(p.x - dx*8 + dy*5, p.y - dy*8 - dx*5); ctx.closePath(); ctx.fill();
  } else if (s === 'serpent'){ // kim xà uốn lượn
    ctx.strokeStyle = p.color; ctx.lineWidth = 3.5; ctx.beginPath();
    for (let i = 0; i <= 6; i++){ const t = i/6; const off = Math.sin(t*6 + (p.seed || 0))*7;
      const px = p.x - dx*26*t - dy*off, py = p.y - dy*26*t + dx*off; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
  } else if (s === 'note'){ // âm ba sưu hồn — vòng sóng âm
    ctx.strokeStyle = p.color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, 5 + ((p.seed || 0)%3), 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x - dx*12, p.y - dy*12, 3.5, 0, 7); ctx.stroke();
  } else if (s === 'sword'){ // phi kiếm
    _vxSword(p.x, p.y, p.ang, 24, p.color, 0.95);
  } else if (s === 'orb'){ // quang cầu
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
    g.addColorStop(0, '#fff'); g.addColorStop(0.4, p.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fill();
  } else if (s === 'arrow'){ // Multi-Shot (Sylvan Ranger) — thân tên + mũi nhọn + lông vũ đuôi
    ctx.strokeStyle = p.color; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(p.x - dx*18, p.y - dy*18); ctx.lineTo(p.x - dx*4, p.y - dy*4); ctx.stroke();
    ctx.fillStyle = p.color; ctx.beginPath();
    ctx.moveTo(p.x + dx*6, p.y + dy*6); ctx.lineTo(p.x - dx*2 - dy*3, p.y - dy*2 + dx*3); ctx.lineTo(p.x - dx*2 + dy*3, p.y - dy*2 - dx*3); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(p.x - dx*18 - dy*3, p.y - dy*18 + dx*3); ctx.lineTo(p.x - dx*14, p.y - dy*14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - dx*18 + dy*3, p.y - dy*18 - dx*3); ctx.lineTo(p.x - dx*14, p.y - dy*14); ctx.stroke();
  } else { // dart — kiểu cũ mặc định
    ctx.strokeStyle = p.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p.x - dx*16, p.y - dy*16); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function spawnSkillVfx(id, v, phase, ang, R, x0, y0){
  const c = VH_VFX[id] || SECT_VFX[id] || null;
  const col = v.color || '#7ecbff', c2 = (c && c.c2) || '#ffffff', glyph = v.glyph || '✦';
  const style = (c && c.style) || ({ cone:'crescents', cast:'flash', aoe:'suns', dash:'wuxing', buff:'vajra' })[phase] || 'flash';
  if (phase === 'cone'){
    addEffect({ type:'vfx', style, x:player.x, y:player.y, face:ang, r:R, c1:col, c2, glyph, dur:0.55, spin:(c && c.spin) || 0 });
    for (let i = 0; i < 5; i++) addEffect({ type:'ink', x:player.x + Math.cos(ang)*rnd(30,90), y:player.y + Math.sin(ang)*rnd(30,90), vx:rnd(-30,30), vy:rnd(-60,-10), color:c2 });
  } else if (phase === 'cast'){
    addEffect({ type:'vfx', style:'flash', x:player.x, y:player.y, face:ang, r:R, c1:col, c2, glyph, dur:0.4 });
  } else if (phase === 'aoe'){
    addEffect({ type:'vfx', style, x:player.x, y:player.y, face:ang, r:R, c1:col, c2, glyph, dur:0.7, big:true, spin:(c && c.spin) || 0 });
    addEffect({ type:'vfx', style:'shock', x:player.x, y:player.y, face:0, r:R, c1:col, c2, glyph, dur:0.5 });
  } else if (phase === 'dash'){
    addEffect({ type:'vfx', style, x:player.x, y:player.y, face:ang, r:R, c1:col, c2, glyph, dur:0.6, x0, y0 });
    addEffect({ type:'vfx', style:'shock', x:player.x, y:player.y, face:0, r:80, c1:col, c2, glyph, dur:0.45 });
  } else if (phase === 'buff'){
    addEffect({ type:'vfx', style, x:player.x, y:player.y, face:0, r:R, c1:col, c2, glyph, dur:1.0, big:true, spin:(c && c.spin) || 0 });
  }
}

function castVohoc(id){
  const v = VOHOC_DEFS[id] || FUSION_DEFS[id]; if (!v) return;
  const tierC = VH_TIER[v.tier].color, col = v.color || tierC;
  const fx = v.fx || {};
  const _st = evoStage(id); // bậc tiến hóa (Lv 40/80/120)
  const _mul = 1 + (player.skillDmgPct || 0);
  addFloat(player.x, player.y-46, `《${v.name}》`, col, 14);
  const hitMob = (m, mult) => {
    let dmg = player.atk * mult * _mul * rnd(0.92, 1.08);
    if (fx.pierce) dmg *= 1.3; // xuyên giáp
    const crit = Math.random() < player.crit;
    if (crit) dmg *= (player.critDmgMult || 2);
    hurtMob(m, Math.round(dmg), crit ? 'crit' : 'tp');
    if (m.dead) return;
    // Sourced per-class action SFX (axie-origins-asset-kit) — flavors the VOHOC/FUSION hit landing by
    // archetype: bleed reads as a claw/bite chomp, aoe reads as a heavier gore-style hit, kb (no bleed)
    // reads as a knockback/throw. Additive layer alongside the fx floats/status below, not a replacement.
    const _hitCls = SECT_SFX[player.sect];
    if (_hitCls){
      if (fx.bleed) AudioSys.sfx('bite_' + _hitCls, 0.45);
      else if (v.type === 'aoe') AudioSys.sfx('gore_' + _hitCls, 0.45);
      else if (fx.kb) AudioSys.sfx('throw_' + _hitCls, 0.45);
    }
    if (fx.stun){ m.stunT = Math.max(m.stunT || 0, fx.stun * (m.def.bossKind ? 0.4 : 1)); addFloat(m.x, m.y-m.def.size-24, 'CHOÁNG!', '#ffe9a8', 11); playStatusFx('stunned', 'stunned', m.x, m.y, 0.5, 0.3); }
    if (fx.slow){ m.slowT = Math.max(m.slowT || 0, fx.slow.t); m.slowPct = 1 - fx.slow.pct; addFloat(m.x, m.y-m.def.size-24, 'CHẬM!', '#7ab0d8', 11); playStatusFx('weak', 'weak', m.x, m.y, 0.45, 0.28); }
    if (fx.bleed){ m.bleedT = fx.bleed.t; m.bleedDps = Math.max(1, Math.round(player.atk * 0.35)); addFloat(m.x, m.y-m.def.size-24, 'CHẢY MÁU!', '#c03a4a', 11); playStatusFx('bleed', 'bleed_apply', m.x, m.y, 0.5, 0.3); }
    if (fx.kb) vhKnockback(m, Math.atan2(m.y - player.y, m.x - player.x), fx.kb);
  };
  if (v.type === 'cone'){
    const t = nearestMob(220);
    if (t) player.face = Math.atan2(t.y - player.y, t.x - player.x);
    const R = 135;
    spawnSkillVfx(id, v, 'cone', player.face, R);
    aoeHit(() => {
      for (const m of mobs){
        if (m.dead) continue;
        if (dist(player.x, player.y, m.x, m.y) >= R + m.def.size) continue;
        let da = Math.atan2(m.y - player.y, m.x - player.x) - player.face;
        while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
        if (Math.abs(da) < 1.05) hitMob(m, v.mult);
      }
    });
    if (fx.selfEva){ player.vhEvaT = fx.selfEva.t; player.vhEvaPct = fx.selfEva.pct; addFloat(player.x, player.y-60, `+${fx.selfEva.pct}% né (${fx.selfEva.t}s)`, '#a0ffe9', 12); }
    for (let _w = 1; _w <= _st; _w++){ // tiến hóa: sóng chưởng nối tiếp, mỗi sóng rộng hơn
      const _wm = _w === 1 ? 0.55 : 0.4, _Rw = R * (1 + 0.18 * _w), _fw = player.face, _px = player.x, _py = player.y;
      setTimeout(() => {
        if (!player || dead) return;
        addEffect({ type:'cone', x:_px, y:_py, face:_fw, r:_Rw, color:col });
        aoeHit(() => {
          for (const m of mobs){
            if (m.dead) continue;
            if (dist(_px, _py, m.x, m.y) >= _Rw + m.def.size) continue;
            let da = Math.atan2(m.y - _py, m.x - _px) - _fw;
            while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
            if (Math.abs(da) < 1.05) hitMob(m, v.mult * _wm);
          }
        });
      }, _w * 240);
    }
  }
  else if (v.type === 'proj'){
    const t = nearestMob(560);
    const base = t ? Math.atan2(t.y - player.y, t.x - player.x) : player.face;
    player.face = base;
    const n = (fx.multi || 1) + _st, spd = fx.speed || 540; // tiến hóa: +1 đạo mỗi bậc (Lục Mạch 1→2→3→4 kiếm)
    const _vc = VH_VFX[id] || null;
    for (let i = 0; i < n; i++){
      const off = n > 1 ? (i - (n-1)/2) * 0.18 : 0;
      projectiles.push({ x:player.x, y:player.y, ang:base + off, speed:spd, dmg:player.atk * v.mult * _mul, kind:'skill', life:0.95, color:(_vc && _vc.rainbow) ? `hsl(${Math.round(i*360/Math.max(n,1))},85%,66%)` : col, pierce:!!fx.pierce, vhfx:fx, style:(_vc && _vc.proj) || undefined, seed:i });
    }
    spawnSkillVfx(id, v, 'cast', base, 56);
    // Sourced per-class projectile-launch SFX — VOHOC/FUSION 'proj' skills only ever got the
    // generic 'skill' sfx (set at the bottom of castSkill) before this; this is additive, not a swap.
    const _projCls = SECT_SFX[player.sect];
    if (_projCls) AudioSys.sfx('projatk_' + _projCls, 0.45);
  }
  else if (v.type === 'aoe'){
    const R = (fx.r || 160) * (1 + 0.12 * _st); // tiến hóa: phạm vi +12%/bậc
    spawnSkillVfx(id, v, 'aoe', player.face, R);
    shakeT = Math.max(shakeT, 0.2); shakeMag = Math.max(shakeMag, fx.big ? 7 : 4);
    aoeHit(() => {
      for (const m of mobs){
        if (m.dead) continue;
        if (dist(player.x, player.y, m.x, m.y) < R + m.def.size) hitMob(m, v.mult);
      }
    });
    for (let _w = 1; _w <= _st; _w++){ // tiến hóa: dư chấn nổ tiếp thành từng vòng
      const _wm = _w === 1 ? 0.5 : 0.35, _Rw = R * (1 + 0.15 * _w), _px = player.x, _py = player.y;
      setTimeout(() => {
        if (!player || dead) return;
        addEffect({ type:'ring', x:_px, y:_py, r:_Rw, color:col, big:true });
        aoeHit(() => { for (const m of mobs){ if (m.dead) continue; if (dist(_px, _py, m.x, m.y) < _Rw + m.def.size) hitMob(m, v.mult * _wm); } });
      }, _w * 260);
    }
  }
  // (nhánh type:'dash' đã xoá — không còn chiêu nào mang type đó sau đợt MU-hoá)
  else if (v.type === 'buff'){
    spawnSkillVfx(id, v, 'buff', 0, 95);
    const _bt = Math.round((fx.t || 0) * (1 + 0.5 * _st)); // tiến hóa: buff bền +50%/bậc
    if (fx.dmgPct){ player.vhDmgT = _bt; player.vhDmgPct = fx.dmgPct; addFloat(player.x, player.y-60, `+${fx.dmgPct}% ST (${_bt}s)`, col, 13); }
    if (fx.shieldPct){ player.vhShield = Math.round(player.maxHp * fx.shieldPct * (1 + 0.25 * _st) / 100); addFloat(player.x, player.y-60, `🛡 KHIÊN ${player.vhShield}`, '#8ad8c8', 13); playStatusFx('shield', 'shield', player.x, player.y, 0.55, 0.32); }
    if (fx.reflect){ player.vhReflT = _bt; addFloat(player.x, player.y-60, `PHẢN ĐÒN ${_bt}s!`, col, 13); }
    if (fx.aspdPct){ player.vhAspdT = _bt; player.vhAspdPct = fx.aspdPct; addFloat(player.x, player.y-60, `TỐC ĐÁNH +${fx.aspdPct}%`, col, 13); }
    if (fx.crit){ player.vhCritT = _bt; addFloat(player.x, player.y-74, `BẠO KÍCH ${_bt}s!`, '#ff6a5a', 13); }
    if (fx.leechPct){ player.vhLeechT = _bt; addFloat(player.x, player.y-60, `HÚT SINH LỰC ${_bt}s`, col, 13); }
    if (fx.resetCd){ for (const k in player.cd) player.cd[k] = 0; player.cd[id] = v.cd * skCdScale(id); addFloat(player.x, player.y-74, 'VÔ TƯỚNG — toàn bộ chiêu đã hồi!', '#b8e8ff', 13); }
    calcDerived();
  }
}

// ============================================================
// LỊCH THẾ GIỚI — đồng hồ trong game: mùa + canh giờ, ảnh hưởng spawn và sự kiện
// 12 canh/ngày · 30 ngày/tháng · 3 tháng/mùa · 4 mùa/năm
// 1 ngày game = 10 phút thật → 1 tháng ≈ 5 giờ, 1 năm ≈ 20 giờ chơi
// ============================================================
// (tên 12 canh Địa Chi đã gỡ — frac trong gameTimeInfo() vẫn là nguồn nhịp ngày/đêm)
const GT_DAY = 600; // giây thật cho 1 ngày game
const SEASONS = [
  { id:'xuan', name:'Xuân', icon:'🌸', color:'#f0a8c0', buffTxt:'+5% EXP',         amb:{ kind:'petal', color:'#f5b8cc', n:26 }, dawn:0.25, dusk:0.75 },
  { id:'ha',   name:'Hạ',   icon:'☀',  color:'#ffd76a', buffTxt:'+5% hồi Qi', amb:{ kind:'rain',  color:'#9ec8e8', n:34 }, dawn:0.23, dusk:0.77 },
  { id:'thu',  name:'Thu',  icon:'🍂', color:'#e8944a', buffTxt:'+8% bạc rơi',      amb:{ kind:'leaf',  color:'#d87a3a', n:26 }, dawn:0.25, dusk:0.75 },
  { id:'dong', name:'Đông', icon:'❄',  color:'#bfe0f0', buffTxt:'+5% phòng thủ',    amb:{ kind:'snow',  color:'#eef4ff', n:32 }, dawn:0.27, dusk:0.73 },
];
function gameClock(){ if (!player.gt) player.gt = { t: GT_DAY*0.30 }; return player.gt; }
let _gtiCache = null; // per-frame memo: player.gt.t only changes inside update(), never during render()
function gameTimeInfo(){
  if (_gtiCache) return _gtiCache;
  const gt = gameClock();
  const totalDays = Math.floor(gt.t / GT_DAY);
  const year  = Math.floor(totalDays / 360) + 1;
  const doy   = totalDays % 360;
  const month = Math.floor(doy / 30) + 1;
  const day   = doy % 30 + 1;
  const frac  = (gt.t % GT_DAY) / GT_DAY;       // 0 = 0h, 0.5 = 12h
  const canh  = Math.floor(frac * 12) % 12;      // 12 canh giờ
  const season = SEASONS[Math.floor((month - 1) / 3)] || SEASONS[0];
  return (_gtiCache = { year, month, day, canh, frac, season });
}
function isNightGame(){
  const i = gameTimeInfo();
  return i.frac < i.season.dawn - 0.02 || i.frac > i.season.dusk + 0.02;
}
function skyDarkness(){ // 0 = trưa sáng, 1 = đêm khuya — mùa quyết định ngày dài/ngắn
  const i = gameTimeInfo(), f = i.frac, w = 0.06;
  const dawn = i.season.dawn, dusk = i.season.dusk;
  if (f >= dawn && f <= dusk) return 0;
  if (f > dusk && f < dusk + w) return (f - dusk)/w;
  if (f < dawn && f > dawn - w) return (dawn - f)/w;
  return 1;
}

// ---------- Thoi tiet dong theo Lich Tu Tien (Goi B) — roll theo NGAY, deterministic ----------
const WX_TABLE = {
  xuan:[['sun',0.55],['drizzle',0.30],['fog',0.15]],
  ha:  [['sun',0.45],['storm',0.35],['sunhot',0.20]],
  thu: [['sun',0.55],['fog',0.30],['drizzle',0.15]],
  dong:[['sun',0.40],['snow',0.42],['fog',0.18]],
};
const WX_INFO = {
  sun:{icon:'☀', name:'Nắng đẹp'}, sunhot:{icon:'🌞', name:'Nắng gắt'},
  drizzle:{icon:'🌦', name:'Mưa phùn'}, storm:{icon:'⛈', name:'Mưa rào giông'},
  fog:{icon:'🌫', name:'Sương mù'}, snow:{icon:'❄', name:'Tuyết rơi'},
};
function weatherNow(){
  if (typeof player === 'undefined' || !player || !player.gt) return null;
  if (!curMap || curMap.startsWith('pb_')) return null; // phó bản không có thời tiết
  const g = gameTimeInfo();
  const h = Math.abs(Math.sin((g.year*4096 + g.month*97 + g.day*13 + 7) * 12.9898) * 43758.5453) % 1;
  const tbl = WX_TABLE[g.season.id] || WX_TABLE.xuan;
  let acc = 0, pick = 'sun';
  for (const [id, w] of tbl){ acc += w; if (h <= acc){ pick = id; break; } }
  return Object.assign({ id: pick }, WX_INFO[pick]);
}
let wxFlashT = 0, wxLightningT = 9;
function tickWeather(dt){ // sấm chớp khi giông (Gói B)
  const wx = weatherNow();
  if (!wx || wx.id !== 'storm'){ wxFlashT = Math.max(0, wxFlashT - dt); return; }
  wxLightningT -= dt;
  if (wxLightningT <= 0){ wxFlashT = 0.22; wxLightningT = rnd(8, 20); }
  wxFlashT = Math.max(0, wxFlashT - dt);
}

// ---------- Tia nắng & đèn lồng (Gói C) — screen-space ----------
function drawSunRays(){
  const t = performance.now()/1000;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++){
    const bx = ((i*0.29 + t*0.008) % 1.3 - 0.15) * W;
    const g = ctx.createLinearGradient(bx, -40, bx + H*0.55, H);
    g.addColorStop(0, 'rgba(255,240,190,0.17)'); g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx, -40); ctx.lineTo(bx + 60 + i*18, -40);
    ctx.lineTo(bx + H*0.55 + 150 + i*18, H); ctx.lineTo(bx + H*0.55, H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawLanternGlow(dk){ // đèn lồng Tương Dương về đêm — neo tọa độ thế giới
  const t = performance.now()/1000;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 12; i++){
    const sx = ((Math.sin(i*37.7)*0.5+0.5) * 0.86 + 0.07) * MAP.w - camera.x;
    const sy = ((Math.sin(i*53.3+7)*0.5+0.5) * 0.80 + 0.10) * MAP.h - camera.y;
    if (sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
    const fl = 0.75 + 0.25*Math.sin(t*6 + i*1.7);
    const r = 62 * fl;
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
    g.addColorStop(0, 'rgba(255,178,80,' + (0.44*dk*fl).toFixed(3) + ')');
    g.addColorStop(0.45, 'rgba(255,140,50,' + (0.18*dk*fl).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,130,' + (0.85*dk).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ---------- Vùng nước theo map (tỉ lệ ảnh nền) — gợn sóng + lấp lánh (Gói F) ----------
const WATER_ZONES = {
  daohoa:    [ {fx:0.13, fy:0.20, frx:0.09, fry:0.10}, {fx:0.86, fy:0.24, frx:0.10, fry:0.11}, {fx:0.14, fy:0.82, frx:0.10, fry:0.11}, {fx:0.83, fy:0.80, frx:0.11, fry:0.12} ],
  tuyettinh: [ {fx:0.30, fy:0.33, frx:0.07, fry:0.05}, {fx:0.42, fy:0.45, frx:0.09, fry:0.06}, {fx:0.58, fy:0.66, frx:0.10, fry:0.07}, {fx:0.74, fy:0.88, frx:0.11, fry:0.08} ],
};
function drawWaterFx(){
  if (SETTINGS.lowFx) return;
  const zs = WATER_ZONES[curMap]; if (!zs) return;
  const t = performance.now()/1000;
  ctx.save();
  for (const z of zs){
    const zx = z.fx*MAP.w, zy = z.fy*MAP.h, zrx = z.frx*MAP.w, zry = z.fry*MAP.h;
    if (zx + zrx < camera.x || zx - zrx > camera.x+W || zy + zry < camera.y || zy - zry > camera.y+H) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.ellipse(zx, zy, zrx, zry, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 3; i++){
      const ph = ((t*0.35 + i/3) % 1);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.16*(1-ph)).toFixed(3) + ')';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(zx + Math.sin(t*0.6+i*2)*14, zy + Math.cos(t*0.5+i)*10, zrx*ph*0.9+6, zry*ph*0.9+4, 0, 0, 7); ctx.stroke();
    }
    for (let i = 0; i < 5; i++){
      const sx2 = zx + Math.sin(i*37.3 + zx)*zrx*0.7, sy2 = zy + Math.cos(i*51.7 + zy)*zry*0.6;
      const tw = Math.abs(Math.sin(t*2.2 + i*1.9));
      ctx.strokeStyle = 'rgba(255,255,240,' + (0.28*tw).toFixed(3) + ')'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx2-7*tw, sy2); ctx.lineTo(sx2+7*tw, sy2); ctx.stroke();
    }
  }
  ctx.restore();
}

function tickGameClock(dt){
  // Lịch Can Chi / Tứ Quý đã gỡ — đồng hồ nay chỉ chạy ngầm cho nhịp ngày/đêm
  // và thời tiết. Sự kiện neo theo GIỜ THẬT (xem Bảng Sự Kiện), không theo lịch game.
  const before = gameTimeInfo();
  player.gt.t += dt; _gtiCache = null;              // gt đổi → memo phải tính lại
  const after = gameTimeInfo();
  if (after.canh !== before.canh) calcDerived();     // nhịp ngày/đêm đổi (đêm +10% EXP)
  if (after.day !== before.day || after.month !== before.month || after.season.id !== before.season.id)
    spawnAmbients();                                 // sang ngày/mùa: roll thời tiết + hạt môi trường
}
function seasonAmbientCfg(cfg){ // hạt mùa phủ lên map ngoài trời — phó bản giữ than hồng
  if (typeof player === 'undefined' || !player || !player.gt) return cfg;
  if (curMap && curMap.startsWith('pb_')) return cfg;
  const sa = gameTimeInfo().season.amb;
  return { kind: sa.kind, color: sa.color, n: Math.max(cfg.n, sa.n) };
}
function drawSkyOverlay(){ // screen-space — gọi sau vignette, trước zone banner
  if (!player || !player.gt) return;
  const gti = gameTimeInfo();
  const dk = skyDarkness();
  if (dk > 0){ // đêm xanh mực, khuya có ánh trăng nhạt
    ctx.fillStyle = `rgba(8,10,32,${(0.36*dk).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    if (dk > 0.85){ ctx.fillStyle = `rgba(150,170,255,${(0.05*dk).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  }
  if (gti.frac > gti.season.dusk - 0.05 && gti.frac < gti.season.dusk + 0.06){ // hoàng hôn cam
    const k = 1 - Math.abs(gti.frac - gti.season.dusk)/0.06;
    ctx.fillStyle = `rgba(255,130,50,${(0.14*Math.max(0,k)).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  }
  if (gti.frac > gti.season.dawn - 0.06 && gti.frac < gti.season.dawn + 0.05){ // bình minh vàng nhạt
    const k2 = 1 - Math.abs(gti.frac - gti.season.dawn)/0.06;
    ctx.fillStyle = `rgba(255,200,110,${(0.10*Math.max(0,k2)).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  }
  if (dk === 0 && gti.season.id === 'ha'){ ctx.fillStyle = 'rgba(255,225,130,0.06)'; ctx.fillRect(0, 0, W, H); }   // nắng hạ gắt
  if (dk === 0 && gti.season.id === 'dong'){ ctx.fillStyle = 'rgba(190,215,240,0.05)'; ctx.fillRect(0, 0, W, H); } // trời đông lạnh
  // ── Thời tiết động (Gói B) ──
  const wx = weatherNow();
  if (wx){
    if (wx.id === 'storm' || wx.id === 'drizzle'){ ctx.fillStyle = 'rgba(26,34,52,' + (wx.id === 'storm' ? 0.16 : 0.09) + ')'; ctx.fillRect(0, 0, W, H); }
    else if (wx.id === 'snow'){ ctx.fillStyle = 'rgba(225,235,245,0.07)'; ctx.fillRect(0, 0, W, H); }
    else if (wx.id === 'sunhot' && dk === 0){ ctx.fillStyle = 'rgba(255,214,120,0.08)'; ctx.fillRect(0, 0, W, H); }
    if (wx.id === 'fog'){
      ctx.fillStyle = 'rgba(214,216,210,0.10)'; ctx.fillRect(0, 0, W, H);
      if (!SETTINGS.lowFx){
        const ft = performance.now()/1000;
        for (let i = 0; i < 3; i++){
          const fx0 = ((ft*16 + i*470) % (W + 800)) - 400, fy0 = H*(0.22 + i*0.26);
          const fg = ctx.createRadialGradient(fx0, fy0, 0, fx0, fy0, 360);
          fg.addColorStop(0, 'rgba(226,228,220,0.15)'); fg.addColorStop(1, 'rgba(226,228,220,0)');
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx0, fy0, 360, 0, 7); ctx.fill();
        }
      }
    }
    if (wxFlashT > 0){ ctx.fillStyle = 'rgba(235,240,255,' + Math.min(0.5, wxFlashT*2.6).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); } // chớp giông
  }
  // ── Ánh sáng động (Gói C) ──
  if (dk === 0 && !SETTINGS.lowFx && !mapDef().city && (!wx || wx.id === 'sun' || wx.id === 'sunhot')) drawSunRays(); // thành giữ tông chiều tà (drawCityMood), không chiếu nắng chói
  if (dk > 0.15 && curMap === 'tuongduong' && !SETTINGS.lowFx && typeof camera !== 'undefined') drawLanternGlow(dk);
}

function skillInfo(id){
  const sect = SECTS[player.sect];
  const d = SKILL_DEFS[id];
  if (!d) return null;
  const out = { id, icon: typeof d.icon==='function' ? d.icon(player.sect) : d.icon, desc: typeof d.desc==='function' ? d.desc(sect) : d.desc };
  if (d.kind==='sectA'){ out.name = sect.skillA.name; out.cd = sect.skillA.cd; out.qi = sect.skillA.qi; }
  else if (d.kind==='sectTP'){ out.name = sect.tp.name; out.cd = TP_CD; out.qi = player.level < 20 ? Math.round(TP_QI*0.7) : TP_QI; } // tân thủ <20: trấn phái -30% chân khí
  else if (d.kind==='vh'){ const _v = VOHOC_DEFS[id] || FUSION_DEFS[id]; out.name = _v.name; out.cd = _v.cd; out.qi = _v.qi; }
  else { out.name = d.name; out.cd = d.cd; out.qi = d.qi; }
  out.unlocked = player.level >= d.unlock && (!d.req || d.req());
  out.lockTxt = player.level < d.unlock ? `Mở khóa ở cấp ${d.unlock}` : (d.reqTxt || '');
  // hồi chiêu theo định nghĩa từng chiêu (dải 8-20s) — nhịp rõ để giọng hô tên chiêu không bị dồn
  return out;
}

// ---------- Thú Chiến: 8-giai chiến thú đồng hành ----------
// Không cưỡi — chiến thú đi theo và tự tấn công quái quanh người chơi.
// Upgrade = spend silver + Tinh Thạch, roll against success rate; fail keeps tier.
const MOUNT_TIERS = [ null,
  { name:'Emberhide Bull',   img:'assets/mounts/1_firebull.png',      color:'#c8622a', dmg:15,  str:3,  agi:3,  def:0,  vit:3,  hp:0,    crit:0, qireg:0, reqLv:10, cost:{silver:300,   mat:3},   rate:100 },
  { name:'Frosthorn Bull',   img:'assets/mounts/2_icebull.png',       color:'#6ab0e8', dmg:45,  str:12, agi:10, def:6,  vit:10, hp:200,  crit:2, qireg:1, reqLv:25, cost:{silver:1500,  mat:14},  rate:80 },
  { name:'Voltclaw Panther', img:'assets/mounts/3_shadowpanther.png', color:'#a84ad8', dmg:90,  str:24, agi:24, def:18, vit:20, hp:500,  crit:4, qireg:2, reqLv:45, cost:{silver:4500,  mat:38},  rate:60 },
  { name:'Sunfeather Phoenix',img:'assets/mounts/4_phoenix.png',      color:'#ff8a3a', dmg:145, str:38, agi:40, def:32, vit:35, hp:900,  crit:6, qireg:4, reqLv:65, cost:{silver:9000,  mat:70},  rate:42 },
  { name:'Azure Wyrm',       img:'assets/mounts/5_azuredragon.png',   color:'#3a7ad8', dmg:200, str:55, agi:55, def:55, vit:55, hp:1500, crit:8, qireg:6, reqLv:85, cost:{silver:15000, mat:110}, rate:30 },
];
const MOUNT_IMGS = {};
for (let i=1;i<MOUNT_TIERS.length;i++){
  const im = new Image(); im.src = MOUNT_TIERS[i].img; MOUNT_IMGS[i] = im;
}

// ---------- Sect art (portraits + skill icons) ----------
// Chỉ còn icon kỹ năng. Chân dung nhân vật nay dựng bằng drawHeroFigure() (xem
// heroCardUrl()), không đọc file ảnh nào nữa. Icon nào 404 thì probeSkillIcons()
// tự sinh icon MU bằng canvas.
// (paths already wired below for the 2 new classes) and repoint the other 7 the same way —
// missing images fail gracefully to a flat-color fallback shape elsewhere in the file, so this
// is safe to ship before art arrives.
const SECT_ART = {
  thieulam: { iconA:'assets/skills/tl_a.png', iconTP:'assets/skills/tl_tp.png' },
  toanchan: { iconA:'assets/skills/tc_a.png', iconTP:'assets/skills/tc_tp.png' },
  baidasan: { iconA:'assets/skills/bd_a.png', iconTP:'assets/skills/bd_tp.png' },
  minhgiao: { iconA:'assets/skills/mg_a.png', iconTP:'assets/skills/mg_tp.png' },
  bug:      { iconA:'assets/classes/bug_a.png', iconTP:'assets/classes/bug_tp.png' },
  vophai:   { iconA:'assets/skills/slash.png', iconTP:'assets/skills/basic.png' },
};
// ═══════════ ICON KỸ NĂNG TỰ SINH — phong cách MU Online ═══════════
// Nhiều chiêu (cả 3 ô taskbar của Dark Lord + chiêu buff của 4 lớp còn lại) khai báo đường dẫn art
// chưa từng được vẽ → ô kỹ năng hiện trống/ảnh vỡ. Thay vì chờ art, vẽ thẳng bằng canvas theo đúng
// ngôn ngữ hình ảnh MU: khung kim loại gothic vát cạnh + ô lõm phát sáng + BIỂU TƯỢNG VECTOR
// (kiếm/khiên/sóng xung/ngọn lửa/vương miện) — tuyệt đối không dùng chữ Hán như bản wuxia cũ.
const _skIconCache = {};
// Từng biểu tượng vẽ trong hệ toạ độ 0..1 (đã dịch/co giãn sẵn), gốc ở tâm ô.
const SK_ICON_SYMS = {
  // Greater Damage — lưỡi kiếm bốc lên kèm 2 mũi tăng lực hai bên
  blade_up(g, R, c1, c2){
    g.fillStyle = c1;
    g.beginPath(); g.moveTo(0, -R*0.82); g.lineTo(R*0.17, -R*0.42); g.lineTo(R*0.11, R*0.34);
    g.lineTo(-R*0.11, R*0.34); g.lineTo(-R*0.17, -R*0.42); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.globalAlpha = 0.85;
    g.beginPath(); g.moveTo(0, -R*0.78); g.lineTo(R*0.06, -R*0.4); g.lineTo(0, R*0.3); g.closePath(); g.fill();
    g.globalAlpha = 1; g.fillStyle = c2;
    g.fillRect(-R*0.42, R*0.3, R*0.84, R*0.13);            // chuôi ngang
    g.fillRect(-R*0.08, R*0.43, R*0.16, R*0.26);
    for (const sx of [-1, 1]){                              // 2 mũi tăng lực
      g.beginPath(); g.moveTo(sx*R*0.55, -R*0.1); g.lineTo(sx*R*0.78, -R*0.42);
      g.lineTo(sx*R*0.78, -R*0.12); g.lineTo(sx*R*0.55, R*0.2); g.closePath(); g.fill();
    }
  },
  // Soul Barrier — khiên lục giác có rune ở giữa
  barrier(g, R, c1, c2){
    const hex = (rr) => { g.beginPath();
      for (let i = 0; i < 6; i++){ const a2 = -Math.PI/2 + i*Math.PI/3, x = Math.cos(a2)*rr, y = Math.sin(a2)*rr;
        i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
    hex(R*0.82); g.fillStyle = c1; g.globalAlpha = 0.34; g.fill(); g.globalAlpha = 1;
    g.lineWidth = R*0.13; g.strokeStyle = c1; g.stroke();
    hex(R*0.52); g.lineWidth = R*0.07; g.strokeStyle = c2; g.stroke();
    g.fillStyle = '#fff'; g.globalAlpha = 0.9;
    g.beginPath(); g.arc(0, 0, R*0.16, 0, 7); g.fill(); g.globalAlpha = 1;
  },
  // Battle Fury — song kiếm bắt chéo, lửa liếm phía trên
  fury(g, R, c1, c2){
    g.lineCap = 'round';
    for (const sx of [-1, 1]){
      g.strokeStyle = c2; g.lineWidth = R*0.2;
      g.beginPath(); g.moveTo(sx*R*0.6, R*0.72); g.lineTo(-sx*R*0.55, -R*0.55); g.stroke();
      g.strokeStyle = '#e8e4f0'; g.lineWidth = R*0.11;
      g.beginPath(); g.moveTo(sx*R*0.3, R*0.28); g.lineTo(-sx*R*0.55, -R*0.55); g.stroke();
    }
    g.fillStyle = c1;                                        // ngọn lửa giữa
    g.beginPath(); g.moveTo(0, -R*0.86); g.quadraticCurveTo(R*0.34, -R*0.3, R*0.14, R*0.02);
    g.quadraticCurveTo(0, -R*0.2, -R*0.14, R*0.02);
    g.quadraticCurveTo(-R*0.34, -R*0.3, 0, -R*0.86); g.closePath(); g.fill();
  },
  // Force Wave — 3 vòng sóng xung lan ra từ nắm đấm/quyền trượng
  wave(g, R, c1, c2){
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++){
      g.beginPath(); g.arc(-R*0.42, 0, R*(0.42 + i*0.3), -0.95, 0.95);
      g.lineWidth = R*(0.19 - i*0.04); g.strokeStyle = i % 2 ? c2 : c1;
      g.globalAlpha = 1 - i*0.24; g.stroke();
    }
    g.globalAlpha = 1; g.fillStyle = '#fff';
    g.beginPath(); g.arc(-R*0.52, 0, R*0.2, 0, 7); g.fill();
  },
  // Fire Scream — cột lửa gào thét, lưỡi lửa lệch + tia lửa toả ra
  flame(g, R, c1, c2){
    for (let i = 0; i < 8; i++){                             // tia lửa nền
      const a2 = i*Math.PI/4 + 0.4; g.strokeStyle = c2; g.lineWidth = R*0.09; g.globalAlpha = 0.5;
      g.beginPath(); g.moveTo(Math.cos(a2)*R*0.54, Math.sin(a2)*R*0.54);
      g.lineTo(Math.cos(a2)*R*0.95, Math.sin(a2)*R*0.95); g.stroke();
    }
    g.globalAlpha = 1;
    const lick = (sx, h, w, col) => {                        // 1 lưỡi lửa: đỉnh nhọn, chân loe
      g.fillStyle = col; g.beginPath();
      g.moveTo(sx*w*0.12, -h);
      g.bezierCurveTo(sx*w*0.95, -h*0.42, sx*w*0.34, -h*0.1, sx*w*0.72, R*0.5);
      g.lineTo(-sx*w*0.72, R*0.5);
      g.bezierCurveTo(-sx*w*0.2, -h*0.16, sx*w*0.1, -h*0.3, sx*w*0.12, -h);
      g.closePath(); g.fill();
    };
    lick(1, R*0.95, R*0.62, c1);                             // lưỡi lớn
    lick(-1, R*0.6, R*0.36, c2);                             // lưỡi phụ lệch ngược
    g.fillStyle = '#fff6d0';                                  // lõi trắng nóng
    g.beginPath(); g.moveTo(R*0.02, -R*0.3);
    g.bezierCurveTo(R*0.3, R*0.02, R*0.06, R*0.14, R*0.16, R*0.46);
    g.lineTo(-R*0.16, R*0.46);
    g.bezierCurveTo(-R*0.06, R*0.1, R*0.04, -R*0.02, R*0.02, -R*0.3);
    g.closePath(); g.fill();
  },
  // Command Aura — vương miện chỉ huy trên vòng hào quang
  crown(g, R, c1, c2){
    g.strokeStyle = c2; g.lineWidth = R*0.1; g.globalAlpha = 0.75;
    g.beginPath(); g.arc(0, R*0.12, R*0.84, Math.PI*0.12, Math.PI*0.88); g.stroke();
    g.globalAlpha = 1; g.fillStyle = c1;
    g.beginPath(); g.moveTo(-R*0.66, R*0.34); g.lineTo(-R*0.52, -R*0.5); g.lineTo(-R*0.22, -R*0.06);
    g.lineTo(0, -R*0.68); g.lineTo(R*0.22, -R*0.06); g.lineTo(R*0.52, -R*0.5);
    g.lineTo(R*0.66, R*0.34); g.closePath(); g.fill();
    g.fillStyle = c2; g.fillRect(-R*0.66, R*0.34, R*1.32, R*0.22);
    g.fillStyle = '#fff';                                     // ngọc giữa
    g.beginPath(); g.arc(0, R*0.1, R*0.13, 0, 7); g.fill();
  },
};
function genSkillIcon(sym, color, glow){
  const key = sym + '|' + color + '|' + (glow || '');
  if (_skIconCache[key]) return _skIconCache[key];
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), c = S/2, c2 = glow || '#f2ecd8';
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x+r, y);
    g.arcTo(x+w, y, x+w, y+h, r); g.arcTo(x+w, y+h, x, y+h, r);
    g.arcTo(x, y+h, x, y, r); g.arcTo(x, y, x+w, y, r); g.closePath(); };
  // khung kim loại gothic: nền tối vát sáng trên-trái, tối dưới-phải
  const frame = g.createLinearGradient(0, 0, S, S);
  frame.addColorStop(0, '#5a5266'); frame.addColorStop(0.5, '#2a2532'); frame.addColorStop(1, '#15121c');
  rr(1, 1, S-2, S-2, 11); g.fillStyle = frame; g.fill();
  g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,.22)'; g.stroke();
  // ô lõm phát sáng theo màu lớp
  const inner = g.createRadialGradient(c, c*0.82, 1, c, c, c*0.98);
  inner.addColorStop(0, color); inner.addColorStop(0.62, shade(color, -0.45)); inner.addColorStop(1, '#0b0910');
  rr(6, 6, S-12, S-12, 7); g.fillStyle = inner; g.fill();
  g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.55)'; g.stroke();
  // biểu tượng
  g.save(); g.translate(c, c);
  g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 3; g.shadowOffsetY = 1;
  (SK_ICON_SYMS[sym] || SK_ICON_SYMS.blade_up)(g, S*0.3, c2, shade(color, 0.55));
  g.restore();
  // đinh tán 4 góc — nét trang trí đặc trưng khung MU
  g.fillStyle = 'rgba(228,220,240,.55)';
  for (const [dx, dy] of [[6,6],[S-6,6],[6,S-6],[S-6,S-6]]){ g.beginPath(); g.arc(dx, dy, 1.7, 0, 7); g.fill(); }
  return _skIconCache[key] = cv.toDataURL();
}
function shade(hex, amt){ // amt>0 sáng lên, <0 tối đi
  const n = parseInt(hex.slice(1), 16), t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  const ch = (sh) => Math.round(((n >> sh & 255) * (1-p)) + t*p);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
// Biểu tượng cho từng chiêu chưa có art (id chiêu → key trong SK_ICON_SYMS)
const SK_ICON_FOR = {
  elf_greaterdmg:'blade_up', dw_shield:'barrier', mg_battlefury:'fury',
  dl_commandaura:'crown', dl_electricspark:'wave', dl_darkspirit:'flame',
  dl_chaoticdiseier:'blade_up', dl_darkraven:'flame',
};
// Màu icon theo NGUYÊN TỐ của chiêu, không theo màu lớp — Fire Scream của Dark Lord phải ra lửa cam
// chứ không phải ô-liu như màu lớp (đúng quy ước MU: icon tô theo hệ, khung mới mang màu lớp).
const SK_ICON_COLOR = {
  dl_darkspirit:'#8a5ad8', dl_darkraven:'#6a4a8a', dl_electricspark:'#d8d84a',
  dw_shield:'#5ab8e8', mg_battlefury:'#e8552a', elf_greaterdmg:'#4c8dff', dl_commandaura:'#c8a83a',
};
const SK_ICON_SECT_TP_COLOR = { bug:'#ff7a3a', minhgiao:'#ff7a3a', baidasan:'#ff9a3a', toanchan:'#5ac8e8' };
const SK_ICON_SECT_A  = { thieulam:'fury', toanchan:'blade_up', baidasan:'flame', minhgiao:'fury', bug:'wave', vophai:'blade_up' };
const SK_ICON_SECT_TP = { thieulam:'blade_up', toanchan:'barrier', baidasan:'flame', minhgiao:'flame', bug:'flame', vophai:'blade_up' };
// Thử nạp từng file art đã khai báo; file nào 404 thì thay bằng icon tự sinh (không đụng file có thật).
function probeSkillIcons(){
  const swap = (get, set, sym, color, glow) => {
    const src = get(); if (!src || src.startsWith('data:')) return;
    const im = new Image();
    im.onerror = () => set(genSkillIcon(sym, color, glow)); // HUD đọc lại info.icon mỗi khung hình
    im.src = src;
  };
  for (const sk in SECTS){
    const s = SECTS[sk], a = SECT_ART[sk]; if (!a) continue;
    swap(() => a.iconA,  v => a.iconA  = v, SK_ICON_SECT_A[sk]  || 'blade_up', s.color, s.glow);
    swap(() => a.iconTP, v => a.iconTP = v, SK_ICON_SECT_TP[sk] || 'flame',    SK_ICON_SECT_TP_COLOR[sk] || s.color, s.glow);
  }
  for (const vid in VOHOC_DEFS){
    const v = VOHOC_DEFS[vid];
    swap(() => v.icon, nv => v.icon = nv, SK_ICON_FOR[vid] || 'blade_up', SK_ICON_COLOR[vid] || v.color || '#9aa8d4');
  }
}
probeSkillIcons();
// Starflight: sprite 3D tiên nhân (nam/nữ × 6 skin) — vẽ sẵn, nền trong suốt
const TIEN_IMGS = {};
for (const g of ['nam','nu']) for (const sk of ['bach','thanh','kim','huyen','hong','lam']){
  const im = new Image(); im.src = 'assets/tien/' + g + '_' + sk + '.png'; TIEN_IMGS[g + '_' + sk] = im;
}
// ---------- Ascension: cultivation realms (Ascension Trial upgrades) ----------
// Bonus values are TOTAL at that realm. Đột phá consumes Anima + silver + mats;
// on failure: silver/mats lost, 50% Anima lost, realm kept.
const _REALM_ICONS = ['r0_phan_nhan','r1_khi_hai','r2_chu_thien','r3_tu_phu','r4_quy_nguyen','r5_luong_nghi','r6_thai_hu','r7_tien_thien','r8_hon_nguyen','r8_hon_nguyen'];
// GDD Lấy Võ Nhập Đạo §3 — Giai đoạn 1: cảnh giới tu tiên.
// Spark (1-4): đột phá vận công theo tỉ lệ. Molt trở lên (5-9): ASCENSION TRIAL 3-9 đợt thiên lôi,
// mỗi tia gây % maxHP, thất bại mất 30% Anima tiến độ — KHÔNG tụt cảnh giới.
const DANTIAN_REALMS = [
  { name:'Hatchling',            atk:0,    hp:0,    qireg:0,  cost:null },
  { name:'Spark · Tầng 1',   atk:0.05, hp:0.05, qireg:1,  cost:{tuvi:150,   silver:300,   mat:3},   rate:100 },
  { name:'Spark · Tầng 2',   atk:0.10, hp:0.10, qireg:2,  cost:{tuvi:400,   silver:700,   mat:6},   rate:85 },
  { name:'Spark · Tầng 3',   atk:0.16, hp:0.16, qireg:3,  cost:{tuvi:900,   silver:1400,  mat:15},  rate:70 },
  { name:'Spark · Tầng 4',   atk:0.24, hp:0.24, qireg:4,  cost:{tuvi:1800,  silver:2600,  mat:24},  rate:55, unlock:'Đạn Chỉ Thần Thông (5% phong mạch đối thủ)' },
  { name:'Molt Cảnh',         atk:0.35, hp:0.35, qireg:5,  cost:{tuvi:3600,  silver:5000,  mat:42},  trib:3, unlock:'Thái Cực hộ thể — phản 5% sát thương · thân pháp +10%' },
  { name:'Radiant Core Cảnh',         atk:0.45, hp:0.45, qireg:6,  cost:{tuvi:6000,  silver:8000,  mat:55},  trib:4, unlock:'Ám Nhiên Tiêu Hồn Chưởng' },
  { name:'Resonance · Trung Kỳ',atk:0.55, hp:0.55, qireg:7,  cost:{tuvi:9000,  silver:12000, mat:80},  trib:6, unlock:null },
  { name:'Resonance · Hậu Kỳ',  atk:0.70, hp:0.70, qireg:8,  cost:{tuvi:13000, silver:18000, mat:110}, trib:8, unlock:'Bất Tử — chặn 1 đòn chí mạng, hồi 30% HP (180s)' },
  { name:'Starforged Cảnh',        atk:0.88, hp:0.88, qireg:10, cost:{tuvi:20000, silver:28000, mat:160}, trib:9, unlock:'Starforged — nhục thân thăng hoa, toàn thuộc tính vượt cực hạn' },
];

// ═══════════ TRACK HT (GDD §13) — trang bị dark-fantasy kiểu MU Online S2 ═══════════
// Cổ Thần Thủ Hộ: 5 món/bộ (Nón/Giáp/Tay/Quần/Giày) — CHỈ mở từ Bảo Hạp, không pity.
// Hiệu ứng bộ ẨN — người chơi tự khám phá khi mặc đủ 2/3/5 món.
// Bốn bộ mang tên bốn Thủ Hộ Vaeldra đã ngã xuống khi Phong Ấn vỡ — di giáp của họ
// còn lại trong Bảo Hạp. (Tên cũ Thanh Long/Bạch Hổ/Chu Tước/Huyền Vũ là tàn dư kiếm
// hiệp, đã gỡ theo QUY TẮC SỐ 1; ANCIENT_MIGRATE bên dưới lo save cũ.)
const ANCIENT_SETS = {
  sarkaan:  { name:'Sarkaan', color:'#3ac88a',
    b2:{ atkPct:10 }, b3:{ critDmg:20 }, b5:{ aspdPct:8, hpLeech:3 },
    hint:'thép xanh gào thét — công kích cuồng bạo' },
  velmyr:   { name:'Velmyr', color:'#e8e8f0',
    b2:{ crit:6 }, b3:{ atkPct:8 }, b5:{ pierce:10, perfect:5 },
    hint:'lưỡi bạc lạnh buốt — xuyên phá hộ giáp' },
  ashvard:  { name:'Ashvard', color:'#ff6a3a',
    b2:{ hpPct:10 }, b3:{ reflectPct:8 }, b5:{ dmgred:8, hpPct:6 },
    hint:'tro tàn còn cháy — sinh mệnh bền bỉ' },
  korrveth: { name:'Korrveth', color:'#5aa0e8',
    b2:{ dmgred:6 }, b3:{ hpPct:12 }, b5:{ evaPct:8, reflectPct:5 },
    hint:'thành lũy bất động — phòng ngự tuyệt đối' },
};
// Save cũ giữ id bộ theo tên kiếm hiệp — ánh xạ sang id mới lúc loadGame(), nếu không
// ANCIENT_SETS[it.ancient] thành undefined và người chơi mất trắng hiệu ứng bộ.
const ANCIENT_MIGRATE = { thanhlong:'sarkaan', bachho:'velmyr', chutuoc:'ashvard', huyenvu:'korrveth' };

// ═══════════ KHẮC ẤN — trang bị đổi CÁCH CHIÊU HOẠT ĐỘNG, không phải đổi con số ═══════════
// Bài học lấy từ Diablo 3 (Loot 2.0 / legendary power): trước hệ này, mọi món đồ trong game
// chỉ trả lời đúng một câu hỏi — "số có to hơn cái đang mặc không?". 15 dòng phụ đều là %
// thuần, 6 dòng Thức Tỉnh là số cộng thẳng, 4 bộ Cổ Thần cũng chỉ là %. Không món nào làm
// chiêu thức hành xử khác đi, nên mọi hệ thống sản xuất đồ (rèn, Bảo Hạp, Cổ Vật, gacha…)
// đều đổ về cùng một phần thưởng vô vị.
//
// Khắc Ấn gắn trên MỘT món (it.sigil), mặc vào là có. Chỉ rơi từ 3 nguồn cuối game:
// Bảo Hạp IV+, Hung Thần Giáng Thế, Xâm Lăng Vàng — thứ cuối vốn chưa có bản sắc gì
// ngoài "hạp bậc cao hơn", nay là nguồn Khắc Ấn nên có lý do tồn tại riêng.
//
// Móc nối: pre (trước khi tung chiêu) · hit (mỗi lần chiêu chạm địch) · cast (sau khi tung
// xong, biết đã trúng mấy con) · kill (khi địch gục). Mỗi Khắc Ấn khai báo móc nào nó cần.
// `tag` cho biết đòn đến từ đâu: 'a' = chiêu chính, 'tp' = Trấn Phái, null = đòn thường.
const SIGIL_DEFS = {
  // ── Dùng chung cho mọi lớp ──
  un_hoiquang: { name:'Khắc Ấn Hồi Quang', sect:null, color:'#ffd76a',
    desc:'Hạ một địch rút ngắn 10% hồi chiêu còn lại của MỌI chiêu. Giết nhanh ⇒ tung nhiều hơn.',
    kill(){
      let any = false;
      for (const k in player.cd) if (player.cd[k] > 0){ player.cd[k] *= 0.9; any = true; }
      if (any && Math.random() < 0.25) addFloat(player.x, player.y-58, '✦ Hồi Quang', '#ffd76a', 11);
    } },
  un_vongkhi: { name:'Khắc Ấn Vọng Khí', sect:null, color:'#ff9df0',
    desc:'Đòn bạo kích nổ một vòng khí quanh mục tiêu, 45% sát thương lên địch bên cạnh. Bạo kích thành đòn diện rộng.',
    hit(m, final, source){
      if (source !== 'crit') return;
      addEffect({ type:'ring', x:m.x, y:m.y, r:96, color:'#ff9df0' });
      sigilSplash(m, 96, final * 0.45);
    } },

  // ── Dark Knight — cận chiến, chiêu chính hình quạt ──
  dk_lantram: { name:'Khắc Ấn Lan Trảm', sect:'thieulam', color:'#4c8dff',
    desc:'Chiêu chính chạm địch thì bật sang một địch khác trong 160px với 55% sát thương. Quạt hẹp hoá đòn dây chuyền.',
    hit(m, final, source, tag){
      if (tag !== 'a') return;
      let best = null, bd = 161;
      for (const m2 of mobs){
        if (m2.dead || m2 === m || m2.def.duHiep) continue;
        const d = dist(m.x, m.y, m2.x, m2.y);
        if (d < bd){ bd = d; best = m2; }
      }
      if (!best) return;
      // vệt bật: rắc hạt dọc đường nối 2 mục tiêu (không có effect kiểu 'bolt' trong game)
      const ang = Math.atan2(best.y - m.y, best.x - m.x);
      for (let i = 1; i <= 4; i++)
        addEffect({ type:'ink', x:m.x + Math.cos(ang)*bd*i/5, y:m.y + Math.sin(ang)*bd*i/5,
                    vx:rnd(-20,20), vy:rnd(-40,-10), color:'#7fb0ff' });
      spawnSlash(best.x, best.y - 10, ang, 110, '#4c8dff', '#ffe9a0');
      sigilHurt(best, final * 0.55);
    } },
  dk_thanhluy: { name:'Khắc Ấn Thành Lũy', sect:'thieulam', color:'#7ecbff',
    desc:'Mỗi địch trúng chiêu chính cộng một lớp khiên bằng 3% Sinh Lực tối đa (trần 25%). Đánh vào đám đông là cách phòng thủ.',
    hit(m, final, source, tag){
      if (tag !== 'a') return;
      const cap = Math.round(player.maxHp * 0.25);
      const before = player.vhShield || 0;
      player.vhShield = Math.min(cap, before + Math.round(player.maxHp * 0.03));
      if (player.vhShield > before) addEffect({ type:'ring', x:player.x, y:player.y, r:38, color:'#7ecbff' });
    } },

  // ── Sylvan Ranger — tầm xa, chiêu chính bắn 5 mũi ──
  sr_tachtien: { name:'Khắc Ấn Tách Tiễn', sect:'toanchan', color:'#3a9d8b',
    desc:'Mũi tên chiêu chính chạm địch thì tách đôi, hai mũi nhỏ bắn tạt ngang với 40% sát thương.',
    hit(m, final, source, tag){
      if (tag !== 'a') return;
      const base = Math.atan2(m.y - player.y, m.x - player.x);
      for (const s of [-1, 1])
        projectiles.push({ x:m.x, y:m.y, ang:base + s*1.25, speed:430, dmg:final*0.4,
          kind:'skill', life:0.5, color:'#a0ffe9', pierce:true, sigilSplit:true });
    } },
  sr_muatien: { name:'Khắc Ấn Mưa Tiễn', sect:'toanchan', color:'#a0ffe9',
    desc:'Tung Trấn Phái xong, 1,1s sau một loạt tên rơi trúng chính chỗ đó — đòn thứ hai cho kẻ vừa lao vào.',
    cast(tag){
      if (tag !== 'tp') return;
      const x = player.x, y = player.y;
      sigilAfter(1.1, () => {
        addEffect({ type:'ring', x, y, r:170, color:'#a0ffe9', big:true });
        for (let i = 0; i < 8; i++){
          const a = i * Math.PI/4;
          spawnSlash(x + Math.cos(a)*90, y + Math.sin(a)*90 - 10, a + Math.PI/2, 90, '#a0ffe9', '#3a9d8b');
        }
        AudioSys.sfx('skill', 0.45);
        sigilArea(x, y, 170, player.atk * 0.9);
      });
    } },

  // ── Dark Wizard — pháp sư tầm xa nhất, Trấn Phái là Meteor ──
  dw_vungdoc: { name:'Khắc Ấn Vũng Tà Độc', sect:'baidasan', color:'#7ec850',
    desc:'Trấn Phái để lại một vũng tà độc 5s, ăn mòn mọi thứ đứng trong đó. Chiêu bộc phát hoá chiêu khống chế đất.',
    cast(tag){
      if (tag !== 'tp') return;
      sigilZones.push({ x:player.x, y:player.y, r:165, t:5, tick:0,
        dps: player.atk * 0.55, color:'#7ec850' });
    } },
  dw_vongam: { name:'Khắc Ấn Vọng Âm', sect:'baidasan', color:'#c8ffa0',
    desc:'35% chiêu chính nổ thêm lần hai ngay tại điểm trúng với 70% sát thương diện rộng.',
    hit(m, final, source, tag){
      if (tag !== 'a' || Math.random() >= 0.35) return;
      addFloat(m.x, m.y - m.def.size - 26, '✦ VỌNG ÂM', '#c8ffa0', 12);
      addEffect({ type:'ring', x:m.x, y:m.y, r:94, color:'#c8ffa0' });
      sigilArea(m.x, m.y, 94, final * 0.7);
    } },

  // ── Spellblade — lai cận/pháp, chiêu chính là đường kiếm lửa ──
  sb_bungchay: { name:'Khắc Ấn Bùng Cháy', sect:'minhgiao', color:'#e8552a',
    desc:'Địch trúng chiêu chính bốc cháy 3s; nếu gục trong lúc còn cháy thì nổ tung, thiêu cả đám xung quanh.',
    hit(m, final, source, tag){
      if (tag !== 'a') return;
      m.poisonT = Math.max(m.poisonT || 0, 3);
      m.poisonDps = Math.max(m.poisonDps || 0, Math.round(player.atk * 0.35));
      m.sgBurn = Math.round(final);      // ST gốc quyết định sức nổ khi nó chết
    },
    kill(m){
      if (!m.sgBurn) return;
      addFloat(m.x, m.y - 40, '☼ BÙNG CHÁY!', '#ff9a5a', 14);
      addEffect({ type:'ring', x:m.x, y:m.y, r:135, color:'#ff7a3a', big:true });
      sigilArea(m.x, m.y, 135, m.sgBurn * 0.8, m);
    } },
  sb_xungphong: { name:'Khắc Ấn Xung Phong', sect:'minhgiao', color:'#ffb060',
    desc:'Tung chiêu chính khi địch gần nhất ở ngoài tầm sẽ lướt tới trước rồi mới chém. Đòn đứng yên hoá đòn lao vào.',
    pre(tag){
      if (tag !== 'a') return;
      const t = nearestMob(400);
      if (!t) return;
      const d = dist(player.x, player.y, t.x, t.y);
      if (d <= 130) return;                       // đã trong tầm quạt, không cần lướt
      const ang = Math.atan2(t.y - player.y, t.x - player.x);
      const step = Math.min(d - 95, 240);          // dừng ngay rìa tầm chém, không xuyên qua địch
      player.face = ang;
      player.x = clamp(player.x + Math.cos(ang)*step, 20, MAP.w-20);
      player.y = clamp(player.y + Math.sin(ang)*step, 20, MAP.h-20);
      addEffect({ type:'ring', x:player.x, y:player.y, r:64, color:'#ffb060' });
    } },

  // ── Dark Lord — lớp chỉ huy, thưởng cho việc gom địch thành đám ──
  dl_trungsong: { name:'Khắc Ấn Trùng Sóng', sect:'bug', color:'#8a9a3a',
    desc:'Chiêu chính phóng thêm đợt sóng thứ hai rộng hơn sau 0,35s với 60% sát thương.',
    cast(tag){
      if (tag !== 'a') return;
      const x = player.x, y = player.y, f = player.face, dmg = player.atk * 0.6;
      sigilAfter(0.35, () => {
        addEffect({ type:'cone', x, y, face:f, r:185, color:'#d0e07a' });
        spawnSlash(x + Math.cos(f)*80, y + Math.sin(f)*80 - 12, f, 200, '#8a9a3a', '#d0e07a');
        AudioSys.sfx('skill', 0.4);
        for (const m of mobs){
          if (m.dead || m.def.duHiep) continue;
          if (dist(x, y, m.x, m.y) > 185 + m.def.size) continue;
          let da = Math.atan2(m.y - y, m.x - x) - f;
          while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
          if (Math.abs(da) < 1.15) sigilHurt(m, dmg * rnd(0.9, 1.1));
        }
      });
    } },
  dl_hieutrieu: { name:'Khắc Ấn Hiệu Triệu', sect:'bug', color:'#d0e07a',
    desc:'Chiêu chính quét trúng từ 3 địch trở lên thì Trấn Phái hồi ngay một nửa thời gian chờ. Gom được đám đông là được thưởng.',
    cast(tag, hits){
      if (tag !== 'a' || hits < 3 || !(player.cd.tp > 0)) return;
      player.cd.tp *= 0.5;
      addFloat(player.x, player.y-64, `⚑ HIỆU TRIỆU (${hits}) — Trấn Phái hồi nhanh!`, '#d0e07a', 13);
    } },
};
// Khắc Ấn này lớp hiện tại có xài được không (Khắc Ấn dùng chung: sect=null ⇒ luôn được)
function sigilUsable(k){
  const s = SIGIL_DEFS[k];
  return !!s && (!s.sect || (player && s.sect === player.sect));
}
// Lớp nào dùng được Khắc Ấn nào (Khắc Ấn dùng chung tính cho mọi lớp)
function sigilPool(sect){
  return Object.keys(SIGIL_DEFS).filter(k => !SIGIL_DEFS[k].sect || SIGIL_DEFS[k].sect === sect);
}
// Rơi Khắc Ấn: ƯU TIÊN cái người chơi chưa có. Trùng lặp là phần thưởng rỗng — với chỉ 4 Khắc Ấn
// hợp lệ mỗi lớp thì random thuần sẽ trả trùng ngay từ lần thứ hai và hỏng hẳn cảm giác săn.
function rollSigil(sect){
  const pool = sigilPool(sect || (player && player.sect));
  if (!pool.length) return null;
  const owned = new Set();
  if (player){
    for (const it of (player.inv || [])) if (it && it.sigil) owned.add(it.sigil);
    for (const k in (player.equip || {})){ const it = player.equip[k]; if (it && it.sigil) owned.add(it.sigil); }
  }
  const fresh = pool.filter(k => !owned.has(k));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}
// Gắn Khắc Ấn vào món đồ vừa sinh ra. Chỉ ô mặc được (không gắn lên áo choàng/cánh/pet — đó là
// đồ đặc biệt không rơi từ 3 nguồn này). Trả về true nếu có gắn.
function attachSigil(it, chance){
  if (!it || it.special || it.sigil) return false;
  if (Math.random() >= chance) return false;
  const s = rollSigil(player && player.sect);
  if (!s) return false;
  it.sigil = s;
  return true;
}
// Dòng thông báo khi Khắc Ấn rơi — nêu luôn hiệu ứng, vì cái người chơi cần biết không phải
// "vừa nhặt được món hiếm" mà là "món này làm chiêu của mình khác đi thế nào".
function sigilGotLine(k){
  const s = SIGIL_DEFS[k];
  return `<b style="color:${s.color}">◆ KHẮC ẤN — ${s.name}</b><br><span style="opacity:.8;font-size:12px">${s.desc}</span>`;
}
// Băng-rôn + tiếng khi một Khắc Ấn rơi ra, dùng chung cho cả 3 nguồn
function sigilAnnounce(k, x, y){
  const s = SIGIL_DEFS[k];
  zoneBanner = { text:'◆ KHẮC ẤN HIỆN THẾ', sub:`${s.name} — ${s.desc}`, color:s.color, t:6 };
  addFloat(x, y, `◆ ${s.name}`, s.color, 16);
  AudioSys.sfx('levelup', 1);
}
// Tứ Châu: ◎ Chúc Phúc (+1..+6 miễn phí 100%) · ◉ Linh Hồn (+1 bất kỳ, 50%, xịt tụt 1)
//          ❤ Sinh Mệnh (+4%→+28% HP theo bậc, xịt về 0) · ● Hỗn Độn (luyện Linh Dực / đổi Cổ Thần)
const JEWEL_NAMES = { chucPhuc:'◎ Chúc Phúc Châu', linhHon:'◉ Linh Hồn Châu', sinhMenh:'❤ Sinh Mệnh Châu', honDon:'● Hỗn Độn Châu' };
const JEWEL_COLORS = { chucPhuc:'#7ec850', linhHon:'#b08ae8', sinhMenh:'#e84a6a', honDon:'#7ecbff' };
// Bảo Hạp 7 tầng — rơi từ Ma Tôn Giáng Thế (4 giờ/lần). Cổ Thần chỉ từ tầng IV+, 5-8%, KHÔNG pity.
const BAOHAP_TIERS = [ null,
  { name:'Bảo Hạp I',   min:1,  max:14,  ancient:0,    color:'#9aa8d4' },
  { name:'Bảo Hạp II',  min:15, max:29,  ancient:0,    color:'#7ec850' },
  { name:'Bảo Hạp III', min:30, max:44,  ancient:0,    color:'#5aa0e8' },
  { name:'Bảo Hạp IV',  min:45, max:59,  ancient:0.05, color:'#b08ae8' },
  { name:'Bảo Hạp V',   min:60, max:74,  ancient:0.06, color:'#e8b04a' },
  { name:'Bảo Hạp VI',  min:75, max:89,  ancient:0.07, color:'#ff6a3a' },
  { name:'Bảo Hạp VII', min:90, max:999, ancient:0.08, color:'#7ecbff' },
];
// Ma Tôn Giáng Thế: 0h/4h/8h/12h/16h/20h — Hạ Giới & Thượng Giới luân phiên
const MATON_HA = ['daohoa','ngoai','chungnam'];
const MATON_THUONG = ['comoc','tuyettinh','mongco','nhanmon'];
// Truy Nã Lệnh — boss săn ngày theo vùng cấp (NPC Bổ Đầu · Tương Dương)
const TRUYNA_BANDS = [
  { max:14,  map:'daohoa',    name:'Đầu Lĩnh Gloam' },
  { max:29,  map:'ngoai',     name:'Đại Đầu Mục Gloam' },
  { max:44,  map:'chungnam',  name:'Chỉ Huy Phản Loạn Thornwood' },
  { max:59,  map:'comoc',     name:'Chúa Tể Hang Sâu' },
  { max:74,  map:'tuyettinh', name:'Độc Hoa Chúa Tể' },
  { max:89,  map:'mongco',    name:'Tàn Tướng Tro Tàn' },
  { max:999, map:'nhanmon',   name:'Sát Thần Bão Tố' },
];
// Vạn Duyên Các — gacha NPC Thần Toán Tử: 5% bí kíp hiếm / 15% châu / 25% trang bị / 30% vật liệu / 25% bạc·tu vi (KHÔNG pity)
const VANDUYEN_RATES = [ { k:'bikip', w:5 }, { k:'chau', w:15 }, { k:'trangbi', w:25 }, { k:'vatlieu', w:30 }, { k:'bac', w:25 } ];
// ---------- Hệ thống mới theo GDD Dream of Wuxia ----------
// Instinct Channels: 8 mạch × 20 đốt, tiêu hao Instinct (tích lũy thụ động)
const MERIDIANS = [
  { id:'thaiam',   name:'Thái Âm Mạch',  stat:'hp',    per:40,  color:'#e8e8e8', label:'Sinh Lực', img:'k0_thaiam'},
  { id:'thieuduong',name:'Thiếu Dương Mạch', stat:'qi', per:6,   color:'#5db86a', label:'Qi', img:'k1_thieuduong'},
  { id:'thaiduong',name:'Thái Dương Mạch', stat:'atk',  per:3,   color:'#5aa0e8', label:'Tấn Công', img:'k2_thaiduong'},
  { id:'thieuam',  name:'Thiếu Âm Mạch', stat:'def',   per:3,   color:'#b08ae8', label:'Phòng Thủ', img:'k3_thieuam'},
  { id:'duongminh',name:'Dương Minh Mạch', stat:'eva', per:0.4, color:'#ffb15c', label:'Né Tránh', img:'k4_duongminh'},
  { id:'quyetam',  name:'Quyết Âm Mạch', stat:'crit',  per:0.4, color:'#e84a3a', label:'Bạo Kích', img:'k5_quyetam'},
  { id:'nham',     name:'Nhâm Mạch',     stat:'aspd',  per:0.4, color:'#3a9d8b', label:'Tốc Độ Đánh', img:'k6_nham'},
  { id:'doc',      name:'Đốc Mạch',      stat:'all',   per:1,   color:'#7ecbff', label:'Toàn Thuộc Tính', img:'k7_doc'},
];
// Ám Khí 7 tầng (điểm Chúc Phúc: đập xịt +1, đủ 10 điểm chắc chắn thành công)
const AMKHI_TIERS = [ null,
  { name:'Tinh Thiết Tiêu', color:'#5db86a', crit:2, eff:'Độc: 10% gây 500 ST/s trong 3s' },
  { name:'Mai Hoa Châm',    color:'#d8d8e8', crit:3, eff:'Làm chậm: 25% giảm 35% tốc chạy địch 2s' },
  { name:'Xuyên Tâm Đao',   color:'#b06ae8', crit:4, eff:'Phá Huyệt: phá hộ thể tinh anh/boss' },
  { name:'Phù Dung Nhẫn',   color:'#e0779a', crit:5, eff:'Thiên Hủ Độc: độc mạnh gấp đôi' },
  { name:'Diệt Hồn Sa',     color:'#9aa8d4', crit:6, eff:'Mù Lòa: 12% khiến địch đánh trượt 2s' },
  { name:'Khổng Tước Linh', color:'#3a9d8b', crit:8, eff:'Vạn Độc: độc lan AoE quanh mục tiêu' },
  { name:'Bạo Vũ Lê Hoa',   color:'#7ecbff', crit:10, eff:'Quỷ Kiến Sầu: 3% kết liễu địch dưới 20% HP' },
];
// Cung Tiễn 7 tầng — vũ khí phụ trợ lơ lửng sau lưng (mở ở cấp 30)
const BOW_TIERS = [ null,
  { name:'Linh Mộc Cung',    color:'#8ab86a', crit:3, pierce:0,    proc:12, pdmg:0.5 },
  { name:'Tinh Thiết Cung',  color:'#c0c8d8', crit:5, pierce:0.02, proc:14, pdmg:0.55 },
  { name:'Phá Phong Cung',   color:'#7ab0d8', crit:7, pierce:0.04, proc:16, pdmg:0.6 },
  { name:'Xuyên Vân Cung',   color:'#5aa0e8', crit:9, pierce:0.06, proc:18, pdmg:0.7, double:0.08 },
  { name:'Lạc Nhật Cung',    color:'#e8552a', crit:11, pierce:0.08, proc:20, pdmg:0.8, burn:true },
  { name:'Kinh Lôi Cung',    color:'#ffb15c', crit:13, pierce:0.10, proc:22, pdmg:0.9, stun:0.05 },
  { name:'Tru Tiên Thần Cung', color:'#7ecbff', crit:16, pierce:0.14, proc:26, pdmg:1.1, double:0.12, stun:0.06, burn:true },
];
// Cương Khí 7 tầng — kháng ám khí / giải khống chế, mỗi tầng kháng 20% hiệu ứng ám khí
const GANGKHI_TIERS = [ null,
  { name:'Sơ Nguyên Khí',     color:'#e8e8e8', hp:0.05, def:0.04 },
  { name:'Lăng Ba Khí',       color:'#5db86a', hp:0.08, def:0.07 },
  { name:'Kim Chung Trạo',    color:'#4c8dff', hp:0.12, def:0.10 },
  { name:'Lưu Ly Hộ Thể',     color:'#7ab0d8', hp:0.16, def:0.14 },
  { name:'Thái Cực Chân Khí', color:'#3a9d8b', hp:0.21, def:0.18 },
  { name:'Vô Tướng Thần Công', color:'#b08ae8', hp:0.27, def:0.23 },
  { name:'Bất Diệt Kim Thân', color:'#7ecbff', hp:0.35, def:0.30 },
];
// Danh hiệu — chỉ số cộng dồn vĩnh viễn, chọn 1 để hiển thị
const TITLES = [
  { id:'sonhap',  name:'Sơ Nhập Lunacia',    color:'#7ec850', cond:p=>p.level>=30,              desc:'Đạt cấp 30',           stats:{hp:500},        vfx:'' },
  { id:'bachtram',name:'Bách Quái Trảm',      color:'#d8d8d8', cond:p=>p.kills>=100,             desc:'Tiêu diệt 100 quái',   stats:{atkPct:0.05},   vfx:'' },
  { id:'thientram',name:'Thiên Quái Trảm',    color:'#e84a3a', cond:p=>p.kills>=1000,            desc:'Tiêu diệt 1.000 quái', stats:{crit:10},       vfx:'máu' },
  { id:'thoren',  name:'Thợ Rèn Truyền Thuyết', color:'#5aa0e8', cond:p=>p.forged11,             desc:'Rèn thành công +11',   stats:{forgeRate:5},   vfx:'lửa' },
  { id:'honnguyen',name:'Resonance Chân Quân', color:'#7ecbff', cond:p=>p.dantian.realm>=8,     desc:'Ascension cảnh 8 (Resonance Hậu Kỳ)', stats:{allPct:0.10}, vfx:'long' },
  { id:'hoathan', name:'Starforged Chân Nhân',   color:'#fff2b0', cond:p=>p.dantian.realm>=9,     desc:'Độ kiếp thành Starforged', stats:{allPct:0.15},   vfx:'long' },
  { id:'tuongduong',name:'Người Giữ Lunacia', color:'#ffd76a', cond:p=>p.dantian.realm>=8 && p.mount.tier>=8 && p.level>=60, desc:'Đỉnh cao mọi hệ thống', stats:{allPct:0.15}, vfx:'long' },
];
const TAN_QUYEN = ['Thượng','Trung','Hạ']; // Mảnh bí kíp Huyết Ma Thôn Phệ (boss drop)

const QUESTS = [
  { id:1, lv:1, name:'Kẻ Rơi Xuống',  desc:'Ngươi vừa vượt vết nứt và mất sạch ký ức võ nghệ. Đến gặp Trưởng Lão Rell giữa Lunaris City — ông ta là người Vaeldra duy nhất còn nhớ đội tiên phong.',
    type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:130, silver:50} },
  { id:2, lv:2, name:'Cơn Sốt Của Hòn Đảo', desc:'Khí Morvahn đã liếm tới Petalshade Isle — thú hiền hóa dại. Về đảo (bản đồ M → Dịch Chuyển) hạ 5 Axie Heo Rừng đang húc phá tổ ấp, rồi báo lại Trưởng Làng.',
    type:'kill', mob:'boar', need:5, rew:{xp:190, silver:60} },
  { id:3, lv:3, name:'Thuốc Cho Đàn Con', desc:'Lũ hatchling hít phải khí vết nứt, sốt cao không dứt. Trưởng Làng cần 4 Thảo Dược trong rừng phía đông đảo.',
    type:'collect', herbMap:'daohoa', need:4, rew:{xp:360, silver:90} },
  { id:4, lv:4, name:'Bầy Gai Đã Đổi Mắt', desc:'Axie Gai Tím trong rừng giờ mắt đỏ quạch và không còn biết sợ — dấu hiệu đầu tiên của Chimera hóa. Diệt 6 con trước khi chúng xuống tới làng.',
    type:'kill', mob:'wolf', need:6, rew:{xp:470, silver:110, mat:3, item:'vukhi'} },
  { id:5, lv:5, name:'Thép Của Ardhaven', desc:'Thợ rèn Ardhaven sống sót qua cuộc giao thoa, lò của ông vẫn đỏ lửa. Mang trang bị tới lò rèn (phím F) và Tăng Cường một món bất kỳ lên +3.',
    type:'enhance', need:3, rew:{xp:520, silver:130, mat:3} }, // P0: lò rèn mở ở cấp 4 — NV4 thưởng sẵn vũ khí + 3 huyền thiết để rèn ngay
  { id:6, lv:6, name:'Đoàn Gloam', desc:'Đoàn Gloam — lính Vaeldra đào ngũ — dụ đám Axie nhiễm khí làm tay sai đi cướp phá dân đảo. Diệt 8 Tay Sai Gloam trên đồi phía nam.',
    type:'kill', mob:'bandit', need:8, rew:{xp:1200, silver:170} }, // QA bot: tăng XP giữ nhịp cấp với chuỗi NV
  { id:7, lv:7, name:'Mảnh Ký Ức Đầu Tiên', desc:'Nước suối cạnh làng lọc sạch khí vết nứt. Đứng trong suối 8 giây — ký ức võ nghệ Vaeldra của ngươi sẽ nhen lại thành Instinct.',
    type:'meditate', need:8, rew:{xp:920, mat:3} },
  { id:8, lv:8, name:'Lớp Giáp Bóng Tối', desc:'Một Gloam Marauder đã ngấm khí Morvahn, bọc quanh mình lớp giáp bóng tối — sát thương thường giảm 70%. Dùng Ám Khí (phím 2) chọc thủng lớp giáp rồi kết liễu hắn.',
    type:'kill', mob:'assassin', need:1, rew:{xp:1900, silver:220} }, // QA bot: tăng XP giữ nhịp cấp
  { id:9, lv:9, name:'Bàn Tay Còn Nhớ', desc:'Ký ức chưa về, nhưng bàn tay đã nhớ ra tuyệt kỹ của môn phái (phím 3). Dùng nó kết liễu 5 Tay Sai Gloam.',
    type:'tpkill', mob:'bandit', need:5, rew:{xp:1600, silver:320} },
  { id:10, lv:10, name:'The Calling', desc:'Thủ lĩnh Đoàn Gloam đã dựng trại trên đài phía đông. Hạ hắn — và ký ức môn phái Vaeldra của ngươi sẽ trở về trọn vẹn.',
    type:'boss', mob:'boss', need:1, rew:{xp:2500, silver:500} },
];

// ---------- State ----------
let player = null;
let mobs = [], pickups = [], projectiles = [], effects = [], floats = [], decor = [], mists = [];
// ── Bộ máy chạy nền của Khắc Ấn (xem SIGIL_DEFS) ──
// sigilTimers: việc hẹn giờ (sóng thứ hai, mưa tên). sigilZones: vùng đất còn hiệu lực (vũng độc).
// Cả hai KHÔNG lưu vào save — chết/đổi map là mất, đúng như mọi hiệu ứng tạm khác trong game.
let sigilTimers = [], sigilZones = [];
// Chống đệ quy: sát thương do chính Khắc Ấn gây ra không được kích lại Khắc Ấn, nếu không
// Lan Trảm sẽ tự bật vòng quanh đến khi tràn ngăn xếp.
// Vùng sát thương diện rộng. Bọc quanh vòng lặp trúng-nhiều-mục-tiêu để hurtMob() nhận ra đây
// là AoE mà KHÔNG phải đổi `source` — `source` còn chi phối bạo kích, âm thanh và móc Khắc Ấn,
// nên đổi nó đi thì hỏng cả ba thứ đó.
let _aoeHit = false;
function aoeHit(fn){ const _p = _aoeHit; _aoeHit = true; try { return fn(); } finally { _aoeHit = _p; } }
let _sigilBusy = false;
let _sigilDepth = 0;          // chặn nổ dây chuyền của móc 'kill'
const SIGIL_MAX_DEPTH = 3;
// Ngữ cảnh đòn đang bay: chiêu nào gây ra nó ('a' chiêu chính · 'tp' Trấn Phái · null đòn thường)
// và đã chạm mấy con trong lần tung này. castSkill() chạy đồng bộ nên với chiêu chạm-ngay
// (cone/selfaoe/dash) cờ này còn nguyên lúc hurtMob() chạy; chiêu bắn đạn thì gắn cờ lên
// chính viên đạn (p.tag) và dựng lại lúc đạn trúng.
let _sigilTag = null, _sigilHits = 0;
let questIdx = 0, questProg = 0, questState = 'none'; // none | active | done | all
let springTimer = 0, victory = false, dead = false;
let camera = { x:0, y:0 };
// Feel mượt (kiểu VLTK Mobile): hit-stop khựng hình khi chém trúng, camera bám có gia tốc
// (lắc màn hình dùng hệ thống shakeT/shakeMag có sẵn — áp dụng trong render)
let hitStop = 0;
function snapCamera(){
  if (!player) return;
  camera.x = clamp(player.x - W/2, 0, Math.max(0, MAP.w - W));
  camera.y = clamp(player.y - H/2, 0, Math.max(0, MAP.h - H));
}
function lerpAng(a, b, t){ // nội suy góc theo đường ngắn nhất (tránh xoay ngược vòng)
  let d = (b - a) % (Math.PI*2);
  if (d > Math.PI) d -= Math.PI*2; else if (d < -Math.PI) d += Math.PI*2;
  return a + d*t;
}
let shakeT = 0, shakeMag = 0, shakeDir = 0; // rung màn hình khi bị đánh trúng (shakeDir: hướng cú đấm)
let keys = {};
let joyVec = { x:0, y:0 };
let moveTarget = null; // Click-to-move: đích chuột phải (canvas) hoặc bấm minimap — { x, y } world coords
let moveWaypoint = null, moveWaypointT = 0; // Waypoint gần né vật cản trên đường tới moveTarget — xem update()
let moveProgressT = 0, moveProgressD = Infinity; // Lưới an toàn chống kẹt vĩnh viễn khi tự đi — xem update()
let npcTalkTarget = null; // Click vào NPC / đèn hiệu nhiệm vụ: id NPC cần tự mở lời thoại khi tới nơi
let mouseWorld = { x:0, y:0 };
let lastTime = performance.now();
let saveTimer = 0;

const SPRING = { x: 500, y: 620, r: 70 };
const NPC = { x: 400, y: 400, name:'Trưởng Làng' };
const BOSS_ARENA = { x: 2300, y: 500 };

// QA bot playtest: NV3 (cấp 3) bắt nhặt thảo dược giữa bầy Tàn Lang (cấp 3) & Trận Nhân (cấp 9)
// khiến tân thủ chết liên tục — dời bụi thuốc về rừng phía đông GẦN làng, ngoài tầm aggro của cụm quái mạnh
// QA: trước đây chỉ có đúng 1 mảng dùng chung cho mọi map — mọi nhiệm vụ hái Thảo Dược (kể cả NV
// chính #12, ngay sau khi vừa đặt chân tới Lunaris City lần đầu) đều bị dẫn ngược về đảo khởi đầu
// Petalshade Isle dù người chơi đã đi xa. Đổi thành theo-từng-map (giống HORSE_ZONES bên dưới) —
// thêm bãi Thảo Dược ở Petalshade Outskirts (ngoai), ngay ngoài cổng thành, tránh xa các bãi quái.
const HERB_SPOTS = {
  daohoa: [
    { x:620, y:560 }, { x:760, y:700 }, { x:950, y:640 }, { x:1080, y:820 },
    { x:900, y:1180 }, { x:1200, y:900 }, { x:1350, y:1050 }, { x:1550, y:950 },
  ],
  ngoai: [
    { x:1280, y:380 }, { x:1420, y:400 }, { x:1000, y:420 }, { x:1650, y:460 },
    { x:450, y:700 }, { x:550, y:950 }, { x:1300, y:1650 }, { x:2300, y:1000 },
  ],
};

// ---------- Item generation ----------
let itemSeq = 1;
function rollRarity(bias){
  let pool = RARITIES.map((r,i)=>({ i, w: Math.max(0.1, r.w * (1 + bias * i * 0.35)) }));
  let tot = pool.reduce((s,p)=>s+p.w,0), roll = Math.random()*tot;
  for (const p of pool){ roll -= p.w; if (roll <= 0) return p.i; }
  return 0;
}
// Cấp trang bị: mỗi 10 level = 1 cấp, tổng 10 cấp (cánh/áo choàng/pet ngoài hệ này)
function itemTier(level){ return clamp(Math.ceil(level / 10), 1, 10); }
function itemReqLv(it){ return it.tier ? (it.tier - 1) * 10 + 1 : (it.cloakTier === 2 ? 60 : 1); }
function subName(k){
  return { atkPct:'Thêm Sát Thương', pierce:'Xuyên Giáp', defPct:'Phòng Ngự', hpPct:'Sinh Lực Tối Đa',
           qiPct:'Qi Tối Đa', evaPct:'Tránh Đòn', silverPct:'Đồng Rơi Thêm', reflectPct:'Phản Sát Thương',
           dmgred:'Giảm Sát Thương', perfect:'ST Hoàn Hảo', hpLeech:'Hút Sinh Lực', qiLeech:'Hút Qi',
           aspdPct:'Tốc Độ Đánh', expPct:'EXP Thêm', crit:'Bạo Kích' }[k] || k;
}
function genItem(level, bias, srcK, opts){
  const dropSlots = SLOTS.filter(s => !s.special);
  const slot = dropSlots[Math.floor(Math.random()*dropSlots.length)];
  // Drop v2.0: nguồn boss/tinh anh dùng bảng phẳng — xóa bias lv/10 thổi phồng Chí Tôn
  const r = srcK ? rollRaritySrc(srcK) : rollRarity(bias || 0);
  const tier = itemTier(level);
  const ilvl = (tier-1)*10 + Math.ceil(Math.random()*10);
  // `armorGroup &&` từng chặn ở đây, nên ô vũ khí LUÔN ra false: người chơi không thể có vũ
  // khí Hoàn Hảo bằng bất kỳ cách nào. Vũ khí là ô người ta để ý nhất mà lại là ô duy nhất bị
  // khoá — không có lý do thiết kế nào cho việc đó.
  const _pRate = opts && opts.perfect != null ? opts.perfect
               : srcK ? DROP_SRC[srcK].perfect : 0;
  const perfect = Math.random() < _pRate;
  const subs = rollSubs(slot.id, r, perfect);
  // Vận (Luck) — chỉ xuất hiện khi rơi, không rèn được: +5% ST bạo kích/món, +5% tỉ lệ rèn (tối đa +25%)
  const luck = Math.random() < 0.06 + r*0.025 + (srcK ? 0 : (bias||0)*0.04);
  return assignDef({
    uid: itemSeq++, slot: slot.id, slotName: slot.name,
    name: (perfect ? 'Hoàn Hảo ' : '') + ITEM_NAMES[slot.id][r],   // ghi đè bởi assignDef()
    rarity: r, level: ilvl, tier, perfect, luck, life: 0, ancient: null,
    main: { k: slot.main, v: slot.base(tier, r), name: mainName(slot.main) },
    // Hệ chỉ gắn lên VŨ KHÍ: nó là hệ của ĐÒN ĐÁNH. Trước đây mọi món đều mang một hệ mà
    // không ô nào đọc tới, còn Lò Hỗn Độn thì bán công thức Đổi Hệ ăn 1 Hỗn Độn Châu cho nó.
    element: slot.id === 'vukhi' ? ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)] : null,
    subs, plus: 0,
    exc: perfect ? rollExcLines(slot.id, opts && opts.bhTier) : null,
    awakened: AWAKENED[Math.floor(Math.random()*AWAKENED.length)],
  });
}
// Cổ Thần Thủ Hộ — chỉ mở từ Bảo Hạp: giáp Thần cấp 4 dòng Hoàn Hảo + ấn bộ ẩn
function genAncient(setId, slotId, level){
  const set = ANCIENT_SETS[setId];
  const slot = SLOTS.find(s => s.id === slotId);
  const r = 4, tier = itemTier(level);
  const ilvl = (tier-1)*10 + 10;
  const subs = rollSubs(slot.id, r, true);
  const it = assignDef({
    uid: itemSeq++, slot: slot.id, slotName: slot.name,
    name: set.name + ' · ' + ITEM_NAMES[slot.id][r],
    rarity: r, level: ilvl, tier, perfect: true, luck: Math.random() < 0.1, life: 0, ancient: setId,
    main: { k: slot.main, v: slot.base(tier, r), name: mainName(slot.main) },
    element: null,                      // Cổ Thần chỉ ra giáp — giáp không mang hệ
    subs, plus: 0,
    exc: rollExcLines(slot.id, 6),
    awakened: AWAKENED[Math.floor(Math.random()*AWAKENED.length)],
  });
  it.name = set.name + ' · ' + it.name;   // assignDef() đặt tên theo bộ lớp, bộ Cổ Thần đứng trước
  return it;
}
// Trang bị đặc biệt (Áo Choàng / Pet / Cánh): chỉ số cố định, không rèn
function specialItem(slot, def, extra){
  const subs = [];
  for (const k in def){
    if (['atkPct','pierce','defPct','hpPct','evaPct','silverPct','expPct','hpLeech','crit','aspdPct'].includes(k))
      subs.push({ k, name: subName(k), v: def[k], pct: true });
  }
  return Object.assign({
    uid: itemSeq++, slot, slotName: (SLOTS.find(s=>s.id===slot) || {}).name || slot,
    name: def.name, rarity: 4, level: 1, tier: 0, special: true, noForge: true,
    main: null, element: 'Kim', subs, plus: 0, awakened: AWAKENED[0],
  }, extra || {});
}
function genCloak(t){ return specialItem('aochoang', CLOAK_TIERS[t], { cloakTier: t }); }
function genPet(i){ return specialItem('pet', PET_DEFS[i], { pet: PET_DEFS[i].id }); }
function genWing(i){ return specialItem('canh', WING_DEFS[i], { wing: WING_DEFS[i].id }); }
function mainName(k){
  return { atk:'Công Kích', def:'Phòng Ngự', vit:'Sinh Lực', str:'Lực Lượng',
           agi:'Mẫn Tiệp', hp:'Sinh Lực tối đa', crit:'Bạo Kích %', qireg:'Hồi Instinct' }[k] || k;
}
// ═══════════ SO SÁNH TRANG BỊ — nửa còn lại của bài học Loot 2.0 ═══════════
// Với 15 dòng phụ đều là % thuần, người chơi KHÔNG có cách nào tự nhìn ra món vừa nhặt hơn
// hay kém món đang mặc. Trước đây túi đồ chỉ có một mũi ▲ xanh dựa trên itemPower() — nói
// được "to hơn" nhưng không nói được "khác chỗ nào", và đặc biệt là mù hoàn toàn với Khắc Ấn.

// Gom mọi dòng chỉ số của một món về chung một bảng để trừ nhau được.
// Khoá có tiền tố để dòng chính / dòng phụ / dòng Thức Tỉnh cùng loại không đè lên nhau.
function itemStatMap(it){
  const m = 1 + it.plus * 0.08, o = {};
  if (it.main) o['m:' + it.main.k] = { name: it.main.name, v: it.main.v * m, pct: false };
  for (const s of it.subs)
    o['s:' + s.k] = { name: s.name, v: s.v * (s.k === 'perfect' ? 1 : m), pct: true };
  if (it.plus >= 10 && it.awakened)
    o['a:' + it.awakened.k] = { name: '☆ ' + it.awakened.name, v: it.awakened.v, pct: false };
  return o;
}
// Khắc Ấn món này MANG LẠI mà hiện người chơi chưa có (đã tính cả việc mặc nó vào sẽ tháo
// món cũ ra). Trả về id, hoặc null.
function itemSigilNew(it){
  if (!it || !it.sigil || !sigilUsable(it.sigil)) return null;
  if (player && player.sigils && player.sigils[it.sigil]){
    // đang có rồi — nhưng nếu nguồn duy nhất chính là món ở ĐÚNG ô này thì mặc vào không mất gì
    const cur = player.equip && player.equip[it.slot];
    if (!(cur && cur.sigil === it.sigil)) return null;
  }
  return it.sigil;
}
// Khắc Ấn sẽ MẤT nếu tháo món đang mặc ở ô này ra (không món nào khác đang cấp nó).
function itemSigilLost(slot, incoming){
  const cur = player && player.equip && player.equip[slot];
  if (!cur || !cur.sigil || !sigilUsable(cur.sigil)) return null;
  if (incoming && incoming.sigil === cur.sigil) return null;
  for (const k in player.equip){
    if (k === slot) continue;
    const o = player.equip[k];
    if (o && o.sigil === cur.sigil) return null;   // món khác vẫn cấp Khắc Ấn này
  }
  return cur.sigil;
}
// Bảng so sánh đầy đủ giữa món trong túi và món đang mặc cùng ô.
// ═══════════ THẺ THÔNG TIN VẬT PHẨM KHI RÊ CHUỘT ═══════════
// Trước bản này, rê chuột lên ô đồ chỉ ra tooltip mặc định của trình duyệt: chờ ~500ms, chữ
// xám một cỡ, không màu phẩm, không chỉ số, không so sánh. Muốn xem đầy đủ phải bấm nút ⋯ bé
// xíu ở góc ô, rồi bảng chi tiết hiện ra DƯỚI cả lưới 30 ô — cuộn khỏi món vừa bấm.
// Nay: rê tới đâu hiện thẻ tới đó, ngay cạnh con trỏ, kèm thẻ MÓN ĐANG MẶC đặt sát bên để so.
const TIP_DELAY = 90;         // đủ để lướt ngang qua lưới không nháy loạn
let _tipEl = null, _tipT = 0, _tipKey = '';
function tipEl(){
  if (!_tipEl){ _tipEl = document.createElement('div'); _tipEl.className = 'itip'; _tipEl.hidden = true;
    document.body.appendChild(_tipEl); }
  return _tipEl;
}
function tipItemFrom(key){
  if (!player || !key) return null;
  const [k, v] = key.split(':');
  if (k === 'inv') return player.inv[+v] || null;
  if (k === 'eq')  return player.equip[v] || null;
  return null;
}
// Một dòng chỉ số. `cmp` là bảng chỉ số của món đối chiếu — có thì in luôn chênh lệch ngay
// sau con số, đúng chỗ mắt đang nhìn, thay vì đẩy xuống một khối "so sánh" riêng bên dưới.
// Một dòng chỉ số kiểu MU: nhãn trái, số phải, hết. Chênh lệch in ngay sau con số — đúng chỗ
// mắt đang nhìn, thay vì đẩy xuống một đoạn văn "so sánh" riêng bên dưới.
function tipStatRow(st, cmp, key, cls){
  const unit = st.pct ? '%' : '';
  const v = Math.round(st.v * 10) / 10;
  let d = '';
  if (cmp){
    const o = cmp[key], ov = o ? o.v : 0;
    const dd = Math.round((st.v - ov) * 10) / 10;
    if (dd) d = `<i class="itip-d ${dd > 0 ? 'up' : 'dn'}">${dd > 0 ? '+' : ''}${dd}${unit}</i>`;
  }
  return `<div class="itip-row${cls ? ' ' + cls : ''}"><span>${st.name}</span><b>+${v}${unit}</b>${d}</div>`;
}
function tipCard(it, cmpItem, tag){
  if (!it) return '';
  const r = RARITIES[it.rarity] || RARITIES[0];
  const col = it.special ? '#7ecbff' : r.color;
  let h = `<div class="itip-card" style="--rc:${col}">`;
  if (tag) h += `<div class="itip-tag">${tag}</div>`;
  h += `<div class="itip-top">${slotIcon(it, 'itip-ic')}
    <div class="itip-name" style="color:${col}">${it.name}${it.plus ? ' <em>+' + it.plus + '</em>' : ''}</div>`;
  if (it.special) return h + `</div><div class="itip-sec">${(it.subs || []).map(sb =>
      `<div class="itip-row"><span>${sb.name}</span><b>+${Math.round(sb.v * 10) / 10}%</b></div>`).join('')}</div></div>`;

  // Dòng phụ đề gộp phẩm + giai + mọi nhãn đặc biệt vào MỘT hàng. Bản trước tách thành hai
  // hàng thẻ chip rồi thêm một hàng huy hiệu nữa — ba hàng cho thứ đọc lướt trong nửa giây.
  const sub = [`<span style="color:${col}">${r.name}</span>`, `${giaiName(it.tier)} · C${it.tier}`];
  if (it.perfect) sub.push(`<span style="color:#ffd76a">✦Hoàn Hảo</span>`);
  if (it.ancient && ANCIENT_SETS[it.ancient]){
    const st = ANCIENT_SETS[it.ancient], act = player && player.setActive && player.setActive[it.ancient];
    sub.push(`<span style="color:${st.color}">◈${st.name}${act ? ' ' + act.n + '/5' : ''}</span>`);
  }
  if (it.luck) sub.push(`<span style="color:#7fd8e0">☘Vận</span>`);
  if (it.life) sub.push(`<span style="color:#e84a6a">❤+${it.life * 4}%HP</span>`);
  h += `<div class="itip-sub">${sub.join(' · ')}</div></div>`;

  const cmp = cmpItem ? itemStatMap(cmpItem) : null;
  const mine = itemStatMap(it);
  h += `<div class="itip-sec">`;
  for (const k in mine) h += tipStatRow(mine[k], cmp, k);
  if (cmp) for (const k in cmp) if (!(k in mine)){
    const o = cmp[k], unit = o.pct ? '%' : '';
    h += `<div class="itip-row lost"><span>${o.name}</span><b>—</b><i class="itip-d dn">${-Math.round(o.v * 10) / 10}${unit}</i></div>`;
  }
  if (hasElem(it)) h += `<div class="itip-row"><span>Hệ đòn đánh</span><b style="color:${elColor(it.element)}">${ELEM[it.element].glyph} ${elName(it.element)}</b></div>`;
  h += `</div>`;

  const need = itemReqLv(it), low = player && player.level < need;
  h += `<div class="itip-sec req${low ? ' bad' : ''}">Yêu cầu cấp ${need}</div>`;

  if (it.exc && it.exc.length){
    h += `<div class="itip-sec exc">`;
    for (const e of it.exc){
      const v = e.k === 'excAtkLv' ? Math.floor((player ? player.level : 20) / 20) : e.v;
      h += `<div>${e.name} +${v}${e.flat ? '' : '%'}</div>`;
    }
    h += `</div>`;
  }
  if (it.plus >= 10 && it.awakened) h += `<div class="itip-sec awk">☆ ${it.awakened.name}</div>`;
  if (it.sigil && SIGIL_DEFS[it.sigil]){
    const sg = SIGIL_DEFS[it.sigil], ok = sigilUsable(it.sigil);
    h += `<div class="itip-sec sig${ok ? '' : ' off'}" style="--sc:${ok ? sg.color : '#6a6a72'}">
      <b>◆ ${sg.name}</b>${ok ? '' : ' (lớp khác)'}<div>${sg.desc}</div></div>`;
  }
  return h + `</div>`;
}
function tipHtml(it, isEquipped){
  const cur = (!isEquipped && it && !it.special && it.slot) ? player.equip[it.slot] : null;
  const two = cur && cur !== it;
  let h = `<div class="itip-wrap">${tipCard(it, two ? cur : null, two ? 'MÓN NÀY' : '')}`;
  if (two) h += tipCard(cur, null, 'ĐANG MẶC');
  h += `</div>`;
  if (!isEquipped && it && !it.special) h += tipVerdict(it);
  return h;
}
// Phán quyết rút về ĐÚNG MỘT DÒNG. Chênh lệch từng chỉ số đã in ngay cạnh con số ở trên rồi,
// nên đoạn "so với đang mặc… (lực chiến A → B)" cộng dãy delta dài ở bản cũ chỉ là nói lại.
function tipVerdict(it){
  const cur = player.equip[it.slot];
  const need = itemReqLv(it);
  const rows = [];
  if (player.level < need) rows.push(['#ff7a6a', `Chưa đủ cấp — cần LV${need}`]);
  else {
    const g = itemSigilNew(it);
    if (g) rows.push([SIGIL_DEFS[g].color, `◆ Mới: ${SIGIL_DEFS[g].name}`]);
    if (!cur) rows.push(['#6ae88a', 'Ô đang trống']);
    else {
      const pct = Math.round((itemPower(it) / itemPower(cur) - 1) * 100);
      rows.push(pct >= 3 ? ['#6ae88a', `▲ Mạnh hơn ${pct}%`]
              : pct <= -3 ? ['#ff7a6a', `▼ Yếu hơn ${-pct}%`]
              : ['#c9b889', '≈ Ngang nhau']);
    }
  }
  const lost = itemSigilLost(it.slot, it);
  if (lost) rows.push(['#ff9a6a', `⚠ Mất ${SIGIL_DEFS[lost].name}`]);
  if (cur && cur.ancient && cur.ancient !== it.ancient && ANCIENT_SETS[cur.ancient]){
    const n = (player.setActive && player.setActive[cur.ancient] || {}).n || 0;
    rows.push(['#ff9a6a', `⚠ Rời bộ ${ANCIENT_SETS[cur.ancient].name} (${n}/5)`]);
  }
  return `<div class="itip-foot">${rows.map(([c, t]) => `<span style="color:${c}">${t}</span>`).join('')}</div>`;
}
function placeTip(anchor){
  const t = tipEl(), r = anchor.getBoundingClientRect();
  t.hidden = false;
  t.style.left = '0px'; t.style.top = '0px';   // đo ở góc 0,0 rồi mới dời — tránh thẻ tự kẹp mình
  const b = t.getBoundingClientRect(), M = 8;
  let x = r.right + 10;
  if (x + b.width > innerWidth - M) x = r.left - b.width - 10;      // lật sang trái
  if (x < M) x = Math.max(M, (innerWidth - b.width) / 2);           // vẫn không đủ: canh giữa
  let y = r.top - 6;
  if (y + b.height > innerHeight - M) y = innerHeight - b.height - M;
  t.style.left = Math.round(Math.max(M, x)) + 'px';
  t.style.top  = Math.round(Math.max(M, y)) + 'px';
}
function hideItemTip(){ clearTimeout(_tipT); _tipKey = ''; if (_tipEl) _tipEl.hidden = true; }
function showItemTip(cell){
  const key = cell.getAttribute('data-tip');
  if (key === _tipKey) return;
  clearTimeout(_tipT);
  _tipT = setTimeout(() => {
    const it = tipItemFrom(key);
    if (!it || !document.body.contains(cell)) return hideItemTip();
    _tipKey = key;
    const t = tipEl();
    t.innerHTML = tipHtml(it, key.startsWith('eq:'));
    placeTip(cell);
  }, TIP_DELAY);
}
// Uỷ quyền sự kiện ở document: lưới túi đồ dựng lại toàn bộ innerHTML mỗi lần thay đổi, gắn
// listener lên từng ô sẽ mất sạch sau lần render kế tiếp.
// Chỉ bật trên thiết bị THẬT SỰ có con trỏ — trên điện thoại một cú chạm vừa mở thẻ vừa mặc
// đồ, người chơi không kịp đọc; ở đó nút ⋯ vẫn là đường xem chi tiết.
if (window.matchMedia && window.matchMedia('(hover: hover)').matches){
  document.addEventListener('mouseover', e => {
    const c = e.target.closest && e.target.closest('[data-tip]');
    if (c) showItemTip(c); else if (!(e.target.closest && e.target.closest('.itip'))) hideItemTip();
  });
  document.addEventListener('mousedown', hideItemTip);
  window.addEventListener('scroll', hideItemTip, true);
  window.addEventListener('blur', hideItemTip);
}

function itemPower(it){
  const m = 1 + it.plus * 0.08;
  let p = it.main ? it.main.v * m * 10 : 0;
  for (const s of it.subs) p += s.pct ? s.v * 22 : s.v * 8;
  // Dòng Hoàn Hảo PHẢI vào lực chiến. Bỏ qua thì mũi ▲, tự-mặc-đồ và nút Mặc Đồ Tốt Nhất
  // đều mù trước thứ đắt nhất game — người chơi sẽ bị auto tháo mất đồ Hoàn Hảo.
  if (it.exc) for (const e of it.exc) p += (e.flat ? e.v * 14 : e.v * 26);
  if (it.plus >= 10) p += it.awakened.v * 12;
  return Math.round(p);
}

// ---------- GDD Đợt 2 B6/B7: giá bán theo Lực chiến · bán lẻ · tự mặc đồ ----------
function itemSellPrice(it){ return 20 + (it.tier || 1)*15 + it.rarity*40 + Math.round(itemPower(it)*0.8); }
window.sellItem = function(i){
  const it = player.inv[i];
  if (!it) return;
  const precious = it.rarity >= 2 || it.perfect || it.ancient || it.sigil; // xác nhận 2 lớp với đồ quý (Khắc Ấn luôn tính là quý)
  if (precious && window._sellArm !== i){
    window._sellArm = i;
    addFloat(player.x, player.y-40, `Bấm Bán lần nữa để xác nhận bán ${it.name}`, '#ffb066', 12);
    AudioSys.sfx('ui', 0.4);
    return;
  }
  window._sellArm = -1;
  const v = itemSellPrice(it);
  player.silver += v; player.inv.splice(i, 1);
  addFloat(player.x, player.y-40, `Bán ${it.name} +${v}◈`, '#7ecbff', 12);
  AudioSys.sfx('quest', 0.3);
  if (window.bagSel >= player.inv.length) window.bagSel = -1;
  try{ renderInv(); renderBag(); }catch { /* best-effort — bỏ qua nếu lỗi */ }
  saveGame();
};
// B7: tự mặc đồ mạnh hơn khi nhặt — ≥105% lực chiến, đồ quý (Hoàn Hảo/Cổ Thần/☘Vận) cần ≥115%
function tryAutoEquip(it){
  if (!player.autoEquip || !it.slot || it.special) return;
  if (player.level < itemReqLv(it)) return;
  if (!itemUsable(it)) return;                     // khoá lớp — chặn ở CẢ BA chỗ mặc đồ
  const cur = player.equip[it.slot];
  const cp = cur ? itemPower(cur) : 0, np = itemPower(it);
  // Khắc Ấn nằm ngoài lực chiến hoàn toàn. Không chặn ở đây thì tự-mặc-đồ sẽ lặng lẽ tháo mất
  // một Khắc Ấn chỉ vì món mới nhiều hơn 5% chỉ số — mất thứ đắt nhất game vì một con số nhỏ.
  if (itemSigilLost(it.slot, it)) return;
  const _sgGain = !!itemSigilNew(it);
  if (!_sgGain && np < Math.max(cp*1.05, cp + 1)) return;
  if (!_sgGain && cur && (cur.perfect || cur.ancient || cur.luck) && np < cp*1.15) return;
  const idx = player.inv.indexOf(it);
  if (idx < 0) return;
  player.inv.splice(idx, 1);
  if (cur) player.inv.push(cur);
  player.equip[it.slot] = it;
  addFloat(player.x, player.y-62, `⚡ Tự mặc ${it.name} (+${np-cp} LC)`, '#6ae88a', 12);
  calcDerived();
};
window.autoEquipBest = function(){
  let swapped = 0, gained = 0;
  for (const sl of SLOTS){
    // Xếp hạng theo HAI khoá, không phải một: (có Khắc Ấn mới) rồi mới tới lực chiến.
    // Nhân lực chiến với một hệ số cố định là sai — Khắc Ấn khan hiếm hơn hẳn (mỗi lớp chỉ
    // 4 cái, chỉ từ 3 nguồn cuối game) nên chênh lệch chỉ số bao nhiêu cũng không mua lại được.
    let bi = -1, bs = false, bp = player.equip[sl.id] ? itemPower(player.equip[sl.id]) : 0;
    for (let i2 = 0; i2 < player.inv.length; i2++){
      const it2 = player.inv[i2];
      if (it2.slot !== sl.id || it2.special || player.level < itemReqLv(it2)) continue;
      if (!itemUsable(it2)) continue;              // khoá lớp — bỏ sót đây là auto lách được luật
      if (itemSigilLost(sl.id, it2)) continue;   // cùng lý do như tryAutoEquip: đừng tháo mất Khắc Ấn
      const s2 = !!itemSigilNew(it2), p2 = itemPower(it2);
      if (s2 !== bs ? s2 : p2 > bp){ bs = s2; bp = p2; bi = i2; }
    }
    if (bi >= 0){
      const it2 = player.inv[bi];
      // lấy lực chiến THẬT của món được chọn, không lấy bp (đã nhân hệ số ưu tiên Khắc Ấn)
      gained += itemPower(it2) - (player.equip[sl.id] ? itemPower(player.equip[sl.id]) : 0);
      player.inv.splice(bi, 1);
      if (player.equip[sl.id]) player.inv.push(player.equip[sl.id]);
      player.equip[sl.id] = it2;
      swapped++;
      // calcDerived() NGAY trong vòng lặp: player.sigils là thứ itemSigilNew() tra cứu, mà nó
      // chỉ được dựng lại ở đây. Nếu đợi tới cuối vòng thì ô sau vẫn thấy Khắc Ấn mà ô trước
      // vừa mặc là "chưa có" → khoá xếp hạng thứ nhất thắng, và nó mặc đồ rác để lấy một Khắc
      // Ấn mình đã có rồi. Mỗi lớp chỉ có 4 Khắc Ấn hợp lệ nên trùng lặp là chuyện thường.
      calcDerived();
    }
  }
  calcDerived(); try{ renderInv(); renderBag(); }catch { /* best-effort — bỏ qua nếu lỗi */ } saveGame();
  addFloat(player.x, player.y-56, swapped ? `⚡ Mặc đồ tốt nhất: thay ${swapped} món, +${gained} lực chiến!` : 'Trang bị đã tối ưu!', swapped ? '#6ae88a' : '#8a8a8a', 14);
  AudioSys.sfx('quest', 0.5);
};
window.toggleAutoEquip = function(v){ player.autoEquip = v; saveGame(); };

// ---------- Derived stats ----------
// ---------- THẦN BINH MÔN PHÁI (GDD §5) ----------
// Vũ khí danh tính theo phái — lơ lửng theo người, 10 tầng, buff chiêu môn phái.
// kind must be one of the 7 shapes drawThanBinh() knows how to render (kiem/dao/thuong/truong/
// quyen/quat/chau) — an unrecognized kind silently draws nothing, so bug/dawn below reuse the
// closest existing silhouette rather than inventing a new one.
const THANBINH = {
  vophai:   { name:'Wanderer\'s Gourd',   kind:'holu',   color:'#c8a86a', lore:'A hatchling\'s travel-worn flask — Wanderer\'s Resolve' },
  thieulam: { name:'Ironwrap Fists',      kind:'quyen',  color:'#ffb15c', lore:'Metal-bound knuckles — Mech striking discipline' },
  toanchan: { name:'Seven Currents Blade',kind:'kiem',   color:'#9fd0ff', lore:'True-current swordwork, seven stars converged' },
  baidasan: { name:'Serpent Fang Staff',  kind:'truong', color:'#7fe0a8', lore:'A venom-clan staff — the bite comes after the strike' },
  minhgiao: { name:'Sacred Flame Saber',  kind:'dao',    color:'#ff9a5a', lore:'The Sacred-Flame Sigil — a blade forged from cult fire' },
  bug:      { name:'Bramblebite Wraps',   kind:'quyen',  color:'#8a9a3a', lore:'Scrappy knuckle-wraps, one for every trick in the swarm' },
};
const TB_MAX_TIER = 10;
const TB_TIER_NAMES = ['Sơ Khai','Cường Hóa','Tinh Luyện','Kỳ Diệu','Hiếm Có','Tinh Xảo','Cổ Vật','Thánh Khí','Truyền Thuyết','Thức Tỉnh'];
const TB_TIER_COLORS = ['#9a7a4a','#9a7a4a','#9a7a4a','#c8c8d8','#c8c8d8','#c8c8d8','#7ecbff','#7ecbff','#7ecbff','#ffe9a8'];
function tbCost(t){ return { noidan: t*2, mat: t*15 }; } // nâng từ tầng t → t+1
function tbDef(){ return THANBINH[player.sect] || THANBINH.vophai; }
function tbNoidanTotal(){ let n = 0; for (const e in (player.noidan || {})) n += player.noidan[e] || 0; return n; }
function tbConsumeNoidan(n){ // trừ dần từ hành đang có nhiều nhất
  const els = ['Kim','Mộc','Thổ','Thủy','Hỏa'].sort((a,b)=>((player.noidan[b]||0)-(player.noidan[a]||0)));
  for (const e of els){ if (n <= 0) break; const take = Math.min(player.noidan[e] || 0, n); player.noidan[e] -= take; n -= take; }
}
window.upgradeThanBinh = function(){
  if (!player) return;
  const tb = player.thanbinh;
  if (tb.tier >= TB_MAX_TIER){ addFloat(player.x, player.y-56, 'Thần Binh đã THỨC TỈNH — tối đa!', '#ffe9a8', 13); return; }
  const c = tbCost(tb.tier);
  if (tbNoidanTotal() < c.noidan || player.mat < c.mat){
    addFloat(player.x, player.y-56, `Thiếu nguyên liệu: cần ${c.noidan} Nội Đan + ${c.mat} Tinh Thạch`, '#ff9a6a', 12);
    AudioSys.sfx('ui', 0.4); return;
  }
  tbConsumeNoidan(c.noidan); player.mat -= c.mat;
  tb.tier++;
  calcDerived();
  sideOnEvent('thanbinh');
  const def = tbDef();
  addFloat(player.x, player.y-64, `⚔ ${def.name} — tầng ${tb.tier}【${TB_TIER_NAMES[tb.tier-1]}】`, TB_TIER_COLORS[tb.tier-1], 15);
  addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:def.color, big:true });
  addEffect({ type:'ring', x:player.x, y:player.y, r:55, color:TB_TIER_COLORS[tb.tier-1], big:true });
  AudioSys.sfx('levelup', 0.8);
  saveGame();
  if (!el('panel-char').classList.contains('hidden')) renderCharPanel();
};

function calcDerived(){
  const sect0 = SECTS[player.sect];
  const b = sect0.bonus;
  const s = { str:player.str+b.str, agi:player.agi+b.agi, def:Math.round((player.def+b.def)*(sect0.defMult||1)), vit:player.vit+b.vit, ene:player.ene+(b.ene||0) };
  // P: tích lũy từ trang bị — flat + chỉ số % theo GDD
  const P = { atk:8 + player.level*2, hp:0, crit:0, eva:0, qireg:0,
    hpPct:0, qiPct:0, atkPct:0, dmgred:0, evaPct:0, silverPct:0, reflectPct:0,
    perfect:0, hpLeech:0, qiLeech:0, aspdPct:0, pierce:0, expPct:0, defPct:0, critDmg:0,
    // Ba cơ chế MỚI chỉ đồ Hoàn Hảo có. Thiếu ngăn ở đây thì applyLine() lặng lẽ bỏ qua —
    // dòng hiện trên nhãn món mà không có tác dụng gì.
    excQi:0, excHp:0, excBlock:0, excAtkLv:0 };
  let luckN = 0;
  const setCount = {};
  const sigilOwned = {};   // Khắc Ấn gom từ đồ ĐANG MẶC (đồ trong túi không tính)
  for (const slotId in player.equip){
    const it = player.equip[slotId];
    if (!it) continue;
    const m = 1 + it.plus * 0.08;
    if (it.main) applyLine(s, it.main.k, it.main.v * m, P);
    for (const sub of it.subs) applyLine(s, sub.k, sub.k === 'perfect' ? sub.v : sub.v * m, P);
    // Dòng Hoàn Hảo KHÔNG nhân theo mức rèn: rèn làm mạnh chỉ số gốc, còn đây là dòng riêng
    // của món. Nhân cả hai thì +11 Hoàn Hảo vọt hẳn khỏi thang cân bằng.
    if (it.exc) for (const e of it.exc) applyLine(s, e.k, e.k === 'excAtkLv' ? Math.floor(player.level / 20) : e.v, P);
    if (it.plus >= 10 && it.awakened) applyLine(s, it.awakened.k, it.awakened.v, P);
    if (it.luck){ luckN++; P.critDmg += 5; }                 // Vận: +5% ST bạo/món
    if (it.life) P.hpPct += it.life * 4;                     // Sinh Mệnh: +4% HP/bậc (tối đa +28%)
    if (it.ancient && ANCIENT_SETS[it.ancient]) setCount[it.ancient] = (setCount[it.ancient] || 0) + 1;
    // Khắc Ấn: có mặc là có hiệu lực. Chỉ tính Khắc Ấn hợp lớp — nhặt được của lớp khác thì món
    // đồ vẫn dùng bình thường, riêng Khắc Ấn nằm im (nhãn món sẽ ghi rõ là không dùng được).
    if (it.sigil && SIGIL_DEFS[it.sigil] && sigilUsable(it.sigil)) sigilOwned[it.sigil] = true;
  }
  player.sigils = sigilOwned;
  // Cổ Thần Thủ Hộ — hiệu ứng bộ ẩn kích hoạt ở 2/3/5 món
  player.setActive = {};
  for (const sid in setCount){
    const n = setCount[sid], set = ANCIENT_SETS[sid];
    const act = [];
    if (n >= 2 && set.b2){ for (const k in set.b2) (P[k] !== undefined ? P[k] += set.b2[k] : 0); act.push(2); }
    if (n >= 3 && set.b3){ for (const k in set.b3) (P[k] !== undefined ? P[k] += set.b3[k] : 0); act.push(3); }
    if (n >= 5 && set.b5){ for (const k in set.b5) (P[k] !== undefined ? P[k] += set.b5[k] : 0); act.push(5); }
    player.setActive[sid] = { n, act };
  }
  // Thú Chiến gia trì (always active once owned — the beast's blessing)
  const mt = MOUNT_TIERS[(player.mount && player.mount.tier) || 0];
  if (mt){
    s.str += mt.str; s.agi += mt.agi; s.def += mt.def; s.vit += mt.vit;
    P.hp += mt.hp; P.crit += mt.crit; P.qireg += mt.qireg;
  }
  // Thần Binh môn phái: mỗi tầng +chỉ số nhỏ; %ST chiêu môn phái (tbDmg) áp trong castSkill
  const tbTier = (player.thanbinh && player.thanbinh.tier) || 0;
  if (tbTier > 0){ s.str += tbTier*3; s.agi += tbTier*2; s.def += tbTier*2; s.vit += tbTier*3; }
  player.tbDmg = tbTier * 0.025;
  // Ascension realm — MU Online-lite: không cần tự tay Ascension Trial/đốt Anima quản lý nữa, cảnh
  // giới tự tăng thẳng theo cấp độ (chạm cảnh tối đa Starforged ở cấp 108, dư 12 cấp "đã max" cuối
  // game). Ghi ngược vào player.dantian.realm để mọi chỗ đọc cũ (mở khóa kỹ năng/danh hiệu/UI) vẫn
  // đúng như trước, chỉ khác nguồn gán — không còn là lựa chọn/tốn tài nguyên của người chơi nữa.
  const realm = clamp(Math.floor(player.level / 12), 0, DANTIAN_REALMS.length - 1);
  if (player.dantian) player.dantian.realm = realm;
  const dr = DANTIAN_REALMS[realm];
  player.dStr = s.str; player.dAgi = s.agi; player.dDef = s.def; player.dVit = s.vit; player.dEne = s.ene;
  // Công Kích quy đổi theo atkSrc riêng từng phái (str/agi/ene trọng số khác nhau) thay vì chung str×2
  const atkSrc = sect0.atkSrc || { str: 2.0 };
  const rawAtk = (atkSrc.str || 0) * s.str + (atkSrc.agi || 0) * s.agi + (atkSrc.ene || 0) * s.ene;
  // Dòng Hoàn Hảo "ST theo cấp" = cấp ÷ 20. Cộng vào P.atk TRƯỚC khi nhân, để nó ăn mọi hệ số
  // về sau y như sát thương gốc — đây là dòng DUY NHẤT tự lớn theo cấp nhân vật.
  if (P.excAtkLv) P.atk += P.excAtkLv;
  player.atk = Math.round((P.atk + rawAtk) * (1 + dr.atk) * (sect0.dmgMult || 1));
  player.maxHp = Math.round((100 + player.level*15 + s.vit*12 + P.hp) * (1 + dr.hp) * (sect0.hpMult || 1));
  player.maxQi = 50 + player.level*5 + Math.round(s.ene*1.5); // Linh Lực: mỗi điểm +1.5 Chân Khí tối đa (mọi phái)
  player.crit = Math.min(0.45, s.agi*0.003 + P.crit/100);
  // Cương Khí aura: +HP% +DEF%
  const gk = GANGKHI_TIERS[(player.gangkhi && player.gangkhi.tier) || 0];
  if (gk){ P.hp += Math.round((100 + player.level*15) * gk.hp); s.def += Math.round(s.def * gk.def); }
  // Cung Tiễn: +bạo kích + xuyên giáp
  const bw = BOW_TIERS[(player.bow && player.bow.tier) || 0];
  if (bw) P.crit += bw.crit;
  // Instinct Channels — cũng tự thông theo cấp độ (không cần tự tay xung mạch từng huyệt nữa),
  // đều nhau cả 8 mạch, chạm mức tối đa (20 đốt/mạch) ở cấp 120
  const merPts = clamp(Math.floor(player.level / 6), 0, 20);
  let merAtk = 0, merHp = 0, merDef = 0, merCrit = 0, merEva = 0, merAspd = 0, merQi = 0;
  if (player.meridians){
    for (const md of MERIDIANS){
      player.meridians[md.id] = merPts;
      const n = merPts;
      if (!n) continue;
      if (md.stat==='hp') merHp += n * md.per;
      else if (md.stat==='qi') merQi += n * md.per;
      else if (md.stat==='atk') merAtk += n * md.per;
      else if (md.stat==='def') merDef += n * md.per;
      else if (md.stat==='eva') merEva += n * md.per;
      else if (md.stat==='crit') merCrit += n * md.per;
      else if (md.stat==='aspd') merAspd += n * md.per;
      else if (md.stat==='all'){ merAtk += n*2; merHp += n*25; merDef += n*2; merCrit += n*0.3; }
    }
  }
  player.eva  = Math.min(0.40, s.agi*0.0025 + P.eva/100 + merEva/100);
  player.aspd = Math.max(0.30, 0.85 - s.agi*0.004 - merAspd/100);
  player.defRed = s.def/(s.def + 60);
  player.qireg = 4 + P.qireg + dr.qireg; // GDD Đợt 2 B1: hồi cơ bản 2.5 -> 4.0
  player.speed = Math.round(190 * (realm >= 5 ? 1.10 : 1));
  if (player.ascended) player.speed = Math.round(player.speed * 1.25); // Starflight: ngự kiếm phi hành
  // ── Võ Học Phổ: tâm pháp bị động ──
  player.vhCdMult = 1; player.vhRegen = 0; player.vhPoisonRes = 0;
  if (player.vohoc){
    const VH = player.vohoc;
    if (VH.tlnoicong){ P.hpPct += 12; P.defPct += 8; }
    if (VH.dichcankinh){ player.vhRegen = 0.008; player.vhPoisonRes = 0.5; }
    if (VH.taytykinh) player.vhCdMult = 0.7;
    if (VH.thaikhacong) player.qireg += 4;
    if (VH.tieusi){ player.speed = Math.round(player.speed * 1.12); player.eva = Math.min(0.5, player.eva + 0.05); }
    if (VH.ngocnu){ P.aspdPct += 10; P.evaPct += 8; }
    if (VH.cuuamkinh){ P.atkPct += 8; P.defPct += 8; P.hpPct += 8; }
    if (VH.cuuduongkinh){ player.vhPoisonRes = Math.max(player.vhPoisonRes, 0.7); P.hpPct += 5; }
  }
  // Đan điền passives: Quy Nguyên (t4) phong mạch, Lưỡng Nghi (t5) phản đòn, Hỗn Nguyên (t8) bất tử
  player.stunProc = realm >= 4 ? 0.05 : 0;
  player.reflect = realm >= 5 ? 0.05 : 0;
  player.batTu = realm >= 8;
  player.atk = Math.round(player.atk + merAtk);
  player.maxHp = Math.round(player.maxHp + merHp);
  player.dDef = s.def + merDef;
  player.crit = Math.min(0.60, player.crit + merCrit/100);
  player.maxQi += merQi;
  // Danh hiệu: chỉ số cộng dồn từ TẤT CẢ danh hiệu đã mở khóa
  let tAtkPct = 0, tAllPct = 0, tHp = 0, tCrit = 0, tForge = 0;
  for (const t of TITLES){
    if (!player.titles.unlocked.includes(t.id)) continue;
    if (t.stats.hp) tHp += t.stats.hp;
    if (t.stats.atkPct) tAtkPct += t.stats.atkPct;
    if (t.stats.crit) tCrit += t.stats.crit;
    if (t.stats.allPct) tAllPct += t.stats.allPct;
    if (t.stats.forgeRate) tForge += t.stats.forgeRate;
  }
  player.forgeBonus = tForge + Math.min(25, luckN * 5); // Vận: +5% tỉ lệ rèn/món, tối đa +25%
  player.luckN = luckN;
  player.critDmgMult = 2 + P.critDmg/100; // Vận + bộ Cổ Thần: sát thương bạo kích ×2 → ×2.x
  // Tuyệt Học Cũ: chiêu Võ Học Phổ/Tấn Chức không còn nằm trong taskbar 3 ô (xem defaultSkillBar
  // và LEGACY_* ở khai báo VOHOC_DEFS) vẫn giữ giá trị — dồn thành % Công Kích vĩnh viễn, tự động
  // theo đúng điều kiện mở khóa gốc, không cần bấm nút hay học Bí Kíp nữa.
  // QA: điều kiện ở đây từng là `lv.phai === player.sect`, nên phần thưởng lớn nhất của Thăng Tiên
  // (ascendToImmortal → vhAutoLearn tự ngộ võ học CẢ 5 lớp, banner ghi rõ "ràng buộc Lớp phá bỏ")
  // hoàn toàn vô nghĩa: chiêu học thêm từ 4 lớp kia không cộng gì cả. vhLearned() vốn đã là nguồn
  // đúng duy nhất (chỉ tự ngộ chiêu của lớp mình, trừ khi đã Thăng Tiên) — bỏ điều kiện thừa đi.
  let legacyPct = 0;
  for (const sid of LEGACY_SECT_SKILLS){
    const lv = VOHOC_DEFS[sid];
    if (lv && vhLearned(sid)) legacyPct += LEGACY_TIER_PCT[lv.tier] || 0;
  }
  if (player.level >= SKILL_DEFS.amkhi.unlock) legacyPct += LEGACY_UNIVERSAL_PCT.amkhi;
  if (realm >= 4) legacyPct += LEGACY_UNIVERSAL_PCT.danchi; // Đạn Chỉ Thần Thông — req cũ
  if (player.bow && player.bow.tier > 0) legacyPct += LEGACY_UNIVERSAL_PCT.bow; // Linh Tiễn Xạ — req cũ
  if (realm >= 6) legacyPct += LEGACY_UNIVERSAL_PCT.tieuhon; // Tiêu Hồn Chưởng — req cũ
  player.legacyAtkPct = legacyPct;
  player.atk = Math.round(player.atk * (1 + tAtkPct + tAllPct + legacyPct/100));
  player.maxHp = Math.round((player.maxHp + tHp) * (1 + tAllPct));
  player.crit = Math.min(0.65, player.crit + tCrit/100);
  // Chỉ số % từ trang bị theo GDD (áp cuối, nhân/cộng độc lập)
  player.maxHp = Math.round(player.maxHp * (1 + P.hpPct/100));
  player.maxQi = Math.round(player.maxQi * (1 + P.qiPct/100));
  player.atk = Math.round(player.atk * (1 + P.atkPct/100));
  player.defRed = Math.min(0.78, player.defRed + P.dmgred/100 + P.defPct/100);
  player.eva = Math.min(0.45, player.eva + P.evaPct/100);
  player.aspd = Math.max(0.25, player.aspd * (1 - P.aspdPct/100));
  player.reflect = (player.reflect || 0) + P.reflectPct/100;
  player.pierce = (bw ? bw.pierce : 0) + P.pierce/100;
  player.silverPct = P.silverPct;
  player.expPct = P.expPct;
  // Lịch Tu Tiên: phúc trạch Tứ Quý
  if (player.gt){
    // (buff Tứ Quý theo mùa đã gỡ cùng Lịch Tu Tiên — mùa nay chỉ đổi thời tiết/hạt môi trường)
  }
  if (player.level < 20) player.qireg *= 1.5; // tân thủ hồi chân khí nhanh hơn — đỡ chết nhịp farm đầu game
  player.perfectProc = Math.min(0.5, P.perfect/100);
  // Bốn dòng Hoàn Hảo có cơ chế RIÊNG — phải đổ ra `player` mới có ai đọc được
  player.excQi = P.excQi;                       // hạ địch hồi Qi (số phẳng)
  player.excHp = P.excHp;                       // hạ địch hồi Sinh Lực (số phẳng)
  player.excBlock = Math.min(0.4, P.excBlock/100); // tỉ lệ đỡ đòn, chặn trần 40%
  player.hpLeech = P.hpLeech/100;
  player.qiLeech = P.qiLeech/100;
  // ── The Hatching: reset rồi áp trait (mọi hiệu ứng trait đều qua đây) ──
  player.dropBonus = 0; player.amkhiPct = 0; player.shieldBonus = 0; player.traitSatTam = false;
  player.potionPct = 0.4; player.skillDmgPct = 0; player.traitRevive = false; player.traitMerRate = 1; player.traitHerb = false;
  if (player.traits) for (const tid of player.traits){
    const tr = TRAITS.find(t => t.id === tid);
    if (tr && tr.late) tr.late(player);
  }
  // Nội Đan thôn phệ — chỉ số vĩnh viễn cộng thẳng
  const ndB = player.ndBonus || {};
  if (ndB.atk) player.atk += ndB.atk;
  if (ndB.hp) player.maxHp += ndB.hp;
  if (ndB.qi) player.maxQi += ndB.qi;
  if (ndB.def) player.defRed = Math.min(0.78, player.defRed + ndB.def*0.002);
  if (ndB.crit) player.crit = Math.min(0.65, player.crit + ndB.crit/100);
  // Tẩy Tủy Phong Huyệt (Reset kiểu MU): mỗi lần tẩy tủy cộng vĩnh viễn +2% Công/Mạng,
  // không bao giờ mất kể cả tẩy tủy tiếp — chỉ cấp độ/EXP bị đưa về 1, xem window.doTayTuy()
  if (player.resetCount){
    const rb = 1 + player.resetCount * 0.02;
    player.atk = Math.round(player.atk * rb);
    player.maxHp = Math.round(player.maxHp * rb);
  }
  if (player.maDao) player.atk = Math.round(player.atk * 1.15); // Sa Đọa — ma công tà ác
  if ((player.buffAtkT || 0) > 0) player.atk = Math.round(player.atk * 1.12); // Rượu Hổ Cốt
  // Võ Học Phổ: buff chủ động
  if ((player.vhDmgT || 0) > 0) player.atk = Math.round(player.atk * (1 + (player.vhDmgPct || 0)/100));
  if ((player.vhCritT || 0) > 0) player.crit = 1; // Trảm Ma Kiếm Pháp
  if ((player.vhEvaT || 0) > 0) player.eva = Math.min(1, player.eva + (player.vhEvaPct || 0)/100);
  if ((player.vhAspdT || 0) > 0) player.aspd = Math.max(0.2, player.aspd * (1 - (player.vhAspdPct || 0)/100));
  if ((player.vhReflT || 0) > 0) player.reflect = (player.reflect || 0) + 1; // Hắc Yêu Nghịch Kình Công: phản 100%
  player.hp = Math.min(player.hp, player.maxHp);
  player.qi = Math.min(player.qi, player.maxQi);
}
function applyLine(s, k, v, P){
  if (k==='str'||k==='agi'||k==='def'||k==='vit'||k==='ene') s[k] += Math.round(v);
  else if (P && k in P) P[k] += v;
}

// ---------- New game / save ----------
let sideStates = {}; // { [id]: { st:'active'|'done'|'claimed', prog } } — khai báo sớm để quick-start (?sect=) không dính TDZ
function newPlayer(sectKey){
  player = {
    sect: sectKey, x: 1300, y: 1040, face: 0,  // xuất phát: Tương Dương Thành, gần Quách Đại Hiệp
    level: 1, xp: 0, str: 5, agi: 5, def: 5, vit: 5, ene: 5, free: 0,
    hp: 130, qi: 55, silver: 30, mat: 0,
    equip: {}, inv: [], cd: { basic:0, a:0, amkhi:0, tp:0 },
    skillBar: defaultSkillBar(sectKey),   // 3 ô kỹ năng cố định (chính/phụ/buff) kiểu MU Online
    pk: false, toiac: 0, toiacT: 0,           // PK & Tội Ác (đỏ tên)
    gkBuffT: 0, poisonT: 0, autoSell: false,
    autoCfg: { skill:true, potion:true, potionPct:40, range:430, boss:false }, // Cài đặt Auto Farm (panel O)
    vohoc: {}, bikipVH: 0,
    skillLv: {},                                 // cấp từng kỹ năng 1-120                       // Võ Học Phổ: võ học đã học + Bí Kíp
    skillEvo: {},                                // Tiến Hóa Chiêu Thức: {[skillId]: ['power'|'swift', ...]} theo bậc 40/80/120
    tenuiTT: 0,                                    // Té Núi: hết hạn Trọng Thương (timestamp)
    gt: { t: GT_DAY*0.30 },                          // Lịch Tu Tiên: đồng hồ thế giới (giây game) — mở màn canh Thìn
    ascended: false,                               // Starflight: độ kiếp Starforged thành công → phá bỏ môn phái, thần tiên hóa cảnh
    gender: 'nam',                                 // hình dáng tiên nhân: nam / nu
    tienSkin: 'bach',                              // skin tiên y — xem TIEN_SKINS
    vhDmgT:0, vhDmgPct:0, vhEvaT:0, vhEvaPct:0, vhReflT:0, vhAspdT:0, vhAspdPct:0,
    vhCritT:0, vhLeechT:0, vhShield:0, vhReviveCd:0,
    shieldBroken: 0, atkAnim: 0, dashT: 0,
    tutStep: 0, tutDist: 0,                     // hướng dẫn tân thủ từng bước
    mount: { tier: 0, out: false },           // Thú Chiến: xuất trận đánh cùng, không cưỡi
    dantian: { realm: 0, tuvi: 0 },
    jewels: { chucPhuc: 0, linhHon: 0, sinhMenh: 0, honDon: 0 }, // Tứ Châu (Track HT)
    congHuan: 0,                           // Công Huân Lệnh — tiền tệ Vạn Duyên Các
    baohap: {},                            // Bảo Hạp Ma Tôn Giáng Thế { tier: số lượng }
    truyna: { day:'', state:'none', map:null }, // Truy Nã Lệnh ngày
    wpUnlocked: { tuongduong: true },      // Điểm dịch chuyển (bảng đồ M) — mở khoá khi đã từng đặt chân tới, xem travelTo()
    resetCount: 0,                         // Tẩy Tủy Phong Huyệt (Reset kiểu MU) — số lần đã tẩy tủy, +2% Công/Mạng vĩnh viễn/lần
    // Dream of Wuxia systems
    khi: 0,                                    // Instinct đả thông kinh mạch
    meridians: {},                             // { thaiam: 0..20, ... }
    gems: { tuLa: 0, honNguyen: 0 },           // Tu La Tinh Thạch / Hỗn Nguyên Thạch
    thanbinh: { tier: 1 },                     // Thần Binh môn phái — theo người từ đầu
    mats: { manh:0, tichMa:0, anTranAi:0, manhCoThan:0 }, // Vật liệu Drop v2.0
    bossPity: 0,                               // Pity đai: đếm Vệ Binh Trụ không ra Thần
    chinhPhat: { date:'', count:0 },           // Chinh Phạt Cổng Vực 1 lần/ngày
    bossKills: {},                             // { mapId: [bossId...] } — mở cổng ải
    storySeen: {}, clues: [], storyFlags: {},  // Cốt truyện Ngũ Trụ
    charms: 0,                                 // Thiên Mệnh Phù (bảo hiểm rèn đồ)
    potions: 3, potionCd: 0,                   // P0: Hồ Lô Thuốc — hồi 40% máu, cd 20s, tối đa 5 lọ
    buffAtkT: 0,                             // Rượu Hổ Cốt — +12% công lực có thời hạn
    loidonT: 0,                              // Lôi Độn Phù — giảm 40% ST thiên lôi có thời hạn
    noidan: {},                              // Nội Đan yêu thú theo hành { Kim, Mộc, Thổ, Thủy, Hỏa }
    ndBonus: { atk:0, hp:0, def:0, qi:0, crit:0 }, // chỉ số vĩnh viễn từ thôn phệ nội đan
    ndDay: '', ndCount: 0,                   // giới hạn thôn phệ 3 viên/ngày
    pet: null,                               // Linh Thú đồng hành { type, name, lv, el, feed }
    phongphu: 0,                             // Phong Linh Phù — thu phục linh thú
    abode: { tulinh:0, garden:[null,null,null] }, // Động Phủ: Tụ Linh Trận + Dược Viên
    maDao: false,                            // Sa Đọa — Tội Ác cao hắc hóa thành Ma Tu
    daily: { day:'', kills:0, noidan:0, dungeon:0, forge:0, claimed:false }, // Mục Tiêu Hôm Nay
    sectOffered: false,                      // đã mời bái sư ở cấp 10 chưa (chỉ dành cho Tán Nhân)
    traits: [], personality: 'trung',          // The Hatching: 3 trait + tính cách
    dhHate: {}, revengeKills: 0,                 // A3: thù hận Du Hiệp (nemesis-lite)
    reviveUsed: false, quzeTitle: false,
    tienDan: 0,                                // Tiến Cấp Đan (ám khí/cung tiễn/cương khí)
    amkhiX: { tier: 0, bless: 0 },             // Ám Khí 7 tầng + Chúc Phúc
    bow: { tier: 0, bless: 0 },                // Cung Tiễn (mở cấp 30)
    gangkhi: { tier: 0, bless: 0 },            // Cương Khí (kháng ám khí)
    titles: { unlocked: [], equipped: null },  // Danh hiệu
    kills: 0, forged11: false,
    bikip: { pieces: [0,0,0], hmtp: false },   // Tàn quyển Huyết Ma Thôn Phệ
    battuCd: 0,                                // Hỗn Nguyên Bất Tử cooldown
    maxJumps: 1,
    hintCd: {}, hintOff: {},                   // Nhắc Việc — GDD Đợt 2 B3 (fix: thiếu ở tạo mới, chỉ có trong loadGame backfill → crash updateHints() cho nhân vật mới chưa qua 1 lần save/load)
  };
  for (const m of MERIDIANS) player.meridians[m.id] = 0;
  for (const sl of SLOTS) player.equip[sl.id] = null;
  // starter weapon
  const w = genItem(1, 0); w.slot='weapon'; w.slotName='Vũ Khí';
  player.inv.push(w);
  questIdx = 0; questProg = 0; questState = 'active'; // quest 1 auto-accepted
  sideStates = {};
  victory = false; dead = false;
  curMap = 'tuongduong'; // tân thủ bắt đầu trong thành an toàn — không quái
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
  buildWorld();
}
// Save cũ không có `def` trên món nào, nên toàn bộ trang bị sẽ rơi về icon PNG dùng chung và
// KHÔNG bị khoá lớp — một Dark Wizard save cũ đang cầm kiếm sẽ tiếp tục cầm được. Danh mục 220
// món đổi hẳn hình dạng vật phẩm nên không có đường vá tại chỗ nào sạch: nâng phiên bản, xoá.
const SAVE_VERSION = 2;
function saveGame(){
  if (!player) return;
  try {
    const payload = JSON.stringify({
      v: SAVE_VERSION,
      player, questIdx, questProg, questState, victory, curMap, sideStates,
      savedAt: Date.now()
    });
    localStorage.setItem('vlcm_save', payload);
    // Đồng bộ lên cloud nếu game đang nhúng trong shell React (đã đăng nhập)
    if (window.parent && window.parent !== window){
      try { window.parent.postMessage({ type: 'vlcm:save', data: payload }, window.location.origin); } catch { /* best-effort — bỏ qua nếu lỗi */ }
    }
  } catch { /* best-effort — bỏ qua nếu lỗi */ }
}
function loadGame(){
  try {
    const raw = localStorage.getItem('vlcm_save');
    if (!raw) return false;
    const d = JSON.parse(raw);
    if ((d.v || 1) < SAVE_VERSION){
      // Nói rõ ra, đừng lặng lẽ xoá: mất nhân vật mà không hiểu vì sao là thứ tệ nhất.
      try { localStorage.removeItem('vlcm_save'); } catch { /* best-effort */ }
      window._saveWiped = true;
      return false;
    }
    player = d.player; questIdx = d.questIdx; questProg = d.questProg;
    questState = d.questState; victory = !!d.victory;
    sideStates = d.sideStates || {};
    // Phụ tuyến đã bị gỡ khỏi SIDE_QUESTS (s_sys1 Luyện Đan, s_sys6 Hóa Thân) vẫn nằm trong save
    // cũ. sideActive() đếm theo KEY chứ không đối chiếu SIDE_QUESTS, nên nếu để lại thì 2 slot
    // trong 3 slot phụ tuyến bị chiếm vĩnh viễn và người chơi không nhận thêm được NV nào nữa.
    for (const _sid in sideStates) if (!SIDE_QUESTS.some(q => q.id === _sid)) delete sideStates[_sid];
    if (!player.mount) player.mount = { tier: 0, out: false };
    player.mount.out = !!player.mount.out; delete player.mount.riding; // bỏ cơ chế cưỡi
    if (!player.dantian) player.dantian = { realm: 0, tuvi: 0 };
    if (!player.cd) player.cd = { basic:0, a:0, b:0, c:0 };
    // realm cap may have grown — clamp into range
    player.dantian.realm = Math.min(player.dantian.realm, DANTIAN_REALMS.length - 1);
    // Dream of Wuxia backfill
    if (player.khi == null) player.khi = 0;
    if (!player.meridians) player.meridians = {};
    for (const m of MERIDIANS) if (player.meridians[m.id] == null) player.meridians[m.id] = 0;
    // Bộ Cổ Thần đổi tên (Thanh Long… → Sarkaan…): ánh xạ id trên MỌI món đang giữ — cả
    // món trong túi lẫn món đang mặc. Bỏ sót chỗ nào là chỗ đó mất hiệu ứng bộ vĩnh viễn.
    for (const it of (player.inv || [])) if (it && ANCIENT_MIGRATE[it.ancient]) it.ancient = ANCIENT_MIGRATE[it.ancient];
    for (const k in (player.equip || {})){
      const it = player.equip[k];
      if (it && ANCIENT_MIGRATE[it.ancient]) it.ancient = ANCIENT_MIGRATE[it.ancient];
    }
    player.pendingHit = null;   // đòn thường đang hẹn không được sống sót qua lần tải lại
    if (!player.gems) player.gems = { tuLa: 0, honNguyen: 0 };
    if (player.charms == null) player.charms = 0;
    if (player.tienDan == null) player.tienDan = 0;
    if (!player.amkhiX) player.amkhiX = { tier: 0, bless: 0 };
    if (!player.bow) player.bow = { tier: 0, bless: 0 };
    if (!player.gangkhi) player.gangkhi = { tier: 0, bless: 0 };
    if (!player.titles) player.titles = { unlocked: [], equipped: null };
    if (player.kills == null) player.kills = 0;
    if (player.forged11 == null) player.forged11 = false;
    if (!player.bikip) player.bikip = { pieces: [0,0,0], hmtp: false };
    if (player.battuCd == null) player.battuCd = 0;
    // Phase C backfill: thanh kỹ năng, PK, tội ác, buff, độc, auto-sell
    // Tối giản taskbar (bản mới): luôn ép về đúng 3 ô cố định theo phái (chính/phụ/buff) — bỏ hẳn
    // ô 4-5 tự gán cũ, tránh save cũ kẹt lại chiêu giờ chỉ còn là bị động (không thể bấm được nữa).
    player.skillBar = defaultSkillBar(player.sect);
    // Cùng lý do: phím Space có thể còn trỏ vào chiêu đã rút khỏi taskbar (vd 'bow'/'tieuhon' từ save
    // cũ) — castSkill vẫn còn nhánh cho chúng nên chiêu đó sẽ lén bắn được, phá vỡ thiết kế 3 ô.
    if (player.spaceSkill && !player.skillBar.includes(player.spaceSkill)) player.spaceSkill = null;
    if (player.pk == null) player.pk = false;
    if (player.toiac == null) player.toiac = 0;
    if (player.toiacT == null) player.toiacT = 0;
    if (player.gkBuffT == null) player.gkBuffT = 0;
    if (!player.vohoc) player.vohoc = {};
    if (!player.skillLv) player.skillLv = {};
    if (!player.skillEvo) player.skillEvo = {};
    if (player.bikipVH == null) player.bikipVH = 0;
    if (!player.gt) player.gt = { t: GT_DAY*0.30 }; // Lịch Tu Tiên backfill
    if (player.poisonT == null) player.poisonT = 0;
    if (player.autoSell == null) player.autoSell = false;
    if (player.autoEquip == null) player.autoEquip = true;  // GDD Đợt 2 B7: mặc định bật tự mặc đồ
    if (player.maThau == null) player.maThau = 0;           // GDD Đợt 2 B5: Mã Thầu (Trại Ngựa)
    if (player.mountPity == null) player.mountPity = 0;     // GDD Đợt 2 B4: tích lũy thăng giai thú
    if (!player.horseDay) player.horseDay = { d:'', n:0 };  // giới hạn bắt ngựa 5 con/ngày
    if (!player.hintCd) player.hintCd = {};                 // GDD Đợt 2 B3: Nhắc Việc cooldown
    if (!player.hintOff) player.hintOff = {};               // Nhắc Việc: đã tắt (reset khi qua map)
    if (!player.wpUnlocked){                                // Điểm dịch chuyển: save cũ chưa có field này —
      player.wpUnlocked = {};                               // coi như đã "đặt chân" tới mọi vùng đã đủ điều kiện
      for (const id in MAPS) if (!MAPS[id].dungeon && mapGate(id).ok) player.wpUnlocked[id] = true; // (đừng bắt đi lại)
    }
    if (player.auto == null) player.auto = false; // auto farm (treo máy)
    if (!player.autoCfg) player.autoCfg = { skill:true, potion:true, potionPct:40, range:430, boss:false }; // Auto Farm cfg backfill
    if (player.ascended == null) player.ascended = false; // Starflight backfill
    if (!player.gender) player.gender = 'nam';
    if (!player.tienSkin) player.tienSkin = 'bach';
    // Save cũ đã đứng ở Starforged Cảnh trước khi có Starflight → tự thăng khi nạp game
    if (!player.ascended && player.dantian && player.dantian.realm >= DANTIAN_REALMS.length - 1) ascendToImmortal();
    if (!player.thanbinh) player.thanbinh = { tier: 1 }; // Thần Binh môn phái
    if (!player.mats) player.mats = { manh:0, tichMa:0, anTranAi:0, manhCoThan:0 };
    if (player.bossPity == null) player.bossPity = 0;
    if (!player.chinhPhat) player.chinhPhat = { date:'', count:0 };
    if (!player.bossKills) player.bossKills = {};
    // Save cũ còn giữ trạng thái của 4 hệ đã gỡ (Hóa Thân · Trận Địa Phòng Thủ · Chiến Trường ·
    // Luyện Đan). Không còn ai đọc chúng nữa, nhưng cứ để nguyên thì save phình ra mãi và bảng
    // gỡ lỗi vẫn thấy field ma — xoá hẳn ngay lần nạp đầu tiên. Xoá field không tồn tại là no-op,
    // nên save mới đi qua đây cũng không sao.
    for (const _k of ['channelPick','channelId','channelT','channelCd','towerBest',
                      'devilClears','bloodClears','bloodBonusClears',
                      'herbCount','alchDay','alchCount','pillDmgT','pillDmgPct']) delete player[_k];
    if (!player.storySeen) player.storySeen = {};
    if (!player.clues) player.clues = [];
    if (!player.storyFlags) player.storyFlags = {};
    if (player.tutStep == null) player.tutStep = -1; // save cũ: bỏ qua hướng dẫn
    if (player.potions == null) player.potions = 3; // P0: Hồ Lô Thuốc
    if (!player.dhHate) player.dhHate = {};
    if (player.revengeKills == null) player.revengeKills = 0;
    if (player.potionCd == null) player.potionCd = 0;
    if (player.buffAtkT == null) player.buffAtkT = 0;
    if (player.loidonT == null) player.loidonT = 0;
    if (!player.noidan) player.noidan = {};
    if (!player.ndBonus) player.ndBonus = { atk:0, hp:0, def:0, qi:0, crit:0 };
    if (player.ndDay == null){ player.ndDay = ''; player.ndCount = 0; }
    if (player.pet === undefined) player.pet = null;
    if (player.phongphu == null) player.phongphu = 0;
    if (!player.abode) player.abode = { tulinh:0, garden:[null,null,null] };
    if (!player.abode.garden) player.abode.garden = [null,null,null];
    if (player.maDao == null) player.maDao = false;
    if (!player.daily) player.daily = { day:'', kills:0, noidan:0, dungeon:0, forge:0, claimed:false };
    // Track HT + vòng lặp ngày backfill
    if (!player.jewels) player.jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
    if (player.congHuan == null) player.congHuan = 0;     // Công Huân Lệnh (Vạn Duyên Các)
    if (!player.baohap) player.baohap = {};               // Bảo Hạp Ma Tôn: { tier: count }
    if (!player.truyna) player.truyna = { day:'', state:'none', map:null }; // Truy Nã Lệnh ngày
    if (player.sectOffered == null) player.sectOffered = false;
    if (!SECTS[player.sect]) player.sect = 'vophai'; // save lỗi phái → về Tán Nhân
    if (!player.traits || !player.traits.length){ // save cũ: trời ban quẻ bù một lần
      player.traits = rollTraitsSilent();
      player.personality = player.personality || 'trung';
      setTimeout(()=>{ if (player) addFloat(player.x, player.y-56, '🥚 The Hatching ban cho người cũ — xem ở panel Nhân Vật!', '#f0a03a', 14); }, 1200);
    }
    if (player.tutDist == null) player.tutDist = 0;
    if (player.resetCount == null) player.resetCount = 0; // Tẩy Tủy Phong Huyệt backfill (save cũ chưa có)
    if (player.ene == null) player.ene = 5; // Linh Lực (stat mới) backfill (save cũ chưa có) — mức khởi điểm giống str/agi/def/vit
    if (d.curMap && MAPS[d.curMap]) curMap = d.curMap;
    // Migrate trang bị cũ (10 ô) sang hệ 12 ô GDD
    const SLOT_MIGRATE = { weapon:'vukhi', helm:'non', armor:'ao', bracer:'tay', belt:'quan',
                           boots:'chan', neck:'daychuyen', ring:'nhan1', jade:'nhan2', amkhi:null };
    const migrateItem = (it) => {
      if (!it) return null;
      if (Object.hasOwn(SLOT_MIGRATE, it.slot)){
        const ns = SLOT_MIGRATE[it.slot];
        if (!ns){ player.mat += 3; return null; } // ô Ám Khí cũ → đổi 3 Huyền Thiết
        it.slot = ns;
        it.slotName = (SLOTS.find(x=>x.id===ns) || {}).name || ns;
      }
      if (it.tier == null) it.tier = itemTier(it.level || 1);
      if (it.perfect == null) it.perfect = false;
      if (it.luck == null) it.luck = false;
      if (it.life == null) it.life = 0;
      if (it.ancient === undefined) it.ancient = null;
      if (!it.subs) it.subs = [];
      return it;
    };
    const newEquip = {};
    for (const s2 in player.equip){
      const it = migrateItem(player.equip[s2]);
      if (!it) continue;
      if (!newEquip[it.slot]) newEquip[it.slot] = it; else player.inv.push(it);
    }
    player.equip = newEquip;
    player.inv = player.inv.map(migrateItem).filter(Boolean).slice(0, 30);
    // clamp old +12..+15 gear to the new +11 cap
    for (const s in player.equip) if (player.equip[s] && player.equip[s].plus > 11) player.equip[s].plus = 11;
    for (const it of player.inv) if (it.plus > 11) it.plus = 11;
    let maxUid = 0;
    for (const s in player.equip) if (player.equip[s]) maxUid = Math.max(maxUid, player.equip[s].uid);
    for (const it of player.inv) maxUid = Math.max(maxUid, it.uid);
    itemSeq = maxUid + 1;
    calcDerived();
    buildWorld();
    DGN = null; if (mapDef().dungeon) startDungeonRun(curMap); // vào lại phó bản = một lượt mới
    grantOfflineGains(d.savedAt || 0); // Bế quan offline — thưởng Instinct/Anima theo thời gian vắng mặt
    return true;
  } catch { return false; }
}

// ---------- World ----------
function rnd(a,b){ return a + Math.random()*(b-a); }
function dist(ax,ay,bx,by){ return Math.hypot(ax-bx, ay-by); }
function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
// Compacts arr in place (keeping only entries where keep() is true), same result as
// arr = arr.filter(keep) but without allocating a new array every call — these run
// unconditionally every frame on entity lists that can hold hundreds of items.
function compactInPlace(arr, keep){
  let w = 0;
  for (let i = 0; i < arr.length; i++){ if (keep(arr[i])) arr[w++] = arr[i]; }
  arr.length = w;
}
// Was `mobs.filter(x => x.zone === zone && !x.dead).length` called once per dead mob whose
// respawn timer just expired — an O(n) scan of the whole mobs array per call. Packs can share
// a zone object across several mobs, and multiple mobs can hit 0 respawnT the same frame, so
// this rebuilds the per-zone alive count ONCE per update() tick (lazily, only if anything asks)
// instead of once per respawn check.
function zoneAliveCount(zone){
  if (!_zoneAliveCache){
    _zoneAliveCache = new Map();
    for (const x of mobs){ if (!x.dead && x.zone) _zoneAliveCache.set(x.zone, (_zoneAliveCache.get(x.zone) || 0) + 1); }
  }
  return _zoneAliveCache.get(zone) || 0;
}

let packSeq = 1;
// ---------- Đai cấp trong map: Ngoại Vi → Trung Tâm → Hạt Nhân ----------
// Quái yếu xếp gần cửa vào, mạnh dần vào sâu — người chơi nhìn là biết đường farm
const BAND_NAMES = ['Ngoại Vi', 'Trung Tâm', 'Hạt Nhân'];
const BAND_COLORS = ['#7ec850', '#e8b04a', '#ff6a5a'];
let curBand = -1;
function bandOfDist(md, x, y){ // đai theo khoảng cách từ điểm vào map
  if (!md.packs || !md.packs.length) return -1;
  let maxD = 1;
  for (const pk of md.packs){ const d = dist(pk.x, pk.y, md.spawn.x, md.spawn.y); if (d > maxD) maxD = d; }
  const t = dist(x, y, md.spawn.x, md.spawn.y) / maxD;
  return t < 0.45 ? 0 : t < 0.8 ? 1 : 2;
}
function bandLvText(md, b){
  const lvs = md.packs.map(pk => MOBS[pk.mob].lv).sort((a,c)=>a-c);
  const n = lvs.length; if (!n) return '';
  const pick = b === 0 ? lvs.slice(0, Math.ceil(n/3)) : b === 1 ? lvs.slice(Math.floor(n/3), Math.ceil(2*n/3)) : lvs.slice(Math.floor(2*n/3));
  return `C${pick[0]}–${pick[pick.length-1]}`;
}
function bandSummaryHtml(md){
  if (!md.packs || !md.packs.length) return '';
  return `<div class="m-desc" style="opacity:.85;margin-top:2px">` +
    BAND_NAMES.map((n,b)=>`<span style="color:${BAND_COLORS[b]}">●</span> ${n} ${bandLvText(md,b)}`).join(' · ') + `</div>`;
}
function buildWorld(){
  const md = mapDef();
  mobs = []; pickups = []; projectiles = []; effects = []; floats = []; groundLoot = []; // đồ dưới đất KHÔNG theo người sang map khác
  decorObs = [];   // xoá TRƯỚC khi rải decor mới — xem ghi chú ở rebuildDecorObs()
  sigilReset(); // Khắc Ấn: vũng độc/sóng hẹn giờ của map cũ không được nổ giữa map mới
  if (player) player.pendingHit = null;   // cùng lý do: đòn thường đã hẹn ở map cũ
  petObj = null; mountObj = null; // Linh Thú & Thú Chiến xuất hiện lại ở map mới
  moveTarget = null; moveWaypoint = null; // Click-to-move: đích ở map cũ không còn ý nghĩa khi đổi map
  npcTalkTarget = null; // NPC ở map cũ không còn ý nghĩa khi đổi map
  decor = []; mists = []; springTimer = 0;
  // quái đứng thành cụm 5-7 con (GDD Mob Mechanics), đúng vị trí đã thiết kế trong md.packs.
  // TRƯỚC ĐÂY: sắp loại quái theo cấp và sắp vị trí theo khoảng cách RỒI ghép lại theo thứ tự —
  // ý định là "cụm yếu gần cửa, cụm mạnh sâu trong", nhưng ghép kiểu này làm loại quái thực sự
  // xuất hiện ở 1 toạ độ không còn khớp với loại quái đã đặt ở đó lúc thiết kế map. Hậu quả: Chọn
  // Trận (enterStage) và đèn hiệu nhiệm vụ diệt quái (questTarget/sideQuestTarget, tìm pack theo
  // .mob rồi tin .x/.y) đều dẫn sai chỗ — có lúc dẫn thẳng vào cạnh Vệ Binh Trụ vùng khiến AUTO đứng im
  // (phát hiện qua QA level 1→120). Dữ liệu md.packs mỗi map đã tự nhiên đặt quái yếu gần spawn,
  // quái mạnh/tinh anh xa hơn rồi — bỏ hẳn bước xáo trộn, spawn đúng như đã thiết kế.
  for (const pk of md.packs){
    const packId = packSeq++;
    for (let j = 0; j < pk.n; j++) spawnMob(pk.mob, { x:pk.x, y:pk.y, r:115, count:pk.n }, packId); // dàn trải cụm quái, tránh chồng hình
  }
  curBand = -1; // đổi map → tính lại đai, không bắn banner ngay lúc vào
  // Giang Hồ Du Hiệp — mục tiêu PK trong map dã ngoại/huyết chiến
  if (md.duhiep){
    const nDH = md.type === 'freepk' ? 6 : 4;
    const hate = (player.dhHate && player.dhHate[md.duhiep]) || 0;
    for (let i = 0; i < nDH; i++){
      const dh = spawnMob(md.duhiep, { x:rnd(400,MAP.w-400), y:rnd(400,MAP.h-400), r:60 }, null);
      dh.wanderT = 0; dh.wanderAng = rnd(0, Math.PI*2);
      // A3: có thù → hắn truy thù: chủ động săn người chơi, mạnh hơn, đánh được không cần PK
      if (hate >= 1 && i === 0){
        dh.revenge = true; dh.provoked = true; dh.packAlert = 9999;
        dh.hp = dh.maxHp = Math.round(dh.maxHp * 1.2);
        dh.atkMul = 1.15;
        addFloat(player.x, player.y-80, '⚔ CÓ KẺ TRUY THÙ NGƯƠI TRONG VÙNG NÀY!', '#e84a6a', 16);
      }
    }
  }
  if (md.boss && questIdx >= 9 && questState !== 'all' && !victory) spawnBoss();
  if (md.herbs) for (const s of (HERB_SPOTS[curMap] || [])) pickups.push({ type:'herb', x:s.x, y:s.y, respawn:0 });
  // decor: ink trees, rocks theo địa hình map
  for (let i = 0; i < (md.trees ?? 70); i++)
    decor.push({ type:'tree', x:rnd(60,MAP.w-60), y:rnd(60,MAP.h-60), s:rnd(0.7,1.5) });
  for (let i = 0; i < (md.rocks ?? 26); i++)
    decor.push({ type:'rock', x:rnd(60,MAP.w-60), y:rnd(60,MAP.h-60), s:rnd(0.6,1.4) });
  for (let i = 0; i < 14; i++) mists.push({ x:rnd(0,W), y:rnd(0,H), r:rnd(120,300), v:rnd(4,14), a:rnd(0.04,0.1) });
  // giữ khu làng & suối thiền trống
  if (md.village) decor = decor.filter(d => dist(d.x,d.y,NPC.x,NPC.y) > 160 && dist(d.x,d.y,SPRING.x,SPRING.y) > 120);
  // Thành: chừa trống quảng trường + 4 lối lát đá ra cổng — trước đây cây rải ngẫu nhiên mọc đè cả
  // lên đài phun nước giữa quảng trường và chắn ngang lối đi ra cổng.
  if (md.city){
    const w = CITY_WALL, gh = w.gateW/2 + 30;
    decor = decor.filter(d =>
      dist(d.x, d.y, w.gateX, w.gateY) > 330 &&                                   // lòng quảng trường
      !(Math.abs(d.x - w.gateX) < gh && d.y > w.y1 - 60 && d.y < w.y2 + 60) &&     // lối Bắc-Nam
      !(Math.abs(d.y - w.gateY) < gh && d.x > w.x1 - 60 && d.x < w.x2 + 60));      // lối Tây-Đông
  }
  decor = decor.filter(d => !NPCS.some(n => n.map === curMap && dist(d.x,d.y,n.x,n.y) < 150));
  // ── Cây/đá nay CHẶN ĐƯỜNG (xem obstaclesOf), nên phải dọn khỏi mọi điểm nội dung. ──
  // Trước bản này chúng rải hoàn toàn ngẫu nhiên và chỉ né NPC/làng/thành — vô hại khi không
  // va chạm, nhưng bật va chạm lên là một gốc cây mọc đúng giữa bãi quái sẽ khoá luôn bãi đó.
  {
    const _keep = [];
    for (const q of (md.packs || [])) _keep.push({ x:q.x, y:q.y, r:(q.r || 90) + 70 });
    if (md.spawn) _keep.push({ x:md.spawn.x, y:md.spawn.y, r:150 });
    for (const k in (md.spawnFrom || {})) _keep.push({ x:md.spawnFrom[k].x, y:md.spawnFrom[k].y, r:150 });
    for (const h of (HERB_SPOTS[curMap] || [])) _keep.push({ x:h.x, y:h.y, r:60 });
    for (const a of AI_PASSES) if (a.map === curMap) _keep.push({ x:a.x, y:a.y, r:a.r + 80 });
    if (typeof GATES !== 'undefined') for (const g of GATES) if (g.map === curMap) _keep.push({ x:g.x, y:g.y, r:130 });
    const _bd = BOSS_DEFS[curMap];
    if (_bd){
      for (const tv of (_bd.thuve || [])) _keep.push({ x:tv.x*MAP.w, y:tv.y*MAP.h, r:170 });
      if (_bd.tranai) _keep.push({ x:_bd.tranai.x*MAP.w, y:_bd.tranai.y*MAP.h, r:210 });
    }
    if (md.spring && typeof SPRING !== 'undefined') _keep.push({ x:SPRING.x, y:SPRING.y, r:140 });
    decor = decor.filter(d => !_keep.some(k => dist(d.x, d.y, k.x, k.y) < k.r));
    // và không mọc chồng lên vật cản tĩnh (hồ, tường) — vẽ ra thì thành cây mọc giữa hồ
    decor = decor.filter(d => !inObstacle(curMap, d.x, d.y, 4));
  }
  rebuildDecorObs();
  spawnAmbients(); // hạt môi trường + cỏ mặt đất theo chủ đề bản đồ
  spawnHorses(); // GDD Đợt 2 B5: Tuấn Mã Hoang
  // Ma Tôn Giáng Thế & Truy Nã Lệnh: tái xuất hiện khi người chơi vào đúng bản đồ
  if (typeof MATON !== 'undefined' && MATON.active && curMap === MATON.map && !mobs.some(m => m.type === 'maton' && !m.dead)) spawnMaTonMob();
  if (typeof GOLDEN !== 'undefined' && GOLDEN.active && curMap === GOLDEN.map) spawnGoldenMobs();
  if (typeof RIFT !== 'undefined' && riftCanSpawn() && !mobs.some(m => m.type === 'rift' && !m.dead)) spawnRiftBoss();
  if (player && player.truyna && player.truyna.state === 'hunting' && curMap === player.truyna.map && !mobs.some(m => m.truyna && !m.dead)) spawnTruyNaMob();
  spawnZoneBosses(); // GDD Boss v2.1: Vệ Binh Trụ & Cổng Vực theo map
}
function spawnMob(type, zone, pack, vfx){
  const def = MOBS[type];
  const m = {
    type, def, name: def.name,
    x: zone ? zone.x + rnd(-zone.r, zone.r) : rnd(200, MAP.w-200),
    y: zone ? zone.y + rnd(-zone.r, zone.r) : rnd(200, MAP.h-200),
    zone, pack: pack ?? null, hp: def.hp, maxHp: def.hp, atkT: rnd(0,1), dead:false, face: 0,
    shield: def.elite ? 1 : 0, shieldT: 0, hitT: 0, wob: Math.random()*10, packAlert: 0,
  };
  if (inObstacle(curMap, m.x, m.y, 16)){ const _f = nearestFree(curMap, m.x, m.y); m.x = _f.x; m.y = _f.y; } // GDD Đợt 2 A: không spawn vào vùng cấm
  m.homeX = m.x; m.homeY = m.y; // lãnh địa — điểm boss canh giữ, leash sẽ kéo về đây
  mobs.push(m);
  // Hồi sinh: cột sáng lóe lên dưới chân thay vì đột ngột "hiện ra" (chỉ dùng khi vfx=true —
  // buildWorld() dựng cả map cùng lúc, gọi vfx ở đó sẽ spam hàng chục cột sáng cùng lúc, chỉ
  // bật cho respawn từng con lẻ, xem game.js chỗ "respawn dead mobs").
  if (vfx){
    const bc = (def.el && ELEM[def.el]) ? ELEM[def.el].color : (def.color || '#ffd76a');
    addEffect({ type:'spawnbeam', x:m.x, y:m.y, color:bc, dur:0.6 });
  }
  return m;
}
function spawnBoss(){
  if (mobs.some(m=>m.type==='boss'&&!m.dead)) return;
  spawnMob('boss', { x:BOSS_ARENA.x, y:BOSS_ARENA.y, r:40, count:1 });
  AudioSys.playBgm(BGM_BOSS); // Hoa Địa Li Lao vang lên — trận chiến sinh tử
}

// ═══════════ HỆ BOSS VÙNG & TRẤN ẢI (GDD Boss v2.1 + Cốt truyện Ngũ Trụ Khóa) ═══════════
// Mỗi map: 3 Vệ Binh Trụ (canh 3 Trụ Khóa) + 1 Cổng Vực (canh Cổng Vực, mở khi phá đủ 3 nhãn)
// Moveset cố định 3-4 chiêu, telegraph 1.0-1.6s (vùng đỏ), đánh xong lộ cửa sổ trừng phạt 2.5s
const BOSS_MOVES = {
  vach:  { tele:1.4, r:150, arc:1.1,  name:'Trảm Kích' },  // quạt trước mặt
  vong:  { tele:1.6, r:175,           name:'Bộc Phát' },   // nổ quanh boss
  xung:  { tele:1.2, len:340, w:64,   name:'Xung Phong' }, // lao tuyến thẳng tới vị trí người chơi
  goi:   { tele:1.0,                  name:'Triệu Hồi' },  // gọi 2 tùy tùng
  cuong: { tele:1.0,                  name:'Cuồng Hóa' },  // buff công ×1.3 trong 8s (dưới 50% HP)
  // Hai chiêu dưới đây hỏi người chơi một câu hỏi KHÁC. Năm chiêu trên đều chỉ hỏi "đừng đứng
  // đó" — không chiêu nào bắt phải LÀM gì. Đó là lý do mọi trận boss cảm giác giống hệt nhau.
  vogiap:  { tele:5.0, orbs:4, r:120, name:'Niệm Chú Huỷ Diệt' }, // phá 4 cầu giáp trước khi niệm xong
  daovung: { tele:3.4, r:200,         name:'Tử Vực' },            // CẢ SÂN chết, chỉ một ô sống
};
const BOSS_DEFS = {
  daohoa: { thuve:[
      { id:'dh1', name:'Chúa Heo Rừng',       lv:6,  el:'Thổ',  img:'boar',     x:.30, y:.30, moves:['vach','xung','cuong'] },
      { id:'dh2', name:'Chúa Bầy Gai Tím',        lv:9,  el:'Mộc',  img:'wolf',     x:.64, y:.56, moves:['xung','goi','vach','daovung'] },
      { id:'dh3', name:'Chấp Sự Gloam',  lv:12, el:'Thủy', img:'assassin', x:.42, y:.80, moves:['vach','vong','cuong'] } ],
    tranai: { id:'dh4', name:'Thủ Lĩnh Đoàn Gloam', lv:14, el:'Hỏa', img:'boss_hacphong', x:.86, y:.80, moves:['vong','vach','goi','cuong','vogiap'] } },
  ngoai: { thuve:[
      { id:'ng1', name:'Đầu Mục Gloam',    lv:13, el:'Kim',  img:'bandit',   x:.28, y:.34, moves:['vach','xung','cuong'] },
      { id:'ng2', name:'Gai Tím Độc Nhãn',lv:16, el:'Mộc',  img:'wolf',     x:.62, y:.62, moves:['xung','vong','goi','daovung'] },
      { id:'ng3', name:'Đặc Vụ Gloam',   lv:19, el:'Thủy', img:'assassin', x:.40, y:.80, moves:['vach','xung','cuong'] } ],
    tranai: { id:'ng4', name:'Ma Sói Sương Trắng', lv:22, el:'Hỏa', img:'boss_sontac', x:.85, y:.78, moves:['vach','vong','goi','cuong','vogiap'] } },
  chungnam: { thuve:[
      { id:'cn1', name:'Kẻ Đổi Phe',        lv:23, el:'Thủy', img:'phando',   x:.30, y:.32, moves:['vach','xung','goi'] },
      { id:'cn2', name:'Golem Gỗ Cổ Đại',    lv:26, el:'Thổ',  img:'mocnhan',  x:.64, y:.58, moves:['vong','vach','cuong','daovung'] },
      { id:'cn3', name:'Trưởng Lão Tha Hóa', lv:29, el:'Thủy', img:'boss_phando', x:.44, y:.80, moves:['xung','vach','vong'] } ],
    tranai: { id:'cn4', name:'Tướng Quân Thornwood Reach', lv:32, el:'Thủy', img:'bandao', x:.86, y:.80, moves:['vach','xung','vong','cuong','vogiap'] } },
  comoc: { thuve:[
      { id:'cm1', name:'Chỉ Huy Vong Binh',  lv:43, el:'Thổ',  img:'kybinh',   x:.30, y:.32, moves:['xung','vach','goi'] },
      { id:'cm2', name:'Kẻ An Táng Bóng Tối',lv:46, el:'Thủy', img:'thinu',    x:.62, y:.58, moves:['vong','xung','cuong','daovung'] },
      { id:'cm3', name:'Chúa Tể Bất Tử',     lv:49, el:'Thổ',  img:'mocnhan',  x:.42, y:.80, moves:['vach','vong','goi'] } ],
    tranai: { id:'cm4', name:'Tướng Quân Hollow Roost', lv:52, el:'Mộc', img:'boss_mochu', x:.85, y:.80, moves:['vong','xung','goi','cuong','vogiap'] } },
  tuyettinh: { thuve:[
      { id:'tt1', name:'Kẻ Lạc Lối Tuyệt Vọng',lv:63, el:'Thổ',  img:'ttdetu', x:.30, y:.32, moves:['vach','goi','cuong'] },
      { id:'tt2', name:'Cỏ Dại Băng Giá',     lv:66, el:'Hỏa',  img:'caodo',    x:.64, y:.58, moves:['xung','vong','goi','daovung'] },
      { id:'tt3', name:'Xoáy Sương Nguyền',    lv:69, el:'Mộc',  img:'boss_tinhhoa', x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'tt4', name:'Tướng Quân Frostmire Vale', lv:72, el:'Mộc', img:'thinu', x:.86, y:.80, moves:['vong','vach','xung','cuong','vogiap'] } },
  mongco: { thuve:[
      { id:'mc1', name:'Kỵ Sĩ Trưởng Tro Tàn', lv:83, el:'Kim', img:'kybinh',  x:.30, y:.32, moves:['xung','vach','cuong'] },
      { id:'mc2', name:'Cung Thủ Tinh Nhuệ Tro Tàn', lv:86, el:'Mộc',  img:'cungthu',  x:.64, y:.58, moves:['vong','xung','goi','daovung'] },
      { id:'mc3', name:'Thống Lĩnh Tro Tàn', lv:89, el:'Kim', img:'cuongbinh',x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'mc4', name:'Tướng Quân Ashen Steppe', lv:92, el:'Kim', img:'boss_dothong', x:.86, y:.80, moves:['xung','vong','goi','cuong','vogiap'] } },
  nhanmon: { thuve:[
      { id:'nm1', name:'Tướng Quân Bão Tố',  lv:103, el:'Kim', img:'daokhach', x:.30, y:.32, moves:['vach','xung','cuong'] },
      { id:'nm2', name:'Huyết Sát Bão Tố',   lv:106, el:'Hỏa',  img:'cuongbinh',x:.64, y:.58, moves:['vong','vach','goi','daovung'] },
      { id:'nm3', name:'Tướng Quân Cửa Ải', lv:109, el:'Thổ',  img:'boss_thienbinh', x:.42, y:.80, moves:['xung','vong','vach'] } ],
    tranai: { id:'nm4', name:'Tướng Quân Stormgate Pass', lv:112, el:'Hỏa', img:'boss_thienbinh', x:.86, y:.80, moves:['vach','xung','vong','cuong','vogiap'] } },
};
// Đồng Môn Trợ Uy (Cốt truyện × Tông môn §4): map "chạm nhà" của từng phái
const SECT_HOOK_MAP = { ngoai:'baidasan', chungnam:'toanchan', tuyettinh:'thieulam', nhanmon:'minhgiao' };
function bossScale(lv){
  return { hp: Math.round(2600*Math.pow(lv/10, 1.7)), atk: Math.round(44*lv/10), def: Math.round(16*lv/10),
    xp: Math.round(2500*lv/10), silver:[Math.round(280*lv/10), Math.round(400*lv/10)] };
}
function spawnZoneBosses(){
  const bd = BOSS_DEFS[curMap];
  if (!bd || mobs.some(m => m.def.bossKind)) return;
  for (const tv of bd.thuve) spawnZoneBoss(tv, 'thuve');
  spawnZoneBoss(bd.tranai, 'tranai');
}
function spawnZoneBoss(bd, kind){
  const s = bossScale(bd.lv);
  const hpMul = kind === 'tranai' ? 1.7 : 1, atkMul = kind === 'tranai' ? 1.15 : 1;
  const def = { name: bd.name, lv: bd.lv, hp: Math.round(s.hp*hpMul), atk: Math.round(s.atk*atkMul), def: s.def,
    xp: s.xp*(kind === 'tranai' ? 3 : 1), silver: s.silver, speed: 60, aggro: 420, range: 42, atkCd: 1.5,
    size: kind === 'tranai' ? 30 : 24, color:'#241a2e', eye:'#ff3a3a', boss:true, elite:true, drop:0, el: bd.el,
    img:'assets/mobs/' + bd.img + '.png', bossKind: kind, bossId: bd.id, moves: bd.moves, _bdRef: bd };
  // bd.img trỏ vào mob vẽ khung xương → boss kế thừa bộ vẽ + bảng màu của nó
  // (file PNG của nhóm này đã xoá; không kế thừa thì boss rơi về hình mực dự phòng)
  const _src = MOBS[bd.img];
  if (_src && _src.skel){ def.skel = _src.skel; def.skelPal = _src.skelPal; def.img = ''; }
  const m = { type:'zb_' + bd.id, def, name: bd.name, x: bd.x*MAP.w, y: bd.y*MAP.h,
    zone:{ x: bd.x*MAP.w, y: bd.y*MAP.h, r: 130, count: 1 },
    pack: null, hp: def.hp, maxHp: def.hp, atkT: 1, dead:false, face: 0,
    shield: 0, shieldT: 0, hitT: 0, wob: Math.random()*10, packAlert: 0,
    moveT: 4, moveIdx: 0, tele: null, punishT: 0, introduced: false };
  if (inObstacle(curMap, m.x, m.y, 16)){ const _f2 = nearestFree(curMap, m.x, m.y); m.x = _f2.x; m.y = _f2.y; m.zone.x = _f2.x; m.zone.y = _f2.y; } // GDD Đợt 2 A
  if (!def.skel && !MOB_IMGS[m.type]){ const im = new Image(); im.src = def.img; MOB_IMGS[m.type] = im; }
  mobs.push(m); return m;
}
const BOSS_MINION = { daohoa:'bandit', ngoai:'bandit', chungnam:'phando', comoc:'thinu', tuyettinh:'ttdetu', mongco:'cuongbinh', nhanmon:'daokhach' };
function bossStartTele(m, mvId){
  const mv = BOSS_MOVES[mvId]; if (!mv) return;
  if (mvId === 'cuong' && m.hp > m.maxHp*0.5){ m.moveT = 2; return; } // Cuồng Hóa chỉ khi dưới nửa máu
  m.tele = { mvId, t: mv.tele, max: mv.tele, x: m.x, y: m.y,
    ang: Math.atan2(player.y - m.y, player.x - m.x), px: player.x, py: player.y };
  if (mvId === 'vogiap'){
    // Cầu giáp: máu thấp, đứng yên, không đánh trả — chúng là một bài kiểm tra BÙNG NỔ SÁT
    // THƯƠNG có hạn giờ, không phải thêm quái để cày.
    m.tele.orbs = [];
    for (let i = 0; i < mv.orbs; i++){
      const a = (i / mv.orbs) * Math.PI * 2 + rnd(0, 0.6);
      const od = { name:'Cầu Giáp', lv: m.def.lv, hp: Math.round(m.maxHp * 0.035) + 40, atk: 0, def: 0,
        xp: 0, silver:[0,0], speed: 0, aggro: 0, range: 0, atkCd: 99, size: 11,
        color:'#2a1a3e', eye:'#ffd76a', el: m.def.el, drop: 0, bossOrb: true, noRespawn: true };
      const o = { type:'bossorb', def: od, name: od.name,
        x: clamp(m.x + Math.cos(a)*mv.r, 40, MAP.w-40), y: clamp(m.y + Math.sin(a)*mv.r, 40, MAP.h-40),
        zone: null, pack: null, hp: od.hp, maxHp: od.hp, atkT: 99, dead: false, face: 0,
        shield: 0, shieldT: 0, hitT: 0, wob: Math.random()*10, packAlert: 0 };
      mobs.push(o); m.tele.orbs.push(o);
    }
    addFloat(m.x, m.y - m.def.size - 40, `PHÁ ${mv.orbs} CẦU GIÁP!`, '#ffd76a', 15);
  }
  if (mvId === 'daovung'){
    // Ô an toàn đặt XA boss, để người chơi phải rời khỏi boss chứ không đứng nguyên mà thắng.
    const a = Math.random() * Math.PI * 2, d = 260 + Math.random() * 200;
    m.tele.sx = clamp(m.x + Math.cos(a)*d, mv.r + 40, MAP.w - mv.r - 40);
    m.tele.sy = clamp(m.y + Math.sin(a)*d, mv.r + 40, MAP.h - mv.r - 40);
    addFloat(m.x, m.y - m.def.size - 40, 'CHẠY VÀO VÒNG SÁNG!', '#7ecbff', 15);
  }
  addFloat(m.x, m.y - m.def.size - 22, mv.name + '!', '#ff7a5a', 14);
  AudioSys.sfx('quest', 0.3);
}
function bossExecMove(m){
  const mvId = m.tele.mvId, mv = BOSS_MOVES[mvId], tele = m.tele;
  m.tele = null;
  m.punishT = 2.5; // cửa sổ trừng phạt — người chơi gây thêm ST
  if (mvId === 'goi'){
    for (let i = 0; i < 2; i++){
      const a = spawnMob(BOSS_MINION[curMap] || 'bandit', null, null);
      a.x = clamp(m.x + rnd(-70,70), 40, MAP.w-40); a.y = clamp(m.y + rnd(-70,70), 40, MAP.h-40);
      a.packAlert = 8;
    }
    addFloat(m.x, m.y-40, 'Tùy tùng xuất hiện!', '#c07fe0', 13);
    return;
  }
  if (mvId === 'cuong'){
    m.atkMul = (m.atkMul || 1) * 1.3; m.cuongT = 8;
    addFloat(m.x, m.y-40, 'CUỒNG HÓA!', '#ff3a3a', 16);
    addEffect({ type:'ring', x:m.x, y:m.y, r:60, color:'#ff3a3a', big:true });
    return;
  }
  if (mvId === 'vogiap'){
    const alive = (tele.orbs || []).filter(o => !o.dead);
    for (const o of alive){ o.dead = true; o.gone = true; o.deadT = 0; }  // niệm xong thì cầu tan
    if (!alive.length){
      // Phá hết kịp giờ: chiêu tắt ngóm, boss choáng — ĐÂY mới là phần thưởng, không phải né được
      m.stunT = Math.max(m.stunT || 0, 5); m.punishT = 6;
      addFloat(m.x, m.y-50, '✦ CHÚ VỠ — BOSS CHOÁNG!', '#7ecbff', 18);
      addEffect({ type:'ring', x:m.x, y:m.y, r:110, color:'#7ecbff', big:true });
      AudioSys.sfx('levelup', 0.8);
      return;
    }
    // Không phá kịp: đòn này KHÔNG né được — đó là ý nghĩa của nó
    addEffect({ type:'ring', x:m.x, y:m.y, r:320, color:'#c07fe0', big:true });
    shakeT = Math.max(shakeT, 0.5); shakeMag = Math.max(shakeMag, 9);
    addFloat(player.x, player.y-64, `Còn ${alive.length} cầu giáp!`, '#ff7a5a', 15);
    bossHitPlayer(m, 1.6 + alive.length * 0.5);
    return;
  }
  if (mvId === 'daovung'){
    addEffect({ type:'ring', x:tele.sx, y:tele.sy, r:mv.r, color:'#7ecbff', big:true });
    if (dist(player.x, player.y, tele.sx, tele.sy) > mv.r){
      shakeT = Math.max(shakeT, 0.4); shakeMag = Math.max(shakeMag, 7);
      bossHitPlayer(m, 2.4);
    } else addFloat(player.x, player.y-40, '✦ AN TOÀN!', '#7ecbff', 15);
    return;
  }
  let hit = false;
  if (mvId === 'vong'){
    addEffect({ type:'ring', x:tele.x, y:tele.y, r:mv.r, color:'#ff5a3a', big:true });
    hit = dist(player.x, player.y, tele.x, tele.y) < mv.r;
  } else if (mvId === 'vach'){
    addEffect({ type:'arc', x:m.x, y:m.y, face:tele.ang, r:mv.r, color:'#ff5a3a' });
    const d2 = dist(player.x, player.y, m.x, m.y);
    let da = Math.abs((Math.atan2(player.y - m.y, player.x - m.x) - tele.ang) % (Math.PI*2));
    if (da > Math.PI) da = Math.PI*2 - da;
    hit = d2 < mv.r && da < mv.arc;
  } else if (mvId === 'xung'){
    m.x = clamp(tele.px, 40, MAP.w-40); m.y = clamp(tele.py, 40, MAP.h-40);
    addEffect({ type:'ring', x:m.x, y:m.y, r:70, color:'#ff5a3a', big:true });
    hit = dist(player.x, player.y, m.x, m.y) < mv.w + 26;
  }
  if (hit) bossHitPlayer(m, 2.2);
}
// Một chỗ duy nhất cho việc boss đánh trúng người chơi — trước đây đoạn này nằm inline trong
// bossExecMove, nên thêm chiêu mới là phải chép lại cả khối.
function bossHitPlayer(m, mul){
  let dmg = Math.round(m.def.atk * mul * (1 - player.defRed));
  const gapB = m.def.lv - player.level; // Áp Bức chiều ngược
  if (gapB > 10) dmg = Math.round(dmg*1.6); else if (gapB >= 6) dmg = Math.round(dmg*1.3);
  player.hp -= dmg; player.hurtT = 0.3; player.combatT = 4;
  addFloat(player.x, player.y-30, dmg, '#ff5a3a', 17);
  addEffect({ type:'ring', x:player.x, y:player.y-10, r:26, color:'#ff5a3a' });
  AudioSys.sfx('hurt', 0.8);
  if (player.hp <= 0){ player.hp = 0; player._killedByBoss = m.def.name; onDeath(); }
}
// Telegraph vẽ trên mặt đất (world space, dưới chân thực thể)
function drawBossTele(m){
  const t = m.tele, mv = BOSS_MOVES[t.mvId];
  const prog = 1 - t.t / t.max;
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.3*prog;
  ctx.fillStyle = '#ff3a2a';
  ctx.strokeStyle = 'rgba(255,80,50,.9)'; ctx.lineWidth = 2;
  if (t.mvId === 'daovung'){
    // ĐẢO NGƯỢC: tô đỏ CẢ SÂN rồi khoét một lỗ an toàn. Dùng quy tắc evenodd nên chỉ một
    // đường path, không cần lớp vẽ riêng.
    ctx.beginPath();
    ctx.rect(camera.x - 40, camera.y - 40, W + 80, H + 80);
    ctx.arc(t.sx, t.sy, mv.r, 0, Math.PI*2);
    ctx.fill('evenodd');
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#7ecbff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(t.sx, t.sy, mv.r, 0, Math.PI*2); ctx.stroke();
    ctx.restore(); return;
  }
  if (t.mvId === 'vogiap'){
    const alive = (t.orbs || []).filter(o => !o.dead);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2.5;
    for (const o of alive){   // dây nối boss ↔ cầu giáp: nhìn là hiểu phải đánh cái nào
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(o.x, o.y); ctx.stroke();
    }
    ctx.globalAlpha = 0.20 + 0.5*prog;
    ctx.fillStyle = '#c07fe0';
    ctx.beginPath(); ctx.arc(m.x, m.y, 40 + 300*prog, 0, Math.PI*2); ctx.fill();
    ctx.restore(); return;
  }
  if (t.mvId === 'vong'){
    ctx.beginPath(); ctx.arc(t.x, t.y, mv.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  } else if (t.mvId === 'vach'){
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.arc(m.x, m.y, mv.r, t.ang - mv.arc, t.ang + mv.arc); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (t.mvId === 'xung'){
    ctx.translate(t.x, t.y); ctx.rotate(t.ang);
    ctx.fillRect(0, -mv.w/2, mv.len, mv.w); ctx.strokeRect(0, -mv.w/2, mv.len, mv.w);
  } else { // goi/cuong: vòng tụ nhỏ quanh boss
    ctx.beginPath(); ctx.arc(m.x, m.y, 46, 0, Math.PI*2); ctx.stroke();
  }
  ctx.restore();
  // vòng đếm tụ chiêu trên đầu boss
  ctx.save();
  ctx.strokeStyle = '#ff6a4a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(m.x, m.y - m.def.size - 30, 12, -Math.PI/2, -Math.PI/2 + prog*Math.PI*2); ctx.stroke();
  ctx.restore();
}
// ---------- Cài đặt (lưu localStorage) ----------
// shake mặc định TẮT (chống chóng mặt) — save cũ không có key này nên tự migrate sang tắt
// shake: 0 TẮT · 1 NHẸ (mặc định) · 2 ĐẦY. Trước đây là boolean và mặc định `false` để chống
// chóng mặt — nhưng bật/tắt là quá thô, và hậu quả là TOÀN BỘ 12 chỗ đặt shakeT/shakeMag trong
// game không ai nhìn thấy. Diablo luôn rung, chỉ là rung rất khẽ và CÓ HƯỚNG.
const SETTINGS = Object.assign({ bgm:35, sfx:60, lowFx:false, mobName:true, minimap:true, shake:1, questTracker:true, combatLog:true },
  (()=>{ try { return JSON.parse(localStorage.getItem('vlcm_settings') || '{}'); } catch { return {}; } })());
// Save cũ lưu `shake` là boolean. Không di trú thì Object.assign ghi đè `false` lên mặc định
// mới và người chơi cũ mắc kẹt ở mức TẮT vĩnh viễn — mà họ chưa từng chọn tắt, đó chỉ là
// mặc định cũ. `true` (đã tự bật) thì cho lên ĐẦY.
if (typeof SETTINGS.shake === 'boolean') SETTINGS.shake = SETTINGS.shake ? 2 : 1;
SETTINGS.shake = clamp(SETTINGS.shake | 0, 0, 2);
function saveSettings(){ try { localStorage.setItem('vlcm_settings', JSON.stringify(SETTINGS)); } catch { /* best-effort — bỏ qua nếu lỗi */ } }

// ---------- Âm thanh kiếm hiệp: BGM theo map + SFX ----------
// Nhạc nền: bgm_safe (làng/thành) · bgm_field (dã ngoại) · bgm_tomb (mật thất) · bgm_war (chiến trường)
// Mỗi map có nhạc nền riêng; map chưa có bản riêng dùng nhạc nền chung
const BGM_TRACKS = { daohoa:'bgm_daohoa_ost', tuongduong:'bgm_tuongduong_ost', ngoai:'bgm_ngoai', chungnam:'bgm_chungnam_ost',
  tuyettinh:'bgm_tuyettinh_ost', comoc:'bgm_comoc', mongco:'bgm_mongco', nhanmon:'bgm_nhanmon' };
const BGM_INTRO = 'bgm_kiemhiep'; // Kiếm Hiệp Tình — màn mở đầu & chọn phái (hào hiệp chính khí)
const BGM_BOSS = 'bgm_boss_nguan';   // Hoa Địa Li Lao — boss Cổng Vực / Ngũ Trụ (bi kịch bùng nổ)
const _BGM_ROMANCE = 'bgm_romance';   // Tiếu Vấn Tình Duyên — song ca khi kết Đạo Lữ
const AudioSys = {
  bgm: null, bgmName: '', started: false, cache: {}, last: {},
  bgmVol(){ return (SETTINGS.bgm/100) * 0.85; },
  sfxVol(){ return SETTINGS.sfx/100; },
  playBgm(name){
    if (!name || this.bgmName === name) return;
    this.bgmName = name;
    if (this.started) this._startTrack();
  },
  _startTrack(){
    if (this.bgm) this.bgm.pause();
    const a = new Audio('assets/music/' + this.bgmName + '.mp3');
    a.loop = true; a.volume = this.bgmVol();
    a.play().catch(()=>{ /* autoplay bị chặn — chờ tương tác */ });
    this.bgm = a;
  },
  tryStart(){
    if (this.started) return;
    this.started = true;
    if (!this.bgmName) this.bgmName = BGM_TRACKS[curMap] || 'bgm_safe';
    this._startTrack();
  },
  refreshBgmVol(){ if (this.bgm){ this.bgm.volume = this.bgmVol(); if (SETTINGS.bgm <= 0) this.bgm.pause(); else this.bgm.play().catch(()=>{}); } },
  sfx(name, vol){
    if (SETTINGS.sfx <= 0) return;
    const now = performance.now();
    if (this.last[name] && now - this.last[name] < 70) return; // chống spam âm
    this.last[name] = now;
    let a = this.cache[name];
    if (!a){ a = new Audio('assets/music/sfx_' + name + '.mp3'); this.cache[name] = a; }
    const inst = a.cloneNode();
    inst.volume = Math.min(1, (vol ?? 1) * this.sfxVol());
    inst.play().catch(()=>{});
  },
};

// ---------- Hô tên chiêu bằng giọng Quan thoại (assets/voice) ----------
const SkillVoice = {
  on: (() => { try { return localStorage.getItem('ghha_voice') !== '0'; } catch { return true; } })(),
  cache: {}, lastGlobal: 0, lastByKey: {},
  key(id){ return id === 'a' ? 'a_' + player.sect : id === 'tp' ? 'tp_' + player.sect : id; },
  speak(id){
    if (!this.on || !player || SETTINGS.sfx <= 0) return;
    const now = performance.now();
    if (now - this.lastGlobal < 1500) return; // nhịp tối thiểu giữa 2 tiếng hô
    const k = this.key(id);
    if (now - (this.lastByKey[k] || 0) < 5000) return; // cùng chiêu không hô lại trong 5s
    let a = this.cache[k];
    if (!a){ a = new Audio('assets/voice/' + k + '.mp3'); this.cache[k] = a; }
    const inst = a.cloneNode();
    inst.volume = Math.min(1, 0.95 * AudioSys.sfxVol());
    inst.playbackRate = 1.12; // thêm lực "hét"
    inst.play().catch(()=>{});
    this.lastGlobal = now; this.lastByKey[k] = now;
  },
};
// chiêu nào được hô tên: dung hợp · tuyệt học Cao/Thần cấp · trấn phái · đại chiêu hồi dài · chiêu môn phái (35%)
function vhShout(id, d){
  if (id === 'tp') return true;
  if (id === 'a') return Math.random() < 0.35;
  if (FUSION_DEFS[id]) return true;
  const v = VOHOC_DEFS[id];
  if (v) return v.tier === 'cao' || v.tier === 'than';
  return !!(d && (d.cd || 0) >= 7); // gangkhi, danchi, tieuhon
}
window.addEventListener('pointerdown', ()=>AudioSys.tryStart());
window.addEventListener('keydown', ()=>AudioSys.tryStart());
document.getElementById('btn-music').addEventListener('click', ()=>{
  SETTINGS.bgm = SETTINGS.bgm > 0 ? 0 : 35;
  saveSettings(); AudioSys.refreshBgmVol();
  const b = document.getElementById('btn-music');
  if (b) b.style.opacity = SETTINGS.bgm > 0 ? '1' : '0.4';
});
{
  const bv = document.getElementById('btn-voice');
  if (bv){
    bv.style.opacity = SkillVoice.on ? '1' : '0.4';
    bv.addEventListener('click', ()=>{
      SkillVoice.on = !SkillVoice.on;
      try { localStorage.setItem('ghha_voice', SkillVoice.on ? '1' : '0'); } catch { /* best-effort — bỏ qua nếu lỗi */ }
      bv.style.opacity = SkillVoice.on ? '1' : '0.4';
      addFloat(player ? player.x : 0, player ? player.y - 40 : 0, SkillVoice.on ? '🔊 Bật giọng hô tên chiêu' : '🔇 Tắt giọng hô tên chiêu', '#7ecbff', 12);
    });
  }
}

// ---------- Input ----------
window.addEventListener('keydown', e=>{
  if (e.target && e.target.tagName === 'INPUT') return; // đang gõ console playtest
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { e.preventDefault(); doBasic(); }
  if (e.key >= '1' && e.key <= '3' && player){ // taskbar 3 ô kỹ năng (chính/phụ/buff)
    const id = player.skillBar[+e.key - 1];
    if (id) castSkill(id); else togglePanel('skill');
  }
  if (e.key.toLowerCase()==='e'){ if (!window.tryCatchHorse || !tryCatchHorse()) tryTalk(); } // GDD Đợt 2 B5: E bắt Tuấn Mã kiệt sức trước
  if (e.key.toLowerCase()==='j'){ if (!tryPickLoot()) tryHarvestHerb(); } // nhặt đồ dưới đất → hái thảo dược
  if (e.key.toLowerCase()==='c') togglePanel('char');
  if (e.key.toLowerCase()==='v') togglePanel('vstat');   // cửa sổ nhân vật kiểu MU
  if (e.key.toLowerCase()==='i') togglePanel('inv');
  if (e.key.toLowerCase()==='b') togglePanel('bag');
  if (e.key.toLowerCase()==='k') togglePanel('skill');
  if (e.key.toLowerCase()==='m') togglePanel('map');
  if (e.key.toLowerCase()==='q') togglePanel('qlog');
  if (e.key.toLowerCase()==='u'){ SETTINGS.minimap = !SETTINGS.minimap; saveSettings(); }
  if (e.key.toLowerCase()==='o') togglePanel('settings');
  if (e.key.toLowerCase()==='f') togglePanel('forge');
  // Phím T dành riêng cho thu phục Linh Thú — Thú Chiến mở qua C → Thú Chiến, xuất trận/thu hồi bằng V
  if (e.key.toLowerCase()==='v') toggleMountOut();
  if (e.key.toLowerCase()==='z' && player && !dead) toggleAuto();
  if (e.key === '`' && window.TEST_MODE){ e.preventDefault(); window.toggleCheatConsole(); }
  if (e.key.toLowerCase()==='h') togglePanel('tuyethoc');
  if (e.key.toLowerCase()==='r') usePotion();
  if (e.key.toLowerCase()==='g' && nearGate && player && !dead) travelTo(nearGate.to, curMap);
  if (e.key.toLowerCase()==='t' && player && !dead) tryTame(); // Phong Linh Phù — thu phục tinh anh suy yếu
  if (e.key === 'Escape') closePanels();
});
window.addEventListener('keyup', e=> keys[e.key.toLowerCase()] = false);
// Giữ ALT: hiện nhãn tên MỌI món dưới đất, không chỉ món gần. Nhả ra là về như cũ.
window.addEventListener('keydown', e => { if (e.key === 'Alt'){ window._lootShowAll = true; e.preventDefault(); } });
window.addEventListener('keyup',   e => { if (e.key === 'Alt') window._lootShowAll = false; });
window.addEventListener('blur',    () => { window._lootShowAll = false; }); // Alt+Tab: đừng kẹt bật
canvas.addEventListener('mousemove', e=>{
  mouseWorld.x = e.clientX + camera.x; mouseWorld.y = e.clientY + camera.y;
});
canvas.addEventListener('mousedown', e=>{
  if (!player || dead) return;
  if (e.button !== 0) return; // chuột phải dành cho click-to-move (xem contextmenu bên dưới)
  closePanels(); // click the world = close any open window
  mouseWorld.x = e.clientX + camera.x; mouseWorld.y = e.clientY + camera.y;
  const npcHit = npcAt(mouseWorld.x, mouseWorld.y);
  if (npcHit){ walkToNpc(npcHit); return; } // bấm trúng NPC: tự đi tới + tự mở lời thoại, không cần bấm E
  if (tryPickLoot(mouseWorld.x, mouseWorld.y)) return; // bấm trúng đồ dưới đất: nhặt
  player.face = Math.atan2(mouseWorld.y - player.y, mouseWorld.x - player.x);
  doBasic();
});
// Click-to-move (chuột phải): đi tới điểm đã bấm, né vật cản dọc đường — không đổi hành vi chuột trái
// Bấm trúng NPC (chuột trái/phải đều được) thì tự đi tới rồi tự trò chuyện, xem npcAt()/walkToNpc()
canvas.addEventListener('contextmenu', e=>{
  e.preventDefault();
  if (!player || dead) return;
  closePanels();
  const wx = e.clientX + camera.x, wy = e.clientY + camera.y;
  const npcHit = npcAt(wx, wy);
  if (npcHit){ walkToNpc(npcHit); return; }
  setMoveTarget(wx, wy);
});
// Bấm minimap (chuột trái) — đi tới điểm đó; quái hiện lên minimap ngay bên dưới điểm bấm nên đây
// cũng chính là cách "đi tới bãi quái gần nhất" tự nhiên nhất, không cần thêm icon vùng riêng.
if (miniCvs) miniCvs.addEventListener('click', e=>{
  if (!player || dead) return;
  const rect = miniCvs.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (miniCvs.width / rect.width);
  const cy = (e.clientY - rect.top) * (miniCvs.height / rect.height);
  const sx = miniCvs.width / MAP.w, sy = miniCvs.height / MAP.h;
  setMoveTarget(cx / sx, cy / sy);
});

// touch joystick
const joy = document.getElementById('joystick'), knob = document.getElementById('joy-knob');
let joyId = null, joyCenter = null;
joy.addEventListener('touchstart', e=>{
  const t = e.changedTouches[0]; joyId = t.identifier;
  joyCenter = { x: t.clientX, y: t.clientY }; e.preventDefault();
}, {passive:false});
window.addEventListener('touchmove', e=>{
  for (const t of e.changedTouches){
    if (t.identifier === joyId && joyCenter){
      const dx = t.clientX - joyCenter.x, dy = t.clientY - joyCenter.y;
      const d = Math.hypot(dx,dy), max = 38;
      const k = d > max ? max/d : 1;
      knob.style.left = (35 + dx*k) + 'px'; knob.style.top = (35 + dy*k) + 'px';
      joyVec.x = (dx*k)/max; joyVec.y = (dy*k)/max;
    }
  }
}, {passive:true});
window.addEventListener('touchend', e=>{
  for (const t of e.changedTouches){
    if (t.identifier === joyId){
      joyId = null; joyVec.x = 0; joyVec.y = 0;
      knob.style.left = '35px'; knob.style.top = '35px';
    }
  }
});
// Joystick (di chuyển tay) đã bỏ theo GDD Quan Sát — không hiện nữa, kể cả trên di động;
// mobile vẫn tự chạy tới đích qua bấm minimap hoặc đèn hiệu nhiệm vụ.

document.getElementById('sk-basic').addEventListener('click', doBasic);
document.querySelectorAll('.sk-slot').forEach(b=>{
  b.addEventListener('click', ()=>{
    const id = player && player.skillBar[+b.dataset.slot];
    if (id) castSkill(id); else togglePanel('skill');
  });
});
// Ô cuối thanh kỹ năng nay là NHẶT ĐỒ (trước là Phiêu Vân Bộ — nhảy). Trên điện thoại không
// có bàn phím nên đây là đường DUY NHẤT để nhặt đồ dưới đất.
document.getElementById('sk-loot').addEventListener('click', () => {
  if (!tryPickLoot()) tryHarvestHerb();
});

// ---------- Combat ----------
function addFloat(x,y,text,color,size){
  if (floats.length >= 70) floats.shift(); // chống tràn số bay
  floats.push({ x, y, text, color, t:1, size:size||13 });
}
function addEffect(e){ if (effects.length >= 400) effects.splice(0, effects.length - 399); effects.push(Object.assign({ t:0 }, e)); } // trần cứng chống phình RAM

// ═══════════ ĐỒ RƠI DƯỚI ĐẤT ═══════════
// Trước bản này quái chết là item nhảy thẳng vào player.inv, người chơi chỉ thấy một dòng chữ
// 12px sống 1,25 giây — đo thật 300 con: 33% số kill IM LẶNG TUYỆT ĐỐI, và túi đầy thì đồ bốc
// hơi không một lời cảnh báo (50/50 món mất trắng). Đó là thứ MU Online làm ngược lại hoàn
// toàn: đồ nằm dưới đất, có tên nổi màu theo phẩm, đọc được bao lâu tùy ngươi.
// KHÔNG lưu vào save — rời map hay thoát game là mất, đúng như mọi thứ tạm khác trong game.
let groundLoot = [];
const LOOT_TTL     = 45;    // giây nằm dưới đất
const LOOT_BLINK   = 10;    // nhấp nháy cảnh báo trong 10 giây cuối
const LOOT_MAX     = 60;    // trần cứng chống phình RAM khi treo AUTO
const LOOT_GRAB_R  = 46;    // đi ngang qua là nhặt
const LOOT_REACH_R = 96;    // tầm với của phím J / cú bấm chuột
const LOOT_G       = 620;   // trọng lực cú nảy
function lootRar(g){ return g.k === 'jewel' ? 3 : (g.it.rarity || 0); }
function lootColor(g){ return g.k === 'jewel' ? JEWEL_COLORS[g.jk] : RARITIES[g.it.rarity].color; }
function lootName(g){ return g.k === 'jewel' ? JEWEL_NAMES[g.jk] : g.it.name; }
// Bắn item ra khỏi xác theo hình vòng cung rồi đáp xuống — cú nảy chính là thứ báo cho mắt
// "vừa có cái gì rơi ra", trước khi kịp đọc chữ.
function dropToGround(o, x, y){
  if (groundLoot.length >= LOOT_MAX) groundLoot.shift();
  const a = Math.random() * 6.283, r = 26 + Math.random() * 30;
  const g = Object.assign({ x, y, tx: x + Math.cos(a) * r, ty: y + Math.sin(a) * r * 0.55,
    z: 12, vz: 190 + Math.random() * 70, t: LOOT_TTL, land: 0, wob: Math.random() * 6.283 }, o);
  g.sx = x; g.sy = y; g.fly = 0;
  groundLoot.push(g);
  const col = lootColor(g);
  addEffect({ type:'spark', x, y: y - 10, r: 20 + lootRar(g) * 9, color: col });
  if (g.k === 'jewel'){
    // Âm riêng cho ngọc. KHÔNG được dùng 'coin': killMob đã gọi sfx('coin') vài phần nghìn
    // giây trước, mà AudioSys debounce 70ms mỗi tên âm → tiếng ngọc bị nuốt 100%.
    AudioSys.sfx('forge_ok', 0.9);
    addEffect({ type:'ring', x, y, r: 56, color: col, big:true });
  } else if (lootRar(g) >= 2){
    AudioSys.sfx('quest', 0.75);
    addEffect({ type:'ring', x, y, r: 46 + lootRar(g) * 14, color: col, big:true });
    if (lootRar(g) >= 3){ shakeMag = Math.max(shakeMag || 0, 5); zoneBanner = zoneBanner ||
      { text:`${RARITIES[g.it.rarity].name.toUpperCase()} RƠI XUỐNG!`, sub: g.it.name, color: col, t:3 }; }
  }
  return g;
}
function updateGroundLoot(dt){
  if (!groundLoot.length || !player) return;
  for (let i = groundLoot.length - 1; i >= 0; i--){
    const g = groundLoot[i];
    if (g.z > 0 || g.vz !== 0){                        // còn đang bay: nội suy tới điểm đáp
      g.fly = Math.min(1, g.fly + dt * 2.6);
      g.x = g.sx + (g.tx - g.sx) * g.fly;
      g.y = g.sy + (g.ty - g.sy) * g.fly;
      g.vz -= LOOT_G * dt; g.z += g.vz * dt;
      if (g.z <= 0){ g.z = 0; g.vz = 0; g.land = 0.28; }  // land = thời gian bẹt bóng lúc chạm đất
    }
    if (g.land > 0) g.land = Math.max(0, g.land - dt);
    g.t -= dt;
    if (g.t <= 0){ groundLoot.splice(i, 1); continue; }
    // AUTO đang cày thì nới tầm hút: lớp tầm xa giết quái cách 200px, để nguyên bán kính
    // đi-ngang-qua là treo máy cả tiếng rồi bỏ lại nguyên bãi đồ dưới đất.
    const gr = (player.auto ? LOOT_REACH_R * 3 : LOOT_GRAB_R);
    if (g.z === 0 && dist(player.x, player.y, g.x, g.y) < gr) takeLoot(g, i);
  }
}
// Trả về true nếu đã nhặt được. Túi đầy thì KHÔNG xoá — đồ nằm lại dưới đất và đổi nhãn cảnh
// báo, thay cho việc mất trắng im lặng như bản cũ.
function takeLoot(g, idx){
  if (idx == null) idx = groundLoot.indexOf(g);
  if (idx < 0) return false;
  if (g.k === 'jewel'){
    player.jewels[g.jk] = (player.jewels[g.jk] || 0) + 1;
    addFloat(g.x, g.y - 26, '+1 ' + JEWEL_NAMES[g.jk], JEWEL_COLORS[g.jk], 14);
    logCombat(`✦ Nhặt ${JEWEL_NAMES[g.jk]}`, JEWEL_COLORS[g.jk]);
    AudioSys.sfx('forge_ok', 0.7);
  } else {
    if (player.inv.length >= 30){ g.full = true; g.t = Math.max(g.t, LOOT_BLINK + 1); return false; }
    g.full = false;
    player.inv.push(g.it);
    addFloat(g.x, g.y - 26, g.it.name, RARITIES[g.it.rarity].color, 13);
    logCombat(`▣ Nhặt ${g.it.name}`, RARITIES[g.it.rarity].color);
    AudioSys.sfx(g.it.rarity >= 2 ? 'levelup' : 'ui', g.it.rarity >= 2 ? 0.85 : 0.5);
    tryAutoEquip(g.it);
  }
  addEffect({ type:'ring', x: g.x, y: g.y, r: 26, color: lootColor(g) });
  groundLoot.splice(idx, 1);
  tutAdvance('loot');
  return true;
}
// Phím J (không truyền toạ độ): với quanh người chơi, ưu tiên món gần nhất.
// Chuột trái (truyền toạ độ): phải bấm TRÚNG món — bán kính hẹp bằng cỡ icon, không thì mỗi
// cú vung kiếm gần đống đồ lại biến thành thao tác nhặt và người chơi mất đòn đánh.
function tryPickLoot(px, py){
  if (!player || dead || !groundLoot.length) return false;
  const byClick = px != null;
  const x = byClick ? px : player.x, y = byClick ? py : player.y;
  let best = -1, bd = byClick ? 26 : LOOT_REACH_R;
  for (let i = 0; i < groundLoot.length; i++){
    const g = groundLoot[i];
    if (byClick && dist(player.x, player.y, g.x, g.y) > LOOT_REACH_R * 2) continue; // ngoài tầm với
    const d = dist(x, y, g.x, g.y - g.z - 12);
    if (d < bd){ bd = d; best = i; }
  }
  if (best < 0) return false;
  return takeLoot(groundLoot[best], best);
}
function drawGroundLoot(now){
  if (!groundLoot.length) return;
  const alt = !!window._lootShowAll;
  for (const g of groundLoot){
    if (g.x < camera.x - 60 || g.x > camera.x + W + 60 || g.y < camera.y - 90 || g.y > camera.y + H + 60) continue;
    const rar = lootRar(g), col = lootColor(g);
    const blink = g.t < LOOT_BLINK ? (0.45 + 0.55 * Math.abs(Math.sin(now / 170))) : 1;
    const bob = g.z > 0 ? 0 : Math.sin(now / 520 + g.wob) * 2.2;
    const iy = g.y - g.z - 12 + bob;
    ctx.save(); ctx.globalAlpha = blink;
    // bóng đổ — bẹt ra đúng lúc chạm đất, đó là cái làm cú nảy có sức nặng
    const sq = 1 + g.land * 1.5;
    ctx.fillStyle = `rgba(0,0,0,${0.30 - Math.min(0.22, g.z / 180)})`;
    ctx.beginPath(); ctx.ellipse(g.x, g.y, 9 * sq, 4 * sq, 0, 0, 7); ctx.fill();
    // cột sáng cho đồ hiếm: nhìn thấy từ xa, khỏi phải đọc chữ mới biết đáng chạy tới
    if (rar >= 2 && !SETTINGS.lowFx && g.z === 0){
      const pul = 0.42 + 0.26 * Math.sin(now / 340 + g.wob);
      const lg = ctx.createLinearGradient(g.x, g.y - 96, g.x, g.y);
      lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, col);
      ctx.globalAlpha = blink * pul; ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(g.x - 13, g.y); ctx.lineTo(g.x - 5, g.y - 96);
      ctx.lineTo(g.x + 5, g.y - 96); ctx.lineTo(g.x + 13, g.y); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = blink;
    }
    if (g.k === 'jewel') drawLootJewel(g.x, iy, col, now + g.wob * 500);
    else {
      // Nền tối + viền theo phẩm. Hình vật phẩm được vẽ cho ô túi NỀN TỐI, đặt thẳng lên bãi
      // cỏ sáng thì mất hút — ảnh chụp đầu tiên chỉ thấy mấy vệt xám không đọc ra là món gì.
      const R = 19;
      ctx.fillStyle = 'rgba(9,7,15,.62)';
      ctx.beginPath(); ctx.roundRect(g.x - R, iy - R, R*2, R*2, 6); ctx.fill();
      ctx.strokeStyle = col; ctx.globalAlpha = blink * (rar >= 2 ? 0.95 : 0.5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(g.x - R, iy - R, R*2, R*2, 6); ctx.stroke();
      ctx.globalAlpha = blink;
      const d = itemDef(g.it);
      const url = d && itemArtUrl(d, g.it.tier || 1, g.it.rarity || 0, g.it.plus || 0);
      const im = url && _lootImg(url);
      if (im && im.complete && im.naturalWidth) ctx.drawImage(im, g.x - 17, iy - 17, 34, 34);
      else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(g.x, iy, 8, 0, 7); ctx.fill(); }
    }
    // nhãn tên: chỉ hiện cho món hiếm / món gần / khi giữ ALT — không thì 20 nhãn đè lên nhau
    const near = dist(player.x, player.y, g.x, g.y) < 190;
    if (g.z === 0 && (alt || near || rar >= 2 || g.full)){
      const txt = g.full ? '⚠ TÚI ĐẦY — ' + lootName(g) : lootName(g);
      ctx.font = `${rar >= 2 ? 'bold ' : ''}12px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(txt).width + 12, ly = iy - (g.k === 'jewel' ? 26 : 32);
      ctx.fillStyle = 'rgba(8,6,14,.72)';
      ctx.beginPath(); ctx.roundRect(g.x - w/2, ly - 9, w, 18, 5); ctx.fill();
      ctx.strokeStyle = g.full ? '#ff6a3a' : (rar >= 2 ? col : 'rgba(255,255,255,.14)');
      ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = g.full ? '#ff9a6a' : col; ctx.fillText(txt, g.x, ly);
    }
    ctx.restore();
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
const _lootImgs = new Map();
function _lootImg(url){
  let im = _lootImgs.get(url);
  if (!im){ im = new Image(); im.src = url; _lootImgs.set(url, im); }
  return im;
}
function drawLootJewel(x, y, col, t){
  const s = 1 + Math.sin(t / 400) * 0.06;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, -3); ctx.lineTo(5, 10);
  ctx.lineTo(-5, 10); ctx.lineTo(-8, -3); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, -3); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,8,16,.75)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, -3); ctx.lineTo(5, 10);
  ctx.lineTo(-5, 10); ctx.lineTo(-8, -3); ctx.closePath(); ctx.stroke();
  ctx.restore();
}
// Nhật ký chiến đấu: gộp sát thương/thưởng mỗi đòn thành 1 dòng chữ trong panel góc dưới trái,
// thay cho số bay đầy màn hình khi AUTO đang đánh nhiều quái cùng lúc (kiểu combat log NGU Idle) —
// thao tác DOM trực tiếp, không giữ mảng riêng vì log không cần lưu qua save/load
function logCombat(text, color){
  const logEl = el('combat-log');
  if (!logEl) return;
  const row = document.createElement('div');
  row.className = 'cl-row';
  row.style.color = color || '#e8ecff';
  row.textContent = text;
  logEl.insertBefore(row, logEl.firstChild);
  while (logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
}

// ═══════════ KHẮC ẤN — bộ máy chạy (bảng dữ liệu ở SIGIL_DEFS) ═══════════
// Gọi một móc trên mọi Khắc Ấn người chơi đang mặc. Bọc trong _sigilBusy để sát thương do
// Khắc Ấn gây ra không kích lại chính nó.
function sigilFire(hook, a, b, c, d){
  if (!player || !player.sigils) return;
  // 'pre'/'hit'/'cast' không được tự kích lại từ sát thương của chính Khắc Ấn — sẽ thành vòng
  // lặp vô hạn. Riêng 'kill' thì PHẢI chạy: hạ địch bằng Khắc Ấn vẫn là hạ địch, Hồi Quang và
  // Bùng Cháy đều dựa vào nó. Nổ dây chuyền được chặn bằng độ sâu, không phải cấm hẳn.
  if (hook === 'kill' ? _sigilDepth >= SIGIL_MAX_DEPTH : _sigilBusy) return;
  const _prevBusy = _sigilBusy;
  _sigilBusy = true; _sigilDepth++;
  try {
    for (const k in player.sigils){
      const s = SIGIL_DEFS[k];
      if (!s || !s[hook]) continue;
      try { s[hook](a, b, c, d); }
      catch (e){ console.error('Khắc Ấn ' + k + '.' + hook, e); }   // 1 Khắc Ấn lỗi không được làm gãy cả đòn đánh
    }
  } finally { _sigilBusy = _prevBusy; _sigilDepth--; }
}
// Sát thương phát sinh từ Khắc Ấn: đi qua hurtMob() như mọi nguồn khác (để ăn giáp quái, khắc
// hệ, hút máu…) nhưng mang source riêng nên không gây khựng hình/rung màn hình lặp.
function sigilHurt(m, dmg){
  if (!m || m.dead) return;
  hurtMob(m, Math.max(1, dmg), 'sigil');
}
function sigilArea(x, y, r, dmg, except){
  for (const m of mobs){
    if (m.dead || m === except || m.def.duHiep) continue;
    if (dist(x, y, m.x, m.y) < r + m.def.size) sigilHurt(m, dmg * rnd(0.9, 1.1));
  }
}
function sigilSplash(m, r, dmg){ sigilArea(m.x, m.y, r, dmg, m); }
function sigilAfter(t, fn){ sigilTimers.push({ t, fn }); }
// Xoá sạch việc hẹn giờ + vùng đất — gọi khi đổi map hoặc người chơi chết, nếu không một
// quả Trấn Phái tung ở map cũ sẽ nổ giữa map mới.
function sigilReset(){ sigilTimers.length = 0; sigilZones.length = 0; }
function sigilTick(dt){
  if (sigilTimers.length){
    for (const s of sigilTimers) s.t -= dt;
    const due = sigilTimers.filter(s => s.t <= 0);
    if (due.length){
      sigilTimers = sigilTimers.filter(s => s.t > 0);
      // _sigilBusy: đòn hẹn giờ cũng là sát thương của Khắc Ấn, không được kích Khắc Ấn lần nữa
      _sigilBusy = true;
      try { for (const s of due) { try { s.fn(); } catch (e){ console.error('Khắc Ấn hẹn giờ', e); } } }
      finally { _sigilBusy = false; }
    }
  }
  for (const z of sigilZones){
    z.t -= dt; z.tick -= dt;
    if (z.tick <= 0){
      z.tick = 0.5;
      _sigilBusy = true;
      try { sigilArea(z.x, z.y, z.r, z.dps * 0.5); } finally { _sigilBusy = false; }
      addEffect({ type:'ring', x:z.x, y:z.y, r:z.r, color:z.color });
      for (let i = 0; i < 3; i++)
        addEffect({ type:'ink', x:z.x + rnd(-z.r,z.r)*0.8, y:z.y + rnd(-z.r,z.r)*0.8,
                    vx:rnd(-15,15), vy:rnd(-40,-8), color:z.color });
    }
  }
  if (sigilZones.length) sigilZones = sigilZones.filter(z => z.t > 0);
}

// ═══════════ PHẢN HỒI LỰC ĐÒN — mỗi CÚ ĐÁNH một lần, không phải mỗi mục tiêu ═══════════
// Trước đây hitstop/rung/loé bạo kích nằm trong hurtMob(), tức mỗi mục tiêu một lần: AoE trúng
// 8 con đặt lại hitstop 8 lần và đẻ 8 vệt loé; đạn multishot làm hitstop nối đuôi nên game giật
// liên tục thay vì khựng một nhịp rồi bung. Cửa sổ 60 ms gom cả cú đánh lại, giữ giá trị MẠNH
// NHẤT trong cú đó.
let _swingT = 0, _swingBest = -1;
function swingFeel(crit, w, m){
  const now = performance.now();
  const fresh = now - _swingT > 60;
  if (fresh){ _swingT = now; _swingBest = -1; }
  const power = (crit ? 1 : 0.45) + w * 0.8;           // w = phần máu vừa mất
  if (power <= _swingBest) return;                      // trong cùng cú đánh đã có đòn mạnh hơn
  _swingBest = power;
  hitStop  = Math.max(hitStop,  crit ? 0.06 + 0.08 * w : 0.03 + 0.04 * w);
  shakeT   = Math.max(shakeT,   crit ? 0.20 : 0.14);
  shakeMag = Math.max(shakeMag, (crit ? 4 : 2.2) + w * 5);
  shakeDir = Math.atan2(m.y - player.y, m.x - player.x); // xung CÓ HƯỚNG, xem render()
  if (crit && fresh)                                    // một vệt loé cho cả cú, không phải mỗi con
    addEffect({ type:'critflash', x:m.x, y:m.y, r:(m.def.size||14) + 18 + w * 26 });
}

function hurtMob(m, dmg, source){
  if (m.dead) return;
  player.combatT = 4; // P0: gây sát thương cũng tính là vào combat
  // LIÊN TRẢM: trong cửa sổ — mọi đòn/chiêu của người chơi +30% ST; chí mạng duy trì cửa sổ
  if ((player.ltT || 0) > 0 && (source === 'hit' || source === 'crit' || source === 'tp' || source === 'amkhi')){
    dmg *= 1.3;
    if (source === 'crit') player.ltT = 2.5;
  }
  // Du Hiệp trung lập: chỉ đánh được khi bật PK (khu an toàn tuyệt đối cấm)
  // QA: chặn player.pk thôi là chưa đủ — nếu để PK bật rồi bật AUTO farm đi chỗ khác, một Du Hiệp
  // trung lập lang thang vào tầm nổ AoE/thú cưỡi/linh thú vẫn có thể "ăn miểng" ngoài ý muốn dù
  // AUTO không hề chủ đích chọn nó (xem game.js AUTO FARM: m.def.duHiep && !m.revenge → loại khỏi
  // mục tiêu, nhưng đó chỉ chặn ở khâu CHỌN mục tiêu, không chặn sát thương lan tới từ mục tiêu khác).
  // Chặn hẳn ở đây — nơi mọi nguồn sát thương đều đi qua — khi đang AUTO, bất kể PK đang bật hay tắt.
  if (m.def.duHiep && !m.revenge && (player.auto || !player.pk)){
    if (!player.auto) addFloat(m.x, m.y - m.def.size - 16, 'Bật PK để tấn công Du Hiệp!', '#8a8a8a', 11);
    return;
  }
  // QA: AUTO chỉ được farm ĐÚNG 1 bãi quái đã khoá (xem AUTO FARM trong update()) — nhưng khoá đó
  // chỉ chặn ở khâu CHỌN mục tiêu, không chặn vật lý va chạm của đạn xuyên táo/AoE bay lố sang bãi
  // bên cạnh (ví dụ tên xuyên nhắm bãi đang khoá nhưng bay tiếp trúng quái bãi khác đứng thẳng
  // hàng phía sau). Chặn hẳn ở đây để không món sát thương nào của AUTO lọt sang bãi chưa khoá.
  if (player.auto && player._autoZoneLocked && m.zone !== player._autoZone) return;
  // Aggro cụm: đánh 1 con, cả cụm 5-7 con lao vào (GDD Mob Mechanics)
  // QA: map An Toàn (tân thủ) chỉ tối đa 3 con cùng lao vào để tránh chết oan lúc LV1-5
  if (m.pack != null){
    const cap = mapDef().type === 'safe' ? 3 : 99;
    let alerted = 0;
    const mates = mobs.filter(m2 => !m2.dead && m2 !== m && m2.pack === m.pack && dist(m.x, m.y, m2.x, m2.y) < 340)
      .sort((a,b) => dist(m.x,m.y,a.x,a.y) - dist(m.x,m.y,b.x,b.y));
    for (const m2 of mates){ if (++alerted > cap) break; m2.packAlert = 8; }
  }
  if (m.def.duHiep) m.provoked = true; // bị đánh → phản kích
  let final = dmg;
  let shieldNote = false, counterNote = false, counteredNote = false, perfectNote = false;
  // Khắc hệ: hệ đòn đánh (VŨ KHÍ, không có thì hệ lớp) khắc hệ quái → +20% sát thương;
  // bị quái khắc → -12%. Chỉ chiều này đọc hệ vũ khí — xem atkElem().
  const sectEl = atkElem();
  if (sectEl && m.def.el){
    if (ELEM[sectEl].beats === m.def.el){ final *= 1.2; counterNote = true; }
    else if (ELEM[m.def.el] && ELEM[m.def.el].beats === sectEl){ final *= 0.88; counteredNote = true; }
  }
  // Áp Bức Võ Công (GDD Boss v2.1): boss cao hơn người chơi → ST bị áp chế theo chênh cấp (tường level mềm)
  if (m.def.bossKind){
    const gap = m.def.lv - player.level;
    let abMul = 1;
    if (gap > 10) abMul = 0.35; else if (gap >= 6) abMul = 0.6; else if (gap >= 1) abMul = 0.85;
    if (abMul < 1){
      final *= abMul;
      if (Math.random() < 0.12) logCombat(`⛨ Áp Bức Võ Công — công kích lên ${m.def.name} bị áp chế!`, '#c07fe0');
    }
    if (m.punishT > 0) final *= 1.15; // cửa sổ trừng phạt sau khi boss ra chiêu
  }
  // Đồng Môn Trợ Uy (Cốt truyện × Tông môn): đánh trên map "chạm nhà" của phái mình +5% ST
  if (SECT_HOOK_MAP[curMap] === player.sect) final *= 1.05;
  // Sát thương hoàn hảo (vũ khí/dây chuyền): tỉ lệ % gây ×2 sát thương
  if (player.perfectProc && Math.random() < player.perfectProc){
    final *= 2; perfectNote = true;
  }
  // Xuyên giáp (áo choàng/cung tiễn): tăng sát thương theo %
  if (player.pierce) final *= 1 + player.pierce;
  if (m.shield > 0){
    if (source === 'amkhi'){
      m.shield = 0; m.shieldT = 10 + (player.shieldBonus || 0); // P0: cửa sổ phá khiên 10s · Đoạn Ngọc Thủ +4s
      addFloat(m.x, m.y-24, 'PHÁ HUYỆT!', '#c07fe0', 16);
      addEffect({ type:'ring', x:m.x, y:m.y, r:50, color:'#c07fe0' });
    } else {
      final *= 0.3; shieldNote = true;
    }
  }
  // Giáp quái: giảm sát thương theo công thức mềm (trước đây chỉ số def của quái không được dùng)
  if (m.def.def) final *= 1 - m.def.def / (m.def.def + 250);
  final = Math.max(1, Math.round(final));
  m.hp -= final; m.hitT = 0.15;
  // Màu loé theo LOẠI đòn — trước đây `ctx.filter` chỉ làm sáng lên, không phân biệt được gì.
  const _mf = (source === 'hit' || source === 'crit') ? weaponFx() : null;
  m.hitCol = perfectNote ? '#ff9df0' : source === 'crit' ? '#ffd76a'
           : counterNote ? (ELEM[sectEl] || {}).color || '#ffffff'
           : _mf ? _mf.col : '#ffffff';
  // Tỉ lệ SỨC NẶNG của đòn: cào 1% máu và bổ mất nửa cây máu phải khác nhau. Trước đây hitstop
  // là hằng số bất kể sát thương nên mọi đòn chạm nhau y hệt.
  const _w = Math.min(1, final / Math.max(1, m.maxHp));
  // Hất lùi theo sát thương. vhKnockback() viết sẵn từ lâu nhưng CHỈ được gọi khi chiêu khai
  // báo fx.kb — đòn thường không đẩy quái một pixel nào. Quái to gần như bất động (chia size).
  // ⚠ CHỈ đòn đơn mục tiêu. Cố ý KHÔNG áp cho 'tp' (Trấn Phái) và các chiêu diện rộng:
  // AoE mà đẩy địch ra thì chính nó phá tan đội hình cho đòn kế tiếp của mình, chống lại mọi
  // thứ ăn theo việc gom địch — Khắc Ấn Hiệu Triệu (trúng ≥3 địch) là ví dụ trực tiếp, nó
  // ngừng kích hoạt vì Trấn Phái đẩy con thứ ba ra đúng 1 pixel khỏi tầm quạt.
  // Chiêu nào MUỐN hất lùi thì khai báo `fx.kb` như trước, đi qua vhKnockback riêng.
  if (!_aoeHit && (source === 'hit' || source === 'crit')){
    const _kb = (2 + 10 * _w) * (14 / Math.max(14, m.def.size || 14));
    if (_kb > 0.4) vhKnockback(m, Math.atan2(m.y - player.y, m.x - player.x), _kb);
  }
  // Khựng hình / rung / loé bạo kích KHÔNG đặt ở đây nữa — xem swingFeel(). Đặt trong hurtMob
  // nghĩa là AoE trúng 8 con thì kích hoạt 8 lần, và đạn multishot làm hitstop nối đuôi nhau
  // khiến game giật liên tục thay vì "khựng một nhịp rồi bung".
  if (source === 'hit' || source === 'crit'){
    swingFeel(source === 'crit', _w, m);
    motifBurst(m.x, m.y - (m.def.size || 14) * 0.4, Math.atan2(m.y - player.y, m.x - player.x));
  }
  // Âm chạm. `sfx_hit.mp3` KHÔNG TỒN TẠI trên đĩa, nên trước đây mọi đòn thường im lặng lúc
  // chạm còn bạo kích thì có tiếng — game phân biệt thường/chí mạng bằng CÓ TIẾNG vs KHÔNG,
  // hoàn toàn do tai nạn. Dùng smash_<hệ> đã có sẵn (đúng chất liệu, đúng theo lớp).
  if (source === 'crit' || perfectNote) AudioSys.sfx('crit', 0.8);
  else if (source === 'hit'){
    const _hc = SECT_SFX[player.sect];
    AudioSys.sfx(_hc ? 'smash_' + _hc : 'crit', 0.3 + 0.25 * _w);
  }
  // Nhật ký chiến đấu thay cho số bay trên đầu quái (đỡ rối màn hình khi AUTO đánh nhiều quái) —
  // đòn thường gộp 1 dòng, đòn đặc biệt (hoàn hảo/khắc hệ/chống khiên) có tiền tố riêng
  {
    const note = perfectNote ? 'HOÀN HẢO ' : counterNote ? 'KHẮC HỆ ' : counteredNote ? 'bị khắc ' : shieldNote ? '(chống) ' : '';
    const color = perfectNote ? '#ff9df0' : counterNote ? '#5db86a' : counteredNote ? '#8a94a8' : shieldNote ? '#8a8a8a' : (source==='crit' ? '#ffd76a' : '#e8ecff');
    logCombat(`⚔ ${note}-${final} → ${m.def.name}${source==='crit' ? ' (bạo kích)' : ''}`, color);
  }
  // tương khắc: tia hào quang hệ thắng bao quanh quái
  if (counterNote) addEffect({ type:'ring', x:m.x, y:m.y, r:26 + m.def.size, color:ELEM[sectEl].color });
  // Hút sinh lực / nội lực (vũ khí · dây chuyền · pet)
  if (player.hpLeech) player.hp = Math.min(player.maxHp, player.hp + final * player.hpLeech);
  if (player.qiLeech) player.qi = Math.min(player.maxQi, player.qi + final * player.qiLeech);
  // Đạn Chỉ Thần Thông (Ascension tầng 4): 5% phong mạch — địch không thể tấn công 2s
  if (player.stunProc && Math.random() < player.stunProc && !m.def.boss){
    m.atkT = Math.max(m.atkT, 2.0);
    addFloat(m.x, m.y-34, 'PHONG MẠCH!', '#9fd0ff', 12);
    addEffect({ type:'ring', x:m.x, y:m.y, r:34, color:'#9fd0ff' });
  }
  // Huyết Ma Thôn Phệ (bí kíp giang hồ): hút 10% sát thương gây ra
  if (player.bikip && player.bikip.hmtp){
    player.hp = Math.min(player.maxHp, player.hp + final * 0.10);
  }
  // Hắc Uyên Thần Công (Võ Học Phổ): hút 25% sát thương thành sinh lực khi buff còn
  if ((player.vhLeechT || 0) > 0){
    player.hp = Math.min(player.maxHp, player.hp + final * 0.25);
  }
  // Khắc Ấn — móc 'hit'. Chạy TRƯỚC killMob() để một Khắc Ấn kịp đánh dấu con quái (vd Bùng
  // Cháy ghi m.sgBurn) rồi móc 'kill' ngay sau đó mới đọc được dấu ấy.
  if (source !== 'sigil'){
    if (_sigilTag) _sigilHits++;
    sigilFire('hit', m, final, source, _sigilTag);
  }
  if (m.hp <= 0) killMob(m, source);
}
function killMob(m, source){
  m.dead = true; m.deadT = 0.45; // xác tan dần thành mực thay vì biến mất tức thì
  // Cầu Giáp (chiêu Vỡ Giáp) chỉ là mục tiêu bấm có hạn giờ — không exp, không bạc, không đồ,
  // không đếm nhiệm vụ. Phải thoát ở ĐẦU hàm, không phải cuối: cuối là đã phát thưởng xong rồi.
  if (m.def.bossOrb){ addEffect({ type:'ring', x:m.x, y:m.y, r:34, color:'#ffd76a' }); AudioSys.sfx('ui', 0.5); return; }
  // Hai cơ chế chỉ đồ Hoàn Hảo có: hạ địch hồi Qi / Sinh Lực. Đặt ở killMob() để mọi đường
  // sát thương (đòn thường, chiêu, Khắc Ấn, pet) đều tính — không phải chỉ đòn tay.
  if (player.excQi && player.qi < player.maxQi){
    player.qi = Math.min(player.maxQi, player.qi + player.excQi);
    addFloat(m.x, m.y - 40, `+${player.excQi} Qi`, '#7ecbff', 11);
  }
  if (player.excHp && player.hp < player.maxHp){
    player.hp = Math.min(player.maxHp, player.hp + player.excHp);
    addFloat(m.x, m.y - 52, `+${player.excHp}`, '#6ae88a', 11);
  }
  sigilFire('kill', m); // Khắc Ấn — móc 'kill' (Hồi Quang, Bùng Cháy…)
  shakeT = Math.max(shakeT, 0.2); shakeMag = Math.max(shakeMag, m.def.boss ? 8 : m.def.elite ? 5 : 3); // hạ quái có lực
  AudioSys.sfx('die', 0.6);
  AudioSys.sfx('coin', 0.5);
  tutAdvance('kill'); // hướng dẫn tân thủ: hạ quái đầu tiên
  // GDD Mob Mechanics: hồi sinh cực nhanh 3-5s để treo auto không đứt combo
  m.respawnT = m.type === 'boss' ? 0 : (m.def.bossKind ? 60 : rnd(3, 5)); // Boss Vùng/Cổng Vực hồi 60s
  // Giết Du Hiệp: PK dã ngoại bị Tội Ác (đỏ tên); Huyết Chiến thì thoải mái
  if (m.def.duHiep){
    // A3: Du Hiệp ghi thù — nemesis-lite
    player.dhHate[m.type] = (player.dhHate[m.type] || 0) + 1;
    if (m.revenge){
      player.revengeKills = (player.revengeKills || 0) + 1;
      player.silver += 120; player.mat += 2;
      addFloat(m.x, m.y-70, `TÚC THÙ ĐÃ TRẢ (${player.revengeKills}) — thưởng thêm 120◈ 2✦`, '#f0a03a', 14);
      checkTitles();
    } else {
      addFloat(m.x, m.y-70, player.dhHate[m.type] >= 2 ? 'Thù hận sâu thêm — lần sau gặp, hắn sẽ TRUY THÙ!' : 'Du Hiệp sẽ ghi nhớ mối thù này...', '#e84a6a', 13);
    }
    if (mapDef().type === 'pk'){
      if (player.traitSatTam){ addFloat(player.x, player.y-64, 'Sát Tâm — giết không lưu Tội Ác!', '#b08ae8', 13); }
      else {
      player.toiac = (player.toiac || 0) + 1;
      addFloat(player.x, player.y-64, `TỘI ÁC +1 (${player.toiac}) — tên ngươi đỏ lên!`, '#ff3a3a', 16);
      }
      addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:'#ff3a3a', big:true });
    } else {
      addFloat(player.x, player.y-64, 'Hạ Du Hiệp — Huyết Chiến không Tội Ác!', '#e8b04a', 13);
    }
  }
  const _kb = (m.def.boss || m.def.bossKind) ? 2 : m.def.elite ? 1.4 : 1; // juice hạ quái theo phẩm (Gói E)
  addEffect({ type:'ring', x:m.x, y:m.y, r:m.def.size*3*_kb, color:'#3a332a' });
  if (_kb > 1) addEffect({ type:'ring', x:m.x, y:m.y, r:m.def.size*4.5*_kb, color:m.def.color, big:true });
  for (let i=0;i<Math.round(8*_kb);i++) addEffect({ type:'ink', x:m.x, y:m.y, vx:rnd(-70,70)*_kb, vy:rnd(-90,-20)*_kb, color:m.def.color });
  // xp & silver (Pet: +EXP% · trang bị: +đồng rơi%)
  // luật chênh cấp: quái thấp hơn mình >5 cấp → EXP giảm dần 15%/cấp (tối thiểu 10%) — phạt farm vùng thấp, drop giữ nguyên
  const _diff = player.level - m.def.lv;
  const _xpMul = _diff <= 5 ? 1 : Math.max(0.1, 1 - 0.15*(_diff - 5));
  const _xp = Math.round(m.def.xp * _xpMul);
  gainXp(_xp);
  const sil = Math.round(rnd(m.def.silver[0], m.def.silver[1]) * (1 + (player.silverPct || 0)/100));
  player.silver += sil;
  logCombat(`☠ Hạ ${m.def.name} — Nhận: +${_xp} EXP${_xpMul < 1 ? ` (-${Math.round((1-_xpMul)*100)}% chênh cấp)` : ''} +${sil}◈`, _xpMul < 1 ? '#c8b888' : '#7ecbff');
  // Pet rơi từ tinh anh (12%) / boss (40%); Cánh từ boss (12%)
  if (!m.def.boss && m.def.elite && Math.random() < 0.12 && player.inv.length < 30){
    const pi = Math.random() < 0.7 ? 0 : Math.random() < 0.8 ? 1 : 2;
    player.inv.push(genPet(pi));
    addFloat(m.x, m.y-88, `Pet: ${PET_DEFS[pi].name}!`, PET_DEFS[pi].color, 13);
  }
  if (m.def.boss){
    if (Math.random() < 0.4 && player.inv.length < 30){
      const pi = Math.floor(Math.random()*3);
      player.inv.push(genPet(pi));
      addFloat(m.x, m.y-102, `Pet: ${PET_DEFS[pi].name}!`, PET_DEFS[pi].color, 14);
    }
    if (Math.random() < 0.12 && player.inv.length < 30){
      const wi = Math.floor(Math.random()*2);
      player.inv.push(genWing(wi));
      addFloat(m.x, m.y-114, `${WING_DEFS[wi].name}!`, WING_DEFS[wi].color, 15);
    }
  }
  if (Math.random() < 0.3){ player.mat++; logCombat('+1 ✦ Huyền Thiết', '#9fd0ff'); }
  player.kills++;
  player.khi += 10; // Instinct từ chiến đấu
  player.dantian.tuvi += 2; // Anima từ chiến đấu — giảm thời gian ngồi thiền thuần túy (QA)
  dailyTrack('kills'); // Mục Tiêu Hôm Nay
  // gem drops: Tu La (sói+), Hỗn Nguyên (tinh anh/boss), Tiến Cấp Đan (sơn tặc+)
  if (m.def.lv >= 3 && Math.random() < 0.15){ player.gems.tuLa++; logCombat('+1 ◆ Tu La Tinh Thạch', '#e84a6a'); }
  if (m.def.elite && Math.random() < 0.35){ player.gems.honNguyen++; logCombat('+1 ❖ Hỗn Nguyên Thạch', '#b08ae8'); }
  if (m.def.lv >= 5 && Math.random() < 0.22){ player.tienDan++; logCombat('+1 ◈ Tiến Cấp Đan', '#7ec850'); }
  // Tinh anh & boss rớt thêm Tiến Cấp Đan (Drop v2.0 — gắn vòng farm boss vào Tấn Chức)
  const _tdB = m.def.bossKind === 'tranai' ? 8 : (m.def.bossKind === 'thuve' ? 3 : (m.type === 'boss' || m.def.boss) ? 5 : m.def.elite ? 1 : 0);
  if (_tdB){ player.tienDan += _tdB; logCombat(`+${_tdB} ◈ Tiến Cấp Đan`, '#7ec850'); }
  // Võ Học Phổ: Bí Kíp rơi từ tinh anh/boss — học võ học giang hồ (bấm K)
  const _bkR = m.def.bossKind === 'tranai' ? 0.35 : (m.def.bossKind === 'thuve' || m.def.boss) ? 0.12 : m.def.elite ? 0.03 : 0;
  if (_bkR && Math.random() < _bkR){ player.bikipVH = (player.bikipVH || 0) + 1; addFloat(m.x, m.y-100, '+1 📜 Sách Kỹ Năng', '#ffb15c', 13); }
  // 💠 Tâm Đắc — nguyên liệu đột phá cảnh giới chiêu thức: tinh anh 30%×1 · boss 1-2 · Boss Vùng/Cổng Vực 2-3
  const _tdR = m.def.bossKind ? (2 + Math.floor(Math.random() * 2)) : (m.def.boss || m.type === 'boss') ? (1 + Math.floor(Math.random() * 2)) : (m.def.elite && Math.random() < 0.3) ? 1 : 0;
  if (_tdR){ player.tamdac = (player.tamdac || 0) + _tdR; addFloat(m.x, m.y-112, `+${_tdR} 💠 Tâm Đắc`, '#7df9ff', 13); }
  // Nội Đan yêu thú theo hành — tinh anh 30%, boss 100%
  if (m.def.el && (m.def.boss || (m.def.elite && Math.random() < 0.3))){
    player.noidan[m.def.el] = (player.noidan[m.def.el] || 0) + 1;
    addFloat(m.x, m.y-88, `+1 ● Nội Đan ${elName(m.def.el)}`, elColor(m.def.el), 12);
    dailyTrack('noidan'); // Mục Tiêu Hôm Nay
  }
  // ── Drop v2.0: bảng rơi theo nguồn — quái thường chỉ fodder, đồ tốt từ tinh anh/boss ──
  // Boss Săn (huntBoss) không rơi theo đường này — phần thưởng Rương do grantHuntBox() cấp riêng
  const _dsrc = m.def.huntBoss ? null : m.def.bossKind === 'tranai' ? 'tranai' : (m.def.boss || m.def.bossKind) ? 'thuve' : (m.def.elite ? 'elite' : 'mob');
  const _tbl = _dsrc && DROP_SRC[_dsrc];
  let _gotThan = false;
  const _dn = _dsrc ? mobDropCount(m.def, _dsrc) : 0;
  const _dr = _dsrc ? mobDropRate(m.def, _dsrc) : 0;
  for (let _di = 0; _dsrc && _di < _dn; _di++){
    if (Math.random() >= _dr + (player.dropBonus || 0)) continue;
    const it = genItem(Math.max(1, m.def.lv + (Math.random()<0.3?1:0)), 0, _dsrc);
    // Pity đai: Vệ Binh Trụ 8 lần liên tiếp không ra Thần+ → bảo đảm 1 món Thần
    if (_dsrc === 'thuve' && m.def.bossKind === 'thuve' && (player.bossPity || 0) >= 8 && it.rarity < 3){
      it.rarity = 3; rerollItemRarity(it);
      addFloat(m.x, m.y-110, '☘ VẬN MAY TÍCH LŨY — bảo đảm Thần phẩm!', '#7fd8e0', 13);
    }
    if (it.rarity >= 3) _gotThan = true;
    // Tự động bán đồ Phàm đổi lấy bạc (bật trong Túi Đồ)
    // Khắc Ấn có thể rơi trên món độ hiếm thấp (genItem roll ngẫu nhiên) — bán tự động
    // món đó là xoá vĩnh viễn thứ hiếm nhất game vì vài đồng bạc.
    if (player.autoSell && it.rarity <= 0 && !it.sigil){
      const v = 20 + it.rarity*30 + (it.tier||1)*15;
      player.silver += v;
      addFloat(m.x, m.y-54, `Tự bán ${it.name} +${v}◈`, '#9aa8d4', 11);
    }
    else dropToGround({ k:'item', it }, m.x, m.y); // nằm dưới đất, đi ngang qua hoặc bấm J là nhặt
  }
  if (_dsrc) rollJewels(m.def, _dsrc, m.x, m.y);
  if (m.def.bossKind === 'thuve') player.bossPity = _gotThan ? 0 : (player.bossPity || 0) + 1;
  // Vật liệu Drop v2.0: Mảnh Trang Bị (quái 8%, tinh anh 100%)
  if (!m.def.boss && !m.def.bossKind && Math.random() < (m.def.elite ? 1 : 0.08)){
    player.mats.manh++;
    // Đo thật 300 con: 229 chữ bay là vật liệu vụn, chỉ 29 là tên trang bị — mà chữ trang bị
    // còn NHỎ HƠN và NHẠT HƠN. Vật liệu về nhật ký, sân khấu để lại cho đồ và ngọc.
    logCombat('+1 ❖ Mảnh Trang Bị', '#7ec8d8');
  }
  // Tịch Ma Thạch từ Vệ Binh Trụ (vé Tấn Phẩm) · Ấn Cổng Vực (Chinh Phạt ngày) + Mảnh Cổ Thần từ Cổng Vực
  if (m.def.bossKind === 'thuve'){
    const _tm = 1 + (Math.random() < 0.5 ? 1 : 0);
    player.mats.tichMa += _tm;
    addFloat(m.x, m.y-92, `+${_tm} ◆ Tịch Ma Thạch`, '#e84a6a', 13);
  }
  if (m.def.bossKind === 'tranai'){
    player.mats.manhCoThan += 2;
    addFloat(m.x, m.y-92, '+2 ◈ Mảnh Cổ Thần', '#7ecbff', 13);
    const _today = new Date().toDateString();
    if (!player.chinhPhat || player.chinhPhat.date !== _today) player.chinhPhat = { date:_today, count:0 };
    if (player.chinhPhat.count < 1){
      player.chinhPhat.count++;
      player.mats.anTranAi++;
      addFloat(m.x, m.y-106, '☬ ẤN TRẤN ẢI — Chinh Phạt hoàn thành (1/ngày)!', '#ffb15c', 15);
    }
  }
  // quests
  const q = QUESTS[questIdx];
  if (q && questState==='active'){
    if (q.type==='kill' && q.mob===m.type) questProg++;
    if (q.type==='tpkill' && q.mob===m.type && source==='tp') questProg++;
    if (q.type==='boss' && m.type==='boss') questProg++;
    if (questProg >= q.need && (q.type==='kill'||q.type==='tpkill'||q.type==='boss')){
      questState = 'done';
      if (q.type==='boss'){ victory = true; showVictory(); }
      else addFloat(player.x, player.y-46, `Nhiệm vụ hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13);
    }
  }
  sideOnKill(m.type, source);
  if (m.def.boss) AudioSys.playBgm(BGM_TRACKS[curMap]); // hạ boss — trở lại nhạc map
  // Boss: Tàn Quyển bí kíp Huyết Ma Thôn Phệ (Thượng 40% / Trung 40% / Hạ 20%)
  if (m.def.boss && player.bikip && !player.bikip.hmtp){
    const roll = Math.random();
    const piece = roll < 0.4 ? 0 : roll < 0.8 ? 1 : 2;
    player.bikip.pieces[piece]++;
    addFloat(m.x, m.y-90, `Mảnh Cổ Thư · ${TAN_QUYEN[piece]}!`, '#e84a6a', 14);
  }
  // Tứ Châu (Track HT): boss 41% rơi châu, tinh anh 3% Chúc Phúc
  if (m.def.boss && player.jewels){
    const jr = Math.random();
    let jk = null;
    if (jr < 0.20) jk = 'chucPhuc'; else if (jr < 0.32) jk = 'linhHon';
    else if (jr < 0.38) jk = 'sinhMenh'; else if (jr < 0.41) jk = 'honDon';
    if (jk) dropToGround({ k:'jewel', jk }, m.x, m.y);
  } else if (m.def.elite && player.jewels && Math.random() < 0.03){
    dropToGround({ k:'jewel', jk:'chucPhuc' }, m.x, m.y);
  }
  // Ma Tôn Giáng Thế: hạ boss nhận Bảo Hạp theo vùng cấp
  if (m.type === 'maton') matonKilled(m);
  if (m.def && m.def.goldBox) goldenKilled(m);
  if (m.type === 'rift') riftKilled(m);
  // Truy Nã Lệnh: mục tiêu ngày bị hạ
  if (m.truyna && player.truyna && player.truyna.state === 'hunting'){
    player.truyna.state = 'killed';
    zoneBanner = { text:'⚖ TRUY NÃ HOÀN THÀNH', sub:'Mục tiêu đã phục pháp — về Lunaris City gặp Bổ Đầu nhận Công Huân Lệnh!', color:'#e8b04a', t:5 };
    AudioSys.sfx('quest', 0.85); saveGame();
  }
  // ── Boss Vùng/Cổng Vực: mở ải + manh mối + cờ cốt truyện (GDD Boss v2.1 / Ngũ Trụ Khóa) ──
  if (m.def.bossKind){
    const _bk = (player.bossKills[curMap] = player.bossKills[curMap] || []);
    if (!_bk.includes(m.def.bossId)) _bk.push(m.def.bossId);
    const _bd = BOSS_DEFS[curMap];
    if (_bd){
      const doneTv = _bd.thuve.filter(tv => _bk.includes(tv.id)).length;
      if (m.def.bossKind === 'thuve'){
        zoneBanner = { text:`⚔ THỦ VỆ BỊ HẠ — TRẬN NHÃN ${doneTv}/3`,
          sub: doneTv >= 3 ? '☬ Cổng Vực đã mở! Cổng Vực chờ ở góc đông nam bản đồ.' : 'Hạ nốt Vệ Binh Trụ còn lại để mở Cổng Vực.',
          color:'#c07fe0', t:3.5 };
        AudioSys.sfx('quest', 0.8);
      } else {
        zoneBanner = { text:`☬ TRẤN ẢI ${m.def.name.toUpperCase()} ĐÃ BỊ ĐÁNH BẠI!`,
          sub:'Phong ấn nguyên tố vùng này tạm được giữ vững — phần thưởng Chinh Phạt đã trao.', color:'#ffb15c', t:4.5 };
        AudioSys.sfx('levelup', 0.9);
        player.storyFlags['ta_' + curMap] = true;
        if (curMap === 'nhanmon' && !player.storyFlags.ketMo){ player.storyFlags.ketMo = true; setTimeout(showKetMo, 1400); }
      }
    }
    const clueId = CLUE_DROPS[m.def.bossId];
    if (clueId && !player.clues.includes(clueId)){
      player.clues.push(clueId);
      addFloat(m.x, m.y-120, `📜 Manh mối: ${CLUES[clueId].name}`, '#e8dcb0', 13);
      AudioSys.sfx('quest', 0.6);
    }
    saveGame();
  }
  checkTitles();
}
function gainXp(amount){
  if (player.level >= MAX_LV) return;
  if (isNightGame()) amount *= 1.1; // Lịch Tu Tiên: tu luyện ban đêm +10% EXP
  player.xp += Math.round(amount * 1.5 * (1 + (player.expPct || 0)/100)); // EXP ×1.5 (đẩy nhịp farm) · Pet: +EXP% · QA F6: XP luôn nguyên
  while (player.level < MAX_LV && player.xp >= XP_TABLE[player.level-1]){
    player.xp -= XP_TABLE[player.level-1];
    player.level++; player.free += 5;
    AudioSys.sfx('levelup', 0.9);
    calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    addFloat(player.x, player.y-52, `THĂNG CẤP ${player.level}!`, '#ffd76a', 20);
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:'#ffd76a' });
    unlockNotices();
    saveGame(); // QA F6: autosave ngay khi thăng cấp — tránh mất tiến trình
  }
  if (player.level >= MAX_LV) player.xp = 0;
}
function unlockNotices(){
  // QA bot playtest: NV đang khóa cấp (vd. Bình Cảnh Chi Chiến cần cấp 10) — mở lại khi thăng cấp đủ
  const cq0 = currentQuest();
  if (cq0 && questState === 'locked' && player.level >= cq0.lv){
    questState = 'active';
    if (cq0.type === 'boss') spawnBoss();
    addFloat(player.x, player.y-64, `Đủ sức đột phá! Nhiệm vụ mở: ${cq0.name}`, '#ffd76a', 15);
    AudioSys.sfx('quest', 0.8);
  }
  // Mở khóa theo tầng — mỗi cấp chỉ giới thiệu 1-2 hệ thống để tân thủ không bị ngợp
  const msgs = {
    2:['Mở khóa: Tấn Chức (phím 1)'],
    3:['Mở khóa: Mục Tiêu Hôm Nay — xem góc trái màn hình, xong hết nhận thưởng lớn!'],
    4:['Mở khóa: Ám Khí (phím 2)','Mở khóa: Tấn Chức Ám Khí (phím H)'],
    5:['Mở khóa: Rèn Luyện (phím F)'],
    6:['Mở khóa: Thú Chiến — chiến thú đồng hành tự đánh quái (C → Thú Chiến)'],
    7:['Mở khóa: Tuyệt kỹ (phím 3)'],
    10:['Mở khóa: the Calling — 5 lớp chờ ngươi chọn!','Mở khóa: Cương Khí (Tấn Chức — phím H)','Mở khóa: Truy Nã Lệnh & Sảnh Cầu May — Bổ Đầu và Thương Nhân Vận May ở Lunaris City'],
    15:['Mở khóa: Linh Thú — mua Phong Linh Phù ở Vũ Khí Phường, đánh tinh anh còn <40% máu rồi bấm T'],
    40:['Mở khóa: Lò Bảo Chứng luyện Linh Dực Cấp 1 — Lò Rèn Hoàng Gia, Lunaris City'],
    45:['Bảo Hạp IV trở lên từ Hung Thần có 5-8% mở ra trang bị CỔ THẦN THỦ HỘ — Hung Thần giáng thế mỗi 4 giờ!'],
    30:['Mở khóa: Cung Tiễn (Tấn Chức — phím H)','Mở khóa: Động Phủ — gặp Quản Gia ở Lunaris City'],
  };
  const list = msgs[player.level];
  if (list) list.forEach((m, i)=> setTimeout(()=>{ if (player) addFloat(player.x, player.y-70, m, '#a0ffe9', 14); }, i*700));
  // Tán Nhân đạt cấp 10 → mở lễ Bái Sư một lần (sau đó tự chọn ở panel Nhân Vật)
  if (player.level >= 10 && player.sect === 'vophai' && !player.sectOffered){
    player.sectOffered = true;
    setTimeout(()=>{ try{ openSectCeremony(); }catch { /* best-effort — bỏ qua nếu lỗi */ } }, 1800);
  }
  vhAutoLearn(); // Võ Học Phổ: võ học môn phái tự ngộ khi đạt cấp
  checkTitles();
}

// ---------- Danh hiệu: tự động mở khóa khi đạt điều kiện ----------
function checkTitles(){
  if (!player || !player.titles) return;
  let changed = false;
  for (const t of TITLES){
    if (player.titles.unlocked.includes(t.id)) continue;
    let ok = false;
    try { ok = t.cond(player); } catch { ok = false; }
    if (ok){
      player.titles.unlocked.push(t.id);
      if (!player.titles.equipped) player.titles.equipped = t.id;
      changed = true;
      addFloat(player.x, player.y-92, `★ DANH HIỆU: ${t.name}!`, t.color, 16);
      addEffect({ type:'ring', x:player.x, y:player.y, r:80, color:t.color, big:true });
    }
  }
  if (changed){ calcDerived(); saveGame(); }
}

function nearestMob(range){
  let best = null, bd = range;
  for (const m of mobs){
    if (m.dead) continue;
    if (m.def.duHiep && !player.pk && !m.revenge) continue; // Du Hiệp chỉ đánh được khi bật PK (trừ kẻ truy thù)
    const d = dist(player.x, player.y, m.x, m.y);
    if (d < bd){ bd = d; best = m; }
  }
  return best;
}
// Vệt kiếm khí — màu theo lớp/nguyên tố của chiêu (mặc định thép trắng).
// ═══ HIỆU ỨNG THEO HOA VĂN VŨ KHÍ ═══
// Kiếm điện chém ra tia xanh, kiếm băng ra mảnh băng. THUẦN HÌNH ẢNH — cơ chế chiến đấu là
// việc của Khắc Ấn; cho vũ khí làm cả hai thì hai hệ giẫm chân nhau và người chơi không biết
// sát thương lan ra là do kiếm hay do dấu ấn.
const MOTIF_FX = {
  set:   { col:'#8fe0ff', glow:'#dffaff', hit:'zap'   },
  bang:  { col:'#bfe8ff', glow:'#eaf8ff', hit:'frost' },
  lua:   { col:'#ff8a2a', glow:'#ffd08a', hit:'ember' },
  runes: { col:'#c8a8ff', glow:'#e8dcff', hit:'rune'  },
  mach:  { col:'#c8a8ff', glow:'#f0e6ff', hit:'rune'  },
  gai:   { col:'#ff6a5a', glow:'#ffc0a8', hit:'shard' },
};
// Hoa văn của vũ khí ĐANG MẶC. Trả null khi tay không hoặc vũ khí trơn.
function weaponFx(){
  const d = itemDef(player && player.equip && player.equip.vukhi);
  return (d && MOTIF_FX[d.motif]) || null;
}
// Nổ tại điểm chạm — mỗi hoa văn một dáng, đọc ra ngay cả khi tắt tiếng.
function motifBurst(x, y, ang){
  const F = weaponFx();
  if (!F) return;
  if (F.hit === 'zap'){                       // tia điện gãy khúc bắn ra hai bên
    for (let i = 0; i < 3; i++){
      const a = ang + rnd(-1.1, 1.1);
      addEffect({ type:'ink', x, y, vx:Math.cos(a)*rnd(90,170), vy:Math.sin(a)*rnd(90,170)-40, color:F.col });
    }
    addEffect({ type:'ring', x, y, r:26, color:F.col });
  } else if (F.hit === 'frost'){              // mảnh băng rơi xuống
    for (let i = 0; i < 5; i++)
      addEffect({ type:'ink', x:x+rnd(-14,14), y:y+rnd(-10,6), vx:rnd(-40,40), vy:rnd(-70,-20), color:F.col });
    addEffect({ type:'ring', x, y, r:22, color:F.glow });
  } else if (F.hit === 'ember'){               // tàn lửa bốc lên
    for (let i = 0; i < 5; i++)
      addEffect({ type:'ink', x:x+rnd(-10,10), y:y+rnd(-6,6), vx:rnd(-45,45), vy:rnd(-110,-45), color:F.col });
  } else if (F.hit === 'rune'){                // vòng ký tự loé rồi tắt
    addEffect({ type:'ring', x, y, r:30, color:F.col });
    addEffect({ type:'ring', x, y, r:16, color:F.glow });
  } else {                                     // mảnh vỡ văng theo hướng chém
    for (let i = 0; i < 4; i++){
      const a = ang + rnd(-0.5, 0.5);
      addEffect({ type:'ink', x, y, vx:Math.cos(a)*rnd(120,200), vy:Math.sin(a)*rnd(120,200)-30, color:F.col });
    }
  }
}
function spawnSlash(x, y, face, s, color, glow){
  addEffect({ type:'slash', x, y, face, s: s || 110, color, glow });
}
// P0: Hồ Lô Thuốc — hồi 40% max HP, cooldown 20s (phím R)
function usePotion(){
  if (!player || dead) return;
  if (player.potions <= 0){ addFloat(player.x, player.y-40, 'Hết Hồ Lô Thuốc — mua ở Thương Nhân!', '#8a8a8a', 12); AudioSys.sfx('ui', 0.4); return; }
  if (player.potionCd > 0){ addFloat(player.x, player.y-40, `Thuốc còn hồi ${Math.ceil(player.potionCd)}s`, '#8a8a8a', 11); return; }
  if (player.hp >= player.maxHp){ addFloat(player.x, player.y-40, 'Máu đã đầy!', '#8a8a8a', 11); return; }
  player.potions--; player.potionCd = 20;
  const heal = Math.round(player.maxHp * (player.potionPct || 0.4));
  player.hp = Math.min(player.maxHp, player.hp + heal);
  addFloat(player.x, player.y-40, `+${heal}`, '#6ae88a', 16);
  addEffect({ type:'ring', x:player.x, y:player.y, r:46, color:'#6ae88a' });
  for (let i=0;i<5;i++) addEffect({ type:'ink', x:player.x, y:player.y-10, vx:rnd(-40,40), vy:rnd(-70,-20), color:'#6ae88a' });
  AudioSys.sfx('quest', 0.5);
  playStatusFx('heal', 'heal', player.x, player.y, 0.5, 0.34); // sourced heal SFX+VFX layered on top of the existing quest chime & procedural ring/ink burst above
  saveGame();
}
function doBasic(){
  if (!player || dead) return;
  // Phím Space gán chiêu: ưu tiên tung chiêu — đang hồi/thiếu nội lực thì tự quay về đòn thường
  if (player.spaceSkill && canCastSilent(player.spaceSkill)){ castSkill(player.spaceSkill); return; }
  if (player.cd.basic > 0) return;
  const sect = SECTS[player.sect] || SECTS.vophai;
  const rng = sect.range || 90;
  const ranged = rng > 200; // Dark Wizard/Sylvan Ranger: đòn thường bắn đạn tầm xa (đánh xa kiểu vây), phái khác vung cận chiến như trước
  const t = nearestMob(rng);
  if (t) player.face = Math.atan2(t.y-player.y, t.x-player.x);
  player.cd.basic = player.aspd; player.atkAnim = 0.22;
  player.atkAct = heroActOf(player.sect, 'basic'); // tư thế vung khớp vũ khí của lớp
  const _basicCls = SECT_SFX[player.sect];
  AudioSys.sfx(_basicCls ? 'slash_' + _basicCls : 'slash', 0.55);
  if (ranged){
    addEffect({ type:'arc', x:player.x, y:player.y, face:player.face, r:40, color:sect.color });
  } else {
    addEffect({ type:'arc', x:player.x, y:player.y, face:player.face, r:60, color:'#2b2620' });
    // Vệt chém mang màu HOA VĂN của vũ khí, không phải màu phái — đây là chỗ người chơi thấy
    // "kiếm điện" khác "kiếm băng" rõ nhất, vì nó lặp lại mỗi đòn.
    const _wf = weaponFx();
    spawnSlash(player.x + Math.cos(player.face)*36, player.y + Math.sin(player.face)*36 - 12,
               player.face, 95, _wf ? _wf.col : sect.color, _wf ? _wf.glow : sect.glow);
  }
  if (t){
    if (ranged){
      const ang = Math.atan2(t.y-player.y, t.x-player.x);
      const _wp = weaponFx();
      projectiles.push({ x:player.x, y:player.y-10, ang, speed:520, dmg:player.atk*rnd(0.9,1.12), kind:'basic', life:0.9, color:_wp ? _wp.col : sect.color, style:sect.basicProj || 'orb' });
    } else {
      // Hẹn sát thương tới KHUNG TIẾP XÚC thay vì nổ ngay khung đầu. hSwing() đẩy khoảnh khắc
      // lưỡi thật sự chạm ra p≈0.41, nên bắn âm thanh/khựng hình/sát thương ở p=0 là lệch ~8
      // khung — tay còn chưa nhấc lên mà quái đã trúng đòn.
      // Mục tiêu có thể chết hoặc chạy khỏi tầm trong 0,09s đó ⇒ tìm lại lúc chạm (whiff).
      player.pendingHit = { t: 0.09, dmg: player.atk * rnd(0.9,1.12), reach: rng * 1.15 };
    }
    // Cung Tiễn: đòn đánh thường có tỉ lệ phóng linh tiễn theo sau (phụ kiện thú cưỡi — mọi phái)
    const bowT = BOW_TIERS[(player.bow && player.bow.tier) || 0];
    if (bowT && !t.dead && Math.random()*100 < bowT.proc){
      const arrows = (bowT.double && Math.random() < bowT.double) ? 2 : 1;
      for (let i = 0; i < arrows; i++){
        const ang = Math.atan2(t.y-player.y, t.x-player.x) + rnd(-0.09, 0.09);
        projectiles.push({ x:player.x, y:player.y-12, ang, speed:520, dmg:player.atk*bowT.pdmg, kind:'bow', life:0.9, color:bowT.color });
      }
      addEffect({ type:'arc', x:player.x, y:player.y, face:player.face, r:30, color:bowT.color });
    }
  }
}
// ---------- Quests / NPC ----------
function currentQuest(){ return questIdx < QUESTS.length ? QUESTS[questIdx] : null; }

// ---------- GDD Đợt 2 B3: Nhắc Việc Bấm Ngay ----------
function anyPanelOpen(){
  return ['panel-char','panel-inv','panel-bag','panel-skill','panel-map','panel-quest','panel-settings','panel-qlog','panel-vstat','panel-stage']
    .some(id => { const e2 = document.getElementById(id); return e2 && !e2.classList.contains('hidden'); });
}
function hintCandidates(){
  const out = [];
  if ((player.free || 0) >= 10)
    out.push({ id:'tiemnang', pri:2, txt:`💠 Còn <b>${player.free}</b> điểm Tiềm Năng chưa phân — cộng ngay cho khỏi phí!`, btn:'Phân Ngay', act:"togglePanel('char')" });
  if (player.mount.tier === 0 && player.level >= 6)
    out.push({ id:'mount0', pri:3, txt:'🐎 Cấp 10+ đã có thể nhận <b>Emberhide Bull</b> tại Trại Ngựa (Ngoại Ô) — đi bộ mãi làm gì!', btn:'Xem Ngay', act:'hintGoStable()' });
  else {
    const nx = MOUNT_TIERS[player.mount.tier + 1];
    if (nx && nx.cost && player.level >= (nx.reqLv || 1) && player.silver >= nx.cost.silver && player.mat >= Math.max(0, nx.cost.mat - Math.min(player.maThau || 0, 3)*4))
      out.push({ id:'mountup', pri:4, txt:`🐎 Đủ tư lương thăng giai thú cưỡi → <b style="color:${nx.color}">${nx.name}</b>!`, btn:'Thăng Giai', act:"togglePanel('mount')" });
  }
  if (questIdx >= 4 && player.mat >= 3){
    const weak = Object.values(player.equip).some(it => it && !it.special && (it.plus || 0) < 3);
    if (weak) out.push({ id:'forge', pri:5, txt:'⚒ Đang dư Huyền Thiết mà trang bị chưa +3 — đi rèn ngay!', btn:'Đi Rèn', act:'hintGoForge()' });
  }
  // QA rà soát: Lò Hỗn Loạn không được tutorial/hint nào nhắc tới — người chơi mới có thể không
  // bao giờ tự tìm ra. Thêm gợi ý đúng lúc điều kiện chín muồi.
  if (player.level >= 15){
    const _rTally = {};
    for (const it of player.inv) if (it && !it.noForge && it.rarity != null && it.rarity < 4) _rTally[it.rarity] = (_rTally[it.rarity] || 0) + 1;
    if (Object.values(_rTally).some(n => n >= 3))
      out.push({ id:'chaosmachine', pri:6, txt:'◑ Đang dư ít nhất 3 món cùng phẩm — ném vào Lò Hỗn Loạn (Lò Rèn Hoàng Gia) để thử lên phẩm cao hơn!', btn:'Đi Xem', act:'hintGoForge()' });
  }
  return out;
}
window.hintGoStable = function(){
  const n = NPCS.find(x => x.id === 'traichu');
  if (n){ player.beacon = { map:n.map, x:n.x, y:n.y, label:'Trại Ngựa' }; if (n.map !== curMap) travelTo(n.map); }
  hintHide();
};
window.hintGoForge = function(){
  const n = NPCS.find(x => x.talk === 'forge');
  if (n){ player.beacon = { map:n.map, x:n.x, y:n.y, label:'Lò Rèn Hoàng Gia' }; if (n.map !== curMap) travelTo(n.map); }
  hintHide();
};
window.hintHide = function(){ const t = el('hint-toast'); if (t) t.classList.add('hidden'); window._hintId = null; };
window.hintDismiss = function(id){ player.hintOff[id] = true; hintHide(); saveGame(); };
function updateHints(dt){
  window._hintT = (window._hintT || 0) - dt;
  if (window._hintT > 0) return;
  window._hintT = 1.2; // quét 1.2s/lần — khỏi tốn hiệu năng
  const t = el('hint-toast'); if (!t) return;
  if (player && !player.hintCd) player.hintCd = {};   // defense-in-depth: newPlayer() and loadGame() both set these now, but guard here too
  if (player && !player.hintOff) player.hintOff = {}; // so any future field added to only one path degrades gracefully instead of crashing

  if (DGN || !player || dead || player.combatT > 0 || anyPanelOpen()){
    if (!t.classList.contains('hidden')) t.classList.add('hidden');
    return;
  }
  const now = performance.now();
  const c = hintCandidates()
    .filter(x => !player.hintOff[x.id] && (!player.hintCd[x.id] || now - player.hintCd[x.id] > 300000))
    .sort((a, b) => a.pri - b.pri)[0];
  if (!c){ if (!t.classList.contains('hidden')){ t.classList.add('hidden'); window._hintId = null; } return; }
  if (window._hintId !== c.id){
    window._hintId = c.id;
    player.hintCd[c.id] = now;
    t.innerHTML = `<div style="display:flex;gap:8px;align-items:flex-start"><span style="flex:1">${c.txt}</span><span style="cursor:pointer;opacity:.7;flex:none" onclick="hintDismiss('${c.id}')">✕</span></div>
      <button class="hint-btn" onclick="${c.act};hintHide()">${c.btn}</button>`;
    t.classList.remove('hidden');
  }
}


// ---------- GDD Đợt 2 B2: đích đến nhiệm vụ + ghim dẫn đường ----------
function questTarget(q){
  if (!q) return null;
  const npcId = q.targetNpc || q.npc;
  if (q.type === 'talk' || questState === 'done'){
    const n = NPCS.find(x => x.id === npcId);
    if (n) return { map:n.map, x:n.x, y:n.y, label:'Gặp ' + n.name, npcId:n.id };
  }
  if (q.type === 'meditate' && typeof SPRING !== 'undefined') return { map:'daohoa', x:SPRING.x, y:SPRING.y, label:'Tịnh Tâm Tuyền' };
  if (q.type === 'enhance'){ const n = NPCS.find(x => x.talk === 'forge'); if (n) return { map:n.map, x:n.x, y:n.y, label:'Lò Rèn Hoàng Gia', npcId:n.id }; }
  if (q.type === 'collect' && typeof HERB_SPOTS !== 'undefined'){
    // herbMap riêng, không dùng q.map — q.map trên vài NV chính (VD #12) là nơi trả NV (NPC ở
    // Lunaris City), khác với nơi thật sự hái Thảo Dược.
    const hm = q.herbMap || 'daohoa';
    const hs = HERB_SPOTS[hm];
    if (hs) return { map:hm, x:hs[0].x, y:hs[0].y, label:'Bãi Thảo Dược' };
  }
  if (q.type === 'boss' && typeof BOSS_ARENA !== 'undefined') return { map:'daohoa', x:BOSS_ARENA.x, y:BOSS_ARENA.y, label:'Đài Bình Cảnh' };
  if (q.mob){
    let best = null;
    for (const id in MAPS){
      const md = MAPS[id];
      if (md.dungeon || !md.packs) continue;
      const pk = md.packs.find(p => p.mob === q.mob);
      if (pk && (!best || id === q.map)){ best = { map:id, x:pk.x, y:pk.y }; if (id === q.map) break; }
    }
    if (best){
      const mdef = (typeof MOBS !== 'undefined') && MOBS[q.mob];
      best.label = 'Săn ' + (mdef ? mdef.name : q.mob);
      return best;
    }
  }
  if (npcId){ const n = NPCS.find(x => x.id === npcId); if (n) return { map:n.map, x:n.x, y:n.y, label:'Gặp ' + n.name, npcId:n.id }; }
  return null;
}
function sideQuestTarget(sq){
  const st = sideStates[sq.id];
  const n = NPCS.find(x => x.id === sq.npc);
  // CHÚ Ý: trước đây có thêm điều kiện "|| !sq.mob" ở đây khiến MỌI nhiệm vụ phụ loại
  // collect/catch (không có field .mob) luôn bị đưa về NPC dù đang active — không bao giờ
  // chạy tới nhánh HERB_SPOTS/HORSE_ZONES bên dưới được. Bỏ điều kiện đó để nhiệm vụ đang
  // active rơi đúng xuống nhánh vị trí thật của nó (thảo dược/ngựa/quái); NPC chỉ còn là nơi
  // đến khi chưa nhận hoặc đã xong nhiệm vụ.
  if (!st || st.st === 'done' || st.st === 'claimed'){
    if (n) return { map:n.map, x:n.x, y:n.y, label:(st && st.st === 'done' ? 'Trả NV: ' : 'Nhận NV: ') + (n ? n.name : ''), npcId:n.id };
  }
  if (sq.type === 'catch'){
    const hz = (typeof HORSE_ZONES !== 'undefined') && HORSE_ZONES[sq.map];
    if (hz) return { map:sq.map, x:hz[0].x, y:hz[0].y, label:'Đồng Tuấn Mã' };
  }
  if (sq.type === 'collect' && typeof HERB_SPOTS !== 'undefined'){
    const hs = HERB_SPOTS[sq.map];
    if (hs) return { map:sq.map, x:hs[0].x, y:hs[0].y, label:'Bãi Thảo Dược' };
  }
  if (sq.mob){
    const md = MAPS[sq.map];
    const pk = md && md.packs ? md.packs.find(p => p.mob === sq.mob) : null;
    if (pk){
      const mdef = (typeof MOBS !== 'undefined') && MOBS[sq.mob];
      return { map:sq.map, x:pk.x, y:pk.y, label:'Săn ' + (mdef ? mdef.name : sq.mob) };
    }
  }
  if (n) return { map:n.map, x:n.x, y:n.y, label:'Gặp ' + n.name, npcId:n.id };
  return null;
}
// Đi thẳng tới đèn hiệu đang ghim (player.beacon) — dùng bởi nút "Đi ngay" trên banner khác
// vùng (xem drawQuestCompass()). Khác với goQuest(): không phụ thuộc nhiệm vụ chính hiện tại,
// đi theo đúng cái đang ghim (có thể là nhiệm vụ phụ người chơi tự chọn qua goQuestSide()).
window.goToBeacon = function(){
  const b = player && player.beacon;
  if (!b) return;
  closePanels();
  if (b.map !== curMap) travelTo(b.map);
  else {
    if (b.npcId) npcTalkTarget = b.npcId; // đích là NPC: tới nơi tự mở lời thoại luôn, không cần bấm E
    setMoveTarget(b.x, b.y); addFloat(player.x, player.y - 56, '🧭 Đã ghim: ' + b.label + ' — khinh công tự đưa tới!', '#8fd18f', 13);
  }
};
window.goQuest = function(){
  const t = questTarget(currentQuest());
  if (!t){ addFloat(player.x, player.y - 40, 'Chưa rõ đích đến — đọc kỹ mô tả nhiệm vụ nhé!', '#f0a03a', 12); return; }
  player.beacon = { map:t.map, x:t.x, y:t.y, label:t.label, npcId:t.npcId };
  closePanels();
  if (t.map !== curMap) travelTo(t.map);
  else {
    if (t.npcId) npcTalkTarget = t.npcId;
    setMoveTarget(t.x, t.y); addFloat(player.x, player.y - 56, '🧭 Đã ghim: ' + t.label + ' — khinh công tự đưa tới!', '#8fd18f', 13);
  }
  saveGame();
};
window.goQuestSide = function(id){
  const sq = SIDE_QUESTS.find(x => x.id === id);
  const t = sq && sideQuestTarget(sq);
  if (!t){ addFloat(player.x, player.y - 40, 'Chưa rõ đích đến!', '#f0a03a', 12); return; }
  player.beacon = { map:t.map, x:t.x, y:t.y, label:t.label, npcId:t.npcId };
  closePanels();
  if (t.map !== curMap) travelTo(t.map);
  else {
    if (t.npcId) npcTalkTarget = t.npcId;
    setMoveTarget(t.x, t.y); addFloat(player.x, player.y - 56, '🧭 Đã ghim: ' + t.label + ' — khinh công tự đưa tới!', '#7fd4ff', 13);
  }
  saveGame();
};
function drawBeacon(){
  const b = player && player.beacon;
  if (!b || b.map !== curMap) return;
  const t = performance.now()/300;
  const pulse = 1 + Math.sin(t)*0.15;
  ctx.save();
  const grd = ctx.createLinearGradient(b.x, b.y - 220, b.x, b.y);
  grd.addColorStop(0, 'rgba(126,203,255,0)');
  grd.addColorStop(1, 'rgba(126,203,255,.45)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(b.x - 15*pulse, b.y); ctx.lineTo(b.x - 4, b.y - 220);
  ctx.lineTo(b.x + 4, b.y - 220); ctx.lineTo(b.x + 15*pulse, b.y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(126,203,255,.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, 26*pulse, 9*pulse, 0, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#7ecbff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🚩 ' + b.label, b.x, b.y - 230);
  ctx.restore();
}
// Mũi tên định hướng (screen space) — chỉ hiện khi đèn hiệu (player.beacon) đang ở ngoài khung hình,
// hoặc khi đích ở map khác (không có hướng để trỏ, chỉ nhắc mở Bản Đồ). Gọi sau ctx.restore() của
// render() — vẽ ở tọa độ màn hình, không phải tọa độ thế giới như drawBeacon().
function drawQuestCompass(){
  const banner = el('quest-compass-banner');
  const b = player && player.beacon;
  // Đích ở map khác: dùng banner HTML (bấm được) thay vì vẽ canvas thuần chữ — người chơi
  // không cần biết phím M, bấm "Đi ngay" là dịch chuyển thẳng tới (giống nút "Tới Ngay" ở
  // quest tracker, xem goToBeacon()).
  if (banner && (!b || b.map === curMap)) banner.classList.add('hidden');
  if (!b) return;
  if (b.map !== curMap){
    if (banner){
      const key = b.map + '|' + b.label;
      if (window._compassBannerKey !== key){
        window._compassBannerKey = key;
        const destName = (MAPS[b.map] && MAPS[b.map].name) || '';
        banner.innerHTML = `<span>🗺 ${b.label}${destName ? ' · ' + destName : ''}</span><button onclick="goToBeacon()">Đi ngay</button>`;
      }
      banner.classList.remove('hidden');
    }
    return;
  }
  const px = player.x - camera.x, py = player.y - camera.y;
  const bx = b.x - camera.x, by = b.y - camera.y;
  const pad = 46;
  if (bx > -pad && bx < W+pad && by > -pad && by < H+pad) return; // đã thấy cột sáng trên màn hình, khỏi cần mũi tên
  const ang = Math.atan2(by - py, bx - px);
  const cx = W/2, cy = H/2; // dùng tâm màn hình để mũi tên ổn định, không giật khi camera bị kẹp ở biên bản đồ
  const dx = Math.cos(ang), dy = Math.sin(ang);
  // lề né vùng HUD che khuất: trên (thanh máu/tiền/AUTO), phải (minimap), dưới (thanh kỹ năng) —
  // rộng hơn nhiều so với lề trái vốn thoáng
  const mTop = 110, mRight = 230, mBottom = 130, mLeft = 60;
  const extLeft = cx - mLeft, extRight = (W - mRight) - cx;
  const extTop = cy - mTop, extBottom = (H - mBottom) - cy;
  const t = Math.min(dx > 0 ? extRight/dx : (dx < 0 ? extLeft/-dx : Infinity),
                      dy > 0 ? extBottom/dy : (dy < 0 ? extTop/-dy : Infinity));
  const ax = cx + dx*t, ay = cy + dy*t;
  ctx.save();
  ctx.translate(ax, ay); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(20,25,40,.7)'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(126,203,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#7ecbff';
  ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
  const dist = Math.round(Math.hypot(bx-px, by-py)/10);
  const lx = ax - dx*24, ly = ay - dy*24; // nhãn khoảng cách đặt lùi vào trong (hướng tâm màn hình) để không bị cắt ở mép
  ctx.save();
  ctx.fillStyle = '#7ecbff'; ctx.font = 'bold 11px "Baloo 2","Be Vietnam Pro",sans-serif'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
  ctx.strokeText(dist + 'm', lx, ly);
  ctx.fillText(dist + 'm', lx, ly);
  ctx.restore();
}
function drawBeaconArrow(){
  const b = player && player.beacon;
  if (!b || b.map !== curMap || !camera) return;
  const sx = b.x - camera.x, sy = b.y - camera.y;
  if (sx > 40 && sx < W - 40 && sy > 40 && sy < H - 40) return; // đã thấy trên màn hình
  const ang = Math.atan2(sy - H/2, sx - W/2);
  const ex = clamp(sx, 50, W - 50), ey = clamp(sy, 70, H - 60);
  const d = Math.round(dist(player.x, player.y, b.x, b.y));
  ctx.save();
  ctx.translate(ex, ey); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(126,203,255,.95)';
  ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#7ecbff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(d + ' bước', ex, ey - 16);
}
// Click-to-move: đường preview chấm chấm từ vị trí hiện tại tới đích — tính lại mỗi frame bằng
// simulateMovePath nên luôn khớp chính xác với đường nhân vật thật sự đi (né đúng vật cản đó).
function drawMoveTargetPath(){
  if (!moveTarget || !player || dead) return;
  const path = simulateMovePath(player.x, player.y, moveTarget.x, moveTarget.y);
  ctx.save();
  ctx.strokeStyle = 'rgba(159,216,255,.7)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 7]);
  ctx.lineDashOffset = -(performance.now()/40 % 15); // chạy dọc đường cho sinh động
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
  const pulse = 15 + Math.sin(performance.now()/220)*3;
  ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(moveTarget.x, moveTarget.y, pulse, pulse*0.45, 0, 0, 7); ctx.stroke();
  ctx.restore();
}

// ---------- GDD Đợt 2 B5: Trại Ngựa — Tuấn Mã Hoang & Mã Thầu ----------
const HORSE_ZONES = {
  ngoai:  [{ x:900, y:950 }, { x:1500, y:620 }, { x:800, y:1400 }],
  mongco: [{ x:900, y:500 }, { x:1600, y:1350 }],
};
let horses = [];
function spawnHorses(){
  horses = [];
  const zones = HORSE_ZONES[curMap];
  if (!zones || DGN) return;
  for (const z of zones){
    for (let k = 0; k < 2; k++){
      const p = nearestFree(curMap, z.x + (k ? 70 : -35), z.y + (k ? 50 : -25));
      horses.push({ x:p.x, y:p.y, hx:p.x, hy:p.y, state:'graze', t:Math.random()*3, face:Math.random()*6.28 });
    }
  }
}
window.tryCatchHorse = function(){
  if (!horses.length || DGN) return false;
  const g = gameTimeInfo(), tk = g.day + '/' + g.month;
  if (!player.horseDay || player.horseDay.d !== tk) player.horseDay = { d:tk, n:0 };
  let best = null, bd = 70;
  for (const h of horses){
    if (h.state !== 'tired') continue;
    const d = dist(player.x, player.y, h.x, h.y);
    if (d < bd){ bd = d; best = h; }
  }
  if (!best) return false;
  if (player.horseDay.n >= 5){
    addFloat(player.x, player.y - 46, 'Hôm nay đã bắt đủ 5 Tuấn Mã — ngựa cũng cần nghỉ!', '#f0a03a', 13);
    return true;
  }
  player.horseDay.n++;
  player.maThau = (player.maThau || 0) + 1;
  addFloat(best.x, best.y - 30, '🪢 +1 Mã Thầu!', '#7fd8e0', 15);
  addFloat(player.x, player.y - 52, `Bắt được Tuấn Mã! (${player.horseDay.n}/5 hôm nay) — Mã Thầu: +7% tỉ lệ hoặc −4✦ khi thăng giai thú`, '#8fd18f', 13);
  AudioSys.sfx('quest', 0.7);
  sideOnEvent('catch');
  horses.splice(horses.indexOf(best), 1);
  saveGame();
  return true;
};
function updateHorses(dt){
  if (!horses.length) { window._horseRespawnT = 0; }
  for (const h of horses){
    const d = dist(player.x, player.y, h.x, h.y);
    if (h.state === 'graze'){
      h.t -= dt;
      if (h.t <= 0){ h.t = 2 + Math.random()*3; h.face = Math.random()*6.28; }
      h.x += Math.cos(h.face)*8*dt; h.y += Math.sin(h.face)*8*dt;
      if (dist(h.x, h.y, h.hx, h.hy) > 120){ const a = Math.atan2(h.hy - h.y, h.hx - h.x); h.x += Math.cos(a)*24*dt; h.y += Math.sin(a)*24*dt; }
      if (d < 150){ h.state = 'flee'; h.t = 3; h.face = Math.atan2(h.y - player.y, h.x - player.x); }
    } else if (h.state === 'flee'){
      h.t -= dt;
      if (d < 260){
        const want = Math.atan2(h.y - player.y, h.x - player.x);
        let da = want - h.face;
        while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
        h.face += clamp(da, -2.6*dt, 2.6*dt);
        h.x += Math.cos(h.face)*170*dt; h.y += Math.sin(h.face)*170*dt;
      } else {
        h.x += Math.cos(h.face)*40*dt; h.y += Math.sin(h.face)*40*dt;
      }
      if (h.t <= 0){ h.state = 'tired'; h.t = 2.5; } // kiệt sức 2.5s — cửa sổ bắt
    } else if (h.state === 'tired'){
      h.t -= dt;
      if (h.t <= 0){ h.state = 'graze'; h.t = 2; }
    }
    h.x = clamp(h.x, 40, MAP.w - 40); h.y = clamp(h.y, 40, MAP.h - 40);
    collideObstacles(h, 12);
  }
  const zones = HORSE_ZONES[curMap];
  if (zones && !DGN && horses.length < zones.length*2){
    window._horseRespawnT = (window._horseRespawnT || 0) + dt;
    if (window._horseRespawnT > 90){ // 90s hồi một con
      window._horseRespawnT = 0;
      const z = zones[Math.floor(Math.random()*zones.length)];
      const p = nearestFree(curMap, z.x, z.y);
      horses.push({ x:p.x, y:p.y, hx:p.x, hy:p.y, state:'graze', t:2, face:0 });
    }
  }
}
function drawHorse(h){
  const img = MOUNT_IMGS[1]; // Tuấn Mã Hoang dùng tạm hình thú cưỡi giai 1 (mượn ảnh, không liên quan tên gọi)
  const bob = Math.sin(performance.now()/300 + h.hx)*2;
  ctx.save(); ctx.translate(h.x, h.y + bob);
  if (h.state === 'tired') ctx.globalAlpha = 0.75 + Math.sin(performance.now()/150)*0.2;
  if (img && img.complete && img.naturalWidth){
    const hh = 52, hw = hh * (img.naturalWidth/img.naturalHeight);
    ctx.drawImage(img, -hw/2, -hh + 8, hw, hh);
  } else {
    ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.ellipse(0, -14, 16, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8a6a48'; ctx.fillRect(-3, -32, 7, 12);
  }
  ctx.restore();
  if (h.state === 'tired'){
    ctx.fillStyle = '#7fd8e0'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🪢 Bấm E để bắt!', h.x, h.y - 48);
  } else if (h.state === 'flee'){
    ctx.fillStyle = '#f0a03a'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('💨', h.x, h.y - 46);
  }
}
window.renderStable = function(){
  const p = el('panel-quest');
  const nx = MOUNT_TIERS[player.mount.tier + 1];
  const g = gameTimeInfo(), tk = g.day + '/' + g.month;
  const caught = player.horseDay && player.horseDay.d === tk ? player.horseDay.n : 0;
  let html = `<h3>Trại Ngựa — Mục Đồng</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">"Tuấn mã hoang chạy ngoài đồng kia — lại gần nó sẽ vùng chạy, rượt đến khi <b style="color:#7fd8e0">kiệt sức</b> rồi bấm <b>E</b> mà bắt. Mỗi con cho một cuộn <b style="color:#7fd8e0">Mã Thầu</b>: khi thăng giai thú cưỡi, dùng <b>+7% tỉ lệ</b> hoặc <b>−4✦ phí</b> mỗi cuộn (tối đa 3 cuộn/lần). Ngày chỉ bắt 5 con thôi — ngựa cũng cần nghỉ!"</div>`;
  html += `<div class="mat-row"><span style="width:20px;text-align:center">🪢</span><span style="flex:1">Mã Thầu đang có</span><b style="color:#7fd8e0">${player.maThau || 0}</b></div>`;
  html += `<div class="mat-row"><span style="width:20px;text-align:center">🐎</span><span style="flex:1">Tuấn Mã đã bắt hôm nay</span><b>${caught}/5</b></div>`;
  html += `<div class="stat-sec">THÚ CƯỠI: ${MOUNT_TIERS[player.mount.tier].name} (Giai ${player.mount.tier})${nx ? ` — kế tiếp: <b style="color:${nx.color}">${nx.name}</b> · cần cấp ${nx.reqLv} · ${nx.cost.silver}◈ + ${nx.cost.mat}✦ · tỉ lệ ${nx.rate}%` : ' — TỐI THƯỢNG'}</div>`;
  html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:7px 16px" onclick="closePanels();togglePanel('mount')">Mở Trại Thú Cưỡi</button></div>`;
  html += `<div style="font-size:11.5px;opacity:.65;margin-top:8px">Tuấn Mã Hoang ở ba đồng cỏ Outskirts (và Ashen Steppe — phụ tuyến «Tuấn Mã Ashen Steppe» cấp 80).</div>`;
  p.innerHTML = html;
  closePanels(); p.classList.remove('hidden');
};


window.fuseBikip = function(){
  const pcs = player.bikip.pieces;
  if (player.bikip.hmtp || !(pcs[0]>0 && pcs[1]>0 && pcs[2]>0)) return;
  const msg = document.getElementById('bikip-msg');
  if (Math.random() < 0.3){
    pcs[0]--; pcs[1]--; pcs[2]--;
    player.bikip.hmtp = true;
    player.vohoc['fs_huyetma'] = true; // thần công tàn quyển — học thẳng chiêu chủ động, dùng ngay
    calcDerived();
    if (msg){ msg.textContent = '✔ Dung hợp thành công — HUYẾT MA THÔN PHỆ: hút huyết 10% mỗi đòn (bị động, luôn hiệu lực)!'; msg.style.color = '#e84a6a'; }
    addFloat(player.x, player.y-52, '☠ HUYẾT MA THÔN PHỆ — hút huyết 10%!', '#e84a6a', 17);
    addFloat(player.x, player.y-74, '《Huyết Ma Thôn Phệ》đã nhập thể — bị động, không cần gán!', '#ff8a8a', 15);
    addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:'#e84a6a', big:true });
    for (let i=0;i<12;i++) addEffect({ type:'ink', x:player.x, y:player.y, vx:rnd(-80,80), vy:rnd(-100,-20), color:'#e84a6a' });
    saveGame();
  } else {
    if (msg){ msg.textContent = '✘ Dung hợp thất bại — kinh mạch chấn động, tàn quyển vẫn còn.'; msg.style.color = '#ff7a6a'; }
    addFloat(player.x, player.y-40, 'Dung hợp thất bại (30%)', '#ff7a6a', 13);
  }
  setTimeout(()=>{ try{ tryTalk(); }catch { /* best-effort — bỏ qua nếu lỗi */ } }, 900);
};
// bulletproof close: delegated handler works even if a panel re-rendered mid-session
document.addEventListener('click', e=>{
  if (e.target && e.target.classList && e.target.classList.contains('close-x')) closePanels();
});

// ---------- Update ----------
let _zoneAliveCache = null; // per-frame memo for zoneAliveCount(), reset every update() tick
function update(dt){
  if (!player) return;
  _zoneAliveCache = null;
  _gtiCache = null; // gameTimeInfo() per-frame memo — reset once per tick, see its own comment
  if (hitStop > 0){ hitStop -= dt; dt *= 0.08; } // hit-stop: thế giới khựng lại 1 nhịp khi chém trúng — đòn có lực
  // cooldowns
  for (const k in player.cd) player.cd[k] = Math.max(0, player.cd[k] - dt);
  player.comboT = Math.max(0, (player.comboT || 0) - dt); // chuỗi combo — ám khí trúng lúc này mở Liên Trảm
  player.ltT = Math.max(0, (player.ltT || 0) - dt);       // cửa sổ Liên Trảm 2.5s
  player.atkAnim = Math.max(0, player.atkAnim - dt);
  player.castT = Math.max(0, (player.castT || 0) - dt);
  player.hurtT = Math.max(0, (player.hurtT || 0) - dt);
  shakeT = Math.max(0, shakeT - dt);
  player.battuCd = Math.max(0, (player.battuCd || 0) - dt);
  if ((player.buffAtkT || 0) > 0){ // Rượu Hổ Cốt hết men
    player.buffAtkT -= dt;
    if (player.buffAtkT <= 0){
      player.buffAtkT = 0; calcDerived();
      if (!dead) addFloat(player.x, player.y-46, 'Hết men Rượu Hổ Cốt…', '#8a8a8a', 12);
    }
  }
  if ((player.loidonT || 0) > 0){ // Lôi Độn Phù hết hiệu lực
    player.loidonT -= dt;
    if (player.loidonT <= 0){
      player.loidonT = 0;
      if (!dead) addFloat(player.x, player.y-46, 'Lôi Độn Phù đã tan…', '#8a8a8a', 12);
    }
  }
  player.khi = (player.khi || 0) + 3*dt*tulinhMult(); // Instinct tích lũy thụ động · Tụ Linh Trận tăng thêm
  tickGameClock(dt); // Lịch Tu Tiên: thời gian thế giới trôi theo thời gian thật
  if (dead) return;

  collideObstacles(player, 14); collideAiPass(); // GDD Đợt 2 A: đứng yên cũng bị đẩy ra khỏi vùng cấm/ải (save cũ/dịch chuyển)
  if (inObstacle(curMap, player.x, player.y, 12)){ const _nf = nearestFree(curMap, player.x, player.y); player.x = _nf.x; player.y = _nf.y; } // hiếm gặp: vùng cấm tràn mép map, đẩy mãi không ra
  if (player.beacon && player.beacon.map === curMap && dist(player.x, player.y, player.beacon.x, player.beacon.y) < 60){ // B2: đến nơi → tắt đèn
    addFloat(player.x, player.y - 60, '🚩 Đã đến: ' + player.beacon.label, '#8fd18f', 14);
    player.beacon = null; saveGame();
  }
  // Đã bấm vào NPC (hoặc đèn hiệu trỏ tới NPC) và đang tự đi tới — tới nơi thì tự mở lời thoại,
  // không cần bấm E riêng. Dùng chung tryTalk() nên mọi loại NPC (nhiệm vụ/rèn/chợ...) đều đúng.
  if (npcTalkTarget){
    const _tn = NPCS.find(x => x.id === npcTalkTarget);
    if (!_tn || _tn.map !== curMap) npcTalkTarget = null;
    else if (dist(player.x, player.y, _tn.x, _tn.y) < 90){ npcTalkTarget = null; moveTarget = null; tryTalk(); }
  }

  // movement — GDD Quan Sát: bỏ hẳn di chuyển tay (WASD/joystick). Người chơi chỉ CHỌN đích
  // (bấm phải trên nền đất / bấm minimap / đèn hiệu nhiệm vụ) rồi khinh công tự động chạy tới,
  // né vật cản dọc đường — đây là cách di chuyển DUY NHẤT còn lại, không ghi đè khi đang Auto Farm
  // (auto tự dẫn đường riêng tới quái, xem dưới)
  let mx = 0, my = 0;
  if (moveTarget && !player.auto){
    const _mtd = dist(player.x, player.y, moveTarget.x, moveTarget.y);
    if (_mtd < 18) { moveTarget = null; moveWaypoint = null; }
    else {
      // Đi theo waypoint gần (né vật cản), không lao thẳng đường chim bay — đường thẳng dễ kẹt góc
      // tường (WASD đã bỏ, không còn cách đi tay để tự gỡ kẹt). Tính lại định kỳ bằng thuật toán né
      // vật cản có sẵn của simulateMovePath() thay vì viết riêng logic "kẹt" mới.
      moveWaypointT -= dt;
      if (moveWaypointT <= 0 || !moveWaypoint){
        const path = simulateMovePath(player.x, player.y, moveTarget.x, moveTarget.y);
        moveWaypoint = path[Math.min(3, path.length - 1)];
        moveWaypointT = 0.35;
      }
      const _wd = dist(player.x, player.y, moveWaypoint.x, moveWaypoint.y);
      if (_wd < 6){ mx = (moveTarget.x - player.x)/_mtd; my = (moveTarget.y - player.y)/_mtd; }
      else { mx = (moveWaypoint.x - player.x)/_wd; my = (moveWaypoint.y - player.y)/_wd; }
      player.face = Math.atan2(my, mx);
      // khinh công tự động: tàn ảnh nhẹ trong lúc tự chạy tới đích — không cần bấm phím nào
      if (!SETTINGS.lowFx && Math.random() < dt*10) addEffect({ type:'ring', x:player.x, y:player.y+4, r:12, color:'#bfe8ff' });
      // Lưới an toàn: vật cản lớn (tường thành, cụm nhà...) đôi khi vượt quá khả năng né cục bộ ở trên
      // (phải vòng xa tìm cổng chứ không né tại chỗ được) — không còn WASD để tự gỡ kẹt nữa, nên nếu
      // nhiều giây liền không tiến gần hơn thì huỷ đích, báo người chơi thử điểm khác thay vì kẹt mãi.
      moveProgressT += dt;
      if (moveProgressT > 2.6){   // 1,3s là quá gắt sau khi cây/đá chặn thật — né cục bộ cần thêm nhịp
        if (_mtd > moveProgressD - 24){
          // Kẹt lần đầu thì ĐỪNG bỏ cuộc ngay: né cục bộ hay chui vào túi giữa mấy gốc cây, chỉ
          // cần vứt waypoint cũ và tính lại từ vị trí mới là thoát. Đo được: bỏ cuộc ngay làm
          // 1/3 số lần bấm đi xa bị huỷ giữa đường sau khi cây bắt đầu chặn thật.
          player._moveRetry = (player._moveRetry || 0) + 1;
          if (player._moveRetry >= 3){
            addFloat(player.x, player.y-40, 'Không tìm được đường tới đó — hãy thử bấm điểm gần hơn!', '#ff9a6a', 12);
            moveTarget = null; moveWaypoint = null; npcTalkTarget = null; player._moveRetry = 0;
          } else {
            moveWaypoint = null; moveWaypointT = 0;   // ép tính lại đường ngay khung sau
          }
        } else player._moveRetry = 0;
        moveProgressT = 0; moveProgressD = _mtd;
      }
    }
  } else { moveProgressT = 0; moveProgressD = Infinity; }
  // AUTO FARM (phím Z): tự đuổi theo & đánh quái gần nhất — treo máy
  // auto luôn loại Du Hiệp trung lập kể cả khi player.pk đang bật (chỉ tự vệ nếu bị truy thù)
  // nên auto không bao giờ tự gây PK oan — đánh tay Du Hiệp vẫn dùng player.pk như cũ
  // GDD Boss v2.1: vào vùng boss (400px) auto tạm dừng — trận boss phải đánh tay
  // QA: Quỷ Vương/Thiên Sứ/Boss Săn trước đây chỉ ép tắt AUTO ĐÚNG 1 LẦN lúc boss xuất hiện —
  // bấm Z lại (quen tay) là auto đứng hứng trọn chiêu AoE không né. Khoá liên tục suốt pha boss.
  if (player.auto && autoBossLockActive()){
    player.auto = false; updateAutoBtn();
    addFloat(player.x, player.y-70, 'Boss này phải tự tay chiến — AUTO đã khoá!', '#ff9a5a', 13);
  }
  const _ac = player.autoCfg || { skill:true, potion:true, potionPct:40, range:430, boss:false };
  const _bossNear = player.auto && !_ac.boss && mobs.some(b => !b.dead && (b.def.bossKind || b.type === 'boss') && dist(player.x, player.y, b.x, b.y) < 300);
  if (_bossNear){
    player._bossHintT = (player._bossHintT || 0) - dt;
    if (player._bossHintT <= 0){ addFloat(player.x, player.y-64, '⚠ Vùng Boss — auto tạm dừng, hãy tự chiến!', '#ff9a5a', 13); player._bossHintT = 6; }
    // AUTO không tự khơi trận boss, nhưng trước đây đứng im HOÀN TOÀN — không né, không uống
    // thuốc — trong lúc vẫn ăn đòn miễn phí từ boss lẫn bãi quái xung quanh (QA level 1→120 bắt
    // được ca chết oan của nhân vật cấp 1 vừa vào Chọn Trận). Lùi xa khỏi boss + vẫn tự hồi máu.
    const _nb = mobs.find(b => !b.dead && (b.def.bossKind || b.type === 'boss') && dist(player.x, player.y, b.x, b.y) < 300);
    if (_nb){
      const _bdd = dist(player.x, player.y, _nb.x, _nb.y);
      if (_bdd > 0){ mx += (player.x - _nb.x)/_bdd; my += (player.y - _nb.y)/_bdd; }
    }
    if (_ac.potion && player.hp < player.maxHp*(_ac.potionPct/100) && player.potions > 0 && (player.potionCd || 0) <= 0) usePotion();
  }
  if (player.auto && !dead && !_bossNear){
    if (player._autoAX == null){ player._autoAX = player.x; player._autoAY = player.y; }
    // Chỉ quét quanh điểm neo (bán kính 430 ≈ 1-2 bãi quái) — không rượt quái khắp map
    // QA: chỉ farm ĐÚNG 1 bãi quái — khoá vào zone của mục tiêu đầu tiên tìm được (m.zone: cùng
    // tham chiếu cho mọi quái spawn từ 1 bãi/1 đợt), các frame sau chỉ xét quái CÙNG zone đó, dù
    // bãi khác có lọt vào bán kính quét cũng bỏ qua — không còn "lan" farm sang bãi kế bên.
    let _at = null, _bd = _ac.range;
    for (const m of mobs){
      if (m.dead) continue;
      if (!_ac.boss && (m.def.bossKind || m.type === 'boss')) continue; // auto không tự khơi trận boss — trừ khi bật trong Cài Đặt
      // QA: auto không được TỰ khơi PK với Du Hiệp dù player.pk đang bật (khác với đánh tay ở
      // 3153/3513/4551) — nếu không, để quên PK bật rồi auto cày sẽ tích Tội Ác tới Ma Đạo mà
      // người chơi không hề chủ đích PK ai cả. Vẫn cho tự vệ nếu Du Hiệp đã truy thù (m.revenge).
      if (m.def.duHiep && !m.revenge) continue;
      if (player._autoZoneLocked && m.zone !== player._autoZone) continue; // khác bãi — bỏ qua
      const _dd = dist(player._autoAX, player._autoAY, m.x, m.y);
      if (_dd < _bd){ _bd = _dd; _at = m; }
    }
    if (_at && !player._autoZoneLocked){ player._autoZone = _at.zone; player._autoZoneLocked = true; }
    if (_at){
      const _ad = dist(player.x, player.y, _at.x, _at.y);
      player.face = Math.atan2(_at.y - player.y, _at.x - player.x);
      // Dark Wizard/Sylvan Ranger đánh xa: AUTO dừng lại ở rìa tầm bắn thay vì lao vào cận chiến (kiểu vây)
      const _rng0 = (SECTS[player.sect] || SECTS.vophai).range || 90;
      const _stopD = _rng0 > 200 ? _rng0*0.85 : 64;
      if (_ad > _stopD){ mx += (_at.x - player.x)/_ad; my += (_at.y - player.y)/_ad; } // chạy tới bãi quái
      else if (player.cd.basic <= 0) doBasic(); // trong tầm đánh: ra đòn
      // tự tung kỹ năng trên taskbar khi hết hồi chiêu & đủ nội lực (im lặng, không spam thông báo)
      if (_ac.skill && _ad < Math.max(340, _rng0)){
        for (const _sid of player.skillBar){
          if (_sid == null) continue;
          const _inf = skillInfo(_sid);
          if (_inf.unlocked && (player.cd[_sid] || 0) <= 0 && player.qi >= _inf.qi) castSkill(_sid);
        }
      }
    } else {
      // hết quái quanh neo → quay về điểm neo chờ quái hồi sinh (không lang thang khắp map)
      const _hd = dist(player.x, player.y, player._autoAX, player._autoAY);
      if (_hd > 60){ mx += (player._autoAX - player.x)/_hd; my += (player._autoAY - player.y)/_hd; }
    }
    // tự uống Hồ Lô Thuốc khi máu dưới 40% (còn thuốc & hết hồi)
    if (_ac.potion && player.hp < player.maxHp*(_ac.potionPct/100) && player.potions > 0 && (player.potionCd || 0) <= 0) usePotion();
    if (player.potions <= 0 && player.hp < player.maxHp*0.5){
      player._autoWarnT = (player._autoWarnT || 0) - dt;
      if (player._autoWarnT <= 0){ player._autoWarnT = 30; addFloat(player.x, player.y-70, '⚠ Hết thuốc — auto farm không tự hồi máu được!', '#ff9a6a', 12); }
    }
    // QA: chữ nổi cảnh báo rất dễ bị bỏ lỡ nếu người chơi đang không nhìn màn hình (đúng lúc treo
    // AUTO). Máu xuống mức nguy hiểm mà hết thuốc thì tự tắt AUTO hẳn (banner to, khó bỏ lỡ hơn)
    // thay vì cứ để auto tiếp tục lao vào ăn đòn tới chết.
    if (player.potions <= 0 && player.hp < player.maxHp*0.2){
      player.auto = false; updateAutoBtn();
      zoneBanner = { text:'⚠ AUTO ĐÃ TỰ TẮT', sub:'Hết Hồ Lô Thuốc & máu xuống thấp — tắt AUTO để tránh chết oan. Mua thêm thuốc rồi bật lại!', color:'#ff7a6a', t:5 };
      AudioSys.sfx('hurt', 0.5);
    }
  }
  const ml = Math.hypot(mx,my);
  player.moving = ml > 0.01;
  player.walkPh = (player.walkPh || 0) + dt * (player.moving ? 11 : 2.2);
  // ── QUÁN TÍNH PHỤ (secondary motion) ──
  // Trước đây áo choàng đọc thẳng tư thế tức thời nên nó DÍNH vào chân: dừng là dừng ngay,
  // đổi hướng là bật ngay, không có sức nặng. Hai con lò xo dưới đây chạy TRỄ sau chuyển
  // động thật, nên vải/lông/mảnh phép đi thêm một nhịp rồi mới lắng — đúng cảm giác có khối
  // lượng. Chỉ 2 số, tính trong update() một lần, mọi bộ phận cùng đọc.
  {
    const tgt = player.moving ? ml : 0;            // đích: đang chạy hay đứng
    const K = 9.5, D = 5.2;                        // độ cứng · giảm chấn (tinh chỉnh bằng mắt)
    player.sway = player.sway || 0; player.swayV = player.swayV || 0;
    player.swayV += ((tgt - player.sway) * K - player.swayV * D) * dt;
    player.sway += player.swayV * dt;
    // hướng bạt: vải luôn hất về phía NGƯỢC hướng đang đi, và cũng trễ theo
    const fx = player.moving ? -mx / Math.max(1, ml) : 0;
    player.swayDir = (player.swayDir || 0) + (fx - (player.swayDir || 0)) * Math.min(1, dt * 6.5);
  }
  if (ml > 0.01){
    mx /= Math.max(1,ml); my /= Math.max(1,ml);
    let spd = player.speed || 190;
    player.x = clamp(player.x + mx*spd*dt, 20, MAP.w-20);
    player.y = clamp(player.y + my*spd*dt, 20, MAP.h-20);
    collideCityWalls();
    collideObstacles(player, 14); collideAiPass(); // GDD Đợt 2 A: địa hình + ải cấp
    // Cổng Ải (GDD Boss v2.1 §4): vùng Cổng Vực bị phong ấn tới khi hạ đủ 3 Vệ Binh Trụ
    const _bd = BOSS_DEFS[curMap];
    if (_bd){
      const ta = _bd.tranai, ax = ta.x*MAP.w, ay = ta.y*MAP.h;
      const kills = player.bossKills[curMap] || [];
      const unlocked = _bd.thuve.every(tv => kills.includes(tv.id));
      if (!unlocked && dist(player.x, player.y, ax, ay) < 340){
        const ang = Math.atan2(player.y - ay, player.x - ax);
        player.x = ax + Math.cos(ang)*342; player.y = ay + Math.sin(ang)*342;
        player._gateT = (player._gateT || 0) - dt;
        if (player._gateT <= 0){
          const left = _bd.thuve.filter(tv => !kills.includes(tv.id)).length;
          zoneBanner = { text:'⛨ PHONG ẤN NGŨ HÀNH', sub:`Còn ${left}/3 Trụ Khóa chưa phá — hãy hạ các Vệ Binh Trụ canh giữ!`, color:'#c07fe0', t:3 };
          AudioSys.sfx('hurt', 0.4);
          player._gateT = 4;
        }
      }
    }
    player.face = Math.atan2(my,mx);
    // hướng dẫn tân thủ bước 1: di chuyển một đoạn
    if (player.tutStep === 0){
      player.tutDist = (player.tutDist || 0) + spd*dt;
      if (player.tutDist > 150) tutAdvance('move');
    }
  }
  // hướng dẫn bước cuối: tự hoàn thành sau 12s
  if (player.tutStep === 4){
    player.tutTimer = (player.tutTimer || 0) + dt;
    if (player.tutTimer > 12) tutAdvance('quest');
  }
  updateTut();
  updateGate();
  // qi regen + hp regen (P0: hồi máu nhanh hơn — base ×3, ngoài combat thêm 5% max HP/s)
  player.combatT = Math.max(0, (player.combatT || 0) - dt);
  player.potionCd = Math.max(0, (player.potionCd || 0) - dt); // P0: Hồ Lô Thuốc cooldown
  if (player.hp <= 0 && !dead){ player.hp = 0; onDeath(); } // thiên lôi cũng giết được người
  updateKyngo(dt); // A2: Kỳ ngộ trên đường
  if (DGN) updateDungeon(dt); // Phó bản: đợt quái → boss → thưởng
  updatePet(dt); // Linh Thú đồng hành
  updateMount(dt); // Thú Chiến đồng hành
  updateHorses(dt); // GDD Đợt 2 B5
  player.qi = Math.min(player.maxQi, player.qi + (player.qireg + player.maxQi*(player.combatT <= 0 ? 0.01 : 0.0025))*dt); // GDD Đợt 2 B1: +1% maxQi/s ngoài combat, +0.25% trong combat
  const regenHp = player.dVit*0.75 + 3 + (player.combatT <= 0 ? player.maxHp*0.05 : 0);
  player.hp = Math.min(player.maxHp, player.hp + regenHp*dt);

  // Phase C timers: độc (không giết được — tối thiểu 1 HP), buff Cương Khí, Tội Ác decay, banner
  if (player.poisonT > 0){
    player.poisonT -= dt;
    player.hp = Math.max(1, player.hp - (player.poisonDps || 1) * dt);
    if (Math.random() < dt*4) addEffect({ type:'ink', x:player.x+rnd(-14,14), y:player.y-10, vx:0, vy:-30, color:'#7a4a9a' });
  }
  if (player.gkBuffT > 0){
    player.gkBuffT -= dt;
    if (Math.random() < dt*8) addEffect({ type:'ring', x:player.x, y:player.y, r:30, color:'#e8c86a' });
  }
  // Võ Học Phổ: buff timers + Dịch Cân Kinh hồi phục + khiên Thái Cực
  for (const _bk of ['vhDmgT','vhEvaT','vhReflT','vhAspdT','vhCritT','vhLeechT']) if ((player[_bk]||0) > 0) player[_bk] -= dt;
  player.vhReviveCd = Math.max(0, (player.vhReviveCd || 0) - dt);
  if ((player.vhRegen || 0) > 0 && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * player.vhRegen * dt);
  if ((player.vhShield || 0) > 0 && Math.random() < dt*6) addEffect({ type:'ring', x:player.x, y:player.y, r:36, color:'#8ad8c8' });
  if (player.toiac > 0){
    player.toiacT += dt;
    if (player.toiacT >= 300){ player.toiac--; player.toiacT = 0; }
  }
  // Sa Đọa: Tội Ác ≥ 5 → hắc hóa Ma Tu; gột rửa hết tội → trở lại chính đạo
  if (!player.maDao && (player.toiac || 0) >= 5){
    player.maDao = true;
    zoneBanner = { text:'⚫ ĐỌA MA', sub:'Sát niệm xâm tâm — công lực +15% nhưng lôi kiếp sẽ khắc nghiệt hơn!', color:'#c07fe0', t:4 };
    addFloat(player.x, player.y-60, 'Ngươi đã bước vào Ma Đạo…', '#c07fe0', 15);
    AudioSys.sfx('crit', 0.8); saveGame();
  } else if (player.maDao && (player.toiac || 0) <= 0){
    player.maDao = false;
    zoneBanner = { text:'HỒI ĐẦU THỊ NGẠN', sub:'Tội nghiệt đã gột sạch — trở lại chính đạo.', color:'#7ec850', t:3.5 };
    saveGame();
  }
  if (zoneBanner){ zoneBanner.t -= dt; if (zoneBanner.t <= 0) zoneBanner = null; }
  // đai cấp: bước sang đai mới → báo banner (lần đầu vào map chỉ ghi nhận, không bắn banner)
  if (player && !dead){
    const _mdB = mapDef();
    if (_mdB.packs && _mdB.packs.length){
      const _b = bandOfDist(_mdB, player.x, player.y);
      if (curBand !== _b && curBand !== -1)
        zoneBanner = { text:`ĐAI ${BAND_NAMES[_b].toUpperCase()}`, sub:`Quái ${bandLvText(_mdB,_b)} — ${_b===2?'mạnh nhất vùng, cẩn thận!':_b===1?'cấp trung bình':'yếu nhất, hợp luyện công'}`, color:BAND_COLORS[_b], t:2.2 };
      curBand = _b;
    } else curBand = -1;
  }
  updateMaTon(); // Hung Thần Giáng Thế — 0h/4h/8h…
  updateGolden(); // Xâm Lăng Vàng — 2h/6h/10h… (lệch pha để cứ 2 giờ có 1 sự kiện)
  updateRift(); // Chúa Tể Vực Nứt — 0h/6h/12h/18h, 4 lượt/ngày theo giờ thật

  // spirit spring: meditation quest + Anima source (always active)
  const q = currentQuest();
  if (mapDef().spring && dist(player.x,player.y,SPRING.x,SPRING.y) < SPRING.r){
    player.dantian.tuvi += 6*dt*tulinhMult();
    player.khi += 6*dt*tulinhMult(); // Tịnh Tâm Tuyền: Instinct ×3 · Tụ Linh Trận tăng thêm
    if (player.toiac > 0){ // Ngồi Thiền gột rửa Tội Ác
      player.toiac = 0; player.toiacT = 0;
      addFloat(player.x, player.y-52, 'Tịnh Tâm Tuyền gột rửa Tội Ác!', '#3a9d8b', 14);
    }
    if (Math.random() < dt*6) addEffect({ type:'ink', x:player.x+rnd(-20,20), y:player.y, vx:0, vy:-40, color:'#3a9d8b' });
    if (q && q.type==='meditate' && questState==='active'){
      springTimer += dt;
      questProg = Math.min(q.need, springTimer);
      if (questProg >= q.need){
        questState='done';
        addFloat(player.x, player.y-46, `Nhiệm vụ hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13);
      }
    }
  }

  // herbs: chỉ đếm hồi phục — hái giờ phải chủ động nhấn J (tryHarvestHerb()), không tự động
  // khi đi ngang qua nữa (dễ hái nhầm/không rõ ràng lúc chỉ còn tự đi tới bằng click)
  for (const p of pickups) if (p.respawn > 0) p.respawn -= dt;
  updateGroundLoot(dt);

  // mobs AI
  for (const m of mobs){
    if (m.dead) continue;
    m.wob += dt*3; m.hitT = Math.max(0, m.hitT - dt);
    if (m.faceT != null) m.face = lerpAng(m.face, m.faceT, Math.min(1, dt*9)); // xoay người mượt, không giật hướng
    m.lungeT = Math.max(0, (m.lungeT || 0) - dt); // hiệu ứng lao tới khi ra đòn
    // Độc (ám khí) & thiêu đốt (cung tiễn) — sát thương theo thời gian
    if (m.poisonT > 0){
      m.poisonT -= dt; m.hp -= m.poisonDps * dt;
      if (Math.random() < dt*2.5) addEffect({ type:'ink', x:m.x+rnd(-8,8), y:m.y-6, vx:0, vy:-28, color:'#5db86a' });
      if (m.hp <= 0){ killMob(m, 'poison'); continue; }
    }
    if (m.burnT > 0){
      m.burnT -= dt; m.hp -= m.burnDps * dt;
      if (Math.random() < dt*2.5) addEffect({ type:'ink', x:m.x+rnd(-8,8), y:m.y-6, vx:0, vy:-36, color:'#e8552a' });
      if (m.hp <= 0){ killMob(m, 'burn'); continue; }
    }
    if (m.bleedT > 0){ // Hắc Nguyệt Bạch Cốt Trảo: chảy máu
      m.bleedT -= dt; m.hp -= m.bleedDps * dt;
      if (Math.random() < dt*3) addEffect({ type:'ink', x:m.x+rnd(-8,8), y:m.y-6, vx:0, vy:-24, color:'#c03a4a' });
      if (m.hp <= 0){ killMob(m, 'bleed'); continue; }
    }
    m.slowT = Math.max(0, (m.slowT || 0) - dt);
    m.blindT = Math.max(0, (m.blindT || 0) - dt);
    m.stunT = Math.max(0, (m.stunT || 0) - dt);
    m.fearT = Math.max(0, (m.fearT || 0) - dt);
    if (m.stunT > 0) continue; // Phong Mạch: quái đứng hình hoàn toàn
    if (m.shield === 0 && m.def.elite){
      m.shieldT -= dt;
      if (m.shieldT <= 0){ m.shield = 1; addFloat(m.x, m.y-30, 'Hộ thể tái tụ!', '#c07fe0', 11); }
    }
    m.packAlert = Math.max(0, (m.packAlert || 0) - dt);
    // ── Lãnh địa Boss: boss chỉ chiến đấu quanh điểm canh giữ — người chơi TỰ QUYẾT ĐỊNH khi nào bước vào ──
    if (m.type === 'boss' || m.def.bossKind){
      const _hx = m.homeX ?? (m.zone ? m.zone.x : m.x), _hy = m.homeY ?? (m.zone ? m.zone.y : m.y);
      const _leashR = m.def.bossKind ? 470 : 540;
      if (m.leashBack){ // đang quay về post — không đánh, không tụ chiêu
        if (dist(m.x, m.y, _hx, _hy) < 50){
          m.leashBack = false; m.hp = m.maxHp; m.punishT = 0;
          addFloat(m.x, m.y - m.def.size - 26, 'Boss trở về lãnh địa — hồi phục toàn bộ!', '#9aa8d4', 12);
        } else {
          const _ah = Math.atan2(_hy - m.y, _hx - m.x);
          m.x += Math.cos(_ah) * m.def.speed * 1.35 * dt; m.y += Math.sin(_ah) * m.def.speed * 1.35 * dt; m.faceT = _ah;
          collideObstacles(m, 13); // GDD Đợt 2 A
        }
        continue;
      }
      const _dp0 = dist(m.x, m.y, player.x, player.y);
      if (_dp0 > m.def.aggro && m.hp < m.maxHp && !m.leashBack) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.25 * dt); // thoát chiến — hồi phục dần tại post
      // vượt ranh giới lãnh địa HOẶC mất dấu người chơi giữa đường → hủy chiêu, quay về post
      if (dist(m.x, m.y, _hx, _hy) > _leashR || (_dp0 > m.def.aggro && dist(m.x, m.y, _hx, _hy) > 70 && !m.tele)){
        m.leashBack = true; m.tele = null; m.introduced = true;
        addFloat(m.x, m.y - m.def.size - 26, 'Boss quay về lãnh địa!', '#9aa8d4', 12);
        continue;
      }
    }
    // ── Boss Vùng/Cổng Vực: não moveset (GDD Boss v2.1) ──
    if (m.def.bossKind){
      m.punishT = Math.max(0, (m.punishT || 0) - dt);
      if (m.cuongT > 0){ m.cuongT -= dt; if (m.cuongT <= 0 && m.atkMul) m.atkMul = m.atkMul/1.3; }
      const bd0 = dist(m.x, m.y, player.x, player.y);
      if (!m.introduced && bd0 < m.def.aggro){ m.introduced = true; if (typeof bossIntro === 'function') bossIntro(m); }
      if (m.tele){
        m.tele.t -= dt;
        // Phá hết cầu giáp là chú vỡ NGAY. Bắt đứng chờ cho hết 5 giây niệm thì phần thưởng
        // của việc bùng nổ sát thương đúng lúc chẳng còn nghĩa gì.
        if (m.tele.mvId === 'vogiap' && (m.tele.orbs || []).every(o => o.dead)) m.tele.t = 0;
        if (m.tele.t <= 0) bossExecMove(m);
        continue; // đang tụ chiêu — đứng yên, người chơi né
      }
      if (bd0 < m.def.aggro){
        m.moveT -= dt;
        if (m.moveT <= 0 && m.punishT <= 0){
          bossStartTele(m, m.def.moves[m.moveIdx % m.def.moves.length]);
          m.moveIdx++;
          m.moveT = 4.5 + Math.random()*1.5;
        }
      }
    }
    const d = dist(m.x,m.y,player.x,player.y);
    m.atkT -= dt;
    // Du Hiệp trung lập: không bao giờ đánh trước; lang thang quanh bãi
    if (m.def.duHiep && !m.provoked && m.packAlert <= 0){
      m.wanderT = (m.wanderT || 0) - dt;
      if (m.wanderT <= 0){ m.wanderT = rnd(2,5); m.wanderAng = Math.random() < 0.35 ? null : rnd(0, Math.PI*2); }
      if (m.wanderAng != null){
        m.x = clamp(m.x + Math.cos(m.wanderAng)*26*dt, 40, MAP.w-40);
        m.y = clamp(m.y + Math.sin(m.wanderAng)*26*dt, 40, MAP.h-40);
        m.faceT = m.wanderAng;
      }
      continue;
    }
    const aggroR = m.packAlert > 0 ? 9999 : m.def.aggro; // cả cụm truy đuổi
    if ((m.fearT || 0) > 0){ // hoảng sợ: bỏ chạy xa người chơi
      const fa = Math.atan2(m.y-player.y, m.x-player.x);
      m.x = clamp(m.x + Math.cos(fa)*m.def.speed*dt, 40, MAP.w-40);
      m.y = clamp(m.y + Math.sin(fa)*m.def.speed*dt, 40, MAP.h-40);
      m.faceT = fa;
    } else if (d < aggroR && d > m.def.range){
      const ang = Math.atan2(player.y-m.y, player.x-m.x);
      m.faceT = ang;
      const mspd = m.def.speed * (m.slowT > 0 ? (m.slowPct || 0.65) : 1); // chậm: Mai Hoa Châm 35%, võ học theo chiêu
      m.x += Math.cos(ang)*mspd*dt;
      m.y += Math.sin(ang)*mspd*dt;
      collideObstacles(m, 13); // GDD Đợt 2 A
    } else if (d <= m.def.range && m.atkT <= 0){
      m.atkT = m.def.atkCd;
      // hiệu ứng ra đòn: quái lao tới (lunge) + vệt chém màu nguyên tố
      m.lungeT = 0.22;
      const elC = (m.def.el && ELEM[m.def.el]) ? ELEM[m.def.el].color : m.def.color;
      addEffect({ type:'arc', x:m.x, y:m.y, face:Math.atan2(player.y-m.y,player.x-m.x), r:34, color:elC });
      if (m.def.ranged){ // Cung Thủ Thảo Nguyên: đạn bay từ xa (hình), sát thương tính trực tiếp
        projectiles.push({ cosmetic:true, x:m.x, y:m.y, ang:Math.atan2(player.y-m.y,player.x-m.x), speed:420, dmg:0, kind:'mobshot', life:d/420, color:'#d8b060' });
      }
      if (m.blindT > 0 && Math.random() < 0.5){
        addFloat(m.x, m.y-30, 'MÙ LÒA!', '#9aa8d4', 11); // Diệt Hồn Sa — đánh trượt
      } else if (Math.random() < player.eva){
        addFloat(player.x, player.y-28, 'Né!', '#a0ffe9', 13);
      } else {
        let dmg = m.def.atk * rnd(0.85,1.15) * (m.atkMul || 1) * (isNightGame() ? 1.1 : 1) * (1 - player.defRed); // Lịch Tu Tiên: ban đêm quái +10% công
        // QA endgame F3: quái cao hơn 6+ cấp gây thêm sát thương (tối đa +120%) — lạc vào map cao là trả giá
        const lvGapM = (m.def.lv || 1) - player.level;
        if (lvGapM > 5) dmg *= 1 + Math.min(1.2, (lvGapM - 5) * 0.08);
        if (m.def.bossKind){ const gapB2 = m.def.lv - player.level; if (gapB2 > 10) dmg *= 1.6; else if (gapB2 >= 6) dmg *= 1.3; } // Áp Bức Võ Công chiều ngược
        // khắc hệ chiều quái → người: hệ quái khắc phái +12%, bị phái khắc -10%
        const mobEl = m.def.el, sectEl2 = SECTS[player.sect].element;
        let mobCounter = false;
        if (mobEl && sectEl2){
          if (ELEM[mobEl].beats === sectEl2){ dmg *= 1.12; mobCounter = true; }
          else if (ELEM[sectEl2].beats === mobEl) dmg *= 0.9;
        }
        if (player.gkBuffT > 0) dmg *= 0.7; // Cương Khí Hộ Thể (chủ động): giảm 30% ST
        dmg = Math.max(1, Math.round(dmg));
        // ĐỠ ĐÒN — cơ chế chỉ đồ Hoàn Hảo có: chặn HẲN một đòn, không phải giảm %. Đặt SAU khi
        // đã làm tròn để con số hiện lên đúng bằng thứ người chơi vừa chặn được.
        if (player.excBlock && Math.random() < player.excBlock){
          addFloat(player.x, player.y-46, `⛊ ĐỠ! -${dmg}`, '#9fd0ff', 14);
          AudioSys.sfx('ui', 0.5);
          continue;   // hồi chiêu của quái đã đặt ở trên — đặt lại 0 là nó đánh lại NGAY khung sau
        }
        if ((player.vhShield || 0) > 0){ // Thái Cực Kiếm: khiên kiếm khí hấp thụ
          const absorbed = Math.min(player.vhShield, dmg);
          player.vhShield -= absorbed; dmg -= absorbed;
          if (absorbed > 0) addFloat(player.x, player.y-40, `🛡 -${absorbed}`, '#8ad8c8', 12);
        }
        player.hp -= dmg;
        // đòn đánh trúng: vụ nổ hào quang nguyên tố + rung màn hình
        const elC2 = (mobEl && ELEM[mobEl]) ? ELEM[mobEl].color : '#ff7a6a';
        addEffect({ type:'ring', x:player.x, y:player.y-10, r:22, color:elC2 });
        for (let i=0;i<4;i++) addEffect({ type:'ink', x:player.x, y:player.y-12, vx:rnd(-70,70), vy:rnd(-90,-20), color:elC2 });
        player.hurtT = 0.25; // viền đỏ nhấp khi trúng đòn
        player.combatT = 4; // P0: vào trạng thái combat — ngừng hồi máu nhanh
        shakeT = Math.max(shakeT, 0.16);
        // Math.max, không phải gán đè: một cú cào nhẹ từng có thể HẠ biên độ của cú vừa nện.
        shakeMag = Math.max(shakeMag, Math.min(6, 2 + 30*dmg/Math.max(1,player.maxHp)));
        // Hướng rung: ĐẨY NGƯỜI CHƠI RA XA con vừa nện mình. Trước đây chỉ swingFeel() ghi
        // shakeDir, nên lúc ăn đòn màn hình vẫn giật về phía mình vừa đánh — sai hẳn hướng.
        shakeDir = Math.atan2(player.y - m.y, player.x - m.x);
        // Tình Hoa Độc Yêu: đánh trúng gây độc — Cương Khí (tuyệt học) kháng độc
        if (m.def.poisonHit){
          const _freshPoison = player.poisonT <= 0; // cue only on the moment poison first lands, not every re-tick
          const gkT = (player.gangkhi && player.gangkhi.tier) || 0;
          player.poisonT = 3;
          player.poisonDps = Math.max(1, Math.round(player.maxHp * 0.008 * (1 - Math.min(0.8, gkT*0.12)) * (1 - (player.vhPoisonRes || 0))));
          if (_freshPoison) playStatusFx('poison', 'poison_apply', player.x, player.y, 0.5, 0.3);
        }
        AudioSys.sfx('hurt', 0.7);
        logCombat(`🩸 ${mobCounter ? 'KHẮC CHẾ ' : ''}-${dmg} ← ${m.def.name}`, mobCounter ? '#ff9a3a' : '#ff7a6a');
        // Thái Cực hộ thể (Lưỡng Nghi Cảnh): phản 5% sát thương
        if (player.reflect && !m.dead){
          const ref = Math.max(1, Math.round(dmg * player.reflect));
          m.hp -= ref; m.hitT = 0.15;
          logCombat(`🛡 phản ${ref} → ${m.def.name}`, '#ffd76a');
          if (m.hp <= 0){ killMob(m, 'reflect'); continue; }
        }
        if (player.hp <= 0){
          // Hỗn Nguyên Bất Tử (Ascension cảnh 8): chặn 1 đòn chí mạng, hồi 30% HP
          if (player.batTu && player.battuCd <= 0){
            player.battuCd = 180;
            player.hp = Math.round(player.maxHp * 0.3);
            addFloat(player.x, player.y-58, 'BẤT TỬ — Hỗn Nguyên hộ thể!', '#7ecbff', 18);
            addEffect({ type:'ring', x:player.x, y:player.y, r:130, color:'#7ecbff', big:true });
            for (let i=0;i<16;i++) addEffect({ type:'ink', x:player.x, y:player.y, vx:rnd(-100,100), vy:rnd(-130,-30), color:'#7ecbff' });
          } else { if (m.def.bossKind) player._killedByBoss = m.def.name; player.hp = 0; onDeath(); }
        }
      }
    } else if (d >= aggroR && m.type !== 'boss' && !m.def.bossKind && m.homeX != null){
      // Lang thang nhẹ quanh tổ khi người chơi ở xa — đỡ cảm giác "đứng như tượng" tới khi bị aggro
      m.wanderT = (m.wanderT || 0) - dt;
      if (m.wanderT <= 0){ m.wanderT = rnd(2.5, 5); m.wanderAng = Math.random() < 0.4 ? null : rnd(0, Math.PI*2); }
      if (m.wanderAng != null){
        const nx = m.x + Math.cos(m.wanderAng)*22*dt, ny = m.y + Math.sin(m.wanderAng)*22*dt;
        if (dist(nx, ny, m.homeX, m.homeY) < 90){ m.x = nx; m.y = ny; m.faceT = m.wanderAng; collideObstacles(m, 13); }
        else m.wanderAng = null; // chạm biên tổ — đứng lại, đợi hướng mới thay vì lết theo biên
      }
    }
    // gentle zone leash
    if (m.zone && m.type!=='boss'){
      const dz = dist(m.x,m.y,m.zone.x,m.zone.y);
      if (dz > m.zone.r + 200 && d > m.def.aggro){
        const ang = Math.atan2(m.zone.y-m.y, m.zone.x-m.x);
        m.x += Math.cos(ang)*m.def.speed*dt; m.y += Math.sin(ang)*m.def.speed*dt;
        collideObstacles(m, 13); // GDD Đợt 2 A
      }
    }
  }
  // respawn dead mobs
  for (const m of mobs){
    if (!m.dead) continue;
    // Boss Vùng/Cổng Vực hồi lại sau 60s tại đúng vị trí canh giữ — chỉ áp dụng mob có m.zone thật
    // (Boss Săn phó bản dùng chung bossKind để thừa hưởng não moveset/lãnh địa nhưng zone=null,
    // chết là chết hẳn — không có _bdRef nên gọi spawnZoneBoss sẽ crash nếu thiếu chặn m.zone này)
    if (m.def && m.def.bossKind && m.zone){
      if (m.respawnT <= 0){ m.gone = true; spawnZoneBoss(m.def._bdRef, m.def.bossKind); }
      else m.respawnT -= dt;
      continue;
    }
    if (m.type === 'boss'){ // Sát Thủ trở lại sau 60s — farm tàn quyển Huyết Ma Thôn Phệ
      if (m.respawnT <= 0){ m.respawnT = 60; addFloat(m.x, m.y-40, 'Sát Thủ sẽ trở lại sau 60s...', '#ff7a6a', 12); }
      else {
        m.respawnT -= dt;
        if (m.respawnT <= 0){ m.gone = true; spawnBoss(); }
      }
      continue;
    }
    m.respawnT -= dt;
    if (m.respawnT <= 0 && m.zone){
      if (zoneAliveCount(m.zone) < m.zone.count){ spawnMob(m.type, m.zone, undefined, true); m.gone = true; }
      else m.respawnT = 3;
    }
  }
  for (const m of mobs){ if (m.dead && m.deadT > 0) m.deadT -= dt; }
  compactInPlace(mobs, m => !m.dead || m.deadT > 0 || (m.type !== 'boss' && !m.gone));

  // Đòn thường đã hẹn: nổ đúng lúc lưỡi chạm (xem doBasic). Tìm lại mục tiêu ở thời điểm này
  // — nếu con cũ đã chết hoặc đã chạy xa thì đòn HỤT, đúng như Diablo xử lý whiff.
  if (player.pendingHit){
    player.pendingHit.t -= dt;
    if (player.pendingHit.t <= 0){
      const ph = player.pendingHit; player.pendingHit = null;
      const tgt = nearestMob(ph.reach);
      if (tgt){
        let dmg = ph.dmg, src = 'hit';
        if (Math.random() < player.crit){ dmg *= (player.critDmgMult || 2); src = 'crit'; }
        hurtMob(tgt, dmg, src);
      }
    }
  }
  sigilTick(dt);   // Khắc Ấn: việc hẹn giờ (sóng 2, mưa tên) + vùng đất còn hiệu lực (vũng độc)

  // projectiles
  for (const p of projectiles){
    p.life -= dt;
    p.x += Math.cos(p.ang)*p.speed*dt;
    p.y += Math.sin(p.ang)*p.speed*dt;
    if (p.cosmetic) continue; // đạn hình ảnh của quái tầm xa — ST đã tính
    for (const m of mobs){
      if (m.dead || p.hit && p.hit.has(m)) continue;
      if (m.def.duHiep && !player.pk && !m.revenge) continue; // đạn xuyên qua Du Hiệp khi chưa bật PK (trừ kẻ truy thù)
      if (dist(p.x,p.y,m.x,m.y) < m.def.size + 8){
        let dmg = p.dmg * rnd(0.9,1.1);
        let src = p.kind==='amkhi' ? 'amkhi' : 'hit';
        // QA: trước đây hard-code ×2 nên mọi %ST Bạo Kích từ Vận/bộ Cổ Thần (player.critDmgMult) bị
        // bỏ qua với MỌI đòn bắn ra — Sylvan Ranger/Dark Wizard (đòn thường + chiêu chính đều là proj)
        // gần như toàn bộ sát thương không ăn chỉ số này, khiến đầu tư Vận thành bẫy với 2 lớp đó.
        if (src==='hit' && Math.random() < player.crit){ dmg *= (player.critDmgMult || 2); src='crit'; }
        // Khắc Ấn: dựng lại ngữ cảnh từ chính viên đạn — đạn chiêu chính bay tới đây rất lâu sau
        // khi castSkill() kết thúc, nên không thể trông vào cờ toàn cục. Đạn do Khắc Ấn đẻ ra
        // (sigilSplit) mang tag rỗng để Tách Tiễn không tự tách mãi.
        _sigilTag = p.sigilSplit ? null : (p.tag || null);
        hurtMob(m, dmg, src);
        _sigilTag = null;
        // Sourced per-class projectile-impact SFX — the generic "this ranged attack landed" moment,
        // shared by every player-fired projectile kind (skill/amkhi/bow/danchi) that reaches this loop.
        if (!m.dead){
          const _projHitCls = SECT_SFX[player.sect];
          if (_projHitCls) AudioSys.sfx('projhit_' + _projHitCls, 0.4);
        }
        // Võ Học Phổ: hiệu ứng trúng đích của chiêu projectile (Niêm Hoa Chỉ, Đoạt Mệnh Phù, Độc Cô…)
        if (p.vhfx && !m.dead){
          const _vf = p.vhfx;
          if (_vf.stun){ m.stunT = Math.max(m.stunT || 0, _vf.stun * (m.def.bossKind ? 0.4 : 1)); addFloat(m.x, m.y-m.def.size-22, 'CHOÁNG!', '#ffe9a8', 11); playStatusFx('stunned', 'stunned', m.x, m.y, 0.5, 0.3); }
          if (_vf.poison){ m.poisonT = _vf.poison.t; m.poisonDps = Math.max(1, Math.round(player.atk * 0.3)); addFloat(m.x, m.y-m.def.size-22, 'SINH TỬ PHÙ!', '#7ac86a', 11); playStatusFx('poison', 'poison_apply', m.x, m.y, 0.5, 0.3); }
        }
        // LIÊN TRẢM (võ học kết hợp): ám khí trúng trong chuỗi combo chiêu thức → cửa sổ 2.5s
        if (p.kind === 'amkhi' && (player.comboT || 0) > 0 && (player.ltT || 0) <= 0){
          player.ltT = 2.5;
          addFloat(player.x, player.y-66, '⚡ LIÊN TRẢM — chiêu kế miễn phí Qi, +30% ST!', '#ffd76a', 14);
          addEffect({ type:'ring', x:player.x, y:player.y, r:60, color:'#ffd76a', big:true });
          AudioSys.sfx('crit', 0.7);
        }
        // Hiệu ứng Ám Khí theo tầng tuyệt học
        if (p.kind==='amkhi' && !m.dead){
          const aTier = (player.amkhiX && player.amkhiX.tier) || 0;
          if (aTier >= 1){ // Tinh Thiết Tiêu: kịch độc
            m.poisonT = 3;
            m.poisonDps = Math.max(1, Math.round(player.atk * (aTier >= 4 ? 1.0 : 0.5))); // Phù Dung Nhẫn: độc ×2
            addFloat(m.x, m.y-m.def.size-20, 'TRÚNG ĐỘC', '#5db86a', 11);
          }
          if (aTier >= 2 && Math.random() < 0.25){ m.slowT = 2; addFloat(m.x, m.y-32, 'CHẬM!', '#7ab0d8', 11); }
          if (aTier >= 5 && Math.random() < 0.12){ m.blindT = 2; addFloat(m.x, m.y-44, 'MÙ LÒA!', '#9aa8d4', 11); }
          if (aTier >= 6){ // Khổng Tước Linh: vạn độc lan AoE
            addEffect({ type:'ring', x:m.x, y:m.y, r:70, color:'#5db86a' });
            for (const m2 of mobs){
              if (m2.dead || m2 === m) continue;
              if (dist(m.x, m.y, m2.x, m2.y) < 70){
                m2.poisonT = 3; m2.poisonDps = m.poisonDps;
              }
            }
          }
          if (aTier >= 7 && !m.def.boss && m.hp < m.maxHp*0.2 && Math.random() < 0.03){
            addFloat(m.x, m.y-40, 'QUỶ KIẾN SẦU!', '#7ecbff', 16);
            addEffect({ type:'ring', x:m.x, y:m.y, r:60, color:'#7ecbff', big:true });
            m.hp = 0; killMob(m, 'amkhi');
          }
        }
        // Linh tiễn cung: chặn đứng & thiêu đốt theo tầng
        if (p.kind==='bow' && !m.dead){
          const bwT = BOW_TIERS[(player.bow && player.bow.tier) || 0];
          if (bwT){
            if (bwT.stun && Math.random() < bwT.stun){ m.atkT = Math.max(m.atkT, 1.5); addFloat(m.x, m.y-32, 'CHẶN ĐỨNG!', '#ffb15c', 11); }
            if (bwT.burn){ m.burnT = 3; m.burnDps = Math.max(1, Math.round(player.atk*0.2)); }
          }
        }
        // Đạn Chỉ (đan điền LV20+): phong mạch — trúng là đứng hình
        if (p.kind==='danchi' && !m.dead){
          m.stunT = Math.max(m.stunT || 0, 2.5);
          m.atkT = Math.max(m.atkT, 2.5);
          addFloat(m.x, m.y-m.def.size-24, 'PHONG MẠCH!', '#9fd8ff', 13);
          addEffect({ type:'ring', x:m.x, y:m.y, r:44, color:'#9fd8ff' });
        }
        if (!p.pierce){ p.life = 0; break; }
        if (!p.hit) p.hit = new Set();
        p.hit.add(m);
      }
    }
  }
  compactInPlace(projectiles, p=>p.life > 0);
  if (projectiles.length > 160) projectiles.splice(0, projectiles.length - 160); // trần cứng chống phình RAM

  // effects & floats
  for (const e of effects){ e.t += dt; if (e.type==='ink' || e.vx || e.vy){ e.x += (e.vx||0)*dt; e.y += (e.vy||0)*dt; } if (e.spin) e.ang = (e.ang || 0) + e.spin*dt; }
  compactInPlace(effects, e => e.t < (e.dur || (e.big?0.7:0.45)));
  for (const f of floats){ f.t -= dt*0.8; f.y -= 26*dt; }
  compactInPlace(floats, f=>f.t > 0);
  for (const mi of mists){ mi.x += mi.v*dt; if (mi.x - mi.r > W) mi.x = -mi.r; }
  updateAmbients(dt); // hạt môi trường: hoa rơi, tuyết, than hồng…
  tickWeather(dt); // sấm chớp & thời tiết động (Gói B)
  updateHints(dt); // GDD Đợt 2 B3: Nhắc Việc thông minh

  // camera mềm: bám theo có gia tốc ease-out — đổi hướng không còn giật cứng
  const _ctx = clamp(player.x - W/2, 0, Math.max(0, MAP.w - W));
  const _cty = clamp(player.y - H/2, 0, Math.max(0, MAP.h - H));
  const _cf = Math.min(1, dt*7.5);
  camera.x += (_ctx - camera.x) * _cf;
  camera.y += (_cty - camera.y) * _cf;
  if (Math.abs(camera.x - _ctx) < 0.4) camera.x = _ctx;
  if (Math.abs(camera.y - _cty) < 0.4) camera.y = _cty;

  // save
  saveTimer += dt;
  if (saveTimer > 10){ saveTimer = 0; saveGame(); }

  updateHud();
}
function onDeath(){
  moveTarget = null; moveWaypoint = null; // Click-to-move: hủy đích khi chết, tránh tự đi lung tung sau khi hồi sinh
  npcTalkTarget = null;
  // The Hatching · THIÊN MỆNH: mỗi màn chơi 1 lần, chết hồi sinh tại chỗ
  if (player.traitRevive && !player.reviveUsed){
    player.reviveUsed = true;
    player.hp = Math.round(player.maxHp * 0.5);
    player.combatT = 0;
    addFloat(player.x, player.y-56, '◑ THIÊN MỆNH — Tử Lý Đào Sinh!', '#f0a03a', 18);
    addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:'#f0a03a', big:true });
    AudioSys.sfx('levelup', 0.9);
    return;
  }
  // Bản Nguyên Công (Võ Học Phổ): chết tự hồi sinh 50% HP — CD 300s
  if (vhLearned('tienthiencong') && (player.vhReviveCd || 0) <= 0){
    player.vhReviveCd = 300;
    player.hp = Math.round(player.maxHp * 0.5);
    player.combatT = 0;
    addFloat(player.x, player.y-56, '✦ TIÊN THIÊN CÔNG — Tái Tạo Nhục Thân!', '#ffe9a8', 18);
    addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:'#ffe9a8', big:true });
    AudioSys.sfx('levelup', 0.9);
    return;
  }
  // Khắc Ấn: vũng độc và sóng hẹn giờ phải tắt theo cái chết. Nếu không chúng đóng băng suốt
  // màn hình bại trận rồi chạy tiếp ở TOẠ ĐỘ CŨ sau khi hồi sinh — có khi ở tận map khác.
  sigilReset();
  player.pendingHit = null; // đòn thường đã hẹn cũng phải huỷ: update() return sớm khi dead nên
                            // nó đóng băng nguyên vẹn rồi nổ vào con quái đứng cạnh điểm hồi sinh
  dead = true;
  const ov = document.getElementById('overlay');
  const _kb = player._killedByBoss; player._killedByBoss = null;
  document.getElementById('overlay-inner').innerHTML = _kb ? `
    <h2 style="color:#ff6b6b">Bại Trận!</h2>
    <p>Ngươi bị <b style="color:#ff8f6b">${_kb}</b> đánh bại.<br><span style="color:#e8b060;font-size:12.5px">Mẹo: khi trấn thủ tụ chiêu (vùng đỏ), lùi ra hoặc nhảy (J) né — sau đó là 2.5 giây phản công tốt nhất.<br>Hoặc quay lại khi ngươi đã mạnh hơn.</span></p>
    <button class="big-btn" onclick="respawn()">Tái Chiến</button>` : `
    <h2>Trọng Thương!</h2>
    <p>Ngươi bị đánh bại... Nhưng Lunacia chưa hề bỏ rơi kẻ có chí.<br>Hồi sinh tại làng trên Petalshade Isle với đầy đủ sinh lực.</p>
    <button class="big-btn" onclick="respawn()">Hồi Sinh</button>`;
  ov.classList.remove('hidden');
}
window.respawn = function(){
  // Hồi sinh về điểm an toàn: làng Đào Hoa nếu chết ở map PK, còn lại tại chỗ spawn của map
  const md = mapDef();
  if (md.type !== 'safe' && !md.dungeon){ curMap = 'daohoa'; buildWorld(); }
  const sp = mapDef().spawn;
  player.x = sp.x + 40; player.y = sp.y + 40;
  player.hp = player.maxHp; player.qi = player.maxQi;
  player.poisonT = 0;
  player._autoAX = null; player._autoAY = null; // QA: đừng để auto farm kéo người mới hồi sinh về neo cũ (map/vị trí khác)
  player._autoZone = null; player._autoZoneLocked = false;
  dead = false;
  document.getElementById('overlay').classList.add('hidden');
};
function showVictory(){
  const sect = SECTS[player.sect];
  const sectLine = player.sect === 'vophai'
    ? 'Một Unclassed vô danh — từ nay khắp Lunacia sẽ nhớ mặt ngươi.'
    : `<span style="color:${sect.color}">${sect.name}</span> tự hào về đệ tử của mình.`;
  document.getElementById('overlay-inner').innerHTML = `
    <h2>PHÁ VỠ VỎ KÉN!</h2>
    <p>Thủ Lĩnh Gloam đã bại dưới tay ngươi.<br>
    Từ một hatchling vô danh, ngươi đã bước qua cánh cửa đầu tiên của hành trình.<br><br>
    ${sectLine}<br><br>
    <i>Lunacia còn dài: rèn Khai Quang +11 · lên bậc Starforged · săn tướng quân của Morvahn mở Bảo Hạp · thu thập thủ bút từ Sát Thủ · giành danh hiệu Người Giữ Lunacia!</i></p>
    <button class="big-btn" onclick="document.getElementById('overlay').classList.add('hidden')">Tiếp Tục Hành Trình</button>`;
  document.getElementById('overlay').classList.remove('hidden');
  saveGame();
}

// ---------- Render ----------
// Tịnh Tâm Tuyền — suối thiền giữa rừng đào: mặt nước ngọc, gợn lan, hoa đào trôi,
// đá cuội vây bờ, sương mỏng, bia đá khắc chữ. Vẽ thuần canvas, tôn trọng Low FX.
function drawSpring(){
  const t = performance.now();
  const { x, y, r } = SPRING;
  // mặt nước ngọc — tâm sáng dần ra viền
  const g = ctx.createRadialGradient(x, y - 8, 6, x, y, r);
  g.addColorStop(0, 'rgba(150,230,210,.48)');
  g.addColorStop(0.55, 'rgba(70,175,155,.36)');
  g.addColorStop(1, 'rgba(46,110,96,.30)');
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(40,95,84,.6)'; ctx.lineWidth = 2.5; ctx.stroke();
  if (!SETTINGS.lowFx){
    // gợn sóng lan tỏa — 3 vòng lệch pha, chu kỳ 2s
    for (let i = 0; i < 3; i++){
      const k = ((t/2000) + i/3) % 1;
      ctx.beginPath(); ctx.arc(x, y, 8 + k*(r-12), 0, 7);
      ctx.strokeStyle = `rgba(220,255,245,${(1-k)*0.35})`; ctx.lineWidth = 1.6; ctx.stroke();
    }
    // phản quang lấp lánh chạy quanh mặt suối
    for (let i = 0; i < 5; i++){
      const a = t/1400 + i*1.256;
      const rr = r*0.55 + Math.sin(t/700 + i)*10;
      ctx.beginPath(); ctx.arc(x + Math.cos(a)*rr, y + Math.sin(a)*rr*0.6, 1.6, 0, 7);
      ctx.fillStyle = `rgba(240,255,250,${0.25 + 0.2*Math.sin(t/300 + i)})`; ctx.fill();
    }
    // cánh hoa đào trôi lênh đênh, xoay chậm — seed cố định
    for (let i = 0; i < 7; i++){
      const sd = Math.sin(i*127.1)*43758.5; const f = sd - Math.floor(sd);
      const a0 = f*6.283, rr0 = (0.15 + 0.7*((f*7.3)%1))*r;
      const px = x + Math.cos(a0 + t/9000*(i%2 ? 1 : -1))*rr0;
      const py = y + Math.sin(a0 + t/9000*(i%2 ? 1 : -1))*rr0*0.7;
      ctx.save(); ctx.translate(px, py); ctx.rotate(t/1600 + i);
      ctx.fillStyle = 'rgba(255,183,197,.85)';
      ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 2.6, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    // sương mỏng bốc lên từ mặt nước
    for (let i = 0; i < 3; i++){
      const k = ((t/4200) + i/3) % 1;
      ctx.beginPath(); ctx.ellipse(x + Math.sin(i*9)*r*0.4, y - k*46, 26 + k*20, 9 + k*7, 0, 0, 7);
      ctx.fillStyle = `rgba(235,250,245,${0.1*(1-k)})`; ctx.fill();
    }
  }
  // đá cuội mực xám vây quanh bờ — seed cố định
  for (let i = 0; i < 7; i++){
    const a = i/7*6.283 + 0.35;
    const sd = Math.sin(i*311.7)*24634.6; const f = sd - Math.floor(sd);
    const rx = x + Math.cos(a)*(r + 8 + f*6), ry = y + Math.sin(a)*(r*0.86 + 6 + f*5);
    const rs = 5 + f*6;
    ctx.beginPath(); ctx.ellipse(rx, ry, rs, rs*0.72, a, 0, 7);
    ctx.fillStyle = '#8d8d90'; ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,44,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(rx - rs*0.25, ry - rs*0.28, rs*0.4, rs*0.24, a, 0, 7);
    ctx.fillStyle = 'rgba(230,230,235,.35)'; ctx.fill();
  }
  // bia đá khắc "Tịnh Tâm" cạnh bờ
  const bx = x + r + 34, by = y - r*0.5 - 18;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx-11, by-30, 22, 34, 4); else ctx.rect(bx-11, by-30, 22, 34);
  ctx.fillStyle = '#7f7f84'; ctx.fill();
  ctx.strokeStyle = 'rgba(35,35,40,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#5a5a60'; ctx.fillRect(bx-15, by+2, 30, 5); // đế bia
  ctx.save(); ctx.translate(bx, by-8); ctx.rotate(-0.03);
  ctx.fillStyle = '#2e3438'; ctx.font = '11px "Ma Shan Zheng", serif'; ctx.textAlign = 'center';
  ctx.fillText('Tịnh', 0, -4); ctx.fillText('Tâm', 0, 9);
  ctx.restore();
  drawCalligraphy('Tịnh Tâm Tuyền', x, y - r - 14, '#2e6e60', 15);
}

function render(){
  // paper background — màu nền theo bản đồ hiện tại
  const md = mapDef();
  ctx.fillStyle = md.ground; ctx.fillRect(0,0,W,H);
  if (!player){ drawTitleBackdrop(); return; }

  ctx.save();
  // rung màn hình khi trúng đòn — tôn trọng cài đặt (mặc định tắt, chống chóng mặt)
  if (shakeT > 0 && SETTINGS.shake){
    // XUNG CÓ HƯỚNG, không phải nhiễu trắng. Random độc lập 2 trục mỗi khung cho ra cảm giác
    // "màn hình bị rung", còn dao động tắt dần dọc theo hướng đòn cho cảm giác "bị đẩy".
    // Cũng bỏ hằng 0.16: shakeT được đặt tới 0.2-0.25 ở nhiều chỗ nên biên độ từng vượt trần 1.56×.
    const _lv = SETTINGS.shake >= 2 ? 1 : 0.35;            // NHẸ = 35% biên độ
    const _k  = Math.min(1, shakeT / 0.2);                 // tắt dần theo thời gian còn lại
    const _osc = Math.sin(shakeT * 92) * _k * _k;          // dao động rồi lắng
    const _amp = shakeMag * _lv * _osc;
    ctx.translate(Math.cos(shakeDir) * _amp, Math.sin(shakeDir) * _amp);
  }
  ctx.translate(-camera.x, -camera.y);

  // nền bản đồ vẽ tay — phủ toàn bộ thế giới, nằm dưới mọi decor/thực thể
  const bg = MAP_BG[curMap];
  if (bg && bg.complete && bg.naturalWidth > 0) ctx.drawImage(bg, 0, 0, MAP.w, MAP.h);

  // ground texture: faint brush patches
  ctx.globalAlpha = 0.05; ctx.fillStyle = md.patch;
  for (let gx = Math.floor(camera.x/160)*160; gx < camera.x+W+160; gx += 160)
    for (let gy = Math.floor(camera.y/160)*160; gy < camera.y+H+160; gy += 160){
      ctx.beginPath(); ctx.ellipse(gx+80, gy+80, 55, 30, (gx*7+gy*13)%3, 0, 7); ctx.fill();
    }
  ctx.globalAlpha = 1;
  drawTufts(); // cỏ/vết mực trên mặt đất — phá sự phẳng của nền
  drawWaterFx(); // gợn sóng & lấp lánh mặt nước (Gói F)
  drawAiPasses(); drawBeacon(); drawObstaclesDebug(); // GDD Đợt 2 A/B2
  drawMoveTargetPath(); // Click-to-move: đường preview né vật cản + đích đến

  // Đào Hoa Đảo: cụm hoa đào tĩnh rụng dưới gốc cây (seed theo vị trí cây)
  if (curMap === 'daohoa'){
    ctx.fillStyle = 'rgba(255,183,197,.55)';
    for (const d of decor){
      if (d.type !== 'tree') continue;
      if (d.x < camera.x-60 || d.x > camera.x+W+60 || d.y < camera.y-60 || d.y > camera.y+H+60) continue;
      for (let i = 0; i < 4; i++){
        const sd = Math.sin(d.x*0.37 + i*97.3)*24634.6; const f = sd - Math.floor(sd);
        ctx.beginPath();
        ctx.ellipse(d.x + (f-0.5)*56, d.y + 10 + ((f*13.7)%1)*26, 3.2, 2, f*3, 0, 7);
        ctx.fill();
      }
    }
  }

  // map border ink
  ctx.strokeStyle = 'rgba(43,38,32,.5)'; ctx.lineWidth = 14;
  ctx.strokeRect(7,7,MAP.w-14,MAP.h-14);

  // spirit spring — Tịnh Tâm Tuyền, chỉ có ở Đào Hoa Đảo
  if (md.spring) drawSpring();

  // vùng hoạt động của AUTO FARM — vòng neo mờ quanh điểm bật auto
  if (player.auto && player._autoAX != null){
    ctx.beginPath(); ctx.arc(player._autoAX, player._autoAY, (player.autoCfg ? player.autoCfg.range : 430), 0, 7);
    ctx.strokeStyle = 'rgba(106,232,138,.28)'; ctx.setLineDash([10,10]); ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(player._autoAX, player._autoAY, 5, 0, 7);
    ctx.fillStyle = 'rgba(106,232,138,.5)'; ctx.fill();
  }

  // boss arena marker
  if (md.boss && questIdx >= 9 && !victory){
    ctx.beginPath(); ctx.arc(BOSS_ARENA.x, BOSS_ARENA.y, 90, 0, 7);
    ctx.strokeStyle = 'rgba(180,40,40,.5)'; ctx.setLineDash([8,8]); ctx.lineWidth = 3; ctx.stroke();
    ctx.setLineDash([]);
    drawCalligraphy('Sát Đài', BOSS_ARENA.x, BOSS_ARENA.y - 104, '#8a2020', 15);
  }

  // Vòng lãnh địa boss — ranh giới đứt nét đỏ: bước vào là tự nguyện giao chiến
  for (const m of mobs){
    if (m.dead || !(m.type === 'boss' || m.def.bossKind)) continue;
    const _hx = m.homeX ?? (m.zone ? m.zone.x : m.x), _hy = m.homeY ?? (m.zone ? m.zone.y : m.y);
    const _lr = m.def.bossKind ? 470 : 540;
    if (_hx < camera.x - _lr || _hx > camera.x + W + _lr || _hy < camera.y - _lr || _hy > camera.y + H + _lr) continue;
    ctx.beginPath(); ctx.arc(_hx, _hy, _lr, 0, 7);
    ctx.strokeStyle = 'rgba(200,60,40,.30)'; ctx.setLineDash([14, 10]); ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
    drawCalligraphy('⚠ Lãnh Địa Boss', _hx, _hy - _lr - 6, '#c05a4a', 13);
  }

  // village / city labels
  if (md.village) drawCalligraphy('Thanh Ngưu Thôn', 400, 310, '#6a5836', 18);
  if (md.city){
    drawCityMood();           // nhuộm tông chiều tà trước, để đèn/sương bên dưới nổi lên
    drawCityWalls();
    drawCityPlaza();          // quảng trường + đài phun nước trung tâm kiểu Lorencia
    drawCalligraphy('Lunaris City', 1300, 612, '#6a5836', 20);
    drawCalligraphy('Xưởng Luyện Đan', 830, 706, '#3a6a3e', 13);
    drawCalligraphy('Lò Rèn Hoàng Gia', 1780, 726, '#8a4a2e', 13);
    drawCalligraphy('Vũ Khí Phường', 1770, 1006, '#5a5a6a', 13);
    drawCalligraphy('Trà Quán', 980, 1096, '#8a6a2e', 13);
    drawCalligraphy('Sảnh Cầu May', 820, 986, '#7a5a9a', 13);
    drawCityHaze();           // lớp sương/tàn lửa ma mị phủ lên trên (vẽ sau cùng)
  }
  drawGates();

  // decor (behind entities)
  const sortedDecor = decor.filter(d=>d.x>camera.x-80&&d.x<camera.x+W+80&&d.y>camera.y-120&&d.y<camera.y+H+80);
  for (const d of sortedDecor){ if (d.type==='rock') drawRock(d); }

  // pickups (herbs) — bụi thuốc 5 lá + hoa, lấp lánh báo hái được; héo xám sau khi hái
  const _herbT = performance.now();
  for (const p of pickups){
    if (p.respawn > 0){ // đã hái — cành héo xám chờ hồi sinh
      ctx.strokeStyle = 'rgba(120,116,100,.6)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x-3, p.y-7, p.x-2, p.y-11); ctx.stroke();
      ctx.fillStyle = 'rgba(140,136,120,.5)';
      ctx.beginPath(); ctx.ellipse(p.x-2, p.y-9, 3, 1.8, -0.6, 0, 7); ctx.fill();
      continue;
    }
    ctx.strokeStyle = '#3f7a3a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x-4, p.y-10, p.x-1, p.y-16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x+5, p.y-9, p.x+3, p.y-15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x, p.y-12, p.x, p.y-18); ctx.stroke();
    ctx.fillStyle = '#5fc96e';
    ctx.beginPath(); ctx.ellipse(p.x-3, p.y-12, 4, 2.4, -0.6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.x+4, p.y-10, 4, 2.4, 0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.x+1, p.y-15, 3.4, 2, -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.x-4, p.y-7, 3.2, 1.9, -0.9, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8ecff'; ctx.beginPath(); ctx.arc(p.x, p.y-19, 2.5, 0, 7); ctx.fill();
    if (!SETTINGS.lowFx){ // lấp lánh báo "hái được"
      const tw = (Math.sin(_herbT/280 + p.x*0.7) + 1)/2;
      ctx.fillStyle = `rgba(190,255,170,${0.25 + tw*0.55})`;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(_herbT/500)*7, p.y - 22 + Math.sin(_herbT/600)*3, 1.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x - Math.cos(_herbT/430)*6, p.y - 13, 1.2, 0, 7); ctx.fill();
    }
  }

  drawGroundLoot(_herbT); // đồ rơi dưới đất — vẽ sau thảo dược, trước NPC/quái

  // NPC
  drawNpc();

  // Boss telegraph: vùng cảnh báo chiêu trên mặt đất (GDD Boss v2.1)
  for (const m of mobs){ if (m.tele) drawBossTele(m); }
  // trees after npc but before mobs for depth — simple approach: draw all entities sorted by y
  // Perf: entities are plain tagged records (not per-entity closures) and off-screen mobs are
  // culled here — this only skips their DRAW, their AI/combat in update() is unaffected.
  const CULL_MARGIN = 220;
  const ents = [];
  for (const m of mobs){
    if (m.x < camera.x-CULL_MARGIN || m.x > camera.x+W+CULL_MARGIN || m.y < camera.y-CULL_MARGIN || m.y > camera.y+H+CULL_MARGIN) continue;
    if (!m.dead) ents.push({ y:m.y, kind:'mob', m });
    else if (m.deadT > 0) ents.push({ y:m.y, kind:'deadmob', m }); // xác quái tan dần thành vệt mực loang
  }
  ents.push({ y:player.y, kind:'player' });
  if (petObj) ents.push({ y:petObj.y, kind:'pet' });
  if (mountObj) ents.push({ y:mountObj.y, kind:'mount' });
  for (const h of horses) ents.push({ y:h.y, kind:'horse', h }); // GDD Đợt 2 B5
  for (const d of sortedDecor) if (d.type==='tree') ents.push({ y:d.y, kind:'tree', d });
  ents.sort((a,b)=>a.y-b.y);
  for (const e of ents){
    switch (e.kind){
      case 'mob': drawMob(e.m); break;
      case 'deadmob': {
        const m = e.m, k = Math.max(0, m.deadT/0.45);
        ctx.save(); ctx.globalAlpha = k*0.45;
        ctx.fillStyle = '#241f18';
        ctx.beginPath(); ctx.ellipse(m.x, m.y+4, m.def.size*(1+(1-k)*0.8), m.def.size*0.5*(1+(1-k)*0.4), 0, 0, 7); ctx.fill();
        ctx.restore();
        break;
      }
      case 'player':
        drawPlayer();
        // vòng sáng tịnh tâm quanh người khi đang đứng trong suối hồi phục
        if (md.spring && dist(player.x, player.y, SPRING.x, SPRING.y) < SPRING.r){
          ctx.beginPath(); ctx.arc(player.x, player.y+2, 26 + Math.sin(performance.now()/300)*3, 0, 7);
          ctx.strokeStyle = 'rgba(120,230,200,.42)'; ctx.lineWidth = 2; ctx.stroke();
        }
        break;
      case 'pet': drawPet(); break;
      case 'mount': drawMount(); break;
      case 'horse': drawHorse(e.h); break;
      case 'tree': drawTree(e.d); break;
    }
  }


  // projectiles — mỗi tuyệt chiêu một kiểu đạn riêng
  for (const p of projectiles){ drawProjStyled(p); }

  // effects
  for (const e of effects){
    const k = e.t / (e.dur || (e.big?0.7:0.45)), a = 1 - k;
    if (e.type==='arc'){
      ctx.strokeStyle = e.color; ctx.globalAlpha = a*0.85; ctx.lineWidth = 5*(1-k)+2; ctx.lineCap='round';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r*(0.6+k*0.6), e.face-0.9, e.face+0.9); ctx.stroke();
    } else if (e.type==='ring'){
      ctx.strokeStyle = e.color; ctx.globalAlpha = a*0.8; ctx.lineWidth = e.big?6:3;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r*(0.25+k*0.85), 0, 7); ctx.stroke();
    } else if (e.type==='spawnbeam'){ // quái hồi sinh: cột sáng lóe dưới chân thay vì "hiện ra" đột ngột
      ctx.globalAlpha = a*0.7; ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.ellipse(e.x, e.y+4, 24*(1-k*0.35), 8, 0, 0, 7); ctx.fill();
      const bh = 76*(1-k*0.3);
      const grd = ctx.createLinearGradient(e.x, e.y-bh, e.x, e.y);
      grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(1, e.color);
      ctx.fillStyle = grd; ctx.globalAlpha = a*0.55;
      ctx.beginPath(); ctx.moveTo(e.x-11,e.y); ctx.lineTo(e.x-3,e.y-bh); ctx.lineTo(e.x+3,e.y-bh); ctx.lineTo(e.x+11,e.y); ctx.closePath(); ctx.fill();
    } else if (e.type==='cone'){
      ctx.fillStyle = e.color; ctx.globalAlpha = a*0.4;
      ctx.beginPath(); ctx.moveTo(e.x, e.y);
      ctx.arc(e.x, e.y, e.r*(0.4+k*0.7), e.face-1.0, e.face+1.0); ctx.closePath(); ctx.fill();
    } else if (e.type==='ink'){
      ctx.fillStyle = e.color; ctx.globalAlpha = a*0.7;
      ctx.beginPath(); ctx.arc(e.x, e.y, 3.5*(1-k)+1, 0, 7); ctx.fill();
    } else if (e.type==='critflash'){ // chớp trắng bạo kích (Gói E)
      ctx.globalAlpha = a*0.9;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3*(1-k)+1; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++){ const aa = i*Math.PI/4 + 0.4;
        const r0 = e.r*(0.3+k*0.5), r1 = e.r*(0.85+k*0.35);
        ctx.beginPath(); ctx.moveTo(e.x + Math.cos(aa)*r0, e.y + Math.sin(aa)*r0);
        ctx.lineTo(e.x + Math.cos(aa)*r1, e.y + Math.sin(aa)*r1); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,244,200,.9)';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r*0.35*(1-k)+2, 0, 7); ctx.fill();
    } else if (e.type==='spark'){ // tia lấp lánh bắn lên (Gói E)
      ctx.globalAlpha = a*0.95; ctx.strokeStyle = e.color || '#ffd76a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++){ const aa = (i-2.5)*0.5;
        const L = (e.r||36)*(0.35+k*0.75);
        ctx.beginPath(); ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.sin(aa)*L*0.55, e.y - L); ctx.stroke(); }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x, e.y, 3*(1-k)+1, 0, 7); ctx.fill();
    } else if (e.type==='vfx'){
      drawVfx(e, k, a);
    } else if (e.type==='slash'){
      // Vệt kiếm khí kiểu MU: lưỡi liềm vector — dày ở giữa, nhọn hai đầu, mép trước
      // sáng gắt. (Trước đây blit assets/skills/slash.png — một thẻ icon Axie vuông,
      // dùng chung cho MỌI chiêu của MỌI lớp nên nhìn đâu cũng ra Axie.)
      const r = (e.s || 110) * (0.42 + k*0.34);
      const col = e.color || '#e8f0ff', glw = e.glow || '#9fd0ff', sp = 0.62;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a*0.32; ctx.strokeStyle = glw;          // vầng sáng toả ngoài
      ctx.lineWidth = r*0.30; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, r, -sp, sp); ctx.stroke();
      ctx.globalAlpha = a; ctx.fillStyle = col;                  // thân lưỡi chém
      ctx.beginPath();
      for (let i = 0; i <= 18; i++){
        const t = i/18, an = -sp + t*sp*2, w = Math.sin(t*Math.PI)*r*0.17;
        ctx.lineTo(Math.cos(an)*(r+w), Math.sin(an)*(r+w));
      }
      for (let i = 18; i >= 0; i--){
        const t = i/18, an = -sp + t*sp*2, w = Math.sin(t*Math.PI)*r*0.17;
        ctx.lineTo(Math.cos(an)*(r-w), Math.sin(an)*(r-w));
      }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = a*0.9; ctx.strokeStyle = '#ffffff';      // mép trước
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r*1.05, -sp*0.86, sp*0.86); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    } else if (e.type==='atlasVfx'){
      const def = VFX_ATLAS_DEFS[e.id];
      const img = getVfxAtlasImg(e.id);
      if (def && img.complete && img.naturalWidth){
        const frameIdx = Math.min(def.frames - 1, Math.floor(e.t * def.fps));
        const col = frameIdx % def.cols, row = Math.floor(frameIdx / def.cols);
        const dw = def.frameW * e.scale, dh = def.frameH * e.scale;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a > 0.15 ? 1 : a / 0.15; // hold full bright, only fade the last sliver
        ctx.drawImage(img, col*def.frameW, row*def.frameH, def.frameW, def.frameH,
          e.x - def.anchorX*e.scale, e.y - def.anchorY*e.scale, dw, dh);
        ctx.restore(); ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  // hạt môi trường bay trong thế giới (dưới chữ nổi, trên entities)
  drawAmbients();

  // floats
  ctx.textAlign = 'center';
  for (const f of floats){
    ctx.globalAlpha = Math.min(1, f.t*1.6);
    ctx.font = `bold ${f.size}px "Baloo 2", "Be Vietnam Pro", sans-serif`;
    ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  drawQuestCompass(); // mũi tên định hướng khi đèn hiệu (beacon) ra ngoài màn hình — screen space

  // mist (screen space, top) — tắt khi Giảm Hiệu Ứng
  if (!SETTINGS.lowFx){
    for (const mi of mists){
      const g = ctx.createRadialGradient(mi.x, mi.y, 0, mi.x, mi.y, mi.r);
      g.addColorStop(0, `rgba(236,226,200,${mi.a})`); g.addColorStop(1, 'rgba(236,226,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mi.x, mi.y, mi.r, 0, 7); ctx.fill();
    }
  }

  // ink mountains vignette top
  drawMountains();

  // bản đồ thu nhỏ góc phải
  drawMinimap();

  // bản đồ tối (Cổ Mộ Mật Thất) — phủ màn u ám
  if (md.dark){
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.28, W/2, H/2, H*0.75);
    vg.addColorStop(0, 'rgba(10,8,14,0)'); vg.addColorStop(1, 'rgba(10,8,14,.62)');
    ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  } else if (!SETTINGS.lowFx){
    // vignette ấm rất nhẹ cho mọi bản đồ — tạo chiều sâu, xóa cảm giác "phẳng"
    const vg2 = ctx.createRadialGradient(W/2, H/2, H*0.44, W/2, H/2, H*0.88);
    vg2.addColorStop(0, 'rgba(24,16,8,0)'); vg2.addColorStop(1, 'rgba(24,16,8,.16)');
    ctx.fillStyle = vg2; ctx.fillRect(0,0,W,H);
  }

  // banner tên bản đồ khi vừa dịch chuyển
  // viền đỏ nhấp khi người chơi trúng đòn (screen-space)
  if (player && player.hurtT > 0){
    const ha = player.hurtT / 0.25 * 0.35;
    const hg = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.75);
    hg.addColorStop(0, 'rgba(200,30,20,0)'); hg.addColorStop(1, `rgba(200,30,20,${ha})`);
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
  }
  // máu thấp <25%: viền đỏ nhấp nháy cảnh báo sinh tử (Gói E)
  if (player && player.hp > 0 && player.hp < player.maxHp*0.25){
    const lp = 0.5 + 0.5*Math.sin(performance.now()/260);
    const lg = ctx.createRadialGradient(W/2, H/2, H*0.34, W/2, H/2, H*0.78);
    lg.addColorStop(0, 'rgba(190,16,16,0)'); lg.addColorStop(1, 'rgba(190,16,16,' + (0.14 + 0.18*lp).toFixed(3) + ')');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  }
  drawBeaconArrow(); // GDD Đợt 2 B2: mũi tên chỉ hướng khi mục tiêu ngoài màn hình
  if (DGN) drawDungeonHUD(); // HUD phó bản: đợt quái + thanh máu boss

  // ☬ Cốt truyện: trời tối dần khi các Cổng Vực vỡ
  const _nTa = Object.keys(player.storyFlags || {}).filter(k => k.startsWith('ta_')).length;
  if (_nTa >= 3 && !SETTINGS.lowFx){ ctx.fillStyle = `rgba(8,6,20,${Math.min(0.18, 0.05 + _nTa * 0.018)})`; ctx.fillRect(0, 0, W, H); }

  drawSkyOverlay(); // Lịch Tu Tiên: bầu trời ngày/đêm theo canh giờ

  if (zoneBanner){
    const a = Math.min(1, zoneBanner.t / 0.6);
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = 'bold 34px "Baloo 2", "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 5;
    ctx.strokeText(zoneBanner.text, W/2, H*0.24);
    ctx.fillStyle = zoneBanner.color; ctx.fillText(zoneBanner.text, W/2, H*0.24);
    ctx.font = 'bold 15px "Baloo 2", "Be Vietnam Pro", sans-serif';
    ctx.strokeText(zoneBanner.sub, W/2, H*0.24 + 26);
    ctx.fillStyle = '#e4ebff'; ctx.fillText(zoneBanner.sub, W/2, H*0.24 + 26);
    ctx.globalAlpha = 1;
  }

  // interact hint — NPC gần nhất trong bản đồ
  let nearNpc = null;
  for (const n of NPCS){
    if (n.map !== curMap) continue;
    if (dist(player.x, player.y, n.x, n.y) < 95){ nearNpc = n; break; }
  }
  if (nearNpc)
    drawCalligraphy(`Nhấn E — ${nearNpc.name}`, W/2, H-130, '#7ecbff', 15, true);
  // interact hint — bụi thảo dược còn hái được gần nhất
  let nearHerb = null;
  for (const p of pickups){
    if (p.type !== 'herb' || p.respawn > 0) continue;
    if (dist(player.x, player.y, p.x, p.y) < 36){ nearHerb = p; break; }
  }
  if (nearHerb)
    drawCalligraphy('Nhấn J — Hái Thảo Dược', W/2, H-(nearNpc?108:130), '#8fd18f', 15, true);
}

// ---------- Drawing helpers ----------
function drawCalligraphy(text, x, y, color, size){
  ctx.font = `bold ${size}px "Baloo 2", "Be Vietnam Pro", sans-serif`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function drawRock(d){
  const rim = (typeof ROCK_IMGS !== 'undefined') && ROCK_IMGS[Math.abs(((d.x*7+d.y*13)|0)) % ROCK_IMGS.length];
  if (rim && rim.complete && rim.naturalWidth){
    const w = 46*d.s, h = w * (rim.naturalHeight/rim.naturalWidth);
    ctx.drawImage(rim, d.x-w/2, d.y-h*0.75, w, h);
    return;
  }
  ctx.fillStyle = 'rgba(90,85,75,.5)';
  ctx.beginPath(); ctx.ellipse(d.x, d.y, 14*d.s, 9*d.s, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(120,115,105,.4)';
  ctx.beginPath(); ctx.ellipse(d.x-3*d.s, d.y-3*d.s, 8*d.s, 5*d.s, 0.2, 0, 7); ctx.fill();
}
// ══ QUÁI VẼ THEO KHUNG XƯƠNG — cùng cơ chế với nhân vật chính ═══════════════
// Trước đây mỗi quái là 1 ảnh PNG tĩnh, và kho ảnh lẫn 3 phong cách: blob hoạt hình,
// tranh vẽ kiếm hiệp Trung Hoa, và dark-fantasy. Nhóm kiếm hiệp bị thay bằng 7 nguyên
// mẫu dark-fantasy phương Tây dựng bằng vector, mỗi chi có trục xoay riêng nên có
// bước đi, vung đòn, giật khi trúng và tan khi chết — không tốn file art nào.
// Hộp toạ độ 120×120, chân chạm y=112, tâm ngang x=60.
const MOBSK_W = 120, MOBSK_H = 120;

// Bảng màu theo cấp: quái thường xỉn, elite ánh kim, boss rực và có hào quang.
// ═══════════ LOÉ TRẮNG KHI TRÚNG ĐÒN — KHÔNG dùng ctx.filter ═══════════
// `ctx.filter` buộc canvas 2D dựng surface phụ rồi đọc ngược, chi phí TUYẾN TÍNH theo số quái
// đang loé. Đo trên raster phần mềm: 20 quái không loé = 21,6 ms/khung, nhưng CHỈ 12 quái đang
// loé = 910 ms/khung. Máy có GPU thì hệ số nhỏ hơn nhiều, nhưng hình thái vẫn vậy.
// Nặng nhất là quái vàng: nó bật filter sepia THƯỜNG TRỰC suốt 12 phút Xâm Lăng Vàng, nên sự
// kiện flagship đang là cảnh tốn nhất game.
//
// Hai cách thay, tuỳ loại quái:
//   • quái khung xương → vẽ lại chính hình đó bằng màu phẳng, chế độ 'lighter'. Rẻ như một
//     lần vẽ thường, và cho MÀU LOÉ ĐIỀU KHIỂN ĐƯỢC theo loại đòn — thứ brightness() không làm được.
//   • quái dùng ảnh   → nhuộm sẵn một bản vào canvas ngoài màn hình rồi cache. Vẫn dùng filter,
//     nhưng trả giá ĐÚNG MỘT LẦN cho mỗi ảnh thay vì 60 lần/giây cho mỗi con.
function mobFlashPal(P, col){
  const o = {};
  for (const k in P) o[k] = col;
  return o;
}
const _tintCache = new Map();
function tintedImg(img, key, filter){
  let c = _tintCache.get(key);
  if (c) return c;
  if (!img.naturalWidth) return img;                  // ảnh chưa tải xong — dùng tạm bản gốc
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const q = cv.getContext('2d');
  q.filter = filter;                                  // trả giá đúng một lần, ở đây
  q.drawImage(img, 0, 0);
  _tintCache.set(key, cv);
  return cv;
}
function mobPal(d){
  const p = d.skelPal || {};
  return { main:p.main||'#6a6f80', dark:p.dark||'#454a58', trim:p.trim||'#8a7a4a',
           glow:p.glow||'#ff7a5a', cloth:p.cloth||'#4a3a52', bone:p.bone||'#ddd6c4',
           line:p.line||'#15121c' };   // viền tối — thứ làm quái nổi khối
}
// Tư thế quái: bước đi · vung đòn (lungeT) · giật khi trúng (hitT)
function mobPose(m, now){
  const ph = (now/260) + (m.wob || 0);
  const mv = !!m.moving || (m.spd0 || 0) > 0;
  const atk = m.lungeT > 0 ? Math.sin((0.22 - m.lungeT)/0.22 * Math.PI) : 0;
  // Chia cho 0.15 = đúng giá trị hitT được đặt lúc trúng đòn. Trước đây chia 0.25 nên `hurt`
  // không bao giờ vượt 0.6 — mất 40% biên độ giật vì một hằng số lệch.
  const hurt = Math.min(1, (m.hitT || 0) / 0.15);
  return {
    step: Math.sin(ph) * (mv ? 1 : 0.28),
    bob:  Math.abs(Math.sin(ph)) * (mv ? -2.6 : -1.0),
    atk, hurt,
    lean: atk * 0.30 - hurt * 0.26,
    arm:  -0.5 + atk * 1.9 - hurt * 0.5,
    t: now / 1000,
  };
}

// ── Bút vẽ dùng chung: mọi khối đều có VIỀN TỐI + MẶT SÁNG/TỐI, nhờ vậy quái nổi
// khối chứ không phẳng lì như bản đầu.
function hOut(g, pts, fill, line, lw){
  g.lineJoin = 'round';
  if (line){ g.strokeStyle = line; g.lineWidth = lw || 3; hPoly(g, pts, fill); g.stroke(); }
  else hPoly(g, pts, fill);
}
function hOEll(g, x, y, rx, ry, fill, line, lw){
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7);
  g.fillStyle = fill; g.fill();
  if (line){ g.strokeStyle = line; g.lineWidth = lw || 3; g.stroke(); }
}
function hGlowDot(g, x, y, r, col, t){
  const gg = g.createRadialGradient(x, y, 0.5, x, y, r * 3.6);
  gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = 0.55 + 0.25 * Math.sin(t * 4); g.fillStyle = gg;
  g.beginPath(); g.arc(x, y, r * 3.6, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
// Lưỡi lửa phun ra phía trước (quái luôn vẽ hướng phải, người gọi lo việc lật)
function hFlame(g, x, y, len, spread, k, c1, c2){
  g.save(); g.translate(x, y);
  for (let i = 0; i < 3; i++){
    const f = 1 - i * 0.26, a = (0.55 - i * 0.13) * k;
    g.globalAlpha = a; g.fillStyle = i === 0 ? c2 : c1;
    g.beginPath(); g.moveTo(0, 0);
    for (let j = 0; j <= 8; j++){
      const t = j / 8, ang = -spread * f + t * spread * 2 * f;
      const wob = Math.sin(t * 9 + k * 14) * len * 0.09;
      g.lineTo(Math.cos(ang) * (len * f + wob), Math.sin(ang) * (len * f * 0.72 + wob));
    }
    g.closePath(); g.fill();
  }
  g.globalAlpha = 1; g.restore();
}
// Vệt chém hình lưỡi liềm
function hSlashArc(g, x, y, r, k, col){
  const sp = 1.05, prog = 1 - k;
  g.save(); g.translate(x, y); g.rotate(-0.9 + prog * 1.9);
  g.globalCompositeOperation = 'lighter';
  for (const [rr, w, a] of [[r*1.06, 3, 0.9], [r, 9, 0.5]]){
    g.globalAlpha = a * k; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, rr, -sp, sp); g.stroke();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.restore();
}

const MOB_ARCH = {
  // ── TƯỢNG ĐÁ: khổng lồ lưng gù, chân ngắn, hai tay đá to hơn cả thân ──
  golem(g, P, ps){
    const s = ps.step, L = P.line;
    hJoint(g, 44,86, s*0.20, () => hOut(g,[[32,80],[54,80],[56,112],[30,112]], P.dark, L));
    hJoint(g, 78,86, -s*0.20, () => hOut(g,[[68,80],[90,80],[92,112],[66,112]], P.dark, L));
    g.save(); g.translate(0, ps.bob);
    hJoint(g, 60,82, ps.lean, () => {
      hOut(g, [[26,40],[94,40],[100,86],[20,86]], P.main, L, 3.5);      // thân đá
      hPoly(g, [[62,42],[92,42],[97,84],[62,84]], P.dark);
      g.strokeStyle = P.glow; g.lineWidth = 2.6;                         // mạch nứt phát sáng
      g.globalAlpha = 0.5 + 0.3*Math.sin(ps.t*2.2);
      g.beginPath(); g.moveTo(40,48); g.lineTo(54,64); g.lineTo(44,78);
      g.moveTo(74,46); g.lineTo(66,62); g.lineTo(78,74); g.stroke(); g.globalAlpha = 1;
      hOut(g, [[40,18],[80,18],[86,42],[34,42]], P.main, L, 3);          // đầu khối
      hPoly(g, [[42,26],[78,26],[78,33],[42,33]], '#10131a');            // khe mắt
      hGlowDot(g, 50,29, 3, P.glow, ps.t); hGlowDot(g, 70,29, 3, P.glow, ps.t+1);
      hPoly(g, [[38,18],[46,2],[52,18]], P.trim); hPoly(g,[[68,18],[76,2],[82,18]], P.trim);
      // hai tay đá — to, buông thấp, nhấc lên khi đập
      hJoint(g, 24,46, ps.arm*0.7, () => {
        hOut(g,[[2,38],[34,30],[40,80],[6,88]], P.main, L, 3);
        hOut(g,[[0,74],[26,70],[30,100],[2,104]], P.dark, L, 3); });
      hJoint(g, 96,46, -ps.arm*0.9, () => {
        hOut(g,[[118,38],[86,30],[80,80],[114,88]], P.dark, L, 3);
        hOut(g,[[120,74],[94,70],[90,100],[118,104]], P.main, L, 3); });
    });
    g.restore();
  },
  // ── BỘ XƯƠNG: lưng còng, sọ hàm há, sườn lộ, áo choàng rách, đao cong ──
  skeleton(g, P, ps){
    const s = ps.step, L = P.line;
    hJoint(g, 50,82, s*0.44, () => { g.strokeStyle=L; g.lineWidth=8; g.lineCap='round';
      g.beginPath(); g.moveTo(50,78); g.lineTo(43,96); g.lineTo(45,110); g.stroke();
      g.strokeStyle=P.bone; g.lineWidth=4.5; g.stroke(); });
    hJoint(g, 70,82, -s*0.44, () => { g.strokeStyle=L; g.lineWidth=8; g.lineCap='round';
      g.beginPath(); g.moveTo(70,78); g.lineTo(78,96); g.lineTo(76,110); g.stroke();
      g.strokeStyle=P.bone; g.lineWidth=4.5; g.stroke(); });
    g.save(); g.translate(0, ps.bob);
    hPoly(g, [[42,34],[78,34],[92,96],[28,96]], P.cloth);                // áo choàng rách
    for (let i=0;i<4;i++) hPoly(g,[[30+i*16,92],[38+i*16,92],[34+i*16,104]], P.cloth);
    hJoint(g, 60,76, ps.lean - 0.14, () => {                             // lưng còng
      hOut(g, [[48,42],[72,42],[74,78],[46,78]], P.dark, L, 3);
      g.strokeStyle = P.bone; g.lineWidth = 4; g.lineCap='round';         // sườn
      for (let i=0;i<4;i++){ const w = 13 - i*1.6;
        g.beginPath(); g.moveTo(60-w, 48+i*8); g.quadraticCurveTo(60, 52+i*8, 60+w, 48+i*8); g.stroke(); }
      g.strokeStyle = P.bone; g.lineWidth = 5;                            // cột sống
      g.beginPath(); g.moveTo(60,44); g.lineTo(60,78); g.stroke();
      hOEll(g, 60,26, 13,13, P.bone, L, 3);                               // sọ
      hPoly(g, [[52,32],[68,32],[66,42],[54,42]], P.bone);                // hàm
      g.strokeStyle=L; g.lineWidth=1.6;
      for (let i=0;i<4;i++){ g.beginPath(); g.moveTo(54+i*4,34); g.lineTo(54+i*4,41); g.stroke(); }
      hOEll(g, 55,24, 3.6,4.2, '#0d0a12', null); hOEll(g, 65,24, 3.6,4.2, '#0d0a12', null);
      hGlowDot(g, 55,24, 2.2, P.glow, ps.t); hGlowDot(g, 65,24, 2.2, P.glow, ps.t+.6);
      hJoint(g, 44,48, ps.arm*0.45, () => {                               // khiên vỡ
        hOut(g,[[22,40],[44,34],[48,70],[24,76]], P.dark, L, 3);
        hPoly(g,[[28,46],[42,42],[44,62],[30,66]], P.trim);
        hPoly(g,[[34,52],[48,62],[34,64]], P.cloth); });
      hJoint(g, 76,48, -ps.arm, () => {                                   // đao cong
        g.strokeStyle=P.bone; g.lineWidth=5; g.lineCap='round';
        g.beginPath(); g.moveTo(74,46); g.lineTo(90,60); g.stroke();
        g.save(); g.translate(90,60); g.rotate(-0.7);
        g.strokeStyle=L; g.lineWidth=9; g.beginPath(); g.arc(4,-26, 28, 1.1, 2.4); g.stroke();
        g.strokeStyle=P.main; g.lineWidth=5.5; g.stroke();
        g.fillStyle=P.trim; g.fillRect(-4,-6,9,14); g.restore(); });
    });
    g.restore();
  },
  // ── OAN HỒN: không chân, thân tan thành khói, mặt sọ dài, vuốt buông ──
  wraith(g, P, ps){
    const f = Math.sin(ps.t*1.5)*5, L = P.line;
    g.save(); g.translate(0, ps.bob*1.7 + Math.sin(ps.t*1.05)*4);
    for (let i=0;i<3;i++){                                               // đuôi khói nhiều lớp
      g.globalAlpha = 0.5 - i*0.14;
      hPoly(g, [[46-i*3,52],[74+i*3,52],[92+f+i*6,112],[28+f-i*6,112]], i?P.main:P.cloth);
    }
    g.globalAlpha = 1;
    hOut(g, [[42,44],[78,44],[86,84],[34,84]], P.cloth, L, 3);           // thân áo
    hJoint(g, 60,50, ps.lean, () => {
      hOut(g, [[36,52],[84,52],[78,24],[64,8],[56,8],[42,24]], P.cloth, L, 3.5); // mũ trùm
      hPoly(g, [[60,8],[84,52],[78,24],[64,8]], P.dark);
      hOEll(g, 60,36, 15,17, '#0b0812', null);                           // hốc tối
      hOEll(g, 60,42, 8,10, '#0b0812', null);
      hGlowDot(g, 54,34, 3.4, P.glow, ps.t); hGlowDot(g, 66,34, 3.4, P.glow, ps.t+.8);
      g.strokeStyle = P.glow; g.lineWidth = 1.6; g.globalAlpha = 0.5;    // hơi lạnh toả
      for (let i=0;i<4;i++){ const a = -1.4 + i*0.5;
        g.beginPath(); g.moveTo(60+Math.cos(a)*16, 36+Math.sin(a)*16);
        g.lineTo(60+Math.cos(a)*(24+Math.sin(ps.t*3+i)*4), 36+Math.sin(a)*(24+Math.sin(ps.t*3+i)*4));
        g.stroke(); } g.globalAlpha = 1;
    });
    // vuốt chồm ra trước chứ không dang ngang: tay sau thu lại, tay trước với tới
    for (const [jx,dir,amt] of [[36,1,0.22],[84,-1,0.5]])
      hJoint(g, jx,58, (-0.35 + ps.atk*1.1) * amt * dir, () => {
        g.strokeStyle=L; g.lineWidth=6; g.lineCap='round';
        g.beginPath(); g.moveTo(jx,58); g.lineTo(jx-dir*10, 76); g.stroke();
        g.strokeStyle=P.bone; g.lineWidth=3.4; g.stroke();
        for (let i=0;i<3;i++){ g.strokeStyle=P.bone; g.lineWidth=2.6;
          g.beginPath(); g.moveTo(jx-dir*10,76); g.lineTo(jx-dir*(14+i*5), 90+i*4); g.stroke(); } });
    g.restore();
  },
  // ── KẺ CUỒNG TÍN: áo thụng dài, ấn phù nổi trước ngực, quyền trượng sọ ──
  cultist(g, P, ps){
    const s = ps.step, L = P.line;
    hJoint(g, 52,86, s*0.26, () => hOut(g,[[46,82],[58,82],[56,110],[44,110]], P.dark, L));
    hJoint(g, 68,86, -s*0.26, () => hOut(g,[[62,82],[74,82],[76,110],[64,110]], P.dark, L));
    g.save(); g.translate(0, ps.bob);
    hOut(g, [[42,40],[78,40],[92,106],[28,106]], P.cloth, L, 3.5);       // áo thụng loe
    hPoly(g, [[60,40],[78,40],[92,106],[60,106]], P.dark);
    for (let i=0;i<3;i++) hPoly(g,[[32+i*20,102],[42+i*20,102],[37+i*20,112]], P.cloth);
    hJoint(g, 60,78, ps.lean, () => {
      hOut(g, [[40,46],[80,46],[74,22],[64,8],[56,8],[46,22]], P.cloth, L, 3.5);
      hOEll(g, 60,34, 14,14, '#100b1a', null);
      hGlowDot(g, 55,32, 3, P.glow, ps.t); hGlowDot(g, 65,32, 3, P.glow, ps.t+.5);
      const r = 11 + Math.sin(ps.t*2.4)*1.6;                              // ấn phù xoay
      g.save(); g.translate(60,70); g.rotate(ps.t*0.9);
      g.strokeStyle = P.glow; g.lineWidth = 2; g.globalAlpha = 0.85;
      g.beginPath(); g.arc(0,0,r,0,7); g.stroke();
      for (let i=0;i<6;i++){ const a=i*Math.PI/3;
        g.beginPath(); g.moveTo(Math.cos(a)*r, Math.sin(a)*r);
        g.lineTo(Math.cos(a)*(r+5), Math.sin(a)*(r+5)); g.stroke(); }
      g.globalAlpha = 1; g.restore();
      hGlowDot(g, 60,70, 3.4, P.glow, ps.t*1.6);
      hJoint(g, 38,56, ps.arm*0.5, () => hOEll(g, 34,70, 7,12, P.cloth, L));
      hJoint(g, 82,56, -ps.arm*0.8, () => {                               // trượng đầu sọ
        hOEll(g, 86,70, 7,12, P.cloth, L);
        g.strokeStyle=L; g.lineWidth=7; g.lineCap='round';
        g.beginPath(); g.moveTo(90,96); g.lineTo(86,26); g.stroke();
        g.strokeStyle='#4a3520'; g.lineWidth=4.4; g.stroke();
        hOEll(g, 86,20, 8,8, P.bone, L, 2.6);
        hOEll(g, 83,19, 2,2.6, '#0d0a12', null); hOEll(g, 89,19, 2,2.6, '#0d0a12', null); });
    });
    g.restore();
  },
  // ── KỴ SĨ: vai gai khổng lồ, mũ trụ sừng, áo choàng, đại kiếm ──
  knight(g, P, ps){
    const s = ps.step, L = P.line;
    hJoint(g, 48,86, s*0.3, () => { hOut(g,[[40,80],[58,80],[58,106],[38,106]], P.dark, L);
      hOut(g,[[34,102],[62,102],[64,112],[32,112]], P.main, L); });
    hJoint(g, 72,86, -s*0.3, () => { hOut(g,[[62,80],[80,80],[82,106],[62,106]], P.dark, L);
      hOut(g,[[58,102],[86,102],[88,112],[56,112]], P.main, L); });
    g.save(); g.translate(0, ps.bob);
    hPoly(g, [[44,34],[76,34],[94,98],[26,98]], P.cloth);                 // áo choàng
    hJoint(g, 60,80, ps.lean, () => {
      hOut(g, [[42,36],[78,36],[84,84],[36,84]], P.main, L, 3.5);         // giáp ngực
      hPoly(g, [[60,38],[78,38],[84,84],[60,84]], P.dark);
      hOut(g, [[52,46],[68,46],[64,76],[56,76]], P.trim, L, 2);
      hOut(g, [[42,16],[78,16],[76,40],[44,40]], P.main, L, 3);           // mũ trụ
      hPoly(g, [[44,26],[76,26],[76,32],[44,32]], '#0e1018');
      hGlowDot(g, 52,29, 2.8, P.glow, ps.t); hGlowDot(g, 68,29, 2.8, P.glow, ps.t+.4);
      hPoly(g, [[44,18],[28,-2],[50,10]], P.trim); hPoly(g,[[76,18],[92,-2],[70,10]], P.trim);
      hJoint(g, 34,44, ps.arm*0.42, () => {                               // vai + khiên
        hOut(g,[[12,34],[40,26],[44,60],[16,68]], P.main, L, 3);
        hPoly(g,[[14,32],[26,18],[22,34]], P.trim);
        hOut(g,[[8,52],[34,46],[38,86],[12,92]], P.dark, L, 3);
        hOut(g,[[14,58],[32,54],[34,80],[16,84]], P.trim, L, 2); });
      hJoint(g, 86,44, -ps.arm, () => {                                   // vai + đại kiếm
        hOut(g,[[108,34],[80,26],[76,60],[104,68]], P.dark, L, 3);
        hPoly(g,[[106,32],[94,18],[98,34]], P.trim);
        g.save(); g.translate(98,62); g.rotate(0.18);
        hOut(g, [[-6,0],[6,0],[5,-58],[0,-68],[-5,-58]], '#d8dce6', L, 2.6);
        g.fillStyle='#fff'; g.fillRect(-2,-56,3,52);
        hOut(g, [[-15,0],[15,0],[13,8],[-13,8]], P.trim, L, 2); g.restore(); });
    });
    g.restore();
  },
  // ── CHÓ NGAO: bốn chân bấu đất, hàm há đầy nanh, bờm lửa, gai lưng ──
  hound(g, P, ps){
    const s = ps.step, L = P.line;
    // Mọi nguyên mẫu đều quay mặt sang PHẢI (người gọi lo việc lật theo m.face).
    // Con này vẽ theo hướng ngược nên lật lại tại đây cho khớp, nếu không lửa phun ngược vào thân.
    g.save(); g.translate(MOBSK_W, 0); g.scale(-1, 1);
    g.save(); g.translate(0, ps.bob*0.7);
    for (const [bx,ph,shade] of [[40,1,P.dark],[54,-1,P.dark],[80,-1,P.main],[94,1,P.main]])
      hJoint(g, bx,74, s*0.46*ph, () => {
        g.strokeStyle=L; g.lineWidth=11; g.lineCap='round';
        g.beginPath(); g.moveTo(bx,70); g.lineTo(bx+s*ph*5,92); g.lineTo(bx+s*ph*7,110); g.stroke();
        g.strokeStyle=shade; g.lineWidth=7; g.stroke(); });
    hJoint(g, 64,62, ps.lean*0.6, () => {
      hOEll(g, 66,58, 33,20, P.main, L, 3.5);                             // thân
      hOEll(g, 76,60, 22,16, P.dark, null);
      for (let i=0;i<6;i++){ const hgt = 30 - Math.abs(i-2)*5;            // gai lưng
        hOut(g, [[44+i*11,44],[48+i*11,44-hgt],[52+i*11,44]], P.trim, L, 2); }
      g.strokeStyle=L; g.lineWidth=8; g.lineCap='round';                  // đuôi
      g.beginPath(); g.moveTo(96,54); g.lineTo(112+Math.sin(ps.t*3)*5, 32); g.stroke();
      g.strokeStyle=P.main; g.lineWidth=5; g.stroke();
      const hg = g.createRadialGradient(34,52,4,34,52,30);                // bờm lửa
      hg.addColorStop(0, P.glow); hg.addColorStop(1,'rgba(0,0,0,0)');
      g.globalAlpha = 0.42 + 0.16*Math.sin(ps.t*5); g.fillStyle = hg;
      g.beginPath(); g.arc(34,52,30,0,7); g.fill(); g.globalAlpha = 1;
      for (let i=0;i<5;i++){ const a = -2.3 + i*0.5, ln = 16+Math.sin(ps.t*6+i)*5;
        hOut(g, [[34,52],[34+Math.cos(a)*ln, 52+Math.sin(a)*ln],[34+Math.cos(a+0.3)*ln*0.7, 52+Math.sin(a+0.3)*ln*0.7]], P.trim, null); }
      hOEll(g, 30,56, 17,14, P.main, L, 3);                               // đầu
      hOut(g, [[8,52],[30,46],[30,58],[10,62]], P.dark, L, 2.6);          // mõm trên
      hOut(g, [[10,62],[30,58],[30,68],[12,70]], P.main, L, 2.6);         // hàm dưới
      for (let i=0;i<4;i++){ hPoly(g,[[13+i*5,60],[16+i*5,60],[14.5+i*5,66]], '#fff');
                             hPoly(g,[[14+i*5,68],[17+i*5,68],[15.5+i*5,62]], '#fff'); }
      hPoly(g, [[24,44],[28,28],[33,44]], P.trim); hPoly(g,[[34,44],[38,30],[43,44]], P.trim);
      hGlowDot(g, 26,50, 3.2, P.glow, ps.t); hGlowDot(g, 36,49, 3.2, P.glow, ps.t+.7);
    });
    g.restore(); g.restore();
  },
  // ── ÁC QUỶ: cánh da lớn, sừng cong, lõi lửa trong ngực, vuốt dài ──
  fiend(g, P, ps){
    const s = ps.step, L = P.line;
    hJoint(g, 46,84, s*0.26, () => { hOut(g,[[36,78],[58,78],[58,104],[34,104]], P.dark, L);
      hOut(g,[[30,100],[62,100],[58,112],[28,112]], P.dark, L); });
    hJoint(g, 74,84, -s*0.26, () => { hOut(g,[[62,78],[84,78],[86,104],[62,104]], P.dark, L);
      hOut(g,[[58,100],[90,100],[92,112],[62,112]], P.dark, L); });
    g.save(); g.translate(0, ps.bob);
    for (const sd of [-1,1]){                                             // cánh da
      g.save(); g.translate(60,42); g.scale(sd,1);
      const fl = Math.sin(ps.t*2 + (sd>0?0:1))*7;
      hOut(g, [[4,0],[46,-30+fl],[58,4],[38,2],[46,30],[24,16],[26,36],[8,18]], P.dark, L, 3);
      g.strokeStyle = L; g.lineWidth = 2;
      g.beginPath(); g.moveTo(8,4); g.lineTo(44,-24+fl); g.moveTo(10,10); g.lineTo(40,4);
      g.moveTo(14,18); g.lineTo(30,28); g.stroke(); g.restore();
    }
    hJoint(g, 60,80, ps.lean, () => {
      hOut(g, [[38,34],[82,34],[88,86],[32,86]], P.main, L, 3.5);
      hPoly(g, [[60,36],[82,36],[88,86],[60,86]], P.dark);
      const cg = g.createRadialGradient(60,58,2,60,58,20);                // lõi lửa ngực
      cg.addColorStop(0,'#fff'); cg.addColorStop(0.3,P.glow); cg.addColorStop(1,'rgba(0,0,0,0)');
      g.globalAlpha = 0.7+0.25*Math.sin(ps.t*3.4); g.fillStyle=cg;
      g.beginPath(); g.arc(60,58,20,0,7); g.fill(); g.globalAlpha=1;
      hOut(g, [[26,32],[54,24],[56,56],[28,62]], P.main, L, 3);           // vai gai
      hOut(g, [[94,32],[66,24],[64,56],[92,62]], P.dark, L, 3);
      hPoly(g, [[28,30],[40,10],[36,32]], P.trim); hPoly(g,[[92,30],[80,10],[84,32]], P.trim);
      hOEll(g, 60,20, 16,14, P.main, L, 3);                               // đầu
      hOut(g, [[46,16],[28,-8],[52,6]], P.trim, L, 2.4);
      hOut(g, [[74,16],[92,-8],[68,6]], P.trim, L, 2.4);
      hGlowDot(g, 53,20, 3.6, P.glow, ps.t); hGlowDot(g, 67,20, 3.6, P.glow, ps.t+.5);
      hOut(g, [[50,28],[70,28],[66,36],[54,36]], '#120c14', null);        // miệng nanh
      for (let i=0;i<4;i++) hPoly(g,[[52+i*4.6,28],[55+i*4.6,28],[53.5+i*4.6,34]], '#fff');
      for (const [jx,dir,amt] of [[24,1,0.25],[96,-1,0.6]])
        hJoint(g, jx,50, (-0.3 + ps.atk*1.2) * amt * dir, () => {
          g.strokeStyle=L; g.lineWidth=9; g.lineCap='round';
          g.beginPath(); g.moveTo(jx,50); g.lineTo(jx-dir*8,74); g.stroke();
          g.strokeStyle=P.main; g.lineWidth=5.5; g.stroke();
          for (let i=0;i<3;i++){ g.strokeStyle=P.bone; g.lineWidth=3;
            g.beginPath(); g.moveTo(jx-dir*8,74); g.lineTo(jx-dir*(12+i*6), 92+i*3); g.stroke(); } });
    });
    g.restore();
  },
};

// ── VFX ĐÒN ĐÁNH theo loại quái — chạy khi ps.atk > 0 ──
const MOB_ATK_FX = {
  golem: (g,P,ps) => {                       // đập đất: sóng xung + mảnh đá bắn
    const k = ps.atk;
    g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha = k*0.8;
    g.strokeStyle = P.glow; g.lineWidth = 4;
    g.beginPath(); g.ellipse(60, 110, 20+70*(1-k), (20+70*(1-k))*0.3, 0, 0, 7); g.stroke();
    g.globalAlpha = k*0.5;
    g.beginPath(); g.ellipse(60, 110, 10+46*(1-k), (10+46*(1-k))*0.3, 0, 0, 7); g.stroke();
    g.globalCompositeOperation='source-over';
    g.fillStyle = P.main; g.globalAlpha = k;
    for (let i=0;i<6;i++){ const a=-2.6+i*0.42, d=(1-k)*40;
      g.beginPath(); g.arc(60+Math.cos(a)*d, 108+Math.sin(a)*d*0.6, 3.2, 0, 7); g.fill(); }
    g.globalAlpha=1; g.restore();
  },
  skeleton: (g,P,ps) => hSlashArc(g, 92, 58, 34, ps.atk, '#e8f0ff'),
  knight:   (g,P,ps) => hSlashArc(g, 100, 56, 44, ps.atk, '#ffffff'),
  wraith:   (g,P,ps) => {                    // sóng âm khí lan ra trước
    const k = ps.atk;
    g.save(); g.globalCompositeOperation='lighter';
    for (let i=0;i<3;i++){
      const rr = 18 + (1-k)*30 + i*11;
      g.globalAlpha = k*(0.85-i*0.22); g.strokeStyle = P.glow;
      g.lineWidth = 9-i*2.5; g.lineCap = 'round';
      g.beginPath(); g.arc(66, 54, rr, -1.0, 1.0); g.stroke();
    }
    g.globalAlpha=1; g.globalCompositeOperation='source-over'; g.restore();
  },
  cultist:  (g,P,ps) => {                    // cầu phép bắn ra
    const k = ps.atk, d = (1-k)*46;
    g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha = Math.min(1,k*1.4);
    const gg = g.createRadialGradient(92+d,66,1,92+d,66,16);
    gg.addColorStop(0,'#fff'); gg.addColorStop(0.35,P.glow); gg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gg; g.beginPath(); g.arc(92+d,66,16,0,7); g.fill();
    g.globalAlpha=1; g.globalCompositeOperation='source-over'; g.restore();
  },
  hound: (g,P,ps) => hFlame(g, 108, 62, 66*ps.atk, 0.5, ps.atk, P.trim, P.glow),
  fiend: (g,P,ps) => {                       // phun lửa từ miệng + tàn lửa quanh thân
    hFlame(g, 72, 32, 74*ps.atk, 0.40, ps.atk, P.trim, P.glow);
    g.save(); g.globalCompositeOperation='lighter'; g.fillStyle = P.glow;
    for (let i=0;i<7;i++){ const a = ps.t*2 + i, r = 40 + Math.sin(ps.t*3+i)*8;
      g.globalAlpha = ps.atk*0.4;
      g.beginPath(); g.arc(60+Math.cos(a)*r, 50+Math.sin(a)*r*0.6, 2.6, 0, 7); g.fill(); }
    g.globalAlpha=1; g.globalCompositeOperation='source-over'; g.restore();
  },
};
// Vẽ 1 quái khung xương vào thế giới. size = d.size, boss thì to hơn và có hào quang.
function drawMobFigure(m, d, dx, dy, now, g){
  const arch = MOB_ARCH[d.skel]; if (!arch) return false;
  g = g || ctx;                       // nhận context riêng để dựng bảng mẫu/ảnh chụp
  const P = mobPal(d), ps = mobPose(m, now);
  const h = d.size * (d.boss ? 5.0 : 3.6);
  const sc = h / MOBSK_H;
  g.save();
  g.translate(dx, dy + 4);
  if (Math.cos(m.face || 0) < 0) g.scale(-1, 1);
  g.scale(sc, sc);
  g.translate(-MOBSK_W/2, -MOBSK_H);
  if (d.boss){                                                        // boss: hào quang nền
    const bg = g.createRadialGradient(60,70,6,60,70,74);
    bg.addColorStop(0, P.glow); bg.addColorStop(1,'rgba(0,0,0,0)');
    g.globalAlpha = 0.22 + 0.1*Math.sin(now/380); g.fillStyle = bg;
    g.beginPath(); g.arc(60,70,74,0,7); g.fill(); g.globalAlpha = 1;
  }
  arch(g, P, ps);
  if (m.hitT > 0){                                                   // trúng đòn: loé, vẽ đè
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.6 * Math.min(1, m.hitT / 0.15);                // tắt dần theo hitT
    arch(g, mobFlashPal(P, m.hitCol || '#ffffff'), ps);
    g.restore();
  }
  const fx = MOB_ATK_FX[d.skel];                                     // phun lửa / chém kiếm...
  if (fx && ps.atk > 0.02) fx(g, P, ps);
  g.restore();
  return true;
}

function drawMob(m){
  const d = m.def;
  const bob = Math.sin(m.wob)*2;
  // hiệu ứng lao tới khi ra đòn (lunge)
  let lx = 0, ly = 0;
  if (m.lungeT > 0){
    const lp = Math.sin((0.22 - m.lungeT)/0.22 * Math.PI) * 11;
    lx = Math.cos(m.face || 0)*lp; ly = Math.sin(m.face || 0)*lp;
  }
  const dx = m.x + lx, dy = m.y + ly;
  const _mshI = gameTimeInfo(), _mshDx = (_mshI.frac - 0.5) * 14, _mshAl = 1 - skyDarkness()*0.35;
  ctx.fillStyle = 'rgba(0,0,0,' + (0.07*_mshAl).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(m.x + _mshDx, m.y+6, d.size*1.5, d.size*0.52, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,' + (0.16*_mshAl).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(m.x + _mshDx*0.45, m.y+6, d.size, d.size*0.35, 0, 0, 7); ctx.fill();
  // quái dát vàng: vầng kim quang + tia lấp lánh — nhận ra từ xa
  if (d.golden){
    ctx.save();
    const gk = 0.5 + 0.25*Math.sin(m.wob*2.2);
    const gg = ctx.createRadialGradient(dx, dy - 4, 4, dx, dy - 4, d.size*2.3);
    gg.addColorStop(0, 'rgba(255,215,106,' + (0.30*gk).toFixed(2) + ')'); gg.addColorStop(1, 'rgba(255,215,106,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(dx, dy - 4, d.size*2.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffd76a'; ctx.globalAlpha = 0.5 + 0.3*Math.sin(m.wob*3);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(dx, dy + 5, d.size + 9, (d.size + 9)*0.42, 0, 0, 7); ctx.stroke();
    for (let gi = 0; gi < 3; gi++){
      const ga = m.wob*1.8 + gi*2.1, gr = d.size + 12;
      ctx.fillStyle = '#fff0b8'; ctx.globalAlpha = 0.55 + 0.4*Math.sin(m.wob*4 + gi*2);
      ctx.beginPath(); ctx.arc(dx + Math.cos(ga)*gr, dy - 8 + Math.sin(ga)*gr*0.45, 1.8, 0, 7); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // hào quang nguyên tố quanh quái (mờ, theo hệ)
  if (d.el && ELEM[d.el]){
    ctx.save(); ctx.globalAlpha = 0.14 + 0.05*Math.sin(m.wob*1.3);
    ctx.strokeStyle = ELEM[d.el].color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(dx, dy+4, d.size+6, (d.size+6)*0.4, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // shield aura
  if (m.shield > 0){
    ctx.strokeStyle = 'rgba(192,127,224,.7)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(dx, dy-6+bob*0.4, d.size+8, 0, 7); ctx.stroke();
  }
  // body — sprite art with ink-blob fallback
  let topY = dy - d.size;
  const img = MOB_IMGS[m.type];
  if (d.skel && drawMobFigure(m, d, dx, dy + bob, performance.now())){
    topY = dy + bob - d.size * (d.boss ? 5.0 : 3.6) * 0.94;   // thanh máu nằm trên đỉnh đầu
  } else if (img && img.complete && img.naturalWidth){
    const mw = d.size * (d.boss ? 4.4 : 3.3); // vừa tầm nhìn — không chồng lấn khi đứng cụm
    const mh = mw * (img.naturalHeight / img.naturalWidth);
    topY = dy - mh*0.28 - mh/2 + bob;
    const flip = Math.cos(m.face || 0) < 0;
    ctx.save(); ctx.translate(dx, dy - mh*0.28 + bob);
    if (flip) ctx.scale(-1, 1);
    // Bản nhuộm sẵn có cache thay cho ctx.filter mỗi khung (xem tintedImg). Quái vàng đứng
    // suốt 12 phút nên chỗ này là chỗ tiết kiệm lớn nhất.
    let _src = img;
    if (m.hitT > 0) _src = tintedImg(img, img.src + '|hit', 'brightness(1.7) saturate(2) hue-rotate(-45deg)');
    else if (d.golden) _src = tintedImg(img, img.src + '|gold', 'sepia(0.85) saturate(2.6) hue-rotate(-14deg) brightness(1.25)');
    ctx.drawImage(_src, -mw/2, -mh/2, mw, mh);
    ctx.restore();
  } else {
    ctx.fillStyle = m.hitT > 0 ? '#8a2020' : d.color;
    ctx.beginPath(); ctx.ellipse(dx, dy-4+bob, d.size, d.size*0.85, 0, 0, 7); ctx.fill();
    // eyes
    ctx.fillStyle = d.eye;
    ctx.beginPath(); ctx.arc(dx-d.size*0.35, dy-10+bob, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(dx+d.size*0.35, dy-10+bob, 2.2, 0, 7); ctx.fill();
    if (d.sash){ ctx.strokeStyle = d.sash; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx-d.size*0.7, dy+2+bob); ctx.lineTo(dx+d.size*0.7, dy-2+bob); ctx.stroke(); }
  }
  // hp bar (above the sprite)
  const bw = Math.max(d.size*2.2, 44);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(dx-bw/2, topY-10, bw, 4);
  ctx.fillStyle = d.boss ? '#ff3a3a' : '#c0392b';
  ctx.fillRect(dx-bw/2, topY-10, bw*Math.max(0,m.hp/m.maxHp), 4);
  // huy hiệu nguyên tố (◆♣❄☼▲) + tên quái
  if (!SETTINGS.mobName) return;
  const nameTxt = `${d.bossKind === 'tranai' ? '✦ TƯỚNG QUÂN ' : d.bossKind === 'thuve' ? '◆ VỆ BINH TRỤ ' : ''}${m.name}${m.revenge ? ' ⚔TRUY THÙ' : ''} · C${d.lv}`;
  ctx.font = '10px "Be Vietnam Pro", sans-serif'; ctx.textAlign='center';
  const eld = d.el && ELEM[d.el];
  const nw = ctx.measureText(nameTxt).width;
  const nameX = eld ? dx + 8 : dx;
  if (eld){
    // vòng tròn hệ + ký hiệu nguyên tố
    ctx.beginPath(); ctx.arc(nameX - nw/2 - 10, topY-17, 7, 0, 7);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
    ctx.strokeStyle = eld.color; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = eld.color; ctx.font = 'bold 9px "Be Vietnam Pro", sans-serif';
    ctx.fillText(eld.glyph, nameX - nw/2 - 10, topY-14);
    ctx.font = '10px "Be Vietnam Pro", sans-serif';
  }
  ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=2.5;
  ctx.strokeText(nameTxt, nameX, topY-14);
  ctx.fillStyle = d.boss ? '#c02020' : '#3a3226';
  ctx.fillText(nameTxt, nameX, topY-14);
}
// Thần Binh lơ lửng theo người chơi — dáng vũ khí riêng từng môn phái, sáng dần theo tầng
function drawThanBinh(p){
  const tb = p.thanbinh; if (!tb || tb.tier <= 0) return;
  const def = THANBINH[p.sect] || THANBINH.vophai;
  const tier = tb.tier;
  const col = TB_TIER_COLORS[tier-1];
  const now = performance.now();
  const backAng = p.face + Math.PI;
  const bob = Math.sin(now/420) * 2.2;
  ctx.save();
  const _tbRes = !SETTINGS.lowFx && typeof mobs !== 'undefined' && mobs.some(b => !b.dead && b.def.bossKind === 'tranai' && dist(p.x, p.y, b.x, b.y) < 520);
  if ((tier >= 4 || _tbRes) && !SETTINGS.lowFx){ ctx.shadowColor = _tbRes && tier < 4 ? '#c04848' : def.color; ctx.shadowBlur = 3 + Math.max(tier, 2) * 1.5 + (_tbRes ? 3 : 0); }
  ctx.lineCap = 'round';
  const bx = p.x + Math.cos(backAng)*15, by = p.y - 24 + Math.sin(backAng)*6 + bob;
  if (def.kind === 'kiem' || def.kind === 'dao' || def.kind === 'thuong' || def.kind === 'truong'){
    // bay sau lưng, mũi hơi chúc xuống
    const ang = backAng + 0.45;
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const len = def.kind === 'kiem' ? 30 : def.kind === 'dao' ? 26 : 36;
    ctx.strokeStyle = def.kind === 'truong' ? '#6a5a42' : col; ctx.lineWidth = def.kind === 'thuong' || def.kind === 'truong' ? 2.4 : 3.4;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + ux*len, by + uy*len); ctx.stroke();
    if (def.kind === 'kiem' || def.kind === 'dao'){ // thanh kiếm/đao sáng
      ctx.strokeStyle = col; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(bx + ux*8, by + uy*8); ctx.lineTo(bx + ux*len, by + uy*len); ctx.stroke();
      // chuôi + quả chắn
      ctx.strokeStyle = '#5a4a30'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx - ux*6, by - uy*6); ctx.lineTo(bx + ux*6, by + uy*6); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx + ux*5 - uy*5, by + uy*5 + ux*5); ctx.lineTo(bx + ux*5 + uy*5, by + uy*5 - ux*5); ctx.stroke();
    } else { // thương/trượng: đầu nhọn/đầu trượng màu phái
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(bx + ux*(len+2), by + uy*(len+2), def.kind === 'truong' ? 5 : 4, 0, 7); ctx.fill();
      if (def.kind === 'thuong'){
        ctx.beginPath();
        ctx.moveTo(bx + ux*(len+9), by + uy*(len+9));
        ctx.lineTo(bx + ux*len - uy*3.5, by + uy*len + ux*3.5);
        ctx.lineTo(bx + ux*len + uy*3.5, by + uy*len - ux*3.5);
        ctx.closePath(); ctx.fill();
      }
    }
  } else if (def.kind === 'quyen'){
    // quyền sáo bọc kim — hai nắm đấm phát sáng hai bên tay
    for (const s2 of [-1, 1]){
      const fx = p.x + Math.cos(p.face + s2*1.35)*11, fy = p.y - 14 + Math.sin(p.face + s2*1.35)*5 + bob*0.5;
      const pulse = p.castT > 0 ? 1.6 : 1; // ra đòn: nắm đấm bùng sáng
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(fx, fy, 4.6*pulse, 0, 7); ctx.fill();
      ctx.strokeStyle = def.color; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(fx, fy, 6.4*pulse, 0, 7); ctx.stroke();
    }
  } else if (def.kind === 'quat'){
    // quạt sắt xoay chậm ngang hông
    const qx = p.x + Math.cos(p.face + 2.3)*14, qy = p.y - 8 + Math.sin(p.face + 2.3)*5 + bob;
    const open = 0.9 + Math.sin(now/600)*0.25;
    ctx.save(); ctx.translate(qx, qy); ctx.rotate(now/1800);
    ctx.strokeStyle = col; ctx.lineWidth = 1.8;
    for (let i = -2; i <= 2; i++){
      const a = i*open/2 - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*14, Math.sin(a)*14); ctx.stroke();
    }
    ctx.strokeStyle = def.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 14, -Math.PI/2 - open/2*2*0.5 - open/2, -Math.PI/2 + open/2 + open/2*2*0.5); ctx.stroke();
    ctx.restore();
  } else if (def.kind === 'chau'){
    // tràng hạt vòng quanh vai — 9 hạt xoay chậm
    const cr = 16;
    for (let i = 0; i < 9; i++){
      const a = now/1600 + i*(Math.PI*2/9);
      ctx.fillStyle = i === 0 ? def.color : col;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(a)*cr, p.y - 22 + Math.sin(a)*cr*0.42 + bob*0.4, 2.2, 0, 7); ctx.fill();
    }
  } else { // holu — hồ lô rượu đong đưa bên hông
    const hx = p.x + Math.cos(p.face - 2.3)*14, hy = p.y - 4 + Math.sin(p.face - 2.3)*5;
    const sway = Math.sin(now/500)*0.18;
    ctx.save(); ctx.translate(hx, hy + bob*0.6); ctx.rotate(sway);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 4, 5.5, 0, 7); ctx.fill();   // thân dưới
    ctx.beginPath(); ctx.arc(0, -2.5, 3.4, 0, 7); ctx.fill(); // thân trên
    ctx.fillStyle = '#5a4a30'; ctx.fillRect(-1.6, -8, 3.2, 3.5); // nút
    ctx.strokeStyle = def.color; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 4, 5.5, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // tầng 10 — Thức Tỉnh: quầng sáng đổi màu chạy quanh thần binh
  if (tier >= 10 && !SETTINGS.lowFx){
    ctx.globalAlpha = 0.5 + 0.3*Math.sin(now/180);
    ctx.strokeStyle = def.color; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(bx, by, 20 + Math.sin(now/240)*3, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}


// ═══════════ PHI THĂNG · THẦN TIÊN HÓA CẢNH — tiên nhân vẽ bằng VFX thuần (nam/nữ + 6 skin) ═══════════
const TIEN_SKINS = {
  bach:  { name:'Bạch Y Tiên Tử',       robe:'#f2ecdc', trim:'#4c8dff', ribbon:'#7ecbff', halo:'#fff2b0', metal:'#cfd8e8', hair:'#241c18' },
  thanh: { name:'Thanh Ngọc Chân Nhân', robe:'#8ad8c8', trim:'#2a6a5a', ribbon:'#c8f0e4', halo:'#a8ffe0', metal:'#b8d8d0', hair:'#1a2a26' },
  kim:   { name:'Kim Quang Thánh Quân', robe:'#ffb15c', trim:'#8a5a1a', ribbon:'#ffe8a0', halo:'#ffd76a', metal:'#f0e0b0', hair:'#3a2a12' },
  huyen: { name:'Huyền Ảnh Dạ Quân',    robe:'#4a3a6a', trim:'#b08ae8', ribbon:'#9a7ad8', halo:'#c09aff', metal:'#7a6a9a', hair:'#16121f' },
  hong:  { name:'Hồng Nhan Tiên Cơ',    robe:'#f0a8c0', trim:'#b03a5a', ribbon:'#ffd6e4', halo:'#ffb8d0', metal:'#f0d8e0', hair:'#2a1a20' },
  lam:   { name:'Thương Lam Kiếm Tiên', robe:'#5a8ad8', trim:'#1a3a6a', ribbon:'#a8ccff', halo:'#9fd0ff', metal:'#c0d8f0', hair:'#141c2a' },
};
function ascendToImmortal(){
  if (!player || player.ascended) return;
  player.ascended = true;
  player.oldSect = player.sect;
  // Môn phái phá bỏ hoàn toàn — mọi võ học môn phái tự ngộ, kết hợp không giới hạn
  let learned = 0;
  for (const _id in VOHOC_DEFS){ if (VOHOC_DEFS[_id].phai && !vhLearned(_id)){ player.vohoc[_id] = true; learned++; } }
  closePanels();
  zoneBanner = { text:'☁ PHI THĂNG · THẦN TIÊN HÓA CẢNH', sub:`Xuất thế khỏi ${SECTS[player.oldSect].name} — ràng buộc Lớp phá bỏ · ngự kiếm phi hành · võ học toàn tự do!`, color:'#fff2b0', t:6 };
  addFloat(player.x, player.y-86, '☁ PHI THĂNG!', '#fff2b0', 24);
  if (learned) addFloat(player.x, player.y-62, `Ràng buộc Lớp phá bỏ — tự ngộ thêm ${learned} môn võ học`, '#a0ffe9', 13);
  addFloat(player.x, player.y-42, 'Ngự Kiếm Phi Hành — tốc độ +25% · mở Cài Đặt (O) đổi hình dáng & tiên y', '#9fd0ff', 12);
  addEffect({ type:'vfx', style:'galaxy', x:player.x, y:player.y, r:150, c1:'#fff2b0', c2:'#9fd0ff', glyph:'✧', dur:1.4, big:true, spin:2.5 });
  addEffect({ type:'vfx', style:'thunderpillar', x:player.x, y:player.y, r:130, c1:'#fff2b0', c2:'#ffb15c', glyph:'✧', dur:1.0 });
  for (let i = 0; i < 20; i++) addEffect({ type:'ink', x:player.x, y:player.y, vx:rnd(-110,110), vy:rnd(-160,-40), color:'#fff2b0' });
  AudioSys.sfx('levelup', 1); AudioSys.sfx('quest', 0.9);
  calcDerived(); saveGame(); checkTitles();
}
function drawAscendedFigure(p, now, castK, _atkK, _maxed){
  const female = p.gender === 'nu';
  const sk = TIEN_SKINS[p.tienSkin] || TIEN_SKINS.bach;
  const flip = Math.cos(p.face) < 0 ? -1 : 1;
  const hover = 7 + Math.sin(now/450)*2.5 + (p.moving ? 3 : 0);
  const X = p.x, Y = p.y - hover;
  const sway = Math.sin(now/300), sway2 = Math.sin(now/350 + 1.3);
  ctx.save();
  // ── NGỰ KIẾM: phi kiếm dưới chân ──
  ctx.save(); ctx.translate(X, Y + 4); ctx.rotate(flip * (p.moving ? 0.10 : 0.03*sway));
  const sg = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
  sg.addColorStop(0, sk.halo); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35; ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, 1, 27, 7, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = sk.metal; ctx.beginPath();
  ctx.moveTo(-24, 0); ctx.lineTo(14, -3.2); ctx.lineTo(27, 0); ctx.lineTo(14, 3.2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sk.trim; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = sk.trim; ctx.fillRect(-27, -1.4, 4, 2.8); ctx.fillRect(-20, -4.5, 2.5, 9);
  ctx.restore();
  if (p.moving && !SETTINGS.lowFx && Math.random() < 0.45)
    addEffect({ type:'ink', x:X - Math.cos(p.face)*rnd(12,28), y:Y + rnd(2,7), vx:-Math.cos(p.face)*26, vy:rnd(-8,8), color:sk.halo });
  // ── hào quang thân ──
  const aura = ctx.createRadialGradient(X, Y-24, 4, X, Y-24, 44);
  aura.addColorStop(0, sk.halo); aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.16 + castK*0.25; ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(X, Y-24, 44, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  // ── quang hoàn sau đầu (xoay) ──
  ctx.save(); ctx.translate(X, Y-46); ctx.rotate(now/900);
  ctx.strokeStyle = sk.halo; ctx.globalAlpha = 0.75 + castK*0.25; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 16.5, 0, 7); ctx.stroke();
  ctx.restore();
  // ── hỗn thiên lăng: hai dải lụa phất sau lưng ──
  for (const side of [-1, 1]){
    ctx.strokeStyle = sk.ribbon; ctx.globalAlpha = 0.85; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(X + side*5, Y - 36);
    ctx.bezierCurveTo(X - flip*(14 + side*3), Y - 44 + sway*3, X - flip*(26 + side*5), Y - 34 + sway2*5, X - flip*(38 + side*7), Y - 40 + sway*7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // ── thân: áo bào tiên ──
  const hem = female ? 13 : 10, hemY = Y - 1;
  ctx.fillStyle = sk.robe; ctx.beginPath();
  ctx.moveTo(X - 6, Y - 27);
  ctx.quadraticCurveTo(X - hem - sway*2, Y - 12, X - hem + sway*2, hemY);
  ctx.lineTo(X + hem + sway*2, hemY);
  ctx.quadraticCurveTo(X + hem + sway*2, Y - 12, X + 6, Y - 27);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sk.trim; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
  if (!female){ ctx.strokeStyle = sk.trim; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(X, Y - 25); ctx.lineTo(X + sway*1.5, hemY - 1); ctx.stroke(); } // nam: xẻ tà
  ctx.fillStyle = sk.trim; ctx.fillRect(X - 7, Y - 28, 14, 3); // eo
  ctx.fillStyle = sk.robe; ctx.beginPath();
  ctx.moveTo(X - 6.5, Y - 25); ctx.lineTo(X - 7.5, Y - 39); ctx.lineTo(X + 7.5, Y - 39); ctx.lineTo(X + 6.5, Y - 25); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sk.trim; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X - 4, Y - 39); ctx.lineTo(X, Y - 33); ctx.lineTo(X + 4, Y - 39); ctx.stroke(); // cổ áo V
  for (const side of [-1, 1]){ // tay áo rộng phất
    const wide = female ? 9 : 7;
    ctx.fillStyle = sk.robe; ctx.beginPath();
    ctx.moveTo(X + side*6, Y - 37);
    ctx.quadraticCurveTo(X + side*(8 + wide), Y - 30 + sway*side, X + side*(6 + wide), Y - 21 + sway2*2);
    ctx.quadraticCurveTo(X + side*8, Y - 24, X + side*5.5, Y - 28);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = sk.trim; ctx.lineWidth = 0.9; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
  }
  // ── đầu & tóc (phân nam/nữ) ──
  const hy = Y - 45;
  if (female){ // nữ: tóc dài phủ lưng bay mượt
    ctx.fillStyle = sk.hair; ctx.beginPath();
    ctx.moveTo(X - 5.5, hy - 2);
    ctx.quadraticCurveTo(X - 8, Y - 34 + sway, X - 4.5, Y - 30 + sway2*2);
    ctx.lineTo(X + 4.5, Y - 30 + sway*2);
    ctx.quadraticCurveTo(X + 8, Y - 34 + sway2, X + 5.5, hy - 2);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#f0d0b0'; ctx.beginPath(); ctx.arc(X, hy, 6.2, 0, 7); ctx.fill();
  ctx.fillStyle = sk.hair; ctx.beginPath(); ctx.arc(X, hy - 1.5, 6.2, Math.PI, 7); ctx.fill();
  if (female){ // búi đôi + trâm ngang
    ctx.fillStyle = sk.hair; ctx.beginPath(); ctx.arc(X - 3.5, hy - 7.5, 3, 0, 7); ctx.arc(X + 3.5, hy - 7.5, 3, 0, 7); ctx.fill();
    ctx.strokeStyle = sk.trim; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X - 5, hy - 9); ctx.lineTo(X + 5, hy - 6); ctx.stroke();
  } else { // nam: búi + quan vàng
    ctx.fillStyle = sk.hair; ctx.beginPath(); ctx.arc(X, hy - 8, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = sk.trim; ctx.fillRect(X - 3, hy - 12.5, 6, 3.2);
  }
  ctx.fillStyle = sk.halo; ctx.beginPath(); ctx.arc(X, hy - 2, 1.1, 0, 7); ctx.fill(); // hoa tinh giữa trán
  if (castK > 0){ // xuất chiêu: ấn triệu hồi vòng gai lóe sáng (vector, không dùng chữ Hán)
    ctx.save(); ctx.globalAlpha = castK; ctx.strokeStyle = sk.halo; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X, Y - 64, 13, 0, 7); ctx.stroke();
    for (let i = 0; i < 6; i++){
      const a = i * Math.PI / 3 + castK * 0.6;
      ctx.beginPath();
      ctx.moveTo(X + Math.cos(a)*13, Y - 64 + Math.sin(a)*13);
      ctx.lineTo(X + Math.cos(a)*21, Y - 64 + Math.sin(a)*21);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ══ NHÂN VẬT CHÍNH VẼ THEO KHỚP XƯƠNG (skeletal) — phong cách MU Online ═════
// Trước đây mỗi lớp là 1 thẻ Axie PNG tĩnh: không hướng, không khung hình.
// Nay thân người dựng bằng vector chia theo BỘ PHẬN, mỗi chi có trục xoay riêng
// (vai / hông / cổ), và animation là HÀM SỐ theo thời gian — đúng cơ chế xương
// mà MU Online dùng, không phải chuỗi ảnh. Nhờ vậy có sải chân, vung vũ khí,
// ngả người, áo choàng bay… mà không tốn một file art nào.
// Thứ tự lớp: áo choàng → chân → thân → giáp → mũ → tay → vũ khí.
// Hộp toạ độ HERO_W×HERO_H, chân chạm y≈212, tâm đầu y≈74.
const HERO_W = 160, HERO_H = 220;
const HERO_METAL = [
  { lo:'#4e5360', hi:'#6d7385', trim:'#7d7048', glow:null },      // 1 Sơ Khai — sắt xỉn
  { lo:'#575d6c', hi:'#7b8296', trim:'#8d7f4e', glow:null },      // 2 Cường Hóa
  { lo:'#616880', hi:'#8b93aa', trim:'#a08c52', glow:null },      // 3 Tinh Luyện
  { lo:'#6a7590', hi:'#9aa4bc', trim:'#c8a84a', glow:null },      // 4 Kỳ Diệu
  { lo:'#71689a', hi:'#a596c8', trim:'#c8a84a', glow:null },      // 5 Hiếm Có
  { lo:'#2f6a58', hi:'#4fa88a', trim:'#d8c060', glow:'#6ff0c0' }, // 6 Tinh Xảo — xanh ngọc
  { lo:'#6a5220', hi:'#c8a84a', trim:'#ffe9a8', glow:'#ffd76a' }, // 7 Cổ Vật — vàng cổ
  { lo:'#7a2a30', hi:'#c85a52', trim:'#ffd08a', glow:'#ff8a6a' }, // 8 Thánh Khí
  { lo:'#432a7a', hi:'#8a6ae0', trim:'#dccdff', glow:'#a88aff' }, // 9 Truyền Thuyết
  { lo:'#8a1e2a', hi:'#ff6a5a', trim:'#fff0c0', glow:'#ff4a3a' }, // 10 Thức Tỉnh
];
function hMetal(tier){ return HERO_METAL[Math.max(0, Math.min(9, ((tier|0) || 1) - 1))]; }

// ═══════════ TRANG BỊ HIỆN LÊN NGƯỜI — 4 lớp, không lớp nào là "phát sáng" ═══════════
// Đo trước khi làm: nhân vật mặc full Chí Tôn giai 10 +11 Hoàn Hảo Cổ Thần chỉ khác nhân vật
// mới tạo đúng 718/62.400 pixel (1,15%) — và toàn bộ 718 px đó là một đốm sáng cạnh bàn tay.
// Trên THÂN NGƯỜI: 0 pixel. 7/9 ô chỉ số (nón/áo/tay/quần/chân/dây chuyền/2 nhẫn) đổi đúng 0 px.
//
// Hào quang là lớp rẻ nhất nhưng cũng nông nhất: bậc nào cũng chỉ là "sáng hơn". Bốn lớp dưới
// đây thêm ĐỘ PHỨC TẠP thật, xếp theo mức dễ nhận ra từ xa:
//   A. BÓNG DÁNG  — vai giáp & chóp mũ mọc dần ⇒ đổi đường viền ngoài, thấy được cả khi thu nhỏ
//   B. CHẤT LIỆU  — chuyển sắc + dải phản quang ⇒ sắt xỉn → thép đánh bóng (không sáng hơn,
//                   mà PHẢN CHIẾU khác đi)
//   C. HOA VĂN    — số đường khảm trên ngực tăng theo bậc, tô theo màu độ hiếm ⇒ mật độ chi tiết
//   D. HÀO QUANG  — giữ, nhưng chỉ là nét hoàn thiện ở bậc cao, và nhuốm màu bộ Cổ Thần đang mặc
//
// Cả 4 lớp vẽ GENERIC trong drawHeroFigure, không đụng một dòng nào trong 6 entry HERO_GEAR.
const HERO_ARMOR_SLOTS = ['non','ao','tay','quan','chan'];
// Chữ ký ngoại hình rút từ trang bị THẬT. Trả null khi chưa có nhân vật (màn chọn lớp gọi
// heroCardUrl trước khi `player` tồn tại — đọc player.equip ở đó là crash trắng màn hình).
function gearVisual(p){
  if (!p || !p.equip) return null;
  let n = 0, tsum = 0, psum = 0, rmax = 0;
  for (const k of HERO_ARMOR_SLOTS){
    const it = p.equip[k];
    if (!it) continue;
    n++; tsum += it.tier || 1; psum += it.plus || 0; rmax = Math.max(rmax, it.rarity || 0);
  }
  const w = p.equip.vukhi;
  let setColor = null;
  for (const sid in (p.setActive || {}))
    if (((p.setActive[sid] || {}).act || []).includes(5) && ANCIENT_SETS[sid]) setColor = ANCIENT_SETS[sid].color;
  return {
    n, rarity: rmax,
    // bậc HIỆU DỤNG: bậc trung bình nhân độ phủ — mặc 3 món giai 10 không được nhìn ngang
    // với mặc đủ 5 món giai 10, nếu không thì lộ nguyên bộ giáp mà vẫn trông như full plate
    t: n ? (tsum / n) * (n / HERO_ARMOR_SLOTS.length) : 0,
    // Nhân độ phủ y như `t`. Thiếu bước này thì đeo mỗi cái mũ +11 rồi bỏ trống 4 ô vẫn
    // phát sáng ngang full +11 — lộ nguyên người mà vẫn rực như mặc đủ bộ.
    plus: n ? (psum / n) * (n / HERO_ARMOR_SLOTS.length) : 0,
    rcol: RARITIES[rmax] ? RARITIES[rmax].color : null,
    wTier: w ? (w.tier || 1) : 0,
    wPlus: w ? (w.plus || 0) : 0,
    // Định nghĩa vũ khí — để thanh trên tay nhân vật vẽ bằng CHÍNH bộ phận dựng icon.
    // Trước đây chỉ đưa ra wTier/wPlus, mà hai trường đó không ai đọc: mỗi lớp vẽ cứng
    // một thanh, nên nâng vũ khí không hiện lên người một chút nào.
    wDef: itemDef(w),
    setColor,
  };
}
// Bậc bảng màu giáp: lấy CAO HƠN giữa Thần Binh và trang bị thật. Dùng max để không ai bị
// tụt so với trước — Thần Binh vẫn giữ nguyên tác dụng cũ, trang bị nay cộng thêm đường riêng.
function heroTier(p){
  const tb = (p && p.thanbinh && p.thanbinh.tier) || 1;
  const gv = gearVisual(p);
  return clamp(Math.max(tb, gv ? Math.round(gv.t) : 0), 1, 10);
}
// ═══════════ BỘ GIÁP RIÊNG TỪNG LỚP ═══════════
// Bản đầu tôi vẽ 4 lớp GENERIC cho cả 6 lớp nhân vật — kết quả là pháp sư mặc áo choàng lại
// đeo đúng cái vai giáp tấm của hiệp sĩ, và cả 5 lớp trông như mặc chung một bộ. Sai hẳn.
//
// MU Online làm theo kiểu khác: mỗi lớp có DÒNG GIÁP RIÊNG, đổi cả tạo hình lẫn bảng màu theo
// mốc cấp, và mỗi bộ có TÊN để người chơi gọi tên nhau. Đó mới là "nhìn là biết đẳng cấp".
//
// `style` chọn bộ tạo hình (vai/mũ/chân/eo), `tint` đổi bảng màu — nên bậc vẫn đọc được qua
// màu, nhưng mỗi lớp đi theo một dải màu riêng thay vì cả 5 lớp cùng đỏ ở bậc 10.
const HERO_SETS = {
  // Dark Knight — giáp tấm nặng: sắt thô → giáp lưới → giáp tấm đen → bắt đầu có vảy → đầu rồng
  thieulam: [
    { min:1, name:'Thiết Vệ', style:'plate' },
    { min:3, name:'Giáp Xích', style:'chain',
      tint:{ lo:'#3f4654', hi:'#5f6a80', trim:'#8d8256', glow:null } },
    { min:5, name:'Hắc Giáp', style:'plate',
      tint:{ lo:'#23262f', hi:'#3d4354', trim:'#8fa6c8', glow:'#6f8ec0' } },
    { min:7, name:'Vảy Rồng', style:'drake',
      tint:{ lo:'#3a1f22', hi:'#7a3a34', trim:'#c8a84a', glow:'#c8703a' } },
    { min:9, name:'Hỏa Long', style:'hoalong',
      tint:{ lo:'#5a1418', hi:'#c0342c', trim:'#ffc24a', glow:'#ff6a2a' } },
  ],
  // Dark Wizard — VẢI, tuyệt đối không giáp tấm. Đây là lớp dễ làm sai nhất: bản nháp đầu
  // cho pháp sư đeo vai giáp tấm của hiệp sĩ, nhìn mắc cười.
  baidasan: [
    { min:1, name:'Vải Thô', style:'cloth',
      tint:{ lo:'#4a4038', hi:'#6b5c4c', trim:'#8a7a5c', glow:null } },
    { min:3, name:'Da Thú', style:'cloth',
      tint:{ lo:'#3e3228', hi:'#6a5340', trim:'#b09068', glow:null } },
    { min:5, name:'Nhân Sư', style:'sphinx',
      tint:{ lo:'#5a4a2c', hi:'#c8b070', trim:'#3ac8c0', glow:'#7ee0d8' } },
    { min:7, name:'Ma Thuật', style:'arcane',
      tint:{ lo:'#2a1f4a', hi:'#5a3f9a', trim:'#c0a0ff', glow:'#a88aff' } },
    { min:9, name:'Hư Vô', style:'arcane',
      tint:{ lo:'#160f2c', hi:'#3a2a6a', trim:'#7ecbff', glow:'#6ff0ff' } },
  ],
  // Sylvan Ranger — da nhẹ, lá & lông vũ. Vai to ngang Hỏa Long ở bậc cuối nhưng NHẸ:
  // nhiều lớp mảnh thay vì một khối đặc.
  toanchan: [
    { min:1, name:'Da Rừng', style:'hide',
      tint:{ lo:'#4a3c2c', hi:'#6e5a40', trim:'#8a7448', glow:null } },
    { min:3, name:'Lá Thép', style:'hide',
      tint:{ lo:'#2f4436', hi:'#4a6b52', trim:'#9aa858', glow:null } },
    { min:5, name:'Vỏ Sồi', style:'leaf',
      tint:{ lo:'#24402f', hi:'#3e6b4a', trim:'#8ad86a', glow:'#7ad86a' } },
    { min:7, name:'Lông Ưng', style:'plume',
      tint:{ lo:'#2a4a4a', hi:'#4e8a86', trim:'#c8f0e8', glow:'#8fe8dc' } },
    { min:9, name:'Đại Bàng Trắng', style:'plume',
      tint:{ lo:'#6a6a58', hi:'#e8e4d4', trim:'#ffd76a', glow:'#fff0c0' } },
  ],
  // Spellblade — nửa giáp LỆCH VAI suốt cả 5 dải. Đây là chữ ký của lớp, đừng làm đối xứng.
  minhgiao: [
    { min:1, name:'Bán Giáp', style:'halfplate',
      tint:{ lo:'#4a4038', hi:'#7a6a58', trim:'#9a7a4a', glow:null } },
    { min:3, name:'Giáp Lệch', style:'halfplate',
      tint:{ lo:'#4a2f26', hi:'#7a4a36', trim:'#c08a4a', glow:null } },
    { min:5, name:'Than Hồng', style:'halfplate',
      tint:{ lo:'#5a2418', hi:'#a84a28', trim:'#ffb060', glow:'#ff8a3a' } },
    { min:7, name:'Lửa Dữ', style:'halfplate',
      tint:{ lo:'#6a1e10', hi:'#d85a22', trim:'#ffd08a', glow:'#ff6a1a' } },
    { min:9, name:'Hoả Ngục', style:'halfplate',
      tint:{ lo:'#2a0d08', hi:'#ff5a1a', trim:'#fff0c0', glow:'#ffb020' } },
  ],
  // Dark Lord — nghi lễ, chỉ huy. KHÔNG gai nhọn kiểu Dark Knight: quý tộc, không phải
  // chiến binh tuyến đầu. Vai là bệ + răng lược + vải rủ.
  bug: [
    { min:1, name:'Lệnh Giáp', style:'regal',
      tint:{ lo:'#454a30', hi:'#6a7248', trim:'#8a8a58', glow:null } },
    { min:3, name:'Cận Vệ', style:'regal',
      tint:{ lo:'#3a4028', hi:'#5e6a3a', trim:'#a8a860', glow:null } },
    { min:5, name:'Vương Giáp', style:'regal',
      tint:{ lo:'#2a3020', hi:'#4a5a30', trim:'#d8c060', glow:'#c8d060' } },
    { min:7, name:'Bạo Chúa', style:'regal',
      tint:{ lo:'#1e2418', hi:'#3a4a26', trim:'#ffd76a', glow:'#d0e07a' } },
    { min:9, name:'Ngai Đen', style:'regal',
      tint:{ lo:'#100e14', hi:'#2a2a34', trim:'#ffd76a', glow:'#c8a0ff' } },
  ],
};
// Bộ giáp ứng với bậc hiệu dụng t. Trả null khi chưa mặc gì (màn chọn lớp, nhân vật mới).
function heroSet(sectKey, t){
  const line = HERO_SETS[sectKey];
  if (!line || !(t > 0)) return null;
  let best = null;
  for (const s of line) if (t >= s.min) best = s;
  return best || line[0];
}
// Bảng màu của bộ đè lên bảng màu bậc. Không có tint thì giữ nguyên HERO_METAL.
function hSetMetal(M, S){
  if (!S || !S.tint) return M;
  return { lo: S.tint.lo || M.lo, hi: S.tint.hi || M.hi,
           trim: S.tint.trim || M.trim,
           glow: S.tint.glow !== undefined ? S.tint.glow : M.glow };
}
// Nấc tạo hình 1..4 theo bậc hiệu dụng — dùng chung cho mọi bộ
function hStage(t){ return t < 4.5 ? 1 : t < 6.5 ? 2 : t < 8.5 ? 3 : 4; }

// ── A. BÓNG DÁNG: vai giáp ──
// Đây là lớp đáng giá nhất. Màu sắc và hào quang biến mất khi nhân vật nhỏ hoặc nền rối;
// đường viền ngoài thì không — cứ mọc thêm gai là từ xa vẫn biết người kia mặc đồ nặng hơn.
// Vai giáp phải đủ to để vượt RA NGOÀI đường viền cánh tay (tay vẽ tới x≈122); nằm gọn bên
// trong thì nó chỉ còn là một mảng màu, mất hẳn tác dụng đổi dáng.
function hShoulderPlate(g, M, st, w, h){
  g.fillStyle = M.hi;                                 // vòm vai
  g.beginPath();
  g.moveTo(-w * 0.55, h * 0.55);
  g.quadraticCurveTo(-w * 0.7, -h, 0, -h * 1.05);
  g.quadraticCurveTo(w * 0.85, -h * 0.9, w, h * 0.5);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                 // mặt dưới tối → ra khối, không phẳng
  g.beginPath();
  g.moveTo(-w * 0.55, h * 0.55); g.lineTo(w, h * 0.5);
  g.lineTo(w * 0.8, h * 0.95); g.lineTo(-w * 0.4, h);
  g.closePath(); g.fill();
  if (st >= 2){                                       // đường khảm chạy vòng vai
    g.strokeStyle = M.trim; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-w * 0.5, h * 0.3);
    g.quadraticCurveTo(0, -h * 0.75, w * 0.9, h * 0.28); g.stroke();
  }
  if (st >= 3){                                       // gai — phá đường viền mạnh nhất
    g.fillStyle = M.trim;
    const nS = st === 3 ? 2 : 3;
    for (let i = 0; i < nS; i++){
      const a = -0.85 + i * (1.55 / Math.max(1, nS - 1));
      const bx = Math.sin(a) * w * 0.8, by = -Math.cos(a) * h * 0.88;
      g.beginPath();
      g.moveTo(bx - 2.4, by); g.lineTo(bx + 2.4, by);
      g.lineTo(bx + Math.sin(a) * 9, by - Math.cos(a) * 9);
      g.closePath(); g.fill();
    }
  }
  if (st >= 4){                                       // vây hất ra sau ở bậc tối cao
    g.fillStyle = M.hi;
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.2); g.lineTo(w * 1.5, -h * 0.55); g.lineTo(w * 1.22, h * 0.85);
    g.closePath(); g.fill();
  }
}
// HỎA LONG — vai giáp là một cái ĐẦU RỒNG chĩa ra ngoài, không phải tấm thép. Đây là chỗ
// khác biệt lớn nhất giữa hai bộ: cùng một chỗ trên người, một bên là hình học, một bên là
// sinh vật. Nhìn từ xa vẫn phân biệt được ngay cả khi mất hết màu.
function hShoulderDragon(g, M, st, w, h){
  for (let i = 2; i >= 0; i--){                       // vảy cổ xếp lớp làm nền
    const k = 1 - i * 0.2;
    g.fillStyle = i ? M.lo : M.hi;
    g.beginPath();
    g.moveTo(-w * 0.5 * k, h * 0.55);
    g.quadraticCurveTo(-w * 0.62 * k, -h * 0.95 * k, 0, -h * 1.05 * k);
    g.quadraticCurveTo(w * 0.55 * k, -h * 0.95 * k, w * 0.62 * k, h * 0.45);
    g.closePath(); g.fill();
  }
  // Sọ NGẮN và SÂU, có gờ mày nhô che mắt. Bản đầu mõm dài w*1.42 và thuôn đều nên đọc ra
  // thành mỏ vịt — thú dữ thì mõm ngắn, trán cao, mắt lùi sâu dưới gờ mày.
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(w * 0.15, -h * 0.95);                      // gáy
  g.lineTo(w * 0.70, -h * 1.05);                      // đỉnh gờ mày
  g.lineTo(w * 1.02, -h * 0.55);                      // sống mũi dốc xuống
  g.lineTo(w * 1.14, h * 0.02);                       // chóp mõm
  g.lineTo(w * 0.95, h * 0.22);
  g.lineTo(w * 0.15, h * 0.30);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;                               // gờ mày đậm nhô ra
  g.beginPath();
  g.moveTo(w * 0.42, -h * 0.98); g.lineTo(w * 0.80, -h * 0.92);
  g.lineTo(w * 0.86, -h * 0.62); g.lineTo(w * 0.44, -h * 0.66);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                 // hàm dưới hé mở
  g.beginPath();
  g.moveTo(w * 0.30, h * 0.22); g.lineTo(w * 1.02, h * 0.20);
  g.lineTo(w * 0.92, h * 0.55); g.lineTo(w * 0.32, h * 0.52);
  g.closePath(); g.fill();
  g.fillStyle = '#f3ead6';                            // răng nanh
  for (let i = 0; i < 3; i++){
    const tx = w * (0.62 + i * 0.16);
    g.beginPath(); g.moveTo(tx, h * 0.20); g.lineTo(tx + w * 0.06, h * 0.20);
    g.lineTo(tx + w * 0.03, h * 0.42); g.closePath(); g.fill();
  }
  g.fillStyle = M.glow || '#ffb060';                  // mắt rực, lùi sâu dưới gờ mày
  g.beginPath(); g.ellipse(w * 0.66, -h * 0.50, w * 0.09, h * 0.08, 0, 0, 7); g.fill();
  g.fillStyle = '#2a0d0d';                            // lỗ mũi
  g.beginPath(); g.ellipse(w * 1.00, -h * 0.18, w * 0.045, h * 0.05, 0.3, 0, 7); g.fill();
  g.fillStyle = M.trim;                               // sừng vuốt ngược ra sau
  g.beginPath();
  g.moveTo(w * 0.42, -h * 0.72);
  g.quadraticCurveTo(w * 0.15, -h * 1.85, -w * 0.55, -h * 1.75);
  g.quadraticCurveTo(w * 0.05, -h * 1.45, w * 0.20, -h * 0.62);
  g.closePath(); g.fill();
  if (st >= 2){
    g.beginPath();
    g.moveTo(w * 0.62, -h * 0.62);
    g.quadraticCurveTo(w * 0.55, -h * 1.35, w * 0.05, -h * 1.42);
    g.quadraticCurveTo(w * 0.50, -h * 1.05, w * 0.50, -h * 0.50);
    g.closePath(); g.fill();
  }
  if (st >= 3){                                       // lửa phun khỏi mõm
    const fl = M.glow || '#ff7a3a';
    for (let i = 0; i < 3; i++){
      g.globalAlpha = 0.85 - i * 0.22;
      g.fillStyle = i ? fl : '#ffe9a8';
      const L = w * (0.5 + i * 0.45), sp = h * (0.16 + i * 0.13);
      g.beginPath();
      g.moveTo(w * 1.05, h * 0.26);
      g.quadraticCurveTo(w * 1.05 + L * 0.6, h * 0.26 - sp, w * 1.05 + L, h * 0.32);
      g.quadraticCurveTo(w * 1.05 + L * 0.6, h * 0.32 + sp, w * 1.05, h * 0.44);
      g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  }
}
// ── VAI: các bộ tạo hình còn lại ──
// Dark Knight II — giáp lưới: tấm vai gọn + lưới xích rủ xuống
function hShoulderChain(g, M, st, w, h){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(-w * 0.5, h * 0.4);
  g.quadraticCurveTo(-w * 0.6, -h * 0.85, 0, -h * 0.95);
  g.quadraticCurveTo(w * 0.8, -h * 0.8, w * 0.88, h * 0.35);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                  // lưới xích: chấm so le
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++){
    g.beginPath();
    g.arc(-w * 0.35 + i * w * 0.3, h * 0.5 + r * 4.5 + (i % 2) * 2.2, 2.1, 0, 7);
    g.fill();
  }
  if (st >= 2){                                        // đinh tán
    g.fillStyle = M.trim;
    for (let i = 0; i < 3; i++){ g.beginPath(); g.arc(-w * 0.2 + i * w * 0.4, -h * 0.35, 1.8, 0, 7); g.fill(); }
  }
}
// Dark Knight IV — dải CHUYỂN TIẾP: vảy bắt đầu mọc ở mép, sừng cong nhẹ. Nửa hình học
// nửa sinh vật, để bước sang Hỏa Long không bị hẫng.
function hShoulderDrake(g, M, st, w, h){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(-w * 0.5, h * 0.5);
  g.quadraticCurveTo(-w * 0.65, -h * 0.9, 0, -h);
  g.quadraticCurveTo(w * 0.85, -h * 0.85, w * 0.95, h * 0.4);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                  // mép vảy
  for (let i = 0; i < 4; i++){
    const x = -w * 0.4 + i * w * 0.36;
    g.beginPath(); g.moveTo(x, h * 0.35);
    g.quadraticCurveTo(x + w * 0.18, h * 0.85, x + w * 0.36, h * 0.35);
    g.closePath(); g.fill();
  }
  g.fillStyle = M.trim;                                // sừng cong
  g.beginPath();
  g.moveTo(w * 0.3, -h * 0.85);
  g.quadraticCurveTo(w * 0.95, -h * 1.5, w * 1.25, -h * 0.85);
  g.quadraticCurveTo(w * 0.8, -h * 1.1, w * 0.45, -h * 0.7);
  g.closePath(); g.fill();
  if (st >= 3){
    g.beginPath();
    g.moveTo(-w * 0.1, -h * 0.95);
    g.quadraticCurveTo(w * 0.2, -h * 1.6, w * 0.55, -h * 1.15);
    g.quadraticCurveTo(w * 0.2, -h * 1.2, -w * 0.05, -h * 0.8);
    g.closePath(); g.fill();
  }
}
// Dark Wizard I-II — VẢI/LÔNG, tuyệt đối không kim loại. Đây là chỗ bản nháp trước sai:
// pháp sư mặc áo choàng mà đeo vai giáp tấm của hiệp sĩ.
function hShoulderCloth(g, M, st, w, h){
  g.fillStyle = M.lo;                                  // cụm vải rủ
  g.beginPath();
  g.moveTo(-w * 0.45, -h * 0.3);
  g.quadraticCurveTo(w * 0.1, -h * 0.85, w * 0.75, -h * 0.05);
  g.quadraticCurveTo(w * 0.5, h * 0.95, -w * 0.3, h * 0.7);
  g.closePath(); g.fill();
  g.fillStyle = M.hi;                                  // tua lông thú
  const n = 3 + st;
  for (let i = 0; i < n; i++){
    const a = -0.5 + i * (1.5 / Math.max(1, n - 1));
    const bx = Math.sin(a) * w * 0.6, by = -Math.cos(a) * h * 0.5;
    g.beginPath();
    g.moveTo(bx, by);
    g.quadraticCurveTo(bx + w * 0.25, by + h * 0.35, bx + w * 0.1, by + h * 0.9);
    g.quadraticCurveTo(bx - w * 0.05, by + h * 0.4, bx - w * 0.12, by);
    g.closePath(); g.fill();
  }
}
// Dark Wizard III — Nhân Sư: vạt vải CỨNG kẻ sọc kiểu Ai Cập, vẫn không phải tấm giáp
function hShoulderSphinx(g, M, st, w, h){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(-w * 0.4, -h * 0.4); g.lineTo(w * 0.55, -h * 0.55);
  g.lineTo(w * 0.95, h * 0.9); g.lineTo(-w * 0.25, h * 0.75);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;                                // sọc ngang
  for (let i = 0; i < 3; i++){
    const y = -h * 0.15 + i * h * 0.42;
    g.beginPath();
    g.moveTo(-w * 0.32, y); g.lineTo(w * (0.68 + i * 0.08), y - h * 0.06);
    g.lineTo(w * (0.7 + i * 0.08), y + h * 0.14); g.lineTo(-w * 0.3, y + h * 0.2);
    g.closePath(); g.fill();
  }
  if (st >= 2){                                        // khoen kim loại ở đỉnh
    g.beginPath(); g.ellipse(w * 0.1, -h * 0.55, w * 0.4, h * 0.16, -0.12, 0, 7); g.fill();
  }
}
// Dark Wizard IV-V — mảnh phép LƠ LỬNG thay hẳn cho vai giáp
function hShoulderArcane(g, M, st, w, h){
  if (M.glow){                                         // quầng sáng nền
    g.save(); g.globalAlpha = 0.42; g.fillStyle = M.glow;
    g.beginPath(); g.ellipse(w * 0.4, -h * 0.5, w * 0.85, h, 0, 0, 7); g.fill(); g.restore();
  }
  g.fillStyle = M.hi;
  const n = 2 + st;
  for (let i = 0; i < n; i++){
    const a = -1.0 + i * (2.0 / Math.max(1, n - 1));
    const r = w * (0.85 + (i % 2) * 0.35);
    const x = Math.sin(a) * r, y = -Math.cos(a) * h * 1.25, sz = 3 + st * 0.9;
    g.beginPath();
    g.moveTo(x, y - sz * 1.7); g.lineTo(x + sz * 0.75, y);
    g.lineTo(x, y + sz * 1.7); g.lineTo(x - sz * 0.75, y);
    g.closePath(); g.fill();
  }
}
// Sylvan Ranger I-II — miếng da tròn khâu chỉ
function hShoulderHide(g, M, st, w, h){
  g.fillStyle = M.hi;
  g.beginPath(); g.ellipse(w * 0.2, -h * 0.05, w * 0.72, h * 0.72, -0.15, 0, 7); g.fill();
  g.fillStyle = M.lo;
  g.beginPath(); g.ellipse(w * 0.28, h * 0.2, w * 0.6, h * 0.42, -0.15, 0, 7); g.fill();
  g.strokeStyle = M.trim; g.lineWidth = 1; g.setLineDash([2, 2]);
  g.beginPath(); g.ellipse(w * 0.2, -h * 0.05, w * 0.55, h * 0.55, -0.15, 0, 7); g.stroke();
  g.setLineDash([]);
  if (st >= 3){                                        // tấm lá kim loại khâu thêm
    g.fillStyle = M.trim;
    for (const d of [-0.4, 0.25]){
      g.beginPath(); g.ellipse(w * 0.55, h * d, w * 0.22, h * 0.34, 0.5, 0, 7); g.fill();
    }
  }
}
// Sylvan Ranger III — lá xếp lớp
function hShoulderLeaf(g, M, st, w, h){
  const n = 2 + st;
  for (let i = n - 1; i >= 0; i--){
    g.fillStyle = i % 2 ? M.lo : M.hi;
    const k = 1 - i * 0.12;
    g.save(); g.rotate(-0.45 + i * 0.24);
    g.beginPath();
    g.moveTo(-w * 0.1, 0);
    g.quadraticCurveTo(w * 0.45 * k, -h * 0.6 * k, w * 1.05 * k, 0);
    g.quadraticCurveTo(w * 0.45 * k, h * 0.6 * k, -w * 0.1, 0);
    g.closePath(); g.fill();
    g.restore();
  }
  g.strokeStyle = M.trim; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, h * 0.15); g.lineTo(w * 0.95, -h * 0.2); g.stroke();
}
// Sylvan Ranger IV-V — cụm lông vũ hất ra sau. To ngang vai giáp Hỏa Long nhưng NHẸ:
// nhiều lớp mảnh thay vì một khối đặc.
function hShoulderPlume(g, M, st, w, h){
  const n = 3 + st;
  for (let i = n - 1; i >= 0; i--){
    g.fillStyle = i % 2 ? M.lo : M.hi;
    const L = w * (1.5 - i * 0.12), W = h * (0.30 - i * 0.02);
    g.save(); g.rotate(-0.15 - i * 0.2);
    g.beginPath();
    g.moveTo(-w * 0.15, 0);
    g.quadraticCurveTo(L * 0.5, -W, L, -W * 0.25);
    g.quadraticCurveTo(L * 0.55, W * 0.55, -w * 0.15, W * 0.5);
    g.closePath(); g.fill();
    g.restore();
  }
  g.fillStyle = M.trim;                                // gốc lông bọc kim loại
  g.beginPath(); g.ellipse(-w * 0.05, h * 0.05, w * 0.3, h * 0.45, 0, 0, 7); g.fill();
}
// Spellblade — LỆCH VAI: một bên giáp dày, một bên trần. Đây là chữ ký của lớp, giữ suốt
// cả 5 dải. Hàm nhận `side` và CỐ Ý vẽ khác nhau hai bên.
function hShoulderHalf(g, M, st, w, h, side){
  if (side > 0){                                       // bên TRẦN — chỉ còn dây đai chéo
    g.fillStyle = M.lo;
    g.beginPath();
    g.moveTo(-w * 0.5, -h * 0.15); g.lineTo(-w * 0.15, -h * 0.35);
    g.lineTo(w * 0.1, h * 0.9); g.lineTo(-w * 0.25, h * 1.05);
    g.closePath(); g.fill();
    if (st >= 3){                                      // vết cháy trên da trần
      g.save(); g.globalAlpha = 0.5; g.fillStyle = M.glow || '#ff7a3a';
      for (let i = 0; i < 3; i++){
        g.beginPath(); g.ellipse(w * 0.2 + i * w * 0.16, -h * 0.1 + i * h * 0.3, 1.6, 3.2, 0.4, 0, 7); g.fill();
      }
      g.restore();
    }
    return;
  }
  g.fillStyle = M.hi;                                  // bên CÓ giáp — dày hơn plate thường
  g.beginPath();
  g.moveTo(-w * 0.55, h * 0.55);
  g.quadraticCurveTo(-w * 0.7, -h * 1.05, 0, -h * 1.15);
  g.quadraticCurveTo(w * 0.9, -h * 0.95, w * 1.05, h * 0.5);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;
  g.beginPath();
  g.moveTo(-w * 0.55, h * 0.55); g.lineTo(w * 1.05, h * 0.5);
  g.lineTo(w * 0.85, h); g.lineTo(-w * 0.4, h * 1.05);
  g.closePath(); g.fill();
  if (st >= 2){                                        // lửa liếm dọc vai
    g.fillStyle = M.glow || M.trim;
    const n = 1 + st;
    for (let i = 0; i < n; i++){
      const a = -0.7 + i * (1.4 / Math.max(1, n - 1));
      const bx = Math.sin(a) * w * 0.72, by = -Math.cos(a) * h * 0.95, L = 7 + st * 3.5;
      g.beginPath();
      g.moveTo(bx - 2.2, by);
      g.quadraticCurveTo(bx + Math.sin(a) * L * 0.4 - 3.2, by - Math.cos(a) * L * 0.7,
                         bx + Math.sin(a) * L, by - Math.cos(a) * L);
      g.quadraticCurveTo(bx + Math.sin(a) * L * 0.5 + 3.2, by - Math.cos(a) * L * 0.5, bx + 2.2, by);
      g.closePath(); g.fill();
    }
  }
}
// Dark Lord — bệ vai nghi lễ: răng lược + vải rủ. KHÔNG gai nhọn kiểu Dark Knight;
// Dark Lord là quý tộc chỉ huy, không phải chiến binh tuyến đầu.
function hShoulderRegal(g, M, st, w, h){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(-w * 0.5, h * 0.35); g.lineTo(-w * 0.4, -h * 0.7);
  g.lineTo(w * 0.95, -h * 0.5); g.lineTo(w * 0.88, h * 0.45);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;                                // răng lược
  const n = 2 + st;
  for (let i = 0; i < n; i++){
    const x = -w * 0.3 + i * (w * 1.05 / n), hh = h * (0.5 + (i % 2) * 0.25);
    g.beginPath();
    g.moveTo(x, -h * 0.6); g.lineTo(x + w * 0.15, -h * 0.62);
    g.lineTo(x + w * 0.075, -h * 0.6 - hh);
    g.closePath(); g.fill();
  }
  g.fillStyle = M.lo; g.globalAlpha = 0.92;            // vải rủ
  g.beginPath();
  g.moveTo(-w * 0.4, h * 0.35); g.lineTo(w * 0.88, h * 0.42);
  g.quadraticCurveTo(w * 0.62, h * (1.5 + st * 0.28), -w * 0.12, h * (1.25 + st * 0.22));
  g.closePath(); g.fill();
  g.globalAlpha = 1;
}

// ── CHÓP MŨ: các bộ còn lại ──
// Dark Wizard I-II — mũ TRÙM mềm rủ che nửa mặt. Pháp sư không đội mũ sắt.
function hCrestHood(g, M, st, ps){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(58, 82);
  g.quadraticCurveTo(56, 48, 80, 44);
  g.quadraticCurveTo(104, 48, 102, 82);
  g.quadraticCurveTo(80, 74, 58, 82);
  g.closePath(); g.fill();
  if (!ps.back){
    g.fillStyle = 'rgba(0,0,0,.55)';                   // bóng trong mũ trùm nuốt mất khuôn mặt
    g.beginPath(); g.ellipse(80, 72, 15, 13, 0, 0, 7); g.fill();
    if (st >= 2){                                      // chỉ còn hai đốm mắt trong bóng tối
      g.fillStyle = M.glow || '#a88aff';
      g.beginPath(); g.ellipse(74, 72, 2.4, 2.8, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(86, 72, 2.4, 2.8, 0, 0, 7); g.fill();
    }
  }
  g.fillStyle = M.lo;                                  // chóp mũ rủ ra sau
  g.beginPath();
  g.moveTo(74, 48); g.lineTo(86, 48);
  g.quadraticCurveTo(82, 34, 70 - st * 2, 32);
  g.quadraticCurveTo(74, 42, 74, 48);
  g.closePath(); g.fill();
}
// Dark Wizard III — Nhân Sư: mũ nemes hai vạt vải cứng xoè hai bên má, kẻ sọc, rắn hổ mang
function hCrestNemes(g, M, st, ps){
  g.fillStyle = M.hi;
  for (const s of [-1, 1]){
    g.beginPath();
    g.moveTo(80 + s * 8, 54); g.lineTo(80 + s * 26, 66);
    g.lineTo(80 + s * 22, 94); g.lineTo(80 + s * 9, 88);
    g.closePath(); g.fill();
  }
  g.fillStyle = M.trim;                                // sọc ngang đặc trưng
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++){
    const y = 68 + i * 8;
    g.beginPath();
    g.moveTo(80 + s * 10, y); g.lineTo(80 + s * (24 - i * 1.5), y + 2.5);
    g.lineTo(80 + s * (24 - i * 1.5), y + 5); g.lineTo(80 + s * 10, y + 3);
    g.closePath(); g.fill();
  }
  g.beginPath();                                       // vành trán
  g.moveTo(60, 58); g.lineTo(100, 58); g.lineTo(98, 64); g.lineTo(62, 64);
  g.closePath(); g.fill();
  if (!ps.back && st >= 2){                            // rắn hổ mang dựng giữa trán
    g.fillStyle = M.glow || '#7ee0d8';
    g.beginPath();
    g.moveTo(80, 58); g.quadraticCurveTo(75, 48, 80, 44);
    g.quadraticCurveTo(85, 48, 80, 58);
    g.closePath(); g.fill();
  }
}
// Dark Wizard IV-V — mũ nhọn cao + vòng hào quang sau đầu
function hCrestHalo(g, M, st, ps){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(60, 60);
  g.quadraticCurveTo(74, 40 - st * 5, 83, 30 - st * 6);
  g.quadraticCurveTo(88, 46, 100, 60);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                  // vành mũ
  g.beginPath(); g.ellipse(80, 60, 24, 5.5, 0, 0, 7); g.fill();
  if (st >= 2){                                        // vòng hào quang — nét hở, không phải đĩa đặc
    g.save();
    g.strokeStyle = M.glow || '#7ecbff'; g.lineWidth = 2.2; g.globalAlpha = 0.85;
    g.beginPath(); g.ellipse(80, 62, 26, 9, 0, 0, 7); g.stroke();
    g.restore();
  }
  if (st >= 3 && !ps.back){                            // rune trên vành
    g.fillStyle = M.glow || '#7ecbff';
    for (let i = 0; i < 3; i++){ g.beginPath(); g.arc(70 + i * 10, 60, 1.6, 0, 7); g.fill(); }
  }
}
// Sylvan Ranger I-II — mũ da mềm có vành + một chiếc lông cắm nghiêng
function hCrestCap(g, M, st, _ps){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(61, 62); g.quadraticCurveTo(80, 44, 99, 62);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;
  g.beginPath(); g.ellipse(80, 62, 23, 4.5, 0, 0, 7); g.fill();
  if (st >= 2){
    g.fillStyle = M.trim;
    g.beginPath();
    g.moveTo(94, 58);
    g.quadraticCurveTo(110, 46, 114, 34);
    g.quadraticCurveTo(104, 46, 93, 55);
    g.closePath(); g.fill();
  }
}
// Sylvan Ranger III — hai chiếc lá dựng như sừng nai non
function hCrestLeaf(g, M, st, _ps){
  g.fillStyle = M.hi;
  for (const s of [-1, 1]){
    g.beginPath();
    g.moveTo(80 + s * 10, 62);
    g.quadraticCurveTo(80 + s * 24, 48, 80 + s * 16, 32 - st * 3);
    g.quadraticCurveTo(80 + s * 12, 48, 80 + s * 7, 62);
    g.closePath(); g.fill();
    g.strokeStyle = M.trim; g.lineWidth = 1;
    g.beginPath(); g.moveTo(80 + s * 9, 60); g.lineTo(80 + s * 16, 34 - st * 3); g.stroke();
  }
  g.fillStyle = M.lo;                                  // dây quấn trán
  g.beginPath();
  g.moveTo(61, 60); g.lineTo(99, 60); g.lineTo(98, 65); g.lineTo(62, 65);
  g.closePath(); g.fill();
}
// Sylvan Ranger IV-V — vương miện gạc nai. Nhánh phụ mọc thêm theo bậc.
function hCrestAntler(g, M, st, _ps){
  g.fillStyle = M.hi;
  for (const s of [-1, 1]){
    g.beginPath();
    g.moveTo(80 + s * 11, 62);
    g.quadraticCurveTo(80 + s * 20, 44, 80 + s * 17, 26 - st * 2);
    g.quadraticCurveTo(80 + s * 15, 44, 80 + s * 8, 62);
    g.closePath(); g.fill();
    for (let i = 0; i < 1 + Math.min(2, st - 1); i++){
      const y = 48 - i * 10;
      g.beginPath();
      g.moveTo(80 + s * 17, y);
      g.quadraticCurveTo(80 + s * 30, y - 6, 80 + s * 33, y - 14);
      g.quadraticCurveTo(80 + s * 26, y - 4, 80 + s * 16, y + 3);
      g.closePath(); g.fill();
    }
  }
  g.fillStyle = M.trim;
  g.beginPath();
  g.moveTo(60, 59); g.lineTo(100, 59); g.lineTo(98, 66); g.lineTo(62, 66);
  g.closePath(); g.fill();
}
// Spellblade — mặt nạ NỬA MẶT, khe mắt rực, mào lửa. Cùng lối lệch như vai giáp.
function hCrestHalfMask(g, M, st, ps){
  if (!ps.back){
    g.fillStyle = M.hi;
    g.beginPath();
    g.moveTo(60, 60); g.lineTo(82, 58); g.lineTo(82, 88); g.lineTo(62, 84);
    g.closePath(); g.fill();
    g.fillStyle = M.glow || '#ff8a3a';
    g.beginPath();
    g.moveTo(64, 71); g.lineTo(78, 69); g.lineTo(78, 75); g.lineTo(64, 76);
    g.closePath(); g.fill();
    if (st >= 3){                                      // vết nứt để lộ lửa bên trong
      g.strokeStyle = M.glow || '#ffb020'; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(68, 60); g.lineTo(72, 68); g.lineTo(66, 78); g.stroke();
    }
  } else {
    g.fillStyle = M.lo;
    g.beginPath(); g.ellipse(80, 72, 20, 15, 0, 0, 7); g.fill();
  }
  if (st >= 2){                                        // mào lửa trên đỉnh
    g.fillStyle = M.glow || M.trim;
    for (let i = 0; i < 3; i++){
      const x = 72 + i * 8, hh = 14 + st * 3 - Math.abs(i - 1) * 5;
      g.beginPath();
      g.moveTo(x - 3, 56);
      g.quadraticCurveTo(x + 2, 56 - hh * 0.6, x, 56 - hh);
      g.quadraticCurveTo(x - 1, 56 - hh * 0.5, x + 3, 56);
      g.closePath(); g.fill();
    }
  }
}
// Dark Lord — vương miện. Bậc tối cao thì nó LƠ LỬNG cách đầu vài pixel, không chạm.
function hCrestCrown(g, M, st, ps){
  const lift = st >= 4 ? 5 : 0;
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(59, 58 - lift); g.lineTo(101, 58 - lift);
  g.lineTo(99, 48 - lift); g.lineTo(61, 48 - lift);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;
  const n = st >= 3 ? 5 : 3, mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++){
    const x = 64 + i * (32 / (n - 1));
    const hh = 12 + st * 2.5 - (i === mid ? -5 : Math.abs(i - mid) * 3);
    g.beginPath();
    g.moveTo(x - 3.2, 50 - lift); g.lineTo(x + 3.2, 50 - lift);
    g.lineTo(x, 50 - lift - hh);
    g.closePath(); g.fill();
  }
  if (st >= 3 && !ps.back){                            // mạng che mặt bằng dây kim loại
    g.save(); g.strokeStyle = M.trim; g.lineWidth = 0.9; g.globalAlpha = 0.75;
    for (let i = 0; i < 4; i++){
      g.beginPath(); g.moveTo(66 + i * 9, 60 - lift); g.lineTo(64 + i * 9, 84); g.stroke();
    }
    g.restore();
  }
}

// ── GIÁP CHÂN: các bộ còn lại ──
// Sylvan Ranger — giày nhẹ, dây quấn, cựa sau gót
function hGreaveLight(g, M, st, x0, dir){
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(x0 + dir * 2, 182); g.lineTo(x0 + dir * 17, 182);
  g.lineTo(x0 + dir * 18, 200); g.lineTo(x0 + dir * 1, 200);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                  // hai dây quấn ống chân
  for (let i = 0; i < 2; i++){
    const y = 170 + i * 7;
    g.beginPath();
    g.moveTo(x0 + dir * 1, y); g.lineTo(x0 + dir * 17, y - 2);
    g.lineTo(x0 + dir * 17, y + 2.6); g.lineTo(x0 + dir * 1, y + 4.6);
    g.closePath(); g.fill();
  }
  if (st >= 2){
    g.fillStyle = M.trim;
    g.beginPath(); g.ellipse(x0 + dir * 10, 176, 6.5, 9, dir * 0.35, 0, 7); g.fill();
  }
  if (st >= 3){                                        // cựa sau gót
    g.fillStyle = M.trim;
    g.beginPath();
    g.moveTo(x0 + dir * 2, 202); g.lineTo(x0 + dir * 2, 210); g.lineTo(x0 - dir * 7, 208);
    g.closePath(); g.fill();
  }
}
// Dark Wizard — gấu áo choàng phủ xuống, KHÔNG có kim loại. Bậc cao thì gấu tan thành khói.
function hGreaveRobe(g, M, st, x0, dir){
  g.fillStyle = M.lo;
  g.beginPath();
  g.moveTo(x0, 168);
  g.quadraticCurveTo(x0 + dir * 20, 178, x0 + dir * 19, 202);
  g.lineTo(x0 + dir * 1, 200);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;                                // viền thêu ở gấu
  g.beginPath();
  g.moveTo(x0 + dir * 1, 196); g.lineTo(x0 + dir * 19, 198);
  g.lineTo(x0 + dir * 19, 202); g.lineTo(x0 + dir * 1, 200);
  g.closePath(); g.fill();
  if (st >= 3){
    g.save(); g.fillStyle = M.lo;
    for (let i = 0; i < 3; i++){
      g.globalAlpha = 0.5 - i * 0.14;
      g.beginPath(); g.ellipse(x0 + dir * (4 + i * 6), 206 + i * 3, 4.5, 3, 0, 0, 7); g.fill();
    }
    g.restore();
  }
}

// ── ĐAI LƯNG: các bộ còn lại ──
// Dark Wizard — đai vải quấn chéo, nút thắt lệch, đuôi đai rủ
function hBeltSash(g, M, st){
  g.fillStyle = M.lo;
  g.beginPath();
  g.moveTo(54, 140); g.lineTo(106, 136); g.lineTo(106, 148); g.lineTo(54, 152);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;
  g.beginPath(); g.ellipse(96, 143, 6.5, 5.5, 0.2, 0, 7); g.fill();
  g.fillStyle = M.lo;                                  // đuôi đai — dài thêm theo bậc
  g.beginPath();
  g.moveTo(94, 147); g.lineTo(103, 146);
  g.quadraticCurveTo(101, 166 + st * 5, 92, 172 + st * 5);
  g.quadraticCurveTo(93, 158, 90, 148);
  g.closePath(); g.fill();
  if (st >= 2){                                        // rune chạy dọc đai
    g.fillStyle = M.glow || M.trim;
    for (let i = 0; i < 4; i++){ g.beginPath(); g.arc(60 + i * 11, 145 - i * 0.8, 1.5, 0, 7); g.fill(); }
  }
}
// Sylvan Ranger — váy lá/lông so le
function hBeltLeafSkirt(g, M, st){
  g.fillStyle = M.lo; g.fillRect(56, 139, 48, 6);
  const n = 4 + st;
  for (let i = 0; i < n; i++){
    const x = 58 + i * (48 / n);
    g.fillStyle = i % 2 ? M.hi : M.lo;
    g.beginPath();
    g.moveTo(x, 145);
    g.quadraticCurveTo(x + 7, 152, x + 3.5, 162 + st * 2);
    g.quadraticCurveTo(x, 152, x - 3, 145);
    g.closePath(); g.fill();
  }
  g.fillStyle = M.trim;
  g.beginPath(); g.ellipse(80, 142, 5.5, 4.5, 0, 0, 7); g.fill();
}
// Dark Lord — đai bản rộng + huy hiệu + vải rủ dài giữa hai chân
function hBeltDrape(g, M, st){
  g.fillStyle = M.lo; g.fillRect(53, 136, 54, 11 + st);
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(80, 132); g.lineTo(90, 141); g.lineTo(85, 154); g.lineTo(75, 154); g.lineTo(70, 141);
  g.closePath(); g.fill();
  g.fillStyle = M.trim;
  g.beginPath(); g.ellipse(80, 143, 3.6, 4.6, 0, 0, 7); g.fill();
  g.save(); g.fillStyle = M.lo; g.globalAlpha = 0.94;
  g.beginPath();
  g.moveTo(70, 150); g.lineTo(90, 150);
  g.quadraticCurveTo(88, 176 + st * 8, 80, 184 + st * 9);
  g.quadraticCurveTo(72, 176 + st * 8, 70, 150);
  g.closePath(); g.fill();
  g.restore();
  if (st >= 2){                                        // tua kim loại ở gấu vải
    g.fillStyle = M.trim;
    for (let i = 0; i < 3; i++){ g.beginPath(); g.arc(74 + i * 6, 182 + st * 8, 1.8, 0, 7); g.fill(); }
  }
}
// Spellblade — CHỈ MỘT tấm hông, khoá lệch. Cùng chữ ký lệch như vai giáp và mặt nạ.
function hBeltHalf(g, M, st){
  g.fillStyle = M.lo; g.fillRect(56, 138, 48, 7 + st);
  g.fillStyle = M.trim;
  g.beginPath();
  g.moveTo(68, 136); g.lineTo(77, 143); g.lineTo(70, 152); g.lineTo(62, 143);
  g.closePath(); g.fill();
  g.fillStyle = M.hi;
  g.beginPath();
  g.moveTo(64, 145); g.lineTo(49, 145);
  g.lineTo(53, 166 + st * 3); g.lineTo(65, 161 + st * 2);
  g.closePath(); g.fill();
  if (st >= 3){                                        // mép ửng đỏ như còn nóng
    g.save(); g.fillStyle = M.glow || '#ff7a3a'; g.globalAlpha = 0.6;
    g.beginPath();
    g.moveTo(53, 166 + st * 3); g.lineTo(65, 161 + st * 2);
    g.lineTo(64, 165 + st * 2); g.lineTo(52, 170 + st * 3);
    g.closePath(); g.fill(); g.restore();
  }
}

const SET_SHOULDER = {
  plate: hShoulderPlate, chain: hShoulderChain, drake: hShoulderDrake, hoalong: hShoulderDragon,
  cloth: hShoulderCloth, sphinx: hShoulderSphinx, arcane: hShoulderArcane,
  hide: hShoulderHide, leaf: hShoulderLeaf, plume: hShoulderPlume,
  halfplate: hShoulderHalf, regal: hShoulderRegal,
};
function hPauldrons(g, M, gv, S, ps){
  const t = gv ? gv.t : 0;
  const _style = (S && S.style) || 'plate';
  // Spellblade vào sớm hơn: chữ ký của lớp là LỆCH VAI (một bên giáp, một bên trần), mà dải I
  // của nó tên là "Bán Giáp" — chặn ở 2.5 thì dải đó không có vai nào cả và cái tên nói dối.
  if (t < (_style === 'halfplate' ? 1.2 : 2.5)) return;
  const st = hStage(t), fn = SET_SHOULDER[_style] || hShoulderPlate;
  const dragon = _style === 'hoalong';
  for (const side of [-1, 1]){
    // Xoay quanh KHỚP VAI theo ~35% góc cánh tay. Trước đây vai giáp chỉ nằm trong khớp
    // `lean` nên vung tay mà tấm vai đứng im như dán lên ngực. Giáp thật gắn vào bả vai nên
    // đi theo tay, chỉ ít hơn vì nó nặng và có dây buộc giữ lại.
    const _J = side < 0 ? HERO_JOINT.shL : HERO_JOINT.shR;
    const _arm = ps ? (side < 0 ? ps.armL : ps.armR) : 0;
    g.save();
    g.translate(_J[0], _J[1]); g.rotate(_arm * 0.35); g.translate(-_J[0], -_J[1]);
    g.translate(80 + side * 29, 98);
    g.scale(side, 1);                                 // vẽ một bên rồi soi gương
    // đầu rồng cần khung hẹp hơn tấm thép, nếu không mõm thò quá xa khỏi khung 160px
    const w = dragon ? 12 + st * 2.6 : 14 + st * 3.4;
    const h = dragon ? 9 + st * 2.1 : 9 + st * 2.4;
    const rim = plusRim(M, gv);
    if (rim){   // viền cường hoá: chính hình đó, to hơn 12%, màu sáng, nằm dưới
      g.save(); g.globalAlpha = 0.34 + clamp(((gv.plus || 0) - 3) / 8, 0, 1) * 0.34; g.scale(1.12, 1.12);
      fn(g, { lo:rim, hi:rim, trim:rim, glow:rim }, st, w, h, side);
      g.restore();
    }
    fn(g, M, st, w, h, side);
    g.restore();
  }
}

// ── A. BÓNG DÁNG: chóp mũ ──
function hCrestHorn(g, M, st, ps){
  const hh = 7 + st * 4;
  g.fillStyle = M.trim;                               // sống mũ dựng đứng
  g.beginPath(); g.moveTo(80, 56 - hh); g.lineTo(85, 58); g.lineTo(75, 58); g.closePath(); g.fill();
  if (st >= 2){                                       // sừng hai bên
    g.fillStyle = M.hi;
    for (const s of [-1, 1]){
      g.beginPath();
      g.moveTo(80 + s * 15, 62);
      g.quadraticCurveTo(80 + s * 26, 54, 80 + s * 23, 42);
      g.quadraticCurveTo(80 + s * 20, 52, 80 + s * 11, 64);
      g.closePath(); g.fill();
    }
  }
  // ngọc trán: mặt trước mới có — quay lưng mà vẫn vẽ thì thành nhãn dán trên gáy
  if (st >= 3 && !ps.back){
    g.fillStyle = M.glow || M.trim;
    g.beginPath(); g.ellipse(80, 62, 3.4, 4.2, 0, 0, 7); g.fill();
  }
}
// HỎA LONG — mũ rồng: sừng lớn vuốt ngược, vây sống giữa, khe mắt rực thay cho ngọc trán
function hCrestDragon(g, M, st, ps){
  g.fillStyle = M.hi;
  for (const s of [-1, 1]){
    g.beginPath();                                    // sừng chính
    g.moveTo(80 + s * 13, 66);
    g.quadraticCurveTo(80 + s * 34, 58, 80 + s * 33, 34);
    g.quadraticCurveTo(80 + s * 27, 50, 80 + s * 17, 60);
    g.closePath(); g.fill();
    if (st >= 2){                                     // sừng phụ thấp hơn
      g.beginPath();
      g.moveTo(80 + s * 15, 70);
      g.quadraticCurveTo(80 + s * 30, 70, 80 + s * 32, 56);
      g.quadraticCurveTo(80 + s * 24, 64, 80 + s * 16, 66);
      g.closePath(); g.fill();
    }
  }
  g.fillStyle = M.trim;                               // vây sống chạy dọc đỉnh mũ
  for (let i = 0; i < 3; i++){
    const hh = 16 + st * 4 - i * 4.5, y0 = 56 + i * 5;
    g.beginPath();
    g.moveTo(80 - 3.4, y0); g.lineTo(80 + 3.4, y0); g.lineTo(80, y0 - hh);
    g.closePath(); g.fill();
  }
  if (!ps.back){                                      // khe mắt rực — chỉ mặt trước
    g.fillStyle = M.glow || '#ff7a3a';
    g.beginPath(); g.moveTo(70, 73); g.lineTo(78, 71); g.lineTo(78, 76); g.lineTo(70, 77);
    g.closePath(); g.fill();
    g.beginPath(); g.moveTo(90, 73); g.lineTo(82, 71); g.lineTo(82, 76); g.lineTo(90, 77);
    g.closePath(); g.fill();
  }
}
const SET_CREST = {
  plate: hCrestHorn, chain: hCrestHorn, drake: hCrestDragon, hoalong: hCrestDragon,
  cloth: hCrestHood, sphinx: hCrestNemes, arcane: hCrestHalo,
  hide: hCrestCap, leaf: hCrestLeaf, plume: hCrestAntler,
  halfplate: hCrestHalfMask, regal: hCrestCrown,
};
function hHelmCrest(g, M, gv, ps, S){
  const t = gv ? gv.t : 0;
  if (t < 4.5) return;
  const fn = SET_CREST[(S && S.style) || 'plate'] || hCrestHorn;
  const rim = plusRim(M, gv);
  hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
    if (rim){   // cùng thủ thuật viền như vai giáp, xoay quanh tâm đầu
      g.save(); g.globalAlpha = 0.34 + clamp(((gv.plus || 0) - 3) / 8, 0, 1) * 0.34;
      g.translate(80, 74); g.scale(1.14, 1.14); g.translate(-80, -74);
      fn(g, { lo:rim, hi:rim, trim:rim, glow:rim }, hStage(t), ps);
      g.restore();
    }
    fn(g, M, hStage(t), ps);
  });
}

// ── A. BÓNG DÁNG: giáp ống chân + đai lưng ──
// Hai vùng trước nay hoàn toàn trơn: chân chỉ là 2 khối màu đặc, eo không có gì. Thêm chi tiết
// ở đây đáng giá gấp đôi vì chân CHUYỂN ĐỘNG — giáp ống nhấp nhô theo sải bước, mắt bắt ngay.
// Vẽ trong khớp hông (xem hLegs) nên tự đi theo chu kỳ bước chân; vẽ ngoài là thành nhãn dán.
function hGreavePlate(g, M, st, x0, dir){
  g.fillStyle = M.hi;                                 // tấm che ống quyển
  g.beginPath();
  g.moveTo(x0 + dir * 2, 170); g.lineTo(x0 + dir * 17, 170);
  g.lineTo(x0 + dir * 18, 196); g.lineTo(x0 + dir * 1, 196);
  g.closePath(); g.fill();
  g.fillStyle = M.lo;                                 // rãnh giữa → tách khối
  g.fillRect(Math.min(x0 + dir * 8, x0 + dir * 10), 172, 2, 22);
  if (st >= 2){                                       // chụp gối
    g.fillStyle = M.hi;
    g.beginPath(); g.ellipse(x0 + dir * 9, 168, 10, 8, 0, 0, 7); g.fill();
    g.strokeStyle = M.trim; g.lineWidth = 1.3;
    g.beginPath(); g.ellipse(x0 + dir * 9, 168, 10, 8, 0, 0, 7); g.stroke();
  }
  if (st >= 3){                                       // gai gối chĩa ra ngoài
    g.fillStyle = M.trim;
    g.beginPath();
    g.moveTo(x0 + dir * 16, 164); g.lineTo(x0 + dir * 16, 172);
    g.lineTo(x0 + dir * 27, 165);
    g.closePath(); g.fill();
  }
}
// HỎA LONG — ống chân phủ vảy xếp lớp, mũi giày là vuốt rồng
function hGreaveDragon(g, M, st, x0, dir){
  for (let i = 0; i < 4; i++){                        // vảy xếp lớp
    const y = 166 + i * 8;
    g.fillStyle = i % 2 ? M.lo : M.hi;
    g.beginPath();
    g.moveTo(x0 + dir * 1, y);
    g.quadraticCurveTo(x0 + dir * 10, y + 5, x0 + dir * 18, y);
    g.lineTo(x0 + dir * 18, y + 8);
    g.quadraticCurveTo(x0 + dir * 10, y + 12, x0 + dir * 1, y + 8);
    g.closePath(); g.fill();
  }
  g.fillStyle = M.hi;                                 // chụp gối
  g.beginPath(); g.ellipse(x0 + dir * 9, 164, 11, 9, 0, 0, 7); g.fill();
  g.fillStyle = M.trim;                               // gai gối
  g.beginPath();
  g.moveTo(x0 + dir * 15, 159); g.lineTo(x0 + dir * 15, 169);
  g.lineTo(x0 + dir * 30, 160); g.closePath(); g.fill();
  if (st >= 2){                                       // vuốt rồng ở mũi giày
    g.fillStyle = M.trim;
    for (let i = 0; i < 3; i++){
      const cx = x0 + dir * (3 + i * 7);
      g.beginPath();
      g.moveTo(cx, 206); g.lineTo(cx + dir * 5, 206); g.lineTo(cx + dir * 3, 216);
      g.closePath(); g.fill();
    }
  }
}
const SET_LEG = {
  plate: hGreavePlate, chain: hGreavePlate, drake: hGreaveDragon, hoalong: hGreaveDragon,
  cloth: hGreaveRobe, sphinx: hGreaveRobe, arcane: hGreaveRobe,
  hide: hGreaveLight, leaf: hGreaveLight, plume: hGreaveLight,
  halfplate: hGreavePlate, regal: hGreavePlate,
};
function hGreave(g, M, gv, side, S){
  const t = gv ? gv.t : 0;
  if (t < 3.5) return;
  const fn = SET_LEG[(S && S.style) || 'plate'] || hGreavePlate;
  g.save();
  fn(g, M, t < 5.5 ? 1 : t < 7.5 ? 2 : 3, side < 0 ? 61 : 80, side < 0 ? -1 : 1);
  g.restore();
}
function hBeltPlate(g, M, st){
  g.fillStyle = M.lo;                                 // bản đai
  g.fillRect(54, 138, 52, 7 + st);
  g.fillStyle = M.trim;                               // khoá đai giữa bụng
  const bw = 7 + st * 2.2;
  g.beginPath();
  g.moveTo(80, 136); g.lineTo(80 + bw * 0.5, 141.5 + st * 0.5);
  g.lineTo(80, 148 + st); g.lineTo(80 - bw * 0.5, 141.5 + st * 0.5);
  g.closePath(); g.fill();
  if (st >= 2){                                       // hai tấm hông rủ xuống
    g.fillStyle = M.hi;
    for (const s of [-1, 1]){
      g.beginPath();
      g.moveTo(80 + s * 16, 144); g.lineTo(80 + s * 30, 144);
      g.lineTo(80 + s * (26 + st * 2), 160 + st * 3); g.lineTo(80 + s * 15, 158 + st * 2);
      g.closePath(); g.fill();
    }
  }
}
// HỎA LONG — váy vảy hai hàng, khoá hàm rồng, tấm hông có vuốt
function hBeltDragon(g, M, _st){
  g.fillStyle = M.lo; g.fillRect(54, 137, 52, 9);
  for (let row = 0; row < 2; row++){                  // váy vảy so le
    for (let i = 0; i < 5; i++){
      const x = 56 + i * 10 + row * 5, y = 145 + row * 8;
      g.fillStyle = (i + row) % 2 ? M.hi : M.lo;
      g.beginPath();
      g.moveTo(x, y); g.lineTo(x + 9, y);
      g.quadraticCurveTo(x + 4.5, y + 11, x, y);
      g.closePath(); g.fill();
    }
  }
  g.fillStyle = M.trim;                               // khoá hình hàm rồng
  g.beginPath();
  g.moveTo(80, 134); g.lineTo(89, 141); g.lineTo(84, 150); g.lineTo(76, 150); g.lineTo(71, 141);
  g.closePath(); g.fill();
  g.fillStyle = M.glow || '#ff7a3a';
  g.beginPath(); g.ellipse(80, 142, 3, 4, 0, 0, 7); g.fill();
  for (const s of [-1, 1]){                           // tấm hông + vuốt
    g.fillStyle = M.hi;
    g.beginPath();
    g.moveTo(80 + s * 17, 143); g.lineTo(80 + s * 31, 143);
    g.lineTo(80 + s * 28, 168); g.lineTo(80 + s * 16, 163);
    g.closePath(); g.fill();
    g.fillStyle = M.trim;
    g.beginPath();
    g.moveTo(80 + s * 28, 166); g.lineTo(80 + s * 22, 164); g.lineTo(80 + s * 26, 177);
    g.closePath(); g.fill();
  }
}
const SET_HIP = {
  plate: hBeltPlate, chain: hBeltPlate, drake: hBeltDragon, hoalong: hBeltDragon,
  cloth: hBeltSash, sphinx: hBeltSash, arcane: hBeltSash,
  hide: hBeltLeafSkirt, leaf: hBeltLeafSkirt, plume: hBeltLeafSkirt,
  halfplate: hBeltHalf, regal: hBeltDrape,
};
function hBelt(g, M, gv, S){
  const t = gv ? gv.t : 0;
  if (t < 2) return;
  const fn = SET_HIP[(S && S.style) || 'plate'] || hBeltPlate;
  g.save();
  fn(g, M, t < 5 ? 1 : t < 8 ? 2 : 3);
  g.restore();
}
// ── B. CHẤT LIỆU ──
// Không làm giáp SÁNG hơn, mà làm nó PHẢN CHIẾU khác đi: bậc thấp là sắt nhám (chuyển sắc mờ,
// không có dải phản quang), bậc cao là thép đánh bóng (dải phản quang hẹp và gắt).
function hArmorSheen(g, M, gv){
  const t = gv ? gv.t : 0;
  if (t < 1) return;
  const polish = Math.min(1, t / 10);
  g.save();
  g.beginPath();                                        // giới hạn trong khối thân
  g.moveTo(56, 94); g.lineTo(104, 94); g.lineTo(108, 142); g.lineTo(52, 142);
  g.closePath(); g.clip();
  const gr = g.createLinearGradient(0, 94, 0, 142);
  gr.addColorStop(0, `rgba(255,255,255,${(0.05 + polish * 0.16).toFixed(3)})`);
  gr.addColorStop(0.45, 'rgba(255,255,255,0)');
  gr.addColorStop(1, `rgba(0,0,0,${(0.10 + polish * 0.16).toFixed(3)})`);
  g.fillStyle = gr; g.fillRect(50, 92, 60, 54);
  if (polish > 0.25){
    const bw = 16 - polish * 9;                         // càng bóng dải càng hẹp
    const sg = g.createLinearGradient(66 - bw / 2, 0, 66 + bw / 2, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, `rgba(255,255,255,${(polish * 0.34).toFixed(3)})`);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.fillRect(50, 92, 60, 54);
  }
  g.restore();
}
// ── C. HOA VĂN KHẢM ──
// Mật độ chi tiết là thứ mắt đọc ra "đồ đắt" mà không cần biết luật chơi. Số đường tăng theo
// bậc, MÀU lấy theo độ hiếm — nên `it.rarity` lần đầu tiên có mặt trên người nhân vật.
function hEngrave(g, M, gv){
  const t = gv ? gv.t : 0;
  const n = t < 3 ? 0 : t < 5 ? 1 : t < 7 ? 2 : t < 9 ? 3 : 4;
  if (!n) return;
  g.save();
  g.strokeStyle = gv.rcol || M.trim;
  g.globalAlpha = 0.75; g.lineWidth = 1.2;
  for (let i = 0; i < n; i++){
    const y = 104 + i * 8.5;
    g.beginPath(); g.moveTo(60, y); g.quadraticCurveTo(80, y + 4.5, 100, y); g.stroke();
  }
  if (n >= 4){                                          // khoá ngực hình thoi ở bậc tối cao
    g.globalAlpha = 0.9; g.fillStyle = gv.rcol || M.trim;
    g.beginPath();
    g.moveTo(80, 98); g.lineTo(86, 105); g.lineTo(80, 112); g.lineTo(74, 105);
    g.closePath(); g.fill();
  }
  g.restore();
}
// ═══════════ E. CƯỜNG HOÁ +0..+11 — càng rèn cao càng "nóng" ═══════════
// MU Online lấy mốc **+7** làm ngưỡng phát sáng: dưới ngưỡng đồ trơ, từ +7 trở lên món đồ toả
// hào quang và ai liếc qua cũng biết. Giữ đúng mốc đó, nhưng KHÔNG để nó chỉ là "sáng hơn" —
// mỗi mốc thêm một hiện tượng KHÁC, nếu không thì +4 với +11 chỉ khác nhau độ chói:
//   0 (+0..3)   trơ, không có gì
//   1 (+4..6)   viền sáng quanh vai & mũ — thấy được nhưng còn tĩnh
//   2 (+7..9)   NGƯỠNG MU: hào quang nóng sau lưng + tàn lửa bay lên
//   3 (+10,11)  thêm dải sáng quét dọc thân, như kim loại còn đang nung
// `plus` là mức rèn TRUNG BÌNH của 5 ô giáp (xem gearVisual) — rèn mỗi cái mũ +11 rồi bỏ trống
// 4 ô còn lại thì không được sáng ngang full +11.
function plusStage(pl){ return !(pl > 0) ? 0 : pl < 4 ? 0 : pl < 7 ? 1 : pl < 10 ? 2 : 3; }
// Hào quang nóng — vẽ SAU LƯNG, trước cả áo choàng
function hPlusAura(g, M, gv, now){
  const st = plusStage(gv ? gv.plus : 0);
  if (st < 2) return;
  const col = M.glow || '#ffe9a8';
  const pulse = 0.5 + 0.5 * Math.sin(now / 260);
  // k: thành phần LIÊN TỤC 0→1 từ +7 lên +11. Chỉ chia mốc thôi thì +7 với +9 trông y hệt
  // nhau (đo được: 0 pixel khác biệt) — mà rèn từ +7 lên +9 là cả một chặng dài, phải thấy.
  const k = clamp(((gv.plus || 0) - 6) / 5, 0, 1);
  const r = 64 + st * 11 + k * 12 + pulse * (4 + st * 3);
  g.save();
  g.globalAlpha = (0.10 + st * 0.055 + k * 0.07) * (0.75 + pulse * 0.25);
  const gr = g.createRadialGradient(80, 128, r * 0.3, 80, 128, r);
  gr.addColorStop(0, col); gr.addColorStop(0.5, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.beginPath(); g.arc(80, 128, r, 0, 7); g.fill();
  g.restore();
}
// Tàn lửa bay lên — vẽ TRƯỚC thân: cho cảm giác món đồ đang toả nhiệt, không phải dán đèn
function hPlusSpark(g, M, gv, now){
  const st = plusStage(gv ? gv.plus : 0);
  if (st < 2) return;
  const col = M.glow || '#ffe9a8';
  const n = clamp(2 + Math.round(((gv.plus || 0) - 6) * 1.2), 2, 8);   // mỗi cấp rèn thêm tàn lửa
  g.save(); g.fillStyle = col;
  for (let i = 0; i < n; i++){
    const ph = ((now / (900 + (i % 3) * 260)) + i / n) % 1;   // 0→1: nổi lên rồi tắt
    const x = 80 + Math.sin(i * 137.5) * 34 + Math.sin(now / 500 + i) * 5;
    const y = 190 - ph * 120;
    g.globalAlpha = 0.8 * (1 - ph) * (ph < 0.15 ? ph / 0.15 : 1);   // hiện dần rồi lịm dần
    const sz = 1.4 + (i % 3) * 0.7;
    g.beginPath(); g.ellipse(x, y, sz, sz * 1.8, 0, 0, 7); g.fill();
  }
  g.restore();
}
// Dải sáng quét dọc thân — chỉ từ +10, trông như kim loại còn đang nung
function hPlusSweep(g, M, gv, now){
  if (plusStage(gv ? gv.plus : 0) < 3) return;
  g.save();
  g.beginPath();
  g.moveTo(56, 94); g.lineTo(104, 94); g.lineTo(108, 142); g.lineTo(52, 142);
  g.closePath(); g.clip();
  const y0 = 88 + ((now % 2200) / 2200) * 62;
  const gr = g.createLinearGradient(0, y0 - 14, 0, y0 + 14);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.5, 'rgba(255,255,255,.42)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(50, 88, 60, 62);
  g.restore();
}
// Màu viền sáng cho vai/mũ (null nếu chưa tới mốc +4). Cách tạo viền: vẽ lại CHÍNH hình đó
// to hơn ~12% bằng màu sáng ở lớp dưới — rẻ hơn nhiều so với dựng mặt nạ silhouette mỗi khung.
function plusRim(M, gv){ return plusStage(gv ? gv.plus : 0) >= 1 ? (M.glow || '#ffe9a8') : null; }

function hPoly(g, pts, c){
  g.fillStyle = c; g.beginPath();
  for (let i = 0; i < pts.length; i++) i ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[0][0], pts[0][1]);
  g.closePath(); g.fill();
}
function hEll(g, x, y, rx, ry, c){ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }
// một "xương": xoay cả nhóm hình quanh trục (px,py) rồi vẽ tiếp bằng toạ độ gốc
function hJoint(g, px, py, ang, fn){
  g.save(); g.translate(px, py); g.rotate(ang); g.translate(-px, -py); fn(); g.restore();
}

// ── BỘ XƯƠNG: tính góc từng khớp theo trạng thái, không dùng bảng khung hình ──
const HERO_JOINT = { hipL:[72,142], hipR:[90,142], shL:[52,100], shR:[108,100], neck:[80,94] };

// ── KIỂU RA ĐÒN ──────────────────────────────────────────────────────────────
// Mỗi kiểu là quỹ đạo tay + vũ khí theo tiến trình p (0 = bắt đầu, 1 = kết thúc).
// armR/armL: góc vai · wrot: vũ khí xoay thêm · wpush: vũ khí đẩy ra trước ·
// sw: biên độ dùng cho dây cung và độ bạt áo choàng.
// Chọn kiểu nào là để KHỚP VFX của chiêu: chiêu quét hình quạt thì tay quét ngang,
// thiên thạch rơi từ trên xuống thì giơ trượng lên trời, ngũ tiễn thì giương cung.
// Đường cong ra đòn: LẤY ĐÀ → bung → VƯỢT ĐÀ rồi lắng về. Trả 0→1 nhưng đi vòng.
// Trước đây `slash`/`spin` nội suy tuyến tính (`armR: -0.7 + p*2.1`) nên đòn đánh trôi đều
// từ đầu tới cuối, không có sức nặng. Ba pha dưới đây là công thức hoạt hình cổ điển:
//   p < 0.22  — hõm NGƯỢC lại (lấy đà), giá trị âm
//   sau đó    — ease-out mạnh, vọt qua 1 (vượt đà) rồi trả về đúng 1
function hSwing(p){
  if (p < 0.22) return -0.30 * Math.sin(p / 0.22 * Math.PI);
  const q = (p - 0.22) / 0.78;
  return (1 - Math.pow(1 - q, 3)) + 0.20 * Math.sin(q * Math.PI) * (1 - q * 0.3);
}
const HERO_ACT = {
  // chém dọc từ trên xuống — đòn thường cận chiến
  slash: p => { const e = hSwing(p);
                return { armR: -0.7 + e*2.1, armL: -0.30*Math.sin(p*Math.PI), lean: 0.16*Math.sin(p*Math.PI) - 0.10*Math.max(0, -e),
                         wrot: 0, wpush: 0, sw: Math.sin(p*Math.PI) }; },
  // quét ngang một vòng — Twisting Slash (DK) · Fire Slash (MG): VFX hình quạt
  spin:  p => { const e = hSwing(p);
                return { armR: -0.45 + e*1.05, armL: 0.55*Math.sin(p*Math.PI), lean: 0.22*Math.sin(p*Math.PI) - 0.12*Math.max(0, -e),
                         wrot: -1.65 + e*3.3, wpush: 8*Math.sin(p*Math.PI), sw: Math.sin(p*Math.PI) }; },
  // đâm thẳng tới — Death Stab (DK): VFX bung ra ngay trước mặt
  thrust: p => { const e = Math.sin(Math.pow(p, 0.55)*Math.PI);
                 return { armR: -0.55 + e*0.45, armL: -0.5*e, lean: 0.24*e,
                          wrot: -1.45, wpush: 36*e, sw: e }; },
  // giương cung rồi buông — Multi-Shot / Ice Arrow (Elf): dây căng đúng lúc tên bay
  shoot: p => { const draw = p < 0.55 ? p/0.55 : Math.max(0, 1 - (p-0.55)/0.45);
                return { armR: -0.28 - 0.55*draw, armL: -0.14, lean: -0.05 - 0.04*draw,
                         wrot: 0, wpush: 0, sw: draw }; },
  // chĩa trượng ra trước — Poison (DW) · Force Wave / Electric Spark (DL): VFX bắn thẳng
  point: p => { const e = Math.sin(Math.pow(p, 0.6)*Math.PI);
                return { armR: -1.05 - 0.25*e, armL: -0.35, lean: 0.10*e,
                         wrot: 0.85, wpush: 12*e, sw: e*0.4 }; },
  // giơ vũ khí lên trời — Meteor (DW) · Flame Strike (MG) · Fire Scream (DL): VFX rơi xuống
  raise: p => { const e = Math.sin(Math.pow(p, 0.5)*Math.PI);
                return { armR: -1.55 - 0.35*e, armL: -0.75 - 0.3*e, lean: -0.10 - 0.06*e,
                         wrot: -0.25, wpush: 0, sw: e*0.5, head: -0.16 }; },
  // dựng vũ khí trước ngực — chiêu buff: Soul Barrier · Greater Damage · Battle Fury…
  guard: p => { const e = Math.sin(p*Math.PI);
                return { armR: -0.95 - 0.15*e, armL: -0.95 - 0.15*e, lean: -0.04,
                         wrot: -0.55, wpush: -6, sw: e*0.3 }; },
};
// Kiểu ra đòn mặc định từng lớp: đòn thường · chiêu chính (a) · tuyệt kỹ (tp) · buff
const SECT_ACT = {
  thieulam: { basic:'slash', a:'spin',  tp:'thrust', buff:'guard' }, // đại kiếm: chém → quét → đâm
  minhgiao: { basic:'slash', a:'spin',  tp:'raise',  buff:'guard' }, // đại đao: chém → quét → bổ lửa
  toanchan: { basic:'shoot', a:'shoot', tp:'shoot',  buff:'raise' }, // cung: luôn giương rồi buông
  baidasan: { basic:'point', a:'point', tp:'raise',  buff:'raise' }, // trượng: chĩa → gọi thiên thạch
  bug:      { basic:'slash', a:'point', tp:'raise',  buff:'raise' }, // quyền trượng: vung → hiệu triệu
  vophai:   { basic:'slash', a:'slash', tp:'thrust', buff:'guard' },
};
function heroActOf(sectKey, slot){ return (SECT_ACT[sectKey] || SECT_ACT.vophai)[slot] || 'slash'; }

// wph: pha bước chân · mv: đang di chuyển · atkK/castK 0..1 (đếm NGƯỢC về 0) · act: kiểu ra đòn
function heroPose(wph, mv, atkK, castK, now, act, sway, swayDir){
  const br = Math.sin(now / 620) * 0.035;               // nhịp thở lúc đứng yên
  const st = mv ? Math.sin(wph) : 0;                    // sải chân
  const k = castK > 0 ? castK : atkK;                   // đòn nào đang chạy
  const A = k > 0 ? (HERO_ACT[act] || HERO_ACT.slash)(1 - Math.min(1, k)) : null;
  return {
    legL: st * 0.42, legR: -st * 0.42,
    armL: A ? A.armL - st * 0.10 : -st * 0.30 + br,
    armR: A ? A.armR : st * 0.30 - br,
    lean: (A ? A.lean : 0) + (mv ? Math.sin(wph) * 0.045 : br * 0.5),
    head: (A && A.head ? A.head : 0) + (mv ? -Math.sin(wph * 2) * 0.05 : -br),
    bob:  mv ? Math.abs(Math.sin(wph)) * -3.2 : Math.sin(now / 620) * -1.2,
    wrot: A ? A.wrot : 0, wpush: A ? A.wpush : 0,
    sw: A ? A.sw : 0, cast: castK, back: false,
    // quán tính phụ, dùng chung cho mọi bộ phận mềm (áo choàng · vải rủ · lông vũ · mảnh phép)
    sway: sway || 0, swayDir: swayDir || 0,
  };
}
const HERO_POSE0 = heroPose(0, false, 0, 0, 0, 'slash');

// ── LỚP CHUNG: chân · thân · đầu (giáp của từng lớp vẽ đè lên) ──
// gv (tham số thứ 4, thêm sau ps): có thì đắp thêm giáp ống chân, vẽ TRONG khớp hông nên
// giáp nhấp nhô theo đúng sải bước thay vì dán chết một chỗ.
// SM/S (thêm sau gv): bảng màu + tạo hình của ĐÚNG bộ giáp đang mặc. Giáp ống vẽ TRONG khớp
// hông nên nhấp nhô theo sải bước — vẽ ngoài là thành nhãn dán.
function hLegs(g, P, ps, gv, SM, S){
  hJoint(g, HERO_JOINT.hipL[0], HERO_JOINT.hipL[1], ps.legL, () => {
    hPoly(g, [[63,140],[80,140],[80,198],[61,198]], P.leg);
    hPoly(g, [[60,194],[79,194],[81,212],[57,212]], P.boot);
    hGreave(g, SM || hMetal(1), gv, -1, S);
  });
  hJoint(g, HERO_JOINT.hipR[0], HERO_JOINT.hipR[1], ps.legR, () => {
    hPoly(g, [[80,140],[97,140],[99,198],[80,198]], P.leg);
    hPoly(g, [[81,194],[100,194],[103,212],[79,212]], P.boot);
    hGreave(g, SM || hMetal(1), gv, 1, S);
  });
}
function hTorso(g, P){ hPoly(g, [[58,96],[102,96],[106,146],[54,146]], P.torso); }
function hHead(g, P, ps){
  hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
    hEll(g, 80, 74, 19, 21, P.skin);
    if (ps.back){ hEll(g, 80, 72, 18, 19, P.skinSh); return; } // nhìn từ sau: chỉ thấy gáy
    hEll(g, 88, 74, 10, 20, P.skinSh);
    hEll(g, 72, 72, 3, 4.5, '#1a1219'); hEll(g, 87, 72, 3, 4.5, '#1a1219');
  });
}
function hArmL(g, P, ps, fn){ hJoint(g, HERO_JOINT.shL[0], HERO_JOINT.shL[1], ps.armL, fn || (() => hEll(g, 48, 116, 10, 17, P.skin))); }
function hArmR(g, P, ps, fn){ hJoint(g, HERO_JOINT.shR[0], HERO_JOINT.shR[1], ps.armR, fn || (() => hEll(g, 112, 116, 10, 17, P.skin))); }
// áo choàng: đuôi áo bạt ra sau theo bước chân & lực vung
function hCape(g, c1, c2, ps){
  // sải chân + lực vung (tức thời) CỘNG quán tính (trễ) — thành phần thứ hai mới là thứ
  // làm áo choàng còn bay tiếp một nhịp sau khi nhân vật đã đứng lại
  const f = (ps.legL - ps.legR) * 16 + ps.sw * 22 + (ps.sway || 0) * 26 + (ps.swayDir || 0) * 14;
  hPoly(g, [[52,98],[108,98],[122 - f,190],[38 - f,190]], c2);
  hPoly(g, [[80,98],[108,98],[122 - f,190],[80 - f,190]], c1);
}

// ── TRANG BỊ THEO LỚP ──
// pal: màu da/vải · cape: màu áo choàng · upper(g,M,ps,P): giáp + mũ + tay + vũ khí
const HERO_GEAR = {
  // Dark Knight — giáp tấm nặng, mũ sừng, đại kiếm bổ từ trên xuống
  thieulam: {
    pal: { boot:'#2a2c38', leg:'#3a3d4c', torso:'#54596e', skin:'#d8a878', skinSh:'#b0805a' },
    cape: ['#7a1e28', '#5a1420'],
    upper(g, M, ps, P){
      hTorso(g, P);
      hPoly(g, [[56,96],[104,96],[108,140],[52,140]], M.hi);
      hPoly(g, [[80,96],[104,96],[108,140],[80,140]], M.lo);
      hPoly(g, [[68,104],[92,104],[88,132],[72,132]], M.trim);
      hHead(g, P, ps);
      hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
        hPoly(g, [[58,60],[102,60],[100,88],[60,88]], M.hi);
        if (!ps.back) hPoly(g, [[58,74],[102,74],[102,80],[58,80]], '#20242e'); // khe mắt
        hPoly(g, [[58,62],[44,36],[62,50]], M.hi);
        hPoly(g, [[102,62],[116,36],[98,50]], M.hi);
      });
      hArmL(g, P, ps, () => { hEll(g, 48, 116, 10, 17, P.skin); hPoly(g, [[34,94],[62,88],[64,120],[36,126]], M.hi); });
      hArmR(g, P, ps, () => {
        hEll(g, 112, 116, 10, 17, P.skin);
        hPoly(g, [[126,94],[98,88],[96,120],[124,126]], M.lo);
        hHeldWeapon(g, ps.gv, ps, 122, 134, 0.13, () => {
          g.save(); g.translate(122 + ps.wpush, 134); g.rotate(0.13 + ps.wrot); // chếch ra ngoài, không cắt mặt
          hPoly(g, [[-6,0],[6,0],[5,-96],[0,-112],[-5,-96]], '#d2d6de');
          g.fillStyle = '#fff'; g.fillRect(-2, -96, 3, 90);
          hPoly(g, [[-18,0],[18,0],[16,10],[-16,10]], M.trim);
          g.fillStyle = '#4a3520'; g.fillRect(-5, 10, 10, 30);
          hEll(g, 0, 44, 7, 7, M.trim); g.restore();
        });
      });
    },
  },
  // Dark Wizard — áo thụng loe, mũ trùm tối, quyền trượng ngọc giương cao khi niệm
  baidasan: {
    pal: { boot:'#241c34', leg:'#2e2450', torso:'#453076', skin:'#e0c0a0', skinSh:'#bc9c78' },
    cape: ['#3a2a6a', '#241a4a'],
    upper(g, M, ps, P){
      hPoly(g, [[52,96],[108,96],[120,206],[40,206]], '#523a8a');
      hPoly(g, [[80,96],[108,96],[120,206],[80,206]], '#3d2a68');
      hPoly(g, [[50,132],[110,132],[108,146],[52,146]], M.trim);
      hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
        hPoly(g, [[46,92],[114,92],[106,66],[88,44],[72,44],[54,66]], '#5e42a0');
        hPoly(g, [[80,44],[114,92],[106,66],[88,44]], '#412c76');
        if (!ps.back){                          // nhìn từ sau chỉ thấy vải mũ trùm
          hEll(g, 80, 78, 17, 18, '#180f2a');
          hEll(g, 73, 76, 3.4, 4.6, '#9fd0ff'); hEll(g, 88, 76, 3.4, 4.6, '#9fd0ff');
        }
      });
      hArmL(g, P, ps);
      hArmR(g, P, ps, () => {
        hHeldWeapon(g, ps.gv, ps, 112, 150, 0, () => {
        g.save(); g.translate(112 + ps.wpush, 150); g.rotate(ps.wrot);
        g.strokeStyle = '#4a3520'; g.lineWidth = 8; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, 0); g.lineTo(-8, -120); g.stroke();
        const r = 26 + ps.cast * 16;
        const og = g.createRadialGradient(-8, -134, 2, -8, -134, r);
        og.addColorStop(0, '#dff2ff'); og.addColorStop(0.45, 'rgba(122,190,255,.8)'); og.addColorStop(1, 'rgba(90,150,230,0)');
        g.fillStyle = og; g.beginPath(); g.arc(-8, -134, r, 0, 7); g.fill();
        hEll(g, -8, -134, 9 + ps.cast * 3, 9 + ps.cast * 3, '#8fd0ff');
        g.strokeStyle = M.trim; g.lineWidth = 3;
        g.beginPath(); g.arc(-8, -134, 14, 0, 7); g.stroke(); g.restore();
        });
      });
    },
  },
  // Sylvan Ranger — giáp da nhẹ, tai nhọn, đuôi ngựa, cung dài (dây kéo căng khi bắn)
  toanchan: {
    pal: { boot:'#2a3d34', leg:'#35564a', torso:'#3f7a68', skin:'#e8c8a4', skinSh:'#c4a480' },
    cape: ['#1e6a5a', '#14483e'],
    upper(g, M, ps, P){
      hTorso(g, P);
      hPoly(g, [[58,96],[102,96],[104,138],[56,138]], '#57a08a');
      hPoly(g, [[80,96],[102,96],[104,138],[80,138]], '#43836f');
      hPoly(g, [[66,100],[94,100],[90,130],[70,130]], M.trim);
      g.strokeStyle = '#5a4630'; g.lineWidth = 4;                    // ống tên sau lưng
      g.beginPath(); g.moveTo(104, 96); g.lineTo(114, 134); g.stroke();
      for (let i = 0; i < 3; i++){
        g.strokeStyle = '#d8d0c0'; g.lineWidth = 2; g.beginPath();
        g.moveTo(100 + i * 5, 92); g.lineTo(104 + i * 5, 74); g.stroke();
      }
      hHead(g, P, ps);
      hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
        hPoly(g, [[60,60],[100,60],[102,44],[58,44]], '#d8b45a');
        hPoly(g, [[98,52],[126,40],[118,96],[100,80]], '#d8b45a');
        if (!ps.back){                          // tai nhọn khuất sau tóc khi quay lưng
          hPoly(g, [[62,66],[46,52],[60,74]], '#e8c8a4');
          hPoly(g, [[98,66],[114,52],[100,74]], '#e8c8a4');
        }
      });
      hArmR(g, P, ps, () => { hEll(g, 112, 116, 10, 17, P.skin); hPoly(g, [[126,92],[110,88],[108,110],[124,114]], M.hi); });
      hArmL(g, P, ps, () => {                                        // tay trái giương cung
        hPoly(g, [[48,92],[64,88],[66,110],[50,114]], M.hi);
        hHeldWeapon(g, ps.gv, ps, 36, 118, 0.12, () => {
        g.save(); g.translate(36 - ps.wpush*0.5, 118); g.rotate(0.12 - ps.wrot*0.4);
        g.strokeStyle = '#7a5a30'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.arc(14, 0, 60, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
        g.strokeStyle = '#e8e0c8'; g.lineWidth = 1.8;
        const bp = 10 + ps.sw * 24;                                  // dây cung kéo căng
        g.beginPath(); g.moveTo(-6, -56); g.lineTo(-6 + bp, 0); g.lineTo(-6, 56); g.stroke();
        if (ps.sw > 0.05){                                           // mũi tên đặt trên dây
          g.strokeStyle = '#cfc4a8'; g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(-6 + bp, 0); g.lineTo(-6 + bp - 52, 0); g.stroke();
        }
        g.restore();
        });
      });
    },
  },
  // Spellblade — nửa giáp nửa vải, một vai trần, đại đao bản rộng
  minhgiao: {
    pal: { boot:'#2c2222', leg:'#3e2e2e', torso:'#6a4038', skin:'#d8a878', skinSh:'#b0805a' },
    cape: ['#5a1a1a', '#3a1010'],
    upper(g, M, ps, P){
      hTorso(g, P);
      hPoly(g, [[56,96],[102,96],[106,142],[52,142]], '#4a2a2a');
      hPoly(g, [[56,96],[80,96],[82,142],[52,142]], M.hi);           // chỉ nửa trái có giáp
      hPoly(g, [[52,136],[106,136],[104,150],[54,150]], M.trim);
      hHead(g, P, ps);
      hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
        hPoly(g, [[60,62],[100,62],[104,42],[56,42]], '#2a2028');    // tóc dài đen
        hPoly(g, [[98,54],[122,66],[112,116],[98,86]], '#2a2028');
        if (!ps.back) hPoly(g, [[56,68],[70,58],[72,72]], M.trim);   // vòng trán kim loại
      });
      hArmL(g, P, ps, () => {                                        // vai trái giáp đồ sộ
        hEll(g, 48, 116, 10, 17, P.skin);
        hPoly(g, [[30,92],[60,86],[62,122],[32,128]], M.hi);
        hPoly(g, [[30,92],[46,89],[47,125],[32,128]], M.lo);
      });
      hArmR(g, P, ps, () => {
        hEll(g, 112, 114, 11, 19, '#d8a878');                        // vai/tay phải để trần
        hHeldWeapon(g, ps.gv, ps, 122, 136, 0.18, () => {
          g.save(); g.translate(122 + ps.wpush, 136); g.rotate(0.18 + ps.wrot);
          hPoly(g, [[-9,0],[9,0],[7,-104],[0,-124],[-7,-104]], '#dcd2c0');
          hPoly(g, [[0,0],[9,0],[7,-104],[0,-124]], '#b6ac98');
          g.fillStyle = '#fff6e0'; g.fillRect(-2, -104, 3, 98);
          hPoly(g, [[-20,0],[20,0],[17,11],[-17,11]], M.trim);
          g.fillStyle = '#3a2418'; g.fillRect(-5, 11, 10, 28); g.restore();
        });
      });
    },
  },
  // Dark Lord — giáp đen ánh lam, mũ vương miện 5 chấu, quyền trượng chỉ huy
  bug: {
    pal: { boot:'#1c1e2c', leg:'#262a3c', torso:'#333a54', skin:'#c89868', skinSh:'#a07048' },
    cape: ['#1f2f6a', '#131c44'],
    upper(g, M, ps, P){
      hTorso(g, P);
      hPoly(g, [[54,94],[106,94],[110,142],[50,142]], '#2a3050');
      hPoly(g, [[80,94],[106,94],[110,142],[80,142]], '#1e2340');
      hPoly(g, [[70,102],[90,102],[86,134],[74,134]], M.trim);
      hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head, () => {
        hPoly(g, [[58,58],[102,58],[100,90],[60,90]], '#2a3050');
        if (!ps.back){
          hPoly(g, [[58,72],[102,72],[102,79],[58,79]], '#0e1220');
          hEll(g, 70, 75.5, 3, 3.4, '#ff7a5a'); hEll(g, 90, 75.5, 3, 3.4, '#ff7a5a');
        }
        for (let i = 0; i < 5; i++)
          hPoly(g, [[54 + i * 13, 58], [60 + i * 13, 30 + (i === 2 ? -10 : 0)], [66 + i * 13, 58]], M.trim);
      });
      hArmL(g, P, ps, () => {
        hEll(g, 48, 116, 10, 17, P.skin);
        hPoly(g, [[28,90],[60,84],[64,122],[32,128]], M.hi);
        hPoly(g, [[28,90],[44,86],[38,60],[30,88]], M.hi);           // gai vai
      });
      hArmR(g, P, ps, () => {
        hEll(g, 112, 116, 10, 17, P.skin);
        hPoly(g, [[132,90],[100,84],[96,122],[128,128]], M.lo);
        hPoly(g, [[132,90],[116,86],[122,60],[130,88]], M.lo);
        hHeldWeapon(g, ps.gv, ps, 116, 146, 0, () => {
        g.save(); g.translate(116 + ps.wpush, 146); g.rotate(ps.wrot);
        g.strokeStyle = '#2a2438'; g.lineWidth = 9; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, -126); g.stroke();
        hPoly(g, [[-6,-126],[-24,-146],[-6,-172],[12,-146]], M.trim);
        hEll(g, -6, -146, 7, 9, '#7fb0ff');
        const r = 24 + ps.cast * 14;
        const dg = g.createRadialGradient(-6, -146, 2, -6, -146, r);
        dg.addColorStop(0, 'rgba(160,200,255,.75)'); dg.addColorStop(1, 'rgba(80,120,220,0)');
        g.fillStyle = dg; g.beginPath(); g.arc(-6, -146, r, 0, 7); g.fill(); g.restore();
        });
      });
    },
  },
  // Chưa chọn lớp — áo vải thô, kiếm ngắn tập sự
  vophai: {
    pal: { boot:'#3a3028', leg:'#4a4038', torso:'#6a5a48', skin:'#d8a878', skinSh:'#b0805a' },
    cape: null,
    upper(g, M, ps, P){
      hTorso(g, P);
      hPoly(g, [[56,96],[104,96],[104,150],[56,150]], '#7a6a52');
      hPoly(g, [[80,96],[104,96],[104,150],[80,150]], '#61533f');
      hPoly(g, [[54,140],[106,140],[106,150],[54,150]], '#4a3520');
      hHead(g, P, ps);
      hJoint(g, HERO_JOINT.neck[0], HERO_JOINT.neck[1], ps.head,
        () => hPoly(g, [[60,62],[100,62],[98,44],[62,44]], '#4a3828'));
      hArmL(g, P, ps);
      hArmR(g, P, ps, () => {
        hEll(g, 112, 116, 10, 17, P.skin);
        hHeldWeapon(g, ps.gv, ps, 118, 132, 0.15, () => {
          g.save(); g.translate(118 + ps.wpush, 132); g.rotate(0.15 + ps.wrot);
          hPoly(g, [[-4,0],[4,0],[3,-58],[0,-68],[-3,-58]], '#c0c4cc');
          hPoly(g, [[-12,0],[12,0],[11,8],[-11,8]], '#8a7a4a');
          g.fillStyle = '#4a3520'; g.fillRect(-4, 8, 8, 22); g.restore();
        });
      });
    },
  },
};
// Vẽ nhân vật trong hộp 160×220. tier = bậc Thần Binh (đổi bảng màu giáp).
// gv (tham số THỨ 6, thêm sau ps nên mọi lời gọi 5 tham số cũ vẫn chạy nguyên): chữ ký trang
// bị thật từ gearVisual(). Bỏ trống ⇒ chỉ vẽ theo `tier` như trước, dùng cho màn chọn lớp.
// Vũ khí trên tay dùng CHÍNH bộ phận dựng icon, nên món trong túi và thanh nhân vật đang cầm
// không thể lệch nhau. `fallback` là thanh vẽ cứng cũ của lớp — vẫn dùng khi chưa mặc vũ khí,
// hoặc khi vũ khí không thuộc dòng lưỡi (gậy/cung/trượng có bộ phận riêng, làm ở đợt sau).
// Mỗi dòng vũ khí một tỉ lệ và một điểm nắm — gậy dài hơn kiếm, cung thì nắm ở GIỮA thân
// chứ không ở chuôi, nỏ nắm ở báng.
const HELD_FIT = {
  weapon:   { fn:'iaWeapon',    k:1.45, dy:-22 },
  staff:    { fn:'iaStaff',     k:1.55, dy:-14 },
  bow:      { fn:'iaBow',       k:1.55, dy:0   },
  crossbow: { fn:'iaCrossbow',  k:1.5,  dy:-4  },
};
function hHeldWeapon(g, gv, ps, x, y, rot, fallback){
  const d = gv && gv.wDef;
  const F = d && HELD_FIT[d.art];
  if (!F){ fallback(); return; }
  const W = itemPal(d, gv.wTier || 1);
  g.save();
  g.translate(x + ps.wpush, y); g.rotate(rot + ps.wrot);
  // Thanh vẽ cứng cũ cao ~112 đơn vị. Icon cao ~77 (chuôi +33 → mũi -44), nên tỉ lệ phải là
  // ~1.45, không phải 2.5 — ở 2.5 thanh kiếm cao hơn cả người và cắt ngang thân.
  g.scale(F.k, F.k);
  g.translate(0, F.dy);                      // điểm nắm rơi đúng vào bàn tay
  (ITEM_ART[d.art] || iaWeapon)(g, W, Object.assign({}, d, { rot: 0 }));
  g.restore();
}
function drawHeroFigure(g, sectKey, tier, now, ps, gv){
  const M = hMetal(tier), G = HERO_GEAR[sectKey] || HERO_GEAR.vophai, P = G.pal;
  ps = ps || HERO_POSE0;
  gv = gv || null;
  // Bộ giáp riêng của lớp: đổi cả TẠO HÌNH (vai/mũ/chân/eo) lẫn BẢNG MÀU. Không có bộ
  // (chưa mặc gì / màn chọn lớp) thì SM === M, mọi thứ y như trước.
  const S = gv ? heroSet(sectKey, gv.t) : null, SM = hSetMetal(M, S);
  ps.gv = gv;   // upper() của từng lớp cần gv để vẽ đúng vũ khí đang mặc
  g.save();
  hEll(g, 80, 212, 30 - ps.bob * 0.9, 8, 'rgba(0,0,0,.22)'); // bóng co lại khi nhấc chân
  // D. HÀO QUANG — nét hoàn thiện, không phải toàn bộ câu chuyện. Mặc đủ 5 món một bộ Cổ Thần
  // thì hào quang nhuốm màu bộ đó, nên bộ nào cũng có dáng riêng nhìn từ xa.
  const glowCol = (gv && gv.setColor) || SM.glow;
  if (glowCol){
    const ag = g.createRadialGradient(80, 120, 10, 80, 120, 86);
    ag.addColorStop(0, glowCol); ag.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.2 + 0.1 * Math.sin(now / 380); g.fillStyle = ag;
    g.beginPath(); g.arc(80, 120, 86, 0, 7); g.fill(); g.globalAlpha = 1;
  }
  hPlusAura(g, SM, gv, now);                                 // E. hào quang cường hoá (sau lưng)
  if (G.cape && !ps.back) hCape(g, G.cape[0], G.cape[1], ps);
  hLegs(g, P, ps, gv, SM, S);
  g.translate(0, ps.bob);                                    // nhún theo bước chân
  hJoint(g, 80, 146, ps.lean, () => {
    // SM chứ không phải M: giáp thân của lớp phải cùng bảng màu với vai/mũ/chân của BỘ,
    // nếu không thì mũ ra một màu (theo bậc) còn vai ra màu khác (theo bộ) — lạc hẳn nhau.
    G.upper(g, SM, ps, P);
    hArmorSheen(g, M, gv);                                   // B. chất liệu — đè lên giáp lớp
    hEngrave(g, M, gv);                                      // C. hoa văn khảm
    hPlusSweep(g, SM, gv, now);                              // E. dải sáng quét thân (+10)
    hBelt(g, SM, gv, S);                                     // A. đai lưng + tấm hông
    // quay lưng: áo choàng phủ lên trên thân, đúng như nhìn nhân vật đi ra xa
    if (G.cape && ps.back) hCape(g, G.cape[0], G.cape[1], ps);
    // A. bóng dáng vẽ SAU áo choàng: vai giáp nằm cao hơn mép áo choàng, phải thấy được cả
    // khi nhân vật quay lưng, nếu không thì đi ra xa là mất sạch phần dễ nhận ra nhất.
    hPauldrons(g, SM, gv, S, ps);
    hHelmCrest(g, SM, gv, ps, S);
  });
  hPlusSpark(g, SM, gv, now);                                // E. tàn lửa (trước thân)
  g.restore();
}

// Ảnh chân dung lớp cho màn chọn nhân vật / bảng nhân vật: vẽ thẳng bằng
// drawHeroFigure() nên card LUÔN khớp với người đứng trong game (trước đây là
// thẻ Axie tĩnh, chọn Dark Knight xong vào game lại thấy một hình khác hẳn).
const _heroCardCache = {};
// ⚠ Khoá cache PHẢI gồm chữ ký trang bị. Chân dung nay phụ thuộc gv, nên khoá chỉ theo
// sect:tier như trước sẽ khiến panel Nhân Vật hiện mãi ảnh cũ sau mỗi lần thay đồ.
function heroCardUrl(sectKey, tier, gv){
  const sig = gv ? `${Math.round(gv.t * 10)}_${gv.n}_${gv.rarity}_${Math.round(gv.plus)}_${gv.setColor || ''}` : '-';
  const key = sectKey + ':' + (tier || 1) + ':' + sig;
  if (_heroCardCache[key]) return _heroCardCache[key];
  const cv = document.createElement('canvas');
  cv.width = HERO_W; cv.height = HERO_H;
  drawHeroFigure(cv.getContext('2d'), sectKey, tier || 1, 0, HERO_POSE0, gv);
  return (_heroCardCache[key] = cv.toDataURL('image/png'));
}
function drawPlayer(){
  const sect = SECTS[player.sect];
  const p = player;
  // ═══ LAYERING: đất → sau lưng → người → vũ khí → aura quỹ đạo → danh hiệu ═══
  const riding = false; // Thú Chiến không cưỡi — chiến thú là đồng đội riêng (drawMount)
  const now = performance.now();
  let yOff = 0;
  if (p.moving) yOff -= Math.abs(Math.sin(now/95)) * 2.4; // nhịp bước chân khi chạy — người "sống" hơn
  // ── LỚP ĐẤT (không theo nhảy/cưỡi): bóng đổ ──
  const _shI = gameTimeInfo(), _shDx = (_shI.frac - 0.5) * 22, _shAl = 1 - skyDarkness()*0.35; // bóng xoay theo quỹ đạo mặt trời (Gói C)
  const _shRx = riding?27:16, _shRy = riding?9:6;
  ctx.fillStyle = 'rgba(0,0,0,' + (0.09*_shAl).toFixed(3) + ')'; ctx.beginPath();
  ctx.ellipse(p.x + _shDx, p.y+8, _shRx*1.5, _shRy*1.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,' + (0.20*_shAl).toFixed(3) + ')'; ctx.beginPath();
  ctx.ellipse(p.x + _shDx*0.45, p.y+8, _shRx, _shRy, 0, 0, 7); ctx.fill();
  // bụi gót chân khi chạy — tạo cảm giác chuyển động
  if (!SETTINGS.lowFx && p.moving && !p.ascended && Math.random() < 0.08) // Starflight: ngự kiếm không vấp bụi
    addEffect({ type:'ink', x:p.x - Math.cos(p.face)*10 + rnd(-4,4), y:p.y + 6 + rnd(-2,2), color:'rgba(150,135,105,.4)' });
  // Cương Khí hộ thể — vòng chân khí dưới chân, lớn theo tầng
  const gkT = GANGKHI_TIERS[(p.gangkhi && p.gangkhi.tier) || 0];
  if (gkT){
    const pulse = 0.16 + 0.08*Math.sin(performance.now()/280);
    ctx.save();
    ctx.strokeStyle = gkT.color; ctx.globalAlpha = pulse + p.gangkhi.tier*0.03;
    ctx.lineWidth = 2.5 + p.gangkhi.tier*0.4;
    ctx.beginPath(); ctx.ellipse(p.x, p.y+5, 20 + p.gangkhi.tier*2.5, 8 + p.gangkhi.tier, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha = pulse*0.6;
    ctx.beginPath(); ctx.ellipse(p.x, p.y+5, 26 + p.gangkhi.tier*3, 11 + p.gangkhi.tier*1.2, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // Liên Trảm đang mở — vòng vàng dao động dưới chân báo cửa sổ combo
  if ((p.ltT || 0) > 0){
    const lp = 0.3 + 0.15*Math.sin(now/120);
    ctx.save();
    ctx.strokeStyle = '#ffd76a'; ctx.globalAlpha = lp; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y+5, 24, 10, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha = lp*0.6;
    ctx.beginPath(); ctx.ellipse(p.x, p.y+5, 30, 12.5, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // ── LỚP ĐẤT: ấn Thần Hiệp khi mọi hệ thống đã tối đa ──
  const maxed = isMaxed(p);
  if (maxed) drawThanHiepSeal(p, now);
  ctx.save(); ctx.translate(0, yOff);
  // Ascension aura — rotating orbs grow with realm
  drawDantianAura(p);
  // Tuyệt học max tầng: hào quang Ám Khí & Cung Tiễn
  drawMaxTuyetHocAura(p);
  // Cung Tiễn — linh cung lơ lửng sau lưng
  const bowT = BOW_TIERS[(p.bow && p.bow.tier) || 0];
  if (bowT){
    const backAng = p.face + Math.PI;
    const bx = p.x + Math.cos(backAng)*16, by = p.y - 22 + Math.sin(backAng)*7;
    const bob = Math.sin(performance.now()/350) * 2;
    ctx.save();
    ctx.strokeStyle = bowT.color; ctx.globalAlpha = 0.85; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(bx, by + bob, 13, backAng - 1.15, backAng + 1.15); ctx.stroke();
    ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + Math.cos(backAng-1.15)*13, by + bob + Math.sin(backAng-1.15)*13);
    ctx.lineTo(bx + Math.cos(backAng+1.15)*13, by + bob + Math.sin(backAng+1.15)*13);
    ctx.stroke();
    // mũi tên nạp sẵn
    ctx.globalAlpha = 0.75; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(bx, by + bob);
    ctx.lineTo(bx + Math.cos(backAng)*15, by + bob + Math.sin(backAng)*15); ctx.stroke();
    ctx.restore();
  }
  // Thần Binh môn phái — lơ lửng theo người
  drawThanBinh(p);
  // Áo Choàng (Luyện Bảo Các) — tấm phi phong phất sau lưng, vẽ trước cánh & sprite
  const cloakIt = p.equip && p.equip.aochoang;
  if (cloakIt && cloakIt.cloakTier){
    const cd2 = CLOAK_TIERS[cloakIt.cloakTier];
    const sway = Math.sin(performance.now()/320) * 4;
    const backAng = p.face + Math.PI;
    const bx2 = Math.cos(backAng), by2 = Math.sin(backAng);
    ctx.save();
    ctx.fillStyle = cd2.color; ctx.globalAlpha = 0.82;
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y - 30);
    ctx.lineTo(p.x + 8, p.y - 30);
    ctx.quadraticCurveTo(p.x + bx2*20 + 12, p.y + by2*8 - 6 + sway, p.x + bx2*26 + sway, p.y + 10);
    ctx.quadraticCurveTo(p.x + bx2*14, p.y + 14 + sway*0.5, p.x - bx2*26 - sway, p.y + 10);
    ctx.quadraticCurveTo(p.x + bx2*20 - 12, p.y + by2*8 - 6 + sway, p.x - 8, p.y - 30);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = cd2.color; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  }
  // Cánh (Thiên Thần / Tiểu Quỷ) — đôi cánh vỗ sau lưng, vẽ trước sprite
  const wingIt = p.equip && p.equip.canh;
  if (wingIt){
    // Linh Dực cấp 2 ghi id vào field `wing2` (xem specialItem('canh', WING2_DEFS[j], {wing2:…})),
    // KHÔNG phải `wing`. Trước đây chỉ tra WING_DEFS theo `wing` nên cánh cấp 2 luôn find() ra
    // undefined và rơi về WING_DEFS[0] — người chơi LV80 tốn 1 Hỗn Độn + 20 Hồn Nguyên + 10.000
    // bạc để thăng Phượng Hoàng/Hắc Ma Linh Dực thì cánh lại chuyển thành TRẮNG Thiên Thần,
    // tức là nâng cấp xong nhìn còn kém hơn trước.
    const wd = (wingIt.wing2 && WING2_DEFS.find(w => w.id === wingIt.wing2))
            || WING_DEFS.find(w => w.id === wingIt.wing) || WING_DEFS[0];
    const lift = Math.sin(performance.now()/280) * 0.22 * 10; // vỗ cánh
    ctx.save();
    ctx.fillStyle = wd.color;
    for (const side of [-1, 1]){
      ctx.globalAlpha = 0.88; // thùy cánh chính — vươn rộng ra ngoài thân nhân vật
      ctx.beginPath();
      ctx.moveTo(p.x + side*6, p.y - 24);
      ctx.quadraticCurveTo(p.x + side*26, p.y - 44 - lift, p.x + side*46, p.y - 32 - lift);
      ctx.quadraticCurveTo(p.x + side*34, p.y - 16, p.x + side*8, p.y - 15);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.6; // thùy cánh phụ
      ctx.beginPath();
      ctx.moveTo(p.x + side*6, p.y - 18);
      ctx.quadraticCurveTo(p.x + side*22, p.y - 26 - lift*0.6, p.x + side*38, p.y - 16 - lift*0.6);
      ctx.quadraticCurveTo(p.x + side*26, p.y - 8, p.x + side*6, p.y - 10);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  const wph = p.walkPh || 0;
  const castK = (p.castT || 0) / 0.38;
  const atkK = (p.atkAnim || 0) / 0.22;
  // `atkAnim` ĐẾM NGƯỢC nên atkK = 1 ở khung ĐẦU và 0 ở khung cuối: thân người dồn tới xa nhất
  // ngay lúc LẤY ĐÀ rồi lùi dần trong lúc lưỡi bổ xuống. Trọng tâm đi ngược chiều đòn đánh —
  // đúng thứ làm cú chém "nhẹ hều". hSwing(1-atkK) cho thân dồn tới đúng lúc lưỡi chạm.
  const lungeK = Math.max(0, hSwing(1 - Math.min(1, atkK)));
  const pulse = 1 + castK*0.12 + (p.moving ? Math.sin(wph*2)*0.025 : Math.sin(wph)*0.015);
  if (p.ascended){
    const _tKey = (p.gender === 'nu' ? 'nu' : 'nam') + '_' + (TIEN_SKINS[p.tienSkin] ? p.tienSkin : 'bach');
    const _tim = TIEN_IMGS[_tKey];
    if (_tim && _tim.complete && _tim.naturalWidth){
      const _tsk = TIEN_SKINS[p.tienSkin] || TIEN_SKINS.bach;
      const sh = 128, sw = sh * (_tim.naturalWidth/_tim.naturalHeight);
      const hover = Math.sin(now/520)*3.4; // ngự kiếm: lơ lửng trên phi kiếm
      ctx.save(); ctx.translate(p.x + Math.cos(p.face)*lungeK*5, p.y + 6 - hover);
      ctx.scale(pulse, pulse);
      // hào quang tán tiên sau lưng (màu theo skin)
      const hg = ctx.createRadialGradient(0, -sh*0.52, 8, 0, -sh*0.52, 72);
      hg.addColorStop(0, _tsk.halo); hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.32 + 0.12*Math.sin(now/300); ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(0, -sh*0.52, 72, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      // tuyệt chiêu: kim quang bùng khi thi triển
      if (castK > 0){
        const cg = ctx.createRadialGradient(0, -sh*0.4, 4, 0, -sh*0.4, 56);
        cg.addColorStop(0, _tsk.halo); cg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = castK*0.5; ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(0, -sh*0.4, 56, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowColor = _tsk.halo; ctx.shadowBlur = 14;
      }
      ctx.drawImage(_tim, -sw/2, -sh, sw, sh);
      ctx.restore();
    } else {
      drawAscendedFigure(p, now, castK, atkK, maxed); // fallback VFX khi sprite chưa tải xong
    }
  } else {
    // Nhân vật dựng bằng khớp xương.
    const sh = 104;
    const flip = Math.cos(p.face) < 0;
    ctx.save();
    ctx.translate(p.x + Math.cos(p.face)*lungeK*7,
                  (p.y - 42) + Math.sin(p.face)*lungeK*3);
    if (flip) ctx.scale(-1, 1);
    ctx.scale(pulse, pulse);
    // Thần Hiệp: hào quang vàng rực sau lưng + viền kim quang quanh thân
    if (maxed){
      const hg = ctx.createRadialGradient(0, -8, 6, 0, -8, 64);
      hg.addColorStop(0, 'rgba(255,228,150,.55)'); hg.addColorStop(0.55, 'rgba(255,177,92,.16)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.85 + 0.15*Math.sin(now/300); ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(0, -8, 64, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 15;
    }
    // tuyệt chiêu: hào quang phái lóe sau lưng
    if (castK > 0){
      const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
      cg.addColorStop(0, sect.glow); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = castK*0.55; ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(0, 0, 52, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const s = sh / HERO_H;
    ctx.scale(s, s); ctx.translate(-HERO_W/2, -HERO_H/2);
    const _act = castK > 0 ? (p.castAct || heroActOf(p.sect, 'a'))
                           : (p.atkAct  || heroActOf(p.sect, 'basic'));
    const _ps = heroPose(wph, !!p.moving, atkK, Math.min(1, castK), now, _act, p.sway, p.swayDir);
    // Góc nhìn 3/4 kiểu MU: đi lên trên là thấy LƯNG, đi xuống là thấy mặt.
    // (Trước đây hướng nào cũng nhìn thẳng vào mặt người chơi, trông rất sai.)
    _ps.back = Math.sin(p.face) < -0.42;
    // Trúng đòn: nhân vật giật ngửa ra sau, đầu hất lên, tay bung — trước đây chỉ
    // có viền đỏ nhấp trên màn hình, còn thân người thì đứng im như không hề gì.
    const _hurt = Math.min(1, (p.hurtT || 0) / 0.3);
    if (_hurt > 0){
      _ps.lean -= 0.24 * _hurt;
      _ps.head += 0.26 * _hurt;
      _ps.armL -= 0.42 * _hurt;
      _ps.armR -= 0.22 * _hurt;
      _ps.bob  -= 2.2 * _hurt;
    }
    drawHeroFigure(ctx, p.sect, heroTier(p), now, _ps, gearVisual(p));
    ctx.restore();
  }
  // Vũ khí danh phái cầm tay — chỉ hình Thần Hiệp cần, nhân vật khớp xương đã tự cầm vũ khí
  if (p.ascended) drawSectWeapon(p, sect);
  // weapon arc while attacking
  if (p.atkAnim > 0){
    const k = p.atkAnim/0.22;
    ctx.strokeStyle = sect.glow; ctx.globalAlpha = k; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y-18, 26, p.face-1.1+(1-k)*1.6, p.face-0.2+(1-k)*1.6); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Khai Quang: vũ khí +9 rực sáng, +11 lôi quang cuốn quanh
  const wpn = p.equip && p.equip.vukhi;
  if (wpn && wpn.plus >= 9){
    const gx = p.x + Math.cos(p.face)*14, gy = p.y - 16 + Math.sin(p.face)*8;
    const g2 = ctx.createRadialGradient(gx, gy, 0, gx, gy, 16);
    g2.addColorStop(0, wpn.plus >= 11 ? 'rgba(255,177,92,.85)' : 'rgba(126,203,255,.55)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(gx, gy, 16, 0, 7); ctx.fill();
    if (wpn.plus >= 11 && Math.random() < 0.3){
      ctx.strokeStyle = '#fff8d0'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(gx, gy);
      let lx = gx, ly = gy;
      for (let i=0;i<3;i++){ lx += rnd(-11,11); ly += rnd(-11,11); ctx.lineTo(lx, ly); }
      ctx.stroke();
    }
  }
  // Pet đồng hành — linh quang bay lượn phía sau lưng
  const petIt = p.equip && p.equip.pet;
  if (petIt){
    const pd = PET_DEFS.find(d => d.id === petIt.pet) || PET_DEFS[0];
    const side = Math.cos(p.face) >= 0 ? -1 : 1;
    const px = p.x + side*40, py = p.y - 34 + Math.sin(performance.now()/350)*4;
    const pg = ctx.createRadialGradient(px, py, 0, px, py, 11);
    pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.4, pd.color); pg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px, py, 11, 0, 7); ctx.fill();
    ctx.fillStyle = pd.color;
    ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fill();
  }
  ctx.restore();
  // ── Danh hiệu trên đỉnh đầu (chọn trong bảng Nhân Vật → tab Thông Tin) ──
  drawOverheadTitle(p, yOff, riding, maxed);
}
// Ascension aura: rotating orbs + rings around the character, scaling with realm
function drawDantianAura(p){
  const realm = (p.dantian && p.dantian.realm) || 0;
  if (realm <= 0) return;
  const now = performance.now();
  const orbs = Math.min(2 + Math.floor(realm/2), 6); // 2 → 6 châu, không che người
  const radius = 26 + realm * 4;
  const colors = ['#5ea0e8','#6fb8f0','#8fd0ff','#c8e0ff','#7ecbff','#ffd76a'];
  const col = colors[Math.min(realm, 5)];
  const speed = now / (700 - realm * 60);
  // soft glow behind character
  const g = ctx.createRadialGradient(p.x, p.y-16, 4, p.x, p.y-16, radius + 12);
  g.addColorStop(0, realm >= 5 ? 'rgba(126,203,255,.13)' : 'rgba(94,160,232,.10)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p.x, p.y-16, radius+12, 0, 7); ctx.fill();
  // rotating dashed ring (realm 3+)
  if (realm >= 3){
    ctx.save();
    ctx.strokeStyle = col; ctx.globalAlpha = 0.3 + realm*0.04;
    ctx.setLineDash([7, 11]); ctx.lineDashOffset = -now/40;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(p.x, p.y-14, radius, radius*0.40, 0, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  // second counter-rotating ring at Starforged
  if (realm >= 5){
    ctx.save();
    ctx.strokeStyle = '#ffd76a'; ctx.globalAlpha = 0.42;
    ctx.setLineDash([4, 8]); ctx.lineDashOffset = now/30;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y-14, radius+9, (radius+9)*0.44, 0, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  // orbiting true-qi orbs — nhỏ gọn, sáng ở lõi
  for (let i = 0; i < orbs; i++){
    const ang = speed + i * (Math.PI*2/orbs);
    const ox = p.x + Math.cos(ang) * radius;
    const oy = p.y - 14 + Math.sin(ang) * radius * 0.40;
    const os = 1.7 + realm * 0.42;
    const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, os*2.1);
    og.addColorStop(0, 'rgba(255,255,255,.95)'); og.addColorStop(0.4, col); og.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(ox, oy, os*2.1, 0, 7); ctx.fill();
  }
}
function drawTitleBackdrop(){
  ctx.fillStyle = '#ece2c8'; ctx.fillRect(0,0,W,H);
  drawMountains();
  for (const mi of mists){
    const g = ctx.createRadialGradient(mi.x, mi.y, 0, mi.x, mi.y, mi.r);
    g.addColorStop(0, `rgba(236,226,200,${mi.a*2})`); g.addColorStop(1, 'rgba(236,226,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mi.x, mi.y, mi.r, 0, 7); ctx.fill();
    mi.x += mi.v*0.016; if (mi.x - mi.r > W) mi.x = -mi.r;
  }
}

// ---------- HUD ----------
const el = id => document.getElementById(id);
function setSkillIcon(id, url){
  const b = el(id);
  b.style.backgroundImage = `url(${url})`;
  b.classList.add('has-img');
}
// ---------- Panels ----------
el('btn-char').addEventListener('click', ()=>togglePanel('char'));
el('btn-inv').addEventListener('click', ()=>togglePanel('inv'));
el('btn-bag').addEventListener('click', ()=>togglePanel('bag'));
el('btn-skill').addEventListener('click', ()=>togglePanel('skill'));
el('btn-map').addEventListener('click', ()=>togglePanel('map'));
const btnSet = el('btn-settings');
if (btnSet) btnSet.addEventListener('click', ()=>togglePanel('settings'));
const btnQlog = el('btn-qlog');
if (btnQlog) btnQlog.addEventListener('click', ()=>togglePanel('qlog'));
const btnMini = el('btn-minimap');
if (btnMini) btnMini.addEventListener('click', ()=>{
  SETTINGS.minimap = !SETTINGS.minimap; saveSettings();
  AudioSys.sfx('ui', 0.5);
});
const btnQt = el('btn-questtracker');
if (btnQt) btnQt.addEventListener('click', ()=>{
  SETTINGS.questTracker = !SETTINGS.questTracker; saveSettings();
  el('quest-tracker').classList.toggle('qt-closed', !SETTINGS.questTracker);
  el('qt-arrow').textContent = SETTINGS.questTracker ? '▾' : '▸';
  AudioSys.sfx('ui', 0.5);
});
// khôi phục trạng thái đóng/mở đã lưu (mặc định mở) — không đợi tới lần bấm đầu tiên
if (el('quest-tracker')){
  el('quest-tracker').classList.toggle('qt-closed', !SETTINGS.questTracker);
  if (el('qt-arrow')) el('qt-arrow').textContent = SETTINGS.questTracker ? '▾' : '▸';
}
const btnCl = el('btn-combatlog');
if (btnCl) btnCl.addEventListener('click', ()=>{
  SETTINGS.combatLog = !SETTINGS.combatLog; saveSettings();
  el('combat-log').classList.toggle('cl-closed', !SETTINGS.combatLog);
  el('cl-arrow').textContent = SETTINGS.combatLog ? '▾' : '▸';
  AudioSys.sfx('ui', 0.5);
});
if (el('combat-log')){
  el('combat-log').classList.toggle('cl-closed', !SETTINGS.combatLog);
  if (el('cl-arrow')) el('cl-arrow').textContent = SETTINGS.combatLog ? '▾' : '▸';
}
el('btn-pk').addEventListener('click', ()=>{
  if (mapDef().type === 'safe') return;
  player.pk = !player.pk;
  addFloat(player.x, player.y-40, player.pk ? 'PK: BẬT — có thể tấn công Du Hiệp!' : 'PK: Tắt', player.pk ? '#ff5a4a' : '#8a8a8a', 13);
  saveGame();
});
// QA: pha Boss Săn của phó bản buộc tự tay né — dùng chung cho cả chỗ ép tắt AUTO mỗi frame
// trong update() lẫn chỗ chặn bật lại AUTO ở toggleAuto() ngay dưới đây.
function autoBossLockActive(){
  return !!(DGN && DGN.huntSpawned && DGN.huntRef && !DGN.huntRef.dead);
}
// AUTO FARM — treo máy: tự đánh quái gần nhất, tự tung kỹ năng, tự uống thuốc
window.toggleAuto = function(){
  if (!player) return;
  if (!player.auto && autoBossLockActive()){
    addFloat(player.x, player.y-56, 'Boss này phải tự tay chiến — không thể bật AUTO lúc này!', '#ff9a5a', 13);
    AudioSys.sfx('ui', 0.3);
    return;
  }
  player.auto = !player.auto;
  if (player.auto){
    // Trong phó bản, quái đợt luôn spawn ở (1300,800) — cách xa cửa vào (1300,1560) hơn tầm AUTO
    // mặc định. Bật AUTO ngay cửa vào trước đây neo tại chỗ đứng, đứng im không đánh gì (QA phát hiện).
    if (DGN && mapDef().dungeon){ player._autoAX = 1300; player._autoAY = 800; }
    else { player._autoAX = player.x; player._autoAY = player.y; } // neo tại chỗ bật — auto chỉ ôm 1-2 bãi quái quanh neo
    // QA: bật AUTO khi còn 1 lệnh click-di-chuyển tay đang treo (chưa tới đích) — nếu không huỷ ở
    // đây, tắt AUTO lại sau đó sẽ khiến nhân vật tự đi tiếp theo lệnh cũ dù không có input mới.
    moveTarget = null; moveWaypoint = null;
    // QA: mở khoá bãi quái cũ mỗi lần bật lại AUTO — để nó tự khoá vào bãi gần điểm neo mới nhất
    player._autoZone = null; player._autoZoneLocked = false;
  }
  addFloat(player.x, player.y-56, player.auto ? '⚔ AUTO FARM: BẬT — ôm 1-2 bãi quái quanh điểm neo, tự tung chiêu, tự uống thuốc' : 'AUTO FARM: TẮT — về chế độ thủ công',
    player.auto ? '#6ae88a' : '#b8a888', 13);
  AudioSys.sfx('ui', 0.5);
  updateAutoBtn();
  saveGame();
};
function updateAutoBtn(){
  const b = el('btn-auto');
  if (!b || !player) return;
  b.classList.toggle('auto-on', !!player.auto);
  b.classList.toggle('auto-off', !player.auto);
  b.textContent = player.auto ? '⚔ AUTO: BẬT' : '⚔ AUTO';
}
el('btn-auto').addEventListener('click', ()=>toggleAuto());

function renderChar(){
  const p = player, sect = SECTS[p.sect];
  let html = `<h3>Nhân Vật — ${sect.name} Cấp ${p.level}</h3>`;
  // chân dung = chính nhân vật trong game, ở đúng bậc Thần Binh đang mang
  html += `<img class="char-portrait" src="${p.ascended ? 'assets/tien/' + (p.gender === 'nu' ? 'nu' : 'nam') + '_' + (TIEN_SKINS[p.tienSkin] ? p.tienSkin : 'bach') + '.png' : heroCardUrl(p.sect, heroTier(p), gearVisual(p))}" alt="${sect.name}">${p.ascended ? `<div style="margin-top:4px;font-size:11.5px;color:#fff2b0">☁ Tán Tiên — xuất thế khỏi ${sect.name}, ràng buộc Lớp đã phá bỏ</div>` : ""}`;
  // Tán Nhân: lối vào lễ Bái Sư Nhập Phái (cấp 10)
  if (p.sect === 'vophai'){
    html += `<div style="margin:8px 0;padding:10px;border:1px dashed rgba(126,203,255,.45);border-radius:6px;text-align:center">
      <div style="font-size:12px;color:#9aa8d4;margin-bottom:6px">Unclassed lang bạt — chưa gia nhập Lớp nào</div>
      ${p.level >= 10
        ? `<button class="mini-btn" style="font-size:14px;padding:9px 22px;border-color:#7ecbff;color:#7ecbff" onclick="openSectCeremony()">⚔ BÁI SƯ NHẬP PHÁI</button>`
        : `<div style="font-size:12px;opacity:.7">Bái sư mở khóa ở <b style="color:#7ecbff">cấp 10</b> (hiện cấp ${p.level})</div>`}
    </div>`;
  }
  // The Hatching: 3 trait + tính cách
  if (p.traits && p.traits.length){
    const pers = PERSONALITIES[p.personality] || PERSONALITIES.trung;
    html += `<div style="margin:6px 0 2px;font-size:12px;color:#7ecbff;letter-spacing:1px">◈ DẤU ẤN KHAI SINH · ${pers.glyph} ${pers.name}</div>`;
    for (const tid of p.traits){
      const tr = TRAITS.find(t => t.id === tid);
      if (!tr) continue;
      const tier = TRAIT_TIERS[tr.tier];
      html += `<div class="trait-row"><span class="t-glyph">${tr.glyph}</span>
        <span class="t-name" style="color:${tier.color}">${tr.name} <small style="opacity:.6">[${tier.name}]</small></span>
        <span class="t-desc">${tr.desc}</span></div>`;
    }
  }
  // ── Khắc Ấn đang mang: thứ người chơi cần tra nhanh là "chiêu mình đang khác thường ở chỗ nào" ──
  {
    const own = Object.keys(p.sigils || {});
    const pool = sigilPool(p.sect);
    html += `<div style="margin:8px 0 2px;font-size:12px;color:#ffd76a;letter-spacing:1px">◆ KHẮC ẤN ĐANG MANG · ${own.length}/${pool.length}</div>`;
    if (!own.length){
      html += `<div style="font-size:11.5px;opacity:.62;margin-bottom:6px;line-height:1.7">
        Chưa mang Khắc Ấn nào. Khắc Ấn đổi <b>cách chiêu hoạt động</b>, không cộng thêm chỉ số —
        rơi từ <b style="color:#b08ae8">Bảo Hạp IV+</b>, <b style="color:#7ecbff">Hung Thần Giáng Thế</b>
        và <b style="color:#ffd76a">Xâm Lăng Vàng</b>.</div>`;
    } else {
      for (const k of own){
        const sg = SIGIL_DEFS[k];
        html += `<div class="trait-row"><span class="t-glyph" style="color:${sg.color}">◆</span>
          <span class="t-name" style="color:${sg.color}">${sg.name}</span>
          <span class="t-desc">${sg.desc}</span></div>`;
      }
      const miss = pool.filter(k => !p.sigils[k]);
      if (miss.length) html += `<div style="font-size:11px;opacity:.5;margin-bottom:6px">Chưa có: ${miss.map(k=>SIGIL_DEFS[k].name).join(' · ')}</div>`;
    }
  }
  html += `<div style="font-size:12px;color:#9aa8d4;margin-bottom:8px">Điểm tiềm năng còn: <b style="color:#7ecbff">${p.free}</b> (mỗi cấp +5)</div>`;
  // Gợi ý build: điểm nào quy đổi ra Công Kích cho ĐÚNG phái này (xem SECTS[x].atkSrc trong calcDerived())
  const _atkSrc = sect.atkSrc || { str:2.0 };
  const _dmgStatNames = Object.keys(_atkSrc).map(k => ATTR_INFO[k].name);
  html += `<div style="font-size:11.5px;color:#ffd76a;margin-bottom:10px;padding:6px 10px;border:1px dashed rgba(255,215,106,.4);border-radius:6px">💡 ${sect.name} ra Công Kích từ <b>${_dmgStatNames.join(' + ')}</b> — dồn điểm tiềm năng vào đây là hiệu quả nhất.</div>`;
  const base = { str:p.str, agi:p.agi, def:p.def, vit:p.vit, ene:p.ene };
  const drv = { str:p.dStr, agi:p.dAgi, def:p.dDef, vit:p.dVit, ene:p.dEne };
  for (const k of ['str','agi','def','vit','ene']){
    const a = ATTR_INFO[k];
    const isDmgStat = !!_atkSrc[k];
    html += `<div class="attr-row"><span>${a.name}${isDmgStat?' <span style="color:#ffd76a;font-size:10.5px">★</span>':''} <span style="opacity:.6;font-size:11px">(${a.desc})</span></span>
      <span><b>${drv[k]}</b>${drv[k]!==base[k]?` <span style="color:#5ea0e8;font-size:11px">(${base[k]}+${drv[k]-base[k]})</span>`:''}
      <input type="number" class="attr-qty" id="qty-${k}" min="1" max="${p.free||1}" value="${Math.min(10, p.free||1)||1}" ${p.free<=0?'disabled':''}>
      <button class="plus-btn" onclick="addAttr('${k}', qtyOf('${k}'))" ${p.free<=0?'disabled':''} title="Cộng theo ô số">+</button>
      <button class="plus-btn max-btn" onclick="addAttr('${k}', player.free)" ${p.free<=0?'disabled':''} title="Dồn hết điểm còn lại">Max</button></span></div>`;
  }
  html += `<div class="stat-sec">THUỘC TÍNH CHIẾN ĐẤU</div>`;
  const stats = [
    ['Công Kích', p.atk], ['Sinh Lực', `${Math.ceil(p.hp)} / ${p.maxHp}`],
    ['Giảm Thương', Math.round(p.defRed*100)+'%'],
    ['Bạo Kích', Math.round(p.crit*100)+'%'], ['Né Tránh', Math.round(p.eva*100)+'%'],
    ['Tốc Đánh', p.aspd.toFixed(2)+'s'], ['Hồi Instinct', p.qireg.toFixed(1)+'/s'],
  ];
  for (const [n,v] of stats) html += `<div class="stat-row"><span>${n}</span><b>${v}</b></div>`;
  // Thần Binh môn phái — trục progression riêng, không chiếm slot Vũ Khí (GDD §5)
  const tbD = THANBINH[p.sect] || THANBINH.vophai;
  const tbTier = (p.thanbinh && p.thanbinh.tier) || 1;
  const tbMax = tbTier >= TB_MAX_TIER;
  const tbC = tbMax ? null : tbCost(tbTier);
  html += `<div class="stat-sec">⚔ THẦN BINH — ${tbD.name}</div>`;
  html += `<div style="margin:2px 0 6px;padding:8px 10px;border:1px solid ${tbD.color}55;border-radius:6px;background:rgba(0,0,0,.22)">
    <div style="font-size:13px;color:${TB_TIER_COLORS[tbTier-1]};font-weight:700">${tbD.name} · Tầng ${tbTier}【${TB_TIER_NAMES[tbTier-1]}】${tbMax ? ' — ĐÃ THỨC TỈNH ✦' : ''}</div>
    <div style="font-size:11px;color:#9aa8d4;font-style:italic;margin:2px 0">${tbD.lore}</div>
    <div class="stat-row"><span>ST chiêu Lớp</span><b>+${Math.round(tbTier*2.5)}%</b></div>
    <div class="stat-row"><span>Cộng thêm</span><b>+${tbTier*3} Lực · +${tbTier*2} Mẫn · +${tbTier*2} Cốt · +${tbTier*3} Thể</b></div>
    ${tbMax
      ? `<div style="font-size:11.5px;color:#ffe9a8;margin-top:4px">Hình thái cuối — thần binh rực rỡ tối đa ✦</div>`
      : `<button class="mini-btn" style="margin-top:6px;border-color:${tbD.color};color:${tbD.color}" onclick="upgradeThanBinh()">Luyện lên tầng ${tbTier+1}【${TB_TIER_NAMES[tbTier]}】</button>
         <div style="font-size:11px;color:#7a86ad;margin-top:3px">Cần: ${tbC.noidan} Nội Đan (có ${tbNoidanTotal()}) + ${tbC.mat} Tinh Thạch (có ${p.mat})</div>`}
  </div>`;
  html += `<div class="stat-sec">CHIÊU THỨC</div>`;
  html += `<div class="stat-row"><span>1 — ${sect.skillA.name}</span><b>${p.level>=2?'×'+sect.skillA.mult:'Cấp 2'}</b></div>`;
  const akT = AMKHI_TIERS[p.amkhiX && p.amkhiX.tier || 0];
  html += `<div class="stat-row"><span>2 — Ám Khí${akT?` · <span style="color:${akT.color}">${akT.name}</span>`:''}</span><b>${p.level>=4?'×'+AMKHI.mult:'Cấp 4'}</b></div>`;
  html += `<div class="stat-row"><span>3 — Trấn Phái: ${sect.tp.name}</span><b>${p.level>=9?'×'+sect.tp.mult:'Cấp 9'}</b></div>`;
  if (p.bikip && p.bikip.hmtp)
    html += `<div class="stat-row"><span style="color:#e84a6a">☠ Huyết Ma Thôn Phệ (bí kíp)</span><b>hút 10% ST</b></div>`;
  // Danh hiệu — chỉ số cộng dồn vĩnh viễn, chọn 1 hiển thị trên đầu
  html += `<div class="stat-sec">DANH HIỆU — bấm để chọn danh hiệu hiển thị trên đỉnh đầu</div>`;
  html += `<div style="font-size:11px;color:#9aa8d4;margin-bottom:6px">Mở khóa = cộng dồn chỉ số vĩnh viễn (không cần trang bị). Bấm lần nữa vào danh hiệu đang hiển thị để ẩn.</div>`;
  for (const t of TITLES){
    const un = p.titles.unlocked.includes(t.id);
    const eq = p.titles.equipped === t.id;
    html += `<div class="slot-row title-row${eq?' equipped':''}" style="${un?'cursor:pointer;':'opacity:.45;'}${eq?'border-color:'+t.color+';background:rgba(76,141,255,.10);':''}" ${un?`onclick="equipTitle('${t.id}')"`:''}>
      <span class="s-name"><b style="color:${un?t.color:'#8a8a8a'}">${un?'【'+t.name+'】':t.name}</b>
      <span style="opacity:.6;font-size:11px"> — ${un ? titleStatText(t.stats) : '🔒 '+t.desc}</span></span>
      ${eq?`<span style="color:${t.color};font-size:11px">✔ ĐANG HIỂN THỊ</span>`:`<span style="opacity:.4;font-size:11px">${un?'chọn':''}</span>`}</div>`;
  }
  CE().innerHTML = html;
}
function titleStatText(st){
  const parts = [];
  if (st.hp) parts.push(`+${st.hp} HP`);
  if (st.atkPct) parts.push(`+${Math.round(st.atkPct*100)}% Công`);
  if (st.crit) parts.push(`+${st.crit}% Bạo`);
  if (st.allPct) parts.push(`+${Math.round(st.allPct*100)}% Toàn TT`);
  if (st.forgeRate) parts.push(`+${st.forgeRate}% tỉ lệ rèn`);
  return parts.join(' · ');
}
window.equipTitle = function(id){
  if (!player.titles.unlocked.includes(id)) return;
  player.titles.equipped = (player.titles.equipped === id) ? null : id;
  saveGame(); renderChar();
};
// ═══════════ BẢNG NHÂN VẬT (V) — cửa sổ nhân vật kiểu MU ═══════════
// Lớp, cấp, EXP, điểm cộng và bảng chỉ số trước đây nằm rải rác: lớp/cấp nhồi vào dòng tên
// góc trái (dài tới mức xuống ba dòng), điểm cộng chôn trong tab đầu của bảng Nhân Vật nhiều
// tab, còn Instinct thì chiếm một dòng HUD riêng suốt trận. Gom hết vào một cửa sổ tra cứu.
function renderVStat(){
  const p = player, sect = SECTS[p.sect];
  const tt = p.titles && p.titles.equipped && TITLES.find(x => x.id === p.titles.equipped);
  const xpNeed = XP_TABLE[p.level - 1], maxed = p.level >= MAX_LV;
  const xpPct = maxed ? 100 : clamp(100 * p.xp / xpNeed, 0, 100);
  let h = `<h3>Nhân Vật</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  h += `<div class="vs-head">
    ${tt ? `<div class="vs-title">【${tt.name}】</div>` : ''}
    <div class="vs-name">${p.name || sect.name}</div>
    <div class="vs-cls" style="color:${sect.color}">${sect.name} · Cấp ${p.level}${maxed ? ' (Tối đa)' : ''}${p.resetCount ? ` · <span style="color:#ffd76a">🔄${p.resetCount}</span>` : ''}</div>
    <div class="bar xp vs-xp"><div class="fill" style="width:${xpPct}%"></div><span>${maxed ? 'MAX' : `${Math.floor(p.xp).toLocaleString()} / ${xpNeed.toLocaleString()} EXP`}</span></div>
  </div>`;

  h += `<div class="stat-sec">ĐIỂM TIỀM NĂNG <b style="float:right;color:${p.free > 0 ? '#ffd76a' : '#8a92a8'}">${p.free}</b></div>`;
  const base = { str:p.str, agi:p.agi, def:p.def, vit:p.vit, ene:p.ene };
  const drv  = { str:p.dStr, agi:p.dAgi, def:p.dDef, vit:p.dVit, ene:p.dEne };
  const _src = (sect.atkSrc) || {};
  for (const k of ['str','agi','def','vit','ene']){
    const a = ATTR_INFO[k];
    h += `<div class="attr-row"><span>${a.name}${_src[k] ? ' <span style="color:#ffd76a;font-size:10.5px" title="Chỉ số này quy ra Công Kích cho lớp của ngươi">★</span>' : ''}</span>
      <span><b>${drv[k]}</b>${drv[k] !== base[k] ? ` <span style="color:#5ea0e8;font-size:11px">(${base[k]}+${drv[k] - base[k]})</span>` : ''}
      <input type="number" class="attr-qty" id="qty-${k}" min="1" max="${p.free || 1}" value="${Math.min(10, p.free || 1) || 1}" ${p.free <= 0 ? 'disabled' : ''}>
      <button class="plus-btn" onclick="addAttr('${k}', qtyOf('${k}'))" ${p.free <= 0 ? 'disabled' : ''} title="Cộng theo ô số">+</button>
      <button class="plus-btn max-btn" onclick="addAttr('${k}', player.free)" ${p.free <= 0 ? 'disabled' : ''} title="Dồn hết điểm còn lại">Max</button></span></div>`;
  }

  h += `<div class="stat-sec">THUỘC TÍNH CHIẾN ĐẤU</div>`;
  const ae = atkElem();
  const rows = [
    ['Công Kích', p.atk], ['Sinh Lực', `${Math.ceil(p.hp)} / ${p.maxHp}`],
    ['Chân Khí', `${Math.floor(p.qi)} / ${p.maxQi}`],
    ['Giảm Thương', Math.round(p.defRed * 100) + '%'],
    ['Bạo Kích', Math.round(p.crit * 100) + '%'], ['Né Tránh', Math.round(p.eva * 100) + '%'],
    ['Tốc Đánh', p.aspd.toFixed(2) + 's'], ['Hồi Instinct', p.qireg.toFixed(1) + '/s'],
    ['Instinct', Math.floor(p.khi || 0).toLocaleString('vi-VN')],
  ];
  if (ae) rows.push(['Hệ đòn đánh', `<span style="color:${elColor(ae)}">${ELEM[ae].glyph} ${elName(ae)}</span>`]);
  for (const [nm, v] of rows) h += `<div class="stat-row"><span>${nm}</span><b>${v}</b></div>`;
  h += `<div class="vs-foot">Instinct dùng để nâng kỹ năng (K) · Hệ đòn đánh theo vũ khí, chỉ tác dụng lên quái</div>`;
  el('panel-vstat').innerHTML = h;
}
window.qtyOf = function(k){
  const el = document.getElementById('qty-'+k);
  const n = parseInt(el && el.value, 10);
  return (!n || n < 1) ? 1 : n;
};
window.addAttr = function(k, n){
  if (player.free <= 0) return;
  n = Math.max(1, Math.min(Math.floor(n) || 1, player.free)); // ô cộng điểm nhanh: gõ số hoặc bấm Max thay vì bấm tay từng điểm
  player.free -= n; player[k] += n;
  calcDerived();
  // Cộng điểm giờ làm được từ HAI bảng — vẽ lại đúng bảng đang mở, không thì bấm + ở bảng V
  // mà số không nhúc nhích.
  if (!el('panel-vstat').classList.contains('hidden')) renderVStat();
  else renderChar();
  saveGame();
};

window.forgeUseCharm = false;
// GDD 3 giai đoạn: +1~6 an toàn 100% (Huyền Thiết) · +7~9 Đập Ngọc Tu La, xịt tụt 1 cấp · +10/+11 CHỈ tại Lò Rèn Hoàng Gia
function forgeRule(target){
  if (target <= 6)  return { rate:100, mat: 1 + Math.floor((target-1)/3), tuLa:0, hon:0, fail:'none' };
  if (target <= 9)  return { rate:{7:75, 8:65, 9:50}[target], mat:1, tuLa:1, hon:0, fail:'drop1' };
  // GDD Phá Thiên Kiếp: +10 = 50%, +11 = 45%, thất bại → HỦY DIỆT trang bị (Phù bảo hộ)
  if (target === 10) return { rate:50, mat:2, tuLa:3, hon:1, fail:'break', bagua:true };
  return { rate:45, mat:3, tuLa:5, hon:2, fail:'break', bagua:true };
}
// ── Drop v2.0: TẤN PHẨM (leo phẩm Phàm→Chí Tôn) · KẾ THỪA (leo giai) · ĐỔI HỆ ──
// 2 bậc đầu 100% bằng vật liệu quái (tân thủ học vòng lặp); 2 bậc sau khóa bằng vật liệu boss
const TANPHAM_RULES = {
  0:{ tinh:10, manh:0,  tichMa:0, an:0, silver:500,   rate:100 },
  1:{ tinh:20, manh:10, tichMa:0, an:0, silver:2000,  rate:100 },
  2:{ tinh:0,  manh:20, tichMa:3, an:0, silver:8000,  rate:80  },
  3:{ tinh:0,  manh:30, tichMa:8, an:1, silver:20000, rate:60  },
};
function findItemByUid(uid){
  for (const s in player.equip){ const it = player.equip[s]; if (it && it.uid === uid) return it; }
  for (let i = 0; i < player.inv.length; i++) if (player.inv[i].uid === uid) return player.inv[i];
  return null;
}
window.doTanPham = function(uid){
  const it = findItemByUid(uid);
  if (!it || it.special || it.rarity >= 4) return;
  const r = TANPHAM_RULES[it.rarity];
  if (!r) return;
  if (player.mat < r.tinh || player.mats.manh < r.manh || player.mats.tichMa < r.tichMa || player.mats.anTranAi < r.an || player.silver < r.silver) return;
  if (Math.random()*100 < r.rate){
    player.mat -= r.tinh; player.mats.manh -= r.manh; player.mats.tichMa -= r.tichMa; player.mats.anTranAi -= r.an; player.silver -= r.silver;
    it.rarity++; rerollItemRarity(it);
    addFloat(player.x, player.y-52, `✦ TẤN PHẨM — ${RARITIES[it.rarity].name}!`, RARITIES[it.rarity].color, 16);
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:RARITIES[it.rarity].color, big:true });
    AudioSys.sfx('levelup', 0.8);
  } else {
    // Xịt: giữ nguyên đồ & Ấn Cổng Vực — chỉ mất nửa vật liệu (không hardcore)
    player.mat -= Math.floor(r.tinh/2); player.mats.manh -= Math.floor(r.manh/2);
    player.mats.tichMa -= Math.floor(r.tichMa/2); player.silver -= Math.floor(r.silver/2);
    addFloat(player.x, player.y-52, 'Tấn phẩm thất bại — trang bị vẹn nguyên, mất nửa vật liệu', '#ff7a6a', 12);
    AudioSys.sfx('hurt', 0.5);
  }
  calcDerived(); saveGame(); renderForge();
};
// Kế Thừa: tăng 1 giai — giữ Phẩm/+N/dòng phụ, chỉ số gốc = 90% bản gốc giai mới
window.doKeThua = function(uid){
  const it = findItemByUid(uid);
  if (!it || it.special || it.tier >= 10) return;
  const cost = { manh:40, tichMa:4, silver:5000*it.tier };
  if (player.mats.manh < cost.manh || player.mats.tichMa < cost.tichMa || player.silver < cost.silver) return;
  player.mats.manh -= cost.manh; player.mats.tichMa -= cost.tichMa; player.silver -= cost.silver;
  it.tier++;
  it.level = (it.tier-1)*10 + 10;
  const slot = SLOTS.find(s => s.id === it.slot);
  if (slot && it.main) it.main.v = Math.max(1, Math.round(slot.base(it.tier, it.rarity) * 0.9));
  addFloat(player.x, player.y-52, `⚒ KẾ THỪA — lên giai【${giaiName(it.tier)}】!`, '#9fd0ff', 15);
  addEffect({ type:'ring', x:player.x, y:player.y, r:80, color:'#9fd0ff', big:true });
  AudioSys.sfx('levelup', 0.7);
  calcDerived(); saveGame(); renderForge();
};
// Đổi Hệ: 1 Hỗn Độn Châu — re-roll nguyên tố trang bị
window.doDoiHe = function(uid){
  const it = findItemByUid(uid);
  if (!it || !hasElem(it) || !player.jewels || player.jewels.honDon < 1) return;
  player.jewels.honDon--;
  let el2 = it.element;
  while (el2 === it.element) el2 = ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
  it.element = el2;
  addFloat(player.x, player.y-52, `◑ ĐỔI HỆ — đòn đánh nay là ${elName(el2)}!`, elColor(el2), 14);
  calcDerived(); saveGame(); renderForge();
};
// Đổi 60 Mảnh Cổ Thần → 1 món Cổ Thần chọn bộ (pity Thủ Hộ — vá lỗi không pity)
window.doiCoThan = function(setId){
  if (!ANCIENT_SETS[setId] || player.mats.manhCoThan < 60) return;
  if (player.inv.length >= 30){ addFloat(player.x, player.y-40, 'Túi đồ đầy!', '#ff7a6a', 12); return; }
  player.mats.manhCoThan -= 60;
  const armorSlots = ['non','ao','tay','quan','chan'];
  const it = genAncient(setId, armorSlots[Math.floor(Math.random()*armorSlots.length)], player.level);
  player.inv.push(it);
  addFloat(player.x, player.y-52, `◈ CỔ THẦN ${ANCIENT_SETS[setId].name} hiện thế!`, ANCIENT_SETS[setId].color, 16);
  addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:ANCIENT_SETS[setId].color, big:true });
  AudioSys.sfx('quest', 0.9);
  saveGame(); renderForge();
};
// ═══════════════ LÒ HỖN ĐỘN — cỗ máy kết hợp ═══════════════
// Trước đây có HAI màn rèn chồng nhau (bảng Rèn Luyện + Lò Rèn Hoàng Gia của NPC), mỗi màn là
// một cuộn chữ dài xếp 7 khối khác nhau, và hai bên còn trùng nội dung (Hỗn Độn Lò, Cổ Thần).
// Nay gộp thành MỘT cỗ máy: bỏ trang bị + ngọc vào KHAY, máy liệt kê mọi công thức khay đó
// thoả, chọn một cái rồi bấm KẾT HỢP. Luật nằm hết trong CHAOS_RECIPES; renderForge() chỉ vẽ.
//
// Quy ước: thứ RỜI RẠC (trang bị, ngọc) phải bỏ vào khay mới tính; thứ SỐ LƯỢNG LỚN (bạc,
// Huyền Thiết, Tu La, Mảnh…) trừ thẳng từ kho và chỉ hiện trong bảng nguyên liệu.
let forgeTray = [];        // [{k:'item',uid} | {k:'jewel',j:'chucPhuc'|'linhHon'|'sinhMenh'|'honDon'}]
let chaosPick = null;      // id công thức đang chọn
let chaosGroup = 'ren';    // nhóm tab đang xem
const CHAOS_TRAY_MAX = 10;
const CHAOS_GROUPS = [
  { id:'ren', name:'Rèn Trang Bị' },
  { id:'ngoc', name:'Khảm Ngọc' },
  { id:'che', name:'Chế Tạo' },
];
const CHAOS_JEWELS = [
  { k:'chucPhuc', name:'Ngọc Chúc Phúc', glyph:'◎', color:'#7ec850' },
  { k:'linhHon',  name:'Ngọc Linh Hồn',  glyph:'◉', color:'#b08ae8' },
  { k:'sinhMenh', name:'Ngọc Sinh Mệnh', glyph:'❤', color:'#e84a6a' },
  { k:'honDon',   name:'Ngọc Hỗn Độn',   glyph:'●', color:'#7ecbff' },
];
// Vị trí một món đồ (đang mặc hay trong túi) — cần cho công thức làm VỠ hoặc TIÊU HỦY món đó.
function itemLoc(uid){
  for (const s in player.equip){ const it = player.equip[s]; if (it && it.uid === uid) return { it, where:'equip', key:s }; }
  const i = (player.inv || []).findIndex(x => x && x.uid === uid);
  if (i >= 0) return { it: player.inv[i], where:'inv', key:i };
  return null;
}
function destroyItem(uid){
  const loc = itemLoc(uid);
  if (!loc) return false;
  if (loc.where === 'equip') player.equip[loc.key] = null; else player.inv.splice(loc.key, 1);
  return true;
}
// Ảnh chụp khay: món đồ đã tra ngược ra vật thật, ngọc đếm theo loại.
function trayView(){
  const items = [], jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
  let nJewel = 0;
  forgeTray = forgeTray.filter(e => e.k !== 'item' || findItemByUid(e.uid)); // đồ đã bán/vỡ thì rơi khỏi khay
  for (const e of forgeTray){
    if (e.k === 'item'){ const it = findItemByUid(e.uid); if (it) items.push(it); }
    else if (e.k === 'jewel' && jewels[e.j] != null){ jewels[e.j]++; nJewel++; }
  }
  return { items, jewels, nJewel };
}
function chaosCost(label, have, need, glyph){ return { label, have, need, glyph, ok: have >= need }; }
function jewelCost(k, v, need){
  const d = CHAOS_JEWELS.find(x => x.k === k);
  return { label: d.name + ' (trong khay)', have: v.jewels[k], need, glyph: d.glyph, ok: v.jewels[k] >= need, jewel:k };
}
// Trừ ngọc: lấy đúng số viên ra khỏi khay VÀ khỏi kho.
function spendJewels(need){
  for (const k in need){
    for (let n = 0; n < need[k]; n++){
      const i = forgeTray.findIndex(e => e.k === 'jewel' && e.j === k);
      if (i >= 0) forgeTray.splice(i, 1);
      player.jewels[k] = Math.max(0, (player.jewels[k] || 0) - 1);
    }
  }
}
// Đang đứng tại Lò Rèn Hoàng Gia? Công thức royal:true đòi có mặt ở đó (giữ nguyên thiết kế cũ:
// +9 trở lên và Linh Dực chỉ luyện được tại chỗ Tông Sư Thợ Rèn).
function atRoyalForge(){
  const n = NPCS.find(x => x.talk === 'forge');
  if (!n || !player) return false;
  return curMap === n.map && dist(player.x, player.y, n.x, n.y) < 220;
}

const CHAOS_RECIPES = [
  // ── Nhóm RÈN ────────────────────────────────────────────────────────────
  { id:'ren', group:'ren', name:'Rèn Thường', tray:'1 trang bị (+0 → +9)',
    match(v){
      if (v.items.length !== 1 || v.nJewel) return null;
      const it = v.items[0];
      if (it.noForge || it.plus >= 9) return null;
      return { it, target: it.plus + 1 };
    },
    plan(v, m){
      const r = forgeRule(m.target);
      const silver = (20 + m.it.plus * 15) * (m.it.tier || 1);
      return {
        title: `${m.it.name} +${m.it.plus} → +${m.target}`,
        rate: Math.min(100, r.rate + (player.forgeBonus || 0)),
        cost: [ chaosCost('Bạc', player.silver, silver, '◈'),
                chaosCost('Huyền Thiết', player.mat, r.mat, '✦'),
                ...(r.tuLa ? [chaosCost('Tu La Tinh Thạch', player.gems.tuLa, r.tuLa, '◆')] : []) ],
        warn: r.fail === 'drop1' ? 'Thất bại: trang bị TỤT 1 CẤP.' : 'Thất bại: chỉ mất nguyên liệu, trang bị vẹn nguyên.',
        charm: r.fail !== 'none', silver, rule: r,
      };
    },
    run(v, m, p){
      player.silver -= p.silver; player.mat -= p.rule.mat;
      player.gems.tuLa -= p.rule.tuLa; player.gems.honNguyen -= p.rule.hon;
      return chaosResolveEnhance(m.it, p.rate, p.rule);
    } },

  { id:'phathien', group:'ren', name:'Phá Thiên Kiếp', royal:true, tray:'1 trang bị +9/+10 · ngọc',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (it.noForge || it.plus < 9 || it.plus >= 11) return null;
      const n = it.plus === 9 ? 2 : 3;
      return { it, target: it.plus + 1, need: { honDon:1, chucPhuc:n, linhHon:n } };
    },
    plan(v, m){
      const r = forgeRule(m.target);
      const silver = (20 + m.it.plus * 15) * (m.it.tier || 1);
      return {
        title: `${m.it.name} +${m.it.plus} → +${m.target}`,
        rate: Math.min(100, r.rate + (player.forgeBonus || 0)),
        cost: [ jewelCost('honDon', v, m.need.honDon),
                jewelCost('chucPhuc', v, m.need.chucPhuc),
                jewelCost('linhHon', v, m.need.linhHon),
                chaosCost('Bạc', player.silver, silver, '◈'),
                chaosCost('Huyền Thiết', player.mat, r.mat, '✦'),
                chaosCost('Tu La Tinh Thạch', player.gems.tuLa, r.tuLa, '◆'),
                chaosCost('Hỗn Nguyên', player.gems.honNguyen, r.hon, '❖') ],
        warn: 'THẤT BẠI: TRANG BỊ VỠ VỤN — mất vĩnh viễn (trừ khi dùng Thiên Mệnh Phù).',
        charm: true, silver, rule: r,
      };
    },
    run(v, m, p){
      spendJewels(m.need);
      player.silver -= p.silver; player.mat -= p.rule.mat;
      player.gems.tuLa -= p.rule.tuLa; player.gems.honNguyen -= p.rule.hon;
      return chaosResolveEnhance(m.it, p.rate, p.rule);
    } },

  // ── Nhóm NGỌC ───────────────────────────────────────────────────────────
  { id:'bless', group:'ngoc', name:'Ngọc Chúc Phúc', tray:'1 trang bị (+0 → +5) · ◎ 1',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (it.noForge || it.plus > 5) return null;
      return { it, need:{ chucPhuc:1 } };
    },
    plan(v, m){ return {
      title: `${m.it.name} +${m.it.plus} → +${m.it.plus + 1}`, rate: 100,
      cost: [ jewelCost('chucPhuc', v, 1) ],
      warn: 'An toàn tuyệt đối — không có thất bại.', charm:false }; },
    run(v, m){ spendJewels(m.need); m.it.plus++;
      chaosSay(`◎ Chúc Phúc — ${m.it.name} lên +${m.it.plus}!`, '#8fd18f');
      addFloat(player.x, player.y-40, `◎ +${m.it.plus} (Chúc Phúc)`, '#7ec850', 14);
      AudioSys.sfx('forge_ok', 0.9); chaosAwakenNote(m.it); return true; } },

  { id:'soul', group:'ngoc', name:'Ngọc Linh Hồn', tray:'1 trang bị (dưới +11) · ◉ 1',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (it.noForge || it.plus >= 11) return null;
      return { it, need:{ linhHon:1 } };
    },
    plan(v, m){ return {
      title: `${m.it.name} +${m.it.plus} → +${m.it.plus + 1}`, rate: 50,
      cost: [ jewelCost('linhHon', v, 1) ],
      warn: 'Thất bại: trang bị TỤT 1 CẤP.', charm:false }; },
    run(v, m){
      spendJewels(m.need);
      if (Math.random() < 0.5){
        m.it.plus++;
        chaosSay(`◉ Linh Hồn — ${m.it.name} lên +${m.it.plus}!`, '#8fd18f');
        addFloat(player.x, player.y-40, `◉ +${m.it.plus} (Linh Hồn)`, '#b08ae8', 14);
        AudioSys.sfx('forge_ok', 0.9); chaosAwakenNote(m.it);
      } else {
        m.it.plus = Math.max(0, m.it.plus - 1);
        chaosSay(`✘ Linh Hồn thất bại — tụt còn +${m.it.plus}`, '#ff7a6a');
        addFloat(player.x, player.y-40, `◉ Xịt — tụt còn +${m.it.plus}`, '#ff7a6a', 13);
        AudioSys.sfx('forge_fail', 0.85);
      }
      return true; } },

  { id:'life', group:'ngoc', name:'Ngọc Sinh Mệnh', tray:'1 giáp trụ · ❤ 1',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (it.noForge || !ARMOR_SLOTS.includes(it.slot) || (it.life || 0) >= 7) return null;
      return { it, need:{ sinhMenh:1 } };
    },
    plan(v, m){ return {
      title: `${m.it.name} — Sinh Mệnh bậc ${(m.it.life||0)} → ${(m.it.life||0)+1} (+${((m.it.life||0)+1)*4}% HP)`,
      rate: Math.max(25, 75 - (m.it.life || 0) * 8),
      cost: [ jewelCost('sinhMenh', v, 1) ],
      warn: 'Thất bại: dòng Sinh Mệnh VỀ 0 — mất hết bậc đã khảm.', charm:false }; },
    run(v, m, p){
      spendJewels(m.need);
      if (Math.random()*100 < p.rate){
        m.it.life = (m.it.life || 0) + 1;
        chaosSay(`❤ Sinh Mệnh bậc ${m.it.life} — +${m.it.life*4}% HP tối đa!`, '#8fd18f');
        addFloat(player.x, player.y-40, `❤ Sinh Mệnh +${m.it.life*4}% HP`, '#e84a6a', 14);
        AudioSys.sfx('forge_ok', 0.9);
      } else {
        m.it.life = 0;
        chaosSay('✘ Sinh Mệnh tan biến — dòng HP về 0!', '#ff7a6a');
        addFloat(player.x, player.y-40, '❤ Xịt — Sinh Mệnh về 0!', '#ff7a6a', 13);
        AudioSys.sfx('forge_fail', 0.85);
      }
      return true; } },

  { id:'element', group:'ngoc', name:'Đổi Hệ', tray:'1 vũ khí · ● 1',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (it.noForge || !hasElem(it)) return null;   // chỉ vũ khí mới có hệ dùng được
      return { it, need:{ honDon:1 } };
    },
    plan(v, m){ return {
      title: `${m.it.name} — đổi khỏi hệ ${elName(m.it.element)}`, rate: 100,
      cost: [ jewelCost('honDon', v, 1) ],
      warn: 'Hệ mới ngẫu nhiên, chắc chắn khác hệ hiện tại. Hệ vũ khí chỉ tác dụng lên quái: khắc hệ quái +20% sát thương, bị quái khắc −12%.', charm:false }; },
    run(v, m){
      spendJewels(m.need);
      let e2 = m.it.element;
      while (e2 === m.it.element) e2 = ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
      m.it.element = e2;
      chaosSay(`◑ Đổi Hệ — đòn đánh nay là ${elName(e2)}`, elColor(e2));
      addFloat(player.x, player.y-52, `◑ ĐỔI HỆ — ${elName(e2)}!`, elColor(e2), 14);
      return true; } },

  // ── Nhóm CHẾ TẠO ────────────────────────────────────────────────────────
  { id:'tanpham', group:'che', name:'Tấn Phẩm', tray:'1 trang bị (dưới Chí Tôn)',
    match(v){
      if (v.items.length !== 1 || v.nJewel) return null;
      const it = v.items[0];
      if (it.special || it.ancient || it.rarity >= 4 || !TANPHAM_RULES[it.rarity]) return null;
      return { it, r: TANPHAM_RULES[it.rarity] };
    },
    plan(v, m){ return {
      title: `${RARITIES[m.it.rarity].name} → ${RARITIES[m.it.rarity+1].name} (mở ${RARITY_SUBS[m.it.rarity+1]} dòng phụ)`,
      rate: m.r.rate,
      cost: [ chaosCost('Huyền Thiết', player.mat, m.r.tinh, '✦'),
              chaosCost('Mảnh Trang Bị', player.mats.manh, m.r.manh, '❖'),
              chaosCost('Tịch Ma Thạch', player.mats.tichMa, m.r.tichMa, '◆'),
              chaosCost('Ấn Cổng Vực', player.mats.anTranAi, m.r.an, '☬'),
              chaosCost('Bạc', player.silver, m.r.silver, '◈') ].filter(c => c.need > 0),
      warn: m.r.rate < 100 ? 'Thất bại: giữ nguyên trang bị, chỉ mất nửa nguyên liệu.' : 'An toàn tuyệt đối.',
      charm:false }; },
    run(v, m){
      const r = m.r;
      if (Math.random()*100 < r.rate){
        player.mat -= r.tinh; player.mats.manh -= r.manh; player.mats.tichMa -= r.tichMa;
        player.mats.anTranAi -= r.an; player.silver -= r.silver;
        m.it.rarity++; rerollItemRarity(m.it);
        chaosSay(`✦ Tấn Phẩm — ${RARITIES[m.it.rarity].name}!`, RARITIES[m.it.rarity].color);
        addFloat(player.x, player.y-52, `✦ TẤN PHẨM — ${RARITIES[m.it.rarity].name}!`, RARITIES[m.it.rarity].color, 16);
        addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:RARITIES[m.it.rarity].color, big:true });
        AudioSys.sfx('levelup', 0.8);
      } else {
        player.mat -= Math.floor(r.tinh/2); player.mats.manh -= Math.floor(r.manh/2);
        player.mats.tichMa -= Math.floor(r.tichMa/2); player.silver -= Math.floor(r.silver/2);
        chaosSay('✘ Tấn phẩm thất bại — trang bị vẹn nguyên, mất nửa nguyên liệu', '#ff7a6a');
        AudioSys.sfx('hurt', 0.5);
      }
      return true; } },

  { id:'kethua', group:'che', name:'Kế Thừa', tray:'1 trang bị (dưới giai X)',
    match(v){
      if (v.items.length !== 1 || v.nJewel) return null;
      const it = v.items[0];
      if (it.special || it.tier >= 10) return null;
      return { it, cost:{ manh:40, tichMa:4, silver:5000*it.tier } };
    },
    plan(v, m){ return {
      title: `【${giaiName(m.it.tier)}】→【${giaiName(m.it.tier+1)}】giữ Phẩm / +${m.it.plus} / dòng phụ`,
      rate: 100,
      cost: [ chaosCost('Mảnh Trang Bị', player.mats.manh, m.cost.manh, '❖'),
              chaosCost('Tịch Ma Thạch', player.mats.tichMa, m.cost.tichMa, '◆'),
              chaosCost('Bạc', player.silver, m.cost.silver, '◈') ],
      warn: 'Chỉ số gốc của giai mới bằng 90% bản gốc — bù lại giữ trọn mọi dòng đã có.', charm:false }; },
    run(v, m){
      player.mats.manh -= m.cost.manh; player.mats.tichMa -= m.cost.tichMa; player.silver -= m.cost.silver;
      m.it.tier++; m.it.level = (m.it.tier-1)*10 + 10;
      const sl = SLOTS.find(s => s.id === m.it.slot);
      if (sl && m.it.main) m.it.main.v = Math.max(1, Math.round(sl.base(m.it.tier, m.it.rarity) * 0.9));
      chaosSay(`⚒ Kế Thừa — lên giai【${giaiName(m.it.tier)}】!`, '#9fd0ff');
      addFloat(player.x, player.y-52, `⚒ KẾ THỪA —【${giaiName(m.it.tier)}】!`, '#9fd0ff', 15);
      addEffect({ type:'ring', x:player.x, y:player.y, r:80, color:'#9fd0ff', big:true });
      AudioSys.sfx('levelup', 0.7);
      return true; } },

  { id:'cloak', group:'che', name:'Luyện Áo Choàng', tray:'khay trống',
    match(v){
      if (v.items.length || v.nJewel) return null;
      const c = player.equip.aochoang || player.inv.find(x => x.slot === 'aochoang');
      const t = !c ? 1 : (c.cloakTier === 1 ? 2 : 0);
      if (!t) return null;
      return { t, def: CLOAK_TIERS[t] };
    },
    plan(v, m){ const c = m.def; return {
      title: `${c.name} (Cấp ${m.t})${player.level < c.req ? ` — cần LV${c.req}` : ''}`,
      rate: 100,
      cost: [ chaosCost('Tu La Tinh Thạch', player.gems.tuLa, c.cost.tuLa, '◆'),
              chaosCost('Hỗn Nguyên', player.gems.honNguyen, c.cost.hon, '❖'),
              chaosCost('Bạc', player.silver, c.cost.silver, '◈'),
              chaosCost('Cấp nhân vật', player.level, c.req, '★') ],
      warn: `Thêm Sát Thương +${c.atkPct}% · Xuyên Giáp +${c.pierce}%${c.defPct?` · Phòng Ngự +${c.defPct}%`:''}`,
      charm:false }; },
    run(v, m){ craftCloak(m.t); return true; } },

  { id:'wing1', group:'che', name:'Luyện Linh Dực', royal:true, tray:'1 trang bị Hoàn Hảo +4 (hiến tế) · ● 1',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (!it.perfect || it.plus < 4 || it.noForge) return null;
      return { it, need:{ honDon:1 } };
    },
    plan(v, m){ return {
      title: `Linh Dực Cấp 1 — Thiên Thần / Tiểu Quỷ ngẫu nhiên`,
      rate: 100,
      cost: [ jewelCost('honDon', v, 1),
              chaosCost('Hỗn Nguyên', player.gems.honNguyen, 10, '❖'),
              chaosCost('Bạc', player.silver, 5000, '◈'),
              chaosCost('Cấp nhân vật', player.level, 40, '★') ],
      warn: `${m.it.name} +${m.it.plus} sẽ bị TIÊU HỦY làm vật hiến tế.`, charm:false }; },
    run(v, m){
      spendJewels(m.need);
      destroyItem(m.it.uid);
      player.gems.honNguyen -= 10; player.silver -= 5000;
      const wi = Math.floor(Math.random()*2), w = genWing(wi);
      if (player.inv.length < 30) player.inv.push(w); else player.silver += 2000;
      zoneBanner = { text:'◈ LINH DỰC XUẤT THẾ', sub:`Lò Hỗn Độn luyện thành ${WING_DEFS[wi].name}!`, color:WING_DEFS[wi].color, t:4.5 };
      chaosSay(`✔ Luyện thành ${WING_DEFS[wi].name}!`, '#8fd18f');
      addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:WING_DEFS[wi].color, big:true });
      AudioSys.sfx('forge_ok', 0.95);
      return true; } },

  { id:'wing2', group:'che', name:'Thăng Linh Dực 2', royal:true, tray:'1 Linh Dực cấp 1 · ● 1',
    match(v){
      if (v.items.length !== 1) return null;
      const it = v.items[0];
      if (it.slot !== 'canh' || it.wing2) return null;
      return { it, need:{ honDon:1 } };
    },
    plan(v, _m){ return {
      title: 'Linh Dực Cấp 2 — Phượng Dực / Hắc Ma Dực',
      rate: 100,
      cost: [ jewelCost('honDon', v, 1),
              chaosCost('Hỗn Nguyên', player.gems.honNguyen, 20, '❖'),
              chaosCost('Bạc', player.silver, 10000, '◈'),
              chaosCost('Cấp nhân vật', player.level, 80, '★') ],
      warn: 'Cánh cấp 1 được thăng tại chỗ — không mất gì thêm.', charm:false }; },
    run(v, m){
      spendJewels(m.need);
      player.gems.honNguyen -= 20; player.silver -= 10000;
      const j = Math.floor(Math.random()*2);
      const w2 = specialItem('canh', WING2_DEFS[j], { wing2: WING2_DEFS[j].id });
      const loc = itemLoc(m.it.uid);
      if (loc){ if (loc.where === 'equip') player.equip[loc.key] = w2; else player.inv[loc.key] = w2; }
      else player.inv.push(w2);
      zoneBanner = { text:'◈ LINH DỰC THĂNG HOA', sub:`${WING2_DEFS[j].name} — sức mạnh vượt trần!`, color:WING2_DEFS[j].color, t:5 };
      chaosSay(`✔ Thăng thành ${WING2_DEFS[j].name}!`, '#8fd18f');
      addEffect({ type:'ring', x:player.x, y:player.y, r:130, color:WING2_DEFS[j].color, big:true });
      AudioSys.sfx('forge_ok', 0.95);
      return true; } },

  // Lò Hỗn Loạn — 3 món CÙNG PHẨM đổi lấy 1 món phẩm cao hơn, thất bại là mất sạch. Đây vốn đã
  // là Chaos Machine đúng nghĩa, chỉ bị chôn trong danh sách chữ của màn NPC.
  { id:'hopnhat', group:'che', name:'Lò Hỗn Loạn', tray:'3 trang bị CÙNG PHẨM (dưới Chí Tôn)',
    match(v){
      if (v.items.length !== 3 || v.nJewel) return null;
      const r = v.items[0].rarity;
      if (r == null || r >= 4) return null;
      if (!v.items.every(x => x.rarity === r && !x.noForge && !x.special)) return null;
      if (!v.items.every(x => itemLoc(x.uid) && itemLoc(x.uid).where === 'inv')) return null;
      return { r, items: v.items };
    },
    plan(v, m){
      const useCharm = forgeUseCharm && player.charms > 0;
      return {
        title: `3 món ${RARITIES[m.r].name} → 1 món ${RARITIES[m.r+1].name}`,
        rate: useCharm ? 100 : Math.min(100, CHAOS_RATE[m.r] + (player.forgeBonus || 0)),
        cost: [ chaosCost('Hỗn Nguyên', player.gems.honNguyen, CHAOS_HON_COST[m.r], '❖'),
                chaosCost('Bạc', player.silver, CHAOS_SILVER_COST[m.r], '◈') ],
        warn: 'CẢ 3 MÓN TAN BIẾN ngay khi ném vào lò — thành hay bại cũng không lấy lại được.',
        charm: true,
      };
    },
    run(v, m, p){
      const honCost = CHAOS_HON_COST[m.r], silverCost = CHAOS_SILVER_COST[m.r];
      const useCharm = forgeUseCharm && player.charms > 0;
      const success = Math.random()*100 < p.rate;
      player.gems.honNguyen -= honCost; player.silver -= silverCost;
      if (useCharm) player.charms--;
      const snapshot = m.items.slice();
      for (const it of snapshot) destroyItem(it.uid);
      forgeTray = [];
      sideOnEvent('chaos'); // NV học hệ thống chỉ cần đã DÙNG lò, không cần thành công
      let newItem = null;
      if (success){
        const avgLevel = Math.max(1, Math.round(snapshot.reduce((a,x) => a + x.level, 0) / 3));
        newItem = genItem(avgLevel, 0, 'mob');
        newItem.rarity = m.r + 1; rerollItemRarity(newItem);
      }
      playChaosAnim(snapshot, m.r, success, () => {
        if (success){
          if (player.inv.length < 30){ player.inv.push(newItem); tryAutoEquip(newItem); }
          zoneBanner = { text:'◑ LÒ HỖN LOẠN — THÀNH CÔNG!', sub:`3 món hoá thành ${newItem.name}!`, color:RARITIES[newItem.rarity].color, t:5 };
          addFloat(player.x, player.y-56, `◑ ${newItem.name}`, RARITIES[newItem.rarity].color, 16);
        } else {
          zoneBanner = { text:'◑ LÒ HỖN LOẠN — THẤT BẠI', sub:'3 món đã tan thành tro bụi — Hỗn Loạn vô thường.', color:'#ff5a4a', t:5 };
          addFloat(player.x, player.y-56, 'Thất bại — mất sạch!', '#ff5a4a', 16);
        }
        calcDerived(); saveGame(); refreshEqPanels(); renderForge();
        return { newItem };   // playChaosAnim đọc để hiện tên món mới; thiếu là báo THẤT BẠI dù thành
      });
      chaosSay(success ? '◑ Lò nhả ra thứ tốt hơn!' : '◑ Lò nuốt sạch — chẳng nhả gì cả.', success ? '#8fd18f' : '#ff5a4a');
      return true;
    } },

  { id:'doicothan', group:'che', name:'Đổi Cổ Thần', tray:'3 món Cổ Thần trong túi · ● 1',
    match(v){
      if (v.items.length !== 3) return null;
      if (!v.items.every(x => x.ancient && itemLoc(x.uid) && itemLoc(x.uid).where === 'inv')) return null;
      return { items: v.items, need:{ honDon:1 }, set: chaosCoThanSet, slot: chaosCoThanSlot };
    },
    plan(v, m){ return {
      title: `3 món Cổ Thần → 1 ${(SLOTS.find(x => x.id === m.slot)||{}).name || m.slot} bộ ${ANCIENT_SETS[m.set].name}`,
      rate: 100,
      cost: [ jewelCost('honDon', v, 1) ],
      warn: '3 món hiến tế mất vĩnh viễn, đổi lại món mới do NGƯƠI chọn cả bộ lẫn ô.',
      charm:false, pickSet:true, pickSlot:true }; },
    run(v, m){
      if (player.inv.length >= 30){ chaosSay('✘ Túi đồ đầy!', '#ff7a6a'); return false; }
      spendJewels(m.need);
      for (const it of m.items) destroyItem(it.uid);
      forgeTray = [];
      const it = genAncient(m.set, m.slot, player.level);
      player.inv.push(it);
      zoneBanner = { text:'◈ CỔ THẦN TỰ CHỌN', sub:`Lò Hỗn Độn đúc thành ${it.name}!`, color:ANCIENT_SETS[m.set].color, t:4.5 };
      chaosSay(`✔ Đúc thành ${it.name}`, ANCIENT_SETS[m.set].color);
      addFloat(player.x, player.y-56, `◈ ${it.name}`, ANCIENT_SETS[m.set].color, 16);
      AudioSys.sfx('forge_ok', 0.95);
      return true; } },

  { id:'cothan', group:'che', name:'Triệu Cổ Thần', tray:'khay trống',
    match(v){
      if (v.items.length || v.nJewel) return null;
      return { set: chaosCoThanSet };
    },
    plan(v, m){ return {
      title: `Đổi 60 Mảnh Cổ Thần → 1 món bộ ${ANCIENT_SETS[m.set].name}`,
      rate: 100,
      cost: [ chaosCost('Mảnh Cổ Thần', (player.mats && player.mats.manhCoThan) || 0, 60, '◈') ],
      warn: 'Ô giáp trong bộ là ngẫu nhiên, nhưng BỘ thì do ngươi chọn.',
      charm:false, pickSet:true }; },
    run(v, m){
      if (player.inv.length >= 30){ chaosSay('✘ Túi đồ đầy!', '#ff7a6a'); return false; }
      doiCoThan(m.set); return true; } },
];
let chaosCoThanSet = Object.keys(ANCIENT_SETS)[0];
let chaosCoThanSlot = 'non';
window.chaosSetSlot = function(sl){ if (ARMOR_SLOTS.includes(sl)){ chaosCoThanSlot = sl; renderForge(); } };
window.chaosSetCoThan = function(id){ if (ANCIENT_SETS[id]){ chaosCoThanSet = id; renderForge(); } };

function chaosSay(t, c){
  const m = document.getElementById('chaos-msg');
  if (m){ m.textContent = t; m.style.color = c || '#e4ebff'; }
}
function chaosAwakenNote(it){
  if (it.plus === 10) addFloat(player.x, player.y-58, `☆ Thức tỉnh: ${it.awakened.name}`, '#f39c3d', 13);
  if (it.plus === 11){
    player.forged11 = true;
    addFloat(player.x, player.y-76, '☀ KHAI QUANG +11!', '#ffd76a', 16);
    addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:'#ffd76a', big:true });
    checkTitles();
  }
}
// Phần chung của mọi kiểu rèn tăng +N: tung xúc xắc rồi xử lý 4 kiểu thất bại của forgeRule().
function chaosResolveEnhance(it, rate, rule){
  const useCharm = forgeUseCharm && player.charms > 0 && rule.fail !== 'none';
  if (Math.random()*100 < rate){
    it.plus++;
    AudioSys.sfx('forge_ok', 0.85);
    chaosSay(`✔ Thành công! ${it.name} +${it.plus}`, '#8fd18f');
    addFloat(player.x, player.y-40, `Rèn thành công +${it.plus}!`, '#8fd18f', 14);
    addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#8fd18f' });
    const q = currentQuest();
    if (q && q.type === 'enhance' && questState === 'active' && it.plus >= q.need){
      questProg = q.need; questState = 'done';
      addFloat(player.x, player.y-60, `Nhiệm vụ hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13);
    }
    chaosAwakenNote(it);
    dailyTrack('forge');
    checkTitles();
    return true;
  }
  if (useCharm){
    player.charms--;
    chaosSay(`☂ Thiên Mệnh Phù bảo hộ — giữ nguyên +${it.plus}`, '#7ecbff');
    addFloat(player.x, player.y-40, 'Thiên Mệnh Phù bảo hộ!', '#7ecbff', 13);
    return true;
  }
  AudioSys.sfx('forge_fail', 0.8);
  if (rule.fail === 'drop1'){
    it.plus = Math.max(6, it.plus - 1);
    chaosSay(`✘ Thất bại — tụt xuống +${it.plus}`, '#ff7a6a');
    addFloat(player.x, player.y-40, `Rèn xịt! Tụt còn +${it.plus}`, '#ff7a6a', 13);
  } else if (rule.fail === 'zero'){
    it.plus = 0;
    chaosSay('✘ Thất bại thảm khốc — trang bị về +0!', '#ff7a6a');
  } else if (rule.fail === 'break'){
    destroyItem(it.uid);
    forgeTray = forgeTray.filter(e => !(e.k === 'item' && e.uid === it.uid));
    chaosSay(`✘ ${it.name} đã VỠ VỤN!`, '#ff3a3a');
    addFloat(player.x, player.y-40, `${it.name} đã VỠ VỤN!`, '#ff3a3a', 16);
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:'#ff3a3a', big:true });
  } else {
    chaosSay('✘ Thất bại... nguyên liệu đã mất', '#ff7a6a');
    addFloat(player.x, player.y-40, 'Rèn thất bại!', '#ff7a6a', 13);
  }
  return true;
}
// Mọi công thức khay hiện tại thoả — kèm plan() đã tính sẵn để vẽ và để bấm.
function chaosMatches(){
  const v = trayView();
  const out = [];
  for (const rec of CHAOS_RECIPES){
    let m = null;
    try { m = rec.match(v); } catch { m = null; }
    if (!m) continue;
    let p = null;
    try { p = rec.plan(v, m); } catch { continue; }
    p.ready = p.cost.every(c => c.ok) && (!rec.royal || atRoyalForge());
    out.push({ rec, m, p, v });
  }
  return out;
}
// Khay khớp công thức ở nhóm KHÁC thì nhảy sang nhóm đó. Không có bước này, bỏ trang bị + viên
// Chúc Phúc vào khay lúc đang xem tab Rèn sẽ khiến máy IM LẶNG HOÀN TOÀN — không công thức,
// không nút bấm — dù khay hoàn toàn hợp lệ.
function chaosSyncGroup(){
  const ms = chaosMatches();
  if (!ms.length) return;
  // Đã tự tay chọn một công thức → nhóm phải chạy theo nó. Thiếu bước này thì bảng DANH SÁCH
  // và bảng CHI TIẾT chỉ vào hai công thức khác nhau — đúng kiểu rối mà cỗ máy sinh ra để dẹp.
  const picked = ms.find(x => x.rec.id === chaosPick);
  if (picked){ chaosGroup = picked.rec.group; return; }
  // Khay trống thì chẳng có gì để đoán — giữ nguyên tab người chơi đang xem, đừng tự nhảy đi
  // (mở lò ra mà rơi thẳng vào Chế Tạo chỉ vì "khay trống khớp công thức luyện áo choàng").
  if (!forgeTray.length) return;
  if (ms.some(x => x.rec.group === chaosGroup)) return;
  chaosGroup = (ms.find(x => x.p.ready) || ms[0]).rec.group;
}
function chaosCurrent(){
  const ms = chaosMatches();
  if (!ms.length) return null;
  // Ưu tiên công thức người chơi đã chọn; nếu không còn thoả thì lấy cái đủ nguyên liệu trước,
  // rồi mới tới cái đầu danh sách — để khay vừa đủ ngọc là máy tự chỉ đúng việc cần làm.
  return ms.find(x => x.rec.id === chaosPick)
      || ms.find(x => x.rec.group === chaosGroup && x.p.ready)
      || ms.find(x => x.rec.group === chaosGroup)
      || null;
}
window.chaosPickRecipe = function(id){ chaosPick = id; renderForge(); };
window.chaosSetGroup = function(g){ chaosGroup = g; chaosPick = null; renderForge(); };
window.chaosAddItem = function(uid){
  if (forgeTray.some(e => e.k === 'item' && e.uid === uid)){ chaosTrayRemoveItem(uid); return; }
  if (forgeTray.length >= CHAOS_TRAY_MAX) return;
  forgeTray.push({ k:'item', uid }); chaosPick = null; renderForge();
};
function chaosTrayRemoveItem(uid){
  forgeTray = forgeTray.filter(e => !(e.k === 'item' && e.uid === uid));
  chaosPick = null; renderForge();
}
window.chaosAddJewel = function(j){
  const v = trayView();
  if (!player.jewels || (player.jewels[j] || 0) <= v.jewels[j]) return; // đã bỏ hết số đang có vào khay
  if (forgeTray.length >= CHAOS_TRAY_MAX) return;
  forgeTray.push({ k:'jewel', j }); chaosPick = null; renderForge();
};
window.chaosTrayPop = function(i){ forgeTray.splice(i, 1); chaosPick = null; renderForge(); };
window.chaosClear = function(){ forgeTray = []; chaosPick = null; renderForge(); };
window.doChaos = function(){
  const cur = chaosCurrent();
  if (!cur || !cur.p.ready) return;
  let ok = false;
  try { ok = cur.rec.run(cur.v, cur.m, cur.p); }
  catch (e){ console.error('Lò Hỗn Độn ' + cur.rec.id, e); chaosSay('✘ Kết hợp lỗi — xem console', '#ff7a6a'); }
  if (ok){ calcDerived(); saveGame(); }
  setTimeout(renderForge, 700);
};
function chaosRateColor(r){ return r >= 100 ? '#8fd18f' : r >= 50 ? '#7ecbff' : r >= 40 ? '#e8b04a' : '#ff7a6a'; }
function renderForge(){
  if (player.level < 4){
    CE().innerHTML = `<h3>Lò Hỗn Độn</h3>
      <div style="padding:14px;font-size:13px">Lò mở khóa ở <b style="color:#7ecbff">cấp 4</b>.<br>Hãy tiếp tục làm nhiệm vụ!</div>`;
    return;
  }
  chaosSyncGroup();
  const v = trayView();
  const cur = chaosCurrent();
  const ms = chaosMatches();
  const J = player.jewels || { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
  let h = `<h3>⚙ Lò Hỗn Độn</h3>`;

  // ── kho: tiền + nguyên liệu số lượng lớn ──
  h += `<div class="chaos-bank">
    <span title="Bạc">◈ ${player.silver.toLocaleString('vi-VN')}</span>
    <span title="Huyền Thiết" style="color:#9fd0ff">✦ ${player.mat}</span>
    <span title="Tu La Tinh Thạch" style="color:#e84a6a">◆ ${player.gems.tuLa}</span>
    <span title="Hỗn Nguyên" style="color:#b08ae8">❖ ${player.gems.honNguyen}</span>
    <span title="Mảnh Cổ Thần" style="color:#7ecbff">◈ ${(player.mats && player.mats.manhCoThan) || 0}</span>
    <span title="Thiên Mệnh Phù" style="color:#7ecbff">☂ ${player.charms}
      <button class="mini-btn" style="padding:1px 6px;font-size:10px" onclick="buyCharm()" ${player.silver<500?'disabled':''}>Mua 500◈</button></span>
    ${player.forgeBonus?`<span style="color:#5aa0e8">Thợ Rèn Truyền Thuyết +${player.forgeBonus}%</span>`:''}
  </div>`;

  // ── tab nhóm ──
  h += `<div class="chaos-tabs">`;
  for (const g of CHAOS_GROUPS){
    const n = ms.filter(x => x.rec.group === g.id).length;
    h += `<button class="chaos-tab${chaosGroup===g.id?' on':''}" onclick="chaosSetGroup('${g.id}')">${g.name}${n?` <i>${n}</i>`:''}</button>`;
  }
  h += `</div>`;

  // ── KHAY ──
  h += `<div class="chaos-sec">KHAY HỖN ĐỘN <span class="chaos-sub">bấm món trong túi để bỏ vào · bấm ô khay để lấy ra</span></div>`;
  h += `<div class="chaos-tray">`;
  for (let i = 0; i < CHAOS_TRAY_MAX; i++){
    const e = forgeTray[i];
    if (!e){ h += `<div class="chaos-cell"></div>`; continue; }
    if (e.k === 'item'){
      const it = findItemByUid(e.uid);
      if (!it){ h += `<div class="chaos-cell"></div>`; continue; }
      h += `<div class="chaos-cell full" title="${it.name} +${it.plus||0}" onclick="chaosTrayPop(${i})">
        ${slotIcon(it, 'chaos-ic')}${it.plus?`<b class="chaos-plus">+${it.plus}</b>`:''}</div>`;
    } else {
      const d = CHAOS_JEWELS.find(x => x.k === e.j) || CHAOS_JEWELS[0];
      h += `<div class="chaos-cell full jw" title="${d.name}" onclick="chaosTrayPop(${i})">
        <span class="chaos-gem" style="color:${d.color}">${d.glyph}</span></div>`;
    }
  }
  h += `</div>`;
  h += `<div class="chaos-tray-bar">
    <button class="mini-btn" onclick="chaosClear()" ${forgeTray.length?'':'disabled'}>Lấy hết ra</button>
    <span style="opacity:.6;font-size:11px">${forgeTray.length}/${CHAOS_TRAY_MAX} ô</span></div>`;

  // ── giá ngọc: bấm để bỏ viên vào khay ──
  h += `<div class="chaos-jewels">`;
  for (const d of CHAOS_JEWELS){
    const con = (J[d.k] || 0) - v.jewels[d.k];
    h += `<button class="chaos-jw" style="--jc:${d.color}" onclick="chaosAddJewel('${d.k}')" ${con>0?'':'disabled'} title="${d.name} — còn ${con} viên ngoài khay">
      <span class="chaos-gem" style="color:${d.color}">${d.glyph}</span><b>${con}</b></button>`;
  }
  h += `</div>`;

  // ── CÔNG THỨC ──
  const inGroup = ms.filter(x => x.rec.group === chaosGroup);
  h += `<div class="chaos-sec">CÔNG THỨC</div>`;
  if (!inGroup.length){
    const gname = (CHAOS_GROUPS.find(g => g.id === chaosGroup) || {}).name || '';
    h += `<div class="chaos-empty">Khay hiện tại không khớp công thức <b>${gname}</b> nào.<br>
      <span style="opacity:.7;font-size:11px">Gợi ý: ${CHAOS_RECIPES.filter(r => r.group === chaosGroup).map(r => `<b>${r.name}</b> — ${r.tray}`).join(' · ')}</span></div>`;
  } else {
    h += `<div class="chaos-reclist">`;
    for (const x of inGroup){
      const on = cur && cur.rec.id === x.rec.id;
      h += `<button class="chaos-rec${on?' on':''}${x.p.ready?'':' dim'}" onclick="chaosPickRecipe('${x.rec.id}')">
        <span>${x.rec.name}</span><em style="color:${chaosRateColor(x.p.rate)}">${x.p.rate}%</em></button>`;
    }
    h += `</div>`;
  }

  // ── CHI TIẾT công thức đang chọn ──
  if (cur){
    const p = cur.p;
    h += `<div class="chaos-detail">
      <div class="chaos-title">${p.title}</div>
      <div class="chaos-rate" style="color:${chaosRateColor(p.rate)}">Tỉ lệ thành công: <b>${p.rate}%</b></div>`;
    if (cur.rec.royal && !atRoyalForge()){
      h += `<div class="chaos-warn royal">☰ Công thức này chỉ chạy được tại <b>Lò Rèn Hoàng Gia</b> — hãy đến chỗ Tông Sư Thợ Rèn.
        <button class="mini-btn" onclick="closePanels(); window.hintGoForge()">Dẫn đường</button></div>`;
    }
    h += `<div class="chaos-costs">`;
    for (const c of p.cost){
      h += `<div class="chaos-cost${c.ok?'':' bad'}"><span>${c.glyph} ${c.label}</span>
        <b>${c.ok?'✓':'✗'} ${typeof c.have === 'number' ? c.have.toLocaleString('vi-VN') : c.have}/${c.need.toLocaleString('vi-VN')}</b></div>`;
    }
    h += `</div>`;
    if (p.pickSet){
      h += `<div class="chaos-setpick">`;
      for (const sid in ANCIENT_SETS){
        const st = ANCIENT_SETS[sid];
        h += `<button class="chaos-setbtn${chaosCoThanSet===sid?' on':''}" style="--sc:${st.color}" onclick="chaosSetCoThan('${sid}')">${st.name}</button>`;
      }
      h += `</div>`;
    }
    if (p.pickSlot){
      h += `<div class="chaos-setpick">`;
      for (const sl of ARMOR_SLOTS){
        const sd = SLOTS.find(x => x.id === sl);
        h += `<button class="chaos-setbtn${chaosCoThanSlot===sl?' on':''}" style="--sc:#9fd0ff" onclick="chaosSetSlot('${sl}')">${sd ? sd.name : sl}</button>`;
      }
      h += `</div>`;
    }
    if (p.warn) h += `<div class="chaos-warn${/VỠ VỤN|TIÊU HỦY|VỀ 0/.test(p.warn)?' danger':''}">⚠ ${p.warn}</div>`;
    if (p.charm){
      h += `<label class="chaos-charm">
        <input type="checkbox" ${forgeUseCharm?'checked':''} onchange="forgeUseCharm=this.checked" ${player.charms>0?'':'disabled'}>
        Dùng ☂ Thiên Mệnh Phù — thất bại vẫn giữ nguyên (còn ${player.charms})</label>`;
    }
    h += `<button class="chaos-go" onclick="doChaos()" ${p.ready?'':'disabled'}>⟳ KẾT HỢP</button>
      <div id="chaos-msg" class="chaos-msg"></div></div>`;
  }

  // ── TÚI ĐỒ: bấm icon để bỏ vào khay ──
  const bag = [];
  for (const s in player.equip){ const it = player.equip[s]; if (it) bag.push({ it, w:'mặc' }); }
  (player.inv || []).forEach(it => bag.push({ it, w:'túi' }));
  h += `<div class="chaos-sec">TRANG BỊ <span class="chaos-sub">bấm để bỏ vào khay</span></div>`;
  h += `<div class="chaos-bag">`;
  for (const b of bag){
    const on = forgeTray.some(e => e.k === 'item' && e.uid === b.it.uid);
    h += `<div class="chaos-cell bag${on?' on':''}" title="${b.it.name}${b.it.plus?' +'+b.it.plus:''} (${b.w})" onclick="chaosAddItem(${b.it.uid})">
      ${slotIcon(b.it, 'chaos-ic')}${b.it.plus?`<b class="chaos-plus">+${b.it.plus}</b>`:''}</div>`;
  }
  if (!bag.length) h += `<div class="chaos-empty">Chưa có trang bị nào.</div>`;
  h += `</div>`;
  CE().innerHTML = h;
}
window.craftCloak = function(t){
  const c = CLOAK_TIERS[t];
  if (!c) return;
  if (player.level < c.req) return;
  if (player.gems.tuLa < c.cost.tuLa || player.gems.honNguyen < c.cost.hon || player.silver < c.cost.silver) return;
  // t===2 replaces the equipped/inv aochoang in place (net-zero) unless neither exists — only
  // that fallback path actually grows the inventory, same as the t!==2 path below.
  const willAddSlot = t === 2 ? (!player.equip.aochoang && player.inv.findIndex(x => x.slot === 'aochoang') < 0) : true;
  if (willAddSlot && player.inv.length >= 30){ addFloat(player.x, player.y-40, 'Túi đồ đầy!', '#ff7a6a', 12); return; }
  player.gems.tuLa -= c.cost.tuLa; player.gems.honNguyen -= c.cost.hon; player.silver -= c.cost.silver;
  const it = genCloak(t);
  if (t === 2){
    if (player.equip.aochoang) player.equip.aochoang = it;
    else { const i = player.inv.findIndex(x => x.slot === 'aochoang'); if (i >= 0) player.inv[i] = it; else player.inv.push(it); }
  } else player.inv.push(it);
  addFloat(player.x, player.y-46, `Luyện thành: ${c.name}!`, c.color, 16);
  addEffect({ type:'ring', x:player.x, y:player.y, r:100, color:c.color, big:true });
  calcDerived(); saveGame();
  setTimeout(renderForge, 800);
};
window.buyCharm = function(){
  if (player.silver < 500) return;
  player.silver -= 500; player.charms++;
  addFloat(player.x, player.y-34, '+1 ☂ Thiên Mệnh Phù', '#7ecbff', 12);
  saveGame(); renderForge();
};
// ---------- Tấn Chức: Ám Khí / Cung Tiễn / Cương Khí (7 tầng, Chúc Phúc bảo đảm) ----------
const TH_SYSTEMS = {
  amkhi:   { name:'Ám Khí',   glyph:'☾', tiers:AMKHI_TIERS,   minLv:4,
             desc:'Tăng cường chiêu Ám Khí (phím 2) — mỗi tầng thêm bạo kích và hiệu ứng: độc, làm chậm, mù lòa, vạn độc, kết liễu.' },
  bow:     { name:'Cung Tiễn', glyph:'↗', tiers:BOW_TIERS,    minLv:30,
             desc:'Linh cung lơ lửng sau lưng — đòn đánh thường (Space) có tỉ lệ bắn thêm linh tiễn xuyên giáp.' },
  gangkhi: { name:'Cương Khí', glyph:'✦', tiers:GANGKHI_TIERS, minLv:10,
             desc:'Chân khí hộ thể vận chuyển quanh người — tăng Sinh Lực và Phòng Ngự theo %.' },
};
const TH_RATES = [0, 95, 85, 75, 62, 50, 38, 26]; // tỉ lệ thành công theo tầng đích (cân bằng lại: tầng đầu dễ, tầng cuối khốc liệt)
// Phí tấn chức theo tầng đích (cân bằng v2.0 — gắn vòng farm boss: tầng 4+ cần Mảnh Trang Bị, tầng 6+ cần Tịch Ma Thạch)
const TH_COST = [ null,
  { dan:2,  silver:400,  manh:0,  tichMa:0 },
  { dan:4,  silver:900,  manh:0,  tichMa:0 },
  { dan:7,  silver:1600, manh:0,  tichMa:0 },
  { dan:10, silver:2600, manh:12, tichMa:0 },
  { dan:14, silver:4000, manh:24, tichMa:0 },
  { dan:18, silver:5800, manh:40, tichMa:2 },
  { dan:24, silver:8000, manh:60, tichMa:4 },
];
function thIcon(sys, tier){ return `assets/skills/th_${sys}_${tier}.png`; }
// Hiệu ứng ăn mừng tấn chức — sprite bật to giữa màn hình
function showThCelebrate(sys, tier, t){
  const el = document.getElementById('th-celebrate');
  if (!el) return;
  const S = TH_SYSTEMS[sys];
  el.innerHTML = `<img src="${thIcon(sys, tier)}"><div class="thc-name" style="color:${t.color}">${t.name}</div><div class="thc-sub">${S.name} · Tầng ${tier}/7</div>`;
  el.classList.remove('hidden');
  el.classList.remove('thc-anim'); void el.offsetWidth; el.classList.add('thc-anim');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hidden'), 1800);
  AudioSys.sfx('quest', 0.8);
}
function thState(sys){ return sys==='amkhi' ? player.amkhiX : sys==='bow' ? player.bow : player.gangkhi; }
window.thTab = 'amkhi';
function renderTuyetHoc(){
  const sys = window.thTab;
  const S = TH_SYSTEMS[sys];
  const st = thState(sys);
  let html = `<h3>Tấn Chức — 7 Tầng Cảnh Giới</h3>`;
  html += `<div style="display:flex;gap:6px;margin-bottom:8px">`;
  for (const k in TH_SYSTEMS){
    const s2 = TH_SYSTEMS[k];
    const locked = player.level < s2.minLv;
    html += `<button class="mini-btn" style="flex:1;${k===sys?'border-color:#7ecbff;color:#7ecbff':''}${locked?';opacity:.45':''}"
      onclick="window.thTab='${k}';renderTuyetHoc()">${s2.glyph} ${s2.name}${locked?` (C${s2.minLv})`:''}</button>`;
  }
  html += `</div>`;
  html += `<div style="font-size:12px;color:#9aa8d4;margin-bottom:6px">◈ <b>${player.silver}</b> · ◈ Tiến Cấp Đan <b style="color:#7ec850">${player.tienDan}</b> (rơi từ Tay Sai Gloam trở lên — tinh anh & boss rớt nhiều hơn)</div>`;
  if (player.level < S.minLv){
    html += `<div style="padding:14px;font-size:13px">◆ ${S.name} mở khóa ở <b style="color:#7ecbff">cấp ${S.minLv}</b>.</div>`;
    CE().innerHTML = html; return;
  }
  html += `<div style="font-size:12px;opacity:.8;margin-bottom:8px">${S.desc}</div>`;
  html += `<div class="th-roster">${S.tiers.slice(1).map((t,i)=>`<img src="${thIcon(sys, i+1)}" title="Tầng ${i+1}: ${t.name}" class="${i<st.tier?'on':''}" style="${i<st.tier?`border-color:${t.color};box-shadow:0 0 8px ${t.color}55`:''}" onerror="this.style.visibility='hidden'">`).join('')}</div>`;
  if (st.tier > 0){
    const cur = S.tiers[st.tier];
    html += `<div class="mount-name" style="color:${cur.color}"><img src="${thIcon(sys, st.tier)}" class="th-cur-icon" style="filter:drop-shadow(0 0 12px ${cur.color})" onerror="this.style.display='none'"> ${S.glyph} ${cur.name} <span style="font-size:12px;opacity:.7">(Tầng ${st.tier}/7)</span></div>`;
    html += `<div class="bonus-list">${thStatLines(sys, cur).join('<br>')}</div>`;
  } else {
    html += `<div style="text-align:center;padding:6px;opacity:.65;font-size:13px">Chưa tu luyện — tấn chức tầng 1 để khai mở!</div>`;
  }
  if (st.tier < 7){
    const target = st.tier + 1;
    const nx = S.tiers[target];
    const cost = TH_COST[target];
    let rate = TH_RATES[target];
    const guaranteed = st.bless >= 10;
    if (guaranteed) rate = 100;
    const canPay = player.tienDan >= cost.dan && player.silver >= cost.silver &&
      player.mats.manh >= (cost.manh || 0) && player.mats.tichMa >= (cost.tichMa || 0);
    const costTxt = `${cost.dan}◈ Tiến Cấp Đan + ${cost.silver}◈` + (cost.manh ? ` + ${cost.manh}❖ Mảnh` : '') + (cost.tichMa ? ` + ${cost.tichMa}◆ Tịch Ma` : '');
    html += `<div class="next-tier"><img src="${thIcon(sys, target)}" class="th-next-icon" onerror="this.style.display='none'"><b style="color:${nx.color}">Tầng ${target}: ${nx.name}</b><br>
      ${thStatLines(sys, nx).join(' · ')}<br>
      <span style="opacity:.75">Phí: ${costTxt} · Tỉ lệ: <b>${rate}%</b>${guaranteed?' <span style="color:#7ecbff">(Chúc Phúc bảo đảm!)</span>':''}<br>
      (thất bại: mất vật liệu, Chúc Phúc +1 — đủ 10 điểm lần sau chắc chắn thành công)</span></div>
      <div class="tuvi-bar"><div class="fill" style="width:${st.bless*10}%;background:#7ecbff"></div><span>Chúc Phúc ${st.bless}/10</span></div>
      <div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 20px" onclick="upgradeTH('${sys}')" ${canPay?'':'disabled'}>
      Tấn Chức Tầng ${target}</button></div><div id="th-msg"></div>`;
  } else {
    html += `<div style="text-align:center;color:#7ecbff;margin-top:10px;font-size:13px">◑ ${S.name} đã đạt tầng tối thượng — ${S.tiers[7].name}!</div>`;
  }
  CE().innerHTML = html;
}
function thStatLines(sys, t){
  if (sys === 'amkhi') return [`Bạo Kích +${t.crit}%`, t.eff];
  if (sys === 'bow'){
    const parts = [`Bạo Kích +${t.crit}%`, `Xuyên Giáp +${Math.round(t.pierce*100)}%`, `Linh tiễn: ${t.proc}% gây ${Math.round(t.pdmg*100)}% ST`];
    if (t.double) parts.push(`${Math.round(t.double*100)}% bắn 2 mũi`);
    if (t.stun) parts.push(`${Math.round(t.stun*100)}% chặn đứng 1.5s`);
    if (t.burn) parts.push('Thiêu đốt 3s');
    return parts;
  }
  return [`Sinh Lực +${Math.round(t.hp*100)}%`, `Phòng Ngự +${Math.round(t.def*100)}%`, `Kháng hiệu ứng ám khí của địch`];
}
window.upgradeTH = function(sys){
  const S = TH_SYSTEMS[sys];
  const st = thState(sys);
  if (player.level < S.minLv || st.tier >= 7) return;
  const target = st.tier + 1;
  const cost = TH_COST[target];
  if (player.tienDan < cost.dan || player.silver < cost.silver ||
      player.mats.manh < (cost.manh || 0) || player.mats.tichMa < (cost.tichMa || 0)) return;
  player.tienDan -= cost.dan; player.silver -= cost.silver;
  player.mats.manh -= (cost.manh || 0); player.mats.tichMa -= (cost.tichMa || 0);
  let rate = TH_RATES[target];
  if (st.bless >= 10) rate = 100;
  const msg = document.getElementById('th-msg');
  if (Math.random()*100 < rate){
    st.tier++; st.bless = 0;
    const t = S.tiers[st.tier];
    if (msg){ msg.textContent = `✔ Tấn chức thành công — ${t.name}!`; msg.style.color = '#8fd18f'; }
    addFloat(player.x, player.y-46, `${S.name}: ${t.name}!`, t.color, 16);
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:t.color, big:true });
    showThCelebrate(sys, st.tier, t);
    dailyTrack('forge'); // Mục Tiêu Hôm Nay
  } else {
    st.bless = Math.min(10, st.bless + 1);
    if (msg){ msg.textContent = `✘ Tấn chức thất bại — Chúc Phúc +1 (${st.bless}/10)`; msg.style.color = '#ff7a6a'; }
    addFloat(player.x, player.y-46, `Tấn chức xịt — Chúc Phúc ${st.bless}/10`, '#ff7a6a', 13);
  }
  calcDerived(); saveGame();
  setTimeout(()=>{ try{ renderTuyetHoc(); }catch(e){ console.error(e); } }, 800);
};

// ---------- Test mode: max-level character ----------
function genSpecific(slotId, r, level){
  const slot = SLOTS.find(s => s.id === slotId);
  if (slot.special){
    if (slotId === 'aochoang') return genCloak(1);
    if (slotId === 'pet') return genPet(2);
    return genWing(0);
  }
  const tier = itemTier(level);
  const armorGroup = ARMOR_SLOTS.includes(slotId);
  const pool = (armorGroup ? ARMOR_SUBS : WEAPON_SUBS).slice();
  const subs = [];
  for (let i = 0; i < Math.min(4, pool.length); i++){
    const idx = Math.floor(Math.random()*pool.length);
    const def = pool.splice(idx,1)[0];
    subs.push({ k:def.k, name:def.name, v: def.max, pct:true }); // đồ test: chỉ số tối đa
  }
  return assignDef({
    uid: itemSeq++, slot: slot.id, slotName: slot.name,
    name: (armorGroup ? 'Hoàn Hảo ' : '') + ITEM_NAMES[slot.id][r],
    rarity: r, level, tier, perfect: armorGroup,
    main: { k: slot.main, v: slot.base(tier, r), name: mainName(slot.main) },
    element: slot.id === 'vukhi' ? ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)] : null,
    subs, plus: 0,
    awakened: AWAKENED[Math.floor(Math.random()*AWAKENED.length)],
  });
}
function applyTestBoost(){
  // ===== CHẾ ĐỘ THỬ NGHIỆM: MỌI TÍNH NĂNG TỐI ĐA =====
  player.level = MAX_LV; player.xp = 0;            // cấp 100 — mở hết mọi hệ thống & map
  player.str = 50; player.agi = 50; player.def = 50; player.vit = 50; player.ene = 50;
  player.free = 500;                               // điểm tiềm năng dư để cộng thử
  player.silver = 999999; player.mat = 999;        // Huyền Thiết
  player.khi = 999999;                             // Instinct — xung mạch thử
  player.gems = { tuLa: 99, honNguyen: 99 };       // rèn +7 trở lên
  player.tienDan = 99;                             // tấn chức tuyệt học
  player.charms = 99;                              // bảo hiểm rèn +10/+11
  // Ascension: cảnh giới cao nhất (Starforged Cảnh)
  player.dantian.realm = DANTIAN_REALMS.length - 1;
  player.dantian.tuvi = 999999;
  // Instinct Channels: 8 mạch × 20 đốt — toàn bộ đã thông
  for (const m of MERIDIANS) player.meridians[m.id] = 20;
  // Thú Chiến: giai cao nhất, xuất trận sẵn
  player.mount.tier = MOUNT_TIERS.length - 1;
  player.mount.out = true;
  // Tuyệt học: Ám Khí / Cung Tiễn / Cương Khí đều tầng tối đa
  player.amkhiX = { tier: AMKHI_TIERS.length - 1, bless: 0 };
  player.bow = { tier: BOW_TIERS.length - 1, bless: 0 };
  player.gangkhi = { tier: GANGKHI_TIERS.length - 1, bless: 0 };
  // Bí kíp Huyết Ma Thôn Phệ: đã hợp thành
  player.bikip = { pieces: [1,1,1], hmtp: true };
  player.forged11 = true;
  // Full 12 ô Chí Tôn (phẩm cao nhất) giai 10, rèn +11 hoàn hảo
  for (const sl of SLOTS){
    const it = genSpecific(sl.id, RARITIES.length - 1, MAX_LV);
    it.plus = 11; it.perfect = true;
    player.equip[sl.id] = it;
  }
  // 5 ô giáp thay bằng ĐỦ BỘ Cổ Thần — để xem hào quang nhuốm màu bộ (chỉ hiện khi đủ 5 món)
  for (const sl of HERO_ARMOR_SLOTS){
    const it = genAncient('sarkaan', sl, MAX_LV);
    it.plus = 11; it.luck = true; it.life = 7;
    player.equip[sl] = it;
  }
  // Thần Binh tầng cao nhất — bậc bảng màu giáp lấy max(Thần Binh, trang bị)
  player.thanbinh = { tier: TB_TIER_NAMES.length };
  // KHẮC ẤN: gắn đủ 4 cái dùng được của lớp lên đồ đang mặc, mỗi món một cái.
  // Không có bước này thì bật ?max=1 vẫn KHÔNG thấy hệ Khắc Ấn ở đâu cả.
  {
    const pool = sigilPool(player.sect);
    const slots = ['vukhi', 'non', 'ao', 'tay', 'quan', 'chan'];
    pool.forEach((k, i) => { const it = player.equip[slots[i % slots.length]]; if (it) it.sigil = k; });
  }
  // Đồ đặc biệt tối thượng: Áo Choàng cấp 2, Linh Dực CẤP 2 (không phải cánh cấp 1), Pet tốt nhất
  player.equip.aochoang = genCloak(2);
  player.equip.canh = specialItem('canh', WING2_DEFS[1], { wing2: WING2_DEFS[1].id });
  player.equip.pet = genPet(PET_DEFS.length - 1);
  // Châu + Bảo Hạp: để thử nguyên vòng rèn/mở hạp mà không phải cày
  player.jewels = { chucPhuc: 99, linhHon: 99, sinhMenh: 99, honDon: 99 };
  player.baohap = {};
  for (let t = 1; t < BAOHAP_TIERS.length; t++) player.baohap[t] = 10;
  player.mats = player.mats || {};
  // Đủ MỌI nguyên liệu Lò Hỗn Độn cần — thiếu manh/tichMa/anTranAi thì Tấn Phẩm với Kế Thừa
  // vẫn khoá cứng ở max mode, tức là hai công thức không test được.
  player.mats.manhCoThan = 120; player.mats.manh = 300; player.mats.tichMa = 60; player.mats.anTranAi = 20;
  // Danh hiệu: mở hết, trang bị danh hiệu cuối cùng
  player.titles.unlocked = TITLES.map(t => t.id);
  player.titles.equipped = TITLES[TITLES.length - 1].id;
  // Thanh kỹ năng: 3 ô cố định theo phái
  player.skillBar = defaultSkillBar(player.sect);
  // FULL SKILL (bản test): học hết Võ Học Phổ + 30 Dung Hợp, mọi kỹ năng Lv 120
  for (const _vid in VOHOC_DEFS) player.vohoc[_vid] = true;
  for (const _fid in FUSION_DEFS) player.vohoc[_fid] = true;
  player.bikipVH = 999;
  player.skillLv = {};
  for (const _sid in SKILL_DEFS) player.skillLv[_sid] = 120;
  // Túi đồ: loot mẫu để xem hình
  player.inv = [];
  for (let i=0;i<6;i++) player.inv.push(genItem(MAX_LV, 1.5));
  // vài món mang Khắc Ấn + vài món bậc thấp, để thấy ngay bảng so sánh và hai badge ▲ / ◆
  for (const k of sigilPool(player.sect)){
    const it = genItem(MAX_LV, 1.2); it.sigil = k; player.inv.push(it);
  }
  for (const t of [2, 5, 8]){
    const it = genItem(t * 10, 0); it.tier = t; player.inv.push(it);
  }
  player.pk = false; player.toiac = 0; player.gkBuffT = 0; player.poisonT = 0;
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
}

// ---------- Thú Chiến panel & upgrade ----------
function mountAttrLines(t){
  const parts = [`Công Kích ${t.dmg} ST/đòn`];
  if (t.str) parts.push(`Lực Lượng +${t.str}`);
  if (t.agi) parts.push(`Mẫn Tiệp +${t.agi}`);
  if (t.def) parts.push(`Phòng Ngự +${t.def}`);
  if (t.vit) parts.push(`Sinh Lực +${t.vit}`);
  if (t.hp) parts.push(`HP +${t.hp}`);
  if (t.crit) parts.push(`Bạo Kích +${t.crit}%`);
  if (t.qireg) parts.push(`Hồi Instinct +${t.qireg}`);
  return parts;
}
function renderMount(){
  if (player.level < 6){
    CE().innerHTML = `<h3>Thú Chiến</h3>
      <div style="padding:14px;font-size:13px">Chuồng thú mở khóa ở <b style="color:#7ecbff">cấp 6</b>.</div>`;
    return;
  }
  const tier = player.mount.tier;
  const cur = MOUNT_TIERS[tier];
  const next = tier < MOUNT_TIERS.length - 1 ? MOUNT_TIERS[tier+1] : null;
  let html = `<h3>Thú Chiến — Thăng Giai</h3>`;
  html += `<div class="tier-pips">${MOUNT_TIERS.slice(1).map((t,i)=>`<span style="color:${i<tier?'#7ecbff':'rgba(232,236,255,.25)'}">●</span>`).join('')}</div>`;
  if (cur){
    html += `<img class="mount-img" src="${cur.img}" alt="${cur.name}">
      <div class="mount-name" style="color:${cur.color}">${cur.name} <span style="font-size:12px;opacity:.7">(Giai ${tier}/8)</span></div>
      <div class="bonus-list"><b>Thuộc tính gia trì:</b><br>${mountAttrLines(cur).join(' · ')}</div>
      <div style="font-size:12px;color:#9aa8d4;margin-top:6px">Chiến thú đi theo và <b style="color:#7ecbff">tự tấn công</b> quái quanh ngươi, mỗi 1.4s một đòn.</div>
      <div class="forge-actions"><button class="mini-btn" onclick="toggleMountOut()">${player.mount.out?'Thu Hồi (V)':'Xuất Chiến (V)'}</button></div>`;
  } else {
    html += `<div style="text-align:center;padding:8px;opacity:.65;font-size:13px">Ngươi chưa có chiến thú.<br>Thăng giai lần đầu để nhận <b style="color:#7ecbff">Emberhide Bull</b> đồng hành!</div>`;
  }
  if (next){
    const _th = window.stableThau || { n:0, mode:'rate' };
    const _useN = Math.min(_th.n || 0, player.maThau || 0, 3);
    const _matNeed = Math.max(0, next.cost.mat - (_th.mode === 'mat' ? _useN*4 : 0));
    const _rate = Math.min(95, next.rate + (player.mountPity || 0) + (_th.mode === 'rate' ? _useN*7 : 0));
    const canPay = player.silver >= next.cost.silver && player.mat >= _matNeed && player.level >= (next.reqLv || 1);
    html += `<div class="next-tier"><b style="color:${next.color}">Giai ${tier+1}: ${next.name}</b><br>
      ${mountAttrLines(next).join(' · ')}<br>
      <span style="opacity:.75">Phí: ${next.cost.silver}◈ + ${_matNeed}✦${_matNeed < next.cost.mat ? ` <span style="color:#7fd8e0">(Mã Thầu −${next.cost.mat - _matNeed}✦)</span>` : ''} · Tỉ lệ: <b>${_rate}%</b>${(player.mountPity || 0) ? ` <span style="color:#7fd8e0">(+${player.mountPity}% tích lũy)</span>` : ''} · Yêu cầu: <b style="color:${player.level >= (next.reqLv || 1) ? '#8fd18f' : '#ff7a6a'}">cấp ${next.reqLv || 1}</b> (thất bại giữ nguyên giai, +8% tích lũy)</span></div>`;
    if ((player.maThau || 0) > 0){
      html += `<div style="font-size:12px;color:#9aa8d4;margin-top:6px">🪢 Mã Thầu: <b style="color:#7fd8e0">${player.maThau}</b> — dùng
        ${[0,1,2,3].map(n2 => `<button class="mini-btn" style="${(_th.n || 0) === n2 ? 'border-color:#7fd8e0;color:#7fd8e0' : ''}" onclick="stableThauSet(${n2})">${n2}</button>`).join('')}
        <button class="mini-btn" style="${_th.mode === 'rate' ? 'border-color:#7fd8e0;color:#7fd8e0' : ''}" onclick="stableThauMode('rate')">+7% tỉ lệ/thầu</button>
        <button class="mini-btn" style="${_th.mode === 'mat' ? 'border-color:#7fd8e0;color:#7fd8e0' : ''}" onclick="stableThauMode('mat')">−4✦ phí/thầu</button></div>`;
    }
    html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 20px" onclick="upgradeMount()" ${canPay?'':'disabled'}>
      Thăng Giai ${tier===0?'(Nhận Emberhide Bull)':'→ '+next.name}</button></div><div id="mount-msg"></div>`;

  } else {
    html += `<div style="text-align:center;color:#7ecbff;margin-top:10px;font-size:13px">◑ Đã đạt Azure Wyrm — đỉnh cao chiến thú thiên hạ!</div>`;
  }
  CE().innerHTML = html;
}
window.stableThauSet = function(n){ window.stableThau = window.stableThau || { n:0, mode:'rate' }; window.stableThau.n = n; renderMount(); };
window.stableThauMode = function(m){ window.stableThau = window.stableThau || { n:0, mode:'rate' }; window.stableThau.mode = m; renderMount(); };
window.upgradeMount = function(){
  const tier = player.mount.tier;
  const next = MOUNT_TIERS[tier+1];
  if (!next || !next.cost) return;
  const msg = document.getElementById('mount-msg');
  if (player.level < (next.reqLv || 1)){ // GDD Đợt 2 B4: khóa cấp theo giai
    if (msg){ msg.textContent = `🔒 Cần đạt cấp ${next.reqLv} để thăng ${next.name}`; msg.style.color = '#ff7a6a'; }
    addFloat(player.x, player.y-46, `Cần cấp ${next.reqLv} mới thăng được!`, '#ff7a6a', 13);
    return;
  }
  const th = window.stableThau || { n:0, mode:'rate' }; // B5: Mã Thầu hỗ trợ
  const useN = Math.min(th.n || 0, player.maThau || 0, 3);
  const matNeed = Math.max(0, next.cost.mat - (th.mode === 'mat' ? useN*4 : 0));
  if (player.silver < next.cost.silver || player.mat < matNeed) return;
  player.silver -= next.cost.silver; player.mat -= matNeed;
  if (useN > 0) player.maThau -= useN;
  const rate = Math.min(95, next.rate + (player.mountPity || 0) + (th.mode === 'rate' ? useN*7 : 0)); // B4: pity +8%/lần trượt
  window.stableThau = { n:0, mode:'rate' };
  if (Math.random()*100 < rate){
    player.mount.tier++; player.mountPity = 0;
    if (msg){ msg.textContent = `✔ Thăng giai thành công — ${next.name}!`; msg.style.color = '#8fd18f'; }
    addFloat(player.x, player.y-46, `Thú Chiến: ${next.name}!`, next.color, 16);
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:next.color, big:true });
    player.mount.out = true;
    checkTitles();
  } else {
    player.mountPity = (player.mountPity || 0) + 8;
    const _nx2 = MOUNT_TIERS[player.mount.tier+1];
    const _nr = _nx2 ? Math.min(95, _nx2.rate + player.mountPity) : 0;
    if (msg){ msg.textContent = `✘ Thăng giai thất bại — +8% tích lũy (lần sau tối thiểu ${_nr}%)`; msg.style.color = '#ff7a6a'; }
    addFloat(player.x, player.y-46, 'Thất bại! +8% tỉ lệ tích lũy', '#ff7a6a', 13);
  }
  calcDerived(); saveGame();
  setTimeout(()=>{ try{ renderMount(); }catch(e){ console.error(e); } }, 800);
};
window.toggleMountOut = function(){
  if (!player || player.mount.tier === 0){
    if (player) addFloat(player.x, player.y-34, 'Chưa có chiến thú — mở C → Thú Chiến', '#8a8a8a', 12);
    return;
  }
  player.mount.out = !player.mount.out;
  mountObj = null; // triệu hồi lại ở vị trí mới
  addFloat(player.x, player.y-40, player.mount.out ? '⚔ Chiến thú xuất trận!' : 'Chiến thú thu hồi.', '#7ecbff', 13);
  AudioSys.sfx('ui', 0.5);
  refreshCharTab('mount');
};

// ---------- Tẩy Tủy Phong Huyệt (Reset kiểu MU Online): đạt max cấp → cấp về 1, giữ nguyên
// trang bị/Ascension/kỹ năng/danh hiệu — đổi lấy % Công/Mạng vĩnh viễn không mất khi tẩy tủy tiếp ----------
function renderTayTuy(){
  const rc = player.resetCount || 0;
  const curBonus = rc * 2, nextBonus = (rc + 1) * 2;
  let html = `<h3>Tẩy Tủy Phong Huyệt</h3>`;
  html += `<div style="text-align:center;padding:6px 0 10px">
    <div style="font-size:34px">🔄</div>
    <div style="font-size:15px;color:#ffd76a">Số lần Tẩy Tủy: <b>${rc}</b></div>
    <div style="font-size:12px;color:#9aa8d4;margin-top:2px">Công Kích &amp; Sinh Lực hiện tại: <b style="color:#7ec850">+${curBonus}%</b> (vĩnh viễn, không mất khi tẩy tủy tiếp)</div>
  </div>`;
  html += `<div class="bonus-list">Tẩy Tủy sẽ:<br>
    • Đưa cấp độ về <b>1</b>, EXP về 0<br>
    • <b style="color:#7ec850">Giữ nguyên</b> trang bị, Ascension cảnh giới, kỹ năng đã học, danh hiệu, điểm dịch chuyển…<br>
    • Cộng thêm <b style="color:#ffd76a">+2%</b> Công Kích &amp; Sinh Lực vĩnh viễn (→ tổng ${nextBonus}%)</div>`;
  if (player.level < MAX_LV){
    html += `<div style="padding:14px;font-size:13px;text-align:center;color:#9aa8d4">Cần đạt <b style="color:#7ecbff">cấp ${MAX_LV}</b> (Tối đa) mới Tẩy Tủy được.<br>Cấp hiện tại: ${player.level}</div>`;
  } else if (!window._tayTuyConfirm){
    html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 20px" onclick="window.doTayTuy()">🔄 Tẩy Tủy Phong Huyệt</button></div>`;
  } else {
    html += `<div class="forge-actions" style="flex-direction:column;gap:8px">
      <div style="color:#ff9a6a;font-size:12px">Chắc chắn chứ? Cấp độ sẽ về 1 (trang bị/Ascension vẫn giữ nguyên).</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="mini-btn" style="border-color:#7ec850;color:#7ec850" onclick="window.doTayTuy(true)">✓ Xác Nhận</button>
        <button class="mini-btn" onclick="window._tayTuyConfirm=false;renderCharPanel()">✕ Hủy</button>
      </div></div>`;
  }
  CE().innerHTML = html;
}
window.doTayTuy = function(confirmed){
  if (player.level < MAX_LV) return;
  if (!confirmed){ window._tayTuyConfirm = true; renderCharPanel(); return; }
  window._tayTuyConfirm = false;
  player.resetCount = (player.resetCount || 0) + 1;
  player.level = 1; player.xp = 0;
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
  zoneBanner = { text:'🔄 TẨY TỦY PHONG HUYỆT', sub:`Lần thứ ${player.resetCount} — Công Kích & Sinh Lực +${player.resetCount*2}% vĩnh viễn!`, color:'#ffd76a', t:4 };
  addFloat(player.x, player.y-60, `Tẩy Tủy thành công! Reset: ${player.resetCount}`, '#ffd76a', 16);
  addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:'#ffd76a', big:true });
  AudioSys.sfx('levelup', 0.95);
  checkTitles();
  renderCharPanel();
  saveGame();
};
// ---------- Sect select / boot ----------
function startGame(sectKey, quze){
  newPlayer(sectKey);
  player.name = (quze && quze.name) || genCharName(); // danh tính giang hồ (bước đặt tên)
  // The Hatching: từ màn roll (người chơi thật) hoặc roll ngầm (quick-start/test)
  if (quze && quze.traits){
    player.traits = quze.traits.slice(0, 3);
    player.personality = quze.pers || 'trung';
    player.quzeTitle = !!quze.title;
  } else {
    player.traits = rollTraitsSilent();
  }
  applySkillIcons();
  const maxMode = !RELEASE_BUILD && ((el('chk-max') && el('chk-max').checked) || (el('chk-max-quze') && el('chk-max-quze').checked) || (el('chk-max-intro') && el('chk-max-intro').checked) || /max=1/.test(location.search));
  if (maxMode){
    applyTestBoost();
    checkTitles();
    addFloat(player.x, player.y-50, 'CHẾ ĐỘ THỬ NGHIỆM — Cấp 100, MỌI TÍNH NĂNG TỐI ĐA!', '#7ecbff', 16);
    addFloat(player.x, player.y-72, 'Full Chí Tôn +11 · đủ bộ Cổ Thần · 4 Khắc Ấn · Linh Dực c2 · 99 châu · 70 Bảo Hạp', '#a0ffe9', 13);
    addFloat(player.x, player.y-94, 'C nhân vật · I túi đồ · O cài đặt (rung 3 mức) · M bản đồ · K kỹ năng', '#ffd76a', 12);
  } else {
    addFloat(player.x, player.y-50, 'Lunaris City — hãy đến gặp Trưởng Lão Rell (lại gần, nhấn E)!', '#7ecbff', 15);
  }
  if (window.TEST_MODE) addFloat(player.x, player.y-95, 'TEST MODE — nhấn ` (phím dưới Esc) mở console, gõ /help xem lệnh', '#7fd4ff', 12);
  el('intro-story').classList.add('hidden');
  el('sect-select').classList.add('hidden');
  el('hud').classList.remove('hidden');
  el('bottom-hud').classList.remove('hidden');
  el('xp-strip').classList.remove('hidden');
  el('combat-log-wrap').classList.remove('hidden');
  if (maxMode) player.tutStep = -1; // chế độ thử nghiệm: bỏ qua hướng dẫn
  updateTut();
  snapCamera(); // vào game: camera đặt thẳng vào nhân vật, không pan từ góc (0,0)
  AudioSys.playBgm(BGM_TRACKS[curMap]); // chuyển từ nhạc intro sang nhạc map
  saveGame();
}
// Màn menu chỉ còn dành cho người cũ tiếp tục hành trình — chọn phái đã dời vào trong game (cấp 10)
function showMainMenu(){
  el('sect-cards').style.display = 'none';
  const mm = el('max-mode'); if (mm) mm.style.display = 'none';
  const sub = document.querySelector('#sect-select .ss-sub');
  if (sub) sub.textContent = 'Chào mừng trở lại Lunacia — hành trình của ngươi vẫn đang chờ.';
  el('sect-select').classList.remove('hidden');
  AudioSys.playBgm(BGM_INTRO); // nhạc Ái Đích Phế Khư vang lên ngay màn hình chính
}
// `hasSave` phải BIẾT PHIÊN BẢN. Chỉ kiểm tra "có khoá trong localStorage" thì save cũ vẫn
// hiện nút Tiếp Tục, bấm vào thì loadGame() trả false và người chơi rơi ra màn hình trắng.
let saveStale = false;
const hasSave = (() => {
  try {
    const raw = localStorage.getItem('vlcm_save');
    if (!raw) return false;
    if ((JSON.parse(raw).v || 1) >= SAVE_VERSION) return true;
    localStorage.removeItem('vlcm_save'); saveStale = true; return false;
  } catch { return false; }
})();
if (hasSave) showMainMenu();          // người cũ → thẳng màn Tiếp Tục
else if (saveStale){
  // Người này ĐÃ chơi rồi — đừng bắt xem lại intro cốt truyện. Đưa thẳng vào màn chọn lớp,
  // kèm lý do. Mất nhân vật mà không hiểu vì sao là thứ tệ nhất một bản cập nhật có thể làm.
  setTimeout(() => {
    el('sect-select').classList.remove('hidden');
    const cards = el('sect-cards'); if (cards) cards.style.display = '';
    const sub = document.querySelector('#sect-select .ss-sub');
    if (sub) sub.innerHTML = `<b style="color:#e8b04a">Bản cập nhật lớn — toàn bộ trang bị đã được vẽ lại</b><br>
      <span style="opacity:.85">Hệ vật phẩm đổi hoàn toàn: 220 món, mỗi món một hình riêng, và vũ khí nay
      khoá theo lớp. Nhân vật cũ không mang sang được — hãy tạo lại, lần này nhìn đồ là biết đẳng cấp.</span>`;
  }, 0);
}
else setTimeout(showIntro, 0);        // người mới → cốt truyện (defer: chờ module intro ở cuối file nạp xong)
{
  const btn = el('btn-continue');
  if (hasSave) btn.classList.remove('hidden');
  btn.addEventListener('click', ()=>{ // bind luôn: save cloud có thể đến sau khi menu đã hiện
    if (loadGame()){
      applySkillIcons();
      el('sect-select').classList.add('hidden');
      el('hud').classList.remove('hidden');
      el('bottom-hud').classList.remove('hidden');
      el('xp-strip').classList.remove('hidden');
      snapCamera(); // tiếp tục hành trình: camera đặt thẳng vào nhân vật
      AudioSys.playBgm(BGM_TRACKS[curMap]); // chuyển từ nhạc intro sang nhạc map
    }
  });
}
// Video giới thiệu các Tộc removed — assets/video/sect_intro.mp4 never existed in the repo,
// the buttons that opened it were dead links. Re-add once real intro footage is sourced.
window.addEventListener('beforeunload', saveGame);

// ---------- Crash watchdog: ghi lại lỗi cuối để chẩn đoán ----------
{
  const CK = 'vlcm_crashlog';
  const logErr = (kind, msg, stack) => {
    try {
      const arr = JSON.parse(localStorage.getItem(CK) || '[]');
      arr.push({ t: Date.now(), kind, msg: String(msg).slice(0, 300), stack: String(stack || '').slice(0, 500),
        map: typeof curMap !== 'undefined' ? curMap : '?', fx: typeof effects !== 'undefined' ? effects.length : -1,
        mobs: typeof mobs !== 'undefined' ? mobs.length : -1, ua: navigator.userAgent.slice(0, 120),
        mem: (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1) });
      while (arr.length > 5) arr.shift();
      localStorage.setItem(CK, JSON.stringify(arr));
    } catch { /* best-effort — bỏ qua nếu lỗi */ }
  };
  window.addEventListener('error', e => logErr('error', e.message, e.error && e.error.stack));
  window.addEventListener('unhandledrejection', e => logErr('reject', e.reason && e.reason.message || e.reason, e.reason && e.reason.stack));
  // báo lại nếu phiên trước kết thúc bất thường (crash tab — không chạy beforeunload)
  try {
    const wasAlive = sessionStorage.getItem('vlcm_alive');
    const logs = JSON.parse(localStorage.getItem(CK) || '[]');
    if (!wasAlive && logs.length){
      const last = logs[logs.length - 1];
      console.warn('[GHHA] Phiên trước kết thúc bất thường. Lỗi cuối:', last);
      setTimeout(() => {
        try {
          const d = document.createElement('div');
          d.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:99998;max-width:520px;padding:8px 16px;border:1px solid #a04a3a;border-radius:8px;background:rgba(40,18,14,.94);color:#f0b8a8;font:12px/1.5 system-ui,sans-serif;text-align:center';
          d.textContent = '⚠ Phiên chơi trước bị gián đoạn bất thường. Nếu hay gặp crash, hãy thử bật Low FX trong Cài Đặt — lỗi đã được ghi lại để đội dev kiểm tra.';
          d.onclick = () => d.remove();
          document.body.appendChild(d);
          setTimeout(() => d.remove(), 15000);
        } catch { /* best-effort — bỏ qua nếu lỗi */ }
      }, 4000);
    }
    sessionStorage.setItem('vlcm_alive', '1');
  } catch { /* best-effort — bỏ qua nếu lỗi */ }
}

// quick-start via URL: ?sect=thieulam|toanchan|baidasan|minhgiao|bug
// defer: chờ toàn bộ script nạp xong (TUT_STEPS, SIDE_QUESTS, intro... khai báo ở cuối file) tránh TDZ
// TEST_MODE (?test=1 hoặc ?max=1): playtest — dịch chuyển tự do mọi map/phó bản, bỏ qua điều kiện mở
// Bản phát hành vẫn mở cho người chơi chủ động trải nghiệm full: thêm ?test=1 (hoặc ?max=1) vào link
window.TEST_MODE = /([?&])(test|max)=1/.test(location.search);
// TEST_MODE: hiện checkbox "Chế độ thử nghiệm" trên các màn hình bắt đầu (mặc định ẩn trong index.html)
if (window.TEST_MODE) setTimeout(() => {
  for (const id of ['max-mode', 'max-mode-quze', 'max-mode-intro']) { const l = el(id); if (l) l.style.display = 'block'; }
}, 0);
setTimeout(function(){
  const m = location.search.match(/sect=(\w+)/);
  if (m && SECTS[m[1]]){
    startGame(m[1]);
    // debug: &map=tuyettinh — xuất hiện thẳng ở map bất kỳ (kể cả phó bản)
    const mp = location.search.match(/map=(\w+)/);
    if (mp && MAPS[mp[1]] && window.TEST_MODE){
      curMap = mp[1]; DGN = null; buildWorld();
      const md0 = MAPS[mp[1]];
      if (md0.dungeon) startDungeonRun(mp[1]);
      const sp0 = md0.spawn || { x: MAP.w/2, y: MAP.h/2 };
      player.x = sp0.x; player.y = sp0.y;
      if (md0.type === 'safe') player.pk = false;
      snapCamera();
    }
    // debug params: &tier=8&realm=5&mount=1
    const tq = location.search.match(/tier=(\d)/);
    if (tq){ player.mount.tier = Math.min(8, +tq[1]); }
    const rq = location.search.match(/realm=(\d)/);
    if (rq){ player.dantian.realm = Math.min(8, +rq[1]); }
    if (/mount=1/.test(location.search)) player.mount.out = player.mount.tier > 0;
    if (tq || rq){ calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi; saveGame(); }
    const p = location.search.match(/panel=(\w+)/);
    if (p) setTimeout(()=>togglePanel(p[1]), 300);
  }
}, 0);

// ═══════════ PLAYTEST CHEAT CONSOLE — nhấn ` (dưới Esc) khi chạy ?test=1 ═══════════
window.toggleCheatConsole = function(){
  const c = document.getElementById('cheat-console');
  if (!c) return;
  const opening = c.classList.contains('hidden');
  c.classList.toggle('hidden');
  if (opening){ const inp = document.getElementById('cheat-input'); inp.value = ''; setTimeout(() => inp.focus(), 30); cheatLog('Console playtest — gõ /help để xem lệnh, Esc để đóng.', '#7fd4ff'); }
};
function cheatLog(t, color){
  const lg = document.getElementById('cheat-log');
  if (!lg) return;
  const d = document.createElement('div');
  d.textContent = t; if (color) d.style.color = color;
  lg.appendChild(d);
  while (lg.children.length > 9) lg.removeChild(lg.firstChild);
}
setInterval(() => { try { if (window.TEST_MODE && player && player._god){ player.hp = player.maxHp; player.qi = player.maxQi; } } catch { /* best-effort — bỏ qua nếu lỗi */ } }, 400);
const CHEAT_HELP = [
  '/max — mọi thứ tối đa (cấp 120, full đồ +11, full skill Lv 120)',
  '/lv <1-120> — đặt cấp',
  '/map <id> — dịch chuyển: ' + 'daohoa, tuongduong, ngoai, chungnam, comoc, tuyettinh, mongco, nhanmon',
  '/go <x> <y> — dịch chuyển tọa độ',
  '/silver /mat /dan /tuvi /khi /manh /tich /an /cothan <n> — tài nguyên (+n để cộng thêm)',
  '/item [phẩm 0-4] [giai 1-10] — tạo trang bị vào túi',
  '/god — bật/tắt bất tử',
  '/kill [bán kính=350] — hạ quái quanh mình',
  '/realm <0-9> — set cấp đủ để đạt cảnh giới Ascension đó (giờ tự động theo cấp độ)',
  '/th <amkhi|bow|gangkhi> <0-7> — tầng Tấn Chức',
  '/tier <0-8> — tầng Thú Cưỡi',
  '/boss — mở phong ấn & tới Cổng Vực của map',
  '/seal <0-7> — đặt tiến độ Ngũ Trụ (7 = Kết Mở)',
  '/speed <hệ số> — tốc chạy × hệ số',
  '/learn — học toàn bộ Võ Học Phổ',
  '/fullskill — học hết võ học + 30 dung hợp, mọi kỹ năng Lv 120',
  '/phi — Starflight ngay: phá bỏ ràng buộc Lớp, ngự kiếm phi hành, skin tiên nhân',
  '/bikip <n> — đặt số Sách Kỹ Năng',
  '/tenui — gỡ Trọng Thương (nhảy Vực Thẳm lại ngay)',
  '/time [ngày=10] — nhảy thời gian thế giới (Lịch Tu Tiên)',
  '/wipe — xóa save & tải lại game',
  '/obstacles — bật/tắt lớp debug vùng chặn địa hình (đỏ) để hiệu chỉnh theo art',
];
window.cheatExec = function(raw){
  const parts = (raw || '').trim().split(/\s+/);
  if (!parts[0]) return;
  const cmd = parts[0].toLowerCase().replace(/^\//, '');
  const num = (i, d) => { const v = parseFloat(parts[i]); return isNaN(v) ? d : v; };
  try {
    switch (cmd){
      case 'help': CHEAT_HELP.forEach(l => cheatLog(l, '#cfe8ff')); return;
      case 'max': applyTestBoost(); cheatLog('MAX MODE — mọi tính năng tối đa!', '#7ecbff'); break;
      case 'lv': {
        const n = clamp(Math.round(num(1, 1)), 1, 120);
        player.level = n; player.xp = 0; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
        cheatLog('Cấp → ' + n, '#8fd18f'); break;
      }
      case 'map': {
        const id = parts[1];
        if (!MAPS[id]){ cheatLog('Không có map "' + id + '". Xem /help', '#ff7a6a'); return; }
        curMap = id; DGN = null; buildWorld();
        const md = MAPS[id];
        if (md.dungeon) startDungeonRun(id);
        const sp = md.spawn || { x: MAP.w/2, y: MAP.h/2 };
        player.x = sp.x; player.y = sp.y; snapCamera();
        cheatLog('→ ' + md.name, '#8fd18f'); break;
      }
      case 'go': {
        player.x = clamp(num(1, player.x), 20, MAP.w - 20);
        player.y = clamp(num(2, player.y), 20, MAP.h - 20);
        snapCamera(); cheatLog('→ (' + Math.round(player.x) + ', ' + Math.round(player.y) + ')', '#8fd18f'); break;
      }
      case 'learn': {
        let _n = 0;
        for (const _vid in VOHOC_DEFS){ if (!vhLearned(_vid)){ player.vohoc[_vid] = true; _n++; } }
        calcDerived(); cheatLog('Đã học ' + _n + ' võ học — cộng %ST vĩnh viễn (K → Tuyệt Học Cũ)', '#ffb15c'); break;
      }
      case 'fullskill': {
        for (const _vid in VOHOC_DEFS) player.vohoc[_vid] = true;
        for (const _fid in FUSION_DEFS) player.vohoc[_fid] = true;
        player.skillLv = player.skillLv || {};
        for (const _sid in SKILL_DEFS) player.skillLv[_sid] = 120;
        player.bikipVH = Math.max(player.bikipVH || 0, 99);
        calcDerived(); cheatLog('FULL SKILL — 34 võ học + 30 dung hợp, mọi kỹ năng Lv 120 (bấm K gán)', '#ff9ae0'); break;
      }
      case 'bikip': {
        player.bikipVH = clamp(Math.round(num(1, 20)), 0, 999);
        cheatLog('Sách Kỹ Năng → ' + player.bikipVH, '#ffb15c'); break;
      }
      case 'tenui': {
        player.tenuiTT = 0;
        cheatLog('Đã gỡ Trọng Thương — có thể nhảy Vực Thẳm ngay', '#8fd18f'); break;
      }
      case 'phi': { // Starflight ngay — test giai đoạn Thần Tiên Hóa Cảnh
        player.dantian.realm = DANTIAN_REALMS.length - 1;
        ascendToImmortal();
        cheatLog('☁ Starflight — Thần Tiên Hóa Cảnh! Mở Cài Đặt (O) đổi Nam/Nữ & tiên y', '#fff2b0'); break;
      }
      case 'time': { // /time [ngày] — nhảy thời gian thế giới (mặc định +10 ngày)
        gameClock();
        player.gt.t += Math.max(0, num(1, 10)) * GT_DAY;
        const gti = gameTimeInfo(); calcDerived(); spawnAmbients();
        // CANH_NAMES/gti.canh thuộc Lịch Tu Tiên (Can Chi) đã gỡ — để lại thì gõ /time là
        // ném ReferenceError. Đồng hồ thế giới nay chỉ còn ngày/mùa.
        cheatLog(`Đồng Hồ Thế Giới → ${gti.season.name} ${gti.day}/${gti.month} Năm ${gti.year}`, gti.season.color); break;
      }
      case 'silver': case 'mat': case 'tuvi': case 'khi': case 'manh': case 'tich': case 'an': case 'cothan': case 'dan': {
        const raw2 = parts[1] || '10000';
        const add = raw2.startsWith('+');
        const v = Math.abs(parseFloat(raw2)) || 0;
        const set = (get, put) => { const cur = get(); put(add ? cur + v : v); };
        if (cmd === 'silver') set(() => player.silver, x => player.silver = x);
        else if (cmd === 'mat') set(() => player.mat, x => player.mat = x);
        else if (cmd === 'dan') set(() => player.tienDan, x => player.tienDan = x);
        else if (cmd === 'tuvi') set(() => player.dantian.tuvi, x => player.dantian.tuvi = x);
        else if (cmd === 'khi') set(() => player.khi, x => player.khi = x);
        else if (cmd === 'manh') set(() => player.mats.manh, x => player.mats.manh = x);
        else if (cmd === 'tich') set(() => player.mats.tichMa, x => player.mats.tichMa = x);
        else if (cmd === 'an') set(() => player.mats.anTranAi, x => player.mats.anTranAi = x);
        else if (cmd === 'cothan') set(() => player.mats.manhCoThan, x => player.mats.manhCoThan = x);
        cheatLog('OK', '#8fd18f'); break;
      }
      case 'item': {
        const r = clamp(Math.round(num(1, 3)), 0, 4);
        const g = clamp(Math.round(num(2, 5)), 1, 10);
        const it = genItem(Math.min(100, (g-1)*10 + 10), 0, 'tranai');
        it.rarity = r; it.tier = g; it.level = (g-1)*10 + 10; it.perfect = false;
        rerollItemRarity(it);
        player.inv.push(it);
        cheatLog('+' + it.name + ' 【' + giaiName(g) + '】', RARITIES[r].color); break;
      }
      case 'god': player._god = !player._god; cheatLog(player._god ? 'BẤT TỬ: BẬT' : 'BẤT TỬ: TẮT', '#7ecbff'); break;
      case 'kill': {
        const r = num(1, 350);
        const list = mobs.filter(m => !m.dead && dist(player.x, player.y, m.x, m.y) <= r);
        list.forEach(m => { m.hp = 0; killMob(m, 'cheat'); });
        cheatLog('Đã hạ ' + list.length + ' mục tiêu trong ' + r + 'px.', '#8fd18f'); break;
      }
      case 'realm': { // Cảnh giới giờ tự động theo cấp độ (calcDerived()) — set cấp tương ứng thay vì gán thẳng
        const _r = clamp(Math.round(num(1, 0)), 0, DANTIAN_REALMS.length - 1);
        player.level = Math.max(player.level, _r * 12);
        calcDerived(); player.hp = player.maxHp;
        cheatLog('Ascension → ' + DANTIAN_REALMS[player.dantian.realm].name + ' (cấp ' + player.level + ')', '#8fd18f'); break;
      }
      case 'th': {
        const sys = parts[1];
        const st = sys === 'amkhi' ? player.amkhiX : sys === 'bow' ? player.bow : sys === 'gangkhi' ? player.gangkhi : null;
        if (!st){ cheatLog('/th amkhi|bow|gangkhi <0-7>', '#ff7a6a'); return; }
        st.tier = clamp(Math.round(num(2, 1)), 0, 7); st.bless = 0;
        calcDerived(); cheatLog('Tấn Chức ' + sys + ' → tầng ' + st.tier, '#8fd18f'); break;
      }
      case 'tier': {
        player.mount.tier = clamp(Math.round(num(1, 1)), 0, MOUNT_TIERS.length - 1);
        player.mount.out = player.mount.tier > 0;
        cheatLog('Thú Cưỡi → tầng ' + player.mount.tier, '#8fd18f'); break;
      }
      case 'boss': {
        const bd = BOSS_DEFS[curMap];
        if (!bd){ cheatLog('Map này không có trấn thủ.', '#ff7a6a'); return; }
        player.bossKills[curMap] = bd.thuve.map(t => t.id);
        player.x = bd.tranai.x * MAP.w - 380; player.y = bd.tranai.y * MAP.h; snapCamera();
        cheatLog('Đã mở phong ấn — dịch chuyển tới Cổng Vực.', '#c07fe0'); break;
      }
      case 'seal': {
        const n = clamp(Math.round(num(1, 0)), 0, 7);
        const order = ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon'];
        player.storyFlags = {};
        for (let i = 0; i < n; i++) player.storyFlags['ta_' + order[i]] = true;
        if (n >= 7){ player.storyFlags.ketMo = true; showKetMo(); }
        cheatLog('Ngũ Trụ: ' + n + '/7 ấn đã vỡ.', '#e8b060'); break;
      }
      case 'speed': {
        const mul = num(1, 1);
        player.speed = 190 * mul;
        cheatLog('Tốc chạy ×' + mul, '#8fd18f'); break;
      }
      case 'wipe': localStorage.removeItem('vlcm_save'); location.reload(); return;
      case 'obstacles': window.SHOW_OBSTACLES = !window.SHOW_OBSTACLES; cheatLog('Debug obstacle overlay: ' + (window.SHOW_OBSTACLES ? 'ON' : 'OFF'), '#cfe8ff'); return;
      default: cheatLog('Lệnh lạ "' + cmd + '" — gõ /help', '#ff7a6a'); return;
    }
    try { saveGame(); } catch { /* best-effort — bỏ qua nếu lỗi */ }
  } catch (e){ cheatLog('Lỗi: ' + e.message, '#ff7a6a'); }
};

// ---------- Main loop ----------
function loop(now){
  requestAnimationFrame(loop); // schedule first — an error can never freeze the game
  const dt = Math.min(0.05, (now - lastTime)/1000);
  lastTime = now;
  try { update(dt); render(); } catch(e){ console.error(e); }
}
requestAnimationFrame(loop);

// ============================================================
// V2 — UI/UX: khung Nhân Vật gộp tab · Taskbar 5 kỹ năng ·
// Túi Đồ có hình · Bản Đồ thế giới · NPC · PK/Tội Ác
// ============================================================
let _ceDummy = null;
function CE(){ return el('char-content') || (_ceDummy || (_ceDummy = document.createElement('div'))); }
window.charTab = 'info';
// lv = cấp mở khóa — tab khóa sẽ mờ đi, bấm vào chỉ hiện gợi ý (giảm quá tải tân thủ)
const CHAR_TABS = [
  { id:'info',     name:'Thông Tin',  lv:1 },
  { id:'forge',    name:'Rèn Luyện',  lv:5 },
  { id:'mount',    name:'Thú Chiến',  lv:6 },
  { id:'taytuy',   name:'🔄 Tẩy Tủy',  lv:MAX_LV },
  { id:'tuyethoc', name:'Tấn Chức',  lv:4 },
  { id:'pet',      name:'🐾 Linh Thú', lv:15 },
];
function renderCharPanel(){
  let tab = window.charTab;
  if (!sysUnlocked(tab)) tab = window.charTab = 'info'; // tab đang chọn bị khóa → về Thông Tin
  let html = `<h3>Nhân Vật</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div class="char-tabs">`;
  for (const t of CHAR_TABS){
    const locked = !sysUnlocked(t.id);
    html += `<button class="${t.id===tab?'active':''}${locked?' locked':''}" ${locked?`title="Mở khóa ở cấp ${t.lv}"`:''} onclick="switchCharTab('${t.id}')">${locked?'🔒 ':''}${t.name}</button>`;
  }
  html += `</div><div id="char-content"></div>`;
  el('panel-char').innerHTML = html;
  if (tab==='info') renderChar();
  else if (tab==='mount') renderMount();
  else if (tab==='taytuy') renderTayTuy();
  else if (tab==='tuyethoc') renderTuyetHoc();
  else if (tab==='pet') renderPet();
  else renderForge();
}
window.switchCharTab = function(t){
  const def = CHAR_TABS.find(x=>x.id===t);
  if (def && !sysUnlocked(t)){
    addFloat(player.x, player.y-56, `🔒 ${def.name} mở khóa ở cấp ${def.lv}!`, '#a0ffe9', 13);
    return;
  }
  window.charTab = t; renderCharPanel();
};
function refreshCharTab(tab){
  if (el('panel-char').classList.contains('hidden')) return;
  if (tab && window.charTab !== tab) return;
  renderCharPanel();
}
function refreshEqPanels(){
  if (!el('panel-inv').classList.contains('hidden')) renderInv();
  if (!el('panel-bag').classList.contains('hidden')) renderBag();
}

// ---------- Panel routing (override) ----------
function togglePanel(which){
  const tabbed = { forge:'forge', mount:'mount', tuyethoc:'tuyethoc' };
  if (tabbed[which]){ // các hệ thống con → mở khung Nhân Vật đúng tab
    if (!sysUnlocked(tabbed[which])){ // hệ thống chưa mở theo tầng cấp
      const def = CHAR_TABS.find(x=>x.id===tabbed[which]);
      addFloat(player.x, player.y-56, `🔒 ${def ? def.name : 'Hệ thống'} mở khóa ở cấp ${def ? def.lv : '?'}!`, '#a0ffe9', 13);
      AudioSys.sfx('ui', 0.4);
      return;
    }
    const p = el('panel-char');
    const wasHidden = p.classList.contains('hidden');
    closePanels();
    if (wasHidden || window.charTab !== tabbed[which]){
      AudioSys.sfx('ui', 0.6);
      window.charTab = tabbed[which];
      renderCharPanel(); p.classList.remove('hidden');
      tutAdvance('panel');
    }
    return;
  }
  const map = { char:'panel-char', inv:'panel-inv', bag:'panel-bag', skill:'panel-skill', map:'panel-map', settings:'panel-settings', qlog:'panel-qlog', vstat:'panel-vstat' };
  const id = map[which];
  const p = el(id);
  const wasHidden = p.classList.contains('hidden');
  closePanels();
  if (wasHidden){
    AudioSys.sfx('ui', 0.6); renderPanel(which); p.classList.remove('hidden'); if (which==='char') tutAdvance('panel');
    // Trang Bị + Túi Đồ: trên màn hình đủ rộng, mở cùng lúc cả 2 (side-by-side, xem CSS) để
    // kéo-thả đồ từ Túi Đồ sang ô Trang Bị được — kéo-thả HTML5 cần cả 2 cùng có mặt trên DOM.
    // Màn hình hẹp/mobile giữ nguyên hành vi cũ (1 bảng tại 1 thời điểm — kéo-thả vốn không chạy trên chạm).
    if ((which === 'inv' || which === 'bag') && window.innerWidth >= 1000){
      const otherKey = which === 'inv' ? 'bag' : 'inv';
      renderPanel(otherKey);
      el(map[otherKey]).classList.remove('hidden');
    }
  }
}
function renderPanel(which){
  if (which==='vstat'){ renderVStat(); return; }
  if (which==='settings'){ renderSettings(); return; }
  if (which==='qlog'){ renderQlog(); return; }
  if (which==='char'){ window.charTab = 'info'; renderCharPanel(); }
  else if (which==='inv') renderInv();
  else if (which==='bag') renderBag();
  else if (which==='skill') renderSkillPanel();
  else if (which==='map') renderMapPanel();
  else renderCharPanel();
}
function closePanels(){
  for (const id of ['panel-char','panel-inv','panel-bag','panel-skill','panel-map','panel-quest','panel-settings','panel-qlog','panel-vstat','panel-stage']){
    const e2 = document.getElementById(id);
    if (e2) e2.classList.add('hidden');
  }
}
window.closePanels = closePanels;

// ---------- Icon trang bị / vật liệu ----------
const SLOT_ICONS = {
  vukhi:'vukhi', non:'non', ao:'ao', tay:'tay', quan:'quan', chan:'chan',
  daychuyen:'daychuyen', nhan1:'nhan', nhan2:'nhan',
  aochoang:'aochoang', pet:'pet', canh:'canh',
};
// ═══════════════ HÌNH VẬT PHẨM — vẽ bằng code, không dùng file PNG ═══════════════
// 11 file PNG đang phải gánh TOÀN BỘ trang bị: mọi thanh kiếm trong game dùng chung vukhi.png,
// khác nhau đúng một bộ lọc xoay màu theo giai. Nay mỗi món một hình riêng, vẽ bằng code y như
// nhân vật và 25 bộ giáp — hơn 200 món tốn ~0 byte, trong khi 11 file PNG kia đã ngốn 2,3 MB.
//
// Hệ toạ độ: gốc ở TÂM icon, khung 100×100, y âm là hướng lên. Hàm vẽ nhận (g, M, P):
// g = ngữ cảnh, M = bảng màu kim loại, P = tham số riêng của món.
const ICON_PX = 88;
const _itemArtCache = new Map();

// Bảng màu một món: lấy sắc kim loại theo GIAI — dùng chung HERO_METAL với nhân vật để hình
// trong túi và hình trên người là cùng một chất liệu — rồi nhuộm lại theo bộ nếu món thuộc bộ.
function _lum(h){
  const n = parseInt((h || '#888').slice(1), 16);
  return (((n >> 16) & 255) * 0.30 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255;
}
// Nâng một màu về phía trắng theo tỉ lệ k.
function _lift(h, k){
  const n = parseInt((h || '#888').slice(1), 16);
  const f = c => Math.round(c + (255 - c) * k);
  const r = f((n >> 16) & 255), g2 = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g2 << 8) | b).toString(16).slice(1);
}
const WEAPON_MAT = {
  dong:    { lo:'#6a4e28', hi:'#b08a4a', trim:'#e8c078', glow:null },       // đồng
  sat:     { lo:'#4a4f5c', hi:'#8a92a4', trim:'#b8bfd0', glow:null },       // sắt
  thep:    { lo:'#5a6272', hi:'#a8b2c6', trim:'#dfe6f2', glow:null },       // thép sáng
  hacKim:  { lo:'#1c1f28', hi:'#3c424f', trim:'#8fa6c8', glow:'#6f8ec0' },  // hắc kim
  bang:    { lo:'#2c5a72', hi:'#9fd8ee', trim:'#eaf8ff', glow:'#8fe0ff' },  // băng
  lua:     { lo:'#4a1c10', hi:'#8a3a20', trim:'#ffb060', glow:'#ff8a3a' },  // nung đỏ
  vang:    { lo:'#6a5220', hi:'#c8a84a', trim:'#ffe9a8', glow:'#ffd76a' },  // vàng cổ
  xuong:   { lo:'#5a5344', hi:'#cfc6ac', trim:'#efe8d2', glow:null },       // xương
  ma:      { lo:'#2a1f4a', hi:'#6a4fb0', trim:'#c8a8ff', glow:'#a88aff' },  // ma thuật
  rong:    { lo:'#5a1418', hi:'#c0342c', trim:'#ffc24a', glow:'#ff6a2a' },  // vảy rồng
};
function itemPal(def, tier){
  const M = (def && def.mat && WEAPON_MAT[def.mat]) || hMetal(tier);
  const t = def && def.tint;
  let P = !t ? M : { lo: t.lo || M.lo, hi: t.hi || M.hi, trim: t.trim || M.trim,
                     glow: t.glow !== undefined ? t.glow : M.glow };
  // Icon nằm trên nền panel TỐI, còn nhân vật đứng trên bản đồ SÁNG — cùng một bảng màu cho
  // hai chỗ đó là sai. Bộ tối như Hắc Giáp (lo #23262f) tan hẳn vào nền ô túi. Nâng sàn sáng
  // RIÊNG cho icon, giữ nguyên sắc, để món nào cũng đọc được trong túi.
  const need = 0.30 - _lum(P.hi);
  if (need > 0){
    const k = Math.min(0.55, need * 1.7);
    P = { lo: _lift(P.lo, k * 0.85), hi: _lift(P.hi, k), trim: _lift(P.trim, k * 0.5), glow: P.glow };
  }
  return P;
}
function iGrad(g, x0, y0, x1, y1, a, b){
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, a); gr.addColorStop(1, b); return gr;
}
function iPoly(g, pts, close){
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close !== false) g.closePath();
}
function iFill(g, pts, col){ iPoly(g, pts); g.fillStyle = col; g.fill(); }
// Đinh tán: chi tiết nhỏ nhất nhưng là thứ nói "đồ thật" ở cỡ 44px.
function iRivet(g, M, x, y, r){
  g.fillStyle = M.trim; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x - r*0.3, y - r*0.32, r*0.4, 0, 7); g.fill();
}
// Viên đá nạm — dùng cho nấc cao, và là chỗ duy nhất màu `glow` của bộ hiện ra rõ.
function iGem(g, M, x, y, r){
  const c = M.glow || M.trim;
  g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(x - r*0.28, y - r*0.3, r*0.38, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
}

// ═══ BỘ PHẬN VŨ KHÍ — mỗi món là một TỔ HỢP, không phải một dáng tô lại màu ═══
// Bản nháp đầu sai ở đây: 5 nấc chỉ là cùng một thanh kiếm đổi bảng màu, nên 75 vũ khí sẽ ra
// 75 thanh giống hệt nhau. Trong MU thì Kiếm La Mã, Kiếm Điện, Kiếm Băng là BA VẬT KHÁC NHAU
// — khác lưỡi, khác chắn tay, khác hoa văn. Nên tách rời rồi lắp lại:
//   9 lưỡi × 7 chắn tay × 4 chuôi × 6 hoa văn  →  thừa sức cho 75 vũ khí mà không trùng dáng.
// Quy ước: lưỡi vẽ từ chắn tay (y = +12) hướng lên tới mũi (y = len, âm). w = NỬA bề ngang.

// ── LƯỠI ────────────────────────────────────────────────────────────────────────
const IBLADE = {
  // kiếm một tay thường: thuôn đều
  thang(g, M, w, len){
    iFill(g, [[-w, 12], [-w*0.86, len*0.5], [0, len], [w*0.86, len*0.5], [w, 12]], M.hi);
    iFill(g, [[-w*0.28, 9], [-w*0.24, len*0.5], [0, len*0.82], [w*0.24, len*0.5], [w*0.28, 9]], M.lo);
  },
  // KIẾM LA MÃ: ngắn, bè, vai lưỡi gãy khúc rõ rồi mới vào mũi tam giác
  lama(g, M, w, len){
    const W = w * 1.55, sh = len * 0.62;
    iFill(g, [[-W, 12], [-W, sh], [-W*0.9, sh*1.06], [0, len], [W*0.9, sh*1.06], [W, sh], [W, 12]], M.hi);
    iFill(g, [[-W*0.26, 10], [-W*0.26, sh], [0, len*0.86], [W*0.26, sh], [W*0.26, 10]], M.lo);
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-W, sh); g.lineTo(W, sh); g.stroke();
  },
  // KRIS: lưỡi lượn sóng
  song(g, M, w, len){
    const N = 5;
    const side = (s) => {
      const pts = [];
      for (let i = 0; i <= N; i++){
        const t = i / N, y = 12 + (len - 12) * t;
        const amp = (1 - t * 0.55) * w * 0.75;
        pts.push([s * (w * (1 - t * 0.35) + Math.sin(t * Math.PI * 2.6) * amp * 0.5), y]);
      }
      return pts;
    };
    const L = side(-1), R = side(1).reverse();
    iFill(g, [...L, [0, len], ...R], M.hi);
    iFill(g, [[-w*0.22, 9], [-w*0.2, len*0.5], [0, len*0.8], [w*0.2, len*0.5], [w*0.22, 9]], M.lo);
  },
  // KIẾM ĐIỆN: hai ngạnh chẻ, cạnh gãy khúc kiểu tia sét
  chietia(g, M, w, len){
    const zig = (s) => [
      [s*w, 12], [s*w*1.5, len*0.30], [s*w*0.55, len*0.42],
      [s*w*1.35, len*0.66], [s*w*0.5, len*0.74], [s*w*0.95, len*0.92],
    ];
    iFill(g, [...zig(-1), [0, len], ...zig(1).reverse()], M.hi);
    iFill(g, [[-w*0.3, 10], [-w*0.22, len*0.6], [0, len*0.9], [w*0.22, len*0.6], [w*0.3, 10]], M.lo);
  },
  // ĐAO: một lưỡi, sống thẳng, bụng cong
  cong(g, M, w, len){
    g.beginPath();
    g.moveTo(-w, 12);
    g.quadraticCurveTo(-w * 1.9, len * 0.55, -w * 0.25, len);
    g.lineTo(w * 0.55, len * 0.95);
    g.quadraticCurveTo(w * 0.85, len * 0.5, w * 0.8, 12);
    g.closePath();
    g.fillStyle = M.hi; g.fill();
    g.strokeStyle = M.lo; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(w * 0.4, 10); g.quadraticCurveTo(w * 0.5, len * 0.55, w * 0.35, len * 0.9); g.stroke();
  },
  // KIẾM BĂNG: khối pha lê gãy mặt, không có sống
  pha_le(g, M, w, len){
    const W = w * 1.2;
    iFill(g, [[-W, 12], [-W*0.75, len*0.42], [-W*0.5, len*0.7], [0, len], [W*0.5, len*0.7], [W*0.75, len*0.42], [W, 12]], M.hi);
    // ba mặt cắt
    iFill(g, [[-W, 12], [-W*0.75, len*0.42], [0, len*0.36], [0, 12]], M.lo);
    g.save(); g.globalAlpha = .55;
    iFill(g, [[0, 12], [0, len*0.36], [W*0.75, len*0.42], [W, 12]], '#ffffff');
    g.restore();
    iFill(g, [[-W*0.5, len*0.7], [0, len], [W*0.5, len*0.7], [0, len*0.62]], M.lo);
  },
  // lưỡi răng cưa
  rangcua(g, M, w, len){
    iFill(g, [[-w, 12], [-w*0.8, len*0.55], [0, len], [w*0.8, len*0.55], [w, 12]], M.hi);
    g.fillStyle = M.lo;
    for (let i = 0; i < 5; i++){
      const t = 0.14 + i * 0.16, y = 12 + (len - 12) * t;
      const ww = w * (1 - t * 0.42);
      iPoly(g, [[ww, y], [ww + 3.4, y - 2.6], [ww, y - 5.2]]); g.fill();
    }
    iFill(g, [[-w*0.26, 9], [-w*0.22, len*0.55], [0, len*0.8], [w*0.22, len*0.55], [w*0.26, 9]], M.lo);
  },
  // ĐẠI KIẾM: to bản, có khấc gần chắn tay
  daikiem(g, M, w, len){
    const W = w * 1.7;
    iFill(g, [[-W, 12], [-W, len*0.22], [-W*1.25, len*0.3], [-W*0.92, len*0.38],
              [-W*0.8, len*0.72], [0, len], [W*0.8, len*0.72], [W*0.92, len*0.38],
              [W*1.25, len*0.3], [W, len*0.22], [W, 12]], M.hi);
    iFill(g, [[-W*0.3, 9], [-W*0.26, len*0.62], [0, len*0.85], [W*0.26, len*0.62], [W*0.3, 9]], M.lo);
  },
  // RÌU: đầu rìu bè một bên cán, cán xuyên suốt
  riu(g, M, w, len){
    const H = len * 0.62;                       // đầu rìu chiếm phần trên
    iFill(g, [[-w*0.5, 12], [w*0.5, 12], [w*0.5, len], [-w*0.5, len]], M.lo);   // cán
    g.beginPath();                              // lưỡi bè sang phải
    g.moveTo(w*0.4, H*0.35);
    g.quadraticCurveTo(w*3.4, H*0.5, w*3.1, H);
    g.quadraticCurveTo(w*2.2, len*0.94, w*0.4, len*0.9);
    g.closePath();
    g.fillStyle = iGrad(g, w*0.4, H, w*3.4, len, M.hi, M.lo); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 1; g.stroke();
    iFill(g, [[-w*0.4, H*0.5], [-w*1.7, H*0.75], [-w*1.5, len*0.9], [-w*0.4, len*0.85]], M.trim);  // ngạnh sau
    iFill(g, [[-w*0.5, len], [w*0.5, len], [0, len*1.14]], M.trim);             // mũi nhọn đỉnh cán
  },
  // CHÙY: đầu khối có cánh, dùng để phá giáp
  chuy(g, M, w, len){
    const H = len * 0.66;
    iFill(g, [[-w*0.5, 12], [w*0.5, 12], [w*0.5, H*0.9], [-w*0.5, H*0.9]], M.lo);  // cán
    const R = w * 2.2;
    g.fillStyle = iGrad(g, -R, H, R, len, M.hi, M.lo);
    g.beginPath(); g.ellipse(0, (H + len) / 2, R, Math.abs(len - H) * 0.58, 0, 0, 7); g.fill();
    g.fillStyle = M.trim;                        // 4 cánh phá giáp
    for (const sd of [-1, 1]){
      iPoly(g, [[sd*R*0.6, H*0.98], [sd*R*1.85, (H+len)/2], [sd*R*0.6, len*0.98]]); g.fill();
    }
    iPoly(g, [[-w*0.7, len*0.95], [w*0.7, len*0.95], [0, len*1.2]]); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(0, (H + len) / 2, R, Math.abs(len - H) * 0.58, 0, 0, 7); g.stroke();
  },
  // KIẾM MẢNH: đâm, gần như không bề ngang
  manh(g, M, w, len){
    const W = w * 0.5;
    iFill(g, [[-W, 12], [-W, len*0.78], [0, len], [W, len*0.78], [W, 12]], M.hi);
    g.strokeStyle = M.lo; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, 10); g.lineTo(0, len*0.85); g.stroke();
  },
};

// ── CHẮN TAY ────────────────────────────────────────────────────────────────────
const IGUARD = {
  thanh(g, M, gw){ iFill(g, [[-gw, 12], [-gw*0.82, 17.5], [gw*0.82, 17.5], [gw, 12], [gw*0.74, 9.4], [-gw*0.74, 9.4]], M.trim); },
  quat(g, M, gw){  // quillon vuốt lên
    iFill(g, [[-gw, 12], [-gw*0.8, 17], [gw*0.8, 17], [gw, 12], [gw*0.72, 9.4], [-gw*0.72, 9.4]], M.trim);
    iFill(g, [[-gw, 12.5], [-gw-4.5, 4], [-gw*0.7, 9.4]], M.trim);
    iFill(g, [[gw, 12.5], [gw+4.5, 4], [gw*0.7, 9.4]], M.trim);
  },
  canh(g, M, gw){  // cánh xoè
    for (const s of [-1, 1]){
      g.save(); g.scale(s, 1);
      g.beginPath(); g.moveTo(0, 9);
      g.quadraticCurveTo(gw*0.7, 4, gw*1.25, 12);
      g.quadraticCurveTo(gw*0.8, 18, 0, 17); g.closePath();
      g.fillStyle = M.trim; g.fill();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = .8; g.stroke();
      g.restore();
    }
  },
  luoiliem(g, M, gw){ // lưỡi liềm ngửa
    g.beginPath();
    g.moveTo(-gw*1.15, 15); g.quadraticCurveTo(0, 2.5, gw*1.15, 15);
    g.quadraticCurveTo(0, 10, -gw*1.15, 15); g.closePath();
    g.fillStyle = M.trim; g.fill();
  },
  vuot(g, M, gw){  // vuốt quặp xuống
    iFill(g, [[-gw*0.7, 9.4], [gw*0.7, 9.4], [gw*0.7, 15], [-gw*0.7, 15]], M.trim);
    for (const s of [-1, 1]) iFill(g, [[s*gw*0.6, 10], [s*gw*1.45, 20], [s*gw*0.95, 21], [s*gw*0.55, 15]], M.trim);
  },
  soc(g, M, gw){   // ổ giữa + hai ngạnh nhỏ
    iFill(g, [[-gw*0.9, 11], [gw*0.9, 11], [gw*0.75, 17], [-gw*0.75, 17]], M.trim);
    for (const s of [-1, 1]) iFill(g, [[s*gw*0.9, 11], [s*gw*1.3, 13.6], [s*gw*0.85, 17]], M.trim);
  },
  khong(g){ void g; },  // gậy / cung: không có chắn tay
};

// ── CHUÔI ───────────────────────────────────────────────────────────────────────
const IPOMMEL = {
  tron(g, M, r){ g.fillStyle = M.trim; g.beginPath(); g.arc(0, 33, r, 0, 7); g.fill(); },
  da(g, M, r){ g.fillStyle = M.trim; g.beginPath(); g.arc(0, 33, r, 0, 7); g.fill(); iGem(g, M, 0, 33, r*0.55); },
  gai(g, M, r){ iFill(g, [[-r, 30], [r, 30], [0, 30 + r*2.2]], M.trim);
                g.fillStyle = M.trim; g.beginPath(); g.arc(0, 30, r*0.8, 0, 7); g.fill(); },
  vuot(g, M, r){ g.fillStyle = M.trim; g.beginPath(); g.arc(0, 32, r*0.9, 0, 7); g.fill();
                 for (const s of [-1, 1]) iFill(g, [[s*r*0.5, 30], [s*r*1.9, 36], [s*r*0.4, 35]], M.trim); },
};

// ── HOA VĂN trên lưỡi — thứ biến "thanh kiếm" thành "KIẾM ĐIỆN" ────────────────
// Màu hoa văn thuộc về MÓN, không thuộc về giai. Bản đầu lấy M.glow nên Kiếm Điện, Kiếm Băng
// và Kiếm Lửa cùng giai thì cùng một màu vàng — mất sạch bản sắc. Trong MU thì Kiếm Điện xanh
// điện ở mọi cấp.
const MOTIF_COL = { set:'#8fe0ff', bang:'#bfe8ff', lua:'#ff8a2a', runes:'#c8a8ff', gai:null, mach:'#c8a8ff' };
const IMOTIF = {
  khong(g){ void g; },
  set(g, M, len){          // tia sét gãy khúc
    const c = MOTIF_COL.set;
    const path = () => { g.beginPath();
      g.moveTo(-3, 6); g.lineTo(2.6, len*0.34); g.lineTo(-2.8, len*0.46);
      g.lineTo(3, len*0.72); g.lineTo(-1.4, len*0.84); };
    g.save();
    // rãnh tối lót dưới — không có nó thì nét sáng tan vào lưỡi kim loại sáng
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 4.6; g.lineJoin = 'miter'; path(); g.stroke();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = c; g.globalAlpha = .45; g.lineWidth = 5; path(); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 2.2; path(); g.stroke();
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.9; path(); g.stroke();
    g.restore();
  },
  bang(g, M, len){         // gai băng mọc chéo hai bên sống
    const c = MOTIF_COL.bang;
    const spikes = () => { g.beginPath();
      for (let i = 0; i < 4; i++){
        const y = 4 + (len - 4) * (0.18 + i * 0.2);
        g.moveTo(0, y); g.lineTo(-5.4, y - 5.2); g.moveTo(0, y); g.lineTo(5.4, y - 5.2);
      }
      g.moveTo(0, 6); g.lineTo(0, len*0.88); };
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,40,70,.55)'; g.lineWidth = 4.2; spikes(); g.stroke();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = c; g.globalAlpha = .5; g.lineWidth = 4; spikes(); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 1.7; spikes(); g.stroke();
    g.restore();
  },
  lua(g, M, len){          // lưỡi lửa liếm dọc sống
    const c = MOTIF_COL.lua;
    const flames = () => { g.beginPath();
      for (let i = 0; i < 3; i++){
        const y = 4 + (len - 4) * (0.2 + i * 0.26), sd = i % 2 ? 1 : -1;
        g.moveTo(0, y);
        g.quadraticCurveTo(sd * 7, y - 6, 0, y - 13.5);
        g.quadraticCurveTo(sd * 2.4, y - 6, 0, y);
      } };
    g.save();
    g.fillStyle = 'rgba(60,10,0,.5)'; flames(); g.fill();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = c; g.globalAlpha = .95; flames(); g.fill();
    g.globalAlpha = .8; g.fillStyle = '#ffe08a';
    g.save(); g.scale(0.5, 0.72); flames(); g.fill(); g.restore();
    g.restore();
  },
  runes(g, M, len){        // ký tự khắc chìm
    g.save(); g.strokeStyle = MOTIF_COL.runes; g.lineWidth = 1.5; g.globalAlpha = 1;
    for (let i = 0; i < 4; i++){
      const y = 4 + (len - 4) * (0.2 + i * 0.19);
      g.beginPath(); g.moveTo(-2.2, y); g.lineTo(2.2, y - 2.4); g.moveTo(2.2, y); g.lineTo(-2.2, y - 2.4); g.stroke();
    }
    g.restore();
  },
  gai(g, M, len){          // ngạnh mọc ra khỏi lưỡi
    g.fillStyle = M.trim;
    for (let i = 0; i < 3; i++){
      const y = 4 + (len - 4) * (0.26 + i * 0.24);
      iPoly(g, [[-3, y], [-9.5, y - 3.2], [-3, y - 5.5]]); g.fill();
      iPoly(g, [[3, y], [9.5, y - 3.2], [3, y - 5.5]]); g.fill();
    }
  },
  mach(g, M, len){         // mạch sáng chạy giữa sống
    const c = MOTIF_COL.mach;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .75;
    g.strokeStyle = c; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 6); g.lineTo(0, len*0.86); g.stroke();
    g.lineWidth = 1; g.globalAlpha = 1; g.strokeStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, 6); g.lineTo(0, len*0.86); g.stroke();
    g.restore();
  },
};

// Lắp một vũ khí từ 4 bộ phận. P = { blade, guard, pommel, motif, w, len, gw, st }
function iaWeapon(g, M, P){
  const st = P.st || 1;
  g.save(); g.rotate(P.rot === undefined ? -0.42 : P.rot);
  // Tỉ lệ là thứ nói "món này NẶNG". Bản đầu mọi thanh dài xấp xỉ nhau nên đại kiếm trông
  // chẳng to hơn dao găm chút nào — cỡ phải chênh thật.
  const len = P.len || -44, w = P.w || 5.5, gw = P.gw || 15;
  if (P.big) g.scale(P.big, P.big);
  // Viền tối: vẽ lưỡi một lần bằng màu gần-đen ở cỡ nhỉnh hơn để tạo contour. Không có nó thì
  // lưỡi sáng nằm trên nền sáng là mất hẳn bóng dáng — đây là thứ mọi icon MU đều có.
  const DK = { lo:'#0a0c12', hi:'#0a0c12', trim:'#0a0c12', glow:null };
  g.save(); g.translate(0, 0.6); g.scale(1.1, 1.03);
  (IBLADE[P.blade] || IBLADE.thang)(g, DK, w, len);
  g.restore();
  (IBLADE[P.blade] || IBLADE.thang)(g, M, w, len);
  (IMOTIF[P.motif] || IMOTIF.khong)(g, M, len);
  // cán
  iFill(g, [[-3.4, 17], [3.4, 17], [3, 31], [-3, 31]], M.lo);
  g.strokeStyle = M.hi; g.lineWidth = 1.5;
  for (let i = 0; i < 4; i++){ const y = 19 + i * 3.4;
    g.beginPath(); g.moveTo(-3.3, y); g.lineTo(3.3, y + 1.6); g.stroke(); }
  (IGUARD[P.guard] || IGUARD.thanh)(g, M, gw);
  (IPOMMEL[P.pommel] || IPOMMEL.tron)(g, M, 4.4 + st * 0.3);
  if (st >= 3) iGem(g, M, 0, 13.4, 2.1 + st * 0.18);
  g.restore();
}

// ═══ GẬY / TRƯỢNG — thân + đầu, giống kiếm là lưỡi + chắn tay ═══
// Dark Wizard và Dark Lord không cầm kiếm. Dùng chung bộ phận lưỡi cho họ là sai từ gốc.
const ISHAFT = {
  thang(g, M, len){                                  // thân trơn
    iFill(g, [[-3.2, 34], [3.2, 34], [2.6, len], [-2.6, len]], iGrad(g, -3, 34, 3, len, M.hi, M.lo));
  },
  xoan(g, M, len){                                   // thân xoắn thừng
    iFill(g, [[-3.4, 34], [3.4, 34], [2.8, len], [-2.8, len]], iGrad(g, -3, 34, 3, len, M.hi, M.lo));
    g.strokeStyle = 'rgba(0,0,0,.34)'; g.lineWidth = 1.3;
    for (let i = 0; i < 9; i++){
      const y = 32 - i * (32 - len) / 9;
      g.beginPath(); g.moveTo(-3.2, y); g.lineTo(3.2, y - 4.5); g.stroke();
    }
  },
  dot(g, M, len){                                    // thân chia đốt
    iFill(g, [[-3.2, 34], [3.2, 34], [2.6, len], [-2.6, len]], iGrad(g, -3, 34, 3, len, M.hi, M.lo));
    g.fillStyle = M.trim;
    for (let i = 1; i < 5; i++){
      const y = 34 - i * (34 - len) / 5;
      g.fillRect(-4.4, y - 2, 8.8, 4);
    }
  },
  xuong(g, M, len){                                  // thân xương, phình đốt
    iFill(g, [[-3, 34], [3, 34], [2.4, len], [-2.4, len]], iGrad(g, -3, 34, 3, len, M.hi, M.lo));
    g.fillStyle = M.hi;
    for (let i = 0; i < 4; i++){
      const y = 28 - i * (28 - len) / 4;
      g.beginPath(); g.ellipse(0, y, 5.2, 3, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .8; g.stroke();
    }
  },
};
const IHEAD = {
  cau(g, M, y, st){                                  // cầu phép
    const c = M.glow || M.trim, r = 8 + st * 0.9;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .4;
    g.fillStyle = c; g.beginPath(); g.arc(0, y, r + 6, 0, 7); g.fill(); g.restore();
    const gr = g.createRadialGradient(-r * .3, y - r * .35, 1, 0, y, r);
    gr.addColorStop(0, '#fff'); gr.addColorStop(.4, c); gr.addColorStop(1, M.lo);
    g.fillStyle = gr; g.beginPath(); g.arc(0, y, r, 0, 7); g.fill();
    if (st >= 3){ g.strokeStyle = M.trim; g.lineWidth = 2.4;   // gọng ôm
      g.beginPath(); g.arc(0, y, r + 3.4, Math.PI * .8, Math.PI * 2.2); g.stroke(); }
  },
  liem(g, M, y, st){                                 // lưỡi liềm
    g.beginPath();
    g.moveTo(-13, y + 6); g.quadraticCurveTo(-17, y - 16, 0, y - 20);
    g.quadraticCurveTo(15, y - 16, 12, y + 6);
    g.quadraticCurveTo(9, y - 8, 0, y - 10);
    g.quadraticCurveTo(-9, y - 8, -13, y + 6);
    g.closePath(); g.fillStyle = M.trim; g.fill();
    if (st >= 3) iGem(g, M, 0, y - 4, 3);
  },
  so(g, M, y, st){                                   // sọ
    g.fillStyle = M.hi;
    g.beginPath(); g.ellipse(0, y - 5, 9, 10, 0, 0, 7); g.fill();
    iFill(g, [[-6, y + 3], [6, y + 3], [4.6, y + 10], [-4.6, y + 10]], M.hi);
    g.fillStyle = '#0a0c12';
    g.beginPath(); g.arc(-3.6, y - 6, 2.7, 0, 7); g.arc(3.6, y - 6, 2.7, 0, 7); g.fill();
    g.fillRect(-1.6, y + 1, 3.2, 3);
    if (st >= 4){ g.fillStyle = M.trim;                 // sừng hai bên sọ
      iPoly(g, [[-8, y - 10], [-18, y - 20], [-6, y - 14]]); g.fill();
      iPoly(g, [[8, y - 10], [18, y - 20], [6, y - 14]]); g.fill(); }
  },
  tinhthe(g, M, y, st){                              // cụm tinh thể
    const c = M.glow || M.trim;
    const shard = (dx, dy, h, w) => { iPoly(g, [[dx - w, y + dy], [dx, y + dy - h], [dx + w, y + dy]]); g.fill(); };
    g.fillStyle = M.lo; shard(-7, 4, 14, 4.5); shard(7, 5, 12, 4);
    g.fillStyle = c;    shard(0, 6, 22 + st, 5.5);
    g.fillStyle = 'rgba(255,255,255,.6)'; shard(-1.6, 4, 14, 2);
  },
  canh(g, M, y, st){                                 // đôi cánh ôm viên đá
    for (const sd of [-1, 1]){
      g.save(); g.translate(sd * 5, y); g.scale(sd, 1); g.fillStyle = M.trim;
      for (let i = 0; i < 3; i++){
        g.beginPath(); g.moveTo(0, 4 - i * 2);
        g.quadraticCurveTo(9 + i * 2, -6 - i * 4, 14 + i * 3, -2 - i * 6);
        g.quadraticCurveTo(7 + i, 2 - i * 3, 0, 6 - i * 2); g.fill();
      }
      g.restore();
    }
    iGem(g, M, 0, y - 2, 4.6 + st * 0.4);
  },
  vong(g, M, y, st){                                 // vòng lệnh
    g.strokeStyle = M.trim; g.lineWidth = 4 + st * 0.4;
    g.beginPath(); g.arc(0, y - 6, 11, 0, 7); g.stroke();
    if (st >= 3){ g.lineWidth = 1.6; g.strokeStyle = M.glow || M.hi;
      g.beginPath(); g.arc(0, y - 6, 11, 0, 7); g.stroke(); }
    iGem(g, M, 0, y - 6, 3.4 + st * 0.3);
  },
  vuot(g, M, y, st){                                 // vuốt quặp giữ đá
    g.fillStyle = M.trim;
    for (const sd of [-1, 1]){
      g.beginPath(); g.moveTo(sd * 3, y + 8);
      g.quadraticCurveTo(sd * 13, y + 2, sd * 10, y - 14);
      g.quadraticCurveTo(sd * 9, y - 2, sd * 1, y + 6); g.closePath(); g.fill();
    }
    iGem(g, M, 0, y - 1, 5 + st * 0.5);
  },
};
function iaStaff(g, M, P){
  const st = P.st || 1;
  g.save(); g.rotate(P.rot === undefined ? -0.26 : P.rot);
  const len = P.len || -30;                          // đỉnh thân (đầu gậy nằm trên nữa)
  const DK = { lo:'#0a0c12', hi:'#0a0c12', trim:'#0a0c12', glow:null };
  g.save(); g.scale(1.5, 1.02); (ISHAFT[P.shaft] || ISHAFT.thang)(g, DK, len); g.restore();
  (ISHAFT[P.shaft] || ISHAFT.thang)(g, M, len);
  (IHEAD[P.head] || IHEAD.cau)(g, M, len - 6, st);
  // đai tay
  iFill(g, [[-4.6, 16], [4.6, 16], [4, 26], [-4, 26]], M.trim);
  if (st >= 2) iRivet(g, M, 0, 21, 1.6);
  if (st >= 4) iFill(g, [[-3.4, 34], [3.4, 34], [0, 42]], M.trim);   // chân nhọn
  g.restore();
}

// ═══ CUNG / NỎ ═══
function iaBow(g, M, P){
  const st = P.st || 1, kind = P.limb || 'cong';
  g.save(); g.rotate(P.rot === undefined ? 0.12 : P.rot);
  const H = 43 + st * 1.6;
  const limb = (sd) => {                             // một cánh cung
    g.beginPath();
    // Bề ngang cánh phải THẤY ĐƯỢC. Bản đầu mép trong và mép ngoài gần trùng nhau nên cả cây
    // cung chỉ còn là một nét mảnh, ở 44px thì mất hẳn.
    g.moveTo(2, sd * 5);
    if (kind === 'dai') g.quadraticCurveTo(-19, sd * H * 0.55, -11, sd * H);        // trường cung: cong đều
    else if (kind === 'kep'){ g.quadraticCurveTo(-23, sd * H * 0.45, -10, sd * H * 0.76);
                              g.quadraticCurveTo(-1, sd * H * 0.94, -15, sd * H); } // cung kép: gập ngược đầu
    else g.quadraticCurveTo(-26, sd * H * 0.5, -7, sd * H);                         // cung ngắn: cong sâu
    g.lineTo(0, sd * (H - 5));
    if (kind === 'dai') g.quadraticCurveTo(-9, sd * H * 0.55, 9, sd * 5);
    else if (kind === 'kep'){ g.quadraticCurveTo(-4, sd * H * 0.88, -1, sd * H * 0.72);
                              g.quadraticCurveTo(-14, sd * H * 0.45, 9, sd * 5); }
    else g.quadraticCurveTo(-15, sd * H * 0.5, 9, sd * 5);
    g.closePath();
  };
  for (const sd of [-1, 1]){
    limb(sd); g.fillStyle = iGrad(g, -26, 0, 9, 0, M.lo, M.hi); g.fill();
    limb(sd); g.strokeStyle = 'rgba(0,0,0,.48)'; g.lineWidth = 1.4; g.stroke();
  }
  // dây
  g.strokeStyle = '#e8e0c8'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-10, -H); g.lineTo(-4, 0); g.lineTo(-10, H); g.stroke();
  // tay nắm
  iFill(g, [[-7, -15], [8, -15], [7, 15], [-6, 15]], M.trim);
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .9;
  for (let i = -1; i <= 1; i++){ g.beginPath(); g.moveTo(-5, i * 7); g.lineTo(5, i * 7); g.stroke(); }
  if (st >= 3) iGem(g, M, 0, 0, 3 + st * 0.25);
  if (st >= 4){                                      // trang trí đầu cánh
    g.fillStyle = M.trim;
    for (const sd of [-1, 1]) iPoly(g, [[-9, sd * H], [-19, sd * (H + 7)], [-6, sd * (H - 5)]]), g.fill();
  }
  g.restore();
}
function iaCrossbow(g, M, P){
  const st = P.st || 1;
  g.save(); g.rotate(P.rot === undefined ? -0.18 : P.rot);
  const W = 36 + st * 1.8;
  // hai cánh nằm NGANG — đây là thứ tách nỏ khỏi cung ngay từ bóng dáng
  for (const sd of [-1, 1]){
    g.beginPath();
    g.moveTo(sd * 5, -8); g.quadraticCurveTo(sd * W * 0.6, -18, sd * W, -7);
    g.quadraticCurveTo(sd * W * 0.62, -1, sd * 5, 2); g.closePath();
    g.fillStyle = iGrad(g, 0, -13, 0, 0, M.hi, M.lo); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.stroke();
  }
  g.strokeStyle = '#e8e0c8'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(-W, -6); g.lineTo(0, 4); g.lineTo(W, -6); g.stroke();
  // báng dọc
  iFill(g, [[-6, -16], [6, -16], [5, 26], [-5, 26]], iGrad(g, -6, -16, 6, 26, M.hi, M.lo));
  iFill(g, [[-8, -18], [8, -18], [7, -9], [-7, -9]], M.trim);
  iFill(g, [[-5, 14], [5, 14], [11, 29], [2, 29]], M.lo);           // cò
  if (st >= 2) iRivet(g, M, 0, 6, 1.8);
  // Mũi tên nạp CHĨA LÊN từng làm cả cây nỏ thành mớ gai trên tay nhân vật — bỏ, thay bằng
  // rãnh dẫn tên nằm trên báng, đọc ra "nỏ" mà không phá bóng dáng.
  if (st >= 3){ g.strokeStyle = M.trim; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(0, -14); g.lineTo(0, 10); g.stroke(); }
  if (st >= 4) iGem(g, M, 0, -4, 3.2);
  g.restore();
}

// ═══ GIÁP — bóng dáng theo KIỂU BỘ, không phải một dáng tô lại màu ═══
// 12 kiểu lấy thẳng từ HERO_SETS[].style, nên hình trong túi và hình trên người là CÙNG một
// bộ. Mũ pháp sư phải là mũ trùm vải, không được là mũ hiệp sĩ đổi màu.
const ARMOR_TRAIT = {
  plate:     { soft:0, crest:'sung',   tex:'tam',    round:0.15 },
  chain:     { soft:0, crest:'khong',  tex:'luoi',   round:0.85 },
  drake:     { soft:0, crest:'vuot',   tex:'vay',    round:0.25 },
  hoalong:   { soft:0, crest:'rong',   tex:'vay',    round:0.20 },
  cloth:     { soft:1, crest:'khong',  tex:'nep',    round:1.00 },
  sphinx:    { soft:0, crest:'nemes',  tex:'soc',    round:0.30 },
  arcane:    { soft:1, crest:'cau',    tex:'rune',   round:0.90 },
  hide:      { soft:1, crest:'khong',  tex:'khau',   round:0.75 },
  leaf:      { soft:1, crest:'la',     tex:'la',     round:0.80 },
  plume:     { soft:0, crest:'canh',   tex:'vu',     round:0.55 },
  halfplate: { soft:0, crest:'lech',   tex:'tam',    round:0.25, asym:1 },
  regal:     { soft:0, crest:'vuong',  tex:'vien',   round:0.35 },
};
function aTrait(P){ return ARMOR_TRAIT[P.style] || ARMOR_TRAIT.plate; }

// Hoạ tiết bề mặt — phủ lên một vùng đã vẽ, cắt theo đường bao hiện tại.
function aTex(g, M, T, st, x0, y0, x1, y1){
  g.save(); g.clip();
  const w = x1 - x0, h = y1 - y0;
  if (T.tex === 'luoi'){                       // giáp lưới: chấm tròn so le
    g.fillStyle = 'rgba(0,0,0,.30)';
    for (let y = y0 + 2; y < y1; y += 4.2)
      for (let x = x0 + ((Math.round((y - y0) / 4.2) % 2) ? 2 : 0); x < x1; x += 4.2){
        g.beginPath(); g.arc(x, y, 1.35, 0, 7); g.fill();
      }
  } else if (T.tex === 'vay'){                 // vảy: cung xếp lớp
    g.strokeStyle = 'rgba(0,0,0,.34)'; g.lineWidth = 1.1;
    for (let y = y0 + 3; y < y1; y += 5)
      for (let x = x0; x < x1 + 5; x += 6.5){
        g.beginPath(); g.arc(x + ((Math.round((y - y0) / 5) % 2) ? 3.2 : 0), y, 3.4, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
      }
  } else if (T.tex === 'nep'){                 // vải: nếp rủ dọc
    g.strokeStyle = 'rgba(0,0,0,.26)'; g.lineWidth = 1.3;
    for (let i = 1; i < 5; i++){
      const x = x0 + w * i / 5;
      g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 2.5, y0 + h * 0.5, x, y1); g.stroke();
    }
  } else if (T.tex === 'khau'){                // da: đường khâu
    g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 1; g.setLineDash([2.4, 2.6]);
    for (let i = 1; i < 4; i++){
      const y = y0 + h * i / 4;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    }
    g.setLineDash([]);
  } else if (T.tex === 'la'){                  // lá: gân chéo
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1.1;
    for (let i = 0; i < 5; i++){
      const y = y0 + h * (i + .5) / 5;
      g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y - 4.5, x1, y); g.stroke();
    }
  } else if (T.tex === 'vu'){                  // lông vũ: cung chồng
    g.strokeStyle = 'rgba(255,255,255,.24)'; g.lineWidth = 1.2;
    for (let y = y0 + 4; y < y1; y += 5.5){
      g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 5.5, x1, y); g.stroke();
    }
  } else if (T.tex === 'soc'){                 // nhân sư: sọc ngang đậm nhạt
    for (let i = 0; i < 6; i++){
      g.fillStyle = i % 2 ? 'rgba(0,0,0,.26)' : 'rgba(255,255,255,.14)';
      g.fillRect(x0, y0 + h * i / 6, w, h / 12);
    }
  } else if (T.tex === 'rune'){                // ma thuật: ký tự phát sáng
    g.strokeStyle = M.glow || M.trim; g.lineWidth = 1.2; g.globalAlpha = .85;
    for (let i = 0; i < 4; i++){
      const x = x0 + w * (i + .5) / 4, y = y0 + h * 0.5;
      g.beginPath(); g.moveTo(x - 2.6, y - 3); g.lineTo(x + 2.6, y + 3);
      g.moveTo(x + 2.6, y - 3); g.lineTo(x - 2.6, y + 3); g.stroke();
    }
  } else if (T.tex === 'vien'){                // vương giả: viền kép
    g.strokeStyle = M.trim; g.lineWidth = 1.4;
    g.strokeRect(x0 + 2.5, y0 + 2.5, w - 5, h - 5);
    g.globalAlpha = .5; g.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10);
  } else {                                     // tấm: đường ghép ngang
    g.strokeStyle = 'rgba(0,0,0,.30)'; g.lineWidth = 1.3;
    for (let i = 1; i < 3 + (st >= 3 ? 1 : 0); i++){
      const y = y0 + h * i / (3 + (st >= 3 ? 1 : 0));
      g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 3, x1, y); g.stroke();
    }
  }
  g.restore();
}

// ── MŨ TRỤ ──────────────────────────────────────────────────────────────────────
function iaHelm(g, M, P){
  const st = P.st || 1, T = aTrait(P), style = P.style || 'plate';
  g.translate(0, 3);
  // ĐƯỜNG BAO — khác hẳn nhau theo kiểu, đây mới là thứ đọc được ở cỡ 44px
  const dome = () => {
    g.beginPath();
    if (style === 'cloth' || style === 'arcane'){        // mũ TRÙM có chóp
      g.moveTo(-20, 16);
      g.bezierCurveTo(-23, -12, -14, -26, -3, -34);      // chóp lệch ra sau
      g.bezierCurveTo(6, -28, 21, -12, 20, 16);
    } else if (style === 'sphinx'){                       // khăn nemes: xoè hình thang
      g.moveTo(-25, 18); g.lineTo(-17, -14);
      g.quadraticCurveTo(0, -26, 17, -14); g.lineTo(25, 18);
    } else if (style === 'hide' || style === 'leaf'){     // mũ da thấp
      g.moveTo(-20, 14);
      g.bezierCurveTo(-21, -6, -12, -19, 0, -19);
      g.bezierCurveTo(12, -19, 21, -6, 20, 14);
    } else if (style === 'regal'){                        // vương miện: hở đỉnh
      g.moveTo(-21, 16); g.lineTo(-21, -6); g.lineTo(21, -6); g.lineTo(21, 16);
    } else if (style === 'chain'){                        // khăn lưới trùm cổ
      g.moveTo(-22, 20);
      g.bezierCurveTo(-24, -8, -13, -23, 0, -23);
      g.bezierCurveTo(13, -23, 24, -8, 22, 20);
    } else {                                              // mũ trụ kim loại
      g.moveTo(-21, 14);
      g.bezierCurveTo(-23, -10, -12, -25, 0, -25);
      g.bezierCurveTo(12, -25, 23, -10, 21, 14);
    }
    g.closePath();
  };
  dome();
  g.fillStyle = iGrad(g, -22, -30, 22, 18, M.hi, M.lo); g.fill();
  dome(); aTex(g, M, T, st, -22, -22, 22, 16);
  dome(); g.strokeStyle = 'rgba(0,0,0,.42)'; g.lineWidth = 1.2; g.stroke();

  // KHE MẮT / MẶT — đồ vải thì để hở bóng tối, đồ kim loại thì có khe ngang
  if (T.soft){
    g.fillStyle = 'rgba(6,8,16,.88)';
    g.beginPath(); g.ellipse(0, 4, 11, 9, 0, 0, 7); g.fill();
    if (style === 'arcane'){                              // hai đốm sáng trong bóng tối
      g.fillStyle = M.glow || '#a88aff';
      g.beginPath(); g.arc(-4.5, 3, 1.9, 0, 7); g.arc(4.5, 3, 1.9, 0, 7); g.fill();
    }
  } else if (style === 'regal'){
    g.fillStyle = 'rgba(6,8,16,.55)'; g.fillRect(-16, -2, 32, 9);
  } else {
    iFill(g, [[-14, -3], [14, -3], [12, 5], [-12, 5]], '#0a0c12');
    g.fillStyle = M.lo; g.fillRect(-1.7, -3, 3.4, 8);
    if (P.asym) iFill(g, [[1, -4], [15, -4], [13, 14], [1, 16]], M.hi);  // nửa mặt nạ
  }
  // vành trán
  if (style !== 'regal' && style !== 'arcane'){
    iFill(g, [[-22, -4], [22, -4], [21, -9], [-21, -9]], M.trim);
    if (st >= 2){ iRivet(g, M, -16, -6.5, 1.7); iRivet(g, M, 16, -6.5, 1.7); }
  }
  // MÀO — chữ ký của kiểu
  const C = T.crest;
  if (C === 'sung' && st >= 2){                    // sừng thẳng
    iFill(g, [[-17, -15], [-29, -32], [-21, -13]], M.trim);
    iFill(g, [[17, -15], [29, -32], [21, -13]], M.trim);
  } else if (C === 'vuot'){                        // sừng vuốt ngược
    for (const s of [-1, 1]){
      g.beginPath(); g.moveTo(s * 18, -14);
      g.quadraticCurveTo(s * 34, -20, s * 30, -34);
      g.quadraticCurveTo(s * 26, -22, s * 21, -12); g.closePath();
      g.fillStyle = M.trim; g.fill();
    }
  } else if (C === 'rong'){                        // đầu rồng: sừng cong + mào lửa
    for (const s of [-1, 1]){
      g.beginPath(); g.moveTo(s * 17, -16);
      g.bezierCurveTo(s * 36, -22, s * 40, -40, s * 26, -44);
      g.bezierCurveTo(s * 33, -32, s * 27, -20, s * 20, -13); g.closePath();
      g.fillStyle = M.trim; g.fill();
    }
    g.fillStyle = M.glow || '#ff8a3a';
    for (let i = 0; i < 3; i++){
      const x = -6 + i * 6;
      iPoly(g, [[x - 3, -25], [x, -25 - 9 - i % 2 * 4], [x + 3, -25]]); g.fill();
    }
  } else if (C === 'nemes'){                       // khăn nhân sư: hai vạt buông
    iFill(g, [[-25, 18], [-32, 6], [-24, -6], [-19, 10]], M.trim);
    iFill(g, [[25, 18], [32, 6], [24, -6], [19, 10]], M.trim);
    iFill(g, [[-6, -20], [6, -20], [4, -30], [-4, -30]], M.trim);     // rắn hổ mang
    if (st >= 3) iGem(g, M, 0, -26, 2.6);
  } else if (C === 'cau'){                         // cầu phép lơ lửng trên chóp
    const c = M.glow || '#a88aff';
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5;
    g.fillStyle = c; g.beginPath(); g.arc(-3, -40, 8 + st, 0, 7); g.fill(); g.restore();
    g.fillStyle = c; g.beginPath(); g.arc(-3, -40, 4 + st * 0.5, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-4.4, -41.6, 1.6, 0, 7); g.fill();
  } else if (C === 'la'){                          // vành lá quanh trán
    g.fillStyle = M.trim;
    for (let i = 0; i < 5; i++){
      const a = -Math.PI * (0.2 + i * 0.15);
      g.save(); g.translate(Math.cos(a) * 20, Math.sin(a) * 17 - 2); g.rotate(a + Math.PI / 2);
      g.beginPath(); g.ellipse(0, -5, 3.2, 7.5, 0, 0, 7); g.fill(); g.restore();
    }
  } else if (C === 'canh'){                        // cánh hai bên
    for (const s of [-1, 1]){
      g.save(); g.translate(s * 19, -6); g.scale(s, 1);
      g.fillStyle = M.trim;
      for (let i = 0; i < 3; i++){
        g.beginPath(); g.moveTo(0, 2 - i * 3);
        g.quadraticCurveTo(9 + i * 3, -6 - i * 4, 17 + i * 4, -3 - i * 6);
        g.quadraticCurveTo(8 + i * 2, 1 - i * 3, 0, 4 - i * 3); g.fill();
      }
      g.restore();
    }
  } else if (C === 'vuong'){                       // vương miện: răng nhọn
    const n = 3 + Math.min(2, st - 1);
    for (let i = 0; i < n; i++){
      const x = -18 + i * (36 / (n - 1));
      const h = i === Math.floor(n / 2) ? 20 : 13;
      iFill(g, [[x - 5, -6], [x, -6 - h], [x + 5, -6]], M.trim);
      if (st >= 3) iGem(g, M, x, -10, 1.9);
    }
    iFill(g, [[-22, -2], [22, -2], [21, -8], [-21, -8]], M.trim);
  } else if (C === 'lech' && st >= 2){             // Spellblade: MỘT sừng, lệch hẳn
    iFill(g, [[15, -16], [30, -34], [21, -13]], M.trim);
  }
  if (st >= 4 && C !== 'cau' && C !== 'vuong') iGem(g, M, 0, -13, 2.7);
  iSheenArc(g);
}

// Vệt sáng chéo phủ lên toàn hình — làm mảng phẳng thành bề mặt cong.
function iSheenArc(g){
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16;
  g.fillStyle = iGrad(g, -30, -30, 6, 20, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  g.beginPath(); g.arc(0, 0, 46, 0, 7); g.fill();
  g.restore();
}

// ── ÁO GIÁP ─────────────────────────────────────────────────────────────────────
function iaArmor(g, M, P){
  const st = P.st || 1, T = aTrait(P), style = P.style || 'plate';
  g.translate(0, 2);
  const body = () => {
    g.beginPath();
    if (T.soft){                                   // ÁO CHOÀNG: buông xuống, loe ra
      g.moveTo(-14, -20); g.lineTo(14, -20);
      g.bezierCurveTo(20, -2, 24, 14, 26, 26);
      g.lineTo(-26, 26);
      g.bezierCurveTo(-24, 14, -20, -2, -14, -20);
    } else if (style === 'chain'){                 // ÁO LƯỚI: bo tròn, không có góc
      g.moveTo(-16, -20);
      g.bezierCurveTo(-21, -4, -20, 12, -14, 24);
      g.lineTo(14, 24);
      g.bezierCurveTo(20, 12, 21, -4, 16, -20);
    } else if (style === 'regal'){                 // ÁO CHOÀNG NGHI LỄ: cổ cao, tà dài
      g.moveTo(-16, -24); g.lineTo(16, -24);
      g.lineTo(20, -4); g.lineTo(15, 27); g.lineTo(-15, 27); g.lineTo(-20, -4);
    } else {                                       // GIÁP TẤM
      g.moveTo(-17, -20); g.lineTo(-20, -6); g.lineTo(-14, 16);
      g.lineTo(-9, 25); g.lineTo(9, 25); g.lineTo(14, 16); g.lineTo(20, -6); g.lineTo(17, -20);
    }
    g.closePath();
  };
  body(); g.fillStyle = iGrad(g, -22, -22, 22, 26, M.hi, M.lo); g.fill();
  body(); aTex(g, M, T, st, -24, -20, 24, 26);
  body(); g.strokeStyle = 'rgba(0,0,0,.40)'; g.lineWidth = 1.2; g.stroke();
  // cổ áo
  if (style === 'regal'){                          // cổ dựng cao hai bên
    iFill(g, [[-16, -24], [-7, -22], [-9, -32], [-17, -30]], M.trim);
    iFill(g, [[16, -24], [7, -22], [9, -32], [17, -30]], M.trim);
    iFill(g, [[-7, -22], [7, -22], [4, -12], [-4, -12]], '#0a0c12');
  } else {
    iFill(g, [[-8, -21], [8, -21], [5, -12], [0, -9], [-5, -12]], '#0a0c12');
  }
  // đai / dây chằng
  if (T.soft){
    iFill(g, [[-16, 4], [16, 4], [15, 11], [-15, 11]], M.trim);
    if (st >= 3) iGem(g, M, 0, 7.5, 3);
  } else {
    g.strokeStyle = M.trim; g.lineWidth = 1.7;
    g.beginPath(); g.moveTo(-16, -4); g.quadraticCurveTo(0, 3, 16, -4); g.stroke();
  }
  // VAI — chữ ký lớn nhất của kiểu
  const pw = 9 + st * 1.9;
  const shoulder = (sd) => {
    g.save(); g.translate(sd * 15, -17); g.scale(sd, 1);
    if (T.soft && style !== 'arcane'){              // tay áo vải rủ
      g.beginPath(); g.moveTo(-4, -4);
      g.quadraticCurveTo(pw * 0.9, -6, pw * 1.05, 6);
      g.quadraticCurveTo(pw * 0.8, 16, -3, 12); g.closePath();
      g.fillStyle = iGrad(g, 0, -6, 0, 14, M.hi, M.lo); g.fill();
    } else if (style === 'arcane'){                 // phiến đá lơ lửng, KHÔNG chạm vai
      const c = M.glow || '#a88aff';
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35;
      g.fillStyle = c; g.beginPath(); g.arc(pw * 0.6, -2, 8, 0, 7); g.fill(); g.restore();
      iFill(g, [[pw * 0.25, -8], [pw * 1.05, -4], [pw * 0.85, 6], [pw * 0.15, 2]], M.trim);
    } else if (style === 'plume'){                  // lớp lông vũ xếp
      g.fillStyle = M.trim;
      for (let i = 0; i < 3; i++){
        g.beginPath(); g.moveTo(-3, 6 - i * 3);
        g.quadraticCurveTo(pw * 0.7, -2 - i * 4, pw * 1.1 + i * 2, 2 - i * 5);
        g.quadraticCurveTo(pw * 0.6, 6 - i * 2, -3, 9 - i * 3); g.fill();
      }
    } else {                                        // tấm vai kim loại
      g.beginPath();
      g.moveTo(-5, 9); g.quadraticCurveTo(-7, -6, 3, -8);
      g.quadraticCurveTo(pw, -7, pw + 1, 8);
      g.quadraticCurveTo(pw * 0.5, 12, -5, 9); g.closePath();
      g.fillStyle = iGrad(g, 0, -8, 0, 10, M.hi, M.lo); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.30)'; g.lineWidth = .9; g.stroke();
      if (st >= 3){ g.strokeStyle = M.trim; g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(-3, 3); g.quadraticCurveTo(pw * 0.5, -4, pw * 0.9, 4); g.stroke(); }
      if (st >= 4 && (style === 'drake' || style === 'hoalong' || style === 'plate'))
        iFill(g, [[pw * 0.45, -7], [pw * 0.75, -18], [pw * 0.95, -4]], M.trim);   // gai
    }
    g.restore();
  };
  if (T.asym){ shoulder(1); iFill(g, [[-17, -19], [-9, -20], [-11, -8], [-18, -6]], M.lo); }  // MỘT bên trần
  else { shoulder(-1); shoulder(1); }
  if (st >= 2 && !T.soft){ iRivet(g, M, -13, -14, 1.8); iRivet(g, M, 13, -14, 1.8); }
  if (st >= 4) iGem(g, M, 0, -3, 3.2);
  iSheenArc(g);
}

// ── GĂNG TAY ────────────────────────────────────────────────────────────────────
function iaGloves(g, M, P){
  const st = P.st || 1, T = aTrait(P), style = P.style || 'plate';
  g.save(); g.rotate(-0.1); g.translate(1, 4);
  const fl = [13, 15.5, 14.5, 11.5];
  for (let i = 0; i < 4; i++){
    const x = -10.5 + i * 7;
    // đồ vải/da: ngón NGẮN, hở đầu ngón — đồ kim loại: ngón dài kín
    const cut = T.soft ? 6 : 0;
    const top = -12 - fl[i] + cut;
    g.fillStyle = i % 2 ? M.lo : M.hi;
    g.beginPath();
    g.moveTo(x - 2.9, -8); g.lineTo(x - 2.5, top + 3);
    if (T.soft) g.lineTo(x + 2.5, top + 3);
    else g.quadraticCurveTo(x, top - 1.5, x + 2.5, top + 3);
    g.lineTo(x + 2.9, -8); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 0.9; g.stroke();
    if (st >= 2 && !T.soft){ g.strokeStyle = M.trim; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(x - 2.6, top + 8); g.lineTo(x + 2.6, top + 8); g.stroke(); }
  }
  g.save(); g.translate(-13, -4); g.rotate(-0.55);
  g.fillStyle = M.hi;
  g.beginPath(); g.moveTo(-3.2, 6); g.lineTo(-2.8, -6);
  g.quadraticCurveTo(0, -9.5, 2.8, -6); g.lineTo(3.2, 6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 0.9; g.stroke();
  g.restore();
  const hand = () => {
    g.beginPath();
    g.moveTo(-11, 12); g.lineTo(11, 12);
    g.lineTo(14, -4); g.quadraticCurveTo(14.5, -10, 12, -11);
    g.lineTo(-12, -11); g.quadraticCurveTo(-14.5, -10, -14, -4);
    g.closePath();
  };
  hand(); g.fillStyle = iGrad(g, -14, -11, 14, 12, M.hi, M.lo); g.fill();
  hand(); aTex(g, M, T, st, -14, -11, 14, 12);
  hand(); g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 1.1; g.stroke();
  if (st >= 4) iGem(g, M, 0, 1, 3);
  // CỔ TAY — kim loại thì loe cứng, vải thì quấn dây
  if (T.soft){
    iFill(g, [[-13, 11], [13, 11], [12, 26], [-12, 26]], iGrad(g, -13, 11, 13, 26, M.hi, M.lo));
    g.strokeStyle = M.trim; g.lineWidth = 1.8;
    for (let i = 0; i < 3; i++){ const y = 14 + i * 4;
      g.beginPath(); g.moveTo(-12.5, y); g.lineTo(12.5, y + 1.4); g.stroke(); }
  } else {
    iFill(g, [[-14, 11], [14, 11], [15.5, 18], [-15.5, 18]], M.trim);
    iFill(g, [[-13, 18], [13, 18], [11.5, 27], [-11.5, 27]], iGrad(g, -13, 18, 13, 27, M.hi, M.lo));
    if (st >= 3){ iRivet(g, M, -8, 14.5, 1.6); iRivet(g, M, 8, 14.5, 1.6); }
    if (st >= 5) iFill(g, [[-15.5, 14], [-25, 8], [-15, 20]], M.trim);
  }
  if (style === 'plume' && st >= 3){                 // lông vũ mọc từ cổ tay
    g.fillStyle = M.trim;
    for (let i = 0; i < 3; i++){
      g.beginPath(); g.moveTo(13, 14 + i * 3);
      g.quadraticCurveTo(24 + i * 3, 8 + i * 2, 28 + i * 4, 14 + i * 4);
      g.quadraticCurveTo(22, 16 + i * 3, 13, 17 + i * 3); g.fill();
    }
  }
  g.restore();
  iSheenArc(g);
}

// ── GIÁP ĐÙI ────────────────────────────────────────────────────────────────────
function iaPants(g, M, P){
  const st = P.st || 1, T = aTrait(P), style = P.style || 'plate';
  g.translate(0, 2);
  // đai
  iFill(g, [[-20, -22], [20, -22], [19, -13], [-19, -13]], iGrad(g, -20, -22, 20, -13, M.hi, M.lo));
  iFill(g, [[-7, -24], [7, -24], [6, -11], [-6, -11]], M.trim);
  if (st >= 4) iGem(g, M, 0, -17.5, 3);
  if (T.soft || style === 'regal'){
    // VÁY GIÁP: một khối loe, không tách hai ống
    const skirt = () => { g.beginPath();
      g.moveTo(-17, -13); g.lineTo(17, -13);
      g.bezierCurveTo(23, 4, 26, 18, 27, 28);
      g.lineTo(-27, 28);
      g.bezierCurveTo(-26, 18, -23, 4, -17, -13); g.closePath(); };
    skirt(); g.fillStyle = iGrad(g, -24, -13, 24, 28, M.hi, M.lo); g.fill();
    skirt(); aTex(g, M, T, st, -26, -13, 26, 28);
    skirt(); g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 1.1; g.stroke();
    if (st >= 3){                                   // dải rủ trước
      iFill(g, [[-5, -12], [5, -12], [4, 27], [-4, 27]], M.trim);
      if (style === 'leaf'){ g.fillStyle = M.trim;
        for (let i = 0; i < 3; i++){ g.beginPath();
          g.ellipse(0, 0 + i * 9, 4, 7, 0, 0, 7); g.fill(); } }
    }
  } else {
    // HAI TẤM ĐÙI rời
    for (const sd of [-1, 1]){
      g.save(); g.translate(sd * 10, -12);
      const th = () => { g.beginPath();
        g.moveTo(-8, 0); g.lineTo(8, 0);
        g.bezierCurveTo(10, 14, 7, 26, 0, 30);
        g.bezierCurveTo(-7, 26, -10, 14, -8, 0); g.closePath(); };
      th(); g.fillStyle = iGrad(g, -8, 0, 8, 30, M.hi, M.lo); g.fill();
      th(); aTex(g, M, T, st, -9, 0, 9, 30);
      th(); g.strokeStyle = 'rgba(0,0,0,.36)'; g.lineWidth = 1; g.stroke();
      if (st >= 2) iRivet(g, M, 0, 2.5, 1.7);
      if (st >= 5) iFill(g, [[sd * 8, 6], [sd * 15, 2], [sd * 8, 12]], M.trim);
      g.restore();
    }
  }
  iSheenArc(g);
}

// ── ỦNG ─────────────────────────────────────────────────────────────────────────
function iaBoots(g, M, P){
  const st = P.st || 1, T = aTrait(P), style = P.style || 'plate';
  for (const sd of [-1, 1]){
    g.save(); g.translate(sd * 11, 0); g.rotate(sd * 0.06);
    const shaft = () => { g.beginPath();
      if (T.soft){                                  // giày mềm: ống thấp, bo tròn
        g.moveTo(-8, -14); g.quadraticCurveTo(-9, -4, -7, 6);
        g.lineTo(7, 6); g.quadraticCurveTo(9, -4, 8, -14); g.closePath();
      } else {
        g.moveTo(-8, -24); g.lineTo(8, -24); g.lineTo(7, 6); g.lineTo(-7, 6); g.closePath();
      }
    };
    shaft(); g.fillStyle = iGrad(g, -8, -24, 8, 6, M.hi, M.lo); g.fill();
    shaft(); aTex(g, M, T, st, -8, T.soft ? -14 : -24, 8, 6);
    shaft(); g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 1; g.stroke();
    // vành ống
    if (T.soft) iFill(g, [[-9, -16], [9, -16], [8.5, -10], [-8.5, -10]], M.trim);
    else iFill(g, [[-9.5, -26], [9.5, -26], [9, -19], [-9, -19]], M.trim);
    // bàn chân
    g.beginPath();
    g.moveTo(-7, 4); g.lineTo(7, 4);
    g.lineTo(sd > 0 ? 15 : 9, 16); g.lineTo(sd > 0 ? 13 : 7, 21);
    g.lineTo(-9, 21); g.closePath();
    g.fillStyle = iGrad(g, -7, 4, 10, 21, M.hi, M.lo); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.36)'; g.lineWidth = 1; g.stroke();
    iFill(g, [[-9.5, 20], [sd > 0 ? 13.5 : 7.5, 20], [sd > 0 ? 13 : 7, 24], [-9, 24]], M.lo);
    if (st >= 2 && !T.soft){ g.strokeStyle = M.trim; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(-7, -8); g.lineTo(7, -8); g.stroke(); }
    if (T.soft && st >= 2){                          // dây buộc chéo
      g.strokeStyle = M.trim; g.lineWidth = 1.4;
      for (let i = 0; i < 3; i++){ const y = -10 + i * 5;
        g.beginPath(); g.moveTo(-7, y); g.lineTo(7, y + 3); g.stroke(); }
    }
    if (st >= 3 && !T.soft) iRivet(g, M, 0, -13, 1.6);
    if (style === 'plume' && st >= 3){                // cánh cổ chân
      g.fillStyle = M.trim;
      for (let i = 0; i < 3; i++){
        g.beginPath(); g.moveTo(-8, -18 + i * 3);
        g.quadraticCurveTo(-19 - i * 3, -24 - i * 3, -24 - i * 4, -18 - i * 4);
        g.quadraticCurveTo(-16, -16 - i * 2, -8, -15 + i * 3); g.fill();
      }
    } else if (st >= 4 && !T.soft) iFill(g, [[-8, -22], [-15, -30], [-7, -27]], M.trim);
    if (st >= 5) iGem(g, M, 0, -2, 2.4);
    g.restore();
  }
  iSheenArc(g);
}

// ── PHỤ KIỆN: nhẫn — dùng chung mọi lớp ─────────────────────────────────────────
function iaRing(g, M, P){
  const st = P.st || 1;
  g.save(); g.translate(0, 6);
  const bw2 = 6 + st * 0.9;                 // bề dày vành
  // Vành phải KÍN. Bản đầu vẽ một cung hở nên ra hình móng ngựa, không ai đọc là nhẫn.
  g.save(); g.scale(1, 0.94);
  g.lineWidth = bw2;
  g.strokeStyle = iGrad(g, 0, -24, 0, 24, M.hi, M.lo);
  g.beginPath(); g.arc(0, 0, 20, 0, 7); g.stroke();
  g.lineWidth = bw2 * 0.34; g.strokeStyle = 'rgba(255,255,255,.34)';
  g.beginPath(); g.arc(0, 0, 20 + bw2 * 0.28, Math.PI * 0.62, Math.PI * 1.28); g.stroke();
  g.lineWidth = bw2 * 0.30; g.strokeStyle = 'rgba(0,0,0,.30)';
  g.beginPath(); g.arc(0, 0, 20 - bw2 * 0.30, Math.PI * 1.62, Math.PI * 0.28); g.stroke();
  g.restore();
  // ổ nạm ngồi TRÊN vành
  iFill(g, [[-9, -18], [9, -18], [7, -27], [-7, -27]], M.trim);
  if (st >= 3){ iFill(g, [[-9, -19], [-17, -25], [-8, -25]], M.trim);
                iFill(g, [[9, -19], [17, -25], [8, -25]], M.trim); }
  iGem(g, M, 0, -25, 4.6 + st * 0.55);
  if (st >= 4){ iRivet(g, M, -15, -11, 1.5); iRivet(g, M, 15, -11, 1.5); }
  g.restore();
  iSheenArc(g);
}
// ── PHỤ KIỆN: dây chuyền — hai nhánh, NHÌN LÀ BIẾT ──────────────────────────────
// Nhánh vật lý đeo NANH kim loại; nhánh phép đeo CẦU pha lê. Phân biệt bằng bóng dáng
// chứ không bằng màu — ở cỡ 44px trong ô túi, màu là thứ mất trước tiên.
function iChain(g, M, st){
  g.strokeStyle = M.lo; g.lineWidth = 3.4;
  g.beginPath(); g.moveTo(-19, -30); g.quadraticCurveTo(-13, -6, 0, -2); g.stroke();
  g.beginPath(); g.moveTo(19, -30); g.quadraticCurveTo(13, -6, 0, -2); g.stroke();
  g.strokeStyle = M.hi; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(-19, -30); g.quadraticCurveTo(-13, -7, -1, -3); g.stroke();
  if (st >= 2){                              // mắt xích thấy rõ ở nấc cao
    for (let i = 1; i <= 3; i++){
      const t = i / 4, x = -19 + (19) * t, y = -30 + 28 * t * t;
      iRivet(g, M, x, y, 1.5); iRivet(g, M, -x, y, 1.5);
    }
  }
}
function iaPendPhys(g, M, P){
  const st = P.st || 1;
  iChain(g, M, st);
  // nanh: khối nhọn xuống, có sống giữa
  iFill(g, [[-9, -3], [9, -3], [5, 20], [0, 30], [-5, 20]], iGrad(g, -9, -3, 9, 30, M.hi, M.lo));
  iFill(g, [[-2.4, 0], [2.4, 0], [1.4, 18], [0, 26], [-1.4, 18]], M.lo);
  // gông cổ nanh
  iFill(g, [[-11, -8], [11, -8], [10, -1], [-10, -1]], M.trim);
  if (st >= 3){ iFill(g, [[-11, -6], [-19, -11], [-10, -12]], M.trim);
                iFill(g, [[11, -6], [19, -11], [10, -12]], M.trim); }
  if (st >= 2) iGem(g, M, 0, -4.5, 2.6 + st * 0.25);
  if (st >= 5){ g.strokeStyle = M.trim; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-6, 6); g.lineTo(6, 6); g.stroke(); }
  iSheenArc(g);
}
function iaPendMagic(g, M, P){
  const st = P.st || 1;
  iChain(g, M, st);
  // gọng ôm cầu
  g.strokeStyle = M.trim; g.lineWidth = 3;
  g.beginPath(); g.arc(0, 11, 13.5, -0.85 * Math.PI, -0.15 * Math.PI); g.stroke();
  iFill(g, [[-6, -8], [6, -8], [5, -2], [-5, -2]], M.trim);
  // cầu pha lê
  const c = M.glow || M.trim;
  const rr = 9 + st * 0.7;
  const gr = g.createRadialGradient(-rr*0.3, 11 - rr*0.35, 1, 0, 11, rr);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, c); gr.addColorStop(1, M.lo);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 11, rr, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 11, rr, 0, 7); g.stroke();
  if (st >= 3){                               // vành xoay quanh cầu
    g.strokeStyle = M.trim; g.lineWidth = 1.6;
    g.save(); g.translate(0, 11); g.scale(1, 0.34);
    g.beginPath(); g.arc(0, 0, rr + 5, 0, 7); g.stroke();
    g.restore();
  }
  if (st >= 5){ g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45;
    g.fillStyle = c; g.beginPath(); g.arc(0, 11, rr + 6, 0, 7); g.fill(); g.restore(); }
  iSheenArc(g);
}

const ITEM_ART = {
  weapon: iaWeapon, staff: iaStaff, bow: iaBow, crossbow: iaCrossbow, helm: iaHelm, armor: iaArmor, gloves: iaGloves, pants: iaPants, boots: iaBoots,
  ring: iaRing, pendPhys: iaPendPhys, pendMagic: iaPendMagic,
};

// Vẽ trọn một icon: nền theo phẩm → hình món → hào quang cường hoá.
function drawItemIcon(g, def, tier, rarity, plus){
  const M = itemPal(def, tier);
  const R = RARITIES[Math.max(0, Math.min(4, rarity || 0))];
  g.save();
  g.translate(ICON_PX / 2, ICON_PX / 2);
  g.scale(ICON_PX / 100, ICON_PX / 100);
  // nền: quầng màu phẩm — cùng ngôn ngữ màu với viền ô túi, để nhìn là biết phẩm
  const bg = g.createRadialGradient(0, 0, 4, 0, 0, 50);
  bg.addColorStop(0, R.color + '38'); bg.addColorStop(1, R.color + '00');
  g.fillStyle = bg; g.fillRect(-50, -50, 100, 100);
  // ── CƯỜNG HOÁ +0 → +11 ──────────────────────────────────────────────────────
  // Mốc NHẢY vẫn theo MU (+4 / +7 / +10) nhưng trong mỗi mốc phải LEO LIÊN TỤC. Bản đầu chỉ
  // đổi ở đúng 3 mốc: rèn từ +7 lên +9 là cả một chặng dài, tốn Tu La và có thể tụt cấp, mà
  // icon không đổi một điểm ảnh nào. Đo được: +5 +6 +8 +9 +11 đều ra 0px khác biệt.
  const pl = plus || 0;
  const st = plusStage(pl);
  const k = clamp((pl - 3) / 8, 0, 1);            // 0 tại +3 → 1 tại +11, chạy liên tục
  const fn = ITEM_ART[def.art] || iaWeapon;
  const GC = M.glow || '#ffe9a8';
  const gl = { lo: GC, hi: GC, trim: GC, glow: null };
  if (st >= 1){                                   // 1. quầng sau lưng — to dần, đậm dần
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.05 + k * 0.17;
    g.scale(1.10 + k * 0.12, 1.10 + k * 0.12);
    fn(g, gl, def);
    g.restore();
  }
  g.save(); fn(g, M, def); g.restore();
  if (st >= 2){                                   // 2. viền sáng ôm sát — mốc +7 phải KHÁC mốc +4
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.10 + k * 0.22;
    g.scale(1.035, 1.035); fn(g, gl, def);
    g.restore();
  }
  if (st >= 3){                                   // 3. tàn lửa quanh món — chỉ +10 trở lên
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = GC;
    const n = 4 + Math.round((pl - 9) * 2);
    for (let i = 0; i < n; i++){
      const a = (i / n) * Math.PI * 2 + pl * 0.3, r = 32 + (i % 3) * 5;
      g.globalAlpha = 0.35 + (i % 2) * 0.25;
      g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r * 0.9, 1.5 + (i % 2) * 0.9, 0, 7); g.fill();
    }
    g.restore();
  }
  g.restore();
}
// data-URL có cache. Khoá gồm mọi thứ đổi hình: món, giai, phẩm, mức rèn.
function itemArtUrl(def, tier, rarity, plus){
  const key = `${def.art}|${def.blade||''}|${def.guard||''}|${def.pommel||''}|${def.motif||''}|${def.shaft||''}|${def.head||''}|${def.limb||''}`
            + `|${def.w||''}|${def.len||''}|${def.gw||''}|${def.st || 1}|${def.mat||''}|${def.tintKey || ''}`
            + `|${tier}|${rarity}|${plus || 0}`;
  let u = _itemArtCache.get(key);
  if (u) return u;
  const c = document.createElement('canvas');
  c.width = ICON_PX; c.height = ICON_PX;
  drawItemIcon(c.getContext('2d'), def, tier, rarity, plus);
  u = c.toDataURL();
  _itemArtCache.set(key, u);
  return u;
}

// ═══════════════ DANH MỤC TRANG BỊ — 220 món ═══════════════
// Mỗi món là một DÒNG DỮ LIỆU, hình vẽ suy ra từ tổ hợp bộ phận. Không có hàm vẽ riêng cho
// từng món, nên thêm món mới = thêm một dòng.
//
// Khoá lớp: `sect` khác null nghĩa là CHỈ lớp đó dùng được. Vũ khí và giáp đều khoá; dây
// chuyền và nhẫn thì không (MU cũng vậy).
// `lv` = cấp yêu cầu, suy từ dải: 1 / 21 / 41 / 61 / 81.
const BAND_LV = [1, 21, 41, 61, 81];
const BAND_TIER = [1, 3, 5, 7, 10];
const ITEM_DB = {};
function regItem(d){ ITEM_DB[d.id] = d; return d; }

// ── GIÁP: 25 bộ × 5 ô, sinh thẳng từ HERO_SETS ───────────────────────────────
// Nhờ sinh từ đó mà hình trong túi và hình trên người dùng CHUNG một nguồn — không có cách
// nào lệch nhau, kể cả khi sau này đổi bảng màu bộ.
const ARMOR_PIECES = [
  { slot:'non',  art:'helm',   pre:'Mũ Trụ' },
  { slot:'ao',   art:'armor',  pre:'Giáp' },
  { slot:'tay',  art:'gloves', pre:'Găng' },
  { slot:'quan', art:'pants',  pre:'Giáp Đùi' },
  { slot:'chan', art:'boots',  pre:'Ủng' },
];
for (const sect in HERO_SETS){
  HERO_SETS[sect].forEach((sd, band) => {
    for (const pc of ARMOR_PIECES){
      regItem({
        id: `${sect}_${band}_${pc.slot}`, kind:'armor', sect, band,
        slot: pc.slot, art: pc.art, style: sd.style, tint: sd.tint || null,
        tintKey: `${sect}${band}`, st: band + 1,
        lv: BAND_LV[band], tier: BAND_TIER[band],
        name: `${pc.pre} ${sd.name}`, setName: sd.name,
      });
    }
  });
}

// ── VŨ KHÍ: 5 lớp × 3 dòng × 5 nấc = 75 ──────────────────────────────────────
// Viết theo DÒNG + đè theo nấc, thay vì 75 dòng đầy đủ: đọc ra ngay dòng nào leo thế nào.
const WEAPON_LINES = [
  // ══ Dark Knight — cận chiến nặng ══
  { sect:'thieulam', line:'kiem', slot:'vukhi', desc:'cân bằng',
    base:{ art:'weapon', blade:'thang', guard:'thanh', pommel:'tron', motif:'khong', w:5.4, len:-42, gw:14 },
    t:[ ['Kiếm Đồng',       { mat:'dong', big:0.88, len:-36, gw:12 }],
        ['Kiếm Sắt',        { mat:'sat' }],
        ['Trọng Kiếm Thép', { mat:'thep', guard:'quat', w:6.0, len:-44 }],
        ['Kiếm Vảy Rồng',   { mat:'rong', guard:'vuot', motif:'gai', pommel:'da' }],
        ['Kiếm Hỏa Long',   { mat:'lua',  guard:'vuot', motif:'lua', pommel:'gai', big:1.07 }] ] },
  { sect:'thieulam', line:'riu', slot:'vukhi', desc:'sát thương cao, chậm',
    base:{ art:'weapon', blade:'riu', guard:'khong', pommel:'tron', motif:'khong', w:5.0, len:-40, gw:10 },
    t:[ ['Rìu Thợ Rừng',   { mat:'dong', big:0.9 }],
        ['Rìu Chiến',      { mat:'sat' }],
        ['Rìu Song Nguyệt',{ mat:'thep', w:5.6 }],
        ['Rìu Vảy Rồng',   { mat:'rong', motif:'gai', big:1.06 }],
        ['Rìu Hỏa Long',   { mat:'lua',  motif:'lua', pommel:'gai', big:1.12 }] ] },
  { sect:'thieulam', line:'chuy', slot:'vukhi', desc:'phá giáp',
    base:{ art:'weapon', blade:'chuy', guard:'khong', pommel:'tron', motif:'khong', w:4.6, len:-38, gw:10 },
    t:[ ['Chùy Đinh',      { mat:'dong', big:0.9 }],
        ['Chùy Gai',       { mat:'sat' }],
        ['Chùy Thép Nặng', { mat:'thep', w:5.2 }],
        ['Chùy Vảy Rồng',  { mat:'rong', motif:'gai' }],
        ['Chùy Hỏa Long',  { mat:'lua',  motif:'lua', pommel:'gai', big:1.1 }] ] },

  // ══ Dark Wizard — gậy, đánh xa ══
  { sect:'baidasan', line:'gay', slot:'vukhi', desc:'sát thương phép',
    base:{ art:'staff', shaft:'thang', head:'cau', len:-30 },
    t:[ ['Gậy Gỗ',        { mat:'xuong', big:0.9 }],
        ['Gậy Xương',     { mat:'xuong', shaft:'xuong' }],
        ['Gậy Nhân Sư',   { mat:'vang',  shaft:'dot' }],
        ['Gậy Ma Thuật',  { mat:'ma',    shaft:'xoan', len:-32 }],
        ['Gậy Hư Vô',     { mat:'ma',    shaft:'xoan', head:'tinhthe', len:-32, big:1.06 }] ] },
  { sect:'baidasan', line:'quyentruong', slot:'vukhi', desc:'tốc niệm',
    base:{ art:'staff', shaft:'dot', head:'vong', len:-30 },
    t:[ ['Trượng Đồng',    { mat:'dong', big:0.9 }],
        ['Trượng Bạc',     { mat:'thep' }],
        ['Trượng Pha Lê',  { mat:'bang', head:'canh' }],
        ['Trượng Ma Thuật',{ mat:'ma',   head:'canh', len:-32 }],
        ['Trượng Hư Vô',   { mat:'ma',   head:'canh', shaft:'xoan', len:-32, big:1.06 }] ] },
  { sect:'baidasan', line:'tinhtruong', slot:'vukhi', desc:'bạo kích',
    base:{ art:'staff', shaft:'xuong', head:'so', len:-30 },
    t:[ ['Trượng Đá Lửa',  { mat:'lua',  big:0.9, head:'cau' }],
        ['Trượng Rắn',     { mat:'xuong' }],
        ['Trượng Mắt Quỷ', { mat:'hacKim' }],
        ['Trượng Tinh Vân',{ mat:'ma',   head:'tinhthe', len:-32 }],
        ['Trượng Hắc Nguyệt',{ mat:'hacKim', head:'tinhthe', shaft:'xoan', len:-32, big:1.06 }] ] },

  // ══ Sylvan Ranger — cung/nỏ ══
  { sect:'toanchan', line:'cungngan', slot:'vukhi', desc:'bắn nhanh',
    base:{ art:'bow', limb:'cong' },
    t:[ ['Cung Gỗ',       { mat:'xuong', big:0.9 }],
        ['Cung Sừng',     { mat:'xuong' }],
        ['Cung Vỏ Sồi',   { mat:'thep' }],
        ['Cung Lông Ưng', { mat:'bang' }],
        ['Cung Đại Bàng', { mat:'vang', big:1.06 }] ] },
  { sect:'toanchan', line:'truongcung', slot:'vukhi', desc:'tầm xa',
    base:{ art:'bow', limb:'dai' },
    t:[ ['Trường Cung Thô',      { mat:'dong', big:0.92 }],
        ['Trường Cung Thép',     { mat:'sat' }],
        ['Trường Cung Bạc',      { mat:'thep' }],
        ['Trường Cung Lông Ưng', { mat:'bang' }],
        ['Trường Cung Bạch Vũ',  { mat:'vang', big:1.08 }] ] },
  { sect:'toanchan', line:'no', slot:'vukhi', desc:'nặng, xuyên giáp',
    base:{ art:'crossbow' },
    t:[ ['Nỏ Tay',      { mat:'dong', big:0.88 }],
        ['Nỏ Chiến',    { mat:'sat' }],
        ['Nỏ Thép',     { mat:'thep' }],
        ['Nỏ Ưng Vương',{ mat:'hacKim' }],
        ['Nỏ Bạch Vũ',  { mat:'vang', big:1.08 }] ] },

  // ══ Spellblade — kiếm lai phép ══
  { sect:'minhgiao', line:'songdao', slot:'vukhi', desc:'nhanh',
    base:{ art:'weapon', blade:'cong', guard:'canh', pommel:'tron', motif:'khong', w:5.2, len:-40, gw:13 },
    t:[ ['Song Đao Thô',       { mat:'sat', big:0.9 }],
        ['Song Đao Sắt',       { mat:'sat' }],
        ['Song Đao Than Hồng', { mat:'lua', motif:'lua' }],
        ['Song Đao Lửa Dữ',    { mat:'lua', motif:'lua', pommel:'gai' }],
        ['Song Đao Hoả Ngục',  { mat:'lua', motif:'lua', guard:'vuot', pommel:'gai', big:1.06 }] ] },
  { sect:'minhgiao', line:'daikiem', slot:'vukhi', desc:'nặng',
    base:{ art:'weapon', blade:'daikiem', guard:'thanh', pommel:'vuot', motif:'khong', w:5.4, len:-44, gw:16 },
    t:[ ['Đại Kiếm Sắt',    { mat:'sat', big:0.94 }],
        ['Đại Kiếm Thép',   { mat:'thep' }],
        ['Đại Kiếm Nung Đỏ',{ mat:'lua', motif:'lua' }],
        ['Đại Kiếm Lửa Dữ', { mat:'lua', motif:'lua', motifX:1 }],
        ['Đại Kiếm Hoả Ngục',{ mat:'lua', motif:'lua', pommel:'gai', big:1.16 }] ] },
  { sect:'minhgiao', line:'makiem', slot:'vukhi', desc:'lai phép',
    base:{ art:'weapon', blade:'song', guard:'canh', pommel:'da', motif:'runes', w:5.4, len:-43, gw:14 },
    t:[ ['Kiếm Khắc Ấn',   { mat:'sat', big:0.92 }],
        ['Kiếm Bùa Chú',   { mat:'thep' }],
        ['Kiếm Tro Tàn',   { mat:'hacKim' }],
        ['Ma Kiếm Lửa Dữ', { mat:'lua', motif:'mach' }],
        ['Ma Kiếm Hoả Ngục',{ mat:'lua', motif:'mach', pommel:'vuot', big:1.06 }] ] },

  // ══ Dark Lord — nghi lễ, chỉ huy ══
  { sect:'bug', line:'lenhtruong', slot:'vukhi', desc:'chỉ huy',
    base:{ art:'staff', shaft:'dot', head:'vong', len:-30 },
    t:[ ['Lệnh Trượng Gỗ',       { mat:'xuong', big:0.9 }],
        ['Lệnh Trượng Đồng',     { mat:'dong' }],
        ['Lệnh Trượng Vương Giả',{ mat:'vang' }],
        ['Lệnh Trượng Bạo Chúa', { mat:'vang', head:'vuot', len:-32 }],
        ['Lệnh Trượng Ngai Đen', { mat:'hacKim', head:'vuot', shaft:'xoan', len:-32, big:1.06 }] ] },
  { sect:'bug', line:'bua', slot:'vukhi', desc:'nặng',
    base:{ art:'weapon', blade:'chuy', guard:'khong', pommel:'tron', motif:'khong', w:4.8, len:-38, gw:10 },
    t:[ ['Búa Nghi Lễ',   { mat:'dong', big:0.9 }],
        ['Búa Cận Vệ',    { mat:'sat' }],
        ['Búa Vương Triều',{ mat:'vang', w:5.4 }],
        ['Búa Bạo Chúa',  { mat:'vang', motif:'runes' }],
        ['Búa Ngai Đen',  { mat:'hacKim', motif:'runes', pommel:'gai', big:1.12 }] ] },
  { sect:'bug', line:'kich', slot:'vukhi', desc:'tầm với',
    base:{ art:'staff', shaft:'thang', head:'liem', len:-32 },
    t:[ ['Kích Ngắn',       { mat:'sat', big:0.9, len:-28 }],
        ['Kích Cận Vệ',     { mat:'sat' }],
        ['Kích Vương Triều',{ mat:'vang' }],
        ['Kích Bạo Chúa',   { mat:'vang', shaft:'dot' }],
        ['Kích Ngai Đen',   { mat:'hacKim', shaft:'xoan', big:1.08 }] ] },
];
for (const L of WEAPON_LINES){
  L.t.forEach(([name, over], band) => {
    regItem(Object.assign({
      id: `${L.sect}_${L.line}_${band}`, kind:'weapon', sect: L.sect, line: L.line, band,
      slot: L.slot, st: band + 1, lv: BAND_LV[band], tier: BAND_TIER[band], name, desc: L.desc,
      tintKey: `${L.sect}${L.line}${band}`,
    }, L.base, over));
  });
}

// ── PHỤ KIỆN: 20 món, KHÔNG khoá lớp ─────────────────────────────────────────
// Dây chuyền chia hai nhánh VẬT LÝ / PHÉP — phân biệt bằng bóng dáng (nanh vs cầu pha lê),
// không bằng màu: ở 44px trong ô túi thì màu là thứ mất trước tiên.
const ACC_LINES = [
  { slot:'daychuyen', line:'phys', art:'pendPhys', branch:'phys',
    names:['Dây Chuyền Nanh Đồng','Dây Chuyền Nanh Sắt','Dây Chuyền Nanh Thép','Dây Chuyền Nanh Rồng','Dây Chuyền Nanh Hắc Nguyệt'],
    mats:['dong','sat','thep','rong','hacKim'] },
  { slot:'daychuyen', line:'magic', art:'pendMagic', branch:'magic',
    names:['Dây Chuyền Ngọc Lam','Dây Chuyền Ngọc Bích','Dây Chuyền Pha Lê','Dây Chuyền Ma Thuật','Dây Chuyền Tinh Vân'],
    mats:['dong','thep','bang','ma','ma'] },
  { slot:'nhan1', line:'r1', art:'ring',
    names:['Nhẫn Đồng','Nhẫn Bạc','Nhẫn Ngọc Lục','Nhẫn Hắc Kim','Nhẫn Tinh Vân'],
    mats:['dong','thep','bang','hacKim','ma'] },
  { slot:'nhan2', line:'r2', art:'ring',
    names:['Nhẫn Thô Sơ','Nhẫn Chạm Khắc','Nhẫn Cổ Ngữ','Nhẫn Phong Ấn','Nhẫn Vĩnh Hằng'],
    mats:['sat','dong','vang','ma','vang'] },
];
for (const A of ACC_LINES){
  A.names.forEach((name, band) => {
    regItem({
      id: `acc_${A.slot}_${A.line}_${band}`, kind:'acc', sect:null, band,
      slot: A.slot, art: A.art, branch: A.branch || null, mat: A.mats[band],
      st: band + 1, lv: BAND_LV[band], tier: BAND_TIER[band], name,
      tintKey: `acc${A.line}${band}`,
    });
  });
}

// ── Tra cứu ──────────────────────────────────────────────────────────────────
const ITEM_BY_SLOT = {};
for (const id in ITEM_DB){
  const d = ITEM_DB[id];
  (ITEM_BY_SLOT[d.slot] = ITEM_BY_SLOT[d.slot] || []).push(d);
}
// Món hợp lệ cho một ô + một lớp + một dải. Đây là chỗ DUY NHẤT biết luật khoá lớp.
function itemDefsFor(slot, sect, band){
  const all = ITEM_BY_SLOT[slot] || [];
  return all.filter(d => (d.sect === null || d.sect === sect) && (band === undefined || d.band === band));
}
function pickItemDef(slot, sect, band){
  const c = itemDefsFor(slot, sect, band);
  return c.length ? c[Math.floor(Math.random() * c.length)] : null;
}
// Lớp này có dùng được món đó không — dùng cho cả khoá mặc đồ lẫn câu giải thích.
// Lớp này mặc được món này không. Khoá cứng kiểu MU: kiếm chỉ Dark Knight, gậy chỉ Dark
// Wizard, cung chỉ Sylvan Ranger. Dây chuyền và nhẫn thì ai cũng đeo được.
function itemUsable(it){
  const d = itemDef(it);
  return !d || !d.sect || d.sect === (player && player.sect);
}
// Câu giải thích cho người chơi — món không mặc được thì phải NÓI RÕ vì sao, đừng im lặng.
function itemLockMsg(it){
  const d = itemDef(it);
  if (!d || !d.sect) return '';
  const sc = SECTS[d.sect];
  return `${it.name} — chỉ ${sc ? sc.name : d.sect} dùng được`;
}
// 10 giai trải đều lên 5 dải: giai 1-2 → dải I, 3-4 → II, 5-6 → III, 7-8 → IV, 9-10 → V.
function bandOfTier(t){ return clamp(Math.ceil((t || 1) / 2) - 1, 0, 4); }
function itemDef(it){ return it && it.def ? ITEM_DB[it.def] : null; }
// Gắn định nghĩa + TÊN theo danh mục. Lớp quyết định món nào rơi ra được: vũ khí và giáp đều
// khoá lớp, nên nhặt được đồ lớp khác là chuyện cố ý (bán, hoặc ném vào Lò Hỗn Loạn).
function assignDef(it, sect){
  const d = pickItemDef(it.slot, sect || (player && player.sect) || 'vophai', bandOfTier(it.tier));
  if (!d) return it;
  it.def = d.id;
  it.name = (it.perfect ? 'Hoàn Hảo ' : '') + d.name;
  return it;
}

function slotIcon(it, cls){
  // Món có định nghĩa → vẽ bằng bộ phận. 11 file PNG cũ chỉ còn phục vụ đồ đặc biệt
  // (cánh, áo choàng, pet) và save cũ chưa có def.
  let _d = itemDef(it);
  // Cổ Thần nhuộm theo màu BỘ CỔ THẦN, không theo bộ giáp của lớp: đó là thứ khiến người ta
  // nhận ra món Cổ Thần từ xa trong túi.
  if (_d && it.ancient && ANCIENT_SETS[it.ancient]){
    const ac = ANCIENT_SETS[it.ancient].color;
    _d = Object.assign({}, _d, { tint: { lo: ac, hi: _lift(ac, 0.34), trim: _lift(ac, 0.62), glow: ac },
                                 tintKey: 'anc' + it.ancient });
  }
  if (_d){
    const rc = (it.rarity != null && !it.special) ? ' ic-r' + it.rarity : '';
    const bd = it.tier ? `<i class="ic-giai">${['I','II','III','IV','V','VI','VII','VIII','IX','X'][clamp(it.tier-1,0,9)]}</i>` : '';
    return `<span class="item-ic${rc}"><img class="${cls||'slot-icon'}" src="${itemArtUrl(_d, it.tier || 1, it.rarity || 0, it.plus || 0)}" alt="">${bd}</span>`;
  }
  const f = SLOT_ICONS[it.slot] || 'vukhi';
  // Drop v2.0: viền màu theo phẩm, xoay màu theo giai, huy hiệu số giai góc trái
  const hue = it.tier ? (it.tier-1)*22 : 0;
  const rcls = (it.rarity != null && !it.special) ? ' ic-r' + it.rarity : '';
  const badge = it.tier ? `<i class="ic-giai">${['I','II','III','IV','V','VI','VII','VIII','IX','X'][clamp(it.tier-1,0,9)]}</i>` : '';
  return `<span class="item-ic${rcls}"><img class="${cls||'slot-icon'}" style="filter:hue-rotate(${hue}deg)" src="assets/items/${f}.png" onerror="this.style.display='none'" alt="">${badge}</span>`;
}

// ---------- Trang Bị (override): lưới paperdoll 12 ô, kéo-thả từ Túi Đồ để mặc ----------
function renderInv(){
  let html = `<h3>Trang Bị — 12 Ô chuẩn GDD</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div class="stat-sec">ĐANG MẶC — bấm để tháo, hoặc kéo đồ từ Túi Đồ thả đúng ô <button class="mini-btn" style="float:right" onclick="autoEquipBest()">⚡ Mặc Đồ Tốt Nhất</button></div>`;
  html += `<div class="eq-grid">`;
  for (const row of EQUIP_GRID){
    for (const slotId of row){
      const sl = SLOTS.find(s=>s.id===slotId);
      const it = player.equip[slotId];
      html += `<div class="eq-slot${it?' filled':''}" ${it ? `data-tip="eq:${slotId}"` : ''} aria-label="${it ? it.name + (it.plus?' +'+it.plus:'') : sl.name}"
        onclick="unequip('${slotId}')"
        ondragover="onEquipSlotDragOver(event,'${slotId}')"
        ondragenter="onEquipSlotDragEnter(event,'${slotId}')" ondragleave="this.classList.remove('drag-over')"
        ondrop="this.classList.remove('drag-over'); onEquipSlotDrop(event,'${slotId}')">
        ${it ? slotIcon(it,'') + `<span class="eq-plus">${it.plus?'+'+it.plus:''}</span>` : `<span class="eq-empty">${sl.name}</span>`}
      </div>`;
    }
  }
  html += `</div>`;
  // Khối CHI TIẾT cũ chép nguyên đoạn chỉ số của CẢ 12 ô ra thành 12 đoạn văn dài — nay thẻ
  // rê chuột đã nói đủ, giữ lại chỉ còn là nói lại lần thứ hai. Chỉ để một dòng gọn mỗi ô cho
  // điện thoại (không có con trỏ nên không rê được).
  const _worn = SLOTS.filter(sl => player.equip[sl.id]);
  if (_worn.length){
    html += `<div class="stat-sec" style="margin-top:10px">ĐANG MẶC (${_worn.length}/${SLOTS.length})</div><div class="eq-list">`;
    for (const sl of _worn){
      const it = player.equip[sl.id], r = RARITIES[it.rarity] || RARITIES[0];
      const mn = it.main ? ` · ${it.main.name} ${Math.round(it.main.v * (1 + it.plus * 0.08))}` : '';
      html += `<div class="eq-li" data-tip="eq:${sl.id}" onclick="unequip('${sl.id}')">
        <b style="color:${it.special ? '#7ecbff' : r.color}">${it.name}${it.plus ? ' +' + it.plus : ''}</b><span>${sl.name}${mn}</span></div>`;
    }
    html += `</div>`;
  } else html += `<div style="opacity:.5;font-size:12px;padding:8px">Chưa mặc món nào — kéo đồ từ Túi Đồ vào ô tương ứng ở trên.</div>`;
  el('panel-inv').innerHTML = html;
}
// Kéo-thả: đồ trong Túi Đồ → ô Trang Bị tương ứng (thay thế/bổ sung cho click-to-equip).
// Dùng 1 biến toàn cục đơn giản thay vì tin vào dataTransfer.getData trong dragover (một số trình
// duyệt chặn đọc dữ liệu cho tới sự kiện drop) — đủ dùng vì chỉ có 1 thao tác kéo diễn ra cùng lúc.
window._dragBagIdx = -1;
window.onBagItemDragStart = function(e, i){
  window._dragBagIdx = i;
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', String(i)); } catch { /* một số trình duyệt kén định dạng — bỏ qua, đã có _dragBagIdx */ }
};
window.onEquipSlotDragOver = function(e, slotId){
  const it = player.inv[window._dragBagIdx];
  if (it && it.slot === slotId) e.preventDefault(); // preventDefault = cho phép thả; sai loại thì giữ con trỏ "cấm"
};
window.onEquipSlotDragEnter = function(e, slotId){
  const it = player.inv[window._dragBagIdx];
  if (it && it.slot === slotId) e.currentTarget.classList.add('drag-over');
};
window.onEquipSlotDrop = function(e, slotId){
  e.preventDefault();
  const i = window._dragBagIdx; window._dragBagIdx = -1;
  const it = player.inv[i];
  if (!it || it.slot !== slotId) return;
  equipItem(i);
};

// ---------- Túi Đồ: lưới item có hình + vật liệu ----------
window.bagSel = -1;
const MAT_ROWS = [
  { icon:'huyenthiet', name:'Huyền Thiết', get:()=>player.mat, color:'#9fd0ff', desc:'rèn +1~+11' },
  { icon:'tula', name:'Tu La Tinh Thạch', get:()=>player.gems.tuLa, color:'#e84a6a', desc:'rèn +7 trở lên · Áo Choàng' },
  { icon:'honnguyen', name:'Hỗn Nguyên Thạch', get:()=>player.gems.honNguyen, color:'#b08ae8', desc:'rèn +10/+11 · Áo Choàng' },
  { icon:'tiendan', name:'Tiến Cấp Đan', get:()=>player.tienDan, color:'#7ec850', desc:'Tấn Chức' },
  { icon:'phongphu', name:'Phong Linh Phù', get:()=>player.phongphu || 0, color:'#b08ae8', desc:'thu phục linh thú — bấm T' },
  { icon:'phu', name:'Thiên Mệnh Phù', get:()=>player.charms, color:'#7ecbff', desc:'bảo hiểm rèn' },
  { icon:'tanquyen', name:'Mảnh Cổ Thư (Thượng/Trung/Hạ)', get:()=>player.bikip ? player.bikip.pieces.join('/') : '0/0/0', color:'#e84a6a', desc:'dung hợp Huyết Ma Thôn Phệ' },
  { icon:'manhtrangbi', name:'Mảnh Trang Bị', get:()=>(player.mats&&player.mats.manh)||0, color:'#7ec8d8', desc:'Tấn Phẩm & Kế Thừa — rơi từ quái/tinh anh' },
  { icon:'tichma', name:'Tịch Ma Thạch', get:()=>(player.mats&&player.mats.tichMa)||0, color:'#e84a6a', desc:'đá lõi ấn — Tấn Phẩm Linh→Thần→Chí Tôn, rơi từ Vệ Binh Trụ' },
  { icon:'antranai', name:'Ấn Cổng Vực', get:()=>(player.mats&&player.mats.anTranAi)||0, color:'#ffb15c', desc:'vé lên Chí Tôn — Chinh Phạt Cổng Vực 1 lần/ngày' },
  { icon:'manhcothan', name:'Mảnh Cổ Thần', get:()=>(player.mats&&player.mats.manhCoThan)||0, color:'#7ecbff', desc:'×60 đổi Bảo Hạp Cổ Thần chọn bộ (Lò Rèn)' },
];
function fmtCount(n){
  n = n || 0;
  if (n >= 1000000) return (n/1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
  if (n >= 10000) return Math.floor(n/1000) + 'K';
  return String(n);
}
function matTip(name, desc, val){
  const t = desc ? `${name} — ${desc}\n${val}` : `${name}\n${val}`;
  return t.replace(/"/g, '&quot;');
}
// Túi đồ chia TAB. Trước đây nó xếp NĂM kho khác nhau vào một cuộn dọc — vật liệu, tứ châu,
// bảo hạp, nội đan, rồi mới tới trang bị — nên thứ người ta mở túi để xem lại nằm cuối cùng,
// phải cuộn qua hơn một màn hình mới thấy. Nay trang bị đứng đầu và mặc định.
const BAG_TABS = [
  { id:'gear', name:'Trang Bị' },
  { id:'mat',  name:'Vật Liệu' },
  { id:'box',  name:'Bảo Hạp' },
];
window.bagTab = 'gear';
window.setBagTab = function(t){ window.bagTab = t; renderBag(); };

function bagSecGear(){
  // Một hàng duy nhất. Bản cũ có hàng tuỳ chọn RỒI thêm một dòng chú thích giải nghĩa ▲ ◆ 🔒
  // dài hai dòng — cả ba ký hiệu đó nay thẻ rê chuột đều nói rõ, chú thích thành thừa.
  let h = `<div class="bag-bar">
    <label><input type="checkbox" ${player.autoSell?'checked':''} onchange="window.toggleAutoSell(this.checked)"> Tự bán trắng/lục</label>
    <label><input type="checkbox" ${player.autoEquip?'checked':''} onchange="window.toggleAutoEquip(this.checked)"> Tự mặc đồ mạnh</label>
    <button class="mini-btn" onclick="autoEquipBest()">⚡ Mặc Đồ Tốt Nhất</button>
    <i class="bag-tip">bấm ô = mặc · <b>⋯</b> = bán / phân giải</i></div>`;
  if (!player.inv.length) return h + `<div class="chaos-empty">Túi trống — hãy đi farm quái!</div>`;
  h += `<div class="bag-grid">`;
  player.inv.forEach((it, i) => {
    const _eq2 = player.equip[it.slot], _bp2 = _eq2 ? itemPower(_eq2) : 0;
    const _lock = !it.special && !itemUsable(it);
    const _up = !it.special && !_lock && player.level >= itemReqLv(it) && itemPower(it) > _bp2;
    // ◆ vàng: món mang về Khắc Ấn CHƯA có. Đứng riêng với ▲ vì đây là thứ mũi ▲ (thuần lực
    // chiến) không bao giờ thấy — món yếu hơn vẫn có thể đáng mặc chỉ vì cái Khắc Ấn này.
    const _sg = !it.special && !_lock && player.level >= itemReqLv(it) && itemSigilNew(it);
    const tip = _lock ? itemLockMsg(it)
      : `${it.name} — bấm để MẶC NGAY, hoặc kéo thả vào ô Trang Bị${_up ? ' (mạnh hơn đang mặc!)' : ''}${_sg ? ` · ◆ Khắc Ấn mới: ${SIGIL_DEFS[_sg].name}` : ''}`;
    h += `<div class="bag-cell rar-${it.rarity}${_lock?' locked':''}" draggable="true"
      ondragstart="onBagItemDragStart(event,${i})" onclick="equipItem(${i})" data-tip="inv:${i}" aria-label="${tip}">
      ${slotIcon(it, '')}<span class="bc-plus">${it.plus?'+'+it.plus:''}</span>
      ${_up ? '<i class="bc-up">▲</i>' : ''}${_sg ? '<i class="bc-sg">◆</i>' : ''}${_lock ? '<i class="bc-lock">🔒</i>' : ''}
      <i class="bc-more" onclick="event.stopPropagation();window.selectBagItem(${i})">⋯</i></div>`;
  });
  h += `</div>`;
  if (window.bagSel >= 0 && player.inv[window.bagSel]){
    const it = player.inv[window.bagSel];
    // Chỉ tên + nút. Chỉ số và so sánh đã nằm trong thẻ rê chuột ngay trên ô — in lại ở đây
    // là đẩy người chơi cuộn xuống hết lưới 30 ô để đọc thứ vừa thấy.
    h += `<div class="bag-act"><b class="${RARITIES[it.rarity].cls}">${it.name}${it.plus?' +'+it.plus:''}</b></div>
      <div class="forge-actions"><button class="mini-btn" onclick="equipItem(${window.bagSel})">Mặc Vào</button>
      <button class="mini-btn" onclick="sellItem(${window.bagSel})">Bán (+${itemSellPrice(it)}◈)</button>
      <button class="mini-btn" onclick="salvage(${window.bagSel});window.bagSel=-1">Phân Giải (+${(1+it.rarity+Math.floor(it.plus/3)) * (!it.special && !itemUsable(it) ? 2 : 1)}✦)</button></div>`;
  }
  return h;
}
function bagSecMat(){
  let h = `<div class="chaos-sec">VẬT LIỆU QUÝ <span class="chaos-sub">di chuột vào ô để xem công dụng</span></div><div class="mat-grid">`;
  for (const r of MAT_ROWS){
    const v = r.get();
    h += `<div class="mat-cell" title="${matTip(r.name, r.desc, v)}">
      <img src="assets/items/mat_${r.icon}.png" onerror="this.style.display='none'" alt="">
      <span class="mc-count" style="color:${r.color}">${fmtCount(v)}</span></div>`;
  }
  h += `<div class="mat-cell" title="${matTip('Bạc', 'tiêu xài khắp Lunacia', player.silver)}">
    <img src="assets/items/mat_bac.png" onerror="this.style.display='none'" alt="">
    <span class="mc-count" style="color:#7ecbff">${fmtCount(player.silver)}</span></div>`;
  h += `<div class="mat-cell" title="${matTip('Công Huân Lệnh', 'Truy Nã Lệnh mỗi ngày · quay Sảnh Cầu May', player.congHuan||0)}">
    <span class="mc-glyph">🎖</span>
    <span class="mc-count" style="color:#ffb15c">${fmtCount(player.congHuan||0)}</span></div></div>`;
  const jw = player.jewels || {};
  h += `<div class="chaos-sec">TỨ CHÂU <span class="chaos-sub">bỏ vào khay ở Lò Hỗn Độn</span></div><div class="mat-grid">`;
  for (const jk of ['chucPhuc','linhHon','sinhMenh','honDon']){
    h += `<div class="mat-cell" title="${matTip(JEWEL_NAMES[jk], '', jw[jk]||0)}">
      <span class="mc-glyph" style="color:${JEWEL_COLORS[jk]}">◆</span>
      <span class="mc-count" style="color:${JEWEL_COLORS[jk]}">${fmtCount(jw[jk]||0)}</span></div>`;
  }
  return h + `</div>`;
}
function bagSecBox(){
  const bh = player.baohap || {};
  const bhTiers = Object.keys(bh).filter(t => bh[t] > 0);
  let h = `<div class="chaos-sec">BẢO HẠP <span class="chaos-sub">Hung Thần Giáng Thế</span></div>`;
  if (!bhTiers.length) h += `<div class="chaos-empty">Chưa có Bảo Hạp nào — săn Hung Thần hoặc quái Xâm Lăng Vàng.</div>`;
  for (const t of bhTiers){
    const d = BAOHAP_TIERS[t];
    h += `<div class="inv-item"><span class="s-name"><b style="color:${d.color}">${d.name}</b> ×${bh[t]}<br>
      <span class="item-tip">LV${d.min}-${d.max === 999 ? '100+' : d.max} · trang bị cao cấp${d.ancient ? ` · <b style="color:#3ac88a">Cổ Thần ${Math.round(d.ancient*100)}%</b>` : ''} · châu quý</span></span>
      <span><button class="mini-btn" onclick="openBaoHap(${t})">Mở Hạp</button></span></div>`;
  }
  const ndUsed = ndToday();
  h += `<div class="chaos-sec">NỘI ĐAN YÊU THÚ <span class="chaos-sub">hôm nay còn ${Math.max(0, 3-ndUsed)}/3 lần</span></div>`;
  for (const el2 of ['Kim','Mộc','Thổ','Thủy','Hỏa']){
    const cnt = (player.noidan && player.noidan[el2]) || 0;
    const nh = ELEM[el2], ef = ND_EFFECT[el2];
    h += `<div class="mat-row"><span style="color:${nh.color};width:20px;text-align:center;font-size:13px">${nh.glyph}</span>
      <span style="flex:1">Nội Đan ${elName(el2)} <span style="opacity:.55;font-size:11px">— ${ef.desc}</span></span>
      <b style="color:${nh.color};margin-right:8px">${cnt}</b>
      <button class="mini-btn" ${cnt > 0 && ndUsed < 3 ? '' : 'disabled'} onclick="swallowNoidan('${el2}')">Thôn Phệ</button></div>`;
  }
  return h;
}
function renderBag(){
  const T = window.bagTab || 'gear';
  let html = `<h3>Túi Đồ (${player.inv.length}/30)</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div class="chaos-tabs">`;
  for (const t of BAG_TABS){
    // đếm ngay trên tab: khỏi phải mở từng cái xem có gì mới
    const n = t.id === 'gear' ? player.inv.length
            : t.id === 'box'  ? Object.values(player.baohap || {}).reduce((a, b) => a + b, 0)
            : Object.values(player.jewels || {}).reduce((a, b) => a + b, 0);
    html += `<button class="chaos-tab${T===t.id?' on':''}" onclick="setBagTab('${t.id}')">${t.name}${n?` <i>${n}</i>`:''}</button>`;
  }
  html += `</div>`;
  html += T === 'mat' ? bagSecMat() : T === 'box' ? bagSecBox() : bagSecGear();
  el('panel-bag').innerHTML = html;
}
window.selectBagItem = function(i){ window.bagSel = (window.bagSel === i) ? -1 : i; renderBag(); };
window.toggleAutoSell = function(v){ player.autoSell = v; saveGame(); };
// hành động túi đồ → refresh cả 2 panel (override)
window.equipItem = function(i){
  const it = player.inv[i];
  if (!it) return;
  if (player.level < itemReqLv(it)){
    addFloat(player.x, player.y-30, `Cần LV${itemReqLv(it)} để mặc ${it.name}!`, '#ff7a6a', 13);
    return;
  }
  if (!itemUsable(it)){
    addFloat(player.x, player.y-30, `🔒 ${itemLockMsg(it)}`, '#ff9a6a', 13);
    AudioSys.sfx('ui', 0.4);
    return;
  }
  player.inv.splice(i,1);
  if (player.equip[it.slot]) player.inv.push(player.equip[it.slot]);
  player.equip[it.slot] = it;
  window.bagSel = -1;
  calcDerived(); refreshEqPanels(); saveGame();
};
window.unequip = function(slotId){
  const it = player.equip[slotId];
  if (!it || player.inv.length>=30) return;
  player.equip[slotId] = null; player.inv.push(it);
  calcDerived(); refreshEqPanels(); saveGame();
};
window.salvage = function(i){
  const it = player.inv[i];
  if (!it) return;
  // Khoá lớp nghĩa là 4/5 số vũ khí nhặt được là đồ vô dụng. Phân giải ×2 biến chúng thành
  // nguyên liệu thật, chứ không phải rác phải bấm bán từng món.
  const wrong = !it.special && !itemUsable(it);
  const gain = (1 + it.rarity + Math.floor(it.plus/3)) * (wrong ? 2 : 1);
  player.mat += gain;
  player.inv.splice(i,1);
  addFloat(player.x, player.y-30, `Phân giải +${gain}✦${wrong ? ' (đồ khác lớp ×2)' : ''}`, '#9fd0ff', 12);
  refreshEqPanels(); saveGame();
};

// ---------- Bản Đồ thế giới ----------
// ---------- Kỹ Năng: 3 ô cố định (chính/phụ/buff) + tab Tuyệt Học Cũ (thông tin, không bấm được) ----------
// Giang Hồ (võ học tự do liên phái) + Dung Hợp đã bị cắt cùng đợt MU-hoá — mọi chiêu giờ đều
// thuộc riêng 1 trong 5 lớp, không còn nội dung nào cho tab này nữa nên bỏ luôn.
const SKILL_TABS = [
  { id:'active', name:'⚔ Kỹ Năng' },
  { id:'legacy', name:'✦ Tuyệt Học Cũ' },
];
// Chiêu nào thì tay vung kiểu nào — để tư thế nhân vật khớp với VFX đang bung ra.
// (Meteor rơi từ trời xuống thì phải GIƠ trượng lên, không thể chĩa ngang.)
function heroCastAct(id, d){
  const sk = player.sect;
  if (d.kind === 'sectTP') return heroActOf(sk, 'tp');
  if (d.kind === 'gangkhi' || d.type === 'buff' || d.type === 'passive') return heroActOf(sk, 'buff');
  if (d.kind === 'bow' || d.kind === 'amkhi' || d.kind === 'danchi')
    return heroActOf(sk, 'basic') === 'shoot' ? 'shoot' : 'point';
  if (d.kind === 'tieuhon') return heroActOf(sk, 'tp');
  if (d.kind === 'vh'){                       // chiêu Tuyệt Học: theo loại của chính nó
    const v = VOHOC_DEFS[id] || {};
    if (v.type === 'buff' || v.type === 'passive') return heroActOf(sk, 'buff');
    if (v.type === 'aoe') return heroActOf(sk, 'tp');
    if (v.type === 'cone') return heroActOf(sk, 'a');
    return heroActOf(sk, 'basic') === 'shoot' ? 'shoot' : 'point';
  }
  // còn lại là sectA — 4 loại theo lớp
  const t = (SECTS[sk] && SECTS[sk].skillA && SECTS[sk].skillA.type) || 'cone';
  if (t === 'proj') return heroActOf(sk, 'basic') === 'shoot' ? 'shoot' : 'point';
  if (t === 'selfaoe' || t === 'dash') return heroActOf(sk, 'tp');
  return heroActOf(sk, 'a');
}
window.skillTab = window.skillTab || 'active';
window.switchSkillTab = function(t){ window.skillTab = t; renderSkillPanel(); };
// 3 ô cố định (chính/phụ/buff — xem defaultSkillBar()): không còn gán/gỡ, chỉ hiện thông tin + nâng cấp.
function equippedSkillRowHtml(id, roleLabel){
  const info = skillInfo(id);
  return `<div class="skill-row${info.unlocked?'':' locked'}">
    <img src="${info.icon}" onerror="this.outerHTML='<span class=\\'sk-glyph\\'>${id==='a'?'⚔':id==='tp'?'⚔':'✚'}</span>'" alt="">
    <span class="sk-info"><b style="color:${info.unlocked?'#7ecbff':'#8a8a8a'}">${roleLabel} — ${info.name}</b>
      <span style="font-size:10.5px;opacity:.6"> · ${info.qi}Qi · ${effCd(id, info.cd).toFixed(1)}s</span>
      <div class="sk-desc">${info.unlocked ? info.desc : '🔒 ' + info.lockTxt}</div></span>
    <span class="assign-btns">${info.unlocked ? upBtnHtml(id) : ''}</span></div>`;
}
// Tuyệt Học Cũ (chiêu môn phái không còn trong taskbar): thông tin + % Công Kích vĩnh viễn nó cộng.
// Chiêu của chính lớp mình tự ngộ theo cấp (vhAutoLearn); chiêu NGOẠI LỚP mua bằng Sách Kỹ Năng —
// đây là đường tiêu duy nhất của tiền tệ đó (xem learnVohocUI).
function legacySkillRowHtml(_vid){
  const _v = VOHOC_DEFS[_vid], _t = VH_TIER[_v.tier];
  const learned = vhLearned(_vid), pct = LEGACY_TIER_PCT[_v.tier] || 0;
  let right;
  if (learned) right = `<span style="font-size:11px;color:#a0ffe9">+${pct}% ST ✓</span>`;
  else if (crossClassLearnable(_vid)){
    const _c = VH_TIER[_v.tier].cost, _can = player.level >= _v.unlock && (player.bikipVH || 0) >= _c;
    right = `<button class="mini-btn vh-learn-btn" ${_can?'':'disabled'} title="${player.level < _v.unlock ? 'Cần cấp ' + _v.unlock : 'Học tuyệt học ngoại Lớp — +' + pct + '% Công Kích vĩnh viễn'}" onclick="window.learnVohocUI('${_vid}')">Học · ${_c}📜</button>`;
  } else right = `<span style="font-size:10.5px;opacity:.5">🔒 Lv${_v.unlock}</span>`;
  return `<div class="skill-row${learned?'':' locked'}">
    <img src="${_v.icon}" onerror="this.style.display='none'" alt="">
    <span class="sk-info"><b style="color:${learned?_t.color:'#8a8a8a'}">${_v.name}</b>
      <span style="font-size:10px;color:${_t.color}"> · ${_v.cat}</span>
      <div class="sk-desc">${_v.desc}</div></span>
    ${right}</div>`;
}
// 4 hệ Tấn Chức phụ (Ám Khí/Đạn Chỉ/Linh Tiễn/Tiêu Hồn) — vẫn giữ nguyên điều kiện đầu tư cũ, chỉ đổi
// từ "chiêu bấm được" thành "% Công Kích vĩnh viễn" khi đủ điều kiện.
function legacyUniversalRowHtml(id){
  const info = skillInfo(id), pct = LEGACY_UNIVERSAL_PCT[id] || 0;
  const right = info.unlocked ? `<span style="font-size:11px;color:#a0ffe9">+${pct}% ST ✓</span>` : `<span style="font-size:10.5px;opacity:.5">🔒 ${info.lockTxt}</span>`;
  return `<div class="skill-row${info.unlocked?'':' locked'}">
    <img src="${info.icon}" onerror="this.outerHTML='<span class=\\'sk-glyph\\'>${id==='amkhi'?'☾':id==='bow'?'↗':id==='danchi'?'●':'✦'}</span>'" alt="">
    <span class="sk-info"><b style="color:${info.unlocked?'#7ecbff':'#8a8a8a'}">${info.name}</b>
      <div class="sk-desc">${info.desc}</div></span>
    ${right}</div>`;
}
function renderSkillPanel(){
  vhAutoLearn(); // save cũ / test mode: quét tự ngộ võ học phái
  let html = `<h3>Kỹ Năng — 3 ô cố định (phím 1-3)</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:10.5px;color:#9aa8d4;line-height:1.5;margin-bottom:8px">⬆ +2,5%ST/cấp (bạc) · mốc 20/40/60/80/100/120 thêm buff · <b style="color:#7df9ff">40/80/120 ⚡Tiến Hóa</b> · 💠 Tâm Đắc <b>${player.tamdac || 0}</b> · <span style="color:#7fd8e0">Instinct <b>${Math.floor(player.khi || 0).toLocaleString()}</b></span> · ⌨ Space: <b>${(player.spaceSkill && skillInfo(player.spaceSkill)) ? skillInfo(player.spaceSkill).name : 'đánh thường'}</b></div>`;
  html += `<div class="char-tabs">`;
  for (const t of SKILL_TABS) html += `<button class="${t.id===window.skillTab?'active':''}" onclick="switchSkillTab('${t.id}')">${t.name}</button>`;
  html += `</div>`;

  if (window.skillTab === 'active'){
    html += `<div class="stat-sec">${SECTS[player.sect].name} — 1 chính · 1 phụ · 1 buff</div>`;
    html += equippedSkillRowHtml('a', 'Chính');
    html += equippedSkillRowHtml('tp', 'Phụ');
    const buffId = BUFF_SKILL_ID[player.sect];
    html += buffId ? equippedSkillRowHtml(buffId, 'Buff')
      : `<div style="font-size:11px;color:#9aa8d4;padding:8px 4px">Chưa gia nhập lớp nào — trả lời The Calling ở cấp 10 để mở khoá bộ 3 chiêu riêng.</div>`;
    html += `<div class="stat-sec">BỊ ĐỘNG — tự kích hoạt, không cần gán</div>`;
    for (const ps of PASSIVE_SKILLS){
      const on = ps.req();
      html += `<div class="skill-row${on?'':' locked'}"><span class="sk-glyph">✚</span>
        <span class="sk-info"><b style="color:${on?'#a0ffe9':'#8a8a8a'}">${ps.name}</b>
        <div class="sk-desc">${on ? ps.desc : '🔒 chưa đạt điều kiện'}</div></span></div>`;
    }
  } else {
    html += `<div style="font-size:11px;color:#9aa8d4;padding:2px 4px 8px">Taskbar chỉ còn 3 ô, nhưng các chiêu dưới đây không hề mất giá trị — tự động dồn thành % Công Kích vĩnh viễn (hiện <b style="color:#ffd76a">+${(player.legacyAtkPct||0).toFixed(1)}%</b>), không cần bấm nút hay học Bí Kíp nữa.</div>`;
    html += `<div class="stat-sec">TUYỆT HỌC MÔN PHÁI — ${SECTS[player.sect].name}</div>`;
    const own = LEGACY_SECT_SKILLS.filter(sid => VOHOC_DEFS[sid] && VOHOC_DEFS[sid].phai === player.sect);
    html += own.length ? own.map(legacySkillRowHtml).join('') : `<div style="font-size:11px;color:#9aa8d4;padding:8px 4px">Chưa gia nhập lớp nào — trả lời The Calling ở cấp 10.</div>`;
    // Tuyệt học NGOẠI LỚP: mua bằng Sách Kỹ Năng (đường tiêu duy nhất của tiền tệ đó), hoặc nhận
    // sạch miễn phí khi Thăng Tiên — và khi đó chúng ĐANG cộng %ST thật, nên bắt buộc phải hiện ra,
    // nếu không phần thưởng endgame lớn nhất trông như chẳng có tác dụng gì (xem calcDerived()).
    const _cross = LEGACY_SECT_SKILLS.filter(sid => crossClassLearnable(sid));
    if (_cross.length){
      html += `<div class="stat-sec">TUYỆT HỌC NGOẠI LỚP — 📜 Sách Kỹ Năng: <b style="color:#ffb15c">${player.bikipVH || 0}</b></div>`;
      html += `<div style="font-size:11px;color:#9aa8d4;padding:0 4px 6px">Rơi từ tinh anh/boss & Vực Thẳm. Học xong cộng thẳng %ST vĩnh viễn — Thăng Tiên sẽ mở sạch số còn lại.</div>`;
      html += _cross.map(legacySkillRowHtml).join('');
    }
    html += `<div class="stat-sec">HỆ TẤN CHỨC PHỤ</div>`;
    for (const id of ['amkhi','danchi','bow','tieuhon']) html += legacyUniversalRowHtml(id);
  }
  el('panel-skill').innerHTML = html;
}

// ---------- Tấn Chức (override): mọi kỹ năng qua SKILL_DEFS ----------
function castSkill(id){
  if (!player || dead || id == null) return;
  if (id === 'b') id = 'amkhi'; if (id === 'c') id = 'tp'; // legacy alias
  const d = SKILL_DEFS[id]; if (!d) return;
  const info = skillInfo(id);
  const _sm = skMile(id), _se = skEvoMult(id), _qiNeed = Math.max(1, Math.round(info.qi * _sm.qi * _se.qi)); // GDD Đợt 2 B6: mốc 80 −12% Nội Lực · Tiến Hóa Bá/Tốc
  const _st = evoStage(id); // bậc tiến hóa chiêu (Lv 40/80/120)
  if (!info.unlocked){ addFloat(player.x, player.y-34, info.lockTxt, '#8a8a8a', 12); return; }
  if ((player.cd[id] || 0) > 0) return;
  // LIÊN TRẢM: trong cửa sổ 2.5s, chiêu kế tiếp theo miễn phí Nội Lực (ám khí không ăn cửa sổ)
  const _ltFree = (player.ltT || 0) > 0 && id !== 'amkhi';
  if (!_ltFree){
    if (player.qi < _qiNeed){ addFloat(player.x, player.y-34, 'Không đủ Qi!', '#7fa8e0', 12); return; }
    player.qi -= _qiNeed;
  } else addFloat(player.x, player.y-48, '⚡ Liên Trảm — miễn phí Qi!', '#ffd76a', 12);
  player.cd[id] = info.cd * (player.vhCdMult || 1) * _sm.cd * _se.cd * skCdScale(id); // mốc 40 −10% · Tẩy Tủy −30% · cấp chiêu −0,25%/cấp (tối đa −30%) · nhánh Tốc Chiến
  if (vhShout(id, d)) SkillVoice.speak(id); // hô tên chiêu (Quan thoại)
  const _atk0 = player.atk; player.atk = Math.round(player.atk * skLvMult(id) * _sm.dmg * _se.dmg); // GDD Đợt 2 B6: mốc ST nhân dồn · nhánh Bá Đạo // cấp kỹ năng 1-120: +2.5% ST mỗi cấp
  player.comboT = 3; // mở/duy trì chuỗi combo — ám khí trúng trong lúc này sẽ kích Liên Trảm
  player.castT = 0.38; // animation tung tuyệt chiêu
  player.castAct = heroCastAct(id, d);           // tư thế phải khớp VFX của chiêu
  const sect = SECTS[player.sect];
  let sfxTag = 'skill'; // per-class override set in the sectTP/sectA branches below
  // Khắc Ấn — mở ngữ cảnh đòn cho cả lượt tung này. 'a' = chiêu chính (sectA), 'tp' = Trấn Phái.
  // Móc 'pre' chạy TRƯỚC mọi thứ khác vì nó có thể dời chỗ đứng người chơi (Xung Phong), và
  // vị trí ấy phải là vị trí chiêu thực sự phát ra.
  _sigilTag = d.kind === 'sectTP' ? 'tp' : (d.kind === 'amkhi' || d.kind === 'gangkhi' || d.kind === 'danchi'
              || d.kind === 'bow' || d.kind === 'tieuhon' || d.kind === 'vh') ? null : 'a';
  _sigilHits = 0;
  if (_sigilTag) sigilFire('pre', _sigilTag);

  if (d.kind === 'amkhi'){ // ám khí projectile
    const t = nearestMob(360);
    const ang = t ? Math.atan2(t.y-player.y, t.x-player.x) : player.face;
    player.face = ang;
    const _nD = 1 + _st; // tiến hóa: +1 phi tiêu mỗi bậc
    for (let _di = 0; _di < _nD; _di++){
      const _off = _nD > 1 ? (_di - (_nD - 1) / 2) * 0.16 : 0;
      projectiles.push({ x:player.x, y:player.y, ang:ang + _off, speed:460, dmg:player.atk*SKILL_DEFS.amkhi.mult*(1+(player.amkhiPct||0)+(player.skillDmgPct||0)), kind:'amkhi', life:0.85, color:'#e8e8ff' });
    }
    addEffect({ type:'arc', x:player.x, y:player.y, face:ang, r:40, color:'#aab' });
    spawnSlash(player.x + Math.cos(ang)*30, player.y + Math.sin(ang)*30 - 12, ang, 80, '#e8e8ff', '#aab');
  }
  else if (d.kind === 'sectTP'){ // Trấn Phái — big AoE
    if (SECT_SFX[player.sect]) sfxTag = 'smash_' + SECT_SFX[player.sect];
    const _tpR = TP_RADIUS + 15 * _st; // tiến hóa: trấn phái lan rộng
    spawnSkillVfx('sx_' + player.sect + '_c', { color:sect.color, glyph:'⚔' }, 'aoe', player.face, _tpR);
    addEffect({ type:'ring', x:player.x, y:player.y, r:_tpR, color:sect.color, big:true });
    addEffect({ type:'ring', x:player.x, y:player.y, r:_tpR*0.6, color:sect.glow, big:true });
    for (let i = 0; i < 6; i++){
      const a = i * Math.PI/3 + player.face;
      spawnSlash(player.x + Math.cos(a)*70, player.y + Math.sin(a)*70 - 10, a, 170, sect.color, sect.glow);
    }
    for (const m of mobs){
      if (m.dead) continue;
      if (dist(player.x, player.y, m.x, m.y) < _tpR + m.def.size){
        // QA: Thần Binh (player.tbDmg) trước đây chỉ áp cho chiêu CHÍNH (nhánh sectA) — chiêu PHỤ
        // (Trấn Phái, ô 2 cố định của mọi lớp) bị bỏ sót, trái với mô tả "+%ST chiêu Lớp" ở panel.
        let dmg = player.atk * sect.tp.mult * (1 + (player.tbDmg || 0)) * rnd(0.95,1.1);
        if (Math.random() < player.crit) dmg *= (player.critDmgMult || 2);
        hurtMob(m, dmg, 'tp');
      }
    }
  }
  else if (d.kind === 'gangkhi'){ // Cương Khí Hộ Thể — buff 6s giảm 30% ST
    player.gkBuffT = 6 + 2 * _st; // tiến hóa: cương khí bền hơn
    addFloat(player.x, player.y-52, 'CƯƠNG KHÍ HỘ THỂ!', '#7ecbff', 16);
    addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#7ecbff', big:true });
    addEffect({ type:'ring', x:player.x, y:player.y, r:44, color:'#fff0c0', big:true });
  }
  else if (d.kind === 'danchi'){ // Đạn Chỉ Thần Thông — chỉ lực phong mạch
    const t = nearestMob(520);
    const ang = t ? Math.atan2(t.y-player.y, t.x-player.x) : player.face;
    player.face = ang;
    const _nZ = 1 + _st; // tiến hóa: +1 đạo chỉ lực mỗi bậc
    for (let _di = 0; _di < _nZ; _di++){
      const _off = _nZ > 1 ? (_di - (_nZ - 1) / 2) * 0.12 : 0;
      projectiles.push({ x:player.x, y:player.y, ang:ang + _off, speed:620, dmg:player.atk*SKILL_DEFS.danchi.mult, kind:'danchi', life:0.9, color:'#9fd0ff', pierce:false });
    }
    addEffect({ type:'arc', x:player.x, y:player.y, face:ang, r:46, color:'#9fd0ff' });
  }
  else if (d.kind === 'bow'){ // Linh Tiễn Xạ — 3 mũi tên quạt xuyên thấu
    const t = nearestMob(460);
    const base = t ? Math.atan2(t.y-player.y, t.x-player.x) : player.face;
    player.face = base;
    const bwT = BOW_TIERS[player.bow.tier] || BOW_TIERS[1];
    const _nA = 3 + _st; // tiến hóa: +1 linh tiễn mỗi bậc
    for (let _ai = 0; _ai < _nA; _ai++){
      const off = (_ai - (_nA - 1) / 2) * 0.18;
      projectiles.push({ x:player.x, y:player.y, ang:base+off, speed:520, dmg:player.atk*SKILL_DEFS.bow.mult, kind:'bow', life:0.95, color:bwT.color, pierce:true });
    }
    addEffect({ type:'arc', x:player.x, y:player.y, face:base, r:50, color:bwT.color });
    // Sourced per-class projectile-launch SFX — Linh Tiễn Xạ only ever got the generic 'skill' sfx
    // (sfxTag default, set below) before this; additive, doesn't touch that fallback.
    if (SECT_SFX[player.sect]) AudioSys.sfx('projatk_' + SECT_SFX[player.sect], 0.45);
  }
  else if (d.kind === 'tieuhon'){ // Ám Nhiên Tiêu Hồn Chưởng — AoE lớn
    const R = 230 + 25 * _st; // tiến hóa: chưởng lực lan rộng
    addEffect({ type:'ring', x:player.x, y:player.y, r:R, color:'#7a5a9a', big:true });
    addEffect({ type:'ring', x:player.x, y:player.y, r:R*0.6, color:'#b08ae8', big:true });
    for (let i=0;i<14;i++) addEffect({ type:'ink', x:player.x+rnd(-R,R)*0.7, y:player.y+rnd(-R,R)*0.7, vx:rnd(-30,30), vy:rnd(-70,-20), color:'#6a4a8a' });
    for (const m of mobs){
      if (m.dead) continue;
      if (dist(player.x, player.y, m.x, m.y) < R + m.def.size){
        let dmg = player.atk * SKILL_DEFS.tieuhon.mult * rnd(0.95,1.1);
        if (Math.random() < player.crit) dmg *= (player.critDmgMult || 2);
        hurtMob(m, dmg, 'tp');
      }
    }
  }
  else if (d.kind === 'vh'){ castVohoc(id); }
  else { // sectA — 4 loại theo môn phái
    if (SECT_SFX[player.sect]) sfxTag = 'cast_' + SECT_SFX[player.sect];
    const def = sect.skillA, type = def.type, _tbMul = 1 + (player.tbDmg || 0); // Thần Binh buff chiêu phái
    const _sva = 'sx_' + player.sect + '_a';
    if (type==='cone'){
      const t = nearestMob(160);
      if (t) player.face = Math.atan2(t.y-player.y, t.x-player.x);
      spawnSkillVfx(_sva, { color:sect.color, glyph:'✹' }, 'cone', player.face, 120);
      addEffect({ type:'cone', x:player.x, y:player.y, face:player.face, r:120, color:sect.color });
      spawnSlash(player.x + Math.cos(player.face)*62, player.y + Math.sin(player.face)*62 - 12, player.face, 160, sect.color, sect.glow);
      aoeHit(() => {
        for (const m of mobs){
          if (m.dead) continue;
          const dd = dist(player.x, player.y, m.x, m.y);
          if (dd < 125 + 8*_st + m.def.size){ // tiến hóa: quạt rộng hơn
            let da = Math.atan2(m.y-player.y, m.x-player.x) - player.face;
            while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
            if (Math.abs(da) < 1.0 + 0.08*_st) hurtMob(m, player.atk*def.mult*_tbMul*rnd(0.9,1.1), Math.random()<player.crit?'crit':'hit');
          }
        }
      });
    } else if (type==='proj'){
      const t = nearestMob(420);
      const ang = t ? Math.atan2(t.y-player.y, t.x-player.x) : player.face;
      player.face = ang;
      const _svc = SECT_VFX[_sva];
      const _nP = (def.count || 1) + _st; // Multi-Shot (Sylvan Ranger) bắn 5 tên/loạt; các phái khác mặc định 1, +1 mỗi bậc tiến hóa
      for (let _pi = 0; _pi < _nP; _pi++){
        const _off = _nP > 1 ? (_pi - (_nP - 1) / 2) * 0.15 : 0;
        // tag:'a' — đạn của chiêu CHÍNH mang theo ngữ cảnh Khắc Ấn tới tận lúc nó chạm địch
        projectiles.push({ x:player.x, y:player.y, ang:ang + _off, speed:420, dmg:player.atk*def.mult*_tbMul, kind:'skill', life:1.0, color:sect.color, pierce:true, tag:'a', style:(_svc && _svc.proj) || undefined });
      }
      spawnSkillVfx(_sva, { color:sect.color, glyph:'✹' }, 'cast', ang, 60);
      // Sylvan Ranger / Dark Wizard bắn đạn từ xa — không có lưỡi kiếm nào quét ra, chỉ loé đầu nòng
      if (!(sect.range > 200))
        spawnSlash(player.x + Math.cos(ang)*34, player.y + Math.sin(ang)*34 - 12, ang, 120, sect.color, sect.glow);
    } else if (type==='selfaoe'){
      spawnSkillVfx(_sva, { color:sect.color, glyph:'✹' }, 'aoe', player.face, 135 + 10*_st);
      addEffect({ type:'ring', x:player.x, y:player.y, r:135 + 10*_st, color:sect.color });
      for (let i = 0; i < 4; i++){
        const a = i * Math.PI/2 + Math.PI/4;
        spawnSlash(player.x + Math.cos(a)*52, player.y + Math.sin(a)*52 - 10, a, 130, sect.color, sect.glow);
      }
      for (let i=0;i<10;i++) addEffect({ type:'ink', x:player.x+rnd(-90,90), y:player.y+rnd(-90,90), vx:rnd(-30,30), vy:rnd(-60,-10), color:sect.color });
      aoeHit(() => {
        for (const m of mobs){
          if (m.dead) continue;
          if (dist(player.x, player.y, m.x, m.y) < 140 + 10*_st + m.def.size)
            hurtMob(m, player.atk*def.mult*_tbMul*rnd(0.9,1.1), Math.random()<player.crit?'crit':'hit');
        }
      });
    } else if (type==='dash'){
      spawnSkillVfx(_sva, { color:sect.color, glyph:'✹' }, 'dash', player.face, 150, player.x, player.y);
      const t = nearestMob(220);
      const ang = t ? Math.atan2(t.y-player.y, t.x-player.x) : player.face;
      player.face = ang;
      const _dashD = Math.round(130 * (1 + 0.15 * _st)); // tiến hóa: lướt xa hơn
      player.x = clamp(player.x + Math.cos(ang)*_dashD, 20, MAP.w-20);
      player.y = clamp(player.y + Math.sin(ang)*_dashD, 20, MAP.h-20);
      addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:sect.color });
      spawnSlash(player.x + Math.cos(ang)*40, player.y + Math.sin(ang)*40 - 12, ang, 140, sect.color, sect.glow);
      const t2 = nearestMob(110);
      if (t2) hurtMob(t2, player.atk*def.mult*_tbMul*rnd(0.95,1.15), Math.random()<player.crit?'crit':'hit');
    }
  }
  // Khắc Ấn — móc 'cast': biết lượt tung này đã chạm mấy con (Hiệu Triệu cần con số đó).
  // Đóng ngữ cảnh NGAY sau đó: chiêu bắn đạn thì sát thương tới muộn, lúc ấy cờ phải đến từ
  // chính viên đạn (p.tag) chứ không phải cờ còn sót lại của lượt tung trước.
  if (_sigilTag){ const _t = _sigilTag, _h = _sigilHits; _sigilTag = null; sigilFire('cast', _t, _h); }
  _sigilTag = null; _sigilHits = 0;
  AudioSys.sfx(sfxTag, 0.6);
  flashSkillSlot(id);
  // Song Ảnh Phân Thân Thủ (Võ Học Phổ): 30% chiêu vừa tung không tốn hồi chiêu
  if (id !== 'tieuvotuong' && vhLearned('songthu') && Math.random() < 0.3){
    player.cd[id] = 0;
    addFloat(player.x, player.y-62, '✦ SONG THỦ HỖ BÁC — chiêu không hồi!', '#d8d8f0', 13);
  }
  player.atk = _atk0; // trả công lực gốc — buff cấp kỹ năng chỉ áp trong lúc tung chiêu
}
function flashSkillSlot(skillId){
  const i = (player.skillBar || []).indexOf(skillId);
  const b = i >= 0 ? el('sk-'+i) : null;
  if (b){ b.classList.add('flash'); setTimeout(()=>b.classList.remove('flash'), 220); }
}

// ---------- HUD (override): mana thay chân khí · danh hiệu/phái/cấp trên thanh ----------
function updateHud(){
  const sect = SECTS[player.sect];
  const tt = player.titles && player.titles.equipped && TITLES.find(x=>x.id===player.titles.equipped);
  const nameEl = el('hud-name');
  // Góc trái chỉ giữ thứ đổi liên tục và cần liếc giữa trận: danh hiệu, tên, và hai cảnh báo.
  // Lớp / cấp / điểm cộng là thứ tra chứ không phải liếc — đã chuyển sang bảng Nhân Vật (V).
  const _nameHtml = `${tt?`<span class="title-tag">【${tt.name}】</span> `:''}${player.name ? `<span class="char-name">${player.name}</span>` : sect.name}${player.free>0?` <span class="hud-free" title="Còn ${player.free} điểm chưa cộng — bấm V">+${player.free}</span>`:''}${player.toiac>0?` · <b>TỘI ÁC ${player.toiac}</b>`:''}`;
  if (window._lastHudName !== _nameHtml){ window._lastHudName = _nameHtml; nameEl.innerHTML = _nameHtml; } // dirty-check: innerHTML rewrite is real DOM churn if done every frame
  nameEl.classList.toggle('toiac', (player.toiac||0) > 0);
  // Viên đá Máu/Chân Khí kiểu MU Online: chất lỏng dâng từ dưới lên, nên đổi width → height
  const hpPct = clamp(100*player.hp/player.maxHp, 0, 100), qiPct = clamp(100*player.qi/player.maxQi, 0, 100);
  el('bar-hp').style.height = hpPct+'%';
  el('txt-hp').textContent = `${Math.ceil(player.hp)}`;
  el('orb-hp').title = `Sinh Lực ${Math.ceil(player.hp)} / ${player.maxHp}`;
  el('bar-qi').style.height = qiPct+'%';
  el('txt-qi').textContent = `${Math.floor(player.qi)}`;
  el('orb-qi').title = `Chân Khí ${Math.floor(player.qi)} / ${player.maxQi}`;
  el('hp-accent-fill').style.width = hpPct+'%';
  if (player.level >= MAX_LV){ el('bar-xp').style.width='100%'; el('txt-xp').textContent='MAX'; }
  else { el('bar-xp').style.width = (100*player.xp/XP_TABLE[player.level-1])+'%';
         el('txt-xp').textContent = `${Math.floor(player.xp)} / ${XP_TABLE[player.level-1]} EXP`; }
  const potEl = el('hud-potion');
  if (potEl){ potEl.textContent = `🧪 x${player.potions || 0} (R)${player.potionCd > 0 ? ` · ${Math.ceil(player.potionCd)}s` : ''}`; potEl.style.opacity = (player.potions > 0 && player.potionCd <= 0) ? 1 : 0.45; }
  const buffEl = el('hud-buff');
  if (buffEl){
    if ((player.buffAtkT || 0) > 0){
      buffEl.style.display = '';
      buffEl.textContent = `🍶 +12% công · ${Math.floor(player.buffAtkT/60)}:${String(Math.floor(player.buffAtkT%60)).padStart(2,'0')}`;
    } else buffEl.style.display = 'none';
  }
  const loiEl = el('hud-loidon');
  if (loiEl){
    if ((player.loidonT || 0) > 0){
      loiEl.style.display = '';
      loiEl.textContent = `⚡ -40% lôi · ${Math.floor(player.loidonT/60)}:${String(Math.floor(player.loidonT%60)).padStart(2,'0')}`;
    } else loiEl.style.display = 'none';
  }
  el('hud-silver').textContent = `◈ ${player.silver}`;
  el('hud-mat').textContent = `✦ ${player.mat} Tinh Thạch`;
  // Đồng Hồ Thế Giới: giờ thật + đếm ngược sự kiện gần nhất — bấm mở Bảng Sự Kiện
  const gtEl = el('hud-time');
  if (gtEl && player.gt){
    const _now = Date.now(), _d = new Date(_now);
    const _ev = nextEventInfo(_now);
    const _wxn = weatherNow();
    const _timeHtml = `⏱ <b>${String(_d.getHours()).padStart(2,'0')}:${String(_d.getMinutes()).padStart(2,'0')}</b>`
      + (_ev ? ` · ${_ev.icon} ${_ev.active ? '<b>ĐANG DIỄN RA</b>' : fmtCountdown(_ev.at - _now)}` : '')
      + (_wxn ? ` · <span title="Thời tiết: ${_wxn.name}">${_wxn.icon}</span>` : '')
      + (isNightGame() ? ' · <span style="color:#8ab8e8" title="Ban đêm: quái +10% công nhưng +10% EXP">☾</span>' : '');
    if (window._lastHudTime !== _timeHtml){ // dirty-check: đổi mỗi phút, không ghi DOM mỗi khung
      window._lastHudTime = _timeHtml;
      gtEl.innerHTML = _timeHtml;
      gtEl.style.color = _ev && _ev.active ? _ev.color : '#cfd4e8';
      gtEl.title = 'Đồng Hồ Thế Giới — bấm để mở Bảng Sự Kiện';
    }
  }
  // bản đồ + loại khu vực + đai cấp đang đứng
  const md = mapDef(), zt = zoneType();
  const _hb = bandOfDist(md, player.x, player.y);
  const _mapHtml = `${md.name}<span class="zone-badge" style="color:${zt.color};border-color:${zt.color}">${zt.name}</span>`
    + (_hb >= 0 ? `<span class="zone-badge" style="color:${BAND_COLORS[_hb]};border-color:${BAND_COLORS[_hb]}">Đai ${BAND_NAMES[_hb]} · ${bandLvText(md,_hb)}</span>` : '');
  if (window._lastHudMap !== _mapHtml){ window._lastHudMap = _mapHtml; el('hud-map').innerHTML = _mapHtml; } // dirty-check: rarely changes, was rewritten every frame
  // nút PK: chỉ ở map Dã Ngoại / Huyết Chiến
  const pkBtn = el('btn-pk');
  if (md.type === 'safe') pkBtn.classList.add('hidden');
  else {
    pkBtn.classList.remove('hidden');
    pkBtn.textContent = player.pk ? 'PK: BẬT' : 'PK: Tắt';
    pkBtn.classList.toggle('pk-on', !!player.pk);
    pkBtn.classList.toggle('pk-off', !player.pk);
  }
  const autoBtn = el('btn-auto');
  if (autoBtn){ autoBtn.classList.remove('hidden'); updateAutoBtn(); }
  // quest tracker — chính tuyến + tối đa 2 phụ tuyến
  { const _th = trackerHtml(); if (window._lastTrack !== _th){ window._lastTrack = _th; el('quest-tracker').innerHTML = _th; } } // GDD Đợt 2 B2: cache để nút bấm không bị render đè
  // hint — theo tầng cấp, tân thủ chỉ thấy phím cốt lõi
  el('hint-bar').textContent = hintText();
  // taskbar: 3 ô kỹ năng cố định (chính/phụ/buff)
  for (let i = 0; i < 3; i++){
    const b = el('sk-'+i); if (!b) continue;
    const id = (player.skillBar || [])[i];
    if (!id){
      b.classList.add('sk-empty'); b.classList.remove('locked','has-img');
      b.style.backgroundImage = '';
      b.querySelector('.sk-ico').textContent = '+';
      b.title = 'Chưa gia nhập lớp — trả lời The Calling ở cấp 10 (K)';
      b.querySelector('.sk-cd').style.height = '0%';
      continue;
    }
    const info = skillInfo(id);
    b.classList.remove('sk-empty');
    b.classList.toggle('locked', !info.unlocked);
    b.classList.add('has-img');
    b.style.backgroundImage = `url(${info.icon})`;
    b.title = info.unlocked ? `${info.name} — ${info.qi} Qi · ${info.cd}s` : `${info.name} — ${info.lockTxt}`;
    const cd = player.cd[id] || 0;
    b.querySelector('.sk-cd').style.height = (cd>0 ? (100*cd/info.cd) : 0) + '%';
  }
}
function applySkillIcons(){
  setSkillIcon('sk-basic', 'assets/skills/basic.png');
}
// ---------- Hệ thống cửa hàng — mỗi NPC một quầy hàng riêng ----------
const SHOPS = {
  duoclao: { quote:'"Thuốc bổ hay thuốc độc — khác nhau ở liều lượng thôi, khách quân ạ."', junk:true, rows:[
    { id:'thuoc',     name:'🧪 Hồ Lô Thuốc',        price:150, desc:'Hồi 40% máu tức thì (phím R) — túi đựng tối đa 5 lọ' },
    { id:'trithuong', name:'✚ Trị Thương Toàn Phần', price:100, desc:'Nhà Giả Kim tự tay bào chế thuốc — hồi đầy HP ngay lập tức' },
    { id:'tukhi',     name:'◎ Tụ Khí Công',          price:80,  desc:'Vận chuyển chân khí — hồi đầy Instinct ngay lập tức' },
    { id:'loidon',    name:'⚡ Lôi Độn Phù',           price:600, desc:'5 phút giảm 40% sát thương thiên lôi — vật bất ly thân khi độ kiếp' },
    { id:'tiendan',   name:'◈ Tiến Cấp Đan ×3',      price:900, desc:'Tấn Chức (Ám Khí/Cung Tiễn/Cương Khí)' },
  ]},
  binhkhi: { quote:'"Binh khí nhà ta ba đời rèn giũa — mở rương là biết liền."', rows:[
    { id:'ruongvk', name:'⚔ Rương Binh Khí',  price:800, desc:'Vũ khí ngẫu nhiên theo cấp của ngươi — có thể ra hàng hiếm' },
    { id:'ruongpc', name:'🛡 Rương Phòng Cụ', price:700, desc:'Giáp trụ ngẫu nhiên theo cấp — có thể ra trang bị Hoàn Hảo' },
    { id:'phongphu', name:'🐾 Phong Linh Phù', price:1500, desc:'Thu phục quái tinh anh suy yếu (dưới 40% máu) làm Linh Thú — đứng gần bấm T' },
  ]},
  trachu: { quote:'"Vào đây uống chén trà nóng đã — chuyện Lunacia để sau hẵng hay."', rows:[
    { id:'nghitro', name:'🛏 Nghỉ Trọ',      price:120, desc:'Nghỉ ngơi dưỡng thần — hồi đầy HP và Instinct' },
    { id:'ruou',    name:'🍶 Rượu Hổ Cốt',   price:200, desc:'3 phút +12% công lực — men say bừng bừng sát khí' },
  ]},
};
let curShopNpc = null;
function renderShop(n){
  const shop = SHOPS[n.id];
  if (!shop) return;
  curShopNpc = n;
  let html = `<h3>${n.name}</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">${shop.quote}</div>`;
  for (const r of shop.rows){
    html += `<div class="npc-shop-row"><span><b style="color:#7ecbff">${r.name}</b><br>
      <span style="font-size:11px;opacity:.7">${r.desc}</span></span>
      <button class="mini-btn" ${player.silver<r.price?'disabled':''} onclick="buyFromShop('${r.id}')">${r.price}◈</button></div>`;
  }
  // Vật Phẩm Quý — làm mới 2 giờ/lần, mỗi tiệm một món khác nhau (bài học Phường Thị NNTD)
  const RARE_POOL = (window.RARE_POOL = window.RARE_POOL || [
    { id:'r_ruongvk2', name:'⚔ Rương Binh Khí Tinh Tuyển', price:1400, desc:'Tỉ lệ ra hàng hiếm gấp 3 — vũ khí theo cấp của ngươi' },
    { id:'r_tiendan5', name:'◈ Tiến Cấp Đan ×5 (giá hời)', price:1200, desc:'Gói tiết kiệm — chỉ bán theo đợt' },
    { id:'r_mat5',     name:'✦ Huyền Thiết ×5',            price:750,  desc:'Nguyên liệu rèn +1 đến +6' },
    { id:'r_tula',     name:'◆ Tu La Tinh Thạch',          price:1800, desc:'Khảm trang bị, rèn +7 trở lên — hiếm có' },
    { id:'r_hon',      name:'❖ Hỗn Nguyên Thạch',          price:2600, desc:'Rèn +10/+11 — cực hiếm' },
  ]);
  const cycle = Math.floor(Date.now()/7200000);
  const rare = RARE_POOL[(cycle*7 + n.id.length*3) % RARE_POOL.length];
  const nextIn = 7200 - Math.floor((Date.now() % 7200000)/1000);
  html += `<div class="stat-sec">VẬT PHẨM QUÝ — đổi sau ${Math.floor(nextIn/60)}:${String(nextIn%60).padStart(2,'0')}</div>`;
  html += `<div class="npc-shop-row" style="border-color:rgba(176,138,232,.55)"><span><b style="color:#d8baff">${rare.name}</b><br>
    <span style="font-size:11px;opacity:.7">${rare.desc}</span></span>
    <button class="mini-btn" ${player.silver<rare.price?'disabled':''} onclick="buyFromShop('${rare.id}')">${rare.price}◈</button></div>`;
  if (shop.junk){
    const junk = player.inv.filter(it => !it.special && it.rarity <= 1);
    const junkVal = junk.reduce((s2,it)=>s2 + 20 + it.rarity*30 + (it.tier||1)*15, 0);
    html += `<div class="npc-shop-row"><span><b style="color:#9fd0ff">Bán hết đồ trắng/xanh (${junk.length} món)</b><br>
      <span style="font-size:11px;opacity:.7">Dọn túi nhanh — nhận bạc ngay</span></span>
      <button class="mini-btn" ${junk.length?'':'disabled'} onclick="sellJunk()">+${junkVal}◈</button></div>`;
  }
  // GDD Đợt 2 B6: thu mua lẻ đồ phẩm Lam trở lên — giá theo Lực chiến
  const _sellable = player.inv.map((it2, i2) => ({ it:it2, i:i2 })).filter(x => !x.it.special && x.it.rarity >= 2).slice(0, 6);
  if (_sellable.length){
    html += `<div class="stat-sec">THU MUA — đồ phẩm cao trong túi (bán 2 lần để xác nhận)</div>`;
    for (const x of _sellable){
      html += `<div class="npc-shop-row"><span><b class="${RARITIES[x.it.rarity].cls}">${x.it.name}</b><br>
        <span style="font-size:11px;opacity:.7">Lực chiến ${itemPower(x.it)}</span></span>
        <button class="mini-btn" onclick="sellItem(${x.i});renderShop(curShopNpc)">+${itemSellPrice(x.it)}◈</button></div>`;
    }
  }
  html += aiChatBlock(n.id);
  el('panel-quest').innerHTML = html;
  closePanels(); el('panel-quest').classList.remove('hidden');
}
window.buyFromShop = function(what){
  if (!curShopNpc) return;
  const shop = SHOPS[curShopNpc.id];
  const row = shop && (shop.rows.find(r => r.id === what) || (window.RARE_POOL || []).find(r => r.id === what));
  if (!row || player.silver < row.price) return;
  if (what==='thuoc'){
    if (player.potions >= 5){ addFloat(player.x, player.y-34, 'Túi thuốc đã đầy (tối đa 5 lọ)!', '#8a8a8a', 12); return; }
    player.silver -= row.price; player.potions++;
  }
  else if (what==='phu'){ player.silver -= row.price; player.charms++; }
  else if (what==='tiendan'){ player.silver -= row.price; player.tienDan += 3; }
  else if (what==='trithuong'){
    if (player.hp >= player.maxHp){ addFloat(player.x, player.y-34, 'Vẫn khỏe mạnh — không cần thuốc!', '#8a8a8a', 12); return; }
    player.silver -= row.price; player.hp = player.maxHp;
    addEffect({ type:'ring', x:player.x, y:player.y, r:60, color:'#6ae88a' });
  }
  else if (what==='tukhi'){
    if (player.qi >= player.maxQi){ addFloat(player.x, player.y-34, 'Chân khí đã sung mãn!', '#8a8a8a', 12); return; }
    player.silver -= row.price; player.qi = player.maxQi;
    addEffect({ type:'ring', x:player.x, y:player.y, r:60, color:'#7fd8e0' });
  }
  else if (what==='nghitro'){
    player.silver -= row.price; player.hp = player.maxHp; player.qi = player.maxQi;
    addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#7ecbff', big:true });
  }
  else if (what==='ruou'){
    player.silver -= row.price; player.buffAtkT = 180; calcDerived();
    zoneBanner = { text:'🍶 RƯỢU HỔ CỐT', sub:'3 phút +12% công lực — men say bừng bừng sát khí!', color:'#e8a04a', t:2.6 };
    AudioSys.sfx('quest', 0.5);
  }
  else if (what==='loidon'){
    player.silver -= row.price; player.loidonT = 300;
    zoneBanner = { text:'⚡ LÔI ĐỘN PHÙ', sub:'5 phút giảm 40% sát thương thiên lôi — cứ yên tâm độ kiếp!', color:'#ffb15c', t:2.6 };
    AudioSys.sfx('quest', 0.5);
  }
  else if (what==='phongphu'){ player.silver -= row.price; player.phongphu = (player.phongphu || 0) + 1; addFloat(player.x, player.y-50, '+1 Phong Linh Phù — bấm T gần tinh anh suy yếu', '#b08ae8', 13); }
  else if (what==='r_tiendan5'){ player.silver -= row.price; player.tienDan += 5; }
  else if (what==='r_mat5'){ player.silver -= row.price; player.mat += 5; }
  else if (what==='r_tula'){ player.silver -= row.price; player.gems.tuLa++; }
  else if (what==='r_hon'){ player.silver -= row.price; player.gems.honNguyen++; }
  else if (what==='r_ruongvk2'){
    if (player.inv.length >= 30){ addFloat(player.x, player.y-34, 'Túi đồ đã đầy!', '#ff7a6a', 12); return; }
    player.silver -= row.price;
    let it = null;
    for (let i = 0; i < 40; i++){ const g2 = genItem(player.level, 0.25); if (g2.slot === 'vukhi'){ it = g2; break; } }
    if (!it) it = genItem(player.level, 0.25);
    player.inv.push(it);
    addFloat(player.x, player.y-50, `Nhận được ${it.name}!`, RARITIES[it.rarity].color, 13);
    AudioSys.sfx('quest', 0.5);
  }
  else if (what==='ruongvk' || what==='ruongpc'){
    if (player.inv.length >= 30){ addFloat(player.x, player.y-34, 'Túi đồ đã đầy!', '#ff7a6a', 12); return; }
    player.silver -= row.price;
    const wantWeapon = what === 'ruongvk';
    let it = null;
    for (let i = 0; i < 40; i++){
      const g2 = genItem(player.level, 0.08);
      if (wantWeapon ? g2.slot === 'vukhi' : ARMOR_SLOTS.includes(g2.slot)){ it = g2; break; }
    }
    if (!it) it = genItem(player.level, 0.08);
    player.inv.push(it);
    addFloat(player.x, player.y-50, `Nhận được ${it.name}!`, RARITIES[it.rarity].color, 13);
    AudioSys.sfx('quest', 0.5);
  }
  addFloat(player.x, player.y-34, 'Mua thành công!', '#7ecbff', 12);
  saveGame(); renderShop(curShopNpc);
};
window.sellJunk = function(){
  const keep = [], junk = [];
  for (const it of player.inv) (it.special || it.rarity > 1 ? keep : junk).push(it);
  if (!junk.length) return;
  const val = junk.reduce((s2,it)=>s2 + 20 + it.rarity*30 + (it.tier||1)*15, 0);
  player.inv = keep; player.silver += val;
  addFloat(player.x, player.y-34, `Bán ${junk.length} món +${val}◈`, '#7ecbff', 13);
  saveGame(); if (curShopNpc) renderShop(curShopNpc);
};

// ═══════════ LÒ BÁT QUÁI — Phá Thiên Kiếp (+9 → +11) ═══════════
// GDD: chỉ Tông Sư Thợ Rèn tại Lò Rèn Hoàng Gia (Tương Dương Thành) mới rèn được +10/+11.
// +10 = 50%, +11 = 45%. Thất bại → trang bị VỠ NÁT (Thiên Mệnh Phù bảo hộ).
// Tông Sư Thợ Rèn không còn màn riêng nữa — NPC chỉ mở đúng cỗ máy ở tab Rèn. Trước đây đây là
// màn THỨ HAI, trùng nội dung với bảng Rèn (Hỗn Độn Lò, Cổ Thần đều có ở cả hai chỗ), và các
// công thức chỉ-làm-được-ở-đây thì nay tự khoá bằng cờ royal + atRoyalForge().
function renderBaGua(){
  chaosGroup = 'ren'; chaosPick = null;
  if (!sysUnlocked('forge')){ togglePanel('forge'); return; } // để togglePanel báo "khoá ở cấp N"
  closePanels();
  window.charTab = 'forge';
  renderCharPanel();
  el('panel-char').classList.remove('hidden');
  AudioSys.sfx('ui', 0.6);
}

// ═══════════ VŨ KHÍ DANH PHÁI — mỗi môn phái một binh khí riêng ═══════════
const SECT_WEAPONS = { thieulam:'con', toanchan:'kiem', baidasan:'xatruong', minhgiao:'daidao' }; // bug (Dark Lord) không có entry riêng, rơi về fallback 'kiem' — như trước đây
function drawSectWeapon(p, sect){
  const kind = SECT_WEAPONS[p.sect] || 'kiem';
  const k = p.atkAnim > 0 ? p.atkAnim/0.22 : 0;          // 1 → 0 khi chém
  const swing = k > 0 ? (1-k)*2.5 : 0;                    // quạt mạnh theo đòn đánh
  const castK = (p.castT || 0) / 0.38;
  const idleSway = Math.sin(p.walkPh || 0) * (p.moving ? 0.16 : 0.06);
  const wph = p.walkPh || 0;
  const bob = p.moving ? Math.abs(Math.sin(wph))*3.2 : Math.sin(wph)*1.2;
  const hx = p.x + Math.cos(p.face)*5;
  const hy = p.y - 20 - bob + Math.sin(p.face)*3;
  const ang = p.face + 1.05 - swing + idleSway - castK*0.8; // nghỉ: xếch xuống · chiêu: giơ cao
  const wpn = p.equip && p.equip.vukhi;
  const glowBoost = wpn && wpn.plus >= 9 ? (wpn.plus >= 11 ? 2 : 1.4) : 1;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
  ctx.lineCap = 'round';
  // hào quang quanh vũ khí theo màu phái
  ctx.shadowColor = sect.glow; ctx.shadowBlur = 4*glowBoost + castK*10;
  if (kind === 'con'){ // Thiếu Lâm — côn
    ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(30, 0); ctx.stroke();
    ctx.strokeStyle = sect.color; ctx.lineWidth = 4.2;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-10, 0); ctx.moveTo(26, 0); ctx.lineTo(30, 0); ctx.stroke();
  } else if (kind === 'kiem'){ // Toàn Chân — thanh kiếm
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-2, 0); ctx.stroke(); // chuôi
    ctx.strokeStyle = sect.color; ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(-3.5, -3.4); ctx.lineTo(-3.5, 3.4); ctx.stroke(); // chẩn
    const bl = ctx.createLinearGradient(0, 0, 32, 0);
    bl.addColorStop(0, '#d8e8e8'); bl.addColorStop(1, '#f8ffff');
    ctx.strokeStyle = bl; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(30, 0); ctx.stroke();
    ctx.strokeStyle = sect.glow; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(2, -1.2); ctx.lineTo(28, -1.2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (kind === 'songhoan'){ // Cổ Mộ — song hoàn
    for (const off of [-5, 5]){
      ctx.strokeStyle = sect.color; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(14, off, 7, 0, 7); ctx.stroke();
      ctx.strokeStyle = sect.glow; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(14, off, 5, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  } else if (kind === 'xatruong'){ // Bạch Đà Sơn — xà trượng
    ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(10, 1.5, 26, 0); ctx.stroke();
    ctx.strokeStyle = sect.color; ctx.lineWidth = 2.6; // đầu rắn cuộn
    ctx.beginPath(); ctx.arc(27, -1, 4.5, -2.4, 2.2); ctx.stroke();
    ctx.fillStyle = '#c8ffa0';
    ctx.beginPath(); ctx.arc(28.5, -3.4, 1.2, 0, 7); ctx.fill(); // mắt rắn
  } else if (kind === 'daidao'){ // Minh Giáo — đại đao
    ctx.strokeStyle = '#6a2a1a'; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(2, 0); ctx.stroke(); // cán đỏ
    ctx.fillStyle = '#d8d8e0';
    ctx.beginPath(); // lưỡi đao cong lớn
    ctx.moveTo(2, -2.5); ctx.quadraticCurveTo(22, -7, 32, -3);
    ctx.quadraticCurveTo(26, 2.5, 4, 2.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = sect.glow; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(4, -2.8); ctx.quadraticCurveTo(22, -7.2, 31, -3.2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (kind === 'quat'){ // Đoàn Thị — thiết quạt
    ctx.fillStyle = sect.color; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 16, -0.62, 0.62); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = sect.glow; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++){
      const a = i*0.28;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*15, Math.sin(a)*15); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 16, -0.62, 0.62); ctx.stroke();
  } else { // Đào Hoa — ngọc tiêu
    const fl = ctx.createLinearGradient(0, 0, 24, 0);
    fl.addColorStop(0, '#7ec8a0'); fl.addColorStop(1, '#c8f0d8');
    ctx.strokeStyle = fl; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(22, 0); ctx.stroke();
    ctx.fillStyle = '#3a7a58';
    for (let i = 0; i < 4; i++){ ctx.beginPath(); ctx.arc(2 + i*5, 0, 1.1, 0, 7); ctx.fill(); }
    ctx.strokeStyle = sect.color; ctx.lineWidth = 1.6; // tua hồng
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-9, 4, -8, 8 + Math.sin(wph)*1.5); ctx.stroke();
  }
  // tuyệt chiêu: vệt sáng chói dọc binh khí
  if (castK > 0){
    ctx.globalAlpha = castK; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26, 0); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ═══════════ HÀO QUANG TUYỆT HỌC MAX TẦNG (Ám Khí 7 · Cung Tiễn 7) ═══════════
function drawMaxTuyetHocAura(p){
  const t = performance.now()/1000;
  const akTier = (p.amkhiX && p.amkhiX.tier) || 0;
  const bowTier = (p.bow && p.bow.tier) || 0;
  // Ám Khí tầng 7 — Bạo Vũ Lê Hoa: 7 lưỡi phi đao vàng bay quanh thân
  if (akTier >= 7){
    const n = 7;
    for (let i = 0; i < n; i++){
      const a = t*1.7 + i*(Math.PI*2/n);
      const rx = 48 + Math.sin(t*2.3 + i)*5, ry = 15 + Math.cos(t*1.9 + i)*2.5;
      const bx = p.x + Math.cos(a)*rx, by = p.y - 16 + Math.sin(a)*ry;
      const depth = Math.sin(a); // lưỡi phía sau mờ hơn
      ctx.save();
      ctx.translate(bx, by); ctx.rotate(a + Math.PI/2);
      ctx.globalAlpha = depth < -0.2 ? 0.55 : 1;
      ctx.shadowColor = '#7ecbff'; ctx.shadowBlur = 10;
      const bg = ctx.createLinearGradient(-6, 0, 6, 0);
      bg.addColorStop(0, '#fff4cc'); bg.addColorStop(0.5, '#7ecbff'); bg.addColorStop(1, '#c9982e');
      ctx.fillStyle = bg;
      ctx.beginPath(); // lưỡi phi đao hình thoi
      ctx.moveTo(0, -8); ctx.lineTo(3.2, 0); ctx.lineTo(0, 8); ctx.lineTo(-3.2, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // quỹ đạo lửa vàng mờ
    ctx.save(); ctx.globalAlpha = 0.3 + 0.1*Math.sin(t*3);
    ctx.strokeStyle = '#7ecbff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y-16, 48, 15, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // Cung Tiễn tầng 7 — Thần Nỏ Quang: quầng sáng + 3 mũi tên sáng lượn trên đỉnh đầu
  if (bowTier >= 7){
    const bt = BOW_TIERS[7];
    // quầng hào quang
    ctx.save();
    const pulse = 0.3 + 0.14*Math.sin(t*2.6);
    ctx.globalAlpha = pulse;
    const gg = ctx.createRadialGradient(p.x, p.y-24, 4, p.x, p.y-24, 44);
    gg.addColorStop(0, bt.color); gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(p.x, p.y-24, 44, 0, 7); ctx.fill();
    ctx.restore();
    // 3 mũi tên sáng bay vòng trên đỉnh đầu
    for (let i = 0; i < 3; i++){
      const a = -t*1.3 + i*(Math.PI*2/3);
      const ax = p.x + Math.cos(a)*22, ay = p.y - 48 + Math.sin(a)*6;
      ctx.save();
      ctx.translate(ax, ay); ctx.rotate(a + Math.PI);
      ctx.globalAlpha = 0.9; ctx.shadowColor = bt.color; ctx.shadowBlur = 7;
      ctx.strokeStyle = '#fff8e0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
      ctx.fillStyle = bt.color;
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(3, -2.6); ctx.lineTo(3, 2.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // tia sáng xung từ linh cung sau lưng
    ctx.save(); ctx.globalAlpha = 0.5 + 0.2*Math.sin(t*4);
    ctx.strokeStyle = bt.color; ctx.lineWidth = 1.4;
    const backAng = p.face + Math.PI;
    const bx2 = p.x + Math.cos(backAng)*16, by2 = p.y - 22 + Math.sin(backAng)*7;
    for (let i = 0; i < 5; i++){
      const ra = backAng - 0.9 + i*0.45;
      ctx.beginPath(); ctx.moveTo(bx2, by2);
      ctx.lineTo(bx2 + Math.cos(ra)*(18 + Math.sin(t*5+i)*4), by2 + Math.sin(ra)*(18 + Math.sin(t*5+i)*4));
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ═══════════ CỐT TRUYỆN DẪN NHẬP — trước khi chọn môn phái ═══════════
const INTRO_PAGES = [
  `<span class="is-title">HAI THẾ GIỚI</span>
<i>Lunacia sinh ra từ ánh chớp đầu tiên của quả trứng thế giới Atia. Một thế giới non trẻ, chưa từng biết đến chiến tranh.</i>

Ở phía bên kia của mọi thứ, có một thế giới khác: <b>VAELDRA — Lục Địa Thép Và Tro</b>. Nơi đó có hiệp sĩ, có pháp sư, có tiên tộc — và có một thứ bị chôn dưới lòng đất suốt một nghìn năm.

Chúng gọi nó là <b>MORVAHN</b>.`,
  `<span class="is-title">CUỘC GIAO THOA</span>
Phong ấn giam Morvahn bắt đầu vỡ. Các Thủ Hộ của Vaeldra không giữ nổi — nên họ làm một việc khác: <b>bẻ lệch vết nứt sang một thế giới bên cạnh</b>, thứ mà hải đồ của họ ghi là "vô chủ".

Hải đồ đã sai. Thế giới đó là <b>Lunacia</b>.

Vết nứt toác ra trên bầu trời một thế giới chưa từng cầm vũ khí. Khí Morvahn tràn xuống, chạm vào sinh vật nào thì bẻ cong sinh vật ấy thành <b>Chimera</b>. Cú giật ngược còn xé đứt cả một khu phố của <b>Ardhaven</b> khỏi Vaeldra và ném nó xuống đây — đá, lò rèn, quán rượu, cùng những người sống sót.

Người Lunacia dựng lại quanh đống đổ nát ấy và gọi nó là <b>Lunaris City</b>.`,
  `<span class="is-title">KẺ ĐƯỢC PHÁI QUA</span>
Ngươi thuộc một trong <b>năm môn phái của Vaeldra</b>, nằm trong đội tiên phong vượt vết nứt để sửa lại thứ mà thế giới ngươi đã gây ra.

Cuộc vượt biên tước sạch của ngươi mọi thứ: <b>Dark Knight</b> ◆ · <b>Dark Wizard</b> ❄ · <b>Sylvan Ranger</b> ❄ · <b>Spellblade</b> ☼ · <b>Dark Lord</b> ▲ — ngươi không còn nhớ mình thuộc phái nào.

Ngươi dạt vào <b>Petalshade Isle</b>, được một Trưởng Làng Axie nhặt về nuôi. Tới <b>cấp 10</b>, ký ức võ nghệ sẽ trở lại — đó là <b>the Calling</b>.

Mỗi môn phái mang một <b>hệ nguyên tố</b> — khắc hệ gây thêm <b>+20% sát thương</b> lên Chimera bị khắc.`,
  `<span class="is-title">NĂM TRỤ KHÓA</span>
Để vết nứt không nuốt trọn Lunacia, Thủ Hộ Vaeldra đã đóng <b>năm Trụ Khóa</b> xuống khắp thế giới này, ghim miệng vết nứt lại một chỗ.

Tướng quân của Morvahn đã chiếm cả năm trụ. Muốn tiến sâu, ngươi phải hạ chúng — nhưng <b>mỗi trụ được gỡ là vết nứt lại toác thêm</b>.

<i>"Từ Petalshade Isle, qua Thornwood Reach, vào Hollow Roost, lên Frostmire Vale, ra Ashen Steppe… cho tới Stormgate Pass, nơi vết nứt hà xuống."</i>

Muốn tới được Morvahn, ngươi phải tự tay mở toang cánh cửa hắn đang bước qua.

Những Axie ở đây không gây ra chuyện này. <b>Hãy cứu lấy chúng.</b>`,
];

let introPage = 0;
function showIntro(){
  introPage = 0;
  el('intro-story').classList.remove('hidden');
  el('sect-select').classList.add('hidden');
  AudioSys.playBgm(BGM_INTRO); // tân thủ mở game — giai điệu hoài niệm dẫn vào cốt truyện
  renderIntroPage();
}
function renderIntroPage(){
  const pg = el('is-page');
  pg.innerHTML = INTRO_PAGES[introPage];
  pg.style.animation = 'none'; void pg.offsetWidth; pg.style.animation = ''; // restart fade
  el('is-next').textContent = introPage >= INTRO_PAGES.length - 1 ? '⚔ Bắt Đầu Hành Trình' : 'Tiếp ▸';
}
function closeIntro(){
  el('intro-story').classList.add('hidden');
  openQuze('vophai'); // người mới: vào thẳng The Hatching, khởi đầu làm Tán Nhân — cấp 10 mới bái sư
}
el('is-next').addEventListener('click', ()=>{
  if (introPage < INTRO_PAGES.length - 1){ introPage++; renderIntroPage(); }
  else closeIntro();
});
el('is-skip').addEventListener('click', closeIntro);

// ═══════════ HƯỚNG DẪN TÂN THỦ TỪNG BƯỚC ═══════════
const TUT_STEPS = [
  { key:'move',  txt:'Bấm <b>chuột phải</b> trên nền đất hoặc bấm vào <b>minimap</b> — nhân vật sẽ tự vận khinh công chạy tới đó, hãy thử một lần', },
  { key:'npc',   txt:'Đến gần <b>Trưởng Lão Rell</b> giữa thành và nhấn <b>E</b> để trò chuyện, nhận nhiệm vụ đầu tiên' },
  { key:'map',   txt:'Nhấn <b>M</b> mở bản đồ → <b>Dịch Chuyển</b> tới <b>Petalshade Isle</b> để săn Chimera' },
  { key:'kill',  txt:'Nhấn <b>SPACE</b> để đánh quái gần nhất — hãy hạ 1 con <b>Axie Heo Rừng</b>' },
  { key:'loot',  txt:'Quái chết có thể rơi đồ hoặc <b>Châu</b> xuống đất — <b>đi ngang qua</b>, bấm <b>J</b> hoặc <b>bấm chuột trúng món</b> để nhặt. Giữ <b>ALT</b> xem tên mọi món trên màn' },
  { key:'quest', txt:'Làm theo nhiệm vụ ở <b>góc phải màn hình</b> · <b>C</b> nhân vật · <b>K</b> kỹ năng · <b>B</b> túi đồ' },
];
function updateTut(){
  const box = el('tut-hint');
  if (!box) return;
  const cur = (!player || player.tutStep == null || player.tutStep < 0 || player.tutStep >= TUT_STEPS.length) ? -99 : player.tutStep;
  // ẩn hướng dẫn khi đang mở bảng — tránh đè nội dung
  const anyPanel = ['panel-char','panel-inv','panel-bag','panel-skill','panel-map','panel-quest','panel-settings','panel-qlog','panel-vstat'].some(id => { const e2 = document.getElementById(id); return e2 && !e2.classList.contains('hidden'); });
  const key = cur * 10 + (anyPanel ? 1 : 0);
  if (window._tutShown === key) return; // chỉ vẽ lại khi đổi bước/trạng thái — tránh reset nút ✕
  window._tutShown = key;
  if (cur === -99 || anyPanel){ box.classList.add('hidden'); return; }
  const s = TUT_STEPS[cur];
  box.innerHTML = `<span class="tut-step">HƯỚNG DẪN ${cur+1}/${TUT_STEPS.length}</span>
    <span class="tut-x" onclick="player.tutStep=-1; window._tutShown=-99; updateTut()">Đã biết ✕</span>${s.txt}`;
  box.classList.remove('hidden');
}
function tutAdvance(stepKey){
  if (!player || player.tutStep < 0) return;
  if (TUT_STEPS[player.tutStep].key === stepKey){
    player.tutStep++;
    if (player.tutStep >= TUT_STEPS.length){
      player.tutStep = -1;
      addFloat(player.x, player.y-70, 'Hướng dẫn hoàn tất — chúc hành trình phi nước đại!', '#7ecbff', 14);
    }
    updateTut(); saveGame();
  }
}

// ═══════════ THẦN HIỆP — trạng thái mọi hệ thống tối đa ═══════════
function isMaxed(p){
  return p.level >= MAX_LV
    && p.dantian && p.dantian.realm >= DANTIAN_REALMS.length - 1
    && p.mount && p.mount.tier >= MOUNT_TIERS.length - 1
    && p.amkhiX && p.amkhiX.tier >= AMKHI_TIERS.length - 1
    && p.bow && p.bow.tier >= BOW_TIERS.length - 1
    && p.gangkhi && p.gangkhi.tier >= GANGKHI_TIERS.length - 1;
}
// Ấn pháp ấn vàng xoay dưới chân + trụ quang hoa — vẽ ở lớp đất, trước thú cưỡi
function drawThanHiepSeal(p, now){
  const t = now/1000;
  ctx.save();
  // trụ ánh sáng vàng từ trời đổ xuống
  const beam = ctx.createLinearGradient(p.x, p.y - 210, p.x, p.y + 6);
  beam.addColorStop(0, 'rgba(255,224,138,0)');
  beam.addColorStop(0.75, 'rgba(255,224,138,.14)');
  beam.addColorStop(1, 'rgba(255,224,138,.30)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(p.x - 20, p.y + 4); ctx.lineTo(p.x - 40, p.y - 210);
  ctx.lineTo(p.x + 40, p.y - 210); ctx.lineTo(p.x + 20, p.y + 4);
  ctx.closePath(); ctx.fill();
  // đế ấn: hào quang nền
  const base = ctx.createRadialGradient(p.x, p.y + 5, 4, p.x, p.y + 5, 64);
  base.addColorStop(0, 'rgba(255,224,138,.30)'); base.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 64, 22, 0, 0, 7); ctx.fill();
  // vòng ngoài: nét đứt xoay thuận
  ctx.strokeStyle = '#ffd76a'; ctx.globalAlpha = 0.6 + 0.15*Math.sin(t*2.2);
  ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t*38; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 58, 20, 0, 0, 7); ctx.stroke();
  // vòng trong: nét đứt xoay nghịch
  ctx.globalAlpha = 0.5; ctx.lineDashOffset = t*30; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 42, 14, 0, 0, 7); ctx.stroke();
  ctx.setLineDash([]);
  // bát quái quanh ấn
  const glyphs = ['✦','✧','☼','⚡','✽','❄','▲','♣'];
  ctx.font = 'bold 10px "Baloo 2", "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 8; i++){
    const a = t*0.55 + i*(Math.PI/4);
    const gx = p.x + Math.cos(a)*50, gy = p.y + 5 + Math.sin(a)*17;
    ctx.globalAlpha = 0.55 + 0.3*Math.sin(t*3 + i);
    ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(glyphs[i], gx, gy);
  }
  ctx.shadowBlur = 0;
  // tia sáng tách lên
  if (!SETTINGS.lowFx) for (let i = 0; i < 4; i++){
    const sp = (t*0.5 + i*0.25) % 1;
    const sy = p.y + 4 - sp*150;
    const sx = p.x + Math.sin(t*1.4 + i*2.2)*12;
    ctx.globalAlpha = (1 - sp)*0.55;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 3.5);
    sg.addColorStop(0, '#fff8d8'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}
// ── Danh hiệu hiển thị trên đỉnh đầu nhân vật ──
function drawOverheadTitle(p, yOff, riding, maxed){
  const tdef = p.titles && p.titles.equipped && TITLES.find(t => t.id === p.titles.equipped);
  if (!tdef) return;
  const ty = p.y + yOff - (riding ? 92 : 88);
  ctx.save();
  ctx.font = 'bold 12px "Baloo 2", "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const label = `【${tdef.name}】`;
  const tw = ctx.measureText(label).width;
  // nền trầm + viền màu danh hiệu
  ctx.fillStyle = 'rgba(8,6,4,.48)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(p.x - tw/2 - 8, ty - 10, tw + 16, 18, 9);
  else ctx.rect(p.x - tw/2 - 8, ty - 10, tw + 16, 18);
  ctx.fill();
  ctx.globalAlpha = 0.8; ctx.strokeStyle = tdef.color; ctx.lineWidth = 1; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowColor = tdef.color; ctx.shadowBlur = maxed ? 12 : 8;
  ctx.fillStyle = tdef.color;
  ctx.fillText(label, p.x, ty + 1);
  ctx.restore();
}

// ---------- Minimap ----------
// Everything in this static layer only depends on curMap (background art, level-band rings +
// labels, spring/herb dots, city wall, gates) — none of it changes frame to frame, but it used
// to be fully redrawn (incl. a distance loop over every pack + 3 stroked arcs + 3 text labels)
// 60 times/sec regardless. Render it once per map onto an offscreen canvas and blit that;
// rebuilt automatically if the minimap canvas itself is ever resized.
let _miniStaticCache = null, _miniStaticKey = null;
function drawMinimapStatic(mw, mh, sx, sy, md){
  const key = curMap + '|' + mw + 'x' + mh;
  if (_miniStaticCache && _miniStaticKey === key) return _miniStaticCache;
  const off = document.createElement('canvas'); off.width = mw; off.height = mh;
  const sc = off.getContext('2d');
  // nền: ưu tiên ảnh map vẽ tay (thu nhỏ + phủ tối 40%), fallback màu đất phẳng
  const _bg = MAP_BG[curMap];
  if (_bg && _bg.complete && _bg.naturalWidth > 0){
    sc.drawImage(_bg, 0, 0, mw, mh);
    sc.fillStyle = 'rgba(22,18,12,.40)';
    sc.fillRect(0, 0, mw, mh);
  } else {
    sc.fillStyle = md.ground || '#d8ccb0';
    sc.fillRect(0, 0, mw, mh);
    sc.fillStyle = 'rgba(22,18,12,.30)';
    sc.fillRect(0, 0, mw, mh);
  }
  // vòng đai cấp đồng tâm từ cửa vào map (xanh lá/vàng/đỏ)
  if (md.packs && md.packs.length && md.spawn){
    let _maxD = 1;
    for (const pk of md.packs){ const d = dist(pk.x, pk.y, md.spawn.x, md.spawn.y); if (d > _maxD) _maxD = d; }
    const _radii = [0.45*_maxD, 0.8*_maxD, _maxD];
    for (let b = 0; b < 3; b++){
      sc.beginPath(); sc.arc(md.spawn.x*sx, md.spawn.y*sy, _radii[b]*sx, 0, 7);
      sc.strokeStyle = BAND_COLORS[b]; sc.globalAlpha = 0.32; sc.lineWidth = 1.4; sc.stroke();
      sc.globalAlpha = 1;
    }
    // chú thích cấp đai ở mép vòng
    sc.font = '7px "Be Vietnam Pro", sans-serif'; sc.textAlign = 'center';
    for (let b = 0; b < 3; b++){
      sc.fillStyle = BAND_COLORS[b]; sc.globalAlpha = 0.9;
      sc.fillText(bandLvText(md, b), (md.spawn.x + _radii[b]*0.72)*sx, (md.spawn.y - _radii[b]*0.72)*sy);
      sc.globalAlpha = 1;
    }
  }
  // Tiên Tuyền
  if (md.spring){
    sc.fillStyle = '#7fd8e0';
    sc.beginPath(); sc.arc(SPRING.x*sx, SPRING.y*sy, 3, 0, 7); sc.fill();
  }
  // điểm thảo dược — hiện mặc định trên mọi map có thuốc (không cần Quẻ Thiên Nhãn)
  if (md.herbs){
    sc.fillStyle = '#6ae88a';
    for (const h of (HERB_SPOTS[curMap] || [])){ sc.beginPath(); sc.arc(h.x*sx, h.y*sy, 1.8, 0, 7); sc.fill(); }
  }
  // Tường thành + cổng thành
  if (curMap === CITY_WALL.map){
    sc.strokeStyle = 'rgba(168,118,58,.85)'; sc.lineWidth = 1.5;
    sc.strokeRect(CITY_WALL.x1*sx, CITY_WALL.y1*sy, (CITY_WALL.x2-CITY_WALL.x1)*sx, (CITY_WALL.y2-CITY_WALL.y1)*sy);
  }
  for (const g of GATES){
    if (g.map !== curMap) continue;
    sc.fillStyle = g.portal ? '#b08ae8' : '#d8963a';
    sc.fillRect(g.x*sx-3, g.y*sy-3, 6, 6);
    sc.strokeStyle = 'rgba(0,0,0,.6)'; sc.lineWidth = 1;
    sc.strokeRect(g.x*sx-3, g.y*sy-3, 6, 6);
  }
  _miniStaticCache = off; _miniStaticKey = key;
  return off;
}
function drawMinimap(){
  if (!miniCtx || !miniCvs) return;
  miniCvs.style.display = SETTINGS.minimap ? 'block' : 'none';
  const btnMini = el('btn-minimap');
  if (btnMini) btnMini.classList.toggle('off', !SETTINGS.minimap);
  if (!SETTINGS.minimap) return;
  const mw = miniCvs.width, mh = miniCvs.height;
  const sx = mw / MAP.w, sy = mh / MAP.h;
  const md = mapDef();
  const mc = miniCtx;
  mc.drawImage(drawMinimapStatic(mw, mh, sx, sy, md), 0, 0);
  // NPC — chấm vàng viền trắng + tên + dấu nhiệm vụ (! vàng = trả được, … xanh = có NV)
  const qNow = (typeof currentQuest === 'function') ? currentQuest() : null;
  const mapNpcs = NPCS.filter(n => n.map === curMap);
  const placedLabels = []; // chống chồng nhãn khi NPC đứng gần nhau
  for (const n of mapNpcs){
    const nx = n.x*sx, ny = n.y*sy;
    // dấu nhiệm vụ (đồng bộ logic với drawNpc)
    let mark = '';
    if (n.talk === 'quest'){
      if ((qNow && qNow.npc === n.id && questState === 'done') ||
          (typeof SIDE_QUESTS !== 'undefined' && SIDE_QUESTS.some(sq => sq.npc === n.id && sideStates[sq.id] && sideStates[sq.id].st === 'done')))
        mark = '!';
      else if ((qNow && qNow.npc === n.id) ||
               (typeof SIDE_QUESTS !== 'undefined' && SIDE_QUESTS.some(sq => sq.npc === n.id && (sideAvail(sq) === 'avail' || sideAvail(sq) === 'active'))))
        mark = '…';
    }
    mc.fillStyle = '#ffd76a';
    mc.strokeStyle = 'rgba(0,0,0,.65)'; mc.lineWidth = 1;
    mc.beginPath(); mc.arc(nx, ny, 3, 0, 7); mc.fill(); mc.stroke();
    // nhãn tên — thử bên phải, bên trái, bên dưới; bỏ qua nếu vẫn đụng nhãn khác
    mc.font = '8px "Be Vietnam Pro", sans-serif';
    const lw = mc.measureText(n.name).width;
    const spots = [
      { x: nx + 5, y: ny + 3, align: 'left' },
      { x: nx - 5, y: ny + 3, align: 'right' },
      { x: nx, y: ny + 11, align: 'center' },
    ];
    for (const sp of spots){
      const lx = sp.align === 'left' ? sp.x : sp.align === 'right' ? sp.x - lw : sp.x - lw/2;
      const hit = placedLabels.some(r => lx < r.x + r.w && lx + lw > r.x && Math.abs(sp.y - 4 - r.y) < 9);
      if (hit) continue;
      placedLabels.push({ x: lx, y: sp.y - 4, w: lw });
      mc.textAlign = sp.align;
      mc.strokeStyle = 'rgba(0,0,0,.75)'; mc.lineWidth = 2;
      mc.strokeText(n.name, sp.x, sp.y);
      mc.fillStyle = '#ffe9a8';
      mc.fillText(n.name, sp.x, sp.y);
      break;
    }
    if (mark){
      mc.font = 'bold 11px "Be Vietnam Pro", sans-serif'; mc.textAlign = 'center';
      mc.fillStyle = mark === '!' ? '#ffd76a' : '#9fd0ff';
      mc.shadowColor = mc.fillStyle; mc.shadowBlur = 4;
      mc.fillText(mark, nx, ny - 5);
      mc.shadowBlur = 0;
    }
  }
  // quái vật — thường đỏ nhỏ, tinh anh cam, boss tím nhấp nháy, Du Hiệp lam viền trắng
  const _blink = Math.sin(performance.now()/260) > 0;
  for (const m of mobs){
    if (m.dead) continue;
    const d = m.def;
    if (d.duHiep){
      mc.fillStyle = '#4a90e0';
      mc.beginPath(); mc.arc(m.x*sx, m.y*sy, 2.4, 0, 7); mc.fill();
      mc.strokeStyle = 'rgba(255,255,255,.8)'; mc.lineWidth = 0.8; mc.stroke();
      continue;
    }
    if (d.boss && !_blink) continue; // boss nhấp nháy báo hiệu
    mc.fillStyle = d.boss ? '#c04ae8' : d.elite ? '#ffb84a' : '#e05a4a';
    mc.beginPath(); mc.arc(m.x*sx, m.y*sy, d.boss ? 3.5 : d.elite ? 2.6 : 1.6, 0, 7); mc.fill();
    if (d.boss){ mc.strokeStyle = 'rgba(255,255,255,.85)'; mc.lineWidth = 1; mc.stroke(); }
  }
  // pet / thú chiến — chấm xanh cyan
  mc.fillStyle = '#4ad8e0';
  if (petObj && !petObj.dead){ mc.beginPath(); mc.arc(petObj.x*sx, petObj.y*sy, 2, 0, 7); mc.fill(); }
  if (mountObj){ mc.beginPath(); mc.arc(mountObj.x*sx, mountObj.y*sy, 2, 0, 7); mc.fill(); }
  // khung nhìn camera
  mc.strokeStyle = 'rgba(255,255,255,.5)';
  mc.lineWidth = 1;
  mc.strokeRect(camera.x*sx, camera.y*sy, Math.min(W, MAP.w)*sx, Math.min(H, MAP.h)*sy);
  // người chơi — mũi tên trắng chỉ hướng mặt
  mc.save();
  mc.translate(player.x*sx, player.y*sy);
  mc.rotate(player.face);
  mc.shadowColor = '#fff'; mc.shadowBlur = 4;
  mc.fillStyle = '#fff';
  mc.beginPath();
  mc.moveTo(4.5, 0); mc.lineTo(-3, -2.8); mc.lineTo(-1.5, 0); mc.lineTo(-3, 2.8);
  mc.closePath(); mc.fill();
  mc.restore();
  // tên map
  mc.font = '9px "Be Vietnam Pro", sans-serif';
  mc.fillStyle = 'rgba(255,240,200,.9)';
  mc.fillText(md.name, 6, mh - 6);
}

// ---------- Bảng Cài Đặt ----------
function renderSettings(){
  const p = el('panel-settings'); if (!p) return;
  const slider = (key, val) => `<input type="range" min="0" max="100" value="${val}" oninput="setOpt('${key}', this.value, true)" onchange="setOpt('${key}', this.value)">`;
  const tog = (key) => `<button class="mini-btn ${SETTINGS[key] ? '' : 'danger'}" onclick="toggleOpt('${key}')">${SETTINGS[key] ? 'BẬT' : 'TẮT'}</button>`;
  const _acS = (typeof player !== 'undefined' && player && player.autoCfg) ? player.autoCfg : { skill:true, potion:true, potionPct:40, range:430, boss:false };
  const togA = (key) => `<button class="mini-btn ${_acS[key] ? '' : 'danger'}" onclick="toggleAutoCfg('${key}')">${_acS[key] ? 'BẬT' : 'TẮT'}</button>`;
  const sldA = (key, min, max, step, txt) => `<input type="range" min="${min}" max="${max}" step="${step}" value="${_acS[key]}" oninput="setAutoCfg('${key}', this.value, true)" onchange="setAutoCfg('${key}', this.value)"><span style="font-size:11px;color:#ffb15c">${txt}</span>`;
  p.innerHTML = `<h3>Cài Đặt</h3><button class="close-x" onclick="closePanels()">✕</button>
    <div class="set-row"><span>🎵 Nhạc nền</span>${slider('bgm', SETTINGS.bgm)}</div>
    <div class="set-row"><span>🔔 Hiệu ứng âm thanh</span>${slider('sfx', SETTINGS.sfx)}</div>
    <div class="set-row"><span>🗺 Bản đồ thu nhỏ <i>(phím U)</i></span>${tog('minimap')}</div>
    <div class="set-row"><span>🏷 Tên quái vật</span>${tog('mobName')}</div>
    <div class="set-row"><span>📳 Rung màn hình</span><span>${[[0,'TẮT'],[1,'NHẸ'],[2,'ĐẦY']].map(([v,t]) =>
      `<button class="mini-btn ${(SETTINGS.shake|0) === v ? '' : 'danger'}" onclick="setShake(${v})">${t}</button>`).join(' ')}</span></div>
    <div class="set-row"><span>🍃 Giảm hiệu ứng <i>(máy yếu)</i></span>${tog('lowFx')}</div>
    <div class="set-row" style="border-bottom:none;justify-content:center"><b style="color:#6ae88a;font-size:12px">— ⚔ AUTO FARM (phím Z) —</b></div>
    <div class="set-row"><span>🗡 Tự tung kỹ năng trên taskbar</span>${togA('skill')}</div>
    <div class="set-row"><span>🧪 Tự uống Hồ Lô Thuốc</span>${togA('potion')}</div>
    <div class="set-row"><span>❤ Uống thuốc khi HP dưới</span>${sldA('potionPct', 10, 80, 5, _acS.potionPct + '%')}</div>
    <div class="set-row"><span>🎯 Tầm quét quanh điểm neo</span>${sldA('range', 200, 700, 10, _acS.range + 'px')}</div>
    <div class="set-row"><span>👹 Auto đánh cả Boss <i>(nguy hiểm — mặc định tắt, boss tự mình quyết!)</i></span>${togA('boss')}</div>
    ${(typeof player !== 'undefined' && player && player.ascended) ? `
    <div class="set-row" style="border-bottom:none;justify-content:center"><b style="color:#fff2b0;font-size:12px">— ☁ PHI THĂNG · TÁN TIÊN —</b></div>
    <div class="set-row"><span>⚥ Hình dáng tiên nhân</span><span><button class="mini-btn ${player.gender !== 'nu' ? '' : 'danger'}" onclick="setGender('nam')">NAM</button> <button class="mini-btn ${player.gender === 'nu' ? '' : 'danger'}" onclick="setGender('nu')">NỮ</button></span></div>
    <div class="set-row"><span>🎨 Tiên Y (skin)</span><span>${Object.keys(TIEN_SKINS).map(k => `<button class="mini-btn" style="color:${TIEN_SKINS[k].halo} !important;border-color:${TIEN_SKINS[k].halo} !important" title="${TIEN_SKINS[k].name}" onclick="setTienSkin('${k}')">${player.tienSkin === k ? '◉' : '●'}</button>`).join('')}</span></div>
    <div style="font-size:10.5px;color:#9aa8d4;line-height:1.5">Đang mặc: <b style="color:${(TIEN_SKINS[player.tienSkin] || TIEN_SKINS.bach).halo}">${(TIEN_SKINS[player.tienSkin] || TIEN_SKINS.bach).name}</b> — ràng buộc Lớp đã phá bỏ, võ học toàn tự do, ngự kiếm phi hành +25% tốc độ.</div>` : ''}
    <div class="set-row" style="border-bottom:none"><span style="color:#c05a4a">⚠ Xóa dữ liệu & tu luyện lại</span><button class="mini-btn danger" onclick="wipeSave()">XÓA SAVE</button></div>
    <div style="font-size:11px;color:#9aa8d4;margin-top:8px;line-height:1.5">Âm thanh sẽ phát sau thao tác đầu tiên của bạn (quy định trình duyệt). Mọi cài đặt được lưu tự động.</div>`;
}
window.setShake = function(v){ SETTINGS.shake = clamp(v|0, 0, 2); saveSettings(); renderSettings(); };
window.setGender = function(g){ if (!player) return; player.gender = (g === 'nu') ? 'nu' : 'nam'; saveGame(); renderSettings(); };
window.setTienSkin = function(id){ if (!player || !TIEN_SKINS[id]) return; player.tienSkin = id; saveGame(); renderSettings(); };
window.setOpt = function(key, v, quiet){
  SETTINGS[key] = clamp(parseInt(v, 10) || 0, 0, 100);
  saveSettings();
  if (key === 'bgm') AudioSys.refreshBgmVol();
  if (!quiet) renderSettings();
};
window.toggleOpt = function(key){
  SETTINGS[key] = !SETTINGS[key];
  saveSettings();
  renderSettings();
};
window.toggleAutoCfg = function(key){
  if (!player.autoCfg) player.autoCfg = { skill:true, potion:true, potionPct:40, range:430, boss:false };
  player.autoCfg[key] = !player.autoCfg[key];
  saveGame(); renderSettings();
};
window.setAutoCfg = function(key, v, quiet){
  if (!player.autoCfg) player.autoCfg = { skill:true, potion:true, potionPct:40, range:430, boss:false };
  player.autoCfg[key] = clamp(parseInt(v, 10) || 0, 10, 800);
  saveGame();
  if (!quiet) renderSettings();
};
window.wipeSave = function(){
  if (!confirm('Xóa toàn bộ dữ liệu tu luyện và bắt đầu lại từ đầu?')) return;
  try { localStorage.removeItem('vlcm_save'); localStorage.removeItem('vlcm_settings'); } catch { /* best-effort — bỏ qua nếu lỗi */ }
  location.reload();
};

/* ═══════════════════════════════════════════════════════════════
   P1 — NHIỆM VỤ THEO VÙNG: chính tuyến Xạ Điêu + phụ tuyến + NPC vùng
   Chính tuyến = chuỗi tuyến tính (QUESTS), mỗi chương gắn 1 vùng + 1 NPC.
   Phụ tuyến = SIDE_QUESTS, nhận/trả tại NPC vùng, tối đa 3 active.
   Mở khóa map = đủ cấp (md.min) + hoàn thành chương trước (md.reqMain).
   ═══════════════════════════════════════════════════════════════ */

// ---------- NPC mới theo vùng ----------
NPCS.push(
  { id:'duocsu',    name:'Dược Sư',              map:'daohoa',     x:560,  y:430,  img:'assets/npcs/duocsu.png',    talk:'quest',
    lore:'"Thuốc hay cứu người, thuốc độc cũng cứu người — tùy ai dùng."' },
  { id:'quachtinh', name:'Trưởng Lão Rell',      map:'tuongduong', x:1300, y:722,  img:'assets/npcs/quachtinh.png', talk:'quest',
    lore:'"Ta chỉ huy đội tiên phong vượt vết nứt. Sáu người theo ta. Ngươi là người duy nhất còn đứng."' },
  { id:'monkhach',  name:'Trinh Sát Wren',       map:'tuongduong', x:1300, y:1120, img:'assets/npcs/monkhach.png',  talk:'quest',
    lore:'"Ta sinh ra ở đây. Các ngươi thì rơi xuống đây. Nhớ cho kỹ sự khác nhau đó."' },
  { id:'daosi',     name:'Người Gác Rừng Corran', map:'chungnam',   x:520,  y:1420, img:'assets/npcs/daosi.png',     talk:'quest',
    lore:'"Rừng này ta giữ ba đời rồi. Người Vaeldra các ngươi tới được một tháng đã đốt mất nửa."' },
  { id:'thumo',     name:'Sylas, Người Giữ Tổ',  map:'comoc',      x:520,  y:480,  img:'assets/npcs/thumo.png',     talk:'quest',
    lore:'"Còn hai trăm quả trứng chưa nở. Ta ở lại vì thế. Ngươi ở lại vì cái gì?"' },
  { id:'ttmon',     name:'Liora, Ẩn Sĩ Frostmire', map:'tuyettinh',  x:520,  y:950,  img:'assets/npcs/ttmon.png',     talk:'quest',
    lore:'"Mỗi sáng ta lại chép: hôm nay vale giống Lunacia ít hơn hôm qua một chút."' },
  { id:'noiung',    name:'Dax, Kẻ Do Thám',      map:'mongco',     x:520,  y:950,  img:'assets/npcs/noiung.png',    talk:'quest',
    lore:'"Ba năm nằm đây đếm quân địch. Tin xấu: ta đếm hết rồi, và con số đó không cứu được ai."' },
  { id:'laotuong',  name:'Lão Tướng Brann',      map:'nhanmon',    x:520,  y:950,  img:'assets/npcs/laotuong.png',  talk:'quest',
    lore:'"Ta giữ cửa ải này từ trước khi bầu trời nứt. Giờ thứ ta phải giữ lại nằm ở phía bên kia."' },
  { id:'traichu',   name:'Trại Chủ Mục Đồng',      map:'ngoai',      x:1050, y:700,  img:'assets/npcs/traichu.png', talk:'stable',
    lore:'"Tuấn mã hoang ngoài đồng kia đấy — rượt cho nó kiệt sức rồi bấm E mà bắt. Mã Thầu thu được dùng khi thăng giai thú cưỡi!"' }, // GDD Đợt 2 B5
);
NPCS.push(
  { id:'duoclao', name:'Nhà Giả Kim · Xưởng Luyện Đan', map:'tuongduong', x:830, y:760, img:'assets/npcs/duoclao.png', talk:'shop',
    lore:'"Thuốc hay cứu người — nhưng không trả tiền thì thuốc cũng hóa độc đấy."' },
  { id:'binhkhi', name:'Binh Khí Chủ · Vũ Khí Phường', map:'tuongduong', x:1770, y:1060, img:'assets/npcs/binhkhi.png', talk:'shop',
    lore:'"Thép Ardhaven, rèn bên kia vết nứt. Hết lô này là hết, đừng hỏi thêm."' },
  { id:'trachu',  name:'Trà Quán Chủ', map:'tuongduong', x:980, y:1150, img:'assets/npcs/trachu.png', talk:'shop',
    lore:'"Quán này rơi qua đây nguyên vẹn, cả ấm trà. Đời còn cho gì thì nhận nấy."' },
  { id:'quangia', name:'Quản Gia · Động Phủ', map:'tuongduong', x:1590, y:1160, img:'assets/npcs/quangia.png', talk:'abode',
    lore:'"Động phủ của đạo hữu đã dọn sạch — Tụ Linh Trận và Dược Viên chờ chủ nhân."' },
  { id:'bodau', name:'Bổ Đầu · Truy Nã Lệnh', map:'tuongduong', x:1600, y:690, img:'assets/npcs/bodau.png', talk:'trunya',
    lore:'"Hội Đồng Lunaris treo thưởng lũ Chimera lộng hành — mỗi ngày một tên. Làm xong, đến Sảnh Cầu May thử vận."' },
  { id:'thantoan', name:'Thương Nhân Vận May · Sảnh Cầu May', map:'tuongduong', x:820, y:1040, img:'assets/npcs/thantoan.png', talk:'vanduyen',
    lore:'"Một lệnh một lượt quay — năm phần trăm trúng cổ thư hiếm, không đủ vận cũng đừng trách ta."' },
  { id:'vandai', name:'Skyreach Ledge · Vực Thẳm', map:'chungnam', x:2300, y:350, img:'assets/npcs/vachda.png', talk:'tenui',
    lore:'"Vách mây ngàn trượng — kẻ liều mạng nhảy xuống, kẻ sợ chết quay đầu."' },
  { id:'doantruongnhai', name:'Sorrowfall Cliff · Vực Thẳm', map:'tuyettinh', x:350, y:1550, img:'assets/npcs/vachda.png', talk:'tenui',
    lore:'"Vực sâu này đã nuốt chửng không biết bao kẻ — dưới đáy, kẻ may mắn sẽ đổi đời."' },
  { id:'dinhbiennhai', name:'Frontier\'s Edge · Vực Thẳm', map:'nhanmon', x:2250, y:1500, img:'assets/npcs/vachda.png', talk:'tenui',
    lore:'"Gió biên thùy cắt thịt — vận may chỉ dành cho kẻ dám nhảy."' },
);
for (const n of NPCS){ if (!NPC_IMGS[n.id]){ const im = new Image(); im.src = n.img; NPC_IMGS[n.id] = im; } }
function npcName(id){ const n = NPCS.find(x => x.id === id); return n ? n.name : 'Trưởng Làng'; }

// ---------- Chính tuyến: gắn chương I cho 10 NV cũ ----------
QUESTS.forEach(q => {
  // QA regression: chỉ NV1 ở Tương Dương — NV2 trả tại Trưởng Làng, vì cổng thành khóa (reqMain 10)
  // sau khi rời thành, nếu trả NV2 cho Trưởng Lão Rell thì tân thủ bị kẹt cứng không thể vào lại thành.
  if (q.id <= 1){ q.npc = 'quachtinh'; q.map = 'tuongduong'; q.chapter = 'Chương I · Kẻ Từ Thế Giới Khác'; }
  else { q.npc = 'truonglang'; q.map = 'daohoa'; q.chapter = 'Chương I · Petalshade Isle'; }
});
// Chương II — Lunaris City (mở sau khi phá vỏ kén)
QUESTS.push(
  { id:11, lv:10, name:'Nửa Thành Ngoại Lai', chapter:'Chương II · Lunaris City', npc:'quachtinh', map:'tuongduong',
    desc:'Ngươi đã nhớ ra mình là ai. Về Lunaris City trình diện Trưởng Lão Rell — nửa thành này là đá Ardhaven rơi qua cùng ngươi.',
    type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:2000, silver:300} },
  { id:12, lv:11, name:'Thành Không Còn Thuốc', chapter:'Chương II · Lunaris City', npc:'quachtinh', map:'tuongduong',
    desc:'Người tị nạn Axie đổ về thành mỗi ngày, kho thuốc đã cạn. Ra Outskirts ngoài cổng hái 6 Thảo Dược đem về.',
    type:'collect', herbMap:'ngoai', need:6, rew:{xp:2600, silver:350, mat:2} },
  { id:13, lv:12, name:'Chặn Đường Tiếp Tế', chapter:'Chương II · Lunaris City', npc:'quachtinh', map:'tuongduong',
    desc:'Gloam Cựu Binh chặn đoàn xe tị nạn ngoài Outskirts. Diệt 8 tên để đường về thành thông trở lại.',
    type:'kill', mob:'bandit_vet', need:8, rew:{xp:3200, silver:420} },
  { id:14, lv:13, name:'Người Bản Địa Biết Đường', chapter:'Chương II · Lunaris City', npc:'quachtinh', map:'tuongduong',
    desc:'Bản đồ Vaeldra vô dụng ở đây. Gặp Trinh Sát Wren — một Axie thuộc lòng từng lối mòn Lunacia.',
    type:'talk', targetNpc:'monkhach', need:1, rew:{xp:2800, silver:300} },
  { id:15, lv:14, name:'Trụ Khóa Thứ Nhất', chapter:'Chương II · Lunaris City', npc:'quachtinh', map:'tuongduong',
    desc:'Wren dò ra vị trí Trụ Khóa đầu tiên — trong Thornwood Reach. Quét sạch 3 Gloam Marauder canh ngả rẽ ở Petalshade Isle để mở đường lên đó.',
    type:'kill', mob:'assassin', need:3, rew:{xp:4200, silver:500, mat:2} },
);
// Chương III — Thornwood Reach
QUESTS.push(
  { id:16, lv:20, name:'Trụ Thứ Nhất', chapter:'Chương III · Thornwood Reach', npc:'daosi', map:'chungnam',
    desc:'Trụ Khóa đầu tiên nằm sâu trong Thornwood Reach. Gặp Người Gác Rừng Corran ở cửa rừng — ông ta là Axie, và ông ta không ưa người Vaeldra.',
    type:'talk', targetNpc:'daosi', need:1, rew:{xp:5500, silver:600} },
  { id:17, lv:22, name:'Kẻ Đổi Phe', chapter:'Chương III · Thornwood Reach', npc:'daosi', map:'chungnam',
    desc:'Có những kẻ tự nguyện nhận khí Morvahn để đổi lấy sức mạnh — giờ chỉ còn trơ xương trong lớp giáp cũ. Corran gọi chúng là kẻ phản bội. Diệt 6 tên.',
    type:'kill', mob:'phando', need:6, rew:{xp:6500, silver:700} },
  { id:18, lv:26, name:'Nọc Của Vết Nứt', chapter:'Chương III · Thornwood Reach', npc:'daosi', map:'chungnam',
    desc:'Chimera Phun Độc nhả thứ khí làm muông thú tự nguyện đi về phía vết nứt. Diệt 6 con để cắt nguồn.',
    type:'kill', mob:'xanu', need:6, rew:{xp:8000, silver:800, mat:2} },
  { id:19, lv:30, name:'Không Cứu Được Nữa', chapter:'Chương III · Thornwood Reach', npc:'daosi', map:'chungnam',
    desc:'Ba Axie đã bị khí Morvahn ăn hết tâm trí, chặn lối xuống Hollow Roost. Corran nói thẳng: không còn gì để cứu. Kết liễu chúng cho nhẹ nợ.',
    type:'kill', mob:'bandao', need:3, rew:{xp:10000, silver:1000, mat:3} },
);
// Chương IV — Hollow Roost
QUESTS.push(
  { id:20, lv:40, name:'Ổ Ấp Cuối Cùng', chapter:'Chương IV · Hollow Roost', npc:'thumo', map:'comoc',
    desc:'Hollow Roost là ổ ấp lớn nhất Lunacia — giờ im như nghĩa địa. Tìm Sylas, người vẫn ở lại canh những quả trứng chưa nở.',
    type:'talk', targetNpc:'thumo', need:1, rew:{xp:14000, silver:1200} },
  { id:21, lv:43, name:'Tiếng Khóc Trong Đêm', chapter:'Chương IV · Hollow Roost', npc:'thumo', map:'comoc',
    desc:'Oan Hồn Ổ Ấp là những hatchling chết trước khi kịp nở. Đêm nào chúng cũng khóc quanh tổ. Giải thoát 7 con.',
    type:'kill', mob:'thinu', need:7, rew:{xp:17000, silver:1400} },
  { id:22, lv:47, name:'Lính Gác Hỏng', chapter:'Chương IV · Hollow Roost', npc:'thumo', map:'comoc',
    desc:'Axie Golem — lính gác Thủ Hộ Vaeldra ghép từ thân gỗ Lunacia để bảo vệ trứng — đã bị khí Morvahn bẻ lệnh, giờ đập vỡ chính thứ mình canh. Phá hủy 5 con.',
    type:'kill', mob:'mocnhan', need:5, rew:{xp:21000, silver:1600, mat:3} },
  { id:23, lv:52, name:'Kẻ Rút Trứng', chapter:'Chương IV · Hollow Roost', npc:'thumo', map:'comoc',
    desc:'Bầy Dơi Chimera hút cạn trứng trong tổ để nuôi Trụ Khóa mà tướng quân đang chiếm. Diệt 6 con — lối lên Frostmire Vale sẽ mở.',
    type:'kill', mob:'huyetbat', need:6, rew:{xp:26000, silver:1800, mat:3} },
);
// Chương V — Frostmire Vale
QUESTS.push(
  { id:24, lv:60, name:'Thung Lũng Đang Đổi', chapter:'Chương V · Frostmire Vale', npc:'ttmon', map:'tuyettinh',
    desc:'Frostmire Vale đang bị vết nứt viết lại — đất Lunacia hóa dần thành đất Vaeldra. Tìm Liora, người chép lại từng thay đổi mỗi ngày.',
    type:'talk', targetNpc:'ttmon', need:1, rew:{xp:34000, silver:2000} },
  { id:25, lv:63, name:'Những Kẻ Lạc Lối', chapter:'Chương V · Frostmire Vale', npc:'ttmon', map:'tuyettinh',
    desc:'Dân tị nạn Axie chạy vào vale rồi không ra được, hít độc hoa tới mức quên mình là ai, quỳ lạy vết nứt như thánh thần. Giải thoát 7 Kẻ Cuồng Tín.',
    type:'kill', mob:'ttdetu', need:7, rew:{xp:40000, silver:2200} },
  { id:26, lv:68, name:'Gốc Rễ Độc', chapter:'Chương V · Frostmire Vale', npc:'ttmon', map:'tuyettinh',
    desc:'Chimera Cầu Gai kết lại từ chỗ khí vết nứt đọng xuống, độc rỉ theo từng gai. Diệt 6 con — nhớ bật buff hộ thể trước khi vào.',
    type:'kill', mob:'docyeu', need:6, rew:{xp:48000, silver:2600, mat:4} },
  { id:27, lv:73, name:'Mai Phục Trong Sương', chapter:'Chương V · Frostmire Vale', npc:'ttmon', map:'tuyettinh',
    desc:'Tướng quân đã biết ngươi đang đi gỡ từng Trụ Khóa, và gửi sát thủ chặn lối ra Ashen Steppe. Diệt 4 tên.',
    type:'kill', mob:'satthuhy', need:4, rew:{xp:58000, silver:3000, mat:4} },
);
// Chương VI — Ashen Steppe
QUESTS.push(
  { id:28, lv:80, name:'Đếm Quân', chapter:'Chương VI · Ashen Steppe', npc:'noiung', map:'mongco',
    desc:'Cả một đại quân đang tụ trên Ashen Steppe. Tìm Dax ở rìa thảo nguyên — hắn đã nằm đó ba năm chỉ để đếm xem địch đông cỡ nào.',
    type:'talk', targetNpc:'noiung', need:1, rew:{xp:68000, silver:3200} },
  { id:29, lv:83, name:'Bịt Mắt Đại Quân', chapter:'Chương VI · Ashen Steppe', npc:'noiung', map:'mongco',
    desc:'Trinh Sát Tro Tàn rải khắp thảo nguyên, báo về từng bước chân ngươi đi. Diệt 7 tên.',
    type:'kill', mob:'thamtu', need:7, rew:{xp:78000, silver:3600} },
  { id:30, lv:88, name:'Phá Hàng Cung', chapter:'Chương VI · Ashen Steppe', npc:'noiung', map:'mongco',
    desc:'Cung Thủ Tro Tàn giữ hàng sau, bắn phủ đầu cả thảo nguyên. Diệt 6 tên để mở khoảng trống cho đoàn tị nạn rút qua.',
    type:'kill', mob:'cungthu', need:6, rew:{xp:90000, silver:4000, mat:5} },
  { id:31, lv:93, name:'Mũi Nhọn', chapter:'Chương VI · Ashen Steppe', npc:'noiung', map:'mongco',
    desc:'Kỵ Sĩ Tro Tàn là mũi nhọn sẽ chọc thẳng vào Lunaris City. Diệt 4 tên — rồi đường ra Stormgate Pass sẽ mở.',
    type:'kill', mob:'kybinh', need:4, rew:{xp:105000, silver:4500, mat:5} },
);
// Chương VII — Stormgate Pass (chung kết)
QUESTS.push(
  { id:32, lv:100, name:'Dưới Miệng Vết Nứt', chapter:'Chương VII · Stormgate Pass', npc:'laotuong', map:'nhanmon',
    desc:'Stormgate Pass nằm ngay dưới miệng vết nứt. Gặp Lão Tướng Brann — Trụ Khóa cuối cùng ở đây, và ông ta biết chuyện gì xảy ra khi nó gãy.',
    type:'talk', targetNpc:'laotuong', need:1, rew:{xp:120000, silver:5000} },
  { id:33, lv:100, name:'Giữ Phòng Tuyến', chapter:'Chương VII · Stormgate Pass', npc:'laotuong', map:'nhanmon',
    desc:'Cuồng Binh Tro Tàn tràn xuống từng đợt như thủy triều. Diệt 6 tên — sau lưng ngươi là đường rút của cả Lunaris City.',
    type:'kill', mob:'cuongbinh', need:6, rew:{xp:140000, silver:5500} },
  { id:34, lv:100, name:'Thứ Bị Kéo Qua Cùng', chapter:'Chương VII · Stormgate Pass', npc:'laotuong', map:'nhanmon',
    desc:'Chó Ngao Lửa vốn là thú săn của Vaeldra, bị vết nứt kéo qua rồi hóa dại. Thuần hóa 4 con — chúng không có lỗi gì cả.',
    type:'kill', mob:'kylan', need:4, rew:{xp:165000, silver:6000, mat:6} },
  { id:35, lv:100, name:'Trụ Khóa Cuối Cùng', chapter:'Chương VII · Stormgate Pass', npc:'laotuong', map:'nhanmon',
    desc:'Bầy Axie Cuồng Bão canh Trụ Khóa thứ năm. Diệt 5 con — nhưng Brann đã cảnh báo: trụ cuối gãy thì vết nứt mở toang, và Morvahn sẽ bước qua.',
    type:'kill', mob:'daokhach', need:5, rew:{xp:200000, silver:8000, mat:8} },
);

// ---------- Phụ tuyến theo vùng (tối đa 3 active cùng lúc) ----------
// QA: 66 NV phụ đời trước gần 80% là "diệt N con X" lặp đi lặp lại (nhàm chán, trùng nội dung với
// NV chính/mob quanh đó) và không hề dạy người chơi về hàng loạt hệ thống nâng cấp nhân vật đã có
// sẵn trong game (Thần Binh, Lò Hỗn Loạn, Linh Thú, Động Phủ...) — những hệ này trước giờ chỉ có
// 1 dòng toast thoáng qua lúc lên cấp, rất dễ bị bỏ lỡ. Thay bằng 2 nhóm:
// (1) NV "học hệ thống" — mỗi cái dạy đúng 1 cơ chế, rải theo đúng cấp hệ đó mở khoá, dùng
//     sideOnEvent(<type mới>) gọi từ chính hàm nâng cấp/chế tạo của hệ đó (xem các chỗ gọi
//     sideOnEvent bên dưới trong game.js — upgradeThanBinh/chaosCombine/tryTame/harvestSeed);
// (2) NV "cầu nối cốt truyện" (type:'talk', giữ nguyên từ bản cũ) — không nhàm vì không phải
//     đánh quái lặp lại, chỉ là mắt xích đưa người chơi qua vùng mới.
const SIDE_QUESTS = [
  // ── Học hệ thống — mỗi NV dạy đúng 1 cơ chế nâng cấp nhân vật ──
  { id:'s_sys2', npc:'monkhach',  map:'ngoai',      reqLv:11,  reqMain:10, name:'Trại Ngựa Ngoại Ô',      desc:'Bắt 3 Tuấn Mã Hoang ngoài đồng cỏ Outskirts (rượt đến kiệt sức rồi bấm E) để có thú cưỡi đầu tiên.', type:'catch', need:3, rew:{xp:1800, silver:300, mat:2, thau:1} },
  { id:'s_sys3', npc:'quachtinh', map:'tuongduong', reqLv:12,  reqMain:10, name:'Vũ Khí Của Riêng Ngươi', desc:'Mỗi lớp đều có một Thần Binh đồng hành — xem ở Nhân Vật → Thông Tin. Hãy nâng nó lên tầng kế tiếp bằng Nội Đan và Tinh Thạch.', type:'thanbinh', need:1, rew:{xp:2000, silver:300, mat:3} },
  { id:'s_sys4', npc:'monkhach',  map:'ngoai',      reqLv:17,  reqMain:12, name:'Thu Phục Linh Thú',      desc:'Cần Phong Linh Phù (mua ở Vũ Khí Phường). Đánh một tinh anh xuống dưới 40% máu rồi thu phục nó làm Linh Thú đồng hành.', type:'tame', need:1, rew:{xp:2500, silver:350, mat:2} },
  { id:'s_sys5', npc:'quachtinh', map:'tuongduong', reqLv:19,  reqMain:12, name:'Lò Hỗn Loạn',            desc:'Dư ít nhất 3 món cùng phẩm? Mang đến Lò Rèn Hoàng Gia, ném vào Lò Hỗn Loạn thử vận may lên phẩm cao hơn.', type:'chaos', need:1, rew:{xp:3500, silver:450, mat:3} },
  { id:'s_sys7', npc:'quachtinh', map:'tuongduong', reqLv:32,  reqMain:17, name:'Vườn Dược Động Phủ',     desc:'Ghé Động Phủ (gặp Quản Gia), gieo một luống dược viên rồi quay lại thu hoạch.', type:'garden', need:1, rew:{xp:14000, silver:1000, mat:3} },
  // ── Cầu nối cốt truyện — dẫn người chơi qua từng vùng mới, không đánh quái lặp lại ──
  { id:'s_b1', npc:'quachtinh', map:'chungnam',   reqLv:18,  reqMain:14, name:'Lễ Vật Rừng Gai',        desc:'Đem lễ vật của Trưởng Lão Rell lên Thornwood Reach giao cho Corran — đáp lễ nghĩa cử năm xưa.', type:'talk', targetNpc:'daosi', need:1, rew:{xp:1800, silver:260} },
  { id:'s_b2', npc:'daosi',     map:'comoc',      reqLv:36,  reqMain:18, name:'Thăm Hỏi Hollow Roost',  desc:'Tin tức từ Hollow Roost đã bặt nhiều năm — sang thăm Sylas hỏi thăm tình hình.', type:'talk', targetNpc:'thumo', need:1, rew:{xp:3500, silver:400} },
  { id:'s_b3', npc:'thumo',     map:'tuyettinh',  reqLv:55,  reqMain:22, name:'Bức Thư Gửi Frostmire',  desc:'Sylas có một bức thư gửi Liora — chuyện xưa giữa hai người vẫn còn dang dở.', type:'talk', targetNpc:'ttmon', need:1, rew:{xp:12000, silver:900} },
  { id:'s_b4', npc:'ttmon',     map:'mongco',     reqLv:75,  reqMain:26, name:'Mật Tín Ashen Steppe',   desc:'Đưa mật tín cho Dax ở rìa Ashen Steppe — đường đi ngàn dặm, cẩn thận.', type:'talk', targetNpc:'noiung', need:1, rew:{xp:28000, silver:1800} },
  { id:'s_b5', npc:'noiung',    map:'nhanmon',    reqLv:100, reqMain:30, name:'Tin Tức Biên Ải',        desc:'Đưa tin về tình hình thảo nguyên cho Lão Tướng Brann ở Stormgate Pass.', type:'talk', targetNpc:'laotuong', need:1, rew:{xp:50000, silver:3500} },
  { id:'s_b6', npc:'laotuong',  map:'tuongduong', reqLv:115, reqMain:33, name:'Báo Tin Thắng Trận',     desc:'Về Lunaris City báo cho Trưởng Lão Rell tin cửa ải đã giữ vững.', type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:55000, silver:3500} },
];

function sideActive(){ return Object.keys(sideStates).filter(id => sideStates[id].st === 'active' || sideStates[id].st === 'done'); }
function sideAvail(q){
  const st = sideStates[q.id];
  if (st) return st.st; // active | done | claimed
  if (player.level < q.reqLv || questIdx < q.reqMain) return 'locked';
  if (sideActive().length >= 3) return 'full';
  return 'avail';
}
function sideOnKill(mobType, _source){
  for (const q of SIDE_QUESTS){
    const st = sideStates[q.id];
    if (!st || st.st !== 'active' || q.type !== 'kill' || q.mob !== mobType) continue;
    st.prog++;
    if (st.prog >= q.need){
      st.st = 'done';
      addFloat(player.x, player.y-60, `Phụ tuyến hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13);
      AudioSys.sfx('quest', 0.7);
    }
  }
}
function sideOnEvent(type){
  for (const q of SIDE_QUESTS){
    const st = sideStates[q.id];
    if (!st || st.st !== 'active' || q.type !== type) continue;
    if (type === 'catch' && q.map && q.map !== curMap) continue; // GDD Đợt 2 B5: ngựa phải đúng vùng
    st.prog++;
    addFloat(player.x, player.y-40, `${q.name} ${st.prog}/${q.need}`, '#8fd18f', 12);
    if (st.prog >= q.need){
      st.st = 'done';
      addFloat(player.x, player.y-60, `Phụ tuyến hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13);
      AudioSys.sfx('quest', 0.7);
    }
  }
}
window.acceptSide = function(id){
  const q = SIDE_QUESTS.find(x => x.id === id);
  if (!q || sideAvail(q) !== 'avail') return;
  sideStates[id] = { st:'active', prog:0 };
  AudioSys.sfx('quest', 0.8);
  addFloat(player.x, player.y-40, `Nhận phụ tuyến: ${q.name}`, '#9fd0ff', 13);
  saveGame();
  const n = NPCS.find(x => x.id === q.npc); if (n) renderQuestNpc(n);
};
window.turnInSide = function(id){
  const q = SIDE_QUESTS.find(x => x.id === id);
  if (!q || !sideStates[id] || sideStates[id].st !== 'done') return;
  player.silver += q.rew.silver || 0;
  player.mat += q.rew.mat || 0;
  if (q.rew.thau){ player.maThau = (player.maThau || 0) + q.rew.thau; addFloat(player.x, player.y-62, `+${q.rew.thau} 🪢 Mã Thầu`, '#7fd8e0', 13); } // GDD Đợt 2 B5
  gainXp(q.rew.xp || 0);
  sideStates[id] = { st:'claimed', prog:q.need };
  AudioSys.sfx('quest', 0.9);
  addFloat(player.x, player.y-46, `Hoàn thành phụ tuyến: ${q.name}!`, '#7ecbff', 14);
  closePanels(); saveGame();
};

// ---------- Khóa map: đủ cấp + xong chương trước ----------
MAPS.tuongduong.reqMain = 10; // xong Chương I (phá Bình Cảnh)
MAPS.chungnam.reqMain   = 15; // xong Chương II
MAPS.comoc.reqMain      = 19; // xong Chương III
MAPS.tuyettinh.reqMain  = 23; // xong Chương IV
MAPS.mongco.reqMain     = 27; // xong Chương V
MAPS.nhanmon.reqMain    = 31; // xong Chương VI
// BẢN THỬ NGHIỆM: mở toàn bộ map (đặt false để bật lại khóa theo cấp + nhiệm vụ)
let OPEN_ALL_MAPS = false; // QA endgame F1: cổng map phải có hiệu lực — cấp/điều kiện NV kiểm soát tiến trình (true chỉ dùng khi dev test)
function mapGate(id){
  if (OPEN_ALL_MAPS) return { ok:true };
  const md = MAPS[id];
  if (player.level < md.min) return { ok:false, why:'lv', need:md.min };
  // QA regression: NV1 (gặp Quách Đại Hiệp) diễn ra trong thành — tân thủ chưa xong NV1
  // thì không thể bị khóa ngoài cổng thành, tránh kẹt cứng chính tuyến ngay từ đầu.
  if (id === 'tuongduong' && questIdx < 1) return { ok:true };
  if (md.reqMain && questIdx < md.reqMain){
    const rq = QUESTS[md.reqMain - 1];
    return { ok:false, why:'quest', quest: rq ? rq.name : '', chapter: rq ? rq.chapter : '' };
  }
  return { ok:true };
}
window.travelTo = function(mapId, from){
  const md = MAPS[mapId];
  if (!md || !player) return;
  const g = mapGate(mapId);
  if (!g.ok && !window.TEST_MODE){
    const msg = g.why === 'lv' ? `Cần cấp ${g.need} để vào ${md.name}!`
      : `Chưa rõ đường đến ${md.name} — hãy hoàn thành "${g.quest}"!`;
    addFloat(player.x, player.y-40, msg, '#ff7a6a', 14);
    AudioSys.sfx('hurt', 0.4);
    return;
  }
  curMap = mapId;
  closePanels();
  tutAdvance('map'); // hướng dẫn tân thủ: dịch chuyển lần đầu
  AudioSys.playBgm(BGM_TRACKS[mapId]);
  buildWorld();
  DGN = null;
  // QA: điểm neo AUTO trỏ về map cũ nếu không xoá ở đây — auto farm có thể kéo người chơi rời
  // xa khỏi quái vừa xuất hiện ở map mới (kể cả lao vào chỗ chết ở phó bản PK). Xoá để auto tự
  // neo lại đúng vị trí mới (xem game.js AUTO FARM: player._autoAX == null → neo tại player.x/y);
  // nếu là phó bản, startDungeonRun()/nextDungeonWave() ngay dưới sẽ ghi đè bằng neo riêng của nó.
  player._autoAX = null; player._autoAY = null;
  player._autoZone = null; player._autoZoneLocked = false; // QA: bãi quái khoá ở map cũ không còn nghĩa gì ở map mới
  if (md.dungeon) startDungeonRun(mapId);
  const sp = (from && md.spawnFrom && md.spawnFrom[from]) || md.spawn;
  player.x = sp.x; player.y = sp.y;
  collideCityWalls(); // chắc chắn không spawn lọt tường
  const _fp = nearestFree(curMap, player.x, player.y); player.x = _fp.x; player.y = _fp.y; // GDD Đợt 2 A: không spawn vào vùng cấm
  player.hintOff = {}; // B3: qua map mới → các Nhắc Việc đã tắt hiện lại
  snapCamera(); // đổi map: camera đặt thẳng vào vị trí mới, không pan từ map cũ
  if (md.type === 'safe') player.pk = false;
  const zt = zoneType();
  // daohoa không bị khoá theo reqMain (mở sẵn từ đầu) nên câu dẫn nhập Ngũ Trụ của nó
  // được gắn vào đúng thời điểm đặt chân tới lần đầu, thay cho banner tên vùng thường
  const _daohoaFirst = mapId === 'daohoa' && !(player.wpUnlocked && player.wpUnlocked.daohoa);
  const _rlore = _daohoaFirst && typeof REGION_UNLOCK_LORE !== 'undefined' ? REGION_UNLOCK_LORE.daohoa : null;
  zoneBanner = _rlore ? { text:'🗺 ' + md.name, sub:_rlore.sub, color:'#ffd76a', t:4.5 }
                       : { text: md.name, sub: `${zt.name} — ${md.desc}`, color: zt.color, t: 3.2 };
  addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:zt.color, big:true });
  // Điểm dịch chuyển: lần đầu đặt chân tới 1 vùng (dù được nhiệm vụ dẫn tới hay tự dịch chuyển
  // khi vừa đủ điều kiện) sẽ mở khoá nút "Dịch Chuyển" cho vùng đó trong Bản Đồ (M) từ giờ về sau.
  if (!player.wpUnlocked) player.wpUnlocked = {};
  if (!md.dungeon && !player.wpUnlocked[mapId]){
    player.wpUnlocked[mapId] = true;
    addFloat(player.x, player.y - 70, '🚩 Đã mở khoá điểm dịch chuyển: ' + md.name, '#ffd76a', 14);
    AudioSys.sfx('quest', 0.8);
  }
  calcDerived(); saveGame();
};

// ---------- Map panel: vùng chưa mở = ??? ----------
function renderMapPanel(){
  const zt = zoneType();
  let html = `<h3>Bản Đồ Lunacia</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12px;color:#9aa8d4;margin-bottom:6px">Đang ở: <b style="color:${zt.color}">${mapDef().name}</b> · ${zt.name} · <span style="opacity:.7">Nhiệm vụ: phím Q</span>${window.TEST_MODE ? ' · <span style="color:#7fd4ff">[CHẾ ĐỘ TEST — dịch chuyển tự do]</span>' : ''}</div>`;
  // GDD Đợt 2 B2: badge mục tiêu NV trên từng vùng
  const _qt = questTarget(currentQuest());
  const _sqMaps = {};
  for (const sq of SIDE_QUESTS){
    const _st = sideStates[sq.id];
    if (_st && _st.st !== 'claimed'){ const _t2 = sideQuestTarget(sq); if (_t2) _sqMaps[_t2.map] = true; }
  }
  const _badge = (mid) => `${_qt && _qt.map === mid ? ' <span title="Mục tiêu nhiệm vụ chính tuyến" style="color:#ffd76a;font-weight:700">❗</span>' : ''}${_sqMaps[mid] ? ' <span title="Mục tiêu phụ tuyến đang làm" style="color:#7fd4ff;font-weight:700">◈</span>' : ''}`;

  for (const id in MAPS){
    const m = MAPS[id], z2 = ZONE_TYPES[m.type];
    if (m.dungeon && !window.TEST_MODE) continue; // phó bản chỉ vào qua cổng dịch chuyển — không hiện ở đây (trừ chế độ test)
    const g = mapGate(id), cur = id === curMap;
    if (window.TEST_MODE){
      // playtest: hiện đủ tên mọi map + phó bản, dịch chuyển tự do
      html += `<div class="map-row" style="${cur?'border-color:#7ecbff;background:rgba(76,141,255,.1)':''}">
        <span style="flex:1"><span class="m-name">${m.name}</span>${_badge(id)}
          <span style="font-size:10.5px;opacity:.6"> · LV ${m.range}</span>
          <span class="zone-badge" style="color:${z2.color};border-color:${z2.color}">${m.dungeon ? 'PHÓ BẢN' : z2.name}</span>
          <div class="m-desc">${m.desc}</div>${bandSummaryHtml(m)}</span>
        <span class="m-side">${cur ? '<span style="color:#7ecbff;font-size:11px">ĐANG Ở ĐÂY</span>'
          : `<button class="mini-btn" onclick="travelTo('${id}')">Dịch Chuyển</button>`}</span></div>`;
      continue;
    }
    if (!g.ok){
      // vùng chưa mở — che giấu tên thật, chỉ gợi ý điều kiện mở khóa (đủ cả 2)
      const hints = [];
      if (player.level < m.min) hints.push(`Cần đạt cấp ${m.min}`);
      if (m.reqMain && questIdx < m.reqMain){
        const rq = QUESTS[m.reqMain - 1];
        hints.push(`Hoàn thành "${rq.name}" (${rq.chapter})`);
      }
      html += `<div class="map-row map-locked">
        <span style="flex:1"><span class="m-name" style="color:#6a6255">??? Vùng Đất Chưa Biết</span>
          <span class="zone-badge" style="color:#6a6255;border-color:#6a6255">CHƯA MỞ</span>
          <div class="m-desc" style="opacity:.55">Chưa ai kể cho ngươi về vùng đất này…<br>🔒 ${hints.join('<br>🔒 ')}</div></span>
        <span class="m-side"><span style="font-size:16px;opacity:.5">🔒</span></span></div>`;
      continue;
    }
    const wpOk = player.wpUnlocked && player.wpUnlocked[id];
    html += `<div class="map-row" style="${cur?'border-color:#7ecbff;background:rgba(76,141,255,.1)':''}">
      <span style="flex:1"><span class="m-name">${m.name}</span>${_badge(id)}
        <span style="font-size:10.5px;opacity:.6"> · LV ${m.range}</span>
        <span class="zone-badge" style="color:${z2.color};border-color:${z2.color}">${z2.name}</span>
        <div class="m-desc">${m.desc}${!wpOk && !cur ? '<br><span style="color:#f0a03a">🚩 Chưa mở khoá điểm dịch chuyển — cần được nhiệm vụ dẫn tới đó 1 lần trước</span>' : ''}</div>${bandSummaryHtml(m)}</span>
      <span class="m-side">${cur ? '<span style="color:#7ecbff;font-size:11px">ĐANG Ở ĐÂY</span>' : ''}
        ${wpOk && !cur ? `<button class="mini-btn" onclick="travelTo('${id}')">Dịch Chuyển</button>` : ''}
        ${!wpOk ? '<span style="font-size:11px;color:#6a6255" title="Đã đủ điều kiện, nhưng chưa từng đặt chân tới">🚩 Chưa mở khoá</span>' : ''}
        ${wpOk && m.packs && m.packs.length ? `<button class="mini-btn" style="margin-left:4px" onclick="openStageSelect('${id}')" title="Vào đánh ngay 1 cụm quái — không cần đi bộ tới">⚔ Chọn Trận</button>` : ''}</span></div>`;
  }
  el('panel-map').innerHTML = html;
}
// ═══════════ Chọn Trận (GDD Đợt 3 — kiểu NGU Idle): chọn thẳng 1 cụm quái từ danh sách,
// vào là dịch chuyển tới + tự bật AUTO luôn — bỏ hẳn việc phải đi bộ/né vật cản để tìm bãi quái. ═══════════
window.openStageSelect = function(mapId){
  closePanels();
  renderStageSelect(mapId);
  el('panel-stage').classList.remove('hidden');
  AudioSys.sfx('ui', 0.6);
};
function renderStageSelect(mapId){
  const md = MAPS[mapId];
  let html = `<h3>Chọn Trận — ${md.name}</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12px;color:#9aa8d4;margin-bottom:8px">Chọn 1 cụm quái để vào đánh ngay — AUTO tự bật khi vào trận, không cần tự đi bộ tới.</div>`;
  const packs = (md.packs || [])
    .map((pk,i)=>({ pk, i, mdef:MOBS[pk.mob] }))
    .filter(x=>x.mdef)
    .sort((a,b)=>(a.mdef.lv||0)-(b.mdef.lv||0));
  if (!packs.length) html += `<div style="opacity:.5;font-size:12px;padding:8px">Vùng này không có cụm quái để chọn (khu an toàn/thành thị).</div>`;
  for (const { pk, i, mdef } of packs){
    const gap = (mdef.lv||1) - player.level;
    let tag, color;
    if (gap > 15){ tag = 'NGUY HIỂM'; color = '#ff6b6b'; }
    else if (gap > 5){ tag = 'THỬ THÁCH'; color = '#ffb15c'; }
    else if (gap < -15){ tag = 'QUÁ DỄ'; color = '#6a6255'; }
    else { tag = 'VỪA SỨC'; color = '#7ec850'; }
    html += `<div class="map-row">
      <span style="flex:1"><span class="m-name">${mdef.name} ×${pk.n}</span>
        <span style="font-size:10.5px;opacity:.6"> · Lv ${mdef.lv||1}</span>
        <span class="zone-badge" style="color:${color};border-color:${color}">${tag}</span></span>
      <span class="m-side"><button class="mini-btn" onclick="enterStage('${mapId}',${i})">⚔ Vào Đánh</button></span></div>`;
  }
  // BOSS VÙNG — Vệ Binh Trụ (3) + Cổng Vực (1): tách riêng khỏi quái thường, vì AUTO farm tự tạm dừng gần
  // boss theo thiết kế sẵn có (phải tự đánh tay) — nên chỉ đưa người chơi tới gần, không bật AUTO.
  const bd = BOSS_DEFS[mapId];
  if (bd){
    html += `<div class="stat-sec">BOSS VÙNG — cần tự đánh tay, AUTO không tự đánh boss</div>`;
    const bosses = [...bd.thuve.map(x=>({def:x, kind:'thuve'})), { def:bd.tranai, kind:'tranai' }];
    for (const { def, kind } of bosses){
      const gap = (def.lv||1) - player.level;
      let tag, color;
      if (gap > 15){ tag = 'NGUY HIỂM'; color = '#ff6b6b'; }
      else if (gap > 5){ tag = 'THỬ THÁCH'; color = '#ffb15c'; }
      else { tag = 'VỪA SỨC'; color = '#7ec850'; }
      html += `<div class="map-row">
        <span style="flex:1"><span class="m-name">${kind === 'tranai' ? '👑 ' : '★ '}${def.name}</span>
          <span style="font-size:10.5px;opacity:.6"> · Lv ${def.lv||1}</span>
          <span class="zone-badge" style="color:${color};border-color:${color}">${tag}</span></span>
        <span class="m-side"><button class="mini-btn" onclick="enterBossStage('${mapId}','${def.id}')">⚔ Đến Gần</button></span></div>`;
    }
  }
  // PHÓ BẢN — dùng lại nguyên travelTo() sẵn có, không cần đi bộ tới cổng dịch chuyển vật lý.
  const dgId = 'pb_' + mapId;
  if (MAPS[dgId]){
    html += `<div class="stat-sec">PHÓ BẢN</div>
      <div class="map-row"><span style="flex:1"><span class="m-name">${MAPS[dgId].name}</span>
        <span style="font-size:10.5px;opacity:.6"> · Lv ${MAPS[dgId].min}+</span></span>
        <span class="m-side"><button class="mini-btn" onclick="travelTo('${dgId}')">⚔ Vào Phó Bản</button></span></div>`;
  }
  el('panel-stage').innerHTML = html;
}
window.enterStage = function(mapId, packIdx){
  const md = MAPS[mapId];
  const pk = md && md.packs && md.packs[packIdx];
  if (!pk || !player) return;
  if (curMap !== mapId) travelTo(mapId);
  let tx = pk.x, ty = pk.y;
  // Né bãi quái nằm sát Vệ Binh Trụ/Cổng Vực vùng: nếu không né, vừa tới AUTO đã tự tạm dừng vì phát
  // hiện boss trong 300px (xem update()) nhưng vẫn đứng nguyên chịu đòn từ cả bãi quái lẫn boss —
  // đặc biệt nguy hiểm với nhân vật cấp thấp ở bãi quái đầu tiên. Phát hiện qua QA level 1→120.
  const _bd = BOSS_DEFS[mapId];
  if (_bd) for (const b of [..._bd.thuve, _bd.tranai]){
    const bx = b.x*MAP.w, by = b.y*MAP.h;
    const d = dist(tx, ty, bx, by);
    if (d > 0 && d < 340){ const ang = Math.atan2(ty-by, tx-bx); tx = bx + Math.cos(ang)*340; ty = by + Math.sin(ang)*340; }
  }
  player.x = tx; player.y = ty;
  const _f = nearestFree(mapId, player.x, player.y); player.x = _f.x; player.y = _f.y;
  player.auto = true; player._autoAX = player.x; player._autoAY = player.y; updateAutoBtn();
  snapCamera(); closePanels();
  const mdef = MOBS[pk.mob];
  addFloat(player.x, player.y-56, '⚔ Vào trận: ' + (mdef ? mdef.name : pk.mob) + ' — AUTO đã bật', '#ffd76a', 14);
  AudioSys.sfx('ui', 0.5);
  saveGame();
};
// Boss vùng: chỉ đưa người chơi tới gần, KHÔNG tự bật AUTO — Vệ Binh Trụ/Cổng Vực cần tự đánh tay
// theo đúng thiết kế sẵn có (auto tự tạm dừng trong bán kính 400 quanh boss, xem cập nhật player).
window.enterBossStage = function(mapId, bossId){
  const bd = BOSS_DEFS[mapId];
  if (!bd || !player) return;
  const def = (bd.tranai && bd.tranai.id === bossId) ? bd.tranai : bd.thuve.find(x=>x.id===bossId);
  if (!def) return;
  if (curMap !== mapId) travelTo(mapId);
  player.x = def.x*MAP.w; player.y = def.y*MAP.h;
  const _f = nearestFree(mapId, player.x, player.y); player.x = _f.x; player.y = _f.y;
  snapCamera(); closePanels();
  const liveBoss = mobs.some(m => m.def && m.def.bossId === bossId && !m.dead);
  addFloat(player.x, player.y-56, liveBoss ? ('⚔ Đã tới: ' + def.name + ' — tự chiến đấu thôi!') : (def.name + ' đang hồi sinh, chờ chút…'),
    '#ffb15c', 14);
  AudioSys.sfx('ui', 0.5);
  saveGame();
};

// ---------- Danh hiệu kết thúc chính tuyến ----------
TITLES.push({ id:'mochiton', name:'Huyễn Ảnh Chí Tôn', color:'#ffd76a',
  cond: p => !!p.mongChiTon, desc:'Hoàn thành toàn bộ chính tuyến', stats:{ allPct:0.20 }, vfx:'long' });

// ---------- Nói chuyện: hoàn thành NV loại "talk" trước khi mở dialog ----------
function questOnTalk(npc){
  const q = currentQuest();
  if (q && questState === 'active' && q.type === 'talk' && q.targetNpc === npc.id){
    questProg = 1; questState = 'done';
    AudioSys.sfx('quest', 0.8);
    addFloat(player.x, player.y-46, 'Nhiệm vụ hoàn thành!', '#8fd18f', 14);
  }
  for (const sq of SIDE_QUESTS){
    const st = sideStates[sq.id];
    if (st && st.st === 'active' && sq.type === 'talk' && sq.targetNpc === npc.id){
      st.prog = 1; st.st = 'done';
      AudioSys.sfx('quest', 0.8);
    }
  }
}

// ═══════════ AI NPC — trò chuyện tự do bằng LLM (GĐ1: 3 NPC thí điểm) ═══════════
// Fallback tuyệt đối: server/LLM không khả dụng → ẩn ô chat hoặc báo bận, game không vỡ.
const AI_NPCS = { truonglang:1, duoclao:1, quachtinh:1 };
let aiNpcOn = null; // null = đang kiểm tra · true/false
(function aiNpcPing(){
  if (!window.fetch){ aiNpcOn = false; return; }
  fetch('/api/trpc/npc.status?input=' + encodeURIComponent('{"json":null}'))
    .then(r => r.json())
    .then(d => { aiNpcOn = !!(d && d.result && d.result.data && d.result.data.json && d.result.data.json.enabled); })
    .catch(() => { aiNpcOn = false; });
})();
function aiEsc(s){ return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c])); }
function aiChatBlock(npcId){
  if (!AI_NPCS[npcId] || aiNpcOn === false) return '';
  return `<div style="margin-top:10px;border-top:1px dashed rgba(76,141,255,.3);padding-top:8px">
    <div style="font-size:11.5px;color:#9aa8d4;margin-bottom:5px">💬 TRÒ CHUYỆN TỰ DO <span style="opacity:.6">— hỏi gì cũng được, họ sẽ đáp theo cách riêng của mình</span></div>
    <div id="ai-chat-reply" style="font-size:12.5px;color:#e4ebff;line-height:1.6"></div>
    <div style="display:flex;gap:6px;margin-top:5px">
      <input id="ai-chat-input" maxlength="200" placeholder="Nói gì đó…" autocomplete="off"
        style="flex:1;background:rgba(0,0,0,.35);border:1px solid #6a5a3a;border-radius:6px;color:#e4ebff;padding:6px 8px;font-size:12.5px;outline:none"
        onkeydown="if(event.key==='Enter'){event.preventDefault();aiChatSend('${npcId}');}">
      <button class="mini-btn" id="ai-chat-btn" onclick="aiChatSend('${npcId}')">Gửi</button>
    </div></div>`;
}
function aiNpcCtx(){
  const p = player;
  const sect = SECTS[p.sect] ? SECTS[p.sect].name : 'Tán Nhân';
  const realm = (p.dantian && DANTIAN_REALMS[p.dantian.realm]) ? DANTIAN_REALMS[p.dantian.realm].name : 'Hatchling';
  const traits = (p.traits || []).map(tid => { const t = TRAITS.find(x => x.id === tid); return t ? t.name : String(tid); });
  const pers = PERSONALITIES[p.personality] ? PERSONALITIES[p.personality].name : 'Trung Dung';
  const q = currentQuest();
  const g = gameTimeInfo();
  const wx = weatherNow();
  const _hpV = Math.round((p.hp / p.maxHp) * 100); // NaN/Infinity (player chưa init xong) → mặc định 100
  return {
    level: p.level || 1, sect, realm,
    hpPct: Number.isFinite(_hpV) ? Math.max(0, Math.min(100, _hpV)) : 100,
    sin: p.toiac || 0, traits, pers,
    mapName: MAPS[curMap].name, questName: q ? q.name : '',
    season: g.season.name || g.season.id, weather: wx ? wx.name : 'Không rõ',
  };
}
window.aiChatSend = async function(npcId){
  const inp = el('ai-chat-input'), box = el('ai-chat-reply'), btn = el('ai-chat-btn');
  if (!inp || !box) return;
  const msg = inp.value.trim();
  if (!msg) return;
  inp.disabled = true; if (btn) btn.disabled = true;
  box.innerHTML = `<div style="font-size:12px;color:#9aa8d4;font-style:italic;margin-bottom:4px">» ${aiEsc(msg)}</div><div style="opacity:.55;font-size:12px">…</div>`;
  try {
    const res = await fetch('/api/trpc/npc.chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: { npcId, message: msg, ctx: aiNpcCtx() } }),
    });
    const data = await res.json();
    const out = data && data.result && data.result.data && data.result.data.json;
    if (!out || !out.reply) throw new Error('bad reply');
    box.innerHTML = `<div style="font-size:12px;color:#9aa8d4;font-style:italic;margin-bottom:4px">» ${aiEsc(msg)}</div>
      <div style="font-style:italic;color:#e4ebff;line-height:1.65;background:rgba(0,0,0,.25);padding:8px 10px;border-radius:8px">“${aiEsc(out.reply)}”</div>
      ${typeof out.remaining === 'number' && out.remaining <= 5 ? `<div style="font-size:11px;color:#9aa8d4;margin-top:3px">Hôm nay còn ${out.remaining} lượt trò chuyện.</div>` : ''}`;
    AudioSys.sfx('ui', 0.5);
  } catch {
    box.innerHTML = `<div style="font-size:12px;opacity:.55;font-style:italic">(Đang bận — hãy quay lại sau.)</div>`;
  }
  inp.disabled = false; if (btn) btn.disabled = false;
  inp.value = ''; inp.focus();
};

// ---------- Dialog NPC quest giver (chính + phụ theo vùng) ----------
function renderQuestNpc(n){
  questOnTalk(n);
  const panel = el('panel-quest');
  let html = `<h3>${n.name}</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  if (n.lore) html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6;font-style:italic">${n.lore}</div>`;
  const _nsl = typeof npcStoryLine === 'function' ? npcStoryLine() : null;
  if (_nsl) html += `<div style="font-size:12.5px;color:#e8b060;margin-bottom:8px;line-height:1.6;font-style:italic">📜 ${_nsl}</div>`;

  // — Chính tuyến —
  const q = currentQuest();
  if (q && q.npc === n.id){
    if (questState === 'done'){
      html += `<div class="qd-quest" style="border-color:#7ecbff"><div class="q-name" style="color:#7ecbff">★ ${q.name} — Hoàn thành!</div>${q.desc}
        <div class="q-rew">Thưởng: ${q.rew.xp} EXP · ${q.rew.silver||0}◈ ${q.rew.mat?('· '+q.rew.mat+'✦'):''}</div>
        <div style="text-align:center;margin-top:8px"><button class="mini-btn" onclick="turnInQuest()">Nhận Thưởng</button></div></div>`;
    } else {
      const prog = q.type==='talk' ? '—' : (q.type==='meditate' ? `${Math.floor(questProg)}/${q.need}s` : `${questProg}/${q.need}`);
      html += `<div class="qd-quest"><div class="q-name">★ Chính tuyến ${q.id}: ${q.name}</div>${q.desc}
        <div class="q-rew">Tiến độ: ${prog} · Thưởng: ${q.rew.xp} EXP · ${q.rew.silver||0}◈</div></div>`;
    }
  } else if (q){
    const giver = NPCS.find(x => x.id === q.npc);
    html += `<div style="font-size:12px;opacity:.65;margin-bottom:8px">★ Chính tuyến hiện tại: "${q.name}" — hãy đến <b>${MAPS[q.map].name}</b> gặp <b>${giver ? giver.name : ''}</b>.</div>`;
  } else {
    html += `<div style="font-size:12px;opacity:.65;margin-bottom:8px">★ Chính tuyến đã hoàn tất — ngươi chính là Huyễn Ảnh Chí Tôn!</div>`;
  }

  // — Phụ tuyến của NPC này —
  const mine = SIDE_QUESTS.filter(sq => sq.npc === n.id);
  if (mine.length){
    html += `<div style="font-size:11.5px;color:#9aa8d4;margin:6px 0 4px;border-top:1px dashed rgba(76,141,255,.3);padding-top:6px">PHỤ TUYẾN — ${MAPS[n.map].name.toUpperCase()}</div>`;
    for (const sq of mine){
      const st = sideAvail(sq);
      const sts = sideStates[sq.id];
      const prog = sts ? ` ${sts.prog}/${sq.need}` : '';
      const rew = `${sq.rew.xp} EXP · ${sq.rew.silver||0}◈ ${sq.rew.mat?('· '+sq.rew.mat+'✦'):''}`;
      if (st === 'claimed')
        html += `<div class="qd-quest" style="opacity:.55"><div class="q-name" style="color:#8fd18f">✔ ${sq.name}</div>${sq.desc}</div>`;
      else if (st === 'done')
        html += `<div class="qd-quest" style="border-color:#8fd18f"><div class="q-name" style="color:#8fd18f">${sq.name} — Hoàn thành!</div>${sq.desc}
          <div class="q-rew">Thưởng: ${rew}</div>
          <div style="text-align:center;margin-top:6px"><button class="mini-btn" onclick="turnInSide('${sq.id}')">Nhận Thưởng</button></div></div>`;
      else if (st === 'active')
        html += `<div class="qd-quest"><div class="q-name">${sq.name}${prog}</div>${sq.desc}
          <div class="q-rew">Thưởng: ${rew}</div></div>`;
      else if (st === 'avail')
        html += `<div class="qd-quest"><div class="q-name" style="color:#9fd0ff">◈ ${sq.name}</div>${sq.desc}
          <div class="q-rew">Thưởng: ${rew}</div>
          <div style="text-align:center;margin-top:6px"><button class="mini-btn" onclick="acceptSide('${sq.id}')">Nhận Nhiệm Vụ</button></div></div>`;
      else if (st === 'full')
        html += `<div class="qd-quest" style="opacity:.55"><div class="q-name">◈ ${sq.name}</div>${sq.desc}
          <div class="q-rew">Đang nhận tối đa 3 phụ tuyến — hoàn thành bớt rồi quay lại.</div></div>`;
      else
        html += `<div class="qd-quest" style="opacity:.45"><div class="q-name">🔒 ${sq.name}</div>
          <div class="q-rew">Cần cấp ${sq.reqLv} · Tiến độ chính tuyến chưa đủ</div></div>`;
    }
  }

  // — Bí kíp Huyết Ma Thôn Phệ (Trưởng Làng) —
  if (n.id === 'truonglang' && player.bikip){
    if (player.bikip.hmtp){
      html += `<div class="qd-quest" style="border-color:#e84a6a"><div class="q-name" style="color:#e84a6a">☠ Huyết Ma Thôn Phệ — Đã Luyện Thành</div>
        Mỗi đòn đánh hút 10% sát thương gây ra thành sinh lực.</div>`;
    } else {
      const pcs = player.bikip.pieces;
      html += `<div class="qd-quest"><div class="q-name" style="color:#e84a6a">Cổ Thư Thất Truyền — Huyết Ma Thôn Phệ</div>
        Mảnh cổ thư: <b>Thượng ×${pcs[0]}</b> · <b>Trung ×${pcs[1]}</b> · <b>Hạ ×${pcs[2]}</b><br>
        <span style="opacity:.7;font-size:12px">Đánh bại Thủ Lĩnh Gloam để thu thập mảnh cổ thư (Thượng 40% · Trung 40% · Hạ 20%).</span>`;
      if (pcs[0] > 0 && pcs[1] > 0 && pcs[2] > 0){
        html += `<div style="text-align:center;margin-top:8px"><button class="mini-btn" style="border-color:#e84a6a;color:#e84a6a" onclick="fuseBikip()">Dung Hợp Cổ Thư (30%)</button></div>
          <div style="font-size:11px;opacity:.65;text-align:center">Thất bại không mất tàn quyển — có thể thử lại vô hạn.</div><div id="bikip-msg" style="text-align:center;font-size:12px"></div>`;
      }
      html += `</div>`;
    }
  }
  html += aiChatBlock(n.id);
  panel.innerHTML = html;
  closePanels(); panel.classList.remove('hidden');
}

// ---------- Trả nhiệm vụ chính tuyến (override — thêm mở khóa map) ----------
window.turnInQuest = function(){
  AudioSys.sfx('quest', 0.9);
  const q = currentQuest();
  if (!q || questState !== 'done') return;
  player.silver += q.rew.silver || 0;
  player.mat += q.rew.mat || 0;
  if (q.rew.item && player.inv.length < 30){
    const gi = genSpecific(q.rew.item, 0, Math.max(1, player.level));
    player.inv.push(gi);
    addFloat(player.x, player.y-64, `Nhận được: ${gi.name}!`, '#9fd0ff', 14);
  }
  gainXp(q.rew.xp);
  questIdx++;
  questProg = 0;
  questState = questIdx < QUESTS.length ? 'active' : 'all';
  // QA endgame F2: mọi NV chính đều khóa theo cấp yêu cầu (q.lv) — chặn rush cốt truyện vượt cấp
  const nq = currentQuest();
  if (nq && player.level < nq.lv){
    questState = 'locked';
    addFloat(player.x, player.y-64, `"${nq.name}" cần cấp ${nq.lv} (hiện tại ${player.level}) — hãy rèn luyện thêm!`, '#f0a03a', 14);
  }
  if (questIdx === 9 && questState === 'active') spawnBoss(); // quest 10 — boss Đào Hoa
  // thông báo mở khóa vùng mới — câu dẫn nhập Ngũ Trụ thay vì banner khô khan; xếp hàng bằng
  // setTimeout phòng trường hợp 2 vùng cùng chung mốc reqMain (không đè banner của nhau)
  const _newlyOpen = [];
  for (const id in MAPS) if (MAPS[id].reqMain === questIdx) _newlyOpen.push(id);
  _newlyOpen.forEach((id, i) => setTimeout(() => {
    if (!player) return;
    const lore = REGION_UNLOCK_LORE[id];
    zoneBanner = { text:'🗺 ' + MAPS[id].name, sub: lore ? lore.sub : 'Đã mở — bấm M để dịch chuyển', color:'#ffd76a', t: 4.5 };
    addFloat(player.x, player.y-70, `🗺 Đã mở vùng: ${MAPS[id].name}!`, '#ffd76a', 16);
    AudioSys.sfx('levelup', 0.9);
  }, i * 4600));
  if (questState === 'all'){
    player.mongChiTon = true;
    zoneBanner = { text:'HUYỄN ẢNH CHÍ TÔN', sub:'Chính tuyến hoàn tất — danh hiệu tối thượng đã mở (bấm C chọn danh hiệu)', color:'#ffd76a', t: 5 };
    AudioSys.sfx('levelup', 1);
  }
  closePanels(); saveGame();
};

// ---------- Nói chuyện NPC (override — định tuyến theo loại) ----------
function tryTalk(){
  let best = null, bd = 95;
  for (const n of NPCS){
    if (n.map !== curMap) continue;
    const d = dist(player.x, player.y, n.x, n.y);
    if (d < bd){ bd = d; best = n; }
  }
  if (!best) return;
  tutAdvance('npc');
  questOnTalk(best);
  if (best.talk === 'quest'){ renderQuestNpc(best); return; }
  if (best.talk === 'forge'){ renderBaGua(); return; }
  if (best.talk === 'shop') return renderShop(best);
  if (best.talk === 'abode'){ renderAbode(); return; }
  if (best.talk === 'stable'){ renderStable(); return; } // GDD Đợt 2 B5
  if (best.talk === 'trunya'){ renderTruyNa(); return; }
  if (best.talk === 'vanduyen'){ renderVanDuyen(); return; }
  if (best.talk === 'tenui'){ renderTeNui(best); return; }
}
// Hái Thảo Dược (phím J, chạy sau khi đã thử nhặt đồ dưới đất) —
// trả về true nếu vừa hái, để onkeydown chỉ nhảy (doJump) lúc không có gì để hái gần đó
function tryHarvestHerb(){
  if (!player || dead) return false;
  let target = null;
  for (const p of pickups){
    if (p.type !== 'herb' || p.respawn > 0) continue;
    if (dist(player.x, player.y, p.x, p.y) < 36){ target = p; break; }
  }
  if (!target) return false;
  target.respawn = 30;
  addEffect({ type:'spark', x:target.x, y:target.y-6, r:24, color:'#b8e87a' });
  const q = currentQuest();
  let usedForQuest = false;
  if (q && q.type==='collect' && questState==='active'){
    questProg++;
    addFloat(target.x, target.y-20, `Thảo Dược ${questProg}/${q.need}`, '#8fd18f', 12);
    if (questProg >= q.need){ questState='done'; addFloat(player.x, player.y-46, `Nhiệm vụ hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13); }
    usedForQuest = true;
  }
  if (SIDE_QUESTS.some(sq => sq.type === 'collect' && sideStates[sq.id] && sideStates[sq.id].st === 'active')) usedForQuest = true;
  sideOnEvent('collect'); // luôn kiểm tra nhiệm vụ PHỤ thu thập đang active — không phụ thuộc nhiệm vụ chính có phải loại collect hay không
  if (!usedForQuest){
    player.hp = Math.min(player.maxHp, player.hp + 25);
    addFloat(target.x, target.y-20, '+25 HP', '#8fd18f', 11);
  }
  AudioSys.sfx('ui', 0.5);
  return true;
}

// ---------- Vẽ NPC (override — dấu ! / … theo từng NPC) ----------
function drawNpc(){
  for (const n of NPCS){
    if (n.map !== curMap) continue;
    const im = NPC_IMGS[n.id];
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(n.x, n.y+8, 14, 5, 0, 0, 7); ctx.fill();
    if (im && im.complete && im.naturalWidth){
      const nh = 64, nw = nh * (im.naturalWidth/im.naturalHeight);
      ctx.drawImage(im, n.x - nw/2, n.y - nh + 10, nw, nh);
    } else {
      ctx.fillStyle = '#5a4a30';
      ctx.beginPath(); ctx.ellipse(n.x, n.y-8, 11, 15, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8cfa8'; ctx.beginPath(); ctx.arc(n.x, n.y-28, 7, 0, 7); ctx.fill();
    }
    ctx.font = '12px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3;
    if (n.talk === 'quest'){
      const q = currentQuest();
      let mark = '';
      if ((q && q.npc === n.id && questState === 'done') ||
          SIDE_QUESTS.some(sq => sq.npc === n.id && sideStates[sq.id] && sideStates[sq.id].st === 'done'))
        mark = '!';
      else if ((q && q.npc === n.id) ||
               SIDE_QUESTS.some(sq => sq.npc === n.id && (sideAvail(sq) === 'avail' || sideAvail(sq) === 'active')))
        mark = '…';
      if (mark){
        ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = mark === '!' ? '#ffd76a' : '#9fd0ff';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
        ctx.strokeText(mark, n.x, n.y-64); ctx.fillText(mark, n.x, n.y-64);
        ctx.shadowBlur = 0;
        ctx.font = '12px "Be Vietnam Pro", sans-serif';
      }
    }
    if (n.talk === 'trunya' && player.truyna && player.truyna.state === 'killed'){
      ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#ffd76a'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 6;
      ctx.strokeText('!', n.x, n.y-64); ctx.fillText('!', n.x, n.y-64);
      ctx.shadowBlur = 0; ctx.font = '12px "Be Vietnam Pro", sans-serif';
    }
    ctx.fillStyle = '#fff';
    ctx.strokeText(n.name, n.x, n.y-52); ctx.fillText(n.name, n.x, n.y-52);
  }
}

// ---------- Quest tracker (HUD) ----------
function trackerHtml(){
  const q = currentQuest();
  // Tự động ghim đèn hiệu vào mục tiêu chính tuyến hiện tại — người chơi không cần bấm "Tới Ngay"
  // mới có định hướng; chỉ đồng bộ lại khi nhiệm vụ chính đổi (không đè lên đèn hiệu phụ tuyến
  // người chơi vừa tự ghim tay, xem goQuestSide()).
  if (q && window._beaconQuestId !== q.id){
    const t = questTarget(q);
    if (t) player.beacon = { map:t.map, x:t.x, y:t.y, label:t.label, npcId:t.npcId };
    window._beaconQuestId = q.id;
  }
  let qt = '';
  if (q){
    const prog = q.type === 'meditate' ? `${Math.floor(questProg)}/${q.need}s`
      : q.type === 'talk' ? '' : `${questProg}/${q.need}`;
    qt += `<div class="q-title">★ ${q.name}</div>`;
    qt += questState === 'done'
      ? `<div class="q-done">✔ Hoàn thành — về gặp ${npcName(q.npc)} (E)</div>`
      : questState === 'locked'
      ? `<div style="color:#f0a03a">🔒 "${q.name}" cần cấp ${q.lv} (hiện tại cấp ${player.level}).<br>Hãy săn quái rèn luyện thêm rồi quay lại!</div>`
      : `<div>${q.desc}</div>${prog ? `<div style="margin-top:4px;color:#7ecbff">${prog}</div>` : ''}`;
    qt += `<div style="margin-top:5px"><button class="mini-btn" style="font-size:11px;padding:2px 10px" onclick="goQuest()">🧭 Tới Ngay</button></div>`; // GDD Đợt 2 B2
  } else {
    qt += `<div class="q-title">★ Chính tuyến hoàn tất!</div><div>Ngươi là Huyễn Ảnh Chí Tôn — tự do rèn luyện & làm phụ tuyến…</div>`;
  }
  const act = SIDE_QUESTS.filter(sq => sideStates[sq.id] && sideStates[sq.id].st !== 'claimed').slice(0, 2);
  for (const sq of act){
    const st = sideStates[sq.id];
    qt += `<div class="q-side">◈ ${sq.name} — ${st.st === 'done'
      ? `<span style="color:#8fd18f">✔ về gặp ${npcName(sq.npc)}</span>`
      : `<span style="color:#7ecbff">${st.prog}/${sq.need}</span>`}</div>`;
    qt += `<button class="mini-btn" style="font-size:10px;padding:1px 8px;margin-top:2px" onclick="goQuestSide('${sq.id}')">🧭 Tới</button>`; // GDD Đợt 2 B2
  }
  // Mục Tiêu Hôm Nay — checklist nhỏ, định hướng ngày chơi cho tân thủ
  qt += dailyHtml();
  return qt;
}

// ---------- Nhật Ký Nhiệm Vụ (phím Q) — phân theo vùng ----------
window.qlogTab = 'main';
// ═══════════ CỐT TRUYỆN NGŨ ẤN × TÔNG MÔN — manh mối, lời thoại trấn thủ, kết mở ═══════════
const CLUES = {
  manh_lenh:   { name:'Nửa Quân Bài Gloam',      desc:'Nửa quân bài của lính Vaeldra đào ngũ — mặt sau ai đó khắc thêm một con mắt không có tròng.' },
  ban_do_da:   { name:'Bản Đồ Vẽ Sai',           desc:'Hải đồ Vaeldra đánh dấu Lunacia bằng hai chữ "vô chủ". Có người đã gạch đi, viết đè: "CÓ NGƯỜI Ở".' },
  tan_quyen:   { name:'Tàn Quyển «Ngũ Trụ Ký»',  desc:'"…năm trụ ghim Morvahn ở bên kia. Một trụ gãy, bốn trụ lung lay…"' },
  cot_nhan:    { name:'Xương Chim Khắc Chữ',     desc:'Mảnh xương khắc hàng chữ nhỏ của một Axie: "Vết nứt không tự mở. Có kẻ bẻ nó về phía chúng ta."' },
  thiep_den:   { name:'Thư Mời Không Địa Chỉ',   desc:'Thiếp mời dự "lễ mở cổng" — chỉ ghi ngày giờ, không ghi nơi chốn. Mực còn mới.' },
  co_thu:      { name:'Trang Nhật Ký Thủ Hộ',    desc:'"Chúng ta bẻ vết nứt sang đó để cứu Vaeldra. Hôm nay ta mới biết bên đó có người ở. Bốn vạn người."' },
  di_thu:      { name:'Di Thư Người Gác Rừng',   desc:'"Rừng của ta không có lỗi. Nhưng ta vẫn phải đốt nó để chặn khí lan." — nét chữ run rẩy.' },
  phuc_lanh:   { name:'Lệnh Điều Quân',          desc:'Sắc lệnh: "Trụ Mộc đã lung lay — dồn quân về Ashen Steppe, đêm trăng tròn."' },
  buc_hoa:     { name:'Bích Họa Ngũ Trụ',        desc:'Tranh vẽ năm Trụ Khóa cắm khắp Lunacia. Chỗ vẽ trụ thứ nhất giờ chỉ còn một vệt cháy đen.' },
  thu_tinh:    { name:'Lá Thư Chưa Kịp Gửi',     desc:'"Nếu có kiếp sau, ta xin làm dân thường ở một thế giới không ai thèm để ý tới."' },
  lenh_bai_doi:{ name:'Bảng Tên Đội Tiên Phong', desc:'Bảng khắc tên bảy người vượt vết nứt cùng ngươi. Năm cái tên đã bị gạch. Cái thứ sáu là tên ngươi.' },
  co_lenh:     { name:'Quân Lệnh Cũ',            desc:'Văn thư: "Stormgate Pass thất thủ thì cả Lunacia mở toang." Dấu triện đã sáu mươi năm — cũ hơn cuộc giao thoa rất nhiều.' },
  le_thach:    { name:'Đá Khắc Lời Trăng Trối',  desc:'Mảnh đá nhuốm máu: "Đừng tin bất cứ ai nói rằng chuyện này là tai nạn."' },
  mat_lenh:    { name:'Mật Lệnh Rách',           desc:'"…khi đủ năm trụ gãy, Vết Nứt mở toang — Morvahn bước qua, Lunacia thành lò luyện."' },
  thu_cuoi:    { name:'Thư Cuối Của Tướng Quân', desc:'"Ta giữ Stormgate Pass ba mươi năm. Hôm nay ta mở cổng — không phải vì hàng, mà vì đằng nào nó cũng mở."' },
};

const CLUE_DROPS = {
  dh1:'manh_lenh', dh3:'ban_do_da', dh4:'tan_quyen',
  ng2:'cot_nhan', ng4:'thiep_den',
  cn1:'co_thu', cn4:'di_thu',
  cm4:'phuc_lanh',
  tt1:'buc_hoa', tt4:'thu_tinh',
  mc1:'lenh_bai_doi',
  nm1:'co_lenh', nm2:'le_thach', nm3:'mat_lenh', nm4:'thu_cuoi',
};
const BOSS_LORE = {
  dh1:{ name:'Chúa Heo Rừng', intro:['Grao…! Cái mùi trên người ngươi… không phải mùi của thế giới này!'] },
  dh2:{ name:'Chúa Bầy Gai Tím', intro:['Trăng lên rồi. Trăng ở đây đỏ hơn trước.','Bầy của ta đói từ cái ngày bầu trời nứt ra.'] },
  dh3:{ name:'Chấp Sự Gloam', intro:['Đoàn Gloam không chờ kẻ nhát.','Bọn ta cũng từ bên kia qua thôi — chỉ là bọn ta thôi giả vờ làm anh hùng.'] },
  dh4:{ name:'Thủ Lĩnh Đoàn Gloam', intro:['Ngươi cũng là lính tiên phong hả? Ta từng mặc bộ giáp giống ngươi đấy.','Về đi. Thế giới này hỏng rồi — và chính chúng ta làm nó hỏng.'],
        sect:{ thieulam:'Dark Knight à… đội của ta cũng có một tên như ngươi. Hắn chết ngay lúc vượt qua.' } },
  ng1:{ name:'Đầu Mục Gloam', intro:['Ngoài Outskirts chỉ có một luật — luật của ta!','Lên! Cướp!'] },
  ng2:{ name:'Gai Tím Độc Nhãn', intro:['Một con mắt mất trong đêm bầu trời nứt.','Đêm nay ta lấy lại bằng thịt người.'] },
  ng3:{ name:'Đặc Vụ Gloam', intro:['…','Ta không có tên. Tên ta ở lại bên kia vết nứt rồi.'] },
  ng4:{ name:'Ma Sói Sương Trắng', intro:['Khuôn mặt trắng này nhớ mùi máu lắm.','Trụ Mộc đang rung — ngươi nghe thấy không?'],
        sect:{ baidasan:'Dark Wizard? Độc của ngươi học từ sách. Độc của ta rỉ ra từ vết nứt.' } },
  cn1:{ name:'Kẻ Đổi Phe', intro:['Ngươi gọi ta là phản bội. Ta gọi đó là giữ cho đàn con còn sống.','Người Vaeldra các ngươi thì hiểu gì!'] },
  cn2:{ name:'Golem Gỗ Cổ Đại', intro:['Nghìn năm, thân gỗ này chưa từng gãy.','Rồi bầu trời vỡ trước.'] },
  cn3:{ name:'Trưởng Lão Tha Hóa', intro:['Thornwood từng là nhà của ta…','Trụ Khóa này ghim ta — hay ghim cả Morvahn?'],
        sect:{ toanchan:'Sylvan Ranger… bên thế giới ngươi, rừng có được yên không?' } },
  cn4:{ name:'Tướng Quân Thornwood Reach', intro:['Kiếm của ta chỉ vỡ một lần — lần đó ta thua.','Trụ Thủy do ta canh. Muốn gỡ? Hỏi thanh kiếm này.'],
        sect:{ toanchan:'Sylvan Ranger hậu bối… ra tay đừng nương tình.' } },
  cm1:{ name:'Chỉ Huy Vong Binh', intro:['Ổ ấp này không chờ người sống.','Quân ta chết rồi — nhưng chưa được phép tan.'] },
  cm2:{ name:'Kẻ An Táng Bóng Tối', intro:['Ta chôn hatchling suốt ba năm nay. Chôn không kịp nữa.','Nằm xuống đi, cho nhanh.'] },
  cm3:{ name:'Chúa Tể Bất Tử', intro:['Bất tử không phải phúc — là hình phạt của Morvahn.','Ở lại cùng ta!'] },
  cm4:{ name:'Tướng Quân Hollow Roost', intro:['Ai đánh thức giấc ngủ ngàn năm của lão phu?','Trứng trong tổ này nuôi Trụ Mộc. Ngươi định cứu chúng à? Ngây thơ.'],
        sect:{ bug:'Dark Lord? Ngươi cũng chỉ huy kẻ khác đi chết thay mình thôi, khác gì ta.' } },
  tt1:{ name:'Kẻ Lạc Lối Tuyệt Vọng', intro:['Ta chạy khỏi nhà, chạy vào đây, rồi quên mất nhà ở đâu…','Không còn gì để mất nữa!'] },
  tt2:{ name:'Cỏ Dại Băng Giá', intro:['Băng giá thấm vào từng nhánh cỏ của ta.','Ngươi có đủ ấm để sống sót không? Để ta xem nào.'] },
  tt3:{ name:'Xoáy Sương Nguyền', intro:['Sương giá là thuốc — nó khiến mọi nỗi đau tê liệt.','Đến đây, để ta ru ngươi vào giấc ngủ lạnh lẽo.'] },
  tt4:{ name:'Tướng Quân Frostmire Vale', intro:['Vale này đã chôn biết bao kẻ chạy loạn…','Đến lượt ngươi.'],
        sect:{ thieulam:'Dark Knight, giáp dày thế kia — có che nổi cái ngươi đã làm với thế giới này không?' } },
  mc1:{ name:'Kỵ Sĩ Trưởng Tro Tàn', intro:['Thảo nguyên chỉ nhận kẻ mạnh!','Kỵ sĩ — bày trận!'] },
  mc2:{ name:'Cung Thủ Tinh Nhuệ Tro Tàn', intro:['Một tên một mạng — ta có cả nghìn tên.','Đứng yên nào.'] },
  mc3:{ name:'Thống Lĩnh Tro Tàn', intro:['Tướng Quân truyền lệnh — ta chính là lệnh!','Nghiền nát chúng!'] },
  mc4:{ name:'Tướng Quân Ashen Steppe', intro:['Ngàn dặm tro tàn — vì sao dừng ở đây? Vì Trụ Kim đã gãy!','Kẻ từ bên kia… chứng minh bản lĩnh đi.'],
        sect:{ minhgiao:'Spellblade — nửa hiệp sĩ nửa pháp sư. Nửa vời như thế giới đã đẻ ra ngươi.' } },
  nm1:{ name:'Tướng Quân Bão Tố', intro:['Stormgate Pass ba mươi năm không gãy — hôm nay cũng vậy!','Tướng sĩ! Giữ ải!'] },
  nm2:{ name:'Huyết Sát Bão Tố', intro:['Máu trên giáp ta chưa bao giờ khô.','Thêm một mạng nữa!'] },
  nm3:{ name:'Tướng Quân Cửa Ải', intro:['Thành này cô độc — ta cũng vậy.','Qua đây… nếu ngươi đủ nặng ký.'] },
  nm4:{ name:'Tướng Quân Stormgate Pass', intro:['Ta mở cổng không phải vì hàng — mà vì đằng nào nó cũng mở.','Trụ Khóa cuối cùng… để ta xem ngươi dám gỡ không!'],
        sect:{ bug:'Dark Lord. Morvahn cũng từng là Dark Lord đấy — hắn chỉ đi xa hơn ngươi một chút thôi.' } },
};

// Câu dẫn nhập ngắn khi mở vùng mới (thay banner "ĐÃ MỞ VÙNG MỚI" khô khan) — lấy đúng từ lời
// thoại Tướng Quân trấn giữ (BOSS_LORE.*4) của từng vùng, không bịa thêm để khỏi lệch cốt truyện.
// Tuyettinh không có câu nào nêu tên Ấn cụ thể trong lore gốc nên giữ giọng văn chung.
const REGION_UNLOCK_LORE = {
  tuongduong:{ sub:'Vỏ kén đã phá — trở về Lunaris City trong tiếng hoan hô, chính thức bước vào Chương II.' },
  daohoa:    { sub:'Trụ Hỏa đầu tiên đã rạn nứt tại Petalshade Isle — hành trình của ngươi bắt đầu từ đây.' },
  ngoai:     { sub:'"Trụ Mộc đang rung chuyển — ngươi nghe thấy không?" Dấu hiệu đầu tiên Ngũ Trụ không còn vững.' },
  chungnam:  { sub:'"Trụ Thủy do ta giữ." Một Tướng Quân đơn độc chống đỡ Thornwood Reach.' },
  comoc:     { sub:'"Trụ Mộc đã mục từ lâu — Lunacia mới là thứ bệnh thật sự." Hollow Roost thì thầm điều đó.' },
  tuyettinh: { sub:'Frostmire Vale chôn vùi không chỉ lữ khách lạc lối — có lẽ cả một mảnh Ngũ Trụ.' },
  mongco:    { sub:'"Vì sao dừng ở đây? Vì Trụ Kim đã vỡ!" Ngũ Trụ không còn "sắp vỡ" nữa — đang vỡ thật.' },
  nhanmon:   { sub:'"Trụ Hỏa cuối cùng…" Stormgate Pass — biên ải cuối của Lunacia, trận chiến cuối của Ngũ Trụ.' },
};
// Hàng thoại trấn thủ — thanh bar dưới màn hình, 3.4s/câu
let _btQ = [], _btTimer = null;
function showBossTalk(name, lines){
  const el = document.getElementById('boss-talk');
  if (!el || !lines || !lines.length) return;
  _btQ = lines.slice();
  el.classList.remove('hidden');
  _btRender(el, name);
}
function _btRender(el, name){
  if (!_btQ.length){ el.classList.add('hidden'); return; }
  const line = _btQ.shift();
  el.innerHTML = `<span class="bt-name">${name}</span><span class="bt-line">${line}</span>`;
  clearTimeout(_btTimer);
  _btTimer = setTimeout(() => _btRender(el, name), 3400);
}
function bossIntro(m){
  const L = BOSS_LORE[m.def.bossId];
  if (!L) return;
  if (!player.storySeen) player.storySeen = {};
  player.storySeen[m.def.bossId] = true;
  const lines = L.intro.slice();
  const sl = L.sect && L.sect[player.sect];
  if (sl) lines.push(sl);
  showBossTalk(m.def.name, lines);
}
window.replayBossTalk = function(id){
  const L = BOSS_LORE[id]; if (!L) return;
  const lines = L.intro.slice();
  const sl = L.sect && L.sect[player.sect]; if (sl) lines.push(sl);
  showBossTalk(L.name, lines);
};
// Lời NPC theo tiến độ Ngũ Trụ
function npcStoryLine(){
  const flags = player.storyFlags || {};
  const n = Object.keys(flags).filter(k => k.startsWith('ta_')).length;
  if (flags.ketMo) return 'Bầu trời đỏ như máu… Vết Nứt sắp mở. Người như ngươi — là hy vọng cuối cùng của Lunacia này.';
  if (n === 0) return null;
  if (n < 3) return 'Nghe đồn có Tướng Quân cổ đã ngã xuống… Cả Lunacia bắt đầu xôn xao rồi đấy.';
  if (n < 5) return 'Trời tối hơn mỗi ngày. Nghe nói các bộ lạc đang triệu tập thành viên về giữ lãnh địa.';
  return 'Ngũ Trụ sắp vỡ hết rồi… Ngươi… vẫn định tiếp tục chứ?';
}
// Kết mở — ấn cuối vỡ, Hung Thần sắp giáng thế
function showKetMo(){
  const ov = document.getElementById('overlay');
  if (!ov) return;
  document.getElementById('overlay-inner').innerHTML = `
    <h2 style="color:#ff6b6b">☠ TRỤ CUỐI ĐÃ GÃY</h2>
    <p style="line-height:1.9;font-size:14px">Trụ Khóa thứ năm đổ xuống. Vết Nứt trên bầu trời Lunacia toác ra hết cỡ — <b style="color:#ff8f6b">Morvahn đang bước qua</b>.<br>
    <span style="opacity:.85">Ngươi vượt vết nứt để sửa lại thứ thế giới mình đã gây ra.<br>
    Và để tới được hắn, ngươi vừa tự tay mở toang cánh cửa hắn cần.</span><br>
    <span style="color:#e8b060">Những Axie ở đây chưa từng làm gì nên tội. Giờ chỉ còn ngươi đứng giữa chúng và hắn.<br><i>Chạy về Vaeldra… hay ở lại? Đó là lựa chọn của ngươi.</i></span></p>
    <button class="big-btn" onclick="document.getElementById('overlay').classList.add('hidden')">Ở Lại</button>`;
  ov.classList.remove('hidden');
  AudioSys.sfx('levelup', 0.9);
}

window.setQlogTab = function(t){ window.qlogTab = t; AudioSys.sfx('ui', 0.5); renderQlog(); };
function renderQlog(){
  const p = el('panel-qlog'); if (!p) return;
  let html = `<h3>Nhật Ký Nhiệm Vụ</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="display:flex;gap:8px;margin-bottom:8px">
    <button class="mini-btn ${window.qlogTab === 'main' ? '' : 'danger'}" onclick="setQlogTab('main')">★ Chính Tuyến</button>
    <button class="mini-btn ${window.qlogTab === 'side' ? '' : 'danger'}" onclick="setQlogTab('side')">◈ Phụ Tuyến</button>
    <button class="mini-btn ${window.qlogTab === 'story' ? '' : 'danger'}" onclick="setQlogTab('story')">📜 Nhật Ký</button></div>`;
  if (window.qlogTab === 'main'){
    let lastCh = '';
    QUESTS.forEach((q, i) => {
      if (q.chapter !== lastCh){
        lastCh = q.chapter;
        const opened = mapGate(q.map).ok;
        html += `<div class="ql-ch">${q.chapter} <span style="opacity:.6">· ${opened ? MAPS[q.map].name : '???'}</span></div>`;
      }
      let row;
      if (i < questIdx || questState === 'all')
        row = `<div class="ql-row" style="opacity:.55"><span style="color:#8fd18f">✔</span> ${q.name}</div>`;
      else if (i === questIdx){
        const prog = q.type === 'talk' ? '' : ` <span style="color:#7ecbff">${questProg}/${q.need}</span>`;
        row = `<div class="ql-row ql-cur"><span style="color:#7ecbff">▶</span> <b>${q.name}</b>${prog}${questState === 'done' ? ' <span style="color:#8fd18f">— xong, về gặp ' + npcName(q.npc) + '</span>' : ''}<button class="mini-btn" style="font-size:10px;padding:1px 8px;margin-left:8px" onclick="goQuest()">🧭 Tới Ngay</button></div>`;
      } else {
        row = `<div class="ql-row" style="opacity:.4"><span>🔒</span> ???</div>`;
      }
      html += row;
    });
  } else if (window.qlogTab === 'story'){
    const flags = player.storyFlags || {};
    const nSeal = Object.keys(flags).filter(k => k.startsWith('ta_')).length;
    html += `<div class="ql-ch">☬ Ngũ Trụ Trấn Hung Thần <span style="opacity:.6">· ${nSeal}/7 Tướng Quân đã hạ</span></div>`;
    html += `<div class="ql-row" style="opacity:.85;font-size:11.5px;line-height:1.5">${flags.ketMo ? '⚠ ẤN ĐÃ VỠ — Vết Nứt sắp mở. Lunacia chờ ngươi khép ấn lại.' : nSeal === 0 ? 'Ngũ Trụ còn nguyên — Morvahn vẫn ở bên kia Vết Nứt.' : 'Phong ấn đang rạn nứt… bóng đêm phủ xuống Lunacia.'}</div>`;
    const clues = player.clues || [];
    html += `<div class="ql-ch">🔍 Manh Mối <span style="opacity:.6">· ${clues.length}/${Object.keys(CLUES).length}</span></div>`;
    if (!clues.length) html += `<div class="ql-row" style="opacity:.5">Chưa có manh mối — hạ Vệ Binh Trụ / Tướng Quân để thu thập.</div>`;
    for (const cid of clues){
      const c = CLUES[cid]; if (!c) continue;
      html += `<div class="ql-row"><span style="color:#e8b060">✦</span> <b>${c.name}</b><div style="opacity:.65;font-size:11px;padding-left:18px;line-height:1.4">${c.desc}</div></div>`;
    }
    const seen = Object.keys(player.storySeen || {});
    html += `<div class="ql-ch">☬ Trấn Thủ Đã Gặp <span style="opacity:.6">· ${seen.length}/28</span></div>`;
    if (!seen.length) html += `<div class="ql-row" style="opacity:.5">Chưa gặp trấn thủ nào.</div>`;
    for (const bid of seen){
      const L = BOSS_LORE[bid]; if (!L) continue;
      const killed = Object.values(player.bossKills || {}).some(arr => arr.includes(bid));
      html += `<div class="ql-row"${killed ? '' : ' style="opacity:.55"'}><span>${killed ? '⚔' : '👁'}</span> ${L.name} <button class="mini-btn" onclick="replayBossTalk('${bid}')" style="font-size:10px;padding:1px 6px;margin-left:4px">💬</button></div>`;
    }
    if (flags.ketMo) html += `<div class="ql-ch" style="color:#ff6b6b">☠ KẾT MỞ — Ấn đã vỡ. Hung Thần sẽ giáng thế…</div>`;
  } else {
    for (const mapId in MAPS){
      const list = SIDE_QUESTS.filter(sq => sq.map === mapId);
      if (!list.length) continue;
      const opened = mapGate(mapId).ok;
      html += `<div class="ql-ch">${opened ? MAPS[mapId].name : '??? Vùng Chưa Mở'} <span style="opacity:.6">· ${list.filter(sq => sideStates[sq.id] && sideStates[sq.id].st === 'claimed').length}/${list.length} xong</span></div>`;
      for (const sq of list){
        const st = sideAvail(sq), sts = sideStates[sq.id];
        if (st === 'claimed') html += `<div class="ql-row" style="opacity:.55"><span style="color:#8fd18f">✔</span> ${sq.name}</div>`;
        else if (st === 'done') html += `<div class="ql-row ql-cur"><span style="color:#8fd18f">▶</span> <b>${sq.name}</b><button class="mini-btn" style="font-size:10px;padding:0 6px;margin-left:6px" onclick="goQuestSide('${sq.id}')">🧭</button> <span style="color:#8fd18f">— xong, về gặp ${npcName(sq.npc)}</span></div>`;
        else if (st === 'active') html += `<div class="ql-row"><span style="color:#9fd0ff">◈</span> ${sq.name}<button class="mini-btn" style="font-size:10px;padding:0 6px;margin-left:6px" onclick="goQuestSide('${sq.id}')">🧭</button> <span style="color:#7ecbff">${sts.prog}/${sq.need}</span></div>`;
        else if (st === 'avail') html += `<div class="ql-row"><span style="color:#9fd0ff">◈</span> ${sq.name}<button class="mini-btn" style="font-size:10px;padding:0 6px;margin-left:6px" onclick="goQuestSide('${sq.id}')">🧭</button> <span style="opacity:.6">— gặp ${npcName(sq.npc)} để nhận</span></div>`;
        else html += `<div class="ql-row" style="opacity:.4"><span>🔒</span> ??? <span style="opacity:.7;font-size:11px">cấp ${sq.reqLv}</span></div>`;
      }
    }
  }
  p.innerHTML = html;
}

// ═══════════ DẤU ẤN KHAI SINH — gacha tính cách & tiềm năng đầu game ═══════════
const TRAIT_TIERS = {
  pham:  { name:'PHÀM',  w:55, color:'#cfc8b8' },
  linh:  { name:'LINH',  w:30, color:'#6ab0f0' },
  huyen: { name:'HUYỀN', w:12, color:'#b08ae8' },
  thien: { name:'THIÊN', w:3,  color:'#f0a03a' },
};
const TRAITS = [
  { id:'thanluc',   name:'Thần Lực',            tier:'pham',  glyph:'💪', desc:'+8 Tấn Công',                              late:p=>{ p.atk += 8; } },
  { id:'nhucthan',  name:'Nhục Thân Cường Tráng',tier:'pham', glyph:'🛡', desc:'+55 Sinh Lực tối đa',                       late:p=>{ p.maxHp += 55; } },
  { id:'anmay',     name:'Ăn May',              tier:'pham',  glyph:'🍀', desc:'+5% tỉ lệ quái rớt đồ',                     late:p=>{ p.dropBonus += 0.05; } },
  { id:'chankhi',   name:'Instinct Dồi Dào',    tier:'pham',  glyph:'🔷', desc:'+15 Qi tối đa',                        late:p=>{ p.maxQi += 15; } },
  { id:'tuctri',    name:'Túc Trí Đa Mưu',      tier:'linh',  glyph:'📖', desc:'+8% Kinh Nghiệm',                           late:p=>{ p.expPct += 8; } },
  { id:'luyenkhi',  name:'Spark Thiên Phú', tier:'linh',  glyph:'⚒', desc:'Rèn đồ +5% tỉ lệ thành công',               late:p=>{ p.forgeBonus += 5; } },
  { id:'thanhanh',  name:'Bách Bộ Thần Hành',   tier:'linh',  glyph:'👟', desc:'+6% Tốc Chạy',                              late:p=>{ p.speed = Math.round(p.speed*1.06); } },
  { id:'thiennhan', name:'Thiên Nhãn',          tier:'linh',  glyph:'👁', desc:'Minimap hiện cả điểm Thảo Dược',            late:p=>{ p.traitHerb = true; } },
  { id:'longtich',  name:'Long Tích Hổ Bộ',     tier:'huyen', glyph:'🐉', desc:'+5% Né Tránh',                              late:p=>{ p.eva = Math.min(0.45, p.eva+0.05); } },
  { id:'doanngoc',  name:'Đoạn Ngọc Thủ',       tier:'huyen', glyph:'🎯', desc:'Ám Khí +15% ST · phá khiên lâu thêm 4s',    late:p=>{ p.amkhiPct += 0.15; p.shieldBonus += 4; } },
  { id:'sattam',    name:'Sát Tâm',             tier:'huyen', glyph:'☾', desc:'Giết Du Hiệp không tăng Tội Ác',            late:p=>{ p.traitSatTam = true; } },
  { id:'duocthe',   name:'Dược Thể',            tier:'huyen', glyph:'🧪', desc:'Hồ Lô Thuốc hồi 55% máu (thay 40%)',        late:p=>{ p.potionPct = 0.55; } },
  { id:'vohon',     name:'Võ Hồn',              tier:'thien', glyph:'⚔', desc:'Tấn Chức +12% Sát Thương',                 late:p=>{ p.skillDmgPct += 0.12; } },
  { id:'thienmenh', name:'Thiên Mệnh',          tier:'thien', glyph:'◑', desc:'Mỗi màn chơi 1 lần: chết hồi sinh tại chỗ 50% máu', late:p=>{ p.traitRevive = true; } },
  { id:'kymach',    name:'Kỳ Mạch Đại Thông',   tier:'thien', glyph:'🌊', desc:'Đả thông Instinct Channels +25% tỉ lệ',             late:p=>{ p.traitMerRate = 1.25; } },
  { id:'vanvat',    name:'Vạn Vật Hữu Duyên',   tier:'thien', glyph:'💰', desc:'+15% Bạc rơi',                              late:p=>{ p.silverPct += 15; } },
];
const PERSONALITIES = {
  chinh: { name:'Chính Trực', glyph:'⚖', desc:'Khí chất hiệp nghĩa, đi đâu cũng được người đời kính nể.' },
  ta:    { name:'Tà Khí',     glyph:'☾', desc:'Đường tà đạo — Du Hiệp kiêng kị, dân thường e ngại.' },
  trung: { name:'Trung Dung', glyph:'◑', desc:'Hài hòa âm dương, không thiên vị bên nào.' },
};
function rollTrait(excludeIds){
  const pool = TRAITS.filter(t => !excludeIds.includes(t.id));
  let total = 0;
  for (const t of pool) total += TRAIT_TIERS[t.tier].w;
  let r = Math.random() * total;
  for (const t of pool){ r -= TRAIT_TIERS[t.tier].w; if (r <= 0) return t; }
  return pool[pool.length - 1];
}
function rollTraitsSilent(){
  const ids = [];
  for (let i = 0; i < 3; i++) ids.push(rollTrait(ids).id);
  return ids;
}

// ---------- Danh tính giang hồ: đặt tên nhân vật ----------
const NAME_HO = ['Sparkden','Waverly','Emberfall','Glimmerwood','Driftholt','Ashgrove','Moonshale','Thistledown','Brambleton','Frostholt','Silverfen','Oakhollow','Windmere','Starholt','Cinderfell','Duskrider','Hatchbrook','Shellmere','Cloudvane','Rootwyn'];
const NAME_TEN = ['Robin','Sage','Rowan','Lark','Fenn','Wynn','Quinn','Reed','Sorrel','Vale','Ren','Merit','Sterling','Marlowe','Ellery','Winter','Hollis','Faye','Cove','Bryn','Osric','Thalia','Corin','Dashiell'];
function genCharName(){
  const ho = NAME_HO[(Math.random()*NAME_HO.length)|0];
  const ten = NAME_TEN[(Math.random()*NAME_TEN.length)|0];
  return ho + ' ' + ten;
}
function sanitizeCharName(v){
  return (v || '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
}

let pendingSect = null, quzeBoard = [], quzePicked = [], quzeShuffles = 3, quzePers = 'trung', quzeRevealed = false;
// Bàn 16 Thẻ Tiên Duyên úp — mỗi thẻ roll độc lập theo đúng xác suất phẩm chất gốc (Phàm 55/Linh 30/Huyền 12/Thiên 3)
function rollQuzeBoard(){
  const b = [];
  for (let i = 0; i < 16; i++) b.push({ t: rollTrait([]), open: false });
  return b;
}
function openQuze(key){
  pendingSect = key;
  quzeBoard = rollQuzeBoard();
  quzePicked = []; quzeShuffles = 3; quzePers = 'trung'; quzeRevealed = false;
  const _ni = el('inp-char-name'); if (_ni && !_ni.value) _ni.value = genCharName();
  el('sect-select').classList.add('hidden');
  el('quze-screen').classList.remove('hidden');
  renderQuze();
}
// QA rà soát MU-Axie: trước đây lật từng thẻ một (bấm 16 lần) — giờ lật cùng lúc cả bàn 1 phát,
// đúng cảm giác "khui vận may" gọn lẹ hơn thay vì grind từng ô. quzeJustFlipped chỉ bật animation
// đúng 1 lần render ngay sau khi lật — các lần render khác (chọn tính cách, chọn/bỏ thẻ...) không
// phát lại hiệu ứng lật.
let quzeJustFlipped = false;
window.qzFlipAll = function(){
  if (quzeRevealed || !quzeBoard.length) return;
  quzeRevealed = true;
  quzeJustFlipped = true;
  quzeBoard.forEach(c => { c.open = true; });
  AudioSys.sfx('quest', 0.7);
  if (quzeBoard.some(c => c.t.tier === 'thien')) AudioSys.sfx('levelup', 0.9);
  renderQuze();
};
window.qzToggle = function(i){
  const c = quzeBoard[i]; if (!c || !c.open) return;
  const at = quzePicked.indexOf(i);
  if (at >= 0) quzePicked.splice(at, 1);
  else {
    if (quzePicked.length >= 3) return;
    if (quzePicked.some(j => quzeBoard[j].t.id === c.t.id)) return; // không chọn 2 quẻ trùng vận
    quzePicked.push(i);
  }
  AudioSys.sfx('ui', 0.5);
  renderQuze();
};
window.qzShuffle = function(){
  if (quzeShuffles <= 0) return;
  quzeShuffles--;
  quzeBoard = rollQuzeBoard();
  quzePicked = []; quzeRevealed = false;
  AudioSys.sfx('skill', 0.6);
  renderQuze();
};
function renderQuze(){
  const bd = el('quze-board');
  bd.innerHTML = '';
  quzeBoard.forEach((c, i) => {
    const d = document.createElement('div');
    const picked = quzePicked.includes(i);
    const dupe = !picked && c.open && quzePicked.some(j => quzeBoard[j].t.id === c.t.id);
    d.className = 'qzc' + (c.open ? ' open t-' + c.t.tier : '') + (picked ? ' picked' : '') + (dupe ? ' dim' : '') + (quzeJustFlipped ? ' flip-in' : '');
    if (quzeJustFlipped) d.style.animationDelay = (i * 45) + 'ms';
    if (c.open){
      const tier = TRAIT_TIERS[c.t.tier];
      d.innerHTML = `<img class="qzc-art" src="assets/quze/${c.t.id}.png" alt="" onerror="this.remove()">
        <div class="qzc-name" style="color:${tier.color}">${c.t.name}</div>
        <div class="qzc-tier" style="color:${tier.color}">— ${tier.name} —</div>
        <div class="qzc-desc">${c.t.desc}</div>`;
      d.addEventListener('click', ()=>qzToggle(i));
    } else {
      d.innerHTML = `<img class="qzc-art" src="assets/quze/back.png" alt="" onerror="this.remove()"><div class="qzc-backglyph">🥚</div>`;
    }
    bd.appendChild(d);
  });
  quzeJustFlipped = false; // 1 lần duy nhất — reset ngay sau khi build xong HTML của lượt lật này
  const flipBtn = el('btn-quze-flipall');
  if (flipBtn){ flipBtn.classList.toggle('hidden', quzeRevealed); flipBtn.onclick = qzFlipAll; }
  const pk = el('quze-picked');
  pk.innerHTML = '';
  for (let s2 = 0; s2 < 3; s2++){
    const i = quzePicked[s2], d = document.createElement('div');
    d.className = 'qzs' + (i != null ? ' filled t-' + quzeBoard[i].t.tier : '');
    d.textContent = i != null ? quzeBoard[i].t.name : '— Mảnh ' + (s2+1) + ' —';
    pk.appendChild(d);
  }
  const sb = el('btn-quze-shuffle');
  sb.textContent = `🥚 Ấp Lại Ổ Trứng (còn ${quzeShuffles})`;
  sb.disabled = quzeShuffles <= 0;
  sb.onclick = qzShuffle;
  const pers = el('quze-pers');
  pers.innerHTML = '';
  for (const pid in PERSONALITIES){
    const p = PERSONALITIES[pid];
    const d = document.createElement('div');
    d.className = 'qz-pers' + (quzePers === pid ? ' sel' : '');
    d.innerHTML = `${p.glyph} <b>${p.name}</b><small>${p.desc}</small>`;
    d.addEventListener('click', ()=>{ quzePers = pid; AudioSys.sfx('ui', 0.5); renderQuze(); });
    pers.appendChild(d);
  }
  const allHigh = quzePicked.length === 3 && quzePicked.every(i => quzeBoard[i].t.tier === 'huyen' || quzeBoard[i].t.tier === 'thien');
  let hint = el('qz-title-hint');
  if (!hint){
    hint = document.createElement('div');
    hint.id = 'qz-title-hint'; hint.className = 'qz-title-hint';
    el('quze-picked').after(hint);
  }
  hint.textContent = allHigh ? '✨ 3 mảnh HUYỀN trở lên — sẽ mở danh hiệu ẩn 【Thiên Mệnh Sở Quy】!' : '';
  const go = el('btn-quze-go');
  go.disabled = quzePicked.length !== 3;
  go.textContent = quzePicked.length === 3 ? 'Bắt Đầu Hành Trình' : `Đã chọn ${quzePicked.length}/3 mảnh`;
}
el('btn-name-random').addEventListener('click', ()=>{ el('inp-char-name').value = genCharName(); AudioSys.sfx('ui', 0.5); });
el('btn-quze-go').addEventListener('click', ()=>{
  if (quzePicked.length !== 3) return;
  const pickedTraits = quzePicked.map(i => quzeBoard[i].t);
  const traits = pickedTraits.map(t => t.id);
  const allHigh = pickedTraits.every(t => t.tier === 'huyen' || t.tier === 'thien');
  el('quze-screen').classList.add('hidden');
  const cname = sanitizeCharName(el('inp-char-name') ? el('inp-char-name').value : '') || genCharName();
  startGame(pendingSect, { traits, pers: quzePers, title: allHigh, name: cname });
  checkTitles();
  const pers = PERSONALITIES[quzePers];
  setTimeout(()=>{
    addFloat(player.x, player.y-92, `🥚 The Hatching: ${pickedTraits.map(t => t.name).join(' · ')}`, '#7ecbff', 13);
    addFloat(player.x, player.y-72, `Tính cách: ${pers.glyph} ${pers.name}`, '#9aa8d4', 12);
  }, 600);
  AudioSys.sfx('quest', 0.9);
});
TITLES.push({ id:'tmsq', name:'Thiên Mệnh Sở Quy', cond:p=>!!p.quzeTitle, stats:{ allPct:0.03 }, vfx:null });

// ═══════════ A2: KHÁM PHÁ — sự kiện ngẫu nhiên khi đi đường (vận may trên đường) ═══════════
let kyngoAcc = 0, kyngoNext = rnd(14000, 22000), kyngoPrev = null; // ~75-115s đi bộ
function updateKyngo(_dt){ // đi theo quãng đường di chuyển, không cần dt — giữ tham số cho đồng bộ chữ ký update*(dt)
  if (!player || dead || mapDef().dungeon) { kyngoPrev = null; return; }
  if (kyngoPrev){
    const moved = dist(player.x, player.y, kyngoPrev.x, kyngoPrev.y);
    if (moved < 20) kyngoAcc += moved; // <20px/frame: loại teleport
    if (kyngoAcc >= kyngoNext){
      kyngoAcc = 0; kyngoNext = rnd(14000, 22000);
      rollKyngo();
    }
  }
  kyngoPrev = { x:player.x, y:player.y };
}
function rollKyngo(){
  const r = Math.random();
  const mdK = mapDef();
  let text, sub, color = '#7ecbff';
  if (r < 0.20){ // Học giả lang thang tặng mảnh cổ thư
    const p = Math.floor(Math.random()*3);
    player.bikip.pieces[p]++;
    text = 'KHÁM PHÁ · Học Giả Lang Thang'; sub = `"Bằng hữu hữu duyên, tặng ngươi Mảnh Cổ Thư ${TAN_QUYEN[p]}!"`; color = '#e84a6a';
  } else if (r < 0.36){ // Nhặt huyền thiết
    const n = 2 + Math.floor(Math.random()*2);
    player.mat += n;
    text = 'KHÁM PHÁ · Khoáng Mạch'; sub = `Đá dưới chân lóe sáng — nhặt được ${n}✦ Huyền Thiết!`; color = '#9fd0ff';
  } else if (r < 0.48){ // Hồ lô lạc
    if (player.potions < 5){ player.potions++; sub = 'Nhặt được 1 🧪 Hồ Lô Thuốc còn nguyên!' ; }
    else { player.silver += 100; sub = 'Hồ lô đầy — đổi lấy 100◈!'; }
    text = 'KHÁM PHÁ · Hồ Lô Lạc';
  } else if (r < 0.64 && mdK.type !== 'safe'){ // Mai phục — khu an toàn tuyệt đối không có
    const mobType = (mdK.packs && mdK.packs.length) ? mdK.packs[Math.floor(Math.random()*mdK.packs.length)].mob : 'bandit';
    for (let i = 0; i < 2; i++){
      const m = spawnMob(mobType, { x:player.x, y:player.y, r:130, count:2 }, null);
      m.packAlert = 9999; m.provoked = true;
    }
    text = '⚠ MAI PHỤC!'; sub = 'Có kẻ phục kích ngươi giữa đường!'; color = '#ff5a4a';
    AudioSys.sfx('hurt', 0.7);
  } else if (r < 0.74){ // Năng lượng hội tụ
    player.dantian.tuvi += 30; player.khi += 20;
    text = 'KHÁM PHÁ · Năng Lượng Hội Tụ'; sub = 'Hít thở nguồn năng lượng quanh mình — +30 Anima · +20 Instinct!'; color = '#7fd8e0';
  } else if (r < 0.90){ // Cao Thủ Ẩn Danh chỉ điểm vài chiêu
    const tv = 40 + ((player.dantian && player.dantian.realm) || 0)*25;
    player.dantian.tuvi += tv;
    sub = `Cao thủ ẩn danh xuất hiện, chỉ điểm vài chiêu — +${tv} Anima!`;
    text = 'KHÁM PHÁ · Cao Thủ Ẩn Danh'; color = '#d8baff';
  } else { // Giác ngộ bất chợt — trước đây giảm 30% tiêu hao Ascension Trial (cơ chế đột phá thủ
    // công đã tự động hoá từ đợt MU-hoá, giảm giá đó không còn ai tiêu thụ được nữa) — đổi thành
    // thưởng Anima thẳng cho tương xứng với các nhánh Khám Phá khác, giữ nguyên cảm giác "chợt tỉnh ngộ".
    const tv2 = 80 + ((player.dantian && player.dantian.realm) || 0)*30;
    player.dantian.tuvi += tv2;
    text = 'KHÁM PHÁ · Giác Ngộ Bất Chợt'; color = '#9fd0ff';
    sub = `Chợt lóe lên một tia sáng trí tuệ — +${tv2} Anima!`;
  }
  zoneBanner = { text, sub, color, t:3.2 };
  AudioSys.sfx('quest', 0.7);
  addEffect({ type:'ring', x:player.x, y:player.y, r:70, color, big:true });
  calcDerived(); saveGame();
}
TITLES.push({ id:'tctk', name:'Túc Thù Chung Kết', cond:p=>(p.revengeKills||0) >= 3, stats:{ atkPct:0.03 }, vfx:null });

// ============================================================
// Cloud Save Sync — giao tiếp với shell React qua postMessage
// ============================================================
(function(){
  if (!window.parent || window.parent === window) return; // chạy độc lập → bỏ qua
  function localSavedAt(){
    try {
      const raw = localStorage.getItem('vlcm_save');
      if (!raw) return 0;
      return JSON.parse(raw).savedAt || 0;
    } catch { return 0; }
  }
  window.addEventListener('message', function(ev){
    if (ev.origin !== window.location.origin) return;
    const msg = ev.data;
    if (!msg || msg.type !== 'vlcm:cloud-load' || !msg.data) return;
    try {
      const cloud = JSON.parse(msg.data);
      const cloudAt = cloud.savedAt || 0;
      if (cloudAt <= localSavedAt()) return; // bản local mới hơn hoặc bằng — giữ nguyên
      localStorage.setItem('vlcm_save', msg.data);
      if (!player){
        // đang ở màn menu → bật nút Tiếp Tục ngay, không cần tải lại
        el('intro-story').classList.add('hidden');
        showMainMenu();
        el('btn-continue').classList.remove('hidden');
      } else {
        addFloat(player.x, player.y-70, '☁ Có save cloud mới hơn — tải lại trang để dùng bản đó', '#7ec8ff', 14);
      }
    } catch { /* best-effort — bỏ qua nếu lỗi */ }
  });
  // Báo cho shell biết game đã sẵn sàng nhận save cloud
  try { window.parent.postMessage({ type: 'vlcm:ready' }, window.location.origin); } catch { /* best-effort — bỏ qua nếu lỗi */ }
})();


// ==================== PHÓ BẢN & BOSS (Request P) ====================
// Boss tương ứng cấp từng map — ảnh riêng vẽ bằng AI, phong cách thủy mặc
Object.assign(MOBS, {
  boss_hacphong:  { name:'Thủ Lĩnh Đoàn Gloam',    lv:16,  hp:3500,   atk:55,  def:20,  xp:3200,  silver:[350,500],   speed:80, aggro:9999, range:40, atkCd:1.2,  size:24, color:'#181420', eye:'#ff3a3a', boss:true, elite:true, drop:1, el:'Hỏa',  img:'assets/mobs/boss_hacphong.png' },
  boss_sontac:    { name:'Thủ Lĩnh Sói Hoang',  lv:22,  hp:6000,   atk:75,  def:28,  xp:5200,  silver:[500,700],   speed:76, aggro:9999, range:42, atkCd:1.25, size:25, color:'#241a12', eye:'#ff9a3a', boss:true, elite:true, drop:1, el:'Thổ', skel:'hound', skelPal:{main:'#5f5348',dark:'#3d342c',trim:'#c8a84a',glow:'#ffd76a',bone:'#e8dcc0'}},
  boss_phando:    { name:'Đại Tướng Phản Loạn',     lv:34,  hp:11000,  atk:110, def:40,  xp:9000,  silver:[800,1100],  speed:82, aggro:9999, range:44, atkCd:1.2,  size:25, color:'#12201c', eye:'#a0ffe9', boss:true, elite:true, drop:1, el:'Thủy', skel:'knight', skelPal:{main:'#4f7a70',dark:'#2e4a44',trim:'#a0ffe9',cloth:'#1e3a34',glow:'#6ae8c0'}},
  boss_mochu:     { name:'Chúa Tể Hầm Mộ',          lv:52,  hp:22000,  atk:170, def:70,  xp:16000, silver:[1300,1800], speed:70, aggro:9999, range:46, atkCd:1.3,  size:26, color:'#1c1a14', eye:'#9a86d8', boss:true, elite:true, drop:1, el:'Thổ', skel:'cultist', skelPal:{main:'#b0a890',dark:'#332a24',cloth:'#4a3a2a',trim:'#c8a84a',glow:'#8fe0a8'}},
  boss_tinhhoa:   { name:'Xoáy Lá Nguyền',      lv:72,  hp:40000,  atk:240, def:95,  xp:28000, silver:[2000,2800], speed:88, aggro:9999, range:48, atkCd:1.15, size:26, color:'#2a1218', eye:'#7ec850', boss:true, elite:true, drop:1, el:'Mộc', poisonHit:true, img:'assets/mobs/boss_tinhhoa.png' },
  boss_dothong:   { name:'Chúa Sói Thảo Nguyên',   lv:92,  hp:68000,  atk:340, def:130, xp:45000, silver:[3200,4200], speed:84, aggro:9999, range:50, atkCd:1.1,  size:27, color:'#1a1410', eye:'#ffd76a', boss:true, elite:true, drop:1, el:'Kim', skel:'hound', skelPal:{main:'#6a6050',dark:'#443c30',trim:'#c8a84a',glow:'#ffd76a',bone:'#e8dcc0'}},
  boss_thienbinh: { name:'Thống Soái Thiên Giáp', lv:108, hp:100000, atk:420, def:160, xp:70000, silver:[4500,6000], speed:92, aggro:9999, range:52, atkCd:1.0,  size:27, color:'#101018', eye:'#ff3a3a', boss:true, elite:true, drop:1, el:'Hỏa', skel:'knight', skelPal:{main:'#d0c8b0',dark:'#8a8068',trim:'#ffe9a8',cloth:'#c04a2a',glow:'#ffb15c'}},
  // Boss Săn (MU Online-style): xuất hiện SAU khi hạ Cổng Vực phó bản — hoạt động phụ, không bắt
  // buộc để thông quan, thưởng Rương (xem DROP_SRC.box1..5 + grantHuntBox()). huntBoss:true → bỏ
  // qua bảng rơi đồ thường theo-kill (m.def.bossKind/boss) vì phần thưởng đã do grantHuntBox() lo.
  // bossKind:'hunt' mượn nguyên não moveset/lãnh địa/né đòn của Boss Vùng-Cổng Vực (telegraph AoE,
  // vòng lãnh địa đỏ nét đứt, tự hồi nếu người chơi bỏ chạy) — không cần xây hệ thống riêng. Size
  // lớn hơn hẳn Cổng Vực thường (24-30) để áng ngữ đúng không gian rộng của phòng phó bản.
  boss_cotma1:   { name:'Cốt Tướng',  lv:18,  hp:5600,   atk:88,  def:32,  xp:5100,  silver:[550,800],   speed:82, aggro:9999, range:40, atkCd:1.2,  size:32, color:'#d8d0b8', eye:'#7ec850', huntBoss:true, bossKind:'hunt', bossId:'boss_cotma1', moves:['vach','xung','cuong'], drop:0, el:'Thổ', skel:'skeleton', skelPal:{main:'#9aa4b0',dark:'#3a4450',trim:'#6ff0c0',bone:'#e4ecf4',cloth:'#2e4a44',glow:'#6ff0c0'}},
  boss_cotma2:   { name:'Cốt Tướng',  lv:24,  hp:9600,   atk:120, def:45,  xp:8300,  silver:[800,1100],  speed:82, aggro:9999, range:40, atkCd:1.2,  size:32, color:'#d8d0b8', eye:'#7ec850', huntBoss:true, bossKind:'hunt', bossId:'boss_cotma2', moves:['vach','xung','goi','cuong'], drop:0, el:'Thổ', skel:'skeleton', skelPal:{main:'#9aa4b0',dark:'#3a4450',trim:'#6ff0c0',bone:'#e4ecf4',cloth:'#2e4a44',glow:'#6ff0c0'}},
  boss_hacnu1:   { name:'Nữ Vu Bóng Tối',   lv:36,  hp:17600,  atk:176, def:64,  xp:14400, silver:[1300,1750], speed:86, aggro:9999, range:44, atkCd:1.15, size:34, color:'#241428', eye:'#c07fe0', huntBoss:true, bossKind:'hunt', bossId:'boss_hacnu1', moves:['vong','goi','cuong'], drop:0, el:'Mộc', poisonHit:true, skel:'wraith', skelPal:{main:'#a88ae0',dark:'#3a2a5a',cloth:'#5a3a86',bone:'#e8dcff',glow:'#c07fe0'}},
  boss_hacnu2:   { name:'Nữ Vu Bóng Tối',   lv:54,  hp:35200,  atk:272, def:112, xp:25600, silver:[2100,2900], speed:86, aggro:9999, range:44, atkCd:1.15, size:34, color:'#241428', eye:'#c07fe0', huntBoss:true, bossKind:'hunt', bossId:'boss_hacnu2', moves:['vong','vach','goi','cuong'], drop:0, el:'Mộc', poisonHit:true, skel:'wraith', skelPal:{main:'#a88ae0',dark:'#3a2a5a',cloth:'#5a3a86',bone:'#e8dcff',glow:'#c07fe0'}},
  boss_hoangkim1:{ name:'Tướng Quân Vàng', lv:74,  hp:64000,  atk:384, def:152, xp:44800, silver:[3200,4500], speed:80, aggro:9999, range:48, atkCd:1.15, size:36, color:'#3a2e10', eye:'#ffd76a', huntBoss:true, bossKind:'hunt', bossId:'boss_hoangkim1', moves:['vach','xung','vong'], drop:0, el:'Kim', skel:'knight', skelPal:{main:'#c8a84a',dark:'#8a6a20',trim:'#ffe9a8',cloth:'#6a2a1a',glow:'#ffd76a'}},
  boss_hoangkim2:{ name:'Tướng Quân Vàng', lv:94,  hp:108800, atk:544, def:208, xp:72000, silver:[5100,6700], speed:80, aggro:9999, range:48, atkCd:1.1,  size:38, color:'#3a2e10', eye:'#ffd76a', huntBoss:true, bossKind:'hunt', bossId:'boss_hoangkim2', moves:['vach','xung','vong','cuong'], drop:0, el:'Kim', skel:'knight', skelPal:{main:'#c8a84a',dark:'#8a6a20',trim:'#ffe9a8',cloth:'#6a2a1a',glow:'#ffd76a'}},
  boss_amthan:   { name:'Ác Thần Bóng Tối',     lv:112, hp:180000, atk:680, def:260, xp:126000,silver:[8000,11000],speed:90, aggro:9999, range:52, atkCd:1.0,  size:44, color:'#0c0810', eye:'#ff2a2a', huntBoss:true, bossKind:'hunt', bossId:'boss_amthan', moves:['vach','xung','vong','goi','cuong'], drop:0, el:'Hỏa', skel:'fiend', skelPal:{main:'#5a2a3a',dark:'#331824',trim:'#ff6a5a',bone:'#e8c0b0',glow:'#ff4a3a'}},
});
// Ảnh boss nạp thủ công — chạy SAU khi MOBS đã có đủ mob boss (MOB_IMGS ở đầu file chỉ
// load được các mob khai báo trong literal đầu tiên). Boss vẽ khung xương thì bỏ qua,
// nếu không sẽ đi tải file đã xoá.
function loadBossImages(){
  for (const bt in MOBS){
    const d = MOBS[bt];
    if (!d.boss && !d.bossKind && !/^boss_/.test(bt)) continue;
    if (d.skel || !d.img || MOB_IMGS[bt]) continue;
    const im = new Image(); im.src = d.img; MOB_IMGS[bt] = im;
  }
}
loadBossImages();
Object.assign(BGM_TRACKS, {
  pb_daohoa:'bgm_tomb', pb_ngoai:'bgm_tomb', pb_chungnam:'bgm_tomb', pb_comoc:'bgm_tomb',
  pb_tuyettinh:'bgm_tomb', pb_mongco:'bgm_tomb', pb_nhanmon:'bgm_tomb',
});

// Cấu hình từng phó bản: 3 đợt quái (quái của map cha) → Boss → thưởng nguyên liệu tiến cấp kỹ năng
// timeLimit (giây): học Devil Square/Blood Castle của MU Online — phó bản có đồng hồ đếm ngược,
// hết giờ là thất bại mất trắng, thay vì AUTO đứng farm vô thời hạn như trước.
const DUNGEONS = {
  pb_daohoa:   { boss:'boss_hacphong',  bossName:'Thủ Lĩnh Đoàn Gloam',
    waves:[ ['bandit','bandit','wolf'], ['bandit','hautu','bandit'], ['assassin','bandit','wolf'] ],
    rewards:{ tienDan:[1,2], mat:[4,7],   tuLa:[0,0], hon:[0,0], khi:40,  tuvi:150,  silver:[250,400] },
    huntBoss:'boss_cotma1', boxTier:1, timeLimit:480 },
  pb_ngoai:    { boss:'boss_sontac',    bossName:'Thủ Lĩnh Sói Hoang',
    waves:[ ['bandit','wolf','bandit'], ['bandit','bandit','caodo'], ['assassin','bandit','bandit'] ],
    rewards:{ tienDan:[1,2], mat:[5,8],   tuLa:[0,0], hon:[0,0], khi:55,  tuvi:220,  silver:[320,480] },
    huntBoss:'boss_cotma2', boxTier:1, timeLimit:480 },
  pb_chungnam: { boss:'boss_phando',    bossName:'Phản Đồ Đại Tướng',
    waves:[ ['phando','bandit','phando'], ['xanu','phando','bandit'], ['bandao','xanu','phando'] ],
    rewards:{ tienDan:[2,3], mat:[7,11],  tuLa:[0,1], hon:[0,0], khi:90,  tuvi:450,  silver:[550,800] },
    huntBoss:'boss_hacnu1', boxTier:2, timeLimit:540 },
  pb_comoc:    { boss:'boss_mochu',     bossName:'Cổ Mộ Mộ Chủ',
    waves:[ ['thinu','mocnhan','thinu'], ['huyetbat','mocnhan','thinu'], ['huyetbat','huyetbat','mocnhan'] ],
    rewards:{ tienDan:[2,3], mat:[10,14], tuLa:[1,1], hon:[0,0], khi:140, tuvi:800,  silver:[900,1300] },
    huntBoss:'boss_hacnu2', boxTier:2, timeLimit:540 },
  pb_tuyettinh:{ boss:'boss_tinhhoa',   bossName:'Xoáy Lá Nguyền',
    waves:[ ['ttdetu','docyeu','ttdetu'], ['docyeu','satthuhy','ttdetu'], ['satthuhy','docyeu','docyeu'] ],
    rewards:{ tienDan:[3,4], mat:[13,18], tuLa:[1,2], hon:[0,1], khi:200, tuvi:1400, silver:[1400,2000] },
    huntBoss:'boss_hoangkim1', boxTier:3, timeLimit:600 },
  pb_mongco:   { boss:'boss_dothong',   bossName:'Đột Thông Hãn Vương',
    waves:[ ['thamtu','cungthu','kybinh'], ['cungthu','kybinh','thamtu'], ['kybinh','kybinh','cungthu'] ],
    rewards:{ tienDan:[4,5], mat:[16,22], tuLa:[2,2], hon:[1,1], khi:280, tuvi:2400, silver:[2200,3200] },
    huntBoss:'boss_hoangkim2', boxTier:4, timeLimit:660 },
  pb_nhanmon:  { boss:'boss_thienbinh', bossName:'Thiên Binh Thống Soái',
    waves:[ ['kylan','cuongbinh','daokhach'], ['cuongbinh','daokhach','kylan'], ['daokhach','kylan','kylan'] ],
    rewards:{ tienDan:[5,6], mat:[20,26], tuLa:[2,3], hon:[2,2], khi:350, tuvi:3500, silver:[3000,4500] },
    huntBoss:'boss_amthan', boxTier:5, timeLimit:720 },
};

// HUD phó bản: nhãn ở giữa trên cùng, đồng hồ đếm ngược tuỳ chọn ngay dưới, thanh máu boss tuỳ
// chọn dưới nữa.
function drawArenaHUD({ label, labelColor, timeLeft, activeBoss, barColor }){
  const x = W/2, y = 26;
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3; ctx.fillStyle = labelColor;
  ctx.strokeText(label, x, y); ctx.fillText(label, x, y);
  if (timeLeft != null){
    const tl = Math.max(0, timeLeft), mm = Math.floor(tl/60), ss = Math.floor(tl%60);
    const urgent = tl < 60;
    ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = urgent ? (Math.floor(tl*2)%2===0 ? '#ff3a3a' : '#ffb0a0') : '#ffd76a';
    const tstr = '⏱ ' + mm + ':' + String(ss).padStart(2,'0');
    ctx.strokeText(tstr, x, y+20); ctx.fillText(tstr, x, y+20);
  }
  if (activeBoss){
    const b = activeBoss, pct = Math.max(0, b.hp / b.maxHp);
    const bw = 340, bx = x - bw/2, by = y + 28;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx-2, by-2, bw+4, 14);
    ctx.fillStyle = '#3a1020'; ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = barColor; ctx.fillRect(bx, by, bw*pct, 10);
    ctx.strokeStyle = 'rgba(126,203,255,.8)'; ctx.lineWidth = 1; ctx.strokeRect(bx+.5, by+.5, bw-1, 9);
  }
}

// Engine phó bản: DGN = trạng thái lượt chạy hiện tại
let DGN = null; // { id, def, wave, bossRef, cleared }
function startDungeonRun(mapId){
  const def = DUNGEONS[mapId]; if (!def) return;
  DGN = { id: mapId, def, wave: 0, bossRef: null, cleared: false, timeLeft: def.timeLimit, failed: false };
  nextDungeonWave();
}
function nextDungeonWave(){
  if (!DGN) return;
  DGN.wave++;
  const w = DGN.def.waves[DGN.wave - 1];
  if (!w){ // hết 3 đợt → triệu hồi Boss
    const b = spawnMob(DGN.def.boss, { x:1300, y:430, r:40, count:1 }, null);
    b.zone = null; // không hồi sinh lại theo zone
    DGN.bossRef = b;
    addFloat(1300, 500, 'BOSS ' + DGN.def.bossName + ' xuất hiện!', '#ff5a4a', 20);
    AudioSys.sfx('crit', 0.7);
    return;
  }
  for (const t of w){
    const m = spawnMob(t, { x:1300, y:800, r:230, count:w.length }, null);
    m.zone = null; // quái phó bản chết là chết hẳn — không respawn
  }
  // Cửa vào phó bản (1300,1560) cách chỗ quái đợt spawn (1300,800) tới ~760px, ngoài tầm AUTO mặc
  // định (430px) — bật AUTO ngay cửa vào trước đây đứng im không đánh gì (phát hiện qua QA). Dời
  // điểm neo AUTO về đúng chỗ quái mỗi đợt để AUTO tự chạy tới như phần overworld đã làm.
  if (player && player.auto){ player._autoAX = 1300; player._autoAY = 800; }
  if (player) addFloat(player.x, player.y - 60, 'Đợt ' + DGN.wave + '/' + DGN.def.waves.length, '#b08ae8', 16);
}
function updateDungeon(dt){
  if (!DGN) return;
  if (DGN.huntCleared || DGN.failed) return; // đã kết thúc (thành công hoặc hết giờ) — dừng xử lý
  // Đồng hồ đếm ngược (Devil Square/Blood Castle style, MU Online): hết giờ trước khi thông quan
  // xong (kể cả đang ở pha Boss Săn) là thất bại — mất cơ hội, không mất phần thưởng đã nhận trước đó
  if (DGN.def.timeLimit != null){
    DGN.timeLeft -= dt;
    if (DGN.timeLeft <= 0){
      DGN.timeLeft = 0; DGN.failed = true;
      zoneBanner = { text:'⏱ HẾT GIỜ — PHÓ BẢN THẤT BẠI',
        sub: DGN.cleared ? 'Không hạ được Boss Săn kịp giờ — mất cơ hội mở Rương lần này.' : 'Không thông quan kịp — ra cổng Xuất Môn để thử lại từ đầu.',
        color:'#ff5a4a', t:5 };
      addFloat(player.x, player.y-80, 'Hết giờ! Phó bản thất bại.', '#ff5a4a', 16);
      AudioSys.sfx('hurt', 0.7);
      return;
    }
  }
  if (mobs.some(m => !m.dead)) return; // còn quái sống (đợt thường/Cổng Vực/Boss Săn) → chờ
  if (!DGN.bossRef){ nextDungeonWave(); return; }
  if (!DGN.cleared){
    // Boss đã ngã → trao thưởng farm tiến cấp kỹ năng
    DGN.cleared = true;
    const r = DGN.def.rewards;
    const td = Math.round(rnd(r.tienDan[0], r.tienDan[1])), mt = Math.round(rnd(r.mat[0], r.mat[1])),
          tl = Math.round(rnd(r.tuLa[0], r.tuLa[1])),     hn = Math.round(rnd(r.hon[0], r.hon[1])),
          sv = Math.round(rnd(r.silver[0], r.silver[1]));
    player.tienDan += td; player.mat += mt; player.khi += r.khi; player.dantian.tuvi += r.tuvi; player.silver += sv;
    dailyTrack('dungeon'); // Mục Tiêu Hôm Nay
    if (tl > 0) player.gems.tuLa += tl;
    if (hn > 0) player.gems.honNguyen += hn;
    zoneBanner = { text:'PHÓ BẢN THÔNG QUAN!',
      sub:`+${td} Tiến Cấp Đan · +${mt} Huyền Thiết · +${r.khi} Instinct · +${r.tuvi} Anima · +${sv} bạc`,
      color:'#b08ae8', t:5 };
    addFloat(player.x, player.y - 80, 'Phần thưởng phó bản đã vào túi!', '#7ecbff', 16);
    AudioSys.sfx('levelup', 0.8);
    calcDerived(); saveGame();
    // Boss Săn (MU Online-style): hoạt động phụ sau khi thông quan — không bắt buộc, thưởng Rương
    if (DGN.def.huntBoss) setTimeout(spawnHuntBoss, 1800); else DGN.huntCleared = true;
    return;
  }
  if (DGN.huntSpawned && !DGN.huntCleared){
    DGN.huntCleared = true;
    grantHuntBox();
  }
}
const HUNT_BOSS_TAUNT = {
  boss_cotma1: 'Xương cốt ngươi sẽ gia nhập đội quân của ta!',
  boss_cotma2: 'Xương cốt ngươi sẽ gia nhập đội quân của ta!',
  boss_hacnu1: 'Bóng tối sẽ nuốt chửng linh hồn ngươi!',
  boss_hacnu2: 'Bóng tối sẽ nuốt chửng linh hồn ngươi!',
  boss_hoangkim1: 'Quỳ xuống trước uy quyền Hoàng Kim!',
  boss_hoangkim2: 'Quỳ xuống trước uy quyền Hoàng Kim!',
  boss_amthan: 'Ngươi dám khuấy động giấc ngủ của Ma Thần sao?!',
};
function spawnHuntBoss(){
  if (!DGN || DGN.huntSpawned || DGN.failed) return; // hết giờ ngay trong lúc chờ Boss Săn ra mắt → thôi, không spawn nữa
  const hb = DGN.def.huntBoss;
  const def = MOBS[hb];
  if (!def){ DGN.huntCleared = true; return; }
  const b = spawnMob(hb, { x:1300, y:430, r:40, count:1 }, null);
  b.zone = null; // Boss Săn chết là chết hẳn, không hồi sinh
  // Não moveset Boss Vùng/Cổng Vực (telegraph AoE, vòng lãnh địa, tự hồi khi rời xa) cần các field
  // này — spawnMob() không tự khởi tạo, chỉ spawnZoneBoss() mới làm; thiếu sẽ NaN, chiêu không
  // bao giờ tung ra được (m.moveT -= dt trên undefined → NaN, so sánh NaN<=0 luôn false)
  b.moveT = 4; b.moveIdx = 0; b.tele = null; b.punishT = 0; b.introduced = false;
  DGN.huntRef = b;
  DGN.huntSpawned = true;
  // Boss Săn có chiêu AoE báo trước cần tự tay né (J để né) — AUTO không tự né được nên buộc tắt,
  // người chơi tự chiến trong lãnh địa boss (vòng đỏ nét đứt quanh boss, QA: sảnh phó bản quá rộng
  // để AUTO đứng yên bên trong một cách vô nghĩa như trước)
  if (player && player.auto){ player.auto = false; updateAutoBtn(); addFloat(player.x, player.y-70, 'Boss Săn cần tự tay chiến — AUTO đã tắt!', '#ff9a5a', 13); }
  // Ra mắt kịch tính: rung màn hình + hào quang bùng + 1 câu doạ — xứng với sảnh phó bản rộng
  shakeT = Math.max(shakeT, 0.5); shakeMag = Math.max(shakeMag, 7);
  addEffect({ type:'ring', x:1300, y:430, r:100, color:'#ffd76a', big:true });
  addFloat(1300, 500, '⚔ BOSS SĂN xuất hiện: ' + def.name + '!', '#ffd76a', 20);
  if (HUNT_BOSS_TAUNT[hb]) addFloat(1300, 470, '"' + HUNT_BOSS_TAUNT[hb] + '"', '#ffb0b0', 13);
  AudioSys.sfx('crit', 0.7);
}
function grantHuntBox(){
  const tier = DGN.def.boxTier;
  const srcK = 'box' + tier;
  const bossLv = MOBS[DGN.def.huntBoss].lv;
  const nItems = Math.min(3, tier);
  const gained = [];
  for (let i = 0; i < nItems; i++){
    const it = genItem(bossLv, 0, srcK);
    // Khắc Ấn có thể rơi trên món độ hiếm thấp (genItem roll ngẫu nhiên) — bán tự động
    // món đó là xoá vĩnh viễn thứ hiếm nhất game vì vài đồng bạc.
    if (player.autoSell && it.rarity <= 0 && !it.sigil){
      const v = 20 + it.rarity*30 + (it.tier||1)*15;
      player.silver += v; gained.push(`${it.name}(bán +${v}◈)`);
    } else if (player.inv.length < 30){
      player.inv.push(it); gained.push(it.name);
      if (it.rarity >= 2) addEffect({ type:'spark', x:player.x, y:player.y-12, r:32 + it.rarity*8, color:RARITIES[it.rarity].color });
      tryAutoEquip(it);
    } else gained.push(`${it.name}(túi đầy, mất)`);
  }
  const bonusSilver = 200*tier, bonusTienDan = tier;
  player.silver += bonusSilver; player.tienDan += bonusTienDan;
  zoneBanner = { text:'📦 RƯƠNG CẤP ' + tier + ' MỞ RA!',
    sub: gained.join(' · ') + ` · +${bonusSilver} bạc · +${bonusTienDan} Tiến Cấp Đan`,
    color:'#ffd76a', t:6 };
  addFloat(player.x, player.y - 90, '📦 Rương Cấp ' + tier + ' đã mở!', '#ffd76a', 16);
  AudioSys.sfx('levelup', 0.9);
  saveGame();
}
function drawDungeonHUD(){
  if (!DGN || !player) return;
  const label = DGN.failed ? '⏱ HẾT GIỜ — PHÓ BẢN THẤT BẠI (qua cổng Xuất Môn để thử lại)'
    : DGN.huntCleared ? 'Phó bản đã thông quan — qua cổng dịch chuyển để rời đi'
    : DGN.huntSpawned ? '⚔ BOSS SĂN: ' + MOBS[DGN.def.huntBoss].name
    : DGN.cleared ? (DGN.def.huntBoss ? 'Cổng Vực đã hạ — Boss Săn sắp xuất hiện…' : 'Phó bản đã thông quan — qua cổng dịch chuyển để rời đi')
    : DGN.bossRef ? 'BOSS: ' + DGN.def.bossName
    : 'Đợt ' + DGN.wave + '/' + DGN.def.waves.length + ' — dọn sạch quái!';
  const activeBoss = (DGN.huntSpawned && DGN.huntRef && !DGN.huntRef.dead) ? DGN.huntRef
    : (DGN.bossRef && !DGN.bossRef.dead) ? DGN.bossRef : null;
  drawArenaHUD({
    label, labelColor: DGN.failed ? '#ff6a5a' : '#d8baff',
    timeLeft: (DGN.def.timeLimit != null && !DGN.huntCleared && !DGN.failed) ? DGN.timeLeft : null,
    activeBoss,
    barColor: activeBoss === DGN.huntRef ? '#ffd76a' : '#e84a5a',
  });
}

// Cổng dịch chuyển: map cha → phó bản (và cổng thoát ngược lại)
GATES.push(
  { map:'daohoa',      x:2250, y:950,  to:'pb_daohoa',   name:'Phó Bản · Trại Gloam',       portal:true, label:'Phó Bản' },
  { map:'pb_daohoa',   x:1300, y:1660, to:'daohoa',      name:'Rời Phó Bản → Petalshade Isle',      portal:true, label:'Xuất Môn' },
  { map:'ngoai',       x:2250, y:950,  to:'pb_ngoai',    name:'Phó Bản · Doanh Trại Gloam',        portal:true, label:'Phó Bản' },
  { map:'pb_ngoai',    x:1300, y:1660, to:'ngoai',       name:'Rời Phó Bản → Petalshade Outskirts', portal:true, label:'Xuất Môn' },
  { map:'chungnam',    x:2200, y:790,  to:'pb_chungnam', name:'Phó Bản · Phản Đồ Mật Thất',     portal:true, label:'Phó Bản' },
  { map:'pb_chungnam', x:1300, y:1660, to:'chungnam',    name:'Rời Phó Bản → Thornwood Reach',   portal:true, label:'Xuất Môn' },
  { map:'comoc',       x:2200, y:890,  to:'pb_comoc',    name:'Phó Bản · Mộ Chủ Địa Cung',      portal:true, label:'Phó Bản' },
  { map:'pb_comoc',    x:1300, y:1660, to:'comoc',       name:'Rời Phó Bản → Hollow Roost',      portal:true, label:'Xuất Môn' },
  { map:'tuyettinh',   x:2200, y:690,  to:'pb_tuyettinh',name:'Phó Bản · Băng Hỏa Luyện Ngục',  portal:true, label:'Phó Bản' },
  { map:'pb_tuyettinh',x:1300, y:1660, to:'tuyettinh',   name:'Rời Phó Bản → Frostmire Vale',    portal:true, label:'Xuất Môn' },
  { map:'mongco',      x:2200, y:790,  to:'pb_mongco',   name:'Phó Bản · Trại Tro Tàn',         portal:true, label:'Phó Bản' },
  { map:'pb_mongco',   x:1300, y:1660, to:'mongco',      name:'Rời Phó Bản → Ashen Steppe',      portal:true, label:'Xuất Môn' },
  { map:'nhanmon',     x:2200, y:790,  to:'pb_nhanmon',  name:'Phó Bản · Thiên Binh Đài',       portal:true, label:'Phó Bản' },
  { map:'pb_nhanmon',  x:1300, y:1660, to:'nhanmon',     name:'Rời Phó Bản → Stormgate Pass',    portal:true, label:'Xuất Môn' },
);


// ==================== BẾ QUAN OFFLINE (bài học idle Nhất Niệm Tiêu Dao) ====================
// Vắng mặt vẫn tu luyện: quay lại nhận Instinct + Anima theo thời gian offline (trần 8 giờ).
// Cảnh giới Ascension càng cao, hiệu quả bế quan càng lớn.
function grantOfflineGains(savedAt){
  if (!player || !savedAt) return;
  const offSec = Math.min(8*3600, Math.max(0, (Date.now() - savedAt)/1000));
  if (offSec < 600) return; // dưới 10 phút không tính
  const mins = offSec/60;
  const realm = player.dantian ? player.dantian.realm : 0;
  const khiGain = Math.floor(mins * (3 + realm*1.2) * tulinhMult());
  const tuviGain = Math.floor(mins * (1.5 + realm*0.8) * tulinhMult());
  if (khiGain <= 0 && tuviGain <= 0) return;
  player.khi += khiGain;
  player.dantian.tuvi += tuviGain;
  showOfflineGains(offSec, khiGain, tuviGain);
}
function showOfflineGains(offSec, khiGain, tuviGain){
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(10,8,6,.72);backdrop-filter:blur(3px)';
  const hh = Math.floor(offSec/3600), mm = Math.floor((offSec%3600)/60);
  ov.innerHTML = `<div style="max-width:430px;padding:28px 34px;border:1px solid #4c8dff;border-radius:10px;background:linear-gradient(160deg,#262c58,#14163a);text-align:center;box-shadow:0 0 60px rgba(76,141,255,.25)">
    <div style="font-family:'Baloo 2',sans-serif;font-size:24px;color:#7ecbff;margin-bottom:6px;letter-spacing:2px">Bế Quan Xuất Thế</div>
    <div style="font-size:13px;color:#9aa8d4;margin-bottom:14px;line-height:1.7">Đạo hữu bế quan ${hh > 0 ? hh + ' canh giờ ' : ''}${mm} khắc — chân khí tự vận hành chu thiên khắp kinh mạch.</div>
    <div style="font-size:15px;line-height:2;color:#e4ebff">
      <div>Instinct <b style="color:#7fd8e0">+${khiGain}</b></div>
      <div>Anima <b style="color:#9fd0ff">+${tuviGain}</b></div>
    </div>
    <div style="font-size:11.5px;color:#7a86ad;margin-top:12px">Cảnh giới Ascension càng cao, bế quan càng hiệu quả · tối đa 8 canh giờ</div>
    <button id="btn-xuatquan" style="margin-top:16px;padding:9px 36px;background:#4c8dff;border:none;border-radius:6px;color:#262c58;font-weight:700;cursor:pointer;font-size:14px;letter-spacing:2px">Xuất Quan</button>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector('#btn-xuatquan').onclick = () => { ov.remove(); AudioSys.sfx('ui', 0.6); };
}


// ==================== NỘI ĐAN YÊU THÚ (bài học Phi Nguyệt Tiên Hành Lục) ====================
// Quái tinh anh/boss rớt Nội Đan theo hành — Thôn Phệ tăng chỉ số VĨNH VIỄN, tối đa 3 viên/ngày.
const ND_EFFECT = {
  Kim:   { k:'atk',  v:6,   desc:'+6 công lực mỗi viên' },
  'Mộc': { k:'hp',   v:40,  desc:'+40 sinh lực mỗi viên' },
  'Thổ': { k:'def',  v:4,   desc:'+4 phòng ngự mỗi viên' },
  'Thủy':{ k:'qi',   v:25,  desc:'+25 Qi mỗi viên' },
  'Hỏa': { k:'crit', v:0.5, desc:'+0.5% chí mạng mỗi viên' },
};
function ndToday(){
  const d = new Date().toDateString();
  if (player.ndDay !== d){ player.ndDay = d; player.ndCount = 0; }
  return player.ndCount || 0;
}
window.swallowNoidan = function(el2){
  if (!player.noidan || !(player.noidan[el2] > 0)) return;
  if (ndToday() >= 3){
    addFloat(player.x, player.y-40, 'Kinh mạch đã bão hòa — ngày mai hãy thôn phệ tiếp!', '#8a8a8a', 12);
    return;
  }
  player.noidan[el2]--;
  const ef = ND_EFFECT[el2];
  player.ndBonus[ef.k] = (player.ndBonus[ef.k] || 0) + ef.v;
  player.ndCount = ndToday() + 1;
  calcDerived();
  addFloat(player.x, player.y-50, `Thôn phệ Nội Đan ${el2}: ${ef.desc.split(' mỗi')[0]} VĨNH VIỄN!`, ELEM[el2].color, 14);
  addEffect({ type:'ring', x:player.x, y:player.y, r:60, color:ELEM[el2].color });
  AudioSys.sfx('levelup', 0.5);
  saveGame(); renderBag();
};



// ==================== LINH THÚ ĐỒNG HÀNH (bài học Phi Nguyệt + NNTD) ====================
// Thu phục quái TINH ANH suy yếu (<40% máu) bằng Phong Linh Phù — bấm T khi đứng gần.
// Linh thú đi theo, tự săn quái quanh chủ; cho ăn Nội Đan để mạnh lên & tiến hóa (10 viên/bậc, hệ khớp tính 2).
let petObj = null;
function ensurePet(){
  if (!player || !player.pet){ petObj = null; return; }
  if (petObj) return;
  const d = MOBS[player.pet.type];
  if (!d){ player.pet = null; return; }
  petObj = { type:player.pet.type, def:d, name:player.pet.name,
    x:player.x-44, y:player.y+34, zone:null, pack:null, hp:1, maxHp:1, atkT:0, dead:false, face:0,
    shield:0, shieldT:0, hitT:0, wob:Math.random()*10, packAlert:0, lungeT:0, isPet:true };
}
function petDmg(){
  const p = player.pet;
  return Math.round((8 + p.lv*2 + (p.feed || 0)*4) * (1 + Math.floor((p.feed || 0)/10)*0.2));
}
function updatePet(dt){
  if (!player || dead){ petObj = null; return; }
  ensurePet();
  if (!petObj) return;
  petObj.wob += dt*6;
  const tx = player.x - 44, ty = player.y + 34;
  const dd = dist(petObj.x, petObj.y, tx, ty);
  if (dd > 4){
    const sp = Math.min(dd*4, 320);
    petObj.x += (tx-petObj.x)/dd*sp*dt; petObj.y += (ty-petObj.y)/dd*sp*dt;
  }
  petObj.atkT -= dt;
  if (petObj.atkT <= 0){
    let best = null, bd = 280;
    for (const m of mobs){
      if (m.dead || m.def.duHiep) continue;
      const d2 = dist(petObj.x, petObj.y, m.x, m.y);
      if (d2 < bd){ bd = d2; best = m; }
    }
    if (best){
      petObj.atkT = 1.2;
      petObj.face = Math.atan2(best.y-petObj.y, best.x-petObj.x);
      hurtMob(best, petDmg(), 'pet');
    } else petObj.atkT = 0.3;
  }
}
function drawPet(){
  drawMob(petObj);
  const nh = ELEM[player.pet.el] || { color:'#b08ae8' };
  ctx.font = '10px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
  const label = '🐾 ' + petObj.name;
  ctx.strokeText(label, petObj.x, petObj.y - petObj.def.size - 22);
  ctx.fillStyle = nh.color; ctx.fillText(label, petObj.x, petObj.y - petObj.def.size - 22);
}
window.tryTame = function(){
  if (!player || dead) return;
  if (player.pet){ addFloat(player.x, player.y-40, 'Đã có Linh Thú — muốn đổi hãy Phóng Sinh trước (Nhân Vật → Linh Thú)!', '#8a8a8a', 12); return; }
  if ((player.phongphu || 0) <= 0){ addFloat(player.x, player.y-40, 'Cần Phong Linh Phù — bán ở Vũ Khí Phường!', '#ff7a6a', 12); return; }
  let best = null, bd = 230;
  for (const m of mobs){
    if (m.dead || !m.def.elite || m.def.boss || m.def.duHiep) continue;
    if (m.hp > m.maxHp*0.4) continue;
    const d2 = dist(player.x, player.y, m.x, m.y);
    if (d2 < bd){ bd = d2; best = m; }
  }
  if (!best){ addFloat(player.x, player.y-40, 'Không có tinh anh suy yếu (<40% máu) trong tầm — đánh nó xuống trước đã!', '#8a8a8a', 12); return; }
  player.phongphu--;
  if (Math.random() < 0.65){
    player.pet = { type:best.type, name:best.def.name, lv:best.def.lv, el:best.def.el, feed:0 };
    best.dead = true; best.zone = null;
    petObj = null;
    sideOnEvent('tame');
    zoneBanner = { text:'🐾 THU PHỤC THÀNH CÔNG', sub:`${best.def.name} hệ ${elName(best.def.el)} nguyện theo ngươi — xem ở Nhân Vật → Linh Thú!`, color:'#b08ae8', t:3.5 };
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:'#b08ae8', big:true });
    AudioSys.sfx('levelup', 0.8);
    saveGame();
  } else {
    addFloat(player.x, player.y-46, 'Thu phục thất bại — linh thú phản kháng mạnh!', '#ff7a6a', 13);
    AudioSys.sfx('hurt', 0.5);
  }
};
function renderPet(){
  const c = el('char-content'); if (!c) return;
  const p = player.pet;
  let html = '';
  if (!p){
    html = `<div class="stat-sec">LINH THÚ</div>
      <div style="font-size:12.5px;color:#9aa8d4;line-height:1.9">Ngươi chưa có linh thú đồng hành.<br><br>
      <b style="color:#7ecbff">Cách thu phục:</b><br>
      1. Mua <b style="color:#d8baff">Phong Linh Phù</b> ở Vũ Khí Phường (Lunaris City)<br>
      2. Đánh quái <b>tinh anh</b> (Gloam Marauder, Sát Thủ Sương Mù…) còn dưới 40% máu<br>
      3. Đứng gần và bấm <b style="color:#7ecbff">T</b> — 65% thành công<br><br>
      Phù đang có: <b style="color:#7ecbff">${player.phongphu || 0}</b></div>`;
  } else {
    const nh = ELEM[p.el] || { color:'#e4ebff', glyph:'·' };
    const tier = Math.floor((p.feed || 0)/10);
    html = `<div class="stat-sec">LINH THÚ ĐỒNG HÀNH</div>
      <div style="font-size:13px;line-height:2;color:#e4ebff">
        <b style="color:${nh.color};font-size:15px">${nh.glyph} ${p.name}</b>${tier > 0 ? ` <span style="color:#7ecbff">· Tinh Anh bậc ${tier}</span>` : ''} · hệ ${elName(p.el)} · C${p.lv}<br>
        Sức mạnh: <b style="color:#7ecbff">${petDmg()} ST</b> mỗi 1.2s — tự săn quái quanh ngươi<br>
        Đã cho ăn: <b>${p.feed || 0}</b> nội đan ${`(còn ${10 - (p.feed || 0)%10} viên nữa tiến hóa)`}
      </div>
      <div class="forge-actions">
        <button class="mini-btn" onclick="feedPet()">● Cho Ăn Nội Đan (${elName(p.el)} tính ×2)</button>
        <button class="mini-btn" style="border-color:#7a4a3a;color:#c88" onclick="releasePet()">Phóng Sinh</button>
      </div>
      <div style="font-size:11.5px;opacity:.6;margin-top:4px">Nội đan trong túi: ${['Kim','Mộc','Thổ','Thủy','Hỏa'].map(e2=>`${e2} ${(player.noidan && player.noidan[e2]) || 0}`).join(' · ')}</div>`;
  }
  c.innerHTML = html;
}
window.feedPet = function(){
  const p = player.pet; if (!p) return;
  let el2 = null;
  if (player.noidan && player.noidan[p.el] > 0) el2 = p.el;
  else el2 = ['Kim','Mộc','Thổ','Thủy','Hỏa'].find(e2 => (player.noidan[e2] || 0) > 0);
  if (el2 == null){ addFloat(player.x, player.y-40, 'Hết nội đan — săn tinh anh/boss để kiếm thêm!', '#8a8a8a', 12); return; }
  const bonus = el2 === p.el ? 2 : 1;
  player.noidan[el2]--;
  p.feed = (p.feed || 0) + bonus;
  addFloat(player.x, player.y-50, `Linh thú ăn Nội Đan ${el2} (+${bonus}) — sức mạnh ${petDmg()}!`, ELEM[el2].color, 13);
  AudioSys.sfx('quest', 0.5);
  saveGame(); renderPet();
};
window.releasePet = function(){
  if (!player.pet) return;
  addFloat(player.x, player.y-46, `${player.pet.name} đã được phóng sinh về núi rừng…`, '#8a8a8a', 12);
  player.pet = null; petObj = null;
  saveGame(); renderPet();
};

// ==================== ĐỘNG PHỦ (bài học NNTD + Phi Nguyệt) ====================
// Tụ Linh Trận: tăng tốc mọi tu luyện (bế quan offline, ngồi thiền, chân khí thụ động).
// Dược Viên: 3 luống trồng linh dược theo GIỜ THỰC — quay lại thu hoạch.
const TULINH_TIERS = [0, 0.15, 0.30, 0.50, 0.75, 1.00];
const GARDEN_SEEDS = {
  hoisinh: { name:'Hồi Sinh Thảo', time:3600,  desc:'1 giờ → 2 🧪 Hồ Lô Thuốc' },
  tukhi:   { name:'Tụ Khí Thảo',   time:7200,  desc:'2 giờ → +200 Instinct' },
  ngoctam: { name:'Ngọc Tâm Thảo', time:14400, desc:'4 giờ → +150 Anima' },
};
function tulinhMult(){ return 1 + (TULINH_TIERS[(player && player.abode && player.abode.tulinh) || 0] || 0); }
function renderAbode(){
  if (player.level < 30){ // mở theo tầng — tân thủ tập trung chiến đấu & nhiệm vụ trước
    el('panel-quest').innerHTML = `<h3>Động Phủ</h3><button class="close-x" onclick="closePanels()">✕</button>
      <div style="padding:14px;font-size:13px;line-height:1.8">Quản Gia lắc đầu: <i>"Đạo hữu tu vi còn mỏng, chưa gánh nổi linh khí động phủ."</i><br><br>
      Động Phủ mở khóa ở <b style="color:#7ecbff">cấp 30</b> — hãy rèn thân đã!</div>`;
    closePanels(); el('panel-quest').classList.remove('hidden');
    return;
  }
  const ab = player.abode;
  const t = ab.tulinh;
  let html = `<h3>Động Phủ</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">"Động phủ này tuy nhỏ — nhưng linh khí hội tụ thì đạo hữu tu một ngày bằng kẻ khác tu mười ngày."</div>`;
  // Tụ Linh Trận
  html += `<div class="stat-sec">TỤ LINH TRẬN — BẬC ${t}/5 · tu luyện nhanh +${Math.round(TULINH_TIERS[t]*100)}%</div>`;
  if (t < 5){
    const costS = 500*(t+1), costM = 3*(t+1);
    html += `<div class="npc-shop-row"><span><b style="color:#9fd0ff">Nâng lên bậc ${t+1}</b> — tu luyện nhanh +${Math.round(TULINH_TIERS[t+1]*100)}%<br>
      <span style="font-size:11px;opacity:.7">Áp dụng: bế quan offline · ngồi thiền · Instinct thụ động</span></span>
      <button class="mini-btn" ${player.silver >= costS && player.mat >= costM ? '' : 'disabled'} onclick="upgradeTulinh()">${costS}◈ + ${costM}✦</button></div>`;
  } else html += `<div style="font-size:12px;color:#8fd18f">Tụ Linh Trận đã viên mãn — linh khí hội tụ tột đỉnh!</div>`;
  // Dược Viên
  html += `<div class="stat-sec">DƯỢC VIÊN — trồng theo giờ thực</div>`;
  for (let i = 0; i < 3; i++){
    const plot = ab.garden[i];
    if (!plot){
      html += `<div class="npc-shop-row"><span><b>Luống ${i+1}</b> — đang trống<br>
        <span style="font-size:11px;opacity:.7">${Object.values(GARDEN_SEEDS).map(x=>x.desc).join(' · ')}</span></span>
        <span style="text-align:right">${Object.keys(GARDEN_SEEDS).map(k=>`<button class="mini-btn" style="margin:2px 0" ${player.silver<100?'disabled':''} onclick="plantSeed(${i},'${k}')">${GARDEN_SEEDS[k].name}<br>100◈</button>`).join('')}</span></div>`;
    } else {
      const sd = GARDEN_SEEDS[plot.seed];
      const left = Math.max(0, Math.ceil((plot.readyAt - Date.now())/1000));
      if (left > 0){
        html += `<div class="npc-shop-row"><span><b style="color:#7ec850">${sd.name}</b> đang lớn…<br>
          <span style="font-size:11px;opacity:.7">${sd.desc}</span></span>
          <button class="mini-btn" disabled>${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</button></div>`;
      } else {
        html += `<div class="npc-shop-row"><span><b style="color:#7ecbff">${sd.name}</b> đã chín!<br>
          <span style="font-size:11px;opacity:.7">${sd.desc}</span></span>
          <button class="mini-btn" onclick="harvestSeed(${i})">Thu Hoạch</button></div>`;
      }
    }
  }
  el('panel-quest').innerHTML = html;
  closePanels(); el('panel-quest').classList.remove('hidden');
}
window.upgradeTulinh = function(){
  const ab = player.abode, t = ab.tulinh;
  if (t >= 5) return;
  const costS = 500*(t+1), costM = 3*(t+1);
  if (player.silver < costS || player.mat < costM) return;
  player.silver -= costS; player.mat -= costM; ab.tulinh++;
  zoneBanner = { text:`TỤ LINH TRẬN BẬC ${ab.tulinh}`, sub:`Linh khí hội tụ — tốc độ tu luyện +${Math.round(TULINH_TIERS[ab.tulinh]*100)}%!`, color:'#9fd0ff', t:3 };
  AudioSys.sfx('levelup', 0.7);
  saveGame(); renderAbode();
};
window.plantSeed = function(i, seed){
  const ab = player.abode;
  if (ab.garden[i] || !GARDEN_SEEDS[seed] || player.silver < 100) return;
  player.silver -= 100;
  ab.garden[i] = { seed, readyAt: Date.now() + GARDEN_SEEDS[seed].time*1000 };
  addFloat(player.x, player.y-40, `Đã gieo ${GARDEN_SEEDS[seed].name} vào luống ${i+1}!`, '#7ec850', 12);
  AudioSys.sfx('ui', 0.5);
  saveGame(); renderAbode();
};
window.harvestSeed = function(i){
  const ab = player.abode, plot = ab.garden[i];
  if (!plot || plot.readyAt > Date.now()) return;
  ab.garden[i] = null;
  if (plot.seed === 'hoisinh'){
    player.potions = Math.min(5, player.potions + 2);
    addFloat(player.x, player.y-50, 'Thu hoạch: +2 🧪 Hồ Lô Thuốc!', '#7ec850', 13);
  } else if (plot.seed === 'tukhi'){
    player.khi += 200;
    addFloat(player.x, player.y-50, 'Thu hoạch: +200 Instinct!', '#7fd8e0', 13);
  } else {
    player.dantian.tuvi += 150;
    addFloat(player.x, player.y-50, 'Thu hoạch: +150 Anima!', '#9fd0ff', 13);
  }
  sideOnEvent('garden');
  AudioSys.sfx('quest', 0.6);
  saveGame(); renderAbode();
};

// ==================== ĐƠN GIẢN HÓA CHO TÂN THỦ ====================
// 1) Mở khóa theo tầng cấp — hệ thống nào chưa tới cấp thì khóa lại, khỏi ngợp.
// 2) Mục Tiêu Hôm Nay — checklist nhỏ trên quest tracker, xong hết nhận thưởng.
// 3) Hint bar theo cấp — tân thủ chỉ thấy phím cốt lõi.

// ---------- Mở khóa theo tầng ----------
function sysUnlocked(id){
  if (!player) return true;
  const def = (typeof CHAR_TABS !== 'undefined') && CHAR_TABS.find(x=>x.id===id);
  const lv = def ? def.lv : 1;
  if (player.level >= lv) return true;
  // Linh Thú: đã có pet hoặc đã mua Phong Linh Phù thì không khóa lại
  if (id === 'pet' && (player.pet || (player.phongphu || 0) > 0)) return true;
  return false;
}

// ---------- Hint bar theo cấp ----------
function hintText(){
  // Migrated to i18n.js's t() — proof-of-pattern slice, see docs/I18N_MIGRATION_GUIDE.md.
  const lv = player.level;
  const parts = [t('hud.hint.clickmove'), t('hud.hint.attack'), t('hud.hint.talk'), t('hud.hint.potion')];
  if (lv >= 3) parts.push(t('hud.hint.quest'));
  if (lv >= 5) parts.push(t('hud.hint.stats'), t('hud.hint.character'), t('hud.hint.bag'));
  if (lv >= 8) parts.push(t('hud.hint.map'), t('hud.hint.skills'));
  if (lv >= 15) parts.push(t('hud.hint.tame'));
  parts.push(t('hud.hint.loot'));
  return parts.join(' · ');
}

// ---------- Mục Tiêu Hôm Nay ----------
const DAILY_GOALS = [
  { id:'kills',   icon:'⚔', name:'Hạ 10 yêu thú',        need:10 },
  { id:'noidan',  icon:'●', name:'Thu 1 Nội Đan',        need:1 },
  { id:'dungeon', icon:'🏯', name:'Thông quan 1 phó bản', need:1 },
  { id:'forge',   icon:'🔨', name:'Rèn / tấn chức / xung mạch 1 lần', need:1 },
];
function dailyReset(){
  if (!player) return;
  if (!player.daily) player.daily = { day:'', kills:0, noidan:0, dungeon:0, forge:0, claimed:false };
  const today = new Date().toDateString();
  if (player.daily.day !== today)
    player.daily = { day:today, kills:0, noidan:0, dungeon:0, forge:0, claimed:false };
  if (!player.truyna || player.truyna.day !== today)
    player.truyna = { day: today, state:'none', map: null };
}
function dailyTrack(key, n){
  if (!player || dead) return;
  dailyReset();
  player.daily[key] = (player.daily[key] || 0) + (n || 1);
  const g = DAILY_GOALS.find(x=>x.id===key);
  if (g && player.daily[key] === g.need)
    addFloat(player.x, player.y-92, `☀ Mục tiêu: ${g.name} — XONG!`, '#7ec850', 13);
  dailyCheckReward();
}
function dailyCheckReward(){
  const d = player.daily;
  if (!d || d.claimed) return;
  if (!DAILY_GOALS.every(g => (d[g.id] || 0) >= g.need)) return;
  d.claimed = true;
  player.silver += 200; player.khi += 100; player.dantian.tuvi += 50;
  zoneBanner = { text:'☀ HOÀN THÀNH MỤC TIÊU HÔM NAY!',
    sub:'+200◈ bạc · +100 Instinct · +50 Anima — quay lại ngày mai nhé!',
    color:'#7ec850', t:4.5 };
  AudioSys.sfx('levelup', 0.85);
  saveGame();
}
function dailyHtml(){
  dailyReset();
  const d = player.daily;
  let html = `<div class="q-daily"><div class="q-title">☀ Mục Tiêu Hôm Nay</div>`;
  if (d.claimed){
    html += `<div class="q-done">✔ Đã nhận thưởng — quay lại ngày mai!</div>`;
  } else {
    for (const g of DAILY_GOALS){
      const done = (d[g.id] || 0) >= g.need;
      html += `<div class="q-daily-row${done?' done':''}">${done?'✔':'·'} ${g.icon} ${g.name}
        <span>${done ? '' : ` <b>${Math.min(d[g.id]||0, g.need)}/${g.need}</b>`}</span></div>`;
    }
  }
  html += `</div>`;
  return html;
}

// ==================== THE CALLING (Unclassed cấp 10 chọn Tộc) ====================
// Người mới khởi đầu Unclassed (không mang hệ nào — không khắc cũng không bị khắc).
// Tới cấp 10, 9 Tộc mở cửa: chọn 1, nhận quà nhập Tộc, chiêu thức đổi theo Tộc.
window.openSectCeremony = function(){
  if (!player || player.sect !== 'vophai') return;
  if (player.level < 10){
    addFloat(player.x, player.y-56, `The Calling mở khóa ở cấp 10 (hiện cấp ${player.level})`, '#a0ffe9', 13);
    return;
  }
  const wrap = el('ceremony-cards');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const key in SECTS){
    if (key === 'vophai') continue;
    const s = SECTS[key];
    const card = document.createElement('div');
    card.className = 'sect-card';
    card.innerHTML = `<img class="portrait" src="${heroCardUrl(key)}" alt="${s.name}">
      <div class="s-title" style="color:${s.color}">${s.name}</div>
      <div class="s-role">${s.role} · hệ <b style="color:${elColor(s.element)}">${elName(s.element)}</b></div>
      <div class="s-desc">${s.desc}<br><br><b>Kỹ năng khởi đầu:</b> ${s.skillA.name}<br><b>Tuyệt kỹ Lớp:</b> ${s.tp.name}</div>
      <button class="mini-btn" style="margin-top:10px;font-size:13px;padding:7px 20px;border-color:${s.color};color:${s.color}">Gia Nhập</button>`;
    card.addEventListener('click', ()=>chooseSect(key));
    wrap.appendChild(card);
  }
  closePanels();
  el('sect-ceremony').classList.remove('hidden');
  AudioSys.sfx('quest', 0.7);
};
window.chooseSect = function(key){
  if (!player || player.sect !== 'vophai' || !SECTS[key] || key === 'vophai') return;
  player.sect = key;
  const s = SECTS[key];
  player.silver += 500; // quà nhập Tộc
  const w = genItem(10, 0.25); w.slot = 'weapon'; w.slotName = 'Vũ Khí';
  if (player.inv.length < 30) player.inv.push(w); else player.silver += 300;
  player.skillBar = defaultSkillBar(key); // gán sẵn 3 chiêu cố định của Lớp mới
  // Elder's Relic hiện thân: hành trang Unclassed hóa thành báu vật của Tộc mới
  const _tb = THANBINH[key];
  if (_tb){
    addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:_tb.color, big:true });
    setTimeout(()=>{ if (player) addFloat(player.x, player.y-70, `⚔ 【${_tb.name}】hiện thân — theo người khắp Lunacia!`, _tb.color, 15); }, 600);
  }
  applySkillIcons();
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
  el('sect-ceremony').classList.add('hidden');
  zoneBanner = { text:`GIA NHẬP LỚP ${s.name.toUpperCase()}`,
    sub:`Học được ${s.skillA.name} (phím 1) · ${s.tp.name} (phím 3) — quà nhập Lớp: 500◈ + vũ khí Lớp`,
    color:s.color, t:5.5 };
  addEffect({ type:'ring', x:player.x, y:player.y, r:130, color:s.color, big:true });
  AudioSys.sfx('levelup', 0.9);
  checkTitles(); saveGame();
  if (!el('panel-char').classList.contains('hidden')) renderCharPanel();
};
el('btn-ceremony-later').addEventListener('click', ()=>{
  el('sect-ceremony').classList.add('hidden');
  addFloat(player.x, player.y-56, 'Unclassed tự do cũng tốt — muốn đáp lời Calling, mở Nhân Vật (C) bất cứ lúc nào!', '#9aa8d4', 13);
  AudioSys.sfx('ui', 0.5);
});


// ============================================================
// MÔI TRƯỜNG SỐNG: hạt rơi theo bản đồ, cỏ mặt đất, parallax, cây đung đưa
// (lưu ý: drawTufts/drawAmbients/drawTree chạy trong hệ tọa độ THẾ GIỚI —
//  ctx đã translate(-camera) sẵn từ render(), không trừ camera lần nữa)
// ============================================================
const MAP_AMBIENT = {
  daohoa:     { kind:'petal',   color:'#f0a8c0', n:26 }, // hoa đào rơi
  tuongduong: { kind:'mote',    color:'#7ecbff', n:18 }, // bụi vàng thành thị
  ngoai:      { kind:'leaf',    color:'#9ab86a', n:22 }, // lá rụng ngoại ô
  chungnam:   { kind:'firefly', color:'#b8e87a', n:20 }, // đom đóm lăng mộ
  comoc:      { kind:'wisp',    color:'#9a86d8', n:18 }, // tà khí cổ mộc
  tuyettinh:  { kind:'petal',   color:'#e890a8', n:24 }, // cánh hoa tuyệt tình
  mongco:     { kind:'sand',    color:'#d8c89a', n:26 }, // cát mông cổ
  nhanmon:    { kind:'snow',    color:'#eef4ff', n:30 }, // tuyết nhạn môn
};
const DUNGEON_AMBIENT = { kind:'ember', color:'#ff9a5a', n:16 }; // than hồng phó bản

const ambients = []; // hạt bay trong thế giới
const tufts = [];    // vệt cỏ / vết mực trên mặt đất

function spawnAmbients(){
  ambients.length = 0; tufts.length = 0;
  // cỏ/vết mực rải khắp map — vẽ bằng đúng tông patch của map
  for (let i = 0; i < 130; i++){
    tufts.push({ x: rnd(0,MAP.w), y: rnd(0,MAP.h), k: rnd(0,Math.PI*2), len: 4+rnd(0,7), rock: rnd(0,1) > 0.72 });
  }
  let cfg = MAP_AMBIENT[curMap] || (curMap && curMap.startsWith('pb_') ? DUNGEON_AMBIENT : { kind:'mote', color:'#e8d8a8', n:14 });
  cfg = seasonAmbientCfg(cfg);
  const _wx = weatherNow(); // thời tiết ngày phủ lên hạt môi trường (Gói B)
  if (_wx){
    if (_wx.id === 'drizzle' || _wx.id === 'storm'){
      const _wn = _wx.id === 'storm' ? 64 : 32;
      for (let i = 0; i < _wn; i++) ambients.push({ kind:'rain', color:'#a8c8e8', x:rnd(0,MAP.w), y:rnd(0,MAP.h), ph:rnd(0,Math.PI*2), sp:0.6+rnd(0,0.9), sz:1.2+rnd(0,0.8) });
    } else if (_wx.id === 'snow'){
      for (let i = 0; i < 46; i++) ambients.push({ kind:'snow', color:'#eef4ff', x:rnd(0,MAP.w), y:rnd(0,MAP.h), ph:rnd(0,Math.PI*2), sp:0.5+rnd(0,0.9), sz:1.4+rnd(0,1.6) });
    }
  } // Lịch Tu Tiên: hạt môi trường theo MÙA
  for (let i = 0; i < cfg.n; i++){
    ambients.push({
      kind: cfg.kind, color: cfg.color,
      x: rnd(0,MAP.w), y: rnd(0,MAP.h),
      ph: rnd(0,Math.PI*2), sp: 0.5 + rnd(0,0.8),
      sz: (cfg.kind==='petal'||cfg.kind==='leaf') ? 2.5+rnd(0,2.5) : 1+rnd(0,1.8),
    });
  }
}

function updateAmbients(dt){
  if (SETTINGS.lowFx || typeof camera === 'undefined') return;
  const t = performance.now()/1000;
  for (const p of ambients){
    const k = p.kind;
    if (k === 'ember' || k === 'wisp'){ p.y -= (14 + p.sp*14)*dt; p.x += Math.sin(t*1.4 + p.ph)*10*dt; }
    else if (k === 'sand'){ p.x += (34 + p.sp*22)*dt; p.y += Math.sin(t*2 + p.ph)*7*dt; }
    else if (k === 'rain'){ p.y += (300 + p.sp*180)*dt; p.x += 46*dt; } // mưa hạ: rơi nhanh, hơi chéo gió
    else if (k === 'snow'){ p.y += (16 + p.sp*10)*dt; p.x += Math.sin(t*0.9 + p.ph)*9*dt; }
    else if (k === 'firefly'){ p.x += Math.sin(t*0.8 + p.ph)*18*dt; p.y += Math.cos(t*0.6 + p.ph)*13*dt; }
    else if (k === 'mote'){ p.y -= 5*dt; p.x += Math.sin(t*0.7 + p.ph)*7*dt; }
    else { p.y += (10 + p.sp*12)*dt; p.x += Math.sin(t*1.2 + p.ph)*14*dt; } // petal/leaf: rơi + đu đưa
    // wrap quanh camera để hạt luôn phủ quanh người chơi
    const L = camera.x - 160, R = camera.x + W + 160, T = camera.y - 160, B = camera.y + H + 160;
    if (p.x < L) p.x = R; else if (p.x > R) p.x = L;
    if (p.y < T) p.y = B; else if (p.y > B) p.y = T;
  }
}

function drawTufts(){
  if (typeof camera === 'undefined') return;
  const patch = mapDef().patch;
  ctx.lineWidth = 1.5;
  for (const g of tufts){
    // culling theo view (tọa độ thế giới)
    if (g.x < camera.x-20 || g.x > camera.x+W+20 || g.y < camera.y-20 || g.y > camera.y+H+20) continue;
    if (g.rock){
      ctx.fillStyle = patch + '28';
      ctx.beginPath(); ctx.ellipse(g.x, g.y, g.len*0.9, g.len*0.42, g.k, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle = patch + '55';
      ctx.beginPath();
      ctx.moveTo(g.x - g.len*0.5, g.y);
      ctx.quadraticCurveTo(g.x, g.y - g.len*0.8, g.x + g.len*0.5, g.y - g.len*0.15);
      ctx.stroke();
    }
  }
}

function drawAmbients(){
  if (SETTINGS.lowFx || typeof camera === 'undefined') return;
  const t = performance.now()/1000;
  for (const p of ambients){
    if (p.x < camera.x-20 || p.x > camera.x+W+20 || p.y < camera.y-20 || p.y > camera.y+H+20) continue;
    if (p.kind === 'petal' || p.kind === 'leaf'){
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t*1.5 + p.ph);
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.ellipse(0, 0, p.sz, p.sz*0.55, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    } else if (p.kind === 'firefly'){
      const bl = 0.25 + 0.75*Math.abs(Math.sin(t*2.2 + p.ph));
      ctx.globalAlpha = bl;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = bl*0.3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz*2.6, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (p.kind === 'ember'){
      ctx.globalAlpha = 0.5 + 0.4*Math.sin(t*5 + p.ph);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz*0.8, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (p.kind === 'rain'){
      ctx.globalAlpha = 0.35; ctx.strokeStyle = p.color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 4, p.y - 16); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = p.kind === 'snow' ? 0.8 : 0.45;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

// Núi xa 2 lớp parallax — trôi chậm hơn mặt đất tạo chiều sâu (giữ tông thủy mặc gốc)
function drawMountains(){
  ctx.save();
  const cx = (typeof camera !== 'undefined' && camera) ? camera.x : 0;
  const cy = (typeof camera !== 'undefined' && camera) ? camera.y : 0;
  const ridge = (x, s1, s2, ph) => Math.sin(x*0.006 + ph)*s1 + Math.sin(x*0.017 + ph*2.3)*s2;
  ctx.fillStyle = 'rgba(60,54,44,.26)'; // lớp xa — trôi 18% camera
  ctx.beginPath(); ctx.moveTo(-60, -60);
  for (let x = -60; x <= W+60; x += 14) ctx.lineTo(x, 30 + ridge(x + cx*0.18, 20, 8, 2) - cy*0.05);
  ctx.lineTo(W+60, -60); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(60,54,44,.15)'; // lớp gần — trôi 38% camera
  ctx.beginPath(); ctx.moveTo(-60, -60);
  for (let x = -60; x <= W+60; x += 14) ctx.lineTo(x, 58 + ridge(x + cx*0.38, 26, 10, 5) - cy*0.1);
  ctx.lineTo(W+60, -60); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Cây đung đưa nhẹ theo gió — giữ nguyên logic vẽ gốc, thêm xoay quanh gốc cây
function drawTree(d){
  const sway = (SETTINGS.lowFx) ? 0 : Math.sin(performance.now()/900 + d.x*0.7) * 0.025;
  ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(sway); ctx.translate(-d.x, -d.y);
  const tim = (typeof TREE_IMGS !== 'undefined') && TREE_IMGS[curMap];
  if (tim && tim.complete && tim.naturalWidth){
    const h = 100*d.s, w = h * (tim.naturalWidth/tim.naturalHeight);
    ctx.drawImage(tim, d.x-w/2, d.y-h*0.94, w, h);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = '#3a3025'; ctx.lineWidth = 4*d.s; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.quadraticCurveTo(d.x+4*d.s, d.y-18*d.s, d.x-2*d.s, d.y-34*d.s); ctx.stroke();
  const g = ctx.createRadialGradient(d.x, d.y-40*d.s, 2, d.x, d.y-40*d.s, 26*d.s);
  g.addColorStop(0, 'rgba(46,74,50,.85)'); g.addColorStop(1, 'rgba(46,74,50,.15)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(d.x, d.y-40*d.s, 26*d.s, 18*d.s, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(d.x-14*d.s, d.y-30*d.s, 14*d.s, 10*d.s, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(d.x+14*d.s, d.y-32*d.s, 13*d.s, 9*d.s, 0, 0, 7); ctx.fill();
  ctx.restore();
}

// Đồng bộ các checkbox chế độ thử nghiệm (màn intro, màn Quẻ & màn chọn phái cũ)
(function(){
  const boxes = [el('chk-max'), el('chk-max-quze'), el('chk-max-intro')].filter(Boolean);
  for (const box of boxes) box.addEventListener('change', ()=>{ for (const o of boxes) o.checked = box.checked; });
})();

// ============================================================
// THÚ CHIẾN: chiến thú đồng hành — đi theo người chơi, tự tấn công quái
// (thay thế cơ chế cưỡi cũ; nền tảng để sau này gắn kỹ năng riêng cho thú)
// ============================================================
let mountObj = null;
function ensureMount(){
  if (!player || !player.mount || !player.mount.out || player.mount.tier <= 0){ mountObj = null; return; }
  if (mountObj) return;
  mountObj = { tier: player.mount.tier, x: player.x + 52, y: player.y + 36,
    atkT: 0.6, face: 0, wob: Math.random()*10, lungeT: 0 };
}
function mountDmg(){
  const t = MOUNT_TIERS[player.mount.tier];
  return Math.round(t.dmg + (player.atk || 0) * 0.2);
}
function updateMount(dt){
  if (!player || dead){ mountObj = null; return; }
  ensureMount();
  if (!mountObj) return;
  mountObj.wob += dt*6;
  mountObj.lungeT = Math.max(0, mountObj.lungeT - dt);
  // bám theo người chơi — đứng lệch bên phải (Linh Thú bên trái)
  const tx = player.x + 52, ty = player.y + 36;
  const dd = dist(mountObj.x, mountObj.y, tx, ty);
  if (dd > 6){
    const sp = Math.min(dd*4, 340);
    mountObj.x += (tx-mountObj.x)/dd*sp*dt; mountObj.y += (ty-mountObj.y)/dd*sp*dt;
  }
  // tự tấn công quái gần nhất (không đánh Du Hiệp trung lập)
  mountObj.atkT -= dt;
  if (mountObj.atkT <= 0){
    let best = null, bd = 320;
    for (const m of mobs){
      if (m.dead || m.def.duHiep) continue;
      const d2 = dist(mountObj.x, mountObj.y, m.x, m.y);
      if (d2 < bd){ bd = d2; best = m; }
    }
    if (best){
      mountObj.atkT = 1.4;
      mountObj.face = Math.atan2(best.y-mountObj.y, best.x-mountObj.x);
      mountObj.lungeT = 0.18; // vồ tới trước khi cắn
      hurtMob(best, mountDmg(), 'mount');
      const t = MOUNT_TIERS[player.mount.tier];
      addEffect({ type:'ring', x:best.x, y:best.y, r:14, color:t.color });
    } else mountObj.atkT = 0.3;
  }
}
function drawMount(){
  const t = MOUNT_TIERS[mountObj.tier];
  const img = MOUNT_IMGS[mountObj.tier];
  // bóng đổ
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath();
  ctx.ellipse(mountObj.x, mountObj.y+7, 20, 7, 0, 0, 7); ctx.fill();
  const bob = Math.abs(Math.sin(mountObj.wob)) * 3;
  const lunge = mountObj.lungeT > 0 ? (mountObj.lungeT/0.18)*9 : 0;
  const lx = Math.cos(mountObj.face)*lunge, ly = Math.sin(mountObj.face)*lunge;
  if (img && img.complete && img.naturalWidth){
    const mh = 84, mw = mh * (img.naturalWidth/img.naturalHeight);
    const flip = Math.cos(mountObj.face) < 0;
    ctx.save();
    ctx.translate(mountObj.x + lx, mountObj.y - 20 - bob + ly);
    if (flip) ctx.scale(-1, 1);
    ctx.rotate(Math.sin(mountObj.wob)*0.03);
    ctx.drawImage(img, -mw/2, -mh/2, mw, mh);
    ctx.restore();
  } else {
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.ellipse(mountObj.x + lx, mountObj.y - 14 - bob + ly, 16, 12, 0, 0, 7); ctx.fill();
  }
  // tên + vòng hào quang theo giai
  ctx.font = '10px "Be Vietnam Pro", sans-serif'; ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
  ctx.strokeText('⚔ ' + t.name, mountObj.x, mountObj.y - 58);
  ctx.fillStyle = t.color;
  ctx.fillText('⚔ ' + t.name, mountObj.x, mountObj.y - 58);
}

// ════════════════════════════════════════════════════════════════════════════
// TRACK HT (GDD §13) + VÒNG LẶP NGÀY (GDD §5.9) — cài đặt chính
// ════════════════════════════════════════════════════════════════════════════

// ---------- Tứ Châu khảm phúc (gọi từ panel Rèn Luyện) ----------
// Kéo-thả: viên ngọc Tứ Châu (Rèn Luyện) → ô icon món đồ đang chọn, thay cho phải bấm nút riêng.
window._dragJewelKind = null;
window.useJewel = function(kind, uid){
  let it = null;
  for (const s in player.equip) if (player.equip[s] && player.equip[s].uid === uid) it = player.equip[s];
  if (!it) it = player.inv.find(x => x.uid === uid);
  if (!it || !player.jewels) return;
  const J = player.jewels;
  const msg = document.getElementById('jewel-msg');
  const say = (t, c) => { if (msg){ msg.textContent = t; msg.style.color = c; } };
  if (kind === 'chucPhuc'){
    if (J.chucPhuc < 1 || it.noForge || it.plus > 5) return;
    J.chucPhuc--; it.plus++;
    say(`◎ Chúc Phúc — ${it.name} lên +${it.plus}!`, '#8fd18f');
    addFloat(player.x, player.y-40, `◎ +${it.plus} (Chúc Phúc)`, '#7ec850', 14);
    AudioSys.sfx('forge_ok', 0.9);
  } else if (kind === 'linhHon'){
    if (J.linhHon < 1 || it.noForge || it.plus >= 11) return;
    J.linhHon--;
    if (Math.random() < 0.5){
      it.plus++;
      say(`◉ Linh Hồn — ${it.name} lên +${it.plus}!`, '#8fd18f');
      addFloat(player.x, player.y-40, `◉ +${it.plus} (Linh Hồn)`, '#b08ae8', 14);
      if (it.plus === 10) addFloat(player.x, player.y-58, `☆ Thức tỉnh: ${it.awakened.name}`, '#f39c3d', 13);
      if (it.plus === 11){ player.forged11 = true; addFloat(player.x, player.y-76, '☀ KHAI QUANG +11 — Thiên Lôi Cương Khí!', '#ffd76a', 16); }
      AudioSys.sfx('forge_ok', 0.9);
    } else {
      it.plus = Math.max(0, it.plus - 1);
      say(`✘ Linh Hồn thất bại — ${it.name} tụt còn +${it.plus}`, '#ff7a6a');
      addFloat(player.x, player.y-40, `◉ Xịt — tụt còn +${it.plus}`, '#ff7a6a', 13);
      AudioSys.sfx('forge_fail', 0.85);
    }
  } else if (kind === 'sinhMenh'){
    if (J.sinhMenh < 1 || !ARMOR_SLOTS.includes(it.slot) || (it.life || 0) >= 7) return;
    J.sinhMenh--;
    const rate = Math.max(25, 75 - (it.life || 0) * 8);
    if (Math.random()*100 < rate){
      it.life = (it.life || 0) + 1;
      say(`❤ Sinh Mệnh bậc ${it.life} — +${it.life*4}% HP tối đa!`, '#8fd18f');
      addFloat(player.x, player.y-40, `❤ Sinh Mệnh +${it.life*4}% HP`, '#e84a6a', 14);
      AudioSys.sfx('forge_ok', 0.9);
    } else {
      it.life = 0;
      say('✘ Sinh Mệnh tan biến — dòng HP về 0!', '#ff7a6a');
      addFloat(player.x, player.y-40, '❤ Xịt — Sinh Mệnh về 0!', '#ff7a6a', 13);
      AudioSys.sfx('forge_fail', 0.85);
    }
  }
  dailyTrack('forge');
  calcDerived(); saveGame(); renderForge(); refreshEqPanels();
};

// ---------- Bảng giá Lò Hỗn Loạn (công thức 'hopnhat' của Lò Hỗn Độn) ----------
const CHAOS_RATE = [70, 55, 40, 25]; // % theo phẩm gốc: Phàm→Tinh, Tinh→Linh, Linh→Thần, Thần→ChíTôn
const CHAOS_HON_COST = [2, 4, 7, 12];
const CHAOS_SILVER_COST = [300, 800, 2000, 5000];
// Cảnh ghép đồ kiểu MU Online: yêu tinh tung quả cầu Hỗn Nguyên trong lúc luyện —
// mutation & lưu game đã chạy synchronous ở chaosCombine, hàm này chỉ diễn hoạt rồi gọi onReveal
// để lấy dữ liệu hiển thị (tên/màu vật phẩm mới) đúng lúc "khui" kết quả.
function playChaosAnim(items, r, success, onReveal){
  const nextColor = (RARITIES[r+1] || RARITIES[r]).color;
  const slotsHtml = items.map(it => `<div class="chaos-slot">${slotIcon(it)}</div>`).join('');
  document.getElementById('overlay-inner').innerHTML = `
    <h2 style="color:${RARITIES[r].color}">◑ Lò Hỗn Loạn</h2>
    <p style="margin-bottom:10px">Yêu tinh giữ lò đang tung Hỗn Nguyên Thạch, luyện hoá 3 món...</p>
    <div class="chaos-scene" id="chaos-scene" style="--oc:${nextColor}">
      <div class="chaos-slots">${slotsHtml}</div>
      <div class="chaos-goblin">👺</div>
      <div class="chaos-orb"></div>
      <div class="chaos-result-item" id="chaos-result-item"></div>
    </div>
    <div class="chaos-result-text" id="chaos-result-text"></div>`;
  document.getElementById('overlay').classList.remove('hidden');
  const scene = document.getElementById('chaos-scene');
  requestAnimationFrame(() => requestAnimationFrame(() => { if (scene) scene.classList.add('brewing'); }));
  AudioSys.sfx('ui', 0.5);
  setTimeout(() => {
    if (!scene) return;
    scene.classList.remove('brewing');
    scene.classList.add(success ? 'chaos-success' : 'chaos-fail');
    const data = onReveal() || {};
    const txt = document.getElementById('chaos-result-text');
    if (success && data.newItem){
      document.getElementById('chaos-result-item').innerHTML = slotIcon(data.newItem);
      txt.textContent = `THÀNH CÔNG! → ${data.newItem.name}`;
      txt.style.color = RARITIES[data.newItem.rarity].color;
      AudioSys.sfx('forge_ok', 0.95);
    } else {
      txt.textContent = 'THẤT BẠI — mất sạch!';
      txt.style.color = '#ff5a4a';
      AudioSys.sfx('forge_fail', 0.8);
    }
    setTimeout(() => {
      document.getElementById('overlay').classList.add('hidden');
      renderForge();
    }, 1400);
  }, 1300);
}

// ---------- Bảo Hạp (mở từ Túi Đồ) — Cổ Thần chỉ từ đây, KHÔNG pity ----------
window.openBaoHap = function(t){
  const bh = player.baohap || {};
  if (!bh[t] || bh[t] <= 0) return;
  const def = BAOHAP_TIERS[t];
  bh[t]--;
  const lv = Math.max(player.level, def.min);
  const got = [];
  if (def.ancient > 0 && Math.random() < def.ancient){
    const setIds = Object.keys(ANCIENT_SETS);
    const it = genAncient(setIds[Math.floor(Math.random()*setIds.length)], ARMOR_SLOTS[Math.floor(Math.random()*ARMOR_SLOTS.length)], lv);
    if (player.inv.length < 30){
      player.inv.push(it);
      got.push(`<b style="color:${ANCIENT_SETS[it.ancient].color}">◈ CỔ THẦN — ${it.name}</b> (${Math.round(def.ancient*100)}% đã mỉm cười!)`);
      zoneBanner = { text:'◈ CỔ THẦN XUẤT THẾ', sub:`${it.name} — ${ANCIENT_SETS[it.ancient].hint}!`, color:'#3ac88a', t:5 };
      AudioSys.sfx('levelup', 0.95);
    } else { player.silver += 3000; got.push('Túi đầy — Cổ Thần quy đổi 3000◈'); }
  } else {
    let it = null;
    const _bp = BAOHAP_PERFECT[Math.min(t, BAOHAP_PERFECT.length - 1)] || 0;
    for (let i = 0; i < 6; i++){ it = genItem(lv, 0.5 + t*0.06, null, { perfect: _bp }); if (it.rarity >= 2) break; }
    // Khắc Ấn chỉ từ Bảo Hạp IV trở lên, tỉ lệ tăng dần theo tầng (IV 18% → VII 33%)
    if (t >= 4) attachSigil(it, 0.18 + (t - 4) * 0.05);
    if (player.inv.length < 30){
      player.inv.push(it);
      got.push(`Trang bị: <b class="${RARITIES[it.rarity].cls}">${it.name}</b>`);
      if (it.sigil) got.push(sigilGotLine(it.sigil));
    }
    else { player.silver += 800; got.push('Túi đầy — trang bị quy đổi 800◈'); }
  }
  // Châu kèm theo — tầng càng cao tỉ lệ càng tốt
  const jr = Math.random()*100;
  const cp = 22 + t*2, lh = cp + 12 + t, sm = lh + 6 + t*0.5, hd = sm + 3 + t*0.5;
  if (jr < cp){ player.jewels.chucPhuc++; got.push(JEWEL_NAMES.chucPhuc); }
  else if (jr < lh){ player.jewels.linhHon++; got.push(JEWEL_NAMES.linhHon); }
  else if (jr < sm){ player.jewels.sinhMenh++; got.push(JEWEL_NAMES.sinhMenh); }
  else if (jr < hd){ player.jewels.honDon++; got.push(JEWEL_NAMES.honDon); }
  const sil = 150 + t*120;
  player.silver += sil;
  player.dantian.tuvi += 20*t;
  got.push(`${sil}◈ · ${20*t} Anima`);
  addFloat(player.x, player.y-56, `Mở ${def.name}!`, def.color, 15);
  AudioSys.sfx('coin', 0.7);
  saveGame(); refreshEqPanels();
  el('panel-quest').innerHTML = `<h3>${def.name}</h3><button class="close-x" onclick="closePanels()">✕</button>
    <div style="padding:10px;font-size:13px;line-height:2">Khai mở bảo hạp:<br>${got.join('<br>')}</div>
    <div class="forge-actions"><button class="mini-btn" onclick="togglePanel('bag')">Xem Túi Đồ</button></div>`;
  closePanels(); el('panel-quest').classList.remove('hidden');
};

// ---------- Ma Tôn Giáng Thế — 4 giờ/lần (0h 4h 8h 12h 16h 20h), luân phiên Hạ/Thượng Giới ----------
let MATON = { next: 0, warned: false, active: false, map: null, endsAt: 0 };
function matonNextBoundary(after){
  const d = new Date(after); d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  while (d.getHours() % 4 !== 0) d.setHours(d.getHours() + 1);
  return d.getTime();
}
function matonMapFor(t){
  const slot = Math.floor(t / 14400000);
  const half = Math.floor(slot / 2);
  return slot % 2 === 0 ? MATON_HA[half % MATON_HA.length] : MATON_THUONG[half % MATON_THUONG.length];
}
function updateMaTon(){
  const now = Date.now();
  if (!MATON.next) MATON.next = matonNextBoundary(now);
  if (!MATON.active && !MATON.warned && now >= MATON.next - 600000){
    MATON.warned = true;
    const mapId = matonMapFor(MATON.next);
    zoneBanner = { text:'⚠ HUNG THẦN SẮP GIÁNG THẾ', sub:`10 phút nữa — ${MAPS[mapId].name}. Chuẩn bị ứng chiến!`, color:'#c07fe0', t:5 };
    AudioSys.sfx('quest', 0.8);
  }
  if (!MATON.active && now >= MATON.next){
    MATON.active = true; MATON.warned = false;
    MATON.map = matonMapFor(MATON.next);
    MATON.endsAt = now + 30*60000;
    MATON.next = matonNextBoundary(now + 60000);
    zoneBanner = { text:'☠ HUNG THẦN GIÁNG THẾ', sub:`Tà khí phủ ${MAPS[MATON.map].name} — hạ Hung Thần nhận Bảo Hạp!`, color:'#e84a6a', t:6 };
    AudioSys.sfx('crit', 0.9);
    if (curMap === MATON.map) spawnMaTonMob();
    saveGame();
  }
  if (MATON.active && now >= MATON.endsAt){
    MATON.active = false; MATON.map = null;
    zoneBanner = { text:'Hung Thần đã rời đi', sub:'Tà khí tản dần — hẹn khung giờ sau.', color:'#8a8a8a', t:3.5 };
    saveGame();
  }
}
function spawnMaTonMob(){
  const md = MAPS[MATON.map];
  const lv = Math.min(110, md.min + 12);
  const def = { name:'Hung Thần · Hỗn Độn', lv, hp: 5000 + lv*lv*7, atk: 10 + Math.round(lv*3), def: Math.round(lv*0.8),
    xp: lv*150, silver:[lv*8, lv*12], speed: 70, aggro: 9999, range: 46, atkCd: 1.3, size: 30,
    color:'#2a0a24', eye:'#ff3a6a', boss:true, elite:true, drop:1, el:'Hỏa', img:'assets/mobs/boss.png' };
  const m = { type:'maton', def, name: def.name,
    x: MAP.w*0.55, y: MAP.h*0.42, zone: null, pack: null,
    hp: def.hp, maxHp: def.hp, atkT: rnd(0,1), dead: false, face: 0,
    shield: 1, shieldT: 0, hitT: 0, wob: Math.random()*10, packAlert: 0 };
  mobs.push(m);
  zoneBanner = { text:'☠ HUNG THẦN XUẤT HIỆN', sub:'Ngay trước mắt — toàn lực ứng chiến!', color:'#e84a6a', t:4 };
  return m;
}
function matonKilled(m){
  MATON.active = false; MATON.map = null;
  const tier = clamp(Math.floor(player.level/15) + 1, 1, 7);
  player.baohap[tier] = (player.baohap[tier] || 0) + 1;
  zoneBanner = { text:'☠ HUNG THẦN ĐÃ BỊ TIÊU DIỆT', sub:`Nhận ${BAOHAP_TIERS[tier].name} — mở trong Túi Đồ (phím I)!`, color:'#7ecbff', t:6 };
  addFloat(m.x, m.y-130, `+1 ${BAOHAP_TIERS[tier].name}`, BAOHAP_TIERS[tier].color, 16);
  AudioSys.sfx('levelup', 1);
  // Hung Thần là sự kiện thế giới hiếm nhất (4 giờ/lần, một con boss) — 45% rơi thẳng một món
  // mang Khắc Ấn, không phải qua Bảo Hạp. Đây là nguồn Khắc Ấn chắc tay nhất trong game.
  if (player.inv.length < 30){
    const it = genItem(Math.max(player.level, m.def.lv || player.level), 0.7);
    if (attachSigil(it, 0.45)){
      player.inv.push(it);
      sigilAnnounce(it.sigil, m.x, m.y - 160);
    }
  }
  saveGame();
}
// Hook QA: đẩy lịch Ma Tôn đến sau vài giây
window.debugMaTon = function(sec){ MATON.next = Date.now() + (sec || 5)*1000; MATON.warned = true; return MATON; };

// ═══════════ XÂM LĂNG VÀNG — mỗi 4 giờ thật, lệch 2 giờ so với Hung Thần ═══════════
// Nhịp MU cổ điển: cứ 2 tiếng có MỘT sự kiện thế giới (0h/4h/8h… Hung Thần, 2h/6h/10h…
// Xâm Lăng Vàng). Một đàn quái dát vàng tràn vào 1 map thường trong 12 phút; mỗi con
// CHẮC CHẮN rơi Bảo Hạp theo bậc map (I-V), Chúa Đàn Vàng rơi hạp cao hơn 1 bậc.
// Không lưu state — mốc giờ tính lại được từ đồng hồ thật, đến trễ coi như lỡ chuyến.
const GOLDEN_FIELD = ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon'];
const GOLDEN_BOX = { daohoa:1, ngoai:2, chungnam:2, comoc:3, tuyettinh:4, mongco:4, nhanmon:5 };
let GOLDEN = { next: 0, warned: false, active: false, map: null, endsAt: 0, spawnedOn: null, left: 0 };
function goldenNextBoundary(after){
  const d = new Date(after); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1);
  while (d.getHours() % 4 !== 2) d.setHours(d.getHours() + 1); // 2h · 6h · 10h · 14h · 18h · 22h
  return d.getTime();
}
function goldenMapFor(t){ return GOLDEN_FIELD[Math.floor(t / 14400000) % GOLDEN_FIELD.length]; }
function goldenPal(){ // bảng màu dát vàng cho quái khung xương
  return { main:'#e0b84a', dark:'#9a7420', trim:'#fff0b8', glow:'#ffd76a', cloth:'#7a5c18', bone:'#fff4d0', line:'#4a3810' };
}
function goldify(m, tier, leader){
  const d = Object.assign({}, m.def);          // CLONE — không được sửa def gốc trong MOBS
  d.name = leader ? 'Chúa Đàn Vàng' : d.name + ' Vàng';
  d.hp = Math.round(d.hp * (leader ? 14 : 6)); d.atk = Math.round(d.atk * (leader ? 1.7 : 1.4));
  d.xp = Math.round(d.xp * 3); d.silver = [d.silver[0]*3, d.silver[1]*3];
  d.aggro = Math.max(d.aggro, 260); d.elite = true; d.golden = true;
  d.goldBox = Math.min(5, tier + (leader ? 1 : 0));
  if (leader){ d.size = d.size + 8; d.goldenLeader = true; }
  if (d.skel) d.skelPal = goldenPal();
  m.def = d; m.name = d.name; m.hp = d.hp; m.maxHp = d.hp;
  m.zone = null;                               // chết là hết — quái vàng không hồi sinh
  return m;
}
function spawnGoldenMobs(){
  if (GOLDEN.spawnedOn === curMap) return;
  GOLDEN.spawnedOn = curMap;
  const md = MAPS[GOLDEN.map], tier = GOLDEN_BOX[GOLDEN.map] || 1;
  const packs = md.packs.slice(0, 4);
  let n = 0;
  for (const q of packs){
    for (let i = 0; i < 2; i++){ goldify(spawnMob(q.mob, { x:q.x, y:q.y, r:90 }, null, true), tier, false); n++; }
  }
  const lq = packs[packs.length - 1];          // Chúa Đàn đứng giữa map
  goldify(spawnMob(lq.mob, { x: md.spawn.x + (MAP.w/2 - md.spawn.x)*0.7, y: MAP.h/2, r: 60 }, null, true), tier, true);
  GOLDEN.left = n + 1;
  zoneBanner = { text:'✦ ĐÀN VÀNG TRÀN VÀO', sub:`${GOLDEN.left} quái dát vàng — mỗi con rơi 1 Bảo Hạp!`, color:'#ffd76a', t:5 };
}
function updateGolden(){
  const now = Date.now();
  if (!GOLDEN.next) GOLDEN.next = goldenNextBoundary(now);
  if (!GOLDEN.active && !GOLDEN.warned && now >= GOLDEN.next - 600000){
    GOLDEN.warned = true;
    zoneBanner = { text:'✦ ĐÀN VÀNG SẮP XÂM LĂNG', sub:`10 phút nữa — ${MAPS[goldenMapFor(GOLDEN.next)].name}. Săn Bảo Hạp!`, color:'#ffd76a', t:5 };
    AudioSys.sfx('quest', 0.8);
  }
  if (!GOLDEN.active && now >= GOLDEN.next){
    GOLDEN.active = true; GOLDEN.warned = false;
    GOLDEN.map = goldenMapFor(GOLDEN.next);
    GOLDEN.endsAt = now + 12*60000;
    GOLDEN.next = goldenNextBoundary(now + 60000);
    GOLDEN.spawnedOn = null; GOLDEN.left = 0;
    zoneBanner = { text:'✦ XÂM LĂNG VÀNG', sub:`Đàn quái dát vàng tràn vào ${MAPS[GOLDEN.map].name} — 12 phút, mỗi con rơi 1 ${BAOHAP_TIERS[GOLDEN_BOX[GOLDEN.map]].name}!`, color:'#ffd76a', t:6 };
    AudioSys.sfx('crit', 0.9);
    if (curMap === GOLDEN.map) spawnGoldenMobs();
  }
  if (GOLDEN.active && now >= GOLDEN.endsAt){
    GOLDEN.active = false;
    let fled = 0;
    for (const m of mobs) if (m.def && m.def.golden && !m.dead){ m.dead = true; m.gone = true; m.deadT = 0; fled++;
      addEffect({ type:'ring', x:m.x, y:m.y, r:40, color:'#ffd76a' }); }
    GOLDEN.map = null; GOLDEN.spawnedOn = null;
    zoneBanner = { text:'Đàn Vàng đã rút lui', sub: fled ? `${fled} con kịp tẩu thoát cùng số Bảo Hạp còn lại.` : 'Hẹn chuyến xâm lăng sau.', color:'#8a8a8a', t:4 };
  }
}
function goldenKilled(m){
  const tier = m.def.goldBox;
  player.baohap[tier] = (player.baohap[tier] || 0) + 1;
  addFloat(m.x, m.y - 90, `+1 ${BAOHAP_TIERS[tier].name}`, BAOHAP_TIERS[tier].color, 15);
  AudioSys.sfx('quest', 0.6);
  // Bản sắc riêng của Xâm Lăng Vàng: ngoài Bảo Hạp, đây là nguồn Khắc Ấn thứ ba. Chúa Đàn Vàng
  // 35%, quái vàng thường 8% — trước đây sự kiện này không có gì khác ngoài "hạp bậc cao hơn".
  if (player.inv.length < 30){
    const it = genItem(Math.max(player.level, m.def.lv || player.level), 0.6);
    if (attachSigil(it, m.def.goldenLeader ? 0.35 : 0.08)){
      player.inv.push(it);
      sigilAnnounce(it.sigil, m.x, m.y - 110);
    }
  }
  if (GOLDEN.active && GOLDEN.spawnedOn){
    GOLDEN.left = Math.max(0, GOLDEN.left - 1);
    if (m.def.goldenLeader)
      zoneBanner = { text:'✦ CHÚA ĐÀN VÀNG GỤC NGÃ', sub:`+1 ${BAOHAP_TIERS[tier].name} — mở trong Túi Đồ (phím I)!`, color:'#ffd76a', t:4 };
    if (GOLDEN.left === 0){
      GOLDEN.active = false; GOLDEN.map = null; GOLDEN.spawnedOn = null;
      zoneBanner = { text:'✦ ĐÀN VÀNG BỊ QUÉT SẠCH', sub:'Toàn bộ Bảo Hạp về tay ngươi — mở trong Túi Đồ (phím I)!', color:'#ffd76a', t:6 };
      AudioSys.sfx('levelup', 1);
    }
  }
  saveGame();
}
window.debugGolden = function(sec){ GOLDEN.next = Date.now() + (sec || 5)*1000; GOLDEN.warned = true; return GOLDEN; };

// ═══════════ CHÚA TỂ VỰC NỨT — 6 giờ thật/lần: 0h · 6h · 12h · 18h (4 lượt/ngày) ═══════════
// Boss thế giới lớn nhất game. Khác hai sự kiện kia ở chỗ nó KHÔNG chọn một map: khi cửa vực
// mở, mọi bãi săn đều nứt — người chơi cấp nào cũng có phần, boss lên cấp theo map đang đứng.
// Mốc giờ tính lại được từ đồng hồ thật nên không cần lưu; đến trễ là lỡ chuyến, đúng nhịp MU.
const RIFT_FIELD = ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon'];
const RIFT_WINDOW_MS = 45*60000;   // cửa vực mở 45 phút
const RIFT_WARN_MS   = 15*60000;   // báo trước 15 phút — sự kiện lớn nhất nên báo sớm nhất
const RIFT_MAX_KILLS = 3;          // chạy map kiếm thêm được, nhưng tối đa 3 con/lượt
const RIFT_MIN_LV    = 15;         // dưới cấp này vực không nứt — xem ghi chú ở riftCanSpawn()
let RIFT = { next: 0, warned: false, active: false, endsAt: 0, done: {}, kills: 0 };
function riftNextBoundary(after){
  const d = new Date(after); d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  while (d.getHours() % 6 !== 0) d.setHours(d.getHours() + 1); // 0h · 6h · 12h · 18h
  return d.getTime();
}
function riftBoxTier(){ return clamp(Math.floor(player.level/15) + 2, 1, 7); }
// Ảnh chụp cho thấy vì sao hai chốt dưới đây là bắt buộc: bản đầu boss aggro toàn map + spawn
// ở cả bãi tân thủ, nên nhân vật cấp 1 vừa vào Petalshade Isle đã bị nó băng qua nửa map đấm
// chết trong 2 nhịp. Vực Nứt là boss thế giới lớn nhất — nó phải là thứ NGƯƠI chọn xông tới.
function riftCanSpawn(){
  return RIFT.active && RIFT.kills < RIFT_MAX_KILLS && !RIFT.done[curMap]
      && RIFT_FIELD.includes(curMap) && player && player.level >= RIFT_MIN_LV;
}
function updateRift(){
  const now = Date.now();
  if (!RIFT.next) RIFT.next = riftNextBoundary(now);
  if (!RIFT.active && !RIFT.warned && now >= RIFT.next - RIFT_WARN_MS){
    RIFT.warned = true;
    zoneBanner = { text:'✹ VỰC NỨT SẮP TOÁC MỞ', sub:`15 phút nữa — Chúa Tể Vực Nứt giáng xuống MỌI bãi săn (cần cấp ${RIFT_MIN_LV}+). Vá giáp, nạp thuốc!`, color:'#a06aff', t:5.5 };
    AudioSys.sfx('quest', 0.85);
  }
  if (!RIFT.active && now >= RIFT.next){
    RIFT.active = true; RIFT.warned = false;
    RIFT.endsAt = now + RIFT_WINDOW_MS;
    RIFT.next = riftNextBoundary(now + 60000);
    RIFT.done = {}; RIFT.kills = 0;
    zoneBanner = { text:'✹ CHÚA TỂ VỰC NỨT GIÁNG THẾ', sub:`Vực nứt toác ở mọi bãi săn — 45 phút, hạ tối đa ${RIFT_MAX_KILLS} con để cướp Bảo Hạp lớn!`, color:'#a06aff', t:6.5 };
    AudioSys.sfx('levelup', 0.9);
    if (riftCanSpawn()) spawnRiftBoss();
    saveGame();
  }
  if (RIFT.active && now >= RIFT.endsAt) riftClose('Cửa vực khép lại — hẹn khung giờ sau (6 tiếng/lần).');
}
function riftClose(sub){
  RIFT.active = false; RIFT.done = {}; RIFT.kills = 0;
  let fled = 0;
  for (const m of mobs) if (m.type === 'rift' && !m.dead){ m.dead = true; m.gone = true; m.deadT = 0; fled++;
    addEffect({ type:'ring', x:m.x, y:m.y, r:70, color:'#a06aff', big:true }); }
  zoneBanner = { text:'✹ Vực nứt đã khép', sub: fled ? 'Chúa Tể rút về bên kia vết nứt cùng chiến lợi phẩm.' : sub, color:'#8a8a8a', t:4 };
  saveGame();
}
function spawnRiftBoss(){
  const md = MAPS[curMap];
  RIFT.done[curMap] = true;
  // Bám theo cấp người chơi (không phải cấp map): luôn là một nấc trên tầm ngươi, không bao
  // giờ là bức tường vô lý khi ngươi tạt qua bãi thấp.
  const lv = clamp(Math.max(md.min + 10, player.level + 6), RIFT_MIN_LV, 120);
  const def = { name:'Chúa Tể Vực Nứt', lv, hp: 9000 + lv*lv*11, atk: 14 + Math.round(lv*3.4), def: Math.round(lv*1.0),
    xp: lv*260, silver:[lv*14, lv*20], speed: 74, aggro: 420, range: 50, atkCd: 1.25, size: 34,
    color:'#1a0a2e', eye:'#c07fe0', boss:true, elite:true, drop:1, el:'Thủy',
    // Dựng bằng khung xương 'fiend' thay vì boss.png: Hung Thần và boss vùng đã dùng chung ảnh
    // đó rồi — boss thế giới lớn nhất mà đụng hàng thì mất hết cảm giác "thứ này khác hẳn".
    skel:'fiend', skelPal:{ main:'#4a2a6e', dark:'#1a0a2e', trim:'#a06aff', cloth:'#2e1450',
                            bone:'#e0d0ff', glow:'#c07fe0', line:'#0d0418' } };
  const m = { type:'rift', def, name: def.name,
    x: MAP.w*0.5, y: MAP.h*0.5, zone: null, pack: null,
    hp: def.hp, maxHp: def.hp, atkT: rnd(0,1), dead: false, face: 0,
    shield: 1, shieldT: 0, hitT: 0, wob: Math.random()*10, packAlert: 0 };
  mobs.push(m);
  addEffect({ type:'ring', x:m.x, y:m.y, r:150, color:'#a06aff', big:true });
  zoneBanner = { text:'✹ VỰC NỨT TOÁC NGAY GIỮA BÃI', sub:`${def.name} cấp ${lv} — rơi ${BAOHAP_TIERS[riftBoxTier()].name} + Hỗn Độn Châu!`, color:'#a06aff', t:5 };
  AudioSys.sfx('crit', 0.95);
  return m;
}
function riftKilled(m){
  RIFT.kills++;
  const tier = riftBoxTier();
  player.baohap[tier] = (player.baohap[tier] || 0) + 1;
  player.jewels.honDon = (player.jewels.honDon || 0) + 2;
  addFloat(m.x, m.y-130, `+1 ${BAOHAP_TIERS[tier].name}`, BAOHAP_TIERS[tier].color, 16);
  addFloat(m.x, m.y-108, `+2 ${JEWEL_NAMES.honDon}`, JEWEL_COLORS.honDon, 14);
  AudioSys.sfx('levelup', 1);
  // Nguồn Khắc Ấn chắc tay nhất game — 60%, cao hơn cả Hung Thần (45%).
  if (player.inv.length < 30){
    const it = genItem(Math.max(player.level, m.def.lv || player.level), 0.8);
    if (attachSigil(it, 0.6)){ player.inv.push(it); sigilAnnounce(it.sigil, m.x, m.y - 170); }
  }
  const con = RIFT_MAX_KILLS - RIFT.kills;
  if (con > 0 && RIFT.active)
    zoneBanner = { text:'✹ CHÚA TỂ VỰC NỨT GỤC NGÃ', sub:`Còn ${con} con ở bãi săn khác — cửa vực đóng lúc ${fmtClock(RIFT.endsAt)}!`, color:'#a06aff', t:5 };
  else
    riftClose('Đã hạ trọn cả 3 Chúa Tể — chiến lợi phẩm về tay ngươi!');
  saveGame();
}
// Hook QA: đẩy lịch Vực Nứt đến sau vài giây
window.debugRift = function(sec){ RIFT.next = Date.now() + (sec || 5)*1000; RIFT.warned = true; return RIFT; };

// ═══════════ BẢNG SỰ KIỆN — đồng hồ hẹn giờ kiểu MMORPG cổ điển ═══════════
function fmtCountdown(ms){
  ms = Math.max(0, ms);
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  return h > 0 ? `${h}g${String(m % 60).padStart(2,'0')}` : (m > 0 ? `${m} phút` : 'sắp diễn ra!');
}
function fmtClock(t){ const d = new Date(t); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
function eventList(now){
  const list = [];
  if (typeof MATON !== 'undefined'){
    list.push(MATON.active
      ? { icon:'☠', name:'Hung Thần Giáng Thế', map: MATON.map, at: MATON.endsAt, active:true, color:'#e84a6a',
          sub:`ĐANG DIỄN RA tại ${MAPS[MATON.map].name} — còn ${fmtCountdown(MATON.endsAt - now)}` }
      : { icon:'☠', name:'Hung Thần Giáng Thế', map: matonMapFor(MATON.next || matonNextBoundary(now)),
          at: MATON.next || matonNextBoundary(now), active:false, color:'#c07fe0',
          sub:`${fmtClock(MATON.next || matonNextBoundary(now))} · ${MAPS[matonMapFor(MATON.next || matonNextBoundary(now))].name} — hạ boss nhận Bảo Hạp lớn` });
    list.push(RIFT.active
      ? { icon:'✹', name:'Chúa Tể Vực Nứt', map: null, at: RIFT.endsAt, active:true, color:'#a06aff',
          sub:`ĐANG DIỄN RA ở MỌI bãi săn — còn ${fmtCountdown(RIFT.endsAt - now)} · đã hạ ${RIFT.kills}/${RIFT_MAX_KILLS}` }
      : { icon:'✹', name:'Chúa Tể Vực Nứt', map: null,
          at: RIFT.next || riftNextBoundary(now), active:false, color:'#a06aff',
          sub:`${fmtClock(RIFT.next || riftNextBoundary(now))} · 6 tiếng/lần (0h·6h·12h·18h) — nứt ở mọi bãi săn (cấp ${RIFT_MIN_LV}+), boss luôn trên tầm ngươi 6 cấp` });
    list.push(GOLDEN.active
      ? { icon:'✦', name:'Xâm Lăng Vàng', map: GOLDEN.map, at: GOLDEN.endsAt, active:true, color:'#ffd76a',
          sub:`ĐANG DIỄN RA tại ${MAPS[GOLDEN.map].name} — còn ${fmtCountdown(GOLDEN.endsAt - now)} · còn ${GOLDEN.left || '?'} quái vàng` }
      : { icon:'✦', name:'Xâm Lăng Vàng', map: goldenMapFor(GOLDEN.next || goldenNextBoundary(now)),
          at: GOLDEN.next || goldenNextBoundary(now), active:false, color:'#ffd76a',
          sub:`${fmtClock(GOLDEN.next || goldenNextBoundary(now))} · ${MAPS[goldenMapFor(GOLDEN.next || goldenNextBoundary(now))].name} — mỗi quái vàng rơi 1 Bảo Hạp (I-V theo map)` });
  }
  const mid = new Date(now); mid.setHours(24, 0, 0, 0);
  list.push({ icon:'⚔', name:'Truy Nã Lệnh & Mục Tiêu Ngày', at: mid.getTime(), active:false, color:'#7ecbff',
              sub:`Làm mới lúc 00:00 — còn ${fmtCountdown(mid.getTime() - now)}` });
  return list;
}
function nextEventInfo(now){
  const evs = eventList(now).filter(e => e.icon !== '⚔');
  evs.sort((a, b) => (b.active - a.active) || (a.at - b.at));
  return evs[0] || null;
}
window.goEventMap = function(id){
  document.getElementById('overlay').classList.add('hidden');
  const g = mapGate(id);
  if (!g.ok){
    const msg = g.why === 'lv' ? `Cần cấp ${g.need} để vào ${MAPS[id].name}!` : `Chưa mở đường đến ${MAPS[id].name} — hoàn thành "${g.quest}"!`;
    addFloat(player.x, player.y - 40, msg, '#ff9a5a', 13); return;
  }
  travelTo(id);
};
window.openEventBoard = function(){
  const ov = document.getElementById('overlay'); if (!ov || !player) return;
  const now = Date.now();
  let rows = '';
  for (const e of eventList(now)){
    rows += `<div style="display:flex;align-items:center;gap:10px;text-align:left;background:rgba(255,255,255,.04);
        border:1px solid ${e.active ? e.color : 'rgba(255,255,255,.10)'};border-radius:10px;padding:9px 12px;margin:7px 0">
      <span style="font-size:20px;color:${e.color}">${e.icon}</span>
      <span style="flex:1"><b style="color:${e.color}">${e.name}</b>${e.active ? ' <b style="color:#ffd76a">● LIVE</b>' : ''}<br>
        <span style="font-size:12px;opacity:.8">${e.sub}</span></span>
      ${e.map ? `<button class="mini-btn" onclick="goEventMap('${e.map}')">${e.active ? 'Tới Ngay' : 'Xem Map'}</button>` : ''}</div>`;
  }
  document.getElementById('overlay-inner').innerHTML = `
    <h2 style="color:#ffd76a">⏱ BẢNG SỰ KIỆN</h2>
    <div style="font-size:12.5px;opacity:.75;margin-bottom:4px">Chạy theo giờ thật: Hung Thần 0h·4h·8h… · Xâm Lăng Vàng 2h·6h·10h… · <b style="color:#a06aff">Chúa Tể Vực Nứt 0h·6h·12h·18h</b> (4 lượt/ngày, nứt ở mọi bãi săn)</div>
    ${rows}
    <button class="big-btn" style="margin-top:10px" onclick="document.getElementById('overlay').classList.add('hidden')">Đóng</button>`;
  ov.classList.remove('hidden');
};


// ---------- Truy Nã Lệnh (GDD §5.9) — Bổ Đầu · Tương Dương ----------
function truynaBand(){
  let idx = TRUYNA_BANDS.findIndex(b => player.level <= b.max);
  if (idx < 0) idx = TRUYNA_BANDS.length - 1;
  while (idx > 0){
    const g = mapGate(TRUYNA_BANDS[idx].map);
    if (g && g.ok) break;
    idx--;
  }
  return TRUYNA_BANDS[idx];
}
function renderTruyNa(){
  const today = new Date().toDateString();
  if (!player.truyna || player.truyna.day !== today) player.truyna = { day: today, state:'none', map: null };
  const tn = player.truyna;
  const band = truynaBand();
  const n = NPCS.find(x => x.id === 'bodau');
  let html = `<h3>${n.name}</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">${n.lore}</div>`;
  if (tn.state === 'none'){
    html += `<div class="next-tier"><b style="color:#e8b04a">⚖ Truy Nã Lệnh hôm nay</b><br>
      Mục tiêu: <b style="color:#ff7a6a">${band.name}</b> (sức mạnh theo cấp ${player.level})<br>
      Nơi ẩn náu: <b>${MAPS[band.map].name}</b><br>
      <span style="opacity:.75">Thưởng: 1 ⚜ Công Huân Lệnh + bạc + Anima — mỗi ngày 1 lần</span></div>
      <div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 20px" onclick="truynaAccept()">Nhận Truy Nã</button></div>`;
  } else if (tn.state === 'hunting'){
    html += `<div class="next-tier" style="border-color:#ff7a6a"><b style="color:#ff7a6a">Đang truy nã: ${band.name}</b><br>
      <span style="opacity:.8">Ẩn náu tại <b>${MAPS[tn.map].name}</b> — tìm và tiêu diệt!</span></div>
      <div class="forge-actions"><button class="mini-btn" onclick="closePanels(); travelTo('${tn.map}')">Dịch Chuyển tới ${MAPS[tn.map].name}</button></div>`;
  } else if (tn.state === 'killed'){
    html += `<div class="next-tier" style="border-color:#8fd18f"><b style="color:#8fd18f">✔ Mục tiêu đã phục pháp!</b><br>
      <span style="opacity:.8">Thưởng: 1 ⚜ Công Huân Lệnh + ${300 + player.level*20}◈ + ${60 + player.level*2} Anima</span></div>
      <div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 20px" onclick="truynaClaim()">Nhận Thưởng</button></div>`;
  } else {
    html += `<div style="padding:12px;font-size:12.5px;opacity:.75;text-align:center;line-height:1.8">✔ Truy nã hôm nay đã xong — quay lại ngày mai!<br>⚜ Công Huân Lệnh đang có: <b style="color:#7ecbff">${player.congHuan}</b><br>Mang đến Sảnh Cầu May (Thương Nhân Vận May) để quay thử vận.</div>`;
  }
  el('panel-quest').innerHTML = html;
  closePanels(); el('panel-quest').classList.remove('hidden');
}
window.truynaAccept = function(){
  const tn = player.truyna;
  if (!tn || tn.state !== 'none') return;
  tn.state = 'hunting'; tn.map = truynaBand().map;
  zoneBanner = { text:'⚖ ĐÃ NHẬN TRUY NÃ LỆNH', sub:`Mục tiêu ẩn náu tại ${MAPS[tn.map].name} — tiêu diệt để lĩnh thưởng!`, color:'#e8b04a', t:4.5 };
  AudioSys.sfx('quest', 0.8);
  if (curMap === tn.map && !mobs.some(m => m.truyna && !m.dead)) spawnTruyNaMob();
  saveGame(); renderTruyNa();
};
window.truynaClaim = function(){
  const tn = player.truyna;
  if (!tn || tn.state !== 'killed') return;
  tn.state = 'claimed';
  player.congHuan++;
  player.silver += 300 + player.level*20;
  player.dantian.tuvi += 60 + player.level*2;
  zoneBanner = { text:'⚜ +1 CÔNG HUÂN LỆNH', sub:'Mang đến Sảnh Cầu May — Thương Nhân Vận May sẽ giúp ngươi quay thử vận (5% cổ thư hiếm)!', color:'#7ecbff', t:5 };
  AudioSys.sfx('levelup', 0.9);
  saveGame(); renderTruyNa();
};
function spawnTruyNaMob(){
  const band = truynaBand();
  const lv = player.level;
  const def = { name:'⚖ ' + band.name, lv, hp: Math.round(1200 + lv*lv*3.5), atk: Math.round(8 + lv*2.1), def: Math.round(lv*0.7),
    xp: lv*120, silver:[lv*6, lv*9], speed: 74, aggro: 220, range: 40, atkCd: 1.2, size: 24,
    color:'#3a2a10', eye:'#ffd76a', boss:true, elite:true, drop:1, el:'Thổ', img:'assets/mobs/boss.png' };
  const m = { type:'truyna', def, name: def.name,
    x: rnd(300, MAP.w-300), y: rnd(300, MAP.h-300), zone: null, pack: null,
    hp: def.hp, maxHp: def.hp, atkT: rnd(0,1), dead: false, face: 0,
    shield: 1, shieldT: 0, hitT: 0, wob: Math.random()*10, packAlert: 0, truyna: true };
  mobs.push(m);
  addFloat(m.x, m.y-70, `⚖ Mục tiêu truy nã xuất hiện: ${band.name}!`, '#e8b04a', 15);
  return m;
}

// ---------- Sảnh Cầu May (GDD §5.9) — Thương Nhân Vận May · gacha Công Huân Lệnh, KHÔNG pity ----------
// ═══════════ VỰC THẲM (GDD Lấy Võ Nhập Đạo §5.4) — chủ động nhảy vực thử vận ═══════════
// Mở sau Thăng Linh (realm 5 · Radiant Core). Mỗi lần nhảy: -30% HP (tối thiểu 1) + Trọng Thương 15 phút.
// Không pity — tỉ lệ công khai tại vách. Giờ Vàng (12h & 20h): 2 ô hiếm ×2.
function tenuiGoldenHour(){ const h = new Date().getHours(); return h === 12 || h === 20; }
function tenuiWounded(){ return (player.tenuiTT || 0) > Date.now(); }
// Học miễn phí / hiền giả chỉ điểm — tặng thẳng 1 tuyệt học NGOẠI LỚP (thứ bình thường phải mua bằng
// Sách Kỹ Năng, xem learnVohocUI). QA: bộ lọc cũ là `!VOHOC_DEFS[id].phai`, mà sau đợt MU-hoá KHÔNG
// còn chiêu nào phai:null nữa → pool luôn rỗng → 2 kết quả jackpot của Vực Thẳm ("hang động giấu cổ
// thư", "hiền giả chỉ điểm") luôn rơi về nhánh an ủi, dù người chơi đã trả 30% HP + 15 phút Trọng Thương.
function tenuiFreeLearn(preferTier){
  let pool = Object.keys(VOHOC_DEFS).filter(id => crossClassLearnable(id) && !vhLearned(id) && player.level >= VOHOC_DEFS[id].unlock);
  if (preferTier){
    const hi = pool.filter(id => VOHOC_DEFS[id].tier === preferTier);
    if (hi.length) pool = hi;
  }
  if (!pool.length) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  player.vohoc[pick] = true; calcDerived();
  return VOHOC_DEFS[pick];
}
function renderTeNui(n){
  const realm = (player.dantian && player.dantian.realm) || 0;
  const unlocked = realm >= 5, gold = tenuiGoldenHour(), wounded = tenuiWounded();
  let html = `<h3>${n.name}</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">${n.lore}</div>`;
  if (!unlocked){
    html += `<div style="text-align:center;padding:14px 8px;font-size:13px;line-height:1.8;color:#8a8a8a">
      ☁ Vách cao mây phủ — phàm nhân nhảy xuống chỉ có nát thây.<br>
      Cần đạt <b style="color:#b08ae8">Radiant Core Cảnh</b> (cảnh 5, tự động ở cấp 60) để Thăng Linh,<br>
      khi ấy mới đủ sức <b style="color:#ffb15c">nhảy vào Vực Thẳm</b>.</div>`;
  } else {
    html += `<div class="stat-sec">TỈ LỆ CÔNG KHAI — KHÔNG GOM DUYÊN${gold ? ' · <b style="color:#ffd76a">⚡ GIỜ VÀNG: 2 ô hiếm ×2!</b>' : ''}</div>
      <div style="font-size:12px;line-height:1.9;opacity:.9">
      <b style="color:#9aa8d4">${gold ? 50 : 60}%</b> — Rơi vào lùm cây / dòng suối: 1-2 📜 Sách Kỹ Năng + 3-6 ✦ Huyền Thiết<br>
      <b style="color:#7ec850">20%</b> — Lọt vào hang động: 3-5 📜 Sách Kỹ Năng<br>
      <b style="color:#5aa0e8">10%</b> — Hang động cổ xưa: 6-8 📜 Sách Kỹ Năng + 3 ◈ Tiến Cấp Đan<br>
      <b style="color:#b08ae8">${gold ? 10 : 5}%</b> — Hang động giấu cổ thư: <b>học miễn phí 1 kỹ năng tự do</b> (hết → +15 📜)<br>
      <b style="color:#ffd76a">${gold ? 10 : 5}%</b> — Gặp hiền giả ẩn danh: được chỉ điểm <b>1 võ học chưa ngộ</b></div>
      <div style="font-size:11.5px;color:#9aa8d4;margin-top:6px;line-height:1.5">Giờ Vàng (12h & 20h mỗi ngày): tỉ lệ cổ thư/hiền giả ×2.<br>
      Cái giá mỗi lần nhảy: <b style="color:#ff7a6a">-30% HP</b> (không chết) + <b style="color:#ff7a6a">Trọng Thương 15 phút</b>.</div>`;
    if (wounded){
      const left = Math.ceil(((player.tenuiTT || 0) - Date.now()) / 1000);
      html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 22px" disabled>🩸 Trọng Thương — còn ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</button></div>`;
    } else {
      html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 22px;border-color:#ffb15c;color:#ffb15c" onclick="doTeNui('${n.id}')">☁ VỰC THẲM — liều mình thử vận</button></div>`;
    }
    html += `<div id="tn-result" style="min-height:20px;font-size:12.5px;line-height:1.8;margin-top:6px"></div>`;
  }
  el('panel-quest').innerHTML = html;
  closePanels(); el('panel-quest').classList.remove('hidden');
}
window.doTeNui = function(npcId){
  const n = NPCS.find(x => x.id === npcId);
  const realm = (player.dantian && player.dantian.realm) || 0;
  if (realm < 5 || tenuiWounded()) return;
  // cái giá: -30% HP (tối thiểu 1) + Trọng Thương 15 phút
  player.hp = Math.max(1, Math.round(player.hp - player.maxHp * 0.3));
  player.tenuiTT = Date.now() + 15*60*1000;
  shakeT = Math.max(shakeT, 0.5); shakeMag = Math.max(shakeMag, 10);
  addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:'#3a3a5a', big:true });
  for (let i = 0; i < 16; i++) addEffect({ type:'ink', x:player.x+rnd(-40,40), y:player.y+rnd(-30,10), vx:rnd(-30,30), vy:rnd(60,140), color:'#5a6a8a' });
  AudioSys.sfx('hurt', 0.9);
  const gold = tenuiGoldenHour();
  const tRare = gold ? 10 : 5; // giờ vàng: 2 ô hiếm 5% → 10%
  const r = Math.random()*100;
  let out = '', col = '#9aa8d4';
  if (r < tRare){ // hang động giấu cổ thư — kỹ năng hiếm học miễn phí
    const v = tenuiFreeLearn('than') || tenuiFreeLearn(null);
    if (v){ out = `<b style="color:#ffd76a">HANG ĐỘNG CỔ THƯ!</b> Ngộ được <b style="color:${VH_TIER[v.tier].color}">${v.name}</b> — +${LEGACY_TIER_PCT[v.tier] || 0}% Công Kích vĩnh viễn!`;
      zoneBanner = { text:'☁ VẬN MAY NGÀN VÀNG', sub:`${n.name}: hang động giấu cổ thư — ${v.name}!`, color:'#ffd76a', t:5 };
      col = '#ffd76a'; AudioSys.sfx('levelup', 0.9);
    } else { player.bikipVH = (player.bikipVH || 0) + 15; out = 'Hang động trống — cổ thư đã thu thập hết, nhặt được <b style="color:#ffb15c">15 📜 Sách Kỹ Năng</b>'; col = '#ffb15c'; }
  } else if (r < tRare * 2){ // hiền giả ẩn danh chỉ điểm
    const v = tenuiFreeLearn(null);
    if (v){ out = `<b style="color:#b08ae8">HIỀN GIẢ ẨN DANH</b> chỉ điểm — ngộ được <b style="color:${VH_TIER[v.tier].color}">${v.name}</b>!`;
      zoneBanner = { text:'☁ HIỀN GIẢ CHỈ ĐIỂM', sub:`${n.name}: ${v.name} — bí thuật truyền cho kẻ may mắn`, color:'#b08ae8', t:5 };
      col = '#b08ae8'; AudioSys.sfx('quest', 0.9);
    } else { player.bikipVH = (player.bikipVH || 0) + 10; out = 'Hiền giả gật đầu: "Vận đã đủ" — <b style="color:#ffb15c">+10 📜 Sách Kỹ Năng</b>'; col = '#ffb15c'; }
  } else if (r < tRare * 2 + 10){ // hang động cổ xưa
    const bk = 6 + Math.floor(Math.random()*3);
    player.bikipVH = (player.bikipVH || 0) + bk; player.tienDan += 3;
    out = `<b style="color:#5aa0e8">Hang động cổ xưa!</b> +${bk} 📜 Sách Kỹ Năng + 3 ◈ Tiến Cấp Đan`; col = '#5aa0e8';
  } else if (r < tRare * 2 + 30){ // hang động
    const bk = 3 + Math.floor(Math.random()*3);
    player.bikipVH = (player.bikipVH || 0) + bk;
    out = `<b style="color:#7ec850">Lọt vào hang động</b> — nhặt được +${bk} 📜 Sách Kỹ Năng`; col = '#7ec850';
  } else { // lùm cây / dòng suối
    const bk = 1 + Math.floor(Math.random()*2), mt = 3 + Math.floor(Math.random()*4);
    player.bikipVH = (player.bikipVH || 0) + bk; player.mat += mt;
    out = `Rơi vào lùm cây — may mắn toàn mạng: +${bk} 📜 Sách Kỹ Năng + ${mt} ✦ Huyền Thiết`;
  }
  saveGame();
  addFloat(player.x, player.y-56, '☁ VỰC THẲM!', col, 16);
  renderTeNui(n);
  const res = document.getElementById('tn-result');
  if (res) res.innerHTML = `☁ Kết cục: ${out}`;
};

function renderVanDuyen(){
  const n = NPCS.find(x => x.id === 'thantoan');
  let html = `<h3>${n.name}</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">${n.lore}</div>`;
  html += `<div style="font-size:13px;margin-bottom:6px">⚜ Công Huân Lệnh: <b style="color:#7ecbff">${player.congHuan}</b></div>`;
  html += `<div class="stat-sec">TỈ LỆ CÔNG KHAI — KHÔNG GOM DUYÊN (NO PITY)</div>
    <div style="font-size:12px;line-height:1.9;opacity:.9">
    <b style="color:#e84a6a">5%</b> — Cổ thư hiếm: Mảnh Cổ Thư · Huyết Ma Thôn Phệ (đã thành tựu → ● Hỗn Độn Châu)<br>
    <b style="color:#b08ae8">15%</b> — Tứ Châu ngẫu nhiên (Chúc Phúc / Linh Hồn / Sinh Mệnh / Hỗn Độn)<br>
    <b style="color:#5aa0e8">25%</b> — Trang bị theo cấp (phẩm Lam trở lên)<br>
    <b style="color:#7ec850">30%</b> — Vật liệu tu luyện (Tu La / Hỗn Nguyên / Tiến Cấp Đan / Huyền Thiết)<br>
    <b style="color:#9aa8d4">25%</b> — Bạc + Anima</div>`;
  html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 22px" ${player.congHuan >= 1 ? '' : 'disabled'} onclick="rollVanDuyen()">◑ Quay Vận May — 1 ⚜</button></div>
    <div id="vd-result" style="min-height:20px;font-size:12.5px;line-height:1.8;margin-top:6px"></div>`;
  el('panel-quest').innerHTML = html;
  closePanels(); el('panel-quest').classList.remove('hidden');
}
window.rollVanDuyen = function(){
  if (player.congHuan < 1) return;
  player.congHuan--;
  let r = Math.random()*100, key = 'bac';
  for (const row of VANDUYEN_RATES){ r -= row.w; if (r < 0){ key = row.k; break; } }
  const out = [];
  if (key === 'bikip'){
    if (!player.bikip.hmtp){
      const p = Math.floor(Math.random()*3);
      player.bikip.pieces[p]++;
      out.push(`<b style="color:#e84a6a">CỔ THƯ HIẾM — Mảnh Cổ Thư · ${TAN_QUYEN[p]}!</b> (đang có ${player.bikip.pieces[p]})`);
      zoneBanner = { text:'◑ VẬN MAY NGÀN VÀNG', sub:`Mảnh Cổ Thư · ${TAN_QUYEN[p]} — 5% đã mỉm cười với ngươi!`, color:'#e84a6a', t:5 };
    } else { player.jewels.honDon++; out.push('<b style="color:#7ecbff">● Hỗn Độn Châu</b> — cổ thư đã thành tựu, quy đổi châu quý'); }
  } else if (key === 'chau'){
    const jr = Math.random()*100;
    const k = jr < 40 ? 'chucPhuc' : jr < 70 ? 'linhHon' : jr < 90 ? 'sinhMenh' : 'honDon';
    player.jewels[k]++;
    out.push(`<b style="color:${JEWEL_COLORS[k]}">${JEWEL_NAMES[k]}</b>`);
  } else if (key === 'trangbi'){
    let it = null;
    for (let i = 0; i < 6; i++){ it = genItem(player.level, 0.7); if (it.rarity >= 2) break; }
    if (player.inv.length < 30){ player.inv.push(it); out.push(`Trang bị: <b class="${RARITIES[it.rarity].cls}">${it.name}</b>`); }
    else { player.silver += 600; out.push('Túi đầy — trang bị quy đổi 600◈'); }
  } else if (key === 'vatlieu'){
    const jr = Math.random()*100;
    if (jr < 30){ const n2 = 2 + Math.floor(Math.random()*3); player.gems.tuLa += n2; out.push(`◆ Tu La Tinh Thạch ×${n2}`); }
    else if (jr < 50){ const n2 = 1 + Math.floor(Math.random()*2); player.gems.honNguyen += n2; out.push(`❖ Hỗn Nguyên Thạch ×${n2}`); }
    else if (jr < 75){ player.tienDan += 3; out.push('◈ Tiến Cấp Đan ×3'); }
    else { player.mat += 8; out.push('✦ Huyền Thiết ×8'); }
  } else {
    const sil = 200 + player.level*15, tv = 60 + player.level*2;
    player.silver += sil; player.dantian.tuvi += tv;
    out.push(`${sil}◈ bạc + ${tv} Anima`);
  }
  AudioSys.sfx(key === 'bikip' ? 'levelup' : 'coin', 0.8);
  saveGame();
  addFloat(player.x, player.y-56, '◑ Rút duyên: ' + (key === 'bikip' ? 'BÍ KÍP HIẾM!' : key === 'chau' ? 'Tứ Châu' : key === 'trangbi' ? 'Trang bị' : key === 'vatlieu' ? 'Vật liệu' : 'Bạc · Anima'), key === 'bikip' ? '#e84a6a' : '#7ecbff', 14);
  renderVanDuyen();
  const res = document.getElementById('vd-result');
  if (res) res.innerHTML = `◑ Kết quả: ${out.join('<br>')}`;
};
