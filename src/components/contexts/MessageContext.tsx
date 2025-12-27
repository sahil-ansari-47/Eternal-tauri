import { createContext, useContext, useRef } from "react";
import { useState } from "react";
import { useUser } from "./UserContext";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import { useAuth } from "@clerk/clerk-react";
interface MessageContextType {
  targetUser: string;
  setTargetUser: React.Dispatch<React.SetStateAction<string>>;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  room: Group | null;
  setRoom: React.Dispatch<React.SetStateAction<Group | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fetchUserMessages: () => Promise<void>;
  fetchChat: (chatKey: string, pageToFetch: number) => Promise<void>;
  pendingMessages: Message[];
  setPendingMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  pcRef: React.RefObject<RTCPeerConnection | null>;
  lsRef: React.RefObject<MediaStream | null>;
  inCall: boolean;
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
  callType: "video" | "audio";
  setCallType: React.Dispatch<React.SetStateAction<"video" | "audio">>;
  isVideoOn: boolean;
  setisVideoOn: React.Dispatch<React.SetStateAction<boolean>>;
  isRemoteVideoOn: boolean;
  setisRemoteVideoOn: React.Dispatch<React.SetStateAction<boolean>>;
  isAudioOn: boolean;
  setisAudioOn: React.Dispatch<React.SetStateAction<boolean>>;
  isRemoteAudioOn: boolean;
  setisRemoteAudioOn: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLocalAudio: (enabled: boolean) => void;
  toggleLocalVideo: (enabled: boolean) => void;
  handleHangup: () => void;
  localVideoElRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoElRef: React.RefObject<HTMLVideoElement | null>;
  createPeerConnection: (target: string) => RTCPeerConnection;
  ensureLocalStream: (
    sender: boolean,
    video: boolean
  ) => Promise<MediaStream | null | "audio-only">;
  bufferedCandidatesRef: React.RefObject<RTCIceCandidateInit[]>;
  localStream: MediaStream | null;
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  remoteStream: MediaStream | null;
  setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
}
export const MessageContext = createContext<MessageContextType | undefined>(
  undefined
);
export const MessageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ICE_SERVERS = [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "959074b0232340a28cff3cce",
      credential: "W58ZNU1i810Mpwwk",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "959074b0232340a28cff3cce",
      credential: "W58ZNU1i810Mpwwk",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "959074b0232340a28cff3cce",
      credential: "W58ZNU1i810Mpwwk",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "959074b0232340a28cff3cce",
      credential: "W58ZNU1i810Mpwwk",
    },
  ];
  const [room, setRoom] = useState<Group | null>(null);
  const { socket, setinCallwith, userData } = useUser();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [targetUser, setTargetUser] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lsRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [isVideoOn, setisVideoOn] = useState(true);
  const [isRemoteVideoOn, setisRemoteVideoOn] = useState(true);
  const [isAudioOn, setisAudioOn] = useState(true);
  const [isRemoteAudioOn, setisRemoteAudioOn] = useState(true);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const bufferedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  function toggleLocalAudio(enabled: boolean) {
    console.log("toggling audio", enabled);
    setisAudioOn(enabled);
    if (!lsRef.current || lsRef.current?.getTracks().length === 0) return;
    lsRef.current
      .getAudioTracks()
      .forEach((track) => (track.enabled = enabled));
  }
  function toggleLocalVideo(enabled: boolean) {
    setisVideoOn(enabled);
    if (!lsRef.current || lsRef.current?.getTracks().length === 0) return;
    lsRef.current
      .getVideoTracks()
      .forEach((track) => (track.enabled = enabled));
  }
  function createPeerConnection(target: string) {
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.onicecandidate = (evt) => {
        if (!evt.candidate) {
          console.log("no candidate found");
          return;
        }
        socket.emit("ice-candidate", {
          to: target,
          candidate: evt.candidate,
        });
      };
      pc.ontrack = (evt) => {
        setRemoteStream(evt.streams[0]);
      };
      return pc;
    } catch (e) {
      console.error("Error creating PeerConnection:", e);
      throw e;
    }
  }
  async function ensureLocalStream(sender: boolean, video: boolean) {
    try {
      console.log(
        "Ensuring local stream with video:",
        video,
        "sender:",
        sender
      );

      // Check if we already have a stream with the required tracks
      if (lsRef.current) {
        const hasVideo = lsRef.current.getVideoTracks().length > 0;
        const hasAudio = lsRef.current.getAudioTracks().length > 0;

        // If we need video but don't have it, or vice versa, get a new stream
        if ((video && !hasVideo) || (!video && hasVideo)) {
          console.log(
            "Existing stream doesn't match requirements, stopping and getting new one"
          );
          for (const track of lsRef.current.getTracks()) {
            track.stop();
          }
          lsRef.current = null;
        } else if (hasVideo && hasAudio) {
          console.log("Reusing existing stream");
          return lsRef.current;
        }
      }

      console.log("Requesting new media stream...");
      const constraints = {
        video: video ? { facingMode: "user" } : false,
        audio: true,
      };
      console.log("Media constraints:", constraints);

      const ls = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Media stream obtained:", {
        videoTracks: ls.getVideoTracks().length,
        audioTracks: ls.getAudioTracks().length,
        videoTrackEnabled: ls.getVideoTracks()[0]?.enabled,
        audioTrackEnabled: ls.getAudioTracks()[0]?.enabled,
      });

      lsRef.current = ls;
      return lsRef.current;
    } catch (e: any) {
      console.error("Error getting user media:", e);
      console.error("Error name:", e.name);
      console.error("Error message:", e.message);

      if (sender) {
        const confirmed = await confirm(
          `Cannot access media devices: ${
            e.message || e.name
          }. Continue with voice call?`,
          { title: "Access denied" }
        );
        if (confirmed) {
          try {
            const ls = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            lsRef.current = ls;
            return lsRef.current;
          } catch (audioError) {
            console.error("Failed to get audio-only stream:", audioError);
            return null;
          }
        }
        return null;
      } else {
        await message(`Cannot access media devices: ${e.message || e.name}`, {
          title: "Access denied",
          kind: "error",
        });
        try {
          const ls = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          lsRef.current = ls;
          return lsRef.current;
        } catch (audioError) {
          console.error("Failed to get audio-only stream:", audioError);
          return null;
        }
      }
    }
  }
  const handleHangup = () => {
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
    socket.emit("hangup", { to: targetUser });
  };
  const fetchUserMessages = async () => {
    const token = await getToken();
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/usermessages?username=${
        userData?.username
      }`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    const msgs = data.messages.map((msg: Message) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
    setMessages((prev) => {
      const combined = [...prev, ...msgs];
      const uniqueMessages = Array.from(
        new Map(combined.map((msg) => [msg.id, msg])).values()
      );
      return uniqueMessages;
    });
  };
  const fetchChat = async (chatKey: string, pageToFetch = 1) => {
    if (!hasMore && pageToFetch !== 1) return;

    const token = await getToken();
    const res = await fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/api/messages/${chatKey}?page=${pageToFetch}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    const msgs: Message[] = data.messages.map((msg: Message) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    setHasMore(data.hasMore);
    setPage(pageToFetch);

    setMessages((prev) => {
      // 👇 prepend older messages, dedupe by id
      const combined = pageToFetch === 1 ? msgs : [...msgs, ...prev];

      return Array.from(new Map(combined.map((m) => [m.id, m])).values());
    });
  };
  return (
    <MessageContext.Provider
      value={{
        targetUser,
        setTargetUser,
        participants,
        setParticipants,
        room,
        setRoom,
        messages,
        setMessages,
        fetchUserMessages,
        fetchChat,
        hasMore,
        page,
        setPage,
        setHasMore,
        pendingMessages,
        setPendingMessages,
        pcRef,
        localVideoElRef,
        remoteVideoElRef,
        lsRef,
        inCall,
        setInCall,
        callType,
        setCallType,
        isVideoOn,
        setisVideoOn,
        isRemoteVideoOn,
        setisRemoteVideoOn,
        isAudioOn,
        setisAudioOn,
        isRemoteAudioOn,
        setisRemoteAudioOn,
        toggleLocalAudio,
        toggleLocalVideo,
        handleHangup,
        localStream,
        setLocalStream,
        remoteStream,
        setRemoteStream,
        createPeerConnection,
        ensureLocalStream,
        bufferedCandidatesRef,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useUser must be used within EditorProvider");
  return ctx;
};
