import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rawCors = process.env.CORS_ORIGINS ?? '';
  const allowedOrigins = rawCors
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const corsOriginOption: true | string[] =
    allowedOrigins.length > 0 ? allowedOrigins : (process.env.NODE_ENV === 'production' ? true : ['http://localhost:3000']);

  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);
      if (corsOriginOption === true) return callback(null, true);
      if (Array.isArray(corsOriginOption) && corsOriginOption.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept,X-Requested-With',
    exposedHeaders: 'Content-Disposition',
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
