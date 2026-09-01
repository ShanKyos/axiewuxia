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
  ['hút sinh lực','life steal'],['hút mana','Qi steal'],['hút','drain'],
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
  'HUYỄN ẢNH CHÍ TÔN': 'SUPREME PHANTOM',
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
  'Tiểu Thành': 'Minor Success', 'Đại Thành': 'Major Success', 'Viên Dung': 'Perfection',
  // Realms (NAMING_MAP.md §2: Đan Điền → Ascension; source strings are now English loanwords
  // dropped into Vietnamese grammar, so most bare terms need no EXACT entry — only the ones
  // still paired with a Vietnamese word (Cảnh/Trung Kỳ/Hậu Kỳ) need translating.
  'Molt': 'Molt', 'Radiant Core': 'Radiant Core', 'Starforged': 'Starforged',
  'Resonance · Trung Kỳ': 'Resonance · Mid', 'Resonance · Hậu Kỳ': 'Resonance · Late',
  'Resonance Trung Kỳ': 'Resonance · Mid', 'Resonance Hậu Kỳ': 'Resonance · Late',
  'Tiến Cấp Đan': 'Advance Pill',
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
  'Hồ Lô Thuốc': 'Potion Gourd', '🧪 Hồ Lô Thuốc': '🧪 Potion Gourd',
  '🍶 Rượu Hổ Cốt': '🍶 Tiger Bone Wine', '🍶 RƯỢU HỔ CỐT': '🍶 TIGER BONE WINE',
  '⚡ Bùa Chắn Sét': '⚡ Thunder Escape Charm', '⚡ BÙA CHẮN SÉT': '⚡ THUNDER ESCAPE',
  '✚ Trị Thương Toàn Phần': '✚ Full Heal', '🛏 Nghỉ Trọ': '🛏 Rest at Inn',
  'Đoạt Mệnh Phù': 'Life-Seizing Talisman', 'Tu La Tinh Thạch': 'Asura Crystal', 'Hỗn Nguyên Thạch': 'Chaos Stone',
  '◆ Tu La Tinh Thạch': '◆ Asura Crystal', '❖ Hỗn Nguyên Thạch': '❖ Chaos Stone',
  '◎ Chúc Phúc Châu': '◎ Blessing Pearl', '◉ Linh Hồn Châu': '◉ Soul Pearl',
  '❤ Sinh Mệnh Châu': '❤ Life Pearl', '● Hỗn Độn Châu': '● Chaos Pearl',
  '✦ Huyền Thiết ×5': '✦ Mystic Iron ×5', 'Huyền Thiết ×5': 'Mystic Iron ×5',
  '◈ Đan Ascension Trial': '◈ Ascension Trial Pill', '◈ Tiến Cấp Đan ×3': '◈ Advance Pill ×3',
  '⚔ Rương Binh Khí': '⚔ Weapon Chest', '⚔ Rương Binh Khí Tinh Tuyển': '⚔ Elite Weapon Chest',
  '🛡 Rương Phòng Cụ': '🛡 Armor Chest', 'bảo hiểm rèn': 'forge insurance', 'rèn +1~+11': 'forge +1~+11',
  'Mua thành công!': 'Purchase successful!',
  // Panels & buttons
  'SỔ KỸ NĂNG': 'SKILL CODEX', '☯ DUNG HỢP THẦN CÔNG': '☯ DIVINE FUSION',
 'Dung Hợp': 'Fusion',
  '⚔ Bắt Đầu Hành Trình': '⚔ Begin the Journey', 'Tiếp ▸': 'Next ▸', 'Đã học': 'Learned',
  'Thông Tin': 'Info', 'Rèn Luyện': 'Forge', 'Tăng Cường +': 'Enhance +',
  'Ô trống — bấm để gán kỹ năng (K)': 'Empty slot — click to assign a skill (K)',
  'Trang bị đã tối ưu!': 'Gear fully optimized!', 'Kỹ năng đã viên mãn (Lv 120)!': 'Skill maxed (Lv 120)!',
  'Mang trang bị đến lò rèn (phím F) và Tăng Cường một món bất kỳ lên +3.': 'Bring gear to the Forge (F) and Enhance any item to +3.',
  'Hướng dẫn hoàn tất — chúc hành trình phi nước đại!': 'Tutorial complete — ride on, hero!',
  'Console playtest — gõ /help để xem lệnh, Esc để đóng.': 'Playtest console — type /help for commands, Esc to close.',
  '" — gõ /help': '" — type /help',
  // System messages & status
  'Nhiệm vụ hoàn thành!': 'Quest complete!', 'Túi đồ đã đầy!': 'Bag is full!',
  'Túi thuốc đã đầy (tối đa 5 lọ)!': 'Potion bag full (max 5)!', 'Không đủ Mana!': 'Not enough Mana!',
 'Vẫn khỏe mạnh — không cần thuốc!': 'Still healthy — no potion needed!',
  'Đã gỡ Trọng Thương — có thể Té Núi ngay': 'Heavy Wound cleared — you can cliff-jump now',
  'Lỗi:': 'Error:', 'Lệnh lạ "': 'Unknown command "', 'Không có map "': 'No such map "',
  'Map này không có trấn thủ.': 'This map has no guardian.',
  'CHOÁNG!': 'STUNNED!', 'CHẢY MÁU!': 'BLEEDING!', 'CHẬM!': 'SLOWED!',
 'Stone Skin': 'Stone Skin',
  'VÔ TƯỚNG — toàn bộ chiêu đã hồi!': 'FORMLESS — all skills refreshed!',
  '✦ SONG THỦ HỖ BÁC — chiêu không hồi!': '✦ DUAL AMBIDEXTERITY — skills cost no cooldown!',
  '⚡ Liên Trảm — miễn phí Qi!': '⚡ Chain Strike — free Qi!',
  'BẤT TỬ: BẬT': 'GODMODE: ON', 'BẤT TỬ: TẮT': 'GODMODE: OFF',
  'PK: BẬT': 'PK: ON', 'PK: Tắt': 'PK: OFF',
  'ĐÃ MỞ VÙNG MỚI': 'NEW REGION UNLOCKED', '☯ BÁI SƯ THỤ NGHIỆP': '☯ TAKEN AS DISCIPLE',
  '⚑ Kết Bái': '⚑ Sworn Oath', '⚑ KIM LAN KẾT NGHĨA': '⚑ SWORN BROTHERHOOD',
 '⚔ PHỤC KÍCH!': '⚔ AMBUSH!', '⚔TRUY THÙ': '⚔ VENDETTA',
 '⚔ Cừu Nhân': '⚔ Nemesis',
  '📖 LUẬN ĐẠO NGỘ PHÁP': '📖 DAO DISCOURSE', '🕊 HÒA GIẢI': '🕊 RECONCILED',
  '☯ Trưởng Tộc': '☯ Mentor', '☯ Hậu Bối': '☯ Protégé',
  '☬ TRẤN ẢI': '☬ PASS GUARDIAN', '⛨ THỦ VỆ': '⛨ WARDEN',
  '✘ HỎA HẦU CHƯA ĐẠT — THẦN BINH VỠ NÁT!': '✘ INSUFFICIENT MASTERY — DIVINE WEAPON SHATTERED!',
  'Thần Binh đã THỨC TỈNH — tối đa!': 'Divine Weapon AWAKENED — maxed!',
  '☂ Thiên Mệnh Phù bảo hộ!': '☂ Fate Charm protects you!',
  'Ngũ Ấn:': 'Five Seals:', '⚑ Kết Bái': '⚑ Sworn Oath',
  // Mounts & stable
  'Xuất Chiến (V)': 'Summon (V)', 'Thu Hồi (V)': 'Recall (V)', 'Thú Cưỡi → tầng': 'Mount → tier',
  '→ tầng': '→ tier', 'Trại Chủ Mục Đồng': 'Stable Master', 'Trại Ngựa Ngoại Ô': 'Outskirts Stable',
  '(Nhận Emberhide Bull)': '(Claim Emberhide Bull)', 'thu phục linh thú — bấm T': 'tame spirit beasts — press T',
  // Relations & personality
  'Xa Lạ': 'Stranger', 'Quen Biết': 'Acquaintance', 'Hảo Hữu': 'Friend', 'Tri Kỷ': 'Confidant',
  'Chí Giao': 'Bosom Friend', 'Sinh Tử Chi Giao': 'Life-and-Death Bond',
  'Chính Trực': 'Righteous', 'Hào Sảng': 'Generous', 'Ngạo Mạn': 'Arrogant', 'Tà Mị': 'Wicked',
  'Âm Hiểm': 'Cunning', 'Ôn Hòa': 'Gentle', 'Si Tình': 'Devoted', 'Tham Lam': 'Greedy',
  'Trung Thành': 'Loyal', 'Túc Trí Đa Mưu': 'Resourceful',
  'ngay thẳng, trọng nghĩa khí': 'upright, values honor', 'cởi mở, thích kết giao bằng hữu': 'open, loves making friends',
  'kiêu ngạo — thắng họ nhiều sẽ sinh thù hận': 'proud — beat them often and they will hold a grudge',
  'tà khí âm u, trọng lợi lạc, dễ ghi thù': 'dark-hearted, pleasure-seeking, bears grudges',
  'khó lường, ít để lộ tâm tư': 'hard to read, rarely shows intent',
  'ôn nhu dễ gần, tình cảm dễ nảy nở': 'gentle, quick to warm up',
  'đa tình, dễ rung động': 'romantic, easily moved', 'tham tài — quà càng quý càng trọng ngươi': 'greedy — the pricier the gift, the fonder',
  // Seasons & weather
  'Xuân': 'Spring', 'Hạ': 'Summer', 'Thu': 'Autumn', 'Đông': 'Winter',
  'Nắng đẹp': 'Clear skies', 'Nắng gắt': 'Scorching', 'Mưa phùn': 'Drizzle',
  'Mưa rào giông': 'Thunderstorm', 'Sương mù': 'Fog', 'Tuyết rơi': 'Snowfall',
  // Titles
  'Bách Quái Trảm': 'Slayer of a Hundred',
  'Thiên Quái Trảm': 'Slayer of a Thousand', 'Thợ Rèn Truyền Thuyết': 'Legendary Smith',
 'Resonance Chân Quân': 'True Lord of Resonance',
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
  'Bình Cảnh Chi Chiến': 'Battle of the Pass',
  'Dã Ngoại · PK': 'Wilds · PK', 'Huyết Chiến · Free PK': 'Bloodbath · Free PK',
  'PK tự do, không Tội Ác — giết thoải mái.': 'Free PK, no Sin — kill at will.',
  'Giết Du Hiệp không tăng Tội Ác': 'Killing Wanderers adds no Sin',
  'Dung hợp cần Resonance · Trung Kỳ': 'Fusion requires Resonance · Mid',
  'Chưa lĩnh ngộ đủ 2 môn tiền trệ': 'Prerequisite arts not yet learned',
  '· yêu cầu LV60': '· requires Lv60',
  'Hôm nay nói nhiều rồi, ngày mai ghé lại nhé.': 'Enough talk for today — come back tomorrow.',
  'Đứng yên nào.': 'Hold still.', 'Đến lượt ngươi.': 'Your turn.', 'Lên! Giết!': 'Charge! Kill!',
  'Ở lại cùng ta!': 'Stay with me!', 'Trăng lên rồi.': 'The moon is up.',
  'Khí chất hiệp nghĩa, đi đâu cũng được người đời kính nể.': 'A chivalrous aura, respected everywhere.',
  'Hài hòa âm dương, không thiên vị bên nào.': 'Yin and yang in harmony, leaning to neither side.',
  'Biết nhiều quá, không phải chuyện tốt đâu.': 'Knowing too much is never a good thing.',
  'Nghe nói Ngũ Ấn lại xao động — ngươi định xông pha chứ?': 'They say the Five Seals stir again — will you venture forth?',
  '"Thuốc bổ hay thuốc độc — khác nhau ở liều lượng thôi, khách quân ạ."': '"Tonic or poison — only the dosage differs, dear guest."',
  '"Binh khí nhà ta ba đời rèn giũa — mở rương là biết liền."': '"Three generations of smithing — open a chest and see."',
  '"Kiếm tốt không chờ người — ngươi chậm thì người khác cầm mất."': '"A fine blade waits for no one — hesitate and another takes it."',
  '"Bốn mươi năm trấn ải, xương già này chưa từng lùi một bước."': '"Forty years guarding this pass — these old bones have never taken one step back."',
  'Bạc không phải vạn năng, nhưng không bạc thì... ngươi hiểu mà.': "Silver isn't everything — but without it... you know.",
  'Ta thu mọi thứ — trừ lừa gạt.': 'I buy everything — except deceit.',
  'Ta không có tên. Chỉ có giá tiền.': 'I have no name. Only a price.',
  'Nghỉ ngơi dưỡng thần — hồi đầy HP và Instinct': 'Rest and recover — full HP and Instinct',
  'Dược Lão tự tay bốc thuốc — hồi đầy HP ngay lập tức': 'The Herbalist treats you himself — instant full HP',
  '3 phút +12% công lực — men say bừng bừng sát khí!': '3 min +12% power — drunk with killing intent!',
  'Bất Tử — chặn 1 đòn chí mạng, hồi 30% HP (180s)': 'Undying — blocks 1 fatal blow, heals 30% HP (180s)',
  'Mỗi màn chơi 1 lần: chết hồi sinh tại chỗ 50% máu': 'Once per run: revive on the spot at 50% HP',
  'Hồi 40% máu tức thì (phím R) — túi đựng tối đa 5 lọ': 'Instant 40% HP heal (press R) — carries up to 5',
  'Minimap hiện cả điểm Thảo Dược': 'Minimap also shows Herb spots',
  'Nguyên liệu rèn & đột phá Ascension': 'Forge & Ascension breakthrough material',
  'Tấn Phẩm & Kế Thừa — rơi từ quái/tinh anh': 'Promotion & Inheritance — drops from monsters/elites',
  'Khảm trang bị, rèn +7 trở lên — hiếm có': 'Socket gear, forge +7 and above — rare',
  'Rèn +10/+11 — cực hiếm': 'Forge +10/+11 — extremely rare',
  '×60 đổi Bảo Hạp Cổ Thần chọn bộ (Lò Rèn)': '×60 trades for a chosen Ancient God chest (Forge)',
  'rèn +7 trở lên · Áo Choàng': 'forge +7 and above · Cloak', 'rèn +10/+11 · Áo Choàng': 'forge +10/+11 · Cloak',
  'Bảo hiểm rèn +7 trở lên — xịt giữ nguyên cấp': 'Forge insurance +7 and above — fail keeps the level',
  'Lên +1 miễn phí, 100% thành công (áp dụng +0 đến +5)': 'Free +1, 100% success (applies to +0–+5)',
  'thất bại: giữ đồ & Ấn, mất nửa vật liệu': 'on failure: keep gear & Seal, lose half the materials',
  'Gói tiết kiệm — chỉ bán theo đợt': 'Budget bundle — sold in batches only',
  'tấn chức Card': 'promote to Card',
  'dung hợp Huyết Ma Thôn Phệ': 'fuse into Blood Demon Devour',
  'Hồ Lô Thuốc hồi 55% máu (thay 40%)': 'Potion Gourd heals 55% HP (instead of 40%)',
  'Rèn đồ +5% tỉ lệ thành công': 'Forge +5% success rate',
  '+1 Phong Linh Phù — bấm T gần tinh anh suy yếu': '+1 Spirit-Seal Charm — press T near a weakened elite',
 '+1 Đan Ascension Trial': '+1 Ascension Trial Pill',
  'MAX MODE — mọi tính năng tối đa!': 'MAX MODE — everything maxed!',
  'FULL SKILL — 34 kỹ năng + 30 dung hợp, mọi kỹ năng Lv 120 (bấm K gán)': 'FULL SKILL — 34 arts + 30 fusions, all skills Lv 120 (press K to assign)',
  // Cheat help lines
  '/god — bật/tắt bất tử': '/god — toggle godmode',
  '/kill [bán kính=350] — hạ quái quanh mình': '/kill [radius=350] — slay nearby monsters',
  '/learn — học toàn bộ Sổ Kỹ Năng': '/learn — learn the entire Codex',
  '/tenui — gỡ Trọng Thương (té núi lại ngay)': '/tenui — clear Heavy Wound (cliff-jump again)',
  '/wipe — xóa save & tải lại game': '/wipe — erase save & reload',
  '/boss — mở phong ấn & tới Tế Đàn Trấn Ải của map': '/boss — unseal & go to the Pass Guardian altar',
  '/max — mọi thứ tối đa (cấp 120, full đồ +11, full skill Lv 120)': '/max — everything maxed (Lv 120, full +11 gear, all skills Lv 120)',
  '/item [phẩm 0-4] [giai 1-10] — tạo trang bị vào túi': '/item [quality 0-4] [tier 1-10] — spawn gear into bag',
  '/fullskill — học hết kỹ năng + 30 dung hợp, mọi kỹ năng Lv 120': '/fullskill — learn all arts + 30 fusions, all skills Lv 120',
  // ── Side-quest panel chrome ──
  'Nhận Nhiệm Vụ': 'Accept Quest', 'Nhận Thưởng': 'Claim Reward',
  'Đang nhận tối đa 3 phụ tuyến — hoàn thành bớt rồi quay lại.': 'Max 3 active side quests — finish some, then come back.',
  '★ Chính tuyến đã hoàn tất — ngươi chính là Huyễn Ảnh Chí Tôn!': '★ Main storyline complete — you are the Phantom Supreme!',
  'gặp': 'to meet',
  // ── Chapter subtitles ──
  // ── Main quest names (35 chương) ──
  'Thử Tài Tân Thủ': 'A Test for the Novice',
  'Thảo Dược Cứu Người': 'Herbs to Heal', 'Sói Dữ Quấy Phá': 'Wolves on the Prowl',
  'Rèn Luyện Sơ Nhập': 'First Steps at the Forge', 'Sơn Tặc Hoành Hành': 'Bandits Run Rampant',
 'Tĩnh Tâm Nhập Định': 'Still Mind, Deep Trance',
  'Tuyệt Kỹ Truyền Thừa': 'The Sect\'s Legacy Art', 'Bình Cảnh Chi Chiến': 'Battle of the Threshold',
  'Kiếm Khách Bán Đảo': 'The Islet Swordsman', 'Tình Hoa Độc': 'Passion Flower Poison',
 'Cắt Đứt Tai Mắt': 'Severing Eyes and Ears', 'Cuồng Binh Xung Trận': 'Berserkers Charge the Line',
  'Huyễn Ảnh Chí Tôn': 'Phantom Supreme',
  // ── 50 phụ tuyến Lunacia — tên ──
  'Lễ Vật Đầu Xuân': 'New Year Tribute', 'Phương Thuốc Cứu Dịch': 'Plague-Remedy Prescription',
  'Sói Dữ Vây Làng': 'Wolves at the Gates', 'Hồ Ly Trộm Thuốc': 'The Medicine-Thieving Foxes',
  'Truy Kích Hắc Phong Dư Đảng': 'Hunt the Black Wind Remnants', 'Phá Trận Hồn': 'Breaking the Formation Souls',
  'Thuốc Cho Bà Cụ': 'Medicine for the Old Dame', 'Kẻ Đứng Sau Vụ Cướp': 'The Mastermind Behind the Raid',
  'Dọn Đường Lương Thực': 'Clear the Grain Road', 'Sói Hoành Ngoại Ô': 'Wolves Ravage the Outskirts',
  'Truy Nã Hắc Phong': 'Black Wind Wanted', 'Điểm Danh Nghĩa Sĩ': 'Muster of the Righteous',
  'Dơi Máu Ùa Về': 'The Blood Bat Swarm',
  'Đoạt Cung Xạ': 'Seize the Bows', 'Biên Quan Huyết Chiến': 'Bloodbath at the Border', 'Kỳ Lân Cuồng Hỏa': 'Qilins of Raging Fire', 'Báo Tin Thắng Trận': 'News of Victory',
  'Lông Cáo Nhuộm Dược': 'Fox Fur for Dyeing', 'Thuốc Cho Thương Binh': 'Medicine for the Wounded',
  'Tuấn Mã Cho Tân Binh': 'Steeds for New Recruits', 'Nghiệt Kỵ': 'The Remnant Riders',
  // ── 50 phụ tuyến Lunacia — mô tả ──
  'Bệnh dịch lan trong làng. Hái 8 Thảo Dược giúp Dược Sư chế thuốc cứu người.': 'An illness spreads through the village. Gather 8 Herbs so the Herbalist can brew a cure.',
  'Cáo Đỏ thành tinh trộm dược liệu quý. Diệt 8 con đoạt lại thuốc.': 'Red Foxes turned uncanny steal rare ingredients. Slay 8 to take the medicine back.',
  'Dư đảng đạo tặc đêm trước lẩn vào rừng. Diệt 10 tên Sơn Tặc trừ hậu họa.': 'Remnants of last night\'s raiders hide in the woods. Slay 10 Mountain Bandits to end the threat.',
  'Bà cụ đầu làng lâm bệnh nặng. Đến gặp Dược Sư xin thuốc cứu người gấp.': 'The old dame at the village entrance is gravely ill. Beg the Herbalist for medicine at once.',
  'Sơn Tặc ngoại ô chặn đoàn xe lương vào thành. Diệt 12 tên mở đường.': 'Outskirts bandits block the grain carts bound for the city. Slay 12 to open the road.',
  'Tàn Lang ngoại ô quấy phá nông dân. Diệt 12 con.': 'Fierce Wolves harass farmers outside the city. Slay 12.',
  'Dược Sư cần lông Cáo Đỏ nhuộm dược tán. Săn 12 con.': 'The Herbalist needs Red Fox fur for dye tinctures. Hunt 12.',
  'Bắt 3 Tuấn Mã Hoang ngoại ô trang bị cho tân binh thủ thành (rượt kiệt sức rồi bấm E).': 'Catch 3 Wild Steeds in the outskirts for the city\'s new recruits (chase them to exhaustion, then press E).',
  // ── Intro story (4 trang, text-node fragments) ──
  
 'Tương Dương': 'Xiangyang',
  '— khắc hệ sẽ gây thêm': '— countering an element deals an extra',
  'tự do — tới': '— at',
  'cấp 10': 'Lv 10',
  'Rèn trang bị +11': 'Forge gear to +11', '— và cuối cùng,': '— and finally,',
  'HÀNH TRÌNH BẮT ĐẦU': 'THE JOURNEY BEGINS',
  'Phía trước là': 'Ahead lie',
  'Tiếp ▸': 'Next ▸',
  '⚔ Bắt Đầu Hành Trình': '⚔ Begin the Journey', 'Bắt Đầu Hành Trình': 'Begin the Journey',
  'Tiếp Tục Hành Trình': 'Continue the Journey',
  // ── Sect select / ceremony ──
  'Gia Nhập Lớp': 'Choose a Class',
  // ── The Hatching ──
  '🥚 The Hatching': '🥚 The Hatching',
  '🥚 Ấp Lại Ổ Trứng': '🥚 Re-nest the Eggs',
  '✨ 3 mảnh HUYỀN trở lên — sẽ mở danh hiệu ẩn 【Thiên Mệnh Sở Quy】!': '✨ 3 MYSTIC shards or better — unlocks the hidden title 【Fated by Heaven】!',
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
  'Venom Dart +15% ST · phá khiên lâu thêm 4s': 'Hidden Weapons +15% DMG · shield-break lasts 4s longer',
  'Giết Du Hiệp không tăng Tội Ác': 'Slaying Wandering Heroes grants no Sin',
  'Card +12% Sát Thương': 'Card +12% Damage', '+15% Bạc rơi': '+15% silver drops',
  'Đả thông Instinct Channels +25% tỉ lệ': 'Clear Instinct Channels +25% rate',
  // ── Tính cách ──
  'Chính Trực': 'Righteous', 'Tà Khí': 'Heretical', 'Trung Dung': 'Balanced',
  'Khí chất hiệp nghĩa, đi đâu cũng được người đời kính nể.': 'A chivalrous bearing — respected wherever you go.',
  'Con đường tăm tối — Du Hiệp kiêng kị, dân thường e ngại.': 'The dark path — wandering heroes shun you, commoners fear you.',
  'Hài hòa âm dương, không thiên vị bên nào.': 'Yin and yang in harmony, favoring neither side.',
  '🔊 Bật giọng hô tên chiêu': '🔊 Skill shout ON',
  '🔇 Tắt giọng hô tên chiêu': '🔇 Skill shout OFF',
  '💠 Tâm Đắc': '💠 Insight',
  '⌨ Phím Space': '⌨ Space key',
  'Đòn đánh thường': 'Basic attack',
  '⚡ TIẾN HÓA': '⚡ EVOLUTION',
  '⚡ CHIÊU THỨC TIẾN HÓA!': '⚡ SKILL EVOLVED!',
  'Đột phá': 'Breakthrough',
  'tiến hóa bậc': 'evolution stage',
};

