import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Copy } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useEditor } from "./contexts/EditorContext";
import { useLayout } from "./contexts/LayoutContext";
import { normalize } from "@tauri-apps/api/path";
import { Button } from "./ui/button";
interface Framework {
  name: string;
  image: string;
  tags: string[];
}
import { message } from "@tauri-apps/plugin-dialog";
export default function ProjectTemplates() {
  const { setWorkspace, setActiveTab } = useEditor();
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(
    null
  );
  const { setLeftOpen, setLeftContent } = useLayout();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [finalCommand, setFinalCommand] = useState("");

  const frameworks: Framework[] = [
    {
      name: "React",
      image: "/react.svg",
      tags: ["pnpm", "typescript", "swc"],
    },
    { name: "Vue", image: "/vue.svg", tags: ["pnpm", "typescript"] },
    {
      name: "Svelte",
      image: "/svelte.svg",
      tags: ["pnpm", "typescript"],
    },
    {
      name: "Next.js",
      image: "/next.svg",
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
      image: "/angular.svg",
      tags: [
        "scss",
        "inline-style",
        "inline-template",
        "pnpm",
        "skip-git",
        "routing",
        "zoneless",
        "standalone",
        "ssr",
      ],
    },
    { name: "Django", image: "/django.svg", tags: [] },
    {
      name: "Expo",
      image: "/expo.svg",
      tags: ["pnpm", "no-git", "expo-router", "nativewind", "zustand"],
    },
    {
      name: "Nuxt.js",
      image: "/nuxt.svg",
      tags: ["NuxtUI", "Content-Driven", "Nuxt Module"],
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
    const projectName =
      name?.trim() ||
      {
        React: "my-app",
        "Next.js": "my-next-app",
        Vue: "my-vue-app",
        Svelte: "my-svelte-app",
        Angular: "my-angular-app",
        Django: "myproject",
        Expo: "my-expo-app",
        "Nuxt.js": "my-nuxt-app",
      }[framework];
    let cmd = "";
    switch (framework) {
      case "React":
        cmd = [
          tags.includes("pnpm") ? "pnpm" : "npm",
          "create",
          "vite@latest",
          projectName,
          tags.includes("pnpm") ? "" : "--",
          `--template react${tags.includes("swc") ? "-swc" : ""}${
            tags.includes("typescript") ? "-ts" : ""
          }`,
        ]
          .filter(Boolean)
          .join(" ");
        break;
      case "Next.js":
        cmd = [
          "npx create-next-app@latest",
          projectName,
          tags.includes("pnpm") ? "--use-pnpm" : "",
          tags.includes("typescript") ? "--ts" : "",
          tags.includes("tailwind") ? "--tailwind" : "",
          tags.includes("eslint") ? "--eslint" : "--no-eslint",
          tags.includes("app router") ? "--app" : "",
          tags.includes("src") ? "--src-dir" : "",
          tags.includes("turbopack") ? "--turbopack" : "--webpack",
          tags.includes("no-git") ? "--no-git" : "",
          "--skip-install",
        ]
          .filter(Boolean)
          .join(" ");
        break;
      case "Vue":
        cmd = [
          tags.includes("pnpm") ? "pnpm" : "npm",
          "create",
          "vite@latest",
          projectName,
          tags.includes("pnpm") ? "" : "--",
          `--template vue${tags.includes("typescript") ? "-ts" : ""}`,
        ]
          .filter(Boolean)
          .join(" ");
        break;
      case "Svelte":
        cmd = [
          "npm create vite@latest",
          projectName,
          `--template svelte${tags.includes("typescript") ? "-ts" : ""}`,
        ].join(" ");
        break;
      case "Angular":
        cmd = [
          "ng new",
          projectName,
          tags.includes("pnpm") ? "--packageManager=pnpm" : "",
          tags.includes("scss") ? "--style=scss" : "",
          tags.includes("inline-style") ? "--inline-style" : "",
          tags.includes("inline-template") ? "--inline-template" : "",
          tags.includes("routing") ? "--routing" : "",
          tags.includes("standalone") ? "--standalone" : "",
          tags.includes("ssr") ? "--ssr" : "",
          tags.includes("skip-git") ? "--skip-git" : "",
          tags.includes("zoneless") ? "--experimental-zoneless" : "",
          "--skip-install",
          "--defaults",
        ]
          .filter(Boolean)
          .join(" ");
        break;
      case "Django":
        cmd = `django-admin startproject ${projectName}`;
        break;
      case "Expo":
        cmd = [
          "npx --yes create-expo-stack",
          projectName,
          ...tags.map((t) => `--${t}`),
          "--no-install",
        ].join(" ");
        break;
      case "Nuxt.js":
        cmd = `npm create nuxt@latest ${projectName} ${
          tags.includes("NuxtUI")
            ? "-- -t ui"
            : tags.includes("Content-Driven")
            ? "-- -t content"
            : tags.includes("Nuxt Module")
            ? "-- -t module"
            : ""
        } --gitInit --no-install`;
        break;
      default:
        cmd = "";
    }
    setFinalCommand(cmd.trim());
  };

  const createProject = async () => {
    if (!selectedFramework) return;
    const workspace = await open({ directory: true });
    if (!workspace) return;
    try {
      setShowCreateModal(false);
      setActiveTab("Loading");
      await invoke("generate_project", {
        finalCommand,
        workspace,
      });
      const normalpath = await normalize(`${workspace}/${projectName}`);
      setActiveTab("Splash");
      setWorkspace(normalpath);
      localStorage.setItem("workspacePath", normalpath);
      setLeftOpen(true);
      setLeftContent("files");
      setSelectedTags([]);
      setProjectName("");
      setFinalCommand("");
    } catch (e: any) {
      setActiveTab("Home");
      await message(e.message, { title: "Error", kind: "error" });
      console.log(e);
    }
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
            className="group p-6 rounded-lg aspect-square flex flex-col items-center justify-center hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer bg-p6/20 border border-p6/50 shadow-sm hover:shadow-lg z-10"
            title={framework.name}
          >
            <img
              src={framework.image}
              alt={framework.name}
              className="w-12 h-12 mb-3 object-contain"
            />
            <span className="font-semibold text-lg">{framework.name}</span>
          </button>
        ))}
      </div>

      {showCreateModal && selectedFramework && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-p5 p-6 rounded-xl w-105 shadow-2xl border border-p6 relative">
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
              <Button
                className="cursor-pointer"
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  createProject();
                }}
                className="border border-neutral-500 cursor-pointer disabled:opacity:50"
                disabled={projectName.trim() === ""}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
