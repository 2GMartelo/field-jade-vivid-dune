import { createServerFn } from "@tanstack/react-start";
import { proxyAwareFetch } from "@/lib/media/http.server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Gelbooru-family tag type ids (shared convention with Danbooru's own categories). */
const TYPE_MAP: Record<string, "general" | "artist" | "copyright" | "character" | "meta"> = {
  "0": "general",
  "1": "artist",
  "3": "copyright",
  "4": "character",
  "5": "meta",
};

/**
 * Rule34's index search returns one flat tag string with no per-tag type —
 * this asks its tag-info endpoint (same one the site itself uses to color
 * tags by category) for each tag individually, so a post's real
 * character/copyright/artist tags land in the matching category instead of
 * the general-tags heuristic bucket. Needs the same api_key/user_id as
 * search — Rule34 requires it for every endpoint now, this one included.
 */
export const fetchRule34TagTypes = createServerFn({ method: "POST" })
  .validator((data: { tags: string[]; apiKey: string; userId: string }) => data)
  .handler(async ({ data }): Promise<Record<string, string>> => {
    if (!data.apiKey || !data.userId || !data.tags.length) return {};
    const unique = [...new Set(data.tags)].slice(0, 60);
    const results = await Promise.all(
      unique.map(async (name): Promise<[string, string] | null> => {
        try {
          const params = new URLSearchParams({
            page: "dapi",
            s: "tag",
            q: "index",
            json: "1",
            name,
            api_key: data.apiKey,
            user_id: data.userId,
          });
          const res = await proxyAwareFetch(`https://api.rule34.xxx/index.php?${params.toString()}`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) return null;
          const body = (await res.json()) as unknown;
          const entry = Array.isArray(body)
            ? body[0]
            : ((body as { tag?: unknown[] })?.tag?.[0] ?? body);
          const type = (entry as { type?: unknown })?.type;
          if (type === undefined || type === null) return null;
          return [name, TYPE_MAP[String(type)] ?? "general"];
        } catch {
          return null;
        }
      }),
    );
    return Object.fromEntries(results.filter((r): r is [string, string] => Boolean(r)));
  });
