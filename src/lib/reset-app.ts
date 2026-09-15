import { clearAllHandles } from "@/lib/fs-save";

const STORE_KEY = "kadr-store";

/**
 * Full factory reset: every persisted setting (Pixiv/Civitai cookies,
 * Rule34/Danbooru API keys, PIN, likes, dislikes, exclusions, favorite
 * tags/authors, button skins, sort/columns, sound settings) plus the saved
 * download/sounds/AI folder handles — back to a fresh install. Local-only,
 * nothing synced anywhere else, so there's nothing to undo but re-entering
 * it all by hand.
 */
export async function resetApp() {
  localStorage.removeItem(STORE_KEY);
  try {
    await clearAllHandles();
  } catch {
    // Best-effort — a fresh localStorage alone already gets the app back to
    // its default state on reload even if the folder-handle store failed.
  }
  window.location.reload();
}
