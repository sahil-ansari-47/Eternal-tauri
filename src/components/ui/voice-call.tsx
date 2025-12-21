"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Settings,
  // UserPlus,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceParticipant from "@/components/ui/voice-participant";

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
  const participants: Participant[] = [
    {
      id: "1",
      name: "John Doe",
      avatar: "/placeholder.svg",
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
    },
    {
      id: "2",
      name: "Jane Doe",
      avatar: "/placeholder.svg",
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
    },
  ];
  const handleEndCall = () => {
    console.log("Call ended");
  };

  return (
    <div className="flex h-fit flex-col bg-discord-dark">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-discord-darker px-6 py-4">
        {/* <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <div>
            <h1 className="text-lg font-semibold text-white">General Voice</h1>
            <p className="text-sm text-discord-muted">{participants.length} members</p>
          </div>
        </div> */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-discord-muted hover:bg-discord-darker hover:text-white"
          >
            <Video className="h-5 w-5" />
          </Button>
          {/* <Button variant="ghost" size="icon" className="text-discord-muted hover:bg-discord-darker hover:text-white">
            <UserPlus className="h-5 w-5" />
          </Button> */}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {participants.map((participant) => (
            <VoiceParticipant key={participant.id} participant={participant} />
          ))}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="border-t border-discord-darker bg-discord-darker/50 px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className={
              isMuted
                ? "h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
                : "h-12 w-12 rounded-full bg-discord-gray p-0 hover:bg-discord-gray-hover"
            }
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </Button>

          <Button
            variant={isDeafened ? "destructive" : "secondary"}
            size="lg"
            className={
              isDeafened
                ? "h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
                : "h-12 w-12 rounded-full bg-discord-gray p-0 hover:bg-discord-gray-hover"
            }
            onClick={() => setIsDeafened(!isDeafened)}
          >
            <Headphones className="h-5 w-5 text-white" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="h-12 w-12 rounded-full bg-discord-gray p-0 hover:bg-discord-gray-hover"
          >
            <Settings className="h-5 w-5 text-white" />
          </Button>

          <div className="mx-2 h-6 w-px bg-discord-darker" />

          <Button
            variant="destructive"
            size="lg"
            className="h-12 w-12 rounded-full bg-red-500 p-0 hover:bg-red-600"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