/* ---- Bổ sung dịch: nhiệm vụ chính tuyến/phụ tuyến + kỹ năng/kỹ năng ---- */
Object.assign(EXACT, {
  // ── Main quest descriptions (34) ──
  'Bầy Tàn Lang trong rừng ngày càng hung hãn. Diệt 6 con để bảo vệ người đi rừng.': 'The Dire Wolves in the woods grow fiercer by the day. Slay 6 to protect the woodcutters.',
  'Sơn tặc trên đồi phía nam cướp bóc khách qua đường. Diệt 8 tên.': 'Bandits on the southern hill rob passing travelers. Slay 8 of them.',
  'Đến Tịnh Tâm Tuyền cạnh làng, đứng trong suối tĩnh tâm 8 giây để ngưng tụ Instinct.': 'Go to the Still-Mind Spring by the village; stand in the stream and meditate for 8 seconds to gather Instinct.',
  // ── Old side quests: 12 names + 16 descs ──
  'Dã Trư Phá Vườn': 'Boars Ravage the Garden',
  'Án Mạng Trong Thành': 'Murder in the City',
  'Yên Tĩnh Cho Người Khuất': 'Peace for the Departed',
  'Cắt Đứt Tiếp Tế': 'Cut the Supply Line',
  'Săn Kỳ Lân': 'Qilin Hunt',
  'Dược Sư cần 6 Thảo Dược để chế thuốc chữa dịch cho làng.': 'The Herbalist needs 6 Herbs to brew medicine for the village epidemic.',
  'Dã Trư phá nát vườn thuốc. Diệt 10 con.': 'Wild Boars have wrecked the herb garden. Slay 10.',
  'Bắt 3 Tuấn Mã Hoang ngoài đồng cho Mục Đồng (rượt đến kiệt sức rồi bấm E).': 'Catch 3 Wild Steeds in the fields for the Stable Boy (chase them to exhaustion, then press E).',
  // ── Võ Học: 46 names ──
  'La Hán Quyền': 'Arhat Fist',
  'Long Trảo Thủ': 'Dragon Claw Hand',
  'Niêm Hoa Chỉ': 'Flower-Pinching Finger',
  'Dịch Cân Kinh': 'Muscle-Changing Classic',
  'Tẩy Tủy Kinh': 'Marrow-Cleansing Classic',
  
  'Thần Hành Bách Biến': 'Divine Hundred-Step Stride',
  'Kiếm Xoáy': 'Spiral Blade',
  'Thuần Dương Vô Cực Công': 'Pure Yang Infinite Art',
  'Liên Hoa Quyền': 'Lotus Fist',
  'Thái Hà Công': 'Taihe Art',
  'Phục Hổ Bổng Pháp': 'Tiger-Taming Staff Technique',
  
  'Phiêu Vân Bộ': 'Cloud-Drifting Steps',
  'Hắc Uyên Quyết': 'Black Abyss Art',
  'Huyễn Ảnh Vô Tung Công': 'Phantom Traceless Art',
  
  'Song Ảnh Phân Thân Thủ': 'Twin-Shadow Split-Body Hand',
  'Bản Nguyên Công': 'Primal-Origin Art',
  'Huyền Tâm Thông': 'Mystic Heart Attunement',
  'Linh Cảm Thông Thiên': 'Heaven-Reaching Spirit Sense',
  'Vân Hành Chu Thiên': 'Cloud-Flow Circulation',
  'Thiết Bố Sam': 'Iron Cloth Shirt',
  'Thuận Thiên Giả': 'One Who Follows Heaven',
  'Bách Hợp Tâm Pháp': 'Hundred-Harmony Heart Art',
  'Hồi Giang Tứ Hải': 'Rivers Return to the Four Seas',
  'Nhật Nguyệt Giao Hội': 'Sun and Moon Convergence',
  'Vô Tướng Tâm Chú': 'Formless Heart Mantra',
  'Liệt Diễm Chân Quyết': 'Blazing Flame True Formula',
  'Huyền Âm Tâm Pháp': 'Mystic Yin Heart Art',
  'Liệt Diễm Lệnh Pháp': 'Blazing Flame Token Technique',
  'Hắc Yêu Nghịch Kình Công': 'Dark-Fiend Reverse-Force Art',
  'Trảm Ma Kiếm Pháp': 'Demon-Slaying Swordplay',
  'Hắc Nguyệt Bạch Cốt Trảo': 'Black Moon White Bone Claw',
  'Vô Ảnh Cửu Kiếm': 'Shadowless Nine Swords',
  'Thái Âm Huyền Kinh': 'Great Yin Mysterious Manual',
  'Thái Dương Huyền Kinh': 'Great Yang Mysterious Manual',
  // ── Võ Học: 46 descs ──
  'Quyền pháp nhập môn — quạt trước mặt, hất văng nhẹ.': 'Entry-level fist art — sweeps the front, light knockback.',
  'Bị động: +12% HP, +8% giảm sát thương.': 'Passive: +12% HP, +8% damage reduction.',
  'Trảo kình phá giáp — xuyên phòng thủ, khống chế 1.5s.': 'Armor-rending claw — pierces defense, stuns for 1.5s.',
  'Chỉ lực tầm xa — trúng địch choáng 1.2s.': 'Ranged finger force — stuns the target for 1.2s.',
  'Bị động: hồi 0.8% HP mỗi giây, kháng độc 50%.': 'Passive: regenerate 0.8% HP per second, 50% poison resist.',
  'Bị động: mọi chiêu thức hồi nhanh hơn 30%.': 'Passive: all skills recharge 30% faster.',
  'Kiếm ý liên miên như nước chảy — quạt trước mặt.': 'Sword intent flows like water — frontal sweep.',
  'Lướt đi như thần hành — +50% né trong 3s.': 'Dash like the wind — +50% dodge for 3s.',
  'Tứ lưỡng bát thiên cân — bạo phát AoE hất văng & làm chậm.': 'Four ounces move a thousand pounds — AoE burst with knockback & slow.',
  'Dương hỏa bùng nổ — +50% sát thương trong 8s.': 'Yang fire erupts — +50% damage for 8s.',
  'Liên hoàn quyền cực nhanh — hồi chiêu chỉ 3s.': 'Lightning-fast chained punches — only 3s cooldown.',
  'Bổng pháp tứ tung — AoE làm chậm 50% trong 3s.': 'Staff strikes everywhere — AoE 50% slow for 3s.',
  'Bị động: +12% tốc chạy, +5% né.': 'Passive: +12% move speed, +5% dodge.',
  'Bước trên sóng — lướt xuyên quái, né tuyệt đối 2.5s.': 'Step upon the waves — dash through monsters, absolute dodge for 2.5s.',
  'Biến hóa vô tướng — lập tức hồi toàn bộ chiêu, +20% ST 10s.': 'Formless shifting — instantly reset all cooldowns, +20% DMG for 10s.',
  'Kiếm quang một đường — xuyên thấu mọi địch trên đường bay.': 'A single beam of sword light — pierces every foe in its path.',
  'Bị động: +10% tốc đánh, +8% né.': 'Passive: +10% attack speed, +8% dodge.',
  'Bị động: 30% chiêu vừa tung không tốn hồi chiêu.': 'Passive: 30% chance a cast skill costs no cooldown.',
  'Bị động: chết tự hồi sinh 50% HP — mỗi 300s một lần.': 'Passive: revive at 50% HP on death — once every 300s.',
  'Bị động: +10% kinh nghiệm.': 'Passive: +10% EXP.',
  'Bị động: +8% né tránh.': 'Passive: +8% dodge.',
  'Bị động: +10% phòng ngự.': 'Passive: +10% defense.',
  'Bị động: +15% bạc rơi.': 'Passive: +15% silver drops.',
  'Bị động: hồi 0.4% HP mỗi giây.': 'Passive: regenerate 0.4% HP per second.',
  'Bị động: +10% sát thương.': 'Passive: +10% damage.',
  'Bị động: +6% tốc đánh.': 'Passive: +6% attack speed.',
  'Bị động: +8% bạo kích.': 'Passive: +8% crit.',
  'Bị động: +12% ST bạo kích.': 'Passive: +12% crit damage.',
  'Bị động: kháng độc 60%.': 'Passive: 60% poison resist.',
  'Lệnh bài quỹ đạo — lướt tới chém địch gần nhất, xuyên giáp.': 'Ghostly token dash — blink to the nearest foe and slash, armor-piercing.',
  'Côn phục xuất kích — phản 100% sát thương trong 5s.': 'The toad strikes — reflect 100% damage for 5s.',
  'Kiếm pháp tà mị — tốc đánh +60%, mọi đòn bạo kích trong 6s.': 'Uncanny swordplay — +60% attack speed, every hit crits for 6s.',
  'Trảo pháp âm độc — xé giáp, gây chảy máu 6s.': 'Sinister claw art — rends armor, inflicts 6s bleed.',
  'Phá kiếm thức — một kiếm bỏ qua phòng thủ, cắt đứt chiêu địch.': "Sword-breaking stance — one stroke ignores defense and severs the foe's move.",
  'Bị động: +8% công, +8% phòng, +8% HP — mở giới hạn thuộc tính.': 'Passive: +8% attack, +8% defense, +8% HP — raises stat caps.',
  'Bị động: kháng độc 70%, +5% HP.': 'Passive: 70% poison resist, +5% HP.',
  // ── Dung Hợp: 30 names ──
  'Thiên Cơ Đoạt Tinh Đại Pháp': 'Heaven-Mechanism Star-Seizing Art',
  'Cửu Chấn Toái Cốt Quyền': 'Nine-Tremor Bone-Shattering Fist',
  'Cự Tượng Phá Nhạc Công': 'Giant-Elephant Mountain-Breaking Art',
  'Băng Phong Đao Pháp': 'Ice-Blade Saber Technique',
  'Xích Lân Độc Kiếm Pháp': 'Crimson-Scale Venom Sword',
  'Hàn Mai Toái Cốt Thủ': 'Cold-Plum Bone-Crushing Hand',
  'U Minh Sưu Hồn Đại Pháp': 'Nether Soul-Searching Art',
  'Quỷ Ảnh Chỉ': 'Ghost-Shadow Finger',
  'Vô Tự Thiên Kinh': 'Wordless Heaven Manual',
  'Vạn Kiếm Quy Tông': 'Ten Thousand Swords Return',
  'Cửu Thiên Huyền Lôi': 'Nine Heavens Mystic Thunder',
  'Hỏa Phượng Niết Bàn': 'Fire Phoenix Nirvana',
  'Thiên Ma Giải Thể Đại Pháp': 'Heavenly Demon Disintegration Art',
  'Thái Ất Thần Kiếm': 'Grand Unity Divine Sword',
  'Băng Phong Vạn Lý': 'Ten Thousand Li of Ice',
  'Lôi Đình Vạn Quân': 'Thunderbolt of Ten Thousand Armies',
  'Phệ Thiên Ma Công': 'Heaven-Devouring Demon Art',
  'Niết Bàn Phật Ấn': 'Nirvana Buddha Seal',
  // ── Dung Hợp: 30 descs ──
  'Hắc động thôn phệ — hút 40% sát thương thành sinh lực & phản đòn trong 8s.': 'A devouring black hole — convert 40% damage to HP & reflect for 8s.',
  'Thất thương tẫn hại — quyền kính 7 lớp chấn nát địch, choáng & hất văng.': 'Seven layers of ruinous fist force — shatter foes, stun & knock back.',
  'Long tượng hiện hình — mười tầng lực đạo nghiền nát toàn trường.': 'Dragon-elephant manifests — ten tiers of force crush the whole field.',
  'Đao pháp truyền đời — ba đạo đao quang băng hàn xuyên thấu.': 'Ancestral blade art — three arcs of freezing blade light, piercing.',
  'Kim xà phóng độc — kiếm quang như rắn vàng cắn xé, trúng kịch độc.': 'The golden snake strikes — sword light bites like a viper, inflicting deadly poison.',
  'Chiết mai trong hư không — cánh hoa hóa thủ ấn, choáng 2s xuyên giáp.': 'Plucking plum blossoms from thin air — petals turn to hand seals, 2s stun, armor-piercing.',
  'Lục dương luân chuyển — sáu vầng thái dương nổ tung quanh người.': 'Six suns revolve — solar bursts erupt all around you.',
  'Duy ngã độc tôn — +40% ST & hút 20% sinh lực trong 10s.': 'I alone am supreme — +40% DMG & 20% life steal for 10s.',
  
  'Chỉ phong huyễn ảnh — một chỉ xuyên thấu ảo ảnh, choáng 1.5s.': 'Phantom finger wind — one piercing strike through illusions, 1.5s stun.',
  'Kim cang bất hoại — khiên 60% HP & +20% ST trong 6s.': 'Unbreakable — 60% HP shield & +20% DMG for 6s.',
  'Vạn kiếm triều tông — chín đạo phi kiếm quét ngang, xuyên thấu tuyệt đối.': 'Ten thousand swords converge — nine flying blades sweep wide, absolute pierce.',
  'Cửu thiên giáng lôi — lôi trụ tử điện đánh xuống, choáng toàn trường.': 'Thunder falls from nine heavens — a violet lightning pillar, field-wide stun.',
  'Phượng hoàng dục hỏa — liệt diễm trùm trời, niết bàn trùng sinh.': 'The phoenix bathes in fire — flames blanket the sky, rebirth from nirvana.',
  'Huyền băng phong ấn — hàn khí đóng băng tứ chi, chậm 80% & choáng.': 'Mystic ice seal — frost freezes limbs, 80% slow & stun.',
  'Giải thể bộc phát — tốc đánh +80%, mọi đòn bạo kích trong 6s.': 'Disintegration burst — +80% attack speed, every hit crits for 6s.',
  'Huyết ma phệ hồn — trảo huyết xé hồn phách, chảy máu 6s.': 'The blood demon devours souls — crimson claws tear the spirit, 6s bleed.',
  'Thái Ất huyền quang — một kiếm phá vạn pháp, tốc độ cực hạn.': 'Grand Unity mystic light — one sword breaks ten thousand arts, at utmost speed.',
  'Vạn lý giao băng — sóng băng phủ toàn trường, chậm 60% trong 5s.': 'Ten thousand li frozen — ice waves blanket the field, 60% slow for 5s.',
  'Lôi quân vạn mã — sấm sét như thiên binh quét sạch bát phương.': 'Thunder cavalry in legion — lightning like heavenly soldiers sweeps the eight directions.',
  'Thôn thiên phệ địa — hút 35% sinh lực & +30% ST trong 8s.': 'Devour heaven and earth — 35% life steal & +30% DMG for 8s.',
  // ── SKILL_DEFS names + descs ──
  'Venom Dart': 'Venom Dart',
  'Rupture Bolt': 'Rupture Bolt',
  
  'Piercing Arrow': 'Piercing Arrow',
  'Soul Rend': 'Soul Rend',
  // ── PASSIVE_SKILLS: 6 names + 6 descs ──
  'Archery (bị động)': 'Archery (passive)',
  'Phiêu Vân Bộ (J)': 'Cloud-Drifting Steps (J)',
  '5% đòn đánh khóa chiêu địch — Ascension cảnh 4.': '5% of attacks lock the foe\'s skills — Ascension Lv 4.',
  'Phản lại một phần sát thương — Ascension cảnh 5 / trang bị.': 'Reflect part of the damage — Ascension Lv 5 / gear.',
  'Bất Tử (bị động)': 'Undying (passive)',
  'Chặn 1 đòn chí mạng, hồi 30% HP — Ascension cảnh 8.': 'Blocks 1 fatal blow, heals 30% HP — Ascension Lv 8.',
  'Huyết Ma Thôn Phệ': 'Blood Demon Devour',
  // ── Sect skill names (16) ──

  'Thất Tinh Hội Kiếm': 'Seven Stars Sword Assembly',
  'Song Hoàn Trảm': 'Twin Ring Slash',
  'Ngọc Nữ Tố Tâm Kiếm': 'Jade Maiden Pure-Heart Sword',
  'Linh Xà Độc Tiêu': 'Spirit Serpent Venom Dart',
  'Hà Mô Công': 'Toad Art',
  'Thánh Hỏa Liên Nguyên': 'Holy Fire Prairie Blaze',
  'Càn Khôn Đại Na Di': 'Heaven-and-Earth Great Shift',
  'Nhất Dương Chỉ': 'One Yang Finger',
  'Lạc Anh Kiếm Vũ': 'Falling Petals Sword Dance',
  'Bích Hải Triều Sinh Khúc': 'Jade Sea Tide Song',
  'Du Hiệp Quyền': 'Wandering Hero Fist',
  'Tứ Hải Giai Phục': 'All Seas Submit',
  // ── Sect flavor descs (8) ──
  // ── Schools & misc ──

  
  'Sổ Kỹ Năng': 'Skill Codex',
  '+8% Kinh Nghiệm': '+8% EXP',
  '+6% Tốc Chạy': '+6% Move Speed',
});

