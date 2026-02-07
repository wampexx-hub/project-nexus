"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Hash, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

export default function ServerPage() {
    const router = useRouter();
    const params = useParams();
    const serverId = params?.serverId as string;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const redirectToFirstChannel = async () => {
            try {
                const res = await api.get(`/servers/${serverId}`);
                const textChannels = res.data.channels?.filter((c: any) => c.type === "TEXT");
                if (textChannels?.length > 0) {
                    router.replace(`/channels/${serverId}/${textChannels[0].id}`);
                    return;
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        if (serverId) redirectToFirstChannel();
    }, [serverId, router]);

    if (loading) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center bg-[#313338] h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-[#72767d] text-sm">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 justify-center items-center bg-[#313338] h-full">
            <div className="bg-[#2B2D31] rounded-2xl p-8 text-center max-w-sm">
                <Hash className="h-12 w-12 text-[#72767d] mx-auto mb-4" />
                <h2 className="text-lg font-bold text-white mb-2">Kanal Yok</h2>
                <p className="text-sm text-[#72767d]">
                    Bu sunucuda henüz metin kanalı bulunmuyor. Sol menüden yeni kanal oluşturabilirsin.
                </p>
            </div>
        </div>
    );
}
