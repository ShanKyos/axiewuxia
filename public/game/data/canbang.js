/* ═══ BẢNG CÂN BẰNG — dữ liệu thuần, không có mã ═══
   Nạp TRƯỚC game.js (xem index.html), cùng khuôn mẫu với strings/vi.js.

   VÌ SAO Ở ĐÂY: sửa một con số cân bằng không nên phải mở tệp 26.000 dòng. Tám bảng dưới đây
   được chọn vì chúng KHÔNG phụ thuộc vào bất kỳ hằng hay hàm nào khác trong game.js — đã kiểm
   bằng cách quét mọi định danh viết hoa và mọi lời gọi hàm bên trong từng khối. Bảng nào còn
   phụ thuộc (VOHOC_DEFS cần SIGNATURE_SKILL, SECTS gọi doBasic, MAPS cần REGION_UNLOCK_LORE,
   SIDE_QUESTS cần NPC) thì CHƯA dời — dời mà không xử thứ tự nạp là trang trắng bóc.

   VÌ SAO LÀ .js CHỨ KHÔNG PHẢI .json: game.js là classic script, 490 khai báo cấp cao và 29
   câu lệnh chạy ngay lúc nạp. Đổi sang fetch JSON là phải chờ bất đồng bộ trước khi khởi động
   — đúng loại thay đổi từng làm trắng trang trong dự án này. Tệp .js gán vào window thì nạp
   đồng bộ, không đổi gì về thứ tự.
*/

// ═══════════ KHẾ ƯỚC CHIMERA — đồng hành quay ra từ gacha ═══════════
// Thay hẳn hệ Thú Chiến cũ (5 giai, nâng bằng Lumen + Huyền Thiết, thất bại giữ nguyên giai).
// Thiết kế đầy đủ: docs/GACHA_KHE_UOC.md. Hoạt ảnh quay: docs/proto/khe_uoc_anim.html.
//
// Vì sao thay chứ không thêm: game đã có HAI hệ đồng hành (Thú Chiến + Linh Thú), thêm cái thứ ba
// là ba ô, ba đường nâng cấp, ba bảng. Chủ dự án chốt cho Chimera nuốt Thú Chiến — hành vi chiến
// đấu (đi theo, tự đánh) giữ nguyên, chỉ đổi CÁCH CÓ nó: quay được thay vì nâng giai.
//
// Art: cả 16 con là ảnh Axie thật, dựng từ 16 rig Spine KHÁC NHAU trong axie-origins-asset-kit
// (assets/chimera/*.png — xem tools/spine/ và docs/ASSET_SOURCING.md). Cố tình không lấy bản biến
// thể của cùng một rig: hai con chỉ khác cái mũ thì trong màn nhìn như lỗi trùng ảnh.
window.CHIMERA = [
  // ── 5★ ──────────────────────────────────────────────────────────────────────
  { id:'aurelion',  ten:'Aurelion',  sao:5, lop:'Dawn',    mau:'#e0a63c', img:'assets/chimera/aurelion.png',
    thu:{ k:'skillPct', v:12 }, thuTxt:'+12% sát thương chiêu thức',
    chieu:{ ten:'Rạng Đông', cd:14, r:150, mult:2.6, fx:'sun' }, moTa:'Bình minh đọng lại thành hình — nơi nó đứng, bóng tối không tới được.' },
  { id:'netherfang',ten:'Netherfang',sao:5, lop:'Dusk',    mau:'#8a5ad8', img:'assets/chimera/netherfang.png',
    thu:{ k:'hpLeech', v:6 }, thuTxt:'hút 6% sát thương gây ra thành Sinh Lực',
    chieu:{ ten:'Màn Đêm', cd:16, r:170, mult:2.2, fx:'dark', slow:0.4 }, moTa:'Sinh ra từ khe nứt. Nó không săn mồi — nó chờ mồi kiệt sức.' },
  { id:'tidewarden',ten:'Tidewarden',sao:5, lop:'Aquatic', mau:'#3ac8c8', img:'assets/chimera/tidewarden.png',
    thu:{ k:'hpPct', v:15 }, thuTxt:'+15% Sinh Lực tối đa',
    chieu:{ ten:'Triều Chắn', cd:18, r:0, mult:0, fx:'shield', shieldPct:30 }, moTa:'Càng nước dựng lên một bức tường, và bức tường đó biết bơi.' },
  { id:'emberjaw',  ten:'Emberjaw',  sao:5, lop:'Beast',   mau:'#f0932a', img:'assets/chimera/emberjaw.png',
    thu:{ k:'aspdPct', v:10 }, thuTxt:'+10% tốc độ đánh',
    chieu:{ ten:'Lao Húc', cd:12, r:190, mult:2.8, fx:'charge', kb:60 }, moTa:'Chạy trước, nghĩ sau, và chưa bao giờ thấy cần nghĩ.' },
  { id:'voltcrest', ten:'Voltcrest', sao:5, lop:'Bird',    mau:'#4fc9d9', img:'assets/chimera/voltcrest.png',
    thu:{ k:'evaPct', v:8 }, thuTxt:'+8% né đòn',
    chieu:{ ten:'Mào Sét', cd:15, r:320, mult:2.0, fx:'bolt', multi:5 }, moTa:'Cái mào trên đầu tích điện cả ngày. Đập cánh một cái là năm chỗ cùng nổ.' },
  { id:'ironshell', ten:'Ironshell', sao:5, lop:'Reptile', mau:'#7bbf3a', img:'assets/chimera/ironshell.png',
    thu:{ k:'dmgred', v:10 }, thuTxt:'−10% sát thương gánh chịu',
    chieu:{ ten:'Khiêu Chiến', cd:17, r:220, mult:1.4, fx:'taunt', taunt:8 }, moTa:'Vác nguyên tảng đá trên lưng. Nó đứng chắn trước mặt bạn và không hiểu vì sao bạn lại lo.' },
  // ── 4★ ──────────────────────────────────────────────────────────────────────
  { id:'petalkin',  ten:'Petalkin',  sao:4, lop:'Plant',   mau:'#e87ab0', img:'assets/chimera/petalkin.png',
    thu:{ k:'hpPct', v:6 }, thuTxt:'+6% Sinh Lực tối đa',
    chieu:{ ten:'Bung Cánh', cd:16, r:130, mult:1.6, fx:'sun' }, moTa:'Con Chimera đầu tiên chịu đi theo người lạ.' },
  { id:'crimsonmaw',ten:'Crimsonmaw',sao:4, lop:'Beast',   mau:'#c0304a', img:'assets/chimera/crimsonmaw.png',
    thu:{ k:'atkPct', v:5 }, thuTxt:'+5% Công Kích',
    chieu:{ ten:'Ngoạm', cd:14, r:120, mult:1.9, fx:'charge', kb:30 }, moTa:'Vết cắn của nó không lành lại — chỉ đóng vảy.' },
  { id:'thornpaw',  ten:'Thornpaw',  sao:4, lop:'Plant',   mau:'#cf5a52', img:'assets/chimera/thornpaw.png',
    thu:{ k:'crit', v:4 }, thuTxt:'+4% Bạo Kích',
    chieu:{ ten:'Vuốt Gai', cd:15, r:130, mult:1.7, fx:'charge' }, moTa:'Quả mọng đỏ mọc kín người, và mỗi quả giấu một cái gai.' },
  { id:'inkmane',   ten:'Inkmane',   sao:4, lop:'Dusk',    mau:'#c2c6d2', img:'assets/chimera/inkmane.png',
    thu:{ k:'hpPct', v:5 }, thuTxt:'+5% Sinh Lực tối đa',
    chieu:{ ten:'Vằn Mực', cd:16, r:150, mult:1.6, fx:'shield', shieldPct:14 }, moTa:'Vằn đen trên lưng nó đổi chỗ mỗi lần bạn quay đi.' },
  { id:'cinderbeak',ten:'Cinderbeak',sao:4, lop:'Bird',    mau:'#f0b45a', img:'assets/chimera/cinderbeak.png',
    thu:{ k:'aspdPct', v:4 }, thuTxt:'+4% tốc độ đánh',
    chieu:{ ten:'Mỏ Than', cd:14, r:280, mult:1.6, fx:'bolt', multi:3 }, moTa:'Rỉa than nóng như rỉa hạt.' },
  { id:'mossback',  ten:'Mossback',  sao:4, lop:'Plant',   mau:'#e7dcc2', img:'assets/chimera/mossback.png',
    thu:{ k:'dmgred', v:4 }, thuTxt:'−4% sát thương gánh chịu',
    chieu:{ ten:'Vỏ Rêu', cd:18, r:0, mult:0, fx:'shield', shieldPct:16 }, moTa:'Ngủ đủ lâu thì hoa mọc trên lưng. Nó vẫn chưa dậy.' },
  { id:'hexmite',   ten:'Hexmite',   sao:4, lop:'Bug',     mau:'#d8443c', img:'assets/chimera/hexmite.png',
    thu:{ k:'atkPct', v:4 }, thuTxt:'+4% Công Kích',
    chieu:{ ten:'Bầy Nhỏ', cd:15, r:160, mult:1.5, fx:'dark' }, moTa:'Một con thì không sao. Nó không bao giờ có một con.' },
  { id:'ridgehorn', ten:'Ridgehorn', sao:4, lop:'Reptile', mau:'#b45ad0', img:'assets/chimera/ridgehorn.png',
    thu:{ k:'dmgred', v:4 }, thuTxt:'−4% sát thương gánh chịu',
    chieu:{ ten:'Húc Sừng', cd:15, r:150, mult:1.8, fx:'charge', kb:36 }, moTa:'Ba cái sừng, và nó chưa bao giờ dùng quá một cái.' },
  { id:'coghound',  ten:'Coghound',  sao:4, lop:'Mech',    mau:'#e8e0d0', img:'assets/chimera/coghound.png',
    thu:{ k:'crit', v:4 }, thuTxt:'+4% Bạo Kích',
    chieu:{ ten:'Bánh Răng', cd:14, r:140, mult:1.7, fx:'bolt', multi:2 }, moTa:'Ai đó lắp nó lại từ mảnh vỡ, và nó nhớ ơn.' },
  { id:'sunspur',   ten:'Sunspur',   sao:4, lop:'Dawn',    mau:'#efdcb4', img:'assets/chimera/sunspur.png',
    thu:{ k:'atkPct', v:4 }, thuTxt:'+4% Công Kích',
    chieu:{ ten:'Cựa Nắng', cd:15, r:140, mult:1.7, fx:'sun' }, moTa:'Bộ lông nó giữ nắng của ngày hôm trước, ấm tới tận sáng.' },
];

