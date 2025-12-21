import { useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Button } from "./components/ui/button";
import { useEditor } from "./components/contexts/EditorContext";
import { useUser } from "./components/contexts/UserContext";
import { useMessage } from "./components/contexts/MessageContext";
import { socket } from "./lib/socket";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import {
  LeftPanel,
  Sidebar,
  RightPanel,
  BottomPanel,
  Main,
  MenuBar,
  StatusBar,
} from "./components/ComponentIndex";
import { useLayout } from "./components/contexts/LayoutContext";

const App = () => {
  const { isSignedIn } = useAuth();
  const {
    userData,
    fetchUser,
    incomingFrom,
    setIncomingFrom,
    pendingOffer,
    setPendingOffer,
    acceptDialog,
    setAcceptDialog,
  } = useUser();
  const {
    targetUser,
    setTargetUser,
    room,
    setMessages,
    setPendingMessages,
    pcRef,
    lsRef,
    setInCall,
    setToggleVideo,
    callType,
    setCallType,
    localVideo,
    remoteVideo,
    toggleVideo,
    toggleLocalVideo,
    createPeerConnection,
    ensureLocalStream,
  } = useMessage();
  const {
    cloneDialogOpen,
    setCloneDialogOpen,
    cloneMethod,
    setCloneMethod,
    repos,
    repoUrl,
    setRepoUrl,
    errorMessage,
    setErrorMessage,
    handleClone,
    setRecents,
  } = useEditor();
  const { leftOpen, rightOpen, downOpen, setDownOpen } = useLayout();
  const bufferedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  useEffect(() => {
    const recents = JSON.parse(localStorage.getItem("recents") || "[]");
    setRecents(recents);
    if (!isSignedIn || !userData?.username) {
      if (socket.connected) socket.disconnect();
      return;
    }
    if (!socket.connected) {
      socket.connect();
    }
    socket.once("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("register", userData.username);

      if (userData.groups) {
        for (const group of userData.groups) {
          socket.emit("joinRoom", group);
        }
      }
    });
    socket.on(
      "privateMessage",
      (msg: {
        id: string;
        from: string;
        text: string;
        to: string;
        timestamp: Date;
        chatKey: string;
      }) => {
        msg.timestamp = new Date(msg.timestamp);
        setMessages((prev) => [...prev, msg]);
        // window.chatAPI.logMessage(msg);
        const chatKey = `chat:${[userData?.username, targetUser]
          .sort()
          .join(":")}`;
        if (chatKey !== msg.chatKey) window.chatAPI.messageNotification(msg);
      }
    );
    socket.on("pendingMessage", (msg: Message) => {
      msg.timestamp = new Date(msg.timestamp);
      setPendingMessages((prev) => [...prev, msg]);
    });
    socket.on(
      "roomMessage",
      (msg: {
        id: string;
        from: string;
        text: string;
        chatKey: string;
        timestamp: Date;
        room: string;
      }) => {
        msg.timestamp = new Date(msg.timestamp);
        setMessages((prev) => [...prev, msg]);
        const chatKey = `${room?.room}:${room?.roomId}`;
        if (chatKey !== msg.chatKey) window.chatAPI.messageNotification(msg);
      }
    );
    socket.on("offer", async ({ from, offer, callType }) => {
      setIncomingFrom(from);
      setPendingOffer(offer);
      setAcceptDialog(true);
      setToggleVideo(callType);
      setCallType(callType ? "video" : "audio");
      if (document.hidden) {
        window.chatAPI.callNotification(from, callType);
      }
    });
    socket.on("answer", async ({ answer }) => {
      console.log("answer", answer);
      if (!pcRef.current) {
        console.log("No RTCPeerConnection for answer");
        return;
      }
      await pcRef.current.setRemoteDescription(answer);
      console.log("pc", pcRef.current.remoteDescription);
    });
    socket.on("ice-candidate", async ({ candidate }) => {
      if (!pcRef.current) {
        console.log("Buffering ICE candidate");
        bufferedCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(candidate);
        console.log("Added ICE candidate");
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });
    socket.on("call-rejected", () => {
      setInCall(false);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (lsRef.current) {
        for (const track of lsRef.current.getTracks()) track.stop();
        lsRef.current = null;
        if (localVideo.current) localVideo.current.srcObject = null;
      }
    });
    socket.on("hangup", () => {
      console.log("hangup hit");
      setInCall(false);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (lsRef.current) {
        for (const track of lsRef.current.getTracks()) track.stop();
        lsRef.current = null;
        if (localVideo.current) localVideo.current.srcObject = null;
      }
    });
    return () => {
      socket.off("privateMessage");
      socket.off("roomMessage");
      socket.off("offer");
      socket.off("answer");
      socket.off("call-rejected");
      socket.off("pendingMessage");
      socket.off("hangup");
      socket.off("connect");
      socket.off("ice-candidate");
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [isSignedIn, userData?.username, targetUser, room]);
  useEffect(() => {
    fetchUser().catch((err) => console.error("Failed to sync user:", err));
  }, [isSignedIn]);
  const handleAccept = async () => {
    if (!incomingFrom || !pendingOffer) return;
    const pc = createPeerConnection(incomingFrom);
    pcRef.current = pc;
    try {
      setAcceptDialog(false);
      setInCall(true);
      setTargetUser(incomingFrom);
      await pc.setRemoteDescription(pendingOffer);
      const stream = await ensureLocalStream();
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: incomingFrom, answer });
      for (const candidate of bufferedCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      bufferedCandidatesRef.current = [];
      toggleLocalVideo(toggleVideo);
      setIncomingFrom(null);
      setPendingOffer(null);
    } catch (error) {
      console.error("Error during call acceptance:", error);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setInCall(false);
      setTargetUser("");
    }
  };

  const handleReject = () => {
    setAcceptDialog(false);
    socket.emit("call-rejected", { from: incomingFrom });
    setIncomingFrom(null);
    setPendingOffer(null);
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setDownOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [downOpen]);

  useEffect(() => {
    if (!localVideo.current?.srcObject && !remoteVideo.current?.srcObject) {
      setCallType("audio");
    } else {
      setCallType("video");
    }
  }, [localVideo.current, remoteVideo.current]);

  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = lsRef.current;
  }, [callType]);

  return (
    <>
      <div className="divide-y divide-neutral-700">
        <MenuBar />
        <div className="w-screen overflow-hidden h-[calc(100vh-52px)]">
          <PanelGroup
            direction="horizontal"
            className="flex divide-x-[1px] divide-neutral-700"
          >
            <Sidebar />
            {leftOpen && (
              <>
                <Panel
                  defaultSize={20}
                  minSize={20}
                  order={1}
                  className="h-[calc(100vh-52px)] z-10"
                >
                  <LeftPanel />
                </Panel>
                <PanelResizeHandle />{" "}
              </>
            )}
            <Panel
              defaultSize={55}
              minSize={30}
              order={2}
              className="h-[calc(100vh-52px)]"
            >
              <PanelGroup
                direction="vertical"
                className="flex flex-col divide-y divide-neutral-700"
              >
                <Panel defaultSize={65} order={1}>
                  <Main />
                </Panel>
                {downOpen && (
                  <>
                    <PanelResizeHandle />
                    <Panel defaultSize={35} order={2} className="z-10">
                      <BottomPanel />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
            {rightOpen && (
              <>
                <PanelResizeHandle />
                <Panel
                  defaultSize={25}
                  minSize={15}
                  order={3}
                  className="h-[calc(100vh-52px)] z-10"
                >
                  <RightPanel />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
        <StatusBar />
      </div>
      <Dialog open={acceptDialog} onOpenChange={setAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incoming Call</DialogTitle>
            <DialogDescription>
              {incomingFrom
                ? `${incomingFrom} is calling you`
                : "Incoming call..."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleReject}>
              Reject
            </Button>
            <Button onClick={handleAccept}>Accept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent className="text-neutral-700 flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>Clone Repository</DialogTitle>
          </DialogHeader>

          <Tabs
            value={cloneMethod}
            onValueChange={(val) => setCloneMethod(val as "github" | "link")}
          >
            <TabsList className="w-full flex justify-center gap-8 mb-4">
              <TabsTrigger
                value="link"
                className="w-fit cursor-pointer rounded-2xl data-[state=active]:text-white transition-colors"
              >
                From URL
              </TabsTrigger>
              <TabsTrigger
                value="github"
                className="w-fit cursor-pointer rounded-2xl data-[state=active]:text-white transition-colors"
              >
                GitHub
              </TabsTrigger>
            </TabsList>
            {/* GITHUB TAB */}
            <TabsContent
              value="github"
              className="flex flex-col justify-between max-h-46 overflow-y-auto scrollbar"
            >
              {isSignedIn ? (
                repos && repos.length > 0 ? (
                  <RadioGroup
                    value={repoUrl}
                    onValueChange={(val) => {
                      setRepoUrl(val);
                      setErrorMessage(null);
                    }}
                    className="flex flex-col gap-2 items-center"
                  >
                    {repos.map((repo) => (
                      <Label
                        key={repo.id}
                        htmlFor={`repo-${repo.id}`}
                        className={`flex items-center w-[90%] p-3 rounded-md border cursor-pointer transition-colors text-p6/80 ${
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
                )
              ) : (
                <div className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="bg-p5 border-1 border-neutral-500 w-fit text-p6 p-2 rounded-lg hover:bg-neutral-700">
                    <SignInButton mode="modal" />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* LINK TAB */}
            <TabsContent value="link">
              <Input
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter repository URL"
                autoFocus
                className="text-p6"
              />
              {errorMessage && (
                <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="secondary"
              onClick={() => {
                setCloneDialogOpen(false);
                setRepoUrl("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer border-1 border-neutral-500"
              onClick={() => handleClone(repoUrl)}
              disabled={!repoUrl}
            >
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default App;
