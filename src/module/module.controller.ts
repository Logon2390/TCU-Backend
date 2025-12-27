import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireAdmin, RequireMaster } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResponseDTO } from '../common/dto/response.dto';
@Controller('modules')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Post()
  async create(@Body() dto: CreateModuleDto) {
    try {
      const module = await this.moduleService.create(dto);
      return new ResponseDTO(true, "Modulo agregado exitosamente", module)
    } catch (error) {
      return new ResponseDTO(false, error.message)
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get()
  async findAll() {
    try {
      const modules = await this.moduleService.findAll();
      return new ResponseDTO(true, "Modulos obtenidos correctamente", modules);

    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Get('public')
  async findAllPublic() {
    try {
      const modules = await this.moduleService.findAllActive();
      return new ResponseDTO(true, "Modulos activos obtenidos correctamente", modules);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const module = await this.moduleService.findOne(+id);
      if (!module) return new ResponseDTO(false, "No se ha encontrado el modulo");

      return new ResponseDTO(true, "Modulo obtenido correctamente", module);
    } catch (error) {
      return new ResponseDTO(false, error.message)

    }
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    try {
      const module = await this.moduleService.update(+id, dto);
      return new ResponseDTO(true, "Modulo actualizado correctamente", module);

    } catch (error) {
      return new ResponseDTO(false, error.message)

    }
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireMaster()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.moduleService.remove(+id);
      return new ResponseDTO(true, "Modulo eliminado exitosamente")
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
}