window.CHI_KY = {
  Beast:   [{ ten:'Gầm Vang',    k:'atkPct', v:5,  txt:'+5% Công Kích' },
            { ten:'Da Dày',      k:'dmgred', v:4,  txt:'−4% sát thương gánh chịu' },
            { ten:'Máu Săn',     tam:{ k:'atkPct', v:14, t:6 }, txt:'Chiêu nổ: +14% Công Kích trong 6 giây' },
            { ten:'Bám Riết',    tam:{ k:'aspdPct', v:18, t:6 }, txt:'Chiêu nổ: +18% tốc đánh trong 6 giây' }],
  Aquatic: [{ ten:'Vảy Nước',    k:'dmgred', v:5,  txt:'−5% sát thương gánh chịu' },
            { ten:'Thuỷ Triều',  k:'hpPct',  v:6,  txt:'+6% Sinh Lực tối đa' },
            { ten:'Cuốn Dòng',   tam:{ k:'evaPct', v:12, t:5 }, txt:'Chiêu nổ: +12% né đòn trong 5 giây' },
            { ten:'Sóng Ngầm',   tam:{ k:'hpLeech', v:5, t:8 }, txt:'Chiêu nổ: hút 5% sát thương thành Sinh Lực trong 8 giây' }],
  Plant:   [{ ten:'Rễ Bám',      k:'hpPct',  v:7,  txt:'+7% Sinh Lực tối đa' },
            { ten:'Nhựa Lành',   k:'qireg',  v:4,  txt:'+4 hồi Mana' },
            { ten:'Nảy Mầm',     tam:{ k:'dmgred', v:12, t:6 }, txt:'Chiêu nổ: −12% sát thương gánh chịu trong 6 giây' },
            { ten:'Đơm Hoa',     tam:{ k:'hpPct', v:16, t:8 }, txt:'Chiêu nổ: +16% Sinh Lực tối đa trong 8 giây' }],
  Bird:    [{ ten:'Sải Cánh',    k:'aspdPct', v:5, txt:'+5% tốc đánh' },
            { ten:'Mắt Diều',    k:'crit',   v:4,  txt:'+4% Bạo Kích' },
            { ten:'Bổ Nhào',     tam:{ k:'crit', v:15, t:5 }, txt:'Chiêu nổ: +15% Bạo Kích trong 5 giây' },
            { ten:'Gió Ngược',   tam:{ k:'aspdPct', v:20, t:5 }, txt:'Chiêu nổ: +20% tốc đánh trong 5 giây' }],
  Bug:     [{ ten:'Nọc Ngấm',    k:'pierce', v:5,  txt:'+5% xuyên giáp' },
            { ten:'Vỏ Kitin',    k:'dmgred', v:3,  txt:'−3% sát thương gánh chịu' },
            { ten:'Bầy Kéo',     tam:{ k:'atkPct', v:12, t:7 }, txt:'Chiêu nổ: +12% Công Kích trong 7 giây' },
            { ten:'Độc Ngầm',    tam:{ k:'pierce', v:14, t:6 }, txt:'Chiêu nổ: +14% xuyên giáp trong 6 giây' }],
  Reptile: [{ ten:'Mai Cứng',    k:'dmgred', v:6,  txt:'−6% sát thương gánh chịu' },
            { ten:'Máu Lạnh',    k:'hpPct',  v:5,  txt:'+5% Sinh Lực tối đa' },
            { ten:'Thủ Thế',     tam:{ k:'dmgred', v:14, t:8 }, txt:'Chiêu nổ: −14% sát thương gánh chịu trong 8 giây' },
            { ten:'Phản Vảy',    tam:{ k:'hpLeech', v:6, t:6 }, txt:'Chiêu nổ: hút 6% sát thương thành Sinh Lực trong 6 giây' }],
  Mech:    [{ ten:'Bánh Răng',   k:'aspdPct', v:4, txt:'+4% tốc đánh' },
            { ten:'Lõi Nạp',     k:'atkPct', v:5,  txt:'+5% Công Kích' },
            { ten:'Quá Tải',     tam:{ k:'atkPct', v:16, t:5 }, txt:'Chiêu nổ: +16% Công Kích trong 5 giây' },
            { ten:'Hiệu Chuẩn',  tam:{ k:'crit', v:13, t:7 }, txt:'Chiêu nổ: +13% Bạo Kích trong 7 giây' }],
  Dawn:    [{ ten:'Ánh Sớm',     k:'expPct', v:8,  txt:'+8% Kinh Nghiệm' },
            { ten:'Rạng Người',  k:'crit',   v:3,  txt:'+3% Bạo Kích' },
            { ten:'Bình Minh',   tam:{ k:'atkPct', v:13, t:7 }, txt:'Chiêu nổ: +13% Công Kích trong 7 giây' },
            { ten:'Chói Loà',    tam:{ k:'evaPct', v:10, t:6 }, txt:'Chiêu nổ: +10% né đòn trong 6 giây' }],
  Dusk:    [{ ten:'Bóng Đổ',     k:'evaPct', v:4,  txt:'+4% né đòn' },
            { ten:'Hút Đêm',     k:'hpLeech', v:3, txt:'hút 3% sát thương thành Sinh Lực' },
            { ten:'Màn Sương',   tam:{ k:'evaPct', v:14, t:6 }, txt:'Chiêu nổ: +14% né đòn trong 6 giây' },
            { ten:'Nuốt Bóng',   tam:{ k:'hpLeech', v:7, t:7 }, txt:'Chiêu nổ: hút 7% sát thương thành Sinh Lực trong 7 giây' }],
};

window.QUESTS = [
  { id:1, lv:1, name:'Kẻ Rơi Xuống',  desc:'Ngươi vừa vượt vết nứt và mất sạch ký ức võ nghệ. Đến gặp Trưởng Lão Rell giữa Lunaris City — ông ta là người Vaeldra duy nhất còn nhớ đội tiên phong.',
    // 130 × 1,5 = 195/200: xong NV1 là NV2 khoá "cần cấp 2" ngay trong một thành phố KHÔNG có quái. 140 × 1,5 = 210 → lên cấp 2 ngay.
    type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:140, silver:50} },
  { id:2, lv:2, name:'Cơn Sốt Của Hòn Đảo', desc:'Khí Morvahn đã liếm tới Petalshade Isle — thú hiền hóa dại. Về đảo (bản đồ M → Dịch Chuyển) hạ 5 Axie Heo Rừng đang húc phá tổ ấp, rồi báo lại Trưởng Làng.',
    type:'kill', mob:'boar', need:5, rew:{xp:190, silver:60} },
  { id:3, lv:3, name:'Thuốc Cho Đàn Con', desc:'Lũ hatchling hít phải khí vết nứt, sốt cao không dứt. Trưởng Làng cần 4 Thảo Dược trong rừng phía đông đảo.',
    type:'collect', herbMap:'daohoa', need:4, rew:{xp:360, silver:90} },
  { id:4, lv:4, name:'Bầy Gai Đã Đổi Mắt', desc:'Axie Gai Tím trong rừng giờ mắt đỏ quạch và không còn biết sợ — dấu hiệu đầu tiên của Chimera hóa. Diệt 6 con trước khi chúng xuống tới làng.',
    type:'kill', mob:'wolf', need:6, rew:{xp:470, silver:560, item:'vukhi'} },
  { id:5, lv:5, name:'Thép Của Ardhaven', desc:'Thợ rèn Ardhaven sống sót qua cuộc giao thoa, lò của ông dựng tạm ngay cạnh làng. Mang trang bị tới Thợ Rèn Lưu Vong (phím F dẫn đường) và Tăng Cường một món bất kỳ lên +3.',
    type:'enhance', need:3, rew:{xp:520, silver:580} },   // P0: lò rèn mở ở cấp 4 — NV4 thưởng sẵn vũ khí + Lumen để rèn ngay
  { id:6, lv:6, name:'Đoàn Gloam', desc:'Đoàn Gloam — lính Vaeldra đào ngũ — dụ đám Axie nhiễm khí làm tay sai đi cướp phá dân đảo. Diệt 8 Tay Sai Gloam trên đồi phía đông nam.',
    type:'kill', mob:'bandit', need:8, rew:{xp:1200, silver:170} }, // QA bot: tăng XP giữ nhịp cấp với chuỗi NV
  { id:7, lv:7, name:'Mảnh Ký Ức Đầu Tiên', desc:'Nước suối cạnh làng lọc sạch khí vết nứt. Đứng trong suối 8 giây — ký ức võ nghệ Vaeldra của ngươi sẽ nhen lại thành Bản Năng.',
    type:'meditate', need:8, rew:{xp:920, silver:450} },
  { id:8, lv:8, name:'Lớp Giáp Bóng Tối', desc:'Một Gloam Marauder đã ngấm khí Morvahn, bọc quanh mình lớp giáp bóng tối — sát thương thường giảm 70%. Dùng Trấn Phái (phím 2) phá giáp rồi kết liễu hắn.',
    type:'kill', mob:'assassin', need:1, rew:{xp:1900, silver:220} }, // QA bot: tăng XP giữ nhịp cấp
  { id:9, lv:9, name:'Bàn Tay Còn Nhớ', desc:'Ký ức chưa về, nhưng bàn tay đã nhớ ra tuyệt kỹ của lớp mình — Trấn Phái (phím 2). Dùng nó kết liễu 5 Tay Sai Gloam.',
    type:'tpkill', mob:'bandit', need:5, rew:{xp:1600, silver:320} },
  { id:10, lv:10, name:'Ký Ức Trở Về', desc:'Thủ lĩnh Đoàn Gloam đã dựng trại trên đài phía đông. Hạ hắn — và ký ức đội tiên phong Vaeldra của ngươi sẽ trở về trọn vẹn.',
    type:'boss', mob:'boss', need:1, rew:{xp:2500, silver:500} },
];

