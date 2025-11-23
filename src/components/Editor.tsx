import { useEffect } from "react";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { barf } from "thememirror";
import { exists } from "@tauri-apps/plugin-fs";
import { message } from "@tauri-apps/plugin-dialog";
import getLanguageExtension from "../utils/edfunc";
import { useEditor } from "./contexts/EditorContext";
export default function Editor() {
  const {
    openFiles,
    setOpenFiles,
    activePath,
    setActivePath,
    viewRefs,
    onSave,
    normalizeLF,
    setActiveTab,
  } = useEditor();
  useEffect(() => {
    const handler = (e: Event) => {
      const { filePath, line, query } = (e as CustomEvent).detail;
      const view = viewRefs.current[filePath];
      if (filePath !== activePath || !view) return;

      const docLine = view.state.doc.line(line);
      const start = docLine.text.toLowerCase().indexOf(query.toLowerCase());
      if (start === -1) return;
      const from = docLine.from + start;
      const to = from + query.length;

      view.dispatch({
        selection: { anchor: from, head: to },
        effects: EditorView.scrollIntoView(from, { y: "center" }),
      });
      view.focus();
    };

    window.addEventListener("scroll-to-line", handler);
    return () => window.removeEventListener("scroll-to-line", handler);
  }, [activePath]);
  const assignRef = (node: FsNode) => (el: HTMLDivElement | null) => {
    if (!el || viewRefs.current[node.path]) return;
    console.log("Assigning ref to", node.path);
    const file = openFiles.find((f) => f.path === node.path);
    if (!file) return;
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = normalizeLF(update.state.doc.toString());
        node.content = newContent;
        node.isDirty = true;
        setOpenFiles([...openFiles]);
      }
    });
    let state;
    if(!file.content) file.content = "";
    // if (file.content) {
      state = EditorState.create({
        doc: file.content.toString(),
        extensions: [
          basicSetup,
          barf,
          getLanguageExtension(file.path),
          updateListener,
        ],
      });
    // }
    viewRefs.current[node.path] = new EditorView({ state, parent: el });
  };
  const onClose = (filePath: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== filePath));
  };
  const handleCloseTab = async (node: FsNode) => {
    const view = viewRefs.current[node.path];
    const fileExists = await exists(node.path);
    if (view) {
      node.content = view.state.doc.toString();
      if (fileExists) {
        await onSave(node);
      } else {
        await message(`⚠️ File "${node.path}" not found. Skipping save.`, {
          title: "Save Error",
        });
      }
      view.destroy();
      delete viewRefs.current[node.path];
    }
    onClose(node.path);
    const remaining = openFiles.filter((f) => f.path !== node.path);
    setActivePath(remaining.length > 0 ? remaining[0].path : "");
    if (remaining.length === 0) {
      setActiveTab("Splash");
    }
  };
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!activePath) return;
        const fileExists = await exists(activePath);
        const file = openFiles.find((f) => f.path === activePath);
        const view = viewRefs.current[activePath];
        if (!view) return;
        if (fileExists) {
          if (file){
            file.content = view.state.doc.toString();
            await onSave(file);
          } 
        } else {
          await message(
            `⚠️ Cannot save: file "${activePath}" does not exist.`,
            {
              title: "Save Error",
            }
          );
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (!activePath) return;
        const file = openFiles.find((f) => f.path === activePath);
        if (file) handleCloseTab(file);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePath, openFiles]);
  useEffect(() => {
    if (!openFiles.find((f) => f.path === activePath) && openFiles.length > 0) {
      setActivePath(openFiles[0].path);
    }
  }, [openFiles, activePath]);
  return (
    <div className="w-full h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b-4 border-neutral-700 text-neutral-300 text-xs divide-x-3 divide-primary-sidebar">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`flex items-center pl-3 pr-2 py-2 cursor-pointer ${
              file.path === activePath
                ? "bg-neutral-700 font-semibold"
                : "hover:bg-neutral-600"
            }`}
            onClick={() => setActivePath(file.path)}
          >
            <span className="truncate max-w-xs flex items-center gap-1">
              {file.path.split("\\").pop()}
              {/* Git status */}
              {file.status && (
                <span
                  className={`ml-2 font-medium ${
                    file.status === "U"
                      ? "text-orange-500"
                      : file.status === "M"
                      ? "text-yellow-500"
                      : file.status === "A"
                      ? "text-green-500"
                      : "text-red-500" // This now correctly handles the remaining literal "D"
                  }`}
                >
                  {file.status}
                </span>
              )}
              {/* Unsaved indicator */}
              {file.isDirty && (
                <span className="text-white text-3xl ml-1">•</span>
              )}
            </span>

            <button
              className={`ml-2 px-1.5 py-1 hover:bg-neutral-500 hover:text-neutral-400 rounded-sm cursor-pointer font-bold ${
                file.path === activePath
                  ? "text-neutral-400"
                  : "text-primary-sidebar"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(file);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {/* Editors */}
      <div className="flex-1 relative overflow-y-auto bg-p5 scrollbar">
        {openFiles.map((file) => (
          <div
            key={file.path}
            ref={assignRef(file)}
            className={`absolute inset-0 ${
              file.path === activePath ? "block" : "hidden"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
