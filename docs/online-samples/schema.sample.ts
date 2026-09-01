/**
 * MẪU — lược đồ CSDL cho phiên bản online của Axie Wuxia.
 *
 * Đây là TÀI LIỆU THIẾT KẾ dạng code, không phải file để copy thẳng vào `db/schema.ts`.
 * Viết theo Drizzle + MySQL vì dự án đang dùng đúng bộ đó (`drizzle-orm`, `mysql2`,
 * `drizzle.config.ts` → `dialect: "mysql"`).
 *
 * Đọc kèm docs/THIET_KE_ONLINE.md phần 4.
 *
 * Ba luật xuyên suốt file này:
 *   1. Vật phẩm là HÀNG trong DB, có đúng MỘT chủ. Ràng buộc của DB đảm bảo, không phải logic app.
 *   2. Tiền tệ không bao giờ SELECT-rồi-UPDATE. Xem ghi chú ở characterCurrencies.
 *   3. Mọi thay đổi tiền/đồ đều để lại một hàng trong sổ cái append-only.
 */

import {
  mysqlTable, mysqlEnum, varchar, text, timestamp, bigint, int, smallint,
  tinyint, boolean, json, index, uniqueIndex, primaryKey,
} from "drizzle-orm/mysql-core";

/* ═══════════════════════════════════════════════════════════════
   TÀI KHOẢN & PHIÊN
   ═══════════════════════════════════════════════════════════════ */

/** Tái dùng bảng `users` đã có (unionId đã hỗ trợ Kimi / Google / Ronin), chỉ thêm cột. */
export const accounts = mysqlTable("accounts", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "gm", "admin"]).default("user").notNull(),
  bannedUntil: timestamp("bannedUntil"),
  banReason: varchar("banReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

/**
 * MỘT nhân vật = MỘT phiên sống, tại MỘT shard.
 *
 * Đây là lớp phòng thủ số 4 chống race condition (docs 4.4) VÀ là lời giải cho lỗ hổng dupe
 * "đăng nhập hai lần cùng lúc" mà MU Online từng dính (docs 2.6). Ràng buộc UNIQUE ở đây làm
 * việc mà không lượng logic ứng dụng nào làm chắc chắn bằng.
 *
 * `heartbeatAt`: shard đập nhịp mỗi 5 giây. Phiên quá 30 giây không đập → coi là chết, cho
 * phép nhận phiên mới. Không có heartbeat thì shard crash = nhân vật bị khoá vĩnh viễn.
 */
export const characterSessions = mysqlTable("character_sessions", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).primaryKey(),
  shardId: varchar("shardId", { length: 32 }).notNull(),
  mapId: varchar("mapId", { length: 32 }).notNull(),
  channel: tinyint("channel").notNull().default(1),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  heartbeatAt: timestamp("heartbeatAt").defaultNow().notNull(),
  ip: varchar("ip", { length: 45 }),
}, (t) => ({
  byShard: index("idx_shard").on(t.shardId, t.heartbeatAt),
}));

/* ═══════════════════════════════════════════════════════════════
   NHÂN VẬT
   ═══════════════════════════════════════════════════════════════ */

