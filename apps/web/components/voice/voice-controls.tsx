"use client";

import { useVoiceStore } from "@/hooks/use-voice-store";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useSocket } from "@/components/providers/socket-provider";
import {
    Mic,
    MicOff,
    Headphones,
    HeadphoneOff,
    Video,
    VideoOff,
    Monitor,
    MonitorOff,
    PhoneOff,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
    channelType?: "AUDIO" | "VIDEO";
}

export const VoiceControls = ({ channelType = "AUDIO" }: VoiceControlsProps) => {
    const { socket } = useSocket();
    const {
        currentChannelId,
        isMuted,
        isDeafened,
        isVideoOn,
        isScreenSharing,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare,
        leaveChannel,
    } = useVoiceStore();

    const { closeAllConnections, toggleVideo: toggleVideoStream, toggleScreenShare: toggleScreenShareStream } = useWebRTC();

    const handleToggleMute = () => {
        toggleMute();
    };

    const handleToggleDeafen = () => {
        toggleDeafen();
    };

    const handleToggleVideo = async () => {
        await toggleVideoStream(!isVideoOn);
        toggleVideo();
    };

    const handleToggleScreenShare = async () => {
        await toggleScreenShareStream(!isScreenSharing);
        toggleScreenShare();
    };

    const handleDisconnect = () => {
        if (socket && currentChannelId) {
            socket.emit("leave-voice-channel", { channelId: currentChannelId });
        }
        closeAllConnections();
        leaveChannel();
    };

    return (
        <div className="flex items-center justify-center gap-2 p-4 bg-[#232428]">
            {/* Mute Button */}
            <button
                onClick={handleToggleMute}
                className={cn(
                    "p-3 rounded-full transition-colors",
                    isMuted
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                )}
                title={isMuted ? "Sesi Aç" : "Sessize Al"}
            >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Deafen Button */}
            <button
                onClick={handleToggleDeafen}
                className={cn(
                    "p-3 rounded-full transition-colors",
                    isDeafened
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                )}
                title={isDeafened ? "Kulaklığı Aç" : "Sağır Modu"}
            >
                {isDeafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
            </button>

            {/* Video Button - Always show so users can enable video in any channel */}
            <button
                onClick={handleToggleVideo}
                className={cn(
                    "p-3 rounded-full transition-colors",
                    isVideoOn
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                )}
                title={isVideoOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
            >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Screen Share Button */}
            <button
                onClick={handleToggleScreenShare}
                className={cn(
                    "p-3 rounded-full transition-colors",
                    isScreenSharing
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                )}
                title={isScreenSharing ? "Paylaşımı Durdur" : "Ekran Paylaş"}
            >
                {isScreenSharing ? <Monitor className="h-5 w-5" /> : <MonitorOff className="h-5 w-5" />}
            </button>

            {/* Disconnect Button */}
            <button
                onClick={handleDisconnect}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                title="Bağlantıyı Kes"
            >
                <PhoneOff className="h-5 w-5" />
            </button>

            {/* Settings Button */}
            <button
                className="p-3 rounded-full bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700 transition-colors"
                title="Ses Ayarları"
            >
                <Settings className="h-5 w-5" />
            </button>
        </div>
    );
};
