//#region node_modules/.nitro/vite/services/ssr/assets/hosts-C3nIU59c.js
var HOST_SUFFIXES = [".donmai.us", ".rule34.xxx"];
var HOST_EXACT = /* @__PURE__ */ new Set([
	"danbooru.donmai.us",
	"cdn.donmai.us",
	"rule34.xxx",
	"api.rule34.xxx"
]);
function isPrivateHostname(hostname) {
	if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
	if (hostname === "0.0.0.0" || hostname === "::1") return true;
	if (/^127\./.test(hostname) || /^10\./.test(hostname)) return true;
	if (/^192\.168\./.test(hostname) || /^169\.254\./.test(hostname)) return true;
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
	return false;
}
function isAllowedMediaUrl(raw) {
	let url;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	if (url.protocol !== "https:") return null;
	const host = url.hostname.toLowerCase();
	if (isPrivateHostname(host)) return null;
	if (HOST_EXACT.has(host)) return url;
	if (HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return url;
	return null;
}
function proxiedMediaUrl(url, downloadName) {
	const params = new URLSearchParams({ url });
	if (downloadName) params.set("download", downloadName);
	return `/api/media?${params.toString()}`;
}
//#endregion
export { proxiedMediaUrl as n, isAllowedMediaUrl as t };
