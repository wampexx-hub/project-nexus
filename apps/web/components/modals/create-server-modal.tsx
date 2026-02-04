"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { api } from "@/lib/api";

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Sunucu adı gereklidir."
    }),
    imageUrl: z.string().optional()
});

export const CreateServerModal = () => {
    const { isOpen, onClose, type } = useModal();
    const router = useRouter();

    const isModalOpen = isOpen && type === "createServer";

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            imageUrl: "",
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            console.log("Submitting server creation form with values:", values);
            const token = localStorage.getItem("accessToken");
            console.log("Access token exists:", !!token);

            const response = await api.post("/servers", values);
            console.log("Server creation response:", response);

            form.reset();
            router.refresh();
            onClose();

            // Re-adding reload because router.refresh() might not be enough for socket reconnection or state update in this specific setup
            window.location.reload();
        } catch (error: any) {
            console.error("Server creation error detailed:", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                console.error("Error response headers:", error.response.headers);
            } else if (error.request) {
                console.error("Error request:", error.request);
            } else {
                console.error("Error message:", error.message);
            }

            const msg = error.response?.data?.message || error.message || "Sunucu oluşturulamadı. Lütfen tekrar deneyin.";
            alert(`Hata: ${msg}`);
        }
    }

    const handleClose = () => {
        form.reset();
        onClose();
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#313338] text-[#dbdee1] border-none p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold text-white">
                        Sunucunuzu Özelleştirin
                    </DialogTitle>
                    <DialogDescription className="text-center text-[#b5bac1]">
                        Sunucunuza bir isim ve (isteğe bağlı) bir görsel vererek ona kişilik katın.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-8 px-6">
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="uppercase text-xs font-bold text-[#b5bac1]">
                                            Görsel URL (İsteğe Bağlı)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={isLoading}
                                                className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                                placeholder="https://example.com/image.png"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel
                                            className="uppercase text-xs font-bold text-[#b5bac1]"
                                        >
                                            Sunucu Adı
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={isLoading}
                                                className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                                placeholder="Muhteşem Sunucum"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="bg-[#2b2d31] px-6 py-4">
                            <Button variant="ghost" disabled={isLoading} onClick={handleClose} className="text-white hover:bg-zinc-700/50">
                                İptal
                            </Button>
                            <Button disabled={isLoading} className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                                {isLoading ? "Oluşturuluyor..." : "Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
