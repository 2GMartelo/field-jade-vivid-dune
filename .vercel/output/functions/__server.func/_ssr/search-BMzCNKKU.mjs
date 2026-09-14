import { n as proxiedMediaUrl } from "./hosts-C3nIU59c.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { n as isBlockedTag, r as postHasBlockedTag, t as filterBlockedTags } from "./safety-CmhH5s0R.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-BMzCNKKU.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var UA = "Kadr/1.0 (personal gallery; +https://grok.com)";
var MOTION_EXT = /* @__PURE__ */ new Set([
	"gif",
	"webm",
	"mp4",
	"zip"
]);
function isMotionExt(ext) {
	return MOTION_EXT.has(ext.toLowerCase());
}
function keyOf(source, id) {
	return `${source}:${id}`;
}
function displayUrl(fileUrl, sampleUrl) {
	return sampleUrl || fileUrl;
}
function toProxied(post) {
	return {
		...post,
		fileUrl: proxiedMediaUrl(post.fileUrl),
		sampleUrl: proxiedMediaUrl(post.sampleUrl || post.fileUrl),
		previewUrl: proxiedMediaUrl(post.previewUrl || post.sampleUrl || post.fileUrl)
	};
}
async function getJson(url, extraHeaders) {
	const res = await fetch(url, {
		headers: {
			"User-Agent": UA,
			Accept: "application/json",
			...extraHeaders
		},
		signal: AbortSignal.timeout(12e3)
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(text.slice(0, 180) || "bad json");
	}
}
function fromDanbooru(raw) {
	if (raw.is_banned || raw.is_deleted) return null;
	const id = Number(raw.id);
	const fileUrl = String(raw.file_url ?? "");
	const sampleUrl = String(raw.large_file_url ?? raw.file_url ?? "");
	const previewUrl = String(raw.preview_file_url ?? sampleUrl);
	const ext = String(raw.file_ext ?? "").replace(".", "").toLowerCase();
	if (!id || !fileUrl || ext === "zip" || ext === "ugoira") return null;
	const tags = String(raw.tag_string ?? "").split(/\s+/).filter(Boolean);
	const artists = String(raw.tag_string_artist ?? "").split(/\s+/).filter(Boolean);
	const characters = String(raw.tag_string_character ?? "").split(/\s+/).filter(Boolean);
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
		isMotion: isMotionExt(ext)
	};
}
function fromRule34(raw) {
	const id = Number(raw.id);
	const fileUrl = String(raw.file_url ?? "");
	const sampleUrl = String(raw.sample_url ?? raw.file_url ?? "");
	const previewUrl = String(raw.preview_url ?? sampleUrl);
	if (!id || !fileUrl) return null;
	const ext = (fileUrl.split(".").pop() ?? "jpg").split("?")[0].toLowerCase();
	if (ext === "zip") return null;
	const tags = String(raw.tags ?? "").split(/\s+/).filter(Boolean);
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
		isMotion: isMotionExt(ext)
	};
}
function keepPost(post, input) {
	if (postHasBlockedTag(post.tags) || post.artists.some(isBlockedTag)) return false;
	if (input.kind === "motion" && !post.isMotion) return false;
	if (input.kind === "still" && post.isMotion) return false;
	const exclude = new Set(input.exclude.map((t) => t.toLowerCase()));
	if (post.tags.some((t) => exclude.has(t.toLowerCase()))) return false;
	const required = filterBlockedTags(input.tags);
	if (required.length && !required.every((t) => post.tags.includes(t) || post.artists.includes(t))) return false;
	return true;
}
function danbooruLimit(hasAuth) {
	return hasAuth ? 6 : 2;
}
function buildDanbooruTags(input) {
	const userTags = filterBlockedTags(input.tags);
	const extras = [];
	if (input.kind === "motion") extras.push("animated");
	const max = danbooruLimit(Boolean(input.danbooruLogin && input.danbooruApiKey));
	const tags = [];
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
async function fetchDanbooru(input) {
	const tags = buildDanbooruTags(input);
	const params = new URLSearchParams({
		tags,
		limit: String(Math.min(40, Math.max(input.limit, 8))),
		page: String(Math.max(1, input.page))
	});
	if (input.random && !tags.includes("random:")) params.set("page", String(1 + Math.floor(Math.random() * 40)));
	if (input.danbooruLogin && input.danbooruApiKey) {
		params.set("login", input.danbooruLogin);
		params.set("api_key", input.danbooruApiKey);
	}
	const url = `https://danbooru.donmai.us/posts.json?${params.toString()}`;
	let data;
	try {
		data = await getJson(url);
	} catch (err) {
		if (!input.random) throw err;
		const fallback = new URLSearchParams({
			limit: String(input.limit),
			page: String(1 + Math.floor(Math.random() * 80))
		});
		if (input.danbooruLogin && input.danbooruApiKey) {
			fallback.set("login", input.danbooruLogin);
			fallback.set("api_key", input.danbooruApiKey);
		}
		if (input.kind === "motion") fallback.set("tags", "animated");
		data = await getJson(`https://danbooru.donmai.us/posts.json?${fallback.toString()}`);
	}
	return (Array.isArray(data) ? data : data && typeof data === "object" ? [data] : []).map((item) => item && typeof item === "object" ? fromDanbooru(item) : null).filter((p) => Boolean(p));
}
async function fetchRule34(input) {
	if (!input.r34ApiKey || !input.r34UserId) throw new Error("no-r34-auth");
	const tags = [...filterBlockedTags(input.tags)];
	if (input.kind === "motion") tags.push("animated");
	if (input.random) tags.push("sort:random");
	const data = await getJson(`https://api.rule34.xxx/index.php?${new URLSearchParams({
		page: "dapi",
		s: "post",
		q: "index",
		json: "1",
		limit: String(Math.min(100, Math.max(input.limit, 8))),
		pid: String(Math.max(0, input.page - 1)),
		tags: tags.join(" "),
		api_key: input.r34ApiKey,
		user_id: input.r34UserId
	}).toString()}`);
	return (Array.isArray(data) ? data : []).map((item) => item && typeof item === "object" ? fromRule34(item) : null).filter((p) => Boolean(p));
}
function normalizeInput(raw) {
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
		danbooruApiKey: String(raw.danbooruApiKey ?? "")
	};
}
var searchPosts_createServerFn_handler = createServerRpc({
	id: "5c7432d625eba5e95cc2ae9ad210ab2c39703573490505556af09f7cf7123d60",
	name: "searchPosts",
	filename: "src/lib/media/search.ts"
}, (opts) => searchPosts.__executeServer(opts));
var searchPosts = createServerFn({ method: "POST" }).validator((data) => normalizeInput(data)).handler(searchPosts_createServerFn_handler, async ({ data }) => {
	const tasks = [];
	const warnings = [];
	if (data.sources.includes("danbooru")) tasks.push(fetchDanbooru(data).catch((err) => {
		warnings.push(`Danbooru: ${err instanceof Error ? err.message : "ошибка"}`);
		return [];
	}));
	if (data.sources.includes("rule34")) tasks.push(fetchRule34(data).catch((err) => {
		const message = err instanceof Error ? err.message : "ошибка";
		if (message === "no-r34-auth") warnings.push("Rule34: добавьте API key и user id в настройках");
		else warnings.push(`Rule34: ${message}`);
		return [];
	}));
	const batches = await Promise.all(tasks);
	const seen = /* @__PURE__ */ new Set();
	const posts = [];
	for (const batch of batches) for (const post of batch) {
		if (seen.has(post.key)) continue;
		if (!keepPost(post, data)) continue;
		seen.add(post.key);
		posts.push(toProxied({
			...post,
			sampleUrl: displayUrl(post.fileUrl, post.sampleUrl)
		}));
	}
	if (data.random) for (let i = posts.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[posts[i], posts[j]] = [posts[j], posts[i]];
	}
	return {
		posts,
		page: data.page,
		warning: warnings.length ? warnings.join(" · ") : void 0
	};
});
var suggestTags_createServerFn_handler = createServerRpc({
	id: "7c3dcd6431faf2cfc04406099a02d8f5c5e716f8b9b84bad913e6a0e4ea01ac3",
	name: "suggestTags",
	filename: "src/lib/media/search.ts"
}, (opts) => suggestTags.__executeServer(opts));
var suggestTags = createServerFn({ method: "POST" }).validator((data) => ({ q: String(data.q ?? "").trim() })).handler(suggestTags_createServerFn_handler, async ({ data }) => {
	if (!data.q || data.q.length < 2) return [];
	const url = `https://danbooru.donmai.us/autocomplete.json?${new URLSearchParams({
		"search[query]": data.q,
		"search[type]": "tag_query",
		limit: "8"
	}).toString()}`;
	try {
		const raw = await getJson(url);
		if (!Array.isArray(raw)) return [];
		return raw.map((item) => {
			if (!item || typeof item !== "object") return null;
			const rec = item;
			const value = String(rec.value ?? rec.label ?? "");
			if (!value || isBlockedTag(value)) return null;
			return {
				value,
				count: typeof rec.post_count === "number" ? rec.post_count : void 0,
				category: rec.category != null ? String(rec.category) : void 0
			};
		}).filter((x) => Boolean(x));
	} catch {
		return [];
	}
});
//#endregion
export { searchPosts_createServerFn_handler, suggestTags_createServerFn_handler };
