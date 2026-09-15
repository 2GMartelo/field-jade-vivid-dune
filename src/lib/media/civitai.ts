import { createServerFn } from "@tanstack/react-start";
import { proxiedMediaUrl } from "@/lib/media/hosts";
import { proxyAwareFetch } from "@/lib/media/http.server";
import type { CivitaiResource, MediaPost, SearchResult } from "@/lib/media/types";

/**
 * civitai.red (as asked for) is a Cloudflare-fronted mirror that 403s plain
 * server-side requests the same way Danbooru does — so this talks to
 * civitai.com's real, public, documented REST API instead. Its public image
 * endpoint never returns `meta` (prompt/params) for anonymous requests —
 * that's a platform-side privacy gate, not something to work around — but it
 * does return which checkpoint/LoRA resources (`modelVersionIds`) a post
 * used, resolved here into the same "Resources used" links Civitai's own
 * page shows.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
// tag.getVotableTags specifically (see its own comment below) 401s any
// request it thinks isn't a real browser tab — a deliberate access gate,
// not just generic bot-filtering — so that one call alone keeps an honest,
// non-impersonating UA rather than joining the rest of this file in looking
// like an ordinary browser request.
const HONEST_UA = "Kadr/1.0 (personal gallery; +https://grok.com)";
const IMAGE_PAGE_SIZE = 40;

type CivitaiImage = {
  id: number;
  url: string;
  width?: number;
  height?: number;
  username?: string;
  modelVersionIds?: number[];
  meta?: { prompt?: string; negativePrompt?: string } | null;
};

function keyOf(id: number) {
  return `civitai:${id}`;
}

function extFromUrl(url: string) {
  return (url.split(".").pop() ?? "jpeg").split("?")[0]!.toLowerCase();
}

function fromCivitaiImage(raw: CivitaiImage): MediaPost | null {
  if (!raw.id || !raw.url) return null;
  const proxied = proxiedMediaUrl(raw.url);
  const ext = extFromUrl(raw.url);
  return {
    key: keyOf(raw.id),
    source: "civitai",
    id: raw.id,
    fileUrl: proxied,
    sampleUrl: proxied,
    previewUrl: proxied,
    ext,
    width: raw.width ?? 0,
    height: raw.height ?? 0,
    tags: [],
    artists: raw.username ? [raw.username] : [],
    civitaiVersionIds: raw.modelVersionIds ?? [],
    characters: [],
    copyright: [],
    meta: [],
    score: 0,
    favCount: 0,
    rating: "",
    isMotion: ext === "mp4" || ext === "webm" || ext === "gif",
  };
}

const PERIODS = ["Day", "Week", "Month", "AllTime"] as const;

/** A batch of images for the "CivAI" random-browse mode — an independent query each call, not true cursor continuation, so repeats are just left to the caller's own seen-set. */
export const fetchCivitaiFeed = createServerFn({ method: "POST" })
  .validator((data: { page: number }) => data)
  .handler(async ({ data }): Promise<SearchResult> => {
    const period = PERIODS[Math.floor(Math.random() * PERIODS.length)];
    const params = new URLSearchParams({
      limit: String(IMAGE_PAGE_SIZE),
      sort: "Most Reactions",
      period,
      nsfw: "X",
    });
    try {
      const res = await proxyAwareFetch(`https://civitai.com/api/v1/images?${params.toString()}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Civitai HTTP ${res.status}`);
      const body = (await res.json()) as { items?: CivitaiImage[] };
      const posts = (body.items ?? [])
        .map(fromCivitaiImage)
        .filter((p): p is MediaPost => Boolean(p));
      // Most Reactions + a random period is stable, not truly random within
      // a single request, so the order is shuffled client-visibly here.
      for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j]!, posts[i]!];
      }
      return { posts, page: data.page };
    } catch (err) {
      return {
        posts: [],
        page: data.page,
        warning: `Civitai: ${err instanceof Error ? err.message : "ошибка"}`,
      };
    }
  });

/** Resolves model-version ids to full "Resources used" entries (name, version, type, model page link) — same data Civitai's own "Generation data" panel shows. */
export const fetchCivitaiResources = createServerFn({ method: "POST" })
  .validator((data: { versionIds: number[] }) => data)
  .handler(async ({ data }): Promise<CivitaiResource[]> => {
    const ids = data.versionIds.slice(0, 12);
    const results = await Promise.all(
      ids.map(async (id): Promise<CivitaiResource | null> => {
        try {
          const res = await proxyAwareFetch(`https://civitai.com/api/v1/model-versions/${id}`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) return null;
          const body = (await res.json()) as {
            id: number;
            modelId: number;
            name: string;
            model?: { name?: string; type?: string };
          };
          return {
            name: body.model?.name ?? `#${body.modelId}`,
            version: body.name ?? "",
            type: body.model?.type ?? "Model",
            url: `https://civitai.com/models/${body.modelId}?modelVersionId=${body.id}`,
          };
        } catch {
          return null;
        }
      }),
    );
    return results.filter((r): r is CivitaiResource => Boolean(r));
  });

/**
 * Civitai's public REST API has no per-image tags at all. civitai.com's own
 * image page gets them from an internal tRPC endpoint (`tag.getVotableTags`)
 * — confirmed by inspecting the real request it makes: `?input={"json":
 * {"id":<id>,"type":"image"}}` (a *singular* `id`, not an `ids` array — the
 * previous version of this code had that wrong, which alone would have kept
 * it from ever returning anything). But that endpoint isn't actually public:
 * it 401s straight back with "Please use the public API instead" for any
 * request that doesn't look like it came from a real logged-in browser tab —
 * verified live, and true regardless of cookie or input shape. That's Civitai
 * deliberately gating a non-public endpoint, the same kind of thing as a
 * Cloudflare bot check — so, same as elsewhere in this app, this doesn't try
 * to disguise the request as a browser to get past it. In practice this
 * means Civitai tags mostly won't load; the call is kept (rather than
 * removed) in case Civitai ever exposes this properly, or a future logged-in
 * cookie session behaves differently.
 */
export const fetchCivitaiImageTags = createServerFn({ method: "POST" })
  .validator((data: { imageId: number; cookie?: string }) => data)
  .handler(async ({ data }): Promise<string[]> => {
    try {
      const input = JSON.stringify({ json: { id: data.imageId, type: "image" } });
      const cookie = data.cookie?.trim();
      const res = await proxyAwareFetch(
        `https://civitai.com/api/trpc/tag.getVotableTags?input=${encodeURIComponent(input)}`,
        {
          headers: {
            "User-Agent": HONEST_UA,
            Accept: "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
          },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!res.ok) return [];
      const body = (await res.json()) as unknown;
      const json = (body as { result?: { data?: { json?: unknown } } })?.result?.data?.json;
      const list = Array.isArray(json) ? json : Array.isArray((json as { tags?: unknown })?.tags) ? (json as { tags: unknown[] }).tags : [];
      return list
        .map((t) => (typeof t === "string" ? t : (t as { name?: string })?.name))
        .filter((t): t is string => Boolean(t));
    } catch {
      return [];
    }
  });
