import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from '../stats.entity';
import { User } from '../../user/user.entity';
import { GenerateReportDto } from '../../reports/dto/create-report.dto';
import { ReportStatistics } from '../../interfaces/report-statistics.interface';
import { StatsHelpersService } from './stats-helpers.service';

@Injectable()
export class StatsReportsService {
    private readonly logger = new Logger(StatsReportsService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private helpers: StatsHelpersService,
    ) { }


    /**
     * Genera reporte estándar para datasets pequeños
     */
    async generateReportStandard(dto: GenerateReportDto, startDate: Date, endDate: Date): Promise<ReportStatistics> {
        let query = this.statsRepo
            .createQueryBuilder('stats')
            .leftJoinAndSelect('stats.user', 'user')
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate });

        query = this.helpers.buildBaseQuery(query, dto, startDate, endDate);
        const stats = await query.getMany();
        return this.helpers.calculateStatistics(stats, startDate, endDate);
    }

    /**
     * Genera reporte para datasets medianos
     */
    async generateReportMedium(dto: GenerateReportDto, startDate: Date, endDate: Date): Promise<ReportStatistics> {
        const baseQuery = this.statsRepo.createQueryBuilder('stats');
        const filteredQuery = this.helpers.buildBaseQuery(baseQuery, dto, startDate, endDate);
        const [aggregatedStats, visitsByDate, topUsers] = await Promise.all([
            this.getAggregatedStatsMedium(filteredQuery),
            this.getVisitsByDateMedium(filteredQuery, startDate, endDate),
            this.getTopUsersMedium(filteredQuery)
        ]);
        return this.buildReportFromAggregated(aggregatedStats, visitsByDate, topUsers);
    }

    /**
     * Genera reporte para datasets grandes
     */
    async generateReportLarge(dto: GenerateReportDto, startDate: Date, endDate: Date): Promise<ReportStatistics> {
        const baseQuery = this.statsRepo.createQueryBuilder('stats');
        const filteredQuery = this.helpers.buildBaseQuery(baseQuery, dto, startDate, endDate);
        const [aggregatedStats, visitsByDate, topUsers] = await Promise.all([
            this.getAggregatedStatsLarge(filteredQuery),
            this.getVisitsByDateLarge(filteredQuery, startDate, endDate),
            this.getTopUsersLarge(filteredQuery)
        ]);
        return this.buildReportFromAggregated(aggregatedStats, visitsByDate, topUsers);
    }

    /**
     * Genera reporte para datasets masivos
     */
    async generateReportMassive(dto: GenerateReportDto, startDate: Date, endDate: Date): Promise<ReportStatistics> {
        const datasetSize = await this.helpers.getDatasetSize(startDate, endDate);
        const batchSize = this.helpers.getAdaptiveBatchSize(datasetSize);
        this.logger.log(`Procesando dataset masivo en lotes de ${batchSize} registros`);
        return await this.helpers.processBatchReport(startDate, endDate, batchSize);
    }

    /**
     * Genera reporte para datasets enormes
     */
    async generateReportHuge(dto: GenerateReportDto, startDate: Date, endDate: Date): Promise<ReportStatistics> {
        this.logger.log('Procesando dataset enorme con particionamiento y streaming');
        const partitionSize = this.helpers.calculateOptimalPartitionSize(startDate, endDate);
        return await this.helpers.processPartitionedReport(startDate, endDate, partitionSize);
    }

    // Métodos auxiliares para datasets medianos
    private async getAggregatedStatsMedium(baseQuery: any) {
        const aggregatedQuery = this.helpers.buildAggregatedStatsQuery(baseQuery);
        return await aggregatedQuery.getRawOne();
    }

    private async getVisitsByDateMedium(baseQuery: any, startDate: Date, endDate: Date) {
        const dateQuery = baseQuery.clone();
        const visitsQuery = this.helpers.buildVisitsByDateQuery(dateQuery);
        const visitsByDate = await visitsQuery.getRawMany();
        return this.helpers.fillMissingDates(visitsByDate, startDate, endDate);
    }

    private async getTopUsersMedium(baseQuery: any) {
        const userQuery = baseQuery.clone();
        const topUsersQuery = this.helpers.buildTopUsersQuery(userQuery);
        const topUsersRaw = await topUsersQuery.getRawMany();
        return await this.helpers.enrichTopUsers(topUsersRaw);
    }

    // Métodos auxiliares para datasets grandes
    private async getAggregatedStatsLarge(baseQuery: any) {
        const aggregatedQuery = this.helpers.buildAggregatedStatsQuery(baseQuery);
        return await aggregatedQuery.getRawOne();
    }

    private async getVisitsByDateLarge(baseQuery: any, startDate: Date, endDate: Date) {
        const dateQuery = baseQuery.clone();
        const visitsQuery = this.helpers.buildVisitsByDateQuery(dateQuery);
        const visitsByDate = await visitsQuery.getRawMany();
        return this.helpers.fillMissingDates(visitsByDate, startDate, endDate);
    }

    private async getTopUsersLarge(baseQuery: any) {
        const userQuery = baseQuery.clone();
        const topUsersQuery = this.helpers.buildTopUsersQuery(userQuery);
        const topUsersRaw = await topUsersQuery.getRawMany();
        return await this.helpers.enrichTopUsers(topUsersRaw);
    }

    /**
     * Construye reporte desde datos agregados
     */
    private buildReportFromAggregated(aggregatedStats: any, visitsByDate: any[], topUsers: any[]): ReportStatistics {
        return {
            totalVisits: parseInt(aggregatedStats.totalVisits),
            totalUsers: parseInt(aggregatedStats.totalUsers),
            genderDistribution: {
                F: parseInt(aggregatedStats.fCount),
                M: parseInt(aggregatedStats.mCount),
                O: parseInt(aggregatedStats.oCount)
            },
            ageRangeDistribution: {
                infancia: parseInt(aggregatedStats.infancia),
                juventud: parseInt(aggregatedStats.juventud),
                adultez_joven: parseInt(aggregatedStats.adultez_joven),
                adultez_media: parseInt(aggregatedStats.adultez_media),
                vejez: parseInt(aggregatedStats.vejez)
            },
            averageAge: Math.round(parseFloat(aggregatedStats.averageAge) || 0),
            visitsByDate,
            topUsers
        };
    }

    // --- Métodos fusionados de ReportStrategyService ---
    // Estrategias de generación de reportes y lógica relacionada
    // ...mueve aquí los métodos de ReportStrategyService...
}
