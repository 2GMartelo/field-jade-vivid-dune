export type CookieEntry = { domain: string; name: string; value: string };

/**
 * Parses a Netscape-format cookies.txt (what "export cookies" browser
 * extensions produce) — tab-separated
 * `domain \t includeSubdomains \t path \t secure \t expiry \t name \t value`,
 * `#`-prefixed lines are comments except the `#HttpOnly_<domain>...`
 * convention some exporters use for httpOnly cookies.
 */
export function parseNetscapeCookies(text: string): CookieEntry[] {
  const out: CookieEntry[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      if (!line.startsWith("#HttpOnly_")) continue;
      line = line.slice("#HttpOnly_".length);
    }
    const cols = line.split("\t");
    if (cols.length < 7) continue;
    const [domain, , , , , name, value] = cols;
    if (!name) continue;
    out.push({ domain: domain ?? "", name, value: value ?? "" });
  }
  return out;
}

/** Every parsed cookie joined into one `Cookie:` header value. */
export function toCookieHeader(entries: CookieEntry[]): string {
  return entries.map((e) => `${e.name}=${e.value}`).join("; ");
}
