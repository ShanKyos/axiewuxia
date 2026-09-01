// ═══════════════════════════════════════════════════════════════════════════════
// LỚP TRANG BỊ — đắp lên thân gốc, KHÔNG dựng lại người
// ─────────────────────────────────────────────────────────────────────────────
// Đây là lý do phải tách thân gốc ra trước: game có 220 món, không thể render
// lại cả nhân vật cho từng tổ hợp. Giáp chỉ là thêm khối vào ĐÚNG KHỚP mà thân
// gốc đã trả ra (vai, khuỷu, hông, gối, cổ chân, đầu), nên nó tự nhấp nhô theo
// mọi động tác mà không cần biết gì về hoạt hình.
//
// Bộ mẫu: VELMYR — bạc trắng, vai gai cao, mũ có mào, ngọc phát sáng.
// Tên bộ lấy từ ANCIENT_SETS có sẵn trong game.
// ═══════════════════════════════════════════════════════════════════════════════
import { M4, box, cone, sphere, sphereCap, add } from './raster.js';

export const SETS = {
  velmyr: {
    name: 'Velmyr',
    plate:  [0.80, 0.82, 0.89], plateHi: [0.95, 0.97, 1.00], plateLo: [0.44, 0.47, 0.57],
    trim:   [0.86, 0.82, 0.60], gem: [0.45, 0.86, 1.00], cape: [0.16, 0.20, 0.36],
  },
  sarkaan:  { name:'Sarkaan',  plate:[0.30,0.72,0.55], plateHi:[0.52,0.92,0.72], plateLo:[0.14,0.36,0.28],
              trim:[0.88,0.84,0.58], gem:[0.55,1.00,0.78], cape:[0.08,0.24,0.18] },
  ashvard:  { name:'Ashvard',  plate:[0.82,0.40,0.22], plateHi:[1.00,0.64,0.36], plateLo:[0.40,0.16,0.09],
              trim:[0.95,0.80,0.42], gem:[1.00,0.62,0.30], cape:[0.30,0.09,0.05] },
  korrveth: { name:'Korrveth', plate:[0.34,0.58,0.86], plateHi:[0.56,0.80,1.00], plateLo:[0.16,0.28,0.48],
              trim:[0.84,0.88,0.96], gem:[0.60,0.88,1.00], cape:[0.08,0.16,0.32] },
};

const RIM = [0.80, 0.92, 1.0];
const mt = (col, o) => Object.assign({ col, rim: RIM, emit: 0 }, o || {});
// Gai: nón nhọn mọc từ gốc toạ độ theo +Y, xoay bằng ma trận truyền vào.
const spike = (r, len, seg) => cone(r, 0, len, seg || 7, 1);

