/* ═══ Axie Wuxia legacy translator — covers content not yet migrated to i18n.js's t() ═══
   Loaded AFTER i18n.js, BEFORE game.js. Patches canvas text + observes DOM.
   Lang stored in localStorage 'vlcm_lang', SHARED with i18n.js so both stay in sync on one
   toggle. Axie Wuxia is English-first (default flipped from the wuxia prototype's 'vi'
   default) — un-migrated Vietnamese source text still gets translated to English by this
   regex/dictionary layer exactly as before; t()-driven content bypasses this entirely since
   its output is already correct for the locale. See docs/I18N_MIGRATION_GUIDE.md. */
(function () {
'use strict';
const KEY = 'vlcm_lang';
// Tên hệ trong chuỗi động — dùng lại đúng bảng dịch bên dưới thay vì chép tay lần nữa.
function m1El(e){ return ({ 'Kim':'Metal','Mộc':'Wood','Thủy':'Water','Hỏa':'Fire','Thổ':'Earth' })[e] || e; }
// Phải TRÙNG mặc định với i18n.js — hai lớp dùng chung khoá 'vlcm_lang', lệch nhau là giao diện
// lẫn hai thứ tiếng ngay từ lần mở đầu tiên.
let lang = 'vi';
try { lang = localStorage.getItem(KEY) || 'vi'; } catch (e) {}

/* ---- term swaps: applied ONLY inside rule-captured fragments ---- */
const TERMS = [
  ['sát thương gánh chịu','damage taken'],['sát thương thiên lôi','lightning damage'],['Sát Thương','Damage'],['sát thương','damage'],
  ['kinh nghiệm','EXP'],['Kinh Nghiệm','EXP'],
  ['phòng ngự','defense'],['Phòng Ngự','Defense'],['phòng thủ','defense'],['Phòng Thủ','Defense'],
  ['tốc độ đánh','attack speed'],['Tốc Độ Đánh','Attack Speed'],['tốc đánh','attack speed'],
  ['Né Tránh','Dodge'],['né tránh','dodge'],[' né',' dodge'],
  ['Bạo Kích','Crit'],['bạo kích','crit'],['bạo','crit'],
  ['bạc rơi','silver drops'],['đồng rơi','coin drops'],['đồng','coins'],
  ['Sinh Lực Tối Đa','Max HP'],['Sinh Lực','HP'],['sinh lực','HP'],
  ['Mana Tối Đa','Max Mana'],['Mana','Mana'],['mana','mana'],
  ['Mana','Mana'],
  ['tốc chạy','move speed'],['Tốc Chạy','Move Speed'],
  ['hút sinh lực','life steal'],['hút mana','mana steal'],['hút','drain'],
  ['mỗi giây','per second'],['tỉ lệ thành công','success rate'],['tỉ lệ','rate'],['thành công','success'],
  ['hồi chiêu','cooldown'],['kháng độc','poison resist'],['kịch độc','deadly poison'],['độc','poison'],
  ['choáng','stun'],['chảy máu','bleed'],['làm chậm','slow'],['chậm','slow'],
  ['xuyên giáp','armor pierce'],['xuyên thấu','pierce'],['khóa chiêu','lock skills'],
  ['hồi phục','regen'],['hồi','regen'],['máu','HP'],['chiêu thức','skills'],['chiêu','skills'],
  ['địch thủ','foes'],['địch','enemies'],['quái','monsters'],['tối đa','max'],['giây','s'],
  ['công lực','power'],['công','ATK'],['thể lực','stamina'],['trúng','hit'],['trượt','miss'],
  ['miễn phí','free'],['khiên','shield'],['hấp thụ','absorb'],['phản','reflect'],
  ['thuộc tính','attributes'],['bậc','tier'],['cấp độ','level'],['cấp','Lv'],
  ['bạc','silver'],['vàng','gold'],['người chơi','player'],
];
function trFrag(s) {
  let out = s;
  for (const [a, b] of TERMS) out = out.split(a).join(b);
  return out;
}

/* ---- EXACT dictionary: full-string VI -> EN ---- */
const EXACT = {
  // Brand & chapters
  'KẺ KHÉP VẾT NỨT': 'THE RIFTCLOSER',
  // Sects & roles
  
  'Bạch Đà Sơn': 'White Camel Mt.', 'Minh Giáo': 'Ming Cult', 'Đoàn Thị': 'Duan Clan',
  'Đào Hoa': 'Peach Blossom', 'Tán Nhân': 'Wanderer',
  // Elements
  'Kim': 'Metal', 'Mộc': 'Wood', 'Thủy': 'Water', 'Hỏa': 'Fire', 'Thổ': 'Earth',
  // Maps
  'Đào Hoa Đảo': 'Peach Blossom Island', 'Tương Dương Thành': 'Xiangyang City',
  'An Toàn': 'Safe Zone', 'Phó Bản': 'Dungeon',
  // Quality & tiers
  'Phàm': 'Common', 'Tinh': 'Fine', 'Linh': 'Spirit', 'Thần': 'Divine', 'Chí Tôn': 'Supreme',
  'PHÀM': 'COMMON', 'HUYỀN': 'MYSTIC', 'THIÊN': 'CELESTIAL',
  'Hoàn Hảo': 'Flawless', 'ST Hoàn Hảo': 'Flawless DMG',
  'Nhập Môn': 'Novice', 'Hành Hiệp': 'Wayfarer', 'Phiêu Bạt': 'Drifter', 'Danh Môn': 'Renowned',
  'Tông Sư': 'Grandmaster', 'Tuyệt Thế': 'Peerless', 'Khai Sơn': 'Pathfinder', 'Chấn Phái': 'Pillars',
  'Tiêu Dao': 'Carefree', 'Thiên Nhân': 'Celestial Being',
  'Sơ Cấp': 'Basic', 'Trung Cấp': 'Intermediate', 'Cao Cấp': 'Advanced', 'Thần Cấp': 'Godly',
  'Thành Thạo': 'Proficient', 'Điêu Luyện': 'Skilled', 'Lão Luyện': 'Veteran',
  // Realms (NAMING_MAP.md §2: Đan Điền → Ascension; source strings are now English loanwords
  // dropped into Vietnamese grammar, so most bare terms need no EXACT entry — only the ones
  // still paired with a Vietnamese word (Cảnh/Trung Kỳ/Hậu Kỳ) need translating.
  'Molt': 'Molt', 'Radiant Core': 'Radiant Core', 'Starforged': 'Starforged',
  'Resonance Trung Kỳ': 'Resonance · Mid', 'Resonance Hậu Kỳ': 'Resonance · Late',
  'Đá Thăng Cấp': 'Ascent Stone',
  'Thức Tỉnh': 'Awakened', '— ĐÃ THỨC TỈNH ✦': '— AWAKENED ✦', '— TỐI THƯỢNG': '— SUPREME',
  // Stats
  'Công Kích': 'Attack', 'Tấn Công': 'Attack', 'Sinh Lực': 'HP',
  'Phòng Ngự': 'Defense', 'Phòng Thủ': 'Defense', 'Tốc Độ Đánh': 'Atk Speed',
  'Né Tránh': 'Dodge', 'Tránh Đòn': 'Dodge', 'Bạo Kích': 'Crit', 'Bạo Kích %': 'Crit %',
  'Thân Pháp': 'Agility', 'Lực Lượng': 'Strength', 'Mẫn Tiệp': 'Dexterity',
  'Giảm Sát Thương': 'Damage Reduction', 'Phản Sát Thương': 'Reflect Damage',
  'Thêm Sát Thương': 'Bonus Damage', 'Hút Sinh Lực': 'Life Steal', 'Hút Mana': 'Mana Steal',
  'Đồng Rơi Thêm': 'Bonus Coin Drops', 'EXP Thêm': 'Bonus EXP', 'Toàn Thuộc Tính': 'All Attributes',
  'Sinh Lực Tối Đa': 'Max HP', 'Mana Tối Đa': 'Max Mana', 'Hồi Instinct': 'Instinct Regen',
  'Xuyên Giáp': 'Armor Pierce', 'Thần Lực': 'Divine Power', 'Thiên Nhãn': 'Heavenly Eye',
  // Slots
  'Vũ Khí': 'Weapon', 'Nón': 'Helm', 'Áo': 'Armor', 'Tay': 'Gloves', 'Quần': 'Pants',
  'Chân': 'Boots', 'Dây Chuyền': 'Amulet', 'Nhẫn 1': 'Ring 1', 'Nhẫn 2': 'Ring 2',
  'Áo Choàng': 'Cloak', 'Binh Khí': 'Weapon', 'đang mặc': 'equipped', 'túi': 'bag',
  // 'Cánh' và 'Pet' từng thiếu, nên bảng Trang Bị hiện 10 nhãn tiếng Anh xen 2 nhãn tiếng Việt
  'Cánh': 'Wings', 'Pet': 'Pet', 'Chưa mặc giáp': 'No armor equipped',
  'Bấm để tháo · kéo từ Túi Đồ để mặc': 'Click to unequip · drag from Bag to equip',
  'Trang Bị': 'Equipment',
  // Materials & shop
  'Mảnh Trang Bị': 'Gear Shard', 'Tịch Ma Thạch': 'Demon-Seal Stone', 'Ấn Trấn Ải': 'Pass-Guard Seal',
  'Mảnh Cổ Thần': 'Ancient God Shard', 'Huyền Thiết': 'Mystic Iron', 'Sách Kỹ Năng →': 'Tomes →',
  'Thảo Dược': 'Herb', 'Thảo Dược Quý': 'Rare Herb', 'Phong Linh Phù': 'Spirit-Seal Charm',
  'Thiên Mệnh Phù': 'Fate Charm', '☂ Thiên Mệnh Phù': '☂ Fate Charm',
  'Bình Thuốc Đỏ': 'Red Potion', '🧪 Bình Thuốc Đỏ': '🧪 Red Potion',
  '🍶 Rượu Hổ Cốt': '🍶 Tiger Bone Wine', '🍶 RƯỢU HỔ CỐT': '🍶 TIGER BONE WINE',
  '⚡ Bùa Chắn Sét': '⚡ Thunder Escape Charm', '⚡ BÙA CHẮN SÉT': '⚡ THUNDER ESCAPE',
  '✚ Trị Thương Toàn Phần': '✚ Full Heal', '🛏 Nghỉ Trọ': '🛏 Rest at Inn',
  'Đoạt Mệnh Phù': 'Life-Seizing Talisman', 'Tu La Tinh Thạch': 'Asura Crystal', 'Hỗn Nguyên Thạch': 'Chaos Stone',
  '◆ Tu La Tinh Thạch': '◆ Asura Crystal', '❖ Hỗn Nguyên Thạch': '❖ Chaos Stone',
  '◎ Chúc Phúc Châu': '◎ Blessing Pearl', '◉ Linh Hồn Châu': '◉ Soul Pearl',
  '❤ Sinh Mệnh Châu': '❤ Life Pearl', '● Hỗn Độn Châu': '● Chaos Pearl',
  '✦ Huyền Thiết ×5': '✦ Mystic Iron ×5', 'Huyền Thiết ×5': 'Mystic Iron ×5',
  '◈ Đan Ascension Trial': '◈ Ascension Trial Pill', '◈ Đá Thăng Cấp ×3': '◈ Ascent Stone ×3',
  '⚔ Rương Binh Khí': '⚔ Weapon Chest', '⚔ Rương Binh Khí Tinh Tuyển': '⚔ Elite Weapon Chest',
  '🛡 Rương Phòng Cụ': '🛡 Armor Chest', 'bảo hiểm rèn': 'forge insurance', 'rèn +1~+11': 'forge +1~+11',
  'Mua thành công!': 'Purchase successful!',
  // Panels & buttons
  'SỔ KỸ NĂNG': 'SKILL CODEX', '☯ DUNG HỢP THẦN CÔNG': '☯ DIVINE FUSION',
 'Dung Hợp': 'Fusion',
  '⚔ Bắt Đầu Hành Trình': '⚔ Begin the Journey', 'Tiếp ▸': 'Next ▸', 'Đã học': 'Learned',
  'Thông Tin': 'Info', 'Rèn Luyện': 'Forge', 'Tăng Cường +': 'Enhance +',
  'Trang bị đã tối ưu!': 'Gear fully optimized!', 'Kỹ năng đã đạt cấp tối đa (Lv 120)!': 'Skill maxed (Lv 120)!',
  'Hướng dẫn hoàn tất — chúc hành trình phi nước đại!': 'Tutorial complete — ride on, hero!',
  'Console playtest — gõ /help để xem lệnh, Esc để đóng.': 'Playtest console — type /help for commands, Esc to close.',
  '" — gõ /help': '" — type /help',
  // System messages & status
  'Nhiệm vụ hoàn thành!': 'Quest complete!', 'Túi đồ đã đầy!': 'Bag is full!',
  'Túi thuốc đã đầy (tối đa 5 lọ)!': 'Potion bag full (max 5)!', 'Không đủ Mana!': 'Not enough Mana!',
 'Vẫn khỏe mạnh — không cần thuốc!': 'Still healthy — no potion needed!',
  'Lỗi:': 'Error:', 'Lệnh lạ "': 'Unknown command "', 'Không có map "': 'No such map "',
  'Map này không có trấn thủ.': 'This map has no guardian.',
  'CHOÁNG!': 'STUNNED!', 'CHẢY MÁU!': 'BLEEDING!', 'CHẬM!': 'SLOWED!',
  'VÔ TƯỚNG — toàn bộ chiêu đã hồi!': 'FORMLESS — all skills refreshed!',
  '✦ SONG THỦ HỖ BÁC — chiêu không hồi!': '✦ DUAL AMBIDEXTERITY — skills cost no cooldown!',
  '⚡ Liên Trảm — miễn phí Mana!': '⚡ Chain Strike — free Mana!',
  'BẤT TỬ: BẬT': 'GODMODE: ON', 'BẤT TỬ: TẮT': 'GODMODE: OFF',
  'PK: BẬT': 'PK: ON', 'PK: Tắt': 'PK: OFF',
  'ĐÃ MỞ VÙNG MỚI': 'NEW REGION UNLOCKED', '☯ BÁI SƯ THỤ NGHIỆP': '☯ TAKEN AS DISCIPLE',
  '⚑ Kết Bái': '⚑ Sworn Oath', '⚑ KIM LAN KẾT NGHĨA': '⚑ SWORN BROTHERHOOD',
 '⚔ PHỤC KÍCH!': '⚔ AMBUSH!', '⚔TRUY THÙ': '⚔ VENDETTA',
  '📖 LUẬN ĐẠO NGỘ PHÁP': '📖 DAO DISCOURSE', '🕊 HÒA GIẢI': '🕊 RECONCILED',
  '☯ Trưởng Tộc': '☯ Mentor', '☯ Hậu Bối': '☯ Protégé',
  '☬ TRẤN ẢI': '☬ PASS GUARDIAN', '⛨ THỦ VỆ': '⛨ WARDEN',
  'Thần Binh đã THỨC TỈNH — tối đa!': 'Divine Weapon AWAKENED — maxed!',
  'Ngũ Ấn:': 'Five Seals:', '⚑ Kết Bái': '⚑ Sworn Oath',
  // Mounts & stable
  'Xuất Chiến (V)': 'Summon (V)', 'Thu Hồi (V)': 'Recall (V)', 'Thú Cưỡi → tầng': 'Mount → tier',
  '→ tầng': '→ tier', 'Trại Chủ Mục Đồng': 'Stable Master', 'Trại Ngựa Ngoại Ô': 'Outskirts Stable',
  '(Nhận Emberhide Bull)': '(Claim Emberhide Bull)', 'thu phục thú tinh anh — bấm T': 'tame elite beasts — press T',
  // Relations & personality
  'Xa Lạ': 'Stranger', 'Quen Biết': 'Acquaintance', 'Hảo Hữu': 'Friend', 'Tri Kỷ': 'Confidant',
  'Chí Giao': 'Bosom Friend', 'Sinh Tử Chi Giao': 'Life-and-Death Bond',
  'Chính Trực': 'Righteous', 'Hào Sảng': 'Generous', 'Ngạo Mạn': 'Arrogant', 'Tà Mị': 'Wicked',
  'Âm Hiểm': 'Cunning', 'Ôn Hòa': 'Gentle', 'Si Tình': 'Devoted', 'Tham Lam': 'Greedy',
  'Trung Thành': 'Loyal', 'Túc Trí Đa Mưu': 'Resourceful',
  'ngay thẳng, trọng nghĩa khí': 'upright, values honor', 'cởi mở, thích kết giao bằng hữu': 'open, loves making friends',
  'đa tình, dễ rung động': 'romantic, easily moved', 'tham tài — quà càng quý càng trọng ngươi': 'greedy — the pricier the gift, the fonder',
  // Seasons & weather
  'Xuân': 'Spring', 'Hạ': 'Summer', 'Thu': 'Autumn', 'Đông': 'Winter',
  'Nắng đẹp': 'Clear skies', 'Nắng gắt': 'Scorching', 'Mưa phùn': 'Drizzle',
  'Mưa rào giông': 'Thunderstorm', 'Sương mù': 'Fog', 'Tuyết rơi': 'Snowfall',
  // Titles
  'Kẻ Diệt Trăm Quái': 'Slayer of a Hundred',
  'Kẻ Diệt Ngàn Quái': 'Slayer of a Thousand', 'Thợ Rèn Truyền Thuyết': 'Legendary Smith',
 'Bậc Thầy Resonance': 'Master of Resonance',
  'Tiêu diệt 100 quái': 'Slay 100 monsters', 'Tiêu diệt 1.000 quái': 'Slay 1,000 monsters',
  'Hoàn thành toàn bộ chính tuyến': 'Complete the entire main storyline',
 'Đỉnh cao mọi hệ thống': 'Pinnacle of all systems',
  // NPC roles
 'Trưởng Làng': 'Village Chief', 'Thợ Rèn': 'Blacksmith',
  'Dược Lão · Dược Phường': 'Herbalist · Pharmacy', 'Dược Sư': 'Apothecary', 'Dược Lão': 'Old Herbalist',
  'Thương Nhân · Chợ Đấu Giá': 'Merchant · Auction House', 'Thương Nhân': 'Merchant', 'Trà Quán Chủ': 'Teahouse Keeper',
  'Bổ Đầu · Truy Nã Lệnh': 'Constable · Bounties', 'Bổ Đầu': 'Constable',
  'Binh Khí Chủ · Vũ Khí Phường': 'Arms Dealer · Weapon Shop', 'Quản Gia · Nhà Riêng': 'Steward · Cave Estate',
  'Thần Toán Tử · Vạn Duyên Các': 'Diviner · Fate Pavilion', 'Biên Ải Vệ Binh': 'Border Guard',
  'Quách Đại Hiệp': 'Great Hero Guo', 'Tân Binh Tập Luyện': 'Recruit Training', 'Thử Tài Tân Thủ': 'Trial of the Novice',
  // Misc UI
  'Cấp →': 'Lv →', 'Sách Kỹ Năng →': 'Tomes →', '(Tối đa)': '(Max)',
  'mạnh nhất vùng, cẩn thận!': 'strongest in the region — beware!', 'yếu nhất, hợp luyện công': 'weakest — good for practice',
  'cấp trung bình': 'mid-tier', 'mục tiêu trong': 'target within', 'người chơi': 'player',
  'an toàn tuyệt đối 100%': '100% safe', 'lửa': 'fire', 'máu': 'blood',
  'Dã Ngoại · PK': 'Wilds · PK', 'Huyết Chiến · Free PK': 'Bloodbath · Free PK',
  'PK tự do, không Tội Ác — giết thoải mái.': 'Free PK, no Sin — kill at will.',
  'Giết Du Hiệp không tăng Tội Ác': 'Killing Wanderers adds no Sin',
  'Đứng yên nào.': 'Hold still.', 'Đến lượt ngươi.': 'Your turn.', 'Lên! Giết!': 'Charge! Kill!',
  'Ở lại cùng ta!': 'Stay with me!', 'Trăng lên rồi.': 'The moon is up.',
  '"Thuốc bổ hay thuốc độc — khác nhau ở liều lượng thôi, khách quân ạ."': '"Tonic or poison — only the dosage differs, dear guest."',
  'Bạc không phải vạn năng, nhưng không bạc thì... ngươi hiểu mà.': "Silver isn't everything — but without it... you know.",
  '3 phút +12% công lực — men say bừng bừng sát khí!': '3 min +12% power — drunk with killing intent!',
  'Mỗi màn chơi 1 lần: chết hồi sinh tại chỗ 50% máu': 'Once per run: revive on the spot at 50% HP',
  'Bản đồ thu nhỏ hiện cả điểm Thảo Dược': 'Minimap also shows Herb spots',
  'Tấn Phẩm & Kế Thừa — rơi từ quái/tinh anh': 'Promotion & Inheritance — drops from monsters/elites',
  'Khảm trang bị, rèn +7 trở lên — hiếm có': 'Socket gear, forge +7 and above — rare',
  'Rèn +10/+11 — cực hiếm': 'Forge +10/+11 — extremely rare',
  'rèn +7 trở lên · Áo Choàng': 'forge +7 and above · Cloak', 'rèn +10/+11 · Áo Choàng': 'forge +10/+11 · Cloak',
  'Gói tiết kiệm — chỉ bán theo đợt': 'Budget bundle — sold in batches only',
  'dung hợp Huyết Ma Thôn Phệ': 'fuse into Blood Demon Devour',
  'Bình Thuốc Đỏ hồi 55% máu (thay 40%)': 'Red Potion heals 55% HP (instead of 40%)',
  'Rèn đồ +5% tỉ lệ thành công': 'Forge +5% success rate',
  'MAX MODE — mọi tính năng tối đa!': 'MAX MODE — everything maxed!',
  // Cheat help lines
  '/god — bật/tắt bất tử': '/god — toggle godmode',
  '/kill [bán kính=350] — hạ quái quanh mình': '/kill [radius=350] — slay nearby monsters',
  '/learn — học toàn bộ Sổ Kỹ Năng': '/learn — learn the entire Codex',
  '/wipe — xóa save & tải lại game': '/wipe — erase save & reload',
  '/item [phẩm 0-4] [giai 1-10] — tạo trang bị vào túi': '/item [quality 0-4] [tier 1-10] — spawn gear into bag',
  // ── Side-quest panel chrome ──
  'Nhận Nhiệm Vụ': 'Accept Quest', 'Nhận Thưởng': 'Claim Reward',
  'Đang nhận tối đa 3 phụ tuyến — hoàn thành bớt rồi quay lại.': 'Max 3 active side quests — finish some, then come back.',
  'gặp': 'to meet',
  // ── Chapter subtitles ──
  // ── Main quest names (35 chương) ──
  'Thảo Dược Cứu Người': 'Herbs to Heal', 'Sói Dữ Quấy Phá': 'Wolves on the Prowl',
  'Rèn Luyện Sơ Nhập': 'First Steps at the Forge', 'Sơn Tặc Hoành Hành': 'Bandits Run Rampant',
  'Tuyệt Kỹ Truyền Thừa': 'The Sect\'s Legacy Art', 'Bình Cảnh Chi Chiến': 'Battle of the Threshold',
  'Kiếm Khách Bán Đảo': 'The Islet Swordsman', 'Tình Hoa Độc': 'Passion Flower Poison',
 'Cắt Đứt Tai Mắt': 'Severing Eyes and Ears', 'Cuồng Binh Xung Trận': 'Berserkers Charge the Line',
  // ── 50 phụ tuyến Lunacia — tên ──
  'Lễ Vật Đầu Xuân': 'New Year Tribute', 'Phương Thuốc Cứu Dịch': 'Plague-Remedy Prescription',
  'Sói Dữ Vây Làng': 'Wolves at the Gates', 'Hồ Ly Trộm Thuốc': 'The Medicine-Thieving Foxes',
  'Truy Kích Hắc Phong Dư Đảng': 'Hunt the Black Wind Remnants', 'Phá Trận Hồn': 'Breaking the Formation Souls',
  'Thuốc Cho Bà Cụ': 'Medicine for the Old Dame', 'Kẻ Đứng Sau Vụ Cướp': 'The Mastermind Behind the Raid',
  'Dọn Đường Lương Thực': 'Clear the Grain Road', 'Sói Hoành Ngoại Ô': 'Wolves Ravage the Outskirts',
  'Truy Nã Hắc Phong': 'Black Wind Wanted', 'Điểm Danh Nghĩa Sĩ': 'Muster of the Righteous',
  'Đoạt Cung Xạ': 'Seize the Bows', 'Biên Quan Huyết Chiến': 'Bloodbath at the Border', 'Kỳ Lân Cuồng Hỏa': 'Qilins of Raging Fire', 'Báo Tin Thắng Trận': 'News of Victory',
  'Lông Cáo Nhuộm Dược': 'Fox Fur for Dyeing', 'Thuốc Cho Thương Binh': 'Medicine for the Wounded',
  'Tuấn Mã Cho Tân Binh': 'Steeds for New Recruits', 'Nghiệt Kỵ': 'The Remnant Riders',
  // ── 50 phụ tuyến Lunacia — mô tả ──
  // ── Intro story (4 trang, text-node fragments) ──
  
  'cấp 10': 'Lv 10',
  'Rèn trang bị +11': 'Forge gear to +11', '— và cuối cùng,': '— and finally,',
  'Tiếp ▸': 'Next ▸',
  '⚔ Bắt Đầu Hành Trình': '⚔ Begin the Journey', 'Bắt Đầu Hành Trình': 'Begin the Journey',
  'Tiếp Tục Hành Trình': 'Continue the Journey',
  // ── Sect select / ceremony ──
  // ── The Hatching ──
  '🥚 The Hatching': '🥚 The Hatching',
  'LINH': 'SPIRIT',
  'Hắc Phong Sát': 'Black Wind Slayer', 'Hắc Phong Sát Thủ': 'Black Wind Chief',
  // ── 16 trait The Hatching ──
  'Thần Lực': 'Divine Strength', 'Nhục Thân Cường Tráng': 'Stalwart Body',
  'Ăn May': 'Born Lucky', 'Instinct Dồi Dào': 'Abundant Instinct',
  'Túc Trí Đa Mưu': 'Cunning Mind', 'Spark Thiên Phú': 'Spark Prodigy',
  'Bách Bộ Thần Hành': 'Hundred-Step Swiftness', 'Thiên Nhãn': 'Heavenly Eye',
  'Long Tích Hổ Bộ': 'Dragon Stride, Tiger Step', 'Đoạn Ngọc Thủ': 'Jade-Sundering Hand',
  'Sát Tâm': 'Killing Heart', 'Dược Thể': 'Herbal Body',
  'Võ Hồn': 'Martial Soul', 'Thiên Mệnh': 'Heaven\'s Mandate',
  'Khai Mở Mạch Lực': 'Open Channels', 'Vạn Vật Hữu Duyên': 'Fortune\'s Favorite',
  '+8 Tấn Công': '+8 Attack', '+55 Sinh Lực tối đa': '+55 Max HP',
 '+5% tỉ lệ quái rớt đồ': '+5% monster drop rate',
  'Venom Dart +15% Sát Thương · phá khiên lâu thêm 4s': 'Hidden Weapons +15% DMG · shield-break lasts 4s longer',
  'Giết Du Hiệp không tăng Tội Ác': 'Slaying Wandering Heroes grants no Sin',
  'Card +12% Sát Thương': 'Card +12% Damage', '+15% Bạc rơi': '+15% silver drops',
  // ── Tính cách ──
  'Chính Trực': 'Righteous', 'Tà Khí': 'Heretical', 'Trung Dung': 'Balanced',
  '⌨ Phím Space': '⌨ Space key',
  'Đòn đánh thường': 'Basic attack',
  'tiến hóa bậc': 'evolution stage',
};

/* ---- Bổ sung dịch: nhiệm vụ chính tuyến/phụ tuyến + kỹ năng/kỹ năng ---- */
Object.assign(EXACT, {
  // ── Main quest descriptions (34) ──
  // ── Old side quests: 12 names + 16 descs ──
  // ── Võ Học: 46 names ──
  
  
  
  // ── Võ Học: 46 descs ──
  'Bị động: 30% chiêu vừa tung không tốn hồi chiêu.': 'Passive: 30% chance a cast skill costs no cooldown.',
  'Bị động: chết tự hồi sinh 50% Sinh Lực — mỗi 300s một lần.': 'Passive: revive at 50% HP on death — once every 300s.',
  'Phá kiếm thức — một kiếm bỏ qua phòng thủ, cắt đứt chiêu địch.': "Sword-breaking stance — one stroke ignores defense and severs the foe's move.",
  // ── Dung Hợp: 30 names ──
  // ── Dung Hợp: 30 descs ──
  
  // ── SKILL_DEFS names + descs ──
  'Venom Dart': 'Venom Dart',
  'Rupture Bolt': 'Rupture Bolt',
  
  'Piercing Arrow': 'Piercing Arrow',
  'Soul Rend': 'Soul Rend',
  // ── PASSIVE_SKILLS: 6 names + 6 descs ──
  'Archery (bị động)': 'Archery (passive)',
  'Huyết Ma Thôn Phệ': 'Blood Demon Devour',
  // ── Sect skill names (16) ──

  // ── Sect flavor descs (8) ──
  // ── Schools & misc ──

  
  'Sổ Kỹ Năng': 'Skill Codex',
  '+8% Kinh Nghiệm': '+8% EXP',
  '+6% Tốc Chạy': '+6% Move Speed',
});

/* ---- REGEX rules for dynamic/templated strings ---- */

/* ---- Bổ sung 2: chrome panel Kỹ Năng / Sổ Kỹ Năng / Dung Hợp ---- */
Object.assign(EXACT, {
  '+2,5% Sát Thương': '+2.5% DMG',
  'Thành Thạo': 'Proficient',
  'Tinh Thông': 'Expert',
  'Điêu Luyện': 'Skilled',
  'Lão Luyện': 'Veteran',
  'Bậc Thầy': 'Master',
  'Đại Sư': 'Grandmaster',
  'Kỹ năng': 'Skills',
  'kỹ năng phái khác': "another sect's art",
  // categories
  'Kiếm': 'Sword', 
 'Bổng': 'Staff', 'Tâm Pháp': 'Heart Art', 'Thân Pháp': 'Movement',
  // fusion origins
});

Object.assign(EXACT, {
  'Hộ Thể': 'Body Guard',
  'Đao': 'Blade',
  'Thượng': 'Upper', 'Trung': 'Mid', 'Hạ': 'Lower',
  '+5% Né Tránh': '+5% Dodge',
  '+8% Kinh Nghiệm': '+8% EXP',
  '+6% Tốc Chạy': '+6% Move Speed',
});

/* ---- Character panel (renderChar) + Character-panel wrapper/tabs ---- */
Object.assign(EXACT, {
  'Điểm tiềm năng còn:': 'Potential points left:',
  'mỗi cấp +5': '+5 per level',
  'Tốc đánh, bạo kích, né tránh': 'Attack speed, crit, dodge',
  'Giảm sát thương nhận vào': 'Reduces damage taken',
  'THUỘC TÍNH CHIẾN ĐẤU': 'COMBAT STATS',
  'Giảm Thương': 'Dmg Reduction',
  'Tốc Đánh': 'Atk Speed',
  'CHIÊU THỨC': 'SKILLS',
  '☠ Huyết Ma Thôn Phệ (sách kỹ năng)': '☠ Blood Demon Devour (secret manual)',
  'hút 10% Sát Thương': 'drains 10% DMG',
  'DANH HIỆU — bấm để chọn danh hiệu hiển thị trên đỉnh đầu': 'TITLES — click to choose the title shown above your head',
  'Mở khóa = cộng dồn chỉ số vĩnh viễn (không cần trang bị). Bấm lần nữa vào danh hiệu đang hiển thị để ẩn.': 'Unlocking grants a permanent stat bonus (no need to equip). Click your displayed title again to hide it.',
  'chọn': 'select',
  'sách kỹ năng': 'skill tome',
  'Rèn thành công +11': 'Successfully forge to +11',
  'Khách Lạ Lunacia': 'Newcomer to Lunacia',
  // Title stat lines (titleStatText output, wrapped as "— {this}" by renderChar)
  '+5% Công': '+5% ATK', '+10% Bạo': '+10% Crit',
  '+5% tỉ lệ rèn': '+5% forge rate', '+10% Toàn TT': '+10% All Stats', '+15% Toàn TT': '+15% All Stats',
  // Divine Weapon tier names (TB_TIER_NAMES) — classic cultivation-stage flavor, distinct from the
  // player's own Ascension realms above
  'Lõi Nguyên Tố': 'Elemental Core',
  'Hạ 10 Chimera': 'Slay 10 Chimeras',
  'Thu 1 Lõi Nguyên Tố': 'Collect 1 Elemental Core',
  'Thông quan 1 phó bản': 'Clear 1 dungeon',
  'Rèn / nâng tầng / khảm ngọc 1 lần': 'Forge / advance a tier / socket a jewel once',
  // Character-panel wrapper (renderCharPanel) + CHAR_TABS
  'Thú Chiến': 'War Beast',
  'Thuần Thục': 'Mastery',
  'Thuần Thục — 7 Tầng': 'Mastery — 7 Stages',
  '🔄 Tái Sinh': '🔄 Reset',
  'Tái Sinh': 'Reset',
  'Đài Hội Lực': 'Confluence Dais',
  'Vườn Thảo Dược': 'Herb Garden',
  'Cỏ Hồi Máu': 'Bloodroot',
  'Cỏ Bản Năng': 'Instinct Grass',
  'Cỏ Bạc': 'Silverleaf',
  'Kẻ Báo Thù': 'Avenger',
  'Khách Lạ Lunacia': 'Stranger to Lunacia',
  'TỈ LỆ CÔNG KHAI — KHÔNG CỘNG DỒN MAY MẮN': 'PUBLISHED RATES — NO PITY',
  'Suối Ký Ức': 'Spring of Memory',
  'Kẻ Được Định Mệnh Chọn': 'Chosen by Fate',
});

/* ---- Forge / Mount / Ascension / Instinct Channels / Card — sub-panels reachable from Character ---- */
Object.assign(EXACT, {
  'Hãy tiếp tục làm nhiệm vụ!': 'Keep questing!',
  '✦ Huyền Thiết': '✦ Mystic Iron',
  '◆ Tu La': '◆ Asura',
  '❖ Hỗn Nguyên': '❖ Chaos',
  'Chưa có trang bị nào.': 'You have no equipment yet.',
  'Phá Thiên Kiếp': 'Heaven-Rending Trial',
  'Tông Sư Thợ Rèn': 'Grandmaster Smith',
  '◉ Linh Hồn': '◉ Soul',
  '❤ Sinh Mệnh': '❤ Life',
  '● Hỗn Độn': '● Chaos',
  'Chinh Phạt': 'Campaign',
  // Mount (Thú Chiến)
  // Bốn bộ Cổ Thần Thủ Hộ — danh từ riêng Vaeldra, giữ nguyên ở mọi ngôn ngữ
  'Sarkaan': 'Sarkaan',
  'Velmyr': 'Velmyr',
  'Ashvard': 'Ashvard',
  'Korrveth': 'Korrveth',
  // Card (Di Sản)
  'Chưa rèn giũa — nâng lên Tầng 1 để khai mở!': 'Not yet trained — advance to Stage 1 to unlock!',
});

/* ---- Settings panel (renderSettings) ---- */
Object.assign(EXACT, {
  'Cài Đặt': 'Settings',
  'BẬT': 'ON',
  'TẮT': 'OFF',
  '🎵 Nhạc nền': '🎵 Music',
  '🔔 Hiệu ứng âm thanh': '🔔 Sound Effects',
  '🗺 Bản đồ thu nhỏ': '🗺 Minimap',
  'phím U': 'key U',
  '🏷 Tên quái vật': '🏷 Monster Names',
  '📳 Rung màn hình': '📳 Screen Shake',
  'mặc định tắt': 'off by default',
  'máy yếu': 'weak devices',
  '— ⚔ TỰ ĐÁNH (phím Z) —': '— ⚔ AUTO FARM (key Z) —',
  '🗡 Tự tung kỹ năng trên taskbar': '🗡 Auto-cast taskbar skills',
  '🧪 Tự uống Bình Thuốc Đỏ': '🧪 Auto-drink Red Potion',
  '❤ Uống thuốc khi Sinh Lực dưới': '❤ Drink potion when HP below',
  '🎯 Tầm quét quanh điểm neo': '🎯 Scan range around anchor point',
  '👹 Tự đánh cả Trùm': '👹 Auto-fight bosses too',
  'nguy hiểm — mặc định tắt, trùm tự mình quyết!': 'risky — off by default, boss fights are on you!',
  'XÓA SAVE': 'WIPE SAVE',
  'Âm thanh sẽ phát sau thao tác đầu tiên của bạn (quy định trình duyệt). Mọi cài đặt được lưu tự động.': 'Sound will start playing after your first action (browser policy). All settings are saved automatically.',
});

/* ---- General coverage sweep: Inventory (renderInv) + Bag (renderBag) ---- */
Object.assign(EXACT, {
  '⚡ Mặc Đồ Tốt Nhất': '⚡ Equip Best Gear',
  'Túi trống — hãy đi cày quái!': 'Bag is empty — go farm some monsters!',
  'Mặc Vào': 'Equip',
});

/* ---- General coverage sweep: Quest Log (renderQlog) ---- */
Object.assign(EXACT, {
  'Nhật Ký Nhiệm Vụ': 'Quest Log',
  '★ Chính Tuyến': '★ Main Quest',
  '◈ Phụ Tuyến': '◈ Side Quests',
  '📜 Nhật Ký': '📜 Journal',
  '🧭 Tới Ngay': '🧭 Go Now',
  '🔍 Manh Mối': '🔍 Clues',
});

const RULES = [
  [/^Cấp (\d+)$/, 'Lv $1'],
  [/^Cấp (\d+) → (\d+)$/, 'Lv $1 → $2'],
  [/^Ascension bậc (\d+) \((.*)\)$/, (m, a, b) => `Ascension Lv ${a} (${tr(b)})`],
  [/^Chương ([IVX]+) · (.*)$/, (m, a, b) => `Chapter ${a} · ${tr(b) === b ? b : tr(b)}`],
  [/^Bảo Hạp ([IVX]+)$/, 'Relic Chest $1'],
  [/^(.+) tầng (\d+) \(Card\)$/, (m, a, b) => `${tr(a)} — tier ${b} (Card)`],
  [/^(.+) \((bị động)\)$/, (m, a) => `${tr(a)} (passive)`],
  [/^Thú Cưỡi → tầng (\d+)$/, 'Mount → tier $1'],
  [/^(\d+)\/7 ấn đã vỡ\.$/, '$1/7 seals broken.'],
  [/^(.+) ×(\d+)$/, (m, a, b) => `${tr(a)} ×${b}`],
  [/^×(\d+) (.*)$/, (m, a, b) => `×${a} ${trFrag(b)}`],
  [/^\+(\d+) Lực · \+(\d+) Mẫn · \+(\d+) Cốt · \+(\d+) Thể$/, (m, a, b, c, d) => `+${a} STR · +${b} AGI · +${c} DEF · +${d} VIT`],
  [/^\+(\d+)% (.*)$/, (m, a, b) => `+${a}% ${trFrag(b)}`],
  [/^\+(\d+) (.*)$/, (m, a, b) => `+${a} ${trFrag(b)}`],
  [/^(\d+) phút (.*)$/, (m, a, b) => `${a} min: ${trFrag(b)}`],
  [/^(\d+)s (.*)$/, (m, a, b) => `${a}s: ${trFrag(b)}`],
  [/^Bị động: (.*)$/, (m, a) => `Passive: ${trFrag(a)}`],
  [/^rèn \+(\d+)(.*)$/, (m, a, b) => `forge +${a}${trFrag(b)}`],
  [/^Tàn Quyển \((.*)\)$/, (m, a) => `Fragment (${a})`],
  [/^Phó Bản · (.*)$/, (m, a) => `Dungeon · ${a}`],
  [/^(.+) · Vách Té Núi$/, (m, a) => `${tr(a)} · Cliff of Fortune`],
  [/^Qua Cổng (.*) → (.*)$/, (m, a, b) => `Through ${a} Gate → ${tr(b)}`],
  [/^Đạt cấp (\d+)$/, 'Reach Lv $1'],
  [/^Đã hạ$/, 'Slain'],
    [/^cần cấp (\d+)$/i, 'requires Lv $1'],
  [/^Lễ Bạc (\d+)◈$/, 'Gift $1◈ silver'],
  // ── Side-quest panel dynamic strings ──
  [/^Thưởng: (.+)$/, (m, a) => `Reward: ${tr(a)}`],
  [/^Tiến độ: (.*?) · Thưởng: (.+)$/, (m, a, b) => `Progress: ${tr(a)} · Reward: ${tr(b)}`],
  [/^Cần cấp (\d+) · Tiến độ chính tuyến chưa đủ$/, 'Requires Lv $1 · Main story progress not reached'],
  [/^◈ (.+)$/, (m, a) => `◈ ${tr(a)}`],
  [/^✔ (.+)$/, (m, a) => `✔ ${tr(a)}`],
  [/^🔒 (.+)$/, (m, a) => `🔒 ${tr(a)}`],
  [/^(.+) — Hoàn thành!$/, (m, a) => `${tr(a)} — Completed!`],
  [/^★ Chính tuyến (\d+): (.+)$/, (m, a, b) => `★ Main Quest ${a}: ${tr(b)}`],
  [/^★ Chính tuyến hiện tại: "(.+)" — hãy đến$/, (m, a) => `★ Current main quest: "${tr(a)}" — go to`],
  [/^Phụ tuyến hoàn thành — về gặp (.+)$/, (m, a) => `Side quest complete — return to ${tr(a)}`],
  [/^Hoàn thành phụ tuyến: (.+)!$/, (m, a) => `Side quest complete: ${tr(a)}!`],
  [/^(.+?) (\d+)\/(\d+)$/, (m, a, b, c) => `${tr(a)} ${b}/${c}`],
  // ── The Hatching dynamic ──
  [/^— Mảnh (\d+) —$/, '— Shard $1 —'],
  [/^🥚 Ấp Lại Ổ Trứng \(còn (\d+)\)$/, '🥚 Re-nest the Eggs ($1 left)'],
  [/^Đã chọn (\d+)\/3 mảnh$/, 'Picked $1/3 shards'],
  [/^🥚 The Hatching: (.+)$/, (m, a) => `🥚 The Hatching: ${a.split(' · ').map(tr).join(' · ')}`],
  [/^🥚 The Hatching ban cho người cũ — xem ở panel Nhân Vật!$/, '🥚 The Hatching grants returning heroes their traits — see the Character panel!'],
// ── Skill/sect dynamic templates ──
  [/^(.+?) — chiêu thức nhập môn (.+)\.$/, (m, a, b) => `${tr(a)} — entry art of ${tr(b)}.`],
  [/^(.+?) — Trấn Phái tuyệt kỹ (.+), sát thương lan\.$/, (m, a, b) => `${tr(a)} — ${tr(b)}'s signature ultimate, splash damage.`],
  [/^Dung hợp: (.+?) — (.+?) \+ (\d+) 📜 \(bấm K\)$/, (m, a, b, c) => `Fusion: ${a.split(' + ').map(t => tr(t)).join(' + ')} — ${tr(b)} + ${c} 📜 (press K)`],
  [/^cấp (\d+)$/, 'Lv $1'],
  [/^Sách Kỹ Năng Phiêu Bạt — (.+)$/, (m, a) => `Drifter's Skill Book — ${tr(a)}`],
// ── Skill panel chrome dynamic ──
  [/^\[(\d+): trống\]$/, '[$1: empty]'],
  [/^🔒 Mở khóa ở cấp (\d+)$/, '🔒 Unlocks at Lv $1'],
  [/^Mở khóa ở cấp (\d+)$/, 'Unlocks at Lv $1'],
  [/^🔒 cấp (\d+)$/, '🔒 Lv $1'],
  [/^🔒 (.+)$/, (m, a) => `🔒 ${tr(a)}`],
  [/^(\d+): (.+) ✕$/, (m, a, b) => `${a}: ${tr(b)} ✕`],
  [/^Học · (\d+)📜$/, 'Learn · $1📜'],
  [/^☯ Dung Hợp · (\d+)📜$/, '☯ Fuse · $1📜'],
  [/^(.+?) · (.+?) — bấm K gán vào taskbar$/, (m, a, b) => `${tr(a)} · ${tr(b)} — press K to assign to the taskbar`],
  [/^Cấp kỹ năng ≤ cấp nhân vật \((\d+)\)$/, 'Skill level ≤ character level ($1)'],
  [/^Cần ([\d.,]+) bạc$/, 'Need $1 silver'],
  [/^\s*· (\d+) mana · (.+)$/, (m, a, b) => ` · ${a} Mana · ${b}`],
  // Map panel "Đang ở: <map> · <zone type> ·" status line: zt.name sits alone between two ` · `
  // markers, but Dã Ngoại · PK / Huyết Chiến · Free PK already contain a `·` themselves, so the
  // generic ` · (.+)` splitter below mis-splits on the zone type's own separator. Match the exact
  // zone-type names first so they translate as one unit.
  [/^· (An Toàn|Dã Ngoại · PK|Huyết Chiến · Free PK|Phó Bản) ·$/, (m, a) => `· ${tr(a)} ·`],
  [/^\s*· (.+)$/, (full, a) => { const j = a.split(' · ').map(p => tr(p)).join(' · '); return j === a ? full : ' · ' + j; }],
  [/^— (.+) —$/, (full, a) => { const t = tr(a); return t === a ? full : `— ${t} —`; }],
  [/^Cấp (\d+)\/120(?: · (.+?))? — nâng: ([\d.,]+) bạc, \+2,5% Sát Thương(?: · mốc kế (.+?) \(cấp (\d+)\): (.+?))? · cấp kỹ năng ≤ cấp nhân vật$/,
    (m, lv, cur, cost, nm, nmlv, mst) => {
      const ms = mst ? mst.replace('sát thương', 'DMG').replace('hồi chiêu', 'cooldown').replace('tiêu hao Mana', 'Mana cost') : '';
      return `Lv ${lv}/120${cur ? ' · ' + tr(cur) : ''} — upgrade: ${cost} silver, +2.5% DMG${nm ? ` · next milestone ${tr(nm)} (Lv ${nmlv}): ${ms}` : ''} · skill level ≤ character level`;
    }],
  // ── Character panel + sub-panels (renderChar/renderSettings + Forge/Mount/Ascension/Card) ──
  [/^Nhân Vật — (.+) Cấp (\d+)$/, (m, a, b) => `Character — ${tr(a)} Lv ${b}`],
  [/^hiện cấp (\d+)$/, 'currently Lv $1'],
  [/^☯ QUẺ TIÊN THIÊN · (.+)$/, (m, a) => `☯ THE HATCHING · ${tr(a)}`],
  [/^Trấn Phái: (.+)$/, (m, a) => `Signature Art: ${tr(a)}`],
  [/^(\d+) — (.+)$/, (m, a, b) => `${a} — ${tr(b)}`],
  [/^⚔ THẦN BINH — (.+)$/, (m, a) => `⚔ DIVINE WEAPON — ${tr(a)}`],
  [/^(.+?) · Tầng (\d+)【(.+?)】( — ĐÃ THỨC TỈNH ✦)?$/, (m, a, b, c, d) => `${tr(a)} · Stage ${b}【${tr(c)}】${d ? ' — AWAKENED ✦' : ''}`],
  [/^Luyện lên tầng (\d+)【(.+?)】$/, (m, a, b) => `Advance to Stage ${a}【${tr(b)}】`],
  [/^Lõi Nguyên Tố (\S+)/, (m, e) => `Elemental Core ${m1El(e)}`],
  [/^Cần: (\d+) Lõi Nguyên Tố \(có (\d+)\) \+ (\d+) Huyền Thiết \(có (\d+)\)$/, (m, a, b, c, d) => `Need: ${a} Elemental Core (have ${b}) + ${c} Mystic Iron (have ${d})`],
  [/^Thiếu nguyên liệu: cần (\d+) Lõi Nguyên Tố \+ (\d+) Huyền Thiết$/, (m, a, b) => `Missing materials: need ${a} Elemental Core + ${b} Mystic Iron`],
  [/^Dùng Thiên Mệnh Phù — xịt vẫn giữ nguyên cấp \(còn (\d+)\)$/, (m, a) => `Use a Fate Charm — a failure still keeps your level (${a} left)`],
  [/^Lên \+1 với 50% — thất bại tụt 1 cấp \(áp dụng đến \+10, kể cả Phá Thiên Kiếp\)$/, '+1 at 50% success — failure drops 1 level (applies up to +10, including the Heaven-Rending Trial)'],
  [/^Giai (\d+)\/(\d+)$/, 'Tier $1/$2'],
  [/^Giai (\d+): (.+)$/, (m, a, b) => `Tier ${a}: ${tr(b)}`],
  [/^Thăng Giai → (.+)$/, (m, a) => `Advance Tier → ${tr(a)}`],
  [/^Cần đạt cấp (\d+) để thăng (.+)$/, (m, a, b) => `Need to reach Lv ${a} to advance to ${tr(b)}`],
  [/^PHỤ TUYẾN — (.+)$/, (m, a) => `SIDE QUESTS — ${a}`],
  [/^Cần cấp (\d+) mới thăng được!$/, 'Need Lv $1 to advance!'],
  [/^Thợ Rèn Truyền Thuyết: \+(\d+)% tỉ lệ$/, (m, a) => `Legendary Smith: +${a}% rate`],
  [/^NỘI ĐAN YÊU THÚ — Thôn Phệ \(hôm nay còn (\d+)\/3 lần\)$/, (m, a) => `BEAST INNER CORES — Devour (${a}/3 left today)`],
  [/^(\d+)\/7 Vệ Thần đã hạ$/, (m, a) => `${a}/7 Guardian Spirits slain`],
  [/^🗺 (.+) — vùng khác, mở Bản Đồ \(M\)$/, (m, a) => `🗺 ${tr(a)} — different region, open the Map (M)`],
  // Travel zone banner (travelTo()'s zoneBanner.sub): ZONE_TYPES[...].name is concatenated with
  // the map's desc into one "<zone type> — <desc>" string before it ever reaches this translator,
  // so neither the EXACT entry for the zone-type name alone nor a generic rule would catch it.
  // The 4 alternatives are ZONE_TYPES's exact `name` values (game.js).
  [/^(An Toàn|Dã Ngoại · PK|Huyết Chiến · Free PK|Phó Bản) — (.+)$/, (m, a, b) => `${tr(a)} — ${tr(b)}`],
  // ── Generic wrapper rules — kept last so more specific patterns above always win first ──
  [/^\((.+)\)$/, (m, a) => `(${tr(a)})`],
  [/^【(.+)】$/, (m, a) => `【${tr(a)}】`],
  [/^— (.+)$/, (m, a) => `— ${tr(a)}`],
];

/* ---- core translate ---- */
// tr() is a pure string->string mapping (no game-state dependency), so its result for a given
// input never changes within a page load — memoize it. Canvas text (mob nameplates, floating
// damage numbers) redraws the same strings every frame at 60fps, and without this each call
// falls through the EXACT dictionary miss into a full linear scan of the RULES regex list.
const _trCache = new Map();
function tr(s) {
  if (lang !== 'en' || !s || typeof s !== 'string') return s;
  const cached = _trCache.get(s);
  if (cached !== undefined) return cached;
  const result = trCompute(s);
  if (_trCache.size > 5000) _trCache.clear(); // safety cap; rules are static so a clear just costs a few recomputes
  _trCache.set(s, result);
  return result;
}
function trCompute(s) {
  if (Object.prototype.hasOwnProperty.call(EXACT, s)) return EXACT[s];
  const t2 = s.trim();
  if (t2 !== s && Object.prototype.hasOwnProperty.call(EXACT, t2)) return s.replace(t2, EXACT[t2]);
  // Text node trải nhiều đoạn (template literal HTML — đoạn văn cách nhau bằng dòng trống): dịch từng đoạn
  if (/\n\s*\n/.test(s)) {
    const joined = s.split(/(\n\s*\n)/).map(p => (/^\n/.test(p) ? p : tr(p))).join('');
    if (joined !== s) return joined;
  }
  for (const [re, rep] of RULES) {
    const m = s.match(re);
    if (m) return typeof rep === 'function' ? rep(...m) : s.replace(re, rep);
  }
  return s;
}

/* ---- canvas patch: translate all text drawn to canvas ---- */
for (const meth of ['fillText', 'strokeText', 'measureText']) {
  const orig = CanvasRenderingContext2D.prototype[meth];
  CanvasRenderingContext2D.prototype[meth] = function (t, ...rest) {
    return orig.call(this, lang === 'en' ? tr(String(t)) : t, ...rest);
  };
}

/* ---- native dialog patch: window.confirm()/alert() bypass the DOM entirely, so the
   MutationObserver below never sees their text — translate the message up front instead
   (e.g. the Settings panel's "wipe save" confirmation). ---- */
{
  const origConfirm = window.confirm, origAlert = window.alert;
  window.confirm = function (msg) { return origConfirm.call(window, lang === 'en' ? tr(String(msg)) : msg); };
  window.alert = function (msg) { return origAlert.call(window, lang === 'en' ? tr(String(msg)) : msg); };
}

/* ---- DOM observer: translate text nodes & common attributes ---- */
let busy = false;
function trNode(n) {
  if (n.__ghhaI18n) return;
  const v = n.nodeValue;
  if (!v) return;
  const t = tr(v.trim()) === v.trim() ? v : v.replace(v.trim(), tr(v.trim()));
  if (t !== v) { busy = true; n.nodeValue = t; busy = false; n.__ghhaI18n = true; }
}
function trAttrs(root) {
  const els = root.querySelectorAll ? root.querySelectorAll('[title],[placeholder]') : [];
  els.forEach(el => {
    for (const at of ['title', 'placeholder']) {
      const v = el.getAttribute(at);
      if (v && tr(v) !== v) { busy = true; el.setAttribute(at, tr(v)); busy = false; }
    }
  });
}
function walk(root) {
  if (root.nodeType === 3) { trNode(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = w.nextNode())) nodes.push(n);
  for (const nd of nodes) trNode(nd);
  trAttrs(root);
}
const obs = new MutationObserver(muts => {
  if (lang !== 'en' || busy) return;
  for (const m of muts) {
    if (m.type === 'characterData') { m.target.__ghhaI18n = false; trNode(m.target); }
    else m.addedNodes.forEach(nd => walk(nd));
  }
});
function boot() {
  obs.observe(document.body, { subtree: true, childList: true, characterData: true });
  if (lang === 'en') walk(document.body);
  addToggle();
}

/* ---- language toggle (start screen & in-game) ---- */
function addToggle() {
  if (document.getElementById('ghha-lang-toggle')) return;
  const b = document.createElement('button');
  b.id = 'ghha-lang-toggle';
  b.textContent = lang === 'en' ? '🇻🇳 VI' : '🇬🇧 EN';
  b.title = 'Language / Ngôn ngữ';
  // Góc trái-dưới, và CHỈ ở màn chờ. top:8px + left:50% là ĐÚNG cùng điểm neo với #hud-map
  // (top:12px, left:50%) nên viên "🇻🇳 VI" đè thẳng lên tên vùng ở mọi độ phân giải — cắt
  // "Wilds" thành "Wild". Trong game thì bốn góc đều đã có chủ (nhất là ở 390px, nơi HUD chiếm
  // gần hết màn hình), nên startGame() giấu chip này đi và bảng Cài Đặt nhận việc đổi ngôn ngữ.
  b.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:99999;'
    + 'padding:4px 12px;border-radius:999px;border:1px solid #8a6d3b;background:rgba(29,23,18,.92);'
    + 'color:#f0d68a;font:700 12px/1.4 system-ui,sans-serif;cursor:pointer;opacity:.9;pointer-events:auto';
  b.onmouseenter = () => { b.style.opacity = '1'; };
  b.onmouseleave = () => { b.style.opacity = '.9'; };
  b.onclick = () => window.ghhaSwitchLang();
  document.body.appendChild(b);
}
// Bảng Cài Đặt gọi lại đúng hàm này — đổi ngôn ngữ là việc làm một lần, không đáng chiếm một
// góc màn hình suốt trận. Chip nổi chỉ còn phục vụ màn chờ, trước khi vào game.
window.ghhaSwitchLang = function(){
  const nl = lang === 'en' ? 'vi' : 'en';
  const ask = nl === 'en'
    ? 'Switch to English?\nThe game will reload (progress is saved automatically).'
    : 'Chuyển sang Tiếng Việt?\nGame sẽ tải lại (tiến trình đã tự lưu).';
  if (confirm(ask)) { try { localStorage.setItem(KEY, nl); } catch (e) {} location.reload(); }
};
window.ghhaLang = function(){ return lang; };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
