import { useEffect, useState } from "react";
import type { MediaPost } from "@/lib/media/types";
import { localPathFromKey, resolveLocalPost } from "@/lib/local-media";

/**
 * Renders any post as-is, except a "local" one from persisted state (a like,
 * or the sound-videos collection) whose blob: URL died the moment last
 * session's page unloaded — that gets re-resolved to a live URL from the AI
 * folder before display. A post the random feed just picked this session is
 * already fresh, so this just returns it unchanged.
 */
export function useResolvedPost<T extends MediaPost | null>(post: T): T {
  const [resolved, setResolved] = useState<T>(post);

  useEffect(() => {
    setResolved(post);
    if (!post || post.source !== "local") return;
    const path = localPathFromKey(post.key);
    if (!path) return;
    let cancelled = false;
    void resolveLocalPost(path).then((fresh) => {
      if (!cancelled && fresh) setResolved(fresh as T);
    });
    return () => {
      cancelled = true;
    };
  }, [post]);

  return resolved;
}