export function buildGear(sc, J, setKey){
  const S = SETS[setKey] || SETS.velmyr;
  const P = mt(S.plate), PH = mt(S.plateHi), PL = mt(S.plateLo), TR = mt(S.trim);
  const GEM = mt(S.gem, { emit: 1 });

  // ── GIÁP NGỰC: ôm ngoài áo, cổ dựng cao, ngọc giữa ngực ──
  add(sc, cone(0.208, 0.244, 0.40, 16, 0), P,  M4.mul(J.torso, M4.trans(0, 0.03, 0)));
  add(sc, cone(0.238, 0.222, 0.075, 16, 0), PH, M4.mul(J.torso, M4.trans(0, 0.365, 0)));  // cổ giáp
  add(sc, cone(0.200, 0.200, 0.055, 16, 0), TR, M4.mul(J.torso, M4.trans(0, 0.02, 0)));   // đai
  add(sc, box(0.030, 0.26, 0.03), TR, M4.mul(J.torso, M4.trans(0, 0.26, 0.215)));         // sống ngực
  add(sc, sphere(0.052, 12, 9), GEM, M4.mul(J.torso, M4.trans(0, 0.30, 0.225)));
  for (const s of [-1, 1])                                                                // hai phiến ngực chếch
    add(sc, box(0.15, 0.20, 0.035), PH, M4.mul(J.torso, M4.mul(M4.trans(s * 0.105, 0.29, 0.175), M4.rotZ(s * 0.22))));

  // ── VÂY LƯNG: hai cánh gai vươn lên sau vai — dấu hiệu dễ thấy nhất của bộ ──
  for (const s of [-1, 1]){
    const bk = M4.mul(J.torso, M4.mul(M4.trans(s * 0.13, 0.40, -0.14), M4.mul(M4.rotZ(s * 0.42), M4.rotX(-0.30))));
    add(sc, spike(0.055, 0.52, 6), PH, bk);
    add(sc, spike(0.038, 0.34, 6), P,  M4.mul(bk, M4.mul(M4.trans(s * 0.06, 0.03, 0.02), M4.rotZ(s * 0.34))));
  }

  // ── GIÁP VAI: khối lớn trùm bả vai + ba gai chĩa lên ──
  for (const [key, s] of [['shL', -1], ['shR', 1]]){
    const sh = J[key]; if (!sh) continue;
    add(sc, cone(0.158, 0.112, 0.22, 12, 2), P, M4.mul(sh, M4.trans(0, -0.18, 0)));
    add(sc, cone(0.162, 0.162, 0.045, 12, 0), TR, M4.mul(sh, M4.trans(0, -0.062, 0)));
    for (let i = 0; i < 3; i++){
      const a = -0.55 + i * 0.55;
      add(sc, spike(0.036, 0.28 - Math.abs(i - 1) * 0.06, 6), PH,
          M4.mul(sh, M4.mul(M4.trans(Math.sin(a) * s * 0.10, -0.02, -Math.cos(a) * 0.05), M4.rotZ(s * (0.32 + i * 0.18)))));
    }
  }
  // ── GIÁP BẮP TAY: bịt khoảng hở giữa giáp vai và bao tay ──
  for (const key of ['shL', 'shR']){
    const sh = J[key]; if (!sh) continue;
    add(sc, cone(0.084, 0.078, 0.20, 10, 0), PL, M4.mul(sh, M4.trans(0, -0.28, 0)));
  }
  // ── BAO TAY: ống giáp ngoài cẳng tay + vây nhỏ ──
  for (const [key, s] of [['elL', -1], ['elR', 1]]){
    const el = J[key]; if (!el) continue;
    add(sc, cone(0.078, 0.068, 0.24, 10, 0), P, M4.mul(el, M4.trans(0, -0.25, 0)));
    add(sc, cone(0.082, 0.082, 0.035, 10, 0), TR, M4.mul(el, M4.trans(0, -0.04, 0)));
    add(sc, spike(0.030, 0.16, 6), PH, M4.mul(el, M4.mul(M4.trans(s * 0.055, -0.13, -0.02), M4.rotZ(s * 1.25))));
  }
  // ── GIÁP ĐÙI: hai lớp phiến quanh hông ──
  for (let i = 0; i < 2; i++)
    add(sc, cone(0.245 - i * 0.02, 0.215 - i * 0.02, 0.11, 14, 0), i ? P : PH,
        M4.mul(J.torso, M4.trans(0, -0.03 - i * 0.10, 0)));
  for (const [key, s] of [['hipL', -1], ['hipR', 1]]){
    const hp = J[key]; if (!hp) continue;
    add(sc, box(0.15, 0.22, 0.05), P, M4.mul(hp, M4.mul(M4.trans(s * 0.02, -0.16, 0.115), M4.rotX(0.10))));
    add(sc, box(0.15, 0.022, 0.055), TR, M4.mul(hp, M4.trans(s * 0.02, -0.27, 0.118)));
  }
  // ── ỐNG ĐỒNG + CHỤP GỐI ──
  for (const [key, s] of [['knL', -1], ['knR', 1]]){
    const kn = J[key]; if (!kn) continue;
    add(sc, sphereCap(0.100, 12, 9, 0.72), PH, M4.mul(kn, M4.trans(0, -0.02, 0.012)));   // chụp gối dẹt, không phải quả cầu
    add(sc, spike(0.034, 0.15, 6), P, M4.mul(kn, M4.mul(M4.trans(0, 0.01, 0.06), M4.rotX(1.15))));
    add(sc, cone(0.106, 0.098, 0.34, 12, 0), P, M4.mul(kn, M4.trans(0, -0.34, 0)));   // ống đồng — phải RỘNG hơn ống quần rõ rệt
    add(sc, cone(0.108, 0.108, 0.035, 12, 0), TR, M4.mul(kn, M4.trans(0, -0.09, 0)));
    add(sc, spike(0.026, 0.13, 6), PH, M4.mul(kn, M4.mul(M4.trans(s * 0.075, -0.20, 0), M4.rotZ(s * 1.35))));
  }
  // ── ỦNG GIÁP ──
  for (const key of ['ankL', 'ankR']){
    const ak = J[key]; if (!ak) continue;
    add(sc, cone(0.108, 0.100, 0.18, 12, 0), P, M4.mul(ak, M4.trans(0, -0.22, 0)));
    add(sc, box(0.125, 0.06, 0.22), PH, M4.mul(ak, M4.trans(0, -0.30, 0.05)));
    add(sc, box(0.125, 0.025, 0.045), TR, M4.mul(ak, M4.trans(0, -0.265, 0.155)));
  }
  // ── MŨ TRỤ: vòm bạc + che mặt + mào ba lá + hai sừng ──
  const hd = J.head;
  if (hd){
    add(sc, sphereCap(0.135, 14, 11, 0.62), P, M4.mul(hd, M4.trans(0, 0.006, -0.006)));
    add(sc, box(0.145, 0.075, 0.055), PH, M4.mul(hd, M4.trans(0, 0.020, 0.098)));         // che trán
    add(sc, box(0.108, 0.085, 0.05), PL, M4.mul(hd, M4.trans(0, -0.062, 0.098)));         // che cằm
    add(sc, box(0.145, 0.020, 0.05), GEM, M4.mul(hd, M4.trans(0, -0.008, 0.108)));        // khe mắt phát sáng
    for (let i = 0; i < 3; i++)
      add(sc, spike(0.030, 0.24 - Math.abs(i - 1) * 0.07, 6), PH,
          M4.mul(hd, M4.mul(M4.trans((i - 1) * 0.055, 0.10, -0.03), M4.rotX(-0.42))));
    for (const s of [-1, 1])
      add(sc, spike(0.034, 0.26, 6), TR,
          M4.mul(hd, M4.mul(M4.trans(s * 0.115, 0.028, -0.01), M4.rotZ(s * 1.02))));
  }
  return sc;
}
