"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useVoiceStore, VoiceParticipant } from "./use-voice-store";

interface PeerConnection {
    pc: RTCPeerConnection;
    odimUserId: string;
}

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
};

export const useWebRTC = () => {
    const { socket, isConnected } = useSocket();
    const {
        currentChannelId,
        isMuted,
        isDeafened,
        isVideoOn,
        isScreenSharing,
        setParticipants,
        addParticipant,
        removeParticipant,
        updateParticipantState,
        setConnected,
    } = useVoiceStore();

    const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

    // Get local media stream
    const getLocalStream = useCallback(async (video: boolean = false) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: video ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user",
                } : false,
            });
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error("Failed to get local stream:", error);
            throw error;
        }
    }, []);

    // Get screen share stream
    const getScreenStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 },
                },
                audio: true,
            });
            screenStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error("Failed to get screen stream:", error);
            throw error;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
        // Check if connection already exists
        const existingPeer = peerConnectionsRef.current.get(targetUserId);
        if (existingPeer && existingPeer.pc.connectionState !== "failed" && existingPeer.pc.connectionState !== "closed") {
            console.log(`Using existing peer connection to ${targetUserId}`);
            return existingPeer.pc;
        }

        console.log(`Creating new peer connection to ${targetUserId}`);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to peer connection
        if (localStreamRef.current) {
            console.log(`Adding ${localStreamRef.current.getTracks().length} tracks to peer connection`);
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        } else {
            console.warn("No local stream available when creating peer connection");
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket && currentChannelId) {
                console.log(`Sending ICE candidate to ${targetUserId}`);
                socket.emit("webrtc-ice-candidate", {
                    targetUserId,
                    candidate: event.candidate.toJSON(),
                    channelId: currentChannelId,
                });
            }
        };

        // Handle ICE gathering state
        pc.onicegatheringstatechange = () => {
            console.log(`ICE gathering state for ${targetUserId}: ${pc.iceGatheringState}`);
        };

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state for ${targetUserId}: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === "failed") {
                console.log("ICE connection failed, attempting restart...");
                pc.restartIce();
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log(`Received track from ${targetUserId}:`, event.track.kind);
            const [remoteStream] = event.streams;
            if (remoteStream) {
                remoteStreamsRef.current.set(targetUserId, remoteStream);
                // Trigger re-render by updating participant
                updateParticipantState(targetUserId, {});
            }
        };

        // Handle connection state
        pc.onconnectionstatechange = () => {
            console.log(`Peer connection to ${targetUserId}: ${pc.connectionState}`);
            if (pc.connectionState === "connected") {
                console.log(`Successfully connected to ${targetUserId}`);
            } else if (pc.connectionState === "failed") {
                console.error(`Connection to ${targetUserId} failed`);
                // Clean up failed connection
                peerConnectionsRef.current.delete(targetUserId);
            } else if (pc.connectionState === "disconnected") {
                console.warn(`Connection to ${targetUserId} disconnected`);
            }
        };

        // Handle negotiation needed
        pc.onnegotiationneeded = async () => {
            console.log(`Negotiation needed for ${targetUserId}`);
        };

        peerConnectionsRef.current.set(targetUserId, { pc, odimUserId: targetUserId });
        return pc;
    }, [socket, currentChannelId, updateParticipantState]);

    // Create offer
    const createOffer = useCallback(async (targetUserId: string) => {
        console.log(`Creating offer for ${targetUserId}`);
        const pc = createPeerConnection(targetUserId);

        try {
            // Wait a bit if local stream is not ready yet
            if (!localStreamRef.current) {
                console.log("Waiting for local stream...");
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Re-add tracks if they weren't added during connection creation
            if (localStreamRef.current && pc.getSenders().length === 0) {
                console.log("Re-adding tracks to peer connection");
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);

            if (socket && currentChannelId) {
                console.log(`Sending offer to ${targetUserId}`);
                socket.emit("webrtc-offer", {
                    targetUserId,
                    offer: pc.localDescription,
                    channelId: currentChannelId,
                });
            }
        } catch (error) {
            console.error("Failed to create offer:", error);
        }
    }, [createPeerConnection, socket, currentChannelId]);

    // Handle received offer
    const handleOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
        console.log(`Received offer from ${fromUserId}`);
        let peerData = peerConnectionsRef.current.get(fromUserId);

        if (!peerData) {
            const pc = createPeerConnection(fromUserId);
            peerData = { pc, odimUserId: fromUserId };
        }

        const pc = peerData.pc;

        try {
            // Check if we can set remote description
            if (pc.signalingState === "stable" || pc.signalingState === "have-local-offer") {
                // Handle glare condition (both sides sent offers)
                if (pc.signalingState === "have-local-offer") {
                    console.log("Glare condition detected, rolling back local description");
                    await pc.setLocalDescription({ type: "rollback" });
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));

                // Add tracks if not already added
                if (localStreamRef.current && pc.getSenders().length === 0) {
                    localStreamRef.current.getTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current!);
                    });
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (socket && currentChannelId) {
                    console.log(`Sending answer to ${fromUserId}`);
                    socket.emit("webrtc-answer", {
                        targetUserId: fromUserId,
                        answer: pc.localDescription,
                        channelId: currentChannelId,
                    });
                }
            } else {
                console.warn(`Cannot set remote offer in state: ${pc.signalingState}`);
            }
        } catch (error) {
            console.error("Failed to handle offer:", error);
        }
    }, [createPeerConnection, socket, currentChannelId]);

    // Handle received answer
    const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
        console.log(`Received answer from ${fromUserId}`);
        const peerData = peerConnectionsRef.current.get(fromUserId);
        if (!peerData) {
            console.warn(`No peer connection found for ${fromUserId}`);
            return;
        }

        try {
            if (peerData.pc.signalingState === "have-local-offer") {
                await peerData.pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log(`Successfully set remote answer from ${fromUserId}`);
            } else {
                console.warn(`Cannot set remote answer in state: ${peerData.pc.signalingState}`);
            }
        } catch (error) {
            console.error("Failed to handle answer:", error);
        }
    }, []);

    // Pending ICE candidates (received before remote description is set)
    const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    // Handle ICE candidate
    const handleICECandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
        const peerData = peerConnectionsRef.current.get(fromUserId);
        if (!peerData) {
            // Store candidate for later if connection doesn't exist yet
            const pending = pendingCandidatesRef.current.get(fromUserId) || [];
            pending.push(candidate);
            pendingCandidatesRef.current.set(fromUserId, pending);
            console.log(`Stored pending ICE candidate for ${fromUserId}`);
            return;
        }

        try {
            // Check if remote description is set
            if (peerData.pc.remoteDescription) {
                await peerData.pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`Added ICE candidate from ${fromUserId}`);

                // Process any pending candidates
                const pending = pendingCandidatesRef.current.get(fromUserId);
                if (pending && pending.length > 0) {
                    for (const pendingCandidate of pending) {
                        await peerData.pc.addIceCandidate(new RTCIceCandidate(pendingCandidate));
                    }
                    pendingCandidatesRef.current.delete(fromUserId);
                    console.log(`Processed ${pending.length} pending ICE candidates for ${fromUserId}`);
                }
            } else {
                // Store candidate for later
                const pending = pendingCandidatesRef.current.get(fromUserId) || [];
                pending.push(candidate);
                pendingCandidatesRef.current.set(fromUserId, pending);
                console.log(`Stored pending ICE candidate for ${fromUserId} (no remote description yet)`);
            }
        } catch (error) {
            console.error("Failed to add ICE candidate:", error);
        }
    }, []);

    // Close all peer connections
    const closeAllConnections = useCallback(() => {
        console.log("Closing all peer connections");
        peerConnectionsRef.current.forEach(({ pc, odimUserId }) => {
            console.log(`Closing connection to ${odimUserId}`);
            pc.close();
        });
        peerConnectionsRef.current.clear();
        remoteStreamsRef.current.clear();
        pendingCandidatesRef.current.clear();

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Stop screen stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
    }, []);

    // Toggle audio
    const toggleAudio = useCallback((muted: boolean) => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(async (enabled: boolean) => {
        if (!localStreamRef.current) return;

        if (enabled) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user",
                    },
                });
                const videoTrack = videoStream.getVideoTracks()[0];
                if (!videoTrack) return;

                // Add video track to local stream
                localStreamRef.current.addTrack(videoTrack);

                // Add video track to all peer connections
                peerConnectionsRef.current.forEach(({ pc }) => {
                    pc.addTrack(videoTrack, localStreamRef.current!);
                });
            } catch (error) {
                console.error("Failed to enable video:", error);
            }
        } else {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.stop();
                localStreamRef.current?.removeTrack(track);
            });
        }
    }, []);

    // Toggle screen share
    const toggleScreenShare = useCallback(async (enabled: boolean) => {
        if (enabled) {
            try {
                const stream = await getScreenStream();
                const screenTrack = stream.getVideoTracks()[0];
                if (!screenTrack) return;

                // Replace video track in all peer connections
                peerConnectionsRef.current.forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === "video");
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    } else {
                        pc.addTrack(screenTrack, stream);
                    }
                });

                // Handle screen share ending
                screenTrack.onended = () => {
                    useVoiceStore.getState().toggleScreenShare();
                };
            } catch (error) {
                console.error("Failed to start screen share:", error);
            }
        } else {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;

                // Restore camera video if it was on
                if (isVideoOn && localStreamRef.current) {
                    const videoTrack = localStreamRef.current.getVideoTracks()[0];
                    if (videoTrack) {
                        peerConnectionsRef.current.forEach(({ pc }) => {
                            const sender = pc.getSenders().find(s => s.track?.kind === "video");
                            if (sender) {
                                sender.replaceTrack(videoTrack);
                            }
                        });
                    }
                }
            }
        }
    }, [getScreenStream, isVideoOn]);

    // Get remote stream for a user
    const getRemoteStream = useCallback((odimUserId: string): MediaStream | null => {
        return remoteStreamsRef.current.get(odimUserId) || null;
    }, []);

    // Get local stream
    const getLocalStreamRef = useCallback(() => {
        return localStreamRef.current;
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleVoiceParticipants = (data: { channelId: string; participants: VoiceParticipant[] }) => {
            if (data.channelId === currentChannelId) {
                setParticipants(data.participants);
            }
        };

        const handleParticipantJoined = (data: { channelId: string; participant: VoiceParticipant }) => {
            if (data.channelId === currentChannelId) {
                addParticipant(data.participant);
                // Do NOT create offer here. The newcomer will create the offer.
                // createOffer(data.participant.odimUserId);
            }
        };

        const handleParticipantLeft = (data: { channelId: string; odimUserId: string }) => {
            if (data.channelId === currentChannelId) {
                removeParticipant(data.odimUserId);
                // Close peer connection
                const peerData = peerConnectionsRef.current.get(data.odimUserId);
                if (peerData) {
                    peerData.pc.close();
                    peerConnectionsRef.current.delete(data.odimUserId);
                }
                remoteStreamsRef.current.delete(data.odimUserId);
            }
        };

        const handleVoiceStateChanged = (data: {
            channelId: string;
            odimUserId: string;
            isMuted: boolean;
            isDeafened: boolean;
            isVideoOn: boolean;
            isScreenSharing: boolean;
        }) => {
            if (data.channelId === currentChannelId) {
                updateParticipantState(data.odimUserId, {
                    isMuted: data.isMuted,
                    isDeafened: data.isDeafened,
                    isVideoOn: data.isVideoOn,
                    isScreenSharing: data.isScreenSharing,
                });
            }
        };

        const handleWebRTCOffer = (data: { fromUserId: string; offer: RTCSessionDescriptionInit; channelId: string }) => {
            if (data.channelId === currentChannelId) {
                handleOffer(data.fromUserId, data.offer);
            }
        };

        const handleWebRTCAnswer = (data: { fromUserId: string; answer: RTCSessionDescriptionInit; channelId: string }) => {
            if (data.channelId === currentChannelId) {
                handleAnswer(data.fromUserId, data.answer);
            }
        };

        const handleWebRTCICECandidate = (data: { fromUserId: string; candidate: RTCIceCandidateInit; channelId: string }) => {
            if (data.channelId === currentChannelId) {
                handleICECandidate(data.fromUserId, data.candidate);
            }
        };

        socket.on("voice-participants", handleVoiceParticipants);
        socket.on("voice-participant-joined", handleParticipantJoined);
        socket.on("voice-participant-left", handleParticipantLeft);
        socket.on("voice-state-changed", handleVoiceStateChanged);
        socket.on("webrtc-offer", handleWebRTCOffer);
        socket.on("webrtc-answer", handleWebRTCAnswer);
        socket.on("webrtc-ice-candidate", handleWebRTCICECandidate);

        return () => {
            socket.off("voice-participants", handleVoiceParticipants);
            socket.off("voice-participant-joined", handleParticipantJoined);
            socket.off("voice-participant-left", handleParticipantLeft);
            socket.off("voice-state-changed", handleVoiceStateChanged);
            socket.off("webrtc-offer", handleWebRTCOffer);
            socket.off("webrtc-answer", handleWebRTCAnswer);
            socket.off("webrtc-ice-candidate", handleWebRTCICECandidate);
        };
    }, [
        socket,
        isConnected,
        currentChannelId,
        setParticipants,
        addParticipant,
        removeParticipant,
        updateParticipantState,
        createOffer,
        handleOffer,
        handleAnswer,
        handleICECandidate,
    ]);

    // Sync local mute state with tracks
    useEffect(() => {
        toggleAudio(isMuted);
    }, [isMuted, toggleAudio]);

    // Send voice state updates to server
    useEffect(() => {
        if (socket && currentChannelId) {
            socket.emit("voice-state-update", {
                channelId: currentChannelId,
                isMuted,
                isDeafened,
                isVideoOn,
                isScreenSharing,
            });
        }
    }, [socket, currentChannelId, isMuted, isDeafened, isVideoOn, isScreenSharing]);

    return {
        getLocalStream,
        getScreenStream,
        createOffer,
        closeAllConnections,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        getRemoteStream,
        getLocalStreamRef,
    };
};
