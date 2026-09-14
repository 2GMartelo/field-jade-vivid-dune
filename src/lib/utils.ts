import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function sanitizeFilename(name: string) {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "file";
}

export function parseTagList(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase().replace(/ /g, "_"))
    .filter(Boolean);
}

export function formatTag(tag: string) {
  return tag.replace(/_/g, " ");
}