export const characters = mysqlTable("characters", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }).notNull(),

  /** Tên độc nhất TOÀN SERVER — ràng buộc mà bản single-player không hề cần. */
  name: varchar("name", { length: 24 }).notNull(),

  // 5 lớp: thieulam(Dark Knight) · toanchan(Sylvan Ranger) · baidasan(Dark Wizard)
  //        minhgiao(Spellblade) · bug(Dark Lord) · null = Unclassed (trước cấp 10)
  sect: varchar("sect", { length: 16 }),

  level: smallint("level").notNull().default(1),          // 1..120 (MAX_LV)
  xp: bigint("xp", { mode: "number", unsigned: true }).notNull().default(0),

  // điểm phân phối tay — str/agi/def/vit/ene kiểu MU
  str: int("str").notNull().default(5),
  agi: int("agi").notNull().default(5),
  def: int("def").notNull().default(5),
  vit: int("vit").notNull().default(5),
  ene: int("ene").notNull().default(5),
  freePoints: int("freePoints").notNull().default(0),

  // Tẩy Tủy = Reset kiểu MU: +2% Công/Mạng vĩnh viễn mỗi lần
  resetCount: smallint("resetCount").notNull().default(0),
  ascended: boolean("ascended").notNull().default(false),

  // vị trí — nguồn sự thật là server, đây chỉ là điểm lưu khi thoát
  mapId: varchar("mapId", { length: 32 }).notNull().default("daohoa"),
  x: int("x").notNull().default(460),
  y: int("y").notNull().default(460),

  hp: int("hp").notNull().default(130),
  qi: int("qi").notNull().default(55),

  // PK & Tội Ác — đã có sẵn trong game, chỉ chưa có người thật để dùng
  pkFlag: boolean("pkFlag").notNull().default(false),
  notoriety: int("notoriety").notNull().default(0),

  kills: bigint("kills", { mode: "number", unsigned: true }).notNull().default(0),
  playSeconds: bigint("playSeconds", { mode: "number", unsigned: true }).notNull().default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),   // xoá mềm — cần cho hỗ trợ người chơi
}, (t) => ({
  uniqName: uniqueIndex("uniq_char_name").on(t.name),
  byAccount: index("idx_account").on(t.accountId),
  // bảng xếp hạng: index phủ để không phải chạm bảng chính
  leaderboard: index("idx_leaderboard").on(t.level, t.xp),
}));

/**
 * Mọi cờ tiến trình KHÔNG bao giờ xuất hiện trong WHERE/ORDER BY/JOIN.
 *
 * `player` có 159 khoá lúc chạy; phần lớn là cờ như storyFlags · clues · wpUnlocked · dhHate ·
 * hintCd · autoCfg · abode · meridians · noidan · skillEvo · traits · titles · baohap · daily.
 * Chuẩn hoá hết là tự hành. Nhưng PHẢI có schemaVersion, nếu không 12 tháng nữa nó lại thành
 * đúng cái blob mà Bậc 2 vừa bỏ đi.
 */
export const characterProgress = mysqlTable("character_progress", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).primaryKey(),
  schemaVersion: int("schemaVersion").notNull().default(1),
  data: json("data").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ═══════════════════════════════════════════════════════════════
   TIỀN TỆ  —  chống race condition
   ═══════════════════════════════════════════════════════════════ */

/**
 * MỘT HÀNG cho mỗi loại tiền, KHÔNG phải một cột.
 *
 * Game có ≥12 loại tài nguyên đếm được (silver · mat · tienDan · khi · tamdac · bikipVH ·
 * charms · potions · mats.{manh,tichMa,anTranAi,manhCoThan} · gems.{tuLa,honNguyen} ·
 * jewels.{chucPhuc,linhHon,sinhMenh,honDon} · noidan.{5 hệ}) và danh sách sẽ còn dài ra.
 * Dạng hàng ⇒ thêm loại mới KHÔNG cần migration nào.
 *
 * ⚠ TRỪ TIỀN PHẢI BẰNG MỘT CÂU LỆNH CÓ ĐIỀU KIỆN. Không bao giờ SELECT rồi UPDATE:
 *
 *   const res = await db.execute(sql`
 *     UPDATE character_currencies
 *        SET amount = amount - ${cost}
 *      WHERE characterId = ${cid} AND currency = ${cur} AND amount >= ${cost}`);
 *   if (res.rowsAffected === 0) throw new Error("Không đủ");
 *
 * InnoDB khoá hàng suốt câu lệnh và đánh giá `amount >= cost` DƯỚI khoá đó. Hai request đồng
 * thời thì đúng một cái ăn rowsAffected = 1.
 *
 * BIGINT UNSIGNED + CHECK(amount >= 0) là lưới an toàn cuối cùng — nếu nó bắt được lỗi thì
 * có nghĩa là có đường ghi nào đó đã lách qua tầng trên, và đó là bug cần điều tra ngay.
 */
