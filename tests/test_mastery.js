// Bảng Đại Thành (mastery kiểu MU Master Skill Tree) — bản thử nghiệm cho Dark Knight.
//
// Bài này gác đúng ba thứ dễ hỏng nhất của một bảng cộng điểm:
//
//  1. NÚT KHÔNG LÀM GÌ. calcDerived() cộng dồn vào sổ `P` có đúng chừng đó khoá, và applyLine()
//     lặng lẽ bỏ qua khoá lạ. Một nút ghi vào khoá viết sai chính tả vẫn hiện đẹp trên bảng, vẫn
//     ăn điểm của người chơi, và không đổi một con số nào. Nên mục 5 tô kín TỪNG nút một rồi
//     đo lại toàn bộ chỉ số nhân vật: nút nào không nhúc nhích cái gì là đỏ.
//  2. CỔNG MỞ SAI. Bảng chỉ khai mở sau lần Tái Sinh đầu; trước đó điểm không được cấp và
//     masteryAdd() phải từ chối — nếu không, người chơi mới tiêu điểm vào một bảng chưa mở.
//  3. TRỤC SỨC MẠNH ĐI LẠC. Bốn nút của bảng Binh Khí phải nhân vào CHỈ SỐ CỦA MÓN ĐỒ
//     (vũ khí riêng, giáp riêng, theo cấp rèn, theo dòng Hoàn Hảo). Nếu chúng lặng lẽ biến
//     thành "+x% Công Kích" phẳng thì mastery lại dựng đúng cái trục tuyến tính mà đường cong A
//     vừa gỡ bỏ — mục 6 đo bằng cách tháo hết đồ ra: không đồ thì các nút đó phải cộng 0.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:' + PORT + '/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; window.charTab = 'info';
    startGame('thieulam', null);
    const o = {};

    // ── hình dạng bảng, quét CẢ NĂM LỚP ──
    const LOP = ['thieulam','toanchan','baidasan','minhgiao','bug'];
    const KHOA = Object.keys(MASTERY_LABEL);
    // Hồ sơ chỉ số của MỘT lớp = tổng trọng số mỗi khoá trên toàn bộ 3 bảng riêng của lớp đó,
    // cộng ở mức 1 điểm/nút. Hai lớp mà hồ sơ giống nhau nghĩa là đổi lớp không đổi gì cả.
    const hoSo = (sect) => {
      const A = {}; for (const k of KHOA) A[k] = 0;
      for (const t of (MASTERY_CLASS[sect] || [])) for (const n of t.nodes) n.eff(A, 1);
      return A;
    };
    o.lop = {};
    o.trungMa = 0; o.trungAnhTrongLop = []; o.thieuIco = [];
    for (const sect of LOP){
      startGame(sect, null);
      const tabs2 = masteryTabs();
      const ids = tabs2.flatMap(t => t.nodes.map(n => n.id));
      o.trungMa += ids.length - new Set(ids).size;
      const anh2 = {};
      for (const t of tabs2) for (const n of t.nodes){
        if (!n.ico || !n.col){ o.thieuIco.push(sect + '/' + n.id); continue; }
        const u = masteryIco(n); (anh2[u] = anh2[u] || []).push(n.id);
      }
      for (const v of Object.values(anh2)) if (v.length > 1) o.trungAnhTrongLop.push(sect + ': ' + v.join('='));
      o.lop[sect] = {
        soTab: tabs2.length,
        tenTab: tabs2.map(t => t.name),
        nutMoiTab: tabs2.map(t => t.nodes.length),
        rankMoiTab: tabs2.map(t => [...new Set(t.nodes.map(n => n.rank))].sort((a,c)=>a-c).join(',')),
        soAnh: Object.keys(anh2).length,
        suaChua: masteryCap(),
        hoSo: hoSo(sect),
      };
    }
    // Hai lớp bất kỳ phải khác hồ sơ. So từng cặp, ghi ra những khoá LỆCH nhau.
    o.capGiongNhau = []; o.capKhacIt = [];
    for (let i = 0; i < LOP.length; i++) for (let j = i+1; j < LOP.length; j++){
      const a = o.lop[LOP[i]].hoSo, c = o.lop[LOP[j]].hoSo;
      const lech = KHOA.filter(k => Math.abs(a[k] - c[k]) > 1e-9);
      if (!lech.length) o.capGiongNhau.push(LOP[i] + ' ≡ ' + LOP[j]);
      else if (lech.length < 6) o.capKhacIt.push(`${LOP[i]}/${LOP[j]} chỉ lệch ${lech.length}: ${lech.join(',')}`);
    }
    // Khoá ĐẶC TRƯNG: lớp nào chạm được khoá nào.
    o.aiChamDuoc = {};
    for (const k of ['spdPct','rangePct','amkhiPct','potionPct','shieldSec','dropPct','ltPct','expPct','silverPct'])
      o.aiChamDuoc[k] = LOP.filter(sc => o.lop[sc].hoSo[k] > 0);

    startGame('thieulam', null);
    const tabs = masteryTabs();
    o.soTab = tabs.length;
    o.tenTab = tabs.map(t => t.name);
    o.nutMoiTab = tabs.map(t => t.nodes.length);
    o.rankMoiTab = tabs.map(t => [...new Set(t.nodes.map(n => n.rank))].sort((a,c)=>a-c).join(','));
    o.suaChua = masteryCap();
    o.mocMoiNut = MASTERY_MAX_NODE;

    // ── cổng: cấp MASTERY_LV VÀ xong chính tuyến — thiếu một trong hai là đóng ──
    o.capMo = MASTERY_LV; o.thuongMo = MASTERY_OPEN_GRANT; o.thuongMoiLan = MASTERY_PER_RESET;
    o.moTruoc = masteryOpen();
    masteryAdd('ht_thietbi', 5);
    o.tieuDuocKhiChuaMo = masteryPut('ht_thietbi');
    const _lv0 = player.level;
    gainXp(1e12);                                   // lên tới MAX_LV nhưng CHƯA xong chính tuyến
    o.diemKhiChuaMo = player.mpts || 0;
    o.capSauCay = player.level; o._lv0 = _lv0;
    o.moDuCapThieuTruyen = masteryOpen();
    // xong chính tuyến nhưng chưa đủ cấp
    startGame('thieulam', null); player.mongChiTon = true; masteryCheckOpen();
    o.moDuTruyenThieuCap = masteryOpen();
    o.diemKhiThieuCap = player.mpts || 0;
    // đủ cả hai → mở, cấp điểm khai mở đúng một lần
    player.level = MASTERY_LV; player.lvPeak = MASTERY_LV; masteryCheckOpen(); masteryCheckOpen();
    o.moSau = masteryOpen();
    o.diemSauMo = player.mpts;
    // 1 điểm mỗi cấp một khi đã mở: giả lập đời sau Tái Sinh (cấp đỉnh đã ≥120, cấp hiện tại thấp)
    player.level = 100; player.xp = 0;
    gainXp(1e12);
    o.diemSauCay = player.mpts;
    o.capToiDa = MAX_LV;
    // Tái Sinh KHÔNG còn là cổng, nhưng vẫn thưởng điểm và không đóng bảng
    const _truocTS = player.mpts;
    window.doTayTuy(true);
    o.taiSinh = { conMo: masteryOpen(), cong: player.mpts - _truocTS };

    // ── cổng rank ──
    const tab = tabs[0];
    o.rankGate = MASTERY_RANK_GATE;
    masteryAdd('ht_cuongkien', 5);              // rank 2, bảng đang có 0 điểm
    o.rank2SomKhiChua = masteryPut('ht_cuongkien');
    masteryAdd('ht_thietbi', MASTERY_RANK_GATE); // đủ 10 điểm trong bảng
    masteryAdd('ht_cuongkien', 5);
    o.rank2SauKhiDu = masteryPut('ht_cuongkien');
    // trần mỗi nút
    masteryAdd('ht_thietbi', 999);
    o.tranMotNut = masteryPut('ht_thietbi');
    o.tieuTrongBang = masterySpentTab(tab);

    // ── tẩy điểm ──
    const bacTruoc = player.silver = 999999;
    const daTieu = masterySpentAll(), conLai = player.mpts;
    window.masteryRespec(true);
    o.respec = { hoanLai: player.mpts - conLai, daTieu, conNut: masterySpentAll(),
                 tonBac: bacTruoc - player.silver, lanTay: player.mRespec };

    // ── mục 5: từng nút phải đổi ĐƯỢC một chỉ số nào đó ──
    // Mặc đồ có cấp rèn và có dòng Hoàn Hảo, nếu không thì 4 nút Binh Khí không có gì để nhân.
    // Phải là BỘ ĐẦY ĐỦ, không phải mỗi vũ khí + áo. Chỉ số chính của mỗi ô khác nhau
    // (chân=Mẫn Tiệp, dây chuyền=Công Kích, nhẫn=Bạo Kích/Né) — mặc thiếu ô thì các nút nhân vào
    // giáp trông như nút chết trong khi ngoài đời chúng có tác dụng thật.
    const dat = () => {
      const mk = (id, k, v) => ({ slot:id, plus:9, main:{ k, v }, subs:[], exc:[] });
      player.equip = {
        vukhi: { slot:'vukhi', plus:9, main:{ k:'atk', v:200 }, subs:[], exc:[{ k:'atkPct', v:10 }] },
        non: mk('non','def',60), ao: mk('ao','def',80), tay: mk('tay','def',60),
        quan: mk('quan','def',65), chan: mk('chan','agi',40), daychuyen: mk('daychuyen','atk',70),
        nhan1: mk('nhan1','crit',6), nhan2: mk('nhan2','eva',6),
      };
    };
    const chup = () => { calcDerived(); return {
      atk:player.atk, hp:player.maxHp, qi:player.maxQi, crit:player.crit,
      critDmg:player.critDmgMult, eva:player.eva, aspd:player.aspd, defRed:player.defRed,
      qireg:player.qireg, reflect:player.reflect||0, pierce:player.pierce||0,
      leech:player.hpLeech||0, exp:player.expPct||0, bac:player.silverPct||0,
      skill:player.skillDmgPct||0, cd:player.vhCdMult||1,
      // các khoá ĐẶC TRƯNG LỚP — thiếu chúng ở đây thì nút của bốn lớp mới trông như nút chết
      qiLeech:player.qiLeech||0, perfect:player.perfectProc||0, speed:player.speed||0,
      tam:atkRange(), amkhi:player.amkhiPct||0, potion:player.potionPct||0,
      shield:player.shieldBonus||0, drop:player.dropBonus||0, lt:player.ltBonus||0 }; };
    const khac = (a, c) => Object.keys(a).some(k => Math.abs(a[k]-c[k]) > 1e-9);

    // Quét nút chết trên CẢ NĂM LỚP. Quét mỗi Dark Knight thì 96 nút của bốn lớp kia không ai
    // gác — mà đó đúng là chỗ dễ gõ sai tên khoá nhất, vì chúng dùng nhiều khoá lạ hơn.
    o.nutChet = [];
    for (const sect of LOP){
      const _lv = player.level, _eq = player.equip, _ms = player.mastery;
      startGame(sect, null);
      // Xoá trait: startGame(sect, null) roll trait NGẪU NHIÊN, và một trait cộng Né/Giảm ST là
      // đủ đẩy chỉ số lên sát trần trước khi mastery kịp cộng gì — bài kiểm khi đó lúc đỏ lúc
      // xanh tuỳ vận may của lượt roll. Mục này hỏi "nút có làm gì không", nên phải đo nút một
      // mình, không đo kèm quà trời cho.
      player.traits = [];
      player.level = _lv; player.lvPeak = MASTERY_LV; player.mongChiTon = true;
      dat(); player.mastery = {}; const goc2 = chup();
      for (const t of masteryTabs()) for (const n of t.nodes){
        player.mastery = { [n.id]: MASTERY_MAX_NODE };
        if (!khac(goc2, chup())) o.nutChet.push(sect + '/' + n.id);
      }
      player.equip = _eq; player.mastery = _ms;
    }
    startGame('thieulam', null); player.traits = []; player.level = MAX_LV; player.lvPeak = MASTERY_LV; player.mongChiTon = true;
    dat(); player.mastery = {}; const goc = chup();
    if (khac(goc, chup())) o.nutChet.push('mốc gốc không ổn định');

    // ── mục 6: bốn nút Binh Khí phải bám vào TRANG BỊ, không đồ thì cộng 0 ──
    const bamDo = ['dk_maluyen','dk_cuonghoa','dk_thamluyen','dk_ngoctinh','dk_trongkiem','dk_thietgiap','dk_hopnhat'];
    player.equip = {}; player.mastery = {}; const trong = chup();
    o.bamDoSai = [];
    for (const id of bamDo){
      player.mastery = { [id]: MASTERY_MAX_NODE };
      // Luyện Thể còn cộng %Sinh Lực nên nó ĐƯỢC phép đổi khi không đồ — bỏ khỏi danh sách này.
      if (khac(trong, chup())) o.bamDoSai.push(id);
    }

    // ── vũ khí và giáp phải tách nhánh ──
    player.mastery = {};
    player.equip = { vukhi:{ slot:'vukhi', plus:0, main:{k:'atk',v:200}, subs:[], exc:[] } };
    const chiVk = chup().atk;
    player.mastery = { dk_maluyen: MASTERY_MAX_NODE };  // +26% chỉ số vũ khí
    const vkCoNut = chup().atk;
    player.mastery = { dk_cuonghoa: MASTERY_MAX_NODE }; // +14% chỉ số GIÁP — không được đụng vũ khí
    const vkNutGiap = chup().atk;
    o.tachNhanh = { chiVk, vkCoNut, vkNutGiap };

    // ── cấp rèn: Thâm Luyện chỉ có tác dụng trên đồ ĐÃ RÈN ──
    player.mastery = { dk_thamluyen: MASTERY_MAX_NODE };
    player.equip = { vukhi:{ slot:'vukhi', plus:0, main:{k:'atk',v:200}, subs:[], exc:[] } };
    const p0 = chup().atk;
    player.mastery = {}; const p0Khong = chup().atk;
    player.equip = { vukhi:{ slot:'vukhi', plus:9, main:{k:'atk',v:200}, subs:[], exc:[] } };
    const p9Khong = chup().atk;
    player.mastery = { dk_thamluyen: MASTERY_MAX_NODE };
    const p9 = chup().atk;
    o.capRen = { p0, p0Khong, p9, p9Khong };

    // ── điểm phải sống qua Tái Sinh ──
    player.mastery = { ht_thietbi: 7 }; player.mpts = 13; player.level = MAX_LV;
    window.doTayTuy(true);
    o.quaTaiSinh = { nut: masteryPut('ht_thietbi'), chuaDung: player.mpts };

    o.anhLaData = masteryIco(MASTERY_COMMON.nodes[0]).startsWith('data:image');
    return o;
  });
  console.log(JSON.stringify(r, null, 1));

  // ── 1. hình dạng bảng — CẢ NĂM LỚP ──
  const LOP = Object.keys(r.lop);
  const xau = LOP.filter(k => r.lop[k].soTab !== 4);
  if (xau.length) fail(`${xau.join(', ')} không đủ 4 bảng: ${xau.map(k=>r.lop[k].soTab).join(',')}`);
  else pass(`cả ${LOP.length} lớp đều có 4 bảng (1 chung + 3 riêng)`);
  const xau2 = LOP.filter(k => r.lop[k].nutMoiTab.some(n => n !== 8));
  if (xau2.length) fail(`${xau2.join(', ')} có bảng lệch số nút`);
  else pass('mọi bảng của mọi lớp đều 8 nút — 32 nút/lớp');
  const xau3 = LOP.filter(k => r.lop[k].rankMoiTab.some(x => x !== '1,2,3,4,5'));
  if (xau3.length) fail(`${xau3.join(', ')} có bảng thiếu rank`);
  else pass('đủ 5 rank ở mọi bảng của mọi lớp');
  if (r.mocMoiNut !== 20) fail(`trần mỗi nút là ${r.mocMoiNut}, MU là 20`);
  else pass('trần 20 điểm mỗi nút');
  if (r.trungMa) fail(`${r.trungMa} mã nút bị trùng — điểm sẽ chảy sang nút khác`);
  else pass('không nút nào trùng mã, trên cả năm lớp');

  // ── 1b. NĂM LỚP PHẢI KHÁC NHAU VỀ CHỈ SỐ ──
  // Đây là mục quan trọng nhất của đợt này: khung bảng giống nhau, bộ hình dùng lại được,
  // nhưng chỉ số thì không lớp nào được giống lớp nào.
  if (r.capGiongNhau.length)
    fail(`có cặp lớp hồ sơ chỉ số GIỐNG HỆT: ${r.capGiongNhau.join(' · ')}`);
  else if (r.capKhacIt.length)
    fail(`có cặp lớp gần như giống nhau: ${r.capKhacIt.join(' · ')}`);
  else pass(`cả ${LOP.length*(LOP.length-1)/2} cặp lớp đều khác nhau rõ rệt về chỉ số`);
  // Khoá đặc trưng: đúng lớp nào chạm được thì chỉ lớp đó
  const MONG = {
    spdPct:['toanchan'], rangePct:['toanchan','baidasan'], amkhiPct:['baidasan'],
    potionPct:['baidasan'], shieldSec:['minhgiao'], dropPct:['bug'],
    ltPct:['thieulam'], expPct:['bug'], silverPct:['bug'],
  };
  let saiDT = 0;
  for (const k in MONG){
    const co = (r.aiChamDuoc[k] || []).slice().sort().join(',');
    const mong = MONG[k].slice().sort().join(',');
    if (co !== mong){ fail(`khoá đặc trưng ${k}: lớp chạm được là [${co}], phải là [${mong}]`); saiDT++; }
  }
  if (!saiDT) pass('9 khoá đặc trưng nằm đúng lớp — Tốc Chạy chỉ Ranger, Rơi Đồ/Bạc/EXP chỉ Dark Lord, Liên Trảm chỉ Dark Knight…');

  // ── 2. sức chứa phải lớn hơn số điểm kiếm được, nếu không thì không có lựa chọn nào cả ──
  const motVong = r.thuongMo + r.thuongMoiLan + r.capToiDa - 1;   // khai mở + một đời cày + một lần Tái Sinh
  if (r.suaChua <= motVong * 3)
    fail(`bảng chứa ${r.suaChua} điểm, một vòng Tái Sinh kiếm ${motVong} — tô kín quá dễ, mất phần lựa chọn`);
  else pass(`bảng chứa ${r.suaChua} ô, một vòng chỉ kiếm ${motVong} → buộc phải chọn`);

  // ── 3. cổng: cấp 120 + xong chính tuyến (chủ dự án chốt — tách khỏi Tái Sinh) ──
  if (r.moTruoc) fail('bảng đã mở ngay từ cấp 1');
  else pass('cấp 1 thì bảng đóng');
  if (r.tieuDuocKhiChuaMo) fail(`tiêu được ${r.tieuDuocKhiChuaMo} điểm vào bảng chưa mở`);
  else pass('bảng đóng thì masteryAdd() từ chối');
  if (r.moDuCapThieuTruyen || r.diemKhiChuaMo)
    fail(`đủ cấp ${r.capSauCay} nhưng CHƯA xong chính tuyến mà bảng mở/cấp ${r.diemKhiChuaMo} điểm`);
  else pass(`cấp ${r.capSauCay} mà chưa xong chính tuyến thì vẫn đóng, 0 điểm`);
  if (r.moDuTruyenThieuCap || r.diemKhiThieuCap)
    fail(`xong chính tuyến nhưng cấp 1 mà bảng mở/cấp ${r.diemKhiThieuCap} điểm`);
  else pass('xong chính tuyến mà chưa đủ cấp thì vẫn đóng');
  if (!r.moSau) fail(`đủ cấp ${r.capMo} + xong chính tuyến mà bảng vẫn đóng`);
  else pass(`cấp ${r.capMo} + xong chính tuyến → bảng mở`);
  if (r.diemSauMo !== r.thuongMo)
    fail(`khai mở cấp ${r.diemSauMo} điểm, mong ${r.thuongMo} (và chỉ cấp MỘT lần dù gọi hai lần)`);
  else pass(`khai mở: +${r.thuongMo} điểm, gọi lại không cấp thêm`);
  const mongSauCay = r.thuongMo + (r.capToiDa - 100);
  if (r.diemSauCay !== mongSauCay)
    fail(`cày 100→${r.capToiDa} sau khi mở được ${r.diemSauCay} điểm, mong ${mongSauCay} (1 điểm/cấp)`);
  else pass(`1 điểm mỗi cấp một khi bảng đã mở (100→${r.capToiDa}: +${r.capToiDa-100})`);
  if (!r.taiSinh.conMo || r.taiSinh.cong !== r.thuongMoiLan)
    fail(`Tái Sinh: bảng ${r.taiSinh.conMo ? 'còn mở' : 'BỊ ĐÓNG'}, cộng ${r.taiSinh.cong} điểm (mong ${r.thuongMoiLan})`);
  else pass(`Tái Sinh không đóng bảng và vẫn +${r.thuongMoiLan} điểm`);

  // ── 4. cổng rank + trần nút + tẩy điểm ──
  if (r.rank2SomKhiChua) fail(`rank 2 mở sớm: đã đặt được ${r.rank2SomKhiChua} điểm khi bảng còn trống`);
  else pass(`rank 2 khoá tới khi bảng đủ ${r.rankGate} điểm`);
  if (r.rank2SauKhiDu !== 5) fail(`đủ điểm rồi rank 2 vẫn không nhận: ${r.rank2SauKhiDu}`);
  else pass('đủ điểm rank trước thì rank sau mở');
  if (r.tranMotNut !== 20) fail(`nút nhận tới ${r.tranMotNut} điểm, trần phải là 20`);
  else pass('không nút nào vượt trần 20');
  if (r.respec.hoanLai !== r.respec.daTieu || r.respec.conNut !== 0)
    fail(`tẩy điểm hoàn ${r.respec.hoanLai}/${r.respec.daTieu}, còn sót ${r.respec.conNut} điểm trên bảng`);
  else pass(`tẩy điểm hoàn đủ ${r.respec.daTieu} điểm`);
  if (r.respec.tonBac <= 0 || r.respec.lanTay !== 1)
    fail(`tẩy điểm không tốn gì (${r.respec.tonBac}◈) — tẩy tự do thì không còn là lựa chọn`);
  else pass(`tẩy điểm tốn ${r.respec.tonBac}◈, lần sau đắt hơn`);

  // ── 5. không nút chết ──
  if (r.nutChet.length)
    fail(`${r.nutChet.length} nút tô kín 20 điểm mà KHÔNG đổi một chỉ số nào: ${r.nutChet.join(', ')}`);
  else pass(`cả ${LOP.length*32} nút (5 lớp × 32) đều đổi được chỉ số thật`);

  // ── 6. bảng Binh Khí bám vào trang bị ──
  if (r.bamDoSai.length)
    fail(`nút Binh Khí vẫn cộng khi tháo sạch đồ (thành trục phẳng): ${r.bamDoSai.join(', ')}`);
  else pass('nút Binh Khí không đồ thì cộng 0 — đúng là hệ số của trang bị');
  if (!(r.tachNhanh.vkCoNut > r.tachNhanh.chiVk))
    fail(`Ma Luyện không nâng chỉ số vũ khí: ${r.tachNhanh.chiVk} → ${r.tachNhanh.vkCoNut}`);
  else pass(`Ma Luyện: công ${r.tachNhanh.chiVk} → ${r.tachNhanh.vkCoNut}`);
  if (r.tachNhanh.vkNutGiap !== r.tachNhanh.chiVk)
    fail(`nút của GIÁP lại nâng vũ khí: ${r.tachNhanh.chiVk} → ${r.tachNhanh.vkNutGiap}`);
  else pass('nhánh vũ khí và nhánh giáp tách bạch');
  if (r.capRen.p0 !== r.capRen.p0Khong)
    fail(`Thâm Luyện ăn cả trên đồ +0: ${r.capRen.p0Khong} → ${r.capRen.p0}`);
  else pass('đồ +0 không hưởng Thâm Luyện');
  if (!(r.capRen.p9 > r.capRen.p9Khong))
    fail(`đồ +9 không hưởng Thâm Luyện: ${r.capRen.p9Khong} → ${r.capRen.p9}`);
  else pass(`đồ +9 hưởng Thâm Luyện: ${r.capRen.p9Khong} → ${r.capRen.p9}`);

  // ── 6b. biểu tượng ──
  // Dùng LẠI hình giữa các lớp thì được (chủ dự án đã chốt: hình giống nhau, chỉ số phải khác),
  // nhưng TRONG một lớp thì 32 ô phải là 32 ảnh khác nhau — không thì người chơi bấm nhầm ô.
  if (r.thieuIco.length) fail(`${r.thieuIco.length} nút chưa gán biểu tượng: ${r.thieuIco.join(', ')}`);
  else pass('nút nào cũng có biểu tượng, trên cả năm lớp');
  if (!r.anhLaData) fail('biểu tượng không render ra được ảnh');
  else if (r.trungAnhTrongLop.length)
    fail(`trùng ảnh trong cùng một lớp: ${r.trungAnhTrongLop.join(' · ')}`);
  else pass(`mỗi lớp ${LOP.map(k=>r.lop[k].soAnh).join('/')} ảnh — trong lớp không ô nào trùng ô nào`);

  // ── 7. sống qua Tái Sinh + lớp khác ──
  if (r.quaTaiSinh.nut !== 7 || r.quaTaiSinh.chuaDung < 13)
    fail(`Tái Sinh làm mất điểm Đại Thành: ${JSON.stringify(r.quaTaiSinh)}`);
  else pass('điểm đã tiêu và điểm chưa dùng đều sống qua Tái Sinh');

  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 ? 0 : 1);
})();
