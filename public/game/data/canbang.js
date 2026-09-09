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
// là ba ô, ba đường nâng cấp, ba bảng. Chủ dự án chốt cho Ragoon nuốt Thú Chiến — hành vi chiến
// đấu (đi theo, tự đánh) giữ nguyên, chỉ đổi CÁCH CÓ nó: quay được thay vì nâng giai.
//
// Art: cả 16 con là ảnh Axie thật, dựng từ 16 rig Spine KHÁC NHAU trong axie-origins-asset-kit
// (assets/chimera/*.webp — bảng khung hình, xem tools/spine/nuong_chi.py). Cố tình không lấy bản biến
// thể của cùng một rig: hai con chỉ khác cái mũ thì trong màn nhìn như lỗi trùng ảnh.
// ⚠ TÊN HỆ: RAGOON, KHÔNG PHẢI CHIMERA. Tiền tố mã `CHI_*` và tên mảng `CHIMERA` là DI SẢN,
// giữ nguyên để khỏi động vào ~200 chỗ tham chiếu; mọi chữ NGƯỜI CHƠI THẤY đã đổi hết.
//
// Vì sao phải đổi: theo Lore Deck #1 tr.5, chimera SINH RA TỪ DẠNG THA HOÁ CỦA THẦN ATIA và là
// kẻ thù duy nhất của Lunacia — cả bộ luật xoay quanh "battle the chimera". Cho người chơi sưu
// tầm chimera làm bạn đồng hành là lật ngược trục truyện.
//
// Ragoon thì vừa khít: tr.65 tả chúng là "mischievous little underwater canids who have the
// ability to shapeshift into any creature or object, as long as it follows the law of
// conservation of mass", và "many ragoons will merge and transform together" khi cần hoá thành
// thứ to hơn mình. Nghĩa là 16 con dưới đây KHÔNG phải 16 loài — chúng là MỘT loài đang mượn 16
// hình dạng. Bộ art Axie sẵn có vì thế đúng nguyên si, và cơ chế Hoá (gộp để lên bậc) hoá ra
// chính là câu trong deck.
window.CHIMERA = [
  // ── 5★ ──────────────────────────────────────────────────────────────────────
  { id:'aurelion',  ten:'Aurelion',  sao:5, lop:'Dawn',    mau:'#e0a63c',
    thu:{ k:'skillPct', v:12 }, thuTxt:'+12% sát thương chiêu thức',
    chieu:{ ten:'Rạng Đông', cd:14, r:150, mult:2.6, fx:'sun' }, moTa:'Bình minh đọng lại thành hình — nơi nó đứng, bóng tối không tới được.' },
  { id:'netherfang',ten:'Netherfang',sao:5, lop:'Dusk',    mau:'#8a5ad8',
    thu:{ k:'hpLeech', v:6 }, thuTxt:'hút 6% sát thương gây ra thành Sinh Lực',
    chieu:{ ten:'Màn Đêm', cd:16, r:170, mult:2.2, fx:'dark', slow:0.4 }, moTa:'Sinh ra từ khe nứt. Nó không săn mồi — nó chờ mồi kiệt sức.' },
  { id:'tidewarden',ten:'Tidewarden',sao:5, lop:'Aquatic', mau:'#3ac8c8',
    thu:{ k:'hpPct', v:15 }, thuTxt:'+15% Sinh Lực tối đa',
    chieu:{ ten:'Triều Chắn', cd:18, r:0, mult:0, fx:'shield', shieldPct:30 }, moTa:'Càng nước dựng lên một bức tường, và bức tường đó biết bơi.' },
  { id:'emberjaw',  ten:'Emberjaw',  sao:5, lop:'Beast',   mau:'#f0932a',
    thu:{ k:'aspdPct', v:10 }, thuTxt:'+10% tốc độ đánh',
    chieu:{ ten:'Lao Húc', cd:12, r:190, mult:2.8, fx:'charge', kb:60 }, moTa:'Chạy trước, nghĩ sau, và chưa bao giờ thấy cần nghĩ.' },
  { id:'voltcrest', ten:'Voltcrest', sao:5, lop:'Bird',    mau:'#4fc9d9',
    thu:{ k:'evaPct', v:8 }, thuTxt:'+8% né đòn',
    chieu:{ ten:'Mào Sét', cd:15, r:320, mult:2.0, fx:'bolt', multi:5 }, moTa:'Cái mào trên đầu tích điện cả ngày. Đập cánh một cái là năm chỗ cùng nổ.' },
  { id:'ironshell', ten:'Ironshell', sao:5, lop:'Reptile', mau:'#7bbf3a',
    thu:{ k:'dmgred', v:10 }, thuTxt:'−10% sát thương gánh chịu',
    chieu:{ ten:'Khiêu Chiến', cd:17, r:220, mult:1.4, fx:'taunt', taunt:8 }, moTa:'Vác nguyên tảng đá trên lưng. Nó đứng chắn trước mặt bạn và không hiểu vì sao bạn lại lo.' },
  // ── 4★ ──────────────────────────────────────────────────────────────────────
  { id:'petalkin',  ten:'Petalkin',  sao:4, lop:'Plant',   mau:'#e87ab0',
    thu:{ k:'hpPct', v:6 }, thuTxt:'+6% Sinh Lực tối đa',
    chieu:{ ten:'Bung Cánh', cd:16, r:130, mult:1.6, fx:'sun' }, moTa:'Con Chimera đầu tiên chịu đi theo người lạ.' },
  { id:'crimsonmaw',ten:'Crimsonmaw',sao:4, lop:'Beast',   mau:'#c0304a',
    thu:{ k:'atkPct', v:5 }, thuTxt:'+5% Công Kích',
    chieu:{ ten:'Ngoạm', cd:14, r:120, mult:1.9, fx:'charge', kb:30 }, moTa:'Vết cắn của nó không lành lại — chỉ đóng vảy.' },
  { id:'thornpaw',  ten:'Thornpaw',  sao:4, lop:'Plant',   mau:'#cf5a52',
    thu:{ k:'crit', v:4 }, thuTxt:'+4% Bạo Kích',
    chieu:{ ten:'Vuốt Gai', cd:15, r:130, mult:1.7, fx:'charge' }, moTa:'Quả mọng đỏ mọc kín người, và mỗi quả giấu một cái gai.' },
  { id:'inkmane',   ten:'Inkmane',   sao:4, lop:'Dusk',    mau:'#c2c6d2',
    thu:{ k:'hpPct', v:5 }, thuTxt:'+5% Sinh Lực tối đa',
    chieu:{ ten:'Vằn Mực', cd:16, r:150, mult:1.6, fx:'shield', shieldPct:14 }, moTa:'Vằn đen trên lưng nó đổi chỗ mỗi lần bạn quay đi.' },
  { id:'cinderbeak',ten:'Cinderbeak',sao:4, lop:'Bird',    mau:'#f0b45a',
    thu:{ k:'aspdPct', v:4 }, thuTxt:'+4% tốc độ đánh',
    chieu:{ ten:'Mỏ Than', cd:14, r:280, mult:1.6, fx:'bolt', multi:3 }, moTa:'Rỉa than nóng như rỉa hạt.' },
  { id:'mossback',  ten:'Mossback',  sao:4, lop:'Plant',   mau:'#e7dcc2',
    thu:{ k:'dmgred', v:4 }, thuTxt:'−4% sát thương gánh chịu',
    chieu:{ ten:'Vỏ Rêu', cd:18, r:0, mult:0, fx:'shield', shieldPct:16 }, moTa:'Ngủ đủ lâu thì hoa mọc trên lưng. Nó vẫn chưa dậy.' },
  { id:'hexmite',   ten:'Hexmite',   sao:4, lop:'Bug',     mau:'#d8443c',
    thu:{ k:'atkPct', v:4 }, thuTxt:'+4% Công Kích',
    chieu:{ ten:'Bầy Nhỏ', cd:15, r:160, mult:1.5, fx:'dark' }, moTa:'Một con thì không sao. Nó không bao giờ có một con.' },
  { id:'ridgehorn', ten:'Ridgehorn', sao:4, lop:'Reptile', mau:'#b45ad0',
    thu:{ k:'dmgred', v:4 }, thuTxt:'−4% sát thương gánh chịu',
    chieu:{ ten:'Húc Sừng', cd:15, r:150, mult:1.8, fx:'charge', kb:36 }, moTa:'Ba cái sừng, và nó chưa bao giờ dùng quá một cái.' },
  { id:'coghound',  ten:'Coghound',  sao:4, lop:'Mech',    mau:'#e8e0d0',
    thu:{ k:'crit', v:4 }, thuTxt:'+4% Bạo Kích',
    chieu:{ ten:'Bánh Răng', cd:14, r:140, mult:1.7, fx:'bolt', multi:2 }, moTa:'Ai đó lắp nó lại từ mảnh vỡ, và nó nhớ ơn.' },
  { id:'sunspur',   ten:'Sunspur',   sao:4, lop:'Dawn',    mau:'#efdcb4',
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

// ═══ NHIỆM VỤ CHÍNH TUYẾN — ĐÃ GỠ SẠCH, CHỜ DỰNG LẠI ═══════════════════════
// Chủ dự án gỡ toàn bộ nhiệm vụ để thiết kế lại: lối chơi đã đổi khá nhiều (bỏ 7 phó bản, vai
// trò theo bãi, bản sắc map, zoom camera), nên chuỗi nhiệm vụ cũ dẫn người chơi đi qua một game
// không còn tồn tại. Giữ một chuỗi sai còn tệ hơn không có chuỗi nào.
//
// Máy chạy nhiệm vụ GIỮ NGUYÊN và chạy theo dữ liệu: currentQuest() trả null khi bảng rỗng,
// bảng theo dõi tự ẩn, NPC tự rơi về lời thoại thường. Điền lại bảng này là chuỗi sống lại.
//
// Khuôn một mục:
//   { id, lv, name, desc, type, need, rew:{ xp, silver, item? } }
//   type: 'talk' (+targetNpc) · 'kill' (+mob) · 'tpkill' (+mob) · 'boss' (+mob)
//         'collect' (+herbMap) · 'enhance' · 'meditate'
//
// ⚠ CỔNG MAP KHÔNG CÒN DỰA VÀO NHIỆM VỤ. `reqMain` đã gỡ khỏi mọi map — nay mở khoá bằng CẤP
// (md.min) là đủ. Dựng lại chuỗi thì cân nhắc kỹ trước khi cắm `reqMain` lại: khoá map sau một
// nhiệm vụ nghĩa là nhiệm vụ đó hỏng thì map đó mất.
// ═══ TRỤC TRUYỆN — LẤY THẲNG TỪ LORE DECK #1, KHÔNG BỊA ═══════════════════
// Deck cho sẵn một vòng nhân-quả kín:
//   · chimera sinh ra từ DẠNG THA HOÁ của thần Atia (tr.5)
//   · axie VÀ chimera đều là hậu duệ trực hệ của Atia (tr.11) — nội chiến trong một dòng máu
//   · Dawn axie giữ Atia Shrine và mạng SPIRIT LAMP "to help guide the souls of axies to the
//     Spirit Tree after death, so they can reincarnate" (tr.57)
//   · Dusk axie canh chính Spirit Tree (tr.58)
//   · sapidae "are able to use the land to build stone walls and create moats to fortify their
//     villages from chimera" (tr.16)
//
// CÂU HỎI TRUNG TÂM: đèn hồn đang tắt dần. Hồn axie chết không về được Spirit Tree. Chúng kẹt
// lại — và thứ kẹt lại là thứ chimera ăn.
//
// Một tiền đề đó làm ba việc cùng lúc: giải thích vì sao có bãi quái, giải thích vì sao phải đi
// xa dần từng vùng, và cho Atia đúng vai mà luật cho phép — tr.12: Atia ban TRÍ TUỆ, manh mối,
// đường đi, KHÔNG ban của cải. Nên trong chuỗi này Atia không bao giờ trao thưởng; một ngọn đèn
// thắp lại chỉ soi cho thấy ngọn kế tiếp đang tắt ở đâu.
//
// ⚠ BA RÀNG BUỘC CỦA MÁY CHẠY — thiết kế phải vừa khít, đừng sửa máy:
//   ① `questIdx === 9` (mục thứ 10) gọi spawnBoss() — Thủ Lĩnh Gloam cấp 10 hiện ra ở
//      BOSS_ARENA trên Plant Tribe Glade. Nên mục 10 PHẢI là trận đó.
//   ② `type:'boss'` bật victory + showVictory(). Đó KHÔNG phải hết game: màn hình ấy nói "bước
//      qua cánh cửa đầu tiên" rồi có nút Tiếp Tục — nó là kết CHƯƠNG I. Chuỗi chạy tiếp bình thường.
//   ③ `q.npc` phải là NPC `talk:'quest'`, nếu không thì không có bảng để trả nhiệm vụ.
//
// `collect` chỉ chạy ở map có HERB_SPOTS (Plant Tribe Glade · Beast Herd Camp).
// `meditate` neo vào SPRING trên Plant Tribe Glade — trong chuỗi này nó LÀ một Atia Shrine.
// `tpkill` bắt hạ quái bằng đòn Trấn Phái, để người chơi thật sự dùng chiêu riêng của lớp.
window.QUESTS = [
  // ── CHƯƠNG I · NGỌN ĐÈN TẮT (cấp 1–10) ────────────────────────────────────
  { id:'c1q1', chapter:'I · Ngọn Đèn Tắt', lv:1, npc:'qt_gaccong', map:'quangtruong',
    type:'talk', targetNpc:'qt_balao', need:1,
    name:'Ngọn Đèn Bên Giếng', desc:'Đội Trưởng Gác Cổng nói cái đèn cạnh giếng tắt ba đêm liền, mà dầu vẫn còn đầy. Bà lão múc nước mỗi sáng — hỏi bà.',
    rew:{ xp:220, silver:120 } },
  { id:'c1q2', chapter:'I · Ngọn Đèn Tắt', lv:2, npc:'qt_gaccong', map:'daohoa',
    type:'kill', mob:'boar', need:6,
    name:'Ra Ngoài Cổng Bắc', desc:'Bà lão bảo: đèn tắt thì thứ ngoài kia dạn hơn. Ra Cổng Bắc, dọn bầy heo rừng đang lấn tới sát chân tường.',
    rew:{ xp:340, silver:180 } },
  { id:'c1q3', chapter:'I · Ngọn Đèn Tắt', lv:3, npc:'truonglang', map:'daohoa',
    type:'talk', targetNpc:'duocsu', need:1,
    name:'Người Giữ Đèn', desc:'Trưởng Làng nhận ra ngay: đó là đèn dẫn hồn, do Dawn axie trông coi. Dược Sư từng phụ họ pha dầu — hỏi cho ra công thức.',
    rew:{ xp:420, silver:200 } },
  { id:'c1q4', chapter:'I · Ngọn Đèn Tắt', lv:4, npc:'duocsu', map:'daohoa',
    type:'collect', herbMap:'daohoa', need:5,
    name:'Dầu Cho Ngọn Đèn', desc:'"Dầu đèn không mua được. Nó là nhựa cây trong rừng thưa, mà chỉ Plant axie mới biết chỗ." Hái đủ năm bụi.',
    rew:{ xp:520, silver:240 } },
  { id:'c1q5', chapter:'I · Ngọn Đèn Tắt', lv:5, npc:'truonglang', map:'daohoa',
    type:'kill', mob:'hautu', need:8,
    name:'Thứ Ăn Hồn Kẹt', desc:'Đèn tắt thì hồn không về được Cây Hồn, kẹt lại giữa đường. Lũ này tụ quanh chỗ hồn kẹt mà ăn. Dọn sạch.',
    rew:{ xp:640, silver:300 } },
  { id:'c1q6', chapter:'I · Ngọn Đèn Tắt', lv:6, npc:'qt_gaccong', map:'quangtruong',
    type:'enhance', need:3,
    name:'Thép Chịu Được Bóng', desc:'"Đồ thường chém vào chúng như chém sương." Mang một món tới lò rèn, đập lên +3 rồi quay lại.',
    rew:{ xp:760, silver:400 } },
  { id:'c1q7', chapter:'I · Ngọn Đèn Tắt', lv:7, npc:'duocsu', map:'daohoa',
    type:'meditate', need:20,
    name:'Ngồi Ở Miếu Atia', desc:'"Miếu bên suối vẫn còn. Atia không cho ai vàng bạc — nhưng ngồi đủ lâu thì ngài cho ngươi biết ngọn đèn kế tiếp tắt ở đâu."',
    rew:{ xp:900, silver:420 } },
  { id:'c1q8', chapter:'I · Ngọn Đèn Tắt', lv:8, npc:'truonglang', map:'daohoa',
    type:'tpkill', mob:'wolf', need:6,
    name:'Đòn Của Riêng Ngươi', desc:'"Đòn thường không đủ nữa." Hạ sáu con bằng chính Trấn Phái tuyệt kỹ của lớp ngươi.',
    rew:{ xp:1100, silver:500 } },
  { id:'c1q9', chapter:'I · Ngọn Đèn Tắt', lv:9, npc:'duocsu', map:'daohoa',
    type:'kill', mob:'caodo', need:12,
    name:'Kẻ Canh Miếu', desc:'Miếu Atia phía đông bị chiếm. Bọn Gloam dựng trại ngay trên nền miếu — dọn chúng đi thì đèn mới thắp lại được.',
    rew:{ xp:1400, silver:650 } },
  { id:'c1q10', chapter:'I · Ngọn Đèn Tắt', lv:10, npc:'truonglang', map:'daohoa',
    type:'boss', mob:'boss', need:1,
    name:'Thủ Lĩnh Gloam', desc:'Kẻ ngồi trên nền miếu không phải quái đi lạc — nó biết chính xác ngọn đèn nào cần dập. Hạ nó.',
    rew:{ xp:2600, silver:1200, item:'vukhi' } },

  // ── CHƯƠNG II · LỬA CỦA THỢ RÈN (cấp 14–24) ───────────────────────────────
  { id:'c2q1', chapter:'II · Lửa Của Thợ Rèn', lv:14, npc:'quachtinh', map:'tuongduong',
    type:'talk', targetNpc:'monkhach', need:1,
    name:'Tin Từ Trại Chăn', desc:'Trưởng Lão Rell đọc xong mảnh khắc lấy từ xác Thủ Lĩnh Gloam thì im rất lâu. "Đèn tắt không phải một chỗ. Gặp Trinh Sát Wren."',
    rew:{ xp:2200, silver:900 } },
  { id:'c2q2', chapter:'II · Lửa Của Thợ Rèn', lv:15, npc:'monkhach', map:'ngoai',
    type:'kill', mob:'gloam_scout', need:12,
    name:'Kẻ Đi Trước', desc:'"Trước mỗi ngọn đèn tắt đều có bọn này đi qua trước một đêm. Chúng đang đếm đèn." Chặn lũ trinh sát ngoài trại chăn.',
    rew:{ xp:2600, silver:1000 } },
  { id:'c2q3', chapter:'II · Lửa Của Thợ Rèn', lv:17, npc:'monkhach', map:'ngoai',
    type:'collect', herbMap:'ngoai', need:8,
    name:'Dầu Cho Cả Vùng', desc:'Trại chăn của Beast axie dựng tạm rồi lại dời — nhưng đèn thì đứng yên. Gom đủ dầu cho tám ngọn dọc đường chăn.',
    rew:{ xp:3000, silver:1150 } },
  { id:'c2q4', chapter:'II · Lửa Của Thợ Rèn', lv:19, npc:'quachtinh', map:'ngoai',
    type:'kill', mob:'boar_tusk', need:14,
    name:'Đàn Bị Dồn', desc:'Beast axie sống nhờ đàn gia súc. Thứ dồn đàn chạy loạn không phải sói — nó đang lùa chúng về phía một ngọn đèn tắt.',
    rew:{ xp:3400, silver:1300 } },
  { id:'c2q5', chapter:'II · Lửa Của Thợ Rèn', lv:21, npc:'quachtinh', map:'tuongduong',
    type:'enhance', need:6,
    name:'Lò Của Reptile', desc:'"Thợ rèn giỏi nhất Lunacia là Reptile axie — chúng tạo ra lửa chứ không mượn lửa. Bí quyết ấy nằm trong tay ngươi rồi." Đập một món lên +6.',
    rew:{ xp:3900, silver:1600, item:'ao' } },
  { id:'c2q6', chapter:'II · Lửa Của Thợ Rèn', lv:24, npc:'monkhach', map:'ngoai',
    type:'kill', mob:'chimera_bo', need:16,
    name:'Thứ Sinh Ra Từ Vết Nứt', desc:'Lần đầu ngươi nhìn thẳng vào một con chimera thật. Nó mang nét gì đó quen — deck cũ của sapidae nói axie và chimera cùng một dòng máu.',
    rew:{ xp:4600, silver:1900 } },

  // ── CHƯƠNG III · RUNE CHÔN (cấp 26–56) ────────────────────────────────────
  { id:'c3q1', chapter:'III · Rune Chôn', lv:26, npc:'daosi', map:'chungnam',
    type:'kill', mob:'xanu', need:16,
    name:'Rừng Của Werebear', desc:'Người Gác Rừng Corran giữ khoảnh rừng mà Werebear vẫn sống theo bầy. "Chúng hiền tới lúc bị chọc. Có kẻ đang chọc."',
    rew:{ xp:5200, silver:2100 } },
  { id:'c3q2', chapter:'III · Rune Chôn', lv:30, npc:'daosi', map:'chungnam',
    type:'tpkill', mob:'phando', need:12,
    name:'Kẻ Đổi Phe', desc:'"Không phải con nào cũng bị bắt. Có đứa tự bước sang." Hạ chúng bằng Trấn Phái — Corran muốn thấy tận mắt ngươi làm được.',
    rew:{ xp:5900, silver:2400 } },
  { id:'c3q3', chapter:'III · Rune Chôn', lv:34, npc:'daosi', map:'chungnam',
    type:'kill', mob:'bandao', need:20,
    name:'Đường Xuống Địa Đạo', desc:'Lối vào hầm của Bug axie nằm sau khoảnh rừng này, và nó đang bị canh. Mở đường.',
    rew:{ xp:6800, silver:2800, item:'tay' } },
  { id:'c3q4', chapter:'III · Rune Chôn', lv:42, npc:'thumo', map:'comoc',
    type:'kill', mob:'mocnhan', need:20,
    name:'Bẫy Bị Đọc Vị', desc:'Sylas dựng hầm theo lối Bug axie: lối giả, bẫy, nhiều cửa thoát. "Có thứ đi qua hết mà không sập cái nào. Nghĩa là nó biết trước."',
    rew:{ xp:8200, silver:3300 } },
  { id:'c3q5', chapter:'III · Rune Chôn', lv:46, npc:'thumo', map:'comoc',
    type:'kill', mob:'huyetbat', need:22,
    name:'Tầng Dưới Cùng', desc:'Bug axie khắc Rune — thứ mở ra sức mạnh còn ngủ trong một axie. Kho Rune nằm ở tầng sâu nhất, và tầng ấy đã im tiếng ba tuần.',
    rew:{ xp:9500, silver:3800 } },
  { id:'c3q6', chapter:'III · Rune Chôn', lv:50, npc:'thumo', map:'comoc',
    type:'enhance', need:9,
    name:'Rune Trong Thép', desc:'"Rune không dán lên đồ. Nó phải chịu được lửa cùng miếng thép." Đập một món lên +9 rồi mang tới.',
    rew:{ xp:11000, silver:4600 } },
  { id:'c3q7', chapter:'III · Rune Chôn', lv:56, npc:'thumo', map:'comoc',
    type:'kill', mob:'thinu', need:24,
    name:'Kẻ Đào Ngược', desc:'Hầm này có kẻ đào từ DƯỚI lên. Không phải để vào — để tìm đường ra một chỗ khác.',
    rew:{ xp:13000, silver:5400, item:'non' } },

  // ── CHƯƠNG IV · CÂY HỒN (cấp 62–78) ───────────────────────────────────────
  { id:'c4q1', chapter:'IV · Cây Hồn', lv:62, npc:'ttmon', map:'tuyettinh',
    type:'kill', mob:'ttdetu', need:22,
    name:'Nhà Trên Ngọn Thông', desc:'Liora sống ở độ cao Bird axie chọn để tránh chimera. Năm nay chúng leo được lên tới nơi.',
    rew:{ xp:15000, silver:6200 } },
  { id:'c4q2', chapter:'IV · Cây Hồn', lv:68, npc:'ttmon', map:'tuyettinh',
    type:'kill', mob:'docyeu', need:24,
    name:'Bài Hát Bị Cắt', desc:'Bird axie hát những khúc chỉ chúng hiểu, có khúc dùng ngay trong lúc đánh. Ba tổ trên cao đã ngừng hát.',
    rew:{ xp:17000, silver:7000 } },
  { id:'c4q3', chapter:'IV · Cây Hồn', lv:74, npc:'ttmon', map:'tuyettinh',
    type:'tpkill', mob:'satthuhy', need:16,
    name:'Kẻ Săn Người Giữ Đèn', desc:'Chúng không săn bừa. Chúng săn đúng những con còn biết thắp đèn. Hạ mười sáu con bằng Trấn Phái.',
    rew:{ xp:19500, silver:8000, item:'chan' } },
  { id:'c4q4', chapter:'IV · Cây Hồn', lv:78, npc:'ttmon', map:'tuyettinh',
    type:'enhance', need:11,
    name:'Đủ Sức Đi Tiếp', desc:'"Chỗ ngươi sắp tới không có đèn nào cả. Đừng mang thép nửa vời xuống đó." Đập một món lên +11.',
    rew:{ xp:22000, silver:9500 } },

  // ── CHƯƠNG V · VẾT NỨT (cấp 84–118) ───────────────────────────────────────
  { id:'c5q1', chapter:'V · Vết Nứt', lv:84, npc:'noiung', map:'mongco',
    type:'kill', mob:'kybinh', need:24,
    name:'Đá Nóng Quanh Năm', desc:'Dax do thám vùng đá của Reptile axie — nơi nhà dựng trên tảng lớn, mở ra đóng vào theo nắng. Nay có thứ đóng chúng lại từ bên ngoài.',
    rew:{ xp:26000, silver:11000 } },
  { id:'c5q2', chapter:'V · Vết Nứt', lv:90, npc:'noiung', map:'mongco',
    type:'kill', mob:'cungthu', need:26,
    name:'Mỏ Đã Tắt Lửa', desc:'Reptile axie đào quặng và tạo ra lửa. Một cái mỏ tắt lửa nghĩa là không còn ai dưới đó.',
    rew:{ xp:30000, silver:12500 } },
  { id:'c5q3', chapter:'V · Vết Nứt', lv:96, npc:'noiung', map:'mongco',
    type:'kill', mob:'thamtu', need:28,
    name:'Đếm Ngược Tới Đầm', desc:'Mọi vết chân đều chỉ về một hướng: cái đầm phía đông. Dax không đi tiếp — "chỗ đó là việc của ngươi."',
    rew:{ xp:35000, silver:14000, item:'daychuyen' } },
  { id:'c5q4', chapter:'V · Vết Nứt', lv:104, npc:'laotuong', map:'nhanmon',
    type:'kill', mob:'daokhach', need:26,
    name:'Đầm Của Dusk', desc:'Lão Tướng Brann gọi tên cả sáu người đã dẫn ngươi tới đây. "Dusk axie canh Cây Hồn. Chúng chưa bỏ chạy — nghĩa là còn thứ đáng canh."',
    rew:{ xp:42000, silver:17000 } },
  { id:'c5q5', chapter:'V · Vết Nứt', lv:110, npc:'laotuong', map:'nhanmon',
    type:'tpkill', mob:'cuongbinh', need:20,
    name:'Vòng Trong Cùng', desc:'Nhà Dusk axie tàng hình được, nên thứ vây quanh đây không tìm nhà — nó vây chính Cây Hồn. Phá vòng vây bằng Trấn Phái.',
    rew:{ xp:50000, silver:20000 } },
  { id:'c5q6', chapter:'V · Vết Nứt', lv:118, npc:'laotuong', map:'nhanmon',
    type:'kill', mob:'kylan', need:30,
    name:'Chỗ Hồn Quay Về', desc:'Đèn thắp lại hết rồi. Hồn bắt đầu về được. Thứ chặn ở cửa Cây Hồn biết điều đó, và nó không định nhường đường.',
    rew:{ xp:60000, silver:26000, item:'nhan1' } },
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
    tranai: { id:'cn4', name:'Tướng Quân Werebear Woods', lv:32, el:'Thủy', img:'bandao', x:.86, y:.80, moves:['vach','xung','vong','cuong'] } },
  // Rẻo Rừng Corran bắc cầu 32 → 43: trùm ở đây phải nằm GIỮA Tướng Quân Werebear Woods (C32)
  // và Chỉ Huy Vong Binh (C43), nếu không người chơi rơi thẳng từ C32 sang C43.
  // Bốn chỗ đứng chấm bằng máy trên chính bảng vật cản của map (xa điểm thả ≥700px theo luật
  // test_bossplace, cách nhau ≥1200px, không đè gốc cổ thụ).
  corran: { thuve:[
      { id:'co1', name:'Rễ Cổ Thức Giấc',    lv:34, el:'Mộc',  img:'mocnhan', x:0.1231, y:0.8842, moves:['vong','vach','cuong'] },
      { id:'co2', name:'Kẻ Canh Vòng Cổng',  lv:36, el:'Thổ',  img:'thinu',   x:0.4923, y:0.5053, moves:['vach','xung','goi'] },
      { id:'co3', name:'Axie Sa Ngã Đầu Đàn',lv:38, el:'Thủy', img:'bandao',  x:0.7538, y:0.1263, moves:['xung','vong','cuong'] } ],
    tranai: { id:'co4', name:'Người Giữ Rẻo Corran', lv:41, el:'Mộc', img:'boss_mochu', x:0.7538, y:0.8842, moves:['vong','vach','goi','cuong'] } },
  // Trum Loi Mon dung o TAN CUNG lan -- di het duong moi gap. Do la phan thuong cua viec di het.
  loimon: { thuve:[],
    tranai: { id:'lm1', name:'Kẻ Chặn Cuối Lối', lv:50, el:'Thổ', img:'mocnhan', x:0.9300, y:0.5744, moves:['vach','vong','goi','cuong'] } },
  comoc: { thuve:[
      { id:'cm1', name:'Chỉ Huy Vong Binh',  lv:43, el:'Thổ',  img:'kybinh',   x:0.3654, y:0.4579, moves:['xung','vach','goi'] },
      { id:'cm2', name:'Kẻ An Táng Bóng Tối',lv:46, el:'Thủy', img:'thinu',    x:0.5654, y:0.8053, moves:['vong','xung','cuong'] },
      { id:'cm3', name:'Chúa Tể Bất Tử',     lv:49, el:'Thổ',  img:'mocnhan',  x:.42, y:.80, moves:['vach','vong','goi'] } ],
    tranai: { id:'cm4', name:'Tướng Quân Bug Tribe Tunnels', lv:52, el:'Mộc', img:'boss_mochu', x:.85, y:.80, moves:['vong','xung','goi','cuong'] } },
  tuyettinh: { thuve:[
      { id:'tt1', name:'Kẻ Lạc Lối Tuyệt Vọng',lv:63, el:'Thổ',  img:'ttdetu', x:0.3115, y:0.1947, moves:['vach','goi','cuong'] },
      { id:'tt2', name:'Cỏ Dại Băng Giá',     lv:66, el:'Hỏa',  img:'caodo',    x:0.6115, y:0.6158, moves:['xung','vong','goi'] },
      { id:'tt3', name:'Xoáy Sương Nguyền',    lv:69, el:'Mộc',  img:'boss_tinhhoa', x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'tt4', name:'Tướng Quân Bird Tribe Heights', lv:72, el:'Mộc', img:'thinu', x:.86, y:.80, moves:['vong','vach','xung','cuong'] } },
  mongco: { thuve:[
      { id:'mc1', name:'Kỵ Sĩ Trưởng Tro Tàn', lv:83, el:'Kim', img:'kybinh',  x:0.3269, y:0.2158, moves:['xung','vach','cuong'] },
      { id:'mc2', name:'Cung Thủ Tinh Nhuệ Tro Tàn', lv:86, el:'Mộc',  img:'cungthu',  x:0.55, y:0.7632, moves:['vong','xung','goi'] },
      { id:'mc3', name:'Thống Lĩnh Tro Tàn', lv:89, el:'Kim', img:'cuongbinh',x:.42, y:.80, moves:['vach','xung','vong'] } ],
    tranai: { id:'mc4', name:'Tướng Quân Reptile Sunstone Flats', lv:92, el:'Kim', img:'boss_dothong', x:.86, y:.80, moves:['xung','vong','goi','cuong'] } },
  nhanmon: { thuve:[
      { id:'nm1', name:'Tướng Quân Bão Tố',  lv:103, el:'Kim', img:'daokhach', x:0.3423, y:0.2368, moves:['vach','xung','cuong'] },
      { id:'nm2', name:'Huyết Sát Bão Tố',   lv:106, el:'Hỏa',  img:'cuongbinh',x:0.5654, y:0.5105, moves:['vong','vach','goi'] },
      { id:'nm3', name:'Tướng Quân Cửa Ải', lv:109, el:'Thổ',  img:'boss_thienbinh', x:0.3038, y:0.9105, moves:['xung','vong','vach'] } ],
    tranai: { id:'nm4', name:'Tướng Quân Dusk Marsh', lv:112, el:'Hỏa', img:'boss_thienbinh', x:.86, y:.80, moves:['vach','xung','vong','cuong'] } },
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
    // Tên tiếng Anh đi kèm ghi ở chú thích: game chưa dịch tên món (strings/en.js không có
    // khoá nào cho tên vũ khí), nên đây là chỗ duy nhất giữ lại tên gốc cho đợt i18n sau.
    t:[ ['Cốt Linh Trượng', {}],                       // SoulBone Staff
        ['Thiên Linh Quyền Trượng', {}],                  // Celestial Spirit Scepter
        ['Mãng Xà Trượng', {}],                        // Serpent Staff
        ['Thiên Lôi Trượng', {}],                      // Thunderlord Staff
        ['Mỹ Xà Quyền Trượng', {}],                    // Gorgon Scepter
        ['Huyền Cổ Thần Trượng', {}],                  // Elder God Staff
        ['Cửu Thế Phục Sinh Trượng', {}] ] },          // Eternal Rebirth Staff
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
// Bảy phó bản tĩnh ĐÃ GỠ (xem CLAUDE.md · CHẨN ĐOÁN GỐC). Chúng là một địa hình dùng bảy lần.
// Tầng map đang được dựng lại bằng KHUÔN HÀNH LANG, và mục đầu tiên (`pb_loimon`) đã cắm xong
// ngay dưới — máy chạy phó bản trong game.js (DGN · startDungeonRun · updateDungeon · boss săn ·
// thưởng) không phải sửa một dòng nào để nhận nó.
//
// Hình PHÒNG nay cũng là dữ liệu: map khai `dgnKhuon` (xem khối "KHUÔN PHÒNG" trong game.js) thì
// ba đoạn nằm dọc hành lang thay vì ba phòng chồng lên nhau; không khai thì rơi về khuôn dọc cũ.
// Nên "thêm một phó bản" giờ đúng nghĩa là điền dữ liệu: một khoá ở `MAPS` + một khoá ở đây.
//
// Khuôn một mục:
//   <mapId>: { boss, bossName, waves:[[3 loài],[3],[3]], huntBoss, boxTier:1-5, timeLimit,
//              rewards:{ sach:[lo,hi], tuLa:[lo,hi], hon:[lo,hi], khi, bacThem, silver:[lo,hi] } }
window.DUNGEONS = {
  // LỐI MÒN SÂU — mục đầu tiên cắm lại sau khi gỡ bảy phòng. Ba đợt lấy đúng ba loài của map cha
  // (`loimon`), leo theo đúng thang C38 → C42 → C48 mà lối mòn ngoài trời đã dạy: đi sâu hơn thì
  // gặp thứ nặng hơn, không cần một dòng chữ nào giải thích.
  //
  // ⚠ SỐ THƯỞNG LÀ NỘI SUY, KHÔNG PHẢI SỐ CŨ. Bảng thưởng của bảy phòng cũ đã bị gỡ theo chúng và
  // không còn ở đâu trong repo để chép lại. Bộ số dưới đây suy từ hai mốc còn sống: phòng bài
  // kiểm `tests/pbthu.js` (cấp 12 → bạc 850-1450, khí 40, sách 1-2) và bạc rơi của chính con trùm
  // (`boss_mochu` 1300-1800), giữ nguyên tỉ lệ ~2,5 lần bạc trùm mà phòng bài kiểm đang dùng.
  // Nó hợp lý chứ chưa phải đã cân — chơi thử rồi chỉnh, và chỉnh ở đây thì không phải mở game.js.
  pb_loimon: {
    boss:'boss_mochu', bossName:'Chúa Tể Hầm Mộ',
    waves: [ ['bandao','bandao','thinu'],      // đoạn đầu — C38, đúng loài Khoảnh Đầu Lối
             ['thinu','thinu','mocnhan'],      // đoạn giữa — C42
             ['mocnhan','mocnhan','thinu'] ],  // đoạn cuối — C48, ngay trước sảnh trùm
    huntBoss:'boss_hacnu2', boxTier:3,
    // 10 phút. Khuôn làn bắt đi bộ nhiều hơn khuôn dọc — 6400px một chiều, ~31 giây đi suông ở
    // player.speed=209 — nên đồng hồ phải rộng hơn mức 480 của phòng bài kiểm, nếu không thì thứ
    // bị tính giờ là quãng đường chứ không phải trận đánh.
    timeLimit: 600,
    rewards: { sach:[2,4], tuLa:[1,2], hon:[0,1], khi:110, bacThem:500, silver:[3300,4600] },
  },
};

// Internal object keys are stable identifiers (referenced throughout combat/save logic) and are
// intentionally left unchanged by the Axie reskin — only player-facing fields below (name,
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
    tp:{ name:'Meteorite', mult:3.2, tam:420 } },   // tam: gọi thiên thạch xuống chỗ bầy quái, không phải dưới chân mình
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
};

