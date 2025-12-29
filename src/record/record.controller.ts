import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseDTO } from '../common/dto/response.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RequireAdmin, RequireMaster } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';


@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) { }

  @Post()
  async create(@Body() dto: CreateRecordDto) {
    try {
      await this.recordService.create(dto);
      return new ResponseDTO(true, 'Registro creado exitosamente');
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get()
  async findAll() {
    try {
      const records = await this.recordService.findAll();
      return new ResponseDTO(true, 'Registros obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get('user/:document')
  async findByUserDocument(@Param('document') document: string) {
    try {
      const records = await this.recordService.findByUserDocument(document);
      return new ResponseDTO(true, 'Registros del usuario obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get('module/:moduleId')
  async findByModule(@Param('moduleId') moduleId: string, @Query() query: PaginationQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const records = await this.recordService.findByModulePaginated(+moduleId, page, limit);
      return new ResponseDTO(true, 'Registros del módulo obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRecordDto) {
    try {
      const record = await this.recordService.update(+id, dto);
      return new ResponseDTO(true, 'Registro actualizado exitosamente', record);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireMaster()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.recordService.remove(+id);
      return new ResponseDTO(true, 'Registro eliminado exitosamente');
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get('records/:userId')
  async getRecordsByUser(@Param('userId') userId: number, @Query() query: PaginationQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const records = await this.recordService.getRecordsByUserPaginated(+userId, page, limit);
      return new ResponseDTO(true, 'Registros del usuario obtenidos exitosamente', records);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
}
