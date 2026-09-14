import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Tag, c as Pencil, d as HeartOff, f as Download, i as Trash2, l as PanelLeft, m as Ban, n as User, o as Settings, p as Clapperboard, s as Plus, t as X, u as Heart } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, d as Slot, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as isBlockedTag, t as filterBlockedTags } from "./safety-CmhH5s0R.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/@radix-ui/react-switch+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B6VgXTI6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var persistKeys = [
	"ageOk",
	"sidebarOpen",
	"smartMode",
	"mediaKind",
	"editChrome",
	"saveInAuthorFolders",
	"downloadFolderName",
	"sources",
	"r34ApiKey",
	"r34UserId",
	"danbooruLogin",
	"danbooruApiKey",
	"likes",
	"disliked",
	"exclusions",
	"favoriteAuthors",
	"favoriteTags",
	"buttonSkins"
];
var useAppStore = create()(persist((set, get) => ({
	hydrated: false,
	ageOk: false,
	sidebarOpen: false,
	tagsOpen: false,
	smartMode: false,
	mediaKind: "still",
	editChrome: false,
	saveInAuthorFolders: true,
	downloadFolderName: "",
	sources: {
		danbooru: true,
		rule34: true
	},
	searchDraft: "",
	r34ApiKey: "",
	r34UserId: "",
	danbooruLogin: "",
	danbooruApiKey: "",
	likes: [],
	disliked: [],
	exclusions: [],
	favoriteAuthors: [],
	favoriteTags: [],
	buttonSkins: {},
	setHydrated: (v) => set({ hydrated: v }),
	confirmAge: () => set({ ageOk: true }),
	setSidebarOpen: (v) => set({ sidebarOpen: v }),
	toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
	setTagsOpen: (v) => set({ tagsOpen: v }),
	setSmartMode: (v) => set({ smartMode: v }),
	setMediaKind: (v) => set({ mediaKind: v }),
	toggleMediaKind: () => set({ mediaKind: get().mediaKind === "motion" ? "still" : "motion" }),
	setEditChrome: (v) => set({ editChrome: v }),
	setSaveInAuthorFolders: (v) => set({ saveInAuthorFolders: v }),
	setDownloadFolderName: (v) => set({ downloadFolderName: v }),
	setSource: (id, on) => set({ sources: {
		...get().sources,
		[id]: on
	} }),
	setSearchDraft: (v) => set({ searchDraft: v }),
	setR34: (apiKey, userId) => set({
		r34ApiKey: apiKey,
		r34UserId: userId
	}),
	setDanbooru: (login, apiKey) => set({
		danbooruLogin: login,
		danbooruApiKey: apiKey
	}),
	likePost: (post) => {
		set({
			likes: [post, ...get().likes.filter((p) => p.key !== post.key)],
			disliked: get().disliked.filter((k) => k !== post.key)
		});
	},
	unlikePost: (key) => set({ likes: get().likes.filter((p) => p.key !== key) }),
	dislikePost: (key) => set({
		disliked: [.../* @__PURE__ */ new Set([key, ...get().disliked])].slice(0, 4e3),
		likes: get().likes.filter((p) => p.key !== key)
	}),
	addExclusion: (tag) => {
		const t = tag.toLowerCase().trim().replace(/\s+/g, "_");
		if (!t) return;
		set({ exclusions: [.../* @__PURE__ */ new Set([...get().exclusions, t])] });
	},
	removeExclusion: (tag) => set({ exclusions: get().exclusions.filter((t) => t !== tag) }),
	upsertAuthor: (tile) => {
		set({ favoriteAuthors: [tile, ...get().favoriteAuthors.filter((t) => t.id !== tile.id && t.tag !== tile.tag)] });
	},
	upsertTag: (tile) => {
		set({ favoriteTags: [tile, ...get().favoriteTags.filter((t) => t.id !== tile.id && t.tag !== tile.tag)] });
	},
	removeAuthor: (id) => set({ favoriteAuthors: get().favoriteAuthors.filter((t) => t.id !== id) }),
	removeTag: (id) => set({ favoriteTags: get().favoriteTags.filter((t) => t.id !== id) }),
	setButtonSkin: (id, skin) => set({ buttonSkins: {
		...get().buttonSkins,
		[id]: skin
	} })
}), {
	name: "kadr-store",
	skipHydration: true,
	partialize: (state) => {
		const picked = {};
		for (const key of persistKeys) picked[key] = state[key];
		return picked;
	}
}));
function enabledSources(state) {
	const ids = [];
	if (state.sources.danbooru) ids.push("danbooru");
	if (state.sources.rule34) ids.push("rule34");
	return ids.length ? ids : ["danbooru"];
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function unique(items) {
	return [...new Set(items)];
}
function sanitizeFilename(name) {
	return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/\s+/g, "_").slice(0, 80) || "file";
}
function parseTagList(raw) {
	return raw.split(/[\s,]+/).map((t) => t.trim().toLowerCase().replace(/ /g, "_")).filter(Boolean);
}
function formatTag(tag) {
	return tag.replace(/_/g, " ");
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var searchPosts = createServerFn({ method: "POST" }).validator((data) => normalizeInput(data)).handler(createSsrRpc("5c7432d625eba5e95cc2ae9ad210ab2c39703573490505556af09f7cf7123d60"));
createServerFn({ method: "POST" }).validator((data) => ({ q: String(data.q ?? "").trim() })).handler(createSsrRpc("7c3dcd6431faf2cfc04406099a02d8f5c5e716f8b9b84bad913e6a0e4ea01ac3"));
var NOISE = /* @__PURE__ */ new Set([
	"1girl",
	"1boy",
	"2girls",
	"2boys",
	"3girls",
	"3boys",
	"multiple_girls",
	"multiple_boys",
	"solo",
	"duo",
	"highres",
	"absurdres",
	"commentary",
	"commentary_request",
	"translation_request",
	"english_commentary",
	"artist_request",
	"copyright_request",
	"bad_id",
	"bad_twitter_id",
	"commission",
	"skeb_commission",
	"patreon_username",
	"twitter_username",
	"looking_at_viewer",
	"simple_background",
	"white_background",
	"standing",
	"sitting",
	"smile",
	"blush",
	"open_mouth",
	"closed_mouth",
	"original",
	"full_body",
	"upper_body",
	"cowboy_shot",
	"navel",
	"breasts",
	"nipples",
	"nude",
	"uncensored",
	"censored",
	"hetero",
	"mosaic_censoring",
	"bar_censor"
]);
function weightTags(posts, extra) {
	const counts = /* @__PURE__ */ new Map();
	for (const post of posts) for (const tag of [
		...post.tags,
		...post.artists,
		...post.characters
	]) {
		const t = tag.toLowerCase();
		if (!t || NOISE.has(t) || isBlockedTag(t)) continue;
		counts.set(t, (counts.get(t) ?? 0) + 1);
	}
	for (const tag of extra) {
		const t = tag.toLowerCase();
		if (!t || isBlockedTag(t)) continue;
		counts.set(t, (counts.get(t) ?? 0) + 4);
	}
	return counts;
}
function weightedPick(counts) {
	const entries = [...counts.entries()];
	if (!entries.length) return null;
	const total = entries.reduce((sum, [, n]) => sum + n, 0);
	let roll = Math.random() * total;
	for (const [tag, n] of entries) {
		roll -= n;
		if (roll <= 0) return tag;
	}
	return entries[0]?.[0] ?? null;
}
function pickBiasTags(opts) {
	if (!opts.smart) return [];
	if (Math.random() < .42) return [];
	const extra = [...opts.favoriteTags.map((t) => t.tag), ...opts.favoriteAuthors.map((t) => t.tag)];
	const counts = weightTags(opts.likes, extra);
	const first = weightedPick(counts);
	if (!first) return [];
	if (Math.random() < .7) return [first];
	const rest = new Map(counts);
	rest.delete(first);
	return unique([first, weightedPick(rest)].filter((t) => Boolean(t)));
}
var DB_NAME = "kadr-fs";
var STORE = "handles";
var KEY = "download-dir";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function saveDirHandle(handle) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(handle, KEY);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function loadDirHandle() {
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		}) ?? null;
	} catch {
		return null;
	}
}
async function ensurePermission(handle) {
	const h = handle;
	try {
		if ((h.queryPermission ? await h.queryPermission({ mode: "readwrite" }) : "granted") === "granted") return true;
		return (h.requestPermission ? await h.requestPermission({ mode: "readwrite" }) : "granted") === "granted";
	} catch {
		return false;
	}
}
function postFilename(post) {
	return sanitizeFilename(`${post.source}-${post.id}.${post.ext}`);
}
async function fetchPostBlob(post) {
	const res = await fetch(post.fileUrl);
	if (!res.ok) throw new Error("download failed");
	return res.blob();
}
async function savePostToDirectory(root, post, subfolders) {
	let dir = root;
	if (subfolders) {
		const author = sanitizeFilename(post.artists[0] || "unknown");
		dir = await root.getDirectoryHandle(author, { create: true });
	}
	const name = postFilename(post);
	const writable = await (await dir.getFileHandle(name, { create: true })).createWritable();
	const blob = await fetchPostBlob(post);
	await writable.write(blob);
	await writable.close();
}
function downloadBlob(blob, name) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
async function pickDirectory() {
	const w = window;
	if (!w.showDirectoryPicker) throw new Error("folder-unsupported");
	return w.showDirectoryPicker({ mode: "readwrite" });
}
var FeedContext = (0, import_react.createContext)(null);
function emptySession() {
	return {
		mode: "random",
		items: [],
		index: 0,
		label: "",
		query: [],
		page: 1,
		canLoadMore: false,
		origin: "feed"
	};
}
function FeedProvider({ children }) {
	const [view, setView] = (0, import_react.useState)("feed");
	const [session, setSession] = (0, import_react.useState)(emptySession);
	const [grid, setGrid] = (0, import_react.useState)([]);
	const [gridLabel, setGridLabel] = (0, import_react.useState)("");
	const [gridQuery, setGridQuery] = (0, import_react.useState)([]);
	const [gridPage, setGridPage] = (0, import_react.useState)(1);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const inflight = (0, import_react.useRef)(false);
	const seen = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const warned = (0, import_react.useRef)(false);
	const kind = useAppStore((s) => s.mediaKind);
	const smart = useAppStore((s) => s.smartMode);
	const likes = useAppStore((s) => s.likes);
	const disliked = useAppStore((s) => s.disliked);
	const exclusions = useAppStore((s) => s.exclusions);
	const favoriteTags = useAppStore((s) => s.favoriteTags);
	const favoriteAuthors = useAppStore((s) => s.favoriteAuthors);
	const sources = useAppStore((s) => s.sources);
	const r34ApiKey = useAppStore((s) => s.r34ApiKey);
	const r34UserId = useAppStore((s) => s.r34UserId);
	const danbooruLogin = useAppStore((s) => s.danbooruLogin);
	const danbooruApiKey = useAppStore((s) => s.danbooruApiKey);
	const saveInAuthorFolders = useAppStore((s) => s.saveInAuthorFolders);
	const likePost = useAppStore((s) => s.likePost);
	const dislikePost = useAppStore((s) => s.dislikePost);
	const setDownloadFolderName = useAppStore((s) => s.setDownloadFolderName);
	const credentials = (0, import_react.useMemo)(() => ({
		r34ApiKey,
		r34UserId,
		danbooruLogin,
		danbooruApiKey
	}), [
		r34ApiKey,
		r34UserId,
		danbooruLogin,
		danbooruApiKey
	]);
	const current = session.items[session.index] ?? null;
	const searchOpts = (0, import_react.useCallback)((tags, random, page, limit = 16) => ({
		tags,
		exclude: exclusions,
		kind,
		sources: enabledSources({ sources }),
		random,
		page,
		limit,
		...credentials
	}), [
		exclusions,
		kind,
		sources,
		credentials
	]);
	const takeFresh = (0, import_react.useCallback)((posts) => posts.filter((p) => !seen.current.has(p.key) && !disliked.includes(p.key)), [disliked]);
	const fetchRandom = (0, import_react.useCallback)(async () => {
		if (inflight.current) return;
		inflight.current = true;
		setLoading(true);
		try {
			for (let attempt = 0; attempt < 4; attempt++) {
				const bias = attempt === 0 ? pickBiasTags({
					smart,
					likes,
					favoriteTags,
					favoriteAuthors
				}) : [];
				const result = await searchPosts({ data: searchOpts(bias, true, 1, 20) });
				if (result.warning && !warned.current) {
					warned.current = true;
					toast.message(result.warning);
				}
				const fresh = takeFresh(result.posts);
				if (fresh.length) {
					const pick = fresh[0];
					seen.current.add(pick.key);
					setSession((prev) => {
						const items = prev.mode === "random" ? [...prev.items, pick] : [pick];
						return {
							mode: "random",
							items,
							index: items.length - 1,
							label: "",
							query: bias,
							page: 1,
							canLoadMore: true,
							origin: "feed"
						};
					});
					setView("feed");
					return;
				}
			}
			toast.error("Не удалось найти подходящий файл. Ослабьте исключения.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
		} finally {
			inflight.current = false;
			setLoading(false);
		}
	}, [
		favoriteAuthors,
		favoriteTags,
		likes,
		searchOpts,
		smart,
		takeFresh
	]);
	const goNext = (0, import_react.useCallback)(() => {
		setSession((prev) => {
			if (prev.index < prev.items.length - 1) return {
				...prev,
				index: prev.index + 1
			};
			if (prev.mode === "playlist") {
				if (prev.canLoadMore && !inflight.current) {
					inflight.current = true;
					const page = prev.page + 1;
					const query = prev.query;
					const index = prev.index;
					(async () => {
						setLoading(true);
						try {
							const result = await searchPosts({ data: searchOpts(query, false, page, 24) });
							const extra = takeFresh(result.posts);
							extra.forEach((p) => seen.current.add(p.key));
							setSession((now) => ({
								...now,
								items: [...now.items, ...extra],
								index: extra.length ? index + 1 : now.index,
								page,
								canLoadMore: extra.length > 0
							}));
							setGrid((g) => [...g, ...extra]);
						} finally {
							inflight.current = false;
							setLoading(false);
						}
					})();
				}
				return prev;
			}
			fetchRandom();
			return prev;
		});
	}, [
		fetchRandom,
		searchOpts,
		takeFresh
	]);
	const goBack = (0, import_react.useCallback)(() => {
		setSession((prev) => ({
			...prev,
			index: Math.max(0, prev.index - 1)
		}));
	}, []);
	const runSearch = (0, import_react.useCallback)(async (raw, label) => {
		const tags = filterBlockedTags(parseTagList(raw));
		if (parseTagList(raw).filter(isBlockedTag).length) toast.error("Некоторые теги скрыты правилами безопасности");
		setLoading(true);
		setView("grid");
		setGridLabel(label || tags.join(" ") || "поиск");
		setGridQuery(tags);
		try {
			const result = await searchPosts({ data: searchOpts(tags, false, 1, 24) });
			if (result.warning) toast.message(result.warning);
			const posts = result.posts.filter((p) => !disliked.includes(p.key));
			setGrid(posts);
			setGridPage(1);
			if (!posts.length) toast.message("Пусто");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ошибка поиска");
			setGrid([]);
		} finally {
			setLoading(false);
		}
	}, [disliked, searchOpts]);
	const loadMoreGrid = (0, import_react.useCallback)(async () => {
		if (inflight.current) return;
		inflight.current = true;
		setLoading(true);
		try {
			const page = gridPage + 1;
			const extra = (await searchPosts({ data: searchOpts(gridQuery, false, page, 24) })).posts.filter((p) => !disliked.includes(p.key) && !grid.some((g) => g.key === p.key));
			setGrid((g) => [...g, ...extra]);
			setGridPage(page);
		} finally {
			inflight.current = false;
			setLoading(false);
		}
	}, [
		disliked,
		grid,
		gridPage,
		gridQuery,
		searchOpts
	]);
	const openFavorites = (0, import_react.useCallback)(() => {
		setView("favorites");
		setGrid(likes);
		setGridLabel("избранное");
		setGridQuery([]);
	}, [likes]);
	const openPlaylist = (0, import_react.useCallback)((posts, index, label, query, origin) => {
		posts.forEach((p) => seen.current.add(p.key));
		setSession({
			mode: "playlist",
			items: posts,
			index,
			label,
			query: query ?? [],
			page: 1,
			canLoadMore: Boolean(query?.length),
			origin: origin ?? "grid"
		});
		setView("feed");
	}, []);
	const likeCurrent = (0, import_react.useCallback)(() => {
		if (!current) return;
		if (likes.some((p) => p.key === current.key)) useAppStore.getState().unlikePost(current.key);
		else likePost(current);
	}, [
		current,
		likePost,
		likes
	]);
	const dislikeCurrent = (0, import_react.useCallback)(() => {
		if (!current) return;
		dislikePost(current.key);
		goNext();
	}, [
		current,
		dislikePost,
		goNext
	]);
	const getHandle = (0, import_react.useCallback)(async () => {
		const stored = await loadDirHandle();
		if (stored && await ensurePermission(stored)) return stored;
		return null;
	}, []);
	const chooseFolder = (0, import_react.useCallback)(async () => {
		try {
			const handle = await pickDirectory();
			await saveDirHandle(handle);
			setDownloadFolderName(handle.name);
			toast.success(`Папка: ${handle.name}`);
		} catch (err) {
			if (err instanceof Error && err.message === "folder-unsupported") {
				toast.message("Выбор папки недоступен в этом браузере — файлы уйдут в загрузки");
				return;
			}
			toast.message("Папка не выбрана");
		}
	}, [setDownloadFolderName]);
	const saveOne = (0, import_react.useCallback)(async (post) => {
		const handle = await getHandle();
		if (handle) {
			await savePostToDirectory(handle, post, saveInAuthorFolders);
			return;
		}
		downloadBlob(await fetchPostBlob(post), postFilename(post));
	}, [getHandle, saveInAuthorFolders]);
	const downloadCurrent = (0, import_react.useCallback)(async () => {
		if (!current) return;
		try {
			await saveOne(current);
			toast.success("Сохранено");
		} catch {
			toast.error("Не удалось скачать");
		}
	}, [current, saveOne]);
	const downloadGrid = (0, import_react.useCallback)(async () => {
		const items = view === "favorites" ? likes : grid;
		if (!items.length) return;
		toast.message(`Скачивание ${items.length}`);
		let ok = 0;
		for (const post of items) try {
			await saveOne(post);
			ok += 1;
		} catch {}
		toast.success(`Готово: ${ok} из ${items.length}`);
	}, [
		grid,
		likes,
		saveOne,
		view
	]);
	(0, import_react.useEffect)(() => {
		seen.current = /* @__PURE__ */ new Set();
		setSession(emptySession());
		fetchRandom();
	}, [
		kind,
		sources.danbooru,
		sources.rule34
	]);
	const value = (0, import_react.useMemo)(() => ({
		view,
		setView,
		session,
		current,
		loading,
		grid,
		gridLabel,
		gridQuery,
		goNext,
		goBack,
		likeCurrent,
		dislikeCurrent,
		runSearch,
		openFavorites,
		openPlaylist,
		downloadCurrent,
		downloadGrid,
		chooseFolder,
		loadMoreGrid
	}), [
		chooseFolder,
		current,
		dislikeCurrent,
		downloadCurrent,
		downloadGrid,
		goBack,
		goNext,
		grid,
		gridLabel,
		gridQuery,
		likeCurrent,
		loadMoreGrid,
		loading,
		openFavorites,
		openPlaylist,
		runSearch,
		session,
		view
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedContext.Provider, {
		value,
		children
	});
}
function useFeed() {
	const ctx = (0, import_react.useContext)(FeedContext);
	if (!ctx) throw new Error("useFeed");
	return ctx;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]",
			ghost: "bg-transparent text-fg hover:bg-fg/6",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-fg/6",
			like: "bg-transparent text-like hover:bg-like/12",
			danger: "bg-transparent text-muted hover:bg-fg/6 hover:text-fg",
			quiet: "bg-surface text-fg shadow-[var(--shadow-border)] hover:bg-raised"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-sm",
			lg: "h-12 px-5",
			icon: "size-11",
			tile: "h-20 px-4"
		}
	},
	defaultVariants: {
		variant: "ghost",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function AgeGate() {
	const confirmAge = useAppStore((s) => s.confirmAge);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl bg-elevated p-6 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-1 text-xs uppercase tracking-[0.18em] text-subtle",
					children: "Kadr"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mb-3 text-xl font-medium tracking-tight",
					children: "Только 18+"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-6 text-pretty text-sm leading-relaxed text-muted",
					children: "Просмотр материалов с Danbooru и Rule34. Подтвердите, что вам есть 18 лет. Контент с несовершеннолетними скрыт и недоступен."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "default",
					className: "w-full",
					onClick: confirmAge,
					children: "Мне есть 18"
				})
			]
		})
	});
}
async function fileToSkinDataUrl(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 640 / bitmap.width);
	const w = Math.max(1, Math.round(bitmap.width * scale));
	const h = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas");
	ctx.drawImage(bitmap, 0, 0, w, h);
	return canvas.toDataURL("image/jpeg", .82);
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-bg/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-elevated p-5 text-fg shadow-[var(--shadow-border)]", "duration-[var(--motion-fast)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-3 top-3 rounded-md p-1 text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Закрыть"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col gap-1.5", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("text-base font-medium tracking-tight", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		className: cn("text-sm text-muted", className),
		...props
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]", "placeholder:text-subtle file:border-0 file:bg-transparent file:text-sm file:font-medium", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
function ChromeButton({ id, defaultLabel, icon, className, title, active, disabled, onClick, variant = "ghost", size = "default" }) {
	const skin = useAppStore((s) => s.buttonSkins[id]);
	const editChrome = useAppStore((s) => s.editChrome);
	const setButtonSkin = useAppStore((s) => s.setButtonSkin);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [label, setLabel] = (0, import_react.useState)(skin?.label ?? defaultLabel);
	const [image, setImage] = (0, import_react.useState)(skin?.image ?? "");
	const shownLabel = skin?.label ?? defaultLabel;
	const shownImage = skin?.image;
	function handleClick() {
		if (editChrome) {
			setLabel(skin?.label ?? defaultLabel);
			setImage(skin?.image ?? "");
			setOpen(true);
			return;
		}
		onClick?.();
	}
	async function onFile(file) {
		if (!file) return;
		const url = await fileToSkinDataUrl(file);
		setImage(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		type: "button",
		variant,
		size,
		disabled,
		title: editChrome ? "Изменить кнопку" : title ?? shownLabel,
		onClick: handleClick,
		className: cn("relative overflow-hidden", shownImage && "text-fg", active && "bg-fg/8", className),
		children: [
			shownImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "absolute inset-0 bg-cover bg-center",
				style: { backgroundImage: `url(${shownImage})` }
			}) : null,
			shownImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 bg-bg/45" }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative z-10 flex items-center gap-2",
				children: [!shownImage && icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn(size === "icon" && !shownLabel ? "sr-only" : "truncate"),
					children: shownLabel
				})]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Кнопка" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Текст и картинка подстраиваются под размер кнопки." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm text-muted",
				children: "Текст"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: label,
				onChange: (e) => setLabel(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm text-muted",
				children: "Картинка"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "file",
				accept: "image/*",
				onChange: (e) => void onFile(e.target.files?.[0])
			}),
			image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-24 overflow-hidden rounded-md bg-center bg-cover shadow-[var(--shadow-border)]",
				style: { backgroundImage: `url(${image})` }
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "flex-1",
					onClick: () => {
						setButtonSkin(id, {
							label: label.trim() || defaultLabel,
							image: image || void 0
						});
						setOpen(false);
					},
					children: "Сохранить"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => {
						setButtonSkin(id, {});
						setLabel(defaultLabel);
						setImage("");
						setOpen(false);
					},
					children: "Сброс"
				})]
			})
		] })
	})] });
}
function Sidebar() {
	const open = useAppStore((s) => s.sidebarOpen);
	const mediaKind = useAppStore((s) => s.mediaKind);
	const toggleMediaKind = useAppStore((s) => s.toggleMediaKind);
	const { view, setView, openFavorites } = useFeed();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("absolute inset-y-0 left-0 z-30 flex w-64 flex-col gap-1 border-r border-border bg-elevated p-3 pt-16", "transition-transform duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]", open ? "translate-x-0" : "-translate-x-full"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "side.favorites",
				defaultLabel: "все мои избранные",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {}),
				className: "w-full justify-start",
				active: view === "favorites",
				onClick: () => openFavorites()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "side.exclusions",
				defaultLabel: "исключения",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, {}),
				className: "w-full justify-start",
				active: view === "exclusions",
				onClick: () => setView("exclusions")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "side.authors",
				defaultLabel: "любимые авторы",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {}),
				className: "w-full justify-start",
				active: view === "authors",
				onClick: () => setView("authors")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "side.tags",
				defaultLabel: "любимые теги",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {}),
				className: "w-full justify-start",
				active: view === "tags",
				onClick: () => setView("tags")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "side.motion",
				defaultLabel: mediaKind === "motion" ? "видео / gif" : "фото",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, {}),
				className: "w-full justify-start",
				active: mediaKind === "motion",
				onClick: () => {
					toggleMediaKind();
					setView("feed");
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "side.settings",
				defaultLabel: "настройки",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {}),
				className: "w-full justify-start",
				active: view === "settings",
				onClick: () => setView("settings")
			})
		]
	});
}
function Viewer() {
	const { current, loading, session, downloadCurrent } = useFeed();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-0 flex-1 items-center justify-center bg-bg",
		children: [current ? current.isMotion && current.ext !== "gif" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			className: "max-h-full max-w-full object-contain",
			src: current.sampleUrl,
			controls: true,
			autoPlay: true,
			loop: true,
			playsInline: true
		}, current.key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: current.sampleUrl,
			alt: current.tags.slice(0, 8).join(" "),
			className: "max-h-full max-w-full object-contain outline outline-1 -outline-offset-1 outline-fg/10"
		}, current.key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: loading ? "Загрузка…" : "Нет файла"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute right-3 top-3 flex gap-2",
			children: [session.mode === "playlist" && session.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden rounded-md bg-elevated/90 px-2 py-1 text-xs text-muted sm:inline",
				children: session.label
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "action.download",
				defaultLabel: "скачать",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}),
				size: "sm",
				variant: "quiet",
				className: "bg-elevated/90",
				onClick: () => void downloadCurrent()
			})]
		})]
	});
}
function MediaGrid() {
	const { grid, gridLabel, gridQuery, loading, openPlaylist, downloadGrid, loadMoreGrid, view } = useFeed();
	const likes = useAppStore((s) => s.likes);
	const posts = view === "favorites" ? likes : grid;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "truncate text-sm font-medium text-fg",
				children: gridLabel || "сетка"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "action.downloadAll",
				defaultLabel: "скачать всё",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}),
				size: "sm",
				variant: "outline",
				onClick: () => void downloadGrid()
			})]
		}), posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 text-sm text-muted",
			children: loading ? "Загрузка…" : "Пусто"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-3 pb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
				children: posts.map((post, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "group relative aspect-[3/4] overflow-hidden rounded-md bg-surface shadow-[var(--shadow-border)]",
					onClick: () => openPlaylist(posts, index, gridLabel, view === "favorites" ? [] : gridQuery, view),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: post.previewUrl,
						alt: "",
						className: "size-full object-cover outline outline-1 -outline-offset-1 outline-fg/10 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
					})
				}, post.key))
			}), view === "grid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 px-4 text-sm text-muted hover:text-fg",
					onClick: () => void loadMoreGrid(),
					children: loading ? "…" : "ещё"
				})
			}) : null]
		})]
	});
}
function FavTiles({ kind }) {
	const { runSearch } = useFeed();
	const editChrome = useAppStore((s) => s.editChrome);
	const tiles = useAppStore((s) => kind === "authors" ? s.favoriteAuthors : s.favoriteTags);
	const upsert = useAppStore((s) => kind === "authors" ? s.upsertAuthor : s.upsertTag);
	const remove = useAppStore((s) => kind === "authors" ? s.removeAuthor : s.removeTag);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [draftTag, setDraftTag] = (0, import_react.useState)("");
	const [draftLabel, setDraftLabel] = (0, import_react.useState)("");
	const [draftImage, setDraftImage] = (0, import_react.useState)("");
	function openEdit(tile) {
		setEditing(tile);
		setDraftTag(tile.tag);
		setDraftLabel(tile.label);
		setDraftImage(tile.image ?? "");
	}
	function openCreate() {
		setCreating(true);
		setEditing(null);
		setDraftTag("");
		setDraftLabel("");
		setDraftImage("");
	}
	function save() {
		const tag = draftTag.trim().toLowerCase().replace(/\s+/g, "_");
		if (!tag) return;
		upsert({
			id: editing?.id ?? tag,
			tag,
			label: draftLabel.trim() || formatTag(tag),
			image: draftImage || void 0
		});
		setEditing(null);
		setCreating(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: kind === "authors" ? "Любимые авторы" : "Любимые теги"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: openCreate,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "добавить"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-3 pb-4",
				children: tiles.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-1 text-sm text-muted",
					children: "Пока пусто. Добавьте из панели тегов."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
					children: tiles.map((tile) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "relative flex h-20 w-full items-center justify-center overflow-hidden rounded-md px-4 text-sm font-medium shadow-[var(--shadow-border)]",
							onClick: () => editChrome ? openEdit(tile) : runSearch(tile.tag, tile.label),
							children: [
								tile.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute inset-0 bg-cover bg-center",
									style: { backgroundImage: `url(${tile.image})` }
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 bg-surface" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 bg-bg/50" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "relative z-10 truncate",
									children: tile.label || formatTag(tile.tag)
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute right-1 top-1 flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "size-9 bg-bg/50",
								onClick: () => openEdit(tile),
								"aria-label": "Изменить",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "size-9 bg-bg/50",
								onClick: () => remove(tile.id),
								"aria-label": "Удалить",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
							})]
						})]
					}, tile.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(editing) || creating,
				onOpenChange: (o) => {
					if (!o) {
						setEditing(null);
						setCreating(false);
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: creating ? "Новая кнопка" : "Кнопка" }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: kind === "authors" ? "автор" : "тег",
						value: draftTag,
						onChange: (e) => setDraftTag(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "текст на кнопке",
						value: draftLabel,
						onChange: (e) => setDraftLabel(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "file",
						accept: "image/*",
						onChange: async (e) => {
							const file = e.target.files?.[0];
							if (!file) return;
							setDraftImage(await fileToSkinDataUrl(file));
						}
					}),
					draftImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-20 rounded-md bg-cover bg-center",
						style: { backgroundImage: `url(${draftImage})` }
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: save,
						children: "Сохранить"
					})
				] })
			})
		]
	});
}
function ExclusionsPanel() {
	const exclusions = useAppStore((s) => s.exclusions);
	const addExclusion = useAppStore((s) => s.addExclusion);
	const removeExclusion = useAppStore((s) => s.removeExclusion);
	const [draft, setDraft] = (0, import_react.useState)("");
	function add() {
		for (const tag of parseTagList(draft)) if (!isBlockedTag(tag)) addExclusion(tag);
		setDraft("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-medium",
				children: "Исключения"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					add();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					placeholder: "теги, которых не должно быть"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "outline",
					children: "добавить"
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "min-h-0 flex-1 overflow-y-auto px-4 pb-6",
			children: exclusions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "text-sm text-muted",
				children: "Список пуст"
			}) : exclusions.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex min-h-11 items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-sm",
					children: formatTag(tag)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-11",
					onClick: () => removeExclusion(tag),
					"aria-label": "Убрать",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
				})]
			}, tag))
		})]
	});
}
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full shadow-[var(--shadow-border)] transition-colors duration-[var(--motion-quick)]", "data-[state=checked]:bg-primary data-[state=unchecked]:bg-raised", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block size-5 rounded-full bg-fg shadow-sm transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)]", "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5", "data-[state=checked]:bg-primary-foreground") })
}));
Switch.displayName = Switch$1.displayName;
function SettingsPanel() {
	const { chooseFolder } = useFeed();
	const saveInAuthorFolders = useAppStore((s) => s.saveInAuthorFolders);
	const setSaveInAuthorFolders = useAppStore((s) => s.setSaveInAuthorFolders);
	const downloadFolderName = useAppStore((s) => s.downloadFolderName);
	const editChrome = useAppStore((s) => s.editChrome);
	const setEditChrome = useAppStore((s) => s.setEditChrome);
	const sources = useAppStore((s) => s.sources);
	const setSource = useAppStore((s) => s.setSource);
	const r34ApiKey = useAppStore((s) => s.r34ApiKey);
	const r34UserId = useAppStore((s) => s.r34UserId);
	const setR34 = useAppStore((s) => s.setR34);
	const danbooruLogin = useAppStore((s) => s.danbooruLogin);
	const danbooruApiKey = useAppStore((s) => s.danbooruApiKey);
	const setDanbooru = useAppStore((s) => s.setDanbooru);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-0 flex-1 overflow-y-auto px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-4 text-sm font-medium",
				children: "Настройки"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-wide text-subtle",
						children: "Скачивание"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: ["Папка: ", downloadFolderName || "не выбрана (браузерные загрузки)"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => void chooseFolder(),
						children: "выбрать папку"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3 text-sm",
						children: ["Подпапки автор / арты", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: saveInAuthorFolders,
							onCheckedChange: setSaveInAuthorFolders
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-wide text-subtle",
						children: "Кнопки"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3 text-sm",
						children: ["Редактировать кнопки", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: editChrome,
							onCheckedChange: setEditChrome
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Включите и нажмите любую кнопку, чтобы сменить текст или наложить фото."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-wide text-subtle",
						children: "Источники"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3 text-sm",
						children: ["Danbooru", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: sources.danbooru,
							onCheckedChange: (v) => setSource("danbooru", v)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center justify-between gap-3 text-sm",
						children: ["Rule34.xxx", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: sources.rule34,
							onCheckedChange: (v) => setSource("rule34", v)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-wide text-subtle",
						children: "Rule34 API"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Аккаунт → Options → API Access Credentials. Без ключа Rule34 недоступен."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "user id",
						value: r34UserId,
						onChange: (e) => setR34(r34ApiKey, e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "api key",
						type: "password",
						value: r34ApiKey,
						onChange: (e) => setR34(e.target.value, r34UserId)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs uppercase tracking-wide text-subtle",
						children: "Danbooru API"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Необязательно. Ключ снимает лимит в два тега."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "login",
						value: danbooruLogin,
						onChange: (e) => setDanbooru(e.target.value, danbooruApiKey)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "api key",
						type: "password",
						value: danbooruApiKey,
						onChange: (e) => setDanbooru(danbooruLogin, e.target.value)
					})
				]
			})
		]
	});
}
function TagsPanel() {
	const { current, runSearch } = useFeed();
	const setTagsOpen = useAppStore((s) => s.setTagsOpen);
	const favoriteTags = useAppStore((s) => s.favoriteTags);
	const favoriteAuthors = useAppStore((s) => s.favoriteAuthors);
	const upsertTag = useAppStore((s) => s.upsertTag);
	const upsertAuthor = useAppStore((s) => s.upsertAuthor);
	const removeTag = useAppStore((s) => s.removeTag);
	const removeAuthor = useAppStore((s) => s.removeAuthor);
	if (!current) return null;
	const artists = current.artists;
	const rest = current.tags.filter((t) => !artists.includes(t));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "absolute inset-y-0 right-0 z-30 flex w-[min(22rem,100%)] flex-col border-l border-border bg-elevated",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-14 items-center justify-between px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Теги"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: () => setTagsOpen(false),
				"aria-label": "Закрыть",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-4 pb-6",
			children: [artists.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mb-2 text-xs uppercase tracking-wide text-subtle",
					children: "Авторы"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-1",
					children: artists.map((tag) => {
						const fav = favoriteAuthors.find((t) => t.tag === tag);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-11 flex-1 truncate rounded-md px-2 text-left text-sm hover:bg-fg/6",
								onClick: () => runSearch(tag, tag),
								children: formatTag(tag)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "size-11",
								title: "В любимые авторы",
								onClick: () => fav ? removeAuthor(fav.id) : upsertAuthor({
									id: tag,
									tag,
									label: formatTag(tag),
									image: current.previewUrl
								}),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: fav ? "text-like" : "text-muted" })
							})]
						}, tag);
					})
				})]
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mb-2 text-xs uppercase tracking-wide text-subtle",
				children: "Теги"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-1",
				children: rest.map((tag) => {
					const fav = favoriteTags.find((t) => t.tag === tag);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 flex-1 truncate rounded-md px-2 text-left text-sm hover:bg-fg/6",
							onClick: () => runSearch(tag, tag),
							children: formatTag(tag)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "size-11",
							title: "В любимые теги",
							onClick: () => fav ? removeTag(fav.id) : upsertTag({
								id: tag,
								tag,
								label: formatTag(tag),
								image: current.previewUrl
							}),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: fav ? "fill-like text-like" : "text-muted" })
						})]
					}, tag);
				})
			})] })]
		})]
	});
}
function TopBar() {
	const { runSearch, setView, view } = useFeed();
	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const toggleSidebar = useAppStore((s) => s.toggleSidebar);
	const smartMode = useAppStore((s) => s.smartMode);
	const setSmartMode = useAppStore((s) => s.setSmartMode);
	const searchDraft = useAppStore((s) => s.searchDraft);
	const setSearchDraft = useAppStore((s) => s.setSearchDraft);
	const tagsOpen = useAppStore((s) => s.tagsOpen);
	const setTagsOpen = useAppStore((s) => s.setTagsOpen);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-bg px-2 sm:px-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "nav.menu",
				defaultLabel: "",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, {}),
				size: "icon",
				title: sidebarOpen ? "Скрыть панель" : "Панель",
				onClick: toggleSidebar
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				className: "min-w-0 flex-1",
				onSubmit: (e) => {
					e.preventDefault();
					runSearch(searchDraft);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: searchDraft,
					onChange: (e) => setSearchDraft(e.target.value),
					placeholder: "поиск по тегам",
					className: "h-11 bg-transparent"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "hidden items-center gap-2 text-xs text-muted sm:flex",
				children: ["подбор", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					checked: smartMode,
					onCheckedChange: setSmartMode
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "nav.tags",
				defaultLabel: "теги",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {}),
				size: "sm",
				variant: tagsOpen ? "quiet" : "ghost",
				onClick: () => {
					if (view !== "feed") setView("feed");
					setTagsOpen(!tagsOpen);
				}
			})
		]
	});
}
function BottomBar() {
	const { goBack, goNext, likeCurrent, dislikeCurrent, session, current } = useFeed();
	const likes = useAppStore((s) => s.likes);
	const liked = Boolean(current && likes.some((p) => p.key === current.key));
	const atStart = session.index <= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "z-40 flex h-16 shrink-0 items-center justify-center gap-2 border-t border-border bg-bg px-2 sm:gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "nav.back",
				defaultLabel: "назад",
				disabled: atStart,
				className: "min-w-20 flex-1 sm:flex-none sm:px-6",
				onClick: goBack
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "nav.like",
				defaultLabel: "",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: liked ? "fill-like text-like" : "" }),
				size: "icon",
				variant: "like",
				title: "лайк",
				active: liked,
				onClick: likeCurrent
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "nav.dislike",
				defaultLabel: "",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartOff, {}),
				size: "icon",
				variant: "danger",
				title: "дизлайк",
				onClick: dislikeCurrent
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChromeButton, {
				id: "nav.next",
				defaultLabel: "дальше",
				className: "min-w-20 flex-1 sm:flex-none sm:px-6",
				onClick: goNext
			})
		]
	});
}
function MainStage() {
	const { view, session, setView } = useFeed();
	const tagsOpen = useAppStore((s) => s.tagsOpen);
	let body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewer, {});
	if (view === "favorites" || view === "grid") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaGrid, {});
	if (view === "exclusions") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExclusionsPanel, {});
	if (view === "authors") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavTiles, { kind: "authors" });
	if (view === "tags") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavTiles, { kind: "tags" });
	if (view === "settings") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, {});
	const showChrome = view === "feed";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-0 min-w-0 flex-1 flex-col",
		children: [
			session.mode === "playlist" && view === "feed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute left-3 top-3 z-20 h-11 rounded-md bg-elevated/90 px-3 text-sm text-muted",
				onClick: () => setView(session.origin === "favorites" ? "favorites" : "grid"),
				children: "к сетке"
			}) : null,
			body,
			showChrome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomBar, {}) : null,
			tagsOpen && view === "feed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagsPanel, {}) : null
		]
	});
}
function Shell() {
	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
	const { goNext, goBack, likeCurrent, dislikeCurrent, setView } = useFeed();
	const setTagsOpen = useAppStore((s) => s.setTagsOpen);
	const tagsOpen = useAppStore((s) => s.tagsOpen);
	const smartMode = useAppStore((s) => s.smartMode);
	const setSmartMode = useAppStore((s) => s.setSmartMode);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.key === "ArrowRight") goNext();
			if (e.key === "ArrowLeft") goBack();
			if (e.key === "l" || e.key === "L") likeCurrent();
			if (e.key === "d" || e.key === "D") dislikeCurrent();
			if (e.key === "t" || e.key === "T") setTagsOpen(!tagsOpen);
			if (e.key === "Escape") {
				setTagsOpen(false);
				setSidebarOpen(false);
				setView("feed");
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		dislikeCurrent,
		goBack,
		goNext,
		likeCurrent,
		setSidebarOpen,
		setTagsOpen,
		setView,
		tagsOpen
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-dvh flex-col overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {}),
					sidebarOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute inset-0 z-20 bg-bg/50 md:hidden",
						"aria-label": "Закрыть панель",
						onClick: () => setSidebarOpen(false)
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainStage, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 border-t border-border px-3 py-2 sm:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: "подбор"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					checked: smartMode,
					onCheckedChange: setSmartMode
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-center"
			})
		]
	});
}
function Boot() {
	const hydrated = useAppStore((s) => s.hydrated);
	const ageOk = useAppStore((s) => s.ageOk);
	const setHydrated = useAppStore((s) => s.setHydrated);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		useAppStore.persist.rehydrate().finally(() => {
			setHydrated(true);
			setReady(true);
		});
	}, [setHydrated]);
	if (!hydrated && !ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-center justify-center bg-bg text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm tracking-[0.2em]",
			children: "KADR"
		})
	});
	if (!ageOk) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgeGate, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {}) });
}
function App() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boot, {});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {});
}
//#endregion
export { Home as component };
