import { Injectable } from '@nestjs/common';
import { Message, MemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateMessageDto } from './dto/create-message.dto';

const MESSAGES_BATCH = 15;

const messageInclude = {
    member: {
        include: {
            user: true,
        }
    },
    reactions: {
        include: {
            user: {
                select: { id: true, username: true, imageUrl: true }
            }
        }
    },
    replyTo: {
        include: {
            member: {
                include: {
                    user: {
                        select: { id: true, username: true }
                    }
                }
            }
        }
    }
};

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) { }

    async create(dto: CreateMessageDto, userId: string) {
        const member = await this.prisma.member.findFirst({
            where: {
                serverId: dto.serverId,
                userId: userId
            }
        });

        if (!member) {
            throw new Error("Member not found");
        }

        const data: any = {
            content: dto.content,
            fileUrl: dto.fileUrl,
            channelId: dto.channelId,
            memberId: member.id,
        };

        if (dto.replyToId) {
            data.replyToId = dto.replyToId;
        }

        const message = await this.prisma.message.create({
            data,
            include: messageInclude,
        });

        const roomKey = `chat:${dto.channelId}:messages`;
        this.socketGateway.server.to(dto.channelId).emit(roomKey, message);

        return message;
    }

    async getMessages(cursor: string | undefined, channelId: string) {
        if (!channelId) throw new Error("Channel ID missing");

        let messages: any[] = [];

        if (cursor) {
            messages = await this.prisma.message.findMany({
                take: MESSAGES_BATCH,
                skip: 1,
                cursor: { id: cursor },
                where: { channelId },
                include: messageInclude,
                orderBy: { createdAt: "desc" }
            });
        } else {
            messages = await this.prisma.message.findMany({
                take: MESSAGES_BATCH,
                where: { channelId },
                include: messageInclude,
                orderBy: { createdAt: "desc" }
            });
        }

        let nextCursor = null;
        if (messages.length === MESSAGES_BATCH) {
            nextCursor = messages[MESSAGES_BATCH - 1].id;
        }

        return { items: messages, nextCursor };
    }

    async updateMessage(id: string, dto: UpdateMessageDto, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: { member: { include: { user: true } } }
        });

        if (!message) throw new Error('Message not found');
        if (message.member.userId !== userId) throw new Error('Unauthorized');

        return this.prisma.message.update({
            where: { id },
            data: {
                content: dto.content || message.content,
                updatedAt: new Date()
            },
            include: messageInclude,
        });
    }

    async deleteMessage(id: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: {
                member: {
                    include: { user: true, server: true }
                },
                channel: true
            }
        });

        if (!message) throw new Error('Message not found');

        const isOwner = message.member.userId === userId;
        const isAdminOrModerator = message.member.role === MemberRole.ADMIN || message.member.role === MemberRole.MODERATOR;

        if (!isOwner && !isAdminOrModerator) {
            throw new Error('Unauthorized');
        }

        return this.prisma.message.update({
            where: { id },
            data: {
                content: "Bu mesaj silindi.",
                fileUrl: null,
                deleted: true
            },
            include: messageInclude,
        });
    }

    async togglePin(id: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: {
                member: { include: { user: true } },
                channel: { include: { server: true } }
            }
        });

        if (!message) throw new Error('Message not found');

        // Check if user is admin or moderator in the server
        const member = await this.prisma.member.findFirst({
            where: {
                userId,
                serverId: message.channel.serverId,
                role: { in: [MemberRole.ADMIN, MemberRole.MODERATOR] }
            }
        });

        if (!member) throw new Error('Unauthorized');

        return this.prisma.message.update({
            where: { id },
            data: { pinned: !message.pinned },
            include: messageInclude,
        });
    }

    async getPinnedMessages(channelId: string) {
        return this.prisma.message.findMany({
            where: { channelId, pinned: true, deleted: false },
            include: messageInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
}

