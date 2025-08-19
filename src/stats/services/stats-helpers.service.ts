import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, SelectQueryBuilder } from 'typeorm';
import { Stats } from '../stats.entity';
import { CreateStatsDto } from '../dto/create-stats.dto';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { User } from '../../user/user.entity';
import { StatsConfig } from '../stats.config';
import { ReportStatistics } from '../../interfaces/report-statistics.interface';
import { GenerateReportDto } from '../../reports/dto/create-report.dto';

@Injectable()
export class StatsHelpersService {
    private readonly logger = new Logger(StatsHelpersService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    // --- Métodos fusionados de BasicStatsService ---
    // CRUD, validaciones y helpers básicos
    // ...mueve aquí los métodos de BasicStatsService...


    // --- Métodos de procesamiento de datos y helpers ---
    async processBatchReport(startDate: Date, endDate: Date, batchSize: number): Promise<ReportStatistics> {
        this.logger.log(`Procesando reporte en lotes de ${batchSize} registros`);
        let offset = 0;
        let allStats: Stats[] = [];
        while (true) {
            const batch = await this.statsRepo
                .createQueryBuilder('stats')
                .leftJoinAndSelect('stats.user', 'user')
                .where('stats.entryDateTime >= :startDate', { startDate })
                .andWhere('stats.entryDateTime <= :endDate', { endDate })
                .orderBy('stats.id', 'ASC')
                .skip(offset)
                .take(batchSize)
                .getMany();
            if (batch.length === 0) break;
            allStats = allStats.concat(batch);
            offset += batchSize;
            this.logger.log(`Procesados ${offset} registros...`);
        }
        return this.calculateStatistics(allStats, startDate, endDate);
    }

    async processPartitionedReport(startDate: Date, endDate: Date, partitionSize: number): Promise<ReportStatistics> {
        const partitions = this.createDatePartitions(startDate, endDate, partitionSize);
        this.logger.log(`Procesando ${partitions.length} particiones en paralelo`);
        const partitionPromises = partitions.map(async (partition) => {
            const partitionStats = await this.getStatsForPartition(partition.start, partition.end);
            return { period: partition, stats: partitionStats };
        });
        const partitionResults = await Promise.all(partitionPromises);
        return this.mergePartitionResults(partitionResults);
    }

    private createDatePartitions(startDate: Date, endDate: Date, partitionSize: number): Array<{ start: Date; end: Date }> {
        const partitions: Array<{ start: Date; end: Date }> = [];
        const currentDate = new Date(startDate);
        while (currentDate < endDate) {
            const partitionEnd = new Date(currentDate);
            partitionEnd.setDate(partitionEnd.getDate() + partitionSize);
            if (partitionEnd > endDate) {
                partitionEnd.setTime(endDate.getTime());
            }
            partitions.push({ start: new Date(currentDate), end: partitionEnd });
            currentDate.setTime(partitionEnd.getTime());
        }
        return partitions;
    }

    private async getStatsForPartition(startDate: Date, endDate: Date) {
        return await this.statsRepo
            .createQueryBuilder('stats')
            .select([
                'COUNT(*) as totalVisits',
                'COUNT(DISTINCT stats.userId) as uniqueUsers',
                'AVG(stats.age) as avgAge',
                'SUM(CASE WHEN stats.gender = :f THEN 1 ELSE 0 END) as femaleCount',
                'SUM(CASE WHEN stats.gender = :m THEN 1 ELSE 0 END) as maleCount',
                'SUM(CASE WHEN stats.gender = :o THEN 1 ELSE 0 END) as otherCount'
            ])
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate })
            .setParameter('f', 'F')
            .setParameter('m', 'M')
            .setParameter('o', 'O')
            .getRawOne();
    }

    private mergePartitionResults(partitionResults: any[]): ReportStatistics {
        let totalVisits = 0;
        let totalAge = 0;
        let totalRecords = 0;
        let femaleCount = 0;
        let maleCount = 0;
        let otherCount = 0;
        for (const result of partitionResults) {
            const stats = result.stats;
            totalVisits += parseInt(stats.totalVisits);
            totalAge += parseFloat(stats.avgAge) * parseInt(stats.totalVisits);
            totalRecords += parseInt(stats.totalVisits);
            femaleCount += parseInt(stats.femaleCount);
            maleCount += parseInt(stats.maleCount);
            otherCount += parseInt(stats.otherCount);
        }
        return {
            totalVisits,
            totalUsers: 0, // Se calculará por separado para datasets enormes
            genderDistribution: { F: femaleCount, M: maleCount, O: otherCount },
            ageRangeDistribution: { infancia: 0, juventud: 0, adultez_joven: 0, adultez_media: 0, vejez: 0 },
            averageAge: totalRecords > 0 ? Math.round(totalAge / totalRecords) : 0,
            visitsByDate: [],
            topUsers: []
        };
    }

    async calculateStatistics(stats: Stats[], startDate: Date, endDate: Date): Promise<ReportStatistics> {
        const totalVisits = stats.length;
        const userIds = new Set();
        let totalAge = 0;
        let fCount = 0, mCount = 0, oCount = 0;
        let infancia = 0, juventud = 0, adultez_joven = 0, adultez_media = 0, vejez = 0;
        for (const stat of stats) {
            if (stat.userId) userIds.add(stat.userId);
            totalAge += stat.age;
            if (stat.gender === 'F') fCount++;
            else if (stat.gender === 'M') mCount++;
            else oCount++;
            if (stat.age <= 14) infancia++;
            else if (stat.age <= 24) juventud++;
            else if (stat.age <= 44) adultez_joven++;
            else if (stat.age <= 64) adultez_media++;
            else vejez++;
        }
        return {
            totalVisits,
            totalUsers: userIds.size,
            genderDistribution: { F: fCount, M: mCount, O: oCount },
            ageRangeDistribution: { infancia, juventud, adultez_joven, adultez_media, vejez },
            averageAge: totalVisits > 0 ? Math.round(totalAge / totalVisits) : 0,
            visitsByDate: this.groupVisitsByDate(stats, startDate, endDate),
            topUsers: await this.getTopUsers(stats)
        };
    }

    private groupVisitsByDate(stats: Stats[], startDate: Date, endDate: Date) {
        const visitsByDate: Array<{ date: string; count: number }> = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            let count = 0;
            for (const stat of stats) {
                if (stat.entryDateTime.toISOString().split('T')[0] === dateStr) count++;
            }
            visitsByDate.push({ date: dateStr, count });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return visitsByDate;
    }

    async getTopUsers(stats: Stats[]) {
        const userCounts: { [key: number]: number } = {};
        for (const stat of stats) {
            if (stat.userId) {
                userCounts[stat.userId] = (userCounts[stat.userId] || 0) + 1;
            }
        }
        const topUsers: Array<{ userId: number; userName: string; visitCount: number }> = [];
        for (const userId in userCounts) {
            const user = await this.userRepo.findOne({ where: { id: parseInt(userId) } });
            if (user) {
                topUsers.push({
                    userId: parseInt(userId),
                    userName: user.name,
                    visitCount: userCounts[userId]
                });
            }
        }
        return topUsers.sort((a, b) => b.visitCount - a.visitCount).slice(0, 10);
    }

    fillMissingDates(visitsByDate: any[], startDate: Date, endDate: Date) {
        const result: Array<{ date: string; count: number }> = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const existing = visitsByDate.find(v => v.date === dateStr);
            result.push({
                date: dateStr,
                count: existing ? parseInt(existing.count) : 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return result;
    }

    async enrichTopUsers(topUsersRaw: any[]) {
        const userIds = topUsersRaw.map(u => u.userId);
        const users = await this.userRepo
            .createQueryBuilder('user')
            .select(['user.id', 'user.name'])
            .where('user.id IN (:...userIds)', { userIds })
            .getMany();
        const userMap = new Map(users.map(u => [u.id, u.name]));
        return topUsersRaw.map(u => ({
            userId: u.userId,
            userName: userMap.get(u.userId) || 'Usuario Desconocido',
            visitCount: parseInt(u.visitCount)
        }));
    }


    // --- Métodos de construcción de queries y helpers de estrategia ---
    buildBaseQuery(
        queryBuilder: SelectQueryBuilder<Stats>,
        dto: GenerateReportDto,
        startDate: Date,
        endDate: Date
    ): SelectQueryBuilder<Stats> {
        let query = queryBuilder
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate });
        if (dto.gender) {
            query = query.andWhere('stats.gender = :gender', { gender: dto.gender });
        }
        if (dto.minAge !== undefined) {
            query = query.andWhere('stats.age >= :minAge', { minAge: dto.minAge });
        }
        if (dto.maxAge !== undefined) {
            query = query.andWhere('stats.age <= :maxAge', { maxAge: dto.maxAge });
        }
        if (dto.userId) {
            query = query.andWhere('stats.userId = :userId', { userId: dto.userId });
        }
        if (dto.status) {
            query = query.andWhere('stats.status = :status', { status: dto.status });
        }
        if (dto.ageRange) {
            const { minAge, maxAge } = this.getAgeRange(dto.ageRange);
            query = query.andWhere('stats.age BETWEEN :minAge AND :maxAge', { minAge, maxAge });
        }
        return query;
    }

    getAgeRange(ageRange: string): { minAge: number; maxAge: number } {
        switch (ageRange) {
            case 'infancia': return { minAge: 0, maxAge: 14 };
            case 'juventud': return { minAge: 15, maxAge: 24 };
            case 'adultez_joven': return { minAge: 25, maxAge: 44 };
            case 'adultez_media': return { minAge: 45, maxAge: 64 };
            case 'vejez': return { minAge: 65, maxAge: 120 };
            default: return { minAge: 0, maxAge: 120 };
        }
    }

    buildAggregatedStatsQuery(baseQuery: SelectQueryBuilder<Stats>): SelectQueryBuilder<Stats> {
        return baseQuery
            .select([
                'COUNT(*) as totalVisits',
                'COUNT(DISTINCT stats.userId) as totalUsers',
                'AVG(stats.age) as averageAge',
                'SUM(CASE WHEN stats.gender = :f THEN 1 ELSE 0 END) as fCount',
                'SUM(CASE WHEN stats.gender = :m THEN 1 ELSE 0 END) as mCount',
                'SUM(CASE WHEN stats.gender = :o THEN 1 ELSE 0 END) as oCount',
                'SUM(CASE WHEN stats.age <= 14 THEN 1 ELSE 0 END) as infancia',
                'SUM(CASE WHEN stats.age BETWEEN 15 AND 24 THEN 1 ELSE 0 END) as juventud',
                'SUM(CASE WHEN stats.age BETWEEN 25 AND 44 THEN 1 ELSE 0 END) as adultez_joven',
                'SUM(CASE WHEN stats.age BETWEEN 45 AND 64 THEN 1 ELSE 0 END) as adultez_media',
                'SUM(CASE WHEN stats.age >= 65 THEN 1 ELSE 0 END) as vejez'
            ])
            .setParameter('f', 'F')
            .setParameter('m', 'M')
            .setParameter('o', 'O');
    }

    buildVisitsByDateQuery(baseQuery: SelectQueryBuilder<Stats>): SelectQueryBuilder<Stats> {
        return baseQuery
            .select([
                'DATE(stats.entryDateTime) as date',
                'COUNT(*) as count'
            ])
            .groupBy('DATE(stats.entryDateTime)')
            .orderBy('date', 'ASC');
    }

    buildTopUsersQuery(baseQuery: SelectQueryBuilder<Stats>): SelectQueryBuilder<Stats> {
        return baseQuery
            .select([
                'stats.userId',
                'COUNT(*) as visitCount'
            ])
            .andWhere('stats.userId IS NOT NULL')
            .groupBy('stats.userId')
            .orderBy('visitCount', 'DESC')
            .limit(10);
    }

    async getDatasetSize(startDate: Date, endDate: Date): Promise<number> {
        return await this.statsRepo
            .createQueryBuilder('stats')
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate })
            .getCount();
    }

    getAdaptiveBatchSize(datasetSize: number): number {
        if (datasetSize <= StatsConfig.THRESHOLDS.MEDIUM_DATASET) return StatsConfig.THRESHOLDS.BATCH_SIZE_SMALL;
        if (datasetSize <= StatsConfig.THRESHOLDS.LARGE_DATASET) return StatsConfig.THRESHOLDS.BATCH_SIZE_MEDIUM;
        if (datasetSize <= StatsConfig.THRESHOLDS.MASSIVE_DATASET) return StatsConfig.THRESHOLDS.BATCH_SIZE_LARGE;
        return StatsConfig.THRESHOLDS.BATCH_SIZE_HUGE;
    }

    calculateOptimalPartitionSize(startDate: Date, endDate: Date): number {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 30) return 7;
        if (daysDiff <= 90) return 15;
        if (daysDiff <= 365) return 30;
        return 60;
    }

    // Puedes organizar los métodos por región o comentario para claridad
}
