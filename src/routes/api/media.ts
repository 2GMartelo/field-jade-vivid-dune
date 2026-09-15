import { createFileRoute } from "@tanstack/react-router";
import { isAllowedMediaUrl } from "@/lib/media/hosts";
import { proxyAwareFetch } from "@/lib/media/http.server";

// A real browser UA for every proxied media fetch — this is a personal
// gallery app, not a bot, and several hosts (Pixiv's image CDN checks this
// specifically, not just Referer) are pickier about a plain custom UA.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function refererFor(url: URL) {
  if (url.hostname.endsWith("donmai.us")) return "https://danbooru.donmai.us/";
  if (url.hostname.endsWith("rule34.xxx")) return "https://rule34.xxx/";
  if (url.hostname.endsWith("pximg.net") || url.hostname === "www.pixiv.net") {
    return "https://www.pixiv.net/";
  }
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
          upstream = await proxyAwareFetch(target.toString(), {
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
