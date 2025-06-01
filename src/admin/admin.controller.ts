import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.adminService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.update(+id, dto);
  }

  @Post('login')
  login(@Body() dto: LoginAdminDto) {
    return this.adminService.login(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('M')
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
