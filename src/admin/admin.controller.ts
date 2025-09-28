import { Controller, Get, Post, Body, Param, Delete, Put, Res, BadRequestException, Query } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { ResponseDTO } from '../common/dto/response.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateAdminDto & { code?: string }, @CurrentUser() user: any) {
    try {
      if (!dto.code) throw new BadRequestException('Código de verificación requerido');
      if (!user?.id) throw new BadRequestException('Usuario no autenticado');
      await this.adminService.verifyCode(user.id, dto.code);
      const admin = await this.adminService.create(dto);
      await this.adminService.resetVerifyCode(user.id);
      return new ResponseDTO(true, "Admin agregado correctamente", admin);
    } catch (error) {

      return new ResponseDTO(false, error.message);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateAdminDto & { code?: string }, @CurrentUser() user: any) {
    try {
      if (!dto.code) throw new BadRequestException('Código de verificación requerido');
      if (!user?.id) throw new BadRequestException('Usuario no autenticado');
      await this.adminService.verifyCode(user.id, dto.code);
      const admin = await this.adminService.update(+id, dto)
      await this.adminService.resetVerifyCode(user.id);
      return new ResponseDTO(true, "Admin actualizado correctamente");
    } catch (error) {

      return new ResponseDTO(false, error.message);
    }
  }


  @Post('login')
  async login(@Body() dto: LoginAdminDto) {
    try {
      const result = await this.adminService.login(dto);
      return new ResponseDTO(true, "Login exitoso", result);
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return new ResponseDTO(true, "Logout exitoso");
  }

  @Post('verifyAccessCode')
  async verifyAccessCode(@Body() dto: { email: string; accessCode: string }, @Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.adminService.verifyAccessCode(dto.email, dto.accessCode, res);
      return new ResponseDTO(true, "Código de acceso verificado", result);
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

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async sendVerificationCode(@CurrentUser() user: any) {
    try {
      if (!user?.id) throw new BadRequestException('Usuario no autenticado');
      await this.adminService.generateAndSendVerifyCode(user.id);
      return new ResponseDTO(true, "Código de verificación enviado");
    } catch (error) {
      return new ResponseDTO(false, error.message);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    try {

      const admins = await this.adminService.findAll();
      return new ResponseDTO(true, "Admins obtenidos correctamente", admins);

    } catch (error) {
      return new ResponseDTO(false, error.message)
    }

  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    try {
      const admin = await this.adminService.findOne(+id);
      if (!admin) new ResponseDTO(true, "Admin no encontrado");
      return new ResponseDTO(true, "Admin obtenido correctamente");
    } catch (error) {
      return new ResponseDTO(false, error.message)
    }
  }

  @Delete(':id/:code')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any, @Param('code') code?: string) {
    try {
      if (!code) throw new BadRequestException('Código de verificación requerido');
      if (!user?.id) throw new BadRequestException('Usuario no autenticado');
      await this.adminService.verifyCode(user.id, code);
      await this.adminService.remove(+id);
      await this.adminService.resetVerifyCode(user.id);
      return new ResponseDTO(true, "Admin eliminado correctamente")

    } catch (error) {
      return new ResponseDTO(false, error.message)
    }

  }
}
