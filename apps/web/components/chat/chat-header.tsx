"use client";

import { Hash, Volume2, Search, Pin } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

interface ChatHeaderProps {
    serverId: string;
    name: string;
    type: "channel" | "conversation";
    imageUrl?: string;
    channelType?: "TEXT" | "AUDIO" | "VIDEO";
    channelId?: string;
}

export const ChatHeader = ({
    serverId,
    name,
    type,
    imageUrl,
    channelType = "TEXT",
    channelId,
}: ChatHeaderProps) => {
    const isVoiceChannel = channelType === "AUDIO" || channelType === "VIDEO";
    const { onOpen } = useModal();

    return (
        <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 w-full bg-[#313338]">
            {isVoiceChannel ? (
                <Volume2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mr-2" />
            ) : (
                <Hash className="h-5 w-5 text-zinc-500 dark:text-zinc-400 mr-2" />
            )}
            <p className="font-semibold text-md text-black dark:text-white">
                {name}
            </p>
            {isVoiceChannel && (
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Ses Kanalı
                </span>
            )}

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-x-1">
                {channelId && (
                    <button
                        onClick={() => onOpen("pinnedMessages", { channelId })}
                        className="p-2 hover:bg-[#383a40] rounded-md transition text-[#b5bac1] hover:text-[#dbdee1]"
                        title="Sabitlenmiş Mesajlar"
                    >
                        <Pin className="h-5 w-5" />
                    </button>
                )}
                <button
                    onClick={() => onOpen("search")}
                    className="p-2 hover:bg-[#383a40] rounded-md transition text-[#b5bac1] hover:text-[#dbdee1]"
                    title="Ara"
                >
                    <Search className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