/* ---- REGEX rules for dynamic/templated strings ---- */

/* ---- Bổ sung 2: chrome panel Kỹ Năng / Sổ Kỹ Năng / Dung Hợp ---- */
Object.assign(EXACT, {
  'Kỹ Năng — gán tối đa 5 ô (phím 1-5)': 'Skills — assign up to 5 slots (keys 1-5)',
  'Taskbar hiện tại:': 'Current taskbar:',
  'CHIÊU THỨC CHỦ ĐỘNG — bấm số ô để gán': 'ACTIVE SKILLS — click a slot number to assign',
  '⬆ Mỗi cấp': '⬆ Per level',
  '+2,5% ST': '+2.5% DMG',
  'Tiểu Thành +8% ST ·': 'Minor Success +8% DMG ·',
  'Trung Thành −10% hồi chiêu ·': 'Moderate Success −10% cooldown ·',
  'Đại Thành +12% ST ·': 'Great Success +12% DMG ·',
  'Xuất Thần +15% ST ·': 'Transcendence +15% DMG ·',
  'Hóa Cảnh +20% ST — farm quái & bán đồ lấy bạc để tu luyện!': 'Apotheosis +20% DMG — farm monsters & sell loot for silver to train!',
  'Tiểu Thành': 'Minor Success',
  'Trung Thành': 'Moderate Success',
  'Đại Thành': 'Great Success',
  'Viên Dung': 'Perfection',
  'Xuất Thần': 'Transcendence',
  'Hóa Cảnh': 'Apotheosis',
  'VIÊN MÃN · HÓA CẢNH': 'MAXED · APOTHEOSIS',
  'SỔ KỸ NĂNG': 'SKILL CODEX',
  'Kỹ năng': 'Skills',
  'phiêu bạt': 'of the wilds',
  'mở kết hợp tự do, Cao cấp cần Resonance Trung, Thần cấp cần Resonance Hậu. Sách Kỹ Năng chủ yếu từ': 'unlocks free combination, Advanced arts need Mid Resonance, Godly arts need Late Resonance. Manuals come mainly from',
  'Té Núi': 'Cliff of Fortune',
  'Lĩnh ngộ đủ': 'Master',
  'cả 2 môn tiền trệ': 'both prerequisite arts',
  '+ đạt': '+ reach',
  '3 📜 Sách Kỹ Năng': '3 📜 Manuals',
  'để dung hợp. 30 tuyệt chiêu thất truyền, khai quật từ': 'to fuse. 30 lost ultimates, unearthed from',
  'TÂM PHÁP BỊ ĐỘNG (tự kích hoạt, không cần gán)': 'PASSIVE HEART ARTS (auto-active, no assignment needed)',
  '🔒 chưa đạt điều kiện': '🔒 requirements not met',
  '🔒 thiếu tiền trệ': '🔒 missing prerequisites',
  '✓ đã lĩnh ngộ': '✓ learned',
  'kỹ năng phái khác': "another sect's art",
  'Ô trống — bấm để gán kỹ năng (K)': 'Empty slot — click to assign a skill (K)',
  'Bấm để gỡ': 'Click to unassign',
  'Kỹ năng đã viên mãn (Lv 120)!': 'Skill maxed (Lv 120)!',
  // categories
  'Kiếm': 'Sword', 
 'Bổng': 'Staff', 'Tâm Pháp': 'Heart Art', 'Thân Pháp': 'Movement',
  // fusion origins
  'Cổ Quyển Vực Nguyên Thủy': 'Ancient Scrolls of the Origin Rift',
  'Giáo Lý Vệ Thần': 'Warden Doctrine',
  'Di Huấn Axie Lang Thang': 'Legacy of the Wandering Axies',
});

