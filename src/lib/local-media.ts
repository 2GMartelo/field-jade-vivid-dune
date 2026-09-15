import { ensurePermission, loadAiDirHandle } from "@/lib/fs-save";
import type { MediaPost } from "@/lib/media/types";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);
const VIDEO_EXT = new Set(["mp4", "webm"]);

type LocalEntry = { path: string; handle: FileSystemFileHandle };

let cachedRoot: FileSystemDirectoryHandle | null = null;
let cachedEntries: LocalEntry[] | null = null;
let entriesPromise: Promise<LocalEntry[]> | null = null;
let urlCache = new Map<string, string>();
// loadAiDirHandle() deserializes a *new* FileSystemDirectoryHandle wrapper
// from IndexedDB on every call, even for "the same" underlying folder — so
// caching entries by `=== root` only ever hit once per handle instance.
// A grid of N liked local posts calling getReadyAiFolder() independently
// (once per tile) got N different handle instances and N full re-scans of
// the whole folder in parallel; several would lose that race or hit
// permission-check contention and silently end up with no post at all.
// Caching the resolved handle itself (and de-duping concurrent lookups)
// fixes both the wasted rescans and the flaky failures.
let folderHandle: FileSystemDirectoryHandle | null = null;
let folderPromise: Promise<FileSystemDirectoryHandle | null> | null = null;

function extOf(name: string) {
  return (name.split(".").pop() ?? "").toLowerCase();
}

async function walk(dir: FileSystemDirectoryHandle, prefix: string, out: LocalEntry[]) {
  for await (const [name, handle] of dir as unknown as AsyncIterable<
    [string, FileSystemDirectoryHandle | FileSystemFileHandle]
  >) {
    if (handle.kind === "directory") {
      await walk(handle as FileSystemDirectoryHandle, `${prefix}${name}/`, out);
    } else if (IMAGE_EXT.has(extOf(name)) || VIDEO_EXT.has(extOf(name))) {
      out.push({ path: `${prefix}${name}`, handle: handle as FileSystemFileHandle });
    }
  }
}

/** Drops the cached folder handle, file list, and every object URL made from it — call when the user picks a (possibly different) AI folder. */
export function invalidateLocalCache() {
  cachedRoot = null;
  cachedEntries = null;
  entriesPromise = null;
  folderHandle = null;
  folderPromise = null;
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache = new Map();
}

async function ensureEntries(root: FileSystemDirectoryHandle): Promise<LocalEntry[]> {
  if (cachedRoot === root && cachedEntries) return cachedEntries;
  if (cachedRoot === root && entriesPromise) return entriesPromise;
  cachedRoot = root;
  cachedEntries = null;
  entriesPromise = (async () => {
    const out: LocalEntry[] = [];
    await walk(root, "", out);
    cachedEntries = out;
    return out;
  })();
  return entriesPromise;
}

/** Small stable hash so the same file gets the same MediaPost.id across scans. */
function hashId(path: string): number {
  let h = 0;
  for (let i = 0; i < path.length; i++) h = (Math.imul(h, 31) + path.charCodeAt(i)) | 0;
  return Math.abs(h);
}

async function toPost(entry: LocalEntry): Promise<MediaPost> {
  let url = urlCache.get(entry.path);
  if (!url) {
    const file = await entry.handle.getFile();
    url = URL.createObjectURL(file);
    urlCache.set(entry.path, url);
  }
  const ext = extOf(entry.path);
  return {
    key: `local:${entry.path}`,
    source: "local",
    id: hashId(entry.path),
    fileUrl: url,
    sampleUrl: url,
    previewUrl: url,
    ext,
    width: 0,
    height: 0,
    tags: [],
    artists: [],
    characters: [],
    copyright: [],
    meta: [],
    score: 0,
    favCount: 0,
    rating: "",
    isMotion: VIDEO_EXT.has(ext) || ext === "gif",
  };
}

/** The saved AI-art folder, if its permission is still granted — resolved once and reused, not re-read from IndexedDB and re-permission-checked on every call. */
export async function getReadyAiFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (folderHandle) return folderHandle;
  if (!folderPromise) {
    folderPromise = (async () => {
      const handle = await loadAiDirHandle();
      if (!handle || !(await ensurePermission(handle, "read"))) return null;
      folderHandle = handle;
      return handle;
    })().finally(() => {
      folderPromise = null;
    });
  }
  return folderPromise;
}

export async function countLocalFiles(root: FileSystemDirectoryHandle): Promise<number> {
  return (await ensureEntries(root)).length;
}

/** A random file from the folder (and its subfolders), skipping `exclude` keys when possible. */
export async function getRandomLocalPost(
  root: FileSystemDirectoryHandle,
  exclude: Set<string>,
): Promise<MediaPost | null> {
  const entries = await ensureEntries(root);
  if (!entries.length) return null;
  const pool = entries.filter((e) => !exclude.has(`local:${e.path}`));
  const list = pool.length ? pool : entries;
  const pick = list[Math.floor(Math.random() * list.length)]!;
  return toPost(pick);
}

/** The relative path a local MediaPost's key was built from ("local:<path>"), or null for any other source. */
export function localPathFromKey(key: string): string | null {
  return key.startsWith("local:") ? key.slice(6) : null;
}

/**
 * Re-resolves one local file to a *fresh* MediaPost with a live blob: URL.
 * A blob: URL only lives as long as the page that created it — a post
 * liked in an earlier session (persisted to `likes`/`soundVideos` as plain
 * JSON) still carries yesterday's now-dead URL after a reload, while a post
 * the random feed just picked this session is already fresh. Callers
 * rendering a possibly-persisted local post should always resolve through
 * this rather than trust its stored urls.
 */
export async function resolveLocalPost(path: string): Promise<MediaPost | null> {
  const root = await getReadyAiFolder();
  if (!root) return null;
  const entries = await ensureEntries(root);
  const entry = entries.find((e) => e.path === path);
  if (!entry) return null;
  return toPost(entry);
}

/** Raw bytes of one local file, for reading its embedded PNG generation info. */
export async function getLocalFileBytes(path: string): Promise<Uint8Array | null> {
  const root = await getReadyAiFolder();
  if (!root) return null;
  const entries = await ensureEntries(root);
  const entry = entries.find((e) => e.path === path);
  if (!entry) return null;
  const file = await entry.handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}