// packs: quái đứng thành cụm 5-7 con, đánh 1 con cả cụm lao vào (GDD Mob Mechanics)
window.MAPS = {
  daohoa: { name:'Plant Tribe Glade', min:1, range:'1 - 12', type:'safe', ground:'#ece2c8', patch:'#7a86ad',
    spawn:{ x:460, y:460 }, spawnFrom:{ quangtruong:{ x:300, y:330 } }, village:true, spring:true, herbs:true, boss:true, trees:70, rocks:26,
    desc:'Nơi đặt trại ấp Plant Tribe — bãi săn của người mới. Chimera yếu, đồ rơi nhập môn, chỗ hiền lành để học cách chơi.',
    // Cụm quái xếp theo vòng từ spawn ra: yếu (boar/hautu) gần nhất → mạnh dần (wolf/bandit/
    // caodo) → xa nhất (assassin, trannhan) gần Cổng Vực — người chơi mới thấy rõ "đi sâu = khó
    // hơn" thay vì gặp ngẫu nhiên cả cụm yếu lẫn cụm elite lẫn lộn quanh spawn.
    voi: 1765,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'boar', ten:'Đồng Heo Rừng', dai:[0.12,0.315], cung:[-43,67], cum:[2,2],
        dan:[{ mob:'boar', n:11 }] },   // C1 · Axie Heo Rừng
      { id:'hautu', ten:'Ruộng Bí Ngô', dai:[0.345,0.505], cung:[19,71], cum:[1,1],
        dan:[{ mob:'hautu', n:6 }] },   // C2 · Axie Bí Ngô
      { id:'wolf', ten:'Bìa Rừng Gai Tím', dai:[0.535,0.625], cung:[-13,93], cum:[2,2],
        dan:[{ mob:'wolf', n:13 }] },   // C4 · Axie Gai Tím
      { id:'bandit', ten:'Trại Tay Sai Gloam', dai:[0.655,0.705], cung:[-5,61], cum:[2,2],
        dan:[{ mob:'bandit', n:14, vai:['can','xa'] }] },   // C6 · Tay Sai Gloam
      { id:'caodo', ten:'Vạt Cỏ Dại', dai:[0.735,0.785], cung:[20,72], cum:[1,1],
        dan:[{ mob:'caodo', n:6 }] },   // C8 · Axie Cỏ Dại
      { id:'assassin', ten:'Ngã Ba Cướp Đường', dai:[0.815,0.885], cung:[-28,24], cum:[1,1],
        dan:[{ mob:'assassin', n:1 }] },   // C10 · Cướp Đường Gloam
      { id:'trannhan', ten:'Hàng Tượng Canh Cổng', dai:[0.915,1.0], cung:[0,52], cum:[1,1],
        dan:[{ mob:'trannhan', n:5 }] },   // C12 · Tượng Đá Canh Cổng
    ], duhiep: null },
  // ── QUẢNG TRƯỜNG · map THỬ NGHIỆM cách di chuyển trên nền art isometric ───────────────
  // ⚠ Nền map này là art ISOMETRIC, còn engine thì NHÌN TỪ TRÊN XUỐNG. Hai thứ đó không khớp
  // nhau ở một chỗ không sửa được bằng mã: trong art, nhà có CHIỀU CAO, mái nhà che mất phần
  // đất phía sau nó. Game không có trục cao, nên nhân vật đi ra sau nhà vẫn vẽ ĐÈ LÊN mái.
  // Cách sống chung: chặn nguyên khối nhà lại (MAP_OBSTACLES), chỉ chừa mặt sân.
  //
  // `diTrong` là ĐA GIÁC ĐI ĐƯỢC — mặt sàn hình thoi của khối isometric. Ngoài nó là vực,
  // chặn hết. Xem trongDaGiac() trong game.js.
  quangtruong: { name:'Quảng Trường Cũ', min:1, range:'—', type:'safe', ground:'#6d6455', patch:'#4a4438',
    // ⚠ KHÔNG dùng `city:true`. Cờ đó gọi drawCityWalls/drawCityPlaza — bộ tường thành, đài
    // phun nước và sáu biển hiệu VẼ TAY, toạ độ chép cứng theo Sapidae Chiefdom. Bật lên là chúng
    // vẽ đè lên art vốn đã có sẵn tường, giếng và cửa hiệu: hai cái thành chồng lên nhau.
    // `type:'safe'` là đủ để cấm PK.
    spawn:{ x:1279, y:1166 }, spawnFrom:{ daohoa:{ x:1600, y:780 } }, trees:0, rocks:0,
    // ĐA GIÁC ĐI ĐƯỢC — đo bằng cách phủ đa giác lên chính tấm art rồi soi lại từng mép:
    // bám sát mặt sân lát đá + vạt cỏ, KHÔNG lấn lên nền nhà, hàng rào tây, mái nhà nam hay
    // vành đá nhạt quanh khối. Nhánh chìa lên phía bắc là lối dốc dẫn tới vòm cổng thành.
    // Vì đa giác đã ôm sát sân nên map này KHÔNG cần vật cản khối nhà nào nữa (xem
    // MAP_OBSTACLES.quangtruong) — chỉ còn cái giếng nằm GIỮA sân là thật sự chắn đường.
    diTrong: [[545,1020],[700,1035],[780,1055],[860,970],[1050,870],[1300,800],[1450,745],
              [1560,675],[1700,700],[1800,800],[1860,890],[1935,1085],[1995,1185],[2040,1265],
              [2010,1300],[1830,1290],[1660,1240],[1420,1230],[1180,1265],[980,1270],[820,1250],
              [700,1235],[640,1150]],
    // VẬT TO — công trình rời vẽ chèn vào tranh nền, xếp lớp theo y như cây cối (xem nhánh
    // `case 'vat'` trong game.js). Lò rèn đặt NGAY DƯỚI mép nam của `diTrong`: nóc nó cao hơn
    // mép sân ~40px nên người đứng sát mép bị nóc che mất bàn chân — đúng chiều sâu của tranh
    // isometric, và có được là nhờ khoá xếp lớp lấy CHÂN công trình (y+h) chứ không lấy nóc.
    // Cỡ ×1,55 chọn theo NGƯỜI: ông thợ vẽ trong tranh cao 88px gốc, ×1,55 ra 136px — sát
    // NV_CAO (132), nên đứng cạnh nhân vật không ai to hơn ai.
    vatTo: [ { img:'loren', x:820, y:1215, w:348, h:339 } ],
    desc:'Một khoảnh phố cũ bị vết nứt kéo nguyên khối sang: nhà còn nguyên mái, giếng còn nguyên gàu, và không ai biết dân của nó đi đâu. Ra Cổng Bắc là hết đất an toàn.',
    packs: [], duhiep: null },
  tuongduong: { name:'Sapidae Chiefdom', min:1, range:'—', type:'safe', ground:'#d8ccb0', patch:'#7a6a4a',
    spawn:{ x:1300, y:1100 }, spawnFrom:{ ngoai:{ x:1300, y:1460 }, daohoa:{ x:640, y:905 }, chungnam:{ x:1960, y:905 }, tuyettinh:{ x:1300, y:510 } }, city:true, trees:24, rocks:10,
    desc:'Cả khu phố Ardhaven bị vết nứt kéo sang, dân bản địa dựng lại quanh nó thành Sapidae Chiefdom. Trong tường: Lò Rèn Hoàng Gia, Tiệm Thuốc, Vũ Khí Phường, Trà Quán, Sảnh Cầu May và Truy Nã Lệnh. An toàn tuyệt đối — không Chimera nào vào được. Ra Cổng Nam để săn ở Outskirts.',
    packs: [], duhiep: null },
  ngoai: { name:'Beast Herd Camp', min:10, range:'14 - 24', type:'safe', ground:'#ddd2ae', patch:'#7a7048',
    spawn:{ x:1300, y:330 }, trees:56, rocks:22, herbs:true,
    // Câu đầu vốn nằm ở REGION_UNLOCK_LORE.ngoai và chỉ hiện ĐÚNG MỘT LẦN lúc mở khoá vùng.
    // Dòng người chơi đọc mỗi lần mở Bản Đồ lại là dòng "đất an toàn để luyện cấp" — tức là
    // vùng đầu tiên báo hiệu chuỗi năm trụ bị giới thiệu như một bãi cỏ giữa hai nhiệm vụ.
    desc:'Đất ngoài thành đang rung — chưa phải trụ, nhưng là dấu hiệu đầu tiên rằng có trụ đang lung lay. Trại Gloam chặn đường, bầy Gai Tím rình rập ven rừng. Không PK, đất an toàn để luyện cấp.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    // Rải theo GRADIENT KHOẢNG CÁCH: sát cổng thành là bậc thấp nhất, càng ra xa bậc càng
    // cao, góc xa nhất là elite — cùng nguyên lý bố trí đồng cỏ quanh thị trấn khởi đầu.
    // Bộ quái RIÊNG của vùng này (bậc 14-24), không dùng lại bộ lv1-12 của Plant Tribe Glade.
    voi: 1407,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'boar_tusk', ten:'Bãi Heo Nhiễm Khí', dai:[0.12,0.485], cung:[3,108], cum:[2,2],
        dan:[{ mob:'boar_tusk', n:12 }] },   // C14 · Heo Rừng Nhiễm Khí
      { id:'wolf_alpha', ten:'Đất Đầu Đàn', dai:[0.515,0.605], cung:[17,196], cum:[2,2],
        dan:[{ mob:'wolf_alpha', n:13 }] },   // C16 · Gai Tím Đầu Đàn
      { id:'bandit_vet', ten:'Chốt Cựu Binh Gloam', dai:[0.635,0.685], cung:[89,141], cum:[1,1],
        dan:[{ mob:'bandit_vet', n:7, vai:['xa'] }] },   // C18 · Gloam Cựu Binh
      { id:'caodo_fire', ten:'Vạt Cỏ Bén Lửa', dai:[0.715,0.815], cung:[24,76], cum:[1,1],
        dan:[{ mob:'caodo_fire', n:6 }] },   // C20 · Cỏ Dại Bén Lửa
      { id:'gloam_scout', ten:'Vọng Gác Gloam', dai:[0.845,0.945], cung:[38,90], cum:[1,1],
        dan:[{ mob:'gloam_scout', n:1 }] },   // C22 · Trinh Sát Gloam
      { id:'chimera_bo', ten:'Bãi Tượng Vỡ Lệnh', dai:[0.975,1.0], cung:[94,146], cum:[1,1],
        dan:[{ mob:'chimera_bo', n:5 }] },   // C24 · Tượng Đá Vỡ Lệnh
    ], duhiep: null },
  chungnam: { name:'Werebear Woods', min:20, range:'24 - 38', type:'pk', ground:'#d4d0ac', patch:'#6a7a52',
    spawnFrom:{ comoc:{ x:1921, y:260 }, corran:{ x:2450, y:700 } }, spawn:{ x:400, y:1500 }, trees:80, rocks:34,
    desc:'Từ đây là đất PK — hạ người khác được, bị hạ cũng được. Chimera ở đây rơi Cốt bậc đầu.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    voi: 1836,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'chimera_bo', ten:'Bãi Tượng Vỡ Lệnh', dai:[0.12,0.345], cung:[-40,12], cum:[1,1], tiep:true,
        dan:[{ mob:'chimera_bo', n:6 }] },   // C24 · Tượng Đá Vỡ Lệnh
      { id:'phando', ten:'Nghĩa Địa Phản Loạn', dai:[0.375,0.585], cung:[-105,-23], cum:[2,2], tiep:true,
        dan:[{ mob:'phando', n:12, vai:['can','xa'] }] },   // C26 · Bộ Xương Phản Loạn
      { id:'xanu', ten:'Đầm Phun Độc', dai:[0.615,0.825], cung:[-36,16], cum:[2,2], tiep:true,
        dan:[{ mob:'xanu', n:12, vai:['can','phap'] }] },   // C31 · Chimera Phun Độc
      { id:'bandao', ten:'Dốc Sa Ngã', dai:[0.855,1.0], cung:[-55,-3], cum:[1,1], tiep:true,
        dan:[{ mob:'bandao', n:5, vai:['bay'] }] },   // C38 · Axie Sa Ngã
    ], duhiep:'duhiep1' },
  // ── RẺO RỪNG CORRAN — map dựng theo lối tranh mới, đang ở bước KIỂM HOẠT ẢNH ──
  // Cố ý để TRỐNG: `vung: []`, trees 0, rocks 0, không có trùm vùng. Mục đích là đi bộ khắp map
  // xem nhân vật có đọc ra là ĐỨNG TRÊN ĐẤT không, trước khi tốn công đặt bãi quái. Đặt quái và
  // vật cản là bước sau, khi hoạt ảnh đã duyệt.
  //
  // Vì sao là Corran: Người Gác Rừng Corran đã có sẵn trong game (NPC `daosi` ở Werebear Woods),
  // và dải cấp 38-42 đang TRỐNG giữa Werebear Woods (24-38) và Bug Tribe Tunnels (42-56) — nên
  // map này lấp một lỗ thật, không phải map thêm cho có.
  // == LOI MON CORRAN -- map dang LAN dau tien. Xem docs/DUONG_DI_VA_GOC_NHIN.md ==
  // Day la MAU THU co chu dich: hinh hoc sinh bang `tools/dung_lan.py`, con tranh nen thi muon
  // tam cua Reo Rung Corran keo dan -- XAU, va co tinh xau. Muc dich la tra loi mot cau truoc khi
  // dat bat ky tam art nao: di trong mot hanh lang co ra cam giac dung khong.
  //
  // Khac moi map cu o ba cho:
  //   - `w`/`h` rieng -- 6400x1400, nam man chieu ngang. Truoc day ca game chung mot kho.
  //   - `diTrong` la HANH LANG chu khong phai mat san -- san chi 33,9% kho map, va do la dung.
  //   - `vatDat` dat cay theo TOA DO, hai hang men mep duong. Hang duoi (y lon) ve DE len nguoi
  //     choi vi engine xep lop theo y -- do la thu cho cam giac dang o TRONG rung.
  //
  // Thang cap anh xa vao QUANG DUONG: C38 dau lan -> C42 giua -> C48 cuoi, roi trum o tan cung.
  // Di xa hon = quai nang hon, khong can mot dong chu nao giai thich.
  loimon: { name:'Lối Mòn Corran', min:40, range:'42 - 48', type:'pk', hinh:'hanhlang',
    w:6400, h:1400, ground:'#cfd2ae', patch:'#6a7a52',
    // SAN LAT VIEN: nen ghep tu hinh thoi 2:1 nuong bang tools/iso/nuong_tile.py, thay cho
    // tam tranh nen bg_loimon.jpg. Xem khoi "SAN LAT VIEN" trong game.js. Vung di duoc van la
    // dung `diTrong` ben duoi -- lat vien chi la chuyen VE, khong doi mot buoc chan nao.
    // `isoCay` de thap hon mac dinh vi `vatDat` ben duoi da dung san hai hang cay men mep loi.
    sanIso:true, isoCay:150,
    // Diem tha cach cong Tay 277px. Ban dau dat o x=200 -- chi 92px, ma ban kinh bat cong la 90:
    // nguoi choi vao map bang duong khac la bi hut nguoc ve Reo Rung Corran ngay lap tuc.
    spawnFrom:{ corran:{ x:330, y:779 } }, spawn:{ x:380, y:790 }, trees:0, rocks:0,
    desc:'Lối mòn men theo rẻo rừng, chạy mãi về đông. Cây khép hai bên, không có đường tắt.',
    voi: 6000,
    vung: [
      { id:'bandao', ten:'Khoảnh Đầu Lối', dai:[0.10,0.34], cung:[-10,10], cum:[2,2], tiep:true,
        dan:[{ mob:'bandao', n:10, vai:['can','xa'] }] },        // C38
      { id:'thinu', ten:'Khoảnh Giữa', dai:[0.40,0.64], cung:[-10,10], cum:[2,2], tiep:true,
        dan:[{ mob:'thinu', n:11, vai:['can','phap'] }] },       // C42
      { id:'mocnhan', ten:'Khoảnh Cuối Lối', dai:[0.70,0.95], cung:[-10,10], cum:[2,2], tiep:true,
        dan:[{ mob:'mocnhan', n:11 }] },                          // C48
    ],
    diTrong: [
      [60,465], [260,514], [460,557], [660,590], [860,612], [1060,620],
      [1260,613], [1460,592], [1660,571], [1860,586], [2060,518], [2260,419],
      [2460,371], [2660,331], [2860,301], [3060,284], [3260,281], [3460,292],
      [3660,320], [3860,413], [4060,462], [4260,454], [4460,498], [4660,543],
      [4860,580], [5060,606], [5260,619], [5460,617], [5660,601], [5860,571],
      [6060,532], [6260,485], [6340,465], [6340,965], [6260,985], [6060,1032],
      [5860,1071], [5660,1101], [5460,1117], [5260,1119], [5060,1106], [4860,1080],
      [4660,1043], [4460,998], [4260,943], [4060,836], [3860,795], [3660,815],
      [3460,792], [3260,781], [3060,784], [2860,801], [2660,831], [2460,871],
      [2260,918], [2060,919], [1860,947], [1660,1047], [1460,1092], [1260,1113],
      [1060,1120], [860,1112], [660,1090], [460,1057], [260,1014], [60,965]
    ],
    vatDat: [
      { x:40, y:380, s:1.9 }, { x:40, y:1040, s:2.16 }, { x:145, y:406, s:2.13 }, { x:145, y:1066, s:2.39 }, { x:250, y:431, s:2.36 },
      { x:250, y:1091, s:2.62 }, { x:355, y:455, s:1.93 }, { x:355, y:1115, s:2.19 }, { x:460, y:477, s:2.16 }, { x:460, y:1137, s:2.42 },
      { x:565, y:496, s:2.38 }, { x:565, y:1156, s:2.64 }, { x:670, y:512, s:1.95 }, { x:670, y:1172, s:2.21 }, { x:775, y:525, s:2.18 },
      { x:775, y:1185, s:2.44 }, { x:880, y:534, s:2.4 }, { x:880, y:1194, s:2.66 }, { x:985, y:539, s:1.96 }, { x:985, y:1199, s:2.22 },
      { x:1090, y:540, s:2.18 }, { x:1090, y:1200, s:2.44 }, { x:1195, y:537, s:2.4 }, { x:1195, y:1197, s:2.66 }, { x:1300, y:530, s:1.96 },
      { x:1300, y:1190, s:2.22 }, { x:1405, y:519, s:2.17 }, { x:1405, y:1179, s:2.43 }, { x:1510, y:505, s:2.39 }, { x:1510, y:1165, s:2.65 },
      { x:1615, y:491, s:1.94 }, { x:1615, y:1144, s:2.2 }, { x:1720, y:497, s:2.17 }, { x:1720, y:1098, s:2.4 }, { x:1825, y:507, s:2.39 },
      { x:1825, y:1042, s:2.6 }, { x:1930, y:495, s:1.94 }, { x:1930, y:1005, s:2.14 }, { x:2035, y:451, s:2.15 }, { x:2035, y:998, s:2.36 },
      { x:2140, y:391, s:2.34 }, { x:2140, y:1005, s:2.58 }, { x:2245, y:343, s:1.88 }, { x:2245, y:1001, s:2.14 }, { x:2350, y:317, s:2.09 },
      { x:2350, y:977, s:2.35 }, { x:2455, y:292, s:2.3 }, { x:2455, y:952, s:2.56 }, { x:2560, y:270, s:1.86 }, { x:2560, y:930, s:2.12 },
      { x:2665, y:250, s:2.07 }, { x:2665, y:910, s:2.33 }, { x:2770, y:233, s:2.28 }, { x:2770, y:893, s:2.54 }, { x:2875, y:219, s:1.84 },
      { x:2875, y:879, s:2.1 }, { x:2980, y:209, s:2.05 }, { x:2980, y:869, s:2.31 }, { x:3085, y:202, s:2.27 }, { x:3085, y:862, s:2.53 },
      { x:3190, y:200, s:1.83 }, { x:3190, y:860, s:2.09 }, { x:3295, y:202, s:2.05 }, { x:3295, y:862, s:2.31 }, { x:3400, y:207, s:2.27 },
      { x:3400, y:867, s:2.53 }, { x:3505, y:217, s:1.84 }, { x:3505, y:877, s:2.09 }, { x:3610, y:230, s:2.06 }, { x:3610, y:890, s:2.32 },
      { x:3715, y:260, s:2.29 }, { x:3715, y:893, s:2.54 }, { x:3820, y:313, s:1.87 }, { x:3820, y:879, s:2.1 }, { x:3925, y:360, s:2.11 },
      { x:3925, y:876, s:2.31 }, { x:4030, y:381, s:2.34 }, { x:4030, y:903, s:2.54 }, { x:4135, y:378, s:1.9 }, { x:4135, y:957, s:2.13 },
      { x:4240, y:372, s:2.12 }, { x:4240, y:1014, s:2.37 }, { x:4345, y:390, s:2.34 }, { x:4345, y:1050, s:2.6 }, { x:4450, y:415, s:1.91 },
      { x:4450, y:1075, s:2.17 }, { x:4555, y:440, s:2.14 }, { x:4555, y:1100, s:2.4 }, { x:4660, y:463, s:2.37 }, { x:4660, y:1123, s:2.63 },
      { x:4765, y:484, s:1.94 }, { x:4765, y:1144, s:2.2 }, { x:4870, y:502, s:2.17 }, { x:4870, y:1162, s:2.43 }, { x:4975, y:517, s:2.39 },
      { x:4975, y:1177, s:2.65 }, { x:5080, y:528, s:1.96 }, { x:5080, y:1188, s:2.22 }, { x:5185, y:536, s:2.18 }, { x:5185, y:1196, s:2.44 },
      { x:5290, y:540, s:2.4 }, { x:5290, y:1200, s:2.66 }, { x:5395, y:539, s:1.96 }, { x:5395, y:1199, s:2.22 }, { x:5500, y:535, s:2.18 },
      { x:5500, y:1195, s:2.44 }, { x:5605, y:527, s:2.4 }, { x:5605, y:1187, s:2.66 }, { x:5710, y:515, s:1.95 }, { x:5710, y:1175, s:2.21 },
      { x:5815, y:499, s:2.17 }, { x:5815, y:1159, s:2.43 }, { x:5920, y:480, s:2.38 }, { x:5920, y:1140, s:2.64 }, { x:6025, y:459, s:1.93 },
      { x:6025, y:1119, s:2.19 }, { x:6130, y:436, s:2.14 }, { x:6130, y:1096, s:2.4 }, { x:6235, y:411, s:2.35 }, { x:6235, y:1071, s:2.61 },
      { x:6340, y:385, s:1.9 }, { x:6340, y:1045, s:2.16 }, { x:92, y:243, s:1.85 }, { x:92, y:1203, s:2.22 }, { x:197, y:269, s:2.08 },
      { x:197, y:1229, s:2.45 }, { x:302, y:293, s:2.31 }, { x:302, y:1253, s:2.68 }, { x:407, y:316, s:1.87 }, { x:407, y:1276, s:2.25 },
      { x:512, y:336, s:2.1 }, { x:512, y:1296, s:2.48 }, { x:617, y:354, s:2.33 }, { x:617, y:1314, s:2.71 }, { x:722, y:369, s:1.89 },
      { x:722, y:1329, s:2.27 }, { x:827, y:380, s:2.12 }, { x:827, y:1340, s:2.5 }, { x:932, y:387, s:2.34 }, { x:932, y:1347, s:2.72 },
      { x:1037, y:390, s:1.9 }, { x:1037, y:1350, s:2.28 }, { x:1142, y:389, s:2.12 }, { x:1142, y:1349, s:2.5 }, { x:1247, y:384, s:2.34 },
      { x:1247, y:1344, s:2.72 }, { x:1352, y:375, s:1.9 }, { x:1352, y:1335, s:2.27 }, { x:1457, y:363, s:2.11 }, { x:1457, y:1323, s:2.49 },
      { x:1562, y:347, s:2.33 }, { x:1562, y:1307, s:2.7 }, { x:1667, y:341, s:1.88 }, { x:1667, y:1274, s:2.25 }, { x:1772, y:353, s:2.11 },
      { x:1772, y:1219, s:2.45 }, { x:1877, y:355, s:2.33 }, { x:1877, y:1170, s:2.65 }, { x:1982, y:327, s:1.88 }, { x:1982, y:1148, s:2.2 },
      { x:2087, y:272, s:2.08 }, { x:2087, y:1151, s:2.42 }, { x:2192, y:214, s:2.27 }, { x:2192, y:1156, s:2.64 }, { x:2297, y:179, s:1.82 },
      { x:2297, y:1139, s:2.2 }, { x:2402, y:154, s:2.03 }, { x:2402, y:1114, s:2.41 }, { x:2507, y:131, s:2.24 }, { x:2507, y:1091, s:2.62 },
      { x:2612, y:110, s:1.79 }, { x:2612, y:1070, s:2.17 }, { x:2717, y:91, s:2.01 }, { x:2717, y:1051, s:2.38 }, { x:2822, y:76, s:2.22 },
      { x:2822, y:1036, s:2.6 }, { x:2927, y:64, s:1.77 }, { x:2927, y:1024, s:2.15 }, { x:3032, y:55, s:1.99 }, { x:3032, y:1015, s:2.37 },
      { x:3137, y:51, s:2.21 }, { x:3137, y:1011, s:2.59 }, { x:3242, y:50, s:1.77 }, { x:3242, y:1010, s:2.15 }, { x:3347, y:54, s:1.99 },
      { x:3347, y:1014, s:2.37 }, { x:3452, y:62, s:2.21 }, { x:3452, y:1022, s:2.59 }, { x:3557, y:73, s:1.78 }, { x:3557, y:1033, s:2.16 },
      { x:3662, y:91, s:2.01 }, { x:3662, y:1045, s:2.38 }, { x:3767, y:135, s:2.24 }, { x:3767, y:1037, s:2.6 }, { x:3872, y:189, s:1.82 },
      { x:3872, y:1025, s:2.15 }, { x:3977, y:225, s:2.06 }, { x:3977, y:1035, s:2.38 }, { x:4082, y:232, s:2.28 }, { x:4082, y:1077, s:2.61 },
      { x:4187, y:224, s:1.84 }, { x:4187, y:1137, s:2.2 }, { x:4292, y:228, s:2.06 }, { x:4292, y:1185, s:2.44 }, { x:4397, y:252, s:2.29 },
      { x:4397, y:1212, s:2.67 }, { x:4502, y:278, s:1.86 }, { x:4502, y:1238, s:2.24 }, { x:4607, y:302, s:2.09 }, { x:4607, y:1262, s:2.47 },
      { x:4712, y:324, s:2.32 }, { x:4712, y:1284, s:2.69 }, { x:4817, y:343, s:1.88 }, { x:4817, y:1303, s:2.26 }, { x:4922, y:360, s:2.11 },
      { x:4922, y:1320, s:2.49 }, { x:5027, y:373, s:2.34 }, { x:5027, y:1333, s:2.71 }, { x:5132, y:383, s:1.9 }, { x:5132, y:1343, s:2.28 },
      { x:5237, y:388, s:2.12 }, { x:5237, y:1348, s:2.5 }, { x:5342, y:390, s:2.34 }, { x:5342, y:1350, s:2.72 }, { x:5447, y:388, s:1.9 },
      { x:5447, y:1348, s:2.28 }, { x:5552, y:381, s:2.12 }, { x:5552, y:1341, s:2.5 }, { x:5657, y:371, s:2.34 }, { x:5657, y:1331, s:2.71 },
      { x:5762, y:357, s:1.89 }, { x:5762, y:1317, s:2.27 }, { x:5867, y:340, s:2.1 }, { x:5867, y:1300, s:2.48 }, { x:5972, y:320, s:2.32 },
      { x:5972, y:1280, s:2.69 }, { x:6077, y:298, s:1.87 }, { x:6077, y:1258, s:2.24 }, { x:6182, y:274, s:2.08 }, { x:6182, y:1234, s:2.45 },
      { x:6287, y:248, s:2.29 }, { x:6287, y:1208, s:2.66 }, { x:40, y:80, s:1.78 }, { x:40, y:1340, s:2.28 }, { x:145, y:106, s:2.01 },
      { x:250, y:131, s:2.24 }, { x:355, y:155, s:1.81 }, { x:460, y:177, s:2.04 }, { x:565, y:196, s:2.27 }, { x:670, y:212, s:1.83 },
      { x:775, y:225, s:2.06 }, { x:880, y:234, s:2.28 }, { x:985, y:239, s:1.84 }, { x:1090, y:240, s:2.06 }, { x:1195, y:237, s:2.28 },
      { x:1300, y:230, s:1.84 }, { x:1405, y:219, s:2.06 }, { x:1510, y:205, s:2.27 }, { x:1615, y:191, s:1.82 }, { x:1720, y:197, s:2.05 },
      { x:1825, y:207, s:2.27 }, { x:1825, y:1342, s:2.72 }, { x:1930, y:195, s:1.83 }, { x:1930, y:1305, s:2.26 }, { x:2035, y:151, s:2.03 },
      { x:2035, y:1298, s:2.48 }, { x:2140, y:91, s:2.23 }, { x:2140, y:1305, s:2.7 }, { x:2245, y:43, s:1.77 }, { x:2245, y:1301, s:2.26 },
      { x:2350, y:1277, s:2.47 }, { x:2455, y:1252, s:2.68 }, { x:2560, y:1230, s:2.23 }, { x:2665, y:1210, s:2.45 }, { x:2770, y:1193, s:2.66 },
      { x:2875, y:1179, s:2.21 }, { x:2980, y:1169, s:2.43 }, { x:3085, y:1162, s:2.65 }, { x:3190, y:1160, s:2.21 }, { x:3295, y:1162, s:2.43 },
      { x:3400, y:1167, s:2.65 }, { x:3505, y:1177, s:2.21 }, { x:3610, y:1190, s:2.44 }, { x:3715, y:1193, s:2.66 }, { x:3820, y:1179, s:2.21 },
      { x:3925, y:60, s:1.99 }, { x:3925, y:1176, s:2.43 }, { x:4030, y:81, s:2.22 }, { x:4030, y:1203, s:2.66 }, { x:4135, y:78, s:1.78 },
      { x:4135, y:1257, s:2.24 }, { x:4240, y:72, s:2.0 }, { x:4240, y:1314, s:2.49 }, { x:4345, y:90, s:2.23 }, { x:4345, y:1350, s:2.72 },
      { x:4450, y:115, s:1.8 }, { x:4555, y:140, s:2.03 }, { x:4660, y:163, s:2.25 }, { x:4765, y:184, s:1.82 }, { x:4870, y:202, s:2.05 },
      { x:4975, y:217, s:2.28 }, { x:5080, y:228, s:1.84 }, { x:5185, y:236, s:2.06 }, { x:5290, y:240, s:2.28 }, { x:5395, y:239, s:1.84 },
      { x:5500, y:235, s:2.06 }, { x:5605, y:227, s:2.28 }, { x:5710, y:215, s:1.83 }, { x:5815, y:199, s:2.05 }, { x:5920, y:180, s:2.26 },
      { x:6025, y:159, s:1.81 }, { x:6130, y:136, s:2.02 }, { x:6235, y:111, s:2.23 }, { x:6340, y:85, s:1.78 }, { x:6340, y:1345, s:2.28 },
    ],
    duhiep:'duhiep2' },
  corran: { name:'Rẻo Rừng Corran', min:36, range:'38 - 42', type:'pk', ground:'#cfd2ae', patch:'#6a7a52',
    spawnFrom:{ chungnam:{ x:330, y:700 }, loimon:{ x:2550, y:620 } }, spawn:{ x:300, y:760 }, trees:34, rocks:18,
    desc:'Khoảnh rừng Corran giữ riêng, ngoài tầm bầy Werebear. Ông ấy không nói vì sao lại giữ.',
    voi: 1700,
    // Dải 38-42 bắc cầu giữa Werebear Woods (kết ở C38 `bandao`) và Bug Tribe Tunnels (mở ở
    // C42 `thinu`) — dùng lại đúng hai loài ấy nên người chơi đi qua thấy liền mạch, không
    // gặp loài lạ chen ngang giữa hai vùng.
    vung: [
      { id:'bandao', ten:'Dốc Corran Giữ', dai:[0.14,0.40], cung:[-30,45], cum:[2,2], tiep:true,
        dan:[{ mob:'bandao', n:10, vai:['can','xa'] }] },        // C38 · Axie Sa Ngã
      { id:'mocnhan', ten:'Vạt Golem Ngủ', dai:[0.44,0.70], cung:[10,85], cum:[2,2], tiep:true,
        dan:[{ mob:'mocnhan', n:10, vai:['can','phap'] }] },     // C48 · Axie Golem
      { id:'thinu', ten:'Ổ Bỏ Lại', dai:[0.74,1.0], cung:[-15,60], cum:[2,2], tiep:true,
        dan:[{ mob:'thinu', n:11 }] },                            // C42 · Oan Hồn Ổ Ấp
    ], duhiep:'duhiep2' },
  comoc: { name:'Bug Tribe Tunnels', min:40, range:'42 - 56', type:'pk', ground:'#a89f86', patch:'#4a4436',
    spawnFrom:{ chungnam:{ x:260, y:1366 }, mongco:{ x:1369, y:260 } }, spawn:{ x:400, y:400 }, dark:true, trees:30, rocks:46,
    desc:'Hang ổ hẹp, ngoằn ngoèo. Bầy Chimera dày đặc rơi nguyên liệu thăng giai Thú Chiến — bãi săn tranh chấp.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    voi: 1789,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'thinu', ten:'Ổ Ấp Bỏ Hoang', dai:[0.12,0.465], cung:[-11,89], cum:[2,2], tiep:true,
        dan:[{ mob:'thinu', n:14, vai:['can','phap'] }] },   // C42 · Oan Hồn Ổ Ấp
      { id:'mocnhan', ten:'Cánh Đồng Golem', dai:[0.495,0.735], cung:[21,97], cum:[2,2], tiep:true,
        dan:[{ mob:'mocnhan', n:10, vai:['can','xa'] }] },   // C48 · Axie Golem
      { id:'huyetbat', ten:'Hang Dơi Chimera', dai:[0.765,1.0], cung:[-10,50], cum:[2,2], tiep:true,
        dan:[{ mob:'huyetbat', n:13 }] },   // C56 · Dơi Chimera
    ], duhiep:'duhiep2' },
  tuyettinh: { name:'Bird Tribe Heights', min:60, range:'62 - 78', type:'pk', ground:'#ddc9a8', patch:'#8a5a6a',
    spawn:{ x:400, y:950 }, trees:60, rocks:24,
    desc:'Bãi EXP khổng lồ. Mang theo kháng độc — Chimera ở đây cắn có nọc.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    voi: 1759,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'ttdetu', ten:'Trại Cuồng Tín', dai:[0.12,0.445], cung:[0,79], cum:[2,2], tiep:true,
        dan:[{ mob:'ttdetu', n:14, vai:['can','nang'] }] },   // C62 · Kẻ Cuồng Tín Lạc Lối
      { id:'docyeu', ten:'Bãi Cầu Gai', dai:[0.475,0.705], cung:[-52,15], cum:[2,2], tiep:true,
        dan:[{ mob:'docyeu', n:12, vai:['can','phap'] }] },   // C70 · Chimera Cầu Gai
      { id:'satthuhy', ten:'Rẻo Sương Mù', dai:[0.735,1.0], cung:[-33,35], cum:[2,2], tiep:true,
        dan:[{ mob:'satthuhy', n:10, vai:['bay','xa'] }] },   // C78 · Sát Thủ Sương Mù
    ], duhiep:'duhiep2' },
  mongco: { name:'Reptile Sunstone Flats', min:80, range:'84 - 100', type:'pk', ground:'#cfc09a', patch:'#7a6a42',
    spawnFrom:{ tuyettinh:{ x:1139, y:260 }, nhanmon:{ x:2340, y:678 } }, spawnFrom:{ comoc:{ x:260, y:1286 }, nhanmon:{ x:2340, y:582 } }, spawn:{ x:400, y:950 }, trees:36, rocks:30,
    desc:'Thảo nguyên mở rộng, Chimera trâu bò đánh đau. Rơi nguyên liệu nâng chiêu tầm xa và đao pháp.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    voi: 1736,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'thamtu', ten:'Vành Đai Trinh Sát', dai:[0.12,0.425], cung:[-102,75], cum:[2,2], tiep:true,
        dan:[{ mob:'thamtu', n:14, vai:['can','phap'] }] },   // C84 · Trinh Sát Tro Tàn
      { id:'cungthu', ten:'Trường Bắn Tro Tàn', dai:[0.455,0.735], cung:[-49,20], cum:[2,2], tiep:true,
        dan:[{ mob:'cungthu', n:12 }] },   // C92 · Cung Thủ Tro Tàn
      { id:'kybinh', ten:'Bãi Ngựa Tro Tàn', dai:[0.765,1.0], cung:[-30,35], cum:[2,2], tiep:true,
        dan:[{ mob:'kybinh', n:10, vai:['can','bay'] }] },   // C100 · Kỵ Sĩ Tro Tàn
    ], duhiep:'duhiep3' },
  nhanmon: { name:'Dusk Marsh', min:100, range:'102 - 120', type:'freepk', ground:'#b8a68a', patch:'#6a3a2a',
    spawnFrom:{ mongco:{ x:1668, y:260 } }, spawn:{ x:400, y:950 }, trees:44, rocks:38,
    desc:'Bãi luyện cuối game, ngoài biên ải Lunacia. PK ở đây không cộng Tai Tiếng. Chimera rơi trang bị bậc vàng.',
    // Xếp theo vòng từ spawn ra — xem ghi chú ở daohoa
    voi: 1856,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'cuongbinh', ten:'Doanh Trại Cuồng Binh', dai:[0.12,0.495], cung:[-36,74], cum:[2,2], tiep:true,
        dan:[{ mob:'cuongbinh', n:14, vai:['nang','phap'] }] },   // C102 · Cuồng Binh Tro Tàn
      { id:'kylan', ten:'Chuồng Chó Ngao', dai:[0.525,0.765], cung:[0,52], cum:[2,2], tiep:true,
        dan:[{ mob:'kylan', n:10, vai:['can','bay'] }] },   // C112 · Chó Ngao Lửa
      { id:'daokhach', ten:'Mắt Bão', dai:[0.795,1.0], cung:[-33,23], cum:[2,2], tiep:true,
        dan:[{ mob:'daokhach', n:10, vai:['can','xa'] }] },   // C120 · Axie Cuồng Bão
    ], duhiep:'duhiep3' },
  // ---------- PHÓ BẢN: ĐÃ GỠ ----------
  // Bảy map pb_* đã xoá — xem CLAUDE.md · CHẨN ĐOÁN GỐC. Bảy cửa nhưng chung MỘT địa hình:
  // cả bảy cùng spawn 1300,1560 · cùng cửa ra 1300,1660 · cùng packs:[] · cùng duhiep:null,
  // chỉ khác hai mã màu và số cây/đá. Tầng map sẽ dựng lại từ đầu ở phần đo map.

  // ══ LỐI MÒN SÂU — tầng phó bản đầu tiên dựng trên KHUÔN HÀNH LANG ══
  //
  // Bảy phó bản cũ là "một địa hình dùng bảy lần": một cái sân trống, ba đợt quái rơi xuống giữa
  // sân, hạ xong thì trùm rơi xuống đúng chỗ ấy. Chẩn đoán ở CLAUDE.md nói rõ chữa bằng cách
  // thêm map thứ tám là làm bệnh nặng thêm. Nên phòng này KHÔNG phải map thứ tám: nó là map đầu
  // tiên đúc từ một cái KHUÔN, và khuôn ấy đẻ ra được cái tiếp theo mà không cần chép lại gì.
  //
  // Vì sao là hành lang. Map đồng trống để người chơi tản ra mọi hướng, nên NHỊP do người chơi
  // đặt; hành lang chỉ có một đường tiến, nên nhịp do MAP đặt — đi tới, gặp đợt, dọn xong cửa mới
  // mở. Đó đúng là nhịp máy phó bản đang chờ, và ở đây nó là HÌNH DẠNG chứ không phải một luật
  // viết thêm. Ba đoạn ↔ ba đợt ↔ hai cửa, một-đổi-một.
  //
  // Cửa đá đặt ĐÚNG hai nút thắt của khuôn làn. Nút thắt vốn sinh ra để chia làn thành khoảnh mà
  // không cần một dòng chữ nào — mà chỗ hành lang thắt lại cũng đúng là chỗ duy nhất đặt được
  // một cánh cửa cho ra hồn. Cửa không phải thứ dán thêm vào map; nó mọc ra từ hình học đã có.
  //
  // ⚠ TỈ LỆ GIỮ ĐÚNG BẰNG MAP CHA: 6400 dài, lối 500px, chỗ thắt 350px — dài:ngang 13,4:1. Bản
  //   đầu tôi để 5600×1300 lối 530px, nghe chỉ là "gọn lại một chút", đo ra thì tỉ lệ tụt còn
  //   11,0:1. Chính cái tỉ lệ ấy làm nên hành lang: nới ngang ra và cắt dài đi thì nó trượt dần
  //   về phía đồng trống, tức về đúng cái hình việc này sinh ra để tránh. Phó bản khác map cha ở
  //   ĐƯỜNG ĐI (tim uốn khác, nút thắt chỗ khác), không khác ở tỉ lệ.
  //
  // ⚠ SINH RA, ĐỪNG SỬA TAY. Cả `dgnKhuon` · `diTrong` · `vatDat` bên dưới đều in ra bằng
  //   `python3 tools/iso/lan_phoban.py`. Sửa hình thì sửa bộ số ở đầu tệp ấy rồi chạy lại và dán
  //   đè — chỉnh tay một con số ở đây là tường, khe cửa, tâm đợt quái và mép đa giác lệch nhau.
  //   Tệp ấy tự đo lấy mọi ràng buộc `tests/test_sandat.js` sẽ soi, nên chạy nó rẻ hơn chạy bài.
  //
  // Không cần một tấm tranh nền nào: `sanIso` lát nền bằng bộ tile hình thoi, đúng như Lối Mòn
  // Corran. Bảy tấm nền của bảy phòng cũ đã gỡ, và tầng dựng lại không xin lại tấm nào.
  //
  // điểm thả: (240,752)
  // cổng Xuất Môn: (430,791)
  // đoạn 1: tâm (1118,886)
  // đoạn 2: tâm (3232,605)
  // đoạn 3: tâm (5314,645)
  // tường 1: x=2176 dày 60 · phủ y 522..1115 · khe y 743..893 (150px)
  // tường 2: x=4288 dày 60 · phủ y 211..804 · khe y 433..583 (150px)
  // chỗ thắt nhất: 350px
  // đa giác 66 đỉnh · sàn 34.0% khổ map 6400x1400
  pb_loimon: { name:'Lối Mòn Sâu', min:46, range:'46 - 52', type:'dungeon', hinh:'hanhlang',
    w:6400, h:1400, ground:'#cfd2ae', patch:'#6a7a52',
    sanIso:true, isoCay:150, dungeon:true, trees:0, rocks:0,
    spawn:{ x:240, y:752 },
    desc:'Một nhánh rẽ khỏi lối mòn, ăn sâu vào chỗ rừng khép hẳn. Hai bận đường thắt lại, và ở mỗi bận có một cánh cửa đá người ta dựng để nhốt thứ gì đó phía trong.',
    dgnKhuon: {
      truc:'x', huong:'sang phía Đông',
      phong: [ { cx:1118, cy:886 }, { cx:3232, cy:605 }, { cx:5314, cy:645 } ],
      tuong: [
        { t:2176, d:60, a:522, b:1115, k0:743, k1:893 },
        { t:4288, d:60, a:211, b:804, k0:433, k1:583 },
      ],
    },
    diTrong: [
      [60,463], [260,506], [460,547], [660,582], [860,611], [1060,632],
      [1260,643], [1460,644], [1660,636], [1860,618], [2060,645], [2260,621],
      [2460,522], [2660,477], [2860,433], [3060,390], [3260,350], [3460,315],
      [3660,287], [3860,267], [4060,271], [4260,330], [4460,298], [4660,284],
      [4860,311], [5060,345], [5260,384], [5460,427], [5660,471], [5860,514],
      [6060,553], [6260,588], [6340,600], [6340,1100], [6260,1088], [6060,1053],
      [5860,1014], [5660,971], [5460,927], [5260,884], [5060,845], [4860,811],
      [4660,784], [4460,732], [4260,682], [4060,742], [3860,767], [3660,787],
      [3460,815], [3260,850], [3060,890], [2860,933], [2660,977], [2460,1017],
      [2260,996], [2060,1039], [1860,1118], [1660,1136], [1460,1144], [1260,1143],
      [1060,1132], [860,1111], [660,1082], [460,1047], [260,1006], [60,963]
    ],
    vatDat: [
      { x:40, y:379, s:1.9 }, { x:40, y:1039, s:2.16 }, { x:145, y:402, s:2.13 }, { x:145, y:1062, s:2.39 }, { x:250, y:424, s:2.36 },
      { x:250, y:1084, s:2.62 }, { x:355, y:446, s:1.93 }, { x:355, y:1106, s:2.18 }, { x:460, y:467, s:2.15 }, { x:460, y:1127, s:2.41 },
      { x:565, y:486, s:2.38 }, { x:565, y:1146, s:2.64 }, { x:670, y:504, s:1.95 }, { x:670, y:1164, s:2.21 }, { x:775, y:520, s:2.17 },
      { x:775, y:1180, s:2.43 }, { x:880, y:533, s:2.4 }, { x:880, y:1193, s:2.66 }, { x:985, y:545, s:1.96 }, { x:985, y:1205, s:2.22 },
      { x:1090, y:554, s:2.19 }, { x:1090, y:1214, s:2.45 }, { x:1195, y:560, s:2.41 }, { x:1195, y:1220, s:2.67 }, { x:1300, y:564, s:1.97 },
      { x:1300, y:1224, s:2.23 }, { x:1405, y:565, s:2.19 }, { x:1405, y:1225, s:2.45 }, { x:1510, y:563, s:2.41 }, { x:1510, y:1223, s:2.67 },
      { x:1615, y:559, s:1.97 }, { x:1615, y:1219, s:2.23 }, { x:1720, y:552, s:2.19 }, { x:1720, y:1212, s:2.45 }, { x:1825, y:542, s:2.4 },
      { x:1825, y:1202, s:2.66 }, { x:1930, y:540, s:1.96 }, { x:1930, y:1181, s:2.21 }, { x:2035, y:560, s:2.19 }, { x:2035, y:1131, s:2.41 },
      { x:2140, y:572, s:2.41 }, { x:2140, y:1087, s:2.62 }, { x:2245, y:548, s:1.97 }, { x:2245, y:1075, s:2.17 }, { x:2350, y:494, s:2.16 },
      { x:2350, y:1089, s:2.4 }, { x:2455, y:443, s:2.36 }, { x:2455, y:1097, s:2.62 }, { x:2560, y:418, s:1.91 }, { x:2560, y:1078, s:2.17 },
      { x:2665, y:396, s:2.13 }, { x:2665, y:1056, s:2.38 }, { x:2770, y:373, s:2.34 }, { x:2770, y:1033, s:2.6 }, { x:2875, y:350, s:1.89 },
      { x:2875, y:1010, s:2.15 }, { x:2980, y:327, s:2.1 }, { x:2980, y:987, s:2.36 }, { x:3085, y:305, s:2.31 }, { x:3085, y:965, s:2.57 },
      { x:3190, y:283, s:1.86 }, { x:3190, y:943, s:2.12 }, { x:3295, y:263, s:2.07 }, { x:3295, y:923, s:2.33 }, { x:3400, y:245, s:2.29 },
      { x:3400, y:905, s:2.55 }, { x:3505, y:228, s:1.84 }, { x:3505, y:888, s:2.1 }, { x:3610, y:213, s:2.05 }, { x:3610, y:873, s:2.31 },
      { x:3715, y:201, s:2.27 }, { x:3715, y:861, s:2.53 }, { x:3820, y:190, s:1.82 }, { x:3820, y:850, s:2.08 }, { x:3925, y:183, s:2.04 },
      { x:3925, y:843, s:2.3 }, { x:4030, y:184, s:2.26 }, { x:4030, y:831, s:2.52 }, { x:4135, y:215, s:1.83 }, { x:4135, y:795, s:2.06 },
      { x:4240, y:246, s:2.07 }, { x:4240, y:765, s:2.27 }, { x:4345, y:248, s:2.29 }, { x:4345, y:769, s:2.49 }, { x:4450, y:221, s:1.84 },
      { x:4450, y:808, s:2.07 }, { x:4555, y:198, s:2.05 }, { x:4555, y:848, s:2.3 }, { x:4660, y:204, s:2.27 }, { x:4660, y:864, s:2.53 },
      { x:4765, y:217, s:1.84 }, { x:4765, y:877, s:2.09 }, { x:4870, y:232, s:2.06 }, { x:4870, y:892, s:2.32 }, { x:4975, y:249, s:2.29 },
      { x:4975, y:909, s:2.55 }, { x:5080, y:268, s:1.86 }, { x:5080, y:928, s:2.11 }, { x:5185, y:289, s:2.08 }, { x:5185, y:949, s:2.34 },
      { x:5290, y:310, s:2.31 }, { x:5290, y:970, s:2.57 }, { x:5395, y:333, s:1.88 }, { x:5395, y:993, s:2.14 }, { x:5500, y:356, s:2.11 },
      { x:5500, y:1016, s:2.37 }, { x:5605, y:379, s:2.34 }, { x:5605, y:1039, s:2.6 }, { x:5710, y:402, s:1.91 }, { x:5710, y:1062, s:2.17 },
      { x:5815, y:424, s:2.14 }, { x:5815, y:1084, s:2.4 }, { x:5920, y:446, s:2.37 }, { x:5920, y:1106, s:2.62 }, { x:6025, y:467, s:1.93 },
      { x:6025, y:1127, s:2.19 }, { x:6130, y:486, s:2.16 }, { x:6130, y:1146, s:2.42 }, { x:6235, y:504, s:2.39 }, { x:6235, y:1164, s:2.65 },
      { x:6340, y:520, s:1.95 }, { x:6340, y:1180, s:2.21 }, { x:92, y:240, s:1.84 }, { x:92, y:1200, s:2.22 }, { x:197, y:263, s:2.07 },
      { x:197, y:1223, s:2.45 }, { x:302, y:285, s:2.3 }, { x:302, y:1245, s:2.68 }, { x:407, y:306, s:1.87 }, { x:407, y:1266, s:2.25 },
      { x:512, y:327, s:2.1 }, { x:512, y:1287, s:2.48 }, { x:617, y:345, s:2.33 }, { x:617, y:1305, s:2.7 }, { x:722, y:362, s:1.89 },
      { x:722, y:1322, s:2.27 }, { x:827, y:377, s:2.12 }, { x:827, y:1337, s:2.5 }, { x:932, y:389, s:2.34 }, { x:932, y:1349, s:2.72 },
      { x:1037, y:400, s:1.91 }, { x:1037, y:1360, s:2.28 }, { x:1142, y:407, s:2.13 }, { x:1247, y:412, s:2.35 }, { x:1352, y:415, s:1.91 },
      { x:1457, y:414, s:2.13 }, { x:1562, y:411, s:2.35 }, { x:1667, y:406, s:1.91 }, { x:1772, y:397, s:2.13 }, { x:1772, y:1357, s:2.5 },
      { x:1877, y:387, s:2.34 }, { x:1877, y:1346, s:2.72 }, { x:1982, y:398, s:1.91 }, { x:1982, y:1308, s:2.26 }, { x:2087, y:419, s:2.13 },
      { x:2087, y:1256, s:2.46 }, { x:2192, y:415, s:2.35 }, { x:2192, y:1226, s:2.67 }, { x:2297, y:373, s:1.9 }, { x:2297, y:1230, s:2.23 },
      { x:2402, y:316, s:2.09 }, { x:2402, y:1246, s:2.46 }, { x:2507, y:280, s:2.3 }, { x:2507, y:1240, s:2.68 }, { x:2612, y:257, s:1.85 },
      { x:2612, y:1217, s:2.23 }, { x:2717, y:234, s:2.06 }, { x:2717, y:1194, s:2.44 }, { x:2822, y:211, s:2.27 }, { x:2822, y:1171, s:2.65 },
      { x:2927, y:188, s:1.82 }, { x:2927, y:1148, s:2.2 }, { x:3032, y:166, s:2.04 }, { x:3032, y:1126, s:2.41 }, { x:3137, y:144, s:2.25 },
      { x:3137, y:1104, s:2.62 }, { x:3242, y:123, s:1.8 }, { x:3242, y:1083, s:2.18 }, { x:3347, y:104, s:2.01 }, { x:3347, y:1064, s:2.39 },
      { x:3452, y:86, s:2.22 }, { x:3452, y:1046, s:2.6 }, { x:3557, y:70, s:1.78 }, { x:3557, y:1030, s:2.15 }, { x:3662, y:57, s:1.99 },
      { x:3662, y:1017, s:2.37 }, { x:3767, y:45, s:2.21 }, { x:3767, y:1005, s:2.58 }, { x:3872, y:996, s:2.14 }, { x:3977, y:990, s:2.36 },
      { x:4082, y:47, s:2.21 }, { x:4082, y:965, s:2.57 }, { x:4187, y:83, s:1.78 }, { x:4187, y:927, s:2.11 }, { x:4292, y:102, s:2.01 },
      { x:4292, y:912, s:2.33 }, { x:4397, y:87, s:2.22 }, { x:4397, y:936, s:2.56 }, { x:4502, y:57, s:1.77 }, { x:4502, y:980, s:2.13 },
      { x:4607, y:48, s:1.99 }, { x:4607, y:1008, s:2.37 }, { x:4712, y:60, s:2.21 }, { x:4712, y:1020, s:2.59 }, { x:4817, y:74, s:1.78 },
      { x:4817, y:1034, s:2.16 }, { x:4922, y:91, s:2.01 }, { x:4922, y:1051, s:2.38 }, { x:5027, y:109, s:2.23 }, { x:5027, y:1069, s:2.61 },
      { x:5132, y:128, s:1.8 }, { x:5132, y:1088, s:2.18 }, { x:5237, y:149, s:2.03 }, { x:5237, y:1109, s:2.41 }, { x:5342, y:171, s:2.26 },
      { x:5342, y:1131, s:2.63 }, { x:5447, y:194, s:1.83 }, { x:5447, y:1154, s:2.2 }, { x:5552, y:217, s:2.06 }, { x:5552, y:1177, s:2.43 },
      { x:5657, y:240, s:2.28 }, { x:5657, y:1200, s:2.66 }, { x:5762, y:263, s:1.85 }, { x:5762, y:1223, s:2.23 }, { x:5867, y:285, s:2.08 },
      { x:5867, y:1245, s:2.46 }, { x:5972, y:306, s:2.31 }, { x:5972, y:1266, s:2.69 }, { x:6077, y:327, s:1.88 }, { x:6077, y:1287, s:2.26 },
      { x:6182, y:345, s:2.11 }, { x:6182, y:1305, s:2.48 }, { x:6287, y:362, s:2.33 }, { x:6287, y:1322, s:2.71 }, { x:40, y:79, s:1.78 },
      { x:40, y:1339, s:2.28 }, { x:145, y:102, s:2.01 }, { x:250, y:124, s:2.24 }, { x:355, y:146, s:1.81 }, { x:460, y:167, s:2.04 },
      { x:565, y:186, s:2.26 }, { x:670, y:204, s:1.83 }, { x:775, y:220, s:2.06 }, { x:880, y:233, s:2.28 }, { x:985, y:245, s:1.85 },
      { x:1090, y:254, s:2.07 }, { x:1195, y:260, s:2.29 }, { x:1300, y:264, s:1.85 }, { x:1405, y:265, s:2.07 }, { x:1510, y:263, s:2.29 },
      { x:1615, y:259, s:1.85 }, { x:1720, y:252, s:2.07 }, { x:1825, y:242, s:2.29 }, { x:1930, y:240, s:1.84 }, { x:2035, y:260, s:2.07 },
      { x:2140, y:272, s:2.3 }, { x:2245, y:248, s:1.85 }, { x:2350, y:194, s:2.05 }, { x:2455, y:143, s:2.25 }, { x:2560, y:118, s:1.8 },
      { x:2665, y:96, s:2.01 }, { x:2665, y:1356, s:2.5 }, { x:2770, y:73, s:2.22 }, { x:2770, y:1333, s:2.71 }, { x:2875, y:50, s:1.77 },
      { x:2875, y:1310, s:2.26 }, { x:2980, y:1287, s:2.48 }, { x:3085, y:1265, s:2.69 }, { x:3190, y:1243, s:2.24 }, { x:3295, y:1223, s:2.45 },
      { x:3400, y:1205, s:2.66 }, { x:3505, y:1188, s:2.22 }, { x:3610, y:1173, s:2.43 }, { x:3715, y:1161, s:2.65 }, { x:3820, y:1150, s:2.2 },
      { x:3925, y:1143, s:2.42 }, { x:4030, y:1131, s:2.63 }, { x:4135, y:1095, s:2.18 }, { x:4240, y:1065, s:2.39 }, { x:4345, y:1069, s:2.61 },
      { x:4450, y:1108, s:2.19 }, { x:4555, y:1148, s:2.42 }, { x:4660, y:1164, s:2.65 }, { x:4765, y:1177, s:2.21 }, { x:4870, y:1192, s:2.44 },
      { x:4975, y:1209, s:2.67 }, { x:5080, y:1228, s:2.23 }, { x:5185, y:1249, s:2.46 }, { x:5290, y:1270, s:2.69 }, { x:5395, y:1293, s:2.26 },
      { x:5500, y:56, s:1.99 }, { x:5500, y:1316, s:2.49 }, { x:5605, y:79, s:2.22 }, { x:5605, y:1339, s:2.72 }, { x:5710, y:102, s:1.79 },
      { x:5815, y:124, s:2.02 }, { x:5920, y:146, s:2.25 }, { x:6025, y:167, s:1.82 }, { x:6130, y:186, s:2.04 }, { x:6235, y:204, s:2.27 },
      { x:6340, y:220, s:1.84 },
    ],
    packs: [], duhiep: null },

  // Tầng Sâu TỰ ĐỨNG, không mượn địa hình phó bản nữa. Trước đây DEEP_MAP='pb_daohoa' nên
  // xoá phòng đầu là mất luôn 20 tầng — nay nó có map riêng, không ai gỡ nhầm được.
  // Không có cổng nào trỏ tới đây: chỉ vào bằng deepStart().
  deep: { name:'Tầng Sâu', min:1, range:'—', type:'dungeon', ground:'#6a6458', patch:'#241f1a',
    spawn:{ x:1300, y:1560 }, dungeon:true, dark:true, trees:10, rocks:40,
    desc:'Đường nứt Thủ Hộ Vaeldra không kịp bịt, ăn thẳng xuống dưới lớp đá nền. Càng xuống sâu khí Morvahn càng đặc, và không tầng nào giống tầng nào.',
    packs: [], duhiep: null },
};

