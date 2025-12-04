// src/components/Terminal.tsx
import { useEffect } from "react";
import ReactDOM from "react-dom";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";

export default function Terminal({
  term,
  fit,
  container,
}: {
  term: XTerm;
  fit: FitAddon;
  container: HTMLDivElement;
}) {
  useEffect(() => {
    // Terminal already mounted? Skip.
    if ((container as any)._mounted) return;

    term.open(container);
    fit.fit();
    term.focus();

    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(container);

    (container as any)._mounted = true;

    return () => observer.disconnect();
  }, [container, term]);

  return ReactDOM.createPortal(<></>, container);
}
