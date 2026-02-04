"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useOrigin } from "@/hooks/use-origin";
import { api } from "@/lib/api";

export const InviteModal = () => {
    const { onOpen, isOpen, onClose, type, data } = useModal();
    const origin = useOrigin();

    const isModalOpen = isOpen && type === "invite";
    const { server } = data;

    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

    const onCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 1000);
    };

    const onNew = async () => {
        try {
            setIsLoading(true);
            const response = await api.patch(`/servers/${server?.id}/invite-code`);
            onOpen("invite", { server: response.data });
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-[#dbdee1] border-none p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold text-white">
                        Arkadaşlarını Davet Et
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <Label
                        className="uppercase text-xs font-bold text-[#b5bac1]"
                    >
                        Sunucu Davet Bağlantısı
                    </Label>
                    <div className="flex items-center mt-2 gap-x-2">
                        <Input
                            disabled={isLoading}
                            className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                            value={inviteUrl}
                            readOnly
                        />
                        <Button disabled={isLoading} onClick={onCopy} size="icon" className="bg-[#5865f2] hover:bg-[#4752c4]">
                            {copied
                                ? <Check className="w-4 h-4" />
                                : <Copy className="w-4 h-4" />
                            }
                        </Button>
                    </div>
                    <Button
                        onClick={onNew}
                        disabled={isLoading}
                        variant="link"
                        size="sm"
                        className="text-xs text-[#00a8fc] mt-4 p-0 h-auto hover:underline"
                    >
                        Yeni bir bağlantı oluştur
                        <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
