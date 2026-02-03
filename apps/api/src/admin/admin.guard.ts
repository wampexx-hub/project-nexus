import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new ForbiddenException('No token provided');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'nexus_secret_key_123'
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub }
            });

            if (!user || !user.isAdmin) {
                throw new ForbiddenException('Admin access required');
            }

            request.user = payload;
            return true;
        } catch {
            throw new ForbiddenException('Invalid token or insufficient permissions');
        }
    }
}