export const characterCurrencies = mysqlTable("character_currencies", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  currency: varchar("currency", { length: 24 }).notNull(),
  amount: bigint("amount", { mode: "number", unsigned: true }).notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.characterId, t.currency] }),
}));
// SQL thô cần thêm tay (drizzle-kit mysql chưa sinh CHECK):
//   ALTER TABLE character_currencies ADD CONSTRAINT chk_amount CHECK (amount >= 0);

/* ═══════════════════════════════════════════════════════════════
   VẬT PHẨM  —  hai tầng: khung (lọc được) + chi tiết (nhẹ)
   ═══════════════════════════════════════════════════════════════ */

/**
 * ⚠ `uid` hiện tại của game là `itemSeq++` — bộ đếm CỤC BỘ của từng client (game.js:3906).
 * Hai người chơi bất kỳ đều có món uid 1, 2, 3… Không có đường vá tại chỗ: id PHẢI do server cấp.
 * Đây là `id` autoincrement dưới đây.
 *
 * KHÔNG lưu tên hiển thị. Một món đồ hiện serialize ra 460 byte, trong đó 92 byte (20%) là
 * chuỗi tiếng Việt suy ra được từ defId + statKey. Dạng gọn: 116 byte. Bỏ tên còn cho phép
 * đổi tên / dịch mà không migrate dữ liệu.
 */
export const items = mysqlTable("items", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),

  // ── chủ sở hữu: đúng MỘT nơi tại một thời điểm ──
  ownerCharacterId: bigint("ownerCharacterId", { mode: "number", unsigned: true }),
  location: mysqlEnum("location", [
    "bag", "equip", "ground", "trade", "market", "forge", "mail", "destroyed",
  ]).notNull(),
  slotIndex: smallint("slotIndex"),         // vị trí trong túi (0..29)

  // ── khung: mọi thứ cần lọc / sắp xếp / thống kê ──
  defId: varchar("defId", { length: 64 }).notNull(),   // vd "thieulam_4_quan" (ITEM_DB)
  slot: varchar("slot", { length: 16 }).notNull(),     // vukhi|non|ao|tay|quan|chan|daychuyen|nhan1|nhan2|aochoang|pet|canh
  rarity: tinyint("rarity").notNull(),                 // 0 Phàm .. 4 Chí Tôn
  tier: tinyint("tier").notNull(),                     // 1..10 (giai)
  itemLevel: smallint("itemLevel").notNull(),
  plus: tinyint("plus").notNull().default(0),          // 0..11 (+7 là ngưỡng phát sáng)
  flags: smallint("flags").notNull().default(0),       // bit0 perfect(Hoàn Hảo) · bit1 luck(Vận)
  lifeLv: tinyint("lifeLv").notNull().default(0),      // ngọc Sinh Mệnh 0..7
  ancientSet: varchar("ancientSet", { length: 32 }),   // bộ Cổ Thần
  element: varchar("element", { length: 8 }),          // chỉ vũ khí mới có hệ
  sigil: varchar("sigil", { length: 32 }),             // Khắc Ấn — thứ hiếm nhất game
  mainValue: int("mainValue").notNull(),

  // ── truy vết ──
  /**
   * Trường ĐÁNG TIỀN NHẤT trong bảng này. Lưu hạt giống của lần roll ⇒ tái lập được y hệt
   * món đồ đã sinh ra. Khi có tranh chấp ("đồ tôi biến mất", "món này không thể có thật"),
   * bạn phát lại được RNG. Chi phí: 8 byte. Không có nó thì mọi điều tra là lời khai đối lời khai.
   */
  seed: bigint("seed", { mode: "number", unsigned: true }).notNull(),
  version: int("version").notNull().default(0),        // khoá lạc quan cho trade
  createdBy: mysqlEnum("createdBy", [
    "drop", "forge", "shop", "event", "quest", "admin", "migration",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  byOwner: index("idx_owner").on(t.ownerCharacterId, t.location),
  byMarket: index("idx_market").on(t.location, t.rarity, t.tier),
  bySigil: index("idx_sigil").on(t.sigil),   // "ai đang giữ Khắc Ấn nào" — câu hỏi GM hay hỏi
}));

