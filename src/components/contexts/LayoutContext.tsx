import { createContext, useContext, useState } from "react";

interface LayoutContextType {
  leftOpen: boolean;
  setLeftOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightOpen: boolean;
  setRightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  downOpen: boolean;
  setDownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leftContent: "files" | "search" | "git" | "db";
  setLeftContent: React.Dispatch<
    React.SetStateAction<"files" | "search" | "git" | "db">
  >;
  rightContent: "assist" | "chat";
  setRightContent: React.Dispatch<React.SetStateAction<"assist" | "chat">>;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [downOpen, setDownOpen] = useState(false);
  const [leftContent, setLeftContent] = useState<
    "files" | "search" | "git" | "db"
  >("files");
  const [rightContent, setRightContent] = useState<"assist" | "chat">("chat");

  return (
    <LayoutContext.Provider
      value={{
        leftOpen,
        setLeftOpen,
        rightOpen,
        setRightOpen,
        downOpen,
        setDownOpen,
        leftContent,
        setLeftContent,
        rightContent,
        setRightContent,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error(
      "useLayoutContext must be used within a LayoutContextProvider"
    );
  }
  return context;
};
