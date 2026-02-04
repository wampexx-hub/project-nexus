import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Request() req: any, @Body() createServerDto: CreateServerDto) {
    console.log('Creating server with data:', createServerDto);
    console.log('User ID:', req.user.sub);
    return this.serversService.create(createServerDto, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Request() req: any) {
    return this.serversService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/invite-code')
  regenerateInviteCode(@Request() req: any, @Param('id') id: string) {
    return this.serversService.regenerateInviteCode(id, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('join/:inviteCode')
  joinServer(@Request() req: any, @Param('inviteCode') inviteCode: string) {
    return this.serversService.joinByInviteCode(inviteCode, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateServerDto: UpdateServerDto) {
    return this.serversService.update(id, updateServerDto, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.serversService.remove(id, req.user.sub);
  }
}