/**
 * Dòng chỉ số ngẫu nhiên. 0..4 hàng mỗi món — nhẹ và join được.
 *   kind='sub'      → 15 dòng phụ (RARITY_SUBS mở theo phẩm)
 *   kind='exc'      → dòng Hoàn Hảo (EXC_WEAPON / EXC_ARMOR)
 *   kind='awakened' → dòng Thức Tỉnh (chỉ có tác dụng khi plus >= 10)
 */
export const itemMods = mysqlTable("item_mods", {
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  idx: tinyint("idx").notNull(),
  kind: mysqlEnum("kind", ["sub", "exc", "awakened"]).notNull(),
  statKey: varchar("statKey", { length: 24 }).notNull(),   // hpPct · silverPct · eva · …
  value: int("value").notNull(),                          // ×10 để giữ 1 chữ số thập phân
}, (t) => ({
  pk: primaryKey({ columns: [t.itemId, t.idx] }),
}));

/**
 * TRANG BỊ ĐANG MẶC — bảng riêng, và đó là chủ ý.
 *
 * PK (characterId, slot) + UNIQUE(itemId) một mình chặn được HAI lỗi:
 *   · một món mặc ở hai ô
 *   · một món mặc bởi hai nhân vật
 * Không cần một dòng logic ứng dụng nào. Đây là điều mà MU Online phải học bằng tiền (docs 2.6).
 */
export const characterEquipment = mysqlTable("character_equipment", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  slot: varchar("slot", { length: 16 }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.characterId, t.slot] }),
  uniqItem: uniqueIndex("uniq_equipped_item").on(t.itemId),
}));

/* ═══════════════════════════════════════════════════════════════
   SỔ CÁI  —  append-only, KHÔNG BAO GIỜ UPDATE / DELETE
   ═══════════════════════════════════════════════════════════════ */

/**
 * Bốn thứ khiến sổ cái này DÙNG ĐƯỢC chứ không chỉ TỒN TẠI:
 *
 * 1. `balanceAfter` — tự kiểm tra chính nó. Nếu
 *      ledger[n].balanceAfter + ledger[n+1].delta ≠ ledger[n+1].balanceAfter
 *    thì CÓ AI ĐÓ GHI NGOÀI SỔ. Đó là tín hiệu gian lận mạnh nhất bạn có thể có, và một
 *    query chạy mỗi đêm là đủ để phát hiện.
 * 2. `reason` là ENUM. Câu hỏi điều tra thật luôn là "tiền thằng này từ đâu ra?" →
 *      SELECT reason, SUM(delta) FROM currency_ledger WHERE characterId=? GROUP BY reason
 *    Text tự do làm query đó thành vô nghĩa.
 * 3. `requestId` UNIQUE — idempotency. Request lặp (mạng 4G chập, người chơi bấm hai lần,
 *    client tự retry) đâm vào unique key và trả kết quả cũ thay vì trừ tiền lần hai.
 *    KHÔNG CÓ CÁI NÀY THÌ MỌI LỚP CHỐNG RACE KHÁC ĐỀU VÔ NGHĨA TRÊN MẠNG DI ĐỘNG.
 * 4. Chống phình: 1 người chơi hoạt động sinh ~2.000 dòng/giờ (mỗi killMob đã là 3–8 dòng).
 *    ⇒ GỘP sự kiện nhỏ lặp lại (bạc/EXP từ quái) theo cửa sổ 60 giây thành một dòng.
 *    KHÔNG BAO GIỜ gộp: trade · chợ · rèn · admin · nạp.
 */
