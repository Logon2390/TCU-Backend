import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class GenerateReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(['F', 'M', 'O'])
  gender?: 'F' | 'M' | 'O';

  @IsOptional()
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsEnum(['infancia', 'juventud', 'adultez_joven', 'adultez_media', 'vejez'])
  ageRange?: 'infancia' | 'juventud' | 'adultez_joven' | 'adultez_media' | 'vejez';

  @IsOptional()
  @IsNumber()
  moduleId?: number;
}
