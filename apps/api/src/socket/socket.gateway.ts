import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'api/socket/messages',  // Namespace to match frontend expectation
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.headers['authorization']?.split(' ')[1] || socket.handshake.auth.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'nexus_secret_key_123'
      });
      // Store user info in socket
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;

      console.log(`Client connected: ${socket.id} (User: ${payload.email})`);
    } catch (e) {
      console.log('Connection rejected:', e.message);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string }
  ) {
    if (!payload.channelId) return;
    client.join(payload.channelId);
    console.log(`User ${client.data.email} joined channel ${payload.channelId}`);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string, channelId: string, serverId: string, fileUrl?: string }
  ) {
    // Validate Member
    const userId = client.data.userId;

    const member = await this.prisma.member.findFirst({
      where: {
        serverId: payload.serverId,
        userId: userId
      }
    });

    if (!member) {
      throw new Error("Member not found");
    }

    // Save to DB
    const message = await this.prisma.message.create({
      data: {
        content: payload.content,
        fileUrl: payload.fileUrl,
        channelId: payload.channelId,
        memberId: member.id
      },
      include: {
        member: {
          include: {
            user: true
          }
        }
      }
    });

    // Emit to room
    // Event name usually convention like `chat:${channelId}:messages` or `new-message`
    const roomKey = `chat:${payload.channelId}:messages`; // Matches frontend socket key usually

    // But standard socket.io just 'new-message' in room
    this.server.to(payload.channelId).emit('new-message', message);

    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string; userId: string; username: string }
  ) {
    client.to(payload.channelId).emit(`typing:${payload.channelId}`, {
      userId: payload.userId,
      username: payload.username
    });
  }

  @SubscribeMessage('join-server')
  handleJoinServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { serverId: string }
  ) {
    if (!payload.serverId) return;

    client.join(`server:${payload.serverId}`);

    // Get all sockets in this server room
    this.server.in(`server:${payload.serverId}`).fetchSockets().then((sockets) => {
      const onlineUsers = sockets.map(s => s.data.userId).filter(Boolean);
      this.server.to(`server:${payload.serverId}`).emit(`presence:${payload.serverId}`, {
        onlineUsers
      });
    });
  }
}
