"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { VoiceParticipant } from "@/hooks/use-voice-store";
import { Mic, MicOff, Video, Monitor } from "lucide-react";

interface VoiceChannelUsersProps {
    channelId: string;
}

export const VoiceChannelUsers = ({ channelId }: VoiceChannelUsersProps) => {
    const { socket, isConnected } = useSocket();
    const [participants, setParticipants] = useState<VoiceParticipant[]>([]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Get initial participants
        socket.emit("get-voice-participants", { channelId }, (response: { participants: VoiceParticipant[] }) => {
            if (response?.participants) {
                setParticipants(response.participants);
            }
        });

        // Listen for participant changes
        const handleParticipants = (data: { channelId: string; participants: VoiceParticipant[] }) => {
            if (data.channelId === channelId) {
                setParticipants(data.participants);
            }
        };

        const handleParticipantJoined = (data: { channelId: string; participant: VoiceParticipant }) => {
            if (data.channelId === channelId) {
                setParticipants((prev) => [...prev.filter(p => p.odimUserId !== data.participant.odimUserId), data.participant]);
            }
        };

        const handleParticipantLeft = (data: { channelId: string; odimUserId: string }) => {
            if (data.channelId === channelId) {
                setParticipants((prev) => prev.filter(p => p.odimUserId !== data.odimUserId));
            }
        };

        const handleStateChanged = (data: {
            channelId: string;
            odimUserId: string;
            isMuted: boolean;
            isDeafened: boolean;
            isVideoOn: boolean;
            isScreenSharing: boolean;
        }) => {
            if (data.channelId === channelId) {
                setParticipants((prev) =>
                    prev.map((p) =>
                        p.odimUserId === data.odimUserId
                            ? { ...p, isMuted: data.isMuted, isDeafened: data.isDeafened, isVideoOn: data.isVideoOn, isScreenSharing: data.isScreenSharing }
                            : p
                    )
                );
            }
        };

        socket.on("voice-participants", handleParticipants);
        socket.on("voice-participant-joined", handleParticipantJoined);
        socket.on("voice-participant-left", handleParticipantLeft);
        socket.on("voice-state-changed", handleStateChanged);

        return () => {
            socket.off("voice-participants", handleParticipants);
            socket.off("voice-participant-joined", handleParticipantJoined);
            socket.off("voice-participant-left", handleParticipantLeft);
            socket.off("voice-state-changed", handleStateChanged);
        };
    }, [socket, isConnected, channelId]);

    if (participants.length === 0) {
        return null;
    }

    return (
        <div className="ml-4 space-y-1">
            {participants.map((participant) => (
                <div
                    key={participant.odimUserId}
                    className="flex items-center gap-2 px-2 py-1 rounded text-zinc-400 text-sm"
                >
                    {participant.imageUrl ? (
                        <img
                            src={participant.imageUrl}
                            alt={participant.username}
                            className="w-5 h-5 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-medium text-white">
                            {participant.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="truncate flex-1">{participant.username}</span>
                    <div className="flex items-center gap-1">
                        {participant.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                        {participant.isVideoOn && <Video className="h-3 w-3 text-green-400" />}
                        {participant.isScreenSharing && <Monitor className="h-3 w-3 text-blue-400" />}
                    </div>
                </div>
            ))}
        </div>
    );
};
