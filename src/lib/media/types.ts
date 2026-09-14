export type SourceId = "danbooru" | "rule34";
export type MediaKind = "still" | "motion";

export type MediaPost = {
  key: string;
  source: SourceId;
  id: number;
  fileUrl: string;
  sampleUrl: string;
  previewUrl: string;
  ext: string;
  width: number;
  height: number;
  tags: string[];
  artists: string[];
  characters: string[];
  score: number;
  rating: string;
  isMotion: boolean;
};

export type SearchInput = {
  tags: string[];
  exclude: string[];
  kind: MediaKind;
  sources: SourceId[];
  random: boolean;
  page: number;
  limit: number;
  r34ApiKey: string;
  r34UserId: string;
  danbooruLogin: string;
  danbooruApiKey: string;
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
