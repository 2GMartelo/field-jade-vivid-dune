import type { SourceId } from "@/lib/media/types";

const SITE_ALIASES: Record<string, SourceId> = {
  danbooru: "danbooru",
  rule34: "rule34",
  "rule34.xxx": "rule34",
};

export const SITE_PREFIX_NAMES = Object.keys(SITE_ALIASES);

/** The `site:` prefix a raw (not-yet-tokenized) search draft currently starts with, if any — e.g. "rule34:bl" -> {source: "rule34", prefixText: "rule34"}. */
export function draftSiteScope(raw: string): { source: SourceId; prefixText: string } | null {
  const idx = raw.indexOf(":");
  if (idx <= 0) return null;
  const prefixText = raw.slice(0, idx);
  const source = SITE_ALIASES[prefixText.toLowerCase()];
  return source ? { source, prefixText } : null;
}

/**
 * Splits `site:tag` tokens out of an already-tokenized tag list. A tag
 * naming one of the sites restricts the whole search to it (even if that
 * source is switched off in Settings — naming it explicitly is a clear
 * enough signal), stripping the prefix so the rest is a normal search tag.
 */
export function extractSourceScope(tags: string[]): { tags: string[]; source?: SourceId } {
  let source: SourceId | undefined;
  const rest: string[] = [];
  for (const tag of tags) {
    const idx = tag.indexOf(":");
    if (idx > 0) {
      const alias = SITE_ALIASES[tag.slice(0, idx).toLowerCase()];
      if (alias) {
        source = alias;
        const remainder = tag.slice(idx + 1);
        if (remainder) rest.push(remainder);
        continue;
      }
    }
    rest.push(tag);
  }
  return { tags: rest, source };
}
