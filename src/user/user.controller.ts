import { Controller, Get, Post, Body, Param, Delete, Put, Response } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ResponseDTO } from '../common/dto/response.dto';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

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
  @Roles('M')
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return new ResponseDTO(true, "Usuarios obtenidos correctamente", users);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

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
  @Roles('M')
  async remove(@Param('id') id: string) {
    try {
      await this.userService.remove(+id);
      return new ResponseDTO(true, "Usuario eliminado correctamente");
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }
}