Object.assign(EXACT, {
  'Băng Pháp': 'Ice Arts',
  'Cầm Nã': 'Grappling',
  'Hỏa Pháp': 'Fire Arts',
  'Hộ Thể': 'Body Guard',
  'Kiếm Thuật': 'Sword Arts',
  'Kiếm Trận': 'Sword Formation',
  'Lôi Pháp': 'Thunder Arts',
  'Ma Công': 'Demon Art',
  'Pháp Ấn': 'Dharma Seal',
  'Phật Ấn': 'Buddha Seal',
  'Âm Công': 'Sound Art',
  'Đao': 'Blade',
  'Độn Pháp': 'Escape Arts',
  'Tàn quyển:': 'Fragments:',
  'Thượng': 'Upper', 'Trung': 'Mid', 'Hạ': 'Lower',
  'Đánh bại Hắc Phong Sát Thủ để thu thập tàn quyển (Thượng 40% · Trung 40% · Hạ 20%).': 'Defeat the Black Wind Slayer to collect manual fragments (Upper 40% · Mid 40% · Lower 20%).',
  'Starforged — nhục thân thăng hoa, toàn thuộc tính vượt cực hạn': 'Starforged — the flesh ascends, all stats transcend their limits',
  'Rupture Bolt (5% khóa chiêu đối thủ)': 'Rupture Bolt (5% chance to lock the foe\'s skills)',
  'Phù độc đoạt mệnh — trúng địch trúng kịch độc, xuyên giáp.': 'Venom-talisman deathstrike — inflicts deadly poison, pierces armor.',
  'Ma Phái': 'Demonic Sect',
  '+5% Né Tránh': '+5% Dodge',
  '+8% Kinh Nghiệm': '+8% EXP',
  '+6% Tốc Chạy': '+6% Move Speed',
});

