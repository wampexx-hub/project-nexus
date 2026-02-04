"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function InviteCodePage({
    params
}: {
    params: { inviteCode: string }
}) {
    const router = useRouter();

    useEffect(() => {
        const joinServer = async () => {
            try {
                const response = await api.post(`/servers/join/${params.inviteCode}`, {});

                if (response.data) {
                    router.push(`/channels/${response.data.id}`);
                }
            } catch (error) {
                console.log(error);
                router.push("/channels");
            }
        };

        joinServer();
    }, [params.inviteCode, router]);

    return (
        <div className="h-full flex items-center justify-center bg-[#313338]">
            <div className="flex flex-col items-center gap-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                <p className="text-zinc-400">Sunucuya katılıyor...</p>
            </div>
        </div>
    );
}
