import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { useFeed } from "@/components/feed-context";
import { PinSetupDialog } from "@/components/pin-gate";
import { parseNetscapeCookies, toCookieHeader } from "@/lib/netscape-cookies";
import { resetApp } from "@/lib/reset-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/** Drop or pick a Netscape-format cookies.txt (what "export cookies" browser extensions produce) instead of typing/pasting a raw cookie string. */
function CookieDropzone({
  fileName,
  setCookie,
  setFileName,
}: {
  fileName: string;
  setCookie: (v: string) => void;
  setFileName: (v: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadFile(file: File) {
    const text = await file.text();
    const entries = parseNetscapeCookies(text);
    if (!entries.length) {
      toast.error("Не нашёл ни одной cookie в файле — это точно экспорт в формате Netscape?");
      return;
    }
    setCookie(toCookieHeader(entries));
    setFileName(file.name);
    toast.success(`Cookie загружены из ${file.name} (${entries.length})`);
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-md border border-dashed p-4 text-center text-sm transition-colors ${
        dragOver ? "border-like bg-like/5" : "border-border"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void loadFile(file);
      }}
    >
      <p className="text-muted">
        {fileName ? `Файл: ${fileName}` : "Перетащите сюда cookies.txt, или"}
      </p>
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        выбрать файл
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void loadFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ResetSection() {
  const [armed, setArmed] = useState(false);

  return (
    <section className="mb-6 space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-subtle">Сброс</h3>
      <p className="text-sm text-muted">
        Удаляет всё сохранённое в программе: cookie Pixiv/Civitai/Danbooru, API-ключи Rule34/Danbooru,
        PIN, лайки, дизлайки, исключения, избранные теги и авторов, скины кнопок и выбранные
        папки. Программа станет как только что установленная. Отменить нельзя.
      </p>
      <Button
        variant="danger"
        onClick={() => {
          if (!armed) {
            setArmed(true);
            setTimeout(() => setArmed(false), 4000);
            return;
          }
          void resetApp();
        }}
      >
        {armed ? "нажмите ещё раз, чтобы подтвердить" : "сбросить программу"}
      </Button>
    </section>
  );
}

export function SettingsPanel() {
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const pinHash = useAppStore((s) => s.pinHash);
  const setPinHash = useAppStore((s) => s.setPinHash);
  const { chooseFolder, chooseSoundsFolder, chooseAiFolder } = useFeed();
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
  const soundsFolderName = useAppStore((s) => s.soundsFolderName);
  const likeSoundEnabled = useAppStore((s) => s.likeSoundEnabled);
  const setLikeSoundEnabled = useAppStore((s) => s.setLikeSoundEnabled);
  const likeSoundCount = useAppStore((s) => s.likeSoundCount);
  const aiFolderName = useAppStore((s) => s.aiFolderName);
  const aiFileCount = useAppStore((s) => s.aiFileCount);
  const pixivCookie = useAppStore((s) => s.pixivCookie);
  const setPixivCookie = useAppStore((s) => s.setPixivCookie);
  const civitaiCookieFileName = useAppStore((s) => s.civitaiCookieFileName);
  const setCivitaiCookie = useAppStore((s) => s.setCivitaiCookie);
  const setCivitaiCookieFileName = useAppStore((s) => s.setCivitaiCookieFileName);
  const danbooruCookieFileName = useAppStore((s) => s.danbooruCookieFileName);
  const setDanbooruCookie = useAppStore((s) => s.setDanbooruCookie);
  const setDanbooruCookieFileName = useAppStore((s) => s.setDanbooruCookieFileName);

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
        <h3 className="text-xs uppercase tracking-wide text-subtle">Звук лайка</h3>
        <p className="text-sm text-muted">
          Папка: {soundsFolderName || "не выбрана"}
          {soundsFolderName ? ` · файлов: ${likeSoundCount}` : ""}
        </p>
        <Button variant="outline" onClick={() => void chooseSoundsFolder()}>
          выбрать папку
        </Button>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          Проигрывать при лайке
          <Switch checked={likeSoundEnabled} onCheckedChange={setLikeSoundEnabled} />
        </label>
        <p className="text-sm text-muted">
          Закиньте свои mp3/wav/ogg в выбранную папку — один будет проигрываться случайно
          при каждом лайке.
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Папка моих ИИ</h3>
        <p className="text-sm text-muted">
          Папка: {aiFolderName || "не выбрана"}
          {aiFolderName ? ` · файлов: ${aiFileCount}` : ""}
        </p>
        <Button variant="outline" onClick={() => void chooseAiFolder()}>
          выбрать папку
        </Button>
        <p className="text-sm text-muted">
          Режим «ИИ-арты» (третий после фото/видео в боковой панели) листает картинки и видео
          из этой папки и всех вложенных подпапок; лайки оттуда попадают в «избранные ИИ».
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Pixiv</h3>
        <p className="text-sm text-muted">
          Cookie вашей сессии pixiv.net (значение <code>PHPSESSID</code> из devtools вашего
          браузера, залогиненного на pixiv). Хранится только у вас на диске и используется
          для чтения ленты «Новые работы от тех, на кого вы подписаны». Это не официальный
          API — Pixiv может изменить его в любой момент, без гарантий.
        </p>
        <Input
          placeholder="PHPSESSID=..."
          type="password"
          value={pixivCookie}
          onChange={(e) => setPixivCookie(e.target.value)}
        />
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Civitai</h3>
        <p className="text-sm text-muted">
          Честно: сервис CivAI сам отдаёт теги только настоящему браузеру, залогиненному на
          civitai.com — наш обычный запрос он отклоняет с «Please use the public API instead»,
          и мы не притворяемся браузером, чтобы это обойти (как и не обходим Cloudflare у
          Danbooru). Так что теги на CivAI, скорее всего, не покажутся. Cookie всё равно можно
          закинуть — вдруг залогиненная сессия когда-нибудь изменит поведение. Экспортируйте его
          расширением браузера типа «Get cookies.txt» (формат Netscape). Файл нигде, кроме
          вашего диска, не хранится.
        </p>
        <CookieDropzone
          fileName={civitaiCookieFileName}
          setCookie={setCivitaiCookie}
          setFileName={setCivitaiCookieFileName}
        />
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">PIN</h3>
        <p className="text-sm text-muted">
          {pinHash
            ? "PIN задан — запрашивается при каждом запуске программы."
            : "PIN не задан — программа открывается сразу."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPinDialogOpen(true)}>
            {pinHash ? "сменить PIN" : "задать PIN"}
          </Button>
          {pinHash ? (
            <Button variant="ghost" onClick={() => setPinHash("")}>
              удалить PIN
            </Button>
          ) : null}
        </div>
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

      <section className="mb-6 space-y-3">
        <h3 className="text-xs uppercase tracking-wide text-subtle">Danbooru — проверка «я не робот»</h3>
        <p className="text-sm text-muted">
          Danbooru иногда показывает Cloudflare-проверку «подтвердите, что вы не робот» и
          блокирует обычные запросы, пока она не пройдена. Мы её не обходим и не притворяемся
          человеком за вас — вместо этого откройте Danbooru в своём браузере и пройдите проверку
          сами, как обычный посетитель сайта. После этого экспортируйте cookie расширением
          браузера типа «Get cookies.txt» (формат Netscape) и закиньте файл сюда — программа
          будет пользоваться тем, что вы уже подтвердили лично. Cookie рано или поздно
          протухает, тогда процедуру нужно повторить.
        </p>
        <Button
          variant="outline"
          onClick={() => window.open("https://danbooru.donmai.us", "_blank", "noopener,noreferrer")}
        >
          открыть Danbooru в браузере
        </Button>
        <CookieDropzone
          fileName={danbooruCookieFileName}
          setCookie={setDanbooruCookie}
          setFileName={setDanbooruCookieFileName}
        />
      </section>

      <ResetSection />
      <PinSetupDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} allowLater={false} />
    </div>
  );
}
