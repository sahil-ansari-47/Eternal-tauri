"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Settings,
  UserPlus,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceParticipant from "@/components/ui/voice-participant";
import { useMessage } from "../contexts/MessageContext";
import { useUser } from "@clerk/clerk-react";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

export default function VoiceCall() {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const { user } = useUser();
  const { targetUser } = useMessage();
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: user?.username || "You",
      avatar: user?.imageUrl || "/placeholder.svg",
      isMuted: false,
      isDeafened: false,
      isSpeaking: true,
    },
    {
      id: "2",
      name: targetUser,
      avatar: user?.imageUrl || "/placeholder.svg",
      isMuted: true,
      isDeafened: false,
      isSpeaking: false,
    },
  ]);

  return (
    <div className="flex h-full flex-col bg-discord-dark">
      {/* Participants Grid */}
      <div className="flex flex-1 p-8 items-center">
        <div className="flex flex-1 justify-around items-center">
          {participants.map((participant) => (
            <VoiceParticipant key={participant.id} participant={participant} />
          ))}
        </div>
      </div>
    </div>
  );
}