/* ---- Character panel (renderChar) + Character-panel wrapper/tabs ---- */
Object.assign(EXACT, {
  'Unclassed lang bạt — chưa gia nhập Tộc nào': 'Unclassed drifter — not yet pledged to any sect',
  '⚔ GIA NHẬP LỚP': '⚔ PLEDGE TO A SECT',
  'Bái sư mở khóa ở': 'Pledging unlocks at',
  'Điểm tiềm năng còn:': 'Potential points left:',
  'mỗi cấp +5': '+5 per level',
  'Tốc đánh, bạo kích, né tránh': 'Attack speed, crit, dodge',
  'Giảm sát thương nhận vào': 'Reduces damage taken',
  'HP tối đa, hồi phục': 'Max HP, regen',
  'THUỘC TÍNH CHIẾN ĐẤU': 'COMBAT STATS',
  'Giảm Thương': 'Dmg Reduction',
  'Tốc Đánh': 'Atk Speed',
  'Hình thái cuối — thần binh rực rỡ tối đa ✦': 'Final form — Divine Weapon radiance at its peak ✦',
  'CHIÊU THỨC': 'SKILLS',
  'Venom Dart ·': 'Hidden Weapons ·',
  '☠ Huyết Ma Thôn Phệ (sách kỹ năng)': '☠ Blood Demon Devour (secret manual)',
  'hút 10% ST': 'drains 10% DMG',
  'DANH HIỆU — bấm để chọn danh hiệu hiển thị trên đỉnh đầu': 'TITLES — click to choose the title shown above your head',
  'Mở khóa = cộng dồn chỉ số vĩnh viễn (không cần trang bị). Bấm lần nữa vào danh hiệu đang hiển thị để ẩn.': 'Unlocking grants a permanent stat bonus (no need to equip). Click your displayed title again to hide it.',
  'ĐANG HIỂN THỊ': 'DISPLAYED',
  'chọn': 'select',
  'Giai': 'Tier',
  'sách kỹ năng': 'skill tome',
  'Rèn thành công +11': 'Successfully forge to +11',
  'Sơ Nhập Lunacia': 'Newcomer to Lunacia',
  // Title stat lines (titleStatText output, wrapped as "— {this}" by renderChar)
  '+5% Công': '+5% ATK', '+10% Bạo': '+10% Crit',
  '+5% tỉ lệ rèn': '+5% forge rate', '+10% Toàn TT': '+10% All Stats', '+15% Toàn TT': '+15% All Stats',
  // Divine Weapon tier names (TB_TIER_NAMES) — classic cultivation-stage flavor, distinct from the
  // player's own Ascension realms above
 'Kết Đan': 'Core Formation',
 'Luyện Hư': 'Void Tempering',
 'Hợp Thể': 'Body Integration',
  'Tinh Thạch': 'Mystic Iron', // same currency as ✦ Huyền Thiết (player.mat), just displayed under a different label here
  'Nội Đan': 'Inner Core',
  // Character-panel wrapper (renderCharPanel) + CHAR_TABS
  'Nhân Vật — mọi tu luyện trong một': 'Character — every training system in one place',
  'Thú Chiến': 'Mount',
  '🐾 Linh Thú': '🐾 Pets',
  'LINH THÚ': 'PET',
});

