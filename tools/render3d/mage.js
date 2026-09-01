// ═══════════════════════════════════════════════════════════════════════════════
// MODEL 3D — PHÁP SƯ (Dark Wizard). Thiết kế riêng, dựng bằng hình cơ bản.
// ─────────────────────────────────────────────────────────────────────────────
// Bám đúng bóng dáng đã chốt cho lớp này ở bản 2D: MŨ CHÓP CAO trùm xuống mắt,
// KHÔNG giáp vai, ÁO THỤNG LOE che kín chân, quyền trượng. Nhìn bóng là ra lớp.
//
// Không có khung xương da (skinned mesh) — mỗi bộ phận là một khối cứng có ma
// trận riêng, y hệt cách bản 2D đang làm. Với tỉ lệ này thì đủ: ở cỡ sprite
// 128px không ai thấy được da co giãn ở khớp.
// ═══════════════════════════════════════════════════════════════════════════════
import { M4, box, cone, sphere, makeScene, add } from './raster.js';

const C = {
  robe:   [0.34, 0.58, 0.26],
  robeHi: [0.47, 0.74, 0.35],
  hood:   [0.41, 0.66, 0.30],
  gold:   [0.80, 0.86, 0.52],
  goldHi: [0.94, 0.97, 0.72],
  skin:   [0.86, 0.72, 0.55],
  dark:   [0.05, 0.06, 0.05],
  orb:    [0.71, 0.94, 0.54],
  wood:   [0.42, 0.33, 0.20],
};
const RIM = [0.72, 1.0, 0.62];
const mat = (col, o) => Object.assign({ col, rim: RIM, emit: 0 }, o || {});

const TAU = Math.PI * 2;

// Dựng dáng theo động tác. t chạy 0→1 trong một chu kỳ.
// Trả về { bob, lean, armR, armL, elbowR, staffTip, sway, orb }
function pose(action, t){
  if (action === 'w'){
    const ph = t * TAU;
    return {
      bob: Math.abs(Math.sin(ph)) * 0.055,
      lean: 0.10 + Math.sin(ph) * 0.035,
      sway: Math.sin(ph - 0.5) * 0.10,          // áo thụng trễ pha so với hông
      armR: -0.35 + Math.sin(ph) * 0.18,
      armL: 0.20 - Math.sin(ph) * 0.30,
      elbowR: -0.45,
      staffLift: 0,
      orb: 0.85 + Math.sin(ph * 2) * 0.12,
      step: Math.sin(ph),
    };
  }
  if (action === 'c'){
    // Niệm chiêu: ngả sau lấy đà rồi CHĨA trượng tới, cầu sáng bùng lên.
    const e = t < 0.28 ? -Math.sin(t / 0.28 * Math.PI) * 0.5
                       : Math.sin(Math.pow((t - 0.28) / 0.72, 0.6) * Math.PI);
    return {
      bob: e * 0.05, lean: -0.12 * Math.max(0, -e) + 0.24 * Math.max(0, e),
      sway: -e * 0.13,
      armR: -1.15 - 0.35 * e, armL: -0.30 - 0.25 * e,
      elbowR: -0.15 - 0.35 * e,
      staffLift: e * 0.16,
      orb: 0.7 + Math.max(0, e) * 2.4,
      step: 0,
    };
  }
  const br = Math.sin(t * TAU);                  // đứng yên: thở + đảo trọng tâm
  return { bob: br * 0.014, lean: 0.03 + br * 0.012, sway: Math.cos(t * TAU) * 0.035,
           armR: -0.42, armL: 0.12, elbowR: -0.5, staffLift: 0,
           orb: 0.9 + br * 0.18, step: 0 };
}

