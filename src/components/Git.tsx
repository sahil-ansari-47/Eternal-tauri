import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  Undo,
  RefreshCcw,
  ArrowDownToDot,
  ArrowUpFromDot,
  FileSymlinkIcon,
  Plus,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEditor } from "./contexts/EditorContext";
import { useGit } from "./contexts/GitContext";
import { open as openLink } from "@tauri-apps/plugin-shell";
import NoWorkspace from "./NoWorkspace";
import { readTextFile } from "@tauri-apps/plugin-fs";
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

export default function Git() {
  const { workspace, setActivePath, setOpenFiles } = useEditor();
  const {
    status,
    setStatus,
    graphData,
    setGraphData,
    collapsed,
    setCollapsed,
    isInit,
    setIsInit,
  } = useGit();
  const [loading, setLoading] = useState<boolean>(false);
  const [commitMsg, setCommitMsg] = useState<string>("");
  const [error, setError] = useState<GitError | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [syncStatus, setSyncStatus] = useState<{
    ahead: number;
    behind: number;
  }>({ ahead: 0, behind: 0 });

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
  async function handleSubmit() {
    if (!url.trim()) {
      setError({ name: "ValidationError", message: "Remote URL required" });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await handleSetRemote(url.trim());
      setDialogOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to set remote");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchSyncStatus();
    refreshStatus();
    // fetchGraph();
  }, [workspace, status.branch, status.staged.length]);

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
      // If git status fails, assume no repo initialized
      setIsInit(false);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGraph() {
    try {
      const payload = await runGit<{ graph: GitGraphNode[] }>("graph", {
        workspace,
      });
      setGraphData(payload.graph || []);
    } catch {
      setGraphData([]);
    }
  }

  async function handleInit() {
    setLoading(true);
    try {
      await runGit("init", { workspace });
      await refreshStatus();
      fetchGraph();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStage(file: GitFile) {
    setLoading(true);
    try {
      await runGit("stage", { workspace, file });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handleUnstage(file: GitFile) {
    setLoading(true);
    try {
      console.log("Unstaging file:", file);
      await runGit("unstage", { workspace, file });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!commitMsg.trim()) {
      setError({ name: "ValidationError", message: "Commit message required" });
      return;
    }
    setLoading(true);
    try {
      await runGit("commit", { workspace, message: commitMsg });
      setCommitMsg("");
      await refreshStatus();
      fetchGraph();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePush() {
    setLoading(true);
    try {
      await runGit("push", {
        workspace,
        remote: status.origin || "origin",
        branch: status.branch || "master",
      });
      await refreshStatus();
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

  const handleStageAll = async () => {
    setLoading(true);
    try {
      await runGit("stage-all", { workspace });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstageAll = async () => {
    setLoading(true);
    try {
      await runGit("unstage-all", { workspace });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async (file: GitFile) => {
    setLoading(true);
    try {
      await runGit("discard", { workspace, file });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  const handleDiscardAll = async () => {
    setLoading(true);
    try {
      await runGit("discard-all", { workspace });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  if (!workspace) return <NoWorkspace />;
  return (
    <div className="p-2 bg-primary-sidebar h-full">
      <div className="h-full w-full text-neutral-300 text-sm flex flex-col border border-neutral-600 rounded-xl">
        {!isInit ? (
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <GitBranch className="w-10 h-10 text-neutral-500" />
            <p className="text-neutral-400 text-sm">
              This folder is not yet a Git repository.
            </p>
            <div className="flex flex-wrap items-center justify-center p-4 gap-3">
              <Button
                onClick={handleInit}
                disabled={loading}
                className="bg-p6 hover:bg-neutral-500 text-p5 text-sm px-4 py-2"
              >
                Initialize Repository
              </Button>
              <Button
                onClick={() => {
                  console.log("Publish to GitHub clicked");
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2"
              >
                Publish to GitHub
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white">
              <div className="flex items-center gap-2 overflow-hidden">
                <p className="text-xs items-center">
                  <span className="truncate mr-1">Remote origin:</span>
                  {status.origin ? (
                    <span
                      onClick={async () => {
                        try {
                          const url = status.origin!;
                          console.log("Opening link:", url);
                          await openLink(url);
                        } catch (err) {
                          console.error("Failed to open link:", err);
                        }
                      }}
                      className="bg-p5 px-2 py-0.5 rounded-full hover:underline cursor-pointer truncate"
                      title={status.origin}
                    >
                      {status.origin}
                    </span>
                  ) : (
                    <span className="text-neutral-500 italic">none</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {!status.origin && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                      disabled={loading}
                      className="bg-p6 hover:bg-neutral-600 text-p5 cursor-pointer"
                    >
                      Set Remote
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="p-2 border-b border-white">
              <Input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Message (Ctrl+Enter to commit on {branch})"
                className="bg-p5 text-neutral-200 border-none focus:ring-0 text-sm"
              />
              <div className="mt-2 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    onClick={handleCommit}
                    disabled={loading || status.staged.length === 0}
                    className="bg-p6 hover:bg-neutral-400 text-neutral-800 text-xs px-3 py-1 
                               cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Commit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCommitMsg("")}
                    disabled={loading}
                    className="bg-neutral-700 hover:bg-neutral-500 text-white text-xs px-3 py-1 cursor-pointer"
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  onClick={handlePush}
                  disabled={
                    loading ||
                    (syncStatus.ahead === 0 && syncStatus.behind === 0)
                  }
                  className={`bg-p6 hover:bg-neutral-400 text-neutral-800 text-xs px-3 py-1 cursor-pointer 
    ${syncStatus.ahead === 0 && syncStatus.behind === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <RefreshCcw
                    className={`w-3 h-3 ${loading ? "animate-spin text-neutral-500" : "text-p5"}`}
                  />
                  {syncStatus.ahead === 0 && syncStatus.behind === 0
                    ? "Synced"
                    : "Sync"}
                  {syncStatus.ahead > 0 && (
                    <span className="text-xs flex">
                      <ArrowUpFromDot className="w-3 h-3" />
                      {syncStatus.ahead}
                    </span>
                  )}
                  {syncStatus.behind > 0 && (
                    <span className="text-xs flex">
                      <ArrowDownToDot className="w-3 h-3" />
                      {syncStatus.behind}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <PanelGroup direction="vertical" className="flex-1 overflow-hidden">
              <Panel defaultSize={60} minSize={20}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-neutral-600 shrink-0">
                    <div
                      className="flex flex-1 items-center gap-1 text-xs text-neutral-400 selection:bg-transparent"
                      onClick={() =>
                        setCollapsed((p) => ({ ...p, changes: !p.changes }))
                      }
                    >
                      {collapsed.changes ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}{" "}
                      CHANGES
                    </div>
                    <div className="flex">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-4 h-4 p-0"
                        onClick={handleDiscardAll}
                      >
                        <Undo className="w-3 h-3 text-p6" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-4 h-4 p-0"
                        onClick={handleUnstageAll}
                      >
                        <Minus className="w-3 h-3 text-p6" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-4 h-4 p-0"
                        onClick={handleStageAll}
                      >
                        <Plus className="w-3 h-3 text-p6" />
                      </Button>
                      <span className="ml-2 text-xs text-neutral-500">
                        {status.unstaged.length +
                          status.untracked.length +
                          status.staged.length}
                      </span>
                    </div>
                  </div>
                  {!collapsed.changes && (
                    <div className="flex-1 px-3 py-1 scrollbar overflow-y-auto">
                      {[
                        ...status.staged,
                        ...status.unstaged,
                        ...status.untracked,
                      ].length === 0 && (
                        <div className="text-xs text-neutral-500">
                          Working tree clean
                        </div>
                      )}
                      <ul className="space-y-1">
                        {status.staged.map((f) => (
                          <li
                            key={f.path}
                            className="flex justify-between items-center hover:bg-neutral-600 px-1 py-0.5 rounded"
                          >
                            <span>{f.path}</span>
                            <div className="flex">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-4 h-4 p-0"
                                // onClick={() => openWorkingTree(f)}
                              >
                                <FileSymlinkIcon className="w-3 h-3 text-neutral-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleUnstage(f)}
                              >
                                <Minus className="w-3 h-3 text-neutral-400" />
                              </Button>
                            </div>
                          </li>
                        ))}
                        {status.unstaged.map((f) => (
                          <li
                            key={f.path}
                            className="flex justify-between hover:bg-neutral-600 px-1 py-0.5 rounded"
                          >
                            <span>{f.path}</span>
                            <div className="flex">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-4 h-4 p-0"
                                // onClick={() => openWorkingTree(f)}
                              >
                                <FileSymlinkIcon className="w-3 h-3 text-neutral-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-4 h-4 p-0"
                                onClick={() => handleDiscard(f)}
                              >
                                <Undo className="w-3 h-3 text-neutral-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleStage(f)}
                              >
                                <Plus className="w-3 h-3 text-neutral-400" />
                              </Button>
                            </div>
                          </li>
                        ))}
                        {status.untracked.map((f) => (
                          <li
                            key={f.path}
                            className="flex justify-between hover:bg-neutral-600 px-1 py-0.5 rounded italic text-neutral-500"
                            onClick={async () => {
                              const path = workspace + "/" + f.path;
                              const content = await readTextFile(f.path);
                              const file = { path, content } as File;
                              setActivePath(file.path);
                              setOpenFiles((prev) =>
                                prev.find((file) => file.path === path)
                                  ? prev
                                  : [...prev, { path, content } as File]
                              );
                            }}
                          >
                            <span>{f.path}</span>
                            <div className="flex">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-4 h-4 p-0"
                                onClick={async () => {
                                  const path = workspace + "\\" + f.path;
                                  console.log(path);
                                  const content = await readTextFile(path);
                                  const file = { path, content } as File;
                                  setActivePath(file.path);
                                  setOpenFiles((prev) =>
                                    prev.find((file) => file.path === path)
                                      ? prev
                                      : [...prev, { path, content } as File]
                                  );
                                }}
                              >
                                <FileSymlinkIcon className="w-3 h-3 text-neutral-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-4 h-4 p-0"
                                onClick={() => handleDiscard(f)}
                              >
                                <Undo className="w-3 h-3 text-neutral-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleStage(f)}
                              >
                                <Plus className="w-3 h-3 text-neutral-400" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Panel>
              <PanelResizeHandle />
              <Panel defaultSize={40} minSize={20}>
                <div>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-neutral-600 border-t border-white"
                    onClick={() =>
                      setCollapsed((p) => ({ ...p, graph: !p.graph }))
                    }
                  >
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      {collapsed.graph ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}{" "}
                      GRAPH
                    </div>
                  </div>
                  {!collapsed.graph && (
                    <div className="h-48 px-2 py-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                          <XAxis
                            dataKey="name"
                            stroke="#555"
                            tick={{ fill: "#999", fontSize: 10 }}
                          />
                          <YAxis
                            stroke="#555"
                            tick={{ fill: "#999", fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#252526",
                              border: "1px solid #444",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="commits"
                            stroke="#0e639c"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>
            <div className="p-2 text-xs text-neutral-500">
              {error && <div className="text-red-500">{error.details}</div>}
              {loading && <div>Working...</div>}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Set Remote Origin</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="https://github.com/user/repo.git"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                  />
                  {error && (
                    <p className="text-red-500 text-xs">{error.details}</p>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-p6 text-p5 hover:bg-neutral-600"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Setting..." : "Set Remote"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
