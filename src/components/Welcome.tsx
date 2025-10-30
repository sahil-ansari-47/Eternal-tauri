// const Welcome = () => {
//   return (
//     <div className="h-full text-neutral-300">
//       <div>Welcome</div>
//     </div>
//   );
// };

// export default Welcome;

// "use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  FileText,
  Zap,
  GitBranch,
  Settings,
  Code2,
  Github,
} from "lucide-react";

export default function Welcome() {
  const [activeTab, setActiveTab] = useState("welcome");

  const sidebarItems = [
    { id: "welcome", label: "Welcome", icon: FileText },
    { id: "getstarted", label: "Get Started", icon: Zap },
    { id: "recent", label: "Recent", icon: Code2 },
    // { id: "extensions", label: "Extensions", icon: Settings },
  ];

  const gettingStartedGuides = [
    {
      title: "Create Your First Project",
      description: "Set up a new project and start coding in minutes",
      icon: Code2,
    },
    // {
    //   title: "Learn the Basics",
    //   description: "Explore core features and keyboard shortcuts",
    //   icon: BookOpen,
    // },
    {
      title: "Connect to Git",
      description: "Set up version control and collaborate with your team",
      icon: GitBranch,
    },
    {
      title: "Customize Your Workspace",
      description: "Personalize themes, extensions, and settings",
      icon: Settings,
    },
  ];

  const recentProjects = [
    { name: "React Dashboard", language: "TypeScript", date: "2 days ago" },
    { name: "API Server", language: "Node.js", date: "1 week ago" },
    { name: "Mobile App", language: "React Native", date: "2 weeks ago" },
  ];

  return (
    <div className="h-[calc(100vh-104px)] text-p6 flex">
      {/* Sidebar */}
      <aside className="w-64 from-primary-sidebar to-primary-sidebar/40 h-full flex flex-col z-10 bg-radial">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-CuHSzbGLiLhcT81jYHuEcErTHV3t3w.png"
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
                    : "text-p6/50 hover:bg-p6/80 hover:text-p5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 space-y-2">
          <Button
            className="w-full justify-start gap-2 bg-transparent hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer"
            size="sm"
          >
            <Github className="w-4 h-4" />
            GitHub
          </Button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 scrollbar overflow-scroll w-full">
        {/* Content Area */}
        <div className="p-8">
          {/* Welcome Tab */}
          {activeTab === "welcome" && (
            <div className="w-full space-y-12 z-10">
              {/* Hero Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 relative flex-shrink-0">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-CuHSzbGLiLhcT81jYHuEcErTHV3t3w.png"
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

              {/* Quick Actions */}
              <div className="space-y-4 w-full">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="flex flex-row flex-wrap gap-4 w-full">
                  <button className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">New Project</span>
                    </div>
                    <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                      Create a new project from scratch
                    </p>
                  </button>
                  <button className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Open Folder</span>
                    </div>
                    <p className="text-neutral-400 group-hover:text-p5 mt-1 text-left">
                      Open an existing project
                    </p>
                  </button>
                  <button className="group p-6 rounded-lg w-md hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50">
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

              {/* Features */}
              <div className="space-y-4 z-10">
                <h3 className="text-lg font-semibold">Key Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      icon: Code2,
                      title: "Intelligent Code",
                      desc: "AI-powered autocomplete",
                    },
                    {
                      icon: Zap,
                      title: "Lightning Fast",
                      desc: "Optimized performance",
                    },
                    {
                      icon: GitBranch,
                      title: "Git Integration",
                      desc: "Built-in version control",
                    },
                    {
                      icon: Settings,
                      title: "Customizable",
                      desc: "Personalize your workspace",
                    },
                  ].map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-lg hover:border-primary transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-p6 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{feature.title}</p>
                            <p className="text-sm text-neutral-300">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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
                    <div
                      key={idx}
                      className="group p-6 rounded-lg w-lg hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 bg-primary-sidebar/70 border border-p6/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Icon className="w-6 h-6 mt-1 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {guide.title}
                            </h3>
                            <p className="text-neutral-400 group-hover:text-p5 mt-1">
                              {guide.description}
                            </p>
                          </div>
                        </div>
                        {/* <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" /> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Tab */}
          {/* TODO - Add path and symbol */}
          {activeTab === "recent" && (
            <div className="max-w-4xl space-y-6">
              {recentProjects.length > 0 ? (
                <div className="grid gap-3">
                  {recentProjects.map((project, idx) => (
                    <div
                      key={idx}
                      className="group p-6 rounded-lg w-lg hover:bg-p6/80 hover:text-p5 transition-all cursor-pointer z-10 border border-p6/50 bg-primary-sidebar/70"
                    >
                      <div className="flex items-center gap-4">
                        <Code2 className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-lg">
                            {project.name}
                          </p>
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
        </div>
      </main>
    </div>
  );
}
