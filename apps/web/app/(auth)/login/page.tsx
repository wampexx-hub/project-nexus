"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Şifre gereklidir"),
})

export default function LoginPage() {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await api.post("/auth/login", values);

            if (res.status === 201 || res.status === 200) {
                const data = res.data;
                console.log("Login success:", data)
                localStorage.setItem("accessToken", data.backendTokens.accessToken)
                router.push("/channels")
                window.location.reload(); // Force state refresh
            }
        } catch (error: any) {
            console.error("Login error", error)
            const errorMsg = error.response?.data?.message || error.message;
            alert(`Giriş başarısız: ${errorMsg}`);
        }
    }

    return (
        <div className="relative flex h-screen w-full items-center justify-center bg-[#0a0a0c] overflow-hidden">
            {/* Background Blur */}
            <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-purple-600/20 blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-600/20 blur-[100px]" />

            <Card className="relative z-10 w-[420px] border border-white/10 bg-[#1e1f22]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" />
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-bold text-white">Tekrar Hoş Geldiniz!</CardTitle>
                    <CardDescription className="text-[#b5bac1] mt-2">Sizi tekrar gördüğümüze çok sevindik!</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">E-POSTA</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-12 bg-[#101113] border-none text-white focus-visible:ring-1 focus-visible:ring-purple-500 rounded-xl transition-all"
                                                placeholder="adınız@örnek.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">ŞİFRE</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                className="h-12 bg-[#101113] border-none text-white focus-visible:ring-1 focus-visible:ring-purple-500 rounded-xl transition-all"
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-purple-500/10">
                                    Giriş Yap
                                </Button>
                            </div>
                        </form>
                    </Form>
                    <div className="mt-6 text-sm text-[#949ba4]">
                        Bir hesaba mı ihtiyacınız var? <Link href="/register" className="text-[#00a8fc] hover:underline font-medium">Kaydol</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
