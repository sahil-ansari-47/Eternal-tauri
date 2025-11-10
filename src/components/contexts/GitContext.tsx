import { createContext, useContext, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditor } from "./EditorContext";
interface GitContextType {
  status: GitStatus;
  setStatus: React.Dispatch<React.SetStateAction<GitStatus>>;

  graphData: GitGraphNode[];
  setGraphData: React.Dispatch<React.SetStateAction<GitGraphNode[]>>;

  collapsed: { [key: string]: boolean };
  setCollapsed: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  isInit: boolean;
  setIsInit: React.Dispatch<React.SetStateAction<boolean>>;

  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  error: GitError | null;
  setError: React.Dispatch<React.SetStateAction<GitError | null>>;

  refreshStatus: () => Promise<void>;
  runGit: <T>(action: string, payload?: any) => Promise<T>;
}

const GitContext = createContext<GitContextType | undefined>(undefined);

export const GitProvider = ({ children }: { children: React.ReactNode }) => {
  const { workspace } = useEditor();
  const [status, setStatus] = useState<GitStatus>({
    staged: [],
    unstaged: [],
    untracked: [],
    branch: "master",
    origin: "",
  });
  const [graphData, setGraphData] = useState<GitGraphNode[]>([]);
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    changes: false,
    graph: false,
  });
  const [isInit, setIsInit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<GitError | null>(null);
  async function refreshStatus() {
    setLoading(true);
    try {
      const payload = await runGit<GitStatus>("status", { workspace });
      setStatus({
        staged: payload.staged || [],
        unstaged: payload.unstaged || [],
        untracked: payload.untracked || [],
        branch: payload.branch || "master",
        origin: payload.origin || "",
      });
      setIsInit(true);
    } catch (e: any) {
      setIsInit(false);
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function runGit<T>(action: string, payload = {}): Promise<T> {
    try {
      console.log("Running git command:", action);
      const result = await invoke<T>("git_command", { action, payload });
      console.log(result);
      return result;
    } catch (e: any) {
      const err: GitError = new Error(e.message || String(e));
      err.code = e.code || "GIT_ACTION_FAILED";
      err.details = e.stack || undefined;
      throw err;
    }
  }
  return (
    <GitContext.Provider
      value={{
        status,
        setStatus,
        loading,
        setLoading,
        graphData,
        setGraphData,
        collapsed,
        setCollapsed,
        isInit,
        setIsInit,
        error,
        setError,
        refreshStatus,
        runGit,
      }}
    >
      {children}
    </GitContext.Provider>
  );
};
export const useGit = () => {
  const ctx = useContext(GitContext);
  if (!ctx) throw new Error("useGit must be used within GitProvider");
  return ctx;
};
