import { Video, VideoOff, MicOff, Mic, Phone } from "lucide-react";
import { useMessage } from "./contexts/MessageContext";
import { useUser } from "./contexts/UserContext";
import VideoStream from "./ui/video-stream";
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
    <div className="relative flex flex-col h-full w-full px-30 py-10 gap-4 bg-p5">
      <h1 className="text-xl text-p6 font-semibold">Call with {targetUser}</h1>
      {/* Primary Video Stream */}
      <VideoStream
        participantName={targetUser}
        videoref={remoteVideo as React.RefObject<HTMLVideoElement>}
      />
      <div className="absolute right-10 bottom-10 h-50 w-80">
        <VideoStream
          participantName={"You"}
          isMuted={toggleAudio}
          isVideoOn={toggleVideo}
          videoref={localVideo as React.RefObject<HTMLVideoElement>}
        />
      </div>
      <div className="w-full h flex justify-center gap-4">
        <button onClick={() => toggleLocalAudio(!toggleAudio)}>
          {toggleAudio ? (
            <Mic className="size-10 p-2 rounded-full bg-neutral-200 hover:bg-neutral-400 text-primary-sidebar cursor-pointer shadow-md" />
          ) : (
            <MicOff className="size-10 p-2 rounded-full border-1 bg-red-500 text-white border-neutral-300 cursor-pointer shadow-md" />
          )}
        </button>
        <button onClick={() => toggleLocalVideo(!toggleVideo)}>
          {toggleVideo ? (
            <Video className="size-10 p-2 rounded-full bg-neutral-200 hover:bg-neutral-400 text-primary-sidebar cursor-pointer shadow-md" />
          ) : (
            <VideoOff className="size-10 p-2 rounded-full border-1 bg-red-500 text-white border-neutral-300 cursor-pointer shadow-md" />
          )}
        </button>
        <button onClick={handleHangup}>
          <Phone className="bg-red-500 hover:bg-red-900 text-white size-10 p-2 rounded-full cursor-pointer shadow-md rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

export default Call;
