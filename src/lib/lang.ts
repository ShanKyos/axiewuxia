// GHHA shell i18n — chia sẻ key 'vlcm_lang' với game canvas (public/game/lang.js)
export type Lang = "vi" | "en";

export function getLang(): Lang {
  try {
    return (localStorage.getItem("vlcm_lang") as Lang) || "vi";
  } catch {
    return "vi";
  }
}

export function toggleLang() {
  const next: Lang = getLang() === "en" ? "vi" : "en";
  const ask =
    next === "en"
      ? "Switch to English?\nThe page will reload (progress is saved automatically)."
      : "Chuyển sang Tiếng Việt?\nTrang sẽ tải lại (tiến trình đã tự lưu).";
  if (window.confirm(ask)) {
    try {
      localStorage.setItem("vlcm_lang", next);
    } catch {
      /* private-browsing/storage-full — reload still picks up the in-memory default */
    }
    location.reload();
  }
}

// TODO(rename): same Ascension-rename decision as GamePage.tsx's REALM_NAMES and game.js's
// cultivation-realm terms — update all three together, see docs/NAMING_MAP.md.
export const REALM_EN = [
  "Mortal",
  "Qi Refining · Stage 1",
  "Qi Refining · Stage 2",
  "Qi Refining · Stage 3",
  "Qi Refining · Stage 4",
  "Foundation Realm",
  "Golden Core Realm",
  "Nascent Soul · Mid",
  "Nascent Soul · Late",
  "Spirit Severing Realm",
];

export const SECT_EN: Record<string, string> = {
  thieulam: "Mech",
  toanchan: "Aquatic",
  comoc: "Dusk",
  baidasan: "Reptile",
  minhgiao: "Beast",
  doanthi: "Bird",
  daohoa: "Plant",
  bug: "Bug",
  dawn: "Dawn",
  vophai: "Unclassed",
};

const dict = {
  // Login — offline card
  offlineSub: {
    vi: "Bản chơi offline — không cần tài khoản, không cần ví",
    en: "Offline mode — no account, no wallet needed",
  },
  playNow: { vi: "⚔ Vào Lunacia Ngay", en: "⚔ Enter Lunacia" },
  offlineNote: {
    vi: "Hành trình của bạn được lưu ngay trong trình duyệt này — mở lại là chơi tiếp.",
    en: "Your journey is saved right in this browser — reopen and keep playing.",
  },
  // Login — cloud card
  cloudSub: {
    vi: "Đăng nhập để lưu hành trình lên cloud và tranh tài Bảng Xếp Hạng",
    en: "Sign in to save your journey to the cloud and climb the Leaderboard",
  },
  roninBtn: { vi: "🦊 Đăng nhập bằng Ronin Wallet", en: "🦊 Sign in with Ronin Wallet" },
  roninBusy: { vi: "Đang chờ xác nhận…", en: "Waiting for confirmation…" },
  googleOff: {
    vi: "Đăng nhập bằng Google — chưa cấu hình",
    en: "Sign in with Google — not configured",
  },
  guestLink: { vi: "Chơi ngay không cần đăng nhập", en: "Play now without signing in" },
  guestNote: {
    vi: "save chỉ lưu trong trình duyệt",
    en: "saves stay in this browser only",
  },
  // GamePage header
  offlineBadge: {
    vi: "💾 Bản offline — hành trình lưu ngay trong trình duyệt này",
    en: "💾 Offline mode — journey saved in this browser",
  },
  leaderboard: { vi: "🏆 Bảng Xếp Hạng", en: "🏆 Leaderboard" },
  cloudLogin: { vi: "☁ Đăng nhập để lưu cloud", en: "☁ Sign in to save to cloud" },
  guestPlaying: {
    vi: "Đang chơi với tư cách khách — save chỉ lưu trong trình duyệt",
    en: "Playing as guest — progress saves in this browser only",
  },
  logout: { vi: "Đăng xuất", en: "Sign out" },
  loading: { vi: "Đang tải…", en: "Loading…" },
  heroDefault: { vi: "Nhà Huấn Luyện", en: "Trainer" },
  // Cloud save status
  cloudSaved: { vi: "Đã lưu cloud", en: "Cloud saved" },
  cloudRetry: { vi: "Lưu cloud thất bại — đang thử lại…", en: "Cloud save failed — retrying…" },
  cloudFail: {
    vi: "Lưu cloud thất bại — save vẫn an toàn trong trình duyệt",
    en: "Cloud save failed — your save is still safe in this browser",
  },
  cloudLoaded: { vi: "Đã tải save cloud", en: "Cloud save loaded" },
  // Leaderboard modal
  lbTitle: { vi: "🏆 Bảng Xếp Hạng Lunacia", en: "🏆 Lunacia Leaderboard" },
  lbSub: {
    vi: "Đồng bộ theo lần lưu cloud gần nhất của mỗi hiệp khách",
    en: "Synced from each hero's latest cloud save",
  },
  lbLoading: { vi: "Đang tải bảng xếp hạng…", en: "Loading leaderboard…" },
  lbError: {
    vi: "Không tải được bảng xếp hạng. Hãy thử lại sau.",
    en: "Could not load the leaderboard. Try again later.",
  },
  lbEmpty: {
    vi: "Chưa có hiệp khách nào lưu cloud — hãy trở thành người đầu tiên!",
    en: "No heroes have saved to cloud yet — be the first!",
  },
  noSect: { vi: "Chưa chọn Tộc", en: "Unclassed" },
  kills: { vi: "quái đã hạ", en: "kills" },
} as const;

export type TKey = keyof typeof dict;

export function t(key: TKey): string {
  return dict[key][getLang()];
}

export function localeTag(): string {
  return getLang() === "en" ? "en-US" : "vi-VN";
}
