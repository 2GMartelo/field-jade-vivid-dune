import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Filter, Headphones, Heart, HeartOff, Image, PanelLeft, Tag, X } from "lucide-react";
import { Toaster } from "sonner";
import { useAppStore, enabledSources } from "@/lib/store";
import { cn, formatTag, parseTagList } from "@/lib/utils";
import { suggestTags, type TagSuggestion } from "@/lib/media/autocomplete";
import { draftSiteScope } from "@/lib/media/source-scope";
import type { SourceId } from "@/lib/media/types";
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
import { BackgroundAudioPlayer } from "@/components/background-audio";
import { PinLockScreen, PinSetupDialog } from "@/components/pin-gate";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SOURCE_PICKS: Array<{ label: string; value: Record<SourceId, boolean> }> = [
  { label: "Все", value: { danbooru: true, rule34: true } },
  { label: "Danbooru", value: { danbooru: true, rule34: false } },
  { label: "Rule34.xxx", value: { danbooru: false, rule34: true } },
];

/** Picks which source(s) the tag search (SearchBox) queries — a quicker, one-click version of Settings' independent checkboxes. */
function SourcePickerButton() {
  const sources = useAppStore((s) => s.sources);
  const setSource = useAppStore((s) => s.setSource);
  const [open, setOpen] = useState(false);
  const current = SOURCE_PICKS.find(
    (p) => p.value.danbooru === sources.danbooru && p.value.rule34 === sources.rule34,
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title={`Источник поиска: ${current?.label ?? "свой набор"}`}
      >
        <Filter />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Откуда искать</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {SOURCE_PICKS.map((pick) => (
              <Button
                key={pick.label}
                variant={pick === current ? "quiet" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setSource("danbooru", pick.value.danbooru);
                  setSource("rule34", pick.value.rule34);
                  setOpen(false);
                }}
              >
                {pick.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Tag-chip search box: several tags can be queued (AND search) before
 * submitting, with live tag suggestions and a `site:tag` prefix to scope
 * one search to a single source regardless of the Settings toggles.
 * Chips live in the store (not local state) so a tag clicked in the tags
 * panel (see addSearchTag) shows up here too, not just in a hidden query.
 */
function SearchBox() {
  const { runSearch } = useFeed();
  const searchDraft = useAppStore((s) => s.searchDraft);
  const setSearchDraft = useAppStore((s) => s.setSearchDraft);
  const chips = useAppStore((s) => s.searchChips);
  const setChips = useAppStore((s) => s.setSearchChips);
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const scope = draftSiteScope(searchDraft.trim());

  function commitDraft(): string[] {
    const added = parseTagList(searchDraft);
    if (!added.length) return chips;
    const next = [...new Set([...chips, ...added])];
    setChips(next);
    setSearchDraft("");
    setSuggestions([]);
    return next;
  }

  function submit(finalChips: string[]) {
    setSuggestions([]);
    if (!finalChips.length) return;
    runSearch(finalChips.join(" "));
  }

  function pickSuggestion(s: TagSuggestion) {
    const finalTag = scope ? `${scope.prefixText}:${s.tag}` : s.tag;
    setChips([...new Set([...chips, finalTag])]);
    setSearchDraft("");
    setSuggestions([]);
    setHighlight(-1);
  }

  useEffect(() => {
    const raw = searchDraft.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setHighlight(-1);
    const query = scope ? raw.slice(scope.prefixText.length + 1) : raw;
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const myId = ++requestId.current;
    debounceRef.current = setTimeout(() => {
      const sources = scope ? [scope.source] : enabledSources({ sources: useAppStore.getState().sources });
      void suggestTags({ data: { query, sources } })
        .then((res) => {
          if (requestId.current === myId) setSuggestions(res);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <form
      className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-md border border-border bg-transparent px-2 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (highlight >= 0 && suggestions[highlight]) pickSuggestion(suggestions[highlight]!);
        else submit(commitDraft());
      }}
    >
      {chips.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded bg-fg/8 py-1 pl-2 pr-1 text-xs text-fg"
        >
          {formatTag(tag)}
          <button
            type="button"
            className="rounded p-0.5 hover:bg-fg/10"
            onClick={() => setChips(chips.filter((t) => t !== tag))}
            aria-label={`Убрать ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && suggestions.length) {
            e.preventDefault();
            setHighlight((h) => (h + 1) % suggestions.length);
          } else if (e.key === "ArrowUp" && suggestions.length) {
            e.preventDefault();
            setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlight >= 0 && suggestions[highlight]) pickSuggestion(suggestions[highlight]!);
            else submit(commitDraft());
          } else if ((e.key === "," || e.key === "Tab") && searchDraft.trim()) {
            e.preventDefault();
            commitDraft();
          } else if (e.key === "Escape" && suggestions.length) {
            setSuggestions([]);
          } else if (e.key === "Backspace" && !searchDraft && chips.length) {
            setChips(chips.slice(0, -1));
          }
        }}
        placeholder={
          chips.length ? "ещё тег…" : "поиск по тегам — можно несколько, или сайт:тег для одного сайта"
        }
        className="h-9 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
      />
      {suggestions.length ? (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-elevated py-1 shadow-[var(--shadow-border)]">
          {suggestions.map((s, i) => (
            <li key={`${s.source}:${s.tag}`}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-fg/8" : "hover:bg-fg/6"
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pickSuggestion(s)}
              >
                <span className="truncate">{formatTag(s.tag)}</span>
                <span className="shrink-0 text-xs text-muted">
                  {s.source === "danbooru" ? "D" : "R34"}
                  {s.count ? ` · ${s.count}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

/**
 * Placeholder second app mode — same chrome everywhere, nothing wired up
 * behind it yet (see fetchRandom/fetchGridPage's appMode gate). Left
 * ("gallery", purple, a gallery-style square icon) is today's app; right
 * ("library", orange, an open book) does nothing yet.
 */
function AppModeToggle() {
  const appMode = useAppStore((s) => s.appMode);
  const setAppMode = useAppStore((s) => s.setAppMode);
  const isLibrary = appMode === "library";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLibrary}
      title={isLibrary ? "Режим: библиотека (заглушка)" : "Режим: галерея"}
      onClick={() => setAppMode(isLibrary ? "gallery" : "library")}
      className={cn(
        "relative hidden h-6 w-11 shrink-0 items-center rounded-full shadow-[var(--shadow-border)] transition-colors duration-[var(--motion-quick)] sm:inline-flex",
        isLibrary ? "bg-library" : "bg-gallery",
      )}
    >
      <span
        className={cn(
          "pointer-events-none flex size-5 items-center justify-center rounded-full bg-bg shadow-sm transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)]",
          isLibrary ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      >
        {isLibrary ? (
          <BookOpen className="size-3.5 text-library" />
        ) : (
          <Image className="size-3.5 text-gallery" />
        )}
      </span>
    </button>
  );
}

function TopBar() {
  const { setView, view } = useFeed();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const smartMode = useAppStore((s) => s.smartMode);
  const setSmartMode = useAppStore((s) => s.setSmartMode);
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
      <SourcePickerButton />
      <SearchBox />
      <AppModeToggle />
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
  const soundVideos = useAppStore((s) => s.soundVideos);
  const addSoundVideo = useAppStore((s) => s.addSoundVideo);
  const removeSoundVideo = useAppStore((s) => s.removeSoundVideo);
  const liked = Boolean(current && likes.some((p) => p.key === current.key));
  const hasSound = Boolean(current && soundVideos.some((p) => p.key === current.key));
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
      {current?.isMotion ? (
        <ChromeButton
          id="nav.sound"
          defaultLabel=""
          icon={<Headphones className={hasSound ? "text-pink" : ""} />}
          size="icon"
          variant="pink"
          title={hasSound ? "Убрать из «видео со звуком»" : "В «видео со звуком» (фоновое аудио)"}
          active={hasSound}
          onClick={() => (hasSound ? removeSoundVideo(current.key) : addSoundVideo(current))}
        />
      ) : null}
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
  if (
    view === "favorites" ||
    view === "favoritesAll" ||
    view === "favoritesAi" ||
    view === "favoritesSound" ||
    view === "grid"
  ) {
    body = <MediaGrid />;
  }
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
          onClick={() =>
            setView(
              session.origin === "favorites" ||
                session.origin === "favoritesAll" ||
                session.origin === "favoritesAi" ||
                session.origin === "favoritesSound"
                ? session.origin
                : "grid",
            )
          }
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
      <BackgroundAudioPlayer />
      <Toaster theme="dark" position="bottom-center" />
    </div>
  );
}

function Boot() {
  const hydrated = useAppStore((s) => s.hydrated);
  const ageOk = useAppStore((s) => s.ageOk);
  const pinHash = useAppStore((s) => s.pinHash);
  const pinSetupDismissed = useAppStore((s) => s.pinSetupDismissed);
  const pinUnlocked = useAppStore((s) => s.pinUnlocked);
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
  if (pinHash && !pinUnlocked) return <PinLockScreen />;
  return (
    <FeedProvider>
      <Shell />
      <PinSetupDialog open={!pinHash && !pinSetupDismissed} onOpenChange={() => {}} allowLater />
    </FeedProvider>
  );
}

export function App() {
  return <Boot />;
}
