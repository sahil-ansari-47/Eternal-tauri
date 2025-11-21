import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Copy } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useEditor } from "./contexts/EditorContext";

interface Framework {
  name: string;
  image: string;
  tags: string[];
}

export default function ProjectTemplates() {
  const { setWorkspace } = useEditor();
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [finalCommand, setFinalCommand] = useState("");

  const frameworks: Framework[] = [
    {
      name: "React",
      image: "/frameworks/react.png",
      tags: ["pnpm", "typescript", "swc"],
    },
    { name: "Vue", image: "/frameworks/vue.svg", tags: ["pnpm", "typescript"] },
    {
      name: "Svelte",
      image: "/frameworks/svelte.svg",
      tags: ["pnpm", "typescript"],
    },
    {
      name: "Next.js",
      image: "/frameworks/next.svg",
      tags: [
        "typescript",
        "tailwind",
        "eslint",
        "app router",
        "src",
        "turbopack",
        "pnpm",
        "no-git",
      ],
    },
    {
      name: "Angular",
      image: "/frameworks/angular.svg",
      tags: ["css", "scss", "sass", "less", "no-git", "standlalone", "ssr"],
    },
    { name: "Django", image: "/frameworks/django.svg", tags: [] },
    {
      name: "Expo",
      image: "/frameworks/expo.svg",
      tags: [
        "pnpm",
        "no-git",
        "expo-router",
        "typescript",
        "nativewind",
        "nativewindui",
        "zustand",
      ],
    },
    {
      name: "Nuxt.js",
      image: "/frameworks/nuxt.svg",
      tags: ["NuxtUI", "Nuxt 4", "Content-Driven", "Nuxt Module"],
    },
  ];

  useEffect(() => {
    if (selectedFramework) {
      updateCommand(selectedFramework.name, selectedTags, projectName);
    }
  }, [selectedFramework]);
  const toggleTag = (tag: string) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(updated);

    if (selectedFramework)
      updateCommand(selectedFramework.name, updated, projectName);
  };

  const updateCommand = (framework: string, tags: string[], name: string) => {
    let cmd = "";

    switch (framework) {
      case "React":
        cmd = `${tags.includes("pnpm") ? "pnpm" : "npm"} create vite@latest ${
          name || "my-app"
        } ${tags.includes("pnpm") ? "" : "--"} --template react${
          tags.includes("swc") ? "-swc" : ""
        }${tags.includes("typescript") ? "-ts" : ""}`;
        break;

      case "Next.js":
        cmd = `${
          tags.includes("pnpm") ? "pnpm" : "npm"
        } create-next-app@latest ${name || "my-next-app"} ${tags
          .map((t) => `--${t.replace(/\s/g, "-")}`)
          .join(" ")}`;
        break;

      case "Vue":
        cmd = `${tags.includes("pnpm") ? "pnpm" : "npm"} create vite@latest ${
          name || "my-vue-app"
        } --template vue${tags.includes("typescript") ? "-ts" : ""}`;
        break;

      case "Svelte":
        cmd = `npm create vite@latest ${
          name || "my-svelte-app"
        } --template svelte${tags.includes("typescript") ? "-ts" : ""}`;
        break;

      case "Angular":
        cmd = `ng new ${name || "my-angular-app"} ${tags
          .map((t) => `--${t}`)
          .join(" ")}`;
        break;

      case "Django":
        cmd = `django-admin startproject ${name || "myproject"}`;
        break;

      case "Expo":
        cmd = `npx create-expo-app ${name || "my-expo-app"} ${tags
          .map((t) => `--${t}`)
          .join(" ")}`;
        break;

      case "Nuxt.js":
        cmd = `npx nuxi init ${name || "my-nuxt-app"}`;
        break;
    }
    setFinalCommand(cmd.trim());
  };

  const createProject = async () => {
    if (!selectedFramework) return;
    const workspace = await open({ directory: true });
    if (!workspace) return;
    setShowCreateModal(false);
    setLoading(true);
    await invoke("generate_project", {
      finalCommand,
      workspace,
    });
    setLoading(false);
    setWorkspace(workspace);
    localStorage.setItem("workspacePath", workspace);
    setSelectedTags([]);
    setProjectName("");
    setFinalCommand("");
  };

  const copyCommand = () => navigator.clipboard.writeText(finalCommand);

  return (
    <>
      <div className="grid gap-4 w-full xl:w-7/10 justify-start grid-cols-[repeat(auto-fit,160px)]">
        {frameworks.map((framework) => (
          <button
            key={framework.name}
            onClick={() => {
              setSelectedFramework(framework);
              setSelectedTags([]);
              setProjectName("");
              setShowCreateModal(true);
              setFinalCommand("");
            }}
            className="group p-6 rounded-lg aspect-square flex flex-col items-center justify-center hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer bg-primary-sidebar/70 border border-p6/50 shadow-sm hover:shadow-lg"
          >
            <img
              src="/frameworks/next.svg"
              alt={framework.name}
              className="w-12 h-12 mb-3 object-contain"
            />
            <span className="font-semibold text-lg">{framework.name}</span>
          </button>
        ))}
      </div>

      {showCreateModal && selectedFramework && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-primary-sidebar p-6 rounded-xl w-[420px] shadow-2xl border border-p6 relative">
            <div className="flex flex-col items-center mb-4">
              <img src={selectedFramework.image} className="w-20 h-20 mb-3" />
            </div>

            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                updateCommand(
                  selectedFramework.name,
                  selectedTags,
                  e.target.value
                );
              }}
              className="w-full mb-4 p-2 rounded bg-neutral-900 border border-p6"
            />

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedFramework.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full border ${
                    selectedTags.includes(tag)
                      ? "bg-p6 text-p5"
                      : "bg-neutral-800"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="bg-neutral-900 p-3 rounded border border-p6 text-sm font-mono relative">
              <button
                onClick={copyCommand}
                className="absolute right-2 top-[calc(50%-9px)] opacity-70 hover:opacity-100"
              >
                <Copy size={18} />
              </button>
              {finalCommand || "Command will appear here..."}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-300"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white"
                onClick={createProject}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
