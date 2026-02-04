import { Injectable } from '@nestjs/common';
import { Message, MemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateMessageDto } from './dto/create-message.dto';

const MESSAGES_BATCH = 10;

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

        const message = await this.prisma.message.create({
            data: {
                content: dto.content,
                fileUrl: dto.fileUrl,
                channelId: dto.channelId,
                memberId: member.id,
            },
            include: {
                member: {
                    include: {
                        user: true,
                    }
                }
            }
        });

        const roomKey = `chat:${dto.channelId}:messages`;

        // Broadcast via SocketGateway
        this.socketGateway.server.to(dto.channelId).emit(roomKey, message);

        return message;
    }

    async getMessages(cursor: string | undefined, channelId: string) {
        // ... (rest of the file)
        if (!channelId) throw new Error("Channel ID missing");

        let messages: Message[] = [];

        if (cursor) {
            messages = await this.prisma.message.findMany({
                take: MESSAGES_BATCH,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                where: {
                    channelId: channelId,
                },
                include: {
                    member: {
                        include: {
                            user: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                }
            })
        } else {
            messages = await this.prisma.message.findMany({
                take: MESSAGES_BATCH,
                where: {
                    channelId: channelId,
                },
                include: {
                    member: {
                        include: {
                            user: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                }
            });
        }

        let nextCursor = null;

        if (messages.length === MESSAGES_BATCH) {
            nextCursor = messages[MESSAGES_BATCH - 1].id;
        }

        return {
            items: messages,
            nextCursor
        }
    }

    async updateMessage(id: string, dto: UpdateMessageDto, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: {
                member: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!message) throw new Error('Message not found');
        if (message.member.userId !== userId) throw new Error('Unauthorized');

        return this.prisma.message.update({
            where: { id },
            data: {
                content: dto.content || message.content,
                updatedAt: new Date()
            },
            include: {
                member: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }

    async deleteMessage(id: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: {
                member: {
                    include: {
                        user: true,
                        server: true
                    }
                },
                channel: true
            }
        });

        if (!message) throw new Error('Message not found');

        // Check if user is message owner or admin/moderator
        const isOwner = message.member.userId === userId;
        const isAdminOrModerator = message.member.role === MemberRole.ADMIN || message.member.role === MemberRole.MODERATOR;

        if (!isOwner && !isAdminOrModerator) {
            throw new Error('Unauthorized');
        }

        return this.prisma.message.update({
            where: { id },
            data: {
                content: "This message has been deleted.",
                fileUrl: null,
                deleted: true
            },
            include: {
                member: {
                    include: {
                        user: true
                    }
                }
            }
        });
    }
}

