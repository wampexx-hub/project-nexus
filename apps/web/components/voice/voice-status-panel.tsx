"use client";

import { useVoiceStore } from "@/hooks/use-voice-store";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useSocket } from "@/components/providers/socket-provider";
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Signal } from "lucide-react";
import { cn } from "@/lib/utils";

export const VoiceStatusPanel = () => {
    const { socket } = useSocket();
    const {
        currentChannelId,
        channelName,
        isConnected,
        isMuted,
        isDeafened,
        toggleMute,
        toggleDeafen,
        leaveChannel,
    } = useVoiceStore();

    const { closeAllConnections } = useWebRTC();

    if (!currentChannelId || !isConnected) {
        return null;
    }

    const handleDisconnect = () => {
        if (socket && currentChannelId) {
            socket.emit("leave-voice-channel", { channelId: currentChannelId });
        }
        closeAllConnections();
        leaveChannel();
    };

    return (
        <div className="bg-[#232428] p-2 mt-auto border-t border-zinc-800">
            {/* Connected channel info */}
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
                <Signal className="h-4 w-4 text-green-500" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-500">Voice Connected</p>
                    <p className="text-xs text-zinc-400 truncate">{channelName}</p>
                </div>
            </div>

            {/* Quick controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={toggleMute}
                    className={cn(
                        "flex-1 p-2 rounded transition-colors flex items-center justify-center",
                        isMuted
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                    )}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <button
                    onClick={toggleDeafen}
                    className={cn(
                        "flex-1 p-2 rounded transition-colors flex items-center justify-center",
                        isDeafened
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                    )}
                    title={isDeafened ? "Undeafen" : "Deafen"}
                >
                    {isDeafened ? <HeadphoneOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                </button>

                <button
                    onClick={handleDisconnect}
                    className="flex-1 p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center"
                    title="Disconnect"
                >
                    <PhoneOff className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
