import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(AuthGuard)
  @Get('messages')
  searchMessages(
    @Request() req: any,
    @Query('q') query: string,
    @Query('serverId') serverId?: string,
    @Query('channelId') channelId?: string,
  ) {
    return this.searchService.searchMessages(req.user.sub, query, serverId, channelId);
  }

  @UseGuards(AuthGuard)
  @Get('users')
  searchUsers(@Query('q') query: string) {
    return this.searchService.searchUsers(query);
  }
}
