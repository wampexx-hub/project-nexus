import { Hash, Volume2 } from "lucide-react";

interface ChatHeaderProps {
    serverId: string;
    name: string;
    type: "channel" | "conversation";
    imageUrl?: string;
    channelType?: "TEXT" | "AUDIO" | "VIDEO";
}

export const ChatHeader = ({
    serverId,
    name,
    type,
    imageUrl,
    channelType = "TEXT"
}: ChatHeaderProps) => {
    const isVoiceChannel = channelType === "AUDIO" || channelType === "VIDEO";

    return (
        <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 w-full">
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
        </div>
    )
}
