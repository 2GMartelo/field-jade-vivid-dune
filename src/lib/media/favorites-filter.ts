import type { MediaKind, MediaPost } from "@/lib/media/types";

/**
 * "избранное: фото/видео" only ever shows net (danbooru/rule34/pixiv) likes
 * matching the current still/motion mode; local AI-folder and Civitai likes
 * have their own mode buckets so they never leak into this one, and vice
 * versa.
 */
export function filterFavoritesByKind(likes: MediaPost[], kind: MediaKind): MediaPost[] {
  if (kind === "ai") return likes.filter((p) => p.source === "local");
  if (kind === "civitai") return likes.filter((p) => p.source === "civitai");
  return likes.filter(
    (p) => p.source !== "local" && p.source !== "civitai" && (kind === "motion" ? p.isMotion : !p.isMotion),
  );
}
