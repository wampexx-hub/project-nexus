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

const formSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
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
            const res = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (res.ok) {
                router.push("/login")
            } else {
                 
                console.error("Registration failed")
            }
        } catch (error) {
             
            console.error("Registration error", error)
        }
    }

    return (
        <Card className="w-[480px] border-none bg-[#313338] text-[#dbdee1] shadow-none sm:bg-[#313338] md:bg-[#313338]">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold text-white">Create an account</CardTitle>
                <CardDescription className="text-[#b5bac1]">Join the community!</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your email" className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0" {...field} />
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
                                    <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your username" className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0" {...field} />
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
                                    <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your password" className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="pt-2">
                            <Button type="submit" className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium">Continue</Button>
                        </div>

                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="text-sm text-[#949ba4]">
                    Already have an account? <Link href="/login" className="text-[#00a8fc] hover:underline">Log In</Link>
                </div>
            </CardFooter>
        </Card>
    )
}
