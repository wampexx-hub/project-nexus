import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // Statistics
    async getStatistics() {
        const [totalUsers, totalServers, totalChannels, totalMessages] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.server.count(),
            this.prisma.channel.count(),
            this.prisma.message.count(),
        ]);

        return {
            totalUsers,
            totalServers,
            totalChannels,
            totalMessages,
        };
    }

    // User Management
    async getAllUsers(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isAdmin: true,
                    isBanned: true,
                    createdAt: true,
                    _count: {
                        select: {
                            members: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.user.count()
        ]);

        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async banUser(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: true }
        });
    }

    async unbanUser(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: false }
        });
    }

    async makeAdmin(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isAdmin: true }
        });
    }

    async removeAdmin(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isAdmin: false }
        });
    }

    async deleteUser(userId: string) {
        return this.prisma.user.delete({
            where: { id: userId }
        });
    }

    // Server Management
    async getAllServers(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [servers, total] = await Promise.all([
            this.prisma.server.findMany({
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            members: true,
                            channels: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.server.count()
        ]);

        return {
            servers,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async deleteServer(serverId: string) {
        return this.prisma.server.delete({
            where: { id: serverId }
        });
    }

    // Recent Activity
    async getRecentMessages(limit: number = 50) {
        return this.prisma.message.findMany({
            take: limit,
            include: {
                member: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                email: true
                            }
                        }
                    }
                },
                channel: {
                    select: {
                        name: true,
                        serverId: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
}
