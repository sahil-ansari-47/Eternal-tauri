import { MicOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";
import { useMessage } from "../contexts/MessageContext";
interface VoiceCallProps {
  participantName: string;
  isLocal: boolean;
  avatar: string;
  audioElRef: React.RefObject<HTMLAudioElement | null>;
}
export default function VoiceCall({
  participantName,
  isLocal,
  avatar,
  audioElRef,
}: VoiceCallProps) {
  const { localStream, remoteStream, isRemoteAudioOn, isAudioOn } =
    useMessage();
  useEffect(() => {
    if (!isLocal) return;
    if (!audioElRef.current || !localStream) return;
    audioElRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (isLocal) return;
    if (!audioElRef.current || !remoteStream) return;
    audioElRef.current.srcObject = remoteStream;
  }, [remoteStream]);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Speaking indicator ring */}
        {/* {participant.isSpeaking && (
                  <div className="absolute -inset-1 animate-pulse rounded-full bg-green-500/30 blur-sm" />
                )}
                {participant.isSpeaking && (
                  <div className="absolute -inset-0.5 rounded-full border-2 border-green-500" />
                )} */}
        <audio autoPlay playsInline ref={audioElRef} muted={isLocal}></audio>
        {/* Avatar */}
        <Avatar className="size-30 border-4 border-discord-dark">
          <AvatarImage src={avatar} alt={participantName} />
          <AvatarFallback className="bg-discord-blurple text-lg font-semibold text-white">
            {participantName ||
              " "
                .split(" ")
                .map((n) => n[0])
                .join("")}
          </AvatarFallback>
        </Avatar>

        {/* Status icons */}
        {((!isLocal && !isRemoteAudioOn) || (isLocal && !isAudioOn)) && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 border-2 border-discord-dark">
            <MicOff className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-sm font-medium text-white">{participantName}</p>
      </div>
    </div>
  );
}
