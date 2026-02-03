import { IsEnum, IsString } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class UpdateMemberDto {
    @IsEnum(MemberRole)
    role: MemberRole;
}

export class KickMemberDto {
    @IsString()
    memberId: string;
}
