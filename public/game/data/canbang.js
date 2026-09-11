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
// `collect` chỉ chạy ở map có HERB_SPOTS (Rẻo Rừng Corran · Beast Herd Camp).
// `meditate` neo vào SPRING trên Rẻo Rừng Corran — trong chuỗi này nó LÀ một Atia Shrine.
// `tpkill` bắt hạ quái bằng đòn Trấn Phái, để người chơi thật sự dùng chiêu riêng của lớp.
window.QUESTS = [
  // ── CHƯƠNG I · NGỌN ĐÈN TẮT (cấp 1–10) ────────────────────────────────────
  // ⚠ VIỆC ĐẦU TIÊN LÀ RA KHỎI THÀNH MÀ ĐÁNH, KHÔNG PHẢI ĐI HỎI CHUYỆN. Chủ dự án chốt: nhiệm
  // vụ mở màn phải đẩy người chơi qua Cổng Tây ra bìa Rẻo Rừng Corran. Chặng nói chuyện
  // "Ngọn Đèn Bên Giếng" KHÔNG bị xoá — nó lùi xuống làm c1q2, và mạch đèn vẫn chạy từ đó.
  { id:'c1q1', chapter:'I · Ngọn Đèn Tắt', lv:1, npc:'ah_gac_tay', map:'corran',
    type:'kill', mob:'boar', need:6,
    name:'Ra Bìa Rẻo Rừng Corran', desc:'Lính Gác Cổng Tây chặn ngươi lại: "Bầy heo rừng lấn tới sát chân tường ba đêm nay." Ra Cổng Tây, vào bìa Rẻo Rừng Corran mà dọn chúng.',
    rew:{ xp:220, silver:120 } },
  { id:'c1q2', chapter:'I · Ngọn Đèn Tắt', lv:2, npc:'ah_gac_tay', map:'ardhaven',
    type:'talk', targetNpc:'ah_ganhnuoc', need:1,
    name:'Ngọn Đèn Bên Giếng', desc:'"Chúng nó chỉ dạn thế từ hôm cái đèn cạnh giếng tắt. Ba đêm liền, mà dầu vẫn còn đầy." Người gánh nước qua đó mười hai chuyến một ngày — hỏi ông ta.',
    rew:{ xp:340, silver:180 } },
  { id:'c1q3', chapter:'I · Ngọn Đèn Tắt', lv:3, npc:'truonglang', map:'corran',
    type:'talk', targetNpc:'duocsu', need:1,
    name:'Người Giữ Đèn', desc:'Trưởng Làng nhận ra ngay: đó là đèn dẫn hồn, do Dawn axie trông coi. Dược Sư từng phụ họ pha dầu — hỏi cho ra công thức.',
    rew:{ xp:420, silver:200 } },
  { id:'c1q4', chapter:'I · Ngọn Đèn Tắt', lv:4, npc:'duocsu', map:'corran',
    type:'collect', herbMap:'corran', need:5,
    name:'Dầu Cho Ngọn Đèn', desc:'"Dầu đèn không mua được. Nó là nhựa cây trong rừng thưa, mà chỉ Plant axie mới biết chỗ." Hái đủ năm bụi.',
    rew:{ xp:520, silver:240 } },
  { id:'c1q5', chapter:'I · Ngọn Đèn Tắt', lv:5, npc:'truonglang', map:'corran',
    type:'kill', mob:'hautu', need:8,
    name:'Thứ Ăn Hồn Kẹt', desc:'Đèn tắt thì hồn không về được Cây Hồn, kẹt lại giữa đường. Lũ này tụ quanh chỗ hồn kẹt mà ăn. Dọn sạch.',
    rew:{ xp:640, silver:300 } },
  { id:'c1q6', chapter:'I · Ngọn Đèn Tắt', lv:6, npc:'ah_gac_tay', map:'ardhaven',
    type:'enhance', need:3,
    name:'Thép Chịu Được Bóng', desc:'"Đồ thường chém vào chúng như chém sương." Mang một món tới lò rèn, đập lên +3 rồi quay lại.',
    rew:{ xp:760, silver:400 } },
  { id:'c1q7', chapter:'I · Ngọn Đèn Tắt', lv:7, npc:'duocsu', map:'corran',
    type:'meditate', need:20,
    name:'Ngồi Ở Miếu Atia', desc:'"Miếu bên suối vẫn còn. Atia không cho ai vàng bạc — nhưng ngồi đủ lâu thì ngài cho ngươi biết ngọn đèn kế tiếp tắt ở đâu."',
    rew:{ xp:900, silver:420 } },
  { id:'c1q8', chapter:'I · Ngọn Đèn Tắt', lv:8, npc:'truonglang', map:'corran',
    type:'tpkill', mob:'wolf', need:6,
    name:'Đòn Của Riêng Ngươi', desc:'"Đòn thường không đủ nữa." Hạ sáu con bằng chính Trấn Phái tuyệt kỹ của lớp ngươi.',
    rew:{ xp:1100, silver:500 } },
  { id:'c1q9', chapter:'I · Ngọn Đèn Tắt', lv:9, npc:'duocsu', map:'corran',
    type:'kill', mob:'caodo', need:12,
    name:'Kẻ Canh Miếu', desc:'Miếu Atia phía đông bị chiếm. Bọn Gloam dựng trại ngay trên nền miếu — dọn chúng đi thì đèn mới thắp lại được.',
    rew:{ xp:1400, silver:650 } },
  { id:'c1q10', chapter:'I · Ngọn Đèn Tắt', lv:10, npc:'truonglang', map:'corran',
    type:'boss', mob:'boss', need:1,
    name:'Thủ Lĩnh Gloam', desc:'Kẻ ngồi trên nền miếu không phải quái đi lạc — nó biết chính xác ngọn đèn nào cần dập. Hạ nó.',
    rew:{ xp:2600, silver:1200, item:'vukhi' } },

  // ── CHƯƠNG II · LỬA CỦA THỢ RÈN (cấp 14–24) ───────────────────────────────
  { id:'c2q1', chapter:'II · Lửa Của Thợ Rèn', lv:14, npc:'quachtinh', map:'ardhaven',
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
  { id:'c2q5', chapter:'II · Lửa Của Thợ Rèn', lv:21, npc:'quachtinh', map:'ardhaven',
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
  // ⚠ HOÁN DẢI CẤP (xem MAPS): bốn con này giữ nguyên TÊN, CHỖ ĐỨNG và tạo hình của Plant Tribe
  // Glade — chỗ đứng là toạ độ tỉ lệ đã dò cho chính khổ map ấy, dời đi là hỏng test_bossplace.
  // Chỉ CẤP đổi, từ 6/9/12/14 lên bắc cầu giữa Werebear Woods (Trấn Ải C32) và Bug Tribe
  // Tunnels (Vệ Binh Trụ đầu C43).
  daohoa: { thuve:[
      { id:'dh1', name:'Chúa Heo Rừng',       lv:40, el:'Thổ',  img:'boar',     x:0.4346, y:0.3526, moves:['vach','xung','cuong'] },
      { id:'dh2', name:'Chúa Bầy Gai Tím',        lv:43, el:'Mộc',  img:'wolf',     x:0.7077, y:0.8842, moves:['xung','goi','vach'] },
      { id:'dh3', name:'Chấp Sự Gloam',  lv:46, el:'Thủy', img:'assassin', x:.42, y:.80, moves:['vach','vong','cuong'] } ],
    tranai: { id:'dh4', name:'Thủ Lĩnh Đoàn Gloam', lv:50, el:'Hỏa', img:'boss_hacphong', x:.86, y:.80, moves:['vong','vach','goi','cuong'] } },
  ngoai: { thuve:[
      { id:'ng1', name:'Đầu Mục Gloam',    lv:13, el:'Kim',  img:'bandit',   x:0.6691, y:0.5042, moves:['vach','xung','cuong'] },
      { id:'ng2', name:'Gai Tím Độc Nhãn',lv:16, el:'Mộc',  img:'wolf',     x:0.2618, y:0.1939, moves:['xung','vong','goi'] },
      { id:'ng3', name:'Đặc Vụ Gloam',   lv:19, el:'Thủy', img:'assassin', x:0.3782, y:0.64, moves:['vach','xung','cuong'] } ],
    tranai: { id:'ng4', name:'Ma Sói Sương Trắng', lv:22, el:'Hỏa', img:'boss_sontac', x:0.0873, y:0.5236, moves:['vach','vong','goi','cuong'] } },
  chungnam: { thuve:[
      { id:'cn1', name:'Kẻ Đổi Phe',        lv:23, el:'Thủy', img:'phando',   x:0.32, y:0.4141, moves:['vach','xung','goi'] },
      { id:'cn2', name:'Golem Gỗ Cổ Đại',    lv:26, el:'Thổ',  img:'mocnhan',  x:0.5704, y:0.3388, moves:['vong','vach','cuong'] },
      { id:'cn3', name:'Trưởng Lão Tha Hóa', lv:29, el:'Thủy', img:'boss_phando', x:0.5009, y:0.8094, moves:['xung','vach','vong'] } ],
    tranai: { id:'cn4', name:'Tướng Quân Werebear Woods', lv:32, el:'Thủy', img:'bandao', x:0.8904, y:0.6024, moves:['vach','xung','vong','cuong'] } },
  // Bốn chỗ đứng chấm bằng máy trên chính bảng vật cản của map (xa điểm thả ≥700px theo luật
  // test_bossplace, cách nhau ≥1200px, không đè gốc cổ thụ) — GIỮ NGUYÊN.
  // ⚠ HOÁN DẢI CẤP (xem MAPS): map này nay là map khởi đầu 1-12, nên bốn con này hạ cấp theo,
  // xuống đúng nhịp mà chuỗi nhiệm vụ chương I bám vào (Trấn Ải C14 là mốc đóng chương). TÊN
  // giữ nguyên tất cả — kể cả Trấn Ải "Người Giữ Rẻo Corran".
  corran: { thuve:[
      { id:'co1', name:'Rễ Cổ Thức Giấc',    lv:6,  el:'Mộc',  img:'mocnhan', x:0.1231, y:0.8842, moves:['vong','vach','cuong'] },
      { id:'co2', name:'Kẻ Canh Vòng Cổng',  lv:9,  el:'Thổ',  img:'thinu',   x:0.4923, y:0.5053, moves:['vach','xung','goi'] },
      { id:'co3', name:'Axie Sa Ngã Đầu Đàn',lv:12, el:'Thủy', img:'bandao',  x:0.7538, y:0.1263, moves:['xung','vong','cuong'] } ],
    tranai: { id:'co4', name:'Người Giữ Rẻo Corran', lv:14, el:'Mộc', img:'boss_mochu', x:0.7538, y:0.8842, moves:['vong','vach','goi','cuong'] } },
  // Trum Trung Nut dat GIUA trung, khong dat canh cong: bo sinh tu kiem >=700px tinh tu moi
  // diem toi (test_bossplace). Luot dau hai trum roi cach cong 466px va 401px -- bo kiem bat.
  trungnut: { thuve:[
      { id:'tn1', name:'Rễ Trũng Cựa Mình',   lv:46, el:'Mộc',  img:'mocnhan', x:0.22, y:0.52, moves:['vong','vach','cuong'] },
      { id:'tn2', name:'Kẻ Nhặt Xác Mép Nứt', lv:48, el:'Thổ',  img:'thinu',   x:0.55, y:0.78, moves:['vach','xung','goi'] } ],
    tranai: { id:'tn3', name:'Thứ Bò Ra Từ Nứt', lv:52, el:'Thuỷ', img:'bandao', x:0.78, y:0.66, moves:['vong','vach','goi','cuong'] } },
  // Trum Loi Mon dung o TAN CUNG lan -- di het duong moi gap. Do la phan thuong cua viec di het.
  loimon: { thuve:[],
    tranai: { id:'lm1', name:'Kẻ Chặn Cuối Lối', lv:50, el:'Thổ', img:'mocnhan', x:0.9300, y:0.5744, moves:['vach','vong','goi','cuong'] } },
  comoc: { thuve:[
      { id:'cm1', name:'Chỉ Huy Vong Binh',  lv:43, el:'Thổ',  img:'kybinh',   x:0.5867, y:0.64, moves:['xung','vach','goi'] },
      { id:'cm2', name:'Kẻ An Táng Bóng Tối',lv:46, el:'Thủy', img:'thinu',    x:0.1733, y:0.48, moves:['vong','xung','cuong'] },
      { id:'cm3', name:'Chúa Tể Bất Tử',     lv:49, el:'Thổ',  img:'mocnhan',  x:0.56, y:0.3022, moves:['vach','vong','goi'] } ],
    tranai: { id:'cm4', name:'Tướng Quân Bug Tribe Tunnels', lv:52, el:'Mộc', img:'boss_mochu', x:0.8533, y:0.6578, moves:['vong','xung','goi','cuong'] } },
  // ⚠ BỐN TOẠ ĐỘ NÀY DÒ BẰNG MÁY, KHÔNG CHẤM TAY — và đã phải dò lại một lần. Bản đầu đặt trùm
  // theo mắt, giữa các chặng của con đường; `test_bossplace` bắt hai con nằm cách tâm bãi quái
  // 220px và 283px (ngưỡng 300). Trên map dạng LÀN thì trùm và bãi quái buộc phải xen kẽ trên
  // CÙNG một đường, nên chỗ đặt phải rơi vào KHE giữa hai dải `dai` của hai miền dân số. Dò cả
  // lưới rồi bung lại bãi quái để đo, chọn bộ tốt nhất: gần tâm bãi nhất 403px, gần điểm thả
  // nhất 801px. Đổi `vung` hay thêm cổng thì bãi quái xê dịch — dò lại, đừng nhích tay.
  caungam: { thuve:[
      { id:'cg1', name:'Kẻ Gác Nhịp Đá',   lv:57, el:'Thủy', img:'xanu',     x:0.3710, y:0.5413, moves:['vach','vong','goi'] },
      { id:'cg2', name:'Thứ Bám Chân Cầu', lv:59, el:'Thủy', img:'huyetbat', x:0.7135, y:0.5983, moves:['xung','vong','cuong'] },
      { id:'cg3', name:'Kẻ Đếm Người Qua', lv:61, el:'Thổ',  img:'ttdetu',   x:0.9133, y:0.6980, moves:['vach','xung','goi'] } ],
    tranai: { id:'cg4', name:'Thứ Ngoi Lên Từ Hồ Ngầm', lv:63, el:'Thủy', img:'boss_tinhhoa', x:0.8277, y:0.8903, moves:['vong','vach','xung','cuong'] } },
  tuyettinh: { thuve:[
      { id:'tt1', name:'Kẻ Lạc Lối Tuyệt Vọng',lv:63, el:'Thổ',  img:'ttdetu', x:0.1867, y:0.48, moves:['vach','goi','cuong'] },
      { id:'tt2', name:'Cỏ Dại Băng Giá',     lv:66, el:'Hỏa',  img:'caodo',    x:0.4267, y:0.4978, moves:['xung','vong','goi'] },
      { id:'tt3', name:'Xoáy Sương Nguyền',    lv:69, el:'Mộc',  img:'boss_tinhhoa', x:0.64, y:0.2844, moves:['vach','xung','vong'] } ],
    tranai: { id:'tt4', name:'Tướng Quân Bird Tribe Heights', lv:72, el:'Mộc', img:'thinu', x:0.8533, y:0.8178, moves:['vong','vach','xung','cuong'] } },
  mongco: { thuve:[
      { id:'mc1', name:'Kỵ Sĩ Trưởng Tro Tàn', lv:83, el:'Kim', img:'kybinh',  x:0.2432, y:0.4843, moves:['xung','vach','cuong'] },
      { id:'mc2', name:'Cung Thủ Tinh Nhuệ Tro Tàn', lv:86, el:'Mộc',  img:'cungthu',  x:0.512, y:0.4843, moves:['vong','xung','goi'] },
      { id:'mc3', name:'Thống Lĩnh Tro Tàn', lv:89, el:'Kim', img:'cuongbinh',x:0.7808, y:0.7784, moves:['vach','xung','vong'] } ],
    tranai: { id:'mc4', name:'Tướng Quân Reptile Sunstone Flats', lv:92, el:'Kim', img:'boss_dothong', x:0.9088, y:0.5016, moves:['xung','vong','goi','cuong'] } },
  nhanmon: { thuve:[
      { id:'nm1', name:'Tướng Quân Bão Tố',  lv:103, el:'Kim', img:'daokhach', x:0.1969, y:0.4211, moves:['vach','xung','cuong'] },
      { id:'nm2', name:'Huyết Sát Bão Tố',   lv:106, el:'Hỏa',  img:'cuongbinh',x:0.5538, y:0.3368, moves:['vong','vach','goi'] },
      { id:'nm3', name:'Tướng Quân Cửa Ải', lv:109, el:'Thổ',  img:'boss_thienbinh', x:0.3692, y:0.8926, moves:['xung','vong','vach'] } ],
    tranai: { id:'nm4', name:'Tướng Quân Dusk Marsh', lv:112, el:'Hỏa', img:'boss_thienbinh', x:0.8738, y:0.6737, moves:['vach','xung','vong','cuong'] } },
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
// Bảy phó bản tĩnh ĐÃ GỠ (xem CLAUDE.md · CHẨN ĐOÁN GỐC). Chúng là một địa hình dùng bảy lần;
// map sẽ được dựng lại từ đầu ở phần đo map, rồi cắm lại vào đây. Máy chạy phó bản trong
// game.js (DGN · startDungeonRun · updateDungeon · boss săn · thưởng) GIỮ NGUYÊN, đang nằm chờ:
// thêm một khoá vào bảng này cùng một map type:'dungeon' là nó chạy lại ngay.
//
// Khuôn một mục, để dựng lại đúng hình cũ:
//   <mapId>: { boss, bossName, waves:[[3 loài],[3],[3]], huntBoss, boxTier:1-5, timeLimit,
//              rewards:{ sach:[lo,hi], tuLa:[lo,hi], hon:[lo,hi], khi, bacThem, silver:[lo,hi] } }
window.DUNGEONS = {};

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
  // ── HOÁN DẢI CẤP VỚI RẺO RỪNG CORRAN ──────────────────────────────────────────────────
  // Chủ dự án chốt: Rẻo Rừng Corran xuống làm map khởi đầu (1-12), Plant Tribe Glade lên dải
  // trên. TÊN và LORE của cả hai map giữ nguyên — chỉ dải cấp, bộ quái và bốn cờ làng
  // (village/spring/herbs/boss) đổi chỗ cho nhau. Địa hình thì Ở LẠI với map của nó: khổ
  // 2600x1900, năm hồ trong MAP_OBSTACLES và 70 cây/26 đá vẫn là của Plant Tribe Glade.
  //
  // ⚠ `range` ghi '38 - 48' chứ KHÔNG phải '38 - 42' như bảng cũ của Rẻo Rừng Corran.
  // Bộ ba quái của dải này là bandao(C38) · thinu(C42) · mocnhan(C48), mà `test_domap` đòi mỗi
  // map có bãi quái phải mang ĐỦ BA LOÀI (sàn `loai`) — bỏ mocnhan ra thì chỉ còn hai. Bảng
  // '38 - 42' cũ của Rẻo Rừng Corran vốn đã lệch với chính quái của nó; map ấy nằm ngoài danh
  // sách đo của test_moblevels nên chỗ lệch nằm im. Nay map này VÀO danh sách đó, nên bảng phải
  // nói đúng thứ người chơi gặp.
  daohoa: { name:'Plant Tribe Glade', min:36, range:'38 - 48', type:'pk', ground:'#ece2c8', patch:'#7a86ad',
    spawn:{ x:460, y:460 },
    // Ba lối rìa nhận từ Rẻo Rừng Corran, đặt lại trên khổ 2600x1900: tây↔Werebear Woods,
    // đông↔Lối Mòn Corran, bắc↔Trũng Nứt Corran. Điểm tới phải cách MỌI Trùm Vùng ≥700px
    // (test_bossplace) — mà `dh1` đứng ngay giữa bắc map (1130,670), nên lối bắc phải lùi hẳn
    // sang đông và lối đông phải nằm TRÊN `dh4` (2236,1520), không nằm dưới.
    spawnFrom:{ chungnam:{ x:330, y:700 }, loimon:{ x:2290, y:600 }, trungnut:{ x:1880, y:300 } },
    trees:70, rocks:26,
    desc:'Trại ấp Plant Tribe bỏ lại giữa rừng thưa — nay là đất PK, hạ người khác được mà bị hạ cũng được. Axie Sa Ngã dạt về từ phía rẻo rừng, Golem thì ngủ ngay trên luống cũ.',
    // Cụm quái xếp theo vòng từ spawn ra: gần nhất là bandao (C38) → thinu (C42) → xa nhất là
    // mocnhan (C48). Ba dải `dai` RỜI NHAU và tăng dần, vì `test_moblevels` không tha một cụm
    // nào ở xa hơn mà yếu hơn.
    voi: 1765,
    // ── A4 · MIỀN DÂN SỐ ──────────────────────────────────────────────────
    // Bãi quái KHÔNG còn chép cứng toạ độ. Mỗi miền là một DẢI KHOẢNG CÁCH (`dai`, tỉ lệ của
    // `voi`) × một CUNG GÓC (`cung`, độ, quanh điểm thả) mang một dân số. banRaiVung() bung nó
    // thành các cụm trại, hạt bốc từ tên map nên bố cục CỐ ĐỊNH — xem khối A4 trong game.js.
    // Sửa cân bằng = sửa `n` của miền hoặc kéo `dai`; không phải đi dịch từng toạ độ.
    // `vai` là danh sách rải theo lượt cho các cụm: cùng loài, cụm này Cận Chiến, cụm kia Xạ Thủ.
    vung: [
      { id:'bandao', ten:'Dốc Sa Ngã Plant Tribe', dai:[0.12,0.38], cung:[-43,67], cum:[3,3], tiep:true,
        dan:[{ mob:'bandao', n:13, vai:['can','xa'] }] },   // C38 · Axie Sa Ngã
      { id:'thinu', ten:'Ổ Ấp Bỏ Lại', dai:[0.42,0.68], cung:[-13,93], cum:[3,3], tiep:true,
        dan:[{ mob:'thinu', n:13, vai:['can','phap'] }] },   // C42 · Oan Hồn Ổ Ấp
      { id:'mocnhan', ten:'Vạt Golem Ngủ', dai:[0.72,1.0], cung:[19,71], cum:[3,3], tiep:true,
        dan:[{ mob:'mocnhan', n:13 }] },   // C48 · Axie Golem
    ], duhiep:'duhiep2' },
  // ── ARDHAVEN · SAPIDAE CHIEFDOM · thành an toàn RỘNG BẰNG MỘT MAP THẬT ───────────────
  // Thay hẳn HAI sân an toàn cũ: "Quảng Trường Cũ" (2600×1900, một khoảnh sân lát đá) và
  // thành cũ cùng khung. Cả hai đều NHỎ HƠN một map hoang dã, nên "vào thành" trước đây là
  // bước từ thế giới rộng vào một cái sân — đúng thứ làm thành mất trọng lượng.
  //
  // KHUNG 6400×3200 · TỈ LỆ 2,0. Tỉ lệ lấy từ khung một toà thành lớn trong một game 2D cùng
  // dòng, suy ngược từ toạ độ NPC công bố (x 35→285, y 100→161 ⇒ 250/125 = 2,0). Chỉ mượn
  // TỈ LỆ KHUNG và nhịp chia khu — không mượn bố cục, không mượn art.
  //
  // 16 KHỐI NHÀ là con số bị `test_domap` ÉP RA, không phải chọn cho đẹp: bài đó không tha
  // map thành, vẫn đòi mật độ ≥1,30 điểm nội dung trên 1000 ô đi được. Sàn 80% ⇒ ~28500 ô ⇒
  // cần 37 điểm; sàn 70% ⇒ ~24900 ô ⇒ cần 32,4 điểm. Chọn sàn 70% (16 khối) vì mỗi khối còn
  // phải nuôi được NPC + vật to quanh nó — 37 điểm là đơn hàng art gấp rưỡi cho cùng một thành.
  //
  // ⚠ KHÔNG bật `city:true`. Cờ đó gọi drawCityWalls/drawCityPlaza — tường thành, đài phun
  // nước và sáu biển hiệu VẼ TAY, toạ độ chép cứng theo khung 2600×1900. Ở 6400×3200 chúng
  // rơi gọn vào góc tây-bắc và đè lên sàn lát. `type:'safe'` đã đủ để cấm PK.
  //
  // `diTrong` (36 đỉnh) do tools/iso/dung_thanh.py dựng: khung chữ nhật bo bốn góc, cộng bốn
  // vấu cổng thò ra bốn mép — `test_noimap` đòi điểm đến của một "Lối ..." phải cách mép map
  // dưới 400px, nên cổng phải nằm HẲN trên mép chứ không lùi vào trong.
  ardhaven: { name:'Sapidae Chiefdom', min:1, range:'—', type:'safe', ground:'#3a4230', patch:'#4a4438',
    w:6400, h:3200,
    // Sàn lát viên isometric. `isoCo` là mặt lát nền (đá phiến), `isoDat` là mặt đường (sỏi) —
    // hai bộ này KHÁC map hoang dã, nơi hai vai ấy là cỏ và đất. Xem sanIsoDung().
    sanIso:true, isoCo:['nen_da1','nen_da2','nen_da3','nen_da4'],
    isoDat:['nen_duong1','nen_duong2','nen_duong3','nen_duong4'],
    // `isoCay` mọc NGOÀI đa giác, trong vành 300px quanh mép — tức là hàng cây bên ngoài tường
    // thành, không phải cây mọc giữa phố. `isoNho` (cỏ dại, sỏi vụn) thì mọc trong lòng thành:
    // mặc định của nó là w*h/3e4 = 683 cho khổ này, quá dày cho một mặt phố lát đá — hạ về 260,
    // đủ để mặt lát không trơ mà không biến quảng trường thành bãi cỏ.
    isoCay:200, isoNho:260,
    // LƯỚI PHỐ. Map rộng thì luật "đường mòn = dải xa mép nhất" biến cả thành một bãi sỏi
    // mênh mông, nên phải khai đường thật. Hai đại lộ nối thẳng bốn cổng, bốn ngõ dọc rơi
    // đúng khe 200px giữa các khối nhà, hai phố vòng chạy men dãy nhà bắc và nam.
    isoDuong: [
      [[230,1600],[6170,1600]], [[3200,210],[3200,2990]],
      [[1500,370],[1500,2830]], [[2160,370],[2160,2830]],
      [[4240,370],[4240,2830]], [[4900,370],[4900,2830]],
      [[400,370],[6000,370]],   [[400,2830],[6000,2830]],
    ],
    spawn:{ x:3200, y:1900 },
    spawnFrom:{ ngoai:{ x:3200, y:3080 }, corran:{ x:250, y:1600 },
                chungnam:{ x:6150, y:1600 }, tuyettinh:{ x:3200, y:120 } },
    trees:0, rocks:0, herbs:true,
    desc:'Khu phố Ardhaven rơi qua vết nứt còn nguyên khối — nguyên mái, nguyên giếng, nguyên cả biển hiệu. Dân bản địa dựng tường quanh nó và gọi chỗ này là Sapidae Chiefdom. Trong tường: Quảng Trường Atia, Phố Chợ, Phố Lò, Sân Chuồng, Sảnh Lệnh, Vách Gió và Xóm Trọ. Không Chimera nào vào được. Bốn cổng ra bốn hướng.',
    diTrong: [
              [3480,3150], [2920,3150], [2900,2990], [600,2990], [400,2930], [270,2800],
              [230,2720], [230,2620], [210,2600], [210,1900], [50,1880], [50,1320],
              [210,1300], [210,600], [270,400], [400,270], [600,210], [2900,210],
              [2920,50], [3480,50], [3500,210], [5800,210], [6000,270], [6130,400],
              [6170,480], [6170,580], [6190,600], [6190,1300], [6350,1320], [6350,1880],
              [6190,1900], [6190,2600], [6130,2800], [6000,2930], [5800,2990], [3500,2990] ],
  vatTo: [
    // ── BỐN CỔNG THÀNH ────────────────────────────────────────────────────────
    // Đặt LỆCH hẳn sang MỘT BÊN cuống cổng, mép trong của ảnh CHẠM ĐÚNG mép cuống
    // (chồng lấn 0 px2 — đã đo). Cuống cổng đọc thẳng từ `diTrong`:
    //   Bắc  x 2920-3480, y   50- 210      Nam   x 2920-3480, y 2990-3150
    //   Tây  x   50- 210, y 1320-1880      Đông  x 6190-6350, y 1320-1880
    // Bốn tháp lệch theo một chiều KIM ĐỒNG HỒ: Bắc lệch đông · Đông lệch nam ·
    // Nam lệch tây · Tây lệch bắc. Người chơi luôn đi lọt giữa cuống.
    { img:'ct_cong',  x:3520, y:14,   w:472, h:435 },  // Cổng Bắc  — lệch ĐÔNG, chân y=449
    { img:'ct_cong',  x:5878, y:1880, w:472, h:435 },  // Cổng Đông — lệch NAM,  chân y=2315
    { img:'ct_cong',  x:2448, y:2680, w:472, h:435 },  // Cổng Nam  — lệch TÂY,  chân y=3115
    { img:'ct_cong',  x:140,  y:854,  w:472, h:435 },  // Cổng Tây  — lệch BẮC,  chân y=1289

    // ── BA CÔNG TRÌNH CÓ ẢNH ──────────────────────────────────────────────────
    // Cả ba đặt trên HÀNG NHÀ BẮC (khối y 520-860), CHÂN ảnh trùng đúng mép dưới
    // khối (y+h = 860). Đây là chủ ý, không phải tiện tay: mặt tiền của sprite
    // isometric luôn quay xuống dưới, nên nhà hàng bắc quay mặt ra PHỐ LỚN
    // (y≈1600), còn NPC bán hàng đứng ngay phía nam ảnh nên không bị ảnh che.
    // Đặt cùng bộ ảnh này lên hàng nhà nam thì mặt tiền quay ra tường thành và
    // NPC đứng phía bắc sẽ chui ra sau lưng công trình.
    { img:'ct_loren', x:4992, y:368,  w:473, h:472 },  // Lò Rèn Hoàng Gia — khối #10 (5000,520) · Phố Lò
    { img:'ct_duoc',  x:1600, y:436,  w:460, h:424 },  // Tiệm Thuốc       — khối #2  (1600,520) · Phố Chợ
    { img:'ct_vukhi', x:5686, y:526,  w:409, h:334 },  // Vũ Khí Phường    — khối #11 (5660,520) · Phố Lò
  ],
    // ── MƯỜI BA KHỐI CÒN TRỐNG · ĐANG CHỜ ART ────────────────────────────────
    // 16 khối, mới 3 có ảnh (ct_cong dùng hết cho bốn cuống cổng). Khuôn đặt cho mọi khối
    // 460×340:  x = khoi.x − (w − 460)/2   ·   y = khoi.y + 340 − h   (chân trùng mép dưới khối)
    //
    // ĐÃ CÓ NPC ĐỨNG TRƯỚC CỬA, CHỈ THIẾU NHÀ — năm cái này ưu tiên, vì mỗi cái là một
    // chức năng người chơi đã dùng được mà chưa nhìn ra:
    //   #9  (4340, 520) hàng BẮC · ct_caumay    — Sảnh Cầu May   (NPC `thantoan` ở 4570,990)
    //   #8  (3680, 520) hàng BẮC · ct_quantro   — Quán Trọ       (NPC `trachu`   ở 4150,1010)
    //   #3  (2260, 520) hàng BẮC · ct_thapvach  — chòi trông vách (NPC `ah_vachgio` ở 2160,380)
    //   #12 (3680,2340) hàng NAM · ct_saanhlenh — Sảnh Lệnh      (NPC `bodau`     ở 4150,2100)
    //   #7  (2260,2340) hàng NAM · ct_chuong    — dãy chuồng     (NPC `ah_mucdong` ở 2160,2450)
    // ⚠ HAI CÁI HÀNG NAM: mặt tiền sprite isometric luôn quay XUỐNG DƯỚI, nên nhà ở hàng nam
    //   quay mặt ra tường thành. Khi có art thì hoặc xin bản quay ngược, hoặc dời NPC xuống
    //   phía nam khối (y ≥ 2700).
    //
    // CHƯA GÁN VAI — nhà dân nền, một hai kiểu lặp lại là đủ:
    //   #0 (280,520)  #1 (940,520)              hàng bắc, đầu tây
    //   #4 (280,2340) #5 (940,2340) #6 (1600,2340)   hàng nam, đầu tây
    //   #13 (4340,2340) #14 (5000,2340) #15 (5660,2340)  hàng nam, đầu đông
    packs: [], duhiep: null },
  ngoai: { name:'Beast Herd Camp', min:10, range:'14 - 24', type:'safe', ground:'#2d3526', patch:'#6a7a52',
    // ⚠ MAP NÀY DỰNG LẠI TỪ TRANH NHÌN NGANG — xem docs/DUNG_LAI_BON_MAP.md.
    // Tấm nền cũ là tranh SÂN KHẤU: đáy có một dải sàn mỏng, phần trên là trời/núi/tường cây. Mà
    // game.js kéo tranh nền phủ kín thế giới rồi cho đi khắp mặt tranh, nên TRANH NỀN CHÍNH LÀ
    // MẶT ĐẤT — đi lên phía bắc map là đi vào bầu trời. Đó là toàn bộ nguyên nhân của lỗi
    // "nhân vật lơ lửng trên không trung", và không tấm nền phẳng nào chữa được nó.
    //
    // Ba mảng hình học dưới đây SINH BẰNG MÁY, không chấm tay: tools/iso/vung_bon.py. Bộ sinh tự
    // kiểm trước khi in — sàn ≥58%, mọi điểm nội dung nằm TRONG đa giác, điểm tới cách cổng >90px
    // và <400px tính từ rìa map, và cách MỌI trùm vùng ≥700px. Sửa map = sửa tham số rồi chạy
    // lại, đừng sửa tay toạ độ ở đây.
    w:4400, h:3300,
    // Hai vai viên để mặc định (cỏ + đất): đây là đồng cỏ chăn thả, đúng chất liệu gốc.
    sanIso:true,
    village:true, herbs:true, boss:true, trees:0, rocks:0,
    desc:'Đất ngoài thành đang rung — chưa phải trụ, nhưng là dấu hiệu đầu tiên rằng có trụ đang lung lay. Đàn thú của người bản địa vẫn gặm cỏ ở đây, và vẫn chưa ai nói cho chúng biết.',
    spawnFrom:{ ardhaven:{ x:2808, y:211 } },
    spawn:{ x:2758, y:506 },
    voi: 3400,          // `vung.dai` là tỉ lệ của `voi` — đo từ điểm thả tới đỉnh xa nhất
    // ⚠ KHÔNG miền nào mang `tiep:true`. Đây vẫn là "đai 0" — test_bayquai gác đúng chỗ đó
    // (`['corran','ngoai']`), và Kẻ Tiếp Sức là thứ để dành cho map từ cấp 24 trở lên.
    // Sáu miền, dải `dai` RỜI NHAU và tăng dần: vị trí cụm = t × voi, nên dải không chồng ⇒
    // thứ tự cấp theo khoảng cách là đảm bảo tuyệt đối (test_vung §2, test_moblevels).
    // Điểm thả nằm giữa mép BẮC nên cung góc quét vòng nam — tây-nam là phần map rộng nhất.
    vung: [
      { id:'boar_tusk', ten:'Bãi Cỏ Heo Nanh', dai:[0.12,0.24], cung:[55,170], cum:[3,3],
        dan:[{ mob:'boar_tusk', n:18, vai:['nang','can'] }] },
      { id:'wolf_alpha', ten:'Đồi Sói Đầu Đàn', dai:[0.27,0.38], cung:[75,185], cum:[3,3],
        dan:[{ mob:'wolf_alpha', n:18, vai:['can','bay'] }] },
      { id:'bandit_vet', ten:'Trại Cựu Binh Gloam', dai:[0.41,0.52], cung:[40,150], cum:[3,3],
        dan:[{ mob:'bandit_vet', n:15, vai:['xa','can'] }] },
      { id:'caodo_fire', ten:'Vạt Cỏ Cháy', dai:[0.55,0.66], cung:[70,180], cum:[2,2],
        dan:[{ mob:'caodo_fire', n:10 }] },
      { id:'gloam_scout', ten:'Chốt Trinh Sát Gloam', dai:[0.69,0.82], cung:[45,160], cum:[3,3],
        // n chia hết cho số cụm thì _vungChiaDan bù về đều tăm tắp (9/3 → 3·3·3). 12/3 → 5·4·3.
        dan:[{ mob:'gloam_scout', n:12, vai:['xa'] }] },
      { id:'chimera_bo', ten:'Bãi Tượng Vỡ Lệnh', dai:[0.85,1.0], cung:[80,190], cum:[2,2],
        dan:[{ mob:'chimera_bo', n:10, vai:['nang'] }] },
    ],
    diTrong: [
      [2048,3168], [1408,3168], [1248,2944], [1248,2624], [1024,2464], [192,2464],
      [128,2528], [32,2496], [32,64], [64,32], [896,32], [928,128],
      [1088,288], [1536,288], [1728,96], [1856,96], [1920,160], [2304,160],
      [2496,32], [3072,32], [3264,288], [3648,288], [3808,192], [3808,128],
      [3904,32], [3936,64], [3936,448], [3872,512], [3872,640], [3904,672],
      [4160,672], [4256,768], [4256,3008], [4224,3040], [4032,3040], [3968,3104],
      [3584,3104], [3520,3040], [3328,3040], [3264,2976], [3072,2912], [2944,2784],
      [2816,2784], [2752,2912], [2368,2912], [2304,2976], [2240,2976],
    ],
    // LÙM CHẶN nằm TRONG lòng sàn — thứ làm một map rộng có nghĩa. Xem raiCum() trong game.js.
    isoCum: [[192,960], [1728,2816], [2560,2688], [704,832], [704,1536], [3648,2688], [384,2240], [576,192], [3904,1152], [2944,1024], [1344,960], [4032,2432], [1344,2240], [4032,1600], [1920,1792], [2112,2496], [1472,448], [256,512], [3200,2752], [2496,960], [4096,2880], [192,1408]],
    // ĐƯỜNG MÒN nối những chỗ người chơi THẬT SỰ đi (cổng, điểm thả, chỗ hái thuốc). Trên map
    // rộng, luật "đường mòn = dải xa mép nhất" của map làn KHÔNG dùng lại được — xem sanIsoDung().
    isoDuong: [
      [[2688,256], [2452,469], [2177,646], [1987,901], [1833,1192], [1600,1408], [1806,1196], [1984,960], [2206,1163], [2373,1409], [2487,1696], [2636,1955], [2855,2161], [3072,2368], [3146,2058], [3196,1739], [3320,1446], [3506,1176], [3647,890], [3712,576], [3392,583], [3083,436], [2758,506]],
      [[1600,1408], [1322,1610], [1148,1899], [960,2176]],
      [[1984,960], [2020,650], [1856,384]],
      [[3072,2368], [2727,2113], [2304,2048]],
      [[3072,2368], [3373,2180], [3520,1856]],
    ],
    duhiep: null },
  chungnam: { name:'Werebear Woods', min:20, range:'24 - 38', type:'pk', ground:'#1f2a1a', patch:'#4a5a36',
    // ⚠ MAP NÀY NÂNG LÊN CHUẨN CORRAN — xem docs/DUNG_LAI_BON_MAP.md.
    // Nó KHÔNG dính lỗi "lơ lửng trên không trung" (tranh nền nhìn từ trên xuống, không có dải
    // trời), nhưng vẫn là một tấm JPEG phẳng kéo giãn trên khung 2600×1900: không đa giác đi
    // được, chặn bằng vài khối chữ nhật đặt tay, và map càng to thì tranh càng nhoè. Nay lát
    // viên như Rẻo Rừng Corran.
    //
    // Ba mảng hình học dưới đây SINH BẰNG MÁY, không chấm tay: tools/iso/vung_bon.py. Bộ sinh tự
    // kiểm trước khi in — sàn ≥58%, mọi điểm nội dung nằm TRONG đa giác, điểm tới cách cổng >90px
    // và <400px tính từ rìa map, và cách MỌI trùm vùng ≥700px.
    w:4600, h:3400,
    // Bộ viên NỀN RỪNG riêng — lá mục sẫm hơn cỏ của Rẻo Rừng Corran, nên hai khoảnh rừng kề
    // nhau vẫn đọc ra là hai nơi. Trước đó map này dùng CHÍNH tấm nền của Corran (md5 trùng).
    sanIso:true, isoCo:['nen_rung1','nen_rung2','nen_rung3','nen_rung4'],
    isoDat:['nen_mon1','nen_mon2','nen_mon3','nen_mon4'],
    isoVet:['vet_mon1','vet_mon2'],
    herbs:true, boss:true, trees:0, rocks:0,
    desc:'"Trụ Werebear Woods do ta giữ." Một Tướng Quân đơn độc chống đỡ cả cánh rừng — trụ thứ nhất trong năm. Werebear vẫn sống theo bầy ở đây, và chúng hiền cho tới lúc bị chọc.',
    spawnFrom:{ ardhaven:{ x:211, y:776 }, comoc:{ x:2424, y:211 }, daohoa:{ x:4269, y:1080 } },
    spawn:{ x:506, y:966 },
    voi: 4450,          // `vung.dai` là tỉ lệ của `voi` — đo từ điểm thả tới đỉnh xa nhất
    // Sáu miền từ BỐN loài, dải `dai` RỜI NHAU và cấp tăng dần theo khoảng cách:
    // chimera_bo 24 → phando 26 → xanu 31 → bandao 38. Bản cũ 4 miền × 1-2 cụm = 6 bãi trên khổ
    // 2600×1900; khổ mới rộng gấp 3,1 lần nên phải dày theo, nếu không test_domap bắt "map rỗng".
    vung: [
      { id:'chimera_bo', ten:'Bãi Tượng Vỡ Lệnh', dai:[0.12,0.22], cung:[-35,70], cum:[3,3], tiep:true,
        dan:[{ mob:'chimera_bo', n:15, vai:['nang','can'] }] },
      { id:'phando', ten:'Nghĩa Địa Phản Loạn', dai:[0.25,0.36], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'phando', n:18, vai:['can','xa'] }] },
      { id:'phando_xa', ten:'Rẻo Cung Phản Loạn', dai:[0.39,0.49], cung:[-35,70], cum:[3,3], tiep:true,
        dan:[{ mob:'phando', n:15, vai:['xa','nang'] }] },
      { id:'xanu', ten:'Đầm Phun Độc', dai:[0.52,0.63], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'xanu', n:18, vai:['can','phap'] }] },
      { id:'xanu_phap', ten:'Hốc Nhựa Độc', dai:[0.66,0.77], cung:[-35,70], cum:[3,3], tiep:true,
        dan:[{ mob:'xanu', n:15, vai:['phap'] }] },
      { id:'bandao', ten:'Dốc Sa Ngã', dai:[0.80,1.0], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'bandao', n:12, vai:['bay','can'] }] },
    ],
    diTrong: [
      [2176,3296], [1472,3296], [1312,3072], [1312,2880], [1248,2816], [1248,2688],
      [1152,2592], [832,2592], [768,2528], [384,2528], [320,2464], [64,2464],
      [32,2432], [32,64], [64,32], [896,32], [1152,288], [1216,288],
      [1280,352], [1472,352], [1536,288], [1856,224], [2112,32], [3200,32],
      [3296,128], [3296,192], [3520,352], [3712,352], [3776,288], [3872,320],
      [3872,704], [3904,736], [4416,736], [4448,768], [4448,3008], [4352,3104],
      [4288,3104], [4224,3168], [4096,3168], [4032,3232], [3392,3232], [3328,3168],
      [3200,3168], [3008,3040], [2432,3040],
    ],
    isoCum: [[3648,2112], [384,1728], [3712,2944], [2240,640], [4032,1600], [3264,1728], [1536,2944], [1536,512], [1152,1536], [3200,2816], [2432,1536], [576,384], [2112,2368], [2048,3008], [4160,2688], [2688,2816], [256,2240], [1152,2432]],
    isoDuong: [
      [[256,896], [399,1247], [704,1472], [914,1771], [1152,2048], [1482,2035], [1792,1920], [2140,1977], [2432,2176], [2569,1920], [2742,1691], [2967,1501], [3193,1312], [3369,1085], [3501,825], [3648,576], [3330,420], [2985,380], [2626,397], [2304,256], [2564,395], [2824,536], [3105,617], [3405,649], [3697,700], [3966,815], [4224,960], [3938,934], [3652,912], [3366,906], [3080,921], [2794,955], [2508,997], [2222,1035], [1936,1056], [1650,1054], [1364,1034], [1078,1004], [792,977], [506,966]],
      [[1152,2048], [860,2048], [640,2240]],
      [[506,966], [820,890], [1024,640]],
      [[1792,1920], [1627,2220], [1664,2560]],
      [[1792,1920], [2012,1710], [2048,1408]],
      [[2432,2176], [2793,2246], [3136,2112]],
    ],
    duhiep:'duhiep1' },
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
    w:6400, h:1400, ground:'#2f3324', patch:'#6a7a52',
    // SAN LAT VIEN: nen ghep tu hinh thoi 2:1 nuong bang tools/iso/nuong_tile.py, thay cho
    // tam tranh nen bg_loimon.jpg. Xem khoi "SAN LAT VIEN" trong game.js. Vung di duoc van la
    // dung `diTrong` ben duoi -- lat vien chi la chuyen VE, khong doi mot buoc chan nao.
    // `isoCay` de thap hon mac dinh vi `vatDat` ben duoi da dung san hai hang cay men mep loi.
    sanIso:true, isoCay:150,
    // Diem tha cach cong Tay 277px. Ban dau dat o x=200 -- chi 92px, ma ban kinh bat cong la 90:
    // nguoi choi vao map bang duong khac la bi hut nguoc ve Reo Rung Corran ngay lap tuc.
    spawnFrom:{ daohoa:{ x:330, y:779 } }, spawn:{ x:380, y:790 }, trees:0, rocks:0,
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
  // ── MAP KHỞI ĐẦU ─────────────────────────────────────────────────────────────────────
  // Xem ghi chú "HOÁN DẢI CẤP" ở Plant Tribe Glade phía trên: map này nhận dải 1-12, bộ quái
  // nhập môn và bốn cờ làng; tên và lore giữ nguyên. Địa hình (5200x3800, sàn lát viên,
  // `diTrong`/`isoCum`/`isoDuong`) KHÔNG đổi — chúng sinh bằng máy cho chính tấm nền này.
  corran: { name:'Rẻo Rừng Corran', min:1, range:'1 - 12', type:'safe', ground:'#2f3324', patch:'#6a7a52',
    // `ground` la mau to KIN canvas truoc khi ve bat cu thu gi -- tuc la mau cua phan NGOAI da
    // giac `diTrong`, cho vien nen khong lat toi. O map lat vien, cho ay phai doc ra BONG RUNG
    // SAU. Ban cu de '#cfd2ae' (cat nhat, hop voi tam tranh nen mot mieng ngay xua) va anh chup
    // trong game ra mot vien dat trong bet chay quanh map. Loi Mon doi theo cung ly do.
    // MAP KHAM PHA RONG -- 5200x3800, gap doi ban cu 2600x1900 theo ca hai chieu.
    //
    // Hinh HANH LANG cua Loi Mon hop PHO BAN, khong hop map kham pha: hai ben bit kin, mot
    // duong tien, khong co cho de lech. Map nay di huong nguoc lai -- rong, san 80,7%, va thu
    // tao ra lua chon la LUM CHAN nam TRONG long san (`isoCum`), khong phai vach o hai ben.
    //
    // Ca ba mang duoi day SINH BANG MAY, khong cham tay: tools/iso/vung_rong.py. Bo sinh tu
    // kiem truoc khi in ra -- san >=58%, moi diem noi dung (cong, diem tha, diem toi, cho hai
    // thuoc, 4 trum vung) phai nam TRONG da giac, va diem toi phai cach trum >=700px. Sua map
    // = sua tham so roi chay lai, dung sua tay toa do o day.
    w:5200, h:3800, sanIso:true,
    // Ba lối rìa cũ (Werebear Woods · Lối Mòn · Trũng Nứt) đã theo dải cấp sang Plant Tribe
    // Glade. Còn đúng MỘT cửa: Cổng Tây của thành. Điểm tới dùng lại chỗ (311,973) mà bộ sinh
    // đã dò cho cổng tây cũ — nó nằm trong đa giác sàn và cách cổng 127px.
    spawnFrom:{ ardhaven:{ x:311, y:973 } },
    spawn:{ x:506, y:1158 }, village:true, spring:true, herbs:true, boss:true, trees:0, rocks:0,
    desc:'Khoảnh rừng Corran giữ riêng — bãi săn của người mới. Chimera yếu, đồ rơi nhập môn, chỗ hiền lành để học cách chơi. Ông ấy không nói vì sao lại giữ.',
    voi: 3400,          // gap doi theo map -- `vung.dai` la ti le cua `voi`
    // Dải 38-42 bắc cầu giữa Werebear Woods (kết ở C38 `bandao`) và Bug Tribe Tunnels (mở ở
    // C42 `thinu`) — dùng lại đúng hai loài ấy nên người chơi đi qua thấy liền mạch, không
    // gặp loài lạ chen ngang giữa hai vùng.
    // ⚠ MAP TO RA THI NOI DUNG PHAI TO THEO. Map nay rong gap 3,6 lan ban cu ma van giu nguyen
    // 3 mien x 2 cum = 6 bai quai; test_domap bat dung ca hai trieu chung: "mat do 0,82 (san
    // 1,3) -- map rong" va "duong kinh 4680px -- di bo suong". Do la cai bay "rong = trong" da
    // ghi o dau tools/iso/vung_rong.py, lan nay hien ra o so lieu chu khong o hinh anh.
    //
    // Nay 5 mien x 3 cum = 15 bai. Hai mien moi dat o hai CUNG GOC khac han (bac va nam) chu
    // khong keo dai them theo truc dong-tay: keo dai truc thi duong kinh cang phinh, con rai
    // ra hai ben thi lap day chinh cho dang trong.
    // ⚠ KHÔNG miền nào mang `tiep:true`. "Đai 0" (map tân thủ) không được có Kẻ Tiếp Sức —
    // test_bayquai gác đúng chỗ đó, và bộ quái 1-12 này vốn chưa bao giờ có.
    // Bảy miền, dải `dai` RỜI NHAU và tăng dần theo cấp — đây là điều kiện của `test_moblevels`
    // (cụm ở xa hơn không được yếu hơn) và nó chặt hơn bộ năm miền cũ, vốn để hai miền phụ đè
    // dải lên nhau vì cả hai cùng cấp. Cung góc lấy lại đúng ba hướng mà bộ sinh đã dò được
    // sàn cho map này: trục đông (-43..67), quạt bắc (-95..-35) và quạt nam (95..155).
    vung: [
      { id:'boar', ten:'Đồng Heo Rừng', dai:[0.14,0.26], cung:[-30,45], cum:[3,3],
        dan:[{ mob:'boar', n:15 }] },   // C1 · Axie Heo Rừng
      { id:'hautu', ten:'Ruộng Bí Ngô', dai:[0.30,0.38], cung:[-95,-35], cum:[2,2],
        dan:[{ mob:'hautu', n:8 }] },   // C2 · Axie Bí Ngô
      { id:'wolf', ten:'Bìa Rừng Gai Tím', dai:[0.42,0.52], cung:[10,85], cum:[3,3],
        dan:[{ mob:'wolf', n:16 }] },   // C4 · Axie Gai Tím
      { id:'bandit', ten:'Trại Tay Sai Gloam', dai:[0.56,0.64], cung:[-15,60], cum:[3,3],
        dan:[{ mob:'bandit', n:20, vai:['can','xa'] }] },   // C6 · Tay Sai Gloam — loài chủ đạo của map
      { id:'caodo', ten:'Vạt Cỏ Dại', dai:[0.68,0.76], cung:[55,110], cum:[2,2],
        dan:[{ mob:'caodo', n:8 }] },   // C8 · Axie Cỏ Dại
      { id:'assassin', ten:'Ngã Ba Cướp Đường', dai:[0.80,0.86], cung:[10,85], cum:[2,2],
        dan:[{ mob:'assassin', n:3 }] },   // C10 · Cướp Đường Gloam (elite — giữ thưa)
      { id:'trannhan', ten:'Hàng Tượng Canh Cổng', dai:[0.90,1.0], cung:[-15,60], cum:[3,3],
        dan:[{ mob:'trannhan', n:7 }] },   // C12 · Tượng Đá Canh Cổng
    ],
    diTrong: [
      [4544,3680], [3456,3680], [3360,3584], [3360,3520], [3136,3360], [2688,3360],
      [2528,3456], [2400,3584], [2368,3680], [512,3680], [320,3488], [256,3488],
      [192,3424], [64,3424], [32,3392], [32,896], [288,832], [288,640],
      [352,576], [352,384], [480,256], [480,192], [640,32], [1024,32],
      [1120,128], [1152,224], [1408,416], [1664,416], [1856,288], [1952,448],
      [1952,1024], [1984,1056], [2176,1056], [2240,992], [2368,992], [2432,928],
      [2624,928], [2688,864], [2816,864], [2848,832], [2848,384], [2912,320],
      [2976,128], [3072,32], [3648,32], [3680,192], [3840,352], [3904,352],
      [3968,416], [4224,416], [4288,352], [4352,352], [4384,448], [4480,544],
      [4608,544], [4800,416], [5056,416], [5088,448], [5088,1984], [4960,2112],
      [4960,2240], [5088,2368], [5088,3200], [4992,3360], [4928,3360], [4800,3488],
      [4672,3488], [4640,3584],
    ],
    // LUM CHAN nam TRONG long san -- thu lam mot map rong co nghia. Xem raiCum() trong game.js.
    isoCum: [[3520,960], [2752,2880], [1984,2624], [3584,512], [2176,1728], [1024,3264], [4288,704], [1728,3456], [3200,3072], [4416,3264], [3520,3456], [3840,2944], [2176,1280], [2112,3136], [704,2560], [1792,2176], [320,3200], [704,1856], [4224,2688], [4864,2880], [3904,2048], [3072,768], [4800,2112], [2880,2368], [1344,2176], [1088,2816], [1536,2752], [1728,1344], [4160,1216], [3136,320], [896,1152], [3328,2304],],
    // DUONG MON noi nhung cho nguoi choi that su di (cong, diem tha, cho hai thuoc). Tren map
    // rong, luat "duong mon = dai xa mep nhat" cua map lan KHONG dung lai duoc -- xem sanIsoDung().
    isoDuong: [
      [[256,1088], [592,832], [768,448], [1043,717], [1344,960], [1572,804], [1728,576], [2020,687], [2315,796], [2547,1013], [2780,1229], [3072,1344], [3451,1430], [3840,1408], [4140,1631], [4480,1792], [4649,1545], [4699,1257], [4706,954], [4864,704],],
      [[256,1088], [242,1383], [178,1681], [227,1974], [328,2264], [320,2560],],
      [[1344,960], [1201,1282], [1053,1603], [1061,1969], [960,2304],],
      [[1344,960], [1325,1256], [1440,1522], [1536,1792],],
      [[3072,1344], [2908,1574], [2700,1778], [2591,2040], [2526,2327], [2368,2560],],
      [[3072,1344], [3142,1681], [3392,1920],],
      [[4480,1792], [4377,2080], [4480,2368],],
    ],
    // Map an toàn cấp 1-12 thì không có Axie Lang Thang để PK — cờ này theo dải cấp sang
    // Plant Tribe Glade cùng với `type:'pk'`.
    duhiep: null },
  // ═══ NGA BA THAT ═══════════════════════════════════════════════════════════════════════
  // Do do thi the gioi thi ra mot dieu bat ngo: no DA la hinh cay (Sapidae Chiefdom 4 nhanh,
  // Werebear Woods 3 nhanh), NHUNG noi dung van la mot duong thang -- cac nhanh noi duoi nhau
  // ve CAP, nen o bat ky cap nao cung chi dung mot nhanh hop. Re khong phai lua chon, no la
  // duong di tiep khoac ao nga ba. Ca game chi co mot cap trung dai cap (corran 38-42 va
  // loimon 42-48), ma loimon lai la dau cut cua corran.
  //
  // Map nay lam nga do thanh THAT: hai nhanh cung dai cap treo tren cung mot nga, khac nhau o
  // thu chung CHO chu khong o cap.
  //
  //     corran (38-42)
  //      ├─ DONG → Loi Mon Corran   42-48 · pk     · hanh lang · cut, phai quay lai
  //      └─ BAC  → Trung Nut Corran 44-50 · freepk · rong      · DI TIEP sang comoc
  //
  // Chon theo HAI truc cung luc: an toan ↔ rui ro, va duong vong ↔ duong tat. Mot truc thoi
  // thi chua thanh quyet dinh -- "nguy hiem hon nhung cung xa hon" thi khong ai chon, con
  // "nguy hiem hon ma gan hon" thi co.
  //
  // Ba mang hinh hoc sinh bang tools/iso/sinh_trungnut.py, khong cham tay toa do nao. Bo sinh
  // tu kiem truoc khi in: san >=58%, moi diem noi dung nam TRONG da giac, diem toi cach cong
  // >90px (ban kinh bat cong) va <400px tinh tu ria map, va cach moi trum vung >=700px.
  trungnut: { name:'Trũng Nứt Corran', min:44, range:'44 - 50', type:'freepk',
    w:4200, h:3200, ground:'#2f3324', patch:'#6a7a52', sanIso:true,
    spawnFrom:{ daohoa:{ x:706, y:2845 }, comoc:{ x:3805, y:770 } },
    spawn:{ x:666, y:2640 }, trees:0, rocks:0,
    desc:'Đất trũng xuống nơi vết nứt đi qua. Không ai giữ chỗ này, nên ai cũng lấy được — kể cả lấy của nhau.',
    voi: 2800,
    // Cung loai quai voi Loi Mon: hai nhanh phai la mot LUA CHON, khong phai hai vung xa la.
    // Cai khac nhau la LUAT (freepk) va DUONG DI (di tiep duoc), khong phai bang quai.
    vung: [
      { id:'thinu', ten:'Miệng Trũng', dai:[0.16,0.42], cung:[-40,40], cum:[3,3], tiep:true,
        dan:[{ mob:'thinu', n:13, vai:['can','phap'] }] },
      { id:'mocnhan', ten:'Lòng Trũng', dai:[0.46,0.72], cung:[-25,55], cum:[3,3], tiep:true,
        dan:[{ mob:'mocnhan', n:14, vai:['can','xa'] }] },
      { id:'bandao', ten:'Mép Nứt Đông', dai:[0.74,1.0], cung:[-15,65], cum:[3,3], tiep:true,
        dan:[{ mob:'bandao', n:14 }] },
      { id:'mocnhan2', ten:'Vệt Nứt Nam', dai:[0.36,0.64], cung:[80,140], cum:[3,3], tiep:true,
        dan:[{ mob:'mocnhan', n:13, vai:['can','phap'] }] },
    ],
    diTrong: [
      [2624,3104], [2240,3104], [2176,3040], [2048,3040], [1760,2752], [1728,2656],
      [1536,2656], [1024,3104], [384,3104], [320,3040], [128,3040], [32,2944],
      [32,832], [192,800], [384,672], [448,736], [832,736], [928,640],
      [928,448], [1088,224], [1152,288], [1344,288], [1408,224], [1472,224],
      [1664,32], [1920,32], [2048,160], [2368,160], [2432,224], [2624,224],
      [2688,288], [2880,288], [3136,96], [3520,96], [3584,160], [3648,160],
      [3904,416], [4032,416], [4064,448], [4064,2240], [4032,2272], [3840,2272],
      [3584,2592], [3520,2592], [3456,2656], [3264,2656], [3072,2912], [2880,2912],
    ],
    isoCum: [[3456,320], [3520,1600], [1216,2624], [2752,896], [3776,1984], [2496,2176], [1920,2624], [1664,2048], [3776,1280], [1792,640], [1856,1088], [2240,576], [3328,2496], [320,1600], [1152,1920], [1408,1024], [2048,2176], [256,1152], [2432,2816], [192,2688], [1792,192], [2496,1728],],
    isoDuong: [
      [[576,2880], [590,2596], [658,2315], [710,2033], [692,1748], [630,1463], [603,1178], [640,896], [865,1192], [1233,1319], [1472,1600], [1735,1441], [2065,1428], [2304,1216], [2634,1344], [2880,1600], [3117,1342], [3264,1024], [3572,862], [3840,640],],
      [[576,2880], [525,2548], [350,2269], [192,1984],],
      [[640,896], [1034,829], [1344,576],],
      [[2304,1216], [2139,1515], [2176,1856],],
      [[3264,1024], [3048,663], [2688,448],],
      [[2880,1600], [2816,1925], [2890,2242], [2944,2560],],
    ],
    duhiep:'duhiep2' },
  comoc: { name:'Bug Tribe Tunnels', min:40, range:'42 - 56', type:'pk', ground:'#2a2318', patch:'#6a5a38',
    // ⚠ MAP NÀY NÂNG LÊN CHUẨN CORRAN — xem docs/DUNG_LAI_BON_MAP.md.
    // Nó KHÔNG dính lỗi "lơ lửng trên không trung" (tranh nền nhìn từ trên xuống, không có dải
    // trời), nhưng vẫn là một tấm JPEG phẳng kéo giãn trên khung 2600×1900: không đa giác đi
    // được, chặn bằng vài khối chữ nhật đặt tay, và map càng to thì tranh càng nhoè. Nay lát
    // viên như Rẻo Rừng Corran.
    //
    // Ba mảng hình học dưới đây SINH BẰNG MÁY, không chấm tay: tools/iso/vung_bon.py. Bộ sinh tự
    // kiểm trước khi in — sàn ≥58%, mọi điểm nội dung nằm TRONG đa giác, điểm tới cách cổng >90px
    // và <400px tính từ rìa map, và cách MỌI trùm vùng ≥700px.
    w:4800, h:3600,
    // Bộ viên SÀN TỔ riêng — vỏ kitin ngả vàng, lối hang giẫm mòn sẫm hơn.
    sanIso:true, isoCo:['nen_to1','nen_to2','nen_to3','nen_to4'],
    isoDat:['nen_hang1','nen_hang2','nen_hang3','nen_hang4'],
    isoVet:['vet_hang1','vet_hang2'],
    herbs:true, boss:true, trees:0, rocks:0,
    desc:'Trụ Roost đóng thẳng xuống giữa ổ ấp. Bug Tribe Tunnels thì thầm: thứ nở ra ở đây không còn là Axie nữa.',
    spawnFrom:{ chungnam:{ x:1608, y:3309 }, trungnut:{ x:211, y:776 }, caungam:{ x:4525, y:1144 }, mongco:{ x:2936, y:211 } },
    spawn:{ x:1658, y:3014 },
    voi: 3900,          // `vung.dai` là tỉ lệ của `voi` — đo từ điểm thả tới đỉnh xa nhất
    // ⚠ CUNG GÓC PHẢI QUAY VỀ PHÍA MAP THẬT SỰ TRẢI RA. Điểm thả của map này nằm giữa mép NAM,
    // nên đất nằm ở phía BẮC — góc tới các đỉnh xa của đa giác đo được là −119°…−36° (0° = đông,
    // 90° = nam). Bản đầu tôi chép cung [−15,90] của map cũ, hồi điểm thả còn ở góc TÂY-BẮC:
    // quạt ấy trỏ ra đông/nam, tức ra ngoài bản đồ. Miền gần còn bốc được chỗ, miền xa nhất
    // (`huyetbat_bay`, dai 0,82-1,0) hết sạch 500 lần bốc × 3 vòng nới ⇒ ra 0 cụm, im lặng —
    // test_vung bắt bằng "dân số trôi khỏi khai báo: huyetbat 18≠30".
    // Sáu miền từ BA loài: thinu 42 → mocnhan 48 → huyetbat 56. Một miền của mỗi loài giữ
    // nguyên vai gốc, miền kia đổi hồ sơ vai — đúng cơ chế A1 (vai gán theo BÃI, không theo loài).
    vung: [
      { id:'thinu', ten:'Ổ Ấp Thị Nữ', dai:[0.12,0.22], cung:[-125,-25], cum:[3,3], tiep:true,
        dan:[{ mob:'thinu', n:18, vai:['can','phap'] }] },
      { id:'thinu_nang', ten:'Buồng Kén Dày', dai:[0.25,0.35], cung:[-115,-20], cum:[3,3], tiep:true,
        dan:[{ mob:'thinu', n:15, vai:['nang','can'] }] },
      { id:'mocnhan', ten:'Mạng Mộc Nhân', dai:[0.38,0.49], cung:[-125,-25], cum:[3,3], tiep:true,
        dan:[{ mob:'mocnhan', n:18, vai:['can','xa'] }] },
      { id:'mocnhan_phap', ten:'Hốc Nhả Tơ', dai:[0.52,0.62], cung:[-115,-20], cum:[3,3], tiep:true,
        dan:[{ mob:'mocnhan', n:15, vai:['phap','xa'] }] },
      { id:'huyetbat', ten:'Hang Huyết Bức', dai:[0.65,0.79], cung:[-125,-30], cum:[3,3], tiep:true,
        dan:[{ mob:'huyetbat', n:18, vai:['bay','can'] }] },
      { id:'huyetbat_bay', ten:'Vòm Treo Ngược', dai:[0.82,1.0], cung:[-120,-35], cum:[3,3], tiep:true,
        dan:[{ mob:'huyetbat', n:12, vai:['bay','nang'] }] },
    ],
    diTrong: [
      [2304,3488], [1536,3488], [1376,3200], [1376,2880], [1216,2720], [1152,2720],
      [1088,2656], [64,2656], [32,2624], [32,64], [64,32], [960,32],
      [1056,128], [1056,192], [1280,352], [1600,352], [1856,160], [1920,160],
      [1984,224], [2304,224], [2624,32], [3392,32], [3488,128], [3488,192],
      [3712,352], [3968,352], [4032,288], [4096,288], [4192,192], [4224,96],
      [4256,128], [4256,448], [4128,640], [4128,768], [4288,800], [4352,736],
      [4544,736], [4704,832], [4704,3264], [4544,3360], [4352,3360], [4288,3424],
      [3840,3424], [3776,3360], [3456,3296], [3264,3168], [3072,3168], [3008,3232],
      [2944,3232], [2880,3168], [2688,3168], [2624,3232], [2432,3296], [2336,3392],
    ],
    isoCum: [[1728,1984], [3584,2944], [2304,2688], [3072,2688], [256,1408], [4160,3264], [256,2368], [4480,1600], [4416,2816], [2432,2176], [960,512], [4416,2112], [4032,1664], [3712,2496], [448,1856], [192,192], [1472,1536], [832,2496], [2816,1920], [3200,2240]],
    isoDuong: [
      [[1728,3264], [1625,3000], [1565,2718], [1507,2436], [1407,2170], [1258,1924], [1099,1682], [974,1426], [896,1152], [1133,941], [1344,704], [1607,889], [1755,1189], [1962,1430], [2240,1600], [2618,1492], [3008,1536], [3142,1279], [3403,1122], [3596,911], [3712,640], [3423,644], [3132,634], [2842,627], [2553,637], [2267,673], [1981,731], [1697,798], [1411,857], [1125,894], [836,907], [546,902], [256,896], [537,919], [818,951], [1099,985], [1380,1011], [1661,1024], [1943,1021], [2226,1002], [2508,975], [2791,948], [3074,929], [3356,925], [3637,937], [3918,962], [4199,994], [4480,1024], [4224,850], [3938,740], [3625,689], [3332,597], [3075,424], [2816,256], [2689,527], [2538,788], [2388,1049], [2262,1321], [2170,1607], [2101,1902], [2029,2197], [1933,2480], [1804,2751], [1658,3014]],
      [[256,896], [478,650], [512,320]],
      [[1658,3014], [1536,2706], [1304,2479], [1088,2240]],
      [[1344,704], [1737,774], [2112,640]],
      [[1728,3264], [2030,3259], [2292,3125], [2560,3008]],
      [[3008,1536], [3196,1837], [3520,1984]],
    ],
    duhiep:'duhiep2' },
  // ── AQUATIC TRIBE CAUSEWAY ────────────────────────────────────────────────────────────────
  // Cắt từ chính tấm tranh hang Tầng Sâu (bg_dungeon_stone.jpg) bằng tools/iso/cat_caungam.py:
  // lối đá SÁNG và NHẠT MÀU, nước thì tối và ngả lam, nên vùng đi được suy thẳng ra từ màu chứ
  // không chấm tay. Sửa tranh hay đổi hệ số kéo thì CHẠY LẠI công cụ rồi dán đè, đừng sửa số.
  //
  // Vì sao map này là HÀNH LANG chứ không phải đồng trống: con đường trong tranh đi từ thềm
  // tây-bắc xuống, bẻ qua cây cầu vòm, rồi sang thềm đông và thõng một mũi xuống nam. Sàn chỉ
  // 30,5% khổ map — đúng định nghĩa hành lang, và `test_sandat` gác nó bằng phép khác (chỗ
  // thắt nhất 376px, trên ngưỡng 340).
  //
  // Vì sao nó nối Bug Tribe Tunnels với Bird Tribe Heights: Bird Tribe Heights trước nay CHỈ tới
  // được bằng cổng thành, không có lối rìa nào — cả dải 56-62 vì thế là một khoảng trống, người
  // chơi rời hang là phải quay về thành. Lối này lấp đúng khoảng ấy.
  caungam: { name:'Aquatic Tribe Causeway', min:54, range:'56 - 62', type:'pk', hinh:'hanhlang',
    w:2803, h:2808, ground:'#3a4450', patch:'#2a3038',
    spawnFrom:{ comoc:{ x:330, y:500 }, tuyettinh:{ x:1850, y:2600 } },
    spawn:{ x:470, y:620 }, trees:0, rocks:0,
    // ── SÀN LÁT VIÊN ISOMETRIC ────────────────────────────────────────────────────────────
    // Map đầu tiên chuyển khỏi nền tranh nhìn ngang. Chọn caungam mở màn vì nó ĐÃ có sẵn đa
    // giác 133 đỉnh — phần tốn công nhất đã xong, nên nếu cơ chế có chỗ hụt thì lộ ra ngay mà
    // không tốn công chấm lại.
    //
    // Đây là NHỊP ĐÁ VẮT QUA HỒ NGẦM, nên:
    //   isoCo  = sỏi vụn  — vai "rìa", vành sát mép cầu nơi đá vỡ dồn lại
    //   isoDat = phiến đá — vai "lối mòn", tức LÒNG CẦU
    //
    // ⚠ HAI VAI NÀY DỄ GÁN NGƯỢC, và mình đã gán ngược lần đầu. Trên map dạng LÀN, sanIsoDung()
    // coi "đất" là dải XA MÉP NHẤT — tức lối người ta giẫm. Nhịp đá thì gần như cả lòng cầu là
    // lối, nên vai "đất" phủ gần hết map. Gán isoDat = sỏi thì cả cây cầu ngập một sắc nâu cát,
    // nhìn ra một cái sân chứ không ra nhịp đá bắc qua hồ. Đảo lại: lòng cầu là phiến đá, sỏi
    // lùi về rìa — đúng chỗ đá vỡ thật sự dồn.
    //   isoCay = 0 — cây mọc NGOÀI đa giác trong vành 300px, mà ngoài đa giác ở đây là MẶT
    //            NƯỚC. Để mặc định là mọc một hàng cây giữa lòng hồ.
    //   isoNho — rêu và đá vụn trong lòng lối, đúng thứ bám trên đá ướt.
    sanIso:true, isoCo:['nen_duong1','nen_duong2','nen_duong3','nen_duong4'],
    isoDat:['nen_da1','nen_da2','nen_da3','nen_da4'],
    isoCay:0, isoNho:170,
    desc:'Nhịp đá vắt qua một hồ ngầm không đáy. Một lối, không có đường vòng — thứ chặn đường bạn phải dọn, không né được.',
    voi: 2600,
    vung: [
      // ⚠ CUNG GÓC PHẢI RỘNG TRÊN MAP DẠNG LÀN. Bản đầu bó mỗi miền vào một quạt hẹp (50-72°…)
      // theo đúng hướng con đường, và nó PHẢN TÁC DỤNG: làn đã chặt sẵn, quạt hẹp thì gần hết
      // 500 lần bốc mẫu rơi ra ngoài đa giác, _vungDatCum() phải nới giãn cách hai lần, và cụm
      // cuối cùng đậu cách trùm vùng 220px — `test_bossplace` bắt ngay ("boss đè lên tâm bãi").
      // Để quạt rộng thì chính đa giác làm việc lọc, còn `dai` giữ nguyên bậc thang cấp quái.
      { id:'huyetbat', ten:'Thềm Đá Ướt', dai:[0.14,0.42], cung:[15,95], cum:[2,3], tiep:true,
        dan:[{ mob:'huyetbat', n:12, vai:['can','xa'] }] },        // C56
      { id:'reunuoc', ten:'Đầu Cầu Rêu', dai:[0.46,0.72], cung:[15,95], cum:[3,3], tiep:true,
        dan:[{ mob:'reunuoc', n:16, vai:['can','phap'] }] },       // C59 — loài riêng của map này
      { id:'ttdetu', ten:'Thềm Đông', dai:[0.76,1.0], cung:[15,95], cum:[2,3], tiep:true,
        dan:[{ mob:'ttdetu', n:12, vai:['can','nang'] }] },        // C62
    ],
    diTrong: [
      [2226,2773], [1775,2773], [1774,2691], [1757,2685], [1757,2372], [1702,2370],
      [1700,2359], [1627,2348], [1625,2304], [1614,2288], [1568,2278], [1567,2265],
      [1555,2262], [1555,2041], [1543,2040], [1537,2026], [1512,2026], [1506,2001],
      [1431,2001], [1411,1989], [1410,1963], [1396,1960], [1396,1932], [1385,1929],
      [1378,1908], [1347,1908], [1341,1894], [1310,1894], [1292,1882], [1291,1863],
      [1249,1863], [1210,1847], [1207,1746], [750,1746], [749,1688], [664,1684],
      [662,1624], [645,1621], [645,1602], [613,1600], [608,1572], [571,1572],
      [570,1554], [559,1551], [547,1372], [531,1369], [514,1319], [462,1317],
      [420,1303], [406,1261], [294,1259], [284,1252], [284,1235], [256,1221],
      [256,1173], [228,1156], [228,1140], [181,1134], [181,1056], [158,1053],
      [155,918], [144,916], [144,473], [189,470], [189,288], [203,283],
      [203,244], [276,241], [276,221], [290,207], [294,144], [687,146],
      [687,336], [696,339], [699,386], [753,391], [764,407], [869,409],
      [869,426], [892,448], [895,602], [925,605], [925,666], [962,669],
      [965,714], [983,715], [984,734], [995,739], [995,907], [1071,910],
      [1071,1002], [1085,1005], [1085,1184], [1100,1205], [1179,1208], [1204,1228],
      [1208,1260], [1228,1268], [1229,1298], [1289,1299], [1294,1427], [1708,1427],
      [1711,1469], [1887,1469], [1890,1491], [1915,1491], [1925,1501], [1926,1533],
      [2041,1533], [2044,1611], [2470,1611], [2471,1669], [2520,1670], [2523,1709],
      [2659,1714], [2659,2111], [2645,2114], [2643,2129], [2568,2129], [2531,2149],
      [2489,2152], [2486,2177], [2407,2190], [2404,2565], [2376,2573], [2369,2605],
      [2342,2607], [2342,2708], [2313,2709], [2310,2720], [2276,2720], [2274,2743],
      [2229,2743],
    ],
    duhiep:'duhiep2' },
  tuyettinh: { name:'Bird Tribe Heights', min:60, range:'62 - 78', type:'pk', ground:'#2b3138', patch:'#6a7280',
    // ⚠ MAP NÀY DỰNG LẠI TỪ TRANH NHÌN NGANG — xem docs/DUNG_LAI_BON_MAP.md.
    // Tấm nền cũ là tranh SÂN KHẤU: đáy có một dải sàn mỏng, phần trên là trời/núi/tường cây. Mà
    // game.js kéo tranh nền phủ kín thế giới rồi cho đi khắp mặt tranh, nên TRANH NỀN CHÍNH LÀ
    // MẶT ĐẤT — đi lên phía bắc map là đi vào bầu trời. Đó là toàn bộ nguyên nhân của lỗi
    // "nhân vật lơ lửng trên không trung", và không tấm nền phẳng nào chữa được nó.
    //
    // Ba mảng hình học dưới đây SINH BẰNG MÁY, không chấm tay: tools/iso/vung_bon.py. Bộ sinh tự
    // kiểm trước khi in — sàn ≥58%, mọi điểm nội dung nằm TRONG đa giác, điểm tới cách cổng >90px
    // và <400px tính từ rìa map, và cách MỌI trùm vùng ≥700px. Sửa map = sửa tham số rồi chạy
    // lại, đừng sửa tay toạ độ ở đây.
    w:4800, h:3600,
    // Bộ viên TUYẾT riêng, nướng ở tools/iso/nuong_biome.py — trước đó map này mượn viên đá
    // của thành và viên đường, nên "vết sẹo băng" đọc ra thành một cao nguyên lát đá.
    sanIso:true, isoCo:['nen_tuyet1','nen_tuyet2','nen_tuyet3','nen_tuyet4'],
    isoDat:['nen_bang1','nen_bang2','nen_bang3','nen_bang4'],
    isoVet:['vet_bang1','vet_bang2'],
    herbs:true, boss:true, trees:0, rocks:0,
    desc:'Băng của Bird Tribe Heights là vết sẹo, không phải thời tiết. Bãi EXP khổng lồ — mang theo kháng độc, Chimera ở đây cắn có nọc.',
    spawnFrom:{ ardhaven:{ x:211, y:776 }, caungam:{ x:2232, y:211 } },
    spawn:{ x:506, y:966 },
    voi: 4700,          // `vung.dai` là tỉ lệ của `voi` — đo từ điểm thả tới đỉnh xa nhất
    // Sáu miền từ BA loài: cùng một loài, cụm này Xạ Thủ cụm kia Pháp Sư — đúng cơ chế A1
    // (vai gán theo BÃI, không theo loài). Ba loài × sáu hồ sơ vai, không tốn một tệp art nào.
    // Bản cũ chỉ có 3 miền × 2 cụm = 6 bãi trên khổ 2600×1900; khổ mới rộng gấp 3,5 lần nên
    // 6 miền × 3 cụm = 18 bãi, nếu không thì test_domap bắt "mật độ — map rỗng".
    vung: [
      { id:'ttdetu', ten:'Thềm Băng Thấp', dai:[0.12,0.22], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'ttdetu', n:18, vai:['can','nang'] }] },
      { id:'ttdetu_cao', ten:'Vách Gió Cắt', dai:[0.25,0.35], cung:[-20,75], cum:[3,3], tiep:true,
        dan:[{ mob:'ttdetu', n:15, vai:['nang'] }] },
      { id:'docyeu', ten:'Ổ Cầu Gai', dai:[0.38,0.50], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'docyeu', n:18, vai:['can','phap'] }] },
      { id:'docyeu_toc', ten:'Hốc Nhả Nọc', dai:[0.53,0.64], cung:[-15,85], cum:[3,3], tiep:true,
        dan:[{ mob:'docyeu', n:15, vai:['phap','xa'] }] },
      { id:'satthuhy', ten:'Rẻo Sương Mù', dai:[0.67,0.81], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'satthuhy', n:15, vai:['bay','xa'] }] },
      { id:'satthuhy_dinh', ten:'Đỉnh Tổ Trống', dai:[0.84,1.0], cung:[-15,85], cum:[3,3], tiep:true,
        dan:[{ mob:'satthuhy', n:12, vai:['can','bay'] }] },
    ],
    diTrong: [
      [2304,3488], [1536,3488], [1472,3360], [1152,3360], [1088,3296], [768,3296],
      [704,3232], [576,3232], [512,3168], [384,3168], [192,3040], [128,3040],
      [32,2944], [32,64], [64,32], [960,32], [1056,128], [1056,192],
      [1280,352], [1600,352], [1760,256], [1920,32], [3392,32], [3488,128],
      [3488,192], [3712,352], [3968,352], [4032,288], [4064,320], [4064,384],
      [4128,448], [4128,768], [4160,800], [4288,800], [4352,736], [4544,736],
      [4704,832], [4704,3072], [4480,3296], [4416,3296], [4352,3360], [3904,3360],
      [3712,3232], [2944,3232], [2880,3168], [2688,3168], [2624,3232], [2432,3296],
      [2336,3392],
    ],
    // LÙM CHẶN nằm TRONG lòng sàn — thứ làm một map rộng có nghĩa. Xem raiCum() trong game.js.
    isoCum: [[960,2880], [3072,1472], [3712,2368], [3328,3072], [2432,1984], [4288,1984], [2880,2560], [4416,1344], [3648,640], [2432,2624], [2624,1216], [4416,2432], [2752,3008], [704,320], [1024,2304], [2688,192], [1792,2944], [3840,1920], [384,1728], [3200,640], [1472,2432], [2240,1472], [512,2368], [2496,640], [3392,1792], [3072,2112], [4032,1024], [320,2816], [1088,1088], [1984,2368], [192,192], [1280,3200], [2112,1024], [4416,3072], [2304,3136], [3776,2816], [3584,1088], [3136,192], [1792,1408], [3328,2624]],
    // ĐƯỜNG MÒN nối những chỗ người chơi THẬT SỰ đi (cổng, điểm thả, chỗ hái thuốc). Trên map
    // rộng, luật "đường mòn = dải xa mép nhất" của map làn KHÔNG dùng lại được — xem sanIsoDung().
    isoDuong: [
      [[256,896], [402,1225], [657,1471], [896,1728], [1120,1540], [1339,1349], [1509,1114], [1644,847], [1799,599], [2005,396], [2232,211], [2154,185], [2112,256], [1858,406], [1615,580], [1340,681], [1038,722], [756,807], [506,966]],
      [[256,896], [330,800], [211,776]],
      [[896,1728], [1181,1792], [1466,1862], [1760,1770], [2048,1792]],
    ],
    duhiep:'duhiep2' },
  mongco: { name:'Reptile Sunstone Flats', min:80, range:'84 - 100', type:'pk', ground:'#3a2f22', patch:'#8a6a42',
    // ⚠ MAP NÀY DỰNG LẠI TỪ TRANH NHÌN NGANG — xem docs/DUNG_LAI_BON_MAP.md.
    // Tấm nền cũ là tranh SÂN KHẤU: đáy có một dải sàn mỏng, phần trên là trời/núi/tường cây. Mà
    // game.js kéo tranh nền phủ kín thế giới rồi cho đi khắp mặt tranh, nên TRANH NỀN CHÍNH LÀ
    // MẶT ĐẤT — đi lên phía bắc map là đi vào bầu trời. Đó là toàn bộ nguyên nhân của lỗi
    // "nhân vật lơ lửng trên không trung", và không tấm nền phẳng nào chữa được nó.
    //
    // Ba mảng hình học dưới đây SINH BẰNG MÁY, không chấm tay: tools/iso/vung_bon.py. Bộ sinh tự
    // kiểm trước khi in — sàn ≥58%, mọi điểm nội dung nằm TRONG đa giác, điểm tới cách cổng >90px
    // và <400px tính từ rìa map, và cách MỌI trùm vùng ≥700px. Sửa map = sửa tham số rồi chạy
    // lại, đừng sửa tay toạ độ ở đây.
    w:5000, h:3700,
    // Bộ viên ĐÁ NUNG riêng — trước đó mượn viên đất thường, không phân biệt được với đồng cỏ.
    sanIso:true, isoCo:['nen_tro1','nen_tro2','nen_tro3','nen_tro4'],
    isoDat:['nen_nung1','nen_nung2','nen_nung3','nen_nung4'],
    isoVet:['vet_nung1','vet_nung2'],
    herbs:true, boss:true, trees:0, rocks:0,
    desc:'Tướng Quân dựng đại bản doanh ngay trên Trụ Ashmark — hắn thôi không giấu nữa. Thảo nguyên đá nung, Chimera trâu bò đánh đau.',
    spawnFrom:{ comoc:{ x:1672, y:3373 }, nhanmon:{ x:4717, y:1144 } },
    spawn:{ x:1722, y:3078 },
    voi: 4150,          // `vung.dai` là tỉ lệ của `voi` — đo từ điểm thả tới đỉnh xa nhất
    // ⚠ Cung Thủ Tro Tàn (`cungthu`) VỐN ĐÃ đánh xa. Một miền của nó cố ý KHÔNG khai `vai`
    // để giữ nguyên tầm gốc — khai 'xa' cho cả hai là âm thầm buff một con đã cân xong
    // (spawnMob bật `range`+`ranged` theo vai). Miền kia khai ['xa','phap'] để có hồ sơ khác.
    vung: [
      { id:'thamtu', ten:'Bãi Thám Tử Tro Tàn', dai:[0.12,0.22], cung:[-115,-10], cum:[3,3], tiep:true,
        dan:[{ mob:'thamtu', n:18, vai:['can','phap'] }] },
      { id:'thamtu_nang', ten:'Luỹ Đá Nung', dai:[0.25,0.35], cung:[-108,-5], cum:[3,3], tiep:true,
        dan:[{ mob:'thamtu', n:15, vai:['nang','can'] }] },
      { id:'cungthu', ten:'Trường Bắn Tro Tàn', dai:[0.38,0.49], cung:[-115,-10], cum:[3,3], tiep:true,
        dan:[{ mob:'cungthu', n:18 }] },
      { id:'cungthu_phap', ten:'Đài Gọi Nắng', dai:[0.52,0.62], cung:[-105,-5], cum:[3,3], tiep:true,
        dan:[{ mob:'cungthu', n:15, vai:['xa','phap'] }] },
      { id:'kybinh', ten:'Bãi Ngựa Tro Tàn', dai:[0.65,0.80], cung:[-115,-10], cum:[3,3], tiep:true,
        dan:[{ mob:'kybinh', n:15, vai:['can','bay'] }] },
      { id:'kybinh_nang', ten:'Trại Giáp Nặng', dai:[0.83,1.0], cung:[-105,-5], cum:[3,3], tiep:true,
        dan:[{ mob:'kybinh', n:12, vai:['nang','bay'] }] },
    ],
    diTrong: [
      [2368,3552], [1600,3552], [1472,3296], [1344,3296], [1152,3424], [1088,3424],
      [1024,3488], [896,3488], [832,3552], [576,3552], [320,3360], [64,3360],
      [32,3328], [32,768], [128,672], [288,640], [288,512], [352,448],
      [416,256], [640,32], [1024,32], [1056,128], [1216,288], [1280,288],
      [1344,352], [1664,352], [1728,288], [1792,288], [1984,32], [3520,32],
      [3712,288], [3776,288], [3840,352], [4160,352], [4384,128], [4416,32],
      [4544,32], [4640,128], [4640,256], [4704,320], [4704,768], [4896,832],
      [4896,3136], [4736,3296], [4672,3296], [4480,3424], [4096,3424], [4032,3360],
      [3840,3296], [3680,3136], [3680,3072], [3616,3008], [3616,2880], [3552,2816],
      [3552,2432], [3392,2272], [3136,2272], [3040,2368], [3040,2560], [3168,2752],
      [3168,3200], [3072,3296], [3008,3232], [2816,3232], [2752,3296], [2624,3296],
    ],
    // LÙM CHẶN nằm TRONG lòng sàn — thứ làm một map rộng có nghĩa. Xem raiCum() trong game.js.
    isoCum: [[2368,1408], [1472,1280], [2560,704], [640,1920], [1728,1920], [4352,2816], [1088,2432], [3712,2304], [3072,1472], [2240,384], [1792,640], [4544,2304], [1088,448], [3456,832], [768,1216], [192,1408], [512,3264], [512,2752], [960,2880], [2176,960], [4160,896], [640,640], [256,2368], [3008,1024], [3328,384], [3776,1152], [1344,832], [1920,1408], [2816,320], [4736,1536], [320,960], [2944,3008], [4352,3264], [4096,2048], [4480,320], [192,1856], [3840,576], [2880,1920], [1344,3136]],
    // ĐƯỜNG MÒN nối những chỗ người chơi THẬT SỰ đi (cổng, điểm thả, chỗ hái thuốc). Trên map
    // rộng, luật "đường mòn = dải xa mép nhất" của map làn KHÔNG dùng lại được — xem sanIsoDung().
    isoDuong: [
      [[1792,3328], [1696,3254], [1672,3373], [1918,3217], [2169,3069], [2418,2917], [2658,2754], [2885,2573], [3100,2375], [3310,2170], [3521,1967], [3741,1777], [3974,1603], [4218,1446], [4469,1296], [4717,1144], [4743,1066], [4672,1024], [4430,1201], [4200,1395], [3974,1594], [3743,1787], [3499,1961], [3240,2113], [2971,2251], [2701,2387], [2438,2533], [2188,2699], [1952,2884], [1722,3078]],
      [[1722,3078], [1640,2739], [1564,2397], [1337,2116], [1216,1792]],
      [[1722,3078], [1911,2835], [2144,2620], [2281,2343], [2375,2038], [2560,1792]],
    ],
    duhiep:'duhiep3' },
  nhanmon: { name:'Dusk Marsh', min:100, range:'102 - 120', type:'freepk', ground:'#1e2620', patch:'#4a5a3a',
    // ⚠ MAP NÀY DỰNG LẠI TỪ TRANH NHÌN NGANG — xem docs/DUNG_LAI_BON_MAP.md.
    // Tấm nền cũ là tranh SÂN KHẤU: đáy có một dải sàn mỏng, phần trên là trời/núi/tường cây. Mà
    // game.js kéo tranh nền phủ kín thế giới rồi cho đi khắp mặt tranh, nên TRANH NỀN CHÍNH LÀ
    // MẶT ĐẤT — đi lên phía bắc map là đi vào bầu trời. Đó là toàn bộ nguyên nhân của lỗi
    // "nhân vật lơ lửng trên không trung", và không tấm nền phẳng nào chữa được nó.
    //
    // Ba mảng hình học dưới đây SINH BẰNG MÁY, không chấm tay: tools/iso/vung_bon.py. Bộ sinh tự
    // kiểm trước khi in — sàn ≥58%, mọi điểm nội dung nằm TRONG đa giác, điểm tới cách cổng >90px
    // và <400px tính từ rìa map, và cách MỌI trùm vùng ≥700px. Sửa map = sửa tham số rồi chạy
    // lại, đừng sửa tay toạ độ ở đây.
    w:5200, h:3800,
    // Bộ viên ĐẦM LẦY riêng — trước đó mượn cỏ thường + đá, nhìn không khác một bãi cỏ có sỏi.
    sanIso:true, isoCo:['nen_reu1','nen_reu2','nen_reu3','nen_reu4'],
    isoDat:['nen_bun1','nen_bun2','nen_bun3','nen_bun4'],
    isoVet:['vet_bun1','vet_bun2'],
    herbs:true, boss:true, trees:0, rocks:0,
    desc:'Trụ Dusk Marsh — trụ cuối cùng. Gỡ nó xuống là mở đúng cánh cửa Morvahn đang chờ. PK ở đây không cộng Tai Tiếng.',
    spawnFrom:{ mongco:{ x:211, y:840 } },
    spawn:{ x:506, y:1030 },
    voi: 5050,          // `vung.dai` là tỉ lệ của `voi` — đo từ điểm thả tới đỉnh xa nhất
    // Bảy miền — map cuối game, rộng nhất, nên dày nhất. Ba loài chia bảy hồ sơ vai.
    vung: [
      { id:'cuongbinh', ten:'Vũng Cuồng Binh', dai:[0.12,0.21], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'cuongbinh', n:18, vai:['nang','phap'] }] },
      { id:'cuongbinh_can', ten:'Bờ Lún Gãy Giáo', dai:[0.24,0.33], cung:[-15,85], cum:[3,3], tiep:true,
        dan:[{ mob:'cuongbinh', n:15, vai:['nang','can'] }] },
      { id:'kylan', ten:'Đầm Kỳ Lân', dai:[0.36,0.46], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'kylan', n:15, vai:['can','bay'] }] },
      { id:'kylan_bay', ten:'Rừng Cọc Chìm', dai:[0.49,0.58], cung:[-15,85], cum:[3,3], tiep:true,
        dan:[{ mob:'kylan', n:12, vai:['bay','xa'] }] },
      { id:'daokhach', ten:'Lối Đao Khách', dai:[0.61,0.71], cung:[-25,80], cum:[3,3], tiep:true,
        dan:[{ mob:'daokhach', n:15, vai:['can','xa'] }] },
      { id:'daokhach_phap', ten:'Bàn Thờ Ngập Nước', dai:[0.74,0.85], cung:[-15,85], cum:[3,3], tiep:true,
        dan:[{ mob:'daokhach', n:12, vai:['phap','can'] }] },
      // ⚠ MIỀN XA NHẤT PHẢI LÀ LOÀI MẠNH NHẤT. Bản đầu tôi để `cuongbinh` (C102) ở dải 0,88-1,0
      // trong khi `daokhach` (C120) đứng gần hơn — test_vung §2 bắt ngay: "1 cụm ở xa hơn mà yếu
      // hơn tới 18 cấp". Dải `dai` rời nhau mới chỉ đảm bảo THỨ TỰ KHOẢNG CÁCH; thứ tự CẤP còn
      // phải nằm ở chính bảng loài. Ba loài của map này: cuongbinh 102 → kylan 112 → daokhach 120.
      { id:'daokhach_cuoi', ten:'Chân Trụ Dusk Marsh', dai:[0.88,1.0], cung:[-20,80], cum:[3,3], tiep:true,
        dan:[{ mob:'daokhach', n:12, vai:['nang','xa'] }] },
    ],
    diTrong: [
      [2496,3680], [576,3680], [384,3488], [64,3488], [32,3456], [32,640],
      [64,608], [320,608], [352,576], [352,384], [640,32], [1088,32],
      [1120,128], [1344,352], [1728,352], [1920,224], [1952,128], [2048,32],
      [3712,32], [3840,288], [3904,288], [3968,352], [4352,352], [4384,448],
      [4480,544], [4608,544], [4672,480], [4800,480], [4864,416], [5056,416],
      [5088,448], [5088,2048], [4960,2112], [4960,2240], [5088,2368], [5088,3200],
      [5024,3264], [5024,3328], [4928,3360], [4800,3488], [4672,3488], [4608,3552],
      [4288,3552], [4224,3488], [4096,3488], [4032,3424], [3776,3424], [3520,3616],
      [3392,3488], [3200,3424], [3136,3360], [2880,3360], [2816,3424], [2624,3488],
      [2528,3584],
    ],
    // LÙM CHẶN nằm TRONG lòng sàn — thứ làm một map rộng có nghĩa. Xem raiCum() trong game.js.
    isoCum: [[512,576], [2816,192], [3200,3008], [4160,704], [4416,1088], [3520,192], [1152,2368], [1280,1152], [3072,704], [320,3072], [4608,3072], [4160,1856], [4672,1920], [3712,2304], [768,3328], [2368,3136], [576,2624], [2496,2432], [4672,1472], [2112,2688], [1600,3200], [4800,704], [3456,1536], [4288,2304], [2240,320], [2112,832], [3136,2176], [4096,2816], [256,2304], [2688,1856], [2624,768], [1664,2432], [1664,768], [1088,448], [576,1984], [2112,2048], [4864,2688], [3648,960], [3968,1344], [192,1472], [1600,1920], [3840,3200]],
    // ĐƯỜNG MÒN nối những chỗ người chơi THẬT SỰ đi (cổng, điểm thả, chỗ hái thuốc). Trên map
    // rộng, luật "đường mòn = dải xa mép nhất" của map làn KHÔNG dùng lại được — xem sanIsoDung().
    isoDuong: [
      [[256,960], [458,1238], [747,1412], [1024,1600], [778,1303], [506,1030]],
      [[256,960], [330,864], [211,840]],
      [[1024,1600], [1336,1560], [1657,1577], [1969,1541], [2267,1419], [2566,1307], [2880,1280]],
    ],
    duhiep:'duhiep3' },
  // ---------- PHÓ BẢN: ĐÃ GỠ ----------
  // Bảy map pb_* đã xoá — xem CLAUDE.md · CHẨN ĐOÁN GỐC. Bảy cửa nhưng chung MỘT địa hình:
  // cả bảy cùng spawn 1300,1560 · cùng cửa ra 1300,1660 · cùng packs:[] · cùng duhiep:null,
  // chỉ khác hai mã màu và số cây/đá. Tầng map sẽ dựng lại từ đầu ở phần đo map.

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
  // RONG CO CHU DINH. 63 vat can cu o day suy tu chinh tam bg_corran.jpg 2600x1900 bang
  // tools/can_tu_tranh.py. Map nay nay lat vien va rong 5200x3800, khong con dung tam tranh ay
  // nua -- giu lai thi 63 khoi chan vo hinh nam rai giua dong co trong, va quai se bi nhot
  // trong nhung cho nhin ra khong co gi. Vung di duoc gio do `diTrong` quyet dinh mot minh.
  corran: [],

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
  ngoai: [],   // lát viên: chặn bằng đa giác `diTrong` + lùm `isoCum`, xem corran
  chungnam: [],   // lát viên: chặn bằng đa giác `diTrong` + lùm `isoCum`, xem corran
  comoc: [],   // lát viên: chặn bằng đa giác `diTrong` + lùm `isoCum`, xem corran
  // AQUATIC TRIBE CAUSEWAY — 8 tảng đá do tools/iso/cat_caungam.py chấm, không đặt tay.
  // Cùng ba ràng buộc như Lối Mòn Corran: `test_domap` đòi ≥8% ô đi được có chỗ nấp trong 120px,
  // `test_sandat` đòi làn không thắt dưới 340px, và đá phải nằm hẳn trong đa giác. Công cụ đặt
  // từng tảng LỆCH MỘT BÊN rồi ĐO LẠI làn, thắt quá thì trả tảng ấy lại — nên đừng thêm bằng tay.
  caungam: [
    { x:2310, y:1770, rx:62, ry:32 }, { x:2220, y:2580, rx:62, ry:32 }, { x:690, y:510, rx:62, ry:32 }, { x:690, y:1410, rx:62, ry:32 },
    { x:1680, y:2040, rx:62, ry:32 }, { x:960, y:1050, rx:62, ry:32 }, { x:1770, y:1590, rx:62, ry:32 }, { x:330, y:1140, rx:62, ry:32 },
  ],
  tuyettinh: [],   // lát viên: chặn bằng đa giác `diTrong` + lùm `isoCum`, xem corran
  mongco: [],   // lát viên: chặn bằng đa giác `diTrong` + lùm `isoCum`, xem corran
  nhanmon: [],   // lát viên: chặn bằng đa giác `diTrong` + lùm `isoCum`, xem corran
  // ARDHAVEN — 16 KHỐI NHÀ, do tools/iso/dung_thanh.py chấm chứ không đặt tay. Hai dãy tám
  // căn ôm hai bên đại lộ đông-tây, chừa quãng giữa 2720→3680 làm Quảng Trường Atia và chừa
  // khe 200px giữa hai căn liền nhau làm ngõ. Mỗi khối 460×340 = đúng bề ngang một sprite
  // công trình cắt ra ở tỉ lệ 1,8 ô (xem tools/iso/cat_congtrinh.py), nên nhà đặt lên vừa khít.
  // Chặn nguyên KHỐI chứ không chỉ chân tường: art isometric vẽ cả mái, mà mái là thứ nhân vật
  // sẽ đi đè lên nếu cho vào.
  ardhaven: [
    { x:280, y:520, wd:460, ht:340 }, { x:940, y:520, wd:460, ht:340 }, { x:1600, y:520, wd:460, ht:340 },
    { x:2260, y:520, wd:460, ht:340 }, { x:280, y:2340, wd:460, ht:340 }, { x:940, y:2340, wd:460, ht:340 },
    { x:1600, y:2340, wd:460, ht:340 }, { x:2260, y:2340, wd:460, ht:340 }, { x:3680, y:520, wd:460, ht:340 },
    { x:4340, y:520, wd:460, ht:340 }, { x:5000, y:520, wd:460, ht:340 }, { x:5660, y:520, wd:460, ht:340 },
    { x:3680, y:2340, wd:460, ht:340 }, { x:4340, y:2340, wd:460, ht:340 }, { x:5000, y:2340, wd:460, ht:340 },
    { x:5660, y:2340, wd:460, ht:340 },
  ],
};

