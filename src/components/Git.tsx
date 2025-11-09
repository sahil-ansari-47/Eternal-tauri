// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { PanelGroup, Panel } from "react-resizable-panels";
// import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import {
//   ChevronDown,
//   ChevronRight,
//   GitBranch,
//   Undo,
//   RefreshCcw,
//   ArrowDownToDot,
//   ArrowUpFromDot,
//   FileSymlinkIcon,
//   Plus,
//   Minus,
// } from "lucide-react";
// import { useEditor } from "./contexts/EditorContext";
// import { useGit } from "./contexts/GitContext";
// import { open as openLink } from "@tauri-apps/plugin-shell";
// import NoWorkspace from "./NoWorkspace";
// import { readTextFile } from "@tauri-apps/plugin-fs";
// async function runGit<T>(action: string, payload = {}): Promise<T> {
//   try {
//     console.log("Running git command:", action);
//     const result = await invoke<T>("git_command", { action, payload });
//     console.log(result);
//     return result;
//   } catch (e: any) {
//     const err: GitError = new Error(e.message || String(e));
//     err.code = e.code || "GIT_ACTION_FAILED";
//     err.details = e.stack || undefined;
//     throw err;
//   }
// }

// export default function Git() {
//   const { workspace, setActivePath, setOpenFiles } = useEditor();
//   const {
//     status,
//     setStatus,
//     // graphData,
//     setGraphData,
//     collapsed,
//     setCollapsed,
//     isInit,
//     setIsInit,
//   } = useGit();
//   const [loading, setLoading] = useState<boolean>(false);
//   const [commitMsg, setCommitMsg] = useState<string>("");
//   const [error, setError] = useState<GitError | null>(null);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [url, setUrl] = useState("");
//   const [syncStatus, setSyncStatus] = useState<{
//     ahead: number;
//     behind: number;
//   }>({ ahead: 0, behind: 0 });

//   async function fetchSyncStatus() {
//     setLoading(true);
//     try {
//       const result = await runGit<{ ahead: number; behind: number }>(
//         "sync-status",
//         { workspace }
//       );
//       setSyncStatus(result);
//     } catch (err) {
//       console.error("Failed to get sync status", err);
//     } finally {
//       setLoading(false);
//     }
//   }
//   async function handleSubmit() {
//     if (!url.trim()) {
//       setError({ name: "ValidationError", message: "Remote URL required" });
//       return;
//     }
//     setError(null);
//     setLoading(true);
//     try {
//       await handleSetRemote(url.trim());
//       setDialogOpen(false);
//     } catch (e: any) {
//       setError(e.message || "Failed to set remote");
//     } finally {
//       setLoading(false);
//     }
//   }
//   useEffect(() => {
//     fetchSyncStatus();
//     refreshStatus();
//     fetchGraph();
//   }, [workspace, status.branch, status.staged.length]);

