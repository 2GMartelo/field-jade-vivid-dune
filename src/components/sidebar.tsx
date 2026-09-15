import {
  Headphones,
  Heart,
  Settings,
  Sparkles,
  Star,
  Tag,
  User,
  Ban,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useFeed } from "@/components/feed-context";
import { ChromeButton } from "@/components/chrome-button";
import type { MediaKind } from "@/lib/media/types";

const MODE_LABEL = {
  still: "фото",
  motion: "видео / gif",
  ai: "ИИ-арты",
  civitai: "CivAI",
} as const;

const MODE_BUTTONS: Array<{ kind: MediaKind; label: string }> = [
  { kind: "still", label: "ART" },
  { kind: "motion", label: "GIF" },
  { kind: "ai", label: "AI" },
  { kind: "civitai", label: "CivAI" },
];

export function Sidebar() {
  const open = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const mediaKind = useAppStore((s) => s.mediaKind);
  const setMediaKind = useAppStore((s) => s.setMediaKind);
  const { view, setView, openFavorites, openFavoritesAll, openFavoritesAi, openFavoritesSound, openPixivFeed } =
    useFeed();
  const headphonesOn = useAppStore((s) => s.headphonesOn);
  const setHeadphonesOn = useAppStore((s) => s.setHeadphonesOn);
  const soundVideoCount = useAppStore((s) => s.soundVideos.length);

  // The sidebar is an overlay drawer on every viewport size, so any nav
  // action should close it behind itself rather than leave it hanging open.
  function go(action: () => void) {
    action();
    setSidebarOpen(false);
  }

  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 overflow-y-auto border-r border-border bg-elevated p-3 pt-4",
        "transition-transform duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]",
        open ? "translate-x-0" : "-translate-x-full pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <ChromeButton
        id="side.favorites"
        defaultLabel={`избранное: ${MODE_LABEL[mediaKind]}`}
        icon={<Heart />}
        className="w-full justify-start"
        active={view === "favorites"}
        onClick={() => go(openFavorites)}
      />
      <ChromeButton
        id="side.favoritesAll"
        defaultLabel="избранное: всё"
        icon={<Star />}
        className="w-full justify-start"
        active={view === "favoritesAll"}
        onClick={() => go(openFavoritesAll)}
      />
      <ChromeButton
        id="side.favoritesAi"
        defaultLabel="избранные ИИ"
        icon={<Sparkles />}
        className="w-full justify-start"
        active={view === "favoritesAi"}
        onClick={() => go(openFavoritesAi)}
      />
      <ChromeButton
        id="side.exclusions"
        defaultLabel="исключения"
        icon={<Ban />}
        className="w-full justify-start"
        active={view === "exclusions"}
        onClick={() => go(() => setView("exclusions"))}
      />
      <ChromeButton
        id="side.authors"
        defaultLabel="любимые авторы"
        icon={<User />}
        className="w-full justify-start"
        active={view === "authors"}
        onClick={() => go(() => setView("authors"))}
      />
      <ChromeButton
        id="side.tags"
        defaultLabel="любимые теги"
        icon={<Tag />}
        className="w-full justify-start"
        active={view === "tags"}
        onClick={() => go(() => setView("tags"))}
      />
      <div className="flex w-full gap-1" role="group" aria-label="Режим">
        {MODE_BUTTONS.map((m) => (
          <ChromeButton
            key={m.kind}
            id={`side.mode.${m.kind}`}
            defaultLabel={m.label}
            size="sm"
            className="flex-1 px-1"
            active={mediaKind === m.kind}
            title={`Режим: ${MODE_LABEL[m.kind]}`}
            onClick={() =>
              go(() => {
                setMediaKind(m.kind);
                setView("feed");
              })
            }
          />
        ))}
      </div>
      <ChromeButton
        id="side.pixiv"
        defaultLabel="Pixiv: подписки"
        icon={<Star className="rotate-45" />}
        className="w-full justify-start"
        onClick={() => go(openPixivFeed)}
      />
      <div className="flex-1" />
      <ChromeButton
        id="side.settings"
        defaultLabel="настройки"
        icon={<Settings />}
        className="w-full justify-start"
        active={view === "settings"}
        onClick={() => go(() => setView("settings"))}
      />
      <ChromeButton
        id="side.headphones"
        defaultLabel="фоновый звук"
        icon={<Headphones />}
        className="w-full justify-start"
        active={headphonesOn}
        title={
          soundVideoCount
            ? "Проигрывать в фоне звук из «видео со звуком»"
            : "Сначала добавьте видео в «видео со звуком» (кнопка-наушники под видео)"
        }
        onClick={() => go(() => setHeadphonesOn(!headphonesOn))}
      />
      <ChromeButton
        id="side.favoritesSound"
        defaultLabel="видео со звуком"
        icon={<Volume2 />}
        className="w-full justify-start"
        active={view === "favoritesSound"}
        onClick={() => go(openFavoritesSound)}
      />
    </aside>
  );
}
