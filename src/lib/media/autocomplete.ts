import { createServerFn } from "@tanstack/react-start";
import { proxyAwareFetch } from "@/lib/media/http.server";
import type { SourceId } from "@/lib/media/types";

const UA = "Kadr/1.0 (personal gallery; +https://grok.com)";

export type TagSuggestion = { tag: string; source: SourceId; count: number };

async function danbooruSuggest(query: string): Promise<TagSuggestion[]> {
  const params = new URLSearchParams({
    "search[query]": query,
    "search[type]": "tag_query",
    limit: "8",
  });
  try {
    const res = await proxyAwareFetch(`https://danbooru.donmai.us/autocomplete.json?${params}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ value?: string; post_count?: number }>;
    return data
      .filter((d): d is { value: string; post_count?: number } => Boolean(d.value))
      .map((d) => ({ tag: d.value, source: "danbooru" as const, count: Number(d.post_count ?? 0) }));
  } catch {
    return [];
  }
}

async function rule34Suggest(query: string): Promise<TagSuggestion[]> {
  try {
    const res = await proxyAwareFetch(`https://rule34.xxx/autocomplete.php?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    // Rule34's autocomplete embeds the post count in the label, e.g. "blue_eyes (48213)".
    const data = (await res.json()) as Array<{ label?: string; value?: string }>;
    return data
      .filter((d): d is { label?: string; value: string } => Boolean(d.value))
      .map((d) => {
        const match = /\((\d+)\)\s*$/.exec(d.label ?? "");
        return { tag: d.value, source: "rule34" as const, count: match ? Number(match[1]) : 0 };
      });
  } catch {
    return [];
  }
}

/** Tag-name suggestions while typing, merged from whichever sources are in play and sorted by popularity. */
export const suggestTags = createServerFn({ method: "POST" })
  .validator((data: { query: string; sources: SourceId[] }) => data)
  .handler(async ({ data }): Promise<TagSuggestion[]> => {
    const query = data.query.trim().toLowerCase();
    if (query.length < 2) return [];
    const tasks: Promise<TagSuggestion[]>[] = [];
    if (data.sources.includes("danbooru")) tasks.push(danbooruSuggest(query));
    if (data.sources.includes("rule34")) tasks.push(rule34Suggest(query));
    const flat = (await Promise.all(tasks)).flat().sort((a, b) => b.count - a.count);
    const seen = new Set<string>();
    const merged: TagSuggestion[] = [];
    for (const s of flat) {
      if (seen.has(s.tag)) continue;
      seen.add(s.tag);
      merged.push(s);
      if (merged.length >= 10) break;
    }
    return merged;
  });
