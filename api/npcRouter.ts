/**
 * AI NPC — Giai đoạn 1: NPC biết nhận thức thế giới (thiết kế: docs AI NPC GĐ1)
 * 3 NPC thí điểm (khoá id giữ nguyên từ bản đầu, tên hiển thị đã đổi):
 *   truonglang → Trưởng Làng (Plant Tribe Glade)
 *   duoclao    → Nhà Giả Kim · Tiệm Thuốc (Sapidae Chiefdom)
 *   quachtinh  → Trưởng Lão Rell (Sapidae Chiefdom)
 * Provider-agnostic qua env: LLM_API_KEY / LLM_BASE_URL / LLM_MODEL (chuẩn OpenAI-compatible).
 * Nguyên tắc fallback tuyệt đối: mọi lỗi → thoại có sẵn, game không bao giờ vỡ vì AI.
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

/* ---------- cấu hình provider (env, không commit key) ---------- */
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_BASE_URL = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const LLM_MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";
const LLM_TIMEOUT_MS = 6000;
// effort suy luận: Groq gpt-oss cần "low" để không đốt token vào thinking; provider khác set LLM_REASONING_EFFORT=none
const LLM_EFFORT = process.env.LLM_REASONING_EFFORT ?? "low";
const DAILY_LIMIT = 20;
const CACHE_TTL_MS = 10 * 60 * 1000;

/* ---------- hồ sơ NPC: nhân cách + luật bất khả phạm ---------- */
type NpcProfile = {
  name: string;
  persona: string;
  fallback: string[]; // thoại dự phòng khi LLM không khả dụng / hết lượt
};
const NPC_PROFILES: Record<string, NpcProfile> = {
  truonglang: {
    name: "Trưởng Làng",
    persona:
      "Ngươi là Trưởng Làng ở Plant Tribe Glade — lão nhân đã vớt người chơi lên đúng cái đêm bầu trời nứt ra " +
      "(xưng hô: ta - ngươi). " +
      "Tính cách: điềm đạm, thực tế, nuôi một bầy Axie nhỏ và lo cho chúng như lo cho con; hay mời ăn trước rồi mới nói chuyện. " +
      "Kiến thức giới hạn: chuyện trên đảo, bầy Axie của mình, đường sang Sapidae Chiefdom, cái đêm trời nứt. " +
      "KHÔNG biết chuyện Trụ Khoá hay cốt truyện chương sau — bị hỏi thì lắc đầu và bảo ngươi đi hỏi Trưởng Lão Rell.",
    fallback: [
      "Bầy nhỏ hôm nay không chịu ra khỏi tổ. Điềm gì đó, ta không đoán ra.",
      "Ăn gì chưa? Hỏi thật đấy. Ngồi xuống đã rồi nói.",
      "Đảo này nuôi được ta ba đời, nuôi thêm ngươi có sao đâu.",
    ],
  },
  duoclao: {
    name: "Nhà Giả Kim · Tiệm Thuốc",
    persona:
      "Ngươi là Nhà Giả Kim giữ tiệm thuốc trong Sapidae Chiefdom (xưng hô: ta - ngươi). " +
      "Tính cách: cộc lốc bề ngoài, kỹ tính, coi việc pha chế là nghề chứ không phải phép màu; hay càu nhàu chuyện giá cả. " +
      "Kiến thức giới hạn: dược liệu, thuốc hồi, độc, thảo dược mọc ở đâu, giá thuốc. " +
      "KHÔNG biết chuyện vết nứt hay Trụ Khoá — bị hỏi thì gắt 'ta chỉ bán thuốc!'.",
    fallback: [
      "Thuốc cứu người, độc cũng cứu người — tuỳ ai dùng. Mua thì mua, không mua đừng chắn cửa.",
      "Đợi đấy, ta đếm lại chỗ rễ khô đã.",
      "Ngươi lảm nhảm gì thế? Ta đang canh lửa.",
    ],
  },
  quachtinh: {
    name: "Trưởng Lão Rell",
    persona:
      "Ngươi là Trưởng Lão Rell ở Sapidae Chiefdom — người chỉ huy đội tiên phong vượt vết nứt. Sáu người theo ngươi, " +
      "người chơi là người duy nhất còn đứng. Chân ngươi để lại bên kia vết nứt (xưng hô: ta - ngươi). " +
      "Tính cách: thẳng, mỏi mệt, đã chôn quá nhiều người nên nói ít và không hứa hão; kính người biết việc, gắt kẻ liều mạng. " +
      "Phản ứng đặc biệt: người chơi Tội Ác cao (>=3) thì nói thẳng là đang đi sai đường; cấp thấp thì bảo rèn thêm đã. " +
      "Kiến thức giới hạn: chuyện đội tiên phong, vết nứt, Vaeldra, tình hình Sapidae Chiefdom. " +
      "KHÔNG tiết lộ chi tiết vị trí các Trụ Khoá chưa mở.",
    fallback: [
      "Ngồi xuống đã. Ngươi vừa rơi qua thứ mà phần lớn người rơi qua đều không dậy nổi.",
      "Ta không đi cùng được. Chân ta để lại bên kia vết nứt rồi.",
      "Ta đã quen với việc người ta không về. Đừng bắt ta quen thêm lần nữa.",
    ],
  },
};

