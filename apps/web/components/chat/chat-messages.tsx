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
        apiUrl,
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
                <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading messages...</p>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Something went wrong!</p>
            </div>
        )
    }

    const isOwner = (message: MessageWithMember) => message.member.userId === member?.userId;
    const isAdmin = member?.role === "ADMIN";
    const isModerator = member?.role === "MODERATOR";
    const canModify = (message: MessageWithMember) => !message.deleted && (isOwner(message) || isAdmin || isModerator);

    return (
        <div className="flex-1 flex flex-col py-4 overflow-y-auto" ref={chatRef}>
            {!hasNextPage && <div className="flex-1" />}
            {!hasNextPage && (
                <div className="flex flex-col items-center justify-center mb-4">
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Welcome to #{name}!
                    </p>
                </div>
            )}
            {hasNextPage && (
                <div className="flex justify-center">
                    {isFetchingNextPage ? (
                        <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
                    ) : (
                        <button
                            onClick={() => fetchNextPage()}
                            className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition"
                        >
                            Load previous messages
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col-reverse mt-auto">
                {data?.pages?.map((group, i) => (
                    <Fragment key={i}>
                        {group.items.map((message: MessageWithMember) => (
                            <div key={message.id} className="group flex items-start gap-x-4 p-4 hover:bg-black/5 dark:hover:bg-zinc-700/10 transition w-full">
                                <div className="flex flex-col w-full">
                                    <div className="flex items-center gap-x-2">
                                        <p className="font-semibold text-sm hover:underline cursor-pointer">
                                            {message.member?.user?.username || "Unknown"}
                                        </p>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {format(new Date(message.createdAt), "d MMM yyyy, HH:mm")}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${message.deleted ? "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1" : "text-zinc-600 dark:text-zinc-300"}`}>
                                        {message.content}
                                        {message.updatedAt !== message.createdAt && !message.deleted && (
                                            <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                                                (edited)
                                            </span>
                                        )}
                                    </p>
                                    {message.fileUrl && (
                                        <a
                                            href={message.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
                                        >
                                            <img
                                                src={message.fileUrl}
                                                alt="Message attachment"
                                                className="object-cover"
                                            />
                                        </a>
                                    )}
                                </div>
                                {canModify(message) && (
                                    <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
                                        {isOwner(message) && (
                                            <button
                                                onClick={() => onOpen("editMessage", {
                                                    apiUrl: `${apiUrl}`,
                                                    message
                                                })}
                                                className="cursor-pointer ml-auto hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onOpen("deleteMessage", {
                                                apiUrl: `${apiUrl}`,
                                                message
                                            })}
                                            className="cursor-pointer ml-auto hover:text-rose-600 transition"
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
