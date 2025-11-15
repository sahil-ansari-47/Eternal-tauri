import { createContext, useContext, useState, useRef } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { DirEntry, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { EditorView } from "codemirror";
import { useAuth } from "@clerk/clerk-react";
import { applyExpanded, preserveExpanded, sortNodes } from "../../utils/fsfunc";
import { readDir } from "@tauri-apps/plugin-fs";
import { useGit } from "./GitContext";
interface EditorContextType {
  workspace: string | null;
  setWorkspace: React.Dispatch<React.SetStateAction<string | null>>;

  openFiles: File[];
  setOpenFiles: React.Dispatch<React.SetStateAction<File[]>>;

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
  reloadFileContent: (filePath: string) => Promise<void>;
  viewRefs: React.MutableRefObject<Record<string, EditorView>>;
  getSingleFileGitState: (filePath: string) => Promise<"U" | "M" | "A" | "">;
  onSave: (
    filePath: string,
    newContent: string,
    convert: boolean
  ) => Promise<void>;
  normalize: (s: string) => string;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [workspace, setWorkspace] = useState<string | null>(
    localStorage.getItem("workspacePath")
  );
  const { refreshStatus } = useGit();
  const viewRefs = useRef<Record<string, EditorView>>({});
  const [cloneMethod, setCloneMethod] = useState<"github" | "link">("link");
  const [openFiles, setOpenFiles] = useState<File[]>([]);
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
      setWorkspace(selected);
      localStorage.setItem("workspacePath", selected);
      setError(null);
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
      setWorkspace(targetDir);
      localStorage.setItem("workspacePath", targetDir);
      setCloneDialogOpen(false);
      setRepoUrl("");
      setAction(null);
    } catch (err) {
      console.error("Clone failed:", err);
    }
  };
  const getSingleFileGitState = async (
    filePath: string
  ): Promise<"U" | "M" | "A" | "D" | ""> => {
    try {
      const result = await invoke<{ status: string }>("git_command", {
        action: "file_status",
        payload: { file: filePath, workspace },
      });
      console.log(result);
      return (result.status as "U" | "M" | "A" | "D") ?? "";
    } catch (e) {
      console.warn("git file_status failed:", e);
      return "";
    }
  };
  const reloadWorkspace = async () => {
    if (!workspace) return;
    try {
      const expandedMap = roots ? preserveExpanded(roots) : {};
      const entries = await readDir(workspace);
      const nodes: FsNode[] = await Promise.all(
        entries.map(async (e: DirEntry) => ({
          name: e.name,
          path: await join(workspace, e.name),
          isDirectory: e.isDirectory,
        }))
      );
      const sorted = sortNodes(nodes);
      // console.log(sorted);
      setRoots(applyExpanded(sorted, expandedMap));
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
          : [...prev, { path, content } as File]
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
      // console.log(data);
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
  const reloadFileContent = async (filePath: string) => {
    if (!workspace) return;
    const absPath = await join(workspace, filePath);
    const content = await readTextFile(absPath);
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === absPath ? { ...f, content, isDirty: false } : f
      )
    );
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
    onSave(absPath, content, false);
  };
  const normalize = (s: string) => s.replace(/\n/g, "\r\n");
  const onSave = async (
    filePath: string,
    newContent: string,
    convert: boolean
  ) => {
    const file = openFiles.find((f) => f.path === filePath);
    if (!file) return;
    if (convert) newContent = normalize(newContent);
    await writeTextFile(file.path, newContent);
    console.log(JSON.stringify(file.content));
    console.log(JSON.stringify(newContent));
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === filePath ? { ...f, content: newContent, isDirty: false } : f
      )
    );
    const newGitState = await getSingleFileGitState(filePath);
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === filePath ? { ...f, status: newGitState } : f))
    );
    refreshStatus();
  };
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
        : [...prev, { path, content } as File]
    );
  };
  return (
    <EditorContext.Provider
      value={{
        workspace,
        setWorkspace,
        openFiles,
        normalize,
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