// ═══════════ GDD Đợt 2 — A: ĐỊA HÌNH CẢN ĐƯỜNG + ẢI CẤP ═══════════
// Chỉ chặn địa hình LỚN (hồ/sông/núi/tường), đường đi để rộng; rect {x,y,wd,ht} hoặc ellipse {x,y,rx,ry}
window.MAP_OBSTACLES = {
  // ── RẺO RỪNG CORRAN — 62 vật cản SUY TỪ CHÍNH TRANH NỀN, không đặt tay ──
  // Sinh bằng `python3 tools/can_tu_tranh.py public/game/assets/maps/bg_corran.jpg corran`.
  // Sửa tranh thì chạy lại lệnh đó rồi dán đè, đừng sửa số ở đây bằng tay.
  //
  // Mỗi ellipse đặt ở CHÂN vệt chứ không trùm cả tán, và dẹt 2:1 — hai luật ấy là thứ làm nên
  // cảm giác isometric: đi ra SAU cây được, mà không đi XUYÊN gốc được. Xem đầu tệp công cụ.
  // Hai lớp vật liệu: 54 tán lá (ellipse ở chân) + 8 khối tối (CHỮ NHẬT trùm kín) — gốc cổ thụ,
  // tảng đá, dải nền tối ngoài khối đất. Thiếu lớp khối tối thì quái và người chơi đứng ngay
  // trên thân cây cổ thụ — lỗi thấy được trong ảnh chụp đợt đầu.
  // Khối tối chặn KÍN chứ không chặn mỗi chân, vì engine vẽ tranh nền trước rồi vẽ nhân vật đè
  // lên, không sắp lớp theo y: đứng "sau" gốc cổ thụ hiện ra y hệt đứng "trên" nó.
  //
  // ⚠ Còn một chỗ sai nhìn thấy được: cổng torii sơn đỏ bị lớp tán lá nhận nhầm, nên lòng cổng
  // bị chặn. Cổng ấy chỉ là vật trang trí, đi vòng được, nên tôi KHÔNG thêm phép đo thứ tư để
  // chữa — xem `cham_map.py` để biết vì sao chế thêm phép thống kê là đường đã hỏng ba lần.
  // LOI MON CORRAN -- 14 tang da NAM TRONG lan, khong phai o mep. Ba viec cung luc:
  //   1. VAT CHE co tran danh -- lan khong co gi de nup la mot cai ong tran. test_domap doi >=8%
  //      o luoi quanh vat can co duong kinh >= 0,40 x NV_CAO; da decor nho hon nguong nay nen
  //      khong tinh (do la mon no #142: da co tran danh da bi go va chua ve lai).
  //   2. rimBuild() lan theo MAP_OBSTACLES, nen chung TU CO vien da danh dau -- nhin thay duoc.
  //   3. Cho tran danh mot hinh dang: vong ra sau tang da de tranh don xa.
  // Dat le mot ben, va TRANH hai cho that: dat da o cho that la bit lan. Do lai: cho hep nhat
  // con 392px sau khi khoet -- tren nguong 340 cua test_sandat.
  loimon: [
    { x:760, y:1023, rx:55, ry:28 }, { x:1060, y:700, rx:55, ry:28 }, { x:1360, y:1024, rx:55, ry:28 }, { x:2260, y:498, rx:55, ry:28 },
    { x:2560, y:770, rx:55, ry:28 }, { x:2860, y:381, rx:55, ry:28 }, { x:3160, y:700, rx:55, ry:28 }, { x:3460, y:372, rx:55, ry:28 },
    { x:4360, y:893, rx:55, ry:28 }, { x:4660, y:623, rx:55, ry:28 }, { x:4960, y:1015, rx:55, ry:28 }, { x:5260, y:699, rx:55, ry:28 },
    { x:5560, y:1031, rx:55, ry:28 }, { x:5860, y:651, rx:55, ry:28 },
  ],
  corran: [
    { x:7, y:7, wd:126, ht:1293 }, { x:1380, y:76, rx:25, ry:13 }, { x:1040, y:168, rx:40, ry:20 }, { x:174, y:230, rx:42, ry:21 },
    { x:2293, y:244, rx:42, ry:21 }, { x:2144, y:274, rx:65, ry:33 }, { x:1931, y:385, wd:220, ht:139 }, { x:2316, y:497, wd:94, ht:250 },
    { x:1232, y:498, rx:66, ry:33 }, { x:1414, y:518, rx:65, ry:33 }, { x:1596, y:518, rx:65, ry:33 }, { x:320, y:524, rx:65, ry:33 },
    { x:1918, y:592, rx:33, ry:17 }, { x:1779, y:599, rx:66, ry:33 }, { x:1050, y:600, rx:65, ry:33 }, { x:502, y:619, rx:65, ry:33 },
    { x:868, y:619, rx:65, ry:33 }, { x:2161, y:627, rx:78, ry:39 }, { x:685, y:644, rx:66, ry:33 }, { x:1246, y:656, rx:77, ry:38 },
    { x:2286, y:722, rx:22, ry:11 }, { x:765, y:742, wd:180, ht:385 }, { x:584, y:750, wd:180, ht:331 }, { x:1826, y:765, rx:17, ry:8 },
    { x:404, y:776, wd:179, ht:305 }, { x:2408, y:791, wd:184, ht:142 }, { x:568, y:813, rx:19, ry:10 }, { x:1682, y:848, rx:36, ry:18 },
    { x:1588, y:854, rx:31, ry:15 }, { x:2444, y:954, rx:21, ry:10 }, { x:1764, y:1079, rx:64, ry:32 }, { x:1922, y:1080, rx:49, ry:25 },
    { x:1032, y:1082, rx:55, ry:28 }, { x:286, y:1126, rx:68, ry:34 }, { x:477, y:1129, rx:68, ry:34 }, { x:2319, y:1132, rx:17, ry:9 },
    { x:859, y:1133, rx:68, ry:34 }, { x:2577, y:1134, rx:14, ry:8 }, { x:668, y:1173, rx:68, ry:34 }, { x:1076, y:1232, rx:26, ry:13 },
    { x:1511, y:1252, rx:14, ry:8 }, { x:1276, y:1258, rx:31, ry:15 }, { x:1408, y:1266, rx:64, ry:32 }, { x:2490, y:1364, wd:102, ht:528 },
    { x:989, y:1378, rx:68, ry:34 }, { x:2209, y:1380, rx:40, ry:20 }, { x:800, y:1382, rx:67, ry:34 }, { x:2371, y:1420, rx:40, ry:20 },
    { x:2078, y:1508, rx:41, ry:21 }, { x:1262, y:1818, rx:69, ry:35 }, { x:1455, y:1819, rx:69, ry:35 }, { x:101, y:1822, rx:69, ry:35 },
    { x:1068, y:1822, rx:69, ry:35 }, { x:874, y:1824, rx:69, ry:35 }, { x:294, y:1834, rx:69, ry:35 }, { x:681, y:1834, rx:69, ry:35 },
    { x:2229, y:1841, rx:69, ry:35 }, { x:488, y:1846, rx:69, ry:35 }, { x:1842, y:1851, rx:69, ry:35 }, { x:2412, y:1853, rx:62, ry:31 },
    { x:2036, y:1854, rx:69, ry:35 }, { x:1648, y:1858, rx:69, ry:35 },
  ],

  // Chặn nguyên KHỐI NHÀ chứ không chỉ chân tường: art isometric vẽ cả mái, mà mái là thứ
  // nhân vật sẽ đi đè lên nếu cho vào. Toạ độ đọc từ chính tấm art qua lưới 100px rồi nhân
  // hệ số 1,5347 (art 1490px nội dung -> 2287px trong thế giới 2600x1900).
  // Tám hình ellipse chặn nhà cửa đã BỎ HẲN. Chúng là cách sai để giải bài toán này: mái nhà
  // trong tranh isometric là hình thoi, ellipse thì không — muốn phủ kín mái thì phải phình ra
  // ăn mất mặt sân, muốn chừa sân thì hở mái. Nay `diTrong` (xem MAPS.quangtruong) ôm đúng mặt
  // sân, nên mọi thứ ngoài sân đã bị chặn sẵn bởi chính đa giác — thêm ellipse chỉ chồng chéo.
  // Chỉ còn cái giếng: nó nằm GIỮA vùng đi được nên đa giác không chặn hộ được.
  quangtruong: [
    { x:1279, y:1013, rx:58,  ry:64  },  // giếng giữa sân
  ],
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
  // QA rà soát NPC Sapidae Chiefdom: Thương Nhân · Chợ Đấu Giá đã bị xoá — cả 3 món trong tiệm đều
  // trùng chỗ khác (Bình Thuốc Đỏ = Dược Sư, Thiên Mệnh Phù = mua thẳng trong Rèn Luyện qua buyCharm()),
  // và "Chợ Đấu Giá" chưa từng có cơ chế đấu giá thật — chỉ là tiệm giá cố định như 3 tiệm kia.
  // Đá Thăng Cấp đã gỡ hẳn cùng hệ Thuần Thục — nó không còn nơi tiêu.
  { id:'thoren', name:'Thợ Rèn · Lò Rèn Hoàng Gia', map:'tuongduong', x:1780, y:780, img:'assets/npcs/thoren.png', talk:'forge',
    lore:'"Lò này cháy suốt từ hôm khu phố rơi qua. Ta không dám để nó tắt — sợ nhóm lại không được."',
    barks:['"Búa này theo ta qua cả vết nứt."','"Đợi lò đỏ đã, đừng giục."',
           '"Đồ hỏng thì mang đây, đừng vứt."','"Nghe tiếng thép là biết đồ thật hay giả."'] },
  // NV5 (cấp 5) bắt rèn +3, mà lò duy nhất nằm trong Sapidae Chiefdom khoá tới NV10 — chính tuyến kẹt
  // cứng ở cấp 5, không có đường vòng. Bắt được qua chơi thử. Đặt một lò lưu vong ngay cạnh làng.
  // ── QUẢNG TRƯỜNG CŨ — thị trấn khởi đầu ─────────────────────────────────────
  // Toạ độ đặt bằng công cụ /diem: bật lên, chuột phải lên từng chỗ trong tranh, `/diem xong`
  // in ra đúng mấy dòng dưới đây. Cả mười người đều nằm TRONG `diTrong` của map (đã đối chiếu
  // lại bằng phép kiểm điểm-trong-đa-giác), và tránh vòng cấm của cái giếng giữa sân.
  // Vị trí chọn theo thứ có sẵn TRONG TRANH: quán bia treo biển ở tây, quầy giả kim treo lọ ở
  // bắc, giá binh khí ở đông, vòm cổng ở đông-bắc, giếng ở giữa.
  { id:'qt_giakim', name:'Nhà Giả Kim Quảng Trường', map:'quangtruong', x:1120, y:880, img:'assets/npcs/duoclao.png', talk:'shop',
    lore:'"Lọ treo trên kia là hàng thật, không phải đồ trang trí. Cứ vào, đừng đứng ngoài ngó."',
    barks:['"Bình đỏ pha sáng nay, còn ấm."','"Ra ngoài cổng thì mang theo hai lọ, đừng một."','"Đừng uống khi đang chạy."'] },
  { id:'qt_thoren', name:'Thợ Rèn Quảng Trường', map:'quangtruong', x:900,  y:1215, img:'assets/npcs/thoren.png', talk:'forge',
    lore:'"Lò của ta rơi qua vết nứt cùng cả khu phố này. Cứ đưa đồ đây — còn than là còn rèn."',
    barks:['"Đồ mới ra khỏi cổng là mẻ ngay, mang về ta vá."','"Đừng đập +7 khi trong túi chưa có ngọc."','"Nghe tiếng thép là biết đồ thật hay giả."'] },
  { id:'qt_gaccong', name:'Đội Trưởng Gác Cổng', map:'quangtruong', x:1620, y:790, img:'assets/npcs/laotuong.png', talk:'quest',
    lore:{
      idle:  '"Trong tường này không có gì giết được ngươi. Bước qua vòm cổng kia thì khác — ta chỉ mở cửa, không đi theo."',
      offer: '"Chưa vội. Đứng đây nhìn ra ngoài cổng một lúc đã, xem có sợ không rồi hẵng nhận việc."',
      active:'"Việc ngoài kia còn dở. Cổng ta vẫn mở, về lúc nào cũng được."',
      done:  '"Về đủ chân tay. Ta đếm người ra, đếm người về — hôm nay không lệch."' },
    barks:['"Cổng mở suốt. Đóng lại thì cũng chẳng cản được thứ ngoài kia."','"Ra thì ra sớm, chiều sương xuống dày."','"Đếm người ra, đếm người về. Hôm nay lệch ba."'] },
  { id:'qt_binhkhi', name:'Chủ Giá Binh Khí', map:'quangtruong', x:1745, y:1085, img:'assets/npcs/binhkhi.png', talk:'quest',
    lore:{
      idle:  '"Giá này toàn đồ của người không về. Ta lau sạch rồi mới dựng lên — cầm thử đi, đừng ngại."',
      offer: '"Tay ngươi chưa quen thép. Cầm cho vững đã rồi ta mới dám nhờ."',
      active:'"Cây ngươi mượn còn ngoài kia. Ta đợi cả nó lẫn ngươi."',
      done:  '"Trả về nguyên vẹn. Ít người làm được thế, ta ghi tên ngươi lên giá."' },
    barks:['"Cầm thử đi, đừng ngắm."','"Cây rìu kia nặng hơn nó nhìn."','"Đồ cũ nhưng chưa gãy lần nào."'] },
  { id:'qt_quantro', name:'Chủ Quán Trọ', map:'quangtruong', x:900, y:1045, img:'assets/npcs/trachu.png', talk:'quest',
    lore:{
      idle:  '"Cả cái quán rơi qua đây mà không vỡ một chén. Đời còn cho gì thì ta nhận nấy."',
      offer: '"Ngồi xuống ăn trước đã. Bụng đói thì nghe việc gì cũng thấy dễ."',
      active:'"Phần của ngươi ta để phần rồi, nguội thì hâm lại."',
      done:  '"Xong rồi hả. Ngồi đi, lần này ta rót, không tính tiền."' },
    barks:['"Ngồi đi, ta rót."','"Trong này yên, ngoài kia ồn."','"Ai vào cũng kể một chuyện, chưa ai kể trùng."'] },
  { id:'qt_thaythuoc', name:'Thầy Thuốc Già', map:'quangtruong', x:760, y:1140, img:'assets/npcs/duocsu.png', talk:'quest',
    lore:{
      idle:  '"Ta vá được da thịt. Cái ngươi mang về từ ngoài kia — thứ bám trong mắt ấy — ta chịu."',
      offer: '"Người còn lành lặn thì đừng vội. Ta chỉ nhờ khi không còn ai lành hơn."',
      active:'"Thuốc ta pha xong rồi, chỉ thiếu thứ ngươi đang đi lấy."',
      done:  '"Đủ rồi. Ngồi xuống, ta xem vết trên tay ngươi trước đã."' },
    barks:['"Vết này không phải do dao."','"Nghỉ một đêm rồi hẵng đi."','"Đừng để máu khô rồi mới tới."'] },
  { id:'qt_balao', name:'Bà Lão Bên Giếng', map:'quangtruong', x:1230, y:1110, img:'assets/npcs/monkhach.png', talk:'quest',
    lore:{
      idle:  '"Giếng này vẫn có nước. Cả khu phố mất người mà cái gàu còn nguyên — ngươi giải thích được không?"',
      offer: '"Ngươi mới tới, chưa nợ nơi này gì cả. Cứ đi chơi đi, việc của ta chờ được."',
      active:'"Ta vẫn múc nước mỗi sáng. Ngươi cứ đi, ta không đi đâu mất."',
      done:  '"Vậy là còn có người nghe bà già nói. Cảm ơn, thật đấy."' },
    barks:['"Sáng nào ta cũng múc một gàu, sáng nào cũng thế."','"Đừng nhìn xuống lâu quá."','"Trước đây chỗ này đông lắm."'] },
  { id:'qt_duatin', name:'Người Đưa Tin', map:'quangtruong', x:1330, y:1215, img:'assets/npcs/noiung.png', talk:'quest',
    lore:{
      idle:  '"Thư từ Sapidae Chiefdom vẫn tới đều. Người gửi thì ta gặp, người nhận thì chưa gặp ai bao giờ."',
      offer: '"Chân ngươi chưa quen đường. Đi vài vòng ngoài cổng đã rồi ta giao thư."',
      active:'"Thư còn trong túi ngươi đấy. Đừng để ướt."',
      done:  '"Tới nơi rồi hả. Vậy là hôm nay có một lá được đọc."' },
    barks:['"Đường ra đảo đi được, chỉ hơi bẩn giày."','"Ta chạy nhanh hơn ngươi đấy."','"Thư này để ba tháng rồi."'] },
  { id:'qt_laibuon', name:'Lái Buôn Lang Thang', map:'quangtruong', x:1120, y:1120, img:'assets/npcs/thantoan.png', talk:'quest',
    lore:{
      idle:  '"Ta buôn giữa hai bờ vết nứt. Hàng bên kia rẻ, chỉ tội mỗi chuyến mất một người kéo xe."',
      offer: '"Ngươi chưa đủ nặng tay để đi cùng chuyến của ta. Cứ chờ."',
      active:'"Xe ta đứng đây chờ. Hàng ngươi hứa vẫn chưa thấy đâu."',
      done:  '"Đủ hàng. Chuyến này ta không mất ai — lâu lắm rồi mới nói được câu đó."' },
    barks:['"Giá hôm nay khác hôm qua."','"Ta không nói thách, ta nói đúng."','"Bên kia vết nứt còn đắt hơn."'] },
  { id:'qt_linhtuan', name:'Lính Tuần Tra', map:'quangtruong', x:1850, y:1140, img:'assets/npcs/bodau.png', talk:'quest',
    lore:{
      idle:  '"Ta đi vòng quanh sân này mười hai lượt một ngày. Mười hai lượt, không lượt nào thấy gì — và đó mới là chuyện đáng sợ."',
      offer: '"Chưa cần tới ngươi. Sân còn sạch thì ta còn đi được một mình."',
      active:'"Ta vẫn đi vòng của ta. Việc ngươi nhận thì ngươi lo."',
      done:  '"Sạch rồi. Đêm nay ta bớt được một lượt — cảm ơn."' },
    barks:['"Mười hai lượt, không thiếu lượt nào."','"Trong sân sạch. Ngoài cổng thì ta không hứa."','"Nghe thấy gì thì gọi ta."'] },
  { id:'thoren_dao', name:'Thợ Rèn Lưu Vong', map:'daohoa', x:520, y:560, img:'assets/npcs/thoren.png', talk:'forge',
    lore:'"Lò của ta rơi qua vết nứt cùng ta. Còn đỏ lửa là còn rèn — đưa đồ đây."',
    barks:['"Đảo này không có quặng, ta nấu lại đồ cũ."','"Còn đỏ lửa là còn rèn."',
           '"Ngươi cầm kiếm sai tay rồi đấy."'] },
];

