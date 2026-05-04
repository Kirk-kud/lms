import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const defaultAllowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.onrender\.com$/i,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^https:\/\/[a-z0-9-]+\.web\.app$/i,
  /^https:\/\/[a-z0-9-]+\.firebaseapp\.com$/i,
];

type CorsCallback = (err: Error | null, allow?: boolean) => void;

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rawCors = process.env.CORS_ORIGINS ?? '';
  const allowedOrigins = rawCors
    .split(',')
    .map((s) => s.trim())
    .map(normalizeOrigin)
    .filter(Boolean);

  const corsOriginOption: true | string[] =
    allowedOrigins.length > 0
      ? allowedOrigins
      : process.env.NODE_ENV === 'production'
        ? true
        : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsCallback): void => {
      // allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = normalizeOrigin(origin);
      if (corsOriginOption === true) {
        callback(null, true);
        return;
      }
      if (
        Array.isArray(corsOriginOption) &&
        (corsOriginOption.includes(normalizedOrigin) ||
          defaultAllowedOriginPatterns.some((pattern) =>
            pattern.test(normalizedOrigin),
          ))
      ) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
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
