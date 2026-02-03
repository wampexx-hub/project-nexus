import { Controller, Get, Post, Delete, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('statistics')
    getStatistics() {
        return this.adminService.getStatistics();
    }

    @Get('users')
    getAllUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.adminService.getAllUsers(parseInt(page), parseInt(limit));
    }

    @Post('users/:id/ban')
    banUser(@Param('id') id: string) {
        return this.adminService.banUser(id);
    }

    @Post('users/:id/unban')
    unbanUser(@Param('id') id: string) {
        return this.adminService.unbanUser(id);
    }

    @Post('users/:id/make-admin')
    makeAdmin(@Param('id') id: string) {
        return this.adminService.makeAdmin(id);
    }

    @Post('users/:id/remove-admin')
    removeAdmin(@Param('id') id: string) {
        return this.adminService.removeAdmin(id);
    }

    @Delete('users/:id')
    deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Get('servers')
    getAllServers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.adminService.getAllServers(parseInt(page), parseInt(limit));
    }

    @Delete('servers/:id')
    deleteServer(@Param('id') id: string) {
        return this.adminService.deleteServer(id);
    }

    @Get('messages/recent')
    getRecentMessages(@Query('limit') limit: string = '50') {
        return this.adminService.getRecentMessages(parseInt(limit));
    }
}
