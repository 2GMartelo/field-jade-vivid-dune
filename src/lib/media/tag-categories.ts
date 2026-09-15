/**
 * Rule34's index API returns one flat tag string with no category info (no
 * per-tag type, unlike Danbooru's tag_string_* fields), so "special tags"
 * there is a best-effort keyword heuristic, not authoritative data.
 */
const META_HINTS = new Set([
  "3d",
  "2d",
  "animated",
  "animation",
  "video",
  "sound",
  "audio",
  "voiced",
  "webm",
  "mp4",
  "gif",
  "comic",
  "doujinshi",
  "screencap",
  "cosplay",
  "photo",
  "real_life",
  "3d_(artwork)",
  "flash",
  "loop",
]);

export function splitGeneralMeta(tags: string[]): { general: string[]; meta: string[] } {
  const general: string[] = [];
  const meta: string[] = [];
  for (const tag of tags) {
    (META_HINTS.has(tag.toLowerCase()) ? meta : general).push(tag);
  }
  return { general, meta };
}
