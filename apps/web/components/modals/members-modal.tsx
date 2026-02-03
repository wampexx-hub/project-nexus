"use client";

import { useState } from "react";
import axios from "axios";
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

type MemberRole = "ADMIN" | "MODERATOR" | "GUEST";

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
            const token = localStorage.getItem("accessToken");
            await axios.delete(`http://localhost:3001/api/servers/${server?.id}/members/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.refresh();
            onOpen("members", { server });
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingId("");
        }
    }

    const onRoleChange = async (memberId: string, role: MemberRole) => {
        try {
            setLoadingId(memberId);
            const token = localStorage.getItem("accessToken");
            await axios.patch(`http://localhost:3001/api/servers/${server?.id}/members/${memberId}`,
                { role },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            router.refresh();
            onOpen("members", { server });
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingId("");
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white text-black overflow-hidden">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Manage Members
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500">
                        {server?.members?.length} Members
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-8 max-h-[420px] pr-6">
                    {server?.members?.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-x-2 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-x-1">
                                    <p className="font-semibold text-xs">
                                        {member.user.username}
                                    </p>
                                    {roleIconMap[member.role as keyof typeof roleIconMap]}
                                </div>
                                <p className="text-xs text-zinc-500">
                                    {member.user.email}
                                </p>
                            </div>
                            {server.ownerId !== member.userId && loadingId !== member.id && (
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side="left">
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className="flex items-center">
                                                    <ShieldQuestion className="w-4 h-4 mr-2" />
                                                    <span>Role</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => onRoleChange(member.id, "GUEST")}>
                                                            <Shield className="h-4 w-4 mr-2" />
                                                            Guest
                                                            {member.role === "GUEST" && (
                                                                <Check className="h-4 w-4 ml-auto" />
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onRoleChange(member.id, "MODERATOR")}>
                                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                                            Moderator
                                                            {member.role === "MODERATOR" && (
                                                                <Check className="h-4 w-4 ml-auto" />
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onKick(member.id)}>
                                                <Gavel className="h-4 w-4 mr-2" />
                                                Kick
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                            {loadingId === member.id && (
                                <Loader2 className="animate-spin text-zinc-500 ml-auto w-4 h-4" />
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
