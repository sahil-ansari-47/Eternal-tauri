import clsx from "clsx";
import { useEditor } from "./contexts/EditorContext";
import {
  Files,
  SourceControl,
  Search,
  Messages,
  Trello,
} from "./svgs/SvgIndex";

const Sidebar = ({
  current,
  currentRight,
  onSelect,
  onSelectRight,
}: {
  current: "files" | "search" | "git" | "db" | "music" | null;
  currentRight: "chat" | "assist" | null;
  onSelect: (
    content: "files" | "search" | "git" | "db" | "music" | null
  ) => void;
  onSelectRight: (content: "chat" | "assist" | null) => void;
}) => {
  const { setActiveTab } = useEditor();
  return (
    <ul className="flex flex-col items-center gap-3.5 justify-start w-12 h-[calc(100vh-52px)] bg-p5 z-10">
      <li
        className={clsx(
          "px-2 py-2 cursor-pointer",
          current === "files" && "bg-gray-200"
        )}
        onClick={() => onSelect("files")}
      >
        <Files active={current === "files"} />
      </li>
      <li
        className={clsx(
          " px-2 py-2 cursor-pointer",
          current === "search" && "bg-gray-200"
        )}
        onClick={() => onSelect("search")}
      >
        <Search active={current === "search"} />
      </li>
      <li
        className={clsx(
          " px-2 py-2 cursor-pointer",
          current === "git" && "bg-gray-200"
        )}
        onClick={() => onSelect("git")}
      >
        <SourceControl active={current === "git"} />
      </li>
      {/* <li
        className={clsx(
          " px-2 py-2 cursor-pointer",
          current === "db" && "bg-gray-200"
        )}
        onClick={() => onSelect("db")}
      >
        <Database active={current === "db"} />
      </li> */}
      <li
        className={clsx(
          " px-2 py-2 cursor-pointer",
          currentRight === "chat" && "bg-gray-200"
        )}
        onClick={() => onSelectRight("chat")}
      >
        <Messages active={currentRight === "chat"} />
      </li>
      <li
        className={clsx(
          " px-2 py-2 cursor-pointer"
          // current === "files" && "bg-gray-200"
        )}
        onClick={() => setActiveTab("Trello")}
      >
        <Trello />
      </li>
      {/* <li
        className=" px-2 py-4"
        onClick={() => onSelect("music")}
      > 
        <img
          width="64"
          alt="Spotify icon"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/64px-Spotify_icon.svg.png?20220821125323"
        />
      </li> */}
    </ul>
  );
};

export default Sidebar;
