import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
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
// export async function traverseAndUpdate(
//   nodes: FsNode[],
//   targetPath: string,
//   updater: (n: FsNode) => Promise<FsNode>
// ) {
//   const result: FsNode[] = [];
//   for (const n of nodes) {
//     const nodePath = await normalize(n.path);
//     const targetNodePath = await normalize(targetPath);
//     if (nodePath === targetNodePath) {
//       const updated = await updater({ ...n });
//       result.push(updated);
//     } else {
//       if (n.children) {
//         const updatedChildren = await traverseAndUpdate(
//           n.children,
//           targetPath,
//           updater
//         );
//         result.push({ ...n, children: updatedChildren });
//       } else {
//         result.push({ ...n });
//       }
//     }
//   }
//   return result;
// }
export const sortNodes = (nodes: FsNode[]): FsNode[] => {
  return nodes.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
};
// export const applyExpanded = (
  //   nodes: FsNode[],
  //   expandedMap: Record<string, boolean>
  // ): FsNode[] => {
    //   if (Object.keys(expandedMap).length === 0) return nodes;
    //   return nodes.map((node) => ({
      //     ...node,
      //     expanded: expandedMap[node.path] ?? node.expanded,
      //     children: node.children
      //       ? applyExpanded(node.children, expandedMap)
      //       : node.children,
//   }));
// };
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
export const buildPrevMap = (nodes: FsNode[] | null) => {
  const map = new Map<string, FsNode>();
  if (!nodes) return map;
  const traverse = (list: FsNode[]) => {
    for (const n of list) {
      map.set(n.path, n);
      if (n.children) traverse(n.children);
    }
  };
  traverse(nodes);
  return map;
};

export const mergeWithPrev = (
  newNodes: FsNode[],
  prevMap: Map<string, FsNode>,
  expandedMap: Record<string, boolean>
): FsNode[] => {
  return newNodes.map((n) => {
    const prev = prevMap.get(n.path);
    // use expandedMap if present, otherwise use prev.expanded or default false
    const expanded = expandedMap[n.path] ?? prev?.expanded ?? false;
    // preserve status from prev if exists
    const status = prev?.status ?? n.status ?? "";
    // preserve children from prev if available (and keep them merged recursively)
    let children: FsNode[] | undefined;
    if (prev?.children) {
      // if prev had children, keep them (but ensure we merge their nodes to keep up-to-date names)
      children = mergeWithPrev(prev.children, prevMap, expandedMap);
    } else if (n.children) {
      // new node has children from readDir (rare for top-level when you populate subdirs), merge them too
      children = mergeWithPrev(n.children, prevMap, expandedMap);
    } else {
      children = undefined;
    }

    return {
      ...n,
      expanded,
      status,
      children,
    };
  });
};

export const readTree = async (nodePath: string): Promise<FsNode[]> => {
  const entries = await readDir(nodePath);

  return Promise.all(
    entries.map(async (e) => {
      const fullPath = await join(nodePath, e.name);

      const node: FsNode = {
        name: e.name,
        path: fullPath,
        isDirectory: e.isDirectory,
        status: "",
      };

      if (e.isDirectory) {
        // read children
        node.children = await readTree(fullPath);
      }

      return node;
    })
  );
};

