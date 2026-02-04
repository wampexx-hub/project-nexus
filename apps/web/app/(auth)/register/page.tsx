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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

const formSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
})

export default function RegisterPage() {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await api.post("/auth/register", values);

            if (res.status === 201 || res.status === 200) {
                router.push("/login")
            }
        } catch (error: any) {
            console.error("Registration error", error)
            const errorMsg = error.response?.data?.message || error.message;
            alert(`Kayıt başarısız: ${errorMsg}`);
        }
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-[#0a0a0c] overflow-hidden py-10">
            {/* Background Effects */}
            <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-600/10 blur-[120px]" />

            <Card className="relative z-10 w-[440px] border border-white/10 bg-[#1e1f22]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-bold text-white">Hesap Oluştur</CardTitle>
                    <CardDescription className="text-[#b5bac1] mt-2">Topluluğa katılmak için formu doldur!</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">E-POSTA</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-11 bg-[#101113] border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
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
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">KULLANICI ADI</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-11 bg-[#101113] border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
                                                placeholder="NexusSever"
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
                                                className="h-11 bg-[#101113] border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-blue-500/10">
                                    Devam Et
                                </Button>
                            </div>
                        </form>
                    </Form>
                    <div className="mt-6 text-sm text-[#949ba4]">
                        Zaten bir hesabın var mı? <Link href="/login" className="text-[#00a8fc] hover:underline font-medium">Giriş Yap</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
