import { Controller, Get, Post, Body, Param, Delete, Put,Res, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Response } from 'express';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.adminService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    const numId = +id;
    if (isNaN(numId)) {
      throw new BadRequestException('ID inválido');
    }
    return this.adminService.update(numId, dto);
  }


  @Post('login')
  login(@Body() dto: LoginAdminDto, @Res({ passthrough: true }) res: Response) {
    return this.adminService.login(dto, res);
  }

  @Post('requestReset')
  requestPasswordReset(@Body() body: { email: string }) {
    return this.adminService.sendResetEmail(body.email);
  }            
             
  @Post('resetPassword')
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.adminService.resetPassword(body.token, body.newPassword);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('M')
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const numId = +id;
    if (isNaN(numId)) {
      throw new BadRequestException('ID inválido');
    }
    return this.adminService.findOne(numId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const numId = +id;
    if (isNaN(numId)) {
      throw new BadRequestException('ID inválido');
    }
    return this.adminService.remove(numId);
  }
}
