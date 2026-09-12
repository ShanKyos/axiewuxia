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
// Trần cho TỔNG — nhưng không phải tổng của MỌI tấm nữa. Từ khi có VFX_ATLAS_TOI_DA, game chỉ
// giữ tối đa ngần ấy tấm cùng lúc, nên con số đáng sợ là tổng của N TẤM NẶNG NHẤT chứ không
// phải tổng cả bộ. Đổi mốc như vậy để bài này không cản việc thêm clip mới: thêm clip thứ 20
// hay 40 cũng không làm đỉnh nhích lên, miễn từng tấm còn dưới trần và trần số lượng còn đó.
// (Mốc cũ là 100 MB cho tổng cả bộ — nó đã suýt chặn đợt thêm hai clip cho màn Khế Ước.)
const TRAN_NANG_NHAT_MB = 70;
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

    // ① Cỡ từng atlas suy THẲNG TỪ BẢNG KHAI, không phải từ ảnh đã nạp: nay có trần số lượng
    //    nên nạp cả bộ rồi đo là đo nhầm — mấy tấm đầu đã bị thả trước khi đọc tới.
    const ids = Object.keys(VFX_ATLAS_DEFS);
    const atlas = ids.map(id => { const d = VFX_ATLAS_DEFS[id];
      return { id, mb: mb(d.cols * d.frameW * d.rows * d.frameH) }; });

    // ①b Trần số lượng có chạy thật không: xin cả bộ, chỉ được giữ lại tối đa VFX_ATLAS_TOI_DA.
    effects.length = 0;
    ids.forEach(getVfxAtlasImg);
    await new Promise(r => setTimeout(r, 3000));
    const giuSauKhiXinHet = Object.keys(VFX_ATLAS_IMGS).length;
    // ①c Tấm đang có hiệu ứng CHẠY DỞ không được thả, dù bị ép vượt trần.
    effects.length = 0;
    spawnAtlasVfx(ids[0], player.x, player.y, 0.4);
    ids.forEach(getVfxAtlasImg);
    const giuTamDangChay = !!VFX_ATLAS_IMGS[ids[0]];
    effects.length = 0;

    // ② đi hết mọi map ngoài trời ⇒ nạp hết ảnh nền
    const ds = Object.keys(MAPS).filter(k => !MAPS[k].dungeon);
    for (const k of ds) mapBgOf(k);
    await new Promise(r => setTimeout(r, 2500));
    const bgTruocDon = Object.keys(MAP_BG).length;
    const bgMB = mb(Object.values(MAP_BG).reduce((n, im) => n + (im.naturalWidth ? im.naturalWidth*im.naturalHeight : 0), 0));
    _bgTruoc = null; mapBgDon(curMap);
    const bgSauDon = Object.keys(MAP_BG).length;
    const bgCoTranh = Object.keys(MAP_BG_SRC).filter(k => MAPS[k] && !MAPS[k].dungeon).length;

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
      atlas, giuSauKhiXinHet, giuTamDangChay, tranSoLuong: VFX_ATLAS_TOI_DA,
      nangNhatMB: +atlas.map(a => a.mb).sort((x, y) => y - x)
                        .slice(0, VFX_ATLAS_TOI_DA).reduce((n, v) => n + v, 0).toFixed(1),
      bgTruocDon, bgCoTranh, bgSauDon, bgMB,
      itemArt: _itemArtCache.size, tranItemArt: ITEM_ART_CAP,
      heroCard: _heroCardCache.size, tranHeroCard: HERO_CARD_CAP,
      hs: _hsCache.size, tranHs: HS_CAP,
      daBo, conAtlas: Object.keys(VFX_ATLAS_IMGS).length, soAtlas: ids.length,
      anhGiuMB: window.anhDangGiuMB(),
    };
  });

  console.log(JSON.stringify(out, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const pass = m => console.log('PASS', m);

  // Chốt chặn chống rỗng: bảng khai rỗng thì mọi phép đo bên dưới xanh vì KHÔNG ĐO GÌ.
  if (!out.atlas.length) fail('VFX_ATLAS_DEFS rỗng — phép đo rỗng');
  for (const a of out.atlas){
    if (a.mb > TRAN_MOT_ATLAS_MB)
      fail(`atlas ${a.id} chiếm ${a.mb} MB RAM khi giải nén (trần ${TRAN_MOT_ATLAS_MB} MB) — ảnh quá to so với cỡ vẽ ra màn`);
  }
  if (out.nangNhatMB > TRAN_NANG_NHAT_MB)
    fail(`${out.tranSoLuong} tấm nặng nhất cộng lại ${out.nangNhatMB} MB (trần ${TRAN_NANG_NHAT_MB} MB)`);
  else pass(`đỉnh xấu nhất ${out.nangNhatMB} MB — ${out.tranSoLuong} tấm nặng nhất trong ${out.atlas.length} clip`);
  if (out.giuSauKhiXinHet > out.tranSoLuong)
    fail(`xin cả ${out.atlas.length} atlas thì giữ lại ${out.giuSauKhiXinHet} — trần số lượng là ${out.tranSoLuong}`);
  else pass(`trần số lượng chạy: xin ${out.atlas.length}, giữ ${out.giuSauKhiXinHet}`);
  if (!out.giuTamDangChay)
    fail('tấm đang có hiệu ứng chạy dở bị thả — hiệu ứng sẽ biến mất giữa chừng');
  else pass('tấm đang chạy dở không bị thả dù vượt trần');
  // Thứ phải đúng là CÒN LẠI BAO NHIÊU, không phải bỏ bao nhiêu. Trần số lượng khiến chỉ vài
  // tấm còn sống lúc quét, nên `daBo === soAtlas` là mốc sai từ khi có trần — nó đòi bỏ 8 tấm
  // trong khi trước đó chỉ có 4 tấm trong tay. Ép mọi tấm thành "lâu không dùng" thì phải
  // sạch bằng 0, đó mới là điều kiện thật.
  if (out.conAtlas !== 0)
    fail(`dọn atlas hỏng: còn ${out.conAtlas} tấm sau khi ép mọi tấm thành lâu không dùng`);
  else pass(`dọn sạch atlas không dùng (bỏ ${out.daBo} tấm đang giữ)`);
  // ⚠ NGƯỠNG NÀY SUY TỪ DỮ LIỆU, KHÔNG CHÉP CỨNG. Nó chỉ là cột chống "phép đo rỗng": phải nạp
  // được vài tấm thì mới chứng minh được là bước DỌN có tác dụng. Con số 5 cũ là số map có tranh
  // nền hồi cả game còn dùng tranh phẳng; sáu map đã chuyển sang lát viên (`sanIso`) nên chúng
  // không nạp tranh nào nữa, và bài đỏ trong khi việc nó gác vẫn đúng y nguyên.
  // Đọc thẳng từ MAP_BG_SRC: map nào còn khai tranh nền thì mới đếm.
  if (out.bgTruocDon < Math.min(3, out.bgCoTranh)) fail(`chỉ nạp được ${out.bgTruocDon}/${out.bgCoTranh} ảnh nền — phép đo dọn ảnh nền rỗng`);
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
