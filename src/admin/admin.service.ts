import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

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

  async login(dto: LoginAdminDto) {
    const admin = await this.adminRepo.findOneBy({ email: dto.email });
    if (!admin) throw new UnauthorizedException('Correo no encontrado');

    const match = await bcrypt.compare(dto.password, admin.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
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
}
