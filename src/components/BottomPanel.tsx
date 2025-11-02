// src/components/BottomPanel.tsx
import React, { useEffect, useState } from "react";
import Terminal from "./Terminal";
import { Plus } from "lucide-react";
type Tab = {
  id: string;
  title: string;
};

export default function BottomPanel({togglePanel}:{togglePanel: React.Dispatch<React.SetStateAction<boolean>>}) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, []);
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
      if(remaining.length === 0) togglePanel(false);
    }
  };

  const shell = navigator.platform.startsWith("Win")
    ? "powershell.exe"
    : "/bin/bash";

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

        <div className="flex-1 relative">
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
    </div>
  );
}
