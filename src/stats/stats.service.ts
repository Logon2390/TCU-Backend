import {
    Injectable,
    NotFoundException,
    BadRequestException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Stats } from './stats.entity'
import { CreateStatsDto } from './dto/create-stats.dto'
import { UpdateStatsDto } from './dto/update-stats.dto'
import { User } from 'src/user/user.entity'

@Injectable()
export class StatsService {
    constructor(
        @InjectRepository(Stats)
        private statsRepo: Repository<Stats>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    //metodo para crear estadisticas
    async create(dto: CreateStatsDto) {

        let user = await this.userRepo.findOne({ where: { id: dto.userId } });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        else if (dto.user) {
            // error especifico de la info faltante
            if (!dto.user.name || !dto.user.gender) {
                throw new BadRequestException('Para crear un nuevo usuario, se requiere el nombre y el género');
            }
            user = this.userRepo.create(dto.user);
            user = await this.userRepo.save(user);
        }

        //ahora si se crean las estadistica
        const stats = this.statsRepo.create({
            entryDateTime: dto.entryDateTime,
            exitDateTime: dto.exitDateTime,
            gender: dto.gender,
            age: dto.age,
            user,
            userId: dto.userId,
            notes: dto.notes,
            status: dto.status,
            year: dto.year,
            month: dto.month
        });
        return this.statsRepo.save(stats);
    }
    //encontrar todas las estadisticas
    findAll() {
        return this.statsRepo.find({
            relations: ['user'],
            order: {
                entryDateTime: 'DESC'
            }
        });
    }
    //encontrar una estadística por ID
    findOne(id: number) {
        return this.statsRepo.findOne({
            where: { id },
            relations: ['user']
        });
    }

    //metodo para actualizar las estadisticas
    async update(id: number, dto: UpdateStatsDto) {
        const stats = await this.statsRepo.findOne({ where: { id } });
        if (!stats) {
            throw new NotFoundException('Estadística no encontrada');
        }
        if (dto.userId) {
            const user = await this.userRepo.findOne({ where: { id: dto.userId } });
            if (!user) {
                throw new NotFoundException('Usuario no encontrado');
            }
            stats.user = user;
        } else if (dto.user) {
            if (!dto.user.name || !dto.user.gender) {
                throw new BadRequestException('Para actualizar el usuario, se requiere el nombre y el género');
            }
            const newUser = this.userRepo.create(dto.user);
            stats.user = await this.userRepo.save(newUser);
        }
        //actualizamos los demas campos
        Object.assign(stats, {
            entryDateTime: dto.entryDateTime ?? stats.entryDateTime,
            exitDateTime: dto.exitDateTime ?? stats.exitDateTime,
            gender: dto.gender ?? stats.gender,
            age: dto.age ?? stats.age,
            userId: dto.userId ?? stats.userId,
            notes: dto.notes ?? stats.notes,
            status: dto.status ?? stats.status,
            year: dto.year ?? stats.year,
            month: dto.month ?? stats.month
        });
        return this.statsRepo.save(stats);
    }

    //metodo para eliminar estadisticas
    async remove(id: number) {
        const stats = await this.statsRepo.findOne({ where: { id } });
        if (!stats) {
            throw new NotFoundException('Estadística no encontrada');
        }
        return this.statsRepo.remove(stats);
    }
}