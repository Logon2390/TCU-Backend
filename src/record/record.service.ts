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

    // Si el usuario no existe, crearlo
    if (!user) {
      // Validar que se proporcionen los campos necesarios para crear usuario
      if (!dto.user.name || !dto.user.gender) {
        throw new BadRequestException(
          'Para crear un nuevo usuario, se requieren los campos: name, gender',
        );
      }

      user = this.userRepo.create(dto.user);
      // Si viene lastRecord en el payload del usuario, asegurar que sea Date
      if (user.lastRecord && typeof (user.lastRecord as any) === 'string') {
        user.lastRecord = new Date(user.lastRecord as unknown as string);
      }
      user = await this.userRepo.save(user);
    } else {
      // Si el usuario existe, actualizar lastRecord
      // Preferir lastRecord explícito del payload si viene, sino usar dto.date
      const incomingLastRecord: Date | undefined = (dto.user as any)?.lastRecord
        ? new Date((dto.user as any).lastRecord)
        : undefined;
      user.lastRecord = incomingLastRecord ?? new Date(dto.visitedAt);
      await this.userRepo.save(user);
    }

    // Buscar el módulo
    const module = await this.moduleRepo.findOneBy({ id: dto.moduleId });
    if (!module) {
      throw new NotFoundException('Módulo no encontrado');
    }

    // Crear el registro
    const record = this.recordRepo.create({
      user,
      module,
      visitedAt: new Date(dto.visitedAt),
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

  async getRecordsByUser(userId: number) {
    const records = await this.recordRepo.find({
      where: { user: { id: userId } },
      relations: ['module'],
      order: { visitedAt: 'DESC' },
    });
    return records.map(({ user, ...rest }) => rest);
  }
}