export function buildMage(action, t){
  const P = pose(action, t);
  const sc = makeScene();
  const Y = P.bob;
  const lean = M4.rotX(-P.lean * 0.35);

  // ── Bàn chân thò ra dưới gấu áo ──
  if (action === 'w') for (const s of [-1, 1]){
    const fz = 0.10 + s * P.step * 0.16;
    add(sc, box(0.10, 0.05, 0.17), mat(C.dark), M4.trans(s * 0.075, Y + 0.025, fz));
  }
  // ── Áo thụng: nón cụt loe. Nghiêng theo `sway` để vải bạt sau bước chân ──
  const robeXf = M4.mul(M4.trans(0, Y, 0), M4.rotZ(P.sway * 0.22));
  add(sc, cone(0.34, 0.155, 0.68, 22, 0), mat(C.robe), robeXf);
  add(sc, cone(0.345, 0.335, 0.05, 22, 0), mat(C.gold), M4.mul(robeXf, M4.trans(0, 0.01, 0)));  // viền gấu
  // dải áo giữa
  add(sc, box(0.09, 0.62, 0.02), mat(C.goldHi), M4.mul(robeXf, M4.trans(0, 0.06, 0.205)));

  // ── Thân trên ──
  const body = M4.mul(M4.trans(0, Y + 0.68, 0), lean);
  add(sc, cone(0.175, 0.145, 0.34, 18, 0), mat(C.robeHi), body);
  add(sc, cone(0.185, 0.185, 0.055, 18, 0), mat(C.gold), M4.mul(body, M4.trans(0, -0.02, 0)));  // đai lưng
  add(sc, sphere(0.055, 12, 8), mat(C.orb, { emit: 0.9 }), M4.mul(body, M4.trans(0, 0.17, 0.15)));

  // ── Tay: vai → cùi chỏ → bàn tay ──
  const armPart = (side, shoulder, elbow) => {
    const sh = M4.mul(body, M4.mul(M4.trans(side * 0.155, 0.28, 0), M4.mul(M4.rotZ(-side * 0.22), M4.rotX(shoulder))));
    add(sc, cone(0.058, 0.05, 0.26, 10, 0), mat(C.robeHi), M4.mul(sh, M4.rotX(Math.PI)));
    const el = M4.mul(sh, M4.mul(M4.trans(0, -0.26, 0), M4.rotX(elbow)));
    add(sc, cone(0.05, 0.042, 0.24, 10, 0), mat(C.robe), M4.mul(el, M4.rotX(Math.PI)));
    add(sc, sphere(0.052, 10, 7), mat(C.skin), M4.mul(el, M4.trans(0, -0.25, 0)));
    return M4.mul(el, M4.trans(0, -0.25, 0));   // vị trí bàn tay
  };
  armPart(-1, P.armL, -0.35);
  const handR = armPart(1, P.armR, P.elbowR);

  // ── Đầu ──
  const head = M4.mul(body, M4.trans(0, 0.40, 0));
  add(sc, sphere(0.125, 14, 10), mat(C.skin), head);
  add(sc, box(0.17, 0.10, 0.06), mat(C.dark), M4.mul(head, M4.trans(0, 0.015, 0.10)));   // bóng vành mũ đổ xuống mắt
  for (const s of [-1, 1])
    add(sc, box(0.045, 0.028, 0.03), mat(C.orb, { emit: 1 }), M4.mul(head, M4.trans(s * 0.045, 0.02, 0.125)));

  // ── MŨ CHÓP: dấu hiệu nhận ra lớp. Ngả về sau một chút cho có dáng. ──
  const hood = M4.mul(head, M4.mul(M4.trans(0, -0.02, -0.02), M4.rotX(-0.30)));
  add(sc, cone(0.20, 0.012, 0.46, 16), mat(C.hood), hood);
  add(sc, cone(0.205, 0.195, 0.045, 16, 0), mat(C.gold), M4.mul(hood, M4.trans(0, 0.005, 0)));
  add(sc, sphere(0.038, 10, 7), mat(C.orb, { emit: 0.8 }), M4.mul(hood, M4.trans(0, 0.47, 0)));

  // ── Quyền trượng: cắm vào bàn tay phải ──
  const staff = M4.mul(handR, M4.mul(M4.trans(0, 0.02, 0.02), M4.mul(M4.rotX(0.20 + P.staffLift), M4.rotZ(0.12))));
  add(sc, cone(0.022, 0.020, 1.16, 10, 0), mat(C.wood), M4.mul(staff, M4.trans(0, -0.38, 0)));
  for (let i = 0; i < 3; i++)
    add(sc, cone(0.030, 0.030, 0.035, 10, 0), mat(C.gold), M4.mul(staff, M4.trans(0, -0.22 + i * 0.26, 0)));
  // vòng gãy ôm quanh cầu sáng
  for (let i = 0; i < 9; i++){
    const a = -0.5 + i / 8 * (TAU - 1.0);
    add(sc, box(0.035, 0.035, 0.035), mat(C.gold),
        M4.mul(staff, M4.trans(Math.cos(a) * 0.115, 0.78 + Math.sin(a) * 0.115, 0)));
  }
  add(sc, sphere(0.072, 14, 10), mat(C.orb, { emit: Math.min(1, P.orb) }), M4.mul(staff, M4.trans(0, 0.78, 0)));
  return sc;
}

// Số khung mỗi động tác. Giữ đúng bốn loại mà heroSprite() trong game đang dùng,
// nhưng ÍT khung hơn nhiều: 8 hướng × nhiều khung là bảng nở theo cấp số nhân.
export const ACTIONS = { i: 6, w: 12, c: 10 };
