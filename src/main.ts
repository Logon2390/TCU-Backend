import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Server } from 'http';

let server: Server;

export default async function handler(req: any, res: any) {
  if (!server) {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());

    app.enableCors({
      origin: ['http://localhost:5173', 'https://tcu-frontend-iota.vercel.app'],
      credentials: true,
    });

    await app.init();
    server = app.getHttpAdapter().getInstance();
  }

  server.emit('request', req, res);
}
