/**
 * A curated categorizer for booru tags — NOT an exhaustive index of "every
 * tag on Danbooru/Rule34" (there are hundreds of thousands, an exhaustive
 * hand-built list is not realistic). It buckets the tags a given post
 * actually has, via a sizeable keyword list plus a few pattern rules, with
 * "appearance" as the catch-all for anything unrecognized — good enough to
 * be useful on real posts, not a claim of completeness.
 */
export type TaxonomyCategory =
  | "character"
  | "appearance"
  | "accessories"
  | "clothing"
  | "pose"
  | "action"
  | "background";

export const CATEGORY_LABEL: Record<TaxonomyCategory, string> = {
  character: "Персонажи",
  appearance: "Внешний вид",
  accessories: "Аксессуары",
  clothing: "Одежда",
  pose: "Поза",
  action: "Действие",
  background: "Задний фон",
};

/** The order the "copy tags" button writes categories in (character is deliberately left out — see feed-context's copyPostTags). */
export const COPY_ORDER: TaxonomyCategory[] = [
  "appearance",
  "accessories",
  "clothing",
  "pose",
  "action",
  "background",
];

const CHARACTER_WORDS = new Set([
  "1girl", "2girls", "3girls", "4girls", "5girls", "6+girls", "multiple_girls",
  "1boy", "2boys", "3boys", "4boys", "5boys", "6+boys", "multiple_boys",
  "1other", "2others", "multiple_others",
  "solo", "solo_focus", "duo", "trio", "group",
  "futanari", "futa_only", "futa_with_female", "futa_with_male", "futa_with_futa",
  "yuri", "yaoi", "straight", "hetero",
  "trap", "otoko_no_ko", "crossdressing",
  "age_difference", "height_difference",
  "mother_and_daughter", "father_and_daughter", "sisters", "brother_and_sister",
  "twins", "siblings", "incest",
  "human", "humanoid", "furry", "anthro", "kemonomimi",
  "monster_girl", "monster_boy", "monster",
  "elf", "dark_elf", "succubus", "demon_girl", "demon_boy", "angel",
  "android", "robot", "gynoid",
  "loli_body", "shota_body",
  "milf", "dilf", "mature_female", "mature_male",
  "younger", "older",
]);

const APPEARANCE_PATTERNS: RegExp[] = [
  /_(hair|eyes|skin|bangs|braid|braids|ponytail|twintails|ahoge|sidelocks)$/,
  /^(hair|eye)_/,
  /_(breasts|boobs|chest|nipples|areola|areolae)$/,
  /_(ass|butt|thighs|hips|waist|belly|navel|abs|muscle|muscular)$/,
  /_(body|skinned|complexion)$/,
  /_(penis|testicles|pussy|clitoris|labia|anus)$/,
];
const APPEARANCE_WORDS = new Set([
  "huge_breasts", "large_breasts", "medium_breasts", "small_breasts", "flat_chest",
  "big_ass", "huge_ass", "thick_thighs", "wide_hips", "curvy",
  "petite", "slim", "slender", "chubby", "plump", "fat", "bbw",
  "tall", "short", "dark_skin", "pale_skin", "tan", "tanline", "tanlines",
  "blue_eyes", "red_eyes", "green_eyes", "purple_eyes", "yellow_eyes", "heterochromia",
  "blonde_hair", "black_hair", "brown_hair", "white_hair", "silver_hair",
  "pink_hair", "blue_hair", "green_hair", "purple_hair", "red_hair", "multicolored_hair",
  "long_hair", "short_hair", "very_long_hair", "medium_hair",
  "twintails", "ponytail", "braid", "drill_hair", "messy_hair", "curly_hair", "straight_hair",
  "huge_penis", "erection", "testicles", "pubic_hair", "shaved_pussy",
  "wet", "sweat", "blush", "tears", "crying", "saliva", "drooling",
  "muscular", "abs", "toned", "six_pack",
  "horns", "tail", "wings", "pointy_ears", "animal_ears", "cat_ears_(anatomy)",
  "scar", "freckles", "mole", "beauty_mark", "makeup", "lipstick",
  "smile", "grin", "smirk", "expressionless", "angry", "scared", "embarrassed",
  "open_mouth", "closed_mouth", "tongue_out", "fang", "fangs",
]);

