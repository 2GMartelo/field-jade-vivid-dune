export type SourceId = "danbooru" | "rule34";
/** Every place a post can come from — SourceId (searchable booru APIs) plus
 * a local folder, Pixiv and Civitai, none of which go through the
 * tag-search API. */
export type MediaSource = SourceId | "local" | "pixiv" | "civitai";
export type MediaKind = "still" | "motion" | "ai" | "civitai";

/** A Civitai "resource used" (checkpoint/LoRA/etc) — links to the same model page Civitai's own UI would. */
export type CivitaiResource = {
  name: string;
  version: string;
  type: string;
  url: string;
};

/**
 * Danbooru exposes real tag categories (general/character/copyright/artist/
 * meta) per post; Rule34's index API only returns a flat tag string, so its
 * `copyright`/`characters` stay empty and `meta` is a keyword heuristic
 * (see tag-categories.ts) rather than authoritative data.
 */
export type MediaPost = {
  key: string;
  source: MediaSource;
  id: number;
  fileUrl: string;
  sampleUrl: string;
  previewUrl: string;
  ext: string;
  width: number;
  height: number;
  tags: string[];
  artists: string[];
  /** Pixiv's numeric user id, for "open this author's page" — other sources leave it unset. */
  authorId?: string;
  /** Civitai model-version ids used to generate this image — resolved to full resource info on demand (see use-generation-data). */
  civitaiVersionIds?: number[];
  characters: string[];
  copyright: string[];
  meta: string[];
  score: number;
  favCount: number;
  rating: string;
  isMotion: boolean;
};

export type SortOrder =
  | "new"
  | "old"
  | "score_desc"
  | "score_asc"
  | "fav_desc"
  | "fav_asc";

export type SearchInput = {
  tags: string[];
  exclude: string[];
  kind: MediaKind;
  sources: SourceId[];
  random: boolean;
  page: number;
  limit: number;
  sort: SortOrder;
  r34ApiKey: string;
  r34UserId: string;
  danbooruLogin: string;
  danbooruApiKey: string;
  danbooruCookie: string;
};

export type SearchResult = {
  posts: MediaPost[];
  warning?: string;
  page: number;
};

export type FavTile = {
  id: string;
  tag: string;
  label: string;
  image?: string;
};

export type ButtonSkin = {
  label?: string;
  image?: string;
};
