import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpcClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH } from "@/const";
import { Link } from "react-router";
import { t, localeTag } from "@/lib/lang";

// Ascension realm-stage names (NAMING_MAP.md §2: Đan Điền → Ascension). Kept in sync with
// game.js's DANTIAN_REALMS and src/lib/lang.ts's REALM_EN — same order/meaning, three surfaces.
const REALM_NAMES = [
  "Hatchling",
  "Spark · Tầng 1",
  "Spark · Tầng 2",
  "Spark · Tầng 3",
  "Spark · Tầng 4",
  "Molt Cảnh",
  "Radiant Core Cảnh",
  "Resonance · Trung Kỳ",
  "Resonance · Hậu Kỳ",
  "Starforged Cảnh",
];

const SECT_NAMES: Record<string, string> = {
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

export default function GamePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [cloudStatus, setCloudStatus] = useState("");
  const [showLb, setShowLb] = useState(false);
  const cfgQuery = trpc.config.useQuery(undefined, { staleTime: Infinity, retry: false });
  const localOnly = !!cfgQuery.data?.localOnly; // bản Vercel offline: ẩn login/cloud/BXH
  const localOnlyRef = useRef(localOnly);
  useEffect(() => {
    localOnlyRef.current = localOnly;
  }, [localOnly]);

  const lbQuery = trpc.leaderboard.list.useQuery(undefined, {
    enabled: showLb && !localOnly,
    staleTime: 30_000,
  });

  const gameReady = useRef(false);
  const cloudPushed = useRef(false);
  const pendingSave = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const retryCount = useRef(0);
  const lastPayload = useRef<string | null>(null);

  const savePut = trpc.save.put.useMutation({
    onSuccess: (r) => {
      retryCount.current = 0;
      if (!r.skipped) {
        setCloudStatus(
          t("cloudSaved") + " · " + new Date().toLocaleTimeString(localeTag()),
        );
      }
    },
    onError: () => {
      // Lỗi mạng → giữ lại payload, thử lại tối đa 3 lần
      if (retryCount.current < 3 && lastPayload.current) {
        retryCount.current += 1;
        pendingSave.current = lastPayload.current;
        setCloudStatus("Lưu cloud thất bại — đang thử lại…");
        saveTimer.current = window.setTimeout(() => flushSave(), 5000);
      } else {
        setCloudStatus("Lưu cloud thất bại — save vẫn an toàn trong trình duyệt");
      }
    },
  });

  const cloudSave = trpc.save.get.useQuery(undefined, {
    enabled: isAuthenticated && !localOnly,
    retry: false,
    staleTime: 60_000,
  });

  const pushCloudToGame = useCallback(() => {
    const row = cloudSave.data;
    const win = iframeRef.current?.contentWindow;
    if (!row || !win) return;
    win.postMessage(
      { type: "vlcm:cloud-load", data: row.data },
      window.location.origin,
    );
    setCloudStatus(
      t("cloudLoaded") + " · " +
        new Date(row.savedAt).toLocaleTimeString(localeTag()),
    );
  }, [cloudSave.data]);

  const flushSave = useCallback(() => {
    const payload = pendingSave.current;
    if (!payload) return;
    pendingSave.current = null;
    lastPayload.current = payload;
    let savedAt = Date.now();
    try {
      savedAt = JSON.parse(payload).savedAt || savedAt;
    } catch {
      /* keep default */
    }
    savePut.mutate({ data: payload, savedAt });
  }, [savePut]);

  // Giữ tham chiếu mới nhất cho listener — ghi vào ref phải nằm trong effect, không phải ngay
  // trong thân render (React coi việc mutate ref trong lúc render là side effect không an toàn
  // dưới concurrent rendering/Strict Mode, dù trong thực tế hiếm khi lộ ra thành bug).
  const flushSaveRef = useRef(flushSave);
  const pushCloudRef = useRef(pushCloudToGame);
  const authedRef = useRef(isAuthenticated);
  const hasCloudRef = useRef(!!cloudSave.data);
  useEffect(() => {
    flushSaveRef.current = flushSave;
    pushCloudRef.current = pushCloudToGame;
    authedRef.current = isAuthenticated;
    hasCloudRef.current = !!cloudSave.data;
  }, [flushSave, pushCloudToGame, isAuthenticated, cloudSave.data]);

  // Game sẵn sàng + đã có save cloud → đẩy xuống (xử lý cả 2 chiều race). pushCloudToGame's
  // setCloudStatus call is exactly React's own documented "update an external system" effect
  // pattern (postMessage to the game iframe) — it only fires once per cloud-data arrival
  // (guarded by cloudPushed), not on every render, so it can't cascade.
  useEffect(() => {
    if (gameReady.current && !cloudPushed.current && cloudSave.data) {
      cloudPushed.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pushCloudToGame();
    }
  }, [cloudSave.data, pushCloudToGame]);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const msg = ev.data;
      if (!msg || typeof msg.type !== "string") return;

      if (msg.type === "vlcm:ready") {
        gameReady.current = true;
        if (authedRef.current && hasCloudRef.current && !cloudPushed.current) {
          cloudPushed.current = true;
          pushCloudRef.current();
        }
      } else if (msg.type === "vlcm:save" && typeof msg.data === "string") {
        if (!authedRef.current || localOnlyRef.current) return; // khách/bản offline: game tự lưu localStorage
        pendingSave.current = msg.data;
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => flushSaveRef.current(), 1500);
      }
    }
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#14100c]">
      {/* Thanh trên cùng */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[#3a2f22] bg-[#1d1712] px-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-wide text-[#f0d68a]">
            ⚔ Axie Wuxia
          </span>
          {isAuthenticated && cloudStatus && (
            <span className="hidden text-xs text-[#a0ffe9] sm:inline">
              ☁ {cloudStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!localOnly && (
          <Button
            variant="outline"
            size="sm"
            className="border-[#5a4a32] bg-transparent text-[#f0d68a] hover:bg-[#2a221a] hover:text-[#ffe9a0]"
            onClick={() => setShowLb(true)}
          >
            {t("leaderboard")}
          </Button>
          )}
          {isLoading ? (
            <span className="text-xs text-[#8a7a60]">{t("loading")}</span>
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-[#d8c8a8]">
                {user?.name || t("heroDefault")}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-[#5a4a32] bg-transparent text-[#d8c8a8] hover:bg-[#2a221a] hover:text-[#f0d68a]"
                onClick={logout}
              >
                {t("logout")}
              </Button>
            </>
          ) : localOnly ? (
            <span className="text-xs text-[#a0ffe9]">
              {t("offlineBadge")}
            </span>
          ) : (
            <>
              <span className="hidden text-xs text-[#8a7a60] sm:inline">
                {t("guestPlaying")}
              </span>
              <Link to={LOGIN_PATH}>
                <Button
                  size="sm"
                  className="bg-[#c8392f] text-white hover:bg-[#a82e26]"
                >
                  {t("cloudLogin")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Game nhúng */}
      <iframe
        ref={iframeRef}
        src="/game/index.html"
        title="Axie Wuxia"
        className="w-full flex-1 border-0"
        allow="autoplay"
      />

      {/* Bảng Xếp Hạng Võ Lâm */}
      {showLb && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowLb(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded border border-[#5a4a32] bg-[#1d1712] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#3a2f22] px-4 py-3">
              <div>
                <div className="text-lg font-bold text-[#f0d68a]">
                  {t("lbTitle")}
                </div>
                <div className="text-xs text-[#8a7a60]">
                  {t("lbSub")}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#5a4a32] bg-transparent text-[#d8c8a8] hover:bg-[#2a221a] hover:text-[#f0d68a]"
                onClick={() => setShowLb(false)}
              >
                ✕
              </Button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3">
              {lbQuery.isLoading ? (
                <div className="py-10 text-center text-sm text-[#8a7a60]">
                  {t("lbLoading")}
                </div>
              ) : lbQuery.isError ? (
                <div className="py-10 text-center text-sm text-[#e84a3a]">
                  {t("lbError")}
                </div>
              ) : !lbQuery.data?.length ? (
                <div className="py-10 text-center text-sm text-[#8a7a60]">
                  {t("lbEmpty")}
                </div>
              ) : (
                <div className="space-y-2">
                  {lbQuery.data.map((row) => {
                    const sectName = row.sect ? SECT_NAMES[row.sect] ?? row.sect : t("noSect");
                    const realmName = REALM_NAMES[Math.min(row.realm, REALM_NAMES.length - 1)] ?? "Hatchling";
                    const medal =
                      row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`;
                    return (
                      <div
                        key={row.userId}
                        className="flex items-center gap-3 rounded border border-[#3a2f22] bg-[#14100c] px-3 py-2"
                      >
                        <div className="w-10 text-center text-sm font-bold text-[#f0d68a]">{medal}</div>
                        {row.avatar ? (
                          <img
                            src={row.avatar}
                            alt=""
                            className="h-9 w-9 rounded-full border border-[#5a4a32] object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5a4a32] bg-[#2a221a] text-sm font-bold text-[#f0d68a]">
                            {(row.name || "H")[0]?.toUpperCase() || "H"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#e8dcc0]">
                            {row.name || t("heroDefault")}
                          </div>
                          <div className="text-xs text-[#a89468]">
                            {sectName} · {realmName}
                          </div>
                        </div>
                        <div className="text-right text-xs text-[#d8c8a8]">
                          <div>Lv {row.level}</div>
                          <div className="text-[#8a7a60]">{row.kills} {t("kills")}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
