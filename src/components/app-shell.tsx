import { useEffect, useState, type ReactNode } from "react";
import { Heart, HeartOff, PanelLeft, Tag } from "lucide-react";
import { Toaster } from "sonner";
import { useAppStore } from "@/lib/store";
import { FeedProvider, useFeed } from "@/components/feed-context";
import { AgeGate } from "@/components/age-gate";
import { Sidebar } from "@/components/sidebar";
import { Viewer } from "@/components/viewer";
import { MediaGrid } from "@/components/media-grid";
import { FavTiles } from "@/components/fav-tiles";
import { ExclusionsPanel } from "@/components/exclusions-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { TagsPanel } from "@/components/tags-panel";
import { ChromeButton } from "@/components/chrome-button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

function TopBar() {
  const { runSearch, setView, view } = useFeed();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const smartMode = useAppStore((s) => s.smartMode);
  const setSmartMode = useAppStore((s) => s.setSmartMode);
  const searchDraft = useAppStore((s) => s.searchDraft);
  const setSearchDraft = useAppStore((s) => s.setSearchDraft);
  const tagsOpen = useAppStore((s) => s.tagsOpen);
  const setTagsOpen = useAppStore((s) => s.setTagsOpen);

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-bg px-2 sm:px-3">
      <ChromeButton
        id="nav.menu"
        defaultLabel=""
        icon={<PanelLeft />}
        size="icon"
        title={sidebarOpen ? "Скрыть панель" : "Панель"}
        onClick={toggleSidebar}
      />
      <form
        className="min-w-0 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(searchDraft);
        }}
      >
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="поиск по тегам"
          className="h-11 bg-transparent"
        />
      </form>
      <label className="hidden items-center gap-2 text-xs text-muted sm:flex">
        подбор
        <Switch checked={smartMode} onCheckedChange={setSmartMode} />
      </label>
      <ChromeButton
        id="nav.tags"
        defaultLabel="теги"
        icon={<Tag />}
        size="sm"
        variant={tagsOpen ? "quiet" : "ghost"}
        onClick={() => {
          if (view !== "feed") setView("feed");
          setTagsOpen(!tagsOpen);
        }}
      />
    </header>
  );
}

function BottomBar() {
  const { goBack, goNext, likeCurrent, dislikeCurrent, session, current } = useFeed();
  const likes = useAppStore((s) => s.likes);
  const liked = Boolean(current && likes.some((p) => p.key === current.key));
  const atStart = session.index <= 0;

  return (
    <footer className="z-40 flex h-16 shrink-0 items-center justify-center gap-2 border-t border-border bg-bg px-2 sm:gap-3">
      <ChromeButton
        id="nav.back"
        defaultLabel="назад"
        disabled={atStart}
        className="min-w-20 flex-1 sm:flex-none sm:px-6"
        onClick={goBack}
      />
      <ChromeButton
        id="nav.like"
        defaultLabel=""
        icon={<Heart className={liked ? "fill-like text-like" : ""} />}
        size="icon"
        variant="like"
        title="лайк"
        active={liked}
        onClick={likeCurrent}
      />
      <ChromeButton
        id="nav.dislike"
        defaultLabel=""
        icon={<HeartOff />}
        size="icon"
        variant="danger"
        title="дизлайк"
        onClick={dislikeCurrent}
      />
      <ChromeButton
        id="nav.next"
        defaultLabel="дальше"
        className="min-w-20 flex-1 sm:flex-none sm:px-6"
        onClick={goNext}
      />
    </footer>
  );
}

function MainStage() {
  const { view, session, setView } = useFeed();
  const tagsOpen = useAppStore((s) => s.tagsOpen);

  let body: ReactNode = <Viewer />;
  if (view === "favorites" || view === "grid") body = <MediaGrid />;
  if (view === "exclusions") body = <ExclusionsPanel />;
  if (view === "authors") body = <FavTiles kind="authors" />;
  if (view === "tags") body = <FavTiles kind="tags" />;
  if (view === "settings") body = <SettingsPanel />;

  const showChrome = view === "feed";

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      {session.mode === "playlist" && view === "feed" ? (
        <button
          type="button"
          className="absolute left-3 top-3 z-20 h-11 rounded-md bg-elevated/90 px-3 text-sm text-muted"
          onClick={() => setView(session.origin === "favorites" ? "favorites" : "grid")}
        >
          к сетке
        </button>
      ) : null}
      {body}
      {showChrome ? <BottomBar /> : null}
      {tagsOpen && view === "feed" ? <TagsPanel /> : null}
    </div>
  );
}

function Shell() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const { goNext, goBack, likeCurrent, dislikeCurrent, setView } = useFeed();
  const setTagsOpen = useAppStore((s) => s.setTagsOpen);
  const tagsOpen = useAppStore((s) => s.tagsOpen);
  const smartMode = useAppStore((s) => s.smartMode);
  const setSmartMode = useAppStore((s) => s.setSmartMode);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "l" || e.key === "L") likeCurrent();
      if (e.key === "d" || e.key === "D") dislikeCurrent();
      if (e.key === "t" || e.key === "T") setTagsOpen(!tagsOpen);
      if (e.key === "Escape") {
        setTagsOpen(false);
        setSidebarOpen(false);
        setView("feed");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dislikeCurrent, goBack, goNext, likeCurrent, setSidebarOpen, setTagsOpen, setView, tagsOpen]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar />
        {sidebarOpen ? (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-bg/50 md:hidden"
            aria-label="Закрыть панель"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <MainStage />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 sm:hidden">
        <span className="text-xs text-muted">подбор</span>
        <Switch checked={smartMode} onCheckedChange={setSmartMode} />
      </div>
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}

function Boot() {
  const hydrated = useAppStore((s) => s.hydrated);
  const ageOk = useAppStore((s) => s.ageOk);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const done = () => {
      setHydrated(true);
      setReady(true);
    };
    const result = useAppStore.persist.rehydrate();
    if (result && typeof result.then === "function") {
      void result.then(done, done);
    } else {
      done();
    }
  }, [setHydrated]);

  if (!hydrated && !ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="text-sm tracking-[0.2em]">KADR</p>
      </main>
    );
  }
  if (!ageOk) return <AgeGate />;
  return (
    <FeedProvider>
      <Shell />
    </FeedProvider>
  );
}

export function App() {
  return <Boot />;
}
