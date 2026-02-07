"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useModal } from "@/hooks/use-modal-store";

export default function DMListPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { onOpen } = useModal();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, convRes] = await Promise.all([
                    api.get("/auth/me"),
                    api.get("/conversations"),
                ]);
                setCurrentUser(userRes.data);
                setConversations(convRes.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getOtherUser = (conv: any) => {
        return conv.participants?.find((p: any) => p.userId !== currentUser?.id)?.user;
    };

    const statusColors: Record<string, string> = {
        ONLINE: "bg-green-500",
        IDLE: "bg-yellow-500",
        DND: "bg-red-500",
        INVISIBLE: "bg-gray-500",
        OFFLINE: "bg-gray-500",
    };

    return (
        <div className="flex h-full">
            {/* DM Sidebar */}
            <div className="w-60 bg-[#2B2D31] flex flex-col h-full">
                <div className="p-3">
                    <button
                        onClick={() => onOpen("search")}
                        className="w-full bg-[#1E1F22] rounded-md px-3 py-1.5 text-sm text-[#72767d] text-left hover:bg-[#1a1b1e] transition"
                    >
                        Sohbet bul veya başlat
                    </button>
                </div>

                <div className="px-2 mb-2">
                    <button
                        onClick={() => onOpen("search")}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#383a40] transition text-[#b5bac1] hover:text-[#dbdee1]"
                    >
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-medium">Arkadaş Bul</span>
                    </button>
                </div>

                <div className="px-3 mb-1">
                    <p className="text-[11px] uppercase font-semibold text-[#72767d] tracking-wide">
                        Direkt Mesajlar
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                    {conversations.map((conv) => {
                        const otherUser = getOtherUser(conv);
                        if (!otherUser) return null;
                        const lastMsg = conv.messages?.[0];

                        return (
                            <button
                                key={conv.id}
                                onClick={() => router.push(`/channels/@me/${conv.id}`)}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#383a40] transition group"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                                        {otherUser.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2B2D31] ${statusColors[otherUser.status] || "bg-gray-500"}`} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-[#b5bac1] group-hover:text-[#dbdee1] truncate">
                                        {otherUser.username}
                                    </p>
                                    {lastMsg && (
                                        <p className="text-xs text-[#72767d] truncate">
                                            {lastMsg.content}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {!loading && conversations.length === 0 && (
                        <div className="text-center py-8 px-4">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-[#72767d] opacity-50" />
                            <p className="text-xs text-[#72767d]">Henüz sohbet yok</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 bg-[#313338] flex flex-col items-center justify-center">
                <MessageSquare className="h-16 w-16 text-[#72767d] opacity-30 mb-4" />
                <p className="text-[#72767d] text-lg font-medium">Direkt Mesajlarına Hoş Geldin</p>
                <p className="text-[#72767d] text-sm mt-1">Bir sohbet seçerek mesajlaşmaya başla</p>
            </div>
        </div>
    );
}
