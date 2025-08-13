import { IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  document: string; // Número de cédula del usuario

  @IsString()
  moduleId: number;

  @IsDateString()
  date: Date;

  // Campos opcionales para crear usuario si no existe
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['F', 'M', 'O'])
  gender?: 'F' | 'M' | 'O';

  @IsOptional()
  @IsDateString()
  birthday?: Date;
}
