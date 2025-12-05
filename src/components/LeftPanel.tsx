import { useLayout } from "./contexts/LayoutContext";
import FileSystem from "./FileSystem";
import Git from "./Git";
import SearchPanel from "./Search";
// import Music from "./Music";
const LeftPanel = () => {
  const { leftContent } = useLayout();
  switch (leftContent) {
    case "files":
      return <FileSystem />;
    case "search":
      return <SearchPanel />;
    case "git":
      return <Git />;
    case "db":
      return <div className="">Database</div>;
    // case "music":
    //   return <Music />;
    default:
      return null;
  }
};

export default LeftPanel;
