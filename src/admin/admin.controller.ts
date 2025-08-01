import { Controller, Get, Post, Body, Param, Delete, Put, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ResponseDTO } from '../common/dto/response.dto';
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post()
  async create(@Body() dto: CreateAdminDto) {
    try {
      const admin = await this.adminService.create(dto);
      return new ResponseDTO(true, "Admin agregado correctamente", admin);
    } catch (error) {

      return new ResponseDTO(false, error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    try {
      const admin = await this.adminService.update(+id, dto)
      return new ResponseDTO(true, "Admin actualizado correctamente");
    } catch (error) {

      return new ResponseDTO(false, error.message);
    }
  }


  @Post('login')
  async login(@Body() dto: LoginAdminDto, @Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.adminService.login(dto, res);
      return new ResponseDTO(true, "Login exitoso", result);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Post('requestReset')
  async requestPasswordReset(@Body() body: { email: string }) {
    try {
      const result = await this.adminService.sendResetEmail(body.email);
      return new ResponseDTO(true, "Correo de recuperación enviado", result);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Post('resetPassword')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    try {
      const result = await this.adminService.resetPassword(body.token, body.newPassword);
      return new ResponseDTO(true, "Contraseña actualizada exitosamente", result);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('M')
  async findAll() {
    try {

      const admins = await this.adminService.findAll();
      return new ResponseDTO(true, "Admins obtenidos correctamente", admins);

    } catch (error) {
      return new ResponseDTO(false, error.message)
    }

  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const admin = await this.adminService.findOne(+id);
      if (!admin) new ResponseDTO(true, "Admin no encontrado");
      return new ResponseDTO(true, "Admin obtenido correctamente");
    } catch (error) {
      return new ResponseDTO(false, error.message)
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.adminService.remove(+id);
      return new ResponseDTO(true, "Admin eliminado correctamente")

    } catch (error) {
      return new ResponseDTO(false, error.message)
    }

  }
}
