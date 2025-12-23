import { createContext, useCallback, useContext, useRef } from "react";
import { useState } from "react";
import { useUser } from "./UserContext";
import { confirm, message } from "@tauri-apps/plugin-dialog";
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
  canSendIceRef: React.RefObject<boolean>;
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
  const { socket, setinCallwith } = useUser();
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
    localVideoElRef.current = node;
    console.log("Local video ref callback:", node);
    console.log("Local stream in callback:", lsRef.current);
    if (node && lsRef.current) {
      console.log("Attaching local stream (authoritative)");
      node.srcObject = lsRef.current;
    }
  }, []);
  const remoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoElRef.current = node;
  }, []);
  const canSendIceRef = useRef(false);
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
        // if (!canSendIceRef.current) {
        //   bufferedCandidatesRef.current.push(evt.candidate);
        //   return;
        // }
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
          if (!lsRef.current) {
            const ls = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            lsRef.current = ls;
          }
          return lsRef.current;
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
        canSendIceRef,
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
