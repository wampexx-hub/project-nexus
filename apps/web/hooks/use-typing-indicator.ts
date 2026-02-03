import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface UseTypingIndicatorProps {
    channelId: string;
    userId: string;
}

export const useTypingIndicator = ({ channelId, userId }: UseTypingIndicatorProps) => {
    const { socket } = useSocket();
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!socket) return;

        const handleTyping = (data: { userId: string; username: string }) => {
            if (data.userId !== userId) {
                setTypingUsers((prev) => {
                    if (!prev.includes(data.username)) {
                        return [...prev, data.username];
                    }
                    return prev;
                });

                // Remove after 3 seconds
                setTimeout(() => {
                    setTypingUsers((prev) => prev.filter((u) => u !== data.username));
                }, 3000);
            }
        };

        socket.on(`typing:${channelId}`, handleTyping);

        return () => {
            socket.off(`typing:${channelId}`, handleTyping);
        };
    }, [socket, channelId, userId]);

    const emitTyping = (username: string) => {
        if (socket) {
            socket.emit("typing", { channelId, userId, username });
        }
    };

    return { typingUsers, emitTyping };
};
