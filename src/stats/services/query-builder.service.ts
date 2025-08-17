import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Stats } from '../stats.entity';
import { GenerateReportDto } from '../../reports/dto/create-report.dto';

@Injectable()
export class QueryBuilderService {
    
    /**
     * Construye una consulta base con filtros aplicados
     */
    buildBaseQuery(
        queryBuilder: SelectQueryBuilder<Stats>,
        dto: GenerateReportDto,
        startDate: Date,
        endDate: Date
    ): SelectQueryBuilder<Stats> {
        let query = queryBuilder
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate });

        // Aplicar filtros si existen
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

        // Filtro por rango etario
        if (dto.ageRange) {
            const { minAge, maxAge } = this.getAgeRange(dto.ageRange);
            query = query.andWhere('stats.age BETWEEN :minAge AND :maxAge', { minAge, maxAge });
        }

        return query;
    }

    /**
     * Obtiene el rango de edad para un rango etario específico
     */
    getAgeRange(ageRange: string): { minAge: number; maxAge: number } {
        switch (ageRange) {
            case 'infancia': 
                return { minAge: 0, maxAge: 14 };
            case 'juventud': 
                return { minAge: 15, maxAge: 24 };
            case 'adultez_joven': 
                return { minAge: 25, maxAge: 44 };
            case 'adultez_media': 
                return { minAge: 45, maxAge: 64 };
            case 'vejez': 
                return { minAge: 65, maxAge: 120 };
            default: 
                return { minAge: 0, maxAge: 120 };
        }
    }

    /**
     * Construye consulta para estadísticas agregadas
     */
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

    /**
     * Construye consulta para visitas por fecha
     */
    buildVisitsByDateQuery(baseQuery: SelectQueryBuilder<Stats>): SelectQueryBuilder<Stats> {
        return baseQuery
            .select([
                'DATE(stats.entryDateTime) as date',
                'COUNT(*) as count'
            ])
            .groupBy('DATE(stats.entryDateTime)')
            .orderBy('date', 'ASC');
    }

    /**
     * Construye consulta para top usuarios
     */
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

    /**
     * Construye consulta para estadísticas de partición
     */
    buildPartitionStatsQuery(
        queryBuilder: SelectQueryBuilder<Stats>,
        startDate: Date,
        endDate: Date
    ): SelectQueryBuilder<Stats> {
        return queryBuilder
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
            .setParameter('o', 'O');
    }
}