const ACCESSORY_WORDS = new Set([
  "cat_ears", "cat_tail", "fox_ears", "fox_tail", "wolf_ears", "wolf_tail",
  "animal_ear_fluff", "tail_ornament",
  "collar", "leash", "choker", "necklace", "pendant",
  "earrings", "piercing", "nose_piercing", "navel_piercing",
  "glasses", "sunglasses", "eyewear", "monocle", "eyepatch",
  "hat", "cap", "beret", "witch_hat", "party_hat", "headwear",
  "hairband", "hair_ribbon", "hair_bow", "hair_ornament", "hairclip", "hair_flower",
  "crown", "tiara", "headband", "veil", "hood",
  "ribbon", "bow", "bowtie",
  "gloves", "fingerless_gloves", "mittens",
  "bracelet", "anklet", "armlet", "wristband",
  "ring", "wedding_ring",
  "mask", "face_mask", "blindfold", "gag", "ball_gag",
  "handcuffs", "shackles", "rope", "bondage", "chain", "chains",
  "belt", "harness",
  "wings_(accessory)", "halo",
  "umbrella", "fan", "cane", "staff", "wand",
  "bag", "backpack", "purse",
  "piercings", "jewelry", "accessory", "accessories",
]);

const CLOTHING_WORDS = new Set([
  "dress", "sundress", "gown", "wedding_dress",
  "skirt", "miniskirt", "pleated_skirt", "skirt_lift",
  "shirt", "t-shirt", "blouse", "crop_top", "tank_top", "sweater", "hoodie", "cardigan",
  "jacket", "coat", "trench_coat", "blazer", "vest",
  "pants", "jeans", "shorts", "leggings",
  "pantyhose", "thighhighs", "kneehighs", "stockings", "socks", "leg_warmers",
  "bra", "panties", "underwear", "lingerie", "bikini", "swimsuit", "one-piece_swimsuit",
  "school_uniform", "sailor_collar", "serafuku", "gym_uniform", "track_suit",
  "maid", "maid_headdress", "nurse", "nurse_cap",
  "kimono", "yukata", "cheongsam", "qipao",
  "suit", "necktie", "bowtie_(clothing)",
  "apron", "overalls",
  "boots", "high_heels", "sandals", "sneakers", "shoes", "barefoot",
  "gloves_(clothing)", "long_gloves", "elbow_gloves",
  "naked", "nude", "topless", "bottomless", "clothed", "half-dressed",
  "off_shoulder", "bare_shoulders", "midriff", "cleavage",
  "wet_clothes", "torn_clothes", "see-through",
  "latex", "leather", "spandex",
  "cape", "cloak", "robe",
  "helmet", "armor",
  "bodysuit", "catsuit",
  "garter_belt", "garter_straps",
]);

const POSE_WORDS = new Set([
  "standing", "sitting", "kneeling", "lying", "on_back", "on_side", "on_stomach",
  "squatting", "crouching", "bent_over", "all_fours",
  "arm_up", "arms_up", "arms_behind_back", "arms_behind_head", "hand_on_hip",
  "hand_on_own_chest", "hands_on_own_face", "crossed_arms", "crossed_legs",
  "spread_legs", "legs_up", "leg_lift", "leg_up",
  "looking_at_viewer", "looking_back", "looking_away", "looking_down", "looking_up",
  "from_behind", "from_above", "from_below", "from_side",
  "profile", "full_body", "upper_body", "lower_body", "cowboy_shot", "close-up", "portrait",
  "dynamic_pose", "action_pose", "walking", "running", "jumping", "flying", "floating",
  "reclining", "straddling", "presenting",
  "back_arched", "arched_back",
  "v_arms", "peace_sign", "finger_to_mouth",
  "on_one_knee", "seiza", "yokozuwari", "wariza",
]);
const POSE_PATTERNS: RegExp[] = [
  /^hands?_on_/, /^legs?_/, /^arms?_/, /_together$/, /_apart$/, /_crossed$/,
];

