import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DM_BATCH = 15;

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(userId: string, targetUserId: string) {
    // Check if conversation already exists between these two users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
        participants: { every: { userId: { in: [userId, targetUserId] } } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, email: true, imageUrl: true, status: true, customStatus: true }
            }
          }
        }
      }
    });

    if (existing) return existing;

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: targetUserId },
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, email: true, imageUrl: true, status: true, customStatus: true }
            }
          }
        }
      }
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, email: true, imageUrl: true, status: true, customStatus: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, email: true, imageUrl: true, status: true, customStatus: true, bio: true }
            }
          }
        }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    return conversation;
  }

  async getMessages(conversationId: string, userId: string, cursor?: string) {
    // Verify participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { userId, conversationId }
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    let messages;
    if (cursor) {
      messages = await this.prisma.directMessage.findMany({
        take: DM_BATCH,
        skip: 1,
        cursor: { id: cursor },
        where: { conversationId },
        include: {
          user: {
            select: { id: true, username: true, email: true, imageUrl: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      messages = await this.prisma.directMessage.findMany({
        take: DM_BATCH,
        where: { conversationId },
        include: {
          user: {
            select: { id: true, username: true, email: true, imageUrl: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Update last read
    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() }
    });

    let nextCursor = null;
    if (messages.length === DM_BATCH) {
      nextCursor = messages[DM_BATCH - 1].id;
    }

    return { items: messages, nextCursor };
  }
}
