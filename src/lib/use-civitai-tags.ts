import { useEffect, useState } from "react";
import type { MediaPost } from "@/lib/media/types";
import { fetchCivitaiImageTags } from "@/lib/media/civitai";
import { useAppStore } from "@/lib/store";

const cache = new Map<number, string[]>();

/** Civitai's public API has no per-image tags, and the internal endpoint that has them blocks non-browser access — usually stays empty (see civitai.ts's fetchCivitaiImageTags for why). */
export function useCivitaiTags(post: MediaPost | null): string[] {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    setTags([]);
    if (!post || post.source !== "civitai") return;
    const cookie = useAppStore.getState().civitaiCookie;
    const cached = cache.get(post.id);
    if (cached) {
      setTags(cached);
      return;
    }
    let cancelled = false;
    void fetchCivitaiImageTags({ data: { imageId: post.id, cookie } }).then((res) => {
      cache.set(post.id, res);
      if (!cancelled) setTags(res);
    });
    return () => {
      cancelled = true;
    };
  }, [post]);

  return tags;
}
