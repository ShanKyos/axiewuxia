// ĐO TƯỚNG ĐI — sải chân, pha chống đất, độ nhún, số bước mỗi vòng
//
//   cd public/game && python3 -m http.server 8853
//   NODE_PATH=/opt/node22/lib/node_modules node tools/do_dang.js [cổng]
//
// Vì sao cần công cụ này: `SAI_CHAN` trong game.js là con số ĐO TRÊN BẢNG KHUNG, và mọi thứ
// về nhịp bước treo vào nó. Chép tay một lần rồi để đó thì đổi art là nó nói dối ngay, mà
// nói dối kiểu đó nhìn ra chỉ thấy "hình như đi hơi lạ".
//
// BỐN SỐ, mỗi số trả lời một câu khác nhau — đừng gộp:
//
//   sảiBọc   khoảng x xa nhất bàn chân với tới trong cả vòng. Đây là thứ MẮT đọc ra là
//            "bước dài bao nhiêu", và là con số `SAI_CHAN` nên dùng.
//   tảiĐất   bàn chân ĐANG CHỐNG ĐẤT lùi được bao nhiêu. Đây là quãng đường mà hoạt cảnh
//            THẬT SỰ chở được. `tảiĐất` << `sảiBọc` nghĩa là chính bản vẽ đang trượt chân,
//            và không con số nào trong mã chữa được.
//   đốiXứng  độ chồng khít bóng dáng giữa khung i và khung i+n/2. Vòng HAI BƯỚC thì nửa
//            vòng sau là cùng dáng đổi chân ⇒ nhìn nghiêng gần như trùng (≥0,85). Vòng MỘT
//            BƯỚC thì nửa sau là dáng đứng ⇒ trùng ít. `bước` suy ra từ đây.
//            ⚠ ĐỪNG quay lại cách đếm số lần độ mở bàn chân vượt ngưỡng: trong pha bay một
//            bàn chân rời dải sát đất nên bề rộng sập xuống giả, và cú sập đó bị đếm thành
//            một bước. Đã tưởng khối chạy có 2 bước đúng vì lỗi này.
//   nhún     đáy hình nhấp lên xuống bao nhiêu. Vòng ĐI đúng chuẩn gần như bằng 0 (luôn có
//            một chân chạm đất); vòng CHẠY thì phải có, đó là pha bay.
//
// ⚠ Đơn vị là ĐIỂM ẢNH BẢNG KHUNG. Quy về px màn hình thì nhân NV_CAO/HERO_H — KHÔNG phải
// NV_CAO/CAO_THAN_NUONG. Hai số đó khác nhau 38% và đã lẫn vào nhau một lần.
const { chromium } = require('playwright');

