import clsx from "clsx";
// import { useEditor } from "./contexts/EditorContext";
import {
  Files,
  SourceControl,
  Search,
  Messages,
  // Trello,
} from "./svgs/SvgIndex";
import { useLayout } from "./contexts/LayoutContext";
const Sidebar = () => {
  const {
    leftOpen,
    setLeftOpen,
    leftContent,
    setLeftContent,
    setRightContent,
    rightContent,
    rightOpen,
    setRightOpen,
  } = useLayout();
  return (
    <ul className="flex flex-col items-center gap-3.5 justify-start w-12 h-[calc(100vh-52px)] bg-p5 z-10">
      <li
        className={clsx(
          "px-2 py-2 cursor-pointer",
          leftOpen && leftContent === "files" && "bg-gray-200"
        )}
        onClick={() => {
          if (leftContent === "files" && leftOpen) {
            setLeftOpen(false);
          } else {
            setLeftContent("files");
            setLeftOpen(true);
          }
        }}
      >
        <Files active={leftContent === "files" && leftOpen} />
      </li>
      <li
        className={clsx(
          " px-2 py-2 cursor-pointer",
          leftOpen && leftContent === "search" && "bg-gray-200"
        )}
        onClick={() => {
          if (leftContent === "search" && leftOpen) {
            setLeftOpen(false);
          } else {
            setLeftContent("search");
            setLeftOpen(true);
          }
        }}
      >
        <Search active={leftContent === "search" && leftOpen} />
      </li>
      <li
        className={clsx(
          " px-2 py-2 cursor-pointer",
          leftContent === "git" && leftOpen && "bg-gray-200"
        )}
        onClick={() => {
          if (leftContent === "git" && leftOpen) {
            setLeftOpen(false);
          } else {
            setLeftContent("git");
            setLeftOpen(true);
          }
        }}
      >
        <SourceControl active={leftContent === "git" && leftOpen} />
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
          rightContent === "chat" && rightOpen && "bg-gray-200"
        )}
        onClick={() => {
          if (rightContent === "chat" && rightOpen) {
            setRightOpen(false);
          } else {
            setRightContent("chat");
            setRightOpen(true);
          }
        }}
      >
        <Messages active={rightContent === "chat" && rightOpen} />
      </li>
      {/* <li
        className={clsx(
          " px-2 py-2 cursor-pointer"
          // current === "files" && "bg-gray-200"
        )}
        onClick={() => setActiveTab("Trello")}
      >
        <Trello />
      </li> */}
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
