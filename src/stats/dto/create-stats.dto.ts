import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsNumber } from "class-validator";
import { CreateUserDto } from "src/user/dto/create-user.dto";
export class CreateStatsDto {

    @IsNotEmpty()
    @IsDateString()
    entryDateTime: Date;

    @IsOptional()
    @IsDateString()
    exitDateTime: Date;

    @IsNotEmpty()
    @IsEnum(['F', 'M', 'O'])
    gender: 'F' | 'M' | 'O';

    @IsNotEmpty()
    @IsNumber()
    age: number;

    @IsOptional()
    @IsString()
    user: CreateUserDto;

    @IsOptional()
    @IsNumber()
    userId: number;

    @IsOptional()
    @IsString()
    notes: string;

    @IsNotEmpty()
    @IsEnum(['registrada', 'anulada'])
    status: 'registrada' | 'anulada'

    @IsNotEmpty()
    @IsNumber()
    year: number;

    @IsNotEmpty()
    @IsNumber()
    month: number;

}