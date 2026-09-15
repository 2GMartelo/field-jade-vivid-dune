import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ButtonSkin, FavTile, MediaKind, MediaPost, SortOrder, SourceId } from "@/lib/media/types";

export type ViewId =
  | "feed"
  | "favorites"
  | "favoritesAll"
  | "favoritesAi"
  | "favoritesSound"
  | "exclusions"
  | "authors"
  | "tags"
  | "settings"
  | "grid";

export type FavGridKind = "authors" | "tags";

/** "gallery" is the app as it exists today; "library" is an empty placeholder second mode — same chrome, no wiring behind it yet. */
export type AppMode = "gallery" | "library";

export type AppState = {
  hydrated: boolean;
  ageOk: boolean;
  sidebarOpen: boolean;
  tagsOpen: boolean;
  smartMode: boolean;
  mediaKind: MediaKind;
  editChrome: boolean;
  saveInAuthorFolders: boolean;
  downloadFolderName: string;
  sources: Record<SourceId, boolean>;
  searchDraft: string;
  searchChips: string[];
  r34ApiKey: string;
  r34UserId: string;
  danbooruLogin: string;
  danbooruApiKey: string;
  danbooruCookie: string;
  danbooruCookieFileName: string;
  likes: MediaPost[];
  disliked: string[];
  exclusions: string[];
  favoriteAuthors: FavTile[];
  favoriteTags: FavTile[];
  buttonSkins: Record<string, ButtonSkin>;
  favGridColumns: Record<FavGridKind, number>;
  sortOrder: SortOrder;
  soundsFolderName: string;
  likeSoundEnabled: boolean;
  likeSoundCount: number;
  aiFolderName: string;
  aiFileCount: number;
  pixivCookie: string;
  civitaiCookie: string;
  civitaiCookieFileName: string;
  soundVideos: MediaPost[];
  headphonesOn: boolean;
  appMode: AppMode;
  setHydrated: (v: boolean) => void;
  confirmAge: () => void;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setTagsOpen: (v: boolean) => void;
  setSmartMode: (v: boolean) => void;
  setMediaKind: (v: MediaKind) => void;
  setEditChrome: (v: boolean) => void;
  setSaveInAuthorFolders: (v: boolean) => void;
  setDownloadFolderName: (v: string) => void;
  setSource: (id: SourceId, on: boolean) => void;
  setSearchDraft: (v: string) => void;
  setSearchChips: (chips: string[]) => void;
  addSearchChip: (tag: string) => void;
  setR34: (apiKey: string, userId: string) => void;
  setDanbooru: (login: string, apiKey: string) => void;
  setDanbooruCookie: (v: string) => void;
  setDanbooruCookieFileName: (v: string) => void;
  likePost: (post: MediaPost) => void;
  unlikePost: (key: string) => void;
  dislikePost: (key: string) => void;
  addExclusion: (tag: string) => void;
  removeExclusion: (tag: string) => void;
  upsertAuthor: (tile: FavTile) => void;
  upsertTag: (tile: FavTile) => void;
  removeAuthor: (id: string) => void;
  removeTag: (id: string) => void;
  setButtonSkin: (id: string, skin: ButtonSkin) => void;
  setFavGridColumns: (kind: FavGridKind, columns: number) => void;
  setSortOrder: (order: SortOrder) => void;
  setSoundsFolderName: (v: string) => void;
  setLikeSoundEnabled: (v: boolean) => void;
  setLikeSoundCount: (n: number) => void;
  setAiFolderName: (v: string) => void;
  setAiFileCount: (n: number) => void;
  setPixivCookie: (v: string) => void;
  setCivitaiCookie: (v: string) => void;
  setCivitaiCookieFileName: (v: string) => void;
  addSoundVideo: (post: MediaPost) => void;
  removeSoundVideo: (key: string) => void;
  setHeadphonesOn: (v: boolean) => void;
  setAppMode: (v: AppMode) => void;
  pinHash: string;
  pinSetupDismissed: boolean;
  pinUnlocked: boolean;
  setPinHash: (v: string) => void;
  setPinSetupDismissed: (v: boolean) => void;
  setPinUnlocked: (v: boolean) => void;
};

