import { Controller, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto } from '../servers/dto/channel.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('channels')
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService) { }

    @UseGuards(AuthGuard)
    @Post()
    create(@Request() req: any, @Body() createChannelDto: CreateChannelDto) {
        return this.channelsService.create(createChannelDto, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateChannelDto: UpdateChannelDto
    ) {
        return this.channelsService.update(id, updateChannelDto, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    delete(@Request() req: any, @Param('id') id: string) {
        return this.channelsService.delete(id, req.user.sub);
    }
}
