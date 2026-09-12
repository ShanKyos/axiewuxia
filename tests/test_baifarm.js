// BÃI FARM — khái niệm "spot" của MU, gác cả BỐN tính chất bắt buộc.
//
// Bãi farm chỉ là bãi farm khi có ĐỦ bốn thứ. Thiếu một là nó tụt về một bãi quái thường mang
// tên đẹp, mà kiểu hỏng đó không ai nhìn ra được — người chơi chỉ thấy "chỗ này chán", không
// biết vì sao. Nên mỗi tính chất một mệnh đề:
//   ① DÀY   — trại sát nhau hơn bãi thường (VUNG_CUM_CACH_FARM), đo bằng mật độ con/1000px².
//   ② ĐÁNG  — rơi đồ và Lumen nhân FARM_THUONG, tức có LÝ DO đi xa hơn để tới.
//   ③ CÓ TÊN— bảng Bản Đồ gọi thẳng tên nó ra, nếu không thì không ai biết nó tồn tại.
//   ④ TỚI ĐƯỢC — miền GIỮA chứ không phải miền xa nhất: một chỗ đáng cày phải với tới được ở
//      ĐẦU dải cấp của map, không phải lúc sắp rời map.
//
// ⚠ BẪY ĐO ĐÃ SẬP MỘT LẦN, mất nguyên một vòng chẩn đoán sai: computeKillRewards() là hàm
// THUẦN (test_killrewards gác điều đó), nên nó không bao giờ ghi `_daRoiMonDau`. Mà nhánh phát
// đầu `(P.kills||0) <= 3 && !P._daRoiMonDau` BẢO ĐẢM rơi một món. Gọi hàm thuần 4000 lần trên
// một nhân vật mới ⇒ cả 4000 lần đều "ba con đầu đời" ⇒ đo ra ~1,0 món/con ở CẢ HAI phía và tỉ
// lệ ra đúng 1,00. Trông y hệt "hệ số farm không chạy", trong khi nó chạy hoàn hảo.
// ⇒ Phải đặt `player.kills` lớn và `_daRoiMonDau = true` TRƯỚC khi đo.
//
// ⚠ Và phải so CÙNG MỘT con quái (đổi `m.pack` qua lại), không so hai loài: `mobDropRate` đã
// nghiêng theo `def.drop` và theo dải cấp, nên so hai loài là đo lẫn hai thứ vào nhau.
const { chromium } = require('playwright');
let bad = 0; const fail = m => { bad++; console.log('FAIL ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs = []; p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await p.goto('http://localhost:8853/index.html?max=1', { waitUntil:'load' });
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.evaluate(() => { window.TEST_MODE = true; startGame('thieulam', null); });
  await p.waitForTimeout(900);

  // ---- 0. Có đúng MỘT miền farm, và nó nằm ở map nào ----
  const r0 = await p.evaluate(() => {
    const ds = Object.keys(MAPS).filter(k => MAPS[k].vung)
      .map(k => ({ map:k, farm:(MAPS[k].vung.filter(v => v.farm)).map(v => v.id) }))
      .filter(o => o.farm.length);
    return { ds, tong: ds.reduce((s,o) => s + o.farm.length, 0) };
  });
  console.log('0) miền farm:', JSON.stringify(r0));
  if (!r0.tong) fail('không map nào có miền farm — vungFarm() sẽ trả null ở mọi map');
  for (const o of r0.ds) if (o.farm.length > 1)
    fail(`${o.map} có ${o.farm.length} miền farm — một map chỉ được MỘT chỗ, nhiều chỗ thì không chỗ nào là "cái chỗ" nữa`);

  const MAP = r0.ds[0] && r0.ds[0].map;
  // đọc trần thẳng từ game — chép cứng thì đổi hằng một cái là bài đỏ ở chỗ chẳng liên quan
  const VUNG_FARM_BAN_TEST = await p.evaluate(() => VUNG_FARM_BAN * 2);
  if (!MAP) { console.log(bad ? `\n${bad} LỖI` : ''); await b.close(); process.exit(1); }

  // ---- ① DÀY: các trại của miền farm phải SÁT NHAU hơn hẳn miền thường ----
  // ⚠ Hai phép đo đã thử và CẢ HAI đều mù:
  //   · `n / (π r²)` từng trại — `r = 90 + n*4` nên mật độ TRONG một trại gần như là hằng số;
  //     đo ra 0,16 vs 0,13 và không phân biệt được gì.
  //   · con/1000px² trên hộp bao cả miền — hộp bao phụ thuộc cung rộng hay hẹp nhiều hơn là
  //     phụ thuộc các trại có sát nhau không; đo ra 0,03 vs 0,02, mà một miền thường còn ra 0,04.
  // Thứ `VUNG_CUM_CACH_FARM` + `VUNG_FARM_BAN` thật sự điều khiển là KHOẢNG CÁCH GIỮA CÁC TRẠI,
  // nên đo đúng cái đó: trung bình khoảng cách từng cặp trại trong miền.
  const r1 = await p.evaluate((mid) => {
    applyTestBoost(); travelTo('ardhaven'); travelTo(mid);
    const g = {};
    for (const k of packsOf(mid)) (g[k.vung] = g[k.vung] || []).push(k);
    const dodac = (a) => {
      const ds = [];
      for (let i = 0; i < a.length; i++) for (let j = i+1; j < a.length; j++) ds.push(dist(a[i].x,a[i].y,a[j].x,a[j].y));
      return { trai:a.length, con:a.reduce((s,k)=>s+k.n,0),
        tbCach: ds.length ? Math.round(ds.reduce((s,x)=>s+x,0)/ds.length) : 0,
        xaNhat: ds.length ? Math.round(Math.max(...ds)) : 0,
        banKinhTB: Math.round(a.reduce((s,k)=>s+k.r,0)/a.length) };
    };
    const vf = vungFarm(mid).id;
    const farm = dodac(g[vf]);
    const thuong = Object.keys(g).filter(k => k !== vf).map(k => ({ v:k, ...dodac(g[k]) })).filter(o => o.trai > 1);
    return { farm, thuong, tbThuong: Math.round(thuong.reduce((s,o)=>s+o.tbCach,0)/thuong.length),
      xa: (() => { const v = MAPS[mid].vung, x = v.find(o => o.farm);
        return { cuaFarm: x.dai[1], xaNhat: Math.max(...v.map(o => o.dai[1])) }; })() };
  }, MAP);
  console.log('1) khoảng cách trại:', JSON.stringify(r1));
  if (!(r1.farm.tbCach <= r1.tbThuong * 0.6))
    fail(`① trại của bãi farm không sát nhau: TB ${r1.farm.tbCach}px, miền thường ${r1.tbThuong}px — cần ≤${Math.round(r1.tbThuong*0.6)}px`);
  // Trần cứng: trại xa nhất vẫn phải nằm trong tầm kéo. Chỉ tin số trung bình thì hai trại dính
  // nhau cộng một trại lạc tận cuối map vẫn qua bài.
  if (!(r1.farm.xaNhat <= VUNG_FARM_BAN_TEST))
    fail(`① có trại lạc khỏi cụm: xa nhất ${r1.farm.xaNhat}px > ${VUNG_FARM_BAN_TEST}px`);
  if (!(r1.farm.trai >= 3))
    fail(`① chỉ ${r1.farm.trai} trại — "sát nhau" cần ít nhất ba cái mới đọc ra là một cụm`);
  if (!(r1.xa.cuaFarm < r1.xa.xaNhat))
    fail(`④ miền farm là miền XA NHẤT map (${r1.xa.cuaFarm} = ${r1.xa.xaNhat}) — tới được lúc sắp rời map thì không ai cày`);

  // ---- ② ĐÁNG: cùng một con quái, chỉ đổi pack, phải rơi đậm hơn ----
  const r2 = await p.evaluate((mid) => {
    player.kills = 500; player._daRoiMonDau = true; player.autoSell = false;  // xem BẪY ĐO ở đầu tệp
    const m = mobs.find(x => laBaiFarm(x.pack));
    if (!m) return { thieuQuai:true };
    const pF = m.pack, pT = (mobs.find(x => x.pack != null && !laBaiFarm(x.pack)) || {}).pack;
    const N = 20000;
    const do_ = () => { let it = 0, ag = 0;
      for (let i = 0; i < N; i++){ const rw = computeKillRewards(m, 'hit', player); it += rw.items.length; ag += rw.silver; }
      return { it: it/N, ag: ag/N }; };
    m.pack = pF; const A = do_();
    m.pack = pT; const B = do_();
    m.pack = pF;
    return { loai:m.type, he: FARM_THUONG, rate: mobDropRate(MOBS[m.type], 'mob'),
      soLuot: mobDropCount(MOBS[m.type], 'mob'),
      doFarm:+A.it.toFixed(4), doThuong:+B.it.toFixed(4), tyLeDo:+(A.it/B.it).toFixed(3),
      // phần Lumen CỘNG THẲNG, không nhân hệ số farm — đọc từ game, đừng chép cứng
      phang: 4 + 0.3 * GO_HUYENTHIET,
      agFarm:+A.ag.toFixed(2), agThuong:+B.ag.toFixed(2), tyLeAg:+(A.ag/B.ag).toFixed(3) };
  }, MAP);
  console.log('2) thưởng:', JSON.stringify(r2));
  if (r2.thieuQuai) fail('② không sinh ra con quái nào thuộc bãi farm — cờ pk.farm không tới được buildWorld');
  else {
    // ⚠ ĐỪNG chấm bằng TỈ LỆ. Cả hai vế đều cộng thêm những khoản KHÔNG nhân hệ số farm —
    // `dropBonus` cộng thẳng vào tỉ lệ, cuộn phụ kiện là một lượt riêng, Lumen cộng +4 phẳng.
    // Mấy khoản đó pha loãng tỉ lệ xuống dưới hệ số một cách tuỳ tiện theo trang bị của người
    // đo (đo ra ×1,24 với dropBonus lớn, ×1,53 khi nhỏ) — chấm bằng tỉ lệ là bài kiểm đỏ/xanh
    // theo chuyện chẳng liên quan.
    // Thứ đo được ổn định là phần CHÊNH: chỉ nhánh rơi trang bị khác nhau, nên
    //     doFarm − doThuong  ≈  soLuot × rate × (FARM_THUONG − 1)
    const cho = r2.soLuot * r2.rate * (r2.he - 1);
    const thuc = r2.doFarm - r2.doThuong;
    const lech = +(thuc / cho).toFixed(3);
    console.log(`   chênh rơi đồ: thực ${thuc.toFixed(4)} / chờ ${cho.toFixed(4)} = ${lech}`);
    if (!(lech >= 0.72 && lech <= 1.28))
      fail(`② phần rơi thêm của bãi farm lệch hẳn: ${lech}× mức chờ (thực ${thuc.toFixed(4)}, chờ ${cho.toFixed(4)})`);
    // ⚠ LUMEN CŨNG PHẢI CHẤM BẰNG CHÊNH — tôi đã chừa nó lại một lần và nó đỏ ngay ở lượt hồi
    // quy tiếp theo. `rw.silver` = base×(1+silverPct/100)×he + 4 + 30%×GO_HUYENTHIET; hai khoản
    // cộng KHÔNG nhân hệ số, nên tỉ lệ phụ thuộc `silverPct` của bộ đồ mà applyTestBoost() bốc
    // ra lúc ấy — đo ra ×1,449 ở máy này và ×1,399 ở lượt hồi quy, cùng một mã.
    //     agFarm − agThuong  ≈  (agThuong − phẳng) × (FARM_THUONG − 1)
    const choAg = (r2.agThuong - r2.phang) * (r2.he - 1);
    const lechAg = +((r2.agFarm - r2.agThuong) / choAg).toFixed(3);
    console.log(`   chênh Lumen: thực ${r2.agFarm - r2.agThuong} / chờ ${choAg.toFixed(1)} = ${lechAg}`);
    if (!(lechAg >= 0.9 && lechAg <= 1.1))
      fail(`② phần Lumen thêm của bãi farm lệch hẳn: ${lechAg}× mức chờ (phẳng ${r2.phang})`);
  }

  // ---- ③ CÓ TÊN: bảng Bản Đồ phải gọi tên nó ----
  const r3 = await p.evaluate((mid) => {
    const h = banSacHtml(mid), vf = vungFarm(mid);
    return { coNhan: h.includes('BÃI FARM'), coTen: !!(vf && h.includes(vf.ten)),
      ten: vf && vf.ten,
      // map KHÔNG có miền farm thì tuyệt đối không được hiện dòng đó
      roMap: Object.keys(MAPS).filter(k => MAPS[k].vung && !vungFarm(k) && banSacHtml(k).includes('BÃI FARM')) };
  }, MAP);
  console.log('3) bảng Bản Đồ:', JSON.stringify(r3));
  if (!r3.coNhan) fail('③ bảng Bản Đồ không nhắc "BÃI FARM" — người chơi không có cách nào biết chỗ đó tồn tại');
  if (!r3.coTen) fail(`③ bảng Bản Đồ không gọi tên "${r3.ten}" — một chỗ không có tên thì không ai rủ nhau tới`);
  if (r3.roMap.length) fail(`③ map không có miền farm mà vẫn hiện dòng BÃI FARM: ${r3.roMap.join(', ')}`);

  if (errs.length) fail('lỗi trang: ' + errs.slice(0,3).join(' | '));
  console.log(bad ? `\n${bad} LỖI` : '\nTẤT CẢ XANH');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