window.BOSS_DEFS = {
  daohoa: { thuve:[
      { id:'dh1', name:'Chúa Heo Rừng',       lv:6,  el:'Thổ',  img:'boar',     x:0.4346, y:0.3526, moves:['vach','xung','cuong'] },
      { id:'dh2', name:'Chúa Bầy Gai Tím',        lv:9,  el:'Mộc',  img:'wolf',     x:0.7077, y:0.8842, moves:['xung','goi','vach'] },
      { id:'dh3', name:'Chấp Sự Gloam',  lv:12, el:'Thủy', img:'assassin', x:.42, y:.80, moves:['vach','vong','cuong'] } ],
    tranai: { id:'dh4', name:'Thủ Lĩnh Đoàn Gloam', lv:14, el:'Hỏa', img:'boss_hacphong', x:.86, y:.80, moves:['vong','vach','goi','cuong'] } },
  ngoai: { thuve:[
      { id:'ng1', name:'Đầu Mục Gloam',    lv:13, el:'Kim',  img:'bandit',   x:0.2885, y:0.4053, moves:['vach','xung','cuong'] },
      { id:'ng2', name:'Gai Tím Độc Nhãn',lv:16, el:'Mộc',  img:'wolf',     x:0.5423, y:0.7526, moves:['xung','vong','goi'] },
      { id:'ng3', name:'Đặc Vụ Gloam',   lv:19, el:'Thủy', img:'assassin', x:.40, y:.80, moves:['vach','xung','cuong'] } ],
    tranai: { id:'ng4', name:'Ma Sói Sương Trắng', lv:22, el:'Hỏa', img:'boss_sontac', x:.85, y:.78, moves:['vach','vong','goi','cuong'] } },
  chungnam: { thuve:[
      { id:'cn1', name:'Kẻ Đổi Phe',        lv:23, el:'Thủy', img:'phando',   x:.30, y:.32, moves:['vach','xung','goi'] },
      { id:'cn2', name:'Golem Gỗ Cổ Đại',    lv:26, el:'Thổ',  img:'mocnhan',  x:0.5731, y:0.4684, moves:['vong','vach','cuong'] },
      { id:'cn3', name:'Trưởng Lão Tha Hóa', lv:29, el:'Thủy', img:'boss_phando', x:.44, y:.80, moves:['xung','vach','vong'] } ],
    tranai: { id:'cn4', name:'Tướng Quân Thornwood Reach', lv:32, el:'Thủy', img:'bandao', x:.86, y:.80, moves:['vach','xung','vong','cuong'] } },
  comoc: { thuve:[
      { id:'cm1', name:'Chỉ Huy Vong Binh',  lv:43, el:'Thổ',  img:'kybinh',   x:0.3654, y:0.4579, moves:['xung','vach','goi'] },
      { id:'cm2', name:'Kẻ An Táng Bóng Tối',lv:46, el:'Thủy', img:'thinu',    x:0.5654, y:0.8053, moves:['vong','xung','cuong'] },
      { id:'cm3', name:'Chúa Tể Bất Tử',     lv:49, el:'Thổ',  img:'mocnhan',  x:.42, y:.80, moves:['vach','vong','goi'] } ],
    tranai: { id:'cm4', name:'Tướng Quân Hollow Roost', lv:52, el:'Mộc', img:'boss_mochu', x:.85, y:.80, moves:['vong','xung','goi','cuong'] } },
  tuyettinh: { thuve:[
      { id:'tt1', name:'Kẻ Lạc Lối Tuyệt Vọng',lv:63, el:'Thổ',  img:'ttdetu', x:0.3115, y:0.1947, moves:['vach','goi','cuong'] },
      { id:'tt2', name:'Cỏ Dại Băng Giá',     lv:66, el:'Hỏa',  img:'caodo',    x:0.6115, y:0.6158, moves:['xung','vong','goi'] },
      { id:'tt3', name:'Xoáy Sương Nguyền',    lv:69, el:'Mộc',  img:'boss_tinhhoa', x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'tt4', name:'Tướng Quân Frostmire Vale', lv:72, el:'Mộc', img:'thinu', x:.86, y:.80, moves:['vong','vach','xung','cuong'] } },
  mongco: { thuve:[
      { id:'mc1', name:'Kỵ Sĩ Trưởng Tro Tàn', lv:83, el:'Kim', img:'kybinh',  x:0.3269, y:0.2158, moves:['xung','vach','cuong'] },
      { id:'mc2', name:'Cung Thủ Tinh Nhuệ Tro Tàn', lv:86, el:'Mộc',  img:'cungthu',  x:0.55, y:0.7632, moves:['vong','xung','goi'] },
      { id:'mc3', name:'Thống Lĩnh Tro Tàn', lv:89, el:'Kim', img:'cuongbinh',x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'mc4', name:'Tướng Quân Ashen Steppe', lv:92, el:'Kim', img:'boss_dothong', x:.86, y:.80, moves:['xung','vong','goi','cuong'] } },
  nhanmon: { thuve:[
      { id:'nm1', name:'Tướng Quân Bão Tố',  lv:103, el:'Kim', img:'daokhach', x:0.3423, y:0.2368, moves:['vach','xung','cuong'] },
      { id:'nm2', name:'Huyết Sát Bão Tố',   lv:106, el:'Hỏa',  img:'cuongbinh',x:0.5654, y:0.5105, moves:['vong','vach','goi'] },
      { id:'nm3', name:'Tướng Quân Cửa Ải', lv:109, el:'Thổ',  img:'boss_thienbinh', x:0.3038, y:0.9105, moves:['xung','vong','vach'] } ],
    tranai: { id:'nm4', name:'Tướng Quân Stormgate Pass', lv:112, el:'Hỏa', img:'boss_thienbinh', x:.86, y:.80, moves:['vach','xung','vong','cuong'] } },
};

// ═══════════ BỘ GIÁP RIÊNG TỪNG LỚP ═══════════
// Bản đầu tôi vẽ 4 lớp GENERIC cho cả 6 lớp nhân vật — kết quả là pháp sư mặc áo choàng lại
// đeo đúng cái vai giáp tấm của hiệp sĩ, và cả 5 lớp trông như mặc chung một bộ. Sai hẳn.
//
// MU Online làm theo kiểu khác: mỗi lớp có DÒNG GIÁP RIÊNG, đổi cả tạo hình lẫn bảng màu theo
// mốc cấp, và mỗi bộ có TÊN để người chơi gọi tên nhau. Đó mới là "nhìn là biết đẳng cấp".
//
// TÊN QUYẾT ĐỊNH HÌNH: mỗi bộ phủ ĐÚNG MỘT giai và mang đặc trưng của chính cái tên nó — đó là
// yêu cầu đặt ra cho gói art, không còn là tổ hợp tham số dựng máy. Từng có một đường vector
// dựng bộ giáp từ style/crest/sh (vai nền, mào đầu, hoa văn ngực, kiểu ủng, gai, nếp, đinh
// tán); đường đó đã gỡ hẳn để nhường chỗ cho art Spine thật.
window.HERO_SETS = {
  // BẢY BỘ GIÁP mỗi lớp, một bộ một giai. Sau khi gỡ hết hình vector thì mỗi bộ chỉ còn ĐÚNG
  // ba thứ, và cả ba đều còn việc để làm:
  //   min  — giai của bộ (1..7), cũng là khoá tra art trong NV_GIAP
  //   name — tên bộ; tên vũ khí cùng giai lấy đúng chữ này
  //   tint — MÀU NHẬN DIỆN của bộ. Không phải để vẽ giáp nữa (giáp là art Spine), mà để tô
  //          hào quang rèn +4/+7/+10 và ánh sáng quanh chân — nhờ vậy đập đồ lên vẫn nhìn ra
  //          màu của chính bộ đang mặc. Khi có gói Spine thì lấy màu chủ đạo của gói đặt vào.
  // Đã gỡ: style · crest · sh — ba trường chỉ nuôi hàm vẽ giáp vector, nay không còn ai đọc.
  // Dark Knight
  thieulam: [
    { min:1, name:'Thiết Phiến', tint:{ lo:'#3f444e', hi:'#5c6270', trim:'#8a92a4', glow:null } },
    { min:2, name:'Giáp Đồng', tint:{ lo:'#5d6a78', hi:'#aebdcc', trim:'#c9d4de', glow:null } },
    { min:3, name:'Ngân Giáp', tint:{ lo:'#6a7382', hi:'#c6d0dc', trim:'#eef4fb', glow:'#a8c4e0' } },
    { min:4, name:'Vảy Rồng', tint:{ lo:'#3a1f22', hi:'#7a3a34', trim:'#c8a84a', glow:'#c8703a' } },
    { min:5, name:'Bạo Long', tint:{ lo:'#5a2a10', hi:'#b85a1c', trim:'#ffc06a', glow:'#ff7a20' } },
    { min:6, name:'Lôi Đình', tint:{ lo:'#1e2a5a', hi:'#3a6ad0', trim:'#bfe4ff', glow:'#6aa8ff' } },
    { min:7, name:'Long Vương', tint:{ lo:'#4a3a6a', hi:'#b0a0e8', trim:'#ffffff', glow:'#e0d0ff' } },
  ],
  // Dark Wizard
  baidasan: [
    { min:1, name:'Vải Thô', tint:{ lo:'#4a4038', hi:'#6b5c4c', trim:'#8a7a5c', glow:null } },
    { min:2, name:'Nhân Sư', tint:{ lo:'#5a4a2c', hi:'#c8b070', trim:'#3ac8c0', glow:'#7ee0d8' } },
    { min:3, name:'Triệu Hồn', tint:{ lo:'#16304a', hi:'#2f6fa8', trim:'#9ed4ff', glow:'#5ea0e8' } },
    { min:4, name:'Thần Ma', tint:{ lo:'#3e1020', hi:'#a02040', trim:'#ff9ab0', glow:'#e04060' } },
    { min:5, name:'Quỷ Vương', tint:{ lo:'#14361e', hi:'#2e8a48', trim:'#a8f0b8', glow:'#5ad078' } },
    { min:6, name:'Tinh Vân', tint:{ lo:'#2a1a5a', hi:'#6a4ad0', trim:'#d0c0ff', glow:'#a88aff' } },
    { min:7, name:'Hư Vô', tint:{ lo:'#160f2c', hi:'#3a2a6a', trim:'#7ecbff', glow:'#6ff0ff' } },
  ],
  // Sylvan Ranger
  toanchan: [
    { min:1, name:'Da Rừng', tint:{ lo:'#4a3c2c', hi:'#6e5a40', trim:'#8a7448', glow:null } },
    { min:2, name:'Lá Thép', tint:{ lo:'#2f4436', hi:'#4a6b52', trim:'#9aa858', glow:null } },
    { min:3, name:'Gai Rừng', tint:{ lo:'#24402f', hi:'#3e6b4a', trim:'#8ad86a', glow:'#7ad86a' } },
    { min:4, name:'Lông Cú', tint:{ lo:'#4a3a28', hi:'#8a7050', trim:'#e0cfa8', glow:'#c0a878' } },
    { min:5, name:'Sương Mai', tint:{ lo:'#48586a', hi:'#a8c0d8', trim:'#f0f8ff', glow:'#c0e0f8' } },
    { min:6, name:'Nguyệt Quế', tint:{ lo:'#5a5218', hi:'#c0b040', trim:'#fff0a8', glow:'#e0d060' } },
    { min:7, name:'Bạch Phượng', tint:{ lo:'#6a3a4a', hi:'#e0a0b0', trim:'#fff0f4', glow:'#ffc0d0' } },
  ],
  // Spellblade
  minhgiao: [
    { min:1, name:'Bán Giáp', tint:{ lo:'#4a4038', hi:'#7a6a58', trim:'#9a7a4a', glow:null } },
    { min:2, name:'Da Nung', tint:{ lo:'#5a3a20', hi:'#9a6438', trim:'#d8a060', glow:null } },
    { min:3, name:'Tro Tàn', tint:{ lo:'#3e3a38', hi:'#78706c', trim:'#c0b4a8', glow:'#9a8e84' } },
    { min:4, name:'Lửa Dữ', tint:{ lo:'#6a1e10', hi:'#d85a22', trim:'#ffd08a', glow:'#ff6a1a' } },
    { min:5, name:'Dung Nham', tint:{ lo:'#521004', hi:'#b83010', trim:'#ffa050', glow:'#ff5a10' } },
    { min:6, name:'Long Diễm', tint:{ lo:'#5e3a04', hi:'#e0a018', trim:'#fff4c8', glow:'#ffcc30' } },
    { min:7, name:'Viêm Đế', tint:{ lo:'#6a1000', hi:'#ff3a10', trim:'#ffe08a', glow:'#ff8000' } },
  ],
  // Dark Lord
  bug: [
    { min:1, name:'Lệnh Giáp', tint:{ lo:'#454a30', hi:'#6a7248', trim:'#8a8a58', glow:null } },
    { min:2, name:'Thân Vệ', tint:{ lo:'#2a3a52', hi:'#4a6a92', trim:'#9ab8dc', glow:null } },
    { min:3, name:'Kim Miện', tint:{ lo:'#6a5808', hi:'#e8c428', trim:'#fff4b0', glow:'#ffd840' } },
    { min:4, name:'Bạo Chúa', tint:{ lo:'#3a1a4a', hi:'#7a3a9a', trim:'#d8a0f0', glow:'#b060d8' } },
    { min:5, name:'Ngai Đen', tint:{ lo:'#16161c', hi:'#38384a', trim:'#9a9ac0', glow:'#6a6a98' } },
    { min:6, name:'Hắc Đế', tint:{ lo:'#0e0e12', hi:'#2a2a34', trim:'#c0a040', glow:'#8a7020' } },
    { min:7, name:'Đế Vương', tint:{ lo:'#5a5230', hi:'#f0e4b0', trim:'#ffffff', glow:'#fff0c0' } },
  ],
};

// ── VŨ KHÍ: 5 lớp × 3 dòng × 14 nấc = 210 ───────────────────────────────────
// Viết theo DÒNG + đè theo nấc, thay vì 210 dòng đầy đủ: đọc ra ngay dòng nào leo thế nào.
// Tên nấc = <loại vũ khí> + <danh xưng giai của lớp>, trùng danh xưng với bộ giáp cùng giai,
// nên nhìn cây vũ khí là biết người kia đang ở giai nào mà không cần rê chuột.
// Dáng đổi ở giai 4 / 7 / 10 / 13 cho khớp hStage; chất liệu và cỡ thì đổi từng giai.
window.WEAPON_LINES = [
  // MƯỜI LĂM DÒNG vũ khí, mỗi dòng bảy nấc. Sau khi gỡ hình vector, mỗi nấc chỉ còn TÊN và —
  // ở nấc nào có — HOA VĂN. Đã gỡ: blade · guard · pommel · shaft · w · len · gw · big · mat,
  // chín trường dựng cây vũ khí từ tổ hợp bộ phận cho hàm vẽ vector.
  //
  // Hai trường CÒN LẠI có việc thật, đừng dọn tiếp:
  //   base.art — weapon | staff | bow | crossbow. Không phải để vẽ, mà để chọn LỐI RA ĐÒN của
  //              thần khí (TK_LOI): chém vòng cung · đâm thẳng · giương ngang · ngắm bằng.
  //   motif    — set | bang | lua | runes | mach | gai. Lái HIỆU ỨNG CHẠM ĐÒN qua MOTIF_FX:
  //              kiếm điện loé xanh, kiếm băng bắn mảnh, kiếm lửa ra tàn than.
  //
  // Tranh của từng cây khai riêng trong VK_ANH ở game.js, tra theo '<line>|<giai>'.
  // ══ Dark Knight ══
  { sect:'thieulam', line:'kiem', slot:'vukhi', desc:'cân bằng',
    base:{ art:'weapon' },
    t:[ ['Kiếm Đồng', {}],
        ['Kiếm Thép', {}],
        ['Kiếm Bạc', {}],
        ['Kiếm Vảy Rồng', { motif:'gai' }],
        ['Kiếm Bạo Long', { motif:'gai' }],
        ['Kiếm Lôi Đình', { motif:'lua' }],
        ['Kiếm Long Vương', { motif:'mach' }] ] },
  { sect:'thieulam', line:'riu', slot:'vukhi', desc:'sát thương cao, chậm',
    base:{ art:'weapon' },
    t:[ ['Rìu Đồng', {}],
        ['Rìu Thép', {}],
        ['Rìu Bạc', {}],
        ['Rìu Vảy Rồng', { motif:'gai' }],
        ['Rìu Bạo Long', { motif:'gai' }],
        ['Rìu Lôi Đình', { motif:'lua' }],
        ['Rìu Long Vương', { motif:'mach' }] ] },
  { sect:'thieulam', line:'chuy', slot:'vukhi', desc:'phá giáp',
    base:{ art:'weapon' },
    t:[ ['Chùy Đồng', {}],
        ['Chùy Thép', {}],
        ['Chùy Bạc', {}],
        ['Chùy Vảy Rồng', { motif:'gai' }],
        ['Chùy Bạo Long', { motif:'gai' }],
        ['Chùy Lôi Đình', { motif:'lua' }],
        ['Chùy Long Vương', { motif:'mach' }] ] },
  // ══ Dark Wizard ══
  { sect:'baidasan', line:'gay', slot:'vukhi', desc:'sát thương phép',
    base:{ art:'staff' },
    t:[ ['Gậy Gỗ', {}],
        ['Gậy Nhân Sư', {}],
        ['Gậy Triệu Hồn', {}],
        ['Gậy Thần Ma', {}],
        ['Gậy Quỷ Vương', {}],
        ['Gậy Tinh Vân', {}],
        ['Gậy Hư Vô', {}] ] },
  { sect:'baidasan', line:'quyentruong', slot:'vukhi', desc:'tốc niệm',
    base:{ art:'staff' },
    t:[ ['Trượng Gỗ', {}],
        ['Trượng Nhân Sư', {}],
        ['Trượng Triệu Hồn', {}],
        ['Trượng Thần Ma', {}],
        ['Trượng Quỷ Vương', {}],
        ['Trượng Tinh Vân', {}],
        ['Trượng Hư Vô', {}] ] },
  { sect:'baidasan', line:'tinhtruong', slot:'vukhi', desc:'bạo kích',
    base:{ art:'staff' },
    t:[ ['Tinh Trượng Gỗ', {}],
        ['Tinh Trượng Nhân Sư', {}],
        ['Tinh Trượng Triệu Hồn', {}],
        ['Tinh Trượng Thần Ma', {}],
        ['Tinh Trượng Quỷ Vương', {}],
        ['Tinh Trượng Tinh Vân', {}],
        ['Tinh Trượng Hư Vô', {}] ] },
  // ══ Sylvan Ranger ══
  { sect:'toanchan', line:'cungngan', slot:'vukhi', desc:'bắn nhanh',
    base:{ art:'bow' },
    t:[ ['Cung Gỗ', {}],
        ['Cung Sồi', {}],
        ['Cung Gai Rừng', {}],
        ['Cung Lông Cú', {}],
        ['Cung Sương Mai', {}],
        ['Cung Nguyệt Quế', {}],
        ['Cung Bạch Phượng', {}] ] },
  { sect:'toanchan', line:'truongcung', slot:'vukhi', desc:'tầm xa',
    base:{ art:'bow' },
    t:[ ['Trường Cung Gỗ', {}],
        ['Trường Cung Sồi', {}],
        ['Trường Cung Gai Rừng', {}],
        ['Trường Cung Lông Cú', {}],
        ['Trường Cung Sương Mai', {}],
        ['Trường Cung Nguyệt Quế', {}],
        ['Trường Cung Bạch Phượng', {}] ] },
  { sect:'toanchan', line:'no', slot:'vukhi', desc:'nặng, xuyên giáp',
    base:{ art:'crossbow' },
    t:[ ['Nỏ Gỗ', {}],
        ['Nỏ Sồi', {}],
        ['Nỏ Gai Rừng', {}],
        ['Nỏ Lông Cú', {}],
        ['Nỏ Sương Mai', {}],
        ['Nỏ Nguyệt Quế', {}],
        ['Nỏ Bạch Phượng', {}] ] },
  // ══ Spellblade ══
  { sect:'minhgiao', line:'songdao', slot:'vukhi', desc:'nhanh',
    base:{ art:'weapon' },
    t:[ ['Song Đao Thô', {}],
        ['Song Đao Da Nung', {}],
        ['Song Đao Tro Tàn', { motif:'lua' }],
        ['Song Đao Lửa Dữ', { motif:'lua' }],
        ['Song Đao Dung Nham', { motif:'lua' }],
        ['Song Đao Long Diễm', { motif:'lua' }],
        ['Song Đao Viêm Đế', { motif:'mach' }] ] },
  { sect:'minhgiao', line:'daikiem', slot:'vukhi', desc:'nặng',
    base:{ art:'weapon' },
    t:[ ['Đại Kiếm Thô', {}],
        ['Đại Kiếm Da Nung', {}],
        ['Đại Kiếm Tro Tàn', { motif:'lua' }],
        ['Đại Kiếm Lửa Dữ', { motif:'lua' }],
        ['Đại Kiếm Dung Nham', { motif:'lua' }],
        ['Đại Kiếm Long Diễm', { motif:'lua' }],
        ['Đại Kiếm Viêm Đế', { motif:'mach' }] ] },
  { sect:'minhgiao', line:'makiem', slot:'vukhi', desc:'lai phép',
    base:{ art:'weapon' },
    t:[ ['Ma Kiếm Thô', { motif:'runes' }],
        ['Ma Kiếm Da Nung', { motif:'runes' }],
        ['Ma Kiếm Tro Tàn', { motif:'mach' }],
        ['Ma Kiếm Lửa Dữ', { motif:'mach' }],
        ['Ma Kiếm Dung Nham', { motif:'mach' }],
        ['Ma Kiếm Long Diễm', { motif:'lua' }],
        ['Ma Kiếm Viêm Đế', { motif:'mach' }] ] },
  // ══ Dark Lord ══
  { sect:'bug', line:'lenhtruong', slot:'vukhi', desc:'chỉ huy',
    base:{ art:'staff' },
    t:[ ['Lệnh Trượng Gỗ', {}],
        ['Lệnh Trượng Cận Vệ', {}],
        ['Lệnh Trượng Kim Miện', {}],
        ['Lệnh Trượng Bạo Chúa', {}],
        ['Lệnh Trượng Ngai Đen', {}],
        ['Lệnh Trượng Hắc Đế', {}],
        ['Lệnh Trượng Đế Vương', {}] ] },
  { sect:'bug', line:'bua', slot:'vukhi', desc:'nặng',
    base:{ art:'weapon' },
    t:[ ['Búa Gỗ', {}],
        ['Búa Cận Vệ', {}],
        ['Búa Kim Miện', {}],
        ['Búa Bạo Chúa', { motif:'runes' }],
        ['Búa Ngai Đen', { motif:'runes' }],
        ['Búa Hắc Đế', { motif:'runes' }],
        ['Búa Đế Vương', { motif:'mach' }] ] },
  { sect:'bug', line:'kich', slot:'vukhi', desc:'tầm với',
    base:{ art:'staff' },
    t:[ ['Kích Gỗ', {}],
        ['Kích Cận Vệ', {}],
        ['Kích Kim Miện', {}],
        ['Kích Bạo Chúa', {}],
        ['Kích Ngai Đen', {}],
        ['Kích Hắc Đế', {}],
        ['Kích Đế Vương', {}] ] },
];

// Cấu hình từng phó bản: 3 đợt quái (quái của map cha) → Boss → thưởng nguyên liệu nâng tầng kỹ năng
// timeLimit (giây): học Devil Square/Blood Castle của MU Online — phó bản có đồng hồ đếm ngược,
// hết giờ là thất bại mất trắng, thay vì AUTO đứng farm vô thời hạn như trước.
window.DUNGEONS = {
  pb_daohoa:   { boss:'boss_hacphong',  bossName:'Thủ Lĩnh Đoàn Gloam',
    waves:[ ['bandit','bandit','wolf'], ['bandit','hautu','bandit'], ['assassin','bandit','wolf'] ],
    rewards:{ sach:[1,2],  tuLa:[0,0], hon:[0,0], khi:40,  bacThem:150,  silver:[850,1450] },
    huntBoss:'boss_cotma1', boxTier:1, timeLimit:480 },
  pb_ngoai:    { boss:'boss_sontac',    bossName:'Thủ Lĩnh Sói Hoang',
    waves:[ ['bandit','wolf','bandit'], ['bandit','bandit','caodo'], ['assassin','bandit','bandit'] ],
    rewards:{ sach:[1,2],  tuLa:[0,0], hon:[0,0], khi:55,  bacThem:220,  silver:[1070,1680] },
    huntBoss:'boss_cotma2', boxTier:1, timeLimit:480 },
  pb_chungnam: { boss:'boss_phando',    bossName:'Phản Đồ Đại Tướng',
    waves:[ ['phando','bandit','phando'], ['xanu','phando','bandit'], ['bandao','xanu','phando'] ],
    rewards:{ sach:[2,3],  tuLa:[0,1], hon:[0,0], khi:90,  bacThem:450,  silver:[1600,2450] },
    huntBoss:'boss_hacnu1', boxTier:2, timeLimit:540 },
  pb_comoc:    { boss:'boss_mochu',     bossName:'Chúa Tể Lăng Mộ',
    waves:[ ['thinu','mocnhan','thinu'], ['huyetbat','mocnhan','thinu'], ['huyetbat','huyetbat','mocnhan'] ],
    rewards:{ sach:[2,3],  tuLa:[1,1], hon:[0,0], khi:140, bacThem:800,  silver:[2400,3400] },
    huntBoss:'boss_hacnu2', boxTier:2, timeLimit:540 },
  pb_tuyettinh:{ boss:'boss_tinhhoa',   bossName:'Xoáy Lá Nguyền',
    waves:[ ['ttdetu','docyeu','ttdetu'], ['docyeu','satthuhy','ttdetu'], ['satthuhy','docyeu','docyeu'] ],
    rewards:{ sach:[3,4],  tuLa:[1,2], hon:[0,1], khi:200, bacThem:1400, silver:[3350,4700] },
    huntBoss:'boss_hoangkim1', boxTier:3, timeLimit:600 },
  pb_mongco:   { boss:'boss_dothong',   bossName:'Đột Thông Hãn Vương',
    waves:[ ['thamtu','cungthu','kybinh'], ['cungthu','kybinh','thamtu'], ['kybinh','kybinh','cungthu'] ],
    rewards:{ sach:[4,5],  tuLa:[2,2], hon:[1,1], khi:280, bacThem:2400, silver:[4600,6500] },
    huntBoss:'boss_hoangkim2', boxTier:4, timeLimit:660 },
  pb_nhanmon:  { boss:'boss_thienbinh', bossName:'Thiên Binh Thống Soái',
    waves:[ ['kylan','cuongbinh','daokhach'], ['cuongbinh','daokhach','kylan'], ['daokhach','kylan','kylan'] ],
    rewards:{ sach:[5,6],  tuLa:[2,3], hon:[2,2], khi:350, bacThem:3500, silver:[6000,8400] },
    huntBoss:'boss_amthan', boxTier:5, timeLimit:720 },
};

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
window.SECTS = {
  thieulam: { name:'Dark Knight', role:'Chịu Đòn / Liên Đòn cận chiến', element:'Kim', color:'#4c8dff', glow:'#ffe9a0', bonus:{vit:3,def:2,str:1,agi:0,ene:0},
    hpMult:1.18, defMult:1.20, dmgMult:0.95, atkSrc:{str:2.0},
    desc:'Giáp tấm nặng, mũ trụ có sừng, đại kiếm hai tay. Dark Knight đứng mũi chịu sào, nuốt trọn đòn của cả bầy rồi trả lại bằng một nhát bổ chậm mà không gì cản nổi. Tiềm năng: dồn hết vào Lực Lượng.',
    skillA:{ name:'Twisting Slash', type:'cone',  cd:4, qi:20, mult:1.6 },
    tp:{ name:'Death Stab', mult:3.0 } },
  // range/basicProj: Sylvan Ranger & Dark Wizard là 2 lớp tầm xa thật (cung/phép) — đòn thường của họ bắn
  // đạn ở khoảng cách này thay vì vung cận chiến như Dark Knight/Spellblade/Dark Lord (xem doBasic()).
  toanchan: { name:'Sylvan Ranger', role:'Tầm xa / Hỗ trợ', element:'Thủy', color:'#3a9d8b', glow:'#a0ffe9', bonus:{vit:0,def:0,str:0,agi:4,ene:0},
    hpMult:0.90, defMult:0.85, dmgMult:1.05, atkSrc:{agi:2.0},
    desc:'Cung dài, giáp da nhẹ, chân bước không thành tiếng. Sylvan Ranger rót tên từ ngoài tầm với, đồng thời phủ phù trợ lên cả đội — vừa là sát thủ vừa là chỗ dựa. Tiềm năng: chỉ cần dồn Mẫn Tiệp là đủ mạnh.',
    range:380, basicProj:'arrow',
    // 3 mũi × 2.5 = tổng sát thương y hệt bản cũ (5 × 1.5), chỉ đổi cho khớp tên MU:
    // Triple Shot bắn BA mũi, Five Shot (di sản) mới là năm. Mỗi bậc Tiến Hóa +1 mũi.
    skillA:{ name:'Triple Shot', type:'proj', cd:4, qi:20, mult:2.5, count:3 },
    tp:{ name:'Ice Arrow', mult:2.8 } },
  baidasan: { name:'Dark Wizard', role:'Pháp thuật / Độc tố', element:'Thủy', color:'#7ec850', glow:'#c8ffa0', bonus:{vit:1,def:0,str:0,agi:1,ene:3},
    hpMult:0.72, defMult:0.65, dmgMult:1.30, atkSrc:{ene:1.6, agi:0.6},
    desc:'Áo thụng trùm kín, quyền trượng nạm ngọc, thân thể mỏng như giấy. Dark Wizard đứng xa nhất chiến trường và gọi độc tố cùng thiên thạch xuống thay mình. Tiềm năng: cần cả Mẫn Tiệp lẫn Linh Lực.',
    range:420, basicProj:'orb',
    skillA:{ name:'Poison', type:'proj', cd:4, qi:20, mult:1.5 },
    tp:{ name:'Meteorite', mult:3.2 } },
  minhgiao: { name:'Spellblade', role:'Lai / Bộc phát Hoả', element:'Hỏa', color:'#e8552a', glow:'#ffb060', bonus:{vit:1,def:0,str:2,agi:0,ene:2},
    hpMult:1.05, defMult:1.0, dmgMult:1.08, atkSrc:{str:1.1, ene:1.1},
    desc:'Nửa giáp nửa vải, một vai để trần, đại đao bản rộng cháy lửa. Spellblade vừa chém như hiệp sĩ vừa niệm như pháp sư — không cần chờ tới cấp 10 để mạnh. Tiềm năng: cân cả Lực Lượng lẫn Linh Lực.',
    skillA:{ name:'Fire Slash', type:'cone', cd:4, qi:22, mult:1.6 },
    tp:{ name:'Flame Strike', mult:3.2 } },
  // Dark Lord: lớp chỉ huy/triệu hồi — đánh bằng quân triệu ra chứ không bằng tay mình
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

// packs: quái đứng thành cụm 5-7 con, đánh 1 con cả cụm lao vào (GDD Mob Mechanics)
window.MAPS = {
  daohoa: { name:'Petalshade Isle', min:1, range:'1 - 12', type:'safe', ground:'#ece2c8', patch:'#7a86ad',
    spawn:{ x:460, y:460 }, spawnFrom:{ pb_daohoa:{ x:2250, y:1040 } }, village:true, spring:true, herbs:true, boss:true, trees:70, rocks:26,
    desc:'Nơi đặt trại ấp Petalshade — bãi săn của người mới. Chimera yếu, đồ rơi nhập môn, chỗ hiền lành để học cách chơi.',
    // Cụm quái xếp theo vòng từ spawn ra: yếu (boar/hautu) gần nhất → mạnh dần (wolf/bandit/
    // caodo) → xa nhất (assassin, trannhan) gần Cổng Vực — người chơi mới thấy rõ "đi sâu = khó
    // hơn" thay vì gặp ngẫu nhiên cả cụm yếu lẫn cụm elite lẫn lộn quanh spawn.
    packs: [
      // Bãi đầu tiên đặt gần điểm thả (460,460): người chơi mới phải THẤY quái ngay, không
      // phải đi tìm. Trước đây bãi gần nhất cách 450px — năm giây đi bộ trong im lặng.
      { mob:'boar', x:906, y:254, n:6 }, { mob:'boar', x:660, y:690, n:5 },
      { mob:'hautu', x:1000, y:1000, n:6 }, { mob:'wolf', x:1500, y:560, n:7 },
      { mob:'wolf', x:754, y:1555, n:6 }, { mob:'bandit', x:1290, y:1244, n:7 },
      { mob:'bandit', x:1648, y:724, n:7 }, { mob:'caodo', x:1424, y:1445, n:6 },
      { mob:'assassin', x:1900, y:420, n:1 }, // P0: 1 con (trước 5 — NV8 thành bức tường, bot chết 16 lần liên tiếp)
      { mob:'trannhan', x:2043, y:1240, n:5 },
    ], duhiep: null },
  tuongduong: { name:'Lunaris City', min:1, range:'—', type:'safe', ground:'#d8ccb0', patch:'#7a6a4a',
    spawn:{ x:1300, y:1100 }, spawnFrom:{ ngoai:{ x:1300, y:1460 } }, city:true, trees:24, rocks:10,
    desc:'Cả khu phố Ardhaven bị vết nứt kéo sang, dân bản địa dựng lại quanh nó thành Lunaris City. Trong tường: Lò Rèn Hoàng Gia, Tiệm Thuốc, Vũ Khí Phường, Trà Quán, Sảnh Cầu May và Truy Nã Lệnh. An toàn tuyệt đối — không Chimera nào vào được. Ra Cổng Nam để săn ở Outskirts.',
    packs: [], duhiep: null },
  ngoai: { name:'Petalshade Outskirts', min:10, range:'14 - 24', type:'safe', ground:'#ddd2ae', patch:'#7a7048',
    spawn:{ x:1300, y:330 }, spawnFrom:{ pb_ngoai:{ x:2000, y:1040 } }, reqMain:10, trees:56, rocks:22, herbs:true,
    // Câu đầu vốn nằm ở REGION_UNLOCK_LORE.ngoai và chỉ hiện ĐÚNG MỘT LẦN lúc mở khoá vùng.
    // Dòng người chơi đọc mỗi lần mở Bản Đồ lại là dòng "đất an toàn để luyện cấp" — tức là
    // vùng đầu tiên báo hiệu chuỗi năm trụ bị giới thiệu như một bãi cỏ giữa hai nhiệm vụ.
    desc:'Đất ngoài thành đang rung — chưa phải trụ, nhưng là dấu hiệu đầu tiên rằng có trụ đang lung lay. Trại Gloam chặn đường, bầy Gai Tím rình rập ven rừng. Không PK, đất an toàn để luyện cấp.',
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
    desc:'Từ đây là đất PK — hạ người khác được, bị hạ cũng được. Chimera ở đây rơi Cốt bậc đầu.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'chimera_bo', x:800, y:1400, n:6, tiep:true }, { mob:'phando', x:1100, y:900, n:6, tiep:true },
      { mob:'phando', x:442, y:574, n:6, tiep:true }, { mob:'xanu', x:1376, y:1272, n:6, tiep:true },
      { mob:'xanu', x:1981, y:1295, n:6, tiep:true }, { mob:'bandao', x:2000, y:600, n:5, tiep:true },
    ], duhiep:'duhiep1' },
  comoc: { name:'Hollow Roost', min:40, range:'42 - 56', type:'pk', ground:'#a89f86', patch:'#4a4436',
    spawn:{ x:400, y:400 }, spawnFrom:{ pb_comoc:{ x:2200, y:990 } }, dark:true, trees:30, rocks:46,
    desc:'Hang ổ hẹp, ngoằn ngoèo. Bầy Chimera dày đặc rơi nguyên liệu thăng giai Thú Chiến — bãi săn tranh chấp.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'thinu', x:557, y:865, n:7, tiep:true }, { mob:'thinu', x:1200, y:500, n:7, tiep:true },
      { mob:'mocnhan', x:600, y:1400, n:5, tiep:true }, { mob:'mocnhan', x:1272, y:1100, n:5, tiep:true },
      { mob:'huyetbat', x:1900, y:600, n:7, tiep:true }, { mob:'huyetbat', x:1915, y:1351, n:6, tiep:true },
    ], duhiep:'duhiep2' },
  tuyettinh: { name:'Frostmire Vale', min:60, range:'62 - 78', type:'pk', ground:'#ddc9a8', patch:'#8a5a6a',
    spawn:{ x:400, y:950 }, spawnFrom:{ pb_tuyettinh:{ x:2200, y:790 } }, trees:60, rocks:24,
    desc:'Bãi EXP khổng lồ. Mang theo kháng độc — Chimera ở đây cắn có nọc.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'docyeu', x:1096, y:482, n:6, tiep:true }, { mob:'ttdetu', x:700, y:1500, n:7, tiep:true },
      { mob:'ttdetu', x:1131, y:1182, n:7, tiep:true }, { mob:'docyeu', x:1394, y:895, n:6, tiep:true },
      { mob:'satthuhy', x:1856, y:1382, n:5, tiep:true }, { mob:'satthuhy', x:2100, y:500, n:5, tiep:true },
    ], duhiep:'duhiep2' },
  mongco: { name:'Ashen Steppe', min:80, range:'84 - 100', type:'pk', ground:'#cfc09a', patch:'#7a6a42',
    spawn:{ x:400, y:950 }, spawnFrom:{ pb_mongco:{ x:1720, y:680 } }, trees:36, rocks:30,
    desc:'Thảo nguyên mở rộng, Chimera trâu bò đánh đau. Rơi nguyên liệu nâng chiêu tầm xa và đao pháp.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'thamtu', x:442, y:574, n:7, tiep:true }, { mob:'thamtu', x:753, y:1497, n:7, tiep:true },
      { mob:'cungthu', x:1347, y:979, n:6, tiep:true }, { mob:'cungthu', x:1300, y:400, n:6, tiep:true },
      { mob:'kybinh', x:1900, y:1400, n:5, tiep:true }, { mob:'kybinh', x:2100, y:600, n:5, tiep:true },
    ], duhiep:'duhiep3' },
  nhanmon: { name:'Stormgate Pass', min:100, range:'102 - 120', type:'freepk', ground:'#b8a68a', patch:'#6a3a2a',
    spawn:{ x:400, y:950 }, spawnFrom:{ pb_nhanmon:{ x:2200, y:890 } }, trees:44, rocks:38,
    desc:'Bãi luyện cuối game, ngoài biên ải Lunacia. PK ở đây không cộng Tai Tiếng. Chimera rơi trang bị bậc vàng.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    packs: [
      { mob:'cuongbinh', x:700, y:1400, n:7, tiep:true }, { mob:'cuongbinh', x:1300, y:660, n:7, tiep:true }, // bãi 2 vốn nằm LỌT TRONG tường thành trái (850,800,560,350)
      { mob:'kylan', x:1396, y:1312, n:5, tiep:true }, { mob:'kylan', x:1450, y:1600, n:5, tiep:true },
      { mob:'daokhach', x:2100, y:500, n:5, tiep:true }, { mob:'daokhach', x:2250, y:1100, n:5, tiep:true },
    ], duhiep:'duhiep3' },
  // ---------- PHÓ BẢN: mỗi map một phó bản + boss tương ứng cấp — chỉ vào qua cổng dịch chuyển ----------
  // Bảy phòng thử thách trước đây đều kết thúc bằng CÙNG MỘT mệnh đề cơ học ("cày tinh chất nâng
  // bậc lớp ở đây") và không phòng nào nói vì sao thế giới này lại có phòng thử thách. Nay mỗi
  // desc mở đầu bằng cùng một sự thật — Thủ Hộ Vaeldra đào chúng từ trước cuộc giao thoa — nhưng
  // kể bằng một hình ảnh riêng của phòng đó, rồi mới tới phần cơ học. Chúng là MỘT hệ thống, nên
  // phải nghe ra là một; nhưng đọc bảy lần liền thì không được ra bảy bản chép dán.
  pb_daohoa: { name:'Trial Chamber: Petalshade', min:12, range:'12+', type:'dungeon', ground:'#8a8272', patch:'#3a342a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:20, rocks:34,
    desc:'Hầm tôi luyện Thủ Hộ Vaeldra đào dưới đảo, có trước cuộc giao thoa rất lâu. Đá tường vẫn còn vết đục thẳng thớm — thứ đang ở trong thì không. Ba đợt quái, rồi Thủ Lĩnh Cướp Gloam. Cày tinh chất nâng bậc lớp ở đây.',
    packs: [], duhiep: null },
  pb_ngoai: { name:'Trial Chamber: Outskirts', min:14, range:'14+', type:'dungeon', ground:'#8a8272', patch:'#3a342a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:24, rocks:30,
    desc:'Cùng một tay Thủ Hộ đục xuống, cùng một khí Morvahn rỉ vào. Bọn Gloam không đào hầm này — chúng chỉ dọn vào ở. Chiến Chúa Gloam canh cửa. Cày tinh chất nâng bậc lớp ở đây.',
    packs: [], duhiep: null },
  pb_chungnam: { name:'Trial Chamber: Thornwood', min:26, range:'26+', type:'dungeon', ground:'#7e7a68', patch:'#332e24',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:18, rocks:38,
    desc:'Hầm nằm ngay dưới chân Trụ Thornwood, nên khí rỉ xuống đây đặc hơn mọi nơi khác. Thủ Hộ đào nó để tôi luyện lính tiên phong; giờ lính tiên phong nằm lại trong đó. Phản Đồ Đại Tướng chờ ở cuối. Cày tinh chất nâng bậc lớp và bậc rèn.',
    packs: [], duhiep: null },
  pb_comoc: { name:'Trial Chamber: Hollow Roost', min:46, range:'46+', type:'dungeon', ground:'#6e6a58', patch:'#2a2620',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:12, rocks:44,
    desc:'Thủ Hộ đào hầm này làm chỗ ấp, không phải chỗ đánh. Trứng trong đây vẫn còn ấm sau ngần ấy năm — không ai biết thứ gì đang ấp chúng. Hộ Vệ Tổ giữ tầng sâu. Cày tinh chất thăng giai Thú Chiến ở đây.',
    packs: [], duhiep: null },
  pb_tuyettinh: { name:'Trial Chamber: Frostmire', min:66, range:'66+', type:'dungeon', ground:'#7a6a62', patch:'#38222a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:22, rocks:26,
    desc:'Băng trong hầm không phải do lạnh: nó đóng lại đúng cái đêm Trụ Frostmire bị ngồi lên. Vết đục của Thủ Hộ còn nguyên dưới lớp băng, đọc được từng nhát. Bạo Chúa Emberveil đánh có nọc độc. Cày ngọc rèn bậc cao ở đây.',
    packs: [], duhiep: null },
  pb_mongco: { name:'Trial Chamber: Ashen Steppe', min:86, range:'86+', type:'dungeon', ground:'#7e725a', patch:'#332a1e',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:16, rocks:32,
    desc:'Hầm sâu nhất trong bảy hầm, và là hầm duy nhất Thủ Hộ đào xong rồi bịt lại. Ai đó đã mở nó ra từ phía dưới. Đại Hãn cai trị doanh trại bên trong. Cày tinh chất nâng chiêu tầm xa và đao pháp.',
    packs: [], duhiep: null },
  pb_nhanmon: { name:'Trial Chamber: Stormgate', min:100, range:'100+', type:'dungeon', ground:'#8a7a66', patch:'#3a241a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:14, rocks:36,
    desc:'Hầm cuối, đào ngay dưới Trụ Stormgate — Thủ Hộ biết nếu cửa ải này vỡ thì không còn chỗ nào để lui về mà tôi luyện nữa. Thiên Binh Thống Soái đứng ở cuối. Thử thách cuối cùng, phần thưởng hậu nhất.',
    packs: [], duhiep: null },
};

