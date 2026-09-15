import { useState } from "react";
import { Maximize2, Pencil, Plus, Trash2 } from "lucide-react";
import { formatTag } from "@/lib/utils";
import { fileToSkinDataUrl } from "@/lib/image-file";
import type { FavTile } from "@/lib/media/types";
import { useAppStore, type FavGridKind } from "@/lib/store";
import { useFeed } from "@/components/feed-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 4;

export function FavTiles({ kind }: { kind: FavGridKind }) {
  const { runSearch } = useFeed();
  const tiles = useAppStore((s) => (kind === "authors" ? s.favoriteAuthors : s.favoriteTags));
  const upsert = useAppStore((s) => (kind === "authors" ? s.upsertAuthor : s.upsertTag));
  const remove = useAppStore((s) => (kind === "authors" ? s.removeAuthor : s.removeTag));
  const columns = useAppStore((s) => s.favGridColumns[kind]);
  const setFavGridColumns = useAppStore((s) => s.setFavGridColumns);
  const [editing, setEditing] = useState<FavTile | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftTag, setDraftTag] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftImage, setDraftImage] = useState("");

  function openEdit(tile: FavTile) {
    setEditing(tile);
    setDraftTag(tile.tag);
    setDraftLabel(tile.label);
    setDraftImage(tile.image ?? "");
  }

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setDraftTag("");
    setDraftLabel("");
    setDraftImage("");
  }

  function save() {
    const tag = draftTag.trim().toLowerCase().replace(/\s+/g, "_");
    if (!tag) return;
    upsert({
      id: editing?.id ?? tag,
      tag,
      label: draftLabel.trim() || formatTag(tag),
      image: draftImage || undefined,
    });
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-sm font-medium">
          {kind === "authors" ? "Любимые авторы" : "Любимые теги"}
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-md border border-border px-1"
            title="Кнопок в ряд (меньше = шире каждая)"
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={columns <= MIN_COLUMNS}
              onClick={() => setFavGridColumns(kind, Math.max(MIN_COLUMNS, columns - 1))}
              aria-label="Меньше в ряд (кнопки шире)"
            >
              −
            </Button>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Maximize2 className="size-3" />
              {columns}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={columns >= MAX_COLUMNS}
              onClick={() => setFavGridColumns(kind, Math.min(MAX_COLUMNS, columns + 1))}
              aria-label="Больше в ряд (кнопки уже)"
            >
              +
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus />
            добавить
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {tiles.length === 0 ? (
          <p className="px-1 text-sm text-muted">Пока пусто. Добавьте из панели тегов.</p>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {tiles.map((tile) => (
              <div key={tile.id} className="relative">
                <button
                  type="button"
                  className="relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-md px-4 text-sm font-medium shadow-[var(--shadow-border)]"
                  onClick={() => runSearch(tile.tag, tile.label)}
                >
                  {tile.image ? (
                    <span
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${tile.image})` }}
                    />
                  ) : (
                    <span className="absolute inset-0 bg-surface" />
                  )}
                  <span className="absolute inset-0 bg-bg/50" />
                  <span className="relative z-10 truncate">{tile.label || formatTag(tile.tag)}</span>
                </button>
                <div className="absolute right-1 top-1 flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 bg-bg/50"
                    onClick={() => openEdit(tile)}
                    aria-label="Изменить"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 bg-bg/50"
                    onClick={() => remove(tile.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog
        open={Boolean(editing) || creating}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreating(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creating ? "Новая кнопка" : "Кнопка"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={kind === "authors" ? "автор" : "тег"}
            value={draftTag}
            onChange={(e) => setDraftTag(e.target.value)}
          />
          <Input
            placeholder="текст на кнопке"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setDraftImage(await fileToSkinDataUrl(file));
            }}
          />
          {draftImage ? (
            <div
              className="h-20 rounded-md bg-cover bg-center"
              style={{ backgroundImage: `url(${draftImage})` }}
            />
          ) : null}
          <Button variant="outline" onClick={save}>
            Сохранить
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