const GLOBAL_RULES =
  "\n\nLUẬT BẤT KHẢ PHẠM:\n" +
  "- Trả lời 1-3 câu NGẮN, tiếng Việt, giọng đời thường của người sống ở vùng biên — mộc, không hoa mỹ.\n" +
  "- Bối cảnh là Lunacia sau khi bầu trời nứt. KHÔNG dùng từ vựng kiếm hiệp: giang hồ, môn phái, cảnh giới,\n" +
  "  bí kíp, nội công, chân khí, đại hiệp, lão phu, tiểu tử, bổn tọa, tại hạ...\n" +
  "- TUYỆT ĐỐI không dùng từ hiện đại: internet, xe, điện thoại, game, AI, mô hình ngôn ngữ, khoa học viễn tưởng...\n" +
  "- Không bao giờ thừa nhận mình là AI hay chương trình máy tính.\n" +
  "- Không hứa tặng vật phẩm, bạc, nhiệm vụ — chỉ trò chuyện.\n" +
  "- Phản ứng phù hợp trạng thái người chơi trong ngữ cảnh (thương tích, tội ác, lớp, cấp).\n" +
  "- Không lặp lại nguyên văn câu hỏi của người chơi.";

/* ---------- input ---------- */
const ctxSchema = z.object({
  level: z.number().int().min(1).max(200),
  sect: z.string().max(50),
  // ⚠ Từng có `realm: z.string().max(50)` BẮT BUỘC ở đây. Hệ cảnh giới đã gỡ khỏi game, nên
  // `aiNpcCtx()` trong game.js thôi gửi trường đó — mà schema thì vẫn đòi. Zod bác MỌI yêu cầu,
  // và tính năng NPC biết nói đã chết lặng từ đó: người chơi chỉ còn nhận thoại dự phòng.
  hpPct: z.number().min(0).max(100),
  sin: z.number().min(0).max(999),
  traits: z.array(z.string().max(40)).max(5),
  pers: z.string().max(30),
  mapName: z.string().max(60),
  questName: z.string().max(80),
  season: z.string().max(20),
  weather: z.string().max(30),
});
const chatInput = z.object({
  npcId: z.enum(["truonglang", "duoclao", "quachtinh"]),
  message: z.string().trim().min(1).max(200),
  ctx: ctxSchema,
});

