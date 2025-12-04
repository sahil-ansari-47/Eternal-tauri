import { createContext, useContext, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUser } from "@clerk/clerk-react";
import { message } from "@tauri-apps/plugin-dialog";
import { useEffect } from "react";
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
  // handleSetUpstream: () => Promise<void>;
  fetchSyncStatus: () => Promise<void>;
  handlePush: () => Promise<void>;
  commitMsg: string;
  setCommitMsg: React.Dispatch<React.SetStateAction<string>>;
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
  const [syncStatus, setSyncStatus] = useState<{
    ahead: number;
    behind: number;
  }>({ ahead: 0, behind: 0 });
  const [commitMsg, setCommitMsg] = useState<string>("");
  const [isInit, setIsInit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<GitError | null>(null);
  const [remoteBranchExists, setRemoteBranchExists] = useState<boolean | null>(
    null
  );

  let origin = "";

  async function refreshStatus() {
    if (!workspace) return;
    setLoading(true);
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
      setLoading(false);
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
      const err: GitError = new Error(e.message || String(e));
      err.code = e.code || "GIT_ACTION_FAILED";
      err.details = e.stack || undefined;
      throw err;
    }
  }
  const getUserAccessToken = async () => {
    const sk = import.meta.env.VITE_BACKEND_SECRET_KEY;
    // console.log(user?.id, sk);
    const token = await invoke<string>("get_user_access_token", {
      userId: user?.id,
      sk,
    });
    return token;
  };

  async function checkRemoteBranchExists(): Promise<boolean> {
    const token = await getUserAccessToken();
    const reponame = workspace?.split("\\").pop();
    const branch = status.branch;

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
    if (status.branch) {
      checkRemoteBranchExists().then(setRemoteBranchExists);
    }
  }, [status.branch, status.origin]);
  async function fetchSyncStatus() {
    if (!workspace) return;
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
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("push", {
        workspace,
        remote: origin || "origin",
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
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handleSetRemote(url: string) {
    if (!workspace) return;
    if (status.origin) return;
    setLoading(true);
    try {
      origin = url;
      await runGit("set-remote", {
        workspace,
        url,
        branch: status.branch || "master",
      });
      await handleSetUpstream();
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetUpstream() {
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("set-upstream", {
        workspace,
        // branch: status.branch || "master",
      });
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const handlePublish = async (name: string, priv: boolean = false) => {
    const remotebranchexists = await checkRemoteBranchExists();
    if (!remotebranchexists) {
      const token = await getUserAccessToken();
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
      const remoteUrl = `https://github.com/${user?.username}/${name}.git`;
      await handleSetRemote(remoteUrl);
      setRemoteBranchExists(true);
      await refreshStatus();
      await handlePush();
    } else {
      message(
        "Cannot Publish: A repository with this branch name already exists on your GitHub account.",
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
