import { createContext, useContext, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
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
  handleClone: (clone_url: string) => void;
  errorMessage: string | null;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  repoUrl: string;
  setRepoUrl: React.Dispatch<React.SetStateAction<string>>;
  action: string | null;
  setAction: React.Dispatch<React.SetStateAction<string | null>>;
  cloneMethod: "github" | "link";
  setCloneMethod: React.Dispatch<React.SetStateAction<"github" | "link">>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [workspace, setWorkspace] = useState<string | null>(
    localStorage.getItem("workspacePath")
  );
  const [cloneMethod, setCloneMethod] = useState<"github" | "link">("github");
  const [openFiles, setOpenFiles] = useState<File[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tabList, setTabList] = useState<string[]>(["Home", "Trello"]);
  const [activeTab, setActiveTab] = useState("Home");
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [action, setAction] = useState<string | null>(null);
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
      setDialogOpen(false);
      setRepoUrl("");
      setAction(null);
    } catch (err) {
      console.error("Clone failed:", err);
    }
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
        handleClone,
        errorMessage,
        setErrorMessage,
        error,
        setError,
        dialogOpen,
        setDialogOpen,
        repoUrl,
        setRepoUrl,
        action,
        setAction,
        cloneMethod,
        setCloneMethod,
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
