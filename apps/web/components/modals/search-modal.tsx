"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Hash, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";

export const SearchModal = () => {
    const { isOpen, onClose, type } = useModal();
    const isModalOpen = isOpen && type === "search";
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [userResults, setUserResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"messages" | "users">("messages");
    const router = useRouter();

    useEffect(() => {
        if (!isModalOpen) {
            setQuery("");
            setResults([]);
            setUserResults([]);
        }
    }, [isModalOpen]);

    const handleSearch = async () => {
        if (query.length < 2) return;
        setLoading(true);
        try {
            if (activeTab === "messages") {
                const res = await api.get(`/search/messages?q=${encodeURIComponent(query)}`);
                setResults(res.data);
            } else {
                const res = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
                setUserResults(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) handleSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [query, activeTab]);

    const navigateToMessage = (msg: any) => {
        onClose();
        router.push(`/channels/${msg.channel?.serverId}/${msg.channelId}`);
    };

    const startDM = async (userId: string) => {
        try {
            const res = await api.post("/conversations", { targetUserId: userId });
            onClose();
            router.push(`/channels/@me/${res.data.id}`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-white overflow-hidden p-0 max-w-lg">
                <DialogHeader className="pt-6 px-6">
                    <DialogTitle className="text-xl font-bold text-center">Ara</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b5bac1]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Mesaj veya kullanıcı ara..."
                            className="w-full pl-10 pr-4 py-3 bg-[#1E1F22] rounded-md text-sm text-[#dbdee1] border-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setActiveTab("messages")}
                            className={`px-3 py-1.5 rounded-md text-sm transition ${activeTab === "messages" ? "bg-indigo-500 text-white" : "text-[#b5bac1] hover:bg-[#383a40]"}`}
                        >
                            Mesajlar
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`px-3 py-1.5 rounded-md text-sm transition ${activeTab === "users" ? "bg-indigo-500 text-white" : "text-[#b5bac1] hover:bg-[#383a40]"}`}
                        >
                            Kullanıcılar
                        </button>
                    </div>

                    <div className="mt-4 max-h-80 overflow-y-auto space-y-1">
                        {loading && (
                            <div className="text-center py-8 text-[#b5bac1] text-sm">Aranıyor...</div>
                        )}

                        {!loading && activeTab === "messages" && results.map((msg) => (
                            <button
                                key={msg.id}
                                onClick={() => navigateToMessage(msg)}
                                className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-[#383a40] transition text-left"
                            >
                                <Hash className="h-4 w-4 text-[#b5bac1] mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-indigo-400">{msg.channel?.name}</span>
                                        <span className="text-xs text-[#72767d]">
                                            {format(new Date(msg.createdAt), "d MMM yyyy")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#dbdee1] truncate">{msg.content}</p>
                                    <p className="text-xs text-[#72767d]">
                                        {msg.member?.user?.username}
                                    </p>
                                </div>
                            </button>
                        ))}

                        {!loading && activeTab === "users" && userResults.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => startDM(user.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-[#383a40] transition text-left"
                            >
                                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#dbdee1]">{user.username}</p>
                                    {user.customStatus && (
                                        <p className="text-xs text-[#72767d]">{user.customStatus}</p>
                                    )}
                                </div>
                                <MessageSquare className="h-4 w-4 text-[#b5bac1] ml-auto" />
                            </button>
                        ))}

                        {!loading && query.length >= 2 && activeTab === "messages" && results.length === 0 && (
                            <div className="text-center py-8 text-[#72767d] text-sm">Sonuç bulunamadı</div>
                        )}
                        {!loading && query.length >= 2 && activeTab === "users" && userResults.length === 0 && (
                            <div className="text-center py-8 text-[#72767d] text-sm">Sonuç bulunamadı</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