// ═══════════ GDD Đợt 2 — A: ĐỊA HÌNH CẢN ĐƯỜNG + ẢI CẤP ═══════════
// Chỉ chặn địa hình LỚN (hồ/sông/núi/tường), đường đi để rộng; rect {x,y,wd,ht} hoặc ellipse {x,y,rx,ry}
window.MAP_OBSTACLES = {
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

window.NPCS = [
  { id:'truonglang', name:'Trưởng Làng', map:'daohoa', x:400, y:400, img:'assets/npcs/truonglang.png', talk:'quest',
    // Ông giao 9 trong 10 nhiệm vụ đầu và dẫn truyện gọi ông là người "nhặt ngươi về nuôi" —
    // vậy mà suốt giờ chơi đầu tiên ông không có một câu nào.
    lore:{
      idle:  '"Ta vớt ngươi lên khi bầu trời còn đang nứt. Ngươi không nhớ gì — nhưng bầy nhỏ của ta thì nhớ mùi lửa đêm đó."',
      offer: '"Cứ ở lại đã. Đảo này nuôi được thêm một miệng ăn, và ngươi chưa đủ sức trả ơn đâu."',
      active:'"Việc ta nhờ vẫn còn đó. Đảo nhỏ thôi, ngươi không lạc được."',
      done:  '"Về rồi. Ta nấu sẵn nồi cháo — ngồi xuống ăn trước đã, chuyện nói sau."' },
    barks:['"Bầy nhỏ hôm nay không chịu ra khỏi tổ."','"Đảo này nuôi được ta ba đời, nuôi thêm ngươi có sao đâu."',
           '"Đêm trời nứt, biển sáng như ban ngày."','"Ăn gì chưa? Hỏi thật đấy."'] },
  // QA rà soát NPC Lunaris City: Thương Nhân · Chợ Đấu Giá đã bị xoá — cả 3 món trong tiệm đều
  // trùng chỗ khác (Bình Thuốc Đỏ = Dược Sư, Thiên Mệnh Phù = mua thẳng trong Rèn Luyện qua buyCharm()),
  // và "Chợ Đấu Giá" chưa từng có cơ chế đấu giá thật — chỉ là tiệm giá cố định như 3 tiệm kia.
  // Đá Thăng Cấp đã gỡ hẳn cùng hệ Thuần Thục — nó không còn nơi tiêu.
  { id:'thoren', name:'Thợ Rèn · Lò Rèn Hoàng Gia', map:'tuongduong', x:1780, y:780, img:'assets/npcs/thoren.png', talk:'forge',
    lore:'"Lò này cháy suốt từ hôm khu phố rơi qua. Ta không dám để nó tắt — sợ nhóm lại không được."',
    barks:['"Búa này theo ta qua cả vết nứt."','"Đợi lò đỏ đã, đừng giục."',
           '"Đồ hỏng thì mang đây, đừng vứt."','"Nghe tiếng thép là biết đồ thật hay giả."'] },
  // NV5 (cấp 5) bắt rèn +3, mà lò duy nhất nằm trong Lunaris City khoá tới NV10 — chính tuyến kẹt
  // cứng ở cấp 5, không có đường vòng. Bắt được qua chơi thử. Đặt một lò lưu vong ngay cạnh làng.
  { id:'thoren_dao', name:'Thợ Rèn Lưu Vong', map:'daohoa', x:520, y:560, img:'assets/npcs/thoren.png', talk:'forge',
    lore:'"Lò của ta rơi qua vết nứt cùng ta. Còn đỏ lửa là còn rèn — đưa đồ đây."',
    barks:['"Đảo này không có quặng, ta nấu lại đồ cũ."','"Còn đỏ lửa là còn rèn."',
           '"Ngươi cầm kiếm sai tay rồi đấy."'] },
];

// MU Online-lite: mỗi lớp chỉ giữ đúng bộ chiêu gốc của lớp đó (không còn phiêu bạt tự do/dung hợp
// liên phái — MU không có khái niệm này, vũ khí & chiêu thức LÀ bản sắc lớp). Tất cả phai-locked,
// tự ngộ theo cấp độ giống hệt cơ chế sect-skill cũ, chỉ khác là giờ CẢ 5 LỚP đều có đủ bộ thay vì
// chỉ 3/9 Tộc trước đây. skillA/tp (Twisting Slash/Death Stab v.v.) đã nằm ở SECTS, đây là 4-6 chiêu
// bổ sung mỗi lớp — chỉ 1 trong số này (buff) còn nằm ở taskbar 3 ô, còn lại đã dồn thành % Công
// Kích vĩnh viễn (xem LEGACY_SECT_SKILLS). Giữ nguyên 2 id 'tienthiencong'/'songthu' vì có code khác gọi thẳng
// theo id (auto-hồi sinh & miễn hồi chiêu) — chỉ đổi tên hiển thị + đổi phai sang lớp mới.
window.VOHOC_DEFS = {
  // ── Dark Knight — binh khí nặng, chấn động nền đất ──
  // TUYỆT CHIÊU ô 4 của Dark Knight (xem SIGNATURE_SKILL). Trước đây nó nằm ở nhóm Di Sản, chỉ
  // quy đổi thành %Công Kích vĩnh viễn chứ không bấm được — mà mô tả của nó ("xoay tít vũ khí
  // quanh thân") lại đúng là hình ảnh tuyệt chiêu mà chủ dự án muốn. Nên đổi chỗ với Rageful
  // Blow: chiêu xoay lên ô 4, chiêu giáng đất lui về Di Sản. Chỉ số nâng lên đúng bằng chỗ cũ
  // của Rageful Blow (2.2 / r170 / kb50) để sức mạnh của lớp không tụt vì một lần đổi chỗ.
  //
  // cd:0 — đây là chiêu gán sẵn vào phím Space, và Space theo thiết kế là ô KHÔNG chờ hồi.
  // Cái ghìm nó lại là MANA: 20 Mana mỗi lần, hết Mana thì Space tự rơi về đòn đánh thường
  // (xem doBasic). Ai bấm liên tục sẽ cạn Mana trong vài giây rồi phải đánh chay chờ hồi.
  dk_cyclone:     { name:'Flame Cyclone', school:'Dark Knight', phai:'thieulam', tier:'trung', cat:'Binh Khí', type:'aoe', unlock:15, cd:0, qi:20, mult:2.2, color:'#ff8c2a', glyph:'◉', fx:{ r:170, kb:50 }, desc:'Vũ khí rời tay, xoay tròn quanh thân trong một vòng lửa — lực ly tâm cuốn cả bầy.' },
  dk_lunge:       { name:'Lunge', school:'Dark Knight', phai:'thieulam', tier:'trung', cat:'Binh Khí', type:'cone', unlock:22, cd:5, qi:18, mult:1.9, color:'#6aa0ff', glyph:'✹', fx:{ pierce:true }, desc:'Cú đâm ngắn và nhanh, mũi kiếm lách qua khe giáp thay vì bổ vào mặt giáp.' },
  dk_impale:      { name:'Impale', school:'Dark Knight', phai:'thieulam', tier:'trung', cat:'Binh Khí', type:'aoe', unlock:30, cd:7, qi:22, mult:2.0, color:'#8ab8ff', glyph:'▲', fx:{ r:160 }, desc:'Quay ngang cán giáo, đâm trọn một vòng — mọi kẻ đứng sát đều dính.' },
  dk_fallingslash:{ name:'Falling Slash', school:'Dark Knight', phai:'thieulam', tier:'cao', cat:'Binh Khí', type:'cone', unlock:35, cd:6, qi:20, mult:2.4, color:'#3a6fd8', glyph:'☾', fx:{ kb:35 }, desc:'Nhấc rìu quá đầu rồi bổ thẳng xuống — dồn cả trọng lượng người vào một nhát.' },
  // Lui về nhóm Di Sản, đổi chỗ cho Flame Cyclone. Bậc hạ 'trung' → 'so' để tổng Di Sản của
  // Dark Knight vẫn đúng 8,0% Công Kích (1,5 + 2 + 2 + 2,5) — không thì riêng lớp này được
  // thêm nửa phần trăm vĩnh viễn chỉ vì hai chiêu hoán chỗ cho nhau.
  dk_ragefulblow: { name:'Rageful Blow', school:'Dark Knight', phai:'thieulam', tier:'so', cat:'Binh Khí', type:'aoe', unlock:25, cd:8, qi:24, mult:2.2, color:'#3a6fd8', glyph:'✹', fx:{ r:170, kb:55, stun:0.8 }, desc:'Giáng vũ khí xuống đất — chấn động, hất văng & choáng nhẹ.' },
  dk_fortitude:   { name:'Swell Life', school:'Dark Knight', phai:'thieulam', tier:'cao', cat:'Bị Động', type:'passive', unlock:45, color:'#a0d8ff', glyph:'♦', desc:'Bị động: +15% Sinh Lực tối đa — sức vóc Dark Knight dày lên theo từng trận sống sót.' },
  tienthiencong:  { name:'Undying Will', school:'Dark Knight', phai:'thieulam', tier:'than', cat:'Bị Động', type:'passive', unlock:60, color:'#ffe9a8', glyph:'✦', desc:'Bị động: chết tự hồi sinh 50% Sinh Lực — mỗi 300s một lần.' },

  // ── Sylvan Ranger — cung tên & hỗ trợ ──
  elf_poisonarrow:{ name:'Poison Arrow', school:'Sylvan Ranger', phai:'toanchan', tier:'so', cat:'Cung Thuật', type:'proj', unlock:15, cd:6, qi:18, mult:1.6, color:'#7ec850', glyph:'☠', fx:{ poison:4 }, desc:'Mũi tên tẩm nhựa độc — trúng rồi thì vết thương tự lan.' },
  elf_greaterdef: { name:'Greater Defense', school:'Sylvan Ranger', phai:'toanchan', tier:'trung', cat:'Hỗ Trợ', type:'buff', unlock:30, cd:10, qi:25, color:'#5ac8b8', glyph:'✚', fx:{ shieldPct:40, t:6 }, desc:'Phủ một lớp năng lượng lên giáp — đòn tới trượt đi thay vì ăn thẳng.' },
  elf_holybolt:   { name:'Holy Bolt', school:'Sylvan Ranger', phai:'toanchan', tier:'trung', cat:'Cung Thuật', type:'proj', unlock:38, cd:6, qi:22, mult:2.0, color:'#ffe9a8', glyph:'★', desc:'Tụ ánh sáng lên đầu ngón tay rồi búng đi — không cần tên, không cần cung.' },
  elf_fiveshot:   { name:'Five Shot', school:'Sylvan Ranger', phai:'toanchan', tier:'cao', cat:'Cung Thuật', type:'proj', unlock:45, cd:7, qi:26, mult:1.6, color:'#a0ffe9', glyph:'✽', fx:{ multi:5 }, desc:'Kẹp năm mũi giữa các ngón, buông một lần — cả nan quạt tên phủ kín phía trước.' },
  // Ô 3 — buff: Bless. Bốn lớp kia có khiên/giảm ST/tốc đánh/bạo kích; Ranger là lớp DUY NHẤT
  // hồi máu, đúng vai hỗ trợ trong MU. Giữ id cũ elf_greaterdmg để không mất cấp chiêu đã nâng.
  elf_greaterdmg: { name:'Bless', school:'Sylvan Ranger', phai:'toanchan', tier:'cao', cat:'Hỗ Trợ', type:'buff', unlock:15, cd:12, qi:28, color:'#ffd76a', glyph:'✦', fx:{ dmgPct:25, healPct:25, t:8 }, desc:'Ban phước: hồi ngay 25% Sinh Lực tối đa và +25% sát thương trong 8s.' },
  elf_penetration:{ name:'Penetration', school:'Sylvan Ranger', phai:'toanchan', tier:'cao', cat:'Cung Thuật', type:'proj', unlock:20, cd:7, qi:24, mult:2.4, color:'#a0ffe9', glyph:'➤', fx:{ pierce:true, kb:18 }, desc:'Một mũi tên dồn hết lực xuyên thủng cả hàng địch — càng đứng thẳng hàng càng ăn đủ.' },
  elf_heal:       { name:'Heal', school:'Sylvan Ranger', phai:'toanchan', tier:'trung', cat:'Bị Động', type:'passive', unlock:25, color:'#3a9d8b', glyph:'✚', desc:'Bị động: tự hồi 1% Sinh Lực tối đa mỗi giây, kể cả giữa trận.' },

  // ── Dark Wizard — nguyên tố ──
  dw_lightning:   { name:'Lightning', school:'Dark Wizard', phai:'baidasan', tier:'so', cat:'Pháp Thuật', type:'proj', unlock:15, cd:5, qi:18, mult:1.7, color:'#d8e84a', glyph:'⚡', fx:{ kb:20 }, desc:'Một tia sét đánh thẳng vào địch, có thể hất văng.' },
  dw_ice:         { name:'Ice', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'proj', unlock:28, cd:6, qi:20, mult:1.6, color:'#5ac8e8', glyph:'❄', fx:{ slow:{ pct:0.5, t:3 } }, desc:'Băng giá xuyên thấu — trúng đòn làm chậm mục tiêu.' },
  dw_twister:     { name:'Twister', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'proj', unlock:38, cd:6, qi:24, mult:1.8, color:'#8ac850', glyph:'◉', fx:{ multi:3, pierce:true }, desc:'Ba cơn lốc xuyên phá — quét qua mọi địch trên đường đi.' },
  dw_inferno:     { name:'Inferno', school:'Dark Wizard', phai:'baidasan', tier:'cao', cat:'Pháp Thuật', type:'aoe', unlock:48, cd:10, qi:35, mult:2.8, color:'#ff7a3a', glyph:'☼', fx:{ r:180, big:true }, desc:'Dựng vòng lửa quanh chân rồi để nó nở ra nuốt cả vùng.' },
  dw_evilspirit:  { name:'Evil Spirit', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'aoe', unlock:25, cd:7, qi:26, mult:2.0, color:'#853ab5', glyph:'✦', fx:{ r:150 }, desc:'Sáu vuốt u linh vươn ra từ bóng của chính mình, quét sạch một vòng quanh người.' },
  // Ô 3 — buff: Soul Barrier, lá chắn hấp thụ. Dark Wizard mỏng máu nhất nên đây là thứ giữ
  // được mạng lúc đứng tụ phép giữa tầm xa 420.
  dw_shield:      { name:'Soul Barrier', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'buff', unlock:15, cd:10, qi:26, color:'#5ab8e8', glyph:'♦', fx:{ shieldPct:45, t:6 }, desc:'Khiên hồn ma bao bọc — hấp thụ sát thương bằng 45% Sinh Lực tối đa trong 6s.' },
  songthu:        { name:'Arcane Insight', school:'Dark Wizard', phai:'baidasan', tier:'than', cat:'Bị Động', type:'passive', unlock:60, color:'#d8d8f0', glyph:'✧', desc:'Bị động: 30% chiêu vừa tung không tốn hồi chiêu.' },

  // ── Spellblade — nửa kiếm nửa phép; MU cho lớp lai KẾ THỪA chiêu của hai lớp gốc ──
  mg_powerslash:  { name:'Power Slash', school:'Spellblade', phai:'minhgiao', tier:'so', cat:'Lai', type:'cone', unlock:15, cd:6, qi:20, mult:1.8, color:'#ffcf7a', glyph:'⚔', fx:{}, desc:'Một nhát chém quét ngang, sóng sáng rời khỏi lưỡi thép bay tiếp.' },
  mg_fireball:    { name:'Fireball', school:'Spellblade', phai:'minhgiao', tier:'so', cat:'Kế Thừa · Dark Wizard', type:'proj', unlock:18, cd:5, qi:16, mult:1.5, color:'#ff9a5a', glyph:'☼', desc:'Quả cầu lửa học lỏm từ pháp sư — Spellblade niệm được mà không cần bỏ kiếm.' },
  mg_powerwave:   { name:'Power Wave', school:'Spellblade', phai:'minhgiao', tier:'trung', cat:'Kế Thừa · Dark Wizard', type:'proj', unlock:28, cd:5, qi:18, mult:1.7, color:'#ffcf7a', glyph:'⚡', fx:{ pierce:true }, desc:'Sóng lực dội thẳng theo hướng nhìn — chiêu nhập môn của pháp sư, trong tay kẻ cầm kiếm.' },
  mg_twistingslash:{ name:'Twisting Slash', school:'Spellblade', phai:'minhgiao', tier:'trung', cat:'Kế Thừa · Dark Knight', type:'aoe', unlock:35, cd:7, qi:22, mult:1.9, color:'#ffb060', glyph:'◉', fx:{ r:150 }, desc:'Vòng chém quanh thân mượn của hiệp sĩ — thép nặng thay cho thép mỏng.' },
  mg_giganticstorm:{ name:'Gigantic Storm', school:'Spellblade', phai:'minhgiao', tier:'cao', cat:'Lai', type:'aoe', unlock:55, cd:11, qi:38, mult:3.0, color:'#ff7a3a', glyph:'☼', fx:{ r:200, kb:60, big:true }, desc:'Bão lửa khổng lồ nuốt trọn cả một vùng — chiêu riêng, không lớp nào khác có.' },
  // Ô 3 — buff: Battle Fury. Lớp lai đánh bằng NHỊP, nên buff của nó cộng tốc đánh chứ không
  // chỉ cộng sát thương như bản cũ (trùng hệt buff của Ranger và Dark Lord).
  mg_battlefury:  { name:'Battle Fury', school:'Spellblade', phai:'minhgiao', tier:'trung', cat:'Lai', type:'buff', unlock:15, cd:10, qi:26, color:'#e8552a', glyph:'⚔', fx:{ dmgPct:20, aspdPct:22, t:6 }, desc:'Dồn cả nội lẫn ngoại lực — +20% sát thương và +22% tốc đánh trong 6s.' },
  mg_ironwill:    { name:'Iron Will', school:'Spellblade', phai:'minhgiao', tier:'cao', cat:'Bị Động', type:'passive', unlock:40, color:'#ffb060', glyph:'◆', desc:'Bị động: hút 6% sát thương gây ra thành Sinh Lực — càng đánh dồn càng khó chết.' },

  // ── Dark Lord — quyền trượng chỉ huy & bầy tùy tùng ──
  dl_force:       { name:'Force', school:'Dark Lord', phai:'bug', tier:'so', cat:'Chỉ Huy', type:'proj', unlock:15, cd:4, qi:14, mult:1.5, color:'#a8b85a', glyph:'●', desc:'Nắm năng lượng lại thành một khối rồi đẩy đi — chiêu mặc định của quyền trượng.' },
  dl_electricspark:{ name:'Electric Spark', school:'Dark Lord', phai:'bug', tier:'trung', cat:'Chỉ Huy', type:'proj', unlock:25, cd:5, qi:18, mult:1.6, color:'#d8d84a', glyph:'⚡', fx:{ stun:0.8 }, desc:'Tia điện từ quyền trượng — trúng đòn choáng nhẹ.' },
  dl_fireburst:   { name:'Fire Burst', school:'Dark Lord', phai:'bug', tier:'trung', cat:'Chỉ Huy', type:'aoe', unlock:35, cd:7, qi:24, mult:2.0, color:'#ff9a5a', glyph:'☼', fx:{ r:160 }, desc:'Bắn một chuỗi lửa ngắn liên tiếp — chiêu Dark Lord dùng nhiều nhất khi dọn bãi.' },
  dl_darkhorse:   { name:'Dark Horse', school:'Dark Lord', phai:'bug', tier:'cao', cat:'Chỉ Huy', type:'aoe', unlock:50, cd:9, qi:30, mult:2.4, color:'#8a6a4a', glyph:'⚑', fx:{ r:170, kb:50 }, desc:'Thúc chiến mã lao qua hàng địch — sức nặng của cả người lẫn ngựa dồn vào cú va.' },
  // Ô 4 — TUYỆT CHIÊU. Bản cũ là "Chaotic Diseier" dùng CHUNG hoạt ảnh bầy quạ với Dark Raven:
  // hai chiêu của cùng một lớp trông y hệt nhau. Earthquake là chiêu MU thật của Dark Lord và
  // có hình riêng (nền đất nứt theo vòng). Giữ id cũ để người chơi không mất cấp chiêu đã nâng.
  dl_chaoticdiseier:{ name:'Earthquake', school:'Dark Lord', phai:'bug', tier:'cao', cat:'Chỉ Huy', type:'aoe', unlock:40, cd:9, qi:30, mult:2.6, color:'#a87a4a', glyph:'▲', fx:{ r:190, kb:70, stun:0.6, big:true }, desc:'Giậm quyền trượng xuống đất — nền nứt thành vòng, cả bầy bật ngửa.' },
  // Ô 3 — buff: Increase Critical Damage, đúng tên MU. Dark Lord là lớp chỉ huy sát thương thấp,
  // đổi lại có một cửa sổ bạo kích tuyệt đối.
  dl_commandaura: { name:'Increase Critical Damage', school:'Dark Lord', phai:'bug', tier:'trung', cat:'Chỉ Huy', type:'buff', unlock:15, cd:14, qi:30, color:'#ff6a5a', glyph:'★', fx:{ crit:true, dmgPct:15, t:4 }, desc:'Hô hào toàn quân: mọi đòn đều bạo kích trong 4s, kèm +15% sát thương.' },
  dl_darkraven:   { name:'Dark Raven', school:'Dark Lord', phai:'bug', tier:'than', cat:'Bị Động', type:'passive', unlock:55, color:'#6a4a8a', glyph:'☾', desc:'Bị động: bầy quạ đen bám theo đánh hôi — +12% sát thương của MỌI chiêu thức.' },
};

window.HERO_METAL = [
  // TẦM VỚI CÓ HẠN — đọc kỹ trước khi sửa bảng này. hSetMetal() vứt bỏ TOÀN BỘ M khi bộ giáp
  // có tint, mà 24/25 dải bộ trong HERO_SETS đều có tint. Trên NGƯỜI nhân vật, bảng này chỉ
  // KHÔNG còn hiện trên người nữa: từ khi mở 14 giai thì cả 70 bộ đều khai tint. Bảng này
  // giờ chỉ tới được ICON TRONG TÚI qua itemPal(), cho món def không mat/tint.
  // Ngoài ra nó còn tới được ICON TRONG TÚI qua itemPal(), cho những món def không mat/tint —
  // đo được 10/60 icon mẫu đổi hình khi hoán bảng màu.
  // Sửa ở đây vì trước đó năm giai đầu là năm sắc xám chỉ sáng dần vài phần trăm, nên lần nâng
  // giáp ĐẦU TIÊN của Dark Knight gần như không thấy gì. Nay mỗi giai một chất liệu:
  // sắt xỉn → đồng đỏ → thép sáng → thép lam → tím.
  // KHÔNG phải nguyên nhân làm test_geartier hết đỏ — đã đo: bảng cũ cũng xanh. Xem chú ở đó.
  // Muốn "lên một giai nhìn khác" cho 48 tổ hợp lớp×giai còn lại thì phải sửa hSetMetal(),
  // chỗ mỗi bậc trong một dải chỉ được pha sáng thêm một ít.
  { lo:'#43474f', hi:'#5f6572', trim:'#6b6250', glow:null },      // 1 Sơ Khai — sắt xỉn, tối nhất
  { lo:'#6b3f28', hi:'#b4763f', trim:'#d9a05a', glow:null },      // 2 Cường Hóa — đồng đỏ
  { lo:'#5d6a78', hi:'#aebdcc', trim:'#c9d4de', glow:null },      // 3 Tinh Luyện — thép sáng
  { lo:'#39557f', hi:'#7ea3d6', trim:'#cfe0f5', glow:null },      // 4 Kỳ Diệu — thép ngả lam
  { lo:'#5b4494', hi:'#a68fd8', trim:'#e0d2ff', glow:null },      // 5 Hiếm Có — tím
  { lo:'#2f6a58', hi:'#4fa88a', trim:'#d8c060', glow:'#6ff0c0' }, // 6 Tinh Xảo — xanh ngọc
  { lo:'#6a5220', hi:'#c8a84a', trim:'#ffe9a8', glow:'#ffd76a' }, // 7 Cổ Vật — vàng cổ
  { lo:'#7a2a30', hi:'#c85a52', trim:'#ffd08a', glow:'#ff8a6a' }, // 8 Thánh Khí
  { lo:'#432a7a', hi:'#8a6ae0', trim:'#dccdff', glow:'#a88aff' }, // 9 Truyền Thuyết
  { lo:'#8a1e2a', hi:'#ff6a5a', trim:'#fff0c0', glow:'#ff4a3a' }, // 10 Thần Thoại
  { lo:'#14504a', hi:'#2fa89a', trim:'#c0fff4', glow:'#4fe0cc' }, // 11 Vô Song — lục ngọc sâu
  { lo:'#7a4a08', hi:'#e8a820', trim:'#fff4c0', glow:'#ffcc40' }, // 12 Chí Cường — vàng nung
  { lo:'#20204a', hi:'#4a4ac0', trim:'#c8c8ff', glow:'#8a8aff' }, // 13 Tối Thượng — lam sâu
  { lo:'#6a6250', hi:'#f0e8c8', trim:'#ffffff', glow:'#fff0c0' }, // 14 Khai Thiên — trắng ngà
];

// ═══════════ CỐT TRUYỆN DẪN NHẬP — trước khi chọn lớp ═══════════
window.INTRO_PAGES = [
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
Ngươi thuộc một trong <b>năm lớp chiến binh của Vaeldra</b>, nằm trong đội tiên phong vượt vết nứt để sửa lại thứ mà thế giới ngươi đã gây ra.

Cuộc vượt biên tước sạch của ngươi mọi thứ — tên tuổi, ký ức, đồng đội — trừ một điều: bản năng chiến đấu của lớp mình. <b>Dark Knight</b> ◆ · <b>Dark Wizard</b> ❄ · <b>Sylvan Ranger</b> ❄ · <b>Spellblade</b> ☼ · <b>Dark Lord</b> ▲ — hãy chọn lại con đường ấy.

Ngươi dạt vào <b>Petalshade Isle</b>, được một Trưởng Làng Axie nhặt về nuôi. Võ nghệ sẽ trở lại theo từng cấp — và Lunacia cần nó.

Mỗi lớp mang một <b>hệ nguyên tố</b> — khắc hệ gây thêm <b>+20% sát thương</b> lên Chimera bị khắc.`,
  `<span class="is-title">NĂM TRỤ KHÓA</span>
Để vết nứt không nuốt trọn Lunacia, Thủ Hộ Vaeldra đã đóng <b>năm Trụ Khóa</b> xuống khắp thế giới này, ghim miệng vết nứt lại một chỗ.

Tướng quân của Morvahn đã chiếm cả năm trụ. Muốn tiến sâu, ngươi phải hạ chúng — nhưng <b>mỗi trụ được gỡ là vết nứt lại toác thêm</b>.

<i>"Từ Petalshade Isle, qua Thornwood Reach, vào Hollow Roost, lên Frostmire Vale, ra Ashen Steppe… cho tới Stormgate Pass, nơi vết nứt hà xuống."</i>

Muốn tới được Morvahn, ngươi phải tự tay mở toang cánh cửa hắn đang bước qua.

Những Axie ở đây không gây ra chuyện này. <b>Hãy cứu lấy chúng.</b>`,
];

// ---------- Phụ tuyến theo vùng (tối đa 3 active cùng lúc) ----------
// QA: 66 NV phụ đời trước gần 80% là "diệt N con X" lặp đi lặp lại (nhàm chán, trùng nội dung với
// NV chính/mob quanh đó) và không hề dạy người chơi về hàng loạt hệ thống nâng cấp nhân vật đã có
// sẵn trong game (Lò Hỗn Loạn, hái thảo dược...) — những hệ này trước giờ chỉ có
// 1 dòng toast thoáng qua lúc lên cấp, rất dễ bị bỏ lỡ. Thay bằng 2 nhóm:
// (1) NV "học hệ thống" — mỗi cái dạy đúng 1 cơ chế, rải theo đúng cấp hệ đó mở khoá, dùng
//     sideOnEvent(<type mới>) gọi từ chính hàm nâng cấp/chế tạo của hệ đó (xem các chỗ gọi
//     sideOnEvent bên dưới trong game.js — chaosCombine...);
// (2) NV "cầu nối cốt truyện" (type:'talk', giữ nguyên từ bản cũ) — không nhàm vì không phải
//     đánh quái lặp lại, chỉ là mắt xích đưa người chơi qua vùng mới.
window.SIDE_QUESTS = [
  // ── Học hệ thống — mỗi NV dạy đúng 1 cơ chế nâng cấp nhân vật ──
  { id:'s_shard', npc:'monkhach', map:'tuongduong', reqLv:12, reqMain:10, name:'Đồng Tiền Thứ Ba',
    desc:'Ba ô ở góc trên bên phải là ví của ngươi: Lumen ◈, Ấn Giao Kết ✦, và Shard ♦. Shard không rơi từ quái — nó tới từ Mục Tiêu Hôm Nay, Truy Nã Lệnh và mỗi con boss vùng ngươi hạ lần đầu. Bấm ô ♦ mở Quầy Shard rồi tiêu thử một lần.',
    type:'shard', need:1, rew:{xp:2600, silver:800} },
  { id:'s_sys5', npc:'quachtinh', map:'tuongduong', reqLv:19,  reqMain:12, name:'Lò Hỗn Loạn',            desc:'Dư ít nhất 3 món cùng phẩm? Mang đến Lò Rèn Hoàng Gia, ném vào Lò Hỗn Loạn thử vận may lên phẩm cao hơn.', type:'chaos', need:1, rew:{xp:3500, silver:900} },
  // ── Cầu nối cốt truyện — dẫn người chơi qua từng vùng mới, không đánh quái lặp lại ──
  // s_b1→s_b5 (5 phụ tuyến "cầu nối") đã bỏ: mỗi cái trùng 100% với NV mở chương ngay sau, nhận
  // được TRƯỚC khi vào được map đích, giá trị dạy = 0. Chơi thử chấm "bỏ" cả năm.
  // Dược Sư trước đây là NPC DUY NHẤT bấm E vào mà không có việc gì làm: talk:'quest' nhưng
  // không nhiệm vụ nào trỏ tới ông. Petalshade Isle đã có sẵn điểm thảo dược, nên cho ông
  // đúng cái nghề của mình.
  { id:'s_duocsu', npc:'duocsu', map:'daohoa', reqLv:4, reqMain:3, name:'Thuốc Cho Cả Đảo', desc:'Khí Morvahn làm bệnh mới mọc nhanh hơn thuốc cũ. Hái 5 Thảo Dược quanh Petalshade Isle (đứng gần rồi bấm J) mang về cho Dược Sư.', type:'collect', need:5, rew:{xp:520, silver:270} },
  // ── Năm cái tên bị gạch — mỗi chương một, rải đúng vào khoảng trống cấp 12→115 ─────
  // Mỗi cái là MỘT vật chứng + MỘT người để mang tới. Không cơ chế mới, không map mới.
  // NPC đích cố tình KHÔNG phải người giao: bảy NPC dẫn chương xưa nay không ai nhắc tên ai,
  // nên chuỗi này bắt họ chuyền tay nhau — và giao đâu nhận đó thì nhiệm vụ tự xong ngay lập
  // tức, không thành chuyến đi nào cả.
  { id:'s_td1', npc:'daosi',    map:'chungnam',  reqLv:26,  reqMain:16, clue:'td_giap',
    name:'Bộ Giáp Không Có Người', desc:'Giữa Thornwood Reach có một bộ giáp Tiên Phong đứng nguyên, khoá đai còn cài. Mang nó về Lunaris City cho Trưởng Lão Rell — ông giữ Bảng Tên, ông có quyền gạch.',
    type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:9000, silver:1100} },
  { id:'s_td2', npc:'thumo',    map:'comoc',     reqLv:46,  reqMain:20, clue:'td_nhatky',
    name:'Nét Chữ Nhạt Dần',      desc:'Trong ổ ấp Hollow Roost có một quyển nhật ký viết dở, và sáu trang cuối thì không nên đọc một mình. Đưa cho Đạo Sĩ ở Thornwood — ông ta từng đi cùng người viết nó.',
    type:'talk', targetNpc:'daosi', need:1, rew:{xp:26000, silver:2050} },
  { id:'s_td3', npc:'ttmon',    map:'tuyettinh', reqLv:66,  reqMain:25, clue:'td_huyhieu',
    name:'Kẻ Đã Đổi Phe',         desc:'Một tinh anh ở Frostmire Vale đeo huy hiệu đội Tiên Phong. Nó nhận ra ngươi — và vẫn không dừng tay. Gỡ huy hiệu, mang tới Thủ Mộ ở Hollow Roost.',
    type:'talk', targetNpc:'thumo', need:1, rew:{xp:52000, silver:3200} },
  { id:'s_td4', npc:'noiung',   map:'mongco',    reqLv:86,  reqMain:29, clue:'td_bia',
    name:'Mộ Tự Đào',             desc:'Giữa Ashen Steppe có một nấm mộ đào bằng tay, bia khắc dở. Người nằm dưới biết mình sắp thành thứ ở quyển nhật ký kia, nên dừng trước. Báo cho Trấn Thủ Môn ở Frostmire.',
    type:'talk', targetNpc:'ttmon', need:1, rew:{xp:88000, silver:4550} },
  { id:'s_td5', npc:'laotuong', map:'nhanmon',   reqLv:106, reqMain:32, clue:'td_trong',
    name:'Chỗ Trống Thứ Bảy',     desc:'Ngươi đã tìm ra năm. Còn một cái tên trên Bảng Tên chưa bị gạch, và ở Stormgate Pass không có gì để tìm cả. Về hỏi Trưởng Lão Rell xem người thứ bảy là ai.',
    type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:130000, silver:6100} },
  { id:'s_b6', npc:'laotuong',  map:'tuongduong', reqLv:115, reqMain:33, name:'Báo Tin Thắng Trận',     desc:'Về Lunaris City báo cho Trưởng Lão Rell tin cửa ải đã giữ vững.', type:'talk', targetNpc:'quachtinh', need:1, rew:{xp:55000, silver:3500} },
];

// ═══════════ CỐT TRUYỆN NGŨ ẤN × TÔNG MÔN — manh mối, lời thoại trấn thủ, kết mở ═══════════
window.CLUES = {
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
  // ── Năm cái tên bị gạch ──────────────────────────────────────────────────────────
  // Bảng Tên rơi ở chương I rồi im lặng suốt 100 cấp: năm người đó không có tên, không có xác,
  // không có kết cục, và người thứ bảy thì không ai hỏi là ai. Đây là sợi dây DUY NHẤT nối nhân
  // vật chính với quá khứ của chính mình, nên nó không được phép bỏ lửng.
  // Bốn kết cục đầu là bốn cách Lunacia giết người, xếp từ NHANH NHẤT tới CHẬM NHẤT — và cái
  // chậm nhất là cái đáng sợ nhất. Người thứ năm cố tình không có gì để tìm.
  td_giap:  { name:'Bộ Giáp Đứng Nguyên',   desc:'Giáp Tiên Phong dựng đứng giữa rừng, khoá đai còn cài, không một vết chém. Bên trong trống không. Tên khắc ở cổ áo: HALLA.' },
  td_nhatky:{ name:'Nhật Ký Viết Dở',       desc:'"Ngày thứ chín. Tay ta viết chậm hơn ta nghĩ." Sáu trang sau vẫn là nét chữ đó, nhạt dần. Trang cuối không còn là chữ người. Ký tên: MEV.' },
  td_huyhieu:{ name:'Huy Hiệu Gỡ Từ Xác',  desc:'Huy hiệu đội Tiên Phong, gỡ khỏi ngực một kẻ vừa cố giết ngươi. Mặt sau khắc: ORIN. Hắn nhận ra ngươi trước khi ngã — và vẫn không dừng tay.' },
  td_bia:   { name:'Bia Tự Khắc',           desc:'Mộ đào bằng tay, nông. Bia khắc dở: "TÊN TA LÀ SERR. TA DỪNG Ở ĐÂY TRONG LÚC CÒN LÀ TA."' },
  td_trong: { name:'Chỗ Trống Thứ Bảy',     desc:'Không có gì ở đây cả. Không giáp, không xác, không bia. Trên Bảng Tên, cái tên thứ bảy vẫn chưa bị gạch — vì chưa ai chứng minh được là nó nên bị gạch.' },
  co_lenh:     { name:'Quân Lệnh Cũ',            desc:'Văn thư: "Stormgate Pass thất thủ thì cả Lunacia mở toang." Dấu triện đã sáu mươi năm — cũ hơn cuộc giao thoa rất nhiều.' },
  le_thach:    { name:'Đá Khắc Lời Trăng Trối',  desc:'Mảnh đá nhuốm máu: "Đừng tin bất cứ ai nói rằng chuyện này là tai nạn."' },
  mat_lenh:    { name:'Mật Lệnh Rách',           desc:'"…khi đủ năm trụ gãy, Vết Nứt mở toang — Morvahn bước qua, Lunacia thành lò luyện."' },
  thu_cuoi:    { name:'Thư Cuối Của Tướng Quân', desc:'"Ta giữ Stormgate Pass ba mươi năm. Hôm nay ta mở cổng — không phải vì hàng, mà vì đằng nào nó cũng mở."' },
};

window.BOSS_LORE = {
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
