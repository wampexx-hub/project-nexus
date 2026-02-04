"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/voice/media-room";
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
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchChannelData = async () => {
            try {
                // Fetch user info from token
                const userRes = await api.get("/auth/me");
                setUser(userRes.data);

                const res = await api.get(`/servers/${params.serverId}`);
                const server = res.data;
                const ch = server.channels.find((c: any) => c.id === params.channelId || c.id === Number(params.channelId));

                if (ch) {
                    setChannel(ch);
                    // Find the current user's member info
                    const currentMember = server.members?.find((m: any) => m.userId === userRes.data.id);
                    setMember(currentMember || { id: "current-member", role: "ADMIN", userId: userRes.data.id });
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

    // Render MediaRoom for AUDIO and VIDEO channels
    if (channel.type === "AUDIO" || channel.type === "VIDEO") {
        return (
            <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
                <MediaRoom
                    channelId={channel.id}
                    channelName={channel.name}
                    channelType={channel.type}
                    serverId={params.serverId}
                    username={user?.username || "User"}
                    userImageUrl={user?.imageUrl}
                    userId={user?.id || "unknown"}
                />
            </div>
        );
    }

    // Render chat interface for TEXT channels
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
