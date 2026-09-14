import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ButtonSkin, FavTile, MediaKind, MediaPost, SourceId } from "@/lib/media/types";

export type ViewId =
  | "feed"
  | "favorites"
  | "exclusions"
  | "authors"
  | "tags"
  | "settings"
  | "grid";

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
  r34ApiKey: string;
  r34UserId: string;
  danbooruLogin: string;
  danbooruApiKey: string;
  likes: MediaPost[];
  disliked: string[];
  exclusions: string[];
  favoriteAuthors: FavTile[];
  favoriteTags: FavTile[];
  buttonSkins: Record<string, ButtonSkin>;
  setHydrated: (v: boolean) => void;
  confirmAge: () => void;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setTagsOpen: (v: boolean) => void;
  setSmartMode: (v: boolean) => void;
  setMediaKind: (v: MediaKind) => void;
  toggleMediaKind: () => void;
  setEditChrome: (v: boolean) => void;
  setSaveInAuthorFolders: (v: boolean) => void;
  setDownloadFolderName: (v: string) => void;
  setSource: (id: SourceId, on: boolean) => void;
  setSearchDraft: (v: string) => void;
  setR34: (apiKey: string, userId: string) => void;
  setDanbooru: (login: string, apiKey: string) => void;
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
  "likes",
  "disliked",
  "exclusions",
  "favoriteAuthors",
  "favoriteTags",
  "buttonSkins",
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
      r34ApiKey: "",
      r34UserId: "",
      danbooruLogin: "",
      danbooruApiKey: "",
      likes: [],
      disliked: [],
      exclusions: [],
      favoriteAuthors: [],
      favoriteTags: [],
      buttonSkins: {},
      setHydrated: (v) => set({ hydrated: v }),
      confirmAge: () => set({ ageOk: true }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setTagsOpen: (v) => set({ tagsOpen: v }),
      setSmartMode: (v) => set({ smartMode: v }),
      setMediaKind: (v) => set({ mediaKind: v }),
      toggleMediaKind: () =>
        set({ mediaKind: get().mediaKind === "motion" ? "still" : "motion" }),
      setEditChrome: (v) => set({ editChrome: v }),
      setSaveInAuthorFolders: (v) => set({ saveInAuthorFolders: v }),
      setDownloadFolderName: (v) => set({ downloadFolderName: v }),
      setSource: (id, on) =>
        set({ sources: { ...get().sources, [id]: on } }),
      setSearchDraft: (v) => set({ searchDraft: v }),
      setR34: (apiKey, userId) => set({ r34ApiKey: apiKey, r34UserId: userId }),
      setDanbooru: (login, apiKey) =>
        set({ danbooruLogin: login, danbooruApiKey: apiKey }),
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
