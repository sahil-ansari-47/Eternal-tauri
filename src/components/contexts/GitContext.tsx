import { createContext, useContext, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUser } from "@clerk/clerk-react";
import { message } from "@tauri-apps/plugin-dialog";
import { useEffect } from "react";
import { join } from "@tauri-apps/api/path";
import { exists, remove } from "@tauri-apps/plugin-fs";
interface GitContextType {
  status: GitStatus;
  setStatus: React.Dispatch<React.SetStateAction<GitStatus>>;
  remoteBranchExists: boolean | null;
  graphData: GitGraphNode[];
  setGraphData: React.Dispatch<React.SetStateAction<GitGraphNode[]>>;
  collapsed: { [key: string]: boolean };
  setCollapsed: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  isInit: boolean;
  setIsInit: React.Dispatch<React.SetStateAction<boolean>>;

  loading: boolean;
  loadingCount: number;
  incrementLoading: () => void;
  decrementLoading: () => void;

  error: GitError | null;
  setError: React.Dispatch<React.SetStateAction<GitError | null>>;

  refreshStatus: () => Promise<void>;
  runGit: <T>(action: string, payload?: any) => Promise<T>;

  getUserAccessToken: () => Promise<string | null>;
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
  handleInit: () => Promise<void>;
  fetchGraph: () => Promise<void>;
  branches: string[];
  setBranches: React.Dispatch<React.SetStateAction<string[]>>;
}
const GitContext = createContext<GitContextType | undefined>(undefined);
export const GitProvider = ({ children }: { children: React.ReactNode }) => {
  const workspace = localStorage.getItem("workspacePath");
  const { user } = useUser();
  const [status, setStatus] = useState<GitStatus>({
    staged: [],
    unstaged: [],
    untracked: [],
    ignored: [],
    branch: "master",
    origin: "",
  });
  const [graphData, setGraphData] = useState<GitGraphNode[]>([]);
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    changes: false,
    graph: false,
  });
  const [branches, setBranches] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    ahead: number;
    behind: number;
  }>({ ahead: 0, behind: 0 });
  const [commitMsg, setCommitMsg] = useState<string>("");
  const [isInit, setIsInit] = useState<boolean>(false);
  const [loadingCount, setLoadingCount] = useState<number>(0);
  const [error, setError] = useState<GitError | null>(null);
  const [remoteBranchExists, setRemoteBranchExists] = useState<boolean | null>(
    null
  );

  // Computed loading state based on counter
  const loading = loadingCount > 0;

  const incrementLoading = () => setLoadingCount((prev) => prev + 1);
  const decrementLoading = () =>
    setLoadingCount((prev) => Math.max(0, prev - 1));

  async function refreshStatus() {
    if (!workspace) return;
    incrementLoading();
    try {
      const payload = await runGit<GitStatus>("status", { workspace });
      const fixed = normalizeGitPayloadPaths(payload);
      setStatus(fixed);
      origin = fixed.origin || "";
      setIsInit(true);
    } catch (e: any) {
      setIsInit(false);
      setError(e);
    } finally {
      setError(null);
      decrementLoading();
    }
  }
  function normalizeGitPayloadPaths(status: GitStatus): GitStatus {
    const fixSlash = (p: string) => p.replace(/\//g, "\\");
    return {
      staged: status.staged.map((f) => ({ ...f, path: fixSlash(f.path) })),
      unstaged: status.unstaged.map((f) => ({ ...f, path: fixSlash(f.path) })),
      untracked: status.untracked.map((f) => ({
        ...f,
        path: fixSlash(f.path),
      })),
      ignored: status.ignored.map((f) => ({ ...f, path: fixSlash(f.path) })),
      branch: status.branch || "master",
      origin: status.origin,
    };
  }
  async function runGit<T>(action: string, payload = {}): Promise<T> {
    try {
      const result = await invoke<T>("git_command", { action, payload });
      return result;
    } catch (e: any) {
      // Check if it's a lock file conflict (exit code 128 with index.lock message)
      const isLockConflict =
        e.code === 128 &&
        e.message?.includes("index.lock") &&
        e.message?.includes("File exists");

      if (isLockConflict && (payload as any).workspace) {
        try {
          // Attempt to remove the lock file
          const lockFilePath = await join(
            (payload as any).workspace,
            ".git",
            "index.lock"
          );
          const lockExists = await exists(lockFilePath);
          if (lockExists) {
            await remove(lockFilePath);
            // Retry the operation once
            const retryResult = await invoke<T>("git_command", {
              action,
              payload,
            });
            return retryResult;
          }
        } catch (lockError) {
          // If lock file removal fails, continue with original error
          console.warn("Failed to remove git lock file:", lockError);
        }
      }

      const err: GitError = new Error(e.message || String(e));
      err.code = e.code || "GIT_ACTION_FAILED";
      err.details = e.stack || undefined;
      throw err;
    }
  }
  const getUserAccessToken = async () => {
    try {
      const sk = import.meta.env.VITE_CLERK_SECRET_KEY;
      // console.log(user?.id, sk);
      const token = await invoke<string>("get_user_access_token", {
        userId: user?.id,
        sk,
      });
      return token;
    } catch (e: any) {
      message(
        e.message ||
          "Failed to get user access token. Try logging in to your github account.",
        {
          title: "Error",
          kind: "error",
        }
      );
      return null;
    }
  };

  async function checkRemoteBranchExists(): Promise<boolean> {
    const token = await getUserAccessToken();
    if (!token) return false;
    const reponame = workspace?.split("\\").pop();
    let branch = status.branch;
    const res = await fetch(
      `https://api.github.com/repos/${user?.username}/${reponame}/branches/${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    return res.status === 200;
  }
  useEffect(() => {
    if (isInit && workspace && status.branch && user?.username) {
      checkRemoteBranchExists().then(setRemoteBranchExists);
    }
  }, [status.branch]);
  async function fetchSyncStatus() {
    if (!workspace) return;
    incrementLoading();
    try {
      const result = await runGit<{ ahead: number; behind: number }>(
        "sync-status",
        { workspace }
      );
      setSyncStatus(result);
    } catch (err) {
      console.error("Failed to get sync status", err);
    } finally {
      decrementLoading();
      refreshStatus();
    }
  }
  async function handleInit() {
    if (!workspace) return;
    incrementLoading();
    try {
      await runGit("init", { workspace });
      await refreshStatus();
      fetchGraph();
    } catch (e: any) {
      setError(e);
    } finally {
      setError(null);
      decrementLoading();
    }
  }
  async function fetchGraph() {
    try {
      const payload = await runGit<GitGraphNode[]>("graph", {
        workspace,
      });
      // console.log("graph", payload);
      setGraphData(payload || []);
    } catch {
      setGraphData([]);
    }
  }
  async function handlePush() {
    if (!workspace) return;
    incrementLoading();
    try {
      await runGit("push", {
        workspace,
        remote: "origin",
        branch: status.branch || "master",
      });
      await refreshStatus();
      await fetchSyncStatus();
    } catch (e: any) {
      console.log(e);
      message(
        "Cannot Push: You are not authorised to push changes to this repository. Ask the repository owner for access.",
        { title: "Push Error", kind: "error" }
      );
    } finally {
      decrementLoading();
    }
  }
  async function handleSetRemote(url: string) {
    if (!workspace) return;
    if (status.origin) return;
    incrementLoading();
    try {
      await runGit("set-remote", {
        workspace,
        url,
        branch: status.branch || "master",
      });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      decrementLoading();
    }
  }

  const handlePublish = async (name: string, priv: boolean = false) => {
    const remotebranchexists = await checkRemoteBranchExists();
    if (!remotebranchexists) {
      const token = await getUserAccessToken();
      if (!token) return;
      await fetch(`https://api.github.com/user/repos`, {
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
      const remoteUrl = `https://github.com/${user?.username}/${name
        .trim()
        .split(" ")
        .join("-")}.git`;

      setRemoteBranchExists(true);
      await handleSetRemote(remoteUrl);
      await refreshStatus();
      await handlePush();
      await fetchGraph();
      await fetchSyncStatus();
    } else {
      message(
        "Cannot Publish: This repository with this branch name already exists on your GitHub account.",
        { title: "Publish Error", kind: "error" }
      );
    }
  };
  return (
    <GitContext.Provider
      value={{
        status,
        remoteBranchExists,
        setStatus,
        loading,
        loadingCount,
        incrementLoading,
        decrementLoading,
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
        handleSetRemote,
        handleInit,
        fetchGraph,
        branches,
        setBranches,
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
