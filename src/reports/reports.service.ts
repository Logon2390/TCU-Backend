import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../record/record.entity';
import { User } from '../user/user.entity';
import { ModuleEntity } from '../module/module.entity';
import { GenerateReportDto } from './dto/create-report.dto';
import { ReportStatistics } from '../interfaces/report-statistics.interface';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @InjectRepository(Record)
        private recordRepo: Repository<Record>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(ModuleEntity)
        private moduleRepo: Repository<ModuleEntity>,
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
        this.logger.log(`Generando reporte desde ${dto.startDate} hasta ${dto.endDate}`);

        // Construir consulta base sobre Record con joins
        let baseQuery = this.recordRepo
            .createQueryBuilder('record')
            .leftJoin('record.user', 'user')
            .leftJoin('record.module', 'module')
            .where('DATE(record.visitedAt) >= :startDate', { startDate: dto.startDate })
            .andWhere('DATE(record.visitedAt) <= :endDate', { endDate: dto.endDate });

        // Filtros
        if (dto.gender) {
            baseQuery = baseQuery.andWhere('user.gender = :gender', { gender: dto.gender });
        }

        // Rango etario específico
        if (dto.ageRange) {
            const { minAge, maxAge } = this.getAgeRange(dto.ageRange);
            baseQuery = baseQuery
                .andWhere('user.birthday IS NOT NULL')
                .andWhere('TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) BETWEEN :minAge AND :maxAge', { minAge, maxAge });
        }

        if (dto.minAge !== undefined) {
            baseQuery = baseQuery
                .andWhere('user.birthday IS NOT NULL')
                .andWhere('TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) >= :minAge', { minAge: dto.minAge });
        }

        if (dto.maxAge !== undefined) {
            baseQuery = baseQuery
                .andWhere('user.birthday IS NOT NULL')
                .andWhere('TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) <= :maxAge', { maxAge: dto.maxAge });
        }

        if (dto.userId) {
            baseQuery = baseQuery.andWhere('user.id = :userId', { userId: dto.userId });
        }

        if (dto.moduleId) {
            baseQuery = baseQuery.andWhere('module.id = :moduleId', { moduleId: dto.moduleId });
        }

        // Agregaciones principales
        const aggregatedStats = await baseQuery
            .select([
                'COUNT(*) as totalVisits',
                'COUNT(DISTINCT user.id) as totalUsers',
                'AVG(TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt)) as averageAge',
                "SUM(CASE WHEN user.gender = 'F' THEN 1 ELSE 0 END) as fCount",
                "SUM(CASE WHEN user.gender = 'M' THEN 1 ELSE 0 END) as mCount",
                "SUM(CASE WHEN user.gender = 'O' THEN 1 ELSE 0 END) as oCount",
                "SUM(CASE WHEN user.birthday IS NOT NULL AND TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) <= 14 THEN 1 ELSE 0 END) as infancia",
                "SUM(CASE WHEN user.birthday IS NOT NULL AND TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) BETWEEN 15 AND 24 THEN 1 ELSE 0 END) as juventud",
                "SUM(CASE WHEN user.birthday IS NOT NULL AND TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) BETWEEN 25 AND 44 THEN 1 ELSE 0 END) as adultez_joven",
                "SUM(CASE WHEN user.birthday IS NOT NULL AND TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) BETWEEN 45 AND 64 THEN 1 ELSE 0 END) as adultez_media",
                "SUM(CASE WHEN user.birthday IS NOT NULL AND TIMESTAMPDIFF(YEAR, user.birthday, record.visitedAt) >= 65 THEN 1 ELSE 0 END) as vejez",
            ])
            .getRawOne();

        const visitsByDate = await this.getVisitsByDate(baseQuery, startDate, endDate);
        const visitsByDateAndHour = await this.getVisitsByDateAndHour(baseQuery, startDate, endDate);
        const topUsers = await this.getTopUsers(baseQuery);
        const topModules = await this.getTopModules(baseQuery);
        const isSingleDay = dto.startDate === dto.endDate;

        return {
            totalVisits: parseInt(aggregatedStats.totalVisits || '0'),
            totalUsers: parseInt(aggregatedStats.totalUsers || '0'),
            genderDistribution: {
                F: parseInt(aggregatedStats.fCount || '0'),
                M: parseInt(aggregatedStats.mCount || '0'),
                O: parseInt(aggregatedStats.oCount || '0')
            },
            ageRangeDistribution: {
                infancia: parseInt(aggregatedStats.infancia || '0'),
                juventud: parseInt(aggregatedStats.juventud || '0'),
                adultez_joven: parseInt(aggregatedStats.adultez_joven || '0'),
                adultez_media: parseInt(aggregatedStats.adultez_media || '0'),
                vejez: parseInt(aggregatedStats.vejez || '0')
            },
            averageAge: Math.round(parseFloat(aggregatedStats.averageAge) || 0),
            visitsByDate: isSingleDay
                ? visitsByDateAndHour
                : visitsByDate,
            topUsers,
            topModules,
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
                'DATE(record.visitedAt) as date',
                'COUNT(*) as count'
            ])
            .groupBy('DATE(record.visitedAt)')
            .orderBy('date', 'ASC')
            .getRawMany();

        // Rellenar fechas faltantes con 0 (diario)
        return this.fillMissingDates(visitsByDate, startDate, endDate, false);
    }

     /**
     * Obtiene visitas por fecha y hora
     */
     private async getVisitsByDateAndHour(baseQuery: any, startDate: Date, endDate: Date) {
        const dateQuery = baseQuery.clone();

        const visitsByDateAndHour = await dateQuery
            .select([
                'DATE(record.visitedAt) as date',
                'HOUR(record.visitedAt) as hour',
                'COUNT(*) as count'
            ])
            .groupBy('DATE(record.visitedAt)')
            .addGroupBy('HOUR(record.visitedAt)')
            .orderBy('date', 'ASC')
            .addOrderBy('hour', 'ASC')
            .getRawMany();
        return this.fillMissingDates(visitsByDateAndHour, startDate, endDate, true);
    }

    /**
     * Obtiene top usuarios
     */
    private async getTopUsers(baseQuery: any) {
        const userQuery = baseQuery.clone();

        const topUsersRaw = await userQuery
            .select([
                'user.id as userId',
                'COUNT(*) as visitCount'
            ])
            .andWhere('user.id IS NOT NULL')
            .groupBy('user.id')
            .orderBy('visitCount', 'DESC')
            .limit(10)
            .getRawMany();

        // Obtener nombres de usuarios
        const userIds = topUsersRaw.map((u: any) => u.userId);
        const users = await this.userRepo
            .createQueryBuilder('user')
            .select(['user.id', 'user.name'])
            .where('user.id IN (:...userIds)', { userIds: userIds.length ? userIds : [0] })
            .getMany();

        const userMap = new Map(users.map(u => [u.id, u.name]));

        return topUsersRaw.map((u: any) => ({
            userId: u.userId,
            userName: userMap.get(u.userId) || 'Usuario Desconocido',
            visitCount: parseInt(u.visitCount)
        }));
    }

    private async getTopModules(baseQuery: any): Promise<Array<{ name: string; visitCount: number }>> {
        const moduleQuery = baseQuery.clone();

        const topModulesRaw = await moduleQuery
            .select([
                'module.name as moduleName',
                'COUNT(*) as visitCount'
            ])
            .andWhere('module.id IS NOT NULL')
            .groupBy('module.id')
            .orderBy('visitCount', 'DESC')
            .limit(10)
            .getRawMany();

        return topModulesRaw.map((m: any) => ({
            name: m.moduleName,
            visitCount: parseInt(m.visitCount)
        }));
    }

    /**
    * Rellena fechas (y horas opcionalmente) faltantes en visitas
    */
    private fillMissingDates(data: any[], startDate: Date, endDate: Date, forceHourly = false) {
    const isHourly = forceHourly || data.some((d) => d.hour !== undefined);

    const makeKey = (date: Date | string, hour?: number) => {
        const dateStr =
            typeof date === "string"
                ? (date.includes("T") ? date.split("T")[0] : date)
                : new Date(date).toISOString().split("T")[0];
        return isHourly ? `${dateStr}|${hour ?? 0}` : dateStr;
    };

    const counts = new Map<string, number>();
    for (const v of data) {
        const key = makeKey(v.date, isHourly ? Number(v.hour) || 0 : undefined);
        const increment = Number(v.count) || 0;
        counts.set(key, (counts.get(key) || 0) + increment);
    }

    const result: any[] = [];
    const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const last = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

    while (current <= last) {
        const dateStr = current.toISOString().split("T")[0];

        if (isHourly) {
            for (let hour = 0; hour < 24; hour++) {
                const key = `${dateStr}|${hour}`;
                result.push({ date: dateStr, hour, count: counts.get(key) ?? 0 });
            }
        } else {
            result.push({ date: dateStr, count: counts.get(dateStr) ?? 0 });
        }

        current.setUTCDate(current.getUTCDate() + 1);
    }

    return result;
}

}
