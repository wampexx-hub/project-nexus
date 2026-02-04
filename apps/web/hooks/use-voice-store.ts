import { create } from "zustand";

export interface VoiceParticipant {
    odimUserId: string;
    odimSocketId: string;
    username: string;
    imageUrl?: string;
    isMuted: boolean;
    isDeafened: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
}

interface VoiceState {
    // Current channel state
    currentChannelId: string | null;
    currentServerId: string | null;
    channelName: string | null;
    channelType: "AUDIO" | "VIDEO" | null;

    // Participants
    participants: VoiceParticipant[];

    // Local user state
    isMuted: boolean;
    isDeafened: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;

    // Connection state
    isConnecting: boolean;
    isConnected: boolean;

    // Actions
    joinChannel: (channelId: string, serverId: string, channelName: string, channelType: "AUDIO" | "VIDEO") => void;
    leaveChannel: () => void;
    setParticipants: (participants: VoiceParticipant[]) => void;
    addParticipant: (participant: VoiceParticipant) => void;
    removeParticipant: (odimUserId: string) => void;
    updateParticipantState: (odimUserId: string, state: Partial<VoiceParticipant>) => void;
    toggleMute: () => void;
    toggleDeafen: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => void;
    setConnecting: (isConnecting: boolean) => void;
    setConnected: (isConnected: boolean) => void;
    reset: () => void;
}

const initialState = {
    currentChannelId: null,
    currentServerId: null,
    channelName: null,
    channelType: null,
    participants: [],
    isMuted: false,
    isDeafened: false,
    isVideoOn: false,
    isScreenSharing: false,
    isConnecting: false,
    isConnected: false,
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
    ...initialState,

    joinChannel: (channelId, serverId, channelName, channelType) => {
        set({
            currentChannelId: channelId,
            currentServerId: serverId,
            channelName,
            channelType,
            isConnecting: true,
            isConnected: false,
        });
    },

    leaveChannel: () => {
        set(initialState);
    },

    setParticipants: (participants) => {
        set({ participants });
    },

    addParticipant: (participant) => {
        set((state) => ({
            participants: [...state.participants.filter(p => p.odimUserId !== participant.odimUserId), participant]
        }));
    },

    removeParticipant: (odimUserId) => {
        set((state) => ({
            participants: state.participants.filter(p => p.odimUserId !== odimUserId)
        }));
    },

    updateParticipantState: (odimUserId, newState) => {
        set((state) => ({
            participants: state.participants.map(p =>
                p.odimUserId === odimUserId ? { ...p, ...newState } : p
            )
        }));
    },

    toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
    },

    toggleDeafen: () => {
        set((state) => {
            const newDeafened = !state.isDeafened;
            // If deafening, also mute
            return {
                isDeafened: newDeafened,
                isMuted: newDeafened ? true : state.isMuted
            };
        });
    },

    toggleVideo: () => {
        set((state) => ({ isVideoOn: !state.isVideoOn }));
    },

    toggleScreenShare: () => {
        set((state) => ({ isScreenSharing: !state.isScreenSharing }));
    },

    setConnecting: (isConnecting) => {
        set({ isConnecting });
    },

    setConnected: (isConnected) => {
        set({ isConnected, isConnecting: false });
    },

    reset: () => {
        set(initialState);
    },
}));
