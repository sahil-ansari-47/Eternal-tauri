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
import { showNotification } from "./utils/msfunc";
import { message } from "@tauri-apps/plugin-dialog";
const App = () => {
  const { isSignedIn } = useAuth();
  const {
    userData,
    fetchUser,
    inCallwith,
    setinCallwith,
    pendingOffer,
    setPendingOffer,
    acceptDialog,
    setAcceptDialog,
  } = useUser();
  const {
    targetUser,
    room,
    setMessages,
    setPendingMessages,
    pcRef,
    lsRef,
    setInCall,
    setisVideoOn,
    callType,
    setCallType,
    isVideoOn,
    setisRemoteVideoOn,
    setisRemoteAudioOn,
    localVideoElRef,
    startLocalVideo,
    setLocalStream,
    createPeerConnection,
    ensureLocalStream,
    bufferedCandidatesRef,
    pendingMessages,
    fetchUserMessages,
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
    handleOpenFile,
    handleCreateNewFile,
    handleOpenFolder,
    setActiveTab,
    setWorkspace,
    setRoots,
    // createTab,
  } = useEditor();
  const {
    leftOpen,
    rightOpen,
    downOpen,
    setDownOpen,
    setLeftContent,
    setLeftOpen,
    handleNewWindow,
  } = useLayout();
  const remoteDescriptionSetRef = useRef(false);
  useEffect(() => {
    const recents = JSON.parse(localStorage.getItem("recents") || "[]");
    setRecents(recents);
    if (!isSignedIn || !userData?.username) {
      if (socket.connected) socket.disconnect();
      return;
    } else {
      fetchUserMessages();
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
        if (targetUser !== msg.from) {
          setPendingMessages((prev) => [...prev, msg]);
          localStorage.setItem(
            "pendingMessages",
            JSON.stringify([...pendingMessages, msg])
          );
          showNotification(`New message from ${msg.from}`, msg.text).catch(
            (err) => console.warn("Notification error:", err)
          );
        }
      }
    );
    socket.on("pendingMessage", (msg: Message) => {
      msg.timestamp = new Date(msg.timestamp);
      const existing =
        JSON.parse(localStorage.getItem("pendingMessages") || "[]") || [];
      existing.push(msg);
      setPendingMessages(existing);
      localStorage.setItem("pendingMessages", JSON.stringify(existing));
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
        showNotification(
          `New message in ${msg.room} from ${msg.from}`,
          msg.text
        ).catch((err) => console.warn("Notification error:", err));
      }
    );
    socket.on("offer", async ({ from, offer, callType }) => {
      remoteDescriptionSetRef.current = false;
      setinCallwith(from);
      setPendingOffer(offer);
      setAcceptDialog(true);
      setisVideoOn(callType);
      setCallType(callType ? "video" : "audio");
      setAcceptDialog(true);
      showNotification(
        `Incoming ${callType ? "video" : "audio"} call from ${from}`,
        "Click to respond"
      ).catch((err) => console.warn("Notification error:", err));
    });
    socket.on("answer", async ({ answer }) => {
      console.log("Received answer");
      if (!pcRef.current) {
        console.log("No RTCPeerConnection for answer");
        return;
      }
      await pcRef.current.setRemoteDescription(answer);
      remoteDescriptionSetRef.current = true;
      for (const c of bufferedCandidatesRef.current) {
        await pcRef.current.addIceCandidate(c);
      }
      bufferedCandidatesRef.current = [];
    });
    socket.on("ice-candidate", async ({ candidate }) => {
      if (!pcRef.current?.remoteDescription) {
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
        if (localVideoElRef.current) localVideoElRef.current.srcObject = null;
      }
    });
    socket.on("hangup", () => {
      console.log("hangup hit");
      setInCall(false);
      setinCallwith(null);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (lsRef.current) {
        for (const track of lsRef.current.getTracks()) track.stop();
        lsRef.current = null;
        if (localVideoElRef.current) localVideoElRef.current.srcObject = null;
      }
    });
    socket.on("toggle-video", ({ video }) => {
      console.log("video is :", video);
      setisRemoteVideoOn(video);
    });
    socket.on("toggle-audio", ({ audio }) => {
      console.log("audio is :", audio);
      setisRemoteAudioOn(audio);
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
      socket.off("toggle-video");
      socket.off("toggle-audio");
    };
  }, [isSignedIn, userData?.username, targetUser, room]);
  useEffect(() => {
    fetchUser().catch((err) => console.error("Failed to sync user:", err));
  }, [isSignedIn]);
  const handleAccept = async () => {
    if (!inCallwith || !pendingOffer) {
      return;
    }
    setAcceptDialog(false);
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }

    try {
      const pc = createPeerConnection(inCallwith);
      pcRef.current = pc;

      const wantsVideo = callType === "video";
      const streamResult = await ensureLocalStream(false, wantsVideo);

      if (!streamResult) {
        setInCall(false);
        setinCallwith(null);
        handleReject();
        return;
      }

      if (streamResult instanceof MediaStream) {
        for (const track of streamResult.getTracks()) {
          pc.addTrack(track, streamResult);
        }
      }

      if (!pendingOffer || !pendingOffer.type || !pendingOffer.sdp) {
        throw new Error("Invalid offer: missing type or sdp");
      }

      const offerToSet: RTCSessionDescriptionInit = {
        type: pendingOffer.type as RTCSdpType,
        sdp: pendingOffer.sdp,
      };

      await pc.setRemoteDescription(offerToSet);
      remoteDescriptionSetRef.current = true;

      if (streamResult instanceof MediaStream) {
        lsRef.current = streamResult;

        setLocalStream(streamResult);

        if (localVideoElRef.current) {
          localVideoElRef.current.srcObject = streamResult;
          localVideoElRef.current.play().catch(() => {});
        }

        if (streamResult.getVideoTracks().length === 0) {
          startLocalVideo(false);
        }
      }

      setInCall(true);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: inCallwith, answer });

      for (const candidate of bufferedCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      bufferedCandidatesRef.current = [];

      startLocalVideo(isVideoOn);
      setPendingOffer(null);
    } catch (error: any) {
      console.error("Error during call acceptance:", error);
      const isTauri =
        typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
      if (isTauri) {
        message("Error accepting call. Please try again.", {
          title: "Call Error",
          kind: "error",
        }).catch(() => {});
      } else {
        alert(
          `Error accepting call: ${error?.message || error}. Please try again.`
        );
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setInCall(false);
      setinCallwith(null);
    }
  };
  const handleReject = () => {
    bufferedCandidatesRef.current = [];
    setAcceptDialog(false);
    socket.emit("call-rejected", { from: inCallwith });
    setinCallwith(null);
    setPendingOffer(null);
  };

  let chordActive = false;
  let chordTimeout: number | null = null;
  const shortcuthandler = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    if (e.ctrlKey && key === "k") {
      e.preventDefault();
      chordActive = true;

      if (chordTimeout) clearTimeout(chordTimeout);
      chordTimeout = window.setTimeout(() => {
        chordActive = false;
      }, 2500); // chord expires after 2.5s

      return;
    }
    // if (e.ctrlKey && key === "~") {
    //   e.preventDefault();
    //   // 👉 New Terminal
    //   setDownOpen(true);
    //   createTab();
    //   console.log("New terminal created and panel opened");
    //   return;
    // }
    if (e.ctrlKey && key === "`") {
      e.preventDefault();
      // 👉 Toggle Terminal
      setDownOpen((prev) => !prev);
      return;
    }
    if (chordActive && e.ctrlKey && key === "o") {
      e.preventDefault();
      chordActive = false;
      // 👉 Open Folder
      handleOpenFolder();
      return;
    }
    if (chordActive && key === "f") {
      e.preventDefault();
      chordActive = false;
      // 👉 Open Folder
      localStorage.removeItem("workspacePath");
      setActiveTab("Home");
      setWorkspace(null);
      setRoots(null);
      setErrorMessage(null);
      return;
    }
    if (e.ctrlKey && !e.shiftKey && key === "o") {
      e.preventDefault();
      handleOpenFile();
      return;
    }

    if (e.ctrlKey && e.shiftKey && key === "e") {
      e.preventDefault();
      // 👉 Open File System
      setLeftContent("files");
      setLeftOpen(true);
      return;
    }

    if (e.ctrlKey && e.shiftKey && key === "f") {
      e.preventDefault();
      // 👉 Open Workspace Search
      setLeftContent("search");
      setLeftOpen(true);
      return;
    }
    if (e.ctrlKey && e.shiftKey && key === "g") {
      e.preventDefault();
      // 👉 Open Source Control
      setLeftContent("git");
      setLeftOpen(true);
      return;
    }

    if (e.ctrlKey && key === "n") {
      e.preventDefault();
      if (e.shiftKey) {
        handleNewWindow();
      } else {
        handleCreateNewFile();
      }

      return;
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", shortcuthandler);
    return () => window.removeEventListener("keydown", shortcuthandler);
  }, []);

  useEffect(() => {
    console.log("Loading pending messages from localStorage", pendingMessages);
    setPendingMessages(
      JSON.parse(localStorage.getItem("pendingMessages") || "[]")
    );
  }, []);
  return (
    <>
      <div className="divide-y divide-neutral-700">
        <MenuBar />
        <div className="w-screen overflow-hidden h-[calc(100vh-52px)]">
          <PanelGroup
            direction="horizontal"
            className="flex divide-x divide-neutral-700"
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
                <PanelResizeHandle className="w-0.5 hover:scale-x-400 bg-neutral-700 hover:bg-neutral-400" />
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
                    <PanelResizeHandle className="h-0.5 hover:scale-y-400 bg-neutral-700 hover:bg-neutral-400" />
                    <Panel defaultSize={35} order={2} className="z-10">
                      <BottomPanel />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
            {rightOpen && (
              <>
                <PanelResizeHandle className="w-0.5 hover:scale-x-400 bg-neutral-700 hover:bg-neutral-400" />
                <Panel
                  defaultSize={25}
                  minSize={20}
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
              {inCallwith ? `${inCallwith} is calling you` : "Incoming call..."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button onClick={handleReject}>Reject</Button>
            <Button variant="secondary" onClick={handleAccept}>
              Accept
            </Button>
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
                  <div className="bg-p5 border border-neutral-500 w-fit text-p6 p-2 rounded-lg hover:bg-neutral-700">
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
              onClick={() => {
                setCloneDialogOpen(false);
                setRepoUrl("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="cursor-pointer border border-neutral-500"
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
