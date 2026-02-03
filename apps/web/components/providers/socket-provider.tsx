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

        // Connect to the specific namespace
        const socketInstance = new (ClientIO as any)("http://localhost:3001/api/socket/messages", {
            path: "/socket.io",
            addTrailingSlash: false,
            auth: {
                token
            }
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            console.log("Socket connected");
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
            console.log("Socket disconnected");
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