// MU Online-lite: mỗi lớp chỉ giữ đúng bộ chiêu gốc của lớp đó (không còn phiêu bạt tự do/dung hợp
// liên phái — MU không có khái niệm này, vũ khí & chiêu thức LÀ bản sắc lớp). Tất cả phai-locked,
// tự ngộ theo cấp độ giống hệt cơ chế sect-skill cũ, chỉ khác là giờ CẢ 5 LỚP đều có đủ bộ thay vì
// chỉ 3/9 lớp của bản trước. skillA/tp (Twisting Slash/Death Stab v.v.) đã nằm ở SECTS, đây là 4-6 chiêu
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
  dw_inferno:     { name:'Inferno', icon:'assets/skills/inferno.png', school:'Dark Wizard', phai:'baidasan', tier:'cao', cat:'Pháp Thuật', type:'aoe', unlock:48, cd:10, qi:35, mult:2.8, tam:500, color:'#ff7a3a', glyph:'☼', fx:{ r:180, big:true }, desc:'Giơ trượng gọi một cột lửa dựng thẳng từ lòng đất lên giữa bầy quái, vòng dung nham loang ra quanh chân nó.' },
  dw_dragonspirit:{ name:'Dragon Spirit', icon:'assets/skills/dragonspirit.png', school:'Dark Wizard', phai:'baidasan', tier:'trung', cat:'Pháp Thuật', type:'aoe', unlock:25, cd:7, qi:26, mult:2.0, color:'#853ab5', glyph:'✦', fx:{ r:150 }, desc:'Gọi bầy long hồn xoáy ra từ bóng của chính mình rồi giăng thành vòng, quét sạch một vòng quanh người.' },
  // Ô 3 — buff: Soul Barrier, lá chắn hấp thụ. Dark Wizard mỏng máu nhất nên đây là thứ giữ
  // được mạng lúc đứng tụ phép giữa tầm xa 420.
  dw_shield:      { name:'Soul Barrier', school:'Dark Wizard', phai:'baidasan', tier:'cao', cat:'Pháp Thuật', type:'buff', unlock:15, cd:10, qi:26, color:'#5ab8e8', glyph:'♦', fx:{ shieldPct:45, t:6 }, desc:'Khiên hồn ma bao bọc — hấp thụ sát thương bằng 45% Sinh Lực tối đa trong 6s.' },
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

