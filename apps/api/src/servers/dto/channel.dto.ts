import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ChannelType } from '@prisma/client';

export class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(ChannelType)
    @IsNotEmpty()
    type: ChannelType;

    @IsString()
    @IsNotEmpty()
    serverId: string;
}

export class UpdateChannelDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(ChannelType)
    @IsOptional()
    type?: ChannelType;
}
