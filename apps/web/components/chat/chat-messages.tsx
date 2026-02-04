"use client";

import { Fragment, useRef, ElementRef } from "react";
import { format } from "date-fns";
import { Loader2, ServerCrash, Edit, Trash } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";

type MessageWithMember = {
    id: string;
    content: string;
    fileUrl?: string | null;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
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
}: ChatMessagesProps) => {
    const queryKey = `chat:${chatId}`;
    const addKey = `chat:${chatId}:messages`;
    const { onOpen } = useModal();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useChatQuery({
        queryKey,
        apiUrl: apiUrl, // Already partial path usually
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
    })

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
                        {group.items.map((message: MessageWithMember) => (
                            <div key={message.id} className="group flex items-start gap-x-4 p-4 hover:bg-black/5 dark:hover:bg-[#2e3035]/50 transition w-full relative">
                                <div className="flex flex-col w-full">
                                    <div className="flex items-center gap-x-2">
                                        <p className="font-semibold text-sm hover:underline cursor-pointer text-white">
                                            {message.member?.user?.username || "Bilinmeyen Kullanıcı"}
                                        </p>
                                        <span className="text-xs text-[#b5bac1]">
                                            {format(new Date(message.createdAt), "d MMM yyyy, HH:mm")}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${message.deleted ? "italic text-[#b5bac1] text-xs mt-1" : "text-[#dbdee1]"}`}>
                                        {message.content}
                                        {message.updatedAt !== message.createdAt && !message.deleted && (
                                            <span className="text-[10px] mx-2 text-[#b5bac1]">
                                                (düzenlendi)
                                            </span>
                                        )}
                                    </p>
                                    {message.fileUrl && (
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
                                </div>
                                {canModify(message) && (
                                    <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-[#1e1f22] border dark:border-zinc-800 rounded-sm shadow-xl">
                                        {isOwner(message) && (
                                            <button
                                                onClick={() => onOpen("editMessage", {
                                                    apiUrl: `${apiUrl}`,
                                                    message
                                                })}
                                                className="cursor-pointer ml-auto hover:text-white transition text-[#b5bac1]"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onOpen("deleteMessage", {
                                                apiUrl: `${apiUrl}`,
                                                message
                                            })}
                                            className="cursor-pointer ml-auto hover:text-rose-500 transition text-[#b5bac1]"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </Fragment>
                ))}
            </div>
            <div ref={bottomRef} />
        </div>
    )
}
