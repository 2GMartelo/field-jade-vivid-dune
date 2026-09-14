//#region node_modules/.nitro/vite/services/ssr/assets/safety-CmhH5s0R.js
var BLOCKED_TOKENS = /* @__PURE__ */ new Set([
	"loli",
	"lolicon",
	"lolicons",
	"shota",
	"shotacon",
	"shotacons",
	"toddlercon",
	"toddlercons",
	"child",
	"children",
	"childs",
	"infant",
	"infants",
	"baby",
	"toddler",
	"toddlers",
	"underage",
	"underaged",
	"preteen",
	"preteens",
	"cub",
	"cubs",
	"kid",
	"kids",
	"kindergartner",
	"kindergartener"
]);
var BLOCKED_FRAGMENTS = [
	"loli",
	"shota",
	"lolicon",
	"shotacon",
	"toddlercon",
	"underage",
	"under_age",
	"child_porn",
	"young_child"
];
function normalizeTag(tag) {
	return tag.toLowerCase().trim().replace(/-/g, "_").replace(/\s+/g, "_");
}
function isBlockedTag(tag) {
	const t = normalizeTag(tag);
	if (!t) return false;
	if (BLOCKED_FRAGMENTS.some((frag) => t.includes(frag))) return true;
	return t.split("_").some((token) => BLOCKED_TOKENS.has(token));
}
function filterBlockedTags(tags) {
	return tags.filter((tag) => !isBlockedTag(tag));
}
function postHasBlockedTag(tags) {
	return tags.some(isBlockedTag);
}
//#endregion
export { isBlockedTag as n, postHasBlockedTag as r, filterBlockedTags as t };
