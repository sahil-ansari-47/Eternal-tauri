import { MicOff, VideoOff } from "lucide-react";
import { useMessage } from "../contexts/MessageContext";
import { useEffect } from "react";
interface VideoStreamProps {
  participantName: string;
  isLocal: boolean;
  videoElRef: React.RefObject<HTMLVideoElement | null>;
}

export default function VideoStream({
  participantName,
  isLocal,
  videoElRef,
}: VideoStreamProps) {
  const {
    localStream,
    remoteStream,
    isAudioOn,
    isRemoteAudioOn,
    isVideoOn,
    isRemoteVideoOn,
  } = useMessage();
  useEffect(() => {
    if (!isLocal) return;
    if (!videoElRef.current || !localStream) return;
    videoElRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (isLocal) return;
    if (!videoElRef.current || !remoteStream) return;
    videoElRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div
      className={`
        relative w-full h-full border-2 border-neutral-300 rounded-2xl overflow-hidden shadow-2xl group
      `}
    >
      {((!isLocal && !isRemoteVideoOn) || (isLocal && !isVideoOn)) && (
        <div className="absolute inset-0 h-full flex flex-col items-center justify-center">
          <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Camera is off</p>
        </div>
      )}
      <video
        autoPlay
        playsInline
        muted={isLocal}
        ref={videoElRef}
        className={`w-full h-full object-cover ${isLocal && "z-20"}`}
      />
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
