import { Heart, User, X } from "lucide-react";
import { formatTag } from "@/lib/utils";
import { useFeed } from "@/components/feed-context";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function TagsPanel() {
  const { current, runSearch } = useFeed();
  const setTagsOpen = useAppStore((s) => s.setTagsOpen);
  const favoriteTags = useAppStore((s) => s.favoriteTags);
  const favoriteAuthors = useAppStore((s) => s.favoriteAuthors);
  const upsertTag = useAppStore((s) => s.upsertTag);
  const upsertAuthor = useAppStore((s) => s.upsertAuthor);
  const removeTag = useAppStore((s) => s.removeTag);
  const removeAuthor = useAppStore((s) => s.removeAuthor);

  if (!current) return null;

  const artists = current.artists;
  const rest = current.tags.filter((t) => !artists.includes(t));

  return (
    <aside className="absolute inset-y-0 right-0 z-50 flex w-[min(22rem,100%)] flex-col border-l border-border bg-elevated">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="text-sm font-medium">Теги</h2>
        <Button variant="ghost" size="icon" onClick={() => setTagsOpen(false)} aria-label="Закрыть">
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {artists.length ? (
          <section className="mb-5">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-subtle">Авторы</h3>
            <ul className="flex flex-col gap-1">
              {artists.map((tag) => {
                const fav = favoriteAuthors.find((t) => t.tag === tag);
                return (
                  <li key={tag} className="flex items-center gap-1">
                    <button
                      type="button"
                      className="min-h-11 flex-1 truncate rounded-md px-2 text-left text-sm hover:bg-fg/6"
                      onClick={() => runSearch(tag, tag)}
                    >
                      {formatTag(tag)}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      title="В любимые авторы"
                      onClick={() =>
                        fav
                          ? removeAuthor(fav.id)
                          : upsertAuthor({
                              id: tag,
                              tag,
                              label: formatTag(tag),
                              image: current.previewUrl,
                            })
                      }
                    >
                      <User className={fav ? "text-like" : "text-muted"} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-subtle">Теги</h3>
          <ul className="flex flex-col gap-1">
            {rest.map((tag) => {
              const fav = favoriteTags.find((t) => t.tag === tag);
              return (
                <li key={tag} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="min-h-11 flex-1 truncate rounded-md px-2 text-left text-sm hover:bg-fg/6"
                    onClick={() => runSearch(tag, tag)}
                  >
                    {formatTag(tag)}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    title="В любимые теги"
                    onClick={() =>
                      fav
                        ? removeTag(fav.id)
                        : upsertTag({
                            id: tag,
                            tag,
                            label: formatTag(tag),
                            image: current.previewUrl,
                          })
                    }
                  >
                    <Heart className={fav ? "fill-like text-like" : "text-muted"} />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </aside>
  );
}
