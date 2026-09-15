import { sanitizeFilename } from "@/lib/utils";
import type { MediaPost } from "@/lib/media/types";

const DB_NAME = "kadr-fs";
const STORE = "handles";
const DOWNLOAD_KEY = "download-dir";
export const SOUNDS_KEY = "sounds-dir";
export const AI_FOLDER_KEY = "ai-dir";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandle(key: string, handle: FileSystemDirectoryHandle) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    const handle = await new Promise<FileSystemDirectoryHandle | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined);
        req.onerror = () => reject(req.error);
      },
    );
    return handle ?? null;
  } catch {
    return null;
  }
}

export const saveDirHandle = (handle: FileSystemDirectoryHandle) => saveHandle(DOWNLOAD_KEY, handle);
export const loadDirHandle = () => loadHandle(DOWNLOAD_KEY);
export const saveSoundsDirHandle = (handle: FileSystemDirectoryHandle) => saveHandle(SOUNDS_KEY, handle);
export const loadSoundsDirHandle = () => loadHandle(SOUNDS_KEY);
export const saveAiDirHandle = (handle: FileSystemDirectoryHandle) => saveHandle(AI_FOLDER_KEY, handle);
export const loadAiDirHandle = () => loadHandle(AI_FOLDER_KEY);

/** Forgets every saved folder (download/sounds/AI) for a full app reset — clears the store, doesn't delete the whole IndexedDB database (avoids blocking on any connection a caller above forgot to close). */
export async function clearAllHandles() {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function ensurePermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "readwrite",
) {
  const h = handle as FileSystemDirectoryHandle & {
    queryPermission?: (d: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
    requestPermission?: (d: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  };
  try {
    const query = h.queryPermission ? await h.queryPermission({ mode }) : "granted";
    if (query === "granted") return true;
    const next = h.requestPermission ? await h.requestPermission({ mode }) : "granted";
    return next === "granted";
  } catch {
    return false;
  }
}

export function postFilename(post: MediaPost) {
  return sanitizeFilename(`${post.source}-${post.id}.${post.ext}`);
}

export async function fetchPostBlob(post: MediaPost) {
  const res = await fetch(post.fileUrl);
  if (!res.ok) throw new Error("download failed");
  return res.blob();
}

export async function savePostToDirectory(
  root: FileSystemDirectoryHandle,
  post: MediaPost,
  subfolders: boolean,
) {
  let dir = root;
  if (subfolders) {
    const author = sanitizeFilename(post.artists[0] || "unknown");
    dir = await root.getDirectoryHandle(author, { create: true });
  }
  const name = postFilename(post);
  const file = await dir.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  const blob = await fetchPostBlob(post);
  await writable.write(blob);
  await writable.close();
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function pickDirectory(mode: "read" | "readwrite" = "readwrite") {
  const w = window as Window & {
    showDirectoryPicker?: (opts?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  };
  if (!w.showDirectoryPicker) {
    throw new Error("folder-unsupported");
  }
  return w.showDirectoryPicker({ mode });
}
