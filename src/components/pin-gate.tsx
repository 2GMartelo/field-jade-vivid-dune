import { useState } from "react";
import { toast } from "sonner";
import { hashPin } from "@/lib/pin";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Sets or changes the PIN. Used both as the first-run popup (with a "later"
 * escape hatch) and from Settings (without one — you already have the app
 * open, there's nothing to defer).
 */
export function PinSetupDialog({
  open,
  onOpenChange,
  allowLater,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allowLater: boolean;
}) {
  const setPinHash = useAppStore((s) => s.setPinHash);
  const setPinSetupDismissed = useAppStore((s) => s.setPinSetupDismissed);
  const setPinUnlocked = useAppStore((s) => s.setPinUnlocked);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");

  function reset() {
    setPin1("");
    setPin2("");
  }

  async function save() {
    if (pin1.length < 4) {
      toast.error("PIN — минимум 4 символа");
      return;
    }
    if (pin1 !== pin2) {
      toast.error("PIN-коды не совпадают");
      return;
    }
    setPinHash(await hashPin(pin1));
    setPinUnlocked(true);
    reset();
    onOpenChange(false);
    toast.success("PIN задан");
  }

  function later() {
    setPinSetupDismissed(true);
    reset();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Closing any other way (X, Escape, backdrop) counts as "later" too —
      // only for the first-run prompt, so it doesn't nag every launch.
      if (allowLater) setPinSetupDismissed(true);
      reset();
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Задать PIN</DialogTitle>
          <DialogDescription>
            Программа будет спрашивать этот код при каждом запуске. Введите его дважды.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pin1}
          onChange={(e) => setPin1(e.target.value)}
        />
        <Input
          type="password"
          inputMode="numeric"
          placeholder="Повторите PIN"
          value={pin2}
          onChange={(e) => setPin2(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
          }}
        />
        <Button variant="outline" onClick={() => void save()}>
          готово
        </Button>
        {allowLater ? (
          <button
            type="button"
            className="text-center text-sm text-muted hover:text-fg hover:underline"
            onClick={later}
          >
            позже
          </button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Shown once per boot (not per view) when a PIN was set and hasn't been entered yet this session. */
export function PinLockScreen() {
  const pinHash = useAppStore((s) => s.pinHash);
  const setPinHash = useAppStore((s) => s.setPinHash);
  const setPinUnlocked = useAppStore((s) => s.setPinUnlocked);
  const [pin, setPin] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(false);

  async function submit() {
    if ((await hashPin(pin)) === pinHash) {
      setPinUnlocked(true);
      return;
    }
    setError(true);
    setPin("");
  }

  function resetPin() {
    // A locally-set PIN has no server-side recovery — this is a privacy
    // screen, not real security, so "forgot it" just clears the lock rather
    // than locking the person out of their own app permanently.
    setPinHash("");
    setPinUnlocked(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-fg">
      <div className="w-full max-w-xs space-y-3">
        <p className="text-center text-sm tracking-[0.2em] text-muted">KADR</p>
        <Input
          autoFocus
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          className={error ? "border-red-500" : ""}
        />
        {error ? <p className="text-center text-sm text-red-500">Неверный PIN</p> : null}
        <Button variant="outline" className="w-full" onClick={() => void submit()}>
          войти
        </Button>
        {resetting ? (
          <button
            type="button"
            className="block w-full text-center text-sm text-red-500 hover:underline"
            onClick={resetPin}
          >
            точно сбросить PIN?
          </button>
        ) : (
          <button
            type="button"
            className="block w-full text-center text-sm text-muted hover:text-fg hover:underline"
            onClick={() => setResetting(true)}
          >
            забыли PIN?
          </button>
        )}
      </div>
    </main>
  );
}
