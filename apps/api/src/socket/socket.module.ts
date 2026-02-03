import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [SocketGateway],
})
export class SocketModule { }
