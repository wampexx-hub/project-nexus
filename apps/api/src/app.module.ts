import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { SocketModule } from './socket/socket.module';
import { MessagesController } from './messages/messages.controller';
import { MessagesService } from './messages/messages.service';
import { ChannelsController } from './channels/channels.controller';
import { ChannelsService } from './channels/channels.service';
import { MembersController } from './members/members.controller';
import { MembersService } from './members/members.service';
import { AdminModule } from './admin/admin.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ReactionsModule } from './reactions/reactions.module';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ServersModule,
    SocketModule,
    AdminModule,
    ConversationsModule,
    ReactionsModule,
    SearchModule,
    UsersModule,
  ],
  controllers: [AppController, MessagesController, ChannelsController, MembersController],
  providers: [AppService, MessagesService, ChannelsService, MembersService],
})
export class AppModule { }
