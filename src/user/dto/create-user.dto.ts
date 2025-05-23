import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsEnum(['F', 'M', 'O'])
  gender: 'F' | 'M' | 'O';

  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @IsOptional()
  @IsDateString()
  lastRecord?: Date;
}
