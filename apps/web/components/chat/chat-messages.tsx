"use client";

import { Fragment, useRef, ElementRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, ServerCrash, Edit, Trash, Smile, Pin, Reply, CornerUpRight } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";
import EmojiPicker from "emoji-picker-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { api } from "@/lib/api";

type MessageWithMember = {
    id: string;
    content: string;
    fileUrl?: string | null;
    deleted: boolean;
    pinned?: boolean;
    createdAt: string;
    updatedAt: string;
    replyTo?: {
        id: string;
        content: string;
        member?: {
            user?: {
                id: string;
                username: string;
            }
        }
    } | null;
    reactions?: {
        id: string;
        emoji: string;
        userId: string;
        user?: {
            id: string;
            username: string;
        }
    }[];
    member: {
        id: string;
        role: string;
        userId: string;
        user: {
            id: string;
            username: string;
            email: string;
        }
    }
}

interface ChatMessagesProps {
    name: string;
    member: any;
    chatId: string;
    apiUrl: string;
    socketUrl: string;
    socketQuery: Record<string, string>;
    paramKey: "channelId" | "conversationId";
    paramValue: string;
    type: "channel" | "conversation";
    onReplySelect?: (message: any) => void;
}

export const ChatMessages = ({
    name,
    member,
    chatId,
    apiUrl,
    socketUrl,
    socketQuery,
    paramKey,
    paramValue,
    type,
    onReplySelect,
}: ChatMessagesProps) => {
    const queryKey = `chat:${chatId}`;
    const addKey = `chat:${chatId}:messages`;
    const { onOpen } = useModal();
    const { socket } = useSocket();
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;
        socket.emit("join-channel", { channelId: chatId });
    }, [socket, chatId]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useChatQuery({
        queryKey,
        apiUrl: apiUrl,
        paramKey,
        paramValue,
    });

    useChatSocket({ queryKey, addKey, updateKey: `chat:${chatId}:messages:update` });
    const chatRef = useRef<ElementRef<"div">>(null);
    const bottomRef = useRef<ElementRef<"div">>(null);

    useChatScroll({
        chatRef,
        bottomRef,
        loadMore: fetchNextPage,
        shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
        count: data?.pages?.[0]?.items?.length ?? 0
    });

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!socket) return;
        socket.emit("toggle-reaction", {
            messageId,
            emoji,
            channelId: chatId,
        });
        setEmojiPickerMsgId(null);
    };

    const handlePin = async (messageId: string) => {
        try {
            await api.patch(`/messages/${messageId}/pin`);
        } catch (e) {
            console.error(e);
        }
    };

    // Group reactions by emoji
    const groupReactions = (reactions: any[] = []) => {
        const grouped: Record<string, { emoji: string; count: number; users: string[]; userIds: string[] }> = {};
        for (const r of reactions) {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], userIds: [] };
            }
            grouped[r.emoji].count++;
            grouped[r.emoji].users.push(r.user?.username || "");
            grouped[r.emoji].userIds.push(r.userId);
        }
        return Object.values(grouped);
    };

    if (status === "pending") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 className="h-7 w-7 text-[#b5bac1] animate-spin my-4" />
                <p className="text-xs text-[#b5bac1]">Mesajlar yükleniyor...</p>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <ServerCrash className="h-7 w-7 text-[#b5bac1] my-4" />
                <p className="text-xs text-[#b5bac1]">Bir şeyler ters gitti!</p>
            </div>
        )
    }

    const isOwner = (message: MessageWithMember) => message.member?.userId === member?.userId;
    const isAdmin = member?.role === "ADMIN";
    const isModerator = member?.role === "MODERATOR";
    const canModify = (message: MessageWithMember) => !message.deleted && (isOwner(message) || isAdmin || isModerator);
    const canPin = isAdmin || isModerator;

    const roleColors: Record<string, string> = {
        ADMIN: "text-red-400",
        MODERATOR: "text-indigo-400",
        GUEST: "text-white",
    };

    return (
        <div className="flex-1 flex flex-col py-4 overflow-y-auto" ref={chatRef}>
            {!hasNextPage && <div className="flex-1" />}
            {!hasNextPage && (
                <div className="flex flex-col items-center justify-center mb-4 px-4 text-center">
                    <div className="h-20 w-20 rounded-full bg-[#404249] flex items-center justify-center mb-4">
                        <span className="text-4xl text-white">#</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">
                        #{name} kanalına hoş geldin!
                    </p>
                    <p className="text-[#b5bac1]">
                        Bu, #{name} kanalının başlangıcıdır.
                    </p>
                </div>
            )}
            {hasNextPage && (
                <div className="flex justify-center">
                    {isFetchingNextPage ? (
                        <Loader2 className="h-6 w-6 text-[#b5bac1] animate-spin my-4" />
                    ) : (
                        <button
                            onClick={() => fetchNextPage()}
                            className="text-[#b5bac1] hover:text-[#dbdee1] text-xs my-4 transition"
                        >
                            Önceki mesajları yükle
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col-reverse mt-auto">
                {data?.pages?.map((group, i) => (
                    <Fragment key={i}>
                        {group.items.map((message: MessageWithMember) => {
                            const reactions = groupReactions(message.reactions);
                            return (
                                <div key={message.id} className="group flex items-start gap-x-3 px-4 py-1 hover:bg-[#2e3035]/50 transition w-full relative">
                                    {/* Avatar */}
                                    <button
                                        onClick={() => onOpen("userProfile", { userId: message.member?.userId })}
                                        className="flex-shrink-0 mt-1"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold hover:opacity-80 transition">
                                            {message.member?.user?.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    </button>

                                    <div className="flex flex-col w-full min-w-0">
                                        {/* Reply indicator */}
                                        {message.replyTo && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] mb-0.5 ml-1">
                                                <CornerUpRight className="h-3 w-3" />
                                                <span className="font-medium text-indigo-400">
                                                    @{message.replyTo.member?.user?.username || "kullanıcı"}
                                                </span>
                                                <span className="truncate max-w-[300px] opacity-70">
                                                    {message.replyTo.content}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-x-2">
                                            <button
                                                onClick={() => onOpen("userProfile", { userId: message.member?.userId })}
                                                className={`font-semibold text-sm hover:underline cursor-pointer ${roleColors[message.member?.role] || "text-white"}`}
                                            >
                                                {message.member?.user?.username || "Bilinmeyen Kullanıcı"}
                                            </button>
                                            {message.member?.role === "ADMIN" && (
                                                <span className="text-[10px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded font-medium">
                                                    ADMIN
                                                </span>
                                            )}
                                            {message.member?.role === "MODERATOR" && (
                                                <span className="text-[10px] px-1 py-0.5 bg-indigo-500/20 text-indigo-400 rounded font-medium">
                                                    MOD
                                                </span>
                                            )}
                                            <span className="text-xs text-[#72767d]">
                                                {format(new Date(message.createdAt), "d MMM yyyy, HH:mm")}
                                            </span>
                                            {message.pinned && (
                                                <Pin className="h-3 w-3 text-yellow-500" />
                                            )}
                                        </div>

                                        <p className={`text-sm ${message.deleted ? "italic text-[#72767d] text-xs mt-1" : "text-[#dbdee1]"}`}>
                                            {message.content}
                                            {message.updatedAt !== message.createdAt && !message.deleted && (
                                                <span className="text-[10px] mx-2 text-[#72767d]">
                                                    (düzenlendi)
                                                </span>
                                            )}
                                        </p>

                                        {message.fileUrl && !message.deleted && (
                                            <a
                                                href={message.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative aspect-square rounded-md mt-2 overflow-hidden border border-zinc-700 flex items-center bg-[#2b2d31] h-48 w-48"
                                            >
                                                <img
                                                    src={message.fileUrl}
                                                    alt="Dosya eki"
                                                    className="object-cover"
                                                />
                                            </a>
                                        )}

                                        {/* Reactions */}
                                        {reactions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {reactions.map((r) => (
                                                    <button
                                                        key={r.emoji}
                                                        onClick={() => handleReaction(message.id, r.emoji)}
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition ${
                                                            r.userIds.includes(member?.userId)
                                                                ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300"
                                                                : "bg-[#2b2d31] hover:bg-[#383a40] text-[#b5bac1] border border-transparent"
                                                        }`}
                                                        title={r.users.join(", ")}
                                                    >
                                                        <span>{r.emoji}</span>
                                                        <span>{r.count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    {!message.deleted && (
                                        <div className="hidden group-hover:flex items-center gap-x-0.5 absolute p-0.5 -top-3 right-4 bg-[#1e1f22] border border-zinc-800 rounded shadow-xl z-10">
                                            {/* Emoji reaction */}
                                            <Popover
                                                open={emojiPickerMsgId === message.id}
                                                onOpenChange={(open) => setEmojiPickerMsgId(open ? message.id : null)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <button className="p-1.5 hover:bg-[#383a40] rounded transition text-[#b5bac1] hover:text-[#dbdee1]">
                                                        <Smile className="h-4 w-4" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    side="top"
                                                    className="bg-transparent border-none shadow-none drop-shadow-none p-0"
                                                >
                                                    <EmojiPicker
                                                        onEmojiClick={(data) => handleReaction(message.id, data.emoji)}
                                                        theme={"dark" as any}
                                                        height={350}
                                                        width={300}
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            {/* Reply */}
                                            {onReplySelect && (
                                                <button
                                                    onClick={() => onReplySelect(message)}
                                                    className="p-1.5 hover:bg-[#383a40] rounded transition text-[#b5bac1] hover:text-[#dbdee1]"
                                                    title="Yanıtla"
                                                >
                                                    <Reply className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Pin */}
                                            {canPin && (
                                                <button
                                                    onClick={() => handlePin(message.id)}
                                                    className={`p-1.5 hover:bg-[#383a40] rounded transition ${message.pinned ? "text-yellow-500" : "text-[#b5bac1] hover:text-[#dbdee1]"}`}
                                                    title={message.pinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
                                                >
                                                    <Pin className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Edit */}
                                            {isOwner(message) && (
                                                <button
                                                    onClick={() => onOpen("editMessage", {
                                                        apiUrl: `${apiUrl}`,
                                                        message
                                                    })}
                                                    className="p-1.5 hover:bg-[#383a40] rounded transition text-[#b5bac1] hover:text-[#dbdee1]"
                                                    title="Düzenle"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Delete */}
                                            {canModify(message) && (
                                                <button
                                                    onClick={() => onOpen("deleteMessage", {
                                                        apiUrl: `${apiUrl}`,
                                                        message
                                                    })}
                                                    className="p-1.5 hover:bg-[#383a40] rounded transition text-[#b5bac1] hover:text-rose-500"
                                                    title="Sil"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
            <div ref={bottomRef} />
        </div>
    )
}
