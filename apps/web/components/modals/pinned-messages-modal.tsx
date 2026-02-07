"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pin, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";

export const PinnedMessagesModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const isModalOpen = isOpen && type === "pinnedMessages";
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isModalOpen || !data.channelId) return;
        setLoading(true);
        api.get(`/messages/pinned/${data.channelId}`)
            .then(res => setMessages(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isModalOpen, data.channelId]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-white overflow-hidden p-0 max-w-md border-none">
                <DialogHeader className="pt-6 px-6">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Pin className="h-5 w-5 text-yellow-500" />
                        Sabitlenmiş Mesajlar
                    </DialogTitle>
                </DialogHeader>
                <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#b5bac1]" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-[#72767d]">
                            <Pin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Henüz sabitlenmiş mesaj yok</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {messages.map((msg) => (
                                <div key={msg.id} className="bg-[#2b2d31] rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                                            {msg.member?.user?.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <span className="text-sm font-medium text-white">
                                            {msg.member?.user?.username || "Bilinmeyen"}
                                        </span>
                                        <span className="text-xs text-[#72767d]">
                                            {format(new Date(msg.createdAt), "d MMM yyyy, HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#dbdee1] ml-8">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
