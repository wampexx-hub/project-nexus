import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMemberDto } from '../servers/dto/member.dto';
import { MemberRole } from '@prisma/client';

@Injectable()
export class MembersService {
    constructor(private prisma: PrismaService) { }

    async updateRole(serverId: string, memberId: string, dto: UpdateMemberDto, userId: string) {
        // Check if requester is admin
        const requester = await this.prisma.member.findFirst({
            where: {
                serverId,
                userId,
                role: MemberRole.ADMIN
            }
        });

        if (!requester) throw new Error('Unauthorized');

        // Update member role
        const member = await this.prisma.member.update({
            where: {
                id: memberId,
                serverId: serverId
            },
            data: {
                role: dto.role
            },
            include: {
                user: true
            }
        });

        return member;
    }

    async kickMember(serverId: string, memberId: string, userId: string) {
        // Check if requester is admin/moderator
        const requester = await this.prisma.member.findFirst({
            where: {
                serverId,
                userId,
                role: {
                    in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                }
            }
        });

        if (!requester) throw new Error('Unauthorized');

        // Cannot kick owner
        const server = await this.prisma.server.findUnique({
            where: { id: serverId }
        });

        const memberToKick = await this.prisma.member.findUnique({
            where: { id: memberId }
        });

        if (memberToKick?.userId === server?.ownerId) {
            throw new Error('Cannot kick server owner');
        }

        // Delete member
        await this.prisma.member.delete({
            where: {
                id: memberId,
                serverId: serverId
            }
        });

        return { success: true };
    }
}
