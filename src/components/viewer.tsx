import { Download } from "lucide-react";
import { useFeed } from "@/components/feed-context";
import { ChromeButton } from "@/components/chrome-button";

export function Viewer() {
  const { current, loading, session, downloadCurrent } = useFeed();

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center bg-bg">
      {current ? (
        current.isMotion && current.ext !== "gif" ? (
          <video
            key={current.key}
            className="max-h-full max-w-full object-contain"
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
            alt={current.tags.slice(0, 8).join(" ")}
            className="max-h-full max-w-full object-contain outline outline-1 -outline-offset-1 outline-fg/10"
          />
        )
      ) : (
        <p className="text-sm text-muted">{loading ? "Загрузка…" : "Нет файла"}</p>
      )}
      <div className="absolute right-3 top-3 flex gap-2">
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
    </div>
  );
}
