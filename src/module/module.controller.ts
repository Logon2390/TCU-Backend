import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res } from '@nestjs/common';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResponseDTO } from '../common/dto/response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('modules')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) { }

  @Post()
  @Roles('A', 'M')
  async create(@Body() dto: CreateModuleDto) {
    try {
      const module = await this.moduleService.create(dto);
      return new ResponseDTO(true, "Modulo agregado exitosamente", module)
    } catch (error) {
      return new ResponseDTO(false, error.message)

    }
  }

  @Get()
  async findAll() {
    try {
      const modules = await this.moduleService.findAll();
      return new ResponseDTO(true, "Modulos obtenidos correctamente", modules);

    } catch (error) {
      return new ResponseDTO(false, error.message);

    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const module = await this.moduleService.findOne(+id);
      if (!module) return new ResponseDTO(false, "No se ha encontrado el modulo");

    } catch (error) {
      return new ResponseDTO(false, error.message)

    }
  }

  @Patch(':id')
  @Roles('M')
  async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    try {
      const module = await this.moduleService.update(+id, dto);
      return new ResponseDTO(true, "Modulo actualizado correctamente",module);

    } catch (error) {
      return new ResponseDTO(false, error.message)

    }
  }

  @Delete(':id')
  @Roles('M')
  async remove(@Param('id') id: string) {
    try {
      await this.moduleService.remove(+id);
      return new ResponseDTO(true,"Modulo eliminado exitosamente")
    } catch (error) {
      return new ResponseDTO(false,error.message);
    }
  }
}
