import { Video, VideoOff, MicOff, Mic, PhoneOff } from "lucide-react";
import { useMessage } from "./contexts/MessageContext";
import VideoStream from "./ui/video-stream";
import VoiceCall from "./ui/voice-call";
import { Button } from "./ui/button";
import { useEditor } from "./contexts/EditorContext";
import { useUser } from "./contexts/UserContext";

const Call = () => {
  const {
    isAudioOn,
    isVideoOn,
    toggleLocalAudio,
    toggleLocalVideo,
    handleHangup,
    callType,
    localAudioElRef,
    remoteAudioElRef,
    localVideoElRef,
    remoteVideoElRef,
  } = useMessage();
  const { activeTab } = useEditor();
  const { inCallwith, userData } = useUser();
  return (
    <div
      className={`${
        activeTab === "Call" ? "flex" : "hidden"
      } relative flex-col h-full w-full bg-p5`}
    >
      <div className="flex items-center justify-between border-b border-discord-darker px-6 py-4 bg-discord-dark">
        <h1 className="text-xl text-p6 font-semibold">
          Call with {inCallwith}
        </h1>
        {/* {callType === "audio" && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-discord-muted hover:bg-discord-darker hover:text-white"
            >
              <Video className="h-5 w-5" />
            </Button>
          </div>
        )} */}
      </div>
      {callType === "audio" ? (
        <div className="flex h-full flex-col bg-discord-dark">
          <div className="flex flex-1 p-8 items-center">
            <div className="flex flex-1 justify-around items-center">
              <VoiceCall
                participantName="You"
                isLocal={true}
                avatar={userData?.avatar || "/placeholder.svg"}
                audioElRef={localAudioElRef}
              />
              <VoiceCall
                participantName={inCallwith || "Remote User"}
                isLocal={false}
                avatar={
                  userData?.friends?.find((f) => f.username === inCallwith)
                    ?.avatar || "/placeholder.svg"
                }
                audioElRef={remoteAudioElRef}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Video Stream */}
          <VideoStream
            participantName={inCallwith || "Remote User"}
            isLocal={false}
            videoElRef={remoteVideoElRef}
          />
          <div className="absolute right-10 bottom-10 h-50 w-80">
            <VideoStream
              participantName="You"
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
            onClick={() => toggleLocalAudio(!isAudioOn)}
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
