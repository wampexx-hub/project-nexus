"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.push("/login");
                return;
            }

            const [statsRes, usersRes, serversRes] = await Promise.all([
                axios.get("http://localhost:3001/api/admin/statistics", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:3001/api/admin/users?limit=10", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:3001/api/admin/servers?limit=10", {
                    headers: { Authorization: `Bearer ${token}` }
                })
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

    const handleBanUser = async (userId: string, isBanned: boolean) => {
        try {
            const token = localStorage.getItem("accessToken");
            const endpoint = isBanned ? "unban" : "ban";
            await axios.post(`http://localhost:3001/api/admin/users/${userId}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleMakeAdmin = async (userId: string, isAdmin: boolean) => {
        try {
            const token = localStorage.getItem("accessToken");
            const endpoint = isAdmin ? "remove-admin" : "make-admin";
            await axios.post(`http://localhost:3001/api/admin/users/${userId}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteServer = async (serverId: string) => {
        if (!confirm("Are you sure you want to delete this server?")) return;

        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`http://localhost:3001/api/admin/servers/${serverId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-zinc-500">Loading admin dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#F2F3F5] dark:bg-[#313338]">
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">Admin Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Manage users, servers, and view statistics</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalServers || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalChannels || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <div className="px-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Manage user accounts and permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Servers</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
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
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Admin
                                                </span>
                                            )}
                                            {user.isBanned && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                                                    <Ban className="h-3 w-3 mr-1" />
                                                    Banned
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

            {/* Servers Table */}
            <div className="px-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Servers</CardTitle>
                        <CardDescription>Manage servers across the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Channels</TableHead>
                                    <TableHead>Actions</TableHead>
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
