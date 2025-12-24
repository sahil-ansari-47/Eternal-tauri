import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X, Home, Video, Code } from "lucide-react";
import { useEffect, useState } from "react";
import { useEditor } from "./contexts/EditorContext";
import { message, save } from "@tauri-apps/plugin-dialog";
import { exists, remove } from "@tauri-apps/plugin-fs";
import { useLayout } from "./contexts/LayoutContext";
import { useGit } from "./contexts/GitContext";
import { useMessage } from "./contexts/MessageContext";

export default function MenuBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [appWindow, setAppWindow] = useState<any>(null);
  const {
    setAction,
    setDialogOpen,
    openFiles,
    viewRefs,
    handleOpenFolder,
    activeFile,
    onSave,
    setCloneDialogOpen,
    activeTab,
    setActiveTab,
  } = useEditor();
  const { inCall } = useMessage();
  const { setLeftOpen, setDownOpen, setRightOpen } = useLayout();
  const { syncStatus, handleInit, handlePush, isInit, refreshStatus } =
    useGit();
  
  useEffect(() => {
    const initWindow = () => {
      try {
        const window = getCurrentWindow();
        setAppWindow(window);
      } catch (error) {
        console.warn("Not in Tauri environment:", error);
      }
    };
    initWindow();
  }, []);

  useEffect(() => {
    if (!appWindow) return;
    let unlisten: (() => void) | undefined;
    const listenToWindow = async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
        unlisten = await appWindow.onResized(async () => {
          setIsMaximized(await appWindow.isMaximized());
        });
      } catch (error) {
        console.warn("Window API error:", error);
      }
    };
    listenToWindow();
    return () => unlisten?.();
  }, [appWindow]);
  function buildSaveOptions(activeFile: FsNode) {
    if (!activeFile || !activeFile.name) return {};
    const parts = activeFile.name.split(".");
    const ext = parts.length > 1 ? parts.pop() : "";
    return {
      defaultPath: activeFile.name,
      filters: [
        {
          name: ext ? `${ext.toUpperCase()} File` : "All Files",
          extensions: ext ? [ext] : ["*"],
        },
      ],
    };
  }
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
      message("Failed to create new window", { title: "Error", kind: "error" });
      console.error("Failed to create new window:", e);
    });
  };
  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between bg-p5 text-neutral-300 h-8 px-1 select-none"
    >
      {/* LEFT MENUBAR */}
      <Menubar className="bg-p5 border-none text-neutral-200 h-7 flex">
        {/* FILE MENU */}
        <MenubarMenu>
          <MenubarTrigger className="px-2 font-normal hover:bg-neutral-600 ">
            File
          </MenubarTrigger>
          <MenubarContent className="bg-p5 border border-neutral-700 text-gray-200">
            <MenubarItem
              onClick={() => {
                setAction("newFile");
                setDialogOpen(true);
              }}
            >
              New File
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                setAction("newFolder");
                setDialogOpen(true);
              }}
            >
              New Folder
            </MenubarItem>
            <MenubarItem onClick={handleNewWindow}>New Window</MenubarItem>
            <MenubarItem onClick={() => handleOpenFolder()}>
              Open Folder
            </MenubarItem>
            <MenubarItem
              disabled={!activeFile}
              onClick={async () => {
                if (!activeFile) return;
                const fileExists = await exists(activeFile.path);
                const file = openFiles.find((f) => f.path === activeFile.path);
                const view = viewRefs.current[activeFile.path];
                if (!view) return;
                if (fileExists && file) {
                  file.content = view.state.doc.toString();
                  await onSave(file);
                } else {
                  await message(
                    `Cannot save: file "${activeFile.path}" does not exist.`
                  );
                }
              }}
            >
              Save
            </MenubarItem>
            <MenubarItem
              disabled={!activeFile}
              onClick={async () => {
                if (!activeFile) return;
                const fileExists = await exists(activeFile.path);
                const file = openFiles.find((f) => f.path === activeFile.path);
                const view = viewRefs.current[activeFile.path];
                if (!view) return;
                if (fileExists && file) {
                  const newPath = await save(buildSaveOptions(activeFile));
                  await remove(activeFile.path);
                  if (newPath) file.path = newPath;
                  file.content = view.state.doc.toString();
                  await onSave(file);
                } else {
                  await message(
                    `Cannot save: file "${activeFile.path}" does not exist.`
                  );
                }
              }}
            >
              Save As
            </MenubarItem>
            <MenubarItem
              disabled={!activeFile}
              onClick={async () => {
                const openPaths = Object.keys(viewRefs.current);
                for (const fullPath of openPaths) {
                  const ref = viewRefs.current[fullPath];
                  if (!ref) continue;
                  const content = ref.state.doc.toString();
                  await onSave({
                    path: fullPath,
                    content,
                  } as FsNode);
                }
              }}
            >
              Save All
            </MenubarItem>
            <MenubarItem onClick={() => appWindow?.close()}>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        {/* EDIT MENU */}
        <MenubarMenu>
          <MenubarTrigger className="px-2 font-normal hover:bg-neutral-600">
            Edit
          </MenubarTrigger>
          <MenubarContent className="bg-p5 border border-neutral-700 text-gray-200">
            <MenubarItem disabled>Undo</MenubarItem>
            <MenubarItem disabled>Redo</MenubarItem>
            <MenubarItem disabled>Cut</MenubarItem>
            <MenubarItem disabled>Copy</MenubarItem>
            <MenubarItem disabled>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        {/* VIEW MENU */}
        <MenubarMenu>
          <MenubarTrigger className="px-2 font-normal hover:bg-neutral-600">
            View
          </MenubarTrigger>
          <MenubarContent className="bg-p5 border border-neutral-700 text-gray-200">
            <MenubarItem onClick={() => window.location.reload()}>
              Reload
            </MenubarItem>
            <MenubarItem disabled>Zoom In</MenubarItem>
            <MenubarItem disabled>Zoom Out</MenubarItem>
            <MenubarItem onClick={() => setDownOpen(true)}>
              Terminal
            </MenubarItem>
            <MenubarItem onClick={() => setLeftOpen(true)}>
              Left Panel
            </MenubarItem>
            <MenubarItem onClick={() => setRightOpen(true)}>
              Right Panel
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        {/* GIT MENU */}
        <MenubarMenu>
          <MenubarTrigger className="px-2 font-normal hover:bg-neutral-600">
            Git
          </MenubarTrigger>
          <MenubarContent className="bg-p5 border border-neutral-700 text-gray-200">
            <MenubarItem disabled={isInit} onClick={handleInit}>
              Initialize…
            </MenubarItem>
            <MenubarItem onClick={() => setCloneDialogOpen(true)}>
              Clone…
            </MenubarItem>
            <MenubarItem
              disabled={!isInit || syncStatus?.ahead === 0}
              onClick={handlePush}
            >
              Push…
            </MenubarItem>
            <MenubarItem onClick={refreshStatus}>Refresh Status</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      {/* CENTER TITLE */}
      <div className="flex items-center gap-1">
        <img className="size-6" src="/logo.png" alt="Logo" />
        <div className="text-xs">Eternal - IDE</div>
      </div>
      {/* RIGHT WINDOW BUTTONS */}
      <div className="flex z-10">
        <div className="flex items-center -translate-x-[5vw]">
          {(inCall || openFiles.length > 0) && (
            <button
              onClick={() => setActiveTab("Home")}
              className={`cursor-pointer gap-1 h-full px-2 items-center flex flex-row ${
                activeTab === "Home"
                  ? "bg-p6/30 border-b border-neutral-300"
                  : ""
              }`}
            >
              <Home size={18} color="white" />
              <div className="text-white text-xs">Home</div>
            </button>
          )}
          {inCall && (
            <button
              onClick={() => setActiveTab("Video")}
              className={`cursor-pointer gap-1 h-full px-2 flex flex-row items-center ${
                activeTab === "Video"
                  ? "bg-p6/30 border-b border-neutral-300"
                  : ""
              }`}
            >
              <Video size={18} color="white" />
              <div className="text-white text-xs">Video</div>
            </button>
          )}
          {openFiles.length > 0 && (
            <button
              onClick={() => setActiveTab("Editor")}
              className={`cursor-pointer gap-1 h-full px-2 flex flex-row items-center ${
                activeTab === "Editor"
                  ? "bg-p6/30 border-b border-neutral-300"
                  : ""
              }`}
            >
              <Code size={18} color="white" />
              <div className="text-white text-xs">Editor</div>
            </button>
          )}
        </div>
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-neutral-700"
          onClick={() => appWindow?.minimize()}
        >
          <Minus size={14} />
        </button>
        {isMaximized ? (
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-neutral-700"
            onClick={() => appWindow?.unmaximize()}
          >
            <Copy size={14} />
          </button>
        ) : (
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-neutral-700"
            onClick={() => appWindow?.maximize()}
          >
            <Square size={14} />
          </button>
        )}
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-red-600"
          onClick={() => appWindow?.close()}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
