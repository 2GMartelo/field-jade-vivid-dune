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
import { pickBiasTags } from "@/lib/media/recommend";
import { filterBlockedTags, isBlockedTag } from "@/lib/media/safety";
import type { MediaPost } from "@/lib/media/types";
import { enabledSources, useAppStore, type ViewId } from "@/lib/store";
import {
  downloadBlob,
  fetchPostBlob,
  loadDirHandle,
  pickDirectory,
  postFilename,
  saveDirHandle,
  savePostToDirectory,
  ensurePermission,
} from "@/lib/fs-save";

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
  goNext: () => void;
  goBack: () => void;
  likeCurrent: () => void;
  dislikeCurrent: () => void;
  runSearch: (raw: string, label?: string) => void;
  openFavorites: () => void;
  openPlaylist: (posts: MediaPost[], index: number, label: string, query?: string[], origin?: ViewId) => void;
  downloadCurrent: () => void;
  downloadGrid: () => void;
  chooseFolder: () => void;
  loadMoreGrid: () => void;
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
  const saveInAuthorFolders = useAppStore((s) => s.saveInAuthorFolders);
  const likePost = useAppStore((s) => s.likePost);
  const dislikePost = useAppStore((s) => s.dislikePost);
  const setDownloadFolderName = useAppStore((s) => s.setDownloadFolderName);

  const credentials = useMemo(
    () => ({ r34ApiKey, r34UserId, danbooruLogin, danbooruApiKey }),
    [r34ApiKey, r34UserId, danbooruLogin, danbooruApiKey],
  );

  const current = session.items[session.index] ?? null;

  const searchOpts = useCallback(
    (tags: string[], random: boolean, page: number, limit = 16) => ({
      tags,
      exclude: exclusions,
      kind,
      sources: enabledSources({ sources }),
      random,
      page,
      limit,
      ...credentials,
    }),
    [exclusions, kind, sources, credentials],
  );

  const takeFresh = useCallback(
    (posts: MediaPost[]) => posts.filter((p) => !seen.current.has(p.key) && !disliked.includes(p.key)),
    [disliked],
  );

  const fetchRandom = useCallback(async () => {
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
  }, [favoriteAuthors, favoriteTags, likes, searchOpts, smart, takeFresh]);

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
              setGrid((g) => [...g, ...extra]);
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

  const runSearch = useCallback(
    async (raw: string, label?: string) => {
      const tags = filterBlockedTags(parseTagList(raw));
      const blocked = parseTagList(raw).filter(isBlockedTag);
      if (blocked.length) toast.error("Некоторые теги скрыты правилами безопасности");
      setLoading(true);
      setView("grid");
      setGridLabel(label || tags.join(" ") || "поиск");
      setGridQuery(tags);
      try {
        const result = await searchPosts({ data: searchOpts(tags, false, 1, 24) });
        if (result.warning) toast.message(result.warning);
        const posts = result.posts.filter((p) => !disliked.includes(p.key));
        setGrid(posts);
        setGridPage(1);
        if (!posts.length) toast.message("Пусто");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка поиска");
        setGrid([]);
      } finally {
        setLoading(false);
      }
    },
    [disliked, searchOpts],
  );

  const loadMoreGrid = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const page = gridPage + 1;
      const result = await searchPosts({ data: searchOpts(gridQuery, false, page, 24) });
      const extra = result.posts.filter(
        (p) => !disliked.includes(p.key) && !grid.some((g) => g.key === p.key),
      );
      setGrid((g) => [...g, ...extra]);
      setGridPage(page);
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [disliked, grid, gridPage, gridQuery, searchOpts]);

  const openFavorites = useCallback(() => {
    setView("favorites");
    setGrid(likes);
    setGridLabel("избранное");
    setGridQuery([]);
  }, [likes]);

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
    if (liked) useAppStore.getState().unlikePost(current.key);
    else likePost(current);
  }, [current, likePost, likes]);

  const dislikeCurrent = useCallback(() => {
    if (!current) return;
    dislikePost(current.key);
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

  const saveOne = useCallback(
    async (post: MediaPost) => {
      const handle = await getHandle();
      if (handle) {
        await savePostToDirectory(handle, post, saveInAuthorFolders);
        return;
      }
      const blob = await fetchPostBlob(post);
      downloadBlob(blob, postFilename(post));
    },
    [getHandle, saveInAuthorFolders],
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
    const items = view === "favorites" ? likes : grid;
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
  }, [grid, likes, saveOne, view]);

  useEffect(() => {
    seen.current = new Set();
    setSession(emptySession());
    void fetchRandom();
    // Restart random feed when still/motion or sources change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, sources.danbooru, sources.rule34]);

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
      goNext,
      goBack,
      likeCurrent,
      dislikeCurrent,
      runSearch,
      openFavorites,
      openPlaylist,
      downloadCurrent,
      downloadGrid,
      chooseFolder,
      loadMoreGrid,
    }),
    [
      chooseFolder,
      current,
      dislikeCurrent,
      downloadCurrent,
      downloadGrid,
      goBack,
      goNext,
      grid,
      gridLabel,
      gridQuery,
      likeCurrent,
      loadMoreGrid,
      loading,
      openFavorites,
      openPlaylist,
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
