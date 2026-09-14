import { sanitizeFilename } from "@/lib/utils";
import type { MediaPost } from "@/lib/media/types";

const DB_NAME = "kadr-fs";
const STORE = "handles";
const KEY = "download-dir";

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

export async function saveDirHandle(handle: FileSystemDirectoryHandle) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    const handle = await new Promise<FileSystemDirectoryHandle | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined);
        req.onerror = () => reject(req.error);
      },
    );
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function ensurePermission(handle: FileSystemDirectoryHandle) {
  const h = handle as FileSystemDirectoryHandle & {
    queryPermission?: (d: { mode: "readwrite" }) => Promise<PermissionState>;
    requestPermission?: (d: { mode: "readwrite" }) => Promise<PermissionState>;
  };
  try {
    const query = h.queryPermission ? await h.queryPermission({ mode: "readwrite" }) : "granted";
    if (query === "granted") return true;
    const next = h.requestPermission
      ? await h.requestPermission({ mode: "readwrite" })
      : "granted";
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

export async function pickDirectory() {
  const w = window as Window & {
    showDirectoryPicker?: (opts?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  };
  if (!w.showDirectoryPicker) {
    throw new Error("folder-unsupported");
  }
  return w.showDirectoryPicker({ mode: "readwrite" });
}
