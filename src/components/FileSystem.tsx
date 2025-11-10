import * as React from "react";
import { useEffect, useState } from "react";
import {
  readDir,
  readTextFile,
  rename,
  create,
  mkdir,
  remove,
} from "@tauri-apps/plugin-fs";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { loadChildren, traverseAndUpdate, sortNodes } from "../utils/fsfunc";
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
  } = useEditor();
  const [targetNode, setTargetNode] = useState<FsNode | null>(null);
  const [value, setValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  useEffect(() => {
    reloadWorkspace();
    if (workspace) {
      invoke("watch_workspace", { path: workspace });
      const unlisten = listen("fs-change", (event) => {
        console.log("Change:", event.payload);
        reloadWorkspace();
      });
      return () => {
        unlisten
          .then((u) => console.log("unlisten:", u))
          .catch((e) => {
            console.error("Failed to unlisten fs-change:", e);
          });
      };
    }
  }, [workspace]);

  const refreshSubtree = async (
    nodes: FsNode[],
    dirPath: string
  ): Promise<FsNode[]> => {
    return Promise.all(
      nodes.map(async (node) => {
        if (node.path === dirPath && node.isDirectory && node.expanded) {
          const entries = await readDir(dirPath);
          const children: FsNode[] = [];
          for (const e of entries) {
            if (e.name) {
              children.push({
                name: e.name,
                path: await join(dirPath, e.name),
                isDirectory: e.isDirectory,
              });
            }
          }
          return { ...node, children: sortNodes(children) };
        }
        if (node.children) {
          return {
            ...node,
            children: await refreshSubtree(node.children, dirPath),
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
        setOpenFiles((prev) => [...prev, { path, content: "" } as File]);
      } else if (action === "newFolder") {
        await mkdir(await join(dir, value.trim()));
      }
    } else if (action === "delete" && targetNode) {
      await remove(targetNode.path, { recursive: targetNode.isDirectory });
      setOpenFiles((prev) => prev.filter((f) => f.path !== targetNode.path));
    }

    setDialogOpen(false);
    setValue("");
    setAction(null);
    setTargetNode(null);
  };
  const handleFileClick = async (node: FsNode) => {
    if (!node.isDirectory) {
      const content = await readTextFile(node.path);
      handleOpenFile(node.path, content);
    }
  };
  const handleOpenFile = (path: string, content: string) => {
    setActivePath(path);
    setOpenFiles((prev) =>
      prev.find((f) => f.path === path)
        ? prev
        : [...prev, { path, content } as File]
    );
  };
  const toggleExpand = async (nodePath: string) => {
    if (!roots) return;
    const updated = await traverseAndUpdate(roots, nodePath, async (n) => {
      if (!n.isDirectory) return n;
      if (!n.children) {
        n.loading = true;
        const children = await loadChildren(n.path);
        n.children = sortNodes(children);
        n.loading = false;
        n.expanded = true;
      } else {
        n.expanded = !n.expanded;
      }
      return n;
    });
    setRoots(updated);
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
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 rounded cursor-pointer select-none"
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
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
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
              <File className="w-4 h-4" />
            )}
            <span className="truncate">{node.name}</span>
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
          <div className="h-full w-full border border-neutral-600 rounded-xl px-2 py-4 overflow-y-hidden">
            <div className="flex items-center justify-between mb-2 px-2">
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

            <div className="px-2 overflow-y-scroll max-h-full scrollbar">
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