const ACTION_WORDS = new Set([
  "sex", "vaginal", "anal", "oral", "fellatio", "cunnilingus", "paizuri", "footjob", "handjob",
  "masturbation", "fingering", "penetration", "double_penetration",
  "ejaculation", "cum", "cumshot", "cum_in_pussy", "cum_on_body", "cum_on_breasts", "cum_on_face",
  "creampie", "bukkake", "facial",
  "lactation", "breast_milk", "milking",
  "kissing", "french_kiss", "deepthroat",
  "group_sex", "threesome", "orgy", "gangbang",
  "rape", "netorare", "cheating",
  "bondage", "bdsm", "spanking", "whipping", "tickling",
  "impregnation", "pregnant_sex",
  "squirting", "orgasm", "post-orgasm",
  "grinding", "dry_humping", "frottage",
  "breast_grab", "ass_grab", "groping",
  "undressing", "stripping",
  "eye_contact", "hug", "hugging", "carrying", "piggyback",
  "fighting", "battle", "combat",
  "eating", "drinking", "smoking",
  "bathing", "showering", "swimming",
  "sleeping", "dreaming",
  "dancing", "singing", "playing_instrument",
  "reading", "writing", "drawing",
  "transformation", "size_difference_play",
]);

const BACKGROUND_WORDS = new Set([
  "beach", "ocean", "sea", "lake", "river", "waterfall", "pool", "poolside",
  "bedroom", "bathroom", "kitchen", "living_room", "classroom", "school",
  "office", "library", "hospital", "shrine", "temple", "church",
  "forest", "jungle", "desert", "mountain", "cave", "field", "meadow", "garden", "park",
  "city", "street", "alley", "rooftop", "balcony", "cityscape", "skyline",
  "castle", "dungeon", "ruins", "throne_room",
  "space", "outer_space", "spaceship", "planet", "stars", "starry_sky",
  "sky", "clouds", "sunset", "sunrise", "night", "day", "moonlight", "moon",
  "snow", "winter", "rain", "storm", "lightning",
  "indoors", "outdoors",
  "simple_background", "white_background", "black_background", "gradient_background",
  "abstract_background", "transparent_background",
  "bed", "sofa", "couch", "chair", "table", "desk", "window", "door", "wall", "floor",
  "car", "train", "bus", "airplane", "boat", "ship",
  "festival", "carnival", "concert", "stage",
  "underwater", "sky_background", "cafe", "restaurant", "bar", "club",
]);
const BACKGROUND_PATTERNS: RegExp[] = [/_background$/];

function categorizeOne(tag: string): TaxonomyCategory {
  const t = tag.toLowerCase();
  if (CHARACTER_WORDS.has(t)) return "character";
  if (ACCESSORY_WORDS.has(t)) return "accessories";
  if (CLOTHING_WORDS.has(t)) return "clothing";
  if (POSE_WORDS.has(t)) return "pose";
  if (POSE_PATTERNS.some((re) => re.test(t))) return "pose";
  if (ACTION_WORDS.has(t)) return "action";
  if (BACKGROUND_WORDS.has(t)) return "background";
  if (BACKGROUND_PATTERNS.some((re) => re.test(t))) return "background";
  if (APPEARANCE_WORDS.has(t)) return "appearance";
  if (APPEARANCE_PATTERNS.some((re) => re.test(t))) return "appearance";
  // Named characters already come from Danbooru's own tag_string_character
  // field (shown separately) — a "word_(qualifier)" pattern here is just as
  // often a disambiguated object ("orange_(fruit)") as a character binding,
  // so guessing "character" from shape alone did more harm than good.
  return "appearance";
}

/** Buckets a post's general tags (Danbooru's tag_string_general, Rule34's heuristic split) into the 7 groups. */
export function categorizeTags(tags: string[]): Record<TaxonomyCategory, string[]> {
  const out: Record<TaxonomyCategory, string[]> = {
    character: [],
    appearance: [],
    accessories: [],
    clothing: [],
    pose: [],
    action: [],
    background: [],
  };
  for (const tag of tags) out[categorizeOne(tag)].push(tag);
  return out;
}
