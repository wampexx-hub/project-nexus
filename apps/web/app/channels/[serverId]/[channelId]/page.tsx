"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChannelCallPanel } from "@/components/voice/channel-call-panel";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";

export default function ChannelIdPage() {
    const params = useParams();
    const unwrappedParams = params as { serverId: string; channelId: string };

    const [channel, setChannel] = useState<any>(null);
    const [member, setMember] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [replyTo, setReplyTo] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchChannelData = async () => {
            try {
                if (!unwrappedParams) return;

                const userRes = await api.get("/auth/me");
                setUser(userRes.data);

                const res = await api.get(`/servers/${unwrappedParams.serverId}`);
                const server = res.data;

                const ch = server.channels.find((c: any) => c.id === unwrappedParams.channelId);

                if (ch) {
                    setChannel(ch);
                    const currentMember = server.members?.find((m: any) => m.userId === userRes.data.id);
                    setMember(currentMember || { id: "current-member", role: "ADMIN", userId: userRes.data.id });
                }
            } catch (e: any) {
                console.error("Error in fetchChannelData:", e);
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

    const isVoiceChannel = channel.type === "AUDIO" || channel.type === "VIDEO";

    return (
        <div className="bg-[#313338] flex flex-col h-[calc(100vh-48px)] md:h-[calc(100vh-0px)] shadow-inner">
            <ChatHeader
                name={channel.name}
                serverId={unwrappedParams?.serverId || ""}
                type="channel"
                channelType={channel.type}
                channelId={channel.id}
            />
            <ChannelCallPanel
                channelId={channel.id}
                channelName={channel.name}
                serverId={unwrappedParams?.serverId || ""}
                username={user?.username || "User"}
                userImageUrl={user?.imageUrl}
                userId={user?.id || "unknown"}
                autoJoin={isVoiceChannel}
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
                onReplySelect={(msg) => setReplyTo(msg)}
            />
            <ChatInput
                name={channel.name}
                type="channel"
                apiUrl="/api/socket/messages"
                query={{
                    channelId: channel.id,
                    serverId: unwrappedParams?.serverId || "",
                }}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
            />
        </div>
    );
}
