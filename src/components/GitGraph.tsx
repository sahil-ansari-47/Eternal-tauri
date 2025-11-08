// import { useEffect, useRef } from "react";
// import mermaid from "mermaid";

// const GitGraph = ({ graphData }: { graphData: GitGraphNode[] }) => {
//   const ref = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     mermaid.initialize({
//       startOnLoad: false,
//       theme: "default",
//       themeVariables: {
//         git0: "#3b82f6",
//         git1: "#22c55e",
//       },
//     });

//     const mermaidCode = `
//       gitGraph TB:
//         ${graphData
//           .map((item) => {
//             let line = `commit id: "${item.hash}" tag: "${item.message}"`;
//             if (item.isHead) line += " type: HIGHLIGHT";
//             if (item.remote) line += ' tag: "remote"';
//             return line;
//           })
//           .join("\n        ")}
//     `;

//     if (ref.current) {
//       interface GitGraphNode {
//         hash: string;
//         message: string;
//         isHead?: boolean;
//         remote?: boolean;
//       }

//       interface MermaidRenderCallback {
//         (svgCode: string): void;
//       }

//             mermaid.render("gitGraphDiv", mermaidCode, (svgCode: ) => {
//               ref.current!.innerHTML = svgCode;
//             });
//     }
//   }, [graphData]);

//   return (
//     <div className="h-full px-3 py-2 text-xs">
//       <div ref={ref}></div>
//     </div>
//   );
// };

// export default GitGraph;
