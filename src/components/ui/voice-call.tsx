"use client";

import { useEffect } from "react";
import { MicOff } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessage } from "../contexts/MessageContext";
import { useUser } from "../contexts/UserContext";

export default function VoiceCall() {
  const { userData, inCallwith } = useUser();
  const { participants, setParticipants } = useMessage();

  useEffect(() => {
    setParticipants([
      {
        id: "0",
        name: "You",
        avatar: userData?.avatar || "/placeholder.svg",
        isSpeaking: false,
        isMuted: false,
      },
      {
        id: "1",
        name: inCallwith,
        avatar:
          userData?.friends?.find((f) => f.username === inCallwith)?.avatar ||
          "/placeholder.svg",
        isSpeaking: false,
        isMuted: false,
      },
    ] as Participant[]);
  }, [inCallwith]);

  return (
    <div className="flex h-full flex-col bg-discord-dark">
      {/* Participants Grid */}
      <div className="flex flex-1 p-8 items-center">
        <div className="flex flex-1 justify-around items-center">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                {/* Speaking indicator ring */}
                {participant.isSpeaking && (
                  <div className="absolute -inset-1 animate-pulse rounded-full bg-green-500/30 blur-sm" />
                )}
                {participant.isSpeaking && (
                  <div className="absolute -inset-0.5 rounded-full border-2 border-green-500" />
                )}

                {/* Avatar */}
                <Avatar className="size-30 border-4 border-discord-dark">
                  <AvatarImage
                    src={participant.avatar || "/placeholder.svg"}
                    alt={participant.name}
                  />
                  <AvatarFallback className="bg-discord-blurple text-lg font-semibold text-white">
                    {participant.name ||
                      " "
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
              </div>

              {/* Name */}
              <div className="text-center">
                <p className="text-sm font-medium text-white">
                  {participant.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
