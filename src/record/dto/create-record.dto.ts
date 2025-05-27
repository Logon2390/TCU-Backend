import { IsDateString, IsInt } from 'class-validator';

export class CreateRecordDto {
  @IsInt()
  userId: number;

  @IsInt()
  moduleId: number;

  @IsDateString()
  date: Date;
}
