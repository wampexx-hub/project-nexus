import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

export const usePresence = (serverId: string) => {
    const { socket } = useSocket();
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!socket || !serverId) return;

        // Join server room for presence
        socket.emit("join-server", { serverId });

        // Listen for presence updates
        socket.on(`presence:${serverId}`, (data: { onlineUsers: string[] }) => {
            setOnlineUsers(data.onlineUsers);
        });

        return () => {
            socket.off(`presence:${serverId}`);
        };
    }, [socket, serverId]);

    return { onlineUsers };
};
