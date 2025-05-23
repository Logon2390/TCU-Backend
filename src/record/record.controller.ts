import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @Roles('A', 'M')
  create(@Body() dto: CreateRecordDto) {
    return this.recordService.create(dto);
  }

  @Get()
  findAll() {
    return this.recordService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recordService.findOne(+id);
  }

  @Patch(':id')
  @Roles('M')
  update(@Param('id') id: string, @Body() dto: UpdateRecordDto) {
    return this.recordService.update(+id, dto);
  }

  @Delete(':id')
  @Roles('M')
  remove(@Param('id') id: string) {
    return this.recordService.remove(+id);
  }
}
