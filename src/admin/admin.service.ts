import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { MailService } from './mail.service';
import { randomInt } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  private async hash(password: string): Promise<string> {
    const salt = this.configService.get<string>('SALT') || '';
    return await bcrypt.hash(password + salt, 10);
  }

  private async verifyHash(password: string, hash: string): Promise<boolean> {
    const salt = this.configService.get<string>('SALT') || '';
    return await bcrypt.compare(password + salt, hash);
  }

  async create(dto: CreateAdminDto) {
    const hash = await this.hash(dto.password);
    const checkEmail = await this.adminRepo.findOneBy({ email: dto.email });
    if (checkEmail) {
      throw new BadRequestException('El correo electrónico ya está en uso');
    }

    const date = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' })
    );

    dto.createdAt = date;
    dto.updatedAt = date;
    const admin = this.adminRepo.create({ ...dto, password: hash });
    return this.adminRepo.save(admin).then((admin) => this.mapAdmin(admin));
  }

  findAll() {
    return this.adminRepo
      .find()
      .then((admins) => admins.map(this.mapAdmin))
      .catch((error) => {
        throw new Error(error);
      });
  }

  findOne(id: number) {
    return this.adminRepo.findOneBy({ id }).then(this.mapAdmin);
  }

  async update(id: number, dto: UpdateAdminDto) {
    const admin = await this.adminRepo.findOneBy({ id });
    if (!admin) {
      throw new Error('Admin no encontrado');
    }

    if (dto.password) {
      dto.password = await this.hash(dto.password);
    }

    if (dto.email) {
      const admin = await this.adminRepo.findOneBy({ email: dto.email });
      if (admin && admin.id !== id) {
        throw new BadRequestException('El correo electrónico ya está en uso');
      }
    }

    const updatedAt = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' })
    );

    dto.updatedAt = updatedAt;
    await this.adminRepo.update(id, dto);
    return this.findOne(id).then(this.mapAdmin);
  }

  async login(dto: LoginAdminDto) {
    const admin = await this.adminRepo.findOneBy({ email: dto.email });
    if (!admin)
      throw new UnauthorizedException(
        'Correo no encontrado o contraseña incorrecta',
      );

    const match = await this.verifyHash(dto.password, admin.password);
    if (!match)
      throw new UnauthorizedException(
        'Correo no encontrado o contraseña incorrecta',
      );


    //generate random access code
    const accessCode = randomInt(100000, 900000);
    admin.accessCode = await this.hash(accessCode.toString());

    //set access code expiry (15 minutes)
    admin.accessCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    //save admin access code
    await this.adminRepo.save(admin);

    //send access code to email
    await this.mailService.sendAccessCode(admin.email, accessCode);

    return true;
  }

  async generateAndSendVerifyCode(adminId: number) {
    const admin = await this.adminRepo.findOneBy({ id: adminId });
    if (!admin) throw new NotFoundException('Admin no encontrado');

    const verifyCode = randomInt(100000, 900000);
    admin.verifyCode = await this.hash(verifyCode.toString());
    admin.verifyCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.adminRepo.save(admin);

    await this.mailService.sendVerifyCode(admin.email, verifyCode);
    return true;
  }

  async verifyCode(adminId: number, code: string) {
    if (!code)
      throw new UnauthorizedException('Código de verificación inválido');

    const admin = await this.adminRepo.findOneBy({ id: adminId });
    if (!admin) throw new NotFoundException('Admin no encontrado');
    if (!admin.verifyCode)
      throw new UnauthorizedException('Código de verificación inválido');

    const match = await this.verifyHash(code, admin.verifyCode);
    if (!match)
      throw new UnauthorizedException('Código de verificación inválido');
    return true;
  }

  async resetVerifyCode(adminId: number) {
    const admin = await this.adminRepo.findOneBy({ id: adminId });
    if (!admin) throw new NotFoundException('Admin no encontrado');

    admin.verifyCode = null;
    admin.verifyCodeExpiry = null;
    await this.adminRepo.save(admin);
  }

  async verifyAccessCode(email: string, accessCode: string, res: Response) {
    const admin = await this.adminRepo.findOneBy({ email });
    if (!admin)
      throw new UnauthorizedException(
        'Correo no encontrado o contraseña incorrecta',
      );

    if (admin.accessCode === null)
      throw new UnauthorizedException('Código de acceso inválido');

    if (admin.accessCodeExpiry && admin.accessCodeExpiry < new Date())
      throw new UnauthorizedException('Código de acceso expirado');

    const match = await this.verifyHash(accessCode, admin.accessCode);
    if (!match) throw new UnauthorizedException('Código de acceso inválido');

    //reset access code
    admin.accessCode = null;
    admin.accessCodeExpiry = null;
    await this.adminRepo.save(admin);

    const payload = { sub: admin.id };
    const token = await this.jwtService.signAsync(payload);

    // Set cookie (HttpOnly for security)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000, // 1 hora
    });

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async remove(id: number) {
    const admin = await this.adminRepo.findOneBy({ id });
    if (!admin) throw new NotFoundException('Admin no encontrado');
    if (admin.id === 1)
      throw new BadRequestException('No se puede eliminar el admin principal');

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

    const hashedPassword = await this.hash(newPassword);
    admin.password = hashedPassword;
    await this.adminRepo.save(admin);

    return { message: 'Contraseña actualizada exitosamente' };
  }
  mapAdmin(admin: Admin) {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
