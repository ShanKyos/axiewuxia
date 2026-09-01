/**
 * MẪU — giao thức mạng cho phiên bản online của Axie Wuxia.
 *
 * TÀI LIỆU THIẾT KẾ dạng code. Đọc kèm docs/THIET_KE_ONLINE.md phần 5.
 *
 * Hai luật xuyên suốt:
 *   1. Client GỬI Ý ĐỊNH, không gửi toạ độ của chính nó. Nhờ vậy teleport-hack không có
 *      đường tồn tại, chứ không phải "khó thực hiện". (docs 5.4)
 *   2. Server GỬI KẾT QUẢ, không bao giờ gửi TỈ LỆ. Client biết tỉ lệ ⇒ client tính lại được
 *      ⇒ client có chỗ để nói dối.
 */

/* ═══════════════════════════════════════════════════════════════
   NHÓM MESSAGE — định danh HAI TẦNG, lấy từ MU Online (docs 2.4)
   nhóm để định tuyến, mã phụ để mở rộng mà không phá client cũ
   ═══════════════════════════════════════════════════════════════ */

export const enum Group {
  Session  = 0x1,
  Movement = 0x2,
  Combat   = 0x3,
  Loot     = 0x4,
  Social   = 0x5,
  World    = 0x6,
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT → SERVER
   ═══════════════════════════════════════════════════════════════ */

/**
 * Ý định di chuyển. MỘT gói cho cả quãng đường dài, không phải mỗi khung hình.
 *
 * Game đã bỏ WASD, di chuyển là click-to-move qua `moveTarget` (game.js:6913) — thiết kế đó
 * ánh xạ 1:1 sang mô hình này. Đây là lợi thế lớn nhất mà bản hiện tại tặng cho phiên bản
 * online, và nó hoàn toàn tình cờ.
 *
 * Server BẮT BUỘC kiểm ba thứ:
 *   1. đích nằm trong [0, MAP.w] × [0, MAP.h]        (MAP = 2600 × 1900)
 *   2. đích không nằm trong vật cản → inObstacle(); nếu có thì nearestFree()
 *   3. đích LIÊN THÔNG với vị trí hiện tại → navPath() trả về đường
 *      ⚠ kiểm bằng flood fill, KHÔNG phải tỉ lệ vòng (bài học đã ghi trong CLAUDE.md)
 */
export type C2S_MoveTo = {
  g: Group.Movement; c: 0x01;
  x: number; y: number;
  seq: number;          // tăng dần, để server ack và client đối chiếu
};

/** Đòn thường. Server tự quyết trúng/trượt/sát thương — client chỉ nói "tôi bấm đánh". */
export type C2S_Attack = {
  g: Group.Combat; c: 0x01;
  targetId: number;     // id thực thể server cấp, KHÔNG phải chỉ số mảng client
  seq: number;
};

/** Tung kỹ năng. `slot` là 0..3 của thanh kỹ năng cố định (chính · phụ · buff · tuyệt chiêu). */
export type C2S_Cast = {
  g: Group.Combat; c: 0x02;
  slot: 0 | 1 | 2 | 3;
  targetId?: number;
  x?: number; y?: number;   // chiêu đặt vị trí
  seq: number;
};

/** Nhặt đồ dưới đất. Server kiểm khoảng cách VÀ quyền nhặt (xem S2C_GroundSpawn.ownerUntil). */
export type C2S_Pickup = {
  g: Group.Loot; c: 0x01;
  lootId: number;
  seq: number;
};

/* ═══════════════════════════════════════════════════════════════
   SERVER → CLIENT
   ═══════════════════════════════════════════════════════════════ */

/**
 * Snapshot @ 10 Hz. Chỉ chứa thực thể trong AoI của người nhận.
 *
 * AoI theo mẫu bucket của OpenMU (docs 2.3), chuyển tỉ lệ sang map 2600 × 1900:
 *   bucket 260 × 190 px → lưới 10 × 10 = 100 bucket/map
 *   AoI = 5 × 5 bucket = 1300 × 950 px ≈ đúng một khung nhìn 1440 × 900
 *   ⇒ AoI phủ 1/4 diện tích map
 *
 * Ngân sách đã tính (docs 5.5), dạng nhị phân:
 *   quái trong AoI  60 × 1/4 ≈ 15  ×  9 B = 135 B
 *   người trong AoI          ≈ 20  × 12 B = 240 B
 *   ⇒ ~375 B/snapshot ⇒ ~3,7 KB/s ⇒ ~30 kbit/s mỗi client chiều xuống
 *   Delta encoding (chỉ gửi thứ đổi, full mỗi 2 giây) giảm tiếp 3–5×, vì phần lớn quái
 *   đứng yên trong bãi.
 */
export type S2C_Snapshot = {
  g: Group.Movement; c: 0x10;
  t: number;            // giờ SERVER (ms) — client dùng để nội suy
  ackSeq: number;       // lệnh cuối của người nhận đã được xử lý
  self: { x: number; y: number; hp: number; qi: number };
  /** [entityId, x, y, hp, flags] — số nguyên, không có chuỗi */
  players: Array<[number, number, number, number, number]>;
  mobs: Array<[number, number, number, number, number]>;
  /** thực thể rời khỏi AoI — client xoá khỏi bộ nhớ */
  gone?: number[];
};

/**
 * Sự kiện sát thương — KẾT QUẢ, không phải tỉ lệ.
 *
 * Đây là đích đến của một trong bốn "ống phản hồi" hiện tại (docs 6.2):
 *   addFloat / addEffect / AudioSys.sfx / logCombat  →  emit()
 * Trên client emit() làm y hệt hôm nay; trên server nó gom vào gói tin của tick.
 *
 * ⚠ KHÔNG BAO GIỜ gửi "tỉ lệ bạo kích của anh là 23%". Gửi `kind: 'crit'` khi đã crit.
 */
export type S2C_DamageEvent = {
  g: Group.Combat; c: 0x10;
  sourceId: number;
  targetId: number;
  amount: number;
  kind: "hit" | "crit" | "perfect" | "counter" | "countered" | "shielded" | "sigil";
  /** hpAfter để client không phải tự trừ và trôi dần khỏi trạng thái server */
  targetHpAfter: number;
};

/**
 * Đồ rơi xuống đất.
 *
 * `ownerUntil` là thứ bản single-player không cần và bản online không thể thiếu: món đồ
 * thuộc về người gây sát thương nhiều nhất trong N giây đầu, sau đó mở cho mọi người.
 * Không có nó thì mọi bãi quái thành cuộc đua nhặt, và lớp tầm xa luôn thắng.
 *
 * `defId` + `seed` là đủ để client dựng lại HÌNH món đồ — không gửi tên, không gửi dòng chỉ số
 * cho tới khi thật sự nhặt được. (Món đồ đầy đủ = 460 B; cái này = ~24 B.)
 */
export type S2C_GroundSpawn = {
  g: Group.Loot; c: 0x10;
  lootId: number;
  x: number; y: number;
  defId: string;
  rarity: number;
  ownerUntil: number;          // timestamp server; 0 = tự do
  expiresAt: number;           // hiện tại game để 45 giây
};

/** Kho đồ đổi — luôn là DELTA, không bao giờ gửi lại cả túi. */
export type S2C_InvDelta = {
  g: Group.Loot; c: 0x11;
  added?: Array<{ id: number; defId: string; seed: number; slotIndex: number }>;
  removed?: number[];
  moved?: Array<[number, number]>;   // [itemId, slotIndex]
  currencies?: Array<[string, number]>;  // [currency, số dư MỚI] — số dư, không phải delta
};

/* ═══════════════════════════════════════════════════════════════
   ĐI HTTP (tRPC), KHÔNG ĐI WEBSOCKET
   ═══════════════════════════════════════════════════════════════ */

/**
 * Rèn / tấn phẩm / kế thừa / mua bán / trade / chợ.
 *
 * Vì sao HTTP dù "cảm giác" là realtime: cả nhóm này đều TIÊU TÀI NGUYÊN KHÔNG HOÀN LẠI.
 * Cần đúng ngữ nghĩa "gửi một lần, thực thi tối đa một lần" — thứ mà request/response +
 * idempotency key cho miễn phí và WebSocket không cho.
 *
 * Mất kết nối giữa chừng lúc rèn +11 mà không biết đồ còn hay vỡ là loại lỗi khiến người
 * chơi bỏ game.
 */
export type ForgeRequest = {
  /** UUID do CLIENT sinh. UNIQUE trong currency_ledger ⇒ gửi lại 10 lần vẫn chỉ trừ một lần. */
  requestId: string;
  recipe: "enhance" | "tanpham" | "kethua" | "doihe" | "socket" | "cothan";
  itemId: number;
  /** khoá lạc quan: server từ chối nếu món đã đổi kể từ lúc client đọc */
  itemVersion: number;
  jewels?: Array<{ kind: string; count: number }>;
  useCharm?: boolean;   // Thiên Mệnh Phù — bảo hiểm rèn
};

export type ForgeResult =
  | { ok: true; outcome: "success"; item: ItemView; ledgerId: number }
  | { ok: true; outcome: "fail_keep"; item: ItemView; charmUsed: boolean }
  | { ok: true; outcome: "fail_drop"; item: ItemView }
  | { ok: true; outcome: "fail_break"; itemId: number }        // đồ đã VỠ VỤN
  | { ok: false; error: "not_enough" | "stale_version" | "invalid_recipe" | "rate_limited" };

/** Món đồ ở dạng gửi cho client: 116 B thay vì 460 B. Tên hiển thị client tự tra. */
export type ItemView = {
  id: number; defId: string; slot: string;
  rarity: number; tier: number; itemLevel: number; plus: number;
  flags: number; lifeLv: number;
  ancientSet: string | null; element: string | null; sigil: string | null;
  mainValue: number;
  mods: Array<[kind: "sub" | "exc" | "awakened", statKey: string, value: number]>;
  version: number;
};

/* ═══════════════════════════════════════════════════════════════
   NỘI SUY & ĐỐI CHIẾU  — hằng số đã tính từ tốc độ chạy thật
   ═══════════════════════════════════════════════════════════════ */

export const NET = {
  /** Nhịp mô phỏng server. 20 Hz = dt 0,05 s — ĐÚNG bằng trần dt của client (game.js:12993).
   *  Server không bao giờ đưa vào hệ một dt mà nó chưa từng gặp. Chạy 10 Hz là bước vào
   *  vùng chưa test: đạn xuyên qua quái, va chạm vật cản sai. */
  TICK_HZ: 20,

  /** Nhịp gửi snapshot. Nửa nhịp mô phỏng là đủ khi có nội suy. */
  SNAPSHOT_HZ: 10,

  /** Client vẽ thế giới ở now − 100 ms, nội suy giữa 2 snapshot.
   *  Quái và người chơi khác LUÔN đi qua cơ chế này — KHÔNG BAO GIỜ ngoại suy chúng.
   *  AI game này có wanderAng/packAlert/lungeT ⇒ ngoại suy tạo giật ngược, tệ hơn hẳn 100 ms trễ.
   *  Nếu có người chơi 4G thì đây phải thành thích ứng 100–250 ms. */
  INTERP_MS: 100,

  /** Ngưỡng đối chiếu, tính theo tốc độ thật player.speed = 190 px/s (game.js:4395). */
  RECONCILE_IGNORE_PX: 8,    // nhiễu làm tròn — bỏ qua
  RECONCILE_SOFT_PX: 48,     // 8..48 → kéo mềm trong SOFT_MS, người chơi không nhận ra
  RECONCILE_SOFT_MS: 200,    // > 48 → SNAP thẳng; kéo mềm chỉ làm nó sai lâu hơn

  /** AoI — mẫu bucket OpenMU chuyển tỉ lệ sang MAP 2600 × 1900. */
  BUCKET_W: 260, BUCKET_H: 190,   // lưới 10 × 10 = 100 bucket
  AOI_BUCKETS: 5,                 // 5 × 5 = 1300 × 950 px ≈ một khung nhìn

  /** Giới hạn người mỗi map-channel (docs 5.5).
   *  Nút thắt KHÔNG phải CPU (đo được 3–4 µs/tick cho world 60 quái) mà là
   *  (a) băng thông lên client 4G và (b) cảm giác chơi: map có 6–10 bãi quái,
   *  50 người ≈ 5 người/bãi. Đông hơn thì thành cướp bãi, mà cơ chế cướp bãi chưa có. */
  SOFT_CAP_PER_MAP: 50,
  HARD_CAP_PER_MAP: 80,   // vượt → mở channel mới (mẫu sub-server của MU)
} as const;
