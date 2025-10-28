import { useEffect, useState, useRef } from "react";
import { Input } from "./ui/input";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Video,
  Users as GroupIcon,
  UsersRound,
  UserCheck as FriendIcon,
  MessageSquareMore as Chats,
  CircleCheck,
  CircleX,
  Phone,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { getRelativeTime } from "../utils/msfunc";
import { ScrollArea } from "./ui/scroll-area";
import {
  useClerk,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
} from "@clerk/clerk-react";
import { useUser } from "./contexts/UserContext";
import { useMessage } from "./contexts/MessageContext";
import ChatWindow from "./ChatWindow";
import { getCurrentWebview } from "@tauri-apps/api/webview";
type ChatMode = "private" | "group" | "friends";
const Messaging = () => {
  const { userData, fetchUser, socket } = useUser();
  const {
    targetUser,
    setTargetUser,
    room,
    setRoom,
    messages,
    setMessages,
    pendingMessages,
    setPendingMessages,
    setInCall,
    pcRef,
    toggleLocalVideo,
    createPeerConnection,
    ensureLocalStream,
  } = useMessage();
  const { getToken } = useAuth();
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("private");
  const [friendTab, setFriendTab] = useState<"friends" | "pending" | "add">(
    "friends"
  );
  const [addingFriend, setAddingFriend] = useState(false);
  const [showReceived, setShowReceived] = useState(true);
  const [showSent, setShowSent] = useState(true);
  const [friendQuery, setFriendQuery] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [inChat, setInChat] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);
  const [CreateGroup, setCreateGroup] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const webview = getCurrentWebview();
  const { signOut, openSignIn } = useClerk();
  const handleSwitch = async () => {
    await signOut();
    await webview.clearAllBrowsingData();
    openSignIn();
  }; //TODO: fix switch
  useEffect(() => {
    fetchUser().catch((err) => console.error("Failed to sync user:", err));
  }, [chatMode]);
  const backendUrl = "https://eternalv2.onrender.com";
  const fetchMessages = async (before?: string) => {
    let url = "";
    if (targetUser) {
      url = before
        ? `${backendUrl}/api/pvtmessages/history?from=${userData?.username}&to=${targetUser}&before=${before}`
        : `${backendUrl}/api/pvtmessages?from=${userData?.username}&to=${targetUser}`;
    } else if (room) {
      url = before
        ? `${backendUrl}/api/roommessages/history?room=${room?.room}&roomId=${room?.roomId}&before=${before}`
        : `${backendUrl}/api/roommessages?room=${room?.room}&roomId=${room?.roomId}`;
    } else {
      return [];
    }
    const res = await fetch(url);
    const data = await res.json();
    return data.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  };
  useEffect(() => {
    const loadInitial = async () => {
      const initial = await fetchMessages();
      setMessages((prev) => {
        const all = [...prev, ...initial];
        const seen = new Set<string>();
        return all.filter((msg) => {
          if (seen.has(msg.id)) return false;
          seen.add(msg.id);
          return true;
        });
      });
    };
    loadInitial();
  }, [targetUser, room]);
  const fetchOlder = async () => {
    if (!hasMore) return;
    const oldest = new Date(messages[0].timestamp).toISOString();
    const older = await fetchMessages(oldest);
    console.log(older);
    if (!older.length) {
      setHasMore(false);
      return;
    }
    setMessages((prev) => [...new Set([...older, ...prev])]);
  };

  const sendMessage = () => {
    if (!userData) return;
    if (!input.trim()) return;
    if (targetUser) {
      const chatKey = `chat:${[userData.username, targetUser]
        .sort()
        .join(":")}`;
      const message = {
        id: crypto.randomUUID(),
        to: targetUser,
        text: input,
        from: userData.username,
        timestamp: new Date(),
        chatKey,
      };
      socket.emit("privateMessage", message);
      setMessages((prev) => [...prev, message]);
    } else if (room) {
      const chatKey = `${room.room}:${room.roomId}`;
      const message = {
        id: crypto.randomUUID(),
        room: room.room,
        text: input,
        from: userData.username,
        timestamp: new Date(),
        chatKey,
        roomId: room.roomId,
      };
      console.log("sending...");
      socket.emit("roomMessage", message);
      setMessages((prev) => [...prev, message]);
    } else {
      return;
    }
    setInput("");
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        }); // jump to bottom like Instagram
      }
    });
  };

  const handleAddFriend = async (searchUser: string) => {
    if (!userData?.username) return;
    if (searchUser === userData.username)
      return console.log("You can't add yourself!");
    if (userData.friends?.map((f) => f.username).includes(searchUser))
      return console.log("Already friends!");
    try {
      const token = await getToken();
      const res = await fetch(`${backendUrl}/api/friends/add`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: userData.username,
          to: searchUser,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      console.log(`Friend request sent to ${data.to}`);
    } catch (err) {
      console.log("Error sending friend request:", err);
    }
  };

  const handleFriendRequest = async (from: string, accept: boolean) => {
    if (!userData?.username) return;
    try {
      const token = await getToken();
      const res = await fetch(`${backendUrl}/api/friends/handle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from,
          to: userData.username,
          accept,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log("Error", err);
    }
  };
  const handleCreateGroup = async () => {
    if (!userData) return;
    if (!groupName.trim()) {
      console.log("Group name cannot be empty");
      return;
    }
    if (selectedFriends.length === 0) {
      console.log("Select at least one friend");
      return;
    }
    socket.emit("createRoom", {
      room: groupName,
      roomId: crypto.randomUUID(),
      participants: [userData.username, ...selectedFriends],
    });
    setCreateGroup(false);
    setSelectedFriends([]);
    setGroupName("");
    fetchUser();
  };
  const handleVideoCall = async (to: string, video: boolean) => {
    if (!userData) {
      console.log("User not found");
      return;
    }
    if (!to) {
      console.log("No user selected");
      return;
    }
    setInCall(true);
    pcRef.current = createPeerConnection(to);
    const stream = await ensureLocalStream();
    if (stream) {
      for (const track of stream.getTracks()) {
        pcRef.current.addTrack(track, stream);
      }
    }
    let offer;
    if (pcRef.current) {
      offer = await pcRef.current.createOffer();
    }
    if (offer) {
      await pcRef.current.setLocalDescription(offer);
    }
    socket.emit("offer", {
      to,
      from: userData.username,
      offer,
      callType: video,
    });
  };
  return (
    <div className="h-full w-full p-2 bg-p5">
      <div className="h-full flex flex-col text-p6 rounded-xl border border-neutral-500 overflow-hidden">
        {/* Messages */}
        <SignedIn>
          {!inChat && (
            <div className="flex w-full h-full divide-x divide-neutral-500">
              <div className="h-full w-12 flex flex-col gap-6 pt-4 items-center">
                <div
                  className="cursor-pointer"
                  onClick={() => setChatMode("private")}
                >
                  <Chats className="size-6" />
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() => setChatMode("group")}
                >
                  <GroupIcon className="size-6" />
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() => setChatMode("friends")}
                >
                  <FriendIcon className="size-6" />
                </div>
                <div className="cursor-pointer">
                  <UserButton />
                </div>
              </div>
              <div className="h-full w-full flex flex-col">
                {chatMode === "private" ? (
                  <>
                    <h1 className="text-xl p-4 border-b border-neutral-500">
                      Direct Messages
                    </h1>
                    {userData?.friends?.map((friend) => (
                      <div
                        key={friend.username}
                        className="p-4 flex items-center gap-4 cursor-pointer border-b border-neutral-700 hover:bg-neutral-500"
                        onClick={() => {
                          setInChat(true);
                          setTargetUser(friend.username);
                          if (
                            pendingMessages.filter(
                              (message) =>
                                message.chatKey ===
                                `chat:${[userData.username, friend]
                                  .sort()
                                  .join(":")}`
                            ).length === 0
                          )
                            return;
                          socket.emit("removePending", {
                            username: userData.username,
                            chatKey: `chat:${[userData.username, friend]
                              .sort()
                              .join(":")}`,
                          });
                          setPendingMessages(
                            pendingMessages.filter(
                              (message) =>
                                message.chatKey !==
                                `chat:${[userData.username, friend]
                                  .sort()
                                  .join(":")}`
                            )
                          );
                        }}
                      >
                        <img
                          src={friend.avatar}
                          alt=""
                          className="size-8 rounded-full"
                        />
                        <div className="flex flex-col justify-between">
                          <div className="">{friend.username}</div>
                          {pendingMessages.filter(
                            (message) =>
                              message.chatKey ===
                              `chat:${[userData.username, friend]
                                .sort()
                                .join(":")}`
                          ).length > 0 && (
                            <div className="text-p6 font-semibold">
                              {pendingMessages.filter(
                                (message) =>
                                  message.chatKey ===
                                  `chat:${[userData.username, friend]
                                    .sort()
                                    .join(":")}`
                              ).length > 9
                                ? "9+ "
                                : pendingMessages.filter(
                                    (message) =>
                                      message.chatKey ===
                                      `chat:${[userData.username, friend]
                                        .sort()
                                        .join(":")}`
                                  ).length}{" "}
                              new message(s)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : chatMode === "group" ? (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-neutral-500">
                      <h1 className="text-xl font-semibold text-neutral-300">
                        Groups
                      </h1>
                      <button
                        className="text-center text-sm rounded-lg py-1 px-2 text-p5 font-semibold bg-p6 cursor-pointer"
                        onClick={() => setCreateGroup(true)}
                      >
                        New Group
                      </button>
                    </div>
                    {CreateGroup && (
                      <Dialog open={CreateGroup} onOpenChange={setCreateGroup}>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-center">
                              Create Group
                            </DialogTitle>
                          </DialogHeader>
                          {/* Group Name Input */}
                          <input
                            type="text"
                            placeholder="Group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="border rounded-lg p-2 w-full"
                          />
                          <div className="text-neutral-700 font-semibold">
                            Add Your Friends
                          </div>
                          {/* Friend List with Multi Select */}
                          <ScrollArea className="h-48 rounded border-2 p-2">
                            <div className="flex flex-col gap-2">
                              {userData?.friends?.map((friend: Friend) => (
                                <label
                                  key={friend.username}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedFriends.includes(
                                      friend.username
                                    )}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedFriends((prev) => [
                                          ...prev,
                                          friend.username,
                                        ]);
                                      } else {
                                        setSelectedFriends((prev) =>
                                          prev.filter(
                                            (f) => f !== friend.username
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  {friend.username}
                                </label>
                              ))}
                            </div>
                          </ScrollArea>
                          {/* Actions */}
                          <DialogFooter className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setCreateGroup(false);
                                setSelectedFriends([]);
                                setGroupName("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                handleCreateGroup();
                              }}
                            >
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {(userData?.groups?.length === 0 ||
                      userData?.groups === undefined) && (
                      <div className="text-center">
                        You have no groups currently
                      </div>
                    )}
                    {userData?.groups?.map((group) => (
                      <div
                        key={group.roomId}
                        className="p-4 cursor-pointer flex gap-4 items-center border-b border-neutral-700 hover:bg-neutral-500"
                        onClick={() => {
                          setInChat(true);
                          setRoom(group);
                          if (
                            pendingMessages.filter(
                              (message) =>
                                message.chatKey ===
                                `${group.room}:${group.roomId}`
                            ).length === 0
                          )
                            return;
                          socket.emit("removePending", {
                            username: userData.username,
                            chatKey: `${group.room}:${group.roomId}`,
                          });
                          setPendingMessages(
                            pendingMessages.filter(
                              (message) =>
                                message.chatKey !==
                                `${group.room}:${group.roomId}`
                            )
                          );
                        }}
                      >
                        <UsersRound className="size-10 rounded-full bg-neutral-500 p-2" />
                        <div className="flex flex-col justify-between">
                          <div className="text-lg">{group.room}</div>
                          {pendingMessages.filter(
                            (msg) =>
                              msg.chatKey === `${group.room}:${group.roomId}`
                          ).length > 0 && (
                            <div className="text-p6 text-sm font-semibold">
                              {pendingMessages.filter(
                                (msg) =>
                                  msg.chatKey ===
                                  `${group.room}:${group.roomId}`
                              ).length > 9
                                ? "9+ "
                                : pendingMessages.filter(
                                    (msg) =>
                                      msg.chatKey ===
                                      `${group.room}:${group.roomId}`
                                  ).length}{" "}
                              new message(s)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Tabs
                    value={friendTab}
                    onValueChange={(e) => {
                      setFriendTab(e as "friends" | "pending" | "add");
                    }}
                  >
                    <TabsList className="bg-transparent w-[calc(100%-16px)] grid grid-cols-3 my-4 mx-2">
                      <TabsTrigger
                        value="friends"
                        className="text-neutral-500 data-[state=active]:text-p5"
                      >
                        Friends
                      </TabsTrigger>
                      <TabsTrigger
                        value="pending"
                        className="text-neutral-500 data-[state=active]:text-p5"
                      >
                        Pending
                      </TabsTrigger>
                      <TabsTrigger
                        value="add"
                        className="text-neutral-500 data-[state=active]:text-p5"
                      >
                        Add
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="friends">
                      <Input
                        id="search friends"
                        type="text"
                        value={friendQuery}
                        placeholder="Search for a friend"
                        className="mx-2 w-[calc(100%-16px)] mb-4"
                        onChange={(e) => setFriendQuery(e.target.value)}
                      />
                      {userData?.friends
                        ?.filter((friend) =>
                          friend?.username
                            .toLowerCase()
                            .includes(friendQuery.toLowerCase())
                        )
                        .map((friend) => (
                          <div
                            key={friend.username}
                            className="text-center p-2 cursor-pointer flex items-center gap-4"
                            onClick={() => {
                              setChatMode("private");
                              setInChat(true);
                              setTargetUser(friend.username);
                            }}
                          >
                            <img
                              src={friend.avatar}
                              alt={friend.username}
                              className="size-10 rounded-full"
                            />
                            <div>{friend.username}</div>
                          </div>
                        ))}
                    </TabsContent>
                    <TabsContent
                      value="pending"
                      className="flex flex-col gap-4"
                    >
                      {/* Received Section */}
                      <div>
                        <button
                          className="w-full flex items-center justify-between px-4 py-2 bg-neutral-800 text-p6"
                          onClick={() => setShowReceived(!showReceived)}
                        >
                          <span>Received</span>
                          {showReceived ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                        {showReceived && (
                          <div className="flex flex-col divide-y divide-neutral-700">
                            {userData?.friendrequests?.filter(
                              (req) => req.to === userData.username
                            ).length === 0 ? (
                              <div className="text-center py-2 text-gray-400">
                                No received requests
                              </div>
                            ) : (
                              userData?.friendrequests
                                ?.filter((req) => req.to === userData.username)
                                .map((req) => (
                                  <div
                                    key={req.from}
                                    className="flex items-center justify-between px-4 py-2"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {req.from}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {getRelativeTime(new Date(req.date))}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <CircleCheck
                                        className="text-green-500 cursor-pointer"
                                        onClick={() => {
                                          handleFriendRequest(req.from, true);
                                          fetchUser();
                                        }}
                                      />
                                      <CircleX
                                        className="text-red-500 cursor-pointer"
                                        onClick={() => {
                                          handleFriendRequest(req.from, false);
                                          fetchUser();
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                      {/* Sent Section */}
                      <div className="rounded-lg">
                        <button
                          className="w-full flex items-center justify-between px-4 py-2 bg-neutral-800 text-p6"
                          onClick={() => setShowSent(!showSent)}
                        >
                          <span>Sent</span>
                          {showSent ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                        {showSent && (
                          <div className="flex flex-col divide-y divide-neutral-700">
                            {userData?.friendrequests?.filter(
                              (req) => req.from === userData.username
                            ).length === 0 ? (
                              <div className="text-center py-2 text-gray-400">
                                No sent requests
                              </div>
                            ) : (
                              userData?.friendrequests
                                ?.filter(
                                  (req) => req.from === userData.username
                                )
                                .map((req) => (
                                  <div
                                    key={req.to}
                                    className="flex items-center justify-between px-4 py-2"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {req.to}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {getRelativeTime(new Date(req.date))}
                                      </div>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="add" className="flex flex-col gap-4">
                      <Input
                        id="search"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        placeholder="Search for a user"
                        className="mx-2 w-[calc(100%-16px)]"
                      />
                      <button
                        disabled={!searchUser.trim() || addingFriend}
                        onClick={async () => {
                          if (!searchUser.trim()) return;
                          try {
                            setAddingFriend(true);
                            await handleAddFriend(searchUser);
                          } finally {
                            setAddingFriend(false);
                          }
                        }}
                        className="p-2 mx-2 rounded self-center w-[60%] transition-colors bg-p6 text-p5 hover:bg-gray-300 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                      >
                        {addingFriend ? "Adding..." : "Add Friend"}
                      </button>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          )}
          {inChat && (
            <div className="h-full">
              <div className="flex h-1/12 justify-between gap-2 border-b border-neutral-500 p-4">
                <div className="flex items-center gap-2">
                  <ChevronLeft
                    className="translate-y-0.5 cursor-pointer"
                    onClick={() => {
                      setInChat(false);
                      setTargetUser("");
                      setRoom(null);
                    }}
                  />
                  <div className="text-lg">{targetUser || room?.room}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone
                    onClick={async () => {
                      await handleVideoCall(targetUser, false);
                      toggleLocalVideo(false);
                    }}
                    className="cursor-pointer size-7 p-1 text-p6"
                  />
                  <Video
                    onClick={() => handleVideoCall(targetUser, true)}
                    className="cursor-pointer size-8 p-1 text-p6"
                  />
                </div>
              </div>
              <ChatWindow
                messages={messages}
                userData={userData}
                room={room}
                targetUser={targetUser}
                fetchOlder={fetchOlder}
              />
              {/* Input Area */}
              <div className="p-3 h-1/12 border-t border-gray-800 flex gap-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-neutral-800 placeholder:text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-p6 hover:bg-neutral-400 cursor-pointer text-sm"
                >
                  <Send className="size-5 text-p5" />
                </Button>
              </div>
            </div>
          )}
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col h-full gap-4 justify-center items-center">
            <div className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500">
              <SignInButton mode="modal" />
            </div>
            <button
              className="bg-p6 text-p5 p-2 rounded-lg hover:bg-gray-200"
              onClick={handleSwitch}
            >
              Switch GitHub Account
            </button>
            <p className="text-sm text-gray-400">
              Sign in to chat with other users
            </p>
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export default Messaging;
