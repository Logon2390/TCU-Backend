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
    return this.moduleRepo.save(module);
  }

  findAll() {
    return this.moduleRepo.find();
  }

  findOne(id: number) {
    return this.moduleRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateModuleDto) {
    await this.moduleRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.moduleRepo.delete(id);
  }
}
