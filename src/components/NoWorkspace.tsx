import { FolderOpen, GitBranch } from "lucide-react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useEditor } from "./contexts/EditorContext";
const NoWorkspace = () => {
  const backendUrl = import.meta.env.BACKEND_URL;
  const { isSignedIn, getToken } = useAuth();
  const [repos, setRepos] = useState<GitRepo[] | null>(null);
  const { error, handleOpenFolder, dialogOpen, setDialogOpen, setAction, repoUrl, setRepoUrl, handleClone, errorMessage, setErrorMessage, cloneMethod, setCloneMethod } = useEditor();
  const getUserRepos = async () => {
    if (!isSignedIn) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${backendUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error: ${res.status} - ${text}`);
    }
    const data = await res.json();
    console.log(data);
    const res2 = await fetch(
      `https://api.github.com/users/${data.user.username}/repos`
    );
    const r = await res2.json();
    console.log(r);
    setRepos(r);
  };
  return (
    <div className="h-full bg-primary-sidebar text-neutral-300 p-2">
      <div className="h-full w-full flex flex-col items-center justify-center border border-neutral-600 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-p6">No folder opened</h3>
        <p className="text-sm text-neutral-400 text-center">
          Open a folder to browse files or clone a repository.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-p1 rounded text-white flex items-center cursor-pointer"
          onClick={handleOpenFolder}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Open Folder
        </button>
        <button
          className="mt-4 px-4 py-2 bg-green-600 rounded text-white flex items-center cursor-pointer"
          onClick={() => {
            setAction("clone");
            getUserRepos();
            setDialogOpen(true);
          }}
        >
          <GitBranch className="w-4 h-4 mr-2" /> Clone Repository
        </button>
        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="text-neutral-700 flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>Clone Repository</DialogTitle>
          </DialogHeader>

          <Tabs
            value={cloneMethod}
            onValueChange={(val) => setCloneMethod(val as "github" | "link")}
          >
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="github">GitHub</TabsTrigger>
              <TabsTrigger value="link">From URL</TabsTrigger>
            </TabsList>

            <TabsContent
              value="github"
              className="flex flex-col justify-between max-h-46 overflow-y-scroll"
            >
              {repos?.length ? (
                <RadioGroup
                  value={repoUrl}
                  onValueChange={(val) => {
                    setRepoUrl(val);
                    setErrorMessage(null);
                  }}
                  className="flex flex-col gap-2"
                >
                  {repos.map((repo) => (
                    <Label
                      key={repo.id}
                      htmlFor={`repo-${repo.id}`}
                      className={`flex items-center justify-between w-full p-3 rounded-md border cursor-pointer transition-colors ${
                        repoUrl === repo.clone_url
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      <span>{repo.name}</span>
                      <RadioGroupItem
                        value={repo.clone_url}
                        id={`repo-${repo.id}`}
                        className="hidden"
                      />
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-sm text-neutral-400">
                  No repositories found.
                </p>
              )}
            </TabsContent>

            <TabsContent value="link">
              <Input
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter repository URL"
                autoFocus
              />
              {errorMessage && (
                <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleClone(repoUrl)} disabled={!repoUrl}>
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoWorkspace;
