import { IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    fileUrl?: string;

    @IsString()
    channelId: string;

    @IsString()
    serverId: string;
}