Người Lunacia dựng lại quanh đống đổ nát ấy và gọi nó là <b>Sapidae Chiefdom</b>.`,
  `<span class="is-title">KẺ ĐƯỢC PHÁI QUA</span>
Ngươi thuộc một trong <b>năm lớp chiến binh của Vaeldra</b>, nằm trong đội tiên phong vượt vết nứt để sửa lại thứ mà thế giới ngươi đã gây ra.

Cuộc vượt biên tước sạch của ngươi mọi thứ — tên tuổi, ký ức, đồng đội — trừ một điều: bản năng chiến đấu của lớp mình. <b>Dark Knight</b> ◆ · <b>Dark Wizard</b> ❄ · <b>Sylvan Ranger</b> ❄ · <b>Spellblade</b> ☼ · <b>Dark Lord</b> ▲ — hãy chọn lại con đường ấy.

Ngươi dạt vào <b>Plant Tribe Glade</b>, được một Trưởng Làng Axie nhặt về nuôi. Võ nghệ sẽ trở lại theo từng cấp — và Lunacia cần nó.

Mỗi lớp mang một <b>hệ nguyên tố</b> — khắc hệ gây thêm <b>+20% sát thương</b> lên Chimera bị khắc.`,
  `<span class="is-title">NĂM TRỤ KHÓA</span>
