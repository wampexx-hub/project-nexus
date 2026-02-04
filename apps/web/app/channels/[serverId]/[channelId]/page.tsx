"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/voice/media-room";
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
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Fetch channel details to confirm it exists and get name
        const fetchChannel = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return redirect("/login");

            try {
                // Fetch user info from token
                const userRes = await fetch(`http://localhost:3001/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                }

                // Fetch server and find channel
                const res = await fetch(`http://localhost:3001/api/servers/${params.serverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const server = await res.json();
                    const ch = server.channels.find((c: any) => c.id === Number(params.channelId) || c.id === params.channelId); // Handle string/number mismatch
                    if (ch) {
                        setChannel(ch);
                        // Find the current user's member info
                        const currentMember = server.members?.find((m: any) => m.userId === user?.id);
                        setMember(currentMember || { id: "mock_member_id", role: "ADMIN" });
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
        return <div className="h-full flex items-center justify-center dark:text-zinc-400">Loading Channel...</div>
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
