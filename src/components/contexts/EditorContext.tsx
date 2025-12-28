import { createContext, useContext, useState, useRef } from "react";
import { message, open, save } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { DirEntry, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { EditorView } from "codemirror";
import { useAuth } from "@clerk/clerk-react";
import { useLayout } from "./LayoutContext";
// import { spawn } from "tauri-pty";
// import { Terminal as XTerm } from "@xterm/xterm";
// import { FitAddon } from "@xterm/addon-fit";
// import { SearchAddon } from "@xterm/addon-search";
// import { WebLinksAddon } from "@xterm/addon-web-links";
// import { open as openLink } from "@tauri-apps/plugin-shell";
import {
  preserveExpanded,
  sortNodes,
  buildPrevMap,
  mergeWithPrev,
} from "../../utils/fsfunc";
import { readDir } from "@tauri-apps/plugin-fs";
import { useGit } from "./GitContext";
interface EditorContextType {
  workspace: string | null;
  setWorkspace: React.Dispatch<React.SetStateAction<string | null>>;

  openFiles: FsNode[];
  setOpenFiles: React.Dispatch<React.SetStateAction<FsNode[]>>;

  activeFile: FsNode | null;
  setActiveFile: React.Dispatch<React.SetStateAction<FsNode | null>>;

  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;

  tabList: string[];
  setTabList: React.Dispatch<React.SetStateAction<string[]>>;

  reloadWorkspace: () => Promise<void>;
  roots: FsNode[] | null;
  setRoots: React.Dispatch<React.SetStateAction<FsNode[] | null>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  handleOpenFolder: () => void;
  handleCreateNewFile: () => void;
  handleOpenFile: () => void;
  handleClone: (clone_url: string) => void;
  errorMessage: string | null;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  cloneDialogOpen: boolean;
  setCloneDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  repos: GitRepo[] | null;
  setRepos: React.Dispatch<React.SetStateAction<GitRepo[] | null>>;
  repoUrl: string;
  setRepoUrl: React.Dispatch<React.SetStateAction<string>>;
  action: string | null;
  setAction: React.Dispatch<React.SetStateAction<string | null>>;
  cloneMethod: "github" | "link";
  setCloneMethod: React.Dispatch<React.SetStateAction<"github" | "link">>;
  getUserRepos: () => Promise<void>;
  reloadFileContent: (gitfile: Gitfile) => Promise<void>;
  viewRefs: React.MutableRefObject<Record<string, EditorView>>;
  getSingleFileGitState: (filePath: string) => Promise<"U" | "M" | "A" | "">;
  onSave: (node: FsNode) => Promise<void>;
  normalizeLF: (s: string) => string;
  recents: Recents[];
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRecents: React.Dispatch<React.SetStateAction<Recents[]>>;
  targetNode: FsNode | null;
  setTargetNode: React.Dispatch<React.SetStateAction<FsNode | null>>;
  dragNodeRef: React.RefObject<FsNode | null>;
  dragOverNodeRef: React.RefObject<FsNode | null>;
  // createTab: () => Promise<void>;
  // tabs: Tab[];
  // setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
  // activeId: string | null;
  // setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  // panelRef: React.RefObject<HTMLDivElement | null>;
}
const EditorContext = createContext<EditorContextType | undefined>(undefined);
export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, getToken } = useAuth();
  const { leftContent } = useLayout();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [recents, setRecents] = useState<Recents[]>([]);
  const [workspace, setWorkspace] = useState<string | null>(
    localStorage.getItem("workspacePath")
  );
  const {
    // status,
    refreshStatus,
    // setIsInit,
    // fetchGraph,
    // fetchSyncStatus,
    // runGit,
  } = useGit();
  const dragNodeRef = useRef<FsNode | null>(null);
  const dragOverNodeRef = useRef<FsNode | null>(null);
  const viewRefs = useRef<Record<string, EditorView>>({});
  const [cloneMethod, setCloneMethod] = useState<"github" | "link">("link");
  const [openFiles, setOpenFiles] = useState<FsNode[]>([]);
  const [activeFile, setActiveFile] = useState<FsNode | null>(null);
  const [targetNode, setTargetNode] = useState<FsNode | null>(null);
  const [query, setQuery] = useState("");
  const [tabList, setTabList] = useState<string[]>(["Home", "Trello"]);
  const [activeTab, setActiveTab] = useState("Home");
  const [error, setError] = useState<string | null>(null);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repos, setRepos] = useState<GitRepo[] | null>(null);
  const [roots, setRoots] = useState<FsNode[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // const [tabs, setTabs] = useState<Tab[]>([]);
  // const [activeId, setActiveId] = useState<string | null>(null);
  // const shell = navigator.platform.startsWith("Win")
  //   ? "powershell.exe"
  //   : "/bin/bash";
  // const panelRef = useRef<HTMLDivElement>(null);
  // const cwd = workspace || undefined;
  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (!selected || Array.isArray(selected)) return;
      setActiveTab("Splash");
      setWorkspace(selected);
      localStorage.setItem("workspacePath", selected);
      setError(null);
      localStorage.setItem(
        "recents",
        JSON.stringify({
          name: selected.split("/").pop(),
          path: selected,
          lastOpened: new Date(),
          language: "unknown",
        })
      );
    } catch (e: any) {
      message(`Failed to open folder: ${e.message}`, {
        title: "Error",
        kind: "error",
      });
      console.error(e);
    }
  };
  const handleClone = async (clone_url: string) => {
    if (!clone_url) return;
    try {
      let repoName = clone_url.split("/").pop();
      if (repoName?.endsWith(".git")) repoName = repoName.slice(0, -4);
      console.log(clone_url, repoName);
      let targetDir = await open({
        directory: true,
        multiple: false,
        title: "Select target folder",
      });
      if (!targetDir) return;
      if (repoName) {
        targetDir = await join(targetDir, repoName);
      }
      await invoke("git_clone", { repoUrl: clone_url, targetDir });
      setActiveTab("Splash");
      setWorkspace(targetDir);
      localStorage.setItem("workspacePath", targetDir);
      setCloneDialogOpen(false);
      setRepoUrl("");
      setAction(null);
      localStorage.setItem(
        "recents",
        JSON.stringify({
          name: targetDir.split("/").pop(),
          path: targetDir,
          lastOpened: new Date(),
          language: "unknown",
        })
      );
    } catch (err: any) {
      message(`Clone failed: ${err.message}`, {
        title: "Error",
        kind: "error",
      });
      console.error("Clone failed:", err);
    }
  };
  const reloadWorkspace = async () => {
    if (!workspace) return;
    try {
      const entries = await readDir(workspace);
      const nodes: FsNode[] = await Promise.all(
        entries.map(async (e: DirEntry) => ({
          name: e.name,
          path: await join(workspace, e.name),
          isDirectory: e.isDirectory,
        }))
      );
      const sorted = sortNodes(nodes);
      setRoots((prevRoots) => {
        const prevMap = buildPrevMap(prevRoots);
        const expandedMap = prevRoots ? preserveExpanded(prevRoots) : {};
        const merged = mergeWithPrev(sorted, prevMap, expandedMap);
        return merged;
      });
      // If refreshStatus triggers async work that reads `roots`, prefer to call it from a useEffect
      // that watches roots. If not, calling here is usually fine.
      await refreshStatus();
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(String(e?.message ?? e));
    }
  };
  const getSingleFileGitState = async (
    filePath: string
  ): Promise<"U" | "M" | "A" | ""> => {
    try {
      const result = await invoke<{ status: string }>("git_command", {
        action: "file_status",
        payload: { file: filePath, workspace },
      });
      return (result.status as "U" | "M" | "A" | "") ?? "";
    } catch (e) {
      console.warn("git file_status failed:", e);
      return "";
    }
  };
  const handleCreateNewFile = async () => {
    try {
      const path = await save({
        title: "Create new file",
        filters: [{ name: "All Files", extensions: ["*"] }],
      });

      if (!path) return;

      const content = "";
      // 🔥 Actually create the file on disk
      await writeTextFile(path, content);
      // Update React state
      setActiveTab("Editor");
      setActiveFile({ path, content } as FsNode);
      setOpenFiles((prev) =>
        prev.find((f) => f.path === path)
          ? prev
          : [...prev, { path, content } as FsNode]
      );
      setTargetNode({
        path: path.split("\\").slice(0, -1).join("\\"),
      } as FsNode);
      console.log(`✅ Created new file at ${path}`);
    } catch (err: any) {
      message(`Error creating new file: ${err.message}`, {
        title: "Error",
        kind: "error",
      });
      console.error("Error creating new file:", err);
    }
  };
  const getUserRepos = async () => {
    if (!isSignedIn) return;
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error: ${res.status} - ${text}`);
      }
      const data = await res.json();
      const res2 = await fetch(
        `https://api.github.com/users/${data.user.username}/repos`
      );
      const r = await res2.json();
      console.log(r);
      setRepos(r);
    } catch (err) {
      message(`Error getting user repos: ${err}`, {
        title: "Fetch Error",
        kind: "error",
      });
      console.log(err);
    }
  };
  const reloadFileContent = async (gitfile: Gitfile) => {
    if (!workspace) return;
    console.log("Reloading file content:", gitfile.path);
    const absPath = gitfile.path.includes(workspace)
      ? gitfile.path
      : await join(workspace, gitfile.path);
    const content = await readTextFile(absPath);
    const status = await getSingleFileGitState(absPath);
    const view = viewRefs.current[absPath];
    if (view) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content,
        },
      });
    }
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === absPath ? { ...f, content, isDirty: false, status } : f
      )
    );
  };
  const normalizeLF = (s: string) => s.replace(/\r?\n/g, "\r\n");

  async function onSave(node: FsNode) {
    if (!node) return;
    const normalized = normalizeLF(node?.content ?? "");
    await writeTextFile(node.path, normalized);
    const status = await getSingleFileGitState(node.path);
    console.log(status);
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === node.path
          ? {
              ...f,
              status: status,
              isDirty: false,
            }
          : f
      )
    );
    if (leftContent === "files") {
      reloadWorkspace();
    } else if (leftContent === "git") {
      refreshStatus();
    }
  }
  const handleOpenFile = async () => {
    const path = await open({
      directory: false,
      multiple: false,
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
    if (!path) return;
    const content = await readTextFile(path);
    setActiveFile({ path, content } as FsNode);
    setOpenFiles((prev) =>
      prev.find((f) => f.path === path)
        ? prev
        : [...prev, { path, content } as FsNode]
    );
  };
  // const createTab = async () => {
  //   const id = crypto.randomUUID();
  //   const term = new XTerm({
  //     fontFamily: "Menlo, monospace",
  //     fontSize: 14,
  //     cursorBlink: true,
  //     convertEol: true,
  //     scrollback: 1000,
  //     theme: { background: "hsl(240, 5.9%, 10%)" },
  //   });
  //   const fit = new FitAddon();
  //   const search = new SearchAddon();
  //   const links = new WebLinksAddon(async (event, uri) => {
  //     if (event.metaKey || event.ctrlKey) await openLink(uri);
  //   });
  //   term.loadAddon(fit);
  //   term.loadAddon(search);
  //   term.loadAddon(links);
  //   // Spawn PTY
  //   const pty = spawn(shell, ["-NoLogo", "-NoProfile"], {
  //     cols: term.cols,
  //     rows: term.rows,
  //     cwd,
  //   });
  //   let commandBuffer = "";
  //   pty.onData((d) => term.write(d));
  //   term.onData((d) => {
  //     // Enter pressed → command submitted
  //     if (d === "\r") {
  //       // Get the actual command from the terminal buffer instead of relying on commandBuffer
  //       const cursorY = term.buffer.active.cursorY;
  //       const line = term.buffer.active.getLine(cursorY);
  //       let command = "";
  //       if (line) {
  //         // Extract text from the line, starting after the prompt
  //         const lineText = line.translateToString(true);
  //         // Find the command after the prompt (typically ends with >, $, or %)
  //         const promptMatch = lineText.match(/[>$%]\s*(.*)/);
  //         command = promptMatch ? promptMatch[1].trim() : lineText.trim();
  //       }
  //       console.log("Command:", command);
  //       // if (command.startsWith("git commit")) {
  //       //   setTimeout(async () => {
  //       //     await refreshStatus();
  //       //     await fetchGraph();
  //       //     await fetchSyncStatus();
  //       //   }, 0);
  //       // }
  //       if (command.startsWith("git init")) {
  //         // Run AFTER command executes
  //         setTimeout(() => {
  //           setIsInit(true);
  //           refreshStatus();
  //         }, 0);
  //       }
  //       if (command.startsWith("git ")) {
  //         // Run AFTER command executes

  //         setTimeout(async () => {
  //           if (status.branch === "master") {
  //             await runGit("renamebranch", { cwd: workspace });
  //             status.branch = "main";
  //           }
  //           await refreshStatus();
  //           await fetchGraph();
  //           await fetchSyncStatus();
  //         }, 0);
  //       }
  //       commandBuffer = "";
  //     } else if (d === "\u007f") {
  //       commandBuffer = commandBuffer.slice(0, -1);
  //     } else if (d.length === 1) {
  //       commandBuffer += d;
  //     }
  //     // Always pass input to PTY
  //     pty.write(d);
  //   });
  //   const resize = () => {
  //     fit.fit();
  //     pty.resize(term.cols, term.rows);
  //   };
  //   term.onResize(resize);

  //   // Permanent container
  //   const container = document.createElement("div");
  //   container.style.position = "absolute";
  //   container.style.inset = "0";
  //   container.style.display = "none";

  //   if (panelRef.current) {
  //     panelRef.current.appendChild(container);
  //   }
  //   const title = `Terminal ${tabs.length + 1}`;
  //   const newTab: Tab = { id, title, term, fit, pty, container };
  //   setTabs((prev) => [...prev, newTab]);
  //   setActiveId(id);
  //   requestAnimationFrame(resize);
  // };
  return (
    <EditorContext.Provider
      value={{
        workspace,
        setWorkspace,
        openFiles,
        normalizeLF,
        setOpenFiles,
        activeFile,
        setActiveFile,
        query,
        setQuery,
        tabList,
        setTabList,
        activeTab,
        setActiveTab,
        handleOpenFolder,
        handleCreateNewFile,
        handleOpenFile,
        handleClone,
        errorMessage,
        setErrorMessage,
        reloadWorkspace,
        roots,
        setRoots,
        error,
        setError,
        cloneDialogOpen,
        setCloneDialogOpen,
        repos,
        setRepos,
        repoUrl,
        setRepoUrl,
        action,
        setAction,
        dialogOpen,
        setDialogOpen,
        cloneMethod,
        setCloneMethod,
        getUserRepos,
        reloadFileContent,
        viewRefs,
        getSingleFileGitState,
        onSave,
        recents,
        setRecents,
        targetNode,
        setTargetNode,
        dragNodeRef,
        dragOverNodeRef,
        // createTab,
        // tabs,
        // setTabs,
        // activeId,
        // setActiveId,
        // panelRef,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
};
