import { IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class CreateRecordDto {
  @IsString()
  user: CreateUserDto;

  @IsString()
  moduleId: number;

  @IsDateString()
  date: Date;
}
