"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceStore, VoiceParticipant } from "@/hooks/use-voice-store";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useSocket } from "@/components/providers/socket-provider";
import { cn } from "@/lib/utils";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    MonitorOff,
    PhoneOff,
    Phone,
    Headphones,
    HeadphoneOff,
    Users,
    ChevronDown,
    ChevronUp,
    X,
    Maximize2,
    Minimize2,
} from "lucide-react";

interface ChannelCallPanelProps {
    channelId: string;
    channelName: string;
    serverId: string;
    username: string;
    userImageUrl?: string;
    userId: string;
}

interface MiniParticipantProps {
    participant: VoiceParticipant;
    isLocal?: boolean;
    stream?: MediaStream | null;
    isSpeaking?: boolean;
}

const MiniParticipant = ({ participant, isLocal, stream, isSpeaking }: MiniParticipantProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const showVideo = participant.isVideoOn || participant.isScreenSharing;

    return (
        <div
            className={cn(
                "relative rounded-lg overflow-hidden bg-[#2B2D31] transition-all flex-shrink-0",
                isSpeaking && "ring-2 ring-green-500",
                showVideo ? "w-32 h-24" : "w-12 h-12"
            )}
        >
            {showVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    {participant.imageUrl ? (
                        <img
                            src={participant.imageUrl}
                            alt={participant.username}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-semibold text-white">
                            {participant.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            {participant.isMuted && (
                <div className="absolute bottom-1 right-1">
                    <MicOff className="h-3 w-3 text-red-400" />
                </div>
            )}

            {isSpeaking && !showVideo && (
                <div className="absolute inset-0 rounded-lg border-2 border-green-500 animate-pulse" />
            )}
        </div>
    );
};

export const ChannelCallPanel = ({
    channelId,
    channelName,
    serverId,
    username,
    userImageUrl,
    userId,
}: ChannelCallPanelProps) => {
    const { socket, isConnected: socketConnected } = useSocket();
    const {
        currentChannelId,
        participants,
        isConnecting,
        isConnected: isVoiceConnected,
        isMuted,
        isDeafened,
        isVideoOn,
        isScreenSharing,
        joinChannel,
        leaveChannel,
        setConnected,
        setConnecting,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare,
    } = useVoiceStore();

    const {
        getLocalStream,
        createOffer,
        getRemoteStream,
        getLocalStreamRef,
        closeAllConnections,
        toggleVideo: toggleVideoStream,
        toggleScreenShare: toggleScreenShareStream,
    } = useWebRTC();

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);

    const isInCall = currentChannelId === channelId && isVoiceConnected;
    const isJoiningThisChannel = currentChannelId === channelId && isConnecting;

    // Join voice channel
    const handleJoinCall = useCallback(async () => {
        if (!socket || !socketConnected) return;

        try {
            setConnecting(true);
            joinChannel(channelId, serverId, channelName, "TEXT");

            // Get local media stream (audio only by default, video can be turned on later)
            const stream = await getLocalStream(false);
            setLocalStream(stream);

            // Join the voice channel via socket
            socket.emit("join-voice-channel", {
                channelId,
                serverId,
                username,
                imageUrl: userImageUrl,
            }, (response: { existingParticipants: VoiceParticipant[] }) => {
                // Create offers for existing participants
                if (response?.existingParticipants) {
                    response.existingParticipants.forEach((participant) => {
                        createOffer(participant.odimUserId);
                    });
                }
                setConnected(true);
            });
        } catch (error) {
            console.error("Failed to join call:", error);
            setConnecting(false);
        }
    }, [socket, socketConnected, channelId, serverId, channelName, username, userImageUrl, getLocalStream, createOffer, joinChannel, setConnected, setConnecting]);

    // Leave voice channel
    const handleLeaveCall = useCallback(() => {
        if (socket && currentChannelId) {
            socket.emit("leave-voice-channel", { channelId: currentChannelId });
        }
        closeAllConnections();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        leaveChannel();
    }, [socket, currentChannelId, closeAllConnections, localStream, leaveChannel]);

    // Handle toggle functions
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

    // Audio level detection for speaking indicator
    useEffect(() => {
        if (!localStream || !isInCall) return;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(localStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

            if (average > 20 && !isMuted) {
                setSpeakingUsers((prev) => new Set(prev).add(userId));
            } else {
                setSpeakingUsers((prev) => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            }
        };

        const interval = setInterval(checkAudioLevel, 100);

        return () => {
            clearInterval(interval);
            audioContext.close();
        };
    }, [localStream, isMuted, userId, isInCall]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isInCall) {
                handleLeaveCall();
            }
        };
    }, []);

    // Create local participant object for display
    const localParticipant: VoiceParticipant = {
        odimUserId: userId,
        odimSocketId: "",
        username,
        imageUrl: userImageUrl,
        isMuted,
        isDeafened,
        isVideoOn,
        isScreenSharing,
    };

    // Not in call - show join button
    if (!isInCall && !isJoiningThisChannel) {
        return (
            <div className="bg-[#2B2D31] border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                            {participants.length > 0
                                ? `${participants.length} kişi görüşmede`
                                : "Görüşme başlatmak için katılın"}
                        </span>
                    </div>
                    <button
                        onClick={handleJoinCall}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                        Görüşmeye Katıl
                    </button>
                </div>
            </div>
        );
    }

    // Joining call
    if (isJoiningThisChannel) {
        return (
            <div className="bg-[#2B2D31] border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                    <span className="text-sm">Görüşmeye bağlanılıyor...</span>
                </div>
            </div>
        );
    }

    // In call - show call panel
    return (
        <div className={cn(
            "bg-[#1E1F22] border-b border-zinc-800 transition-all",
            isMaximized ? "fixed inset-0 z-50" : ""
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2B2D31]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-zinc-200">
                        Görüşmede - {participants.length + 1} kişi
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
                    >
                        {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Participants */}
            {isExpanded && (
                <div className={cn(
                    "px-4 py-3",
                    isMaximized ? "flex-1 overflow-auto" : ""
                )}>
                    <div className={cn(
                        "flex gap-2 flex-wrap",
                        isMaximized ? "justify-center" : ""
                    )}>
                        {/* Local user */}
                        <MiniParticipant
                            participant={localParticipant}
                            isLocal
                            stream={localStream}
                            isSpeaking={speakingUsers.has(userId)}
                        />

                        {/* Remote participants */}
                        {participants
                            .filter((p) => p.odimUserId !== userId)
                            .map((participant) => (
                                <MiniParticipant
                                    key={participant.odimUserId}
                                    participant={participant}
                                    stream={getRemoteStream(participant.odimUserId)}
                                    isSpeaking={speakingUsers.has(participant.odimUserId)}
                                />
                            ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#232428]">
                {/* Mute Button */}
                <button
                    onClick={handleToggleMute}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isMuted
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                    )}
                    title={isMuted ? "Sesi Aç" : "Sessize Al"}
                >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Deafen Button */}
                <button
                    onClick={handleToggleDeafen}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isDeafened
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                    )}
                    title={isDeafened ? "Kulaklığı Aç" : "Sağır Modu"}
                >
                    {isDeafened ? <HeadphoneOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                </button>

                {/* Video Button */}
                <button
                    onClick={handleToggleVideo}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isVideoOn
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                    )}
                    title={isVideoOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                >
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                {/* Screen Share Button */}
                <button
                    onClick={handleToggleScreenShare}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isScreenSharing
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700"
                    )}
                    title={isScreenSharing ? "Paylaşımı Durdur" : "Ekran Paylaş"}
                >
                    {isScreenSharing ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
                </button>

                {/* Disconnect Button */}
                <button
                    onClick={handleLeaveCall}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Görüşmeden Ayrıl"
                >
                    <PhoneOff className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
