import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from '../stats.entity';
import { User } from '../../user/user.entity';
import { ReportStatistics } from '../../interfaces/report-statistics.interface';



@Injectable()
export class DataProcessorService {
    private readonly logger = new Logger(DataProcessorService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    /**
     * Procesa datos en lotes para datasets masivos
     */
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

    /**
     * Procesa datos con particionamiento para datasets enormes
     */
    async processPartitionedReport(startDate: Date, endDate: Date, partitionSize: number): Promise<ReportStatistics> {
        const partitions = this.createDatePartitions(startDate, endDate, partitionSize);
        this.logger.log(`Procesando ${partitions.length} particiones en paralelo`);

        // Procesar particiones en paralelo para mejor rendimiento
        const partitionPromises = partitions.map(async (partition) => {
            const partitionStats = await this.getStatsForPartition(partition.start, partition.end);
            return {
                period: partition,
                stats: partitionStats
            };
        });

        const partitionResults = await Promise.all(partitionPromises);
        return this.mergePartitionResults(partitionResults);
    }

    /**
     * Crea particiones de fechas para procesamiento paralelo
     */
    private createDatePartitions(startDate: Date, endDate: Date, partitionSize: number): Array<{ start: Date; end: Date }> {
        const partitions: Array<{ start: Date; end: Date }> = [];
        const currentDate = new Date(startDate);

        while (currentDate < endDate) {
            const partitionEnd = new Date(currentDate);
            partitionEnd.setDate(partitionEnd.getDate() + partitionSize);

            if (partitionEnd > endDate) {
                partitionEnd.setTime(endDate.getTime());
            }

            partitions.push({
                start: new Date(currentDate),
                end: partitionEnd
            });

            currentDate.setTime(partitionEnd.getTime());
        }

        return partitions;
    }

    /**
     * Obtiene estadísticas para una partición específica
     */
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

    /**
     * Combina resultados de particiones
     */
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

    /**
     * Calcula estadísticas estándar para datasets pequeños
     */
    async calculateStatistics(stats: Stats[], startDate: Date, endDate: Date): Promise<ReportStatistics> {
        const totalVisits = stats.length;

        // Contar usuarios únicos de forma simple
        const userIds = new Set();
        let totalAge = 0;
        let fCount = 0, mCount = 0, oCount = 0;
        let infancia = 0, juventud = 0, adultez_joven = 0, adultez_media = 0, vejez = 0;

        // Un solo loop para contar todo
        for (const stat of stats) {
            if (stat.userId) userIds.add(stat.userId);
            totalAge += stat.age;

            // Contar géneros
            if (stat.gender === 'F') fCount++;
            else if (stat.gender === 'M') mCount++;
            else oCount++;

            // Contar rangos de edad
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

    /**
     * Agrupa visitas por fecha para datasets pequeños
     */
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

    /**
     * Obtiene top usuarios para datasets pequeños
     */
    private async getTopUsers(stats: Stats[]) {
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

    /**
     * Rellena fechas faltantes en visitas por fecha
     */
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

    /**
     * Enriquece top usuarios con nombres
     */
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
}

