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

    async create(dto: CreateStatsDto) {

        let user: User | null = null;

        if (dto.userId) {
            user = await this.userRepo.findOneBy({ id: dto.userId })
            if (!user) {
                throw new NotFoundException('Usuario no encontrado');
            }

        } else if (dto.user) {
            // error especifico de la info faltante
            if (!dto.user.name || !dto.user.gender) {
                throw new BadRequestException('Para crear un nuevo usuario, se requiere el nombre y el género');
            }
            user = this.userRepo.create(dto.user);
            user = await this.userRepo.save(user);
        }
        const stats2 = new Stats();


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
}