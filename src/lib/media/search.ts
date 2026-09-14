import { createServerFn } from "@tanstack/react-start";
import { proxiedMediaUrl } from "@/lib/media/hosts";
import { filterBlockedTags, isBlockedTag, postHasBlockedTag } from "@/lib/media/safety";
import type { MediaKind, MediaPost, SearchInput, SearchResult, SourceId } from "@/lib/media/types";

const UA = "Kadr/1.0 (personal gallery; +https://grok.com)";
const MOTION_EXT = new Set(["gif", "webm", "mp4", "zip"]);

function isMotionExt(ext: string) {
  return MOTION_EXT.has(ext.toLowerCase());
}

function keyOf(source: SourceId, id: number) {
  return `${source}:${id}`;
}

function displayUrl(fileUrl: string, sampleUrl: string) {
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

async function getJson(url: string, extraHeaders?: Record<string, string>) {
  const res = await fetch(url, {
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
  const tags = String(raw.tag_string ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const artists = String(raw.tag_string_artist ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const characters = String(raw.tag_string_character ?? "")
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
    tags,
    artists,
    characters,
    score: Number(raw.score ?? 0),
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
  const tags = String(raw.tags ?? "")
    .split(/\s+/)
    .filter(Boolean);
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
    tags,
    artists,
    characters: [],
    score: Number(raw.score ?? 0),
    rating: String(raw.rating ?? ""),
    isMotion: isMotionExt(ext),
  };
}

function keepPost(post: MediaPost, input: SearchInput) {
  if (postHasBlockedTag(post.tags) || post.artists.some(isBlockedTag)) return false;
  if (input.kind === "motion" && !post.isMotion) return false;
  if (input.kind === "still" && post.isMotion) return false;
  const exclude = new Set(input.exclude.map((t) => t.toLowerCase()));
  if (post.tags.some((t) => exclude.has(t.toLowerCase()))) return false;
  const required = filterBlockedTags(input.tags);
  if (required.length && !required.every((t) => post.tags.includes(t) || post.artists.includes(t))) {
    return false;
  }
  return true;
}

function danbooruLimit(hasAuth: boolean) {
  return hasAuth ? 6 : 2;
}

function buildDanbooruTags(input: SearchInput) {
  const userTags = filterBlockedTags(input.tags);
  const extras: string[] = [];
  if (input.kind === "motion") extras.push("animated");
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
  let data: unknown;
  try {
    data = await getJson(url);
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
    data = await getJson(`https://danbooru.donmai.us/posts.json?${fallback.toString()}`);
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
  const data = await getJson(url);
  const list = Array.isArray(data) ? data : [];
  return list
    .map((item) => (item && typeof item === "object" ? fromRule34(item as Record<string, unknown>) : null))
    .filter((p): p is MediaPost => Boolean(p));
}

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
    r34ApiKey: String(raw.r34ApiKey ?? ""),
    r34UserId: String(raw.r34UserId ?? ""),
    danbooruLogin: String(raw.danbooruLogin ?? ""),
    danbooruApiKey: String(raw.danbooruApiKey ?? ""),
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
        posts.push(toProxied({ ...post, sampleUrl: displayUrl(post.fileUrl, post.sampleUrl) }));
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
