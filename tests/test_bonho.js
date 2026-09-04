// TRẦN BỘ NHỚ ẢNH.
// Chrome báo "Aw, Snap" = tiến trình render chết, gần như luôn là hết bộ nhớ. Thứ giết nó KHÔNG
// nằm trong performance.memory: ảnh đã giải nén và canvas nằm ngoài heap JS, nên đo heap là đo
// nhầm chỗ. Bài này đếm thẳng số byte ảnh game đang GIỮ.
//
// Con số gốc đo được trước khi sửa: 6 atlas hiệu ứng = 12,3 MB trên đĩa nhưng 365 MB khi giải
// nén, nạp lười rồi giữ vĩnh viễn; 11 ảnh nền map = 117 MB nếu đi hết; _heroCardCache không có
// trần. Cộng lại vượt 550 MB.
const { chromium } = require('playwright');
const URL = 'http://localhost:8871/index.html?max=1';

// Trần cho TỪNG tấm atlas. Bản gốc là 52-70 MB một tấm — đúng thứ phải chặn không cho quay lại.
const TRAN_MOT_ATLAS_MB = 22;
const TRAN_TONG_ATLAS_MB = 100;
const TRAN_ANH_GIU_MB = 170;   // tổng ảnh giải nén sau khi đi hết map + nổ hết hiệu ứng

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(900);

  const out = await p.evaluate(async () => {
    window.TEST_MODE = true; startGame('thieulam', { name:'Bộ Nhớ' });
    applyTestBoost(); player.tutStep = -1;
    const mb = px => +(px * 4 / 1048576).toFixed(1);

    // ① nổ hết sáu hiệu ứng trạng thái ⇒ nạp cả sáu atlas
    const ids = Object.keys(VFX_ATLAS_DEFS);
    ids.forEach(getVfxAtlasImg);
    await new Promise(r => setTimeout(r, 3000));
    const atlas = ids.map(id => {
      const im = VFX_ATLAS_IMGS[id];
      return { id, taiXong: !!(im && im.complete && im.naturalWidth),
               mb: im && im.naturalWidth ? mb(im.naturalWidth * im.naturalHeight) : -1 };
    });

    // ② đi hết mọi map ngoài trời ⇒ nạp hết ảnh nền
    const ds = Object.keys(MAPS).filter(k => !MAPS[k].dungeon);
    for (const k of ds) mapBgOf(k);
    await new Promise(r => setTimeout(r, 2500));
    const bgTruocDon = Object.keys(MAP_BG).length;
    const bgMB = mb(Object.values(MAP_BG).reduce((n, im) => n + (im.naturalWidth ? im.naturalWidth*im.naturalHeight : 0), 0));
    _bgTruoc = null; mapBgDon(curMap);
    const bgSauDon = Object.keys(MAP_BG).length;

    // ③ 1200 món khác nhau + 400 lần đổi trang bị ⇒ hai kho ảnh phải chạm trần rồi dừng
    for (let i = 0; i < 1200; i++){
      const it = genItem(10 + (i % 120), 3);
      itemArtUrl(itemDef(it), it.tier, it.rarity, it.plus);
      if (i % 3 === 0){ player.equip[it.slot] = it; heroCardUrl(player.sect, heroTier(player), gearVisual(player)); }
    }

    // ④ dọn atlas: giả bộ MỌI tấm đã lâu không dùng
    for (const id in VFX_ATLAS_DUNG) VFX_ATLAS_DUNG[id] = -1e9;
    const daBo = vfxAtlasDon();

    return {
      atlas,
      tongAtlasMB: +atlas.reduce((n, a) => n + Math.max(0, a.mb), 0).toFixed(1),
      bgTruocDon, bgSauDon, bgMB,
      itemArt: _itemArtCache.size, tranItemArt: ITEM_ART_CAP,
      heroCard: _heroCardCache.size, tranHeroCard: HERO_CARD_CAP,
      hs: _hsCache.size, tranHs: HS_CAP,
      daBo, conAtlas: Object.keys(VFX_ATLAS_IMGS).length, soAtlas: ids.length,
      anhGiuMB: window.anhDangGiuMB(),
    };
  });

  console.log(JSON.stringify(out, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  // Chốt chặn chống rỗng: không tải được atlas thì mọi phép đo bên dưới xanh vì KHÔNG ĐO GÌ.
  for (const a of out.atlas){
    if (!a.taiXong) fail(`atlas ${a.id} không tải được — phép đo rỗng`);
    else if (a.mb > TRAN_MOT_ATLAS_MB)
      fail(`atlas ${a.id} chiếm ${a.mb} MB RAM khi giải nén (trần ${TRAN_MOT_ATLAS_MB} MB) — ảnh quá to so với cỡ vẽ ra màn`);
  }
  if (out.tongAtlasMB > TRAN_TONG_ATLAS_MB)
    fail(`${out.atlas.length} atlas cộng lại ${out.tongAtlasMB} MB (trần ${TRAN_TONG_ATLAS_MB} MB)`);
  // Đếm theo BẢNG KHAI, không viết cứng số 6: mỗi lần thêm một tấm hiệu ứng mới (Flame
  // Cyclone là tấm thứ bảy) bài này lại đỏ oan trong khi cơ chế dọn vẫn chạy đúng.
  if (out.daBo !== out.soAtlas || out.conAtlas !== 0)
    fail(`dọn atlas hỏng: bỏ ${out.daBo}/${out.soAtlas}, còn ${out.conAtlas} — atlas không dùng phải được thả ra`);
  if (out.bgTruocDon < 5) fail(`chỉ nạp được ${out.bgTruocDon} ảnh nền — phép đo dọn ảnh nền rỗng`);
  if (out.bgSauDon > 2) fail(`dọn xong vẫn giữ ${out.bgSauDon} ảnh nền map (chỉ được giữ map đang đứng + map vừa rời)`);
  if (out.itemArt > out.tranItemArt) fail(`kho ảnh vật phẩm ${out.itemArt} vượt trần ${out.tranItemArt}`);
  if (out.heroCard > out.tranHeroCard) fail(`kho thẻ nhân vật ${out.heroCard} vượt trần ${out.tranHeroCard}`);
  if (out.hs > out.tranHs) fail(`kho ảnh nhân vật ${out.hs} vượt trần ${out.tranHs}`);
  if (out.anhGiuMB > TRAN_ANH_GIU_MB)
    fail(`sau khi đi hết map và nổ hết hiệu ứng còn giữ ${out.anhGiuMB} MB ảnh (trần ${TRAN_ANH_GIU_MB} MB)`);

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
