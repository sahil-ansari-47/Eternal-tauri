import {
  LucideVideo,
  LucideVideoOff,
  MicOff,
  Mic,
  PhoneOff,
  Video,
} from "lucide-react";
import { useEffect } from "react";
import { useMessage } from "./contexts/MessageContext";
import VideoStream from "./ui/video-stream";
import VoiceCall from "./ui/voice-call";
import { Button } from "./ui/button";

const Call = () => {
  const {
    targetUser,
    setParticipants,
    remoteVideoRef,
    isAudioOn,
    isVideoOn,
    toggleLocalAudio,
    localVideoRef,
    toggleLocalVideo,
    handleHangup,
    callType,
    localStream,
    localVideoElRef,
    lsRef,
    remoteStream,
    remoteVideoElRef,
  } = useMessage();

  // Ensure stream is attached when Call component mounts
  useEffect(() => {
    const attachStream = () => {
      const videoEl = localVideoElRef.current;
      const stream = lsRef.current || localStream;
      
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
        return true;
      }
      return false;
    };

    // Try immediately
    if (attachStream()) return;

    // Retry with delays
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    [50, 100, 200, 300, 500, 1000].forEach((delay) => {
      const timeoutId = setTimeout(() => {
        attachStream();
      }, delay);
      timeouts.push(timeoutId);
    });

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [localStream, localVideoElRef, lsRef]);

  return (
    <div className="relative flex flex-col h-full w-full bg-p5">
      <div className="flex items-center justify-between border-b border-discord-darker px-6 py-4 bg-discord-dark">
        <h1 className="text-xl text-p6 font-semibold">
          Call with {targetUser}
        </h1>
        {callType === "audio" && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-discord-muted hover:bg-discord-darker hover:text-white"
            >
              <Video className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
      {callType === "audio" ? (
        <VoiceCall />
      ) : (
        <>
          {/* Primary Video Stream */}
          <VideoStream
            participantName={targetUser}
            videoElRef={remoteVideoRef}
            isVideoOn={remoteStream ? remoteStream.getVideoTracks().length > 0 && remoteStream.getVideoTracks()[0]?.enabled : undefined}
          />

          <div className="absolute right-10 bottom-10 h-50 w-80">
            <VideoStream
              participantName="You"
              isMuted={isAudioOn}
              isVideoOn={isVideoOn}
              videoElRef={localVideoRef}
            />
          </div>
        </>
      )}
      <div className="border-t border-discord-darker bg-discord-darker/50 px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <Button
            variant={isAudioOn ? "destructive" : "secondary"}
            size="lg"
            className={
              isAudioOn
                ? "h-12 w-12 rounded-full bg-discord-gray p-0 hover:bg-discord-gray-hover"
                : "h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
            }
            onClick={() => {
              setParticipants((prev) =>
                prev.map((p) =>
                  p.name === "You" ? { ...p, isMuted: isAudioOn } : p
                )
              );
              toggleLocalAudio(!isAudioOn);
            }}
          >
            {isAudioOn ? (
              <Mic className="h-5 w-5 text-white" />
            ) : (
              <MicOff className="h-5 w-5 text-white" />
            )}
          </Button>
          {callType === "video" && (
            <Button
              variant={isVideoOn ? "destructive" : "secondary"}
              onClick={() => toggleLocalVideo(!isVideoOn)}
            >
              {isVideoOn ? (
                <LucideVideo className="size-10 p-2 rounded-full text-primary-sidebar shadow-md" />
              ) : (
                <LucideVideoOff className="size-10 p-2 rounded-full bg-red-500 text-white shadow-md" />
              )}
            </Button>
          )}
          <div className="mx-2 h-6 w-px bg-discord-darker" />
          <Button
            variant="destructive"
            size="lg"
            className="h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
            onClick={handleHangup}
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Call;
