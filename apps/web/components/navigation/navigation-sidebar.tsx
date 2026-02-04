"use client";

import { useEffect, useState } from "react";
import { NavigationAction } from "./navigation-action";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { api } from "@/lib/api";

const NavigationSidebar = () => {
    const [servers, setServers] = useState<any[]>([]);

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
            <NavigationAction />
            <Separator
                className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
            />
            <ScrollArea className="flex-1 w-full">
                {servers.map((server) => (
                    <div key={server.id} className="mb-4">
                        <NavigationItem
                            id={server.id}
                            name={server.name}
                            imageUrl={server.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                        />
                    </div>
                ))}
            </ScrollArea>
        </div>
    )
}

export default NavigationSidebar;
