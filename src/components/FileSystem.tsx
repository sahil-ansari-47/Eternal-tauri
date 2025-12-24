import * as React from "react";
import { useEffect, useState, useRef } from "react";
import {
  // readDir,
  // DirEntry,
  readTextFile,
  rename,
  create,
  mkdir,
  remove,
  readDir,
  DirEntry,
} from "@tauri-apps/plugin-fs";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { join, normalize } from "@tauri-apps/api/path";
import { loadChildren, sortNodes } from "../utils/fsfunc";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "./ui/context-menu";
import {
  Folder,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
  FolderSync,
  FolderPlus,
  FolderMinus,
  FilePlus2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEditor } from "./contexts/EditorContext";
import NoWorkspace from "./NoWorkspace";
import { useGit } from "./contexts/GitContext";
const FileSystem = () => {
  const {
    workspace,
    setWorkspace,
    error,
    action,
    setAction,
    dialogOpen,
    setDialogOpen,
    errorMessage,
    setErrorMessage,
    activeFile,
    setActiveFile,
    setOpenFiles,
    reloadWorkspace,
    roots,
    setRoots,
    viewRefs,
    setActiveTab,
    targetNode,
    setTargetNode,
    dragNodeRef,
    dragOverNodeRef,
  } = useEditor();
  const { status, refreshStatus } = useGit();
  const rootsRef = useRef<FsNode[] | null>(null);
  const nodeMapRef = useRef(new Map<string, FsNode>());
  const statusDebounceRef = useRef<any>(null);
  const skipNextStatusRefreshRef = useRef(false);
  let expandTimer: any;
  const [value, setValue] = useState("");
  const [ignoredFiles, setIgnoredFiles] = useState(new Set<string>());
  const [ignoredDirs, setIgnoredDirs] = useState<string[]>([]);
  const getParentDir = (path: string) => {
    const parts = path.split(/[\\/]/);
    parts.pop();
    return parts.join("\\");
  };
  useEffect(() => {
    reloadWorkspace();
    if (!workspace) return;
    invoke("watch_workspace", { path: workspace });
    let buffer: string[] = [];
    let debounceTimer: any = null;
    const processBuffer = async () => {
      const paths = Array.from(new Set(buffer));
      buffer = [];
      if (paths.length === 0) return;
      const uniqueParents = new Set(paths.map(getParentDir));
      let nextRoots = rootsRef.current;
      if (!nextRoots) return;
      for (const dir of uniqueParents) {
        nextRoots = await refreshSubtree(nextRoots, dir);
        console.log("Updated roots:", nextRoots);
      }
      setRoots(nextRoots);
    };
    const unlistenPromise = listen("fs-change", (event: any) => {
      const changedPaths: string[] = event.payload;
      if (!Array.isArray(changedPaths) || changedPaths.length === 0) return;
      buffer.push(...changedPaths);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        processBuffer().catch(console.error);
      }, 500);
    });
    return () => {
      clearTimeout(debounceTimer);
      unlistenPromise
        .then((unlisten) => unlisten())
        .catch((e) => console.error("Failed to unlisten fs-change:", e));
    };
  }, [workspace]);
  async function refreshSubtree(
    nodes: FsNode[],
    targetDir: string
  ): Promise<FsNode[]> {
    // SPECIAL CASE: refresh workspace root
    if (targetDir === workspace) {
      const entries = await readDir(workspace);
      return sortNodes(await buildMergedChildren(entries, nodes, workspace));
    }
    async function update(nodes: FsNode[]): Promise<[FsNode[], boolean]> {
      let found = false;
      const result = await Promise.all(
        nodes.map(async (node) => {
          // Only skip collapsed nodes (but root handled above)
          if (!node.expanded) return node;
          // Direct match → refresh this folder
          if (node.path === targetDir) {
            found = true;
            const entries = await readDir(targetDir);
            const newChildren = await buildMergedChildren(
              entries,
              node.children,
              targetDir
            );
            return {
              ...node,
              children: sortNodes(newChildren),
            };
          }
          if (node.children) {
            const [updatedChildren, childFound] = await update(node.children);
            if (childFound) {
              found = true;
              return { ...node, children: updatedChildren };
            }
          }
          return node;
        })
      );
      return [result, found];
    }
    const [updated] = await update(nodes);
    return updated;
  }
  /** Merge new directory listing with old node state */
  async function buildMergedChildren(
    entries: DirEntry[],
    oldChildren: FsNode[] | undefined,
    parentPath: string
  ): Promise<FsNode[]> {
    return Promise.all(
      entries.map(async (e) => {
        const fullPath = await join(parentPath, e.name);

        const newChild: FsNode = {
          name: e.name,
          path: fullPath,
          isDirectory: e.isDirectory,
        };
        const old = oldChildren?.find((c) => c.path === newChild.path);
        // Merge view state (expanded, children, status, etc)
        return old ? { ...old, ...newChild } : newChild;
      })
    );
  }
  useEffect(() => {
    if (!roots) return;
    rootsRef.current = roots;
    const map = new Map<string, FsNode>();
    const walk = (nodes: FsNode[]) => {
      for (const n of nodes) {
        map.set(n.path, n);
        if (n.children) walk(n.children);
      }
    };
    walk(roots);
    nodeMapRef.current = map;
    if (!skipNextStatusRefreshRef.current) {
      clearTimeout(statusDebounceRef.current);
      statusDebounceRef.current = setTimeout(() => {
        refreshStatus();
      }, 500);
    } else {
      skipNextStatusRefreshRef.current = false;
    }
  }, [roots]);
  useEffect(() => {
    if (!status || !roots) return;
    let cancelled = false;
    (() => {
      const updated = applyGitStatusToNodes(roots, status);
      if (!cancelled) {
        skipNextStatusRefreshRef.current = true;
        setRoots(updated);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);
  const applyGitStatusToNodes = (
    nodes: FsNode[],
    status: GitStatus
  ): FsNode[] => {
    if (!workspace) return [];
    const map = buildGitStatusMap(status);
    prepareIgnoredSets(status);
    function apply(list: FsNode[]): FsNode[] {
      return list.map((node) => {
        if (!workspace) return {} as FsNode;
        const rel = node.path.slice(workspace.length + 1);
        if (isIgnoredPath(rel)) {
          return {
            ...node,
            status: "I",
            children: node.children,
          };
        }
        const gitStatus = map.get(node.path.slice(workspace.length + 1)) ?? "";
        let children: FsNode[] | undefined = undefined;
        if (node.children) {
          children = apply(node.children);
        }
        const finalStatus = node.isDirectory
          ? children?.some((c) => c.status !== "" && c.status !== "I")
            ? "M"
            : ""
          : gitStatus;
        return {
          ...node,
          status: finalStatus,
          children,
        };
      });
    }
    return apply(nodes);
  };
  function buildGitStatusMap(status: GitStatus) {
    const map = new Map<string, "A" | "M" | "D" | "U" | "I">();
    const add = (path: string, s: "A" | "M" | "D" | "U" | "I") => {
      map.set(path, s);
    };
    for (const f of status.staged) {
      add(f.path, f.status === "A" ? "A" : "M");
    }
    for (const f of status.unstaged) {
      add(f.path, "M");
    }
    for (const f of status.untracked) {
      add(f.path, "U");
    }
    for (const f of status.ignored) {
      add(f.path, "I");
    }
    return map;
  }
  function prepareIgnoredSets(status: GitStatus) {
    const igf = new Set<string>();
    const igd: string[] = [];
    for (const entry of status.ignored) {
      const rel = entry.path;
      if (rel.endsWith("\\")) igd.push(rel);
      else igf.add(rel);
    }
    setIgnoredFiles(igf);
    setIgnoredDirs(igd);
  }
  function isIgnoredPath(rel: string) {
    for (const d of ignoredDirs) {
      if (rel.startsWith(d.slice(0, -1))) return true;
    }
    if (ignoredFiles.has(rel)) return true;
    return false;
  }
  const handleConfirm = async () => {
    if (!workspace) return;
    if (action === "rename" || action === "newFile" || action === "newFolder") {
      const name = value.trim();
      if (!name) {
        setErrorMessage("Name cannot be empty.");
        return;
      }
      if (/[<>:"/\\|?*]/.test(name)) {
        setErrorMessage('Name contains invalid characters: <>:"/\\|?*');
        return;
      }
      const reserved = [
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "LPT1",
        "LPT2",
        "LPT3",
      ];
      if (reserved.includes(name.toUpperCase())) {
        setErrorMessage(`"${name}" is a reserved name.`);
        return;
      }
    }
    setErrorMessage(null);
    let dir: string;
    if (action === "rename" && targetNode) {
      const parentDir = targetNode.path.substring(
        0,
        targetNode.path.lastIndexOf("\\")
      );
      const newPath = await join(parentDir, value.trim());
      await rename(targetNode.path, newPath);
      if (!roots) return;
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.path === targetNode.path ? { ...f, path: newPath } : f
        )
      );
    } else if (action === "newFile" || action === "newFolder") {
      if (targetNode) {
        dir = targetNode.isDirectory
          ? targetNode.path
          : targetNode.path.substring(0, targetNode.path.lastIndexOf("/"));
      } else {
        dir = workspace;
      }
      if (action === "newFile") {
        const path = await join(dir, value.trim());
        await create(path);
        handleOpenFile({
          name: value.trim(),
          path,
          content: "",
          isDirectory: false,
          status: "U",
        } as FsNode);
      } else if (action === "newFolder") {
        await mkdir(await join(dir, value.trim()));
      }
    } else if (action === "delete" && targetNode) {
      setOpenFiles((prev) => prev.filter((f) => f.path !== targetNode.path));
      await remove(targetNode.path, { recursive: targetNode.isDirectory });
      const view = viewRefs.current[targetNode.path];
      if (view) {
        view.destroy();
        delete viewRefs.current[targetNode.path];
      }
    }
    setDialogOpen(false);
    setValue("");
    setAction(null);
    setTargetNode(null);
  };
  const handleFileClick = async (node: FsNode) => {
    if (!node.isDirectory) {
      node.content = await readTextFile(node.path);
      handleOpenFile(node);
    }
  };
  const handleOpenFile = (node: FsNode) => {
    setActiveTab("Editor");
    setActiveFile(node);
    setOpenFiles((prev) =>
      prev.find((f) => f.path === node.path) ? prev : [...prev, node]
    );
  };
  const toggleExpand = (node: FsNode) => {
    // const node = nodeMapRef.current.get(nodePath);
    if (!node || !node.isDirectory) return;
    node.expanded = !node.expanded;
    setRoots((prev: FsNode[] | null) => (prev ? [...prev] : prev));
    console.log("Toggling expand for:", node);
    if (node.children || !node.expanded) return;
    loadChildren(node.path).then((children) => {
      node.children = sortNodes(children);
      setRoots((prev: FsNode[] | null) => (prev ? [...prev] : prev));
    });
  };
  async function handleMove(source: FsNode, target: FsNode) {
    let destinationDir: string;
    // Drop on file → use its parent
    if (!target.isDirectory) {
      destinationDir = target.path.substring(0, target.path.lastIndexOf("\\"));
    } else {
      destinationDir = target.path;
    }
    // Prevent moving folder into itself or its children
    if (source.isDirectory && destinationDir.startsWith(source.path)) {
      console.warn("Invalid move: folder into itself");
      return;
    }
    const newPath = await join(destinationDir, source.name);
    await rename(source.path, newPath);
    // Update open files
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === source.path ? { ...f, path: newPath } : f))
    );
  }
  const TreeItem: React.FC<{ node: FsNode; level?: number }> = ({
    node,
    level = 0,
  }) => {
    if (!workspace) return;
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              if (!dragNodeRef.current) return;
              console.log("Drag over:", node.path);
              dragOverNodeRef.current = node;
              if (!node.isDirectory || node.expanded) return;
              clearTimeout(expandTimer);
              expandTimer = setTimeout(() => {
                toggleExpand(node);
              }, 600);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Drop on:", node.path);
              const source = dragNodeRef.current;
              const target = node;
              if (!source || !workspace) return;
              if (source.path === target.path) return;
              await handleMove(source, target);
              // const files = Array.from(e.dataTransfer.files);
              // if (!files.length || !node.isDirectory) return;
              // for (const file of files) {
              //   const dest = await join(node.path, file.name);
              //   await invoke("copy_file", {
              //     from: file.path,
              //     to: dest,
              //   });
              // }
            }}
          >
            <div
              draggable
              onDragStart={(e) => {
                dragNodeRef.current = node;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", node.path);
                console.log("Drag started:", node.path);
                // e.dataTransfer.setDragImage(e.currentTarget, 8, 8);
              }}
              onDragEnd={() => {
                dragNodeRef.current = null;
                dragOverNodeRef.current = null;
              }}
              className={`flex items-center gap-2 py-1 hover:bg-neutral-700 cursor-pointer ${
                targetNode?.path === node.path
                  ? "bg-neutral-600 border border-neutral-300"
                  : activeFile?.path === node.path
                  ? "bg-neutral-700"
                  : ""
              }`}
              style={{ paddingLeft: `${level * 12}px` }}
              onClick={() => {
                if (node.isDirectory) {
                  toggleExpand(node);
                  setTargetNode(node);
                } else {
                  handleFileClick(node);
                }
              }}
              title={node.path}
            >
              {node.isDirectory &&
                (node.expanded ? (
                  <ChevronDown className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-2" />
                ))}
              {node.isDirectory ? (
                node.loading ? (
                  <span className="w-4">⏳</span>
                ) : node.expanded ? (
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Folder className="w-4 h-4 text-yellow-500" />
                )
              ) : (
                <File className="w-4 h-4 ml-8" />
              )}
              <div className="flex w-full justify-between items-center">
                <div
                  className={`
                    truncate
                    ${
                      node.isDirectory && node.status === "M"
                        ? "text-yellow-200/70"
                        : node.status === "M"
                        ? "text-yellow-500"
                        : node.status === "A"
                        ? "text-green-500"
                        : node.status === "D"
                        ? "text-red-500"
                        : node.status === "U"
                        ? "text-orange-500"
                        : isIgnoredPath(node.path.slice(workspace.length + 1))
                        ? "text-neutral-500"
                        : ""
                    }
                  `}
                >
                  {node.name}
                </div>
                {node.isDirectory ? (
                  <div
                    className={`${
                      node.status === "M" &&
                      "bg-yellow-200/50 size-2 mr-4 rounded-full"
                    }`}
                  />
                ) : (
                  <div
                    className={`${node.status === "M" ? "mr-3.5" : "mr-4"} ${
                      node.status === "M"
                        ? "text-yellow-500"
                        : node.status === "A"
                        ? "text-green-500"
                        : node.status === "D"
                        ? "text-red-500"
                        : node.status === "U"
                        ? "text-orange-500"
                        : ""
                    }`}
                  >
                    {node.status !== "I" && node.status !== "" && node.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40 text-neutral-300 bg-primary-sidebar">
          {node.isDirectory && (
            <>
              <ContextMenuItem
                onClick={() => {
                  setTargetNode(node);
                  setAction("newFile");
                  setDialogOpen(true);
                }}
              >
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setTargetNode(node);
                  setAction("newFolder");
                  setDialogOpen(true);
                }}
              >
                New Folder
              </ContextMenuItem>
              <ContextMenuItem
                onClick={async () => {
                  const newSpace = await normalize(`${workspace}/${node.name}`);
                  setWorkspace(newSpace);
                  localStorage.setItem("workspacePath", newSpace);
                }}
              >
                Change Worksspace
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem
            onClick={() => {
              setTargetNode(node);
              setAction("rename");
              setValue(node.name);
              setDialogOpen(true);
            }}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-500"
            onClick={() => {
              setTargetNode(node);
              setAction("delete");
              setDialogOpen(true);
            }}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
        <div>
          {node.isDirectory && node.expanded && node.children && (
            <div>
              {node.children.map((c) => (
                <TreeItem key={c.path} node={c} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </ContextMenu>
    );
  };
  if (!workspace) {
    return <NoWorkspace />;
  }
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="h-full bg-primary-sidebar text-neutral-300 text-sm p-2">
            <div className="h-full w-full border border-neutral-600 rounded-xl py-4 overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-6">
                <div className="text-p6 font-semibold">
                  {workspace.split(/[\\/]/).pop()}
                </div>
                <div className="flex gap-3">
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setAction("newFile");
                      setDialogOpen(true);
                    }}
                    title="New File"
                  >
                    <FilePlus2 className="size-4.5" />
                  </button>
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setAction("newFolder");
                      setDialogOpen(true);
                    }}
                    title="New Folder"
                  >
                    <FolderPlus className="size-5" />
                  </button>
                  <button
                    className="text-xs text-neutral-300 hover:underline cursor-pointer"
                    onClick={() => {
                      localStorage.removeItem("workspacePath");
                      setActiveTab("Home");
                      setWorkspace(null);
                      setRoots(null);
                      setErrorMessage(null);
                    }}
                    title="Close Folder"
                  >
                    <FolderMinus className="size-5" />
                  </button>
                  <button
                    className="cursor-pointer"
                    onClick={reloadWorkspace}
                    title="Reload"
                  >
                    <FolderSync className="size-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-scroll overflow-x-hidden pb-4 max-h-full scrollbar">
                {roots === null ? (
                  <div className="text-sm text-gray-500">Loading…</div>
                ) : roots.length === 0 ? (
                  <div className="text-sm text-center text-gray-500 px-16 mt-5">
                    The folder you have selected is currently empty.
                  </div>
                ) : (
                  roots
                    .filter((r) => r.name !== ".git")
                    .map((r) => <TreeItem key={r.path} node={r} />)
                )}
              </div>
              {error && (
                <div className="text-sm text-red-500 mt-2">{error}</div>
              )}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-40 text-neutral-300 bg-primary-sidebar">
          <ContextMenuItem
            onClick={() => {
              setAction("newFile");
              setDialogOpen(true);
            }}
          >
            New File
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setAction("newFolder");
              setDialogOpen(true);
            }}
          >
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              localStorage.removeItem("workspacePath");
              setActiveTab("Home");
              setWorkspace(null);
              setRoots(null);
            }}
          >
            Close Workspace
          </ContextMenuItem>
        </ContextMenuContent>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="text-neutral-300">
            <DialogHeader>
              <DialogTitle>
                {action === "newFile" && "New File"}
                {action === "newFolder" && "New Folder"}
                {action === "rename" &&
                  `Rename ${targetNode?.isDirectory ? "Folder" : "File"}`}
                {action === "delete" &&
                  `Delete ${targetNode?.isDirectory ? "Folder" : "File"}`}
              </DialogTitle>
            </DialogHeader>
            {action !== "delete" && (
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter name"
                autoFocus
              />
            )}
            {errorMessage && (
              <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
            )}
            {action === "delete" && (
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{targetNode?.name}</span>?
              </p>
            )}
            <DialogFooter>
              <Button
                className="cursor-pointer"
                onClick={() => {
                  setDialogOpen(false);
                  setValue("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant={action === "delete" ? "destructive" : "secondary"}
                onClick={handleConfirm}
                className="border border-neutral-500 cursor-pointer disabled:opacity:50"
                disabled={action === "delete" ? false : value === ""}
              >
                {action === "delete" ? "Delete" : "OK"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ContextMenu>
    </>
  );
};

export default FileSystem;