/* ---- Forge / Mount / Ascension / Instinct Channels / Card — sub-panels reachable from Character ---- */
Object.assign(EXACT, {
  'Lò rèn mở khóa ở': 'The Forge unlocks at',
  'Hãy tiếp tục làm nhiệm vụ!': 'Keep questing!',
  'Rèn Luyện — Tăng Cường Trang Bị': 'Forge — Enhance Equipment',
  '✦ Huyền Thiết': '✦ Mystic Iron',
  '◆ Tu La': '◆ Asura',
  '❖ Hỗn Nguyên': '❖ Chaos',
  'Mua (500◈)': 'Buy (500◈)',
  'Chưa có trang bị nào.': 'You have no equipment yet.',
  'CHỌN TRANG BỊ (tối đa +11 · +10 thức tỉnh)': 'SELECT GEAR (max +11 · +10 awakens)',
  '☀ Đã đạt Khai Quang tối thượng (+11) — danh hiệu Thợ Rèn Truyền Thuyết!': '☀ Reached the ultimate Radiance (+11) — earned the Legendary Smith title!',
  '☰ Phá Thiên Kiếp (+9 → +11)': '☰ Heaven-Rending Trial (+9 → +11)',
  'Phá Thiên Kiếp': 'Heaven-Rending Trial',
  'Trang bị từ +9 không thể tự rèn. Hãy mang đến': 'Gear at +9 or above can no longer be enhanced here. Bring it to the',
  'ở trung tâm': 'in the heart of',
  ', nhờ': ', and ask the',
  'Tông Sư Thợ Rèn': 'Grandmaster Smith',
  'vận công dung hợp.': 'to fuse it through.',
  'Dịch Chuyển tới Lunaris City': 'Teleport to Lunaris City',
  'ĐẬP NGỌC — Tu La Tinh Thạch': 'GEM SMASH — Asura Crystal',
  '+6 trở lên bắt buộc đập ngọc để đột phá giới hạn (75% → 50%). Thất bại chỉ tụt 1 cấp.': '+6 and above requires a gem smash to break the limit (75% → 50%). Failure only drops 1 level.',
  'BÌNH CHỈ NHƯ THỦY (+1 đến +6)': 'CALM AS STILL WATER (+1 to +6)',
  'Huyền Thiết Thạch cường hóa an toàn tuyệt đối — tỉ lệ 100%.': 'Mystic Iron Stone enhances with total safety — 100% success.',
  'thất bại: TỤT 1 CẤP (tẩu hỏa nhập ma)': 'failure: DROPS 1 LEVEL (deviation)',
  'thất bại chỉ mất vật liệu': 'failure only costs materials',
  'TỨ CHÂU — ◎ Chúc Phúc': 'FOUR PEARLS — ◎ Blessing',
  '◉ Linh Hồn': '◉ Soul',
  '❤ Sinh Mệnh': '❤ Life',
  '● Hỗn Độn': '● Chaos',
  '◎ Chúc Phúc +1': '◎ Blessing +1',
  '◉ Linh Hồn +1 (50%)': '◉ Soul +1 (50%)',
  'Chỉ khảm lên giáp trụ (Nón/Giáp/Tay/Quần/Giày)': 'Only socketable into armor (Helm/Chest/Gloves/Pants/Boots)',
  'LUYỆN BẢO CÁC — ÁO CHOÀNG': 'RELIC PAVILION — CLOAK',
  'Luyện Chế Áo Choàng': 'Craft the Cloak',
  'Thăng Cấp Áo Choàng 2': 'Upgrade to Cloak Tier 2',
  'chưa đạt LV60': 'not yet Lv60',
  'Mảnh Cổ Thần rơi từ Trấn Ải (×2/lần hạ) — bảo đảm Cổ Thần sau ~30 lần Chinh Phạt.': 'Ancient God Shards drop from Pass Guardians (×2 per kill) — guaranteed Ancient God gear after ~30 Campaigns.',
  'Chinh Phạt': 'Campaign',
  // Mount (Thú Chiến)
  'Chuồng thú mở khóa ở': 'The Stable unlocks at',
  'Thú Chiến — Thăng Giai': 'Mount — Advance Tier',
  'Thuộc tính gia trì:': 'Bonus attributes:',
  'Chiến thú đi theo và': 'Your mount follows you and',
  'tự tấn công': 'auto-attacks',
  'quái quanh ngươi, mỗi 1.4s một đòn.': 'nearby monsters, once every 1.4s.',
  'Ngươi chưa có chiến thú.': 'You have no mount yet.',
  'Thăng giai lần đầu để nhận': 'Advance tier for the first time to receive a',
  'đồng hành!': 'companion!',
  'Thăng Giai': 'Advance Tier',
  // Bốn bộ Cổ Thần Thủ Hộ — danh từ riêng Vaeldra, giữ nguyên ở mọi ngôn ngữ
  'Sarkaan': 'Sarkaan',
  'Velmyr': 'Velmyr',
  'Ashvard': 'Ashvard',
  'Korrveth': 'Korrveth',
  'Thăng Giai (Nhận Emberhide Bull)': 'Advance Tier (Claim Emberhide Bull)',
  'Thất bại! +8% tỉ lệ tích lũy': 'Failed! +8% cumulative rate',
  'Chưa có chiến thú — mở C → Thú Chiến': 'No mount yet — open C → Mount',
  '⚔ Chiến thú xuất trận!': '⚔ Mount deployed!',
  'Chiến thú thu hồi.': 'Mount recalled.',
  // Ascension (Dantian) + Instinct Channels (Kinh Mạch)
  'Ascension mở khóa ở': 'Ascension unlocks at',
  'Anima tích lũy: giết quái và tĩnh tọa tại Tịnh Tâm Tuyền.': 'Gather Anima by slaying monsters and meditating at the Tranquil Spring.',
  'Tịnh Tâm Tuyền': 'Tranquil Spring',
  'Instinct Channels mở khóa ở': 'Instinct Channels unlock at',
  'Instinct tích lũy bằng chiến đấu và tĩnh tọa.': 'Instinct builds up through combat and meditation.',
  'VIÊN MÃN': 'MAXED',
  'Xung mạch thất bại chỉ mất Instinct, đốt đã thông không mất. Ascension cảnh 4 (Spark Tầng 4) trở lên giảm 20% phí xung mạch.': 'A failed channel pulse only costs Instinct — unblocked nodes are never lost. Ascension Lv 4 (Spark Stage 4) or higher reduces the pulse cost by 20%.',
  // Card (Di Sản)
  'Chưa tu luyện — tấn chức tầng 1 để khai mở!': 'Not yet trained — advance to Stage 1 to unlock!',
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
  '🍃 Giảm hiệu ứng': '🍃 Reduce Effects',
  'máy yếu': 'weak devices',
  '— ⚔ AUTO FARM (phím Z) —': '— ⚔ AUTO FARM (key Z) —',
  '🗡 Tự tung kỹ năng trên taskbar': '🗡 Auto-cast taskbar skills',
  '🧪 Tự uống Hồ Lô Thuốc': '🧪 Auto-drink Potion Gourd',
  '❤ Uống thuốc khi HP dưới': '❤ Drink potion when HP below',
  '🎯 Tầm quét quanh điểm neo': '🎯 Scan range around anchor point',
  '👹 Auto đánh cả Boss': '👹 Auto-fight bosses too',
  'nguy hiểm — mặc định tắt, boss tự mình quyết!': 'risky — off by default, boss fights are on you!',
  'NAM': 'MALE',
  'NỮ': 'FEMALE',
  'Đang mặc:': 'Currently wearing:',
  '⚠ Xóa dữ liệu & tu luyện lại': '⚠ Wipe data & start over',
  'XÓA SAVE': 'WIPE SAVE',
  'Âm thanh sẽ phát sau thao tác đầu tiên của bạn (quy định trình duyệt). Mọi cài đặt được lưu tự động.': 'Sound will start playing after your first action (browser policy). All settings are saved automatically.',
  'Xóa toàn bộ dữ liệu tu luyện và bắt đầu lại từ đầu?': 'Wipe all your progress and start over from the beginning?',
});

