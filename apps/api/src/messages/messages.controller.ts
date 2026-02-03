import { Controller, Get, Patch, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @UseGuards(AuthGuard)
    @Get()
    async getMessages(
        @Query('cursor') cursor: string,
        @Query('channelId') channelId: string,
    ) {
        return this.messagesService.getMessages(cursor, channelId);
    }

    @UseGuards(AuthGuard)
    @Patch(':id')
    async updateMessage(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateMessageDto: UpdateMessageDto
    ) {
        return this.messagesService.updateMessage(id, updateMessageDto, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    async deleteMessage(
        @Request() req: any,
        @Param('id') id: string
    ) {
        return this.messagesService.deleteMessage(id, req.user.sub);
    }
}
