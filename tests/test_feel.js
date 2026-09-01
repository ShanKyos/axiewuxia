// 6 nhóm cảm giác chiến đấu. Mỗi mục phải ĐO ĐƯỢC.
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

  const r = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    player.level = 60; vhAutoLearn(); calcDerived();
    const o = {};

    const mkMob = (x, hp, size) => ({ type:'boar',
      def: Object.assign({}, MOBS.boar, { hp, def:0, size: size||14 }),
      x, y:600, hp, maxHp:hp, atkT:9e9, dead:false, hitT:0, deadT:0, zone:null, pack:null, poisonT:0 });
    const scene = n => { mobs.length = 0; projectiles.length = 0; effects.length = 0;
      player.x = 600; player.y = 600; player.face = 0; player.pendingHit = null;
      hitStop = 0; shakeT = 0; shakeMag = 0;
      for (let i = 0; i < n; i++) mobs.push(mkMob(660 + i*30, 999999));
      return mobs; };

    // ══ 1. Không còn ctx.filter mỗi khung ══
    o.filterConLai = 0;
    { const c = document.createElement('canvas'); c.width=200; c.height=200;
      const q = c.getContext('2d');
      const orig = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'filter');
      let sets = 0;
      Object.defineProperty(q, 'filter', { set(v){ if (v && v !== 'none') sets++; }, get(){ return 'none'; } });
      scene(6); for (const m of mobs) m.hitT = 0.15;
      for (const m of mobs) if (m.def.skel) drawMobFigure(m, m.def, 100, 100, 900, q);
      o.filterConLai = sets;
    }
    // màu loé đổi theo loại đòn
    scene(1); hurtMob(mobs[0], 50, 'hit');  const c1 = mobs[0].hitCol;
    scene(1); hurtMob(mobs[0], 50, 'crit'); const c2 = mobs[0].hitCol;
    o.mauLoe = { thuong: c1, bao: c2, khacNhau: c1 !== c2 };

    // ══ 2. Âm chạm — đòn thường phải phát ra tiếng có thật ══
    { const played = []; const _o = AudioSys.sfx;
      AudioSys.sfx = (n, v) => { played.push(n); };
      scene(1); hurtMob(mobs[0], 50, 'hit');
      scene(1); hurtMob(mobs[0], 50, 'crit');
      AudioSys.sfx = _o;
      o.amPhat = played;
      o.amThuongCoThat = played.length >= 1 && played[0] !== 'hit';   // 'hit' = file 404
    }

    // ══ 4. Hitstop: AoE trúng 8 con chỉ tính MỘT lần ══
    // ⚠ swingFeel gom cả cú đánh trong cửa sổ 60 ms. Phải đặt _swingT = 0 để MỞ CÚ ĐÁNH MỚI
    // trước mỗi phép đo — nếu không, đòn của phần test trước vẫn giữ _swingBest và mọi số ra 0.
    { scene(8); hitStop = 0; shakeT = 0; _swingT = 0;
      for (const m of mobs) hurtMob(m, 50, 'crit');
      o.hitstop8con = +hitStop.toFixed(3);
      scene(1); hitStop = 0; _swingT = 0; hurtMob(mobs[0], 50, 'crit');
      o.hitstop1con = +hitStop.toFixed(3);
    }
    // hitstop scale theo % máu mất
    scene(1); mobs[0].maxHp = 1000; mobs[0].hp = 1000; hitStop = 0; _swingT = 0;
    hurtMob(mobs[0], 20, 'crit'); const hsNho = hitStop;
    scene(1); mobs[0].maxHp = 1000; mobs[0].hp = 1000; hitStop = 0; _swingT = 0;
    hurtMob(mobs[0], 900, 'crit'); const hsLon = hitStop;
    o.hitstopTheoST = { cao1pct: +hsNho.toFixed(3), bo90pct: +hsLon.toFixed(3) };

    // ══ 5a. Biên độ giật của quái ══
    { const m = mkMob(700, 100); m.hitT = 0.15;
      o.gietToiDa = +mobPose(m, 0).hurt.toFixed(3); }
    // ══ 5b. Hất lùi theo sát thương ══
    { scene(1); const x0 = mobs[0].x; hurtMob(mobs[0], 5, 'hit');
      const dNho = mobs[0].x - x0;
      scene(1); mobs[0].maxHp = 500; mobs[0].hp = 500; const x1 = mobs[0].x;
      hurtMob(mobs[0], 450, 'hit'); const dLon = mobs[0].x - x1;
      o.hatLui = { donNhe: +dNho.toFixed(2), donNang: +dLon.toFixed(2) };
      // quái TO phải khó hất hơn
      scene(1); mobs[0] = mkMob(660, 500, 40); mobs[0].maxHp = 500;
      const x2 = mobs[0].x; hurtMob(mobs[0], 450, 'hit');
      o.hatLui.quaiTo = +(mobs[0].x - x2).toFixed(2);
    }

    // ══ 6. Rung 3 mức + xung có hướng ══
    o.rungMacDinh = SETTINGS.shake;
    o.rungDiTru = (() => { const _s = SETTINGS.shake;
      SETTINGS.shake = false; const b1 = typeof SETTINGS.shake;
      SETTINGS.shake = _s; return b1 === 'boolean'; })();
    o.coHuong = typeof shakeDir === 'number';
    scene(1); shakeDir = 0; hurtMob(mobs[0], 50, 'crit');
    o.huongDatSauDon = +shakeDir.toFixed(2);   // quái ở bên phải ⇒ ~0

    // ══ 3. Sát thương dời về khung tiếp xúc ══
    { scene(1); player.cd.basic = 0; player.atkAnim = 0;
      const hp0 = mobs[0].hp;
      doBasic();
      o.hen = !!player.pendingHit;
      o.mauNgaySauKhiVung = hp0 - mobs[0].hp;      // phải = 0
      for (let i = 0; i < 8; i++) update(0.02);     // 0,16s
      o.mauSauKhiCham = hp0 - mobs[0].hp;           // phải > 0
    }
    // đòn HỤT khi mục tiêu biến mất giữa chừng
    { scene(1); player.cd.basic = 0; doBasic();
      mobs.length = 0;                              // quái biến mất trước khi lưỡi chạm
      let ok = true; try { for (let i = 0; i < 8; i++) update(0.02); } catch(e){ ok = false; o.whiffErr = String(e); }
      o.hutKhongLoi = ok;
    }
    // cú lao người phải dồn tới lúc CHẠM, không phải lúc lấy đà
    // atkK ĐẾM NGƯỢC (1 ở khung đầu → 0 ở khung cuối), nên duyệt từ 1 xuống 0 mới ra
    // đúng thứ tự thời gian. Bản đầu tôi duyệt 0→1 và đọc mảng ngược, tưởng là code sai.
    o.laoNguoi = [1, 0.75, 0.5, 0.25, 0].map(atkK => +Math.max(0, hSwing(1 - atkK)).toFixed(3));

    return o;
  });

  console.log('1. ctx.filter còn lại mỗi khung:', r.filterConLai, '| màu loé:', JSON.stringify(r.mauLoe));
  console.log('2. âm phát ra:', JSON.stringify(r.amPhat));
  console.log('3. hẹn đòn:', r.hen, '| máu mất ngay khi vung:', r.mauNgaySauKhiVung, '→ sau khi chạm:', r.mauSauKhiCham);
  console.log('   lao người theo atkK 1→0:', JSON.stringify(r.laoNguoi));
  console.log('4. hitstop 8 con:', r.hitstop8con, 'vs 1 con:', r.hitstop1con, '| theo ST:', JSON.stringify(r.hitstopTheoST));
  console.log('5. giật tối đa:', r.gietToiDa, '| hất lùi:', JSON.stringify(r.hatLui));
  console.log('6. rung mặc định:', r.rungMacDinh, '| có hướng:', r.coHuong, '| hướng sau đòn:', r.huongDatSauDon);

  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (r.filterConLai !== 0) fail(`vẫn còn ${r.filterConLai} lần đặt ctx.filter mỗi khung`);
  if (!r.mauLoe.khacNhau) fail('màu loé không đổi theo loại đòn');
  if (!r.amThuongCoThat) fail(`đòn thường vẫn gọi file không tồn tại: ${JSON.stringify(r.amPhat)}`);
  if (r.amPhat.includes('hit')) fail("vẫn còn gọi 'hit' — file sfx_hit.mp3 không tồn tại");
  if (!r.hen) fail('doBasic không hẹn đòn tới khung tiếp xúc');
  if (r.mauNgaySauKhiVung !== 0) fail('sát thương vẫn nổ ngay khung đầu');
  if (!(r.mauSauKhiCham > 0)) fail('đòn hẹn không bao giờ nổ');
  if (!r.hutKhongLoi) fail('đòn hụt gây lỗi: ' + r.whiffErr);
  if (r.laoNguoi[0] > 0.05) fail(`lao người vẫn dồn tới lúc LẤY ĐÀ (${r.laoNguoi[0]})`);
  if (r.laoNguoi[4] < 0.9) fail(`lao người không đạt đỉnh lúc chạm (${r.laoNguoi[4]})`);
  if (!(r.hitstop1con > 0)) fail(`hitstop không được đặt: ${r.hitstop1con}`);
  if (r.hitstop8con > r.hitstop1con * 1.35) fail(`AoE 8 con vẫn cộng dồn hitstop (${r.hitstop8con} vs ${r.hitstop1con})`);
  if (!(r.hitstopTheoST.bo90pct > r.hitstopTheoST.cao1pct * 1.4)) fail(`hitstop không scale theo sát thương: ${JSON.stringify(r.hitstopTheoST)}`);
  if (r.gietToiDa < 0.99) fail(`biên độ giật vẫn bị cắt: ${r.gietToiDa} (phải đạt 1.0)`);
  if (!(r.hatLui.donNang > r.hatLui.donNhe * 1.5)) fail(`hất lùi không theo sát thương: ${JSON.stringify(r.hatLui)}`);
  if (!(r.hatLui.quaiTo < r.hatLui.donNang * 0.6)) fail(`quái to bị hất bằng quái nhỏ: ${JSON.stringify(r.hatLui)}`);
  if (r.rungMacDinh !== 1) fail(`rung mặc định phải = 1 (NHẸ), đang là ${r.rungMacDinh}`);
  if (!r.coHuong) fail('không có shakeDir — rung vẫn là nhiễu trắng');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