export const currencyLedger = mysqlTable("currency_ledger", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 36 }).notNull(),
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  currency: varchar("currency", { length: 24 }).notNull(),
  delta: bigint("delta", { mode: "number" }).notNull(),                     // CÓ DẤU
  balanceAfter: bigint("balanceAfter", { mode: "number", unsigned: true }).notNull(),
  reason: mysqlEnum("reason", [
    "mob_kill", "quest", "shop_buy", "shop_sell", "forge", "trade",
    "market", "event", "daily", "admin", "rollback",
  ]).notNull(),
  refType: varchar("refType", { length: 24 }),    // "mob" | "item" | "trade" | "listing"
  refId: varchar("refId", { length: 64 }),
  shardId: varchar("shardId", { length: 32 }),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniqReq: uniqueIndex("uniq_request").on(t.requestId),
  byChar: index("idx_char_time").on(t.characterId, t.createdAt),
  byReason: index("idx_reason_time").on(t.reason, t.createdAt),
}));

/** Cùng hình dạng, cho vật phẩm. Mọi lần đổi chủ hoặc đổi chỗ đều để lại một hàng. */
export const itemLedger = mysqlTable("item_ledger", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 36 }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  fromCharacterId: bigint("fromCharacterId", { mode: "number", unsigned: true }),
  toCharacterId: bigint("toCharacterId", { mode: "number", unsigned: true }),
  fromLocation: varchar("fromLocation", { length: 16 }),
  toLocation: varchar("toLocation", { length: 16 }).notNull(),
  reason: mysqlEnum("reason", [
    "drop", "pickup", "equip", "unequip", "trade", "market_list", "market_buy",
    "forge_upgrade", "forge_break", "salvage", "sell", "admin", "rollback",
  ]).notNull(),
  detail: json("detail"),   // vd { plusBefore: 9, plusAfter: 10 } cho forge_upgrade
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniqReq: uniqueIndex("uniq_item_request").on(t.requestId),
  byItem: index("idx_item_time").on(t.itemId, t.createdAt),
  byChar: index("idx_from_time").on(t.fromCharacterId, t.createdAt),
}));

/* ═══════════════════════════════════════════════════════════════
   NHIỆM VỤ & KỸ NĂNG
   ═══════════════════════════════════════════════════════════════ */

export const characterQuests = mysqlTable("character_quests", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  questId: varchar("questId", { length: 48 }).notNull(),
  kind: mysqlEnum("kind", ["main", "side", "daily"]).notNull(),
  state: mysqlEnum("state", ["active", "done", "claimed"]).notNull(),
  progress: int("progress").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.characterId, t.questId] }) }));

export const characterSkills = mysqlTable("character_skills", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  skillId: varchar("skillId", { length: 48 }).notNull(),
  level: smallint("level").notNull().default(1),   // 1..120
  evo: json("evo"),                                // ['power','swift'] theo mốc 40/80/120
}, (t) => ({ pk: primaryKey({ columns: [t.characterId, t.skillId] }) }));

/* ═══════════════════════════════════════════════════════════════
   XÃ HỘI
   ═══════════════════════════════════════════════════════════════ */

/** (a, b) chuẩn hoá với a < b — tránh lưu hai chiều rồi lệch nhau. */
export const friendships = mysqlTable("friendships", {
  charA: bigint("charA", { mode: "number", unsigned: true }).notNull(),
  charB: bigint("charB", { mode: "number", unsigned: true }).notNull(),
  state: mysqlEnum("state", ["pending", "accepted", "blocked"]).notNull(),
  requestedBy: bigint("requestedBy", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.charA, t.charB] }) }));

