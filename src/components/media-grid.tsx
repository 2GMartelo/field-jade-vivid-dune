import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsRight, Download } from "lucide-react";
import { useFeed } from "@/components/feed-context";
import { ChromeButton } from "@/components/chrome-button";
import { useAppStore } from "@/lib/store";
import { filterFavoritesByKind } from "@/lib/media/favorites-filter";
import { useResolvedPost } from "@/lib/use-resolved-post";
import type { MediaPost, SortOrder } from "@/lib/media/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SORT_LABELS: Record<SortOrder, string> = {
  new: "Сначала новые",
  old: "Сначала старые",
  score_desc: "Рейтинг: высокий → низкий",
  score_asc: "Рейтинг: низкий → высокий",
  fav_desc: "В избранном: часто → редко",
  fav_asc: "В избранном: редко → часто",
};

function SortMenu() {
  const sortOrder = useAppStore((s) => s.sortOrder);
  const { changeSortOrder } = useFeed();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} title="Сортировка">
        <ArrowUpDown />
        сортировка
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сортировка</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((order) => (
              <Button
                key={order}
                variant={order === sortOrder ? "quiet" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  changeSortOrder(order);
                  setOpen(false);
                }}
              >
                {SORT_LABELS[order]}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GridPager() {
  const { gridPage, gridHasMore, gridJumping, goToGridPage, nextGridPage, prevGridPage, jumpToLastGridPage } =
    useFeed();
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-3">
      <Button
        variant="outline"
        size="sm"
        disabled={gridPage <= 1}
        onClick={() => goToGridPage(1)}
        title="Первая страница"
      >
        1
      </Button>
      <Button variant="outline" size="icon" disabled={gridPage <= 1} onClick={prevGridPage} aria-label="Назад">
        <ChevronLeft />
      </Button>
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number.parseInt(draft, 10);
          if (Number.isFinite(n) && n > 0) goToGridPage(n);
          setDraft("");
        }}
      >
        <Input
          value={draft || String(gridPage)}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 w-16 text-center"
          inputMode="numeric"
        />
      </form>
      <Button variant="outline" size="icon" disabled={!gridHasMore} onClick={nextGridPage} aria-label="Дальше">
        <ChevronRight />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={gridJumping}
        onClick={() => void jumpToLastGridPage()}
        title="Последняя доступная страница"
      >
        <ChevronsRight />
        {gridJumping ? "ищу…" : "в конец"}
      </Button>
    </div>
  );
}

/** One grid tile — its own component so a per-post hook (local blob: URL refresh) is legal to call. */
function GridTile({ post, onClick }: { post: MediaPost; onClick: () => void }) {
  const resolved = useResolvedPost(post);
  return (
    <button
      type="button"
      className="group relative aspect-[3/4] overflow-hidden rounded-md bg-surface shadow-[var(--shadow-border)]"
      onClick={onClick}
    >
      <img
        src={resolved.previewUrl}
        alt=""
        className="size-full object-cover outline outline-1 -outline-offset-1 outline-fg/10 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
      />
    </button>
  );
}

export function MediaGrid() {
  const {
    grid,
    gridLabel,
    gridQuery,
    gridIsPixiv,
    gridScrollByView,
    loading,
    openPlaylist,
    downloadGrid,
    view,
  } = useFeed();
  const likes = useAppStore((s) => s.likes);
  const kind = useAppStore((s) => s.mediaKind);
  const soundVideos = useAppStore((s) => s.soundVideos);
  const scrollRef = useRef<HTMLDivElement>(null);

  // MediaGrid unmounts every time you open a post and remounts when you
  // come back ("к сетке") — without this it would always reopen scrolled to
  // the top instead of where you left off.
  useEffect(() => {
    const el = scrollRef.current;
    const target = gridScrollByView.current[view] ?? 0;
    if (!el || !target) return;
    el.scrollTop = target;
    // The grid can still be reflowing (aspect-ratio tiles settling in) on
    // the very first paint, which silently clamps scrollTop back to 0 —
    // nudge it again once layout has actually settled.
    const raf = requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = target;
    });
    return () => cancelAnimationFrame(raf);
    // Only meant to run once, right after this view's grid mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const posts =
    view === "favorites"
      ? filterFavoritesByKind(likes, kind)
      : view === "favoritesAll"
        ? likes
        : view === "favoritesAi"
          ? likes.filter((p) => p.source === "local")
          : view === "favoritesSound"
            ? soundVideos
            : grid;
  const isFavoritesView =
    view === "favorites" || view === "favoritesAll" || view === "favoritesAi" || view === "favoritesSound";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="truncate text-sm font-medium text-fg">{gridLabel || "сетка"}</h2>
        <div className="flex items-center gap-2">
          {view === "grid" && !gridIsPixiv ? <SortMenu /> : null}
          <ChromeButton
            id="action.downloadAll"
            defaultLabel="скачать всё"
            icon={<Download />}
            size="sm"
            variant="outline"
            onClick={() => void downloadGrid()}
          />
        </div>
      </div>
      {posts.length === 0 ? (
        <p className="px-4 text-sm text-muted">{loading ? "Загрузка…" : "Пусто"}</p>
      ) : (
        <div
          ref={scrollRef}
          onScroll={(e) => {
            gridScrollByView.current[view] = e.currentTarget.scrollTop;
          }}
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {posts.map((post, index) => (
              <GridTile
                key={post.key}
                post={post}
                onClick={() => openPlaylist(posts, index, gridLabel, isFavoritesView ? [] : gridQuery, view)}
              />
            ))}
          </div>
          {view === "grid" ? <GridPager /> : null}
        </div>
      )}
    </div>
  );
}
