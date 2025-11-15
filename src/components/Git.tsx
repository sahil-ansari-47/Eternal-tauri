import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PanelGroup, Panel } from "react-resizable-panels";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  Link,
  GitCommit,
} from "lucide-react";
import { join } from "@tauri-apps/api/path";
import { useEditor } from "./contexts/EditorContext";
import { useGit } from "./contexts/GitContext";
import { open as openLink } from "@tauri-apps/plugin-shell";
import NoWorkspace from "./NoWorkspace";
import { readTextFile, remove } from "@tauri-apps/plugin-fs";
export default function GitPanel() {
  const {
    workspace,
    setActivePath,
    openFiles,
    setOpenFiles,
    reloadFileContent,
    viewRefs,
  } = useEditor();
  const {
    status,
    error,
    setError,
    loading,
    setLoading,
    graphData,
    setGraphData,
    collapsed,
    setCollapsed,
    isInit,
    refreshStatus,
    runGit,
    getUserAccessToken,
    handlePublish,
    syncStatus,
    handlePush,
    fetchSyncStatus,
    handleSetRemote,
    handleCommit,
    handleStageAll,
    commitMsg,
    setCommitMsg,
  } = useGit();
  const [remotedialogOpen, setRemoteDialogOpen] = useState(false);
  const [createbranchdialogOpen, setCreateBranchDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [newbranch, setNewBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  async function loadBranches() {
    setLoading(true);
    try {
      const result = await runGit<{ stdout: string }>("branch", { workspace });
      const branchList = result.stdout
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b) => b.replace(/^\* /, ""));
      setBranches(branchList);
    } catch (e) {
      console.error("Failed to load branches:", e);
    } finally {
      setLoading(false);
    }
  }
  async function handleCreateBranch() {
    const name = newbranch.trim();
    if (!name) return;
    setNewBranch("");
    setLoading(true);
    setCreateBranchDialogOpen(false);
    try {
      await runGit("create branch", { name, workspace });
      await refreshStatus();
      await loadBranches();
    } catch (e) {
      console.error("Failed to create branch:", e);
    } finally {
      setLoading(false);
    }
  }
  async function handleSwitchBranch(branch: string) {
    if (!branch) return;
    setLoading(true);
    try {
      await runGit("checkout", { name: branch, workspace });
      await refreshStatus();
      await loadBranches();
    } catch (e) {
      console.error("Failed to switch branch:", e);
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
      setRemoteDialogOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to set remote");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!workspace) return;
    refreshStatus();
    fetchGraph();
    fetchSyncStatus();
    if (status.origin !== "") {
      loadBranches();
    }
  }, [workspace, status.branch, status.staged.length, status.origin]);
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
  async function handleStage(file: File) {
    setLoading(true);
    try {
      await runGit("stage", { workspace, file });
      await refreshStatus();
      const token = await getUserAccessToken();
      localStorage.setItem("token", token);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handleUnstage(file: File) {
    setLoading(true);
    try {
      await runGit("unstage", { workspace, file });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handlePull() {
    setLoading(true);
    try {
      await runGit("pull", {
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
  const handleDiscard = async (file: File) => {
    setLoading(true);
    try {
      await runGit("discard", { workspace, file });
      await refreshStatus();
      await reloadFileContent(file.path);
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
      if (!workspace) return;
      for (const f of status.staged) {
        if (
          openFiles.find(
            (file) => file.path.slice(workspace.length + 1) === f.path
          )
        )
          await reloadFileContent(f.path);
      }
      for (const f of status.unstaged) {
        if (
          openFiles.find(
            (file) => file.path.slice(workspace.length + 1) === f.path
          )
        )
          await reloadFileContent(f.path);
      }
      for (const f of status.untracked) {
        const abspath = await join(workspace, f.path);
        console.log(abspath);
        if (openFiles.find((file) => file.path === abspath))
          setOpenFiles((prev) => prev.filter((file) => file.path !== abspath));
        await remove(abspath);
        const view = viewRefs.current[abspath];
        if (view) {
          view.destroy();
          delete viewRefs.current[abspath];
        }
      }
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  if (!workspace) return <NoWorkspace />;
  return (
    <div className="h-full bg-primary-sidebar p-2">
      <div className="h-full w-full text-neutral-300 text-sm flex flex-col overflow-hidden border border-neutral-600 rounded-xl">
        {!isInit ? (
          <div className="flex flex-col justify-center items-center h-full gap-4 px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-git-branch opacity-20 blur-3xl rounded-full" />
              <GitBranch className="w-12 h-12 text-git-branch relative" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold mb-1">
                Initialize Repository
              </p>
              <p className="text-sm text-p6/60">
                This folder is not yet a Git repository.
              </p>
            </div>
            <Button
              onClick={handleInit}
              disabled={loading}
              className="bg-git-branch hover:bg-git-branch/90 text-git-branch-fg text-sm font-medium px-4 py-2 transition-colors"
            >
              Initialize
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-white bg-primary-sidebar px-4 py-3 space-y-2">
              {/* Branch Info */}
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium text-p6/80 tracking-wide">
                  Branch
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-p6/10 rounded-full border border-p6 text-sm font-semibold cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                      {status.branch}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[180px]">
                    {loading && (
                      <DropdownMenuItem disabled>
                        Loading branches...
                      </DropdownMenuItem>
                    )}
                    {!loading &&
                      branches.map((branch) => (
                        <DropdownMenuItem
                          key={branch}
                          onClick={() => handleSwitchBranch(branch)}
                          className={
                            branch === status.branch
                              ? "font-semibold text-p6/80"
                              : "pl-4"
                          }
                        >
                          {branch === status.branch ? "• " : ""}
                          {branch}
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuItem
                      onClick={() => setCreateBranchDialogOpen(true)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create new branch
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Remote Info */}
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-git-remote flex-shrink-0" />
                <span className="text-sm font-medium text-p6/80 tracking-wide">
                  Remote
                </span>
                {status.origin ? (
                  <button
                    onClick={async () => {
                      try {
                        const url = status.origin!;
                        console.log("Opening link:", url);
                        await openLink(url);
                      } catch (err) {
                        console.error("Failed to open link:", err);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-p6/10 rounded-full border border-git-remote/30 hover:border-git-remote/60 hover:bg-git-remote/20 transition-colors cursor-pointer group"
                    title={status.origin}
                  >
                    <span className="text-sm font-medium text-git-remote group-hover:underline truncate">
                      {status.origin
                        .replace("https://github.com/", "")
                        .replace(".git", "")}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-p6/80 italic">
                      Not configured
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setRemoteDialogOpen(true)}
                      disabled={loading}
                      className="bg-sidebar-accent hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-2.5 py-1 h-auto transition-colors cursor-pointer rounded-xl"
                    >
                      Add Remote
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-sidebar-border px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <GitCommit className="w-4 h-4 text-p6/80" />
                <span className="text-xs font-semibold text-p6/80 uppercase tracking-wide">
                  Commit
                </span>
              </div>
              <Input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder={`Commit message on ${status.branch || "branch"}`}
                className="bg-neutral-800 border border-neutral-600 rounded text-p6/80 focus:border-git-branch/50 placeholder:p6/80 text-sm"
              />
              <div className="flex justify-between items-center gap-2 pt-1">
                <div className="flex gap-1">
                  <Button
                    onClick={handleCommit}
                    disabled={
                      loading || status.staged.length === 0 || commitMsg === ""
                    }
                    className="hover:bg-primary-sidebar text-git-success-fg text-xs px-3 py-1.5 h-auto font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-1 border-neutral-500 cursor-pointer rounded-xl"
                  >
                    Commit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCommitMsg("")}
                    disabled={loading}
                    className="bg-sidebar-accent hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-3 py-1.5 h-auto transition-colors rounded-xl cursor-pointer"
                  >
                    Clear
                  </Button>
                </div>
                {status.origin !== "" ? (
                  <Button
                    onClick={async () => {
                      await handlePull();
                      await handlePush();
                    }}
                    disabled={
                      loading ||
                      (syncStatus.ahead === 0 && syncStatus.behind === 0)
                    }
                    className={`bg-git-branch hover:bg-git-branch/90 text-git-branch-fg text-xs px-3 py-1.5 h-auto font-medium transition-colors flex items-center gap-1.5 ${
                      syncStatus.ahead === 0 && syncStatus.behind === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <RefreshCcw
                      className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                    />
                    <span>
                      {syncStatus.ahead === 0 && syncStatus.behind === 0
                        ? "Synced"
                        : "Sync"}
                    </span>
                    {(syncStatus.ahead > 0 || syncStatus.behind > 0) && (
                      <span className="flex items-center gap-0.5 text-xs ml-1 bg-sidebar-accent/40 px-1.5 py-0.5 rounded">
                        {syncStatus.ahead > 0 && (
                          <span className="flex items-center gap-0.5">
                            <ArrowUpFromDot className="w-3 h-3" />
                            {syncStatus.ahead}
                          </span>
                        )}
                        {syncStatus.behind > 0 && (
                          <span className="flex items-center gap-0.5 ml-1">
                            <ArrowDownToDot className="w-3 h-3" />
                            {syncStatus.behind}
                          </span>
                        )}
                      </span>
                    )}
                  </Button>
                ) : graphData.length > 0 ? (
                  <Button
                    onClick={() => handlePublish(workspace.split("\\").pop()!)}
                    disabled={loading}
                    className="bg-sidebar-accent hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-3 py-1.5 h-auto transition-colors rounded-xl cursor-pointer"
                  >
                    Publish to GitHub
                  </Button>
                ) : null}
              </div>
            </div>
            <PanelGroup
              direction="vertical"
              className="flex-1 min-h-0 overflow-hidden"
            >
              <Panel defaultSize={100} minSize={20}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer  shrink-0 border-b border-sidebar-border transition-colors">
                    <div
                      className="flex flex-1 items-center gap-2 text-xs font-semibold text-p6/80 uppercase tracking-wide selection:bg-transparent"
                      onClick={() =>
                        setCollapsed((p) => ({ ...p, changes: !p.changes }))
                      }
                    >
                      {collapsed.changes ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span>Changes</span>
                      <span className="text-git-warning font-semibold">
                        {status.unstaged.length +
                          status.untracked.length +
                          status.staged.length}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-sidebar-accent/50 text-p6/80 cursor-pointer hover:text-sidebar-foreground transition-colors"
                        onClick={handleDiscardAll}
                        title="Discard all"
                      >
                        <Undo className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-sidebar-accent/50 text-p6/80 cursor-pointer hover:text-sidebar-foreground transition-colors"
                        onClick={handleUnstageAll}
                        title="Unstage all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-sidebar-accent/50 text-p6/80 cursor-pointer hover:text-sidebar-foreground transition-colors"
                        onClick={handleStageAll}
                        title="Stage all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {!collapsed.changes && (
                    <div className="flex-1 overflow-y-auto scrollbar">
                      {[
                        ...status.staged,
                        ...status.unstaged,
                        ...status.untracked,
                      ].length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-xs text-p6/80 font-medium">
                            Working tree clean
                          </p>
                        </div>
                      ) : (
                        <div className="px-3 py-1">
                          {/* Staged Files */}
                          {status.staged.length > 0 && (
                            <div className="mb-2">
                              {/* <div className="text-xs font-semibold text-git-success px-2 py-1.5 uppercase tracking-wide">
                                Staged ({status.staged.length})
                              </div> */}
                              <ul className="space-y-0.5">
                                {status.staged.map((f) => (
                                  <li
                                    key={f.path}
                                    className="flex justify-between items-center hover:bg-sidebar-accent/40 px-2 py-1.5 rounded text-xs transition-colors"
                                  >
                                    <span className="text-git-success font-medium truncate">
                                      {f.path}
                                    </span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 text-p6/80 hover:text-primary-sidebar cursor-pointer transition-colors"
                                        onClick={() => handleUnstage(f)}
                                        title="Unstage"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Unstaged Files */}
                          {status.unstaged.length > 0 && (
                            <div className="mb-2">
                              {/* <div className="text-xs font-semibold text-git-warning px-2 py-1.5 uppercase tracking-wide">
                                Modified ({status.unstaged.length})
                              </div> */}
                              <ul className="space-y-0.5">
                                {status.unstaged.map((f) => (
                                  <li
                                    key={f.path}
                                    className="flex justify-between items-center hover:bg-sidebar-accent/40 px-2 py-1.5 rounded text-xs transition-colors"
                                  >
                                    <span className="text-git-warning truncate">
                                      {f.path}
                                    </span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 text-p6/80 hover:text-primary-sidebar cursor-pointer"
                                        onClick={() => handleDiscard(f)}
                                        title="Discard"
                                      >
                                        <Undo className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 text-p6/80 hover:text-primary-sidebar cursor-pointer"
                                        onClick={() => handleStage(f)}
                                        title="Stage"
                                      >
                                        <Plus className="w-3 h-3 " />
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Untracked Files */}
                          {status.untracked.length > 0 && (
                            <div>
                              {/* <div className="text-xs font-semibold text-sidebar-foreground/50 px-2 py-1.5 uppercase tracking-wide">
                                Untracked ({status.untracked.length})
                              </div> */}
                              <ul className="space-y-0.5">
                                {status.untracked.map((f) => (
                                  <li
                                    key={f.path}
                                    className="flex justify-between items-center hover:bg-sidebar-accent/40 px-2 py-1.5 rounded text-xs transition-colors cursor-pointer"
                                    onClick={async () => {
                                      const path = await join(
                                        workspace,
                                        f.path
                                      );
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
                                    <span className="text-p6/80 truncate">
                                      {f.path}
                                    </span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 cursor-pointer"
                                        onClick={async () => {
                                          const path = await join(
                                            workspace,
                                            f.path
                                          );
                                          console.log(path);
                                          const content = await readTextFile(
                                            path
                                          );
                                          const file = {
                                            path,
                                            content,
                                          } as File;
                                          setActivePath(file.path);
                                          setOpenFiles((prev) =>
                                            prev.find(
                                              (file) => file.path === path
                                            )
                                              ? prev
                                              : [
                                                  ...prev,
                                                  { path, content } as File,
                                                ]
                                          );
                                        }}
                                        title="Open file"
                                      >
                                        <FileSymlinkIcon className="w-3 h-3 text-p6/80" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 text-p6/80 hover:text-primary-sidebar cursor-pointer"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const absPath = await join(
                                            workspace,
                                            f.path
                                          );
                                          console.log(absPath);
                                          setOpenFiles((prev) =>
                                            prev.filter(
                                              (f) => f.path !== absPath
                                            )
                                          );
                                          await remove(absPath);
                                          const view =
                                            viewRefs.current[absPath];
                                          if(view){
                                            view.destroy();
                                            delete viewRefs.current[absPath];
                                          }
                                          refreshStatus();
                                        }}
                                        title="Discard"
                                      >
                                        <Undo className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 text-p6/80 hover:text-primary-sidebar cursor-pointer"
                                        onClick={() => handleStage(f)}
                                        title="Stage"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>

            {(error || loading) && (
              <div className="border-t border-sidebar-border px-4 py-2 bg-primary-sidebar text-xs">
                {error && (
                  <div className="text-destructive font-medium">
                    {error.details}
                  </div>
                )}
                {loading && (
                  <div className="text-sidebar-foreground/60 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-git-branch animate-pulse" />
                    Working...
                  </div>
                )}
              </div>
            )}

            {/* Set Remote Dialog */}
            <Dialog open={remotedialogOpen} onOpenChange={setRemoteDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg">
                    Set Remote Origin
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="https://github.com/user/repo.git"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    className="text-sm text-p6"
                  />
                  {error && (
                    <p className="text-destructive text-xs font-medium">
                      {error.details}
                    </p>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    className="cursor-pointer hover:opacity-50"
                    variant="outline"
                    onClick={() => {
                      setRemoteDialogOpen(false);
                      setUrl("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="font-medium disabled:opacity-50 text-p6 cursor-pointer border-1 border-neutral-500"
                    onClick={handleSubmit}
                    disabled={loading || !url}
                  >
                    {loading ? "Setting..." : "Set Remote"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create Branch Dialog */}
            <Dialog
              open={createbranchdialogOpen}
              onOpenChange={setCreateBranchDialogOpen}
            >
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg">
                    Create New Branch
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="New Branch"
                    value={newbranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    disabled={loading}
                    className="text-sm text-p6"
                  />
                  {error && (
                    <p className="text-destructive text-xs font-medium">
                      {error.details}
                    </p>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    className="cursor-pointer hover:opacity-50"
                    variant="outline"
                    onClick={() => {
                      setCreateBranchDialogOpen(false);
                      setNewBranch("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="font-medium disabled:opacity-50 text-p6 cursor-pointer border-1 border-neutral-500"
                    onClick={handleCreateBranch}
                    disabled={loading || !newbranch}
                  >
                    {loading ? "Adding..." : "Create Branch"}
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
