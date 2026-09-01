// Save cũ (chưa có `def` trên món) phải bị xoá VÀ phải được BÁO. Mất nhân vật mà không hiểu
// vì sao là thứ tệ nhất một bản cập nhật có thể làm.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const out = {};

  // 1) SAVE CŨ: nhét một save không có trường v
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on('pageerror', e => errs.push('cũ: ' + e));
    await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
    await p.evaluate(() => {
      localStorage.setItem('vlcm_save', JSON.stringify({
        player: { sect:'thieulam', level:50, inv:[], equip:{}, cd:{} },
        questIdx: 3, questProg: 0, questState:'active', curMap:'daohoa', savedAt: Date.now(),
      }));
    });
    await p.reload(); await p.waitForTimeout(900);
    Object.assign(out, await p.evaluate(() => ({
      phienBanHienTai: SAVE_VERSION,
      cu_conSave: !!localStorage.getItem('vlcm_save'),
      cu_hienNutTiepTuc: !el('btn-continue').classList.contains('hidden'),
      // Kiểm CÓ lời giải thích, không kiểm nguyên văn. Bản đầu khớp cụm 'vẽ lại|cập nhật lớn' —
      // mà mỗi lần nâng SAVE_VERSION là phải viết lại câu đó cho đúng đợt mới, nên bài kiểm báo
      // hỏng trong khi lời giải thích vẫn còn nguyên và vẫn đúng. Thứ hỏng được là KHÔNG có lời
      // nào cả, hoặc có mà cụt ngủn không nói được gì.
      cu_coBaoNguoiChoi: ((document.querySelector('#sect-select .ss-sub')||{}).textContent || '').trim().length > 40,
      cu_hienManChon: !el('sect-select').classList.contains('hidden'),
    })));
    await p.close();
  }
  // 2) SAVE MỚI: chơi thật rồi tải lại — phải giữ nguyên
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on('pageerror', e => errs.push('mới: ' + e));
    await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
    await p.evaluate(() => { localStorage.removeItem('vlcm_save'); });
    await p.reload(); await p.waitForTimeout(700);
    await p.evaluate(() => {
      window.TEST_MODE = true; startGame('baidasan', null);
      player.level = 42; player.silver = 12345;
      const it = genItem(40, 1); player.inv.push(it);
      window._dinhDanh = it.def; window._tenMon = it.name;
      saveGame();
    });
    await p.reload(); await p.waitForTimeout(900);
    Object.assign(out, await p.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('vlcm_save') || '{}');
      const ok = loadGame();
      return {
        moi_phienBan: raw.v,
        moi_taiDuoc: ok,
        moi_giuCap: player && player.level,
        moi_giuBac: player && player.silver,
        moi_monCoDinhDanh: !!(player && player.inv[0] && player.inv[0].def),
        moi_veDuocIcon: !!(player && player.inv[0] && /^<span class="item-ic/.test(slotIcon(player.inv[0], ''))),
      };
    }));
    await p.close();
  }

  console.log(JSON.stringify(out, null, 1));
  let bad = 0; const fail = m => { console.log('FAIL', m); bad++; };
  if (out.cu_conSave) fail('save cũ KHÔNG bị xoá');
  if (out.cu_hienNutTiepTuc) fail('save cũ vẫn hiện nút Tiếp Tục — bấm vào sẽ rơi ra màn hình trắng');
  if (!out.cu_coBaoNguoiChoi) fail('xoá save mà KHÔNG báo người chơi vì sao');
  if (!out.cu_hienManChon) fail('không đưa về màn chọn nhân vật');
  // Đọc SAVE_VERSION từ chính trang thay vì ghim số. Ghim số thì mỗi lần nâng phiên bản là bài
  // kiểm này báo hỏng dù nó chẳng phát hiện được gì — mà việc nâng phiên bản chính là thứ nó
  // phải cho phép xảy ra. Điều thật sự cần gác: save mới ghi ĐÚNG phiên bản game đang chạy.
  if (out.moi_phienBan !== out.phienBanHienTai)
    fail(`save mới ghi phiên bản ${out.moi_phienBan}, mà game đang ở ${out.phienBanHienTai}`);
  if (!out.moi_taiDuoc) fail('save MỚI lại không tải được');
  if (out.moi_giuCap !== 42) fail(`save mới mất cấp (${out.moi_giuCap})`);
  if (out.moi_giuBac !== 12345) fail(`save mới mất bạc (${out.moi_giuBac})`);
  if (!out.moi_monCoDinhDanh) fail('món sinh ra không có định danh — icon sẽ rơi về PNG cũ');
  if (!out.moi_veDuocIcon) fail('món trong save mới không vẽ được icon');
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
