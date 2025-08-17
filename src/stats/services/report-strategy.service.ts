import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from '../stats.entity';
import { User } from '../../user/user.entity';
import { GenerateReportDto } from '../../reports/dto/create-report.dto';
import { ReportStatistics } from '../interfaces/report-statistics.interface';
import { StatsConfig } from '../stats.config';

@Injectable()
export class ReportStrategyService {
    private readonly logger = new Logger(ReportStrategyService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) {}

    /**
     * Determina la estrategia basada en el tamaño del dataset
     */
    determineStrategy(datasetSize: number): 'SMALL' | 'MEDIUM' | 'LARGE' | 'MASSIVE' | 'HUGE' {
        if (datasetSize <= StatsConfig.THRESHOLDS.SMALL_DATASET) return 'SMALL';
        if (datasetSize <= StatsConfig.THRESHOLDS.MEDIUM_DATASET) return 'MEDIUM';
        if (datasetSize <= StatsConfig.THRESHOLDS.LARGE_DATASET) return 'LARGE';
        if (datasetSize <= StatsConfig.THRESHOLDS.MASSIVE_DATASET) return 'MASSIVE';
        return 'HUGE';
    }

    /**
     * Obtiene el tamaño del dataset para un rango de fechas
     */
    async getDatasetSize(startDate: Date, endDate: Date): Promise<number> {
        return await this.statsRepo
            .createQueryBuilder('stats')
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate })
            .getCount();
    }

    /**
     * Obtiene el tamaño de lote adaptativo según el dataset
     */
    getAdaptiveBatchSize(datasetSize: number): number {
        if (datasetSize <= StatsConfig.THRESHOLDS.MEDIUM_DATASET) return StatsConfig.THRESHOLDS.BATCH_SIZE_SMALL;
        if (datasetSize <= StatsConfig.THRESHOLDS.LARGE_DATASET) return StatsConfig.THRESHOLDS.BATCH_SIZE_MEDIUM;
        if (datasetSize <= StatsConfig.THRESHOLDS.MASSIVE_DATASET) return StatsConfig.THRESHOLDS.BATCH_SIZE_LARGE;
        return StatsConfig.THRESHOLDS.BATCH_SIZE_HUGE;
    }

    /**
     * Calcula el tamaño óptimo de partición según el rango de fechas
     */
    calculateOptimalPartitionSize(startDate: Date, endDate: Date): number {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 30) return 7;      // Semanas para períodos cortos
        if (daysDiff <= 90) return 15;     // Quincenas para períodos medianos
        if (daysDiff <= 365) return 30;    // Meses para períodos largos
        return 60;                         // Bimestres para períodos muy largos
    }

    /**
     * Verifica si se debe usar cache para un dataset
     */
    shouldUseCache(datasetSize: number): boolean {
        return datasetSize <= StatsConfig.THRESHOLDS.MEDIUM_DATASET;
    }

    /**
     * Obtiene el timeout recomendado para la estrategia
     */
    getRecommendedTimeout(strategy: string): number {
        switch (strategy) {
            case 'SMALL':
            case 'MEDIUM':
                return 10000; // 10 segundos
            case 'LARGE':
                return 30000; // 30 segundos
            case 'MASSIVE':
                return 60000; // 1 minuto
            case 'HUGE':
                return 120000; // 2 minutos
            default:
                return 30000;
        }
    }

    /**
     * Obtiene el límite de memoria recomendado para la estrategia
     */
    getRecommendedMemoryLimit(strategy: string): number {
        switch (strategy) {
            case 'SMALL':
                return 10 * 1024 * 1024; // 10MB
            case 'MEDIUM':
                return 25 * 1024 * 1024; // 25MB
            case 'LARGE':
                return 50 * 1024 * 1024; // 50MB
            case 'MASSIVE':
                return 100 * 1024 * 1024; // 100MB
            case 'HUGE':
                return 200 * 1024 * 1024; // 200MB
            default:
                return 50 * 1024 * 1024;
        }
    }
}
