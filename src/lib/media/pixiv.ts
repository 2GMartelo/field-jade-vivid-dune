import { createServerFn } from "@tanstack/react-start";
import { proxiedMediaUrl } from "@/lib/media/hosts";
import { proxyAwareFetch } from "@/lib/media/http.server";
import type { MediaPost, SearchResult } from "@/lib/media/types";

/**
 * Pixiv has no public API for "latest from people I follow" or "this user's
 * works" — this hits the same undocumented AJAX endpoints pixiv.net's own
 * web UI calls, using the viewer's own session cookie (their account, their
 * subscriptions). That's different from Danbooru/Rule34's documented,
 * third-party-friendly DAPI: it can break on any pixiv frontend change and
 * running it outside a real browser session is against pixiv's terms, so
 * treat it as best-effort.
 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const PAGE_SIZE = 30;

function cookieHeader(raw: string) {
  const trimmed = raw.trim();
  return trimmed.includes("=") ? trimmed : `PHPSESSID=${trimmed}`;
}

async function pixivGet(path: string, cookie: string): Promise<Record<string, unknown>> {
  const res = await proxyAwareFetch(`https://www.pixiv.net${path}`, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json",
      Referer: "https://www.pixiv.net/",
      Cookie: cookieHeader(cookie),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Pixiv HTTP ${res.status}`);
  const json = (await res.json()) as { error?: boolean; message?: string; body?: unknown };
  if (json.error) throw new Error(json.message || "Pixiv отклонил запрос — проверьте cookie");
  return (json.body ?? {}) as Record<string, unknown>;
}

function keyOf(id: number) {
  return `pixiv:${id}`;
}

function fromIllust(raw: Record<string, unknown>): MediaPost | null {
  const id = Number(raw.id);
  const url = String(raw.url ?? "");
  if (!id || !url) return null;
  const ext = (url.split(".").pop() ?? "jpg").split("?")[0]!.toLowerCase();
  const tags = Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [];
  const proxied = proxiedMediaUrl(url);
  return {
    key: keyOf(id),
    source: "pixiv",
    id,
    // The real fileUrl is resolved on demand (resolvePixivImage) as soon as
    // the post is opened — this listing preview is a small square crop, all
    // a grid thumbnail needs, and pixiv's CDN 403s a direct un-proxied
    // browser request anyway (Referer check).
    fileUrl: proxied,
    sampleUrl: proxied,
    previewUrl: proxied,
    ext,
    width: Number(raw.width ?? 0),
    height: Number(raw.height ?? 0),
    tags,
    artists: raw.userName ? [String(raw.userName)] : [],
    authorId: raw.userId !== undefined ? String(raw.userId) : undefined,
    characters: [],
    copyright: [],
    meta: Number(raw.pageCount) > 1 ? ["manga"] : [],
    score: 0,
    favCount: 0,
    rating: String(raw.xRestrict ?? "") === "0" ? "s" : "e",
    isMotion: false,
  };
}

function toPosts(rawList: unknown[]): MediaPost[] {
  return rawList
    // Ugoira (pixiv's frame-by-frame "animation") ships as a zip of frames
    // plus separate timing data, not a playable video file — the viewer
    // doesn't reconstruct that, so those posts are skipped.
    .filter((it): it is Record<string, unknown> => Boolean(it) && Number((it as Record<string, unknown>).illustType) !== 2)
    .map(fromIllust)
    .filter((p): p is MediaPost => Boolean(p));
}

export const fetchPixivFollowing = createServerFn({ method: "POST" })
  .validator((data: { cookie: string; page: number }) => data)
  .handler(async ({ data }): Promise<SearchResult> => {
    if (!data.cookie.trim()) {
      return { posts: [], page: data.page, warning: "Pixiv: добавьте cookie в настройках" };
    }
    try {
      const body = await pixivGet(
        `/ajax/follow_latest/illust?p=${Math.max(1, Math.floor(data.page))}&mode=all`,
        data.cookie,
      );
      const thumbnails = body.thumbnails as { illust?: unknown[] } | undefined;
      const list = Array.isArray(thumbnails?.illust) ? thumbnails.illust! : [];
      return { posts: toPosts(list), page: data.page };
    } catch (err) {
      return {
        posts: [],
        page: data.page,
        warning: `Pixiv: ${err instanceof Error ? err.message : "ошибка"}`,
      };
    }
  });

/** A specific artist's own works (newest first), for "open this author's page" from the tags panel. */
export const fetchPixivUser = createServerFn({ method: "POST" })
  .validator((data: { userId: string; cookie: string; page: number }) => data)
  .handler(async ({ data }): Promise<SearchResult> => {
    if (!data.cookie.trim()) {
      return { posts: [], page: data.page, warning: "Pixiv: добавьте cookie в настройках" };
    }
    try {
      const all = await pixivGet(`/ajax/user/${data.userId}/profile/all`, data.cookie);
      const illustIds = Object.keys((all.illusts as Record<string, unknown>) ?? {});
      const mangaIds = Object.keys((all.manga as Record<string, unknown>) ?? {});
      // Numeric-string object keys come back sorted ascending regardless of
      // pixiv's own order, so sort explicitly and flip for newest-first.
      const ids = [...illustIds, ...mangaIds].sort((a, b) => Number(a) - Number(b)).reverse();
      const page = Math.max(1, Math.floor(data.page));
      const pageIds = ids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      if (!pageIds.length) return { posts: [], page: data.page };
      const params = pageIds.map((id) => `ids[]=${id}`).join("&");
      const body = await pixivGet(
        `/ajax/user/${data.userId}/profile/illusts?${params}&work_category=illustManga&is_first_page=0&lang=en`,
        data.cookie,
      );
      const works = (body.works ?? {}) as Record<string, unknown>;
      // Object key order isn't guaranteed here either — walk pageIds so the
      // newest-first order from the id list above is preserved.
      const ordered = pageIds.map((id) => works[id]).filter(Boolean);
      return { posts: toPosts(ordered), page: data.page };
    } catch (err) {
      return {
        posts: [],
        page: data.page,
        warning: `Pixiv: ${err instanceof Error ? err.message : "ошибка"}`,
      };
    }
  });

/** The follow/user listings only give a small cropped preview; viewing or saving the real artwork needs this. */
export const resolvePixivImage = createServerFn({ method: "POST" })
  .validator((data: { id: number; cookie: string }) => data)
  .handler(async ({ data }): Promise<{ regular: string; original: string }> => {
    const body = await pixivGet(`/ajax/illust/${data.id}`, data.cookie);
    const urls = body.urls as { original?: string; regular?: string; small?: string } | undefined;
    const original = urls?.original || urls?.regular;
    const regular = urls?.regular || urls?.original;
    if (!original || !regular) throw new Error("Не удалось получить изображение с Pixiv");
    return { regular: proxiedMediaUrl(regular), original: proxiedMediaUrl(original) };
  });
