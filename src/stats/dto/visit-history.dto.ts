import { IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class VisitHistoryDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['registrada', 'anulada'])
  status?: 'registrada' | 'anulada';

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