/* ---- General coverage sweep: Inventory (renderInv) + Bag (renderBag) ---- */
Object.assign(EXACT, {
  'Trang Bị — 12 Ô chuẩn GDD': 'Equipment — 12 Slots',
  'ĐANG MẶC (bấm để tháo) — đồ đặc biệt không rèn được': 'EQUIPPED (click to unequip) — special items cannot be enhanced',
  '⚡ Mặc Đồ Tốt Nhất': '⚡ Equip Best Gear',
  '— trống —': '— empty —',
  'Vật phẩm & vật liệu nằm trong': 'Items & materials are kept in your',
  'Túi Đồ (B)': 'Bag (B)',
  'VẬT LIỆU QUÝ — di chuột vào ô để xem tên & công dụng': 'PRECIOUS MATERIALS — hover a slot to see its name & use',
  'BẢO HẠP — Bá Chủ Giáng Thế': 'RELIC CHESTS — Overlord\'s Descent',
  'Mở Hạp': 'Open Chest',
  'NỘI ĐAN YÊU THÚ': 'BEAST INNER CORES',
  'TRANG BỊ NHẶT ĐƯỢC — bấm ô để MẶC NGAY · ▲ xanh = mạnh hơn · ⋯ để Phân Giải/Bán': 'PICKED-UP GEAR — click a slot to EQUIP NOW · ▲ green = stronger · ⋯ to Salvage/Sell',
  'Tự động bán đồ trắng/xanh lá khi nhặt (đổi lấy bạc)': 'Auto-sell white/green gear on pickup (for silver)',
  'Tự mặc đồ mạnh hơn khi nhặt (≥105% lực chiến, giữ đồ quý)': 'Auto-equip stronger gear on pickup (≥105% power, keeps rare items)',
  'Túi trống — hãy đi farm quái!': 'Bag is empty — go farm some monsters!',
  'Mặc Vào': 'Equip',
});