const persistKeys: Array<keyof AppState> = [
  "ageOk",
  "sidebarOpen",
  "smartMode",
  "mediaKind",
  "editChrome",
  "saveInAuthorFolders",
  "downloadFolderName",
  "sources",
  "r34ApiKey",
  "r34UserId",
  "danbooruLogin",
  "danbooruApiKey",
  "danbooruCookie",
  "danbooruCookieFileName",
  "likes",
  "disliked",
  "exclusions",
  "favoriteAuthors",
  "favoriteTags",
  "buttonSkins",
  "favGridColumns",
  "sortOrder",
  "soundsFolderName",
  "likeSoundEnabled",
  "aiFolderName",
  "pixivCookie",
  "civitaiCookie",
  "civitaiCookieFileName",
  "soundVideos",
  "pinHash",
  "pinSetupDismissed",
  "appMode",
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ageOk: false,
      sidebarOpen: false,
      tagsOpen: false,
      smartMode: false,
      mediaKind: "still",
      editChrome: false,
      saveInAuthorFolders: true,
      downloadFolderName: "",
      sources: { danbooru: true, rule34: false },
      searchDraft: "",
      searchChips: [],
      r34ApiKey: "",
      r34UserId: "",
      danbooruLogin: "",
      danbooruApiKey: "",
      danbooruCookie: "",
      danbooruCookieFileName: "",
      likes: [],
      disliked: [],
      exclusions: [],
      favoriteAuthors: [],
      favoriteTags: [],
      buttonSkins: {},
      favGridColumns: { authors: 1, tags: 1 },
      sortOrder: "new",
      soundsFolderName: "",
      likeSoundEnabled: true,
      likeSoundCount: 0,
      aiFolderName: "",
      aiFileCount: 0,
      pixivCookie: "",
      civitaiCookie: "",
      civitaiCookieFileName: "",
      soundVideos: [],
      headphonesOn: false,
      appMode: "gallery",
      pinHash: "",
      pinSetupDismissed: false,
      pinUnlocked: false,
      setHydrated: (v) => set({ hydrated: v }),
      confirmAge: () => set({ ageOk: true }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setTagsOpen: (v) => set({ tagsOpen: v }),
      setSmartMode: (v) => set({ smartMode: v }),
      setMediaKind: (v) => set({ mediaKind: v }),
      setEditChrome: (v) => set({ editChrome: v }),
      setSaveInAuthorFolders: (v) => set({ saveInAuthorFolders: v }),
      setDownloadFolderName: (v) => set({ downloadFolderName: v }),
      setSource: (id, on) =>
        set({ sources: { ...get().sources, [id]: on } }),
      setSearchDraft: (v) => set({ searchDraft: v }),
      setSearchChips: (chips) => set({ searchChips: chips }),
      addSearchChip: (tag) => {
        const t = tag.toLowerCase().trim();
        if (!t || get().searchChips.includes(t)) return;
        set({ searchChips: [...get().searchChips, t] });
      },
      setR34: (apiKey, userId) => set({ r34ApiKey: apiKey, r34UserId: userId }),
      setDanbooru: (login, apiKey) =>
        set({ danbooruLogin: login, danbooruApiKey: apiKey }),
      setDanbooruCookie: (v) => set({ danbooruCookie: v }),
      setDanbooruCookieFileName: (v) => set({ danbooruCookieFileName: v }),
      likePost: (post) => {
        const likes = get().likes.filter((p) => p.key !== post.key);
        set({
          likes: [post, ...likes],
          disliked: get().disliked.filter((k) => k !== post.key),
        });
      },
      unlikePost: (key) => set({ likes: get().likes.filter((p) => p.key !== key) }),
      dislikePost: (key) =>
        set({
          disliked: [...new Set([key, ...get().disliked])].slice(0, 4000),
          likes: get().likes.filter((p) => p.key !== key),
        }),
      addExclusion: (tag) => {
        const t = tag.toLowerCase().trim().replace(/\s+/g, "_");
        if (!t) return;
        set({ exclusions: [...new Set([...get().exclusions, t])] });
      },
      removeExclusion: (tag) =>
        set({ exclusions: get().exclusions.filter((t) => t !== tag) }),
      upsertAuthor: (tile) => {
        const rest = get().favoriteAuthors.filter((t) => t.id !== tile.id && t.tag !== tile.tag);
        set({ favoriteAuthors: [tile, ...rest] });
      },
      upsertTag: (tile) => {
        const rest = get().favoriteTags.filter((t) => t.id !== tile.id && t.tag !== tile.tag);
        set({ favoriteTags: [tile, ...rest] });
      },
      removeAuthor: (id) =>
        set({ favoriteAuthors: get().favoriteAuthors.filter((t) => t.id !== id) }),
      removeTag: (id) =>
        set({ favoriteTags: get().favoriteTags.filter((t) => t.id !== id) }),
      setButtonSkin: (id, skin) =>
        set({ buttonSkins: { ...get().buttonSkins, [id]: skin } }),
      setFavGridColumns: (kind, columns) =>
        set({ favGridColumns: { ...get().favGridColumns, [kind]: columns } }),
      setSortOrder: (order) => set({ sortOrder: order }),
      setSoundsFolderName: (v) => set({ soundsFolderName: v }),
      setLikeSoundEnabled: (v) => set({ likeSoundEnabled: v }),
      setLikeSoundCount: (n) => set({ likeSoundCount: n }),
      setAiFolderName: (v) => set({ aiFolderName: v }),
      setAiFileCount: (n) => set({ aiFileCount: n }),
      setPixivCookie: (v) => set({ pixivCookie: v }),
      setCivitaiCookie: (v) => set({ civitaiCookie: v }),
      setCivitaiCookieFileName: (v) => set({ civitaiCookieFileName: v }),
      addSoundVideo: (post) => {
        if (get().soundVideos.some((p) => p.key === post.key)) return;
        set({ soundVideos: [post, ...get().soundVideos] });
      },
      removeSoundVideo: (key) =>
        set({ soundVideos: get().soundVideos.filter((p) => p.key !== key) }),
      setHeadphonesOn: (v) => set({ headphonesOn: v }),
      setAppMode: (v) => set({ appMode: v }),
      setPinHash: (v) => set({ pinHash: v }),
      setPinSetupDismissed: (v) => set({ pinSetupDismissed: v }),
      setPinUnlocked: (v) => set({ pinUnlocked: v }),
    }),
    {
      name: "kadr-store",
      skipHydration: true,
      partialize: (state) => {
        const picked: Record<string, unknown> = {};
        for (const key of persistKeys) picked[key] = state[key];
        return picked;
      },
    },
  ),
);

export function enabledSources(state: Pick<AppState, "sources">): SourceId[] {
  const ids: SourceId[] = [];
  if (state.sources.danbooru) ids.push("danbooru");
  if (state.sources.rule34) ids.push("rule34");
  return ids.length ? ids : ["danbooru"];
}
