import { useState } from "react";
import { X } from "lucide-react";
import { formatTag, parseTagList } from "@/lib/utils";
import { isBlockedTag } from "@/lib/media/safety";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExclusionsPanel() {
  const exclusions = useAppStore((s) => s.exclusions);
  const addExclusion = useAppStore((s) => s.addExclusion);
  const removeExclusion = useAppStore((s) => s.removeExclusion);
  const [draft, setDraft] = useState("");

  function add() {
    for (const tag of parseTagList(draft)) {
      if (!isBlockedTag(tag)) addExclusion(tag);
    }
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 py-3">
        <h2 className="mb-3 text-sm font-medium">Исключения</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="теги, которых не должно быть"
          />
          <Button type="submit" variant="outline">
            добавить
          </Button>
        </form>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {exclusions.length === 0 ? (
          <li className="text-sm text-muted">Список пуст</li>
        ) : (
          exclusions.map((tag) => (
            <li key={tag} className="flex min-h-11 items-center justify-between gap-2">
              <span className="truncate text-sm">{formatTag(tag)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                onClick={() => removeExclusion(tag)}
                aria-label="Убрать"
              >
                <X />
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
