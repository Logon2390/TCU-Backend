import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Res } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from './mail.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async create(dto: CreateAdminDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const admin = this.adminRepo.create({ ...dto, password: hash });
    return this.adminRepo.save(admin);
  }

  findAll() {
    return this.adminRepo.find();
  }

  findOne(id: number) {
    return this.adminRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateAdminDto) {
    const admin = await this.adminRepo.findOneBy({ id });
    if (!admin) {
      throw new Error('Admin no encontrado');
    }

    // Si el DTO incluye "password", la hasheamos
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    await this.adminRepo.update(id, dto);
    return this.findOne(id);
  }

  async login(dto: LoginAdminDto, res: Response) {
    const admin = await this.adminRepo.findOneBy({ email: dto.email });
    if (!admin) throw new UnauthorizedException('Correo no encontrado');

    const match = await bcrypt.compare(dto.password, admin.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    const token = await this.jwtService.signAsync(payload);

    // Set cookie (HttpOnly for security)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async remove(id: number) {
    await this.adminRepo.delete(id);
  }

  async sendResetEmail(email: string) {
    const user = await this.adminRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const token = this.jwtService.sign({ sub: user.id }, { expiresIn: '15m' });
    await this.mailService.sendResetPassword(email, token);

    return { message: 'Correo enviado' };
  }


  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const admin = await this.adminRepo.findOneBy({ id: payload.sub });
    if (!admin) {
      throw new BadRequestException('Admin no encontrado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await this.adminRepo.save(admin);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
