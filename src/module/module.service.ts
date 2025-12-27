import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleEntity } from './module.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModuleService {
  constructor(
    @InjectRepository(ModuleEntity)
    private moduleRepo: Repository<ModuleEntity>,
  ) {}

  create(dto: CreateModuleDto) {
    const module = this.moduleRepo.create(dto);
    const date = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' })
    );
    module.createdAt = date;
    module.updatedAt = date;
    return this.moduleRepo.save(module);
  }

  findAll() {
    return this.moduleRepo.find();
  }

  findAllActive() {
    return this.moduleRepo.find({ where: { isActive: true } });
  }

  findOne(id: number) {
    return this.moduleRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateModuleDto) {
    const date = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' })
    );
    dto.updatedAt = date;
    await this.moduleRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.moduleRepo.delete(id);
  }
}
