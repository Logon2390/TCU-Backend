import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResponseDTO } from '../common/dto/response.dto';


@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) { }

  @Post()
  async create(@Body() dto: CreateRecordDto) {
    try {
      const record = await this.recordService.create(dto);
      return new ResponseDTO(true, 'Registro creado exitosamente', record);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get()
  async findAll() {
    try {
      const records = await this.recordService.findAll();
      return new ResponseDTO(true, 'Registros obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const record = await this.recordService.findOne(+id);
      if (!record) return new ResponseDTO(false, 'Registro no encontrado');
      return new ResponseDTO(true, 'Registro obtenido exitosamente', record);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get('user/:document')
  async findByUserDocument(@Param('document') document: string) {
    try {
      const records = await this.recordService.findByUserDocument(document);
      return new ResponseDTO(true, 'Registros del usuario obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get('module/:moduleId')
  async findByModule(@Param('moduleId') moduleId: string) {
    try {
      const records = await this.recordService.findByModule(+moduleId);
      return new ResponseDTO(true, 'Registros del módulo obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Patch(':id')
  @Roles('M')
  async update(@Param('id') id: string, @Body() dto: UpdateRecordDto) {
    try {
      const record = await this.recordService.update(+id, dto);
      return new ResponseDTO(true, 'Registro actualizado exitosamente', record);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Delete(':id')
  @Roles('M')
  async remove(@Param('id') id: string) {
    try {
      await this.recordService.remove(+id);
      return new ResponseDTO(true, 'Registro eliminado exitosamente');
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
}
