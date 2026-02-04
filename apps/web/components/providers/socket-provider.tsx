"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import { io as ClientIO } from "socket.io-client";

type SocketContextType = {
    socket: any | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children
}: {
    children: React.ReactNode
}) => {
    const [socket, setSocket] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            console.log("No token found, socket will not connect");
            return;
        }

        // Connect to backend socket with namespace
        // In development, connect directly to backend
        // In production, use the same origin with rewrite
        const isDev = process.env.NODE_ENV === "development";
        const socketUrl = isDev ? "http://localhost:3001" : "";

        console.log("Connecting to socket at:", socketUrl || "same origin", "with namespace /api/socket/messages");

        const socketInstance = new (ClientIO as any)(`${socketUrl}/api/socket/messages`, {
            path: "/socket.io",
            addTrailingSlash: false,
            auth: {
                token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            forceNew: true,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            console.log("Socket connected with ID:", socketInstance.id);
        });

        socketInstance.on("disconnect", (reason: string) => {
            setIsConnected(false);
            console.log("Socket disconnected:", reason);
        });

        socketInstance.on("connect_error", (error: Error) => {
            console.error("Socket connection error:", error.message);
            console.error("Full error:", error);
            setIsConnected(false);
        });

        socketInstance.on("reconnect", (attemptNumber: number) => {
            console.log("Socket reconnected after", attemptNumber, "attempts");
            setIsConnected(true);
        });

        socketInstance.on("reconnect_error", (error: Error) => {
            console.error("Socket reconnection error:", error.message);
        });

        socketInstance.on("reconnect_failed", () => {
            console.error("Socket reconnection failed after all attempts");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        }
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
