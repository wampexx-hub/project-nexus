"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, ServerCrash, Smile, Plus, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useSocket } from "@/components/providers/socket-provider";
import EmojiPicker from "emoji-picker-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useInfiniteQuery } from "@tanstack/react-query";

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params?.conversationId as string;
    const router = useRouter();
    const { socket } = useSocket();

    const [conversation, setConversation] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [content, setContent] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [localMessages, setLocalMessages] = useState<any[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, convRes] = await Promise.all([
                    api.get("/auth/me"),
                    api.get(`/conversations/${conversationId}`),
                ]);
                setCurrentUser(userRes.data);
                setConversation(convRes.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [conversationId]);

    // Join conversation room
    useEffect(() => {
        if (!socket || !conversationId) return;
        socket.emit("join-conversation", { conversationId });
    }, [socket, conversationId]);

    // Listen for new messages
    useEffect(() => {
        if (!socket || !conversationId) return;
        const eventKey = `dm:${conversationId}:messages`;
        const handler = (msg: any) => {
            setLocalMessages(prev => [msg, ...prev]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };
        socket.on(eventKey, handler);
        return () => { socket.off(eventKey, handler); };
    }, [socket, conversationId]);

    // Fetch messages
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
        queryKey: ["dm-messages", conversationId],
        queryFn: async ({ pageParam }) => {
            const url = pageParam
                ? `/conversations/${conversationId}/messages?cursor=${pageParam}`
                : `/conversations/${conversationId}/messages`;
            const res = await api.get(url);
            return res.data;
        },
        getNextPageParam: (lastPage: any) => lastPage?.nextCursor,
        initialPageParam: undefined as string | undefined,
        enabled: !!conversationId,
    });

    const handleSend = async () => {
        if (!content.trim() || !socket) return;
        socket.emit("send-dm", { content: content.trim(), conversationId });
        setContent("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const otherUser = conversation?.participants?.find(
        (p: any) => p.userId !== currentUser?.id
    )?.user;

    const statusColors: Record<string, string> = {
        ONLINE: "bg-green-500",
        IDLE: "bg-yellow-500",
        DND: "bg-red-500",
        INVISIBLE: "bg-gray-500",
        OFFLINE: "bg-gray-500",
    };

    if (!conversation || !currentUser) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center bg-[#313338] h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="mt-4 text-zinc-400 text-sm">Yükleniyor...</p>
            </div>
        );
    }

    // Combine fetched and local messages
    const fetchedMessages = data?.pages?.flatMap(p => p.items) || [];
    const allMessages = [...localMessages, ...fetchedMessages.filter(
        fm => !localMessages.find(lm => lm.id === fm.id)
    )];

    return (
        <div className="flex h-full">
            {/* DM Sidebar - simplified */}
            <div className="w-60 bg-[#2B2D31] flex flex-col h-full">
                <div className="p-3">
                    <button
                        onClick={() => router.push("/channels/@me")}
                        className="w-full bg-[#1E1F22] rounded-md px-3 py-1.5 text-sm text-[#72767d] text-left hover:bg-[#1a1b1e] transition flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Geri Dön
                    </button>
                </div>
                <div className="px-3 mb-1">
                    <p className="text-[11px] uppercase font-semibold text-[#72767d] tracking-wide">
                        Direkt Mesajlar
                    </p>
                </div>
                {otherUser && (
                    <div className="px-2">
                        <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-[#383a40]">
                            <div className="relative flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                                    {otherUser.username?.[0]?.toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2B2D31] ${statusColors[otherUser.status] || "bg-gray-500"}`} />
                            </div>
                            <span className="text-sm font-medium text-white truncate">{otherUser.username}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-[#313338] flex flex-col h-full">
                {/* Header */}
                <div className="h-12 border-b border-[#1E1F22] flex items-center px-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                            {otherUser?.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{otherUser?.username}</span>
                        <div className={`h-2 w-2 rounded-full ${statusColors[otherUser?.status] || "bg-gray-500"}`} />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto flex flex-col-reverse py-4 px-4">
                    <div ref={bottomRef} />
                    {allMessages.map((msg: any) => (
                        <div key={msg.id} className="flex items-start gap-3 py-1 hover:bg-[#2e3035]/50 rounded-md px-2 transition">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 mt-0.5">
                                {msg.user?.username?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-white">
                                        {msg.user?.username || "Bilinmeyen"}
                                    </span>
                                    <span className="text-xs text-[#72767d]">
                                        {format(new Date(msg.createdAt), "d MMM yyyy, HH:mm")}
                                    </span>
                                </div>
                                <p className={`text-sm ${msg.deleted ? "italic text-[#72767d]" : "text-[#dbdee1]"}`}>
                                    {msg.content}
                                </p>
                            </div>
                        </div>
                    ))}

                    {hasNextPage && (
                        <div className="flex justify-center py-4">
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="text-sm text-[#b5bac1] hover:text-white transition"
                            >
                                {isFetchingNextPage ? "Yükleniyor..." : "Önceki mesajları yükle"}
                            </button>
                        </div>
                    )}

                    {status === "pending" && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#b5bac1]" />
                        </div>
                    )}

                    {!hasNextPage && allMessages.length > 0 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-[#72767d]">Sohbetin başlangıcı</p>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 flex-shrink-0">
                    <div className="relative">
                        <input
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`@${otherUser?.username || "kullanıcı"} adlı kişiye mesaj gönder`}
                            className="w-full bg-[#383a40] rounded-lg px-4 py-3 text-sm text-[#dbdee1] border-none focus:outline-none focus:ring-0 pr-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Popover open={showEmoji} onOpenChange={setShowEmoji}>
                                <PopoverTrigger asChild>
                                    <button type="button">
                                        <Smile className="h-5 w-5 text-[#b5bac1] hover:text-[#dbdee1] transition" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="bg-transparent border-none shadow-none p-0">
                                    <EmojiPicker
                                        onEmojiClick={(data) => {
                                            setContent(prev => prev + data.emoji);
                                            setShowEmoji(false);
                                        }}
                                        theme={"dark" as any}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
