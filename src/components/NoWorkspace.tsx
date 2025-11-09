import { FolderOpen, GitBranch } from "lucide-react";
import { useEditor } from "./contexts/EditorContext";
const NoWorkspace = () => {
  const { error, handleOpenFolder, setCloneDialogOpen, getUserRepos } =
    useEditor();
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
            getUserRepos();
            setCloneDialogOpen(true);
          }}
        >
          <GitBranch className="w-4 h-4 mr-2" /> Clone Repository
        </button>
        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default NoWorkspace;
