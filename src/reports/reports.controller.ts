import { Controller, Post, Body, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/create-report.dto';
import { ReportStatistics } from '../interfaces/report-statistics.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    /**
     * Genera un reporte completo basado en los parámetros proporcionados
     */
    @Post('generate')
    @Roles('admin', 'user')
    async generateReport(@Body() generateReportDto: GenerateReportDto) {
        try {
            const report = await this.reportsService.generateReport(generateReportDto);
            return new ResponseDTO(true, 'Reporte generado correctamente', report);
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }

    /**
     * Genera un reporte rápido para el día actual
     */
    @Get('today')
    async getTodayReport() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        try {
            const report = await this.reportsService.generateReport({
                startDate: dateStr,
                endDate: dateStr
            });
            return new ResponseDTO(true, 'Reporte del día obtenido correctamente', report);
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }

    /**
     * Genera un reporte para el mes actual
     */
    @Get('month')
    @Roles('admin', 'user')
    async getMonthReport() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const startDateStr = `${yyyy}-${mm}-01`;
        const endDate = new Date(yyyy, today.getMonth() + 1, 0);
        const endDateStr = `${yyyy}-${mm}-${String(endDate.getDate()).padStart(2, '0')}`;

        try {
            const report = await this.reportsService.generateReport({
                startDate: startDateStr,
                endDate: endDateStr
            });
            return new ResponseDTO(true, 'Reporte del mes obtenido correctamente', report);
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }

    /**
     * Genera un reporte para el año actual
     */
    @Get('year')
    @Roles('admin', 'user')
    async getYearReport() {
        const today = new Date();
        const yyyy = today.getFullYear();
        try {
            const report = await this.reportsService.generateReport({
                startDate: `${yyyy}-01-01`,
                endDate: `${yyyy}-12-31`
            });
            return new ResponseDTO(true, 'Reporte del año obtenido correctamente', report);
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }

    /**
     * Genera un reporte personalizado por rango de fechas
     */
    @Get('custom')
    @Roles('admin', 'user')
    async getCustomReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('gender') gender?: string,
        @Query('minAge') minAge?: number,
        @Query('maxAge') maxAge?: number,
        @Query('userId') userId?: number,
        @Query('ageRange') ageRange?: string,
        @Query('moduleId') moduleId?: number,
    ) {
        try {
            const report = await this.reportsService.generateReport({
                startDate,
                endDate,
                gender: gender as 'F' | 'M' | 'O' | undefined,
                minAge,
                maxAge,
                userId,
                ageRange: ageRange as 'infancia' | 'juventud' | 'adultez_joven' | 'adultez_media' | 'vejez' | undefined,
                moduleId
            });
            return new ResponseDTO(true, 'Reporte personalizado generado correctamente', report);
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }
}