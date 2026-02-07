import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchMessages(userId: string, query: string, serverId?: string, channelId?: string) {
    if (!query || query.length < 2) return [];

    const where: any = {
      content: { contains: query, mode: 'insensitive' },
      deleted: false,
    };

    if (channelId) {
      where.channelId = channelId;
    } else if (serverId) {
      where.channel = { serverId };
    } else {
      // Only search in servers user is member of
      const memberServers = await this.prisma.member.findMany({
        where: { userId },
        select: { serverId: true },
      });
      where.channel = { serverId: { in: memberServers.map(m => m.serverId) } };
    }

    return this.prisma.message.findMany({
      where,
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          include: {
            user: {
              select: { id: true, username: true, imageUrl: true }
            }
          }
        },
        channel: {
          select: { id: true, name: true, serverId: true }
        },
      },
    });
  }

  async searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        isBanned: false,
      },
      take: 20,
      select: {
        id: true,
        username: true,
        email: true,
        imageUrl: true,
        status: true,
        customStatus: true,
        bio: true,
      },
    });
  }
}
