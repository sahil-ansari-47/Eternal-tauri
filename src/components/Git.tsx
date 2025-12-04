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
import { join, normalize } from "@tauri-apps/api/path";
import { useEditor } from "./contexts/EditorContext";
import { useGit } from "./contexts/GitContext";
import { open as openLink } from "@tauri-apps/plugin-shell";
import NoWorkspace from "./NoWorkspace";
import { readTextFile, remove } from "@tauri-apps/plugin-fs";
import { message, ask } from "@tauri-apps/plugin-dialog";
export default function GitPanel() {
  const {
    workspace,
    setActivePath,
    openFiles,
    setOpenFiles,
    reloadFileContent,
    viewRefs,
    onSave,
    getSingleFileGitState,
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
    handlePublish,
    syncStatus,
    handlePush,
    fetchSyncStatus,
    handleSetRemote,
    commitMsg,
    setCommitMsg,
  } = useGit();
  const [remotedialogOpen, setRemoteDialogOpen] = useState(false);
  const [createbranchdialogOpen, setCreateBranchDialogOpen] = useState(false);
  const [removeOriginDialogOpen, setRemoveOriginDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [newbranch, setNewBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);

  const showPublishButton = true;
  // (!status.origin || status.origin === "") && graphData.length > 0;
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
      if (
        status.staged.length > 0 ||
        status.unstaged.length > 0 ||
        status.untracked.length > 0
      ) {
        message(
          "Please commit or discard your changes before switching branches."
        );
        return;
      }
      await runGit("checkout", { name: branch, workspace });
      await refreshStatus();
      await loadBranches();
      for (const file of openFiles) {
        await reloadFileContent({ path: file.path } as Gitfile);
      }
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
      setUrl("");
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
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("init", { workspace });
      await refreshStatus();
      fetchGraph();
    } catch (e: any) {
      setError(e);
    } finally {
      setError(null);
      setLoading(false);
    }
  }
  async function handleStage(gitfile: Gitfile) {
    if (!workspace) return;
    setLoading(true);
    try {
      const abspath = await join(workspace, gitfile.path);
      const norm = await normalize(abspath);
      if (viewRefs.current[norm]) {
        const file = {} as FsNode;
        file.path = norm;
        file.content = viewRefs.current[norm].state.doc.toString();
        await onSave(file);
      }
      await runGit("stage", { workspace, file: gitfile.path });
      const newState = await getSingleFileGitState(gitfile.path);
      setOpenFiles((prev) =>
        prev.map((f) => (f.path === norm ? { ...f, status: newState } : f))
      );
      await refreshStatus();
    } catch (e: any) {
      console.log(e);
      setError(e);
    } finally {
      setError(null);
      setLoading(false);
    }
  }
  const handleStageAll = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const openPaths = Object.keys(viewRefs.current);
      let newstatus = [];
      for (const fullPath of openPaths) {
        const ref = viewRefs.current[fullPath];
        if (!ref) continue;
        const content = ref.state.doc.toString();
        await onSave({
          path: fullPath,
          content,
        } as FsNode);
      }
      await runGit("stage-all", { workspace });
      for (const fullPath of openPaths) {
        newstatus.push(await getSingleFileGitState(fullPath));
      }
      setOpenFiles((prev) =>
        prev.map((f) =>
          openPaths.includes(f.path)
            ? ({ ...f, status: newstatus[openPaths.indexOf(f.path)] } as FsNode)
            : f
        )
      );
      await refreshStatus();
    } catch (e: any) {
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  async function handleUnstage(gitfile: Gitfile) {
    if (!workspace) return;
    setLoading(true);
    try {
      const abspath = await join(workspace, gitfile.path);
      const norm = await normalize(abspath);
      await runGit("unstage", { workspace, file: gitfile.path });
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === norm
            ? { ...f, status: gitfile.status === "A" ? "U" : "M" }
            : f
        )
      );
      await refreshStatus();
    } catch (e: any) {
      console.log(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  const handleUnstageAll = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("unstage-all", { workspace });
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.status === "A"
            ? { ...f, status: "U" }
            : f.status === "M"
            ? { ...f, status: "M" }
            : f
        )
      );
      await refreshStatus();
    } catch (e: any) {
      console.log(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  async function handlePull() {
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("pull", {
        workspace,
        remote: status.origin || "origin",
        branch: status.branch || "master",
      });
      await refreshStatus();
      for (const file of openFiles) {
        await reloadFileContent({ path: file.path } as Gitfile);
      }
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  const handleDiscard = async (gitfile: Gitfile) => {
    setLoading(true);
    try {
      await runGit("discard", { workspace, file: gitfile.path });
      await refreshStatus();
      await reloadFileContent(gitfile);
    } catch (e: any) {
      console.log(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  const handleDiscardAll = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("discard-all", { workspace });
      const absPathsSet = new Set(openFiles.map((f) => f.path));
      for (const f of status.unstaged) {
        const absPath = await join(workspace, f.path);
        if (absPathsSet.has(absPath)) {
          await reloadFileContent(f);
        }
      }
      for (const f of status.untracked) {
        const absPath = await join(workspace, f.path);
        if (absPathsSet.has(absPath)) {
          setOpenFiles((prev) => prev.filter((file) => file.path !== absPath));
        }
        await remove(absPath);
        const view = viewRefs.current[absPath];
        if (view) {
          view.destroy();
          delete viewRefs.current[absPath];
        }
      }
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  async function handleCommit() {
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("commit", {
        workspace,
        message: commitMsg.trim() === "" ? "initial commit" : commitMsg,
      });
      setCommitMsg("");
      await refreshStatus();
      const stagedRelPaths = new Set(status.staged.map((f) => f.path));
      setOpenFiles((prev) =>
        prev.map((f) => {
          const rel = f.path.slice(workspace.length + 1);
          if (stagedRelPaths.has(rel)) {
            return { ...f, status: "" };
          }
          return f;
        })
      );
      // fetchGraph();
    } catch (e: any) {
      console.log(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  async function handleRemoveOrigin() {
    if (!workspace) return;
    setLoading(true);
    try {
      await runGit("remove origin", { workspace });
      await refreshStatus();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  if (!workspace) return <NoWorkspace />;
  return (
    <div className="h-full bg-primary-sidebar p-2">
      <div className="h-full w-full text-neutral-300 text-sm flex flex-col overflow-hidden border border-neutral-600 rounded-xl">
        {!loading && !isInit ? (
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
                  <>
                    <button
                      onClick={async () => {
                        try {
                          const url = status.origin!;
                          // console.log("Opening link:", url);
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
                    <Button
                      variant="secondary"
                      onClick={() => setRemoveOriginDialogOpen(true)}
                      disabled={loading}
                      className="bg-sidebar-accent hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-3 py-1.5 h-auto transition-colors rounded-xl cursor-pointer"
                    >
                      Remove Origin
                    </Button>
                  </>
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
                {showPublishButton ? (
                  <Button
                    onClick={() => handlePublish(workspace.split("\\").pop()!)}
                    disabled={loading}
                    className="bg-sidebar-accent hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-3 py-1.5 h-auto transition-colors rounded-xl cursor-pointer"
                  >
                    Publish this branch
                  </Button>
                ) : status.origin ? (
                  <Button
                    onClick={async () => {
                      const syncConfirm = await ask(
                        "Are you sure you want to push/pull commits to/from remote origin?",
                        { title: "Confirm Sync", kind: "warning" }
                      );
                      if (!syncConfirm) return;
                      if (syncStatus.behind > 0) {
                        await handlePull();
                      }
                      if (syncStatus.ahead > 0) {
                        await handlePush();
                      }
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
                        <div className="">
                          {/* Staged Files */}
                          {status.staged.length > 0 && (
                            <div className="">
                              <div className="text-xs bg-white/10 font-semibold text-git-success px-2 py-1.5 tracking-wide">
                                STAGED ({status.staged.length})
                              </div>
                              <ul className="space-y-0.5">
                                {status.staged.map((f) => (
                                  <li
                                    key={f.path}
                                    className={`flex justify-between items-center ${
                                      f.status === "M"
                                        ? "hover:bg-yellow-800/15"
                                        : f.status === "A"
                                        ? "hover:bg-green-800/15"
                                        : "hover:bg-red-800/15"
                                    } px-2 py-1.5 text-xs transition-colors`}
                                  >
                                    <span
                                      className={`truncate ${
                                        f.status === "M"
                                          ? "text-yellow-400"
                                          : f.status === "A"
                                          ? "text-green-500"
                                          : "text-red-500 line-through"
                                      }`}
                                    >
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
                                      <span className="truncate max-w-xs flex items-center gap-1">
                                        {/* Git status */}
                                        {f.status && (
                                          <span
                                            className={`ml-2 font-medium ${
                                              f.status === "M"
                                                ? "text-yellow-500"
                                                : f.status === "A"
                                                ? "text-green-500"
                                                : "text-red-500"
                                            }`}
                                          >
                                            {f.status}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Unstaged Files */}
                          {status.unstaged.length > 0 && (
                            <div className="">
                              <div className="text-xs bg-white/10 font-semibold text-git-warning px-2 py-1.5 tracking-wide">
                                UNSTAGED ({status.unstaged.length})
                              </div>
                              <ul className="space-y-0.5">
                                {status.unstaged.map((f) => (
                                  <li
                                    key={f.path}
                                    className={`flex justify-between items-center px-2 py-1.5 text-xs transition-colors ${
                                      f.status === "M"
                                        ? "hover:bg-yellow-800/15"
                                        : "hover:bg-red-800/15"
                                    }`}
                                  >
                                    <span
                                      className={`truncate ${
                                        f.status === "M"
                                          ? "text-yellow-500/70"
                                          : "text-red-500/30 line-through"
                                      }`}
                                    >
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
                                      <span className="truncate max-w-xs flex items-center gap-1">
                                        {/* Git status */}
                                        {f.status && (
                                          <span
                                            className={`ml-2 font-medium ${
                                              f.status === "M"
                                                ? "text-yellow-500"
                                                : "text-red-500"
                                            }`}
                                          >
                                            {f.status}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Untracked Files */}
                          {status.untracked.length > 0 && (
                            <div>
                              <div className="text-xs bg-white/10 font-semibold px-2 py-1.5 tracking-wide">
                                UNTRACKED ({status.untracked.length})
                              </div>
                              <ul className="space-y-0.5">
                                {status.untracked.map((f) => (
                                  <li
                                    key={f.path}
                                    className="flex justify-between items-center hover:bg-orange-800/15 px-2 py-1.5 text-xs transition-colors"
                                    onClick={async () => {
                                      const path = await join(
                                        workspace,
                                        f.path
                                      );
                                      console.log(path);
                                      const content = await readTextFile(path);
                                      const file = { path, content } as FsNode;
                                      setActivePath(file.path);
                                      setOpenFiles((prev) =>
                                        prev.find((file) => file.path === path)
                                          ? prev
                                          : [
                                              ...prev,
                                              { path, content } as FsNode,
                                            ]
                                      );
                                    }}
                                  >
                                    <span className="truncate text-orange-500/50">
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
                                          } as FsNode;
                                          setActivePath(file.path);
                                          setOpenFiles((prev) =>
                                            prev.find(
                                              (file) => file.path === path
                                            )
                                              ? prev
                                              : [
                                                  ...prev,
                                                  { path, content } as FsNode,
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
                                          if (view) {
                                            view.destroy();
                                            delete viewRefs.current[absPath];
                                          }
                                          await refreshStatus();
                                        }}
                                        title="Discard"
                                      >
                                        <Undo className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50 text-p6/80 hover:text-primary-sidebar cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStage(f);
                                        }}
                                        title="Stage"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <span className="truncate max-w-xs flex items-center gap-1">
                                        {f.status && (
                                          <span className="ml-2 font-medium text-orange-500">
                                            {f.status}
                                          </span>
                                        )}
                                      </span>
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

            {error && (
              <div className="border-t border-sidebar-border px-4 py-2 bg-white text-red-500">
                {error.message}
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
                      setUrl("");
                      setRemoteDialogOpen(false);
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
            {/* Remove Remote Origin Dialog */}
            <Dialog
              open={removeOriginDialogOpen}
              onOpenChange={setRemoveOriginDialogOpen}
            >
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg">
                    Are you sure you want to remove the remote origin?
                  </DialogTitle>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button
                    className="cursor-pointer hover:opacity-50"
                    variant="outline"
                    onClick={() => setRemoveOriginDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="font-medium disabled:opacity-50 text-p6 cursor-pointer border-1 border-neutral-500"
                    onClick={() => {
                      setRemoveOriginDialogOpen(false);
                      handleRemoveOrigin();
                    }}
                    disabled={loading}
                  >
                    {loading ? "Removing..." : "Remove Origin"}
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