/* ---------- rate limit (in-memory theo IP — mock GĐ1) ---------- */
const dayKey = () => new Date().toISOString().slice(0, 10);
const usage = new Map<string, { day: string; count: number }>();
// Cả usage lẫn cache dưới đây không tự dọn — với lưu lượng thật (nhiều IP/câu hỏi khác nhau
// mỗi ngày) sẽ phình vô hạn suốt vòng đời server. Dọn định kỳ (không phải mỗi request, tốn
// CPU vô ích) — mỗi ~200 lượt gọi chat, quét bỏ entry đã hết hạn của cả 2 map.
let _sweepCounter = 0;
function sweepStaleEntries() {
  if (++_sweepCounter % 200 !== 0) return;
  const today = dayKey();
  for (const [k, v] of usage) if (v.day !== today) usage.delete(k);
  const now = Date.now();
  for (const [k, v] of cache) if (now - v.at >= CACHE_TTL_MS) cache.delete(k);
}
function checkRate(ip: string): number {
  const u = usage.get(ip);
  if (!u || u.day !== dayKey()) {
    usage.set(ip, { day: dayKey(), count: 0 });
    return DAILY_LIMIT;
  }
  return Math.max(0, DAILY_LIMIT - u.count);
}
function consumeRate(ip: string) {
  const u = usage.get(ip);
  if (u) u.count++;
}

/* ---------- cache câu trả lời (10 phút, cùng NPC + cùng câu hỏi) ---------- */
const cache = new Map<string, { reply: string; at: number }>();
function cacheGet(k: string): string | null {
  const c = cache.get(k);
  if (c && Date.now() - c.at < CACHE_TTL_MS) return c.reply;
  if (c) cache.delete(k);
  return null;
}

/* ---------- gọi LLM ---------- */
async function callLlm(system: string, user: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 200,
        temperature: 0.8,
        ...(LLM_EFFORT && LLM_EFFORT !== "none" ? { reasoning_effort: LLM_EFFORT } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildPrompt(npc: NpcProfile, input: z.infer<typeof chatInput>): { system: string; user: string } {
  const c = input.ctx;
  const ctxLines = [
    `Ngữ cảnh người chơi hiện tại: cấp ${c.level}, lớp ${c.sect}.`,
    `Sinh lực còn ${c.hpPct}%. Tội Ác: ${c.sin}. Khí chất: ${c.pers}. Quẻ tính cách: ${c.traits.join(", ") || "chưa rõ"}.`,
    `Đang ở: ${c.mapName}. Nhiệm vụ đang làm: ${c.questName || "không có"}. Thời tiết: ${c.season}, ${c.weather}.`,
  ].join("\n");
  return {
    system: npc.persona + "\n\n" + ctxLines + GLOBAL_RULES,
    user: input.message,
  };
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

/* ---------- router ---------- */
export const npcRouter = createRouter({
  status: publicQuery.query(() => ({
    enabled: Boolean(LLM_API_KEY),
    dailyLimit: DAILY_LIMIT,
  })),

  chat: publicQuery.input(chatInput).mutation(async ({ input, ctx }) => {
    const npc = NPC_PROFILES[input.npcId];
    const ip = clientIp(ctx.req);
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    sweepStaleEntries();

    // 1. rate limit
    const remaining = checkRate(ip);
    if (remaining <= 0) {
      return { reply: pick(npc.fallback), remaining: 0, ai: false, reason: "rate_limited" };
    }

    // 2. thiếu key → fallback (game vẫn chơi bình thường)
    if (!LLM_API_KEY) {
      return { reply: pick(npc.fallback), remaining, ai: false, reason: "no_key" };
    }

    // 3. cache
    const cacheKey = `${input.npcId}|${input.message.toLowerCase().trim()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return { reply: cached, remaining, ai: true, reason: "cache" };
    }

    // 4. gọi LLM
    consumeRate(ip);
    const prompt = buildPrompt(npc, input);
    const reply = await callLlm(prompt.system, prompt.user);
    if (!reply) {
      return { reply: pick(npc.fallback), remaining: remaining - 1, ai: false, reason: "llm_error" };
    }

    // 5. vệ sinh output: cắt quá dài
    const clean = reply.length > 400 ? reply.slice(0, 397) + "…" : reply;
    cache.set(cacheKey, { reply: clean, at: Date.now() });
    return { reply: clean, remaining: remaining - 1, ai: true, reason: "ok" };
  }),
});
