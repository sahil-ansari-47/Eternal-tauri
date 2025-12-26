import { useEffect, useRef, useState } from "react";
import Terminal from "./Terminal";
import { Plus } from "lucide-react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import { spawn } from "tauri-pty";
import { open as openLink } from "@tauri-apps/plugin-shell";
import { useLayout } from "./contexts/LayoutContext";
import { useGit } from "./contexts/GitContext";

export default function BottomPanel() {
  const { setDownOpen } = useLayout();
  const {
    refreshStatus,
    fetchSyncStatus,
    fetchGraph,
    setIsInit,
    status,
    runGit,
  } = useGit();
  const cwd = localStorage.getItem("workspacePath") || undefined;
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const shell = navigator.platform.startsWith("Win")
    ? "powershell.exe"
    : "/bin/bash";
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tabs.length === 0) createTab();
  }, []);
  const createTab = async () => {
    const id = crypto.randomUUID();
    const term = new XTerm({
      fontFamily: "Menlo, monospace",
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
      scrollback: 1000,
      theme: { background: "hsl(240, 5.9%, 10%)" },
    });
    const fit = new FitAddon();
    const search = new SearchAddon();
    const links = new WebLinksAddon(async (event, uri) => {
      if (event.metaKey || event.ctrlKey) await openLink(uri);
    });
    term.loadAddon(fit);
    term.loadAddon(search);
    term.loadAddon(links);
    // Spawn PTY
    const pty = spawn(shell, ["-NoLogo", "-NoProfile"], {
      cols: term.cols,
      rows: term.rows,
      cwd,
    });
    let commandBuffer = "";
    pty.onData((d) => term.write(d));
    term.onData((d) => {
      // Enter pressed → command submitted
      if (d === "\r") {
        // Get the actual command from the terminal buffer instead of relying on commandBuffer
        const cursorY = term.buffer.active.cursorY;
        const line = term.buffer.active.getLine(cursorY);
        let command = "";
        if (line) {
          // Extract text from the line, starting after the prompt
          const lineText = line.translateToString(true);
          // Find the command after the prompt (typically ends with >, $, or %)
          const promptMatch = lineText.match(/[>$%]\s*(.*)/);
          command = promptMatch ? promptMatch[1].trim() : lineText.trim();
        }
        console.log("Command:", command);
        // if (command.startsWith("git commit")) {
        //   setTimeout(async () => {
        //     await refreshStatus();
        //     await fetchGraph();
        //     await fetchSyncStatus();
        //   }, 0);
        // }
        if (command.startsWith("git init")) {
          // Run AFTER command executes
          setTimeout(() => {
            setIsInit(true);
            refreshStatus();
          }, 0);
        }
        if (command.startsWith("git ")) {
          // Run AFTER command executes

          setTimeout(async () => {
            if (status.branch === "master") {
              await runGit("renamebranch", { cwd });
              status.branch = "main";
            }
            await refreshStatus();
            await fetchGraph();
            await fetchSyncStatus();
          }, 0);
        }
        commandBuffer = "";
      } else if (d === "\u007f") {
        commandBuffer = commandBuffer.slice(0, -1);
      } else if (d.length === 1) {
        commandBuffer += d;
      }
      // Always pass input to PTY
      pty.write(d);
    });
    const resize = () => {
      fit.fit();
      pty.resize(term.cols, term.rows);
    };
    term.onResize(resize);

    // Permanent container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.inset = "0";
    container.style.display = "none";

    if (panelRef.current) {
      panelRef.current.appendChild(container);
    }
    const title = `Terminal ${tabs.length + 1}`;
    const newTab: Tab = { id, title, term, fit, pty, container };
    setTabs((prev) => [...prev, newTab]);
    setActiveId(id);
    requestAnimationFrame(resize);
  };
  const closeTab = (id: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === id);
      tab?.pty.kill();
      return prev.filter((t) => t.id !== id);
    });

    const remaining = tabs.filter((t) => t.id !== id);
    if (remaining.length) {
      setActiveId(remaining[0].id);
    } else {
      setActiveId(null);
      setDownOpen(false);
    }
  };
  useEffect(() => {
    tabs.forEach((tab) => {
      const visible = tab.id === activeId;
      tab.container.style.display = visible ? "block" : "none";
      if (visible) {
        tab.fit.fit();
        tab.term.focus();
      }
    });
  }, [activeId, tabs]);

  return (
    <div className="w-full h-full bg-primary-sidebar p-2">
      <div className="flex flex-col h-full w-full overflow-hidden border border-neutral-600 rounded-xl">
        {/* Tab bar */}
        <div className="flex items-center bg-p5 text-sm text-neutral-300 select-none">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`px-3 py-2 flex items-center cursor-pointer rounded-b-xl ${
                tab.id === activeId ? "bg-primary-sidebar" : "bg-transparent"
              }`}
              onClick={() => setActiveId(tab.id)}
            >
              <span>{tab.title}</span>
              <button
                className="ml-2 text-neutral-400 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="ml-auto px-3 py-1 hover:bg-[#1e1e1e] text-white"
            onClick={createTab}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Terminal mount */}
        <div className="bg-p5 p-4 h-full">
          <div ref={panelRef} className="relative h-full" />
        </div>
      </div>

      {tabs.map((tab) => (
        <Terminal
          key={tab.id}
          term={tab.term}
          fit={tab.fit}
          container={tab.container}
        />
      ))}
    </div>
  );
}
