import { Controller, Post, Delete, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @UseGuards(AuthGuard)
  @Post()
  toggle(@Request() req: any, @Body() body: { messageId: string; emoji: string }) {
    return this.reactionsService.toggleReaction(req.user.sub, body.messageId, body.emoji);
  }

  @Get('message/:messageId')
  getForMessage(@Param('messageId') messageId: string) {
    return this.reactionsService.getReactionsForMessage(messageId);
  }
}
