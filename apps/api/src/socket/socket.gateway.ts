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

interface VoiceParticipant {
  odimUserId: string;
  odimSocketId: string;
  username: string;
  imageUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
}

interface VoiceChannel {
  participants: Map<string, VoiceParticipant>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/api/socket/messages',  // Namespace to match frontend expectation
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track voice channel participants: channelId -> Map<odimUserId, VoiceParticipant>
  private voiceChannels: Map<string, VoiceChannel> = new Map();

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

    // Remove user from all voice channels when disconnected
    const userId = socket.data.userId;
    if (userId) {
      this.voiceChannels.forEach((channel, channelId) => {
        if (channel.participants.has(userId)) {
          channel.participants.delete(userId);
          // Notify others in the voice channel
          this.server.to(`voice:${channelId}`).emit('voice-participant-left', {
            channelId,
            odimUserId: userId
          });
          this.broadcastVoiceParticipants(channelId);
        }
      });
    }
  }

  private broadcastVoiceParticipants(channelId: string) {
    const channel = this.voiceChannels.get(channelId);
    const participants = channel
      ? Array.from(channel.participants.values())
      : [];

    this.server.to(`voice:${channelId}`).emit('voice-participants', {
      channelId,
      participants
    });
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
    const roomKey = `chat:${payload.channelId}:messages`;
    this.server.to(payload.channelId).emit(roomKey, message);

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

  // ============================================
  // VOICE/VIDEO CHANNEL EVENTS
  // ============================================

  @SubscribeMessage('join-voice-channel')
  async handleJoinVoiceChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      channelId: string;
      serverId: string;
      username: string;
      imageUrl?: string;
    }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.channelId) return;

    // First leave any existing voice channel
    this.voiceChannels.forEach((channel, channelId) => {
      if (channel.participants.has(userId)) {
        channel.participants.delete(userId);
        client.leave(`voice:${channelId}`);
        this.server.to(`voice:${channelId}`).emit('voice-participant-left', {
          channelId,
          odimUserId: userId
        });
        this.broadcastVoiceParticipants(channelId);
      }
    });

    // Create channel if doesn't exist
    if (!this.voiceChannels.has(payload.channelId)) {
      this.voiceChannels.set(payload.channelId, {
        participants: new Map()
      });
    }

    const voiceChannel = this.voiceChannels.get(payload.channelId)!;

    // Add participant
    const participant: VoiceParticipant = {
      odimUserId: userId,
      odimSocketId: client.id,
      username: payload.username,
      imageUrl: payload.imageUrl,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isScreenSharing: false
    };

    voiceChannel.participants.set(userId, participant);

    // Join the voice room
    client.join(`voice:${payload.channelId}`);
    client.data.currentVoiceChannel = payload.channelId;

    console.log(`User ${payload.username} joined voice channel ${payload.channelId}`);

    // Notify others of new participant
    client.to(`voice:${payload.channelId}`).emit('voice-participant-joined', {
      channelId: payload.channelId,
      participant
    });

    // Send current participants to the new user
    this.broadcastVoiceParticipants(payload.channelId);

    // Return existing participants for WebRTC connection setup
    const existingParticipants = Array.from(voiceChannel.participants.values())
      .filter(p => p.odimUserId !== userId);

    return { existingParticipants };
  }

  @SubscribeMessage('leave-voice-channel')
  handleLeaveVoiceChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.channelId) return;

    const voiceChannel = this.voiceChannels.get(payload.channelId);
    if (!voiceChannel) return;

    voiceChannel.participants.delete(userId);
    client.leave(`voice:${payload.channelId}`);
    client.data.currentVoiceChannel = null;

    console.log(`User ${userId} left voice channel ${payload.channelId}`);

    // Notify others
    this.server.to(`voice:${payload.channelId}`).emit('voice-participant-left', {
      channelId: payload.channelId,
      odimUserId: userId
    });

    this.broadcastVoiceParticipants(payload.channelId);

    // Clean up empty channels
    if (voiceChannel.participants.size === 0) {
      this.voiceChannels.delete(payload.channelId);
    }
  }

  @SubscribeMessage('voice-state-update')
  handleVoiceStateUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      channelId: string;
      isMuted?: boolean;
      isDeafened?: boolean;
      isVideoOn?: boolean;
      isScreenSharing?: boolean;
    }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.channelId) return;

    const voiceChannel = this.voiceChannels.get(payload.channelId);
    if (!voiceChannel) return;

    const participant = voiceChannel.participants.get(userId);
    if (!participant) return;

    // Update state
    if (payload.isMuted !== undefined) participant.isMuted = payload.isMuted;
    if (payload.isDeafened !== undefined) participant.isDeafened = payload.isDeafened;
    if (payload.isVideoOn !== undefined) participant.isVideoOn = payload.isVideoOn;
    if (payload.isScreenSharing !== undefined) participant.isScreenSharing = payload.isScreenSharing;

    // Broadcast state change to all in channel
    this.server.to(`voice:${payload.channelId}`).emit('voice-state-changed', {
      channelId: payload.channelId,
      odimUserId: userId,
      isMuted: participant.isMuted,
      isDeafened: participant.isDeafened,
      isVideoOn: participant.isVideoOn,
      isScreenSharing: participant.isScreenSharing
    });
  }

  // ============================================
  // WebRTC SIGNALING EVENTS
  // ============================================

  @SubscribeMessage('webrtc-offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      channelId: string;
    }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.targetUserId || !payload.offer) return;

    const voiceChannel = this.voiceChannels.get(payload.channelId);
    if (!voiceChannel) return;

    const targetParticipant = voiceChannel.participants.get(payload.targetUserId);
    if (!targetParticipant) return;

    // Send offer to target user
    this.server.to(targetParticipant.odimSocketId).emit('webrtc-offer', {
      fromUserId: userId,
      offer: payload.offer,
      channelId: payload.channelId
    });

    console.log(`WebRTC offer from ${userId} to ${payload.targetUserId}`);
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      targetUserId: string;
      answer: RTCSessionDescriptionInit;
      channelId: string;
    }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.targetUserId || !payload.answer) return;

    const voiceChannel = this.voiceChannels.get(payload.channelId);
    if (!voiceChannel) return;

    const targetParticipant = voiceChannel.participants.get(payload.targetUserId);
    if (!targetParticipant) return;

    // Send answer to target user
    this.server.to(targetParticipant.odimSocketId).emit('webrtc-answer', {
      fromUserId: userId,
      answer: payload.answer,
      channelId: payload.channelId
    });

    console.log(`WebRTC answer from ${userId} to ${payload.targetUserId}`);
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleICECandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
      channelId: string;
    }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.targetUserId || !payload.candidate) return;

    const voiceChannel = this.voiceChannels.get(payload.channelId);
    if (!voiceChannel) return;

    const targetParticipant = voiceChannel.participants.get(payload.targetUserId);
    if (!targetParticipant) return;

    // Send ICE candidate to target user
    this.server.to(targetParticipant.odimSocketId).emit('webrtc-ice-candidate', {
      fromUserId: userId,
      candidate: payload.candidate,
      channelId: payload.channelId
    });
  }

  @SubscribeMessage('get-voice-participants')
  handleGetVoiceParticipants(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string }
  ) {
    if (!payload.channelId) return { participants: [] };

    const voiceChannel = this.voiceChannels.get(payload.channelId);
    const participants = voiceChannel
      ? Array.from(voiceChannel.participants.values())
      : [];

    return { participants };
  }
}
