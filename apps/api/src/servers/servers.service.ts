import { Injectable } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { MemberRole } from '@prisma/client';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateServerDto, userId: string) {
    const server = await this.prisma.server.create({
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        inviteCode: uuidv4(),
        ownerId: userId,
        channels: {
          create: [
            { name: "general", type: "TEXT", userId }
          ]
        },
        members: {
          create: [
            { userId, role: MemberRole.ADMIN }
          ]
        }
      }
    });
    return server;
  }

  findAll(userId: string) {
    return this.prisma.server.findMany({
      where: {
        members: {
          some: { userId }
        }
      }
    });
  }

  findOne(id: string) {
    return this.prisma.server.findUnique({
      where: { id },
      include: {
        channels: {
          orderBy: {
            createdAt: "asc"
          }
        },
        members: {
          include: {
            user: true
          },
          orderBy: {
            role: "asc"
          }
        }
      }
    });
  }

  async regenerateInviteCode(serverId: string, userId: string) {
    // Check if user is admin
    const member = await this.prisma.member.findFirst({
      where: {
        serverId,
        userId,
        role: MemberRole.ADMIN
      }
    });

    if (!member) throw new Error('Unauthorized');

    const server = await this.prisma.server.update({
      where: { id: serverId },
      data: {
        inviteCode: uuidv4()
      }
    });

    return server;
  }

  async joinByInviteCode(inviteCode: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { inviteCode },
      include: {
        members: true
      }
    });

    if (!server) throw new Error('Invalid invite code');

    // Check if already a member
    const existingMember = server.members.find(m => m.userId === userId);
    if (existingMember) {
      return server; // Already a member
    }

    // Add as member
    await this.prisma.member.create({
      data: {
        userId,
        serverId: server.id,
        role: MemberRole.GUEST
      }
    });

    return server;
  }

  async update(id: string, updateServerDto: UpdateServerDto, userId: string) {
    // Check if user is admin
    const member = await this.prisma.member.findFirst({
      where: {
        serverId: id,
        userId,
        role: MemberRole.ADMIN
      }
    });

    if (!member) throw new Error('Unauthorized');

    return this.prisma.server.update({
      where: { id },
      data: updateServerDto
    });
  }

  async remove(id: string, userId: string) {
    // Check if user is owner
    const server = await this.prisma.server.findUnique({
      where: { id }
    });

    if (!server) throw new Error('Server not found');
    if (server.ownerId !== userId) throw new Error('Unauthorized');

    return this.prisma.server.delete({
      where: { id }
    });
  }
}
