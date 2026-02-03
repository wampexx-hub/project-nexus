"use client";

import { useEffect, useState } from "react";
import { CreateServerModal } from "@/components/modals/create-server-modal";
import { MessageFileModal } from "@/components/modals/message-file-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { MembersModal } from "@/components/modals/members-modal";
import { EditMessageModal } from "@/components/modals/edit-message-modal";
import { DeleteMessageModal } from "@/components/modals/delete-message-modal";
import { EditServerModal } from "@/components/modals/edit-server-modal";

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <CreateServerModal />
            <MessageFileModal />
            <CreateChannelModal />
            <InviteModal />
            <MembersModal />
            <EditMessageModal />
            <DeleteMessageModal />
            <EditServerModal />
        </>
    )
}
