"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
    Users,
    Server,
    MessageSquare,
    Hash,
    Shield,
    Ban,
    Trash2,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [servers, setServers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes, serversRes] = await Promise.all([
                api.get("/admin/statistics"),
                api.get("/admin/users?limit=10"),
                api.get("/admin/servers?limit=10")
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data.users);
            setServers(serversRes.data.servers);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 403) {
                alert("Admin access required");
                router.push("/channels");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBanUser = async (userId: string, isBanned: boolean) => {
        try {
            const endpoint = isBanned ? "unban" : "ban";
            await api.post(`/admin/users/${userId}/${endpoint}`, {});
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleMakeAdmin = async (userId: string, isAdmin: boolean) => {
        try {
            const endpoint = isAdmin ? "remove-admin" : "make-admin";
            await api.post(`/admin/users/${userId}/${endpoint}`, {});
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteServer = async (serverId: string) => {
        if (!confirm("Are you sure you want to delete this server?")) return;

        try {
            await api.delete(`/admin/servers/${serverId}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#313338]">
                <div className="flex flex-col items-center gap-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                    <p className="text-zinc-400">Admin paneli yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#F2F3F5] dark:bg-[#313338] overflow-y-auto">
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">Admin Paneli</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Kullanıcıları, sunucuları yönetin ve istatistikleri görüntüleyin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 mb-6">
                <Card className="bg-white dark:bg-[#2B2D31] border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#2B2D31] border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Sunucu</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalServers || 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#2B2D31] border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Kanal</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalChannels || 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#2B2D31] border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="px-6 mb-6">
                <Card className="bg-white dark:bg-[#2B2D31] border-none">
                    <CardHeader>
                        <CardTitle>Son Kullanıcılar</CardTitle>
                        <CardDescription>Kullanıcı hesaplarını ve yetkilerini yönetin</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kullanıcı Adı</TableHead>
                                    <TableHead>E-posta</TableHead>
                                    <TableHead>Sunucular</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user._count.members}</TableCell>
                                        <TableCell>
                                            {user.isAdmin && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Admin
                                                </span>
                                            )}
                                            {user.isBanned && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2 dark:bg-red-900/30 dark:text-red-400">
                                                    <Ban className="h-3 w-3 mr-1" />
                                                    Yasaklı
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={user.isBanned ? "default" : "destructive"}
                                                    onClick={() => handleBanUser(user.id, user.isBanned)}
                                                >
                                                    {user.isBanned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={user.isAdmin ? "outline" : "default"}
                                                    onClick={() => handleMakeAdmin(user.id, user.isAdmin)}
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="px-6 mb-6">
                <Card className="bg-white dark:bg-[#2B2D31] border-none">
                    <CardHeader>
                        <CardTitle>Son Sunucular</CardTitle>
                        <CardDescription>Platformdaki sunucuları yönetin</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad</TableHead>
                                    <TableHead>Üyeler</TableHead>
                                    <TableHead>Kanallar</TableHead>
                                    <TableHead>İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servers.map((server) => (
                                    <TableRow key={server.id}>
                                        <TableCell className="font-medium">{server.name}</TableCell>
                                        <TableCell>{server._count.members}</TableCell>
                                        <TableCell>{server._count.channels}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteServer(server.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
