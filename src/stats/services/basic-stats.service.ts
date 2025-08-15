import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stats } from '../stats.entity';
import { CreateStatsDto } from '../dto/create-stats.dto';
import { UpdateStatsDto } from '../dto/update-stats.dto';
import { User } from '../../user/user.entity';

@Injectable()
export class BasicStatsService {
    private readonly logger = new Logger(BasicStatsService.name);

    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) {}

    /**
     * Crea una nueva estadística
     */
    async create(createStatsDto: CreateStatsDto): Promise<Stats> {
        // Validar que el usuario existe si se proporciona userId
        if (createStatsDto.userId) {
            const user = await this.userRepo.findOne({ where: { id: createStatsDto.userId } });
            if (!user) {
                throw new BadRequestException(`Usuario con ID ${createStatsDto.userId} no encontrado`);
            }
        }

        // Validar edad
        if (createStatsDto.age < 0 || createStatsDto.age > 120) {
            throw new BadRequestException('La edad debe estar entre 0 y 120 años');
        }

        // Validar género
        if (!['F', 'M', 'O'].includes(createStatsDto.gender)) {
            throw new BadRequestException('El género debe ser F, M u O');
        }

        // Validar estado
        if (!['activo', 'inactivo', 'pendiente'].includes(createStatsDto.status)) {
            throw new BadRequestException('El estado debe ser activo, inactivo o pendiente');
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

    /**
     * Obtiene todas las estadísticas con paginación
     */
    async findAll(page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
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

    /**
     * Obtiene una estadística por ID
     */
    async findOne(id: number): Promise<Stats> {
        const stats = await this.statsRepo.findOne({
            where: { id },
            relations: ['user']
        });

        if (!stats) {
            throw new NotFoundException(`Estadística con ID ${id} no encontrada`);
        }

        return stats;
    }

    /**
     * Actualiza una estadística
     */
    async update(id: number, updateStatsDto: UpdateStatsDto): Promise<Stats> {
        const stats = await this.findOne(id);

        // Validar edad si se actualiza
        if (updateStatsDto.age !== undefined && (updateStatsDto.age < 0 || updateStatsDto.age > 120)) {
            throw new BadRequestException('La edad debe estar entre 0 y 120 años');
        }

        // Validar género si se actualiza
        if (updateStatsDto.gender && !['F', 'M', 'O'].includes(updateStatsDto.gender)) {
            throw new BadRequestException('El género debe ser F, M u O');
        }

        // Validar estado si se actualiza
        if (updateStatsDto.status && !['activo', 'inactivo', 'pendiente'].includes(updateStatsDto.status)) {
            throw new BadRequestException('El estado debe ser activo, inactivo o pendiente');
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

    /**
     * Elimina una estadística
     */
    async remove(id: number): Promise<void> {
        const stats = await this.findOne(id);
        await this.statsRepo.remove(stats);
        this.logger.log(`Estadística con ID ${id} eliminada`);
    }

    /**
     * Obtiene estadísticas por usuario
     */
    async findByUser(userId: number, page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
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

    /**
     * Obtiene estadísticas por rango de fechas
     */
    async findByDateRange(startDate: Date, endDate: Date, page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
        const [data, total] = await this.statsRepo.findAndCount({
            where: {
                entryDateTime: {
                    $gte: startDate,
                    $lte: endDate
                }
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

    /**
     * Obtiene estadísticas por género
     */
    async findByGender(gender: string, page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
        const [data, total] = await this.statsRepo.findAndCount({
            where: { gender },
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

    /**
     * Obtiene estadísticas por rango de edad
     */
    async findByAgeRange(minAge: number, maxAge: number, page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
        const [data, total] = await this.statsRepo.findAndCount({
            where: {
                age: {
                    $gte: minAge,
                    $lte: maxAge
                }
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

    /**
     * Obtiene estadísticas por estado
     */
    async findByStatus(status: string, page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
        const [data, total] = await this.statsRepo.findAndCount({
            where: { status },
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

    /**
     * Obtiene estadísticas por año y mes
     */
    async findByYearMonth(year: number, month: number, page: number = 1, limit: number = 20): Promise<{ data: Stats[]; total: number; page: number; totalPages: number }> {
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
}
