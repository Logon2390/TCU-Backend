import { Controller, Post, Body, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/create-report.dto';
import { ReportStatistics } from '../interfaces/report-statistics.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { VisitHistoryDto } from 'src/stats/dto/visit-history.dto';
import { StatsService } from 'src/stats/stats.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService, private readonly statsService: StatsService) { }

    /**
     * Genera un reporte completo basado en los parámetros proporcionados
     */
    @Post('generate')
    @Roles('admin', 'user')
    async generateReport(@Body() generateReportDto: GenerateReportDto): Promise<ReportStatistics> {
        return this.reportsService.generateReport(generateReportDto);
    }

    /**
     * Genera un reporte rápido para el día actual
     */
    @Get('today')
    @Roles('admin', 'user')
    async getTodayReport(): Promise<ReportStatistics> {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        return this.reportsService.generateReport({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    }

    /**
     * Genera un reporte para el mes actual
     */
    @Get('month')
    @Roles('admin', 'user')
    async getMonthReport(): Promise<ReportStatistics> {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return this.reportsService.generateReport({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    }

    /**
     * Genera un reporte para el año actual
     */
    @Get('year')
    @Roles('admin', 'user')
    async getYearReport(): Promise<ReportStatistics> {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), 0, 1);
        const endDate = new Date(today.getFullYear(), 11, 31);

        return this.reportsService.generateReport({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
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
        @Query('status') status?: string,
        @Query('ageRange') ageRange?: string
    ): Promise<ReportStatistics> {
        return this.reportsService.generateReport({
            startDate,
            endDate,
            gender: gender as 'F' | 'M' | 'O' | undefined,
            minAge,
            maxAge,
            userId,
            status: status as 'activo' | 'inactivo' | 'pendiente' | undefined,
            ageRange: ageRange as 'infancia' | 'juventud' | 'adultez_joven' | 'adultez_media' | 'vejez' | undefined
        });
    }


    // ENDPOINTS de historial de visitas 

    @Get('reports/visit-history')
    @Roles('M', 'A')
    async getVisitHistory(@Query() dto: VisitHistoryDto) {
        try {
            const history = await this.statsService.getVisitHistory(dto);
            return new ResponseDTO(
                true,
                'Historial de visitas obtenido correctamente',
                history
            );
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }


    //endpoint  
    @Get('reports/monthly-report/:year/:month')
    @Roles('M', 'A')
    async getMonthlyReport(
        @Param('year') year: string,
        @Param('month') month: string
    ) {
        try {
            // Generar reporte del mes completo
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0); // Último día del mes

            const dto: GenerateReportDto = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            };

            const report = await this.reportsService.generateReport(dto);
            return new ResponseDTO(
                true,
                `Reporte mensual generado para ${month}/${year}`,
                report
            );
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }

    @Get('reports/age-range-stats')
    @Roles('M', 'A')
    async getAgeRangeStats(@Query() dto: GenerateReportDto) {
        try {
            const report = await this.reportsService.generateReport(dto);

            // Extraer solo las estadísticas de rangos de edad
            const ageRangeStats = {
                period: `${dto.startDate} - ${dto.endDate}`,
                ageRanges: report.ageRangeDistribution,
                totalVisits: report.totalVisits
            };

            return new ResponseDTO(
                true,
                'Estadísticas por rangos de edad obtenidas correctamente',
                ageRangeStats
            );
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }

    @Get('reports/gender-stats')
    @Roles('M', 'A')
    async getGenderStats(@Query() dto: GenerateReportDto) {
        try {
            const report = await this.reportsService.generateReport(dto);

            // Extraer solo las estadísticas de género
            const genderStats = {
                period: `${dto.startDate} - ${dto.endDate}`,
                genderDistribution: report.genderDistribution,
                totalVisits: report.totalVisits
            };

            return new ResponseDTO(
                true,
                'Estadísticas por género obtenidas correctamente',
                genderStats
            );
        } catch (error) {
            return new ResponseDTO(false, error.message);
        }
    }
}

