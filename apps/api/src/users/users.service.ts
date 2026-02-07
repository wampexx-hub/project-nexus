import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: { username?: string; bio?: string; customStatus?: string; imageUrl?: string }) {
    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.customStatus !== undefined) updateData.customStatus = data.customStatus;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    const { password, ...result } = user;
    return result;
  }

  async updateStatus(userId: string, status: string) {
    const validStatuses = ['ONLINE', 'IDLE', 'DND', 'INVISIBLE', 'OFFLINE'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });
    const { password, ...result } = user;
    return result;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        imageUrl: true,
        bio: true,
        status: true,
        customStatus: true,
        isAdmin: true,
        createdAt: true,
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
