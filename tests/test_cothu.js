// Thân AVATAR phải khớp KHỐI với lớp nhân vật — không lớn hơn, cũng không thành hạt bụi.
//
// ⚠ Bài này trước đây gác một luật KHÁC: "Ragoon đi theo không bao giờ được lấn át nhân vật"
// (CHI_THAN 0,45 · CHI_TRAN 0,55 · chiCoTrongMan). Luật đó tồn tại vì có HAI cái thân đứng
// cạnh nhau trong màn. Ragoon đã gỡ, nay chỉ còn MỘT — con Axie LÀ thân người chơi.
//
// Nên ràng buộc đảo chiều, và đó là chỗ dễ chép sai nhất: avatar và lớp nhân vật THAY CHỖ NHAU
// lúc ra đòn, nên khối nhìn thấy phải BẰNG NHAU. Chép CHI_THAN/CHI_TRAN sang đây (chúng cố ý
// nhỏ hơn người) là mỗi cú đánh một cú giật cỡ. Luật mới: AVA_TY 0,72 · AVA_TRAN 0,95.
//
// Kiểm CẢ BỘ chứ không một con mẫu: 16 con nướng ra 16 tỉ lệ ô khác nhau (1,07 → 1,52), nên con
// nướng thêm sau này cũng tự nằm trong luật.
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { console.log('FAIL ' + m); bad++; };
const pass = m => console.log('PASS ' + m);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(400);

  const r = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('baidasan', null); player.level = 60; calcDerived();
    const o = { than: NV_THAN_PX, ty: AVA_TY, tran: AVA_TRAN, con: [] };
    for (const id in CHI_ANH.o){
      const A = CHI_ANH.o[id], than = avaCo(id);
      const cao = than / A.thanCao, rong = cao * (A.nhoRong / A.nhoCao);
      o.con.push({ id, than:+than.toFixed(1), cao:+cao.toFixed(1), rong:+rong.toFixed(1),
                   ty:+(A.nhoRong / A.nhoCao).toFixed(3) });
    }
    // Ragoon phải chết hẳn: không còn hàm/hằng nào của con thú đồng hành.
    //
    // ⚠ Phải hỏi bằng `typeof <tên trần>`, KHÔNG phải `typeof window[tên]`. game.js nạp như một
    // script cổ điển, nên `function f(){}` ở mức trên cùng thì có trên window, còn `const X` thì
    // KHÔNG — nó nằm trong phạm vi lexical toàn cục. Hỏi qua window là mọi hằng (CHI_ANH,
    // AVA_TY, CHI_THAN…) đều trả 'undefined' và bài xanh mà chẳng kiểm được gì.
    const co = {
      mountObj:      () => typeof mountObj,
      updateMount:   () => typeof updateMount,
      drawMount:     () => typeof drawMount,
      chiCoTrongMan: () => typeof chiCoTrongMan,
      CHI_THAN:      () => typeof CHI_THAN,
      CHI_TRAN:      () => typeof CHI_TRAN,
      chiThuMul:     () => typeof chiThuMul,
      chiCdMul:      () => typeof chiCdMul,
      chiDmgMul:     () => typeof chiDmgMul,
      chiKyMo:       () => typeof chiKyMo,
      chiAnDat:      () => typeof window.chiAnDat,
      chiHoa:        () => typeof window.chiHoa,
      chiCotGom:     () => typeof chiCotGom,
      CHI_LV_MAX:    () => typeof CHI_LV_MAX,
      CHI_KY:        () => typeof CHI_KY,
    };
    o.dago = Object.keys(co).filter(n => { try { return co[n]() !== 'undefined'; } catch(e){ return true; } });
    // …còn tầng VẼ thì phải sống, vì avatar dùng chung nó.
    const song = {
      CHI_ANH:     () => typeof CHI_ANH,
      CHI_MAP:     () => typeof CHI_MAP,
      chiVeNho:    () => typeof chiVeNho,
      chiChayImg:  () => typeof chiChayImg,
      avaCo:       () => typeof avaCo,
      veAvatar:    () => typeof veAvatar,
      avatarId:    () => typeof avatarId,
      cotGom:      () => typeof cotGom,
      cotBoCast:   () => typeof cotBoCast,
    };
    o.consong = Object.keys(song).filter(n => { try { return song[n]() === 'undefined'; } catch(e){ return true; } });
    return o;
  });
  console.log('cỡ 16 thân:', JSON.stringify(r.con.slice(0, 3)), '… (' + r.con.length + ' con)');
  const tran = r.than * r.tran;

  const qua = r.con.filter(c => c.cao > tran + 0.01 || c.rong > tran + 0.01);
  if (qua.length) fail(`${qua.length} con vượt trần ${tran.toFixed(0)}px: ` +
    qua.map(c => `${c.id} ${c.rong}×${c.cao}`).join(', '));
  else pass(`cả ${r.con.length} thân nằm trong trần ${tran.toFixed(0)}px = ${r.tran}×thân người`);

  // Khối phải KHỚP thân người, không được lớn hơn — nếu không thì lúc ra đòn là một cú giật cỡ.
  const to = r.con.filter(c => c.cao > r.than || c.rong > r.than);
  if (to.length) fail(`có thân lớn hơn thân người (${r.than}px): ` + to.map(c => c.id).join(', '));
  else {
    const max = r.con.reduce((m, c) => Math.max(m, c.cao, c.rong), 0);
    pass(`thân lấn nhất cũng chỉ chiếm ${(max / r.than * 100).toFixed(0)}% thân người`);
  }

  // …nhưng cũng không được thu tới mức không nhận ra là cái gì.
  const be = r.con.filter(c => Math.max(c.cao, c.rong) < r.than * 0.45);
  if (be.length) fail(`thu quá tay, ${be.length} thân nhỏ hơn 45% thân người: ` + be.map(c => c.id).join(', '));
  else pass('không thân nào bị thu quá tay (đều ≥ 45% thân người)');

  if (r.dago.length) fail('Ragoon đồng hành SỐNG LẠI: ' + r.dago.join(', '));
  else pass('Ragoon đồng hành đã gỡ sạch (15 ký hiệu đều không còn)');

  if (r.consong.length) fail('tầng vẽ avatar bị gỡ theo Ragoon: ' + r.consong.join(', '));
  else pass('tầng vẽ dùng chung còn nguyên (CHI_ANH · CHI_MAP · chiVeNho · chiChayImg · avaCo…)');

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  if (errors.length) fail(`${errors.length} lỗi JS trong lúc chạy`);
  console.log(bad ? `\nđỏ: ${bad}` : '\nTẤT CẢ XANH');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
