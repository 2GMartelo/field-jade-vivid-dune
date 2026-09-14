import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function AgeGate() {
  const confirmAge = useAppStore((s) => s.confirmAge);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm rounded-xl bg-elevated p-6 shadow-[var(--shadow-border)]">
        <p className="mb-1 text-xs uppercase tracking-[0.18em] text-subtle">Kadr</p>
        <h1 className="mb-3 text-xl font-medium tracking-tight">Только 18+</h1>
        <p className="mb-6 text-pretty text-sm leading-relaxed text-muted">
          Просмотр материалов с Danbooru и Rule34. Подтвердите, что вам есть 18 лет.
          Контент с несовершеннолетними скрыт и недоступен.
        </p>
        <Button variant="default" className="w-full" onClick={confirmAge}>
          Мне есть 18
        </Button>
      </div>
    </main>
  );
}
