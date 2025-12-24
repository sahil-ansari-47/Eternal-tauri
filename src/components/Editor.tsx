import { useEffect } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { exists } from "@tauri-apps/plugin-fs";
import { tags as t } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { createTheme } from "thememirror";
import { message } from "@tauri-apps/plugin-dialog";
import getLanguageExtension from "../utils/edfunc";
import { useEditor } from "./contexts/EditorContext";
export default function Editor() {
  const {
    openFiles,
    setOpenFiles,
    activeFile,
    setActiveFile,
    viewRefs,
    onSave,
    normalizeLF,
    setActiveTab,
    setTargetNode,
  } = useEditor();
  useEffect(() => {
    return () => {
      for (const key in viewRefs.current) {
        viewRefs.current[key]?.destroy();
      }
      viewRefs.current = {};
    };
  }, []);
  useEffect(() => {
    const handler = (e: Event) => {
      const { filePath, line, query } = (e as CustomEvent).detail;
      const view = viewRefs.current[filePath];
      if (filePath !== activeFile?.path || !view) return;
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
  }, [activeFile]);
  const assignRef = (node: FsNode) => (el: HTMLDivElement | null) => {
    if (!el || viewRefs.current[node.path]) return;
    const file = openFiles.find((f) => f.path === node.path);
    if (!file) return;
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = normalizeLF(update.state.doc.toString());
        setOpenFiles((prev) =>
          prev.map((f) =>
            f.path === node.path
              ? { ...f, content: newContent, isDirty: true }
              : f
          )
        );
      }
    });
    let state;
    const myBeautifulDarkTwistedTheme = createTheme({
      variant: "dark",
      settings: {
        background: "#18181b",
        foreground: "#fafafa",
        caret: "#72d582",
        selection: "#3d3d3d",
        lineHighlight: "#292929",
        gutterBackground: "#18181b",
        gutterForeground: "#999999",
      },
      styles: [
        {
          tag: t.comment,
          color: "#707070",
        },
        {
          tag: t.variableName,
          color: "#7bd26a",
        },
        {
          tag: [t.string, t.special(t.brace)],
          color: "#f20785",
        },
        {
          tag: t.number,
          color: "#1685f3",
        },
        {
          tag: t.bool,
          color: "#90a1f3",
        },
        {
          tag: t.null,
          color: "#e4f797",
        },
        {
          tag: t.keyword,
          color: "#f3b27c",
        },
        {
          tag: t.operator,
          color: "#eae8ed",
        },
        {
          tag: t.className,
          color: "#c3c6e9",
        },
        {
          tag: t.definition(t.typeName),
          color: "#57eb4c",
        },
        {
          tag: t.typeName,
          color: "#58f3da",
        },
        {
          tag: t.angleBracket,
          color: "#ffffff",
        },
        {
          tag: t.tagName,
          color: "#73ff00",
        },
        {
          tag: t.attributeName,
          color: "#b4f9bc",
        },
      ],
    });
    const scrollbarTheme = EditorView.theme({
      ".cm-scroller": {
        overflow: "auto",
      },
      ".cm-scroller::-webkit-scrollbar": {
        width: "5px",
      },
      /* Vertical scrollbar */
      ".cm-scroller::-webkit-scrollbar:vertical": {
        width: "5px",
      },
      /* Horizontal scrollbar */
      ".cm-scroller::-webkit-scrollbar:horizontal": {
        height: "5px",
      },
      ".cm-scroller::-webkit-scrollbar-track": {
        background: "transparent",
      },
      ".cm-scroller::-webkit-scrollbar-thumb": {
        backgroundColor: "dimgray",
        borderRadius: "9999px",
      },
      ".cm-scroller::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "rgba(160, 160, 160, 0.7)",
      },
    });
    const editorVisualFixes = EditorView.theme({
      ".cm-activeLine": {
        backgroundColor: "#292929",
      },
      ".cm-selectionBackground": {
        backgroundColor: "#3d3d3d !important",
      },
      ".cm-activeLine .cm-selectionBackground": {
        backgroundColor: "#3d3d3d !important",
      },
      ".cm-content ::selection": {
        backgroundColor: "#3d3d3d",
      },
    });

    if (!file.content) file.content = "";
    state = EditorState.create({
      doc: file.content.toString(),
      extensions: [
        basicSetup,
        myBeautifulDarkTwistedTheme,
        editorVisualFixes,
        getLanguageExtension(file.path),
        updateListener,
        scrollbarTheme,
      ],
    });
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
          kind: "error",
        });
      }
      view.destroy();
      delete viewRefs.current[node.path];
    }
    onClose(node.path);
    const remaining = openFiles.filter((f) => f.path !== node.path);
    setActiveFile(remaining.length > 0 ? remaining[0] : null);
    setTargetNode(
      remaining.length > 0
        ? ({
            path: remaining[0].path.split("\\").slice(0, -1).join("\\"),
          } as FsNode)
        : null
    );
    const workspace = localStorage.getItem("workspacePath");
    if (remaining.length === 0 && workspace) {
      setActiveTab("Splash");
    } else {
      setActiveTab("Home");
    }
  };
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!activeFile) return;
        const fileExists = await exists(activeFile.path);
        const file = openFiles.find((f) => f.path === activeFile.path);
        const view = viewRefs.current[activeFile.path];
        if (!view) return;
        if (fileExists) {
          if (file) {
            file.content = view.state.doc.toString();
            await onSave(file);
          }
        } else {
          await message(
            `⚠️ Cannot save: file "${activeFile.path}" does not exist.`,
            {
              title: "Save Error",
            }
          );
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (!activeFile) return;
        const file = openFiles.find((f) => f.path === activeFile.path);
        if (file) handleCloseTab(file);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile, openFiles]);
  useEffect(() => {
    if (
      !openFiles.find((f) => f.path === activeFile?.path) &&
      openFiles.length > 0
    ) {
      setActiveFile(openFiles[0]);
      setTargetNode({
        path: openFiles[0].path.split("\\").slice(0, -1).join("\\"),
      } as FsNode);
    }
  }, [openFiles, activeFile]);
  return (
    <div className="w-full h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b-4 border-neutral-700 text-neutral-300 text-xs divide-x-3 divide-primary-sidebar">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`flex items-center pl-3 pr-2 py-2 cursor-pointer ${
              file.path === activeFile?.path
                ? "bg-neutral-700 font-semibold"
                : "hover:bg-neutral-600"
            }`}
            onClick={() => {
              setActiveFile(file);
              setTargetNode({
                path: file.path.split("\\").slice(0, -1).join("\\"),
              } as FsNode);
            }}
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
                      : "text-red-500"
                  } ${file.status === "I" && "hidden"}`}
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
                file.path === activeFile?.path
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
      <div className="flex-1 relative overflow-y-auto bg-p5">
        {openFiles.map((file) => (
          <div
            key={file.path}
            ref={assignRef(file)}
            className={`absolute inset-0 ${
              file.path === activeFile?.path ? "block" : "hidden"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
