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

import { useParams } from "next/navigation";

export default function ChannelIdPage() {
    const params = useParams();
    // params in useParams is a generic object, so safely access properties or use type assertion
    const unwrappedParams = params as { serverId: string; channelId: string };


    const [channel, setChannel] = useState<any>(null);
    const [member, setMember] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchChannelData = async () => {
            try {
                if (!unwrappedParams) {
                    console.log("Params not yet ready");
                    return;
                }

                console.log("Fetching data for params:", unwrappedParams);

                // Fetch user info from token
                const userRes = await api.get("/auth/me");
                console.log("User data:", userRes.data);
                setUser(userRes.data);

                console.log(`Fetching server: /servers/${unwrappedParams.serverId}`);
                const res = await api.get(`/servers/${unwrappedParams.serverId}`);
                console.log("Server data:", res.data);
                const server = res.data;

                const ch = server.channels.find((c: any) => c.id === unwrappedParams.channelId);
                console.log("Found channel:", ch);

                if (ch) {
                    setChannel(ch);
                    // Find the current user's member info
                    const currentMember = server.members?.find((m: any) => m.userId === userRes.data.id);
                    console.log("Found member:", currentMember);
                    setMember(currentMember || { id: "current-member", role: "ADMIN", userId: userRes.data.id });
                } else {
                    console.error("Channel not found in server channels. Redirecting.");
                    console.log("Available channels:", server.channels.map((c: any) => c.id));
                    // router.push(`/channels/${unwrappedParams.serverId}`);
                }
            } catch (e: any) {
                console.error("Error in fetchChannelData:", e);
                if (e.response) {
                    console.error("Response data:", e.response.data);
                    console.error("Response status:", e.response.status);
                }
                // router.push("/login"); // Commented out to see error
            }
        }
        fetchChannelData();
    }, [unwrappedParams, router]);

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
                    serverId={unwrappedParams?.serverId || ""}
                    username={user?.username || "User"}
                    userImageUrl={user?.imageUrl}
                    userId={user?.id || "unknown"}
                />
            </div>
        );
    }

    // Render chat interface for TEXT channels
    return (
        <div className="bg-[#313338] flex flex-col h-[calc(100vh-48px)] md:h-[calc(100vh-0px)] shadow-inner">
            <ChatHeader
                name={channel.name}
                serverId={unwrappedParams?.serverId || ""}
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
                    serverId: unwrappedParams?.serverId || "",
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
                    serverId: unwrappedParams?.serverId || "",
                }}
            />
        </div>
    );
}
