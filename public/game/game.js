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
const DROP_SRC = {
  mob:    { chance:0.06, rar:[80,19,1,0,0],  perfect:0    },
  elite:  { chance:0.35, rar:[0,70,28,2,0],  perfect:0.02 },
  thuve:  { chance:1,    rar:[0,28,52,18,2], perfect:0.08, drops:2 },
  tranai: { chance:1,    rar:[0,0,38,52,10], perfect:0.15, drops:3 },
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
const RARITY_SUBS = [0,1,2,3,4]; // số dòng phụ mở theo phẩm Phàm..Chí Tôn
// Roll lại tên + chỉ số gốc + dòng phụ khi phẩm đổi (Tấn Phẩm / pity đai)
function rerollItemRarity(it){
  it.name = (it.perfect ? 'Hoàn Hảo ' : '') + ITEM_NAMES[it.slot][it.rarity];
  const slot = SLOTS.find(s => s.id === it.slot);
  if (slot && it.main) it.main.v = slot.base(it.tier, it.rarity);
  const pool = (ARMOR_SLOTS.includes(it.slot) ? ARMOR_SUBS : WEAPON_SUBS).slice();
  const nn = Math.min(pool.length, it.perfect ? 4 : RARITY_SUBS[it.rarity]);
  it.subs = [];
  for (let i = 0; i < nn; i++){
    const idx = Math.floor(Math.random()*pool.length);
    const def = pool.splice(idx,1)[0];
    const v = (it.perfect || def.fixed) ? def.max : Math.round((def.min + Math.random()*(def.max-def.min))*10)/10;
    it.subs.push({ k:def.k, name:def.name, v, pct:true });
  }
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
  { k:'perfect',   name:'ST Hoàn Hảo',      min:10, max:10, fixed:true },
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
const ITEM_NAMES = {
  vukhi:['Mộc Kiếm','Thanh Phong Kiếm','Liệt Dương Đao','Huyền Thiết Trọng Kiếm','Du Long Thần Kiếm'],
  non:['Bố Mạo','Thiết Diện','Ngân Quan','Hổ Đầu Khôi','Thiên Tôn Miện'],
  ao:['Bố Y','Tinh Giáp','Lân Giáp','Kim Lân Giáp','Chí Tôn Long Giáp'],
  tay:['Bố Uyển','Thiết Uyển','Ngân Uyển','Kim Uyển','Long Uyển'],
  quan:['Ma Khố','Cẩm Khố','Ngọc Khố','Lân Khố','Thần Khố'],
  chan:['Thảo Hài','Vân Hài','Truy Phong Hài','Lăng Ba Hài','Phi Thiên Hài'],
  daychuyen:['Mộc Liên','Ngân Liên','Ngọc Liên','Lân Liên','Thánh Liên'],
  nhan1:['Đồng Giới','Ngân Giới','Ngọc Giới','Linh Giới','Chí Tôn Giới'],
  nhan2:['Phổ Giới','Mỹ Giới','Huyền Giới','Thần Giới','Tứ Linh Giới'],
};
// Áo Choàng — 2 cấp, chỉ luyện chế tại Luyện Bảo Các (Rèn)
const CLOAK_TIERS = [ null,
  { name:'Huyền Vũ Phi Phong', color:'#5ea0e8', req:1,  atkPct:5,  pierce:3, defPct:0, cost:{ tuLa:5,  hon:2, silver:2000 } },
  { name:'Thánh Vũ Phi Phong', color:'#7ecbff', req:60, atkPct:10, pierce:6, defPct:5, cost:{ tuLa:10, hon:5, silver:6000 } },
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
const NGU_HANH = {
  Kim:  { color:'#ffb15c', beats:'Mộc',  glyph:'◆' },
  'Mộc':{ color:'#5db86a', beats:'Thổ',  glyph:'♣' },
  'Thổ':{ color:'#c08a4a', beats:'Thủy', glyph:'▲' },
  'Thủy':{ color:'#5aa0e8', beats:'Hỏa', glyph:'❄' },
  'Hỏa':{ color:'#e8552a', beats:'Kim',  glyph:'☼' },
};
// Tương sinh: Kim→Thủy→Mộc→Hỏa→Thổ→Kim (dùng cho hướng dẫn / mở rộng) — chưa có UI nào đọc
// bảng này, giữ lại làm dữ liệu tham chiếu cho tính năng tương lai (không phải code chết).
// eslint-disable-next-line no-unused-vars
const TUONG_SINH = { Kim:'Thủy', 'Thủy':'Mộc', 'Mộc':'Hỏa', 'Hỏa':'Thổ', 'Thổ':'Kim' };
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
  arena:  { name:'Đấu Trường', color:'#c07fe0', desc:'Trận Địa Phòng Thủ — bảo vệ Lõi Trụ khỏi quái tràn vào từ 4 hướng, không PK.' },
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
  // Đấu trường riêng của Trận Địa Phòng Thủ (xem startTowerRun) — không vào qua Bản Đồ, chỉ vào
  // qua nút "Bắt Đầu" ở tab Trận Địa Phòng Thủ. Bố cục hình chữ thập: Lõi Trụ giữa (TOWER_CORE), quái tràn
  // vào từ 4 cổng (TOWER_GATES) theo 4 lane thẳng — 4 góc phần tư còn lại bị chặn (MAP_OBSTACLES).
  towerarena: { name:'Trận Địa Phòng Thủ', min:1, range:'—', type:'arena', ground:'#332e28', patch:'#4a4436',
    spawn:{ x:1300, y:1030 }, trees:0, rocks:0,
    desc:'Đấu trường phòng thủ — chặn quái ở 1 trong 4 lane, đừng để chúng tràn vào Lõi Trụ giữa sân.',
    packs: [], duhiep: null },
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
      { mob:'cuongbinh', x:700, y:1400, n:7 }, { mob:'cuongbinh', x:1050, y:815, n:7 },
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
    { x:842,  y:854,  rx:188, ry:139 }, // vũng nước giữa-tây
    { x:1433, y:796,  rx:112, ry:263 }, // dải nước giữa (cạnh Trận Nhân)
    { x:1910, y:767,  rx:126, ry:329 }, // vũng nước đông (cạnh đảo nhỏ)
  ],
  ngoai: [
    { x:2250, y:350, rx:400, ry:310 },  // sông đông-bắc
    { x:2380, y:820, rx:147, ry:160 },  // sông đông — thu nhỏ, bản cũ đè lên cổng phó bản (2250,950)
    { x:140, y:160, rx:360, ry:270 },   // núi tây-bắc
  ],
  chungnam: [
    { x:0, y:0, wd:1050, ht:540 },      // núi tây-bắc
    { x:2050, y:0, wd:550, ht:250 },    // núi đông-bắc
    { x:0, y:0, wd:320, ht:1000 },      // dốc tây
  ],
  comoc: [
    { x:0, y:0, wd:1150, ht:260 },      // tường bắc trái (chừa cổng giữa)
    { x:1450, y:0, wd:1150, ht:260 },   // tường bắc phải
    { x:0, y:0, wd:300, ht:1200 },      // tường tây
    { x:2350, y:0, wd:250, ht:1300 },   // tường đông
    { x:0, y:1780, wd:2600, ht:120 },   // tường nam
  ],
  tuyettinh: [
    { x:0, y:0, wd:2600, ht:280 },      // vách bắc
    { x:0, y:0, wd:160, ht:1400 },      // vách tây
    { x:2420, y:0, wd:180, ht:1900 },   // vách đông
    { x:542, y:704, rx:240, ry:195 },   // suối băng 1
    { x:948, y:1231, rx:255, ry:215 },  // suối băng 2
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
  // 4 góc phần tư chặn kín, chừa lại hình chữ thập rộng 440px (x:1080-1520 / y:730-1170) nối Lõi
  // Trận giữa sân (TOWER_CORE, 1300,950) với 4 cổng ở mép map (TOWER_GATES) — ép quái + người chơi
  // chỉ có thể men theo 1 trong 4 lane thẳng, không cắt tắt qua góc.
  towerarena: [
    { x:0,    y:0,    wd:1080, ht:730 }, // góc tây-bắc
    { x:1520, y:0,    wd:1080, ht:730 }, // góc đông-bắc
    { x:0,    y:1170, wd:1080, ht:730 }, // góc tây-nam
    { x:1520, y:1170, wd:1080, ht:730 }, // góc đông-nam
  ],
};
const DGN_OBSTACLES = [ // 7 phó bản dùng chung: khung tường đá + cửa nam ở giữa
  { x:0, y:0, wd:2600, ht:280 },
  { x:0, y:1700, wd:1120, ht:200 },
  { x:1480, y:1700, wd:1120, ht:200 },
  { x:0, y:0, wd:330, ht:1900 },
  { x:2270, y:0, wd:330, ht:1900 },
];
function obstaclesOf(mapId){
  const md = MAPS[mapId];
  if (md && md.dungeon) return DGN_OBSTACLES;
  return MAP_OBSTACLES[mapId] || [];
}
function inObstacle(mapId, x, y, r){
  for (const o of obstaclesOf(mapId)){
    if (o.wd){
      const cx = clamp(x, o.x, o.x + o.wd), cy = clamp(y, o.y, o.y + o.ht);
      if ((x-cx)*(x-cx) + (y-cy)*(y-cy) < r*r) return true;
    } else {
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
  let stuck = 0, lastX = sx, lastY = sy; // vật cản lớn (hồ) chặn thẳng hướng đích → chệch dần bám mép
  for (let i = 0; i < 160; i++){
    const d = dist(x, y, tx, ty);
    if (d < stepLen){ path.push({ x: tx, y: ty }); break; }
    let ang = Math.atan2(ty - y, tx - x);
    if (stuck > 0) ang += (stuck % 2 === 0 ? 1 : -1) * Math.min(1.4, stuck * 0.35);
    const nx = x + Math.cos(ang)*stepLen, ny = y + Math.sin(ang)*stepLen;
    const p = resolveObstaclePoint(nx, ny, 14);
    x = p.x; y = p.y;
    path.push({ x, y });
    stuck = dist(x, y, lastX, lastY) < stepLen*0.4 ? stuck + 1 : 0; // gần như không nhích → tăng độ chệch
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
  { name:'Phiêu Vân Bộ (J)', req:()=>player.canJump, desc:'Nhảy né trên không — lướt né mọi đòn. Ascension cảnh 5 (Molt) mở thêm lượt nhảy thứ 2 & thân pháp +10%.' },
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
  } else if (S === 'seal4'){ // Tứ Tượng — vuông ấn + tứ linh tứ phương
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
    for (const m of mobs){
      if (m.dead) continue;
      if (dist(player.x, player.y, m.x, m.y) >= R + m.def.size) continue;
      let da = Math.atan2(m.y - player.y, m.x - player.x) - player.face;
      while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
      if (Math.abs(da) < 1.05) hitMob(m, v.mult);
    }
    if (fx.selfEva){ player.vhEvaT = fx.selfEva.t; player.vhEvaPct = fx.selfEva.pct; addFloat(player.x, player.y-60, `+${fx.selfEva.pct}% né (${fx.selfEva.t}s)`, '#a0ffe9', 12); }
    for (let _w = 1; _w <= _st; _w++){ // tiến hóa: sóng chưởng nối tiếp, mỗi sóng rộng hơn
      const _wm = _w === 1 ? 0.55 : 0.4, _Rw = R * (1 + 0.18 * _w), _fw = player.face, _px = player.x, _py = player.y;
      setTimeout(() => {
        if (!player || dead) return;
        addEffect({ type:'cone', x:_px, y:_py, face:_fw, r:_Rw, color:col });
        for (const m of mobs){
          if (m.dead) continue;
          if (dist(_px, _py, m.x, m.y) >= _Rw + m.def.size) continue;
          let da = Math.atan2(m.y - _py, m.x - _px) - _fw;
          while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
          if (Math.abs(da) < 1.05) hitMob(m, v.mult * _wm);
        }
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
    for (const m of mobs){
      if (m.dead) continue;
      if (dist(player.x, player.y, m.x, m.y) < R + m.def.size) hitMob(m, v.mult);
    }
    for (let _w = 1; _w <= _st; _w++){ // tiến hóa: dư chấn nổ tiếp thành từng vòng
      const _wm = _w === 1 ? 0.5 : 0.35, _Rw = R * (1 + 0.15 * _w), _px = player.x, _py = player.y;
      setTimeout(() => {
        if (!player || dead) return;
        addEffect({ type:'ring', x:_px, y:_py, r:_Rw, color:col, big:true });
        for (const m of mobs){ if (m.dead) continue; if (dist(_px, _py, m.x, m.y) < _Rw + m.def.size) hitMob(m, v.mult * _wm); }
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
const REALM_ICONS = ['r0_phan_nhan','r1_khi_hai','r2_chu_thien','r3_tu_phu','r4_quy_nguyen','r5_luong_nghi','r6_thai_hu','r7_tien_thien','r8_hon_nguyen','r8_hon_nguyen'];
// GDD Lấy Võ Nhập Đạo §3 — Giai đoạn 1: cảnh giới tu tiên.
// Spark (1-4): đột phá vận công theo tỉ lệ. Molt trở lên (5-9): ASCENSION TRIAL 3-9 đợt thiên lôi,
// mỗi tia gây % maxHP, thất bại mất 30% Anima tiến độ — KHÔNG tụt cảnh giới.
const DANTIAN_REALMS = [
  { name:'Hatchling',            atk:0,    hp:0,    qireg:0,  cost:null },
  { name:'Spark · Tầng 1',   atk:0.05, hp:0.05, qireg:1,  cost:{tuvi:150,   silver:300,   mat:3},   rate:100 },
  { name:'Spark · Tầng 2',   atk:0.10, hp:0.10, qireg:2,  cost:{tuvi:400,   silver:700,   mat:6},   rate:85 },
  { name:'Spark · Tầng 3',   atk:0.16, hp:0.16, qireg:3,  cost:{tuvi:900,   silver:1400,  mat:15},  rate:70 },
  { name:'Spark · Tầng 4',   atk:0.24, hp:0.24, qireg:4,  cost:{tuvi:1800,  silver:2600,  mat:24},  rate:55, unlock:'Đạn Chỉ Thần Thông (5% phong mạch đối thủ)' },
  { name:'Molt Cảnh',         atk:0.35, hp:0.35, qireg:5,  cost:{tuvi:3600,  silver:5000,  mat:42},  trib:3, unlock:'Thái Cực hộ thể — phản 5% sát thương · Phiêu Vân Bộ nhảy lần 2 trên không' },
  { name:'Radiant Core Cảnh',         atk:0.45, hp:0.45, qireg:6,  cost:{tuvi:6000,  silver:8000,  mat:55},  trib:4, unlock:'Ám Nhiên Tiêu Hồn Chưởng' },
  { name:'Resonance · Trung Kỳ',atk:0.55, hp:0.55, qireg:7,  cost:{tuvi:9000,  silver:12000, mat:80},  trib:6, unlock:null },
  { name:'Resonance · Hậu Kỳ',  atk:0.70, hp:0.70, qireg:8,  cost:{tuvi:13000, silver:18000, mat:110}, trib:8, unlock:'Bất Tử — chặn 1 đòn chí mạng, hồi 30% HP (180s)' },
  { name:'Starforged Cảnh',        atk:0.88, hp:0.88, qireg:10, cost:{tuvi:20000, silver:28000, mat:160}, trib:9, unlock:'Starforged — nhục thân thăng hoa, toàn thuộc tính vượt cực hạn' },
];

// ═══════════ TRACK HT (GDD §13) — trang bị MU Online S2 phong cách kiếm hiệp ═══════════
// Tứ Tượng Cổ Thần: 5 món/bộ (Nón/Giáp/Tay/Quần/Giày) — CHỈ mở từ Bảo Hạp, không pity.
// Hiệu ứng bộ ẨN — người chơi tự khám phá khi mặc đủ 2/3/5 món.
const ANCIENT_SETS = {
  thanhlong: { name:'Thanh Long', color:'#3ac88a',
    b2:{ atkPct:10 }, b3:{ critDmg:20 }, b5:{ aspdPct:8, hpLeech:3 },
    hint:'gió xanh cuồn cuộn — công kích cuồng bạo' },
  bachho:    { name:'Bạch Hổ', color:'#e8e8f0',
    b2:{ crit:6 }, b3:{ atkPct:8 }, b5:{ pierce:10, perfect:5 },
    hint:'sát khí trắng toát — xuyên phá hộ thể' },
  chutuoc:   { name:'Chu Tước', color:'#ff6a3a',
    b2:{ hpPct:10 }, b3:{ reflectPct:8 }, b5:{ dmgred:8, hpPct:6 },
    hint:'hỏa diễm thiêu đốt — sinh mệnh bền bỉ' },
  huyenvu:   { name:'Huyền Vũ', color:'#5aa0e8',
    b2:{ dmgred:6 }, b3:{ hpPct:12 }, b5:{ evaPct:8, reflectPct:5 },
    hint:'quy xà hộ thể — phòng ngự tuyệt đối' },
};
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
let shakeT = 0, shakeMag = 0; // rung màn hình khi bị đánh trúng
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
function genItem(level, bias, srcK){
  const dropSlots = SLOTS.filter(s => !s.special);
  const slot = dropSlots[Math.floor(Math.random()*dropSlots.length)];
  // Drop v2.0: nguồn boss/tinh anh dùng bảng phẳng — xóa bias lv/10 thổi phồng Chí Tôn
  const r = srcK ? rollRaritySrc(srcK) : rollRarity(bias || 0);
  const tier = itemTier(level);
  const ilvl = (tier-1)*10 + Math.ceil(Math.random()*10);
  const armorGroup = ARMOR_SLOTS.includes(slot.id);
  const perfect = armorGroup && Math.random() < (srcK ? DROP_SRC[srcK].perfect : 0.08 + (bias||0)*0.06); // Hoàn Hảo: quái thường không roll
  const pool = (armorGroup ? ARMOR_SUBS : WEAPON_SUBS).slice();
  const nSubs = Math.min(pool.length, perfect ? 4 : RARITY_SUBS[r]);
  const subs = [];
  for (let i = 0; i < nSubs; i++){
    const idx = Math.floor(Math.random()*pool.length);
    const def = pool.splice(idx,1)[0];
    const v = (perfect || def.fixed) ? def.max : Math.round((def.min + Math.random()*(def.max-def.min))*10)/10;
    subs.push({ k:def.k, name:def.name, v, pct:true });
  }
  // Vận (Luck) — chỉ xuất hiện khi rơi, không rèn được: +5% ST bạo kích/món, +5% tỉ lệ rèn (tối đa +25%)
  const luck = Math.random() < 0.06 + r*0.025 + (srcK ? 0 : (bias||0)*0.04);
  return {
    uid: itemSeq++, slot: slot.id, slotName: slot.name,
    name: (perfect ? 'Hoàn Hảo ' : '') + ITEM_NAMES[slot.id][r],
    rarity: r, level: ilvl, tier, perfect, luck, life: 0, ancient: null,
    main: { k: slot.main, v: slot.base(tier, r), name: mainName(slot.main) },
    element: ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)],
    subs, plus: 0,
    awakened: AWAKENED[Math.floor(Math.random()*AWAKENED.length)],
  };
}
// Cổ Thần (Tứ Tượng) — chỉ mở từ Bảo Hạp: giáp Thần cấp 4 dòng Hoàn Hảo + ấn bộ ẩn
function genAncient(setId, slotId, level){
  const set = ANCIENT_SETS[setId];
  const slot = SLOTS.find(s => s.id === slotId);
  const r = 4, tier = itemTier(level);
  const ilvl = (tier-1)*10 + 10;
  const pool = ARMOR_SUBS.slice();
  const subs = [];
  for (let i = 0; i < 4; i++){
    const idx = Math.floor(Math.random()*pool.length);
    const def = pool.splice(idx,1)[0];
    subs.push({ k:def.k, name:def.name, v:def.max, pct:true });
  }
  return {
    uid: itemSeq++, slot: slot.id, slotName: slot.name,
    name: set.name + ' · ' + ITEM_NAMES[slot.id][r],
    rarity: r, level: ilvl, tier, perfect: true, luck: Math.random() < 0.1, life: 0, ancient: setId,
    main: { k: slot.main, v: slot.base(tier, r), name: mainName(slot.main) },
    element: ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)],
    subs, plus: 0,
    awakened: AWAKENED[Math.floor(Math.random()*AWAKENED.length)],
  };
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
function itemPower(it){
  const m = 1 + it.plus * 0.08;
  let p = it.main ? it.main.v * m * 10 : 0;
  for (const s of it.subs) p += s.pct ? s.v * 22 : s.v * 8;
  if (it.plus >= 10) p += it.awakened.v * 12;
  return Math.round(p);
}

// ---------- GDD Đợt 2 B6/B7: giá bán theo Lực chiến · bán lẻ · tự mặc đồ ----------
function itemSellPrice(it){ return 20 + (it.tier || 1)*15 + it.rarity*40 + Math.round(itemPower(it)*0.8); }
window.sellItem = function(i){
  const it = player.inv[i];
  if (!it) return;
  const precious = it.rarity >= 2 || it.perfect || it.ancient; // xác nhận 2 lớp với đồ quý
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
  const cur = player.equip[it.slot];
  const cp = cur ? itemPower(cur) : 0, np = itemPower(it);
  if (np < Math.max(cp*1.05, cp + 1)) return;
  if (cur && (cur.perfect || cur.ancient || cur.luck) && np < cp*1.15) return;
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
    let bi = -1, bp = player.equip[sl.id] ? itemPower(player.equip[sl.id]) : 0;
    for (let i2 = 0; i2 < player.inv.length; i2++){
      const it2 = player.inv[i2];
      if (it2.slot !== sl.id || it2.special || player.level < itemReqLv(it2)) continue;
      const p2 = itemPower(it2);
      if (p2 > bp){ bp = p2; bi = i2; }
    }
    if (bi >= 0){
      const it2 = player.inv[bi];
      gained += bp - (player.equip[sl.id] ? itemPower(player.equip[sl.id]) : 0);
      player.inv.splice(bi, 1);
      if (player.equip[sl.id]) player.inv.push(player.equip[sl.id]);
      player.equip[sl.id] = it2;
      swapped++;
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
    perfect:0, hpLeech:0, qiLeech:0, aspdPct:0, pierce:0, expPct:0, defPct:0, critDmg:0 };
  let luckN = 0;
  const setCount = {};
  for (const slotId in player.equip){
    const it = player.equip[slotId];
    if (!it) continue;
    const m = 1 + it.plus * 0.08;
    if (it.main) applyLine(s, it.main.k, it.main.v * m, P);
    for (const sub of it.subs) applyLine(s, sub.k, sub.k === 'perfect' ? sub.v : sub.v * m, P);
    if (it.plus >= 10 && it.awakened) applyLine(s, it.awakened.k, it.awakened.v, P);
    if (it.luck){ luckN++; P.critDmg += 5; }                 // Vận: +5% ST bạo/món
    if (it.life) P.hpPct += it.life * 4;                     // Sinh Mệnh: +4% HP/bậc (tối đa +28%)
    if (it.ancient && ANCIENT_SETS[it.ancient]) setCount[it.ancient] = (setCount[it.ancient] || 0) + 1;
  }
  // Tứ Tượng Cổ Thần — hiệu ứng bộ ẩn kích hoạt ở 2/3/5 món
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
  // Phiêu Vân Bộ: nhảy né cơ bản có sẵn từ đầu (P1 roadmap: "early traversal toys" —
  // di chuyển là cảm giác wuxia, không nên khóa tới cuối game) — nhảy lần 2 & thân pháp +10%
  // mở ở Molt Cảnh (tầng 5), sớm hơn nhiều so với mốc Resonance Trung Kỳ (tầng 7) cũ.
  player.canJump = true;
  player.maxJumps = realm >= 5 ? 2 : 1;
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
  if ((player.channelT || 0) > 0) player.atk = Math.round(player.atk * 1.25); // Hóa Thân Tướng Quân
  if (typeof TOWER !== 'undefined' && TOWER){ // Trận Địa Phòng Thủ — buff dồn theo lượt, chỉ tồn tại trong 1 lượt chơi
    const tb = TOWER.buffs;
    if (tb.dmg) player.atk = Math.round(player.atk * (1 + tb.dmg));
    if (tb.hp) player.maxHp = Math.round(player.maxHp * (1 + tb.hp));
    if (tb.qi) player.maxQi = Math.round(player.maxQi * (1 + tb.qi));
    if (tb.crit) player.crit = Math.min(0.65, player.crit + tb.crit);
    if (tb.leech) player.hpLeech = Math.min(0.6, (player.hpLeech || 0) + tb.leech);
    if (tb.cd) player.vhCdMult = (player.vhCdMult || 1) * (1 - tb.cd);
  }
  // Võ Học Phổ: buff chủ động
  if ((player.vhDmgT || 0) > 0) player.atk = Math.round(player.atk * (1 + (player.vhDmgPct || 0)/100));
  if ((player.pillDmgT || 0) > 0) player.atk = Math.round(player.atk * (1 + (player.pillDmgPct || 0)/100)); // Bạo Lực Đan (Luyện Đan)
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
    equip: {}, inv: [], cd: { basic:0, a:0, amkhi:0, tp:0, jump:0 },
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
    jumpT: 0, jumpDur: 0.6, jumpDir: { x: 0, y: 1 },
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
    channelPick: null, channelId: null, channelT: 0, channelCd: 0, // Hóa Thân Tướng Quân — capture/channel boss form (P)
    towerBest: 0,                            // Trận Địa Phòng Thủ — đợt cao nhất từng trụ được (kỷ lục cá nhân)
    devilClears: 0, bloodClears: 0, bloodBonusClears: 0, // Đấu Trường Tế Thần / Pháo Đài Máu — số lần thông quan
    herbCount: 0,                            // Luyện Đan — Thảo Dược tích trữ (hái ngoài đồng)
    alchDay: '', alchCount: 0,               // Luyện Đan — giới hạn 2 đan vĩnh viễn/ngày (giống Nội Đan)
    pillDmgT: 0, pillDmgPct: 0,               // Bạo Lực Đan — buff sát thương tạm thời
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
function saveGame(){
  if (!player) return;
  try {
    const payload = JSON.stringify({
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
    player = d.player; questIdx = d.questIdx; questProg = d.questProg;
    questState = d.questState; victory = !!d.victory;
    sideStates = d.sideStates || {};
    if (!player.mount) player.mount = { tier: 0, out: false };
    player.mount.out = !!player.mount.out; delete player.mount.riding; // bỏ cơ chế cưỡi
    if (!player.dantian) player.dantian = { realm: 0, tuvi: 0 };
    if (!player.cd) player.cd = { basic:0, a:0, b:0, c:0, jump:0 };
    if (player.cd.jump == null) player.cd.jump = 0;
    if (player.jumpT == null){ player.jumpT = 0; player.jumpDur = 0.6; player.jumpDir = { x:0, y:1 }; }
    // realm cap may have grown — clamp into range
    player.dantian.realm = Math.min(player.dantian.realm, DANTIAN_REALMS.length - 1);
    // Dream of Wuxia backfill
    if (player.khi == null) player.khi = 0;
    if (!player.meridians) player.meridians = {};
    for (const m of MERIDIANS) if (player.meridians[m.id] == null) player.meridians[m.id] = 0;
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
    if (player.channelPick === undefined) player.channelPick = null;
    if (player.channelId === undefined) player.channelId = null;
    if (player.channelT == null) player.channelT = 0;
    if (player.channelCd == null) player.channelCd = 0;
    if (player.towerBest == null) player.towerBest = 0;
    if (player.devilClears == null) player.devilClears = 0;
    if (player.bloodClears == null) player.bloodClears = 0;
    if (player.bloodBonusClears == null) player.bloodBonusClears = 0;
    if (player.herbCount == null) player.herbCount = 0;
    if (player.alchDay == null) player.alchDay = '';
    if (player.alchCount == null) player.alchCount = 0;
    if (player.pillDmgT == null) player.pillDmgT = 0;
    if (player.pillDmgPct == null) player.pillDmgPct = 0;
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
  mobs = []; pickups = []; projectiles = []; effects = []; floats = [];
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
  spawnAmbients(); // hạt môi trường + cỏ mặt đất theo chủ đề bản đồ
  spawnHorses(); // GDD Đợt 2 B5: Tuấn Mã Hoang
  // Ma Tôn Giáng Thế & Truy Nã Lệnh: tái xuất hiện khi người chơi vào đúng bản đồ
  if (typeof MATON !== 'undefined' && MATON.active && curMap === MATON.map && !mobs.some(m => m.type === 'maton' && !m.dead)) spawnMaTonMob();
  if (typeof GOLDEN !== 'undefined' && GOLDEN.active && curMap === GOLDEN.map) spawnGoldenMobs();
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
    const bc = (def.el && NGU_HANH[def.el]) ? NGU_HANH[def.el].color : (def.color || '#ffd76a');
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
};
const BOSS_DEFS = {
  daohoa: { thuve:[
      { id:'dh1', name:'Chúa Heo Rừng',       lv:6,  el:'Thổ',  img:'boar',     x:.30, y:.30, moves:['vach','xung','cuong'] },
      { id:'dh2', name:'Chúa Bầy Gai Tím',        lv:9,  el:'Mộc',  img:'wolf',     x:.64, y:.56, moves:['xung','goi','vach'] },
      { id:'dh3', name:'Chấp Sự Gloam',  lv:12, el:'Thủy', img:'assassin', x:.42, y:.80, moves:['vach','vong','cuong'] } ],
    tranai: { id:'dh4', name:'Thủ Lĩnh Đoàn Gloam', lv:14, el:'Hỏa', img:'boss_hacphong', x:.86, y:.80, moves:['vong','vach','goi','cuong'] } },
  ngoai: { thuve:[
      { id:'ng1', name:'Đầu Mục Gloam',    lv:13, el:'Kim',  img:'bandit',   x:.28, y:.34, moves:['vach','xung','cuong'] },
      { id:'ng2', name:'Gai Tím Độc Nhãn',lv:16, el:'Mộc',  img:'wolf',     x:.62, y:.62, moves:['xung','vong','goi'] },
      { id:'ng3', name:'Đặc Vụ Gloam',   lv:19, el:'Thủy', img:'assassin', x:.40, y:.80, moves:['vach','xung','cuong'] } ],
    tranai: { id:'ng4', name:'Ma Sói Sương Trắng', lv:22, el:'Hỏa', img:'boss_sontac', x:.85, y:.78, moves:['vach','vong','goi','cuong'] } },
  chungnam: { thuve:[
      { id:'cn1', name:'Kẻ Đổi Phe',        lv:23, el:'Thủy', img:'phando',   x:.30, y:.32, moves:['vach','xung','goi'] },
      { id:'cn2', name:'Golem Gỗ Cổ Đại',    lv:26, el:'Thổ',  img:'mocnhan',  x:.64, y:.58, moves:['vong','vach','cuong'] },
      { id:'cn3', name:'Trưởng Lão Tha Hóa', lv:29, el:'Thủy', img:'boss_phando', x:.44, y:.80, moves:['xung','vach','vong'] } ],
    tranai: { id:'cn4', name:'Tướng Quân Thornwood Reach', lv:32, el:'Thủy', img:'bandao', x:.86, y:.80, moves:['vach','xung','vong','cuong'] } },
  comoc: { thuve:[
      { id:'cm1', name:'Chỉ Huy Vong Binh',  lv:43, el:'Thổ',  img:'kybinh',   x:.30, y:.32, moves:['xung','vach','goi'] },
      { id:'cm2', name:'Kẻ An Táng Bóng Tối',lv:46, el:'Thủy', img:'thinu',    x:.62, y:.58, moves:['vong','xung','cuong'] },
      { id:'cm3', name:'Chúa Tể Bất Tử',     lv:49, el:'Thổ',  img:'mocnhan',  x:.42, y:.80, moves:['vach','vong','goi'] } ],
    tranai: { id:'cm4', name:'Tướng Quân Hollow Roost', lv:52, el:'Mộc', img:'boss_mochu', x:.85, y:.80, moves:['vong','xung','goi','cuong'] } },
  tuyettinh: { thuve:[
      { id:'tt1', name:'Kẻ Lạc Lối Tuyệt Vọng',lv:63, el:'Thổ',  img:'ttdetu', x:.30, y:.32, moves:['vach','goi','cuong'] },
      { id:'tt2', name:'Cỏ Dại Băng Giá',     lv:66, el:'Hỏa',  img:'caodo',    x:.64, y:.58, moves:['xung','vong','goi'] },
      { id:'tt3', name:'Xoáy Sương Nguyền',    lv:69, el:'Mộc',  img:'boss_tinhhoa', x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'tt4', name:'Tướng Quân Frostmire Vale', lv:72, el:'Mộc', img:'thinu', x:.86, y:.80, moves:['vong','vach','xung','cuong'] } },
  mongco: { thuve:[
      { id:'mc1', name:'Kỵ Sĩ Trưởng Tro Tàn', lv:83, el:'Kim', img:'kybinh',  x:.30, y:.32, moves:['xung','vach','cuong'] },
      { id:'mc2', name:'Cung Thủ Tinh Nhuệ Tro Tàn', lv:86, el:'Mộc',  img:'cungthu',  x:.64, y:.58, moves:['vong','xung','goi'] },
      { id:'mc3', name:'Thống Lĩnh Tro Tàn', lv:89, el:'Kim', img:'cuongbinh',x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'mc4', name:'Tướng Quân Ashen Steppe', lv:92, el:'Kim', img:'boss_dothong', x:.86, y:.80, moves:['xung','vong','goi','cuong'] } },
  nhanmon: { thuve:[
      { id:'nm1', name:'Tướng Quân Bão Tố',  lv:103, el:'Kim', img:'daokhach', x:.30, y:.32, moves:['vach','xung','cuong'] },
      { id:'nm2', name:'Huyết Sát Bão Tố',   lv:106, el:'Hỏa',  img:'cuongbinh',x:.64, y:.58, moves:['vong','vach','goi'] },
      { id:'nm3', name:'Tướng Quân Cửa Ải', lv:109, el:'Thổ',  img:'boss_thienbinh', x:.42, y:.80, moves:['xung','vong','vach'] } ],
    tranai: { id:'nm4', name:'Tướng Quân Stormgate Pass', lv:112, el:'Hỏa', img:'boss_thienbinh', x:.86, y:.80, moves:['vach','xung','vong','cuong'] } },
};
// ═══ Hóa Thân Tướng Quân — Boss Capture/Channel Form (P0 roadmap: Tale of Immortal + Black Myth) ═══
// Hạ 1 Cổng Vực (boss trấn giữ cuối bản đồ) lần đầu → vĩnh viễn hàng phục hình dạng của nó. Phím P
// hóa thân tạm thời: đổi hẳn tạo hình (dùng lại đúng sprite boss), +25% công lực, một đòn bộc phá
// mở màn quanh người — tái dùng 100% sprite boss đã có (Axie art), không cần vẽ thêm gì.
const CHANNEL_IMGS = {};
// ⚠ KHÔNG nạp ở đây: các mob boss chỉ được thêm vào MOBS ở cuối file, nên tại điểm này
// MOBS['boss_*'] còn undefined và không thể biết boss nào vẽ khung xương (đã bỏ file ảnh).
// Việc nạp nằm ở loadBossImages() phía dưới, chạy sau khi MOBS đã đủ.
function findTranaiById(bossId){
  for (const mapId in BOSS_DEFS){ const tv = BOSS_DEFS[mapId].tranai; if (tv && tv.id === bossId) return tv; }
  return null;
}
function channelFormsUnlocked(){
  const out = [];
  for (const mapId in BOSS_DEFS){
    const tv = BOSS_DEFS[mapId].tranai;
    if (tv && player.bossKills && (player.bossKills[mapId] || []).includes(tv.id)) out.push(tv);
  }
  return out;
}
window.setChannelPick = function(bossId){
  if (!channelFormsUnlocked().some(f => f.id === bossId)) return;
  player.channelPick = bossId;
  const tv = findTranaiById(bossId);
  addFloat(player.x, player.y-56, `☬ Hóa Thân mặc định: ${tv ? tv.name : bossId}`, '#ffb15c', 12);
  AudioSys.sfx('ui', 0.5);
  saveGame(); refreshCharTab('channel');
};
window.activateChannelForm = function(){
  if (!player || dead) return;
  if ((player.channelT || 0) > 0) return; // đang hóa thân rồi
  if ((player.channelCd || 0) > 0){ addFloat(player.x, player.y-40, `Hóa Thân còn hồi ${Math.ceil(player.channelCd)}s`, '#8a8a8a', 12); return; }
  const unlocked = channelFormsUnlocked();
  if (!unlocked.length){ addFloat(player.x, player.y-40, 'Chưa hàng phục Cổng Vực nào — hạ boss cuối bản đồ để mở khóa!', '#8a8a8a', 12); return; }
  const pick = unlocked.find(f => f.id === player.channelPick) || unlocked[unlocked.length-1];
  player.channelId = pick.id;
  player.channelT = 14;
  player.channelCd = 90;
  calcDerived();
  sideOnEvent('channel');
  addFloat(player.x, player.y-60, `☬ HÓA THÂN — ${pick.name}!`, '#ffb15c', 16);
  AudioSys.sfx('levelup', 0.85);
  addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:'#ffb15c', big:true });
  addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:(NGU_HANH[pick.el]||{}).color || '#ffb15c' });
  // đòn bộc phá mở màn — sát thương quanh người, đúng chất một chiêu Cổng Vực
  const R = 160;
  for (const m of mobs){
    if (m.dead) continue;
    if (dist(player.x, player.y, m.x, m.y) >= R + m.def.size) continue;
    const dmg = Math.round(player.atk * 2.2 * rnd(0.92, 1.08));
    hurtMob(m, dmg, 'crit');
    if (!m.dead) m.stunT = Math.max(m.stunT || 0, m.def.bossKind ? 0.35 : 0.9);
  }
  saveGame();
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
  if (hit){
    if (player.jumpT > 0){ addFloat(player.x, player.y-28, 'Né!', '#a0ffe9', 14); } // J i-frames
    else {
      let dmg = Math.round(m.def.atk * 2.2 * (1 - player.defRed));
      const gapB = m.def.lv - player.level; // Áp Bức chiều ngược
      if (gapB > 10) dmg = Math.round(dmg*1.6); else if (gapB >= 6) dmg = Math.round(dmg*1.3);
      player.hp -= dmg; player.hurtT = 0.3; player.combatT = 4;
      addFloat(player.x, player.y-30, dmg, '#ff5a3a', 17);
      addEffect({ type:'ring', x:player.x, y:player.y-10, r:26, color:'#ff5a3a' });
      AudioSys.sfx('hurt', 0.8);
      if (player.hp <= 0){ player.hp = 0; player._killedByBoss = m.def.name; onDeath(); }
    }
  }
}
// Telegraph vẽ trên mặt đất (world space, dưới chân thực thể)
function drawBossTele(m){
  const t = m.tele, mv = BOSS_MOVES[t.mvId];
  const prog = 1 - t.t / t.max;
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.3*prog;
  ctx.fillStyle = '#ff3a2a';
  ctx.strokeStyle = 'rgba(255,80,50,.9)'; ctx.lineWidth = 2;
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
const SETTINGS = Object.assign({ bgm:35, sfx:60, lowFx:false, mobName:true, minimap:true, shake:false, questTracker:true, combatLog:true },
  (()=>{ try { return JSON.parse(localStorage.getItem('vlcm_settings') || '{}'); } catch { return {}; } })());
function saveSettings(){ try { localStorage.setItem('vlcm_settings', JSON.stringify(SETTINGS)); } catch { /* best-effort — bỏ qua nếu lỗi */ } }

// ---------- Âm thanh kiếm hiệp: BGM theo map + SFX ----------
// Nhạc nền: bgm_safe (làng/thành) · bgm_field (dã ngoại) · bgm_tomb (mật thất) · bgm_war (chiến trường)
// Mỗi map có nhạc nền riêng; map chưa có bản riêng dùng nhạc nền chung
const BGM_TRACKS = { daohoa:'bgm_daohoa_ost', tuongduong:'bgm_tuongduong_ost', ngoai:'bgm_ngoai', chungnam:'bgm_chungnam_ost',
  tuyettinh:'bgm_tuyettinh_ost', comoc:'bgm_comoc', mongco:'bgm_mongco', nhanmon:'bgm_nhanmon' };
const BGM_INTRO = 'bgm_kiemhiep'; // Kiếm Hiệp Tình — màn mở đầu & chọn phái (hào hiệp chính khí)
const BGM_BOSS = 'bgm_boss_nguan';   // Hoa Địa Li Lao — boss Cổng Vực / Ngũ Trụ (bi kịch bùng nổ)
const BGM_ROMANCE = 'bgm_romance';   // Tiếu Vấn Tình Duyên — song ca khi kết Đạo Lữ
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
  if (e.key.toLowerCase()==='j'){ if (!tryHarvestHerb()) doJump(); } // ưu tiên hái thảo dược gần đó, không thì nhảy né như cũ
  if (e.key.toLowerCase()==='c') togglePanel('char');
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
  if (e.key.toLowerCase()==='p' && player && !dead) window.activateChannelForm(); // Hóa Thân Tướng Quân
  if (e.key === 'Escape') closePanels();
});
window.addEventListener('keyup', e=> keys[e.key.toLowerCase()] = false);
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
document.getElementById('sk-jump').addEventListener('click', doJump);

// ---------- Combat ----------
function addFloat(x,y,text,color,size){
  if (floats.length >= 70) floats.shift(); // chống tràn số bay
  floats.push({ x, y, text, color, t:1, size:size||13 });
}
function addEffect(e){ if (effects.length >= 400) effects.splice(0, effects.length - 399); effects.push(Object.assign({ t:0 }, e)); } // trần cứng chống phình RAM
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
  // Ngũ hành tương khắc: môn phái khắc hệ quái → +20% sát thương; bị quái khắc → -12%
  const sectEl = SECTS[player.sect].element;
  if (sectEl && m.def.el){
    if (NGU_HANH[sectEl].beats === m.def.el){ final *= 1.2; counterNote = true; }
    else if (NGU_HANH[m.def.el] && NGU_HANH[m.def.el].beats === sectEl){ final *= 0.88; counteredNote = true; }
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
  // phản hồi lực đòn: chỉ đòn tay (Space) mới khựng hình + lắc camera — DoT/kỹ năng/pet không spam
  if (source === 'crit'){ hitStop = Math.max(hitStop, 0.08); shakeT = Math.max(shakeT, 0.2); shakeMag = Math.max(shakeMag, 5); addEffect({ type:'critflash', x:m.x, y:m.y, r:(m.def.size||14)+22 }); }
  else if (source === 'hit'){ hitStop = Math.max(hitStop, 0.04); shakeT = Math.max(shakeT, 0.14); shakeMag = Math.max(shakeMag, 2.4); }
  AudioSys.sfx(source === 'crit' || perfectNote ? 'crit' : 'hit', source === 'crit' ? 0.8 : 0.5);
  // Nhật ký chiến đấu thay cho số bay trên đầu quái (đỡ rối màn hình khi AUTO đánh nhiều quái) —
  // đòn thường gộp 1 dòng, đòn đặc biệt (hoàn hảo/khắc hệ/chống khiên) có tiền tố riêng
  {
    const note = perfectNote ? 'HOÀN HẢO ' : counterNote ? 'KHẮC HỆ ' : counteredNote ? 'bị khắc ' : shieldNote ? '(chống) ' : '';
    const color = perfectNote ? '#ff9df0' : counterNote ? '#5db86a' : counteredNote ? '#8a94a8' : shieldNote ? '#8a8a8a' : (source==='crit' ? '#ffd76a' : '#e8ecff');
    logCombat(`⚔ ${note}-${final} → ${m.def.name}${source==='crit' ? ' (bạo kích)' : ''}`, color);
  }
  // tương khắc: tia hào quang hệ thắng bao quanh quái
  if (counterNote) addEffect({ type:'ring', x:m.x, y:m.y, r:26 + m.def.size, color:NGU_HANH[sectEl].color });
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
  if (m.hp <= 0) killMob(m, source);
}
function killMob(m, source){
  m.dead = true; m.deadT = 0.45; // xác tan dần thành mực thay vì biến mất tức thì
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
  if (Math.random() < 0.3){ player.mat++; addFloat(m.x, m.y-40, '+1 ✦ Huyền Thiết', '#9fd0ff', 11); }
  player.kills++;
  player.khi += 10; // Instinct từ chiến đấu
  player.dantian.tuvi += 2; // Anima từ chiến đấu — giảm thời gian ngồi thiền thuần túy (QA)
  dailyTrack('kills'); // Mục Tiêu Hôm Nay
  // gem drops: Tu La (sói+), Hỗn Nguyên (tinh anh/boss), Tiến Cấp Đan (sơn tặc+)
  if (m.def.lv >= 3 && Math.random() < 0.15){ player.gems.tuLa++; addFloat(m.x, m.y-52, '+1 ◆ Tu La Tinh Thạch', '#e84a6a', 11); }
  if (m.def.elite && Math.random() < 0.35){ player.gems.honNguyen++; addFloat(m.x, m.y-64, '+1 ❖ Hỗn Nguyên Thạch', '#b08ae8', 11); }
  if (m.def.lv >= 5 && Math.random() < 0.22){ player.tienDan++; addFloat(m.x, m.y-76, '+1 ◈ Tiến Cấp Đan', '#7ec850', 11); }
  // Tinh anh & boss rớt thêm Tiến Cấp Đan (Drop v2.0 — gắn vòng farm boss vào Tấn Chức)
  const _tdB = m.def.bossKind === 'tranai' ? 8 : (m.def.bossKind === 'thuve' ? 3 : (m.type === 'boss' || m.def.boss) ? 5 : m.def.elite ? 1 : 0);
  if (_tdB){ player.tienDan += _tdB; addFloat(m.x, m.y-88, `+${_tdB} ◈ Tiến Cấp Đan`, '#7ec850', 11); }
  // Võ Học Phổ: Bí Kíp rơi từ tinh anh/boss — học võ học giang hồ (bấm K)
  const _bkR = m.def.bossKind === 'tranai' ? 0.35 : (m.def.bossKind === 'thuve' || m.def.boss) ? 0.12 : m.def.elite ? 0.03 : 0;
  if (_bkR && Math.random() < _bkR){ player.bikipVH = (player.bikipVH || 0) + 1; addFloat(m.x, m.y-100, '+1 📜 Sách Kỹ Năng', '#ffb15c', 13); }
  // 💠 Tâm Đắc — nguyên liệu đột phá cảnh giới chiêu thức: tinh anh 30%×1 · boss 1-2 · Boss Vùng/Cổng Vực 2-3
  const _tdR = m.def.bossKind ? (2 + Math.floor(Math.random() * 2)) : (m.def.boss || m.type === 'boss') ? (1 + Math.floor(Math.random() * 2)) : (m.def.elite && Math.random() < 0.3) ? 1 : 0;
  if (_tdR){ player.tamdac = (player.tamdac || 0) + _tdR; addFloat(m.x, m.y-112, `+${_tdR} 💠 Tâm Đắc`, '#7df9ff', 13); }
  // Nội Đan yêu thú theo hành — tinh anh 30%, boss 100%
  if (m.def.el && (m.def.boss || (m.def.elite && Math.random() < 0.3))){
    player.noidan[m.def.el] = (player.noidan[m.def.el] || 0) + 1;
    addFloat(m.x, m.y-88, `+1 ● Nội Đan hệ ${m.def.el}`, NGU_HANH[m.def.el].color, 12);
    dailyTrack('noidan'); // Mục Tiêu Hôm Nay
  }
  // ── Drop v2.0: bảng rơi theo nguồn — quái thường chỉ fodder, đồ tốt từ tinh anh/boss ──
  // Boss Săn (huntBoss) không rơi theo đường này — phần thưởng Rương do grantHuntBox() cấp riêng
  const _dsrc = m.def.huntBoss ? null : m.def.bossKind === 'tranai' ? 'tranai' : (m.def.boss || m.def.bossKind) ? 'thuve' : (m.def.elite ? 'elite' : 'mob');
  const _tbl = _dsrc && DROP_SRC[_dsrc];
  let _gotThan = false;
  for (let _di = 0; _dsrc && _di < (_tbl.drops || 1); _di++){
    if (Math.random() >= _tbl.chance + (player.dropBonus || 0)) continue;
    const it = genItem(Math.max(1, m.def.lv + (Math.random()<0.3?1:0)), 0, _dsrc);
    // Pity đai: Vệ Binh Trụ 8 lần liên tiếp không ra Thần+ → bảo đảm 1 món Thần
    if (_dsrc === 'thuve' && m.def.bossKind === 'thuve' && (player.bossPity || 0) >= 8 && it.rarity < 3){
      it.rarity = 3; rerollItemRarity(it);
      addFloat(m.x, m.y-110, '☘ VẬN MAY TÍCH LŨY — bảo đảm Thần phẩm!', '#7fd8e0', 13);
    }
    if (it.rarity >= 3) _gotThan = true;
    // Tự động bán đồ Phàm đổi lấy bạc (bật trong Túi Đồ)
    if (player.autoSell && it.rarity <= 0){
      const v = 20 + it.rarity*30 + (it.tier||1)*15;
      player.silver += v;
      addFloat(m.x, m.y-54, `Tự bán ${it.name} +${v}◈`, '#9aa8d4', 11);
    }
    else if (player.inv.length < 30){ player.inv.push(it); addFloat(m.x, m.y-54, it.name, RARITIES[it.rarity].color, 12);
      if (it.rarity >= 2) addEffect({ type:'spark', x:m.x, y:m.y-12, r:32 + it.rarity*8, color:RARITIES[it.rarity].color }); tryAutoEquip(it); } // GDD Đợt 2 B7: tự mặc đồ mạnh hơn
  }
  if (m.def.bossKind === 'thuve') player.bossPity = _gotThan ? 0 : (player.bossPity || 0) + 1;
  // Vật liệu Drop v2.0: Mảnh Trang Bị (quái 8%, tinh anh 100%)
  if (!m.def.boss && !m.def.bossKind && Math.random() < (m.def.elite ? 1 : 0.08)){
    player.mats.manh++;
    addFloat(m.x, m.y-66, '+1 ❖ Mảnh Trang Bị', '#7ec8d8', 11);
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
    if (jk){ player.jewels[jk]++; addFloat(m.x, m.y-104, `+1 ${JEWEL_NAMES[jk]}`, JEWEL_COLORS[jk], 13); }
  } else if (m.def.elite && player.jewels && Math.random() < 0.03){
    player.jewels.chucPhuc++; addFloat(m.x, m.y-104, `+1 ${JEWEL_NAMES.chucPhuc}`, JEWEL_COLORS.chucPhuc, 12);
  }
  // Ma Tôn Giáng Thế: hạ boss nhận Bảo Hạp theo vùng cấp
  if (m.type === 'maton') matonKilled(m);
  if (m.def && m.def.goldBox) goldenKilled(m);
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
    45:['Bảo Hạp IV trở lên từ Hung Thần có 5-8% mở ra trang bị CỔ THẦN Tứ Tượng — Hung Thần giáng thế mỗi 4 giờ!'],
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
    spawnSlash(player.x + Math.cos(player.face)*36, player.y + Math.sin(player.face)*36 - 12, player.face, 95, sect.color, sect.glow);
  }
  if (t){
    if (ranged){
      const ang = Math.atan2(t.y-player.y, t.x-player.x);
      projectiles.push({ x:player.x, y:player.y-10, ang, speed:520, dmg:player.atk*rnd(0.9,1.12), kind:'basic', life:0.9, color:sect.color, style:sect.basicProj || 'orb' });
    } else {
      let dmg = player.atk * rnd(0.9,1.12);
      let src = 'hit';
      if (Math.random() < player.crit){ dmg *= (player.critDmgMult || 2); src = 'crit'; }
      hurtMob(t, dmg, src);
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
// Phiêu Vân Bộ — jump (có sẵn từ đầu; nhảy lần 2 mở ở Ascension cảnh 5 — Molt)
function doJump(){
  if (!player || dead) return;
  const airborne = player.jumpT > 0;
  if (!airborne && player.cd.jump > 0) return; // cooldown chỉ chặn cú nhảy từ mặt đất
  if (airborne && (player.jumpsLeft || 0) <= 0) return;
  // jump toward current movement input, else facing
  let dx = 0, dy = 0;
  if (keys['w']||keys['arrowup']) dy -= 1;
  if (keys['s']||keys['arrowdown']) dy += 1;
  if (keys['a']||keys['arrowleft']) dx -= 1;
  if (keys['d']||keys['arrowright']) dx += 1;
  dx += joyVec.x; dy += joyVec.y;
  const l = Math.hypot(dx, dy);
  if (l > 0.01){ dx /= l; dy /= l; } else { dx = Math.cos(player.face); dy = Math.sin(player.face); }
  player.jumpDir = { x: dx, y: dy };
  player.jumpT = player.jumpDur;
  if (airborne){
    player.jumpsLeft--;
    addFloat(player.x, player.y-60, 'Không Trung Túc Ảnh!', '#c8e8ff', 12);
    addEffect({ type:'ring', x:player.x, y:player.y+20, r:30, color:'#c8e8ff' });
  } else {
    player.jumpsLeft = (player.maxJumps || 1) - 1;
    player.cd.jump = 0; // QA: Phiêu Vân Bộ không thời gian chờ
  }
  AudioSys.sfx('jump', 0.7);
  addEffect({ type:'ring', x:player.x, y:player.y, r:46, color:'#9fd8ff' });
  addFloat(player.x, player.y-44, 'Phiêu Vân Bộ!', '#9fd8ff', 13);
  flashSkill('sk-jump');
}
function flashSkill(id){
  const el = document.getElementById(id);
  el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'), 180);
}

// ---------- Quests / NPC ----------
function currentQuest(){ return questIdx < QUESTS.length ? QUESTS[questIdx] : null; }

// ---------- GDD Đợt 2 B3: Nhắc Việc Bấm Ngay ----------
function anyPanelOpen(){
  return ['panel-char','panel-inv','panel-bag','panel-skill','panel-map','panel-quest','panel-settings','panel-qlog','panel-stage']
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
  // QA rà soát: Lò Hỗn Loạn/Đấu Trường Tế Thần/Pháo Đài Máu/Trận Địa Phòng Thủ không được tutorial/hint nào nhắc tới —
  // người chơi mới có thể không bao giờ tự tìm ra. Thêm gợi ý đúng lúc điều kiện chín muồi.
  if (player.level >= 15){
    const _rTally = {};
    for (const it of player.inv) if (it && !it.noForge && it.rarity != null && it.rarity < 4) _rTally[it.rarity] = (_rTally[it.rarity] || 0) + 1;
    if (Object.values(_rTally).some(n => n >= 3))
      out.push({ id:'chaosmachine', pri:6, txt:'◑ Đang dư ít nhất 3 món cùng phẩm — ném vào Lò Hỗn Loạn (Lò Rèn Hoàng Gia) để thử lên phẩm cao hơn!', btn:'Đi Xem', act:'hintGoForge()' });
  }
  if (player.level >= 20 && !DEVIL && !BLOOD && !TOWER){
    out.push({ id:'arena20', pri:7, txt:'👹 Cấp 20+ đã mở Đấu Trường Tế Thần & Pháo Đài Máu — phó bản có giờ, thông quan chắc chắn mở Rương phẩm cao!', btn:'Xem Ngay', act:'hintGoArena()' });
    out.push({ id:'tower20', pri:8, txt:'🌀 Cấp 20+ đã mở Trận Địa Phòng Thủ — đấu trường sinh tồn vô hạn, miễn phí, không giới hạn số lần!', btn:'Xem Ngay', act:'hintGoTower()' });
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
window.hintGoArena = function(){ togglePanel('arena'); hintHide(); };
window.hintGoTower = function(){ togglePanel('tower'); hintHide(); };
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
  if ((player.channelT || 0) > 0){ // Hóa Thân Tướng Quân hết hạn — trở lại nguyên hình
    player.channelT -= dt;
    if (player.channelT <= 0){
      player.channelT = 0; player.channelId = null; calcDerived();
      if (!dead) addFloat(player.x, player.y-46, 'Hóa Thân đã tan — trở lại nguyên hình…', '#8a8a8a', 12);
    }
  }
  if ((player.channelCd || 0) > 0) player.channelCd = Math.max(0, player.channelCd - dt);
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
      if (moveProgressT > 1.3){
        if (_mtd > moveProgressD - 24){
          addFloat(player.x, player.y-40, 'Không tìm được đường tới đó — hãy thử bấm điểm gần hơn!', '#ff9a6a', 12);
          moveTarget = null; moveWaypoint = null; npcTalkTarget = null;
        }
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
  if (player.auto && !dead && player.jumpT <= 0 && !_bossNear){
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
  // Phiêu Vân Bộ jump glide — fast airborne dash, evades all attacks
  if (player.jumpT > 0){
    player.jumpT -= dt;
    const jspd = 380;
    player.x = clamp(player.x + player.jumpDir.x*jspd*dt, 20, MAP.w-20);
    player.y = clamp(player.y + player.jumpDir.y*jspd*dt, 20, MAP.h-20);
    collideCityWalls(); collideObstacles(player, 14); // GDD Đợt 2 A
    // tàn ảnh thân pháp — afterimage trail
    player.jumpTrailT = (player.jumpTrailT || 0) - dt;
    if (!SETTINGS.lowFx && player.jumpTrailT <= 0){
      player.jumpTrailT = 0.055;
      addEffect({ type:'ring', x:player.x, y:player.y+2, r:16, color:'#bfe8ff' });
    }
    if (player.jumpT <= 0){
      player.jumpT = 0;
      addEffect({ type:'ring', x:player.x, y:player.y, r:38, color:'#9fd8ff' });
    }
  }

  // qi regen + hp regen (P0: hồi máu nhanh hơn — base ×3, ngoài combat thêm 5% max HP/s)
  player.combatT = Math.max(0, (player.combatT || 0) - dt);
  player.potionCd = Math.max(0, (player.potionCd || 0) - dt); // P0: Hồ Lô Thuốc cooldown
  if (player.hp <= 0 && !dead){ player.hp = 0; onDeath(); } // thiên lôi cũng giết được người
  updateKyngo(dt); // A2: Kỳ ngộ trên đường
  if (DGN) updateDungeon(dt); // Phó bản: đợt quái → boss → thưởng
  if (TOWER) updateTower(); // Trận Địa Phòng Thủ: đợt quái vô tận → chọn thẻ
  if (DEVIL) updateDevil(dt); // Đấu Trường Tế Thần: 6 đợt + Quỷ Vương, có đồng hồ đếm ngược
  if (BLOOD) updateBlood(dt); // Pháo Đài Máu: lính gác → Pho Tượng Bảo Vệ → Thiên Sứ (thưởng thêm)
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
  for (const _bk of ['vhDmgT','vhEvaT','vhReflT','vhAspdT','vhCritT','vhLeechT','pillDmgT']) if ((player[_bk]||0) > 0) player[_bk] -= dt;
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
    } else if (m.laned && m.wpPath && d > m.def.range){
      // Trận Địa Phòng Thủ: quái đi thẳng theo lane tới Lõi Trụ, bỏ qua aggro —
      // người chơi phải đứng chắn đường mới ngăn được (đúng chất tower defense)
      const wp = m.wpPath[m.wpIdx];
      const wd = dist(m.x, m.y, wp.x, wp.y);
      if (wd < 40){
        if (m.wpIdx < m.wpPath.length - 1) m.wpIdx++;
        else { towerCoreHit(m); continue; }
      }
      const lang = Math.atan2(wp.y-m.y, wp.x-m.x);
      m.faceT = lang;
      const lspd = m.def.speed * (m.slowT > 0 ? (m.slowPct || 0.65) : 1);
      m.x += Math.cos(lang)*lspd*dt;
      m.y += Math.sin(lang)*lspd*dt;
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
      const elC = (m.def.el && NGU_HANH[m.def.el]) ? NGU_HANH[m.def.el].color : m.def.color;
      addEffect({ type:'arc', x:m.x, y:m.y, face:Math.atan2(player.y-m.y,player.x-m.x), r:34, color:elC });
      if (m.def.ranged){ // Cung Thủ Thảo Nguyên: đạn bay từ xa (hình), sát thương tính trực tiếp
        projectiles.push({ cosmetic:true, x:m.x, y:m.y, ang:Math.atan2(player.y-m.y,player.x-m.x), speed:420, dmg:0, kind:'mobshot', life:d/420, color:'#d8b060' });
      }
      if (m.blindT > 0 && Math.random() < 0.5){
        addFloat(m.x, m.y-30, 'MÙ LÒA!', '#9aa8d4', 11); // Diệt Hồn Sa — đánh trượt
      } else if (player.jumpT > 0){
        addFloat(player.x, player.y-28, 'Né!', '#a0ffe9', 13); // airborne — Phiêu Vân Bộ auto-evade
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
          if (NGU_HANH[mobEl].beats === sectEl2){ dmg *= 1.12; mobCounter = true; }
          else if (NGU_HANH[sectEl2].beats === mobEl) dmg *= 0.9;
        }
        if (player.gkBuffT > 0) dmg *= 0.7; // Cương Khí Hộ Thể (chủ động): giảm 30% ST
        dmg = Math.max(1, Math.round(dmg));
        if ((player.vhShield || 0) > 0){ // Thái Cực Kiếm: khiên kiếm khí hấp thụ
          const absorbed = Math.min(player.vhShield, dmg);
          player.vhShield -= absorbed; dmg -= absorbed;
          if (absorbed > 0) addFloat(player.x, player.y-40, `🛡 -${absorbed}`, '#8ad8c8', 12);
        }
        player.hp -= dmg;
        // đòn đánh trúng: vụ nổ hào quang nguyên tố + rung màn hình
        const elC2 = (mobEl && NGU_HANH[mobEl]) ? NGU_HANH[mobEl].color : '#ff7a6a';
        addEffect({ type:'ring', x:player.x, y:player.y-10, r:22, color:elC2 });
        for (let i=0;i<4;i++) addEffect({ type:'ink', x:player.x, y:player.y-12, vx:rnd(-70,70), vy:rnd(-90,-20), color:elC2 });
        player.hurtT = 0.25; // viền đỏ nhấp khi trúng đòn
        player.combatT = 4; // P0: vào trạng thái combat — ngừng hồi máu nhanh
        shakeT = Math.max(shakeT, 0.16); shakeMag = Math.min(6, 2 + 30*dmg/Math.max(1,player.maxHp));
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
        hurtMob(m, dmg, src);
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
  if (TOWER){ // Trận Địa Phòng Thủ: chết giữa lượt → kết thúc lượt riêng, không tính bại trận thường
    dead = true;
    endTowerRun('death');
    return;
  }
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
  if (shakeT > 0 && SETTINGS.shake){ ctx.translate(rnd(-shakeMag, shakeMag)*shakeT/0.16, rnd(-shakeMag, shakeMag)*shakeT/0.16); }
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
  if (curMap === 'towerarena') drawTowerArena();

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
  if (TOWER) drawTowerHUD(); // HUD Trận Địa Phòng Thủ: đợt hiện tại
  if (DEVIL) drawDevilHUD(); // HUD Đấu Trường Tế Thần: đợt + đồng hồ + máu Quỷ Vương
  if (BLOOD) drawBloodHUD(); // HUD Pháo Đài Máu: pha hiện tại + đồng hồ + máu boss

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
  const hurt = Math.min(1, (m.hitT || 0) / 0.25);
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
  if (m.hitT > 0) g.filter = 'brightness(1.8) saturate(0.4)';       // trúng đòn: loé trắng
  arch(g, P, ps);
  g.filter = 'none';
  const fx = MOB_ATK_FX[d.skel];                                     // phun lửa / chém kiếm...
  if (fx && ps.atk > 0.02) fx(g, P, ps);
  g.restore();
  return true;
}

// Ảnh thu nhỏ cho quái vẽ khung xương, dùng trong panel (Hóa Thân, sổ tay...).
const _mobCardCache = {};
function mobCardUrl(mobKey){
  if (_mobCardCache[mobKey]) return _mobCardCache[mobKey];
  const d = MOBS[mobKey]; if (!d || !d.skel) return '';
  const cv = document.createElement('canvas'); cv.width = MOBSK_W; cv.height = MOBSK_H;
  drawMobFigure({ face:0, wob:0, lungeT:0, hitT:0, moving:false },
                Object.assign({}, d, { boss:false, size:MOBSK_H/3.6 }),
                MOBSK_W/2, MOBSK_H - 4, 0, cv.getContext('2d'));
  return (_mobCardCache[mobKey] = cv.toDataURL('image/png'));
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
  if (d.el && NGU_HANH[d.el]){
    ctx.save(); ctx.globalAlpha = 0.14 + 0.05*Math.sin(m.wob*1.3);
    ctx.strokeStyle = NGU_HANH[d.el].color; ctx.lineWidth = 2;
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
    if (m.hitT > 0) ctx.filter = 'brightness(1.7) saturate(2) hue-rotate(-45deg)';
    else if (d.golden) ctx.filter = 'sepia(0.85) saturate(2.6) hue-rotate(-14deg) brightness(1.25)'; // nhúng vàng cho quái dùng ảnh
    ctx.drawImage(img, -mw/2, -mh/2, mw, mh);
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
  const eld = d.el && NGU_HANH[d.el];
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
const HERO_ACT = {
  // chém dọc từ trên xuống — đòn thường cận chiến
  slash: p => ({ armR: -0.7 + p*2.1, armL: -0.30*Math.sin(p*Math.PI), lean: 0.16*Math.sin(p*Math.PI),
                 wrot: 0, wpush: 0, sw: Math.sin(p*Math.PI) }),
  // quét ngang một vòng — Twisting Slash (DK) · Fire Slash (MG): VFX hình quạt
  spin:  p => ({ armR: -0.45 + p*1.05, armL: 0.55*Math.sin(p*Math.PI), lean: 0.22*Math.sin(p*Math.PI),
                 wrot: -1.65 + p*3.3, wpush: 8*Math.sin(p*Math.PI), sw: Math.sin(p*Math.PI) }),
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
function heroPose(wph, mv, atkK, castK, now, act){
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
  };
}
const HERO_POSE0 = heroPose(0, false, 0, 0, 0, 'slash');

// ── LỚP CHUNG: chân · thân · đầu (giáp của từng lớp vẽ đè lên) ──
function hLegs(g, P, ps){
  hJoint(g, HERO_JOINT.hipL[0], HERO_JOINT.hipL[1], ps.legL, () => {
    hPoly(g, [[63,140],[80,140],[80,198],[61,198]], P.leg);
    hPoly(g, [[60,194],[79,194],[81,212],[57,212]], P.boot);
  });
  hJoint(g, HERO_JOINT.hipR[0], HERO_JOINT.hipR[1], ps.legR, () => {
    hPoly(g, [[80,140],[97,140],[99,198],[80,198]], P.leg);
    hPoly(g, [[81,194],[100,194],[103,212],[79,212]], P.boot);
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
  const f = (ps.legL - ps.legR) * 16 + ps.sw * 22;
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
        g.save(); g.translate(122 + ps.wpush, 134); g.rotate(0.13 + ps.wrot); // chếch ra ngoài, không cắt mặt
        hPoly(g, [[-6,0],[6,0],[5,-96],[0,-112],[-5,-96]], '#d2d6de');
        g.fillStyle = '#fff'; g.fillRect(-2, -96, 3, 90);
        hPoly(g, [[-18,0],[18,0],[16,10],[-16,10]], M.trim);
        g.fillStyle = '#4a3520'; g.fillRect(-5, 10, 10, 30);
        hEll(g, 0, 44, 7, 7, M.trim); g.restore();
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
        g.save(); g.translate(122 + ps.wpush, 136); g.rotate(0.18 + ps.wrot);
        hPoly(g, [[-9,0],[9,0],[7,-104],[0,-124],[-7,-104]], '#dcd2c0');
        hPoly(g, [[0,0],[9,0],[7,-104],[0,-124]], '#b6ac98');
        g.fillStyle = '#fff6e0'; g.fillRect(-2, -104, 3, 98);
        hPoly(g, [[-20,0],[20,0],[17,11],[-17,11]], M.trim);
        g.fillStyle = '#3a2418'; g.fillRect(-5, 11, 10, 28); g.restore();
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
        g.save(); g.translate(118 + ps.wpush, 132); g.rotate(0.15 + ps.wrot);
        hPoly(g, [[-4,0],[4,0],[3,-58],[0,-68],[-3,-58]], '#c0c4cc');
        hPoly(g, [[-12,0],[12,0],[11,8],[-11,8]], '#8a7a4a');
        g.fillStyle = '#4a3520'; g.fillRect(-4, 8, 8, 22); g.restore();
      });
    },
  },
};
// Vẽ nhân vật trong hộp 160×220. tier = bậc Thần Binh (đổi bảng màu giáp).
function drawHeroFigure(g, sectKey, tier, now, ps){
  const M = hMetal(tier), G = HERO_GEAR[sectKey] || HERO_GEAR.vophai, P = G.pal;
  ps = ps || HERO_POSE0;
  g.save();
  hEll(g, 80, 212, 30 - ps.bob * 0.9, 8, 'rgba(0,0,0,.22)'); // bóng co lại khi nhấc chân
  if (M.glow){ // giáp bậc cao toả sáng — nhìn là biết đồ xịn, không cần đọc số
    const ag = g.createRadialGradient(80, 120, 10, 80, 120, 86);
    ag.addColorStop(0, M.glow); ag.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.2 + 0.1 * Math.sin(now / 380); g.fillStyle = ag;
    g.beginPath(); g.arc(80, 120, 86, 0, 7); g.fill(); g.globalAlpha = 1;
  }
  if (G.cape && !ps.back) hCape(g, G.cape[0], G.cape[1], ps);
  hLegs(g, P, ps);
  g.translate(0, ps.bob);                                    // nhún theo bước chân
  hJoint(g, 80, 146, ps.lean, () => {
    G.upper(g, M, ps, P);
    // quay lưng: áo choàng phủ lên trên thân, đúng như nhìn nhân vật đi ra xa
    if (G.cape && ps.back) hCape(g, G.cape[0], G.cape[1], ps);
  });
  g.restore();
}

// Ảnh chân dung lớp cho màn chọn nhân vật / bảng nhân vật: vẽ thẳng bằng
// drawHeroFigure() nên card LUÔN khớp với người đứng trong game (trước đây là
// thẻ Axie tĩnh, chọn Dark Knight xong vào game lại thấy một hình khác hẳn).
const _heroCardCache = {};
function heroCardUrl(sectKey, tier){
  const key = sectKey + ':' + (tier || 1);
  if (_heroCardCache[key]) return _heroCardCache[key];
  const cv = document.createElement('canvas');
  cv.width = HERO_W; cv.height = HERO_H;
  drawHeroFigure(cv.getContext('2d'), sectKey, tier || 1, 0, HERO_POSE0);
  return (_heroCardCache[key] = cv.toDataURL('image/png'));
}
function drawPlayer(){
  const sect = SECTS[player.sect];
  const p = player;
  // ═══ LAYERING: đất → sau lưng → người → vũ khí → aura quỹ đạo → danh hiệu ═══
  const riding = false; // Thú Chiến không cưỡi — chiến thú là đồng đội riêng (drawMount)
  const now = performance.now();
  let yOff = 0;
  // Phiêu Vân Bộ jump arc
  let jumpK = 0;
  if (p.jumpT > 0){
    jumpK = Math.sin(Math.PI * (1 - p.jumpT / (p.jumpDur || 0.6)));
    yOff -= jumpK * 48;
  }
  if (p.moving && jumpK === 0) yOff -= Math.abs(Math.sin(now/95)) * 2.4; // nhịp bước chân khi chạy — người "sống" hơn
  // ── LỚP ĐẤT (không theo nhảy/cưỡi): bóng đổ ──
  const _shI = gameTimeInfo(), _shDx = (_shI.frac - 0.5) * 22, _shAl = 1 - skyDarkness()*0.35; // bóng xoay theo quỹ đạo mặt trời (Gói C)
  const _shRx = (riding?27:16)*(1-jumpK*0.45), _shRy = (riding?9:6)*(1-jumpK*0.45);
  ctx.fillStyle = 'rgba(0,0,0,' + (0.09*_shAl).toFixed(3) + ')'; ctx.beginPath();
  ctx.ellipse(p.x + _shDx, p.y+8, _shRx*1.5, _shRy*1.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,' + (0.20*_shAl).toFixed(3) + ')'; ctx.beginPath();
  ctx.ellipse(p.x + _shDx*0.45, p.y+8, _shRx, _shRy, 0, 0, 7); ctx.fill();
  // bụi gót chân khi chạy — tạo cảm giác chuyển động
  if (!SETTINGS.lowFx && p.moving && jumpK === 0 && !p.ascended && Math.random() < 0.08) // Starflight: ngự kiếm không vấp bụi
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
    const wd = WING_DEFS.find(w => w.id === wingIt.wing) || WING_DEFS[0];
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
  // Hóa Thân Tướng Quân mượn hình boss → sprite quái nếu boss đó còn ảnh,
  // còn boss vẽ khung xương thì dựng lại bằng chính bộ vẽ của nó.
  const img = (p.channelT > 0 && p.channelId) ? CHANNEL_IMGS[p.channelId] : null;
  let _chSkel = null;
  if (p.channelT > 0 && p.channelId && !img){
    const _tv = findTranaiById(p.channelId);
    if (_tv && MOBS[_tv.img] && MOBS[_tv.img].skel) _chSkel = MOBS[_tv.img];
  }
  const wph = p.walkPh || 0;
  const bob = p.moving ? Math.abs(Math.sin(wph))*4.2 : Math.sin(wph)*1.5;
  const rock = p.moving ? Math.sin(wph)*0.07 : 0;
  const castK = (p.castT || 0) / 0.38;
  const atkK = (p.atkAnim || 0) / 0.22; // lunge về phía chém
  const pulse = 1 + castK*0.12 + (p.moving ? Math.sin(wph*2)*0.025 : Math.sin(wph)*0.015);
  if (p.ascended){
    const _tKey = (p.gender === 'nu' ? 'nu' : 'nam') + '_' + (TIEN_SKINS[p.tienSkin] ? p.tienSkin : 'bach');
    const _tim = TIEN_IMGS[_tKey];
    if (_tim && _tim.complete && _tim.naturalWidth){
      const _tsk = TIEN_SKINS[p.tienSkin] || TIEN_SKINS.bach;
      const sh = 128, sw = sh * (_tim.naturalWidth/_tim.naturalHeight);
      const hover = Math.sin(now/520)*3.4; // ngự kiếm: lơ lửng trên phi kiếm
      ctx.save(); ctx.translate(p.x + Math.cos(p.face)*atkK*5, p.y + 6 - hover);
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
    // Mượn hình boss → blit sprite quái; bình thường → dựng nhân vật bằng khớp xương.
    const channeling = !!(img && img.complete && img.naturalWidth);
    const sh = channeling ? 120 : 104;
    const flip = Math.cos(p.face) < 0;
    ctx.save();
    ctx.translate(p.x + Math.cos(p.face)*atkK*7,
                  (channeling ? p.y - 26 - bob : p.y - 42) + Math.sin(p.face)*atkK*3);
    if (flip) ctx.scale(-1, 1);
    // khớp xương đã tự ngả người rồi nên không xoay đè thêm
    ctx.rotate(channeling ? rock + atkK*0.12 : 0); ctx.scale(pulse, pulse);
    // Hóa Thân Tướng Quân: hào quang đỏ thẫm dữ dội theo hệ boss đang mượn hình
    if (channeling){
      const _chTv = findTranaiById(p.channelId), _chCol = (NGU_HANH[_chTv && _chTv.el] || {}).color || '#ffb15c';
      const hg2 = ctx.createRadialGradient(0, -8, 6, 0, -8, 70);
      hg2.addColorStop(0, _chCol + 'b0'); hg2.addColorStop(0.55, _chCol + '30'); hg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.8 + 0.18*Math.sin(now/180); ctx.fillStyle = hg2;
      ctx.beginPath(); ctx.arc(0, -8, 70, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = _chCol; ctx.shadowBlur = 18;
    }
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
    if (channeling){
      const sw = sh * (img.naturalWidth/img.naturalHeight);
      ctx.drawImage(img, -sw/2, -sh/2, sw, sh);
    } else if (_chSkel){                       // Hóa Thân boss khung xương: mượn đúng hình nó
      drawMobFigure({ face:0, wob:now/700, lungeT: atkK*0.22, hitT:0, moving:!!p.moving, spd0:1 },
                    Object.assign({}, _chSkel, { boss:true, size:24 }), 0, sh*0.5, now, ctx);
    } else {
      const s = sh / HERO_H;
      ctx.scale(s, s); ctx.translate(-HERO_W/2, -HERO_H/2);
      const _act = castK > 0 ? (p.castAct || heroActOf(p.sect, 'a'))
                             : (p.atkAct  || heroActOf(p.sect, 'basic'));
      const _ps = heroPose(wph, !!p.moving, atkK, Math.min(1, castK), now, _act);
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
      drawHeroFigure(ctx, p.sect, (p.thanbinh && p.thanbinh.tier) || 1, now, _ps);
    }
    ctx.restore();
  }
  // Vũ khí danh phái cầm tay — nhân vật khớp xương đã tự cầm vũ khí nên bỏ qua
  if (p.ascended || (p.channelT > 0 && p.channelId)) drawSectWeapon(p, sect);
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
function setSkillBtn(id, unlocked, cd, max, name){
  const b = el(id);
  b.classList.toggle('locked', !unlocked);
  b.title = unlocked ? name : `${name} — mở khóa sau`;
  const cdEl = b.querySelector('.sk-cd');
  cdEl.style.height = (cd>0 ? (100*cd/max) : 0) + '%';
}
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
// QA: các pha boss buộc tự tay né (Quỷ Vương/Thiên Sứ/Boss Săn) — dùng chung cho cả chỗ ép tắt
// AUTO mỗi frame trong update() lẫn chỗ chặn bật lại AUTO ở toggleAuto() ngay dưới đây.
function autoBossLockActive(){
  if (DEVIL && DEVIL.bossRef && !DEVIL.bossRef.dead) return true;
  if (BLOOD && BLOOD.phase === 'archangel' && BLOOD.angelRef && !BLOOD.angelRef.dead) return true;
  if (DGN && DGN.huntSpawned && DGN.huntRef && !DGN.huntRef.dead) return true;
  return false;
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
  html += `<img class="char-portrait" src="${p.ascended ? 'assets/tien/' + (p.gender === 'nu' ? 'nu' : 'nam') + '_' + (TIEN_SKINS[p.tienSkin] ? p.tienSkin : 'bach') + '.png' : heroCardUrl(p.sect, (p.thanbinh && p.thanbinh.tier) || 1)}" alt="${sect.name}">${p.ascended ? `<div style="margin-top:4px;font-size:11.5px;color:#fff2b0">☁ Tán Tiên — xuất thế khỏi ${sect.name}, ràng buộc Lớp đã phá bỏ</div>` : ""}`;
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
  renderChar(); saveGame();
};

function itemLineHtml(it){
  const r = RARITIES[it.rarity];
  const m = 1 + it.plus*0.08;
  let s = `<span class="${r.cls}">[${it.special ? it.name : r.name + (it.plus>0?' +'+it.plus:'')}]</span> `;
  if (it.special){
    for (const sub of it.subs) s += `${sub.name} +${Math.round(sub.v*10)/10}% · `;
    s = s.slice(0, -3);
    if (it.cloakTier) s += ` <span style="color:${CLOAK_TIERS[it.cloakTier].color}">(Cấp ${it.cloakTier}${it.cloakTier===2?' · yêu cầu LV60':''})</span>`;
    return s;
  }
  s += `<span style="opacity:.55;font-size:11px">【${giaiName(it.tier)} · C${it.tier}】${player && player.level < itemReqLv(it) ? ` · <span style="color:#ff7a6a">yêu cầu LV${itemReqLv(it)}</span>` : ''}</span> `;
  if (it.perfect) s += `<span style="color:#ffd76a">✦Hoàn Hảo✦</span> `;
  if (it.ancient && ANCIENT_SETS[it.ancient]){
    const set = ANCIENT_SETS[it.ancient];
    const act = player && player.setActive && player.setActive[it.ancient];
    s += `<span style="color:${set.color}">◈Cổ Thần ${set.name}${act ? ` (${act.n}/5)` : ''}</span> `;
  }
  if (it.luck) s += `<span style="color:#7fd8e0">☘Vận</span> `;
  if (it.life) s += `<span style="color:#e84a6a">❤Sinh Mệnh +${it.life*4}% HP</span> `;
  s += `${it.main.name} +${Math.round(it.main.v*m*10)/10}`;
  s += ` · ${it.element}`;
  for (const sub of it.subs) s += ` · ${sub.name} +${Math.round(sub.v*(sub.k==='perfect'?1:m)*10)/10}%`;
  if (it.plus>=10) s += ` · <span style="color:#f39c3d">☆ ${it.awakened.name}</span>`;
  else s += ` · <span style="opacity:.4">☆(+10)</span>`;
  return s;
}
let forgeSel = null;
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
  if (!it || it.special || !player.jewels || player.jewels.honDon < 1) return;
  player.jewels.honDon--;
  let el2 = it.element;
  while (el2 === it.element) el2 = ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
  it.element = el2;
  addFloat(player.x, player.y-52, `◑ ĐỔI HỆ — chuyển sang hệ ${el2}!`, NGU_HANH[el2].color, 14);
  calcDerived(); saveGame(); renderForge();
};
// Đổi 60 Mảnh Cổ Thần → 1 món Cổ Thần chọn bộ (pity Tứ Tượng — vá lỗi không pity)
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
function renderForge(){
  if (player.level < 4){ // P0: mở ở cấp 4 để NV5 "Rèn Luyện Sơ Nhập" không bị khóa
    CE().innerHTML = `<h3>Rèn Luyện</h3>
      <div style="padding:14px;font-size:13px">Lò rèn mở khóa ở <b style="color:#7ecbff">cấp 4</b>.<br>Hãy tiếp tục làm nhiệm vụ!</div>`;
    return;
  }
  const all = [];
  for (const s in player.equip) if (player.equip[s] && !player.equip[s].noForge) all.push({ it:player.equip[s], where:'equip', key:s });
  player.inv.forEach((it,i)=>{ if (!it.noForge) all.push({ it, where:'inv', key:i }); });
  let html = `<h3>Rèn Luyện — Tăng Cường Trang Bị</h3>`;
  html += `<div style="font-size:12px;color:#9aa8d4;line-height:1.7">◈ <b>${player.silver}</b> · ✦ Huyền Thiết <b style="color:#9fd0ff">${player.mat}</b> · ◆ Tu La <b style="color:#e84a6a">${player.gems.tuLa}</b> · ❖ Hỗn Nguyên <b style="color:#b08ae8">${player.gems.honNguyen}</b><br>
    ☂ Thiên Mệnh Phù <b style="color:#7ecbff">${player.charms}</b> <button class="mini-btn" onclick="buyCharm()" ${player.silver<500?'disabled':''}>Mua (500◈)</button>${player.forgeBonus?` · <span style="color:#5aa0e8">Thợ Rèn Truyền Thuyết: +${player.forgeBonus}% tỉ lệ</span>`:''}</div>`;
  if (!all.length){ html += `<div style="padding:12px;opacity:.6;font-size:12px">Chưa có trang bị nào.</div>`; }
  html += `<div class="stat-sec">CHỌN TRANG BỊ (tối đa +11 · +10 thức tỉnh)</div>`;
  all.forEach((e,i)=>{
    const sel = forgeSel && forgeSel.uid === e.it.uid;
    html += `<div class="slot-row" style="${sel?'border-color:#7ecbff;background:rgba(76,141,255,.12)':''}" onclick="forgeSelect(${i})">
      <span class="s-name"><span class="${RARITIES[e.it.rarity].cls}">${e.it.name}${e.it.plus?' +'+e.it.plus:''}</span>
      <span style="opacity:.55;font-size:11px"> (${e.where==='equip'?'đang mặc':'túi'})</span></span></div>`;
  });
  window._forgeList = all;
  const sel = forgeSel && all.find(e=>e.it.uid===forgeSel.uid);
  if (sel){
    const it = sel.it;
    html += `<div class="forge-lines"><b class="${RARITIES[it.rarity].cls}">${it.name} +${it.plus}</b>
      <span style="opacity:.6"> (Lực chiến ${itemPower(it)})</span><br>${itemLineHtml(it)}</div>`;
    if (it.plus >= 11){
      html += `<div id="forge-msg" style="color:#f39c3d">☀ Đã đạt Khai Quang tối thượng (+11) — danh hiệu Thợ Rèn Truyền Thuyết!</div>`;
    } else if (it.plus >= 9){
      // GDD: trang bị +9 trở lên không thể tự rèn — phải đến Lò Rèn Hoàng Gia
      html += `<div class="next-tier" style="border-color:#e8b04a"><b style="color:#e8b04a">☰ Phá Thiên Kiếp (+9 → +11)</b><br>
        <span style="font-size:12px;line-height:1.6">Trang bị từ +9 không thể tự rèn. Hãy mang đến <b>Lò Rèn Hoàng Gia</b> ở trung tâm <b>Lunaris City</b>, nhờ <b>Tông Sư Thợ Rèn</b> vận công dung hợp.</span></div>
        <div class="forge-actions"><button class="mini-btn" onclick="closePanels(); window.hintGoForge()">Dịch Chuyển tới Lò Rèn Hoàng Gia</button></div>
        <div id="forge-msg"></div>`;
    } else {
      const target = it.plus + 1;
      const rule = forgeRule(target);
      const rate = Math.min(100, rule.rate + (player.forgeBonus||0));
      const costS = (20 + it.plus*15) * (it.tier || 1); // Drop v2.0: phí rèn theo giai
      const canPay = player.silver>=costS && player.mat>=rule.mat && player.gems.tuLa>=rule.tuLa && player.gems.honNguyen>=rule.hon;
      const failTxt = rule.fail === 'drop1' ? 'thất bại: TỤT 1 CẤP (tẩu hỏa nhập ma)' : 'thất bại chỉ mất vật liệu';
      // Đập Ngọc (+6 → +9): hiển thị rõ ngọc Tu La cần đập vào
      if (rule.tuLa){
        const enough = player.gems.tuLa >= rule.tuLa;
        html += `<div class="gem-socket">
          <img src="assets/items/mat_tula.png" onerror="this.style.display='none'" alt="Tu La">
          <div><b style="color:#e84a6a">ĐẬP NGỌC — Tu La Tinh Thạch</b><br>
          <span style="font-size:11.5px;opacity:.8">+6 trở lên bắt buộc đập ngọc để đột phá giới hạn (75% → 50%). Thất bại chỉ tụt 1 cấp.</span><br>
          <span style="color:${enough?'#8fd18f':'#ff7a6a'};font-size:12px">Đang có: ${player.gems.tuLa} / cần ${rule.tuLa} viên</span></div></div>`;
      } else {
        html += `<div class="gem-socket">
          <img src="assets/items/mat_huyenthiet.png" onerror="this.style.display='none'" alt="Huyền Thiết">
          <div><b style="color:#9fd0ff">BÌNH CHỈ NHƯ THỦY (+1 đến +6)</b><br>
          <span style="font-size:11.5px;opacity:.8">Huyền Thiết Thạch cường hóa an toàn tuyệt đối — tỉ lệ 100%.</span><br>
          <span style="color:#8fd18f;font-size:12px">Đang có: ${player.mat} / cần ${rule.mat} ✦ · ${costS}◈</span></div></div>`;
      }
      if (rule.fail !== 'none'){
        html += `<label style="display:block;font-size:12px;margin:6px 0;color:#7ecbff;cursor:pointer">
          <input type="checkbox" ${forgeUseCharm?'checked':''} onchange="forgeUseCharm=this.checked" ${player.charms>0?'':'disabled'}>
          Dùng Thiên Mệnh Phù — xịt vẫn giữ nguyên cấp (còn ${player.charms})</label>`;
      }
      html += `<div class="forge-actions"><button class="mini-btn" style="font-size:13px;padding:8px 20px"
        onclick="doEnhance()" ${canPay?'':'disabled'}>
        ${rule.tuLa ? '◆ Đập Ngọc +' + target : 'Tăng Cường +' + target} (${rate}%)<br><span style="font-size:11px">${costS}◈ + ${rule.mat}✦${rule.tuLa ? ` + ${rule.tuLa}◆ Tu La` : ''}</span></button></div>
        <div style="font-size:11px;opacity:.7;text-align:center">${failTxt}</div>
        <div id="forge-msg"></div>`;
    }
    // ── Tứ Châu khảm phúc (Track HT — GDD §13) ── kéo viên ngọc thả vào ô món đồ để khảm,
    // hoặc bấm nút bên dưới (giữ lại cho thao tác chạm trên mobile — kéo-thả HTML5 không chạy trên touch).
    const J = player.jewels || { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
    const canCP = J.chucPhuc > 0 && !it.noForge && it.plus <= 5;
    const canLH = J.linhHon > 0 && !it.noForge && it.plus < 11;
    const isArmor = ARMOR_SLOTS.includes(it.slot);
    const smRate = Math.max(25, 75 - (it.life || 0) * 8);
    const canSM = J.sinhMenh > 0 && isArmor && (it.life || 0) < 7;
    html += `<div class="stat-sec">TỨ CHÂU — kéo ngọc thả vào món đồ bên dưới để khảm · ● Hỗn Độn <b style="color:#7ecbff">${J.honDon}</b></div>`;
    html += `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">
      <div class="jewel-drag" draggable="${canCP}" ondragstart="onJewelDragStart(event,'chucPhuc')" title="Lên +1 miễn phí, 100% thành công (áp dụng +0 đến +5)">◎<br>Chúc Phúc<br><b style="color:#7ec850">${J.chucPhuc}</b></div>
      <div class="jewel-drag" draggable="${canLH}" ondragstart="onJewelDragStart(event,'linhHon')" title="Lên +1 với 50% — thất bại tụt 1 cấp (áp dụng đến +10, kể cả Phá Thiên Kiếp)">◉<br>Linh Hồn<br><b style="color:#b08ae8">${J.linhHon}</b></div>
      <div class="jewel-drag" draggable="${canSM}" ondragstart="onJewelDragStart(event,'sinhMenh')" title="${isArmor?`+4% HP mỗi bậc (tối đa 7 bậc = +28%) — thất bại về 0. Tỉ lệ hiện tại: ${smRate}%`:'Chỉ khảm lên giáp trụ (Nón/Giáp/Tay/Quần/Giày)'}">❤<br>Sinh Mệnh<br><b style="color:#e84a6a">${J.sinhMenh}</b></div>
    </div>
    <div class="forge-drop-zone" style="display:flex;justify-content:center;margin-bottom:8px"
      ondragover="onForgeItemDragOver(event)" ondragenter="onForgeItemDragEnter(event)" ondragleave="this.classList.remove('drag-over')"
      ondrop="this.classList.remove('drag-over'); onForgeItemDrop(event, ${it.uid})">
      ${slotIcon(it, '')}
    </div>
    <div class="forge-actions" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
      <button class="mini-btn" ${canCP?'':'disabled'} onclick="useJewel('chucPhuc',${it.uid})" title="Lên +1 miễn phí, 100% thành công (áp dụng +0 đến +5)">◎ Chúc Phúc +1</button>
      <button class="mini-btn" ${canLH?'':'disabled'} onclick="useJewel('linhHon',${it.uid})" title="Lên +1 với 50% — thất bại tụt 1 cấp (áp dụng đến +10, kể cả Phá Thiên Kiếp)">◉ Linh Hồn +1 (50%)</button>
      <button class="mini-btn" ${canSM?'':'disabled'} onclick="useJewel('sinhMenh',${it.uid})" title="${isArmor?`+4% HP mỗi bậc (tối đa 7 bậc = +28%) — thất bại về 0. Tỉ lệ hiện tại: ${smRate}%`:'Chỉ khảm lên giáp trụ (Nón/Giáp/Tay/Quần/Giày)'}">❤ Sinh Mệnh ${(it.life||0)}/7</button></div>
      <div id="jewel-msg" style="min-height:16px;font-size:12px;text-align:center"></div>`;
    // ── Drop v2.0: Tấn Phẩm / Kế Thừa / Đổi Hệ ──
    if (!it.special){
      if (it.rarity < 4 && !it.ancient){
        const tp = TANPHAM_RULES[it.rarity];
        const costTxt = [tp.tinh?`${tp.tinh}✦`:'', tp.manh?`${tp.manh}❖Mảnh`:'', tp.tichMa?`${tp.tichMa}◆TịchMa`:'', tp.an?`${tp.an}☬Ấn`:'', `${tp.silver}◈`].filter(Boolean).join(' + ');
        const canTp = player.mat>=tp.tinh && player.mats.manh>=tp.manh && player.mats.tichMa>=tp.tichMa && player.mats.anTranAi>=tp.an && player.silver>=tp.silver;
        html += `<div class="stat-sec">TẤN PHẨM — ${RARITIES[it.rarity].name} → <b style="color:${RARITIES[it.rarity+1].color}">${RARITIES[it.rarity+1].name}</b> (mở ${RARITY_SUBS[it.rarity+1]} dòng phụ)</div>
          <div class="forge-actions"><button class="mini-btn" ${canTp?'':'disabled'} onclick="doTanPham(${it.uid})">✦ Tấn Phẩm (${tp.rate}%)<br><span style="font-size:11px">${costTxt}</span></button></div>
          <div style="font-size:11px;opacity:.7;text-align:center">${tp.rate<100?'thất bại: giữ đồ & Ấn, mất nửa vật liệu':'an toàn tuyệt đối 100%'}</div>`;
      }
      if (it.tier < 10){
        const canKt = player.mats.manh>=40 && player.mats.tichMa>=4 && player.silver>=5000*it.tier;
        html += `<div class="stat-sec">KẾ THỪA —【${giaiName(it.tier)}】→【${giaiName(it.tier+1)}】giữ Phẩm/+${it.plus}/dòng phụ (gốc −10%)</div>
          <div class="forge-actions"><button class="mini-btn" ${canKt?'':'disabled'} onclick="doKeThua(${it.uid})">⚒ Kế Thừa<br><span style="font-size:11px">40❖Mảnh + 4◆TịchMa + ${5000*it.tier}◈</span></button></div>`;
      }
      const canDh = player.jewels && player.jewels.honDon >= 1;
      html += `<div class="forge-actions"><button class="mini-btn" ${canDh?'':'disabled'} onclick="doDoiHe(${it.uid})" title="Re-roll nguyên tố trang bị (hiện: ${it.element})">◑ Đổi Hệ (1● Hỗn Độn)</button></div>`;
    }
  }
  // Luyện Bảo Các — Áo Choàng (2 cấp, chỉ luyện chế tại đây, không rơi từ quái)
  const cloak = player.equip.aochoang || player.inv.find(x => x.slot === 'aochoang');
  html += `<div class="stat-sec">LUYỆN BẢO CÁC — ÁO CHOÀNG</div>`;
  if (!cloak){
    const c = CLOAK_TIERS[1];
    const can = player.gems.tuLa >= c.cost.tuLa && player.gems.honNguyen >= c.cost.hon && player.silver >= c.cost.silver;
    html += `<div class="next-tier"><b style="color:${c.color}">${c.name} (Cấp 1)</b><br>
      Thêm Sát Thương +${c.atkPct}% · Xuyên Giáp +${c.pierce}%<br>
      <span style="opacity:.75">Phí: ${c.cost.tuLa}◆ Tu La + ${c.cost.hon}❖ Hỗn Nguyên + ${c.cost.silver}◈</span></div>
      <div class="forge-actions"><button class="mini-btn" onclick="craftCloak(1)" ${can?'':'disabled'}>Luyện Chế Áo Choàng</button></div>
      <div id="cloak-msg" style="text-align:center;font-size:12px"></div>`;
  } else if (cloak.cloakTier === 1){
    const c = CLOAK_TIERS[2];
    const can = player.level >= 60 && player.gems.tuLa >= c.cost.tuLa && player.gems.honNguyen >= c.cost.hon && player.silver >= c.cost.silver;
    html += `<div class="next-tier"><b style="color:${c.color}">${c.name} (Cấp 2 — yêu cầu LV60)</b><br>
      Thêm Sát Thương +${c.atkPct}% · Xuyên Giáp +${c.pierce}% · Phòng Ngự +${c.defPct}%<br>
      <span style="opacity:.75">Phí: ${c.cost.tuLa}◆ Tu La + ${c.cost.hon}❖ Hỗn Nguyên + ${c.cost.silver}◈${player.level<60?' · <span style="color:#ff7a6a">chưa đạt LV60</span>':''}</span></div>
      <div class="forge-actions"><button class="mini-btn" onclick="craftCloak(2)" ${can?'':'disabled'}>Thăng Cấp Áo Choàng 2</button></div>
      <div id="cloak-msg" style="text-align:center;font-size:12px"></div>`;
  } else {
    html += `<div style="text-align:center;color:#7ecbff;font-size:13px;padding:6px">☀ ${CLOAK_TIERS[2].name} — áo choàng tối thượng của Luyện Bảo Các!</div>`;
  }
  // ── Drop v2.0: pity Cổ Thần — 60 Mảnh Cổ Thần đổi 1 món chọn bộ ──
  html += `<div class="stat-sec">TỨ TƯỢNG CỔ THẦN — đổi ◈ Mảnh Cổ Thần (đang có <b style="color:#7ecbff">${(player.mats&&player.mats.manhCoThan)||0}</b>/60)</div>`;
  html += `<div class="forge-actions" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">`;
  for (const sid in ANCIENT_SETS){
    const st = ANCIENT_SETS[sid];
    html += `<button class="mini-btn" style="border-color:${st.color};color:${st.color}" ${(player.mats&&player.mats.manhCoThan>=60)?'':'disabled'} onclick="doiCoThan('${sid}')">◈ ${st.name} (60)</button>`;
  }
  html += `</div><div style="font-size:11px;opacity:.7;text-align:center">Mảnh Cổ Thần rơi từ Cổng Vực (×2/lần hạ) — bảo đảm Cổ Thần sau ~30 lần Chinh Phạt.</div>`;
  CE().innerHTML = html;
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
window.forgeSelect = function(i){
  forgeSel = window._forgeList[i].it;
  renderForge();
};
window.doEnhance = function(){
  const all = window._forgeList;
  const sel = forgeSel && all.find(e=>e.it.uid===forgeSel.uid);
  if (!sel) return;
  const it = sel.it;
  if (it.plus >= 11) return;
  const target = it.plus + 1;
  const rule = forgeRule(target);
  if (rule.bagua){
    const msg0 = document.getElementById('forge-msg');
    if (msg0){ msg0.textContent = '✘ Trang bị +9 trở lên chỉ rèn được tại Lò Rèn Hoàng Gia — Lunaris City!'; msg0.style.color = '#ff9a6a'; }
    addFloat(player.x, player.y-40, 'Phải đến Lò Rèn Hoàng Gia!', '#ff9a6a', 13);
    return;
  }
  const rate = Math.min(100, rule.rate + (player.forgeBonus||0));
  const costS = (20 + it.plus*15) * (it.tier || 1); // Drop v2.0: phí rèn theo giai
  if (player.silver < costS || player.mat < rule.mat || player.gems.tuLa < rule.tuLa || player.gems.honNguyen < rule.hon) return;
  const useCharm = forgeUseCharm && player.charms > 0 && rule.fail !== 'none';
  player.silver -= costS; player.mat -= rule.mat;
  player.gems.tuLa -= rule.tuLa; player.gems.honNguyen -= rule.hon;
  const msg = document.getElementById('forge-msg');
  if (Math.random()*100 < rate){
    it.plus++;
    AudioSys.sfx('forge_ok', 0.85);
    if (msg){ msg.textContent = `✔ Thành công! ${it.name} +${it.plus}`; msg.style.color = '#8fd18f'; }
    addFloat(player.x, player.y-40, `Rèn thành công +${it.plus}!`, '#8fd18f', 14);
    addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#8fd18f' });
    // quest 5 check
    const q = currentQuest();
    if (q && q.type==='enhance' && questState==='active' && it.plus >= q.need){
      questProg = q.need; questState='done';
      addFloat(player.x, player.y-60, `Nhiệm vụ hoàn thành — về gặp ${npcName(q.npc)}`, '#8fd18f', 13);
    }
    if (it.plus === 10) addFloat(player.x, player.y-56, `☆ Thức tỉnh: ${it.awakened.name}`, '#f39c3d', 13);
    if (it.plus === 11){
      player.forged11 = true;
      addFloat(player.x, player.y-72, '☀ KHAI QUANG +11 — Thợ Rèn Truyền Thuyết!', '#ffd76a', 16);
      addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:'#ffd76a', big:true });
    }
    dailyTrack('forge'); // Mục Tiêu Hôm Nay
    checkTitles();
  } else if (useCharm){
    player.charms--;
    if (msg){ msg.textContent = `☂ Thiên Mệnh Phù đã bảo hộ — trang bị giữ nguyên +${it.plus}`; msg.style.color = '#7ecbff'; }
    addFloat(player.x, player.y-40, 'Thiên Mệnh Phù bảo hộ!', '#7ecbff', 13);
  } else {
    AudioSys.sfx('forge_fail', 0.8);
    if (rule.fail === 'drop1'){
      it.plus = Math.max(6, it.plus - 1);
      if (msg){ msg.textContent = `✘ Thất bại — tụt xuống +${it.plus}`; msg.style.color = '#ff7a6a'; }
      addFloat(player.x, player.y-40, `Rèn xịt! Tụt còn +${it.plus}`, '#ff7a6a', 13);
    } else if (rule.fail === 'zero'){
      it.plus = 0;
      if (msg){ msg.textContent = `✘ Thất bại thảm khốc — trang bị về +0!`; msg.style.color = '#ff7a6a'; }
      addFloat(player.x, player.y-40, 'Rèn xịt! Về +0!', '#ff7a6a', 14);
    } else if (rule.fail === 'break'){
      if (sel.where === 'equip') player.equip[sel.key] = null;
      else player.inv.splice(sel.key, 1);
      forgeSel = null;
      addFloat(player.x, player.y-40, `${it.name} đã VỠ VỤN!`, '#ff3a3a', 16);
      addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:'#ff3a3a', big:true });
      calcDerived(); saveGame();
      setTimeout(renderForge, 900);
      return;
    } else {
      if (msg){ msg.textContent = `✘ Thất bại... vật liệu đã mất`; msg.style.color = '#ff7a6a'; }
      addFloat(player.x, player.y-40, 'Rèn thất bại!', '#ff7a6a', 13);
    }
  }
  calcDerived(); saveGame();
  setTimeout(renderForge, 900);
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
  return {
    uid: itemSeq++, slot: slot.id, slotName: slot.name,
    name: (armorGroup ? 'Hoàn Hảo ' : '') + ITEM_NAMES[slot.id][r],
    rarity: r, level, tier, perfect: armorGroup,
    main: { k: slot.main, v: slot.base(tier, r), name: mainName(slot.main) },
    element: ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)],
    subs, plus: 0,
    awakened: AWAKENED[Math.floor(Math.random()*AWAKENED.length)],
  };
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
  // Full set 12 ô Thần-grade cấp 10, rèn +11 hoàn hảo
  for (const sl of SLOTS){
    const it = genSpecific(sl.id, 3, MAX_LV);
    it.plus = 11; it.perfect = true;
    player.equip[sl.id] = it;
  }
  // Đồ đặc biệt tối thượng: Áo Choàng cấp 2, Cánh & Pet tốt nhất
  player.equip.aochoang = genCloak(2);
  player.equip.canh = genWing(WING_DEFS.length - 1);
  player.equip.pet = genPet(PET_DEFS.length - 1);
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
    addFloat(player.x, player.y-72, 'Full +11 · Tuyệt học max · Ascension max · M bản đồ · K kỹ năng · 1-3 tung chiêu!', '#a0ffe9', 13);
  } else {
    addFloat(player.x, player.y-50, 'Lunaris City — hãy đến gặp Trưởng Lão Rell (lại gần, nhấn E)!', '#7ecbff', 15);
  }
  if (window.TEST_MODE) addFloat(player.x, player.y-95, 'TEST MODE — nhấn ` (phím dưới Esc) mở console, gõ /help xem lệnh', '#7fd4ff', 12);
  el('intro-story').classList.add('hidden');
  el('sect-select').classList.add('hidden');
  el('hud').classList.remove('hidden');
  el('bottom-hud').classList.remove('hidden');
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
const hasSave = !!localStorage.getItem('vlcm_save');
if (hasSave) showMainMenu(); // người cũ → thẳng màn Tiếp Tục
else setTimeout(showIntro, 0); // người mới → cốt truyện (defer: chờ module intro ở cuối file nạp xong)
{
  const btn = el('btn-continue');
  if (hasSave) btn.classList.remove('hidden');
  btn.addEventListener('click', ()=>{ // bind luôn: save cloud có thể đến sau khi menu đã hiện
    if (loadGame()){
      applySkillIcons();
      el('sect-select').classList.add('hidden');
      el('hud').classList.remove('hidden');
      el('bottom-hud').classList.remove('hidden');
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
        cheatLog(`Lịch Tu Tiên → ${gti.season.name} ${gti.day}/${gti.month} Năm ${gti.year} · Canh ${CANH_NAMES[gti.canh]}`, gti.season.color); break;
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
  { id:'channel',  name:'☬ Hóa Thân', lv:14 },
  { id:'tower',    name:'🌀 Trận Địa Phòng Thủ', lv:20 },
  { id:'arena',    name:'👹 Chiến Trường', lv:20 },
  { id:'alchemy',  name:'🧪 Luyện Đan', lv:8 },
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
  else if (tab==='channel') renderChannelForm();
  else if (tab==='tower') renderTowerTab();
  else if (tab==='arena') renderArenaTab();
  else if (tab==='alchemy') renderAlchemyTab();
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
  const tabbed = { forge:'forge', mount:'mount', tuyethoc:'tuyethoc', arena:'arena', tower:'tower' };
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
  const map = { char:'panel-char', inv:'panel-inv', bag:'panel-bag', skill:'panel-skill', map:'panel-map', settings:'panel-settings', qlog:'panel-qlog' };
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
  for (const id of ['panel-char','panel-inv','panel-bag','panel-skill','panel-map','panel-quest','panel-settings','panel-qlog','panel-stage']){
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
function slotIcon(it, cls){
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
      html += `<div class="eq-slot${it?' filled':''}" title="${it ? it.name + (it.plus?' +'+it.plus:'') : sl.name}"
        onclick="unequip('${slotId}')"
        ondragover="onEquipSlotDragOver(event,'${slotId}')"
        ondragenter="onEquipSlotDragEnter(event,'${slotId}')" ondragleave="this.classList.remove('drag-over')"
        ondrop="this.classList.remove('drag-over'); onEquipSlotDrop(event,'${slotId}')">
        ${it ? slotIcon(it,'') + `<span class="eq-plus">${it.plus?'+'+it.plus:''}</span>` : `<span class="eq-empty">${sl.name}</span>`}
      </div>`;
    }
  }
  html += `</div>`;
  html += `<div class="stat-sec" style="margin-top:10px">CHI TIẾT</div>`;
  let any = false;
  for (const sl of SLOTS){
    const it = player.equip[sl.id];
    if (!it) continue;
    any = true;
    html += `<div class="slot-row" onclick="unequip('${sl.id}')">
      <span class="s-name">${slotIcon(it)}<span><b>${sl.name}</b><br>${itemLineHtml(it)}</span></span></div>`;
  }
  if (!any) html += `<div style="opacity:.5;font-size:12px;padding:8px">Chưa mặc món nào — kéo đồ từ Túi Đồ vào ô tương ứng ở trên.</div>`;
  html += `<div style="font-size:11.5px;opacity:.6;margin-top:8px">Vật phẩm & vật liệu nằm trong <b>Túi Đồ (B)</b>.</div>`;
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
function renderBag(){
  let html = `<h3>Túi Đồ (${player.inv.length}/30)</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div class="stat-sec">VẬT LIỆU QUÝ — di chuột vào ô để xem tên & công dụng</div>`;
  html += `<div class="mat-grid">`;
  for (const r of MAT_ROWS){
    const v = r.get();
    html += `<div class="mat-cell" title="${matTip(r.name, r.desc, v)}">
      <img src="assets/items/mat_${r.icon}.png" onerror="this.style.display='none'" alt="">
      <span class="mc-count" style="color:${r.color}">${fmtCount(v)}</span></div>`;
  }
  html += `<div class="mat-cell" title="${matTip('Bạc', 'tiêu xài khắp Lunacia', player.silver)}">
    <img src="assets/items/mat_bac.png" onerror="this.style.display='none'" alt="">
    <span class="mc-count" style="color:#7ecbff">${fmtCount(player.silver)}</span></div>`;
  html += `<div class="mat-cell" title="${matTip('Công Huân Lệnh', 'Truy Nã Lệnh mỗi ngày · quay Sảnh Cầu May', player.congHuan||0)}">
    <span class="mc-glyph">🎖</span>
    <span class="mc-count" style="color:#ffb15c">${fmtCount(player.congHuan||0)}</span></div>`;
  html += `</div>`;
  // Tứ Châu — châu quý ép trang bị tại Lò Rèn
  const jw = player.jewels || {};
  html += `<div class="stat-sec">TỨ CHÂU — ép tại Lò Rèn / Lò Bảo Chứng</div>`;
  html += `<div class="mat-grid">`;
  for (const jk of ['chucPhuc','linhHon','sinhMenh','honDon']){
    html += `<div class="mat-cell" title="${matTip(JEWEL_NAMES[jk], '', jw[jk]||0)}">
      <span class="mc-glyph" style="color:${JEWEL_COLORS[jk]}">◆</span>
      <span class="mc-count" style="color:${JEWEL_COLORS[jk]}">${fmtCount(jw[jk]||0)}</span></div>`;
  }
  html += `</div>`;
  // Bảo Hạp từ Ma Tôn Giáng Thế — mở lấy trang bị, tầng IV+ có tỉ lệ ra Cổ Thần (không pity)
  const bh = player.baohap || {};
  const bhTiers = Object.keys(bh).filter(t => bh[t] > 0);
  if (bhTiers.length){
    html += `<div class="stat-sec">BẢO HẠP — Hung Thần Giáng Thế</div>`;
    for (const t of bhTiers){
      const d = BAOHAP_TIERS[t];
      html += `<div class="inv-item"><span class="s-name"><b style="color:${d.color}">${d.name}</b> ×${bh[t]}<br>
        <span class="item-tip">LV${d.min}-${d.max === 999 ? '100+' : d.max} · trang bị cao cấp${d.ancient ? ` · <b style="color:#3ac88a">Cổ Thần ${Math.round(d.ancient*100)}%</b>` : ''} · châu quý</span></span>
        <span><button class="mini-btn" onclick="openBaoHap(${t})">Mở Hạp</button></span></div>`;
    }
  }
  // Nội Đan yêu thú — thôn phệ tăng chỉ số vĩnh viễn, tối đa 3 viên/ngày (bài học Phi Nguyệt Tiên Hành Lục)
  const ndUsed = ndToday();
  html += `<div class="stat-sec">NỘI ĐAN YÊU THÚ — Thôn Phệ (hôm nay còn ${Math.max(0, 3-ndUsed)}/3 lần)</div>`;
  for (const el2 of ['Kim','Mộc','Thổ','Thủy','Hỏa']){
    const cnt = (player.noidan && player.noidan[el2]) || 0;
    const nh = NGU_HANH[el2], ef = ND_EFFECT[el2];
    html += `<div class="mat-row"><span style="color:${nh.color};width:20px;text-align:center;font-size:13px">${nh.glyph}</span>
      <span style="flex:1">Nội Đan hệ ${el2} <span style="opacity:.55;font-size:11px">— ${ef.desc}</span></span>
      <b style="color:${nh.color};margin-right:8px">${cnt}</b>
      <button class="mini-btn" ${cnt > 0 && ndUsed < 3 ? '' : 'disabled'} onclick="swallowNoidan('${el2}')">Thôn Phệ</button></div>`;
  }
  html += `<div class="stat-sec">TRANG BỊ NHẶT ĐƯỢC — bấm ô để MẶC NGAY · ▲ xanh = mạnh hơn · ⋯ để Phân Giải/Bán</div>`;
  html += `<label style="font-size:12px;color:#9aa8d4;cursor:pointer"><input type="checkbox" ${player.autoSell?'checked':''} onchange="window.toggleAutoSell(this.checked)"> Tự động bán đồ trắng/xanh lá khi nhặt (đổi lấy bạc)</label>`;
  html += `<label style="font-size:12px;color:#9aa8d4;cursor:pointer"><input type="checkbox" ${player.autoEquip?'checked':''} onchange="window.toggleAutoEquip(this.checked)"> Tự mặc đồ mạnh hơn khi nhặt (≥105% lực chiến, giữ đồ quý)</label>`;
  html += `<div style="margin:6px 0"><button class="mini-btn" onclick="autoEquipBest()">⚡ Mặc Đồ Tốt Nhất (12 ô)</button></div>`;
  if (!player.inv.length) html += `<div style="opacity:.5;font-size:12px;padding:8px">Túi trống — hãy đi farm quái!</div>`;
  html += `<div class="bag-grid">`;
  player.inv.forEach((it, i)=>{
    const _eq2 = player.equip[it.slot], _bp2 = _eq2 ? itemPower(_eq2) : 0;
    const _up = !it.special && player.level >= itemReqLv(it) && itemPower(it) > _bp2;
    html += `<div class="bag-cell rar-${it.rarity}" style="position:relative" draggable="true" ondragstart="onBagItemDragStart(event,${i})" onclick="equipItem(${i})" title="${it.name} — bấm để MẶC NGAY, hoặc kéo thả vào ô Trang Bị${_up ? ' (mạnh hơn đang mặc!)' : ''} · ⋯ để chọn">
      ${slotIcon(it, '')}<span class="bc-plus">${it.plus?'+'+it.plus:''}</span>${_up ? '<span style="position:absolute;bottom:0;left:2px;color:#6ae88a;font-size:11px;font-weight:700;text-shadow:0 1px 2px #000">▲</span>' : ''}<span style="position:absolute;top:-3px;right:2px;font-size:12px;color:#c9b889;cursor:pointer;text-shadow:0 1px 2px #000" onclick="event.stopPropagation();window.selectBagItem(${i})">⋯</span></div>`;
  });
  html += `</div>`;
  if (window.bagSel >= 0 && player.inv[window.bagSel]){
    const it = player.inv[window.bagSel];
    html += `<div class="forge-lines" style="margin-top:10px"><b class="${RARITIES[it.rarity].cls}">${it.name}</b><br>${itemLineHtml(it)}</div>
      <div class="forge-actions"><button class="mini-btn" onclick="equipItem(${window.bagSel})">Mặc Vào</button>
      <button class="mini-btn" onclick="sellItem(${window.bagSel})">Bán (+${itemSellPrice(it)}◈)</button>
      <button class="mini-btn" onclick="salvage(${window.bagSel});window.bagSel=-1">Phân Giải (+${1+it.rarity+Math.floor(it.plus/3)}✦)</button></div>`;
  }
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
  const gain = 1 + it.rarity + Math.floor(it.plus/3);
  player.mat += gain;
  player.inv.splice(i,1);
  addFloat(player.x, player.y-30, `Phân giải +${gain}✦`, '#9fd0ff', 12);
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
      for (const m of mobs){
        if (m.dead) continue;
        const dd = dist(player.x, player.y, m.x, m.y);
        if (dd < 125 + 8*_st + m.def.size){ // tiến hóa: quạt rộng hơn
          let da = Math.atan2(m.y-player.y, m.x-player.x) - player.face;
          while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
          if (Math.abs(da) < 1.0 + 0.08*_st) hurtMob(m, player.atk*def.mult*_tbMul*rnd(0.9,1.1), Math.random()<player.crit?'crit':'hit');
        }
      }
    } else if (type==='proj'){
      const t = nearestMob(420);
      const ang = t ? Math.atan2(t.y-player.y, t.x-player.x) : player.face;
      player.face = ang;
      const _svc = SECT_VFX[_sva];
      const _nP = (def.count || 1) + _st; // Multi-Shot (Sylvan Ranger) bắn 5 tên/loạt; các phái khác mặc định 1, +1 mỗi bậc tiến hóa
      for (let _pi = 0; _pi < _nP; _pi++){
        const _off = _nP > 1 ? (_pi - (_nP - 1) / 2) * 0.15 : 0;
        projectiles.push({ x:player.x, y:player.y, ang:ang + _off, speed:420, dmg:player.atk*def.mult*_tbMul, kind:'skill', life:1.0, color:sect.color, pierce:true, style:(_svc && _svc.proj) || undefined });
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
      for (const m of mobs){
        if (m.dead) continue;
        if (dist(player.x, player.y, m.x, m.y) < 140 + 10*_st + m.def.size)
          hurtMob(m, player.atk*def.mult*_tbMul*rnd(0.9,1.1), Math.random()<player.crit?'crit':'hit');
      }
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
  const _nameHtml = `${tt?`<span class="title-tag">【${tt.name}】</span> `:''}${player.name ? `<span class="char-name">${player.name}</span> · ` : ''}${player.ascended ? `<span style="color:#fff2b0">☁ Tán Tiên</span><span style="opacity:.55;font-size:10px"> · xuất thế ${sect.name}</span>` : sect.name} · Cấp ${player.level}${player.level>=MAX_LV?' (Tối đa)':''}${player.resetCount?` · <span style="color:#ffd76a" title="Tẩy Tủy Phong Huyệt — +${player.resetCount*2}% Công/Mạng vĩnh viễn">🔄${player.resetCount}</span>`:''}${player.toiac>0?` · <b>TỘI ÁC ${player.toiac}</b>`:''}`;
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
  el('hud-khi').textContent = `Instinct: ${Math.floor(player.khi || 0)}${player.poisonT>0 ? ' · ☠ TRÚNG ĐỘC' : ''}${player.gkBuffT>0 ? ` · ✦ ${player.gkBuffT.toFixed(1)}s` : ''}`;
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
  const chEl = el('hud-channel');
  if (chEl){
    if ((player.channelT || 0) > 0){
      chEl.style.display = ''; chEl.style.color = '#ffb15c';
      chEl.textContent = `☬ ${(findTranaiById(player.channelId) || {}).name || 'Hóa Thân'} · ${Math.ceil(player.channelT)}s`;
    } else if ((player.channelCd || 0) > 0){
      chEl.style.display = ''; chEl.style.color = '#8a8a8a';
      chEl.textContent = `☬ hồi ${Math.ceil(player.channelCd)}s`;
    } else if (channelFormsUnlocked().length){
      chEl.style.display = ''; chEl.style.color = '#7a86ad';
      chEl.textContent = '☬ Hóa Thân (P)';
    } else chEl.style.display = 'none';
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
  setSkillBtn('sk-jump', !!player.canJump, player.cd.jump, 0.01, 'Phiêu Vân Bộ — không cooldown');
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
function renderBaGua(){
  let html = `<h3>☰ Lò Rèn Hoàng Gia — Tông Sư Thợ Rèn</h3><button class="close-x" onclick="closePanels()">✕</button>`;
  html += `<div style="font-size:12.5px;color:#9aa8d4;margin-bottom:8px;line-height:1.6">"Lò này nung bằng <b style="color:#e8b04a">Tứ Hải Càn Khôn</b> — chỉ trang bị <b style="color:#e8b04a">+9</b> mới đủ tư cách bước vào <b style="color:#ff7a6a">Phá Thiên Kiếp</b>. Nhớ kỹ: <b style="color:#ff7a6a">thất bại là thần binh vỡ nát</b>, trừ khi có Thiên Mệnh Phù bảo mệnh."</div>`;
  html += `<div style="font-size:12px;color:#9aa8d4;line-height:1.7">◈ <b>${player.silver}</b> · ✦ Huyền Thiết <b style="color:#9fd0ff">${player.mat}</b> · ◆ Tu La <b style="color:#e84a6a">${player.gems.tuLa}</b> · ❖ Hỗn Nguyên <b style="color:#b08ae8">${player.gems.honNguyen}</b> · ☂ Phù <b style="color:#7ecbff">${player.charms}</b></div>`;
  const all = [];
  for (const s in player.equip) if (player.equip[s] && !player.equip[s].noForge && player.equip[s].plus >= 9 && player.equip[s].plus < 11) all.push({ it:player.equip[s], where:'equip', key:s });
  player.inv.forEach((it,i)=>{ if (!it.noForge && it.plus >= 9 && it.plus < 11) all.push({ it, where:'inv', key:i }); });
  if (!all.length){
    html += `<div style="padding:14px;font-size:12.5px;line-height:1.7;opacity:.75">Ngươi chưa có trang bị nào đạt <b style="color:#e8b04a">+9</b>.<br>Hãy tự rèn và đập ngọc đến +9 rồi quay lại đây.</div>`;
  } else {
    for (const e of all){
      const it = e.it;
      const target = it.plus + 1;
      const rule = forgeRule(target);
      const rate = Math.min(100, rule.rate + (player.forgeBonus||0));
      const costS = (20 + it.plus*15) * (it.tier || 1); // Drop v2.0: phí rèn theo giai
      const canPay = player.silver>=costS && player.mat>=rule.mat && player.gems.tuLa>=rule.tuLa && player.gems.honNguyen>=rule.hon;
      html += `<div class="bagua-item">
        <div class="bagua-item-info"><b class="${RARITIES[it.rarity].cls}">${it.name} +${it.plus}</b>
          <span style="opacity:.55;font-size:11px"> (${e.where==='equip'?'đang mặc':'túi'})</span><br>
          <span style="font-size:11px;opacity:.8">Phá Thiên Kiếp <b style="color:#e8b04a">+${target}</b> — tỉ lệ <b style="color:${rate>=50?'#7ecbff':'#ff9a6a'}">${rate}%</b> · ${costS}◈ + ${rule.mat}✦ + ${rule.tuLa}◆ + ${rule.hon}❖</span></div>
        <button class="mini-btn" ${canPay?'':'disabled'} onclick="doBaGua('${it.uid}')">☰ Đột Phá<br>+${target}</button></div>`;
    }
    html += `<label style="display:block;font-size:12px;margin:8px 0;color:#7ecbff;cursor:pointer">
      <input type="checkbox" ${forgeUseCharm?'checked':''} onchange="forgeUseCharm=this.checked" ${player.charms>0?'':'disabled'}>
      Dùng Thiên Mệnh Phù — thất bại KHÔNG bị vỡ trang bị (còn ${player.charms})</label>
      <div style="font-size:11px;opacity:.7;line-height:1.6">+10 thức tỉnh thuộc tính ẩn · +11 Khai Quang <b style="color:#9fd0ff">Thiên Lôi Cương Khí</b> (sét xanh bao quanh thân)</div>`;
  }
  // ── Lò Bảo Chứng: Linh Dực & đổi Cổ Thần (Track HT — GDD §13) ──
  const J2 = player.jewels || { honDon:0 };
  html += `<div class="stat-sec" style="border-color:rgba(126,203,255,.5)">◈ HỖN ĐỘN LÒ — ● Hỗn Độn Châu: <b style="color:#7ecbff">${J2.honDon}</b></div>`;
  const wing1 = player.equip.canh || player.inv.find(x=>x.slot==='canh');
  if (player.level >= 40){
    const fodder = [];
    for (const s3 in player.equip){ const t2 = player.equip[s3]; if (t2 && t2.perfect && t2.plus >= 4 && !t2.noForge) fodder.push(t2); }
    player.inv.forEach(t2=>{ if (t2.perfect && t2.plus >= 4 && !t2.noForge) fodder.push(t2); });
    const canW1 = J2.honDon >= 1 && fodder.length > 0 && player.gems.honNguyen >= 10 && player.silver >= 5000;
    html += `<div class="next-tier"><b style="color:#9fd0ff">Linh Dực Cấp 1</b> (LV40+) — Thiên Thần / Tiểu Quỷ ngẫu nhiên<br>
      <span style="font-size:11.5px;opacity:.8">Phí: 1 ● Hỗn Độn + 1 trang bị Hoàn Hảo +4 hiến tế (${fodder.length ? fodder[0].name+' +'+fodder[0].plus : 'chưa có'}) + 10❖ + 5000◈</span></div>
      <div class="forge-actions"><button class="mini-btn" ${canW1?'':'disabled'} onclick="craftWing(1)">Luyện Linh Dực</button></div>`;
  }
  if (player.level >= 80 && wing1 && !wing1.wing2){
    const canW2 = J2.honDon >= 1 && player.gems.honNguyen >= 20 && player.silver >= 10000;
    html += `<div class="next-tier"><b style="color:#d8baff">Linh Dực Cấp 2</b> (LV80+) — Phượng Dực / Hắc Ma Dực, thăng từ cánh đang có<br>
      <span style="font-size:11.5px;opacity:.8">Phí: 1 ● Hỗn Độn + cánh cấp 1 hiện tại + 20❖ + 10000◈</span></div>
      <div class="forge-actions"><button class="mini-btn" ${canW2?'':'disabled'} onclick="craftWing(2)">Thăng Linh Dực 2</button></div>`;
  }
  // Đổi Cổ Thần: 3 món trùng + 1 Hỗn Độn = 1 món TỰ CHỌN (con đường song song thay pity)
  const ancients = player.inv.filter(x=>x.ancient);
  html += `<div class="next-tier" style="border-color:rgba(58,200,138,.5)"><b style="color:#3ac88a">Đổi Cổ Thần — Tứ Tượng tự chọn</b><br>
    <span style="font-size:11.5px;opacity:.8">Hiến tế 3 món Cổ Thần trong túi + 1 ● Hỗn Độn Châu → nhận 1 món Cổ Thần theo ý muốn.</span></div>`;
  if (ancients.length){
    const selN = Object.keys(window._hdSel || {}).length;
    html += `<div style="font-size:11.5px;margin:4px 0;opacity:.85">Chọn 3 món hiến tế (${selN}/3):</div>`;
    ancients.forEach(a=>{
      const on = window._hdSel && window._hdSel[a.uid];
      html += `<div class="slot-row" style="${on?'border-color:#3ac88a;background:rgba(58,200,138,.12)':''}" onclick="hdToggle(${a.uid})">
        <span class="s-name"><span style="color:${ANCIENT_SETS[a.ancient].color}">◈ ${a.name}${a.plus?' +'+a.plus:''}</span></span></div>`;
    });
    const selCss = 'background:#2a2418;color:#e8ecff;border:1px solid #7a6a4a;border-radius:4px;padding:4px;font-size:12px';
    html += `<div class="forge-actions" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
      <select onchange="window._hdSet=this.value" style="${selCss}">` +
      Object.keys(ANCIENT_SETS).map(k=>`<option value="${k}" ${window._hdSet===k?'selected':''}>${ANCIENT_SETS[k].name}</option>`).join('') + `</select>
      <select onchange="window._hdSlot=this.value" style="${selCss}">` +
      ARMOR_SLOTS.map(sl=>{ const sd = SLOTS.find(x=>x.id===sl); return `<option value="${sl}" ${window._hdSlot===sl?'selected':''}>${sd ? sd.name : sl}</option>`; }).join('') + `</select></div>`;
    const canEx = J2.honDon >= 1 && selN === 3 && player.inv.length < 30;
    html += `<div class="forge-actions"><button class="mini-btn" ${canEx?'':'disabled'} onclick="hdExchange()">◈ Đổi Lấy Cổ Thần</button></div>`;
  } else {
    html += `<div style="font-size:11.5px;opacity:.6;padding:4px">Chưa có món Cổ Thần nào trong túi — săn Hung Thần lấy Bảo Hạp IV trở lên (tỉ lệ 5-8%, không pity).</div>`;
  }
  // ── Lò Hỗn Loạn (MU Online Chaos Machine): 3 món CÙNG PHẨM + Hỗn Nguyên Thạch → 1 món phẩm
  // cao hơn — CÓ TỈ LỆ THẤT BẠI THẬT (mất sạch 3 món nếu trật), khác Lò Bảo Chứng ở trên (đổi chắc
  // ăn, không rủi ro). Đây là chỗ đặt cược thật — tận dụng đồ dư farm được để thử vận lên phẩm.
  html += `<div class="stat-sec" style="border-color:rgba(255,90,74,.5)">◑ LÒ HỖN LOẠN — 3 món cùng phẩm + Hỗn Nguyên Thạch → 1 món phẩm cao hơn (CÓ THỂ MẤT SẠCH)</div>`;
  // Chaos Goblin — đúng hình tượng MU Online: gã yêu tinh lùn đứng trông/quay máy Chaos Machine.
  html += `<div style="display:flex;gap:10px;align-items:center;margin:2px 0 8px;padding:7px 10px;border:1px solid rgba(255,90,74,.28);border-radius:6px;background:rgba(255,90,74,.06)">
    <img src="assets/npcs/chaosgoblin.png" alt="" style="height:52px;flex:none" onerror="this.style.display='none'">
    <div style="font-size:11.5px;color:#c8b8a8;font-style:italic;line-height:1.5">"Ba món, ném vào đây! Máy của ta nuốt hết — nhả ra thứ tốt hơn… hoặc chẳng nhả gì cả. Kèkè!"
      <div style="font-style:normal;opacity:.62;margin-top:2px">— Yêu Tinh Hỗn Loạn, kẻ trông máy</div></div>
  </div>`;
  {
    const chaosSelUids = Object.keys(window._chaosSel || {}).map(Number);
    const chaosItems = player.inv.filter(x => !x.noForge && x.rarity < 4);
    if (!chaosItems.length){
      html += `<div style="font-size:11.5px;opacity:.6;padding:4px">Túi chưa có món nào đủ điều kiện (dưới Chí Tôn, không phải đồ đặc biệt).</div>`;
    } else {
      const selR = chaosSelUids.length ? (player.inv.find(x=>x.uid===chaosSelUids[0]) || {}).rarity : null;
      html += `<div style="max-height:150px;overflow-y:auto;margin-bottom:6px">`;
      chaosItems.forEach(it=>{
        const on = window._chaosSel && window._chaosSel[it.uid];
        const dim = selR != null && it.rarity !== selR && !on;
        html += `<div class="slot-row" style="${on?'border-color:#ff5a4a;background:rgba(255,90,74,.12)':''}${dim?'opacity:.35':''}" onclick="chaosToggle(${it.uid})">
          <span class="s-name"><span class="${RARITIES[it.rarity].cls}">${it.name}${it.plus?' +'+it.plus:''}</span></span></div>`;
      });
      html += `</div>`;
      if (chaosSelUids.length === 3 && selR != null){
        const honCost = CHAOS_HON_COST[selR], silverCost = CHAOS_SILVER_COST[selR];
        const rate = Math.min(100, CHAOS_RATE[selR] + (player.forgeBonus||0));
        const canGo = player.gems.honNguyen >= honCost && player.silver >= silverCost && player.inv.length <= 30;
        html += `<div style="font-size:12px;line-height:1.6">Ghép ${RARITIES[selR].name} → <b style="color:${RARITIES[selR+1].color}">${RARITIES[selR+1].name}</b> — tỉ lệ <b style="color:${rate>=50?'#7ecbff':'#ff9a6a'}">${rate}%</b><br>
          Phí: ${silverCost}◈ + ${honCost}❖ Hỗn Nguyên — <b style="color:#ff5a4a">thất bại mất sạch 3 món + phí</b></div>
          <div class="forge-actions"><button class="mini-btn" style="border-color:#ff5a4a;color:#ff9a8a" ${canGo?'':'disabled'} onclick="chaosCombine()">◑ Ném Vào Lò Hỗn Loạn</button></div>`;
      } else {
        html += `<div style="font-size:11.5px;opacity:.6;padding:2px">Chọn đúng 3 món CÙNG phẩm ở trên (${chaosSelUids.length}/3).</div>`;
      }
    }
  }
  html += `<div id="bagua-msg" style="min-height:18px;font-size:12.5px;margin-top:6px"></div>`;
  el('panel-quest').innerHTML = html;
  closePanels(); el('panel-quest').classList.remove('hidden');
}
window.doBaGua = function(uid){
  let entry = null;
  for (const s in player.equip) if (player.equip[s] && player.equip[s].uid === uid) entry = { it:player.equip[s], where:'equip', key:s };
  if (!entry) player.inv.forEach((it,i)=>{ if (it.uid === uid) entry = { it, where:'inv', key:i }; });
  if (!entry) return;
  const it = entry.it;
  if (it.plus < 9 || it.plus >= 11) return;
  const target = it.plus + 1;
  const rule = forgeRule(target);
  const rate = Math.min(100, rule.rate + (player.forgeBonus||0));
  const costS = (20 + it.plus*15) * (it.tier || 1); // Drop v2.0: phí rèn theo giai
  if (player.silver < costS || player.mat < rule.mat || player.gems.tuLa < rule.tuLa || player.gems.honNguyen < rule.hon) return;
  const useCharm = forgeUseCharm && player.charms > 0;
  player.silver -= costS; player.mat -= rule.mat;
  player.gems.tuLa -= rule.tuLa; player.gems.honNguyen -= rule.hon;
  const msg = document.getElementById('bagua-msg');
  if (Math.random()*100 < rate){
    it.plus++;
    AudioSys.sfx('forge_ok', 0.9);
    if (msg){ msg.textContent = `✔ Phá Thiên Kiếp thành công! ${it.name} +${it.plus}`; msg.style.color = '#8fd18f'; }
    addFloat(player.x, player.y-40, `☰ PHÁ THIÊN KIẾP +${it.plus}!`, '#e8b04a', 15);
    addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:'#e8b04a', big:true });
    addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#9fd0ff' });
    if (it.plus === 10) addFloat(player.x, player.y-58, `☆ Thức tỉnh: ${it.awakened.name}`, '#f39c3d', 13);
    if (it.plus === 11){
      player.forged11 = true;
      addFloat(player.x, player.y-76, '☀ KHAI QUANG +11 — Thiên Lôi Cương Khí!', '#ffd76a', 16);
      addEffect({ type:'ring', x:player.x, y:player.y, r:150, color:'#7fd0ff', big:true });
      addEffect({ type:'ring', x:player.x, y:player.y, r:110, color:'#ffd76a', big:true });
    }
    checkTitles(); updateHud();
  } else if (useCharm){
    player.charms--;
    if (msg){ msg.textContent = `☂ Thiên Mệnh Phù đã bảo hộ — ${it.name} giữ nguyên +${it.plus}`; msg.style.color = '#7ecbff'; }
    addFloat(player.x, player.y-40, '☂ Thiên Mệnh Phù bảo hộ!', '#7ecbff', 13);
  } else {
    // GDD: thất bại → HỦY DIỆT trang bị
    AudioSys.sfx('forge_fail', 0.9);
    if (entry.where === 'equip') player.equip[entry.key] = null;
    else player.inv.splice(entry.key, 1);
    if (msg){ msg.textContent = `✘ Hỏa hầu chưa đạt — ${it.name} đã VỠ NÁT!`; msg.style.color = '#ff5a4a'; }
    addFloat(player.x, player.y-40, '✘ HỎA HẦU CHƯA ĐẠT — THẦN BINH VỠ NÁT!', '#ff5a4a', 15);
    addFloat(player.x, player.y-60, `${it.name} +${it.plus} đã hóa thành tro bụi...`, '#ff7a6a', 12);
    addEffect({ type:'ring', x:player.x, y:player.y, r:90, color:'#ff5a4a', big:true });
    updateHud();
  }
  saveGame();
  renderBaGua();
};

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
  { key:'quest', txt:'Làm theo nhiệm vụ ở <b>góc phải màn hình</b> · <b>C</b> nhân vật · <b>K</b> kỹ năng · <b>B</b> túi đồ' },
];
function updateTut(){
  const box = el('tut-hint');
  if (!box) return;
  const cur = (!player || player.tutStep == null || player.tutStep < 0 || player.tutStep >= TUT_STEPS.length) ? -99 : player.tutStep;
  // ẩn hướng dẫn khi đang mở bảng — tránh đè nội dung
  const anyPanel = ['panel-char','panel-inv','panel-bag','panel-skill','panel-map','panel-quest','panel-settings','panel-qlog'].some(id => { const e2 = document.getElementById(id); return e2 && !e2.classList.contains('hidden'); });
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
    <div class="set-row"><span>📳 Rung màn hình <i>(mặc định tắt)</i></span>${tog('shake')}</div>
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
// sẵn trong game (Thần Binh, Luyện Đan, Lò Hỗn Loạn, Linh Thú, Hóa Thân, Động Phủ...) — những hệ
// này trước giờ chỉ có 1 dòng toast thoáng qua lúc lên cấp, rất dễ bị bỏ lỡ. Thay bằng 2 nhóm:
// (1) NV "học hệ thống" — mỗi cái dạy đúng 1 cơ chế, rải theo đúng cấp hệ đó mở khoá, dùng
//     sideOnEvent(<type mới>) gọi từ chính hàm nâng cấp/chế tạo của hệ đó (xem các chỗ gọi
//     sideOnEvent bên dưới trong game.js — upgradeThanBinh/craftPill/chaosCombine/tryTame/
//     activateChannelForm/harvestSeed); (2) NV "cầu nối cốt truyện" (type:'talk', giữ nguyên từ bản
//     cũ) — không nhàm vì không phải đánh quái lặp lại, chỉ là mắt xích đưa người chơi qua vùng mới.
const SIDE_QUESTS = [
  // ── Học hệ thống — mỗi NV dạy đúng 1 cơ chế nâng cấp nhân vật ──
  { id:'s_sys1', npc:'duocsu',    map:'daohoa',     reqLv:9,   reqMain:0,  name:'Học Nghề Luyện Đan',     desc:'Dược Sư sẵn lòng dạy ngươi luyện đan từ Thảo Dược hái được. Mở Nhân Vật → Luyện Đan, chế thử 1 viên bất kỳ.', type:'brew', need:1, rew:{xp:600, silver:150, mat:2} },
  { id:'s_sys2', npc:'monkhach',  map:'ngoai',      reqLv:11,  reqMain:10, name:'Trại Ngựa Ngoại Ô',      desc:'Bắt 3 Tuấn Mã Hoang ngoài đồng cỏ Outskirts (rượt đến kiệt sức rồi bấm E) để có thú cưỡi đầu tiên.', type:'catch', need:3, rew:{xp:1800, silver:300, mat:2, thau:1} },
  { id:'s_sys3', npc:'quachtinh', map:'tuongduong', reqLv:12,  reqMain:10, name:'Vũ Khí Của Riêng Ngươi', desc:'Mỗi lớp đều có một Thần Binh đồng hành — xem ở Nhân Vật → Thông Tin. Hãy nâng nó lên tầng kế tiếp bằng Nội Đan và Tinh Thạch.', type:'thanbinh', need:1, rew:{xp:2000, silver:300, mat:3} },
  { id:'s_sys4', npc:'monkhach',  map:'ngoai',      reqLv:17,  reqMain:12, name:'Thu Phục Linh Thú',      desc:'Cần Phong Linh Phù (mua ở Vũ Khí Phường). Đánh một tinh anh xuống dưới 40% máu rồi thu phục nó làm Linh Thú đồng hành.', type:'tame', need:1, rew:{xp:2500, silver:350, mat:2} },
  { id:'s_sys5', npc:'quachtinh', map:'tuongduong', reqLv:19,  reqMain:12, name:'Lò Hỗn Loạn',            desc:'Dư ít nhất 3 món cùng phẩm? Mang đến Lò Rèn Hoàng Gia, ném vào Lò Hỗn Loạn thử vận may lên phẩm cao hơn.', type:'chaos', need:1, rew:{xp:3500, silver:450, mat:3} },
  { id:'s_sys6', npc:'daosi',     map:'chungnam',   reqLv:23,  reqMain:15, name:'Mượn Hình Tướng Quân',      desc:'Hàng phục xong một Cổng Vực, ngươi có thể mượn hình dạng nó — bấm P để Hóa Thân Tướng Quân.', type:'channel', need:1, rew:{xp:6000, silver:600, mat:3} },
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
  // Rời map giữa lượt Đấu Trường Tế Thần/Pháo Đài Máu: quái sẽ bị buildWorld() xoá sạch ngay sau đây nhưng
  // 2 biến trạng thái vẫn còn tham chiếu tới boss cũ nếu không dọn — coi như bỏ cuộc, mất vé.
  if (DEVIL && !DEVIL.cleared && !DEVIL.failed){ DEVIL.failed = true; DEVIL._endT = 0; addFloat(player.x, player.y-40, 'Rời khỏi Đấu Trường Tế Thần — Thiệp Mời đã mất.', '#ff8a5a', 13); }
  if (BLOOD && !BLOOD.cleared && !BLOOD.failed){ BLOOD.failed = true; BLOOD._endT = 0; addFloat(player.x, player.y-40, 'Rời khỏi Pháo Đài Máu — Thiệp Mời đã mất.', '#ff8a5a', 13); }
  // QA rà soát: rời map giữa lượt Trận Địa Phòng Thủ trước đây không dọn TOWER — quái towerMob bị buildWorld()
  // xoá nhưng biến TOWER sống sót, khiến updateTower() tưởng đã dọn sạch đợt và tự mở bảng chọn thẻ
  // ở map mới (kể cả Lunaris City, nơi lẽ ra cấm giao chiến). Dọn y hệt cách DEVIL/BLOOD đã làm ở trên.
  if (TOWER && mapId !== 'towerarena'){ // mapId === 'towerarena' nghĩa là đang VÀO trận (startTowerRun tự gọi travelTo), không phải rời bỏ
    const _twWave = TOWER.wave;
    if (_twWave > (player.towerBest || 0)) player.towerBest = _twWave;
    mobs.forEach(m => { if (m.towerMob && !m.dead) m.dead = true; });
    TOWER = null;
    addFloat(player.x, player.y-40, `Rời khỏi Trận Địa Phòng Thủ — kỷ lục Đợt ${_twWave} đã lưu.`, '#c07fe0', 13);
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
    if (id === 'towerarena' && !window.TEST_MODE) continue; // đấu trường riêng — chỉ vào qua nút "Bắt Đầu" ở tab Trận Địa Phòng Thủ
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
// Hái Thảo Dược (phím J, ưu tiên trước Phiêu Vân Bộ nếu đang đứng gần bụi thuốc còn hái được) —
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
  player.herbCount = (player.herbCount || 0) + 1; // Luyện Đan — thảo dược hái được luôn vào túi, kể cả khi đang giao nhiệm vụ
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
    addFloat(target.x, target.y-20, '+25 HP · +1 🌿', '#8fd18f', 11);
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
  for (const mp in BOSS_DEFS){                 // hình dùng cho Hóa Thân Tướng Quân
    const tv = BOSS_DEFS[mp].tranai;
    if (!tv || CHANNEL_IMGS[tv.id]) continue;
    const md = MOBS[tv.img];
    if (md && md.skel) continue;               // boss khung xương: dựng lại, không cần ảnh
    const im = new Image(); im.src = 'assets/mobs/' + tv.img + '.png'; CHANNEL_IMGS[tv.id] = im;
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

// ═══════════ VẠN KIẾM TU LA TRẬN — Roguelike Tower (P1 roadmap: draft-based endless waves) ═══════════
// Đợt quái vô tận quanh người chơi; hạ sạch mỗi đợt → chọn 1/3 thẻ tiến hóa tạm thời (dồn trong lượt
// chơi này) hoặc dừng nhận thưởng. Chết hoặc tự dừng → kết thúc lượt, buff mất hết, chỉ giữ lại kỷ lục
// đợt cao nhất từng trụ được. Thẻ bài dùng thật tên + icon từ 34 võ học phổ + 30 dung hợp đã có (không
// mô phỏng đúng kỹ năng gốc — chỉ mượn hình ảnh/tên để đa dạng, hiệu ứng là buff số liệu đơn giản).
let TOWER = null; // { wave, buffs:{dmg,cd,hp,qi,crit,leech}, drafting, options, coreHp, coreMaxHp }
const TOWER_MOB_POOL = ['boar','wolf','bandit','assassin','hautu','caodo','xanu','bandao','mocnhan',
  'huyetbat','docyeu','satthuhy','thamtu','cungthu','cuongbinh','daokhach']; // chỉ quái đã có Axie art thật
// Bố cục đấu trường (map towerarena) — xem MAP_OBSTACLES.towerarena: hình chữ thập nối 4 cổng
// mép map với Lõi Trụ giữa sân. Quái spawn ở 1 cổng ngẫu nhiên rồi đi thẳng theo lane đó tới lõi.
const TOWER_CORE = { x:1300, y:950, r:55 };
const TOWER_GATES = {
  bac:  { x:1300, y:70 },
  nam:  { x:1300, y:1830 },
  tay:  { x:70,   y:950 },
  dong: { x:2530, y:950 },
};
const TOWER_CARD_TYPES = [
  { k:'dmg',   name:'Cường Kích',  desc:'sát thương chiêu & đòn thường',  v:0.07 },
  { k:'cd',    name:'Tốc Chiến',   desc:'hồi chiêu mọi kỹ năng',          v:0.05 },
  { k:'hp',    name:'Kiên Cường',  desc:'sinh lực tối đa',                v:0.09 },
  { k:'qi',    name:'Uyên Bác',    desc:'Qi tối đa',                 v:0.09 },
  { k:'crit',  name:'Yếu Điểm',    desc:'tỉ lệ bạo kích',                 v:0.025 },
  { k:'leech', name:'Hấp Tinh',    desc:'hút máu',                        v:0.02 },
];
function towerCardPool(){
  const out = [];
  for (const k in VOHOC_DEFS) if (VOHOC_DEFS[k].icon) out.push({ name: VOHOC_DEFS[k].name, icon: VOHOC_DEFS[k].icon });
  for (const k in FUSION_DEFS) if (FUSION_DEFS[k].icon) out.push({ name: FUSION_DEFS[k].name, icon: FUSION_DEFS[k].icon });
  return out;
}
window.startTowerRun = function(){
  if (!player || dead) return;
  if (TOWER){ addFloat(player.x, player.y-40, 'Đang trong Trận Địa Phòng Thủ rồi!', '#8a8a8a', 12); return; }
  if (DGN){ addFloat(player.x, player.y-40, 'Không thể mở Trận Địa Phòng Thủ trong phó bản!', '#8a8a8a', 12); return; }
  if (DEVIL || BLOOD){ addFloat(player.x, player.y-40, 'Đang trong một trận đấu khác rồi!', '#8a8a8a', 12); return; }
  const coreMaxHp = 1000;
  TOWER = { wave: 0, buffs: { dmg:0, cd:0, hp:0, qi:0, crit:0, leech:0 }, drafting:false, options:[], coreHp: coreMaxHp, coreMaxHp };
  travelTo('towerarena');
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
  closePanels();
  zoneBanner = { text:'🌀 VẠN KIẾM TU LA TRẬN', sub:'Chặn quái ở 1 trong 4 lane — để chúng tràn vào Lõi Trụ là mất máu lõi. Hạ sạch mỗi đợt để chọn tiến hóa tạm thời!', color:'#c07fe0', t:5 };
  AudioSys.sfx('quest', 0.8);
  towerNextWave();
};
// Spawn quái ở 1 trong 4 cổng, gán đường đi thẳng (lane) tới Lõi Trụ — xem nhánh m.laned trong
// vòng lặp cập nhật quái (update()) và towerCoreHit() khi quái đi hết lane.
function spawnTowerWave(n, scale){
  const gateKeys = Object.keys(TOWER_GATES);
  for (let i = 0; i < n; i++){
    const type = TOWER_MOB_POOL[Math.floor(Math.random()*TOWER_MOB_POOL.length)];
    const gate = TOWER_GATES[gateKeys[Math.floor(Math.random()*gateKeys.length)]];
    const m = spawnMob(type, { x: gate.x, y: gate.y, r: 40, count: n }, null);
    m.zone = null; m.towerMob = true;
    m.laned = true; m.wpPath = [gate, TOWER_CORE]; m.wpIdx = 0;
    m.def = { ...m.def, hp: Math.round(m.def.hp*scale), atk: Math.round(m.def.atk*scale) };
    m.hp = m.def.hp; m.maxHp = m.def.hp;
  }
}
function towerNextWave(){
  if (!TOWER) return;
  TOWER.wave++;
  const n = Math.min(3 + Math.floor(TOWER.wave/2), 12);
  spawnTowerWave(n, 1 + TOWER.wave*0.14);
  if (player) addFloat(player.x, player.y - 60, `Đợt ${TOWER.wave} — ${n} địch từ 4 cổng!`, '#c07fe0', 15);
}
// Quái đi hết lane (chạm Lõi Trụ) mà chưa bị hạ — lõi mất máu, quái biến mất (không tính hạ gục,
// không thưởng): đây là hậu quả của việc để lọt quái, khác với việc người chơi chủ động đánh bại nó.
function towerCoreHit(m){
  if (!TOWER) return;
  const dmg = Math.round(25 + (m.def.lv || 1) * 1.8);
  TOWER.coreHp = Math.max(0, TOWER.coreHp - dmg);
  addFloat(TOWER_CORE.x, TOWER_CORE.y - 50, `💥 Lõi Trụ -${dmg}!`, '#ff5a4a', 14);
  addEffect({ type:'ring', x: TOWER_CORE.x, y: TOWER_CORE.y, r:70, color:'#ff5a4a', big:true });
  shakeT = Math.max(shakeT, 0.25); shakeMag = Math.max(shakeMag, 5);
  AudioSys.sfx('hurt', 0.5);
  m.dead = true;
}
function updateTower(){
  if (!TOWER || TOWER.drafting) return;
  if (TOWER.coreHp <= 0){ endTowerRun('coredown'); return; }
  if (mobs.some(m => m.towerMob && !m.dead)) return; // còn quái Trận Địa Phòng Thủ sống → chờ
  towerOfferDraft();
}
function towerOfferDraft(){
  TOWER.drafting = true;
  const pool = towerCardPool();
  const opts = [];
  for (let i = 0; i < 3; i++){
    const tech = pool[Math.floor(Math.random()*pool.length)];
    const type = TOWER_CARD_TYPES[Math.floor(Math.random()*TOWER_CARD_TYPES.length)];
    opts.push({ techName: tech.name, icon: tech.icon, k: type.k, typeName: type.name, typeDesc: type.desc, v: type.v });
  }
  TOWER.options = opts;
  showTowerDraft();
}
function showTowerDraft(){
  const opts = TOWER.options;
  document.getElementById('overlay-inner').innerHTML = `
    <h2 style="letter-spacing:2px;color:#c07fe0">🌀 Đợt ${TOWER.wave} Hoàn Thành!</h2>
    <p style="margin-bottom:10px">Chọn một tiến hóa tạm thời cho lượt chơi này (dồn với các thẻ trước):</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">
      ${opts.map((o, i) => `
        <button class="choice-card" style="max-width:150px;font-size:12px;line-height:1.5;text-align:center;padding:12px 8px" onclick="window.pickTowerCard(${i})">
          <img src="${o.icon}" style="width:44px;height:44px;object-fit:contain;display:block;margin:0 auto 6px"><br>
          <b style="font-size:12.5px;color:#e4ebff">${o.techName}</b><br>
          <span style="color:#7ecbff">+${Math.round(o.v*100)}% ${o.typeDesc}</span>
        </button>`).join('')}
    </div>
    <button class="mini-btn" style="margin-left:0;padding:8px 20px;font-size:13px" onclick="window.stopTowerRun()">Dừng Lại — Nhận Thưởng (Đợt ${TOWER.wave})</button>`;
  document.getElementById('overlay').classList.remove('hidden');
}
window.pickTowerCard = function(idx){
  if (!TOWER || !TOWER.drafting) return;
  const o = TOWER.options[idx]; if (!o) return;
  TOWER.buffs[o.k] = (TOWER.buffs[o.k] || 0) + o.v;
  TOWER.drafting = false;
  document.getElementById('overlay').classList.add('hidden');
  calcDerived();
  player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp*0.15)); // hồi 15% máu mỗi đợt qua
  addFloat(player.x, player.y-58, `⚡ ${o.techName} — +${Math.round(o.v*100)}% ${o.typeDesc}!`, '#c07fe0', 13);
  AudioSys.sfx('levelup', 0.6);
  addEffect({ type:'ring', x:player.x, y:player.y, r:80, color:'#c07fe0' });
  towerNextWave();
};
window.stopTowerRun = function(){ if (TOWER) endTowerRun('stop'); };
function endTowerRun(reason){
  if (!TOWER) return;
  const wave = TOWER.wave;
  const isBest = wave > (player.towerBest || 0);
  if (isBest) player.towerBest = wave;
  mobs.forEach(m => { if (m.towerMob && !m.dead) m.dead = true; }); // dọn sạch quái Trận Địa Phòng Thủ còn sót
  TOWER = null;
  calcDerived();
  const ov = document.getElementById('overlay');
  document.getElementById('overlay-inner').innerHTML = `
    <h2 style="color:#c07fe0">Trận Địa Phòng Thủ — Kết Thúc</h2>
    <p>Ngươi trụ được tới <b style="color:#ffb15c">Đợt ${wave}</b>.${isBest ? '<br><span style="color:#ffd76a">★ KỶ LỤC MỚI!</span>' : player.towerBest ? `<br>Kỷ lục cá nhân: <b>Đợt ${player.towerBest}</b>` : ''}${reason === 'death' ? '<br><span style="color:#e8b060;font-size:12.5px">Ngươi đã gục ngã giữa trận — hồi sinh với đầy đủ sinh lực.</span>' : ''}${reason === 'coredown' ? '<br><span style="color:#ff5a4a;font-size:12.5px">Lõi Trụ đã sụp đổ — quái tràn qua cả 4 lane!</span>' : ''}</p>
    <button class="big-btn" onclick="window.exitTowerOverlay()">Rời Trận</button>`;
  ov.classList.remove('hidden');
  saveGame();
}
window.exitTowerOverlay = function(){
  document.getElementById('overlay').classList.add('hidden');
  if (dead) respawn(); else { player.hp = player.maxHp; player.qi = player.maxQi; travelTo('ngoai'); }
};
function drawTowerHUD(){
  if (!TOWER || !player) return;
  const label = TOWER.drafting ? 'Chọn tiến hóa để tiếp tục…' : `🌀 Đợt ${TOWER.wave} — còn ${mobs.filter(m=>m.towerMob && !m.dead).length} địch`;
  drawArenaHUD({ label, labelColor:'#c07fe0', activeBoss:{ hp:TOWER.coreHp, maxHp:TOWER.coreMaxHp }, barColor:'#ff5a4a' });
}
function drawTowerArena(){
  if (!TOWER) return;
  ctx.save();
  // Lõi Trụ
  ctx.beginPath(); ctx.arc(TOWER_CORE.x, TOWER_CORE.y, 46, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(192,127,224,0.28)'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#c07fe0'; ctx.stroke();
  ctx.fillStyle = '#e8d0ff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('LÕI TRẬN', TOWER_CORE.x, TOWER_CORE.y - 58);
  // 4 lane từ cổng tới lõi
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = 'rgba(192,127,224,0.35)'; ctx.lineWidth = 3;
  for (const k of Object.keys(TOWER_GATES)){
    const g = TOWER_GATES[k];
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(TOWER_CORE.x, TOWER_CORE.y); ctx.stroke();
  }
  ctx.setLineDash([]);
  // 4 cổng
  for (const k of Object.keys(TOWER_GATES)){
    const g = TOWER_GATES[k];
    ctx.beginPath(); ctx.arc(g.x, g.y, 26, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(120,80,160,0.4)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#8a5ab0'; ctx.stroke();
  }
  ctx.restore();
}

// ═══════════ ĐẤU TRƯỜNG TẾ THẦN & PHÁO ĐÀI MÁU — 2 phó bản có đồng hồ (học theo cấu trúc event hẹn giờ của MMORPG cổ điển):
// quái dồn ngay tại chỗ (không cần map riêng, giống Trận Địa Phòng Thủ), có đồng hồ đếm ngược, vé vào tốn
// bạc và mất luôn nếu thất bại. Boss cuối tái dùng hệ Boss Săn (moveset AoE báo trước) theo cấp
// người chơi thay vì cấp phó bản cố định, để farm được ở bất kỳ giai đoạn nào của game. ═══════════
const ARENA_BOSS_TIERS = [ // dùng lại 7 Boss Săn đã cân bằng theo cấp, chọn con phù hợp cấp hiện tại
  { id:'boss_cotma1',    boxTier:1 }, { id:'boss_cotma2',    boxTier:1 },
  { id:'boss_hacnu1',    boxTier:2 }, { id:'boss_hacnu2',    boxTier:2 },
  { id:'boss_hoangkim1', boxTier:3 }, { id:'boss_hoangkim2', boxTier:4 },
  { id:'boss_amthan',    boxTier:5 },
];
function pickArenaBoss(lv){
  let pick = ARENA_BOSS_TIERS[0];
  for (const t of ARENA_BOSS_TIERS){ if (lv >= MOBS[t.id].lv) pick = t; }
  return pick;
}
function spawnArenaBoss(bossId, x, y){
  const b = spawnMob(bossId, { x, y, r:40, count:1 }, null);
  b.zone = null;
  // Não moveset Boss Săn (telegraph AoE, tự né bằng J) cần các field này — spawnMob() không tự khởi
  // tạo, chỉ spawnZoneBoss()/spawnHuntBoss() mới làm; thiếu sẽ NaN, chiêu không bao giờ tung ra được.
  b.moveT = 4; b.moveIdx = 0; b.tele = null; b.punishT = 0; b.introduced = false;
  return b;
}
function rollArenaBox(tier, bossLv){
  const srcK = 'box' + tier;
  const nItems = Math.min(3, tier);
  const gained = [];
  for (let i = 0; i < nItems; i++){
    const it = genItem(bossLv, 0, srcK);
    if (player.autoSell && it.rarity <= 0){
      const v = 20 + it.rarity*30 + (it.tier||1)*15;
      player.silver += v; gained.push(`${it.name}(bán +${v}◈)`);
    } else if (player.inv.length < 30){
      player.inv.push(it); gained.push(it.name);
      if (it.rarity >= 2) addEffect({ type:'spark', x:player.x, y:player.y-12, r:32 + it.rarity*8, color:RARITIES[it.rarity].color });
      tryAutoEquip(it);
    } else gained.push(`${it.name}(túi đầy, mất)`);
  }
  return gained;
}
// QA rà soát: Tower/Devil/Blood từng tự tay lặp lại y hệt đoạn spawn-quái-từ-pool-rồi-scale-hp/atk
// này 3 lần với hằng số trôi dạt ngẫu nhiên (r:280 vs 260, formula 0.14/0.1/0.08 tự chọn không theo
// quy tắc chung) — gộp lại đây để lần cân bằng sau không còn sửa 1 nơi quên 2 nơi kia.
function spawnArenaWave(n, scale, flagKey, r){
  for (let i = 0; i < n; i++){
    const type = TOWER_MOB_POOL[Math.floor(Math.random()*TOWER_MOB_POOL.length)];
    const m = spawnMob(type, { x: player.x, y: player.y, r: r || 260, count: n }, null);
    m.zone = null; m[flagKey] = true;
    m.def = { ...m.def, hp: Math.round(m.def.hp*scale), atk: Math.round(m.def.atk*scale) };
    m.hp = m.def.hp; m.maxHp = m.def.hp;
  }
}
// Cùng lý do: 4 chế độ (Tower/Devil/Blood/Dungeon) vẽ HUD y hệt nhau — nhãn ở giữa trên cùng, đồng
// hồ đếm ngược tuỳ chọn ngay dưới, thanh máu boss tuỳ chọn dưới nữa. Chỉ label/màu/boss khác nhau.
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

// ---- Đấu Trường Tế Thần: 6 đợt quái dồn dập, đợt 7 là Quỷ Vương — hạ hết trong 10 phút để mở Rương ----
let DEVIL = null; // { wave, timeLeft, pick, bossRef, cleared, failed, _endT }
const DEVIL_TIME = 600;
const DEVIL_WAVES = 6;
window.startDevilSquare = function(){
  if (!player || dead) return;
  if (TOWER || DGN || DEVIL || BLOOD){ addFloat(player.x, player.y-40, 'Đang trong một trận đấu khác rồi!', '#8a8a8a', 12); return; }
  if (curMap === 'tuongduong'){ addFloat(player.x, player.y-40, 'Hãy ra khỏi Lunaris City trước — nơi này cấm giao chiến!', '#8a8a8a', 12); return; }
  const cost = 200 + player.level*12;
  if (player.silver < cost){ addFloat(player.x, player.y-40, `Cần ${cost} bạc để mua Thiệp Mời Đấu Trường Tế Thần!`, '#8a8a8a', 12); return; }
  player.silver -= cost;
  DEVIL = { wave:0, timeLeft: DEVIL_TIME, pick: pickArenaBoss(player.level), bossRef:null, cleared:false, failed:false, _endT:0 };
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
  closePanels();
  zoneBanner = { text:'👹 ĐẤU TRƯỜNG TẾ THẦN', sub:'6 đợt quái dồn dập, đợt 7 là Quỷ Vương — hạ hết trong 10 phút để mở Rương!', color:'#ff8a5a', t:4 };
  AudioSys.sfx('quest', 0.8);
  devilNextWave();
};
function devilNextWave(){
  if (!DEVIL) return;
  DEVIL.wave++;
  if (DEVIL.wave > DEVIL_WAVES){
    const def = MOBS[DEVIL.pick.id];
    DEVIL.bossRef = spawnArenaBoss(DEVIL.pick.id, player.x, player.y-120);
    DEVIL.bossRef.devilMob = true; // để quét dọn đúng nếu hết giờ ngay giữa lúc đang đấu Quỷ Vương
    if (player.auto){ player.auto = false; updateAutoBtn(); addFloat(player.x, player.y-70, 'Quỷ Vương cần tự tay chiến — AUTO đã tắt!', '#ff9a5a', 13); }
    shakeT = Math.max(shakeT, 0.5); shakeMag = Math.max(shakeMag, 7);
    addEffect({ type:'ring', x:player.x, y:player.y-120, r:100, color:'#ff5a3a', big:true });
    addFloat(player.x, player.y-70, '👹 QUỶ VƯƠNG XUẤT HIỆN: ' + def.name + '!', '#ff5a3a', 19);
    AudioSys.sfx('crit', 0.7);
    return;
  }
  const n = Math.min(4 + DEVIL.wave, 10);
  spawnArenaWave(n, 1 + DEVIL.wave*0.1, 'devilMob');
  addFloat(player.x, player.y-60, `Đợt ${DEVIL.wave}/${DEVIL_WAVES} — ${n} địch!`, '#ff8a5a', 15);
}
function updateDevil(dt){
  if (!DEVIL) return;
  if (DEVIL.cleared || DEVIL.failed){
    DEVIL._endT -= dt;
    if (DEVIL._endT <= 0) DEVIL = null; // dọn HUD sau vài giây, không cần cổng thoát riêng
    return;
  }
  DEVIL.timeLeft -= dt;
  if (DEVIL.timeLeft <= 0){
    DEVIL.timeLeft = 0; DEVIL.failed = true; DEVIL._endT = 3;
    mobs.forEach(m => { if (m.devilMob && !m.dead) m.dead = true; });
    zoneBanner = { text:'⏱ TẾ THẦN THẤT BẠI', sub:'Không hạ sạch kịp giờ — Thiệp Mời đã mất, thử lại sau.', color:'#ff5a4a', t:5 };
    addFloat(player.x, player.y-80, 'Hết giờ! Đấu Trường Tế Thần thất bại.', '#ff5a4a', 16);
    AudioSys.sfx('hurt', 0.7);
    return;
  }
  if (DEVIL.wave <= DEVIL_WAVES){
    if (mobs.some(m => m.devilMob && !m.dead)) return;
    devilNextWave();
    return;
  }
  if (DEVIL.bossRef && !DEVIL.bossRef.dead) return;
  DEVIL.cleared = true; DEVIL._endT = 3;
  grantDevilReward();
}
function grantDevilReward(){
  const { id, boxTier } = DEVIL.pick;
  const bossLv = MOBS[id].lv;
  const gained = rollArenaBox(boxTier, bossLv);
  const bonusSilver = 300*boxTier, bonusTienDan = boxTier + 1, bonusMat = 8*boxTier;
  player.silver += bonusSilver; player.tienDan += bonusTienDan; player.mat += bonusMat;
  player.dantian.tuvi += 200*boxTier;
  player.devilClears = (player.devilClears || 0) + 1;
  zoneBanner = { text:'👹 TẾ THẦN THÔNG QUAN!', sub: gained.join(' · ') + ` · +${bonusSilver} bạc · +${bonusTienDan} Tiến Cấp Đan · +${bonusMat} Huyền Thiết`, color:'#ff8a5a', t:6 };
  addFloat(player.x, player.y-90, '👹 Đấu Trường Tế Thần đã thông quan!', '#ff8a5a', 16);
  AudioSys.sfx('levelup', 0.9);
  calcDerived(); saveGame();
}
function drawDevilHUD(){
  if (!DEVIL || !player) return;
  const label = DEVIL.failed ? '⏱ HẾT GIỜ — TẾ THẦN THẤT BẠI'
    : DEVIL.cleared ? '👹 Đấu Trường Tế Thần đã thông quan!'
    : DEVIL.wave > DEVIL_WAVES ? '👹 QUỶ VƯƠNG: ' + MOBS[DEVIL.pick.id].name
    : `👹 Đợt ${DEVIL.wave}/${DEVIL_WAVES} — dọn sạch quái!`;
  drawArenaHUD({
    label, labelColor: DEVIL.failed ? '#ff6a5a' : '#ff9a5a',
    timeLeft: (!DEVIL.cleared && !DEVIL.failed) ? DEVIL.timeLeft : null,
    activeBoss: (DEVIL.bossRef && !DEVIL.bossRef.dead) ? DEVIL.bossRef : null,
    barColor: '#ff5a3a',
  });
}

// ---- Pháo Đài Máu: 3 đợt lính gác → Pho Tượng Bảo Vệ trong 7 phút; còn giờ thì đấu thêm
// Thiên Sứ (tái dùng Boss Săn theo cấp) để lấy thưởng lớn hơn ----
let BLOOD = null; // { phase:'guards'|'statue'|'archangel', wave, timeLeft, pick, statueRef, angelRef, cleared, bonusCleared, failed, _endT }
const BLOOD_TIME = 420;
const BLOOD_GUARD_WAVES = 3;
window.startBloodCastle = function(){
  if (!player || dead) return;
  if (TOWER || DGN || DEVIL || BLOOD){ addFloat(player.x, player.y-40, 'Đang trong một trận đấu khác rồi!', '#8a8a8a', 12); return; }
  if (curMap === 'tuongduong'){ addFloat(player.x, player.y-40, 'Hãy ra khỏi Lunaris City trước — nơi này cấm giao chiến!', '#8a8a8a', 12); return; }
  const cost = 250 + player.level*14;
  if (player.silver < cost){ addFloat(player.x, player.y-40, `Cần ${cost} bạc để mua Thiệp Mời Thiên Sứ!`, '#8a8a8a', 12); return; }
  player.silver -= cost;
  BLOOD = { phase:'guards', wave:0, timeLeft: BLOOD_TIME, pick: pickArenaBoss(player.level), statueRef:null, angelRef:null, cleared:false, bonusCleared:false, failed:false, _endT:0 };
  calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
  closePanels();
  zoneBanner = { text:'🩸 PHÁO ĐÀI MÁU', sub:'Dọn lính gác, hạ Pho Tượng Bảo Vệ trong 7 phút — còn giờ thì đấu thêm Thiên Sứ để lấy thưởng lớn!', color:'#ff5a6a', t:4 };
  AudioSys.sfx('quest', 0.8);
  bloodNextWave();
};
function bloodNextWave(){
  if (!BLOOD) return;
  BLOOD.wave++;
  if (BLOOD.wave > BLOOD_GUARD_WAVES){
    BLOOD.phase = 'statue';
    const b = spawnMob('boss_hacphong', { x:player.x, y:player.y-100, r:10, count:1 }, null);
    b.zone = null; b.bloodMob = true;
    const hpMul = 1.3 + player.level*0.018, atkMul = 1 + player.level*0.01;
    // di chuyển đọc m.def.speed (không phải m.speed) — set speed:0 vào def để đứng yên như tượng đá
    b.def = { ...b.def, hp: Math.round(b.def.hp*hpMul), atk: Math.round(b.def.atk*atkMul), speed: 0 };
    b.hp = b.def.hp; b.maxHp = b.def.hp;
    BLOOD.statueRef = b;
    addFloat(player.x, player.y-70, '🗿 PHO TƯỢNG BẢO VỆ thức tỉnh — hạ gục để phá cổng!', '#c8a868', 17);
    AudioSys.sfx('crit', 0.6);
    return;
  }
  const n = 4 + BLOOD.wave;
  spawnArenaWave(n, 1 + BLOOD.wave*0.08, 'bloodMob');
  addFloat(player.x, player.y-60, `Lính gác ${BLOOD.wave}/${BLOOD_GUARD_WAVES} — ${n} địch!`, '#e88a8a', 15);
}
function updateBlood(dt){
  if (!BLOOD) return;
  if (BLOOD.cleared || BLOOD.failed){
    BLOOD._endT -= dt;
    if (BLOOD._endT <= 0) BLOOD = null;
    return;
  }
  BLOOD.timeLeft -= dt;
  if (BLOOD.timeLeft <= 0){
    BLOOD.timeLeft = 0; BLOOD._endT = 3;
    mobs.forEach(m => { if (m.bloodMob && !m.dead) m.dead = true; });
    if (BLOOD.phase === 'archangel'){ // tượng đã hạ trước đó — vẫn tính thông quan cơ bản, chỉ lỡ thưởng Thiên Sứ
      BLOOD.cleared = true;
      grantBloodReward(false);
      return;
    }
    BLOOD.failed = true;
    zoneBanner = { text:'⏱ PHÁO ĐÀI MÁU THẤT BẠI', sub:'Không hạ được Pho Tượng Bảo Vệ kịp giờ — Thiệp Mời đã mất, thử lại sau.', color:'#ff5a4a', t:5 };
    addFloat(player.x, player.y-80, 'Hết giờ! Pháo Đài Máu thất bại.', '#ff5a4a', 16);
    AudioSys.sfx('hurt', 0.7);
    return;
  }
  if (BLOOD.phase === 'guards'){
    if (mobs.some(m => m.bloodMob && !m.dead)) return;
    bloodNextWave();
    return;
  }
  if (BLOOD.phase === 'statue'){
    if (BLOOD.statueRef && !BLOOD.statueRef.dead) return;
    BLOOD.phase = 'archangel';
    BLOOD.angelRef = spawnArenaBoss(BLOOD.pick.id, player.x, player.y-120);
    BLOOD.angelRef.bloodMob = true;
    if (player.auto){ player.auto = false; updateAutoBtn(); addFloat(player.x, player.y-70, 'Thiên Sứ cần tự tay chiến — AUTO đã tắt!', '#ff9a5a', 13); }
    shakeT = Math.max(shakeT, 0.4); shakeMag = Math.max(shakeMag, 6);
    addEffect({ type:'ring', x:player.x, y:player.y-120, r:100, color:'#ffe9a8', big:true });
    addFloat(player.x, player.y-70, '👼 THIÊN SỨ xuất hiện — hạ gục để nhận thưởng lớn!', '#ffe9a8', 18);
    AudioSys.sfx('crit', 0.7);
    return;
  }
  // phase === 'archangel'
  if (BLOOD.angelRef && !BLOOD.angelRef.dead) return;
  BLOOD.cleared = true; BLOOD._endT = 3;
  grantBloodReward(true);
}
function grantBloodReward(bonus){
  const { boxTier } = BLOOD.pick;
  const bossLv = player.level;
  const gained = rollArenaBox(boxTier, bossLv);
  let bonusSilver = 250*boxTier, bonusTienDan = boxTier, bonusMat = 6*boxTier, extra = '';
  if (bonus){
    gained.push(...rollArenaBox(boxTier, bossLv));
    bonusSilver += 350*boxTier; bonusTienDan += boxTier + 1;
    extra = ' · ★ Thiên Sứ đã ngã — thưởng thêm!';
    BLOOD.bonusCleared = true;
    player.bloodBonusClears = (player.bloodBonusClears || 0) + 1;
  }
  player.silver += bonusSilver; player.tienDan += bonusTienDan; player.mat += bonusMat;
  player.dantian.tuvi += 150*boxTier*(bonus?2:1);
  player.bloodClears = (player.bloodClears || 0) + 1;
  zoneBanner = { text: bonus ? '🩸 PHÁO ĐÀI MÁU — THÔNG QUAN HOÀN HẢO!' : '🩸 PHÁO ĐÀI MÁU THÔNG QUAN!',
    sub: gained.join(' · ') + ` · +${bonusSilver} bạc · +${bonusTienDan} Tiến Cấp Đan${extra}`, color:'#ff5a6a', t:6 };
  addFloat(player.x, player.y-90, bonus ? '🩸 Pháo Đài Máu hoàn hảo!' : '🩸 Pháo Đài Máu đã thông quan!', '#ff5a6a', 16);
  AudioSys.sfx('levelup', 0.9);
  calcDerived(); saveGame();
}
function drawBloodHUD(){
  if (!BLOOD || !player) return;
  const label = BLOOD.failed ? '⏱ HẾT GIỜ — PHÁO ĐÀI MÁU THẤT BẠI'
    : BLOOD.cleared ? (BLOOD.bonusCleared ? '🩸 Pháo Đài Máu — Thông Quan Hoàn Hảo!' : '🩸 Pháo Đài Máu đã thông quan!')
    : BLOOD.phase === 'archangel' ? '👼 THIÊN SỨ: ' + MOBS[BLOOD.pick.id].name
    : BLOOD.phase === 'statue' ? '🗿 PHO TƯỢNG BẢO VỆ'
    : `🩸 Lính gác ${BLOOD.wave}/${BLOOD_GUARD_WAVES} — dọn sạch!`;
  const activeBoss = (BLOOD.phase==='statue' && BLOOD.statueRef && !BLOOD.statueRef.dead) ? BLOOD.statueRef
    : (BLOOD.phase==='archangel' && BLOOD.angelRef && !BLOOD.angelRef.dead) ? BLOOD.angelRef : null;
  drawArenaHUD({
    label, labelColor: BLOOD.failed ? '#ff6a5a' : '#e86a7a',
    timeLeft: (!BLOOD.cleared && !BLOOD.failed) ? BLOOD.timeLeft : null,
    activeBoss,
    barColor: activeBoss === BLOOD.statueRef ? '#c8a868' : '#ffe9a8',
  });
}
function renderArenaTab(){
  const c = el('char-content'); if (!c) return;
  let html = `<div class="stat-sec">👹 CHIẾN TRƯỜNG — phó bản MU Online-lite</div>
    <div style="font-size:12px;color:#9aa8d4;line-height:1.85;padding:0 2px 10px">
    Khác Trận Địa Phòng Thủ (miễn phí, vô hạn, không thưởng cố định): 2 đấu trường này có <b style="color:#ff9a5a">giờ giới hạn thật</b>
    và tốn vé vào, đổi lại thông quan là chắc chắn mở <b style="color:#ffd76a">Rương phẩm cao cố định</b> — không cần may rủi drop.
    Quái dồn dập ngay tại chỗ đứng, không cần đi tới map riêng. Vé mất luôn nếu thất bại (không mất trang bị).
    Không thể mở trong Lunaris City hoặc phó bản khác.</div>`;
  html += `<div class="stat-sec" style="margin-top:6px">👹 ĐẤU TRƯỜNG TẾ THẦN</div>
    <div style="font-size:12px;color:#9aa8d4;line-height:1.7;padding:0 2px 8px">6 đợt quái dồn dập trong 10 phút, đợt 7 là Quỷ Vương (Boss Săn theo đúng cấp ngươi). Thông quan → mở Rương theo cấp.</div>
    <div style="font-size:13px;color:#e4ebff;padding:0 2px 8px">Đã thông quan: <b style="color:#ffd76a">${player.devilClears || 0}</b> lần</div>`;
  if (DEVIL){
    html += `<div style="font-size:13px;color:#ff9a5a;padding:0 2px 10px">👹 Đang trong trận — Đợt ${Math.min(DEVIL.wave, DEVIL_WAVES+1)}${DEVIL.wave>DEVIL_WAVES?' (Quỷ Vương)':''}. Đóng bảng này để tiếp tục chiến đấu.</div>`;
  } else {
    const cost = 200 + player.level*12;
    html += `<button class="big-btn" onclick="window.startDevilSquare();closePanels();">👹 Mở Đấu Trường Tế Thần — ${cost} bạc</button>`;
  }
  html += `<div class="stat-sec" style="margin-top:14px">🩸 PHÁO ĐÀI MÁU</div>
    <div style="font-size:12px;color:#9aa8d4;line-height:1.7;padding:0 2px 8px">3 đợt lính gác + Pho Tượng Bảo Vệ trong 7 phút. Còn giờ thì đấu thêm Thiên Sứ để lấy thưởng lớn hơn.</div>
    <div style="font-size:13px;color:#e4ebff;padding:0 2px 8px">Đã thông quan: <b style="color:#ffd76a">${player.bloodClears || 0}</b> lần (<b style="color:#ff9a5a">${player.bloodBonusClears || 0}</b> hoàn hảo)</div>`;
  if (BLOOD){
    const phaseName = BLOOD.phase==='guards' ? `Lính gác ${BLOOD.wave}/${BLOOD_GUARD_WAVES}` : BLOOD.phase==='statue' ? 'Pho Tượng Bảo Vệ' : 'Thiên Sứ';
    html += `<div style="font-size:13px;color:#e86a7a;padding:0 2px 10px">🩸 Đang trong trận — ${phaseName}. Đóng bảng này để tiếp tục chiến đấu.</div>`;
  } else {
    const cost2 = 250 + player.level*14;
    html += `<button class="big-btn" onclick="window.startBloodCastle();closePanels();">🩸 Mở Pháo Đài Máu — ${cost2} bạc</button>`;
  }
  c.innerHTML = html;
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
    if (player.autoSell && it.rarity <= 0){
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
  addFloat(player.x, player.y-50, `Thôn phệ Nội Đan ${el2}: ${ef.desc.split(' mỗi')[0]} VĨNH VIỄN!`, NGU_HANH[el2].color, 14);
  addEffect({ type:'ring', x:player.x, y:player.y, r:60, color:NGU_HANH[el2].color });
  AudioSys.sfx('levelup', 0.5);
  saveGame(); renderBag();
};


// ==================== LUYỆN ĐAN — crafting là chiều sâu được yêu thích nhất
// của thể loại tu tiên) ====================
// Hái Thảo Dược ngoài đồng (đã có sẵn, trước đây chỉ dùng cho nhiệm vụ/hồi máu vặt) → luyện thành
// đan dược ở đây. Đan tiêu hao (hồi máu/giải độc/buff tạm) không giới hạn; đan vĩnh viễn tái dùng
// đúng player.ndBonus — chung một "hồ chứa" chỉ số vĩnh viễn với Nội Đan ở trên, giới hạn 2/ngày
// riêng (không cộng dồn với giới hạn 3/ngày của Nội Đan).
const ALCHEMY_RECIPES = [
  { id:'hoixuan',  name:'Hồi Xuân Đan',  icon:'🌿', herb:5,  silver:30,  mat:0, perm:false,
    desc:'Hồi đầy Sinh Lực & Qi ngay lập tức.',
    apply: p => { p.hp = p.maxHp; p.qi = p.maxQi; } },
  { id:'thanhdoc', name:'Thanh Độc Đan', icon:'🍵', herb:4,  silver:20,  mat:0, perm:false,
    desc:'Giải toàn bộ độc tố & hồi thêm 60 Sinh Lực.',
    apply: p => { p.poisonT = 0; p.hp = Math.min(p.maxHp, p.hp + 60); } },
  { id:'baoluc',   name:'Bạo Lực Đan',   icon:'🔥', herb:10, silver:100, mat:0, perm:false,
    desc:'+18% sát thương trong 5 phút.',
    apply: p => { p.pillDmgT = 300; p.pillDmgPct = 18; } },
  { id:'coban',    name:'Cố Bản Đan',    icon:'💎', herb:10, silver:80,  mat:1, perm:true,
    desc:'+50 Sinh Lực tối đa VĨNH VIỄN.',
    apply: p => { p.ndBonus.hp = (p.ndBonus.hp || 0) + 50; } },
  { id:'nguluc',   name:'Ngưng Lực Đan', icon:'⚔',  herb:10, silver:80,  mat:1, perm:true,
    desc:'+6 Công Kích VĨNH VIỄN.',
    apply: p => { p.ndBonus.atk = (p.ndBonus.atk || 0) + 6; } },
];
function alchToday(){
  const d = new Date().toDateString();
  if (player.alchDay !== d){ player.alchDay = d; player.alchCount = 0; }
  return player.alchCount || 0;
}
window.craftPill = function(id){
  const r = ALCHEMY_RECIPES.find(x => x.id === id); if (!r) return;
  if ((player.herbCount || 0) < r.herb){ addFloat(player.x, player.y-40, `Cần ${r.herb} 🌿 Thảo Dược`, '#8a8a8a', 12); return; }
  if (player.silver < r.silver){ addFloat(player.x, player.y-40, `Cần ${r.silver} bạc`, '#8a8a8a', 12); return; }
  if (r.mat && player.mat < r.mat){ addFloat(player.x, player.y-40, `Cần ${r.mat} Tinh Thạch`, '#8a8a8a', 12); return; }
  if (r.perm && alchToday() >= 2){ addFloat(player.x, player.y-40, 'Đã luyện đủ 2 đan vĩnh viễn hôm nay — mai luyện tiếp!', '#8a8a8a', 12); return; }
  player.herbCount -= r.herb; player.silver -= r.silver; if (r.mat) player.mat -= r.mat;
  if (r.perm) player.alchCount = alchToday() + 1;
  r.apply(player);
  calcDerived();
  sideOnEvent('brew');
  addFloat(player.x, player.y-56, `${r.icon} ${r.name} luyện thành!`, '#7ec850', 14);
  AudioSys.sfx('levelup', 0.6);
  addEffect({ type:'ring', x:player.x, y:player.y, r:70, color:'#7ec850' });
  if (r.id === 'hoixuan' || r.id === 'thanhdoc') playStatusFx('heal', 'heal', player.x, player.y, 0.5, 0.32); // discrete heal-pill event
  saveGame(); refreshCharTab('alchemy');
};
function renderAlchemyTab(){
  const c = el('char-content'); if (!c) return;
  let html = `<div class="stat-sec">LUYỆN ĐAN</div>
    <div style="font-size:12px;color:#9aa8d4;line-height:1.85;padding:0 2px 8px">
    Hái <b style="color:#8fd18f">🌿 Thảo Dược</b> ngoài đồng (đi ngang qua bụi thuốc) rồi đem về đây luyện thành đan dược.
    Đan tiêu hao luyện không giới hạn; đan vĩnh viễn giới hạn <b style="color:#7ecbff">2 lần/ngày</b> (tính riêng với Nội Đan).</div>
    <div style="font-size:14px;color:#e4ebff;padding:0 2px 12px">Thảo Dược trong túi: <b style="color:#8fd18f;font-size:16px">${player.herbCount || 0} 🌿</b> ·
    Đan vĩnh viễn hôm nay: <b style="color:${alchToday()>=2?'#ff8f6b':'#7ecbff'}">${alchToday()}/2</b></div>
    <div style="display:flex;flex-direction:column;gap:8px">`;
  for (const r of ALCHEMY_RECIPES){
    const canHerb = (player.herbCount || 0) >= r.herb, canSilver = player.silver >= r.silver, canMat = !r.mat || player.mat >= r.mat;
    const canPerm = !r.perm || alchToday() < 2;
    const can = canHerb && canSilver && canMat && canPerm;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;border:1px solid rgba(160,190,255,.2);background:rgba(180,205,255,.04)">
      <span style="font-size:26px">${r.icon}</span>
      <div style="flex:1">
        <b style="color:#e4ebff">${r.name}</b>${r.perm ? ' <span style="color:#ffd76a;font-size:10px">VĨNH VIỄN</span>' : ''}<br>
        <span style="font-size:11px;color:#9aa8d4">${r.desc}</span><br>
        <span style="font-size:10.5px;color:${canHerb?'#8fd18f':'#e88a7a'}">${r.herb} 🌿</span><span style="font-size:10.5px;color:${canSilver?'#e4ebff':'#e88a7a'}"> · ${r.silver} ◈</span>${r.mat ? `<span style="font-size:10.5px;color:${canMat?'#e4ebff':'#e88a7a'}"> · ${r.mat} ✦</span>` : ''}
      </div>
      <button class="mini-btn" ${can?'':'disabled'} onclick="window.craftPill('${r.id}')">Luyện</button>
    </div>`;
  }
  html += `</div>`;
  c.innerHTML = html;
}


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
  const nh = NGU_HANH[player.pet.el] || { color:'#b08ae8' };
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
    zoneBanner = { text:'🐾 THU PHỤC THÀNH CÔNG', sub:`${best.def.name} hệ ${best.def.el} nguyện theo ngươi — xem ở Nhân Vật → Linh Thú!`, color:'#b08ae8', t:3.5 };
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
    const nh = NGU_HANH[p.el] || { color:'#e4ebff', glyph:'·' };
    const tier = Math.floor((p.feed || 0)/10);
    html = `<div class="stat-sec">LINH THÚ ĐỒNG HÀNH</div>
      <div style="font-size:13px;line-height:2;color:#e4ebff">
        <b style="color:${nh.color};font-size:15px">${nh.glyph} ${p.name}</b>${tier > 0 ? ` <span style="color:#7ecbff">· Tinh Anh bậc ${tier}</span>` : ''} · hệ ${p.el} · C${p.lv}<br>
        Sức mạnh: <b style="color:#7ecbff">${petDmg()} ST</b> mỗi 1.2s — tự săn quái quanh ngươi<br>
        Đã cho ăn: <b>${p.feed || 0}</b> nội đan ${`(còn ${10 - (p.feed || 0)%10} viên nữa tiến hóa)`}
      </div>
      <div class="forge-actions">
        <button class="mini-btn" onclick="feedPet()">● Cho Ăn Nội Đan (hệ ${p.el} tính ×2)</button>
        <button class="mini-btn" style="border-color:#7a4a3a;color:#c88" onclick="releasePet()">Phóng Sinh</button>
      </div>
      <div style="font-size:11.5px;opacity:.6;margin-top:4px">Nội đan trong túi: ${['Kim','Mộc','Thổ','Thủy','Hỏa'].map(e2=>`${e2} ${(player.noidan && player.noidan[e2]) || 0}`).join(' · ')}</div>`;
  }
  c.innerHTML = html;
}
function renderChannelForm(){
  const c = el('char-content'); if (!c) return;
  const unlocked = channelFormsUnlocked();
  let html = `<div class="stat-sec">HÓA THÂN TRẤN ẢI</div>
    <div style="font-size:12px;color:#9aa8d4;line-height:1.85;padding:0 2px 8px">
    <b style="color:#7ecbff">Hạ Cổng Vực</b> (boss trấn giữ cuối mỗi bản đồ, mở sau khi phá 3 Vệ Binh Trụ) lần đầu →
    vĩnh viễn hàng phục hình dạng của nó. Bấm <b style="color:#ffb15c">P</b> trong trận để hóa thân
    <b>14 giây</b>: đổi hẳn tạo hình, <b style="color:#7ec850">+25% công lực</b>, và một đòn bộc phá quanh người
    lúc kích hoạt. Hồi <b>90 giây</b>.${player.channelT > 0 ? ` <span style="color:#ffb15c">— đang hóa thân, còn ${Math.ceil(player.channelT)}s!</span>` : player.channelCd > 0 ? ` <span style="color:#8a8a8a">— còn hồi ${Math.ceil(player.channelCd)}s</span>` : ''}</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 2px">`;
  for (const mapId in BOSS_DEFS){
    const tv = BOSS_DEFS[mapId].tranai; if (!tv) continue;
    const got = unlocked.some(f => f.id === tv.id);
    const picked = player.channelPick === tv.id || (!player.channelPick && got && unlocked[unlocked.length-1].id === tv.id);
    html += `<div style="width:88px;text-align:center;padding:8px 4px;border-radius:8px;border:1px solid ${picked?'#ffb15c':'rgba(160,190,255,.2)'};background:rgba(180,205,255,.04);cursor:${got?'pointer':'default'}"
      ${got?`onclick="window.setChannelPick('${tv.id}')" title="Đặt làm hóa thân mặc định (phím P)"`:`title="Hạ ${tv.name} (Cổng Vực, cấp ${tv.lv}) để hàng phục"`}>
      <img src="${(MOBS[tv.img] && MOBS[tv.img].skel) ? mobCardUrl(tv.img) : 'assets/mobs/' + tv.img + '.png'}" style="width:48px;height:48px;object-fit:contain;filter:${got?'none':'grayscale(1) brightness(.4)'}"><br>
      <b style="font-size:10.5px;color:${got?'#e4ebff':'#6a6156'}">${tv.name}</b><br>
      <span style="font-size:9px;color:${got?(picked?'#ffb15c':'#8fd18f'):'#7a86ad'}">${got ? (picked?'★ Đang chọn':'Đã hàng phục') : '🔒 Chưa hạ'}</span>
    </div>`;
  }
  html += `</div>`;
  c.innerHTML = html;
}
function renderTowerTab(){
  const c = el('char-content'); if (!c) return;
  let html = `<div class="stat-sec">VẠN KIẾM TU LA TRẬN</div>
    <div style="font-size:12px;color:#9aa8d4;line-height:1.85;padding:0 2px 10px">
    Đấu trường phòng thủ <b style="color:#c07fe0">vô hạn</b>, miễn phí — vào một đấu trường riêng
    (Trận Địa Phòng Thủ) với <b style="color:#ffb15c">Lõi Trụ</b> ở giữa và quái đổ vào theo 4 lane
    từ 4 cổng. Đứng chắn một lane để chặn quái — quái lọt qua sẽ đánh thẳng vào Lõi Trụ và mất luôn
    (không thưởng). Mỗi đợt hạ sạch → chọn 1 trong 3 thẻ tiến hóa tạm thời (mượn tên/hình các võ học
    đã có), dồn sức mạnh cho tới khi Lõi Trụ sụp đổ hoặc ngươi tự dừng lại. Buff chỉ tồn tại trong
    lượt chơi — kết thúc là mất hết, chỉ giữ lại <b style="color:#7ecbff">kỷ lục đợt cao nhất</b>.
    Không thể mở trong Lunaris City hoặc phó bản.</div>`;
  html += `<div style="font-size:14px;color:#e4ebff;padding:0 2px 12px">Kỷ lục cá nhân: <b style="color:#ffd76a;font-size:17px">Đợt ${player.towerBest || 0}</b></div>`;
  if (TOWER){
    html += `<div style="font-size:13px;color:#c07fe0;padding:0 2px 10px">🌀 Đang trong trận — Đợt ${TOWER.wave}${TOWER.drafting ? ' (đang chờ chọn thẻ)' : ''}. Đóng bảng này để tiếp tục chiến đấu.</div>
      <button class="mini-btn" style="border-color:#7a6a5a;color:#c8b898" onclick="window.stopTowerRun();closePanels();">Dừng Lại — Nhận Thưởng</button>`;
  } else {
    html += `<button class="big-btn" onclick="window.startTowerRun();closePanels();">🌀 Bắt Đầu Trận Địa Phòng Thủ</button>`;
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
  addFloat(player.x, player.y-50, `Linh thú ăn Nội Đan ${el2} (+${bonus}) — sức mạnh ${petDmg()}!`, NGU_HANH[el2].color, 13);
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
  if (lv >= 5) parts.push(t('hud.hint.character'), t('hud.hint.bag'));
  if (lv >= 8) parts.push(t('hud.hint.map'), t('hud.hint.skills'));
  if (lv >= 15) parts.push(t('hud.hint.tame'));
  if (player.canJump) parts.push(t('hud.hint.jump'));
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
// Người mới khởi đầu Unclassed (không hệ ngũ hành — không khắc cũng không bị khắc).
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
      <div class="s-role">${s.role} · hệ <b style="color:${(NGU_HANH[s.element]||{}).color || '#e8ecff'}">${s.element}</b></div>
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
window.onJewelDragStart = function(e, kind){
  window._dragJewelKind = kind;
  e.dataTransfer.effectAllowed = 'copy';
  try { e.dataTransfer.setData('text/plain', kind); } catch { /* xem ghi chú ở onBagItemDragStart */ }
};
window.onForgeItemDragOver = function(e){ if (window._dragJewelKind) e.preventDefault(); };
window.onForgeItemDragEnter = function(e){ if (window._dragJewelKind) e.currentTarget.classList.add('drag-over'); };
window.onForgeItemDrop = function(e, uid){
  e.preventDefault();
  const kind = window._dragJewelKind; window._dragJewelKind = null;
  if (kind) useJewel(kind, uid); // useJewel() tự kiểm tra lại điều kiện (đủ ngọc, đúng loại đồ...), an toàn để gọi thẳng
};
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

// ---------- Lò Bảo Chứng: luyện Linh Dực ----------
window.craftWing = function(t){
  const J = player.jewels;
  const msg = document.getElementById('bagua-msg');
  const say = (tx, c) => { if (msg){ msg.textContent = tx; msg.style.color = c; } };
  if (t === 1){
    if (player.level < 40 || J.honDon < 1 || player.gems.honNguyen < 10 || player.silver < 5000) return;
    let fk = null, fs = null;
    for (const s in player.equip){ const x = player.equip[s]; if (x && x.perfect && x.plus >= 4 && !x.noForge){ fk = 'equip'; fs = s; break; } }
    if (!fk){ const i = player.inv.findIndex(x => x.perfect && x.plus >= 4 && !x.noForge); if (i >= 0){ fk = 'inv'; fs = i; } }
    if (!fk){ say('✘ Cần 1 trang bị Hoàn Hảo +4 trở lên làm vật hiến tế!', '#ff9a6a'); return; }
    if (fk === 'equip') player.equip[fs] = null; else player.inv.splice(fs, 1);
    J.honDon--; player.gems.honNguyen -= 10; player.silver -= 5000;
    const wi = Math.floor(Math.random()*2);
    const w = genWing(wi);
    if (player.inv.length < 30) player.inv.push(w); else player.silver += 2000;
    zoneBanner = { text:'◈ LINH DỰC XUẤT THẾ', sub:`Lò Bảo Chứng luyện thành ${WING_DEFS[wi].name}!`, color:WING_DEFS[wi].color, t:4.5 };
    say(`✔ Luyện thành ${WING_DEFS[wi].name}!`, '#8fd18f');
    addEffect({ type:'ring', x:player.x, y:player.y, r:120, color:WING_DEFS[wi].color, big:true });
    AudioSys.sfx('forge_ok', 0.95);
  } else if (t === 2){
    const w1 = player.equip.canh || player.inv.find(x => x.slot === 'canh');
    if (player.level < 80 || !w1 || w1.wing2 || J.honDon < 1 || player.gems.honNguyen < 20 || player.silver < 10000) return;
    J.honDon--; player.gems.honNguyen -= 20; player.silver -= 10000;
    const j = Math.floor(Math.random()*2);
    const w2 = specialItem('canh', WING2_DEFS[j], { wing2: WING2_DEFS[j].id });
    if (player.equip.canh === w1) player.equip.canh = w2;
    else { const i = player.inv.indexOf(w1); if (i >= 0) player.inv[i] = w2; else player.inv.push(w2); }
    zoneBanner = { text:'◈ LINH DỰC THĂNG HOA', sub:`${WING2_DEFS[j].name} — sức mạnh vượt trần!`, color:WING2_DEFS[j].color, t:5 };
    say(`✔ Thăng thành ${WING2_DEFS[j].name}!`, '#8fd18f');
    addEffect({ type:'ring', x:player.x, y:player.y, r:140, color:WING2_DEFS[j].color, big:true });
    AudioSys.sfx('levelup', 0.95);
  }
  calcDerived(); saveGame(); renderBaGua(); refreshEqPanels();
};

// ---------- Lò Bảo Chứng: đổi 3 Cổ Thần trùng + 1 Hỗn Độn = 1 món tự chọn ----------
window._hdSel = {}; window._hdSet = 'thanhlong'; window._hdSlot = 'non';
window.hdToggle = function(uid){
  if (window._hdSel[uid]) delete window._hdSel[uid];
  else if (Object.keys(window._hdSel).length < 3 && player.inv.some(x => x.uid === uid && x.ancient)) window._hdSel[uid] = true;
  renderBaGua();
};
window.hdExchange = function(){
  const sel = Object.keys(window._hdSel || {}).map(Number);
  if (sel.length !== 3 || player.jewels.honDon < 1 || player.inv.length >= 30) return;
  const setId = ANCIENT_SETS[window._hdSet] ? window._hdSet : 'thanhlong';
  const slotId = ARMOR_SLOTS.includes(window._hdSlot) ? window._hdSlot : 'non';
  const idxs = player.inv.map((x, i) => (x && sel.includes(x.uid)) ? i : -1).filter(i => i >= 0).sort((a, b) => b - a);
  if (idxs.length !== 3){ window._hdSel = {}; renderBaGua(); return; }
  idxs.forEach(i => player.inv.splice(i, 1));
  player.jewels.honDon--;
  const it = genAncient(setId, slotId, player.level);
  player.inv.push(it);
  window._hdSel = {};
  zoneBanner = { text:'◈ CỔ THẦN TỰ CHỌN', sub:`Lò Bảo Chứng đúc thành ${it.name}!`, color:ANCIENT_SETS[setId].color, t:4.5 };
  addFloat(player.x, player.y-56, `◈ ${it.name}`, ANCIENT_SETS[setId].color, 16);
  AudioSys.sfx('forge_ok', 0.95);
  saveGame(); renderBaGua(); refreshEqPanels();
};

// ---------- Lò Hỗn Loạn (MU Online Chaos Machine): 3 món cùng phẩm + Hỗn Nguyên Thạch → 1 món
// phẩm cao hơn, tỉ lệ thất bại THẬT (mất sạch) — khác Lò Bảo Chứng ở trên (đổi luôn chắc ăn) ----------
window._chaosSel = {};
const CHAOS_RATE = [70, 55, 40, 25]; // % theo phẩm gốc: Phàm→Tinh, Tinh→Linh, Linh→Thần, Thần→ChíTôn
const CHAOS_HON_COST = [2, 4, 7, 12];
const CHAOS_SILVER_COST = [300, 800, 2000, 5000];
window.chaosToggle = function(uid){
  if (window._chaosSel[uid]) delete window._chaosSel[uid];
  else if (Object.keys(window._chaosSel).length < 3){
    const it = player.inv.find(x => x.uid === uid);
    if (it && !it.noForge && it.rarity < 4){
      const already = Object.keys(window._chaosSel).map(Number).map(u => player.inv.find(x => x.uid === u)).filter(Boolean);
      if (already.length === 0 || already[0].rarity === it.rarity) window._chaosSel[uid] = true;
    }
  }
  renderBaGua();
};
window.chaosCombine = function(){
  const selUids = Object.keys(window._chaosSel || {}).map(Number);
  if (selUids.length !== 3) return;
  const idxs = player.inv.map((x,i) => (x && selUids.includes(x.uid)) ? i : -1).filter(i => i >= 0).sort((a,b) => b-a);
  if (idxs.length !== 3){ window._chaosSel = {}; renderBaGua(); return; }
  const items = idxs.map(i => player.inv[i]);
  const r = items[0].rarity;
  if (!items.every(x => x.rarity === r) || r >= 4){ window._chaosSel = {}; renderBaGua(); return; }
  const honCost = CHAOS_HON_COST[r], silverCost = CHAOS_SILVER_COST[r];
  if (player.gems.honNguyen < honCost || player.silver < silverCost) return;
  const useCharm = forgeUseCharm && player.charms > 0;
  const rate = useCharm ? 100 : Math.min(100, CHAOS_RATE[r] + (player.forgeBonus || 0));
  const success = Math.random()*100 < rate;
  player.gems.honNguyen -= honCost; player.silver -= silverCost;
  if (useCharm) player.charms--;
  idxs.forEach(i => player.inv.splice(i, 1)); // 3 món hiến tế mất ngay khi bỏ vào lò, thành hay bại
  window._chaosSel = {};
  sideOnEvent('chaos'); // NV học hệ thống chỉ cần đã DÙNG lò, không cần thành công
  let newItem = null;
  if (success){
    const avgLevel = Math.max(1, Math.round(items.reduce((s,x) => s + x.level, 0) / 3));
    newItem = genItem(avgLevel, 0, 'mob');
    newItem.rarity = r + 1; rerollItemRarity(newItem);
  }
  playChaosAnim(items, r, success, () => {
    if (success){
      if (player.inv.length < 30){ player.inv.push(newItem); tryAutoEquip(newItem); }
      zoneBanner = { text:'◑ LÒ HỖN LOẠN — THÀNH CÔNG!', sub:`3 món hoá thành ${newItem.name}!`, color:RARITIES[newItem.rarity].color, t:5 };
      addFloat(player.x, player.y-56, `◑ ${newItem.name}`, RARITIES[newItem.rarity].color, 16);
    } else {
      zoneBanner = { text:'◑ LÒ HỖN LOẠN — THẤT BẠI', sub:'3 món đã tan thành tro bụi — Hỗn Loạn vô thường.', color:'#ff5a4a', t:5 };
      addFloat(player.x, player.y-56, 'Thất bại — mất sạch!', '#ff5a4a', 16);
    }
    saveGame(); refreshEqPanels();
    return { newItem };
  });
};
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
      renderBaGua();
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
    for (let i = 0; i < 6; i++){ it = genItem(lv, 0.5 + t*0.06); if (it.rarity >= 2) break; }
    if (player.inv.length < 30){ player.inv.push(it); got.push(`Trang bị: <b class="${RARITIES[it.rarity].cls}">${it.name}</b>`); }
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
    <div style="font-size:12.5px;opacity:.75;margin-bottom:4px">Cứ 2 giờ có một sự kiện thế giới — Hung Thần (0h·4h·8h…) xen kẽ Xâm Lăng Vàng (2h·6h·10h…)</div>
    ${rows}
    <div style="font-size:12px;opacity:.65;margin-top:6px">👹 Đấu Trường Tế Thần · 🩸 Pháo Đài Máu — vào bất cứ lúc nào bằng Thiệp Mời (quái tinh anh rơi)</div>
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
