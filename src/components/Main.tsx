import { useEffect } from "react";
import Editor from "./Editor";
import Welcome from "./Welcome";
import Call from "./Call";
import AddTask from "./AddTask";
import { DottedGlowBackground } from "./ui/dotted-glow-background";
// import Spotify from "./Spotify"
import { useEditor } from "./contexts/EditorContext";
import { useMessage } from "./contexts/MessageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
const Main = () => {
  const { tabList, setTabList, openFiles, activeTab, setActiveTab } =
    useEditor();
  const { inCall } = useMessage();
  useEffect(() => {
    if (inCall) {
      setTabList((prev) => [...new Set([...prev, "Call"])]);
      setActiveTab("Call");
    } else {
      setTabList((prev) => prev.filter((tab) => tab !== "Call"));
      setActiveTab("Home");
    }
  }, [inCall]);
  useEffect(() => {
    if (openFiles.length > 0) {
      setTabList((prev) => [...new Set([...prev, "Editor"])]);
      setActiveTab("Editor");
    } else {
      setTabList((prev) => prev.filter((tab) => tab !== "Editor"));
      setActiveTab("Home");
    }
  }, [openFiles]);

  return (
    <div className="w-full h-full">
      {activeTab === "Home" && (
        <DottedGlowBackground
          className="pointer-events-none mask-radial-to-90% mask-radial-at-center z-0"
          opacity={1}
          gap={10}
          radius={1.6}
          colorLightVar="--color-neutral-500"
          glowColorLightVar="--color-neutral-600"
          colorDarkVar="--color-neutral-500"
          glowColorDarkVar="--color-sky-800"
          backgroundOpacity={0}
          speedMin={0.3}
          speedMax={1.6}
          speedScale={1}
        />
      )}
      <Tabs value={activeTab} className="bg-primary-sidebar w-full h-full">
        <div className="flex w-full items-center justify-center">
          <TabsList className="my-2 bg-transparent z-10">
            {tabList.map((tab) => (
              <TabsTrigger
                onClick={() => setActiveTab(tab)}
                key={tab}
                value={tab}
                className="text-neutral-500 data-[state=active]:text-p5"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="Home">
          <Welcome />
        </TabsContent>
        <TabsContent value="Editor">
          <Editor />
        </TabsContent>
        <TabsContent value="Call">
          <Call />
        </TabsContent>
        <TabsContent value="Trello">
          <AddTask />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Main;
