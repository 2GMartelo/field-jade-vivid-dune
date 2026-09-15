import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { parseTagList } from "@/lib/utils";
import { searchPosts } from "@/lib/media/search";
import { fetchPixivFollowing, fetchPixivUser, resolvePixivImage } from "@/lib/media/pixiv";
import { fetchCivitaiFeed } from "@/lib/media/civitai";
import { pickBiasTags } from "@/lib/media/recommend";
import { filterBlockedTags, isBlockedTag } from "@/lib/media/safety";
import { filterFavoritesByKind } from "@/lib/media/favorites-filter";
import type { MediaPost, SortOrder, SourceId } from "@/lib/media/types";
import { extractSourceScope } from "@/lib/media/source-scope";
import { enabledSources, useAppStore, type ViewId } from "@/lib/store";
import {
  downloadBlob,
  fetchPostBlob,
  loadDirHandle,
  pickDirectory,
  postFilename,
  saveDirHandle,
  saveSoundsDirHandle,
  saveAiDirHandle,
  savePostToDirectory,
  ensurePermission,
} from "@/lib/fs-save";
import { countSoundFiles, invalidateSoundsCache, playRandomLikeSound } from "@/lib/sounds";
import {
  countLocalFiles,
  getRandomLocalPost,
  getReadyAiFolder,
  invalidateLocalCache,
  localPathFromKey,
  resolveLocalPost,
} from "@/lib/local-media";

type Session = {
  mode: "random" | "playlist";
  items: MediaPost[];
  index: number;
  label: string;
  query: string[];
  page: number;
  canLoadMore: boolean;
  origin: ViewId;
};

type FeedContextValue = {
  view: ViewId;
  setView: (v: ViewId) => void;
  session: Session;
  current: MediaPost | null;
  loading: boolean;
  grid: MediaPost[];
  gridLabel: string;
  gridQuery: string[];
  gridPage: number;
  gridHasMore: boolean;
  gridJumping: boolean;
  goToGridPage: (page: number) => void;
  nextGridPage: () => void;
  prevGridPage: () => void;
  jumpToLastGridPage: () => void;
  changeSortOrder: (order: SortOrder) => void;
  goNext: () => void;
  goBack: () => void;
  likeCurrent: () => void;
  dislikeCurrent: () => void;
  runSearch: (raw: string, label?: string) => void;
  addSearchTag: (tag: string) => void;
  openFavorites: () => void;
  openFavoritesAll: () => void;
  openFavoritesAi: () => void;
  openFavoritesSound: () => void;
  openPixivFeed: () => void;
  openPixivUser: (userId: string, label: string) => void;
  gridIsPixiv: boolean;
  gridScrollByView: { current: Partial<Record<ViewId, number>> };
  openPlaylist: (posts: MediaPost[], index: number, label: string, query?: string[], origin?: ViewId) => void;
  downloadCurrent: () => void;
  downloadGrid: () => void;
  chooseFolder: () => void;
  chooseSoundsFolder: () => void;
  chooseAiFolder: () => void;
};

const FeedContext = createContext<FeedContextValue | null>(null);

function emptySession(): Session {
  return {
    mode: "random",
    items: [],
    index: 0,
    label: "",
    query: [],
    page: 1,
    canLoadMore: false,
    origin: "feed",
  };
}

