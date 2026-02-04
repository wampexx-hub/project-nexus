"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { api } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const DeleteServerModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const isModalOpen = isOpen && type === "deleteServer";
    const { server } = data;

    const onDelete = async () => {
        try {
            setIsLoading(true);
            await api.delete(`/servers/${server?.id}`);
            onClose();
            // Use window.location for full page refresh to update sidebar
            window.location.href = "/channels";
        } catch (error) {
            console.error("Failed to delete server:", error);
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-[#313338] text-black dark:text-white p-0 overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Sunucuyu Sil
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-indigo-500">{server?.name}</span> sunucusunu silmek istediğinizden emin misiniz?
                        <br />
                        <span className="text-rose-500 font-semibold">Bu işlem geri alınamaz!</span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="bg-gray-100 dark:bg-[#2B2D31] px-6 py-4">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            disabled={isLoading}
                            onClick={onClose}
                            variant="ghost"
                        >
                            İptal
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={onDelete}
                            variant="destructive"
                        >
                            {isLoading ? "Siliniyor..." : "Sunucuyu Sil"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
