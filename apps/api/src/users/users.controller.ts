import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() body: { username?: string; bio?: string; customStatus?: string; imageUrl?: string }) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @UseGuards(AuthGuard)
  @Patch('status')
  updateStatus(@Request() req: any, @Body() body: { status: string }) {
    return this.usersService.updateStatus(req.user.sub, body.status);
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}
