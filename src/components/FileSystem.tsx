import * as React from "react";
import { useEffect, useState, useRef } from "react";
import {
  readDir,
  DirEntry,
  readTextFile,
  rename,
  create,
  mkdir,
  remove,
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
    errorMessage,
    setErrorMessage,
    setActivePath,
    setOpenFiles,
    reloadWorkspace,
    roots,
    setRoots,
    viewRefs,
    setActiveTab,
  } = useEditor();
  const { status, refreshStatus } = useGit();
  const rootsRef = useRef<FsNode[] | null>(null);
  const nodeMapRef = useRef(new Map<string, FsNode>());
  const [targetNode, setTargetNode] = useState<FsNode | null>(null);
  const [value, setValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const getParentDir = (path: string) => {
    const parts = path.split(/[\\/]/);
    parts.pop();
    return parts.join("/");
  };
  useEffect(() => {
    reloadWorkspace();
    if (!workspace) return;
    invoke("watch_workspace", { path: workspace });
    const unlistenPromise = listen("fs-change", async (event: any) => {
      const changedPaths: string[] = event.payload;
      if (!Array.isArray(changedPaths) || changedPaths.length === 0) return;
      const uniqueParents = new Set(changedPaths.map(getParentDir));
      let nextRoots = rootsRef.current;
      for (const dir of uniqueParents) {
        if (nextRoots === null) return;
        nextRoots = await refreshSubtree(nextRoots, dir);
      }
      setRoots(nextRoots);
    });
    return () => {
      unlistenPromise
        .then((unlisten) => unlisten())
        .catch((e) => console.error("Failed to unlisten fs-change:", e));
    };
  }, [workspace]);

  useEffect(() => {
    if (!roots) return;
    refreshStatus();
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
  }, [roots]);
  useEffect(() => {
    if (!status || !roots) return;
    let cancelled = false;
    (async () => {
      const updated = await applyGitStatusToNodes(roots, status);
      if (!cancelled) {
        setRoots((prev) => {
          if (!prev) return prev;
          return updated;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const applyGitStatusToNodes = async (
    nodes: FsNode[],
    status: GitStatus
  ): Promise<FsNode[]> => {
    const map = await buildGitStatusMap(status);
    const apply = async (list: FsNode[]): Promise<FsNode[]> => {
      return Promise.all(
        list.map(async (node) => {
          const norm = await normalize(node.path);
          const children = node.children
            ? await apply(node.children)
            : undefined;
          const status = !node.isDirectory
            ? map.get(norm) ?? ""
            : children?.some((c) => c.status !== "")
            ? "M"
            : "";
          return {
            ...node,
            status,
            children,
          };
        })
      );
    };
    return apply(nodes);
  };
  const buildGitStatusMap = async (status: GitStatus) => {
    const map = new Map<string, "A" | "M" | "D" | "U">();
    const add = async (path: string, s: "A" | "M" | "D" | "U") => {
      if (!workspace) return;
      const full = await normalize(await join(workspace, path));
      map.set(full, s);
    };
    await Promise.all([
      ...status.staged.map((f) => add(f.path, f.status === "A" ? "A" : "M")),
      ...status.unstaged.map((f) => add(f.path, "M")),
      ...status.untracked.map((f) => add(f.path, "U")),
    ]);
    return map;
  };
  const refreshSubtree = async (
    nodes: FsNode[],
    targetDir: string
  ): Promise<FsNode[]> => {
    return Promise.all(
      nodes.map(async (node) => {
        if (!node.expanded) return node;
        if (node.path === targetDir) {
          const entries = await readDir(targetDir);
          const children = await Promise.all(
            entries.map(async (e: DirEntry) => ({
              name: e.name,
              path: await join(targetDir, e.name),
              isDirectory: e.isDirectory,
            }))
          );
          return { ...node, children: sortNodes(children) };
        }
        if (node.children) {
          return {
            ...node,
            children: await refreshSubtree(node.children, targetDir),
          };
        }
        return node;
      })
    );
  };
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
          isDirectory: false,
          status: "U",
        } as FsNode);
        setActivePath(path);
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
    setOpenFiles((prev) =>
      prev.find((f) => f.path === node.path) ? prev : [...prev, node]
    );
    setTimeout(() => {
      setActivePath(node.path);
    }, 200);
  };
  const toggleExpand = (nodePath: string) => {
    const node = nodeMapRef.current.get(nodePath);
    if (!node || !node.isDirectory) return;
    // instant visual feedback
    node.expanded = !node.expanded;
    // trigger minimal rerender
    setRoots((prev: FsNode[] | null) => (prev ? [...prev] : prev));
    // if already loaded or collapsing → done
    if (node.children || !node.expanded) return;
    // lazily load children
    loadChildren(nodePath).then((children) => {
      node.children = sortNodes(children);
      setRoots((prev: FsNode[] | null) => (prev ? [...prev] : prev));
    });
  };
  const TreeItem: React.FC<{ node: FsNode; level?: number }> = ({
    node,
    level = 0,
  }) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            key={node.path}
            className="flex items-center gap-2 py-1 hover:bg-neutral-700 cursor-pointer select-none"
            style={{ paddingLeft: `${level * 12}px` }}
            onClick={() => {
              if (node.isDirectory) {
                toggleExpand(node.path);
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
                className={`truncate ${
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
                    : ""
                }`}
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
                  {node.status}
                </div>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40 text-neutral-300 bg-primary-sidebar">
          {node.isDirectory && (
            <>
              <ContextMenuItem
                onClick={() => {
                  setAction("newFile");
                  setTargetNode(node);
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
        {node.isDirectory && node.expanded && node.children && (
          <div>
            {node.children.map((c) => (
              <TreeItem key={c.path} node={c} level={level + 1} />
            ))}
          </div>
        )}
      </ContextMenu>
    );
  };

  if (!workspace) {
    return <NoWorkspace />;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="h-full overflow-auto bg-primary-sidebar text-neutral-300 text-sm p-2">
          <div className="h-full w-full border border-neutral-600 rounded-xl py-4 overflow-y-hidden">
            <div className="flex items-center justify-between mb-2 px-6">
              <div className="text-p6 font-semibold">
                {workspace.split(/[\\/]/).pop()}
              </div>
              <div className="flex gap-2">
                <button
                  className="cursor-pointer"
                  onClick={() => {
                    setAction("newFile");
                    setDialogOpen(true);
                  }}
                  title="New File"
                >
                  <FilePlus2 className="size-3.5" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => {
                    setAction("newFolder");
                    setDialogOpen(true);
                  }}
                  title="New Folder"
                >
                  <FolderPlus className="size-4" />
                </button>
                <button
                  className="text-xs text-neutral-300 hover:underline cursor-pointer"
                  onClick={() => {
                    localStorage.removeItem("workspacePath");
                    setActiveTab("Home");
                    setWorkspace(null);
                    setRoots(null);
                  }}
                  title="Close Folder"
                >
                  <FolderMinus className="size-4" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={reloadWorkspace}
                  title="Collapse"
                >
                  <FolderSync className="size-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-scroll pb-4 max-h-full scrollbar">
              {roots === null ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : roots.length === 0 ? (
                <div className="text-sm text-gray-500">
                  The folder you have selected is currently empty.
                </div>
              ) : (
                roots
                  .filter((r) => r.name !== ".git")
                  .map((r) => <TreeItem key={r.path} node={r} />)
              )}
            </div>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
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
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                setDialogOpen(false);
                setValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="border-1 border-neutral-500 cursor-pointer disabled:opacity:50"
              disabled={action === "delete" ? false : value === ""}
            >
              {action === "delete" ? "Delete" : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
};

export default FileSystem;
