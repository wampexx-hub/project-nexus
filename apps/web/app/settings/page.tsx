"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, LogOut, Palette, Bell, Save } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [customStatus, setCustomStatus] = useState("");
    const [status, setStatus] = useState("ONLINE");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("hesap");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/users/profile");
                setUser(res.data);
                setUsername(res.data.username || "");
                setBio(res.data.bio || "");
                setCustomStatus(res.data.customStatus || "");
                setStatus(res.data.status || "ONLINE");
            } catch (e) {
                console.error(e);
                router.push("/login");
            }
        };
        fetchUser();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch("/users/profile", { username, bio, customStatus });
            await api.patch("/users/status", { status });
            setUser((prev: any) => ({ ...prev, username, bio, customStatus, status }));
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        router.push("/login");
    };

    const statusOptions = [
        { value: "ONLINE", label: "Çevrimiçi", color: "bg-green-500" },
        { value: "IDLE", label: "Boşta", color: "bg-yellow-500" },
        { value: "DND", label: "Rahatsız Etmeyin", color: "bg-red-500" },
        { value: "INVISIBLE", label: "Görünmez", color: "bg-gray-500" },
    ];

    const tabs = [
        { id: "hesap", label: "Hesabım", icon: User },
        { id: "profil", label: "Profil", icon: Shield },
        { id: "bildirimler", label: "Bildirimler", icon: Bell },
        { id: "gorunum", label: "Görünüm", icon: Palette },
    ];

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#313338]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#313338]">
            {/* Sidebar */}
            <div className="w-56 bg-[#2B2D31] flex flex-col">
                <div className="p-4 flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        className="p-1 rounded-md hover:bg-[#383a40] transition"
                    >
                        <ArrowLeft className="h-5 w-5 text-[#b5bac1]" />
                    </button>
                    <h2 className="text-sm font-semibold text-[#b5bac1] uppercase">Kullanıcı Ayarları</h2>
                </div>
                <div className="flex-1 px-2 space-y-0.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                                activeTab === tab.id
                                    ? "bg-[#404249] text-white"
                                    : "text-[#b5bac1] hover:bg-[#383a40] hover:text-[#dbdee1]"
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                    <div className="h-px bg-zinc-700 my-2" />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-rose-400 hover:bg-rose-500/10 transition"
                    >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
                {activeTab === "hesap" && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Hesabım</h2>
                        <div className="bg-[#1E1F22] rounded-lg overflow-hidden">
                            <div className="h-24 bg-indigo-500" />
                            <div className="p-4 relative">
                                <div className="absolute -top-10 left-4">
                                    <div className="h-20 w-20 rounded-full bg-indigo-600 border-4 border-[#1E1F22] flex items-center justify-center text-white text-2xl font-bold">
                                        {user.username?.[0]?.toUpperCase()}
                                    </div>
                                </div>
                                <div className="ml-24 pt-1">
                                    <p className="text-lg font-semibold text-white">{user.username}</p>
                                    <p className="text-sm text-[#b5bac1]">{user.email}</p>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-xs uppercase font-bold text-[#b5bac1] mb-1 block">Kullanıcı Adı</label>
                                    <Input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-[#313338] border-none text-[#dbdee1]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-[#b5bac1] mb-1 block">E-posta</label>
                                    <Input
                                        value={user.email}
                                        disabled
                                        className="bg-[#313338] border-none text-[#72767d]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "profil" && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Profil</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs uppercase font-bold text-[#b5bac1] mb-2 block">Durum</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setStatus(opt.value)}
                                            className={`flex items-center gap-2 p-3 rounded-md transition ${
                                                status === opt.value
                                                    ? "bg-[#404249] ring-2 ring-indigo-500"
                                                    : "bg-[#1E1F22] hover:bg-[#383a40]"
                                            }`}
                                        >
                                            <div className={`h-3 w-3 rounded-full ${opt.color}`} />
                                            <span className="text-sm text-[#dbdee1]">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-[#b5bac1] mb-2 block">Özel Durum</label>
                                <Input
                                    value={customStatus}
                                    onChange={(e) => setCustomStatus(e.target.value)}
                                    placeholder="Özel durumunuzu yazın..."
                                    className="bg-[#1E1F22] border-none text-[#dbdee1]"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-[#b5bac1] mb-2 block">Hakkımda</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Hakkınızda bir şeyler yazın..."
                                    rows={4}
                                    className="w-full bg-[#1E1F22] border-none rounded-md text-[#dbdee1] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                />
                            </div>

                            {/* Profile Preview */}
                            <div>
                                <label className="text-xs uppercase font-bold text-[#b5bac1] mb-2 block">Önizleme</label>
                                <div className="bg-[#1E1F22] rounded-lg p-4 max-w-xs">
                                    <div className="h-16 bg-indigo-500 rounded-t-lg -mx-4 -mt-4 mb-4" />
                                    <div className="flex items-center gap-3 -mt-8">
                                        <div className="relative">
                                            <div className="h-16 w-16 rounded-full bg-indigo-600 border-4 border-[#1E1F22] flex items-center justify-center text-white text-xl font-bold">
                                                {username?.[0]?.toUpperCase()}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#1E1F22] ${statusOptions.find(s => s.value === status)?.color || "bg-gray-500"}`} />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="font-bold text-white">{username}</p>
                                        {customStatus && <p className="text-xs text-[#b5bac1] mt-1">{customStatus}</p>}
                                        {bio && (
                                            <>
                                                <div className="h-px bg-zinc-700 my-2" />
                                                <p className="text-xs uppercase font-bold text-[#b5bac1] mb-1">Hakkımda</p>
                                                <p className="text-sm text-[#dbdee1]">{bio}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "bildirimler" && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Bildirimler</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-[#dbdee1]">Masaüstü Bildirimleri</p>
                                    <p className="text-xs text-[#72767d]">Tarayıcı bildirimleri alın</p>
                                </div>
                                <button className="relative w-12 h-6 bg-[#72767d] rounded-full transition">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-[#dbdee1]">Mesaj Sesleri</p>
                                    <p className="text-xs text-[#72767d]">Yeni mesajlarda ses çal</p>
                                </div>
                                <button className="relative w-12 h-6 bg-green-500 rounded-full transition">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "gorunum" && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Görünüm</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-[#1E1F22] rounded-lg">
                                <p className="text-sm font-medium text-[#dbdee1] mb-3">Tema</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="p-3 bg-[#313338] rounded-md ring-2 ring-indigo-500 text-sm text-[#dbdee1]">
                                        Koyu
                                    </button>
                                    <button className="p-3 bg-white rounded-md text-sm text-gray-800">
                                        Açık
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="mt-6">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </Button>
                </div>

                <div className="mt-4 text-xs text-[#72767d]">
                    <p>Üyelik tarihi: {user.createdAt ? format(new Date(user.createdAt), "d MMMM yyyy") : "-"}</p>
                </div>
            </div>
        </div>
    );
}
