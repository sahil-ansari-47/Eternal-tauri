import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { barf } from "thememirror";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { useEditor } from "./contexts/EditorContext";
import { writeTextFile } from "@tauri-apps/plugin-fs"
import getLanguageExtension from ".././utils/edfunc";
export default function Editor() {
  const { openFiles, setOpenFiles, activePath, setActivePath } = useEditor();
  const viewRefs = useRef<Record<string, EditorView>>({});
  // const customTheme = EditorView.theme({
  //   ".cm-content": {
  //     height: "100%",
  //   },
  //   ".cm-gutters": {
  //     backgroundColor: "#2d2f3f !important",
  //   },
  // });
  useEffect(() => {
    const handler = (e: Event) => {
      const { filePath, line, query } = (e as CustomEvent).detail;
      const view = viewRefs.current[filePath]; // find editor for that file
      if (filePath !== activePath || !view) return;

      const docLine = view.state.doc.line(line);
      const text = docLine.text;

      // Find query in that line (case-insensitive for example)
      const start = text.toLowerCase().indexOf(query.toLowerCase());
      if (start === -1) return; // not found

      const from = docLine.from + start;
      const to = from + query.length;

      // Scroll, move cursor, and select text
      view.dispatch({
        selection: { anchor: from, head: to },
        effects: EditorView.scrollIntoView(from, { y: "center" }),
      });

      view.focus();
    };

    window.addEventListener("scroll-to-line", handler);
    return () => window.removeEventListener("scroll-to-line", handler);
  }, [activePath]);

  // Create editor when container mounts
  const assignRef = (filePath: string) => (el: HTMLDivElement | null) => {
    if (!el || viewRefs.current[filePath]) return;
    const file = openFiles.find((f) => f.path === filePath);
    if (!file) return;
    const state = EditorState.create({
      doc: file.content.toString(),
      extensions: [
        basicSetup,
        barf,
        getLanguageExtension(file.path),
      ],
    });

    viewRefs.current[filePath] = new EditorView({ state, parent: el });
  };
  const onSave = async(filePath: string, newContent: string) => {
    const file = openFiles.find((f) => f.path === filePath);
    if (!file) return;
    // save to disk
    await writeTextFile(file.path, newContent as unknown as string);
    // update state
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === filePath ? { ...f, content: newContent } as File : f))
    );
  };

  const onClose = (filePath: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== filePath));
  };

  const handleCloseTab = (filePath: string) => {
    const view = viewRefs.current[filePath];
    if (view) {
      onSave(filePath, view.state.doc.toString());
      view.destroy();
      delete viewRefs.current[filePath];
    }
    onClose(filePath);

    const remaining = openFiles.filter((f) => f.path !== filePath);
    if (remaining.length > 0) setActivePath(remaining[0].path);
    else setActivePath(""); // no tabs left
  };

  // Update active tab if the current active file is closed externally
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
            <span className="truncate max-w-xs">
              {file.path.split("\\").pop()}
            </span>
            <button
              className={`ml-2 px-1.5 py-1 hover:bg-neutral-500 hover:text-neutral-400 rounded-sm cursor-pointer font-bold ${
                file.path === activePath ? "text-neutral-400" : "text-primary-sidebar"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(file.path);
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
            ref={assignRef(file.path)}
            className={`absolute inset-0 ${
              file.path === activePath ? "block" : "hidden"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
