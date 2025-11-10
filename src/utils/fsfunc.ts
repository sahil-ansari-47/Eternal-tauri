import { readDir } from "@tauri-apps/plugin-fs";
import { join, normalize } from "@tauri-apps/api/path";
export async function loadChildren(nodePath: string) {
  try {
    const entries = await readDir(nodePath);
    return (await Promise.all(
      entries.map(async (e) => ({
        name: e.name,
        path: await join(nodePath, e.name),
        isDirectory: e.isDirectory,
      }))
    )) as FsNode[];
  } catch (e) {
    console.error("loadChildren error", e);
    return [];
  }
}
export async function traverseAndUpdate(
  nodes: FsNode[],
  targetPath: string,
  updater: (n: FsNode) => Promise<FsNode>
) {
  const result: FsNode[] = [];
  for (const n of nodes) {
    if (normalize(n.path) === normalize(targetPath)) {
      const updated = await updater({ ...n });
      result.push(updated);
    } else {
      if (n.children) {
        const updatedChildren = await traverseAndUpdate(
          n.children,
          targetPath,
          updater
        );
        result.push({ ...n, children: updatedChildren });
      } else {
        result.push({ ...n });
      }
    }
  }
  return result;
}
export const sortNodes = (nodes: FsNode[]): FsNode[] => {
  return nodes.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
};
export const preserveExpanded = (nodes: FsNode[]): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  const traverse = (n: FsNode[]) => {
    for (const node of n) {
      if (node.expanded) map[node.path] = true;
      if (node.children) traverse(node.children);
    }
  };
  traverse(nodes);
  return map;
};

export const applyExpanded = (
  nodes: FsNode[],
  expandedMap: Record<string, boolean>
): FsNode[] => {
  if (Object.keys(expandedMap).length === 0) return nodes;
  return nodes.map((node) => ({
    ...node,
    expanded: expandedMap[node.path] ?? node.expanded,
    children: node.children
      ? applyExpanded(node.children, expandedMap)
      : node.children,
  }));
};
