"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChannelsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to DM page by default (Discord-like behavior)
        router.push("/channels/@me");
    }, [router]);

    return (
        <div className="flex h-full items-center justify-center bg-[#313338]">
            <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
                <p className="mt-4 text-[#72767d] text-sm">Yönlendiriliyor...</p>
            </div>
        </div>
    );
}
