import { createFileRoute } from "@tanstack/react-router";
import { isAllowedMediaUrl } from "@/lib/media/hosts";

const UA = "Kadr/1.0 (personal gallery; +https://grok.com)";

function refererFor(url: URL) {
  if (url.hostname.endsWith("donmai.us")) return "https://danbooru.donmai.us/";
  if (url.hostname.endsWith("rule34.xxx")) return "https://rule34.xxx/";
  return undefined;
}

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const incoming = new URL(request.url);
        const raw = incoming.searchParams.get("url") ?? "";
        const download = incoming.searchParams.get("download");
        const target = isAllowedMediaUrl(raw);
        if (!target) {
          return new Response("forbidden", { status: 400 });
        }
        const headers: Record<string, string> = {
          "User-Agent": UA,
          Accept: "image/*,video/*,*/*",
        };
        const referer = refererFor(target);
        if (referer) headers.Referer = referer;
        const range = request.headers.get("range");
        if (range) headers.Range = range;
        let upstream: Response;
        try {
          upstream = await fetch(target, {
            headers,
            signal: AbortSignal.timeout(25000),
            redirect: "follow",
          });
        } catch {
          return new Response("upstream failed", { status: 502 });
        }
        if (!upstream.ok && upstream.status !== 206) {
          return new Response("upstream error", { status: upstream.status });
        }
        const out = new Headers();
        const type = upstream.headers.get("content-type") ?? "application/octet-stream";
        out.set("content-type", type);
        const length = upstream.headers.get("content-length");
        if (length) out.set("content-length", length);
        const cr = upstream.headers.get("content-range");
        if (cr) out.set("content-range", cr);
        const acceptRanges = upstream.headers.get("accept-ranges");
        if (acceptRanges) out.set("accept-ranges", acceptRanges);
        out.set("cache-control", "public, max-age=86400");
        if (download) {
          const safe = download.replace(/[^\w.\-]+/g, "_").slice(0, 120);
          out.set("content-disposition", `attachment; filename="${safe}"`);
        }
        return new Response(upstream.body, {
          status: upstream.status,
          headers: out,
        });
      },
    },
  },
});
