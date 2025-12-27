import { MicOff, VideoOff } from "lucide-react";
import { useMessage } from "../contexts/MessageContext";
import { useEffect } from "react";
import { useUser } from "../contexts/UserContext";
// import { useEffect } from "react";
// import { useMessage } from "../contexts/MessageContext";
interface VideoStreamProps {
  participantName: string;
  isAudioOn: boolean;
  isLocal: boolean;
  videoElRef: React.RefObject<HTMLVideoElement | null>;
}

export default function VideoStream({
  participantName,
  isLocal,
  isAudioOn,
  videoElRef,
}: VideoStreamProps) {
  const {
    localStream,
    remoteStream,
    isVideoOn,
    isRemoteVideoOn,
    setisRemoteVideoOn,
    isRemoteAudioOn,
    setisRemoteAudioOn,
  } = useMessage();
  const { socket } = useUser();
  useEffect(() => {
    if (!isLocal) return;
    if (!videoElRef.current || !localStream) return;
    videoElRef.current.srcObject = localStream;
  }, [localStream, isAudioOn, isVideoOn]);

  useEffect(() => {
    if (isLocal) return;
    if (!videoElRef.current || !remoteStream) return;
    const getAudio = remoteStream.getAudioTracks();
    const getVideo = remoteStream.getVideoTracks();
    if (getAudio[0]?.enabled) {
      setisRemoteAudioOn(true);
    } else {
      console.log("remote audio off");
      setisRemoteAudioOn(false);
    }
    if (getVideo[0]?.enabled) {
      setisRemoteVideoOn(true);
    } else {
      console.log("remote video off");
      setisRemoteVideoOn(false);
    }
    console.log("Setting remote stream", remoteStream.getTracks());
    videoElRef.current.srcObject = remoteStream;
  }, [remoteStream, isRemoteAudioOn, isRemoteVideoOn]);

  socket.on("toggle-video", ({ video }) => {
    console.log("video is :", video);
    setisRemoteVideoOn(video);
  });

  socket.on("toggle-audio", ({ audio }) => {
    console.log("audio is :", audio);
    setisRemoteAudioOn(audio);
  });

  // useEffect(() => {
  //   if (isLocal) return;
  //   if (!remoteStream || !videoElRef.current) return;
  //   videoElRef.current.srcObject = remoteStream;
  //   const audioTrack = remoteStream.getAudioTracks()[0];
  //   const videoTrack = remoteStream.getVideoTracks()[0];
  //   if (audioTrack) {
  //     // initial state
  //     setisRemoteAudioOn(!audioTrack.muted);
  //     audioTrack.onmute = () => {
  //       console.log("🔇 Remote audio muted");
  //       setisRemoteAudioOn(false);
  //     };
  //     audioTrack.onunmute = () => {
  //       console.log("🔊 Remote audio unmuted");
  //       setisRemoteAudioOn(true);
  //     };
  //     audioTrack.onended = () => {
  //       console.log("❌ Remote audio ended");
  //       setisRemoteAudioOn(false);
  //     };
  //   }
  //   if (videoTrack) {
  //     setisRemoteVideoOn(!videoTrack.muted);

  //     videoTrack.onmute = () => {
  //       console.log("📷 Remote video muted");
  //       setisRemoteVideoOn(false);
  //     };
  //     videoTrack.onunmute = () => {
  //       console.log("🎥 Remote video unmuted");
  //       setisRemoteVideoOn(true);
  //     };
  //     videoTrack.onended = () => {
  //       console.log("❌ Remote video ended");
  //       setisRemoteVideoOn(false);
  //     };
  //   }
  //   return () => {
  //     if (audioTrack) {
  //       audioTrack.onmute = null;
  //       audioTrack.onunmute = null;
  //       audioTrack.onended = null;
  //     }
  //     if (videoTrack) {
  //       videoTrack.onmute = null;
  //       videoTrack.onunmute = null;
  //       videoTrack.onended = null;
  //     }
  //   };
  // }, [remoteStream]);

  return (
    <div
      className={`
        relative w-full h-full border-2 border-neutral-300 rounded-2xl overflow-hidden shadow-2xl group ${
          isLocal && !isVideoOn ? "bg-primary-sidebar" : ""
        } ${!isLocal && !isRemoteVideoOn ? "bg-primary-sidebar" : ""}
      `}
    >
      {(!isLocal && !isRemoteVideoOn) || (isLocal && !isVideoOn) ? (
        <div className="h-full flex flex-col items-center justify-center">
          <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Camera is off</p>
        </div>
      ) : (
        <video
          autoPlay
          playsInline
          muted={isLocal}
          ref={videoElRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Participant Info */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <span className="text-white font-medium text-sm">
          {participantName}
        </span>
      </div>
      {/* Status Indicators */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {((!isLocal && !isRemoteAudioOn) || (isLocal && !isAudioOn)) && (
          <div className="bg-red-500/80 backdrop-blur-md p-2 rounded-lg">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
