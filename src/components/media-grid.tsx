import { Download } from "lucide-react";
import { useFeed } from "@/components/feed-context";
import { ChromeButton } from "@/components/chrome-button";
import { useAppStore } from "@/lib/store";

export function MediaGrid() {
  const {
    grid,
    gridLabel,
    gridQuery,
    loading,
    openPlaylist,
    downloadGrid,
    loadMoreGrid,
    view,
  } = useFeed();
  const likes = useAppStore((s) => s.likes);
  const posts = view === "favorites" ? likes : grid;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="truncate text-sm font-medium text-fg">{gridLabel || "сетка"}</h2>
        <ChromeButton
          id="action.downloadAll"
          defaultLabel="скачать всё"
          icon={<Download />}
          size="sm"
          variant="outline"
          onClick={() => void downloadGrid()}
        />
      </div>
      {posts.length === 0 ? (
        <p className="px-4 text-sm text-muted">{loading ? "Загрузка…" : "Пусто"}</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {posts.map((post, index) => (
              <button
                key={post.key}
                type="button"
                className="group relative aspect-[3/4] overflow-hidden rounded-md bg-surface shadow-[var(--shadow-border)]"
                onClick={() =>
                  openPlaylist(
                    posts,
                    index,
                    gridLabel,
                    view === "favorites" ? [] : gridQuery,
                    view,
                  )
                }
              >
                <img
                  src={post.previewUrl}
                  alt=""
                  className="size-full object-cover outline outline-1 -outline-offset-1 outline-fg/10 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
          {view === "grid" ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="h-11 px-4 text-sm text-muted hover:text-fg"
                onClick={() => void loadMoreGrid()}
              >
                {loading ? "…" : "ещё"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
