import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private transporter;

    constructor(private configService: ConfigService) {
        // Configuración SMTP directa
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
            port: parseInt(this.configService.get('SMTP_PORT') || '587'),
            secure: false, // true para 465, false para otros puertos
            auth: {
                user: this.configService.get('SMTP_USER') || '',
                pass: this.configService.get('SMTP_PASS') || '',
            },
        });
    }

    async sendResetPassword(to: string, token: string) {
        try {
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
            const resetLink = `${frontendUrl}/user/reset?token=${token}`;
            
            // simula envío de email
            console.log('=== EMAIL DE RECUPERACIÓN ===');
            console.log('Para:', to);
            console.log('Token:', token);
            console.log('Enlace:', resetLink);
            
            // Envío de email
            await this.transporter.sendMail({
                from: '"Centro Civico Por la Paz Pococi" <noreply@example.com>',
                to,
                subject: 'Recuperación de contraseña',
                html: `<p>Haz click para restablecer tu contraseña:</p> 
                <a href="${resetLink}">Restablecer contraseña</a>
                <p>Este enlace expirará en 15 minutos.</p>`
            });
        } catch (error) {
            console.error('Error enviando email:', error);
            throw new Error('No se pudo enviar el correo de recuperación');
        }
    }
}