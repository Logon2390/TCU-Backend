import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CreateStatsDto } from './dto/create-stats.dto';
import { UpdateStatsDto } from './dto/update-stats.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResponseDTO } from '../common/dto/response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stats')
export class StatsController {

    constructor(private readonly statsService: StatsService) { }

    //endpoint para actualizar una estadistica
    @Put(': id')
    async update(@Param('id') id: string, @Body() dto: UpdateStatsDto) {
        try {
            const updatedStats = await this.statsService.update(+id, dto);
            return new ResponseDTO(true, "Estadisticas actualizadas correctamente", updatedStats);
        } catch (error) {
            throw new Error(`Failed to update stats: ${error.message}`);
        }
    }

    //endpoint para obtener todas las estadisticas
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('M')
    async findAll() {
        try {
            const stats = await this.statsService.findAll();
            return new ResponseDTO(true, "Estadisticas obtenidas correctamente", stats);
        } catch (error) {
            throw new ResponseDTO(false, error.message);
        }
    }

    //endpoint para obtener una estadistica
    @Get(':id')
    async findOne(@Param('id') id: string) {
        try {
            const stat = await this.statsService.findOne(+id);
            if (!stat) return new ResponseDTO(false, "Estadistica no encontrada");
            return new ResponseDTO(true, "Estadistica obtenida correctamente", stat);
        } catch (error) {
            throw new ResponseDTO(false, error.message);
        }
    }

    //endpoint para crear una estadistica
    @Post()
    async create(@Body() dto: CreateStatsDto) {
        try {
            const newStat = await this.statsService.create(dto);
            return new ResponseDTO(true, "Estadistica creada correctamente", newStat);
        } catch (error) {
            throw new ResponseDTO(false, error.message);
        }
    }

    //endpoint para eliminar una estadistica
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('M')
    async remove(@Param('id') id: string) {
        try {
            const deletedStat = await this.statsService.remove(+id);
            if (!deletedStat) return new ResponseDTO(false, "Estadistica no encontrada");
            return new ResponseDTO(true, "Estadistica eliminada correctamente", deletedStat);
        } catch (error) {
            throw new ResponseDTO(false, error.message);
        }
    }
}
