"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { api } from "@/lib/api";

export const DeleteMessageModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const isModalOpen = isOpen && type === "deleteMessage";
    const { apiUrl, message } = data;

    const onClick = async () => {
        try {
            setIsLoading(true);
            // apiUrl from ChatMessages is usually "/messages"
            await api.delete(`${apiUrl}/${message?.id}`);
            onClose();
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
                        Mesajı Sil
                    </DialogTitle>
                    <DialogDescription className="text-center text-[#b5bac1]">
                        Bu mesajı silmek istediğinizden emin misiniz? <br />
                        Bu işlem geri alınamaz.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="bg-[#2b2d31] px-6 py-4">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            disabled={isLoading}
                            onClick={onClose}
                            variant="ghost"
                            className="text-white hover:bg-zinc-700/50"
                        >
                            İptal
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={onClick}
                            className="bg-rose-500 hover:bg-rose-600 text-white"
                        >
                            Onayla
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
