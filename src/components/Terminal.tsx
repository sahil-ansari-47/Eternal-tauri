import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import { spawn } from "tauri-pty";
import { open as openLink } from "@tauri-apps/plugin-shell";

export default function Terminal({ shell }: { shell: string }) {
  const cwd = localStorage.getItem("workspacePath") || "/";
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const ptyRef = useRef<Awaited<ReturnType<typeof spawn>> | null>(null);

  useEffect(() => {
    const term = new XTerm({
      fontFamily: "Menlo, monospace",
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: "hsl(240, 5.9%, 10%)",
      },
    });

    const fit = new FitAddon();
    const search = new SearchAddon();

    // ✅ WebLinks with Ctrl/Cmd+Click open
    const links = new WebLinksAddon(async (event, uri) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta) {
        await openLink(uri);
      }
    });

    term.loadAddon(fit);
    term.loadAddon(search);
    term.loadAddon(links);
    term.open(containerRef.current!);
    fit.fit();
    const start = async () => {
      const pty = spawn(shell, [], {
        cols: term.cols,
        rows: term.rows,
        cwd,
      });
      ptyRef.current = pty;

      // PTY → Terminal
      pty.onData((data) => term.write(data));

      // Terminal → PTY
      term.onData((data) => pty.write(data));

      term.attachCustomKeyEventHandler((e) => {
        // Ctrl/Cmd + C → copy
        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
          const selection = term.getSelection();
          if (selection) {
            navigator.clipboard.writeText(selection);
            term.clearSelection();
            return false;
          }
        }
        // Ctrl/Cmd + F → find
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
          const query = prompt("Find text:");
          if (query) {
            search.findNext(query);
          }
          return false;
        }

        return true;
      });

      // Resize handling
      const observer = new ResizeObserver(() => {
        fit.fit();
        pty.resize(term.cols, term.rows);
      });
      observer.observe(containerRef.current!);

      // Cleanup
      return () => {
        observer.disconnect();
        pty.kill();
        term.dispose();
      };
    };
    const cleanupPromise = start();
    termRef.current = term;
    fitRef.current = fit;
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [shell, cwd]);

  return <div ref={containerRef} className="w-full h-full bg-p5" />;
}
