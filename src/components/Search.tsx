import { useState, useEffect } from "react";
import { useEditor } from "./contexts/EditorContext";
import {
  SearchXIcon,
  ListCollapse,
  ChevronDown,
  ChevronRight,
  CaseSensitive,
  WholeWord,
  Regex,
  Replace,
  ReplaceAll,
  ScanSearch,
} from "lucide-react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
export default function SearchPanel() {
  const {
    workspace,
    openFiles,
    setOpenFiles,
    setActiveFile,
    setTargetNode,
    query,
    setQuery,
  } = useEditor();
  const [replaceText, setReplaceText] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [matchCase, setMatchCase] = useState(false);
  const [matchWhole, setMatchWhole] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  useEffect(() => {
    if (!query || !workspace) {
      setResults([]);
      return;
    }
    const handler = setTimeout(() => {
      console.log("Searching for:", query);
      invoke<SearchResult[]>("search_in_workspace", {
        workspace,
        query,
        options: {
          match_case: matchCase,
          whole_word: matchWhole,
          regex: useRegex,
        },
      })
        .then((res) => {
          setResults(res);
          setExpandedFiles(
            Object.fromEntries(res.map((r) => [r.filePath, true]))
          );
        })
        .catch((err) => console.error("Search failed:", err));
    }, 400);

    return () => clearTimeout(handler);
  }, [query, matchCase, matchWhole, useRegex, workspace]);
  function highlightMatch(text: string, query: string, matchCase: boolean) {
    if (!query) return text;
    const flags = matchCase ? "g" : "gi";
    const regex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      flags
    );
    return text.split(regex).reduce((acc: React.ReactNode[], part, i, arr) => {
      acc.push(part);
      if (i < arr.length - 1) {
        acc.push(
          <span key={i} className="bg-neutral-200 text-black rounded-xs">
            {text.match(regex)?.[0] ?? query}
          </span>
        );
      }
      return acc;
    }, []);
  }

  const toggleFile = (filePath: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  };

  const openMatch = async (filePath: string, line: number) => {
    const content = await readTextFile(filePath);
    if (!openFiles.find((f) => f.path === filePath)) {
      setOpenFiles((prev) => [...prev, { path: filePath, content } as FsNode]);
    }
    setActiveFile({ path: filePath, content } as FsNode);
    setTargetNode({
      path: filePath.split("\\").slice(0, -1).join("\\"),
    } as FsNode);
    if (line !== undefined) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("scroll-to-line", {
            detail: { filePath, line, query },
          })
        );
      }, 100);
    }
  };

  const collapseAll = () => {
    setExpandedFiles(
      Object.fromEntries(results.map((r) => [r.filePath, false]))
    );
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  const replaceNext = async () => {
    if (!query || !workspace) return;

    try {
      await invoke("replace_in_workspace", {
        query,
        results,
        replaceText,
        options: {
          replace_next: true,
          replace_all: false,
        },
      });
      //TODO: change open file editor state
      setResults(results.slice(1));
    } catch (err) {
      console.error("Replace next failed:", err);
    }
  };

  const replaceAll = async () => {
    if (!query || !workspace) return;
    try {
      const res = await invoke<{ replaced: number }>("replace_in_workspace", {
        query,
        results,
        replaceText,
        options: {
          replace_next: false,
          replace_all: true,
        },
      });

      console.log("Replaced count:", res.replaced);
      setResults([]);
      setQuery("");
    } catch (err) {
      console.error("Replace all failed:", err);
    }
  };

  return (
    <div className="p-2 bg-primary-sidebar h-full">
      <div className="flex flex-col w-full h-full text-neutral-300 border border-neutral-600 rounded-xl">
        <div className="flex items-center justify-between p-2 border-b border-neutral-300 text-neutral-400">
          <div className="ml-4">Search</div>
          <div className="flex gap-2">
            <ScanSearch
              size={18}
              className="cursor-pointer hover:text-white"
              onClick={() => setQuery(query)}
            />
            <SearchXIcon
              size={18}
              className="cursor-pointer hover:text-white"
              onClick={clearSearch}
            />
            <ListCollapse
              size={18}
              className="cursor-pointer hover:text-white"
              onClick={collapseAll}
            />
          </div>
        </div>

        {/* Find Bar */}
        <div className="flex items-center gap-2 p-2">
          <input
            type="text"
            placeholder="Find"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-1 text-sm bg-neutral-800 border border-neutral-600 rounded"
          />
          <CaseSensitive
            size={18}
            className={`cursor-pointer ${
              matchCase ? "text-blue-400" : "text-neutral-400"
            }`}
            onClick={() => setMatchCase(!matchCase)}
          />
          <WholeWord
            size={18}
            className={`cursor-pointer ${
              matchWhole ? "text-blue-400" : "text-neutral-400"
            }`}
            onClick={() => setMatchWhole(!matchWhole)}
          />
          <Regex
            size={18}
            className={`cursor-pointer ${
              useRegex ? "text-blue-400" : "text-neutral-400"
            }`}
            onClick={() => {
              setUseRegex(!useRegex);
              setMatchCase(false);
              setMatchWhole(false);
            }}
          />
        </div>

        {/* Replace Bar */}
        <div className="flex items-center gap-2 p-2">
          <input
            type="text"
            placeholder="Replace"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="flex-1 p-1 text-sm bg-neutral-800 border border-neutral-600 rounded"
          />
          <Replace
            size={18}
            className="cursor-pointer hover:text-white"
            onClick={replaceNext}
          />
          <ReplaceAll
            size={18}
            className="cursor-pointer hover:text-white"
            onClick={replaceAll}
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto text-sm scrollbar">
          {results.length === 0 && (
            <div className="text-neutral-500 italic p-4">No results</div>
          )}
          {results.map((file) => (
            <div key={file.filePath} className="mb-2">
              <div
                className="cursor-pointer font-semibold text-neutral-300 hover:text-white flex items-center px-4"
                onClick={() => toggleFile(file.filePath)}
              >
                {expandedFiles[file.filePath] ? (
                  <ChevronDown size={14} className="mr-1" />
                ) : (
                  <ChevronRight size={14} className="mr-1" />
                )}
                {file.filePath.replace(workspace + "", "").slice(1)}
              </div>
              {expandedFiles[file.filePath] && (
                <ul className="mt-1 space-y-1">
                  {file.matches.map((m, i) => (
                    <li
                      key={i}
                      className="cursor-pointer hover:bg-neutral-700 py-1 pl-5"
                      onClick={() => openMatch(file.filePath, m.line)}
                    >
                      <span className="text-neutral-400">Line {m.line}:</span>{" "}
                      <span className="text-neutral-200">
                        {highlightMatch(m.text, query, matchCase)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
