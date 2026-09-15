import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from "undici";

/**
 * Node's global `fetch` never looks at HTTP_PROXY/HTTPS_PROXY or a Windows
 * VPN app's system proxy — only real browsers do. Danbooru/Rule34 requests
 * run server-side (here and in routes/api/media.ts), so when the user's VPN
 * only shows up as a system/env proxy (not a full tunnel that already
 * reroutes every process transparently), our own fetch needs to be told
 * about it explicitly via undici's dispatcher.
 */
function proxyUrl(): string | undefined {
  const v =
    process.env.KADR_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy;
  return v && v.trim() ? v.trim() : undefined;
}

let dispatcher: Dispatcher | undefined;

function getDispatcher(): Dispatcher {
  dispatcher ??= (() => {
    const proxy = proxyUrl();
    return proxy ? new ProxyAgent(proxy) : new Agent();
  })();
  return dispatcher;
}

/** fetch() that routes through HTTP(S)_PROXY / KADR_PROXY when one is set. */
export function proxyAwareFetch(url: string, init: Record<string, unknown> = {}) {
  return undiciFetch(url, { ...init, dispatcher: getDispatcher() }) as unknown as Promise<Response>;
}
