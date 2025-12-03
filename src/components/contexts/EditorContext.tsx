import { createContext, useContext, useState, useRef } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { DirEntry, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { EditorView } from "codemirror";
import { useAuth } from "@clerk/clerk-react";
import {
  preserveExpanded,
  sortNodes,
  buildPrevMap,
  mergeWithPrev,
  // readTree,
  // applyExpanded
} from "../../utils/fsfunc";
import { readDir } from "@tauri-apps/plugin-fs";
import { useGit } from "./GitContext";
interface EditorContextType {
  workspace: string | null;
  setWorkspace: React.Dispatch<React.SetStateAction<string | null>>;

  openFiles: FsNode[];
  setOpenFiles: React.Dispatch<React.SetStateAction<FsNode[]>>;

  activePath: string | null;
  setActivePath: React.Dispatch<React.SetStateAction<string | null>>;

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
  setRecents: React.Dispatch<React.SetStateAction<Recents[]>>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [recents, setRecents] = useState<Recents[]>([]);
  const [workspace, setWorkspace] = useState<string | null>(
    localStorage.getItem("workspacePath")
  );
  const { refreshStatus } = useGit();
  const viewRefs = useRef<Record<string, EditorView>>({});
  const [cloneMethod, setCloneMethod] = useState<"github" | "link">("link");
  const [openFiles, setOpenFiles] = useState<FsNode[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tabList, setTabList] = useState<string[]>(["Home", "Trello"]);
  const [activeTab, setActiveTab] = useState("Home");
  const [error, setError] = useState<string | null>(null);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitRepo[] | null>(null);
  const [roots, setRoots] = useState<FsNode[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      console.error(e);
      setError(e?.message ?? String(e));
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
    } catch (err) {
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
      setActivePath(path);
      setOpenFiles((prev) =>
        prev.find((f) => f.path === path)
          ? prev
          : [...prev, { path, content } as FsNode]
      );
      console.log(`✅ Created new file at ${path}`);
    } catch (err) {
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
    if (!node.content) return;
    const normalized = normalizeLF(node.content);
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
  }
  const handleOpenFile = async () => {
    const path = await open({
      directory: false,
      multiple: false,
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
    if (!path) return;
    const content = await readTextFile(path);
    setActivePath(path);
    setOpenFiles((prev) =>
      prev.find((f) => f.path === path)
        ? prev
        : [...prev, { path, content } as FsNode]
    );
  };
  return (
    <EditorContext.Provider
      value={{
        workspace,
        setWorkspace,
        openFiles,
        normalizeLF,
        setOpenFiles,
        activePath,
        setActivePath,
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
        cloneMethod,
        setCloneMethod,
        getUserRepos,
        reloadFileContent,
        viewRefs,
        getSingleFileGitState,
        onSave,
        recents,
        setRecents,
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
