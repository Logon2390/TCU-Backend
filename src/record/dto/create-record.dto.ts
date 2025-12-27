import { IsDateString, IsNumber, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class CreateRecordDto {
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;

  @IsNumber()
  @Type(() => Number)
  moduleId: number;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  visitedAt: Date;
}