Để vết nứt không nuốt trọn Lunacia, Thủ Hộ Vaeldra đã đóng <b>năm Trụ Khóa</b> xuống khắp thế giới này, ghim miệng vết nứt lại một chỗ.

Tướng quân của Morvahn đã chiếm cả năm trụ. Muốn tiến sâu, ngươi phải hạ chúng — nhưng <b>mỗi trụ được gỡ là vết nứt lại toác thêm</b>.

<i>"Từ Plant Tribe Glade, qua Werebear Woods, vào Bug Tribe Tunnels, lên Bird Tribe Heights, ra Reptile Sunstone Flats… cho tới Dusk Marsh, nơi vết nứt hà xuống."</i>

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
// ═══ NHIỆM VỤ PHỤ TUYẾN — ĐÃ GỠ SẠCH, CHỜ DỰNG LẠI ═════════════════════════
// Cùng lý do với QUESTS ở trên. Khuôn một mục:
//   { id, npc, name, desc, reqLv, reqMain, type, mob?, need, rew:{ xp, silver, ... } }
window.SIDE_QUESTS = [];

// ═══════════ CỐT TRUYỆN NGŨ ẤN × TÔNG MÔN — manh mối, lời thoại trấn thủ, kết mở ═══════════
window.CLUES = {
  manh_lenh:   { name:'Nửa Quân Bài Gloam',      desc:'Nửa quân bài của lính Vaeldra đào ngũ — mặt sau ai đó khắc thêm một con mắt không có tròng.' },
  ban_do_da:   { name:'Bản Đồ Vẽ Sai',           desc:'Hải đồ Vaeldra đánh dấu Lunacia bằng hai chữ "vô chủ". Có người đã gạch đi, viết đè: "CÓ NGƯỜI Ở".' },
  tan_quyen:   { name:'Tàn Quyển «Ngũ Trụ Ký»',  desc:'"…năm trụ ghim Morvahn ở bên kia. Một trụ gãy, bốn trụ lung lay…"' },
  cot_nhan:    { name:'Xương Chim Khắc Chữ',     desc:'Mảnh xương khắc hàng chữ nhỏ của một Axie: "Vết nứt không tự mở. Có kẻ bẻ nó về phía chúng ta."' },
  thiep_den:   { name:'Thư Mời Không Địa Chỉ',   desc:'Thiếp mời dự "lễ mở cổng" — chỉ ghi ngày giờ, không ghi nơi chốn. Mực còn mới.' },
  co_thu:      { name:'Trang Nhật Ký Thủ Hộ',    desc:'"Chúng ta bẻ vết nứt sang đó để cứu Vaeldra. Hôm nay ta mới biết bên đó có người ở. Bốn vạn người."' },
  di_thu:      { name:'Di Thư Người Gác Rừng',   desc:'"Rừng của ta không có lỗi. Nhưng ta vẫn phải đốt nó để chặn khí lan." — nét chữ run rẩy.' },
  phuc_lanh:   { name:'Lệnh Điều Quân',          desc:'Sắc lệnh: "Trụ Mộc đã lung lay — dồn quân về Reptile Sunstone Flats, đêm trăng tròn."' },
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
  co_lenh:     { name:'Quân Lệnh Cũ',            desc:'Văn thư: "Dusk Marsh thất thủ thì cả Lunacia mở toang." Dấu triện đã sáu mươi năm — cũ hơn cuộc giao thoa rất nhiều.' },
  le_thach:    { name:'Đá Khắc Lời Trăng Trối',  desc:'Mảnh đá nhuốm máu: "Đừng tin bất cứ ai nói rằng chuyện này là tai nạn."' },
  mat_lenh:    { name:'Mật Lệnh Rách',           desc:'"…khi đủ năm trụ gãy, Vết Nứt mở toang — Morvahn bước qua, Lunacia thành lò luyện."' },
  thu_cuoi:    { name:'Thư Cuối Của Tướng Quân', desc:'"Ta giữ Dusk Marsh ba mươi năm. Hôm nay ta mở cổng — không phải vì hàng, mà vì đằng nào nó cũng mở."' },
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
  cn3:{ name:'Trưởng Lão Tha Hóa', intro:['Werebear Woods từng là nhà của ta…','Trụ Khóa này ghim ta — hay ghim cả Morvahn?'],
        sect:{ toanchan:'Sylvan Ranger… bên thế giới ngươi, rừng có được yên không?' } },
  cn4:{ name:'Tướng Quân Werebear Woods', intro:['Kiếm của ta chỉ vỡ một lần — lần đó ta thua.','Trụ Thủy do ta canh. Muốn gỡ? Hỏi thanh kiếm này.'],
        sect:{ toanchan:'Một Sylvan Ranger non tay… ra tay đừng nương tình.' } },
  cm1:{ name:'Chỉ Huy Vong Binh', intro:['Ổ ấp này không chờ người sống.','Quân ta chết rồi — nhưng chưa được phép tan.'] },
  cm2:{ name:'Kẻ An Táng Bóng Tối', intro:['Ta chôn hatchling suốt ba năm nay. Chôn không kịp nữa.','Nằm xuống đi, cho nhanh.'] },
  cm3:{ name:'Chúa Tể Bất Tử', intro:['Bất tử không phải phúc — là hình phạt của Morvahn.','Ở lại cùng ta!'] },
  cm4:{ name:'Tướng Quân Bug Tribe Tunnels', intro:['Ai đánh thức giấc ngủ ngàn năm của ta?','Trứng trong tổ này nuôi Trụ Mộc. Ngươi định cứu chúng à? Ngây thơ.'],
        sect:{ bug:'Dark Lord? Ngươi cũng chỉ huy kẻ khác đi chết thay mình thôi, khác gì ta.' } },
  tt1:{ name:'Kẻ Lạc Lối Tuyệt Vọng', intro:['Ta chạy khỏi nhà, chạy vào đây, rồi quên mất nhà ở đâu…','Không còn gì để mất nữa!'] },
  tt2:{ name:'Cỏ Dại Băng Giá', intro:['Băng giá thấm vào từng nhánh cỏ của ta.','Ngươi có đủ ấm để sống sót không? Để ta xem nào.'] },
  tt3:{ name:'Xoáy Sương Nguyền', intro:['Sương giá là thuốc — nó khiến mọi nỗi đau tê liệt.','Đến đây, để ta ru ngươi vào giấc ngủ lạnh lẽo.'] },
  tt4:{ name:'Tướng Quân Bird Tribe Heights', intro:['Vale này đã chôn biết bao kẻ chạy loạn…','Đến lượt ngươi.'],
        sect:{ thieulam:'Dark Knight, giáp dày thế kia — có che nổi cái ngươi đã làm với thế giới này không?' } },
  mc1:{ name:'Kỵ Sĩ Trưởng Tro Tàn', intro:['Thảo nguyên chỉ nhận kẻ mạnh!','Kỵ sĩ — bày trận!'] },
  mc2:{ name:'Cung Thủ Tinh Nhuệ Tro Tàn', intro:['Một tên một mạng — ta có cả nghìn tên.','Đứng yên nào.'] },
  mc3:{ name:'Thống Lĩnh Tro Tàn', intro:['Tướng Quân truyền lệnh — ta chính là lệnh!','Nghiền nát chúng!'] },
  mc4:{ name:'Tướng Quân Reptile Sunstone Flats', intro:['Ngàn dặm tro tàn — vì sao dừng ở đây? Vì Trụ Kim đã gãy!','Kẻ từ bên kia… chứng minh bản lĩnh đi.'],
        sect:{ minhgiao:'Spellblade — nửa hiệp sĩ nửa pháp sư. Nửa vời như thế giới đã đẻ ra ngươi.' } },
  nm1:{ name:'Tướng Quân Bão Tố', intro:['Dusk Marsh ba mươi năm không gãy — hôm nay cũng vậy!','Tướng sĩ! Giữ ải!'] },
  nm2:{ name:'Huyết Sát Bão Tố', intro:['Máu trên giáp ta chưa bao giờ khô.','Thêm một mạng nữa!'] },
  nm3:{ name:'Tướng Quân Cửa Ải', intro:['Thành này cô độc — ta cũng vậy.','Qua đây… nếu ngươi đủ nặng ký.'] },
  nm4:{ name:'Tướng Quân Dusk Marsh', intro:['Ta mở cổng không phải vì hàng — mà vì đằng nào nó cũng mở.','Trụ Khóa cuối cùng… để ta xem ngươi dám gỡ không!'],
        sect:{ bug:'Dark Lord. Morvahn cũng từng là Dark Lord đấy — hắn chỉ đi xa hơn ngươi một chút thôi.' } },
};
