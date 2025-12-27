import {
  Video,
  VideoOff,
  MicOff,
  Mic,
  PhoneOff,
} from "lucide-react";
import { useMessage } from "./contexts/MessageContext";
import VideoStream from "./ui/video-stream";
import VoiceCall from "./ui/voice-call";
import { Button } from "./ui/button";

const Call = () => {
  const {
    targetUser,
    setParticipants,
    isAudioOn,
    isVideoOn,
    isRemoteAudioOn,
    toggleLocalAudio,
    remoteVideoElRef,
    toggleLocalVideo,
    handleHangup,
    callType,
    localVideoElRef,
  } = useMessage();

  return (
    <div className="relative flex flex-col h-full w-full bg-p5cool">
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
            isAudioOn={isRemoteAudioOn}
            isLocal={false}
            videoElRef={remoteVideoElRef}
          />
          <div className="absolute right-10 bottom-10 h-50 w-80">
            <VideoStream
              participantName="You"
              isAudioOn={isAudioOn}
              isLocal={true}
              videoElRef={localVideoElRef}
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
              size="lg"
              className={
                isVideoOn
                  ? "h-12 w-12 rounded-full bg-discord-gray p-0 hover:bg-discord-gray-hover"
                  : "h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
              }
              onClick={() => toggleLocalVideo(!isVideoOn)}
            >
              {isVideoOn ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-white" />
              )}
            </Button>
          )}
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
