import { createServerFn } from "@tanstack/react-start";
import { proxiedMediaUrl } from "@/lib/media/hosts";
import { proxyAwareFetch } from "@/lib/media/http.server";
import { splitGeneralMeta } from "@/lib/media/tag-categories";
import { filterBlockedTags, postHasBlockedTag } from "@/lib/media/safety";
import type { MediaPost, SearchInput, SearchResult, SortOrder, SourceId } from "@/lib/media/types";

// A plain custom UA gets rate-limited/blocked by some hosts more readily
// than an ordinary browser's — this is a personal single-user gallery app,
// not a scraper or bot, so it identifies itself the way any browser tab
// hitting these same public/documented endpoints would.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MOTION_EXT = new Set(["gif", "webm", "mp4", "zip"]);

function isMotionExt(ext: string) {
  return MOTION_EXT.has(ext.toLowerCase());
}

function keyOf(source: SourceId, id: number) {
  return `${source}:${id}`;
}

/**
 * Rule34/gelbooru's `sample_url` is a static JPG frame even for a
 * webm/mp4 post (Danbooru's `large_file_url` isn't, it just equals
 * `file_url` for video) — so a motion post must always play from the real
 * file, never the "sample", or the <video> tag gets fed a still image.
 */
function displayUrl(fileUrl: string, sampleUrl: string, isMotion: boolean) {
  if (isMotion) return fileUrl;
  return sampleUrl || fileUrl;
}

function toProxied(post: MediaPost): MediaPost {
  return {
    ...post,
    fileUrl: proxiedMediaUrl(post.fileUrl),
    sampleUrl: proxiedMediaUrl(post.sampleUrl || post.fileUrl),
    previewUrl: proxiedMediaUrl(post.previewUrl || post.sampleUrl || post.fileUrl),
  };
}

/** Every tag bucket combined — the only correct surface for exclude/require/safety checks. */
function allTagsOf(post: Pick<MediaPost, "tags" | "artists" | "characters" | "copyright" | "meta">) {
  return [...post.tags, ...post.artists, ...post.characters, ...post.copyright, ...post.meta];
}

async function getJson(url: string, extraHeaders?: Record<string, string>) {
  const res = await proxyAwareFetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json", ...extraHeaders },
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(text.slice(0, 180) || "bad json");
  }
}

function fromDanbooru(raw: Record<string, unknown>): MediaPost | null {
  if (raw.is_banned || raw.is_deleted) return null;
  const id = Number(raw.id);
  const fileUrl = String(raw.file_url ?? "");
  const sampleUrl = String(raw.large_file_url ?? raw.file_url ?? "");
  const previewUrl = String(raw.preview_file_url ?? sampleUrl);
  const ext = String(raw.file_ext ?? "").replace(".", "").toLowerCase();
  if (!id || !fileUrl || ext === "zip" || ext === "ugoira") return null;
  const splitTags = (field: string) =>
    String(raw[field] ?? "")
      .split(/\s+/)
      .filter(Boolean);
  return {
    key: keyOf("danbooru", id),
    source: "danbooru",
    id,
    fileUrl,
    sampleUrl: sampleUrl || fileUrl,
    previewUrl: previewUrl || sampleUrl || fileUrl,
    ext: ext || "jpg",
    width: Number(raw.image_width ?? 0),
    height: Number(raw.image_height ?? 0),
    tags: splitTags("tag_string_general"),
    artists: splitTags("tag_string_artist"),
    characters: splitTags("tag_string_character"),
    copyright: splitTags("tag_string_copyright"),
    meta: splitTags("tag_string_meta"),
    score: Number(raw.score ?? 0),
    favCount: Number(raw.fav_count ?? 0),
    rating: String(raw.rating ?? ""),
    isMotion: isMotionExt(ext),
  };
}

