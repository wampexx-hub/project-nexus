import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(AuthGuard)
  @Post()
  createOrGet(@Request() req: any, @Body() body: { targetUserId: string }) {
    return this.conversationsService.getOrCreateConversation(req.user.sub, body.targetUserId);
  }

  @UseGuards(AuthGuard)
  @Get()
  getAll(@Request() req: any) {
    return this.conversationsService.getUserConversations(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getOne(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.getConversation(id, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':id/messages')
  getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversationsService.getMessages(id, req.user.sub, cursor);
  }
}
