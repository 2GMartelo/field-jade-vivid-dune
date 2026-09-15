import { useEffect, useState } from "react";
import type { CivitaiResource, MediaPost } from "@/lib/media/types";
import { parsePngGenerationInfo, type GenerationInfo } from "@/lib/media/png-generation-info";
import { getLocalFileBytes, localPathFromKey } from "@/lib/local-media";
import { fetchCivitaiResources } from "@/lib/media/civitai";

export type GenerationData = {
  loading: boolean;
  info: GenerationInfo | null;
  resources: CivitaiResource[];
};

const EMPTY: GenerationData = { loading: false, info: null, resources: [] };
const resourceCache = new Map<string, CivitaiResource[]>();

/**
 * "PNG Info"-style generation data for the post currently shown: an
 * embedded A1111/Forge "parameters" text chunk for a local PNG (or, best
 * effort, any PNG post at all — see parsePngGenerationInfo's own limits),
 * plus Civitai's "Resources used" (checkpoint/LoRA) links when the post
 * came from Civitai. Both are resolved lazily, only for whichever post is
 * open right now, not for every grid thumbnail.
 */
export function useGenerationData(post: MediaPost | null): GenerationData {
  const [state, setState] = useState<GenerationData>(EMPTY);

  useEffect(() => {
    if (!post) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState({ loading: true, info: null, resources: [] });

    async function run() {
      let info: GenerationInfo | null = null;
      let resources: CivitaiResource[] = [];

      if (post!.ext === "png") {
        try {
          const localPath = localPathFromKey(post!.key);
          const bytes = localPath
            ? await getLocalFileBytes(localPath)
            : new Uint8Array(await (await fetch(post!.fileUrl)).arrayBuffer());
          if (bytes) info = parsePngGenerationInfo(bytes);
        } catch {
          // Best-effort — a network post's file often has no embedded text
          // chunk at all (re-encoded by the host site), which isn't an error.
        }
      }

      if (post!.source === "civitai" && post!.civitaiVersionIds?.length) {
        const cacheKey = post!.civitaiVersionIds.join(",");
        const cached = resourceCache.get(cacheKey);
        if (cached) {
          resources = cached;
        } else {
          try {
            resources = await fetchCivitaiResources({ data: { versionIds: post!.civitaiVersionIds } });
            resourceCache.set(cacheKey, resources);
          } catch {
            resources = [];
          }
        }
      }

      if (!cancelled) setState({ loading: false, info, resources });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [post]);

  return state;
}