const CONG = process.argv[2] || '8853';
const SECTS = [['thieulam', 'Dark Knight'], ['baidasan', 'Dark Wizard'],
               ['minhgiao', 'Spellblade'], ['toanchan', 'Sylvan Ranger'],
               ['bug', 'Dark Lord']];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => console.log('LỖI TRANG', String(e).slice(0, 160)));
  await p.goto(`http://localhost:${CONG}/index.html`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__gameReady).catch(() => {});
  await p.waitForTimeout(400);

  const bang = [];
  for (const [sect, ten] of SECTS){
    await p.evaluate(s => { window.TEST_MODE = true; startGame(s, null); }, sect);
    await p.waitForTimeout(2500);
    const r = await p.evaluate(({ sect }) => {
      const gv = gearVisual(player), tier = heroTier(player);
      const bo = nvBoTen(sect, tier, gv);
      const out = {};
      for (const blk of ['w', 'r']){
        const n = nvSoKhung(bo, blk) || HS_FRAMES[blk];
        const ds = [];
        for (let i = 0; i < n; i++){
          const f = heroSprite(sect, tier, gv, blk, i, 'slash', false, 0, blk);
          const c = document.createElement('canvas'); c.width = 220; c.height = 300;
          const g = c.getContext('2d'); g.translate(30, 30);
          g.drawImage(f, f._ox, f._oy, f._ow, f._oh);
          ds.push(g.getImageData(0, 0, 220, 300).data);
        }
        const day = d => { for (let y = 299; y >= 0; y--){ for (let x = 0; x < 220; x++) if (d[(y*220+x)*4+3] > 60) return y; } return -1; };
        const dat = Math.max(...ds.map(day));
        let bocMin = 1e9, bocMax = -1;
        const moRong = [], cumTheoKhung = [], dayKhung = [];
        for (const d of ds){
          const by = day(d);
          dayKhung.push(dat - by);                    // cao hơn mặt đất bao nhiêu
          const xs = [];
          for (let y = by - 11; y <= by; y++) for (let x = 0; x < 220; x++) if (d[(y*220+x)*4+3] > 60) xs.push(x);
          xs.sort((a, b2) => a - b2);
          if (xs.length){ if (xs[0] < bocMin) bocMin = xs[0]; if (xs[xs.length-1] > bocMax) bocMax = xs[xs.length-1]; }
          moRong.push(xs.length ? xs[xs.length-1] - xs[0] : 0);
          // cụm bàn chân, tách theo khe > 6px
          const cl = []; let cur = [xs[0]];
          for (let k = 1; k < xs.length; k++){ if (xs[k] - xs[k-1] > 6){ cl.push(cur); cur = []; } cur.push(xs[k]); }
          if (cur.length) cl.push(cur);
          cumTheoKhung.push(cl.filter(c => c.length > 4).map(c => (c[0] + c[c.length-1]) / 2));
        }
        // BƯỚC: đếm số lần độ mở đi từ đỉnh xuống đáy rồi lên lại, trên vòng tròn
        const mn = Math.min(...moRong), mx = Math.max(...moRong), giua = (mn + mx) / 2;
        let cheo = 0;
        for (let i = 0; i < n; i++){
          const a = moRong[i] >= giua, c2 = moRong[(i + 1) % n] >= giua;
          if (a !== c2) cheo++;
        }
        // TẢI ĐẤT: chuỗi LÙI dài nhất của một cụm bàn chân qua các khung liền nhau
        let tai = 0, dang = 0;
        for (let i = 1; i <= n; i++){
          const A = cumTheoKhung[(i - 1) % n], B = cumTheoKhung[i % n];
          if (!A.length || !B.length){ dang = 0; continue; }
          // ghép cụm gần nhau nhất giữa hai khung, rồi lấy cụm LÙI nhiều nhất
          let lui = 0;
          for (const a of A){ let g2 = null, dd = 1e9;
            for (const c2 of B) if (Math.abs(c2 - a) < dd){ dd = Math.abs(c2 - a); g2 = c2; }
            if (g2 != null && a - g2 > lui) lui = a - g2; }
          if (lui > 0.5){ dang += lui; if (dang > tai) tai = dang; } else dang = 0;
        }
        // ĐỐI XỨNG NỬA VÒNG — thước đo THẬT của "mấy bước một vòng".
        // Đếm số lần độ mở bàn chân vượt ngưỡng thì KHÔNG tin được ở khối chạy: trong pha bay
        // một bàn chân nhấc khỏi dải sát đất, bề rộng đo được sập xuống, và một cú sập giả
        // như thế bị đếm thành một bước. Đã tưởng khối chạy có 2 bước vì đúng lỗi này.
        // Vòng HAI BƯỚC thì khung i và khung i+n/2 là cùng một dáng, chỉ đổi chân — nhìn
        // nghiêng thì BÓNG DÁNG gần như trùng nhau. Vòng MỘT BƯỚC thì nửa vòng sau là dáng
        // đứng, trùng rất ít. Nên lấy độ chồng khít (giao/hợp) giữa i và i+n/2.
        let chong = 0;
        for (let i = 0; i < n; i++){
          const A = ds[i], B = ds[(i + (n >> 1)) % n];
          let giao = 0, hop = 0;
          for (let k = 3; k < A.length; k += 4){
            const a = A[k] > 60, b2 = B[k] > 60;
            if (a && b2) giao++; if (a || b2) hop++;
          }
          chong += hop ? giao / hop : 0;
        }
        out[blk] = { n, boc: bocMax - bocMin, tai: +tai.toFixed(1),
                     doiXung: +(chong / n).toFixed(3),
                     nhun: Math.max(...dayKhung) - Math.min(...dayKhung) };
      }
      return { bo, out };
    }, { sect });
    bang.push({ ten, ...r });
  }

  const hs = await p.evaluate(() => ({
    NV_CAO, HERO_H, CAO_THAN_NUONG, SAI_CHAN, SAI_CHAN_NUONG, CHAY_TOCDO, toc: player.speed,
  }));
  const qd = hs.NV_CAO / hs.HERO_H;               // bảng khung → màn hình
  console.log(`\nNV_CAO ${hs.NV_CAO} · HERO_H ${hs.HERO_H} ⇒ quy đổi bảng khung → màn hình = ${qd.toFixed(3)}`);
  console.log(`(hệ số SAI là NV_CAO/CAO_THAN_NUONG = ${(hs.NV_CAO/hs.CAO_THAN_NUONG).toFixed(3)} — lệch ${((hs.NV_CAO/hs.CAO_THAN_NUONG)/qd*100-100).toFixed(0)}%)`);
  console.log(`tốc độ nền ${hs.toc} px/giây · CHAY_TOCDO ${hs.CHAY_TOCDO} · SAI_CHAN ${JSON.stringify(hs.SAI_CHAN)}\n`);
  console.log('bộ          khối  khung  sảiBọc  tảiĐất  trượt  đốiXứng  bước  nhún');
  for (const d of bang) for (const blk of ['w', 'r']){
    const o = d.out[blk];
    const truot = o.boc ? (1 - o.tai / o.boc) * 100 : 0;
    o.buoc = o.doiXung >= 0.85 ? 2 : 1;             // xem chú thích ở đốiXứng
    console.log(`${(d.bo + '  ' + d.ten).padEnd(26)}${blk}   ${String(o.n).padStart(4)}  ` +
                `${String(o.boc).padStart(6)}  ${String(o.tai).padStart(6)}  ${(truot.toFixed(0) + '%').padStart(5)}  ` +
                `${String(o.doiXung).padStart(7)}  ${String(o.buoc).padStart(4)}  ${String(o.nhun).padStart(4)}`);
  }
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  for (const blk of ['w', 'r']){
    const boc = med(bang.map(d => d.out[blk].boc)), buoc = med(bang.map(d => d.out[blk].buoc));
    console.log(`\nkhối ${blk}: sảiBọc trung vị ${boc} px bảng = ${(boc*qd).toFixed(1)} px màn hình, ` +
                `${buoc} bước/vòng ⇒ SAI_CHAN nên là ${(boc*qd*buoc).toFixed(1)}` +
                `  (đang dùng ${hs.SAI_CHAN[blk].toFixed(1)})`);
  }
  await b.close();
})();
