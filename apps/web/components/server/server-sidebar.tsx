"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, Volume2, ChevronDown, UserPlus, Trash, Hash } from "lucide-react";
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
    const router = useRouter();
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
    // Combine AUDIO and VIDEO channels into voice channels
    const voiceChannels = server.channels?.filter((channel: any) => channel.type === "AUDIO" || channel.type === "VIDEO") || [];

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
                        <Settings className="h-4 w-4 ml-auto" />
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

            <div className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
                {/* Text Channels */}
                {!!textChannels?.length && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between py-2">
                            <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
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
                                        className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
                                    >
                                        <Hash className="flex-shrink-0 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
                                            {channel.name}
                                        </p>
                                    </button>
                                    {/* Show users in voice call for this text channel */}
                                    <VoiceChannelUsers channelId={channel.id} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Voice Channels (AUDIO + VIDEO merged) */}
                {!!voiceChannels?.length && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between py-2">
                            <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
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
                                        "p-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 rounded-md cursor-pointer flex items-center gap-x-2",
                                        currentChannelId === channel.id
                                            ? "bg-zinc-700/20 text-zinc-200"
                                            : "text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    <Volume2 className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{channel.name}</span>
                                </div>
                                <VoiceChannelUsers channelId={channel.id} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <VoiceStatusPanel />
        </div>
    )
}
