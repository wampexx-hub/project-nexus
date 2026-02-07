"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";

export const UserProfileModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const isModalOpen = isOpen && type === "userProfile";
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isModalOpen || !data.userId) return;
        setLoading(true);
        api.get(`/users/${data.userId}`)
            .then(res => setUser(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isModalOpen, data.userId]);

    const statusColors: Record<string, string> = {
        ONLINE: "bg-green-500",
        IDLE: "bg-yellow-500",
        DND: "bg-red-500",
        INVISIBLE: "bg-gray-500",
        OFFLINE: "bg-gray-500",
    };

    const statusLabels: Record<string, string> = {
        ONLINE: "Çevrimiçi",
        IDLE: "Boşta",
        DND: "Rahatsız Etmeyin",
        INVISIBLE: "Görünmez",
        OFFLINE: "Çevrimdışı",
    };

    const startDM = async () => {
        if (!user) return;
        try {
            const res = await api.post("/conversations", { targetUserId: user.id });
            onClose();
            router.push(`/channels/@me/${res.data.id}`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#232428] text-white overflow-hidden p-0 max-w-sm border-none">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                ) : user ? (
                    <div>
                        {/* Banner */}
                        <div className="h-16 bg-indigo-500 relative">
                            <div className="absolute -bottom-8 left-4">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-full bg-indigo-600 border-[6px] border-[#232428] flex items-center justify-center text-white text-2xl font-bold">
                                        {user.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-[#232428] ${statusColors[user.status] || "bg-gray-500"}`} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 px-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-xl font-bold">{user.username}</h3>
                                    <p className="text-sm text-[#b5bac1]">{user.email}</p>
                                </div>
                                <button
                                    onClick={startDM}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Mesaj
                                </button>
                            </div>

                            {user.customStatus && (
                                <p className="text-sm text-[#dbdee1] mb-3">{user.customStatus}</p>
                            )}

                            <div className="bg-[#111214] rounded-lg p-3 space-y-3">
                                {user.bio && (
                                    <div>
                                        <p className="text-xs uppercase font-bold text-[#b5bac1] mb-1">Hakkımda</p>
                                        <p className="text-sm text-[#dbdee1]">{user.bio}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs uppercase font-bold text-[#b5bac1] mb-1">Durum</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2.5 w-2.5 rounded-full ${statusColors[user.status] || "bg-gray-500"}`} />
                                        <span className="text-sm text-[#dbdee1]">{statusLabels[user.status] || "Bilinmiyor"}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs uppercase font-bold text-[#b5bac1] mb-1">Katılım Tarihi</p>
                                    <p className="text-sm text-[#dbdee1]">
                                        {user.createdAt ? format(new Date(user.createdAt), "d MMM yyyy") : "-"}
                                    </p>
                                </div>

                                {user.isAdmin && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-xs text-red-400 font-medium">
                                        Platform Yöneticisi
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-[#72767d]">Kullanıcı bulunamadı</div>
                )}
            </DialogContent>
        </Dialog>
    );
};
