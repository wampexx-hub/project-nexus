import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#313338] text-white">
      <h1 className="text-4xl font-bold">Welcome to Nexus</h1>
      <p className="text-[#b5bac1]">The place to talk with friends</p>

      <div className="flex gap-4">
        <Link href="/login">
          <Button className="bg-[#5865f2] hover:bg-[#4752c4]">Login</Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary">Register</Button>
        </Link>
      </div>
    </div>
  );
}
