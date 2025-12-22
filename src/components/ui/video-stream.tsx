import { MicOff, VideoOff } from "lucide-react";
import clsx from "clsx";
// import { useEffect } from "react";
// import { useMessage } from "../contexts/MessageContext";
interface VideoStreamProps {
  participantName: string;
  isMuted?: boolean;
  isVideoOn?: boolean;
  videoElRef: (node: HTMLVideoElement | null) => void;
}

export default function VideoStream({
  participantName,
  isMuted,
  isVideoOn,
  videoElRef,
}: VideoStreamProps) {
  // const { localStream, localVideoElRef } = useMessage();
  console.log(videoElRef, isMuted, isVideoOn);
  // useEffect(() => {
  //   if (localVideoElRef.current && localStream) {
  //     localVideoElRef.current.srcObject = localStream;
  //   }
  // }, [localStream]);

  return (
    <div
      className={clsx(
        "relative w-full h-full border-2 border-neutral-300 rounded-2xl overflow-hidden shadow-2xl group",
        !isVideoOn && "bg-primary-sidebar"
      )}
    >
      {/* Video Background */}
      {!isVideoOn ? (
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
        {!isVideoOn && (
          <div className="bg-red-500/80 backdrop-blur-md p-2 rounded-lg">
            <VideoOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
