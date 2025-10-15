// src/components/Terminal.tsx
import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { spawn } from "tauri-pty";

export interface TerminalProps {
  shell: string;
  cwd?: string;
}

export default function Terminal({ shell, cwd }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon| null>(null);
  const ptyRef = useRef<Awaited<ReturnType<typeof spawn>>| null>(null);

  useEffect(() => {
    const term = new XTerm({
      fontFamily: "Menlo, monospace",
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: "#1e1e1e",
      },
    });

    const fit = new FitAddon();
    const links = new WebLinksAddon();

    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(containerRef.current!);

    fit.fit();

    // Spawn PTY
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

  return <div ref={containerRef} className="w-full h-full" />;
}
