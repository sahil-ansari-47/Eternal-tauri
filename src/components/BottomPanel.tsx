// src/components/BottomPanel.tsx
import { useState } from "react";
import Terminal from "./Terminal";

type Tab = {
  id: string;
  title: string;
};

export default function BottomPanel() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const createTab = () => {
    const id = crypto.randomUUID();
    const title = `Terminal ${tabs.length + 1}`;
    const newTab: Tab = { id, title };

    setTabs((prev) => [...prev, newTab]);
    setActiveId(id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) {
      const remaining = tabs.filter((t) => t.id !== id);
      setActiveId(remaining.length ? remaining[0].id : null);
    }
  };

  const shell = navigator.platform.startsWith("Win")
    ? "powershell.exe"
    : "/bin/bash";

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-neutral-800">
      {/* Tab bar */}
      <div className="flex items-center bg-[#252526] text-sm text-white select-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`px-3 py-1 flex items-center cursor-pointer ${
              tab.id === activeId ? "bg-[#1e1e1e]" : "bg-transparent"
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
          ＋
        </button>
      </div>

      {/* Active terminal */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map(
          (tab) =>
            tab.id === activeId && (
              <div key={tab.id} className="absolute inset-0">
                <Terminal shell={shell} />
              </div>
            )
        )}
      </div>
    </div>
  );
}
