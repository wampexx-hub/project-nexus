import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password: hashedPassword,
            },
        });

        // Return token without password
        const { password, ...result } = user;
        return {
            user: result,
            backendTokens: {
                accessToken: await this.jwtService.signAsync({ sub: user.id, email: user.email }),
            },
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new UnauthorizedException();

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new UnauthorizedException();

        const { password, ...result } = user;
        return {
            user: result,
            backendTokens: {
                accessToken: await this.jwtService.signAsync({ sub: user.id, email: user.email }),
            },
        };
    }
}
