"use client";

import { MicOff, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface VoiceParticipantProps {
  participant: Participant;
}

export default function VoiceParticipant({
  participant,
}: VoiceParticipantProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Speaking indicator ring */}
        {participant.isSpeaking && (
          <div className="absolute -inset-1 animate-pulse rounded-full bg-green-500/30 blur-sm" />
        )}
        {participant.isSpeaking && (
          <div className="absolute -inset-0.5 rounded-full border-2 border-green-500" />
        )}

        {/* Avatar */}
        <Avatar className="h-20 w-20 border-4 border-discord-dark">
          <AvatarImage
            src={participant.avatar || "/placeholder.svg"}
            alt={participant.name}
          />
          <AvatarFallback className="bg-discord-blurple text-lg font-semibold text-white">
            {participant.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        {/* Status icons */}
        {participant.isMuted && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 border-2 border-discord-dark">
            <MicOff className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        {participant.isDeafened && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 border-2 border-discord-dark">
            <VolumeX className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-sm font-medium text-white">{participant.name}</p>
      </div>
    </div>
  );
}
