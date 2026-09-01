// Cổ Thần Thủ Hộ: 4 bộ đổi tên xong phải (a) không còn chữ kiếm hiệp, (b) giữ nguyên
// bonus b2/b3/b5, (c) save cũ mang id cũ vẫn ăn hiệu ứng bộ sau khi loadGame() ánh xạ.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  // ---- 1. Bảng bộ mới: tên sạch, bonus nguyên vẹn ----
  const table = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    const WUXIA = /Thanh Long|Bạch Hổ|Chu Tước|Huyền Vũ|Tứ Tượng|Phi Phong/;
    return {
      ids: Object.keys(ANCIENT_SETS),
      names: Object.values(ANCIENT_SETS).map(s => s.name),
      hints: Object.values(ANCIENT_SETS).map(s => s.hint),
      cloaks: CLOAK_TIERS.slice(1).map(c => c.name),
      bonuses: Object.fromEntries(Object.entries(ANCIENT_SETS).map(([k, s]) =>
        [k, JSON.stringify([s.b2, s.b3, s.b5])])),
      dirty: Object.values(ANCIENT_SETS).filter(s => WUXIA.test(s.name) || WUXIA.test(s.hint)).map(s => s.name)
        .concat(CLOAK_TIERS.slice(1).filter(c => WUXIA.test(c.name)).map(c => c.name)),
      migrate: ANCIENT_MIGRATE,
    };
  });

  // ---- 2. Save cũ (id kiếm hiệp) phải được ánh xạ và vẫn ăn set bonus ----
  const mig = await p.evaluate(() => {
    // dựng 5 món Cổ Thần bộ CŨ 'thanhlong' rồi ghi vào save, ép loadGame() đọc lại
    const slots = ['non','ao','tay','quan','chan'];
    player.inv = []; player.equip = player.equip || {};
    for (let i = 0; i < 5; i++){
      const it = genAncient('sarkaan', slots[i], 60);
      it.ancient = 'thanhlong';            // giả lập save trước khi đổi tên
      player.equip[slots[i]] = it;
    }
    // 1 món nữa nằm trong TÚI để bắt lỗi nếu migration chỉ quét đồ đang mặc
    const bagIt = genAncient('sarkaan', 'non', 60); bagIt.ancient = 'huyenvu';
    player.inv.push(bagIt);
    saveGame();
    const beforeAtk = (calcDerived(), player.atk);
    // hiệu ứng bộ TRƯỚC migration: id 'thanhlong' không có trong ANCIENT_SETS ⇒ phải rỗng
    const beforeSets = JSON.parse(JSON.stringify(player.setActive || {}));
    loadGame();
    calcDerived();
    return {
      beforeSets,
      afterSets: JSON.parse(JSON.stringify(player.setActive || {})),
      equipIds: Object.keys(player.equip).map(k => player.equip[k] && player.equip[k].ancient).filter(Boolean),
      bagIds: player.inv.map(i => i.ancient).filter(Boolean),
      beforeAtk, afterAtk: player.atk,
      // lấy NGUYÊN nhãn: cắt ngắn ở đây từng làm test báo nhầm vì tên bộ nằm cuối chuỗi
      label: String(tipCard(player.equip.non, null, '')),   // itemLineHtml đã bị xoá, thẻ rê chuột thay thế
    };
  });

  console.log('bộ  :', table.ids.join(', '));
  console.log('tên :', table.names.join(', '));
  console.log('áo choàng:', table.cloaks.join(', '));
  console.log('migrate  :', JSON.stringify(table.migrate));
  console.log('set TRƯỚC loadGame:', JSON.stringify(mig.beforeSets));
  console.log('set SAU   loadGame:', JSON.stringify(mig.afterSets));
  console.log('id đồ mặc:', mig.equipIds.join(','), '| id đồ túi:', mig.bagIds.join(','));
  console.log('atk', mig.beforeAtk, '→', mig.afterAtk);

  let bad = 0;
  const fail = m => { console.log('FAIL', m); bad++; };
  if (table.dirty.length) fail('còn tên kiếm hiệp: ' + table.dirty.join(', '));
  if (table.ids.length !== 4) fail('phải đúng 4 bộ, có ' + table.ids.length);
  // bonus giữ nguyên đúng như bảng cũ (chỉ đổi tên, KHÔNG đổi cân bằng)
  const want = {
    sarkaan:  '[{"atkPct":10},{"critDmg":20},{"aspdPct":8,"hpLeech":3}]',
    velmyr:   '[{"crit":6},{"atkPct":8},{"pierce":10,"perfect":5}]',
    ashvard:  '[{"hpPct":10},{"reflectPct":8},{"dmgred":8,"hpPct":6}]',
    korrveth: '[{"dmgred":6},{"hpPct":12},{"evaPct":8,"reflectPct":5}]',
  };
  for (const k in want) if (table.bonuses[k] !== want[k]) fail(`bonus bộ ${k} đổi: ${table.bonuses[k]}`);
  // migration
  if (mig.equipIds.some(i => i !== 'sarkaan')) fail('đồ MẶC chưa ánh xạ: ' + mig.equipIds.join(','));
  if (mig.bagIds.some(i => i !== 'korrveth')) fail('đồ TÚI chưa ánh xạ: ' + mig.bagIds.join(','));
  if (Object.keys(mig.beforeSets).length !== 0) fail('id cũ lẽ ra không kích hoạt bộ nào');
  if (!mig.afterSets.sarkaan || mig.afterSets.sarkaan.n !== 5) fail('sau migration phải đủ 5/5 bộ sarkaan');
  if (!(mig.afterSets.sarkaan.act || []).includes(5)) fail('mốc 5 món chưa kích hoạt');
  if (!(mig.afterAtk > mig.beforeAtk)) fail(`atk phải tăng sau khi bộ kích hoạt (${mig.beforeAtk}→${mig.afterAtk})`);
  if (!/◈Sarkaan/.test(mig.label)) fail("thẻ đồ không hiện tên bộ mới: " + mig.label.slice(0,300));

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
