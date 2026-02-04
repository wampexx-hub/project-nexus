"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { redirect, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface ChannelIdPageProps {
    params: {
        serverId: string;
        channelId: string;
    }
}

export default function ChannelIdPage({
    params
}: ChannelIdPageProps) {
    const [channel, setChannel] = useState<any>(null);
    const [member, setMember] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchChannelData = async () => {
            try {
                const res = await api.get(`/servers/${params.serverId}`);
                const server = res.data;
                const ch = server.channels.find((c: any) => c.id === params.channelId);

                // Current user member check
                // For MVP, we use the servers' response which should ideally include member info
                // or we fetch current member. 
                // Let's find the member for current user
                // (This requires knowing current user id, usually available in JWT or via /users/me)
                // For now, let's assume the first member is the user if we don't have /me endpoint
                // but better is to look at data. 
                // Since this is a client component, we'll try to get it.

                if (ch) {
                    setChannel(ch);
                    // In a real app we'd fetch the specific member object
                    setMember({ id: "current-member", role: "ADMIN" });
                } else {
                    router.push(`/channels/${params.serverId}`);
                }
            } catch (e) {
                console.error(e);
                router.push("/login");
            }
        }
        fetchChannelData();
    }, [params.channelId, params.serverId, router]);

    if (!channel || !member) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center bg-[#313338]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                <p className="mt-4 text-zinc-400">Yükleniyor...</p>
            </div>
        )
    }

    return (
        <div className="bg-[#313338] flex flex-col h-full shadow-inner">
            <ChatHeader
                name={channel.name}
                serverId={params.serverId}
                type="channel"
            />
            <ChatMessages
                member={member}
                name={channel.name}
                chatId={channel.id}
                type="channel"
                apiUrl="/messages"
                socketUrl="/api/socket/messages"
                socketQuery={{
                    channelId: channel.id,
                    serverId: params.serverId,
                }}
                paramKey="channelId"
                paramValue={channel.id}
            />
            <ChatInput
                name={channel.name}
                type="channel"
                apiUrl="/api/socket/messages"
                query={{
                    channelId: channel.id,
                    serverId: params.serverId,
                }}
            />
        </div>
    );
}
