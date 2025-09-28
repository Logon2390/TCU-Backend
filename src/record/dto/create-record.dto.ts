import { IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class CreateRecordDto {
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;

  @IsNumber()
  @Type(() => Number)
  moduleId: number;

  @IsDateString()
  @Type(() => Date)
  visitedAt: Date;
}