window.NPCS = [
  { id:'truonglang', name:'Trưởng Làng', map:'corran', x:400, y:400, img:'assets/npcs/truonglang.png', talk:'quest',
    // Ông giao 9 trong 10 nhiệm vụ đầu và dẫn truyện gọi ông là người "nhặt ngươi về nuôi" —
    // vậy mà suốt giờ chơi đầu tiên ông không có một câu nào.
    lore:{
      idle:  '"Ta vớt ngươi lên khi bầu trời còn đang nứt. Ngươi không nhớ gì — nhưng bầy nhỏ của ta thì nhớ mùi lửa đêm đó."',
      offer: '"Cứ ở lại đã. Đảo này nuôi được thêm một miệng ăn, và ngươi chưa đủ sức trả ơn đâu."',
      active:'"Việc ta nhờ vẫn còn đó. Đảo nhỏ thôi, ngươi không lạc được."',
      done:  '"Về rồi. Ta nấu sẵn nồi cháo — ngồi xuống ăn trước đã, chuyện nói sau."' },
    barks:['"Bầy nhỏ hôm nay không chịu ra khỏi tổ."','"Đảo này nuôi được ta ba đời, nuôi thêm ngươi có sao đâu."',
           '"Đêm trời nứt, biển sáng như ban ngày."','"Ăn gì chưa? Hỏi thật đấy."'] },
  // ══ ARDHAVEN · SAPIDAE CHIEFDOM — 24 NPC ═══════════════════════════════════
  // Thay hẳn hai bộ cũ: bộ 10 NPC "qt_*" của Quảng Trường Cũ (map đã xoá) và bộ 5 NPC khai
  // bằng NPCS.push trong game.js. Năm id cũ được GIỮ NGUYÊN vì có mã tìm cứng theo id:
  //   duoclao/binhkhi/trachu → khoá của bảng SHOPS · bodau → renderTruyNa() · thantoan → renderVanDuyen()
  // Đổi id năm người đó là hỏng năm cái quầy, không phải hỏng một cái tên.
  //
  // Bốn `talk` sau đây LẦN ĐẦU có người đứng trong thành: `stable` · `trunya` · `vanduyen` ·
  // `tenui`. Trước bản này chúng là bốn hệ thống không có cửa nào ở nơi người chơi hay đứng.
  //
  // Toạ độ không chấm tay: chạy phép kiểm điểm-trong-đa-giác trên `diTrong` 36 đỉnh + kiểm hộp
  // 16 khối nhà + ma trận khoảng cách đôi một. Xem tools/iso/dung_thanh.py cho hình học.
  // ── 7 NPC CHỨC NĂNG — mỗi người một `talk` ───────────────────────────────────
  // Bốn loại `stable` · `trunya` · `vanduyen` · `tenui` trước nay CHƯA CÓ CỬA NÀO
  // đứng ở thành. Lore của bốn người dưới đây viết cho ra chuyện đó: mỗi cái cửa
  // phải nói được vì sao nó tồn tại, không chỉ là một cái nút bấm.

  { id:'thoren', name:'Thợ Rèn · Lò Rèn Hoàng Gia', map:'ardhaven', x:5230, y:990, img:'assets/npcs/thoren.png', talk:'forge',
    lore:'"Lò này nhóm lại lần thứ ba rồi. Hai lần trước tắt vì hết than — lần này ta dặn xe than đi hai chuyến một tuần, tắt nữa thì là lỗi của ta."',
    barks:['"Đợi lò đỏ đã, đừng giục."','"Đồ mẻ thì mang đây, đừng vứt."',
           '"Búa nhỏ để khảm, búa lớn để nắn. Cầm nhầm là hỏng cả món."','"Nghe tiếng thép là biết đồ thật hay giả."'] },

  { id:'duoclao', name:'Nhà Giả Kim · Tiệm Thuốc', map:'ardhaven', x:1830, y:990, img:'assets/npcs/duocsu.png', talk:'shop',
    lore:'"Giá dán ngay cửa. Ta không nói thách cũng không bớt — bớt cho một người là hôm sau cả phố tới đòi bớt."',
    barks:['"Bình đỏ pha sáng nay, còn ấm."','"Ra khỏi cổng thì mang hai lọ, đừng mang một."',
           '"Đừng uống lúc đang chạy, sặc thì phí cả lọ."','"Nút bần bịt kín rồi, nhưng đừng để nghiêng trong túi."'] },

  { id:'binhkhi', name:'Binh Khí Chủ · Vũ Khí Phường', map:'ardhaven', x:5890, y:990, img:'assets/npcs/binhkhi.png', talk:'shop',
    lore:'"Giá gỗ này ta đóng lại tuần trước — cây cũ mọt ăn, gãy làm đôi lúc nửa đêm, đổ hết cả hàng xuống sân. Cầm thử đi, cây nào cũng còn nguyên lưỡi."',
    barks:['"Cầm thử đi, đừng ngắm."','"Cây rìu kia nặng hơn nó nhìn."',
           '"Chuôi quấn da mới, chưa trơn tay đâu."','"Đồ cũ nhưng chưa gãy lần nào."'] },

  // talk:'stable' — CỬA ĐẦU TIÊN của hệ Trại Ngựa / Mã Thầu / Khế Ước Ragoon đứng
  // trong tường thành. Trước đây hệ này chỉ có một cửa duy nhất ở Beast Herd Camp.
  { id:'ah_mucdong', name:'Người Giữ Chuồng', map:'ardhaven', x:2160, y:2450, img:'assets/npcs/traichu.png', talk:'stable',
    lore:'"Chuồng trong thành có bốn ô, mà ngoài đồng thì cả bầy chạy hoang. Ai rượt được con nào thì dắt về đây — ta ghi tên, ta cho ăn, và ta không hỏi trước đó nó thuộc về ai."',
    barks:['"Rượt cho nó mệt, đừng rượt cho mình mệt."','"Con nâu ô ngoài cùng cắn người lạ, nhớ đấy."',
           '"Cỏ ngoài thành ngọt hơn cỏ trong sân, nên chúng nó mới không chịu về."','"Dây thừng ta cho mượn, nhớ trả."'] },

  // talk:'trunya' — Truy Nã Lệnh mỗi ngày một tên. ⚠ XEM CHÚ Ý KỸ THUẬT cuối tệp:
  // renderTruyNa() đang tìm CỨNG id 'bodau'.
  { id:'bodau', name:'Quan Truy Nã', map:'ardhaven', x:4150, y:2100, img:'assets/npcs/bodau.png', talk:'trunya',
    lore:'"Vách này mỗi sáng ta dán một tờ, mỗi chiều gỡ một tờ. Trước đây gỡ vì hết hạn. Dạo này thì gỡ vì có người mang việc về xong — ta thích cách gỡ đó hơn."',
    barks:['"Lệnh hôm nay dán rồi đấy."','"Một ngày một tên, không hơn. Ta cũng phải ngủ."',
           '"Tiền thưởng trả bằng Lumen, đếm tại chỗ, đếm xong đừng kêu thiếu."','"Đừng vác nguyên con về sân ta. Kể lại là đủ."'] },

  // talk:'vanduyen' — Sảnh Cầu May. Tỉ lệ công khai, không cộng dồn may mắn.
  // ⚠ renderVanDuyen() đang tìm CỨNG id 'thantoan' — xem chú ý kỹ thuật cuối tệp.
  { id:'thantoan', name:'Chủ Sảnh Cầu May', map:'ardhaven', x:4570, y:990, img:'assets/npcs/thantoan.png', talk:'vanduyen',
    lore:'"Tỉ lệ ta dán trên vách, chữ to bằng bàn tay, ai đứng ngoài cửa cũng đọc được. Đọc xong mà vẫn quay thì đó là việc của ngươi, không phải lỗi của ta."',
    barks:['"Tỉ lệ dán trên vách kia kìa, đọc trước đi."','"Ta không hứa gì cả. Ta chỉ quay."',
           '"Người vừa nãy quay chín lượt rồi về tay không. Ngươi vẫn muốn quay chứ?"','"Lumen đặt lên bàn, đừng đưa tận tay ta."'] },

  // talk:'tenui' — Vực Thẳm. Trước nay ba cái vách duy nhất đều nằm ở vùng ngoài;
  // đây là cái đầu tiên nằm ngay trong tường thành, nên nó phải giải thích được vì
  // sao giữa một cái thành lại có một cái vực.
  { id:'ah_vachgio', name:'Kẻ Trông Vách', map:'ardhaven', x:2160, y:380, img:'assets/npcs/vachda.png', talk:'tenui',
    lore:'"Vết nứt xé qua chỗ này thì kéo đi một mảng đất, và chỗ đất mất đi để lại cái vực đằng sau lưng ta. Ta ngồi đây đếm người nhảy xuống. Ai đủ cứng — từ cấp 60 trở lên — thì còn leo lên lại được."',
    barks:['"Nhìn xuống trước, rồi hẵng quyết."','"Gió dưới đáy thổi ngược lên. Lạ, mà ta quen rồi."',
           '"Ta trông cái vách, không trông người. Ngươi nhảy hay không là chuyện của ngươi."','"Sáng nay hai đứa nhảy. Một đứa về."'] },

  // ── 4 NPC GÁC CỔNG — mỗi hướng một người, nói rõ ra cổng đó là đi đâu ─────────
  // Đứng cách cổng của mình 280-290px về phía trong thành (đã đo).

  { id:'ah_gac_bac', name:'Lính Gác Cổng Bắc', map:'ardhaven', x:3200, y:540, img:'assets/npcs/laotuong.png', talk:'quest',
    lore:{
      idle:  '"Qua cổng này là đường lên Bird Tribe Heights. Dốc, gió ngược, và trên đó chim làm tổ trên đá chứ không làm trên cây — cứ nhìn tổ là biết mình lên tới đâu."',
      offer: '"Chưa vội. Đứng đây nhìn lên cái dốc kia một lúc đã, rồi hẵng nhận việc."',
      active:'"Việc trên Bird Tribe Heights còn dở. Cổng ta vẫn mở, về lúc nào cũng được."',
      done:  '"Về rồi. Ta đếm người ra, đếm người về — hôm nay không lệch."' },
    barks:['"Ra sớm đi, quá trưa là gió trên đó đổi hướng."','"Đường lên dốc, đừng chạy. Chạy là phải dừng."',
           '"Ta đứng đây từ lúc trời còn tối."'] },

  { id:'ah_gac_nam', name:'Lính Gác Cổng Nam', map:'ardhaven', x:3200, y:2660, img:'assets/npcs/laotuong.png', talk:'quest',
    lore:{
      idle:  '"Cổng Nam mở ra Beast Herd Camp. Đất bằng, cỏ cao ngang thắt lưng, và bầy thú ngoài đó không sợ người nữa — đó mới là chỗ đáng ngại."',
      offer: '"Ngươi chưa quen mùi cỏ cháy ngoài kia. Ra ngó một vòng đã."',
      active:'"Ngoài Beast Herd Camp còn việc của ngươi. Ta không đi theo được."',
      done:  '"Về đủ chân tay. Tốt. Ngồi xuống thở đã."' },
    barks:['"Cỏ cao che được người, cũng che được thứ khác."','"Ngoài kia không có tường. Nhớ giùm ta câu đó."',
           '"Đếm người ra, đếm người về."'] },

  { id:'ah_gac_tay', name:'Lính Gác Cổng Tây', map:'ardhaven', x:700, y:1450, img:'assets/npcs/laotuong.png', talk:'quest',
    lore:{
      idle:  '"Ra Cổng Tây rồi đi thẳng là tới Rẻo Rừng Corran. Rừng thấp, nhiều lối, mà lối nào cũng giống lối nào. Nhớ đường về hơn là nhớ đường đi."',
      offer: '"Chưa cần tới ngươi. Cổng này ngày nào cũng mở, mai quay lại cũng được."',
      active:'"Trong Rẻo Rừng Corran còn thứ ngươi phải làm cho xong."',
      done:  '"Xong rồi hả. Ngồi nghỉ đi, ta rót cho ngụm nước."' },
    barks:['"Lối nào cũng giống lối nào. Nhớ đường về."','"Đừng bẻ cành làm dấu — cành mọc lại, dấu thì không."',
           '"Trong tường thì yên. Ngoài kia thì tùy hôm."'] },

  { id:'ah_gac_dong', name:'Lính Gác Cổng Đông', map:'ardhaven', x:5640, y:1600, img:'assets/npcs/laotuong.png', talk:'quest',
    lore:{
      idle:  '"Cổng Đông dẫn vào Werebear Woods. Rừng già, cây to hai người ôm, và giữa ban ngày trong đó tối như lúc chập tối."',
      offer: '"Vào rừng đó thì nên đi cùng người biết đường. Chưa phải hôm nay."',
      active:'"Ngươi còn nợ Werebear Woods một chuyến. Ta nhớ đấy."',
      done:  '"Ra được khỏi rừng đó là ta phục rồi. Thật, không phải nói cho vui."' },
    barks:['"Trong rừng đó ban ngày cũng phải cầm đuốc."','"Nghe tiếng gãy cành thì đứng yên, đừng quay đầu."',
           '"Cổng khép lúc nửa đêm. Ai gõ thì ta mở."'] },

  // ── 13 NPC DÂN PHỐ — phần lớn chỉ đang sống đời của họ ───────────────────────
  // Cố ý CHỈ HAI người nhắc tới vết nứt (kẻ hát rong, người gánh nước) — một cái
  // thành mà ai cũng nói về đại hoạ thì không phải một cái thành, nó là một bảng
  // thông báo có chân.

  { id:'ah_banrong', name:'Người Bán Rong', map:'ardhaven', x:1450, y:1520, img:'assets/npcs/monkhach.png', talk:'quest',
    lore:'"Ta gánh hai thúng, một thúng bánh một thúng chè. Thúng nào bán hết trước thì sáng mai ta gánh thúng đó nặng hơn. Đơn giản thế thôi."',
    barks:['"Bánh còn nóng, mua đi."','"Chè hôm nay đắt hơn hôm qua — đường lên giá, không phải ta."',
           '"Ta đứng đây tới trưa thôi đấy."'] },

  { id:'ah_thomoc', name:'Thợ Mộc', map:'ardhaven', x:1100, y:2100, img:'assets/npcs/thumo.png', talk:'quest',
    lore:'"Cả phố đặt ta đóng cửa mới. Cửa cũ vẫn tốt cả — chỉ là ai cũng muốn cái then dày hơn ngón tay cái. Ta đóng, ta không hỏi vì sao."',
    barks:['"Gỗ này còn ướt, phải phơi thêm mười ngày."','"Đừng dựa vào đó, keo chưa khô."',
           '"Đóng thì đóng ba đinh, đừng đóng hai."'] },

  { id:'ah_ganhnuoc', name:'Người Gánh Nước', map:'ardhaven', x:860, y:1700, img:'assets/npcs/noiung.png', talk:'quest',
    lore:'"Giếng ở đầu phố, nhà ta ở cuối phố. Mười hai chuyến một ngày, và ta thuộc từng viên đá lát trên đoạn đường đó — kể cả viên bị nứt từ hôm khu phố này rơi sang."',
    barks:['"Tránh ra, ướt giày bây giờ."','"Nước múc sáng trong hơn nước múc chiều."',
           '"Cái đòn gánh này ta dùng từ hồi còn ở bên kia."'] },

  { id:'ah_treem', name:'Lũ Trẻ Chạy Quanh', map:'ardhaven', x:3020, y:1820, img:'assets/npcs/quachtinh.png', talk:'quest',
    lore:'"Bọn cháu chơi đuổi bắt. Ai chạm vào bậc thềm nhà bác thợ rèn là thua, vì bác ấy sẽ ra mắng — luật do bác ấy đặt, không phải bọn cháu."',
    barks:['"Đuổi kịp cháu thì cháu cho cái này!"','"Chú đừng mách mẹ cháu nhé."',
           '"Chú cao thế, chú nhìn qua nóc nhà kia được không?"'] },

  { id:'ah_linhtuan', name:'Lính Tuần Phố', map:'ardhaven', x:2560, y:1600, img:'assets/npcs/bodau.png', talk:'quest',
    lore:'"Ta đi từ Cổng Tây sang Cổng Đông rồi quay lại, mỗi vòng đúng một khắc. Việc chán lắm. Nhưng chán là dấu hiệu tốt, ngươi cứ tin ta."',
    barks:['"Trong tường thì yên."','"Ai còn để xe hàng giữa lòng phố nữa là ta thu."',
           '"Đi qua đi lại mỏi chân hơn đánh nhau."'] },

  { id:'ah_quetpho', name:'Người Quét Phố', map:'ardhaven', x:3620, y:1470, img:'assets/npcs/ttmon.png', talk:'quest',
    lore:'"Sáng quét lá, chiều quét bụi, tối quét thứ khách say làm rơi. Phố sạch thì không ai khen. Phố bẩn thì ai cũng biết là ta."',
    barks:['"Dịch sang bên một tí, ta quét."','"Lá năm nay rụng nhiều hơn mọi năm."',
           '"Chổi này ta tự bó, bền hơn chổi mua ngoài chợ."'] },

  { id:'trachu', name:'Chủ Quán Trọ · Trà Quán', map:'ardhaven', x:4150, y:1010, img:'assets/npcs/trachu.png', talk:'shop',
    lore:'"Mười hai phòng, tám phòng có người. Bốn phòng còn lại ta để trống cho ai về muộn — về muộn mà không có chỗ nằm thì tội lắm."',
    barks:['"Còn phòng, đừng lo."','"Cơm dọn lúc trời chạng vạng, đừng tới trễ."',
           '"Ai ngáy to thì ta xếp lên gác. Không giận nhé."'] },

  { id:'ah_duatin', name:'Người Đưa Tin', map:'ardhaven', x:4300, y:1620, img:'assets/npcs/noiung.png', talk:'quest',
    lore:'"Ta chạy tin giữa bốn cổng, trong tường thôi. Thư gửi ra ngoài thành thì ta không nhận — ngoài đó không có ai đứng đợi ở đầu đường cả."',
    barks:['"Tránh đường, ta đang vội."','"Lá này để ba ngày rồi, chưa ai tới lấy."',
           '"Ta chạy nhanh hơn ngươi đấy, cá không?"'] },

  { id:'ah_banhoa', name:'Bà Bán Hoa', map:'ardhaven', x:3400, y:1930, img:'assets/npcs/duoclao.png', talk:'quest',
    lore:'"Hoa của ta trồng ở luống sau nhà, không phải hàng gánh từ ngoài đồng vào. Cành ngắn hơn thật, nhưng cắm trong nhà được bảy ngày."',
    barks:['"Mua một bó về cắm, nhà sáng hẳn ra."','"Cành trắng hết rồi, còn cành đỏ thôi."',
           '"Cắt buổi sáng thì tươi lâu hơn cắt buổi chiều."'] },

  { id:'ah_onglao', name:'Ông Lão Ngồi Ghế Đá', map:'ardhaven', x:2870, y:1340, img:'assets/npcs/truonglang.png', talk:'quest',
    lore:'"Cái ghế này quay mặt ra phố lớn. Ta ngồi từ lúc mặt trời chưa qua nóc nhà đối diện, tới lúc nó khuất sau đó. Ngày nào cũng vậy, và ta chưa chán ngày nào."',
    barks:['"Ngồi xuống đi, ghế còn chỗ."','"Trước đây chỗ này là bãi đất trống."',
           '"Cứ đi đi. Ta không giữ ai lại bao giờ."'] },

  { id:'ah_chimera', name:'Người Luyện Chimera', map:'ardhaven', x:2500, y:2100, img:'assets/npcs/traichu.png', talk:'quest',
    lore:'"Con này ta nhặt lúc nó còn nhỏ bằng bàn tay. Nó không hiền đâu — nó chỉ quen ta thôi. Quen với hiền là hai chuyện khác nhau, nhớ cho kỹ."',
    barks:['"Đừng đưa tay ra trước mặt nó."','"Nó ăn hai bữa, sáng và tối. Cho ăn thêm là nó lười."',
           '"Con này nghe tiếng huýt, không nghe tên."'] },

  { id:'ah_thonhuom', name:'Thợ Nhuộm', map:'ardhaven', x:1170, y:1010, img:'assets/npcs/daosi.png', talk:'quest',
    lore:'"Tay ta xanh tới khuỷu, rửa cách gì cũng không ra. Khách nhìn tay ta rồi mới tin mấy tấm vải treo kia là màu thật chứ không phải màu quét."',
    barks:['"Đừng chạm vào, vải chưa khô."','"Màu chàm phải nhuộm bảy lượt mới ăn."',
           '"Nước nhuộm đổ ra rãnh kia, đừng giẫm vào."'] },

  { id:'ah_hatrong', name:'Kẻ Hát Rong', map:'ardhaven', x:3200, y:1300, img:'assets/npcs/quachtinh.png', talk:'quest',
    lore:'"Ta hát bài nào cũng được, trừ bài về cái đêm trời nứt. Hát bài đó thì có người bỏ về, có người ngồi lại khóc — mà cả hai hạng đều không bỏ tiền."',
    barks:['"Nghe một bài không mất gì cả."','"Dây thứ ba lại chùng rồi."',
           '"Hôm qua có người trả ta bằng một quả táo. Ta vẫn hát."'] },
  { id:'thoren_dao', name:'Thợ Rèn Lưu Vong', map:'corran', x:520, y:560, img:'assets/npcs/thoren.png', talk:'forge',
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
  // Ô 3 của Dark Knight. Trước đây TRỐNG: lớp này là lớp DUY NHẤT có 5 chiêu chủ động trong khi
  // bốn lớp kia đều có 6, nên không còn chiêu nào để đưa lên ô thứ ba. Thêm chiêu thứ sáu là cách
  // duy nhất lấp ô mà KHÔNG phá ba lời hứa đang được test_kynang5lop gác: Di Sản vẫn đúng 4 chiêu
  // (= 8,0% Công Kích như bốn lớp kia), lớp vẫn còn bị động riêng (Swell Life ở trên), và không
  // tên chiêu nào trùng giữa hai lớp.
  // Cơ chế chọn KHIÊN vì đó là thứ duy nhất trong năm kiểu buff chưa lớp nào dùng — Bless hồi máu,
  // Battle Fury tốc đánh, Increase Critical Damage bạo kích. Khiên cũng đúng bản sắc "Chịu Đòn"
  // của Dark Knight. fx.shieldPct đã có sẵn đường chạy trong castSkill, không phải thêm cơ chế mới.
  dk_bulwark:     { name:'Bulwark', school:'Dark Knight', phai:'thieulam', tier:'trung', cat:'Binh Khí', type:'buff', unlock:15, cd:12, qi:26, tam:0, pham:0, color:'#6aa8ff', glyph:'▲', fx:{ shieldPct:28, dmgPct:12, t:8 }, desc:'Dựng thế thủ — một lớp khiên dày bằng 28% Sinh Lực tối đa bọc quanh thân, kèm +12% sát thương trong 8 giây.' },
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

Ngươi dạt vào <b>Rẻo Rừng Corran</b>, được một Trưởng Làng Axie nhặt về nuôi. Võ nghệ sẽ trở lại theo từng cấp — và Lunacia cần nó.

Mỗi lớp mang một <b>hệ nguyên tố</b> — khắc hệ gây thêm <b>+20% sát thương</b> lên Chimera bị khắc.`,
  `<span class="is-title">NĂM TRỤ KHÓA</span>
Để vết nứt không nuốt trọn Lunacia, Thủ Hộ Vaeldra đã đóng <b>năm Trụ Khóa</b> xuống khắp thế giới này, ghim miệng vết nứt lại một chỗ.

Tướng quân của Morvahn đã chiếm cả năm trụ. Muốn tiến sâu, ngươi phải hạ chúng — nhưng <b>mỗi trụ được gỡ là vết nứt lại toác thêm</b>.

<i>"Từ Rẻo Rừng Corran, qua Werebear Woods, vào Bug Tribe Tunnels, lên Bird Tribe Heights, ra Reptile Sunstone Flats… cho tới Dusk Marsh, nơi vết nứt hà xuống."</i>

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