function fromRule34(raw: Record<string, unknown>): MediaPost | null {
  const id = Number(raw.id);
  const fileUrl = String(raw.file_url ?? "");
  const sampleUrl = String(raw.sample_url ?? raw.file_url ?? "");
  const previewUrl = String(raw.preview_url ?? sampleUrl);
  if (!id || !fileUrl) return null;
  const ext = (fileUrl.split(".").pop() ?? "jpg").split("?")[0]!.toLowerCase();
  if (ext === "zip") return null;
  const rawTags = String(raw.tags ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const { general, meta } = splitGeneralMeta(rawTags);
  const owner = String(raw.owner ?? "").trim();
  const artists = owner && owner !== "anonymous" ? [owner] : [];
  return {
    key: keyOf("rule34", id),
    source: "rule34",
    id,
    fileUrl,
    sampleUrl: sampleUrl || fileUrl,
    previewUrl: previewUrl || sampleUrl || fileUrl,
    ext,
    width: Number(raw.width ?? 0),
    height: Number(raw.height ?? 0),
    tags: general,
    artists,
    // Rule34's index API has no character/copyright breakdown (no per-tag
    // category, unlike Danbooru's tag_string_* fields) without an extra
    // lookup call per tag, so these stay empty rather than guessed.
    characters: [],
    copyright: [],
    meta,
    score: Number(raw.score ?? 0),
    favCount: 0,
    rating: String(raw.rating ?? ""),
    isMotion: isMotionExt(ext),
  };
}

function keepPost(post: MediaPost, input: SearchInput) {
  const all = allTagsOf(post);
  if (postHasBlockedTag(all)) return false;
  if (input.kind === "motion" && !post.isMotion) return false;
  if (input.kind === "still" && post.isMotion) return false;
  const exclude = new Set(input.exclude.map((t) => t.toLowerCase()));
  if (all.some((t) => exclude.has(t.toLowerCase()))) return false;
  const required = filterBlockedTags(input.tags);
  if (required.length) {
    const lower = new Set(all.map((t) => t.toLowerCase()));
    if (!required.every((t) => lower.has(t.toLowerCase()))) return false;
  }
  return true;
}

function danbooruLimit(hasAuth: boolean) {
  return hasAuth ? 6 : 2;
}

/** Danbooru `order:` meta-tag for a sort choice, or null when it has no direct equivalent. */
function danbooruOrderTag(sort: SortOrder): string | null {
  switch (sort) {
    case "new":
      return "order:id_desc";
    case "old":
      return "order:id";
    case "score_desc":
      return "order:score";
    case "score_asc":
      return "order:score_asc";
    case "fav_desc":
      return "order:favcount";
    case "fav_asc":
      return "order:favcount_asc";
    default:
      return null;
  }
}

/** Gelbooru-family `sort:` pseudo-tag Rule34 accepts in its `tags` search param. */
function rule34SortTag(sort: SortOrder): string | null {
  switch (sort) {
    case "new":
      return "sort:id:desc";
    case "old":
      return "sort:id:asc";
    case "score_desc":
      return "sort:score:desc";
    case "score_asc":
      return "sort:score:asc";
    default:
      return null;
  }
}

function buildDanbooruTags(input: SearchInput) {
  const userTags = filterBlockedTags(input.tags);
  const extras: string[] = [];
  if (input.kind === "motion") extras.push("animated");
  if (!input.random) {
    const order = danbooruOrderTag(input.sort);
    if (order) extras.push(order);
  }
  const max = danbooruLimit(Boolean(input.danbooruLogin && input.danbooruApiKey));
  const tags: string[] = [];
  for (const t of [...userTags, ...extras]) {
    if (tags.length >= max) break;
    tags.push(t);
  }
  if (input.random && tags.length < max) {
    const remaining = max - tags.length;
    const n = Math.min(20, Math.max(input.limit, 8));
    tags.push(remaining > 0 ? `random:${n}` : "order:id_desc");
  }
  return tags.join(" ");
}

async function fetchDanbooru(input: SearchInput): Promise<MediaPost[]> {
  const tags = buildDanbooruTags(input);
  const params = new URLSearchParams({
    tags,
    limit: String(Math.min(40, Math.max(input.limit, 8))),
    page: String(Math.max(1, input.page)),
  });
  if (input.random && !tags.includes("random:")) {
    params.set("page", String(1 + Math.floor(Math.random() * 40)));
  }
  if (input.danbooruLogin && input.danbooruApiKey) {
    params.set("login", input.danbooruLogin);
    params.set("api_key", input.danbooruApiKey);
  }
  const url = `https://danbooru.donmai.us/posts.json?${params.toString()}`;
  // A cf_clearance cookie the *user themselves* obtained by solving
  // Danbooru's own "confirm you're human" challenge in their own real
  // browser (see Settings) — sent along if they've supplied one, so the
  // same already-proven-human session covers this server-side request too.
  // Nothing here solves the challenge or pretends to be a browser to get
  // past it; it only reuses a cookie the user personally earned.
  const cookieHeaders = input.danbooruCookie.trim() ? { Cookie: input.danbooruCookie.trim() } : undefined;
  let data: unknown;
  try {
    data = await getJson(url, cookieHeaders);
  } catch (err) {
    if (!input.random) throw err;
    const fallback = new URLSearchParams({
      limit: String(input.limit),
      page: String(1 + Math.floor(Math.random() * 80)),
    });
    if (input.danbooruLogin && input.danbooruApiKey) {
      fallback.set("login", input.danbooruLogin);
      fallback.set("api_key", input.danbooruApiKey);
    }
    if (input.kind === "motion") fallback.set("tags", "animated");
    data = await getJson(`https://danbooru.donmai.us/posts.json?${fallback.toString()}`, cookieHeaders);
  }
  const list = Array.isArray(data) ? data : data && typeof data === "object" ? [data] : [];
  return list
    .map((item) => (item && typeof item === "object" ? fromDanbooru(item as Record<string, unknown>) : null))
    .filter((p): p is MediaPost => Boolean(p));
}

async function fetchRule34(input: SearchInput): Promise<MediaPost[]> {
  if (!input.r34ApiKey || !input.r34UserId) {
    throw new Error("no-r34-auth");
  }
  const userTags = filterBlockedTags(input.tags);
  const tags = [...userTags];
  if (input.kind === "motion") tags.push("animated");
  if (input.random) tags.push("sort:random");
  else {
    const sort = rule34SortTag(input.sort);
    if (sort) tags.push(sort);
  }
  const params = new URLSearchParams({
    page: "dapi",
    s: "post",
    q: "index",
    json: "1",
    limit: String(Math.min(100, Math.max(input.limit, 8))),
    pid: String(Math.max(0, input.page - 1)),
    tags: tags.join(" "),
    api_key: input.r34ApiKey,
    user_id: input.r34UserId,
  });
  const url = `https://api.rule34.xxx/index.php?${params.toString()}`;
  // Rule34's API intermittently hiccups (a timeout, or a transient
  // Cloudflare/rate-limit response that isn't valid JSON) even when
  // everything is configured correctly — a single flaky request shouldn't
  // sink the whole search when a second, near-immediate try usually
  // succeeds fine (this is what "works, then doesn't, then works again on
  // retry" looks like from the API side, not a real outage or a config bug).
  let data: unknown;
  try {
    data = await getJson(url);
  } catch {
    await new Promise((r) => setTimeout(r, 400));
    data = await getJson(url);
  }
  const list = Array.isArray(data) ? data : [];
  return list
    .map((item) => (item && typeof item === "object" ? fromRule34(item as Record<string, unknown>) : null))
    .filter((p): p is MediaPost => Boolean(p));
}

const SORT_ORDERS = new Set<SortOrder>(["new", "old", "score_desc", "score_asc", "fav_desc", "fav_asc"]);

function normalizeInput(raw: SearchInput): SearchInput {
  const sources = raw.sources.filter((s) => s === "danbooru" || s === "rule34");
  return {
    tags: filterBlockedTags(raw.tags ?? []),
    exclude: (raw.exclude ?? []).map((t) => t.toLowerCase()).filter(Boolean),
    kind: raw.kind === "motion" ? "motion" : "still",
    sources: sources.length ? sources : ["danbooru"],
    random: Boolean(raw.random),
    page: Math.max(1, Number(raw.page) || 1),
    limit: Math.min(40, Math.max(1, Number(raw.limit) || 12)),
    sort: SORT_ORDERS.has(raw.sort) ? raw.sort : "new",
    r34ApiKey: String(raw.r34ApiKey ?? ""),
    r34UserId: String(raw.r34UserId ?? ""),
    danbooruLogin: String(raw.danbooruLogin ?? ""),
    danbooruApiKey: String(raw.danbooruApiKey ?? ""),
    danbooruCookie: String(raw.danbooruCookie ?? ""),
  };
}

export const searchPosts = createServerFn({ method: "POST" })
  .validator((data: SearchInput) => normalizeInput(data))
  .handler(async ({ data }): Promise<SearchResult> => {
    const tasks: Promise<MediaPost[]>[] = [];
    const warnings: string[] = [];
    if (data.sources.includes("danbooru")) {
      tasks.push(
        fetchDanbooru(data).catch((err: unknown) => {
          warnings.push(`Danbooru: ${err instanceof Error ? err.message : "ошибка"}`);
          return [];
        }),
      );
    }
    if (data.sources.includes("rule34")) {
      tasks.push(
        fetchRule34(data).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "ошибка";
          if (message === "no-r34-auth") {
            warnings.push("Rule34: добавьте API key и user id в настройках");
          } else {
            warnings.push(`Rule34: ${message}`);
          }
          return [];
        }),
      );
    }
    const batches = await Promise.all(tasks);
    const seen = new Set<string>();
    const posts: MediaPost[] = [];
    for (const batch of batches) {
      for (const post of batch) {
        if (seen.has(post.key)) continue;
        if (!keepPost(post, data)) continue;
        seen.add(post.key);
        posts.push(
          toProxied({ ...post, sampleUrl: displayUrl(post.fileUrl, post.sampleUrl, post.isMotion) }),
        );
      }
    }
    if (data.random) {
      for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j]!, posts[i]!];
      }
    }
    return {
      posts,
      page: data.page,
      warning: warnings.length ? warnings.join(" · ") : undefined,
    };
  });
