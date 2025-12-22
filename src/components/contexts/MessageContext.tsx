import { createContext, useCallback, useContext, useRef } from "react";
import { useState } from "react";
import { useUser } from "./UserContext";
import { confirm, message } from "@tauri-apps/plugin-dialog";
interface MessageContextType {
  targetUser: string;
  setTargetUser: React.Dispatch<React.SetStateAction<string>>;
  room: Group | null;
  setRoom: React.Dispatch<React.SetStateAction<Group | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  pendingMessages: Message[];
  setPendingMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  pcRef: React.RefObject<RTCPeerConnection | null>;
  lsRef: React.RefObject<MediaStream | null>;
  remoteVideo: React.RefObject<HTMLVideoElement | null>;
  inCall: boolean;
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
  callType: "video" | "audio";
  setCallType: React.Dispatch<React.SetStateAction<"video" | "audio">>;
  toggleVideo: boolean;
  setToggleVideo: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAudio: boolean;
  setToggleAudio: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLocalVideo: (enabled: boolean) => void;
  localVideoRef: (node: HTMLVideoElement | null) => void;
  localVideoElRef: React.RefObject<HTMLVideoElement | null>;
  createPeerConnection: (target: string) => RTCPeerConnection;
  ensureLocalStream: (
    sender: boolean,
    video: boolean
  ) => Promise<MediaStream | null | "audio-only">;
  localStream: MediaStream | null;
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
  const { socket } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [targetUser, setTargetUser] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lsRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [toggleVideo, setToggleVideo] = useState(true);
  const [toggleAudio, setToggleAudio] = useState(true);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    localVideoElRef.current = node;
    console.log("Local video ref callback:", node);
    console.log("Local stream in callback:", lsRef.current);
    if (node && lsRef.current) {
      console.log("Attaching local stream (authoritative)");
      node.srcObject = lsRef.current;
    }
  }, []);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  function toggleLocalVideo(enabled: boolean) {
    setToggleVideo(enabled);
    if (!lsRef.current) return;
    lsRef.current
      .getVideoTracks()
      .forEach((track) => (track.enabled = enabled));
  }
  function createPeerConnection(target: string) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        // console.log("received candidate:", evt.candidate);
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
  async function ensureLocalStream(sender: boolean, video: boolean) {
    try {
      console.log("Ensuring local stream with video:", video);
      if (!lsRef.current) {
        const ls = await navigator.mediaDevices.getUserMedia({
          video,
          audio: true,
        });
        lsRef.current = ls;
      }
      console.log("Local stream obtained:", lsRef.current);
      return lsRef.current;
    } catch (e) {
      if (sender) {
        const confirmed = await confirm(
          "Cannot access media devices. Continue with voice call?",
          { title: "Access denied" }
        );
        if (confirmed) {
          return "audio-only";
        }
        return null;
      } else {
        await message("Cannot access media devices", {
          title: "Access denied",
        });
        if (!lsRef.current) {
          const ls = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          lsRef.current = ls;
        }
        return lsRef.current;
      }
    }
  }
  return (
    <MessageContext.Provider
      value={{
        targetUser,
        setTargetUser,
        room,
        setRoom,
        messages,
        setMessages,
        pendingMessages,
        setPendingMessages,
        pcRef,
        localVideoRef,
        localVideoElRef,
        remoteVideo,
        lsRef,
        inCall,
        setInCall,
        callType,
        setCallType,
        toggleVideo,
        setToggleVideo,
        toggleAudio,
        setToggleAudio,
        toggleLocalVideo,
        localStream,
        setLocalStream,
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
