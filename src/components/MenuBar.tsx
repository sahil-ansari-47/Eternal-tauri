import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";

const appWindow = getCurrentWindow();
const menuItemStyle =
  "hover:bg-gray-700 px-2 py-1 rounded-lg cursor-default text-sm select-none";

const Dropdown = ({
  label,
  items,
}: {
  label: string;
  items: { label: string; onClick?: () => void; disabled?: boolean }[];
}) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button className={`${menuItemStyle}`}>{label}</button>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={4}
        className="min-w-[160px] bg-gray-800 text-gray-200 rounded-md shadow-lg p-1 border border-gray-700 z-50"
      >
        {items.map((item, idx) => (
          <DropdownMenu.Item
            key={idx}
            className="px-2 py-1 text-sm rounded hover:bg-gray-700 cursor-pointer select-none outline-none data-[disabled]:text-gray-500 data-[disabled]:cursor-not-allowed"
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

export default function MenuBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const listenToWindow = async () => {
      setIsMaximized(await appWindow.isMaximized());
      unlisten = await appWindow.onResized(async () => {
        setIsMaximized(await appWindow.isMaximized());
      });
    };

    listenToWindow();

    return () => {
      unlisten?.();
    };
  }, []);

  const handleNewWindow = () => {
    const webview = new WebviewWindow(
      `win-${Math.random().toString(36).substring(7)}`,
      {
        title: "Eternal",
        decorations: false,
        url: "http://localhost:1420",
      }
    );

    webview.once("tauri://created", () => {
      console.log("New window created successfully");
    });

    webview.once("tauri://error", (e: any) => {
      console.error("Failed to create new window:", e);
    });
  };

  return (
    <div
      data-tauri-drag-region
      onClick={() => console.log("Menu bar clicked")}
      className="flex items-center justify-between bg-p5 text-neutral-300 h-8 px-1 select-none"
    >
      <div className="flex space-x-1 text-sm z-10">
        <Dropdown
          label="File"
          items={[
            { label: "New File", onClick: () => console.log("New clicked") },
            { label: "New Folder", onClick: () => console.log("New clicked") },
            {
              label: "New Window",
              onClick: handleNewWindow,
            },
            {
              label: "Open Folder",
              onClick: () => console.log("Open clicked"),
            },
            { label: "Save", onClick: () => console.log("Save clicked") },
            { label: "Save As", onClick: () => console.log("Save As clicked") },
            {
              label: "Exit",
              onClick: () => appWindow.close(),
            },
          ]}
        />
        <Dropdown
          label="Edit"
          items={[
            { label: "Undo", disabled: true },
            { label: "Redo", disabled: true },
            { label: "Cut", disabled: true },
            { label: "Copy", disabled: true },
            { label: "Paste", disabled: true },
          ]}
        />
        <Dropdown
          label="View"
          items={[
            { label: "Reload", onClick: () => window.location.reload() },
            { label: "Zoom In", disabled: true },
            { label: "Zoom Out", disabled: true },
          ]}
        />
        <Dropdown
          label="Git"
          items={[
            {
              label: "Initialize...",
              onClick: () => console.log("Git clicked"),
            },
            { label: "Clone...", onClick: () => console.log("Git clicked") },
            { label: "Pull...", onClick: () => console.log("Git clicked") },
            { label: "Push...", onClick: () => console.log("Git clicked") },
            { label: "Stage...", onClick: () => console.log("Git clicked") },
            { label: "Commit...", onClick: () => console.log("Git clicked") },
            { label: "Status...", onClick: () => console.log("Git clicked") },
            { label: "Branch...", onClick: () => console.log("Git clicked") },
            { label: "Remote...", onClick: () => console.log("Git clicked") },
            { label: "Stash...", onClick: () => console.log("Git clicked") },
          ]}
        />
        <Dropdown
          label="Help"
          items={[
            { label: "Documentation", disabled: true },
            { label: "About", onClick: () => console.log("About clicked") },
          ]}
        />
      </div>

      {/* Center: App Name */}
      <div className="flex items-center gap-0.5">
        <img
          className="size-6"
          src="../../src-tauri/icons/logo.png"
          alt="Logo"
        />
        <div className="text-xs">Eternal - IDE</div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex z-10">
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
          onClick={async () => await appWindow.minimize()}
          aria-label="Minimize window"
        >
          <Minus size={14} />
        </button>
        {isMaximized ? (
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
            onClick={async () => await appWindow.unmaximize()}
            aria-label="Restore window"
          >
            <Copy size={14} />
          </button>
        ) : (
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-gray-700  "
            onClick={async () => await appWindow.maximize()}
            aria-label="Maximize window"
          >
            <Square size={14} />
          </button>
        )}
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-red-600"
          onClick={async () => await appWindow.close()}
          aria-label="Close window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
