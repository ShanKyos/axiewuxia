// Gỡ hệ Thú Thuần Hóa — và hoàn lại cho người chơi đang giữ.
//
// Lý do gỡ: nó và Thú Chiến là hai hệ thú cưng song song giẫm chân nhau — cả hai đều là "con thú
// đi cạnh và tự đánh quái". Đo bằng cách chạy thật: Thú Chiến đánh mỗi 1,4s và CỘNG CHỈ SỐ cho
// người chơi (str/agi/def/vit/hp/crit/hồi mana); Thú Thuần Hóa đánh mỗi 1,2s và không cộng gì.
// Khi phải bỏ một, bỏ cái không cộng gì.
//
// Bài kiểm này gác đúng thứ dễ hỏng nhất khi gỡ một hệ thống: NGƯỜI CHƠI KHÔNG ĐƯỢC MẤT GIÁ TRỊ.
// Ấn Thuần Thú hoàn theo đúng giá tiệm; Lõi Nguyên Tố đã cho thú ăn phải trả về túi. Và cái ấn đã
// tiêu để thu phục con thú đang nuôi cũng phải hoàn — nếu quên, người nuôi thú lâu năm lại thiệt
// hơn người mua ấn rồi để đó.
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
  // save CŨ có thú + 4 ấn + đã cho ăn 7 lõi
  const r = await p.evaluate(() => {
    player.silver = 1000; player.noidan = 2;
    saveGame();
    const raw = JSON.parse(localStorage.getItem('vlcm_save'));
    // v4: save chứa NĂM ô nhân vật; nhân vật đang chơi nằm trong slots[active], không còn ở gốc.
    const O = raw.slots[raw.active];
    O.player.silver = 1000; O.player.phongphu = 4;
    O.player.pet = { type:'boar', name:'Heo', lv:9, el:'Hỏa', feed:7 };
    O.player.noidan = { Kim:0, 'Mộc':0, 'Thổ':0, 'Thủy':0, 'Hỏa':2 };  // save cũ vẫn dạng object
    localStorage.setItem('vlcm_save', JSON.stringify(raw));
    loadGame();
    return { bac: player.silver, hoa: player.noidan,
             conPet: 'pet' in player, conAn: 'phongphu' in player };
  });
  const mongBac = 1000 + 4*1500 + 1500;      // 4 ấn chưa dùng + 1 ấn đã dùng cho con thú
  const mongHoa = 2 + Math.ceil(7/2);        // lõi đã cho ăn được trả lại (object cũ gộp về số)
  console.log('1) hoàn lại khi gỡ hệ:', JSON.stringify(r), '· mong bạc', mongBac, '· mong lõi', mongHoa);
  if (r.bac !== mongBac) fail(`bạc ${r.bac}, phải ${mongBac}`);
  if (r.hoa !== mongHoa) fail(`Lõi Nguyên Tố ${r.hoa}, phải ${mongHoa}`);
  if (r.conPet || r.conAn) fail('ô đếm chưa xoá khỏi player');

  const r2 = await p.evaluate(() => {
    applyTestBoost();
    const tabs = (typeof CHAR_TABS !== 'undefined' ? CHAR_TABS : []).map(t => t.id);
    // bấm T không được ném lỗi
    window.dispatchEvent(new KeyboardEvent('keydown', { key:'t' }));
    renderCharPanel();
    const txt = document.body.innerText.toLowerCase();
    return { tabs, conTab: tabs.includes('pet'),
             conChu: ['thuần thú','thú thuần hóa','thả về'].filter(w => txt.includes(w)) };
  });
  console.log('2) UI sau khi gỡ:', JSON.stringify(r2));
  if (r2.conTab) fail('tab Thú Thuần Hóa vẫn còn');
  if (r2.conChu.length) fail('còn chữ: ' + r2.conChu.join(', '));
  await p.waitForTimeout(600);
  console.log('errors:', JSON.stringify(errs));
  if (errs.length) fail('lỗi trang: ' + errs[0]);
  console.log(bad === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close(); process.exit(bad === 0 ? 0 : 1);
})();