export const guilds = mysqlTable("guilds", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 24 }).notNull().unique(),
  masterCharacterId: bigint("masterCharacterId", { mode: "number", unsigned: true }).notNull(),
  notice: text("notice"),
  emblem: varchar("emblem", { length: 128 }),   // 8×8 bitmap kiểu MU, mã hoá base64
  /**
   * ⚠ NULLABLE NGAY TỪ ĐẦU, kể cả khi chưa làm liên minh.
   * Castle Siege cần liên minh (≥1 guild khác + ≥20 thành viên để đăng ký). Thêm cột này
   * sau, lúc bảng đã có dữ liệu, là một migration trên bảng nóng. Thêm bây giờ tốn 0 đồng.
   */
  allianceId: bigint("allianceId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const guildMembers = mysqlTable("guild_members", {
  guildId: bigint("guildId", { mode: "number", unsigned: true }).notNull(),
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["master", "officer", "member"]).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.guildId, t.characterId] }),
  // một nhân vật chỉ ở MỘT guild
  uniqChar: uniqueIndex("uniq_member_char").on(t.characterId),
}));

/* ═══════════════════════════════════════════════════════════════
   CHỢ & GIAO DỊCH
   ═══════════════════════════════════════════════════════════════ */

/**
 * Đăng bán = trong CÙNG MỘT transaction:
 *   items.location = 'market'  AND  items.ownerCharacterId = NULL
 *   + INSERT market_listings
 * UNIQUE(itemId) đảm bảo món đang bán không thể đồng thời nằm trong túi ai.
 */
export const marketListings = mysqlTable("market_listings", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  sellerCharacterId: bigint("sellerCharacterId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  currency: varchar("currency", { length: 24 }).notNull().default("silver"),
  price: bigint("price", { mode: "number", unsigned: true }).notNull(),
  state: mysqlEnum("state", ["open", "sold", "cancelled", "expired"]).notNull(),
  // ── cột phi chuẩn hoá, CHỦ Ý, để duyệt chợ không phải join items ──
  snapSlot: varchar("snapSlot", { length: 16 }).notNull(),
  snapRarity: tinyint("snapRarity").notNull(),
  snapTier: tinyint("snapTier").notNull(),
  snapPlus: tinyint("snapPlus").notNull(),
  listedAt: timestamp("listedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (t) => ({
  uniqItem: uniqueIndex("uniq_listing_item").on(t.itemId),
  browse: index("idx_browse").on(t.state, t.snapSlot, t.snapRarity, t.price),
}));

/**
 * Trade 1-1. Máy trạng thái:
 *   open → locked → confirmedA/confirmedB → committed | cancelled
 *
 * ⚠ LUẬT BẤT DI BẤT DỊCH: mọi thay đổi nội dung khay đều RESET CẢ HAI xác nhận.
 * Đây chính là bài học Webzen phải trả bằng tiền — "đổi món ngay trước khi đối phương bấm xác nhận".
 * `contentHash` là băm của toàn bộ hai khay; xác nhận gắn với hash, hash đổi là xác nhận vô hiệu.
 */
export const tradeSessions = mysqlTable("trade_sessions", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  charA: bigint("charA", { mode: "number", unsigned: true }).notNull(),
  charB: bigint("charB", { mode: "number", unsigned: true }).notNull(),
  state: mysqlEnum("state", ["open", "locked", "committed", "cancelled"]).notNull(),
  contentHash: varchar("contentHash", { length: 64 }),
  confirmedA: boolean("confirmedA").notNull().default(false),
  confirmedB: boolean("confirmedB").notNull().default(false),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
}, (t) => ({
  // một nhân vật chỉ mở được MỘT phiên trade tại một thời điểm — chặn trade tam giác
  byChar: index("idx_trade_char").on(t.charA, t.state),
}));

export const tradeOffers = mysqlTable("trade_offers", {
  sessionId: bigint("sessionId", { mode: "number", unsigned: true }).notNull(),
  side: mysqlEnum("side", ["a", "b"]).notNull(),
  idx: tinyint("idx").notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }),
  currency: varchar("currency", { length: 24 }),
  amount: bigint("amount", { mode: "number", unsigned: true }),
}, (t) => ({ pk: primaryKey({ columns: [t.sessionId, t.side, t.idx] }) }));
