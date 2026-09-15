import type { ReactNode } from "react";
import { useMemo } from "react";
import { toast } from "sonner";
import { ClipboardCopy, ExternalLink, Heart, User, X } from "lucide-react";
import { formatTag } from "@/lib/utils";
import { useFeed } from "@/components/feed-context";
import { useAppStore } from "@/lib/store";
import { CATEGORY_LABEL, COPY_ORDER, categorizeTags } from "@/lib/media/tag-taxonomy";
import { useGenerationData } from "@/lib/use-generation-data";
import { useRule34Categories } from "@/lib/use-rule34-categories";
import { useCivitaiTags } from "@/lib/use-civitai-tags";
import type { MediaPost } from "@/lib/media/types";
import { Button } from "@/components/ui/button";

/** Splits a comma-separated prompt into individual searchable pieces — plain natural-language/tag splitting, not the param-string quote-aware kind params use. */
function splitPromptTags(prompt: string): string[] {
  return prompt
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function GenerationDataSection({ post }: { post: MediaPost }) {
  const { loading, info, resources } = useGenerationData(post);
  const { addSearchTag } = useFeed();
  const promptTags = useMemo(() => (info?.prompt ? splitPromptTags(info.prompt) : []), [info?.prompt]);

  function copyAll() {
    const text = info?.raw ?? "";
    if (!text) {
      toast.message("Нечего копировать");
      return;
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Скопировано"))
      .catch(() => toast.error("Не удалось скопировать"));
  }

  if (loading) return null;
  if (!info && !resources.length) return null;

  return (
    <section className="mb-5 rounded-md border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Generation data</h3>
        {info?.raw ? (
          <button type="button" className="text-xs text-like hover:underline" onClick={copyAll}>
            copy all
          </button>
        ) : null}
      </div>
      {info?.comfyWorkflow ? (
        <p className="mb-2 text-xs text-muted">
          Это workflow ComfyUI (JSON), единого текста промпта в нём нет — доступен только «copy all».
        </p>
      ) : null}
      {promptTags.length ? (
        <div className="mb-2">
          <div className="text-xs text-subtle">Prompt</div>
          <ul className="mt-1 flex flex-wrap gap-1">
            {promptTags.map((tag, i) => (
              <li key={`${tag}-${i}`}>
                <button
                  type="button"
                  className="rounded-md bg-fg/6 px-2 py-1 text-xs hover:bg-fg/12"
                  onClick={() => addSearchTag(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {info?.negativePrompt ? (
        <div className="mb-2">
          <div className="text-xs text-subtle">Negative prompt</div>
          <p className="text-sm">{info.negativePrompt}</p>
        </div>
      ) : null}
      {info && Object.keys(info.params).length ? (
        <p className="mb-2 text-xs text-muted">
          {Object.entries(info.params)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}
        </p>
      ) : null}
      {resources.length ? (
        <div>
          <div className="mb-1 text-xs text-subtle">Resources used</div>
          <ul className="flex flex-col gap-1">
            {resources.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-fg/6"
                >
                  <span className="truncate">
                    {r.name}
                    <span className="ml-1 text-xs text-muted">{r.version}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded bg-fg/10 px-1.5 py-0.5 text-[10px] uppercase text-muted">
                    {r.type}
                    <ExternalLink className="size-2.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function TagRow({
  tag,
  onSearch,
  onToggleFavorite,
  favoriteIcon,
}: {
  tag: string;
  onSearch: () => void;
  onToggleFavorite: () => void;
  favoriteIcon: ReactNode;
}) {
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        className="min-h-11 flex-1 truncate rounded-md px-2 text-left text-sm hover:bg-fg/6"
        onClick={onSearch}
      >
        {formatTag(tag)}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        title="В избранное"
        onClick={onToggleFavorite}
      >
        {favoriteIcon}
      </Button>
    </li>
  );
}

export function TagsPanel() {
  const { current, addSearchTag, openPixivUser } = useFeed();
  const setTagsOpen = useAppStore((s) => s.setTagsOpen);
  const favoriteTags = useAppStore((s) => s.favoriteTags);
  const favoriteAuthors = useAppStore((s) => s.favoriteAuthors);
  const upsertTag = useAppStore((s) => s.upsertTag);
  const upsertAuthor = useAppStore((s) => s.upsertAuthor);
  const removeTag = useAppStore((s) => s.removeTag);
  const removeAuthor = useAppStore((s) => s.removeAuthor);

  // Danbooru already gives real character/copyright categories; Rule34's API
  // doesn't, so its own tag-type data (when we have r34 credentials to ask
  // for it) reclassifies tags our general heuristic would otherwise catch-all.
  const rule34Categories = useRule34Categories(current);
  // Civitai's public API has no per-image tags at all (see use-civitai-tags).
  const civitaiTags = useCivitaiTags(current);
  const effectiveTags = useMemo(
    () => (current?.source === "civitai" ? civitaiTags : (current?.tags ?? [])),
    [current, civitaiTags],
  );

  const { remaining, realCharacters, realCopyright } = useMemo(() => {
    if (!Object.keys(rule34Categories).length) {
      return { remaining: effectiveTags, realCharacters: [] as string[], realCopyright: [] as string[] };
    }
    const remaining: string[] = [];
    const realCharacters: string[] = [];
    const realCopyright: string[] = [];
    for (const tag of effectiveTags) {
      const type = rule34Categories[tag];
      if (type === "character") realCharacters.push(tag);
      else if (type === "copyright") realCopyright.push(tag);
      else remaining.push(tag);
    }
    return { remaining, realCharacters, realCopyright };
  }, [effectiveTags, rule34Categories]);

  const grouped = useMemo(() => categorizeTags(remaining), [remaining]);

  if (!current) return null;

  const sections: Array<{ key: string; title: string; tags: string[]; isAuthor?: boolean }> = [
    { key: "copyright", title: "Вселенная", tags: [...current.copyright, ...realCopyright] },
    {
      key: "characters",
      title: "Персонаж",
      tags: [...current.characters, ...grouped.character, ...realCharacters],
    },
    { key: "artists", title: "Автор", tags: current.artists, isAuthor: true },
    ...COPY_ORDER.map((cat) => ({ key: cat, title: CATEGORY_LABEL[cat], tags: grouped[cat] })),
    { key: "meta", title: "Спец. теги", tags: current.meta },
  ];

  function copyTags() {
    const lines = COPY_ORDER.map((cat) => grouped![cat])
      .map((tags, i) => (tags.length ? `${CATEGORY_LABEL[COPY_ORDER[i]!]}: ${tags.map(formatTag).join(", ")}` : null))
      .filter((line): line is string => Boolean(line));
    if (!lines.length) {
      toast.message("Нет тегов для копирования");
      return;
    }
    void navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success("Теги скопированы"))
      .catch(() => toast.error("Не удалось скопировать"));
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-50 flex w-[min(22rem,100%)] flex-col border-l border-border bg-elevated">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="text-sm font-medium">Теги</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={copyTags} title="Скопировать теги по категориям">
            <ClipboardCopy />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTagsOpen(false)} aria-label="Закрыть">
            <X />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <GenerationDataSection post={current} />
        {sections.map((section) =>
          section.tags.length ? (
            <section key={section.key} className="mb-5">
              <h3 className="mb-2 text-xs uppercase tracking-wide text-subtle">{section.title}</h3>
              <ul className="flex flex-col gap-1">
                {section.tags.map((tag) => {
                  if (section.isAuthor) {
                    const fav = favoriteAuthors.find((t) => t.tag === tag);
                    const openAuthor =
                      current.source === "pixiv" && current.authorId
                        ? () => openPixivUser(current.authorId!, tag)
                        : () => addSearchTag(tag);
                    return (
                      <TagRow
                        key={tag}
                        tag={tag}
                        onSearch={openAuthor}
                        favoriteIcon={<User className={fav ? "text-like" : "text-muted"} />}
                        onToggleFavorite={() =>
                          fav
                            ? removeAuthor(fav.id)
                            : upsertAuthor({
                                id: tag,
                                tag,
                                label: formatTag(tag),
                                image: current.previewUrl,
                              })
                        }
                      />
                    );
                  }
                  const fav = favoriteTags.find((t) => t.tag === tag);
                  return (
                    <TagRow
                      key={tag}
                      tag={tag}
                      onSearch={() => addSearchTag(tag)}
                      favoriteIcon={<Heart className={fav ? "fill-like text-like" : "text-muted"} />}
                      onToggleFavorite={() =>
                        fav
                          ? removeTag(fav.id)
                          : upsertTag({
                              id: tag,
                              tag,
                              label: formatTag(tag),
                              image: current.previewUrl,
                            })
                      }
                    />
                  );
                })}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </aside>
  );
}
