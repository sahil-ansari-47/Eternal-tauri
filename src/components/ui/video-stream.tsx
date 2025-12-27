import { MicOff, VideoOff } from "lucide-react";
import { useMessage } from "../contexts/MessageContext";
import { useEffect } from "react";
// import { useEffect } from "react";
// import { useMessage } from "../contexts/MessageContext";
interface VideoStreamProps {
  participantName: string;
  isMuted?: boolean;
  isLocal: boolean;
  videoElRef: React.RefObject<HTMLVideoElement | null>;
}

export default function VideoStream({
  participantName,
  isLocal,
  isMuted,
  videoElRef,
}: VideoStreamProps) {
  console.log(videoElRef, isMuted);
  const {
    localStream,
    remoteStream,
    localVideoElRef,
    remoteVideoElRef,
    isVideoOn,
    isRemoteVideoOn,
    setisRemoteVideoOn,
  } = useMessage();
  useEffect(() => {
    if (!localVideoElRef.current || !localStream) return;

    localVideoElRef.current.srcObject = localStream;
    localVideoElRef.current.play().catch((e) => {
      console.error("Error playing local stream:", e);
    });
  }, [localStream, isVideoOn]);

  useEffect(() => {
    if (!remoteVideoElRef.current || !remoteStream) {
      console.log("no remote stream");
      setisRemoteVideoOn(false);
      return;
    }
    console.log("setting remote stream", remoteStream);
    setisRemoteVideoOn(true);
    remoteVideoElRef.current.srcObject = remoteStream;
    remoteVideoElRef.current.play().catch((e) => {
      console.error("Error playing remote stream:", e);
    });
  }, [remoteStream, isRemoteVideoOn]);

  return (
    <div
      className={`
        relative w-full h-full border-2 border-neutral-300 rounded-2xl overflow-hidden shadow-2xl group ${
          isLocal && !isVideoOn ? "bg-primary-sidebar" : ""
        } ${!isLocal && !isRemoteVideoOn ? "bg-primary-sidebar" : ""}
      `}
    >
      {/* Video Background */}
      {((!isLocal && !isRemoteVideoOn) || (isLocal && !isVideoOn)) && !!videoElRef.current?.srcObject ? (
        <div className="h-full flex flex-col items-center justify-center">
          <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Camera is off</p>
        </div>
      ) : (
        // <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"></div>
        <video
          autoPlay
          playsInline
          muted
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
        {isMuted && (
          <div className="bg-red-500/80 backdrop-blur-md p-2 rounded-lg">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
        {(!isLocal && !isRemoteVideoOn) ||
          (isLocal && !isVideoOn && (
            <div className="bg-red-500/80 backdrop-blur-md p-2 rounded-lg">
              <VideoOff className="w-4 h-4 text-white" />
            </div>
          ))}
      </div>
    </div>
  );
}
