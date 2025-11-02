import { createContext, useContext, useState } from "react";

interface GitContextType {
    status: GitStatus;
    setStatus: React.Dispatch<React.SetStateAction<GitStatus>>;
    
    graphData: GitGraphNode[];
    setGraphData: React.Dispatch<React.SetStateAction<GitGraphNode[]>>;

    collapsed: { [key: string]: boolean };
    setCollapsed: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;

    isInit: boolean;
    setIsInit: React.Dispatch<React.SetStateAction<boolean>>;
}

const GitContext = createContext<GitContextType | undefined>(undefined);

export const GitProvider = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<GitStatus>(
        {
            staged: [],
            unstaged: [],
            untracked: [],
            branch: "master",
            origin: "",
        }
    );
    const [graphData, setGraphData] = useState<GitGraphNode[]>([]);
    const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
        changes: false,
        graph: false,
    });
    const [isInit, setIsInit] = useState<boolean>(false);
    return (
        <GitContext.Provider value={{ status, setStatus, graphData, setGraphData, collapsed, setCollapsed, isInit, setIsInit }}>
            {children}
        </GitContext.Provider>
    );
}
export const useGit = () => {
    const ctx = useContext(GitContext);
    if (!ctx) throw new Error("useGit must be used within GitProvider");
    return ctx;
};