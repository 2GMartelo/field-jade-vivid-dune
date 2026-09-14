import { useAppStore } from "@/lib/store";
import { useFeed } from "@/components/feed-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function SettingsPanel() {
  const { chooseFolder } = useFeed();
  const saveInAuthorFolders = useAppStore((s) => s.saveInAuthorFolders);
  const setSaveInAuthorFolders = useAppStore((s) => s.setSaveInAuthorFolders);
  const downloadFolderName = useAppStore((s) => s.downloadFolderName);
  const editChrome = useAppStore((s) => s.editChrome);
  const setEditChrome = useAppStore((s) => s.setEditChrome);
  const sources = useAppStore((s) => s.sources);
  const setSource = useAppStore((s) => s.setSource);
  const r34ApiKey = useAppStore((s) => s.r34ApiKey);
  const r34UserId = useAppStore((s) => s.r34UserId);
  const setR34 = useAppStore((s) => s.setR34);
  const danbooruLogin = useAppStore((s) => s.danbooruLogin);
  const danbooruApiKey = useAppStore((s) => s.danbooruApiKey);
  const setDanbooru = useAppStore((s) => s.setDanbooru);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <h2 className="mb-4 text-sm font-medium">Настройки</h2>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Скачивание</h3>
        <p className="text-sm text-muted">
          Папка: {downloadFolderName || "не выбрана (браузерные загрузки)"}
        </p>
        <Button variant="outline" onClick={() => void chooseFolder()}>
          выбрать папку
        </Button>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          Подпапки автор / арты
          <Switch
            checked={saveInAuthorFolders}
            onCheckedChange={setSaveInAuthorFolders}
          />
        </label>
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Кнопки</h3>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          Редактировать кнопки
          <Switch checked={editChrome} onCheckedChange={setEditChrome} />
        </label>
        <p className="text-sm text-muted">
          Включите и нажмите любую кнопку, чтобы сменить текст или наложить фото.
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Источники</h3>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          Danbooru
          <Switch
            checked={sources.danbooru}
            onCheckedChange={(v) => setSource("danbooru", v)}
          />
        </label>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          Rule34.xxx
          <Switch
            checked={sources.rule34}
            onCheckedChange={(v) => setSource("rule34", v)}
          />
        </label>
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Rule34 API</h3>
        <p className="text-sm text-muted">
          Аккаунт → Options → API Access Credentials. Без ключа Rule34 недоступен.
        </p>
        <Input
          placeholder="user id"
          value={r34UserId}
          onChange={(e) => setR34(r34ApiKey, e.target.value)}
        />
        <Input
          placeholder="api key"
          type="password"
          value={r34ApiKey}
          onChange={(e) => setR34(e.target.value, r34UserId)}
        />
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Danbooru API</h3>
        <p className="text-sm text-muted">
          Необязательно. Ключ снимает лимит в два тега.
        </p>
        <Input
          placeholder="login"
          value={danbooruLogin}
          onChange={(e) => setDanbooru(e.target.value, danbooruApiKey)}
        />
        <Input
          placeholder="api key"
          type="password"
          value={danbooruApiKey}
          onChange={(e) => setDanbooru(danbooruLogin, e.target.value)}
        />
      </section>
    </div>
  );
}
