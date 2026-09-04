// Hiệu ứng theo hoa văn vũ khí: kiếm điện chém ra tia xanh, kiếm băng ra mảnh băng. Phải THẤY
// ĐƯỢC (vệt chém + nổ điểm chạm + màu loé), và phải THUẦN HÌNH ẢNH — không đụng vào sát thương.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html'); await p.waitForTimeout(700);
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});

  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    player.level = 60; vhAutoLearn(); calcDerived();
    const o = {};
    const mk = (x, hp) => { const m = { type:'boar',
      // el:null — khắc hệ là đường thứ BA đè lên màu hoa văn (sau bạo kích và Hoàn Hảo). Hệ đòn
      // đánh nay lấy theo VŨ KHÍ, mà vũ khí thì roll hệ ngẫu nhiên ⇒ không khoá thì test đỏ
      // ngẫu nhiên: kiếm trơn loé xanh #5db86a (Verdant) thay vì trắng.
      def: Object.assign({}, MOBS.boar, { hp, def:0, size:14, speed:0, aggro:0, el:null }),
      x, y:600, hp, maxHp:hp, atkT:9e9, dead:false, hitT:0, deadT:0,
      zone:null, pack:null, poisonT:0, poisonDps:0, stunT:0 };
      mobs.push(m); return m; };
    // gắn một vũ khí mang hoa văn cho trước
    const wear = (defId) => {
      if (!defId){ player.equip.vukhi = null; return; }
      const d = ITEM_DB[defId];
      const it = genSpecific('vukhi', 2, d.lv); it.def = defId; it.tier = d.tier; it.name = d.name;
      player.equip.vukhi = it; calcDerived();
    };
    // đo: đánh một đòn rồi xem hiệu ứng nào sinh ra
    const swing = () => {
      buildWorld(); mobs.length = 0; effects.length = 0;
      // Khoá hai đường ngẫu nhiên ĐÈ LÊN màu hoa văn: bạo kích và Hoàn Hảo. Cả hai thắng hoa
      // văn là CỐ Ý (chúng là thông tin chiến đấu), nên không khoá thì test đỏ ngẫu nhiên.
      player.crit = 0; player.perfectProc = 0;
      player.x = 600; player.y = 600; player.face = 0;
      const m = mk(660, 9e8);
      player.cd = {}; doBasic();
      for (let i = 0; i < 10; i++) update(0.02);   // chờ tới khung tiếp xúc (0,09s)
      const cols = effects.map(e => (e.color || '').toLowerCase());
      return { mauVet: cols, hitCol: (m.hitCol || '').toLowerCase(), soHieuUng: effects.length,
               daTrung: m.hp < m.maxHp, stDaGay: m.maxHp - m.hp };
    };
    wear(null);                       o.tayKhong = swing();
    wear('thieulam_kiem_1');          o.kiemTron = swing();     // Kiếm Thép (giai 2) — motif 'khong'
    wear('thieulam_kiem_5');          o.kiemLua  = swing();     // Kiếm Lôi Đình (giai 6) — motif 'lua'
    wear('minhgiao_makiem_3');        o.maKiem   = swing();     // Ma Kiếm Lửa Dữ (giai 4) — motif 'mach'
    wear('thieulam_kiem_3');          o.kiemGai  = swing();     // Kiếm Vảy Rồng (giai 4) — motif 'gai'
    // Bạo kích và Hoàn Hảo phải ĐÈ LÊN màu hoa văn — đây là hành vi cố ý, chốt lại luôn
    {
      wear('thieulam_kiem_5');            // hoa văn lửa
      buildWorld(); mobs.length = 0; player.x = 600; player.y = 600;
      const m1 = mk(660, 9e8); player.crit = 0; player.perfectProc = 1; hurtMob(m1, 100, 'hit');
      o.hoanHaoDeLenHoaVan = (m1.hitCol || '').toLowerCase();
      const m2 = mk(700, 9e8); player.perfectProc = 0; hurtMob(m2, 100, 'crit');
      o.baoKichDeLenHoaVan = (m2.hitCol || '').toLowerCase();
    }
    o.motifs = { kiem1: ITEM_DB['thieulam_kiem_1'].motif, kiem4: ITEM_DB['thieulam_kiem_5'].motif,
                 ma4: ITEM_DB['minhgiao_makiem_3'].motif, kiem3: ITEM_DB['thieulam_kiem_3'].motif };
    // Sát thương KHÔNG được đổi theo hoa văn. Phải đo trên CÙNG MỘT MÓN, chỉ đổi mỗi `def` —
    // sinh hai món rồi so là sai, chênh lệch khi đó là do dòng phụ ngẫu nhiên.
    {
      wear('thieulam_kiem_1');
      const it = player.equip.vukhi;
      o.atkTron = player.atk;
      it.def = 'thieulam_kiem_5';      // đổi sang món CÓ hoa văn lửa, giữ nguyên mọi chỉ số
      calcDerived();
      o.atkLua = player.atk;
      o.hoaVanDaDoi = (itemDef(it) || {}).motif;
    }
    return o;
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  const co = (x, c) => x.mauVet.includes(c);
  if (r.motifs.kiem4 !== 'lua') fail(`Kiếm Hỏa Long phải mang hoa văn lửa, đang là "${r.motifs.kiem4}"`);
  if (r.motifs.ma4 !== 'mach') fail(`Ma Kiếm phải mang hoa văn mạch, đang là "${r.motifs.ma4}"`);
  if (!r.kiemLua.daTrung) fail('dựng cảnh sai: đòn đánh không trúng quái');
  if (!co(r.kiemLua, '#ff8a2a')) fail(`kiếm lửa không sinh hiệu ứng cam: ${JSON.stringify(r.kiemLua.mauVet)}`);
  if (!co(r.maKiem, '#c8a8ff')) fail(`ma kiếm không sinh hiệu ứng tím: ${JSON.stringify(r.maKiem.mauVet)}`);
  if (!co(r.kiemGai, '#ff6a5a')) fail(`kiếm gai không sinh hiệu ứng đỏ: ${JSON.stringify(r.kiemGai.mauVet)}`);
  if (co(r.kiemTron, '#ff8a2a')) fail('kiếm TRƠN lại sinh hiệu ứng lửa — hoa văn rò sang món khác');
  if (r.kiemLua.hitCol !== '#ff8a2a') fail(`màu loé khi trúng không theo hoa văn: ${r.kiemLua.hitCol}`);
  if (r.kiemTron.hitCol !== '#ffffff') fail(`kiếm trơn phải loé trắng, đang ${r.kiemTron.hitCol}`);
  if (r.hoanHaoDeLenHoaVan !== '#ff9df0') fail(`Hoàn Hảo phải đè lên màu hoa văn, đang ${r.hoanHaoDeLenHoaVan}`);
  if (r.baoKichDeLenHoaVan !== '#ffd76a') fail(`bạo kích phải đè lên màu hoa văn, đang ${r.baoKichDeLenHoaVan}`);
  if (r.kiemLua.soHieuUng <= r.kiemTron.soHieuUng)
    fail(`hoa văn không thêm hiệu ứng nào (lửa ${r.kiemLua.soHieuUng} vs trơn ${r.kiemTron.soHieuUng})`);
  if (r.hoaVanDaDoi !== 'lua') fail(`dựng cảnh sai: đổi def rồi mà hoa văn vẫn là "${r.hoaVanDaDoi}"`);
  if (r.atkTron !== r.atkLua)
    fail(`sát thương đổi theo hoa văn (${r.atkTron} → ${r.atkLua}) — hiệu ứng phải THUẦN hình ảnh`);
  if (r.tayKhong.mauVet.some(c => ['#ff8a2a','#c8a8ff','#8fe0ff'].includes(c)))
    fail('tay không mà vẫn có hiệu ứng hoa văn');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
