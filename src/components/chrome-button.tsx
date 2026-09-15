import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileToSkinDataUrl } from "@/lib/image-file";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ChromeButtonProps = {
  id: string;
  defaultLabel: string;
  icon?: ReactNode;
  className?: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "ghost" | "like" | "pink" | "danger" | "quiet" | "outline";
  size?: "default" | "sm" | "lg" | "icon" | "tile";
};

export function ChromeButton({
  id,
  defaultLabel,
  icon,
  className,
  title,
  active,
  disabled,
  onClick,
  variant = "ghost",
  size = "default",
}: ChromeButtonProps) {
  const skin = useAppStore((s) => s.buttonSkins[id]);
  const editChrome = useAppStore((s) => s.editChrome);
  const setButtonSkin = useAppStore((s) => s.setButtonSkin);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(skin?.label ?? defaultLabel);
  const [image, setImage] = useState(skin?.image ?? "");

  const shownLabel = skin?.label ?? defaultLabel;
  const shownImage = skin?.image;

  function openEditor() {
    setLabel(skin?.label ?? defaultLabel);
    setImage(skin?.image ?? "");
    setOpen(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const url = await fileToSkinDataUrl(file);
    setImage(url);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        title={title ?? shownLabel}
        onClick={onClick}
        className={cn(
          "relative overflow-hidden",
          shownImage && "text-fg",
          active && "bg-fg/8",
          className,
        )}
      >
        {shownImage ? (
          <span
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${shownImage})` }}
          />
        ) : null}
        {shownImage ? <span className="absolute inset-0 bg-bg/45" /> : null}
        <span className="relative z-10 flex items-center gap-2">
          {!shownImage && icon}
          <span className={cn(size === "icon" && !shownLabel ? "sr-only" : "truncate")}>
            {shownLabel}
          </span>
        </span>
        {editChrome ? (
          <span
            role="button"
            tabIndex={0}
            className="absolute right-0.5 top-0.5 z-20 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-border)]"
            title="Изменить кнопку"
            onClick={(e) => {
              e.stopPropagation();
              openEditor();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                e.preventDefault();
                openEditor();
              }
            }}
          >
            <Pencil className="size-3" />
          </span>
        ) : null}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Кнопка</DialogTitle>
            <DialogDescription>
              Текст и картинка подстраиваются под размер кнопки.
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm text-muted">Текст</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          <label className="text-sm text-muted">Картинка</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {image ? (
            <div
              className="h-24 overflow-hidden rounded-md bg-center bg-cover shadow-[var(--shadow-border)]"
              style={{ backgroundImage: `url(${image})` }}
            />
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setButtonSkin(id, { label: label.trim() || defaultLabel, image: image || undefined });
                setOpen(false);
              }}
            >
              Сохранить
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setButtonSkin(id, {});
                setLabel(defaultLabel);
                setImage("");
                setOpen(false);
              }}
            >
              Сброс
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
