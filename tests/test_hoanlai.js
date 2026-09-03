// Về mô hình MU — save đời cũ phải được HOÀN LẠI đúng tới từng đồng.
//
// Sáu hệ nâng cấp song song (Thần Binh · Đài Hội Lực + Vườn · Tấn Phẩm · Linh Thú · Khắc Ấn ·
// Cổ Thần) và loại nguyên liệu nuôi chúng (Huyền Thiết) đã gỡ hẳn. Ai đã cày chúng thì nhận lại
// đúng những gì đã đổ vào, theo ĐÚNG bảng giá của bản cũ — bài này khoá lại từng con số đó.
//
// Bẫy đã mắc khi viết bài: p.reload() kích beforeunload → saveGame() ghi đè bản seed bằng nhân
// vật sạch đang chạy, và bài kiểm lặng lẽ đo một save không có gì để hoàn (mọi số về 0, phần
// "dọn sạch" vẫn XANH vì trường có bao giờ tồn tại đâu). window._wiping chặn đúng đường ghi đó.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(400);

  const seed = await page.evaluate(() => {
    startGame('vophai', null);
    player.level = 60; player.silver = 0; player.noidan = 0;
    player.gems = { tuLa:0, honNguyen:0 };
    player.jewels = { chucPhuc:0, linhHon:0, sinhMenh:0, honDon:0 };
    player.baohap = {}; player.mats = { manh:0, tichMa:0 };
    saveGame();
    const doc = JSON.parse(localStorage.getItem('vlcm_save'));
    const P = doc.slots[doc.active].player;
    P.mat = 10;                               // 10 × 150 ................................  1.500◈
    P.thanbinh = { tier: 5 };                 // Σ2t = 20 Lõi · Σ15t = 150 Huyền Thiết ... 22.500◈
    P.abode = { tulinh: 2, garden: [{ seed:'hoisinh' }, null, null] };
                                              // 250·2·3 + 1,5·2·3·150 ...................  2.850◈
                                              // 1 luống đang gieo ........................    100◈
    P.equip.pet = { slot:'pet', plus:4, uid:9001, name:'Pet', rarity:2, subs:[], level:1 };
                                              // bậc 1-3: 1500·6 = 9.000 · bậc 4: 16.000
                                              // Huyền Thiết 12 + 20 = 32 × 150 = 4.800 ... 29.800◈ + 1 Tu La
    P.mats.manhCoThan = 130;                  // 2 Box Kundun + 10 lẻ × 150 ...............  1.500◈
    P.mats.anTranAi = 3;                      // 3 × GO_CONGHUAN .........................  6.000◈
    P.inv.push({ slot:'nhan1', plus:0, uid:9002, name:'Nhẫn', rarity:1, subs:[], level:1,
                 sigil:'abc', ancient:'def' });
    doc.v = 4;
    localStorage.setItem('vlcm_save', JSON.stringify(doc));
    window._wiping = true;                    // đừng để beforeunload ghi đè bản seed
    return doc.active;
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const S = await page.evaluate((i) => {
    const pre = JSON.parse(localStorage.getItem('vlcm_save'));
    if (pre.v !== 4) return { loi: 'bản seed bị ghi đè, v=' + pre.v };
    if (!loadGame(i)) return { loi: 'loadGame() trả false' };
    return {
      silver: player.silver, noidan: player.noidan, tuLa: player.gems.tuLa,
      baohap: player.baohap[shopBaoHapTier()] || 0,
      conMat: 'mat' in player, conTb: 'thanbinh' in player, conAbode: 'abode' in player,
      conPet: !!(player.equip && player.equip.pet),
      petTui: player.inv.filter(x => x && x.slot === 'pet').length,
      conSigil: player.inv.some(x => x && x.sigil) || Object.values(player.equip).some(x => x && x.sigil),
      conAncient: player.inv.some(x => x && x.ancient) || Object.values(player.equip).some(x => x && x.ancient),
      conSigils: 'sigils' in player,
      conMct: 'manhCoThan' in player.mats, conAn: 'anTranAi' in player.mats,
      v: SAVE_VERSION,
    };
  }, seed);

  if (S.loi){ console.log('LỖI:', S.loi); console.log('FAIL'); await browser.close(); process.exit(1); }

  const BAC = 1500 + 22500 + 2850 + 100 + 29800 + 1500 + 6000;   // 64.250◈
  const ok = [];
  const check = (ten, dat, mong) => { const p = dat === mong; ok.push(p);
    console.log(`${p ? 'OK  ' : 'FAIL'} ${ten}: ${dat}${p ? '' : ` (mong ${mong})`}`); };

  check('bạc hoàn lại',        S.silver, BAC);
  check('Lõi Nguyên Tố',       S.noidan, 20);
  check('Tu La Tinh Thạch',    S.tuLa, 1);
  check('Box Kundun',          S.baohap, 2);
  check('player.mat đã xoá',   S.conMat, false);
  check('thanbinh đã xoá',     S.conTb, false);
  check('abode đã xoá',        S.conAbode, false);
  check('Linh Thú rời ô mặc',  S.conPet, false);
  check('Linh Thú rời túi',    S.petTui, 0);
  check('Khắc Ấn đã xoá',      S.conSigil, false);
  check('Cổ Thần đã xoá',      S.conAncient, false);
  check('player.sigils đã xoá', S.conSigils, false);
  check('manhCoThan đã xoá',   S.conMct, false);
  check('anTranAi đã xoá',     S.conAn, false);
  check('SAVE_VERSION',        S.v, 5);
  check('không lỗi trang',     errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 3));

  console.log(ok.every(Boolean) ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok.every(Boolean) ? 0 : 1);
})();
