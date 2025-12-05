// src/components/BottomPanel.tsx
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

type Tab = {
  id: string;
  title: string;
  term: XTerm;
  fit: FitAddon;
  pty: Awaited<ReturnType<typeof spawn>>;
  container: HTMLDivElement;
};

export default function BottomPanel() {
  const { setDownOpen } = useLayout();
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
    // Create terminal instance
    const term = new XTerm({
      fontFamily: "Menlo, monospace",
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
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
    // Wire PTY <-> Terminal
    pty.onData((d) => term.write(d));
    term.onData((d) => pty.write(d));
    // Create permanent DOM container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.inset = "0";
    container.style.display = "none"; // hidden initially
    // Attach container into the panel root
    if (panelRef.current) {
      panelRef.current.appendChild(container);
    }
    const title = `Terminal ${tabs.length + 1}`;
    const newTab: Tab = { id, title, term, fit, pty, container };
    setTabs((prev) => [...prev, newTab]);
    setActiveId(id);
  };
  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    const remaining = tabs.filter((t) => t.id !== id);
    if (remaining.length) {
      setActiveId(remaining[0].id);
    } else {
      setActiveId(null);
      setDownOpen(false);
    }
  };
  useEffect(() => {
    // Show only the active terminal container
    tabs.forEach((tab) => {
      if (!tab.container) return;
      const visible = tab.id === activeId;
      tab.container.style.display = visible ? "block" : "none";
      if (visible) {
        tab.fit.fit();
        tab.term.focus();
      }
    });
  }, [activeId, tabs.length]);

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
        {/* Terminal container mount point */}
        <div className="bg-p5 p-4 h-full">
          <div ref={panelRef} className="flex-1 relative" />
        </div>
      </div>
      {/* Render actual Terminal components as portals */}
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
