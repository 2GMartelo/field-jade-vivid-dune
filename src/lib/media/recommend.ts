import { unique } from "@/lib/utils";
import type { FavTile, MediaPost } from "@/lib/media/types";
import { isBlockedTag } from "@/lib/media/safety";

const NOISE = new Set([
  "1girl",
  "1boy",
  "2girls",
  "2boys",
  "3girls",
  "3boys",
  "multiple_girls",
  "multiple_boys",
  "solo",
  "duo",
  "highres",
  "absurdres",
  "commentary",
  "commentary_request",
  "translation_request",
  "english_commentary",
  "artist_request",
  "copyright_request",
  "bad_id",
  "bad_twitter_id",
  "commission",
  "skeb_commission",
  "patreon_username",
  "twitter_username",
  "looking_at_viewer",
  "simple_background",
  "white_background",
  "standing",
  "sitting",
  "smile",
  "blush",
  "open_mouth",
  "closed_mouth",
  "original",
  "full_body",
  "upper_body",
  "cowboy_shot",
  "navel",
  "breasts",
  "nipples",
  "nude",
  "uncensored",
  "censored",
  "hetero",
  "mosaic_censoring",
  "bar_censor",
]);

function weightTags(posts: MediaPost[], extra: string[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of [...post.tags, ...post.artists, ...post.characters, ...post.copyright]) {
      const t = tag.toLowerCase();
      if (!t || NOISE.has(t) || isBlockedTag(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  for (const tag of extra) {
    const t = tag.toLowerCase();
    if (!t || isBlockedTag(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 4);
  }
  return counts;
}

function weightedPick(counts: Map<string, number>): string | null {
  const entries = [...counts.entries()];
  if (!entries.length) return null;
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  let roll = Math.random() * total;
  for (const [tag, n] of entries) {
    roll -= n;
    if (roll <= 0) return tag;
  }
  return entries[0]?.[0] ?? null;
}

export function pickBiasTags(opts: {
  smart: boolean;
  likes: MediaPost[];
  favoriteTags: FavTile[];
  favoriteAuthors: FavTile[];
}): string[] {
  if (!opts.smart) return [];
  // Soft bias: more than half the time stay fully random.
  if (Math.random() < 0.42) return [];
  const extra = [
    ...opts.favoriteTags.map((t) => t.tag),
    ...opts.favoriteAuthors.map((t) => t.tag),
  ];
  const counts = weightTags(opts.likes, extra);
  const first = weightedPick(counts);
  if (!first) return [];
  // Usually a single tag so Danbooru's anonymous 2-tag limit still has room.
  if (Math.random() < 0.7) return [first];
  const rest = new Map(counts);
  rest.delete(first);
  const second = weightedPick(rest);
  return unique([first, second].filter((t): t is string => Boolean(t)));
}
