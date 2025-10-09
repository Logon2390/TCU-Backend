import { Controller, Get, Post, Body, Param, Delete, Put, Response, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common'; 
import { ResponseDTO } from '../common/dto/response.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RequireAdmin, RequireMaster } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {

    try {
      const user = await this.userService.update(+id, dto);
      return new ResponseDTO(true, "Usuario actualizado correctamente", user);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  async findAll(@Query() query: PaginationQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const users = await this.userService.findAllPaginated(page, limit);
      return new ResponseDTO(true, "Usuarios obtenidos correctamente", users);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Get(':id')
  async findOne(@Param('id') id: string) {

    try {
      const user = await this.userService.findOne(+id);
      if (!user) return new ResponseDTO(false, "El usuario no existe");
      return new ResponseDTO(true, "Usuario encontrado", user)

    } catch (error) {
      return new ResponseDTO(false, error.message);
    }

  }

  @Get('document/:doc')
  async findOneByDoc(@Param('doc') doc: string) {
    try {
      const user = await this.userService.findOneByDoc(doc);
      if (!user) return new ResponseDTO(false, "El usuario no existe");
      return new ResponseDTO(true, "Usuario encontrado", user)
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  @Post()
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.userService.create(dto);
      return new ResponseDTO(true, "Usuario creado correctamente", user)
    } catch (error) {

      return new ResponseDTO(false, error.message);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireMaster()
  async remove(@Param('id') id: string) {
    try {
      await this.userService.remove(+id);
      return new ResponseDTO(true, "Usuario eliminado correctamente");
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
}
