"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Smile } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";
import { useModal } from "@/hooks/use-modal-store";
import EmojiPicker from "emoji-picker-react";
import { useState } from "react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInputProps {
    apiUrl: string;
    query: Record<string, any>;
    name: string;
    type: "conversation" | "channel";
}

const formSchema = z.object({
    content: z.string().min(1),
});

export const ChatInput = ({
    apiUrl,
    query,
    name,
    type
}: ChatInputProps) => {
    const { socket } = useSocket();
    const { onOpen } = useModal();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (!socket) return;

            socket.emit("send-message", {
                content: values.content,
                channelId: query.channelId,
                serverId: query.serverId,
                fileUrl: null
            });

            form.reset();
        } catch (error) {
            console.log(error);
        }
    }

    const onEmojiClick = (emojiData: any) => {
        const currentValue = form.getValues("content");
        form.setValue("content", currentValue + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="relative p-4 pb-6">
                                    <button
                                        type="button"
                                        onClick={() => onOpen("messageFile", { apiUrl, query })}
                                        className="absolute top-7 left-8 h-[24px] w-[24px] bg-[#b5bac1] hover:bg-white transition rounded-full p-1 flex items-center justify-center group"
                                    >
                                        <Plus className="text-[#313338]" />
                                    </button>
                                    <Input
                                        disabled={isLoading}
                                        autoComplete="off"
                                        className="px-14 py-6 bg-[#383a40] border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[#dbdee1]"
                                        placeholder={`Mesaj gönder: ${type === "conversation" ? name : "#" + name}`}
                                        {...field}
                                    />
                                    <div className="absolute top-7 right-8 flex items-center gap-x-2">
                                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="hover:text-white transition"
                                                >
                                                    <Smile className="h-6 w-6 text-[#b5bac1] hover:text-[#dbdee1]" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                side="top"
                                                sideOffset={40}
                                                className="bg-transparent border-none shadow-none drop-shadow-none mb-4"
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={onEmojiClick}
                                                    theme={"dark" as any}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
