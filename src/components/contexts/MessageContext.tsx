import { createContext, useCallback, useContext, useRef, useEffect } from "react";
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
  remoteVideoElRef: React.RefObject<HTMLVideoElement | null>;
  inCall: boolean;
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
  callType: "video" | "audio";
  setCallType: React.Dispatch<React.SetStateAction<"video" | "audio">>;
  isVideoOn: boolean;
  setisVideoOn: React.Dispatch<React.SetStateAction<boolean>>;
  isAudioOn: boolean;
  setisAudioOn: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLocalAudio: (enabled: boolean) => void;
  toggleLocalVideo: (enabled: boolean) => void;
  handleHangup: () => void;
  localVideoRef: (node: HTMLVideoElement | null) => void;
  localVideoElRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: (node: HTMLVideoElement | null) => void;
  createPeerConnection: (target: string) => RTCPeerConnection;
  ensureLocalStream: (
    sender: boolean,
    video: boolean
  ) => Promise<MediaStream | null | "audio-only">;
  localStream: MediaStream | null;
  bufferedCandidatesRef: React.RefObject<RTCIceCandidateInit[]>;
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
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
      urls: ["stun:stun.l.google.com:19302"],
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
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [isVideoOn, setisVideoOn] = useState(true);
  const [isAudioOn, setisAudioOn] = useState(true);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    const prevNode = localVideoElRef.current;
    localVideoElRef.current = node;
    console.log("Local video ref callback:", node);
    console.log("Local stream in callback:", lsRef.current);
    
    // If element is being set and stream exists, attach immediately
    if (node && lsRef.current) {
      console.log("Attaching local stream in callback (immediate)");
      node.srcObject = lsRef.current;
    }
    
    // If element was just mounted (changed from null to node), try to attach
    if (node && !prevNode && lsRef.current) {
      console.log("Element just mounted, attaching stream");
      node.srcObject = lsRef.current;
    }
  }, []);

  // Effect to attach stream when both element and stream are ready
  // This handles the case where stream is set before element is mounted
  useEffect(() => {
    if (!inCall) return;
    
    const attachStream = () => {
      const videoEl = localVideoElRef.current;
      const stream = lsRef.current || localStream;
      
      if (videoEl && stream && videoEl.srcObject !== stream) {
        console.log("Attaching local stream via useEffect", {
          hasElement: !!videoEl,
          hasStream: !!stream,
          currentSrc: videoEl.srcObject !== null
        });
        videoEl.srcObject = stream;
        // Force play to ensure video displays
        videoEl.play().catch(err => console.warn("Video play error:", err));
        return true;
      }
      return false;
    };

    // Try immediately
    if (attachStream()) return;

    // If element not ready, retry with increasing delays (handles race condition)
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const delays = [50, 100, 200, 300, 500, 1000];
    
    delays.forEach((delay) => {
      const timeoutId = setTimeout(() => {
        if (attachStream()) {
          // Clear remaining timeouts if successful
          timeouts.forEach((id) => clearTimeout(id));
        }
      }, delay);
      timeouts.push(timeoutId);
    });

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [localStream, inCall]); // Watch localStream state and inCall to trigger when stream is set
  const remoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoElRef.current = node;
  }, []);
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
        console.log("received candidate");
        socket.emit("ice-candidate", {
          to: target,
          candidate: evt.candidate,
        });
        console.log("done gathering candidates");
      };
      pc.ontrack = (evt) => {
        if (remoteVideoElRef.current && !remoteVideoElRef.current.srcObject) {
          console.log("Remote stream tracks:", evt.streams[0].getTracks());
          remoteVideoElRef.current.srcObject = evt.streams[0];
          console.log("Remote video src:", remoteVideoElRef.current.srcObject);
        }
      };
      return pc;
    } catch (e) {
      console.error("Error creating PeerConnection:", e);
      throw e;
    }
  }
  async function ensureLocalStream(sender: boolean, video: boolean) {
    try {
      console.log("Ensuring local stream with video:", video, "sender:", sender);
      
      // Check if we already have a stream with the required tracks
      if (lsRef.current) {
        const hasVideo = lsRef.current.getVideoTracks().length > 0;
        const hasAudio = lsRef.current.getAudioTracks().length > 0;
        
        // If we need video but don't have it, or vice versa, get a new stream
        if ((video && !hasVideo) || (!video && hasVideo)) {
          console.log("Existing stream doesn't match requirements, stopping and getting new one");
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
          `Cannot access media devices: ${e.message || e.name}. Continue with voice call?`,
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
        localVideoRef,
        localVideoElRef,
        remoteVideoRef,
        remoteVideoElRef,
        lsRef,
        inCall,
        setInCall,
        callType,
        setCallType,
        isVideoOn,
        setisVideoOn,
        isAudioOn,
        setisAudioOn,
        toggleLocalAudio,
        toggleLocalVideo,
        handleHangup,
        localStream,
        setLocalStream,
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
