"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function InviteCodePage({
    params
}: {
    params: { inviteCode: string }
}) {
    const router = useRouter();

    useEffect(() => {
        const joinServer = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await axios.post(
                    `http://localhost:3001/api/servers/join/${params.inviteCode}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

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
        <div className="h-full flex items-center justify-center">
            <p className="text-zinc-500">Joining server...</p>
        </div>
    );
}
