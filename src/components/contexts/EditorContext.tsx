import { createContext, useContext, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "@clerk/clerk-react";
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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [workspace, setWorkspace] = useState<string | null>(
    localStorage.getItem("workspacePath")
  );
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
      console.log(data);
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
