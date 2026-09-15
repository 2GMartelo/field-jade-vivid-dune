import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

/**
 * Plays the audio track of one "video with sound" at a time, shuffled, on
 * loop, in the background while the user keeps browsing normally — muted
 * visually since only the sound matters here. Mounted once at the Shell
 * level so it survives navigating between views.
 */
export function BackgroundAudioPlayer() {
  const headphonesOn = useAppStore((s) => s.headphonesOn);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastIndex = useRef(-1);

  function playNext() {
    const list = useAppStore.getState().soundVideos;
    const audio = audioRef.current;
    if (!audio) return;
    if (!list.length) {
      useAppStore.getState().setHeadphonesOn(false);
      toast.message("Добавьте видео со звуком в «видео со звуком», чтобы включить фон");
      return;
    }
    let next = Math.floor(Math.random() * list.length);
    if (list.length > 1 && next === lastIndex.current) next = (next + 1) % list.length;
    lastIndex.current = next;
    audio.src = list[next]!.fileUrl;
    void audio.play().catch(() => {
      // Autoplay can be blocked before the first user gesture; toggling the
      // headphones button itself is a gesture, so a retry then is enough.
    });
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (headphonesOn) {
      playNext();
    } else {
      audio.pause();
      audio.removeAttribute("src");
    }
  }, [headphonesOn]);

  return <audio ref={audioRef} onEnded={playNext} className="hidden" />;
}
