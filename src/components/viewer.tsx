import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useFeed } from "@/components/feed-context";
import { useAppStore } from "@/lib/store";
import { ChromeButton } from "@/components/chrome-button";
import { useResolvedPost } from "@/lib/use-resolved-post";
import type { MediaSource } from "@/lib/media/types";

const SOURCE_LABEL: Record<MediaSource, string> = {
  danbooru: "Danbooru",
  rule34: "Rule34.xxx",
  local: "мои ИИ-арты",
  pixiv: "Pixiv",
  civitai: "Civitai",
};

// The panel itself is w-[min(22rem,100%)] — mirrored here so the download
// button/session-label group slides out of its way instead of sitting under
// it, without having to measure the panel's actual DOM width.
const TAGS_PANEL_WIDTH = "min(22rem, 100%)";

/** A stable (not re-randomized every render) waveform bar-height pattern, purely decorative. */
const WAVE_BARS = Array.from({ length: 56 }, (_, i) => {
  const t = i / 55;
  const envelope = Math.sin(t * Math.PI);
  const ripple = Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.6) * 0.3;
  return Math.max(0.08, envelope * (0.55 + ripple * 0.45));
});

function WaveBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 m-auto h-1/2 max-h-64 w-full max-w-3xl opacity-[0.16]"
      viewBox="0 0 560 160"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="kadr-wave-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {WAVE_BARS.map((h, i) => {
        const barWidth = 560 / WAVE_BARS.length;
        const height = h * 150;
        return (
          <rect
            key={i}
            x={i * barWidth + barWidth * 0.2}
            y={(160 - height) / 2}
            width={barWidth * 0.6}
            height={height}
            rx={barWidth * 0.3}
            fill="url(#kadr-wave-gradient)"
          />
        );
      })}
    </svg>
  );
}

export function Viewer() {
  const { current: rawCurrent, loading, session, downloadCurrent } = useFeed();
  const tagsOpen = useAppStore((s) => s.tagsOpen);
  const [zoomed, setZoomed] = useState(false);
  // A liked/sound-collection local post carries a blob: URL from whatever
  // session first created it — dead the moment that page unloaded — so it's
  // re-resolved to a live one here before it's ever put in an <img>/<video>.
  const current = useResolvedPost(rawCurrent);

  useEffect(() => {
    setZoomed(false);
  }, [current]);

  useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const alt = useMemo(() => current?.tags.slice(0, 8).join(" ") ?? "", [current]);

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center bg-bg">
      <WaveBackground />
      {current ? (
        current.isMotion && current.ext !== "gif" ? (
          <video
            key={current.key}
            className="relative z-10 max-h-full max-w-full object-contain"
            src={current.sampleUrl}
            controls
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            key={current.key}
            src={current.sampleUrl}
            alt={alt}
            className="relative z-10 max-h-full max-w-full cursor-zoom-in object-contain outline outline-1 -outline-offset-1 outline-fg/10"
            onClick={() => setZoomed(true)}
          />
        )
      ) : (
        <p className="relative z-10 text-sm text-muted">{loading ? "Загрузка…" : "Нет файла"}</p>
      )}
      {current ? (
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 text-xs text-fg/40">
          {SOURCE_LABEL[current.source]}
        </span>
      ) : null}
      <div
        className="absolute top-3 z-10 flex gap-2 transition-[right] duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]"
        style={{ right: tagsOpen ? `calc(${TAGS_PANEL_WIDTH} + 0.75rem)` : "0.75rem" }}
      >
        {session.mode === "playlist" && session.label ? (
          <span className="hidden rounded-md bg-elevated/90 px-2 py-1 text-xs text-muted sm:inline">
            {session.label}
          </span>
        ) : null}
        <ChromeButton
          id="action.download"
          defaultLabel="скачать"
          icon={<Download />}
          size="sm"
          variant="quiet"
          className="bg-elevated/90"
          onClick={() => void downloadCurrent()}
        />
      </div>
      {zoomed && current && !current.isMotion ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/85 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
        >
          <img
            src={current.sampleUrl}
            alt={alt}
            className="max-h-[96vh] max-w-[96vw] cursor-zoom-out object-contain shadow-2xl"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
