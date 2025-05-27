import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('modules')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  @Roles('A', 'M')
  create(@Body() dto: CreateModuleDto) {
    return this.moduleService.create(dto);
  }

  @Get()
  findAll() {
    return this.moduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moduleService.findOne(+id);
  }

  @Patch(':id')
  @Roles('M')
  update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.moduleService.update(+id, dto);
  }

  @Delete(':id')
  @Roles('M')
  remove(@Param('id') id: string) {
    return this.moduleService.remove(+id);
  }
}
