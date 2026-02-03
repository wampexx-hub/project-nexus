"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { Plus, Settings } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, UserPlus, Trash } from "lucide-react";

interface ServerSidebarProps {
    serverId: string;
}

export const ServerSidebar = ({
    serverId
}: ServerSidebarProps) => {
    const [server, setServer] = useState<any>(null);
    const router = useRouter();
    const { onOpen } = useModal();

    useEffect(() => {
        const fetchServer = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            try {
                const res = await fetch(`http://localhost:3001/api/servers/${serverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setServer(data);
                } else {
                    if (res.status === 404) redirect("/channels");
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchServer();
    }, [serverId]);

    if (!server) {
        return <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5] items-center justify-center">Loading...</div>
    }

    const textChannels = server.channels?.filter((channel: any) => channel.type === "TEXT") || [];
    const audioChannels = server.channels?.filter((channel: any) => channel.type === "AUDIO") || [];

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
                    className="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-[2px]"
                >
                    <DropdownMenuItem
                        onClick={() => onOpen("invite", { server })}
                        className="text-indigo-600 dark:text-indigo-400 px-3 py-2 text-sm cursor-pointer"
                    >
                        Invite People
                        <UserPlus className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onOpen("members", { server })}
                        className="px-3 py-2 text-sm cursor-pointer"
                    >
                        Manage Members
                        <Settings className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onOpen("editServer", { server })}
                        className="px-3 py-2 text-sm cursor-pointer"
                    >
                        Server Settings
                        <Settings className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
                    >
                        Delete Server
                        <Trash className="h-4 w-4 ml-auto" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 px-3 py-2">
                {!!textChannels?.length && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between py-2">
                            <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                                Text Channels
                            </p>
                            <button
                                onClick={() => onOpen("createChannel")}
                                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {textChannels.map((channel: any) => (
                            <div
                                key={channel.id}
                                onClick={() => router.push(`/channels/${serverId}/${channel.id}`)}
                                className="p-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 rounded-md cursor-pointer text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 flex items-center gap-x-2"
                            >
                                <span>#</span>
                                <div>{channel.name}</div>
                            </div>
                        ))}
                    </div>
                )}
                {!!audioChannels?.length && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between py-2">
                            <p className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                                Voice Channels
                            </p>
                            <button
                                onClick={() => onOpen("createChannel")}
                                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {audioChannels.map((channel: any) => (
                            <div
                                key={channel.id}
                                className="p-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 rounded-md cursor-pointer text-zinc-600 dark:text-zinc-400"
                            >
                                🔊 {channel.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
