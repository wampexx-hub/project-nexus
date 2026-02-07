import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_messageId_emoji: { userId, messageId, emoji }
      }
    });

    if (existing) {
      await this.prisma.reaction.delete({
        where: { id: existing.id }
      });
      return { action: 'removed', emoji, messageId };
    }

    const reaction = await this.prisma.reaction.create({
      data: { emoji, userId, messageId },
      include: {
        user: {
          select: { id: true, username: true, imageUrl: true }
        }
      }
    });

    return { action: 'added', reaction };
  }

  async getReactionsForMessage(messageId: string) {
    const reactions = await this.prisma.reaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, username: true, imageUrl: true }
        }
      }
    });

    // Group reactions by emoji
    const grouped: Record<string, { emoji: string; count: number; users: any[] }> = {};
    for (const r of reactions) {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user);
    }

    return Object.values(grouped);
  }
}
