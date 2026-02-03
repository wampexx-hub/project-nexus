import { Controller, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MembersService } from './members.service';
import { UpdateMemberDto } from '../servers/dto/member.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('servers/:serverId/members')
export class MembersController {
    constructor(private readonly membersService: MembersService) { }

    @UseGuards(AuthGuard)
    @Patch(':memberId')
    updateRole(
        @Request() req: any,
        @Param('serverId') serverId: string,
        @Param('memberId') memberId: string,
        @Body() updateMemberDto: UpdateMemberDto
    ) {
        return this.membersService.updateRole(serverId, memberId, updateMemberDto, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Delete(':memberId')
    kickMember(
        @Request() req: any,
        @Param('serverId') serverId: string,
        @Param('memberId') memberId: string
    ) {
        return this.membersService.kickMember(serverId, memberId, req.user.sub);
    }
}
