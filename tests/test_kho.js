// Kho + gộp hai bảng nhân vật trùng nhau.
//
// (A) Bảng nhân vật từng có HAI cửa sổ: phím C (tab Thông Tin) và phím V (panel-vstat). Cả hai
//     in y hệt điểm tiềm năng, năm chỉ số có nút +/Max, rồi THUỘC TÍNH CHIẾN ĐẤU — và còn lệch
//     nhau (bản V có thêm Mana, Instinct, Hệ đòn đánh). Nay còn một.
//
// (B) Kho. Yêu cầu ban đầu là ngăn cất NGỌC cho khỏi đầy rương, nhưng đo trong code thì ngọc và
//     Box Kundun là Ô ĐẾM, không đi qua player.inv, nên không thể làm đầy túi. Thứ làm đầy túi
//     là TRANG BỊ (30 ô, 7 chỗ trong game phải chặn vì "Túi đồ đã đầy"). Kho cất trang bị.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // A1) chỉ còn MỘT bảng nhân vật, và phím V mở đúng bảng đó
  const rA = await p.evaluate(() => {
    const conVStat = !!document.getElementById('panel-vstat');
    window.dispatchEvent(new KeyboardEvent('keydown', { key:'v' }));
    const moBangChar = !el('panel-char').classList.contains('hidden');
    const tab = window.charTab;
    const h = el('panel-char').innerHTML;
    const soKhoiThuocTinh = (h.match(/THUỘC TÍNH CHIẾN ĐẤU/g) || []).length;
    const soKhoiTiemNang = (h.match(/Điểm tiềm năng|ĐIỂM TIỀM NĂNG/g) || []).length;
    return { conVStat, moBangChar, tab, soKhoiThuocTinh, soKhoiTiemNang,
             coMana: /<span>Mana<\/span>/.test(h), coInstinct: /(Bản Năng|Instinct) \(nâng kỹ năng\)/.test(h) };
  });
  console.log('A) bảng nhân vật:', JSON.stringify(rA));
  if (rA.conVStat) fail('panel-vstat vẫn còn trong DOM');
  if (!rA.moBangChar || rA.tab !== 'info') fail('phím V không mở tab Thông Tin');
  if (rA.soKhoiThuocTinh !== 1) fail(`THUỘC TÍNH CHIẾN ĐẤU in ${rA.soKhoiThuocTinh} lần, phải 1`);
  if (rA.soKhoiTiemNang !== 1) fail(`điểm tiềm năng in ${rA.soKhoiTiemNang} lần, phải 1`);
  if (!rA.coMana || !rA.coInstinct) fail('gộp mà mất dòng Mana/Bản Năng của bản đầy đủ hơn');

  // A2) nút + vẫn cộng được điểm sau khi gỡ bảng kia
  const rA2 = await p.evaluate(() => {
    player.free = 10; player.str = 50; calcDerived(); renderChar();
    const truoc = player.str;
    addAttr('str', 3);
    return { truoc, sau: player.str, con: player.free };
  });
  console.log('   cộng điểm:', JSON.stringify(rA2));
  if (rA2.sau !== rA2.truoc + 3) fail('nút cộng điểm hỏng sau khi gỡ bảng V');
  if (rA2.con !== 7) fail(`điểm còn ${rA2.con}, phải 7`);

  // B1) cất và lấy ra
  const rB = await p.evaluate(() => {
    player.inv = []; player.kho = [];
    for (let i = 0; i < 5; i++) player.inv.push(genItem(40, 0));
    const ten = player.inv[2].name;
    khoDeposit(2);
    const sauCat = { tui: player.inv.length, kho: player.kho.length, tenTrongKho: player.kho[0] && player.kho[0].name };
    khoWithdraw(0);
    return { ten, sauCat, sauLay: { tui: player.inv.length, kho: player.kho.length,
             tenVeTui: player.inv[player.inv.length-1].name } };
  });
  console.log('B) cất/lấy:', JSON.stringify(rB));
  if (rB.sauCat.tui !== 4 || rB.sauCat.kho !== 1) fail('cất vào kho sai số lượng');
  if (rB.sauCat.tenTrongKho !== rB.ten) fail('cất nhầm món');
  if (rB.sauLay.tui !== 5 || rB.sauLay.kho !== 0) fail('lấy ra khỏi kho sai số lượng');
  if (rB.sauLay.tenVeTui !== rB.ten) fail('lấy nhầm món');

  // B2) "Cất đồ thừa" phải GIỮ LẠI món mạnh hơn đồ đang mặc
  const rB2 = await p.evaluate(() => {
    player.inv = []; player.kho = [];
    player.equip = {}; player.level = 100; calcDerived();
    for (let i = 0; i < 8; i++) player.inv.push(genItem(40, 0));
    // mặc sẵn món mạnh nhất mỗi ô để phần còn lại thành "đồ thừa"
    const manh = genItem(100, 0.9); manh.slot = 'vukhi'; player.equip.vukhi = manh;
    const truoc = player.inv.length;
    const giuLai = player.inv.filter(it => itemUsable(it) && player.level >= itemReqLv(it)
      && itemPower(it) > (player.equip[it.slot] ? itemPower(player.equip[it.slot]) : 0)).length;
    khoDepositAll();
    return { truoc, giuLai, conTui: player.inv.length, vaoKho: player.kho.length };
  });
  console.log('   cất đồ thừa:', JSON.stringify(rB2));
  if (rB2.conTui !== rB2.giuLai) fail(`giữ lại ${rB2.conTui} món, phải giữ ${rB2.giuLai} món mạnh hơn đồ mặc`);
  if (rB2.vaoKho + rB2.conTui !== rB2.truoc) fail('mất món khi cất hàng loạt');

  // B3) chặn khi kho đầy / túi đầy — không được nuốt món
  const rB3 = await p.evaluate(() => {
    player.kho = []; player.inv = [];
    for (let i = 0; i < 61; i++) player.kho.push(genItem(40, 0));
    player.inv.push(genItem(40, 0));
    const ten = player.inv[0].name;
    khoDeposit(0);
    const khoDay = { tui: player.inv.length, conTen: player.inv[0] && player.inv[0].name === ten };
    player.kho = [genItem(40,0)]; player.inv = [];
    for (let i = 0; i < 30; i++) player.inv.push(genItem(40, 0));
    khoWithdraw(0);
    return { khoDay, tuiDay: { tui: player.inv.length, kho: player.kho.length } };
  });
  console.log('   chặn khi đầy:', JSON.stringify(rB3));
  if (!rB3.khoDay.conTen || rB3.khoDay.tui !== 1) fail('kho đầy mà vẫn nuốt mất món trong túi');
  if (rB3.tuiDay.tui !== 30 || rB3.tuiDay.kho !== 1) fail('túi đầy mà vẫn lấy mất món khỏi kho');

  // B4) tab Kho vẽ được, và ngăn ngọc là chỗ XEM (không có nút gửi)
  const rB4 = await p.evaluate(() => {
    player.kho = [genItem(40,0), genItem(40,0)];
    player.jewels = { chucPhuc:9, linhHon:4, sinhMenh:2, honDon:1 };
    player.baohap = { 3:5 };
    window.bagTab = 'kho'; renderBag();
    const h = el('panel-bag').innerHTML;
    return { coTab: /Kho<\/button>|>Kho</.test(h), oKho: (h.match(/khoWithdraw\(/g)||[]).length,
             coNganNgoc: /NGĂN NGỌC/.test(h), anhNgoc: (h.match(/<img[^>]+data:image\/png/g)||[]).length,
             coNutGuiNgoc: /guiNgoc|depositJewel/.test(h) };
  });
  console.log('   tab Kho:', JSON.stringify(rB4));
  if (rB4.oKho !== 2) fail(`vẽ ${rB4.oKho} ô kho, phải 2`);
  if (!rB4.coNganNgoc) fail('thiếu ngăn ngọc');
  if (rB4.anhNgoc < 8) fail(`ngăn ngọc chỉ có ${rB4.anhNgoc} icon`);
  if (rB4.coNutGuiNgoc) fail('có nút gửi ngọc — ngọc là ô đếm, gửi đi đâu?');

  // C) Ngăn Ngọc: gửi/rút, và ngọc đang CẤT thì không tiêu được
  const rC = await p.evaluate(() => {
    player.jewels = { chucPhuc:9, linhHon:4, sinhMenh:2, honDon:1 };
    player.gems = { tuLa:7, honNguyen:3 }; player.baohap = { 3:5 }; player.khoNgoc = { hap:{} };
    khoNgocGui('chucPhuc', 'all');
    const sauGui = { tui: player.jewels.chucPhuc, kho: player.khoNgoc.chucPhuc };
    khoNgocRut('chucPhuc', 'all');
    const sauRut = { tui: player.jewels.chucPhuc, kho: player.khoNgoc.chucPhuc };
    khoHapGui(3, 'all');
    const hap = { tui: player.baohap[3], kho: player.khoNgoc.hap[3] };
    khoNgocGuiHet();
    const guiHet = { jewels: Object.values(player.jewels).reduce((a,b)=>a+b,0),
                     gems: Object.values(player.gems).reduce((a,b)=>a+b,0),
                     kho: KHO_NGOC_KEYS.reduce((a,k)=>a+player.khoNgoc[k],0) };
    return { sauGui, sauRut, hap, guiHet };
  });
  console.log('C) ngăn ngọc:', JSON.stringify(rC));
  if (rC.sauGui.tui !== 0 || rC.sauGui.kho !== 9) fail('gửi ngọc sai số lượng');
  if (rC.sauRut.tui !== 9 || rC.sauRut.kho !== 0) fail('rút ngọc sai số lượng');
  if (rC.hap.tui !== 0 || rC.hap.kho !== 5) fail('gửi Box Kundun sai số lượng');
  if (rC.guiHet.jewels !== 0 || rC.guiHet.gems !== 0) fail('"Gửi hết" bỏ sót ngọc trong túi');
  if (rC.guiHet.kho !== 26) fail(`"Gửi hết" cất ${rC.guiHet.kho} viên, phải 26 (9+4+2+1 châu = 16, cộng 7+3 đá = 10)`);

  // C2) ngọc đang cất KHÔNG bỏ vào khay rèn được, và game phải nói rõ nó nằm đâu
  const rC2 = await p.evaluate(() => {
    player.jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
    player.khoNgoc = Object.assign({ hap:{} }, { chucPhuc:9, linhHon:0, sinhMenh:0, honDon:0, tuLa:0, honNguyen:0 });
    window.forgeTray = [];
    let noi = '';
    const goc = window.chaosSay; window.chaosSay = (m) => { noi = m; };
    chaosAddJewel('chucPhuc');
    window.chaosSay = goc;
    return { boVaoKhay: forgeTray.length, noi };
  });
  console.log('   ngọc đang cất:', JSON.stringify(rC2));
  if (rC2.boVaoKhay !== 0) fail('ngọc đang CẤT mà vẫn bỏ vào khay rèn được — kho không có nghĩa gì');
  if (!/Kho/.test(rC2.noi)) fail('không báo ngọc đang nằm trong kho: ' + rC2.noi);

  // D) mở Box Kundun lúc túi đầy: đồ phải vào KHO, không được quy ra bạc.
  //    KHÔNG dò bằng "bạc có tăng không" — mở hộp LUÔN cho bạc kèm theo (150 + tầng×120), nên
  //    phép đo đó bắt nhầm phần thưởng bình thường. Dò bằng: món có vào kho không.
  //    Từ bản "ném hạp ra đất", openBaoHap() KHÔNG còn đồng bộ: nó ném hạp ra, hạp bay rồi
  //    mới nổ sau chừng 0,9 giây. Nên phải chờ nổ hết rồi mới đọc Kho — đọc ngay thì lúc nào
  //    cũng thấy 0, và đó là lỗi của phép đo chứ không phải của game.
  const rD = await p.evaluate(async () => {
    player.inv = []; for (let i = 0; i < 30; i++) player.inv.push(genItem(40, 0));
    player.kho = []; player.baohap = { 7: 20 };
    for (let i = 0; i < 20; i++) openBaoHap(7);
    await new Promise(r => setTimeout(r, 3200));   // đủ cho cả 20 hạp bay + nổ
    return { vaoKho: player.kho.length, kho: player.kho.length, tui: player.inv.length,
             conBay: boxThrows.length };
  });
  console.log('D) mở hộp lúc túi đầy:', JSON.stringify(rD));
  if (rD.tui !== 30) fail('mở hộp làm tràn túi');
  if (rD.vaoKho !== 20) fail(`chỉ ${rD.vaoKho}/20 món vào kho — số còn lại bị quy ra bạc, tức là mất đồ`);

  // D2) chỉ khi túi VÀ kho cùng đầy mới được quy ra bạc — đó là đường cuối, không phải mặc định
  const rD2 = await p.evaluate(async () => {
    player.inv = []; for (let i = 0; i < 30; i++) player.inv.push(genItem(40, 0));
    player.kho = []; for (let i = 0; i < 60; i++) player.kho.push(genItem(40, 0));
    player.baohap = { 7: 3 };
    const khoTruoc = player.kho.length, tuiTruoc = player.inv.length;
    openBaoHap(7);
    await new Promise(r => setTimeout(r, 1600));
    return { kho: player.kho.length, tui: player.inv.length, khoTruoc, tuiTruoc };
  });
  console.log('   túi và kho cùng đầy:', JSON.stringify(rD2));
  if (rD2.kho !== rD2.khoTruoc || rD2.tui !== rD2.tuiTruoc) fail('kho đầy rồi mà vẫn nhét thêm được');

  await p.waitForTimeout(400);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
