import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendResetPassword(to: string, token: string) {
    try {
      const frontendUrl = this.configService.get('FRONTEND_URL');
      const resetLink = `${frontendUrl}/reset/${token}`;

      const html = this.getEmailTemplate(
        'Recuperación de contraseña',
        'Haz click en el siguiente botón para restablecer tu contraseña:',
        undefined,
        resetLink,
        'Restablecer contraseña',
        'Este enlace expirará en 15 minutos.',
      );

      await this.transporter.sendMail({
        from: '"Centro Civico Por la Paz Pococi" <noreply@example.com>',
        to,
        subject: 'Recuperación de contraseña',
        html,
      });
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }

  async sendAccessCode(to: string, accessCode: number) {
    try {
      const frontendUrl = this.configService.get('FRONTEND_URL');
      const forgetPasswordLink = `${frontendUrl}/forgot`;

      const html = this.getEmailTemplate(
        'Código de acceso',
        'Recibimos una solicitud para acceder a su cuenta. Use el siguiente código de verificación:',
        String(accessCode),
        forgetPasswordLink,
        'Restablecer contraseña',
        '⚠️ Este código expirará en 15 minutos.',
      );

      await this.transporter.sendMail({
        from: '"Centro Civico Por la Paz Pococi" <noreply@example.com>',
        to,
        subject: 'Código de acceso',
        html,
      });
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('No se pudo enviar el correo de acceso');
    }
  }

  private getEmailTemplate(
    title: string,
    message: string,
    highlight?: string,
    actionLink?: string,
    actionText?: string,
    footer?: string,
  ): string {
    return `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9; color: #333;">
  <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
    Centro Cívico por la Paz Pococí
  </h2>

  <p style="font-size: 16px; line-height: 1.5;">
    ${message}
  </p>

  ${
    highlight
      ? `
  <div style="text-align: center; margin: 20px 0;">
    <span style="display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 4px; background-color: #2c3e50; color: #fff; padding: 12px 20px; border-radius: 6px;">
      ${highlight}
    </span>
  </div>`
      : ''
  }

  ${
    actionLink && actionText
      ? `
  <div style="text-align: center; margin: 25px 0;">
    <a href="${actionLink}" 
       style="background-color: #e74c3c; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
       ${actionText}
    </a>
  </div>`
      : ''
  }

  <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
    ${footer || 'Este mensaje fue generado automáticamente, por favor no responda a este correo.'}
  </p>
</div>`;
  }
}
