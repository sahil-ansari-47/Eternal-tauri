import {
  LucideVideo,
  LucideVideoOff,
  MicOff,
  Mic,
  PhoneOff,
  Video,
} from "lucide-react";
import { useMessage } from "./contexts/MessageContext";
import { useUser } from "./contexts/UserContext";
import VideoStream from "./ui/video-stream";
import VoiceCall from "./ui/voice-call";
import { Button } from "./ui/button";
const Call = () => {
  const { socket } = useUser();
  const {
    targetUser,
    remoteVideo,
    localVideo,
    toggleAudio,
    setToggleAudio,
    toggleVideo,
    toggleLocalVideo,
    pcRef,
    lsRef,
    setInCall,
    callType,
  } = useMessage();
  const handleHangup = () => {
    setInCall(false);
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
  function toggleLocalAudio(enabled: boolean) {
    setToggleAudio(enabled);
    if (!lsRef.current) return;
    lsRef.current
      .getAudioTracks()
      .forEach((track) => (track.enabled = enabled));
  }
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
            videoref={remoteVideo as React.RefObject<HTMLVideoElement>}
          />

          <div className="absolute right-10 bottom-10 h-50 w-80">
            <VideoStream
              participantName="You"
              isMuted={toggleAudio}
              isVideoOn={toggleVideo}
              videoref={localVideo as React.RefObject<HTMLVideoElement>}
            />
          </div>
        </>
      )}
      <div className="border-t border-discord-darker bg-discord-darker/50 px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <Button
            variant={toggleAudio ? "destructive" : "secondary"}
            size="lg"
            className={
              toggleAudio
                ? "h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
                : "h-12 w-12 rounded-full bg-discord-gray p-0 hover:bg-discord-gray-hover"
            }
            onClick={() => toggleLocalAudio(!toggleAudio)}
          >
            {toggleAudio ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </Button>
          {callType === "video" && (
            <Button
              variant={toggleVideo ? "destructive" : "secondary"}
              onClick={() => toggleLocalVideo(!toggleVideo)}
            >
              {toggleVideo ? (
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
