import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, UpdateChannelDto } from '../servers/dto/channel.dto';
import { MemberRole } from '@prisma/client';

@Injectable()
export class ChannelsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateChannelDto, userId: string) {
        // Check if user is admin/moderator
        const member = await this.prisma.member.findFirst({
            where: {
                serverId: dto.serverId,
                userId: userId,
                role: {
                    in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                }
            }
        });

        if (!member) {
            throw new Error('Unauthorized');
        }

        const channel = await this.prisma.channel.create({
            data: {
                name: dto.name,
                type: dto.type,
                serverId: dto.serverId,
                userId: userId
            }
        });

        return channel;
    }

    async update(id: string, dto: UpdateChannelDto, userId: string) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
            include: { server: true }
        });

        if (!channel) throw new Error('Channel not found');

        // Check permissions
        const member = await this.prisma.member.findFirst({
            where: {
                serverId: channel.serverId,
                userId: userId,
                role: {
                    in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                }
            }
        });

        if (!member) throw new Error('Unauthorized');

        return this.prisma.channel.update({
            where: { id },
            data: dto
        });
    }

    async delete(id: string, userId: string) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
            include: { server: true }
        });

        if (!channel) throw new Error('Channel not found');
        if (channel.name === 'general') throw new Error('Cannot delete general channel');

        // Check permissions
        const member = await this.prisma.member.findFirst({
            where: {
                serverId: channel.serverId,
                userId: userId,
                role: {
                    in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                }
            }
        });

        if (!member) throw new Error('Unauthorized');

        return this.prisma.channel.delete({
            where: { id }
        });
    }
}
