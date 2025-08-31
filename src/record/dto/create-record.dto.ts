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

  @IsDateString({ strict: true })
  @Type(() => Date)
  visitedAt: Date;
}
