import { useEffect, useState } from "react";
import type { MediaPost } from "@/lib/media/types";
import { fetchRule34TagTypes } from "@/lib/media/rule34-tags";
import { useAppStore } from "@/lib/store";

/** tag -> "character" | "copyright" | "artist" | "meta" | "general", resolved from Rule34's own tag-type data for the given post's tags (Danbooru already has real categories; this fills the same gap for Rule34). */
export function useRule34Categories(post: MediaPost | null): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setMap({});
    if (!post || post.source !== "rule34") return;
    const tags = [...post.tags, ...post.meta];
    if (!tags.length) return;
    const { r34ApiKey, r34UserId } = useAppStore.getState();
    if (!r34ApiKey || !r34UserId) return;
    let cancelled = false;
    void fetchRule34TagTypes({ data: { tags, apiKey: r34ApiKey, userId: r34UserId } }).then((res) => {
      if (!cancelled) setMap(res);
    });
    return () => {
      cancelled = true;
    };
  }, [post]);

  return map;
}
