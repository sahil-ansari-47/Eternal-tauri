import { createContext, useContext, useRef } from "react";
import { useState } from "react";
import { useUser } from "./UserContext";
interface MessageContextType {
  targetUser: string;
  setTargetUser: React.Dispatch<React.SetStateAction<string>>;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  room: Group | null;
  setRoom: React.Dispatch<React.SetStateAction<Group | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  pendingMessages: Message[];
  setPendingMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  pcRef: React.RefObject<RTCPeerConnection | null>;
  lsRef: React.RefObject<MediaStream | null>;
  localVideo: React.RefObject<HTMLVideoElement | null>;
  remoteVideo: React.RefObject<HTMLVideoElement | null>;
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
  createPeerConnection: (target: string) => RTCPeerConnection;
  ensureLocalStream: () => Promise<MediaStream | null>;
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
  const { socket, setinCallwith } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [targetUser, setTargetUser] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lsRef = useRef<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [isVideoOn, setisVideoOn] = useState(true);
  const [isAudioOn, setisAudioOn] = useState(true);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
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
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        console.log("target user:", target);
        socket.emit("ice-candidate", {
          to: target,
          candidate: evt.candidate,
        });
      } else {
        console.log("done gathering candidates");
      }
    };
    pc.ontrack = (evt) => {
      if (remoteVideo.current && !remoteVideo.current.srcObject) {
        console.log("Remote stream tracks:", evt.streams[0].getTracks());
        remoteVideo.current.srcObject = evt.streams[0];
        console.log("Remote video src:", remoteVideo.current.srcObject);
      }
    };
    return pc;
  }
  async function ensureLocalStream() {
    if (!lsRef.current) {
      const ls = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      lsRef.current = ls;
    }
    return lsRef.current;
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
      if (localVideo.current) localVideo.current.srcObject = null;
    }
    socket.emit("hangup", { to: targetUser });
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
        pendingMessages,
        setPendingMessages,
        pcRef,
        localVideo,
        remoteVideo,
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
        createPeerConnection,
        ensureLocalStream,
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
