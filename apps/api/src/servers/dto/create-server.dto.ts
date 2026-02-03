import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}
