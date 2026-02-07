"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { NavigationAction } from "./navigation-action";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { ActionTooltip } from "@/components/action-tooltip";
import { MessageSquare, Settings, Search } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NavigationSidebar = () => {
    const [servers, setServers] = useState<any[]>([]);
    const router = useRouter();
    const pathname = usePathname();
    const { onOpen } = useModal();
    const isDMActive = pathname?.startsWith("/channels/@me");

    useEffect(() => {
        const fetchServers = async () => {
            try {
                const res = await api.get("/servers");
                setServers(res.data);
            } catch (e) {
                console.error("Failed to fetch servers", e);
            }
        }

        fetchServers();
    }, []);

    return (
        <div
            className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] bg-[#E3E5E8] py-3"
        >
            {/* DM Button - Discord style home button */}
            <ActionTooltip side="right" align="center" label="Direkt Mesajlar">
                <button
                    onClick={() => router.push("/channels/@me")}
                    className="group flex items-center"
                >
                    <div className={cn(
                        "flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center",
                        isDMActive
                            ? "bg-indigo-500 rounded-[16px]"
                            : "bg-[#313338] group-hover:bg-indigo-500"
                    )}>
                        <MessageSquare
                            className={cn(
                                "transition",
                                isDMActive ? "text-white" : "text-[#dbdee1] group-hover:text-white"
                            )}
                            size={24}
                        />
                    </div>
                </button>
            </ActionTooltip>

            <Separator
                className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
            />

            <ScrollArea className="flex-1 w-full">
                {servers.map((server) => (
                    <div key={server.id} className="mb-4">
                        <NavigationItem
                            id={server.id}
                            name={server.name}
                            imageUrl={server.imageUrl || ""}
                        />
                    </div>
                ))}
            </ScrollArea>

            <Separator
                className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
            />

            <NavigationAction />

            {/* Search */}
            <ActionTooltip side="right" align="center" label="Ara">
                <button
                    onClick={() => onOpen("search")}
                    className="group flex items-center"
                >
                    <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-[#313338] group-hover:bg-[#5865F2]">
                        <Search
                            className="text-[#dbdee1] group-hover:text-white transition"
                            size={20}
                        />
                    </div>
                </button>
            </ActionTooltip>

            {/* Settings */}
            <ActionTooltip side="right" align="center" label="Ayarlar">
                <button
                    onClick={() => router.push("/settings")}
                    className="group flex items-center mb-2"
                >
                    <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-[#313338] group-hover:bg-[#5865F2]">
                        <Settings
                            className="text-[#dbdee1] group-hover:text-white transition"
                            size={20}
                        />
                    </div>
                </button>
            </ActionTooltip>
        </div>
    )
}

export default NavigationSidebar;
