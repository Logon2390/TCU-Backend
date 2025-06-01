import { Injectable, NotFoundException } from '@nestjs/common';
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
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    const module = await this.moduleRepo.findOneBy({ id: dto.moduleId });

    if (!user || !module) {
      throw new NotFoundException('Usuario o módulo no encontrados');
    }

    const record = this.recordRepo.create({
      user,
      module,
      date: dto.date,
    });

    return this.recordRepo.save(record);
  }

  findAll() {
    return this.recordRepo.find();
  }

  findOne(id: number) {
    return this.recordRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateRecordDto) {
    const record = await this.recordRepo.findOneBy({ id });
    if (!record) throw new NotFoundException('Registro no encontrado');

    if (dto.userId) {
      const user = await this.userRepo.findOneBy({ id: dto.userId });
      if (user) record.user = user;
    }

    if (dto.moduleId) {
      const module = await this.moduleRepo.findOneBy({ id: dto.moduleId });
      if (module) record.module = module;
    }

    if (dto.date) {
      record.date = dto.date;
    }

    return this.recordRepo.save(record);
  }

  async remove(id: number) {
    await this.recordRepo.delete(id);
  }
}
