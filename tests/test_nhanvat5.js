// NĂM Ô NHÂN VẬT — kiểu MU Online.
// Ba thứ bài này gác, và cả ba đều là thứ hỏng thì mất dữ liệu chứ không phải xấu UI:
//   1. Save v3 (một nhân vật, nằm thẳng ở gốc) phải chuyển sang v4 KHÔNG MẤT GÌ. Đây là lần
//      nâng phiên bản ĐẦU TIÊN không đi kèm xoá — nên nó phải được chứng minh, không phải tin.
//   2. Năm ô độc lập với nhau: xoá ô này không được đụng tới bốn ô kia.
//   3. Xoá nhân vật CHỈ có ở màn chờ. Trong game không được có đường nào tới nó.
// Cộng thêm: nhạc màn chờ phải TẮT khi vào game (BGM_TRACKS rỗng từng khiến nó chạy tiếp).
const { chromium } = require('playwright');
const URL = 'http://localhost:8871/index.html';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const out = {};
  const nap = async p => { await p.goto(URL); await p.waitForFunction(() => window.__gameReady).catch(()=>{}); };

  // ── 1) SAVE v3 → v4: bê nguyên vào ô số 1 ──────────────────────────────────────────────
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    p.on('pageerror', e => errs.push('v3: ' + e));
    await nap(p);
    await p.evaluate(() => {
      localStorage.setItem('vlcm_save', JSON.stringify({
        v: 3,
        player: { sect:'baidasan', name:'Người Cũ', level:57, silver:9999, inv:[], equip:{}, cd:{} },
        questIdx: 4, questProg: 2, questState:'active', victory:false, curMap:'daohoa',
        // savedAt phải là BÂY GIỜ: grantOfflineGains() cộng bạc theo thời gian nghỉ, và
        // bài này đo "chuyển đổi có mất gì không" chứ không đo thu nhập nghỉ.
        sideStates: {}, savedAt: Date.now(),
      }));
    });
    await p.reload(); await p.waitForTimeout(900);
    Object.assign(out, await p.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('vlcm_save') || '{}');
      const rows = [...document.querySelectorAll('#cc-slots .cc-slot')];
      return {
        v3_phienBanTrenDia: raw.v,
        v3_soOTrenDia: Array.isArray(raw.slots) ? raw.slots.filter(Boolean).length : -1,
        v3_tenGiuNguyen: raw.slots && raw.slots[0] && raw.slots[0].player.name,
        v3_capGiuNguyen: raw.slots && raw.slots[0] && raw.slots[0].player.level,
        v3_bacGiuNguyen: raw.slots && raw.slots[0] && raw.slots[0].player.silver,
        v3_nhiemVuGiuNguyen: raw.slots && raw.slots[0] && raw.slots[0].questIdx,
        v3_khongBaoXoa: !window._saveWiped,
        v3_soDong: rows.length,
        v3_soDongTrong: rows.filter(r => r.classList.contains('empty')).length,
        v3_hienNutVao: !document.getElementById('btn-continue').classList.contains('hidden'),
        v3_nhacManCho: AudioSys.bgmName,
      };
    }));
    // vào game bằng chính nút của màn chờ
    await p.click('#btn-continue'); await p.waitForTimeout(600);
    Object.assign(out, await p.evaluate(() => ({
      v3_vaoDuocGame: typeof player !== 'undefined' && !!player,
      v3_capSauKhiVao: player && player.level,
      v3_bacSauKhiVao: player && player.silver,
      v3_nhacTrongGame: AudioSys.bgmName,
    })));
    await p.close();
  }

  // ── 2) Tạo đủ năm nhân vật QUA GIAO DIỆN, mỗi ô một lớp ────────────────────────────────
  const LOP = ['thieulam','toanchan','baidasan','minhgiao','bug'];
  const TEN = ['Ất Một','Ất Hai','Ất Ba','Ất Bốn','Ất Năm'];
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    p.on('pageerror', e => errs.push('tao: ' + e));
    await nap(p);
    await p.evaluate(() => localStorage.removeItem('vlcm_save'));
    await p.reload(); await p.waitForTimeout(700);

    for (let i = 0; i < 5; i++){
      if (i === 0){
        // người mới: qua trang dẫn truyện rồi tới thẳng màn tạo
        await p.evaluate(() => { if (typeof closeIntro === 'function') closeIntro(); });
      } else {
        await p.evaluate(() => showMainMenu());
        await p.waitForTimeout(150);
        const trong = await p.$('#cc-slots .cc-slot.empty');
        if (!trong){ errs.push('không còn ô trống ở vòng ' + i); break; }
        await trong.click();
      }
      await p.waitForTimeout(200);
      await p.evaluate(k => {
        const card = [...document.querySelectorAll('#cc-classes .cc-card')]
          .find(c => c.querySelector('.cc-nm').textContent === (SECTS[k] || {}).name);
        if (card) card.click();
      }, LOP[i]);
      await p.fill('#inp-char-name', TEN[i]);
      await p.waitForTimeout(120);
      await p.click('#btn-create');
      await p.waitForTimeout(500);
      if (i < 4){ await p.reload(); await p.waitForTimeout(700); }   // veManChon() cũng chỉ là lưu + tải lại
    }
    Object.assign(out, await p.evaluate(() => ({ tao_nhacTrongGame: AudioSys.bgmName })));
    await p.reload(); await p.waitForTimeout(800);
    Object.assign(out, await p.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('vlcm_save') || '{}');
      const rows = [...document.querySelectorAll('#cc-slots .cc-slot')];
      return {
        day_soNhanVat: raw.slots.filter(Boolean).length,
        day_ten: raw.slots.map(s => s && s.player.name),
        day_lop: raw.slots.map(s => s && s.player.sect),
        day_soDongTrong: rows.filter(r => r.classList.contains('empty')).length,
        day_anNutTaoMoi: (getComputedStyle(document.getElementById('btn-newchar')).display === 'none'),
        day_soNutXoa: document.querySelectorAll('#cc-slots .cc-slot-del').length,
      };
    }));

    // ── 3) Xoá MỘT ô: phải hỏi lại, và bốn ô kia không được suy suyển ───────────────────
    await p.evaluate(() => document.querySelectorAll('#cc-slots .cc-slot-del')[2].click());
    await p.waitForTimeout(200);
    Object.assign(out, await p.evaluate(() => ({
      xoa_coHoiLai: !!document.querySelector('#cc-slots .cc-slot.hoi-xoa'),
      xoa_hoiLaiCoTen: (document.querySelector('#cc-slots .cc-slot.hoi-xoa') || {}).textContent || '',
      xoa_chuaXoaGiCa: JSON.parse(localStorage.getItem('vlcm_save')).slots.filter(Boolean).length,
    })));
    // bấm Hủy: không được mất ai
    await p.evaluate(() => document.querySelector('#cc-slots .cc-slot-no').click());
    await p.waitForTimeout(150);
    Object.assign(out, await p.evaluate(() => ({
      huy_conDu: JSON.parse(localStorage.getItem('vlcm_save')).slots.filter(Boolean).length,
    })));
    // bấm Xóa vĩnh viễn
    await p.evaluate(() => document.querySelectorAll('#cc-slots .cc-slot-del')[2].click());
    await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#cc-slots .cc-slot-yes').click());
    await p.waitForTimeout(250);
    Object.assign(out, await p.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('vlcm_save'));
      const rows = [...document.querySelectorAll('#cc-slots .cc-slot')];
      return {
        xoa_conLai: raw.slots.filter(Boolean).length,
        xoa_ten: raw.slots.map(s => s && s.player.name),
        xoa_hienLaiODuoc: rows.filter(r => r.classList.contains('empty')).length,
        xoa_hienLaiNutTaoMoi: getComputedStyle(document.getElementById('btn-newchar')).display !== 'none',
      };
    }));
    // sau khi xoá, ô còn lại vẫn vào game được (không hỏng chỉ số)
    await p.evaluate(() => { const r = document.querySelector('#cc-slots .cc-slot:not(.empty)'); if (r) r.click(); });
    await p.waitForTimeout(150);
    await p.click('#btn-continue'); await p.waitForTimeout(600);
    Object.assign(out, await p.evaluate(() => ({
      sauXoa_vaoDuoc: typeof player !== 'undefined' && !!(player && player.sect),
      sauXoa_ten: player && player.name,
    })));

    // ── 4) Trong game KHÔNG được có đường xoá nhân vật ──────────────────────────────────
    await p.evaluate(() => togglePanel('settings'));
    await p.waitForTimeout(300);
    Object.assign(out, await p.evaluate(() => {
      const nut = [...document.querySelectorAll('#panel-settings button')].map(x => x.textContent.trim());
      const ca = [...document.querySelectorAll('button')].map(x => x.textContent.trim());
      return {
        set_nut: nut,
        set_coDuongVeManCho: nut.some(t => /chọn nhân vật/i.test(t)),
        set_conXoaSave: ca.some(t => /xóa save/i.test(t)),
        // Nút xoá vẫn nằm trong DOM lúc đang chơi (chúng ở trong #sect-select đã ẩn). Thứ phải
        // gác là không BẤM tới được, nên đo bằng khả năng nhìn thấy chứ không bằng sự tồn tại.
        game_coNutXoaNhanVat: [...document.querySelectorAll('.cc-slot-del, .cc-slot-yes')]
          .some(x => x.getClientRects().length > 0),
        game_manChoDangAn: document.getElementById('sect-select').classList.contains('hidden'),
      };
    }));
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };

  // 1) chuyển đổi v3 → v4
  if (out.v3_phienBanTrenDia !== 4) fail(`save chưa được ghi lại ở v4 (thấy ${out.v3_phienBanTrenDia})`);
  if (out.v3_soOTrenDia !== 1) fail(`v3 phải thành ĐÚNG một ô, thấy ${out.v3_soOTrenDia}`);
  if (out.v3_tenGiuNguyen !== 'Người Cũ') fail(`mất tên nhân vật cũ (${out.v3_tenGiuNguyen})`);
  if (out.v3_capGiuNguyen !== 57) fail(`mất cấp nhân vật cũ (${out.v3_capGiuNguyen})`);
  if (out.v3_bacGiuNguyen !== 9999) fail(`mất bạc nhân vật cũ (${out.v3_bacGiuNguyen})`);
  if (out.v3_nhiemVuGiuNguyen !== 4) fail(`mất tiến trình nhiệm vụ (${out.v3_nhiemVuGiuNguyen})`);
  if (!out.v3_khongBaoXoa) fail('v3 bị coi là save quá cũ và bị xoá — đây là lần nâng KHÔNG được xoá');
  if (out.v3_soDong !== 5) fail(`màn chờ phải liệt kê đủ 5 ô, thấy ${out.v3_soDong}`);
  if (out.v3_soDongTrong !== 4) fail(`phải có 4 ô trống, thấy ${out.v3_soDongTrong}`);
  if (!out.v3_hienNutVao) fail('có nhân vật mà không hiện nút Vào Game');
  if (out.v3_nhacManCho !== 'bgm_intro') fail(`màn chờ không phát nhạc intro (${out.v3_nhacManCho})`);
  if (!out.v3_vaoDuocGame) fail('không vào được game từ ô đã chuyển đổi');
  if (out.v3_capSauKhiVao !== 57) fail(`vào game thì cấp sai (${out.v3_capSauKhiVao})`);
  if (out.v3_bacSauKhiVao !== 9999) fail(`vào game thì bạc sai (${out.v3_bacSauKhiVao})`);
  if (out.v3_nhacTrongGame === 'bgm_intro') fail('nhạc màn chờ vẫn chạy tiếp sau khi vào game');

  // 2) năm ô
  if (out.day_soNhanVat !== 5) fail(`tạo đủ 5 mà chỉ còn ${out.day_soNhanVat} — có ô ghi đè lên ô khác`);
  for (let i = 0; i < 5; i++){
    if (out.day_ten[i] !== TEN[i]) fail(`ô ${i}: tên ${out.day_ten[i]}, đáng lẽ ${TEN[i]}`);
    if (out.day_lop[i] !== LOP[i]) fail(`ô ${i}: lớp ${out.day_lop[i]}, đáng lẽ ${LOP[i]}`);
  }
  if (out.day_soDongTrong !== 0) fail('đủ 5 nhân vật mà vẫn còn ô trống mời tạo thêm');
  if (!out.day_anNutTaoMoi) fail('đủ 5 nhân vật mà nút Tạo Nhân Vật Mới vẫn bấm được');
  if (out.day_soNutXoa !== 5) fail(`mỗi ô phải có nút xoá riêng, thấy ${out.day_soNutXoa}`);
  if (out.tao_nhacTrongGame === 'bgm_intro') fail('tạo nhân vật xong vào game mà nhạc màn chờ vẫn chạy');

  // 3) xoá từng nhân vật một
  if (!out.xoa_coHoiLai) fail('bấm ✕ là xoá luôn, không hỏi lại');
  if (!/Ất Ba/.test(out.xoa_hoiLaiCoTen)) fail('câu hỏi lại không nói rõ đang xoá ai');
  if (out.xoa_chuaXoaGiCa !== 5) fail('mới hỏi lại mà đã xoá mất rồi');
  if (out.huy_conDu !== 5) fail('bấm Hủy mà vẫn mất nhân vật');
  if (out.xoa_conLai !== 4) fail(`xoá một nhân vật mà còn ${out.xoa_conLai} — xoá nhầm số lượng`);
  if (out.xoa_ten[2] !== null) fail('ô số 3 chưa được dọn');
  for (const i of [0,1,3,4]) if (out.xoa_ten[i] !== TEN[i]) fail(`xoá ô 3 làm hỏng ô ${i} (${out.xoa_ten[i]})`);
  if (out.xoa_hienLaiODuoc !== 1) fail('xoá xong không trả lại ô trống');
  if (!out.xoa_hienLaiNutTaoMoi) fail('xoá xong vẫn không cho tạo nhân vật mới');
  if (!out.sauXoa_vaoDuoc) fail('sau khi xoá thì không vào game được nữa');
  if (out.sauXoa_ten === 'Ất Ba') fail('vào nhầm nhân vật vừa bị xoá');

  // 4) xoá chỉ có ở màn chờ
  if (!out.set_coDuongVeManCho) fail('trong game không có đường ra màn chọn nhân vật');
  if (out.set_conXoaSave) fail('Cài Đặt vẫn còn nút XÓA SAVE cũ');
  if (out.game_coNutXoaNhanVat) fail('trong game vẫn bấm được nút xoá nhân vật — chỉ được xoá ở màn chờ');
  if (!out.game_manChoDangAn) fail('đang chơi mà màn chờ vẫn hiện — phép đo bên trên thành vô nghĩa');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
