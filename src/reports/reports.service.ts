import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from '../stats/stats.entity';
import { User } from '../user/user.entity';
import { GenerateReportDto } from './dto/create-report.dto';
import { ReportStatistics } from './interfaces/report-statistics.interface';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    /**
     * Genera un reporte completo basado en los parámetros proporcionados
     */
    async generateReport(dto: GenerateReportDto): Promise<ReportStatistics> {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        // Validar fechas
        if (startDate > endDate) {
            throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
        }

        this.logger.log(`Generando reporte desde ${startDate} hasta ${endDate}`);

        // Construir consulta base
        let query = this.statsRepo
            .createQueryBuilder('stats')
            .leftJoinAndSelect('stats.user', 'user')
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

        // Obtener estadísticas agregadas
        const aggregatedStats = await query
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
            .setParameter('o', 'O')
            .getRawOne();

        // Obtener visitas por fecha
        const visitsByDate = await this.getVisitsByDate(query, startDate, endDate);

        // Obtener top usuarios
        const topUsers = await this.getTopUsers(query);

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

    /**
     * Obtiene el rango de edad para un rango etario específico
     */
    private getAgeRange(ageRange: string): { minAge: number; maxAge: number } {
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
     * Obtiene visitas por fecha
     */
    private async getVisitsByDate(baseQuery: any, startDate: Date, endDate: Date) {
        const dateQuery = baseQuery.clone();

        const visitsByDate = await dateQuery
            .select([
                'DATE(stats.entryDateTime) as date',
                'COUNT(*) as count'
            ])
            .groupBy('DATE(stats.entryDateTime)')
            .orderBy('date', 'ASC')
            .getRawMany();

        // Rellenar fechas faltantes con 0
        return this.fillMissingDates(visitsByDate, startDate, endDate);
    }

    /**
     * Obtiene top usuarios
     */
    private async getTopUsers(baseQuery: any) {
        const userQuery = baseQuery.clone();

        const topUsersRaw = await userQuery
            .select([
                'stats.userId',
                'COUNT(*) as visitCount'
            ])
            .andWhere('stats.userId IS NOT NULL')
            .groupBy('stats.userId')
            .orderBy('visitCount', 'DESC')
            .limit(10)
            .getRawMany();

        // Obtener nombres de usuarios
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

    /**
     * Rellena fechas faltantes en visitas por fecha
     */
    private fillMissingDates(visitsByDate: any[], startDate: Date, endDate: Date) {
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

}
