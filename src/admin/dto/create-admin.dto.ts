import { IsEmail, IsEnum, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['M', 'A'])
  role: 'M' | 'A';

  @IsNumber()
  accessCode: number;
}
