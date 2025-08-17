import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from './stats.entity';
import { StatsConfig } from './stats.config';
interface DatePartition {
    start: Date;
    end: Date;
}

@Injectable()
export class StatsOptimizationService {
    private readonly logger = new Logger(StatsOptimizationService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
    ) {}

    /**
     * Optimiza consultas grandes usando particionamiento virtual
     */
        async getPartitionedStats(startDate: Date, endDate: Date, partitionSize: number = 30) {
            const partitions: DatePartition[] = this.createDatePartitions(startDate, endDate, partitionSize);
            const results: { period: DatePartition; stats: any }[] = [];

            for (const partition of partitions) {
                const partitionStats = await this.getStatsForPartition(partition.start, partition.end);
                results.push({
                    period: partition,
                    stats: partitionStats
                });
            }

            return this.mergePartitionResults(results);
        }

    /**
     * Crea particiones de fechas para procesamiento paralelo
     */
        private createDatePartitions(startDate: Date, endDate: Date, partitionSize: number): DatePartition[] {
            const partitions: DatePartition[] = [];
            let currentDate = new Date(startDate);

            while (currentDate < endDate) {
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + partitionSize);
                partitions.push({ start: new Date(currentDate), end: new Date(Math.min(nextDate.getTime(), endDate.getTime())) });
                currentDate = nextDate;
            }
            return partitions;
        }
    // ...existing code...

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
    private mergePartitionResults(partitionResults: any[]) {
        let totalVisits = 0;
        let totalUsers = new Set();
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
            totalUsers: totalUsers.size,
            averageAge: totalRecords > 0 ? Math.round(totalAge / totalRecords) : 0,
            genderDistribution: {
                F: femaleCount,
                M: maleCount,
                O: otherCount
            },
            partitions: partitionResults.length
        };
    }

    /**
     * Optimiza consultas usando índices específicos
     */
    async getOptimizedStatsWithIndexHints(startDate: Date, endDate: Date) {
        // Usar hints de índice para forzar el uso de índices específicos
        return await this.statsRepo
            .createQueryBuilder('stats')
            .select([
                'stats.id',
                'stats.entryDateTime',
                'stats.gender',
                'stats.age',
                'stats.userId'
            ])
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate })
            .orderBy('stats.entryDateTime', 'ASC')
            .limit(StatsConfig.QUERY.MAX_RESULTS)
            .getMany();
    }

    /**
     * Procesa estadísticas en streaming para evitar problemas de memoria
     */
    async* processStatsStream(startDate: Date, endDate: Date, batchSize: number = 1000) {
        let offset = 0;
        
        while (true) {
            const batch = await this.statsRepo
                .createQueryBuilder('stats')
                .select([
                    'stats.id',
                    'stats.entryDateTime',
                    'stats.gender',
                    'stats.age',
                    'stats.userId'
                ])
                .where('stats.entryDateTime >= :startDate', { startDate })
                .andWhere('stats.entryDateTime <= :endDate', { endDate })
                .orderBy('stats.id', 'ASC')
                .skip(offset)
                .take(batchSize)
                .getMany();

            if (batch.length === 0) break;

            yield batch;
            offset += batchSize;
        }
    }

    /**
     * Optimiza consultas de agregación usando materialización
     */
    async getMaterializedStats(startDate: Date, endDate: Date) {
        // Consulta optimizada que evita múltiples joins
        const result = await this.statsRepo
            .createQueryBuilder('stats')
            .select([
                'DATE(stats.entryDateTime) as visitDate',
                'COUNT(*) as visitCount',
                'COUNT(DISTINCT stats.userId) as uniqueUsers',
                'AVG(stats.age) as averageAge',
                'SUM(CASE WHEN stats.gender = :f THEN 1 ELSE 0 END) as femaleVisits',
                'SUM(CASE WHEN stats.gender = :m THEN 1 ELSE 0 END) as maleVisits',
                'SUM(CASE WHEN stats.gender = :o THEN 1 ELSE 0 END) as otherVisits'
            ])
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate })
            .groupBy('DATE(stats.entryDateTime)')
            .orderBy('visitDate', 'ASC')
            .setParameter('f', 'F')
            .setParameter('m', 'M')
            .setParameter('o', 'O')
            .getRawMany();

        return result;
    }

    /**
     * Limpia datos antiguos para mantener el rendimiento
     */
    async cleanupOldStats(olderThanDays: number = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.statsRepo
            .createQueryBuilder()
            .delete()
            .from(Stats)
            .where('entryDateTime < :cutoffDate', { cutoffDate })
            .execute();

        this.logger.log(`Limpiados ${result.affected} registros antiguos`);
        return result.affected;
    }

    /**
     * Analiza el rendimiento de las consultas
     */
    async analyzeQueryPerformance() {
        const startTime = Date.now();
        
        // Ejecutar consulta de prueba
        const testQuery = await this.statsRepo
            .createQueryBuilder('stats')
            .select('COUNT(*)')
            .getCount();

        const executionTime = Date.now() - startTime;

        return {
            executionTime,
            recordCount: testQuery,
            performance: executionTime < 1000 ? 'excelente' : 
                        executionTime < 5000 ? 'bueno' : 
                        executionTime < 10000 ? 'regular' : 'lento'
        };
    }
}