//   async function refreshStatus() {
//     setLoading(true);
//     try {
//       const payload = await runGit<GitStatus>("status", { workspace });
//       setStatus({
//         staged: payload.staged || [],
//         unstaged: payload.unstaged || [],
//         untracked: payload.untracked || [],
//         branch: payload.branch || "master",
//         origin: payload.origin || "",
//       });
//       setIsInit(true);
//     } catch (e: any) {
//       // If git status fails, assume no repo initialized
//       setIsInit(false);
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function fetchGraph() {
//     try {
//       const payload = await runGit<GitGraphNode[]>("graph", {
//         workspace,
//       });
//       console.log("graph", payload);
//       setGraphData(payload || []);
//     } catch {
//       setGraphData([]);
//     }
//   }

//   async function handleInit() {
//     setLoading(true);
//     try {
//       await runGit("init", { workspace });
//       await refreshStatus();
//       fetchGraph();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleStage(file: GitFile) {
//     setLoading(true);
//     try {
//       await runGit("stage", { workspace, file });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }
//   async function handleUnstage(file: GitFile) {
//     setLoading(true);
//     try {
//       console.log("Unstaging file:", file);
//       await runGit("unstage", { workspace, file });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleCommit() {
//     if (!commitMsg.trim()) {
//       setError({ name: "ValidationError", message: "Commit message required" });
//       return;
//     }
//     setLoading(true);
//     try {
//       await runGit("commit", { workspace, message: commitMsg });
//       setCommitMsg("");
//       await refreshStatus();
//       fetchGraph();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handlePush() {
//     setLoading(true);
//     try {
//       await runGit("push", {
//         workspace,
//         remote: status.origin || "origin",
//         branch: status.branch || "master",
//       });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }
//   async function handlePull() {
//     setLoading(true);
//     try {
//       await runGit("pull", {
//         workspace,
//         remote: status.origin || "origin",
//         branch: status.branch || "master",
//       });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleSetRemote(url: string) {
//     setLoading(true);
//     try {
//       await runGit("set-remote", { workspace, url });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const handleStageAll = async () => {
//     setLoading(true);
//     try {
//       await runGit("stage-all", { workspace });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUnstageAll = async () => {
//     setLoading(true);
//     try {
//       await runGit("unstage-all", { workspace });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDiscard = async (file: GitFile) => {
//     setLoading(true);
//     try {
//       await runGit("discard", { workspace, file });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleDiscardAll = async () => {
//     setLoading(true);
//     try {
//       await runGit("discard-all", { workspace });
//       await refreshStatus();
//     } catch (e: any) {
//       setError(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!workspace) return <NoWorkspace />;
//   return (
//     <div className="p-2 bg-primary-sidebar h-full">
//       <div className="h-full w-full text-neutral-300 text-sm flex flex-col border border-neutral-600 rounded-xl">
//         {!isInit ? (
//           <div className="flex flex-col justify-center items-center h-full gap-4">
//             <GitBranch className="w-10 h-10 text-neutral-500" />
//             <p className="text-neutral-400 text-sm">
//               This folder is not yet a Git repository.
//             </p>
//             <div className="flex flex-wrap items-center justify-center p-4 gap-3">
//               <Button
//                 onClick={handleInit}
//                 disabled={loading}
//                 className="bg-p6 hover:bg-neutral-500 text-p5 text-sm px-4 py-2"
//               >
//                 Initialize Repository
//               </Button>
//               <Button
//                 onClick={() => {
//                   console.log("Publish to GitHub clicked");
//                 }}
//                 disabled={loading}
//                 className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2"
//               >
//                 Publish to GitHub
//               </Button>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="flex items-center justify-between px-3 py-2 border-b border-white">
//               <div className="flex items-center gap-2">
//                 <p className="text-xs items-center">
//                   <span className="truncate mr-1">Remote origin:</span>
//                   {status.origin ? (
//                     <span
//                       onClick={async () => {
//                         try {
//                           const url = status.origin!;
//                           console.log("Opening link:", url);
//                           await openLink(url);
//                         } catch (err) {
//                           console.error("Failed to open link:", err);
//                         }
//                       }}
//                       className="bg-p5 px-2 py-0.5 rounded-full hover:underline cursor-pointer truncate"
//                       title={status.origin}
//                     >
//                       {status.origin}
//                     </span>
//                   ) : (
//                     <span className="text-neutral-500 italic">none</span>
//                   )}
//                 </p>
//               </div>
//               <div className="flex gap-2">
//                 {!status.origin && (
//                   <>
//                     <Button
//                       size="sm"
//                       onClick={() => setDialogOpen(true)}
//                       disabled={loading}
//                       className="bg-p6 hover:bg-neutral-600 text-p5 cursor-pointer"
//                     >
//                       Set Remote
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </div>
//             <div className="p-2 border-b border-white">
//               <Input
//                 value={commitMsg}
//                 onChange={(e) => setCommitMsg(e.target.value)}
//                 placeholder="Message (Ctrl+Enter to commit on {branch})"
//                 className="bg-p5 text-neutral-200 border-none focus:ring-0 text-sm"
//               />
//               <div className="mt-2 flex justify-between">
//                 <div className="flex gap-2">
//                   <Button
//                     onClick={handleCommit}
//                     disabled={loading || status.staged.length === 0}
//                     className="bg-p6 hover:bg-neutral-400 text-neutral-800 text-xs px-3 py-1
//                                cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     Commit
//                   </Button>
//                   <Button
//                     variant="secondary"
//                     onClick={() => setCommitMsg("")}
//                     disabled={loading}
//                     className="bg-neutral-700 hover:bg-neutral-500 text-white text-xs px-3 py-1 cursor-pointer"
//                   >
//                     Clear
//                   </Button>
//                 </div>
//                 <Button
//                   onClick={async () => {
//                     await handlePull();
//                     await handlePush();
//                   }}
//                   disabled={
//                     loading ||
//                     (syncStatus.ahead === 0 && syncStatus.behind === 0)
//                   }
//                   className={`bg-p6 hover:bg-neutral-400 text-neutral-800 text-xs px-3 py-1 cursor-pointer
//                     ${
//                       syncStatus.ahead === 0 && syncStatus.behind === 0
//                         ? "opacity-50 cursor-not-allowed"
//                         : ""
//                     }`}
//                 >
//                   <RefreshCcw
//                     className={`w-3 h-3 ${
//                       loading ? "animate-spin text-neutral-500" : "text-p5"
//                     }`}
//                   />
//                   {syncStatus.ahead === 0 && syncStatus.behind === 0
//                     ? "Synced"
//                     : "Sync"}
//                   {syncStatus.ahead > 0 && (
//                     <span className="text-xs flex">
//                       <ArrowUpFromDot className="w-3 h-3" />
//                       {syncStatus.ahead}
//                     </span>
//                   )}
//                   {syncStatus.behind > 0 && (
//                     <span className="text-xs flex">
//                       <ArrowDownToDot className="w-3 h-3" />
//                       {syncStatus.behind}
//                     </span>
//                   )}
//                 </Button>
//               </div>
//             </div>

//             <PanelGroup direction="vertical" className="flex-1">
//               <Panel defaultSize={60} minSize={20}>
//                 <div className="flex flex-col h-full">
//                   <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-neutral-600 shrink-0">
//                     <div
//                       className="flex flex-1 items-center gap-1 text-xs text-neutral-400 selection:bg-transparent"
//                       onClick={() =>
//                         setCollapsed((p) => ({ ...p, changes: !p.changes }))
//                       }
//                     >
//                       {collapsed.changes ? (
//                         <ChevronRight className="w-3 h-3" />
//                       ) : (
//                         <ChevronDown className="w-3 h-3" />
//                       )}{" "}
//                       CHANGES
//                     </div>
//                     <div className="flex">
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         className="w-4 h-4 p-0"
//                         onClick={handleDiscardAll}
//                       >
//                         <Undo className="w-3 h-3 text-p6" />
//                       </Button>
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         className="w-4 h-4 p-0"
//                         onClick={handleUnstageAll}
//                       >
//                         <Minus className="w-3 h-3 text-p6" />
//                       </Button>
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         className="w-4 h-4 p-0"
//                         onClick={handleStageAll}
//                       >
//                         <Plus className="w-3 h-3 text-p6" />
//                       </Button>
//                       <span className="ml-2 text-xs text-neutral-500">
//                         {status.unstaged.length +
//                           status.untracked.length +
//                           status.staged.length}
//                       </span>
//                     </div>
//                   </div>
//                   {!collapsed.changes && (
//                     <div className="flex-1 px-3 py-1 scrollbar overflow-y-auto">
//                       {[
//                         ...status.staged,
//                         ...status.unstaged,
//                         ...status.untracked,
//                       ].length === 0 && (
//                         <div className="text-xs text-neutral-500">
//                           Working tree clean
//                         </div>
//                       )}
//                       <ul className="space-y-1">
//                         {status.staged.map((f) => (
//                           <li
//                             key={f.path}
//                             className="flex justify-between items-center hover:bg-neutral-600 px-1 py-0.5 rounded"
//                           >
//                             <span>{f.path}</span>
//                             <div className="flex">
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="w-4 h-4 p-0"
//                                 // onClick={() => openWorkingTree(f)}
//                               >
//                                 <FileSymlinkIcon className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="h-4 w-4 p-0"
//                                 onClick={() => handleUnstage(f)}
//                               >
//                                 <Minus className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                             </div>
//                           </li>
//                         ))}
//                         {status.unstaged.map((f) => (
//                           <li
//                             key={f.path}
//                             className="flex justify-between hover:bg-neutral-600 px-1 py-0.5 rounded"
//                           >
//                             <span>{f.path}</span>
//                             <div className="flex">
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="w-4 h-4 p-0"
//                                 // onClick={() => openWorkingTree(f)}
//                               >
//                                 <FileSymlinkIcon className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="w-4 h-4 p-0"
//                                 onClick={() => handleDiscard(f)}
//                               >
//                                 <Undo className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="h-4 w-4 p-0"
//                                 onClick={() => handleStage(f)}
//                               >
//                                 <Plus className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                             </div>
//                           </li>
//                         ))}
//                         {status.untracked.map((f) => (
//                           <li
//                             key={f.path}
//                             className="flex justify-between hover:bg-neutral-600 px-1 py-0.5 rounded italic text-neutral-500"
//                             onClick={async () => {
//                               const path = workspace + "/" + f.path;
//                               const content = await readTextFile(f.path);
//                               const file = { path, content } as File;
//                               setActivePath(file.path);
//                               setOpenFiles((prev) =>
//                                 prev.find((file) => file.path === path)
//                                   ? prev
//                                   : [...prev, { path, content } as File]
//                               );
//                             }}
//                           >
//                             <span>{f.path}</span>
//                             <div className="flex">
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="w-4 h-4 p-0"
//                                 onClick={async () => {
//                                   const path = workspace + "\\" + f.path;
//                                   console.log(path);
//                                   const content = await readTextFile(path);
//                                   const file = { path, content } as File;
//                                   setActivePath(file.path);
//                                   setOpenFiles((prev) =>
//                                     prev.find((file) => file.path === path)
//                                       ? prev
//                                       : [...prev, { path, content } as File]
//                                   );
//                                 }}
//                               >
//                                 <FileSymlinkIcon className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="w-4 h-4 p-0"
//                                 onClick={() => handleDiscard(f)}
//                               >
//                                 <Undo className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="h-4 w-4 p-0"
//                                 onClick={() => handleStage(f)}
//                               >
//                                 <Plus className="w-3 h-3 text-neutral-400" />
//                               </Button>
//                             </div>
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}
//                 </div>
//               </Panel>
//               {/* <PanelResizeHandle />
//               <Panel defaultSize={40} minSize={20}>
//                 <div>
//                   <div
//                     className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-neutral-600 border-t border-white"
//                     onClick={() =>
//                       setCollapsed((p) => ({ ...p, graph: !p.graph }))
//                     }
//                   >
//                     <div className="flex items-center gap-1 text-xs text-neutral-400">
//                       {collapsed.graph ? (
//                         <ChevronRight className="w-3 h-3" />
//                       ) : (
//                         <ChevronDown className="w-3 h-3" />
//                       )}{" "}
//                       GRAPH
//                     </div>
//                   </div>
//                   {/* {!collapsed.graph && (
//                     <div className="h-full px-3 py-2 text-xs">
//                       <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar">
//                         <GitGraph graphData={graphData} />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </Panel> */}
//             </PanelGroup>
//             <div className="p-2 text-xs text-neutral-500">
//               {error && <div className="text-red-500">{error.details}</div>}
//               {loading && <div>Working...</div>}
//             </div>
//             <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//               <DialogContent className="max-w-sm">
//                 <DialogHeader>
//                   <DialogTitle>Set Remote Origin</DialogTitle>
//                 </DialogHeader>
//                 <div className="flex flex-col gap-3">
//                   <Input
//                     placeholder="https://github.com/user/repo.git"
//                     value={url}
//                     onChange={(e) => setUrl(e.target.value)}
//                     disabled={loading}
//                   />
//                   {error && (
//                     <p className="text-red-500 text-xs">{error.details}</p>
//                   )}
//                 </div>
//                 <DialogFooter className="mt-4">
//                   <Button
//                     variant="outline"
//                     onClick={() => setDialogOpen(false)}
//                     disabled={loading}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     className="bg-p6 text-p5 hover:bg-neutral-600"
//                     onClick={handleSubmit}
//                     disabled={loading}
//                   >
//                     {loading ? "Setting..." : "Set Remote"}
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
export default function GitPanel() {
  const { workspace, setActivePath, setOpenFiles } = useEditor();
  const {
    status,
    setStatus,
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
  const [branches, setBranches] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    ahead: number;
    behind: number;
  }>({ ahead: 0, behind: 0 });
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
    const name = prompt("Enter new branch name:");
    if (!name) return;
    setLoading(true);
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
    if(!workspace) return
    fetchSyncStatus();
    refreshStatus();
    fetchGraph();
    loadBranches();
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
      setIsInit(false);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGraph() {
    try {
      const payload = await runGit<GitGraphNode[]>("graph", {
        workspace,
      });
      console.log("graph", payload);
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
      await fetchSyncStatus();
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
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleInit}
                disabled={loading}
                className="bg-git-branch hover:bg-git-branch/90 text-git-branch-fg text-sm font-medium px-4 py-2 transition-colors"
              >
                Initialize
              </Button>
              <Button
                onClick={() => {
                  console.log("Publish to GitHub clicked");
                }}
                disabled={loading}
                className="bg-git-remote hover:bg-git-remote/90 text-git-remote-fg text-sm font-medium px-4 py-2 transition-colors"
              >
                Publish to GitHub
              </Button>
            </div>
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-p6/10 rounded-full border border-p6 text-sm font-semibold"
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
                              ? "font-semibold text-p5"
                              : "pl-4"
                          }
                        >
                          {branch === status.branch ? "• " : ""}
                          {branch}
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuItem onClick={handleCreateBranch}>
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
                    <span className="text-xs text-sidebar-foreground/40 italic">
                      Not configured
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                      disabled={loading}
                      className="bg-sidebar-accent/30 hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-2.5 py-1 h-auto transition-colors"
                    >
                      Add Remote
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-sidebar-border px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <GitCommit className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide">
                  Commit
                </span>
              </div>
              <Input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder={`Commit message on ${status.branch || "branch"}`}
                className="bg-sidebar-accent/50 text-sidebar-foreground border-sidebar-border/50 focus:border-git-branch/50 placeholder:text-sidebar-foreground/40 text-sm rounded-lg"
              />
              <div className="flex justify-between items-center gap-2 pt-1">
                <div className="flex gap-1">
                  <Button
                    onClick={handleCommit}
                    disabled={loading || status.staged.length === 0}
                    className="bg-git-success hover:bg-git-success/90 text-git-success-fg text-xs px-3 py-1.5 h-auto font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Commit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCommitMsg("")}
                    disabled={loading}
                    className="bg-sidebar-accent/30 hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs px-3 py-1.5 h-auto transition-colors"
                  >
                    Clear
                  </Button>
                </div>
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
                      : ""
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
              </div>
            </div>

            <PanelGroup direction="vertical" className="flex-1 min-h-0">
              <Panel defaultSize={60} minSize={20}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-sidebar-accent/30 shrink-0 border-b border-sidebar-border transition-colors">
                    <div
                      className="flex flex-1 items-center gap-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wide selection:bg-transparent"
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
                        className="w-7 h-7 p-0 hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                        onClick={handleDiscardAll}
                        title="Discard all"
                      >
                        <Undo className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                        onClick={handleUnstageAll}
                        title="Unstage all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                        onClick={handleStageAll}
                        title="Stage all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {!collapsed.changes && (
                    <div className="flex-1 overflow-y-auto">
                      {[
                        ...status.staged,
                        ...status.unstaged,
                        ...status.untracked,
                      ].length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-xs text-sidebar-foreground/50 font-medium">
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
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50"
                                        onClick={() => handleUnstage(f)}
                                      >
                                        <Minus className="w-3 h-3 text-sidebar-foreground/60" />
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
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50"
                                        onClick={() => handleDiscard(f)}
                                        title="Discard"
                                      >
                                        <Undo className="w-3 h-3 text-sidebar-foreground/60" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50"
                                        onClick={() => handleStage(f)}
                                        title="Stage"
                                      >
                                        <Plus className="w-3 h-3 text-sidebar-foreground/60" />
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
                                      const path = workspace + "/" + f.path;
                                      const content = await readTextFile(
                                        f.path
                                      );
                                      const file = { path, content } as File;
                                      setActivePath(file.path);
                                      setOpenFiles((prev) =>
                                        prev.find((file) => file.path === path)
                                          ? prev
                                          : [...prev, { path, content } as File]
                                      );
                                    }}
                                  >
                                    <span className="text-sidebar-foreground/60 truncate">
                                      {f.path}
                                    </span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const path =
                                            workspace + "\\" + f.path;
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
                                        <FileSymlinkIcon className="w-3 h-3 text-sidebar-foreground/60" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50"
                                        onClick={() => handleDiscard(f)}
                                        title="Discard"
                                      >
                                        <Undo className="w-3 h-3 text-sidebar-foreground/60" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-5 h-5 p-0 hover:bg-sidebar-accent/50"
                                        onClick={() => handleStage(f)}
                                        title="Stage"
                                      >
                                        <Plus className="w-3 h-3 text-sidebar-foreground/60" />
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    className="text-sm"
                  />
                  {error && (
                    <p className="text-destructive text-xs font-medium">
                      {error.details}
                    </p>
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
                    className="bg-git-branch hover:bg-git-branch/90 text-git-branch-fg font-medium"
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
