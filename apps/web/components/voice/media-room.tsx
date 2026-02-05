"use client";

import { useEffect, useRef, useState } from "react";
import { useVoiceStore, VoiceParticipant } from "@/hooks/use-voice-store";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useSocket } from "@/components/providers/socket-provider";
import { VoiceControls } from "./voice-controls";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video, VideoOff, Monitor, Loader2 } from "lucide-react";

interface MediaRoomProps {
    channelId: string;
    channelName: string;
    channelType: "AUDIO" | "VIDEO" | "TEXT";
    serverId: string;
    username: string;
    userImageUrl?: string;
    userId: string;
}

interface ParticipantVideoProps {
    participant: VoiceParticipant;
    isLocal?: boolean;
    stream?: MediaStream | null;
    isSpeaking?: boolean;
}

const ParticipantVideo = ({ participant, isLocal, stream, isSpeaking }: ParticipantVideoProps) => {
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
                "relative rounded-xl overflow-hidden bg-[#2B2D31] transition-all",
                isSpeaking && "ring-2 ring-green-500",
                showVideo ? "aspect-video" : "aspect-square"
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
                    <div className="relative">
                        {participant.imageUrl ? (
                            <img
                                src={participant.imageUrl}
                                alt={participant.username}
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-semibold text-white">
                                {participant.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {isSpeaking && (
                            <div className="absolute -inset-1 rounded-full border-2 border-green-500 animate-pulse" />
                        )}
                    </div>
                </div>
            )}

            {/* Status indicators */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 rounded bg-black/60">
                <span className="text-sm font-medium text-white truncate max-w-[120px]">
                    {participant.username}
                    {isLocal && " (You)"}
                </span>
                {participant.isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                {participant.isVideoOn && <Video className="h-4 w-4 text-green-400" />}
                {participant.isScreenSharing && <Monitor className="h-4 w-4 text-blue-400" />}
            </div>
        </div>
    );
};

export const MediaRoom = ({
    channelId,
    channelName,
    channelType,
    serverId,
    username,
    userImageUrl,
    userId,
}: MediaRoomProps) => {
    const { socket, isConnected } = useSocket();
    const {
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
    } = useVoiceStore();

    const { getLocalStream, createOffer, getRemoteStream, getLocalStreamRef, closeAllConnections } = useWebRTC();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

    // Join voice channel on mount
    useEffect(() => {
        if (!socket || !isConnected) return;

        const initializeVoiceChannel = async () => {
            try {
                setConnecting(true);
                joinChannel(channelId, serverId, channelName, channelType);

                console.log("Requesting local media stream...");
                // Get local media stream
                const stream = await getLocalStream(channelType === "VIDEO");
                console.log("Local media stream obtained.");
                setLocalStream(stream);

                console.log("Emitting join-voice-channel to socket...");
                // Join the voice channel via socket
                // Add explicit timeout to prevent getting stuck
                const timeout = setTimeout(() => {
                    console.error("Connection timed out - forcing state reset");
                    setConnecting(false);
                }, 15000);

                socket.emit("join-voice-channel", {
                    channelId,
                    serverId,
                    username,
                    imageUrl: userImageUrl,
                }, (response: { existingParticipants: VoiceParticipant[], error?: string }) => {
                    clearTimeout(timeout);
                    console.log("Received join-voice-channel response:", response);

                    if (response?.error) {
                        console.error("Join failed:", response.error);
                        setConnecting(false);
                        return;
                    }

                    // Create offers for existing participants
                    if (response?.existingParticipants) {
                        response.existingParticipants.forEach((participant) => {
                            createOffer(participant.odimUserId);
                        });
                    }
                    setConnected(true);
                });
            } catch (error) {
                console.error("Failed to initialize voice channel:", error);
                setConnecting(false);
            }
        };

        initializeVoiceChannel();

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.emit("leave-voice-channel", { channelId });
            }
            closeAllConnections();
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            // Ensure we reset the global store state
            leaveChannel();
        };
    }, [socket, isConnected, channelId]);

    // Audio level detection for speaking indicator
    useEffect(() => {
        if (!localStream) return;

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
    }, [localStream, isMuted, userId]);

    // Get grid columns based on participant count
    const getGridClass = () => {
        const count = participants.length + 1; // +1 for local user
        if (count === 1) return "grid-cols-1 max-w-md mx-auto";
        if (count === 2) return "grid-cols-2 max-w-3xl mx-auto";
        if (count <= 4) return "grid-cols-2";
        if (count <= 6) return "grid-cols-3";
        return "grid-cols-4";
    };

    if (isConnecting) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#313338]">
                <Loader2 className="h-10 w-10 animate-spin text-zinc-400 mb-4" />
                <p className="text-zinc-400">Connecting to voice channel...</p>
            </div>
        );
    }

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

    return (
        <div className="flex-1 flex flex-col bg-[#313338]">
            {/* Header */}
            <div className="h-12 flex items-center px-4 border-b border-zinc-800">
                <span className="text-zinc-200 font-semibold">
                    {channelType === "VIDEO" ? "Video" : "Voice"} Channel - {channelName}
                </span>
                <span className="ml-2 text-zinc-400 text-sm">
                    ({participants.length + 1} participant{participants.length !== 0 ? "s" : ""})
                </span>
            </div>

            {/* Participants Grid */}
            <div className="flex-1 p-4 overflow-auto">
                <div className={cn("grid gap-4", getGridClass())}>
                    {/* Local user */}
                    <ParticipantVideo
                        participant={localParticipant}
                        isLocal
                        stream={localStream}
                        isSpeaking={speakingUsers.has(userId)}
                    />

                    {/* Remote participants */}
                    {participants
                        .filter((p) => p.odimUserId !== userId)
                        .map((participant) => (
                            <ParticipantVideo
                                key={participant.odimUserId}
                                participant={participant}
                                stream={getRemoteStream(participant.odimUserId)}
                                isSpeaking={speakingUsers.has(participant.odimUserId)}
                            />
                        ))}
                </div>
            </div>

            {/* Controls */}
            <VoiceControls channelType={channelType === "TEXT" ? "AUDIO" : channelType} />
        </div>
    );
};
