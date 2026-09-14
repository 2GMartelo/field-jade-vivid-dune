const BLOCKED_TOKENS = new Set([
  "loli",
  "lolicon",
  "lolicons",
  "shota",
  "shotacon",
  "shotacons",
  "toddlercon",
  "toddlercons",
  "child",
  "children",
  "childs",
  "infant",
  "infants",
  "baby",
  "toddler",
  "toddlers",
  "underage",
  "underaged",
  "preteen",
  "preteens",
  "cub",
  "cubs",
  "kid",
  "kids",
  "kindergartner",
  "kindergartener",
]);

const BLOCKED_FRAGMENTS = [
  "loli",
  "shota",
  "lolicon",
  "shotacon",
  "toddlercon",
  "underage",
  "under_age",
  "child_porn",
  "young_child",
];

export function normalizeTag(tag: string) {
  return tag.toLowerCase().trim().replace(/-/g, "_").replace(/\s+/g, "_");
}

export function isBlockedTag(tag: string) {
  const t = normalizeTag(tag);
  if (!t) return false;
  if (BLOCKED_FRAGMENTS.some((frag) => t.includes(frag))) return true;
  return t.split("_").some((token) => BLOCKED_TOKENS.has(token));
}

export function filterBlockedTags(tags: string[]) {
  return tags.filter((tag) => !isBlockedTag(tag));
}

export function postHasBlockedTag(tags: string[]) {
  return tags.some(isBlockedTag);
}