/* ---- General coverage sweep: Quest Log (renderQlog) ---- */
Object.assign(EXACT, {
  'Nhật Ký Nhiệm Vụ': 'Quest Log',
  '★ Chính Tuyến': '★ Main Quest',
  '◈ Phụ Tuyến': '◈ Side Quests',
  '📜 Nhật Ký': '📜 Journal',
  '🧭 Tới Ngay': '🧭 Go Now',
  '☬ Ngũ Ấn Trấn Bá Chủ': '☬ Five Seals Bind the Overlord',
  '🔍 Manh Mối': '🔍 Clues',
  '☬ Trấn Thủ Đã Gặp': '☬ Guardians Encountered',
  'Chưa có manh mối — hạ Thủ Vệ / Vệ Thần để thu thập.': 'No clues yet — defeat Wardens / Guardian Spirits to collect them.',
  'Chưa gặp trấn thủ nào.': 'No guardians encountered yet.',
  'Ngũ Ấn còn nguyên — Bá Chủ vẫn bị giam trong Vực Nguyên Thủy.': 'The Five Seals hold firm — the Overlord remains bound within the Primal Abyss.',
  'Phong ấn đang rạn nứt… bóng đêm phủ xuống Lunacia.': 'The seal is cracking… darkness falls over Lunacia.',
  '⚠ ẤN ĐÃ VỠ — Vực Nguyên Thủy sắp mở. Lunacia chờ ngươi khép ấn lại.': '⚠ THE SEAL IS BROKEN — the Primal Abyss is about to open. Lunacia awaits you to close it.',
  '☠ KẾT MỞ — Ấn đã vỡ. Bá Chủ sẽ giáng thế…': '☠ THE SEAL OPENS — the Overlord will soon descend…',
});

const RULES = [
  [/^Cấp (\d+)$/, 'Lv $1'],
  [/^Cấp (\d+) → (\d+)$/, 'Lv $1 → $2'],
  [/^Spark · Tầng (\d+)$/, 'Spark · Stage $1'],
  [/^Ascension cảnh (\d+) \((.*)\)$/, (m, a, b) => `Ascension Lv ${a} (${tr(b)})`],
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
  [/^yêu cầu LV(\d+)$/i, 'requires Lv$1'],
  [/^cần cấp (\d+)$/i, 'requires Lv $1'],
  [/^Lễ Bạc (\d+)◈$/, 'Gift $1◈ silver'],
  // ── Side-quest panel dynamic strings ──
  [/^Thưởng: (.+)$/, (m, a) => `Reward: ${a}`],
  [/^Tiến độ: (.*?) · Thưởng: (.+)$/, (m, a, b) => `Progress: ${a} · Reward: ${b}`],
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
  [/^Sách Kỹ Năng Phiêu Bạt — (.+)$/, (m, a) => `Jianghu Secret Manual — ${tr(a)}`],
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
  [/^\s*· (\d+) mana · (.+)$/, (m, a, b) => ` · ${a} Qi · ${b}`],
  // Map panel "Đang ở: <map> · <zone type> ·" status line: zt.name sits alone between two ` · `
  // markers, but Dã Ngoại · PK / Huyết Chiến · Free PK already contain a `·` themselves, so the
  // generic ` · (.+)` splitter below mis-splits on the zone type's own separator. Match the exact
  // zone-type names first so they translate as one unit.
  [/^· (An Toàn|Dã Ngoại · PK|Huyết Chiến · Free PK|Phó Bản) ·$/, (m, a) => `· ${tr(a)} ·`],
  [/^\s*· (.+)$/, (full, a) => { const j = a.split(' · ').map(p => tr(p)).join(' · '); return j === a ? full : ' · ' + j; }],
  [/^— (.+) —$/, (full, a) => { const t = tr(a); return t === a ? full : `— ${t} —`; }],
  [/^Cấp (\d+)\/120(?: · (.+?))? — nâng: ([\d.,]+) bạc, \+2,5% ST(?: · mốc kế (.+?) \(cấp (\d+)\): (.+?))? · cấp kỹ năng ≤ cấp nhân vật$/,
    (m, lv, cur, cost, nm, nmlv, mst) => {
      const ms = mst ? mst.replace('sát thương', 'DMG').replace('hồi chiêu', 'cooldown').replace('tiêu hao Qi', 'Qi cost') : '';
      return `Lv ${lv}/120${cur ? ' · ' + tr(cur) : ''} — upgrade: ${cost} silver, +2.5% DMG${nm ? ` · next milestone ${tr(nm)} (Lv ${nmlv}): ${ms}` : ''} · skill level ≤ character level`;
    }],
  // ── Character panel + sub-panels (renderChar/renderSettings + Forge/Mount/Ascension/Card) ──
  [/^Nhân Vật — (.+) Cấp (\d+)$/, (m, a, b) => `Character — ${tr(a)} Lv ${b}`],
  [/^☁ Tán Tiên — xuất thế khỏi (.+), ràng buộc Tộc đã phá bỏ$/, (m, a) => `☁ Ascended — transcended ${tr(a)}, the sect bond broken`],
  [/^hiện cấp (\d+)$/, 'currently Lv $1'],
  [/^☯ QUẺ TIÊN THIÊN · (.+)$/, (m, a) => `☯ THE HATCHING · ${tr(a)}`],
  [/^Trấn Phái: (.+)$/, (m, a) => `Signature Art: ${tr(a)}`],
  [/^(\d+) — (.+)$/, (m, a, b) => `${a} — ${tr(b)}`],
  [/^⚔ THẦN BINH — (.+)$/, (m, a) => `⚔ DIVINE WEAPON — ${tr(a)}`],
  [/^(.+?) · Tầng (\d+)【(.+?)】( — ĐÃ THỨC TỈNH ✦)?$/, (m, a, b, c, d) => `${tr(a)} · Stage ${b}【${tr(c)}】${d ? ' — AWAKENED ✦' : ''}`],
  [/^Luyện lên tầng (\d+)【(.+?)】$/, (m, a, b) => `Advance to Stage ${a}【${tr(b)}】`],
  [/^Cần: (\d+) Nội Đan \(có (\d+)\) \+ (\d+) Tinh Thạch \(có (\d+)\)$/, (m, a, b, c, d) => `Need: ${a} Inner Core (have ${b}) + ${c} Mystic Iron (have ${d})`],
  [/^Thiếu nguyên liệu: cần (\d+) Nội Đan \+ (\d+) Tinh Thạch$/, (m, a, b) => `Missing materials: need ${a} Inner Core + ${b} Mystic Iron`],
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
