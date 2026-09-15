using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;

class RunApp
{
    const string Url = "http://localhost:8080/";

    static int Main()
    {
        Console.Title = "Kadr - launcher";
        try
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
        }
        catch { /* not all consoles allow this; harmless if it fails */ }

        // The exe lives right in the project root, next to package.json.
        string projectDir = AppDomain.CurrentDomain.BaseDirectory;

        if (!File.Exists(Path.Combine(projectDir, "package.json")))
        {
            Console.WriteLine("Не найден package.json рядом (" + projectDir + ").");
            Console.WriteLine("Похоже, этот файл переместили из папки проекта.");
            Pause();
            return 1;
        }

        if (!IsOnPath("node.exe") || !IsOnPath("npm.cmd"))
        {
            Console.WriteLine("Node.js не найден на этом компьютере.");
            Console.WriteLine("Установите Node.js (https://nodejs.org/) и запустите этот файл снова.");
            Pause();
            return 1;
        }

        string nodeModules = Path.Combine(projectDir, "node_modules");
        if (!Directory.Exists(nodeModules))
        {
            Console.WriteLine("Первый запуск: устанавливаю зависимости (npm install)...");
            int code = RunAndWait(projectDir, "npm install");
            if (code != 0)
            {
                Console.WriteLine("npm install завершился с ошибкой (код " + code + ").");
                Pause();
                return code;
            }
        }

        Console.WriteLine("Запускаю сервер разработки...");
        var startInfo = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = "/c npm run dev",
            WorkingDirectory = projectDir,
            UseShellExecute = false,
        };
        var proc = Process.Start(startInfo);

        // Open the browser once the server actually answers, in the background.
        var opener = new Thread(() => WaitForServerThenOpenBrowser());
        opener.IsBackground = true;
        opener.Start();

        proc.WaitForExit();
        Console.WriteLine("Сервер остановлен (код " + proc.ExitCode + ").");
        Pause();
        return proc.ExitCode;
    }

    static void WaitForServerThenOpenBrowser()
    {
        for (int i = 0; i < 60; i++)
        {
            Thread.Sleep(1000);
            if (IsPortOpen("127.0.0.1", 8080))
            {
                try
                {
                    Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true });
                }
                catch { /* user can open the URL manually from the console output */ }
                return;
            }
        }
    }

    static bool IsPortOpen(string host, int port)
    {
        try
        {
            using (var client = new TcpClient())
            {
                var result = client.BeginConnect(host, port, null, null);
                bool ok = result.AsyncWaitHandle.WaitOne(500);
                if (ok && client.Connected)
                {
                    client.EndConnect(result);
                    return true;
                }
                return false;
            }
        }
        catch
        {
            return false;
        }
    }

    static bool IsOnPath(string fileName)
    {
        string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in pathEnv.Split(Path.PathSeparator))
        {
            try
            {
                string candidate = Path.Combine(dir, fileName);
                if (File.Exists(candidate)) return true;
            }
            catch { /* malformed PATH entry */ }
        }
        return false;
    }

    static int RunAndWait(string workingDir, string command)
    {
        var info = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = "/c " + command,
            WorkingDirectory = workingDir,
            UseShellExecute = false,
        };
        var p = Process.Start(info);
        p.WaitForExit();
        return p.ExitCode;
    }

    static void Pause()
    {
        Console.WriteLine();
        Console.WriteLine("Нажмите Enter, чтобы закрыть это окно...");
        Console.ReadLine();
    }
}
