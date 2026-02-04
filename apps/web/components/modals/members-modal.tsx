"use client";

import { useState } from "react";
import {
    Check,
    Gavel,
    Loader2,
    MoreVertical,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldQuestion
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuTrigger,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/hooks/use-modal-store";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type MemberRole = "ADMIN" | "MODERATOR" | "GUEST";

const roleIconMap = {
    "GUEST": null,
    "MODERATOR": <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
    "ADMIN": <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />
}

export const MembersModal = () => {
    const router = useRouter();
    const { onOpen, isOpen, onClose, type, data } = useModal();
    const [loadingId, setLoadingId] = useState("");

    const isModalOpen = isOpen && type === "members";
    const { server } = data;

    const onKick = async (memberId: string) => {
        try {
            setLoadingId(memberId);
            await api.delete(`/servers/${server?.id}/members/${memberId}`);

            router.refresh();
            // Refresh local server data in modal
            const res = await api.get(`/servers/${server?.id}`);
            onOpen("members", { server: res.data });
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingId("");
        }
    }

    const onRoleChange = async (memberId: string, role: MemberRole) => {
        try {
            setLoadingId(memberId);
            await api.patch(`/servers/${server?.id}/members/${memberId}`, { role });

            router.refresh();
            const res = await api.get(`/servers/${server?.id}`);
            onOpen("members", { server: res.data });
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingId("");
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#313338] text-[#dbdee1] border-none overflow-hidden shadow-2xl">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold text-white">
                        Üyeleri Yönet
                    </DialogTitle>
                    <DialogDescription className="text-center text-[#b5bac1]">
                        {server?.members?.length} Üye
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 max-h-[420px] pr-6">
                    {server?.members?.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-x-2 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-x-1">
                                    <p className="font-semibold text-sm text-white">
                                        {member.user.username}
                                    </p>
                                    {roleIconMap[member.role as keyof typeof roleIconMap]}
                                </div>
                                <p className="text-xs text-[#b5bac1]">
                                    {member.user.email}
                                </p>
                            </div>
                            {server.ownerId !== member.userId && loadingId !== member.id && (
                                <div className="ml-auto">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <MoreVertical className="h-4 w-4 text-[#b5bac1]" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side="left" className="bg-[#111214] border-none text-[#b5bac1]">
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className="flex items-center">
                                                    <ShieldQuestion className="w-4 h-4 mr-2" />
                                                    <span>Rol</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent className="bg-[#111214] border-none text-[#b5bac1]">
                                                        <DropdownMenuItem onClick={() => onRoleChange(member.id, "GUEST")}>
                                                            <Shield className="h-4 w-4 mr-2" />
                                                            Misafir (Guest)
                                                            {member.role === "GUEST" && (
                                                                <Check className="h-4 w-4 ml-auto" />
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onRoleChange(member.id, "MODERATOR")}>
                                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                                            Moderatör
                                                            {member.role === "MODERATOR" && (
                                                                <Check className="h-4 w-4 ml-auto" />
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator className="bg-zinc-700" />
                                            <DropdownMenuItem onClick={() => onKick(member.id)} className="text-rose-500 hover:bg-rose-500 hover:text-white">
                                                <Gavel className="h-4 w-4 mr-2" />
                                                Sunucudan At
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            {loadingId === member.id && (
                                <Loader2 className="animate-spin text-[#b5bac1] ml-auto w-4 h-4" />
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
