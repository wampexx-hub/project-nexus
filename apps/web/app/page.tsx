"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0c] font-sans selection:bg-purple-500/30">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 animate-pulse-slow"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#0a0a0c]/60 to-[#0a0a0c]" />

      {/* Hero Content */}
      <div className="relative z-20 flex h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-purple-300 backdrop-blur-md">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          İletişimin Geleceği Burada
        </div>

        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl">
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Nexus
          </span>
          {" "}Dünyasına Hoş Geldiniz
        </h1>

        <p className="mt-8 max-w-2xl text-lg text-[#b5bac1] md:text-xl">
          Arkadaşlarınızla, topluluklarınızla ve dünyayla bağlantı kurmanın en şık ve hızlı yolu.
          Sınırları ortadan kaldıran bir deneyim sizi bekliyor.
        </p>

        <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 bg-[#5865f2] hover:bg-[#4752c4] text-white text-lg font-semibold rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(88,101,242,0.4)]">
              Ücretsiz Katıl
              <MoveRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost" className="h-14 px-8 border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md rounded-2xl transition-all">
              Giriş Yap
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid (Subtle) */}
        <div className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "Ultra Hızlı", desc: "Düşük gecikmeli mesajlaşma ve ses iletimi." },
            { title: "Güvenli", desc: "Uçtan uca şifreleme ve modern güvenlik." },
            { title: "Güçlü", desc: "Gelişmiş kanal yönetimi ve bot desteği." }
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-[#b5bac1]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; transform: scale(1.05); }
          50% { opacity: 0.45; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
