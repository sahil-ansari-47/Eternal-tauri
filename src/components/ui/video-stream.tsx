import { MicOff, VideoOff } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

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
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  // Combined ref callback to track element and call parent callback
  const combinedRef = (node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    videoElRef(node);
  };

  // Check if video element has a stream with active video tracks
  useEffect(() => {
    const checkVideoTrack = () => {
      const videoEl = videoElementRef.current;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        const hasActiveVideo = videoTracks.length > 0 && videoTracks[0]?.enabled && videoTracks[0]?.readyState === 'live';
        setHasVideoTrack(hasActiveVideo);
      } else {
        setHasVideoTrack(false);
      }
    };

    // Check immediately
    checkVideoTrack();

    // Set up interval to check periodically (handles async stream attachment)
    const interval = setInterval(checkVideoTrack, 200);

    return () => {
      clearInterval(interval);
    };
  }); // Run on every render to catch element/stream changes

  // Determine if video should be shown
  // Use isVideoOn prop if provided, otherwise check if element has active video track
  const showVideo = isVideoOn !== undefined ? isVideoOn : hasVideoTrack;
  
  return (
    <div
      className={clsx(
        "relative w-full h-full border-2 border-neutral-300 rounded-2xl overflow-hidden shadow-2xl group",
        !showVideo && "bg-primary-sidebar"
      )}
    >
      {/* Video Background */}
      {!showVideo ? (
        <div className="h-full flex flex-col items-center justify-center">
          <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Camera is off</p>
        </div>
      ) : (
        <video
          autoPlay
          playsInline
          muted
          ref={combinedRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'auto' }}
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
        {!showVideo && (
          <div className="bg-red-500/80 backdrop-blur-md p-2 rounded-lg">
            <VideoOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
