"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { redirect } from "next/navigation";

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
    const [member, setMember] = useState<any>(null); // Current user member info

    useEffect(() => {
        // Fetch channel details to confirm it exists and get name
        const fetchChannel = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return redirect("/login");

            try {
                // We reuse servers API or create channels API. 
                // For MVP, since we don't have GET /channels/:id, we can fetch server and find channel.
                // Or implement GET /api/channels/:id.
                // I'll assume we need to implement GET /api/channels/:id or fetch server.
                // Let's fetch server and filter for now as it's easier without backend changes.

                const res = await fetch(`http://localhost:3001/api/servers/${params.serverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const server = await res.json();
                    const ch = server.channels.find((c: any) => c.id === Number(params.channelId) || c.id === params.channelId); // Handle string/number mismatch
                    if (ch) {
                        setChannel(ch);
                        // Set mock member for now
                        setMember({ id: "mock_member_id", role: "ADMIN" });
                    } else {
                        redirect(`/channels/${params.serverId}`);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchChannel();
    }, [params.channelId, params.serverId]);

    if (!channel || !member) {
        return <div className="h-full flex items-center justify-center">Loading Channel...</div>
    }

    return (
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
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
                apiUrl="/api/messages"
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
