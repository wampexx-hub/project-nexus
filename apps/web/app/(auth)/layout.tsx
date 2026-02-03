export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#313338]">
            {children}
        </div>
    )
}
