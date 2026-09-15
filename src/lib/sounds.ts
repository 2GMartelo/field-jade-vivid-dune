import { ensurePermission, loadSoundsDirHandle } from "@/lib/fs-save";

const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "webm", "aac", "flac"]);

function isAudioFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return Boolean(ext && AUDIO_EXT.has(ext));
}

async function collectAudioFiles(dir: FileSystemDirectoryHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const [name, handle] of dir as unknown as AsyncIterable<
    [string, FileSystemDirectoryHandle | FileSystemFileHandle]
  >) {
    if (handle.kind === "file" && isAudioFile(name)) {
      files.push(await (handle as FileSystemFileHandle).getFile());
    }
  }
  return files;
}

let cache: { urls: string[] } | null = null;

/** Loads (and memoizes for this session) object URLs for every audio file in the sounds folder. */
async function getSoundUrls(): Promise<string[]> {
  if (cache) return cache.urls;
  const handle = await loadSoundsDirHandle();
  if (!handle || !(await ensurePermission(handle))) {
    cache = { urls: [] };
    return cache.urls;
  }
  const files = await collectAudioFiles(handle);
  cache = { urls: files.map((f) => URL.createObjectURL(f)) };
  return cache.urls;
}

/** Forces the next getSoundUrls()/playRandomLikeSound() call to re-scan the folder. */
export function invalidateSoundsCache() {
  cache = null;
}

export async function countSoundFiles(): Promise<number> {
  return (await getSoundUrls()).length;
}

export async function playRandomLikeSound() {
  try {
    const urls = await getSoundUrls();
    if (!urls.length) return;
    const url = urls[Math.floor(Math.random() * urls.length)]!;
    const audio = new Audio(url);
    audio.volume = 0.8;
    await audio.play();
  } catch {
    // Autoplay can be blocked before the first user gesture, or the folder
    // permission can lapse — a missed like-sound should never break liking.
  }
}
