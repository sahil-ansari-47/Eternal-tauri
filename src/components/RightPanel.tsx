import { useLayout } from "./contexts/LayoutContext";
import Messaging from "./Messaging";
const RightPanel = () => {
  const { rightContent } = useLayout();
  switch (rightContent) {
    case "chat":
      return <Messaging />;
    case "assist":
      return <div className="">Assist</div>;
    default:
      return null;
  }
};

export default RightPanel;
