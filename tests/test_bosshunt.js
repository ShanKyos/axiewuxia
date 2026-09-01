const { chromium } = require('playwright');

const CASES = [
  { dungeon: 'pb_daohoa', level: 15, huntBoss: 'boss_cotma1', boxTier: 1 },
  { dungeon: 'pb_chungnam', level: 30, huntBoss: 'boss_hacnu1', boxTier: 2 },
  { dungeon: 'pb_tuyettinh', level: 66, huntBoss: 'boss_hoangkim1', boxTier: 3 },
  { dungeon: 'pb_nhanmon', level: 110, huntBoss: 'boss_amthan', boxTier: 5 },
];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(300);

  for (const c of CASES) {
    const r = await page.evaluate(async ({ dungeon, level, huntBoss, boxTier }) => {
      player.level = level; questIdx = 35; questState = 'active'; player.free = 0; player.equip = {};
      player.str = 20 + level*3; player.agi = 20 + level*3; player.def = 20 + level*3; player.vit = 20 + level*3;
      calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
      const invBefore = player.inv.length, silverBefore = player.silver, tienDanBefore = player.tienDan;
      travelTo(dungeon);
      await new Promise(res => setTimeout(res, 50));
      // God-mode + auto-kill loop: xoá sạch quái mỗi frame để đi nhanh qua từng đợt, xác nhận toàn
      // bộ luồng updateDungeon() (3 đợt → Trấn Ải → Boss Săn → Rương) chạy đúng không cần đợi thật.
      let ticks = 0;
      const log = [];
      // spawnHuntBoss() được gọi qua setTimeout thật (1.8s đồng hồ thật) — phải nhường event loop
      // định kỳ (await) để timer đó có cơ hội chạy, không thể vòng lặp đồng bộ thuần túy.
      while (ticks < 4000 && !(DGN && DGN.huntCleared)){
        if (player.hp < player.maxHp) player.hp = player.maxHp;
        for (const m of mobs) if (!m.dead && m.hp > 0) hurtMob(m, 999999, 'hit');
        update(0.05);
        ticks++;
        if (ticks % 40 === 0) await new Promise(res => setTimeout(res, 20));
        if (ticks % 200 === 0) log.push({ t: +(ticks*0.05).toFixed(1), wave: DGN?.wave, cleared: DGN?.cleared, huntSpawned: DGN?.huntSpawned, huntCleared: DGN?.huntCleared });
      }
      return {
        dungeon, ticks,
        finalState: { wave: DGN?.wave, cleared: DGN?.cleared, huntSpawned: DGN?.huntSpawned, huntCleared: DGN?.huntCleared },
        huntBossNameSeen: DGN?.huntRef ? DGN.huntRef.def.name : null,
        expectedHuntBoss: MOBS[huntBoss].name,
        invGained: player.inv.length - invBefore,
        silverGained: player.silver - silverBefore,
        tienDanGained: player.tienDan - tienDanBefore,
        zoneBannerText: zoneBanner ? zoneBanner.text : null,
        zoneBannerSub: zoneBanner ? zoneBanner.sub : null,
      };
    }, c);
    console.log(JSON.stringify(r, null, 1));
  }

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
