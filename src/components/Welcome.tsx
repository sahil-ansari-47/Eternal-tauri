import { useState } from "react";
import { Button } from "./ui/button";
import {
  FileText,
  Zap,
  GitBranch,
  Settings,
  Code2,
  Github,
  ChevronLeft,
} from "lucide-react";
import { useEditor } from "./contexts/EditorContext";
import { motion, AnimatePresence } from "framer-motion";
import ProjectTemplates from "./ProjectTemplates";
import { useLayout } from "./contexts/LayoutContext";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
export default function Welcome() {
  const [activeTab, setActiveTab] = useState("welcome");
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const {
    handleOpenFolder,
    handleCreateNewFile,
    handleOpenFile,
    setCloneDialogOpen,
    getUserRepos,
    recents,
  } = useEditor();
  const { wantBG, setWantBG, setRightOpen, setRightContent } = useLayout();

  const sidebarItems = [
    { id: "welcome", label: "Welcome", icon: FileText },
    { id: "getstarted", label: "Get Started", icon: Zap },
    { id: "recent", label: "Recent", icon: Code2 },
  ];

  const gettingStartedGuides = [
    {
      title: "Create Your First Project",
      description: "Set up a new project and start coding in minutes",
      icon: Code2,
    },
    {
      title: "Connect to Git",
      description: "Set up version control and collaborate with your team",
      icon: GitBranch,
    },
    {
      title: "Customize Your Workspace",
      description: "(unavailable in beta)",
      icon: Settings,
    },
  ];

  return (
    <div className="h-full text-p6 flex max-h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <aside className="w-64 from-primary-sidebar to-transparent flex flex-col z-10 bg-linear-to-r">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <img
              src="/logo.png"
              alt="IDE Logo"
              width={32}
              height={32}
              className="w-full h-full"
            />
          </div>
          <span className="font-bold text-lg">Eternal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "text-p6"
                    : "text-p6/50 hover:bg-p6/80 hover:text-p5 cursor-pointer"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="p-4 space-y-4">
          <Button
            className="w-full justify-start gap-2 bg-transparent hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer"
            size="sm"
          >
            <Github className="w-4 h-4" />
            GitHub
          </Button>
          <div className="flex items-center justify-between px-3">
            <Label htmlFor="background-switch" className="text-sm text-p6/70">
              Background
            </Label>
            <Switch
              id="background-switch"
              checked={wantBG}
              onCheckedChange={setWantBG}
              className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-teal-50"
            />
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 scrollbar overflow-x-hidden p-8 overflow-y-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "welcome" && (
            <div className="w-full space-y-12 z-10">
              {/* Hero Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 relative shrink-0">
                    <img
                      src="/logo.png"
                      alt="IDE Logo"
                      width={96}
                      height={96}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-3 z-10">
                    <h2 className="text-4xl font-bold">Welcome to Eternal</h2>
                    <p className="text-lg text-neutral-400">
                      A modern IDE built for developers who demand speed,
                      elegance, and infinite possibilities.
                    </p>
                  </div>
                </div>
              </div>
              {!showFileOptions && !showProjectOptions && (
                <motion.div
                  key="main-sections"
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  transition={{ duration: 0.05 }}
                  className="space-y-12"
                >
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                    <div className="flex flex-row flex-wrap gap-4 w-full">
                      <button
                        onClick={() => setShowFileOptions(true)}
                        className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">
                            Open a File
                          </span>
                        </div>
                        <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                          Create a new file or open an existing one
                        </p>
                      </button>
                      <button
                        onClick={handleOpenFolder}
                        className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">
                            Open Folder
                          </span>
                        </div>
                        <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                          Create new folder or open an existing one
                        </p>
                      </button>
                      <button
                        onClick={() => setShowProjectOptions(true)}
                        className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">
                            New Project
                          </span>
                        </div>
                        <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                          Build a new project from templates
                        </p>
                      </button>
                      <button
                        onClick={() => {
                          getUserRepos();
                          setCloneDialogOpen(true);
                        }}
                        className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">
                            Clone Repository
                          </span>
                        </div>
                        <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                          Clone from Git repository
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-4 z-10">
                    <h3 className="text-lg font-semibold">Key Features</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[Code2, Zap, GitBranch, Settings].map((Icon, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg hover:border-primary transition-colors flex items-start gap-3"
                        >
                          <Icon className="w-5 h-5 text-p6 mt-1 shrink-0" />
                          <div>
                            <p className="font-medium">
                              {
                                [
                                  "Intelligent Code",
                                  "Lightning Fast",
                                  "Git Integration",
                                  "Customizable",
                                ][idx]
                              }
                            </p>
                            <p className="text-sm text-neutral-300">
                              {
                                [
                                  "AI-powered autocomplete",
                                  "Optimized performance",
                                  "Built-in version control",
                                  "Personalize your workspace",
                                ][idx]
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          {showFileOptions && (
            <motion.div
              key="file-options"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.05 }}
              className="flex flex-col gap-6 items-start"
            >
              <h3 className="text-lg font-semibold">File Options</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleCreateNewFile}
                  className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">Create New</span>
                  </div>
                  <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                    Create a new file and open in editor
                  </p>
                </button>
                <button
                  onClick={handleOpenFile}
                  className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">Open Existing</span>
                  </div>
                  <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                    Open an existing file and continue editing
                  </p>
                </button>
              </div>
              <div
                className="flex gap-1 underline cursor-pointer"
                onClick={() => setShowFileOptions(false)}
              >
                <ChevronLeft /> Go Back
              </div>
            </motion.div>
          )}
          {/* Get Started Tab */}
          {activeTab === "getstarted" && (
            <div className="max-w-4xl space-y-8 z-10">
              <p className="font-semibold pl-4 text-p6 text-2xl">
                Get the most out of Eternal
              </p>
              <div className="grid gap-6">
                {gettingStartedGuides.map((guide, idx) => {
                  const Icon = guide.icon;
                  return (
                    <button
                      disabled={guide.title === "Customize Your Workspace"}
                      onClick={() => {
                        if (guide.title === "Create Your First Project") {
                          setShowProjectOptions(true);
                        } else if (guide.title === "Connect to Git") {
                          setRightContent("chat");
                          setRightOpen(true);
                        }
                      }}
                      key={idx}
                      className="group p-6 rounded-lg w-lg hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 disabled:bg-p5 border border-p6/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Icon className="w-6 h-6 mt-1 shrink-0" />
                          <div>
                            <h3 className="font-semibold text-lg text-left">
                              {guide.title}
                            </h3>
                            <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                              {guide.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {showProjectOptions && (
            <motion.div
              key="project-options"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.05 }}
              className="flex flex-col gap-6 items-start mt-10"
            >
              <h3 className="text-lg font-semibold">Project Templates</h3>
              <ProjectTemplates />
              <div
                onClick={() => setShowProjectOptions(false)}
                className="flex gap-1 underline cursor-pointer mt-2"
              >
                <ChevronLeft /> Go Back
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Tab */}
        {/* TODO - Add path and symbol */}
        {activeTab === "recent" && (
          <div className="max-w-4xl space-y-6">
            {recents.length > 0 ? (
              <div className="grid gap-3">
                {recents.map((project, idx) => (
                  <div
                    key={idx}
                    className="group p-6 rounded-lg w-lg hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 border border-p6/50 bg-primary-sidebar/70"
                  >
                    <div className="flex items-center gap-4">
                      <Code2 className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-semibold text-lg">{project.name}</p>
                        <p className="text-neutral-400 group-hover:text-p5 mt-1">
                          {project.language}
                        </p>
                      </div>
                    </div>
                    {/* <div className="text-sm text-muted-foreground">
                        {project.date}
                      </div> */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid">
                <div className="text-center py-12 bg-p5/80 rounded-2xl z-10">
                  <h2 className="text-bold text-lg text-p6 z-10">
                    No recent projects yet
                  </h2>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