export function FeedProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>("feed");
  const [session, setSession] = useState<Session>(emptySession);
  const [grid, setGrid] = useState<MediaPost[]>([]);
  const [gridLabel, setGridLabel] = useState("");
  const [gridQuery, setGridQuery] = useState<string[]>([]);
  const [gridPage, setGridPage] = useState(1);
  const [gridHasMore, setGridHasMore] = useState(true);
  const [gridJumping, setGridJumping] = useState(false);
  const gridPageSize = 24;
  // Pages of the *current* grid query, so returning to a page already seen
  // (prev/next, or coming back from the viewer) doesn't re-fetch it and
  // can't show a different shuffle of the same page.
  const gridCache = useRef(new Map<number, MediaPost[]>());
  // Resolved full-size pixiv URLs, keyed by illust id — shared by the
  // viewer's auto-upgrade (regular) and the download/save path (original)
  // so opening then saving the same post doesn't refetch it.
  const pixivImageCache = useRef(new Map<number, { regular: string; original: string }>());
  // Illust ids a look-ahead prefetch has already been kicked off for, so the
  // effect below doesn't re-request the same id every time session.items
  // changes (e.g. because that very prefetch just resolved and updated it).
  const pixivPrefetched = useRef(new Set<number>());
  // MediaGrid unmounts on every view switch (feed <-> grid/favorites), which
  // would otherwise reset scroll to the top every time you open a post and
  // come back — remembered per view so each grid-like list keeps its own spot.
  const gridScrollByView = useRef<Partial<Record<ViewId, number>>>({});
  // Which fetcher `grid` pages come from — a ref for synchronous reads
  // inside async callbacks (React state from the same tick would be stale),
  // mirrored into state so the UI (e.g. hiding the sort button) can react.
  type GridSource =
    | { kind: "search"; sourceOverride?: SourceId }
    | { kind: "pixivFollowing" }
    | { kind: "pixivUser"; userId: string };
  const gridSourceRef = useRef<GridSource>({ kind: "search" });
  const [gridIsPixiv, setGridIsPixiv] = useState(false);
  const [loading, setLoading] = useState(false);
  const inflight = useRef(false);
  const seen = useRef(new Set<string>());
  const warned = useRef(false);
  const kind = useAppStore((s) => s.mediaKind);
  const smart = useAppStore((s) => s.smartMode);
  const likes = useAppStore((s) => s.likes);
  const disliked = useAppStore((s) => s.disliked);
  const exclusions = useAppStore((s) => s.exclusions);
  const favoriteTags = useAppStore((s) => s.favoriteTags);
  const favoriteAuthors = useAppStore((s) => s.favoriteAuthors);
  const sources = useAppStore((s) => s.sources);
  const r34ApiKey = useAppStore((s) => s.r34ApiKey);
  const r34UserId = useAppStore((s) => s.r34UserId);
  const danbooruLogin = useAppStore((s) => s.danbooruLogin);
  const danbooruApiKey = useAppStore((s) => s.danbooruApiKey);
  const danbooruCookie = useAppStore((s) => s.danbooruCookie);
  const saveInAuthorFolders = useAppStore((s) => s.saveInAuthorFolders);
  const likePost = useAppStore((s) => s.likePost);
  const dislikePost = useAppStore((s) => s.dislikePost);
  const setDownloadFolderName = useAppStore((s) => s.setDownloadFolderName);
  const setSoundsFolderName = useAppStore((s) => s.setSoundsFolderName);
  const setLikeSoundCount = useAppStore((s) => s.setLikeSoundCount);
  const likeSoundEnabled = useAppStore((s) => s.likeSoundEnabled);

  const credentials = useMemo(
    () => ({ r34ApiKey, r34UserId, danbooruLogin, danbooruApiKey, danbooruCookie }),
    [r34ApiKey, r34UserId, danbooruLogin, danbooruApiKey, danbooruCookie],
  );

  const current = session.items[session.index] ?? null;

  const searchOpts = useCallback(
    (tags: string[], random: boolean, page: number, limit = 16, sourceOverride?: SourceId) => ({
      tags,
      exclude: exclusions,
      kind,
      sources: sourceOverride ? [sourceOverride] : enabledSources({ sources }),
      random,
      page,
      limit,
      // Read live rather than via a subscribed value: callers that change
      // sortOrder and immediately re-fetch (see changeSortOrder) must see
      // the new value in that same tick, not a stale render's closure.
      sort: useAppStore.getState().sortOrder,
      ...credentials,
    }),
    [exclusions, kind, sources, credentials],
  );

  const takeFresh = useCallback(
    (posts: MediaPost[]) => posts.filter((p) => !seen.current.has(p.key) && !disliked.includes(p.key)),
    [disliked],
  );

  const fetchLocalRandom = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const folder = await getReadyAiFolder();
      if (!folder) {
        toast.message("Выберите папку с ИИ-артами в настройках");
        return;
      }
      const pick = await getRandomLocalPost(folder, seen.current);
      if (!pick) {
        toast.message("В папке нет подходящих файлов");
        return;
      }
      seen.current.add(pick.key);
      setSession((prev) => {
        const items = prev.mode === "random" ? [...prev.items, pick] : [pick];
        return {
          mode: "random",
          items,
          index: items.length - 1,
          label: "",
          query: [],
          page: 1,
          canLoadMore: true,
          origin: "feed",
        };
      });
      setView("feed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка чтения папки");
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, []);

  const fetchCivitaiRandom = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const result = await fetchCivitaiFeed({ data: { page: attempt } });
        if (result.warning && !warned.current) {
          warned.current = true;
          toast.message(result.warning);
        }
        const fresh = takeFresh(result.posts);
        if (fresh.length) {
          const pick = fresh[0]!;
          seen.current.add(pick.key);
          setSession((prev) => {
            const items = prev.mode === "random" ? [...prev.items, pick] : [pick];
            return {
              mode: "random",
              items,
              index: items.length - 1,
              label: "",
              query: [],
              page: 1,
              canLoadMore: true,
              origin: "feed",
            };
          });
          setView("feed");
          return;
        }
      }
      toast.error("Не удалось найти подходящий файл на Civitai.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [takeFresh]);

  const fetchRandom = useCallback(async () => {
    // "library" is an empty stub app mode — same chrome, nothing wired up
    // behind it yet, so every random-art entry point (boot, "дальше",
    // dislike) is a no-op here rather than loading gallery content into it.
    if (useAppStore.getState().appMode === "library") return;
    if (kind === "ai") {
      await fetchLocalRandom();
      return;
    }
    if (kind === "civitai") {
      await fetchCivitaiRandom();
      return;
    }
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const bias =
          attempt === 0 ? pickBiasTags({ smart, likes, favoriteTags, favoriteAuthors }) : [];
        const result = await searchPosts({ data: searchOpts(bias, true, 1, 20) });
        if (result.warning && !warned.current) {
          warned.current = true;
          toast.message(result.warning);
        }
        const fresh = takeFresh(result.posts);
        if (fresh.length) {
          const pick = fresh[0]!;
          seen.current.add(pick.key);
          setSession((prev) => {
            const items = prev.mode === "random" ? [...prev.items, pick] : [pick];
            return {
              mode: "random",
              items,
              index: items.length - 1,
              label: "",
              query: bias,
              page: 1,
              canLoadMore: true,
              origin: "feed",
            };
          });
          setView("feed");
          return;
        }
      }
      toast.error("Не удалось найти подходящий файл. Ослабьте исключения.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [favoriteAuthors, favoriteTags, fetchCivitaiRandom, fetchLocalRandom, kind, likes, searchOpts, smart, takeFresh]);

  const goNext = useCallback(() => {
    setSession((prev) => {
      if (prev.index < prev.items.length - 1) {
        return { ...prev, index: prev.index + 1 };
      }
      if (prev.mode === "playlist") {
        if (prev.canLoadMore && !inflight.current) {
          inflight.current = true;
          const page = prev.page + 1;
          const query = prev.query;
          const index = prev.index;
          void (async () => {
            setLoading(true);
            try {
              const result = await searchPosts({ data: searchOpts(query, false, page, 24) });
              const extra = takeFresh(result.posts);
              extra.forEach((p) => seen.current.add(p.key));
              setSession((now) => ({
                ...now,
                items: [...now.items, ...extra],
                index: extra.length ? index + 1 : now.index,
                page,
                canLoadMore: extra.length > 0,
              }));
            } finally {
              inflight.current = false;
              setLoading(false);
            }
          })();
        }
        return prev;
      }
      void fetchRandom();
      return prev;
    });
  }, [fetchRandom, searchOpts, takeFresh]);

  const goBack = useCallback(() => {
    setSession((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }));
  }, []);

  /** Fetches one grid page (cached per current query) and makes it current. */
  const fetchGridPage = useCallback(
    async (query: string[], page: number): Promise<MediaPost[]> => {
      // Same stub gate as fetchRandom — this is the shared choke point for
      // search, favorites, grid paging and the Pixiv grid, so gating it here
      // alone covers all of them.
      if (useAppStore.getState().appMode === "library") return [];
      const cached = gridCache.current.get(page);
      if (cached) return cached;
      const source = gridSourceRef.current;
      const cookie = useAppStore.getState().pixivCookie;
      const result =
        source.kind === "pixivFollowing"
          ? await fetchPixivFollowing({ data: { cookie, page } })
          : source.kind === "pixivUser"
            ? await fetchPixivUser({ data: { userId: source.userId, cookie, page } })
            : await searchPosts({
                data: searchOpts(query, false, page, gridPageSize, source.sourceOverride),
              });
      if (result.warning) toast.message(result.warning);
      const posts = result.posts.filter((p) => !disliked.includes(p.key));
      gridCache.current.set(page, posts);
      return posts;
    },
    [disliked, searchOpts],
  );

  const runSearch = useCallback(
    async (raw: string, label?: string) => {
      const { tags: scoped, source } = extractSourceScope(parseTagList(raw));
      const tags = filterBlockedTags(scoped);
      const blocked = scoped.filter(isBlockedTag);
      if (blocked.length) toast.error("Некоторые теги скрыты правилами безопасности");
      gridSourceRef.current = { kind: "search", sourceOverride: source };
      setGridIsPixiv(false);
      setLoading(true);
      setView("grid");
      setGridLabel(label || (source ? `${source}: ${tags.join(" ")}` : tags.join(" ")) || "поиск");
      setGridQuery(tags);
      gridCache.current = new Map();
      try {
        const posts = await fetchGridPage(tags, 1);
        setGrid(posts);
        setGridPage(1);
        // Our own required-tag/exclude/safety filtering runs after the
        // upstream fetch, so a page can come back thin (or even empty) while
        // later pages still have matches — only a truly empty page means no
        // more, not "fewer than a full page".
        setGridHasMore(posts.length > 0);
        if (!posts.length) toast.message("Пусто");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка поиска");
        setGrid([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchGridPage],
  );

  const goToGridPage = useCallback(
    async (page: number) => {
      if (inflight.current) return;
      const target = Math.max(1, Math.floor(page));
      inflight.current = true;
      setLoading(true);
      try {
        const posts = await fetchGridPage(gridQuery, target);
        setGrid(posts);
        setGridPage(target);
        setGridHasMore(posts.length > 0);
        if (!posts.length) toast.message("Пусто");
      } finally {
        inflight.current = false;
        setLoading(false);
      }
    },
    [fetchGridPage, gridQuery],
  );

  const nextGridPage = useCallback(() => void goToGridPage(gridPage + 1), [goToGridPage, gridPage]);
  const prevGridPage = useCallback(
    () => void goToGridPage(Math.max(1, gridPage - 1)),
    [goToGridPage, gridPage],
  );

  // No API here exposes a real "total pages" count, so "last page" is found
  // by probing: double forward until a page comes back empty, then binary
  // search the exact boundary. Bounded (~10-20 requests) and only runs on
  // an explicit user click.
  const jumpToLastGridPage = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setGridJumping(true);
    setLoading(true);
    try {
      const HARD_CAP = 1000;
      const has = async (p: number) => (await fetchGridPage(gridQuery, p)).length > 0;
      let lo = Math.max(1, gridPage);
      if (!(await has(lo))) lo = 1;
      let hi = lo;
      while (hi < HARD_CAP && (await has(hi))) {
        lo = hi;
        hi = Math.min(HARD_CAP, hi < 2 ? 2 : hi * 2);
      }
      if (hi === lo || (await has(hi))) {
        lo = hi;
      } else {
        while (hi - lo > 1) {
          const mid = Math.floor((lo + hi) / 2);
          if (await has(mid)) lo = mid;
          else hi = mid;
        }
      }
      const posts = gridCache.current.get(lo) ?? [];
      setGrid(posts);
      setGridPage(lo);
      setGridHasMore(false);
    } finally {
      inflight.current = false;
      setGridJumping(false);
      setLoading(false);
    }
  }, [fetchGridPage, gridPage, gridQuery]);

  const changeSortOrder = useCallback(
    (order: SortOrder) => {
      useAppStore.getState().setSortOrder(order);
      gridCache.current = new Map();
      if (view === "grid") void goToGridPage(1);
    },
    [goToGridPage, view],
  );

  /** Jumps to this tag's search, replacing whatever was searched before — a fresh single-tag search, not adding onto it. */
  const addSearchTag = useCallback(
    (tag: string) => {
      useAppStore.getState().setSearchChips([tag]);
      runSearch(tag);
    },
    [runSearch],
  );

  const openFavorites = useCallback(() => {
    setView("favorites");
    setGridLabel(
      kind === "motion"
        ? "избранное: видео/gif"
        : kind === "ai"
          ? "избранное: ИИ"
          : kind === "civitai"
            ? "избранное: CivAI"
            : "избранное: фото",
    );
    setGridQuery([]);
  }, [kind]);

  const openFavoritesAll = useCallback(() => {
    setView("favoritesAll");
    setGridLabel("избранное: всё");
    setGridQuery([]);
  }, []);

  const openFavoritesAi = useCallback(() => {
    setView("favoritesAi");
    setGridLabel("избранное: ИИ");
    setGridQuery([]);
  }, []);

  const openFavoritesSound = useCallback(() => {
    setView("favoritesSound");
    setGridLabel("видео со звуком");
    setGridQuery([]);
  }, []);

  const openPixivGrid = useCallback(
    (source: GridSource, label: string) => {
      if (!useAppStore.getState().pixivCookie.trim()) {
        toast.message("Добавьте cookie Pixiv в настройках");
      }
      gridSourceRef.current = source;
      setGridIsPixiv(true);
      gridCache.current = new Map();
      setView("grid");
      setGridLabel(label);
      setGridQuery([]);
      setGridPage(1);
      setLoading(true);
      void fetchGridPage([], 1)
        .then((posts) => {
          setGrid(posts);
          setGridPage(1);
          setGridHasMore(posts.length > 0);
          if (!posts.length) toast.message("Пусто");
        })
        .finally(() => setLoading(false));
    },
    [fetchGridPage],
  );

  const openPixivFeed = useCallback(() => {
    openPixivGrid({ kind: "pixivFollowing" }, "Pixiv: подписки");
  }, [openPixivGrid]);

  const openPixivUser = useCallback(
    (userId: string, label: string) => {
      openPixivGrid({ kind: "pixivUser", userId }, `Pixiv: ${label}`);
    },
    [openPixivGrid],
  );

  const openPlaylist = useCallback(
    (posts: MediaPost[], index: number, label: string, query?: string[], origin?: ViewId) => {
      posts.forEach((p) => seen.current.add(p.key));
      setSession({
        mode: "playlist",
        items: posts,
        index,
        label,
        query: query ?? [],
        page: 1,
        canLoadMore: Boolean(query?.length),
        origin: origin ?? "grid",
      });
      setView("feed");
    },
    [],
  );

  const likeCurrent = useCallback(() => {
    if (!current) return;
    const liked = likes.some((p) => p.key === current.key);
    if (liked) {
      useAppStore.getState().unlikePost(current.key);
    } else {
      likePost(current);
      if (likeSoundEnabled) void playRandomLikeSound();
    }
  }, [current, likePost, likeSoundEnabled, likes]);

  const dislikeCurrent = useCallback(() => {
    if (!current) return;
    const key = current.key;
    dislikePost(key);
    // A disliked post shouldn't linger in this session's own history. Just
    // filtering it out isn't enough when the user had already stepped back
    // into history before disliking — whatever was *ahead* of it (already
    // seen) would shift down and still be one "назад" away. Cutting the
    // timeline at that point instead — dropping the disliked post and
    // everything after it — means goNext() below always lands on fresh
    // content, and "назад" from there goes straight to whatever came before
    // the disliked post, never back through it or its old forward branch.
    setSession((prev) => {
      const idx = prev.items.findIndex((p) => p.key === key);
      if (idx === -1) return prev;
      const items = prev.items.slice(0, idx);
      return { ...prev, items, index: Math.max(0, items.length - 1) };
    });
    goNext();
  }, [current, dislikePost, goNext]);

  const getHandle = useCallback(async () => {
    const stored = await loadDirHandle();
    if (stored && (await ensurePermission(stored))) return stored;
    return null;
  }, []);

  const chooseFolder = useCallback(async () => {
    try {
      const handle = await pickDirectory();
      await saveDirHandle(handle);
      setDownloadFolderName(handle.name);
      toast.success(`Папка: ${handle.name}`);
    } catch (err) {
      if (err instanceof Error && err.message === "folder-unsupported") {
        toast.message("Выбор папки недоступен в этом браузере — файлы уйдут в загрузки");
        return;
      }
      toast.message("Папка не выбрана");
    }
  }, [setDownloadFolderName]);

  const chooseSoundsFolder = useCallback(async () => {
    try {
      const handle = await pickDirectory();
      await saveSoundsDirHandle(handle);
      invalidateSoundsCache();
      const count = await countSoundFiles();
      setSoundsFolderName(handle.name);
      setLikeSoundCount(count);
      toast.success(`Папка со звуками: ${handle.name} (${count})`);
    } catch (err) {
      if (err instanceof Error && err.message === "folder-unsupported") {
        toast.message("Выбор папки недоступен в этом браузере");
        return;
      }
      toast.message("Папка не выбрана");
    }
  }, [setLikeSoundCount, setSoundsFolderName]);

  const chooseAiFolder = useCallback(async () => {
    try {
      const handle = await pickDirectory("read");
      await saveAiDirHandle(handle);
      invalidateLocalCache();
      const count = await countLocalFiles(handle);
      useAppStore.getState().setAiFolderName(handle.name);
      useAppStore.getState().setAiFileCount(count);
      toast.success(`Папка ИИ-артов: ${handle.name} (${count})`);
    } catch (err) {
      if (err instanceof Error && err.message === "folder-unsupported") {
        toast.message("Выбор папки недоступен в этом браузере");
        return;
      }
      toast.message("Папка не выбрана");
    }
  }, []);

  const resolvePixivFor = useCallback(async (id: number) => {
    const cached = pixivImageCache.current.get(id);
    if (cached) return cached;
    const resolved = await resolvePixivImage({ data: { id, cookie: useAppStore.getState().pixivCookie } });
    pixivImageCache.current.set(id, resolved);
    return resolved;
  }, []);

  const saveOne = useCallback(
    async (rawPost: MediaPost) => {
      // Every pixiv listing only ever gives a small cropped preview; the
      // real artwork is a second, on-demand call so browsing stays light.
      // A local post from persisted state (a like, the sound-videos
      // collection) carries a blob: URL that died with whatever session
      // first created it, so it needs the same kind of on-demand refresh.
      const post =
        rawPost.source === "pixiv"
          ? { ...rawPost, fileUrl: (await resolvePixivFor(rawPost.id)).original }
          : rawPost.source === "local"
            ? ((await resolveLocalPost(localPathFromKey(rawPost.key) ?? "")) ?? rawPost)
            : rawPost;
      const handle = await getHandle();
      if (handle) {
        await savePostToDirectory(handle, post, saveInAuthorFolders);
        return;
      }
      const blob = await fetchPostBlob(post);
      downloadBlob(blob, postFilename(post));
    },
    [getHandle, resolvePixivFor, saveInAuthorFolders],
  );

  const downloadCurrent = useCallback(async () => {
    if (!current) return;
    try {
      await saveOne(current);
      toast.success("Сохранено");
    } catch {
      toast.error("Не удалось скачать");
    }
  }, [current, saveOne]);

  const downloadGrid = useCallback(async () => {
    const items =
      view === "favorites"
        ? filterFavoritesByKind(likes, kind)
        : view === "favoritesAll"
          ? likes
          : view === "favoritesAi"
            ? likes.filter((p) => p.source === "local")
            : view === "favoritesSound"
              ? useAppStore.getState().soundVideos
              : grid;
    if (!items.length) return;
    toast.message(`Скачивание ${items.length}`);
    let ok = 0;
    for (const post of items) {
      try {
        await saveOne(post);
        ok += 1;
      } catch {
        /* skip */
      }
    }
    toast.success(`Готово: ${ok} из ${items.length}`);
  }, [grid, kind, likes, saveOne, view]);

  useEffect(() => {
    seen.current = new Set();
    setSession(emptySession());
    void fetchRandom();
    // Restart random feed when still/motion or sources change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, sources.danbooru, sources.rule34]);

  useEffect(() => {
    if (!useAppStore.getState().soundsFolderName) return;
    void countSoundFiles().then(setLikeSoundCount);
    // Refresh the sound count once on boot if a folder was already chosen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!useAppStore.getState().aiFolderName) return;
    void getReadyAiFolder().then((folder) => {
      if (folder) void countLocalFiles(folder).then((n) => useAppStore.getState().setAiFileCount(n));
    });
    // Refresh the AI-folder file count once on boot if one was already chosen.
  }, []);

  // Grid/playlist thumbnails from pixiv are a small cropped preview — the
  // moment a pixiv post becomes the one on screen, swap in the uncropped
  // "regular" size so the viewer shows the real artwork, not a thumbnail.
  useEffect(() => {
    if (!current || current.source !== "pixiv") return;
    if (current.sampleUrl !== current.previewUrl) return; // already upgraded
    let cancelled = false;
    void resolvePixivFor(current.id).then((resolved) => {
      if (cancelled) return;
      setSession((prev) => ({
        ...prev,
        items: prev.items.map((p) => (p.key === current.key ? { ...p, sampleUrl: resolved.regular } : p)),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [current, resolvePixivFor]);

  // Resolving a pixiv post's real URL is a server round-trip (an AJAX call
  // to pixiv itself) that only starts once that post is the one on screen —
  // unlike Danbooru/Rule34, whose sample URL is already known from the
  // search results. Doing that resolve (and priming the browser's own HTTP
  // cache with the resulting image) one step ahead, while the *current* post
  // is still being looked at, means goNext for a pixiv post usually has
  // nothing left to wait for.
  useEffect(() => {
    const next = session.items[session.index + 1];
    if (!next || next.source !== "pixiv") return;
    if (next.sampleUrl !== next.previewUrl) return;
    if (pixivPrefetched.current.has(next.id)) return;
    pixivPrefetched.current.add(next.id);
    void resolvePixivFor(next.id).then((resolved) => {
      setSession((prev) => ({
        ...prev,
        items: prev.items.map((p) => (p.key === next.key ? { ...p, sampleUrl: resolved.regular } : p)),
      }));
      const img = new Image();
      img.src = resolved.regular;
    });
  }, [session.items, session.index, resolvePixivFor]);

  const value = useMemo<FeedContextValue>(
    () => ({
      view,
      setView,
      session,
      current,
      loading,
      grid,
      gridLabel,
      gridQuery,
      gridPage,
      gridHasMore,
      gridJumping,
      goToGridPage,
      nextGridPage,
      prevGridPage,
      jumpToLastGridPage,
      changeSortOrder,
      goNext,
      goBack,
      likeCurrent,
      dislikeCurrent,
      runSearch,
      addSearchTag,
      openFavorites,
      openFavoritesAll,
      openFavoritesAi,
      openFavoritesSound,
      openPixivFeed,
      openPixivUser,
      gridIsPixiv,
      gridScrollByView,
      openPlaylist,
      downloadCurrent,
      downloadGrid,
      chooseFolder,
      chooseSoundsFolder,
      chooseAiFolder,
    }),
    [
      changeSortOrder,
      chooseAiFolder,
      chooseFolder,
      chooseSoundsFolder,
      current,
      dislikeCurrent,
      downloadCurrent,
      downloadGrid,
      goBack,
      goNext,
      goToGridPage,
      grid,
      gridHasMore,
      gridIsPixiv,
      gridJumping,
      gridScrollByView,
      gridLabel,
      gridPage,
      gridQuery,
      jumpToLastGridPage,
      likeCurrent,
      loading,
      addSearchTag,
      nextGridPage,
      openFavorites,
      openFavoritesAi,
      openFavoritesAll,
      openFavoritesSound,
      openPixivFeed,
      openPixivUser,
      openPlaylist,
      prevGridPage,
      runSearch,
      session,
      view,
    ],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed");
  return ctx;
}
