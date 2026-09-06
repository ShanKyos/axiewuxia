// Phó bản DỰNG RIÊNG CHO BÀI KIỂM.
//
// Bảy map pb_* đã gỡ (xem CLAUDE.md · CHẨN ĐOÁN GỐC) nhưng MÁY chạy phó bản thì giữ nguyên,
// và máy còn thì phải còn bài kiểm gác nó — nếu không, lúc dựng lại tầng map sẽ không ai biết
// nó đã hỏng từ bao giờ. Nên mỗi bài kiểm tự cắm lấy một phòng cho mình.
//
// Việc này còn kiểm luôn lời hứa "máy chạy theo dữ liệu": nếu thêm ĐÚNG một khoá vào MAPS và
// một khoá vào DUNGEONS mà phòng chạy được từ đầu tới cuối, thì cắm lại bảy phòng thật sau này
// cũng chỉ là điền dữ liệu, không phải sửa máy.
const PB_THU = 'pb_thu';

// Chạy TRONG TRANG. Gọi: await page.evaluate(dungPbThu, { boss:'boss_amthan', ... })
function dungPbThu(o){
  o = o || {};
  MAPS['pb_thu'] = {
    name:'Trial Chamber: Bài Kiểm', min:o.min || 12, range:(o.min || 12) + '+', type:'dungeon',
    ground:'#8a8272', patch:'#3a342a', spawn:{ x:1300, y:1560 },
    dungeon:true, dark:true, trees:20, rocks:34,
    desc:'Phòng dựng riêng cho bài kiểm — không có trong bản chơi.',
    packs: [], duhiep: null,
  };
  DUNGEONS['pb_thu'] = {
    boss: o.boss || 'boss_hacphong', bossName: o.bossName || 'Trùm Bài Kiểm',
    waves: o.waves || [ ['bandit','bandit','wolf'], ['bandit','hautu','bandit'], ['assassin','bandit','wolf'] ],
    rewards: o.rewards || { sach:[1,2], tuLa:[0,0], hon:[0,0], khi:40, bacThem:150, silver:[850,1450] },
    huntBoss: 'huntBoss' in o ? o.huntBoss : 'boss_cotma1',
    boxTier: o.boxTier || 1,
    timeLimit: 'timeLimit' in o ? o.timeLimit : 480,
  };
  // Cổng vào/ra, để bài kiểm nào đo hình học cổng cũng có cái mà đo.
  const cha = o.cha || 'daohoa';
  if (!GATES.some(g => g.to === 'pb_thu')){
    GATES.push({ map:cha, x:2250, y:950, to:'pb_thu', name:'Phó Bản · Bài Kiểm', portal:true, label:'Phó Bản' });
    GATES.push({ map:'pb_thu', x:1300, y:1660, to:cha, name:'Rời Phó Bản', portal:true, label:'Xuất Môn' });
  }
  return 'pb_thu';
}
// page.evaluate tuần tự hoá THÂN hàm rồi chạy trong trang, không mang theo biến ngoài —
// nên khoá phòng viết thẳng vào thân chứ không dùng lại hằng PB_THU ở trên.
module.exports = { PB_THU, dungPbThu };
