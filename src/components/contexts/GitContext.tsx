import { createContext, useContext, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUser } from "@clerk/clerk-react";
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

  getUserAccessToken: () => Promise<string>;
  handlePublish: (name: string, priv?: boolean) => Promise<void>;

  syncStatus: {
    ahead: number;
    behind: number;
  };
  setSyncStatus: React.Dispatch<
    React.SetStateAction<{ ahead: number; behind: number }>
  >;
  handleSetRemote: (url: string) => Promise<void>;
  fetchSyncStatus: () => Promise<void>;
  handlePush: () => Promise<void>;
  commitMsg: string;
  setCommitMsg: React.Dispatch<React.SetStateAction<string>>;
  handleCommit: () => Promise<void>;
}
const GitContext = createContext<GitContextType | undefined>(undefined);
export const GitProvider = ({ children }: { children: React.ReactNode }) => {
  const workspace = localStorage.getItem("workspacePath"); 
  const { user } = useUser();
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
  const [syncStatus, setSyncStatus] = useState<{
    ahead: number;
    behind: number;
  }>({ ahead: 0, behind: 0 });
  const [commitMsg, setCommitMsg] = useState<string>("");
  const [isInit, setIsInit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<GitError | null>(null);
  let origin = "";
    async function refreshStatus() {
    setLoading(true);
    try {
      const payload = await runGit<GitStatus>("status", { workspace });
      setStatus({
        staged: payload.staged || [],
        unstaged: payload.unstaged || [],
        untracked: payload.untracked || [],
        branch: payload.branch || "master",
        origin: payload.origin,
      });
      origin = payload.origin || "";
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
      // console.log("Running git command:", action);
      const result = await invoke<T>("git_command", { action, payload });
      // console.log(result);
      return result;
    } catch (e: any) {
      const err: GitError = new Error(e.message || String(e));
      err.code = e.code || "GIT_ACTION_FAILED";
      err.details = e.stack || undefined;
      throw err;
    }
  }
  const getUserAccessToken = async () => {
    const sk = import.meta.env.VITE_BACKEND_SECRET_KEY;
    console.log(user?.id, sk);
    const token = await invoke<string>("get_user_access_token", {
      userId: user?.id,
      sk,
    });
    return token;
  };
  async function fetchSyncStatus() {
    setLoading(true);
    try {
      const result = await runGit<{ ahead: number; behind: number }>(
        "sync-status",
        { workspace }
      );
      setSyncStatus(result);
    } catch (err) {
      console.error("Failed to get sync status", err);
    } finally {
      setLoading(false);
    }
  }
  async function handlePush() {
    setLoading(true);
    try {
      await runGit("push", {
        workspace,
        remote: origin,
        branch: status.branch || "master",
      });
      await refreshStatus();
      await fetchSyncStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handleSetRemote(url: string) {
    setLoading(true);
    try {
      await runGit("set-remote", { workspace, url });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handleCommit() {
    setLoading(true);
    try {
      await runGit("commit", {
        workspace,
        message: commitMsg.trim() === "" ? "initial commit" : commitMsg,
      });
      setCommitMsg("");
      await refreshStatus();
      // fetchGraph();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  const handlePublish = async (name: string, priv: boolean = false) => {
    const token = localStorage.getItem("token");
    console.log(name, token);
    await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        name: name,
        private: priv,
      }),
    });
    const remoteUrl = `https://github.com/${user?.username}/${name}.git`;
    await handleSetRemote(remoteUrl);
    await handlePush();
  };
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
        getUserAccessToken,
        handlePublish,
        syncStatus,
        setSyncStatus,
        fetchSyncStatus,
        handlePush,
        commitMsg,
        setCommitMsg,
        handleCommit,
        handleSetRemote,
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
