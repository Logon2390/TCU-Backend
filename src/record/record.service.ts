import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from './record.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { User } from '../user/user.entity';
import { ModuleEntity } from '../module/module.entity';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/dto/pagination.dto';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(Record)
    private recordRepo: Repository<Record>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ModuleEntity)
    private moduleRepo: Repository<ModuleEntity>,
  ) {}

  async create(dto: CreateRecordDto) {
    // Buscar usuario por documento
    let user = await this.userRepo.findOneBy({ document: dto.user.document });
    const recordDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }),
    );

    // Si el usuario no existe, crearlo
    if (!user) {
      // Validar que se proporcionen los campos necesarios para crear usuario
      if (!dto.user.name || !dto.user.gender) {
        throw new BadRequestException(
          'Para crear un nuevo usuario, se requieren los campos: name, gender',
        );
      }

      user = this.userRepo.create(dto.user);
    }

    // Actualizar el campo lastRecord si visitedAt es más reciente
    user.lastRecord = recordDate;
    user = await this.userRepo.save(user);

    // Buscar el módulo
    const module = await this.moduleRepo.findOneBy({ id: dto.moduleId });
    if (!module) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const record = this.recordRepo.create({
      user,
      module,
      visitedAt: recordDate,
    });

    return this.recordRepo.save(record);
  }

  findAll() {
    return this.recordRepo.find({
      relations: ['user', 'module'],
    });
  }

  findOne(id: number) {
    return this.recordRepo.findOne({
      where: { id },
      relations: ['user', 'module'],
    });
  }

  // Buscar registros por documento de usuario
  findByUserDocument(document: string) {
    return this.recordRepo.find({
      where: { user: { document } },
      relations: ['user', 'module'],
      order: { visitedAt: 'DESC' },
    });
  }

  // Buscar registros por módulo
  findByModule(moduleId: number) {
    return this.recordRepo.find({
      where: { module: { id: moduleId } },
      relations: ['user', 'module'],
      order: { visitedAt: 'DESC' },
    });
  }

  // Buscar registros por módulo con paginación
  async findByModulePaginated(
    moduleId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Record>> {
    const [items, total] = await this.recordRepo.findAndCount({
      where: { module: { id: moduleId } },
      relations: ['user', 'module'],
      order: { visitedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async update(id: number, dto: UpdateRecordDto) {
    const record = await this.recordRepo.findOneBy({ id });
    if (!record) throw new NotFoundException('Registro no encontrado');

    // Si se proporciona un documento, buscar o crear usuario
    if (dto.user?.document) {
      let user = await this.userRepo.findOneBy({ document: dto.user.document });

      if (!user) {
        // Si el usuario no existe, validar campos necesarios
        if (!dto.user?.name || !dto.user?.gender) {
          throw new BadRequestException(
            'Para crear un nuevo usuario, se requieren los campos: name, gender',
          );
        }

        user = this.userRepo.create(dto.user);

        user = await this.userRepo.save(user);
      }

      record.user = user;
    }

    if (dto.moduleId) {
      const module = await this.moduleRepo.findOneBy({ id: dto.moduleId });
      if (module) record.module = module;
    }

    if (dto.visitedAt) {
      record.visitedAt = dto.visitedAt;
    }

    return this.recordRepo.save(record);
  }

  async remove(id: number) {
    await this.recordRepo.delete(id);
  }

  async getRecordsByUserPaginated(
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<Omit<Record, 'user'>>> {
    const [itemsWithUser, total] = await this.recordRepo.findAndCount({
      where: { user: { id: userId } },
      relations: ['module'],
      order: { visitedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const items = itemsWithUser.map(
      ({ user, ...rest }) => rest as Omit<Record, 'user'>,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }
}
