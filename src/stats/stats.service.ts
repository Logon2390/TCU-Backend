
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from './stats.entity';
import { CreateStatsDto } from './dto/create-stats.dto';
import { UpdateStatsDto } from './dto/update-stats.dto';
import { User } from '../user/user.entity';
import { VisitHistoryDto } from './dto/visit-history.dto';

@Injectable()
export class StatsService {
    private readonly logger = new Logger(StatsService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) {}

    // ==================== OPERACIONES BÁSICAS (CRUD) ====================
    
    async create(createStatsDto: CreateStatsDto): Promise<Stats> {
        // Validar que el usuario existe si se proporciona userId
        if (createStatsDto.userId) {
            const user = await this.userRepo.findOne({ where: { id: createStatsDto.userId } });
            if (!user) {
                throw new Error(`Usuario con ID ${createStatsDto.userId} no encontrado`);
            }
        }

        // Validar edad
        if (createStatsDto.age < 0 || createStatsDto.age > 120) {
            throw new Error('La edad debe estar entre 0 y 120 años');
        }

        // Validar género
        if (!['F', 'M', 'O'].includes(createStatsDto.gender)) {
            throw new Error('El género debe ser F, M u O');
        }

        // Validar estado
        if (!['registrada', 'anulada'].includes(createStatsDto.status)) {
            throw new Error('El estado debe ser registrada o anulada');
        }

        // Calcular año y mes para optimización de consultas
        const entryDateTime = new Date(createStatsDto.entryDateTime);
        const year = entryDateTime.getFullYear();
        const month = entryDateTime.getMonth() + 1;

        const stats = this.statsRepo.create({
            ...createStatsDto,
            year,
            month,
            entryDateTime
        });

        const savedStats = await this.statsRepo.save(stats);
        this.logger.log(`Estadística creada con ID: ${savedStats.id}`);
        
        return savedStats;
    }

    async findAll(page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: number): Promise<Stats> {
        const stats = await this.statsRepo.findOne({
            where: { id },
            relations: ['user']
        });

        if (!stats) {
            throw new Error(`Estadística con ID ${id} no encontrada`);
        }

        return stats;
    }

    async update(id: number, updateStatsDto: UpdateStatsDto): Promise<Stats> {
        const stats = await this.findOne(id);

        // Validar edad si se actualiza
        if (updateStatsDto.age !== undefined && (updateStatsDto.age < 0 || updateStatsDto.age > 120)) {
            throw new Error('La edad debe estar entre 0 y 120 años');
        }

        // Validar género si se actualiza
        if (updateStatsDto.gender && !['F', 'M', 'O'].includes(updateStatsDto.gender)) {
            throw new Error('El género debe ser F, M u O');
        }

        // Validar estado si se actualiza
        if (updateStatsDto.status && !['registrada', 'anulada'].includes(updateStatsDto.status)) {
            throw new Error('El estado debe ser registrada o anulada');
        }

        // Actualizar año y mes si se cambia la fecha
        if (updateStatsDto.entryDateTime) {
            const entryDateTime = new Date(updateStatsDto.entryDateTime);
            updateStatsDto.year = entryDateTime.getFullYear();
            updateStatsDto.month = entryDateTime.getMonth() + 1;
        }

        Object.assign(stats, updateStatsDto);
        const updatedStats = await this.statsRepo.save(stats);
        
        this.logger.log(`Estadística con ID ${id} actualizada`);
        return updatedStats;
    }

    async remove(id: number): Promise<void> {
        const stats = await this.findOne(id);
        await this.statsRepo.remove(stats);
        this.logger.log(`Estadística con ID ${id} eliminada`);
    }

    // ==================== CONSULTAS ESPECIALIZADAS ====================
    
    async findByUser(userId: number, page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            where: { userId },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByDateRange(startDate: Date, endDate: Date, page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            where: {
                entryDateTime: {
                    $gte: startDate,
                    $lte: endDate
                } as any
            },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByGender(gender: string, page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            where: { gender: gender as 'F' | 'M' | 'O' },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByAgeRange(minAge: number, maxAge: number, page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            where: {
                age: {
                    $gte: minAge,
                    $lte: maxAge
                } as any
            },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByStatus(status: string, page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            where: { status: status as 'registrada' | 'anulada' },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByYearMonth(year: number, month: number, page: number = 1, limit: number = 20) {
        const [data, total] = await this.statsRepo.findAndCount({
            where: { year, month },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { entryDateTime: 'DESC' }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    // ==================== HISTORIAL DE VISITAS ====================
    
    async getVisitHistory(dto: VisitHistoryDto) {
        if (!dto.startDate || !dto.endDate) {
            throw new Error('Las fechas de inicio y fin son requeridas');
        }

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        const baseQuery = this.statsRepo.createQueryBuilder('stats')
            .leftJoinAndSelect('stats.user', 'user')
            .where('stats.entryDateTime >= :startDate', { startDate })
            .andWhere('stats.entryDateTime <= :endDate', { endDate });

        // Aplicar filtros adicionales si existen
        if (dto.userId) {
            baseQuery.andWhere('stats.userId = :userId', { userId: dto.userId });
        }

        if (dto.status) {
            baseQuery.andWhere('stats.status = :status', { status: dto.status });
        }

        const visits = await baseQuery
            .orderBy('stats.entryDateTime', 'DESC')
            .getMany();

        return visits.map(visit => ({
            id: visit.id,
            entryDateTime: visit.entryDateTime,
            userName: visit.user?.name || 'Usuario Desconocido',
            age: visit.age,
            gender: visit.gender,
            status: visit.status
        }));
    }

    // ==================== ESTADÍSTICAS RÁPIDAS ====================
    
    async getQuickStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalVisits, totalUsers, todayVisits] = await Promise.all([
            this.statsRepo.count(),
            this.userRepo.count(),
            this.statsRepo.count({
                where: {
                    entryDateTime: {
                        $gte: today
                    } as any
                }
            })
        ]);

        return {
            totalVisits,
            totalUsers,
            todayVisits,
            lastUpdated: new Date()
        };
    }
}