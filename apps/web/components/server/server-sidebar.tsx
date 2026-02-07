"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Settings, Volume2, ChevronDown, UserPlus, Trash, Hash, Users, Crown, Shield } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { useVoiceStore } from "@/hooks/use-voice-store";
import { VoiceChannelUsers } from "@/components/voice/voice-channel-users";
import { VoiceStatusPanel } from "@/components/voice/voice-status-panel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ServerSidebarProps {
    serverId: string;
}

export const ServerSidebar = ({
    serverId
}: ServerSidebarProps) => {
    const [server, setServer] = useState<any>(null);
    const [showMembers, setShowMembers] = useState(true);
    const router = useRouter();
    const params = useParams();
    const activeChannelId = params?.channelId as string;
    const { onOpen } = useModal();
    const { currentChannelId } = useVoiceStore();

    useEffect(() => {
        const fetchServer = async () => {
            try {
                const res = await api.get(`/servers/${serverId}`);
                setServer(res.data);
            } catch (e) {
                console.error(e);
                router.push("/channels");
            }
        }
        fetchServer();
    }, [serverId, router]);

    const handleVoiceChannelClick = (channelId: string) => {
        router.push(`/channels/${serverId}/${channelId}`);
    };

    if (!server) {
        return (
            <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
        )
    }

    const textChannels = server.channels?.filter((channel: any) => channel.type === "TEXT") || [];
    const voiceChannels = server.channels?.filter((channel: any) => channel.type === "AUDIO" || channel.type === "VIDEO") || [];

    // Group members by role
    const admins = server.members?.filter((m: any) => m.role === "ADMIN") || [];
    const moderators = server.members?.filter((m: any) => m.role === "MODERATOR") || [];
    const guests = server.members?.filter((m: any) => m.role === "GUEST") || [];

    const roleIcon: Record<string, any> = {
        ADMIN: <Crown className="h-3 w-3 text-yellow-500" />,
        MODERATOR: <Shield className="h-3 w-3 text-indigo-400" />,
    };

    const statusColors: Record<string, string> = {
        ONLINE: "bg-green-500",
        IDLE: "bg-yellow-500",
        DND: "bg-red-500",
        INVISIBLE: "bg-gray-500",
        OFFLINE: "bg-gray-500",
    };

    return (
        <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="focus:outline-none"
                    asChild
                >
                    <button className="w-full text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition">
                        {server.name}
                        <ChevronDown className="h-5 w-5 ml-auto" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px] bg-white dark:bg-[#111214] border-none shadow-xl"
                >
                    <DropdownMenuItem
                        onClick={() => onOpen("invite", { server })}
                        className="text-indigo-600 dark:text-indigo-400 px-3 py-2 text-sm cursor-pointer hover:bg-indigo-500 hover:text-white"
                    >
                        Davet Et
                        <UserPlus className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onOpen("editServer", { server })}
                        className="px-3 py-2 text-sm cursor-pointer"
                    >
                        Sunucu Ayarları
                        <Settings className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onOpen("members", { server })}
                        className="px-3 py-2 text-sm cursor-pointer"
                    >
                        Üyeleri Yönet
                        <Users className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-700" />
                    <DropdownMenuItem
                        onClick={() => onOpen("deleteServer", { server })}
                        className="text-rose-500 px-3 py-2 text-sm cursor-pointer hover:bg-rose-500 hover:text-white"
                    >
                        Sunucuyu Sil
                        <Trash className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 px-2 py-2 overflow-y-auto custom-scrollbar">
                {/* Text Channels */}
                {!!textChannels?.length && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between py-2 px-1">
                            <p className="text-[11px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
                                Metin Kanalları
                            </p>
                            <button
                                onClick={() => onOpen("createChannel")}
                                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-[2px]">
                            {textChannels.map((channel: any) => (
                                <div key={channel.id}>
                                    <button
                                        onClick={() => router.push(`/channels/${serverId}/${channel.id}`)}
                                        className={cn(
                                            "group px-2 py-1.5 rounded-md flex items-center gap-x-2 w-full transition",
                                            activeChannelId === channel.id
                                                ? "bg-zinc-700/50 text-white"
                                                : "hover:bg-zinc-700/10 dark:hover:bg-zinc-700/30 text-zinc-500 dark:text-zinc-400"
                                        )}
                                    >
                                        <Hash className="flex-shrink-0 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        <p className={cn(
                                            "line-clamp-1 font-medium text-sm transition",
                                            activeChannelId === channel.id
                                                ? "text-white"
                                                : "text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300"
                                        )}>
                                            {channel.name}
                                        </p>
                                    </button>
                                    <VoiceChannelUsers channelId={channel.id} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Voice Channels */}
                {!!voiceChannels?.length && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between py-2 px-1">
                            <p className="text-[11px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
                                Ses Kanalları
                            </p>
                            <button
                                onClick={() => onOpen("createChannel")}
                                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {voiceChannels.map((channel: any) => (
                            <div key={channel.id}>
                                <div
                                    onClick={() => handleVoiceChannelClick(channel.id)}
                                    className={cn(
                                        "px-2 py-1.5 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/30 rounded-md cursor-pointer flex items-center gap-x-2 transition",
                                        currentChannelId === channel.id
                                            ? "bg-zinc-700/50 text-white"
                                            : "text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    <Volume2 className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate text-sm font-medium">{channel.name}</span>
                                </div>
                                <VoiceChannelUsers channelId={channel.id} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Members Section */}
                <div className="mt-4">
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className="flex items-center justify-between py-2 px-1 w-full"
                    >
                        <p className="text-[11px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
                            Üyeler — {server.members?.length || 0}
                        </p>
                        <ChevronDown className={cn(
                            "h-3 w-3 text-zinc-400 transition-transform",
                            !showMembers && "-rotate-90"
                        )} />
                    </button>

                    {showMembers && (
                        <div className="space-y-0.5">
                            {/* Admins */}
                            {admins.length > 0 && (
                                <>
                                    <p className="text-[10px] uppercase font-semibold text-zinc-500 px-1 mt-2 mb-1">
                                        Yönetici — {admins.length}
                                    </p>
                                    {admins.map((member: any) => (
                                        <button
                                            key={member.id}
                                            onClick={() => onOpen("userProfile", { userId: member.userId })}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-700/30 transition group"
                                        >
                                            <div className="relative">
                                                <div className="h-8 w-8 rounded-full bg-red-500/80 flex items-center justify-center text-white text-xs font-semibold">
                                                    {member.user?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2B2D31] ${statusColors[member.user?.status] || "bg-gray-500"}`} />
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="text-sm font-medium text-red-400 truncate group-hover:text-red-300">
                                                    {member.user?.username || "Bilinmeyen"}
                                                </span>
                                                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Moderators */}
                            {moderators.length > 0 && (
                                <>
                                    <p className="text-[10px] uppercase font-semibold text-zinc-500 px-1 mt-2 mb-1">
                                        Moderatör — {moderators.length}
                                    </p>
                                    {moderators.map((member: any) => (
                                        <button
                                            key={member.id}
                                            onClick={() => onOpen("userProfile", { userId: member.userId })}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-700/30 transition group"
                                        >
                                            <div className="relative">
                                                <div className="h-8 w-8 rounded-full bg-indigo-500/80 flex items-center justify-center text-white text-xs font-semibold">
                                                    {member.user?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2B2D31] ${statusColors[member.user?.status] || "bg-gray-500"}`} />
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="text-sm font-medium text-indigo-400 truncate group-hover:text-indigo-300">
                                                    {member.user?.username || "Bilinmeyen"}
                                                </span>
                                                <Shield className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Members */}
                            {guests.length > 0 && (
                                <>
                                    <p className="text-[10px] uppercase font-semibold text-zinc-500 px-1 mt-2 mb-1">
                                        Üye — {guests.length}
                                    </p>
                                    {guests.map((member: any) => (
                                        <button
                                            key={member.id}
                                            onClick={() => onOpen("userProfile", { userId: member.userId })}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-700/30 transition group"
                                        >
                                            <div className="relative">
                                                <div className="h-8 w-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-semibold">
                                                    {member.user?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2B2D31] ${statusColors[member.user?.status] || "bg-gray-500"}`} />
                                            </div>
                                            <span className="text-sm font-medium text-[#b5bac1] truncate group-hover:text-[#dbdee1]">
                                                {member.user?.username || "Bilinmeyen"}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <VoiceStatusPanel />
        </div>
    )
}
