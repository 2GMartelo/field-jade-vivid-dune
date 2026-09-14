import {
  Clapperboard,
  Heart,
  Settings,
  Tag,
  User,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useFeed } from "@/components/feed-context";
import { ChromeButton } from "@/components/chrome-button";

export function Sidebar() {
  const open = useAppStore((s) => s.sidebarOpen);
  const mediaKind = useAppStore((s) => s.mediaKind);
  const toggleMediaKind = useAppStore((s) => s.toggleMediaKind);
  const { view, setView, openFavorites } = useFeed();

  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 border-r border-border bg-elevated p-3 pt-4",
        "transition-transform duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]",
        open ? "translate-x-0" : "-translate-x-full pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <ChromeButton
        id="side.favorites"
        defaultLabel="все мои избранные"
        icon={<Heart />}
        className="w-full justify-start"
        active={view === "favorites"}
        onClick={() => openFavorites()}
      />
      <ChromeButton
        id="side.exclusions"
        defaultLabel="исключения"
        icon={<Ban />}
        className="w-full justify-start"
        active={view === "exclusions"}
        onClick={() => setView("exclusions")}
      />
      <ChromeButton
        id="side.authors"
        defaultLabel="любимые авторы"
        icon={<User />}
        className="w-full justify-start"
        active={view === "authors"}
        onClick={() => setView("authors")}
      />
      <ChromeButton
        id="side.tags"
        defaultLabel="любимые теги"
        icon={<Tag />}
        className="w-full justify-start"
        active={view === "tags"}
        onClick={() => setView("tags")}
      />
      <ChromeButton
        id="side.motion"
        defaultLabel={mediaKind === "motion" ? "видео / gif" : "фото"}
        icon={<Clapperboard />}
        className="w-full justify-start"
        active={mediaKind === "motion"}
        onClick={() => {
          toggleMediaKind();
          setView("feed");
        }}
      />
      <div className="flex-1" />
      <ChromeButton
        id="side.settings"
        defaultLabel="настройки"
        icon={<Settings />}
        className="w-full justify-start"
        active={view === "settings"}
        onClick={() => setView("settings")}
      />
    </aside>
  );
}
